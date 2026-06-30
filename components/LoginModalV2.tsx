import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Lock, User, ArrowRight, Loader2, X, ShieldCheck, Sparkles,
  CheckCircle2, AtSign, Zap, Star, HelpCircle, Eye, EyeOff,
} from "lucide-react";
import {
  login as apiLogin,
  register as apiRegister,
  requestPasswordReset as apiRequestReset,
} from "../services/api";

/* ══════════════════════════════════════════════
   LoginModalV2 — auth flows with RHF + Zod
   Visual layer matches the dark navy / royal blue landing
   page. All handlers, schemas, panels, and the Step state
   machine are preserved from the previous rev.
   ══════════════════════════════════════════════ */

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user?: { id: string | number; email: string }) => void;
  openInForgot?: boolean;
}

type Step = "login" | "register" | "forgot" | "check-email";
type CheckEmailFlow = "register" | "reset";

/* ── Zod schemas (unchanged) ── */
const loginSchema = z.object({
  email:    z.string().email("Enter a valid email"),
  password: z.string().min(6, "Minimum 6 characters"),
});
type LoginVals = z.infer<typeof loginSchema>;

const registerSchema = z.object({
  name:     z.string().min(2, "Enter your name"),
  username: z.string()
    .min(3, "At least 3 characters")
    .max(20, "Max 20 characters")
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Letters, digits, underscore. Start with a letter.")
    .transform((v) => v.toLowerCase()),
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

/* ── Design tokens (mirror styles/tokens.ts but inline so the modal
       is self-contained and not dependent on the .brand-v2 wrapper) ── */
const T = {
  bgBase:    "#050A18",
  bgPanel:   "rgba(11,31,63,0.72)",
  bgPanel2:  "rgba(7,18,42,0.88)",
  bgInput:   "rgba(11,31,63,0.55)",
  bgInputFocus: "rgba(11,31,63,0.85)",
  navy:      "#0B1F3F",
  blue:      "#2B6CB8",
  blueGlow:  "#4A8FE5",
  blueBright:"#6BB6FF",
  white:     "#FFFFFF",
  mist:      "rgba(255,255,255,0.78)",
  mistSoft:  "rgba(255,255,255,0.55)",
  mistFaint: "rgba(255,255,255,0.40)",
  hairline:  "rgba(74,143,229,0.22)",
  hairlineStrong: "rgba(74,143,229,0.42)",
  liveRed:   "#E63946",
  fontDisplay: '"Cormorant Garamond", "PP Editorial New", Georgia, serif',
  fontBody:    '"Inter", "Söhne", system-ui, -apple-system, sans-serif',
  fontMono:    '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
};

const LoginModalV2: React.FC<Props> = ({ isOpen, onClose, onLoginSuccess, openInForgot }) => {
  const [step,    setStep]    = useState<Step>(openInForgot ? "forgot" : "login");
  const [sentTo,  setSentTo]  = useState<{ email: string; flow: CheckEmailFlow } | null>(null);
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(openInForgot ? "forgot" : "login");
      setError(null);
      setSentTo(null);
    }
  }, [isOpen, openInForgot]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  if (!isOpen) return null;

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
      await apiRegister(data.email, data.password, data.name, data.username);
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

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center px-4 py-8"
      style={{
        background:
          "radial-gradient(ellipse 70% 50% at 50% 35%, rgba(43,108,184,0.18) 0%, rgba(5,10,24,0) 70%), rgba(5,10,24,0.78)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        overflowY: "auto",
        // Tall content scrolls inside the overlay so the modal never
        // gets cropped beyond the viewport. Vertical centering is done
        // with margin: auto on the modal below.
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[480px]"
        style={{
          background: `linear-gradient(180deg, ${T.bgPanel} 0%, ${T.bgPanel2} 100%)`,
          borderRadius: 30,
          border: `1px solid ${T.hairline}`,
          boxShadow:
            "0 30px 100px -10px rgba(43,108,184,0.45), " +
            "0 0 60px -10px rgba(74,143,229,0.30), " +
            "inset 0 1px 0 rgba(255,255,255,0.06)",
          fontFamily: T.fontBody,
          color: T.white,
          margin: "auto",  // vertical centring in the scrollable overlay
          overflow: "hidden",
        }}
      >
        {/* Top edge electric-blue highlight */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -1, left: "15%", right: "15%",
            height: 2,
            background: `linear-gradient(90deg, transparent 0%, ${T.blueBright} 50%, transparent 100%)`,
            boxShadow: `0 0 24px ${T.blueBright}`,
            opacity: 0.85,
            pointerEvents: "none",
          }}
        />
        {/* Bottom edge electric-blue highlight */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: -1, left: "20%", right: "20%",
            height: 2,
            background: `linear-gradient(90deg, transparent 0%, ${T.blueBright} 50%, transparent 100%)`,
            boxShadow: `0 0 24px ${T.blueBright}`,
            opacity: 0.55,
            pointerEvents: "none",
          }}
        />
        {/* Soft amber-free glow inside the card (royal-blue radial) */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -160, left: -100, right: -100, height: 320,
            background: "radial-gradient(ellipse at center, rgba(74,143,229,0.30) 0%, transparent 70%)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />

        {/* Decorative A mark — faint, large, off-frame to the right */}
        <img
          src="/assets/brand/any_all_A_mark_transparent.png"
          alt=""
          aria-hidden
          style={{
            position: "absolute",
            right: -110, top: "50%",
            transform: "translateY(-50%)",
            width: 360, height: 360,
            objectFit: "contain",
            opacity: 0.06,
            filter: "drop-shadow(0 0 30px rgba(74,143,229,0.35))",
            pointerEvents: "none",
          }}
        />

        {/* close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute z-20 rounded-full"
          style={{
            top: 16,
            right: 16,
            width: 36,
            height: 36,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: T.white,
            background: "rgba(74,143,229,0.18)",
            border: `1px solid ${T.hairlineStrong}`,
            boxShadow: "0 0 16px rgba(74,143,229,0.25)",
            transition: "background 180ms, transform 180ms, box-shadow 180ms",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(74,143,229,0.32)";
            e.currentTarget.style.transform = "scale(1.06)";
            e.currentTarget.style.boxShadow = "0 0 24px rgba(74,143,229,0.45)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(74,143,229,0.18)";
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 0 16px rgba(74,143,229,0.25)";
          }}
        >
          <X size={18} strokeWidth={2.2} />
        </button>

        <div style={{ position: "relative", padding: "44px 36px 36px" }}>
          <AnimatePresence mode="wait">
            {step === "login"       && <LoginPanel      key="login"       onSubmit={handleLogin}    onSwitch={(s) => { setStep(s); setError(null); }} busy={busy} error={error} />}
            {step === "register"    && <RegisterPanel   key="register"    onSubmit={handleRegister} onSwitch={(s) => { setStep(s); setError(null); }} busy={busy} error={error} />}
            {step === "forgot"      && <ForgotPanel     key="forgot"      onSubmit={handleForgot}   onSwitch={(s) => { setStep(s); setError(null); }} busy={busy} error={error} />}
            {step === "check-email" && <CheckEmailPanel key="check-email" email={sentTo?.email || ""} flow={sentTo?.flow || "register"} onDone={onClose} onBack={() => { setStep(sentTo?.flow === "register" ? "register" : "forgot"); setError(null); }} />}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Trust row — sits below the modal, muted */}
      <TrustRow />
    </div>
  );
};

/* ══════════════════════════════════════════════
   SHARED  components
   ══════════════════════════════════════════════ */
const fadeSlide = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -16 },
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
};

const Pill: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 14px",
      borderRadius: 999,
      background: "rgba(74,143,229,0.10)",
      color: T.blueBright,
      border: `1px solid ${T.hairlineStrong}`,
      fontFamily: T.fontMono,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      boxShadow: "0 0 16px rgba(74,143,229,0.18)",
    }}
  >
    {icon}
    {label}
  </div>
);

const Title: React.FC<{ eyebrow?: string; eyebrowIcon?: React.ReactNode; title: string; sub?: string }> = ({
  eyebrow, eyebrowIcon, title, sub,
}) => (
  <div style={{ textAlign: "center", marginBottom: 26 }}>
    {eyebrow && (
      <div style={{ marginBottom: 18 }}>
        <Pill icon={eyebrowIcon ?? <Sparkles size={12} />} label={eyebrow} />
      </div>
    )}
    <h2
      style={{
        fontFamily: T.fontDisplay,
        fontWeight: 500,
        fontSize: 36,
        lineHeight: 1.05,
        letterSpacing: "-0.02em",
        color: T.white,
        margin: 0,
      }}
    >
      {title}
    </h2>
    {sub && (
      <p
        style={{
          marginTop: 10,
          fontSize: 14,
          color: T.mist,
          lineHeight: 1.55,
          fontFamily: T.fontBody,
        }}
      >
        {sub}
      </p>
    )}
  </div>
);

const Field: React.FC<{
  Icon: React.ComponentType<any>;
  type?: string;
  placeholder: string;
  error?: string;
  registerProps: any;
  autoFocus?: boolean;
  /** Show eye toggle for password visibility */
  password?: boolean;
}> = ({ Icon, type = "text", placeholder, error, registerProps, autoFocus, password }) => {
  const [showPw, setShowPw] = useState(false);
  const inputType = password ? (showPw ? "text" : "password") : type;

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ position: "relative" }}>
        <Icon
          size={16}
          style={{
            position: "absolute",
            left: 16, top: "50%",
            transform: "translateY(-50%)",
            color: error ? T.liveRed : T.mistSoft,
            pointerEvents: "none",
          }}
        />
        <input
          {...registerProps}
          type={inputType}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          style={{
            width: "100%",
            padding: `14px ${password ? 46 : 14}px 14px 44px`,
            borderRadius: 14,
            border: `1px solid ${error ? T.liveRed : T.hairline}`,
            background: T.bgInput,
            color: T.white,
            fontSize: 14,
            fontWeight: 400,
            fontFamily: T.fontBody,
            outline: "none",
            transition: "border-color 180ms ease, box-shadow 180ms ease, background 180ms ease",
            backdropFilter: "blur(8px)",
          }}
          onFocus={(e) => {
            if (!error) {
              e.currentTarget.style.borderColor = T.blueGlow;
              e.currentTarget.style.boxShadow = `0 0 0 4px rgba(74,143,229,0.18), 0 0 24px rgba(74,143,229,0.25)`;
              e.currentTarget.style.background = T.bgInputFocus;
            }
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? T.liveRed : T.hairline;
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.background = T.bgInput;
          }}
        />
        {password && (
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Hide password" : "Show password"}
            style={{
              position: "absolute",
              right: 12, top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              color: T.mistSoft,
              cursor: "pointer",
              padding: 4,
              display: "inline-flex",
            }}
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: T.liveRed,
            paddingLeft: 4,
            fontFamily: T.fontBody,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

const PrimaryBtn: React.FC<{
  children: React.ReactNode;
  type?: "button" | "submit";
  busy?: boolean;
  onClick?: () => void;
}> = ({ children, type = "submit", busy, onClick }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={busy}
    style={{
      width: "100%",
      padding: "15px 18px",
      borderRadius: 14,
      border: "none",
      background: busy
        ? "linear-gradient(135deg, #2A507A, #244A75)"
        : `linear-gradient(135deg, ${T.blue} 0%, ${T.blueBright} 100%)`,
      color: T.white,
      fontFamily: T.fontBody,
      fontWeight: 600,
      fontSize: 14.5,
      letterSpacing: 0.2,
      cursor: busy ? "wait" : "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      boxShadow:
        "0 14px 36px -10px rgba(74,143,229,0.65), " +
        "inset 0 1px 0 rgba(255,255,255,0.20)",
      transition: "transform 180ms ease, box-shadow 220ms ease, filter 200ms ease",
    }}
    onMouseEnter={(e) => {
      if (!busy) {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow =
          "0 20px 50px -10px rgba(74,143,229,0.85), inset 0 1px 0 rgba(255,255,255,0.30)";
        e.currentTarget.style.filter = "brightness(1.08)";
      }
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow =
        "0 14px 36px -10px rgba(74,143,229,0.65), inset 0 1px 0 rgba(255,255,255,0.20)";
      e.currentTarget.style.filter = "none";
    }}
  >
    {busy ? <Loader2 size={16} className="lm-spin" /> : null}
    {children}
  </button>
);

const SwitchLink: React.FC<{ children: React.ReactNode; onClick: () => void }> = ({ children, onClick }) => (
  <button
    onClick={onClick}
    type="button"
    style={{
      background: "transparent",
      border: "none",
      color: T.blueBright,
      fontWeight: 600,
      fontSize: 13,
      cursor: "pointer",
      padding: 0,
      fontFamily: T.fontBody,
      transition: "color 180ms",
    }}
    onMouseEnter={(e) => { e.currentTarget.style.color = T.white; }}
    onMouseLeave={(e) => { e.currentTarget.style.color = T.blueBright; }}
  >
    {children}
  </button>
);

const ErrorBanner: React.FC<{ msg: string }> = ({ msg }) => (
  <motion.div
    initial={{ opacity: 0, y: -6 }}
    animate={{ opacity: 1, y: 0 }}
    style={{
      background: "rgba(230,57,70,0.10)",
      border: "1px solid rgba(230,57,70,0.35)",
      color: "#FECDD3",
      padding: "10px 14px",
      borderRadius: 12,
      fontSize: 13,
      marginBottom: 14,
      lineHeight: 1.4,
      fontFamily: T.fontBody,
    }}
  >
    {msg}
  </motion.div>
);

/* Tiny divider used in the bottom-of-form "OR" rule */
const OrDivider: React.FC = () => (
  <div
    aria-hidden
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      margin: "22px 0 16px",
      color: T.mistFaint,
      fontFamily: T.fontMono,
      fontSize: 11,
      letterSpacing: "0.20em",
    }}
  >
    <span style={{ flex: 1, height: 1, background: T.hairline }} />
    <span>OR</span>
    <span style={{ flex: 1, height: 1, background: T.hairline }} />
  </div>
);

/* Trust row — 4 muted items below the modal */
const TrustRow: React.FC = () => {
  const items: { Icon: React.ComponentType<any>; title: string; sub: string }[] = [
    { Icon: ShieldCheck, title: "Secure & trusted",   sub: "Your data is always protected" },
    { Icon: Zap,         title: "Fast & easy",        sub: "Sign up in under 30 seconds" },
    { Icon: Star,        title: "Exclusive access",   sub: "Be first for drops & live shows" },
    { Icon: HelpCircle,  title: "Here to help",       sub: "24/7 customer support" },
  ];
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        marginTop: 28,
        display: "flex",
        gap: 28,
        flexWrap: "wrap",
        justifyContent: "center",
        maxWidth: 920,
        pointerEvents: "none",
      }}
    >
      {items.map((it) => (
        <div
          key={it.title}
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            color: T.mistSoft,
            fontFamily: T.fontBody,
          }}
        >
          <div
            style={{
              width: 32, height: 32,
              borderRadius: 999,
              background: "rgba(74,143,229,0.06)",
              border: `1px solid ${T.hairline}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: T.blueBright,
              flexShrink: 0,
            }}
          >
            <it.Icon size={14} strokeWidth={1.6} />
          </div>
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontSize: 12, color: T.white, fontWeight: 500 }}>{it.title}</div>
            <div style={{ fontSize: 11, color: T.mistFaint }}>{it.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════════
   LOGIN PANEL
   ══════════════════════════════════════════════ */
const LoginPanel: React.FC<{ onSubmit: (v: LoginVals) => void; onSwitch: (s: Step) => void; busy: boolean; error: string | null }> = ({ onSubmit, onSwitch, busy, error }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginVals>({
    resolver: zodResolver(loginSchema),
  });
  return (
    <motion.form {...fadeSlide} onSubmit={handleSubmit(onSubmit)}>
      <Title
        eyebrow="WELCOME BACK"
        eyebrowIcon={<ShieldCheck size={12} />}
        title="Sign in"
        sub="Bid live. Win live. Get it shipped."
      />
      {error && <ErrorBanner msg={error} />}
      <Field
        Icon={Mail} type="email"
        placeholder="Email address"
        error={errors.email?.message}
        registerProps={register("email")}
        autoFocus
      />
      <Field
        Icon={Lock} type="password" password
        placeholder="Password"
        error={errors.password?.message}
        registerProps={register("password")}
      />
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
        <SwitchLink onClick={() => onSwitch("forgot")}>Forgot password?</SwitchLink>
      </div>
      <PrimaryBtn busy={busy}>
        Sign In <ArrowRight size={16} />
      </PrimaryBtn>

      <OrDivider />

      <div style={{ textAlign: "center", fontSize: 13, color: T.mist, fontFamily: T.fontBody }}>
        New here? <SwitchLink onClick={() => onSwitch("register")}>Create an account</SwitchLink>
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
      <Title
        eyebrow="JOIN"
        eyebrowIcon={<Sparkles size={12} />}
        title="Create your account"
        sub="Get early access to India's first live-shopping marketplace."
      />
      {error && <ErrorBanner msg={error} />}
      <Field
        Icon={User}
        placeholder="Full name"
        error={errors.name?.message}
        registerProps={register("name")}
        autoFocus
      />
      <Field
        Icon={AtSign}
        placeholder="Username"
        error={errors.username?.message}
        registerProps={register("username")}
      />
      <Field
        Icon={Mail} type="email"
        placeholder="Email address"
        error={errors.email?.message}
        registerProps={register("email")}
      />
      <Field
        Icon={Lock} type="password" password
        placeholder="Password"
        error={errors.password?.message}
        registerProps={register("password")}
      />
      <div style={{ marginTop: 4 }}>
        <PrimaryBtn busy={busy}>
          Create Account <ArrowRight size={16} />
        </PrimaryBtn>
      </div>

      <OrDivider />

      <div style={{ textAlign: "center", fontSize: 13, color: T.mist, fontFamily: T.fontBody }}>
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
      <Title
        eyebrow="RECOVER"
        eyebrowIcon={<Mail size={12} />}
        title="Reset your password"
        sub="We'll email you a secure link to set a new password."
      />
      {error && <ErrorBanner msg={error} />}
      <Field
        Icon={Mail} type="email"
        placeholder="Email address"
        error={errors.email?.message}
        registerProps={register("email")}
        autoFocus
      />
      <PrimaryBtn busy={busy}>
        Send reset link <ArrowRight size={16} />
      </PrimaryBtn>

      <OrDivider />

      <div style={{ textAlign: "center", fontSize: 13, color: T.mist, fontFamily: T.fontBody }}>
        Remembered? <SwitchLink onClick={() => onSwitch("login")}>Back to sign in</SwitchLink>
      </div>
    </motion.form>
  );
};

/* ══════════════════════════════════════════════
   CHECK-EMAIL PANEL
   ══════════════════════════════════════════════ */
const CheckEmailPanel: React.FC<{ email: string; flow: CheckEmailFlow; onDone: () => void; onBack: () => void }> = ({ email, flow, onDone, onBack }) => (
  <motion.div {...fadeSlide}>
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
      <div
        style={{
          width: 76, height: 76, borderRadius: 22,
          background: "rgba(74,143,229,0.10)",
          border: `1px solid ${T.hairlineStrong}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 30px rgba(74,143,229,0.25)",
          color: T.blueBright,
        }}
      >
        <Mail size={30} />
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

    <div
      style={{
        display: "flex", alignItems: "center", gap: 10,
        background: "rgba(74,143,229,0.08)",
        border: `1px solid ${T.hairline}`,
        borderRadius: 12, padding: "10px 14px",
        fontSize: 13, color: T.mist, marginBottom: 22,
        fontFamily: T.fontBody,
      }}
    >
      <CheckCircle2 size={16} style={{ color: T.blueBright }} />
      <span>Link expires in 1 hour. Check spam if you don't see it.</span>
    </div>

    <PrimaryBtn type="button" busy={false} onClick={onDone}>
      Got it <ArrowRight size={16} />
    </PrimaryBtn>

    <div style={{ textAlign: "center", marginTop: 22, fontSize: 13, color: T.mist, fontFamily: T.fontBody }}>
      Wrong email? <SwitchLink onClick={onBack}>Try a different email</SwitchLink>
    </div>
  </motion.div>
);

/* ══════════════════════════════════════════════
   KEYFRAMES
   ══════════════════════════════════════════════ */
const styles = `
@keyframes lm-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.lm-spin { animation: lm-spin 0.8s linear infinite; }

/* Make placeholder text colour readable on dark inputs */
.fixed.z-\\[200\\] input::placeholder { color: rgba(255,255,255,0.40); }

@media (max-width: 600px) {
  .fixed.z-\\[200\\] > div[style*="max-width"] > div:last-child { padding: 36px 22px 26px !important; }
}
`;
if (typeof document !== "undefined" && !document.querySelector('style[data-lm-v2]')) {
  const tag = document.createElement('style');
  tag.setAttribute('data-lm-v2', '1');
  tag.textContent = styles;
  document.head.appendChild(tag);
}

export default LoginModalV2;
