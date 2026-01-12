import React, { useState } from "react";
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

interface Props {
  shows: ShowData[];
  onCancel: () => void;
  onSaved: () => void;
}

const inputClass =
  "w-full bg-[#0f1524] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20";
const selectClass =
  "w-full bg-[#0f1524] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20";

const CreateProductPage: React.FC<Props> = ({ shows, onCancel, onSaved }) => {
  const auth = getAuth();
  const storageKey = (() => {
    const u = auth.currentUser;
    const id = u?.uid || u?.email || "guest";
    return `bl_inventory_${id}`;
  })();

  const firstShow = shows[0]?.title || shows[0]?.id?.toString() || "";

  const [form, setForm] = useState<Omit<InventoryItem, "id" | "status">>({
    name: "",
    category: "",
    description: "",
    quantity: 1,
    price: "",
    format: "Auction",
    condition: "New",
    featuredIn: firstShow,
    shippingProfile: "",
    hazardous: "No hazardous materials",
    costPerItem: "",
    sku: "",
    variantsEnabled: false,
  });
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);

  const update = (k: keyof typeof form, v: any) => setForm((s) => ({ ...s, [k]: v }));

  const save = (status: ItemStatus) => {
    if (!form.name.trim() || !form.category.trim() || !form.featuredIn.trim()) return;
    setSaving(status === "draft" ? "draft" : "publish");
    try {
      const raw = localStorage.getItem(storageKey);
      const items: InventoryItem[] = raw ? JSON.parse(raw) : [];
      const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
      const next: InventoryItem = { id, status, ...form };
      localStorage.setItem(storageKey, JSON.stringify([...items, next]));
      onSaved();
    } catch {
      alert("Could not save product locally.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">Inventory</p>
          <h1 className="text-3xl font-bold text-white">Create product</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-white/10 text-white/80 hover:bg-white/10 text-sm">Cancel</button>
          <button onClick={() => save("draft")} className="px-4 py-2 rounded-lg bg-white/10 text-white font-semibold text-sm border border-white/20 hover:bg-white/15" disabled={!!saving}>
            {saving === "draft" ? "Saving…" : "Save draft"}
          </button>
          <button onClick={() => save("active")} className="px-4 py-2 rounded-lg bg-white text-black font-semibold text-sm hover:bg-gray-100" disabled={!!saving}>
            {saving === "publish" ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <Section title="Product details">
            <Field label="Product name" required>
              <input value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass} placeholder="E.g., Vintage sneakers (Size 9)" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Category" required>
                <input value={form.category} onChange={(e) => update("category", e.target.value)} className={inputClass} placeholder="Sneakers, Electronics…" />
              </Field>
              <Field label="Quantity" required>
                <input type="number" min={0} value={form.quantity} onChange={(e) => update("quantity", Number(e.target.value))} className={inputClass} />
              </Field>
            </div>
            <Field label="Description" required>
              <textarea value={form.description} onChange={(e) => update("description", e.target.value)} className={`${inputClass} h-24 resize-none`} placeholder="Details, condition, sizing, what buyers should know…" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Price" required>
                <input value={form.price} onChange={(e) => update("price", e.target.value)} className={inputClass} placeholder="₹0.00" />
              </Field>
              <Field label="Format" required>
                <select value={form.format} onChange={(e) => update("format", e.target.value as any)} className={selectClass}>
                  <option value="Auction">Auction</option>
                  <option value="Buy Now">Buy Now</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Condition" required>
                <select value={form.condition} onChange={(e) => update("condition", e.target.value as any)} className={selectClass}>
                  <option value="New">New</option>
                  <option value="Pre-owned">Pre-owned</option>
                </select>
              </Field>
              <Field label="Assign to show" required>
                <select
                  value={form.featuredIn}
                  onChange={(e) => update("featuredIn", e.target.value)}
                  className={selectClass}
                  style={{ color: "#fff", backgroundColor: "#0f1524" }}
                >
                  {shows.map((s) => (
                    <option key={s.id} value={s.title || `Show ${s.id}`} className="text-black">
                      {s.title || `Show ${s.id}`}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Variants">
            <label className="flex items-center gap-2 text-sm text-gray-200">
              <input type="checkbox" className="accent-orange-500" checked={form.variantsEnabled} onChange={(e) => update("variantsEnabled", e.target.checked)} />
              Enable variants (colors/sizes/quantities)
            </label>
          </Section>
        </div>

        <div className="space-y-4">
          <Section title="Shipping">
            <Field label="Shipping profile">
              <input value={form.shippingProfile} onChange={(e) => update("shippingProfile", e.target.value)} className={inputClass} placeholder="e.g., Standard domestic" />
            </Field>
            <Field label="Hazardous materials">
              <select value={form.hazardous} onChange={(e) => update("hazardous", e.target.value)} className={selectClass}>
                <option>No hazardous materials</option>
                <option>Lithium batteries</option>
                <option>Fragrance</option>
                <option>Other regulated</option>
              </select>
            </Field>
          </Section>
          <Section title="Optional fields">
            <Field label="Cost per item">
              <input value={form.costPerItem} onChange={(e) => update("costPerItem", e.target.value)} className={inputClass} />
            </Field>
            <Field label="SKU">
              <input value={form.sku} onChange={(e) => update("sku", e.target.value)} className={inputClass} />
            </Field>
          </Section>
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-2xl bg-gradient-to-br from-[#0f1628] via-[#0c1524] to-[#0a111f] border border-white/10 shadow-2xl shadow-black/30 p-5 space-y-3">
    <p className="text-sm font-semibold text-white">{title}</p>
    {children}
  </div>
);

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
  <label className="block text-sm text-gray-200 space-y-1">
    <span className="text-xs text-gray-400">
      {label} {required && <span className="text-red-400">*</span>}
    </span>
    {children}
  </label>
);

export default CreateProductPage;
