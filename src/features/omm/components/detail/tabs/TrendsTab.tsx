import React, { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useOmmStore } from '../../../store/useOmmStore';
import { TrendingUp } from 'lucide-react';

// ---------------------------------------------------------------------------
// Mini SVG sparkline chart
// ---------------------------------------------------------------------------
interface SparklineProps {
  data: number[];
  width: number;
  height: number;
  color: string;
  unit: string;
  label: string;
}

const Sparkline: React.FC<SparklineProps> = ({ data, width, height, color, unit, label }) => {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-slate-400">
        Coletando dados...
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `M ${points[0]} L ${points.join(' L ')} L ${width},${height} L 0,${height} Z`;
  const latest = data[data.length - 1];

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</span>
        <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">
          {latest.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">{unit}</span>
        </span>
      </div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#grad-${label})`} />
        <path d={pathD} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Latest value dot */}
        <circle cx={width} cy={height - ((latest - min) / range) * (height - 8) - 4} r="3" fill={color} />
      </svg>
      <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1">
        <span>{min.toFixed(1)}</span>
        <span>{max.toFixed(1)}</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Trends Tab
// ---------------------------------------------------------------------------
export const TrendsTab: React.FC<{ movementId: string }> = ({ movementId }) => {
  const historyPoints = useOmmStore(useShallow((s) => s.historyPoints.filter((h) => h.movementId === movementId).sort((a, b) => a.timestamp.localeCompare(b.timestamp))));

  const series = useMemo(() => {
    const pts = historyPoints.slice(-60); // last 60 samples
    return {
      flow: pts.map((p) => p.flow),
      volume: pts.map((p) => p.volume),
      temperature: pts.map((p) => p.temperature),
      pressure: pts.map((p) => p.pressure),
      density: pts.map((p) => p.density),
      level: pts.map((p) => p.level),
      accuracy: pts.map((p) => p.accuracy),
    };
  }, [historyPoints]);

  const hasData = historyPoints.length > 0;

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Tendências — {historyPoints.length} amostras
        </span>
        {!hasData && (
          <span className="text-[10px] text-amber-500">Aguardando dados...</span>
        )}
      </div>

      {!hasData ? (
        <div className="text-center py-8">
          <TrendingUp className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <div className="text-sm text-slate-400">Tendências disponíveis após ativação</div>
          <div className="text-[11px] text-slate-300 dark:text-slate-600 mt-1">
            O simulador coleta dados a cada 5 ticks
          </div>
        </div>
      ) : (
        <>
          <Sparkline data={series.flow.length > 1 ? series.flow : [0, 1]} width={300} height={60} color="#10b981" unit="m³/h" label="Vazão Instantânea" />
          <Sparkline data={series.volume.length > 1 ? series.volume : [0, 1]} width={300} height={60} color="#3b82f6" unit="m³" label="Volume Acumulado" />
          <Sparkline data={series.temperature.length > 1 ? series.temperature : [0, 1]} width={300} height={60} color="#f97316" unit="°C" label="Temperatura" />
          <Sparkline data={series.pressure.length > 1 ? series.pressure : [0, 1]} width={300} height={60} color="#6366f1" unit="kgf/cm²" label="Pressão" />
          <Sparkline data={series.density.length > 1 ? series.density : [0, 1]} width={300} height={60} color="#8b5cf6" unit="kg/m³" label="Densidade" />
          <Sparkline data={series.level.length > 1 ? series.level : [0, 1]} width={300} height={60} color="#06b6d4" unit="%" label="Nível Tanque Origem" />
          <Sparkline data={series.accuracy.length > 1 ? series.accuracy : [0, 1]} width={300} height={60} color="#f59e0b" unit="%" label="Accuracy" />
        </>
      )}
    </div>
  );
};
