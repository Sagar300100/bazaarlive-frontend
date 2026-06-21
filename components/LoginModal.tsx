import React, { useEffect, useState, useRef } from "react";
import {
  login as apiLogin,
  register as apiRegister,
  requestPasswordReset as apiRequestReset,
} from "../services/api";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user?: { id: string | number; email: string }) => void;
  openInForgot?: boolean;
}

type Panel = "login" | "register" | "forgot";

/* ── Fixed particle positions ── */
const DOTS = [
  { id:0,  x:12, y:18, size:2.5, delay:0,   dur:4.2 },
  { id:1,  x:28, y:8,  size:1.8, delay:0.7, dur:5.1 },
  { id:2,  x:45, y:25, size:3,   delay:1.3, dur:3.8 },
  { id:3,  x:68, y:12, size:2,   delay:0.4, dur:4.6 },
  { id:4,  x:82, y:38, size:2.5, delay:1.9, dur:5.3 },
  { id:5,  x:15, y:55, size:1.5, delay:0.9, dur:3.5 },
  { id:6,  x:35, y:72, size:2,   delay:1.6, dur:4.8 },
  { id:7,  x:58, y:65, size:3.5, delay:0.2, dur:6.1 },
  { id:8,  x:78, y:80, size:2,   delay:1.1, dur:4.3 },
  { id:9,  x:90, y:58, size:1.8, delay:0.5, dur:5.7 },
  { id:10, x:22, y:88, size:2.5, delay:1.8, dur:3.9 },
  { id:11, x:62, y:90, size:1.5, delay:0.3, dur:5.5 },
];

const STATS = [
  { icon: "🔴", val: "340+",  label: "Shows Live" },
  { icon: "🎥", val: "2.1K+", label: "Sellers Online" },
  { icon: "🛍️", val: "50K+",  label: "Shoppers" },
];

const AVATARS = [
  { init: "A", bg: "#2B6CB8" },
  { init: "P", bg: "#1A4B8C" },
  { init: "R", bg: "#3B7DD8" },
  { init: "S", bg: "#4A7AB5" },
  { init: "K", bg: "#1B3A6B" },
];

/* ── Floating-label input ── */
const FInput: React.FC<{
  type: string; label: string; value: string;
  onChange: (v: string) => void;
  required?: boolean; autoFocus?: boolean;
  autoComplete?: string; minLength?: number;
  animDelay?: number;
}> = ({ type, label, value, onChange, required, autoFocus, autoComplete, minLength, animDelay = 0 }) => {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;
  return (
    <div className="relative" style={{ animation: `lm-slideUp 0.45s cubic-bezier(0.34,1.56,0.64,1) ${animDelay}ms both` }}>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        required={required} autoFocus={autoFocus}
        autoComplete={autoComplete} minLength={minLength}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="w-full px-4 pt-6 pb-2.5 rounded-2xl text-[#1B3A6B] text-sm font-medium outline-none"
        style={{
          background: focused ? "white" : "rgba(255,255,255,0.65)",
          border: `2px solid ${focused ? "#2B6CB8" : "rgba(43,108,184,0.18)"}`,
          boxShadow: focused
            ? "0 0 0 4px rgba(43,108,184,0.13), 0 4px 20px rgba(43,108,184,0.1)"
            : "0 2px 8px rgba(43,108,184,0.04)",
          transition: "all 0.22s cubic-bezier(0.22,1,0.36,1)",
        }}
      />
      <label
        className="absolute left-4 pointer-events-none font-semibold"
        style={{
          top: lifted ? "7px" : "50%",
          transform: lifted ? "none" : "translateY(-50%)",
          fontSize: lifted ? "10px" : "13px",
          color: focused ? "#2B6CB8" : "#4A7AB5",
          letterSpacing: lifted ? "0.06em" : "normal",
          textTransform: lifted ? "uppercase" : "none",
          transition: "all 0.2s ease",
        }}
      >
        {label}
      </label>
    </div>
  );
};

/* ── Spinner SVG ── */
const Spinner = () => (
  <svg style={{ animation: "lm-spin 0.7s linear infinite" }} width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity=".25"/>
    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen, onClose, onLoginSuccess, openInForgot,
}) => {
  const [panel, setPanel]       = useState<Panel>("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible]   = useState(false);
  const [busy, setBusy]         = useState(false);
  const [err, setErr]           = useState<string | null>(null);
  const [okMsg, setOkMsg]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setVisible(true), 10);
      if (openInForgot) setPanel("forgot");
    } else {
      setVisible(false);
      setTimeout(() => {
        setSuccess(false); setEmail(""); setPassword("");
        setErr(null); setOkMsg(null);
      }, 400);
    }
  }, [isOpen, openInForgot]);

  useEffect(() => { setErr(null); setOkMsg(null); setBusy(false); }, [panel, isOpen]);

  if (!isOpen) return null;

  /* ── Magnetic button ── */
  const onBtnMove = (e: React.MouseEvent) => {
    const btn = btnRef.current;
    if (!btn || busy) return;
    const r = btn.getBoundingClientRect();
    const x = (e.clientX - r.left  - r.width  / 2) * 0.18;
    const y = (e.clientY - r.top   - r.height / 2) * 0.18;
    btn.style.transform  = `translate(${x}px, ${y}px) scale(1.02)`;
    btn.style.boxShadow  = `0 ${16 - y * 0.3}px 40px rgba(43,108,184,0.52)`;
  };
  const onBtnLeave = () => {
    const btn = btnRef.current;
    if (btn) { btn.style.transform = ""; btn.style.boxShadow = "0 8px 28px rgba(43,108,184,0.35)"; }
  };

  /* ── Handlers ── */
  async function onSubmitLogin(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setBusy(true);
    try {
      const u = await apiLogin(email, password);
      setSuccess(true);
      setTimeout(() => { onLoginSuccess(u); onClose(); }, 1100);
    } catch (ex: any) { setErr(ex?.message || "Invalid credentials"); setBusy(false); }
  }

  async function onSubmitRegister(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setBusy(true);
    try {
      await apiRegister(email, password);
      setOkMsg("Account created! Check your email to verify."); setPassword(""); setPanel("login");
    } catch (ex: any) { setErr(ex?.message || "Registration failed"); }
    finally { setBusy(false); }
  }

  async function onRequestReset(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setBusy(true);
    try { await apiRequestReset(email); setOkMsg("Reset link sent! Check your inbox."); }
    catch  { setOkMsg("Reset link sent! Check your inbox."); }
    finally { setBusy(false); }
  }

  const formTitle = panel === "login" ? "Welcome back" : panel === "register" ? "Join Any & All" : "Forgot password?";
  const formSub   = panel === "login" ? "Sign in to shop live" : panel === "register" ? "Create your free account" : "We'll send a secure link";

  /* shared submit-button JSX builder */
  const mkBtn = (label: string, busyLabel: string) => (
    <button
      ref={btnRef} type="submit" disabled={busy}
      onMouseMove={onBtnMove} onMouseLeave={onBtnLeave}
      className="lm-shimmer-btn w-full py-3.5 rounded-2xl font-bold text-white text-sm"
      style={{ boxShadow:"0 8px 28px rgba(43,108,184,0.35)", transition:"transform 0.15s, box-shadow 0.22s, background-position 0.5s" }}
    >
      {busy
        ? <span className="flex items-center justify-center gap-2"><Spinner />{busyLabel}</span>
        : label}
    </button>
  );

  return (
    <>
      <style>{`
        @keyframes lm-cardIn {
          from { opacity:0; transform: translateY(56px) scale(0.91); filter:blur(6px); }
          to   { opacity:1; transform: translateY(0)    scale(1);    filter:blur(0);  }
        }
        @keyframes lm-slideUp {
          from { opacity:0; transform: translateY(16px); }
          to   { opacity:1; transform: translateY(0); }
        }
        @keyframes lm-panelSlide {
          from { opacity:0; transform: translateX(22px) scale(0.98); }
          to   { opacity:1; transform: translateX(0)    scale(1); }
        }
        @keyframes lm-orb1 {
          0%,100% { transform: translate(0,0)        scale(1);    }
          50%     { transform: translate(20px,-24px)  scale(1.1);  }
        }
        @keyframes lm-orb2 {
          0%,100% { transform: translate(0,0)        scale(1);    }
          50%     { transform: translate(-16px,18px)  scale(0.92); }
        }
        @keyframes lm-orb3 {
          0%,100% { transform: translate(0,0)       scale(1);    }
          50%     { transform: translate(12px,20px)  scale(1.06); }
        }
        @keyframes lm-dot {
          0%,100% { transform:translate(0,0);      opacity:0.45; }
          50%     { transform:translate(7px,-10px); opacity:0.9;  }
        }
        @keyframes lm-shimmer {
          0%   { background-position:-200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes lm-spin { to { transform:rotate(360deg); } }
        @keyframes lm-fadeMsg {
          from { opacity:0; transform:translateY(-8px) scale(0.97); }
          to   { opacity:1; transform:translateY(0)    scale(1);    }
        }
        @keyframes lm-statIn {
          from { opacity:0; transform:translateX(-18px); }
          to   { opacity:1; transform:translateX(0);     }
        }
        @keyframes lm-avatarIn {
          from { opacity:0; transform:scale(0) rotate(-25deg); }
          to   { opacity:1; transform:scale(1) rotate(0);      }
        }
        @keyframes lm-checkPop {
          0%   { transform:scale(0) rotate(-30deg); opacity:0; }
          55%  { transform:scale(1.3) rotate(8deg);  opacity:1; }
          100% { transform:scale(1) rotate(0);       opacity:1; }
        }
        @keyframes lm-ring {
          0%   { transform:scale(1); opacity:0.8; }
          100% { transform:scale(3); opacity:0;   }
        }
        @keyframes lm-bar {
          from { width:0%; }
          to   { width:100%; }
        }
        .lm-shimmer-btn {
          background: linear-gradient(135deg,#2B6CB8 0%,#5B9BD5 40%,#1A4B8C 65%,#2B6CB8 100%);
          background-size: 300% 100%;
        }
        .lm-shimmer-btn:hover:not(:disabled) { background-position:right center; }
        .lm-shimmer-btn:active:not(:disabled) { transform:scale(0.97) !important; }
      `}</style>

      {/* ── Backdrop ── */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50"
        style={{
          background: "radial-gradient(ellipse 110% 80% at 28% 42%, rgba(26,75,140,0.9) 0%, rgba(6,11,32,0.97) 100%)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.35s ease",
        }}
      />

      {/* ── Modal ── */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full flex overflow-hidden"
          style={{
            maxWidth: 860,
            borderRadius: 28,
            animation: visible ? "lm-cardIn 0.55s cubic-bezier(0.22,1,0.36,1) both" : "none",
            boxShadow: "0 48px 120px rgba(6,11,32,0.75), 0 12px 44px rgba(43,108,184,0.28), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >

          {/* ══ LEFT: Blue hero panel (md+) ══ */}
          <div
            className="relative hidden md:flex flex-col justify-between overflow-hidden text-white flex-shrink-0"
            style={{
              width: 340,
              background: "linear-gradient(155deg,#090F22 0%,#102040 28%,#1A4B8C 65%,#2B6CB8 100%)",
              padding: "36px 28px 30px",
            }}
          >
            {/* Orbs */}
            <div className="absolute rounded-full pointer-events-none" style={{ width:310, height:310, top:"-22%", left:"-28%", background:"radial-gradient(circle,rgba(59,125,216,0.32) 0%,transparent 70%)", animation:"lm-orb1 8s ease-in-out infinite", filter:"blur(26px)" }} />
            <div className="absolute rounded-full pointer-events-none" style={{ width:230, height:230, bottom:"-5%", right:"-18%", background:"radial-gradient(circle,rgba(43,108,184,0.44) 0%,transparent 70%)", animation:"lm-orb2 10s ease-in-out infinite", filter:"blur(30px)" }} />
            <div className="absolute rounded-full pointer-events-none" style={{ width:160, height:160, top:"36%", right:"2%", background:"radial-gradient(circle,rgba(91,155,213,0.28) 0%,transparent 70%)", animation:"lm-orb3 6.5s ease-in-out infinite 1.5s", filter:"blur(20px)" }} />

            {/* Particle dots */}
            {DOTS.map(d => (
              <div key={d.id} className="absolute rounded-full pointer-events-none"
                style={{ width:d.size, height:d.size, left:`${d.x}%`, top:`${d.y}%`, background:"rgba(255,255,255,0.55)", animation:`lm-dot ${d.dur}s ease-in-out ${d.delay}s infinite alternate` }} />
            ))}

            {/* Grid */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ backgroundImage:"linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize:"36px 36px" }} />

            {/* Close */}
            <button onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all"
              style={{ background:"rgba(255,255,255,0.1)" }}
              onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.22)")}
              onMouseLeave={e=>(e.currentTarget.style.background="rgba(255,255,255,0.1)")}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>

            {/* Logo + headline */}
            <div className="relative z-10">
              <div style={{ animation:"lm-slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both" }}>
                <img src="/logo.png" alt="Any & All" className="h-12 w-auto object-contain drop-shadow-2xl" />
              </div>
              <div style={{ animation:"lm-slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.18s both", marginTop:18 }}>
                <h2 className="text-xl font-extrabold leading-snug tracking-tight">India's #1<br />Live Commerce</h2>
                <p className="text-white/60 text-xs mt-2 leading-relaxed">Stream, bid & win in real time.<br />Built for UPI-first shoppers.</p>
              </div>
            </div>

            {/* Stats */}
            <div className="relative z-10 space-y-2.5 my-5">
              {STATS.map((s, i) => (
                <div key={s.label}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-2xl"
                  style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.11)", backdropFilter:"blur(10px)", animation:`lm-statIn 0.5s cubic-bezier(0.34,1.56,0.64,1) ${0.28+i*0.08}s both` }}>
                  <span className="text-lg leading-none">{s.icon}</span>
                  <div>
                    <p className="font-extrabold text-white text-sm leading-none">{s.val}</p>
                    <p className="text-white/50 text-xs mt-0.5">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Social proof + live badge */}
            <div className="relative z-10" style={{ animation:"lm-slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.55s both" }}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex" style={{ marginRight:4 }}>
                  {AVATARS.map((av, i) => (
                    <div key={i}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold border-2"
                      style={{ background:av.bg, borderColor:"#102040", marginLeft: i === 0 ? 0 : -10, position:"relative", zIndex: AVATARS.length - i, animation:`lm-avatarIn 0.4s cubic-bezier(0.34,1.56,0.64,1) ${0.6+i*0.05}s both` }}>
                      {av.init}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-white font-bold text-xs">50,000+ shoppers</p>
                  <p className="text-white/45 text-xs">joined this month</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.22)" }}>
                <div className="relative flex-shrink-0" style={{ width:10, height:10 }}>
                  <div className="absolute inset-0 rounded-full" style={{ background:"rgba(239,68,68,0.6)", animation:"lm-ring 1.6s ease-out infinite" }} />
                  <div className="absolute inset-0 rounded-full bg-red-500" />
                </div>
                <span className="text-red-300 text-xs font-bold tracking-wide">340 shows live now</span>
              </div>
            </div>
          </div>

          {/* ══ RIGHT: Form panel ══ */}
          <div
            className="flex-1 flex flex-col relative"
            style={{ background:"#F4F0E8", padding:"32px 28px 28px" }}
          >
            {/* Mobile header */}
            <div className="flex items-center justify-between mb-5 md:hidden">
              <img src="/logo.png" alt="Any & All" className="h-9 w-auto object-contain" />
              <button onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background:"rgba(43,108,184,0.1)" }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="#2B6CB8" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>

            {/* Desktop close (top-right of form panel) */}
            <button onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full hidden md:flex items-center justify-center z-10 transition-all"
              style={{ background:"rgba(43,108,184,0.08)" }}
              onMouseEnter={e=>(e.currentTarget.style.background="rgba(43,108,184,0.16)")}
              onMouseLeave={e=>(e.currentTarget.style.background="rgba(43,108,184,0.08)")}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="#1B3A6B" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>

            {/* Heading */}
            <div style={{ animation:"lm-slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.15s both" }}>
              <h3 className="text-2xl font-extrabold text-[#1B3A6B] tracking-tight">{formTitle}</h3>
              <p className="text-[#4A7AB5] text-sm mt-1">{formSub}</p>
            </div>

            {/* Tab switcher */}
            {panel !== "forgot" && (
              <div className="flex mt-5 p-1 rounded-2xl"
                style={{ background:"rgba(43,108,184,0.08)", animation:"lm-slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.22s both" }}>
                {(["login","register"] as Panel[]).map(p => (
                  <button key={p} onClick={() => setPanel(p)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                    style={{
                      background: panel === p ? "white" : "transparent",
                      color: panel === p ? "#1B3A6B" : "#4A7AB5",
                      boxShadow: panel === p ? "0 2px 12px rgba(43,108,184,0.12)" : "none",
                    }}>
                    {p === "login" ? "Log In" : "Register"}
                  </button>
                ))}
              </div>
            )}

            {/* Messages */}
            {err && (
              <div className="mt-4 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2"
                style={{ animation:"lm-fadeMsg 0.3s ease both" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.5"/><path d="M8 5v3.5M8 10.5v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/></svg>
                {err}
              </div>
            )}
            {okMsg && (
              <div className="mt-4 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2"
                style={{ animation:"lm-fadeMsg 0.3s ease both" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#10b981" strokeWidth="1.5"/><path d="M5 8l2 2 4-4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {okMsg}
              </div>
            )}

            {/* ══ SUCCESS STATE ══ */}
            {success ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8"
                style={{ animation:"lm-panelSlide 0.4s ease both" }}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                  style={{ background:"linear-gradient(135deg,#2B6CB8,#1A4B8C)", boxShadow:"0 16px 48px rgba(43,108,184,0.5)", animation:"lm-checkPop 0.65s cubic-bezier(0.34,1.56,0.64,1) both" }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#1B3A6B] mt-2">Welcome back!</h3>
                <p className="text-[#4A7AB5] text-sm mt-1">Signing you in…</p>
                <div className="mt-4 w-36 h-1 rounded-full overflow-hidden" style={{ background:"rgba(43,108,184,0.12)" }}>
                  <div className="h-full rounded-full"
                    style={{ background:"linear-gradient(90deg,#2B6CB8,#5B9BD5)", animation:"lm-bar 1s cubic-bezier(0.22,1,0.36,1) both" }} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col flex-1">

                {/* ── LOGIN ── */}
                {panel === "login" && (
                  <form onSubmit={onSubmitLogin} className="flex flex-col flex-1 mt-5 space-y-3"
                    style={{ animation:"lm-panelSlide 0.32s cubic-bezier(0.22,1,0.36,1) both" }}>
                    <FInput type="email"    label="Email address" value={email}    onChange={setEmail}    required autoFocus autoComplete="email"            animDelay={0}  />
                    <FInput type="password" label="Password"      value={password} onChange={setPassword} required          autoComplete="current-password" animDelay={60} />
                    <div style={{ animation:"lm-slideUp 0.45s ease 120ms both", paddingTop:6 }}>
                      {mkBtn("Log In →", "Signing in…")}
                    </div>
                    <div className="text-center" style={{ animation:"lm-slideUp 0.45s ease 160ms both" }}>
                      <button type="button" onClick={() => setPanel("forgot")}
                        className="text-xs font-semibold transition-colors"
                        style={{ color:"#4A7AB5" }}
                        onMouseEnter={e=>(e.currentTarget.style.color="#2B6CB8")}
                        onMouseLeave={e=>(e.currentTarget.style.color="#4A7AB5")}>
                        Forgot your password?
                      </button>
                    </div>
                  </form>
                )}

                {/* ── REGISTER ── */}
                {panel === "register" && (
                  <form onSubmit={onSubmitRegister} className="flex flex-col flex-1 mt-5 space-y-3"
                    style={{ animation:"lm-panelSlide 0.32s cubic-bezier(0.22,1,0.36,1) both" }}>
                    <FInput type="email"    label="Email address"          value={email}    onChange={setEmail}    required autoFocus autoComplete="email"        animDelay={0}  />
                    <FInput type="password" label="Password (min 8 chars)" value={password} onChange={setPassword} required minLength={8} autoComplete="new-password" animDelay={60} />
                    <div style={{ animation:"lm-slideUp 0.45s ease 120ms both", paddingTop:6 }}>
                      {mkBtn("Create Account →", "Creating account…")}
                    </div>
                    <p className="text-center text-xs text-[#4A7AB5]"
                      style={{ animation:"lm-slideUp 0.45s ease 160ms both" }}>
                      By registering you agree to our Terms & Privacy Policy.
                    </p>
                  </form>
                )}

                {/* ── FORGOT ── */}
                {panel === "forgot" && (
                  <div className="flex flex-col flex-1 mt-6"
                    style={{ animation:"lm-panelSlide 0.32s cubic-bezier(0.22,1,0.36,1) both" }}>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background:"linear-gradient(135deg,#2B6CB8,#1A4B8C)", boxShadow:"0 6px 20px rgba(43,108,184,0.35)" }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                          <rect x="5" y="11" width="14" height="10" rx="2" stroke="white" strokeWidth="1.8"/>
                          <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-[#1B3A6B]">Forgot your password?</h4>
                        <p className="text-xs text-[#4A7AB5] mt-0.5">Enter your email for a reset link.</p>
                      </div>
                    </div>
                    <form onSubmit={onRequestReset} className="space-y-3">
                      <FInput type="email" label="Email address" value={email} onChange={setEmail} required autoFocus autoComplete="email" animDelay={0} />
                      {mkBtn("Send Reset Link →", "Sending…")}
                    </form>
                    <div className="text-center mt-4">
                      <button type="button" onClick={() => setPanel("login")}
                        className="text-xs font-semibold text-[#4A7AB5] hover:text-[#2B6CB8] transition-colors">
                        ← Back to Log In
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
};
