import React, { useState, useEffect } from 'react';
import { useOmmStore } from '../../store/useOmmStore';
import { TankGeometrySvg } from '../../../../components/TankGeometrySvg';
import { Activity } from 'lucide-react';
import { cn } from '../../../../utils/cn';

interface TankFlowVisualizerProps {
  originId: string;
  destinationId: string;
  movementId: string | null;
}

const TrendChart: React.FC<{
  title: string;
  tag: string;
  values: number[];
  color: string;
  currentValue: number;
}> = ({ title, tag, values, color, currentValue }) => {
  const width = 280;
  const height = 70;
  const points = values.length > 0 ? values : [currentValue];

  const pathD = points
    .map((val, idx) => {
      const x = (idx / Math.max(1, points.length - 1)) * width;
      const y = height - (val / 100) * (height - 10) - 5;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  return (
    <div className="flex flex-col bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs select-text">
      <div className="flex justify-between items-center mb-1.5">
        <div>
          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
            {tag}
          </span>
          <h4 className="text-[10px] font-bold text-slate-700 dark:text-slate-350">
            {title}
          </h4>
        </div>
        <div className="text-right font-mono">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
            {currentValue.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="relative h-[70px] w-full border-b border-l border-slate-200 dark:border-slate-800">
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
          <defs>
            <linearGradient id={`grad-${tag}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="currentColor" className="text-slate-100 dark:text-slate-800/40" strokeDasharray="3 3" />
          <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="currentColor" className="text-slate-100 dark:text-slate-800/40" strokeDasharray="3 3" />
          <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="currentColor" className="text-slate-100 dark:text-slate-800/40" strokeDasharray="3 3" />

          <path d={areaD} fill={`url(#grad-${tag})`} />
          <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

          {points.length > 0 && (
            <circle
              cx={width}
              cy={height - (points[points.length - 1] / 100) * (height - 10) - 5}
              r="3"
              fill={color}
              className="animate-pulse"
            />
          )}
        </svg>
      </div>
    </div>
  );
};

export const TankFlowVisualizer: React.FC<TankFlowVisualizerProps> = ({
  originId,
  destinationId,
  movementId,
}) => {
  const equipments = useOmmStore((s) => s.equipments);
  const movements = useOmmStore((s) => s.movements);
  const products = useOmmStore((s) => s.products);

  const [viewMode, setViewMode] = useState<'3d' | 'pfd'>('3d');

  // Resolve tanks
  const originTank = equipments.find((e) => e.id === originId) ?? null;
  const destinationTank = equipments.find((e) => e.id === destinationId) ?? null;
  const movement = movements.find((m) => m.id === movementId) ?? null;

  // Resolve product info
  const product = products.find((p) => p.id === (movement?.productId ?? originTank?.productId ?? '')) ?? null;
  const productColor = product?.color ?? '#3b82f6';
  const isFlowActive = movement?.status === 'Active' && !movement.simPaused;

  const [originHistory, setOriginHistory] = useState<number[]>([]);
  const [destHistory, setDestHistory] = useState<number[]>([]);

  useEffect(() => {
    if (!originTank || !destinationTank) return;
    const initialOrigin = Array.from({ length: 25 }, (_, i) => {
      const step = isFlowActive ? (25 - 1 - i) * 0.2 : 0;
      return Math.min(100, Math.max(0, originTank.currentLevel + step));
    });
    const initialDest = Array.from({ length: 25 }, (_, i) => {
      const step = isFlowActive ? (25 - 1 - i) * 0.2 : 0;
      return Math.min(100, Math.max(0, destinationTank.currentLevel - step));
    });
    setOriginHistory(initialOrigin);
    setDestHistory(initialDest);
  }, [originTank?.id, destinationTank?.id]);

  useEffect(() => {
    if (!originTank || !destinationTank) return;
    const interval = setInterval(() => {
      setOriginHistory(prev => {
        const next = [...prev, originTank.currentLevel];
        if (next.length > 30) next.shift();
        return next;
      });
      setDestHistory(prev => {
        const next = [...prev, destinationTank.currentLevel];
        if (next.length > 30) next.shift();
        return next;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [originTank?.currentLevel, destinationTank?.currentLevel]);

  if (!originTank || !destinationTank) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center p-6 select-none">
        <Activity className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3 animate-pulse" />
        <h4 className="text-sm font-bold text-slate-600 dark:text-slate-305">Aguardando Seleção de Rota</h4>
        <p className="text-xs text-slate-400 max-w-xs mt-1">Selecione um equipamento de Origem e de Destino na aba Movimento para visualizar o fluxo gráfico.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/20 dark:bg-slate-950/10 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden select-none">
      
      {/* Visualizer Toolbar */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
        <div>
          <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">
            Visualização Dinâmica de Rota
          </span>
          {movement && (
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
              {movement.number} — {product?.name ?? 'Sem Produto'}
            </h4>
          )}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-bold">
          <button
            onClick={() => setViewMode('3d')}
            className={cn(
              "px-3 py-1 rounded-md transition-all cursor-pointer",
              viewMode === '3d'
                ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-2xs"
                : "text-slate-550 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            Fluxo 3D
          </button>
          <button
            onClick={() => setViewMode('pfd')}
            className={cn(
              "px-3 py-1 rounded-md transition-all cursor-pointer",
              viewMode === 'pfd'
                ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-2xs"
                : "text-slate-550 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            Diagrama PFD
          </button>
        </div>
      </div>

      {/* Main Flow Canvas */}
      <div className="flex-1 min-h-[300px] flex items-center justify-center relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs">
        
        {/* Style definitions for animated dashes in SVG pipes */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes pipe-dash {
            to {
              stroke-dashoffset: -20;
            }
          }
          .animate-pipe-flow {
            stroke-dasharray: 6, 6;
            animation: pipe-dash 1s linear infinite;
          }
          @keyframes spinner {
            to { transform: rotate(360deg); }
          }
          .animate-pump-spin {
            animation: spinner 3s linear infinite;
          }
        `}} />

        {viewMode === '3d' ? (
          /* VIEW 1: 3D INDUSTRIAL FLUID VIEW */
          <div className="w-full flex flex-col items-center gap-6 max-w-3xl">
            
            {/* Tanks and pipes row */}
            <div className="w-full flex items-center justify-between gap-6">
              {/* Origin Tank */}
              <div className="flex flex-col items-center">
                <span className="font-mono text-[9px] font-bold bg-slate-100 dark:bg-slate-850 text-slate-650 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 mb-1">
                  {originTank.tag}
                </span>
                <div className="relative w-28 h-36 flex items-center justify-center my-1">
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-100 to-slate-200/50 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 opacity-20" />
                  <TankGeometrySvg
                    geometry={originTank.type === 'Sphere' ? 'spherical' : originTank.type === 'Vessel' ? 'pressurized' : 'vertical_cylindrical'}
                    levelPercent={originTank.currentLevel}
                    fillColor={productColor}
                    width={75}
                    height={110}
                    className="z-10 drop-shadow-xs"
                  />
                </div>
                <div className="text-center font-mono text-[10px] mt-1 select-text">
                  <div className="font-bold text-slate-700 dark:text-slate-300">{originTank.currentLevel.toFixed(1)}%</div>
                  <div className="text-slate-400">{originTank.currentVolume.toFixed(0)} m³</div>
                </div>
              </div>

              {/* Connecting Pipe SVG */}
              <div className="flex-1 h-36 relative flex items-center justify-center">
                <svg width="100%" height="100%" viewBox="0 0 200 100" preserveAspectRatio="none" className="overflow-visible">
                  {/* Background pipe tube */}
                  <path
                    d="M 0,50 L 200,50"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className="dark:stroke-slate-800"
                  />
                  
                  {/* Active fluid inside pipe */}
                  {isFlowActive && (
                    <path
                      d="M 0,50 L 200,50"
                      fill="none"
                      stroke={productColor}
                      strokeWidth="4"
                      strokeLinecap="round"
                      className="animate-pipe-flow"
                    />
                  )}
                </svg>

                {/* Pump/Flow node in center of pipeline */}
                <div className="absolute top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-full p-2.5 shadow-md flex items-center justify-center z-20">
                  <div className={cn(
                    "p-1.5 rounded-full border bg-slate-50 dark:bg-slate-800 text-slate-500",
                    isFlowActive ? "border-emerald-400 text-emerald-600 dark:text-emerald-400" : "border-slate-200"
                  )}>
                    <Activity className={cn("w-4 h-4", isFlowActive && "animate-pump-spin")} style={{ animationDuration: '3s' }} />
                  </div>
                  {/* Dynamic flow readout */}
                  {isFlowActive && movement && (
                    <div className="absolute top-12 font-mono text-[9px] font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 px-1.5 py-0.2 rounded shadow-2xs select-text">
                      {movement.currentFlow.toFixed(1)} m³/h
                    </div>
                  )}
                </div>
              </div>

              {/* Destination Tank */}
              <div className="flex flex-col items-center">
                <span className="font-mono text-[9px] font-bold bg-slate-100 dark:bg-slate-850 text-slate-650 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 mb-1">
                  {destinationTank.tag}
                </span>
                <div className="relative w-28 h-36 flex items-center justify-center my-1">
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-100 to-slate-200/50 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 opacity-20" />
                  <TankGeometrySvg
                    geometry={destinationTank.type === 'Sphere' ? 'spherical' : destinationTank.type === 'Vessel' ? 'pressurized' : 'vertical_cylindrical'}
                    levelPercent={destinationTank.currentLevel}
                    fillColor={productColor}
                    width={75}
                    height={110}
                    className="z-10 drop-shadow-xs"
                  />
                </div>
                <div className="text-center font-mono text-[10px] mt-1 select-text">
                  <div className="font-bold text-slate-700 dark:text-slate-300">{destinationTank.currentLevel.toFixed(1)}%</div>
                  <div className="text-slate-400">{destinationTank.currentVolume.toFixed(0)} m³</div>
                </div>
              </div>
            </div>

            {/* Level Trends Row */}
            <div className="w-full grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
              <TrendChart
                title="Tendência de Nível - Origem"
                tag={originTank.tag}
                values={originHistory}
                color={productColor}
                currentValue={originTank.currentLevel}
              />
              <TrendChart
                title="Tendência de Nível - Destino"
                tag={destinationTank.tag}
                values={destHistory}
                color={productColor}
                currentValue={destinationTank.currentLevel}
              />
            </div>

          </div>
        ) : (
          /* VIEW 2: PROCESS FLOW DIAGRAM (PFD) */
          <div className="w-full flex flex-col items-center max-w-4xl font-mono text-[10px] select-text">
            
            {/* PFD Graphics Grid */}
            <div className="w-full flex items-center justify-between gap-2 py-8 relative">
              
              {/* Box 1: Origin */}
              <div className={cn(
                "w-24 border rounded-lg p-2 bg-slate-50 dark:bg-slate-900 text-center shadow-2xs transition-colors",
                isFlowActive ? "border-emerald-400/80 bg-emerald-50/10" : "border-slate-200 dark:border-slate-800"
              )}>
                <div className="font-bold text-slate-800 dark:text-slate-200">{originTank.tag}</div>
                <div className="text-slate-450 mt-0.5">{originTank.type}</div>
                <div className="border-t border-slate-200 dark:border-slate-800 mt-1.5 pt-1 text-[9px] text-slate-500 dark:text-slate-400">
                  <div>Lvl: {originTank.currentLevel.toFixed(1)}%</div>
                  <div>Vol: {originTank.currentVolume.toFixed(0)} m³</div>
                </div>
              </div>

              {/* Pipe segment 1 */}
              <div className="flex-1 h-1 relative">
                <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 rounded" />
                {isFlowActive && (
                  <div className="absolute inset-y-0 bg-emerald-500 dark:bg-emerald-400 animate-pulse w-full rounded" />
                )}
              </div>

              {/* Box 2: Origin Valve */}
              <div className={cn(
                "w-14 border rounded-lg p-1 bg-slate-50 dark:bg-slate-900 text-center transition-colors",
                isFlowActive ? "border-emerald-400 bg-emerald-50/10 text-emerald-600 dark:text-emerald-400" : "border-slate-200 dark:border-slate-800"
              )}>
                <div className="font-bold">V-SRC</div>
                <div className="text-[8px] text-slate-450 mt-0.5">
                  {isFlowActive ? 'ABERTA' : 'FECHADA'}
                </div>
              </div>

              {/* Pipe segment 2 */}
              <div className="flex-1 h-1 relative">
                <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 rounded" />
                {isFlowActive && (
                  <div className="absolute inset-y-0 bg-emerald-500 dark:bg-emerald-400 animate-pulse w-full rounded" />
                )}
              </div>

              {/* Box 3: Centrifugal Pump */}
              <div className={cn(
                "w-16 border rounded-lg p-1.5 bg-slate-50 dark:bg-slate-900 text-center shadow-2xs transition-colors",
                isFlowActive ? "border-emerald-400 bg-emerald-50/10 text-emerald-600 dark:text-emerald-400" : "border-slate-200 dark:border-slate-800"
              )}>
                <div className="font-bold">PUMP-01</div>
                <div className="text-[8px] text-slate-450 mt-0.5">
                  {isFlowActive ? 'LIGADA' : 'DESLIGADA'}
                </div>
              </div>

              {/* Pipe segment 3 */}
              <div className="flex-1 h-1 relative">
                <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 rounded" />
                {isFlowActive && (
                  <div className="absolute inset-y-0 bg-emerald-500 dark:bg-emerald-400 animate-pulse w-full rounded" />
                )}
              </div>

              {/* Box 4: Destination Valve */}
              <div className={cn(
                "w-14 border rounded-lg p-1 bg-slate-50 dark:bg-slate-900 text-center transition-colors",
                isFlowActive ? "border-emerald-400 bg-emerald-50/10 text-emerald-600 dark:text-emerald-400" : "border-slate-200 dark:border-slate-800"
              )}>
                <div className="font-bold">V-DST</div>
                <div className="text-[8px] text-slate-450 mt-0.5">
                  {isFlowActive ? 'ABERTA' : 'FECHADA'}
                </div>
              </div>

              {/* Pipe segment 4 */}
              <div className="flex-1 h-1 relative">
                <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 rounded" />
                {isFlowActive && (
                  <div className="absolute inset-y-0 bg-emerald-500 dark:bg-emerald-400 animate-pulse w-full rounded" />
                )}
              </div>

              {/* Box 5: Destination */}
              <div className={cn(
                "w-24 border rounded-lg p-2 bg-slate-50 dark:bg-slate-900 text-center shadow-2xs transition-colors",
                isFlowActive ? "border-emerald-400/80 bg-emerald-50/10" : "border-slate-200 dark:border-slate-800"
              )}>
                <div className="font-bold text-slate-800 dark:text-slate-200">{destinationTank.tag}</div>
                <div className="text-slate-450 mt-0.5">{destinationTank.type}</div>
                <div className="border-t border-slate-200 dark:border-slate-800 mt-1.5 pt-1 text-[9px] text-slate-500 dark:text-slate-400">
                  <div>Lvl: {destinationTank.currentLevel.toFixed(1)}%</div>
                  <div>Vol: {destinationTank.currentVolume.toFixed(0)} m³</div>
                </div>
              </div>

            </div>

            {/* PFD Diagnostics readout */}
            <div className="w-full bg-slate-100/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 grid grid-cols-3 gap-2">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Pressão Sucção:</span>
                <span className="font-bold text-slate-700 dark:text-slate-350 ml-1">
                  {originTank.pressure.toFixed(2)} bar
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Pressão Descarga:</span>
                <span className="font-bold text-slate-700 dark:text-slate-350 ml-1">
                  {(originTank.pressure + (isFlowActive ? 3.4 : 0)).toFixed(2)} bar
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Temp. Rota:</span>
                <span className="font-bold text-slate-700 dark:text-slate-350 ml-1">
                  {originTank.temperature.toFixed(1)} °C
                </span>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
