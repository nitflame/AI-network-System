import { useState, useCallback } from 'react';
import {
  Brain, Target, Send, RotateCcw, Sparkles, ChevronRight,
  Signal, Gauge, Users, Clock, Wifi, Radio, Zap,
} from 'lucide-react';
import ConfidenceMeter from '../components/ConfidenceMeter';
import StatusBadge from '../components/StatusBadge';
import { api } from '../lib/api';
import { ZONES } from '../lib/constants';

const PRESETS = [
  { name: 'Stadium Peak Hour', desc: 'Crowded stadium during evening event',
    data: { zone: 'Stadium', signal_strength: 55, bandwidth_usage: 8.5, latency: 200, packet_loss: 4.0, num_users_in_zone: 300, time_of_day: 20 } },
  { name: 'Library Morning', desc: 'Quiet library in early morning',
    data: { zone: 'Library', signal_strength: 88, bandwidth_usage: 1.5, latency: 35, packet_loss: 0.2, num_users_in_zone: 25, time_of_day: 8 } },
  { name: 'Cafeteria Lunch Rush', desc: 'Cafeteria during lunch break',
    data: { zone: 'Cafeteria', signal_strength: 65, bandwidth_usage: 6.0, latency: 120, packet_loss: 2.0, num_users_in_zone: 200, time_of_day: 13 } },
  { name: 'Hostel Night', desc: 'Hostel during streaming peak',
    data: { zone: 'Hostel', signal_strength: 60, bandwidth_usage: 7.5, latency: 160, packet_loss: 3.5, num_users_in_zone: 250, time_of_day: 22 } },
];

const FIELDS = [
  { key: 'signal_strength', label: 'Signal Strength', unit: 'dBm', min: 0, max: 100, step: 1, icon: Signal },
  { key: 'bandwidth_usage', label: 'Bandwidth Usage', unit: 'Mbps', min: 0, max: 10, step: 0.1, icon: Wifi },
  { key: 'latency', label: 'Latency', unit: 'ms', min: 0, max: 500, step: 1, icon: Clock },
  { key: 'packet_loss', label: 'Packet Loss', unit: '%', min: 0, max: 10, step: 0.1, icon: Radio },
  { key: 'num_users_in_zone', label: 'Users in Zone', unit: '', min: 0, max: 500, step: 1, icon: Users },
  { key: 'time_of_day', label: 'Time of Day', unit: 'h', min: 0, max: 23, step: 1, icon: Gauge },
];

const CONG_COLORS = {
  HIGH: { text: '#F87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.18)' },
  MEDIUM: { text: '#FBBF24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.18)' },
  LOW: { text: '#34D399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.18)' },
};

export default function Predict() {
  const [form, setForm] = useState({
    zone: 'Stadium', signal_strength: 70, bandwidth_usage: 5.0,
    latency: 100, packet_loss: 1.5, num_users_in_zone: 150, time_of_day: 14,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const predict = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.predict(form);
      setResult(res);
      setHistory((p) => [{ ...res.prediction, zone: form.zone,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...p].slice(0, 10));
    } catch { /* */ }
    setLoading(false);
  }, [form]);

  const simulate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.simulate({ zone: form.zone });
      const s = res.simulation;
      setForm({
        zone: s.zone, signal_strength: +s.signal_strength.toFixed(1),
        bandwidth_usage: +s.bandwidth_usage.toFixed(1), latency: +s.latency.toFixed(1),
        packet_loss: +s.packet_loss.toFixed(2), num_users_in_zone: s.num_users_in_zone,
        time_of_day: s.time_of_day,
      });
      setResult({ input: s, prediction: res.prediction });
      setHistory((p) => [{ ...res.prediction, zone: s.zone,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...p].slice(0, 10));
    } catch { /* */ }
    setLoading(false);
  }, [form.zone]);

  const cl = result?.prediction?.congestion_label;
  const cc = CONG_COLORS[cl] || CONG_COLORS.LOW;

  return (
    <div className="space-y-3 animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold text-text-primary tracking-tight">AI Congestion Prediction</h1>
        <p className="text-[12px] text-text-muted">Input network parameters or use presets to get AI-powered congestion forecasts</p>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Left panel */}
        <div className="col-span-4 space-y-4">
          {/* Presets */}
          <div className="card p-4">
            <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">Quick Presets</h3>
            <div className="space-y-0.5">
              {PRESETS.map((p) => {
                const active = p.data.zone === form.zone
                  && p.data.signal_strength === form.signal_strength
                  && p.data.latency === form.latency
                  && p.data.num_users_in_zone === form.num_users_in_zone;
                return (
                  <button key={p.name} onClick={() => setForm(p.data)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors duration-150 group ${
                      active ? 'bg-surface-hover' : 'hover:bg-surface-hover'
                    }`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-1 h-1 rounded-full transition-colors ${active ? 'bg-accent-blue' : 'bg-text-muted/30'}`} />
                      <div>
                        <div className={`text-[12px] font-medium ${active ? 'text-text-primary' : 'text-text-secondary'}`}>{p.name}</div>
                        <div className="text-[10px] text-text-muted">{p.desc}</div>
                      </div>
                    </div>
                    <ChevronRight size={12} className={`shrink-0 transition-colors ${active ? 'text-text-secondary' : 'text-text-muted/20 group-hover:text-text-muted/40'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Parameters */}
          <div className="card p-4">
            <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">Network Parameters</h3>

            {/* Zone */}
            <div className="mb-4">
              <label className="text-[11px] text-text-muted mb-2 block">Zone</label>
              <div className="flex flex-wrap gap-1.5">
                {ZONES.map((z) => (
                  <button key={z} onClick={() => set('zone', z)}
                    className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                      form.zone === z
                        ? 'bg-accent-blue/10 text-accent-blue'
                        : 'text-text-muted hover:text-text-secondary hover:bg-surface-hover'
                    }`}>
                    {z.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-4">
              {FIELDS.map(({ key, label, unit, min, max, step, icon: Icon }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] text-text-muted flex items-center gap-1.5">
                      <Icon size={12} strokeWidth={1.5} />
                      {label}
                    </label>
                    <span className="text-[11px] font-semibold text-text-primary tabular-nums">
                      {form[key]}{unit ? ` ${unit}` : ''}
                    </span>
                  </div>
                  <input type="range" min={min} max={max} step={step} value={form[key]}
                    onChange={(e) => set(key, +e.target.value)}
                    className="w-full"
                    style={{
                      background: `linear-gradient(to right, rgba(79,143,247,0.5) 0%, rgba(79,143,247,0.5) ${((form[key] - min) / (max - min)) * 100}%, rgba(255,255,255,0.06) ${((form[key] - min) / (max - min)) * 100}%, rgba(255,255,255,0.06) 100%)`,
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-2 mt-5">
              <button onClick={predict} disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-[13px] font-medium text-white bg-accent-blue hover:bg-accent-blue/90 transition-colors disabled:opacity-40">
                {loading ? <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  : <><Send size={13} /> Predict</>}
              </button>
              <button onClick={simulate} disabled={loading}
                className="flex items-center gap-1.5 px-4 h-10 rounded-lg text-[13px] font-medium text-text-secondary hover:text-text-primary border border-border-primary hover:border-border-active transition-colors disabled:opacity-40">
                <RotateCcw size={13} /> Simulate
              </button>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="col-span-8 space-y-4">
          {!result ? (
            <div className="card flex flex-col items-center justify-center text-center py-24">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-accent-purple/8 mb-5">
                <Sparkles size={22} className="text-accent-purple" strokeWidth={1.5} />
              </div>
              <h3 className="text-[15px] font-semibold text-text-primary mb-1.5">Ready to Predict</h3>
              <p className="text-[13px] text-text-muted max-w-sm leading-relaxed">
                Adjust the network parameters or choose a preset scenario, then click Predict to get AI-powered congestion analysis.
              </p>
            </div>
          ) : (
            <>
              {/* Result */}
              <div className="card p-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03]"
                  style={{ background: `radial-gradient(circle at 30% 50%, ${cc.text}, transparent 60%)` }} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Prediction Result</h3>
                    <span className="text-[11px] text-text-muted">
                      via {result.prediction.source === 'model' ? 'ML Model' : 'Heuristic Engine'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-8">
                    {/* Congestion */}
                    <div className="flex flex-col items-center text-center">
                      <div className="text-[10px] text-text-muted uppercase tracking-wider mb-3">Congestion Level</div>
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-2"
                        style={{ background: cc.bg, border: `1px solid ${cc.border}` }}>
                        <span className="text-lg font-bold" style={{ color: cc.text }}>{cl}</span>
                      </div>
                      <p className="text-[11px] text-text-muted mt-1">
                        {cl === 'HIGH' ? 'Immediate action needed' : cl === 'MEDIUM' ? 'Monitoring recommended' : 'Operating normally'}
                      </p>
                    </div>

                    {/* Confidence */}
                    <div className="flex flex-col items-center text-center">
                      <div className="text-[10px] text-text-muted uppercase tracking-wider mb-3">AI Confidence</div>
                      <ConfidenceMeter value={result.prediction.confidence} />
                    </div>

                    {/* Priority */}
                    <div className="flex flex-col items-center text-center">
                      <div className="text-[10px] text-text-muted uppercase tracking-wider mb-3">Priority Class</div>
                      <div className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center mb-2 bg-accent-indigo/8 border border-accent-indigo/15">
                        <Target size={20} className="text-accent-indigo mb-1" strokeWidth={1.5} />
                        <span className="text-[15px] font-bold text-accent-indigo">{result.prediction.priority_class}</span>
                      </div>
                      <p className="text-[11px] text-text-muted mt-1">
                        {result.prediction.priority_class === 'HIGH' ? 'Critical traffic' : result.prediction.priority_class === 'MEDIUM' ? 'Standard traffic' : 'Best effort'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Input summary */}
              <div className="card p-5">
                <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">Input Summary</h3>
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { l: 'Zone', v: (result.input?.zone || form.zone).replace('_', ' ') },
                    { l: 'Signal', v: `${(result.input?.signal_strength ?? form.signal_strength).toFixed?.(1) ?? form.signal_strength} dBm` },
                    { l: 'Bandwidth', v: `${(result.input?.bandwidth_usage ?? form.bandwidth_usage).toFixed?.(1) ?? form.bandwidth_usage} Mbps` },
                    { l: 'Latency', v: `${(result.input?.latency ?? form.latency).toFixed?.(0) ?? form.latency} ms` },
                    { l: 'Packet Loss', v: `${(result.input?.packet_loss ?? form.packet_loss).toFixed?.(2) ?? form.packet_loss}%` },
                    { l: 'Users', v: result.input?.num_users_in_zone ?? form.num_users_in_zone },
                    { l: 'Time', v: `${result.input?.time_of_day ?? form.time_of_day}:00` },
                    { l: 'Source', v: result.prediction.model_loaded ? 'ML Model' : 'Heuristic' },
                  ].map((item) => (
                    <div key={item.l} className="p-2.5 rounded-lg bg-bg-secondary border border-border-subtle">
                      <div className="text-[10px] text-text-muted">{item.l}</div>
                      <div className="text-[13px] font-medium text-text-primary mt-0.5">{item.v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendation */}
              <div className="card p-5" style={{ borderColor: cc.border }}>
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={14} style={{ color: cc.text }} />
                  <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">AI Recommendation</h3>
                </div>
                {cl === 'HIGH' && (
                  <div className="space-y-2">
                    <p className="text-[13px] text-text-primary"><strong>Immediate action required.</strong> High congestion detected.</p>
                    <ul className="text-[12px] text-text-secondary space-y-1 ml-4 list-disc">
                      <li>Activate emergency 5G network slicing with high-priority allocation</li>
                      <li>Throttle non-critical streaming and download traffic</li>
                      <li>Route overflow traffic through adjacent cell towers</li>
                    </ul>
                  </div>
                )}
                {cl === 'MEDIUM' && (
                  <div className="space-y-2">
                    <p className="text-[13px] text-text-primary"><strong>Proactive optimization recommended.</strong> Moderate congestion building.</p>
                    <ul className="text-[12px] text-text-secondary space-y-1 ml-4 list-disc">
                      <li>Enable adaptive QoS policies to balance traffic priorities</li>
                      <li>Pre-allocate additional bandwidth for critical services</li>
                      <li>Monitor closely for escalation to high congestion</li>
                    </ul>
                  </div>
                )}
                {cl === 'LOW' && (
                  <div className="space-y-2">
                    <p className="text-[13px] text-text-primary"><strong>Optimal conditions.</strong> Network operating normally.</p>
                    <ul className="text-[12px] text-text-secondary space-y-1 ml-4 list-disc">
                      <li>Standard bandwidth allocation is sufficient</li>
                      <li>All traffic classes receiving adequate resources</li>
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="card p-5">
              <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">Prediction History</h3>
              <div className="space-y-1.5">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-hover transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-text-muted tabular-nums w-12">{h.time}</span>
                      <span className="text-[12px] font-medium text-text-primary">{h.zone?.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge level={h.congestion_label} size="sm" />
                      <span className="text-[11px] text-text-muted tabular-nums">{(h.confidence * 100).toFixed(0)}%</span>
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
