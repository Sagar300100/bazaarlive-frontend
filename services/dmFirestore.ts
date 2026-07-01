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

// Deterministic thread ID for two users. Uses lowercased usernames so
// legacy threads keep working; new threads also embed the participant
// UIDs on the parent doc so firestore.rules can gate reads/writes.
export function getThreadId(userA: string, userB: string) {
  const [a, b] = [userA.toLowerCase(), userB.toLowerCase()].sort();
  return `${a}__${b}`;
}

/**
 * Ensure the dm/{threadId} parent doc exists and carries the current
 * signed-in user's uid in its `participants` array. Called before every
 * send so a first-time thread gets bootstrapped correctly.
 *
 * If the parent already exists but doesn't list this uid, we add it —
 * lets the OTHER side of the conversation ping into an existing thread
 * that was created before rules landed.
 */
async function ensureThread(threadId: string, myUid: string, otherLabel: string) {
  const ref = doc(db, "dm", threadId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      participants: [myUid],           // updates as the other side joins
      participantLabels: [otherLabel], // for display; not used by rules
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return;
  }
  const data = snap.data() as any;
  const participants: string[] = Array.isArray(data.participants) ? data.participants : [];
  if (!participants.includes(myUid)) {
    await setDoc(
      ref,
      {
        participants: [...participants, myUid],
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
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
  const u = auth.currentUser;
  if (!u) throw new Error("Sign in to send messages");

  const threadId = getThreadId(userA, userB);
  await ensureThread(threadId, u.uid, userA === payload.sender ? userB : userA);

  const colRef = collection(db, "dm", threadId, "messages");
  await addDoc(colRef, {
    senderId: u.uid,
    sender: payload.sender,
    text: payload.text,
    createdAt: serverTimestamp(),
  });
}
