import { useState, useEffect } from 'react';

export interface LiteModeState {
  lite: boolean;
  /** Human-readable reason — empty when lite=false. */
  reason: string;
  /** Diagnostics for the debug overlay. */
  diag: {
    vw: number;
    vh: number;
    reducedMotion: boolean;
    deviceMemory: number | null;
    urlOverride: 'on' | 'off' | null;
  };
}

/**
 * "Lite" mode: render the calm, no-WebGL variant.
 *
 * V1 trigger rules (deliberately conservative — the prior rev was too
 * aggressive and forced desktop into lite mode unexpectedly):
 *   1. Explicit URL override:  ?lite=on  /  ?lite=off
 *   2. prefers-reduced-motion: reduce
 *   3. viewport ≤ 640px (real phones only; preview panes and tablets stay
 *      on the full path)
 *
 * REMOVED checks vs prior rev:
 *   - navigator.deviceMemory < 4 — Chromium caps this to 4 on some
 *     hardware, falsely triggering lite mode on perfectly capable laptops.
 *   - 820px viewport threshold — was matching narrow preview panes.
 *
 * Decided ONCE at mount; does not flip mid-session.
 */
export function useLiteMode(): LiteModeState {
  const [state] = useState<LiteModeState>(() => {
    if (typeof window === 'undefined') {
      return {
        lite: false,
        reason: '',
        diag: { vw: 0, vh: 0, reducedMotion: false, deviceMemory: null, urlOverride: null },
      };
    }

    const params = new URLSearchParams(window.location.search);
    const urlOverrideRaw = params.get('lite');
    const urlOverride: 'on' | 'off' | null =
      urlOverrideRaw === 'on' ? 'on' : urlOverrideRaw === 'off' ? 'off' : null;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const deviceMemory =
      typeof (navigator as any).deviceMemory === 'number'
        ? ((navigator as any).deviceMemory as number)
        : null;

    const diag = { vw, vh, reducedMotion, deviceMemory, urlOverride };

    if (urlOverride === 'on')  return { lite: true,  reason: 'URL ?lite=on',                diag };
    if (urlOverride === 'off') return { lite: false, reason: '',                            diag };
    if (reducedMotion)         return { lite: true,  reason: 'prefers-reduced-motion: reduce', diag };
    if (vw <= 640)             return { lite: true,  reason: `narrow viewport (${vw}px ≤ 640px)`, diag };

    return { lite: false, reason: '', diag };
  });

  // No-op effect — kept for future capability refinement
  useEffect(() => {}, []);

  return state;
}
