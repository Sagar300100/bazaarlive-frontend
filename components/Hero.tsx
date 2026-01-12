import React from "react";
import { Logo } from "./Header";

interface HeroProps {
  onBecomeSellerClick: () => void;
  onExploreLive?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onBecomeSellerClick, onExploreLive }) => {
  return (
    <section className="relative overflow-hidden pt-16 pb-20">
      <div className="hero-bg" />
      <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between pb-10">
          <Logo />
          <div className="hidden md:flex items-center gap-6 text-sm text-white">
            <a href="#live" className="hover:text-[#ff6f3c]">Live Now</a>
            <a href="#upcoming" className="hover:text-[#ff6f3c]">Upcoming</a>
            <a href="#how-it-works" className="hover:text-[#ff6f3c]">How It Works</a>
            <button onClick={onBecomeSellerClick} className="btn btn-primary text-sm px-4 py-2">Become a Seller</button>
          </div>
        </div>

        <div className="text-center space-y-6">
          <div className="pill mx-auto text-white/80">
            <span className="w-2 h-2 rounded-full bg-[#ff6f3c]" /> Ultra-low latency auctions built for India
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.1] text-white reveal">
            Auctions + Buy Now in real time.
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-white/80 reveal d1">
            Stream, pin products, run auctions, and watch stock vanish in seconds. Built for UPI-first shoppers with
            glass-smooth video and live updates.
          </p>
          <div className="flex flex-wrap gap-4 justify-center reveal d2">
            <button className="btn btn-primary px-6 py-3" onClick={onExploreLive}>Explore Live Shows</button>
            <button className="btn btn-ghost px-6 py-3" onClick={onBecomeSellerClick}>Become a Seller</button>
          </div>
        </div>

        <div className="mt-14 flex justify-center reveal d3">
          <div className="video-frame w-full max-w-3xl">
            <img
              src="https://images.unsplash.com/photo-1545239351-1141bd82e8a6?q=80&w=1600&auto=format&fit=crop"
              alt="Live seller streaming"
              className="w-full h-[360px] object-cover"
            />
            <div className="video-overlay" />
            <div className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-semibold text-white">
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              LIVE · 2.3K watching
            </div>
            <div className="absolute bottom-4 left-4 right-4 glass rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff6f3c] to-[#d34bff] flex items-center justify-center text-white font-bold">
                  VL
                </div>
                <div>
                  <p className="text-white font-semibold">Vintage Luxe</p>
                  <p className="text-white/70 text-sm">Blue Floral Dress · Rs 999</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs uppercase text-white/60">Stock</p>
                  <p className="text-lg font-semibold text-white">5 left</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="btn btn-primary flex-1">Buy Now</button>
                <button className="btn btn-ghost flex-1 text-white">Place a Bid</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
