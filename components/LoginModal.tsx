import React, { useEffect, useState } from "react";
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
  prefillResetToken?: string;
}

type Panel = "login" | "register" | "forgot";

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  openInForgot,
}) => {
  const [panel, setPanel] = useState<Panel>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (openInForgot) setPanel("forgot");
  }, [isOpen, openInForgot]);

  useEffect(() => {
    setErr(null);
    setOkMsg(null);
    setBusy(false);
  }, [panel, isOpen]);

  if (!isOpen) return null;

  async function onSubmitLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOkMsg(null);
    setBusy(true);
    try {
      const u = await apiLogin(email, password);
      onLoginSuccess(u);
      onClose();
    } catch (e: any) {
      setErr(e?.message || "Invalid credentials");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmitRegister(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOkMsg(null);
    setBusy(true);
    try {
      await apiRegister(email, password);
      setOkMsg(
        "Account created. Check your email for a verification link before logging in."
      );
      setPassword("");
      setPanel("login");
    } catch (e: any) {
      setErr(e?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  async function onRequestReset(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOkMsg(null);
    setBusy(true);
    try {
      await apiRequestReset(email);
      setOkMsg("If the email exists, a reset link has been sent. Check your inbox.");
    } catch {
      setOkMsg("If the email exists, a reset link has been sent. Check your inbox.");
    } finally {
      setBusy(false);
    }
  }

  function switchPanel(next: Panel) {
    setPanel(next);
  }

  const inputClasses =
    "w-full border border-slate-700 bg-slate-800 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500";

  const primaryButtonClasses =
    "w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white font-semibold py-2 rounded disabled:opacity-50 transition-colors";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-slate-900 text-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            {panel === "login"
              ? "Login"
              : panel === "register"
              ? "Register"
              : "Forgot password"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
            aria-label="Close"
          >
            X
          </button>
        </div>

        {err && <p className="text-sm text-red-400 mb-2">{err}</p>}
        {okMsg && <p className="text-sm text-emerald-400 mb-2">{okMsg}</p>}

        {panel === "login" && (
          <form onSubmit={onSubmitLogin} className="space-y-3" autoComplete="off">
            <input
              type="email"
              className={inputClasses}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
            />
            <input
              type="password"
              className={inputClasses}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="current-password"
            />
            <button type="submit" disabled={busy} className={primaryButtonClasses}>
              {busy ? "Please wait..." : "Login"}
            </button>

            <div className="flex items-center justify-between text-sm mt-2">
              <button
                type="button"
                onClick={() => switchPanel("register")}
                className="text-blue-300 hover:text-blue-200 underline"
              >
                Need an account? Register
              </button>
              <button
                type="button"
                onClick={() => switchPanel("forgot")}
                className="text-slate-300 hover:text-white underline"
              >
                Forgot password?
              </button>
            </div>
          </form>
        )}

        {panel === "register" && (
          <form onSubmit={onSubmitRegister} className="space-y-3" autoComplete="off">
            <input
              type="email"
              className={inputClasses}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
            />
            <input
              type="password"
              className={inputClasses}
              placeholder="Password (min 8)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button type="submit" disabled={busy} className={primaryButtonClasses}>
              {busy ? "Please wait..." : "Register"}
            </button>

            <div className="flex items-center justify-between text-sm mt-2">
              <button
                type="button"
                onClick={() => switchPanel("login")}
                className="text-slate-300 hover:text-white underline"
              >
                Already have an account? Login
              </button>
              <button
                type="button"
                onClick={() => switchPanel("forgot")}
                className="text-slate-300 hover:text-white underline"
              >
                Forgot password?
              </button>
            </div>
          </form>
        )}

        {panel === "forgot" && (
          <div className="space-y-4">
            <form onSubmit={onRequestReset} className="space-y-3" autoComplete="off">
              <input
                type="email"
                className={inputClasses}
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
              />
              <button
                type="submit"
                disabled={busy}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded disabled:opacity-50"
              >
                {busy ? "Please wait..." : "Request reset link"}
              </button>
              <p className="text-xs text-slate-300">
                We will send a link to set a new password. After clicking it, the app will prompt you
                to choose a new password.
              </p>
            </form>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => switchPanel("login")}
                className="text-slate-300 hover:text-white underline"
              >
                Back to login
              </button>
              <button
                type="button"
                onClick={() => switchPanel("register")}
                className="text-blue-300 hover:text-blue-200 underline"
              >
                Need an account? Register
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
