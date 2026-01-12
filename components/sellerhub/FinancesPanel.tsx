import React, { useState } from "react";

type TabKey = "ledger" | "payouts" | "reports" | "gst";

const tabs: { key: TabKey; label: string }[] = [
  { key: "ledger", label: "Ledger" },
  { key: "payouts", label: "Payouts" },
  { key: "reports", label: "Statements & Reports" },
  { key: "gst", label: "VAT ID / GST Number" },
];

const FinancesPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("ledger");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Finances</h1>

      <div className="flex border-b border-gray-700 gap-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`py-2 px-3 text-sm font-semibold ${
              activeTab === t.key ? "text-white border-b-2 border-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "ledger" && <LedgerSection />}
      {activeTab === "payouts" && <PayoutsSection />}
      {activeTab === "reports" && <ReportsSection />}
      {activeTab === "gst" && <GstSection />}
    </div>
  );
};

const LedgerSection: React.FC = () => {
  const filters = ["All", "Processing", "Completed", "Withdrawals"];
  const columns = ["Date", "Amount", "Listing ID", "Order ID", "Message", "Status", "Transaction Type"];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button key={f} className="px-3 py-1.5 text-sm rounded-full border border-white/10 text-white/80 hover:bg-white/10">
            {f}
          </button>
        ))}
        <button className="px-3 py-1.5 text-sm rounded-full border border-white/10 text-white/80 hover:bg-white/10">
          Edit dates
        </button>
        <div className="ml-auto text-sm text-gray-400">Export Data</div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="grid grid-cols-7 text-xs uppercase tracking-wide text-gray-400 px-4 py-3 bg-white/5">
          {columns.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        <div className="p-8 text-center text-gray-400">No transactions yet.</div>
      </div>
    </div>
  );
};

const PayoutsSection: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-2">
          <h3 className="text-lg font-semibold text-white">Account Balance</h3>
          <p className="text-3xl font-bold text-white">£0.00</p>
          <p className="text-sm text-gray-400">Available: £0.00 · Processing: £0.00</p>
          <p className="text-xs text-gray-500">Funds will appear here after completed orders.</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Payout History</h3>
          </div>
          <div className="p-6 text-center text-gray-400 border border-dashed border-white/10 rounded-lg">
            No payouts yet.
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
          <h3 className="text-lg font-semibold text-white">Verify your identity to cash out</h3>
          <p className="text-sm text-gray-400">
            Complete identity verification to enable payouts to your bank account.
          </p>
          <button className="w-full bg-white text-black font-semibold py-2.5 rounded-lg hover:bg-gray-100">
            Verify identity
          </button>
          <p className="text-xs text-gray-500 text-center">
            By verifying, you agree to our Services Agreement and processor terms.
          </p>
        </div>
      </div>
    </div>
  );
};

const ReportsSection: React.FC = () => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-300">
        Weekly order reports include earnings and refunds. Monthly and annual statements cover all transactions affecting your balance.
      </p>
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="text-sm text-gray-300">
            <p className="font-semibold text-white">Custom order data estimates</p>
            <p className="text-xs text-gray-400">Download order history for a chosen date range.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input type="date" className="input-lite" />
            <input type="date" className="input-lite" />
            <button className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-100">
              Send to email
            </button>
          </div>
        </div>
        <div className="rounded-lg border border-dashed border-white/10 p-4 text-sm text-gray-400">
          No statements requested yet.
        </div>
      </div>
    </div>
  );
};

const GstSection: React.FC = () => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-300">Add your VAT/GST details. Leave fields blank if not applicable.</p>
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Country of VAT/GST registration">
            <select className="input-lite text-white">
              <option value="">Select country</option>
              <option value="GB">United Kingdom</option>
              <option value="IN">India</option>
              <option value="US">United States</option>
            </select>
          </Field>
          <Field label="Organization type">
            <select className="input-lite text-white">
              <option value="">Select</option>
              <option value="business">Business</option>
              <option value="individual">Individual</option>
            </select>
          </Field>
        </div>
        <Field label="VAT ID or GST Number">
          <input className="input-lite" placeholder="Enter your number" />
        </Field>
        <Field label="Name on registration">
          <input className="input-lite" placeholder="Registered name" />
        </Field>
        <Field label="Business Registration Number (optional)">
          <input className="input-lite" />
        </Field>
        <Field label="Address">
          <input className="input-lite mb-2" placeholder="Address line 1" />
          <input className="input-lite mb-2" placeholder="Address line 2 (optional)" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input className="input-lite" placeholder="City" />
            <input className="input-lite" placeholder="Province/Region" />
            <input className="input-lite" placeholder="Postal code" />
          </div>
        </Field>
        <div className="flex gap-2 justify-end pt-2">
          <button className="px-4 py-2 rounded-lg border border-white/10 text-sm text-white/80 hover:bg-white/10">Cancel</button>
          <button className="px-4 py-2 rounded-lg bg-white text-black font-semibold text-sm hover:bg-gray-100">Submit</button>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block text-sm text-gray-200 space-y-1">
    <span className="text-xs text-gray-400">{label}</span>
    {children}
  </label>
);

export default FinancesPanel;
