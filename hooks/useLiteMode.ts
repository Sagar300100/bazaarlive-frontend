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
 * V2 trigger rules — production minded:
 *   1. Explicit URL override:  ?lite=on  /  ?lite=off
 *   2. viewport ≤ 640px (real phones only)
 *
 * REMOVED prefers-reduced-motion check: Windows users with the system
 * "show animations" setting off were getting the static lite path on
 * desktop, which made the hero look broken. We now respect that
 * preference by toning down motion *inside* the R3F scene where it
 * matters (see CSS @media prefers-reduced-motion rules) rather than
 * skipping WebGL entirely.
 *
 * REMOVED checks (earlier revs):
 *   - navigator.deviceMemory < 4 — Chromium caps to 4 unreliably
 *   - 820px viewport threshold — caught narrow preview panes
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

    if (urlOverride === 'on')  return { lite: true,  reason: 'URL ?lite=on',                       diag };
    if (urlOverride === 'off') return { lite: false, reason: '',                                   diag };
    if (vw <= 640)             return { lite: true,  reason: `narrow viewport (${vw}px ≤ 640px)`,  diag };

    // Note: prefers-reduced-motion is intentionally NOT a lite trigger.
    // We still observe it for telemetry but no longer skip the R3F path.
    return { lite: false, reason: '', diag };
  });

  // No-op effect — kept for future capability refinement
  useEffect(() => {}, []);

  return state;
}
