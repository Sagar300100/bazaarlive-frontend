import React, { useEffect, useRef, useState } from 'react';
import LiveSessionService, { ChatMessage, AuctionState, Product } from '../services/LiveSessionService';
import { Logo } from '../components/Header';
import UserPopup from '../components/buyer/UserPopup';
import type { ShowData } from '../services/api';

// Firestore chat
import { subscribeMessages as fsSub, sendMessage as fsSend } from '../services/chatFirestore';

// Razorpay + API helpers (note: no getOrderStatus import anymore)
import {
  getRazorpayKey,
  startUpiCollect,
  verifyPaymentSignature,
  reserveProduct,
  createRazorpayOrder,
  confirmOrder,
  setupUpiAutopay,
} from '../services/api';
import { fetchStreamToken } from '../services/streaming';

declare global {
  interface Window {
    Razorpay: any;
  }
}

async function loadRazorpay() {
  if (window.Razorpay) return;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = resolve as any;
    s.onerror = reject as any;
    document.body.appendChild(s);
  });
}

interface BuyerLiveRoomPageProps {
  show: ShowData | null;
  onExit: () => void;
  onNavigate: (page: string, data?: { username?: string }) => void;
}

const EmptyPanelState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex-1 flex items-center justify-center text-center text-gray-500 p-4">
    <p>{message}</p>
  </div>
);

const BuyerLiveRoomPage: React.FC<BuyerLiveRoomPageProps> = ({ show, onExit, onNavigate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [auctionState, setAuctionState] = useState<AuctionState>({
    item: null,
    currentBid: 0,
    timer: 0,
    lastBidder: null,
    auctionId: null,
    endsAt: null,
    version: 0,
  });
  const [chatInput, setChatInput] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isSessionLive, setIsSessionLive] = useState(LiveSessionService.isSessionLive());
  const [isStreamOver, setIsStreamOver] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(LiveSessionService.getMediaStream());
  const [rightPanelTab, setRightPanelTab] = useState<'chat' | 'watching'>('chat');
  const [leftPanelTab, setLeftPanelTab] = useState<'auction' | 'buy-now' | 'purchased' | 'sold'>('auction');
  const [showUserPopup, setShowUserPopup] = useState<ChatMessage | null>(null);
  const [chatFilter, setChatFilter] = useState<'all' | 'system' | 'mods' | 'buyers'>('all');

  const [soldItems, setSoldItems] = useState<Product[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<Product[]>([]);
  const [buyNowStatus, setBuyNowStatus] = useState<string | null>(null);
  const [streamTokenInfo, setStreamTokenInfo] = useState<{ token: string; role: string } | null>(null);

  // prevent duplicate payment prompts per item
  const requestedPaymentIdsRef = useRef<Set<string | number>>(new Set());

  // Subscribe to in-memory session state
  useEffect(() => {
    const handleStateUpdate = (newState: {
      messages: ChatMessage[];
      auction: AuctionState;
      isLive: boolean;
      mediaStream: MediaStream | null;
      soldItems: Product[];
    }) => {
      setMessages(newState.messages);
      setAuctionState(newState.auction);
      setMediaStream(newState.mediaStream);
      setSoldItems(newState.soldItems);

      const mine = newState.soldItems.filter((it) => it.winner === 'You');
      setPurchasedItems(mine);

      setIsSessionLive((currentIsLive) => {
        if (currentIsLive && !newState.isLive) {
          setIsStreamOver(true);
          setTimeout(() => onExit(), 4000);
        }
        return newState.isLive;
      });
    };

    LiveSessionService.subscribe(handleStateUpdate);
    return () => {
      LiveSessionService.unsubscribe(handleStateUpdate);
    };
  }, [onExit]);

  useEffect(() => {
    LiveSessionService.setBackendShow(show ? show.id : null);
  }, [show]);

  // Fetch viewer token (for 100ms SDK) - placeholder for future SDK wiring
  useEffect(() => {
    if (!show) return;
    (async () => {
      try {
        const token = await fetchStreamToken(String(show.id), 'viewer', show.title || 'Viewer');
        setStreamTokenInfo({ token: token.token, role: token.role });
      } catch (err) {
        console.warn('Stream token fetch failed (viewer):', err);
      }
    })();
  }, [show]);

  // Subscribe to Firestore chat (persisted messages)
  useEffect(() => {
    if (!show) return;
    const unsub = fsSub(String(show.id), (docs) => {
      const mapped: ChatMessage[] = docs.map((d, i) => ({
        id: i,
        user: d.user,
        avatar: d.avatar ?? d.user.slice(0, 2).toUpperCase(),
        text: d.text,
        isBid: d.isBid,
      }));
      setMessages(mapped);
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [show]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, chatFilter]);

  useEffect(() => {
    if (videoRef.current && mediaStream && videoRef.current.srcObject !== mediaStream) {
      videoRef.current.srcObject = mediaStream;
    } else if (videoRef.current && !mediaStream) {
      (videoRef.current as any).srcObject = null;
    }
  }, [mediaStream]);

  useEffect(() => {
    if (!show) {
      const t = setTimeout(() => onExit(), 2000);
      return () => clearTimeout(t);
    }
  }, [show, onExit]);

  // 🔔 Auto-trigger UPI Collect when a new purchased item appears
  useEffect(() => {
    const triggerFor = async (item: Product) => {
      const key = (item.id as any) ?? `${item.name}:${item.startingPrice}`;
      if (requestedPaymentIdsRef.current.has(key)) return;
      requestedPaymentIdsRef.current.add(key);

      const amountRupees = Number(item.startingPrice || auctionState.currentBid || 0);
      if (!amountRupees || amountRupees <= 0) return;

      try {
        await loadRazorpay();

        const [{ key: rzpKey }, upiStart] = await Promise.all([
          getRazorpayKey(),
          startUpiCollect(amountRupees),
        ]);

        const order: any = (upiStart as any).order || {};
        const vpa: string | undefined = (upiStart as any).vpa;
        const orderId: string =
          order?.id || (upiStart as any).orderId || (upiStart as any).requestId || '';

        if (rzpKey && orderId && vpa) {
          const rzp = new window.Razorpay({
            key: rzpKey,
            order_id: orderId,
            amount: order?.amount,
            currency: order?.currency || 'INR',
            name: 'BazaarLive',
            description: `Payment for ${item.name}`,
            method: 'upi',
            upi: { flow: 'collect', vpa },
            handler: async (response: any) => {
              if (response?.razorpay_signature) {
                try {
                  const verify = await verifyPaymentSignature({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                  });
                  if (verify.verified) alert('Payment verified ✅');
                } catch (e) {
                  console.error('Verify error:', e);
                }
              }
            },
            modal: { ondismiss: () => console.log('UPI collect checkout closed') },
            theme: { color: '#f97316' },
          });
          rzp.open();
        } else {
          alert('UPI collect request sent. Please approve it in your UPI app.');
        }
      } catch (e) {
        console.error('UPI collect init failed', e);
        alert('Could not start UPI payment. Please check your saved UPI ID in Settings.');
      }
    };

    purchasedItems.forEach(triggerFor);
  }, [purchasedItems, auctionState.currentBid]);

  if (!show) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <p>Show not found. Returning to home...</p>
      </div>
    );
  }

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !show) return;

    // Local feed
    LiveSessionService.sendMessage({
      user: 'You',
      avatar: 'ME',
      text: chatInput,
    });

    // Firestore persist
    try {
      await fsSend(String(show.id), {
        user: 'You',
        text: chatInput,
        avatar: 'ME',
      });
    } catch (err) {
      console.error('fsSend failed:', err);
    }

    setChatInput('');
  };

  const handlePlaceBid = async () => {
    if (auctionState.item) {
      const nextBid = auctionState.currentBid + auctionState.item.bidIncrement;
      await LiveSessionService.placeBid(nextBid, 'You');
    }
  };

  const handleBuyNow = async () => {
    if (!pinnedBuyNowItem) return;
    if (!pinnedBuyNowItem.backendId) {
      alert('Item is not ready for purchase yet. Please wait a moment.');
      return;
    }
    try {
      setBuyNowStatus('Placing order…');
      const order = await reserveProduct({
        productId: pinnedBuyNowItem.backendId,
        qty: 1,
        buyerName: 'You',
        paymentMethod: 'upi',
      });
      // Create Razorpay order using item price (assume startingPrice in INR)
      const amountPaise = Math.round(pinnedBuyNowItem.startingPrice * 100);
      try {
        const rzOrder = await createRazorpayOrder({
          amount: amountPaise,
          currency: 'INR',
          notes: { productId: pinnedBuyNowItem.backendId, orderId: order.id },
        });

        await loadRazorpay();
        const rzpKey = (await getRazorpayKey()).key;
        setBuyNowStatus('Awaiting payment…');

        const rzp = new window.Razorpay({
          key: rzpKey,
          order_id: rzOrder.id,
          amount: rzOrder.amount,
          currency: rzOrder.currency,
          name: 'BazaarLive',
          description: `Payment for ${pinnedBuyNowItem.name}`,
          handler: async (response: any) => {
            try {
              const verify = await verifyPaymentSignature({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              if (verify.verified) {
                await confirmOrder(order.id);
                setBuyNowStatus('Payment verified. Order confirmed!');
                setPurchasedItems((prev) => [
                  ...prev,
                  { ...pinnedBuyNowItem, startingPrice: pinnedBuyNowItem.startingPrice, winner: 'You' },
                ]);
              } else {
                setBuyNowStatus('Payment verification failed.');
              }
            } catch (err) {
              console.error('Payment verify/confirm failed', err);
              setBuyNowStatus('Payment verification failed.');
            }
          },
          modal: { ondismiss: () => setBuyNowStatus('Payment cancelled') },
          theme: { color: '#f97316' },
        });
        rzp.open();
      } catch (e) {
        // Razorpay not available? Fallback to UPI Autopay setup
        const auto = await setupUpiAutopay({
          amount: amountPaise,
          description: `BazaarLive escrow for ${pinnedBuyNowItem.name}`,
        });
        if (auto?.ok) {
          setBuyNowStatus('Autopay mandate initiated. Approve in your UPI app.');
        } else {
          setBuyNowStatus('Payment initiation failed.');
        }
      }
    } catch (err: any) {
      console.error('Buy Now failed', err);
      setBuyNowStatus(err?.message || 'Failed to reserve item');
    } finally {
      setTimeout(() => setBuyNowStatus(null), 4000);
    }
  };

  const renderLeftPanelContent = () => {
    switch (leftPanelTab) {
      case 'auction':
        return auctionState.item ? (
          <div className="space-y-3 p-4">
            <h3 className="text-lg font-bold text-white">{auctionState.item.name}</h3>
            <div className="w-full aspect-square bg-gray-800 rounded-lg"></div>
            <p className="text-sm text-gray-400">
              {auctionState.item.description || 'No description available.'}
            </p>
            <div className="text-sm">
              <span className="text-gray-400">Starting price: </span>
              <span className="font-semibold text-white">Rs {auctionState.item.startingPrice}</span>
            </div>
          </div>
        ) : (
          <EmptyPanelState message="No item is currently being auctioned." />
        );

      case 'buy-now':
        return pinnedBuyNowItem ? (
          <div className="space-y-3 p-4">
            <h3 className="text-lg font-bold text-white">{pinnedBuyNowItem.name}</h3>
            <div className="w-full aspect-square bg-gray-800 rounded-lg"></div>
            <p className="text-sm text-gray-400">
              {pinnedBuyNowItem.description || 'Available to purchase instantly.'}
            </p>
            <div className="text-sm">
              <span className="text-gray-400">Price: </span>
              <span className="font-semibold text-white">Rs {pinnedBuyNowItem.startingPrice}</span>
            </div>
            <button
              onClick={handleBuyNow}
              className="w-full bg-orange-600 hover:bg-orange-500 rounded-lg py-3 font-bold"
              disabled={!!buyNowStatus}
            >
              {buyNowStatus || 'Buy Now'}
            </button>
          </div>
        ) : (
          <EmptyPanelState message="No Buy Now item is pinned." />
        );

      case 'sold':
        return soldItems.length > 0 ? (
          <div className="p-2 space-y-2 overflow-y-auto">
            {soldItems.map((item) => (
              <div key={item.id} className="p-2 rounded-md bg-gray-800">
                <p className="font-bold text-sm truncate">{item.name}</p>
                <p className="text-xs text-gray-400">
                  Sold for: Rs {item.startingPrice} to {item.winner}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyPanelState message="No items have been sold yet." />
        );

      case 'purchased':
        return purchasedItems.length > 0 ? (
          <div className="p-2 space-y-2 overflow-y-auto">
            {purchasedItems.map((item) => (
              <div
                key={item.id}
                className="p-2 rounded-md bg-gray-800 border border-orange-500/50"
              >
                <p className="font-bold text-sm truncate text-orange-300">{item.name}</p>
                <p className="text-xs text-gray-400">Purchased for: Rs {item.startingPrice}</p>
                <p className="text-xs text-gray-500 mt-1">
                  A UPI approval request has been sent to your UPI app (if your UPI ID is saved).
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyPanelState message="You haven't purchased any items yet." />
        );

      default:
        return <EmptyPanelState message="This section is coming soon." />;
    }
  };

  const mods = ['PriyaS']; // Mock data for moderators

  const filteredMessages = messages.filter((msg) => {
    if (chatFilter === 'all') return true;
    if (chatFilter === 'system') return msg.user === 'System';
    if (chatFilter === 'mods') return mods.includes(msg.user);
    if (chatFilter === 'buyers') {
      return msg.user !== 'System' && !mods.includes(msg.user) && msg.user !== show.seller;
    }
    return true;
  });

  return (
    <div className="live-room flex h-screen text-white font-sans flex-col relative">
      <style>{`
        .overflow-y-auto::-webkit-scrollbar { width: 8px; }
        .overflow-y-auto::-webkit-scrollbar-track { background: transparent; }
        .overflow-y-auto::-webkit-scrollbar-thumb { background-color: #4b5563; border-radius: 20px; border: 3px solid #1f2937; }
        .animate-pulse-fast { animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .text-shadow { text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
        .text-shadow-lg { text-shadow: 0 4px 10px rgba(0,0,0,0.7); }
      `}</style>

      {/* Header */}
      <header className="h-16 glass border-b border-[#ffffff14] z-20 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('home')} aria-label="Go to homepage">
            <Logo />
          </button>
          <div className="w-px h-6 bg-gray-700"></div>
          <div>
            <h1 className="text-lg font-bold">{show.name}</h1>
            <p className="text-sm text-gray-400">{show.seller}</p>
          </div>
          {isSessionLive && !isStreamOver && (
            <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full text-sm font-bold">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse-fast"></span>
              LIVE
            </div>
          )}
        </div>
        <button
          onClick={onExit}
          className="btn btn-ghost px-4 py-2 rounded-lg font-semibold text-sm"
        >
          Exit
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Left Sidebar */}
        <aside className="w-80 glass border-r border-[#ffffff14] flex flex-col p-4">
          <h2 className="text-sm font-bold uppercase text-gray-400 mb-2">Steals and Deals</h2>
          <div className="flex border-b border-gray-700 mb-4 text-sm font-semibold">
            <button
              onClick={() => setLeftPanelTab('auction')}
              className={`py-2 px-3 ${leftPanelTab === 'auction' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}
            >
              Auction
            </button>
            <button
              onClick={() => setLeftPanelTab('buy-now')}
              className={`py-2 px-3 ${leftPanelTab === 'buy-now' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}
            >
              Buy Now
            </button>
            <button
              onClick={() => setLeftPanelTab('purchased')}
              className={`py-2 px-3 ${leftPanelTab === 'purchased' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}
            >
              Purchased
            </button>
            <button
              onClick={() => setLeftPanelTab('sold')}
              className={`py-2 px-3 ${leftPanelTab === 'sold' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}
            >
              Sold
            </button>
          </div>
          {renderLeftPanelContent()}
        </aside>

        {/* Center Content */}
        <main className="flex-1 flex flex-col items-center justify-center bg-black relative">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover bg-gray-900" />

          {/* Overlay for status messages */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="text-center text-shadow-lg">
              {isStreamOver ? (
                <div className="bg-black/60 p-6 rounded-xl backdrop-blur-sm">
                  <h2 className="text-2xl font-bold">The stream has ended.</h2>
                  <p className="text-gray-300 mt-2">Thanks for watching! Redirecting you shortly...</p>
                </div>
              ) : !mediaStream ? (
                <div className="bg-black/60 p-6 rounded-xl backdrop-blur-sm">
                  <h2 className="text-2xl font-bold">Welcome to the show!</h2>
                  <p className="text-gray-300 mt-2">The stream will begin shortly.</p>
                </div>
              ) : null}
            </div>
          </div>

          {auctionState.item && !isStreamOver && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-4rem)] max-w-lg p-4 bg-gray-800/80 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-2xl text-center z-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-700 rounded-md flex-shrink-0"></div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-lg truncate">{auctionState.item.name}</h3>
                  <p className="text-sm text-gray-400">Current Bid</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-yellow-400">₹{auctionState.currentBid}</p>
                  <p className="font-bold text-lg text-red-500">
                    00:{auctionState.timer.toString().padStart(2, '0')}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <button
                  onClick={handlePlaceBid}
                  className="w-full bg-blue-600 hover:bg-blue-500 rounded-lg py-3 font-bold text-lg"
                >
                  Bid ₹{auctionState.currentBid + (auctionState.item?.bidIncrement ?? 0)}
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar */}
        <aside className="w-96 bg-gray-900 border-l border-gray-800 flex flex-col">
          <div className="flex border-b border-gray-700 text-sm font-semibold p-2 shrink-0">
            <button
              onClick={() => setRightPanelTab('chat')}
              className={`py-1 px-4 rounded-md ${rightPanelTab === 'chat' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}
            >
              Chat
            </button>
            <button
              onClick={() => setRightPanelTab('watching')}
              className={`py-1 px-4 rounded-md ${rightPanelTab === 'watching' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}
            >
              Watching
            </button>
          </div>

          {rightPanelTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-3 border-b border-gray-800 flex items-center gap-2 shrink-0 bg-gray-900">
                <span className="text-xs font-bold text-gray-500 uppercase">Filters:</span>
                <div className="flex items-center gap-1 bg-gray-800 p-1 rounded-md">
                  <button
                    onClick={() => setChatFilter('all')}
                    className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${chatFilter === 'all' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setChatFilter('buyers')}
                    className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${chatFilter === 'buyers' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                  >
                    Buyers
                  </button>
                  <button
                    onClick={() => setChatFilter('mods')}
                    className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${chatFilter === 'mods' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                  >
                    Mods
                  </button>
                  <button
                    onClick={() => setChatFilter('system')}
                    className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${chatFilter === 'system' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                  >
                    System
                  </button>
                </div>
              </div>
              <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3">
                {filteredMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`text-xs flex items-start ${msg.user === 'You' ? 'text-orange-300' : ''}`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full ${msg.user === 'You' ? 'bg-orange-500' : 'bg-gray-700'
                        } text-xs flex-shrink-0 items-center justify-center font-bold mr-2 inline-flex`}
                    >
                      {msg.avatar}
                    </span>
                    <div>
                      <button
                        onClick={() => setShowUserPopup(msg)}
                        className="font-bold cursor-pointer hover:underline"
                      >
                        {msg.user}
                      </button>
                      {msg.isBid ? (
                        <span className="ml-1 font-bold text-yellow-400">{msg.text}</span>
                      ) : msg.user === 'System' ? (
                        <span className="ml-1 text-gray-400 italic">{msg.text}</span>
                      ) : (
                        <span className="ml-1 text-gray-300">{msg.text}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-800 shrink-0">
                <form onSubmit={handleSendChat}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Send a message..."
                    className="w-full bg-gray-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={isStreamOver}
                  />
                </form>
              </div>
            </div>
          )}

          {rightPanelTab === 'watching' && (
            <div className="flex-1 flex items-center justify-center text-center text-gray-500 p-4">
              <p>A list of viewers will appear here.</p>
            </div>
          )}
        </aside>

        {/* User Popup */}
        {showUserPopup && (
          <UserPopup user={showUserPopup} onClose={() => setShowUserPopup(null)} onNavigate={onNavigate} />
        )}
      </div>
    </div>
  );
};

export default BuyerLiveRoomPage;


