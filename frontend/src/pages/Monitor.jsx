import { useEffect, useState, useCallback } from 'react';
import { Clock, Users, Wifi } from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
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
        <p key={i} className="text-[11px] font-medium" style={{ color: e.color }}>
          {e.name}: {typeof e.value === 'number' ? e.value.toFixed(1) : e.value}
        </p>
      ))}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {ZONES.map((z) => (
        <div key={z} className="flex items-center gap-1">
          <div className="w-2 h-0.5 rounded-full" style={{ background: ZC[z] }} />
          <span className="text-[9px] text-text-muted">{z.replace('_', ' ')}</span>
        </div>
      ))}
    </div>
  );
}

export default function Monitor() {
  const [selected, setSelected] = useState(null);
  const [snaps, setSnaps] = useState({});
  const [history, setHistory] = useState({});

  const fetchAll = useCallback(async () => {
    try {
      const results = await Promise.all(ZONES.map((z) => api.simulate({ zone: z }).then((r) => ({ zone: z, ...r }))));
      const ns = {};
      results.forEach((r) => { ns[r.zone] = { simulation: r.simulation, prediction: r.prediction }; });
      setSnaps(ns);
      const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setHistory((prev) => {
        const next = { ...prev };
        results.forEach((r) => {
          const z = r.zone;
          if (!next[z]) next[z] = [];
          next[z] = [...next[z], {
            time: t, latency: +r.simulation.latency.toFixed(1), users: r.simulation.num_users_in_zone,
            packetLoss: +r.simulation.packet_loss.toFixed(2),
          }].slice(-24);
        });
        return next;
      });
    } catch { /* */ }
  }, []);

  useEffect(() => { fetchAll(); const iv = setInterval(fetchAll, 3500); return () => clearInterval(iv); }, [fetchAll]);

  const display = selected ? [selected] : ZONES;
  const radarData = ZONES.map((z) => {
    const s = snaps[z]?.simulation;
    return { zone: z.replace('_', ' '), latency: s ? Math.min(s.latency/3, 100) : 0, users: s ? Math.min(s.num_users_in_zone/3.5, 100) : 0, packetLoss: s ? Math.min(s.packet_loss*12.5, 100) : 0 };
  });

  return (
    <div className="animate-fade-in flex flex-col gap-3 h-full">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary tracking-tight">Network Monitor</h1>
          <p className="text-[12px] text-text-muted">Performance metrics across all campus zones</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => setSelected(null)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${!selected ? 'bg-accent-blue/8 text-accent-blue' : 'text-text-muted hover:text-text-secondary'}`}>All</button>
          {ZONES.map((z) => (
            <button key={z} onClick={() => setSelected(selected === z ? null : z)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${selected === z ? '' : 'text-text-muted hover:text-text-secondary'}`}
              style={selected === z ? { background: `${ZC[z]}10`, color: ZC[z] } : {}}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: ZC[z] }} />
              {z.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Zone strips */}
      <div className="grid grid-cols-5 gap-2">
        {ZONES.map((z) => {
          const s = snaps[z]?.simulation, p = snaps[z]?.prediction;
          const active = selected === z;
          const dimmed = selected && !active;
          return (
            <div key={z} className={`card px-3 py-2 cursor-pointer transition-opacity duration-150 ${active ? 'border-border-active' : ''} ${dimmed ? 'opacity-40' : ''}`}
              onClick={() => setSelected(active ? null : z)}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: ZC[z] }} />
                  <span className="text-[10px] font-semibold text-text-primary">{z.replace('_', ' ')}</span>
                </div>
                {p && <StatusBadge level={p.congestion_label} size="sm" />}
              </div>
              {s && (
                <div className="flex gap-3 text-[10px]">
                  <span className="text-text-muted"><strong className="text-text-primary tabular-nums">{s.num_users_in_zone}</strong> users</span>
                  <span className="text-text-muted"><strong className="text-text-primary tabular-nums">{s.latency.toFixed(0)}</strong>ms</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts - fills remaining space */}
      <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
        <div className="card p-3 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[12px] font-semibold text-text-primary">Latency (ms)</h2>
            <Legend />
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="time" tickLine={false} axisLine={false} allowDuplicatedCategory={false} interval="preserveStartEnd" minTickGap={80} />
                <YAxis tickLine={false} axisLine={false} width={38} domain={['auto','auto']} />
                <Tooltip content={<Tip />} />
                {display.map((z) => <Line key={z} data={history[z]||[]} dataKey="latency" name={z.replace('_',' ')} stroke={ZC[z]} strokeWidth={1.5} dot={false} type="monotone" connectNulls isAnimationActive={false} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-3 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[12px] font-semibold text-text-primary">Connected Users</h2>
            <Legend />
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                <defs>{ZONES.map((z) => <linearGradient key={z} id={`mg-${z}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ZC[z]} stopOpacity={0.08}/><stop offset="100%" stopColor={ZC[z]} stopOpacity={0}/></linearGradient>)}</defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="time" tickLine={false} axisLine={false} allowDuplicatedCategory={false} interval="preserveStartEnd" minTickGap={80} />
                <YAxis tickLine={false} axisLine={false} width={38} domain={['auto','auto']} />
                <Tooltip content={<Tip />} />
                {display.map((z) => <Area key={z} data={history[z]||[]} dataKey="users" name={z.replace('_',' ')} stroke={ZC[z]} fill={`url(#mg-${z})`} strokeWidth={1.5} dot={false} type="monotone" connectNulls isAnimationActive={false} />)}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-3 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[12px] font-semibold text-text-primary">Packet Loss (%)</h2>
            <Legend />
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="time" tickLine={false} axisLine={false} allowDuplicatedCategory={false} interval="preserveStartEnd" minTickGap={80} />
                <YAxis tickLine={false} axisLine={false} width={38} domain={[0,'auto']} />
                <Tooltip content={<Tip />} />
                {display.map((z) => <Line key={z} data={history[z]||[]} dataKey="packetLoss" name={z.replace('_',' ')} stroke={ZC[z]} strokeWidth={1.5} dot={false} type="monotone" connectNulls isAnimationActive={false} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-3 flex flex-col">
          <h2 className="text-[12px] font-semibold text-text-primary mb-1">Zone Comparison</h2>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="68%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="zone" tick={{ fontSize: 9, fill: '#8B95A9' }} />
                <PolarRadiusAxis tick={false} axisLine={false} domain={[0,100]} />
                <Radar name="Latency" dataKey="latency" stroke="#FBBF24" fill="#FBBF24" fillOpacity={0.06} strokeWidth={1.5} />
                <Radar name="Users" dataKey="users" stroke="#4F8FF7" fill="#4F8FF7" fillOpacity={0.06} strokeWidth={1.5} />
                <Radar name="Pkt Loss" dataKey="packetLoss" stroke="#F87171" fill="#F87171" fillOpacity={0.06} strokeWidth={1.5} />
                <Tooltip content={<Tip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4 mt-1">
            {[{ c: '#FBBF24', l: 'Latency' }, { c: '#4F8FF7', l: 'Users' }, { c: '#F87171', l: 'Pkt Loss' }].map(({ c, l }) => (
              <div key={l} className="flex items-center gap-1">
                <div className="w-2 h-0.5 rounded-full" style={{ background: c }} />
                <span className="text-[9px] text-text-muted">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
