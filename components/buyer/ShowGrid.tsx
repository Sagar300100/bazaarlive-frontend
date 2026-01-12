import React from 'react';
import type { ShowData } from '../../services/api';

// Inline SVG as a data URI – no network request
const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
       <rect width="100%" height="100%" fill="#111827"/>
       <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
             fill="#9CA3AF" font-family="Arial, sans-serif" font-size="24">
         No image
       </text>
     </svg>`
  );

const ShowCard: React.FC<{ show: ShowData; onJoinShow: (show: ShowData) => void }> = ({ show, onJoinShow }) => {
  const handleImgError: React.ReactEventHandler<HTMLImageElement> = (e) => {
    const img = e.currentTarget;
    if (img.src !== PLACEHOLDER) img.src = PLACEHOLDER;
  };

  return (
    <div
      className="group relative glass-card overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 ease-in-out cursor-pointer"
      onClick={() => onJoinShow(show)}
    >
      <div className="relative">
        {show.thumbnail ? (
          <img
            src={show.thumbnail}
            alt={show.name}
            className="w-full h-48 object-cover"
            loading="lazy"
            onError={handleImgError}
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-[#ff5f6d]/30 via-[#7f5cff]/30 to-[#0b0b10] flex items-center justify-center text-white/70">
            No image
          </div>
        )}

        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/40 transition-colors" />

        {show.isLive && (
          <div className="absolute top-3 left-3 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            LIVE
          </div>
        )}

        <div className="absolute top-3 right-3 bg-white/85 text-slate-800 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          <span>{Math.floor((show.sellerRating || 0) * 300)}</span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-md font-bold text-white truncate group-hover:text-[#ff5f6d] transition-colors">{show.name}</h3>
        <p className="text-sm text-white/70 mt-1">by {show.seller}</p>
        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm font-semibold text-white/80">{show.category}</p>
          <button
            onClick={(e) => { e.stopPropagation(); onJoinShow(show); }}
            className={`text-sm font-bold py-2 px-4 rounded-md transition-colors ${show.isLive ? 'btn btn-primary text-white' : 'btn btn-ghost text-white'}`}
          >
            {show.isLive ? 'Join Now' : 'View Details'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ShowGridProps {
  shows: ShowData[];
  onJoinShow: (show: ShowData) => void;
}

export const ShowGrid: React.FC<ShowGridProps> = ({ shows, onJoinShow }) => {
  if (shows.length === 0) {
    return (
      <div className="text-center py-16 px-6 card">
        <h3 className="text-xl font-bold text-white">No Shows Found</h3>
        <p className="text-white/70 mt-2">Try adjusting your filters or check back later for new shows.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {shows.map((show) => (
        <ShowCard key={show.id} show={show} onJoinShow={onJoinShow} />
      ))}
    </div>
  );
};
