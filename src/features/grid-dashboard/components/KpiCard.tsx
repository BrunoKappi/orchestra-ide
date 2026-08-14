import React from 'react';
import { BarChart3, TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';
import type { TankCardData } from '../types';
import { useObjectModelStore } from '../../../store/useObjectModelStore';
import { cn } from '../../../utils/cn';

interface KpiCardProps {
  card: TankCardData;
  isSelected?: boolean;
  isViewMode?: boolean;
  onClick?: () => void;
}

type TrendDir = 'up' | 'down' | 'stable';

/** Computes trend direction from a history array (last N values) */
function computeTrend(history: number[]): TrendDir {
  if (history.length < 3) return 'stable';
  const last = history[history.length - 1];
  const prev = history[history.length - 3];
  const delta = last - prev;
  const threshold = Math.abs(prev) * 0.005; // 0.5% change threshold
  if (delta > threshold) return 'up';
  if (delta < -threshold) return 'down';
  return 'stable';
}

/** Format a numeric value with given decimal places */
function fmtVal(val: number, dec: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 10_000) return `${(val / 1_000).toFixed(1)}k`;
  return val.toFixed(dec);
}

export const KpiCard: React.FC<KpiCardProps> = ({
  card,
  isSelected = false,
  isViewMode = false,
  onClick,
}) => {
  const cfg = card.kpiConfig;
  const simulatedValues = useObjectModelStore((s) => s.simulatedValues);
  const historyValues = useObjectModelStore((s) => s.historyValues);
  const simulationTickCount = useObjectModelStore((s) => s.simulationTickCount);
  void simulationTickCount;

  if (!cfg) {
    return (
      <div
        className={cn(
          'flex-1 rounded-2xl border flex flex-col items-center justify-center p-4 text-center transition-all',
          isSelected
            ? 'border-sky-500 ring-2 ring-sky-500/20 bg-slate-50 dark:bg-[#1a1b1f]'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16171b]'
        )}
        onClick={onClick}
      >
        <BarChart3 className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
        <p className="text-xs text-slate-400 dark:text-slate-500">Indicador / KPI não configurado</p>
        {!isViewMode && <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">Clique para configurar</p>}
      </div>
    );
  }

  const valueKey = `${cfg.objectId}:${cfg.propertyName}`;
  const rawValue = simulatedValues[valueKey] ?? '0';
  const currentValue = parseFloat(rawValue) || 0;
  const history = historyValues[valueKey] || [];
  const decPlaces = cfg.decimalPlaces ?? 1;

  const trend = computeTrend(history);

  // Goal logic
  const hasGoal = cfg.goalValue !== null && cfg.goalValue !== undefined && cfg.goalValue !== 0;
  let pct = 0;
  let delta = 0;
  let goalColor = '#3b82f6';
  let goalLabel = '';

  if (hasGoal && cfg.goalValue !== null) {
    const goal = cfg.goalValue;
    delta = currentValue - goal;

    if (cfg.goalType === 'max') {
      // Higher is better: fill bar proportionally
      pct = Math.max(0, (currentValue / goal) * 100);
      goalColor = pct >= 100 ? '#10b981' : pct >= 75 ? '#3b82f6' : pct >= 50 ? '#f59e0b' : '#ef4444';
      goalLabel = pct >= 100 ? 'Acima da meta' : `${Math.min(100, pct).toFixed(0)}% da meta`;
    } else if (cfg.goalType === 'min') {
      // Lower is better: fill bar from goal down
      pct = goal > 0 ? Math.max(0, (1 - currentValue / goal) * 100) : 0;
      goalColor = currentValue <= goal ? '#10b981' : currentValue <= goal * 1.1 ? '#f59e0b' : '#ef4444';
      goalLabel = currentValue <= goal ? 'Dentro do limite' : `${Math.abs(delta).toFixed(decPlaces)} acima do limite`;
    } else {
      // Reference: just show delta
      pct = 50 + (delta / Math.abs(cfg.goalValue)) * 50;
      pct = Math.max(0, Math.min(100, pct));
      goalColor = Math.abs(delta) <= Math.abs(cfg.goalValue) * 0.05 ? '#10b981' : '#f59e0b';
      goalLabel = delta >= 0 ? `+${Math.abs(delta).toFixed(decPlaces)} acima` : `${Math.abs(delta).toFixed(decPlaces)} abaixo`;
    }
  }

  const barWidth = Math.min(100, Math.max(0, hasGoal ? (cfg.goalType === 'max' ? Math.min(100, pct) : Math.min(100, pct)) : 0));
  const isOverGoal = hasGoal && cfg.goalType === 'max' && pct > 100;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#64748b';

  return (
    <div
      className={cn(
        'flex-1 rounded-2xl border flex flex-col overflow-hidden transition-all duration-200 relative',
        isSelected && !isViewMode
          ? 'border-sky-500 ring-2 ring-sky-500/20'
          : 'border-slate-200 dark:border-slate-800',
        'bg-white dark:bg-[#16171b]'
      )}
      onClick={!isViewMode ? onClick : undefined}
    >
      {/* Accent bar — color driven by goal achievement */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-colors duration-500"
        style={{ backgroundColor: hasGoal ? goalColor : '#3b82f6' }}
      />

      {/* Header */}
      <div className="pl-4 pr-3 pt-3 pb-2">
        <div className="flex items-center gap-1.5 mb-0.5">
          <BarChart3 className="w-3 h-3 text-blue-500 shrink-0" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 font-mono">
            Indicador
          </span>
        </div>
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">
              {cfg.propertyLabel}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
              {cfg.objectName}
            </p>
          </div>
          {/* Trend indicator */}
          <TrendIcon
            className="w-4 h-4 shrink-0 ml-2 mt-0.5 transition-colors duration-300"
            style={{ color: trendColor }}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-slate-100 dark:border-slate-800/60" />

      {/* Main value */}
      <div className="px-4 py-3 flex-1 flex flex-col gap-2.5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-50 leading-none tabular-nums">
            {fmtVal(currentValue, decPlaces)}
          </span>
          {cfg.unit && (
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 leading-none">
              {cfg.unit}
            </span>
          )}
          {/* Live dot */}
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1 shrink-0" />
        </div>

        {/* Goal section */}
        {hasGoal && cfg.goalValue !== null && (
          <>
            {/* Progress bar */}
            <div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: goalColor,
                  }}
                />
              </div>
            </div>

            {/* Goal stats row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                <Target className="w-2.5 h-2.5 shrink-0" />
                <span className="font-mono">
                  {fmtVal(cfg.goalValue, decPlaces)} {cfg.unit}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Delta */}
                <span className={cn(
                  'text-[10px] font-mono font-bold',
                  delta > 0 ? 'text-emerald-600 dark:text-emerald-400' : delta < 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-400'
                )}>
                  {delta >= 0 ? '+' : ''}{fmtVal(delta, decPlaces)}
                </span>

                {/* Percentage badge */}
                {!isOverGoal ? (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${goalColor}18`,
                      color: goalColor,
                      border: `1px solid ${goalColor}30`,
                    }}
                  >
                    {Math.min(100, pct).toFixed(0)}%
                  </span>
                ) : (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    ✓ Meta
                  </span>
                )}
              </div>
            </div>

            {/* Goal label */}
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">
              {goalLabel}
            </p>
          </>
        )}

        {/* No goal: mini sparkline hint */}
        {!hasGoal && history.length > 2 && (
          <div className="flex items-end gap-px h-5 mt-1">
            {history.slice(-12).map((v, i) => {
              const histMin = Math.min(...history);
              const histMax = Math.max(...history);
              const range = histMax - histMin || 1;
              const heightPct = ((v - histMin) / range) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-sm transition-all duration-300"
                  style={{
                    height: `${Math.max(15, heightPct)}%`,
                    backgroundColor: i === history.slice(-12).length - 1 ? '#3b82f6' : '#3b82f620',
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
