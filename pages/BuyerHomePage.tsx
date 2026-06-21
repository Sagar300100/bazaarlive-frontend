import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Radio, Filter, X, Sparkles, TrendingUp } from 'lucide-react';
import { Sidebar, Filters } from '../components/buyer/Sidebar';
import { ShowGrid } from '../components/buyer/ShowGrid';
import type { ShowData } from '../services/api';

interface BuyerHomePageProps {
  shows: ShowData[];
  onJoinShow: (show: ShowData) => void;
  onSwitchToSelling: () => void;
  onNavigate: (page: string) => void;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}

const initialFilters: Filters = {
  categories: [],
  timeOfShow: [],
  showFormat: [],
  brands: [],
  sellerRating: null,
  shippedFrom: [],
};

const BuyerHomePage: React.FC<BuyerHomePageProps> = ({
  shows, onJoinShow, onSwitchToSelling, onNavigate, filters, setFilters,
}) => {
  const filteredShows = useMemo(() => shows.filter(show => {
    const categoryMatch = filters.categories.length === 0 || filters.categories.some(fc => {
      const lc = fc.toLowerCase();
      return show.category.toLowerCase().includes(lc) ||
             show.subcategory.toLowerCase().includes(lc) ||
             show.name.toLowerCase().includes(lc) ||
             show.tags.some(tag => tag.toLowerCase().includes(lc));
    });
    const timeMatch =
      filters.timeOfShow.length === 0 ||
      (filters.timeOfShow.includes('Live')     && show.isLive) ||
      (filters.timeOfShow.includes('Upcoming') && !show.isLive);
    const formatMatch = filters.showFormat.length === 0 || filters.showFormat.includes(show.sellingFormat);
    const brandMatch  = filters.brands.length === 0 || filters.brands.some(b => {
      const sb = b.toLowerCase().split('(')[0].trim();
      return (show.brand && show.brand.toLowerCase().includes(sb)) ||
             show.name.toLowerCase().includes(sb) ||
             show.tags.some(t => t.toLowerCase().includes(sb));
    });
    const ratingMatch =
      !filters.sellerRating ||
      (filters.sellerRating === '5 stars'  && show.sellerRating >= 4.9) ||
      (filters.sellerRating === '4.5 & Up' && show.sellerRating >= 4.5) ||
      (filters.sellerRating === '4.0 & Up' && show.sellerRating >= 4.0);
    const shippingMatch = filters.shippedFrom.length === 0 ||
      (show.shippedFrom && filters.shippedFrom.includes(show.shippedFrom));
    return categoryMatch && timeMatch && formatMatch && brandMatch && ratingMatch && shippingMatch;
  }), [shows, filters]);

  const activeFilterCount = useMemo(() => Object.values(filters).reduce<number>((c, v) => {
    if (Array.isArray(v)) return c + v.length;
    if (v) return c + 1;
    return c;
  }, 0), [filters]);

  const liveCount     = filteredShows.filter(s => s.isLive).length;
  const upcomingCount = filteredShows.filter(s => !s.isLive).length;

  return (
    <div data-app-page="buyer-home" className="bh-root">
      <style>{styles}</style>

      {/* ── CINEMATIC HERO STRIP ── */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="bh-hero"
      >
        <div className="bh-container">
          <div className="bh-hero-grid">
            <div>
              <motion.span
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="bh-eyebrow"
              >
                <span className="bh-dot" /> LIVE MARKETPLACE
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.5 }}
                className="bh-title"
              >
                Discover what's <span className="bh-gradient">live</span> right now.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="bh-sub"
              >
                Real auctions. Real sellers. Real items shipping to your door.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="bh-stats"
            >
              <StatCard Icon={Radio}      label="LIVE"      value={liveCount}     color="#F43F5E" />
              <StatCard Icon={Sparkles}   label="UPCOMING"  value={upcomingCount} color="#06B6D4" />
              <StatCard Icon={TrendingUp} label="MATCHED"   value={filteredShows.length} color="#22C55E" />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ── MAIN BODY ── */}
      <div className="bh-container bh-body">
        <div className="bh-grid">
          <aside className="bh-aside">
            <Sidebar
              onSwitchToSelling={onSwitchToSelling}
              filters={filters}
              setFilters={setFilters}
              onNavigate={onNavigate}
            />
          </aside>

          <main className="bh-main">
            <div className="bh-toolbar">
              <div className="bh-toolbar-l">
                <h2 className="bh-section-title">Explore Shows</h2>
                <span className="bh-result-pill">
                  {filteredShows.length} {filteredShows.length === 1 ? 'result' : 'results'}
                </span>
              </div>
              <div className="bh-toolbar-r">
                <div className="bh-filter-chip">
                  <Filter size={13} /> Filters
                  <span className="bh-filter-badge">{activeFilterCount}</span>
                </div>
                {activeFilterCount > 0 && (
                  <button onClick={() => setFilters(initialFilters)} className="bh-clear-btn">
                    <X size={13} /> Clear
                  </button>
                )}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
            >
              <ShowGrid shows={filteredShows} onJoinShow={onJoinShow} />
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────
   StatCard
   ────────────────────────────────────────────── */
const StatCard: React.FC<{ Icon: React.ComponentType<any>; label: string; value: number; color: string }> = ({ Icon, label, value, color }) => (
  <div className="bh-stat" style={{ '--accent': color } as React.CSSProperties}>
    <div className="bh-stat-icon">
      <Icon size={14} />
    </div>
    <div>
      <div className="bh-stat-label">{label}</div>
      <div className="bh-stat-val">{value}</div>
    </div>
  </div>
);

const styles = `
.bh-root {
  position: relative;
  font-family: 'Rubik', system-ui, sans-serif;
  color: white;
  padding-bottom: 80px;
  /* explicit cinematic backdrop so text is always readable */
  background:
    radial-gradient(circle at 18% 12%, rgba(43,108,184,0.32), transparent 45%),
    radial-gradient(circle at 82% 38%, rgba(6,182,212,0.22), transparent 45%),
    radial-gradient(circle at 50% 100%, rgba(123,184,255,0.20), transparent 50%),
    linear-gradient(180deg, #070D1B 0%, #0B1F3F 40%, #0F2A52 80%, #0A1B3A 100%);
  min-height: 100vh;
  overflow: hidden;
}
/* dotted grid texture */
.bh-root::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background-image: radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px);
  background-size: 32px 32px;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
  opacity: 0.6;
}
.bh-root > * { position: relative; z-index: 1; }

/* ── dark-mode header icons: subtle glass chip behind each so they read on navy ── */
.hdr-icons-dark > div > button {
  background: rgba(255,255,255,0.06) !important;
  border: 1px solid rgba(255,255,255,0.10) !important;
  transition: background 180ms ease, border-color 180ms ease, transform 180ms ease !important;
}
.hdr-icons-dark > div > button:hover {
  background: rgba(255,255,255,0.14) !important;
  border-color: rgba(255,255,255,0.22) !important;
  transform: translateY(-1px);
}
.hdr-icons-dark svg {
  color: white !important;
  stroke-width: 1.85 !important;
}
.bh-container { max-width: 1240px; margin: 0 auto; padding: 0 24px; }

/* HERO */
.bh-hero { padding: 36px 0 28px; }
.bh-hero-grid {
  display: grid; grid-template-columns: 1fr auto; gap: 32px;
  align-items: end;
}
.bh-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 12px; border-radius: 999px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  backdrop-filter: blur(14px);
  font-size: 11px; letter-spacing: 2px; font-weight: 700;
  color: rgba(255,255,255,0.85);
  margin-bottom: 14px;
}
.bh-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #F43F5E; box-shadow: 0 0 10px #F43F5E;
  animation: bh-pulse 1.4s infinite;
}
@keyframes bh-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.55;transform:scale(0.85);} }
.bh-title {
  font-family: 'Outfit', sans-serif; font-weight: 800;
  font-size: clamp(34px, 4.6vw, 56px); line-height: 1.05;
  letter-spacing: -0.022em; margin: 0 0 12px; color: white;
}
.bh-gradient {
  background: linear-gradient(135deg, #7BB8FF 0%, #06B6D4 100%);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}
.bh-sub { font-size: 16px; line-height: 1.55; color: rgba(255,255,255,0.7); margin: 0; max-width: 540px; }
.bh-stats { display: flex; gap: 12px; flex-shrink: 0; }
.bh-stat {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px; border-radius: 14px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.10);
  backdrop-filter: blur(14px);
  min-width: 108px;
}
.bh-stat-icon {
  width: 30px; height: 30px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  background: var(--accent); color: white;
  box-shadow: 0 0 14px color-mix(in srgb, var(--accent) 50%, transparent);
}
.bh-stat-label { font-size: 10px; letter-spacing: 1.5px; font-weight: 700; color: rgba(255,255,255,0.55); }
.bh-stat-val   { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 22px; color: white; line-height: 1.1; }

/* BODY */
.bh-body { margin-top: 12px; }
.bh-grid { display: grid; grid-template-columns: 280px 1fr; gap: 24px; align-items: flex-start; }
.bh-aside {
  position: sticky; top: 90px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(14px);
  border-radius: 18px;
  padding: 16px;
}
/* dark-mode overrides for the legacy Sidebar so all text is readable */
.bh-aside .sidebar-whatnot {
  background: transparent !important;
  color: white;
  padding: 0;
}
.bh-aside .sidebar-whatnot p,
.bh-aside .sidebar-whatnot button,
.bh-aside .sidebar-whatnot a,
.bh-aside .sidebar-whatnot .section-title { color: rgba(255,255,255,0.85) !important; }
.bh-aside .sidebar-whatnot .section-title {
  font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 11px;
  letter-spacing: 2px; color: rgba(255,255,255,0.55) !important;
  margin: 18px 0 10px;
}
.bh-aside .sidebar-whatnot .nav-chip {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 14px; border-radius: 12px;
  background: rgba(255,255,255,0.05) !important;
  border: 1px solid rgba(255,255,255,0.08) !important;
  color: white !important; font-weight: 600; font-size: 13px;
  font-family: 'Outfit', sans-serif;
  transition: background 220ms ease, border-color 220ms ease, transform 220ms ease;
  width: 100%; text-align: left;
}
.bh-aside .sidebar-whatnot .nav-chip:hover { background: rgba(255,255,255,0.10) !important; border-color: rgba(255,255,255,0.18) !important; transform: translateX(2px); }
.bh-aside .sidebar-whatnot .nav-chip.active {
  background: linear-gradient(135deg, rgba(43,108,184,0.55), rgba(43,108,184,0.28)) !important;
  border-color: rgba(123,184,255,0.50) !important;
  box-shadow: 0 8px 24px rgba(43,108,184,0.32), 0 0 0 1px rgba(123,184,255,0.18) inset;
}
.bh-aside .sidebar-whatnot .nav-chip-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 8px;
  background: rgba(255,255,255,0.10);
  border: 1px solid rgba(255,255,255,0.10);
  flex-shrink: 0;
}
.bh-aside .sidebar-whatnot .nav-chip.active .nav-chip-icon {
  background: linear-gradient(135deg, #7BB8FF, #06B6D4);
  border-color: transparent;
  box-shadow: 0 4px 14px rgba(123,184,255,0.4);
}
.bh-aside .sidebar-whatnot .nav-chip-label { flex: 1; }
.bh-aside .sidebar-whatnot .nav-chip-badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 20px; height: 20px; padding: 0 6px;
  background: rgba(244,63,94,0.85); color: white;
  border-radius: 999px; font-size: 10px; font-weight: 800;
}
.bh-aside .sidebar-whatnot .nav-chip-arrow {
  opacity: 0.4;
  transition: opacity 220ms ease, transform 220ms ease;
}
.bh-aside .sidebar-whatnot .nav-chip:hover .nav-chip-arrow { opacity: 0.85; transform: translateX(2px); }
.bh-aside .sidebar-whatnot .nav-chip.active .nav-chip-arrow { opacity: 1; }
.bh-aside .sidebar-whatnot .nav-link {
  display: block; width: 100%; text-align: left;
  padding: 8px 12px; border-radius: 9px;
  background: transparent; border: none;
  color: rgba(255,255,255,0.75) !important; font-size: 13px;
  transition: background 160ms ease, color 160ms ease;
}
.bh-aside .sidebar-whatnot .nav-link:hover { background: rgba(255,255,255,0.06) !important; color: white !important; }
.bh-aside .sidebar-whatnot .nav-link.active {
  background: rgba(123,184,255,0.18) !important;
  color: white !important;
}
.bh-aside .sidebar-whatnot .category-scroll {
  max-height: 280px; overflow-y: auto; padding-right: 4px;
}
.bh-aside .sidebar-whatnot .category-scroll::-webkit-scrollbar { width: 4px; }
.bh-aside .sidebar-whatnot .category-scroll::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.18); border-radius: 4px;
}
.bh-aside .sidebar-whatnot .border-t { border-color: rgba(255,255,255,0.08) !important; }
.bh-aside .sidebar-whatnot .text-gray-500,
.bh-aside .sidebar-whatnot .text-xs { color: rgba(255,255,255,0.45) !important; }
.bh-main { min-width: 0; }
.bh-toolbar {
  display: flex; justify-content: space-between; align-items: center;
  gap: 16px; flex-wrap: wrap; margin-bottom: 22px;
}
.bh-toolbar-l { display: flex; align-items: center; gap: 14px; }
.bh-section-title {
  font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 26px;
  letter-spacing: -0.015em; color: white; margin: 0;
}
.bh-result-pill {
  padding: 5px 12px; border-radius: 999px;
  background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10);
  font-size: 12px; color: rgba(255,255,255,0.7); font-weight: 500;
}
.bh-toolbar-r { display: flex; align-items: center; gap: 10px; }
.bh-filter-chip {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 7px 12px 7px 12px; border-radius: 999px;
  background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10);
  font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.85);
}
.bh-filter-badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; height: 18px; padding: 0 5px;
  border-radius: 999px;
  background: #2B6CB8; color: white; font-size: 10px; font-weight: 800;
}
.bh-clear-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 7px 12px; border-radius: 999px; border: none;
  background: rgba(244,63,94,0.15); color: #FB7185;
  font-size: 12px; font-weight: 600; cursor: pointer;
  transition: background 180ms ease;
}
.bh-clear-btn:hover { background: rgba(244,63,94,0.25); }

@media (max-width: 880px) {
  .bh-hero-grid { grid-template-columns: 1fr; }
  .bh-stats     { flex-wrap: wrap; }
  .bh-grid      { grid-template-columns: 1fr; }
  .bh-aside     { position: static; }
}
`;

export default BuyerHomePage;
