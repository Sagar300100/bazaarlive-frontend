import {
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../src/firebase";

export type DmMessage = {
  senderId?: string;   // required by firestore.rules — set on send
  sender: string;      // display name (may be stale if renamed)
  text: string;
  createdAt: any;
};

// Deterministic thread ID for two users. Keeps lowercased-username layout
// so the ID is stable and shareable across sessions; the participant UIDs
// still live on the parent doc for rules to enforce access.
export function getThreadId(userA: string, userB: string) {
  const [a, b] = [userA.toLowerCase(), userB.toLowerCase()].sort();
  return `${a}__${b}`;
}

// Resolve a username to its uid via the public /usernames collection.
// Returns null for missing/invalid/unclaimed handles. Used before creating
// a DM thread so the parent doc can carry BOTH participant uids at birth.
async function lookupUidByUsername(username: string): Promise<string | null> {
  const clean = username.trim().toLowerCase();
  if (!clean) return null;
  try {
    const snap = await getDoc(doc(db, "usernames", clean));
    if (!snap.exists()) return null;
    const data = snap.data() as any;
    return typeof data?.uid === "string" ? data.uid : null;
  } catch {
    return null;
  }
}

// Create the dm/{threadId} parent doc with BOTH participant uids so
// firestore.rules can gate every subsequent read/write to only the two
// members. Idempotent — no-op if the doc already exists.
//
// Per rules, parent doc creation requires participants.size() == 2 and
// includes the caller. Once created it's immutable — this closes the
// earlier hole where any signed-in user could rewrite participants.
async function ensureThread(threadId: string, myUid: string, otherUid: string) {
  const ref = doc(db, "dm", threadId);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    participants: [myUid, otherUid].sort(),
    createdAt: serverTimestamp(),
  });
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
  myUsername: string,
  otherUsername: string,
  payload: { sender: string; text: string }
) {
  const u = auth.currentUser;
  if (!u) throw new Error("Sign in to send messages");

  const otherUid = await lookupUidByUsername(otherUsername);
  if (!otherUid) {
    throw new Error(`Can't reach @${otherUsername} — user not found.`);
  }
  if (otherUid === u.uid) {
    throw new Error("Cannot DM yourself.");
  }

  const threadId = getThreadId(myUsername, otherUsername);
  await ensureThread(threadId, u.uid, otherUid);

  const colRef = collection(db, "dm", threadId, "messages");
  await addDoc(colRef, {
    senderId: u.uid,
    sender: payload.sender,
    text: payload.text,
    createdAt: serverTimestamp(),
  });
}
