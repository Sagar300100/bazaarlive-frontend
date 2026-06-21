import React, { useState, useEffect, useRef } from "react";

interface HeroProps {
  onBecomeSellerClick: () => void;
  onExploreLive?: () => void;
}

// ── Rotating headline words ──────────────────────────────────
const ROTATIONS = ["Live Auctions.", "Live Deals.", "Live India."];

// ── Mock show previews for slideshow ────────────────────────
const SHOWS = [
  {
    id: 1,
    seller: "Vintage Luxe",
    initials: "VL",
    title: "Luxury Saree Drop",
    viewers: "2.3K",
    price: "₹1,499",
    img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80",
    color: "#2B6CB8",
  },
  {
    id: 2,
    seller: "Sneaker Vault",
    initials: "SV",
    title: "Limited Edition Kicks",
    viewers: "4.1K",
    price: "₹3,999",
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
    color: "#1A4B8C",
  },
  {
    id: 3,
    seller: "Tech Deals India",
    initials: "TD",
    title: "Gadget Blowout",
    viewers: "6.7K",
    price: "₹599",
    img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
    color: "#4A7AB5",
  },
];

// ── Stats ────────────────────────────────────────────────────
const STATS = [
  { label: "GMV Sold",    value: "₹2.4Cr+",  icon: "📦" },
  { label: "Live Sellers",value: "12K+",      icon: "🎥" },
  { label: "Happy Buyers",value: "50K+",      icon: "🛍️" },
  { label: "Shows Today", value: "340+",      icon: "🔴" },
];

export const Hero: React.FC<HeroProps> = ({ onBecomeSellerClick, onExploreLive }) => {
  const [rotIdx, setRotIdx] = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const [wordVisible, setWordVisible] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Rotating headline ──
  useEffect(() => {
    const timer = setInterval(() => {
      setWordVisible(false);
      setTimeout(() => {
        setRotIdx(i => (i + 1) % ROTATIONS.length);
        setWordVisible(true);
      }, 350);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  // ── Auto-slideshow ──
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setSlideIdx(i => (i + 1) % SHOWS.length);
        setFading(false);
      }, 300);
    }, 3500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const goTo = (idx: number) => {
    if (idx === slideIdx) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setFading(true);
    setTimeout(() => { setSlideIdx(idx); setFading(false); }, 300);
    intervalRef.current = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setSlideIdx(i => (i + 1) % SHOWS.length);
        setFading(false);
      }, 300);
    }, 3500);
  };

  const show = SHOWS[slideIdx];

  return (
    <section className="relative overflow-hidden" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>

      {/* ── Animated background ── */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        {/* base gradient */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(60% 50% at 50% -10%, rgba(43,108,184,0.18) 0%, transparent 70%), linear-gradient(180deg, #EEF2F9 0%, #F0EDE8 60%, #EDE8E2 100%)"
        }} />
        {/* Orb 1 */}
        <div className="orb-1 absolute" style={{
          width: 520, height: 520, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(43,108,184,0.18) 0%, transparent 70%)",
          top: "-10%", left: "-5%", filter: "blur(40px)"
        }} />
        {/* Orb 2 */}
        <div className="orb-2 absolute" style={{
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(26,75,140,0.14) 0%, transparent 70%)",
          top: "20%", right: "-8%", filter: "blur(50px)"
        }} />
        {/* Orb 3 */}
        <div className="orb-3 absolute" style={{
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(107,174,214,0.16) 0%, transparent 70%)",
          bottom: "10%", left: "30%", filter: "blur(45px)"
        }} />
        {/* Grid overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(rgba(43,108,184,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(43,108,184,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)"
        }} />
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 pt-28 pb-16 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* ── LEFT COLUMN ── */}
          <div className="flex-1 text-center lg:text-left space-y-7">

            {/* Live badge */}
            <div className="reveal-instant inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
              style={{ background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.2)", color: "#dc2626" }}>
              <span className="live-dot w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              LIVE NOW · 2,847 watching
            </div>

            {/* Headline */}
            <div className="reveal-instant d1">
              <h1 className="font-extrabold leading-[1.08] text-[#1B3A6B]"
                style={{ fontSize: "clamp(2.6rem, 5vw, 4.2rem)", letterSpacing: "-0.02em" }}>
                Shop India's Best<br />
                <span
                  className="shimmer-text inline-block"
                  style={{
                    opacity: wordVisible ? 1 : 0,
                    transform: wordVisible ? "translateY(0)" : "translateY(10px)",
                    transition: "opacity 350ms cubic-bezier(0.22,1,0.36,1), transform 350ms cubic-bezier(0.22,1,0.36,1)",
                    minWidth: "10ch",
                    display: "inline-block",
                  }}
                >
                  {ROTATIONS[rotIdx]}
                </span>
              </h1>
            </div>

            {/* Sub */}
            <p className="reveal-instant d2 text-lg text-[#1B3A6B]/70 max-w-xl leading-relaxed" style={{ lineHeight: 1.7 }}>
              Stream, bid, and win in real time. India's fastest live commerce platform — built for UPI-first shoppers, zero lag.
            </p>

            {/* CTA buttons */}
            <div className="reveal-instant d3 flex flex-wrap gap-4 justify-center lg:justify-start">
              <button className="btn btn-primary px-7 py-3.5 text-base" onClick={onExploreLive}>
                <span>🔴</span> Watch Live Now
              </button>
              <button className="btn btn-ghost px-7 py-3.5 text-base" onClick={onBecomeSellerClick}>
                Start Selling Free
              </button>
            </div>

            {/* Stats row */}
            <div className="reveal-instant d4 flex flex-wrap gap-4 justify-center lg:justify-start pt-2">
              {STATS.map((s, i) => (
                <div key={s.label}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.72)",
                    border: "1.5px solid rgba(43,108,184,0.15)",
                    backdropFilter: "blur(12px)",
                    animationDelay: `${i * 80 + 500}ms`,
                  }}>
                  <span className="text-lg">{s.icon}</span>
                  <div>
                    <p className="font-extrabold text-[#1B3A6B] text-sm leading-tight">{s.value}</p>
                    <p className="text-[#4A7AB5] text-xs">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT COLUMN — Live Show Slideshow ── */}
          <div className="flex-1 w-full max-w-lg reveal-instant d2">
            <div className="relative">

              {/* Glow ring behind card */}
              <div className="absolute -inset-4 rounded-[40px] opacity-40 blur-2xl transition-all duration-700"
                style={{ background: `radial-gradient(circle, ${show.color}44, transparent 70%)` }} />

              {/* Show card */}
              <div
                className="relative rounded-[28px] overflow-hidden shadow-2xl"
                style={{
                  opacity: fading ? 0 : 1,
                  transform: fading ? "scale(0.97) translateY(8px)" : "scale(1) translateY(0)",
                  transition: "opacity 300ms ease, transform 300ms ease",
                  border: "1.5px solid rgba(43,108,184,0.18)",
                }}
              >
                {/* Image */}
                <div className="relative" style={{ height: 320, overflow: "hidden" }}>
                  <img
                    src={show.img}
                    alt={show.title}
                    className="w-full h-full object-cover"
                    style={{ transform: fading ? "scale(1.04)" : "scale(1)", transition: "transform 400ms ease" }}
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0"
                    style={{ background: "linear-gradient(0deg, rgba(15,25,50,0.75) 0%, rgba(15,25,50,0.1) 55%, transparent 100%)" }} />

                  {/* LIVE badge */}
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-bold"
                    style={{ background: "rgba(220,38,38,0.9)", backdropFilter: "blur(8px)" }}>
                    <span className="live-dot w-1.5 h-1.5 rounded-full bg-white inline-block" />
                    LIVE · {show.viewers} watching
                  </div>

                  {/* Seller info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${show.color}, #1A4B8C)` }}>
                        {show.initials}
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">{show.seller}</p>
                        <p className="text-white/70 text-xs">{show.title}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-white/60 text-xs">Starting at</p>
                        <p className="text-white font-extrabold text-lg">{show.price}</p>
                      </div>
                    </div>
                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:brightness-110"
                        style={{ background: `linear-gradient(135deg, ${show.color}, #1A4B8C)`, boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}
                        onClick={onExploreLive}
                      >
                        Join Live
                      </button>
                      <button
                        className="flex-1 py-2.5 rounded-xl font-bold text-sm"
                        style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}
                      >
                        Place Bid
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide dots */}
              <div className="flex justify-center gap-2 mt-5">
                {SHOWS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className="transition-all duration-300 rounded-full"
                    style={{
                      width: i === slideIdx ? 28 : 8,
                      height: 8,
                      background: i === slideIdx ? "#2B6CB8" : "rgba(43,108,184,0.25)",
                    }}
                  />
                ))}
              </div>

              {/* Floating mini cards */}
              <div className="absolute -left-8 top-12 hidden xl:flex items-center gap-2 px-3 py-2 rounded-2xl shadow-xl"
                style={{ background: "rgba(255,255,255,0.95)", border: "1.5px solid rgba(43,108,184,0.15)", backdropFilter: "blur(16px)", animation: "orbFloat3 6s ease-in-out infinite" }}>
                <span className="text-lg">🏆</span>
                <div>
                  <p className="text-[#1B3A6B] font-bold text-xs">Top Bid</p>
                  <p className="text-[#2B6CB8] font-extrabold text-sm">₹4,250</p>
                </div>
              </div>
              <div className="absolute -right-6 bottom-20 hidden xl:flex items-center gap-2 px-3 py-2 rounded-2xl shadow-xl"
                style={{ background: "rgba(255,255,255,0.95)", border: "1.5px solid rgba(43,108,184,0.15)", backdropFilter: "blur(16px)", animation: "orbFloat1 8s ease-in-out infinite 1s" }}>
                <span className="text-lg">🛍️</span>
                <div>
                  <p className="text-[#1B3A6B] font-bold text-xs">Just sold!</p>
                  <p className="text-[#4A7AB5] text-xs">Silk Saree · ₹2,100</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── Scrolling ticker ── */}
        <div className="reveal-instant d4 mt-16 overflow-hidden rounded-2xl"
          style={{ background: "rgba(43,108,184,0.06)", border: "1.5px solid rgba(43,108,184,0.12)", padding: "12px 0" }}>
          <div className="ticker-track flex gap-12 whitespace-nowrap w-max">
            {[...Array(2)].map((_, r) => (
              <React.Fragment key={r}>
                {["👗 Ethnic Wear Auction LIVE",
                  "⚡ Flash Sale — 60% off Electronics",
                  "🏆 Highest bid tonight: ₹12,400",
                  "🔴 340 shows scheduled today",
                  "📦 Free delivery on orders above ₹499",
                  "✨ New seller? Get ₹500 kickstart bonus",
                  "👟 Sneaker drop starting in 10 mins",
                  "💎 Jewellery show — bid from ₹299",
                ].map(item => (
                  <span key={item} className="inline-flex items-center gap-2 text-sm font-semibold text-[#1B3A6B]/70">
                    {item}
                    <span className="text-[#2B6CB8]">•</span>
                  </span>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
