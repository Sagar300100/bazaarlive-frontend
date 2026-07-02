import express from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import axios from "axios";
import { verifyIdToken, firebaseAdmin } from "./firebaseAdmin.js";
import { logAudit } from "./auditLog.js";
import { requireEmailVerified } from "./emailVerifiedGuard.js";

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
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${req.user?.uid || "anon"}`,
});

const completeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${req.user?.uid || "anon"}`,
});

/**
 * POST /api/digilocker/init  (authed)
 * Creates a DigiLocker session at Sandbox and returns the URL to redirect to.
 */
router.post("/init", authGuard, requireEmailVerified, initLimiter, async (_req, res) => {
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
router.post("/complete", authGuard, requireEmailVerified, completeLimiter, async (req, res) => {
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
    // Sandbox returns "SUCCEEDED" (not "SUCCESS") on a finished session. Other
    // observed values: AUTHENTICATED, COMPLETED. We accept any of these or
    // anything starting with SUCC. We reject the obvious negatives instead.
    const FAILED = ["FAILED", "EXPIRED", "CANCELLED", "REJECTED", "PENDING", "INITIATED"];
    const isFailed = FAILED.some((s) => status.includes(s));
    const isOk =
      !isFailed &&
      (status.startsWith("SUCC") || status.includes("AUTH") || status.includes("COMPLETE"));
    if (!isOk) {
      return res.json({
        verified: false,
        error: "DIGILOCKER_INCOMPLETE",
        message: `DigiLocker session is "${status || "unknown"}". Please retry.`,
      });
    }

    // 2) Fetch the signed Aadhaar document. Sandbox's doc_type code for
    //    Aadhaar is "AADHAAR" (not UIDAI's legacy "ADHAR"). Try the modern
    //    code first, fall back to the legacy if Sandbox unexpectedly rejects.
    let docResp;
    try {
      const r = await axios.get(
        `${sandboxBaseUrl}/kyc/digilocker/sessions/${encodeURIComponent(sessionId)}/documents/AADHAAR`,
        { headers, timeout: 15000 }
      );
      docResp = r.data;
    } catch (e) {
      // Some Sandbox tenants still use lowercase. One retry, then bail.
      if (e?.response?.status === 400) {
        const r2 = await axios.get(
          `${sandboxBaseUrl}/kyc/digilocker/sessions/${encodeURIComponent(sessionId)}/documents/aadhaar`,
          { headers, timeout: 15000 }
        );
        docResp = r2.data;
      } else {
        throw e;
      }
    }
    // Sandbox returns a signed S3 URL to the actual XML file — they do NOT
    // parse the UIDAI XML for us. Find the file, download it, then parse.
    const files = docResp?.data?.files || [];
    const aadhaarFile =
      files.find((f) => (f?.metadata?.issuer_id || "").includes("uidai")) ||
      files[0];
    if (!aadhaarFile?.url) {
      return res.json({
        verified: false,
        error: "DOC_FETCH_FAILED",
        message: "DigiLocker did not return an Aadhaar document. Please retry.",
      });
    }

    // Pull the signed XML from S3. The URL is already authenticated; do not
    // forward our Sandbox Authorization header (it'll break the AWS sig).
    const xmlResp = await axios.get(aadhaarFile.url, {
      timeout: 15000,
      responseType: "text",
      headers: { Accept: "application/xml" },
      // Important — strip our auth headers; signed URL has its own auth.
      transformRequest: [(data, headers) => { delete headers.Authorization; delete headers["x-api-key"]; return data; }],
    });
    const xml = String(xmlResp?.data || "");

    // Parse the UIDAI XML. Structure is roughly:
    //   <UidData uid="XXXX">
    //     <Poi name="SAGAR SINGHAL" dob="DD-MM-YYYY" gender="M"/>
    //     <Poa house="..." street="..." loc="..." vtc="..." po="..."
    //          dist="..." subdist="..." state="..." pc="..." country="..."/>
    //   </UidData>
    // We use targeted regex because installing fast-xml-parser is overkill
    // for this fixed schema.
    function attr(name, source) {
      const m = source.match(new RegExp(`\\b${name}="([^"]*)"`, "i"));
      return m ? m[1].trim() : "";
    }

    const poi = (xml.match(/<Poi\s[^/>]*\/?>/i) || [""])[0];
    const poa = (xml.match(/<Poa\s[^/>]*\/?>/i) || [""])[0];
    const uidData = (xml.match(/<UidData\s[^>]*>/i) || [""])[0];

    const aadhaarName = attr("name", poi) || attr("name", xml);
    const dob = attr("dob", poi);
    const gender = attr("gender", poi);
    const aadhaarNumber = attr("uid", uidData);
    const address = [
      attr("house", poa), attr("street", poa), attr("loc", poa),
      attr("vtc", poa), attr("po", poa), attr("subdist", poa),
      attr("dist", poa), attr("state", poa), attr("pc", poa),
      attr("country", poa),
    ].filter(Boolean).join(", ");

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
            aadhaarDob: dob || "",
            aadhaarGender: gender || "",
            aadhaarAddress: address || "",
            aadhaarVerifiedVia: "digilocker",
          },
          { merge: true }
        );
    } catch (err) {
      console.error("[digilocker] firestore persist failed", err?.message || err);
    }

    logAudit(req, "aadhaar_verified", {
      via: "digilocker",
      maskedAadhaar: maskAadhaar(aadhaarNumber),
    });

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
