import React from 'react';
// Equipments Tab Component
import { useOmmStore } from '../../../store/useOmmStore';
import type { OmmEquipment } from '../../../types';
import { Gauge, Thermometer, ArrowRightLeft, Droplets, Activity } from 'lucide-react';

const EquipCard: React.FC<{ eq: OmmEquipment; role: string; active?: boolean }> = ({ eq, role, active }) => (
  <div className={`rounded-xl border p-3 ${active ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'}`}>
    <div className="flex items-center justify-between mb-2">
      <div>
        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">{eq.tag}</span>
        <span className="ml-2 text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">{role}</span>
      </div>
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold
        ${active ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
        {eq.type}
      </span>
    </div>
    <div className="text-[11px] text-slate-600 dark:text-slate-300 mb-2 leading-snug">{eq.name}</div>
    {eq.capacity > 0 && (
      <div className="space-y-1.5">
        {/* Level bar */}
        <div className="flex items-center gap-2">
          <Gauge className="w-3 h-3 text-slate-400 shrink-0" />
          <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${eq.currentLevel}%`, backgroundColor: eq.color }}
            />
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 w-10 text-right">
            {eq.currentLevel.toFixed(1)}%
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
          <div>
            <div className="text-slate-400">Volume</div>
            <div className="font-semibold text-slate-600 dark:text-slate-300">{eq.currentVolume.toFixed(0)} m³</div>
          </div>
          <div>
            <div className="text-slate-400">Capacidade</div>
            <div className="font-semibold text-slate-600 dark:text-slate-300">{eq.capacity.toFixed(0)} m³</div>
          </div>
          <div>
            <div className="text-slate-400">Massa</div>
            <div className="font-semibold text-slate-600 dark:text-slate-300">{(eq.currentMass / 1000).toFixed(2)} kt</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1 text-[10px] font-mono border-t border-slate-200 dark:border-slate-700 pt-1.5 mt-1">
          <div className="flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-orange-400" />
            <span className="text-slate-500">{eq.temperature.toFixed(1)}°C</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-blue-400" />
            <span className="text-slate-500">{eq.pressure.toFixed(2)} kgf</span>
          </div>
          <div className="flex items-center gap-1">
            <Droplets className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-500">{eq.density.toFixed(1)} kg/m³</span>
          </div>
        </div>
      </div>
    )}
    <div className="flex gap-1.5 mt-2">
      {eq.isSending && <span className="text-[9px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-full font-semibold">ENVIANDO</span>}
      {eq.isReceiving && <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full font-semibold">RECEBENDO</span>}
    </div>
  </div>
);

export const EquipmentsTab: React.FC<{ movementId: string }> = ({ movementId }) => {
  const movement = useOmmStore((s) => s.movements.find((m) => m.id === movementId));
  const equipments = useOmmStore((s) => s.equipments);

  if (!movement) return null;

  const origin = equipments.find((e) => e.id === movement.originId);
  const dest = equipments.find((e) => e.id === movement.destinationId);
  const via = movement.viaId ? equipments.find((e) => e.id === movement.viaId) : null;
  const meter = movement.meterId ? equipments.find((e) => e.id === movement.meterId) : null;

  return (
    <div className="p-4 space-y-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Equipamentos do Movimento</div>

      {origin && <EquipCard eq={origin} role="Origem" active={origin.isSending} />}

      {via && (
        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Via:</span>
        </div>
      )}
      {via && <EquipCard eq={via} role="Via / Bomba" />}

      <div className="flex items-center justify-center">
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            {movement.currentFlow > 0 ? `${movement.currentFlow.toFixed(1)} m³/h` : 'Sem fluxo'}
          </span>
        </div>
      </div>

      {dest && <EquipCard eq={dest} role="Destino" active={dest.isReceiving} />}

      {meter && (
        <>
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Equipamento de Medição</div>
            <EquipCard eq={meter} role="Medidor" />
          </div>
        </>
      )}

      {!origin && !dest && (
        <div className="text-center py-8 text-slate-400 text-sm">
          Equipamentos não encontrados
        </div>
      )}
    </div>
  );
};
