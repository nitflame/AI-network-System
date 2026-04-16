import { useState, useCallback } from 'react';
import {
  Layers, Gauge, Ambulance, GraduationCap, Film,
  Settings, Sparkles, Play, Info,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts';
import StatusBadge from '../components/StatusBadge';
import { api } from '../lib/api';
import { ZONES } from '../lib/constants';

const SLICES = {
  high:   { icon: Ambulance, label: 'Critical', desc: 'Emergency, VoIP, real-time comms', color: '#F87171' },
  medium: { icon: GraduationCap, label: 'Standard', desc: 'Academic tools, work apps, email', color: '#FBBF24' },
  low:    { icon: Film, label: 'Best Effort', desc: 'Streaming, social, downloads', color: '#34D399' },
};

function Tip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-elevated border border-border-active rounded-lg px-3 py-2 shadow-xl">
      {payload.map((e, i) => (
        <p key={i} className="text-[11px] font-medium" style={{ color: e.payload?.fill || e.color }}>
          {e.name}: {typeof e.value === 'number' ? e.value.toFixed(1) : e.value} Mbps
        </p>
      ))}
    </div>
  );
}

export default function Slicing() {
  const [totalBw, setTotalBw] = useState(100);
  const [demand, setDemand] = useState({ high: 40, medium: 35, low: 25 });
  const [mode, setMode] = useState('manual');
  const [manualCong, setManualCong] = useState('MEDIUM');
  const [aiZone, setAiZone] = useState('Stadium');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const allocate = useCallback(async () => {
    setLoading(true);
    try {
      const payload = {
        total_bandwidth_mbps: totalBw,
        demand_mbps: { high_priority_mbps: demand.high, medium_priority_mbps: demand.medium, low_priority_mbps: demand.low },
      };
      if (mode === 'manual') {
        payload.congestion_label = manualCong;
      } else {
        const sim = await api.simulate({ zone: aiZone });
        payload.prediction_features = {
          zone: aiZone, signal_strength: sim.simulation.signal_strength,
          bandwidth_usage: sim.simulation.bandwidth_usage, latency: sim.simulation.latency,
          packet_loss: sim.simulation.packet_loss, num_users_in_zone: sim.simulation.num_users_in_zone,
          time_of_day: sim.simulation.time_of_day,
        };
      }
      const res = await api.allocate(payload);
      setResult(res);
      setHistory((p) => [{ ...res, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...p].slice(0, 8));
    } catch { /* */ }
    setLoading(false);
  }, [totalBw, demand, mode, manualCong, aiZone]);

  const a = result?.allocation;
  const totalDemand = demand.high + demand.medium + demand.low;

  const compData = a ? [
    { name: 'Critical', demand: demand.high, allocated: a.high_priority_mbps, fill: '#F87171' },
    { name: 'Standard', demand: demand.medium, allocated: a.medium_priority_mbps, fill: '#FBBF24' },
    { name: 'Best Effort', demand: demand.low, allocated: a.low_priority_mbps, fill: '#34D399' },
  ] : [];

  const pieData = a ? [
    { name: 'Critical', value: a.high_priority_mbps, fill: '#F87171' },
    { name: 'Standard', value: a.medium_priority_mbps, fill: '#FBBF24' },
    { name: 'Best Effort', value: a.low_priority_mbps, fill: '#34D399' },
    ...(a.unallocated_mbps > 0.5 ? [{ name: 'Unallocated', value: a.unallocated_mbps, fill: 'rgba(255,255,255,0.06)' }] : []),
  ] : [];

  return (
    <div className="space-y-3 animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold text-text-primary tracking-tight">5G Network Slicing</h1>
        <p className="text-[12px] text-text-muted">Intelligent bandwidth allocation using congestion-aware priority slicing</p>
      </div>

      {/* Explainer */}
      <div className="card p-4 flex items-start gap-3 border-accent-cyan/10">
        <Info size={14} className="text-accent-cyan shrink-0 mt-0.5" strokeWidth={1.5} />
        <p className="text-[12px] text-text-secondary leading-relaxed">
          Network slicing divides available bandwidth into virtual slices optimized for different traffic types.
          During high congestion, critical services receive priority while non-essential traffic is throttled.
          The AI system dynamically adjusts allocations based on real-time demand and predicted congestion.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Config */}
        <div className="col-span-4 space-y-4">
          {/* Total BW */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Total Bandwidth</h3>
              <span className="text-[13px] font-bold text-accent-cyan tabular-nums">{totalBw} Mbps</span>
            </div>
            <input type="range" min={10} max={500} step={10} value={totalBw}
              onChange={(e) => setTotalBw(+e.target.value)} className="w-full"
              style={{
                background: `linear-gradient(to right, rgba(34,211,238,0.5) 0%, rgba(34,211,238,0.5) ${((totalBw-10)/490)*100}%, rgba(255,255,255,0.06) ${((totalBw-10)/490)*100}%, rgba(255,255,255,0.06) 100%)`,
              }}
            />
          </div>

          {/* Demand */}
          <div className="card p-4">
            <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-4">Traffic Demand</h3>
            <div className="space-y-5">
              {Object.entries(SLICES).map(([key, info]) => {
                const Icon = info.icon;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon size={13} style={{ color: info.color }} strokeWidth={1.5} />
                        <span className="text-[12px] font-medium text-text-primary">{info.label}</span>
                      </div>
                      <span className="text-[12px] font-semibold tabular-nums" style={{ color: info.color }}>{demand[key]} Mbps</span>
                    </div>
                    <input type="range" min={0} max={200} step={5} value={demand[key]}
                      onChange={(e) => setDemand((d) => ({ ...d, [key]: +e.target.value }))} className="w-full"
                      style={{
                        background: `linear-gradient(to right, ${info.color}80 0%, ${info.color}80 ${(demand[key]/200)*100}%, rgba(255,255,255,0.06) ${(demand[key]/200)*100}%, rgba(255,255,255,0.06) 100%)`,
                      }}
                    />
                    <div className="text-[10px] text-text-muted mt-1">{info.desc}</div>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-border-primary">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-text-muted">Total Demand</span>
                  <span className={`text-[11px] font-semibold ${totalDemand > totalBw ? 'text-status-danger' : 'text-text-primary'}`}>
                    {totalDemand} / {totalBw} Mbps
                  </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden bg-border-primary">
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min((totalDemand / totalBw) * 100, 100)}%`,
                      background: totalDemand > totalBw ? '#F87171' : '#4F8FF7',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Congestion mode */}
          <div className="card p-4">
            <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">Congestion Source</h3>
            <div className="flex gap-2 mb-3">
              {[{ k: 'manual', icon: Settings, l: 'Manual' }, { k: 'ai', icon: Sparkles, l: 'AI Driven' }].map(({ k, icon: I, l }) => (
                <button key={k} onClick={() => setMode(k)}
                  className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-[12px] font-medium transition-colors ${
                    mode === k
                      ? k === 'ai' ? 'bg-accent-purple/10 text-accent-purple' : 'bg-accent-blue/10 text-accent-blue'
                      : 'text-text-muted hover:text-text-secondary border border-border-primary'
                  }`}>
                  <I size={13} strokeWidth={1.5} /> {l}
                </button>
              ))}
            </div>
            {mode === 'manual' ? (
              <div className="flex gap-1.5">
                {['LOW', 'MEDIUM', 'HIGH'].map((lv) => {
                  const c = lv === 'LOW' ? '#34D399' : lv === 'MEDIUM' ? '#FBBF24' : '#F87171';
                  return (
                    <button key={lv} onClick={() => setManualCong(lv)}
                      className={`flex-1 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                        manualCong === lv ? '' : 'opacity-30 hover:opacity-60'
                      }`}
                      style={{ color: c, background: `${c}0D`, border: manualCong === lv ? `1px solid ${c}30` : '1px solid transparent' }}>
                      {lv}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <label className="text-[11px] text-text-muted mb-2 block">Zone to simulate</label>
                <div className="flex flex-wrap gap-1.5">
                  {ZONES.map((z) => (
                    <button key={z} onClick={() => setAiZone(z)}
                      className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                        aiZone === z ? 'bg-accent-purple/10 text-accent-purple' : 'text-text-muted hover:text-text-secondary'
                      }`}>
                      {z.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={allocate} disabled={loading}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-lg text-[13px] font-medium text-white bg-accent-cyan hover:bg-accent-cyan/90 transition-colors disabled:opacity-40">
            {loading ? <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              : <><Play size={14} /> Allocate Resources</>}
          </button>
        </div>

        {/* Results */}
        <div className="col-span-8 space-y-4">
          {!result ? (
            <div className="card flex flex-col items-center justify-center text-center py-24">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-accent-cyan/8 mb-5">
                <Layers size={22} className="text-accent-cyan" strokeWidth={1.5} />
              </div>
              <h3 className="text-[15px] font-semibold text-text-primary mb-1.5">Configure and Allocate</h3>
              <p className="text-[13px] text-text-muted max-w-sm leading-relaxed">
                Set the total bandwidth, traffic demands, and congestion level, then click Allocate to see how the 5G slicing engine distributes resources.
              </p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Allocation Result</h3>
                  <div className="flex items-center gap-2">
                    <StatusBadge level={result.congestion_label} size="sm" />
                    <span className="text-[11px] text-text-muted">via {result.label_source}</span>
                  </div>
                </div>

                {/* Slice cards */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {Object.entries(SLICES).map(([key, info]) => {
                    const Icon = info.icon;
                    const allocated = a[`${key}_priority_mbps`] || 0;
                    const demanded = demand[key];
                    const pct = demanded > 0 ? (allocated / demanded) * 100 : 100;
                    return (
                      <div key={key} className="p-4 rounded-xl" style={{ background: `${info.color}06`, border: `1px solid ${info.color}12` }}>
                        <div className="flex items-center gap-2 mb-3">
                          <Icon size={14} style={{ color: info.color }} strokeWidth={1.5} />
                          <span className="text-[11px] font-medium text-text-muted">{info.label}</span>
                        </div>
                        <div className="text-[22px] font-semibold leading-none" style={{ color: info.color }}>
                          {allocated.toFixed(1)}
                        </div>
                        <div className="text-[11px] text-text-muted mt-1">of {demanded} Mbps</div>
                        <div className="h-1 rounded-full mt-3 overflow-hidden" style={{ background: `${info.color}10` }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, background: info.color, opacity: 0.7 }} />
                        </div>
                        <div className="text-[10px] font-medium mt-1.5" style={{ color: info.color }}>{pct.toFixed(0)}% fulfilled</div>
                      </div>
                    );
                  })}
                </div>

                {/* Utilization bar */}
                <div className="p-3 rounded-lg bg-bg-secondary border border-border-subtle">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-text-muted">Network Utilization</span>
                    <span className="text-[11px] font-semibold text-accent-cyan tabular-nums">{a.utilization_pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {['high', 'medium', 'low'].map((k) => (
                      <div key={k} className="h-full transition-all duration-500"
                        style={{ width: `${(a[`${k}_priority_mbps`] / totalBw) * 100}%`, background: SLICES[k].color, opacity: 0.7 }} />
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    {Object.entries(SLICES).map(([k, info]) => (
                      <div key={k} className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: info.color }} />
                        <span className="text-[10px] text-text-muted">{info.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card p-5">
                  <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-4">Demand vs Allocation</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={compData} barGap={4}>
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} width={36} />
                      <Tooltip content={<Tip />} />
                      <Bar dataKey="demand" name="Demand" radius={[3, 3, 0, 0]} barSize={18} fill="rgba(255,255,255,0.06)" />
                      <Bar dataKey="allocated" name="Allocated" radius={[3, 3, 0, 0]} barSize={18}>
                        {compData.map((e, i) => <Cell key={i} fill={e.fill} fillOpacity={0.7} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="card p-5">
                  <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-4">Bandwidth Distribution</h3>
                  <div className="flex justify-center">
                    <PieChart width={160} height={160}>
                      <Pie data={pieData} cx={80} cy={80} innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" animationDuration={600}>
                        {pieData.map((e, i) => <Cell key={i} fill={e.fill} stroke="transparent" />)}
                      </Pie>
                      <Tooltip content={<Tip />} />
                    </PieChart>
                  </div>
                  <div className="space-y-1.5 mt-3">
                    {pieData.map((d) => (
                      <div key={d.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-sm" style={{ background: d.fill }} />
                          <span className="text-[11px] text-text-secondary">{d.name}</span>
                        </div>
                        <span className="text-[11px] font-medium text-text-primary tabular-nums">{d.value.toFixed(1)} Mbps</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Demand served */}
              <div className="card p-5 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-text-muted uppercase tracking-wider font-semibold">Total Demand Served</div>
                  <div className="text-[28px] font-semibold text-text-primary tracking-tight mt-1">{result.demand_served_pct.toFixed(1)}%</div>
                </div>
                <Gauge size={24} className={result.demand_served_pct >= 90 ? 'text-status-success' : result.demand_served_pct >= 70 ? 'text-status-warning' : 'text-status-danger'} strokeWidth={1.5} />
              </div>
            </>
          )}

          {/* History */}
          {history.length > 1 && (
            <div className="card p-5">
              <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">History</h3>
              <div className="space-y-1.5">
                {history.slice(0, 5).map((h, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-hover transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-text-muted tabular-nums w-12">{h.time}</span>
                      <StatusBadge level={h.congestion_label} size="sm" />
                    </div>
                    <div className="flex items-center gap-2 text-[11px] tabular-nums">
                      <span className="text-status-danger">{h.allocation.high_priority_mbps.toFixed(0)}</span>
                      <span className="text-text-muted">/</span>
                      <span className="text-status-warning">{h.allocation.medium_priority_mbps.toFixed(0)}</span>
                      <span className="text-text-muted">/</span>
                      <span className="text-status-success">{h.allocation.low_priority_mbps.toFixed(0)}</span>
                      <span className="text-text-muted ml-0.5">Mbps</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
