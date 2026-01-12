import {
  createProduct,
  createAuction,
  placeBid,
} from "./api";
import { listenProducts, listenAuctions } from "./realtime";

export interface ChatMessage {
  id: number;
  user: string;
  avatar: string;
  text: string;
  isBid?: boolean;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  category: string;
  startingPrice: number;
  bidIncrement: number;
  quantity: number;
  imageUrl?: string;
  type: "auction" | "buy-it-now" | "giveaway";
  winner?: string;
  backendId?: string; // Firestore/DB id for API calls
}

export interface AuctionState {
  item: Product | null;
  currentBid: number;
  timer: number;
  lastBidder: string | null;
  auctionId?: string | null;
  endsAt?: string | null;
  version?: number;
}

type Subscriber = (state: {
  messages: ChatMessage[];
  auction: AuctionState;
  isLive: boolean;
  mediaStream: MediaStream | null;
  products: Product[];
  soldItems: Product[];
  pinnedBuyNowItem: Product | null;
}) => void;

type AuctionEndSubscriber = (
  item: any,
  finalPrice: number,
  winner: string
) => void;

class LiveSessionService {
  private static instance: LiveSessionService;

  private messages: ChatMessage[] = [];
  private auctionState: AuctionState = {
    item: null,
    currentBid: 0,
    timer: 0,
    lastBidder: null,
    auctionId: null,
    endsAt: null,
    version: 0,
  };
  private products: Product[] = [];
  private soldItems: Product[] = [];
  private pinnedBuyNowItem: Product | null = null;
  private isLive = false;
  private mediaStream: MediaStream | null = null;

  private subscribers: Subscriber[] = [];
  private auctionEndSubscribers: AuctionEndSubscriber[] = [];
  private messageInterval: any = null;
  private auctionInterval: any = null;
  private nextMessageId = 0;

  private useFakeChat = true;
  private showIdForBackend: string | null = null;
  private unsubProducts: (() => void) | null = null;
  private unsubAuctions: (() => void) | null = null;

  private fakeUsers = [
    { name: "RaviK", avatar: "RK" },
    { name: "PriyaS", avatar: "PS" },
    { name: "AmitG", avatar: "AG" },
    { name: "SnehaP", avatar: "SP" },
    { name: "SuperBuyer", avatar: "SB" },
  ];

  private fakeMessages = [
    "Wow, this is amazing!",
    "I need this!",
    "What's the condition?",
    "Can you show the back?",
    "Love this item!",
    "Great price!",
  ];

  // Chat sink: forward messages to Firestore if attached
  private chatSink: ((m: Omit<ChatMessage, "id">) => void) | null = null;
  public setChatSink(sink: ((m: Omit<ChatMessage, "id">) => void) | null) {
    this.chatSink = sink;
  }

  private constructor() {}

  public static getInstance(): LiveSessionService {
    if (!LiveSessionService.instance) {
      LiveSessionService.instance = new LiveSessionService();
    }
    return LiveSessionService.instance;
  }

  public setBackendShow(showId: string | number | null) {
    this.showIdForBackend = showId ? String(showId) : null;
    this.attachRealtime(showId ? String(showId) : null);
  }

  private notify() {
    this.subscribers.forEach((callback) =>
      callback({
        messages: this.messages,
        auction: this.auctionState,
        isLive: this.isLive,
        mediaStream: this.mediaStream,
        products: this.products,
        soldItems: this.soldItems,
        pinnedBuyNowItem: this.pinnedBuyNowItem,
      })
    );
  }

  private notifyAuctionEnd(item: any, finalPrice: number, winner: string) {
    const soldItem: Product = {
      ...item,
      startingPrice: finalPrice,
      winner,
    };
    this.soldItems.push(soldItem);
    this.auctionEndSubscribers.forEach((callback) =>
      callback(item, finalPrice, winner)
    );
    this.notify();
  }

  public isSessionLive = () => this.isLive;
  public getMediaStream = () => this.mediaStream;

  public subscribe(callback: Subscriber) {
    this.subscribers.push(callback);
    callback({
      messages: this.messages,
      auction: this.auctionState,
      isLive: this.isLive,
      mediaStream: this.mediaStream,
      products: this.products,
      soldItems: this.soldItems,
      pinnedBuyNowItem: this.pinnedBuyNowItem,
    });
  }

  public subscribeAuctionEnd(callback: AuctionEndSubscriber) {
    this.auctionEndSubscribers.push(callback);
  }
  public unsubscribe(callback: Subscriber) {
    this.subscribers = this.subscribers.filter((cb) => cb !== callback);
  }
  public unsubscribeAuctionEnd(callback: AuctionEndSubscriber) {
    this.auctionEndSubscribers = this.auctionEndSubscribers.filter(
      (cb) => cb !== callback
    );
  }

  public setMediaStream(stream: MediaStream | null) {
    this.mediaStream = stream;
    this.notify();
  }

  public startSession() {
    if (this.isLive) return;
    this.isLive = true;

    this.addMessage({
      text: "The show is about to begin! Get ready to bid.",
      user: "System",
      avatar: "B",
    });

    // Only fake chat if no Firestore sink is attached
    if (this.useFakeChat && !this.chatSink) {
      this.messageInterval = setInterval(() => {
        const user =
          this.fakeUsers[Math.floor(Math.random() * this.fakeUsers.length)];
        const text =
          this.fakeMessages[Math.floor(Math.random() * this.fakeMessages.length)];
        this.addMessage({ user: user.name, avatar: user.avatar, text });
      }, 5000);
    }

    this.notify();
  }

  public stopSession() {
    if (!this.isLive) return;
    this.isLive = false;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    clearInterval(this.messageInterval);
    clearInterval(this.auctionInterval);
    this.messageInterval = null;
    this.auctionInterval = null;

    this.addMessage({
      text: "The stream has ended. Thanks for watching!",
      user: "System",
      avatar: "B",
    });

    if (this.auctionState.item) {
      this.auctionState.item = null;
    }

    // Reset state for the next show
    this.products = [];
    this.soldItems = [];
    this.pinnedBuyNowItem = null;

    this.notify();
  }

  private addMessage(message: Omit<ChatMessage, "id">) {
    const newMessage = { ...message, id: this.nextMessageId++ };
    this.messages = [...this.messages, newMessage];
    if (this.messages.length > 100) this.messages.shift();

    // forward to Firestore (sink) if present
    if (this.chatSink) {
      try {
        this.chatSink(message);
      } catch {}
    }

    this.notify();
  }

  private attachRealtime(showId: string | null) {
    // Cleanup existing listeners
    if (this.unsubProducts) this.unsubProducts();
    if (this.unsubAuctions) this.unsubAuctions();
    this.unsubProducts = null;
    this.unsubAuctions = null;

    if (!showId) return;

    this.unsubProducts = listenProducts(showId, (docs) => {
      const mapped: Product[] = docs.map((p, idx) => ({
        id: idx + 1,
        name: p.title || "Untitled",
        description: "",
        category: "General",
        startingPrice: (p.price || 0) / 100,
        bidIncrement: 100,
        quantity: p.stock ?? 0,
        imageUrl: p.thumbnail_url,
        type: "buy-it-now",
        backendId: p.id,
      }));
      this.products = mapped;
      this.notify();
    });

    this.unsubAuctions = listenAuctions(showId, (docs) => {
      const open = docs.find((a) => a.status === "open") || null;
      if (!open) {
        this.auctionState = {
          item: null,
          currentBid: 0,
          timer: 0,
          lastBidder: null,
          auctionId: null,
          endsAt: null,
          version: 0,
        };
        this.notify();
        return;
      }
      const product =
        this.products.find((p) => p.backendId === open.productId) ||
        ({
          id: 0,
          name: "Auction Item",
          description: "",
          category: "General",
          startingPrice: open.startPrice,
          bidIncrement: open.bidStep || 100,
          quantity: 1,
          type: "auction",
          backendId: open.productId,
        } as Product);
      const now = Date.now();
      const endsAtMs = open.endsAt ? new Date(open.endsAt).getTime() : now;
      const timer = Math.max(0, Math.round((endsAtMs - now) / 1000));

      this.auctionState = {
        item: product,
        currentBid: open.currentBid || open.startPrice,
        timer,
        lastBidder: open.currentBidderName || null,
        auctionId: open.id,
        endsAt: open.endsAt || null,
        version: open.version || 0,
      };
      this.notify();
    });
  }

  public sendMessage(message: Omit<ChatMessage, "id">) {
    this.addMessage(message);
  }

  // Ensure a product exists in backend and return backend id
  private async ensureProductBackend(item: Product): Promise<string | null> {
    if (item.backendId) return item.backendId;
    try {
      const created = await createProduct({
        title: item.name,
        price: Math.round(item.startingPrice * 100),
        stock: item.quantity,
        thumbnail_url: item.imageUrl,
        showId: this.showIdForBackend,
      });
      // Update local record with backend id
      this.products = this.products.map((p) =>
        p.id === item.id ? { ...p, backendId: created.id } : p
      );
      if (this.pinnedBuyNowItem?.id === item.id) {
        this.pinnedBuyNowItem = { ...this.pinnedBuyNowItem, backendId: created.id };
      }
      if (this.auctionState.item?.id === item.id) {
        this.auctionState = { ...this.auctionState, item: { ...item, backendId: created.id } };
      }
      this.notify();
      return created.id;
    } catch (err) {
      console.error("ensureProductBackend failed", err);
      return null;
    }
  }

  public addProduct(product: Product) {
    this.products.push(product);
    this.notify();
    // Fire-and-forget creation in backend if available
    this.ensureProductBackend(product);
  }

  public async startAuction(item: Product) {
    if (this.auctionState.item || this.pinnedBuyNowItem) return;

    const backendId = await this.ensureProductBackend(item);
    let auctionId: string | null = null;
    try {
      if (backendId) {
        const created = await createAuction({
          productId: backendId,
          startPrice: Math.round(item.startingPrice),
          bidStep: Math.round(item.bidIncrement || 100),
          showId: this.showIdForBackend,
        });
        auctionId = created.id;
      }
    } catch (err) {
      console.error("createAuction failed", err);
    }

    this.products = this.products.filter((p) => p.id !== item.id);

    this.auctionState = {
      item,
      currentBid: item.startingPrice,
      timer: 15,
      lastBidder: null,
      auctionId,
      endsAt: null,
      version: 0,
    };
    this.addMessage({
      text: `Auction started for ${item.name}! Starting bid: Rs ${item.startingPrice}`,
      user: "System",
      avatar: "B",
    });

    this.auctionInterval = setInterval(() => {
      if (!this.isLive) {
        clearInterval(this.auctionInterval);
        return;
      }
      this.auctionState.timer--;
      if (this.auctionState.timer <= 0) {
        clearInterval(this.auctionInterval);
        this.auctionInterval = null;
        if (this.auctionState.lastBidder) {
          this.addMessage({
            text: `${item.name} sold to ${this.auctionState.lastBidder} for Rs ${this.auctionState.currentBid}!`,
            user: "System",
            avatar: "B",
          });
          this.notifyAuctionEnd(
            item,
            this.auctionState.currentBid,
            this.auctionState.lastBidder
          );
        } else {
          this.addMessage({
            text: `Auction for ${item.name} ended with no bids.`,
            user: "System",
            avatar: "B",
          });
          this.products.push(item); // back to list if unsold
        }
        this.auctionState.item = null;
        this.notify();
      } else {
        this.notify();
      }
    }, 1000);
  }

  public async placeBid(amount: number, user: string) {
    if (!this.auctionState.item || amount <= this.auctionState.currentBid || !this.isLive)
      return;

    // Try backend bid first
    if (this.auctionState.auctionId) {
      try {
        const resp = await placeBid(this.auctionState.auctionId, amount);
        if (resp?.bid) {
          this.auctionState.currentBid = resp.bid.amount || amount;
          this.auctionState.lastBidder = user;
          this.auctionState.endsAt = resp.bid.endsAt || null;
          this.auctionState.version = resp.bid.version || this.auctionState.version;
          this.auctionState.timer = 15;
        }
      } catch (err) {
        console.error("placeBid backend failed", err);
        // fall back to local optimistic update below
      }
    } else {
      this.auctionState.currentBid = amount;
      this.auctionState.lastBidder = user;
      this.auctionState.timer = 15;
    }

    const userObj =
      this.fakeUsers.find((u) => u.name === user) || {
        name: user,
        avatar: user.substring(0, 2).toUpperCase(),
      };
    this.addMessage({
      user: userObj.name,
      avatar: userObj.avatar,
      text: `bid Rs ${amount}!`,
      isBid: true,
    });

    this.notify();
  }

  public pinBuyNowItem(item: Product) {
    if (this.auctionState.item || this.pinnedBuyNowItem) return;
    this.pinnedBuyNowItem = item;
    this.products = this.products.filter((p) => p.id !== item.id);
    this.notify();
    this.ensureProductBackend(item);
  }

  public unpinBuyNowItem() {
    if (!this.pinnedBuyNowItem) return;
    this.products.push(this.pinnedBuyNowItem);
    this.pinnedBuyNowItem = null;
    this.notify();
  }

  public markBuyNowAsSold() {
    if (!this.pinnedBuyNowItem) return;
    this.soldItems.push(this.pinnedBuyNowItem);
    this.pinnedBuyNowItem = null;
    this.notify();
  }
}

export default LiveSessionService.getInstance();
