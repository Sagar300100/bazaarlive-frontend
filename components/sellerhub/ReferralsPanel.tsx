import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";

type ReferralKind = "seller" | "buyer";

const StatCard: React.FC<{ label: string; value: string; hint?: string }> = ({ label, value, hint }) => (
  <div className="rounded-2xl bg-gradient-to-br from-white/5 via-white/3 to-white/5 border border-white/10 p-4 shadow-lg shadow-black/30">
    <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
    <p className="text-2xl font-bold text-white mt-1">{value}</p>
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const HowItWorks: React.FC<{ steps: string[] }> = ({ steps }) => (
  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
    <p className="text-sm font-semibold text-white">How it works</p>
    {steps.map((s, idx) => (
      <div key={idx} className="flex gap-3 items-start">
        <div className="w-7 h-7 rounded-full bg-orange-500/20 text-orange-300 font-bold flex items-center justify-center text-sm">
          {idx + 1}
        </div>
        <p className="text-sm text-gray-200 leading-snug">{s}</p>
      </div>
    ))}
  </div>
);

const shareTargets = [
  { label: "WhatsApp", color: "bg-[#128C7E] hover:bg-[#0f7a6d]", href: (msg: string, link: string) => `https://wa.me/?text=${encodeURIComponent(msg)}` },
  { label: "Telegram", color: "bg-[#229ED9] hover:bg-[#1d8bc0]", href: (msg: string, link: string) => `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(msg)}` },
  { label: "Facebook", color: "bg-[#1877F2] hover:bg-[#0f66d6]", href: (_msg: string, link: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}` },
  { label: "Instagram", color: "bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] hover:brightness-110", href: (_msg: string, link: string) => `https://www.instagram.com/?url=${encodeURIComponent(link)}` },
  { label: "Snapchat", color: "bg-[#FFFC00] text-black hover:bg-[#e6e200]", href: (_msg: string, link: string) => `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(link)}` },
  { label: "Copy Link", color: "bg-white/10 hover:bg-white/20 border border-white/10", href: (_msg: string, link: string) => link },
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
  const [link, setLink] = useState<string>("https://bazaarlive.uk/invite");
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
    : "Join as a seller on BazaarLive and start earning.";
  const buyerPitch = "Shop live on BazaarLive!";

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
          { label: "Total credit earned", value: formatCurrency(summary?.totalCreditEarned) },
          { label: "Referrals not yet completed", value: String(summary?.notYetCompleted ?? 0) },
          { label: "Referrals completed", value: String(summary?.completed ?? 0) },
          { label: "Followers gained from referrals", value: String(summary?.totalInvites ?? 0) },
        ]
      : [
          { label: "Buyer credit earned", value: formatCurrency(summary?.totalCreditEarned) },
          { label: "Invites sent", value: String(summary?.totalInvites ?? 0) },
          { label: "Orders from invites", value: String(summary?.completed ?? 0) },
          { label: "Pending rewards", value: formatCurrency(summary?.pending ?? 0) },
        ];

  const steps =
    activeTab === "seller"
      ? [
          "Share your seller referral link with creators who could sell on BazaarLive.",
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
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">Referrals</p>
          <h2 className="text-3xl font-bold text-white">Grow BazaarLive and earn</h2>
        </div>
        <div className="flex gap-2 bg-white/5 rounded-full p-1 border border-white/10">
          <button
            onClick={() => setActiveTab("seller")}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              activeTab === "seller" ? "bg-white text-black" : "text-white hover:bg-white/10"
            }`}
          >
            Seller referrals
          </button>
          <button
            onClick={() => setActiveTab("buyer")}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              activeTab === "buyer" ? "bg-white text-black" : "text-white hover:bg-white/10"
            }`}
          >
            Buyer referrals
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-[#141a2a] via-[#0f172a] to-[#0c162c] border border-white/10 p-6 shadow-2xl shadow-black/30">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-amber-300 uppercase tracking-wide mb-1">
                {activeTab === "seller" ? "Invite sellers, earn cash" : "Invite buyers, earn credits"}
              </p>
              <h3 className="text-2xl font-bold text-white mb-2">
                {activeTab === "seller" ? "Share your seller referral link" : "Share your buyer referral link"}
              </h3>
              <p className="text-gray-300">
                {activeTab === "seller"
              ? "Help creators go live and complete their first sale; you both earn when they ship."
              : "Invite shoppers to place their first order; you earn credits when their purchase completes."}
            </p>
            {reward && requirement && (
              <p className="text-xs text-emerald-300 mt-2">
                Earn {formatCurrency(reward)} once your invite ships {formatCurrency(requirement)} in GMV.
              </p>
            )}
          </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/10">
              {code ? `Code: ${code}` : "Loading..."}
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <div className="bg-black/30 border border-white/10 rounded-xl p-3">
              <p className="text-xs text-gray-400">Your referral link</p>
              <div className="flex flex-col md:flex-row md:items-center gap-2 mt-2">
                <input
                  readOnly
                  value={link}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                />
                <button
                  onClick={() => navigator.clipboard?.writeText(link)}
                  className="px-4 py-2 rounded-lg bg-white text-black font-semibold hover:bg-gray-100"
                >
                  Copy
                </button>
              </div>
              {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
              {!error && loading && <p className="text-xs text-gray-400 mt-2">Loading your personalized link…</p>}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {shareTargets.map((t) => (
                <button
                  key={t.label}
                  onClick={() => handleShare(t.href(referralMessage, link), t.label)}
                  className={`text-xs font-semibold text-white rounded-lg px-3 py-2 border border-white/10 ${t.color}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <HowItWorks steps={steps} />
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
          <p className="text-sm font-semibold text-white">Referral status</p>
          <div className="grid grid-cols-2 gap-3">
            {metrics.map((m) => (
              <StatCard key={m.label} label={m.label} value={m.value} hint={m.hint} />
            ))}
          </div>
          {loading && <p className="text-xs text-gray-400 mt-2">Loading your referral link…</p>}
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default ReferralsPanel;
