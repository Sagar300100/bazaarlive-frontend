import { useEffect, useRef, useState } from 'react';

/**
 * Returns a progress value 0..1 describing how far the user has scrolled
 * THROUGH a sticky/pinned section. Designed for hero pinning where the
 * outer section is, say, 120vh tall and the inner stage is 100vh sticky:
 *   - progress 0   = the section just hit the top of the viewport
 *   - progress 1   = the user has scrolled past the section's natural extent
 *
 * Uses requestAnimationFrame for smooth updates and reads the ref's
 * bounding rect rather than listening to scroll events directly — this
 * avoids the jank you get from binding state updates to every scroll tick.
 */
export function useScrollScene(ref: React.RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const compute = () => {
      const rect = el.getBoundingClientRect();
      const sectionHeight = rect.height;
      const vh = window.innerHeight;

      // Scrollable distance through the section (section height − one viewport)
      const scrollable = Math.max(sectionHeight - vh, 1);

      // How far past the top of the viewport the section's top has scrolled
      const passed = Math.min(Math.max(-rect.top, 0), scrollable);

      const p = passed / scrollable;
      setProgress(p);
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      rafRef.current = requestAnimationFrame(() => {
        compute();
        ticking = false;
      });
    };

    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [ref]);

  return progress;
}
