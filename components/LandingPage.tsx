import React, { useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight, Smartphone, BadgeCheck, Wallet, TrendingUp,
  Footprints, Shirt, Watch, Sparkles, Cpu, Gem, Palette, Home as HomeIcon,
} from "lucide-react";

/* Social icons — inlined as SVG because the installed lucide-react
   (^1.21) predates these glyphs. */
const SocialIcon: React.FC<{ kind: "ig" | "yt" | "tw" | "li" }> = ({ kind }) => {
  const s = 14;
  if (kind === "ig") return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
  if (kind === "yt") return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 8.4c0-1.5-.3-2.5-.8-3-.7-.7-1.7-1-3.2-1H6c-1.5 0-2.5.3-3.2 1-.5.5-.8 1.5-.8 3v7.2c0 1.5.3 2.5.8 3 .7.7 1.7 1 3.2 1h12c1.5 0 2.5-.3 3.2-1 .5-.5.8-1.5.8-3V8.4z" />
      <path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" />
    </svg>
  );
  if (kind === "tw") return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" />
    </svg>
  );
};
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { Header } from "./Header";
import HeroStage from "./landing/HeroStage";
import LaunchLineup from "./landing/LaunchLineup";

import "../styles/brand.css";

gsap.registerPlugin(ScrollTrigger);

/* ══════════════════════════════════════════════
   LANDING PAGE — Any & All
   "The marketplace goes live."
   Premium royal-blue palette, matched to the wordmark.
   No auction language. No unproven claims. No photos.
   ══════════════════════════════════════════════ */

interface LandingPageProps {
  onLoginClick: () => void;
  onBecomeSellerClick: () => void;
  onNavigate: (page: string) => void;
  onNavigateToSellerHub: (page: "inventory" | "schedule_show" | "shows" | "home") => void;
  currentPage: string;
  onBack?: () => void;
}

/* ──────────────────────────────────────────────
   Section 3 — Categories (icon rail, NO photos)
   ────────────────────────────────────────────── */
const Categories: React.FC = () => {
  const cats = [
    { name: "Sneakers",     count: 12, Icon: Footprints },
    { name: "Fashion",      count: 21, Icon: Shirt },
    { name: "Watches",      count:  8, Icon: Watch },
    { name: "Heritage",     count:  9, Icon: Sparkles },
    { name: "Electronics",  count: 14, Icon: Cpu },
    { name: "Collectibles", count:  6, Icon: Gem },
    { name: "Beauty",       count:  5, Icon: Palette },
    { name: "Home",         count:  4, Icon: HomeIcon },
  ];

  return (
    <section className="cats">
      <div className="cats__container">
        <div className="cats__head">
          <div>
            <span className="eyebrow">Categories</span>
            <h2 className="cats__title">From sneakers to sarees.</h2>
            <p className="cats__sub">Every category, with sellers going live every week.</p>
          </div>
          <button className="cats__viewall" type="button">View all categories →</button>
        </div>

        <div className="cats__grid">
          {cats.map((c, i) => (
            <motion.div
              key={c.name}
              className="cats__item"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.04 }}
            >
              <span className="cats__icon">
                <c.Icon size={20} strokeWidth={1.4} />
              </span>
              <span className="cats__name">{c.name}</span>
              <span className="cats__count">{c.count} upcoming</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ──────────────────────────────────────────────
   Section 4 — How it works (glowing numbered steps)
   ────────────────────────────────────────────── */
const HowItWorks: React.FC = () => {
  const steps = [
    { n: "01", title: "Browse live shows",   body: "Find sellers streaming live in your category. Watch products in detail before you buy." },
    { n: "02", title: "Shop in real time",   body: "Tap to claim a drop, place a bid, or buy at the live price — all in seconds." },
    { n: "03", title: "Receive at your door", body: "Trusted delivery across India. Buyer protection on every confirmed order." },
  ];
  return (
    <section className="how">
      <div className="how__container">
        <div className="how__head">
          <span className="eyebrow">How it works</span>
          <h2 className="how__title">From live show to doorstep.</h2>
          <p className="how__sub">Three steps. No fine print.</p>
        </div>
        <div className="how__steps">
          <span className="how__line" aria-hidden />
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              className="how__step"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
            >
              <span className="how__num">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ──────────────────────────────────────────────
   Section 5 — For Sellers
   ────────────────────────────────────────────── */
const ForSellers: React.FC<{ onSell: () => void }> = ({ onSell }) => {
  const benefits = [
    { Icon: Smartphone, title: "Stream from any device",     body: "Phone, OBS or DSLR — your studio, your way." },
    { Icon: BadgeCheck, title: "Verified seller onboarding", body: "Every seller KYC'd before going live." },
    { Icon: Wallet,     title: "Fast payouts",               body: "Settled after every confirmed order — no long cycles." },
    { Icon: TrendingUp, title: "Built-in audience",          body: "Live categories and discovery surfaces — free." },
  ];

  return (
    <section className="sell">
      <div className="sell__container">
        <div className="sell__head">
          <span className="eyebrow">For sellers</span>
          <h2 className="sell__title">Sell live to all of India.</h2>
          <p className="sell__sub">
            A premium platform for sellers who want to be seen — with
            transparent fees, secure payments, and fast payouts after
            every confirmed order.
          </p>
          <button className="btn-primary" onClick={onSell} type="button">
            Become a seller <ArrowRight size={16} />
          </button>
        </div>

        <div className="sell__features">
          {benefits.map((b, i) => (
            <motion.div
              key={i}
              className="sell__feature"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
            >
              <div className="sell__feature-icon">
                <b.Icon size={20} strokeWidth={1.6} />
              </div>
              <div className="sell__feature-title">{b.title}</div>
              <div className="sell__feature-body">{b.body}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ──────────────────────────────────────────────
   Section 6 — Big CTA (glowing blue panel)
   ────────────────────────────────────────────── */
const BigCTA: React.FC<{ onPrimary: () => void; onSecondary: () => void }> = ({ onPrimary, onSecondary }) => (
  <section className="bcta">
    <div className="bcta__container">
      <motion.div
        className="bcta__panel"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
      >
        <img src="/assets/brand/any_all_A_mark_transparent.png" alt="" className="bcta__logo" />
        <h2 className="bcta__title">Ready when you are.</h2>
        <p className="bcta__sub">Be among the first to shop live. Launching in India · 2026.</p>
        <div className="bcta__row">
          <button className="btn-primary" onClick={onPrimary} type="button">
            Get early access
          </button>
          <button className="btn-ghost" onClick={onSecondary} type="button">
            Sell on Any &amp; All <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>
    </div>
  </section>
);

/* ──────────────────────────────────────────────
   Section 7 — Footer
   ────────────────────────────────────────────── */
const FtCol: React.FC<{ title: string; links: [string, string][]; onNavigate: (page: string) => void }> = ({ title, links, onNavigate }) => (
  <div>
    <div className="ft__col-title">{title}</div>
    <ul>
      {links.map(([label, page]) => (
        <li key={page}>
          <a
            href={`/${page}`}
            onClick={(e) => { e.preventDefault(); onNavigate(page); }}
          >
            {label}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

const Footer: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => (
  <footer className="ft">
    <div className="ft__container">
      <div className="ft__grid">
        <div>
          <div className="ft__brand">
            <img src="/assets/brand/any_all_A_mark_transparent.png" alt="Any & All" className="ft__mark" />
          </div>
          <p className="ft__tag">
            India's live shopping marketplace.<br />
            Made in India. For India.
          </p>
        </div>
        <FtCol title="COMPANY" onNavigate={onNavigate} links={[["About", "about"], ["Contact", "contact"]]} />
        <FtCol title="SELLERS" onNavigate={onNavigate} links={[["Become a Seller", "become-seller"], ["Pricing", "pricing"]]} />
        <FtCol title="LEGAL"   onNavigate={onNavigate} links={[["Terms", "terms"], ["Privacy", "privacy"], ["Refund Policy", "refund"]]} />
      </div>
      <div className="ft__bottom">
        <span>© {new Date().getFullYear()} Any&amp;All Private Limited · CIN U62090UP2026PTC235793</span>
        <div className="ft__socials">
          <button className="ft__social" type="button" aria-label="Instagram"><SocialIcon kind="ig" /></button>
          <button className="ft__social" type="button" aria-label="YouTube"><SocialIcon kind="yt" /></button>
          <button className="ft__social" type="button" aria-label="Twitter"><SocialIcon kind="tw" /></button>
          <button className="ft__social" type="button" aria-label="LinkedIn"><SocialIcon kind="li" /></button>
        </div>
        <span>Made in India</span>
      </div>
    </div>
  </footer>
);

/* ══════════════════════════════════════════════
   MAIN LANDING PAGE
   ══════════════════════════════════════════════ */
export const LandingPage: React.FC<LandingPageProps> = ({
  onLoginClick, onBecomeSellerClick, onNavigate, onNavigateToSellerHub, currentPage, onBack,
}) => {
  useEffect(() => {
    document.documentElement.classList.add("landing-modern");
    document.documentElement.classList.remove("landing-snap");
    return () => document.documentElement.classList.remove("landing-modern");
  }, []);

  return (
    <div className="brand-v2">
      <Header
        onNavigate={onNavigate}
        isLoggedIn={false}
        onLoginClick={onLoginClick}
        onLogout={() => {}}
        onSellClick={onBecomeSellerClick}
        onNavigateToSellerHub={onNavigateToSellerHub}
        currentPage={currentPage}
        onBack={onBack}
        bgColor="transparent"
        darkMode
      />

      {/* Section 1 — premium royal-blue brand stage */}
      <HeroStage />

      {/* Section 2 — Launch Lineup (3 onboarding cards; no fake live activity) */}
      <LaunchLineup />

      {/* Section 3 — Categories icon rail */}
      <Categories />

      {/* Section 4 — How it works */}
      <HowItWorks />

      {/* Section 5 — For sellers */}
      <ForSellers onSell={onBecomeSellerClick} />

      {/* Section 6 — Big CTA */}
      <BigCTA onPrimary={onLoginClick} onSecondary={onBecomeSellerClick} />

      {/* Section 7 — Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
};
