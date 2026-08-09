import React, { useState, useMemo } from 'react';
import { useOmmStore } from '../../store/useOmmStore';
import type { OmmStatus } from '../../types';
import { StatusBadge } from '../ui/OmmBadges';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const STATUS_COLORS: Record<OmmStatus, string> = {
  Issued:    'bg-slate-300 dark:bg-slate-600',
  Active:    'bg-emerald-500',
  Completed: 'bg-blue-500',
  Closed:    'bg-violet-500',
  Canceled:  'bg-rose-400',
};

const HOURS_IN_DAY = 24;
const CHART_WIDTH = 1000; // px
const ROW_HEIGHT = 36;    // px

export const MovementTimeline: React.FC = () => {
  const getMovementRows = useOmmStore((s) => s.getMovementRows);
  const movements = useOmmStore((s) => s.movements);
  const simulatorTick = useOmmStore((s) => s.simulatorState.tickCount);
  const rows = useMemo(() => getMovementRows(), [getMovementRows, movements, simulatorTick]);
  const simulatedTime = useOmmStore((s) => s.simulatorState.simulatedTime);

  const setActiveView = useOmmStore((s) => s.setActiveView);
  const openMovementModal = useOmmStore((s) => s.openMovementModal);

  // Day offset state (-N for past, 0 for today, +N for future)
  const [dayOffset, setDayOffset] = useState<number>(0);

  // Reference: start of simulated day adjusted by dayOffset
  const simNow = useMemo(() => new Date(simulatedTime), [simulatedTime]);
  const dayStart = useMemo(() => {
    const d = new Date(simNow);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [simNow, dayOffset]);
  
  const dayEnd = useMemo(() => {
    const d = new Date(dayStart);
    d.setDate(d.getDate() + 1);
    return d;
  }, [dayStart]);

  const dayDurationMs = dayEnd.getTime() - dayStart.getTime();
  const isToday = dayOffset === 0;
  const nowPct = isToday ? ((simNow.getTime() - dayStart.getTime()) / dayDurationMs) * 100 : -1;

  const safeTime = (ts: string | null | undefined, fallbackMs: number): number => {
    if (!ts) return fallbackMs;
    const t = new Date(ts).getTime();
    return isNaN(t) ? fallbackMs : t;
  };

  const toX = (ts: string | null | undefined, fallback: Date): number => {
    const timeMs = safeTime(ts, fallback.getTime());
    const pct = (timeMs - dayStart.getTime()) / dayDurationMs;
    return Math.max(0, Math.min(1, pct)) * CHART_WIDTH;
  };

  // Filter movements relevant to the displayed day
  const todayRows = useMemo(() =>
    rows.filter((r) => {
      const issued = safeTime(r.issuedAt || r.activatedAt || (r as any).createdAt, dayStart.getTime() + 3600000);
      const end = r.completedAt ? safeTime(r.completedAt, dayEnd.getTime())
        : r.closedAt ? safeTime(r.closedAt, dayEnd.getTime())
        : r.etoc ? safeTime(r.etoc, dayEnd.getTime())
        : dayEnd.getTime();
      return issued <= dayEnd.getTime() && end >= dayStart.getTime();
    }).slice(0, 60),
  [rows, dayStart, dayEnd]);

  const handleRowClick = (movementId: string) => {
    setActiveView('movements');
    openMovementModal(movementId);
  };

  const hours = Array.from({ length: HOURS_IN_DAY + 1 }, (_, i) => i);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header with past/future navigation */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Timeline de Movimentos</span>
          <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 px-2 py-0.5 rounded-md flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {dayStart.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
          </span>
        </div>

        {/* Date Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setDayOffset((prev) => prev - 1)}
              className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer flex items-center gap-0.5"
              title="Dia Anterior (Passado)"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[10px] font-bold pr-1">Anterior</span>
            </button>
            <button
              onClick={() => setDayOffset(0)}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                isToday ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setDayOffset((prev) => prev + 1)}
              className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer flex items-center gap-0.5"
              title="Próximo Dia (Futuro)"
            >
              <span className="text-[10px] font-bold pl-1">Próximo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-[10px] text-slate-400 font-mono">
            {todayRows.length} movimentos
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[1100px]">
          {/* Time axis */}
          <div className="flex sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-700">
            <div className="w-48 shrink-0 border-r border-slate-200 dark:border-slate-700 px-3 py-1.5">
              <span className="text-[10px] font-bold uppercase text-slate-400">Movimento</span>
            </div>
            <div className="relative flex-1 overflow-hidden" style={{ width: CHART_WIDTH }}>
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute top-0 bottom-0 border-l border-slate-200 dark:border-slate-700 flex items-end pb-1"
                  style={{ left: `${(h / HOURS_IN_DAY) * 100}%` }}
                >
                  <span className="text-[9px] font-mono text-slate-400 pl-1">
                    {String(h).padStart(2, '0')}:00
                  </span>
                </div>
              ))}
              {/* Now line */}
              {isToday && nowPct >= 0 && (
                <div
                  className="absolute top-0 bottom-0 border-l-2 border-red-500 z-20"
                  style={{ left: `${nowPct}%` }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 -translate-x-[3px]" />
                </div>
              )}
            </div>
          </div>

          {/* Rows */}
          {todayRows.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
              Nenhum movimento neste dia.
            </div>
          ) : todayRows.map((row, i) => {
            const startX = toX(row.activatedAt ?? row.issuedAt ?? null, dayStart);
            const endX = toX(
              row.completedAt ?? row.closedAt ?? row.etoc ?? null,
              new Date(dayStart.getTime() + 3_600_000 * 4),
            );
            const barWidth = Math.max(4, endX - startX);

            return (
              <div
                key={row.id}
                onClick={() => handleRowClick(row.id)}
                className={`flex border-b border-slate-100 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${i % 2 === 0 ? '' : 'bg-slate-50/30 dark:bg-slate-900/30'}`}
                style={{ height: ROW_HEIGHT }}
                title="Clique para abrir detalhes do movimento na aba Movimentos"
              >
                {/* Label */}
                <div className="w-48 shrink-0 border-r border-slate-200 dark:border-slate-700 flex items-center gap-2 px-3">
                  <span className="font-mono text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline">{row.number}</span>
                  <StatusBadge status={row.status} size="xs" />
                </div>
                {/* Bar */}
                <div className="relative flex-1" style={{ width: CHART_WIDTH }}>
                  {/* Hour grid lines */}
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="absolute top-0 bottom-0 border-l border-slate-100 dark:border-slate-800/50"
                      style={{ left: `${(h / HOURS_IN_DAY) * 100}%` }}
                    />
                  ))}
                  {/* Movement bar */}
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 h-6 rounded-md transition-all duration-300 cursor-pointer hover:brightness-110 flex items-center overflow-hidden shadow-2xs
                      ${STATUS_COLORS[row.status]}`}
                    style={{ left: startX, width: barWidth }}
                  >
                    {/* Progress overlay */}
                    {row.status === 'Active' && (
                      <div
                        className="absolute inset-y-0 left-0 bg-white/20 transition-all duration-1000"
                        style={{ width: `${row.percentComplete}%` }}
                      />
                    )}
                    {barWidth > 70 && (
                      <span className="relative px-2 text-[9px] font-bold text-white truncate">
                        {row.number} · {row.productName.split(' ')[0]}
                      </span>
                    )}
                  </div>
                  {/* Now marker */}
                  {isToday && nowPct >= 0 && (
                    <div
                      className="absolute top-0 bottom-0 border-l-2 border-red-400/50 pointer-events-none z-10"
                      style={{ left: `${nowPct}%` }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
