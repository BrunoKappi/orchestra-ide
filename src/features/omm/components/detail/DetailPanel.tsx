import React from 'react';
import { useOmmStore } from '../../store/useOmmStore';
import {
  X,
  Info,
  Wrench,
  Database,
  Play,
  Clock,
  Bell,
  ClipboardList,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { StatusBadge, PriorityBadge } from '../ui/OmmBadges';
import { GeneralTab } from './tabs/GeneralTab';
import { EquipmentsTab } from './tabs/EquipmentsTab';
import { CapturedTab } from './tabs/CapturedTab';
import { SimulationTab } from './tabs/SimulationTab';
import { HistoryTab } from './tabs/HistoryTab';
import { AlarmsTab } from './tabs/AlarmsTab';
import { AuditTab } from './tabs/AuditTab';
import { TrendsTab } from './tabs/TrendsTab';

// ---------------------------------------------------------------------------
// Tab config
// ---------------------------------------------------------------------------
interface TabConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.FC<{ movementId: string }>;
}

const TABS: TabConfig[] = [
  { id: 'general',     label: 'Geral',        icon: <Info className="w-3.5 h-3.5" />,         component: GeneralTab },
  { id: 'equipments',  label: 'Equipamentos', icon: <Wrench className="w-3.5 h-3.5" />,        component: EquipmentsTab },
  { id: 'captured',    label: 'Capturado',    icon: <Database className="w-3.5 h-3.5" />,      component: CapturedTab },
  { id: 'simulation',  label: 'Simulação',    icon: <Play className="w-3.5 h-3.5" />,          component: SimulationTab },
  { id: 'history',     label: 'Histórico',    icon: <Clock className="w-3.5 h-3.5" />,         component: HistoryTab },
  { id: 'alarms',      label: 'Alarmes',      icon: <Bell className="w-3.5 h-3.5" />,          component: AlarmsTab },
  { id: 'audit',       label: 'Auditoria',    icon: <ClipboardList className="w-3.5 h-3.5" />, component: AuditTab },
  { id: 'trends',      label: 'Tendências',   icon: <TrendingUp className="w-3.5 h-3.5" />,    component: TrendsTab },
];

// ---------------------------------------------------------------------------
// Detail Panel
// ---------------------------------------------------------------------------
export const DetailPanel: React.FC = () => {
  const selectedMovementId = useOmmStore((s) => s.selectedMovementId);
  const detailPanelTab = useOmmStore((s) => s.detailPanelTab);
  const isDetailPanelOpen = useOmmStore((s) => s.isDetailPanelOpen);
  const setDetailPanelTab = useOmmStore((s) => s.setDetailPanelTab);
  const setDetailPanelOpen = useOmmStore((s) => s.setDetailPanelOpen);
  const setSelectedMovement = useOmmStore((s) => s.setSelectedMovement);

  const movement = useOmmStore((s) =>
    s.movements.find((m) => m.id === selectedMovementId) ?? null,
  );
  const order = useOmmStore((s) =>
    movement ? s.orders.find((o) => o.id === movement.orderId) ?? null : null,
  );

  if (!isDetailPanelOpen || !selectedMovementId || !movement) {
    return null;
  }

  const ActiveTab = TABS.find((t) => t.id === detailPanelTab)?.component ?? GeneralTab;

  return (
    <div className="w-[480px] min-w-[400px] flex flex-col border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shrink-0 animate-in slide-in-from-right duration-200">
      {/* Panel header */}
      <div className="flex items-start justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-900 shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm font-bold text-sky-600 dark:text-sky-400">{movement.number}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-mono text-xs text-slate-500">{order?.number ?? '—'}</span>
            <StatusBadge status={movement.status} size="xs" />
          </div>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={movement.priority} />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{movement.type}</span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{movement.measurementMethod}</span>
          </div>
        </div>
        <button
          onClick={() => { setDetailPanelOpen(false); setSelectedMovement(null); }}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
        {TABS.map((tab) => {
          const isActive = detailPanelTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setDetailPanelTab(tab.id)}
              className={`
                flex items-center gap-1.5 px-3 py-2 text-[10px] font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer
                ${isActive
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        <ActiveTab movementId={selectedMovementId} />
      </div>
    </div>
  );
};
