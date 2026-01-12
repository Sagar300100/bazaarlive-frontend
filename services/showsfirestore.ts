// services/showsfirestore.ts
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { auth } from "../src/firebase";        // ✅ RELATIVE path
import type { ShowData } from "./api";         // ✅ reuse UI's ShowData type

const db = getFirestore();

function toUI(id: string, d: any): ShowData {
  const when = d?.scheduled_time ? new Date(d.scheduled_time) : null;

  return {
    id,
    name: d?.title ?? d?.name ?? "Untitled Show",
    date: when ? when.toISOString().slice(0, 10) : "TBD",
    time: when ? when.toTimeString().slice(0, 5) : "TBD",
    category: d?.category ?? "Uncategorized",
    subcategory: d?.subcategory ?? "",
    sellingFormat: d?.sellingFormat ?? "Auction",
    brand: d?.brand ?? "N/A",
    shippedFrom: d?.shippedFrom ?? "N/A",
    sellerRating: typeof d?.sellerRating === "number" ? d.sellerRating : 4.5,
    tags: Array.isArray(d?.tags) ? d.tags : [],
    isLive: !!d?.isLive,
    thumbnail: d?.thumbnail_url ?? d?.thumbnail ?? "",
    seller:
      d?.seller?.username ??
      d?.sellerUsername ??
      (typeof d?.seller === "string" ? d.seller : "Anonymous"),

    // optional/raw fields your UI tolerates
    title: d?.title,
    thumbnail_url: d?.thumbnail_url,
    scheduled_time: d?.scheduled_time ?? null,
    sellerId: d?.sellerId ?? undefined,
    sellerObj: d?.sellerObj ?? null,
    ownerUid: d?.ownerUid ?? null,
  };
}

export async function fsFetchShows(): Promise<ShowData[]> {
  const q = query(collection(db, "shows"), orderBy("scheduled_time", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toUI(d.id, d.data()));
}

export async function fsCreateShow(payload: {
  title: string;
  category: string;
  scheduled_time?: string | null;
  description?: string | null;
  subcategory?: string | null;
  brand?: string | null;
  shippedFrom?: string | null;
  sellerRating?: number | null;
  tags?: string[];
  isLive?: boolean;
  thumbnail_url?: string | null;
  sellerUsername?: string;
}): Promise<ShowData> {
  const u = auth.currentUser;
  if (!u) throw new Error("Not signed in");

  const body = {
    ...payload,
    ownerUid: u.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, "shows"), body);
  return toUI(ref.id, body);
}

export async function fsUpdateShow(
  id: string | number,
  patch: Record<string, any>
): Promise<ShowData> {
  const u = auth.currentUser;
  if (!u) throw new Error("Not signed in");

  const docId = String(id);
  const { ownerUid, ...safe } = patch; // keep owner immutable from client
  if (safe.scheduled_time) {
    safe.scheduled_time = new Date(safe.scheduled_time).toISOString();
  }
  safe.updatedAt = serverTimestamp();

  await updateDoc(doc(db, "shows", docId), safe);

  const snap = await getDoc(doc(db, "shows", docId));
  return toUI(snap.id, snap.data() || safe);
}

export async function fsDeleteShow(id: string | number): Promise<boolean> {
  const u = auth.currentUser;
  if (!u) throw new Error("Not signed in");
  await deleteDoc(doc(db, "shows", String(id)));
  return true;
}
