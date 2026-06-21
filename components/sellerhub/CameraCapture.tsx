/* ─────────────────────────────────────────────────────────
   CameraCapture.tsx
   Full-screen camera modal for product photo capture.

   Features:
   - Uses getUserMedia (no gallery access — live camera only)
   - Guided angle workflow: Front → Back → Label/Tag → Detail
   - Guide rectangle overlay to help frame the product
   - Thumbnails of captured shots at bottom
   - Works on mobile (back camera) and desktop (webcam)
   - Skip individual angles, or finish early after ≥1 photo
───────────────────────────────────────────────────────── */

import React, { useRef, useEffect, useState, useCallback } from 'react';

export interface CapturedPhoto {
  angle:   string;
  label:   string;
  dataUrl: string;
}

interface Props {
  productName: string;
  onDone:  (photos: CapturedPhoto[]) => void;
  onClose: () => void;
}

const ANGLES = [
  {
    key:         'front',
    label:       '📷 Front View',
    instruction: 'Hold product facing camera. Fill the guide box.',
    icon:        '📦',
  },
  {
    key:         'back',
    label:       '🔄 Back View',
    instruction: 'Flip the product to show the back side.',
    icon:        '↩️',
  },
  {
    key:         'label',
    label:       '🏷️ Label / Tag',
    instruction: 'Zoom in on the brand label, size tag, or barcode.',
    icon:        '🏷️',
  },
  {
    key:         'detail',
    label:       '🔍 Close-up / Defect',
    instruction: 'Show any defect, texture, material, or key detail area.',
    icon:        '🔍',
  },
];

const CameraCapture: React.FC<Props> = ({ productName, onDone, onClose }) => {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);

  const [angleIdx,   setAngleIdx]   = useState(0);
  const [captured,   setCaptured]   = useState<CapturedPhoto[]>([]);
  const [ready,      setReady]      = useState(false);
  const [flash,      setFlash]      = useState(false);
  const [error,      setError]      = useState('');
  const [facingBack, setFacingBack] = useState(true);

  /* ── Start camera stream ── */
  const startCamera = useCallback(async (back: boolean) => {
    // Stop existing stream first
    streamRef.current?.getTracks().forEach(t => t.stop());
    setReady(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: back ? { ideal: 'environment' } : 'user',
          width:      { ideal: 1280 },
          height:     { ideal: 960 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setReady(true);
        };
      }
    } catch (e: any) {
      const msg = e.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access in browser settings.'
        : e.name === 'NotFoundError'
        ? 'No camera found on this device.'
        : `Camera error: ${e.message}`;
      setError(msg);
    }
  }, []);

  useEffect(() => {
    startCamera(true);
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, [startCamera]);

  /* ── Capture a frame ── */
  const captureFrame = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !ready) return;

    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror front camera so text reads correctly
    if (!facingBack) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    const angle   = ANGLES[angleIdx];
    const photo: CapturedPhoto = { angle: angle.key, label: angle.label, dataUrl };

    // Flash animation
    setFlash(true);
    setTimeout(() => setFlash(false), 180);

    const updated = [...captured, photo];
    setCaptured(updated);

    if (angleIdx < ANGLES.length - 1) {
      setAngleIdx(angleIdx + 1);
    } else {
      finishWithPhotos(updated);
    }
  }, [ready, angleIdx, captured, facingBack]);

  const finishWithPhotos = (photos: CapturedPhoto[]) => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    onDone(photos);
  };

  const skipAngle = () => {
    if (angleIdx < ANGLES.length - 1) {
      setAngleIdx(angleIdx + 1);
    } else {
      finishWithPhotos(captured);
    }
  };

  const handleFinishEarly = () => {
    if (captured.length > 0) finishWithPhotos(captured);
  };

  const toggleCamera = () => {
    const next = !facingBack;
    setFacingBack(next);
    startCamera(next);
  };

  const currentAngle = ANGLES[angleIdx];
  const progress     = (captured.length / ANGLES.length) * 100;

  /* ── Styles ── */
  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: '#000',
    display: 'flex', flexDirection: 'column',
  };

  return (
    <div style={overlay}>
      {/* ── Header ── */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.8)', zIndex: 10 }}>
        <div>
          <div style={{ color: 'white', fontWeight: 800, fontSize: 15 }}>📸 Product Photos</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{productName || 'Product'}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {captured.length > 0 && (
            <button onClick={handleFinishEarly}
              style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(22,163,74,0.9)', color: 'white', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              Done ({captured.length})
            </button>
          )}
          <button onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ×
          </button>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.1)' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#2B6CB8,#16a34a)', transition: 'width 300ms' }} />
      </div>

      {/* ── Camera view ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Live video */}
        <video ref={videoRef} autoPlay playsInline muted
          style={{ width: '100%', height: '100%', objectFit: 'cover',
            transform: facingBack ? 'none' : 'scaleX(-1)' }} />

        {/* Photo flash */}
        {flash && (
          <div style={{ position: 'absolute', inset: 0, background: 'white', opacity: 0.85, pointerEvents: 'none' }} />
        )}

        {/* Guide rectangle overlay */}
        {ready && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{
              width: '72%', height: '60%',
              border: '2px solid rgba(255,255,255,0.75)',
              borderRadius: 16,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)',
              position: 'relative',
            }}>
              {/* Corner accents */}
              {[
                { top: -2, left: -2, borderTop: '3px solid #2B6CB8', borderLeft: '3px solid #2B6CB8', borderRadius: '4px 0 0 0' },
                { top: -2, right: -2, borderTop: '3px solid #2B6CB8', borderRight: '3px solid #2B6CB8', borderRadius: '0 4px 0 0' },
                { bottom: -2, left: -2, borderBottom: '3px solid #2B6CB8', borderLeft: '3px solid #2B6CB8', borderRadius: '0 0 0 4px' },
                { bottom: -2, right: -2, borderBottom: '3px solid #2B6CB8', borderRight: '3px solid #2B6CB8', borderRadius: '0 0 4px 0' },
              ].map((s, i) => (
                <div key={i} style={{ position: 'absolute', width: 22, height: 22, ...s }} />
              ))}
            </div>
          </div>
        )}

        {/* Angle label + instruction */}
        <div style={{ position: 'absolute', top: 16, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, pointerEvents: 'none' }}>
          <div style={{ background: 'rgba(43,108,184,0.92)', color: 'white', fontWeight: 800, fontSize: 15, padding: '6px 18px', borderRadius: 20 }}>
            {currentAngle.icon} {currentAngle.label}
          </div>
          <div style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.9)', fontSize: 12, padding: '4px 14px', borderRadius: 12 }}>
            {currentAngle.instruction}
          </div>
        </div>

        {/* Camera flip button */}
        <button onClick={toggleCamera}
          style={{ position: 'absolute', top: 16, right: 16, width: 42, height: 42, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: '1.5px solid rgba(255,255,255,0.2)', color: 'white', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          🔄
        </button>

        {/* Error state */}
        {error && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
            <div style={{ fontSize: 40 }}>📵</div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 15, textAlign: 'center' }}>{error}</div>
            <button onClick={() => { setError(''); startCamera(facingBack); }}
              style={{ padding: '10px 24px', borderRadius: 20, background: '#2B6CB8', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              Try Again
            </button>
            <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        )}

        {/* Loading state */}
        {!ready && !error && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>Starting camera…</div>
          </div>
        )}
      </div>

      {/* ── Bottom controls ── */}
      <div style={{ background: 'rgba(0,0,0,0.85)', padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>

        {/* Captured thumbnails row */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {ANGLES.map((a, i) => {
            const photo = captured.find(c => c.angle === a.key);
            const isCurrent = i === angleIdx;
            return (
              <div key={a.key} style={{
                width: 48, height: 48, borderRadius: 10, overflow: 'hidden',
                border: isCurrent ? '2px solid #2B6CB8' : '2px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', flexShrink: 0,
              }}>
                {photo ? (
                  <>
                    <img src={photo.dataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', bottom: 2, right: 2, background: '#16a34a', borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'white', fontWeight: 900 }}>✓</div>
                  </>
                ) : (
                  <span style={{ fontSize: 18, opacity: isCurrent ? 1 : 0.35 }}>{a.icon}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Main capture button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Skip */}
          <button onClick={skipAngle}
            style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', minWidth: 50 }}>
            Skip
          </button>

          {/* Shutter button */}
          <button onClick={captureFrame} disabled={!ready}
            style={{
              width: 72, height: 72, borderRadius: '50%',
              background: ready ? 'white' : 'rgba(255,255,255,0.3)',
              border: '4px solid rgba(255,255,255,0.4)',
              cursor: ready ? 'pointer' : 'not-allowed',
              boxShadow: ready ? '0 0 0 2px rgba(255,255,255,0.25), 0 4px 20px rgba(255,255,255,0.15)' : 'none',
              transition: 'all 150ms',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: ready ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.2)' }} />
          </button>

          {/* Angle count */}
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 600, textAlign: 'center', minWidth: 50 }}>
            {captured.length}/{ANGLES.length}
          </div>
        </div>

        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center' }}>
          Live camera only — gallery not allowed for product verification
        </div>
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default CameraCapture;
export type { CapturedPhoto as Photo };
