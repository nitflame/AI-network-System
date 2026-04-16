const S = {
  HIGH:   { bg: 'rgba(248,113,113,0.1)', text: '#F87171', border: 'rgba(248,113,113,0.2)' },
  MEDIUM: { bg: 'rgba(251,191,36,0.1)', text: '#FBBF24', border: 'rgba(251,191,36,0.2)' },
  LOW:    { bg: 'rgba(52,211,153,0.1)', text: '#34D399', border: 'rgba(52,211,153,0.2)' },
};

export default function StatusBadge({ level, size = 'md' }) {
  const s = S[level] || S.LOW;
  const cls = size === 'sm' ? 'text-[9px] px-1.5 py-px' : 'text-[10px] px-2 py-0.5';
  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-md ${cls}`}
      style={{ color: s.text, background: s.bg, border: `1px solid ${s.border}` }}>
      <span className="w-1 h-1 rounded-full" style={{ background: s.text }} />
      {level}
    </span>
  );
}
