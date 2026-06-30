import React, { useEffect, useRef, useState } from 'react';
import { LiveDot } from './LiveDot';

interface OdometerProps {
  value: number;
  prefix?: string;
  suffix?: string;
  /** Pad to at least N integer digits (e.g. ₹24,400 with digits=6 → 024,400). Default: auto. */
  digits?: number;
  size?: 'sm' | 'md' | 'lg';
  trend?: 'up' | 'down' | null;
  live?: boolean;
  /** Insert commas Indian-style (1,23,456) or western (123,456). Default: indian. */
  format?: 'indian' | 'western' | 'plain';
}

const SIZE_PX = { sm: 14, md: 22, lg: 36 };

/** Format a positive integer with comma separators in the chosen style. */
function formatInteger(n: number, format: 'indian' | 'western' | 'plain'): string {
  const raw = Math.max(0, Math.floor(n)).toString();
  if (format === 'plain') return raw;
  if (format === 'western') return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  // Indian: last 3 digits, then 2-digit groups
  if (raw.length <= 3) return raw;
  const last3 = raw.slice(-3);
  const rest = raw.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return rest + ',' + last3;
}

/**
 * One column = one character slot. If the char is a digit, we render a
 * vertical stack 0..9 and translate it on value change. Non-digit chars
 * (commas, the rupee prefix) crossfade in place.
 */
const Slot: React.FC<{ char: string; size: 'sm' | 'md' | 'lg' }> = ({ char, size }) => {
  const isDigit = char >= '0' && char <= '9';
  const digit = isDigit ? Number(char) : null;
  const px = SIZE_PX[size];

  if (!isDigit) {
    return (
      <span
        style={{
          display: 'inline-block',
          fontSize: px,
          lineHeight: 1,
          minWidth: '0.5em',
          textAlign: 'center',
        }}
      >
        {char}
      </span>
    );
  }

  return (
    <span
      className="odometer__digit"
      style={{ fontSize: px, width: '0.62em' }}
    >
      <span
        className="odometer__digit-stack"
        style={{ transform: `translateY(-${(digit ?? 0)}em)` }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i}>{i}</span>
        ))}
      </span>
    </span>
  );
};

export const Odometer: React.FC<OdometerProps> = ({
  value,
  prefix = '',
  suffix,
  digits,
  size = 'md',
  trend = null,
  live = false,
  format = 'indian',
}) => {
  const text = formatInteger(value, format);
  const padded = digits && text.replace(/,/g, '').length < digits
    ? '0'.repeat(digits - text.replace(/,/g, '').length) + text
    : text;

  // Brief trend flash on value change
  const [flashTrend, setFlashTrend] = useState<typeof trend>(null);
  const prevValue = useRef(value);
  useEffect(() => {
    if (value !== prevValue.current) {
      setFlashTrend(value > prevValue.current ? 'up' : 'down');
      const t = window.setTimeout(() => setFlashTrend(null), 700);
      prevValue.current = value;
      return () => window.clearTimeout(t);
    }
  }, [value]);

  const shownTrend = flashTrend ?? trend;

  return (
    <span className="odometer" role="status" aria-live="polite">
      {live && <LiveDot size={size === 'lg' ? 9 : 7} />}
      {prefix && <Slot char={prefix} size={size} />}
      {padded.split('').map((c, i) => (
        <Slot key={i} char={c} size={size} />
      ))}
      {suffix && <Slot char={suffix} size={size} />}
      {shownTrend && (
        <span
          className="odometer__trend"
          style={{ opacity: flashTrend ? 1 : 0.55 }}
        >
          {shownTrend === 'up' ? '▲' : '▼'}
        </span>
      )}
    </span>
  );
};

export default Odometer;
