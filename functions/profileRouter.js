import express from "express";
import fs from "fs";
import path from "path";
import { verifyIdToken } from "./firebaseAdmin.js";

const router = express.Router();
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

// GET /api/referral -> returns code + share link, creates one if missing
router.get("/referral", authGuard, (req, res) => {
  const profiles = readProfiles();
  const profile = ensureProfile(profiles, req.user.uid);
  writeProfiles(profiles);
  const link = `${REFERRAL_BASE.replace(/\/$/, "")}?ref=${profile.referralCode}`;
  res.json({ code: profile.referralCode, link });
});

export default router;
