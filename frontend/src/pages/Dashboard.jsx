import { useEffect, useState, useCallback } from 'react';
import { Users, Wifi, Clock, AlertTriangle, Shield, Signal, TrendingUp, Activity } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, Cell, PieChart, Pie,
} from 'recharts';
import MetricCard from '../components/MetricCard';
import ZoneCard from '../components/ZoneCard';
import StatusBadge from '../components/StatusBadge';
import { api } from '../lib/api';
import { ZONES } from '../lib/constants';

const ZC = { Hostel: '#A78BFA', Library: '#22D3EE', Cafeteria: '#FBBF24', Academic_Block: '#4F8FF7', Stadium: '#F87171' };

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-elevated border border-border-active rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[10px] text-text-muted mb-1">{label}</p>
      {payload.map((e, i) => (
        <p key={i} className="text-[11px] font-medium" style={{ color: e.color }}>{e.name}: {typeof e.value === 'number' ? e.value.toFixed(1) : e.value}</p>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [zoneData, setZoneData] = useState({});
  const [history, setHistory] = useState([]);

  const fetchAll = useCallback(async () => {
    try {
      const results = await Promise.all(ZONES.map((z) => api.simulate({ zone: z }).then((r) => ({ zone: z, ...r }))));
      const nd = {};
      results.forEach((r) => { nd[r.zone] = { simulation: r.simulation, prediction: r.prediction }; });
      setZoneData(nd);
      const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setHistory((prev) => {
        let u = 0, l = 0, b = 0;
        results.forEach((r) => { u += r.simulation.num_users_in_zone; l += r.simulation.latency; b += r.simulation.bandwidth_usage; });
        const next = [...prev, { time: t, users: u, avgLatency: +(l / 5).toFixed(1) }];
        return next.length > 20 ? next.slice(-20) : next;
      });
    } catch { /* */ }
  }, []);

  useEffect(() => { fetchAll(); const iv = setInterval(fetchAll, 4000); return () => clearInterval(iv); }, [fetchAll]);

  const zones = Object.entries(zoneData);
  const totalUsers = zones.reduce((s, [, d]) => s + (d.simulation?.num_users_in_zone || 0), 0);
  const avgLat = zones.length ? +(zones.reduce((s, [, d]) => s + (d.simulation?.latency || 0), 0) / zones.length).toFixed(1) : 0;
  const avgBw = zones.length ? +(zones.reduce((s, [, d]) => s + (d.simulation?.bandwidth_usage || 0), 0) / zones.length).toFixed(1) : 0;
  const highC = zones.filter(([, d]) => d.prediction?.congestion_label === 'HIGH').length;
  const avgSignal = zones.length ? +(zones.reduce((s, [, d]) => s + (d.simulation?.signal_strength || 0), 0) / zones.length).toFixed(1) : 0;
  const avgPktLoss = zones.length ? +(zones.reduce((s, [, d]) => s + (d.simulation?.packet_loss || 0), 0) / zones.length).toFixed(2) : 0;

  const dist = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  zones.forEach(([, d]) => { dist[d.prediction?.congestion_label || 'LOW']++; });
  const pieData = [
    { name: 'High', value: dist.HIGH, fill: '#F87171' },
    { name: 'Medium', value: dist.MEDIUM, fill: '#FBBF24' },
    { name: 'Low', value: dist.LOW, fill: '#34D399' },
  ].filter((d) => d.value > 0);

  const barData = zones.map(([z, d]) => ({ zone: z.replace('_', ' '), users: d.simulation?.num_users_in_zone || 0, fill: ZC[z] }));

  return (
    <div className="animate-fade-in flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="flex items-end justify-between shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-text-primary tracking-tight">Dashboard</h1>
          <p className="text-[12px] text-text-muted">Real-time monitoring across {ZONES.length} campus zones</p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
          <Activity size={12} className="text-status-success" />
          <span className="tabular-nums">{totalUsers} total users online</span>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-6 gap-3 shrink-0">
        <MetricCard icon={Users} label="Active Users" value={totalUsers} color="#4F8FF7" />
        <MetricCard icon={Clock} label="Avg Latency" value={avgLat} suffix="ms" color="#FBBF24" />
        <MetricCard icon={Wifi} label="Avg Bandwidth" value={avgBw} suffix="Mbps" color="#22D3EE" />
        <MetricCard icon={Signal} label="Signal Strength" value={avgSignal} suffix="dBm" color="#A78BFA" />
        <MetricCard icon={TrendingUp} label="Packet Loss" value={avgPktLoss} suffix="%" color="#F87171" />
        <MetricCard icon={AlertTriangle} label="High Congestion" value={highC} suffix={`/ ${ZONES.length}`} color="#F87171" />
      </div>

      {/* Main area - fills remaining space */}
      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">
        {/* Left: chart + zones */}
        <div className="col-span-8 flex flex-col gap-3 min-h-0">
          {/* Traffic chart */}
          <div className="card p-4 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <h2 className="text-[12px] font-semibold text-text-primary">Network Traffic</h2>
              <div className="flex items-center gap-4">
                {[{ c: '#4F8FF7', l: 'Users' }, { c: '#FBBF24', l: 'Latency (ms)' }].map(({ c, l }) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
                    <span className="text-[10px] text-text-muted">{l}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                  <defs>
                    <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F8FF7" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#4F8FF7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="time" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={80} />
                  <YAxis tickLine={false} axisLine={false} width={38} />
                  <Tooltip content={<Tip />} />
                  <Area type="monotone" dataKey="users" stroke="#4F8FF7" fill="url(#gU)" strokeWidth={1.5} dot={false} name="Users" isAnimationActive={history.length <= 2} />
                  <Area type="monotone" dataKey="avgLatency" stroke="#FBBF24" fill="none" strokeWidth={1.5} dot={false} name="Latency" isAnimationActive={history.length <= 2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Zone cards - 5 across */}
          <div className="grid grid-cols-5 gap-2 shrink-0">
            {ZONES.map((z) => (
              <ZoneCard key={z} zone={z} data={zoneData[z]?.simulation} prediction={zoneData[z]?.prediction} />
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="col-span-4 flex flex-col gap-3 min-h-0">
          {/* Congestion pie */}
          <div className="card p-4">
            <h2 className="text-[12px] font-semibold text-text-primary mb-1">Congestion Distribution</h2>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={100} height={100}>
                <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius="48%" outerRadius="80%" paddingAngle={3} dataKey="value" animationDuration={400} startAngle={90} endAngle={-270}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.fill} stroke="transparent" />)}
                </Pie></PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 flex-1">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm" style={{ background: d.fill }} /><span className="text-[10px] text-text-secondary">{d.name}</span></div>
                    <span className="text-[10px] font-semibold text-text-primary tabular-nums">{d.value} zone{d.value !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Users bar */}
          <div className="card p-4 flex-1 flex flex-col min-h-0">
            <h2 className="text-[12px] font-semibold text-text-primary mb-2">Users by Zone</h2>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" barSize={10} margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis dataKey="zone" type="category" tickLine={false} axisLine={false} width={72} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="users" radius={[0, 4, 4, 0]} name="Users">
                    {barData.map((e, i) => <Cell key={i} fill={e.fill} fillOpacity={0.6} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Insights */}
          <div className="card p-4">
            <h2 className="text-[12px] font-semibold text-text-primary mb-2">Insights</h2>
            <div className="space-y-1.5">
              {zones.filter(([, d]) => d.prediction?.congestion_label === 'HIGH').map(([z, d]) => (
                <div key={z} className="flex items-center gap-2 text-[11px]">
                  <AlertTriangle size={12} className="text-status-danger shrink-0" />
                  <span className="text-text-primary font-medium">{z.replace('_', ' ')}</span>
                  <span className="text-text-muted ml-auto tabular-nums">{d.simulation?.num_users_in_zone} users</span>
                </div>
              ))}
              {zones.filter(([, d]) => d.prediction?.congestion_label === 'MEDIUM').map(([z, d]) => (
                <div key={z} className="flex items-center gap-2 text-[11px]">
                  <Signal size={12} className="text-status-warning shrink-0" />
                  <span className="text-text-primary font-medium">{z.replace('_', ' ')}</span>
                  <span className="text-text-muted ml-auto tabular-nums">{d.simulation?.num_users_in_zone} users</span>
                </div>
              ))}
              {dist.LOW > 0 && (
                <div className="flex items-center gap-2 text-[11px]">
                  <Shield size={12} className="text-status-success shrink-0" />
                  <span className="text-text-primary font-medium">{dist.LOW} zone{dist.LOW > 1 ? 's' : ''} normal</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
