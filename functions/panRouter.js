import express from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import axios from "axios";
import { verifyIdToken, firebaseAdmin } from "./firebaseAdmin.js";
import { encryptField } from "./kms.js";
import { logAudit } from "./auditLog.js";

const router = express.Router();

const apiKey = process.env.SANDBOX_API_KEY || "";
const apiSecret = process.env.SANDBOX_API_SECRET || "";
const sandboxBaseUrl =
  process.env.SANDBOX_BASE_URL?.replace(/\/$/, "") ||
  "https://api.sandbox.co.in";

// 10-char PAN: 5 letters + 4 digits + 1 letter. 4th letter is "P" for
// individuals; we don't enforce that here so non-individual entities can
// onboard too (proprietorship etc.).
const VALID_PAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

function namesMatch(accountName, panName) {
  const tokens = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  const a = tokens(accountName);
  const b = tokens(panName);
  if (!a.length || !b.length) return false;
  return a.every((t) =>
    t.length === 1 ? b.some((x) => x.startsWith(t)) : b.includes(t)
  );
}

function maskPan(p) {
  const s = String(p || "").toUpperCase();
  if (s.length !== 10) return "XXXXXXXXXX";
  return `${s.slice(0, 5)}XXXX${s.slice(-1)}`;
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
    console.warn("[pan] auth failed", err?.message || err);
    return res.status(401).json({ error: "AUTH_INVALID" });
  }
}

/* ── Sandbox JWT cache ── */
let cachedToken = null;
let cachedTokenExpiresAt = 0;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiresAt - TOKEN_REFRESH_MARGIN_MS) {
    return cachedToken;
  }
  if (!apiKey || !apiSecret) throw new Error("Missing Sandbox.co.in credentials");
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
    "x-api-version": "2.0",
    "Content-Type": "application/json",
  };
}

function handleUpstreamError(error, res) {
  if (error?.response?.status === 401 || error?.response?.status === 403) {
    cachedToken = null;
    cachedTokenExpiresAt = 0;
  }
  const status = error?.response?.status || 502;
  const upstream = error?.response?.data;
  const code = upstream?.code || upstream?.error || "PAN_UPSTREAM_ERROR";
  const message =
    upstream?.message || upstream?.data?.message || error?.message || "PAN verification failed";
  return res.status(status === 200 ? 502 : status).json({ error: String(code), message });
}

const verifyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${ipKeyGenerator(req)}:${req.user?.uid || "anon"}`,
});

/**
 * POST /api/pan/verify  (authed)
 * Body: { pan }
 * Hits Sandbox PAN verify, matches the returned name with Aadhaar name on
 * file, persists the result to Firestore.
 */
router.post("/verify", authGuard, verifyLimiter, async (req, res) => {
  const pan = String(req.body?.pan || "").toUpperCase().replace(/\s+/g, "");
  if (!VALID_PAN.test(pan)) {
    return res.status(400).json({
      error: "INVALID_PAN",
      message: "PAN must be 10 chars: 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F).",
    });
  }

  // We need the Aadhaar-verified name to match against.
  const admin = firebaseAdmin();
  const userDoc = await admin.firestore().doc(`users/${req.user.uid}`).get();
  const data = userDoc.data() || {};
  const aadhaarName = data.aadhaarNameOnRecord || "";
  if (!aadhaarName) {
    return res.status(400).json({
      error: "AADHAAR_FIRST",
      message: "Please verify your Aadhaar via DigiLocker before adding a PAN.",
    });
  }

  // DOB: prefer the value saved during DigiLocker. If missing (legacy verify
  // before we started saving DOB), accept it from the request body. Always
  // normalise to DD/MM/YYYY since Sandbox is picky about the format.
  function normaliseDob(raw) {
    const s = String(raw || "").trim();
    if (!s) return "";
    // Already DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
    // DD-MM-YYYY → DD/MM/YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) return s.replace(/-/g, "/");
    // YYYY-MM-DD → DD/MM/YYYY
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
    return s;
  }
  const dob = normaliseDob(data.aadhaarDob || req.body?.dateOfBirth);
  if (!dob) {
    // Return 200 with verified:false so the frontend can read the error
    // code and show the DOB input. A 4xx status causes the fetch wrapper
    // to throw, hiding the structured error from the caller.
    return res.json({
      verified: false,
      error: "DOB_REQUIRED",
      message:
        "We don't have your date of birth on file. Please enter it (as on your Aadhaar) and try again.",
    });
  }

  try {
    const headers = await authHeaders();
    const { data: resp } = await axios.post(
      `${sandboxBaseUrl}/kyc/pan/verify`,
      {
        "@entity": "in.co.sandbox.kyc.pan_verification.request",
        pan,
        name_as_per_pan: aadhaarName,
        date_of_birth: dob,
        consent: "Y",
        reason: "Seller KYC for Any&All marketplace",
      },
      { headers, timeout: 12000 }
    );

    // Log the raw response once so we can pin field names if Sandbox ever
    // changes them.
    try {
      console.log(
        "[pan] response keys:",
        JSON.stringify(Object.keys(resp?.data || {})),
        "preview:",
        JSON.stringify(resp?.data).slice(0, 800)
      );
    } catch {}

    const inner = resp?.data || {};
    // Sandbox returns status:"valid" (lowercase). They handle the
    // name/DOB matching themselves and return *_match booleans — we don't
    // need to run namesMatch() here.
    const isValid = String(inner?.status || inner?.pan_status || "").toLowerCase() === "valid";
    const nameMatches = inner?.name_as_per_pan_match === true;
    const dobMatches = inner?.date_of_birth_match === true;

    if (!isValid) {
      return res.json({
        verified: false,
        error: "INVALID_OR_MISSING",
        message: inner?.message || "PAN does not appear to be valid. Re-check the number.",
      });
    }

    if (!nameMatches) {
      return res.json({
        verified: false,
        error: "NAME_MISMATCH",
        message:
          `The name on this PAN doesn't match your account name "${aadhaarName}". The PAN must be registered in YOUR name.`,
        aadhaarName,
      });
    }

    if (!dobMatches) {
      return res.json({
        verified: false,
        error: "DOB_MISMATCH",
        message:
          "The date of birth on this PAN doesn't match what you entered. Please check the DOB you provided.",
      });
    }

    // Sandbox's PAN endpoint doesn't return the actual name on the card —
    // it just confirms whether what we sent matches. Use the Aadhaar name
    // since we know it now matches the PAN.
    const panName = aadhaarName;

    // Wrap the full PAN with Cloud KMS before Firestore write. A leaked
    // service account or misconfigured rule now yields ciphertext instead
    // of plaintext PII. Masked version stays cleartext for UI display.
    let panCiphertext = null;
    try {
      panCiphertext = await encryptField(pan);
    } catch (err) {
      console.error("[pan] KMS encrypt failed — aborting persist", err?.message || err);
      // Do NOT fall back to plaintext storage. Better to fail the write
      // than to silently regress the security posture.
      return res.status(500).json({ error: "ENCRYPT_FAILED", message: "Could not securely store PAN. Please retry." });
    }

    try {
      await admin
        .firestore()
        .doc(`users/${req.user.uid}`)
        .set(
          {
            pan: {
              maskedPan: maskPan(pan),
              panCiphertext,
              holderName: panName,
              verified: true,
              verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
              verifiedVia: "sandbox",
            },
            // Nested object — Admin SDK turns dotted keys into LITERAL field
            // names when used with set+merge, so dot-paths look like they
            // saved but get('sellerOnboarding.panVerified') reads back as
            // undefined. Nested object + merge:true does a proper deep merge.
            sellerOnboarding: {
              panVerified: true,
              panVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
          },
          { merge: true }
        );
    } catch (err) {
      console.error("[pan] firestore persist failed", err?.message || err);
    }

    logAudit(req, "pan_verified", { maskedPan: maskPan(pan) });

    return res.json({
      verified: true,
      panName,
      maskedPan: maskPan(pan),
    });
  } catch (error) {
    return handleUpstreamError(error, res);
  }
});

export default router;
