import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { MovementRow } from '../../types';
import {
  StatusBadge,
  PriorityBadge,
  AccuracyBar,
  ProgressBar,
  ProductDot,
  FlowDisplay,
  TimeDisplay,
  VolumeDisplay,
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
    <StatusBadge status={row.status} size="xs" />
  ), { size: 100 }),

  col('priority', 'Prioridade', (r) => r.priority, (_v, row) => (
    <PriorityBadge priority={row.priority} />
  ), { size: 80 }),

  col('type', 'Tipo', (r) => r.type, (v) => (
    <span className="text-[11px] text-slate-600 dark:text-slate-400">{v}</span>
  ), { size: 100 }),

  col('category', 'Categoria', (r) => r.category, (v) => (
    <span className="text-[11px] text-slate-500 dark:text-slate-400">{v}</span>
  ), { size: 90 }),

  col('productName', 'Produto', (r) => r.productName, (v, row) => (
    <ProductDot color={row.productColor} name={v} />
  ), { size: 160 }),

  col('areaName', 'Área', (r) => r.areaName, (v) => (
    <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate">{v}</span>
  ), { size: 150 }),

  col('operatorName', 'Operador', (r) => r.operatorName, (v) => (
    <span className="text-[11px] text-slate-600 dark:text-slate-400">{v}</span>
  ), { size: 130 }),

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

  col('measurementMethod', 'Método Med.', (r) => r.measurementMethod, (v) => (
    <span className="text-[11px] text-slate-500">{v}</span>
  ), { size: 110 }),

  col('plannedVolume', 'Vol Planejado', (r) => r.plannedVolume, (v) => (
    <VolumeDisplay value={v} unit="m³" />
  ), { size: 110 }),

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

  col('plannedFlow', 'Vazão Plan.', (r) => r.plannedFlow, (v) => (
    <FlowDisplay value={v} />
  ), { size: 90 }),

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
