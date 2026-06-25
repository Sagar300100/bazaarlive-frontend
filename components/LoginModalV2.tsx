import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Loader2, X, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import {
  login as apiLogin,
  register as apiRegister,
  requestPasswordReset as apiRequestReset,
} from "../services/api";

/* ══════════════════════════════════════════════
   LoginModalV2 — modern auth with RHF + Zod
   Signup/reset use Firebase email links — no custom OTP layer.
   ══════════════════════════════════════════════ */

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user?: { id: string | number; email: string }) => void;
  openInForgot?: boolean;
}

type Step = "login" | "register" | "forgot" | "check-email";
type CheckEmailFlow = "register" | "reset";

/* ── Zod schemas ── */
const loginSchema = z.object({
  email:    z.string().email("Enter a valid email"),
  password: z.string().min(6, "Minimum 6 characters"),
});
type LoginVals = z.infer<typeof loginSchema>;

const registerSchema = z.object({
  name:     z.string().min(2, "Enter your name"),
  email:    z.string().email("Enter a valid email"),
  password: z.string()
    .min(8, "Minimum 8 characters")
    .regex(/[A-Z]/, "Needs an uppercase letter")
    .regex(/[0-9]/, "Needs a number"),
});
type RegisterVals = z.infer<typeof registerSchema>;

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email"),
});
type ForgotVals = z.infer<typeof forgotSchema>;

const LoginModalV2: React.FC<Props> = ({ isOpen, onClose, onLoginSuccess, openInForgot }) => {
  const [step, setStep]         = useState<Step>(openInForgot ? "forgot" : "login");
  const [sentTo, setSentTo]     = useState<{ email: string; flow: CheckEmailFlow } | null>(null);
  const [busy,    setBusy]      = useState(false);
  const [error,   setError]     = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(openInForgot ? "forgot" : "login");
      setError(null);
      setSentTo(null);
    }
  }, [isOpen, openInForgot]);

  /* ── Lock body scroll while open ── */
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  if (!isOpen) return null;

  /* ──────────────────────────────────────────
     HANDLERS
     ────────────────────────────────────────── */
  const handleLogin = async (data: LoginVals) => {
    setBusy(true); setError(null);
    try {
      const u = await apiLogin(data.email, data.password);
      onLoginSuccess(u);
      onClose();
    } catch (e: any) {
      setError(e?.message || "Login failed. Check your email and password.");
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async (data: RegisterVals) => {
    setBusy(true); setError(null);
    try {
      await apiRegister(data.email, data.password, data.name);
      // apiRegister already calls Firebase sendEmailVerification.
      // Show a single "check your email" panel — no custom OTP step.
      setSentTo({ email: data.email, flow: "register" });
      setStep("check-email");
    } catch (e: any) {
      setError(e?.message || "Could not create account.");
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async (data: ForgotVals) => {
    setBusy(true); setError(null);
    try {
      await apiRequestReset(data.email);
      setSentTo({ email: data.email, flow: "reset" });
      setStep("check-email");
    } catch (e: any) {
      setError(e?.message || "Could not send reset email.");
    } finally {
      setBusy(false);
    }
  };

  /* ──────────────────────────────────────────
     OVERLAY + CARD
     ────────────────────────────────────────── */
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(7,13,27,0.72)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[420px] overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
          borderRadius: 24,
          boxShadow: "0 30px 100px rgba(15,42,82,0.45), 0 1px 0 rgba(255,255,255,0.6) inset",
          fontFamily: "Rubik, system-ui, sans-serif",
        }}
      >
        {/* aurora top accent */}
        <div style={{
          position: "absolute", top: -120, left: -80, right: -80, height: 220,
          background: "radial-gradient(ellipse at center, rgba(123,184,255,0.55) 0%, transparent 70%)",
          filter: "blur(30px)", pointerEvents: "none",
        }} />

        {/* close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 rounded-full p-1.5 transition hover:bg-slate-100"
          style={{ color: "#0F2A52" }}
        >
          <X size={18} />
        </button>

        <div style={{ position: "relative", padding: "40px 32px 32px" }}>
          <AnimatePresence mode="wait">
            {step === "login"       && <LoginPanel      key="login"       onSubmit={handleLogin}    onSwitch={(s) => { setStep(s); setError(null); }} busy={busy} error={error} />}
            {step === "register"    && <RegisterPanel   key="register"    onSubmit={handleRegister} onSwitch={(s) => { setStep(s); setError(null); }} busy={busy} error={error} />}
            {step === "forgot"      && <ForgotPanel     key="forgot"      onSubmit={handleForgot}   onSwitch={(s) => { setStep(s); setError(null); }} busy={busy} error={error} />}
            {step === "check-email" && <CheckEmailPanel key="check-email" email={sentTo?.email || ""} flow={sentTo?.flow || "register"} onDone={onClose} onBack={() => { setStep(sentTo?.flow === "register" ? "register" : "forgot"); setError(null); }} />}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   SHARED  styles + components
   ══════════════════════════════════════════════ */
const fadeSlide = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -16 },
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
};

const Title: React.FC<{ eyebrow?: string; title: string; sub?: string }> = ({ eyebrow, title, sub }) => (
  <div className="text-center" style={{ marginBottom: 26 }}>
    {eyebrow && (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, background: "rgba(43,108,184,0.08)", color: "#2B6CB8", fontSize: 11, fontWeight: 700, letterSpacing: 1.4, marginBottom: 14 }}>
        <Sparkles size={12} /> {eyebrow}
      </div>
    )}
    <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 28, color: "#0F2A52", letterSpacing: -0.5, lineHeight: 1.15, margin: 0 }}>{title}</h2>
    {sub && <p style={{ marginTop: 8, fontSize: 14, color: "#475569", lineHeight: 1.5 }}>{sub}</p>}
  </div>
);

const Field: React.FC<{
  Icon: React.ComponentType<any>;
  type?: string;
  placeholder: string;
  error?: string;
  registerProps: any;
  autoFocus?: boolean;
}> = ({ Icon, type = "text", placeholder, error, registerProps, autoFocus }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ position: "relative" }}>
      <Icon size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: error ? "#F43F5E" : "#94A3B8", pointerEvents: "none" }} />
      <input
        {...registerProps}
        type={type}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        style={{
          width: "100%", padding: "13px 14px 13px 40px",
          borderRadius: 12,
          border: `1.5px solid ${error ? "#F43F5E" : "#E2E8F0"}`,
          background: "white", color: "#0F2A52",
          fontSize: 14, fontWeight: 500, outline: "none",
          transition: "border-color 180ms ease, box-shadow 180ms ease",
        }}
        onFocus={(e) => { if (!error) { e.currentTarget.style.borderColor = "#2B6CB8"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(43,108,184,0.12)"; } }}
        onBlur={(e)  => { e.currentTarget.style.borderColor = error ? "#F43F5E" : "#E2E8F0"; e.currentTarget.style.boxShadow = "none"; }}
      />
    </div>
    {error && <div style={{ marginTop: 6, fontSize: 12, color: "#F43F5E", paddingLeft: 4 }}>{error}</div>}
  </div>
);

const PrimaryBtn: React.FC<{ children: React.ReactNode; type?: "button" | "submit"; busy?: boolean; onClick?: () => void }> = ({ children, type = "submit", busy, onClick }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={busy}
    style={{
      width: "100%", padding: "13px 18px",
      borderRadius: 12, border: "none",
      background: busy ? "#7BB8FF" : "linear-gradient(135deg, #2B6CB8, #1A4B8C)",
      color: "white", fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 14,
      letterSpacing: 0.2, cursor: busy ? "wait" : "pointer",
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
      boxShadow: "0 10px 30px rgba(43,108,184,0.35)",
      transition: "transform 180ms ease, box-shadow 180ms ease",
    }}
    onMouseEnter={(e) => { if (!busy) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 14px 36px rgba(43,108,184,0.5)"; } }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(43,108,184,0.35)"; }}
  >
    {busy ? <Loader2 size={16} className="lm-spin" /> : null}
    {children}
  </button>
);

const SwitchLink: React.FC<{ children: React.ReactNode; onClick: () => void }> = ({ children, onClick }) => (
  <button onClick={onClick} type="button" style={{ background: "transparent", border: "none", color: "#2B6CB8", fontWeight: 700, fontSize: 13, cursor: "pointer", padding: 0 }}>
    {children}
  </button>
);

const ErrorBanner: React.FC<{ msg: string }> = ({ msg }) => (
  <motion.div
    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
    style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.25)", color: "#BE123C", padding: "10px 12px", borderRadius: 10, fontSize: 13, marginBottom: 14, lineHeight: 1.4 }}
  >
    {msg}
  </motion.div>
);

/* ══════════════════════════════════════════════
   LOGIN PANEL
   ══════════════════════════════════════════════ */
const LoginPanel: React.FC<{ onSubmit: (v: LoginVals) => void; onSwitch: (s: Step) => void; busy: boolean; error: string | null }> = ({ onSubmit, onSwitch, busy, error }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginVals>({
    resolver: zodResolver(loginSchema),
  });
  return (
    <motion.form {...fadeSlide} onSubmit={handleSubmit(onSubmit)}>
      <Title eyebrow="WELCOME BACK" title="Sign in to Any & All" sub="Bid live. Win live. Get it shipped." />
      {error && <ErrorBanner msg={error} />}
      <Field Icon={Mail}  type="email"    placeholder="Email address" error={errors.email?.message}    registerProps={register("email")}    autoFocus />
      <Field Icon={Lock}  type="password" placeholder="Password"      error={errors.password?.message} registerProps={register("password")} />
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
        <SwitchLink onClick={() => onSwitch("forgot")}>Forgot password?</SwitchLink>
      </div>
      <PrimaryBtn busy={busy}>
        Sign In <ArrowRight size={16} />
      </PrimaryBtn>
      <div style={{ textAlign: "center", marginTop: 22, fontSize: 13, color: "#475569" }}>
        New to Any &amp; All? <SwitchLink onClick={() => onSwitch("register")}>Create an account</SwitchLink>
      </div>
    </motion.form>
  );
};

/* ══════════════════════════════════════════════
   REGISTER PANEL
   ══════════════════════════════════════════════ */
const RegisterPanel: React.FC<{ onSubmit: (v: RegisterVals) => void; onSwitch: (s: Step) => void; busy: boolean; error: string | null }> = ({ onSubmit, onSwitch, busy, error }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterVals>({
    resolver: zodResolver(registerSchema),
  });
  return (
    <motion.form {...fadeSlide} onSubmit={handleSubmit(onSubmit)}>
      <Title eyebrow="JOIN" title="Create your account" sub="Get early access to India's first live-auction marketplace." />
      {error && <ErrorBanner msg={error} />}
      <Field Icon={User}  placeholder="Full name"      error={errors.name?.message}     registerProps={register("name")}     autoFocus />
      <Field Icon={Mail}  type="email"    placeholder="Email address" error={errors.email?.message}    registerProps={register("email")} />
      <Field Icon={Lock}  type="password" placeholder="Create a password" error={errors.password?.message} registerProps={register("password")} />
      <PrimaryBtn busy={busy}>
        Create Account <ArrowRight size={16} />
      </PrimaryBtn>
      <div style={{ textAlign: "center", marginTop: 22, fontSize: 13, color: "#475569" }}>
        Already have an account? <SwitchLink onClick={() => onSwitch("login")}>Sign in</SwitchLink>
      </div>
    </motion.form>
  );
};

/* ══════════════════════════════════════════════
   FORGOT PANEL
   ══════════════════════════════════════════════ */
const ForgotPanel: React.FC<{ onSubmit: (v: ForgotVals) => void; onSwitch: (s: Step) => void; busy: boolean; error: string | null }> = ({ onSubmit, onSwitch, busy, error }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotVals>({
    resolver: zodResolver(forgotSchema),
  });
  return (
    <motion.form {...fadeSlide} onSubmit={handleSubmit(onSubmit)}>
      <Title eyebrow="RECOVER" title="Reset your password" sub="We'll send a 6-digit code to your email." />
      {error && <ErrorBanner msg={error} />}
      <Field Icon={Mail} type="email" placeholder="Email address" error={errors.email?.message} registerProps={register("email")} autoFocus />
      <PrimaryBtn busy={busy}>
        Send Code <ArrowRight size={16} />
      </PrimaryBtn>
      <div style={{ textAlign: "center", marginTop: 22, fontSize: 13, color: "#475569" }}>
        Remembered? <SwitchLink onClick={() => onSwitch("login")}>Back to sign in</SwitchLink>
      </div>
    </motion.form>
  );
};

/* ══════════════════════════════════════════════
   CHECK-EMAIL PANEL — confirmation after register/reset
   We rely on Firebase email links, so no code-entry UI.
   ══════════════════════════════════════════════ */
const CheckEmailPanel: React.FC<{ email: string; flow: CheckEmailFlow; onDone: () => void; onBack: () => void }> = ({ email, flow, onDone, onBack }) => (
  <motion.div {...fadeSlide}>
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
      <div style={{
        width: 72, height: 72, borderRadius: 24,
        background: "linear-gradient(135deg,#E0EFFF,#F8FAFC)",
        border: "1.5px solid rgba(43,108,184,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 8px 24px rgba(43,108,184,0.18)",
      }}>
        <Mail size={32} style={{ color: "#2B6CB8" }} />
      </div>
    </div>

    <Title
      eyebrow={flow === "register" ? "ALMOST DONE" : "PASSWORD RESET"}
      title="Check your inbox"
      sub={
        flow === "register"
          ? `We sent a verification link to ${email || "your email"}. Click it to activate your account.`
          : `We sent a reset link to ${email || "your email"}. Click it to set a new password.`
      }
    />

    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: "rgba(34,197,94,0.08)",
      border: "1.5px solid rgba(34,197,94,0.2)",
      borderRadius: 12, padding: "10px 14px",
      fontSize: 13, color: "#15803D", marginBottom: 22,
    }}>
      <CheckCircle2 size={16} />
      <span>Link expires in 1 hour. Check spam if you don't see it.</span>
    </div>

    <PrimaryBtn type="button" busy={false} onClick={onDone}>
      Got it <ArrowRight size={16} />
    </PrimaryBtn>

    <div style={{ textAlign: "center", marginTop: 22, fontSize: 13, color: "#475569" }}>
      Wrong email? <SwitchLink onClick={onBack}>Try a different email</SwitchLink>
    </div>
  </motion.div>
);

/* ══════════════════════════════════════════════
   KEYFRAMES
   ══════════════════════════════════════════════ */
const styles = `
@keyframes lm-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes lm-caret { 50% { opacity: 0; } }
.lm-spin { animation: lm-spin 0.8s linear infinite; }
`;
if (typeof document !== "undefined" && !document.querySelector('style[data-lm-v2]')) {
  const tag = document.createElement('style');
  tag.setAttribute('data-lm-v2', '1');
  tag.textContent = styles;
  document.head.appendChild(tag);
}

export default LoginModalV2;
