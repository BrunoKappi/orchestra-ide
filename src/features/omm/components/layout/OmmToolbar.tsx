import React from "react";
import { useOmmStore } from "../../store/useOmmStore";
import type { OmmStatus } from "../../types";
import {
  Plus,
  Play,
  CheckCircle2,
  Lock,
  XCircle,
  Search,
  Layers,
  RotateCw,
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
    "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all select-none cursor-pointer border disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap";
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
  <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 shrink-0" />
);

export const OmmToolbar: React.FC = () => {
  const selectedMovementId = useOmmStore((s) => s.selectedMovementId);
  const globalSearch = useOmmStore((s) => s.globalSearch);

  const setGlobalSearch = useOmmStore((s) => s.setGlobalSearch);
  const changeMovementStatus = useOmmStore((s) => s.changeMovementStatus);
  const openOrderDialog = useOmmStore((s) => s.openOrderDialog);
  const openMovementModal = useOmmStore((s) => s.openMovementModal);
  const refresh = useOmmStore((s) => s.refresh);

  const selectedMovement = useOmmStore(
    (s) => s.movements.find((m) => m.id === selectedMovementId) ?? null,
  );

  const handleStatusChange = (status: OmmStatus) => {
    if (selectedMovementId) changeMovementStatus(selectedMovementId, status);
  };

  const canActivate = selectedMovement?.status === "Issued";
  const canComplete = selectedMovement?.status === "Active";
  const canClose = selectedMovement?.status === "Completed";
  const canCancel =
    selectedMovement?.status === "Issued" ||
    selectedMovement?.status === "Active";

  return (
    <div className="flex items-center gap-1.5 bg-transparent shrink-0 overflow-x-auto">
      {/* Search */}
      <div className="relative shrink-0">
        <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          placeholder="Buscar..."
          className="pl-7 pr-2.5 py-1 w-40 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[10px] outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all"
        />
      </div>

      <ToolbarButton
        icon={<RotateCw className="w-3 h-3" />}
        label="Atualizar"
        onClick={() => refresh()}
        shortcut="Atualizar movimentos"
      />

      <Separator />

      {/* Create */}
      <ToolbarButton
        icon={<Plus className="w-3 h-3" />}
        label="Nova Ordem"
        onClick={() => openOrderDialog()}
        variant="primary"
      />
      <ToolbarButton
        icon={<Layers className="w-3 h-3" />}
        label="Novo Movimento"
        onClick={() => openMovementModal()}
      />

      <Separator />

      {/* Status actions */}
      <ToolbarButton
        icon={<Play className="w-3 h-3" />}
        label="Ativar"
        onClick={() => handleStatusChange("Active")}
        disabled={!canActivate}
        variant="success"
      />
      <ToolbarButton
        icon={<CheckCircle2 className="w-3 h-3" />}
        label="Completar"
        onClick={() => handleStatusChange("Completed")}
        disabled={!canComplete}
        variant="primary"
      />
      <ToolbarButton
        icon={<Lock className="w-3 h-3" />}
        label="Fechar"
        onClick={() => handleStatusChange("Closed")}
        disabled={!canClose}
      />
      <ToolbarButton
        icon={<XCircle className="w-3 h-3" />}
        label="Cancelar"
        onClick={() => handleStatusChange("Canceled")}
        disabled={!canCancel}
        variant="danger"
      />
    </div>
  );
};
