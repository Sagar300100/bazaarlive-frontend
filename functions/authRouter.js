// functions/authRouter.js
// ──────────────────────────────────────────────────────────────
// Two lightweight session endpoints the frontend has always been
// calling but that never existed on the server:
//
//   GET  /api/auth/me
//     Returns the caller's identity as the server sees it. Useful for
//     the client to sanity-check its cached auth state after a route
//     load. Frontend caller: services/api.ts → sessionMe().
//
//   POST /api/auth/revoke-sessions
//     Revokes ALL refresh tokens for the caller — every other browser
//     tab / device the caller is signed in on will be forced to
//     re-authenticate the next time its ID token needs refreshing
//     (Firebase ID tokens are cached for ~1 hour, refresh tokens
//     become invalid immediately). Frontend caller: services/api.ts
//     → revokeAllSessions().
//
// Both routes require a valid Firebase ID token via authGuard.
// ──────────────────────────────────────────────────────────────

import express from "express";
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
    console.warn("[auth] verify failed", err?.message || err);
    return res.status(401).json({ error: "AUTH_INVALID" });
  }
}

// GET /api/auth/me
router.get("/me", authGuard, (req, res) => {
  const u = req.user || {};
  // Custom claims live at the top of the decoded token. Copy only
  // known-safe fields; we don't want to leak Firebase-internal fields.
  const role = u.role || null;
  const claims = {};
  for (const [k, v] of Object.entries(u)) {
    if (
      k === "aud" || k === "auth_time" || k === "exp" || k === "iat" ||
      k === "iss" || k === "sub" || k === "uid" || k === "user_id" ||
      k === "firebase" || k === "email" || k === "email_verified" ||
      k === "name" || k === "picture"
    ) continue;
    claims[k] = v;
  }
  return res.json({
    isAuthenticated: true,
    uid: u.uid || u.user_id || null,
    email: u.email || null,
    emailVerified: !!u.email_verified,
    role,
    claims,
  });
});

// POST /api/auth/revoke-sessions
// Gated behind requireRecentAuth: if a session is compromised, an attacker
// who reads the cached ID token from a stale tab still can't self-lock the
// legitimate user out without a fresh password prompt.
router.post("/revoke-sessions", authGuard, requireRecentAuth(), async (req, res) => {
  try {
    const admin = firebaseAdmin();
    await admin.auth().revokeRefreshTokens(req.user.uid);

    logAudit(req, "sessions_revoked", {});

    return res.json({ ok: true });
  } catch (err) {
    console.error("[auth] revoke-sessions failed", err?.message || err);
    return res.status(500).json({ error: "REVOKE_FAILED", message: "Could not revoke sessions. Please retry." });
  }
});

export default router;
