import React, { useState, useEffect, useRef } from 'react';
import {
  CalendarIcon, MoreIcon, SoundIcon, NotesIcon, ShareIcon, CloseIcon,
  PromoteIcon, SellerToolsIcon, BugIcon, EditIcon, PollIcon, RaidIcon,
  ChevronRightIcon, LightningIcon, QualityListingIcon, BreakIcon, EndShowIcon
} from '../components/Icons';
import LiveSessionService, { ChatMessage, AuctionState, Product } from '../services/LiveSessionService';
import { Logo } from '../components/Header';
import type { ShowData } from '../services/api';
import { fetchStreamToken, startLocalPreview, joinHmsRoom } from '../services/streaming';

// 🔗 Firestore chat (relative path - file lives in /services)
import { sendMessage as fsSend } from '../services/chatFirestore';

const MoreMenu: React.FC<{
  onClose: () => void;
  onEditShow: () => void;
  onPromote: () => void;
  onAddPoll: () => void;
  onStartRaid: () => void;
}> = ({ onClose, onEditShow, onPromote, onAddPoll, onStartRaid }) => {
  const [showSellerTools, setShowSellerTools] = useState(false);

  return (
    <div className="absolute top-0 right-full mr-4 w-60 bg-gray-800 rounded-lg shadow-lg border border-gray-700 text-white z-30">
      <div className="p-2">
        <div className="flex justify-between items-center mb-2 px-2">
          <h3 className="font-bold text-sm">{showSellerTools ? 'Seller Tools' : 'More'}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><CloseIcon className="w-5 h-5" /></button>
        </div>
        {!showSellerTools ? (
          <>
            <button onClick={onEditShow} className="w-full flex items-center text-left p-2 rounded hover:bg-gray-700 text-sm"><EditIcon /> <span className="ml-3">Edit Show</span></button>
            <button onClick={onPromote} className="w-full flex items-center text-left p-2 rounded hover:bg-gray-700 text-sm"><PromoteIcon /> Promote</button>
            <button onClick={() => setShowSellerTools(true)} className="w-full flex items-center justify-between text-left p-2 rounded hover:bg-gray-700 text-sm">
              <div className="flex items-center"><SellerToolsIcon /> Seller Tools</div>
              <ChevronRightIcon />
            </button>
            <button className="w-full flex items-center text-left p-2 rounded hover:bg-gray-700 text-sm"><BugIcon /> Report a Bug</button>
          </>
        ) : (
          <>
            <button onClick={() => setShowSellerTools(false)} className="w-full flex items-center text-left p-2 rounded hover:bg-gray-700 text-sm text-gray-400 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Back
            </button>
            <button onClick={onAddPoll} className="w-full flex items-center text-left p-2 rounded hover:bg-gray-700 text-sm"><PollIcon /> Add Poll</button>
            <button onClick={onStartRaid} className="w-full flex items-center text-left p-2 rounded hover:bg-gray-700 text-sm"><RaidIcon /> Start Raid</button>
          </>
        )}
      </div>
    </div>
  );
};

const NotesPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="absolute top-0 right-full mr-4 w-72 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-30">
    <div className="p-3">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">Notes</h3>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><CloseIcon className="w-5 h-5" /></button>
      </div>
      <textarea
        placeholder="Type your private notes here..."
        className="w-full h-64 bg-gray-900 rounded-md p-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
      ></textarea>
    </div>
  </div>
);

const ShareModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
      <h2 className="text-xl font-bold text-white mb-4">Share Show</h2>
      <p className="text-gray-400 mb-4 text-sm">Share your stream link to bring in viewers!</p>
      <div className="flex">
        <input type="text" readOnly value="https://bazaarlive.example.com/live/sagsin" className="w-full bg-gray-700 rounded-l-md px-3 text-sm" />
        <button onClick={() => navigator.clipboard.writeText('https://bazaarlive.example.com/live/sagsin')} className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-4 py-2 rounded-r-md">Copy</button>
      </div>
      <button onClick={onClose} className="mt-6 w-full py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-bold">Done</button>
    </div>
  </div>
);

const PromoteModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
      <h2 className="text-xl font-bold text-white mb-4">Promote Your Show</h2>
      <p className="text-gray-400 mb-4 text-sm">Boost your visibility and reach more buyers by promoting your show. You can set a budget and track performance in the Seller Hub.</p>
      <div className="bg-gray-900 p-4 rounded-lg text-sm">
        <p className="font-semibold text-white">Promotion gives you:</p>
        <ul className="list-disc list-inside text-gray-400 mt-2">
          <li>Priority placement on the homepage</li>
          <li>Higher ranking in search results</li>
          <li>Targeted notifications to interested buyers</li>
        </ul>
      </div>
      <button onClick={onClose} className="mt-6 w-full py-2 bg-orange-600 hover:bg-orange-500 rounded-lg font-bold">Manage Promotions</button>
    </div>
  </div>
);

const PollModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
      <h2 className="text-xl font-bold text-white mb-4">Create a Poll</h2>
      <form className="space-y-4">
        <div>
          <label htmlFor="poll-question" className="block text-sm font-medium text-gray-300 mb-1">Question</label>
          <input type="text" id="poll-question" placeholder="What should I auction next?" className="w-full input-field" />
        </div>
        <div>
          <label htmlFor="poll-opt1" className="block text-sm font-medium text-gray-300 mb-1">Option 1</label>
          <input type="text" id="poll-opt1" className="w-full input-field" />
        </div>
        <div>
          <label htmlFor="poll-opt2" className="block text-sm font-medium text-gray-300 mb-1">Option 2</label>
          <input type="text" id="poll-opt2" className="w-full input-field" />
        </div>
      </form>
      <div className="mt-6 flex gap-4">
        <button onClick={onClose} className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-bold">Cancel</button>
        <button onClick={onClose} className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg font-bold">Start Poll</button>
      </div>
      <style>{`.input-field { background-color: #374151; border: 1px solid #4B5563; border-radius: 0.5rem; color: white; padding: 0.75rem 1rem; } .input-field:focus { outline: none; box-shadow: 0 0 0 2px #F97316; }`}</style>
    </div>
  </div>
);

const RaidModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
      <h2 className="text-xl font-bold text-white mb-4">Start a Raid</h2>
      <p className="text-gray-400 mb-4 text-sm">Send your viewers to another live show when yours ends.</p>
      <div className="relative">
        <input type="text" placeholder="Search for a channel" className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
      </div>
      <div className="mt-4 h-40 bg-gray-900 rounded-lg flex items-center justify-center text-gray-500 text-sm">
        Search results will appear here.
      </div>
      <button onClick={onClose} className="mt-6 w-full py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-bold">Cancel</button>
    </div>
  </div>
);

const initialProductFormState = {
  name: '',
  category: 'Fashion',
  description: '',
  startingPrice: '10',
  bidIncrement: '1',
  quantity: '1',
};

interface LiveRoomPageProps {
  show: ShowData | null;
  onExit: () => void;
  onEditShow: (show: ShowData) => void;
  onEndShow: (show: ShowData, soldItems: Product[]) => void;
  onGoLive: (showId: string) => void;
  onNavigate: (page: string) => void;
}

const LiveRoomPage: React.FC<LiveRoomPageProps> = ({ show, onExit, onEditShow, onEndShow, onGoLive, onNavigate }) => {
  const [leftTab, setLeftTab] = useState('auction');
  const [chatTab, setChatTab] = useState('all');

  const [leftPanelState, setLeftPanelState] = useState<'list' | 'add_options' | 'add_form'>('list');
  const [addFormType, setAddFormType] = useState<'auction' | 'buy-it-now' | 'giveaway'>('auction');
  const [productForm, setProductForm] = useState(initialProductFormState);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  // All state via service
  const [isSessionLive, setIsSessionLive] = useState(LiveSessionService.isSessionLive());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [auctionState, setAuctionState] = useState<AuctionState>({ item: null, currentBid: 0, timer: 0, lastBidder: null });
  const [products, setProducts] = useState<Product[]>([]);
  const [soldItems, setSoldItems] = useState<Product[]>([]);
  const [pinnedBuyNowItem, setPinnedBuyNowItem] = useState<Product | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const [chatInput, setChatInput] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [isRaidModalOpen, setIsRaidModalOpen] = useState(false);
  const [streamTokenInfo, setStreamTokenInfo] = useState<{ token: string; role: string } | null>(null);

  useEffect(() => {
    const handleStateUpdate = (newState: any) => {
      setMessages(newState.messages);
      setAuctionState(newState.auction);
      setIsSessionLive(newState.isLive);
      setMediaStream(newState.mediaStream);
      setProducts(newState.products);
      setSoldItems(newState.soldItems);
      setPinnedBuyNowItem(newState.pinnedBuyNowItem);
    };

    LiveSessionService.subscribe(handleStateUpdate);

    return () => {
      LiveSessionService.unsubscribe(handleStateUpdate);
    };
  }, []);

  useEffect(() => {
    LiveSessionService.setBackendShow(show ? show.id : null);
  }, [show]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Sync <video> with service stream
    if (videoRef.current) {
      if (mediaStream && videoRef.current.srcObject !== mediaStream) {
        videoRef.current.srcObject = mediaStream;
      } else if (!mediaStream && videoRef.current.srcObject) {
        (videoRef.current as any).srcObject = null;
      }
    }
  }, [mediaStream]);

  const handleStartStream = async () => {
    if (!show || LiveSessionService.isSessionLive()) return;
    try {
      // Fetch streaming token (for 100ms SDK) and start local preview
      try {
        const token = await fetchStreamToken(String(show.id), 'host', show.title || 'Host');
        setStreamTokenInfo({ token: token.token, role: token.role });
        // Best-effort HMS join; falls back to local preview if SDK missing
        joinHmsRoom(token.token, show.title || 'Host').catch(() =>
          console.warn('HMS join skipped (SDK not available)')
        );
      } catch (err) {
        console.warn('Stream token fetch failed (using local preview only):', err);
      }

      const stream = await startLocalPreview();
      LiveSessionService.setMediaStream(stream);
      LiveSessionService.startSession();
      onGoLive(show.id);
    } catch (err) {
      console.error("Error accessing media devices.", err);
      alert("Could not access camera/mic. Please check permissions.");
    }
  };

  const handleEndShowClick = () => {
    if (window.confirm('Are you sure you want to end the show?')) {
      LiveSessionService.stopSession();
      if (show) onEndShow(show, soldItems);
    }
  };

  if (!show) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <p>Loading show...</p>
      </div>
    );
  }

  const handleProductFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setProductForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: Date.now(),
      name: productForm.name,
      description: productForm.description,
      category: productForm.category,
      startingPrice: parseFloat(productForm.startingPrice),
      bidIncrement: parseFloat(productForm.bidIncrement),
      quantity: parseInt(productForm.quantity),
      type: addFormType
    };
    LiveSessionService.addProduct(newProduct);
    setProductForm(initialProductFormState);
    setLeftPanelState('list');
  };

  const handleStartAuction = (product: Product) => {
    if (auctionState.item || pinnedBuyNowItem) return;
    LiveSessionService.startAuction(product);
    setSelectedProductId(null);
  };

  const handlePinBuyNow = (product: Product) => {
    if (auctionState.item || pinnedBuyNowItem) return;
    LiveSessionService.pinBuyNowItem(product);
    setSelectedProductId(null);
  };

  const handleEndBuyNow = () => {
    LiveSessionService.markBuyNowAsSold();
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !show) return;

    // Local ephemeral feed
    LiveSessionService.sendMessage({
      user: 'sagsin',
      avatar: 'SA',
      text: chatInput,
    });

    // Persist to Firestore
    try {
      await fsSend(String(show.id), {
        user: 'sagsin',
        text: chatInput,
        avatar: 'SA',
      });
    } catch (err) {
      console.error('fsSend failed:', err);
    }

    setChatInput('');
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const controlButtonClass = "bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm rounded-full p-3 transition-colors";
  const isAuctioning = !!auctionState.item;
  const auctionItem = auctionState.item;
  const currentBid = auctionState.currentBid;
  const auctionTime = auctionState.timer;

  const renderLeftPanelContent = () => {
    switch (leftPanelState) {
      case 'add_options':
        return (
          <div className="p-4 flex flex-col h-full">
            <h2 className="text-xl font-bold mb-4">What would you like to add?</h2>
            <div className="space-y-3">
              <button onClick={() => { setAddFormType('auction'); setLeftPanelState('add_form'); }} className="w-full text-left p-4 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center gap-4 transition-colors">
                <LightningIcon />
                <div>
                  <h3 className="font-bold">Create Temporary Listing</h3>
                  <p className="text-sm text-gray-400">Quickly add items for a single live show.</p>
                </div>
              </button>
              <button className="w-full text-left p-4 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center gap-4 transition-colors">
                <QualityListingIcon />
                <div>
                  <h3 className="font-bold">Create Quality Listing</h3>
                  <p className="text-sm text-gray-400">Detailed listings that remain active after the show.</p>
                </div>
              </button>
              <button className="w-full text-left p-4 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center gap-4 transition-colors">
                <BreakIcon />
                <div>
                  <h3 className="font-bold">Create a Break <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full ml-2">BETA</span></h3>
                  <p className="text-sm text-gray-400">Sell spots for a chance to win items.</p>
                </div>
              </button>
            </div>
            <button onClick={() => setLeftPanelState('list')} className="mt-auto w-full bg-gray-700 hover:bg-gray-600 font-bold py-2 rounded-lg">Cancel</button>
          </div>
        );
      case 'add_form':
        return (
          <form onSubmit={handleAddProduct} className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-bold">Add a listing</h2>
              <button type="button" onClick={() => setLeftPanelState('add_options')}><CloseIcon /></button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              <div className="flex bg-gray-800 p-1 rounded-lg">
                <button type="button" onClick={() => setAddFormType('auction')} className={`flex-1 py-1.5 text-sm font-semibold rounded-md ${addFormType === 'auction' ? 'bg-gray-600' : ''}`}>AUCTION</button>
                <button type="button" onClick={() => setAddFormType('buy-it-now')} className={`flex-1 py-1.5 text-sm font-semibold rounded-md ${addFormType === 'buy-it-now' ? 'bg-gray-600' : ''}`}>BUY IT NOW</button>
                <button type="button" onClick={() => setAddFormType('giveaway')} className={`flex-1 py-1.5 text-sm font-semibold rounded-md ${addFormType === 'giveaway' ? 'bg-gray-600' : ''}`}>GIVEAWAY</button>
              </div>

              <div>
                <label htmlFor="product-name" className="text-xs font-bold text-gray-400">NAME</label>
                <input id="product-name" name="name" value={productForm.name} onChange={handleProductFormChange} type="text" placeholder="Product name" className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-orange-500" required />
              </div>
              <div>
                <label htmlFor="product-desc" className="text-xs font-bold text-gray-400">DESCRIPTION</label>
                <textarea id="product-desc" name="description" value={productForm.description} onChange={handleProductFormChange} placeholder="More about the product (optional)" rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-orange-500"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="product-price" className="text-xs font-bold text-gray-400">{addFormType === 'auction' ? 'STARTING PRICE' : 'PRICE'}</label>
                  <input id="product-price" name="startingPrice" value={productForm.startingPrice} onChange={handleProductFormChange} type="number" className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                {addFormType === 'auction' && (
                  <div>
                    <label htmlFor="product-increment" className="text-xs font-bold text-gray-400">BID INCREMENT</label>
                    <input id="product-increment" name="bidIncrement" value={productForm.bidIncrement} onChange={handleProductFormChange} type="number" className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="product-quantity" className="text-xs font-bold text-gray-400">QUANTITY</label>
                <input id="product-quantity" name="quantity" value={productForm.quantity} onChange={handleProductFormChange} type="number" className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                <p className="mt-1 text-sm text-gray-400">Add photos (optional)</p>
              </div>
            </div>
            <div className="p-4 mt-auto border-t border-gray-700 flex gap-3">
              <button type="button" onClick={() => setLeftPanelState('list')} className="flex-1 bg-gray-700 hover:bg-gray-600 font-bold py-2 rounded-lg">Cancel</button>
              <button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-500 font-bold py-2 rounded-lg">Confirm</button>
            </div>
          </form>
        );
      case 'list':
      default: {
        const auctionProducts = products.filter(p => p.type === 'auction');
        const buyNowProducts = products.filter(p => p.type === 'buy-it-now');
        let currentList: Product[] = [];

        if (leftTab === 'auction') currentList = auctionProducts;
        else if (leftTab === 'buy-now') currentList = buyNowProducts;
        else if (leftTab === 'sold') currentList = soldItems;

        return (
          <div className="p-4 flex flex-col h-full">
            <div className="flex border-b border-gray-700 mb-4 text-sm font-semibold">
              <button onClick={() => setLeftTab('auction')} className={`py-2 px-3 ${leftTab === 'auction' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>Auction</button>
              <button onClick={() => setLeftTab('buy-now')} className={`py-2 px-3 ${leftTab === 'buy-now' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>Buy Now</button>
              <button onClick={() => setLeftTab('sold')} className={`py-2 px-3 ${leftTab === 'sold' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>Sold</button>
              <button onClick={() => setLeftTab('tips')} className={`py-2 px-3 ${leftTab === 'tips' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>Tips</button>
              <button onClick={() => setLeftTab('giveaways')} className={`py-2 px-3 ${leftTab === 'giveaways' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>Giveaways</button>
            </div>
            <div className="relative mb-4">
              <input type="text" placeholder="Search products..." className="w-full bg-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
            </div>
            <div className="flex-1 bg-gray-800/50 rounded-lg overflow-y-auto">
              {currentList.length > 0 ? (
                <div className="p-2 space-y-2">
                  {currentList.map(p => (
                    <div key={p.id} onClick={() => leftTab !== 'sold' && setSelectedProductId(p.id)} className={`p-2 rounded-md ${leftTab !== 'sold' ? 'bg-gray-800 hover:bg-gray-700 cursor-pointer' : 'bg-gray-800'}`}>
                      <p className="font-bold text-sm truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">{leftTab === 'sold' ? `Sold for: ₹${p.startingPrice}` : `Price: ₹${p.startingPrice}`}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-center">
                  <p className="text-gray-500 text-sm">No items in this list.</p>
                </div>
              )}
            </div>
            <button onClick={() => setLeftPanelState('add_options')} className="mt-4 w-full bg-orange-600 hover:bg-orange-500 font-bold py-2 rounded-lg">Add Product</button>
          </div>
        );
      }
    }
  };

  return (
    <div className="live-room min-h-screen text-white font-sans flex flex-col">
      <style>{`
        .overflow-y-auto::-webkit-scrollbar { width: 8px; }
        .overflow-y-auto::-webkit-scrollbar-track { background: transparent; }
        .overflow-y-auto::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.24); border-radius: 20px; }
        .animate-pulse-fast { animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>

      <header className="sticky top-0 z-30 px-8 py-4 flex items-center justify-between border-b border-[var(--border)] bg-[#050507dd] backdrop-blur-lg">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('home')} aria-label="Go to homepage" className="pill-btn">
            <Logo />
          </button>
          <div className="w-px h-6 bg-white/20"></div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gray-300">Live room</p>
            <h1 className="text-xl font-bold">{show.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge bg-white/10 border-[var(--border)]">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse-fast" /> Ultra-low latency
          </span>
          {isSessionLive ? (
            <button onClick={handleEndShowClick} className="btn btn-primary px-5 py-2 text-sm">
              <EndShowIcon />
              End Show
            </button>
          ) : (
            <button onClick={handleStartStream} className="btn btn-primary px-5 py-2 text-sm">Start Stream</button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 px-6 pb-6 pt-4 flex gap-4">
        <aside className="w-80 glass-card p-4 flex flex-col gap-3 border border-[var(--border)] rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-300">Products & pins</p>
              <h3 className="text-lg font-semibold">Control</h3>
            </div>
            <button onClick={() => setLeftPanelState('add_options')} className="pill-btn text-sm">+ Add</button>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden rounded-xl bg-white/3">
            {renderLeftPanelContent()}
          </div>
        </aside>

        <main className="flex-1 relative rounded-3xl overflow-hidden glass border border-[var(--border)] backdrop-blur-xl flex items-center justify-center">
          <div className="video-frame w-full h-full relative bg-black">
            {mediaStream ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain bg-black" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-3 bg-[linear-gradient(135deg,rgba(255,95,109,0.06),rgba(127,92,255,0.08))]">
                <div className="pill">Waiting for stream</div>
                <p className="text-xl font-semibold">Preview will appear here once you start streaming.</p>
                <button onClick={handleStartStream} className="btn btn-primary px-5 py-2 text-sm">Start Stream</button>
              </div>
            )}
            <div className="video-overlay" />
          </div>

          {selectedProduct && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-8 z-30" onClick={() => setSelectedProductId(null)}>
              <div className="glass-card p-6 w-full max-w-sm text-center space-y-3" onClick={e => e.stopPropagation()}>
                <div className="w-24 h-24 bg-white/10 rounded-md mx-auto mb-4"></div>
                <h3 className="text-xl font-bold">{selectedProduct.name}</h3>
                {selectedProduct.type === 'auction' ?
                  (<button onClick={() => handleStartAuction(selectedProduct)} className="btn btn-primary w-full">Start Auction</button>) :
                  (<button onClick={() => handlePinBuyNow(selectedProduct)} className="btn btn-primary w-full">Pin for Purchase</button>)
                }
                <button className="w-full pill-btn justify-center">Edit Item</button>
                <button className="w-full pill-btn justify-center">Pin Item</button>
                <button className="w-full pill-btn justify-center text-red-400">Delete Item</button>
                <button onClick={() => setSelectedProductId(null)} className="w-full text-sm text-gray-300 pt-2 hover:text-white">Cancel</button>
              </div>
            </div>
          )}

          {isAuctioning && auctionItem && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[min(720px,calc(100%-3rem))] glass-card p-4 border border-[var(--border)]/60">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white/10 rounded-xl flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-300">Live auction</p>
                  <h3 className="font-bold text-lg">{auctionItem.name}</h3>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-2xl font-bold text-[var(--accent)] leading-none">?{currentBid}</p>
                  <p className="font-bold text-sm text-[var(--accent-2)] leading-none">00:{auctionTime.toString().padStart(2, '0')}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button className="pill-btn justify-center">Custom</button>
                <button
                  className="col-span-2 btn btn-primary"
                  onClick={() => LiveSessionService.placeBid(currentBid + auctionItem.bidIncrement, 'You')}
                >
                  Bid: ?{currentBid + auctionItem.bidIncrement}
                </button>
              </div>
            </div>
          )}

          {pinnedBuyNowItem && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[min(720px,calc(100%-3rem))] glass-card p-4 border border-[var(--border)]/60">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white/10 rounded-xl flex-shrink-0"></div>
                <div className="flex-1"><p className="text-sm text-gray-300">Pinned item</p><h3 className="font-bold text-lg">{pinnedBuyNowItem.name}</h3></div>
                <div className="text-right"><p className="text-2xl font-bold text-[var(--accent)]">?{pinnedBuyNowItem.startingPrice}</p><p className="text-sm text-gray-300">Qty: {pinnedBuyNowItem.quantity}</p></div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={handleEndBuyNow} className="btn btn-primary">Mark as Sold</button><button onClick={() => LiveSessionService.unpinBuyNowItem()} className="pill-btn justify-center">Unpin</button></div>
            </div>
          )}

          {isSessionLive && !isAuctioning && !pinnedBuyNowItem && !selectedProduct && (
            <div className="absolute bottom-6 flex items-center gap-3 glass-card px-4 py-2 border border-[var(--border)]">
              <div className="w-8 h-8 rounded-full bg-white/10 text-xs flex items-center justify-center">SA</div>
              <div className="badge bg-white/12">
                <span className="w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse-fast" />
                LIVE
              </div>
            </div>
          )}

          <div className="absolute bottom-24 right-4 flex flex-col gap-3">
            <button className={controlButtonClass} aria-label="Sound"><SoundIcon /></button>
            <div className="relative"><button onClick={() => setIsMoreMenuOpen(v => !v)} className={controlButtonClass} aria-label="More options"><MoreIcon /></button>{isMoreMenuOpen && <MoreMenu onClose={() => setIsMoreMenuOpen(false)} onEditShow={() => onEditShow(show)} onPromote={() => { setIsPromoteModalOpen(true); setIsMoreMenuOpen(false); }} onAddPoll={() => { setIsPollModalOpen(true); setIsMoreMenuOpen(false); }} onStartRaid={() => { setIsRaidModalOpen(true); setIsMoreMenuOpen(false); }} />}</div>
            <div className="relative"><button onClick={() => setIsNotesPanelOpen(v => !v)} className={controlButtonClass} aria-label="Notes"><NotesIcon /></button>{isNotesPanelOpen && <NotesPanel onClose={() => setIsNotesPanelOpen(false)} />}</div>
            <button onClick={() => setIsShareModalOpen(true)} className={controlButtonClass} aria-label="Share"><ShareIcon /></button>
          </div>
        </main>

        <aside className="w-96 glass-card border border-[var(--border)] rounded-2xl flex flex-col">
          <div className="p-4 border-b border-[var(--border)]/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-300">Upcoming</p>
                <h3 className="font-semibold">Thu {show.time}</h3>
              </div>
              <div className="badge">
                <span className="w-2 h-2 bg-[var(--accent)] rounded-full" />
                {isSessionLive ? 'Live' : 'Ready'}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-center">
              <div className="glass-card p-3 border border-[var(--border)]/70">
                <p className="text-xs text-gray-300">Gross Sales</p>
                <p className="text-2xl font-bold">?10.00</p>
              </div>
              <div className="glass-card p-3 border border-[var(--border)]/70">
                <p className="text-xs text-gray-300">Est. Orders</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
            <div className="mt-4 flex gap-3"><button className="btn btn-primary flex-1">Share Show</button><button className="pill-btn"><CalendarIcon /></button><button className="pill-btn"><MoreIcon /></button></div>
          </div>
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex gap-2 text-sm font-semibold p-3 border-b border-[var(--border)]/60">
              {['all','questions','buyers','mods','muted'].map(key => (
                <button
                  key={key}
                  onClick={() => setChatTab(key as any)}
                  className={`px-3 py-1 rounded-full ${chatTab === key ? 'btn btn-primary text-white' : 'pill-btn'}`}
                >
                  {key[0].toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
            <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="text-xs flex items-start gap-2 glass-card p-2 border border-[var(--border)]/60">
                  <span className="w-7 h-7 rounded-full bg-white/10 text-xs flex-shrink-0 items-center justify-center font-bold inline-flex">{msg.avatar}</span>
                  <div>
                    <span className="font-bold">{msg.user}</span>
                    {msg.isBid ? (
                      <span className="ml-1 font-bold text-[var(--accent)]">{msg.text}</span>
                    ) : msg.user === 'System' ? (
                      <span className="ml-1 text-gray-300 italic">{msg.text}</span>
                    ) : (
                      <span className="ml-1 text-gray-200">{msg.text}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-[var(--border)]/60">
              <form onSubmit={handleSendChat}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Say something..."
                  className="w-full glass-card px-4 py-3 rounded-2xl border border-[var(--border)] focus:outline-none"
                />
              </form>
            </div>
          </div>
        </aside>
      </div>
      {isShareModalOpen && <ShareModal onClose={() => setIsShareModalOpen(false)} />}
      {isPromoteModalOpen && <PromoteModal onClose={() => setIsPromoteModalOpen(false)} />}
      {isPollModalOpen && <PollModal onClose={() => setIsPollModalOpen(false)} />}
      {isRaidModalOpen && <RaidModal onClose={() => setIsRaidModalOpen(false)} />}
    </div>
  );
};

export default LiveRoomPage;

