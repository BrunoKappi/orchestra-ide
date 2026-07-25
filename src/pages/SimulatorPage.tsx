import React, { useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Sliders,
  Search,
  Activity,
  Layers,
  Box,
  TrendingUp,
  Shuffle,
  Clock,
  ToggleLeft,
  List,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Rocket,
  PowerOff,
  Filter,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { HeaderNavigation } from '../components/navigation/HeaderNavigation';
import { useObjectModelStore } from '../store/useObjectModelStore';
import { inheritanceService } from '../services/InheritanceService';
import { MockConfigModal } from '../features/object-model/MockConfigModal';
import type { MergedProperty, MergedMockConfig, ObjectEntity } from '../types/domain';
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
    deleteMockConfig,
    deployObject,
    undeployObject,
    init,
  } = useObjectModelStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [deploymentFilter, setDeploymentFilter] = useState<'all' | 'deployed' | 'undeployed'>('all');
  const [selectedObjectId, setSelectedObjectId] = useState<string>('all');
  const [changedProps, setChangedProps] = useState<Record<string, boolean>>({});
  const [prevValues, setPrevValues] = useState<Record<string, string>>({});

  useEffect(() => {
    init();
  }, [init]);

  // 1-second interval timer for simulator ticker
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      tickSimulation();
    }, simulationSpeedMs);

    return () => clearInterval(interval);
  }, [isSimulating, simulationSpeedMs, tickSimulation]);

  // Flash highlight animation for changed values
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

  // Build unified rows for all objects
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

  // Filter rows
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

  const renderPresetBadge = (config?: MergedMockConfig) => {
    if (!config) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
          <HelpCircle className="w-3 h-3" /> Padrão
        </span>
      );
    }

    switch (config.preset) {
      case 'sine':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <TrendingUp className="w-3 h-3 text-sky-500" />
            <span>Senoidal ({config.params.min}..{config.params.max}, {config.params.periodSeconds}s)</span>
          </span>
        );
      case 'range':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Shuffle className="w-3 h-3 text-emerald-500" />
            <span>Faixa ({config.params.min}..{config.params.max})</span>
          </span>
        );
      case 'step':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <Activity className="w-3 h-3 text-indigo-500" />
            <span>Passo (+{config.params.step})</span>
          </span>
        );
      case 'walk':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Sliders className="w-3 h-3 text-purple-500" />
            <span>Caminhada Noise ({config.params.min}..{config.params.max})</span>
          </span>
        );
      case 'boolean_toggle':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <ToggleLeft className="w-3 h-3 text-amber-500" />
            <span>Alternância ({config.params.mode === 'random' ? 'Aleatório' : `${config.params.toggleIntervalSec}s`})</span>
          </span>
        );
      case 'enum_list':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            <List className="w-3 h-3 text-teal-500" />
            <span>Lista [{config.params.options?.length || 0} opções]</span>
          </span>
        );
      case 'date_now':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <Clock className="w-3 h-3 text-rose-500" />
            <span>Timestamp ISO</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            <span>Customizado</span>
          </span>
        );
    }
  };

  const renderSparkline = (history: number[]) => {
    if (!history || history.length < 2) {
      return <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded opacity-30" />;
    }

    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min === 0 ? 1 : max - min;
    const width = 80;
    const height = 24;

    const pathD = history
      .map((val, idx) => {
        const x = (idx / (history.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 4) - 2;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible">
        <path
          d={pathD}
          fill="none"
          stroke="#0284c7"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {history.length > 0 && (
          <circle
            cx={width}
            cy={height - ((history[history.length - 1] - min) / range) * (height - 4) - 2}
            r="3"
            className="fill-sky-500 animate-ping"
          />
        )}
      </svg>
    );
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Navigation Bar */}
      <HeaderNavigation />

      {/* Main Content Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Control Bar */}
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xs shrink-0">
          {/* Left Controls & Status */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={() => toggleSimulation()}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm',
                isSimulating
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              )}
            >
              {isSimulating ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pausar Simulador</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Iniciar Simulação</span>
                </>
              )}
            </button>

            {/* Step */}
            <button
              onClick={() => tickSimulation()}
              title="Avançar um ciclo manualmente"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Passo Único</span>
            </button>

            {/* Speed Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
              <span className="text-slate-400 font-semibold px-2">Velocidade:</span>
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
                    'px-2.5 py-1 rounded-lg font-bold transition-colors',
                    simulationSpeedMs === s.val
                      ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Live Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/40 text-xs font-medium text-sky-700 dark:text-sky-400">
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  isSimulating ? 'bg-emerald-500 animate-ping' : 'bg-amber-400'
                )}
              />
              <span>
                {isSimulating ? 'RUNTIME ATIVO' : 'PAUSADO'} (Tick #{simulationTickCount})
              </span>
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl">
              <Box className="w-4 h-4 text-emerald-500" />
              <span>Objetos Total: <strong className="text-slate-800 dark:text-slate-100">{objects.length}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-3 py-1.5 rounded-xl text-emerald-700 dark:text-emerald-300">
              <Rocket className="w-4 h-4 text-emerald-500" />
              <span>Deployados: <strong className="font-bold">{totalDeployed} / {objects.length}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/50 px-3 py-1.5 rounded-xl text-sky-700 dark:text-sky-300">
              <Activity className="w-4 h-4 text-sky-500" />
              <span>Variáveis: <strong className="font-bold">{allRows.length}</strong></span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0 text-xs">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filtrar Status:
            </span>
            <button
              onClick={() => setDeploymentFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-semibold transition-colors',
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
                'px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1',
                deploymentFilter === 'deployed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
              )}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Apenas Deployados ({allRows.filter((r) => r.isDeployed).length})</span>
            </button>
            <button
              onClick={() => setDeploymentFilter('undeployed')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1',
                deploymentFilter === 'undeployed'
                  ? 'bg-slate-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Não Deployados ({allRows.filter((r) => !r.isDeployed).length})</span>
            </button>
          </div>

          {/* Right Inputs */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Object Filter Select */}
            <select
              value={selectedObjectId}
              onChange={(e) => setSelectedObjectId(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs outline-none text-slate-700 dark:text-slate-200"
            >
              <option value="all">Todos os Objetos</option>
              {objects.map((obj) => (
                <option key={obj.id} value={obj.id}>
                  {obj.name} ({obj.isDeployed !== false ? 'Deployed' : 'Undeployed'})
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por objeto, tag ou propriedade..."
                className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Unified Table View */}
        <div className="flex-1 overflow-auto p-5">
          {filteredRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
              <Sparkles className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-700" />
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Nenhum objeto ou propriedade encontrada
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Tente ajustar os filtros de busca ou faça deploy dos objetos na aba <strong>Deployment</strong>.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
                    <th className="py-3 px-4">Objeto (Identificador)</th>
                    <th className="py-3 px-4">Propriedade / Tag</th>
                    <th className="py-3 px-4 text-center">Status Deployment</th>
                    <th className="py-3 px-4">Valor Padrão</th>
                    <th className="py-3 px-4 text-sky-600 dark:text-sky-400">Valor Simulado (Live)</th>
                    <th className="py-3 px-4">Preset de Mock</th>
                    <th className="py-3 px-4">Tendência</th>
                    <th className="py-3 px-4 text-center">Mock Ativo</th>
                    <th className="py-3 px-4 text-right">Ações</th>
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
                          'hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group',
                          !row.isDeployed && 'bg-slate-50/40 dark:bg-slate-950/40 opacity-75'
                        )}
                      >
                        {/* Object Identifier Column */}
                        <td className="py-3.5 px-4 font-semibold">
                          <div className="flex items-center gap-2">
                            <Box
                              className={cn(
                                'w-4 h-4 shrink-0',
                                row.isDeployed ? 'text-emerald-500' : 'text-slate-400'
                              )}
                            />
                            <span className="text-slate-900 dark:text-slate-100 text-xs font-bold">
                              {row.object.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800">
                              {row.originTemplateName}
                            </span>
                          </div>
                        </td>

                        {/* Property / Tag Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {row.property.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              {row.property.dataType}
                            </span>
                          </div>
                          {row.property.description && (
                            <div className="text-[11px] font-normal text-slate-400 truncate max-w-xs mt-0.5">
                              {row.property.description}
                            </div>
                          )}
                        </td>

                        {/* Deployment Status & Toggle */}
                        <td className="py-3.5 px-4 text-center">
                          {row.isDeployed ? (
                            <button
                              onClick={() => undeployObject(row.object.id)}
                              title="Clique para desfazer deploy (Undeploy)"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 hover:border-rose-300 transition-colors"
                            >
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span>DEPLOYED</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => deployObject(row.object.id)}
                              title="Clique para fazer deploy"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 hover:border-emerald-300 transition-colors"
                            >
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                              <span>UNDEPLOYED</span>
                            </button>
                          )}
                        </td>

                        {/* Static Default Value */}
                        <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                          {row.property.defaultValue || '-'}
                        </td>

                        {/* Live Simulated Value */}
                        <td className="py-3.5 px-4">
                          <div
                            className={cn(
                              'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-xs font-bold shadow-xs transition-all duration-300',
                              !row.isDeployed
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                : isChanged
                                ? 'bg-sky-500 text-white scale-105 shadow-md shadow-sky-500/30'
                                : isEnabled
                                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            )}
                          >
                            <span>{row.isDeployed ? row.liveValue : 'Off (Undeployed)'}</span>
                          </div>
                        </td>

                        {/* Mock Preset Badge */}
                        <td className="py-3.5 px-4">{renderPresetBadge(row.mockConfig)}</td>

                        {/* Trend Sparkline */}
                        <td className="py-3.5 px-4">{renderSparkline(row.history)}</td>

                        {/* Toggle On/Off Switch */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => {
                              toggleMockConfigEnabled(row.property.name, row.object.id, 'instance');
                            }}
                            className={cn(
                              'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                              isEnabled && row.isDeployed ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                            )}
                          >
                            <span
                              className={cn(
                                'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                                isEnabled && row.isDeployed ? 'translate-x-4' : 'translate-x-0'
                              )}
                            />
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                useObjectModelStore.getState().selectEntity(row.object.id, 'instance');
                                openMockConfigModal(row.property);
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/80 border border-sky-200 dark:border-sky-800 transition-colors flex items-center gap-1.5"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                              <span>Configurar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      <MockConfigModal />
    </div>
  );
};
