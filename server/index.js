import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import aadhaarRouter from "./aadhaarRouter.js";
import analyticsRouter from "./analyticsRouter.js";
import profileRouter from "./profileRouter.js";

const app = express();
const port = process.env.PORT || 3001;
const corsOrigins =
  process.env.CORS_ORIGINS?.split(",").map((o) => o.trim()) || null; // null means allow all below

app.use(
  cors({
    origin: corsOrigins || ((origin, callback) => callback(null, true)),
    credentials: true,
  })
);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: "1mb" }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/aadhaar", aadhaarRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/profile", profileRouter);

app.use((err, _req, res, _next) => {
  // Fallback error handler for unexpected errors.
  console.error("[api] unhandled", err?.message || err);
  res.status(500).json({ error: "INTERNAL_ERROR" });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
