import React, { useState, useEffect } from 'react';
import type { GridConfig } from '../types';
import { PlusCircle, Save, Grid, Trash2, Eye, Edit3, LayoutGrid, FolderKanban, Check } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface GridDashboardHeaderProps {
  config: GridConfig;
  isViewMode: boolean;
  cardCount: number;
  onOpenScreenManager: () => void;
  onRenameScreen: (newName: string) => void;
  onNewScreen: () => void;
  onSaveLayout: () => void;
  onChangeGrid: () => void;
  onClearScreen: () => void;
  onToggleMode: () => void;
}

export const GridDashboardHeader: React.FC<GridDashboardHeaderProps> = ({
  config,
  isViewMode,
  cardCount,
  onOpenScreenManager,
  onRenameScreen,
  onNewScreen,
  onSaveLayout,
  onChangeGrid,
  onClearScreen,
  onToggleMode,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(config.screenName || '');

  useEffect(() => {
    setTitleValue(config.screenName || '');
  }, [config.screenName]);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== config.screenName) {
      onRenameScreen(trimmed);
    } else {
      setTitleValue(config.screenName);
    }
  };

  return (
    <div className="h-16 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#16171b]/90 backdrop-blur-md flex items-center justify-between gap-4 z-10 select-none">
      {/* Title & Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20 shrink-0">
          <LayoutGrid className="w-5 h-5" />
        </div>
        
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSubmit();
                    if (e.key === 'Escape') {
                      setTitleValue(config.screenName);
                      setIsEditingTitle(false);
                    }
                  }}
                  onBlur={handleTitleSubmit}
                  autoFocus
                  className="text-base font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 border border-sky-500 rounded-lg px-2 py-0.5 outline-none font-sans"
                />
                <button
                  onClick={handleTitleSubmit}
                  className="p-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer"
                  title="Salvar Nome da Tela"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => !isViewMode && setIsEditingTitle(true)}
                className={cn(
                  "flex items-center gap-1.5 group/title rounded-lg py-0.5 px-1 -ml-1 transition-colors",
                  !isViewMode && "hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer"
                )}
                title={!isViewMode ? "Clique para editar o nome desta tela" : undefined}
              >
                <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight truncate max-w-[280px] sm:max-w-[400px]">
                  {config.screenName || 'Grid Dashboard Designer'}
                </h1>
                {!isViewMode && (
                  <Edit3 className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover/title:opacity-100 transition-opacity shrink-0" />
                )}
              </div>
            )}

            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
              {config.rows}x{config.cols} ({cardCount} {cardCount === 1 ? 'cartão' : 'cartões'})
            </span>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 shrink-0">
        {/* Minhas Telas */}
        <button
          onClick={onOpenScreenManager}
          className="py-1.5 px-3 rounded-lg border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-650 dark:text-sky-400 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          title="Abrir gerenciador de telas"
        >
          <FolderKanban className="w-4 h-4 text-sky-500" />
          <span className="hidden sm:inline">Minhas Telas</span>
        </button>

        {/* Nova Tela */}
        <button
          onClick={onNewScreen}
          className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 bg-slate-50 dark:bg-slate-800/80 hover:bg-sky-50 dark:hover:bg-sky-500/10 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Criar nova tela"
        >
          <PlusCircle className="w-3.5 h-3.5 text-sky-500" />
          <span className="hidden md:inline">Nova Tela</span>
        </button>

        {/* Salvar Layout */}
        <button
          onClick={onSaveLayout}
          className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Salvar layout da tela atual"
        >
          <Save className="w-3.5 h-3.5 text-emerald-500" />
          <span className="hidden md:inline">Salvar Layout</span>
        </button>

        {/* Alterar Grade */}
        <button
          onClick={onChangeGrid}
          className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Alterar linhas e colunas da grade"
        >
          <Grid className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden md:inline">Alterar Grade</span>
        </button>

        {/* Limpar Tela */}
        <button
          onClick={onClearScreen}
          className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-red-500 dark:hover:border-red-500 bg-slate-50 dark:bg-slate-800/80 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
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
            "py-1.5 px-3.5 rounded-lg border text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer",
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
