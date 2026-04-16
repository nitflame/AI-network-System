import { useEffect, useState } from 'react';

export default function MetricCard({ icon: Icon, label, value, suffix = '', color = '#2563EB' }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (typeof value !== 'number') { setDisplay(value); return; }
    const dur = 600, start = performance.now(), end = value;
    function tick(now) {
      const t = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - t, 3);
      setDisplay(Number.isInteger(end) ? Math.round(e * end) : +(e * end).toFixed(1));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value]);

  return (
    <div className="card px-4 py-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={13} style={{ color }} strokeWidth={1.75} />
        <span className="text-[10px] font-medium text-text-muted uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-[22px] font-semibold text-text-primary leading-none tracking-tight tabular-nums">{display}</span>
        {suffix && <span className="text-[12px] text-text-muted font-medium">{suffix}</span>}
      </div>
    </div>
  );
}
