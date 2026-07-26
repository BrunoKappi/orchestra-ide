import React, { useState } from 'react';
import { useOmmStore } from '../../store/useOmmStore';
import { X, Play, Pause, FastForward, AlertTriangle, Cpu, Gauge, Thermometer, Wind } from 'lucide-react';

interface SimulationControlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimulationControlModal: React.FC<SimulationControlModalProps> = ({ isOpen, onClose }) => {
  const simulatorState = useOmmStore((s) => s.simulatorState);
  const toggleSimulator = useOmmStore((s) => s.toggleSimulator);
  const setSimulatorSpeed = useOmmStore((s) => s.setSimulatorSpeed);
  const stepSimulationTime = useOmmStore((s) => s.stepSimulationTime);
  const setSimulatedTime = useOmmStore((s) => s.setSimulatedTime);
  
  const equipments = useOmmStore((s) => s.equipments);
  const updateEquipment = useOmmStore((s) => s.updateEquipment);
  const triggerEquipmentFault = useOmmStore((s) => s.triggerEquipmentFault);
  const getMovementRows = useOmmStore((s) => s.getMovementRows);
  const updateMovement = useOmmStore((s) => s.updateMovement);

  // Local state for manually setting date/time
  const [manualTime, setManualTime] = useState(simulatorState.simulatedTime.substring(0, 16));
  const [stepMinutes, setStepMinutes] = useState(60);

  // Local state for tank/equipment editor
  const [selectedEqId, setSelectedEqId] = useState(equipments[0]?.id ?? '');
  const selectedEq = equipments.find(e => e.id === selectedEqId);

  // Local state for active movements flow editor
  const activeMovs = getMovementRows().filter(m => m.status === 'Active');
  const [selectedMovId, setSelectedMovId] = useState(activeMovs[0]?.id ?? '');
  const selectedMov = activeMovs.find(m => m.id === selectedMovId);

  if (!isOpen) return null;

  const handleTimeChangeSubmit = () => {
    try {
      const iso = new Date(manualTime).toISOString();
      setSimulatedTime(iso);
    } catch {
      alert('Data/Hora inválida');
    }
  };

  const handleEqFieldChange = (field: string, value: number) => {
    if (!selectedEqId) return;
    
    // Auto-calculate related values if editing level
    if (field === 'currentLevel' && selectedEq) {
      const level = Math.max(0, Math.min(100, value));
      const volume = (selectedEq.capacity * level) / 100;
      const mass = (volume * selectedEq.density) / 1000;
      updateEquipment(selectedEqId, {
        currentLevel: level,
        currentVolume: volume,
        currentMass: mass
      });
      return;
    }
    
    // Auto-calculate mass if editing volume
    if (field === 'currentVolume' && selectedEq) {
      const volume = Math.max(0, Math.min(selectedEq.capacity, value));
      const level = (volume / selectedEq.capacity) * 100;
      const mass = (volume * selectedEq.density) / 1000;
      updateEquipment(selectedEqId, {
        currentLevel: level,
        currentVolume: volume,
        currentMass: mass
      });
      return;
    }

    updateEquipment(selectedEqId, { [field]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Painel de Controle da Simulação</h3>
            <p className="text-[10px] text-slate-400">Controle a aceleração do tempo, simule falhas de instrumentação e configure níveis operacionais</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {/* Virtual Clock & Simulation Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            {/* Virtual Clock */}
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Relógio Virtual</span>
              <div className="text-xl font-bold font-mono text-sky-600 dark:text-sky-400 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner inline-block w-full text-center">
                {new Date(simulatorState.simulatedTime).toLocaleString('pt-BR')}
              </div>
              
              <div className="mt-2 flex gap-1">
                <input
                  type="datetime-local"
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  className="flex-1 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] outline-none font-mono"
                />
                <button
                  onClick={handleTimeChangeSubmit}
                  className="px-3 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg font-bold text-[10px] cursor-pointer"
                >
                  Definir
                </button>
              </div>
            </div>

            {/* Time Speed & Run/Pause */}
            <div className="flex flex-col justify-between">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status do Simulador</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSimulator}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-white transition-all cursor-pointer ${
                      simulatorState.isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {simulatorState.isRunning ? (
                      <>
                        <Pause className="w-4 h-4" /> Pausar Simulação
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" /> Iniciar Simulação
                      </>
                    )}
                  </button>
                  
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Aceleração:</span>
                    <select
                      value={simulatorState.speedMultiplier}
                      onChange={(e) => setSimulatorSpeed(Number(e.target.value))}
                      className="bg-transparent font-bold font-mono text-sky-600 outline-none"
                    >
                      <option value="1">1x (Realtime)</option>
                      <option value="10">10x</option>
                      <option value="60">60x (1min/s)</option>
                      <option value="300">300x (5min/s)</option>
                      <option value="3600">3600x (1h/s)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Manual Time Step */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Avanço Manual:</span>
                <input
                  type="number"
                  value={stepMinutes}
                  onChange={(e) => setStepMinutes(Number(e.target.value))}
                  className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400">minutos</span>
                <button
                  onClick={() => stepSimulationTime(stepMinutes)}
                  className="flex items-center gap-1 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-[10px] cursor-pointer"
                >
                  <FastForward className="w-3.5 h-3.5" /> Avançar
                </button>
              </div>
            </div>
          </div>

          {/* Tank / Equipment Simulator Editor */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-slate-400">Simulador Operacional de Equipamentos</span>
              <select
                value={selectedEqId}
                onChange={(e) => setSelectedEqId(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-bold"
              >
                {equipments.map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.tag} — {eq.name}</option>
                ))}
              </select>
            </div>

            {selectedEq ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Level */}
                <div className="bg-slate-50/50 dark:bg-slate-800/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span>Nível</span>
                    <Gauge className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={selectedEq.currentLevel}
                      onChange={(e) => handleEqFieldChange('currentLevel', Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded font-mono text-right"
                    />
                    <span className="text-slate-400 font-bold">%</span>
                  </div>
                </div>

                {/* Capacity */}
                <div className="bg-slate-50/50 dark:bg-slate-800/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span>Volume</span>
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={selectedEq.currentVolume}
                      onChange={(e) => handleEqFieldChange('currentVolume', Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded font-mono text-right"
                    />
                    <span className="text-slate-400 font-bold">m³</span>
                  </div>
                </div>

                {/* Temperature */}
                <div className="bg-slate-50/50 dark:bg-slate-800/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span>Temperatura</span>
                    <Thermometer className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={selectedEq.temperature}
                      onChange={(e) => handleEqFieldChange('temperature', Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded font-mono text-right"
                    />
                    <span className="text-slate-400 font-bold">°C</span>
                  </div>
                </div>

                {/* Pressure */}
                <div className="bg-slate-50/50 dark:bg-slate-800/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span>Pressão</span>
                    <Wind className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={selectedEq.pressure}
                      onChange={(e) => handleEqFieldChange('pressure', Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded font-mono text-right"
                    />
                    <span className="text-slate-400 font-bold">kgf</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-slate-400">Selecione um equipamento para editar</div>
            )}
          </div>

          {/* Fault Simulation & Flow Modification during movement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fault simulation */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
              <span className="block text-[11px] font-bold uppercase text-slate-400">Induzir Falha de Instrumentação</span>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Selecione o Instrumento / Equipamento</label>
                <select
                  value={selectedEqId}
                  onChange={(e) => setSelectedEqId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-bold"
                >
                  {equipments.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.tag} — {eq.name} ({eq.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Tipo de Falha Simulada</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => triggerEquipmentFault(selectedEqId, 'comm_loss')}
                    className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900 font-bold text-[10px] cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Perda de Comm
                  </button>
                  <button
                    onClick={() => triggerEquipmentFault(selectedEqId, 'meter_freeze')}
                    className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900 font-bold text-[10px] cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Medidor Travado
                  </button>
                  <button
                    onClick={() => triggerEquipmentFault(selectedEqId, 'drift')}
                    className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900 font-bold text-[10px] cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Desvio de Proc.
                  </button>
                  <button
                    onClick={() => triggerEquipmentFault(selectedEqId, 'none')}
                    className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px] cursor-pointer border border-transparent"
                  >
                    Limpar Falhas
                  </button>
                </div>
              </div>
            </div>

            {/* Flow rates during active movements */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
              <span className="block text-[11px] font-bold uppercase text-slate-400">Modificar Vazão em Tempo Real</span>
              {activeMovs.length === 0 ? (
                <div className="text-center py-8 text-slate-400">Nenhum movimento ativo para modificar vazão no momento.</div>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">Selecione o Movimento Ativo</label>
                    <select
                      value={selectedMovId}
                      onChange={(e) => setSelectedMovId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-bold"
                    >
                      {activeMovs.map(m => (
                        <option key={m.id} value={m.id}>{m.number} ({m.originTag} → {m.destinationTag})</option>
                      ))}
                    </select>
                  </div>

                  {selectedMov && (
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Vazão da Simulação (m³/h)</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="range"
                          min="10"
                          max="2000"
                          step="10"
                          value={selectedMov.simFlowRate}
                          onChange={(e) => updateMovement(selectedMov.id, { simFlowRate: Number(e.target.value) })}
                          className="flex-1 accent-sky-600 cursor-pointer"
                        />
                        <span className="font-mono font-bold text-sky-600 w-16 text-right shrink-0">{selectedMov.simFlowRate} m³/h</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-bold hover:bg-slate-300 dark:hover:bg-slate-600 cursor-pointer"
          >
            Fechar Painel
          </button>
        </div>
      </div>
    </div>
  );
};
