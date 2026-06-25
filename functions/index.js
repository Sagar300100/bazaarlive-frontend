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

// Secrets must be declared so Firebase injects them into the runtime env.
const sandboxApiKey = defineSecret("SANDBOX_API_KEY");
const sandboxApiSecret = defineSecret("SANDBOX_API_SECRET");

const app = express();

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

/* ── Rate limiter ── */
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

/* ── Routes ──
   /api prefix matches frontend calls: ${BASE}/api/aadhaar, etc.
   Both /health and /api/health work for monitoring. */
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/aadhaar", aadhaarRouter);
app.use("/api/digilocker", digilockerRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/profile", profileRouter);

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
