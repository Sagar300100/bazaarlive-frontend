import React, { useEffect, useMemo, useState } from "react";
import { getAuth } from "firebase/auth";
import type { ShowData } from "../../services/api";

type ItemStatus = "active" | "draft" | "inactive";

type InventoryItem = {
  id: string;
  name: string;
  category: string;
  description: string;
  quantity: number;
  price: string;
  format: "Auction" | "Buy Now";
  condition: "New" | "Pre-owned";
  featuredIn: string;
  shippingProfile?: string;
  hazardous?: string;
  costPerItem?: string;
  sku?: string;
  variantsEnabled?: boolean;
  status: ItemStatus;
};

const Tab: React.FC<{ label: string; active: boolean; count: number; onClick: () => void }> = ({ label, active, count, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${
      active
        ? "text-white border-[#2B6CB8]"
        : "text-[#4A7AB5] border-[rgba(43,108,184,0.25)] hover:border-[#2B6CB8] hover:text-[#2B6CB8] bg-white"
    }`}
    style={active ? { background: "linear-gradient(135deg,#2B6CB8,#1A4B8C)" } : {}}
  >
    {label} <span className={active ? "text-white/70" : "text-[#4A7AB5]"}>({count})</span>
  </button>
);

interface InventoryPanelProps {
  shows: ShowData[];
  onCreateProduct?: () => void;
}

const InventoryPanel: React.FC<InventoryPanelProps> = ({ shows, onCreateProduct }) => {
  const auth = getAuth();
  const storageKey = (() => {
    const u = auth.currentUser;
    const id = u?.uid || u?.email || "guest";
    return `bl_inventory_${id}`;
  })();

  const [status, setStatus] = useState<ItemStatus>("active");
  const [search, setSearch] = useState("");
  const [bulk, setBulk] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>([]);

  const loadItems = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setItems(JSON.parse(raw));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const saveItems = (next: InventoryItem[]) => {
    setItems(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch { /* ignore */ }
  };

  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          item.status === status &&
          item.name.toLowerCase().includes(search.toLowerCase())
      ),
    [status, search, items]
  );

  const handleDeactivate = (id: string) => {
    saveItems(items.map((it) => (it.id === id ? { ...it, status: "inactive" } : it)));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[#4A7AB5] font-medium">Inventory</p>
          <h1 className="text-3xl font-bold text-[#1B3A6B]">Manage your listings</h1>
        </div>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded-xl border text-sm font-semibold text-[#2B6CB8] bg-white hover:bg-blue-50 transition-colors"
            style={{ borderColor: "rgba(43,108,184,0.3)" }}
          >
            Bulk upload
          </button>
          <button
            onClick={() => onCreateProduct?.()}
            className="px-4 py-2 rounded-xl text-white font-semibold text-sm transition-colors"
            style={{ background: "linear-gradient(135deg,#2B6CB8,#1A4B8C)", boxShadow: "0 4px 14px rgba(43,108,184,0.3)" }}
          >
            Create product
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        <Tab label="Active"   active={status === "active"}   count={items.filter(i => i.status === "active").length}   onClick={() => setStatus("active")} />
        <Tab label="Drafts"   active={status === "draft"}    count={items.filter(i => i.status === "draft").length}    onClick={() => setStatus("draft")} />
        <Tab label="Inactive" active={status === "inactive"} count={items.filter(i => i.status === "inactive").length} onClick={() => setStatus("inactive")} />
      </div>

      {/* Main panel */}
      <div
        className="rounded-2xl bg-white p-4 space-y-4"
        style={{ border: "1.5px solid rgba(43,108,184,0.15)", boxShadow: "0 4px 20px rgba(43,108,184,0.08)" }}
      >
        {/* Toolbar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              className="px-3 py-2 rounded-xl border text-sm text-[#2B6CB8] font-semibold bg-white hover:bg-blue-50 transition-colors"
              style={{ borderColor: "rgba(43,108,184,0.25)" }}
            >
              Filters
            </button>
            <button
              onClick={() => setBulk(!bulk)}
              className="px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
              style={
                bulk
                  ? { background: "linear-gradient(135deg,#2B6CB8,#1A4B8C)", color: "white", border: "1.5px solid #2B6CB8" }
                  : { background: "white", color: "#2B6CB8", border: "1.5px solid rgba(43,108,184,0.25)" }
              }
            >
              {bulk ? "Bulk edit on" : "Bulk edit off"}
            </button>
          </div>
          <div className="flex gap-2 w-full md:w-80">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products"
              className="flex-1 rounded-xl px-3 py-2 text-sm text-[#1B3A6B] placeholder:text-[#4A7AB5] focus:outline-none"
              style={{ border: "1.5px solid rgba(43,108,184,0.25)", background: "rgba(43,108,184,0.04)" }}
            />
            <button
              className="px-3 py-2 rounded-xl text-white font-semibold text-sm"
              style={{ background: "linear-gradient(135deg,#2B6CB8,#1A4B8C)" }}
            >
              Search
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl" style={{ border: "1.5px solid rgba(43,108,184,0.12)" }}>
          <table className="min-w-full text-sm">
            <thead style={{ background: "rgba(43,108,184,0.05)" }}>
              <tr>
                {bulk && (
                  <th className="px-3 py-3 text-left">
                    <input type="checkbox" className="accent-[#2B6CB8]" />
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide font-semibold text-[#4A7AB5]">Product</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide font-semibold text-[#4A7AB5]">Category</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide font-semibold text-[#4A7AB5]">Quantity</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide font-semibold text-[#4A7AB5]">Price &amp; Format</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide font-semibold text-[#4A7AB5]">Condition</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide font-semibold text-[#4A7AB5]">Show</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide font-semibold text-[#4A7AB5]">Actions</th>
              </tr>
            </thead>
            <tbody style={{ borderTop: "1px solid rgba(43,108,184,0.1)" }}>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={bulk ? 8 : 7} className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-[#4A7AB5] text-xl"
                        style={{ background: "rgba(43,108,184,0.08)" }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <p className="font-semibold text-[#1B3A6B]">No items in this view</p>
                      <p className="text-xs text-[#4A7AB5]">Create a product to start selling.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="transition-colors"
                    style={{
                      borderTop: idx > 0 ? "1px solid rgba(43,108,184,0.07)" : undefined,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(43,108,184,0.04)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {bulk && (
                      <td className="px-3 py-3">
                        <input type="checkbox" className="accent-[#2B6CB8]" />
                      </td>
                    )}
                    <td className="px-4 py-3 font-semibold text-[#1B3A6B]">{item.name}</td>
                    <td className="px-4 py-3 text-[#4A7AB5]">{item.category}</td>
                    <td className="px-4 py-3 text-[#4A7AB5]">{item.quantity}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-[#1B3A6B]">{item.price}</span>
                      <span
                        className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: "rgba(43,108,184,0.1)", color: "#2B6CB8", border: "1px solid rgba(43,108,184,0.2)" }}
                      >
                        {item.format}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#4A7AB5]">{item.condition}</td>
                    <td className="px-4 py-3 text-[#4A7AB5]">{item.featuredIn || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 text-xs">
                        <button
                          className="px-3 py-1.5 rounded-lg font-semibold text-[#2B6CB8] hover:bg-blue-50 transition-colors"
                          style={{ border: "1.5px solid rgba(43,108,184,0.25)" }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeactivate(item.id)}
                          className="px-3 py-1.5 rounded-lg font-semibold text-red-500 hover:bg-red-50 transition-colors"
                          style={{ border: "1.5px solid rgba(239,68,68,0.25)" }}
                        >
                          Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryPanel;
