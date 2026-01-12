import React, { useEffect, useMemo, useState } from "react";
import { getAuth } from "firebase/auth";
import type { ShowData } from "../../services/api";

type ItemStatus = "active" | "draft" | "inactive";

type InventoryItem = {
  id: string;
  name: string; // product title
  category: string;
  description: string;
  quantity: number;
  price: string;
  format: "Auction" | "Buy Now";
  condition: "New" | "Pre-owned";
  featuredIn: string; // show id or label
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
    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${active ? "bg-white text-black border-white" : "text-white/80 border-white/10 hover:bg-white/10"}`}
  >
    {label} <span className="text-white/60">({count})</span>
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
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);

  const loadItems = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const saveItems = (next: InventoryItem[]) => {
    setItems(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* ignore */
    }
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

  const handleCreate = (item: InventoryItem) => {
    saveItems([...items, item]);
  };

  const handleUpdate = (item: InventoryItem) => {
    saveItems(items.map((it) => (it.id === item.id ? item : it)));
  };

  const handleDeactivate = (id: string) => {
    saveItems(items.map((it) => (it.id === id ? { ...it, status: "inactive" } : it)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-400">Inventory</p>
          <h1 className="text-3xl font-bold text-white">Manage your listings</h1>
          </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg border border-white/10 text-white/90 hover:bg-white/10 text-sm">Bulk upload</button>
          <button onClick={() => onCreateProduct?.()} className="px-4 py-2 rounded-lg bg-white text-black font-semibold text-sm hover:bg-gray-100">Create product</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Tab label="Active" active={status === "active"} count={items.filter(i => i.status === "active").length} onClick={() => setStatus("active")} />
        <Tab label="Drafts" active={status === "draft"} count={items.filter(i => i.status === "draft").length} onClick={() => setStatus("draft")} />
        <Tab label="Inactive" active={status === "inactive"} count={items.filter(i => i.status === "inactive").length} onClick={() => setStatus("inactive")} />
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-[#0f1628] via-[#0c1524] to-[#0a111f] border border-white/10 shadow-2xl shadow-black/30 p-4 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-2 rounded-lg border border-white/10 text-sm text-white/80 hover:bg-white/10">Filters</button>
            <button
              onClick={() => setBulk(!bulk)}
              className={`px-3 py-2 rounded-lg text-sm border ${bulk ? "bg-white text-black border-white" : "border-white/10 text-white/80 hover:bg-white/10"}`}
            >
              {bulk ? "Bulk edit on" : "Bulk edit off"}
            </button>
          </div>
          <div className="flex gap-2 w-full md:w-80">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
            <button className="px-3 py-2 rounded-lg bg-white text-black font-semibold text-sm hover:bg-gray-100">Search</button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20">
          <table className="min-w-full text-sm text-white/90">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-gray-400">
              <tr>
                {bulk && <th className="px-3 py-3 text-left"><input type="checkbox" className="accent-orange-500" /></th>}
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Quantity</th>
                <th className="px-4 py-3 text-left">Price & Format</th>
                <th className="px-4 py-3 text-left">Condition</th>
                <th className="px-4 py-3 text-left">Show</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={bulk ? 8 : 7} className="px-4 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-300">╳</div>
                      <p>No items in this view.</p>
                      <p className="text-xs text-gray-500">Create a product to start selling.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    {bulk && (
                      <td className="px-3 py-3">
                        <input type="checkbox" className="accent-orange-500" />
                      </td>
                    )}
                    <td className="px-4 py-3 font-semibold">{item.name}</td>
                    <td className="px-4 py-3 text-gray-300">{item.category}</td>
                    <td className="px-4 py-3 text-gray-300">{item.quantity}</td>
                    <td className="px-4 py-3 text-gray-300">
                      <span className="font-semibold text-white">{item.price}</span>
                      <span className="ml-2 text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10">{item.format}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{item.condition}</td>
                    <td className="px-4 py-3 text-gray-300">{item.featuredIn || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 text-xs">
                        <button onClick={() => { setEditing(item); setShowModal(true); }} className="px-3 py-1 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20">Edit</button>
                        <button onClick={() => handleDeactivate(item.id)} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/15 text-red-300">Deactivate</button>
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
