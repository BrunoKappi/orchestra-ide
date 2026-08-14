import React, { useState, useEffect } from 'react';
import { useBatchStore, STORAGE_KEYS } from '../../../../store/useBatchStore';
import { RecipeCanvas } from './RecipeCanvas';
import { BatchStepInspector } from './BatchStepInspector';
import { BatchExecutionPanel } from './BatchExecutionPanel';
import {
  Play,
  Plus,
  Trash2,
  Copy,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Snowflake,
  Droplets,
  Filter,
  Database,
  Sliders,
  ArrowLeftRight,
  RotateCw,
  Zap,
  Flag,
  Search,
  BookOpen,
} from 'lucide-react';

export const BatchDashboard: React.FC = () => {
  const {
    recipes,
    batches,
    selectedRecipeId,
    setSelectedRecipeId,
    selectedBatchId,
    setSelectedBatchId,
    activeBatch,
    subTab,
    setSubTab,
    createRecipe,
    deleteRecipe,
    duplicateRecipe,
    startBatch,
    init,
  } = useBatchStore();

  const [search, setSearch] = useState('');
  const [recipeName, setRecipeName] = useState('');
  const [recipeDesc, setRecipeDesc] = useState('');
  const [isNewRecipeModalOpen, setIsNewRecipeModalOpen] = useState(false);
  const [isRecipeSidebarCollapsed, setIsRecipeSidebarCollapsed] = useState(false);
  const [isIsaPaletteCollapsed, setIsIsaPaletteCollapsed] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  const currentRecipe = recipes.find((r) => r.id === selectedRecipeId);

  // Filter recipes by search query
  const filteredRecipes = recipes.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateRecipeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeName.trim()) return;

    createRecipe(recipeName.trim(), recipeDesc.trim());
    setIsNewRecipeModalOpen(false);
    setRecipeName('');
    setRecipeDesc('');
  };

  const handleDragStart = (event: React.DragEvent, stepType: string) => {
    event.dataTransfer.setData('application/reactflow-step', stepType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="flex flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 h-full w-full select-none relative">
      {/* Sidebar Toggle Button */}
      {currentRecipe && (
        <button
          onClick={() => setIsRecipeSidebarCollapsed(!isRecipeSidebarCollapsed)}
          className={`absolute top-1/2 -translate-y-1/2 z-30 p-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-550 hover:text-slate-850 shadow-md transition-all cursor-pointer ${
            isRecipeSidebarCollapsed ? 'left-2' : 'left-[276px]'
          }`}
          title={isRecipeSidebarCollapsed ? 'Expandir receitas' : 'Colapsar receitas'}
        >
          {isRecipeSidebarCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      )}

      {/* Sidebar: Recipes List and Execution History */}
      <aside className={`border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 select-none overflow-hidden h-full transition-all duration-300 ${
        isRecipeSidebarCollapsed ? 'w-0 border-r-0' : 'w-72'
      }`}>
        <div className="w-72 flex flex-col h-full overflow-hidden shrink-0">
          {/* Search & Actions */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar receitas..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-[11px] outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            <button
              onClick={() => setIsNewRecipeModalOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Receita</span>
            </button>
          </div>

          {/* Recipes Sublist */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 px-2 mb-1.5">
                Receitas Industriais ({recipes.length})
              </h3>
              <div className="space-y-0.5">
                {filteredRecipes.map((r) => {
                  const isSelected = r.id === selectedRecipeId && subTab === 'designer';
                  return (
                    <div
                      key={r.id}
                      onClick={() => {
                        setSelectedRecipeId(r.id);
                        setSubTab('designer');
                      }}
                      className={`group w-full flex flex-col p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-sky-50/70 dark:bg-sky-950/20 border-sky-350 dark:border-sky-850 text-sky-700 dark:text-sky-400'
                          : 'border-transparent text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] truncate max-w-[170px]">
                          {r.name}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateRecipe(r.id);
                            }}
                            title="Duplicar receita"
                            className="p-1 rounded-md text-slate-450 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-750"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Excluir esta receita?')) deleteRecipe(r.id);
                            }}
                            title="Excluir receita"
                            className="p-1 rounded-md text-slate-450 hover:text-red-500 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      {r.description && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-550 line-clamp-1 mt-0.5">
                          {r.description}
                        </p>
                      )}
                    </div>
                  );
                })}
                {filteredRecipes.length === 0 && (
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center py-4">
                    Nenhuma receita encontrada.
                  </div>
                )}
              </div>
            </div>

            {/* Batch Instances (Lotes) Sublist */}
            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 px-2 mb-1.5 flex items-center justify-between">
                <span>Histórico de Lotes</span>
                {batches.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Limpar histórico de lotes?')) {
                        useBatchStore.getState().clearHistory();
                      }
                    }}
                    className="text-[9px] text-slate-400 hover:text-red-500 lowercase tracking-normal"
                  >
                    limpar
                  </button>
                )}
              </h3>
              <div className="space-y-1">
                {activeBatch && (
                  <div
                    onClick={() => setSubTab('monitor')}
                    className={`flex flex-col p-2.5 rounded-xl border border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer transition-all ${
                      subTab === 'monitor' ? 'ring-1 ring-amber-500/30' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                        {activeBatch.batchNumber}
                      </span>
                      <span className="text-[8px] bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1 py-0.25 rounded font-bold uppercase tracking-wider animate-pulse">
                        {activeBatch.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-550 dark:text-slate-350 truncate mt-0.5">
                      {activeBatch.recipeName}
                    </p>
                  </div>
                )}

                {batches
                  .filter((b) => !activeBatch || b.id !== activeBatch.id)
                  .slice(0, 10)
                  .map((b) => {
                    let statusBadgeColor = 'bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-400';
                    if (b.status === 'completed') statusBadgeColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
                    else if (b.status === 'canceled') statusBadgeColor = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
                    else if (b.status === 'error') statusBadgeColor = 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';

                    const isSelected = selectedBatchId === b.id && subTab === 'monitor' && activeBatch?.id !== b.id;

                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          // Open past batch details read-only
                          setSelectedBatchId(b.id);
                          setSelectedRecipeId(b.recipeId);
                          // Temporarily mount mock active batch for viewer
                          setSubTab('monitor');
                          useBatchStore.setState({ activeBatch: b });
                        }}
                        className={`flex flex-col p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-slate-100/80 dark:bg-slate-850 border-slate-300 dark:border-slate-700'
                            : 'border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[10px] text-slate-700 dark:text-slate-300 font-mono">
                            {b.batchNumber}
                          </span>
                          <span className={`text-[8px] px-1 py-0.25 rounded font-bold uppercase tracking-wider ${statusBadgeColor}`}>
                            {b.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-450 truncate mt-0.5">
                          {b.recipeName}
                        </p>
                      </div>
                    );
                  })}

                {batches.length === 0 && !activeBatch && (
                  <div className="text-[10px] text-slate-400 dark:text-slate-550 text-center py-4">
                    Nenhum lote executado ainda.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden h-full">
        {currentRecipe ? (
          <>
            {/* Header bar above Canvas */}
            <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-500 shrink-0" />
                <div>
                  <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-none">
                    {currentRecipe.name}
                  </h2>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1 leading-none">
                    {currentRecipe.description || 'Sem descrição.'}
                  </p>
                </div>
              </div>

              {/* View/Edit Modes and Action buttons */}
              <div className="flex items-center gap-2">
                {subTab === 'designer' ? (
                  <>
                    <button
                      onClick={() => startBatch(currentRecipe.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] shadow-sm transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Iniciar Lote</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setSubTab('designer');
                      // Clear transient activeBatch viewer state
                      const savedBatches = localStorage.getItem(STORAGE_KEYS.BATCHES);
                      const batchesList = savedBatches ? JSON.parse(savedBatches) : [];
                      const runningBatch = batchesList.find((b: any) => b.status === 'running') || null;
                      useBatchStore.setState({ activeBatch: runningBatch });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-850 hover:bg-slate-200/60 font-semibold text-[11px] transition-colors cursor-pointer"
                  >
                    <span>Voltar ao Designer</span>
                  </button>
                )}
              </div>
            </div>

            {/* Canvas Area (ReactFlow) */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* Palette (Only visible in designer mode) */}
              {subTab === 'designer' && (
                <div className={`absolute top-4 left-4 z-10 p-3 bg-white/95 dark:bg-slate-900/95 border border-slate-250 dark:border-slate-800 rounded-2xl shadow-xl flex flex-col gap-2 shrink-0 select-none text-[11px] backdrop-blur-xs transition-all duration-200 ${
                  isIsaPaletteCollapsed ? 'w-36' : 'w-44'
                }`}>
                  <h4 className="font-bold text-[9px] uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1 border-b border-slate-100 dark:border-slate-800 pb-1 flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-sky-500" />
                      <span>Fases ISA-88</span>
                    </div>
                    <button
                      onClick={() => setIsIsaPaletteCollapsed(!isIsaPaletteCollapsed)}
                      className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title={isIsaPaletteCollapsed ? 'Expandir paleta' : 'Colapsar paleta'}
                    >
                      {isIsaPaletteCollapsed ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronUp className="w-3 h-3" />
                      )}
                    </button>
                  </h4>
                  {!isIsaPaletteCollapsed && (
                    <>
                      <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-0.5 scrollbar-thin">
                        {/* Draggable items */}
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, 'start')}
                          className="flex items-center gap-2 p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 cursor-grab hover:bg-emerald-500/15 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Início</span>
                        </div>

                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, 'transfer')}
                          className="flex items-center gap-2 p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20 cursor-grab hover:bg-blue-500/15 transition-colors"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          <span>Transferência</span>
                        </div>

                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, 'agitate')}
                          className="flex items-center gap-2 p-1.5 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 font-bold border border-yellow-500/20 cursor-grab hover:bg-yellow-500/15 transition-colors"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>Agitação</span>
                        </div>

                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, 'heat')}
                          className="flex items-center gap-2 p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20 cursor-grab hover:bg-orange-500/15 transition-colors"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Aquecimento</span>
                        </div>

                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, 'cool')}
                          className="flex items-center gap-2 p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold border border-sky-500/20 cursor-grab hover:bg-sky-500/15 transition-colors"
                        >
                          <Snowflake className="w-3.5 h-3.5" />
                          <span>Resfriamento</span>
                        </div>

                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, 'cip')}
                          className="flex items-center gap-2 p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold border border-teal-500/20 cursor-grab hover:bg-teal-500/15 transition-colors"
                        >
                          <Droplets className="w-3.5 h-3.5" />
                          <span>Limpeza / CIP</span>
                        </div>

                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, 'separate')}
                          className="flex items-center gap-2 p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/20 cursor-grab hover:bg-indigo-500/15 transition-colors"
                        >
                          <Filter className="w-3.5 h-3.5" />
                          <span>Separação</span>
                        </div>

                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, 'cutoff')}
                          className="flex items-center gap-2 p-1.5 rounded-lg bg-purple-500/10 text-purple-650 dark:text-purple-400 font-bold border border-purple-500/20 cursor-grab hover:bg-purple-500/15 transition-colors"
                        >
                          <Database className="w-3.5 h-3.5" />
                          <span>Cut-off</span>
                        </div>

                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, 'end')}
                          className="flex items-center gap-2 p-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 font-bold border border-red-500/20 cursor-grab hover:bg-red-500/15 transition-colors"
                        >
                          <Flag className="w-3.5 h-3.5" />
                          <span>Fim</span>
                        </div>
                      </div>
                      <p className="text-[8px] text-slate-400 mt-1.5 text-center leading-normal">
                        Arraste os blocos para a grade para desenhar o fluxo
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Main XYFlow Canvas wrapper */}
              <div className="flex-1 h-full min-w-0">
                <RecipeCanvas />
              </div>

              {/* Step config inspector (only editable when not read-only) */}
              <BatchStepInspector />
            </div>

            {/* Monitor logs and state drawer (only in monitor subTab) */}
            <BatchExecutionPanel />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
            <BookOpen className="w-14 h-14 text-slate-350 dark:text-slate-700 mb-3" />
            <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Nenhuma receita selecionada
            </h2>
            <p className="text-xs text-slate-450 dark:text-slate-500 mt-1.5 max-w-sm">
              Use a barra lateral para selecionar uma receita existente ou clique em "Nova Receita" para desenhar um novo processo de lote.
            </p>
          </div>
        )}
      </main>

      {/* New Recipe Modal */}
      {isNewRecipeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs select-none">
          <form
            onSubmit={handleCreateRecipeSubmit}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                Nova Receita de Lote (Batch)
              </h3>
              <button
                type="button"
                onClick={() => setIsNewRecipeModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-450 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-650 dark:text-slate-350">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1">
                  Nome da Receita
                </label>
                <input
                  type="text"
                  required
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  placeholder="ex: Batelada de Eteno Aditivado"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1">
                  Descrição (Opcional)
                </label>
                <textarea
                  value={recipeDesc}
                  onChange={(e) => setRecipeDesc(e.target.value)}
                  placeholder="Descreva as operações e o propósito do lote..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-850 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsNewRecipeModalOpen(false)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-md transition-colors cursor-pointer"
              >
                Criar Receita
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// Sub-component Helper
const X: React.FC<any> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
