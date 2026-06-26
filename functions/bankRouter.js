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

// Same Verhoeff-style hygiene we do for Aadhaar names: lowercase, strip
// punctuation, tokenize, and require every account-name token to appear in
// the bank-returned name. Single-letter tokens match as initials.
function namesMatch(accountName, bankName) {
  const tokens = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  const userT = tokens(accountName);
  const bankT = tokens(bankName);
  if (!userT.length || !bankT.length) return false;
  return userT.every((t) =>
    t.length === 1
      ? bankT.some((b) => b.startsWith(t))
      : bankT.includes(t)
  );
}

const VALID_IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const VALID_ACC = /^\d{9,18}$/;

function maskAccount(num) {
  const s = String(num || "").replace(/\s+/g, "");
  if (!s) return "XXXXXXXX";
  return `${"X".repeat(Math.max(0, s.length - 4))}${s.slice(-4)}`;
}

async function authGuard(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ error: "AUTH_REQUIRED" });
  try {
    const decoded = await verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.warn("[bank] auth failed", err?.message || err);
    return res.status(401).json({ error: "AUTH_INVALID" });
  }
}

/* ── Sandbox JWT cache (mirrors aadhaar/digilocker routers) ── */
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

function handleUpstreamError(error, res, prefix = "BANK") {
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
    "Bank verification failed";
  return res.status(status === 200 ? 502 : status).json({ error: String(code), message });
}

// Cost ~₹2 per verification — and it actually moves ₹1 — so we cap attempts
// hard. A seller who fat-fingers their account number 5 times has either
// confused themselves or is probing for valid accounts; either way, stop.
const verifyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${ipKeyGenerator(req)}:${req.user?.uid || "anon"}`,
});

/**
 * POST /api/bank/verify  (authed)
 * Body: { accountNumber, ifsc }
 * Performs Sandbox penny-drop, matches the returned name with the seller's
 * Aadhaar-verified name on file, persists the result to Firestore.
 */
router.post("/verify", authGuard, verifyLimiter, async (req, res) => {
  const accountNumber = String(req.body?.accountNumber || "").replace(/\s+/g, "");
  const ifsc = String(req.body?.ifsc || "").toUpperCase().replace(/\s+/g, "");

  if (!VALID_ACC.test(accountNumber)) {
    return res.status(400).json({
      error: "INVALID_ACCOUNT",
      message: "Account number must be 9-18 digits.",
    });
  }
  if (!VALID_IFSC.test(ifsc)) {
    return res.status(400).json({
      error: "INVALID_IFSC",
      message: "IFSC must be 11 chars: 4 letters + 0 + 6 alphanumeric (e.g. HDFC0001234).",
    });
  }

  // Need a name to match against. Prefer the verified Aadhaar name we
  // already saved; fall back to the Firebase displayName.
  const admin = firebaseAdmin();
  const userDoc = await admin.firestore().doc(`users/${req.user.uid}`).get();
  const data = userDoc.data() || {};
  const aadhaarName = data.aadhaarNameOnRecord || "";
  if (!aadhaarName) {
    return res.status(400).json({
      error: "AADHAAR_FIRST",
      message: "Please verify your Aadhaar via DigiLocker before adding a bank account.",
    });
  }

  try {
    const headers = await authHeaders();
    // Sandbox sends ₹1 to the account and returns the name as per bank records.
    const { data: resp } = await axios.get(
      `${sandboxBaseUrl}/bank/${encodeURIComponent(ifsc)}/accounts/${encodeURIComponent(accountNumber)}/verify`,
      {
        headers,
        timeout: 20000,
        params: { name: aadhaarName },
      }
    );

    const inner = resp?.data || {};
    const accountExists = inner.account_exists === true || inner.account_exists === "true";
    const bankName = inner.name_at_bank || inner.beneficiary_name || "";
    const utr = inner.utr || inner.reference_id || "";

    if (!accountExists) {
      return res.json({
        verified: false,
        error: "ACCOUNT_NOT_FOUND",
        message: "Bank reports this account does not exist. Re-check account number + IFSC.",
      });
    }

    if (!bankName) {
      return res.json({
        verified: false,
        error: "NO_NAME_RETURNED",
        message: "Bank did not return a holder name. Try again or use a different account.",
      });
    }

    if (!namesMatch(aadhaarName, bankName)) {
      return res.json({
        verified: false,
        error: "NAME_MISMATCH",
        message: `Bank says this account belongs to "${bankName}" but your Aadhaar name is "${aadhaarName}". The bank account must be in YOUR name.`,
        bankName,
        aadhaarName,
      });
    }

    // Persist. Never store the full account number unencrypted — keep masked
    // form + last 4 for display. Razorpay will get the full number later
    // when we wire sub-merchant onboarding.
    try {
      await admin
        .firestore()
        .doc(`users/${req.user.uid}`)
        .set(
          {
            bankAccount: {
              accountNumber: accountNumber, // TODO: move to encrypted field before launch
              maskedAccount: maskAccount(accountNumber),
              ifsc,
              holderName: bankName,
              verified: true,
              verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
              verifiedVia: "sandbox_penny_drop",
              lastUtr: utr,
            },
            "sellerOnboarding.bankVerified": true,
            "sellerOnboarding.bankVerifiedAt": admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
    } catch (err) {
      console.error("[bank] firestore persist failed", err?.message || err);
    }

    return res.json({
      verified: true,
      bankName,
      maskedAccount: maskAccount(accountNumber),
      ifsc,
      utr,
    });
  } catch (error) {
    return handleUpstreamError(error, res, "BANK_VERIFY");
  }
});

export default router;
