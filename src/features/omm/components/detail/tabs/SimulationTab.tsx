import React, { useState } from 'react';
import { useOmmStore } from '../../../store/useOmmStore';
import type { OmmMovement } from '../../../types';
import { Play, Pause, RotateCcw, Zap, Waves, TrendingUp, Shuffle } from 'lucide-react';

const SIM_MODES: { value: OmmMovement['simMode']; label: string; icon: React.ReactNode }[] = [
  { value: 'fixed', label: 'Fixo', icon: <span className="text-xs font-mono">━</span> },
  { value: 'ramp', label: 'Rampa', icon: <TrendingUp className="w-3 h-3" /> },
  { value: 'sine', label: 'Senoidal', icon: <Waves className="w-3 h-3" /> },
  { value: 'noise', label: 'Ruído', icon: <Shuffle className="w-3 h-3" /> },
  { value: 'variable', label: 'Variável', icon: <Zap className="w-3 h-3" /> },
];

export const SimulationTab: React.FC<{ movementId: string }> = ({ movementId }) => {
  const movement = useOmmStore((s) => s.movements.find((m) => m.id === movementId));
  const setMovementFlowRate = useOmmStore((s) => s.setMovementFlowRate);
  const toggleMovementPause = useOmmStore((s) => s.toggleMovementPause);
  const setMovementSimMode = useOmmStore((s) => s.setMovementSimMode);
  const toggleSimulator = useOmmStore((s) => s.toggleSimulator);
  const simState = useOmmStore((s) => s.simulatorState);

  const [localFlow, setLocalFlow] = useState<string>('');

  if (!movement) return null;

  const isControllable = movement.status === 'Active';
  const displayFlow = localFlow !== '' ? localFlow : movement.simFlowRate.toFixed(1);

  const handleFlowApply = () => {
    const val = parseFloat(localFlow);
    if (!isNaN(val) && val >= 0) {
      setMovementFlowRate(movementId, val);
      setLocalFlow('');
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Global simulator status */}
      <div className={`flex items-center justify-between p-3 rounded-xl border
        ${simState.isRunning
          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50'
          : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50'
        }`}>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Simulador Global</div>
          <div className={`text-sm font-bold ${simState.isRunning ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {simState.isRunning ? `Rodando @ ${simState.speedMultiplier}x` : 'Pausado'}
          </div>
        </div>
        <button
          onClick={toggleSimulator}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all border
            ${simState.isRunning
              ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-200'
              : 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200'
            }`}
        >
          {simState.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {simState.isRunning ? 'Pausar' : 'Iniciar'}
        </button>
      </div>

      {/* Movement pause control */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/50">
        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">Controle deste Movimento</div>
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-sm font-bold ${movement.simPaused ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {movement.simPaused ? '⏸ Pausado individualmente' : '▶ Em execução'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Status: <span className="font-semibold">{movement.status}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => isControllable && toggleMovementPause(movementId)}
              disabled={!isControllable}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {movement.simPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              {movement.simPaused ? 'Retomar' : 'Pausar'}
            </button>
            <button
              disabled={!isControllable}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Flow rate control */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/50">
        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">Vazão de Simulação</div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <input
              type="number"
              value={displayFlow}
              onChange={(e) => setLocalFlow(e.target.value)}
              disabled={!isControllable}
              min={0}
              max={2000}
              step={10}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-mono font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-sky-500 disabled:opacity-40"
            />
          </div>
          <span className="text-[11px] text-slate-400 font-mono">m³/h</span>
          <button
            onClick={handleFlowApply}
            disabled={!isControllable || localFlow === ''}
            className="px-3 py-2 rounded-lg text-[11px] font-bold bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            Aplicar
          </button>
        </div>
        <div className="mt-2">
          <input
            type="range"
            min={0}
            max={Math.max(movement.plannedFlow * 2, 200)}
            step={10}
            value={movement.simFlowRate}
            disabled={!isControllable}
            onChange={(e) => isControllable && setMovementFlowRate(movementId, parseFloat(e.target.value))}
            className="w-full accent-sky-500 disabled:opacity-40"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5">
            <span>0</span>
            <span>Plan: {movement.plannedFlow.toFixed(0)}</span>
            <span>{(Math.max(movement.plannedFlow * 2, 200)).toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Simulation mode */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/50">
        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">Modo de Simulação</div>
        <div className="grid grid-cols-5 gap-1">
          {SIM_MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => isControllable && setMovementSimMode(movementId, mode.value)}
              disabled={!isControllable}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] font-semibold cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed
                ${movement.simMode === mode.value
                  ? 'bg-sky-100 dark:bg-sky-900/40 border-sky-400 dark:border-sky-600 text-sky-700 dark:text-sky-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
            >
              {mode.icon}
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Speed multiplier (global) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/50">
        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">
          Velocidade do Simulador — {simState.speedMultiplier}x
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[1, 10, 30, 60, 120, 360, 720].map((speed) => (
            <button
              key={speed}
              onClick={() => useOmmStore.getState().setSimulatorSpeed(speed)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition-all
                ${simState.speedMultiplier === speed
                  ? 'bg-sky-600 border-sky-600 text-white'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-sky-400'
                }`}
            >
              {speed}x
            </button>
          ))}
        </div>
        <div className="text-[9px] text-slate-400 mt-1.5">
          1x = tempo real · 60x = 1min/seg · 720x = 12min/seg
        </div>
      </div>

      {/* Live metrics */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/50">
        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">Métricas em Tempo Real</div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div><span className="text-slate-400">Vazão atual:</span> <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{movement.currentFlow.toFixed(2)} m³/h</span></div>
          <div><span className="text-slate-400">Acurácia:</span> <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{movement.accuracy.toFixed(3)}%</span></div>
          <div><span className="text-slate-400">Temp.:</span> <span className="font-mono font-bold text-orange-500">{movement.temperature.toFixed(2)}°C</span></div>
          <div><span className="text-slate-400">Pressão:</span> <span className="font-mono font-bold text-blue-500">{movement.pressure.toFixed(3)} kgf</span></div>
          <div><span className="text-slate-400">% Concl.:</span> <span className="font-mono font-bold text-violet-500">{movement.percentComplete.toFixed(2)}%</span></div>
          <div><span className="text-slate-400">ETTC:</span> <span className="font-mono font-bold text-amber-500">{movement.ettcMin > 0 ? `${Math.round(movement.ettcMin)} min` : '—'}</span></div>
        </div>
      </div>
    </div>
  );
};
