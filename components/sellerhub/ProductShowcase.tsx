/* ─────────────────────────────────────────────────────────
   ProductShowcase.tsx
   The visual heart of the AI anchor experience.

   Displays:
   - Product photos with Ken Burns animation (slow zoom/pan)
   - Demo video in loop (if provided)
   - Auto-advances photos every 5s with crossfade
   - Visual cue sync — [📷 Front View] in script → shows that photo
   - Product info overlays (name, price, features, badges)
   - Bid overlay when auction is active (timer bar + current bid)
   - Avatar pip in bottom-left corner
   - Intro carousel mode (teases all products)
───────────────────────────────────────────────────────── */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Product } from '../../services/claudeScript';

/* ── Ken Burns animation variants ── */
const KB_VARIANTS = [
  'kbZoomInLeft',
  'kbZoomInRight',
  'kbZoomOut',
  'kbPanLeft',
  'kbPanRight',
  'kbZoomInUp',
];

const KB_CSS = `
@keyframes kbZoomInLeft  { from { transform: scale(1)    translateX(0%)   } to { transform: scale(1.18) translateX(-4%) } }
@keyframes kbZoomInRight { from { transform: scale(1)    translateX(0%)   } to { transform: scale(1.18) translateX(4%)  } }
@keyframes kbZoomOut     { from { transform: scale(1.18) translateX(0%)   } to { transform: scale(1)    translateX(0%)  } }
@keyframes kbPanLeft     { from { transform: scale(1.12) translateX(5%)   } to { transform: scale(1.12) translateX(-5%) } }
@keyframes kbPanRight    { from { transform: scale(1.12) translateX(-5%)  } to { transform: scale(1.12) translateX(5%)  } }
@keyframes kbZoomInUp    { from { transform: scale(1)    translateY(0%)   } to { transform: scale(1.18) translateY(-4%) } }
@keyframes showcaseFadeIn  { from { opacity:0 } to { opacity:1 } }
@keyframes featurePop    { from { opacity:0; transform:translateX(-12px) } to { opacity:1; transform:translateX(0) } }
@keyframes bidPulse      { 0%,100% { opacity:1 } 50% { opacity:0.55 } }
@keyframes priceCount    { from { transform:scale(1.2); color:#16a34a } to { transform:scale(1) } }
@keyframes soldBanner    { from { opacity:0; transform:translateY(-20px) } to { opacity:1; transform:translateY(0) } }
`;

/* ── Parse visual cue from script text → photo index ── */
function parseVisualCue(text: string): number {
  if (!text) return -1;
  const t = text.toLowerCase();
  if (/\[.*front/i.test(t))              return 0;
  if (/\[.*back/i.test(t))               return 1;
  if (/\[.*label|tag|brand/i.test(t))    return 2;
  if (/\[.*detail|defect|close|zoom/i.test(t)) return 3;
  if (/\[.*show.*now/i.test(t))          return 0;
  return -1;
}

/* ── Condition labels & colours ── */
const COND_MAP: Record<string, { label: string; color: string; bg: string }> = {
  new:      { label: '🆕 Brand New',  color: '#16a34a', bg: 'rgba(22,163,74,0.15)'  },
  like_new: { label: '✨ Like New',   color: '#2B6CB8', bg: 'rgba(43,108,184,0.15)' },
  good:     { label: '👍 Good',       color: '#d97706', bg: 'rgba(217,119,6,0.15)'  },
  fair:     { label: '⚠️ Fair',       color: '#dc2626', bg: 'rgba(220,38,38,0.15)'  },
};

export interface BidState {
  productName:   string;
  currentBid:    number;
  startPrice:    number;
  currentBidder: string;
  timeLeft:      number;
  totalSeconds:  number;
  productImage?: string;
}

interface Props {
  product:            Product | null;
  allProducts?:       Product[];        // for intro carousel
  phase:              'intro' | 'pitch' | 'bidding' | 'sold' | 'outro';
  bidState?:          BidState | null;
  currentSegText?:    string;           // live script text for cue sync
  avatarNode?:        React.ReactNode;  // rendered as pip bottom-left
  winnerName?:        string;           // shown in sold banner
  height?:            number;           // defaults to 420; omit for 100% height
  style?:             React.CSSProperties; // extra styles (e.g. height:'100%')
}

const ProductShowcase: React.FC<Props> = ({
  product,
  allProducts = [],
  phase,
  bidState,
  currentSegText = '',
  avatarNode,
  winnerName,
  height = 420,
  style,
}) => {
  const [photoIdx,     setPhotoIdx]     = useState(0);
  const [prevPhotoIdx, setPrevPhotoIdx] = useState<number | null>(null);
  const [kbVariant,    setKbVariant]    = useState(0);
  const [fading,       setFading]       = useState(false);
  const [featuresShown, setFeaturesShown] = useState(0);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevSegRef = useRef('');

  /* ── Photo list for current product ── */
  const photos: string[] = (
    phase === 'intro'
      ? allProducts.flatMap(p => p.photos?.slice(0, 1) ?? (p.imageUrl ? [p.imageUrl] : []))
      : (product?.photos?.length ? product.photos : (product?.imageUrl ? [product.imageUrl] : []))
  );

  const hasPhotos = photos.length > 0;

  /* ── Advance to next photo with crossfade ── */
  const advanceTo = useCallback((idx: number) => {
    if (!hasPhotos || photos.length < 2) return;
    const next = ((idx % photos.length) + photos.length) % photos.length;
    setPrevPhotoIdx(photoIdx);
    setFading(true);
    setPhotoIdx(next);
    setKbVariant(v => (v + 1) % KB_VARIANTS.length);
    setTimeout(() => { setPrevPhotoIdx(null); setFading(false); }, 700);
  }, [hasPhotos, photos.length, photoIdx]);

  /* ── Auto-advance every 5s during pitch ── */
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (phase === 'pitch' || phase === 'intro') {
      timerRef.current = setInterval(() => {
        setPhotoIdx(idx => {
          const next = (idx + 1) % Math.max(photos.length, 1);
          setPrevPhotoIdx(idx);
          setFading(true);
          setKbVariant(v => (v + 1) % KB_VARIANTS.length);
          setTimeout(() => { setPrevPhotoIdx(null); setFading(false); }, 700);
          return next;
        });
      }, 5000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, photos.length]);

  /* ── Visual cue sync ── */
  useEffect(() => {
    if (!currentSegText || currentSegText === prevSegRef.current) return;
    const cueIdx = parseVisualCue(currentSegText);
    if (cueIdx >= 0 && cueIdx < photos.length) {
      prevSegRef.current = currentSegText;
      advanceTo(cueIdx);
    }
  }, [currentSegText, advanceTo, photos.length]);

  /* ── Reset when product changes ── */
  useEffect(() => {
    setPhotoIdx(0);
    setPrevPhotoIdx(null);
    setFeaturesShown(0);
    setKbVariant(Math.floor(Math.random() * KB_VARIANTS.length));
  }, [product?.id]);

  /* ── Animate feature bullets in one by one ── */
  useEffect(() => {
    if (phase !== 'pitch') { setFeaturesShown(0); return; }
    const pts = product?.keyPoints?.filter(Boolean) ?? [];
    if (!pts.length) return;
    setFeaturesShown(0);
    const timers = pts.map((_, i) =>
      setTimeout(() => setFeaturesShown(i + 1), 1200 + i * 1800)
    );
    return () => timers.forEach(clearTimeout);
  }, [phase, product?.id]);

  /* ── Bid progress % ── */
  const bidPct = bidState
    ? Math.max(0, (bidState.timeLeft / bidState.totalSeconds) * 100)
    : 0;
  const bidColor = bidState
    ? bidState.timeLeft <= 10 ? '#dc2626' : bidState.timeLeft <= 20 ? '#f59e0b' : '#16a34a'
    : '#16a34a';

  /* ── Active product info ── */
  const displayProduct = phase === 'bidding' && bidState
    ? allProducts.find(p => p.name === bidState.productName) ?? product
    : product;

  const condInfo = displayProduct?.condition ? COND_MAP[displayProduct.condition] : null;
  const features = displayProduct?.keyPoints?.filter(Boolean) ?? [];

  /* ── Intro: show product lineup teaser ── */
  const introProducts = allProducts.filter(p => p.name && p.price);

  // height: 'auto' when style overrides, otherwise use prop
  const containerStyle: React.CSSProperties = {
    position: 'relative', width: '100%',
    height: style?.height ?? height,
    borderRadius: style?.borderRadius ?? 20,
    overflow: 'hidden', background: '#0a0f1a',
    boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
    flexShrink: 0,
    ...style,
  };

  return (
    <div style={containerStyle}>
      <style>{KB_CSS}</style>

      {/* ── Background: Photos with Ken Burns ── */}
      {hasPhotos ? (
        <>
          {/* Current photo */}
          <img
            key={`photo-${photoIdx}-${product?.id}`}
            src={photos[photoIdx]}
            alt=""
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', transformOrigin: 'center center',
              animation: `${KB_VARIANTS[kbVariant % KB_VARIANTS.length]} 6s ease-in-out forwards`,
              zIndex: 1,
            }}
          />
          {/* Prev photo (fading out) */}
          {prevPhotoIdx !== null && (
            <img
              src={photos[prevPhotoIdx]}
              alt=""
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', zIndex: 2,
                opacity: fading ? 0 : 1,
                transition: 'opacity 700ms ease-in-out',
              }}
            />
          )}
        </>
      ) : (
        /* No photos — gradient placeholder */
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(135deg, #0a1628 0%, #1a3a6b 50%, #0d2040 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ fontSize: 64, opacity: 0.3 }}>📦</div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 600 }}>No photos available</div>
        </div>
      )}

      {/* ── Dark gradient overlays for text readability ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 3, background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.08) 100%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, zIndex: 3, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)', pointerEvents: 'none' }} />

      {/* ── TOP-LEFT: Live badge ── */}
      <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 10, display: 'flex', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(220,38,38,0.9)', backdropFilter: 'blur(8px)', borderRadius: 20, padding: '4px 10px' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'white', animation: 'bidPulse 1s ease-in-out infinite' }} />
          <span style={{ color: 'white', fontWeight: 800, fontSize: 11, letterSpacing: '0.08em' }}>LIVE</span>
        </div>
        {displayProduct?.aiVerified && (
          <div style={{ background: 'rgba(22,163,74,0.85)', backdropFilter: 'blur(8px)', borderRadius: 20, padding: '4px 10px' }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 11 }}>✅ AI Verified</span>
          </div>
        )}
      </div>

      {/* ── TOP-RIGHT: Condition badge + photo dots ── */}
      <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
        {condInfo && (
          <div style={{ background: condInfo.bg, backdropFilter: 'blur(8px)', borderRadius: 20, padding: '4px 10px', border: `1px solid ${condInfo.color}33` }}>
            <span style={{ color: condInfo.color, fontWeight: 700, fontSize: 11 }}>{condInfo.label}</span>
          </div>
        )}
        {displayProduct?.hasInvoice && (
          <div style={{ background: 'rgba(43,108,184,0.7)', backdropFilter: 'blur(8px)', borderRadius: 20, padding: '4px 10px' }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 11 }}>🧾 Invoice</span>
          </div>
        )}
        {/* Photo navigation dots */}
        {photos.length > 1 && (
          <div style={{ display: 'flex', gap: 5 }}>
            {photos.map((_, i) => (
              <button key={i} onClick={() => advanceTo(i)}
                style={{ width: i === photoIdx ? 18 : 7, height: 7, borderRadius: 4, background: i === photoIdx ? 'white' : 'rgba(255,255,255,0.4)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 300ms' }} />
            ))}
          </div>
        )}
      </div>

      {/* ── LEFT SIDE: Feature bullets (pitch phase) ── */}
      {phase === 'pitch' && features.length > 0 && (
        <div style={{ position: 'absolute', left: 14, top: '30%', zIndex: 10, display: 'flex', flexDirection: 'column', gap: 7, maxWidth: 200 }}>
          {features.slice(0, featuresShown).map((f, i) => (
            <div key={i} style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)', borderRadius: 10, padding: '6px 10px', borderLeft: '3px solid #2B6CB8', animation: 'featurePop 400ms ease-out forwards' }}>
              <span style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>✓ {f}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── INTRO MODE: Product lineup cards ── */}
      {phase === 'intro' && introProducts.length > 0 && (
        <div style={{ position: 'absolute', bottom: 90, left: 14, right: 14, zIndex: 10, display: 'flex', gap: 8, overflowX: 'auto' }}>
          {introProducts.map((p, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: 12, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0, minWidth: 100 }}>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 700, marginBottom: 2 }}>ITEM {i + 1}</div>
              <div style={{ color: 'white', fontSize: 12, fontWeight: 800, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>{p.name}</div>
              <div style={{ color: '#7BB8FF', fontSize: 12, fontWeight: 700 }}>{p.price}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── BIDDING OVERLAY ── */}
      {phase === 'bidding' && bidState && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 8, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          {/* Timer bar at top */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: 'rgba(255,255,255,0.1)', zIndex: 9 }}>
            <div style={{ height: '100%', background: bidColor, width: `${bidPct}%`, transition: 'width 1s linear', borderRadius: '0 3px 3px 0' }} />
          </div>

          {/* Semi-transparent bid panel */}
          <div style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(16px)', padding: '16px 18px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 2 }}>🔨 LIVE AUCTION</div>
                <div style={{ color: 'white', fontSize: 14, fontWeight: 800 }}>{bidState.productName}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em' }}>TIME LEFT</div>
                <div style={{ color: bidState.timeLeft <= 10 ? '#f87171' : 'white', fontSize: 26, fontWeight: 900, lineHeight: 1, animation: bidState.timeLeft <= 10 ? 'bidPulse 0.5s infinite' : 'none' }}>
                  {String(Math.floor(bidState.timeLeft / 60)).padStart(2, '0')}:{String(bidState.timeLeft % 60).padStart(2, '0')}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 2 }}>Current Bid</div>
                <div style={{ color: '#4ade80', fontSize: 28, fontWeight: 900, letterSpacing: '-0.5px' }}>
                  ₹{bidState.currentBid.toLocaleString('en-IN')}
                </div>
                {bidState.currentBidder
                  ? <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600 }}>🏆 {bidState.currentBidder} is winning</div>
                  : <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>No bids yet — starts at ₹{bidState.startPrice.toLocaleString('en-IN')}</div>
                }
              </div>
              <div style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', borderRadius: 12, padding: '10px 20px', boxShadow: '0 4px 20px rgba(220,38,38,0.5)', animation: 'bidPulse 1.5s infinite' }}>
                <div style={{ color: 'white', fontWeight: 900, fontSize: 14 }}>🔨 BID NOW</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SOLD BANNER ── */}
      {phase === 'sold' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 15, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', animation: 'soldBanner 500ms ease-out' }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>🎉</div>
            <div style={{ color: '#fbbf24', fontSize: 28, fontWeight: 900, marginBottom: 6 }}>SOLD!</div>
            {winnerName && <div style={{ color: 'white', fontSize: 16, fontWeight: 700 }}>🏆 {winnerName} won!</div>}
          </div>
        </div>
      )}

      {/* ── BOTTOM: Product info overlay (pitch mode) ── */}
      {(phase === 'pitch' || phase === 'outro') && displayProduct && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 9, padding: '16px 18px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {displayProduct.brand && (
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 3, textTransform: 'uppercase' }}>{displayProduct.brand}</div>
              )}
              <div style={{ color: 'white', fontSize: 20, fontWeight: 900, lineHeight: 1.2, marginBottom: 4, textShadow: '0 2px 8px rgba(0,0,0,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayProduct.name}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {displayProduct.color && <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>🎨 {displayProduct.color}</span>}
                {displayProduct.material && <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>🧵 {displayProduct.material}</span>}
                {displayProduct.size && <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>📐 {displayProduct.size}</span>}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
              {displayProduct.mrp && (
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, textDecoration: 'line-through', marginBottom: 2 }}>MRP {displayProduct.mrp}</div>
              )}
              <div style={{ color: '#4ade80', fontSize: 26, fontWeight: 900, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{displayProduct.price}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600 }}>Bid starts here</div>
            </div>
          </div>
        </div>
      )}

      {/* ── AVATAR PIP (bottom-left, above overlays) ── */}
      {avatarNode && phase !== 'intro' && (
        <div style={{ position: 'absolute', bottom: phase === 'bidding' ? 145 : 85, left: 14, zIndex: 12, width: 90, background: 'rgba(10,15,26,0.75)', backdropFilter: 'blur(12px)', borderRadius: 14, padding: '8px', border: '1.5px solid rgba(255,255,255,0.12)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          {avatarNode}
        </div>
      )}

      {/* ── OUTRO MODE ── */}
      {phase === 'outro' && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>🙏</div>
          <div style={{ color: 'white', fontSize: 22, fontWeight: 900, textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>Thanks for watching!</div>
        </div>
      )}
    </div>
  );
};

export default ProductShowcase;
