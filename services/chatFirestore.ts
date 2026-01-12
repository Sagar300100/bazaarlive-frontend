// services/chatFirestore.ts
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../src/firebase";

/** Firestore chat document shape */
export type ChatDoc = {
  user: string;
  avatar?: string;
  text: string;
  isBid?: boolean;
  createdAt: Timestamp | null;
};

/** Subscribe to messages for a show (ascending by time). Returns unsubscribe fn. */
export function subscribeMessages(
  showId: string,
  onChange: (docs: ChatDoc[]) => void
) {
  const colRef = collection(db, "shows", showId, "chat");
  const q = query(colRef, orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    const docs = snap.docs.map((d) => d.data() as ChatDoc);
    onChange(docs);
  });
}

/** Persist a message to Firestore for a show */
export async function sendMessage(
  showId: string,
  payload: { user: string; text: string; avatar?: string; isBid?: boolean }
) {
  const colRef = collection(db, "shows", showId, "chat");
  await addDoc(colRef, {
    user: payload.user,
    text: payload.text,
    avatar: payload.avatar ?? payload.user.slice(0, 2).toUpperCase(),
    isBid: !!payload.isBid,
    createdAt: serverTimestamp(),
  });
}
