import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";

type ReferralKind = "seller" | "buyer";

const StatCard: React.FC<{ label: string; value: string; hint?: string }> = ({ label, value, hint }) => (
  <div
    className="rounded-2xl bg-white p-4"
    style={{ border: "1.5px solid rgba(43,108,184,0.15)", boxShadow: "0 2px 10px rgba(43,108,184,0.06)" }}
  >
    <p className="text-xs uppercase tracking-wide font-semibold text-[#4A7AB5]">{label}</p>
    <p className="text-2xl font-bold text-[#1B3A6B] mt-1">{value}</p>
    {hint && <p className="text-xs text-[#4A7AB5] mt-1">{hint}</p>}
  </div>
);

const HowItWorks: React.FC<{ steps: string[] }> = ({ steps }) => (
  <div
    className="rounded-2xl p-4 space-y-3"
    style={{ background: "rgba(43,108,184,0.04)", border: "1.5px solid rgba(43,108,184,0.12)" }}
  >
    <p className="text-sm font-bold text-[#1B3A6B]">How it works</p>
    {steps.map((s, idx) => (
      <div key={idx} className="flex gap-3 items-start">
        <div
          className="w-7 h-7 rounded-full font-bold flex items-center justify-center text-sm flex-shrink-0"
          style={{ background: "rgba(43,108,184,0.12)", color: "#2B6CB8" }}
        >
          {idx + 1}
        </div>
        <p className="text-sm text-[#4A7AB5] leading-snug">{s}</p>
      </div>
    ))}
  </div>
);

const shareTargets = [
  { label: "WhatsApp",  color: "bg-[#128C7E] hover:bg-[#0f7a6d]",           textClass: "text-white", href: (_msg: string, link: string) => `https://wa.me/?text=${encodeURIComponent(_msg)}` },
  { label: "Telegram",  color: "bg-[#229ED9] hover:bg-[#1d8bc0]",           textClass: "text-white", href: (_msg: string, link: string) => `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(_msg)}` },
  { label: "Facebook",  color: "bg-[#1877F2] hover:bg-[#0f66d6]",           textClass: "text-white", href: (_msg: string, link: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}` },
  { label: "Instagram", color: "bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af]", textClass: "text-white", href: (_msg: string, link: string) => `https://www.instagram.com/?url=${encodeURIComponent(link)}` },
  { label: "Snapchat",  color: "bg-[#FFFC00] hover:bg-[#e6e200]",           textClass: "text-black", href: (_msg: string, link: string) => `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(link)}` },
  { label: "Copy Link", color: "",                                           textClass: "", href: (_msg: string, link: string) => link },
];

type ReferralSummary = {
  totalCreditEarned: number;
  notYetCompleted: number;
  completed: number;
  pending: number;
  totalInvites: number;
};

const formatCurrency = (value: number | undefined | null) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value ?? 0);

const ReferralsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReferralKind>("seller");
  const [link, setLink] = useState<string>("https://anyandall.live/invite");
  const [code, setCode] = useState<string>("");
  const [reward, setReward] = useState<number | null>(null);
  const [requirement, setRequirement] = useState<number | null>(null);
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReferral = async () => {
      try {
        setLoading(true);
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          setError("Sign in to get your referral link.");
          setLoading(false);
          return;
        }
        const token = await user.getIdToken();
        const base =
          (import.meta as any).env?.VITE_API_URL ||
          (import.meta as any).env?.VITE_API_BASE ||
          "http://127.0.0.1:3001";
        const res = await fetch(`${base.replace(/\/$/, "")}/api/me/referral`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setLink(data.referralLink || data.link || link);
        setCode(data.referralCode || data.code || "");
        setReward(data.rewardAmount ?? null);
        setRequirement(data.requirementAmount ?? null);
        setSummary({
          totalCreditEarned: Number(data?.summary?.totalCreditEarned ?? 0),
          notYetCompleted: Number(data?.summary?.notYetCompleted ?? 0),
          completed: Number(data?.summary?.completed ?? 0),
          pending: Number(data?.summary?.pending ?? 0),
          totalInvites: Number(data?.summary?.totalInvites ?? 0),
        });
        setError(null);
      } catch (e: any) {
        setError(e?.message || "Could not load referral link.");
      } finally {
        setLoading(false);
      }
    };
    loadReferral();
  }, []);

  const sellerPitch = reward && requirement
    ? `Earn ${formatCurrency(reward)} when your invite ships ${formatCurrency(requirement)} in sales.`
    : "Join as a seller on Any & All and start earning.";
  const buyerPitch = "Shop live on Any & All!";

  const referralMessage =
    activeTab === "seller"
      ? `${sellerPitch} Use my link: ${link}`
      : `${buyerPitch} Use my invite: ${link}`;

  const handleShare = (targetHref: string, label: string) => {
    if (label === "Copy Link") {
      navigator.clipboard?.writeText(link).catch(() => {});
      return;
    }
    window.open(targetHref, "_blank", "noopener,noreferrer");
  };

  const metrics =
    activeTab === "seller"
      ? [
          { label: "Total credit earned",               value: formatCurrency(summary?.totalCreditEarned) },
          { label: "Referrals not yet completed",        value: String(summary?.notYetCompleted ?? 0) },
          { label: "Referrals completed",                value: String(summary?.completed ?? 0) },
          { label: "Followers gained from referrals",   value: String(summary?.totalInvites ?? 0) },
        ]
      : [
          { label: "Buyer credit earned",   value: formatCurrency(summary?.totalCreditEarned) },
          { label: "Invites sent",           value: String(summary?.totalInvites ?? 0) },
          { label: "Orders from invites",    value: String(summary?.completed ?? 0) },
          { label: "Pending rewards",        value: formatCurrency(summary?.pending ?? 0) },
        ];

  const steps =
    activeTab === "seller"
      ? [
          "Share your seller referral link with creators who could sell on Any & All.",
          "Your referral must verify, schedule a show, go live, and complete their first sale and shipment.",
          "You earn a referral bonus once they finish those steps; they get their own starter bonus too.",
        ]
      : [
          "Share your buyer referral link with shoppers who love live shopping.",
          "They must sign up, verify, and place their first completed order.",
          "You earn buyer referral credit when the order is fulfilled; they get a welcome credit.",
        ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[#4A7AB5] font-medium">Referrals</p>
          <h2 className="text-3xl font-bold text-[#1B3A6B]">Grow Any &amp; All and earn</h2>
        </div>
        {/* Tab switcher */}
        <div
          className="flex rounded-full p-1"
          style={{ background: "rgba(43,108,184,0.08)", border: "1.5px solid rgba(43,108,184,0.15)" }}
        >
          {(["seller", "buyer"] as ReferralKind[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 capitalize"
              style={
                activeTab === tab
                  ? { background: "linear-gradient(135deg,#2B6CB8,#1A4B8C)", color: "white", boxShadow: "0 2px 8px rgba(43,108,184,0.3)" }
                  : { color: "#4A7AB5" }
              }
            >
              {tab === "seller" ? "Seller referrals" : "Buyer referrals"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main card */}
        <div
          className="lg:col-span-2 rounded-2xl bg-white p-6"
          style={{ border: "1.5px solid rgba(43,108,184,0.15)", boxShadow: "0 4px 20px rgba(43,108,184,0.08)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#2B6CB8] uppercase tracking-wide mb-1">
                {activeTab === "seller" ? "Invite sellers, earn cash" : "Invite buyers, earn credits"}
              </p>
              <h3 className="text-2xl font-bold text-[#1B3A6B] mb-2">
                {activeTab === "seller" ? "Share your seller referral link" : "Share your buyer referral link"}
              </h3>
              <p className="text-[#4A7AB5]">
                {activeTab === "seller"
                  ? "Help creators go live and complete their first sale; you both earn when they ship."
                  : "Invite shoppers to place their first order; you earn credits when their purchase completes."}
              </p>
              {reward && requirement && (
                <p className="text-xs text-green-600 font-semibold mt-2">
                  Earn {formatCurrency(reward)} once your invite ships {formatCurrency(requirement)} in GMV.
                </p>
              )}
            </div>
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0"
              style={{ background: "rgba(43,108,184,0.1)", color: "#2B6CB8", border: "1.5px solid rgba(43,108,184,0.2)" }}
            >
              {code ? `Code: ${code}` : "Loading..."}
            </span>
          </div>

          {/* Referral link box */}
          <div className="mt-6 flex flex-col gap-3">
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(43,108,184,0.04)", border: "1.5px solid rgba(43,108,184,0.15)" }}
            >
              <p className="text-xs font-semibold text-[#4A7AB5] mb-2">Your referral link</p>
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <input
                  readOnly
                  value={link}
                  className="flex-1 rounded-xl px-3 py-2 text-sm text-[#1B3A6B] focus:outline-none"
                  style={{ background: "white", border: "1.5px solid rgba(43,108,184,0.2)" }}
                />
                <button
                  onClick={() => navigator.clipboard?.writeText(link)}
                  className="px-4 py-2 rounded-xl text-white font-semibold text-sm transition-colors"
                  style={{ background: "linear-gradient(135deg,#2B6CB8,#1A4B8C)", boxShadow: "0 2px 8px rgba(43,108,184,0.25)" }}
                >
                  Copy
                </button>
              </div>
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
              {!error && loading && <p className="text-xs text-[#4A7AB5] mt-2">Loading your personalised link…</p>}
            </div>

            {/* Share buttons */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {shareTargets.map((t) =>
                t.label === "Copy Link" ? (
                  <button
                    key={t.label}
                    onClick={() => handleShare(t.href(referralMessage, link), t.label)}
                    className="text-xs font-semibold rounded-xl px-3 py-2 text-[#2B6CB8] hover:bg-blue-50 transition-colors"
                    style={{ border: "1.5px solid rgba(43,108,184,0.25)", background: "white" }}
                  >
                    {t.label}
                  </button>
                ) : (
                  <button
                    key={t.label}
                    onClick={() => handleShare(t.href(referralMessage, link), t.label)}
                    className={`text-xs font-semibold rounded-xl px-3 py-2 ${t.color} ${t.textClass}`}
                  >
                    {t.label}
                  </button>
                )
              )}
            </div>
          </div>

          {/* How it works */}
          <div className="mt-6">
            <HowItWorks steps={steps} />
          </div>
        </div>

        {/* Stats panel */}
        <div
          className="rounded-2xl bg-white p-4 space-y-3"
          style={{ border: "1.5px solid rgba(43,108,184,0.15)", boxShadow: "0 4px 20px rgba(43,108,184,0.08)" }}
        >
          <p className="text-sm font-bold text-[#1B3A6B]">Referral status</p>
          <div className="grid grid-cols-2 gap-3">
            {metrics.map((m) => (
              <StatCard key={m.label} label={m.label} value={m.value} />
            ))}
          </div>
          {loading && <p className="text-xs text-[#4A7AB5] mt-2">Loading your referral stats…</p>}
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default ReferralsPanel;
