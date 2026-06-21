import React, { useEffect, useState } from 'react';
import { MembershipIcon } from '../Icons';
import { fetchAnalyticsDashboard } from '../../services/analytics';

type StatCard = { label: string; value: string; delta?: string; trend?: 'up' | 'down' | 'flat' };
type MiniBar = { label: string; value: number };
type SessionRow = { title: string; viewers: number; peak: number; conversion: number };

const defaultStats: StatCard[] = [
  { label: 'Total Sales (7d)', value: '₹2,45,800', delta: '+12%', trend: 'up' },
  { label: 'Orders (7d)',      value: '182',        delta: '+9%',  trend: 'up' },
  { label: 'Avg Order Value',  value: '₹1,350',     delta: '+4%',  trend: 'up' },
  { label: 'Live Conversion',  value: '3.4%',       delta: '-0.2%',trend: 'down' },
];

const defaultRevenueBars: MiniBar[] = [
  { label: 'Mon', value: 22 },
  { label: 'Tue', value: 18 },
  { label: 'Wed', value: 34 },
  { label: 'Thu', value: 28 },
  { label: 'Fri', value: 42 },
  { label: 'Sat', value: 52 },
  { label: 'Sun', value: 39 },
];

const defaultTraffic: MiniBar[] = [
  { label: 'Direct',    value: 42 },
  { label: 'Instagram', value: 28 },
  { label: 'YouTube',   value: 16 },
  { label: 'WhatsApp',  value: 9 },
  { label: 'Other',     value: 5 },
];

const defaultSessions: SessionRow[] = [
  { title: 'Festive Flash Sale', viewers: 820, peak: 1420, conversion: 3.9 },
  { title: 'Streetwear Drop',    viewers: 610, peak: 980,  conversion: 3.1 },
  { title: 'Home Finds Live',    viewers: 455, peak: 720,  conversion: 2.5 },
];

const TopProductRow: React.FC<{ name: string; units: number; revenue: string }> = ({ name, units, revenue }) => (
  <div className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid rgba(43,108,184,0.08)" }}>
    <div>
      <p className="font-semibold text-[#1B3A6B] text-sm">{name}</p>
      <p className="text-xs text-[#4A7AB5]">{units} units</p>
    </div>
    <span className="font-bold text-[#1B3A6B] text-sm">{revenue}</span>
  </div>
);

const MiniBarChart: React.FC<{ data: MiniBar[] }> = ({ data }) => {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((d) => (
        <div key={d.label} className="flex flex-col items-center flex-1">
          <div
            className="w-full rounded-t-md"
            style={{
              height: `${(d.value / maxVal) * 100}%`,
              background: "linear-gradient(180deg,#2B6CB8,#1A4B8C)",
              borderRadius: "4px 4px 0 0",
            }}
            title={`${d.label}: ${d.value}`}
          />
          <span className="text-xs text-[#4A7AB5] mt-1">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
  <div className="w-full rounded-full h-2" style={{ background: "rgba(43,108,184,0.1)" }}>
    <div
      className="h-2 rounded-full"
      style={{ width: `${value}%`, background: "linear-gradient(90deg,#2B6CB8,#1A4B8C)" }}
    />
  </div>
);

const cardStyle = {
  background: "white",
  border: "1.5px solid rgba(43,108,184,0.12)",
  boxShadow: "0 2px 12px rgba(43,108,184,0.07)",
  borderRadius: "1rem",
  padding: "1.25rem",
};

const AnalyticsPanel: React.FC = () => {
  const [stats, setStats] = useState<StatCard[]>(defaultStats);
  const [revenueBars, setRevenueBars] = useState<MiniBar[]>(defaultRevenueBars);
  const [traffic, setTraffic] = useState<MiniBar[]>(defaultTraffic);
  const [sessions, setSessions] = useState<SessionRow[]>(defaultSessions);
  const [topProducts, setTopProducts] = useState<{ name: string; units: number; revenue: string }[]>([
    { name: 'Handwoven Silk Saree',  units: 68, revenue: '₹88,400' },
    { name: 'Streetwear Hoodie',     units: 52, revenue: '₹44,200' },
    { name: 'Minimalist Sneakers',   units: 39, revenue: '₹35,100' },
    { name: 'Copper Bottle Set',     units: 31, revenue: '₹18,900' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchAnalyticsDashboard('7d');
        if (!mounted) return;
        setStats(data.stats || defaultStats);
        setRevenueBars(data.revenueBars || defaultRevenueBars);
        setTraffic(data.traffic || defaultTraffic);
        setSessions(data.sessions || defaultSessions);
        setTopProducts(data.topProducts || topProducts);
        setError(null);
      } catch (err: any) {
        if (mounted) setError(err?.message || 'Failed to load analytics');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#1B3A6B]">Analytics</h1>
        <button
          className="text-[#2B6CB8] text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors"
          style={{ border: "1.5px solid rgba(43,108,184,0.25)" }}
        >
          Export CSV
        </button>
      </div>
      {error && <div className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</div>}

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} style={cardStyle}>
            <p className="text-sm text-[#4A7AB5] font-medium">{stat.label}</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-[#1B3A6B]">{stat.value}</span>
              {stat.delta && (
                <span className={`text-xs font-semibold ${
                  stat.trend === 'down' ? 'text-red-500' : stat.trend === 'up' ? 'text-green-600' : 'text-[#4A7AB5]'
                }`}>
                  {stat.delta}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Revenue + Traffic */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div style={{ ...cardStyle, gridColumn: 'span 2 / span 2' }} className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#1B3A6B]">Revenue (last 7 days)</h3>
            <span className="text-sm font-semibold text-[#4A7AB5]">₹2,45,800</span>
          </div>
          <MiniBarChart data={revenueBars} />
        </div>

        <div style={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#1B3A6B]">Traffic sources</h3>
            <span className="text-xs text-[#4A7AB5]">Share of sessions</span>
          </div>
          <div className="space-y-3">
            {traffic.map((row) => (
              <div key={row.label}>
                <div className="flex justify-between text-sm text-[#4A7AB5] mb-1">
                  <span>{row.label}</span>
                  <span className="font-semibold text-[#1B3A6B]">{row.value}%</span>
                </div>
                <ProgressBar value={row.value} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top products + Live sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div style={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#1B3A6B]">Top products</h3>
            <span className="text-xs text-[#4A7AB5]">Last 7 days</span>
          </div>
          <div>
            {topProducts.map((p) => (
              <TopProductRow key={p.name} name={p.name} units={p.units} revenue={p.revenue} />
            ))}
          </div>
        </div>

        <div style={{ ...cardStyle, gridColumn: 'span 2 / span 2' }} className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#1B3A6B]">Live session performance</h3>
            <span className="text-xs text-[#4A7AB5]">Last 3 shows</span>
          </div>
          <div>
            {sessions.map((s, idx) => (
              <div
                key={s.title}
                className="py-3 grid grid-cols-4 gap-3 items-center text-sm"
                style={{ borderTop: idx > 0 ? "1px solid rgba(43,108,184,0.08)" : undefined }}
              >
                <div className="font-semibold text-[#1B3A6B]">{s.title}</div>
                <div className="text-[#4A7AB5]">
                  Viewers <span className="font-bold text-[#1B3A6B]">{s.viewers}</span>
                </div>
                <div className="text-[#4A7AB5]">
                  Peak <span className="font-bold text-[#1B3A6B]">{s.peak}</span>
                </div>
                <div className="text-[#4A7AB5]">
                  Conv. <span className="font-bold text-[#1B3A6B]">{s.conversion}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upsell banner */}
      <div
        className="bg-white rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ border: "1.5px solid rgba(43,108,184,0.15)", boxShadow: "0 2px 12px rgba(43,108,184,0.07)" }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(43,108,184,0.1)", color: "#2B6CB8" }}
          >
            <MembershipIcon />
          </div>
          <div>
            <h4 className="font-bold text-[#1B3A6B]">Want deeper insights?</h4>
            <p className="text-[#4A7AB5] text-sm">Export detailed CSVs or integrate with your BI tool to analyse cohorts and funnels.</p>
          </div>
        </div>
        <button
          className="text-white px-5 py-2 rounded-xl font-semibold transition-colors flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#2B6CB8,#1A4B8C)", boxShadow: "0 4px 14px rgba(43,108,184,0.3)" }}
        >
          Export CSV
        </button>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
