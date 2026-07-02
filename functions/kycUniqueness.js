// functions/kycUniqueness.js
// ──────────────────────────────────────────────────────────────
// Sybil / multi-accounting defence for KYC.
//
// Problem: nothing stopped one real person from KYC-verifying an unlimited
// number of seller accounts — set each account's displayName to their own
// Aadhaar name, run the (genuine) verification on each. That lets a single
// bad actor manufacture many "verified" sellers.
//
// Fix: bind each identity document (Aadhaar / PAN / bank account) to at most
// ONE account. On a successful verification we reserve a fingerprint of the
// number; a second account presenting the same number is rejected.
//
// Fingerprint = HMAC-SHA256(pepper, "type:normalizedNumber"). We use a keyed
// HMAC (not a bare hash) because the Aadhaar/PAN keyspaces are tiny (10^12 /
// ~10^9) and a plain SHA-256 would be trivially brute-forceable if the
// collection ever leaked. The pepper is a server-only secret (KYC_HASH_PEPPER),
// so the reservation docs are useless to anyone without it. The fingerprint is
// deterministic (same number → same hash) which is exactly what we need to
// detect reuse, and non-reversible so we never store the raw number here.
// ──────────────────────────────────────────────────────────────

import crypto from "crypto";
import { firebaseAdmin } from "./firebaseAdmin.js";

const PEPPER = process.env.KYC_HASH_PEPPER || "";

/**
 * Deterministic, non-reversible fingerprint of an identity number, namespaced
 * by document type. Returns null if the pepper is missing (caller must fail
 * closed) or the number is empty — we NEVER fall back to an unpeppered hash.
 */
export function identityHash(type, rawNumber) {
  const norm = String(rawNumber || "").replace(/\s+/g, "").toUpperCase();
  if (!norm || !PEPPER) return null;
  return crypto.createHmac("sha256", PEPPER).update(`${type}:${norm}`).digest("hex");
}

/**
 * Reserve an identity document for a single account, transactionally.
 *   - free (or already this uid's) → reserve/keep, return { ok: true }
 *   - held by a different uid       → { ok:false, status:409, IDENTITY_ALREADY_USED }
 *   - pepper missing / tx failure   → { ok:false, status:503, ... } (fail closed)
 *
 * Call AFTER the number is proven valid upstream but BEFORE persisting
 * verified=true, so a duplicate never gets marked verified.
 *
 * @param {"aadhaar"|"pan"|"bank"} type
 * @param {string} rawNumber  full identity number (never stored raw here)
 * @param {string} uid        the verifying account
 */
export async function reserveIdentity(type, rawNumber, uid) {
  const hash = identityHash(type, rawNumber);
  if (!hash) {
    return {
      ok: false,
      status: 503,
      error: "UNIQUENESS_CHECK_UNAVAILABLE",
      message: "Identity check is temporarily unavailable. Please try again shortly.",
    };
  }

  const admin = firebaseAdmin();
  const db = admin.firestore();
  const ref = db.doc(`kycIdentityHashes/${hash}`);

  try {
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists) {
        const owner = snap.data()?.uid;
        if (owner && owner !== uid) {
          return {
            ok: false,
            status: 409,
            error: "IDENTITY_ALREADY_USED",
            message: `This ${type.toUpperCase()} is already linked to another Any & All account. Each ${type.toUpperCase()} can verify only one account.`,
          };
        }
        return { ok: true }; // same user re-verifying — idempotent
      }
      tx.set(ref, {
        uid,
        type,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { ok: true };
    });
  } catch (err) {
    console.error(`[uniqueness] ${type} reserve failed`, err?.message || err);
    return {
      ok: false,
      status: 503,
      error: "UNIQUENESS_CHECK_FAILED",
      message: "Could not complete the identity check. Please try again.",
    };
  }
}
