import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Radio, ArrowRight } from 'lucide-react';
import type { ShowData } from '../../services/api';

// Inline SVG placeholder — no network request
const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
       <defs>
         <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
           <stop offset="0%" stop-color="#0F2A52"/>
           <stop offset="100%" stop-color="#070D1B"/>
         </linearGradient>
       </defs>
       <rect width="100%" height="100%" fill="url(#g)"/>
       <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
             fill="#4A7AB5" font-family="Outfit, sans-serif" font-weight="600" font-size="22">
         No image
       </text>
     </svg>`
  );

const formatViewers = (n: number): string =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

const ShowCard: React.FC<{ show: ShowData; onJoinShow: (show: ShowData) => void; index: number }> = ({ show, onJoinShow, index }) => {
  const handleImgError: React.ReactEventHandler<HTMLImageElement> = (e) => {
    const img = e.currentTarget;
    if (img.src !== PLACEHOLDER) img.src = PLACEHOLDER;
  };

  const viewers = Math.floor((show.sellerRating || 0) * 300);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.45,
        delay: Math.min(index * 0.04, 0.3),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="sg-card"
      onClick={() => onJoinShow(show)}
    >
      <div className="sg-thumb-wrap">
        {show.thumbnail ? (
          <img
            src={show.thumbnail}
            alt={show.name}
            className="sg-thumb"
            loading="lazy"
            onError={handleImgError}
          />
        ) : (
          <div className="sg-thumb-fallback">No image</div>
        )}

        <div className="sg-thumb-overlay" />

        {show.isLive && (
          <div className="sg-live">
            <span className="sg-live-dot" /> LIVE
          </div>
        )}

        <div className="sg-viewers">
          <Eye size={11} /> {formatViewers(viewers)}
        </div>

        <div className="sg-seller-overlay">
          <div className="sg-seller-av" style={{ background: `hsl(${(show.id?.toString().charCodeAt(0) ?? 0) * 9 % 360}, 65%, 55%)` }}>
            {show.seller?.charAt(0).toUpperCase() ?? 'S'}
          </div>
          <div className="sg-seller-name">{show.seller}</div>
        </div>
      </div>

      <div className="sg-body">
        <h3 className="sg-name">{show.name}</h3>
        <div className="sg-meta">
          <span className="sg-cat">{show.category}</span>
          <div className="sg-rating">
            <span className="sg-star">★</span>
            <span>{(show.sellerRating ?? 0).toFixed(1)}</span>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onJoinShow(show); }}
          className={`sg-cta ${show.isLive ? 'sg-cta-live' : 'sg-cta-upcoming'}`}
        >
          {show.isLive ? (
            <>
              <Radio size={14} /> Join Live
            </>
          ) : (
            <>
              View Details <ArrowRight size={14} />
            </>
          )}
        </button>
      </div>

      <style>{cardStyles}</style>
    </motion.div>
  );
};

interface ShowGridProps {
  shows: ShowData[];
  onJoinShow: (show: ShowData) => void;
}

export const ShowGrid: React.FC<ShowGridProps> = ({ shows, onJoinShow }) => {
  if (shows.length === 0) {
    return (
      <div className="sg-empty">
        <div className="sg-empty-glow" />
        <h3 className="sg-empty-title">No shows match.</h3>
        <p className="sg-empty-sub">Try clearing filters or check back soon — sellers come online every minute.</p>
      </div>
    );
  }

  return (
    <div className="sg-grid">
      {shows.map((show, i) => (
        <ShowCard key={show.id} show={show} onJoinShow={onJoinShow} index={i} />
      ))}
      <style>{gridStyles}</style>
    </div>
  );
};

const gridStyles = `
.sg-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
.sg-empty {
  position: relative; overflow: hidden;
  padding: 60px 30px; text-align: center;
  border-radius: 22px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(14px);
}
.sg-empty-glow {
  position: absolute; inset: -50% -10% auto -10%; height: 60%;
  background: radial-gradient(ellipse at top, rgba(43,108,184,0.35), transparent 70%);
  pointer-events: none;
}
.sg-empty-title { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 24px; color: white; margin: 0 0 8px; position: relative; }
.sg-empty-sub   { font-size: 14px; color: rgba(255,255,255,0.65); margin: 0; position: relative; }
`;

const cardStyles = `
.sg-card {
  position: relative; cursor: pointer;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 18px; overflow: hidden;
  backdrop-filter: blur(14px);
  transition: transform 280ms cubic-bezier(0.22,1,0.36,1),
              border-color 280ms ease,
              box-shadow 280ms ease;
}
.sg-card:hover {
  transform: translateY(-5px);
  border-color: rgba(123,184,255,0.45);
  box-shadow: 0 22px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(123,184,255,0.18);
}
.sg-thumb-wrap { position: relative; aspect-ratio: 16/10; overflow: hidden; background: #070D1B; }
.sg-thumb { width: 100%; height: 100%; object-fit: cover; transition: transform 600ms ease; }
.sg-card:hover .sg-thumb { transform: scale(1.05); }
.sg-thumb-fallback {
  width: 100%; height: 100%;
  background: linear-gradient(135deg, #0F2A52, #070D1B);
  display: flex; align-items: center; justify-content: center;
  color: #4A7AB5; font-family: 'Outfit', sans-serif; font-weight: 600;
}
.sg-thumb-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(7,13,27,0.0) 40%, rgba(7,13,27,0.7) 100%);
}
.sg-live {
  position: absolute; top: 12px; left: 12px;
  display: inline-flex; align-items: center; gap: 5px;
  background: #F43F5E; color: white;
  padding: 4px 9px; border-radius: 6px;
  font-size: 10px; font-weight: 800; letter-spacing: 0.6px;
  box-shadow: 0 4px 14px rgba(244,63,94,0.55);
}
.sg-live-dot {
  width: 5px; height: 5px; background: white; border-radius: 50%;
  animation: sg-pulse 1.3s infinite;
}
@keyframes sg-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.5;transform:scale(0.8);} }
.sg-viewers {
  position: absolute; top: 12px; right: 12px;
  display: inline-flex; align-items: center; gap: 4px;
  background: rgba(0,0,0,0.55); color: white;
  padding: 4px 8px; border-radius: 12px;
  font-size: 11px; font-weight: 600; backdrop-filter: blur(8px);
}
.sg-seller-overlay {
  position: absolute; bottom: 10px; left: 12px;
  display: flex; align-items: center; gap: 8px;
}
.sg-seller-av {
  width: 26px; height: 26px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 11px;
  color: white; border: 1.5px solid white;
  box-shadow: 0 4px 10px rgba(0,0,0,0.35);
}
.sg-seller-name {
  font-size: 12px; font-weight: 600; color: white;
  text-shadow: 0 2px 8px rgba(0,0,0,0.6);
}

.sg-body { padding: 16px 18px 18px; }
.sg-name {
  font-family: 'Outfit', sans-serif; font-weight: 700;
  font-size: 15px; color: white; margin: 0 0 8px;
  line-height: 1.3;
  overflow: hidden; text-overflow: ellipsis;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.sg-meta {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 14px;
}
.sg-cat {
  font-size: 11px; color: rgba(255,255,255,0.65);
  padding: 3px 8px; border-radius: 6px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
}
.sg-rating { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: rgba(255,255,255,0.85); font-weight: 600; }
.sg-star { color: #F59E0B; }

.sg-cta {
  width: 100%; padding: 10px 14px;
  border: none; border-radius: 11px; cursor: pointer;
  font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 13px;
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  transition: transform 200ms ease, box-shadow 200ms ease, background 200ms ease;
}
.sg-cta-live {
  background: linear-gradient(135deg, #F43F5E, #BE123C); color: white;
  box-shadow: 0 8px 22px rgba(244,63,94,0.4);
}
.sg-cta-live:hover { transform: translateY(-1px); box-shadow: 0 12px 30px rgba(244,63,94,0.55); }
.sg-cta-upcoming {
  background: rgba(255,255,255,0.08); color: white;
  border: 1px solid rgba(255,255,255,0.12);
}
.sg-cta-upcoming:hover { background: rgba(255,255,255,0.14); }
`;
