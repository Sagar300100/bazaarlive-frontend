import React, { useState } from 'react';
import { getAuth } from "firebase/auth";
import { GiftIcon, CardIcon, BookmarkIcon, TagIcon, BoxIcon, ShieldIcon, SettingsIcon, ChevronRightIcon, HomeIcon, InventoryIcon, OffersIcon, ShipmentsIcon, FinancesIcon, SupportChatIcon, SellerResourcesIcon } from './Icons';

interface ProfileDropdownProps {
    onNavigate: (page: string) => void;
    onLogout: () => void;
    displayName?: string;
    initial?: string;
}

const Tile: React.FC<{ icon: React.ReactNode; label: string; onClick?: () => void }> = ({ icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex flex-col items-center justify-center text-center p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors duration-150 text-gray-100 focus:outline-none focus:ring-2 focus:ring-white/20"
  >
    <div className="w-10 h-10 flex items-center justify-center mb-1">{icon}</div>
    <span className="text-xs font-semibold text-white">{label}</span>
  </button>
);

const ListRow: React.FC<{ icon: React.ReactNode; label: string; onClick?: () => void; chevron?: boolean }> = ({ icon, label, onClick, chevron }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-white"
  >
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-md bg-white/10 flex items-center justify-center">
        {icon}
      </div>
      <span className="font-semibold">{label}</span>
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
            if (!user) {
                alert("Please sign in to share your referral link.");
                return;
            }
            const token = await user.getIdToken();
            const base =
                (import.meta as any).env?.VITE_API_URL ||
                (import.meta as any).env?.VITE_API_BASE ||
                "http://127.0.0.1:3001";
            const res = await fetch(`${base.replace(/\/$/, "")}/api/profile/referral`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`Referral fetch failed (${res.status})`);
            const { link, code } = await res.json();
            setShareLink(link);
            setShareCode(code);
            // Open our custom modal immediately (skip slow native share sheet)
            if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(link).catch(() => undefined);
            }
            setShareModal(true);
        } catch (err: any) {
            alert(err?.message || "Could not share referral link.");
        } finally {
            setSharing(false);
        }
    };

    return (
        <>
            <div 
                className="absolute top-full right-0 mt-2 w-80 rounded-xl shadow-2xl text-gray-100 border border-[#303743] transform transition-all duration-200 ease-out origin-top-right animate-fade-in-down"
                style={{
                    animationFillMode: 'forwards',
                    background: '#0f121a',
                    backdropFilter: 'none'
                }}
            >
                <div className="p-4">
                    {/* User Info */}
                    <button onClick={() => onNavigate('profile')} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1b2230] transition-colors text-left">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                                {initial}
                            </div>
                            <div>
                                <p className="font-bold text-white">{displayName}</p>
                                <div className="flex gap-4 text-sm text-gray-600">
                                    <div><span className="font-bold text-white">4</span> Following</div>
                                    <div><span className="font-bold text-white">1</span> Followers</div>
                                </div>
                            </div>
                        </div>
                        <ChevronRightIcon />
                    </button>

                    {/* Tabs */}
                    <div className="flex border-b border-[#2a3140]">
                        <button 
                            className={`py-2 px-4 text-sm font-semibold transition-all ${activeTab === 'Selling' ? 'text-white border-b-2 border-white' : 'text-gray-500 hover:text-gray-300'}`}
                            onClick={() => setActiveTab('Selling')}
                        >
                            Selling
                        </button>
                        <button 
                            className={`py-2 px-4 text-sm font-semibold transition-all ${activeTab === 'Buying' ? 'text-white border-b-2 border-white' : 'text-gray-500 hover:text-gray-300'}`}
                            onClick={() => setActiveTab('Buying')}
                        >
                            Buying
                        </button>
                    </div>
                    
                    {activeTab === "Selling" && (
                      <div className="mt-4 space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <Tile icon={<TagIcon />} label="Shows" onClick={() => onNavigate("seller-hub", { sellerHubPage: "shows" })} />
                          <Tile icon={<OffersIcon />} label="Orders" onClick={() => onNavigate('orders')} />
                          <Tile icon={<InventoryIcon />} label="Inventory" onClick={() => onNavigate("seller-hub", { sellerHubPage: "inventory" })} />
                          <Tile icon={<ShipmentsIcon />} label="Shipments" onClick={() => onNavigate("seller-hub", { sellerHubPage: "shipments" })} />
                          <Tile icon={<FinancesIcon />} label="Finances" onClick={() => onNavigate("seller-hub", { sellerHubPage: "finances" })} />
                          <Tile icon={<GiftIcon />} label="Refer a Seller" onClick={() => onNavigate("seller-hub", { sellerHubPage: "referrals" })} />
                        </div>
                        <div className="space-y-1 pt-2 border-t border-white/5">
                          <ListRow icon={<HomeIcon />} label="Seller Hub" onClick={() => onNavigate("seller-hub")} chevron />
                          <ListRow icon={<SupportChatIcon />} label="Friends" onClick={() => onNavigate("friends")} chevron />
                          <ListRow icon={<SettingsIcon />} label="Account Settings" onClick={() => onNavigate('settings')} chevron />
                          <ListRow icon={<SellerResourcesIcon />} label="Account Permissions" onClick={() => onNavigate('account-permissions')} chevron />
                          <ListRow icon={<SellerResourcesIcon />} label="Help & Legal" onClick={() => onNavigate('help-legal')} chevron />
                        </div>
                      </div>
                    )}
                    {activeTab === "Buying" && (
                      <div className="mt-4 space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <Tile icon={<BookmarkIcon />} label="Saved" onClick={() => onNavigate('saved')} />
                          <Tile icon={<BoxIcon />} label="Purchases" onClick={() => onNavigate('purchases')} />
                          <Tile icon={<CardIcon />} label="Payments & Shipping" onClick={() => onNavigate('payments')} />
                        </div>
                      </div>
                    )}
                </div>

                {/* Account Settings & Logout */}
                <div className="border-t border-[#2a3140] rounded-b-xl">
                    <button onClick={onLogout} className="w-full flex items-center gap-3 p-4 hover:bg-[#1b2230] transition-colors text-left">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="font-semibold text-sm text-white">Log Out</span>
                    </button>
                </div>
                <style>{`
                    @keyframes fadeInDown {
                        from {
                            opacity: 0;
                            transform: translateY(-10px) scale(0.98);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0) scale(1);
                        }
                    }
                    .animate-fade-in-down {
                        animation: fadeInDown 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }
                `}</style>
            </div>
            {shareModal && <ShareModal link={shareLink} code={shareCode} onClose={() => setShareModal(false)} />}
        </>
    );
};

const ShareModal: React.FC<{ link: string; code: string; onClose: () => void }> = ({ link, code, onClose }) => {
    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(link);
            alert("Link copied!");
        } catch {
            prompt("Copy your referral link:", link);
        }
    };

    const openShare = (url: string) => {
        window.open(url, "_blank", "noopener,noreferrer");
    };

    const encodedLink = encodeURIComponent(link);
    const encodedMsg = encodeURIComponent(`Join me on BazaarLive! Use my link: ${link}`);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md rounded-2xl bg-gradient-to-br from-[#0f1628] via-[#0c1325] to-[#0a1020] border border-white/10 shadow-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="text-xs text-gray-400">Your referral code</p>
                        <p className="text-lg font-bold text-white tracking-wide">{code || "…"}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4">
                    <p className="text-xs text-gray-400">Referral link</p>
                    <p className="text-sm text-white break-all">{link}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs text-white">
                    <button onClick={copyLink} className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 py-3">Copy link</button>
                    <button onClick={() => openShare(`https://wa.me/?text=${encodedMsg}`)} className="rounded-xl bg-[#128C7E] hover:bg-[#0f7a6d] py-3">WhatsApp</button>
                    <button onClick={() => openShare(`https://t.me/share/url?url=${encodedLink}&text=${encodedMsg}`)} className="rounded-xl bg-[#229ED9] hover:bg-[#1d8bc0] py-3">Telegram</button>
                    <button onClick={() => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`)} className="rounded-xl bg-[#1877F2] hover:bg-[#0f66d6] py-3">Facebook</button>
                    <button onClick={() => openShare(`https://twitter.com/intent/tweet?url=${encodedLink}&text=${encodedMsg}`)} className="rounded-xl bg-[#1DA1F2] hover:bg-[#1787cb] py-3">X / Twitter</button>
                    <button onClick={() => openShare(`https://www.snapchat.com/scan?attachmentUrl=${encodedLink}`)} className="rounded-xl bg-[#FFFC00] text-black hover:bg-[#e6e200] py-3">Snapchat</button>
                    <button onClick={() => openShare(`https://www.instagram.com/?url=${encodedLink}`)} className="rounded-xl bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] hover:brightness-110 py-3">Instagram</button>
                    <button onClick={() => openShare(`sms:?&body=${encodedMsg}`)} className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 py-3">SMS</button>
                    <button onClick={() => openShare(link)} className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 py-3">Open link</button>
                </div>
            </div>
        </div>
    );
};
