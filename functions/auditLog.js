// functions/auditLog.js
// ──────────────────────────────────────────────────────────────────
// Server-side audit trail for sensitive actions. Writes always go
// through the Admin SDK (bypasses firestore.rules — the auditLog
// collection is default-denied from the client side).
//
// What to log:
//   - KYC verifications: aadhaar / digilocker / pan / bank
//   - Seller onboarding milestones
//   - Any future admin action
//
// What NOT to log (privacy hygiene):
//   - Full PAN, Aadhaar, or bank numbers
//   - Passwords or tokens
//   - Session IDs
// Log the MASKED versions if you must reference the identity used.
//
// Storage cost is negligible for a launch-scale product (each entry
// is ~200 bytes; 100 events/day = 20KB/day = ~$0/month).
// ──────────────────────────────────────────────────────────────────

import { firebaseAdmin } from "./firebaseAdmin.js";

/**
 * Best-effort audit write. Never blocks the caller — if the log
 * fails, we swallow the error rather than 500ing a real user action
 * because our monitoring couldn't record it.
 *
 * @param {import('express').Request} req  Express request; we read ip / ua.
 * @param {string} action   Snake_case action id (e.g. "pan_verified").
 * @param {object} details  Extra structured fields. Do NOT include PII.
 */
export async function logAudit(req, action, details = {}) {
  try {
    const admin = firebaseAdmin();
    const db = admin.firestore();

    // Client IP is trustworthy because we run app.set("trust proxy", 1)
    // in functions/index.js, so req.ip resolves to the real client
    // rather than the Cloud Run proxy.
    //
    // `expireAt` is read by the Firestore TTL policy configured on
    // auditLog.expireAt (Firebase Console → Firestore → Time to live).
    // Entries auto-delete ~24h after this timestamp. 90 days is the
    // retention target — long enough for forensic sweeps, short enough
    // to satisfy "don't retain personal data longer than needed".
    const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
    const expireAt = admin.firestore.Timestamp.fromMillis(Date.now() + NINETY_DAYS_MS);

    const entry = {
      at: admin.firestore.FieldValue.serverTimestamp(),
      expireAt,
      action,
      uid: req.user?.uid || null,
      ip: req.ip || null,
      ua: (req.headers["user-agent"] || "").slice(0, 512),
      // Prevent an accidentally huge object from bloating the log
      details: sanitize(details),
    };

    // Fire-and-forget — never block. Write goes to a subcollection under
    // the year+month so a single collection query on auditLog stays fast
    // when we start doing forensic sweeps.
    await db.collection("auditLog").add(entry);
  } catch (err) {
    // Audit failures are important but must NEVER fail a real user
    // action. Log to Cloud Function stdout for later diagnosis.
    console.warn("[audit] write failed", err?.message || err);
  }
}

/**
 * Best-effort deep clone that: (a) strips known-sensitive field names,
 * (b) truncates long strings, (c) caps object depth to 2. Keeps entries
 * small and prevents accidental PII leakage into the log.
 */
function sanitize(obj, depth = 0) {
  if (obj == null) return null;
  if (depth > 2) return "[truncated]";
  const t = typeof obj;
  if (t === "string") return obj.slice(0, 500);
  if (t === "number" || t === "boolean") return obj;
  if (Array.isArray(obj)) return obj.slice(0, 20).map((v) => sanitize(v, depth + 1));
  if (t === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      // Deny-list known-sensitive field names anywhere in the details.
      const lk = k.toLowerCase();
      if (
        /password|secret|token|jwt|authorization|cookie|ciphertext|fullpan|accountnumber|aadhaar$/i.test(lk)
      ) {
        out[k] = "[redacted]";
        continue;
      }
      out[k] = sanitize(v, depth + 1);
    }
    return out;
  }
  return String(obj).slice(0, 500);
}
