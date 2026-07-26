import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { MovementRow } from '../../types';
import { useOmmStore } from '../../store/useOmmStore';
import {
  AccuracyBar,
  ProgressBar,
  FlowDisplay,
  TimeDisplay,
  VolumeDisplay,
  ProductDot,
} from '../ui/OmmBadges';

// ---------------------------------------------------------------------------
// Column helper
// ---------------------------------------------------------------------------
const col = <T,>(
  id: string,
  header: string,
  accessorFn: (row: MovementRow) => T,
  cell: (value: T, row: MovementRow) => React.ReactNode,
  options: Partial<ColumnDef<MovementRow>> = {},
): ColumnDef<MovementRow> => ({
  id,
  header,
  accessorFn: accessorFn as (row: MovementRow) => unknown,
  cell: ({ getValue, row }) => cell(getValue() as T, row.original),
  enableSorting: true,
  enableResizing: true,
  size: 120,
  minSize: 60,
  ...options,
});

// ---------------------------------------------------------------------------
// Custom selectors for Status, Priority and Type
// ---------------------------------------------------------------------------
const StatusCellSelector: React.FC<{ row: MovementRow }> = ({ row }) => {
  const [open, setOpen] = React.useState(false);
  const changeMovementStatus = useOmmStore((s) => s.changeMovementStatus);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const options: { value: typeof row.status; label: string; bg: string; text: string; dot: string }[] = [
    { value: 'Issued', label: 'Emitido', bg: 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700', text: 'text-slate-600 dark:text-slate-300', dot: 'bg-slate-400' },
    { value: 'Active', label: 'Ativo', bg: 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100/50', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500 animate-pulse' },
    { value: 'Completed', label: 'Concluído', bg: 'bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100/50', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
    { value: 'Closed', label: 'Fechado', bg: 'bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100/50', text: 'text-violet-700 dark:text-violet-300', dot: 'bg-violet-500' },
    { value: 'Canceled', label: 'Cancelado', bg: 'bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100/50', text: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500' },
  ];

  const current = options.find(o => o.value === row.status) || options[0];

  return (
    <div className="relative inline-block" ref={containerRef} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer shadow-sm ${current.text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
        <span>{current.label}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 min-w-[120px]">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                changeMovementStatus(row.id, opt.value);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${opt.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const PriorityCellSelector: React.FC<{ row: MovementRow }> = ({ row }) => {
  const [open, setOpen] = React.useState(false);
  const updateMovement = useOmmStore((s) => s.updateMovement);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const options: { value: typeof row.priority; label: string; text: string }[] = [
    { value: 'Low', label: 'Baixa', text: 'text-slate-400 dark:text-slate-500' },
    { value: 'Normal', label: 'Normal', text: 'text-sky-500' },
    { value: 'High', label: 'Alta', text: 'text-amber-500' },
    { value: 'Critical', label: 'Crítica', text: 'text-rose-500 font-extrabold' },
  ];

  const current = options.find(o => o.value === row.priority) || options[1];

  return (
    <div className="relative inline-block" ref={containerRef} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer shadow-sm ${current.text}`}
      >
        <span>{current.label}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 min-w-[100px]">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                updateMovement(row.id, { priority: opt.value });
                setOpen(false);
              }}
              className={`w-full flex items-center px-3 py-1.5 text-[10px] font-bold text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${opt.text}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const TypeCellSelector: React.FC<{ row: MovementRow }> = ({ row }) => {
  const [open, setOpen] = React.useState(false);
  const updateMovement = useOmmStore((s) => s.updateMovement);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const options: { value: typeof row.type; label: string; text: string }[] = [
    { value: 'Transfer', label: 'Transferência', text: 'text-blue-600 dark:text-blue-400' },
    { value: 'Receipt', label: 'Recebimento', text: 'text-emerald-600 dark:text-emerald-400' },
    { value: 'Dispatch', label: 'Expedição', text: 'text-amber-600 dark:text-amber-400' },
    { value: 'Internal', label: 'Interno', text: 'text-indigo-600 dark:text-indigo-400' },
    { value: 'Recirculation', label: 'Recirculação', text: 'text-violet-600 dark:text-violet-400' },
    { value: 'Blending', label: 'Blending', text: 'text-pink-600 dark:text-pink-400' },
  ];

  const current = options.find(o => o.value === row.type) || options[0];

  return (
    <div className="relative inline-block" ref={containerRef} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer shadow-sm ${current.text}`}
      >
        <span>{current.label}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 min-w-[130px]">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                updateMovement(row.id, { type: opt.value });
                setOpen(false);
              }}
              className={`w-full flex items-center px-3 py-1.5 text-[10px] font-bold text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${opt.text}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------
export const movementColumnDefs: ColumnDef<MovementRow>[] = [
  // Selection checkbox
  {
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
        className="rounded border-slate-300 text-sky-600 cursor-pointer"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
        className="rounded border-slate-300 text-sky-600 cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableResizing: false,
    size: 36,
    minSize: 36,
    maxSize: 36,
  },

  col('number', 'Movimento', (r) => r.number, (v) => (
    <span className="font-mono text-[11px] font-bold text-sky-600 dark:text-sky-400">{v}</span>
  ), { size: 100 }),

  col('orderNumber', 'Ordem', (r) => r.orderNumber, (v) => (
    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">{v}</span>
  ), { size: 90 }),

  col('status', 'Status', (r) => r.status, (_v, row) => (
    <StatusCellSelector row={row} />
  ), { size: 110 }),

  col('priority', 'Prioridade', (r) => r.priority, (_v, row) => (
    <PriorityCellSelector row={row} />
  ), { size: 90 }),

  col('type', 'Tipo', (r) => r.type, (_v, row) => (
    <TypeCellSelector row={row} />
  ), { size: 110 }),

  col('category', 'Categoria', (r) => r.category, (v) => (
    <span className="text-[11px] text-slate-500 dark:text-slate-400">{v}</span>
  ), { size: 90 }),

  col('productName', 'Produto', (r) => r.productName, (v, row) => (
    <ProductDot color={row.productColor} name={v} />
  ), { size: 160 }),

  col('areaName', 'Área', (r) => r.areaId, (v, row) => {
    const { areas, updateMovement } = useOmmStore.getState();
    return (
      <select
        value={v}
        onChange={(e) => updateMovement(row.id, { areaId: e.target.value })}
        className="text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 outline-none text-slate-700 dark:text-slate-200 w-full cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      >
        {areas.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
    );
  }, { size: 150 }),

  col('operatorName', 'Operador', (r) => r.operatorId, (v, row) => {
    const { operators, updateMovement } = useOmmStore.getState();
    return (
      <select
        value={v}
        onChange={(e) => updateMovement(row.id, { operatorId: e.target.value })}
        className="text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 outline-none text-slate-700 dark:text-slate-200 w-full cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      >
        {operators.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
    );
  }, { size: 130 }),

  col('originTag', 'Origem', (r) => r.originTag, (v) => (
    <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-200">{v}</span>
  ), { size: 90 }),

  col('viaTag', 'Via', (r) => r.viaTag ?? '—', (v) => (
    <span className="font-mono text-[11px] text-slate-400">{v}</span>
  ), { size: 80 }),

  col('destinationTag', 'Destino', (r) => r.destinationTag, (v) => (
    <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-200">{v}</span>
  ), { size: 90 }),

  col('alignmentCode', 'Alinhamento', (r) => r.alignmentCode ?? '—', (v) => (
    <span className="text-[11px] font-mono text-slate-400">{v}</span>
  ), { size: 100 }),

  col('meterTag', 'Medidor', (r) => r.meterTag ?? '—', (v) => (
    <span className="font-mono text-[11px] text-slate-400">{v}</span>
  ), { size: 80 }),

  col('measurementMethod', 'Método Med.', (r) => r.measurementMethod, (v, row) => {
    const updateMovement = useOmmStore.getState().updateMovement;
    return (
      <select
        value={v}
        onChange={(e) => updateMovement(row.id, { measurementMethod: e.target.value as any })}
        className="text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 outline-none text-slate-700 dark:text-slate-200 cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      >
        <option value="FlowMeter">Medidor de Vazão</option>
        <option value="TankGauging">Telemetria de Tanque</option>
        <option value="Manual">Manual</option>
        <option value="Calculated">Calculado</option>
      </select>
    );
  }, { size: 110 }),

  col('plannedVolume', 'Vol Planejado', (r) => r.plannedVolume, (v, row) => {
    const updateMovement = useOmmStore.getState().updateMovement;
    return (
      <input
        type="number"
        value={v}
        onChange={(e) => updateMovement(row.id, { plannedVolume: Number(e.target.value) })}
        className="text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 outline-none font-mono text-right text-slate-700 dark:text-slate-200 w-full"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }, { size: 110 }),

  col('currentVolume', 'Vol Atual', (r) => r.currentVolume, (v) => (
    <VolumeDisplay value={v} unit="m³" />
  ), { size: 100 }),

  col('plannedMass', 'Massa Plan.', (r) => r.plannedMass, (v) => (
    <VolumeDisplay value={v} unit="t" />
  ), { size: 100 }),

  col('currentMass', 'Massa Atual', (r) => r.currentMass, (v) => (
    <VolumeDisplay value={v} unit="t" />
  ), { size: 100 }),

  col('percentComplete', '% Concluído', (r) => r.percentComplete, (v) => (
    <ProgressBar value={v} />
  ), { size: 130 }),

  col('currentFlow', 'Vazão Inst.', (r) => r.currentFlow, (v) => (
    <FlowDisplay value={v} />
  ), { size: 90 }),

  col('avgFlow', 'Vazão Média', (r) => r.avgFlow, (v) => (
    <FlowDisplay value={v} />
  ), { size: 90 }),

  col('plannedFlow', 'Vazão Plan.', (r) => r.plannedFlow, (v, row) => {
    const updateMovement = useOmmStore.getState().updateMovement;
    return (
      <input
        type="number"
        value={v}
        onChange={(e) => updateMovement(row.id, { plannedFlow: Number(e.target.value), simFlowRate: Number(e.target.value) })}
        className="text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 outline-none font-mono text-right text-slate-700 dark:text-slate-200 w-full"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }, { size: 90 }),

  col('temperature', 'Temp (°C)', (r) => r.temperature, (v) => (
    <span className="font-mono text-[11px] text-orange-600 dark:text-orange-400">{v.toFixed(1)}°</span>
  ), { size: 80 }),

  col('pressure', 'Pressão', (r) => r.pressure, (v) => (
    <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400">{v.toFixed(2)} kgf</span>
  ), { size: 90 }),

  col('density', 'Dens. (kg/m³)', (r) => r.density, (v) => (
    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">{v.toFixed(1)}</span>
  ), { size: 100 }),

  col('density20', 'Dens. 20°C', (r) => r.density20, (v) => (
    <span className="font-mono text-[11px] text-slate-500">{v.toFixed(1)}</span>
  ), { size: 90 }),

  col('vcf', 'VCF', (r) => r.vcf, (v) => (
    <span className="font-mono text-[11px] text-slate-500">{v.toFixed(4)}</span>
  ), { size: 80 }),

  col('correctedVolume', 'Vol Corrigido', (r) => r.correctedVolume, (v) => (
    <VolumeDisplay value={v} unit="m³" />
  ), { size: 110 }),

  col('accuracy', 'Accuracy', (r) => r.accuracy, (v) => (
    <AccuracyBar value={v} />
  ), { size: 130 }),

  col('ettcMin', 'ETTC (min)', (r) => r.ettcMin, (v, row) => (
    <span className={`font-mono text-[11px] ${row.status === 'Active' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
      {row.status === 'Active' && v > 0 ? `${Math.round(v)} min` : '—'}
    </span>
  ), { size: 90 }),

  col('etoc', 'ETOC', (r) => r.etoc, (v) => (
    <TimeDisplay iso={v} />
  ), { size: 110 }),

  col('currentLevel', 'Nível Orig. (%)', (r) => r.currentLevel, (v) => (
    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">{v.toFixed(1)}%</span>
  ), { size: 100 }),

  col('destLevel', 'Nível Dest. (%)', (r) => r.destLevel, (v) => (
    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">{v.toFixed(1)}%</span>
  ), { size: 100 }),

  col('issuedAt', 'Emissão', (r) => r.issuedAt, (v) => (
    <TimeDisplay iso={v} />
  ), { size: 110 }),

  col('activatedAt', 'Ativação', (r) => r.activatedAt, (v) => (
    <TimeDisplay iso={v} />
  ), { size: 110 }),

  col('completedAt', 'Conclusão', (r) => r.completedAt, (v) => (
    <TimeDisplay iso={v} />
  ), { size: 110 }),

  col('closedAt', 'Fechamento', (r) => r.closedAt, (v) => (
    <TimeDisplay iso={v} />
  ), { size: 110 }),

  col('lastUpdatedAt', 'Atualizado', (r) => r.lastUpdatedAt, (v) => (
    <TimeDisplay iso={v} />
  ), { size: 110 }),
];

// Default visible columns (subset for initial view)
export const DEFAULT_VISIBLE_COLUMNS = new Set([
  'select', 'number', 'orderNumber', 'status', 'priority', 'type',
  'productName', 'areaName', 'originTag', 'destinationTag',
  'plannedVolume', 'currentVolume', 'percentComplete', 'currentFlow',
  'accuracy', 'ettcMin', 'operatorName', 'issuedAt', 'activatedAt',
]);
