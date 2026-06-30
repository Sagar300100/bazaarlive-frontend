import React, { useEffect, useRef } from 'react';

/**
 * Soft radial glow that follows the cursor inside its parent container.
 * Used ONLY over the hero stage — cursor below the fold is plain.
 *
 * Implemented as a CSS gradient whose centre is driven by CSS custom
 * properties updated in a rAF loop. No React re-renders.
 */
export const CursorSpotlight: React.FC<{ targetRef: React.RefObject<HTMLElement | null> }> = ({ targetRef }) => {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    const el = elRef.current;
    if (!target || !el) return;

    let raf = 0;
    let pendingX = 50;
    let pendingY = 50;

    const onMove = (e: MouseEvent) => {
      const r = target.getBoundingClientRect();
      pendingX = ((e.clientX - r.left) / r.width)  * 100;
      pendingY = ((e.clientY - r.top)  / r.height) * 100;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          el.style.setProperty('--cx', pendingX + '%');
          el.style.setProperty('--cy', pendingY + '%');
          raf = 0;
        });
      }
    };

    const onLeave = () => {
      el.style.opacity = '0';
    };
    const onEnter = () => {
      el.style.opacity = '';
    };

    target.addEventListener('mousemove', onMove);
    target.addEventListener('mouseleave', onLeave);
    target.addEventListener('mouseenter', onEnter);
    return () => {
      target.removeEventListener('mousemove', onMove);
      target.removeEventListener('mouseleave', onLeave);
      target.removeEventListener('mouseenter', onEnter);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [targetRef]);

  return <div ref={elRef} className="cursor-spotlight" aria-hidden />;
};

export default CursorSpotlight;
