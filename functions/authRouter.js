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
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import crypto from "crypto";
import { verifyIdToken, firebaseAdmin } from "./firebaseAdmin.js";
import { logAudit } from "./auditLog.js";
import { requireRecentAuth } from "./recentAuthGuard.js";

// Coarse, non-reversible device fingerprint from the User-Agent. Not a security
// boundary (UAs are spoofable) — just a stable-enough key to notice a sign-in
// from a device we've never seen for this account.
function deviceHash(ua) {
  return crypto.createHash("sha256").update(String(ua || "")).digest("hex").slice(0, 16);
}

// Human-friendly label for the device list / alerts. Order matters: Edge and
// Opera UAs also contain "Chrome"; Chrome UAs also contain "Safari".
function deviceLabel(ua) {
  const s = String(ua || "");
  const browser =
    /Edg\//.test(s) ? "Edge" :
    /OPR\/|Opera/.test(s) ? "Opera" :
    /Chrome\//.test(s) ? "Chrome" :
    /Firefox\//.test(s) ? "Firefox" :
    /Safari\//.test(s) ? "Safari" : "browser";
  const os =
    /Windows/.test(s) ? "Windows" :
    /Android/.test(s) ? "Android" :
    /iPhone|iPad|iPod|iOS/.test(s) ? "iOS" :
    /Mac OS X|Macintosh/.test(s) ? "macOS" :
    /Linux/.test(s) ? "Linux" : "device";
  return `${browser} on ${os}`;
}

// Session revocation is a destructive, user-visible action. Cap it hard
// per-uid so a compromised session can't be used to lock the legitimate
// user out via repeated revocations while brute-forcing the recent-auth
// prompt on the client. Combined with requireRecentAuth() this leaves no
// meaningful attack surface.
const revokeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${req.user?.uid || "anon"}`,
});

// Called once per sign-in. Generous cap (retries, multiple tabs) but bounded.
const sessionCheckLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${req.user?.uid || "anon"}`,
});

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
router.post("/revoke-sessions", authGuard, requireRecentAuth(), revokeLimiter, async (req, res) => {
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

// POST /api/auth/session-check
// Called by the client right after a successful sign-in. Records the device on
// the user's knownDevices list and flags a sign-in from a device we've never
// seen for this account (login-anomaly detection). Best-effort: never blocks
// login — on any failure it returns { newDevice:false } with 200.
router.post("/session-check", authGuard, sessionCheckLimiter, async (req, res) => {
  const admin = firebaseAdmin();
  const uid = req.user.uid;
  const ua = String(req.headers["user-agent"] || "").slice(0, 400);
  const h = deviceHash(ua);
  const label = deviceLabel(ua);
  const ref = admin.firestore().doc(`users/${uid}`);

  try {
    // NOTE: serverTimestamp() is not allowed inside array elements, so device
    // timestamps use Timestamp.now() (the function's clock).
    const now = admin.firestore.Timestamp.now();
    const result = await admin.firestore().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.data() || {};
      const devices = Array.isArray(data.knownDevices) ? data.knownDevices.slice() : [];
      const existing = devices.find((d) => d && d.h === h);
      const isFirstEver = devices.length === 0;
      const isNewDevice = !existing && !isFirstEver;

      let updated;
      if (existing) {
        existing.lastSeen = now;
        updated = devices;
      } else {
        updated = [...devices, { h, label, firstSeen: now, lastSeen: now }];
      }
      // Keep only the 10 most-recently-seen devices.
      updated.sort((a, b) => (b?.lastSeen?.toMillis?.() || 0) - (a?.lastSeen?.toMillis?.() || 0));
      updated = updated.slice(0, 10);

      tx.set(ref, { knownDevices: updated }, { merge: true });
      return { isNewDevice, isFirstEver, label };
    });

    if (result.isNewDevice) {
      // Surfaces to the founder via the auditLog → Cloud Monitoring alerts.
      logAudit(req, "login_new_device", { deviceLabel: result.label });
    }

    return res.json({
      newDevice: result.isNewDevice,
      firstDevice: result.isFirstEver,
      deviceLabel: result.label,
    });
  } catch (err) {
    console.error("[auth] session-check failed", err?.message || err);
    // Never block sign-in on an anomaly-check failure.
    return res.status(200).json({ newDevice: false });
  }
});

export default router;
