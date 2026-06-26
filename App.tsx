import React, { useState, useEffect } from "react";
// import Lenis from "lenis"; // removed — global RAF caused jank everywhere

import { Header } from "./components/Header";
import { LandingPage } from "./components/LandingPage";
import ImmersiveLanding from "./components/ImmersiveLanding";
// SnakeCursor removed — mousemove RAF loop caused jank
// GlobalAurora + CinematicOverlay scoped to landing-only (LandingPage owns them now)
import AccountSettingsPage from "./pages/AccountSettingsPage";
import LoginModalV2 from "./components/LoginModalV2";
import OnboardingModal from "./components/OnboardingModal";
import SellerOnboardingModal from "./components/SellerOnboardingModal";
import SellerHubPage from "./pages/SellerHubPage";
import AboutUsPage from "./pages/AboutUsPage";
import LiveRoomPage from "./pages/LiveRoomPage";
import BuyerHomePage from "./pages/BuyerHomePage";
import BuyerLiveRoomPage from "./pages/BuyerLiveRoomPage";
import UserProfilePage from "./pages/UserProfilePage";
import MessagesPage from "./pages/MessagesPage";
import HelpCenterPage from "./pages/HelpCenterPage";
import FaqCategoryPage from "./pages/FaqCategoryPage";
import FaqArticlePage from "./pages/FaqArticlePage";
import BrowsePage from "./pages/BrowsePage";

import VerifyEmailGate from "./components/VerifyEmailGate";

import type { ShowData } from "./services/api";
import type { Filters } from "./components/buyer/Sidebar";

import {
  fsFetchShows as fetchScheduledShows,
  fsCreateShow as apiCreateShow,
  fsUpdateShow as apiUpdateShow,
  fsDeleteShow as apiDeleteShow,
} from "./services/showsfirestore";

import {
  onAuthStateChanged,
  signOut as fbSignOut,
  getIdTokenResult,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "./src/firebase";

import { verifyEmail, resetPasswordAppwrite, completeDigiLocker, getSellerOnboarding } from "./services/api";
import BecomeSellerPage from "./pages/BecomeSellerPage";
import LiveSessionService from "./services/LiveSessionService";

/* ---------------- URL intent helpers (Firebase + legacy) ---------------- */
function getIntentFromUrl() {
  const parse = (u: string) => {
    try {
      const url = new URL(u);
      const path = url.pathname;

      const mode = url.searchParams.get("mode");
      const oobCode = url.searchParams.get("oobCode") || undefined;

      const userId = url.searchParams.get("userId") || undefined;
      const secretLegacy = url.searchParams.get("secret") || undefined;
      const token = url.searchParams.get("token") || undefined;

      const secret = oobCode || secretLegacy || undefined;

      return { path, mode, secret, userId, token };
    } catch {
      return {
        path: "/",
        mode: null as any,
        secret: undefined,
        userId: undefined,
        token: undefined,
      };
    }
  };

  let intent = parse(window.location.href);

  const hash = window.location.hash?.replace(/^#/, "");
  if (hash) {
    const abs = new URL(hash, window.location.origin).toString();
    const h = parse(abs);
    if (h.mode || h.secret || h.userId) intent = h;
  }

  const isVerify = intent.mode === "verifyEmail" || intent.path === "/verify-email";
  const isReset = intent.mode === "resetPassword" || intent.path === "/reset-password";

  const normalizedUserId = intent.userId || "firebase";
  return {
    isVerify,
    isReset,
    userId: normalizedUserId,
    secret: intent.secret,
    token: intent.token,
  };
}

/* ---------------- Verify overlay ---------------- */
const VerifyEmailCard: React.FC<{
  userId: string;
  secret: string;
  onDone: (ok: boolean, message?: string) => void;
}> = ({ userId, secret, onDone }) => {
  const [state, setState] = useState<"working" | "ok" | "error">("working");
  const [msg, setMsg] = useState<string>("Verifying your email…");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await verifyEmail(userId, secret);
        if (!mounted) return;
        setState("ok");
        setMsg("Email verified! You can log in now.");
        setTimeout(() => onDone(true), 800);
      } catch (e: any) {
        if (!mounted) return;
        setState("error");
        setMsg(e?.message || "Verification failed.");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userId, secret, onDone]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-[380px] p-6 shadow-xl text-center">
        <h2 className="text-xl font-bold mb-2">Verify your email</h2>
        <p className={state === "error" ? "text-red-600" : "text-gray-700"}>{msg}</p>
        {state === "error" && (
          <button
            className="mt-4 px-4 py-2 rounded bg-gray-900 text-white"
            onClick={() => onDone(false, msg)}
          >
            Continue to login
          </button>
        )}
      </div>
    </div>
  );
};

/* ---------------- Reset overlay ---------------- */
const ResetPasswordCard: React.FC<{
  userId: string;
  secret: string;
  onDone: (ok: boolean, message?: string) => void;
}> = ({ userId, secret, onDone }) => {
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (pw1.length < 8) return setErr("Password must be at least 8 characters.");
    if (pw1 !== pw2) return setErr("Passwords do not match.");
    try {
      setWorking(true);
      await resetPasswordAppwrite(userId, secret, pw1);
      setDone(true);
      setTimeout(() => onDone(true), 900);
    } catch (e: any) {
      setErr(e?.message || "Reset failed.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-[420px] p-6 shadow-xl">
        <h2 className="text-xl font-bold mb-2 text-center">Set a new password</h2>
        {done ? (
          <p className="text-green-700 text-center">Password updated! You can log in now.</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">New password</label>
              <input
                type="password"
                className="mt-1 w-full border rounded px-3 py-2"
                value={pw1}
                onChange={(e) => setPw1(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm password</label>
              <input
                type="password"
                className="mt-1 w-full border rounded px-3 py-2"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                minLength={8}
                required
              />
            </div>
            {err && <p className="text-red-600 text-sm">{err}</p>}
            <button
              type="submit"
              className="w-full bg-gray-900 text-white rounded py-2 font-semibold disabled:opacity-60"
              disabled={working}
            >
              {working ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

/* ---------------- Footer (used on inner pages) ---------------- */
const Footer: React.FC<{ onNavigate: (page: string, data?: any) => void }> = ({ onNavigate }) => (
  <footer style={{ background:"#060C1C" }} aria-labelledby="footer-heading">
    <h2 id="footer-heading" className="sr-only">Footer</h2>
    <div className="max-w-6xl mx-auto px-6 lg:px-10 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
        <div className="col-span-2 md:col-span-1">
          <img src="/logo.png" alt="Any & All" className="h-10 w-auto object-contain mb-3" />
          <p style={{ color:"rgba(255,255,255,0.38)", fontSize:13, lineHeight:1.7 }}>India's premier live shopping marketplace.</p>
        </div>
        {[
          { title:"Support", links:[
            { label:"Help Center", nav:"help-center" },
            { label:"Contact Us",  nav:""             },
            { label:"FAQ",         nav:""             },
          ]},
          { title:"Company", links:[
            { label:"About Us", nav:"about" },
            { label:"Careers",  nav:""      },
            { label:"Blog",     nav:""      },
          ]},
          { title:"Legal", links:[
            { label:"Privacy", nav:"" },
            { label:"Terms",   nav:"" },
          ]},
        ].map(col => (
          <div key={col.title}>
            <h3 style={{ color:"rgba(255,255,255,0.4)", fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:14 }}>{col.title}</h3>
            <ul className="space-y-2.5">
              {col.links.map(l => (
                <li key={l.label}>
                  <a href="#"
                    style={{ color:"rgba(255,255,255,0.38)", fontSize:14 }}
                    onMouseEnter={e => (e.currentTarget.style.color="white")}
                    onMouseLeave={e => (e.currentTarget.style.color="rgba(255,255,255,0.38)")}
                    onClick={e => { e.preventDefault(); if(l.nav) onNavigate(l.nav); }}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between pt-6 gap-3"
        style={{ borderTop:"1px solid rgba(255,255,255,0.07)" }}>
        <p style={{ color:"rgba(255,255,255,0.25)", fontSize:13 }}>© {new Date().getFullYear()} Any & All Inc. All rights reserved.</p>
        <div className="flex gap-5">
          {["Privacy","Terms"].map(l => (
            <a key={l} href="#"
              style={{ color:"rgba(255,255,255,0.25)", fontSize:13 }}
              onMouseEnter={e => (e.currentTarget.style.color="rgba(255,255,255,0.65)")}
              onMouseLeave={e => (e.currentTarget.style.color="rgba(255,255,255,0.25)")}>
              {l}
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

/* ---------------- Filters initial state ---------------- */
const initialFiltersState: Filters = {
  categories: [],
  timeOfShow: [],
  showFormat: [],
  brands: [],
  sellerRating: null,
  shippedFrom: [],
};

/* ======================== APP ======================== */
const App: React.FC = () => {
  // Lenis removed — global RAF every frame caused jank on non-landing pages
  // (Account Settings, Buyer Home etc.). Native scroll is fast on all devices.

  const [currentPage, setCurrentPage] = useState("home");
  const navStack = React.useRef<string[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [userPreferences, setUserPreferences] = useState<string[]>([]);
  const [isSeller, setIsSeller] = useState(false);
  const [isSellerOnboardingOpen, setIsSellerOnboardingOpen] = useState(false);

  const [scheduledShows, setScheduledShows] = useState<ShowData[]>([]);
  const [isLoadingShows, setIsLoadingShows] = useState(true);
  const [pastShows, setPastShows] = useState<ShowData[]>([]);
  const [currentShow, setCurrentShow] = useState<ShowData | null>(null);
  const [viewingShow, setViewingShow] = useState<ShowData | null>(null);
  const [showToEdit, setShowToEdit] = useState<ShowData | null>(null);
  const [sellerHubInitialPage, setSellerHubInitialPage] = useState("home");
  const [initialShowsTab, setInitialShowsTab] = useState<"upcoming" | "past">("upcoming");
  const [sellerHubKey, setSellerHubKey] = useState(Date.now());
  const [activeFilters, setActiveFilters] = useState<Filters>(initialFiltersState);

  const [viewedUsername, setViewedUsername] = useState<string | null>(null);
  const [chattingWith, setChattingWith] = useState<string | null>(null);

  const [helpCategory, setHelpCategory] = useState<string | null>(null);
  const [helpArticle, setHelpArticle] = useState<string | null>(null);

  const [verifyParams, setVerifyParams] = useState<{ userId: string; secret: string } | null>(null);
  const [resetParams, setResetParams] = useState<{ userId: string; secret: string } | null>(null);

  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [digilockerNotice, setDigilockerNotice] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  // null = not yet checked (treat as not onboarded for routing). After auth
  // we fetch /seller-onboarding once and cache; refresh on completion.
  const [sellerOnboardingComplete, setSellerOnboardingComplete] = useState<boolean | null>(null);

  // Fetch seller onboarding status whenever auth flips to verified+logged-in.
  // BecomeSellerPage gates the seller-hub route; we cache here so we don't
  // hammer the endpoint on every render.
  useEffect(() => {
    if (!isLoggedIn || !emailVerified) {
      setSellerOnboardingComplete(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const s = await getSellerOnboarding();
        if (cancelled) return;
        setSellerOnboardingComplete(!!s.completedAt);
      } catch {
        if (!cancelled) setSellerOnboardingComplete(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isLoggedIn, emailVerified]);

  // DigiLocker round-trip handler. After Meri Pehchaan redirects back to
  // anynall.com with ?digilocker=complete we read the session id we stashed
  // before leaving, ask the backend to finalise the verification, and show
  // a result banner.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("digilocker") !== "complete") return;
    const sessionId = window.localStorage.getItem("anynall_digilocker_session") || "";
    // Clean the URL immediately so a reload doesn't re-fire the call.
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, "", cleanUrl);
    if (!sessionId) {
      setDigilockerNotice({ kind: "error", message: "Could not find your DigiLocker session. Please retry verification." });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await completeDigiLocker(sessionId);
        if (cancelled) return;
        try {
          window.localStorage.removeItem("anynall_digilocker_session");
          window.localStorage.removeItem("anynall_digilocker_started_at");
        } catch {}
        if (res.verified) {
          setDigilockerNotice({ kind: "success", message: `Aadhaar verified via DigiLocker. Welcome, ${res.name || ""}.` });
        } else if (res.error === "NAME_MISMATCH") {
          setDigilockerNotice({
            kind: "error",
            message: `Aadhaar shows "${res.aadhaarName || "another name"}" but your account name is "${res.accountName || "unknown"}". Update your account name to match, then retry.`,
          });
        } else if (res.error === "ACCOUNT_NAME_MISSING") {
          setDigilockerNotice({ kind: "error", message: "Your account has no name set. Add your full legal name in Account Settings, then retry." });
        } else {
          setDigilockerNotice({ kind: "error", message: res.message || "DigiLocker verification did not complete. Please retry." });
        }
      } catch (err: any) {
        if (cancelled) return;
        setDigilockerNotice({ kind: "error", message: err?.message || "DigiLocker verification failed. Please retry." });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Enforce "verify before login"
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          await u.reload();
        } catch (e) {
          console.error("Failed to reload user", e);
        }

        if (!u.emailVerified) {
          // Do NOT call sendEmailVerification here — register() already sends
          // one. Re-sending on every auth-state change resulted in duplicate
          // verification emails on signup. If the user needs a fresh link
          // (link expired etc.) they should use the "Resend" path explicitly.
          setAuthNotice(
            `Please verify your email address. We've sent a verification link to ${
              u.email ?? "your email"
            }.`
          );

          try {
            await fbSignOut(auth);
          } catch (e) {
            console.error("signOut failed", e);
          }

          setIsLoggedIn(false);
          setIsSeller(false);
          setEmailVerified(false);
          setIsLoginModalOpen(true);
          return;
        }

        setIsLoggedIn(true);
        setEmailVerified(true);
        setAuthNotice(null);

        try {
          const tokenRes = await getIdTokenResult(u, true);
          const role = tokenRes.claims?.role as string | undefined;
          setIsSeller(role === "seller");
        } catch (e) {
          console.error("getIdTokenResult failed", e);
          setIsSeller(false);
        }
      } else {
        setIsLoggedIn(false);
        setIsSeller(false);
        setEmailVerified(false);
      }
    });

    return () => unsub();
  }, []);

  // Load shows after login
  useEffect(() => {
    if (isLoggedIn) {
      setIsLoadingShows(true);
      fetchScheduledShows()
        .then((shows) => {
          setScheduledShows(shows);
          setIsLoadingShows(false);
        })
        .catch((e) => {
          console.error("fetchScheduledShows failed", e);
          setIsLoadingShows(false);
        });
    } else {
      setIsLoadingShows(false);
    }
  }, [isLoggedIn]);

  // ── Auto-refresh shows so buyers see streams as they go live ──
  // Polls every 20 seconds AND listens for the custom event from AIStreamPanel
  useEffect(() => {
    if (!isLoggedIn) return;

    const refresh = () =>
      fetchScheduledShows()
        .then(setScheduledShows)
        .catch(() => {});

    // Poll every 20s — catches streams started on other devices/accounts
    const pollInterval = setInterval(refresh, 20_000);

    // Also refresh immediately when AI stream goes live/ends in this browser
    window.addEventListener('anyandall:showsChanged', refresh);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('anyandall:showsChanged', refresh);
    };
  }, [isLoggedIn]);

  // Deep links
  useEffect(() => {
    const { isReset, isVerify, userId, secret } = getIntentFromUrl();

    if (isVerify && secret) setVerifyParams({ userId, secret });
    if (isReset && secret) setResetParams({ userId, secret });

    try {
      if (window.location.hash) window.history.replaceState(null, "", "/#/");
      else window.history.replaceState(null, "", "/");
    } catch (e) {
      console.error("history.replaceState failed", e);
    }
  }, []);

  const navigate = (
    page: string,
    data?: { username?: string; category?: string; article?: string; sellerHubPage?: string }
  ) => {
    if (page === "profile") setViewedUsername(data?.username || null);
    if (page === "messages") setChattingWith(data?.username || null);
    if (page === "help-category") setHelpCategory(data?.category || null);
    if (page === "help-article") {
      setHelpCategory(data?.category || null);
      setHelpArticle(data?.article || null);
    }
    if (page !== "seller-hub") {
      setShowToEdit(null);
      setSellerHubInitialPage("home");
      setInitialShowsTab("upcoming");
    } else if (data?.sellerHubPage) {
      setSellerHubInitialPage(data.sellerHubPage);
      setSellerHubKey(Date.now());
    }
    if (page === "home" && currentPage !== "browse") {
      setActiveFilters(initialFiltersState);
    }
    if (page !== currentPage) {
      navStack.current.push(currentPage);
    }
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleBackNav = () => {
    if (navStack.current.length > 0) {
      const prev = navStack.current.pop() as string;
      setCurrentPage(prev);
      return;
    }
    window.history.back();
  };

  const handleCategorySelect = (category: string) => {
    setActiveFilters({ ...initialFiltersState, categories: [category] });
    navigate("home");
  };

  const handleNavigateToSellerHub = (
    initialPage: "inventory" | "schedule_show" | "shows" | "home" | "referrals"
  ) => {
    setSellerHubInitialPage(initialPage);
    setSellerHubKey(Date.now());
    if (initialPage !== "schedule_show") setShowToEdit(null);
    navigate("seller-hub");
  };

  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false);
    setAuthNotice(null);
  };

  const handleLogout = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.error("signOut failed", e);
    }
    setIsLoggedIn(false);
    setCurrentPage("home");
  };

  const handleSellerOnboardingOpen = () => {
    if (isSeller) handleNavigateToSellerHub("home");
    else if (isLoggedIn) setIsSellerOnboardingOpen(true);
    else setIsLoginModalOpen(true);
  };

  const handleSellerOnboardingComplete = () => {
    setIsSeller(true);
    setIsSellerOnboardingOpen(false);
    handleNavigateToSellerHub("home");
  };

  const handleOpenShow = (show: ShowData) => {
    setCurrentShow(show);
    navigate("live_room");
  };

  const handleGoLive = (showId: number | string) => {
    setScheduledShows((prev) => prev.map((s) => (s.id === showId ? { ...s, isLive: true } : s)));
  };

  const handleJoinShow = (showToJoin: ShowData) => {
    setViewingShow(showToJoin);
    if (showToJoin.isLive) {
      if (!LiveSessionService.isSessionLive()) LiveSessionService.startSession();
    } else {
      if (LiveSessionService.isSessionLive()) LiveSessionService.stopSession();
    }
    navigate("buyer_live_room");
  };

  const handleEditShowFromLiveRoom = (show: ShowData) => {
    setShowToEdit(show);
    setSellerHubKey(Date.now());
    handleNavigateToSellerHub("schedule_show");
  };

  const handleScheduleShow = async (newShow: Omit<ShowData, "id">) => {
    try {
      const created = await apiCreateShow({
        title: newShow.name,
        category: newShow.category,
        sellerUsername: newShow.seller || "Anonymous",
        scheduled_time: newShow?.date
          ? new Date(`${newShow.date}T${newShow.time || "00:00"}`).toISOString()
          : null,
        description: (newShow as any).description ?? null,
        subcategory: newShow.subcategory ?? null,
        brand: newShow.brand ?? null,
        shippedFrom: newShow.shippedFrom ?? null,
        sellerRating: newShow.sellerRating ?? null,
        tags: Array.isArray(newShow.tags) ? newShow.tags : [],
        isLive: !!newShow.isLive,
        thumbnail_url: newShow.thumbnail ?? null,
      });

      setScheduledShows((prev) => [...prev, created]);
    } catch (e) {
      console.error("handleScheduleShow failed:", e);
      alert("Failed to schedule show.");
    }
  };

  const handleUpdateShow = async (updatedShow: ShowData) => {
    try {
      const patch: Record<string, any> = {
        title: updatedShow.name,
        category: updatedShow.category,
        description: (updatedShow as any).description ?? null,
        subcategory: updatedShow.subcategory ?? "",
        brand: updatedShow.brand ?? "N/A",
        shippedFrom: updatedShow.shippedFrom ?? "N/A",
        sellerRating:
          typeof updatedShow.sellerRating === "number" ? updatedShow.sellerRating : 4.5,
        tags: Array.isArray(updatedShow.tags) ? updatedShow.tags : [],
        isLive: !!updatedShow.isLive,
        thumbnail_url: updatedShow.thumbnail ?? "",
        scheduled_time: updatedShow?.date
          ? new Date(`${updatedShow.date}T${updatedShow.time || "00:00"}`).toISOString()
          : null,
        sellerId: updatedShow.sellerId ?? undefined,
        sellerUsername: updatedShow.seller || "Anonymous",
      };

      const saved = await apiUpdateShow(updatedShow.id, patch);

      setScheduledShows((prev) =>
        prev.map((s) => (String(s.id) === String(updatedShow.id) ? saved : s))
      );
      setShowToEdit(null);
    } catch (e) {
      console.error("handleUpdateShow failed:", e);
      alert("Failed to update show.");
    }
  };

  const handleCancelShow = async (showId: number | string) => {
    if (!window.confirm("Are you sure you want to cancel this show?")) return;
    try {
      await apiDeleteShow(showId);
      setScheduledShows((prev) => prev.filter((s) => String(s.id) !== String(showId)));
    } catch (e) {
      console.error("handleCancelShow failed:", e);
      alert("Failed to cancel show.");
    }
  };

  const handleEndShow = (endedShow: ShowData, soldItems: any[]) => {
    const showWithResults = { ...endedShow, soldItems, isLive: false };
    setScheduledShows((prev) => prev.filter((s) => s.id !== endedShow.id));
    setPastShows((prev) => [...prev, showWithResults as any]);
    setCurrentShow(null);
    setShowToEdit(null);
    setSellerHubInitialPage("shows");
    setInitialShowsTab("past");
    setSellerHubKey(Date.now());
    navigate("seller-hub");
  };

  const resendVerification = async () => {
    const u = auth.currentUser;
    if (u) {
      try {
        await sendEmailVerification(u);
      } catch (e) {
        console.error("sendEmailVerification failed", e);
      }
    }
  };
  const currentEmail = auth.currentUser?.email ?? "";

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        if (isLoggedIn) {
          return (
            <>
        <Header
          onNavigate={navigate}
          isLoggedIn={isLoggedIn}
          onLoginClick={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          onSellClick={handleSellerOnboardingOpen}
          onNavigateToSellerHub={handleNavigateToSellerHub}
          currentPage={currentPage}
          onBack={handleBackNav}
          darkMode
        />
              {isLoadingShows ? (
                <div className="flex justify-center items-center h-[calc(100vh-200px)]">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500" />
                </div>
              ) : (
                <BuyerHomePage
                  shows={scheduledShows}
                  onJoinShow={handleJoinShow}
                  onSwitchToSelling={handleSellerOnboardingOpen}
                  onNavigate={navigate}
                  filters={activeFilters}
                  setFilters={setActiveFilters}
                />
              )}
              <Footer onNavigate={navigate} />
            </>
          );
        }
        return (
          <LandingPage
            onLoginClick={() => setIsLoginModalOpen(true)}
            onBecomeSellerClick={handleSellerOnboardingOpen}
            onNavigate={navigate}
            onNavigateToSellerHub={handleNavigateToSellerHub}
            currentPage={currentPage}
          />
        );

      case "browse":
        return (
          <>
            <Header
              onNavigate={navigate}
              isLoggedIn={isLoggedIn}
              onLoginClick={() => setIsLoginModalOpen(true)}
              onLogout={handleLogout}
              onSellClick={handleSellerOnboardingOpen}
              onNavigateToSellerHub={handleNavigateToSellerHub}
              currentPage={currentPage}
            />
            <BrowsePage onSelectCategory={handleCategorySelect} />
            <Footer onNavigate={navigate} />
          </>
        );

      case "settings":
        return (
          <>
            <Header
              onNavigate={navigate}
              isLoggedIn={isLoggedIn}
              onLoginClick={() => {}}
              onLogout={handleLogout}
              onSellClick={handleSellerOnboardingOpen}
              onNavigateToSellerHub={handleNavigateToSellerHub}
              currentPage={currentPage}
            />
            <AccountSettingsPage
              isSeller={isSeller}
              onNavigate={navigate}
              onSellerHubClick={handleSellerOnboardingOpen}
            />
          </>
        );

      case "profile":
        return (
          <>
            <Header
              onNavigate={navigate}
              isLoggedIn={isLoggedIn}
              onLoginClick={() => setIsLoginModalOpen(true)}
              onLogout={handleLogout}
              onSellClick={handleSellerOnboardingOpen}
              onNavigateToSellerHub={handleNavigateToSellerHub}
              currentPage={currentPage}
            />
            <UserProfilePage onNavigate={navigate} username={viewedUsername} />
            <Footer onNavigate={navigate} />
          </>
        );

      case "messages":
        return (
          <>
            <Header
              onNavigate={navigate}
              isLoggedIn={isLoggedIn}
              onLoginClick={() => setIsLoginModalOpen(true)}
              onLogout={handleLogout}
              onSellClick={handleSellerOnboardingOpen}
              onNavigateToSellerHub={handleNavigateToSellerHub}
              currentPage={currentPage}
            />
            <MessagesPage onNavigate={navigate} activeChatUser={chattingWith} />
          </>
        );

      case "seller-hub":
        return (
          <VerifyEmailGate
            email={currentEmail}
            emailVerified={emailVerified}
            onSignOut={handleLogout}
            onResent={resendVerification}
          >
            {sellerOnboardingComplete === true ? (
              <SellerHubPage
                key={sellerHubKey}
                onNavigate={navigate}
                onOpenShow={handleOpenShow}
                showToEdit={showToEdit}
                scheduledShows={scheduledShows}
                pastShows={pastShows as any}
                onScheduleShow={handleScheduleShow}
                onUpdateShow={handleUpdateShow}
                onCancelShow={handleCancelShow}
                initialPage={sellerHubInitialPage}
                initialShowsTab={initialShowsTab}
              />
            ) : (
              <BecomeSellerPage
                onComplete={() => {
                  setSellerOnboardingComplete(true);
                  // Re-render this same route as the SellerHub once flagged.
                }}
                onCancel={() => navigate("home")}
              />
            )}
          </VerifyEmailGate>
        );

      case "live_room":
        return (
          <VerifyEmailGate
            email={currentEmail}
            emailVerified={emailVerified}
            onSignOut={handleLogout}
            onResent={resendVerification}
          >
            <LiveRoomPage
              show={currentShow}
              onExit={() => navigate("seller-hub")}
              onEditShow={handleEditShowFromLiveRoom}
              onEndShow={handleEndShow}
              onGoLive={handleGoLive}
              onNavigate={navigate}
            />
          </VerifyEmailGate>
        );

      case "buyer_live_room":
        return (
          <BuyerLiveRoomPage
            show={viewingShow}
            onExit={() => navigate("home")}
            onNavigate={navigate}
          />
        );

      case "about":
        return (
          <>
            <Header
              onNavigate={navigate}
              isLoggedIn={isLoggedIn}
              onLoginClick={() => setIsLoginModalOpen(true)}
              onLogout={handleLogout}
              onSellClick={handleSellerOnboardingOpen}
              onNavigateToSellerHub={handleNavigateToSellerHub}
              currentPage={currentPage}
            />
            <AboutUsPage />
            <Footer onNavigate={navigate} />
          </>
        );

      case "help-center":
        return <HelpCenterPage onNavigate={navigate} />;

      case "help-category":
        return <FaqCategoryPage categoryKey={helpCategory} onNavigate={navigate} />;

      case "help-article":
        return (
          <FaqArticlePage
            categoryKey={helpCategory}
            articleKey={helpArticle}
            onNavigate={navigate}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen" style={{ position: "relative" }}>
      {authNotice && (
        <div className="bg-yellow-400 text-black text-center py-2 px-4 text-sm">
          {authNotice}
        </div>
      )}

      {digilockerNotice && (
        <div
          className="text-center py-3 px-4 text-sm flex items-center justify-center gap-3"
          style={{
            background: digilockerNotice.kind === "success" ? "#DCFCE7" : "#FEE2E2",
            color: digilockerNotice.kind === "success" ? "#14532D" : "#7F1D1D",
            borderBottom: `1.5px solid ${digilockerNotice.kind === "success" ? "#86EFAC" : "#FCA5A5"}`,
          }}
        >
          <span>{digilockerNotice.message}</span>
          <button
            onClick={() => setDigilockerNotice(null)}
            className="font-bold ml-2"
            style={{ color: "inherit", opacity: 0.7 }}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {renderPage()}

      {verifyParams && (
        <VerifyEmailCard
          userId={verifyParams.userId}
          secret={verifyParams.secret}
          onDone={() => {
            setVerifyParams(null);
            setIsLoginModalOpen(true);
          }}
        />
      )}

      {resetParams && (
        <ResetPasswordCard
          userId={resetParams.userId}
          secret={resetParams.secret}
          onDone={() => {
            setResetParams(null);
            setIsLoginModalOpen(true);
          }}
        />
      )}

      <LoginModalV2
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        openInForgot={false}
      />

      <OnboardingModal
        isOpen={isOnboardingModalOpen}
        onComplete={(prefs) => {
          setUserPreferences(prefs);
          setIsOnboardingModalOpen(false);
        }}
      />

      <SellerOnboardingModal
        isOpen={isSellerOnboardingOpen}
        onClose={() => setIsSellerOnboardingOpen(false)}
        onComplete={handleSellerOnboardingComplete}
      />
    </div>
  );
};

export default App;
