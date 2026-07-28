import React, { useEffect, useState } from 'react';
import {
  Workflow,
  Plus,
  Search,
  Copy,
  Trash2,
  ExternalLink,
  Upload,
  Clock,
  Boxes,
  Box,
  Globe,
  Layers,
  GitFork,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { HeaderNavigation } from '../components/navigation/HeaderNavigation';
import { useFlowStore } from '../store/useFlowStore';
import { cn } from '../utils/cn';

export const FlowsV2Page: React.FC = () => {
  const {
    flowcharts,
    init: initFlows,
    openDesignerV2,
    createFlowchart,
    deleteFlowchart,
    duplicateFlowchart,
    importFlowchartJson,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedContext,
    setSelectedContext,
  } = useFlowStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFcName, setNewFcName] = useState('');
  const [newFcDesc, setNewFcDesc] = useState('');
  const [newFcCategory, setNewFcCategory] = useState('Processos Industriais');
  const [newFcTags, setNewFcTags] = useState('XYFlow, Automação, Batelada');

  useEffect(() => {
    initFlows();
  }, [initFlows]);

  const categories = Array.from(new Set(flowcharts.map((f) => f.category)));

  const filteredFlowcharts = flowcharts.filter((fc) => {
    const matchesSearch =
      fc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fc.author.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory || fc.category === selectedCategory;
    const matchesContext = selectedContext === 'all' || fc.contextType === selectedContext;

    return matchesSearch && matchesCategory && matchesContext;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFcName.trim()) return;

    const tagsArray = newFcTags.split(',').map((t) => t.trim()).filter(Boolean);
    const newFc = createFlowchart(
      newFcName.trim(),
      newFcDesc.trim(),
      'global',
      null,
      newFcCategory,
      tagsArray
    );

    setIsCreateModalOpen(false);
    setNewFcName('');
    setNewFcDesc('');
    openDesignerV2(newFc.id);
  };

  const handleImportFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event: any) => {
        const jsonStr = event.target.result;
        const imported = importFlowchartJson(jsonStr);
        if (imported) {
          openDesignerV2(imported.id);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const globalCount = flowcharts.filter((f) => f.contextType === 'global').length;
  const templateCount = flowcharts.filter((f) => f.contextType === 'template').length;
  const instanceCount = flowcharts.filter((f) => f.contextType === 'instance').length;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Shared Header Navigation */}
      <HeaderNavigation />

      {/* Page Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs shrink-0 select-none">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shrink-0">
              <GitFork className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Fluxogramas 2 (React Flow / XYFlow)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Nova Geração
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Editor visual moderno, minimalista e fluido para automação industrial, bateladas e processos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NavLink
              to="/flows"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200/60 font-semibold text-xs transition-all"
              title="Alternar para o Editor BPMN Tradicional"
            >
              <Workflow className="w-4 h-4 text-sky-500" />
              <span>Abrir BPMN Tradicional</span>
            </NavLink>

            <button
              onClick={handleImportFile}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 text-emerald-500" />
              <span>Importar JSON</span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Fluxograma V2</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Filter & Category Sidebar */}
        <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-5 flex flex-col shrink-0 select-none">
          {/* Context Filter Tabs */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Contexto do Fluxo
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedContext('all')}
                className={cn(
                  'w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-all',
                  selectedContext === 'all'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  <span>Todos</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800">
                  {flowcharts.length}
                </span>
              </button>

              <button
                onClick={() => setSelectedContext('global')}
                className={cn(
                  'w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-all',
                  selectedContext === 'global'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-500" />
                  <span>Globais</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800">
                  {globalCount}
                </span>
              </button>

              <button
                onClick={() => setSelectedContext('template')}
                className={cn(
                  'w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-all',
                  selectedContext === 'template'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-indigo-500" />
                  <span>Templates</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800">
                  {templateCount}
                </span>
              </button>

              <button
                onClick={() => setSelectedContext('instance')}
                className={cn(
                  'w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-all',
                  selectedContext === 'instance'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-amber-500" />
                  <span>Instâncias</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800">
                  {instanceCount}
                </span>
              </button>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Categorias
            </h3>
            <div className="space-y-1 overflow-y-auto pr-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  'w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all',
                  !selectedCategory
                    ? 'bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                )}
              >
                <span>Todas as Categorias</span>
              </button>

              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all',
                    selectedCategory === cat
                      ? 'bg-slate-100 dark:bg-slate-800 font-bold text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  )}
                >
                  <span className="truncate">{cat}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Central Cards Grid Area */}
        <main className="flex-1 flex flex-col overflow-hidden p-6 bg-slate-50/50 dark:bg-slate-950">
          {/* Top Search & Stats Bar */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por nome, descrição ou autor..."
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-emerald-500 shadow-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="text-xs text-slate-500">
              Exibindo <strong className="text-slate-800 dark:text-slate-200">{filteredFlowcharts.length}</strong> de <strong className="text-slate-800 dark:text-slate-200">{flowcharts.length}</strong> fluxogramas
            </div>
          </div>

          {/* Cards Grid */}
          <div className="flex-1 overflow-y-auto">
            {filteredFlowcharts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 p-8 text-center">
                <GitFork className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhum fluxograma encontrado</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Crie um novo fluxograma V2 para começar a edição visual no XYFlow.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFlowcharts.map((fc) => (
                  <div
                    key={fc.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0 font-bold text-xs">
                            <GitFork className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate max-w-[170px]">
                              {fc.name}
                            </h3>
                            <span className="text-[10px] text-slate-400">v{fc.version} • {fc.author}</span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {fc.contextType}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {fc.description || 'Sem descrição cadastrada.'}
                      </p>

                      {fc.tags && fc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {fc.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono border border-emerald-200/50 dark:border-emerald-800/50"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(fc.updatedAt).toLocaleDateString('pt-BR')}</span>
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => duplicateFlowchart(fc.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                          title="Duplicar Fluxograma"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => deleteFlowchart(fc.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Excluir Fluxograma"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => openDesignerV2(fc.id)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer ml-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Abrir Editor XYFlow</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal Criar Fluxograma V2 */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Criar Fluxograma V2 (XYFlow)
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-slate-700 dark:text-slate-300">Nome do Fluxograma</label>
                <input
                  type="text"
                  required
                  value={newFcName}
                  onChange={(e) => setNewFcName(e.target.value)}
                  placeholder="ex: Batelada de Reator de Mistura"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700 dark:text-slate-300">Categoria</label>
                <input
                  type="text"
                  value={newFcCategory}
                  onChange={(e) => setNewFcCategory(e.target.value)}
                  placeholder="ex: Processos Industriais"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700 dark:text-slate-300">Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  value={newFcTags}
                  onChange={(e) => setNewFcTags(e.target.value)}
                  placeholder="Batelada, Partida, Segurança"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700 dark:text-slate-300">Descrição / Objetivo</label>
                <textarea
                  value={newFcDesc}
                  onChange={(e) => setNewFcDesc(e.target.value)}
                  rows={3}
                  placeholder="Descreva a finalidade deste processo..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md"
                >
                  Criar e Abrir XYFlow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
