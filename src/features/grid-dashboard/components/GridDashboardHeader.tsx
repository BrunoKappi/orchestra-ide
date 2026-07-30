import React from 'react';
import type { GridConfig } from '../types';
import { PlusCircle, Save, Download, Grid, Trash2, Eye, Edit3, LayoutGrid } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface GridDashboardHeaderProps {
  config: GridConfig;
  isViewMode: boolean;
  cardCount: number;
  onNewScreen: () => void;
  onSaveLayout: () => void;
  onLoadLayout: () => void;
  onChangeGrid: () => void;
  onClearScreen: () => void;
  onToggleMode: () => void;
}

export const GridDashboardHeader: React.FC<GridDashboardHeaderProps> = ({
  config,
  isViewMode,
  cardCount,
  onNewScreen,
  onSaveLayout,
  onLoadLayout,
  onChangeGrid,
  onClearScreen,
  onToggleMode,
}) => {
  return (
    <div className="h-16 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#16171b]/90 backdrop-blur-md flex items-center justify-between gap-4 z-10">
      {/* Title & Info */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
          <LayoutGrid className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {config.screenName || "Grid Dashboard Designer"}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              {config.rows}x{config.cols} ({cardCount} {cardCount === 1 ? 'cartão' : 'cartões'})
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block">
            Prova de Conceito • Designer de Telas Industriais por Grade
          </p>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        {/* Nova Tela */}
        <button
          onClick={onNewScreen}
          className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 bg-slate-50 dark:bg-slate-800/80 hover:bg-sky-50 dark:hover:bg-sky-500/10 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          title="Criar nova tela"
        >
          <PlusCircle className="w-3.5 h-3.5 text-sky-500" />
          <span className="hidden md:inline">Nova Tela</span>
        </button>

        {/* Salvar Layout */}
        <button
          onClick={onSaveLayout}
          className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          title="Salvar layout no localStorage"
        >
          <Save className="w-3.5 h-3.5 text-emerald-500" />
          <span className="hidden md:inline">Salvar Layout</span>
        </button>

        {/* Carregar Layout */}
        <button
          onClick={onLoadLayout}
          className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 bg-slate-50 dark:bg-slate-800/80 hover:bg-sky-50 dark:hover:bg-sky-500/10 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          title="Carregar layout salvo"
        >
          <Download className="w-3.5 h-3.5 text-sky-500" />
          <span className="hidden md:inline">Carregar Layout</span>
        </button>

        {/* Alterar Grade */}
        <button
          onClick={onChangeGrid}
          className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          title="Alterar linhas e colunas da grade"
        >
          <Grid className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden md:inline">Alterar Grade</span>
        </button>

        {/* Limpar Tela */}
        <button
          onClick={onClearScreen}
          className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-red-500 dark:hover:border-red-500 bg-slate-50 dark:bg-slate-800/80 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          title="Limpar todos os cartões da tela"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-500" />
          <span className="hidden md:inline">Limpar Tela</span>
        </button>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Modo Edição vs Visualização Toggle */}
        <button
          onClick={onToggleMode}
          className={cn(
            "py-1.5 px-3.5 rounded-lg border text-xs font-bold flex items-center gap-2 transition-all shadow-sm",
            isViewMode
              ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600 ring-2 ring-amber-500/20"
              : "bg-sky-500 hover:bg-sky-600 text-white border-sky-600 ring-2 ring-sky-500/20"
          )}
        >
          {isViewMode ? (
            <>
              <Eye className="w-4 h-4" />
              <span>Modo Visualização</span>
            </>
          ) : (
            <>
              <Edit3 className="w-4 h-4" />
              <span>Modo Edição</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
