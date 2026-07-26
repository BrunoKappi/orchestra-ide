import React from 'react';
import {
  Workflow,
  X,
  Download,
  Upload,
} from 'lucide-react';
import { useFlowStore } from '../../store/useFlowStore';
import { BpmnCanvas } from './BpmnCanvas';
import { IndustrialPaletteSidebar } from './IndustrialPaletteSidebar';
import { NodePropertyInspector } from './NodePropertyInspector';
import { ProblemsPanel } from './ProblemsPanel';

export const FlowDesignerModal: React.FC = () => {
  const {
    isDesignerOpen,
    activeFlowchart,
    closeDesigner,
    updateActiveBpmnXml,
    exportFlowchartJson,
    importFlowchartJson,
    propertyPrompt,
    resolvePropertyPrompt,
    closePropertyPrompt,
  } = useFlowStore();

  if (!isDesignerOpen || !activeFlowchart) return null;

  const handleExport = () => {
    const json = exportFlowchartJson(activeFlowchart.id);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeFlowchart.name.toLowerCase().replace(/\s+/g, '_')}_flowchart.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event: any) => {
        const jsonStr = event.target.result;
        importFlowchartJson(jsonStr);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 font-sans">
      {/* Fullscreen Header Navigation Bar */}
      <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 flex items-center justify-between shrink-0 shadow-sm dark:shadow-lg z-30 select-none">
        {/* Left Title & Meta */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-500 dark:text-sky-400 shrink-0 shadow-xs">
            <Workflow className="w-5 h-5" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {activeFlowchart.name}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 dark:border-sky-500/30 shrink-0">
                {activeFlowchart.contextType}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                v{activeFlowchart.version}
              </span>
            </div>
            <p className="text-[11px] text-slate-555 dark:text-slate-400 truncate mt-0.5">
              {activeFlowchart.description || 'Sem descrição informada.'}
            </p>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition-colors cursor-pointer"
            title="Exportar Fluxograma em JSON"
          >
            <Download className="w-3.5 h-3.5 text-sky-500" />
            <span>Exportar JSON</span>
          </button>

          <button
            onClick={handleImport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition-colors cursor-pointer"
            title="Importar Fluxograma JSON"
          >
            <Upload className="w-3.5 h-3.5 text-sky-500" />
            <span>Importar JSON</span>
          </button>

          <button
            onClick={closeDesigner}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-rose-600/80 text-slate-555 dark:text-slate-300 hover:text-white dark:hover:text-white transition-colors cursor-pointer"
            title="Fechar Editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Palette & Library Sidebar */}
        <IndustrialPaletteSidebar
          contextType={activeFlowchart.contextType}
          targetId={activeFlowchart.targetId}
        />

        {/* Central BPMN Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <BpmnCanvas
            bpmnXml={activeFlowchart.bpmnXml}
            onXmlChange={(xml) => updateActiveBpmnXml(xml)}
          />
          {/* Bottom Problems Panel */}
          <ProblemsPanel />
        </div>

        {/* Right Property Inspector Sidebar */}
        <NodePropertyInspector />
      </div>

      {/* Property Action Choice Dialog */}
      {propertyPrompt?.isOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl flex flex-col gap-4 text-slate-850 dark:text-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Vincular Propriedade</h3>
              <p className="text-xs text-slate-500 mt-1">
                Deseja criar um bloco de <strong>Leitura</strong> ou <strong>Escrita</strong> para a propriedade <code className="font-mono text-sky-500 bg-sky-50 dark:bg-sky-950/40 px-1 rounded">{propertyPrompt.propertyName}</code>?
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => resolvePropertyPrompt('read')}
                className="flex-1 py-2 px-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer text-center"
              >
                Ler Propriedade
              </button>
              
              <button
                type="button"
                onClick={() => resolvePropertyPrompt('write')}
                className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer text-center"
              >
                Escrever Propriedade
              </button>
            </div>
            
            <button
              type="button"
              onClick={closePropertyPrompt}
              className="py-1.5 rounded-lg border border-slate-250 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-500 transition-colors cursor-pointer text-center"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
