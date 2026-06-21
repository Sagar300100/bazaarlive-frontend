/* ─────────────────────────────────────────────────────────
   PaymentSetupModal.tsx
   Allows buyers to set up their preferred payment method:
   1. Save UPI ID — for UPI collect requests (fastest)
   2. UPI Mandate — one-time setup, auto-deduct on wins (no pop-up)
   3. Card (tokenization) — saved card, just OTP on wins
───────────────────────────────────────────────────────── */

import React, { useEffect, useState } from 'react';
import { saveMyUpi, getMyUpi, setupUpiAutopay, getRazorpayKey, createRazorpayOrder } from '../../services/api';

declare global { interface Window { Razorpay: any } }

async function loadRazorpay() {
  if (window.Razorpay) return;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload  = () => resolve();
    s.onerror = () => reject();
    document.body.appendChild(s);
  });
}

interface Props {
  buyerName:  string;
  buyerEmail: string;
  buyerPhone: string;
  onClose:    () => void;
}

type Tab = 'upi' | 'mandate' | 'card';

const PaymentSetupModal: React.FC<Props> = ({ buyerName, buyerEmail, buyerPhone, onClose }) => {
  const [tab,         setTab]         = useState<Tab>('upi');
  const [upiId,       setUpiId]       = useState('');
  const [savedUpi,    setSavedUpi]    = useState('');
  const [upiSaving,   setUpiSaving]   = useState(false);
  const [upiSaved,    setUpiSaved]    = useState(false);
  const [mandateAmt,  setMandateAmt]  = useState('10000');
  const [mandateLoad, setMandateLoad] = useState(false);
  const [mandateDone, setMandateDone] = useState(false);
  const [cardLoad,    setCardLoad]    = useState(false);
  const [cardSaved,   setCardSaved]   = useState(false);
  const [error,       setError]       = useState('');

  useEffect(() => {
    getMyUpi().then(u => { if (u) { setSavedUpi(u); setUpiId(u); } }).catch(() => {});
    // Check if mandate/card saved
    const m = localStorage.getItem('aa_mandate_active');
    if (m === '1') setMandateDone(true);
    const c = localStorage.getItem('aa_card_saved');
    if (c === '1') setCardSaved(true);
  }, []);

  /* ── Save UPI ID ── */
  const handleSaveUpi = async () => {
    if (!upiId.trim() || !upiId.includes('@')) { setError('Enter a valid UPI ID (e.g. name@upi)'); return; }
    setError(''); setUpiSaving(true);
    try {
      await saveMyUpi(upiId.trim());
      setSavedUpi(upiId.trim());
      setUpiSaved(true);
    } catch { setError('Failed to save UPI ID. Try again.'); }
    setUpiSaving(false);
  };

  /* ── Setup UPI Mandate (Autopay) ── */
  const handleSetupMandate = async () => {
    setError(''); setMandateLoad(true);
    try {
      const amt = parseInt(mandateAmt) * 100; // paise
      const result = await setupUpiAutopay({ amount: amt, description: 'Any & All — Auction Wins' });
      if (result?.ok) {
        localStorage.setItem('aa_mandate_active', '1');
        setMandateDone(true);
      } else {
        setError('Mandate setup failed. Please try UPI collect instead.');
      }
    } catch (e: any) {
      setError(e?.message || 'Mandate setup failed.');
    }
    setMandateLoad(false);
  };

  /* ── Save Card via Razorpay (₹1 auth charge, immediately refunded) ── */
  const handleSaveCard = async () => {
    setError(''); setCardLoad(true);
    try {
      await loadRazorpay();
      const [{ key }, order] = await Promise.all([
        getRazorpayKey(),
        createRazorpayOrder({ amount: 100, currency: 'INR' }), // ₹1 auth
      ]);

      new window.Razorpay({
        key,
        order_id:    order.id,
        amount:      100,
        currency:    'INR',
        name:        'Any & All',
        description: 'Save card for auctions (₹1 auth, refunded)',
        prefill:     { name: buyerName, email: buyerEmail, contact: buyerPhone },
        notes:       { purpose: 'card_save' },
        handler: () => {
          localStorage.setItem('aa_card_saved', '1');
          setCardSaved(true);
          setCardLoad(false);
        },
        modal: { ondismiss: () => setCardLoad(false) },
        theme: { color: '#2B6CB8' },
      }).open();
    } catch (e: any) {
      setError(e?.message || 'Could not open payment window.');
      setCardLoad(false);
    }
  };

  const TABS: { key: Tab; label: string; icon: string; desc: string }[] = [
    { key:'upi',     label:'UPI ID',    icon:'📱', desc:'Save once, auto-fill on wins' },
    { key:'mandate', label:'UPI Mandate', icon:'⚡', desc:'Auto-deduct on wins — no pop-up' },
    { key:'card',    label:'Card',        icon:'💳', desc:'Saved card — just OTP on wins' },
  ];

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:9998, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'white', borderRadius:24, width:'100%', maxWidth:440, maxHeight:'85vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 24px 60px rgba(0,0,0,0.35)' }}>

        {/* Header */}
        <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid rgba(43,108,184,0.1)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:'#1B3A6B' }}>💳 Payment Setup</div>
            <div style={{ fontSize:12, color:'#4A7AB5', marginTop:2 }}>Set up once — pay instantly when you win</div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', background:'rgba(43,108,184,0.08)', border:'none', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
        </div>

        {/* Tab bar */}
        <div style={{ display:'flex', borderBottom:'1px solid rgba(43,108,184,0.1)', padding:'0 24px' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setError(''); }}
              style={{ flex:1, padding:'12px 4px', border:'none', borderBottom: tab === t.key ? '2px solid #2B6CB8' : '2px solid transparent', background:'none', cursor:'pointer', fontSize:12, fontWeight:700, color: tab === t.key ? '#2B6CB8' : '#6b7280', display:'flex', flexDirection:'column', alignItems:'center', gap:3, transition:'all 200ms' }}>
              <span style={{ fontSize:20 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px 24px' }}>
          {error && <div style={{ padding:'8px 12px', background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:8, fontSize:12, color:'#dc2626', marginBottom:14 }}>{error}</div>}

          {/* UPI ID tab */}
          {tab === 'upi' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ background:'rgba(43,108,184,0.04)', borderRadius:12, padding:'12px 14px', fontSize:13, color:'#1B3A6B', lineHeight:1.6 }}>
                💡 When you win, we send a <strong>UPI collect request</strong> to this ID. You approve it in your UPI app within 60 seconds.
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:'#4A7AB5', display:'block', marginBottom:6 }}>YOUR UPI ID</label>
                <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@upi or yourname@paytm"
                  style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:'1.5px solid rgba(43,108,184,0.2)', fontSize:14, color:'#1B3A6B', outline:'none', boxSizing:'border-box' }} />
              </div>
              {upiSaved && (
                <div style={{ padding:'8px 12px', background:'rgba(22,163,74,0.06)', border:'1px solid rgba(22,163,74,0.2)', borderRadius:8, fontSize:12, color:'#16a34a', fontWeight:600 }}>
                  ✅ UPI ID saved: {savedUpi}
                </div>
              )}
              <button onClick={handleSaveUpi} disabled={upiSaving}
                style={{ padding:'13px', borderRadius:12, background: upiSaving ? 'rgba(43,108,184,0.2)' : 'linear-gradient(135deg,#2B6CB8,#1A4B8C)', color:'white', fontWeight:700, fontSize:14, border:'none', cursor: upiSaving ? 'not-allowed' : 'pointer' }}>
                {upiSaving ? 'Saving...' : '💾 Save UPI ID'}
              </button>
            </div>
          )}

          {/* UPI Mandate tab */}
          {tab === 'mandate' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ background:'rgba(22,163,74,0.04)', borderRadius:12, padding:'12px 14px', fontSize:13, color:'#1B3A6B', lineHeight:1.6 }}>
                ⚡ <strong>Best experience.</strong> Set up once, wins auto-deduct — no pop-up, no OTP every time. Works like UPI Autopay (Dream11, Swiggy, etc.).
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:'#4A7AB5', display:'block', marginBottom:6 }}>MAX AMOUNT PER WIN (₹)</label>
                <select value={mandateAmt} onChange={e => setMandateAmt(e.target.value)}
                  style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:'1.5px solid rgba(43,108,184,0.2)', fontSize:14, color:'#1B3A6B', outline:'none', background:'white' }}>
                  <option value="5000">₹5,000</option>
                  <option value="10000">₹10,000</option>
                  <option value="25000">₹25,000</option>
                  <option value="50000">₹50,000</option>
                  <option value="100000">₹1,00,000</option>
                </select>
                <div style={{ fontSize:11, color:'#9ca3af', marginTop:5 }}>You'll only be charged the winning bid amount, never more.</div>
              </div>
              {mandateDone && (
                <div style={{ padding:'8px 12px', background:'rgba(22,163,74,0.06)', border:'1px solid rgba(22,163,74,0.2)', borderRadius:8, fontSize:12, color:'#16a34a', fontWeight:600 }}>
                  ✅ UPI Mandate active — wins auto-deduct up to ₹{parseInt(mandateAmt).toLocaleString('en-IN')}
                </div>
              )}
              <button onClick={handleSetupMandate} disabled={mandateLoad || mandateDone}
                style={{ padding:'13px', borderRadius:12, background: mandateDone ? 'rgba(22,163,74,0.1)' : mandateLoad ? 'rgba(43,108,184,0.2)' : 'linear-gradient(135deg,#16a34a,#15803d)', color: mandateDone ? '#16a34a' : 'white', fontWeight:700, fontSize:14, border: mandateDone ? '1.5px solid rgba(22,163,74,0.3)' : 'none', cursor: mandateDone ? 'default' : 'pointer' }}>
                {mandateDone ? '✅ Mandate Active' : mandateLoad ? 'Setting up...' : '⚡ Set Up UPI Mandate'}
              </button>
              <div style={{ fontSize:11, color:'#9ca3af', textAlign:'center', lineHeight:1.6 }}>
                A mandate request will be sent to your UPI app for one-time approval. Compliant with RBI guidelines.
              </div>
            </div>
          )}

          {/* Card tab */}
          {tab === 'card' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ background:'rgba(43,108,184,0.04)', borderRadius:12, padding:'12px 14px', fontSize:13, color:'#1B3A6B', lineHeight:1.6 }}>
                💳 Save your card securely via Razorpay (PCI-DSS certified). When you win, just enter your OTP — no card re-entry needed.
              </div>
              <div style={{ background:'rgba(251,191,36,0.06)', borderRadius:10, padding:'10px 12px', fontSize:12, color:'#92400e' }}>
                ₹1 will be charged for card verification and immediately refunded.
              </div>
              {cardSaved && (
                <div style={{ padding:'8px 12px', background:'rgba(22,163,74,0.06)', border:'1px solid rgba(22,163,74,0.2)', borderRadius:8, fontSize:12, color:'#16a34a', fontWeight:600 }}>
                  ✅ Card saved — just OTP needed when you win
                </div>
              )}
              <button onClick={handleSaveCard} disabled={cardLoad}
                style={{ padding:'13px', borderRadius:12, background: cardLoad ? 'rgba(43,108,184,0.2)' : 'linear-gradient(135deg,#2B6CB8,#1A4B8C)', color:'white', fontWeight:700, fontSize:14, border:'none', cursor: cardLoad ? 'not-allowed' : 'pointer' }}>
                {cardLoad ? 'Opening checkout...' : '💳 Save Card Securely'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSetupModal;
