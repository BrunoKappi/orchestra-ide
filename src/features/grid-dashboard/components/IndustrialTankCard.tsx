import React from 'react';
import type { TankCardData } from '../types';
import { cn } from '../../../utils/cn';

interface IndustrialTankCardProps {
  card: TankCardData;
  isSelected?: boolean;
  isViewMode?: boolean;
  onClick?: () => void;
}

export const IndustrialTankCard: React.FC<IndustrialTankCardProps> = ({
  card,
  isSelected = false,
  isViewMode = false,
  onClick,
}) => {
  const {
    tag,
    category,
    title,
    levelPercent,
    pressure,
    pressureUnit,
    temperature,
    strappingFactor,
    calculatedVolume,
    volumeUnit,
    status,
    footerLabel,
    statusColor,
    borderColor,
    visibleFields,
  } = card;

  // Determine status color styling
  const getStatusColorDetails = () => {
    if (statusColor) {
      return {
        accent: statusColor,
        text: statusColor,
        bgPill: 'bg-slate-800/80',
        fillGradient: `from-${statusColor} to-${statusColor}`,
      };
    }

    switch (status) {
      case 'CRITICAL':
        return {
          accent: '#ef4444',
          text: 'text-red-500 dark:text-red-400',
          bgPill: 'bg-red-500/10 text-red-500 border border-red-500/30',
          fillGradient: 'from-red-600/90 to-red-500/70',
          borderColorClass: 'border-red-500/40',
        };
      case 'ATENÇÃO':
        return {
          accent: '#f59e0b',
          text: 'text-amber-500 dark:text-amber-400',
          bgPill: 'bg-amber-500/10 text-amber-500 border border-amber-500/30',
          fillGradient: 'from-amber-600/90 to-amber-500/70',
          borderColorClass: 'border-amber-500/40',
        };
      case 'NORMAL':
      default:
        return {
          accent: '#10b981',
          text: 'text-emerald-500 dark:text-emerald-400',
          bgPill: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30',
          fillGradient: 'from-emerald-600/90 to-emerald-500/70',
          borderColorClass: 'border-emerald-500/40',
        };
    }
  };

  const statusDetails = getStatusColorDetails();

  return (
    <div
      onClick={onClick}
      style={{
        borderColor: borderColor || undefined,
      }}
      className={cn(
        "relative w-full h-full rounded-xl flex flex-col justify-between overflow-hidden transition-all duration-200 select-none group",
        "bg-white dark:bg-[#16171b] border shadow-sm dark:shadow-md",
        isSelected
          ? "border-sky-500 dark:border-sky-400 ring-2 ring-sky-500/20 z-10"
          : borderColor
          ? ""
          : "border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700",
        !isViewMode && "cursor-pointer"
      )}
    >
      {/* Status Bar Indicator on left border */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl transition-colors"
        style={{ backgroundColor: statusDetails.accent }}
      />

      {/* Main Content Padding */}
      <div className="p-3.5 pl-5 flex-1 flex flex-col justify-between overflow-hidden">
        {/* Header Tag & Title */}
        <div>
          <div className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase truncate">
            {tag} • {category}
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">
            {title}
          </h4>
        </div>

        {/* Tank Drawing + Stats Grid */}
        <div className="my-2 flex items-center justify-between gap-3 overflow-hidden">
          {/* Tank Cylinder Graphic */}
          <div className="relative flex-shrink-0 w-16 h-28 flex flex-col items-center justify-end">
            {/* Outer Cylinder Vessel */}
            <div className="relative w-14 h-24 rounded-t-lg rounded-b-[18px] border-2 border-slate-400/50 dark:border-slate-600/70 overflow-hidden bg-slate-100/50 dark:bg-slate-900/60 flex flex-col justify-end">
              {/* Level Liquid Fill */}
              <div
                className="w-full transition-all duration-700 ease-out relative"
                style={{
                  height: `${Math.min(100, Math.max(0, levelPercent))}%`,
                  backgroundColor: statusDetails.accent,
                  opacity: 0.85,
                }}
              >
                {/* Surface Ripple Line */}
                <div className="w-full h-1 bg-white/40 absolute top-0 left-0 animate-pulse" />
              </div>

              {/* Cylinder Bottom Dashed Oval Visual */}
              <div className="absolute bottom-0 inset-x-0 h-3 border-b-2 border-dashed border-slate-400/40 dark:border-slate-500/50 rounded-b-full pointer-events-none" />
              {/* Cylinder Top Ellipse Visual */}
              <div className="absolute top-0 inset-x-0 h-3 border-t-2 border-slate-400/40 dark:border-slate-500/50 rounded-t-full pointer-events-none" />
            </div>

            {/* Tick Marks on Right Side of Tank */}
            <div className="absolute right-0 top-3 bottom-3 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="w-1.5 h-[1px] bg-slate-400 dark:bg-slate-500" />
              <div className="w-2.5 h-[1px] bg-slate-400 dark:bg-slate-500" />
              <div className="w-1.5 h-[1px] bg-slate-400 dark:bg-slate-500" />
              <div className="w-2.5 h-[1px] bg-slate-400 dark:bg-slate-500" />
              <div className="w-1.5 h-[1px] bg-slate-400 dark:bg-slate-500" />
            </div>
          </div>

          {/* Right Parameters List */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
            {/* Level Main Display */}
            {visibleFields.showLevel && (
              <div className="mb-0.5">
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-400 leading-none">
                  Nível Medido
                </div>
                <div className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                  {levelPercent.toFixed(1)}<span className="text-sm font-semibold ml-0.5">%</span>
                </div>
              </div>
            )}

            {/* Parameter Rows */}
            <div className="space-y-0.5 text-[11px]">
              {visibleFields.showPressure && (
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span className="truncate">Pressão:</span>
                  <span className="font-semibold font-mono text-slate-800 dark:text-slate-200 ml-1">
                    {pressure.toFixed(2)} <span className="text-[9px] text-slate-400">{pressureUnit}</span>
                  </span>
                </div>
              )}

              {visibleFields.showTemperature && (
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span className="truncate">Temperatura:</span>
                  <span className="font-semibold font-mono text-slate-800 dark:text-slate-200 ml-1">
                    {temperature.toFixed(2)} <span className="text-[9px] text-slate-400">°C</span>
                  </span>
                </div>
              )}

              {visibleFields.showStrappingFactor && (
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span className="truncate">Fator Arqueamento:</span>
                  <span className="font-semibold font-mono text-slate-800 dark:text-slate-200 ml-1">
                    {strappingFactor.toFixed(2)} <span className="text-[9px] text-slate-400">m³/%</span>
                  </span>
                </div>
              )}

              {visibleFields.showVolume && (
                <div className="flex justify-between items-center pt-0.5 border-t border-slate-200/60 dark:border-slate-800/80">
                  <span className="truncate font-medium text-slate-700 dark:text-slate-300">Volume Calculado:</span>
                  <span className={cn("font-bold font-mono ml-1 text-[12px]", statusDetails.text)}>
                    {calculatedVolume.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span className="text-[9px] opacity-75">{volumeUnit}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-[10px]">
          <span className="font-medium text-slate-400 dark:text-slate-500 truncate">
            {footerLabel || 'Arqueamento'}
          </span>
          <span
            className={cn(
              "px-2 py-0.5 rounded font-black tracking-wider text-[10px] uppercase font-mono shadow-sm",
              statusDetails.bgPill
            )}
          >
            {status}
          </span>
        </div>
      </div>
    </div>
  );
};
