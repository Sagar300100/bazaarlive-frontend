// functions/kycQuota.js
// ──────────────────────────────────────────────────────────────
// Denial-of-wallet guard for paid KYC (Sandbox.co.in) calls.
//
// Every Sandbox verification call costs real money. The per-endpoint
// rate limits cap bursts, but they reset every hour — so a compromised
// account could still drip attempts indefinitely, or re-verify an
// already-verified field, and quietly drain the Sandbox wallet.
//
// guardKycAttempt() closes both holes, transactionally, before the paid
// request is made:
//   1. If the field is already verified → block (no paid re-verification;
//      Aadhaar/PAN are immutable, and a bank change is a support path).
//   2. If a per-account LIFETIME attempt cap is reached → block. Unlike a
//      rate limit, this never resets, so total spend per account is bounded.
//   3. Otherwise increment the per-field attempt counter and allow.
//
// Counter lives at users/{uid}.kycAttempts.<field>.
// ──────────────────────────────────────────────────────────────

import { firebaseAdmin } from "./firebaseAdmin.js";

// Generous enough that a real user fumbling OTPs / typos won't hit it,
// low enough to bound the blast radius of a compromised account.
const LIFETIME_CAP = 15;

function isVerified(data, field) {
  if (field === "aadhaar") return data?.aadhaarVerified === true;
  if (field === "pan") return data?.pan?.verified === true;
  if (field === "bank") return data?.bankAccount?.verified === true;
  return false;
}

/**
 * Call BEFORE a paid Sandbox request. Returns { ok: true } to proceed, or
 * { ok: false, status, error, message } to short-circuit the handler.
 * @param {string} uid    Firebase uid of the caller.
 * @param {"aadhaar"|"pan"|"bank"} field  Which KYC surface is being hit.
 */
export async function guardKycAttempt(uid, field) {
  const db = firebaseAdmin().firestore();
  const ref = db.doc(`users/${uid}`);
  try {
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.data() || {};

      if (isVerified(data, field)) {
        return {
          ok: false, status: 409, error: "ALREADY_VERIFIED",
          message: "This is already verified on your account. Contact support if you need to change it.",
        };
      }

      const current = Number(data?.kycAttempts?.[field] || 0);
      if (current >= LIFETIME_CAP) {
        return {
          ok: false, status: 429, error: "KYC_ATTEMPTS_EXCEEDED",
          message: "Too many verification attempts on this account. Please contact support.",
        };
      }

      tx.set(ref, { kycAttempts: { [field]: current + 1 } }, { merge: true });
      return { ok: true };
    });
  } catch (err) {
    console.error("[kycQuota] guard failed", err?.message || err);
    // Money is at stake, so fail closed — but softly, so a transient
    // Firestore hiccup doesn't permanently wedge a legitimate user.
    return {
      ok: false, status: 503, error: "QUOTA_CHECK_FAILED",
      message: "Could not check your verification quota. Please retry shortly.",
    };
  }
}
