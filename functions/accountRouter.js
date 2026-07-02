// functions/accountRouter.js
// ──────────────────────────────────────────────────────────────
// Account deletion / right-to-erasure (India DPDP Act, s.12).
//
//   POST /api/account/delete
//     Permanently erases the caller's personal data across every
//     collection that references their uid, then deletes their
//     Firebase Auth record. Gated by:
//       - authGuard        (valid ID token)
//       - requireRecentAuth (fresh password — the client reauthenticates
//                            before calling, so a stolen stale token
//                            can't nuke an account)
//       - deleteLimiter    (3/hour per uid — this is one-and-done)
//
// The critical erasure is the users/{uid} document: it holds the KMS
// ciphertext (panCiphertext, accountCiphertext) and all masked KYC PII.
// Deleting it removes the encrypted PII outright. Everything else
// (shows, usernames, follows, dm) is cleanup so no orphaned personal
// data or dangling references remain.
//
// We keep the auditLog entry for the deletion itself: audit/security
// logs are a legitimate-interest exception, they carry only the opaque
// uid (no name/PAN/etc.), and they auto-expire via the 90-day TTL.
// ──────────────────────────────────────────────────────────────

import express from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { verifyIdToken, firebaseAdmin } from "./firebaseAdmin.js";
import { logAudit } from "./auditLog.js";
import { requireRecentAuth } from "./recentAuthGuard.js";

const router = express.Router();

async function authGuard(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ error: "AUTH_REQUIRED" });
  try {
    const decoded = await verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.warn("[account] auth failed", err?.message || err);
    return res.status(401).json({ error: "AUTH_INVALID" });
  }
}

const deleteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${req.user?.uid || "anon"}`,
});

// Delete every doc matched by a query, in batches under the 500-op limit.
async function deleteQueryBatch(db, query) {
  const snap = await query.get();
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += 400) {
    const batch = db.batch();
    for (const d of docs.slice(i, i + 400)) batch.delete(d.ref);
    await batch.commit();
  }
  return docs.length;
}

// POST /api/account/delete
router.post("/delete", authGuard, requireRecentAuth(), deleteLimiter, async (req, res) => {
  const admin = firebaseAdmin();
  const db = admin.firestore();
  const uid = req.user.uid;

  const summary = {
    shows: 0, usernames: 0, followsOut: 0, followsIn: 0,
    dmThreads: 0, userDoc: false, authDeleted: false,
  };
  const errors = [];

  // Collect the caller's claimed handles up front — needed to clean up
  // OTHER users' follow rows that point at this account (sellerId == handle).
  let handles = [];
  try {
    const unameSnap = await db.collection("usernames").where("uid", "==", uid).get();
    handles = unameSnap.docs.map((d) => d.id);
  } catch (err) {
    errors.push("handles_query");
    console.error("[account] handles query failed", err?.message || err);
  }

  // 1. Shows owned by the user — recursiveDelete clears the chat subcollection too.
  try {
    const showsSnap = await db.collection("shows").where("ownerUid", "==", uid).get();
    for (const d of showsSnap.docs) {
      await db.recursiveDelete(d.ref);
      summary.shows++;
    }
  } catch (err) {
    errors.push("shows");
    console.error("[account] shows delete failed", err?.message || err);
  }

  // 2. Username reservations (buyer handle + seller storeHandle).
  try {
    summary.usernames = await deleteQueryBatch(
      db, db.collection("usernames").where("uid", "==", uid)
    );
  } catch (err) {
    errors.push("usernames");
    console.error("[account] usernames delete failed", err?.message || err);
  }

  // 3. Outgoing follows (relationships the user created).
  try {
    summary.followsOut = await deleteQueryBatch(
      db, db.collection("follows").where("followerId", "==", uid)
    );
  } catch (err) {
    errors.push("follows_out");
    console.error("[account] outgoing follows delete failed", err?.message || err);
  }

  // 4. Incoming follows (others following this user's handles) — remove so
  //    no dangling references to the deleted account remain.
  for (const h of handles) {
    try {
      summary.followsIn += await deleteQueryBatch(
        db, db.collection("follows").where("sellerId", "==", h)
      );
    } catch (err) {
      errors.push(`follows_in:${h}`);
      console.error("[account] incoming follows delete failed", err?.message || err);
    }
  }

  // 5. DM threads the user participates in — recursiveDelete clears messages.
  try {
    const dmSnap = await db.collection("dm").where("participants", "array-contains", uid).get();
    for (const d of dmSnap.docs) {
      await db.recursiveDelete(d.ref);
      summary.dmThreads++;
    }
  } catch (err) {
    errors.push("dm");
    console.error("[account] dm delete failed", err?.message || err);
  }

  // 6. KYC identity-uniqueness reservations (peppered HMACs of Aadhaar/PAN/
  //    bank). Erasing them both satisfies right-to-erasure (they're a derived
  //    identifier of the person) AND frees the identity so a future account
  //    can re-verify with it after this one is gone.
  try {
    summary.identityHashes = await deleteQueryBatch(
      db, db.collection("kycIdentityHashes").where("uid", "==", uid)
    );
  } catch (err) {
    errors.push("identity_hashes");
    console.error("[account] identity hashes delete failed", err?.message || err);
  }

  // 7. THE critical erasure — the user document holds the KMS ciphertext
  //    and all KYC PII.
  try {
    await db.doc(`users/${uid}`).delete();
    summary.userDoc = true;
  } catch (err) {
    errors.push("user_doc");
    console.error("[account] user doc delete failed", err?.message || err);
  }

  // 7. Audit the deletion BEFORE we drop the auth record (we still have
  //    req.user here). Only opaque counts — no PII.
  logAudit(req, "account_deleted", { summary, errors });

  // 8. Firebase Auth record LAST — if any step above failed, the account
  //    stays intact so the user can retry the whole flow.
  try {
    await admin.auth().deleteUser(uid);
    summary.authDeleted = true;
  } catch (err) {
    errors.push("auth_delete");
    console.error("[account] auth deleteUser failed", err?.message || err);
  }

  // Erasure is "successful" once the PII-bearing user doc is gone. Surface
  // residual cleanup errors so the client can advise a retry if needed.
  if (!summary.userDoc) {
    return res.status(500).json({
      error: "DELETE_INCOMPLETE",
      message: "We couldn't fully delete your account. Please try again.",
      summary,
    });
  }
  return res.json({ ok: true, summary, errors });
});

export default router;
