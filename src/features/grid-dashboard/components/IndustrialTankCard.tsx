import React from 'react';
import type { TankCardData } from '../types';
import { TankGeometrySvg } from '../../../components/TankGeometrySvg';
import { useObjectModelStore } from '../../../store/useObjectModelStore';
import { propertyRepo } from '../../../repository/PropertyRepository';
import { inheritanceService } from '../../../services/InheritanceService';
import { cn } from '../../../utils/cn';

interface IndustrialTankCardProps {
  card: TankCardData;
  isSelected?: boolean;
  isViewMode?: boolean;
  onClick?: () => void;
}

/** Returns accent color based on level thresholds */
function getLevelColor(levelPercent: number): string {
  if (levelPercent >= 80) return '#ef4444'; // High
  if (levelPercent <= 15) return '#f59e0b'; // Low
  return '#10b981'; // Normal
}

/** Resolves a property value for a given objectId by name from the merged chain */
function resolveObjectPropValue(
  objectId: string | undefined,
  propertyName: string,
  fallback: string
): string {
  if (!objectId) return fallback;
  // Fast path: read directly from instance props first
  const allProps = propertyRepo.getAll().filter((p) => p.targetId === objectId);
  const found = allProps.find((p) => p.name === propertyName);
  if (found) return found.defaultValue;
  // Slow path: full merged chain (includes inherited template values)
  const merged = inheritanceService.getMergedProperties(objectId, 'instance');
  const mergedFound = merged.find((p) => p.name === propertyName);
  return mergedFound?.defaultValue ?? fallback;
}

export const IndustrialTankCard: React.FC<IndustrialTankCardProps> = ({
  card,
  isSelected = false,
  isViewMode = false,
  onClick,
}) => {
  // Subscribe to simulatedValues so the card re-renders when the simulator ticks
  // This is read-only — we only need the tick counter to trigger a re-render
  const simulationTickCount = useObjectModelStore((s) => s.simulationTickCount);
  // Suppress lint warning for unused variable (we just need the re-render)
  void simulationTickCount;

  const objectId = card.objectId;

  // Resolve live values from the real object properties
  const liveTag = resolveObjectPropValue(objectId, 'Tag', card.tag);
  const liveProduct = resolveObjectPropValue(objectId, 'Product', '—');
  const liveLevelStr = resolveObjectPropValue(objectId, 'Level', '0');
  const liveLevel = parseFloat(liveLevelStr) || 0;
  const liveInventoryStatus = resolveObjectPropValue(objectId, 'Status', 'Normal');

  const isValve = card.geometryType === 'valve';
  const isPump = card.geometryType === 'pump';
  const isValveOrPump = isValve || isPump;

  const liveIsOpen = resolveObjectPropValue(objectId, 'IsOpen', 'true');
  const liveIsRunning = resolveObjectPropValue(objectId, 'IsRunning', 'false');

  // Determine status for color
  const accentColor = card.statusColor || (
    isValve
      ? (liveIsOpen === 'true' ? '#10b981' : '#ef4444')
      : isPump
        ? (liveIsRunning === 'true' ? '#10b981' : '#64748b')
        : getLevelColor(liveLevel)
  );

  // Resolve all field binding values
  const resolvedBindings = card.fieldBindings
    .filter((b) => b.visible && b.propertyName)
    .map((b) => {
      const rawVal = resolveObjectPropValue(objectId, b.propertyName, '—');
      const numVal = parseFloat(rawVal);
      const displayVal = !isNaN(numVal) ? numVal.toFixed(b.decimalPlaces) : rawVal;
      return { ...b, displayVal };
    });

  // Derive border/ring color
  const hasHighAlarm = liveLevel >= 80;
  const hasLowAlarm = liveLevel <= 15;
  const statusLabel = hasHighAlarm ? 'ALTO' : hasLowAlarm ? 'BAIXO' : 'NORMAL';

  return (
    <div
      onClick={onClick}
      style={{ borderColor: card.borderColor || accentColor + '40' }}
      className={cn(
        'relative w-full h-full rounded-xl flex flex-col overflow-hidden transition-all duration-200 select-none group',
        'bg-white dark:bg-[#16171b] border shadow-sm dark:shadow-md',
        isSelected
          ? 'border-sky-500 dark:border-sky-400 ring-2 ring-sky-500/20 z-10'
          : 'hover:border-slate-300 dark:hover:border-slate-700',
        !isViewMode && 'cursor-pointer'
      )}
    >
      {/* Status accent bar on left */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
        style={{ backgroundColor: accentColor }}
      />

      {/* Main content */}
      <div className="p-3 pl-5 flex flex-col flex-1 overflow-hidden">

        {/* Header: TAG + product */}
        <div className="mb-1">
          <div className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase truncate">
            {liveTag} • {liveProduct}
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
            {card.title || liveTag}
          </h4>
        </div>

        {/* SVG + Stats */}
        <div className="flex items-center gap-3 flex-1 min-h-0 overflow-hidden my-1">
          {/* Geometry SVG */}
          <div className="shrink-0 flex items-center justify-center">
            <TankGeometrySvg
              geometry={card.geometryType}
              levelPercent={isValve ? (liveIsOpen === 'true' ? 100 : 0) : isPump ? (liveIsRunning === 'true' ? 100 : 0) : liveLevel}
              fillColor={accentColor}
              width={56}
              height={72}
            />
          </div>

          {/* Right: Level + field bindings */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 overflow-hidden">
            {/* Primary: Level or Operational State */}
            {isValveOrPump ? (
              <div className="shrink-0">
                <div className="text-[10px] font-medium text-slate-400 leading-none">Estado Operacional</div>
                <div className={cn(
                  "text-[11px] font-black tracking-tight leading-tight mt-1 inline-flex items-center px-2 py-0.5 rounded-md border shadow-xs whitespace-nowrap",
                  isValve
                    ? liveIsOpen === 'true'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                    : liveIsRunning === 'true'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                )}>
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full mr-1.5 shrink-0",
                    isValve
                      ? liveIsOpen === 'true' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                      : liveIsRunning === 'true' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  )} />
                  <span>
                    {isValve
                      ? liveIsOpen === 'true' ? 'ABERTA' : 'FECHADA'
                      : liveIsRunning === 'true' ? 'EM OPERAÇÃO' : 'DESLIGADA'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="shrink-0">
                <div className="text-[10px] font-medium text-slate-400 leading-none">Nível Medido</div>
                <div className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                  {liveLevel.toFixed(1)}
                  <span className="text-sm font-semibold ml-0.5">%</span>
                </div>
              </div>
            )}

            {/* Dynamic field bindings — unlimited, scroll if needed */}
            <div className="overflow-y-auto max-h-[100px] pr-0.5">
              <div
                className={cn(
                  'text-[11px] gap-0.5',
                  resolvedBindings.length > 4 ? 'grid grid-cols-2' : 'flex flex-col'
                )}
              >
                {resolvedBindings.map((b) => (
                  <div key={b.propertyName} className="flex justify-between items-center text-slate-600 dark:text-slate-400 min-w-0">
                    <span className="truncate shrink-0 mr-1">{b.label}:</span>
                    <span className="font-semibold font-mono text-slate-800 dark:text-slate-200 truncate">
                      {b.displayVal}
                      {b.unit && <span className="text-[9px] text-slate-400 ml-0.5">{b.unit}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Level bar */}
        <div className="mt-1 mb-1.5">
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, liveLevel)}%`, backgroundColor: accentColor }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-1.5 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-[10px]">
          <span className="font-medium text-slate-400 dark:text-slate-500 truncate">
            {liveInventoryStatus}
          </span>
          <span
            className="px-2 py-0.5 rounded font-black tracking-wider text-[10px] uppercase font-mono shadow-sm"
            style={{
              color: accentColor,
              backgroundColor: accentColor + '18',
              border: `1px solid ${accentColor}40`,
            }}
          >
            {statusLabel}
          </span>
        </div>
      </div>
    </div>
  );
};
