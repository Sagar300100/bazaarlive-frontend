import express from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import axios from "axios";

const router = express.Router();

const VALID_AADHAAR = /^\d{12}$/;
const VALID_VID = /^\d{16}$/;

const apiKey = process.env.SANDBOX_API_KEY || "";
const apiSecret = process.env.SANDBOX_API_SECRET || "";
// Sandbox.co.in has two environments: test-api (sandbox test data only)
// and api (production — accepts both real Aadhaar and their test numbers).
// We default to production because trial accounts are issued key_live_* keys
// that only authenticate against production. Override via SANDBOX_BASE_URL.
const sandboxBaseUrl =
  process.env.SANDBOX_BASE_URL?.replace(/\/$/, "") ||
  "https://api.sandbox.co.in";

function compactNumber(value) {
  return typeof value === "string" ? value.replace(/\s+/g, "") : "";
}

// Verhoeff checksum for Aadhaar
const verhoeffD = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const verhoeffP = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];
function isValidAadhaar(id) {
  if (!VALID_AADHAAR.test(id)) return false;
  let c = 0;
  const reversed = id.split("").reverse().map(Number);
  for (let i = 0; i < reversed.length; i++) {
    c = verhoeffD[c][verhoeffP[i % 8][reversed[i]]];
  }
  return c === 0;
}
function isValidId(id) {
  if (VALID_VID.test(id)) return true; // UIDAI VID
  return isValidAadhaar(id);
}

// Sandbox test Aadhaar numbers bypass Verhoeff so devs can exercise the flow
const SANDBOX_TEST_IDS = new Set([
  "123456789012",
  "123456789013",
  "123456789015",
  "123456789016",
  "123456789017",
  "123456789018",
  "123456789020",
]);
function acceptsId(id) {
  return SANDBOX_TEST_IDS.has(id) || isValidId(id);
}

function maskId(id) {
  if (!id) return "XXXX-XXXX-XXXX";
  const trimmed = compactNumber(id);
  const suffix = trimmed.slice(-4);
  return `${"X".repeat(Math.max(0, trimmed.length - 4))}${suffix}`;
}

// Token cache — Sandbox JWT lasts 24h; refresh 5 min early.
let cachedToken = null;
let cachedTokenExpiresAt = 0;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;

async function getAccessToken({ force = false } = {}) {
  const now = Date.now();
  if (!force && cachedToken && now < cachedTokenExpiresAt - TOKEN_REFRESH_MARGIN_MS) {
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
  if (!token) {
    throw new Error("Sandbox authenticate returned no access_token");
  }
  cachedToken = token;
  cachedTokenExpiresAt = now + TOKEN_TTL_MS;
  return token;
}

async function authHeaders() {
  const token = await getAccessToken();
  return {
    Authorization: token,
    "x-api-key": apiKey,
    "x-api-version": "2.0",
    "Content-Type": "application/json",
  };
}

function handleUpstreamError(error, res) {
  // Drop cached JWT on auth failure so the next request re-authenticates.
  if (error?.response?.status === 401 || error?.response?.status === 403) {
    cachedToken = null;
    cachedTokenExpiresAt = 0;
  }
  const status = error?.response?.status || 502;
  const upstream = error?.response?.data;
  const code = upstream?.code || upstream?.error || "AADHAAR_UPSTREAM_ERROR";
  const message =
    upstream?.message ||
    upstream?.data?.message ||
    error?.message ||
    "Verification service failed";
  return res.status(status === 200 ? 502 : status).json({ error: String(code), message });
}

const sendOtpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    `${ipKeyGenerator(req)}:${maskId(compactNumber(req.body?.idNumber || ""))}`,
});

const verifyOtpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${ipKeyGenerator(req)}:${req.body?.txnId || "missing"}`,
});

router.post("/send-otp", sendOtpLimiter, async (req, res) => {
  const idNumber = compactNumber(req.body?.idNumber);
  const consent = Boolean(req.body?.consent);

  if (!consent || !acceptsId(idNumber)) {
    return res.status(400).json({ error: "INVALID_INPUT" });
  }

  try {
    const headers = await authHeaders();
    const { data } = await axios.post(
      `${sandboxBaseUrl}/kyc/aadhaar/okyc/otp`,
      {
        "@entity": "in.co.sandbox.kyc.aadhaar.okyc.otp.request",
        aadhaar_number: idNumber,
        consent: "Y",
        reason: "Seller KYC for Any&All marketplace",
      },
      { headers, timeout: 12000 }
    );

    const inner = data?.data;
    const referenceId = inner?.reference_id;
    if (referenceId === undefined || referenceId === null) {
      return res.status(502).json({
        error: "NO_REFERENCE_ID",
        message: inner?.message || "Upstream did not return a reference_id",
      });
    }

    return res.json({
      txnId: String(referenceId),
      maskedAadhaar: maskId(idNumber),
      expiresInSeconds: 300,
    });
  } catch (error) {
    return handleUpstreamError(error, res);
  }
});

router.post("/verify-otp", verifyOtpLimiter, async (req, res) => {
  const idNumber = compactNumber(req.body?.idNumber);
  const otp = compactNumber(req.body?.otp);
  const txnId = req.body?.txnId;

  if (!txnId || !otp || otp.length < 6 || !acceptsId(idNumber)) {
    return res.status(400).json({ error: "INVALID_INPUT" });
  }

  try {
    const headers = await authHeaders();
    const { data } = await axios.post(
      `${sandboxBaseUrl}/kyc/aadhaar/okyc/otp/verify`,
      {
        "@entity": "in.co.sandbox.kyc.aadhaar.okyc.request",
        reference_id: String(txnId),
        otp,
      },
      { headers, timeout: 12000 }
    );

    const inner = data?.data;
    const verified = inner?.status === "VALID";

    return res.json({
      verified,
      message: verified ? undefined : inner?.message || "Verification failed",
      maskedAadhaar: maskId(idNumber),
      name: inner?.name,
      dob: inner?.date_of_birth,
      gender: inner?.gender,
      address: inner?.full_address,
      shareCode: inner?.share_code,
      referenceId: String(inner?.reference_id ?? txnId),
    });
  } catch (error) {
    return handleUpstreamError(error, res);
  }
});

export default router;
