import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { MovementRow } from '../../types';
import { useOmmStore } from '../../store/useOmmStore';
import { ExternalLink } from 'lucide-react';

// ---------------------------------------------------------------------------
// Status badge (inline)
// ---------------------------------------------------------------------------
const STATUS_CONFIG = {
  Issued:    { label: 'Emitido',    dot: 'bg-slate-400',                   text: 'text-slate-400' },
  Active:    { label: 'Ativo',      dot: 'bg-emerald-500 animate-pulse',  text: 'text-emerald-400' },
  Completed: { label: 'Concluído',  dot: 'bg-blue-500',                    text: 'text-blue-400' },
  Closed:    { label: 'Fechado',    dot: 'bg-violet-500',                  text: 'text-violet-400' },
  Canceled:  { label: 'Cancelado', dot: 'bg-rose-500',                    text: 'text-rose-400' },
};

const PRIORITY_CONFIG = {
  Low:      { label: 'Baixa',   color: '#94a3b8' },
  Normal:   { label: 'Normal',  color: '#3b82f6' },
  High:     { label: 'Alta',    color: '#f59e0b' },
  Critical: { label: 'Crítica', color: '#ef4444' },
};

// ---------------------------------------------------------------------------
// Selection checkbox cell
// ---------------------------------------------------------------------------
const SelectionCheckboxCell: React.FC<{ row: MovementRow }> = ({ row }) => {
  const selectedMovementId = useOmmStore((s) => s.selectedMovementId);
  const setSelectedMovement = useOmmStore((s) => s.setSelectedMovement);
  const isSelected = selectedMovementId === row.id;

  return (
    <div className="flex items-center justify-center h-full w-full" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => {
          if (isSelected) {
            setSelectedMovement(null);
          } else {
            setSelectedMovement(row.id);
          }
        }}
        className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all duration-150 cursor-pointer focus:outline-none focus:ring-1 focus:ring-sky-500/30
          ${isSelected
            ? 'bg-sky-500 border-sky-500 text-white shadow-sm shadow-sky-500/20 scale-105'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-500'
          }`}
      >
        {isSelected && (
          <svg className="w-2.5 h-2.5 stroke-[3] stroke-current" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Status cell with inline dropdown
// ---------------------------------------------------------------------------
const StatusCell: React.FC<{ row: MovementRow }> = ({ row }) => {
  const [open, setOpen] = React.useState(false);
  const changeMovementStatus = useOmmStore((s) => s.changeMovementStatus);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const cfg = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.Issued;

  const options = Object.entries(STATUS_CONFIG) as [keyof typeof STATUS_CONFIG, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][];

  return (
    <div className="relative" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border border-transparent hover:border-slate-600 transition-colors cursor-pointer ${cfg.text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 min-w-[120px]">
          {options.map(([status, c]) => (
            <button
              key={status}
              onClick={() => { changeMovementStatus(row.id, status); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold text-left hover:bg-slate-800 transition-colors ${c.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Priority cell with inline dropdown
// ---------------------------------------------------------------------------
const PriorityCell: React.FC<{ row: MovementRow }> = ({ row }) => {
  const [open, setOpen] = React.useState(false);
  const updateMovement = useOmmStore((s) => s.updateMovement);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const cfg = PRIORITY_CONFIG[row.priority] ?? PRIORITY_CONFIG.Normal;

  return (
    <div className="relative" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 text-[10px] font-bold cursor-pointer hover:opacity-80 transition-opacity"
        style={{ color: cfg.color }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
        {cfg.label}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 min-w-[100px]">
          {(Object.entries(PRIORITY_CONFIG) as [keyof typeof PRIORITY_CONFIG, typeof PRIORITY_CONFIG[keyof typeof PRIORITY_CONFIG]][]).map(([prio, c]) => (
            <button
              key={prio}
              onClick={() => { updateMovement(row.id, { priority: prio }); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold text-left hover:bg-slate-800 transition-colors"
              style={{ color: c.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Progress bar inline
// ---------------------------------------------------------------------------
const ProgressInline: React.FC<{ pct: number }> = ({ pct }) => {
  const clamped = Math.min(100, Math.max(0, pct));
  const color = clamped >= 90 ? 'bg-emerald-500' : clamped >= 50 ? 'bg-sky-500' : 'bg-amber-500';
  return (
    <div className="flex items-center gap-1.5 min-w-[72px]">
      <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 w-7 text-right shrink-0">{clamped.toFixed(0)}%</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------
type ColDef = ColumnDef<MovementRow>;

function col<T>(
  id: string,
  header: string,
  accessorFn: (r: MovementRow) => T,
  cell: (val: T, row: MovementRow) => React.ReactNode,
  size = 120,
): ColDef {
  return {
    id,
    header,
    accessorFn: accessorFn as (r: MovementRow) => unknown,
    cell: ({ getValue, row }) => cell(getValue() as T, row.original),
    enableSorting: true,
    enableResizing: true,
    size,
    minSize: 60,
  };
}

// ---------------------------------------------------------------------------
// Number cell — opens movement modal on click
// ---------------------------------------------------------------------------
const NumberCell: React.FC<{ id: string; number: string }> = ({ id, number }) => {
  const openMovementModal = useOmmStore((s) => s.openMovementModal);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); openMovementModal(id); }}
      title="Abrir movimento"
      className="group inline-flex items-center gap-1 font-mono text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-200 hover:underline transition-colors cursor-pointer"
    >
      {number}
      <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
};

const TankCell: React.FC<{ tankId: string; tag: string }> = ({ tankId, tag }) => {
  const openTelemetryModal = useOmmStore((s) => s.openTelemetryModal);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); openTelemetryModal(tankId); }}
      title="Abrir telemetria do tanque"
      className="group inline-flex items-center gap-1 font-mono text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-200 hover:underline transition-colors cursor-pointer text-left"
    >
      {tag}
    </button>
  );
};

export const movementColumnDefs: ColDef[] = [
  {
    id: 'select',
    header: '',
    accessorFn: (r) => r,
    cell: ({ row }) => <SelectionCheckboxCell row={row.original} />,
    enableSorting: false,
    enableResizing: false,
    size: 40,
    minSize: 40,
  } as ColDef,

  col('number', 'Nº Mov.', (r) => r, (_, row) => (
    <NumberCell id={row.id} number={row.number} />
  ), 90),

  col('orderNumber', 'Ordem', (r) => r.orderNumber, (v) => (
    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{v}</span>
  ), 105),

  col('movementTypeName', 'Tipo', (r) => r, (_, row) => (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
      style={{ color: row.movementTypeColor, backgroundColor: row.movementTypeColor + '20' }}
    >
      {row.movementTypeName}
    </span>
  ), 120),

  col('originTag', 'Origem', (r) => r, (_, row) => (
    <TankCell tankId={row.originId} tag={row.originTag} />
  ), 80),

  col('destinationTag', 'Destino', (r) => r, (_, row) => (
    <TankCell tankId={row.destinationId} tag={row.destinationTag} />
  ), 80),

  col('productName', 'Produto', (r) => r, (_, row) => (
    <span className="flex items-center gap-1.5 text-[11px]">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: row.productColor }} />
      <span className="truncate">{row.productName}</span>
    </span>
  ), 130),

  col('areaName', 'Área', (r) => r.areaName, (v) => (
    <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{v}</span>
  ), 130),

  col('status', 'Status', (r) => r.status, (_, row) => (
    <StatusCell row={row} />
  ), 100),

  col('priority', 'Prioridade', (r) => r.priority, (_, row) => (
    <PriorityCell row={row} />
  ), 80),

  col('plannedVolume', 'Vol. Plan.', (r) => r.plannedVolume, (v, row) => (
    <span className="font-mono text-[11px] font-semibold text-slate-900 dark:text-slate-100">
      {v >= 1000 ? (v / 1000).toFixed(2) + 'k' : v.toFixed(0)} {row.engUnitSymbol}
    </span>
  ), 90),

  col('currentVolume', 'Vol. Mov.', (r) => r.currentVolume, (v, row) => (
    <span className={`font-mono text-[11px] font-semibold ${v > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
      {v >= 1000 ? (v / 1000).toFixed(2) + 'k' : v.toFixed(0)} {row.engUnitSymbol}
    </span>
  ), 90),

  col('percentComplete', '%', (r) => r.percentComplete, (v) => (
    <ProgressInline pct={v} />
  ), 90),

  col('currentFlow', 'Vazão', (r) => r.currentFlow, (v) => (
    <span className={`font-mono text-[11px] font-semibold ${v > 0 ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500'}`}>
      {v > 0 ? `${v.toFixed(0)} m³/h` : '—'}
    </span>
  ), 85),
];

export const DEFAULT_VISIBLE_COLUMNS = new Set([
  'select', 'number', 'orderNumber', 'movementTypeName', 'originTag', 'destinationTag',
  'productName', 'areaName', 'status', 'priority',
  'plannedVolume', 'currentVolume', 'percentComplete', 'currentFlow',
]);
