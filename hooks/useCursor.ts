import { useEffect, useRef } from 'react';

export interface CursorRef {
  /** Normalised cursor position, -1..1, relative to the element's bounding box (or viewport) */
  current: { x: number; y: number };
}

/**
 * Tracks the cursor position over either the whole viewport (no target ref)
 * or a specific element. Returns a ref — NOT state — so consumers can read
 * the value every frame without triggering React re-renders.
 *
 * Coordinates are normalised to [-1, 1] with (0, 0) at the centre. The
 * caller is responsible for any further scaling.
 */
export function useCursor(target?: React.RefObject<HTMLElement | null>): CursorRef {
  const cursor = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (target?.current) {
        const r = target.current.getBoundingClientRect();
        cursor.current.x = ((e.clientX - r.left) / r.width  - 0.5) * 2;
        cursor.current.y = ((e.clientY - r.top)  / r.height - 0.5) * 2;
      } else {
        cursor.current.x = (e.clientX / window.innerWidth  - 0.5) * 2;
        cursor.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [target]);

  return cursor;
}
