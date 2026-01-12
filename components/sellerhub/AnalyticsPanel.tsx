import React, { useEffect, useState } from 'react';
import { MembershipIcon } from '../Icons';
import { fetchAnalyticsDashboard } from '../../services/analytics';

type StatCard = { label: string; value: string; delta?: string; trend?: 'up' | 'down' | 'flat' };
type MiniBar = { label: string; value: number };
type SessionRow = { title: string; viewers: number; peak: number; conversion: number };

const defaultStats: StatCard[] = [
  { label: 'Total Sales (7d)', value: '₹2,45,800', delta: '+12%', trend: 'up' },
  { label: 'Orders (7d)', value: '182', delta: '+9%', trend: 'up' },
  { label: 'Avg Order Value', value: '₹1,350', delta: '+4%', trend: 'up' },
  { label: 'Live Conversion', value: '3.4%', delta: '-0.2%', trend: 'down' },
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
  { label: 'Direct', value: 42 },
  { label: 'Instagram', value: 28 },
  { label: 'YouTube', value: 16 },
  { label: 'WhatsApp', value: 9 },
  { label: 'Other', value: 5 },
];

const defaultSessions: SessionRow[] = [
  { title: 'Festive Flash Sale', viewers: 820, peak: 1420, conversion: 3.9 },
  { title: 'Streetwear Drop', viewers: 610, peak: 980, conversion: 3.1 },
  { title: 'Home Finds Live', viewers: 455, peak: 720, conversion: 2.5 },
];

const TopProductRow: React.FC<{ name: string; units: number; revenue: string }> = ({ name, units, revenue }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
    <div>
      <p className="text-white font-semibold">{name}</p>
      <p className="text-xs text-gray-400">{units} units</p>
    </div>
    <span className="text-white font-semibold">{revenue}</span>
  </div>
);

const MiniBarChart: React.FC<{ data: MiniBar[]; color?: string }> = ({ data, color = 'bg-orange-500' }) => {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((d) => (
        <div key={d.label} className="flex flex-col items-center flex-1">
          <div
            className={`${color} w-full rounded-t-md`}
            style={{ height: `${(d.value / maxVal) * 100}%` }}
            title={`${d.label}: ${d.value}`}
          />
          <span className="text-xs text-gray-400 mt-1">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
  <div className="w-full bg-gray-800 rounded-full h-2">
    <div className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500" style={{ width: `${value}%` }} />
  </div>
);

const AnalyticsPanel: React.FC = () => {
  const [stats, setStats] = useState<StatCard[]>(defaultStats);
  const [revenueBars, setRevenueBars] = useState<MiniBar[]>(defaultRevenueBars);
  const [traffic, setTraffic] = useState<MiniBar[]>(defaultTraffic);
  const [sessions, setSessions] = useState<SessionRow[]>(defaultSessions);
  const [topProducts, setTopProducts] = useState<{ name: string; units: number; revenue: string }[]>([
    { name: 'Handwoven Silk Saree', units: 68, revenue: '₹88,400' },
    { name: 'Streetwear Hoodie', units: 52, revenue: '₹44,200' },
    { name: 'Minimalist Sneakers', units: 39, revenue: '₹35,100' },
    { name: 'Copper Bottle Set', units: 31, revenue: '₹18,900' },
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
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <button className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded-lg border border-gray-700">
          Export CSV
        </button>
      </div>
      {error && <div className="text-sm text-red-400">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <p className="text-sm text-gray-400">{stat.label}</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-white">{stat.value}</span>
              {stat.delta && (
                <span
                  className={`text-xs font-semibold ${
                    stat.trend === 'down' ? 'text-red-400' : stat.trend === 'up' ? 'text-emerald-400' : 'text-gray-400'
                  }`}
                >
                  {stat.delta}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-lg p-5 border border-gray-800 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Revenue (last 7 days)</h3>
            <span className="text-sm text-gray-400">₹2,45,800</span>
          </div>
          <MiniBarChart data={revenueBars} />
        </div>

        <div className="bg-gray-900 rounded-lg p-5 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Traffic sources</h3>
            <span className="text-sm text-gray-400">Share of sessions</span>
          </div>
          <div className="space-y-3">
            {traffic.map((row) => (
              <div key={row.label}>
                <div className="flex justify-between text-sm text-gray-300">
                  <span>{row.label}</span>
                  <span>{row.value}%</span>
                </div>
                <ProgressBar value={row.value} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-lg p-5 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Top products</h3>
          <span className="text-sm text-gray-400">Last 7 days</span>
        </div>
        <div className="space-y-2">
            {topProducts.map((p) => (
              <TopProductRow key={p.name} name={p.name} units={p.units} revenue={p.revenue} />
            ))}
        </div>
      </div>

        <div className="bg-gray-900 rounded-lg p-5 border border-gray-800 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Live session performance</h3>
            <span className="text-sm text-gray-400">Last 3 shows</span>
          </div>
          <div className="divide-y divide-gray-800">
            {sessions.map((s) => (
              <div key={s.title} className="py-3 grid grid-cols-4 gap-3 items-center text-sm text-white">
                <div className="font-semibold">{s.title}</div>
                <div className="text-gray-300">
                  Viewers <span className="font-semibold text-white">{s.viewers}</span>
                </div>
                <div className="text-gray-300">
                  Peak <span className="font-semibold text-white">{s.peak}</span>
                </div>
                <div className="text-gray-300">
                  Conversion <span className="font-semibold text-white">{s.conversion}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-5 border border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center">
            <MembershipIcon />
          </div>
          <div>
            <h4 className="text-white font-semibold">Want deeper insights?</h4>
            <p className="text-gray-400 text-sm">Export detailed CSVs or integrate with your BI tool to analyze cohorts and funnels.</p>
          </div>
        </div>
        <button className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2 rounded-lg font-semibold transition-colors">
          Export CSV
        </button>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
