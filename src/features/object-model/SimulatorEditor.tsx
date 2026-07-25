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
  HelpCircle,
} from 'lucide-react';
import { useObjectModelStore } from '../../store/useObjectModelStore';
import type { MergedMockConfig } from '../../types/domain';
import { cn } from '../../utils/cn';

export const SimulatorEditor: React.FC = () => {
  const {
    selectedEntity,
    mergedProperties,
    mergedMockConfigs,
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
  } = useObjectModelStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [changedProps, setChangedProps] = useState<Record<string, boolean>>({});
  const [prevValues, setPrevValues] = useState<Record<string, string>>({});

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


  const isTemplate = selectedEntity?.type === 'template';

  const filteredProperties = mergedProperties.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.dataType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderPresetBadge = (config?: MergedMockConfig) => {
    if (!config) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
          <HelpCircle className="w-3 h-3" /> Default
        </span>
      );
    }

    switch (config.preset) {
      case 'sine':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <TrendingUp className="w-3.5 h-3.5 text-sky-500" />
            <span>Onda Senoidal ({config.params.min}..{config.params.max}, {config.params.periodSeconds}s)</span>
          </span>
        );
      case 'range':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Shuffle className="w-3.5 h-3.5 text-emerald-500" />
            <span>Faixa ({config.params.min}..{config.params.max})</span>
          </span>
        );
      case 'step':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
            <span>Passo (+{config.params.step})</span>
          </span>
        );
      case 'walk':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Sliders className="w-3.5 h-3.5 text-purple-500" />
            <span>Caminhada Noise ({config.params.min}..{config.params.max})</span>
          </span>
        );
      case 'boolean_toggle':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <ToggleLeft className="w-3.5 h-3.5 text-amber-500" />
            <span>Alternância ({config.params.mode === 'random' ? 'Aleatório' : `${config.params.toggleIntervalSec}s`})</span>
          </span>
        );
      case 'enum_list':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            <List className="w-3.5 h-3.5 text-teal-500" />
            <span>Lista [{config.params.options?.length || 0} opções]</span>
          </span>
        );
      case 'date_now':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <Clock className="w-3.5 h-3.5 text-rose-500" />
            <span>Timestamp ISO</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            <span>Customizado</span>
          </span>
        );
    }
  };

  const renderSparkline = (propertyName: string) => {
    const points = historyValues[propertyName] || [];
    if (points.length < 2) {
      return <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded opacity-30" />;
    }

    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min === 0 ? 1 : max - min;
    const width = 80;
    const height = 24;

    const pathD = points
      .map((val, idx) => {
        const x = (idx / (points.length - 1)) * width;
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
        {points.length > 0 && (
          <circle
            cx={width}
            cy={height - ((points[points.length - 1] - min) / range) * (height - 4) - 2}
            r="3"
            className="fill-sky-500 animate-ping"
          />
        )}
      </svg>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50 dark:bg-slate-950">
      {/* Top Toolbar */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        {/* Left Status Controls */}
        <div className="flex items-center gap-3">
          {/* Play / Pause Toggle Button */}
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

          {/* Manual Step Button */}
          <button
            onClick={() => tickSimulation()}
            title="Avançar um ciclo manualmente"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Passo Único</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
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
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/40 text-xs font-medium text-sky-700 dark:text-sky-400">
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                isSimulating ? 'bg-emerald-500 animate-ping' : 'bg-amber-400'
              )}
            />
            <span>
              {isSimulating ? 'SIMULANDO' : 'PAUSADO'} (Tick #{simulationTickCount})
            </span>
          </div>
        </div>

        {/* Right Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar propriedade..."
            className="w-full text-xs bg-slate-100 dark:bg-slate-800 border-none rounded-xl pl-9 pr-3 py-2 outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Property Simulation Table */}
      <div className="flex-1 overflow-auto p-5">
        {filteredProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
            <Sparkles className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-700" />
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nenhuma propriedade encontrada
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Adicione propriedades na aba <strong>Properties</strong> para poder configurar o simulador de dados.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
                  <th className="py-3 px-4">Propriedade</th>
                  <th className="py-3 px-4">Origem / Escopo</th>
                  <th className="py-3 px-4">Valor Padrão</th>
                  <th className="py-3 px-4 text-sky-600 dark:text-sky-400">Valor Simulado (Live)</th>
                  <th className="py-3 px-4">Preset de Mock</th>
                  <th className="py-3 px-4">Tendência</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredProperties.map((prop) => {
                  const mockConfig = mergedMockConfigs.find((c) => c.propertyName === prop.name);
                  const isEnabled = mockConfig?.enabled ?? true;
                  const liveValue = simulatedValues[prop.name] ?? prop.defaultValue;
                  const isChanged = changedProps[prop.name];

                  return (
                    <tr
                      key={prop.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Property Name & Type */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <span>{prop.name}</span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {prop.dataType}
                          </span>
                        </div>
                        {prop.description && (
                          <div className="text-[11px] font-normal text-slate-400 truncate max-w-xs mt-0.5">
                            {prop.description}
                          </div>
                        )}
                      </td>

                      {/* Origin Scope */}
                      <td className="py-3.5 px-4">
                        {mockConfig?.isInherited ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-800">
                            <Layers className="w-3 h-3" />
                            <span>Template ({mockConfig.sourceTemplateName})</span>
                          </span>
                        ) : mockConfig?.isOverridden ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                            <Box className="w-3 h-3" />
                            <span>Override ({isTemplate ? 'Template' : 'Instância'})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                            <Box className="w-3 h-3" />
                            <span>{isTemplate ? 'Template' : 'Instância'}</span>
                          </span>
                        )}
                      </td>

                      {/* Static Default Value */}
                      <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                        {prop.defaultValue || '-'}
                      </td>

                      {/* Live Simulated Value */}
                      <td className="py-3.5 px-4">
                        <div
                          className={cn(
                            'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-sm font-bold shadow-xs transition-all duration-300',
                            isChanged
                              ? 'bg-sky-500 text-white scale-105 shadow-md shadow-sky-500/30'
                              : isEnabled
                              ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          )}
                        >
                          <span>{liveValue}</span>
                        </div>
                      </td>

                      {/* Mock Preset Badge */}
                      <td className="py-3.5 px-4">{renderPresetBadge(mockConfig)}</td>

                      {/* Trend Sparkline */}
                      <td className="py-3.5 px-4">{renderSparkline(prop.name)}</td>

                      {/* Toggle On/Off Switch */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => toggleMockConfigEnabled(prop.name)}
                          className={cn(
                            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                            isEnabled ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                          )}
                        >
                          <span
                            className={cn(
                              'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                              isEnabled ? 'translate-x-4' : 'translate-x-0'
                            )}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openMockConfigModal(prop)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/80 border border-sky-200 dark:border-sky-800 transition-colors flex items-center gap-1.5"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Configurar</span>
                          </button>

                          {mockConfig && !mockConfig.isInherited && (
                            <button
                              onClick={() => deleteMockConfig(prop.name)}
                              title="Remover configuração local de mock"
                              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
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
        )}
      </div>
    </div>
  );
};
