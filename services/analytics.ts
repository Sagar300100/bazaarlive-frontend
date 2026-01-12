// services/analytics.ts
const BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  (import.meta as any).env?.VITE_API_URL ||
  "http://127.0.0.1:3001";

export interface AnalyticsDashboard {
  range: string;
  stats: { label: string; value: string; delta?: string; trend?: "up" | "down" | "flat" }[];
  revenueBars: { label: string; value: number }[];
  traffic: { label: string; value: number }[];
  topProducts: { name: string; units: number; revenue: string }[];
  sessions: { title: string; viewers: number; peak: number; conversion: number }[];
}

export async function fetchAnalyticsDashboard(range = "7d"): Promise<AnalyticsDashboard> {
  const url = `${BASE.replace(/\/$/, "")}/api/analytics/dashboard?range=${encodeURIComponent(range)}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    throw new Error(`Analytics fetch failed: ${res.status}`);
  }
  return (await res.json()) as AnalyticsDashboard;
}
