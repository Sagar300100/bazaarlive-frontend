import React, { useEffect, useRef, useState } from "react";
import { getAuth } from "firebase/auth";
import { subscribeDm, sendDm, getThreadId } from "../services/dmFirestore";

interface MessagesPageProps {
  activeChatUser: string | null;
  onNavigate: (page: string) => void;
}

type Conversation = {
  id: string;
  user: string;
  avatar: string;
  online: boolean;
  messages: { id: number; sender: string; text: string }[];
};

const STORAGE_KEY = "bl_conversations";
const LAST_SELECTED_KEY = "bl_conversations_selected";

const seedConversations: Record<string, Conversation> = {
  labelvaults: {
    id: "labelvaults",
    user: "labelvaults",
    avatar: "LV",
    online: true,
    messages: [
      { id: 1, sender: "labelvaults", text: "Hey, is that vintage jacket still available?" },
      { id: 2, sender: "you", text: "Hey! Yes, it is. It's in great condition." },
    ],
  },
  fleshy_swordfight: {
    id: "fleshy_swordfight",
    user: "fleshy_swordfight",
    avatar: "FS",
    online: false,
    messages: [{ id: 1, sender: "fleshy_swordfight", text: "Thanks for the raid last night! It was awesome." }],
  },
  bazaarlivesupport: {
    id: "bazaarlivesupport",
    user: "BazaarLiveSupport",
    avatar: "BL",
    online: true,
    messages: [
      {
        id: 1,
        sender: "BazaarLiveSupport",
        text: "Your payout has been processed. It should reflect in your account within 3-5 business days.",
      },
    ],
  },
  ravik: { id: "ravik", user: "RaviK", avatar: "RK", online: true, messages: [] },
  priyas: { id: "priyas", user: "PriyaS", avatar: "PS", online: false, messages: [] },
  amitg: { id: "amitg", user: "AmitG", avatar: "AG", online: true, messages: [] },
  snehap: { id: "snehap", user: "SnehaP", avatar: "SP", online: false, messages: [] },
  superbuyer: { id: "superbuyer", user: "SuperBuyer", avatar: "SB", online: true, messages: [] },
};

const MessagesPage: React.FC<MessagesPageProps> = ({ activeChatUser }) => {
  const [conversations, setConversations] = useState<Record<string, Conversation>>(seedConversations);
  const [selectedUser, setSelectedUser] = useState<string>(activeChatUser?.toLowerCase() || "labelvaults");
  const [messageInput, setMessageInput] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const unsubRef = useRef<null | (() => void)>(null);

  // derive storage keys per user
  const storageKey = currentUserId ? `${STORAGE_KEY}_${currentUserId}` : STORAGE_KEY;
  const selectedKey = currentUserId ? `${LAST_SELECTED_KEY}_${currentUserId}` : LAST_SELECTED_KEY;

  // Get auth user (once on mount)
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      setError("Please sign in to use messaging.");
      return;
    }
    const uid = user.uid || user.email || "you";
    setCurrentUserId(uid);
  }, []);

  // Load from storage (per user)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const rawSelected = localStorage.getItem(selectedKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, Conversation>;
        const nextSelected =
          activeChatUser?.toLowerCase() ||
          (rawSelected && parsed[rawSelected] ? rawSelected : Object.keys(parsed)[0] || "labelvaults");
        setConversations(parsed);
        setSelectedUser(nextSelected);
        return;
      }
      const nextSelected =
        activeChatUser?.toLowerCase() || Object.keys(seedConversations)[0] || "labelvaults";
      setSelectedUser(nextSelected);
      setConversations(seedConversations);
    } catch {
      setConversations(seedConversations);
    }
  }, [activeChatUser, storageKey, selectedKey]);

  // Persist conversations
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(conversations));
    } catch {
      /* ignore */
    }
  }, [conversations, storageKey]);

  // Persist selected user
  useEffect(() => {
    if (selectedUser) {
      try {
        localStorage.setItem(selectedKey, selectedUser);
      } catch {
        /* ignore */
      }
    }
  }, [selectedUser, selectedKey]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedUser, conversations[selectedUser]?.messages]);

  // Subscribe to Firestore DM
  useEffect(() => {
    if (!currentUserId) return;
    const target = selectedUser?.toLowerCase();
    if (!target) return;

    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    try {
      const unsub = subscribeDm(currentUserId, target, (docs) => {
        setConversations((prev) => {
          const base =
            prev[target] ||
            seedConversations[target] || {
              id: target,
              user: target,
              avatar: target.slice(0, 2).toUpperCase(),
              online: false,
              messages: [],
            };
          const mergedMessages =
            docs && docs.length > 0
              ? docs.map((d, idx) => ({ id: idx + 1, sender: d.sender, text: d.text }))
              : base.messages;
          return {
            ...prev,
            [target]: {
              ...base,
              messages: mergedMessages,
            },
          };
        });
      });
      unsubRef.current = unsub;
    } catch (e: any) {
      console.warn("DM subscribe failed", e?.message || e);
    }
    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [selectedUser, currentUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedUser || !currentUserId) {
      setError("Please sign in to send a message.");
      return;
    }
    const key = selectedUser.toLowerCase();
    const convo = conversations[key] || {
      id: key,
      user: key,
      avatar: key.slice(0, 2).toUpperCase(),
      online: false,
      messages: [],
    };
    const newMessage = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      sender: currentUserId,
      text: messageInput.trim(),
    };
    setConversations((prev) => ({
      ...prev,
      [key]: { ...convo, messages: [...(convo.messages || []), newMessage] },
    }));
    setMessageInput("");

    // Send to Firestore (best effort)
    try {
      await sendDm(currentUserId, key, { sender: currentUserId, text: newMessage.text });
    } catch (err) {
      console.warn("sendDm failed", err);
    }
  };

  const activeConversation = conversations[selectedUser];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-128px)]">
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] h-full bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {/* Sidebar */}
        <aside className="border-r border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h2 className="font-bold text-white">Inbox</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {Object.values(conversations).map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedUser(conv.id)}
                className={`w-full flex items-start gap-3 p-3 text-left transition-colors ${
                  selectedUser === conv.id ? "bg-gray-700/50" : "hover:bg-gray-700/30"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center font-bold">
                    {conv.avatar}
                  </div>
                  {conv.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>}
                </div>
                <div className="overflow-hidden">
                  <p className="font-semibold text-sm text-white truncate">{conv.user}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {conv.messages.length > 0 ? conv.messages[conv.messages.length - 1].text : "No messages yet"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Chat */}
        <main className="flex flex-col">
          {activeConversation ? (
            <>
              <div className="p-4 border-b border-gray-700 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center font-bold flex-shrink-0">
                  {activeConversation.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-white">{activeConversation.user}</h3>
                  <p className="text-xs text-gray-400">{activeConversation.online ? "Online" : "Offline"}</p>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {activeConversation.messages.map((msg) => (
                  <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === currentUserId ? "justify-end" : ""}`}>
                    {msg.sender !== currentUserId && <div className="w-6 h-6 rounded-full bg-gray-600 flex-shrink-0" />}
                    <div
                      className={`max-w-xs md:max-w-md p-3 rounded-2xl ${
                        msg.sender === currentUserId ? "bg-orange-600 rounded-br-none" : "bg-gray-700 rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 border-t border-gray-700">
                <form onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={`Message ${activeConversation.user}`}
                    className="w-full bg-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <p>{error || "Select a conversation to start chatting."}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MessagesPage;
