import React, { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useOmmStore } from '../../store/useOmmStore';
import type { OmmEquipment } from '../../types';
import { X, Gauge, Thermometer, Droplets, Activity, ArrowRight } from 'lucide-react';
import { TankTelemetryModal } from '../ui/TankTelemetryModal';

// ---------------------------------------------------------------------------
// Equipment card for the plant canvas
// ---------------------------------------------------------------------------
const EquipNode: React.FC<{
  eq: OmmEquipment;
  onClick: (eq: OmmEquipment) => void;
}> = ({ eq, onClick }) => {
  const isActive = eq.isSending || eq.isReceiving;
  const isTank = eq.type === 'Tank' || eq.type === 'Vessel' || eq.type === 'Sphere' || eq.type === 'Ship';
  const isPump = eq.type === 'Pump';
  const isMeter = (eq.type as string) === 'FlowMeter';

  return (
    <div
      className={`absolute cursor-pointer transition-all duration-350 select-none group
        ${isActive ? 'drop-shadow-lg' : 'hover:drop-shadow-md'}`}
      style={{ left: eq.x ?? 0, top: eq.y ?? 0, width: eq.width ?? 80, zIndex: isActive ? 10 : 5 }}
      onClick={() => onClick(eq)}
      title={`${eq.tag} — ${eq.name} (Clique para ver telemetria)`}
    >
      {isTank ? (
        <div className={`relative rounded-xl border-2 overflow-hidden transition-all
          ${isActive ? 'border-emerald-400 dark:border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-slate-300 dark:border-slate-600'}
          bg-white dark:bg-slate-800`}
          style={{ height: eq.height ?? 100 }}
        >
          {/* Level fill */}
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-1000 opacity-80"
            style={{
              height: `${eq.currentLevel}%`,
              backgroundColor: eq.color,
            }}
          />
          {/* Flow animation */}
          {eq.isSending && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-amber-400/10 animate-pulse" />
            </div>
          )}
          {eq.isReceiving && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-400/20 to-transparent animate-pulse" />
            </div>
          )}
          {/* Tag label */}
          <div className="absolute inset-x-0 top-1 flex justify-center z-10">
            <span className="font-mono text-[9px] font-bold bg-white/80 dark:bg-slate-900/80 px-1 rounded text-slate-700 dark:text-slate-200">
              {eq.tag}
            </span>
          </div>
          {/* Level text */}
          <div className="absolute inset-x-0 bottom-1 flex justify-center z-10">
            <span className="font-mono text-[9px] font-bold text-white drop-shadow-sm">
              {eq.currentLevel.toFixed(1)}%
            </span>
          </div>
        </div>
      ) : isPump ? (
        <div className={`flex flex-col items-center gap-0.5`}>
          <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all
            ${isActive ? 'border-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 animate-spin' : 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800'}`}
            style={{ animationDuration: '2s' }}
          >
            <Activity className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
          </div>
          <span className="font-mono text-[8px] font-bold text-slate-500 dark:text-slate-400 text-center">{eq.tag}</span>
        </div>
      ) : isMeter ? (
        <div className="flex flex-col items-center gap-0.5">
          <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center
            ${isActive ? 'border-sky-400 bg-sky-100 dark:bg-sky-900/40' : 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800'}`}>
            <Gauge className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
          </div>
          <span className="font-mono text-[8px] font-bold text-slate-500 dark:text-slate-400 text-center">{eq.tag}</span>
        </div>
      ) : (
        <div className={`rounded-lg border px-2 py-1.5 text-center
          ${isActive ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30' : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800'}`}>
          <div className="font-mono text-[9px] font-bold text-slate-600 dark:text-slate-200">{eq.tag}</div>
          <div className="text-[8px] text-slate-400 truncate max-w-[70px]">{eq.type}</div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Equipment faceplate overlay (used for non-tank equipments)
// ---------------------------------------------------------------------------
const EquipFaceplate: React.FC<{ eq: OmmEquipment; onClose: () => void }> = ({ eq, onClose }) => {
  const movements = useOmmStore(useShallow((s) =>
    s.movements.filter((m) => m.status === 'Active' && (m.originId === eq.id || m.destinationId === eq.id))
  ));

  return (
    <div className="absolute top-4 right-4 w-72 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800"
        style={{ background: `linear-gradient(135deg, ${eq.color}15, transparent)` }}>
        <div>
          <div className="font-mono text-sm font-bold text-slate-800 dark:text-slate-100">{eq.tag}</div>
          <div className="text-[11px] text-slate-550 dark:text-slate-400">{eq.name}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold
            ${eq.isActive ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 text-slate-500'}`}>
            {eq.type}
          </span>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-600 dark:text-slate-350 select-text">
          <div className="flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-orange-400" />
            <span>{eq.temperature.toFixed(1)}°C</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-blue-400" />
            <span>{eq.pressure.toFixed(2)} bar</span>
          </div>
          <div className="flex items-center gap-1">
            <Droplets className="w-3 h-3 text-cyan-400" />
            <span>{eq.density.toFixed(0)} kg/m³</span>
          </div>
        </div>

        {/* Active movements */}
        {movements.length > 0 && (
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">Movimentos Ativos</div>
            <div className="space-y-1.5">
              {movements.map((m) => (
                <div key={m.id} className="flex items-center gap-2 text-[10px] bg-emerald-50 dark:bg-emerald-950/20 rounded-lg px-2 py-1.5 select-text">
                  <ArrowRight className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{m.number}</span>
                  <span className="text-slate-550 dark:text-slate-400">{m.currentFlow.toFixed(1)} m³/h</span>
                  <span className="ml-auto text-emerald-600 dark:text-emerald-400 font-semibold">{m.percentComplete.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status badges */}
        <div className="flex gap-1.5 flex-wrap">
          {eq.isSending && <span className="text-[9px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">ENVIANDO</span>}
          {eq.isReceiving && <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">RECEBENDO</span>}
          {!eq.isSending && !eq.isReceiving && <span className="text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded-full font-bold">OCIOSO</span>}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Area label
// ---------------------------------------------------------------------------
const AreaLabel: React.FC<{ name: string; color: string; x: number; y: number }> = ({ name, color, x, y }) => (
  <div
    className="absolute text-[10px] font-bold uppercase tracking-widest pointer-events-none opacity-60"
    style={{ left: x, top: y, color }}
  >
    {name}
  </div>
);

// ---------------------------------------------------------------------------
// Plant Overview
// ---------------------------------------------------------------------------
export const PlantOverview: React.FC = () => {
  const equipments = useOmmStore((s) => s.equipments);
  const areas = useOmmStore((s) => s.areas);
  const [selectedEq, setSelectedEq] = useState<OmmEquipment | null>(null);
  const [scale, setScale] = useState(1);

  // Tank telemetry modal state
  const [telemetryTankId, setTelemetryTankId] = useState<string | null>(null);

  const activeMovements = useOmmStore(useShallow((s) => s.movements.filter((m) => m.status === 'Active')));

  const areaColors: Record<string, string> = {};
  areas.forEach((a) => { areaColors[a.id] = a.color; });

  const handleEquipClick = (eq: OmmEquipment) => {
    // If it's a tank-like equipment, open the rich 3D telemetry modal
    if (eq.type === 'Tank' || eq.type === 'Vessel' || eq.type === 'Sphere' || eq.type === 'Ship') {
      setTelemetryTankId(eq.id);
    } else {
      setSelectedEq(eq);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-slate-650 dark:text-slate-350">Vista da Planta Industrial</span>
          <span className="text-[10px] text-slate-400">
            {equipments.filter((e) => e.isSending || e.isReceiving).length} equipamentos ativos ·
            {activeMovements.length} movimentos
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">Zoom:</span>
          <input
            type="range" min={50} max={150} value={scale * 100} step={10}
            onChange={(e) => setScale(parseInt(e.target.value) / 100)}
            className="w-24 accent-sky-500"
          />
          <span className="text-[10px] font-mono text-slate-400">{Math.round(scale * 100)}%</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-1.5 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <div className="w-3 h-3 rounded-sm border-2 border-emerald-400 bg-emerald-100 dark:bg-emerald-900/30" />
          Recebendo
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <div className="w-3 h-3 rounded-sm border-2 border-amber-400 bg-amber-100 dark:bg-amber-900/30" />
          Enviando
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <div className="w-3 h-3 rounded-sm border-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800" />
          Ocioso
        </div>
        {areas.map((a) => (
          <div key={a.id} className="flex items-center gap-1 text-[10px] text-slate-500">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
            {a.code}
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-100 to-slate-200/50 dark:from-slate-950 dark:to-slate-900 relative">
        <div
          className="relative"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: 1200,
            height: 800,
          }}
        >
          {/* Area zone backgrounds */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute rounded-2xl border-2 border-slate-300/30 dark:border-slate-600/20 bg-slate-200/20 dark:bg-slate-800/10" style={{ left: 50, top: 50, width: 760, height: 520 }} />
          </div>

          {/* Area labels */}
          <AreaLabel name="Parque de Tanques" color={areas.find(a => a.code === 'PAR')?.color ?? '#3b82f6'} x={60} y={55} />
          <AreaLabel name="Terminal Marítimo" color={areas.find(a => a.code === 'TER')?.color ?? '#06b6d4'} x={820} y={200} />
          <AreaLabel name="UPR" color={areas.find(a => a.code === 'UPR')?.color ?? '#3b82f6'} x={60} y={520} />
          <AreaLabel name="Expedição" color={areas.find(a => a.code === 'EXP')?.color ?? '#f59e0b'} x={650} y={520} />

          {/* Flow lines between active movements */}
          <svg className="absolute inset-0 pointer-events-none" width="1200" height="800">
            {activeMovements.map((mov) => {
              const origin = equipments.find((e) => e.id === mov.originId);
              const dest = equipments.find((e) => e.id === mov.destinationId);
              if (!origin || !dest) return null;
              const ox = (origin.x ?? 0) + (origin.width ?? 0) / 2;
              const oy = (origin.y ?? 0) + (origin.height ?? 0) / 2;
              const dx = (dest.x ?? 0) + (dest.width ?? 0) / 2;
              const dy = (dest.y ?? 0) + (dest.height ?? 0) / 2;
              const mx = (ox + dx) / 2;
              const my = Math.min(oy, dy) - 40;
              return (
                <g key={mov.id}>
                  <path
                    d={`M ${ox} ${oy} Q ${mx} ${my} ${dx} ${dy}`}
                    stroke="#10b981"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="6 3"
                    opacity="0.6"
                    className="animate-[dash_1.5s_linear_infinite]"
                  />
                  {/* Flow rate label */}
                  <text x={mx} y={my - 4} textAnchor="middle" fontSize="9" fill="#10b981" fontFamily="monospace" fontWeight="bold">
                    {mov.currentFlow.toFixed(1)} m³/h
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Equipment nodes */}
          {equipments.map((eq, idx) => {
            const row = Math.floor(idx / 4);
            const col = idx % 4;
            const fallbackX = 80 + col * 170;
            const fallbackY = 90 + row * 190;
            const positionedEq = {
              ...eq,
              x: eq.x || fallbackX,
              y: eq.y || fallbackY,
              width: eq.width || 95,
              height: eq.height || 115,
            };
            return <EquipNode key={eq.id} eq={positionedEq} onClick={handleEquipClick} />;
          })}
        </div>

        {/* Faceplate overlay */}
        {selectedEq && (
          <EquipFaceplate eq={selectedEq} onClose={() => setSelectedEq(null)} />
        )}
      </div>

      {/* Reusable telemetry modal */}
      <TankTelemetryModal
        isOpen={!!telemetryTankId}
        objectId={telemetryTankId}
        onClose={() => setTelemetryTankId(null)}
      />
    </div>
  );
};
