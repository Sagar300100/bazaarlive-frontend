import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../src/firebase";

export type DmMessage = {
  sender: string;
  text: string;
  createdAt: any;
};

// Deterministic thread ID for two users
export function getThreadId(userA: string, userB: string) {
  const [a, b] = [userA.toLowerCase(), userB.toLowerCase()].sort();
  return `${a}__${b}`;
}

export function subscribeDm(
  userA: string,
  userB: string,
  onChange: (docs: DmMessage[]) => void
) {
  const threadId = getThreadId(userA, userB);
  const colRef = collection(db, "dm", threadId, "messages");
  const q = query(colRef, orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    const docs = snap.docs.map((d) => d.data() as DmMessage);
    onChange(docs);
  });
}

export async function sendDm(
  userA: string,
  userB: string,
  payload: { sender: string; text: string }
) {
  const threadId = getThreadId(userA, userB);
  const colRef = collection(db, "dm", threadId, "messages");
  await addDoc(colRef, {
    sender: payload.sender,
    text: payload.text,
    createdAt: serverTimestamp(),
  });
}
