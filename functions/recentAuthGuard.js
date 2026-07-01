// functions/recentAuthGuard.js
// ──────────────────────────────────────────────────────────────
// Middleware factory: reject requests where the caller's Firebase
// ID token was minted more than `maxAgeSeconds` ago.
//
// Chain after `authGuard` so it can read `req.user.auth_time`, which
// Firebase populates with the UNIX timestamp of the caller's most
// recent password (or provider) authentication.
//
// Use for sensitive actions where a long-lived session shouldn't be
// enough on its own — e.g. session revocation, payout initiation,
// bank-account changes, KYC re-verification, account deletion.
//
// Default freshness window: 5 minutes.
//
// Client remedy on 403 RECENT_AUTH_REQUIRED:
//   1. Show a password re-entry modal
//   2. Call reauthenticateWithCredential(user, cred) from firebase/auth
//   3. Force-refresh the ID token: await user.getIdToken(true)
//   4. Retry the failed call
//
// Example:
//   router.post("/revoke-sessions", authGuard, requireRecentAuth(), ...);
//   router.post("/payout", authGuard, requireRecentAuth(120), ...);  // 2 min
// ──────────────────────────────────────────────────────────────

export function requireRecentAuth(maxAgeSeconds = 5 * 60) {
  return function recentAuthGuard(req, res, next) {
    const authTime = Number(req.user?.auth_time);
    if (!authTime) {
      return res.status(401).json({
        error: "AUTH_INVALID",
        message: "Missing auth_time claim on token.",
      });
    }
    const nowSeconds = Math.floor(Date.now() / 1000);
    const ageSeconds = nowSeconds - authTime;
    if (ageSeconds > maxAgeSeconds) {
      return res.status(403).json({
        error: "RECENT_AUTH_REQUIRED",
        message: "Please re-enter your password to continue.",
        maxAgeSeconds,
        ageSeconds,
      });
    }
    return next();
  };
}
