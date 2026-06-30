import React, { useEffect, useRef } from 'react';
import { Footprints, Sparkles, Watch, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Section 2 — "First drops coming soon."
 *
 * Pre-launch state of the marketplace. NO fake "LIVE NOW" labels,
 * NO fake live prices, NO fake watcher counts — we're not pretending
 * activity that doesn't exist. Three category-themed onboarding cards
 * with a single "Get notified" CTA per card.
 *
 * When real live streams exist (≥3 active shows), the host LandingPage
 * will swap this section out for a live grid. Until then, this is the
 * honest, premium pre-launch surface.
 */
interface DropCard {
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  name: string;
  body: string;
}

const DROPS: DropCard[] = [
  {
    Icon: Footprints,
    name: 'Sneakers & Streetwear',
    body: 'Limited drops, hyped pairs, and verified sellers.',
  },
  {
    Icon: Sparkles,
    name: 'Sarees & Heritage',
    body: 'Handpicked sellers for ethnic wear and traditional pieces.',
  },
  {
    Icon: Watch,
    name: 'Watches & Collectibles',
    body: 'Curated live drops for watches, accessories, and collectibles.',
  },
];

export const LaunchLineup: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gridRef.current || !sectionRef.current) return;
    const cards = gridRef.current.querySelectorAll('.ll-card');
    if (cards.length === 0) return;

    gsap.set(cards, { opacity: 0, y: 32 });
    const tween = gsap.to(cards, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: 'power3.out',
      stagger: 0.10,
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 78%',
        once: true,
      },
    });
    return () => { tween.scrollTrigger?.kill(); tween.kill(); };
  }, []);

  return (
    <section ref={sectionRef} className="ll" id="launch-lineup">
      <div className="ll__container">
        <div className="ll__head">
          <span className="eyebrow">Launch lineup · India</span>
          <h2 className="ll__title">First drops coming soon.</h2>
          <p className="ll__sub">
            We're onboarding verified sellers across India. Get early
            access to the first live drops before launch.
          </p>
        </div>

        <div ref={gridRef} className="ll__grid">
          {DROPS.map((d) => (
            <article key={d.name} className="ll-card">
              <div className="ll-card__icon">
                <d.Icon size={22} strokeWidth={1.6} />
              </div>
              <h3 className="ll-card__name">{d.name}</h3>
              <p className="ll-card__body">{d.body}</p>
              <button className="ll-card__cta" type="button">
                Get notified <ArrowRight size={14} style={{ display: 'inline', marginLeft: 4, verticalAlign: 'middle' }} />
              </button>
            </article>
          ))}
        </div>

        <p className="ll__note">
          <span className="live-dot" style={{ width: 6, height: 6 }} />
          Keep notifications on to be the first to know when we go live.
        </p>
      </div>
    </section>
  );
};

export default LaunchLineup;
