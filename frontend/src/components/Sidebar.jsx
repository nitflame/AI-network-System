import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, Brain, Layers, Radio } from 'lucide-react';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/monitor', icon: Activity, label: 'Network Monitor' },
  { to: '/predict', icon: Brain, label: 'AI Prediction' },
  { to: '/slicing', icon: Layers, label: '5G Slicing' },
];

export default function Sidebar() {
  return (
    <aside className="w-[220px] shrink-0 h-screen flex flex-col bg-bg-secondary border-r border-border-primary">
      <div className="flex items-center gap-2.5 px-5 h-14 shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-accent-blue/10">
          <Radio size={14} className="text-accent-blue" />
        </div>
        <div>
          <div className="text-[13px] font-semibold text-text-primary leading-tight">NetIntel AI</div>
          <div className="text-[10px] text-text-muted leading-tight">5G Network Intelligence</div>
        </div>
      </div>
      <div className="mx-4 h-px bg-border-primary" />
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 h-8 rounded-lg text-[12px] font-medium transition-colors duration-150 ${
                isActive ? 'bg-accent-blue/8 text-accent-blue' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`
            }>
            {({ isActive }) => (
              <>
                <Icon size={15} strokeWidth={isActive ? 2 : 1.75} className="shrink-0" />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
