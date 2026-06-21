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

const inputStyle = { border: "1.5px solid rgba(43,108,184,0.25)", background: "rgba(43,108,184,0.03)" };
const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm text-[#1B3A6B] placeholder:text-[#4A7AB5] focus:outline-none focus:ring-2 focus:ring-[#2B6CB8]/30";

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#4A7AB5] font-medium">Inventory</p>
          <h1 className="text-3xl font-bold text-[#1B3A6B]">Create product</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-[#4A7AB5] hover:text-[#2B6CB8] hover:bg-blue-50 transition-colors"
            style={{ border: "1.5px solid rgba(43,108,184,0.2)" }}
          >
            Cancel
          </button>
          <button
            onClick={() => save("draft")}
            disabled={!!saving}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-[#2B6CB8] hover:bg-blue-50 transition-colors disabled:opacity-50"
            style={{ border: "1.5px solid rgba(43,108,184,0.3)" }}
          >
            {saving === "draft" ? "Saving…" : "Save draft"}
          </button>
          <button
            onClick={() => save("active")}
            disabled={!!saving}
            className="px-4 py-2 rounded-xl text-white font-bold text-sm transition-colors disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#2B6CB8,#1A4B8C)", boxShadow: "0 4px 14px rgba(43,108,184,0.3)" }}
          >
            {saving === "publish" ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <Section title="Product details">
            <Field label="Product name" required>
              <input value={form.name} onChange={(e) => update("name", e.target.value)} className={inputCls} style={inputStyle} placeholder="E.g., Vintage sneakers (Size 9)" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Category" required>
                <input value={form.category} onChange={(e) => update("category", e.target.value)} className={inputCls} style={inputStyle} placeholder="Sneakers, Electronics…" />
              </Field>
              <Field label="Quantity" required>
                <input type="number" min={0} value={form.quantity} onChange={(e) => update("quantity", Number(e.target.value))} className={inputCls} style={inputStyle} />
              </Field>
            </div>
            <Field label="Description" required>
              <textarea value={form.description} onChange={(e) => update("description", e.target.value)} className={`${inputCls} h-24 resize-none`} style={inputStyle} placeholder="Details, condition, sizing, what buyers should know…" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Price" required>
                <input value={form.price} onChange={(e) => update("price", e.target.value)} className={inputCls} style={inputStyle} placeholder="₹0.00" />
              </Field>
              <Field label="Format" required>
                <select value={form.format} onChange={(e) => update("format", e.target.value as any)} className={inputCls} style={inputStyle}>
                  <option value="Auction">Auction</option>
                  <option value="Buy Now">Buy Now</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Condition" required>
                <select value={form.condition} onChange={(e) => update("condition", e.target.value as any)} className={inputCls} style={inputStyle}>
                  <option value="New">New</option>
                  <option value="Pre-owned">Pre-owned</option>
                </select>
              </Field>
              <Field label="Assign to show" required>
                <select value={form.featuredIn} onChange={(e) => update("featuredIn", e.target.value)} className={inputCls} style={inputStyle}>
                  {shows.map((s) => (
                    <option key={s.id} value={s.title || `Show ${s.id}`}>
                      {s.title || `Show ${s.id}`}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Variants">
            <label className="flex items-center gap-2 text-sm text-[#1B3A6B] cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded"
                style={{ accentColor: "#2B6CB8" }}
                checked={form.variantsEnabled}
                onChange={(e) => update("variantsEnabled", e.target.checked)}
              />
              Enable variants (colours/sizes/quantities)
            </label>
          </Section>
        </div>

        <div className="space-y-4">
          <Section title="Shipping">
            <Field label="Shipping profile">
              <input value={form.shippingProfile} onChange={(e) => update("shippingProfile", e.target.value)} className={inputCls} style={inputStyle} placeholder="e.g., Standard domestic" />
            </Field>
            <Field label="Hazardous materials">
              <select value={form.hazardous} onChange={(e) => update("hazardous", e.target.value)} className={inputCls} style={inputStyle}>
                <option>No hazardous materials</option>
                <option>Lithium batteries</option>
                <option>Fragrance</option>
                <option>Other regulated</option>
              </select>
            </Field>
          </Section>

          <Section title="Optional fields">
            <Field label="Cost per item">
              <input value={form.costPerItem} onChange={(e) => update("costPerItem", e.target.value)} className={inputCls} style={inputStyle} />
            </Field>
            <Field label="SKU">
              <input value={form.sku} onChange={(e) => update("sku", e.target.value)} className={inputCls} style={inputStyle} />
            </Field>
          </Section>
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div
    className="bg-white rounded-2xl p-5 space-y-4"
    style={{ border: "1.5px solid rgba(43,108,184,0.15)", boxShadow: "0 2px 12px rgba(43,108,184,0.07)" }}
  >
    <p className="text-sm font-bold text-[#1B3A6B]">{title}</p>
    {children}
  </div>
);

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
  <label className="block space-y-1.5">
    <span className="text-xs font-semibold text-[#4A7AB5] uppercase tracking-wide">
      {label} {required && <span className="text-red-500">*</span>}
    </span>
    {children}
  </label>
);

export default CreateProductPage;
