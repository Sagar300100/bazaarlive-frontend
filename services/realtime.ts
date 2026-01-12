import { db } from "../src/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";

export interface ProductDoc {
  id: string;
  title: string;
  price: number; // stored as paise in backend
  stock: number;
  reserved: number;
  sold: number;
  variants?: any[];
  thumbnail_url?: string;
  showId?: string | null;
}

export interface AuctionDoc {
  id: string;
  productId: string;
  showId?: string | null;
  startPrice: number;
  bidStep: number;
  currentBid: number;
  currentBidderUid?: string | null;
  currentBidderName?: string | null;
  endsAt?: string | null;
  status: string;
  extendSeconds?: number;
  version?: number;
}

export function listenProducts(
  showId: string,
  cb: (products: ProductDoc[]) => void
) {
  const q = query(
    collection(db, "products"),
    where("showId", "==", showId)
  );
  return onSnapshot(q, (snap) => {
    const items: ProductDoc[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }));
    cb(items);
  });
}

export function listenAuctions(
  showId: string,
  cb: (auctions: AuctionDoc[]) => void
) {
  const q = query(
    collection(db, "auctions"),
    where("showId", "==", showId),
    orderBy("updatedAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const items: AuctionDoc[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }));
    cb(items);
  });
}
