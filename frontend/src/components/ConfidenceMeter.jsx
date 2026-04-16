import { useEffect, useState } from 'react';

export default function ConfidenceMeter({ value, size = 80 }) {
  const [a, setA] = useState(0);
  const sw = 5, r = (size - sw) / 2, circ = r * 2 * Math.PI;
  const pct = Math.min(Math.max(value, 0), 1);
  useEffect(() => { setTimeout(() => setA(pct), 80); }, [pct]);
  const color = pct >= 0.8 ? '#34D399' : pct >= 0.6 ? '#FBBF24' : '#F87171';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ - a * circ}
          style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4, 0, 0.2, 1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-semibold text-text-primary">{Math.round(a * 100)}%</span>
        <span className="text-[8px] text-text-muted font-medium uppercase tracking-wide">Conf.</span>
      </div>
    </div>
  );
}
