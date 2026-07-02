// services/analytics.ts
import { auth } from "../src/firebase";
import { getIdToken } from "firebase/auth";

const BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  (import.meta as any).env?.VITE_API_URL ||
  "http://127.0.0.1:3001";

// The dashboard endpoint is auth-gated server-side (per-seller data). Attach
// the caller's Firebase ID token; returns {} when signed out so the fetch
// still runs and surfaces a clean 401.
async function authHeader(): Promise<Record<string, string>> {
  const u = auth.currentUser;
  if (!u) return {};
  try {
    return { Authorization: `Bearer ${await getIdToken(u, false)}` };
  } catch {
    return {};
  }
}

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
  const res = await fetch(url, {
    credentials: "include",
    headers: { ...(await authHeader()) },
  });
  if (!res.ok) {
    throw new Error(`Analytics fetch failed: ${res.status}`);
  }
  return (await res.json()) as AnalyticsDashboard;
}
