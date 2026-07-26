import React, { useState, useEffect } from 'react';
import { useOmmStore } from '../../store/useOmmStore';
import type { OmmEquipment } from '../../types';
import {
  X, Play, Pause, RotateCcw, Clock, Save, UploadCloud, Table, LayoutGrid,
  TrendingUp, TrendingDown, Thermometer, Gauge, Activity,
  Zap, ShieldAlert
} from 'lucide-react';


interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimulatorModal: React.FC<SimulatorModalProps> = ({ isOpen, onClose }) => {
  const simulatorState = useOmmStore((s) => s.simulatorState);
  const toggleSimulator = useOmmStore((s) => s.toggleSimulator);
  const setSimulatorSpeed = useOmmStore((s) => s.setSimulatorSpeed);
  const stepSimulationTime = useOmmStore((s) => s.stepSimulationTime);
  const setSimulatedTime = useOmmStore((s) => s.setSimulatedTime);
  
  const equipments = useOmmStore((s) => s.equipments);
  const products = useOmmStore((s) => s.products);
  const movements = useOmmStore((s) => s.movements);
  const alarms = useOmmStore((s) => s.alarms);
  
  const updateEquipment = useOmmStore((s) => s.updateEquipment);
  const saveScenario = useOmmStore((s) => s.saveScenario);
  const loadScenario = useOmmStore((s) => s.loadScenario);
  
  // Tabs & Views state
  const [activeTab, setActiveTab] = useState<'time' | 'tanks'>('time');
  const [tankViewMode, setTankViewMode] = useState<'table' | 'grid'>('table');
  const [selectedEqId, setSelectedEqId] = useState<string | null>(null);
  
  // Time Simulator inputs
  const [manualTime, setManualTime] = useState(simulatorState.simulatedTime.substring(0, 16));
  const [simulationStartRealTime] = useState(Date.now());
  
  // Scenario inputs
  const [newScenarioName, setNewScenarioName] = useState('');
  const [selectedPredefinedScenario, setSelectedPredefinedScenario] = useState('predefined_normal');
  const [customScenarios, setCustomScenarios] = useState<any[]>([]);
  const [selectedCustomScenario, setSelectedCustomScenario] = useState('');

  // Selected tank
  const selectedTank = equipments.find(e => e.id === selectedEqId);

  // Sync date-time input when simulated time changes
  useEffect(() => {
    setManualTime(simulatorState.simulatedTime.substring(0, 16));
  }, [simulatorState.simulatedTime]);

  // Load custom scenarios on mount/save
  const refreshCustomScenarios = () => {
    const raw = localStorage.getItem('omm_v2_scenarios');
    if (raw) {
      try {
        setCustomScenarios(JSON.parse(raw));
      } catch {
        setCustomScenarios([]);
      }
    }
  };

  useEffect(() => {
    refreshCustomScenarios();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTimeChangeSubmit = () => {
    try {
      const iso = new Date(manualTime).toISOString();
      setSimulatedTime(iso);
    } catch {
      alert('Data/Hora inválida');
    }
  };

  const handleResetClock = () => {
    setSimulatedTime(new Date().toISOString());
  };

  const handleSaveScenarioClick = () => {
    if (!newScenarioName.trim()) {
      alert('Informe um nome para o cenário');
      return;
    }
    saveScenario(newScenarioName);
    setNewScenarioName('');
    refreshCustomScenarios();
    alert('Cenário salvo com sucesso!');
  };

  const handleLoadScenarioClick = (id: string) => {
    if (!id) return;
    loadScenario(id);
    alert('Cenário carregado com sucesso!');
  };

  const handleEqFieldChange = (field: string, value: any) => {
    if (!selectedEqId || !selectedTank) return;
    
    // Auto-calculate variables based on physical links
    if (field === 'currentLevel') {
      const level = Math.max(0, Math.min(100, Number(value)));
      const volume = (selectedTank.capacity * level) / 100;
      const mass = (volume * (selectedTank.density || 850)) / 1000;
      updateEquipment(selectedEqId, {
        currentLevel: level,
        currentVolume: volume,
        currentMass: mass
      });
    } else if (field === 'currentVolume') {
      const volume = Math.max(0, Math.min(selectedTank.capacity, Number(value)));
      const level = (volume / selectedTank.capacity) * 100;
      const mass = (volume * (selectedTank.density || 850)) / 1000;
      updateEquipment(selectedEqId, {
        currentLevel: level,
        currentVolume: volume,
        currentMass: mass
      });
    } else {
      updateEquipment(selectedEqId, { [field]: value });
    }
  };

  const handleToggleAutoMode = () => {
    if (!selectedEqId || !selectedTank) return;
    const nextMode = selectedTank.simMode === 'auto' ? 'manual' : 'auto';
    
    // Initialize default configs if enabling auto mode
    const defaultAutoConfig = selectedTank.autoConfig || {
      level: { type: 'sine', min: 10, max: 90, period: 60, step: 1 },
      temperature: { type: 'noise', min: 15, max: 40, period: 30, step: 0.5 },
      pressure: { type: 'noise', min: 0.2, max: 2.5, period: 30, step: 0.1 },
      density: { type: 'oscillation', min: 700, max: 950, period: 120, step: 5 },
      flowIn: { type: 'random', min: 0, max: 500, period: 10 },
      flowOut: { type: 'random', min: 0, max: 500, period: 10 },
    };

    updateEquipment(selectedEqId, {
      simMode: nextMode,
      autoConfig: defaultAutoConfig
    });
  };

  const handleAutoConfigVarChange = (variable: string, field: string, val: any) => {
    if (!selectedEqId || !selectedTank || !selectedTank.autoConfig) return;
    
    const currentVarConfig = (selectedTank.autoConfig as any)[variable] || { type: 'sine', min: 0, max: 100, period: 60 };
    const updatedVarConfig = { ...currentVarConfig, [field]: val };
    
    updateEquipment(selectedEqId, {
      autoConfig: {
        ...selectedTank.autoConfig,
        [variable]: updatedVarConfig
      }
    });
  };

  // Forecast lists
  const upcomingMovements = movements
    .filter(m => m.status === 'Issued')
    .sort((a, b) => new Date(a.plannedStartAt || '').getTime() - new Date(b.plannedStartAt || '').getTime())
    .slice(0, 5);

  const endingMovements = movements
    .filter(m => m.status === 'Active')
    .sort((a, b) => new Date(a.etoc || '').getTime() - new Date(b.etoc || '').getTime())
    .slice(0, 5);

  // Time elapsed in simulation
  const simElapsedTime = () => {
    const diffMs = Date.now() - simulationStartRealTime;
    const acceleratedMs = diffMs * simulatorState.speedMultiplier;
    
    const secs = Math.floor((acceleratedMs / 1000) % 60);
    const mins = Math.floor((acceleratedMs / 60000) % 60);
    const hrs = Math.floor(acceleratedMs / 3600000);
    
    return `${hrs}h ${mins}m ${secs}s`;
  };

  // Predefined scenario config descriptions
  const PREDEFINED_SCENARIOS = [
    { id: 'predefined_normal', label: 'Operação Normal', desc: 'Configuração estável com níveis normais e fluxos atenuados.' },
    { id: 'predefined_shutdown', label: 'Parada da Planta', desc: 'Desativa todos os fluxos e aproxima as temperaturas e pressões das condições ambientais.' },
    { id: 'predefined_max_prod', label: 'Produção Máxima', desc: 'Níveis de tanques elevados, pressões altas e vazões de entrada próximas da capacidade máxima.' },
    { id: 'predefined_transfer', label: 'Transferência entre Tanques', desc: 'Sinaliza transferência direta ativa entre os tanques TQ-101 e TQ-102.' },
    { id: 'predefined_road_load', label: 'Carregamento Rodoviário', desc: 'Simula vazão de saída contínua do TQ-101 para plataforma de caminhões.' },
    { id: 'predefined_marine_load', label: 'Carregamento Marítimo', desc: 'Simula vazão de saída contínua de petróleo do TQ-103 para navio no Píer.' },
    { id: 'predefined_instrument_fail', label: 'Falha de Instrumentação', desc: 'Simula congelamento do sinal de vazão/nível do TQ-101.' },
    { id: 'predefined_opc_loss', label: 'Perda de Comunicação OPC', desc: 'Provoca desconexão simulada do medidor OPC do TQ-101 disparando alarmes.' },
    { id: 'predefined_emergency', label: 'Situação de Emergência', desc: 'Força alarmes críticos de nível alto, sobrepressão e superaquecimento nos tanques.' }
  ];

  // Helper to calculate trends for a tank
  const getTankTrend = (eq: OmmEquipment) => {
    // Sum flows from active movements
    const movementsIn = movements.filter(m => m.status === 'Active' && m.destinationId === eq.id && !m.simPaused);
    const movementsOut = movements.filter(m => m.status === 'Active' && m.originId === eq.id && !m.simPaused);
    
    const movInFlow = movementsIn.reduce((acc, m) => acc + (m.simFlowRate * m.simSpeedMultiplier), 0);
    const movOutFlow = movementsOut.reduce((acc, m) => acc + (m.simFlowRate * m.simSpeedMultiplier), 0);
    
    const netFlow = (movInFlow + (eq.flowIn || 0)) - (movOutFlow + (eq.flowOut || 0));
    return {
      net: netFlow,
      in: movInFlow + (eq.flowIn || 0),
      out: movOutFlow + (eq.flowOut || 0)
    };
  };

  const getDayOfWeek = (isoString: string) => {
    try {
      const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      return days[new Date(isoString).getDay()];
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-[90vw] h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">Centro Avançado de Simulação OMM</h2>
              <p className="text-[10px] text-slate-400">Controle o relógio virtual, crie cenários complexos e simule dinâmicas físicas em tempo real</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Clock Widget */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">
              <div className={`w-2 h-2 rounded-full ${simulatorState.isRunning ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
              <span className="text-[11px] font-bold font-mono text-slate-300">
                {new Date(simulatorState.simulatedTime).toLocaleTimeString('pt-BR')}
              </span>
              <span className="text-[9px] font-bold bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded-md">
                {simulatorState.speedMultiplier}x
              </span>
            </div>

            <button onClick={onClose} className="p-2 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-slate-800 bg-slate-900/60 shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('time')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                activeTab === 'time'
                  ? 'bg-sky-600 border-sky-600 text-white shadow-lg shadow-sky-600/10'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Simulador de Tempo</span>
            </button>

            <button
              onClick={() => setActiveTab('tanks')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                activeTab === 'tanks'
                  ? 'bg-sky-600 border-sky-600 text-white shadow-lg shadow-sky-600/10'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Simulador de Tanques</span>
            </button>
          </div>

          <div className="text-[10px] text-slate-500 font-mono">
            Relógio Ativo: {getDayOfWeek(simulatorState.simulatedTime)}, {new Date(simulatorState.simulatedTime).toLocaleDateString('pt-BR')}
          </div>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-hidden flex bg-slate-950/10">
          {activeTab === 'time' ? (
            /* TIME SIMULATOR TAB */
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Clock controls */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Big Digital Clock Card */}
                <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between h-[280px]">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Clock className="w-48 h-48 text-white" />
                  </div>

                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Relógio Virtual Independente</span>
                      <h1 className="text-white text-5xl font-extrabold font-mono tracking-tight mt-1">
                        {new Date(simulatorState.simulatedTime).toLocaleTimeString('pt-BR')}
                      </h1>
                      <p className="text-slate-400 text-xs mt-1.5 font-bold">
                        {getDayOfWeek(simulatorState.simulatedTime)}, {new Date(simulatorState.simulatedTime).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    <div className="px-3 py-1 bg-slate-800 rounded-lg text-right">
                      <span className="block text-[8px] font-bold text-slate-500 uppercase">Aceleração</span>
                      <span className="font-mono text-sm font-bold text-sky-400">{simulatorState.speedMultiplier}x real</span>
                    </div>
                  </div>

                  {/* Play, Pause, Speed Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
                    <div>
                      <span className="block text-[9px] font-bold text-slate-500 uppercase mb-2">Controles Operacionais</span>
                      <div className="flex gap-2">
                        <button
                          onClick={toggleSimulator}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer ${
                            simulatorState.isRunning
                              ? 'bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/10'
                              : 'bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/10'
                          }`}
                        >
                          {simulatorState.isRunning ? (
                            <>
                              <Pause className="w-4 h-4" /> Pausar
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" /> Iniciar
                            </>
                          )}
                        </button>

                        <button
                          onClick={handleResetClock}
                          title="Resetar para a hora atual"
                          className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[9px] font-bold text-slate-500 uppercase mb-2">Fator de Velocidade</span>
                      <div className="flex gap-2">
                        <select
                          value={simulatorState.speedMultiplier}
                          onChange={(e) => setSimulatorSpeed(Number(e.target.value))}
                          className="flex-1 px-3 py-2.5 bg-slate-800 border border-slate-750 rounded-xl text-xs font-bold text-white outline-none cursor-pointer"
                        >
                          <option value="1">1x (Tempo Real)</option>
                          <option value="2">2x</option>
                          <option value="5">5x</option>
                          <option value="10">10x</option>
                          <option value="30">30x</option>
                          <option value="60">60x (1min/s)</option>
                          <option value="100">100x</option>
                          <option value="500">500x</option>
                          <option value="1000">1000x</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instant jump date selector */}
                <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                  <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-500">Posicionar Relógio Manualmente</span>
                  <div className="flex gap-2">
                    <input
                      type="datetime-local"
                      value={manualTime}
                      onChange={(e) => setManualTime(e.target.value)}
                      className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs outline-none font-mono text-white"
                    />
                    <button
                      onClick={handleTimeChangeSubmit}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-sky-600/10"
                    >
                      Posicionar
                    </button>
                  </div>
                </div>

                {/* Time Step buttons */}
                <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5">
                  <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-3">Avanço & Retrocesso Manual</span>
                  
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="w-full text-[9px] font-bold text-slate-500 uppercase">Recuar</span>
                      <button onClick={() => stepSimulationTime(-1/60)} className="px-2 py-1.5 bg-slate-800/60 hover:bg-slate-800 rounded-lg text-[10px] font-bold">-1s</button>
                      <button onClick={() => stepSimulationTime(-1)} className="px-2 py-1.5 bg-slate-800/60 hover:bg-slate-800 rounded-lg text-[10px] font-bold">-1m</button>
                      <button onClick={() => stepSimulationTime(-5)} className="px-2 py-1.5 bg-slate-800/60 hover:bg-slate-800 rounded-lg text-[10px] font-bold">-5m</button>
                      <button onClick={() => stepSimulationTime(-15)} className="px-2 py-1.5 bg-slate-800/60 hover:bg-slate-800 rounded-lg text-[10px] font-bold">-15m</button>
                      <button onClick={() => stepSimulationTime(-30)} className="px-2 py-1.5 bg-slate-800/60 hover:bg-slate-800 rounded-lg text-[10px] font-bold">-30m</button>
                      <button onClick={() => stepSimulationTime(-60)} className="px-2 py-1.5 bg-slate-800/60 hover:bg-slate-800 rounded-lg text-[10px] font-bold">-1h</button>
                      <button onClick={() => stepSimulationTime(-360)} className="px-2 py-1.5 bg-slate-800/60 hover:bg-slate-800 rounded-lg text-[10px] font-bold">-6h</button>
                      <button onClick={() => stepSimulationTime(-720)} className="px-2 py-1.5 bg-slate-800/60 hover:bg-slate-800 rounded-lg text-[10px] font-bold">-12h</button>
                      <button onClick={() => stepSimulationTime(-1440)} className="px-2 py-1.5 bg-slate-800/60 hover:bg-slate-800 rounded-lg text-[10px] font-bold">-1d</button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      <span className="w-full text-[9px] font-bold text-slate-500 uppercase">Avançar</span>
                      <button onClick={() => stepSimulationTime(1/60)} className="px-2 py-1.5 bg-sky-900/20 hover:bg-sky-900/40 text-sky-300 rounded-lg text-[10px] font-bold">+1s</button>
                      <button onClick={() => stepSimulationTime(1)} className="px-2 py-1.5 bg-sky-900/20 hover:bg-sky-900/40 text-sky-300 rounded-lg text-[10px] font-bold">+1m</button>
                      <button onClick={() => stepSimulationTime(5)} className="px-2 py-1.5 bg-sky-900/20 hover:bg-sky-900/40 text-sky-300 rounded-lg text-[10px] font-bold">+5m</button>
                      <button onClick={() => stepSimulationTime(15)} className="px-2 py-1.5 bg-sky-900/20 hover:bg-sky-900/40 text-sky-300 rounded-lg text-[10px] font-bold">+15m</button>
                      <button onClick={() => stepSimulationTime(30)} className="px-2 py-1.5 bg-sky-900/20 hover:bg-sky-900/40 text-sky-300 rounded-lg text-[10px] font-bold">+30m</button>
                      <button onClick={() => stepSimulationTime(60)} className="px-2 py-1.5 bg-sky-900/20 hover:bg-sky-900/40 text-sky-300 rounded-lg text-[10px] font-bold">+1h</button>
                      <button onClick={() => stepSimulationTime(360)} className="px-2 py-1.5 bg-sky-900/20 hover:bg-sky-900/40 text-sky-300 rounded-lg text-[10px] font-bold">+6h</button>
                      <button onClick={() => stepSimulationTime(720)} className="px-2 py-1.5 bg-sky-900/20 hover:bg-sky-900/40 text-sky-300 rounded-lg text-[10px] font-bold">+12h</button>
                      <button onClick={() => stepSimulationTime(1440)} className="px-2 py-1.5 bg-sky-900/20 hover:bg-sky-900/40 text-sky-300 rounded-lg text-[10px] font-bold">+1d</button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Time forecasts and metrics */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Simulation stats */}
                <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                  <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-500">Métricas Operacionais</span>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Tempo Transcorrido</span>
                      <span className="text-sm font-bold font-mono text-white mt-1 block">{simElapsedTime()}</span>
                    </div>

                    <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Próximo Cut-off</span>
                      <span className="text-sm font-bold font-mono text-white mt-1 block">
                        {simulatorState.nextCutoffAt ? new Date(simulatorState.nextCutoffAt).toLocaleTimeString('pt-BR') : 'Amanhã 01:00'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Upcoming Movements */}
                <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Próximos Movimentos Previstos</span>
                    <span className="px-2 py-0.5 text-[8px] font-bold bg-amber-500/10 text-amber-400 rounded-full">Programados</span>
                  </div>

                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {upcomingMovements.length === 0 ? (
                      <div className="text-center py-6 text-[11px] text-slate-500">Nenhum movimento agendado</div>
                    ) : (
                      upcomingMovements.map(m => (
                        <div key={m.id} className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                          <div>
                            <span className="font-mono text-[10px] font-bold text-slate-300">{m.number}</span>
                            <span className="text-[9px] text-slate-500 block">{m.type} · {products.find(p => p.id === m.productId)?.name || 'Sem prod.'}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] font-bold text-slate-400 block">Prev. Início</span>
                            <span className="text-[10px] font-bold font-mono text-sky-400">
                              {m.plannedStartAt ? new Date(m.plannedStartAt).toLocaleTimeString('pt-BR') : 'N/D'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Ending Movements */}
                <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Términos Previstos de Movimentos</span>
                    <span className="px-2 py-0.5 text-[8px] font-bold bg-emerald-500/10 text-emerald-400 rounded-full">Ativos</span>
                  </div>

                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {endingMovements.length === 0 ? (
                      <div className="text-center py-6 text-[11px] text-slate-500">Nenhum movimento ativo na simulação</div>
                    ) : (
                      endingMovements.map(m => (
                        <div key={m.id} className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                          <div>
                            <span className="font-mono text-[10px] font-bold text-slate-300">{m.number}</span>
                            <span className="text-[9px] text-slate-500 block">{m.percentComplete.toFixed(1)}% concluído</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] font-bold text-slate-400 block">Fim Estimado</span>
                            <span className="text-[10px] font-bold font-mono text-emerald-400">
                              {m.etoc ? new Date(m.etoc).toLocaleTimeString('pt-BR') : 'N/D'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            /* TANKS SIMULATOR TAB */
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              
              {/* Main Content Area: Table/Grid + Scenarios */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
                
                {/* Scenarios Panel */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shrink-0">
                  <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-500">Gerenciador de Cenários Operacionais</span>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Preconfigured */}
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase mb-1">Cenários de Fábrica (Predefinidos)</span>
                        <select
                          value={selectedPredefinedScenario}
                          onChange={(e) => setSelectedPredefinedScenario(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs font-bold text-white outline-none cursor-pointer"
                        >
                          {PREDEFINED_SCENARIOS.map(s => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                        </select>
                        <p className="text-[9px] text-slate-400 mt-2 italic leading-relaxed">
                          {PREDEFINED_SCENARIOS.find(s => s.id === selectedPredefinedScenario)?.desc}
                        </p>
                      </div>

                      <button
                        onClick={() => handleLoadScenarioClick(selectedPredefinedScenario)}
                        className="w-full mt-4 flex items-center justify-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-sky-600/10"
                      >
                        <UploadCloud className="w-3.5 h-3.5" /> Carregar Cenário
                      </button>
                    </div>

                    {/* Custom */}
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase mb-1.5">Salvar Estado Atual como Cenário</span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Nome do cenário..."
                            value={newScenarioName}
                            onChange={(e) => setNewScenarioName(e.target.value)}
                            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs outline-none text-white font-medium"
                          />
                          <button
                            onClick={handleSaveScenarioClick}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-600/10"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        </div>

                        <span className="text-[9px] text-slate-400 font-bold block uppercase mt-4 mb-1">Meus Cenários Customizados</span>
                        <select
                          value={selectedCustomScenario}
                          onChange={(e) => setSelectedCustomScenario(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs font-bold text-white outline-none cursor-pointer"
                        >
                          <option value="">Selecione...</option>
                          {customScenarios.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({new Date(s.simulatedTime).toLocaleTimeString()})</option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => handleLoadScenarioClick(selectedCustomScenario)}
                        disabled={!selectedCustomScenario}
                        className="w-full mt-4 flex items-center justify-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-sky-600/10 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <UploadCloud className="w-3.5 h-3.5" /> Restaurar Cenário Customizado
                      </button>
                    </div>
                  </div>
                </div>

                {/* View toggles & list */}
                <div className="flex-1 overflow-hidden flex flex-col min-h-[300px]">
                  
                  {/* Subheader view selector */}
                  <div className="flex justify-between items-center mb-3 shrink-0">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Base de Equipamentos Cadastrados</span>
                    
                    <div className="flex bg-slate-900 rounded-xl p-0.5 border border-slate-800">
                      <button
                        onClick={() => setTankViewMode('table')}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${tankViewMode === 'table' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        <Table className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setTankViewMode('grid')}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${tankViewMode === 'grid' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* List View Container */}
                  <div className="flex-1 overflow-y-auto">
                    {tankViewMode === 'table' ? (
                      /* Table view mode */
                      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/30">
                        <table className="w-full text-left border-collapse text-[10px]">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-500 bg-slate-900/70 font-semibold uppercase">
                              <th className="px-3 py-2.5">Tag</th>
                              <th className="px-3 py-2.5">Nome</th>
                              <th className="px-3 py-2.5">Produto</th>
                              <th className="px-3 py-2.5 text-right">Capacidade</th>
                              <th className="px-3 py-2.5 text-right">Volume</th>
                              <th className="px-3 py-2.5 text-right">Nível (%)</th>
                              <th className="px-3 py-2.5 text-right">Temp (°C)</th>
                              <th className="px-3 py-2.5 text-right">Pressão (kgf)</th>
                              <th className="px-3 py-2.5 text-right">Vazão Entr.</th>
                              <th className="px-3 py-2.5 text-right">Vazão Saíd.</th>
                              <th className="px-3 py-2.5 text-center">Estado</th>
                              <th className="px-3 py-2.5 text-center">Alarme</th>
                            </tr>
                          </thead>
                          <tbody>
                            {equipments.map(eq => {
                              const product = products.find(p => p.id === eq.productId);
                              const isSelected = selectedEqId === eq.id;
                              const trends = getTankTrend(eq);
                              const hasAlarms = alarms.some(a => a.equipmentId === eq.id && a.isActive);
                              
                              return (
                                <tr
                                  key={eq.id}
                                  onClick={() => setSelectedEqId(eq.id)}
                                  className={`border-b border-slate-850 hover:bg-slate-800/40 cursor-pointer transition-all ${
                                    isSelected ? 'bg-sky-500/10 text-white font-bold border-l-4 border-l-sky-500' : 'text-slate-300'
                                  }`}
                                >
                                  <td className="px-3 py-2 font-mono font-bold text-sky-400">{eq.tag}</td>
                                  <td className="px-3 py-2 truncate max-w-[120px]" title={eq.name}>{eq.name}</td>
                                  <td className="px-3 py-2">
                                    {product ? (
                                      <span className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: product.color }} />
                                        {product.code}
                                      </span>
                                    ) : 'Vazio'}
                                  </td>
                                  <td className="px-3 py-2 text-right font-mono">{eq.capacity.toFixed(0)} m³</td>
                                  <td className="px-3 py-2 text-right font-mono">{(eq.currentVolume || 0).toFixed(0)} m³</td>
                                  <td className="px-3 py-2 text-right font-mono">{(eq.currentLevel || 0).toFixed(1)}%</td>
                                  <td className="px-3 py-2 text-right font-mono">{(eq.temperature || 0).toFixed(1)}°C</td>
                                  <td className="px-3 py-2 text-right font-mono">{(eq.pressure || 0).toFixed(2)}</td>
                                  <td className="px-3 py-2 text-right text-emerald-400 font-bold font-mono">
                                    {trends.in > 0 ? `+${trends.in.toFixed(0)}` : '0'}
                                  </td>
                                  <td className="px-3 py-2 text-right text-amber-500 font-bold font-mono">
                                    {trends.out > 0 ? `-${trends.out.toFixed(0)}` : '0'}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    {eq.isSending || eq.isReceiving ? (
                                      <span className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-500/10 text-emerald-400 font-bold uppercase">Ativo</span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 rounded text-[8px] bg-slate-800 text-slate-400 font-semibold uppercase">Ocioso</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    {hasAlarms ? (
                                      <span className="inline-flex p-1 rounded-full bg-rose-500/10 text-rose-500 animate-pulse">
                                        <ShieldAlert className="w-3.5 h-3.5" />
                                      </span>
                                    ) : (
                                      <span className="text-slate-600">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      /* Grid Operational view mode */
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                        {equipments.map(eq => {
                          const isSelected = selectedEqId === eq.id;
                          const product = products.find(p => p.id === eq.productId);
                          const trends = getTankTrend(eq);
                          const hasAlarms = alarms.some(a => a.equipmentId === eq.id && a.isActive);

                          // Calculations for TTF (time to full) and TTE (time to empty)
                          let timeEstimateText = 'Estável';
                          let estimateColor = 'text-slate-400';

                          if (trends.net > 0 && eq.capacity > 0) {
                            const remVol = eq.capacity - eq.currentVolume;
                            const ttfHrs = remVol / trends.net;
                            if (ttfHrs < 1) {
                              timeEstimateText = `Cheio em ${(ttfHrs * 60).toFixed(0)}min`;
                              estimateColor = 'text-amber-400';
                              if (eq.currentLevel >= 90) {
                                timeEstimateText = 'Risco de Transbordo!';
                                estimateColor = 'text-rose-500 animate-pulse font-bold';
                              }
                            } else {
                              timeEstimateText = `Cheio em ${ttfHrs.toFixed(1)}h`;
                              estimateColor = 'text-emerald-400';
                            }
                          } else if (trends.net < 0) {
                            const tteHrs = eq.currentVolume / Math.abs(trends.net);
                            if (tteHrs < 1) {
                              timeEstimateText = `Vazio em ${(tteHrs * 60).toFixed(0)}min`;
                              estimateColor = 'text-amber-500';
                            } else {
                              timeEstimateText = `Vazio em ${tteHrs.toFixed(1)}h`;
                              estimateColor = 'text-amber-500';
                            }
                          }

                          return (
                            <div
                              key={eq.id}
                              onClick={() => setSelectedEqId(eq.id)}
                              className={`bg-slate-900 border rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between h-[160px] ${
                                isSelected ? 'border-sky-500 ring-1 ring-sky-500/20' : 'border-slate-800'
                              } ${hasAlarms ? 'border-l-4 border-l-rose-500' : ''}`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-mono text-xs font-bold text-white block">{eq.tag}</span>
                                  <span className="text-[8px] text-slate-400 truncate max-w-[80px] block">{eq.name}</span>
                                </div>
                                {hasAlarms && (
                                  <span className="p-1 rounded bg-rose-500/10 text-rose-500">
                                    <ShieldAlert className="w-3 h-3 animate-bounce" />
                                  </span>
                                )}
                              </div>

                              {/* Mini tank visual + parameters */}
                              <div className="flex items-center gap-3 my-2">
                                {/* Mini graphical representation */}
                                <div className="w-8 h-12 border border-slate-700 rounded bg-slate-950 relative overflow-hidden shrink-0">
                                  <div
                                    className="absolute bottom-0 left-0 right-0 transition-all duration-500 opacity-70"
                                    style={{
                                      height: `${eq.currentLevel || 0}%`,
                                      backgroundColor: eq.color || '#475569'
                                    }}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center font-mono text-[8px] font-bold text-white drop-shadow-md">
                                    {Math.round(eq.currentLevel || 0)}%
                                  </div>
                                </div>

                                <div className="flex-1 space-y-0.5">
                                  <div className="flex justify-between text-[9px]">
                                    <span className="text-slate-400">Vol:</span>
                                    <span className="font-mono font-bold text-slate-200">{(eq.currentVolume || 0).toFixed(0)}m³</span>
                                  </div>
                                  <div className="flex justify-between text-[9px]">
                                    <span className="text-slate-400">Prod:</span>
                                    <span className="font-bold text-slate-300 truncate max-w-[50px]">{product ? product.code : 'N/D'}</span>
                                  </div>
                                  <div className="flex justify-between text-[9px]">
                                    <span className="text-slate-400">Net:</span>
                                    <span className={`font-bold font-mono ${trends.net > 0 ? 'text-emerald-400' : trends.net < 0 ? 'text-amber-500' : 'text-slate-500'}`}>
                                      {trends.net > 0 ? `+${trends.net.toFixed(0)}` : trends.net < 0 ? `${trends.net.toFixed(0)}` : '0'} m³/h
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Trends footer */}
                              <div className="flex justify-between items-center border-t border-slate-800 pt-2 text-[9px]">
                                <span className="text-slate-500">Tendência:</span>
                                <span className={`font-semibold flex items-center gap-1 ${estimateColor}`}>
                                  {trends.net > 0 ? <TrendingUp className="w-3 h-3" /> : trends.net < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                                  {timeEstimateText}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Sidebar: Dynamic visual widget + adjustments */}
              <div className="w-full md:w-[350px] border-t md:border-t-0 md:border-l border-slate-850 bg-slate-900/40 overflow-y-auto p-5 space-y-6 flex flex-col">
                {selectedTank ? (
                  <>
                    {/* Header info */}
                    <div className="border-b border-slate-800 pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Visualização do Ativo</span>
                          <h3 className="text-white text-base font-bold font-mono">{selectedTank.tag}</h3>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{selectedTank.name}</p>
                        </div>
                        <button
                          onClick={handleToggleAutoMode}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${
                            selectedTank.simMode === 'auto'
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                              : 'bg-slate-800 border-slate-750 text-slate-300'
                          }`}
                        >
                          {selectedTank.simMode === 'auto' ? 'Módulo Auto' : 'Módulo Manual'}
                        </button>
                      </div>
                    </div>

                    {/* Premium graphical Widget */}
                    <div className="flex flex-col items-center py-4 bg-slate-950/40 rounded-2xl border border-slate-850/60 relative">
                      {/* Flow indicators */}
                      {selectedTank.isReceiving && (
                        <div className="absolute top-2 left-6 flex items-center gap-1 text-[8px] font-bold text-emerald-400 animate-pulse bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <TrendingUp className="w-3.5 h-3.5" /> ENTRADA
                        </div>
                      )}
                      {selectedTank.isSending && (
                        <div className="absolute top-2 right-6 flex items-center gap-1 text-[8px] font-bold text-amber-500 animate-pulse bg-amber-500/10 px-2 py-0.5 rounded-full">
                          <TrendingDown className="w-3.5 h-3.5" /> SAÍDA
                        </div>
                      )}

                      {/* Main Tank representation */}
                      <div className="w-[120px] h-[180px] border-4 border-slate-700 bg-slate-950 rounded-[20px] relative overflow-hidden flex flex-col justify-end shadow-inner">
                        
                        {/* Safe limit lines */}
                        <div className="absolute bottom-[95%] left-0 right-0 h-px bg-rose-500/40 border-dashed border-t border-rose-500/40 z-10" title="HH Level Limit" />
                        <div className="absolute bottom-[5%] left-0 right-0 h-px bg-rose-500/40 border-dashed border-t border-rose-500/40 z-10" title="LL Level Limit" />

                        {/* Level Fill */}
                        <div
                          className="w-full transition-all duration-1000 opacity-75 relative"
                          style={{
                            height: `${selectedTank.currentLevel || 0}%`,
                            backgroundColor: selectedTank.color || '#3b82f6',
                            backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.15) 100%)'
                          }}
                        >
                          {/* Ripple wave animation */}
                          <div className="absolute top-0 inset-x-0 h-1 bg-white/20 animate-pulse" />
                        </div>

                        {/* Large digital percentage overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-10">
                          <span className="font-mono text-3xl font-extrabold text-white drop-shadow-md">
                            {Math.round(selectedTank.currentLevel || 0)}%
                          </span>
                          <span className="text-[9px] font-semibold text-slate-300 drop-shadow-sm uppercase">Nível atual</span>
                        </div>
                      </div>

                      {/* Numerical details below graphic */}
                      <div className="w-full grid grid-cols-2 gap-4 px-6 mt-4 border-t border-slate-850 pt-3 text-[10px]">
                        <div className="space-y-0.5">
                          <span className="text-slate-400 block font-semibold">Volume Atual</span>
                          <span className="font-mono text-white text-xs font-bold">{(selectedTank.currentVolume || 0).toFixed(1)} m³</span>
                        </div>
                        <div className="space-y-0.5 text-right">
                          <span className="text-slate-400 block font-semibold">Massa Atual</span>
                          <span className="font-mono text-white text-xs font-bold">{(selectedTank.currentMass || 0).toFixed(1)} t</span>
                        </div>
                      </div>
                    </div>

                    {/* Mode variables editor */}
                    <div className="flex-1 space-y-4">
                      {selectedTank.simMode === 'auto' ? (
                        /* AUTOMATIC MODE VARIABLES EDIT */
                        <div className="space-y-4">
                          <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-500">Configurações de Automação</span>
                          
                          {/* Loop variables */}
                          {['level', 'temperature', 'pressure', 'density', 'flowIn', 'flowOut'].map(vName => {
                            const config = (selectedTank.autoConfig as any)?.[vName] || { type: 'sine', min: 0, max: 100, period: 60 };
                            return (
                              <div key={vName} className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 space-y-2 text-[10px]">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                                  <span className="font-bold text-slate-300 uppercase">{vName === 'flowIn' ? 'Vazão Entrada' : vName === 'flowOut' ? 'Vazão Saída' : vName}</span>
                                  <select
                                    value={config.type}
                                    onChange={(e) => handleAutoConfigVarChange(vName, 'type', e.target.value)}
                                    className="px-1.5 py-0.5 bg-slate-900 border border-slate-750 rounded text-[9px] text-white outline-none font-bold cursor-pointer"
                                  >
                                    <option value="random">Aleatório</option>
                                    <option value="ramp">Rampa</option>
                                    <option value="sine">Seno</option>
                                    <option value="triangle">Triângulo</option>
                                    <option value="sawtooth">Dente Serra</option>
                                    <option value="noise">Ruído</option>
                                    <option value="oscillation">Oscilação</option>
                                  </select>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-[9px]">
                                  <div>
                                    <span className="text-slate-400 block">Min</span>
                                    <input
                                      type="number"
                                      value={config.min}
                                      onChange={(e) => handleAutoConfigVarChange(vName, 'min', Number(e.target.value))}
                                      className="w-full px-1.5 py-0.5 bg-slate-900 border border-slate-750 rounded font-mono text-white text-center"
                                    />
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block">Max</span>
                                    <input
                                      type="number"
                                      value={config.max}
                                      onChange={(e) => handleAutoConfigVarChange(vName, 'max', Number(e.target.value))}
                                      className="w-full px-1.5 py-0.5 bg-slate-900 border border-slate-750 rounded font-mono text-white text-center"
                                    />
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block">Período</span>
                                    <input
                                      type="number"
                                      value={config.period}
                                      onChange={(e) => handleAutoConfigVarChange(vName, 'period', Number(e.target.value))}
                                      className="w-full px-1.5 py-0.5 bg-slate-900 border border-slate-750 rounded font-mono text-white text-center"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* MANUAL MODE VARIABLES EDIT */
                        <div className="space-y-4">
                          <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-500">Configurações Manuais</span>
                          
                          {/* Level slider */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-slate-400 font-bold uppercase">Nível Operacional</span>
                              <span className="font-mono text-sky-400 font-bold">{(selectedTank.currentLevel || 0).toFixed(1)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="0.5"
                              value={selectedTank.currentLevel || 0}
                              onChange={(e) => handleEqFieldChange('currentLevel', Number(e.target.value))}
                              className="w-full accent-sky-500 cursor-pointer"
                            />
                          </div>

                          {/* Volume input */}
                          <div className="space-y-1.5">
                            <span className="text-slate-400 font-bold uppercase text-[9px]">Volume / Capacidade</span>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                value={(selectedTank.currentVolume || 0).toFixed(0)}
                                onChange={(e) => handleEqFieldChange('currentVolume', Number(e.target.value))}
                                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white"
                              />
                              <span className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-xl text-[10px] font-bold font-mono">
                                / {selectedTank.capacity.toFixed(0)} m³
                              </span>
                            </div>
                          </div>

                          {/* Quick manual fill controls */}
                          <div className="space-y-1.5">
                            <span className="text-slate-400 font-bold uppercase text-[9px]">Ações Rápidas de Fluxo</span>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => handleEqFieldChange('flowIn', 250)}
                                className={`px-2 py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                                  (selectedTank.flowIn || 0) > 0
                                    ? 'bg-emerald-600 border-emerald-600 text-white font-bold'
                                    : 'bg-slate-800 border-slate-750 text-slate-300 hover:text-white'
                                }`}
                              >
                                Encher (250m³/h)
                              </button>
                              <button
                                onClick={() => handleEqFieldChange('flowOut', 250)}
                                className={`px-2 py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                                  (selectedTank.flowOut || 0) > 0
                                    ? 'bg-amber-600 border-amber-600 text-white font-bold'
                                    : 'bg-slate-800 border-slate-750 text-slate-300 hover:text-white'
                                }`}
                              >
                                Esvaziar (250m³/h)
                              </button>
                              <button
                                onClick={() => {
                                  handleEqFieldChange('flowIn', 0);
                                  handleEqFieldChange('flowOut', 0);
                                }}
                                className="col-span-2 px-2 py-1.5 bg-rose-600/10 hover:bg-rose-600 border border-rose-600/20 text-rose-400 hover:text-white rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                              >
                                Interromper Todos os Fluxos
                              </button>
                            </div>
                          </div>

                          {/* Temperature / Pressure / Density fields */}
                          <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-4 text-[10px]">
                            <div className="space-y-1">
                              <span className="text-slate-400 block font-bold uppercase">Temperatura (°C)</span>
                              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2 py-1">
                                <Thermometer className="w-3.5 h-3.5 text-slate-500 mr-1" />
                                <input
                                  type="number"
                                  value={selectedTank.temperature || 25}
                                  onChange={(e) => handleEqFieldChange('temperature', Number(e.target.value))}
                                  className="w-full bg-transparent border-none text-white outline-none font-mono text-right font-semibold"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-slate-400 block font-bold uppercase">Pressão (kgf)</span>
                              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2 py-1">
                                <Gauge className="w-3.5 h-3.5 text-slate-500 mr-1" />
                                <input
                                  type="number"
                                  value={selectedTank.pressure || 1.0}
                                  onChange={(e) => handleEqFieldChange('pressure', Number(e.target.value))}
                                  className="w-full bg-transparent border-none text-white outline-none font-mono text-right font-semibold"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <Table className="w-8 h-8 text-slate-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-400">Nenhum tanque selecionado</p>
                      <p className="text-[10px] text-slate-500 mt-1 max-w-[200px]">Clique em um equipamento na tabela ou painel ao lado para visualizar e gerenciar</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/40 shrink-0">
          <div className="text-[9px] text-slate-500 font-mono">
            Orquestra MES MVP 2 · Sistema de Simulação Integrado
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Fechar Painel
          </button>
        </div>

      </div>
    </div>
  );
};
