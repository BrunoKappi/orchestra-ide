import React, { useState } from 'react';
import { useOmmStore } from '../../store/useOmmStore';
import type { OmmStatus } from '../../types';
import {
  Plus,
  Copy,
  Play,
  CheckCircle2,
  Lock,
  XCircle,
  Zap,
  Download,
  Upload,
  RefreshCw,
  Settings,
  LayoutGrid,
  History,
  ClipboardList,
  Filter,
  Search,
  ChevronDown,
  Pause,
} from 'lucide-react';

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'danger' | 'success' | 'warning';
  disabled?: boolean;
  shortcut?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ icon, label, onClick, variant = 'default', disabled, shortcut }) => {
  const base = 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all select-none cursor-pointer border disabled:opacity-40 disabled:cursor-not-allowed';
  const variants = {
    default: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700',
    primary: 'bg-sky-600 border-sky-600 text-white hover:bg-sky-500 shadow-sm shadow-sky-500/20',
    success: 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-500 shadow-sm shadow-emerald-500/20',
    danger: 'bg-rose-600 border-rose-600 text-white hover:bg-rose-500 shadow-sm shadow-rose-500/20',
    warning: 'bg-amber-500 border-amber-500 text-white hover:bg-amber-400 shadow-sm shadow-amber-500/20',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={`${base} ${variants[variant]}`}
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
};

const Separator = () => <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 shrink-0" />;

interface GroupByOption {
  value: string | null;
  label: string;
}

const GROUP_BY_OPTIONS: GroupByOption[] = [
  { value: null, label: 'Sem agrupamento' },
  { value: 'areaName', label: 'Por Área' },
  { value: 'productName', label: 'Por Produto' },
  { value: 'status', label: 'Por Status' },
  { value: 'type', label: 'Por Tipo' },
  { value: 'operatorName', label: 'Por Operador' },
  { value: 'priority', label: 'Por Prioridade' },
  { value: 'orderNumber', label: 'Por Ordem' },
  { value: 'originTag', label: 'Por Origem' },
  { value: 'destinationTag', label: 'Por Destino' },
];

export const OmmToolbar: React.FC = () => {
  const selectedMovementId = useOmmStore((s) => s.selectedMovementId);
  const tableGroupBy = useOmmStore((s) => s.tableGroupBy);
  const simulatorState = useOmmStore((s) => s.simulatorState);
  const globalSearch = useOmmStore((s) => s.globalSearch);

  const setGlobalSearch = useOmmStore((s) => s.setGlobalSearch);
  const setTableGroupBy = useOmmStore((s) => s.setTableGroupBy);
  const toggleSimulator = useOmmStore((s) => s.toggleSimulator);
  const changeMovementStatus = useOmmStore((s) => s.changeMovementStatus);
  const duplicateMovement = useOmmStore((s) => s.duplicateMovement);
  const refresh = useOmmStore((s) => s.refresh);
  const setActiveView = useOmmStore((s) => s.setActiveView);

  const [groupByOpen, setGroupByOpen] = useState(false);

  const selectedMovement = useOmmStore((s) =>
    s.movements.find((m) => m.id === selectedMovementId) ?? null,
  );

  const handleStatusChange = (status: OmmStatus) => {
    if (selectedMovementId) changeMovementStatus(selectedMovementId, status);
  };

  const handleExportCsv = () => {
    const movements = useOmmStore.getState().getMovementRows();
    const headers = ['Número', 'Ordem', 'Status', 'Tipo', 'Produto', 'Área', 'Origem', 'Destino', 'Vol Planejado', 'Vol Atual', '% Concluído', 'Vazão', 'Accuracy'];
    const rows = movements.map((m) => [
      m.number, m.orderNumber, m.status, m.type, m.productName, m.areaName,
      m.originTag, m.destinationTag,
      m.plannedVolume.toFixed(0), m.currentVolume.toFixed(0),
      m.percentComplete.toFixed(1), m.currentFlow.toFixed(1), m.accuracy.toFixed(2),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omm-movements-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const handleExportJson = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      orders: useOmmStore.getState().orders,
      movements: useOmmStore.getState().movements,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omm-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const canActivate = selectedMovement?.status === 'Issued';
  const canComplete = selectedMovement?.status === 'Active';
  const canClose = selectedMovement?.status === 'Completed';
  const canCancel = selectedMovement?.status === 'Issued' || selectedMovement?.status === 'Active';

  const currentGroupLabel = GROUP_BY_OPTIONS.find((o) => o.value === tableGroupBy)?.label ?? 'Agrupar';

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shrink-0 overflow-x-auto">
      {/* Search */}
      <div className="relative shrink-0">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          placeholder="Buscar movimentos..."
          className="pl-8 pr-3 py-1.5 w-48 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all"
        />
      </div>

      <Separator />

      {/* Create */}
      <ToolbarButton icon={<Plus className="w-3.5 h-3.5" />} label="Nova Ordem" onClick={() => {}} variant="primary" />
      <ToolbarButton icon={<Plus className="w-3.5 h-3.5" />} label="Novo Movimento" onClick={() => {}} />

      {/* Duplicate */}
      <ToolbarButton
        icon={<Copy className="w-3.5 h-3.5" />}
        label="Duplicar"
        onClick={() => selectedMovementId && duplicateMovement(selectedMovementId)}
        disabled={!selectedMovementId}
      />

      <Separator />

      {/* Status actions */}
      <ToolbarButton
        icon={<Play className="w-3.5 h-3.5" />}
        label="Ativar"
        onClick={() => handleStatusChange('Active')}
        disabled={!canActivate}
        variant="success"
      />
      <ToolbarButton
        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
        label="Completar"
        onClick={() => handleStatusChange('Completed')}
        disabled={!canComplete}
        variant="primary"
      />
      <ToolbarButton
        icon={<Lock className="w-3.5 h-3.5" />}
        label="Fechar"
        onClick={() => handleStatusChange('Closed')}
        disabled={!canClose}
      />
      <ToolbarButton
        icon={<XCircle className="w-3.5 h-3.5" />}
        label="Cancelar"
        onClick={() => handleStatusChange('Canceled')}
        disabled={!canCancel}
        variant="danger"
      />

      <Separator />

      {/* Simulator */}
      <ToolbarButton
        icon={simulatorState.isRunning
          ? <Pause className="w-3.5 h-3.5" />
          : <Zap className="w-3.5 h-3.5" />
        }
        label={simulatorState.isRunning ? 'Pausar Sim' : 'Simular'}
        onClick={toggleSimulator}
        variant={simulatorState.isRunning ? 'warning' : 'default'}
      />

      <Separator />

      {/* Export */}
      <ToolbarButton icon={<Download className="w-3.5 h-3.5" />} label="CSV" onClick={handleExportCsv} />
      <ToolbarButton icon={<Download className="w-3.5 h-3.5" />} label="JSON" onClick={handleExportJson} />
      <ToolbarButton icon={<Upload className="w-3.5 h-3.5" />} label="Importar" onClick={() => {}} />

      <Separator />

      {/* Refresh */}
      <ToolbarButton icon={<RefreshCw className="w-3.5 h-3.5" />} label="Atualizar" onClick={refresh} />

      <Separator />

      {/* Views */}
      <ToolbarButton icon={<LayoutGrid className="w-3.5 h-3.5" />} label="Planta" onClick={() => setActiveView('plant')} />
      <ToolbarButton icon={<History className="w-3.5 h-3.5" />} label="Timeline" onClick={() => setActiveView('timeline')} />
      <ToolbarButton icon={<ClipboardList className="w-3.5 h-3.5" />} label="Inventário" onClick={() => setActiveView('inventory')} />

      <Separator />

      {/* Group by */}
      <div className="relative">
        <button
          onClick={() => setGroupByOpen(!groupByOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
        >
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentGroupLabel}</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>
        {groupByOpen && (
          <div className="absolute top-full mt-1 left-0 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 min-w-[180px]">
            {GROUP_BY_OPTIONS.map((opt) => (
              <button
                key={String(opt.value)}
                onClick={() => { setTableGroupBy(opt.value); setGroupByOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-[11px] font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800
                  ${tableGroupBy === opt.value ? 'text-sky-600 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/20' : 'text-slate-600 dark:text-slate-400'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Config */}
      <ToolbarButton icon={<Settings className="w-3.5 h-3.5" />} label="Config" onClick={() => setActiveView('admin')} />
    </div>
  );
};
