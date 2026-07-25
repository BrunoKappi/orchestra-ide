import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Save, Clock, Database,
  Activity, Info, Trash2
} from 'lucide-react';
import { useObjectModelStore } from '../../store/useObjectModelStore';
import { Modal } from '../../components/ui/Modal';
import type { PropertyHistoryConfig } from '../../types/domain';
import { historyEngine } from '../../services/HistoryEngine';
import { cn } from '../../utils/cn';

const DEFAULT_CONFIG: PropertyHistoryConfig = {
  enabled: false,
  collectionMode: 'interval',
  intervalMs: 5000,
  retentionMs: 86400000,   // 24 h
  maxSamples: 10000,
  deadband: 0,
  compression: false,
  engineeringUnit: '',
  notes: '',
};

function msToHours(ms: number): number {
  return Math.round(ms / 3_600_000);
}
function hoursToMs(h: number): number {
  return h * 3_600_000;
}

export const HistoryConfigModal: React.FC = () => {
  const {
    isHistoryConfigModalOpen,
    editingHistoryProperty,
    selectedEntity,
    closeHistoryConfigModal,
    saveHistoryConfig,
  } = useObjectModelStore();

  const [config, setConfig] = useState<PropertyHistoryConfig>({ ...DEFAULT_CONFIG });
  const [sampleCount, setSampleCount] = useState(0);

  useEffect(() => {
    if (editingHistoryProperty && isHistoryConfigModalOpen) {
      const saved = editingHistoryProperty.historyConfig;
      setConfig(saved ? { ...saved } : { ...DEFAULT_CONFIG });

      // Count existing samples
      if (selectedEntity) {
        const samples = historyEngine.query({
          objectId: selectedEntity.type === 'instance' ? selectedEntity.id : undefined,
          propertyId: editingHistoryProperty.id,
        });
        setSampleCount(samples.length);
      }
    }
  }, [editingHistoryProperty, isHistoryConfigModalOpen, selectedEntity]);

  if (!editingHistoryProperty) return null;

  const handleSave = () => {
    saveHistoryConfig(
      editingHistoryProperty.name,
      config,
      selectedEntity?.id,
      selectedEntity?.type
    );
  };

  const handleClearHistory = () => {
    if (!selectedEntity) return;
    if (window.confirm(`Limpar todo o histórico de "${editingHistoryProperty.name}"?`)) {
      historyEngine.clearKey(selectedEntity.id, editingHistoryProperty.id);
      setSampleCount(0);
    }
  };

  const field = (label: string, children: React.ReactNode, hint?: string) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  );

  const inputCls = "w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500 transition-colors";

  return (
    <Modal
      isOpen={isHistoryConfigModalOpen}
      onClose={closeHistoryConfigModal}
      title={`Histórico — ${editingHistoryProperty.name}`}
      maxWidth="max-w-lg"
    >
      <div className="flex flex-col gap-5 p-5">

        {/* Enable toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/40">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-4 h-4 text-violet-500" />
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">Habilitar Histórico</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Registrar amostras desta propriedade ao longo do tempo</div>
            </div>
          </div>
          <button
            onClick={() => setConfig((c) => ({ ...c, enabled: !c.enabled }))}
            className={cn(
              'relative w-10 h-5.5 rounded-full transition-colors duration-200',
              config.enabled ? 'bg-violet-500' : 'bg-slate-300 dark:bg-slate-600'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
                config.enabled && 'translate-x-[18px]'
              )}
            />
          </button>
        </div>

        {config.enabled && (
          <>
            {/* Collection mode */}
            {field('Modo de Coleta',
              <div className="flex gap-2">
                {(['interval', 'on_change'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setConfig((c) => ({ ...c, collectionMode: mode }))}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
                      config.collectionMode === mode
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-400'
                    )}
                  >
                    {mode === 'interval' ? <Clock className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                    {mode === 'interval' ? 'Intervalo Fixo' : 'Por Mudança'}
                  </button>
                ))}
              </div>
            )}

            {/* Interval (only shown for interval mode) */}
            {config.collectionMode === 'interval' && field(
              'Intervalo de Amostragem',
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1000}
                  step={500}
                  value={config.intervalMs}
                  onChange={(e) => setConfig((c) => ({ ...c, intervalMs: Math.max(1000, Number(e.target.value)) }))}
                  className={inputCls}
                />
                <span className="text-xs text-slate-500 shrink-0">ms</span>
              </div>,
              'Mínimo: 1000 ms (1 segundo)'
            )}

            {/* Deadband */}
            {field(
              'Deadband (Faixa morta)',
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={config.deadband}
                  onChange={(e) => setConfig((c) => ({ ...c, deadband: Math.max(0, Number(e.target.value)) }))}
                  className={inputCls}
                />
              </div>,
              'Variação mínima necessária para registrar uma nova amostra. 0 = desabilitado.'
            )}

            {/* Retention */}
            {field(
              'Retenção dos Dados',
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={720}
                  value={msToHours(config.retentionMs)}
                  onChange={(e) => setConfig((c) => ({ ...c, retentionMs: hoursToMs(Math.max(1, Number(e.target.value))) }))}
                  className={inputCls}
                />
                <span className="text-xs text-slate-500 shrink-0">horas</span>
              </div>,
              'Amostras mais antigas que este período serão descartadas.'
            )}

            {/* Max samples */}
            {field(
              'Máximo de Registros',
              <input
                type="number"
                min={10}
                max={50000}
                step={100}
                value={config.maxSamples}
                onChange={(e) => setConfig((c) => ({ ...c, maxSamples: Math.max(10, Number(e.target.value)) }))}
                className={inputCls}
              />,
              'Os registros mais antigos são descartados quando o limite é atingido.'
            )}

            {/* Engineering unit */}
            {field(
              'Unidade de Engenharia',
              <input
                type="text"
                value={config.engineeringUnit}
                onChange={(e) => setConfig((c) => ({ ...c, engineeringUnit: e.target.value }))}
                placeholder="ex: °C, bar, m³/h"
                className={inputCls}
              />
            )}

            {/* Compression toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Compressão</div>
                <div className="text-[11px] text-slate-400">Ativa compressão de dados sem perda de precisão relevante</div>
              </div>
              <button
                onClick={() => setConfig((c) => ({ ...c, compression: !c.compression }))}
                className={cn(
                  'relative w-10 h-5.5 rounded-full transition-colors duration-200',
                  config.compression ? 'bg-violet-500' : 'bg-slate-300 dark:bg-slate-600'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
                    config.compression && 'translate-x-[18px]'
                  )}
                />
              </button>
            </div>

            {/* Notes */}
            {field(
              'Observações',
              <textarea
                value={config.notes}
                onChange={(e) => setConfig((c) => ({ ...c, notes: e.target.value }))}
                placeholder="Anotações sobre esta configuração de histórico..."
                rows={2}
                className={cn(inputCls, 'resize-none')}
              />
            )}

            {/* Current sample count info */}
            {sampleCount > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <Database className="w-3.5 h-3.5 text-violet-500" />
                  <span><strong>{sampleCount.toLocaleString()}</strong> amostras armazenadas</span>
                </div>
                <button
                  onClick={handleClearHistory}
                  className="flex items-center gap-1 text-[11px] text-rose-500 hover:text-rose-700 font-semibold transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Limpar
                </button>
              </div>
            )}
          </>
        )}

        {/* Info banner when disabled */}
        {!config.enabled && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
            <span>Habilite o histórico para registrar automaticamente os valores desta propriedade ao longo do tempo. Os dados ficam disponíveis na aba <strong>Historian</strong>.</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={closeHistoryConfigModal}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            Salvar Configuração
          </button>
        </div>
      </div>
    </Modal>
  );
};
