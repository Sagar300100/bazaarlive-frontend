import React, { useState } from "react";
import { initDigiLocker } from "../../services/api";

interface DigiLockerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * DigiLockerModal — consent + redirect to Meri Pehchaan (govt DigiLocker
 * portal). When the user finishes consent, Meri Pehchaan redirects back to
 * https://anynall.com/?digilocker=complete and App.tsx handles the rest.
 *
 * We stash the sandbox session_id in localStorage right before the redirect
 * so the callback handler can pick it up after the round-trip.
 */
const DigiLockerModal: React.FC<DigiLockerModalProps> = ({ isOpen, onClose }) => {
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStart = async () => {
    setError(null);
    if (!consent) {
      setError("Please provide consent to proceed.");
      return;
    }
    try {
      setBusy(true);
      const { sessionId, authUrl } = await initDigiLocker();
      if (!authUrl || !sessionId) {
        throw new Error("Could not start DigiLocker session. Please retry.");
      }
      // Stash so we can call /complete after the round-trip back to anynall.com.
      try {
        window.localStorage.setItem("anynall_digilocker_session", sessionId);
        window.localStorage.setItem("anynall_digilocker_started_at", String(Date.now()));
      } catch {}
      window.location.href = authUrl;
    } catch (err: any) {
      setError(err?.message || "Could not start DigiLocker. Please retry.");
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(7,13,27,0.72)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl w-full max-w-md m-4 p-8"
        style={{
          background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
          border: "1.5px solid rgba(43,108,184,0.18)",
          boxShadow: "0 30px 100px rgba(15,42,82,0.45)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg,#E0EFFF,#F8FAFC)",
              border: "1.5px solid rgba(43,108,184,0.2)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2B6CB8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: "#0F2A52" }}>Verify with DigiLocker</h2>
            <p className="text-xs" style={{ color: "#475569" }}>Powered by Government of India</p>
          </div>
        </div>

        <p className="text-sm mb-4" style={{ color: "#334155" }}>
          We&apos;ll redirect you to <strong>DigiLocker</strong> to share your verified Aadhaar securely.
          We never see or store your Aadhaar number.
        </p>

        <ul className="text-sm space-y-2 mb-5" style={{ color: "#334155" }}>
          <li className="flex items-start gap-2">
            <span style={{ color: "#16A34A" }}>✓</span>
            Sign in with your DigiLocker mobile/email
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: "#16A34A" }}>✓</span>
            Approve sharing your Aadhaar with Any &amp; All
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: "#16A34A" }}>✓</span>
            We confirm your identity and bring you back here
          </li>
        </ul>

        <label className="flex items-start gap-2 text-sm mb-4" style={{ color: "#334155" }}>
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-4 w-4 rounded"
            style={{ accentColor: "#2B6CB8" }}
          />
          <span>
            I consent to share my Aadhaar via DigiLocker with Any &amp; All for one-time identity verification.
          </span>
        </label>

        {error && (
          <p className="text-sm mb-3" style={{ color: "#DC2626" }}>{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-3 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
            style={{ background: "#E2E8F0", color: "#0F2A52" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStart}
            disabled={busy || !consent}
            className="flex-1 py-3 rounded-lg font-bold text-white transition-colors disabled:cursor-not-allowed"
            style={{ background: busy || !consent ? "#94A3B8" : "#1B3A6B" }}
            onMouseEnter={(e) => { if (!busy && consent) (e.currentTarget as HTMLButtonElement).style.background = "#2B6CB8"; }}
            onMouseLeave={(e) => { if (!busy && consent) (e.currentTarget as HTMLButtonElement).style.background = "#1B3A6B"; }}
          >
            {busy ? "Starting…" : "Continue to DigiLocker"}
          </button>
        </div>

        <p className="text-xs mt-4 text-center" style={{ color: "#94A3B8" }}>
          You will be redirected to <strong>meripehchaan.gov.in</strong>. We never receive your DigiLocker password.
        </p>
      </div>
    </div>
  );
};

export default DigiLockerModal;
