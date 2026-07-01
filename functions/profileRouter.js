import express from "express";
import { verifyIdToken, firebaseAdmin } from "./firebaseAdmin.js";
import { logAudit } from "./auditLog.js";

const router = express.Router();

// Lowercase, must start with a letter, then letters/digits/underscore.
// 3-20 chars. We reject ".", "-", spaces, emoji to keep handles URL-safe.
const USERNAME_RE = /^[a-z][a-z0-9_]{2,19}$/;

// A small list of usernames sellers should never be able to claim — top-level
// routes, "official" sounding handles, etc. Keep tight; expand as needed.
const RESERVED_USERNAMES = new Set([
  "admin", "anynall", "anyandall", "any", "all", "support", "help", "official",
  "team", "moderator", "mod", "root", "system", "api", "www", "mail", "email",
  "shop", "seller", "buyer", "auction", "live", "show", "shows",
]);
const REFERRAL_BASE = process.env.REFERRAL_BASE || "https://anynall.com/invite";

// Profile shape (nested under users/{uid}.profile.*):
//   handle : display name shown on shows/products  (was top-level, moved
//            under `profile` so it doesn't collide with sellerOnboarding.storeHandle)
//   bio    : short seller-facing description
//   avatar : url string (empty until upload is implemented)
// Top-level on users/{uid}:
//   username     : URL-safe handle (claimed atomically via /claim-username)
//   referralCode : lazy-generated on first read
//
// Previous rev used fs.writeFileSync on server/profiles.json — this crashes
// in Cloud Functions because the filesystem is read-only outside /tmp.

function generateReferralCode(uid) {
  const rand = Math.random().toString(36).slice(2, 8);
  const suffix = uid ? String(uid).slice(-4) : "";
  return `${rand}${suffix}`;
}

const DEFAULT_PROFILE = Object.freeze({
  handle: "Your Name",
  bio: "Tell buyers what you sell and why they should follow.",
  avatar: "",
});

/**
 * Read (and lazily seed) the user's profile.
 * Returns { username, handle, bio, avatar, referralCode } — all strings.
 * If the user document doesn't exist yet, we create it with defaults.
 * If referralCode is missing, we generate + persist one on the fly.
 */
async function readOrSeedProfile(uid) {
  const admin = firebaseAdmin();
  const db = admin.firestore();
  const ref = db.doc(`users/${uid}`);
  const snap = await ref.get();
  const data = snap.data() || {};

  const nested = data.profile || {};
  let referralCode = data.referralCode;

  // Lazy referral-code generation: only touch Firestore if we actually
  // need to create one (keeps reads cheap on the hot path).
  if (!referralCode) {
    referralCode = generateReferralCode(uid);
    await ref.set(
      { referralCode, referralCreatedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
  }

  return {
    username: data.username || "yourshop",
    handle: nested.handle || DEFAULT_PROFILE.handle,
    bio: nested.bio ?? DEFAULT_PROFILE.bio,
    avatar: nested.avatar || DEFAULT_PROFILE.avatar,
    referralCode,
  };
}

async function authGuard(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return res.status(401).json({ error: "AUTH_REQUIRED" });
  try {
    const decoded = await verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.warn("[profile] verify failed", err?.message || err);
    return res.status(401).json({ error: "AUTH_INVALID" });
  }
}

// GET /api/profile/check-username?u=foo
// Public — used during signup before the user has an auth token.
// Best-effort availability check; the atomic claim still happens server-side.
router.get("/check-username", async (req, res) => {
  const raw = String(req.query?.u || "").toLowerCase().trim();
  if (!USERNAME_RE.test(raw)) {
    return res.json({ available: false, reason: "INVALID_FORMAT" });
  }
  if (RESERVED_USERNAMES.has(raw)) {
    return res.json({ available: false, reason: "RESERVED" });
  }
  try {
    const db = firebaseAdmin().firestore();
    const doc = await db.doc(`usernames/${raw}`).get();
    return res.json({ available: !doc.exists });
  } catch (err) {
    console.error("[profile] check-username failed", err?.message || err);
    return res.status(500).json({ available: false, reason: "CHECK_FAILED" });
  }
});

// POST /api/profile/claim-username  { username }
// Authenticated. Atomically reserves the username in a Firestore transaction —
// prevents two users from claiming the same handle in a race.
router.post("/claim-username", authGuard, async (req, res) => {
  const raw = String(req.body?.username || "").toLowerCase().trim();
  if (!USERNAME_RE.test(raw)) {
    return res.status(400).json({
      error: "INVALID_FORMAT",
      message: "Username must be 3-20 chars, letters/digits/underscore, starting with a letter.",
    });
  }
  if (RESERVED_USERNAMES.has(raw)) {
    return res.status(400).json({ error: "RESERVED", message: "That username is reserved." });
  }

  const admin = firebaseAdmin();
  const db = admin.firestore();
  const usernameRef = db.doc(`usernames/${raw}`);
  const userRef = db.doc(`users/${req.user.uid}`);

  try {
    await db.runTransaction(async (tx) => {
      const taken = await tx.get(usernameRef);
      if (taken.exists && taken.data()?.uid !== req.user.uid) {
        const e = new Error("USERNAME_TAKEN");
        e.code = "USERNAME_TAKEN";
        throw e;
      }
      tx.set(usernameRef, {
        uid: req.user.uid,
        claimedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      tx.set(
        userRef,
        {
          username: raw,
          displayName: req.user.name || req.user.displayName || "",
          email: req.user.email || "",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });
    return res.json({ ok: true, username: raw });
  } catch (err) {
    if (err?.code === "USERNAME_TAKEN") {
      return res.status(409).json({ error: "USERNAME_TAKEN", message: "Username already taken." });
    }
    console.error("[profile] claim-username failed", err?.message || err);
    return res.status(500).json({ error: "CLAIM_FAILED", message: "Could not claim username." });
  }
});

// GET /api/profile — reads (and lazily seeds) the caller's profile
router.get("/", authGuard, async (req, res) => {
  try {
    const profile = await readOrSeedProfile(req.user.uid);
    return res.json(profile);
  } catch (err) {
    console.error("[profile] GET / failed", err?.message || err);
    return res.status(500).json({ error: "READ_FAILED" });
  }
});

// PUT /api/profile — updates the caller's display fields.
// NOTE: `username` (the URL-safe handle) is intentionally NOT mutable here.
// Renaming a username requires an atomic reservation, which /claim-username
// already implements. This endpoint accepts and ignores a `username` field
// in the body for backward-compat with older clients.
router.put("/", authGuard, async (req, res) => {
  const { handle, bio, avatar } = req.body || {};
  if (!handle || typeof handle !== "string") {
    return res.status(400).json({ error: "HANDLE_REQUIRED" });
  }
  const cleanHandle = handle.trim().slice(0, 60);
  const cleanBio = typeof bio === "string" ? bio.trim().slice(0, 280) : "";
  const cleanAvatar = typeof avatar === "string" ? avatar.trim().slice(0, 500) : "";

  try {
    const admin = firebaseAdmin();
    const db = admin.firestore();
    await db.doc(`users/${req.user.uid}`).set(
      {
        profile: {
          handle: cleanHandle,
          bio: cleanBio,
          avatar: cleanAvatar,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    );
    const merged = await readOrSeedProfile(req.user.uid);
    return res.json(merged);
  } catch (err) {
    console.error("[profile] PUT / failed", err?.message || err);
    return res.status(500).json({ error: "WRITE_FAILED" });
  }
});

// Defensive read: prefer nested `sellerOnboarding.xxx` (correct), fall back
// to flat `"sellerOnboarding.xxx"` literal-key fields that earlier buggy
// writes produced. This lets users who completed steps before the fix
// keep their progress.
function readSo(data, field) {
  const so = data?.sellerOnboarding || {};
  if (so[field] !== undefined && so[field] !== null && so[field] !== "") return so[field];
  const flat = data?.[`sellerOnboarding.${field}`];
  if (flat !== undefined && flat !== null && flat !== "") return flat;
  return undefined;
}

// GET /api/profile/seller-onboarding
// Returns the seller's current onboarding progress so the wizard can pick
// up where they left off if they close the tab mid-flow.
router.get("/seller-onboarding", authGuard, async (req, res) => {
  try {
    const db = firebaseAdmin().firestore();
    const doc = await db.doc(`users/${req.user.uid}`).get();
    const data = doc.data() || {};
    const storeName = readSo(data, "storeName") || "";
    const storeHandle = readSo(data, "storeHandle") || "";
    return res.json({
      storeSetupComplete: !!storeName && !!storeHandle,
      aadhaarVerified: !!data.aadhaarVerified,
      panVerified: !!readSo(data, "panVerified"),
      bankVerified: !!readSo(data, "bankVerified"),
      completedAt: readSo(data, "completedAt") || null,
      storeName,
      storeHandle,
    });
  } catch (err) {
    console.error("[profile] seller-onboarding read failed", err?.message || err);
    return res.status(500).json({ error: "READ_FAILED" });
  }
});

// POST /api/profile/seller-onboarding/store  { storeName, storeHandle }
// Saves step 1 of the wizard. storeHandle is unique across sellers and
// claimed via the same usernames/ collection used for buyer handles.
router.post("/seller-onboarding/store", authGuard, async (req, res) => {
  const storeName = String(req.body?.storeName || "").trim();
  const storeHandle = String(req.body?.storeHandle || "").toLowerCase().trim();

  if (storeName.length < 2 || storeName.length > 60) {
    return res.status(400).json({ error: "INVALID_NAME", message: "Store name must be 2-60 chars." });
  }
  if (!USERNAME_RE.test(storeHandle)) {
    return res.status(400).json({
      error: "INVALID_HANDLE",
      message: "Handle must be 3-20 chars, letters/digits/underscore, starting with a letter.",
    });
  }
  if (RESERVED_USERNAMES.has(storeHandle)) {
    return res.status(400).json({ error: "RESERVED", message: "That handle is reserved." });
  }

  const admin = firebaseAdmin();
  const db = admin.firestore();
  const handleRef = db.doc(`usernames/${storeHandle}`);
  const userRef = db.doc(`users/${req.user.uid}`);

  try {
    await db.runTransaction(async (tx) => {
      const existing = await tx.get(handleRef);
      if (existing.exists && existing.data()?.uid !== req.user.uid) {
        const e = new Error("HANDLE_TAKEN");
        e.code = "HANDLE_TAKEN";
        throw e;
      }
      tx.set(handleRef, {
        uid: req.user.uid,
        kind: "seller",
        claimedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      // Use a proper nested object — set({merge:true}) stores dotted keys
      // as literal field names with a dot in them, which then can't be read
      // back as data.sellerOnboarding.storeName. With nested objects,
      // merge:true does a deep merge so existing sub-fields are preserved.
      tx.set(
        userRef,
        {
          sellerOnboarding: {
            storeName,
            storeHandle,
            storeSetupAt: admin.firestore.FieldValue.serverTimestamp(),
          },
        },
        { merge: true }
      );
    });
    return res.json({ ok: true, storeHandle });
  } catch (err) {
    if (err?.code === "HANDLE_TAKEN") {
      return res.status(409).json({ error: "HANDLE_TAKEN", message: "That handle is already taken." });
    }
    console.error("[profile] store setup failed", err?.message || err);
    return res.status(500).json({ error: "STORE_SETUP_FAILED" });
  }
});

// POST /api/profile/seller-onboarding/complete
// Final gate — only succeeds if all 3 prior steps are done. Marks the
// seller as fully onboarded so the seller dashboard can let them in.
router.post("/seller-onboarding/complete", authGuard, async (req, res) => {
  const admin = firebaseAdmin();
  const db = admin.firestore();
  const userRef = db.doc(`users/${req.user.uid}`);
  try {
    const doc = await userRef.get();
    const data = doc.data() || {};
    if (!readSo(data, "storeName") || !readSo(data, "storeHandle")) {
      return res.status(400).json({ error: "STORE_MISSING", message: "Complete store setup first." });
    }
    if (!data.aadhaarVerified) {
      return res.status(400).json({ error: "AADHAAR_MISSING", message: "Verify Aadhaar via DigiLocker first." });
    }
    if (!readSo(data, "panVerified")) {
      return res.status(400).json({ error: "PAN_MISSING", message: "Verify your PAN first." });
    }
    if (!readSo(data, "bankVerified")) {
      return res.status(400).json({ error: "BANK_MISSING", message: "Verify your bank account first." });
    }
    await userRef.set(
      {
        isSeller: true,
        sellerOnboarding: {
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    );
    logAudit(req, "seller_onboarded", {
      storeHandle: readSo(data, "storeHandle") || null,
    });
    return res.json({ ok: true });
  } catch (err) {
    console.error("[profile] seller-onboarding/complete failed", err?.message || err);
    return res.status(500).json({ error: "COMPLETE_FAILED" });
  }
});

// GET /api/profile/referral — returns { code, link }; lazily creates the code
router.get("/referral", authGuard, async (req, res) => {
  try {
    const profile = await readOrSeedProfile(req.user.uid);
    const link = `${REFERRAL_BASE.replace(/\/$/, "")}?ref=${profile.referralCode}`;
    return res.json({ code: profile.referralCode, link });
  } catch (err) {
    console.error("[profile] GET /referral failed", err?.message || err);
    return res.status(500).json({ error: "REFERRAL_READ_FAILED" });
  }
});

export default router;
