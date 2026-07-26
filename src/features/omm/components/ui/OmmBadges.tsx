import React from 'react';
import type { OmmStatus, OmmPriority } from '../../types/index';

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
const STATUS_CONFIG: Record<OmmStatus, { label: string; bg: string; text: string; dot: string }> = {
  Issued:    { label: 'Emitido',    bg: 'bg-slate-100 dark:bg-slate-800',   text: 'text-slate-600 dark:text-slate-300',  dot: 'bg-slate-400' },
  Active:    { label: 'Ativo',      bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500 animate-pulse' },
  Completed: { label: 'Concluído',  bg: 'bg-blue-50 dark:bg-blue-950/40',   text: 'text-blue-700 dark:text-blue-300',    dot: 'bg-blue-500' },
  Closed:    { label: 'Fechado',    bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-700 dark:text-violet-300', dot: 'bg-violet-500' },
  Canceled:  { label: 'Cancelado',  bg: 'bg-rose-50 dark:bg-rose-950/40',   text: 'text-rose-700 dark:text-rose-300',    dot: 'bg-rose-500' },
};

export const StatusBadge: React.FC<{ status: OmmStatus; size?: 'sm' | 'xs' }> = ({ status, size = 'sm' }) => {
  const cfg = STATUS_CONFIG[status];
  const px = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${px} ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Priority badge
// ---------------------------------------------------------------------------
const PRIORITY_CONFIG: Record<OmmPriority, { label: string; color: string }> = {
  Low:      { label: 'Baixa',    color: 'text-slate-400' },
  Normal:   { label: 'Normal',   color: 'text-sky-500' },
  High:     { label: 'Alta',     color: 'text-amber-500' },
  Critical: { label: 'Crítica',  color: 'text-rose-500' },
};

export const PriorityBadge: React.FC<{ priority: OmmPriority }> = ({ priority }) => {
  const cfg = PRIORITY_CONFIG[priority];
  return <span className={`text-[11px] font-bold ${cfg.color}`}>{cfg.label}</span>;
};

// ---------------------------------------------------------------------------
// Accuracy indicator
// ---------------------------------------------------------------------------
export const AccuracyBar: React.FC<{ value: number }> = ({ value }) => {
  const color = value >= 99 ? 'bg-emerald-500' : value >= 97 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300">
        {value.toFixed(1)}%
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------
export const ProgressBar: React.FC<{ value: number; showLabel?: boolean }> = ({ value, showLabel = true }) => {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 90 ? 'bg-emerald-500' : pct >= 50 ? 'bg-sky-500' : 'bg-amber-500';
  return (
    <div className="flex items-center gap-1.5 min-w-[80px]">
      <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && (
        <span className="text-[11px] font-mono shrink-0 text-slate-600 dark:text-slate-300 w-8">
          {pct.toFixed(0)}%
        </span>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Product dot
// ---------------------------------------------------------------------------
export const ProductDot: React.FC<{ color: string; name: string }> = ({ color, name }) => (
  <span className="flex items-center gap-1.5">
    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
    <span className="truncate">{name}</span>
  </span>
);

// ---------------------------------------------------------------------------
// Flow value display
// ---------------------------------------------------------------------------
export const FlowDisplay: React.FC<{ value: number; unit?: string }> = ({ value, unit = 'm³/h' }) => (
  <span className={`font-mono text-[11px] font-semibold ${value > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
    {value > 0 ? value.toFixed(1) : '—'} {value > 0 ? unit : ''}
  </span>
);

// ---------------------------------------------------------------------------
// Timestamp display
// ---------------------------------------------------------------------------
export const TimeDisplay: React.FC<{ iso: string | null; fallback?: string }> = ({ iso, fallback = '—' }) => {
  if (!iso) return <span className="text-slate-400 text-[11px]">{fallback}</span>;
  const d = new Date(iso);
  const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return (
    <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300" title={d.toLocaleString('pt-BR')}>
      {date} {time}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Volume/Mass value
// ---------------------------------------------------------------------------
export const VolumeDisplay: React.FC<{ value: number; unit?: string; dim?: boolean }> = ({ value, unit = 'm³', dim = false }) => (
  <span className={`font-mono text-[11px] ${dim ? 'text-slate-400' : 'text-slate-700 dark:text-slate-200'} font-semibold`}>
    {value >= 1000 ? (value / 1000).toFixed(2) + 'k' : value.toFixed(1)} {unit}
  </span>
);
