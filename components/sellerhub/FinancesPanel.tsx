import React, { useState } from "react";

type TabKey = "ledger" | "payouts" | "reports" | "gst";

const tabs: { key: TabKey; label: string }[] = [
  { key: "ledger",   label: "Ledger" },
  { key: "payouts",  label: "Payouts" },
  { key: "reports",  label: "Statements & Reports" },
  { key: "gst",      label: "VAT ID / GST Number" },
];

// Shared input style
const inputCls = [
  "w-full rounded-xl px-3 py-2.5 text-sm text-[#1B3A6B]",
  "focus:outline-none focus:ring-2 focus:ring-[#2B6CB8]/30",
  "placeholder:text-[#4A7AB5]",
].join(" ");
const inputStyle = { border: "1.5px solid rgba(43,108,184,0.25)", background: "rgba(43,108,184,0.03)" };

const cardStyle = {
  background: "white",
  border: "1.5px solid rgba(43,108,184,0.15)",
  boxShadow: "0 2px 12px rgba(43,108,184,0.07)",
  borderRadius: "0.75rem",
  padding: "1.25rem",
};

const FinancesPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("ledger");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#1B3A6B]">Finances</h1>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1" style={{ borderBottom: "2px solid rgba(43,108,184,0.1)" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`py-2 px-4 text-sm font-semibold transition-colors rounded-t-lg ${
              activeTab === t.key
                ? "text-[#2B6CB8] border-b-2 border-[#2B6CB8] -mb-[2px]"
                : "text-[#4A7AB5] hover:text-[#2B6CB8]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "ledger"  && <LedgerSection />}
      {activeTab === "payouts" && <PayoutsSection />}
      {activeTab === "reports" && <ReportsSection />}
      {activeTab === "gst"     && <GstSection />}
    </div>
  );
};

const LedgerSection: React.FC = () => {
  const filters = ["All", "Processing", "Completed", "Withdrawals"];
  const columns = ["Date", "Amount", "Listing ID", "Order ID", "Message", "Status", "Transaction Type"];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        {[...filters, "Edit dates"].map((f) => (
          <button
            key={f}
            className="px-3 py-1.5 text-sm rounded-full font-semibold text-[#2B6CB8] hover:bg-blue-50 transition-colors"
            style={{ border: "1.5px solid rgba(43,108,184,0.25)" }}
          >
            {f}
          </button>
        ))}
        <button className="ml-auto text-sm font-semibold text-[#2B6CB8] hover:underline">
          Export Data
        </button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: "1.5px solid rgba(43,108,184,0.12)" }}>
        <div
          className="grid text-xs uppercase tracking-wide text-[#4A7AB5] px-4 py-3 font-semibold"
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0,1fr))`, background: "rgba(43,108,184,0.05)" }}
        >
          {columns.map((c) => <span key={c}>{c}</span>)}
        </div>
        <div className="p-8 text-center text-[#4A7AB5] text-sm">No transactions yet.</div>
      </div>
    </div>
  );
};

const PayoutsSection: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2 space-y-4">
      <div style={cardStyle}>
        <h3 className="text-lg font-bold text-[#1B3A6B]">Account Balance</h3>
        <p className="text-3xl font-bold text-[#1B3A6B] mt-2">₹0.00</p>
        <p className="text-sm text-[#4A7AB5] mt-1">Available: ₹0.00 · Processing: ₹0.00</p>
        <p className="text-xs text-[#4A7AB5] mt-1">Funds will appear here after completed orders.</p>
      </div>

      <div style={cardStyle}>
        <h3 className="text-lg font-bold text-[#1B3A6B] mb-3">Payout History</h3>
        <div
          className="p-6 text-center text-[#4A7AB5] text-sm rounded-xl"
          style={{ border: "1.5px dashed rgba(43,108,184,0.2)" }}
        >
          No payouts yet.
        </div>
      </div>
    </div>

    <div>
      <div style={cardStyle} className="space-y-3">
        <h3 className="text-lg font-bold text-[#1B3A6B]">Verify your identity to cash out</h3>
        <p className="text-sm text-[#4A7AB5]">
          Complete identity verification to enable payouts to your bank account.
        </p>
        <button
          className="w-full text-white font-bold py-2.5 rounded-xl transition-colors"
          style={{ background: "linear-gradient(135deg,#2B6CB8,#1A4B8C)", boxShadow: "0 4px 14px rgba(43,108,184,0.3)" }}
        >
          Verify identity
        </button>
        <p className="text-xs text-[#4A7AB5] text-center">
          By verifying, you agree to our Services Agreement and processor terms.
        </p>
      </div>
    </div>
  </div>
);

const ReportsSection: React.FC = () => (
  <div className="space-y-4">
    <p className="text-sm text-[#4A7AB5]">
      Weekly order reports include earnings and refunds. Monthly and annual statements cover all transactions affecting your balance.
    </p>
    <div style={cardStyle} className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div>
          <p className="font-bold text-[#1B3A6B] text-sm">Custom order data estimates</p>
          <p className="text-xs text-[#4A7AB5] mt-0.5">Download order history for a chosen date range.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input type="date" className={inputCls} style={inputStyle} />
          <input type="date" className={inputCls} style={inputStyle} />
          <button
            className="px-4 py-2 rounded-xl text-white text-sm font-bold"
            style={{ background: "linear-gradient(135deg,#2B6CB8,#1A4B8C)" }}
          >
            Send to email
          </button>
        </div>
      </div>
      <div
        className="rounded-xl p-4 text-sm text-[#4A7AB5]"
        style={{ border: "1.5px dashed rgba(43,108,184,0.2)" }}
      >
        No statements requested yet.
      </div>
    </div>
  </div>
);

const GstSection: React.FC = () => (
  <div className="space-y-4">
    <p className="text-sm text-[#4A7AB5]">Add your VAT/GST details. Leave fields blank if not applicable.</p>
    <div style={cardStyle} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Country of VAT/GST registration">
          <select className={inputCls} style={inputStyle}>
            <option value="">Select country</option>
            <option value="IN">India</option>
            <option value="GB">United Kingdom</option>
            <option value="US">United States</option>
          </select>
        </Field>
        <Field label="Organisation type">
          <select className={inputCls} style={inputStyle}>
            <option value="">Select</option>
            <option value="business">Business</option>
            <option value="individual">Individual</option>
          </select>
        </Field>
      </div>
      <Field label="VAT ID or GST Number">
        <input className={inputCls} style={inputStyle} placeholder="Enter your number" />
      </Field>
      <Field label="Name on registration">
        <input className={inputCls} style={inputStyle} placeholder="Registered name" />
      </Field>
      <Field label="Business Registration Number (optional)">
        <input className={inputCls} style={inputStyle} />
      </Field>
      <Field label="Address">
        <div className="space-y-2">
          <input className={inputCls} style={inputStyle} placeholder="Address line 1" />
          <input className={inputCls} style={inputStyle} placeholder="Address line 2 (optional)" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input className={inputCls} style={inputStyle} placeholder="City" />
            <input className={inputCls} style={inputStyle} placeholder="Province/Region" />
            <input className={inputCls} style={inputStyle} placeholder="Postal code" />
          </div>
        </div>
      </Field>
      <div className="flex gap-2 justify-end pt-2">
        <button
          className="px-4 py-2 rounded-xl text-sm font-semibold text-[#2B6CB8] hover:bg-blue-50 transition-colors"
          style={{ border: "1.5px solid rgba(43,108,184,0.25)" }}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 rounded-xl text-white font-bold text-sm"
          style={{ background: "linear-gradient(135deg,#2B6CB8,#1A4B8C)" }}
        >
          Submit
        </button>
      </div>
    </div>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block space-y-1.5">
    <span className="text-xs font-semibold text-[#4A7AB5] uppercase tracking-wide">{label}</span>
    {children}
  </label>
);

export default FinancesPanel;
