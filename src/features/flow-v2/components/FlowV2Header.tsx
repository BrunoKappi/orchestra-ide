import React, { useState } from 'react';
import {
  Save,
  Play,
  Square,
  Maximize2,
  Download,
  Upload,
  ArrowLeft,
  BarChart3,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { useFlowStore } from '../../../store/useFlowStore';
import { cn } from '../../../utils/cn';

interface FlowV2HeaderProps {
  onSave: () => void;
  onAutoLayout: () => void;
  onFitView: () => void;
  onToggleSimulation: () => void;
  isSimulating: boolean;
  onExportJson: () => void;
  onExportPng: () => void;
  onImportJson: () => void;
  onToggleStats: () => void;
  backgroundType: 'dots' | 'lines' | 'none';
  setBackgroundType: (bg: 'dots' | 'lines' | 'none') => void;
}

export const FlowV2Header: React.FC<FlowV2HeaderProps> = ({
  onSave,
  onAutoLayout,
  onFitView,
  onToggleSimulation,
  isSimulating,
  onExportJson,
  onExportPng,
  onImportJson,
  onToggleStats,
  backgroundType,
  setBackgroundType,
}) => {
  const { activeFlowchart, closeDesignerV2 } = useFlowStore();
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between px-4 shrink-0 z-30 select-none shadow-xs">
      {/* Left: Back button & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={closeDesignerV2}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          title="Voltar para Catálogo de Fluxogramas"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs font-bold text-xs">
            V2
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-[220px]">
                {activeFlowchart?.name || 'Fluxograma XYFlow'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                XYFlow Engine
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {activeFlowchart?.category || 'Processos'} • v{activeFlowchart?.version || '1.0.0'}
            </p>
          </div>
        </div>
      </div>

      {/* Middle: Canvas Tools & Layout Controls */}
      <div className="flex items-center gap-1.5 bg-slate-100/70 dark:bg-slate-800/70 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
        <button
          onClick={onAutoLayout}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition-all cursor-pointer shadow-2xs"
          title="Alinhamento e Organização Automática do Fluxo"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Auto Layout</span>
        </button>

        <button
          onClick={onFitView}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition-all cursor-pointer shadow-2xs"
          title="Centralizar Fluxo no Canvas"
        >
          <Maximize2 className="w-3.5 h-3.5 text-sky-500" />
          <span>Centralizar</span>
        </button>

        {/* Background Grid Pattern Switcher */}
        <div className="flex items-center gap-0.5 bg-slate-200/50 dark:bg-slate-900/50 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-bold">
          <button
            onClick={() => setBackgroundType('dots')}
            className={cn(
              'px-2 py-0.5 rounded transition-colors',
              backgroundType === 'dots'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
            title="Grade de Pontos"
          >
            Pontos
          </button>
          <button
            onClick={() => setBackgroundType('lines')}
            className={cn(
              'px-2 py-0.5 rounded transition-colors',
              backgroundType === 'lines'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
            title="Grade de Linhas"
          >
            Linhas
          </button>
          <button
            onClick={() => setBackgroundType('none')}
            className={cn(
              'px-2 py-0.5 rounded transition-colors',
              backgroundType === 'none'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
            title="Sem Grade"
          >
            Limpo
          </button>
        </div>
      </div>

      {/* Right: Simulation, Actions, Save */}
      <div className="flex items-center gap-2 text-xs">
        {/* Simulation Toggle */}
        <button
          onClick={onToggleSimulation}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold shadow-xs transition-all cursor-pointer',
            isSimulating
              ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
          )}
        >
          {isSimulating ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isSimulating ? 'Parar Simulação' : 'Simular Fluxo Live'}</span>
        </button>

        <button
          onClick={onToggleStats}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 transition-colors"
          title="Abrir Painel de Estatísticas e Validação"
        >
          <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
          <span>Inspeção</span>
        </button>

        {/* Export & Import dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-sky-500" />
            <span>Exportar</span>
          </button>

          {isExportMenuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50 animate-in fade-in-50 duration-100">
              <button
                onClick={() => {
                  onExportJson();
                  setIsExportMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
              >
                <FileCode className="w-3.5 h-3.5 text-sky-500" />
                <span>Exportar JSON</span>
              </button>

              <button
                onClick={() => {
                  onExportPng();
                  setIsExportMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
              >
                <Download className="w-3.5 h-3.5 text-emerald-500" />
                <span>Exportar Imagem PNG</span>
              </button>

              <button
                onClick={() => {
                  onImportJson();
                  setIsExportMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium border-t border-slate-100 dark:border-slate-800"
              >
                <Upload className="w-3.5 h-3.5 text-amber-500" />
                <span>Importar JSON</span>
              </button>
            </div>
          )}
        </div>

        {/* Save Action */}
        <button
          onClick={onSave}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-md shadow-sky-600/20 transition-all cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Salvar Fluxo</span>
        </button>
      </div>
    </header>
  );
};
