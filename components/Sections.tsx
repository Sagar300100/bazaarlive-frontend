import React, { useEffect, useRef } from "react";
import { steps } from "../constants";

// ── Shared scroll-reveal hook ────────────────────────────────
function useScrollReveal(rootMargin = "-80px") {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = el.querySelectorAll<HTMLElement>(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin, threshold: 0.1 }
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [rootMargin]);
  return ref;
}

const StepIcons = [
  (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  ),
  (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  ),
  (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
];

const STEP_COLORS = ["#2B6CB8", "#1A4B8C", "#4A7AB5", "#2B6CB8"];

export const HowItWorks: React.FC = () => {
  const sectionRef = useScrollReveal();

  return (
    <section id="how-it-works" className="py-24" ref={sectionRef}>
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 reveal">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
            style={{ background: "rgba(43,108,184,0.08)", color: "#2B6CB8", border: "1.5px solid rgba(43,108,184,0.18)" }}>
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1B3A6B] mt-2">
            Start selling in <span style={{ background: "linear-gradient(135deg,#2B6CB8,#1A4B8C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>minutes</span>
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-[#4A7AB5] text-lg">
            Stream, pin products, run auctions — your buyers bid and pay in real time.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const Icon = StepIcons[index];
            const color = STEP_COLORS[index];
            return (
              <div
                key={step.title}
                className={`reveal d${index + 1} card-3d group relative bg-white rounded-3xl p-7 text-center cursor-default`}
                style={{
                  border: "1.5px solid rgba(43,108,184,0.12)",
                  boxShadow: "0 4px 24px rgba(43,108,184,0.07)",
                  overflow: "hidden",
                }}
              >
                {/* Background glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${color}12, transparent 70%)` }} />

                {/* Step number */}
                <div className="absolute top-4 right-4 text-xs font-black opacity-20"
                  style={{ color, fontSize: 36, lineHeight: 1 }}>
                  {String(index + 1).padStart(2, "0")}
                </div>

                {/* Icon */}
                <div
                  className="flex items-center justify-center h-16 w-16 rounded-2xl mx-auto mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${color}14`, color }}
                >
                  <Icon className="h-7 w-7" />
                </div>

                <h3 className="text-lg font-bold text-[#1B3A6B] mb-2">{step.title}</h3>
                <p className="text-sm text-[#4A7AB5] leading-relaxed">{step.description}</p>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-0 group-hover:w-16 transition-all duration-300 rounded-full"
                  style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export const Highlights: React.FC = () => {
  const sectionRef = useScrollReveal();

  const cards = [
    {
      title: "Live Pinned Products",
      desc: "Buy Now cards under video with real-time stock and UPI-ready checkout.",
      img: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=900&q=80",
      emoji: "📱",
    },
    {
      title: "Auctions that Move",
      desc: "Low-latency bids with countdown, auto-extend, and hype overlays.",
      img: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=900&q=80",
      emoji: "⚡",
    },
    {
      title: "Built for UPI",
      desc: "Razorpay/UPI Autopay flows to reduce drop-offs and keep stock accurate.",
      img: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&q=80",
      emoji: "💳",
    },
  ];

  return (
    <section className="py-24" ref={sectionRef}
      style={{ background: "linear-gradient(180deg, rgba(43,108,184,0.03) 0%, transparent 100%)" }}>
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-14 reveal">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
            style={{ background: "rgba(43,108,184,0.08)", color: "#2B6CB8", border: "1.5px solid rgba(43,108,184,0.18)" }}>
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1B3A6B] mt-2">
            Everything you need to{" "}
            <span style={{ background: "linear-gradient(135deg,#2B6CB8,#1A4B8C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              sell live
            </span>
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {cards.map((card, idx) => (
            <div
              key={card.title}
              className={`reveal d${idx + 1} show-card group bg-white rounded-3xl overflow-hidden cursor-pointer`}
              style={{
                border: "1.5px solid rgba(43,108,184,0.12)",
                boxShadow: "0 4px 24px rgba(43,108,184,0.07)",
              }}
            >
              {/* Image */}
              <div className="h-52 overflow-hidden relative">
                <img
                  src={card.img}
                  alt={card.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0"
                  style={{ background: "linear-gradient(180deg, transparent 40%, rgba(27,58,107,0.5) 100%)" }} />
                <span className="absolute top-4 left-4 text-2xl">{card.emoji}</span>
              </div>
              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#1B3A6B] mb-2">{card.title}</h3>
                <p className="text-[#4A7AB5] text-sm leading-relaxed">{card.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-[#2B6CB8] font-bold text-sm group-hover:gap-2 transition-all">
                  Learn more
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
