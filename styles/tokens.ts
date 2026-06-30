/**
 * Any & All — V1 design tokens
 *
 * Identity: "The marketplace goes live." (India's live shopping marketplace.)
 * Palette: 4 colours, role-locked. Do not introduce ad-hoc hex codes.
 * Type:    3 faces, strict roles, fallback chains in place so we can swap
 *          to paid faces (PP Editorial New, Söhne) without touching components.
 * Motion:  slow + weighted easing. premium = deliberate.
 */

// ───── Colour ────────────────────────────────────────
export const color = {
  ink:    '#0B1F3F',  // deep navy — text, base
  paper:  '#F8F5F0',  // warm ivory — surface
  amber:  '#C9923C',  // warm accent — verified, products
  bidRed: '#E63946',  // electric — LIVE / live prices ONLY

  inkSoft:        'rgba(11, 31, 63, 0.65)',
  inkFaint:       'rgba(11, 31, 63, 0.40)',
  hairline:       'rgba(11, 31, 63, 0.12)',
  hairlineStrong: 'rgba(11, 31, 63, 0.24)',

  paperWarm:  '#F2EDE3',
  paperShade: '#EDE6D8',

  // For 3D scenes only — slightly cooler than paper so the studio reads as a backdrop
  stageBackdrop: '#EAE3D4',
} as const;

// ───── Type ──────────────────────────────────────────
// V1 uses open-source faces. Paid families sit at the head of each chain so
// dropping them in later is zero-component-change.
export const font = {
  display: '"PP Editorial New", "Cormorant Garamond", "Tiempos Headline", Georgia, serif',
  body:    '"Söhne", "Inter", system-ui, -apple-system, sans-serif',
  mono:    '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
} as const;

export const fontSize = {
  display: 'clamp(56px, 9vw, 128px)',
  h1:      'clamp(40px, 5.5vw, 72px)',
  h2:      'clamp(28px, 3.5vw, 44px)',
  h3:      '22px',
  bodyLg:  '19px',
  body:    '16px',
  small:   '14px',
  micro:   '12px',
  mono:    '14px',
} as const;

export const fontWeight = {
  light:    300,
  regular:  400,
  medium:   500,
  semibold: 600,
  bold:     700,
} as const;

export const lineHeight = {
  display: 0.95,
  h1:      1.05,
  h2:      1.15,
  body:    1.55,
  micro:   1.4,
} as const;

export const letterSpacing = {
  display: '-0.035em',
  h1:      '-0.025em',
  h2:      '-0.015em',
  body:    '0',
  micro:   '0.06em',
  mono:    '0.04em',
} as const;

// ───── Spacing (4px base) ────────────────────────────
export const space = {
  s0: 4, s1: 8, s2: 12, s3: 16, s4: 24,
  s5: 32, s6: 48, s7: 64, s8: 96, s9: 128, s10: 192,
} as const;

// ───── Radii (editorial = mostly hairline) ───────────
export const radius = {
  r0: 0, r1: 2, r2: 4, r3: 8, r4: 12,
} as const;

// ───── Motion ────────────────────────────────────────
export const ease = {
  out:      'cubic-bezier(0.16, 1, 0.3, 1)',   // ease-out-quint
  inOut:    'cubic-bezier(0.7, 0, 0.3, 1)',
  strong:   'cubic-bezier(0.85, 0, 0.15, 1)',
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

export const dur = {
  fast: 180,
  base: 360,
  slow: 720,
  cine: 1400,
  line: 1200,
} as const;

// ───── Z-layers ──────────────────────────────────────
export const z = {
  canvas:  0,
  content: 10,
  ticker:  50,
  header:  100,
  curtain: 200,
} as const;

// ───── Allowed claims (V1) ───────────────────────────
// Copy reviewers: use only language from this list (or its public equivalent)
// in new components. No commission %, no "lowest in India", no buyer-KYC.
export const SAFE_CLAIMS = [
  'Verified seller onboarding',
  'Razorpay-powered checkout',
  'Secure payments',
  'Buyer protection',
  'Fast payouts after order confirmation',
  'Transparent seller fees',
  'Live streaming powered by 100ms',
  'Made in Meerut',
  'Built for India',
  'Launching 2026 · early access',
] as const;
