import express from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import axios from "axios";

const router = express.Router();

const VALID_AADHAAR = /^\d{12}$/;
const VALID_VID = /^\d{16}$/;
const clientId = process.env.SETU_CLIENT_ID || "";
const clientSecret = process.env.SETU_CLIENT_SECRET || "";
const setuBaseUrl =
  process.env.SETU_BASE_URL?.replace(/\/$/, "") ||
  "https://sandbox.setu.co/aadhaar";

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

function maskId(id) {
  if (!id) return "XXXX-XXXX-XXXX";
  const trimmed = compactNumber(id);
  const suffix = trimmed.slice(-4);
  return `${"X".repeat(Math.max(0, trimmed.length - 4))}${suffix}`;
}

function upstreamHeaders() {
  if (!clientId || !clientSecret) {
    throw new Error("Missing Setu credentials");
  }
  return {
    "X-Client-Id": clientId,
    "X-Client-Secret": clientSecret,
    "Content-Type": "application/json",
  };
}

function handleUpstreamError(error, res) {
  const status = error?.response?.status || 502;
  const code = error?.response?.data?.code || "AADHAAR_UPSTREAM_ERROR";
  const message =
    error?.response?.data?.message ||
    error?.message ||
    "Verification service failed";
  return res.status(status).json({ error: code, message });
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

  if (!consent || !isValidId(idNumber)) {
    return res.status(400).json({ error: "INVALID_INPUT" });
  }

  try {
    const { data } = await axios.post(
      `${setuBaseUrl}/send-otp`,
      { id_number: idNumber, consent: true },
      { headers: upstreamHeaders(), timeout: 8000 }
    );

    return res.json({
      txnId: data?.txn_id,
      maskedAadhaar: data?.masked_aadhaar || maskId(idNumber),
      expiresInSeconds: data?.expires_in || 300,
    });
  } catch (error) {
    return handleUpstreamError(error, res);
  }
});

router.post("/verify-otp", verifyOtpLimiter, async (req, res) => {
  const idNumber = compactNumber(req.body?.idNumber);
  const otp = compactNumber(req.body?.otp);
  const txnId = req.body?.txnId;

  if (!txnId || !otp || otp.length < 6 || !isValidId(idNumber)) {
    return res.status(400).json({ error: "INVALID_INPUT" });
  }

  try {
    const { data } = await axios.post(
      `${setuBaseUrl}/verify-otp`,
      { id_number: idNumber, otp, txn_id: txnId },
      { headers: upstreamHeaders(), timeout: 8000 }
    );

    return res.json({
      verified: data?.status === "success",
      maskedAadhaar: data?.masked_aadhaar || maskId(idNumber),
      name: data?.name,
      dob: data?.dob,
      address: data?.address,
      referenceId: data?.reference_id || data?.txn_id || txnId,
    });
  } catch (error) {
    return handleUpstreamError(error, res);
  }
});

export default router;
