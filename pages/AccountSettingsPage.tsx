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

const SidebarItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors group ${
      isActive
        ? "bg-orange-500/10 text-orange-500"
        : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
    }`}
  >
    {icon}
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
            <div className="mb-8 p-6 bg-gray-900 rounded-2xl shadow border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-2">
                UPI Payment Settings
              </h3>
              <p className="text-gray-400 text-sm mb-4">
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
                    className="flex-1 px-3 py-2 rounded-md bg-gray-800 text-white placeholder-gray-500 border border-gray-700 focus:border-orange-500 outline-none"
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={savingUpi}
                    className={`px-4 py-2 rounded-md text-white font-medium ${
                      savingUpi
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-orange-600 hover:bg-orange-500"
                    }`}
                  >
                    {savingUpi ? "Saving…" : "Save UPI"}
                  </button>
                </div>

                {upiMessage && (
                  <div
                    className={`text-sm ${
                      upiMessage.startsWith("✅")
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {upiMessage}
                  </div>
                )}

                <div className="text-xs text-gray-500">
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
    <div className="bg-gray-800 text-gray-200 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="md:col-span-1">
            <div className="p-4 rounded-lg bg-gray-900 space-y-6">
              {/* User Profile Section */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
                    S
                  </div>
                  <div>
                    <p className="font-bold text-white">sagarsinh</p>
                    <a
                      href="#"
                      className="text-sm text-gray-400 hover:underline"
                    >
                      View Profile
                    </a>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-2">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  General
                </h3>
                <SidebarItem
                  icon={<PreferencesIcon />}
                  label="Preferences"
                  isActive={activePage === "preferences"}
                  onClick={() => setActivePage("preferences")}
                />
                <SidebarItem
                  icon={<PaymentIcon />}
                  label="Payments"
                  isActive={activePage === "payments"}
                  onClick={() => setActivePage("payments")}
                />
                <SidebarItem
                  icon={<AddressIcon />}
                  label="Addresses"
                  isActive={activePage === "addresses"}
                  onClick={() => setActivePage("addresses")}
                />
                <SidebarItem
                  icon={<AccountIcon />}
                  label="Account"
                  isActive={activePage === "account"}
                  onClick={() => setActivePage("account")}
                />
              </nav>

              <nav className="space-y-2 border-t border-gray-700 pt-6">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Help & Legal
                </h3>
                <SidebarItem
                  icon={<UserReportsIcon />}
                  label="User Reports"
                  isActive={activePage === "reports"}
                  onClick={() => setActivePage("reports")}
                />
                <SidebarItem
                  icon={<ContactIcon />}
                  label="Contact Us"
                  isActive={activePage === "contact"}
                  onClick={() => setActivePage("contact")}
                />
              </nav>
            </div>
            <button
              onClick={onSellerHubClick}
              className="w-full mt-6 flex items-center gap-3 px-4 py-3 rounded-md text-sm font-bold bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            >
              <SellerHubIcon />
              <span>{isSeller ? "Seller Hub" : "Become a Seller"}</span>
            </button>
          </aside>

          {/* Content */}
          <main className="md:col-span-3">
            {/* Security block */}
            <section className="mb-8 p-6 bg-gray-900 rounded-2xl shadow border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-2">Security</h2>
              <p className="text-gray-400 text-sm mb-3">
                If you&apos;ve changed your password or think your account might
                be logged in somewhere else, you can force a logout on all other
                devices.
              </p>
              {securityMessage && (
                <p
                  className={`text-sm mb-3 ${
                    securityMessage.toLowerCase().startsWith("http 401") ||
                    securityMessage.toLowerCase().includes("error")
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
                >
                  {securityMessage}
                </p>
              )}
              <button
                onClick={handleRevokeAllSessions}
                disabled={revoking}
                className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-semibold"
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
