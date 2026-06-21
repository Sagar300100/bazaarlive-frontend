import React, { useState } from 'react';
import { getAuth } from "firebase/auth";
import { GiftIcon, CardIcon, BookmarkIcon, TagIcon, BoxIcon, ShieldIcon, SettingsIcon, ChevronRightIcon, HomeIcon, InventoryIcon, OffersIcon, ShipmentsIcon, FinancesIcon, SupportChatIcon, SellerResourcesIcon } from './Icons';

interface ProfileDropdownProps {
    onNavigate: (page: string, opts?: any) => void;
    onLogout: () => void;
    displayName?: string;
    initial?: string;
}

const Tile: React.FC<{ icon: React.ReactNode; label: string; onClick?: () => void }> = ({ icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex flex-col items-center justify-center text-center py-4 px-2 rounded-2xl transition-all duration-150 focus:outline-none"
    style={{ border: "1.5px solid rgba(43,108,184,0.14)", background: "rgba(43,108,184,0.05)" }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLButtonElement).style.background = "rgba(43,108,184,0.13)";
      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(43,108,184,0.32)";
      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLButtonElement).style.background = "rgba(43,108,184,0.05)";
      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(43,108,184,0.14)";
      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
    }}
  >
    <div className="w-12 h-12 flex items-center justify-center mb-2 text-[#2B6CB8]">{icon}</div>
    <span className="text-xs font-bold text-[#1B3A6B] leading-tight">{label}</span>
  </button>
);

const ListRow: React.FC<{ icon: React.ReactNode; label: string; onClick?: () => void; chevron?: boolean }> = ({ icon, label, onClick, chevron }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm transition-all duration-150"
    style={{ color: "#1B3A6B" }}
    onMouseEnter={e => (e.currentTarget.style.background = "rgba(43,108,184,0.07)")}
    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
  >
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[#2B6CB8]"
        style={{ background: "rgba(43,108,184,0.1)" }}>
        {icon}
      </div>
      <span className="font-semibold text-[#1B3A6B] text-sm">{label}</span>
    </div>
    {chevron && <ChevronRightIcon />}
  </button>
);

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onNavigate, onLogout, displayName = "User", initial = "U" }) => {
    const [activeTab, setActiveTab] = useState<'Selling' | 'Buying'>('Selling');
    const [sharing, setSharing] = useState(false);
    const [shareModal, setShareModal] = useState(false);
    const [shareLink, setShareLink] = useState<string>("");
    const [shareCode, setShareCode] = useState<string>("");

    const shareReferral = async () => {
        try {
            setSharing(true);
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) { alert("Please sign in to share your referral link."); return; }
            const token = await user.getIdToken();
            const base = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_API_BASE || "http://127.0.0.1:3001";
            const res = await fetch(`${base.replace(/\/$/, "")}/api/profile/referral`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error(`Referral fetch failed (${res.status})`);
            const { link, code } = await res.json();
            setShareLink(link); setShareCode(code);
            if (navigator.clipboard?.writeText) navigator.clipboard.writeText(link).catch(() => undefined);
            setShareModal(true);
        } catch (err: any) {
            alert(err?.message || "Could not share referral link.");
        } finally { setSharing(false); }
    };

    return (
        <>
            <style>{`
                @keyframes slideFromRight {
                    from { opacity:0; transform: translateX(28px) scale(0.98); }
                    to   { opacity:1; transform: translateX(0)     scale(1);    }
                }
                .profile-drop {
                    animation: slideFromRight 0.28s cubic-bezier(0.22,1,0.36,1) forwards;
                    transform-origin: top right;
                }
            `}</style>

            <div
                className="profile-drop absolute top-full right-0 mt-2 rounded-2xl overflow-hidden flex flex-col"
                style={{
                    width: "420px",
                    background: "#FFFFFF",
                    border: "1.5px solid rgba(43,108,184,0.18)",
                    boxShadow: "0 24px 64px rgba(43,108,184,0.22), 0 6px 20px rgba(43,108,184,0.12)",
                    maxHeight: "calc(100vh - 80px)",
                }}
            >
                {/* ── Blue header strip ── */}
                <div className="px-5 pt-5 pb-4" style={{ background: "linear-gradient(135deg,#2B6CB8,#1A4B8C)" }}>
                    <button
                        onClick={() => onNavigate('profile')}
                        className="w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-150 text-left"
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-[#2B6CB8] font-bold text-2xl shadow-lg flex-shrink-0">
                                {initial}
                            </div>
                            <div>
                                <p className="font-bold text-white text-base">{displayName}</p>
                                <div className="flex gap-4 text-sm text-white/70 mt-1">
                                    <span><span className="font-bold text-white">4</span> Following</span>
                                    <span><span className="font-bold text-white">1</span> Follower</span>
                                </div>
                            </div>
                        </div>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m9 18 6-6-6-6"/>
                        </svg>
                    </button>

                    {/* Tabs */}
                    <div className="flex mt-4 rounded-xl overflow-hidden p-1" style={{ background: "rgba(255,255,255,0.15)" }}>
                        {(['Selling', 'Buying'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className="flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200"
                                style={{
                                    background: activeTab === tab ? "white" : "transparent",
                                    color: activeTab === tab ? "#2B6CB8" : "rgba(255,255,255,0.75)",
                                    boxShadow: activeTab === tab ? "0 2px 8px rgba(43,108,184,0.2)" : "none",
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Tab content ── */}
                <div className="p-4 overflow-y-auto flex-1">
                    {activeTab === "Selling" && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                                <Tile icon={<TagIcon />}        label="Shows"          onClick={() => onNavigate("seller-hub", { sellerHubPage: "shows" })} />
                                <Tile icon={<OffersIcon />}     label="Orders"         onClick={() => onNavigate('orders')} />
                                <Tile icon={<InventoryIcon />}  label="Inventory"      onClick={() => onNavigate("seller-hub", { sellerHubPage: "inventory" })} />
                                <Tile icon={<ShipmentsIcon />}  label="Shipments"      onClick={() => onNavigate("seller-hub", { sellerHubPage: "shipments" })} />
                                <Tile icon={<FinancesIcon />}   label="Finances"       onClick={() => onNavigate("seller-hub", { sellerHubPage: "finances" })} />
                                <Tile icon={<GiftIcon />}       label="Refer a Seller" onClick={() => onNavigate("seller-hub", { sellerHubPage: "referrals" })} />
                            </div>
                            <div className="pt-2 space-y-0.5" style={{ borderTop: "1.5px solid rgba(43,108,184,0.1)" }}>
                                <ListRow icon={<HomeIcon />}            label="Seller Hub"          onClick={() => onNavigate("seller-hub")} chevron />
                                <ListRow icon={<SupportChatIcon />}     label="Friends"             onClick={() => onNavigate("friends")} chevron />
                                <ListRow icon={<SettingsIcon />}        label="Account Settings"    onClick={() => onNavigate('settings')} chevron />
                                <ListRow icon={<SellerResourcesIcon />} label="Account Permissions" onClick={() => onNavigate('account-permissions')} chevron />
                                <ListRow icon={<SellerResourcesIcon />} label="Help & Legal"        onClick={() => onNavigate('help-legal')} chevron />
                            </div>
                        </div>
                    )}
                    {activeTab === "Buying" && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                                <Tile icon={<GiftIcon />}       label="Refer Friends"       onClick={() => onNavigate('referrals')} />
                                <Tile icon={<CardIcon />}       label="Payments & Shipping" onClick={() => onNavigate('payments')} />
                                <Tile icon={<BookmarkIcon />}   label="Saved"               onClick={() => onNavigate('saved')} />
                                <Tile icon={<OffersIcon />}     label="Bids & Offers"       onClick={() => onNavigate('bids')} />
                                <Tile icon={<BoxIcon />}        label="Purchases"           onClick={() => onNavigate('purchases')} />
                                <Tile icon={<ShieldIcon />}     label="Account Health"      onClick={() => onNavigate('account-health')} />
                            </div>
                            <div className="pt-2 space-y-0.5" style={{ borderTop: "1.5px solid rgba(43,108,184,0.1)" }}>
                                <ListRow icon={<SupportChatIcon />}     label="Friends"          onClick={() => onNavigate('friends')} chevron />
                                <ListRow icon={<SettingsIcon />}        label="Account Settings" onClick={() => onNavigate('settings')} chevron />
                                <ListRow icon={<SellerResourcesIcon />} label="Help & Legal"     onClick={() => onNavigate('help-legal')} chevron />
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Log out ── always visible at bottom ── */}
                <div className="flex-shrink-0" style={{ borderTop: "1.5px solid rgba(43,108,184,0.12)" }}>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-5 py-4 transition-all duration-150 text-left rounded-b-2xl"
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.06)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </div>
                        <span className="font-semibold text-base text-red-500">Sign Out</span>
                    </button>
                </div>
            </div>

            {shareModal && <ShareModal link={shareLink} code={shareCode} onClose={() => setShareModal(false)} />}
        </>
    );
};

const ShareModal: React.FC<{ link: string; code: string; onClose: () => void }> = ({ link, code, onClose }) => {
    const copyLink = async () => {
        try { await navigator.clipboard.writeText(link); alert("Link copied!"); }
        catch { prompt("Copy your referral link:", link); }
    };
    const openShare = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
    const encodedLink = encodeURIComponent(link);
    const encodedMsg  = encodeURIComponent(`Join me on Any & All! Use my link: ${link}`);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(27,58,107,0.45)", backdropFilter: "blur(8px)" }}>
            <div className="w-full max-w-md rounded-2xl p-5 shadow-2xl" style={{ background: "#F8F5F0", border: "1.5px solid rgba(43,108,184,0.2)" }}>
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="text-xs text-[#4A7AB5] font-semibold uppercase tracking-wide">Your referral code</p>
                        <p className="text-lg font-bold text-[#1B3A6B] tracking-wide">{code || "…"}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                        style={{ background: "rgba(43,108,184,0.1)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(43,108,184,0.2)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "rgba(43,108,184,0.1)")}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M1 1l10 10M11 1L1 11" stroke="#1B3A6B" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>
                <div className="rounded-xl p-3 mb-4" style={{ background: "rgba(43,108,184,0.07)", border: "1.5px solid rgba(43,108,184,0.15)" }}>
                    <p className="text-xs text-[#4A7AB5] font-semibold mb-0.5">Referral link</p>
                    <p className="text-sm text-[#1B3A6B] break-all font-medium">{link}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold text-white">
                    <button onClick={copyLink} className="rounded-xl py-3 text-[#1B3A6B]" style={{ background: "rgba(43,108,184,0.1)", border: "1.5px solid rgba(43,108,184,0.2)" }}>Copy link</button>
                    <button onClick={() => openShare(`https://wa.me/?text=${encodedMsg}`)}                                      className="rounded-xl py-3 bg-[#128C7E]">WhatsApp</button>
                    <button onClick={() => openShare(`https://t.me/share/url?url=${encodedLink}&text=${encodedMsg}`)}           className="rounded-xl py-3 bg-[#229ED9]">Telegram</button>
                    <button onClick={() => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`)}           className="rounded-xl py-3 bg-[#1877F2]">Facebook</button>
                    <button onClick={() => openShare(`https://twitter.com/intent/tweet?url=${encodedLink}&text=${encodedMsg}`)} className="rounded-xl py-3 bg-[#1DA1F2]">X / Twitter</button>
                    <button onClick={() => openShare(`https://www.snapchat.com/scan?attachmentUrl=${encodedLink}`)}            className="rounded-xl py-3 bg-[#FFFC00] text-black">Snapchat</button>
                    <button onClick={() => openShare(`https://www.instagram.com/?url=${encodedLink}`)}                         className="rounded-xl py-3 col-span-1" style={{ background: "linear-gradient(135deg,#f58529,#dd2a7b,#8134af)" }}>Instagram</button>
                    <button onClick={() => openShare(`sms:?&body=${encodedMsg}`)}                                              className="rounded-xl py-3 text-[#1B3A6B]" style={{ background: "rgba(43,108,184,0.1)", border: "1.5px solid rgba(43,108,184,0.2)" }}>SMS</button>
                    <button onClick={() => openShare(link)}                                                                    className="rounded-xl py-3 text-[#1B3A6B]" style={{ background: "rgba(43,108,184,0.1)", border: "1.5px solid rgba(43,108,184,0.2)" }}>Open link</button>
                </div>
            </div>
        </div>
    );
};
