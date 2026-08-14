import React, { useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Sliders,
  Search,
  Activity,
  Box,
  TrendingUp,
  Shuffle,
  Clock,
  ToggleLeft,
  List,
  HelpCircle,
  Rocket,
  Filter,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { HeaderNavigation } from '../components/navigation/HeaderNavigation';
import { useObjectModelStore } from '../store/useObjectModelStore';
import { useOmmStore } from '../features/omm/store/useOmmStore';
import { inheritanceService } from '../services/InheritanceService';
import { MockConfigModal } from '../features/object-model/MockConfigModal';
import type { MergedProperty, MergedMockConfig, ObjectEntity } from '../types/domain';
import type { OmmStatus } from '../features/omm/types';
import { cn } from '../utils/cn';

interface ObjectPropertySimRow {
  object: ObjectEntity;
  originTemplateName: string;
  isDeployed: boolean;
  property: MergedProperty;
  mockConfig?: MergedMockConfig;
  liveValue: string;
  history: number[];
}

export const SimulatorPage: React.FC = () => {
  const {
    objects,
    templates,
    isSimulating,
    simulationSpeedMs,
    simulationTickCount,
    simulatedValues,
    historyValues,
    toggleSimulation,
    setSimulationSpeed,
    tickSimulation,
    openMockConfigModal,
    toggleMockConfigEnabled,
    deployObject,
    undeployObject,
    updateSimulatedValue,
    init: initObjectModelStore,
  } = useObjectModelStore();

  const {
    movements: ommMovements,
    equipments: ommEquipments,
    products: ommProducts,
    toggleMovementPause,
    setMovementFlowRate,
    changeMovementStatus,
    init: initOmmStore,
  } = useOmmStore();

  const [activeTab, setActiveTab] = useState<'properties' | 'movements'>('properties');
  const [searchTerm, setSearchTerm] = useState('');
  const [deploymentFilter, setDeploymentFilter] = useState<'all' | 'deployed' | 'undeployed'>('all');
  const [selectedObjectId, setSelectedObjectId] = useState<string>('all');
  const [changedProps, setChangedProps] = useState<Record<string, boolean>>({});
  const [prevValues, setPrevValues] = useState<Record<string, string>>({});
  const [editingFlowRates, setEditingFlowRates] = useState<Record<string, number>>({});

  useEffect(() => {
    initObjectModelStore();
    initOmmStore();
  }, [initObjectModelStore, initOmmStore]);

  // Simulation tick is handled globally by App.tsx


  // Highlight flash animation for changed values
  useEffect(() => {
    const newlyChanged: Record<string, boolean> = {};
    Object.keys(simulatedValues).forEach((key) => {
      if (prevValues[key] !== undefined && prevValues[key] !== simulatedValues[key]) {
        newlyChanged[key] = true;
      }
    });

    if (Object.keys(newlyChanged).length > 0) {
      setChangedProps(newlyChanged);
      const timer = setTimeout(() => setChangedProps({}), 600);
      setPrevValues(simulatedValues);
      return () => clearTimeout(timer);
    }
    setPrevValues(simulatedValues);
  }, [simulatedValues]);

  // Build unified property rows for all objects
  const allRows: ObjectPropertySimRow[] = [];
  objects.forEach((obj) => {
    const isDeployed = obj.isDeployed !== false;
    const originTemplate = templates.find((t) => t.id === obj.templateId);
    const props = inheritanceService.getMergedProperties(obj.id, 'instance');
    const mockConfigs = inheritanceService.getMergedMockConfigs(obj.id, 'instance', props);

    props.forEach((prop) => {
      const key = `${obj.id}:${prop.name}`;
      const mockConfig = mockConfigs.find((c) => c.propertyName === prop.name);
      const liveVal = simulatedValues[key] ?? prop.defaultValue;
      const history = historyValues[key] || [];

      allRows.push({
        object: obj,
        originTemplateName: originTemplate ? originTemplate.name : 'Template',
        isDeployed,
        property: prop,
        mockConfig,
        liveValue: liveVal,
        history,
      });
    });
  });

  // Filter property rows
  const filteredRows = allRows.filter((row) => {
    if (deploymentFilter === 'deployed' && !row.isDeployed) return false;
    if (deploymentFilter === 'undeployed' && row.isDeployed) return false;
    if (selectedObjectId !== 'all' && row.object.id !== selectedObjectId) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      row.object.name.toLowerCase().includes(term) ||
      row.originTemplateName.toLowerCase().includes(term) ||
      row.property.name.toLowerCase().includes(term) ||
      row.property.dataType.toLowerCase().includes(term) ||
      row.property.description.toLowerCase().includes(term)
    );
  });

  const totalDeployed = objects.filter((o) => o.isDeployed !== false).length;
  const activeMovementsCount = ommMovements.filter((m) => m.status === 'Active' && !m.simPaused).length;

  const renderPresetBadge = (config?: MergedMockConfig) => {
    if (!config) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 whitespace-nowrap">
          <HelpCircle className="w-3 h-3" /> Padrão
        </span>
      );
    }

    switch (config.preset) {
      case 'sine':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 whitespace-nowrap" title={`Senoidal (${config.params.min}..${config.params.max}, ${config.params.periodSeconds}s)`}>
            <TrendingUp className="w-3 h-3 text-sky-500 shrink-0" />
            <span>Senoidal ({config.params.min}..{config.params.max})</span>
          </span>
        );
      case 'range':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap" title={`Faixa (${config.params.min}..${config.params.max})`}>
            <Shuffle className="w-3 h-3 text-emerald-500 shrink-0" />
            <span>Faixa ({config.params.min}..{config.params.max})</span>
          </span>
        );
      case 'step':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 whitespace-nowrap" title={`Passo (+${config.params.step})`}>
            <Activity className="w-3 h-3 text-indigo-500 shrink-0" />
            <span>Passo (+{config.params.step})</span>
          </span>
        );
      case 'walk':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 whitespace-nowrap" title={`Ruído (${config.params.min}..${config.params.max})`}>
            <Sliders className="w-3 h-3 text-purple-500 shrink-0" />
            <span>Caminhada ({config.params.min}..{config.params.max})</span>
          </span>
        );
      case 'boolean_toggle':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 whitespace-nowrap">
            <ToggleLeft className="w-3 h-3 text-amber-500 shrink-0" />
            <span>Alternância ({config.params.mode === 'random' ? 'Aleat.' : `${config.params.toggleIntervalSec}s`})</span>
          </span>
        );
      case 'enum_list':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 whitespace-nowrap">
            <List className="w-3 h-3 text-teal-500 shrink-0" />
            <span>Lista [{config.params.options?.length || 0} opções]</span>
          </span>
        );
      case 'date_now':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 whitespace-nowrap">
            <Clock className="w-3 h-3 text-rose-500 shrink-0" />
            <span>Timestamp ISO</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 whitespace-nowrap">
            <span>Customizado</span>
          </span>
        );
    }
  };

  const renderSparkline = (history: number[]) => {
    if (!history || history.length < 2) {
      return <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800/80 rounded opacity-40" />;
    }

    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min === 0 ? 1 : max - min;
    const width = 64;
    const height = 18;

    const pathD = history
      .map((val, idx) => {
        const x = (idx / (history.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 4) - 2;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible inline-block">
        <path
          d={pathD}
          fill="none"
          stroke="#0284c7"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {history.length > 0 && (
          <circle
            cx={width}
            cy={height - ((history[history.length - 1] - min) / range) * (height - 4) - 2}
            r="2.5"
            className="fill-sky-500 animate-ping"
          />
        )}
      </svg>
    );
  };

  const getStatusBadge = (status: OmmStatus) => {
    switch (status) {
      case 'Active':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 whitespace-nowrap">● Ativo</span>;
      case 'Issued':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 whitespace-nowrap">● Emitido</span>;
      case 'Completed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800 whitespace-nowrap">● Concluído</span>;
      case 'Closed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 border border-violet-300 dark:border-violet-800 whitespace-nowrap">● Fechado</span>;
      case 'Canceled':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 whitespace-nowrap">● Cancelado</span>;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Navigation Bar */}
      <HeaderNavigation />

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Control Bar */}
        <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xs shrink-0">
          {/* Left Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Play/Pause */}
            <button
              onClick={() => toggleSimulation()}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer',
                isSimulating
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              )}
            >
              {isSimulating ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pausar Simulador</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Iniciar Simulação</span>
                </>
              )}
            </button>

            {/* Step */}
            <button
              onClick={() => tickSimulation()}
              title="Avançar um ciclo manualmente"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Passo Único</span>
            </button>

            {/* Speed Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs">
              <span className="text-slate-400 font-semibold px-1.5 text-[11px]">Velocidade:</span>
              {[
                { label: '0.5s', val: 500 },
                { label: '1s', val: 1000 },
                { label: '2s', val: 2000 },
                { label: '5s', val: 5000 },
              ].map((s) => (
                <button
                  key={s.val}
                  onClick={() => setSimulationSpeed(s.val)}
                  className={cn(
                    'px-2 py-0.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer',
                    simulationSpeedMs === s.val
                      ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Live Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/40 text-xs font-medium text-sky-700 dark:text-sky-400">
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  isSimulating ? 'bg-emerald-500 animate-ping' : 'bg-amber-400'
                )}
              />
              <span className="font-mono text-[11px] font-bold">
                {isSimulating ? 'RUNTIME ATIVO' : 'PAUSADO'} (Tick #{simulationTickCount})
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl text-[11px]">
              <Box className="w-3.5 h-3.5 text-emerald-500" />
              <span>Objetos: <strong className="text-slate-800 dark:text-slate-100">{objects.length}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-2.5 py-1 rounded-xl text-[11px] text-emerald-700 dark:text-emerald-300">
              <Rocket className="w-3.5 h-3.5 text-emerald-500" />
              <span>Deploy: <strong className="font-bold">{totalDeployed}/{objects.length}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/50 px-2.5 py-1 rounded-xl text-[11px] text-sky-700 dark:text-sky-300">
              <Activity className="w-3.5 h-3.5 text-sky-500" />
              <span>Transf. OMM Ativas: <strong className="font-bold">{activeMovementsCount}</strong></span>
            </div>
          </div>
        </div>

        {/* Global Simulator Header Tabs Banner */}
        <div className="px-4 py-2 bg-slate-200/60 dark:bg-slate-900/90 border-b border-slate-300 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('properties')}
              className={cn(
                'flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border',
                activeTab === 'properties'
                  ? 'bg-sky-600 border-sky-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              )}
            >
              <Layers className="w-4 h-4 text-sky-300" />
              <span>Propriedades dos Objetos ({allRows.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('movements')}
              className={cn(
                'flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border',
                activeTab === 'movements'
                  ? 'bg-sky-600 border-sky-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              )}
            >
              <ArrowRight className="w-4 h-4 text-sky-300" />
              <span>Movimentações OMM ({ommMovements.length})</span>
              {activeMovementsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white font-mono text-[9px] font-bold">
                  {activeMovementsCount} ativas
                </span>
              )}
            </button>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-sky-500" />
            <span>Simulador Global Único — Atualiza propriedades reais no Orquestra & OMM</span>
          </div>
        </div>

        {/* Tab 1: Object Properties View */}
        {activeTab === 'properties' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Filter and Search Subbar */}
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-semibold flex items-center gap-1 text-[11px]">
                  <Filter className="w-3 h-3" /> Status:
                </span>
                <button
                  onClick={() => setDeploymentFilter('all')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer',
                    deploymentFilter === 'all'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  )}
                >
                  Todos ({allRows.length})
                </button>
                <button
                  onClick={() => setDeploymentFilter('deployed')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors flex items-center gap-1 cursor-pointer',
                    deploymentFilter === 'deployed'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Deployados ({allRows.filter((r) => r.isDeployed).length})</span>
                </button>
                <button
                  onClick={() => setDeploymentFilter('undeployed')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors flex items-center gap-1 cursor-pointer',
                    deploymentFilter === 'undeployed'
                      ? 'bg-slate-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>Não Deployados ({allRows.filter((r) => !r.isDeployed).length})</span>
                </button>
              </div>

              {/* Object Select & Search */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <select
                  value={selectedObjectId}
                  onChange={(e) => setSelectedObjectId(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-[11px] outline-none text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <option value="all">Todos os Objetos</option>
                  {objects.map((obj) => (
                    <option key={obj.id} value={obj.id}>
                      {obj.name} ({obj.isDeployed !== false ? 'Deployed' : 'Undeployed'})
                    </option>
                  ))}
                </select>

                <div className="relative w-full sm:w-56">
                  <Search className="w-3 h-3 absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar objeto, tag ou prop..."
                    className="w-full text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-2.5 py-1 outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* Compact Table View (No Line Breaks) */}
            <div className="flex-1 overflow-auto p-3">
              {filteredRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                  <Sparkles className="w-10 h-10 mb-2 text-slate-300 dark:text-slate-700" />
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nenhuma propriedade encontrada
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                    Ajuste os filtros de busca para visualizar os objetos.
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
                  <table className="w-full text-left border-collapse text-[11px] whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 text-slate-500 uppercase tracking-wider font-bold text-[10px] whitespace-nowrap">
                        <th className="py-2 px-3 whitespace-nowrap">Objeto (Identificador)</th>
                        <th className="py-2 px-3 whitespace-nowrap">Propriedade / Tag</th>
                        <th className="py-2 px-3 text-center whitespace-nowrap">Deployment</th>
                        <th className="py-2 px-3 whitespace-nowrap">Valor Padrão</th>
                        <th className="py-2 px-3 text-sky-600 dark:text-sky-400 whitespace-nowrap">Valor Simulado (Live)</th>
                        <th className="py-2 px-3 whitespace-nowrap">Preset de Mock</th>
                        <th className="py-2 px-3 whitespace-nowrap">Tendência</th>
                        <th className="py-2 px-3 text-center whitespace-nowrap">Mock Ativo</th>
                        <th className="py-2 px-3 text-right whitespace-nowrap">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredRows.map((row) => {
                        const rowKey = `${row.object.id}:${row.property.name}`;
                        const isEnabled = row.mockConfig?.enabled ?? true;
                        const isChanged = changedProps[rowKey];

                        return (
                          <tr
                            key={rowKey}
                            className={cn(
                              'hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition-colors h-8 whitespace-nowrap',
                              !row.isDeployed && 'bg-slate-50/40 dark:bg-slate-950/40 opacity-70'
                            )}
                          >
                            {/* Object Identifier */}
                            <td className="py-1.5 px-3 font-semibold whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <Box
                                  className={cn(
                                    'w-3.5 h-3.5 shrink-0',
                                    row.isDeployed ? 'text-emerald-500' : 'text-slate-400'
                                  )}
                                />
                                <span
                                  className="text-slate-900 dark:text-slate-100 font-bold truncate max-w-[140px]"
                                  title={row.object.name}
                                >
                                  {row.object.name}
                                </span>
                                <span className="text-[9px] text-slate-400 font-normal px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800 truncate max-w-[90px]" title={row.originTemplateName}>
                                  {row.originTemplateName}
                                </span>
                              </div>
                            </td>

                            {/* Property / Tag Name */}
                            <td className="py-1.5 px-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-800 dark:text-slate-200" title={row.property.description || row.property.name}>
                                  {row.property.name}
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                  {row.property.dataType}
                                </span>
                              </div>
                            </td>

                            {/* Deployment Status */}
                            <td className="py-1.5 px-3 text-center whitespace-nowrap">
                              {row.isDeployed ? (
                                <button
                                  onClick={() => undeployObject(row.object.id)}
                                  title="Clique para desfazer deploy (Undeploy)"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 transition-colors cursor-pointer whitespace-nowrap"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                  <span>DEPLOYED</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => deployObject(row.object.id)}
                                  title="Clique para fazer deploy"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 transition-colors cursor-pointer whitespace-nowrap"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                  <span>UNDEPLOYED</span>
                                </button>
                              )}
                            </td>

                            {/* Default Value */}
                            <td className="py-1.5 px-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              {row.property.defaultValue || '-'}
                            </td>

                            {/* Live Value */}
                            <td className="py-1.5 px-3 whitespace-nowrap">
                              {row.isDeployed && row.property.dataType === 'Boolean' ? (
                                <button
                                  onClick={() => {
                                    const nextVal = row.liveValue === 'true' ? 'false' : 'true';
                                    updateSimulatedValue(rowKey, nextVal);
                                  }}
                                  className={cn(
                                    'inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border shadow-xs active:scale-95',
                                    row.liveValue === 'true'
                                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                  )}
                                  title="Clique para alternar o valor lógico"
                                >
                                  <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5 shrink-0', row.liveValue === 'true' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500')} />
                                  <span>{row.liveValue === 'true' ? 'ABERTO / ON' : 'FECHADO / OFF'}</span>
                                </button>
                              ) : (
                                <div
                                  className={cn(
                                    'inline-flex items-center px-2 py-0.5 rounded-lg font-mono text-[11px] font-bold transition-all duration-300 whitespace-nowrap',
                                    !row.isDeployed
                                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                      : isChanged
                                      ? 'bg-sky-500 text-white scale-105 shadow-xs'
                                      : isEnabled
                                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                  )}
                                >
                                  <span>{row.isDeployed ? row.liveValue : 'Off'}</span>
                                </div>
                              )}
                            </td>

                            {/* Preset Badge */}
                            <td className="py-1.5 px-3 whitespace-nowrap">{renderPresetBadge(row.mockConfig)}</td>

                            {/* Trend Sparkline */}
                            <td className="py-1.5 px-3 whitespace-nowrap">{renderSparkline(row.history)}</td>

                            {/* Toggle On/Off Switch */}
                            <td className="py-1.5 px-3 text-center whitespace-nowrap">
                              <button
                                onClick={() => {
                                  toggleMockConfigEnabled(row.property.name, row.object.id, 'instance');
                                }}
                                className={cn(
                                  'relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                                  isEnabled && row.isDeployed ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                                )}
                              >
                                <span
                                  className={cn(
                                    'pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out',
                                    isEnabled && row.isDeployed ? 'translate-x-3' : 'translate-x-0'
                                  )}
                                />
                              </button>
                            </td>

                            {/* Actions */}
                            <td className="py-1.5 px-3 text-right whitespace-nowrap">
                              <button
                                onClick={() => {
                                  useObjectModelStore.getState().selectEntity(row.object.id, 'instance');
                                  openMockConfigModal(row.property);
                                }}
                                className="px-2 py-0.5 rounded text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/80 border border-sky-200 dark:border-sky-800 transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                              >
                                <Sliders className="w-3 h-3" />
                                <span>Configurar</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: OMM Movements View */}
        {activeTab === 'movements' && (
          <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
            
            {/* OMM Movements Table */}
            <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-auto">
              <table className="w-full text-left border-collapse text-[11px] whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 text-slate-500 uppercase tracking-wider font-bold text-[10px] whitespace-nowrap">
                    <th className="py-2.5 px-3 whitespace-nowrap">Código / Ordem</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Descrição / Produto</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Origem → Destino</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">Vazão de Simulação (m³/h)</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Progresso (Movido / Planejado)</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">Status OMM</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">Simulação</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Ações de Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {ommMovements.map((mov) => {
                    const originEq = ommEquipments.find((e) => e.id === mov.originId);
                    const destEq = ommEquipments.find((e) => e.id === mov.destinationId);
                    const product = ommProducts.find((p) => p.id === mov.productId);
                    const currentFlowRate = editingFlowRates[mov.id] ?? mov.simFlowRate;

                    return (
                      <tr
                        key={mov.id}
                        className={cn(
                          'hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors h-10 whitespace-nowrap',
                          mov.status === 'Active' && !mov.simPaused && 'bg-sky-50/30 dark:bg-sky-950/20'
                        )}
                      >
                        {/* Number */}
                        <td className="py-2 px-3 whitespace-nowrap font-mono font-bold text-sky-600 dark:text-sky-400">
                          {mov.number}
                        </td>

                        {/* Description & Product */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]" title={mov.description}>
                            {mov.description}
                          </div>
                          {product && (
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: product.color }} />
                              <span>{product.name}</span>
                            </div>
                          )}
                        </td>

                        {/* Route */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                              {originEq?.tag || mov.originId}
                            </span>
                            <ArrowRight className="w-3 h-3 text-sky-500 shrink-0" />
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                              {destEq?.tag || mov.destinationId}
                            </span>
                          </div>
                        </td>

                        {/* Flow Rate Control */}
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              step={10}
                              value={currentFlowRate}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setEditingFlowRates((prev) => ({ ...prev, [mov.id]: val }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  setMovementFlowRate(mov.id, currentFlowRate);
                                  setEditingFlowRates((prev) => {
                                    const next = { ...prev };
                                    delete next[mov.id];
                                    return next;
                                  });
                                }
                              }}
                              className="w-16 px-1.5 py-0.5 text-[11px] font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded outline-none text-slate-900 dark:text-slate-100 text-center"
                            />
                            <button
                              onClick={() => {
                                setMovementFlowRate(mov.id, currentFlowRate);
                                setEditingFlowRates((prev) => {
                                  const next = { ...prev };
                                  delete next[mov.id];
                                  return next;
                                });
                              }}
                              className="px-1.5 py-0.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              OK
                            </button>
                          </div>
                        </td>

                        {/* Progress */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shrink-0">
                              <div
                                className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, mov.percentComplete)}%` }}
                              />
                            </div>
                            <span className="font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">
                              {mov.currentVolume.toFixed(0)} / {mov.plannedVolume.toFixed(0)} m³ ({mov.percentComplete.toFixed(1)}%)
                            </span>
                          </div>
                        </td>

                        {/* Status OMM */}
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          {getStatusBadge(mov.status)}
                        </td>

                        {/* Simulation Toggle */}
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => toggleMovementPause(mov.id)}
                            disabled={mov.status !== 'Active'}
                            className={cn(
                              'px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer border whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed',
                              mov.simPaused
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            )}
                          >
                            {mov.simPaused ? '⏸ Pausado' : '▶ Executando'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-2 px-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {mov.status === 'Issued' && (
                              <button
                                onClick={() => changeMovementStatus(mov.id, 'Active')}
                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                              >
                                Ativar
                              </button>
                            )}
                            {mov.status === 'Active' && (
                              <button
                                onClick={() => changeMovementStatus(mov.id, 'Completed')}
                                className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                              >
                                Concluir
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Mock Config Modal */}
      <MockConfigModal />
    </div>
  );
};
