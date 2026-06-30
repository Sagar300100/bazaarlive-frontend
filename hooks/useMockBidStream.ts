import { useEffect, useState } from 'react';

export interface MockBidState {
  value: number;
  trend: 'up' | 'down' | null;
  show: string;
}

/**
 * V1 stand-in for the real Firestore bid subscription. Walks a single
 * "current live price" upward in random increments every 2–5 seconds so
 * the Odometer reads as alive. Replace with `useLiveData(showId)` in V2.
 *
 * Returns a stable object reference per tick. Components reading this
 * hook re-render on each update — keep the consumer scope small.
 */
export function useMockBidStream(opts?: { start?: number; show?: string }): MockBidState {
  const start = opts?.start ?? 24400;
  const show  = opts?.show  ?? 'Sneaker Vault';

  const [state, setState] = useState<MockBidState>({
    value: start,
    trend: null,
    show,
  });

  useEffect(() => {
    let stopped = false;

    const tick = () => {
      if (stopped) return;
      setState(prev => {
        const bump = 50 + Math.floor(Math.random() * 250);
        return {
          value: prev.value + bump,
          trend: 'up',
          show,
        };
      });
      const next = 2000 + Math.random() * 3000;
      timer = window.setTimeout(tick, next);
    };

    let timer = window.setTimeout(tick, 2000 + Math.random() * 1500);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [show]);

  return state;
}
