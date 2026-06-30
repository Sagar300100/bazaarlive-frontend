import React, { useEffect, useRef } from 'react';
import { useCursor } from '../../hooks/useCursor';
import { useLiteMode } from '../../hooks/useLiteMode';
import { Stage3D, type Stage3DState } from './primitives/Stage3D';
import { Cyclorama } from './hero/Cyclorama';
import { LogoCenterpiece } from './hero/LogoCenterpiece';
import { HeroStaticFallback } from './hero/HeroStaticFallback';

/**
 * HeroStage — premium royal-blue brand stage.
 *
 *   ◐ legibility mask (left)              ◑ Logo centerpiece (right)
 *   LIVE SHOPPING · INDIA                        ┌─ LIVE pill ─┐
 *   Live drops.                                  ╰─────────────╯
 *   Real sellers.                                       ╱
 *   Delivered to                                ┌──────────────┐
 *   your door. (italic, blue glow)              │   [A] logo   │
 *                                               │   glowing    │
 *   India's live shopping marketplace...        │      ╱       │
 *                                               │  ◜ orbital ◝│
 *   [Shop upcoming drops]  [Sell on Any & All]  │  ◟ rings   ◞│
 *                                               └──────────────┘
 *   Secure payments via UPI · Buyer protection
 *                                                  particles glow
 *
 * No abstract live-show cards, no product photos, no price chips
 * scattered around. The hero is purely BRAND: the A logo glowing on
 * stage, surrounded by electric-blue orbital rings and dust.
 */
export const HeroStage: React.FC<{
  onState?: (api: { canvasMounted: () => boolean; elementCount: () => number }) => void;
}> = ({ onState }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  const cursor = useCursor(canvasWrapRef);
  const { lite } = useLiteMode();

  const stateRef = useRef<Stage3DState>({
    progress: 0,
    cursor: { x: 0, y: 0 },
  });

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      stateRef.current.cursor.x = cursor.current.x;
      stateRef.current.cursor.y = cursor.current.y;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [cursor]);

  useEffect(() => {
    if (!onState) return;
    onState({
      canvasMounted: () => !!canvasWrapRef.current?.querySelector('canvas'),
      elementCount: () => (canvasWrapRef.current?.querySelector('canvas') ? 6 : 0),
    });
  }, [onState]);

  return (
    <section ref={sectionRef} className="hero">
      <div className="hero__pin">
        {/* ── Full-bleed R3F canvas ─────────────────────────── */}
        <div ref={canvasWrapRef} className="hero__canvas">
          {lite ? (
            <HeroStaticFallback alt="Any & All — live shopping marketplace" />
          ) : (
            <Stage3D
              stateRef={stateRef}
              cameraStart={[0, 0.30, 5.6]}
              cameraEnd={[0, 0.30, 5.6]}
              fov={38}
            >
              <Cyclorama />
              <ambientLight intensity={0.55} />
              <LogoCenterpiece stateRef={stateRef} basePosition={[1.30, 0.10, 0]} />
            </Stage3D>
          )}
        </div>

        {/* Left vignette so the editorial copy reads cleanly */}
        {!lite && <div className="hero__legibility-mask" aria-hidden />}

        {/* Red LIVE pill floating beside the logo (HTML overlay so it
            stays pixel-sharp at any DPR) */}
        {!lite && <span className="hero__live-pill" aria-hidden>LIVE</span>}

        {/* ── DOM editorial copy ────────────────────────────── */}
        <div className="hero__overlay">
          <div className="hero__overlay-inner">
            <div className="hero__copy">
              <span className="eyebrow">Live shopping · India</span>

              <div className="hero__headline-stack">
                <h1 className="display hero__headline">
                  Live drops.<br />
                  Real sellers.<br />
                  Delivered to<br />
                  <em>your door.</em>
                </h1>
              </div>

              <p className="body-lg" style={{ maxWidth: 480 }}>
                India's live shopping marketplace. Watch sellers go live,
                shop drops in real time, pay securely via UPI.
              </p>

              <div className="hero__cta-row">
                <button className="btn-primary" type="button">Shop upcoming drops</button>
                <button className="btn-ghost" type="button">Sell on Any &amp; All</button>
              </div>

              <div className="hero__trust-row">
                <span>Secure payments via UPI</span>
                <span>Buyer protection</span>
                <span>Trusted sellers</span>
              </div>
            </div>

            {/* Right column is intentionally empty — the logo lives
                in the full-bleed canvas behind us. This div just holds
                the grid column open. */}
            <div aria-hidden />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroStage;
