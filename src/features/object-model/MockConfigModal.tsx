import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Activity,
  Shuffle,
  TrendingUp,
  Clock,
  ToggleLeft,
  List,
  Sparkles,
  Check,
} from 'lucide-react';
import { useObjectModelStore } from '../../store/useObjectModelStore';
import type { MockPresetType, MockConfigParams } from '../../types/mock';
import { mockSimulationService } from '../../services/MockSimulationService';
import { cn } from '../../utils/cn';

const PRESET_OPTIONS: {
  id: MockPresetType;
  title: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  allowedDataTypes?: string[];
}[] = [
  {
    id: 'sine',
    title: 'Onda Senoidal (Sine Wave)',
    description: 'Oscila suavemente entre valor mínimo e máximo em um período definido.',
    icon: TrendingUp,
    allowedDataTypes: ['Float', 'Integer'],
  },
  {
    id: 'range',
    title: 'Faixa Aleatória (Random Range)',
    description: 'Gera valores numéricos aleatórios uniformes dentro de uma faixa.',
    icon: Shuffle,
    allowedDataTypes: ['Float', 'Integer'],
  },
  {
    id: 'step',
    title: 'Passo / Incremento (Step)',
    description: 'Incrementa o valor a cada passo até atingir o limite e reinicia.',
    icon: Activity,
    allowedDataTypes: ['Float', 'Integer'],
  },
  {
    id: 'walk',
    title: 'Caminhada Aleatória (Noise Walk)',
    description: 'Variação contínua estilo ruído/drift partindo do valor atual.',
    icon: Sliders,
    allowedDataTypes: ['Float', 'Integer'],
  },
  {
    id: 'boolean_toggle',
    title: 'Alternância Booleana',
    description: 'Alterna periodicamente ou aleatoriamente entre true e false.',
    icon: ToggleLeft,
    allowedDataTypes: ['Boolean'],
  },
  {
    id: 'enum_list',
    title: 'Lista de Opções (Enum / Text)',
    description: 'Seleciona valores de uma lista personalizada (aleatório ou sequencial).',
    icon: List,
    allowedDataTypes: ['String', 'Enum', 'Object'],
  },
  {
    id: 'date_now',
    title: 'Data / Hora Atual (ISO)',
    description: 'Gera o timestamp ISO 8601 atualizado em tempo real.',
    icon: Clock,
    allowedDataTypes: ['Date', 'String'],
  },
];

export const MockConfigModal: React.FC = () => {
  const {
    isMockModalOpen,
    editingMockProperty,
    mergedMockConfigs,
    closeMockConfigModal,
    saveMockConfig,
  } = useObjectModelStore();

  const [preset, setPreset] = useState<MockPresetType>('sine');
  const [enabled, setEnabled] = useState<boolean>(true);
  const [params, setParams] = useState<MockConfigParams>({
    min: 0,
    max: 100,
    step: 1,
    periodSeconds: 10,
    decimals: 2,
    mode: 'random',
    options: ['RUNNING', 'STOPPED', 'WARNING', 'ALARM'],
    booleanProbability: 0.5,
    toggleIntervalSec: 2,
  });

  const [optionsString, setOptionsString] = useState<string>('RUNNING, STOPPED, WARNING, ALARM');
  const [previewValue, setPreviewValue] = useState<string>('');
  const [previewTick, setPreviewTick] = useState<number>(0);

  useEffect(() => {
    if (editingMockProperty) {
      const existing = mergedMockConfigs.find(
        (m) => m.propertyName === editingMockProperty.name
      );

      if (existing) {
        setPreset(existing.preset);
        setEnabled(existing.enabled);
        setParams(existing.params || {});
        if (existing.params?.options) {
          setOptionsString(existing.params.options.join(', '));
        }
      } else {
        const def = mockSimulationService.getDefaultMockConfig(
          editingMockProperty.targetId,
          editingMockProperty.targetType,
          editingMockProperty
        );
        setPreset(def.preset);
        setEnabled(def.enabled);
        setParams(def.params || {});
        if (def.params?.options) {
          setOptionsString(def.params.options.join(', '));
        }
      }
    }
  }, [editingMockProperty, isMockModalOpen, mergedMockConfigs]);

  // Live preview ticker
  useEffect(() => {
    if (!isMockModalOpen || !editingMockProperty) return;

    const interval = setInterval(() => {
      setPreviewTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isMockModalOpen, editingMockProperty]);

  useEffect(() => {
    if (!editingMockProperty) return;
    const tempConfig = {
      id: 'preview',
      targetId: 'preview',
      targetType: editingMockProperty.targetType,
      propertyName: editingMockProperty.name,
      enabled: true,
      preset,
      params: {
        ...params,
        options: optionsString.split(',').map((s) => s.trim()).filter(Boolean),
      },
      createdAt: '',
      updatedAt: '',
    };

    const val = mockSimulationService.generateSimulatedValue(
      tempConfig,
      previewTick,
      previewValue || editingMockProperty.defaultValue
    );
    setPreviewValue(val);
  }, [preset, params, optionsString, previewTick]);

  if (!isMockModalOpen || !editingMockProperty) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedOptions = optionsString
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    saveMockConfig({
      propertyName: editingMockProperty.name,
      enabled,
      preset,
      params: {
        ...params,
        options: parsedOptions.length > 0 ? parsedOptions : undefined,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center border border-sky-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Configurar Mock: {editingMockProperty.name}</span>
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {editingMockProperty.dataType}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Defina como os dados simulados serão gerados para esta variável.
              </p>
            </div>
          </div>
          <button
            onClick={closeMockConfigModal}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Switch */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <div>
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Ativar Simulação
              </label>
              <span className="text-[11px] text-slate-500">
                Habilita a geração contínua de valores simulados a cada segundo.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                enabled ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  enabled ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          {/* Preset Selector Grid */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5 block">
              Preset de Geração
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESET_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = preset === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPreset(opt.id)}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-150 relative',
                      isSelected
                        ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 text-sky-950 dark:text-sky-100 ring-2 ring-sky-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                        isSelected
                          ? 'bg-sky-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="text-xs font-bold truncate">{opt.title}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                        {opt.description}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Parameters Form */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Parâmetros do Preset ({preset})
            </h4>

            {(preset === 'sine' || preset === 'range' || preset === 'step' || preset === 'walk') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                    Valor Mínimo (Min)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={params.min ?? 0}
                    onChange={(e) => setParams({ ...params, min: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                    Valor Máximo (Max)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={params.max ?? 100}
                    onChange={(e) => setParams({ ...params, max: parseFloat(e.target.value) || 100 })}
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            )}

            {preset === 'sine' && (
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                  Período da Onda (Segundos)
                </label>
                <input
                  type="number"
                  min="1"
                  value={params.periodSeconds ?? 10}
                  onChange={(e) => setParams({ ...params, periodSeconds: parseInt(e.target.value) || 10 })}
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
                />
              </div>
            )}

            {(preset === 'step' || preset === 'walk') && (
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                  Passo de Incremento / Delta
                </label>
                <input
                  type="number"
                  step="any"
                  value={params.step ?? 1}
                  onChange={(e) => setParams({ ...params, step: parseFloat(e.target.value) || 1 })}
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
                />
              </div>
            )}

            {(preset === 'sine' || preset === 'range' || preset === 'step' || preset === 'walk') && (
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                  Casas Decimais
                </label>
                <input
                  type="number"
                  min="0"
                  max="6"
                  value={params.decimals ?? 2}
                  onChange={(e) => setParams({ ...params, decimals: parseInt(e.target.value) || 0 })}
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
                />
              </div>
            )}

            {preset === 'boolean_toggle' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                    Modo de Alternância
                  </label>
                  <select
                    value={params.mode || 'periodic'}
                    onChange={(e) => setParams({ ...params, mode: e.target.value as any })}
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
                  >
                    <option value="periodic">Periódico (A cada N segundos)</option>
                    <option value="random">Aleatório (Probabilidade)</option>
                  </select>
                </div>
                {params.mode === 'random' ? (
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                      Probabilidade de 'true' (0..1)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={params.booleanProbability ?? 0.5}
                      onChange={(e) => setParams({ ...params, booleanProbability: parseFloat(e.target.value) || 0.5 })}
                      className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                      Intervalo (Segundos)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={params.toggleIntervalSec ?? 2}
                      onChange={(e) => setParams({ ...params, toggleIntervalSec: parseInt(e.target.value) || 1 })}
                      className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
                    />
                  </div>
                )}
              </div>
            )}

            {preset === 'enum_list' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                    Opções (Separadas por Vírgula)
                  </label>
                  <input
                    type="text"
                    value={optionsString}
                    onChange={(e) => setOptionsString(e.target.value)}
                    placeholder="RUNNING, STOPPED, WARNING, ALARM"
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                    Modo de Seleção
                  </label>
                  <select
                    value={params.mode || 'random'}
                    onChange={(e) => setParams({ ...params, mode: e.target.value as any })}
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
                  >
                    <option value="random">Aleatório</option>
                    <option value="sequential">Sequencial (Ciclo)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Live Preview Box */}
          <div className="p-4 bg-sky-500/5 dark:bg-sky-950/40 rounded-xl border border-sky-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <div>
                <span className="text-[11px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider">
                  Live Preview (Tempo Real):
                </span>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Gerando a cada 1s...
                </div>
              </div>
            </div>
            <div className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-sky-500/30 text-sm font-mono font-bold text-sky-600 dark:text-sky-400 shadow-xs">
              {previewValue}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeMockConfigModal}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-md shadow-sky-600/20 transition-all"
            >
              Salvar Mock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
