/**
 * Firebase Cloud Functions — Production API
 * Wraps the Express app from server/index.js. All /api/* routes preserved.
 * Region: asia-south1 (Mumbai) for low latency to Indian users.
 */

import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import aadhaarRouter from "./aadhaarRouter.js";
import analyticsRouter from "./analyticsRouter.js";
import profileRouter from "./profileRouter.js";
import digilockerRouter from "./digilockerRouter.js";
import bankRouter from "./bankRouter.js";
import panRouter from "./panRouter.js";
import authRouter from "./authRouter.js";
import { firebaseAdmin } from "./firebaseAdmin.js";

// Secrets must be declared so Firebase injects them into the runtime env.
const sandboxApiKey = defineSecret("SANDBOX_API_KEY");
const sandboxApiSecret = defineSecret("SANDBOX_API_SECRET");

const app = express();

/* ── Trust proxy ──────────────────────────────────────────────
   Cloud Run puts our function behind exactly one proxy hop (the Google
   Front End). Trust that single hop so req.ip resolves to the real
   client IP rather than the GFE. Also silences express-rate-limit's
   `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` validation error which was
   firing on every request. */
app.set("trust proxy", 1);

/* ── CORS ── */
const corsOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

/* ── Rate limiters ──────────────────────────────────────────────
   Two tiers:
     - GLOBAL (IP-based): protects against unauthenticated abuse. Wide
       window so it doesn't kick in on legitimate bursty use.
     - PER-USER (uid-based): stops one compromised token or one buggy
       client tab from burning the shared IP quota for everyone behind
       the same NAT / VPN / office network. Applied after body parsing
       but before routers so 401s from expired tokens still get counted.
*/
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

/* Cheap uid extraction — decode (but do NOT verify) the JWT payload to
 * get the user_id claim. If the token is invalid, we fall back to IP so
 * the request still gets rate-limited. authGuard in each router runs
 * afterwards and rejects the invalid token proper. */
function keyFromAuthHeader(req) {
  const raw = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!raw) return null;
  try {
    const parts = raw.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
    );
    return payload.user_id || payload.sub || payload.uid || null;
  } catch {
    return null;
  }
}

const perUserLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,             // 5 req/sec average per uid, burst tolerated
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const uid = keyFromAuthHeader(req);
    return uid ? `uid:${uid}` : `ip:${req.ip}`;
  },
  skip: (req) =>
    req.path === "/health" || req.path === "/api/health",
});
app.use(perUserLimiter);

/* ── App Check ──────────────────────────────────────────────────
   Mode is controlled by env var APP_CHECK_MODE:

     "off"        — skip verification entirely (rollback lever if the
                    client stops sending valid tokens).
     "monitor"    — verify every token, log misses/failures, but
                    always call next(). Default. Use while rolling out
                    so we can see traffic in the Console without
                    breaking real users.
     "enforce"    — reject requests with missing or invalid tokens
                    with HTTP 401. Flip once monitor logs look clean.

   Health checks (/health, /api/health) always bypass App Check so
   uptime probes work regardless of mode.
*/
const APP_CHECK_MODE = (process.env.APP_CHECK_MODE || "monitor").toLowerCase();

async function appCheckGuard(req, res, next) {
  // Uptime probes shouldn't need attestation.
  if (req.path === "/health" || req.path === "/api/health") return next();
  if (APP_CHECK_MODE === "off") return next();

  const token = req.header("X-Firebase-AppCheck");

  if (!token) {
    if (APP_CHECK_MODE === "enforce") {
      return res.status(401).json({ error: "APP_CHECK_REQUIRED" });
    }
    console.warn(`[appcheck] missing token on ${req.method} ${req.path}`);
    return next();
  }

  try {
    await firebaseAdmin().appCheck().verifyToken(token);
    return next();
  } catch (err) {
    if (APP_CHECK_MODE === "enforce") {
      console.warn(`[appcheck] rejected ${req.method} ${req.path}: ${err?.message || err}`);
      return res.status(401).json({ error: "APP_CHECK_INVALID" });
    }
    console.warn(`[appcheck] invalid token on ${req.method} ${req.path}: ${err?.message || err}`);
    return next();
  }
}
app.use(appCheckGuard);

/* ── Routes ──
   /api prefix matches frontend calls: ${BASE}/api/aadhaar, etc.
   Both /health and /api/health work for monitoring. */
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/aadhaar", aadhaarRouter);
app.use("/api/digilocker", digilockerRouter);
app.use("/api/bank", bankRouter);
app.use("/api/pan", panRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/profile", profileRouter);
app.use("/api/auth", authRouter);

/* ── Error handler ── */
app.use((err, _req, res, _next) => {
  console.error("[api] unhandled", err?.message || err);
  res.status(500).json({ error: "INTERNAL_ERROR" });
});

/* ── Export as Cloud Function ──
   invoker: "public" → allows unauthenticated requests (this is a public API
   protected by our own auth middleware via verifyIdToken on protected routes).
   Without this, Cloud Run returns 403 Forbidden to all callers.

   cors is intentionally omitted here — the express `cors()` middleware above
   handles it. Setting cors: true here makes Firebase send
   `Access-Control-Allow-Origin: *`, which the browser rejects on credentialed
   requests (frontend sends `credentials: "include"`). */
export const api = onRequest(
  {
    region: "asia-south1",
    maxInstances: 10,
    invoker: "public",
    secrets: [sandboxApiKey, sandboxApiSecret],
  },
  app
);
