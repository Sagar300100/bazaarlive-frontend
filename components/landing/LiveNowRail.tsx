import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Section 2 — "Live now."
 *
 * Replaces the old Bento. Abstract editorial live-card grid: hairline
 * borders, mono live prices that tick, LIVE dots, watcher counts.
 * NO photos, NO stock imagery, NO product cards in the gradient-blob
 * pattern. Pure typography + live-data primitives.
 *
 * Mock bids tick every 3.5s per card. V2 swaps to Firestore subscription.
 */

interface ShowData {
  show: string;
  category: string;
  startPrice: number;
  watching: number;
  /** Upcoming shows have a countdown rather than a live price. */
  upcomingIn?: string;
}

const SHOWS: ShowData[] = [
  { show: 'Sneaker Vault',  category: 'Streetwear', startPrice: 24400, watching: 2147 },
  { show: "Sumi's Sarees",  category: 'Heritage',   startPrice:  3200, watching:  412 },
  { show: 'Watch Hub',      category: 'Watches',    startPrice: 14000, watching:  893 },
  { show: 'Vinyl Circle',   category: 'Music',      startPrice:   890, watching:   89 },
  { show: 'Banaras Brands', category: 'Fashion',    startPrice:  2400, watching:  624 },
  { show: 'Mumbai Makers',  category: 'Local',      startPrice:     0, watching:    0, upcomingIn: '12m' },
];

const fmt = (n: number) => n.toLocaleString('en-IN');

export const LiveNowRail: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef    = useRef<HTMLDivElement>(null);

  const [prices, setPrices] = useState<number[]>(SHOWS.map(s => s.startPrice));

  // Mock bid ticking
  useEffect(() => {
    const interval = window.setInterval(() => {
      setPrices(prev => prev.map((p, i) => {
        if (SHOWS[i].upcomingIn) return p;
        return p + Math.floor(Math.random() * 250 + 50);
      }));
    }, 3500);
    return () => window.clearInterval(interval);
  }, []);

  // GSAP scroll-triggered cascade reveal
  useEffect(() => {
    if (!gridRef.current || !sectionRef.current) return;
    const cards = gridRef.current.querySelectorAll('.ln-card');
    if (cards.length === 0) return;

    gsap.set(cards, { opacity: 0, y: 40 });
    const tween = gsap.to(cards, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: 'power3.out',
      stagger: 0.08,
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 80%',
        once: true,
      },
    });
    return () => { tween.scrollTrigger?.kill(); tween.kill(); };
  }, []);

  return (
    <section ref={sectionRef} className="ln" id="live-now">
      <div className="ln__container">
        <div className="ln__head">
          <span className="eyebrow">Live now · India</span>
          <h2 className="ln__title">
            Sellers going live <em>right now</em>.
          </h2>
          <p className="ln__sub">
            Drops, live shows, and limited releases — all happening live across India.
          </p>
        </div>

        <div ref={gridRef} className="ln__grid">
          {SHOWS.map((s, i) => {
            const upcoming = !!s.upcomingIn;
            const livePrice = prices[i];
            return (
              <article key={s.show} className="ln-card">
                <div className="ln-card__top">
                  {upcoming ? (
                    <span className="ln-card__upcoming">
                      UPCOMING · IN {s.upcomingIn?.toUpperCase()}
                    </span>
                  ) : (
                    <span className="ln-card__live">
                      <span className="live-dot" />
                      LIVE NOW
                    </span>
                  )}
                  {!upcoming && (
                    <span className="ln-card__watching">
                      {s.watching.toLocaleString('en-IN')} watching
                    </span>
                  )}
                </div>

                <div className="ln-card__body">
                  <h3 className="ln-card__name">{s.show}</h3>
                  <span className="ln-card__category">{s.category.toUpperCase()}</span>
                </div>

                <div className="ln-card__price-row">
                  {upcoming ? (
                    <>
                      <span className="ln-card__price-label">Drops at showtime</span>
                      <span className="ln-card__price ln-card__price--soft">—</span>
                    </>
                  ) : (
                    <>
                      <span className="ln-card__price-label">Live price</span>
                      <span className="ln-card__price">
                        ₹{fmt(livePrice)} <span className="ln-card__trend">▲</span>
                      </span>
                    </>
                  )}
                </div>

                <button className="ln-card__cta" type="button">
                  {upcoming ? 'Remind me →' : 'Join live →'}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LiveNowRail;
