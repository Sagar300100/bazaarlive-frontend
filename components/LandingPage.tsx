import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Play, ArrowRight, Zap, Shield, Smartphone, BadgeCheck,
  Truck, Languages, IndianRupee, Sparkles,
  Footprints, Shirt, Watch, Gem, BookOpen, Home as HomeIcon,
  Cpu, Palette, Radio, Wallet, Users, TrendingUp,
} from "lucide-react";
import { Header } from "./Header";
import HeroScene3D, { type HeroSceneHandle } from "./HeroScene3D";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ══════════════════════════════════════════════
   LANDING PAGE — Any & All
   Pre-launch positioning: honest, no fake metrics
   Designed with UI/UX Pro Max principles
   Pattern: Vision Hero + Real-feature Bento
   ══════════════════════════════════════════════ */

interface LandingPageProps {
  onLoginClick: () => void;
  onBecomeSellerClick: () => void;
  onNavigate: (page: string) => void;
  onNavigateToSellerHub: (page: "inventory" | "schedule_show" | "shows" | "home") => void;
  currentPage: string;
  onBack?: () => void;
}

/* ── Design tokens ── */
const T = {
  blue:    "#2B6CB8",
  blueLt:  "#7BB8FF",
  blueDk:  "#1A4B8C",
  navy:    "#0F2A52",
  navyDk:  "#070D1B",
  cyan:    "#06B6D4",
  emerald: "#22C55E",
  amber:   "#F59E0B",
  rose:    "#F43F5E",
  violet:  "#8B5CF6",
  ink:     "#0F172A",
  inkSoft: "#475569",
  bg:      "#F8FAFC",
  bgWarm:  "#FAF7F2",
  card:    "#FFFFFF",
  border:  "#E2E8F0",
};

/* ══════════════════════════════════════════════
   ANIMATED AURORA GRADIENT MESH
══════════════════════════════════════════════ */
const AuroraBg: React.FC = () => (
  <div className="aurora-wrap" aria-hidden="true">
    <div className="aurora-blob blob-1" />
    <div className="aurora-blob blob-2" />
    <div className="aurora-blob blob-3" />
  </div>
);

/* ══════════════════════════════════════════════
   PHONE MOCK with parallax tilt
══════════════════════════════════════════════ */
const PhoneMock: React.FC<{ tilt?: { x: number; y: number } }> = ({ tilt = { x: 0, y: 0 } }) => (
  <div
    style={{
      position: "relative",
      width: 280, height: 580,
      borderRadius: 44,
      border: "8px solid rgba(15,42,82,0.7)",
      background: "#070D1B",
      overflow: "hidden",
      boxShadow: "0 50px 120px rgba(15,42,82,0.45), 0 20px 60px rgba(43,108,184,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
      transform: `perspective(1200px) rotateY(${tilt.x}deg) rotateX(${-tilt.y}deg)`,
      transition: "transform 0.25s ease-out",
    }}
  >
    <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", width: 70, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.12)", zIndex: 20 }} />

    <img
      src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80&auto=format&fit=crop"
      alt=""
      style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.75 }}
    />
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(7,13,27,0.15) 0%, rgba(7,13,27,0.05) 30%, rgba(7,13,27,0.7) 75%, rgba(7,13,27,0.97) 100%)" }} />

    <div style={{ position: "absolute", top: 38, left: 14, right: 14, display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(244,63,94,0.95)", padding: "5px 10px", borderRadius: 6, fontWeight: 800, fontSize: 11, color: "white", letterSpacing: 0.4 }}>
        <span style={{ width: 6, height: 6, background: "white", borderRadius: "50%", animation: "pulse 1.4s infinite" }} />
        LIVE
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(0,0,0,0.55)", padding: "5px 10px", borderRadius: 16, fontSize: 11, color: "white", fontWeight: 600 }}>
        <Radio size={11} /> Streaming
      </div>
    </div>

    <div style={{ position: "absolute", bottom: 16, left: 14, right: 14, zIndex: 10, color: "white" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, ${T.blueLt}, ${T.blue})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, border: "2px solid white", fontFamily: "Outfit, sans-serif" }}>SV</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Sneaker Vault</div>
          <div style={{ fontSize: 11, opacity: 0.75 }}>Travis Scott × Jordan 1</div>
        </div>
      </div>
      <div style={{ background: "rgba(255,255,255,0.13)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 14, padding: 12 }}>
        <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 2 }}>Live bid</div>
        <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "Outfit, sans-serif", marginBottom: 8 }}>₹24,999</div>
        <div style={{ background: T.blue, padding: "10px 0", borderRadius: 10, textAlign: "center", fontSize: 13, fontWeight: 700 }}>Place Bid</div>
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════
   SECTION TITLE
══════════════════════════════════════════════ */
const SectionTitle: React.FC<{ eyebrow: string; title: React.ReactNode; sub: string; light?: boolean }> = ({ eyebrow, title, sub, light }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.6 }}
    className="section-title"
  >
    <span className="eyebrow" style={{ background: light ? "rgba(255,255,255,0.1)" : `${T.blue}15`, color: light ? T.blueLt : T.blue }}>
      {eyebrow}
    </span>
    <h2 style={{ color: light ? "white" : T.ink }}>{title}</h2>
    <p style={{ color: light ? "rgba(255,255,255,0.7)" : T.inkSoft }}>{sub}</p>
  </motion.div>
);

/* ══════════════════════════════════════════════
   HERO  — centered text layout sitting OVER the
   sticky 3D scene (which lives in the stage wrap)
══════════════════════════════════════════════ */
const Hero: React.FC<{ onPrimary: () => void; onSecondary: () => void }> = ({ onPrimary, onSecondary }) => {
  return (
    <section className="lp-hero lp-hero-centered" style={{ position: "relative", color: "white" }}>
      <div className="lp-container hero-grid-centered">
        <div className="hero-copy hero-copy-centered">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="status-pill"
          >
            <span className="status-dot" />
            Early access — Launching in India
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="hero-title"
          >
            Bid.<br />
            <span className="hero-gradient-text">Win.</span><br />
            Get it Live.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="hero-sub"
          >
            India's first live-auction marketplace.
            Watch sellers stream live, bid in seconds, pay via UPI.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="hero-cta-row"
          >
            <button className="cta-primary" onClick={onPrimary}>
              <Play size={16} fill="white" stroke="white" /> Get Early Access
            </button>
            <button className="cta-ghost" onClick={onSecondary}>
              Sell on Any & All <ArrowRight size={16} />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="hero-built-on"
          >
            <span className="built-label">BUILT ON</span>
            <div className="built-stack">
              <span>Razorpay</span>
              <span className="built-sep" />
              <span>100ms</span>
              <span className="built-sep" />
              <span>Google Cloud</span>
              <span className="built-sep" />
              <span>Firebase</span>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
};

/* ══════════════════════════════════════════════
   "WHAT WE'RE BUILDING" BENTO
══════════════════════════════════════════════ */
const Bento: React.FC = () => {
  const items: Array<{
    span?: "lg" | "wide";
    bg: string;
    color: string;
    iconBg?: string;
    iconColor?: string;
    Icon?: React.ComponentType<any>;
    title: string;
    body: string;
    children?: React.ReactNode;
  }> = [
    {
      span: "lg",
      bg: `linear-gradient(135deg, ${T.blue}, ${T.cyan})`,
      color: "white",
      Icon: Radio,
      title: "Live-streamed auctions",
      body: "Sub-100ms bidding. Watch sellers showcase products, ask questions live, win in seconds.",
    },
    {
      bg: T.card, color: T.ink,
      iconBg: `${T.emerald}1A`, iconColor: T.emerald, Icon: Shield,
      title: "Razorpay-secured escrow",
      body: "Money held safely with India's most trusted gateway. Released only when you confirm.",
    },
    {
      bg: T.card, color: T.ink,
      iconBg: `${T.amber}1A`, iconColor: T.amber, Icon: IndianRupee,
      title: "UPI-native checkout",
      body: "Pay in seconds — UPI, cards, or net banking. No friction, no hidden fees.",
    },
    {
      span: "wide",
      bg: T.navy, color: "white",
      title: "", body: "",
      children: (
        <div className="bento-stack-row">
          <div className="stack-item">
            <div className="stack-name">Razorpay</div>
            <div className="stack-role">Payments + escrow</div>
          </div>
          <div className="stack-item">
            <div className="stack-name">100ms</div>
            <div className="stack-role">Sub-100ms live video</div>
          </div>
          <div className="stack-item">
            <div className="stack-name">Google Cloud</div>
            <div className="stack-role">Voice + AI hosts</div>
          </div>
          <div className="stack-item">
            <div className="stack-name">Firebase</div>
            <div className="stack-role">Realtime data</div>
          </div>
        </div>
      ),
    },
    {
      bg: T.card, color: T.ink,
      iconBg: `${T.violet}1A`, iconColor: T.violet, Icon: BadgeCheck,
      title: "PAN + GST verified sellers",
      body: "Every seller KYC'd before they can go live. No fake stores, no scams.",
    },
    {
      bg: T.card, color: T.ink,
      iconBg: `${T.rose}1A`, iconColor: T.rose, Icon: Truck,
      title: "Pan-India delivery",
      body: "From Tier-1 metros to Tier-3 towns. Tracked shipping in 3-7 days.",
    },
  ];

  const sectionRef = useRef<HTMLElement>(null);
  const gridRef    = useRef<HTMLDivElement>(null);

  /* ── 3D CARD FLIP-IN as user enters the section ──
     Each card starts rotated 60° on Y and pushed back in Z,
     then rotates flat & comes forward — like cards being
     dealt onto a table from a pile. */
  useEffect(() => {
    if (!gridRef.current || !sectionRef.current) return;
    const cards = gridRef.current.querySelectorAll(".bento-card");
    if (cards.length === 0) return;

    gsap.set(gridRef.current, { perspective: 1500 });
    const tween = gsap.fromTo(cards,
      { rotationY: (i) => (i % 2 === 0 ? -55 : 55), rotationX: -25, z: -500, opacity: 0, scale: 0.85 },
      {
        rotationY: 0, rotationX: 0, z: 0, opacity: 1, scale: 1,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          end: "top 20%",
          scrub: 1,
        },
      }
    );
    return () => { tween.scrollTrigger?.kill(); tween.kill(); };
  }, []);

  return (
    <section ref={sectionRef} className="lp-section section-pad" style={{ background: T.bg }}>
      <div className="lp-container">
        <SectionTitle
          eyebrow="WHAT WE'RE BUILDING"
          title={<>Live commerce, rebuilt for <em style={{ fontStyle: "normal", background: `linear-gradient(135deg, ${T.blue}, ${T.cyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Bharat.</em></>}
          sub="Real auctions. Real protection. Real sellers. Nothing fake."
        />
        <div ref={gridRef} className="bento-grid">
          {items.map((c, i) => (
            <div
              key={i}
              className={`bento-card bento-${c.span || "sm"}`}
              style={{ background: c.bg, color: c.color }}
            >
              {c.children || (
                <>
                  {c.Icon && (c.span === "lg" ? (
                    <c.Icon size={40} strokeWidth={1.6} />
                  ) : (
                    <div className="icon-chip" style={{ background: c.iconBg, color: c.iconColor }}>
                      <c.Icon size={22} strokeWidth={1.8} />
                    </div>
                  ))}
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ══════════════════════════════════════════════
   CATEGORIES — real product photos
══════════════════════════════════════════════ */
const Categories: React.FC = () => {
  const cats = [
    { name: "Sneakers",     Icon: Footprints, img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80&auto=format&fit=crop" },
    { name: "Fashion",      Icon: Shirt,      img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500&q=80&auto=format&fit=crop" },
    { name: "Watches",      Icon: Watch,      img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80&auto=format&fit=crop" },
    { name: "Electronics",  Icon: Cpu,        img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80&auto=format&fit=crop" },
    { name: "Collectibles", Icon: Gem,        img: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=500&q=80&auto=format&fit=crop" },
    { name: "Beauty",       Icon: Palette,    img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80&auto=format&fit=crop" },
    { name: "Books",        Icon: BookOpen,   img: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500&q=80&auto=format&fit=crop" },
    { name: "Home",         Icon: HomeIcon,   img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80&auto=format&fit=crop" },
  ];
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef    = useRef<HTMLDivElement>(null);

  /* ── BURST FROM CENTER  (gift-box opening) ──
     Tiles start collapsed at the center, rotated and scaled to 0,
     then "explode" outward to their grid slots as the user scrolls
     through the section. Closer-to-center tiles unfold first. */
  useEffect(() => {
    if (!sectionRef.current || !gridRef.current) return;
    const tiles = gridRef.current.querySelectorAll(".cat-tile-v2");
    if (tiles.length === 0) return;

    gsap.set(gridRef.current, { perspective: 1400 });
    const tween = gsap.fromTo(tiles,
      { scale: 0.05, opacity: 0, rotationY: 120, rotationX: -60, z: -800, transformOrigin: "50% 50% -200px" },
      {
        scale: 1, opacity: 1, rotationY: 0, rotationX: 0, z: 0,
        ease: "power3.out",
        stagger: { from: "center", each: 0.09, grid: [2, 4] },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          end: "top 15%",
          scrub: 1,
        },
      }
    );
    return () => { tween.scrollTrigger?.kill(); tween.kill(); };
  }, []);

  return (
    <section ref={sectionRef} className="lp-section section-pad" style={{ background: T.bgWarm, perspective: 1400 }}>
      <div className="lp-container">
        <SectionTitle
          eyebrow="CATEGORIES"
          title="From sneakers to sarees."
          sub="The auction categories we're launching with."
        />
        <div ref={gridRef} className="cat-grid">
          {cats.map((c, i) => (
            <button key={i} className="cat-tile-v2">
              <div className="cat-img-wrap">
                <img src={c.img} alt="" loading="lazy" />
                <div className="cat-overlay" />
              </div>
              <div className="cat-meta">
                <div className="cat-icon"><c.Icon size={20} strokeWidth={2} /></div>
                <div className="cat-name-v2">{c.name}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ══════════════════════════════════════════════
   HOW IT WORKS — 3 step
══════════════════════════════════════════════ */
const HowItWorks: React.FC = () => {
  const steps = [
    { n: "01", title: "Browse live streams",   body: "Find sellers streaming live in your category. Watch products in detail before bidding.", color: T.cyan },
    { n: "02", title: "Bid in real-time",       body: "Place bids with one tap. Watch others bid live. Win the auction, pay via UPI.",       color: T.blue },
    { n: "03", title: "Receive at your door",   body: "Verified delivery in 3-7 days. Money released to seller only after you confirm.",     color: T.emerald },
  ];
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef    = useRef<HTMLDivElement>(null);

  /* ── Steps pop up sequentially with bouncy step-numbers ──
     Cards rise from below with depth; each number spins in. */
  useEffect(() => {
    if (!gridRef.current || !sectionRef.current) return;
    const cards = gridRef.current.querySelectorAll(".step-card");
    const nums  = gridRef.current.querySelectorAll(".step-num");

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 75%",
        end: "top 25%",
        scrub: 1,
      }
    });
    tl.fromTo(cards,
      { y: 120, opacity: 0, scale: 0.85, rotateX: -25 },
      { y: 0, opacity: 1, scale: 1, rotateX: 0, ease: "power3.out", stagger: 0.15 },
      0
    );
    tl.fromTo(nums,
      { rotation: -180, scale: 0 },
      { rotation: 0, scale: 1, ease: "back.out(2)", stagger: 0.15 },
      0
    );
    return () => { tl.scrollTrigger?.kill(); tl.kill(); };
  }, []);

  return (
    <section ref={sectionRef} className="lp-section section-pad" style={{ background: T.bg }}>
      <div className="lp-container">
        <SectionTitle
          eyebrow="HOW IT WORKS"
          title="From stream to doorstep."
          sub="Three steps. Zero fine print."
        />
        <div ref={gridRef} className="steps-grid" style={{ perspective: 1400 }}>
          {steps.map((s, i) => (
            <div
              key={i}
              className="step-card"
            >
              <div className="step-num" style={{ background: `${s.color}15`, color: s.color }}>{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ══════════════════════════════════════════════
   FOR SELLERS — pitch to sellers (real)
══════════════════════════════════════════════ */
const ForSellers: React.FC<{ onSell: () => void }> = ({ onSell }) => {
  const benefits = [
    { Icon: Smartphone, title: "Stream from your phone",     body: "Built-in OBS-quality streaming. No setup, no studio." },
    { Icon: Sparkles,   title: "AI host that boosts bids",   body: "Optional AI co-host runs your auction in 12 Indian languages." },
    { Icon: Wallet,     title: "Get paid instantly",          body: "UPI/bank settlement within 24 hours of every winning bid." },
    { Icon: TrendingUp, title: "Built-in audience growth",    body: "Categories, recommendations, and discovery surface — for free." },
  ];
  const sectionRef  = useRef<HTMLElement>(null);
  const copyRef     = useRef<HTMLDivElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);

  /* ── Headline reveals + benefit cards cascade in 3D from right ── */
  useEffect(() => {
    if (!sectionRef.current) return;
    const benefits = benefitsRef.current?.querySelectorAll(".seller-benefit") ?? [];
    const copy     = copyRef.current?.children ?? [];

    gsap.set([benefitsRef.current, copyRef.current], { perspective: 1400 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 75%",
        end: "center 35%",
        scrub: 1,
      },
    });
    tl.fromTo(copy,
      { x: -80, opacity: 0, rotationY: 25 },
      { x: 0, opacity: 1, rotationY: 0, ease: "power3.out", stagger: 0.08 },
      0
    );
    tl.fromTo(benefits,
      { x: 220, opacity: 0, rotationY: -55, scale: 0.85 },
      { x: 0, opacity: 1, rotationY: 0, scale: 1, ease: "power3.out", stagger: 0.14 },
      0.1
    );
    return () => { tl.scrollTrigger?.kill(); tl.kill(); };
  }, []);

  return (
    <section ref={sectionRef} className="lp-section section-pad" style={{ background: T.navyDk, color: "white", overflow: "hidden", position: "relative" }}>
      <AuroraBg />
      <div className="lp-container" style={{ position: "relative", zIndex: 2 }}>
        <div className="seller-grid">
          <div ref={copyRef} className="seller-copy">
            <span className="eyebrow" style={{ background: "rgba(255,255,255,0.1)", color: T.blueLt }}>FOR SELLERS</span>
            <h2 className="seller-h2">
              Sell live<br />
              to all of <span className="hero-gradient-text">India.</span>
            </h2>
            <p className="seller-p">Lowest commission in India. Instant UPI payouts. Reach a national audience without a single ad spend.</p>
            <button className="cta-primary" onClick={onSell}>
              Become a Seller <ArrowRight size={16} />
            </button>
          </div>

          <div ref={benefitsRef} className="seller-benefits">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="seller-benefit"
              >
                <div className="seller-benefit-icon">
                  <b.Icon size={22} strokeWidth={1.8} />
                </div>
                <div>
                  <div className="seller-benefit-title">{b.title}</div>
                  <div className="seller-benefit-body">{b.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ══════════════════════════════════════════════
   BIG CTA — early access
══════════════════════════════════════════════ */
const BigCTA: React.FC<{ onPrimary: () => void; onSecondary: () => void }> = ({ onPrimary, onSecondary }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef   = useRef<HTMLHeadingElement>(null);

  /* ── Title words assemble from scattered chaos ── */
  useEffect(() => {
    if (!titleRef.current || !sectionRef.current) return;
    const words = titleRef.current.querySelectorAll(".cta-word");
    if (words.length === 0) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 80%",
        end: "top 30%",
        scrub: 1,
      },
    });
    tl.fromTo(words,
      {
        y:           (i) => (i % 2 === 0 ? -180 : 180),
        x:           (i) => (i % 3 === 0 ? -120 : 120),
        opacity:     0,
        rotate:      (i) => (i % 2 === 0 ? -25 : 25),
        scale:       0.4,
        filter:      "blur(20px)",
      },
      {
        y: 0, x: 0, opacity: 1, rotate: 0, scale: 1, filter: "blur(0px)",
        ease: "power3.out",
        stagger: 0.08,
      }
    );
    return () => { tl.scrollTrigger?.kill(); tl.kill(); };
  }, []);

  return (
  <section ref={sectionRef} className="lp-section" style={{ padding: "120px 0", position: "relative", overflow: "hidden", background: T.navy }}>
    <AuroraBg />
    <div className="lp-container" style={{ position: "relative", zIndex: 2 }}>
      <div className="cta-block">
        <h2 ref={titleRef} className="cta-title">
          <span className="cta-word">Ready</span>{" "}
          <span className="cta-word">when</span>
          <br />
          <span className="hero-gradient-text">
            <span className="cta-word">you</span>{" "}
            <span className="cta-word">are.</span>
          </span>
        </h2>
        <p className="cta-sub">Be among the first to bid live. Join early access.</p>
        <div className="hero-cta-row" style={{ justifyContent: "center" }}>
          <button className="cta-primary" onClick={onPrimary}>
            <Play size={16} fill="white" stroke="white" /> Get Early Access
          </button>
          <button className="cta-ghost" onClick={onSecondary}>
            Sell on Any & All <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  </section>
  );
};

/* ══════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════ */
const Footer: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => (
  <footer style={{ background: T.navyDk, color: "white", padding: "60px 0 30px" }}>
    <div className="lp-container">
      <div className="ft-grid">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg, ${T.blueLt}, ${T.blue})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, fontFamily: "Outfit, sans-serif" }}>A</div>
            <strong style={{ fontSize: 18, fontFamily: "Outfit, sans-serif" }}>Any &amp; All</strong>
          </div>
          <p style={{ opacity: 0.55, fontSize: 13, lineHeight: 1.6, maxWidth: 260 }}>India's live commerce marketplace. Made in Meerut.</p>
        </div>
        <FtCol title="Company" onNavigate={onNavigate} links={[["About", "about"], ["Contact", "contact"]]} />
        <FtCol title="Sellers" onNavigate={onNavigate} links={[["Become a Seller", "become-seller"], ["Pricing", "pricing"]]} />
        <FtCol title="Legal"   onNavigate={onNavigate} links={[["Terms", "terms"], ["Privacy", "privacy"], ["Refund Policy", "refund"]]} />
      </div>
      <div className="ft-bottom">
        <span style={{ opacity: 0.45, fontSize: 12 }}>© {new Date().getFullYear()} Any&amp;All Private Limited · CIN U62090UW2026PTC253793</span>
        <span style={{ opacity: 0.45, fontSize: 12 }}>Made in India</span>
      </div>
    </div>
  </footer>
);

// Each link is a [label, pageKey] tuple so the visible text and the route can
// diverge (e.g. "Refund Policy" → "refund"). Clicking calls onNavigate which
// is wired through to App.tsx's router.
const FtCol: React.FC<{ title: string; links: [string, string][]; onNavigate: (page: string) => void }> = ({ title, links, onNavigate }) => (
  <div>
    <div style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 700, marginBottom: 14, opacity: 0.65 }}>{title.toUpperCase()}</div>
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 9 }}>
      {links.map(([label, page]) => (
        <li key={page}>
          <a
            href={`/${page}`}
            onClick={(e) => { e.preventDefault(); onNavigate(page); }}
            style={{ color: "white", textDecoration: "none", fontSize: 14, opacity: 0.75, cursor: "pointer" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.75"; }}
          >
            {label}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

/* ══════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════ */
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Rubik:wght@300;400;500;600;700&display=swap');

.lp-container { max-width: 1240px; margin: 0 auto; padding: 0 24px; position: relative; }
.section-pad { padding: 100px 0; }

/* HERO */
.lp-hero { min-height: 100vh; padding-top: 90px; padding-bottom: 60px; display: flex; align-items: center; position: relative; }

/* ── STAGE: 3D backdrop that persists across Hero + Bento ── */
.lp-stage { position: relative; }
.lp-stage-scene {
  position: sticky; top: 0;
  width: 100%; height: 100vh;
  z-index: 0;
  background: linear-gradient(180deg, #0B1F3F 0%, #0F2A52 60%, #0A1B3A 100%);
  pointer-events: none;
  overflow: hidden;
}
.lp-stage-content {
  position: relative; z-index: 2;
  margin-top: -100vh;          /* pull content up over the sticky scene */
}
/* Centered hero text over the 3D scene */
.lp-hero-centered { background: transparent !important; min-height: 100vh; padding-top: 110px; padding-bottom: 60px; display: flex; align-items: center; justify-content: center; text-align: center; }
.hero-grid-centered { display: flex; justify-content: center; }
.hero-copy-centered { max-width: 760px; margin: 0 auto; }
.hero-copy-centered .hero-cta-row { justify-content: center; }
.hero-copy-centered .hero-built-on  { justify-content: center; }
.hero-copy-centered .status-pill    { margin-left: auto; margin-right: auto; }
.hero-copy-centered .hero-title     { font-size: clamp(64px, 9vw, 128px); }
.hero-copy-centered .hero-sub       { margin-left: auto; margin-right: auto; }

/* Bento layered over the 3D scene — dark glass treatment */
.lp-stage .lp-section { background: transparent !important; }
.lp-stage .section-title h2 { color: white !important; }
.lp-stage .section-title p  { color: rgba(255,255,255,0.72) !important; }
.lp-stage .section-title .eyebrow { background: rgba(255,255,255,0.10) !important; color: #7BB8FF !important; }
.lp-stage .bento-card {
  background: rgba(15,42,82,0.55) !important;
  border: 1px solid rgba(255,255,255,0.10) !important;
  color: white !important;
  backdrop-filter: blur(14px);
}
.lp-stage .bento-card p { color: rgba(255,255,255,0.78) !important; opacity: 1; }
.lp-stage .bento-card h3 { color: white !important; }
.lp-stage .bento-lg { background: linear-gradient(135deg, rgba(43,108,184,0.85), rgba(6,182,212,0.75)) !important; }
.lp-stage .bento-wide { background: rgba(7,13,27,0.78) !important; }

.hero-dots {
  position: absolute; inset: 0; pointer-events: none; z-index: 1;
  background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
  background-size: 32px 32px;
}
.hero-grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 64px; align-items: center; position: relative; z-index: 2; }
.hero-copy { max-width: 580px; }

.status-pill {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 8px 14px; border-radius: 999px;
  background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.14);
  backdrop-filter: blur(16px);
  font-size: 13px; color: rgba(255,255,255,0.92); font-weight: 500;
  margin-bottom: 28px;
}
.status-dot { width: 8px; height: 8px; background: ${T.emerald}; border-radius: 50%; box-shadow: 0 0 14px ${T.emerald}; animation: pulse 2s infinite; }

.hero-title {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(56px, 8vw, 108px); line-height: 0.95; font-weight: 900;
  letter-spacing: -0.04em; margin: 0 0 28px; color: white;
}
.hero-gradient-text {
  background: linear-gradient(135deg, ${T.blueLt} 0%, ${T.cyan} 100%);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}
.hero-sub { font-size: clamp(16px, 1.4vw, 19px); line-height: 1.65; color: rgba(255,255,255,0.75); max-width: 520px; margin: 0 0 36px; }
.hero-cta-row { display: flex; gap: 14px; flex-wrap: wrap; }

.cta-primary {
  background: #FFFFFF; color: ${T.navy};
  border: none; padding: 16px 28px; border-radius: 14px;
  font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer;
  display: inline-flex; align-items: center; gap: 10px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.35);
  transition: box-shadow 220ms ease, transform 220ms ease;
}
.cta-primary:hover { box-shadow: 0 18px 44px rgba(0,0,0,0.45); transform: translateY(-2px); }
.cta-primary svg { fill: ${T.navy} !important; stroke: ${T.navy} !important; }
.cta-ghost {
  background: rgba(255,255,255,0.08); color: white; border: 1px solid rgba(255,255,255,0.18);
  padding: 16px 28px; border-radius: 14px;
  font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 600; cursor: pointer;
  display: inline-flex; align-items: center; gap: 10px;
  backdrop-filter: blur(12px); transition: background 220ms ease, border-color 220ms ease;
}
.cta-ghost:hover { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.32); }

.hero-built-on { margin-top: 44px; display: flex; align-items: center; gap: 16px; color: white; flex-wrap: wrap; }
.built-label { font-size: 11px; font-weight: 700; letter-spacing: 2px; opacity: 0.6; }
.built-stack { display: flex; align-items: center; gap: 14px; font-family: 'Outfit', sans-serif; font-weight: 600; font-size: 14px; opacity: 0.85; flex-wrap: wrap; }
.built-sep { width: 4px; height: 4px; border-radius: 50%; background: rgba(255,255,255,0.3); }

/* HERO PHONE */
.hero-phone { position: relative; display: flex; justify-content: center; align-items: center; }
.hero-phone-3d { width: 100%; height: 640px; max-width: 560px; }
.phone-glow {
  position: absolute; width: 460px; height: 700px;
  background: radial-gradient(circle, rgba(43,108,184,0.55), transparent 65%);
  filter: blur(80px); pointer-events: none; z-index: 0;
}
.float-card {
  position: absolute; background: rgba(255,255,255,0.95); backdrop-filter: blur(20px);
  padding: 12px 16px; border-radius: 16px; display: flex; align-items: center; gap: 12px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.25); color: ${T.ink}; z-index: 10;
}
.float-bid { top: 22%; left: -8%; }
.float-payment { bottom: 22%; right: -6%; }
.float-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }

/* AURORA */
.aurora-wrap { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.aurora-blob { position: absolute; border-radius: 50%; filter: blur(70px); animation: floatAurora 18s ease-in-out infinite; }
.blob-1 { width: 620px; height: 620px; top: -180px; left: -160px; background: radial-gradient(circle, rgba(43,108,184,0.55), transparent 60%); }
.blob-2 { width: 720px; height: 720px; top: 18%; right: -220px; background: radial-gradient(circle, rgba(6,182,212,0.45), transparent 60%); animation-delay: -6s; }
.blob-3 { width: 560px; height: 560px; bottom: -200px; left: 32%; background: radial-gradient(circle, rgba(123,184,255,0.55), transparent 60%); animation-delay: -12s; }
@keyframes floatAurora {
  0%,100% { transform: translate(0,0) scale(1); }
  33% { transform: translate(50px,-40px) scale(1.08); }
  66% { transform: translate(-40px,30px) scale(0.94); }
}
@keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.55; transform: scale(0.85); } }
@media (prefers-reduced-motion: reduce) { .aurora-blob { animation: none; } .status-dot { animation: none; } }

/* SECTION TITLE */
.section-title { text-align: center; max-width: 760px; margin: 0 auto 60px; }
.eyebrow { display: inline-block; padding: 6px 14px; border-radius: 999px; font-size: 11px; letter-spacing: 2px; font-weight: 700; margin-bottom: 18px; }
.section-title h2 { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: clamp(36px, 5vw, 64px); line-height: 1.05; letter-spacing: -0.025em; margin: 0 0 16px; }
.section-title p { font-size: 18px; line-height: 1.55; margin: 0; }

/* BENTO */
.bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 1140px; margin: 0 auto; }
.bento-card {
  border-radius: 24px; padding: 32px; min-height: 220px;
  display: flex; flex-direction: column; justify-content: flex-start;
  border: 1px solid ${T.border};
  transition: transform 250ms ease, box-shadow 250ms ease;
  position: relative; overflow: hidden;
}
.bento-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(15,42,82,0.12); }
.bento-card h3 { font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 22px; margin: 18px 0 8px; line-height: 1.25; }
.bento-card p { font-size: 14px; line-height: 1.6; margin: 0; opacity: 0.78; }
.bento-lg { grid-column: span 2; grid-row: span 2; min-height: 460px; padding: 44px; justify-content: space-between; }
.bento-lg h3 { font-size: 40px; margin-top: 24px; line-height: 1.1; max-width: 460px; }
.bento-lg p { font-size: 17px; max-width: 460px; line-height: 1.55; margin-top: 14px; }
.bento-wide { grid-column: span 3; min-height: auto; padding: 32px 40px; }
.icon-chip { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }

/* TECH STACK ROW */
.bento-stack-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; width: 100%; flex-wrap: wrap; }
.stack-item { flex: 1; min-width: 160px; }
.stack-name { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 22px; margin-bottom: 4px; color: white; }
.stack-role { font-size: 13px; opacity: 0.65; }

/* CATEGORIES v2 — real photos */
.cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
.cat-tile-v2 {
  position: relative; border-radius: 22px; overflow: hidden;
  aspect-ratio: 1; cursor: pointer; border: none; padding: 0;
  background: ${T.card}; transition: transform 220ms ease, box-shadow 220ms ease;
}
.cat-tile-v2:hover { transform: translateY(-4px); box-shadow: 0 20px 50px rgba(15,42,82,0.18); }
.cat-img-wrap { position: absolute; inset: 0; }
.cat-img-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform 600ms ease; }
.cat-tile-v2:hover .cat-img-wrap img { transform: scale(1.06); }
.cat-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(15,42,82,0.0) 35%, rgba(15,42,82,0.6) 75%, rgba(15,42,82,0.9) 100%); }
.cat-meta { position: absolute; bottom: 0; left: 0; right: 0; padding: 18px; display: flex; align-items: center; gap: 10px; color: white; z-index: 2; }
.cat-icon { width: 32px; height: 32px; border-radius: 10px; background: rgba(255,255,255,0.18); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; }
.cat-name-v2 { font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 18px; }

/* STEPS */
.steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1080px; margin: 0 auto; }
.step-card { background: ${T.card}; border: 1px solid ${T.border}; padding: 36px; border-radius: 24px; transition: transform 220ms; }
.step-card:hover { transform: translateY(-4px); }
.step-num { display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 16px; font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 18px; margin-bottom: 22px; }
.step-card h3 { font-family: 'Outfit', sans-serif; font-size: 22px; font-weight: 700; margin: 0 0 10px; color: ${T.ink}; }
.step-card p { font-size: 15px; line-height: 1.6; margin: 0; color: ${T.inkSoft}; }

/* FOR SELLERS */
.seller-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
.seller-copy { max-width: 480px; }
.seller-h2 { font-family: 'Outfit', sans-serif; font-weight: 900; font-size: clamp(40px, 5.5vw, 68px); line-height: 1.05; letter-spacing: -0.025em; margin: 22px 0 22px; color: white; }
.seller-p { font-size: 17px; color: rgba(255,255,255,0.75); line-height: 1.6; margin: 0 0 32px; }
.seller-benefits { display: flex; flex-direction: column; gap: 16px; }
.seller-benefit {
  display: flex; gap: 16px; align-items: flex-start;
  padding: 22px; border-radius: 18px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(8px);
}
.seller-benefit-icon {
  width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
  background: linear-gradient(135deg, ${T.blue}, ${T.cyan});
  color: white; display: flex; align-items: center; justify-content: center;
}
.seller-benefit-title { font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 16px; color: white; margin-bottom: 4px; }
.seller-benefit-body { font-size: 14px; color: rgba(255,255,255,0.65); line-height: 1.5; }

/* CTA */
.cta-block { text-align: center; max-width: 760px; margin: 0 auto; }
.cta-title { font-family: 'Outfit', sans-serif; font-weight: 900; font-size: clamp(40px, 6vw, 76px); line-height: 1.02; letter-spacing: -0.03em; margin: 0 0 22px; color: white; perspective: 1200px; }
.cta-word { display: inline-block; will-change: transform; transform-origin: 50% 50%; }
.cta-sub { font-size: 19px; color: rgba(255,255,255,0.78); margin: 0 0 36px; line-height: 1.55; }

/* FOOTER */
.ft-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 40px; }
.ft-bottom { padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }

/* RESPONSIVE */
@media (max-width: 980px) {
  .hero-grid { grid-template-columns: 1fr; gap: 50px; }
  .hero-phone { order: -1; }
  .float-bid { left: 0; } .float-payment { right: 0; }
  .bento-grid { grid-template-columns: repeat(2, 1fr); }
  .bento-lg { grid-column: span 2; grid-row: auto; min-height: 320px; }
  .bento-wide { grid-column: span 2; padding: 24px; }
  .bento-stack-row { gap: 16px; }
  .cat-grid { grid-template-columns: repeat(3, 1fr); }
  .steps-grid { grid-template-columns: 1fr; }
  .seller-grid { grid-template-columns: 1fr; gap: 40px; }
  .ft-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 640px) {
  .bento-grid { grid-template-columns: 1fr; }
  .bento-lg, .bento-wide { grid-column: span 1; }
  .cat-grid { grid-template-columns: repeat(2, 1fr); }
  .ft-grid { grid-template-columns: 1fr; }
  .float-card { display: none; }
  .hero-title { font-size: 56px; }
}
`;

/* ══════════════════════════════════════════════
   MAIN LANDING PAGE
══════════════════════════════════════════════ */
export const LandingPage: React.FC<LandingPageProps> = ({
  onLoginClick, onBecomeSellerClick, onNavigate, onNavigateToSellerHub, currentPage, onBack,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HeroSceneHandle>(null);

  useEffect(() => {
    document.documentElement.classList.add("landing-modern");
    document.documentElement.classList.remove("landing-snap");
    return () => document.documentElement.classList.remove("landing-modern");
  }, []);

  // GSAP — drives the sticky scene through the stage:
  // scale grows + rotation drifts as user scrolls Hero → Bento;
  // opacity fades to 0 as user reaches end of Bento (entering Categories).
  useEffect(() => {
    if (!stageRef.current) return;
    const trigger = ScrollTrigger.create({
      trigger: stageRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      onUpdate: (self) => {
        const p = self.progress;
        // 0   → start of hero
        // 0.5 → end of hero / start of bento
        // 1.0 → end of bento
        const scale   = 1 + p * 0.55;
        const rotY    = p * 0.6;
        // hold opacity 1 through hero+most of bento, fade at the end
        const opacity = p < 0.85 ? 1 : Math.max(0, 1 - (p - 0.85) / 0.15);
        sceneRef.current?.setScale(scale);
        sceneRef.current?.setRotY(rotY);
        sceneRef.current?.setOpacity(opacity);
      },
    });
    return () => { trigger.kill(); };
  }, []);

  const onWatchLive = () => onLoginClick();
  const onSell      = onBecomeSellerClick;

  return (
    <div style={{ background: T.bg, color: T.ink, fontFamily: "Rubik, system-ui, sans-serif" }}>
      <style>{styles}</style>

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

      {/* ── STAGE: sticky 3D backdrop wrapping Hero + Bento ── */}
      <div ref={stageRef} className="lp-stage">
        <div className="lp-stage-scene">
          <AuroraBg />
          <HeroScene3D ref={sceneRef} />
        </div>
        <div className="lp-stage-content">
          <Hero onPrimary={onWatchLive} onSecondary={onSell} />
          <Bento />
        </div>
      </div>

      <Categories />
      <HowItWorks />
      <ForSellers onSell={onSell} />
      <BigCTA onPrimary={onWatchLive} onSecondary={onSell} />
      <Footer onNavigate={onNavigate} />
    </div>
  );
};
