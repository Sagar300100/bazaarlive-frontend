import React, { useMemo, useState } from "react";
import { sendAadhaarOtp, verifyAadhaarOtp } from "../../services/api";

interface AadhaarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifySuccess: () => void;
}

const AadhaarModal: React.FC<AadhaarModalProps> = ({
  isOpen,
  onClose,
  onVerifySuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [aadhaar, setAadhaar] = useState("");
  const [otp, setOtp] = useState("");
  const [txnId, setTxnId] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const cleanAadhaar = useMemo(
    () => aadhaar.replace(/\s+/g, ""),
    [aadhaar]
  );

  if (!isOpen) return null;

  const reset = () => {
    setStep(1);
    setAadhaar("");
    setOtp("");
    setTxnId("");
    setConsent(false);
    setStatus("");
    setError("");
  };

  const maskId = (id: string) =>
    id ? `${"X".repeat(Math.max(0, id.length - 4))}${id.slice(-4)}` : "";

  // Aadhaar Verhoeff checksum validation (VID just length check)
  const isValidAadhaar = (val: string) => {
    const digits = val.split("").map(Number).reverse();
    const d = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
      [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
      [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
      [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
      [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
      [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
      [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
      [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
      [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
    ];
    const p = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
      [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
      [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
      [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
      [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
      [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
      [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
    ];
    let c = 0;
    for (let i = 0; i < digits.length; i++) {
      c = d[c][p[i % 8][digits[i]]];
    }
    return c === 0;
  };

  const isValidAadhaarOrVid = (val: string) => {
    if (/^\d{16}$/.test(val)) return true; // VID
    return /^\d{12}$/.test(val) && isValidAadhaar(val);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleAadhaarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatus("");

    if (!isValidAadhaarOrVid(cleanAadhaar)) {
      setError("Enter a valid Aadhaar (12-digit with checksum) or 16-digit VID.");
      return;
    }
    if (!consent) {
      setError("Please provide consent to proceed.");
      return;
    }

    try {
      setIsSending(true);
      const res = await sendAadhaarOtp({
        idNumber: cleanAadhaar,
        consent: true,
      });
      setTxnId(res.txnId || "");
      setStatus(
        `OTP sent to your Aadhaar-linked mobile${
          res.expiresInSeconds ? ` (expires in ${res.expiresInSeconds}s)` : ""
        }.`
      );
      setStep(2);
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatus("");

    if (!txnId) {
      setError("Missing transaction id. Please request OTP again.");
      return;
    }
    if (otp.trim().length < 6) {
      setError("Enter the 6-digit OTP you received.");
      return;
    }

    try {
      setIsVerifying(true);
      const res = await verifyAadhaarOtp({
        idNumber: cleanAadhaar,
        otp: otp.trim(),
        txnId,
      });

      if (res.verified) {
        setStatus("Verification successful.");
        setStep(3);
        setTimeout(() => {
          onVerifySuccess();
          reset();
        }, 1500);
      } else {
        setError("Could not verify OTP. Please request a new one.");
      }
    } catch (err: any) {
      setError(err?.message || "Verification failed. Please retry.");
    } finally {
      setIsVerifying(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleAadhaarSubmit}>
            <h2 className="text-2xl font-bold text-[#0F2A52] mb-2">Verify Aadhaar</h2>
            <p className="text-[#475569] mb-6">
              Enter your Aadhaar (12) or VID (16). We will send an OTP to your
              Aadhaar-linked mobile after your consent.
            </p>
            <div className="space-y-4">
              <input
                type="text"
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg text-[#0F2A52] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2B6CB8]"
                placeholder="XXXX XXXX XXXX"
                maxLength={19}
                required
              />
              <label className="flex items-start gap-2 text-sm text-[#334155]">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-[#94A3B8] text-[#2B6CB8] focus:ring-[#2B6CB8]"
                  required
                />
                <span>
                  I voluntarily provide my Aadhaar/VID and consent to fetch my
                  details for verification. I understand OTP is sent by UIDAI to
                  my registered mobile/email.
                </span>
              </label>
              {error && <p className="text-sm text-red-400">{error}</p>}
              {status && <p className="text-sm text-green-400">{status}</p>}
              <button
                type="submit"
                disabled={isSending}
                className="mt-2 w-full py-3 bg-[#1B3A6B] hover:bg-[#2B6CB8] disabled:bg-[#94A3B8] disabled:cursor-not-allowed rounded-lg text-white font-bold transition-colors"
              >
                {isSending ? "Sending OTP…" : "Send OTP"}
              </button>
            </div>
          </form>
        );
      case 2:
        return (
          <form onSubmit={handleOtpSubmit}>
            <h2 className="text-2xl font-bold text-[#0F2A52] mb-2">Enter OTP</h2>
            <p className="text-[#475569] mb-4">
              OTP sent to your Aadhaar-linked mobile. ID: {maskId(cleanAadhaar)}
            </p>
            <div className="space-y-4">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg text-[#0F2A52] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2B6CB8]"
                placeholder="6-digit OTP"
                maxLength={6}
                required
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              {status && <p className="text-sm text-green-400">{status}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setStatus("");
                    setError("");
                  }}
                  className="flex-1 py-3 bg-[#E2E8F0] hover:bg-[#CBD5E1] rounded-lg text-[#0F2A52] font-semibold transition-colors"
                >
                  Edit Aadhaar
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="flex-1 py-3 bg-[#1B3A6B] hover:bg-[#2B6CB8] disabled:bg-[#94A3B8] disabled:cursor-not-allowed rounded-lg text-white font-bold transition-colors"
                >
                  {isVerifying ? "Verifying…" : "Verify OTP"}
                </button>
              </div>
            </div>
          </form>
        );
      case 3:
        return (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#0F2A52]">Verification Successful!</h2>
            <p className="text-[#475569] mt-2">Your account is now verified.</p>
          </div>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(7,13,27,0.72)", backdropFilter: "blur(12px)" }}
      onClick={handleClose}
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
        {renderStep()}
      </div>
    </div>
  );
};

export default AadhaarModal;
