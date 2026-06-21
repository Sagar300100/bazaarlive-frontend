import React, { useState, useRef, useEffect } from 'react';
import { generateLiveScript, answerLiveQuestion, GeneratedScript } from '../../services/claudeScript';
import type { Product, StreamConfig } from '../../services/claudeScript';
import { classifyMessage, containsBadWords, getQuestionType, QuestionType } from '../../utils/chatFilter';
import { speak, browserSpeak, stopAllSpeech, pauseAllSpeech, resumeAllSpeech, isCurrentlyPlaying, isAnySpeechPending, getActiveVoiceLabel, hasGoogleTTS, hasAzureTTS, hasElevenLabs, hasClonedVoice, setClonedVoice, cloneVoice } from '../../services/ttsService';
import LiveSessionService from '../../services/LiveSessionService';
import CameraCapture, { type CapturedPhoto } from './CameraCapture';
import { verifyProductImages, extractProductInfoFromPhotos } from '../../services/imageVerification';
import ProductShowcase, { type BidState as ShowcaseBidState } from './ProductShowcase';
import { createShow, setShowLive } from '../../services/api';

/* ─── Chat message type ─── */
interface ChatMsg {
  id:          string;
  from:        'viewer' | 'ai' | 'system';
  name:        string;
  text:        string;
  isQuestion?: boolean;
}

/* ─── Bid round state ─── */
interface BidRound {
  active:        boolean;
  productName:   string;
  productImage?: string;
  startPrice:    number;
  currentBid:    number;
  currentBidder: string;
  timeLeft:      number;
  totalSeconds:  number;
  history:       { name: string; amount: number }[];
  winner:        string;
  winningBid:    number;
}

/* ─── tiny helpers ─── */
const uid = () => Math.random().toString(36).slice(2, 9);

/** Parse ₹8,999 / Rs.1500 / 8999 → number */
function parsePrice(str: string): number {
  const n = parseFloat(str.replace(/[₹,\sRrs\.]/gi, ''));
  return isNaN(n) ? 0 : n;
}

/** Detect if a chat message is a bid — returns amount or null */
function parseBidAmount(text: string): number | null {
  const t = text.trim().toLowerCase();
  // match: "1500", "bid 1500", "₹1500", "1.5k", "bid ₹1,500"
  const m = t.match(/^(?:bid\s*)?[₹rs\.]*\s*([\d,]+(?:\.\d+)?)\s*(k)?\s*(?:rs?\.?|rupees?)?$/i);
  if (!m) return null;
  let n = parseFloat(m[1].replace(/,/g, ''));
  if (m[2] === 'k') n *= 1000;
  if (!isNaN(n) && n >= 1 && n < 100_000_000) return n;
  return null;
}

const TONES: { value: StreamConfig['tone']; label: string; emoji: string; desc: string }[] = [
  { value: 'energetic', label: 'Energetic',  emoji: '⚡', desc: 'High energy, hype, urgency' },
  { value: 'friendly',  label: 'Friendly',   emoji: '😊', desc: 'Warm, approachable, fun' },
  { value: 'luxury',    label: 'Luxury',      emoji: '✨', desc: 'Premium, exclusive, refined' },
  { value: 'calm',      label: 'Calm',        emoji: '🎯', desc: 'Clear, measured, trustworthy' },
];

const LANGS: { value: StreamConfig['language']; label: string; flag: string }[] = [
  { value: 'english',  label: 'English',   flag: '🇬🇧' },
  { value: 'hindi',    label: 'Hindi',     flag: '🇮🇳' },
  { value: 'hinglish', label: 'Hinglish',  flag: '🔀' },
];

/* ─── Step indicator ─── */
const steps = ['Products', 'Avatar', 'Script', 'Launch'];

const StepBar: React.FC<{ current: number }> = ({ current }) => (
  <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:40 }}>
    {steps.map((s, i) => (
      <React.Fragment key={s}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
          <div style={{
            width:36, height:36, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
            fontWeight:800, fontSize:14,
            background: i < current ? '#16a34a' : i === current ? 'linear-gradient(135deg,#2B6CB8,#1A4B8C)' : 'rgba(43,108,184,0.1)',
            color: i <= current ? 'white' : '#4A7AB5',
            border: i === current ? '2px solid #2B6CB8' : '2px solid transparent',
            transition: 'all 300ms',
          }}>
            {i < current ? '✓' : i + 1}
          </div>
          <span style={{ fontSize:11, fontWeight:700, color: i === current ? '#1B3A6B' : '#4A7AB5', letterSpacing:'0.04em', whiteSpace:'nowrap' }}>{s}</span>
        </div>
        {i < steps.length - 1 && (
          <div style={{ flex:1, height:2, background: i < current ? '#16a34a' : 'rgba(43,108,184,0.15)', margin:'0 8px', marginBottom:22, transition:'background 300ms' }} />
        )}
      </React.Fragment>
    ))}
  </div>
);

/* ─── Product card ─── */
const ProductCard: React.FC<{
  product:  Product;
  onUpdate: (p: Product) => void;
  onRemove: () => void;
  index:    number;
}> = ({ product, onUpdate, onRemove, index }) => {
  const [showCamera,    setShowCamera]    = useState(false);
  const [verifying,     setVerifying]     = useState(false);
  const [verifyError,   setVerifyError]   = useState('');

  /* ── Called when camera modal returns photos ── */
  const handlePhotos = async (photos: CapturedPhoto[]) => {
    setShowCamera(false);
    if (!photos.length) return;

    const photoUrls = photos.map(p => p.dataUrl);
    const fieldsEmpty = !product.name && !product.description;

    // First photo = hero image for display
    const base: Product = {
      ...product,
      imageUrl:   photos[0].dataUrl,
      photos:     photoUrls,
      aiVerified: false,
    };
    onUpdate(base);

    if (fieldsEmpty) {
      // No details filled yet — extract product info from photos first
      setVerifying(true);
      setVerifyError('');
      try {
        const extraction = await extractProductInfoFromPhotos(photoUrls);
        const withInfo: Product = {
          ...base,
          name:        extraction.suggestedName || base.name,
          description: extraction.description   || base.description,
          keyPoints:   extraction.keyPoints.length
                       ? extraction.keyPoints
                       : (base.keyPoints.filter(Boolean).length ? base.keyPoints : ['', '']),
          color:       extraction.color     || base.color     || '',
          material:    extraction.material  || base.material  || '',
          condition:   (extraction.condition as Product['condition']) || base.condition,
          defects:     extraction.defects   || base.defects   || '',
          brand:       extraction.brand     || base.brand     || '',
          size:        extraction.size      || base.size      || '',
        };
        onUpdate(withInfo);
        // Now run verification against the extracted description
        await runVerification(withInfo, photoUrls);
      } catch (e) {
        setVerifyError('Auto-fill failed — please fill details manually');
        await runVerification(base, photoUrls);
      }
      setVerifying(false);
    } else {
      // Seller already filled details — just verify photos match
      await runVerification(base, photoUrls);
    }
  };

  /* ── Run AI verification against the photos ── */
  const runVerification = async (prod: Product, photoUrls: string[]) => {
    if (!photoUrls.length) return;
    setVerifying(true);
    setVerifyError('');
    try {
      const result = await verifyProductImages(
        photoUrls,
        prod.name,
        prod.description,
        prod.keyPoints,
        { condition: prod.condition, color: prod.color, material: prod.material, defects: prod.defects, brand: prod.brand }
      );
      // Auto-generate description from AI's photo analysis if seller hasn't written one
      const autoDescription = !prod.description && result.aiSummary
        ? result.aiSummary
        : prod.description;

      // Build a richer auto-description from all extracted details
      const detailParts = [
        result.extractedColor     && result.extractedColor     !== 'not clearly visible' ? `Color: ${result.extractedColor}`       : '',
        result.extractedMaterial  && result.extractedMaterial  !== 'not clearly visible' ? `Material: ${result.extractedMaterial}` : '',
        result.extractedSize      && result.extractedSize      !== 'not visible'         ? `Size: ${result.extractedSize}`         : '',
        result.extractedBrand     && result.extractedBrand     !== 'not visible'         ? `Brand: ${result.extractedBrand}`       : '',
        result.extractedDefects   && result.extractedDefects   !== 'none visible'        ? `Note: ${result.extractedDefects}`      : '',
      ].filter(Boolean);

      const generatedDescription = !prod.description && detailParts.length > 0
        ? `${result.aiSummary ? result.aiSummary + ' ' : ''}${detailParts.join(' · ')}`
        : autoDescription;

      onUpdate({
        ...prod,
        aiVerified:    true,
        aiColor:       result.extractedColor,
        aiMaterial:    result.extractedMaterial,
        aiCondition:   result.extractedCondition || undefined,
        aiDefects:     result.extractedDefects,
        aiBrand:       result.extractedBrand,
        aiSize:        result.extractedSize,
        aiMatchScore:  result.matchScore,
        aiWarnings:    result.warnings,
        aiSummary:     result.aiSummary,
        // Auto-fill ALL empty seller fields from AI analysis
        description: generatedDescription || prod.description,
        color:     prod.color     || result.extractedColor     || '',
        material:  prod.material  || result.extractedMaterial  || '',
        condition: prod.condition || (result.extractedCondition as Product['condition']) || undefined,
        defects:   prod.defects   || (result.extractedDefects !== 'none visible' ? result.extractedDefects : ''),
        brand:     prod.brand     || (result.extractedBrand !== 'not visible' ? result.extractedBrand : ''),
        size:      prod.size      || (result.extractedSize   !== 'not visible' ? result.extractedSize   : ''),
      });
    } catch (e) {
      setVerifyError('Verification failed — please try again');
    }
    setVerifying(false);
  };

  const matchScore = product.aiMatchScore ?? 0;
  const scoreColor = matchScore >= 80 ? '#16a34a' : matchScore >= 55 ? '#d97706' : '#dc2626';

  return (
    <>
    {showCamera && (
      <CameraCapture
        productName={product.name || `Product ${index + 1}`}
        onDone={handlePhotos}
        onClose={() => setShowCamera(false)}
      />
    )}
    <div style={{ background:'white', border:`1.5px solid ${product.aiVerified ? 'rgba(22,163,74,0.3)' : 'rgba(43,108,184,0.15)'}`, borderRadius:20, overflow:'hidden', boxShadow:'0 2px 12px rgba(43,108,184,0.06)', display:'flex', flexDirection:'column' }}>

      {/* ── Photo area ── */}
      <div style={{ height:150, background:'rgba(43,108,184,0.05)', position:'relative', overflow:'hidden' }}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        ) : (
          <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#4A7AB5', gap:6 }}>
            <div style={{ fontSize:32 }}>📸</div>
            <div style={{ fontSize:12, fontWeight:700 }}>Camera photos required</div>
            <div style={{ fontSize:11, color:'rgba(74,122,181,0.7)' }}>Gallery not allowed</div>
          </div>
        )}

        {/* Photo count badge */}
        {product.photos && product.photos.length > 0 && (
          <div style={{ position:'absolute', bottom:8, left:8, background:'rgba(0,0,0,0.65)', color:'white', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:10 }}>
            📷 {product.photos.length} photo{product.photos.length > 1 ? 's' : ''}
          </div>
        )}

        {/* Verification badge */}
        {product.aiVerified && (
          <div style={{ position:'absolute', bottom:8, right:8, background: matchScore >= 80 ? 'rgba(22,163,74,0.9)' : 'rgba(217,119,6,0.9)', color:'white', fontSize:11, fontWeight:800, padding:'3px 8px', borderRadius:10 }}>
            {matchScore >= 80 ? '✅ AI Verified' : `⚠️ ${matchScore}% match`}
          </div>
        )}

        {/* Index badge */}
        <div style={{ position:'absolute', top:8, left:8, width:22, height:22, borderRadius:'50%', background:'rgba(43,108,184,0.85)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:11, fontWeight:700 }}>{index+1}</div>
        <button onClick={e => { e.stopPropagation(); onRemove(); }}
          style={{ position:'absolute', top:8, right:8, width:22, height:22, borderRadius:'50%', background:'rgba(220,38,38,0.85)', border:'none', color:'white', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>×</button>
      </div>

      {/* ── Camera + Verify buttons ── */}
      <div style={{ display:'flex', gap:6, padding:'10px 14px 0' }}>
        <button onClick={() => setShowCamera(true)}
          style={{ flex:1, padding:'8px 0', borderRadius:10, background:'linear-gradient(135deg,#1A4B8C,#2B6CB8)', color:'white', fontWeight:700, fontSize:12, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
          📷 {product.photos?.length ? 'Retake Photos' : 'Take Photos'}
        </button>
        {product.photos && product.photos.length > 0 && !verifying && (
          <button onClick={() => runVerification(product, product.photos!)}
            style={{ flex:1, padding:'8px 0', borderRadius:10, background: product.aiVerified ? 'rgba(22,163,74,0.1)' : 'rgba(43,108,184,0.1)', color: product.aiVerified ? '#16a34a' : '#2B6CB8', fontWeight:700, fontSize:12, border:`1.5px solid ${product.aiVerified ? 'rgba(22,163,74,0.3)' : 'rgba(43,108,184,0.2)'}`, cursor:'pointer' }}>
            🔍 {product.aiVerified ? 'Re-verify' : 'AI Verify'}
          </button>
        )}
        {verifying && (
          <div style={{ flex:1, padding:'8px 0', borderRadius:10, background:'rgba(43,108,184,0.08)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            <div style={{ width:12, height:12, border:'2px solid rgba(43,108,184,0.3)', borderTopColor:'#2B6CB8', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
            <span style={{ fontSize:12, color:'#2B6CB8', fontWeight:600 }}>
              {!product.name ? '🤖 AI filling details…' : 'Verifying…'}
            </span>
          </div>
        )}
      </div>

      {/* ── AI Verification result ── */}
      {product.aiVerified && (
        <div style={{ margin:'10px 14px 0', borderRadius:10, overflow:'hidden', border:`1px solid ${matchScore >= 80 ? 'rgba(22,163,74,0.2)' : 'rgba(217,119,6,0.25)'}` }}>
          {/* Score header */}
          <div style={{ padding:'8px 12px', background: matchScore >= 80 ? 'rgba(22,163,74,0.07)' : 'rgba(251,191,36,0.1)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, fontWeight:800, color: scoreColor }}>
              {matchScore >= 80 ? '✅ Photos verified' : matchScore >= 55 ? '⚠️ Partial match' : '❌ Mismatch detected'}
            </span>
            <span style={{ fontSize:11, fontWeight:700, color: scoreColor }}>{matchScore}/100</span>
          </div>
          {/* AI extracted summary */}
          {product.aiSummary && (
            <div style={{ padding:'6px 12px', background:'rgba(0,0,0,0.02)', fontSize:11, color:'#374151', lineHeight:1.5, fontStyle:'italic' }}>
              "{product.aiSummary}"
            </div>
          )}
          {/* Warnings */}
          {product.aiWarnings && product.aiWarnings.length > 0 && (
            <div style={{ padding:'6px 12px', background:'rgba(254,243,199,0.6)' }}>
              {product.aiWarnings.map((w, i) => (
                <div key={i} style={{ fontSize:11, color:'#92400e', display:'flex', gap:5, marginBottom:i < product.aiWarnings!.length - 1 ? 3 : 0 }}>
                  <span>⚠️</span><span>{w}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {verifyError && (
        <div style={{ margin:'8px 14px 0', padding:'6px 10px', background:'rgba(254,242,242,0.8)', borderRadius:8, fontSize:11, color:'#dc2626' }}>
          {verifyError}
        </div>
      )}

      {/* ── Scrollable fields — same layout as before, just scrollable ── */}
      <div style={{ overflowY:'auto', maxHeight:560, padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 }}>
        <input placeholder="Product name" value={product.name}
          onChange={e => onUpdate({ ...product, name: e.target.value })}
          style={{ width:'100%', padding:'9px 12px', borderRadius:10, border:'1.5px solid rgba(43,108,184,0.18)', fontSize:13, fontWeight:600, color:'#1B3A6B', outline:'none', boxSizing:'border-box' }}
        />
        <input placeholder="Price (e.g. ₹8,999)" value={product.price}
          onChange={e => onUpdate({ ...product, price: e.target.value })}
          style={{ width:'100%', padding:'9px 12px', borderRadius:10, border:'1.5px solid rgba(43,108,184,0.18)', fontSize:13, color:'#1B3A6B', outline:'none', boxSizing:'border-box' }}
        />
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'#4A7AB5', marginBottom:5, letterSpacing:'0.06em' }}>⏱ BID TIMER</div>
          <div style={{ display:'flex', gap:5 }}>
            {[15, 30, 45, 60, 90].map(s => {
              const active = (product.bidDuration ?? 30) === s;
              return (
                <button key={s} onClick={() => onUpdate({ ...product, bidDuration: s })}
                  style={{ flex:1, padding:'6px 0', borderRadius:8, fontSize:11, fontWeight:700, cursor:'pointer',
                    border: active ? '2px solid #2B6CB8' : '1.5px solid rgba(43,108,184,0.18)',
                    background: active ? 'rgba(43,108,184,0.12)' : 'white',
                    color: active ? '#1B3A6B' : '#4A7AB5' }}>
                  {s}s
                </button>
              );
            })}
          </div>
        </div>
        <textarea placeholder="Short description…" value={product.description}
          onChange={e => onUpdate({ ...product, description: e.target.value })}
          rows={2}
          style={{ width:'100%', padding:'9px 12px', borderRadius:10, border:'1.5px solid rgba(43,108,184,0.18)', fontSize:13, color:'#1B3A6B', outline:'none', resize:'none', boxSizing:'border-box', fontFamily:'inherit' }}
        />

        <div style={{ background:'rgba(43,108,184,0.03)', borderRadius:10, border:'1px solid rgba(43,108,184,0.12)', padding:'10px 12px', display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#4A7AB5', letterSpacing:'0.06em' }}>📋 PRODUCT DETAILS (for AI accuracy)</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
            <input placeholder="Color (e.g. Navy Blue)" value={product.color || ''}
              onChange={e => onUpdate({ ...product, color: e.target.value })}
              style={{ padding:'8px 10px', borderRadius:8, border:'1.5px solid rgba(43,108,184,0.18)', fontSize:13, color:'#1B3A6B', outline:'none', boxSizing:'border-box' }}
            />
            <input placeholder="Size / Dims (e.g. M)" value={product.size || ''}
              onChange={e => onUpdate({ ...product, size: e.target.value })}
              style={{ padding:'8px 10px', borderRadius:8, border:'1.5px solid rgba(43,108,184,0.18)', fontSize:13, color:'#1B3A6B', outline:'none', boxSizing:'border-box' }}
            />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
            <input placeholder="Material (e.g. Cotton)" value={product.material || ''}
              onChange={e => onUpdate({ ...product, material: e.target.value })}
              style={{ padding:'8px 10px', borderRadius:8, border:'1.5px solid rgba(43,108,184,0.18)', fontSize:13, color:'#1B3A6B', outline:'none', boxSizing:'border-box' }}
            />
            <input placeholder="MRP (e.g. ₹1,999)" value={product.mrp || ''}
              onChange={e => onUpdate({ ...product, mrp: e.target.value })}
              style={{ padding:'8px 10px', borderRadius:8, border:'1.5px solid rgba(43,108,184,0.18)', fontSize:13, color:'#1B3A6B', outline:'none', boxSizing:'border-box' }}
            />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
            <input placeholder="Brand (or leave blank)" value={product.brand || ''}
              onChange={e => onUpdate({ ...product, brand: e.target.value })}
              style={{ padding:'8px 10px', borderRadius:8, border:'1.5px solid rgba(43,108,184,0.18)', fontSize:13, color:'#1B3A6B', outline:'none', boxSizing:'border-box' }}
            />
            <select value={product.condition || ''} onChange={e => onUpdate({ ...product, condition: e.target.value as Product['condition'] || undefined })}
              style={{ padding:'8px 10px', borderRadius:8, border:'1.5px solid rgba(43,108,184,0.18)', fontSize:13, color: product.condition ? '#1B3A6B' : '#9ca3af', outline:'none', background:'white', boxSizing:'border-box' }}>
              <option value="">Condition…</option>
              <option value="new">🆕 Brand New</option>
              <option value="like_new">✨ Like New</option>
              <option value="good">👍 Good</option>
              <option value="fair">⚠️ Fair</option>
            </select>
          </div>
          <input placeholder="Defects / issues (leave blank if none)" value={product.defects || ''}
            onChange={e => onUpdate({ ...product, defects: e.target.value })}
            style={{ padding:'8px 10px', borderRadius:8, border:'1.5px solid rgba(220,38,38,0.25)', fontSize:13, color:'#991b1b', outline:'none', background:'rgba(254,242,242,0.5)', boxSizing:'border-box' }}
          />
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, fontWeight:600, color:'#4A7AB5' }}>
            <input type="checkbox" checked={product.hasInvoice ?? false}
              onChange={e => onUpdate({ ...product, hasInvoice: e.target.checked })}
              style={{ width:14, height:14, cursor:'pointer', accentColor:'#2B6CB8' }}
            />
            ✅ Invoice / GST bill available
          </label>
        </div>

        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'#4A7AB5', marginBottom:5, letterSpacing:'0.06em' }}>KEY SELLING POINTS</div>
          {product.keyPoints.map((kp, i) => (
            <div key={i} style={{ display:'flex', gap:6, marginBottom:5 }}>
              <input placeholder={`Point ${i+1}`} value={kp}
                onChange={e => {
                  const pts = [...product.keyPoints]; pts[i] = e.target.value;
                  onUpdate({ ...product, keyPoints: pts });
                }}
                style={{ flex:1, padding:'8px 10px', borderRadius:8, border:'1.5px solid rgba(43,108,184,0.18)', fontSize:13, color:'#1B3A6B', outline:'none' }}
              />
              <button onClick={() => onUpdate({ ...product, keyPoints: product.keyPoints.filter((_,j)=>j!==i) })}
                style={{ padding:'0 8px', borderRadius:8, background:'none', border:'1.5px solid rgba(43,108,184,0.15)', color:'#4A7AB5', cursor:'pointer', fontSize:14 }}>×</button>
            </div>
          ))}
          {product.keyPoints.length < 4 && (
            <button onClick={() => onUpdate({ ...product, keyPoints: [...product.keyPoints, ''] })}
              style={{ fontSize:12, color:'#2B6CB8', fontWeight:600, background:'none', border:'none', cursor:'pointer', padding:'2px 0' }}>
              + Add point
            </button>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

/* ─── Animated speaking avatar ─── */
const SpeakingAvatar: React.FC<{ name: string; isSpeaking: boolean; currentLabel: string }> = ({ name, isSpeaking, currentLabel }) => {
  const initial = (name || 'AI').charAt(0).toUpperCase();
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
      {/* Avatar circle with glow */}
      <div style={{ position:'relative', width:140, height:140 }}>
        {/* Outer pulse rings when speaking */}
        {isSpeaking && (
          <>
            <div style={{ position:'absolute', inset:-12, borderRadius:'50%', border:'2px solid rgba(43,108,184,0.25)', animation:'ringPulse 1.8s ease-out infinite' }} />
            <div style={{ position:'absolute', inset:-6, borderRadius:'50%', border:'2px solid rgba(43,108,184,0.4)', animation:'ringPulse 1.8s ease-out infinite 0.4s' }} />
          </>
        )}
        {/* Main circle */}
        <div style={{
          width:140, height:140, borderRadius:'50%',
          background:'linear-gradient(135deg, #1A4B8C 0%, #2B6CB8 50%, #5B9BD5 100%)',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow: isSpeaking ? '0 0 40px rgba(43,108,184,0.6)' : '0 8px 32px rgba(43,108,184,0.3)',
          transition: 'box-shadow 400ms',
          position:'relative', overflow:'hidden',
        }}>
          <span style={{ fontSize:56, fontWeight:900, color:'white', fontFamily:'system-ui', lineHeight:1 }}>{initial}</span>
          {/* Shimmer overlay when speaking */}
          {isSpeaking && (
            <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)', animation:'shimmer 2s linear infinite' }} />
          )}
        </div>
      </div>

      {/* Sound wave bars */}
      <div style={{ display:'flex', alignItems:'center', gap:3, height:32 }}>
        {[0,1,2,3,4,5,6].map(i => (
          <div key={i} style={{
            width:4, borderRadius:2,
            background: isSpeaking ? 'linear-gradient(180deg,#2B6CB8,#5B9BD5)' : 'rgba(43,108,184,0.2)',
            height: isSpeaking ? undefined : 6,
            animation: isSpeaking ? `wave ${0.6 + i * 0.08}s ease-in-out infinite alternate` : 'none',
            animationDelay: `${i * 0.07}s`,
            transition: 'background 300ms',
          }} />
        ))}
      </div>

      {/* Current segment label */}
      <div style={{ fontSize:12, fontWeight:700, color:'#4A7AB5', letterSpacing:'0.05em', textTransform:'uppercase' }}>
        {isSpeaking ? `▶ ${currentLabel}` : '⏸ Paused'}
      </div>
    </div>
  );
};

/* ─── MAIN PANEL ─── */
const AIStreamPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [step, setStep] = useState(0);
  const [products, setProducts] = useState<Product[]>([
    { id: uid(), name: '', price: '', description: '', keyPoints: ['', ''], imageUrl: undefined,
      brand: '', color: '', material: '', size: '', condition: undefined, defects: '', mrp: '', hasInvoice: false,
      photos: [], aiVerified: false },
  ]);
  const [config, setConfig] = useState<StreamConfig>({ language: 'hinglish', tone: 'energetic', sellerName: '' });
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [launched, setLaunched] = useState(false);

  /* Voice cloning state */
  const [isRecording,   setIsRecording]   = useState(false);
  const [recordingSecs, setRecordingSecs] = useState(0);
  const [audioBlob,     setAudioBlob]     = useState<Blob | null>(null);
  const [cloning,       setCloning]       = useState(false);
  const [cloneError,    setCloneError]    = useState('');
  const [voiceCloned,   setVoiceCloned]   = useState(hasClonedVoice());
  const mediaRecRef  = useRef<MediaRecorder | null>(null);
  const recChunksRef = useRef<Blob[]>([]);
  const recTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Live stream state */
  const [currentSegIdx, setCurrentSegIdx]   = useState(0);
  const [warmupActive,  setWarmupActive]    = useState(false);
  const [warmupSecs,    setWarmupSecs]      = useState(0);
  const warmupTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const greetedViewers  = useRef<Set<string>>(new Set()); // track who's been welcomed
  const [warmupDuration, setWarmupDuration] = useState(60); // seconds
  const [isSpeaking, setIsSpeaking]         = useState(false);
  const [isPaused, setIsPaused]             = useState(false);
  const [liveViewers, setLiveViewers]       = useState(0);
  const [liveBids, setLiveBids]             = useState(0);
  const [liveRevenue, setLiveRevenue]       = useState(0);
  const [chatMessages, setChatMessages]     = useState<ChatMsg[]>([]);
  // Ref that always points to current chatMessages — fixes stale closure in openFloor
  const chatMsgsRef = useRef<ChatMsg[]>([]);
  useEffect(() => { chatMsgsRef.current = chatMessages; }, [chatMessages]);
  const [viewerInput, setViewerInput]       = useState('');
  const [isAnswering, setIsAnswering]       = useState(false);
  const [bannedCount, setBannedCount]       = useState(0);
  const statsRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const segIdxRef       = useRef(0);
  const answeringRef    = useRef(false);
  const inOpenFloorRef  = useRef(false); // true during openFloor wait — blocks engagement + immediate Q&A
  const chatBoxRef      = useRef<HTMLDivElement>(null);
  /* Filter state refs */
  const bannedUsersRef   = useRef<Set<string>>(new Set());
  const answeredTypesRef = useRef<Set<QuestionType>>(new Set());
  const questionQueueRef = useRef<{ question: string; from: string }[]>([]);

  /* Bidding */
  const [bidRound, setBidRound]       = useState<BidRound | null>(null);
  const [soldItems, setSoldItems]     = useState<{ name: string; winner: string; amount: number }[]>([]);
  /* Ref mirror of soldItems — always fresh inside async callbacks and closures */
  const soldItemsRef = useRef<{ name: string; winner: string; amount: number }[]>([]);
  useEffect(() => { soldItemsRef.current = soldItems; }, [soldItems]);
  const [bidInput, setBidInput]       = useState('');
  const [bidError, setBidError]       = useState('');
  const bidTimerRef                   = useRef<ReturnType<typeof setInterval> | null>(null);
  const bidCallbackRef                = useRef<(() => void) | null>(null);
  const bidRoundRef                   = useRef<BidRound | null>(null);
  const bidEndHandledRef              = useRef(false);  // prevents double-fire from React re-running state updaters
  const outroModeRef                  = useRef(false);  // blocks ALL other speech during outro
  const liveShowIdRef                 = useRef<string | number | null>(null); // backend show ID for visibility
  /* Speech queue for bid announcements — so bids don't cancel each other */
  const bidAnnQueue = useRef<Array<{ text: string; onDone?: () => void; priority?: boolean }>>([]);
  const bidAnnBusy  = useRef(false);
  /* Kill-switch: set false in handleEndStream to stop all speech callbacks */
  const streamActiveRef = useRef(false);

  /* ── Dynamic outro — generated at RUNTIME based on actual results ──
     Reads soldItemsRef so it always has fresh data even inside stale closures.
     This replaces the pre-written script.outro which knows nothing about
     what actually happened (unsold items, who won, etc.)                    */
  const buildDynamicOutro = (): string => {
    const lang         = config.language;
    const validProds   = products.filter(p => p.name && p.price);
    const sold         = soldItemsRef.current;          // fresh via ref
    const totalProds   = validProds.length;
    const soldCount    = sold.length;
    const unsoldCount  = totalProds - soldCount;
    const sellerName   = config.sellerName || 'Main';

    /* Nothing sold at all */
    if (soldCount === 0) {
      return lang === 'hinglish'
        ? `Yaar, aaj koi bhi item sell nahi hua — koi baat nahi! Sab items listing mein available hain, direct buy kar sakte ho. Agle show mein phir milenge — channel follow karo! Bahut shukriya aane ke liye, pyaar dete rehna! Bye bye!`
        : lang === 'hindi'
        ? `दोस्तों, आज कोई item नहीं बिका — कोई बात नहीं! सब items listing में available हैं, देख सकते हो। अगले show में ज़रूर आना! शुक्रिया! बाय!`
        : `Hey everyone — no items sold today, but no worries! All items are available for direct purchase in the listings. Follow the channel so you don't miss the next show! Thank you so much for joining, see you soon!`;
    }

    /* Everything sold — celebrate */
    const soldLines = sold.map(s =>
      lang === 'hinglish'
        ? `${s.winner} ne ${s.name} liya ₹${s.amount.toLocaleString('en-IN')} mein`
        : lang === 'hindi'
        ? `${s.winner} ने ${s.name} ₹${s.amount.toLocaleString('en-IN')} में जीता`
        : `${s.winner} won ${s.name} for ₹${s.amount.toLocaleString('en-IN')}`
    ).join(', ');

    if (soldCount === totalProds) {
      return lang === 'hinglish'
        ? `Kya zabardast show raha aaj ka — sab kuch bik gaya! ${soldLines}. Winners — apna notification check karo, shipping details aa jaayenge. Baaki sab — agli baar mat chhodna! Channel follow karo! Bahut shukriya! Bye bye! ❤️`
        : lang === 'hindi'
        ? `क्या शानदार show रहा — सब बिक गया! ${soldLines}. Winners — notification check करो! सब को शुक्रिया! बाय! ❤️`
        : `What an amazing show — everything sold out! ${soldLines}. Winners, check your notifications for shipping details. Everyone else, don't miss the next show — follow the channel! Thank you so much, bye! ❤️`;
    }

    /* Some sold, some unsold */
    const unsoldNames = validProds
      .filter(p => !sold.find(s => s.name === p.name))
      .map(p => p.name).join(', ');

    return lang === 'hinglish'
      ? `Bahut accha show raha! ${soldLines}. Winners — notification check karo shipping ke liye. ${unsoldCount} item${unsoldCount > 1 ? 's' : ''} sell nahi hua — ${unsoldNames} — listing mein directly buy kar sakte ho. Agle show ke liye channel follow karo! Shukriya sab ko! Bye! ❤️`
      : lang === 'hindi'
      ? `अच्छा show रहा! ${soldLines}. Winners notification check करो। ${unsoldNames} listing में available है। अगला show ज़रूर देखना! शुक्रिया! बाय! ❤️`
      : `Great show everyone! ${soldLines}. Winners, check your notifications for shipping. ${unsoldCount} item${unsoldCount > 1 ? 's' : ''} (${unsoldNames}) available for direct purchase in listings. Follow the channel for the next show! Thank you all, bye! ❤️`;
  };

  /* All script segments as a flat array */
  const getAllSegments = () => {
    if (!script) return [];
    return [
      { label: 'Intro',  text: script.intro },
      ...script.products.map((p, i) => ({
        label: `Product ${i + 1}${products[i]?.name ? ' — ' + products[i].name : ''}`,
        text:  p.segment.replace(/\*\*/g, ''),
      })),
      { label: 'Outro', text: buildDynamicOutro() }, // ← live results, not pre-written
    ];
  };

  /* ── Speech queue for bid/engagement announcements ──
     Priority rules:
     • priority=true  → URGENT (bid opens, winner, countdown)
                        Stops current audio immediately. No waiting.
     • priority=false → NON-URGENT (engagement reactions, comments)
                        If script/Q&A is currently playing, SKIP (just show in chat).
                        Never interrupts the script chain.
  ── */
  const drainBidSpeech = () => {
    if (bidAnnBusy.current || !bidAnnQueue.current.length) return;
    if (outroModeRef.current) { bidAnnQueue.current = []; return; } // outro = absolute silence

    const item = bidAnnQueue.current[0]; // peek first

    if (!item.priority && isAnySpeechPending()) {
      // Non-urgent + script is playing → don't interrupt, skip this item
      // It was already shown in chat — that's enough
      bidAnnQueue.current.shift();
      return;
    }

    bidAnnQueue.current.shift(); // now dequeue
    bidAnnBusy.current = true;

    // Only STOP current audio for priority (urgent) items
    if (item.priority) stopAllSpeech();

    const rate = config.tone === 'energetic' ? 1.05 : 0.98;
    speak(item.text, config.tone, config.language, rate, () => {
      bidAnnBusy.current = false;
      if (!streamActiveRef.current) return;
      item.onDone?.();
      drainBidSpeech();
    });
  };

  /** Queue a bid announcement. If queue is backed up, older non-priority items are dropped. */
  const speakBid = (text: string, onDone?: () => void, priority = false) => {
    // Drop stale non-priority items when queue is getting long
    while (bidAnnQueue.current.length >= 2) {
      const dropIdx = bidAnnQueue.current.findIndex((x, i) => i > 0 && !x.priority && !x.onDone);
      if (dropIdx > 0) { bidAnnQueue.current.splice(dropIdx, 1); } else break;
    }
    bidAnnQueue.current.push({ text, onDone, priority });
    drainBidSpeech();
  };

  /** Stop all speech + reset bid queue — called when bidding opens (urgent) or stream ends */
  const resetBidSpeech = () => {
    stopAllSpeech();
    bidAnnQueue.current      = [];
    bidAnnBusy.current       = false;
    // Reset answered types so post-bid Q&A for next product starts fresh
    answeredTypesRef.current = new Set();
  };

  /* Start an auction round for a product, call onComplete when done */
  const startBidRound = (productIdx: number, onComplete: () => void) => {
    if (!streamActiveRef.current) return; // stream ended — don't open a new bid round
    const validProds  = products.filter(p => p.name && p.price);
    const product     = validProds[productIdx];
    if (!product) { onComplete(); return; }

    const startPrice  = parsePrice(product.price);
    const BID_SECONDS = product.bidDuration ?? 30; // use per-product setting, default 30s
    const halfTime    = Math.floor(BID_SECONDS / 2);

    const initial: BidRound = {
      active: true, productName: product.name, productImage: product.imageUrl,
      startPrice, currentBid: startPrice, currentBidder: '',
      timeLeft: BID_SECONDS, totalSeconds: BID_SECONDS,
      history: [], winner: '', winningBid: 0,
    };
    setBidRound(initial);
    bidRoundRef.current    = initial;
    bidCallbackRef.current = onComplete;

    // Reset queue and cancel any ongoing speech, then open bidding
    resetBidSpeech();
    const openText = config.language === 'hinglish'
      ? `Bidding open! ${product.name} ke liye! Starting ${product.price}! Abhi bid karo, sirf ${BID_SECONDS} seconds!`
      : config.language === 'hindi'
      ? `${product.name} की बिडिंग शुरू! शुरुआती कीमत ${product.price}! अभी बोली लगाओ, ${BID_SECONDS} सेकंड!`
      : `Bidding is open for ${product.name}! Starting at ${product.price}! ${BID_SECONDS} seconds on the clock, bid now!`;

    addChat({ from:'system', name:'System', text:`🔨 BIDDING OPEN — ${product.name} | Start: ${product.price} | ${BID_SECONDS}s` });
    speakBid(openText, undefined, true);

    /* Countdown ticker — reads bidRoundRef (synchronous) not React state.
       React 18 batches setInterval setState calls — updater runs async.
       bidRoundRef is always current because we update it synchronously. */
    bidEndHandledRef.current = false;
    if (bidTimerRef.current) clearInterval(bidTimerRef.current);
    bidTimerRef.current = setInterval(() => {
      // Read current state from ref — ALWAYS synchronous, never batched
      const cur = bidRoundRef.current;
      if (!cur || !cur.active) return;

      const newTime = cur.timeLeft - 1;
      const lang    = config.language;

      // Update ref synchronously (used for side effects below)
      const updated: BidRound = { ...cur, timeLeft: newTime };
      bidRoundRef.current = updated;

      // Update React UI state (batched by React 18 — fine, just for display)
      if (newTime <= 0) {
        const final = { ...updated, active: false };
        bidRoundRef.current = final;
        setBidRound(final);
      } else {
        setBidRound(updated);
      }

      /* Half-time callout */
      if (BID_SECONDS >= 30 && newTime === halfTime) {
        const msg = cur.currentBidder
          ? lang === 'hinglish' ? `${halfTime} seconds bache! ${cur.currentBidder} ne ₹${cur.currentBid.toLocaleString('en-IN')} lagayi! Kaun counter karega?`
            : `${halfTime} seconds! ${cur.currentBidder} leads at ₹${cur.currentBid.toLocaleString('en-IN')}! Anyone higher?`
          : lang === 'hinglish' ? `${halfTime} seconds bache! Abhi tak koi bid nahi — ₹${cur.startPrice.toLocaleString('en-IN')} se shuru karo!`
            : `${halfTime} seconds — no bids yet! Starting at ₹${cur.startPrice.toLocaleString('en-IN')}!`;
        addChat({ from:'ai', name:'AI Host', text:`⏱ ${msg}` });
        speakBid(msg);
      }

      /* 10-second warning — always show in chat; only SPEAK if nothing else is playing.
         Old behaviour: stopAllSpeech() here cut any ongoing Q&A answer mid-sentence. */
      if (newTime === 10 && BID_SECONDS > 15) {
        const msg = cur.currentBidder
          ? lang === 'hinglish' ? `Sirf 10 seconds! ${cur.currentBidder} aage hai ₹${cur.currentBid.toLocaleString('en-IN')} mein! Beat karo!`
            : `10 seconds! ${cur.currentBidder} leads — beat them!`
          : lang === 'hinglish' ? `10 seconds! Abhi bid karo — bilkul abhi!`
            : `10 seconds! Bid NOW!`;
        addChat({ from:'ai', name:'AI Host', text:`⏱ ${msg}` });
        // Only speak if the channel is free — don't interrupt an ongoing Q&A answer
        if (!isAnySpeechPending()) {
          speakBid(msg);
        }
      }

      /* 4-second callout — skip entirely if something is speaking (winner coming in 4s anyway) */
      if (newTime === 4 && !isAnySpeechPending()) {
        const fc = lang === 'hinglish' ? 'Jaa raha hai! Jaa raha hai!'
          : lang === 'hindi' ? 'जाता है! जाता है!'
          : 'Going once, going twice!';
        speakBid(fc); // no priority — don't interrupt anything
      }

      /* Time's up — wait up to 2s for current speech to finish naturally,
         then announce the winner. Avoids cutting a Q&A answer mid-sentence. */
      if (newTime <= 0 && !bidEndHandledRef.current) {
        bidEndHandledRef.current = true;
        clearInterval(bidTimerRef.current!);

        // Snapshot cur fields before any async delay
        const winner   = cur.currentBidder;
        const winAmt   = cur.currentBid;
        const prodName = cur.productName;
        const prodImg  = cur.productImage;

        const fireAnnouncement = () => {
          if (!streamActiveRef.current) return;
          stopAllSpeech();
          bidAnnQueue.current = [];
          bidAnnBusy.current  = false;

          if (winner) {
            const winMsg = lang === 'hinglish'
              ? `Sold! Congratulations ${winner}! ${prodName} aapka ho gaya ₹${winAmt.toLocaleString('en-IN')} mein!`
              : lang === 'hindi'
              ? `बिका! बधाई हो ${winner}! ${prodName} आपका ₹${winAmt.toLocaleString('en-IN')} में!`
              : `Sold! Congratulations ${winner}! ${prodName} is yours for ₹${winAmt.toLocaleString('en-IN')}!`;
            addChat({ from:'system', name:'System', text:`🎉 SOLD to ${winner} for ₹${winAmt.toLocaleString('en-IN')}!` });
            speakBid(winMsg, () => {
              // Do NOT add to soldItems yet — only add when payment is confirmed.
              // If payment fails, the item must NOT appear as sold.
              setBidRound(null);
              bidRoundRef.current = null;
              startPaymentWindow(winner, prodName, winAmt, productIdx);
            }, true);
          } else {
            const noWin = lang === 'hinglish'
              ? `Koi bid nahi is baar! ${prodName} phir milega. Chalo aage badhte hain!`
              : lang === 'hindi'
              ? `इस बार कोई बोली नहीं। आगे बढ़ते हैं!`
              : `No bids for ${prodName} this round. Moving on!`;
            addChat({ from:'system', name:'System', text:`😔 No bids for ${prodName}` });
            speakBid(noWin, () => {
              setBidRound(null);
              bidRoundRef.current = null;
              setTimeout(() => bidCallbackRef.current?.(), 600);
            }, true);
          }
        };

        // Give any in-progress speech up to 2 seconds to finish naturally
        if (isAnySpeechPending()) {
          let waited = 0;
          const poll = setInterval(() => {
            waited++;
            if (!streamActiveRef.current || !isAnySpeechPending() || waited >= 2) {
              clearInterval(poll);
              fireAnnouncement();
            }
          }, 1000);
        } else {
          fireAnnouncement();
        }
      }
    }, 1000);
  };

  /* ── Split segment text into 2-sentence chunks for mid-pitch Q&A injection ── */
  const chunkSegment = (text: string): string[] => {
    // Strip camera cues — they're visual directions, not spoken
    const clean = text.replace(/\[📷[^\]]*\]/gi, '').replace(/\[Show[^\]]*\]/gi, '').trim();
    // Split on sentence endings (. ! ? । ) followed by whitespace
    const sentences = clean.split(/(?<=[.!?।])\s+/).filter(s => s.trim().length > 8);
    if (sentences.length <= 2) return [clean]; // short segment — keep as one
    // Group into pairs of 2 sentences per chunk
    const chunks: string[] = [];
    for (let i = 0; i < sentences.length; i += 2) {
      chunks.push(sentences.slice(i, i + 2).join(' '));
    }
    return chunks;
  };

  /* ── Option B: Smart grouped answering ──
     Groups questions by type so 3 people asking about shipping
     get ONE answer that addresses all of them by name.
  ── */
  const smartAnswerThenDo = (maxGroups: number, onAllDone: () => void) => {
    if (questionQueueRef.current.length === 0) { onAllDone(); return; }

    // Group by question type — keeps first question text, collects all asker names
    const typeMap = new Map<string, { question: string; names: string[] }>();

    [...questionQueueRef.current].forEach(item => {
      const qType = getQuestionType(item.question) || item.question.slice(0, 30);
      if (!typeMap.has(qType)) {
        typeMap.set(qType, { question: item.question, names: [item.from] });
      } else {
        const existing = typeMap.get(qType)!;
        if (!existing.names.includes(item.from)) existing.names.push(item.from);
      }
    });
    questionQueueRef.current = [];

    const groups = Array.from(typeMap.values()).slice(0, maxGroups); // respect max limit
    let g = 0;

    const answerNextGroup = () => {
      if (!streamActiveRef.current) return;
      if (g >= groups.length) { onAllDone(); return; }

      const { question, names } = groups[g++];
      // Build a name prefix so AI addresses everyone who asked
      const addressStr = names.length > 1
        ? (config.language === 'hinglish'
            ? `${names.slice(0, 3).join(', ')} — ${names.length} logon ne poocha`
            : `${names.slice(0, 3).join(', ')} (${names.length} people asked)`)
        : names[0];

      processAnswer(question, addressStr, () => {
        answeringRef.current = true;
        setTimeout(() => {
          answeringRef.current = false;
          if (!streamActiveRef.current) return;
          answerNextGroup();
        }, 2000);
      });
    };

    answerNextGroup();
  };

  /* Speak a segment — uses Google Neural → Azure → ElevenLabs → browser voice (priority order) */
  const speakFromIndex = (idx: number) => {
    // Hard stop: if stream was ended, don't do anything
    if (!streamActiveRef.current) return;

    const segs = getAllSegments();
    if (idx >= segs.length) {
      if (questionQueueRef.current.length > 0) {
        const next = questionQueueRef.current.shift()!;
        processAnswer(next.question, next.from);
      } else {
        setIsSpeaking(false);
      }
      return;
    }

    segIdxRef.current = idx;
    setCurrentSegIdx(idx);
    setIsSpeaking(true);

    // Reset Q&A state for every new product segment
    const totalSegsNow = getAllSegments().length;
    const isProductSeg = idx >= 1 && idx <= totalSegsNow - 2;
    if (isProductSeg) {
      chatHistoryRef.current   = [];
      // CRITICAL: Reset answered types per product so "pehle answer ho gaya"
      // doesn't wrongly deflect real viewer questions for the current product.
      // Scripted Q&A injection in the previous product was marking types answered.
      answeredTypesRef.current = new Set();
    }

    // Slower rates = more human, less robotic rushing
    // These only affect browser TTS fallback; Google TTS uses its own prosody config
    const rateMap: Record<string, number> = { energetic: 0.95, calm: 0.82, luxury: 0.85, friendly: 0.90 };
    const rate = rateMap[config.tone] || 0.90;

    const onSegmentDone = () => {
      if (!streamActiveRef.current) return;

      const totalSegs  = segs.length;
      const isIntro    = idx === 0;
      const isProduct  = idx >= 1 && idx <= totalSegs - 2;
      const productIdx = idx - 1;

      /* ── Answer up to `max` real viewer questions, then call onAllDone ── */
      const answerThenDo = (max: number, onAllDone: () => void) => {
        if (max > 0 && questionQueueRef.current.length > 0 && !answeringRef.current) {
          const next = questionQueueRef.current.shift()!;
          processAnswer(next.question, next.from, () => {
            // Brief gap between answers — keeps answeringRef true to block engagement
            answeringRef.current = true;
            setTimeout(() => {
              answeringRef.current = false;
              if (!streamActiveRef.current) return;
              answerThenDo(max - 1, onAllDone);
            }, 2000); // 2s gap — enough to feel natural, not dead air
          });
        } else {
          if (questionQueueRef.current.length > 0) {
            addChat({ from:'system', name:'System', text:`📝 Moving to bidding — ${questionQueueRef.current.length} question(s) will be addressed next round!` });
            questionQueueRef.current = [];
          }
          onAllDone();
        }
      };

      /* ── Open floor: invite audience, wait, react to whatever they said ── */
      const openFloor = (inviteText: string, waitMs: number, onDone: () => void) => {
        const snapshotIdx = chatMsgsRef.current.length; // snapshot CURRENT length via ref
        inOpenFloorRef.current = true;                  // block engagement + immediate Q&A during wait
        addChat({ from:'ai', name:'AI Host', text: inviteText });

        speak(inviteText, config.tone, config.language, 0.9, () => {
          if (!streamActiveRef.current) { inOpenFloorRef.current = false; return; }

          setTimeout(() => {
            // inOpenFloorRef stays TRUE — caller will clear it when the whole chain finishes
            if (!streamActiveRef.current) { inOpenFloorRef.current = false; return; }

            // Read CURRENT messages via ref — never stale
            const newMsgs  = chatMsgsRef.current.slice(snapshotIdx).filter(m => m.from === 'viewer');
            const names    = [...new Set(newMsgs.map(m => m.name))].slice(0, 3);
            const texts    = newMsgs.map(m => m.text);

            if (newMsgs.length === 0) {
              // Truly nobody responded — move on gracefully, no "koi baat nahi" lecture
              const gentle = config.language === 'hinglish'
                ? `Chalo, aage badhte hain! Koi sawaal ho toh kabhi bhi chat mein likhna.`
                : config.language === 'hindi'
                ? `चलो आगे बढ़ते हैं! कोई सवाल हो तो chat में लिखना।`
                : `Let's keep going! Drop any questions in chat anytime.`;
              addChat({ from:'ai', name:'AI Host', text: gentle });
              speak(gentle, config.tone, config.language, 0.9, onDone);
              return;
            }

            // Detect city/location mentions
            const cityPattern = /delhi|mumbai|bangalore|bengaluru|hyderabad|chennai|kolkata|pune|jaipur|ahmedabad|surat|lucknow|kanpur|nagpur|indore|bhopal|patna|chandigarh|goa|noida|gurugram|gurgaon|faridabad|se hoon|se hun|se dekh|from/i;
            const citiesFound = texts.filter(t => cityPattern.test(t));

            // Detect real questions
            const questionMsgs = newMsgs.filter(m =>
              /\?|kya|hai|kaise|kitna|batao|bolo|milega|chahiye|ship|return|price|original|defect|quality|size|color|material|cod|invoice/i.test(m.text)
            );

            if (questionMsgs.length > 0) {
              // Queue real questions for answerThenDo — DON'T process them here
              questionMsgs.slice(0, 3).forEach(m => {
                if (!questionQueueRef.current.find(q => q.question === m.text)) {
                  questionQueueRef.current.push({ question: m.text, from: m.name });
                }
              });
              onDone();
            } else if (citiesFound.length > 0) {
              // Someone replied with their city — react specifically to it
              const cityText  = texts[0]; // use first reply text
              const firstName = names[0] || 'yaar';
              const react = config.language === 'hinglish'
                ? `Wah! ${firstName} ${citiesFound.length > 1 ? `aur ${names.slice(1).join(', ')}` : ''} — amazing hai! ${names.length > 1 ? `Itne saare logon` : `Aap`} ne join kiya — ek dum solid crowd aaj ka! Chalo shuru karte hain!`
                : config.language === 'hindi'
                ? `वाह! ${names.join(', ')} — बहुत अच्छा! आप सब का स्वागत है! चलो शुरू करते हैं!`
                : `Wow! ${names.join(', ')} — amazing to have you all here! Let's get started!`;
              addChat({ from:'ai', name:'AI Host', text: react });
              speak(react, config.tone, config.language, 0.9, onDone);
            } else {
              // General responses (hype, emojis, etc.) — acknowledge warmly
              const nameList = names.join(', ');
              const react = config.language === 'hinglish'
                ? `${nameList} — dekho kitni energy hai chat mein! Aap sab ki wajah se yeh show amazing ho gaya! Chalo shuru karte hain!`
                : config.language === 'hindi'
                ? `${nameList} — शुक्रिया! आगे बढ़ते हैं!`
                : `${nameList} — love the energy in chat! Let's get into it!`;
              addChat({ from:'ai', name:'AI Host', text: react });
              speak(react, config.tone, config.language, 0.9, onDone);
            }
          }, waitMs);
        });
      };

      if (isIntro) {
        const introInvite = config.language === 'hinglish'
          ? `Chat mein batao — kahan se dekh rahe ho aaj? Mumbai? Delhi? Bangalore? Main sun raha hoon!`
          : config.language === 'hindi'
          ? `Chat में बताओ — कहाँ से देख रहे हो? मैं सुन रहा हूँ!`
          : `Tell me in chat — where are you watching from today? I'm listening!`;
        // 10s window — user needs time to hear the question AND type an answer
        openFloor(introInvite, 10000, () => {
          inOpenFloorRef.current = false;
          speakFromIndex(segIdxRef.current + 1);
        });


      } else if (isProduct) {
        const prod  = products.filter(p => p.name && p.price)[productIdx];
        const pName = prod?.name || 'yeh item';

        const openBidding = () => {
          const bidNotice = config.language === 'hinglish'
            ? `Shukriya sab ko! Ab bidding kholte hain — ready ho jao!`
            : config.language === 'hindi'
            ? `शुक्रिया! अब बिडिंग शुरू होती है!`
            : `Thank you everyone! Let's open the bidding — get ready!`;
          addChat({ from:'ai', name:'AI Host', text: bidNotice });
          inOpenFloorRef.current = false;
          speak(bidNotice, config.tone, config.language, 0.95, () => {
            if (!streamActiveRef.current) return;
            startBidRound(productIdx, () => speakFromIndex(segIdxRef.current + 1));
          });
        };

        const injectScriptedQ = () => {
          if (questionQueueRef.current.length === 0 && script?.qaResponses?.length) {
            const q1    = script.qaResponses[(productIdx * 2) % script.qaResponses.length];
            const rName = VIEWER_NAMES[Math.floor(Math.random() * VIEWER_NAMES.length)];
            if (q1) questionQueueRef.current.push({ question: q1.question, from: rName });
          }
        };

        // ── Dynamic pacing — simple and fast ──
        // Answer questions already queued, then bid. No long waits.
        const isFirstProduct = productIdx === 0;
        const pendingQCount  = questionQueueRef.current.length;

        // Max 1 Q&A group per product (30-45s max). First product gets 2 if questions waiting.
        const maxQAGroups = (isFirstProduct && pendingQCount >= 2) ? 2 : pendingQCount > 0 ? 1 : 0;

        if (pendingQCount > 0) {
          // Questions already waiting — answer them, then bid
          inOpenFloorRef.current = false;
          smartAnswerThenDo(maxQAGroups, openBidding);
        } else {
          // No questions — 1.5s window then straight to bidding (fast pacing)
          const floorInvite = config.language === 'hinglish'
            ? `${pName} ke liye koi sawaal? Jaldi pooch lo — bidding shuru hone waali hai!`
            : config.language === 'hindi'
            ? `${pName} के बारे में कोई सवाल?`
            : `Any quick questions about ${pName}? Ask now — bidding opens soon!`;

          openFloor(floorInvite, 1500, () => {
            smartAnswerThenDo(1, openBidding); // answer 1 real question if any arrived
          });
        }

      } else {
        // Outro — play it clean, no Q&A after (prevents echo from processAnswer overlap)
        // Stop engagement so nothing fires over the goodbye
        inOpenFloorRef.current = true;
        // Clear any pending questions — show ends, no time to answer
        if (questionQueueRef.current.length > 0) {
          addChat({ from:'system', name:'System', text:`Thanks for all the questions! See you next show.` });
          questionQueueRef.current = [];
        }
        // Just move to next (which hits idx >= segs.length and stops)
        setTimeout(() => {
          inOpenFloorRef.current = false;
          speakFromIndex(segIdxRef.current + 1);
        }, 800);
      }
    };

    // Stop current audio before starting new script segment
    stopAllSpeech();
    bidAnnQueue.current = [];
    bidAnnBusy.current  = false;

    // ── OUTRO: lock everything, wait for audio to settle, then play clean ──
    if (idx === segs.length - 1) {
      outroModeRef.current = true;  // BLOCKS all engagement, greetings, reactions
      stopAllSpeech();              // kill anything still playing
      bidAnnQueue.current  = [];
      bidAnnBusy.current   = false;

      // 500ms settle: any in-flight TTS requests will arrive and be discarded
      // by the cancellation token before we start the outro audio
      setTimeout(() => {
        if (!streamActiveRef.current) { outroModeRef.current = false; return; }
        speak(segs[idx].text, config.tone, config.language, rate, () => {
          if (!streamActiveRef.current) return;
          // Hard stop everything — show is over
          outroModeRef.current     = false;
          streamActiveRef.current  = false;
          bidAnnQueue.current      = [];
          bidAnnBusy.current       = false;
          questionQueueRef.current = [];
          inOpenFloorRef.current   = false;
          if (engagementRef.current)  clearInterval(engagementRef.current);
          if (chatRef.current)        clearInterval(chatRef.current);
          if (statsRef.current)       clearInterval(statsRef.current);
          if (warmupTimerRef.current) clearInterval(warmupTimerRef.current);
          setIsSpeaking(false);
        });
      }, 500);
      return; // don't fall through to speakNextChunk
    }

    // ── Option C: Chunked playback with mid-pitch Q&A injection ──
    // Split the segment into 2-sentence chunks. Between chunks, if a question
    // has been waiting, answer it briefly (1 sentence) then continue the pitch.
    const isProductSegChunk = idx >= 1 && idx <= segs.length - 2;
    const chunks = isProductSegChunk ? chunkSegment(segs[idx].text) : [segs[idx].text];
    let chunkIdx      = 0;
    let midAnswered   = 0;   // max 1 mid-pitch answer per segment (not disruptive)

    const speakNextChunk = () => {
      if (!streamActiveRef.current) return;

      // Mid-pitch Q&A: after every 2nd chunk, check for waiting questions
      // Only do this for product segments, and max once per segment
      if (
        isProductSegChunk &&
        chunkIdx > 0 &&
        chunkIdx % 2 === 0 &&
        midAnswered < 1 &&
        !answeringRef.current &&
        questionQueueRef.current.length > 0
      ) {
        midAnswered++;
        const { question, from } = questionQueueRef.current.shift()!;
        // Show "quick answer coming" in chat immediately
        addChat({ from:'system', name:'System', text:`💬 ${from} ne poocha — answering...` });
        // Answer using processAnswer (GPT-4o-mini, ~500ms), then continue pitch
        processAnswer(question, from, () => {
          if (!streamActiveRef.current) return;
          // Brief pause after mid-pitch answer, then continue pitch
          setTimeout(speakNextChunk, 1000);
        });
        return;
      }

      if (chunkIdx >= chunks.length) {
        onSegmentDone();
        return;
      }

      speak(chunks[chunkIdx++], config.tone, config.language, rate, speakNextChunk);
    };

    speakNextChunk();
  };

  /* Auto-scroll chat to bottom */
  useEffect(() => {
    if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
  }, [chatMessages]);

  /* Simulated viewer names + messages */
  const VIEWER_NAMES  = ['Ravi Kumar','Priya S','Amit_99','Sneha P','RohitFan','Kavya J','Deepak M','Ankita R','Vikram T','Meghna'];
  const COMMENTS      = ['🔥🔥🔥','WANT!!','❤️❤️','Bhejdo bhai!','Amazing!','Kya price hai!','🙌🙌','Dhamaka deal!','⚡⚡','Wah wah!','Love this!','SOLD!','🔥 Fire price'];
  const LIVE_QUESTIONS = [
    'Shipping kitni hogi?',
    'Is this authentic?',
    'Discount milega kya?',
    'COD available hai?',
    'Return policy kya hai?',
    'How long for delivery?',
    'Can I get a lower price?',
    'Kya yeh original hai?',
    'Size exchange hoga kya?',
    'Kab tak deliver hoga?',
  ];

  const addChat = (msg: Omit<ChatMsg,'id'>) =>
    setChatMessages(prev => [...prev.slice(-60), { ...msg, id: uid() }]);

  /* Chat history ref for conversational context */
  const chatHistoryRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);

  /* Which product is currently on screen */
  const getCurrentProductIndex = () => {
    const productSegIdx = segIdxRef.current - 1;
    return Math.max(0, Math.min(productSegIdx, products.filter(p => p.name && p.price).length - 1));
  };

  /* Core: generate + speak an answer, call onDone when finished */
  const processAnswer = async (question: string, fromName: string, onDone?: () => void) => {
    if (!streamActiveRef.current) { onDone?.(); return; }
    answeringRef.current = true;
    setIsAnswering(true);

    const thinkId = uid();
    setChatMessages(prev => [...prev, { id: thinkId, from:'ai', name:'AI Host', text:'💭 thinking...' }]);

    try {
      const answer = await answerLiveQuestion(
        question,
        products.filter(p => p.name && p.price),
        config,
        getCurrentProductIndex(),
        chatHistoryRef.current,
        fromName   // pass buyer name so AI addresses them directly
      );

      // Guard: stream may have been ended during the API call
      if (!streamActiveRef.current) {
        answeringRef.current = false;
        setIsAnswering(false);
        onDone?.();
        return;
      }

      chatHistoryRef.current = [
        ...chatHistoryRef.current.slice(-10),
        { role:'user',      content: question },
        { role:'assistant', content: answer   },
      ];

      const qType = getQuestionType(question);
      if (qType) answeredTypesRef.current.add(qType);

      setChatMessages(prev => prev.map(m => m.id === thinkId ? { ...m, text: answer } : m));

      // Stop ALL speech (Google TTS Audio + browser TTS) before speaking answer
      stopAllSpeech();
      speak(answer, config.tone, config.language, 1.0, () => {
        answeringRef.current = false;
        setIsAnswering(false);
        // Only continue the chain if stream is still active
        if (streamActiveRef.current) onDone?.();
      });
    } catch {
      setChatMessages(prev => prev.map(m => m.id === thinkId ? { ...m, text: `Great question! Let me get back to that after I show you this product!` } : m));
      answeringRef.current = false;
      setIsAnswering(false);
      if (streamActiveRef.current) onDone?.();
    }
  };

  /* Incoming message handler — runs the full filter pipeline */
  const handleIncomingMessage = (text: string, fromName: string) => {
    // 1. Banned user? Drop silently
    if (bannedUsersRef.current.has(fromName)) return;

    // 2. Check if it's a bid amount — handle BEFORE filter
    const bidAmount = parseBidAmount(text);
    if (bidAmount !== null && bidRoundRef.current?.active) {
      const br      = bidRoundRef.current;
      const minNext = br.currentBid + Math.max(100, Math.floor(br.currentBid * 0.02));

      if (bidAmount >= minNext) {
        const updated: BidRound = {
          ...br,
          currentBid:    bidAmount,
          currentBidder: fromName,
          history: [{ name: fromName, amount: bidAmount }, ...br.history].slice(0, 10),
        };
        setBidRound(updated);
        bidRoundRef.current = updated;
        setLiveBids(b => b + 1);

        addChat({ from:'viewer', name: fromName, text: `🔨 ₹${bidAmount.toLocaleString('en-IN')}` });
        // Use a short snappy line when the speech queue is already backed up
        const queueBusy = bidAnnQueue.current.length > 1;
        const outbidMsg = queueBusy
          ? `${fromName} — ₹${bidAmount.toLocaleString('en-IN')}!`
          : config.language === 'hinglish'
          ? `Wah! ${fromName} ne ₹${bidAmount.toLocaleString('en-IN')} lagayi! Beat karo!`
          : config.language === 'hindi'
          ? `${fromName} ने ₹${bidAmount.toLocaleString('en-IN')} की बोली लगाई! कोई और?`
          : `${fromName} bids ₹${bidAmount.toLocaleString('en-IN')}! Anyone higher?`;
        addChat({ from:'ai', name:'AI Host', text: outbidMsg });
        speakBid(outbidMsg);
      } else {
        // Too low — show exact minimum needed
        addChat({ from:'system', name:'System', text:`❌ ${fromName}: ₹${bidAmount.toLocaleString('en-IN')} rejected — minimum next bid is ₹${minNext.toLocaleString('en-IN')}` });
      }
      return;
    }

    // 2. Bad words? Ban + notify
    if (containsBadWords(text)) {
      bannedUsersRef.current.add(fromName);
      setBannedCount(n => n + 1);
      addChat({
        from: 'system',
        name: 'System',
        text: `🚫 ${fromName} was removed from chat for violating community guidelines.`,
      });
      return;
    }

    // 3. During active bidding — queue ALL questions, skip classification entirely
    // This prevents "pehle answer ho gaya" from wrongly firing during auction
    if (bidRoundRef.current?.active) {
      const looksLikeQuestion = /\?|kya|kaise|kitna|batao|ship|return|original|defect|price|quality|size|cod|invoice/i.test(text);
      addChat({ from:'viewer', name: fromName, text, isQuestion: looksLikeQuestion });
      if (looksLikeQuestion) {
        questionQueueRef.current.push({ question: text, from: fromName });
        addChat({ from:'system', name:'System', text:`✋ ${fromName} — great question! Answering right after bidding closes.` });
      }
      return;
    }

    // 3. Classify the message (only when NOT in a bid round)
    const priority = classifyMessage(text, answeredTypesRef.current);

    if (priority === 'block') {
      bannedUsersRef.current.add(fromName);
      setBannedCount(n => n + 1);
      addChat({ from:'system', name:'System', text:`🚫 ${fromName} was removed from chat.` });
      return;
    }

    if (priority === 'skip') {
      addChat({ from:'viewer', name: fromName, text });

      // ── INSTANT city/location reaction ──
      // When viewer replies with their city, respond IMMEDIATELY — no timer, no window.
      // This works anywhere in the stream, anytime someone says Delhi/Mumbai/etc.
      const cityPat = /delhi|mumbai|bangalore|bengaluru|hyderabad|chennai|kolkata|pune|jaipur|ahmedabad|surat|lucknow|noida|gurgaon|chandigarh|bhopal|indore|goa|kota|nagpur/i;
      if (cityPat.test(text) && !answeringRef.current && !bidRoundRef.current?.active && !outroModeRef.current) {
        const t = text.toLowerCase();
        let cityReact = '';
        if (config.language === 'hinglish') {
          if (/delhi/.test(t))                  cityReact = `Wah ${fromName}! Delhi se hain — dilli walon ka toh jawab hi nahi! Swagat hai show mein!`;
          else if (/mumbai/.test(t))             cityReact = `Arre ${fromName} Mumbai wale! Maximum city ka maximum swagat! Aap sab ka bahut shukriya!`;
          else if (/bangalore|bengaluru/.test(t)) cityReact = `${fromName} Bangalore se! Tech city ka smart buyer — welcome to the show!`;
          else if (/hyderabad/.test(t))          cityReact = `${fromName} Hyderabad se! Ek dum solid crowd hai aaj — swagat hai!`;
          else if (/chennai/.test(t))            cityReact = `${fromName} Chennai se! South India represent kar rahe ho — bahut achha!`;
          else {
            const cityMatch = text.match(cityPat);
            const city = cityMatch ? cityMatch[0] : 'wahan';
            cityReact = `${fromName} ${city} se — zabardast! Itni jagah se log dekh rahe hain, yeh show ke liye bahut khaas hai!`;
          }
        } else if (config.language === 'hindi') {
          cityReact = `${fromName} — आपका स्वागत है! बहुत खुशी हुई आपको यहाँ देखकर!`;
        } else {
          cityReact = `${fromName} is watching — welcome! Great to have you here!`;
        }
        if (cityReact) {
          addChat({ from:'ai', name:'AI Host', text: cityReact });
          // speakWhenReady retries until current audio finishes — city reactions ALWAYS get spoken
          speakWhenReady(cityReact);
          return;
        }
      }
      // React to specific hype phrases naturally — feels human
      if (Math.random() < 0.35 && !answeringRef.current && !bidRoundRef.current?.active && !inOpenFloorRef.current) {
        const t = text.toLowerCase();
        const curProd = products.filter(p => p.name && p.price)[Math.max(0, segIdxRef.current - 1)];
        const pName   = curProd?.name || 'yeh item';
        const pPrice  = curProd?.price || '';

        let reaction = '';
        if (/❤|love|dil|pyaar/.test(t))
          reaction = config.language === 'hinglish'
            ? `${fromName} ka love dekho! Shukriya yaar — aap sab ki wajah se yeh show itna mast hai!`
            : `${fromName}, thank you for the love — you guys make this show amazing!`;
        else if (/fire|🔥|dhamaka|zabardast|amazing|wah|wow/.test(t))
          reaction = config.language === 'hinglish'
            ? `${fromName} ne kaha dhamaka! Haan bhai, bilkul dhamaka hai — ${pName} ${pPrice ? pPrice + ' mein' : ''}! Aur koi nahi milega itna!`
            : `${fromName} said amazing — and you're right! ${pName} is an incredible deal today!`;
        else if (/want|chahiye|lena|buy|le lo/.test(t))
          reaction = config.language === 'hinglish'
            ? `${fromName} chahta hai! Bid lagao yaar, time mat waste karo — auction mein aa jao!`
            : `${fromName} wants it — then bid for it! Don't let someone else take it!`;
        else if (/sold|bik gaya|nikal gaya/.test(t))
          reaction = config.language === 'hinglish'
            ? `Haha ${fromName}! Abhi bika nahi hai — abhi bhi chance hai, bid lagao!`
            : `Not sold yet ${fromName}! You still have a chance — bid now!`;
        else if (/price|kitna|cost|rate/.test(t))
          reaction = config.language === 'hinglish'
            ? `${fromName} price pooch raha hai — ${pPrice || 'ekdum amazing price hai'}! Listing mein dekho aur bid lagao!`
            : `${fromName}, the price is ${pPrice || 'unbelievably good'} — check the listing and bid!`;

        if (reaction) {
          setTimeout(() => {
            if (!streamActiveRef.current) return;
            addChat({ from:'ai', name:'AI Host', text: reaction });
            // Only speak reaction if script is NOT currently playing
            // (avoids overlap — the text in chat is enough when script is playing)
            if (!isAnySpeechPending() && !bidAnnBusy.current) {
              speakBid(reaction, undefined, false); // non-priority
            }
          }, 1200);
        }
      }
      return;
    }

    if (priority === 'answered') {
      // Already answered this type — show comment but don't re-answer
      addChat({ from:'viewer', name: fromName, text, isQuestion: true });
    {
      const curProd = products.filter(p => p.name && p.price)[Math.max(0, segIdxRef.current - 1)];
      const prodName = curProd?.name || 'this item';
      const reply = config.language === 'hinglish'
        ? `${fromName} yaar, yeh toh pehle answer ho gaya! Scroll up dekho — abhi focus karo ${prodName} pe! 🔥`
        : config.language === 'hindi'
        ? `${fromName}, यह जवाब पहले दे चुका हूँ! ऊपर देखो — अभी ${prodName} पर ध्यान दो!`
        : `Already answered that one, ${fromName} — scroll up! Eyes on the ${prodName} right now! 👆`;
      addChat({ from:'ai', name:'AI Host', text: reply });
    }
      return;
    }

    // priority === 'answer' — genuine new question
    addChat({ from:'viewer', name: fromName, text, isQuestion: true });

    // Always queue — answered after current segment or mid-pitch (Option C)
    questionQueueRef.current.push({ question: text, from: fromName });

    if (bidRoundRef.current?.active) {
      addChat({ from:'system', name:'System', text:`✋ ${fromName} — great question! Answering right after bidding closes.` });
    } else if (isAnySpeechPending()) {
      // AI is speaking — instant visual acknowledgment so viewer knows they were heard
      const ack = config.language === 'hinglish'
        ? `✋ ${fromName} yaar — sawaal mila! Thoda rukko, pitch khatam ho rahi hai...`
        : config.language === 'hindi'
        ? `✋ ${fromName} — सवाल मिल गया! एक पल...`
        : `✋ Got your question ${fromName}! Finishing this point, answering in a moment...`;
      addChat({ from:'ai', name:'AI Host', text: ack });
    }
  };

  /* Viewer submits via input box */
  const handleViewerSend = () => {
    if (!viewerInput.trim()) return;
    const q = viewerInput.trim();
    setViewerInput('');
    handleIncomingMessage(q, 'You');
  };

  /* Minimum valid next bid (₹100 increment, or 2% — whichever is higher) */
  const getMinNextBid = (current: number) => current + Math.max(100, Math.floor(current * 0.02));

  /* Viewer places a bid via the bid button */
  const handlePlaceBid = () => {
    setBidError('');
    const br = bidRoundRef.current;
    if (!br?.active) { setBidError('No active bidding round.'); return; }

    const raw    = bidInput.replace(/[₹,\s]/g, '');
    const amount = parseFloat(raw);

    if (isNaN(amount) || amount <= 0) {
      setBidError('Please enter a valid bid amount.');
      return;
    }
    const minBid = getMinNextBid(br.currentBid);
    if (amount < minBid) {
      setBidError(`Minimum bid is ₹${minBid.toLocaleString('en-IN')} (current ₹${br.currentBid.toLocaleString('en-IN')} + ₹${minBid - br.currentBid} increment)`);
      return;
    }

    // Valid bid — process it as "You"
    const updated: BidRound = {
      ...br,
      currentBid:    amount,
      currentBidder: 'You',
      history: [{ name: 'You', amount }, ...br.history].slice(0, 10),
    };
    setBidRound(updated);
    bidRoundRef.current = updated;
    setLiveBids(b => b + 1);

    addChat({ from:'viewer', name:'You', text:`🔨 ₹${amount.toLocaleString('en-IN')}` });
    const msg = config.language === 'hinglish'
      ? `Wah! Aapne ₹${amount.toLocaleString('en-IN')} bid ki! Abhi aap lead kar rahe ho!`
      : config.language === 'hindi'
      ? `आपने ₹${amount.toLocaleString('en-IN')} की बोली लगाई! आप अभी आगे हैं!`
      : `You're winning at ₹${amount.toLocaleString('en-IN')}! Can anyone beat that?!`;
    addChat({ from:'ai', name:'AI Host', text: msg });
    speakBid(msg);
    setBidInput('');
  };

  /* ── Periodic audience engagement — AI reacts to chat and creates engagement moments ── */
  const engagementRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startEngagement = () => {
    if (engagementRef.current) clearInterval(engagementRef.current);

    const hinglishEngagements = [
      'Kitne log hain aaj? Drop ❤️ in chat!',
      'Mumbai, Delhi, Bangalore — kahan se dekh rahe ho? Comment karo!',
      'Yaar chat mein dekho — kitne log excited hain! Amazing!',
      'Agar yeh item pasand aaya toh "WANT" likho chat mein!',
      'Aaj ka show ekdum mast chal raha hai — aap sab ka shukriya!',
      'Naye log jo join kar rahe hain — swagat hai! Drop a 👋!',
      'Jaldi karo yaar — time kam hai aur items zyada kamaal hain!',
    ];
    const englishEngagements = [
      'Who\'s watching right now? Drop a ❤️ in chat!',
      'Where are you watching from? Comment your city!',
      'If you want this item, type "WANT" in the chat!',
      'Loving the energy today — you guys are amazing!',
      'New viewers joining — welcome! Give us a 👋!',
      'This is going fast — stay with me, more amazing items coming!',
    ];
    const hindiEngagements = [
      'कितने लोग हैं आज? ❤️ डालो chat में!',
      'कहाँ से देख रहे हैं? Comment करो!',
      'यह item चाहिए तो "WANT" लिखो!',
      'आप सब का बहुत शुक्रिया — मज़ा आ रहा है!',
    ];

    const engagements = config.language === 'hindi' ? hindiEngagements
      : config.language === 'english' ? englishEngagements
      : hinglishEngagements;

    let tick = 0;
    let lastViewerMsgCount = 0;

    engagementRef.current = setInterval(() => {
      tick++;
      if (!streamActiveRef.current) return;
      if (outroModeRef.current) return;    // outro playing — absolute silence
      if (bidRoundRef.current?.active) return;
      if (answeringRef.current) return;
      if (inOpenFloorRef.current) return;
      if (bidAnnBusy.current) return;
      if (isAnySpeechPending()) return;

      // Check if new viewer messages came in since last engagement
      const viewerMsgs = chatMessages.filter(m => m.from === 'viewer');
      const newMsgCount = viewerMsgs.length;
      const hasNewActivity = newMsgCount > lastViewerMsgCount;
      lastViewerMsgCount = newMsgCount;

      let msg = '';

      if (hasNewActivity && viewerMsgs.length > 0) {
        // React to the most recent viewer message
        const latest = viewerMsgs[viewerMsgs.length - 1];
        const curProd = products.filter(p => p.name && p.price)[Math.max(0, segIdxRef.current - 1)];
        const pName   = curProd?.name || 'yeh item';

        if (config.language === 'hinglish')
          msg = `${latest.name} aur baaki sab — chat ekdum live hai aaj! ${pName} ke liye exciting hai na? Bid round aa raha hai jaldi!`;
        else if (config.language === 'hindi')
          msg = `${latest.name} और सबका जवाब देख रहा हूँ — कमाल है! जल्दी bid round आने वाला है!`;
        else
          msg = `${latest.name} and everyone in chat — the energy today is incredible! Bid round coming up fast!`;
      } else {
        // No new activity — use a canned engagement prompt
        msg = engagements[tick % engagements.length];
      }

      addChat({ from: 'ai', name: 'AI Host', text: `💬 ${msg}` });
      // Only speak if idle — engagement NEVER interrupts the script
      // Message is already visible in chat, so silence is fine when script is playing
      if (!isAnySpeechPending() && !bidAnnBusy.current) {
        speakBid(msg, undefined, false); // non-priority
      }
    }, 30000);
  };

  /* Start simulated live chat */
  const startChatSimulation = () => {
    let tick = 0;
    chatRef.current = setInterval(() => {
      tick++;
      const name = VIEWER_NAMES[Math.floor(Math.random() * VIEWER_NAMES.length)];
      if (tick % 10 === 0) {
        // Inject a question every ~10 ticks
        const q = LIVE_QUESTIONS[Math.floor(Math.random() * LIVE_QUESTIONS.length)];
        handleIncomingMessage(q, name);
      } else {
        // Regular hype comment
        const comment = COMMENTS[Math.floor(Math.random() * COMMENTS.length)];
        addChat({ from:'viewer', name, text: comment });
        // During warm-up: greet new viewers as they appear
        greetNewViewer(name);
        handleIncomingMessage(comment, name);
      }
    }, 3500);
  };

  /* Start stats ticker */
  const startStats = () => {
    setLiveViewers(0); setLiveBids(0); setLiveRevenue(0);
    statsRef.current = setInterval(() => {
      setLiveViewers(v => v + (Math.random() > 0.5 ? 1 : 0));
      if (Math.random() > 0.72) setLiveBids(b => b + 1);
      if (Math.random() > 0.78) setLiveRevenue(r => r + Math.floor(Math.random() * 800 + 200));
    }, 1800);
  };

  /* ── Speak when ready: retries until current audio finishes, then speaks ──
     Used for reactions/greetings that must be heard, not silently dropped ── */
  const speakWhenReady = (text: string, retries = 10) => {
    if (!streamActiveRef.current || outroModeRef.current) return;
    if (isAnySpeechPending() && retries > 0) {
      setTimeout(() => speakWhenReady(text, retries - 1), 600);
      return;
    }
    if (!isAnySpeechPending()) {
      speak(text, config.tone, config.language, 0.9);
    }
  };

  /* ── Payment confirmation window after bid ends ──
     20 seconds for buyer to confirm UPI/card payment.
     Live countdown with spoken reminders.
     If confirmed → proceed to next product.
     If timeout → re-auction the same product immediately. ── */
  const paymentTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPaymentWindow = (
    winner:     string,
    product:    string,
    amount:     number,
    prodIdx:    number,
    reAuctionAttempt = 0,
  ) => {
    const SECS = 20;
    let confirmed = false;
    const lang = config.language;
    // Save the original "move to next product" callback BEFORE any re-auction call might overwrite it
    const originalCallback = bidCallbackRef.current;

    // Announce the payment window
    const announce = lang === 'hinglish'
      ? `${winner} ne jeeta! ${winner} ke paas 20 seconds hain payment confirm karne ke liye! UPI walon ko phone pe notification aayega — approve karo! Card walon ko OTP enter karna hoga. Jaldi karo!`
      : lang === 'hindi'
      ? `${winner} ने जीता! 20 सेकंड में payment confirm करो — UPI notification approve करो या OTP enter करो!`
      : `${winner} won! You have 20 seconds to confirm payment — UPI users approve the notification, card users enter your OTP. Hurry!`;

    addChat({ from:'system', name:'System', text: `💳 Payment window: ${winner} has 20 seconds to confirm payment for ${product}` });
    speak(announce, config.tone, lang, 0.95);

    // Subscribe to payment confirmation from buyer app
    const unsubPayment = LiveSessionService.subscribePaymentConfirmed((w, p) => {
      if ((w === winner || w === 'You') && !confirmed) {
        confirmed = true;
        if (paymentTimerRef.current) clearInterval(paymentTimerRef.current);
        unsubPayment();

        // Payment is CONFIRMED — NOW it is truly sold. Add here, not on bid-win.
        setSoldItems(s => [...s, { name: product, winner, amount }]);
        LiveSessionService.recordAIAuctionWin(product, winner, amount, undefined);

        const confirmMsg = lang === 'hinglish'
          ? `Payment confirm ho gaya! ${winner} ka order process ho raha hai — bahut bahut badhai!`
          : lang === 'hindi'
          ? `Payment confirmed! ${winner} का order process हो रहा है!`
          : `Payment confirmed! ${winner}'s order is being processed. Congratulations!`;
        addChat({ from:'system', name:'System', text: `✅ ${confirmMsg}` });
        speak(confirmMsg, config.tone, lang, 0.95, () => {
          if (streamActiveRef.current) setTimeout(() => originalCallback?.(), 800);
        });
      }
    });

    let secs = SECS;
    if (paymentTimerRef.current) clearInterval(paymentTimerRef.current);
    paymentTimerRef.current = setInterval(() => {
      if (confirmed) { clearInterval(paymentTimerRef.current!); return; }
      secs--;

      if (secs === 10) {
        const remind = lang === 'hinglish'
          ? `${winner} — sirf 10 seconds bacha hai! Abhi confirm karo!`
          : `${winner} — 10 seconds! Confirm now!`;
        addChat({ from:'ai', name:'AI Host', text: `⏰ ${remind}` });
        speakBid(remind, undefined, false);
      }

      if (secs === 5) {
        const five = lang === 'hinglish'
          ? `5 seconds! ${winner} abhi nahi toh choot jaayega!`
          : `5 seconds left!`;
        addChat({ from:'ai', name:'AI Host', text: `⏰ ${five}` });
        speakBid(five, undefined, false);
      }

      if (secs <= 0) {
        clearInterval(paymentTimerRef.current!);
        unsubPayment();
        if (!confirmed) {
          // Payment timed out → re-auction
          const maxAttempts = 1; // re-auction once, then move on
          if (reAuctionAttempt < maxAttempts) {
            const rebid = lang === 'hinglish'
              ? `${winner} ne time pe confirm nahi kiya! ${product} dobara bid mein ja raha hai — abhi! Bidding re-open!`
              : lang === 'hindi'
              ? `Payment timeout! ${product} फिर से bid पर — अभी!`
              : `Payment timeout from ${winner}! ${product} is going back to auction right now!`;
            addChat({ from:'system', name:'System', text: `⚠️ Payment timeout — re-auctioning ${product}!` });
            speak(rebid, config.tone, lang, 0.95, () => {
              if (!streamActiveRef.current) return;
              // Re-auction the same product; after it ends, check if new winner confirmed
              startBidRound(prodIdx, () => {
                const cur2 = bidRoundRef.current;
                if (cur2?.currentBidder) {
                  startPaymentWindow(cur2.currentBidder, product, cur2.currentBid, prodIdx, reAuctionAttempt + 1);
                } else {
                  originalCallback?.(); // no new winner — move to next product
                }
              });
            });
          } else {
            // Max re-auctions reached — move on
            const moveOn = lang === 'hinglish'
              ? `Koi baat nahi! ${product} pass ho gaya. Chalo agle item ki taraf!`
              : `Moving on from ${product}. Next item coming up!`;
            addChat({ from:'system', name:'System', text: `⏭ Moving to next item` });
            speak(moveOn, config.tone, lang, 0.95, () => {
              if (streamActiveRef.current) originalCallback?.();
            });
          }
        }
      }
    }, 1000);
  };

  /* ── Warm-up: greet early joiners, build audience, NO product reveals ── */
  const startWarmup = () => {
    greetedViewers.current = new Set();
    setWarmupActive(true);
    warmupActiveRef.current = true;
    setWarmupSecs(warmupDuration);

    // Opening line — NO product names or prices, just build excitement
    const openLine = config.language === 'hinglish'
      ? `Hey hey hey! ${config.sellerName ? config.sellerName + ' yahan' : 'Main yahan'} — kya haal hai sab ka! Show ${warmupDuration >= 60 ? `${Math.round(warmupDuration/60)} minute` : `${warmupDuration} second`} mein shuru hoga! Tab tak — kahan se dekh rahe ho? Chat mein batao! ❤️`
      : config.language === 'hindi'
      ? `नमस्ते सब! Show जल्दी शुरू होगा! Chat में बताओ कहाँ से देख रहे हो! ❤️`
      : `Hey everyone! Show starts soon — drop a ❤️ and tell me where you're watching from!`;

    addChat({ from:'ai', name:'AI Host', text: openLine });
    speak(openLine, config.tone, config.language, 0.9);

    let timeLeft = warmupDuration;
    warmupTimerRef.current = setInterval(() => {
      if (!streamActiveRef.current) { clearInterval(warmupTimerRef.current!); return; }
      timeLeft--;
      setWarmupSecs(timeLeft);

      // Countdown callouts at key moments
      if (timeLeft === Math.floor(warmupDuration / 2)) {
        const mid = config.language === 'hinglish'
          ? `Aur ${timeLeft} seconds baaki hain! Jo nahi aaye unhe batao — show shuru hone waala hai!`
          : `${timeLeft} seconds to go! Tell your friends — show is about to start!`;
        addChat({ from:'ai', name:'AI Host', text: `⏰ ${mid}` });
        if (!isAnySpeechPending()) speakBid(mid, undefined, false);
      }
      if (timeLeft === 10) {
        const ten = config.language === 'hinglish'
          ? `10 seconds! Ready ho jao — items dekhne wale hain aaj jo pehle kabhi nahi dekha!`
          : `10 seconds! Get ready — you're about to see some amazing items!`;
        addChat({ from:'ai', name:'AI Host', text: `🔥 ${ten}` });
        // Don't interrupt an ongoing Q&A answer — chat message is enough if speaking
        if (!isAnySpeechPending()) speakBid(ten);
      }

      if (timeLeft <= 0) {
        clearInterval(warmupTimerRef.current!);
        setWarmupActive(false);

        // Cancel ONLY queued bid announcements — do NOT hard-stop current speech.
        // Hard-stopping here would cut an ongoing Q&A answer mid-sentence.
        bidAnnQueue.current = [];
        bidAnnBusy.current  = false;

        const startLine = config.language === 'hinglish'
          ? `Theek hai yaar! Bahut saare log aa gaye — ab shuruaat karte hain! Ready ho jao!`
          : config.language === 'hindi'
          ? `अब शुरू करते हैं! तैयार रहो!`
          : `Alright, we're starting now! Get ready!`;

        /* Wait for any in-progress speech to finish naturally before transitioning.
           Maximum wait: 6 seconds — then we cut regardless to avoid dead air.     */
        const beginShow = () => {
          if (!streamActiveRef.current) return;
          addChat({ from:'ai', name:'AI Host', text: startLine });
          stopAllSpeech(); // safe now: we're immediately replacing with start line
          setTimeout(() => {
            if (!streamActiveRef.current) return;
            speak(startLine, config.tone, config.language, 0.95, () => {
              if (streamActiveRef.current) speakFromIndex(0);
            });
          }, 200);
        };

        if (isAnySpeechPending()) {
          let waited = 0;
          const poll = setInterval(() => {
            waited++;
            if (!streamActiveRef.current || !isAnySpeechPending() || waited >= 6) {
              clearInterval(poll);
              beginShow();
            }
          }, 1000);
        } else {
          beginShow();
        }
      }
    }, 1000);
  };

  // Ref so greetNewViewer always has the current warmup state (avoids stale closure)
  const warmupActiveRef = useRef(false);
  useEffect(() => { warmupActiveRef.current = warmupActive; }, [warmupActive]);

  /* Greet a viewer joining the warm-up — different response for each person */
  const greetNewViewer = (name: string) => {
    if (greetedViewers.current.has(name) || name === 'System' || !warmupActiveRef.current || outroModeRef.current) return;
    greetedViewers.current.add(name);

    const count = greetedViewers.current.size; // how many have joined so far
    const H = config.language === 'hindi';
    const E = config.language === 'english';

    // Rotate through different greetings based on join order
    const greetings = H ? [
      `${name} — स्वागत है! बहुत अच्छा समय आए हो!`,
      `अरे ${name}! आप आ गए — कमाल! Show जल्दी शुरू होगा!`,
      `${name} जी नमस्ते! आज का show बहुत ख़ास है!`,
      `वाह! ${name} भी आ गए — crowd बढ़ रहा है!`,
      `${name} — बहुत खुशी हुई! तैयार रहो आज के items के लिए!`,
    ] : E ? [
      `${name} just joined — welcome! You're in for a great show today!`,
      `Hey ${name}! Glad you're here — show starts very soon!`,
      `${name} made it! Today's items are going to blow your mind.`,
      `Welcome ${name}! The crowd is building up — exciting stuff coming!`,
      `${name} is in the house! Get ready for something special!`,
    ] : [
      `${name} aa gaye! Yaar ekdum sahi time pe ho — show jald shuru hoga!`,
      `Arre ${name}! Swagat hai bhai — aaj ka show ekdum dhamaka hoga!`,
      `${name} ji namaste! Aap aa gaye — crowd ekdum solid ho raha hai!`,
      `Wah ${name}! Aur log bhi join kar rahe hain — maza aayega aaj!`,
      `${name} bhai aa gaye! Kya baat hai — aaj kuch aisa dikhaunga jo pehle nahi dekha!`,
      `Dekho ${name} bhi aa gaye! Ready raho — show mein kuch zabardast hai aaj!`,
    ];

    // Special extra-warm greeting for first 3 joiners
    const greeting = count <= 3
      ? greetings[count - 1] ?? greetings[0]
      : greetings[Math.floor(Math.random() * greetings.length)];

    addChat({ from:'ai', name:'AI Host', text: greeting });
    speakWhenReady(greeting);
  };

  /* Launch the stream */
  const handleLaunch = () => {
    if (streamActiveRef.current || launched) return; // prevent double-fire / restart
    streamActiveRef.current = true;
    setLaunched(true);
    setChatMessages([]);
    startStats();
    startChatSimulation();
    startEngagement();
    // Start warm-up phase first — then auto-transitions to the actual script
    startWarmup();

    // Register this AI stream as a live show in the backend so buyers can see it
    const validProds = products.filter(p => p.name && p.price);
    const title = config.sellerName
      ? `${config.sellerName}'s Live Show — ${new Date().toLocaleDateString('en-IN')}`
      : `Live Show — ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;

    // Start the LiveSessionService so buyers can subscribe
    LiveSessionService.startSession();

    createShow({
      title,
      category:       'General',
      isLive:         true,
      sellerUsername: config.sellerName || 'Seller',
      description:    validProds.map(p => p.name).filter(Boolean).join(', '),
      scheduled_time: new Date().toISOString(),
    }).then(show => {
      liveShowIdRef.current = show.id;
      LiveSessionService.setBackendShow(show.id);
      // Signal all tabs in this browser + App.tsx to refresh show list
      window.dispatchEvent(new CustomEvent('anyandall:showsChanged'));
    }).catch(err => {
      console.warn('Could not register live show in backend:', err);
      // Even if backend fails, buyers on the same device can still see the stream
    });
  };

  /* End stream */
  const handleEndStream = () => {
    // Kill-switch FIRST — stops all in-flight callbacks from restarting speech
    streamActiveRef.current  = false;
    bidCallbackRef.current   = null;

    // Mark the backend show as not live so it disappears from buyer feed
    if (liveShowIdRef.current) {
      setShowLive(liveShowIdRef.current, false).catch(() => {});
      liveShowIdRef.current = null;
    }
    LiveSessionService.stopSession();
    window.dispatchEvent(new CustomEvent('anyandall:showsChanged'));

    // stopAllSpeech cancels BOTH browser TTS and any active Audio element (Google/Azure/ElevenLabs)
    stopAllSpeech();
    if (statsRef.current)       clearInterval(statsRef.current);
    if (chatRef.current)         clearInterval(chatRef.current);
    if (bidTimerRef.current)     clearInterval(bidTimerRef.current);
    if (engagementRef.current)   clearInterval(engagementRef.current);
    if (warmupTimerRef.current)  clearInterval(warmupTimerRef.current);
    if (paymentTimerRef.current) clearInterval(paymentTimerRef.current);
    setWarmupActive(false);
    answeringRef.current     = false;
    inOpenFloorRef.current   = false;
    outroModeRef.current     = false;
    bidEndHandledRef.current = false;
    chatHistoryRef.current   = [];
    questionQueueRef.current = [];
    bannedUsersRef.current   = new Set();
    answeredTypesRef.current = new Set();
    bidRoundRef.current      = null;
    bidAnnQueue.current      = [];
    bidAnnBusy.current       = false;
    setIsSpeaking(false);
    setIsAnswering(false);
    setLaunched(false);
    setCurrentSegIdx(0);
    segIdxRef.current = 0;
    setChatMessages([]);
    setBannedCount(0);
    setBidRound(null);
    setSoldItems([]);
  };

  /* Pause / Resume */
  const handlePauseResume = () => {
    if (isPaused) { resumeAllSpeech(); setIsPaused(false); }
    else          { pauseAllSpeech();  setIsPaused(true);  }
  };

  /* Skip to next segment */
  const handleSkip = () => { stopAllSpeech(); speakFromIndex(segIdxRef.current + 1); };

  /* Cleanup on unmount */
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (statsRef.current) clearInterval(statsRef.current);
      if (chatRef.current)  clearInterval(chatRef.current);
    };
  }, []);

  const addProduct = () => {
    if (products.length >= 10) return;
    setProducts(p => [...p, { id: uid(), name: '', price: '', description: '', keyPoints: ['', ''],
      brand: '', color: '', material: '', size: '', condition: undefined, defects: '', mrp: '', hasInvoice: false,
      photos: [], aiVerified: false }]);
  };
  const updateProduct = (id: string, updated: Product) => setProducts(p => p.map(x => x.id === id ? updated : x));
  const removeProduct = (id: string) => setProducts(p => p.filter(x => x.id !== id));

  const handleGenerate = async () => {
    setGenerating(true); setError('');
    try {
      const result = await generateLiveScript(products.filter(p => p.name && p.price), config);
      setScript(result);
      setStep(2);
    } catch (e: any) {
      const msg = e?.message || String(e);
      console.error('Script generation error:', msg);
      setError(`Script generation failed: ${msg.slice(0, 120)}`);
    }
    finally { setGenerating(false); }
  };

  /* ════════ STEP 0 — Products ════════ */
  const renderProducts = () => (
    <div>
      <h2 style={{ fontSize:'1.5rem', fontWeight:700, color:'#1B3A6B', margin:'0 0 6px' }}>Add Your Products</h2>
      <p style={{ color:'#4A7AB5', fontSize:14, marginBottom:28 }}>Upload up to 6 products you want to sell today.</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:18, marginBottom:24 }}>
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i}
            onUpdate={updated => updateProduct(p.id, updated)}
            onRemove={() => removeProduct(p.id)}
          />
        ))}
        {products.length < 10 && (
          <button onClick={addProduct}
            style={{ minHeight:200, border:'2px dashed rgba(43,108,184,0.25)', borderRadius:20, background:'rgba(43,108,184,0.03)', color:'#4A7AB5', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, transition:'all 150ms' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#2B6CB8';e.currentTarget.style.background='rgba(43,108,184,0.06)';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(43,108,184,0.25)';e.currentTarget.style.background='rgba(43,108,184,0.03)';}}>
            <span style={{ fontSize:32 }}>＋</span>
            <span style={{ fontSize:13, fontWeight:600 }}>Add Product</span>
          </button>
        )}
      </div>
      <button
        onClick={() => setStep(1)}
        disabled={!products.some(p => p.name && p.price)}
        style={{ padding:'13px 32px', borderRadius:100, background: products.some(p=>p.name&&p.price) ? 'linear-gradient(135deg,#2B6CB8,#1A4B8C)' : 'rgba(43,108,184,0.2)', color:'white', fontWeight:700, fontSize:14, border:'none', cursor: products.some(p=>p.name&&p.price) ? 'pointer' : 'not-allowed', boxShadow: products.some(p=>p.name&&p.price) ? '0 5px 20px rgba(43,108,184,0.38)' : 'none' }}
      >
        Next: Configure Avatar →
      </button>
    </div>
  );

  /* ── Voice recording helpers ── */
  const startRecording = async () => {
    setCloneError('');
    setAudioBlob(null);
    recChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec    = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecRef.current = rec;
      rec.ondataavailable = e => { if (e.data.size > 0) recChunksRef.current.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(recChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setIsRecording(false);
        if (recTimerRef.current) clearInterval(recTimerRef.current);
      };
      rec.start();
      setIsRecording(true);
      setRecordingSecs(0);
      recTimerRef.current = setInterval(() => setRecordingSecs(s => s + 1), 1000);
    } catch (e: any) {
      setCloneError('Microphone access denied. Please allow microphone in browser settings.');
    }
  };

  const stopRecording = () => {
    mediaRecRef.current?.stop();
    if (recTimerRef.current) clearInterval(recTimerRef.current);
  };

  const handleCloneVoice = async () => {
    if (!audioBlob) return;
    setCloning(true);
    setCloneError('');
    try {
      await cloneVoice(audioBlob, config.sellerName || 'Seller');
      setVoiceCloned(true);
      setAudioBlob(null);
    } catch (e: any) {
      setCloneError(e.message || 'Voice cloning failed. Check your ElevenLabs API key.');
    }
    setCloning(false);
  };

  const handleRemoveClone = () => {
    setClonedVoice(null);
    setVoiceCloned(false);
    setAudioBlob(null);
  };

  /* ════════ STEP 1 — Avatar Config ════════ */
  const renderAvatar = () => (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ fontSize:'1.5rem', fontWeight:700, color:'#1B3A6B', margin:'0 0 6px' }}>Configure Your AI Avatar</h2>
      <p style={{ color:'#4A7AB5', fontSize:14, marginBottom:28 }}>Set your name, language, and presenting style.</p>
      <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:'#4A7AB5', letterSpacing:'0.07em', textTransform:'uppercase', display:'block', marginBottom:8 }}>Your Name / Store Name</label>
          <input
            placeholder="e.g. Sneaker Vault, Rahul's Collectibles"
            value={config.sellerName}
            onChange={e => setConfig(c => ({ ...c, sellerName: e.target.value }))}
            style={{ width:'100%', padding:'12px 16px', borderRadius:12, border:'1.5px solid rgba(43,108,184,0.2)', fontSize:14, color:'#1B3A6B', outline:'none', boxSizing:'border-box' }}
          />
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:'#4A7AB5', letterSpacing:'0.07em', textTransform:'uppercase', display:'block', marginBottom:10 }}>Stream Language</label>
          <div style={{ display:'flex', gap:10 }}>
            {LANGS.map(l => (
              <button key={l.value} onClick={() => setConfig(c=>({...c, language:l.value}))}
                style={{ flex:1, padding:'12px 10px', borderRadius:12, border: config.language===l.value ? '2px solid #2B6CB8' : '1.5px solid rgba(43,108,184,0.18)', background: config.language===l.value ? 'rgba(43,108,184,0.1)' : 'white', color:'#1B3A6B', fontWeight:700, fontSize:14, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <span style={{ fontSize:22 }}>{l.flag}</span>
                <span style={{ fontSize:12 }}>{l.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:'#4A7AB5', letterSpacing:'0.07em', textTransform:'uppercase', display:'block', marginBottom:10 }}>Presenting Style</label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {TONES.map(t => (
              <button key={t.value} onClick={() => setConfig(c=>({...c, tone:t.value}))}
                style={{ padding:'14px 16px', borderRadius:14, border: config.tone===t.value ? '2px solid #2B6CB8' : '1.5px solid rgba(43,108,184,0.18)', background: config.tone===t.value ? 'rgba(43,108,184,0.08)' : 'white', textAlign:'left', cursor:'pointer' }}>
                <div style={{ fontSize:22, marginBottom:4 }}>{t.emoji}</div>
                <div style={{ fontWeight:700, fontSize:13, color:'#1B3A6B', marginBottom:2 }}>{t.label}</div>
                <div style={{ fontSize:11, color:'#4A7AB5' }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>
        {/* Voice quality panel */}
        <div style={{ borderRadius:14, overflow:'hidden', border:'1px solid rgba(43,108,184,0.2)' }}>
          {/* Active voice status */}
          <div style={{ padding:'14px 18px', background: (hasGoogleTTS() || hasAzureTTS() || hasElevenLabs()) ? 'linear-gradient(135deg,rgba(22,163,74,0.08),rgba(16,185,129,0.06))' : 'rgba(43,108,184,0.04)', borderBottom:'1px solid rgba(43,108,184,0.12)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:22 }}>{(hasGoogleTTS() || hasAzureTTS() || hasElevenLabs()) ? '✅' : '⚠️'}</span>
              <div>
                <div style={{ fontSize:12, fontWeight:800, color: (hasGoogleTTS() || hasAzureTTS() || hasElevenLabs()) ? '#16a34a' : '#92400e', marginBottom:2 }}>
                  {hasGoogleTTS() ? 'Google Neural Voice Active — Human Quality' : hasAzureTTS() ? 'Azure Neural Voice Active — Human Quality' : hasElevenLabs() ? 'ElevenLabs Voice Active — Human Quality' : 'Browser Voice Active — Sounds Robotic'}
                </div>
                <div style={{ fontSize:11, color:'#4A7AB5' }}>{getActiveVoiceLabel()}</div>
              </div>
            </div>
          </div>

          {/* Setup instructions — only shown when no cloud TTS is configured */}
          {!hasGoogleTTS() && !hasAzureTTS() && !hasElevenLabs() && (
            <div style={{ padding:'14px 18px', background:'rgba(251,191,36,0.06)', borderBottom:'1px solid rgba(43,108,184,0.1)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <span style={{ fontSize:16 }}>☁️</span>
                <p style={{ fontSize:12, color:'#92400e', margin:0, fontWeight:800 }}>
                  Recommended: Google Cloud TTS — 1,000,000 chars FREE/month
                </p>
              </div>
              <ol style={{ fontSize:12, color:'#78350f', margin:'0 0 8px', paddingLeft:18, lineHeight:2 }}>
                <li>Go to <strong>console.cloud.google.com</strong> → sign in with Google</li>
                <li>Search <strong>"Text to Speech"</strong> → Enable the API</li>
                <li>Left sidebar → <strong>Credentials</strong> → Create Credentials → <strong>API Key</strong></li>
                <li>
                  Add to <code style={{ background:'rgba(0,0,0,0.07)', padding:'1px 5px', borderRadius:4 }}>.env.local</code>:
                  <div style={{ background:'rgba(0,0,0,0.06)', borderRadius:6, padding:'6px 10px', marginTop:4, fontFamily:'monospace', fontSize:11 }}>
                    VITE_GOOGLE_TTS_KEY=your_key_here
                  </div>
                </li>
                <li>Restart dev server — voice upgrades automatically ✅</li>
              </ol>
              <p style={{ fontSize:11, color:'#92400e', margin:'4px 0 0', fontStyle:'italic' }}>
                Free tier: 1 million chars/month ≈ 120+ live shows. Basically unlimited for any indie seller.
              </p>
            </div>
          )}

          {/* ── Voice Cloning ── */}
          <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(43,108,184,0.1)', background: voiceCloned ? 'rgba(22,163,74,0.05)' : 'rgba(43,108,184,0.03)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:18 }}>🎤</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:800, color: voiceCloned ? '#16a34a' : '#1B3A6B' }}>
                    {voiceCloned ? '✅ Your Voice Cloned — AI speaks as you!' : 'Clone Your Voice'}
                  </div>
                  <div style={{ fontSize:11, color:'#4A7AB5' }}>
                    {voiceCloned ? 'AI uses your cloned voice for the entire stream' : 'Record 45s → AI speaks in your actual voice'}
                  </div>
                </div>
              </div>
              {voiceCloned && (
                <button onClick={handleRemoveClone} style={{ fontSize:11, color:'#dc2626', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Remove</button>
              )}
            </div>

            {!hasElevenLabs() && !voiceCloned && (
              <div style={{ fontSize:11, color:'#92400e', background:'rgba(251,191,36,0.1)', borderRadius:8, padding:'6px 10px' }}>
                ⚠️ Add <code style={{ background:'rgba(0,0,0,0.07)', padding:'1px 4px', borderRadius:3 }}>VITE_ELEVENLABS_API_KEY</code> to .env.local to enable voice cloning
              </div>
            )}

            {hasElevenLabs() && !voiceCloned && (
              <>
                {/* Recording script */}
                {!isRecording && !audioBlob && (
                  <div style={{ background:'rgba(43,108,184,0.06)', borderRadius:10, padding:'10px 12px', marginBottom:10, fontSize:11, color:'#1B3A6B', lineHeight:1.8, fontStyle:'italic' }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'#4A7AB5', marginBottom:5, fontStyle:'normal' }}>📜 READ THIS ALOUD when recording:</div>
                    "Hello everyone! Welcome to my live show on Any & All. Today I have some amazing products lined up for you — things I personally picked and verified. This item is in great condition, bilkul original hai. The price is incredible — don't miss this deal! Bidding starts now, abhi bid lagao! Thank you for watching, see you in the next show!"
                  </div>
                )}

                {/* Timer + waveform during recording */}
                {isRecording && (
                  <div style={{ background:'rgba(220,38,38,0.06)', borderRadius:10, padding:'12px', marginBottom:10, textAlign:'center', border:'1.5px solid rgba(220,38,38,0.2)' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:8 }}>
                      <div style={{ width:10, height:10, borderRadius:'50%', background:'#dc2626', animation:'pulse2 0.8s ease-in-out infinite' }} />
                      <span style={{ fontWeight:800, color:'#dc2626', fontSize:14 }}>Recording... {recordingSecs}s</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:3, height:24 }}>
                      {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} style={{ width:3, borderRadius:2, background:'#dc2626', height: Math.random() * 20 + 4, animation:`wave ${0.5 + i * 0.06}s ease-in-out infinite alternate` }} />
                      ))}
                    </div>
                    <div style={{ fontSize:11, color:'#9ca3af', marginTop:6 }}>Aim for 45–60 seconds for best quality</div>
                  </div>
                )}

                {/* Recorded — ready to clone */}
                {audioBlob && !isRecording && (
                  <div style={{ background:'rgba(22,163,74,0.06)', borderRadius:10, padding:'10px 12px', marginBottom:10, border:'1px solid rgba(22,163,74,0.2)' }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#16a34a', marginBottom:4 }}>✅ {recordingSecs}s recorded — ready to clone!</div>
                    <audio src={URL.createObjectURL(audioBlob)} controls style={{ width:'100%', height:32 }} />
                  </div>
                )}

                {cloneError && (
                  <div style={{ fontSize:11, color:'#dc2626', background:'rgba(254,242,242,0.8)', borderRadius:8, padding:'6px 10px', marginBottom:8 }}>{cloneError}</div>
                )}

                <div style={{ display:'flex', gap:8 }}>
                  {!isRecording && !audioBlob && (
                    <button onClick={startRecording} style={{ flex:1, padding:'9px', borderRadius:10, background:'linear-gradient(135deg,#dc2626,#b91c1c)', color:'white', fontWeight:700, fontSize:12, border:'none', cursor:'pointer' }}>
                      🎙️ Start Recording
                    </button>
                  )}
                  {isRecording && (
                    <button onClick={stopRecording} style={{ flex:1, padding:'9px', borderRadius:10, background:'rgba(220,38,38,0.1)', color:'#dc2626', fontWeight:700, fontSize:12, border:'1.5px solid rgba(220,38,38,0.3)', cursor:'pointer' }}>
                      ⏹ Stop Recording
                    </button>
                  )}
                  {audioBlob && !isRecording && (
                    <>
                      <button onClick={() => { setAudioBlob(null); setRecordingSecs(0); }} style={{ padding:'9px 14px', borderRadius:10, background:'rgba(43,108,184,0.08)', color:'#2B6CB8', fontWeight:700, fontSize:12, border:'1.5px solid rgba(43,108,184,0.2)', cursor:'pointer' }}>
                        🔄 Re-record
                      </button>
                      <button onClick={handleCloneVoice} disabled={cloning} style={{ flex:1, padding:'9px', borderRadius:10, background: cloning ? 'rgba(43,108,184,0.2)' : 'linear-gradient(135deg,#2B6CB8,#1A4B8C)', color:'white', fontWeight:700, fontSize:12, border:'none', cursor: cloning ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                        {cloning ? <><span style={{ width:12, height:12, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.8s linear infinite', display:'inline-block' }} /> Cloning...</> : '🧬 Clone My Voice'}
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Digital twin teaser */}
          <div style={{ padding:'12px 18px', background:'linear-gradient(135deg,rgba(10,18,32,0.94),rgba(13,24,40,0.94))' }}>
            <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <span style={{ fontSize:20 }}>🎭</span>
              <div>
                <p style={{ color:'white', fontWeight:700, fontSize:12, margin:'0 0 3px' }}>Digital Twin — Coming Soon</p>
                <p style={{ color:'rgba(255,255,255,0.45)', fontSize:11, margin:0, lineHeight:1.6 }}>
                  Record 2 mins once → your face & voice cloned forever. <span style={{ color:'#7BB8FF' }}>Next update.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <button onClick={() => setStep(0)} style={{ padding:'13px 24px', borderRadius:100, background:'rgba(43,108,184,0.08)', color:'#2B6CB8', fontWeight:700, fontSize:14, border:'1.5px solid rgba(43,108,184,0.2)', cursor:'pointer' }}>
            ← Back
          </button>
          <button onClick={handleGenerate} disabled={!config.sellerName || generating}
            style={{ flex:1, padding:'13px 24px', borderRadius:100, background: config.sellerName && !generating ? 'linear-gradient(135deg,#2B6CB8,#1A4B8C)' : 'rgba(43,108,184,0.2)', color:'white', fontWeight:700, fontSize:14, border:'none', cursor: config.sellerName && !generating ? 'pointer' : 'not-allowed', boxShadow: config.sellerName ? '0 5px 20px rgba(43,108,184,0.35)' : 'none', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {generating ? (
              <><span style={{ display:'inline-block', width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} /> Generating Script...</>
            ) : '🧠 Generate AI Script →'}
          </button>
        </div>
        {error && <p style={{ color:'#e53e3e', fontSize:13 }}>{error}</p>}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  /* ════════ STEP 2 — Script Preview ════════ */
  const renderScript = () => (
    <div>
      <h2 style={{ fontSize:'1.5rem', fontWeight:700, color:'#1B3A6B', margin:'0 0 6px' }}>Your AI Script</h2>
      <p style={{ color:'#4A7AB5', fontSize:14, marginBottom:24 }}>Review your script. You can regenerate it anytime.</p>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <ScriptSegment label="🎤 Intro" color="#2B6CB8" text={script!.intro} />
        {script!.products.map((p, i) => {
          const prod = products[i];
          return <ScriptSegment key={i} label={`📦 Product ${i+1} — ${prod?.name || ''}`} color="#7c3aed" text={p.segment} />;
        })}
        <ScriptSegment label="👋 Outro" color="#16a34a" text={script!.outro} />
        <div style={{ background:'rgba(43,108,184,0.04)', border:'1.5px solid rgba(43,108,184,0.12)', borderRadius:18, padding:'20px 22px' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#4A7AB5', letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:14 }}>💬 Auto Q&A Responses</div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {script!.qaResponses.map((qa, i) => (
              <div key={i}>
                <p style={{ color:'#1B3A6B', fontWeight:700, fontSize:13, margin:'0 0 3px' }}>Q: {qa.question}</p>
                <p style={{ color:'#4A7AB5', fontSize:13, margin:0 }}>A: {qa.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display:'flex', gap:12, marginTop:28 }}>
        <button onClick={() => { setScript(null); setStep(1); }} style={{ padding:'13px 24px', borderRadius:100, background:'rgba(43,108,184,0.08)', color:'#2B6CB8', fontWeight:700, fontSize:14, border:'1.5px solid rgba(43,108,184,0.2)', cursor:'pointer' }}>← Edit</button>
        <button onClick={handleGenerate} disabled={generating} style={{ padding:'13px 24px', borderRadius:100, background:'rgba(43,108,184,0.08)', color:'#2B6CB8', fontWeight:700, fontSize:14, border:'1.5px solid rgba(43,108,184,0.2)', cursor:'pointer' }}>🔄 Regenerate</button>
        <button onClick={() => setStep(3)} style={{ flex:1, padding:'13px 24px', borderRadius:100, background:'linear-gradient(135deg,#2B6CB8,#1A4B8C)', color:'white', fontWeight:700, fontSize:14, border:'none', cursor:'pointer', boxShadow:'0 5px 20px rgba(43,108,184,0.38)' }}>Looks Good → Launch Stream</button>
      </div>
    </div>
  );

  /* ════════ STEP 3 — Launch ════════ */
  const renderLaunch = () => {
    const segs = getAllSegments();

    if (!launched) {
      return (
        <div style={{ maxWidth:560, textAlign:'center', margin:'0 auto', padding:'20px 0' }}>
          <div style={{ fontSize:64, marginBottom:16 }}>🚀</div>
          <h2 style={{ fontSize:'1.8rem', fontWeight:700, color:'#1B3A6B', margin:'0 0 10px' }}>Ready to Go Live!</h2>
          <p style={{ color:'#4A7AB5', fontSize:15, lineHeight:1.7, marginBottom:32 }}>
            Your AI avatar will read your script out loud and walk through all {products.filter(p=>p.name).length} products automatically.
          </p>
          <div style={{ background:'white', border:'1.5px solid rgba(43,108,184,0.15)', borderRadius:20, padding:'20px 24px', marginBottom:28, textAlign:'left' }}>
            {[
              { icon:'🗣️', label:'Voice', value:'AI Text-to-Speech (Browser)' },
              { icon:'🌐', label:'Language', value: LANGS.find(l=>l.value===config.language)?.label || '' },
              { icon:'⚡', label:'Style', value: TONES.find(t=>t.value===config.tone)?.label || '' },
              { icon:'📦', label:'Products', value: `${products.filter(p=>p.name&&p.price).length} items queued` },
              { icon:'📝', label:'Segments', value: `${segs.length} segments to present` },
            ].map(r => (
              <div key={r.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid rgba(43,108,184,0.06)' }}>
                <span style={{ color:'#4A7AB5', fontSize:14 }}>{r.icon} {r.label}</span>
                <span style={{ color:'#1B3A6B', fontWeight:700, fontSize:14 }}>{r.value}</span>
              </div>
            ))}
          </div>
          {/* Warm-up duration — simple question */}
          <div style={{ background:'rgba(43,108,184,0.04)', borderRadius:12, padding:'16px', marginBottom:20 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#1B3A6B', marginBottom:10 }}>
              ⏰ How long should the warm-up be?
            </div>
            <div style={{ fontSize:12, color:'#4A7AB5', marginBottom:12, lineHeight:1.6 }}>
              During warm-up, the AI greets viewers as they join, answers questions, and builds excitement — without revealing your products. The show starts automatically when time's up.
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <input
                type="number" min={1} max={10}
                value={Math.round(warmupDuration / 60)}
                onChange={e => setWarmupDuration(Math.max(30, Math.min(600, parseInt(e.target.value || '1') * 60)))}
                style={{ width:64, padding:'10px 12px', borderRadius:10, border:'1.5px solid rgba(43,108,184,0.2)', fontSize:18, fontWeight:800, color:'#1B3A6B', outline:'none', textAlign:'center' }}
              />
              <span style={{ fontSize:14, color:'#4A7AB5', fontWeight:600 }}>minutes</span>
              <span style={{ fontSize:12, color:'#9ca3af', marginLeft:'auto' }}>
                {warmupDuration < 60 ? `${warmupDuration}s` : `${Math.round(warmupDuration/60)} min`}
              </span>
            </div>
          </div>

          <button
            onClick={handleLaunch}
            style={{ width:'100%', padding:'18px', borderRadius:14, background:'linear-gradient(135deg,#dc2626,#b91c1c)', color:'white', fontWeight:800, fontSize:16, border:'none', cursor:'pointer', boxShadow:'0 6px 28px rgba(220,38,38,0.42)', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
            onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
            onMouseLeave={e=>e.currentTarget.style.transform=''}
          >
            <span style={{ width:10, height:10, borderRadius:'50%', background:'white', display:'inline-block', animation:'pulse 1s ease-in-out infinite' }} />
            Start AI Live Stream
          </button>
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        </div>
      );
    }

    /* ── LIVE state ── */
    const activeLabel    = segs[currentSegIdx]?.label || 'Intro';
    const validProds     = products.filter(p => p.name && p.price);
    // Map segment index to product: seg 0 = intro, segs 1..N = products, last = outro
    const productSegIdx  = currentSegIdx >= 1 && currentSegIdx <= validProds.length
                           ? currentSegIdx - 1 : null;
    const currentProduct = productSegIdx !== null ? validProds[productSegIdx] : null;
    const showcaseProduct = bidRound
      ? (validProds.find(p => p.name === bidRound.productName) ?? currentProduct)
      : currentProduct;

    // Determine showcase phase
    const showcasePhase: 'intro' | 'pitch' | 'bidding' | 'sold' | 'outro' =
      bidRound            ? 'bidding'
      : currentSegIdx === 0               ? 'intro'
      : currentSegIdx === segs.length - 1 ? 'outro'
      : 'pitch';

    // Build BidState for showcase
    const showcaseBidState: ShowcaseBidState | null = bidRound ? {
      productName:   bidRound.productName,
      currentBid:    bidRound.currentBid,
      startPrice:    bidRound.startPrice,
      currentBidder: bidRound.currentBidder,
      timeLeft:      bidRound.timeLeft,
      totalSeconds:  bidRound.totalSeconds,
      productImage:  bidRound.productImage,
    } : null;

    // Current script text for visual cue sync
    const currentSegText = segs[currentSegIdx]?.text ?? '';

    // Mini avatar for PiP inside showcase
    const avatarPip = (
      <SpeakingAvatar
        name={config.sellerName}
        isSpeaking={(isSpeaking || isAnswering) && !isPaused}
        currentLabel={isAnswering ? 'Q&A' : activeLabel}
      />
    );

    return (
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ── Header bar ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, padding:'10px 18px', background:'rgba(220,38,38,0.07)', border:'1.5px solid rgba(220,38,38,0.2)', borderRadius:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ width:10, height:10, borderRadius:'50%', background:'#dc2626', display:'inline-block', animation:'pulse2 1s ease-in-out infinite' }} />
            <span style={{ color:'#dc2626', fontWeight:800, fontSize:15, letterSpacing:'0.05em' }}>AI STREAM LIVE</span>
            {warmupActive && (
              <span style={{ fontSize:12, color:'#d97706', fontWeight:700, background:'rgba(251,191,36,0.15)', padding:'2px 10px', borderRadius:20 }}>
                ⏰ Warm-up: {warmupSecs}s
              </span>
            )}
            {isAnswering && <span style={{ fontSize:12, color:'#2B6CB8', fontWeight:700, background:'rgba(43,108,184,0.1)', padding:'2px 10px', borderRadius:20 }}>🤖 answering...</span>}
            <span style={{ fontSize:11, color: (hasGoogleTTS() || hasAzureTTS() || hasElevenLabs()) ? '#16a34a' : '#92400e', fontWeight:700, background: (hasGoogleTTS() || hasAzureTTS() || hasElevenLabs()) ? 'rgba(22,163,74,0.1)' : 'rgba(251,191,36,0.15)', padding:'2px 10px', borderRadius:20 }}>
              {hasGoogleTTS() ? '🎤 Google Neural' : hasAzureTTS() ? '🎤 Azure Neural' : hasElevenLabs() ? '🎤 ElevenLabs' : '🔊 Browser Voice'}
            </span>
          </div>
          <div style={{ display:'flex', gap:14 }}>
            <span style={{ fontSize:13, color:'#1B3A6B', fontWeight:700 }}>👁️ {liveViewers}</span>
            <span style={{ fontSize:13, color:'#1B3A6B', fontWeight:700 }}>⚡ {liveBids} bids</span>
            <span style={{ fontSize:13, color:'#16a34a', fontWeight:700 }}>💰 ₹{liveRevenue.toLocaleString('en-IN')}</span>
            {bannedCount > 0 && <span style={{ fontSize:13, color:'#dc2626', fontWeight:700 }}>🚫 {bannedCount}</span>}
          </div>
        </div>

        {/* ── SPLIT SCREEN: Showcase (left) + Controls (right) ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:14, marginBottom:14 }}>

          {/* LEFT — Product Showcase (dominant) */}
          <ProductShowcase
            product={showcaseProduct}
            allProducts={validProds}
            phase={showcasePhase}
            bidState={showcaseBidState}
            currentSegText={currentSegText}
            avatarNode={avatarPip}
            height={480}
          />

          {/* RIGHT — Script + Chat stacked */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

            {/* Script progress / Bid panel */}
            {bidRound ? (
              <div style={{ background:'white', border:'2px solid rgba(220,38,38,0.25)', borderRadius:18, padding:'14px', boxShadow:'0 4px 20px rgba(220,38,38,0.1)', display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ fontSize:10, fontWeight:800, color:'#dc2626', letterSpacing:'0.08em' }}>🔨 LIVE AUCTION</div>
                <div style={{ fontSize:13, fontWeight:800, color:'#1B3A6B' }}>{bidRound.productName}</div>

                {/* Timer */}
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:11, color:'#4A7AB5', fontWeight:600 }}>Time left</span>
                    <span style={{ fontSize:18, fontWeight:900, color: bidRound.timeLeft <= 10 ? '#dc2626' : '#1B3A6B', animation: bidRound.timeLeft <= 10 ? 'pulse2 0.5s infinite' : 'none' }}>
                      {String(Math.floor(bidRound.timeLeft/60)).padStart(2,'0')}:{String(bidRound.timeLeft%60).padStart(2,'0')}
                    </span>
                  </div>
                  <div style={{ height:6, borderRadius:4, background:'rgba(43,108,184,0.1)', overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:4, transition:'width 1s linear', width:`${(bidRound.timeLeft/bidRound.totalSeconds)*100}%`, background: bidRound.timeLeft<=10?'#dc2626':bidRound.timeLeft<=30?'#f59e0b':'#16a34a' }} />
                  </div>
                </div>

                {/* Current bid */}
                <div style={{ background:'rgba(22,163,74,0.06)', border:'1.5px solid rgba(22,163,74,0.2)', borderRadius:12, padding:'10px 12px', textAlign:'center' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#16a34a', letterSpacing:'0.06em', marginBottom:3 }}>CURRENT BID</div>
                  <div style={{ fontSize:24, fontWeight:900, color:'#1B3A6B' }}>₹{bidRound.currentBid.toLocaleString('en-IN')}</div>
                  {bidRound.currentBidder
                    ? <div style={{ fontSize:11, color:'#16a34a', fontWeight:700 }}>🏆 {bidRound.currentBidder}</div>
                    : <div style={{ fontSize:11, color:'#4A7AB5' }}>No bids yet</div>}
                </div>

                {/* Bid history */}
                {bidRound.history.length > 0 && (
                  <div style={{ maxHeight:80, overflowY:'auto', display:'flex', flexDirection:'column', gap:3 }}>
                    {bidRound.history.slice(0,5).map((b, i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:11, color: i===0?'#16a34a':'#4A7AB5', fontWeight: i===0?700:400 }}>
                        <span>{b.name}</span><span>₹{b.amount.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bid input */}
                <div style={{ borderTop:'1px solid rgba(43,108,184,0.1)', paddingTop:10 }}>
                  <div style={{ display:'flex', gap:4, marginBottom:6, flexWrap:'wrap' }}>
                    {[100,500,1000,5000].map(inc => (
                      <button key={inc} onClick={() => { setBidInput(String(bidRound.currentBid+inc)); setBidError(''); }}
                        style={{ flex:1, minWidth:40, padding:'4px 0', borderRadius:7, border:'1.5px solid rgba(43,108,184,0.2)', background:'rgba(43,108,184,0.05)', color:'#2B6CB8', fontWeight:700, fontSize:10, cursor:'pointer' }}>
                        +{inc>=1000?`₹${inc/1000}k`:`₹${inc}`}
                      </button>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:5 }}>
                    <input type="number" value={bidInput} onChange={e=>{setBidInput(e.target.value);setBidError('');}} onKeyDown={e=>e.key==='Enter'&&handlePlaceBid()}
                      placeholder={`₹${getMinNextBid(bidRound.currentBid).toLocaleString('en-IN')}`}
                      style={{ flex:1, padding:'8px 10px', borderRadius:9, border:'1.5px solid rgba(43,108,184,0.25)', fontSize:12, color:'#1B3A6B', outline:'none', fontWeight:700 }} />
                    <button onClick={handlePlaceBid} style={{ padding:'8px 12px', borderRadius:9, background:'linear-gradient(135deg,#dc2626,#b91c1c)', color:'white', fontWeight:800, fontSize:12, border:'none', cursor:'pointer', boxShadow:'0 3px 10px rgba(220,38,38,0.3)' }}>🔨 Bid</button>
                  </div>
                  {bidError && <p style={{ color:'#dc2626', fontSize:11, margin:'5px 0 0', fontWeight:600 }}>{bidError}</p>}
                  {bidRound.currentBidder==='You' && (
                    <div style={{ marginTop:7, padding:'5px 9px', borderRadius:7, background:'rgba(22,163,74,0.1)', border:'1px solid rgba(22,163,74,0.25)', fontSize:11, fontWeight:700, color:'#16a34a', textAlign:'center' }}>🏆 You are winning!</div>
                  )}
                </div>
              </div>
            ) : (
              /* Script progress */
              <div style={{ background:'white', border:'1.5px solid rgba(43,108,184,0.15)', borderRadius:18, padding:'14px', boxShadow:'0 4px 16px rgba(43,108,184,0.07)', overflowY:'auto', maxHeight:220 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#4A7AB5', letterSpacing:'0.07em', marginBottom:10 }}>📜 SCRIPT</div>
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  {getAllSegments().map((seg, i) => {
                    const isDone=i<currentSegIdx, isAct=i===currentSegIdx;
                    return (
                      <div key={i} onClick={()=>{window.speechSynthesis.cancel();speakFromIndex(i);}}
                        style={{ padding:'7px 9px', borderRadius:9, cursor:'pointer', background:isAct?'rgba(43,108,184,0.08)':isDone?'rgba(22,163,74,0.05)':'transparent', border:isAct?'1.5px solid rgba(43,108,184,0.3)':isDone?'1.5px solid rgba(22,163,74,0.2)':'1.5px solid rgba(43,108,184,0.07)' }}>
                        <span style={{ fontSize:11 }}>{isDone?'✅':isAct?'🔊':'⏳'}</span>
                        <span style={{ fontSize:11, fontWeight:700, color:isAct?'#1B3A6B':isDone?'#16a34a':'#4A7AB5', marginLeft:5 }}>{seg.label}</span>
                      </div>
                    );
                  })}
                </div>
                {soldItems.length > 0 && (
                  <div style={{ marginTop:10, padding:'8px', background:'rgba(22,163,74,0.05)', borderRadius:9 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'#16a34a', marginBottom:5 }}>🎉 SOLD</div>
                    {soldItems.map((s,i)=>(
                      <div key={i} style={{ fontSize:11, color:'#1B3A6B', marginBottom:2 }}><strong>{s.name}</strong> → {s.winner} @ ₹{s.amount.toLocaleString('en-IN')}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Live Chat */}
            <div style={{ flex:1, background:'white', border:'1.5px solid rgba(43,108,184,0.15)', borderRadius:18, overflow:'hidden', boxShadow:'0 4px 16px rgba(43,108,184,0.07)', display:'flex', flexDirection:'column', minHeight:0 }}>
              <div style={{ padding:'10px 14px', borderBottom:'1px solid rgba(43,108,184,0.1)', display:'flex', alignItems:'center', gap:7 }}>
                <span style={{ fontSize:13, fontWeight:800, color:'#1B3A6B' }}>💬 Chat</span>
                <span style={{ fontSize:11, color:'#4A7AB5' }}>{chatMessages.length}</span>
              </div>
              <div ref={chatBoxRef} style={{ flex:1, overflowY:'auto', padding:'10px 12px', display:'flex', flexDirection:'column', gap:7, minHeight:120, maxHeight:220 }}>
                {chatMessages.length===0 && <div style={{ textAlign:'center', color:'#4A7AB5', fontSize:12, marginTop:30, opacity:0.6 }}>Chat starts when stream goes live...</div>}
                {chatMessages.map(msg => {
                  if (msg.from==='system') return (
                    <div key={msg.id} style={{ fontSize:11, color:msg.text.startsWith('🚫')?'#dc2626':'#7c3aed', fontStyle:'italic', padding:'3px 7px', background:msg.text.startsWith('🚫')?'rgba(220,38,38,0.06)':'rgba(124,58,237,0.06)', borderRadius:7 }}>{msg.text}</div>
                  );
                  return (
                    <div key={msg.id} style={{ display:'flex', gap:7, alignItems:'flex-start' }}>
                      <div style={{ width:24, height:24, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, background:msg.from==='ai'?'linear-gradient(135deg,#2B6CB8,#1A4B8C)':msg.isQuestion?'rgba(251,146,60,0.2)':'rgba(43,108,184,0.1)', color:msg.from==='ai'?'white':msg.isQuestion?'#ea580c':'#2B6CB8' }}>
                        {msg.from==='ai'?'🤖':msg.name.charAt(0)}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <span style={{ fontSize:11, fontWeight:700, color:msg.from==='ai'?'#2B6CB8':msg.isQuestion?'#ea580c':'#1B3A6B', marginRight:5 }}>{msg.from==='ai'?'AI Host':msg.name}{msg.isQuestion&&' ❓'}</span>
                        <span style={{ fontSize:11, color:msg.from==='ai'?'#1B3A6B':'#4A7AB5', lineHeight:1.4, wordBreak:'break-word' }}>
                          {msg.text==='💭 thinking...'
                            ? <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}><span style={{ display:'inline-block', width:9, height:9, border:'2px solid rgba(43,108,184,0.3)', borderTopColor:'#2B6CB8', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} /> thinking...</span>
                            : msg.text}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding:'9px 11px', borderTop:'1px solid rgba(43,108,184,0.1)', display:'flex', gap:7 }}>
                <input value={viewerInput} onChange={e=>setViewerInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleViewerSend()} placeholder="Ask a question..."
                  style={{ flex:1, padding:'7px 11px', borderRadius:18, border:'1.5px solid rgba(43,108,184,0.2)', fontSize:12, color:'#1B3A6B', outline:'none' }} />
                <button onClick={handleViewerSend} disabled={!viewerInput.trim()||isAnswering}
                  style={{ padding:'7px 13px', borderRadius:18, background:viewerInput.trim()&&!isAnswering?'linear-gradient(135deg,#2B6CB8,#1A4B8C)':'rgba(43,108,184,0.15)', color:'white', fontWeight:700, fontSize:12, border:'none', cursor:viewerInput.trim()&&!isAnswering?'pointer':'not-allowed' }}>
                  Ask
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Controls ── */}
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <button onClick={handlePauseResume} style={{ padding:'10px 22px', borderRadius:100, background:'rgba(43,108,184,0.08)', color:'#2B6CB8', fontWeight:700, fontSize:13, border:'1.5px solid rgba(43,108,184,0.25)', cursor:'pointer' }}>
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button onClick={handleSkip} disabled={currentSegIdx>=segs.length-1} style={{ padding:'10px 22px', borderRadius:100, background:'rgba(43,108,184,0.08)', color:'#2B6CB8', fontWeight:700, fontSize:13, border:'1.5px solid rgba(43,108,184,0.25)', cursor:currentSegIdx>=segs.length-1?'not-allowed':'pointer', opacity:currentSegIdx>=segs.length-1?0.5:1 }}>
            ⏭ Skip
          </button>
          <button onClick={handleEndStream} style={{ padding:'10px 22px', borderRadius:100, background:'rgba(220,38,38,0.08)', color:'#dc2626', fontWeight:700, fontSize:13, border:'1.5px solid rgba(220,38,38,0.3)', cursor:'pointer' }}>
            🔴 End Stream
          </button>
        </div>

        <style>{`
          @keyframes pulse2    { 0%,100%{opacity:1} 50%{opacity:0.3} }
          @keyframes ringPulse { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.25);opacity:0} }
          @keyframes shimmer   { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
          @keyframes wave      { 0%{height:6px} 100%{height:28px} }
          @keyframes spin      { to{transform:rotate(360deg)} }
        `}</style>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, color:'#4A7AB5', fontSize:13, fontWeight:600, background:'none', border:'none', cursor:'pointer', marginBottom:28 }}>
        ← Back to Go Live
      </button>
      <StepBar current={step} />
      {step === 0 && renderProducts()}
      {step === 1 && renderAvatar()}
      {step === 2 && script && renderScript()}
      {step === 3 && renderLaunch()}
    </div>
  );
};

/* ─── Script segment card ─── */
const ScriptSegment: React.FC<{ label: string; color: string; text: string }> = ({ label, color, text }) => (
  <div style={{ background:'white', border:`1.5px solid ${color}30`, borderRadius:18, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.04)' }}>
    <div style={{ background:`${color}12`, padding:'10px 18px', borderBottom:`1px solid ${color}20` }}>
      <span style={{ fontWeight:800, fontSize:12, color, letterSpacing:'0.05em' }}>{label}</span>
    </div>
    <div style={{ padding:'14px 18px' }}>
      <p style={{ color:'#1B3A6B', fontSize:14, lineHeight:1.75, margin:0, whiteSpace:'pre-line' }}>{text}</p>
    </div>
  </div>
);

export default AIStreamPanel;
