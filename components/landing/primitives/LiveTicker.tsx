import React from 'react';

export type TickerEventType = 'live_now' | 'new_drop' | 'live_bid' | 'sold' | 'going_live';

export interface TickerEvent {
  show: string;
  type: TickerEventType;
  amount?: number;
  watching?: number;
  startsIn?: string;
  age?: string;
}

/**
 * V1 mock feed. The mix here is deliberately diverse — auctions, drops,
 * sold notifications, live audience signals, anticipation — so the ticker
 * reads as the marketplace's pulse, not a bid stream.
 */
export const V1_MOCK_FEED: TickerEvent[] = [
  { show: 'Sneaker Vault',  type: 'live_now',   watching: 412, age: 'now' },
  { show: 'Ramp & Rang',    type: 'new_drop',   amount: 2400, age: '2s' },
  { show: 'Watch Hub',      type: 'live_bid',   amount: 14000, age: '4s' },
  { show: "Sumi's Sarees",  type: 'sold',       amount: 3200, age: '12s' },
  { show: 'Vinyl Circle',   type: 'live_now',   watching: 89, age: 'now' },
  { show: 'Banaras Brands', type: 'new_drop',   amount: 890, age: '18s' },
  { show: 'Kicks Only',     type: 'live_bid',   amount: 24400, age: '6s' },
  { show: 'Mumbai Makers',  type: 'going_live', startsIn: '2m' },
];

function formatLine(e: TickerEvent): { label: string; valueLabel: string; tail: string } {
  switch (e.type) {
    case 'live_now':
      return { label: 'LIVE NOW', valueLabel: `${e.watching ?? 0} watching`, tail: e.age ?? '' };
    case 'new_drop':
      return { label: 'NEW DROP', valueLabel: `₹${(e.amount ?? 0).toLocaleString('en-IN')}`, tail: e.age ?? '' };
    case 'live_bid':
      return { label: 'LIVE BID', valueLabel: `₹${(e.amount ?? 0).toLocaleString('en-IN')}`, tail: e.age ?? '' };
    case 'sold':
      return { label: 'SOLD',     valueLabel: `₹${(e.amount ?? 0).toLocaleString('en-IN')}`, tail: e.age ?? '' };
    case 'going_live':
      return { label: 'GOING LIVE', valueLabel: `in ${e.startsIn ?? ''}`, tail: '' };
  }
}

/**
 * Right-edge marketplace pulse. Fixed-position 6px column with a vertical
 * marquee of mono text lines. V2 will subscribe to Firestore; V1 cycles
 * the mock feed via CSS keyframe animation (no JS per-frame cost).
 *
 * The component renders the feed TWICE back-to-back so the keyframe
 * animation can loop seamlessly (translateY(-50%) at the end of the cycle
 * lands the second copy exactly where the first started).
 */
export const LiveTicker: React.FC<{ hidden?: boolean; feed?: TickerEvent[] }> = ({
  hidden = false,
  feed = V1_MOCK_FEED,
}) => (
  <aside className={`live-ticker ${hidden ? 'hidden' : ''}`} aria-hidden>
    <div className="live-ticker__inner">
      {[...feed, ...feed].map((e, i) => {
        const { label, valueLabel, tail } = formatLine(e);
        return (
          <div className="live-ticker__line" key={i}>
            <span className="accent">{label}</span>
            {'  ·  '}
            {e.show.toUpperCase()}
            {'  ·  '}
            {valueLabel}
            {tail && '  ·  ' + tail}
          </div>
        );
      })}
    </div>
  </aside>
);

/** Compact pill for lite mode — shows a single rotating event in the header. */
export const LiveStatusPill: React.FC<{ feed?: TickerEvent[] }> = ({ feed = V1_MOCK_FEED }) => {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    const t = window.setInterval(() => setIdx(i => (i + 1) % feed.length), 3500);
    return () => window.clearInterval(t);
  }, [feed.length]);
  const { label, valueLabel } = formatLine(feed[idx]);
  return (
    <span className="live-status-pill" aria-live="polite">
      <span className="live-dot" style={{ width: 6, height: 6 }} />
      <span>{label}</span>
      <span>·</span>
      <span>{feed[idx].show}</span>
      <span>·</span>
      <span>{valueLabel}</span>
    </span>
  );
};

export default LiveTicker;
