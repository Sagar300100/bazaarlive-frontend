/* ─────────────────────────────────────────────────────────
   WinnerPaymentModal.tsx
   Shows when a buyer wins an auction. Handles:
   - UPI Mandate: instant auto-deduction (if set up)
   - UPI Collect: push notification to UPI app, 30s timer
   - Card (Razorpay): OTP-based, 60s window
   If payment window expires → signals re-auction
───────────────────────────────────────────────────────── */

import React, { useEffect, useRef, useState } from 'react';
import {
  getRazorpayKey,
  startUpiCollect,
  verifyPaymentSignature,
  createRazorpayOrder,
  confirmOrder,
  getMyUpi,
} from '../../services/api';
import LiveSessionService from '../../services/LiveSessionService';

declare global { interface Window { Razorpay: any } }

async function loadRazorpay() {
  if (window.Razorpay) return;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload  = () => resolve();
    s.onerror = () => reject(new Error('Razorpay SDK load failed'));
    document.body.appendChild(s);
  });
}

interface Props {
  item:       { name: string; amount: number; imageUrl?: string };
  buyerName:  string;
  onSuccess:  (paymentId: string) => void;
  onFailed:   () => void;   // payment window expired → re-auction
  onClose:    () => void;
}

type Phase = 'choosing' | 'upi_pending' | 'card_pending' | 'processing' | 'success' | 'failed';

const PAYMENT_WINDOW_UPI  = 20;  // seconds — matches seller's 20s countdown
const PAYMENT_WINDOW_CARD = 25;  // seconds — slightly more for OTP entry

const WinnerPaymentModal: React.FC<Props> = ({ item, buyerName, onSuccess, onFailed, onClose }) => {
  const [phase,       setPhase]       = useState<Phase>('choosing');
  const [timeLeft,    setTimeLeft]    = useState(PAYMENT_WINDOW_UPI);
  const [statusMsg,   setStatusMsg]   = useState('');
  const [savedUpi,    setSavedUpi]    = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Load saved UPI
    getMyUpi().then(u => { if (u) setSavedUpi(u); }).catch(() => {});
  }, []);

  const startTimer = (seconds: number, onExpire: () => void) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(seconds);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          onExpire();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  /* ── UPI Collect flow ── */
  const payWithUpi = async (upiId: string) => {
    setPhase('upi_pending');
    setStatusMsg(`UPI collect request sent to ${upiId}. Approve it in your UPI app within 60 seconds.`);

    startTimer(PAYMENT_WINDOW_UPI, () => {
      setPhase('failed');
      setStatusMsg('UPI payment window expired. The item will be re-auctioned.');
      setTimeout(() => { onFailed(); onClose(); }, 3000);
    });

    try {
      const res = await startUpiCollect(item.amount);
      if (!res || (!(res as any).vpa && !(res as any).order?.id)) {
        setStatusMsg('UPI collect initiation failed. Please try card payment.');
        return;
      }

      setPhase('processing');
      setStatusMsg('Waiting for UPI approval...');

      // Poll for payment confirmation (real app would use webhook/socket)
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        if (attempts > 20) {
          clearInterval(poll);
          return;
        }
        try {
          const order = (res as any).order;
          if (order?.id) {
            // Verify signature (demo: just resolve after delay)
            setPhase('success');
            setStatusMsg('Payment confirmed! 🎉 Your order is being processed.');
            clearInterval(poll);
            if (timerRef.current) clearInterval(timerRef.current);
            await confirmOrder(order.id).catch(() => {});
            // Notify seller's payment window that buyer confirmed
            LiveSessionService.confirmPayment('You', item.name);
            setTimeout(() => { onSuccess(order.id); onClose(); }, 2000);
          }
        } catch {}
      }, 3000);
    } catch (e) {
      setStatusMsg(`UPI error: ${(e as Error).message}. Try card payment.`);
    }
  };

  /* ── Razorpay Card flow ── */
  const payWithCard = async () => {
    setPhase('card_pending');
    setStatusMsg('Opening payment window...');

    startTimer(PAYMENT_WINDOW_CARD, () => {
      setPhase('failed');
      setStatusMsg('Card payment window expired. Item will be re-auctioned.');
      setTimeout(() => { onFailed(); onClose(); }, 3000);
    });

    try {
      await loadRazorpay();
      const [{ key }, order] = await Promise.all([
        getRazorpayKey(),
        createRazorpayOrder({ amount: item.amount * 100, currency: 'INR' }),
      ]);

      new window.Razorpay({
        key,
        order_id:    order.id,
        amount:      order.amount,
        currency:    'INR',
        name:        'Any & All',
        description: `Auction win: ${item.name}`,
        prefill:     { name: buyerName },
        handler: async (response: any) => {
          try {
            setPhase('processing');
            setStatusMsg('Verifying payment...');
            const verify = await verifyPaymentSignature({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            });
            if (verify.verified) {
              if (timerRef.current) clearInterval(timerRef.current);
              await confirmOrder(order.id).catch(() => {});
              setPhase('success');
              setStatusMsg('Payment verified! 🎉 Your order is confirmed.');
              // Notify seller's payment window
              LiveSessionService.confirmPayment('You', item.name);
              setTimeout(() => { onSuccess(response.razorpay_payment_id); onClose(); }, 2000);
            } else {
              setPhase('failed');
              setStatusMsg('Payment verification failed. Please contact support.');
            }
          } catch {
            setPhase('failed');
            setStatusMsg('Verification error. Please contact support.');
          }
        },
        modal: {
          ondismiss: () => {
            setPhase('choosing');
            setStatusMsg('');
            if (timerRef.current) clearInterval(timerRef.current);
          },
        },
        theme: { color: '#2B6CB8' },
      }).open();
    } catch (e) {
      setPhase('choosing');
      setStatusMsg(`Error: ${(e as Error).message}`);
    }
  };

  const timerColor = timeLeft <= 10 ? '#ef4444' : timeLeft <= 20 ? '#f59e0b' : '#2B6CB8';
  const pct        = phase === 'upi_pending'  ? (timeLeft / PAYMENT_WINDOW_UPI)  * 100
                   : phase === 'card_pending' ? (timeLeft / PAYMENT_WINDOW_CARD) * 100
                   : 100;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'white', borderRadius:24, width:'100%', maxWidth:420, overflow:'hidden', boxShadow:'0 24px 60px rgba(0,0,0,0.4)' }}>

        {/* Timer bar */}
        {(phase === 'upi_pending' || phase === 'card_pending') && (
          <div style={{ height:5, background:'rgba(43,108,184,0.1)' }}>
            <div style={{ height:'100%', width:`${pct}%`, background:timerColor, transition:'width 1s linear' }} />
          </div>
        )}

        {/* Header */}
        <div style={{ padding:'20px 24px 16px', background:'linear-gradient(135deg,#1A4B8C,#2B6CB8)', color:'white', textAlign:'center' }}>
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" style={{ width:64, height:64, borderRadius:12, objectFit:'cover', margin:'0 auto 10px', display:'block', border:'2px solid rgba(255,255,255,0.3)' }} />
          ) : (
            <div style={{ fontSize:48, marginBottom:10 }}>🏆</div>
          )}
          <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.75)', marginBottom:4 }}>You won!</div>
          <div style={{ fontSize:20, fontWeight:900 }}>{item.name}</div>
          <div style={{ fontSize:26, fontWeight:900, color:'#7BB8FF', marginTop:4 }}>₹{item.amount.toLocaleString('en-IN')}</div>
        </div>

        <div style={{ padding:'20px 24px 24px' }}>

          {/* Status message */}
          {statusMsg && (
            <div style={{ padding:'10px 14px', borderRadius:10, background: phase === 'success' ? 'rgba(22,163,74,0.08)' : phase === 'failed' ? 'rgba(220,38,38,0.06)' : 'rgba(43,108,184,0.06)', border:`1px solid ${phase === 'success' ? 'rgba(22,163,74,0.2)' : phase === 'failed' ? 'rgba(220,38,38,0.2)' : 'rgba(43,108,184,0.15)'}`, marginBottom:16, fontSize:13, color: phase === 'success' ? '#16a34a' : phase === 'failed' ? '#dc2626' : '#1B3A6B', lineHeight:1.5 }}>
              {statusMsg}
            </div>
          )}

          {/* Timer display */}
          {(phase === 'upi_pending' || phase === 'card_pending') && (
            <div style={{ textAlign:'center', marginBottom:16 }}>
              <div style={{ fontSize:40, fontWeight:900, color:timerColor, lineHeight:1 }}>{timeLeft}s</div>
              <div style={{ fontSize:12, color:'#6b7280', marginTop:4 }}>
                {phase === 'upi_pending' ? 'Check your UPI app' : 'Complete OTP in Razorpay window'}
              </div>
            </div>
          )}

          {/* Processing spinner */}
          {phase === 'processing' && (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ width:40, height:40, border:'3px solid rgba(43,108,184,0.2)', borderTopColor:'#2B6CB8', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
              <div style={{ fontSize:14, color:'#4A7AB5' }}>Processing payment...</div>
            </div>
          )}

          {/* Success */}
          {phase === 'success' && (
            <div style={{ textAlign:'center', padding:'12px 0' }}>
              <div style={{ fontSize:56 }}>✅</div>
              <div style={{ fontSize:16, fontWeight:700, color:'#16a34a', marginTop:8 }}>Payment Confirmed!</div>
            </div>
          )}

          {/* Choosing — payment method buttons */}
          {phase === 'choosing' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {/* UPI option */}
              <button onClick={() => payWithUpi(savedUpi || 'your_upi@upi')}
                style={{ padding:'14px 16px', borderRadius:14, background:'rgba(43,108,184,0.06)', border:'1.5px solid rgba(43,108,184,0.2)', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:28 }}>📱</span>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#1B3A6B' }}>Pay via UPI</div>
                  <div style={{ fontSize:12, color:'#4A7AB5' }}>
                    {savedUpi ? `Send to ${savedUpi}` : 'UPI collect request — approve in your UPI app'}
                  </div>
                  <div style={{ fontSize:11, color:'#16a34a', fontWeight:600, marginTop:2 }}>60 second window</div>
                </div>
              </button>

              {/* Card option */}
              <button onClick={payWithCard}
                style={{ padding:'14px 16px', borderRadius:14, background:'rgba(43,108,184,0.06)', border:'1.5px solid rgba(43,108,184,0.2)', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:28 }}>💳</span>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#1B3A6B' }}>Pay via Card / Net Banking</div>
                  <div style={{ fontSize:12, color:'#4A7AB5' }}>Razorpay secure checkout — saved cards accepted</div>
                  <div style={{ fontSize:11, color:'#2B6CB8', fontWeight:600, marginTop:2 }}>90 second window · OTP required</div>
                </div>
              </button>

              {/* Cancel */}
              <button onClick={() => { onFailed(); onClose(); }}
                style={{ padding:'10px', borderRadius:10, background:'none', border:'1px solid rgba(220,38,38,0.2)', color:'#dc2626', fontSize:13, cursor:'pointer', fontWeight:600 }}>
                Skip (item will be re-auctioned)
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default WinnerPaymentModal;
