import React, { useEffect, useState } from 'react';
import {
  Workflow,
  Plus,
  Trash2,
  Copy,
  Search,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { useObjectModelStore } from '../../store/useObjectModelStore';
import { useFlowStore } from '../../store/useFlowStore';

export const TemplateFlowsEditor: React.FC = () => {
  const { selectedEntity, selectedTemplate, selectedObject } = useObjectModelStore();
  const {
    flowcharts,
    init: initFlows,
    openDesigner,
    createFlowchart,
    deleteFlowchart,
    duplicateFlowchart,
  } = useFlowStore();

  const [search, setSearch] = useState('');

  useEffect(() => {
    initFlows();
  }, [initFlows]);

  const currentEntity = selectedEntity?.type === 'template' ? selectedTemplate : selectedObject;

  if (!selectedEntity || !currentEntity) return null;

  const targetId = currentEntity.id;
  const contextType = selectedEntity.type === 'template' ? 'template' : 'instance';

  const boundFlowcharts = flowcharts.filter(
    (f) => f.targetId === targetId || (f.contextType === contextType && f.targetId === targetId)
  );

  const filtered = boundFlowcharts.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateNew = () => {
    const name = `Fluxo ${currentEntity.name} #${boundFlowcharts.length + 1}`;
    const newFc = createFlowchart(
      name,
      `Fluxograma BPMN para ${currentEntity.name}`,
      contextType,
      targetId,
      'Processos'
    );
    openDesigner(newFc.id);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Subheader Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar fluxogramas do objeto..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Fluxograma BPMN</span>
        </button>
      </div>

      {/* Grid of Flowchart Cards */}
      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400">
          <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center mb-3">
            <Workflow className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Nenhum Fluxograma Encontrado
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            Este {contextType === 'template' ? 'Template' : 'Objeto'} ainda não possui fluxogramas BPMN associados.
          </p>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Primeiro Fluxograma</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-1">
          {filtered.map((fc) => (
            <div
              key={fc.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:border-sky-500/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                      <Workflow className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate max-w-[180px]">
                        {fc.name}
                      </h3>
                      <span className="text-[10px] text-slate-400">v{fc.version}</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {fc.category}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {fc.description || 'Sem descrição cadastrada.'}
                </p>

                {fc.tags && fc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {fc.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[10px] font-mono border border-sky-200/50 dark:border-sky-800/50"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
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
                    onClick={() => openDesigner(fc.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer ml-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir Editor</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
