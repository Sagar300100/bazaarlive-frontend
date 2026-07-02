// services/profile.ts
import { getAppCheckHeader } from "../src/firebase";

const BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  (import.meta as any).env?.VITE_API_URL ||
  "http://127.0.0.1:3001";

export interface ProfilePayload {
  username: string;
  handle: string;
  bio?: string;
  avatar?: string;
}

export async function fetchProfile(idToken?: string): Promise<ProfilePayload> {
  const url = `${BASE.replace(/\/$/, "")}/api/profile`;
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      ...(await getAppCheckHeader()),
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`Profile fetch failed: ${res.status}`);
  return (await res.json()) as ProfilePayload;
}

export async function updateProfile(payload: ProfilePayload, idToken?: string): Promise<ProfilePayload> {
  const url = `${BASE.replace(/\/$/, "")}/api/profile`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(await getAppCheckHeader()),
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Profile update failed: ${res.status}`);
  return (await res.json()) as ProfilePayload;
}
