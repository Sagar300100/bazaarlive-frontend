import React, { useEffect, useMemo, useState } from "react";
import { Check, Store, ShieldCheck, Landmark, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import {
  getSellerOnboarding,
  saveStoreSetup,
  verifyBankAccount,
  verifyPan,
  completeSellerOnboarding,
} from "../services/api";
import DigiLockerModal from "../components/modals/DigiLockerModal";

interface BecomeSellerPageProps {
  onComplete: () => void;
  onCancel: () => void;
}

const NAVY = "#1B3A6B";
const BLUE = "#2B6CB8";
const CREAM = "#F8F5F0";

type StepKey = "store" | "aadhaar" | "pan" | "bank" | "welcome";

const STEPS: { key: StepKey; label: string; icon: React.ReactNode }[] = [
  { key: "store",   label: "Store",         icon: <Store size={18} /> },
  { key: "aadhaar", label: "Aadhaar",       icon: <ShieldCheck size={18} /> },
  { key: "pan",     label: "PAN",           icon: <ShieldCheck size={18} /> },
  { key: "bank",    label: "Bank",          icon: <Landmark size={18} /> },
  { key: "welcome", label: "Welcome",       icon: <Sparkles size={18} /> },
];

const BecomeSellerPage: React.FC<BecomeSellerPageProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<StepKey>("store");
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<{
    storeSetupComplete: boolean;
    aadhaarVerified: boolean;
    panVerified: boolean;
    bankVerified: boolean;
    storeName: string;
    storeHandle: string;
  }>({
    storeSetupComplete: false,
    aadhaarVerified: false,
    panVerified: false,
    bankVerified: false,
    storeName: "",
    storeHandle: "",
  });

  // Read current progress so a refreshed/returning seller resumes correctly.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getSellerOnboarding();
        if (!mounted) return;
        setState({
          storeSetupComplete: data.storeSetupComplete,
          aadhaarVerified: data.aadhaarVerified,
          panVerified: (data as any).panVerified ?? false,
          bankVerified: data.bankVerified,
          storeName: data.storeName,
          storeHandle: data.storeHandle,
        });
        // Jump to the earliest incomplete step.
        if (!data.storeSetupComplete) setStep("store");
        else if (!data.aadhaarVerified) setStep("aadhaar");
        else if (!((data as any).panVerified)) setStep("pan");
        else if (!data.bankVerified) setStep("bank");
        else setStep("welcome");
      } catch {
        // Fresh seller — start at step 1.
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const currentStepIdx = useMemo(() => STEPS.findIndex((s) => s.key === step), [step]);

  const advance = (next: StepKey) => setStep(next);

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${CREAM} 0%, #FFFFFF 100%)` }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: BLUE }}>
            Become a Seller
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: NAVY }}>
            Set up your store on Any &amp; All
          </h1>
          <p className="text-sm" style={{ color: "#4A7AB5" }}>
            Takes about 5 minutes. You can edit details later from Seller Hub.
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-8 rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1.5px solid rgba(43,108,184,0.14)", boxShadow: "0 2px 12px rgba(43,108,184,0.06)" }}>
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => {
              const done =
                (s.key === "store"   && state.storeSetupComplete) ||
                (s.key === "aadhaar" && state.aadhaarVerified)    ||
                (s.key === "bank"    && state.bankVerified)       ||
                (s.key === "welcome" && state.bankVerified && state.aadhaarVerified && state.storeSetupComplete);
              const active = currentStepIdx === i;
              return (
                <React.Fragment key={s.key}>
                  <button
                    onClick={() => {
                      // Only allow jumping back to completed steps + current.
                      if (done || i <= currentStepIdx) setStep(s.key);
                    }}
                    className="flex flex-col items-center gap-2 px-2 py-1 rounded-lg transition-colors"
                    style={{ cursor: done || i <= currentStepIdx ? "pointer" : "not-allowed" }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{
                        background: done ? "rgba(34,197,94,0.15)" : active ? NAVY : "rgba(43,108,184,0.08)",
                        color: done ? "#16A34A" : active ? "white" : NAVY,
                        border: active ? "none" : "1.5px solid rgba(43,108,184,0.18)",
                      }}
                    >
                      {done ? <Check size={20} /> : s.icon}
                    </div>
                    <span className="text-xs font-semibold" style={{ color: active ? NAVY : "#4A7AB5" }}>
                      {s.label}
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div
                      className="flex-1 h-0.5 mx-2"
                      style={{ background: i < currentStepIdx ? "#16A34A" : "rgba(43,108,184,0.12)" }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="rounded-2xl p-6 sm:p-8" style={{ background: "#FFFFFF", border: "1.5px solid rgba(43,108,184,0.14)", boxShadow: "0 2px 12px rgba(43,108,184,0.06)" }}>
          {loading ? (
            <div className="flex items-center justify-center py-12" style={{ color: BLUE }}>
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : step === "store" ? (
            <StoreStep
              initial={{ storeName: state.storeName, storeHandle: state.storeHandle }}
              onSaved={(saved) => {
                setState((s) => ({ ...s, ...saved, storeSetupComplete: true }));
                advance(state.aadhaarVerified
                  ? (state.panVerified ? (state.bankVerified ? "welcome" : "bank") : "pan")
                  : "aadhaar");
              }}
              onCancel={onCancel}
            />
          ) : step === "aadhaar" ? (
            <AadhaarStep
              verified={state.aadhaarVerified}
              onContinue={() => advance(state.panVerified ? (state.bankVerified ? "welcome" : "bank") : "pan")}
            />
          ) : step === "pan" ? (
            <PanStep
              verified={state.panVerified}
              onVerified={() => {
                setState((s) => ({ ...s, panVerified: true }));
                advance(state.bankVerified ? "welcome" : "bank");
              }}
            />
          ) : step === "bank" ? (
            <BankStep
              verified={state.bankVerified}
              onVerified={() => {
                setState((s) => ({ ...s, bankVerified: true }));
                advance("welcome");
              }}
            />
          ) : (
            <WelcomeStep onComplete={onComplete} storeName={state.storeName} />
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Step 1: Store Setup ── */
const StoreStep: React.FC<{
  initial: { storeName: string; storeHandle: string };
  onSaved: (saved: { storeName: string; storeHandle: string }) => void;
  onCancel: () => void;
}> = ({ initial, onSaved, onCancel }) => {
  const [storeName, setStoreName] = useState(initial.storeName);
  const [storeHandle, setStoreHandle] = useState(initial.storeHandle);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If the parent's loaded state arrives AFTER this component already
  // mounted (race between the async fetch and the user clicking Store in
  // the stepper), pull the values in. useState only takes its argument on
  // first mount, so without this the form would stay empty even though
  // we have the data.
  useEffect(() => {
    if (initial.storeName && !storeName) setStoreName(initial.storeName);
    if (initial.storeHandle && !storeHandle) setStoreHandle(initial.storeHandle);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.storeName, initial.storeHandle]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setBusy(true);
      const handle = storeHandle.toLowerCase().trim();
      await saveStoreSetup({ storeName: storeName.trim(), storeHandle: handle });
      onSaved({ storeName: storeName.trim(), storeHandle: handle });
    } catch (err: any) {
      setError(err?.message || "Could not save store details.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: NAVY }}>Set up your store</h2>
        <p className="text-sm" style={{ color: "#4A7AB5" }}>
          This is what buyers will see on your live shows and product listings.
        </p>
      </div>

      <Field label="Store name" hint="Shown on every show and product. E.g. “Sagar's Vintage Drops”.">
        <input
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          maxLength={60}
          required
          className="w-full px-4 py-3 rounded-lg outline-none"
          style={{ background: "#F8FAFC", color: NAVY, border: "1.5px solid #E2E8F0" }}
        />
      </Field>

      <Field label="Store handle" hint="Your @username on Any & All. Letters/digits/underscore, 3-20 chars.">
        <div className="flex items-center rounded-lg overflow-hidden" style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0" }}>
          <span className="pl-4 pr-1 font-bold" style={{ color: "#94A3B8" }}>@</span>
          <input
            value={storeHandle}
            onChange={(e) => setStoreHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            maxLength={20}
            required
            className="flex-1 px-1 py-3 outline-none bg-transparent"
            style={{ color: NAVY }}
          />
        </div>
      </Field>

      {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-lg font-semibold"
          style={{ background: "#E2E8F0", color: NAVY }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="flex-1 py-3 rounded-lg font-bold disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ background: busy ? "#94A3B8" : NAVY, color: "#FFFFFF" }}
        >
          {busy ? "Saving…" : (<>Continue <ArrowRight size={16} /></>)}
        </button>
      </div>
    </form>
  );
};

/* ── Step 2: Aadhaar via DigiLocker ── */
const AadhaarStep: React.FC<{
  verified: boolean;
  onContinue: () => void;
}> = ({ verified, onContinue }) => {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: NAVY }}>Verify your identity</h2>
        <p className="text-sm" style={{ color: "#4A7AB5" }}>
          Required for all sellers. We use Government of India's DigiLocker — your Aadhaar number never touches our servers.
        </p>
      </div>

      {verified ? (
        <div className="rounded-lg p-5 flex items-center gap-3" style={{ background: "rgba(34,197,94,0.08)", border: "1.5px solid rgba(34,197,94,0.25)" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(34,197,94,0.15)", color: "#16A34A" }}>
            <Check size={20} />
          </div>
          <div className="flex-1">
            <p className="font-semibold" style={{ color: "#14532D" }}>Aadhaar verified via DigiLocker</p>
            <p className="text-sm" style={{ color: "#15803D" }}>Your KYC is on file. Move on to bank details.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg p-5" style={{ background: "rgba(43,108,184,0.05)", border: "1.5px dashed rgba(43,108,184,0.3)" }}>
          <p className="text-sm mb-3" style={{ color: NAVY }}>
            <strong>How it works:</strong> Click below → you'll be sent to DigiLocker → sign in → approve sharing your Aadhaar → land back here.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-5 py-3 rounded-lg font-bold"
            style={{ background: NAVY, color: "#FFFFFF" }}
          >
            Verify With DigiLocker
          </button>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          onClick={onContinue}
          disabled={!verified}
          className="px-5 py-3 rounded-lg font-bold disabled:cursor-not-allowed flex items-center gap-2"
          style={{ background: !verified ? "#94A3B8" : NAVY, color: "#FFFFFF" }}
        >
          Continue <ArrowRight size={16} />
        </button>
      </div>

      <DigiLockerModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};

/* ── Step 3: PAN ── */
const PanStep: React.FC<{ verified: boolean; onVerified: () => void }> = ({ verified, onVerified }) => {
  const [pan, setPan] = useState("");
  // DOB is shown only after backend says we don't have it on file. Most users
  // verify Aadhaar via DigiLocker which captures DOB automatically, so this
  // field stays hidden for them. Legacy users (verified before DOB-save
  // landed) will be asked for it once.
  const [needsDob, setNeedsDob] = useState(false);
  const [dob, setDob] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    try {
      setBusy(true);
      const payload: { pan: string; dateOfBirth?: string } = { pan: pan.toUpperCase() };
      if (needsDob && dob) payload.dateOfBirth = dob;
      const res = await verifyPan(payload);
      if (res.verified) {
        setSuccess(`✓ Verified. Name on PAN: ${res.panName}.`);
        setTimeout(() => onVerified(), 1000);
      } else if (res.error === "NAME_MISMATCH") {
        setError(`PAN name "${res.panName}" doesn't match your Aadhaar name. The PAN must be in YOUR name.`);
      } else if (res.error === "DOB_REQUIRED") {
        setNeedsDob(true);
        setError("Please enter your date of birth (as on Aadhaar) and click Verify again.");
      } else {
        setError(res.message || "Could not verify this PAN. Re-check the number.");
      }
    } catch (err: any) {
      setError(err?.message || "Verification failed. Please retry.");
    } finally {
      setBusy(false);
    }
  };

  if (verified) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold mb-1" style={{ color: NAVY }}>PAN verified</h2>
          <p className="text-sm" style={{ color: "#4A7AB5" }}>Tax compliance for payouts is set.</p>
        </div>
        <div className="rounded-lg p-5 flex items-center gap-3" style={{ background: "rgba(34,197,94,0.08)", border: "1.5px solid rgba(34,197,94,0.25)" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(34,197,94,0.15)", color: "#16A34A" }}>
            <Check size={20} />
          </div>
          <p className="font-semibold" style={{ color: "#14532D" }}>PAN on file</p>
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={onVerified} className="px-5 py-3 rounded-lg font-bold flex items-center gap-2" style={{ background: NAVY, color: "#FFFFFF" }}>
            Continue <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: NAVY }}>Add your PAN</h2>
        <p className="text-sm" style={{ color: "#4A7AB5" }}>
          Required by Income Tax Department for sellers. Your PAN name must match your Aadhaar name.
        </p>
      </div>

      <Field label="PAN number" hint="10 chars. Format: 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F).">
        <input
          value={pan}
          onChange={(e) => setPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
          maxLength={10}
          required
          className="w-full px-4 py-3 rounded-lg outline-none font-mono uppercase"
          style={{ background: "#F8FAFC", color: NAVY, border: "1.5px solid #E2E8F0" }}
        />
      </Field>

      {needsDob && (
        <Field label="Date of birth" hint="As on your Aadhaar. We need this because your Aadhaar was verified before we started saving DOB.">
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            required={needsDob}
            className="w-full px-4 py-3 rounded-lg outline-none"
            style={{ background: "#F8FAFC", color: NAVY, border: "1.5px solid #E2E8F0" }}
          />
        </Field>
      )}

      {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}
      {success && <p className="text-sm" style={{ color: "#16A34A" }}>{success}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full py-3 rounded-lg font-bold disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ background: busy ? "#94A3B8" : NAVY, color: "#FFFFFF" }}
      >
        {busy ? "Verifying with NSDL…" : (<>Verify PAN <ArrowRight size={16} /></>)}
      </button>
    </form>
  );
};

/* ── Step 4: Bank Account ── */
const BankStep: React.FC<{ verified: boolean; onVerified: () => void }> = ({ verified, onVerified }) => {
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccount, setConfirmAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (accountNumber !== confirmAccount) {
      setError("The account numbers don't match.");
      return;
    }
    try {
      setBusy(true);
      const res = await verifyBankAccount({ accountNumber, ifsc: ifsc.toUpperCase() });
      if (res.verified) {
        setSuccess(`✓ Verified. Account holder: ${res.bankName}.`);
        setTimeout(() => onVerified(), 1200);
      } else if (res.error === "NAME_MISMATCH") {
        setError(`Bank says this account belongs to "${res.bankName}". It must be in YOUR name (the one on your Aadhaar). Please use a different account.`);
      } else {
        setError(res.message || "Could not verify this account. Re-check the details.");
      }
    } catch (err: any) {
      setError(err?.message || "Verification failed. Please retry.");
    } finally {
      setBusy(false);
    }
  };

  if (verified) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold mb-1" style={{ color: NAVY }}>Bank account verified</h2>
          <p className="text-sm" style={{ color: "#4A7AB5" }}>
            Your payouts will be sent to this account once Razorpay onboarding completes.
          </p>
        </div>
        <div className="rounded-lg p-5 flex items-center gap-3" style={{ background: "rgba(34,197,94,0.08)", border: "1.5px solid rgba(34,197,94,0.25)" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(34,197,94,0.15)", color: "#16A34A" }}>
            <Check size={20} />
          </div>
          <div className="flex-1">
            <p className="font-semibold" style={{ color: "#14532D" }}>Bank account on file</p>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button
            onClick={onVerified}
            className="px-5 py-3 rounded-lg font-bold flex items-center gap-2"
            style={{ background: NAVY, color: "#FFFFFF" }}
          >
            Continue <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: NAVY }}>Add your bank account</h2>
        <p className="text-sm" style={{ color: "#4A7AB5" }}>
          We'll deposit ₹1 to confirm the account is yours. The bank's account holder name must match your Aadhaar.
        </p>
      </div>

      <Field label="Account number" hint="9-18 digits, no spaces.">
        <input
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
          maxLength={18}
          required
          className="w-full px-4 py-3 rounded-lg outline-none font-mono"
          style={{ background: "#F8FAFC", color: NAVY, border: "1.5px solid #E2E8F0" }}
        />
      </Field>

      <Field label="Confirm account number" hint="Paste again — we won't allow autofill here.">
        <input
          value={confirmAccount}
          onChange={(e) => setConfirmAccount(e.target.value.replace(/\D/g, ""))}
          maxLength={18}
          required
          autoComplete="off"
          className="w-full px-4 py-3 rounded-lg outline-none font-mono"
          style={{ background: "#F8FAFC", color: NAVY, border: "1.5px solid #E2E8F0" }}
        />
      </Field>

      <Field label="IFSC code" hint="11 chars. Find it on your bank passbook or app. E.g. HDFC0001234.">
        <input
          value={ifsc}
          onChange={(e) => setIfsc(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
          maxLength={11}
          required
          className="w-full px-4 py-3 rounded-lg outline-none font-mono uppercase"
          style={{ background: "#F8FAFC", color: NAVY, border: "1.5px solid #E2E8F0" }}
        />
      </Field>

      {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}
      {success && <p className="text-sm" style={{ color: "#16A34A" }}>{success}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full py-3 rounded-lg font-bold text-white disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ background: busy ? "#94A3B8" : NAVY }}
      >
        {busy ? "Verifying with bank…" : (<>Verify Bank Account <ArrowRight size={16} /></>)}
      </button>
    </form>
  );
};

/* ── Step 4: Welcome ── */
const WelcomeStep: React.FC<{ onComplete: () => void; storeName: string }> = ({ onComplete, storeName }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = async () => {
    setError(null);
    try {
      setBusy(true);
      await completeSellerOnboarding();
      onComplete();
    } catch (err: any) {
      setError(err?.message || "Could not finalise. Please retry.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 text-center py-4">
      <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(34,197,94,0.12)", color: "#16A34A" }}>
        <Sparkles size={36} />
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: NAVY }}>Welcome to Any &amp; All, {storeName || "Seller"}!</h2>
        <p className="text-sm max-w-md mx-auto" style={{ color: "#4A7AB5" }}>
          Your store is set up. You can now list products and host live shows. Your first payout will be released after Razorpay onboarding completes (~5-7 days) — we'll guide you through that next.
        </p>
      </div>

      <div className="rounded-lg p-4 text-left" style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0" }}>
        <p className="text-sm font-bold mb-2" style={{ color: NAVY }}>What's next:</p>
        <ul className="text-sm space-y-1" style={{ color: "#4A7AB5" }}>
          <li>• Head to Seller Hub → Inventory → add your first product</li>
          <li>• Schedule your first live show</li>
          <li>• Promote your @{/* placeholder */}handle on Instagram</li>
        </ul>
      </div>

      {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}

      <button
        onClick={finish}
        disabled={busy}
        className="px-8 py-3 rounded-lg font-bold disabled:cursor-not-allowed inline-flex items-center gap-2"
        style={{ background: busy ? "#94A3B8" : NAVY, color: "#FFFFFF" }}
      >
        {busy ? "Finishing…" : (<>Go to Seller Hub <ArrowRight size={16} /></>)}
      </button>
    </div>
  );
};

/* ── Shared field wrapper ── */
const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div>
    <label className="block text-sm font-semibold mb-1" style={{ color: NAVY }}>{label}</label>
    {children}
    {hint && <p className="text-xs mt-1.5" style={{ color: "#94A3B8" }}>{hint}</p>}
  </div>
);

export default BecomeSellerPage;
