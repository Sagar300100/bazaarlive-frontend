import React, { useState } from "react";
import {
  UserCircleIcon,
  PreferencesIcon,
  PaymentIcon,
  AddressIcon,
  AccountIcon,
  UserReportsIcon,
  ContactIcon,
  SellerHubIcon,
} from "../components/Icons";
import PreferencesPanel from "../components/settings/PreferencesPanel";
import PaymentsPanel from "../components/settings/PaymentsPanel";
import AddressesPanel from "../components/settings/AddressesPanel";
import AccountPanel from "../components/settings/AccountPanel";

// API helpers
import { saveMyUpi, revokeAllSessions } from "../services/api";

type SettingsPage =
  | "general"
  | "preferences"
  | "payments"
  | "addresses"
  | "account"
  | "reports"
  | "contact";

interface AccountSettingsPageProps {
  isSeller: boolean;
  onNavigate: (page: string) => void;
  onSellerHubClick: () => void;
}

const NAVY = "#1B3A6B";
const BLUE = "#2B6CB8";
const CREAM = "#F8F5F0";

const SidebarItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors"
    style={
      isActive
        ? { background: "rgba(43,108,184,0.12)", color: NAVY }
        : { color: NAVY }
    }
    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(43,108,184,0.06)"; }}
    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
  >
    <span style={{ color: BLUE, display: "inline-flex" }}>{icon}</span>
    <span>{label}</span>
  </button>
);

const AccountSettingsPage: React.FC<AccountSettingsPageProps> = ({
  isSeller,
  onNavigate,
  onSellerHubClick,
}) => {
  const [activePage, setActivePage] = useState<SettingsPage>("preferences");

  // UPI state
  const [upiInput, setUpiInput] = useState("");
  const [savingUpi, setSavingUpi] = useState(false);
  const [upiMessage, setUpiMessage] = useState<string | null>(null);

  // Security section state
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  // Simple client-side VPA validation
  const UPI_VPA_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

  async function handleSaveUpi(e: React.FormEvent) {
    e.preventDefault();
    setUpiMessage(null);

    const vpa = upiInput.trim();
    if (!UPI_VPA_REGEX.test(vpa)) {
      setUpiMessage("Please enter a valid UPI ID (e.g., yourname@okicici)");
      return;
    }

    try {
      setSavingUpi(true);
      await saveMyUpi(vpa);
      setUpiMessage(`✅ Saved UPI: ${vpa}`);
      setUpiInput("");
    } catch (err: any) {
      setUpiMessage(err?.message || "Failed to save UPI ID");
    } finally {
      setSavingUpi(false);
    }
  }

  async function handleRevokeAllSessions() {
    setSecurityMessage(null);
    setRevoking(true);
    try {
      await revokeAllSessions();
      setSecurityMessage(
        "All refresh tokens have been revoked. Other devices will be logged out shortly."
      );
    } catch (err: any) {
      setSecurityMessage(err?.message || "Failed to revoke sessions");
    } finally {
      setRevoking(false);
    }
  }

  const renderContent = () => {
    switch (activePage) {
      case "preferences":
        return <PreferencesPanel />;

      case "payments":
        return (
          <>
            {/* -------- UPI Payment Settings (new) -------- */}
            <div className="mb-8 p-6 rounded-2xl" style={{ background: "#FFFFFF", border: `1.5px solid rgba(43,108,184,0.14)`, boxShadow: "0 2px 12px rgba(43,108,184,0.06)" }}>
              <h3 className="text-lg font-bold mb-2" style={{ color: NAVY }}>
                UPI Payment Settings
              </h3>
              <p className="text-sm mb-4" style={{ color: "#4A7AB5" }}>
                Add or update your UPI ID (VPA). We will send a{" "}
                <strong>UPI Collect</strong> request to this ID when you buy
                from inventory or win a bid.
              </p>

              <form onSubmit={handleSaveUpi} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    value={upiInput}
                    onChange={(e) => setUpiInput(e.target.value)}
                    name="upi"
                    type="text"
                    placeholder="e.g. yourname@okicici"
                    className="flex-1 px-3 py-2.5 rounded-lg outline-none focus:ring-2"
                    style={{ background: "#F8FAFC", color: NAVY, border: `1.5px solid #E2E8F0` }}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={savingUpi}
                    className="px-5 py-2.5 rounded-lg text-white font-bold disabled:cursor-not-allowed transition-colors"
                    style={{ background: savingUpi ? "#94a3b8" : NAVY }}
                    onMouseEnter={(e) => { if (!savingUpi) (e.currentTarget as HTMLButtonElement).style.background = BLUE; }}
                    onMouseLeave={(e) => { if (!savingUpi) (e.currentTarget as HTMLButtonElement).style.background = NAVY; }}
                  >
                    {savingUpi ? "Saving…" : "Save UPI"}
                  </button>
                </div>

                {upiMessage && (
                  <div
                    className={`text-sm ${
                      upiMessage.startsWith("✅")
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {upiMessage}
                  </div>
                )}

                <div className="text-xs" style={{ color: "#94A3B8" }}>
                  Tip: A valid UPI ID looks like <code>name@bank</code> or{" "}
                    <code>mobile@upi</code>.
                </div>
              </form>
            </div>

            {/* Existing Payments panel below */}
            <PaymentsPanel />
          </>
        );

      case "addresses":
        return <AddressesPanel />;

      case "account":
        return <AccountPanel />;

      default:
        return (
          <div className="text-gray-400 p-8">
            Select a category to view its settings.
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${CREAM} 0%, #FFFFFF 100%)` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="md:col-span-1">
            <div className="p-5 rounded-2xl space-y-6" style={{ background: "#FFFFFF", border: `1.5px solid rgba(43,108,184,0.14)`, boxShadow: "0 2px 12px rgba(43,108,184,0.06)" }}>
              {/* User Profile Section */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl" style={{ background: `linear-gradient(135deg, ${BLUE}, ${NAVY})` }}>
                    S
                  </div>
                  <div>
                    <p className="font-bold" style={{ color: NAVY }}>sagarsinh</p>
                    <a href="#" className="text-sm hover:underline" style={{ color: "#4A7AB5" }}>
                      View Profile
                    </a>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                <h3 className="px-3 text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#4A7AB5" }}>
                  General
                </h3>
                <SidebarItem icon={<PreferencesIcon />} label="Preferences" isActive={activePage === "preferences"} onClick={() => setActivePage("preferences")} />
                <SidebarItem icon={<PaymentIcon />}      label="Payments"    isActive={activePage === "payments"}    onClick={() => setActivePage("payments")} />
                <SidebarItem icon={<AddressIcon />}      label="Addresses"   isActive={activePage === "addresses"}   onClick={() => setActivePage("addresses")} />
                <SidebarItem icon={<AccountIcon />}      label="Account"     isActive={activePage === "account"}     onClick={() => setActivePage("account")} />
              </nav>

              <nav className="space-y-1 pt-5" style={{ borderTop: `1.5px solid rgba(43,108,184,0.12)` }}>
                <h3 className="px-3 text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#4A7AB5" }}>
                  Help &amp; Legal
                </h3>
                <SidebarItem icon={<UserReportsIcon />} label="User Reports" isActive={activePage === "reports"} onClick={() => setActivePage("reports")} />
                <SidebarItem icon={<ContactIcon />}     label="Contact Us"   isActive={activePage === "contact"} onClick={() => setActivePage("contact")} />
              </nav>
            </div>
            <button
              onClick={onSellerHubClick}
              className="w-full mt-6 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all"
              style={{ background: NAVY, color: "white", boxShadow: "0 2px 8px rgba(27,58,107,0.25)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = BLUE; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = NAVY; }}
            >
              <SellerHubIcon />
              <span>{isSeller ? "Seller Hub" : "Become a Seller"}</span>
            </button>
          </aside>

          {/* Content */}
          <main className="md:col-span-3">
            {/* Security block */}
            <section className="mb-8 p-6 rounded-2xl" style={{ background: "#FFFFFF", border: `1.5px solid rgba(43,108,184,0.14)`, boxShadow: "0 2px 12px rgba(43,108,184,0.06)" }}>
              <h2 className="text-xl font-bold mb-2" style={{ color: NAVY }}>Security</h2>
              <p className="text-sm mb-3" style={{ color: "#4A7AB5" }}>
                If you&apos;ve changed your password or think your account might
                be logged in somewhere else, you can force a logout on all other
                devices.
              </p>
              {securityMessage && (
                <p
                  className={`text-sm mb-3 ${
                    securityMessage.toLowerCase().startsWith("http 401") ||
                    securityMessage.toLowerCase().includes("error")
                      ? "text-red-500"
                      : "text-green-600"
                  }`}
                >
                  {securityMessage}
                </p>
              )}
              <button
                onClick={handleRevokeAllSessions}
                disabled={revoking}
                className="px-5 py-2.5 rounded-lg disabled:cursor-not-allowed text-white font-bold transition-colors"
                style={{ background: revoking ? "#94a3b8" : "#DC2626" }}
                onMouseEnter={(e) => { if (!revoking) (e.currentTarget as HTMLButtonElement).style.background = "#B91C1C"; }}
                onMouseLeave={(e) => { if (!revoking) (e.currentTarget as HTMLButtonElement).style.background = "#DC2626"; }}
              >
                {revoking ? "Revoking…" : "Log out from all devices"}
              </button>
            </section>

            {/* Rest of account settings */}
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AccountSettingsPage;
