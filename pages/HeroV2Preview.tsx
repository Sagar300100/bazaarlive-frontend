import React, { useEffect, useRef, useState } from 'react';
import '../styles/brand.css';
import { HeroStage } from '../components/landing/HeroStage';
import { LiveTicker, LiveStatusPill } from '../components/landing/primitives/LiveTicker';
import { useLiteMode } from '../hooks/useLiteMode';

/**
 * V1 preview surface. Reachable at:
 *   /?preview=hero-v2                — default
 *   /?preview=hero-v2&lite=off       — force full path even on phones
 *   /?preview=hero-v2&lite=on        — force lite path for testing
 *   /?preview=hero-v2&debug=off      — hide the diag overlay
 *
 * The diag overlay shows lite reason + viewport + canvas mount state so
 * we can immediately see why a path was taken. On by default.
 */

interface HeroApi {
  canvasMounted: () => boolean;
  progress: () => number;
}

const DiagOverlay: React.FC<{
  hero: HeroApi | null;
}> = ({ hero }) => {
  const { lite, reason, diag } = useLiteMode();
  const [tick, setTick] = useState(0);

  // Re-poll every 200ms so progress + canvas state stay current in the overlay
  useEffect(() => {
    const id = window.setInterval(() => setTick(t => t + 1), 200);
    return () => window.clearInterval(id);
  }, []);

  const canvas = hero?.canvasMounted?.() ?? false;
  const progress = hero?.progress?.() ?? 0;

  return (
    <div className="diag" key={tick}>
      <div>
        <b>lite:</b>{' '}
        <span className={lite ? 'warn' : 'ok'}>{lite ? 'TRUE' : 'false'}</span>
        {lite && reason ? `  (${reason})` : ''}
      </div>
      <div><b>vw × vh:</b> {diag.vw} × {diag.vh}</div>
      <div>
        <b>prefers-reduced-motion:</b>{' '}
        <span className={diag.reducedMotion ? 'warn' : 'ok'}>
          {diag.reducedMotion ? 'true' : 'false'}
        </span>
      </div>
      <div>
        <b>deviceMemory:</b>{' '}
        {diag.deviceMemory != null ? `${diag.deviceMemory} GB` : 'n/a (browser)'}
      </div>
      <div>
        <b>?lite override:</b> {diag.urlOverride ?? '—'}
      </div>
      <div>
        <b>canvas in DOM:</b>{' '}
        <span className={canvas ? 'ok' : 'warn'}>
          {canvas ? 'mounted' : 'NOT mounted'}
        </span>
      </div>
      <div>
        <b>scroll progress:</b> {progress.toFixed(3)}
      </div>
    </div>
  );
};

export const HeroV2Preview: React.FC = () => {
  const { lite } = useLiteMode();
  const [heroApi, setHeroApi] = useState<HeroApi | null>(null);

  const showDiag = (() => {
    if (typeof window === 'undefined') return true;
    const p = new URLSearchParams(window.location.search);
    return p.get('debug') !== 'off';
  })();

  return (
    <div className={`brand-v2 ${lite ? 'lite' : ''}`}>
      <div className="preview-banner">
        Preview · hero v1 · Any &amp; All — the marketplace goes live
        {lite ? ' · lite mode' : ''}
      </div>

      <HeroStage onState={setHeroApi} />

      {!lite && <LiveTicker />}

      {/* Spacer below the hero so we can scroll through the pinned section.
          200vh ensures the user has 100vh of scroll AFTER the hero leaves
          its pin, which is more than enough to feel the full cinematic. */}
      <div
        style={{
          height: '100vh',
          background: 'var(--paper)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: 48,
        }}
        aria-hidden
      >
        <span className="eyebrow">↑ scroll the hero — next section comes in Batch 2</span>
      </div>

      {lite && (
        <div style={{ position: 'fixed', top: 44, left: 16, zIndex: 60 }}>
          <LiveStatusPill />
        </div>
      )}

      {showDiag && <DiagOverlay hero={heroApi} />}
    </div>
  );
};

export default HeroV2Preview;
