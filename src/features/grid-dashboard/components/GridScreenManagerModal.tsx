import React, { useState } from 'react';
import { X, Plus, Search, Trash2, Copy, Play, LayoutGrid, Calendar, Clock } from 'lucide-react';
import { useGridScreenStore } from '../../../store/useGridScreenStore';
import { cn } from '../../../utils/cn';

interface GridScreenManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GridScreenManagerModal: React.FC<GridScreenManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    screens,
    activeScreenId,
    selectScreen,
    createScreen,
    duplicateScreen,
    deleteScreen,
  } = useGridScreenStore();

  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredScreens = screens.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Minhas Telas do Grid Designer
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Gerencie, alterne, crie e duplique suas telas industriais personalizadas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search & Create */}
        <div className="px-6 py-3 border-b border-slate-150 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome da tela..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/30 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
            />
          </div>

          <button
            onClick={() => {
              const newId = createScreen();
              selectScreen(newId);
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Nova Tela</span>
          </button>
        </div>

        {/* List of Screens */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 dark:bg-slate-900/20">
          {filteredScreens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
              <LayoutGrid className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-semibold">Nenhuma tela encontrada</p>
              <p className="text-xs opacity-60 mt-1">
                Clique em "Criar Nova Tela" para iniciar um novo layout
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredScreens.map((screen) => {
                const isActive = screen.id === activeScreenId;
                return (
                  <div
                    key={screen.id}
                    className={cn(
                      "group relative p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between bg-white dark:bg-slate-900 shadow-xs",
                      isActive
                        ? "border-sky-500 dark:border-sky-500 ring-2 ring-sky-500/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700"
                    )}
                  >
                    <div>
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate flex-1" title={screen.name}>
                          {screen.name}
                        </h3>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 shrink-0">
                            Ativa
                          </span>
                        )}
                      </div>

                      {/* Meta badges */}
                      <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-750">
                          Grade: {screen.rows}x{screen.cols}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-750">
                          Cartões: {screen.cards.length}
                        </span>
                      </div>

                      {/* Dates */}
                      <div className="space-y-1 text-[11px] text-slate-400 dark:text-slate-500 mb-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Criada: {formatDate(screen.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Edição: {formatDate(screen.updatedAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          selectScreen(screen.id);
                          onClose();
                        }}
                        className={cn(
                          "px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                          isActive
                            ? "bg-sky-500 text-white hover:bg-sky-600 shadow-xs"
                            : "bg-slate-100 dark:bg-slate-800 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-500 text-slate-700 dark:text-slate-300"
                        )}
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>{isActive ? 'Tela Aberta' : 'Abrir Tela'}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => duplicateScreen(screen.id)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                          title="Duplicar tela"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (screens.length <= 1) {
                              alert('Não é possível excluir a única tela existente.');
                              return;
                            }
                            if (window.confirm(`Deseja realmente excluir a tela "${screen.name}"?`)) {
                              deleteScreen(screen.id);
                            }
                          }}
                          className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 transition-colors"
                          title="Excluir tela"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
