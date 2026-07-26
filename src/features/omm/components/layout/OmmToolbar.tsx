import React, { useState, useRef } from "react";
import { useOmmStore } from "../../store/useOmmStore";
import type { OmmStatus } from "../../types";
import {
  Plus,
  Copy,
  Play,
  CheckCircle2,
  Lock,
  XCircle,
  Zap,
  Upload,
  RefreshCw,
  Settings,
  Filter,
  Search,
  ChevronDown,
  Pause,
  Layers,
  Edit3,
} from "lucide-react";

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "primary" | "danger" | "success" | "warning";
  disabled?: boolean;
  shortcut?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  label,
  onClick,
  variant = "default",
  disabled,
  shortcut,
}) => {
  const base =
    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all select-none cursor-pointer border disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap";
  const variants = {
    default:
      "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700",
    primary:
      "bg-sky-600 border-sky-600 text-white hover:bg-sky-500 shadow-sm shadow-sky-500/20",
    success:
      "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-500 shadow-sm shadow-emerald-500/20",
    danger:
      "bg-rose-600 border-rose-600 text-white hover:bg-rose-500 shadow-sm shadow-rose-500/20",
    warning:
      "bg-amber-500 border-amber-500 text-white hover:bg-amber-400 shadow-sm shadow-amber-500/20",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={`${base} ${variants[variant]}`}>
      {icon}
      <span>{label}</span>
    </button>
  );
};

const Separator = () => (
  <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 shrink-0" />
);

interface GroupByOption {
  value: string | null;
  label: string;
}

const GROUP_BY_OPTIONS: GroupByOption[] = [
  { value: null, label: "Sem agrupamento" },
  { value: "areaName", label: "Por Área" },
  { value: "productName", label: "Por Produto" },
  { value: "status", label: "Por Status" },
  { value: "type", label: "Por Tipo" },
  { value: "operatorName", label: "Por Operador" },
  { value: "priority", label: "Por Prioridade" },
  { value: "orderNumber", label: "Por Ordem" },
  { value: "originTag", label: "Por Origem" },
  { value: "destinationTag", label: "Por Destino" },
];

export const OmmToolbar: React.FC = () => {
  const selectedMovementId = useOmmStore((s) => s.selectedMovementId);
  const tableGroupBy = useOmmStore((s) => s.tableGroupBy);
  const simulatorState = useOmmStore((s) => s.simulatorState);
  const globalSearch = useOmmStore((s) => s.globalSearch);

  const setGlobalSearch = useOmmStore((s) => s.setGlobalSearch);
  const setTableGroupBy = useOmmStore((s) => s.setTableGroupBy);
  const openSimulatorModal = useOmmStore((s) => s.openSimulatorModal);
  const changeMovementStatus = useOmmStore((s) => s.changeMovementStatus);
  const duplicateMovement = useOmmStore((s) => s.duplicateMovement);
  const refresh = useOmmStore((s) => s.refresh);
  const setActiveView = useOmmStore((s) => s.setActiveView);
  const openOrderDialog = useOmmStore((s) => s.openOrderDialog);
  const openMovementDialog = useOmmStore((s) => s.openMovementDialog);

  const [groupByOpen, setGroupByOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedMovement = useOmmStore(
    (s) => s.movements.find((m) => m.id === selectedMovementId) ?? null,
  );

  const handleStatusChange = (status: OmmStatus) => {
    if (selectedMovementId) changeMovementStatus(selectedMovementId, status);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const store = useOmmStore.getState();
        if (Array.isArray(data.movements)) {
          data.movements.forEach((m: any) => store.updateMovement(m.id, m));
        }
        if (Array.isArray(data.orders)) {
          data.orders.forEach((o: any) => store.updateOrder(o.id, o));
        }
        store.refresh();
      } catch {
        setImportError("Arquivo JSON inválido");
        setTimeout(() => setImportError(null), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const canActivate = selectedMovement?.status === "Issued";
  const canComplete = selectedMovement?.status === "Active";
  const canClose = selectedMovement?.status === "Completed";
  const canCancel =
    selectedMovement?.status === "Issued" ||
    selectedMovement?.status === "Active";

  const currentGroupLabel =
    GROUP_BY_OPTIONS.find((o) => o.value === tableGroupBy)?.label ?? "Agrupar";

  return (
    <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shrink-0 overflow-x-auto">
      {/* Search */}
      <div className="relative shrink-0">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          placeholder="Buscar..."
          className="pl-8 pr-3 py-1.5 w-40 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all"
        />
      </div>

      <Separator />

      {/* Create */}
      <ToolbarButton
        icon={<Plus className="w-3.5 h-3.5" />}
        label="Nova Ordem"
        onClick={() => openOrderDialog()}
        variant="primary"
      />
      <ToolbarButton
        icon={<Layers className="w-3.5 h-3.5" />}
        label="Novo Movimento"
        onClick={() => openMovementDialog()}
      />

      {/* Edit selected */}
      <ToolbarButton
        icon={<Edit3 className="w-3.5 h-3.5" />}
        label="Editar"
        onClick={() =>
          selectedMovementId && openMovementDialog(selectedMovementId)
        }
        disabled={!selectedMovementId}
      />

      {/* Duplicate */}
      <ToolbarButton
        icon={<Copy className="w-3.5 h-3.5" />}
        label="Duplicar"
        onClick={() =>
          selectedMovementId && duplicateMovement(selectedMovementId)
        }
        disabled={!selectedMovementId}
      />

      <Separator />

      {/* Status actions */}
      <ToolbarButton
        icon={<Play className="w-3.5 h-3.5" />}
        label="Ativar"
        onClick={() => handleStatusChange("Active")}
        disabled={!canActivate}
        variant="success"
      />
      <ToolbarButton
        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
        label="Completar"
        onClick={() => handleStatusChange("Completed")}
        disabled={!canComplete}
        variant="primary"
      />
      <ToolbarButton
        icon={<Lock className="w-3.5 h-3.5" />}
        label="Fechar"
        onClick={() => handleStatusChange("Closed")}
        disabled={!canClose}
      />
      <ToolbarButton
        icon={<XCircle className="w-3.5 h-3.5" />}
        label="Cancelar"
        onClick={() => handleStatusChange("Canceled")}
        disabled={!canCancel}
        variant="danger"
      />

      <Separator />

      {/* Simulator */}
      <ToolbarButton
        icon={
          simulatorState.isRunning ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Zap className="w-3.5 h-3.5" />
          )
        }
        label={simulatorState.isRunning ? "Simulador (Ativo)" : "Simulador"}
        onClick={openSimulatorModal}
        variant={simulatorState.isRunning ? "warning" : "default"}
      />

      <Separator />

      {/* Export / Import */}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportJson}
      />
      <ToolbarButton
        icon={<Upload className="w-3.5 h-3.5" />}
        label="Importar"
        onClick={() => fileInputRef.current?.click()}
      />
      {importError && (
        <span className="text-[10px] text-rose-500 font-semibold">
          {importError}
        </span>
      )}

      <Separator />

      {/* Refresh */}
      <ToolbarButton
        icon={<RefreshCw className="w-3.5 h-3.5" />}
        label="Atualizar"
        onClick={refresh}
      />

      {/* Group by */}
      <div className="relative">
        <button
          onClick={() => setGroupByOpen(!groupByOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer whitespace-nowrap">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentGroupLabel}</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>
        {groupByOpen && (
          <div className="absolute top-full mt-1 left-0 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 min-w-[180px]">
            {GROUP_BY_OPTIONS.map((opt) => (
              <button
                key={String(opt.value)}
                onClick={() => {
                  setTableGroupBy(opt.value);
                  setGroupByOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-[11px] font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer
                  ${tableGroupBy === opt.value ? "text-sky-600 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/20" : "text-slate-600 dark:text-slate-400"}`}>
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Admin */}
      <ToolbarButton
        icon={<Settings className="w-3.5 h-3.5" />}
        label="Admin"
        onClick={() => setActiveView("admin")}
      />
    </div>
  );
};
