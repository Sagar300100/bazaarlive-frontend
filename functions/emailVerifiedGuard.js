// functions/emailVerifiedGuard.js
// ──────────────────────────────────────────────────────────────
// Shared middleware: reject requests where the caller's Firebase
// Auth email hasn't been verified yet.
//
// Chain after `authGuard` so it can read the decoded ID token from
// req.user. Applies to KYC + seller-onboarding endpoints — anywhere
// an unverified account could burn paid quota (Sandbox.co.in), lock
// down handles, or promote itself into the seller role.
//
// Not applied to /api/auth/me, /api/profile GET/PUT, username claim,
// or analytics: those are used by the client while the user is still
// in the "verify your email" state.
//
// Client remedy on 403 EMAIL_NOT_VERIFIED:
//   1. Call user.sendEmailVerification() from firebase/auth
//   2. Once user clicks link, force-refresh the ID token so the new
//      `email_verified: true` claim shows up:
//        await user.getIdToken(true);
//   3. Retry the failed call.
// ──────────────────────────────────────────────────────────────

export function requireEmailVerified(req, res, next) {
  if (!req.user?.email_verified) {
    return res.status(403).json({
      error: "EMAIL_NOT_VERIFIED",
      message: "Verify your email address before continuing.",
    });
  }
  next();
}
