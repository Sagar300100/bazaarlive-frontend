import React, { useEffect, useRef, useState } from 'react';
import LiveSessionService, { ChatMessage, AuctionState, Product } from '../services/LiveSessionService';
import { Logo } from '../components/Header';
import UserPopup from '../components/buyer/UserPopup';
import type { ShowData } from '../services/api';
import WinnerPaymentModal from '../components/buyer/WinnerPaymentModal';
import PaymentSetupModal from '../components/buyer/PaymentSetupModal';
import ProductShowcase from '../components/sellerhub/ProductShowcase';
import type { BidState as ShowcaseBidState } from '../components/sellerhub/ProductShowcase';

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
  const [pinnedBuyNowItem, setPinnedBuyNowItem] = useState<Product | null>(null);
  const [buyNowStatus, setBuyNowStatus] = useState<string | null>(null);
  const [streamTokenInfo, setStreamTokenInfo] = useState<{ token: string; role: string } | null>(null);
  const [bidInput, setBidInput] = useState('');
  const [bidError, setBidError] = useState('');
  const [recentWinner, setRecentWinner] = useState<{ name: string; item: string; amount: number } | null>(null);

  // Payment modals
  const [winnerPayItem, setWinnerPayItem] = useState<{ name: string; amount: number; imageUrl?: string } | null>(null);
  const [showPaySetup,  setShowPaySetup]  = useState(false);

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
      pinnedBuyNowItem: Product | null;
    }) => {
      setMessages(newState.messages);
      setAuctionState(prev => {
        // detect auction just ended → show winner banner
        if (prev.item && !newState.auction.item && prev.lastBidder) {
          setRecentWinner({ name: prev.lastBidder, item: prev.item.name, amount: prev.currentBid });
          setTimeout(() => setRecentWinner(null), 5000);
        }
        return newState.auction;
      });
      setMediaStream(newState.mediaStream);
      setSoldItems(newState.soldItems);
      setPinnedBuyNowItem(newState.pinnedBuyNowItem);

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

    // When auction ends with a winner — auto-trigger payment if YOU won
    const handleAuctionEnd = (item: Product, finalPrice: number, winner: string) => {
      if (winner === 'You') {
        setWinnerPayItem({
          name:     item.name,
          amount:   finalPrice,
          imageUrl: item.imageUrl,
        });
      } else {
        // Show winner toast for others
        setRecentWinner({ name: winner, item: item.name, amount: finalPrice });
        setTimeout(() => setRecentWinner(null), 5000);
      }
    };

    LiveSessionService.subscribeAuctionEnd(handleAuctionEnd);
    return () => {
      LiveSessionService.unsubscribe(handleStateUpdate);
      LiveSessionService.unsubscribeAuctionEnd(handleAuctionEnd);
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

  // ðŸ”” Auto-trigger UPI Collect when a new purchased item appears
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
            name: 'Any & All',
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
                  if (verify.verified) alert('Payment verified âœ…');
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

  /* ── Bid helpers ── */
  const getMinNextBid = () => {
    const cur = auctionState.currentBid;
    return cur + Math.max(100, Math.floor(cur * 0.02));
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handlePlaceBid = async (quickAmount?: number) => {
    if (!auctionState.item) return;
    const min = getMinNextBid();
    let amount = quickAmount;
    if (!amount) {
      const raw = parseInt(bidInput.replace(/[^\d]/g, ''), 10);
      amount = isNaN(raw) ? min : raw;
    }
    if (amount < min) {
      setBidError(`Minimum bid is ₹${min.toLocaleString('en-IN')}`);
      setTimeout(() => setBidError(''), 3000);
      return;
    }
    setBidError('');
    setBidInput('');
    await LiveSessionService.placeBid(amount, 'You');
  };

  const handleBuyNow = async () => {
    if (!pinnedBuyNowItem) return;
    if (!pinnedBuyNowItem.backendId) {
      alert('Item is not ready for purchase yet. Please wait a moment.');
      return;
    }
    try {
      setBuyNowStatus('Placing orderâ€¦');
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
        setBuyNowStatus('Awaiting paymentâ€¦');

        const rzp = new window.Razorpay({
          key: rzpKey,
          order_id: rzOrder.id,
          amount: rzOrder.amount,
          currency: rzOrder.currency,
          name: 'Any & All',
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
          description: `Any & All escrow for ${pinnedBuyNowItem.name}`,
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
            {/* Product image */}
            {auctionState.item.imageUrl ? (
              <img src={auctionState.item.imageUrl} alt={auctionState.item.name}
                style={{ width: '100%', borderRadius: 10, objectFit: 'cover', maxHeight: 200, background: '#1f2937' }} />
            ) : (
              <div style={{ width: '100%', paddingBottom: '60%', borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, position: 'relative' }}>
                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>🛍️</span>
              </div>
            )}
            <h3 className="text-base font-bold text-white leading-tight">{auctionState.item.name}</h3>
            {auctionState.item.description && (
              <p className="text-xs text-gray-400">{auctionState.item.description}</p>
            )}
            {/* Live bid status */}
            <div style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.25)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Bid</span>
                <span style={{ fontSize: 11, color: auctionState.timer > 10 ? '#4ade80' : '#f87171', fontWeight: 700 }}>⏱ {formatTimer(auctionState.timer)}</span>
              </div>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#fbbf24', lineHeight: 1, marginBottom: 2 }}>
                ₹{auctionState.currentBid.toLocaleString('en-IN')}
              </p>
              {auctionState.lastBidder && (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                  by {auctionState.lastBidder === 'You' ? <span style={{ color: '#4ade80', fontWeight: 700 }}>you 🏆</span> : auctionState.lastBidder}
                </p>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Starting price: ₹{auctionState.item.startingPrice.toLocaleString('en-IN')}
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
        @keyframes fadeSlideDown { from { opacity:0; transform:translateX(-50%) translateY(-12px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
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
          onClick={() => setShowPaySetup(true)}
          className="btn btn-ghost px-4 py-2 rounded-lg font-semibold text-sm"
          style={{ color:'#2B6CB8', borderColor:'rgba(43,108,184,0.3)' }}
        >
          💳 Payment
        </button>
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

        {/* Center Content — Product Showcase (replaces blank video) */}
        <main className="flex-1 flex flex-col bg-black relative" style={{ minHeight: 0 }}>

          {/* ── Product Showcase ── */}
          {(() => {
            // Adapter: map LiveSessionService data → ProductShowcase props
            const item = auctionState.item;

            const showcaseProduct = item ? {
              id:          String(item.id),
              name:        item.name,
              price:       `₹${item.startingPrice.toLocaleString('en-IN')}`,
              description: item.description || '',
              keyPoints:   (item as any).keyPoints || [],
              imageUrl:    item.imageUrl,
              photos:      item.imageUrl ? [item.imageUrl] : [],
              condition:   (item as any).condition,
              color:       (item as any).color,
              material:    (item as any).material,
              size:        (item as any).size,
              defects:     (item as any).defects,
              mrp:         (item as any).mrp,
              hasInvoice:  (item as any).hasInvoice,
              aiVerified:  (item as any).aiVerified,
              aiSummary:   (item as any).aiSummary,
              brand:       (item as any).brand,
            } : null;

            const showcaseBidState: ShowcaseBidState | null = item ? {
              productName:   item.name,
              currentBid:    auctionState.currentBid,
              startPrice:    item.startingPrice,
              currentBidder: auctionState.lastBidder || '',
              timeLeft:      auctionState.timer,
              totalSeconds:  (item as any).bidDuration ?? 60,
              productImage:  item.imageUrl,
            } : null;

            const showcasePhase =
              isStreamOver                ? 'outro'   as const :
              recentWinner                ? 'sold'    as const :
              auctionState.item           ? 'bidding' as const :
              'pitch' as const;

            return (
              <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                <ProductShowcase
                  product={showcaseProduct}
                  phase={showcasePhase}
                  bidState={showcaseBidState}
                  winnerName={recentWinner?.name}
                  height={undefined}
                  style={{ height: '100%', borderRadius: 0 } as any}
                />

                {/* Stream waiting / ended overlay */}
                {(isStreamOver || !isSessionLive) && (
                  <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.72)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:20 }}>
                    <div style={{ textAlign:'center', padding:32 }}>
                      {isStreamOver ? (
                        <>
                          <div style={{ fontSize:48, marginBottom:12 }}>👋</div>
                          <h2 style={{ color:'white', fontSize:22, fontWeight:800, marginBottom:6 }}>Stream has ended</h2>
                          <p style={{ color:'rgba(255,255,255,0.6)', fontSize:14 }}>Thanks for watching! Redirecting you shortly...</p>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize:48, marginBottom:12 }}>🎬</div>
                          <h2 style={{ color:'white', fontSize:22, fontWeight:800, marginBottom:6 }}>Welcome to the show!</h2>
                          <p style={{ color:'rgba(255,255,255,0.6)', fontSize:14 }}>The stream will begin shortly. Stay tuned!</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Auction Bid Panel ── */}
          {auctionState.item && !isStreamOver && (() => {
            const { item, currentBid, lastBidder, timer } = auctionState;
            const totalSecs = 60;
            const pct = Math.min(100, (timer / totalSecs) * 100);
            const timerColor = timer > 30 ? '#22c55e' : timer > 10 ? '#f59e0b' : '#ef4444';
            const isWinning = lastBidder === 'You';
            const minNext = getMinNextBid();
            return (
              <div style={{
                position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                width: 'calc(100% - 3rem)', maxWidth: 520,
                background: 'rgba(17,24,39,0.92)', backdropFilter: 'blur(12px)',
                borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 25px 50px rgba(0,0,0,0.6)', zIndex: 10, overflow: 'hidden',
              }}>
                {/* Timer bar */}
                <div style={{ height: 4, background: 'rgba(255,255,255,0.1)' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: timerColor, transition: 'width 1s linear, background 0.5s' }} />
                </div>

                <div style={{ padding: '14px 16px 16px' }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(255,255,255,0.15)' }} />
                    ) : (
                      <div style={{ width: 56, height: 56, borderRadius: 10, background: 'rgba(255,255,255,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🛍️</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 15, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{item.name}</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                        {lastBidder ? `Leading: ${lastBidder}` : 'No bids yet — be first!'}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 22, fontWeight: 800, color: '#fbbf24', lineHeight: 1 }}>
                        ₹{currentBid.toLocaleString('en-IN')}
                      </p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: timerColor, marginTop: 2 }}>
                        ⏱ {formatTimer(timer)}
                      </p>
                    </div>
                  </div>

                  {/* Winning banner */}
                  {isWinning && (
                    <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 8, padding: '6px 12px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 16 }}>🏆</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#4ade80' }}>You're currently winning!</span>
                    </div>
                  )}

                  {/* Quick increment buttons */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    {[100, 500, 1000, 5000].map(inc => (
                      <button key={inc}
                        onClick={() => handlePlaceBid(currentBid + inc)}
                        style={{ flex: 1, padding: '6px 0', borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#d1d5db', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                      >
                        +₹{inc >= 1000 ? `${inc / 1000}k` : inc}
                      </button>
                    ))}
                  </div>

                  {/* Custom input + bid button */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="number"
                      value={bidInput}
                      onChange={e => { setBidInput(e.target.value); setBidError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handlePlaceBid()}
                      placeholder={`Min ₹${minNext.toLocaleString('en-IN')}`}
                      style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: `1px solid ${bidError ? '#ef4444' : 'rgba(255,255,255,0.15)'}`, borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none' }}
                    />
                    <button
                      onClick={() => handlePlaceBid()}
                      style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none', whiteSpace: 'nowrap' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'linear-gradient(135deg,#3b82f6,#2563eb)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'linear-gradient(135deg,#2563eb,#1d4ed8)')}
                    >
                      🔨 Bid
                    </button>
                  </div>
                  {bidError && <p style={{ color: '#f87171', fontSize: 12, marginTop: 5 }}>{bidError}</p>}
                </div>
              </div>
            );
          })()}
          {/* ── Recent winner toast ── */}
          {recentWinner && (
            <div style={{
              position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg,rgba(250,204,21,0.95),rgba(245,158,11,0.95))',
              borderRadius: 12, padding: '12px 20px', zIndex: 20,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 10,
              animation: 'fadeSlideDown 0.4s ease',
            }}>
              <span style={{ fontSize: 24 }}>🏆</span>
              <div>
                <p style={{ fontWeight: 800, color: '#1c1917', fontSize: 14 }}>{recentWinner.name} won!</p>
                <p style={{ color: '#44403c', fontSize: 12 }}>{recentWinner.item} for ₹{recentWinner.amount.toLocaleString('en-IN')}</p>
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

      {/* ── Winner Payment Modal — auto-shown when YOU win an auction ── */}
      {winnerPayItem && (
        <WinnerPaymentModal
          item={winnerPayItem}
          buyerName="You"
          onSuccess={(paymentId) => {
            console.log('Payment confirmed:', paymentId);
            setPurchasedItems(prev => [...prev, {
              id: Date.now(), name: winnerPayItem.name,
              startingPrice: winnerPayItem.amount, winner: 'You',
              description: '', keyPoints: [], imageUrl: winnerPayItem.imageUrl ?? '',
            }]);
            setWinnerPayItem(null);
          }}
          onFailed={() => {
            // Notify LiveSessionService so seller can re-auction
            console.log('Payment failed — item should be re-auctioned');
            setWinnerPayItem(null);
          }}
          onClose={() => setWinnerPayItem(null)}
        />
      )}

      {/* ── Payment Setup Modal — UPI Mandate / Save Card ── */}
      {showPaySetup && (
        <PaymentSetupModal
          buyerName="Buyer"
          buyerEmail=""
          buyerPhone=""
          onClose={() => setShowPaySetup(false)}
        />
      )}
    </div>
  );
};

export default BuyerLiveRoomPage;


