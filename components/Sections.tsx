import React from "react";
import { steps } from "../constants";

const StepIcons = [
  (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12h2.5" />
      <path d="m15.63 7.37.11 3.03 3.03.11-2.12 2.12-1.03 2.87-2.62-1.5-2.62 1.5-1.03-2.87-2.12-2.12 3.03-.11.11-3.03 1.77-1.37 1.77 1.37Z" />
      <path d="M12.5 7.5h-1v4h1a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1Z" />
    </svg>
  ),
  (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  ),
  (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8.5 18a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z" />
      <path d="M15.5 18a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z" />
      <path d="M19 13V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v7" />
      <path d="M14 13H5.7a1 1 0 0 0-.9 1.4L6 18h12l1.2-3.6a1 1 0 0 0-.9-1.4H14zM17 13a4 4 0 0 1-8 0" />
    </svg>
  ),
];

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-20">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12 reveal">
          <h2 className="text-3xl sm:text-4xl font-semibold text-white">
            Get Started in <span className="text-[#ff6f3c]">Minutes</span>
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-white/70">
            Stream, pin, sell. Buyers see live stock and can bid or buy instantly.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = StepIcons[index];
            return (
              <div key={step.title} className="glass p-6 text-center reveal">
                <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-[#ff6f3c]/15 text-[#ff6f3c] mx-auto mb-4">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-white/70">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export const Highlights: React.FC = () => {
  const cards = [
    {
      title: "Live Pinned Products",
      desc: "Buy Now cards under video with real-time stock and UPI-ready checkout.",
      img: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=900&q=80&auto=format&fit=crop",
    },
    {
      title: "Auctions that Move",
      desc: "Low-latency bids with countdown, auto-extend, and hype overlays.",
      img: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=900&q=80&auto=format&fit=crop",
    },
    {
      title: "Built for UPI",
      desc: "Razorpay/UPI Autopay flows to reduce drop-offs and keep stock accurate.",
      img: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&q=80&auto=format&fit=crop",
    },
  ];
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {cards.map((card, idx) => (
            <div key={card.title} className="card overflow-hidden reveal" style={{ animationDelay: `${idx * 120}ms` }}>
              <div className="h-48 overflow-hidden">
                <img src={card.img} alt={card.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-2 text-slate-600 text-sm">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
