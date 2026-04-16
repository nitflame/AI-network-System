import { Building2, BookOpen, Coffee, GraduationCap, Trophy } from 'lucide-react';
import StatusBadge from './StatusBadge';

const CFG = {
  Hostel:         { icon: Building2, color: '#A78BFA' },
  Library:        { icon: BookOpen, color: '#22D3EE' },
  Cafeteria:      { icon: Coffee, color: '#FBBF24' },
  Academic_Block: { icon: GraduationCap, color: '#4F8FF7' },
  Stadium:        { icon: Trophy, color: '#F87171' },
};

export default function ZoneCard({ zone, data, prediction, onClick }) {
  const { icon: Icon, color } = CFG[zone] || CFG.Hostel;
  const congestion = prediction?.congestion_label || 'LOW';
  const name = zone.replace('_', ' ');

  return (
    <button onClick={onClick} className="card p-3 text-left w-full cursor-pointer hover:border-border-active transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={14} style={{ color }} strokeWidth={1.75} />
          <span className="text-[12px] font-semibold text-text-primary">{name}</span>
        </div>
        <StatusBadge level={congestion} size="sm" />
      </div>
      {data && (
        <div className="grid grid-cols-3 gap-2">
          <div>
            <div className="text-[9px] text-text-muted">Users</div>
            <div className="text-[12px] font-semibold text-text-primary tabular-nums">{data.num_users_in_zone}</div>
          </div>
          <div>
            <div className="text-[9px] text-text-muted">Latency</div>
            <div className="text-[12px] font-semibold text-text-primary tabular-nums">{data.latency?.toFixed(0)}ms</div>
          </div>
          <div>
            <div className="text-[9px] text-text-muted">BW</div>
            <div className="text-[12px] font-semibold text-text-primary tabular-nums">{data.bandwidth_usage?.toFixed(1)}</div>
          </div>
        </div>
      )}
    </button>
  );
}
