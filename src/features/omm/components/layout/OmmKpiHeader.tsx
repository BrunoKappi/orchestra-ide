import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useOmmStore } from '../../store/useOmmStore';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Droplets,
  Package,
  XCircle,
  Timer,
} from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  pulse?: boolean;
  highlight?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, sub, icon, color, pulse, highlight }) => (
  <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all
    ${highlight
      ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50'
      : 'bg-white/60 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/50'
    }`}>
    <div className={`p-1.5 rounded-lg ${color} shrink-0`}>
      <div className={pulse ? 'animate-pulse' : ''}>
        {icon}
      </div>
    </div>
    <div className="min-w-0">
      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none mb-0.5 truncate">{label}</div>
      <div className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none">{value}</div>
      {sub && <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{sub}</div>}
    </div>
  </div>
);

export const OmmKpiHeader: React.FC = () => {
  const metrics = useOmmStore(
    useShallow((s) => {
      const m = s.movements;
      const activeMovs = m.filter((x) => x.status === 'Active');
      const nonIssued = m.filter((x) => x.status !== 'Issued');
      return {
        totalOrders: s.orders.length,
        issued: m.filter((x) => x.status === 'Issued').length,
        active: activeMovs.length,
        completed: m.filter((x) => x.status === 'Completed').length,
        closed: m.filter((x) => x.status === 'Closed').length,
        canceled: m.filter((x) => x.status === 'Canceled').length,
        activeAlarms: s.alarms.filter((a) => a.isActive && !a.acknowledged).length,
        dailyVol: nonIssued.reduce((acc, x) => acc + x.currentVolume, 0),
        simRunning: s.simulatorState.isRunning,
        simSpeed: s.simulatorState.speedMultiplier,
      };
    }),
  );

  return (
    <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50/80 to-white dark:from-slate-900/80 dark:to-slate-900 shrink-0">
      <div className="flex items-center gap-2 flex-wrap">
        {/* KPI Cards */}
        <KpiCard
          label="Ordens"
          value={metrics.totalOrders}
          icon={<Package className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />}
          color="bg-slate-100 dark:bg-slate-700"
        />
        <KpiCard
          label="Emitidos"
          value={metrics.issued}
          icon={<Timer className="w-3.5 h-3.5 text-slate-500" />}
          color="bg-slate-100 dark:bg-slate-700"
        />
        <KpiCard
          label="Ativos"
          value={metrics.active}
          icon={<Activity className="w-3.5 h-3.5 text-emerald-600" />}
          color="bg-emerald-100 dark:bg-emerald-900/40"
          highlight={metrics.active > 0}
          pulse={metrics.simRunning && metrics.active > 0}
        />
        <KpiCard
          label="Concluídos"
          value={metrics.completed}
          icon={<CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
          color="bg-blue-100 dark:bg-blue-900/40"
        />
        <KpiCard
          label="Fechados"
          value={metrics.closed}
          icon={<CheckCircle2 className="w-3.5 h-3.5 text-violet-600" />}
          color="bg-violet-100 dark:bg-violet-900/40"
        />
        <KpiCard
          label="Cancelados"
          value={metrics.canceled}
          icon={<XCircle className="w-3.5 h-3.5 text-rose-500" />}
          color="bg-rose-100 dark:bg-rose-900/40"
        />
        <KpiCard
          label="Volume do Dia"
          value={metrics.dailyVol >= 1000 ? `${(metrics.dailyVol / 1000).toFixed(1)}k m³` : `${metrics.dailyVol.toFixed(0)} m³`}
          icon={<Droplets className="w-3.5 h-3.5 text-cyan-600" />}
          color="bg-cyan-100 dark:bg-cyan-900/40"
        />
        <KpiCard
          label="Alarmes"
          value={metrics.activeAlarms}
          icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
          color="bg-amber-100 dark:bg-amber-900/40"
          pulse={metrics.activeAlarms > 0}
        />
      </div>
    </div>
  );
};
