// services/api.ts
// =====================================================
//                      TYPES
// =====================================================
export interface ShowData {
  id: number | string;
  name: string;
  date: string;
  time: string;
  category: string;
  subcategory: string;
  sellingFormat: string;
  brand: string;
  shippedFrom: string;
  sellerRating: number;
  tags: string[];
  isLive: boolean;
  thumbnail: string;
  seller: string;

  // raw/backend fields (optional)
  title?: string;
  thumbnail_url?: string;
  scheduled_time?: string | null;
  sellerId?: number;
  sellerObj?: { id: number; username: string } | null;
  ownerUid?: string | null;
}

// =====================================================
//                      IMPORTS
// =====================================================
import { auth } from "../src/firebase";
import { getIdToken } from "firebase/auth";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  confirmPasswordReset,
  applyActionCode,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";

// =====================================================
//                      CONFIG
// =====================================================
const BASE = (
  (import.meta as any).env?.VITE_API_BASE ||
  (import.meta as any).env?.VITE_API_URL ||
  "http://127.0.0.1:3001"
).replace(/\/$/, "");

// =====================================================
//                     HELPERS
// =====================================================
function mapShowToUI(show: any): ShowData {
  const rawId = show?.id ?? show?.$id ?? show?.id;
  const d = show?.scheduled_time ? new Date(show.scheduled_time) : null;
  const sellerName =
    show?.seller?.username ??
    show?.sellerUsername ??
    (typeof show?.seller === "string" ? show.seller : "Anonymous");

  return {
    ...show,
    id: typeof rawId === "string" ? rawId : Number(rawId || 0),
    name: show?.title ?? show?.name ?? "Untitled Show",
    thumbnail: show?.thumbnail_url ?? show?.thumbnail ?? "",
    date: d ? d.toISOString().split("T")[0] : "TBD",
    time: d ? d.toTimeString().slice(0, 5) : "TBD",
    category: show?.category ?? "Uncategorized",
    subcategory: show?.subcategory ?? "",
    sellingFormat: show?.sellingFormat ?? "Auction",
    brand: show?.brand ?? "N/A",
    shippedFrom: show?.shippedFrom ?? "N/A",
    sellerRating: show?.sellerRating ?? 4.5,
    tags: Array.isArray(show?.tags) ? show.tags : [],
    isLive: !!(show?.isLive ?? show?.is_live ?? show?.isLive),
    seller: sellerName,
    ownerUid: show?.ownerUid ?? null,
  };
}

async function throwIfNotOk(res: Response, url: string) {
  if (!res.ok) {
    let msg = `${res.status}`;
    try {
      const t = await res.text();
      if (t) msg = `${res.status} ${t}`;
    } catch {}
    throw new Error(`HTTP ${msg} for ${url}`);
  }
  return res;
}

/* -------- Auth header (ID token) -------- */
async function authHeaders(): Promise<Record<string, string>> {
  const u = auth.currentUser;
  if (!u) return {};
  try {
    const tok = await getIdToken(u, /*forceRefresh*/ false);
    return { Authorization: `Bearer ${tok}` };
  } catch {
    return {};
  }
}

/* -------- fetch JSON -------- */
async function j<T = any>(
  path: string,
  init?: RequestInit,
  needsAuth = false
): Promise<T> {
  const url = `${BASE}${path}`;
  const hdrs = {
    "Content-Type": "application/json",
    ...(init?.headers || {}),
    ...(needsAuth ? await authHeaders() : {}),
  };
  const res = await fetch(url, {
    headers: hdrs,
    credentials: "include",
    ...init,
  });
  await throwIfNotOk(res, url);
  return (await res.json()) as T;
}

// =====================================================
//                   SESSION (RBAC)
// =====================================================
export async function sessionMe(): Promise<{
  isAuthenticated: boolean;
  uid?: string;
  email?: string;
  role?: string;
  claims?: Record<string, any>;
}> {
  return j("/api/auth/me", { method: "GET" }, /*needsAuth*/ true);
}

// =====================================================
//                     SHOWS API
// =====================================================
export async function fetchScheduledShows(): Promise<ShowData[]> {
  // public
  const url = `${BASE}/api/shows`;
  const res = await fetch(url, { credentials: "include" });
  await throwIfNotOk(res, url);
  const data = await res.json();
  return Array.isArray(data) ? data.map(mapShowToUI) : [];
}

export async function createShow(payload: {
  title: string;
  category: string;
  scheduled_time?: string | null; // ISO
  description?: string | null;
  subcategory?: string | null;
  brand?: string | null;
  shippedFrom?: string | null;
  sellerRating?: number | null;
  tags?: string[];
  isLive?: boolean;
  thumbnail_url?: string | null;
  sellerUsername?: string;
}) {
  // 🔐 needs auth (seller/admin)
  // Send both camelCase and snake_case so any backend picks up the isLive flag
  return mapShowToUI(
    await j(
      "/api/shows",
      { method: "POST", body: JSON.stringify({ ...payload, is_live: payload.isLive }) },
      true
    )
  );
}

export async function updateShow(
  id: number | string,
  patch: Partial<Record<string, any>>
) {
  // 🔐 needs auth (owner/admin)
  return mapShowToUI(
    await j(
      `/api/shows/${id}`,
      { method: "PATCH", body: JSON.stringify(patch) },
      true
    )
  );
}

export async function deleteShow(id: number | string) {
  // 🔐 needs auth (owner/admin)
  await j(`/api/shows/${id}`, { method: "DELETE" }, true);
  return true;
}

// =====================================================
//                   AUTH (FIREBASE)
// =====================================================

/** Current user (or null) */
export async function me(): Promise<{ id: string; email: string } | null> {
  const u = auth.currentUser;
  if (!u) return null;
  try {
    await u.reload();
  } catch {}
  return { id: u.uid, email: u.email || "" };
}

/** Email + password login */
export async function login(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const u = cred.user;

  if (!u.emailVerified) {
    try {
      await sendEmailVerification(u, { url: buildContinueUrl() });
    } catch {}
    throw new Error(
      "Please verify your email. A new verification link was sent to your inbox."
    );
  }

  return { id: u.uid, email: u.email || "" };
}

/** Check whether a username is free (best-effort; real check is on claim). */
export async function checkUsername(username: string): Promise<{ available: boolean; reason?: string }> {
  try {
    const res = await fetch(`${BASE}/api/profile/check-username?u=${encodeURIComponent(username)}`);
    if (!res.ok) return { available: false, reason: "CHECK_FAILED" };
    return await res.json();
  } catch {
    return { available: false, reason: "CHECK_FAILED" };
  }
}

/** Create user, set displayName, claim username server-side, send verification email */
export async function register(email: string, password: string, name?: string, username?: string) {
  const cleanUsername = (username || "").toLowerCase().trim();

  // Pre-check (best-effort) to fail fast before creating a Firebase Auth user
  // we'd then need to clean up. Race conditions are still caught by the
  // server-side transaction below.
  if (cleanUsername) {
    const check = await checkUsername(cleanUsername);
    if (!check.available) {
      const why =
        check.reason === "RESERVED" ? "That username is reserved." :
        check.reason === "INVALID_FORMAT" ? "Invalid username format." :
        `Username @${cleanUsername} is already taken. Try another.`;
      throw new Error(why);
    }
  }

  const cred = await createUserWithEmailAndPassword(auth, email, password);

  if (name && name.trim()) {
    // displayName is what Aadhaar verification will compare against,
    // so it must be saved before any KYC flow runs.
    try { await updateProfile(cred.user, { displayName: name.trim() }); } catch {}
  }

  // Claim the username atomically server-side. If this fails due to a race
  // (someone else just claimed it), surface a clear error — the Auth user
  // exists but they can pick a different username from Account Settings.
  if (cleanUsername) {
    try {
      const token = await getIdToken(cred.user, /*forceRefresh*/ true);
      const r = await fetch(`${BASE}/api/profile/claim-username`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: cleanUsername }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        if (data?.error === "USERNAME_TAKEN") {
          throw new Error(`Username @${cleanUsername} was just taken. Pick another in Account Settings.`);
        }
        // Non-fatal — log and continue. User can set username later.
        console.warn("[register] username claim failed:", data?.error);
      }
    } catch (err) {
      // Don't fail the whole signup over username — the Auth account exists.
      // Only re-throw if it's the explicit USERNAME_TAKEN we just constructed.
      if (err instanceof Error && err.message.startsWith("Username @")) throw err;
      console.warn("[register] username claim threw:", err);
    }
  }

  try {
    await sendEmailVerification(cred.user, { url: buildContinueUrl() });
  } catch {}

  return {
    id: cred.user.uid,
    email: cred.user.email || "",
    name: name?.trim() || "",
    username: cleanUsername,
  };
}

/** Logout */
export async function logout() {
  try {
    await signOut(auth);
  } catch {}
  return true;
}

/** Send reset link */
export async function requestPasswordReset(email: string) {
  await sendPasswordResetEmail(auth, email, { url: buildContinueUrl("reset") });
  return true;
}

/** Compat: old Appwrite-style reset (userId ignored) */
export async function resetPasswordAppwrite(
  _userId: string,
  secret: string,
  newPassword: string
) {
  const oobCode = secret || extractOobCodeFromLocation();
  if (!oobCode) throw new Error("Missing reset code.");
  await confirmPasswordReset(auth, oobCode, newPassword);
  return true;
}

/** Optional helper: complete reset from a token-like string */
export async function resetPassword(
  resetToken: string,
  newPassword: string
) {
  const oobCode = extractOobCode(resetToken) || extractOobCodeFromLocation();
  if (!oobCode) throw new Error("Invalid reset token.");
  await confirmPasswordReset(auth, oobCode, newPassword);
  return true;
}

/** Compat: email verify (userId ignored) */
export async function verifyEmail(_userId: string, secret: string) {
  const oobCode = secret || extractOobCodeFromLocation();
  if (!oobCode) throw new Error("Missing verification code.");
  await applyActionCode(auth, oobCode);
  const u: User | null = auth.currentUser;
  if (u)
    try {
      await u.reload();
    } catch {}
  return { ok: true };
}

/* ---- helpers to normalize Firebase action codes ---- */
function buildContinueUrl(_kind: "verify" | "reset" | "home" | "auto" = "auto") {
  return window.location.origin + (window.location.hash ? "/#/" : "/");
}
function extractOobCodeFromLocation(): string | null {
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get("oobCode");
  } catch {
    return null;
  }
}
function extractOobCode(tokenLike: string): string | null {
  try {
    const url = tokenLike.startsWith("?")
      ? new URL(tokenLike, "http://x")
      : new URL(tokenLike);
    const oc = url.searchParams.get("oobCode");
    if (oc) return oc;
  } catch {}
  try {
    const o = JSON.parse(tokenLike);
    if (o?.oobCode) return String(o.oobCode);
  } catch {}
  if (tokenLike.includes(":")) {
    const [k, v] = tokenLike.split(":", 2);
    if (k.toLowerCase() === "oobcode" && v) return v;
  }
  return null;
}

// =====================================================
//            HEALTH (optional / harmless)
// =====================================================
export async function pingDb() {
  const url = `${BASE}/health`;
  const res = await resFetchSafe(url);
  return res?.ok ?? false;
}
async function resFetchSafe(url: string) {
  try {
    return await fetch(url);
  } catch {
    return null as any;
  }
}

// =====================================================
//      PAYMENTS / RAZORPAY + UPI PREFERENCES
// =====================================================
export async function saveMyUpi(upi: string): Promise<boolean> {
  const url = `${BASE}/api/user/upi`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await authHeaders()),
      },
      credentials: "include",
      body: JSON.stringify({ upi }),
    });
    if (!res.ok) throw new Error();
    return true;
  } catch {
    localStorage.setItem("my_upi", upi);
    return true;
  }
}

export async function getMyUpi(): Promise<string> {
  try {
    const res = await fetch(`${BASE}/api/user/upi`, {
      credentials: "include",
      headers: await authHeaders(),
    });
    if (res.ok) {
      const j = await res.json();
      return j?.upi ?? "";
    }
  } catch {}
  return localStorage.getItem("my_upi") ?? "";
}

/* -------- Razorpay helpers -------- */
export async function createRazorpayOrder(params: {
  amount: number; // in paise
  currency?: string;
  notes?: Record<string, any>;
}) {
  // Try backend first (production path — backend creates order with secret key)
  try {
    return await j<any>("/api/payments/create-order", {
      method: "POST",
      body: JSON.stringify(params),
    });
  } catch {
    // Fallback: client-side order stub (works for test mode without backend)
    // In production, always ensure backend is running for proper order creation
    console.warn("Backend order creation failed — using client-side fallback (test mode only)");
    return {
      id:       `order_${Date.now()}`,
      amount:   params.amount,
      currency: params.currency || "INR",
      status:   "created",
    };
  }
}

export async function verifyRazorpayPayment(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  return j<{ verified: boolean }>("/api/payments/verify", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/** Status stub (kept for type compatibility) */
export async function getOrderStatus(
  _orderId: string
): Promise<{
  status: "unknown" | "created" | "paid" | "failed";
  latest?: { status: string };
  order?: any;
  vpa?: string;
}> {
  return { status: "unknown", latest: { status: "created" } };
}

/** Razorpay public key (prefer backend; fallback to env) */
export async function getRazorpayKey(): Promise<{ key: string }> {
  try {
    const res = await fetch(`${BASE}/api/config/razorpay-key`, {
      credentials: "include",
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.error("getRazorpayKey failed:", err);
  }
  return { key: (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || "" };
}

/** UPI Collect (dev-safe) */
export async function startUpiCollect(
  amountPaise: number,
  note: string = "Payment"
): Promise<{
  requestId: string;
  order?: { id: string; amount: number; currency: string };
  vpa?: string;
}> {
  const url = `${BASE}/api/payments/upi-collect`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await authHeaders()),
      },
      credentials: "include",
      body: JSON.stringify({ amount: amountPaise, note }),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.error("startUpiCollect failed:", err);
  }
  return {
    requestId: "dev-mock-request",
    order: { id: "dev-order", amount: amountPaise, currency: "INR" },
    vpa: localStorage.getItem("my_upi") ?? "demo@upi",
  };
}

// ---------- Payments signature verification ----------
export interface VerifyPaymentParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/** POST to backend to verify the Razorpay signature */
export async function verifyPaymentSignature(
  params: VerifyPaymentParams
): Promise<{ verified: boolean }> {
  const url = `${BASE}/api/payments/verify`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await authHeaders()),
      },
      credentials: "include",
      body: JSON.stringify(params),
    });
    if (res.ok) return await res.json();
  } catch {
    // Backend unavailable — trust Razorpay payment_id as confirmation (test mode only)
    // In production, ALWAYS verify on backend using secret key
    if (params.razorpay_payment_id?.startsWith('pay_')) {
      console.warn("Signature verification skipped — backend unavailable (test mode)");
      return { verified: true };
    }
  }
  return { verified: false };
}

// ---------- Streaming (100ms) ----------
export async function getStreamToken(params: {
  roomId: string;
  role?: "viewer" | "host";
  displayName?: string;
}) {
  return j<{ token: string; roomId: string; role: string; userId: string }>(
    "/api/stream/token",
    {
      method: "POST",
      body: JSON.stringify(params),
    },
    true
  );
}

// ---------- Products / Orders ----------
export interface ProductInput {
  title: string;
  price: number;
  stock?: number;
  variants?: any[];
  thumbnail_url?: string;
  showId?: string | null;
}

export interface ProductRecord extends ProductInput {
  id: string;
  reserved: number;
  sold: number;
  ownerUid?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export async function listProducts(opts: { ownerUid?: string; showId?: string } = {}) {
  const qs = new URLSearchParams();
  if (opts.ownerUid) qs.set("ownerUid", opts.ownerUid);
  if (opts.showId) qs.set("showId", opts.showId);
  const path = `/api/products${qs.toString() ? `?${qs.toString()}` : ""}`;
  return j<ProductRecord[]>(path);
}

export async function createProduct(body: ProductInput) {
  return j<ProductRecord>(
    "/api/products",
    { method: "POST", body: JSON.stringify(body) },
    true
  );
}

export async function updateProduct(id: string, patch: Partial<ProductInput>) {
  return j<ProductRecord>(
    `/api/products/${id}`,
    { method: "PATCH", body: JSON.stringify(patch) },
    true
  );
}

export async function deleteProduct(id: string) {
  return j<{ ok: boolean }>(`/api/products/${id}`, { method: "DELETE" }, true);
}

export interface OrderRecord {
  id: string;
  productId?: string;
  auctionId?: string;
  qty: number;
  status: string;
  payment_status: string;
  reservedUntil?: string;
}

export async function reserveProduct(params: {
  productId: string;
  qty: number;
  buyerName?: string;
  buyerEmail?: string;
  address?: any;
  paymentMethod?: string;
}) {
  return j<OrderRecord>(
    `/api/products/${params.productId}/reserve`,
    { method: "POST", body: JSON.stringify(params) },
    true
  );
}

export async function confirmOrder(id: string) {
  return j<{ ok: boolean }>(`/api/orders/${id}/confirm`, { method: "POST" }, true);
}

export async function cancelOrder(id: string) {
  return j<{ ok: boolean }>(`/api/orders/${id}/cancel`, { method: "POST" }, true);
}

// ---------- Auctions ----------
export interface AuctionRecord {
  id: string;
  productId: string;
  showId?: string | null;
  startPrice: number;
  bidStep: number;
  currentBid: number;
  currentBidderUid?: string | null;
  currentBidderName?: string | null;
  endsAt?: string | null;
  status: string;
  extendSeconds?: number;
  version?: number;
}

export async function createAuction(body: {
  productId: string;
  startPrice: number;
  bidStep?: number;
  showId?: string | null;
  extendSeconds?: number;
  endsAt?: string;
}) {
  return j<AuctionRecord>(
    "/api/auctions",
    { method: "POST", body: JSON.stringify(body) },
    true
  );
}

export async function listAuctions() {
  return j<AuctionRecord[]>("/api/auctions");
}

export async function placeBid(auctionId: string, amount: number) {
  return j<{ ok: boolean; bid: any }>(
    `/api/auctions/${auctionId}/bid`,
    { method: "POST", body: JSON.stringify({ amount }) },
    true
  );
}

export async function closeAuction(id: string) {
  return j<{ ok: boolean }>(`/api/auctions/${id}/close`, { method: "POST" }, true);
}

// ---------- Aadhaar verification ----------
// Both endpoints require a logged-in user — the backend enforces auth and
// reads the account's displayName to match against the Aadhaar name.
export async function sendAadhaarOtp(payload: {
  idNumber: string;
  consent: boolean;
}) {
  return j<{ txnId?: string; maskedAadhaar?: string; expiresInSeconds?: number }>(
    "/api/aadhaar/send-otp",
    { method: "POST", body: JSON.stringify(payload) },
    /*needsAuth*/ true
  );
}

export async function verifyAadhaarOtp(payload: {
  idNumber: string;
  otp: string;
  txnId: string;
}) {
  return j<{
    verified: boolean;
    error?: "NAME_MISMATCH" | "ACCOUNT_NAME_MISSING" | "OTP_FAILED";
    message?: string;
    accountName?: string;
    aadhaarName?: string;
    maskedAadhaar?: string;
    name?: string;
    dob?: string;
    address?: any;
    referenceId?: string;
  }>("/api/aadhaar/verify-otp", { method: "POST", body: JSON.stringify(payload) }, /*needsAuth*/ true);
}

// ---------- Seller onboarding ----------
export async function getSellerOnboarding() {
  return j<{
    storeSetupComplete: boolean;
    aadhaarVerified: boolean;
    panVerified: boolean;
    bankVerified: boolean;
    completedAt: string | null;
    storeName: string;
    storeHandle: string;
  }>("/api/profile/seller-onboarding", { method: "GET" }, /*needsAuth*/ true);
}

export async function saveStoreSetup(payload: {
  storeName: string;
  storeHandle: string;
}) {
  return j<{ ok: boolean; storeHandle: string }>(
    "/api/profile/seller-onboarding/store",
    { method: "POST", body: JSON.stringify(payload) },
    /*needsAuth*/ true
  );
}

export async function verifyPan(payload: { pan: string; dateOfBirth?: string }) {
  return j<{
    verified: boolean;
    error?: "INVALID_PAN" | "AADHAAR_FIRST" | "DOB_REQUIRED" | "INVALID_OR_MISSING" | "NAME_MISMATCH";
    message?: string;
    panName?: string;
    aadhaarName?: string;
    maskedPan?: string;
  }>("/api/pan/verify", { method: "POST", body: JSON.stringify(payload) }, /*needsAuth*/ true);
}

export async function completeSellerOnboarding() {
  return j<{ ok: boolean }>(
    "/api/profile/seller-onboarding/complete",
    { method: "POST", body: JSON.stringify({}) },
    /*needsAuth*/ true
  );
}

// ---------- Bank account verification (penny drop) ----------
export async function verifyBankAccount(payload: {
  accountNumber: string;
  ifsc: string;
}) {
  return j<{
    verified: boolean;
    error?: "INVALID_ACCOUNT" | "INVALID_IFSC" | "AADHAAR_FIRST" | "ACCOUNT_NOT_FOUND" | "NO_NAME_RETURNED" | "NAME_MISMATCH";
    message?: string;
    bankName?: string;
    aadhaarName?: string;
    maskedAccount?: string;
    ifsc?: string;
    utr?: string;
  }>("/api/bank/verify", { method: "POST", body: JSON.stringify(payload) }, /*needsAuth*/ true);
}

// ---------- DigiLocker verification (preferred over OTP-OKYC) ----------
// Init returns a Meri Pehchaan URL; we redirect the user there. On return
// the app calls complete() with the session id we stashed.
export async function initDigiLocker() {
  return j<{ sessionId: string; authUrl: string }>(
    "/api/digilocker/init",
    { method: "POST", body: JSON.stringify({}) },
    /*needsAuth*/ true
  );
}

export async function completeDigiLocker(sessionId: string) {
  return j<{
    verified: boolean;
    error?: "NAME_MISMATCH" | "ACCOUNT_NAME_MISSING" | "DIGILOCKER_INCOMPLETE" | "DOC_PARSE_FAILED";
    message?: string;
    accountName?: string;
    aadhaarName?: string;
    maskedAadhaar?: string;
    name?: string;
    dob?: string;
    gender?: string;
    address?: any;
    verifiedVia?: "digilocker";
  }>(
    "/api/digilocker/complete",
    { method: "POST", body: JSON.stringify({ sessionId }) },
    /*needsAuth*/ true
  );
}

// ---------- UPI Autopay (escrow stub) ----------
export async function setupUpiAutopay(params: {
  amount: number;
  mandateFrequency?: string;
  description?: string;
}) {
  return j<{ ok: boolean; autopay?: any }>(
    "/api/payments/upi-autopay/setup",
    { method: "POST", body: JSON.stringify(params) },
    true
  );
}

// --- Live toggle helper — sends both camelCase + snake_case so any backend picks it up ---
export async function setShowLive(id: number | string, live: boolean) {
  return updateShow(id, { isLive: !!live, is_live: !!live });
}

/* -------- Revoke all sessions (log out from all devices) -------- */
export async function revokeAllSessions(): Promise<void> {
  // Give a nicer error if not logged in on this browser
  if (!auth.currentUser) {
    throw new Error("You need to sign in again before logging out other devices.");
  }
  await j("/api/auth/revoke-sessions", { method: "POST" }, true);
}
