import express from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import axios from "axios";
import { verifyIdToken, firebaseAdmin } from "./firebaseAdmin.js";

const router = express.Router();

const apiKey = process.env.SANDBOX_API_KEY || "";
const apiSecret = process.env.SANDBOX_API_SECRET || "";
const sandboxBaseUrl =
  process.env.SANDBOX_BASE_URL?.replace(/\/$/, "") ||
  "https://api.sandbox.co.in";

// Where Meri Pehchaan should send the user after consent. Override via env in
// dev / staging. Must be a domain the user is browsing on, otherwise govt
// portal will block the redirect.
const publicAppUrl = (process.env.PUBLIC_APP_URL || "https://anynall.com").replace(/\/$/, "");

async function authGuard(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ error: "AUTH_REQUIRED" });
  try {
    const decoded = await verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.warn("[digilocker] auth failed", err?.message || err);
    return res.status(401).json({ error: "AUTH_INVALID" });
  }
}

// Token-based fuzzy name match (mirrors aadhaarRouter — extract if a 3rd
// flow ever needs it). Single-letter tokens match as initials.
function namesMatch(accountName, aadhaarName) {
  const tokens = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  const userT = tokens(accountName);
  const aadhaarT = tokens(aadhaarName);
  if (!userT.length || !aadhaarT.length) return false;
  return userT.every((t) =>
    t.length === 1
      ? aadhaarT.some((a) => a.startsWith(t))
      : aadhaarT.includes(t)
  );
}

function maskAadhaar(num) {
  const s = String(num || "").replace(/\s+/g, "");
  if (!s) return "XXXXXXXXXXXX";
  return `${"X".repeat(Math.max(0, s.length - 4))}${s.slice(-4)}`;
}

/* ── Sandbox JWT token cache (mirrors aadhaarRouter; lives in this module
   so we don't reach across files for state) ── */
let cachedToken = null;
let cachedTokenExpiresAt = 0;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiresAt - TOKEN_REFRESH_MARGIN_MS) {
    return cachedToken;
  }
  if (!apiKey || !apiSecret) {
    throw new Error("Missing Sandbox.co.in credentials");
  }
  const { data } = await axios.post(
    `${sandboxBaseUrl}/authenticate`,
    {},
    {
      headers: {
        "x-api-key": apiKey,
        "x-api-secret": apiSecret,
        "x-api-version": "1.0",
        "Content-Type": "application/json",
      },
      timeout: 8000,
    }
  );
  const token = data?.data?.access_token || data?.access_token;
  if (!token) throw new Error("Sandbox authenticate returned no access_token");
  cachedToken = token;
  cachedTokenExpiresAt = now + TOKEN_TTL_MS;
  return token;
}

async function authHeaders() {
  const token = await getAccessToken();
  return {
    Authorization: token,
    "x-api-key": apiKey,
    "x-api-version": "1.0",
    "Content-Type": "application/json",
  };
}

function handleUpstreamError(error, res, prefix = "DIGILOCKER") {
  if (error?.response?.status === 401 || error?.response?.status === 403) {
    cachedToken = null;
    cachedTokenExpiresAt = 0;
  }
  const status = error?.response?.status || 502;
  const upstream = error?.response?.data;
  const code = upstream?.code || upstream?.error || `${prefix}_UPSTREAM_ERROR`;
  const message =
    upstream?.message ||
    upstream?.data?.message ||
    error?.message ||
    "DigiLocker request failed";
  return res.status(status === 200 ? 502 : status).json({ error: String(code), message });
}

const initLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${ipKeyGenerator(req)}:${req.user?.uid || "anon"}`,
});

const completeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${ipKeyGenerator(req)}:${req.user?.uid || "anon"}`,
});

/**
 * POST /api/digilocker/init  (authed)
 * Creates a DigiLocker session at Sandbox and returns the URL to redirect to.
 */
router.post("/init", authGuard, initLimiter, async (_req, res) => {
  try {
    const headers = await authHeaders();
    const consentExpiry = Date.now() + 24 * 60 * 60 * 1000;
    const { data } = await axios.post(
      `${sandboxBaseUrl}/kyc/digilocker/sessions/init`,
      {
        "@entity": "in.co.sandbox.kyc.digilocker.session.request",
        flow: "signin",
        // Meri Pehchaan sends the user here once consent is granted.
        redirect_url: `${publicAppUrl}/?digilocker=complete`,
        doc_types: ["aadhaar"],
        consent_expiry: consentExpiry,
      },
      { headers, timeout: 12000 }
    );

    const inner = data?.data;
    const sessionId = inner?.session_id;
    const authUrl = inner?.authorization_url;
    if (!sessionId || !authUrl) {
      return res.status(502).json({
        error: "INIT_INCOMPLETE",
        message: "DigiLocker did not return a session URL.",
      });
    }
    return res.json({ sessionId, authUrl });
  } catch (error) {
    return handleUpstreamError(error, res, "DIGILOCKER_INIT");
  }
});

/**
 * POST /api/digilocker/complete  (authed)
 * Body: { sessionId }
 * Verifies the user finished consent at DigiLocker, pulls the signed Aadhaar
 * document, matches the name with the user's account, persists verification.
 */
router.post("/complete", authGuard, completeLimiter, async (req, res) => {
  const sessionId = String(req.body?.sessionId || "").trim();
  if (!sessionId) {
    return res.status(400).json({ error: "MISSING_SESSION_ID" });
  }

  try {
    const headers = await authHeaders();

    // 1) Confirm the session reached an authenticated state. Sandbox status
    //    values include AUTHENTICATED / COMPLETED / FAILED / PENDING; the
    //    exact key depends on their version, so we check broadly.
    const { data: statusResp } = await axios.get(
      `${sandboxBaseUrl}/kyc/digilocker/sessions/${encodeURIComponent(sessionId)}/status`,
      { headers, timeout: 12000 }
    );
    const statusInner = statusResp?.data || {};
    const status = String(statusInner?.status || statusInner?.session_status || "").toUpperCase();
    if (!status.includes("AUTH") && !status.includes("COMPLETE") && !status.includes("SUCCESS")) {
      return res.json({
        verified: false,
        error: "DIGILOCKER_INCOMPLETE",
        message: `DigiLocker session is "${status || "unknown"}". Please retry.`,
      });
    }

    // 2) Fetch the signed Aadhaar document.
    const { data: docResp } = await axios.get(
      `${sandboxBaseUrl}/kyc/digilocker/sessions/${encodeURIComponent(sessionId)}/documents/ADHAR`,
      { headers, timeout: 15000 }
    );
    const doc = docResp?.data || {};
    const aadhaarName =
      doc?.name ||
      doc?.full_name ||
      doc?.person?.name ||
      doc?.aadhaar?.name ||
      "";
    const aadhaarNumber =
      doc?.aadhaar_number ||
      doc?.number ||
      doc?.aadhaar?.number ||
      "";
    const dob = doc?.date_of_birth || doc?.dob || doc?.aadhaar?.dob || "";
    const gender = doc?.gender || doc?.aadhaar?.gender || "";
    const address = doc?.full_address || doc?.address || doc?.aadhaar?.address || "";

    if (!aadhaarName) {
      return res.json({
        verified: false,
        error: "DOC_PARSE_FAILED",
        message: "Could not read your Aadhaar details from DigiLocker. Please retry.",
      });
    }

    // 3) Match name with account displayName.
    const admin = firebaseAdmin();
    const userRecord = await admin.auth().getUser(req.user.uid);
    const accountName = userRecord.displayName || req.user.name || "";

    if (!accountName) {
      return res.json({
        verified: false,
        error: "ACCOUNT_NAME_MISSING",
        message:
          "Your account has no name set. Add your full legal name in Account Settings, then retry verification.",
      });
    }

    if (!namesMatch(accountName, aadhaarName)) {
      return res.json({
        verified: false,
        error: "NAME_MISMATCH",
        message:
          "Your Aadhaar name does not match the name on your account. Update your account name to match your Aadhaar exactly, then retry.",
        accountName,
        aadhaarName,
      });
    }

    // 4) Persist verification (mirrors aadhaarRouter shape; verifiedVia="digilocker").
    try {
      await admin
        .firestore()
        .doc(`users/${req.user.uid}`)
        .set(
          {
            aadhaarVerified: true,
            aadhaarMaskedNumber: maskAadhaar(aadhaarNumber),
            aadhaarVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
            aadhaarNameOnRecord: aadhaarName,
            aadhaarVerifiedVia: "digilocker",
          },
          { merge: true }
        );
    } catch (err) {
      console.error("[digilocker] firestore persist failed", err?.message || err);
    }

    return res.json({
      verified: true,
      maskedAadhaar: maskAadhaar(aadhaarNumber),
      name: aadhaarName,
      dob,
      gender,
      address,
      verifiedVia: "digilocker",
    });
  } catch (error) {
    return handleUpstreamError(error, res, "DIGILOCKER_COMPLETE");
  }
});

export default router;
