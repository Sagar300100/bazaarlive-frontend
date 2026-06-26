import express from "express";
import fs from "fs";
import path from "path";
import { verifyIdToken, firebaseAdmin } from "./firebaseAdmin.js";

const router = express.Router();

// Lowercase, must start with a letter, then letters/digits/underscore.
// 3-20 chars. We reject ".", "-", spaces, emoji to keep handles URL-safe.
const USERNAME_RE = /^[a-z][a-z0-9_]{2,19}$/;

// A small list of usernames sellers should never be able to claim — top-level
// routes, "official" sounding handles, etc. Keep tight; expand as needed.
const RESERVED_USERNAMES = new Set([
  "admin", "anynall", "anyandall", "any", "all", "support", "help", "official",
  "team", "moderator", "mod", "root", "system", "api", "www", "mail", "email",
  "shop", "seller", "buyer", "auction", "live", "show", "shows",
]);
const DATA_PATH = path.join(process.cwd(), "server", "profiles.json");
const REFERRAL_BASE = process.env.REFERRAL_BASE || "https://anynall.com/invite";

function readProfiles() {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeProfiles(profiles) {
  try {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(profiles, null, 2));
  } catch (err) {
    console.error("[profile] write error", err);
  }
}

function generateReferralCode(uid) {
  const rand = Math.random().toString(36).slice(2, 8);
  const suffix = uid ? uid.toString().slice(-4) : "";
  return `${rand}${suffix}`;
}

function ensureProfile(profiles, userId) {
  if (!profiles[userId]) {
    profiles[userId] = {
      username: "yourshop",
      handle: "Your Name",
      bio: "Tell buyers what you sell and why they should follow.",
      avatar: "",
      referralCode: generateReferralCode(userId),
    };
  } else if (!profiles[userId].referralCode) {
    profiles[userId].referralCode = generateReferralCode(userId);
  }
  return profiles[userId];
}

async function authGuard(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return res.status(401).json({ error: "AUTH_REQUIRED" });
  try {
    const decoded = await verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.warn("[profile] verify failed", err?.message || err);
    return res.status(401).json({ error: "AUTH_INVALID" });
  }
}

// GET /api/profile/check-username?u=foo
// Public — used during signup before the user has an auth token.
// Best-effort availability check; the atomic claim still happens server-side.
router.get("/check-username", async (req, res) => {
  const raw = String(req.query?.u || "").toLowerCase().trim();
  if (!USERNAME_RE.test(raw)) {
    return res.json({ available: false, reason: "INVALID_FORMAT" });
  }
  if (RESERVED_USERNAMES.has(raw)) {
    return res.json({ available: false, reason: "RESERVED" });
  }
  try {
    const db = firebaseAdmin().firestore();
    const doc = await db.doc(`usernames/${raw}`).get();
    return res.json({ available: !doc.exists });
  } catch (err) {
    console.error("[profile] check-username failed", err?.message || err);
    return res.status(500).json({ available: false, reason: "CHECK_FAILED" });
  }
});

// POST /api/profile/claim-username  { username }
// Authenticated. Atomically reserves the username in a Firestore transaction —
// prevents two users from claiming the same handle in a race.
router.post("/claim-username", authGuard, async (req, res) => {
  const raw = String(req.body?.username || "").toLowerCase().trim();
  if (!USERNAME_RE.test(raw)) {
    return res.status(400).json({
      error: "INVALID_FORMAT",
      message: "Username must be 3-20 chars, letters/digits/underscore, starting with a letter.",
    });
  }
  if (RESERVED_USERNAMES.has(raw)) {
    return res.status(400).json({ error: "RESERVED", message: "That username is reserved." });
  }

  const admin = firebaseAdmin();
  const db = admin.firestore();
  const usernameRef = db.doc(`usernames/${raw}`);
  const userRef = db.doc(`users/${req.user.uid}`);

  try {
    await db.runTransaction(async (tx) => {
      const taken = await tx.get(usernameRef);
      if (taken.exists && taken.data()?.uid !== req.user.uid) {
        const e = new Error("USERNAME_TAKEN");
        e.code = "USERNAME_TAKEN";
        throw e;
      }
      tx.set(usernameRef, {
        uid: req.user.uid,
        claimedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      tx.set(
        userRef,
        {
          username: raw,
          displayName: req.user.name || req.user.displayName || "",
          email: req.user.email || "",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });
    return res.json({ ok: true, username: raw });
  } catch (err) {
    if (err?.code === "USERNAME_TAKEN") {
      return res.status(409).json({ error: "USERNAME_TAKEN", message: "Username already taken." });
    }
    console.error("[profile] claim-username failed", err?.message || err);
    return res.status(500).json({ error: "CLAIM_FAILED", message: "Could not claim username." });
  }
});

// GET /api/profile
router.get("/", authGuard, (_req, res) => {
  const profiles = readProfiles();
  const profile = ensureProfile(profiles, _req.user.uid);
  writeProfiles(profiles);
  res.json(profile);
});

// PUT /api/profile
router.put("/", authGuard, (req, res) => {
  const { username, handle, bio } = req.body || {};
  if (!username || !handle) {
    return res.status(400).json({ error: "USERNAME_AND_HANDLE_REQUIRED" });
  }
  const profiles = readProfiles();
  const current = ensureProfile(profiles, req.user.uid);
  profiles[req.user.uid] = {
    ...current,
    username,
    handle,
    bio: bio ?? "",
  };
  writeProfiles(profiles);
  res.json(profiles[req.user.uid]);
});

// Allowed seller categories. Keep tight — sellers can change later.
const SELLER_CATEGORIES = new Set([
  "sneakers", "apparel", "watches", "jewellery", "collectibles",
  "electronics", "beauty", "home", "art", "books", "other",
]);

// GET /api/profile/seller-onboarding
// Returns the seller's current onboarding progress so the wizard can pick
// up where they left off if they close the tab mid-flow.
router.get("/seller-onboarding", authGuard, async (req, res) => {
  try {
    const db = firebaseAdmin().firestore();
    const doc = await db.doc(`users/${req.user.uid}`).get();
    const data = doc.data() || {};
    const so = data.sellerOnboarding || {};
    return res.json({
      storeSetupComplete: !!so.storeName && !!so.storeHandle,
      aadhaarVerified: !!data.aadhaarVerified,
      bankVerified: !!so.bankVerified,
      completedAt: so.completedAt || null,
      storeName: so.storeName || "",
      storeHandle: so.storeHandle || "",
      storeCategory: so.storeCategory || "",
    });
  } catch (err) {
    console.error("[profile] seller-onboarding read failed", err?.message || err);
    return res.status(500).json({ error: "READ_FAILED" });
  }
});

// POST /api/profile/seller-onboarding/store  { storeName, storeHandle, storeCategory }
// Saves step 1 of the wizard. storeHandle is unique across sellers and
// claimed via the same usernames/ collection used for buyer handles.
router.post("/seller-onboarding/store", authGuard, async (req, res) => {
  const storeName = String(req.body?.storeName || "").trim();
  const storeHandle = String(req.body?.storeHandle || "").toLowerCase().trim();
  const storeCategory = String(req.body?.storeCategory || "").toLowerCase().trim();

  if (storeName.length < 2 || storeName.length > 60) {
    return res.status(400).json({ error: "INVALID_NAME", message: "Store name must be 2-60 chars." });
  }
  if (!USERNAME_RE.test(storeHandle)) {
    return res.status(400).json({
      error: "INVALID_HANDLE",
      message: "Handle must be 3-20 chars, letters/digits/underscore, starting with a letter.",
    });
  }
  if (RESERVED_USERNAMES.has(storeHandle)) {
    return res.status(400).json({ error: "RESERVED", message: "That handle is reserved." });
  }
  if (!SELLER_CATEGORIES.has(storeCategory)) {
    return res.status(400).json({ error: "INVALID_CATEGORY", message: "Pick a valid category." });
  }

  const admin = firebaseAdmin();
  const db = admin.firestore();
  const handleRef = db.doc(`usernames/${storeHandle}`);
  const userRef = db.doc(`users/${req.user.uid}`);

  try {
    await db.runTransaction(async (tx) => {
      const existing = await tx.get(handleRef);
      if (existing.exists && existing.data()?.uid !== req.user.uid) {
        const e = new Error("HANDLE_TAKEN");
        e.code = "HANDLE_TAKEN";
        throw e;
      }
      tx.set(handleRef, {
        uid: req.user.uid,
        kind: "seller",
        claimedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      tx.set(
        userRef,
        {
          "sellerOnboarding.storeName": storeName,
          "sellerOnboarding.storeHandle": storeHandle,
          "sellerOnboarding.storeCategory": storeCategory,
          "sellerOnboarding.storeSetupAt": admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });
    return res.json({ ok: true, storeHandle });
  } catch (err) {
    if (err?.code === "HANDLE_TAKEN") {
      return res.status(409).json({ error: "HANDLE_TAKEN", message: "That handle is already taken." });
    }
    console.error("[profile] store setup failed", err?.message || err);
    return res.status(500).json({ error: "STORE_SETUP_FAILED" });
  }
});

// POST /api/profile/seller-onboarding/complete
// Final gate — only succeeds if all 3 prior steps are done. Marks the
// seller as fully onboarded so the seller dashboard can let them in.
router.post("/seller-onboarding/complete", authGuard, async (req, res) => {
  const admin = firebaseAdmin();
  const db = admin.firestore();
  const userRef = db.doc(`users/${req.user.uid}`);
  try {
    const doc = await userRef.get();
    const data = doc.data() || {};
    const so = data.sellerOnboarding || {};
    if (!so.storeName || !so.storeHandle) {
      return res.status(400).json({ error: "STORE_MISSING", message: "Complete store setup first." });
    }
    if (!data.aadhaarVerified) {
      return res.status(400).json({ error: "AADHAAR_MISSING", message: "Verify Aadhaar via DigiLocker first." });
    }
    if (!so.bankVerified) {
      return res.status(400).json({ error: "BANK_MISSING", message: "Verify your bank account first." });
    }
    await userRef.set(
      {
        isSeller: true,
        "sellerOnboarding.completedAt": admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("[profile] seller-onboarding/complete failed", err?.message || err);
    return res.status(500).json({ error: "COMPLETE_FAILED" });
  }
});

// GET /api/referral -> returns code + share link, creates one if missing
router.get("/referral", authGuard, (req, res) => {
  const profiles = readProfiles();
  const profile = ensureProfile(profiles, req.user.uid);
  writeProfiles(profiles);
  const link = `${REFERRAL_BASE.replace(/\/$/, "")}?ref=${profile.referralCode}`;
  res.json({ code: profile.referralCode, link });
});

export default router;
