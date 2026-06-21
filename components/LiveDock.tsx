import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio, Eye, ChevronUp, ChevronDown, X, Zap,
  TrendingUp, Maximize2,
} from "lucide-react";

/* ══════════════════════════════════════════════
   LiveDock — persistent floating widget that shows
   live auction activity across the entire platform.
   Lives at bottom-right on every page (except
   actual Live Room pages, to avoid conflict).
   ══════════════════════════════════════════════ */

interface LiveStream {
  id: string;
  seller: string;
  initials: string;
  product: string;
  category: string;
  thumb: string;
  bid: number;
  viewers: number;
  accent: string;
}

const SEED: LiveStream[] = [
  {
    id: "s1", seller: "Sneaker Vault", initials: "SV",
    product: "Travis Scott × Jordan 1", category: "Sneakers",
    thumb: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80&auto=format&fit=crop",
    bid: 24999, viewers: 4128, accent: "#F43F5E",
  },
  {
    id: "s2", seller: "Luxe Time Co", initials: "LT",
    product: "Rolex Datejust 41", category: "Watches",
    thumb: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80&auto=format&fit=crop",
    bid: 850000, viewers: 1893, accent: "#F59E0B",
  },
  {
    id: "s3", seller: "Heritage Sarees", initials: "HS",
    product: "Vintage Banarasi Lot", category: "Fashion",
    thumb: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200&q=80&auto=format&fit=crop",
    bid: 12500, viewers: 2347, accent: "#8B5CF6",
  },
  {
    id: "s4", seller: "Apple Resale Hub", initials: "AR",
    product: "MacBook Pro M3 14\"", category: "Electronics",
    thumb: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200&q=80&auto=format&fit=crop",
    bid: 115000, viewers: 905, accent: "#06B6D4",
  },
];

const BIDDERS = ["Riya M", "Arjun K", "Priya S", "Vikram D", "Kavya R", "Rohan T", "Ananya G", "Karthik N"];

const formatINR = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L` : `₹${n.toLocaleString("en-IN")}`;

/* ── floating bid-event toast (per stream) ── */
interface BidEvent {
  id: number;
  streamId: string;
  amount: number;
  bidder: string;
}

const LiveDock: React.FC = () => {
  const [hidden,   setHidden]   = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [focused,  setFocused]  = useState<string | null>(null);  // expanded PiP for one stream
  const [streams,  setStreams]  = useState<LiveStream[]>(SEED);
  const [events,   setEvents]   = useState<BidEvent[]>([]);
  const [pulseId,  setPulseId]  = useState<string | null>(null);

  /* ── hide on live room pages (avoid double player) ── */
  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname;
      const onLiveRoom = /live|stream|room/i.test(path) && !/preview/.test(path);
      setHidden(onLiveRoom);
    };
    checkRoute();
    window.addEventListener("popstate", checkRoute);
    return () => window.removeEventListener("popstate", checkRoute);
  }, []);

  /* ── show only after first 2s so it doesn't fight with hero entry ── */
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 1800);
    return () => clearTimeout(t);
  }, []);

  /* ── simulated bid activity ── */
  useEffect(() => {
    if (hidden) return;
    let tickId = 0;
    const schedule = () => {
      const wait = 3200 + Math.random() * 4400;
      return setTimeout(() => {
        const target = SEED[Math.floor(Math.random() * SEED.length)];
        const inc    = target.bid > 100000 ? 1000 + Math.floor(Math.random() * 9) * 500 : 100 + Math.floor(Math.random() * 9) * 100;
        const bidder = BIDDERS[Math.floor(Math.random() * BIDDERS.length)];

        setStreams(prev => prev.map(s =>
          s.id === target.id ? { ...s, bid: s.bid + inc, viewers: s.viewers + Math.floor(Math.random() * 5) - 1 } : s
        ));
        setPulseId(target.id);
        setTimeout(() => setPulseId(null), 900);

        const evtId = ++tickId;
        setEvents(prev => [...prev, { id: evtId, streamId: target.id, amount: inc, bidder }]);
        setTimeout(() => setEvents(prev => prev.filter(e => e.id !== evtId)), 2400);

        timeoutRef.current = schedule();
      }, wait);
    };
    const timeoutRef = { current: schedule() };
    return () => { clearTimeout(timeoutRef.current); };
  }, [hidden]);

  if (hidden) return null;

  const focusedStream = focused ? streams.find(s => s.id === focused) : null;

  /* ────────────────────────────────────────── */
  return (
    <>
      <AnimatePresence>
        {mounted && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{    opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 240, damping: 26 }}
            className="livedock"
          >
            {/* ── HEADER ── */}
            <div className="livedock-head">
              <div className="livedock-title">
                <span className="livedock-live-dot" />
                <Radio size={13} />
                <span>LIVE NOW</span>
                <span className="livedock-count">{streams.length}</span>
              </div>
              <div className="livedock-actions">
                <button
                  className="livedock-iconbtn"
                  onClick={() => setExpanded((e) => !e)}
                  aria-label={expanded ? "Collapse" : "Expand"}
                >
                  {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>
                <button
                  className="livedock-iconbtn"
                  onClick={() => setHidden(true)}
                  aria-label="Close"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* ── ACTIVITY BAR  (animates on bid) ── */}
            <div className="livedock-pulse" style={{ background: pulseId
              ? `linear-gradient(90deg, transparent, ${SEED.find(s => s.id === pulseId)?.accent}DD, transparent)`
              : "linear-gradient(90deg, transparent, rgba(123,184,255,0.35), transparent)" }} />

            {/* ── STREAM AVATARS ROW ── */}
            <div className="livedock-streams">
              {streams.map((s) => {
                const pulse = pulseId === s.id;
                const ev    = events.find(e => e.streamId === s.id);
                return (
                  <button
                    key={s.id}
                    className="livedock-stream"
                    onMouseEnter={() => setFocused(s.id)}
                    onMouseLeave={() => setFocused(null)}
                    onClick={() => setFocused(focused === s.id ? null : s.id)}
                    style={{ "--accent": s.accent } as React.CSSProperties}
                  >
                    {/* glow when pulsing */}
                    <motion.div
                      className="livedock-glow"
                      animate={pulse ? { opacity: [0, 0.9, 0], scale: [1, 1.4, 1.6] } : { opacity: 0 }}
                      transition={{ duration: 0.9 }}
                      style={{ background: `radial-gradient(circle, ${s.accent}AA, transparent 70%)` }}
                    />

                    {/* thumb */}
                    <div className="livedock-thumb">
                      <img src={s.thumb} alt="" />
                      <span className="livedock-live-mini">
                        <span className="livedock-live-dot mini" /> LIVE
                      </span>
                    </div>

                    {/* bid-event toast */}
                    <AnimatePresence>
                      {ev && (
                        <motion.div
                          key={ev.id}
                          initial={{ opacity: 0, y: 6,  scale: 0.85 }}
                          animate={{ opacity: 1, y: -32, scale: 1 }}
                          exit={{   opacity: 0, y: -48, scale: 0.9 }}
                          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                          className="livedock-bid-toast"
                          style={{ background: s.accent }}
                        >
                          <Zap size={10} fill="white" /> +{formatINR(ev.amount)}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                );
              })}
            </div>

            {/* ── EXPANDED BODY ── */}
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{    height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="livedock-feed">
                    {streams.map((s) => (
                      <div key={s.id} className="livedock-feed-row" style={{ borderLeft: `3px solid ${s.accent}` }}>
                        <div className="livedock-feed-info">
                          <div className="livedock-feed-seller">{s.seller}</div>
                          <div className="livedock-feed-product">{s.product}</div>
                        </div>
                        <div className="livedock-feed-stats">
                          <div className="livedock-feed-bid">{formatINR(s.bid)}</div>
                          <div className="livedock-feed-viewers"><Eye size={10} /> {s.viewers.toLocaleString("en-IN")}</div>
                        </div>
                      </div>
                    ))}
                    <button className="livedock-cta">
                      <TrendingUp size={14} /> See all live shows
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FOCUSED PiP PREVIEW (hovering or clicking a stream) ── */}
      <AnimatePresence>
        {focusedStream && (
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0,  scale: 1 }}
            exit={{    opacity: 0, x: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="livedock-pip"
            style={{ ['--pip-accent' as any]: focusedStream.accent }}
          >
            <div className="livedock-pip-img">
              <img src={focusedStream.thumb} alt="" />
              <div className="livedock-pip-overlay" />
              <div className="livedock-pip-badge">
                <span className="livedock-live-dot mini" /> LIVE
              </div>
              <div className="livedock-pip-viewers"><Eye size={12} /> {focusedStream.viewers.toLocaleString("en-IN")}</div>
              <button className="livedock-pip-fs" aria-label="Full screen">
                <Maximize2 size={14} />
              </button>
            </div>
            <div className="livedock-pip-body">
              <div className="livedock-pip-seller">
                <div className="livedock-pip-av" style={{ background: focusedStream.accent }}>
                  {focusedStream.initials}
                </div>
                <div>
                  <div className="livedock-pip-name">{focusedStream.seller}</div>
                  <div className="livedock-pip-cat">{focusedStream.category}</div>
                </div>
              </div>
              <div className="livedock-pip-product">{focusedStream.product}</div>
              <div className="livedock-pip-bidrow">
                <div>
                  <div className="livedock-pip-bidlabel">Current bid</div>
                  <div className="livedock-pip-bidval">{formatINR(focusedStream.bid)}</div>
                </div>
                <button className="livedock-pip-bidbtn">Bid Now</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{styles}</style>
    </>
  );
};

/* ══════════════════════════════════════════════
   STYLES
   ══════════════════════════════════════════════ */
const styles = `
.livedock {
  position: fixed;
  right: 22px; bottom: 22px;
  width: 340px;
  background: rgba(7,13,27,0.78);
  backdrop-filter: blur(22px) saturate(140%);
  -webkit-backdrop-filter: blur(22px) saturate(140%);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 18px;
  box-shadow: 0 30px 80px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.08) inset;
  color: white;
  font-family: 'Rubik', system-ui, sans-serif;
  z-index: 9000;
  overflow: hidden;
  isolation: isolate;
}
.livedock-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px 8px;
}
.livedock-title {
  display: flex; align-items: center; gap: 7px;
  font-size: 11px; font-weight: 700; letter-spacing: 1.5px;
  color: rgba(255,255,255,0.85);
}
.livedock-title svg { color: #F43F5E; }
.livedock-count {
  background: rgba(244,63,94,0.18); color: #FB7185;
  padding: 1px 7px; border-radius: 999px; font-size: 10px; font-weight: 800; letter-spacing: 0.5px;
}
.livedock-actions { display: flex; gap: 4px; }
.livedock-iconbtn {
  width: 24px; height: 24px; border-radius: 8px; border: none;
  background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7);
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  transition: background 180ms ease, color 180ms ease;
}
.livedock-iconbtn:hover { background: rgba(255,255,255,0.14); color: white; }

.livedock-live-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #F43F5E;
  box-shadow: 0 0 10px #F43F5E;
  animation: ld-pulse 1.4s infinite;
  display: inline-block;
}
.livedock-live-dot.mini { width: 5px; height: 5px; box-shadow: 0 0 6px currentColor; }
@keyframes ld-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.55; transform: scale(0.8); } }

.livedock-pulse {
  height: 2px; width: 100%;
  transition: background 600ms ease;
}

.livedock-streams {
  display: flex; gap: 12px;
  padding: 14px 16px 18px;
  justify-content: space-between;
}
.livedock-stream {
  position: relative;
  width: 56px; height: 56px; border-radius: 14px;
  border: 1.5px solid rgba(255,255,255,0.12);
  background: transparent; padding: 0; cursor: pointer;
  transition: transform 220ms ease, border-color 220ms ease;
  flex-shrink: 0;
}
.livedock-stream:hover { transform: translateY(-3px); border-color: var(--accent); }
.livedock-thumb {
  position: relative; width: 100%; height: 100%; border-radius: 12px; overflow: hidden;
}
.livedock-thumb img { width: 100%; height: 100%; object-fit: cover; }
.livedock-live-mini {
  position: absolute; top: 3px; left: 3px;
  background: rgba(244,63,94,0.95);
  padding: 1px 4px; border-radius: 4px;
  font-size: 7px; font-weight: 900; letter-spacing: 0.4px; color: white;
  display: flex; align-items: center; gap: 2px;
}
.livedock-glow {
  position: absolute; inset: -8px; border-radius: 18px; pointer-events: none;
}
.livedock-bid-toast {
  position: absolute; left: 50%; transform: translateX(-50%);
  top: 0;
  padding: 3px 8px; border-radius: 999px;
  font-size: 11px; font-weight: 800; color: white;
  display: flex; align-items: center; gap: 4px;
  white-space: nowrap; pointer-events: none;
  box-shadow: 0 6px 20px rgba(0,0,0,0.35);
}

/* expanded feed */
.livedock-feed { border-top: 1px solid rgba(255,255,255,0.07); padding: 10px 12px 12px; display: flex; flex-direction: column; gap: 8px; }
.livedock-feed-row {
  display: flex; align-items: center; justify-content: space-between;
  background: rgba(255,255,255,0.04); border-radius: 10px;
  padding: 9px 10px 9px 12px;
}
.livedock-feed-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.livedock-feed-seller { font-size: 11px; font-weight: 700; color: white; }
.livedock-feed-product { font-size: 10px; color: rgba(255,255,255,0.6); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; }
.livedock-feed-stats { text-align: right; }
.livedock-feed-bid { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 13px; color: white; }
.livedock-feed-viewers { font-size: 9px; color: rgba(255,255,255,0.55); display: inline-flex; align-items: center; gap: 3px; }
.livedock-cta {
  margin-top: 4px; padding: 9px 12px; border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #2B6CB8, #1A4B8C);
  color: white; font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 12px;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer;
  transition: transform 180ms ease, box-shadow 180ms ease;
}
.livedock-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 22px rgba(43,108,184,0.45); }

/* ── PiP focused preview ── */
.livedock-pip {
  position: fixed; right: 380px; bottom: 22px;
  width: 270px;
  background: rgba(7,13,27,0.88);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 16px; overflow: hidden;
  color: white;
  font-family: 'Rubik', system-ui, sans-serif;
  box-shadow: 0 30px 80px rgba(0,0,0,0.5);
  z-index: 9001;
}
.livedock-pip-img { position: relative; aspect-ratio: 16/10; overflow: hidden; }
.livedock-pip-img img { width: 100%; height: 100%; object-fit: cover; }
.livedock-pip-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, transparent 40%, rgba(7,13,27,0.6) 100%); }
.livedock-pip-badge {
  position: absolute; top: 8px; left: 8px;
  background: var(--pip-accent);
  padding: 2px 8px; border-radius: 6px;
  font-size: 9px; font-weight: 900; letter-spacing: 0.5px;
  display: inline-flex; align-items: center; gap: 4px;
}
.livedock-pip-viewers {
  position: absolute; top: 8px; right: 8px;
  background: rgba(0,0,0,0.55);
  padding: 2px 8px; border-radius: 12px;
  font-size: 11px; font-weight: 600;
  display: inline-flex; align-items: center; gap: 4px;
}
.livedock-pip-fs {
  position: absolute; bottom: 8px; right: 8px;
  width: 28px; height: 28px; border-radius: 8px; border: none;
  background: rgba(0,0,0,0.55); color: white; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.livedock-pip-body { padding: 12px 14px 14px; }
.livedock-pip-seller { display: flex; align-items: center; gap: 9px; margin-bottom: 10px; }
.livedock-pip-av {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: 800; font-size: 12px; font-family: 'Outfit', sans-serif;
}
.livedock-pip-name { font-size: 13px; font-weight: 700; }
.livedock-pip-cat  { font-size: 11px; color: rgba(255,255,255,0.55); }
.livedock-pip-product { font-size: 12px; color: rgba(255,255,255,0.78); margin-bottom: 10px; line-height: 1.3; }
.livedock-pip-bidrow {
  display: flex; align-items: center; justify-content: space-between;
  background: rgba(255,255,255,0.05); border-radius: 12px;
  padding: 9px 12px;
}
.livedock-pip-bidlabel { font-size: 10px; color: rgba(255,255,255,0.55); }
.livedock-pip-bidval   { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 17px; color: white; }
.livedock-pip-bidbtn {
  border: none; padding: 8px 14px; border-radius: 10px;
  background: var(--pip-accent); color: white;
  font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 12px; cursor: pointer;
  box-shadow: 0 6px 18px rgba(0,0,0,0.35);
  transition: transform 180ms ease;
}
.livedock-pip-bidbtn:hover { transform: translateY(-1px); }

/* ── small screens: shrink the dock ── */
@media (max-width: 560px) {
  .livedock { right: 12px; bottom: 12px; width: 290px; }
  .livedock-pip { display: none; }
}
`;

export default LiveDock;
