import React, { useState } from 'react';
import {
  Boxes,
  Box,
  Variable,
  Search,
  ChevronRight,
  ChevronDown,
  Square,
  Circle,
  Type,
  Minus,
  Image as ImageIcon,
  Activity,
  Network
} from 'lucide-react';
import { inheritanceService } from '../../services/InheritanceService';
import { useObjectModelStore } from '../../store/useObjectModelStore';
import { useWidgetStore } from '../../store/useWidgetStore';
import { useScreenStore } from '../../store/useScreenStore';
import { useOpcStore } from '../../store/useOpcStore';
import { propertyRepo } from '../../repository/PropertyRepository';
import { cn } from '../../utils/cn';

type ExplorerTab = 'widgets' | 'generic-widgets' | 'variables' | 'tools' | 'opc-tags';

export const ScreenExplorerPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ExplorerTab>('widgets');
  const [search, setSearch] = useState('');
  const [expandedObjects, setExpandedObjects] = useState<Set<string>>(new Set());

  const { objects, templates } = useObjectModelStore();
  const { widgets } = useWidgetStore();
  const { nodes: opcNodes } = useOpcStore();
  const {
    selectedScreen,
    addWidgetInstance,
    addVariableRef,
    addImageElement,
    setActiveTool,
  } = useScreenStore();

  const deployedObjects = objects.filter((o) => o.isDeployed !== false);
  const opcTags = opcNodes.filter((n) => n.type === 'tag');

  const toggleObject = (objectId: string) => {
    setExpandedObjects((prev) => {
      const next = new Set(prev);
      if (next.has(objectId)) next.delete(objectId);
      else next.add(objectId);
      return next;
    });
  };

  const getTemplateName = (templateId: string) => {
    return templates.find((t) => t.id === templateId)?.name ?? 'Unknown';
  };

  const handleDragWidgetInstance = (e: React.DragEvent, objectId: string, widgetId: string) => {
    e.dataTransfer.setData('screen/widget-instance', JSON.stringify({ objectId, widgetId }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragVariableRef = (e: React.DragEvent, objectId: string, propertyName: string) => {
    e.dataTransfer.setData('screen/variable-ref', JSON.stringify({ objectId, propertyName }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // ─── Widgets Tab ────────────────────────────────────────────────────────────
  const renderWidgetsTab = () => (
    <div className="flex-1 overflow-y-auto">
      {deployedObjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <Boxes className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-2" />
          <p className="text-xs text-slate-500 font-medium">Nenhum objeto deployado</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-600 mt-1">
            Faça deploy de objetos no Simulador para usá-los aqui
          </p>
        </div>
      ) : (
        deployedObjects
          .filter((o) => o.name.toLowerCase().includes(search.toLowerCase()))
          .map((obj) => {
            const isExpanded = expandedObjects.has(obj.id);
            // Find associated widgets for this object, including inherited ones
            const associated = inheritanceService.getMergedAssociatedWidgets(obj.id, 'instance');
            const objWidgets = associated
              .map((aw) => ({ aw, widget: widgets.find((w) => w.id === aw.widgetId) }))
              .filter(({ widget }) => widget != null);

            return (
              <div key={obj.id} className="border-b border-slate-100 dark:border-slate-800/40">
                <button
                  onClick={() => toggleObject(obj.id)}
                  className="w-full flex items-center gap-1.5 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300 text-left font-semibold"
                >
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  <Box className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="flex-1 truncate">{obj.name}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{getTemplateName(obj.templateId)}</span>
                </button>

                {isExpanded && (
                  <div className="pl-6 pb-1 bg-slate-50/30 dark:bg-slate-950/10">
                    {objWidgets.length === 0 ? (
                      <p className="text-[11px] text-slate-400 dark:text-slate-600 px-3 py-1">Sem widgets associados</p>
                    ) : (
                      objWidgets.map(({ aw, widget }) => (
                        <div
                          key={aw.id}
                          draggable
                          onDragStart={(e) => handleDragWidgetInstance(e, obj.id, widget!.id)}
                          onClick={() => {
                            if (!selectedScreen) return;
                            addWidgetInstance(obj.id, widget!.id, 60, 60);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-violet-50 dark:hover:bg-violet-900/30 text-[11px] text-slate-600 dark:text-slate-400 hover:text-violet-700 dark:hover:text-violet-300 cursor-pointer rounded-md mx-1 transition-colors"
                          title="Clique para adicionar à tela"
                        >
                          <Activity className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                          <span className="truncate font-medium">{widget!.name}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
      )}
    </div>
  );

  // ─── Generic Widgets Tab ───────────────────────────────────────────────────
  const renderGenericWidgetsTab = () => {
    const filteredWidgets = widgets.filter((w) =>
      w.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleDragGenericWidget = (e: React.DragEvent, widgetId: string) => {
      e.dataTransfer.setData('screen/widget-instance', JSON.stringify({ widgetId }));
      e.dataTransfer.effectAllowed = 'copy';
    };

    return (
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredWidgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <Boxes className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-2" />
            <p className="text-xs text-slate-500 font-medium">Nenhum widget encontrado</p>
          </div>
        ) : (
          filteredWidgets.map((w) => (
            <div
              key={w.id}
              draggable
              onDragStart={(e) => handleDragGenericWidget(e, w.id)}
              onClick={() => {
                if (!selectedScreen) return;
                addWidgetInstance(undefined, w.id, 60, 60);
              }}
              className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 dark:bg-slate-800/40 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-xs text-slate-700 dark:text-slate-300 hover:text-violet-700 dark:hover:text-violet-300 cursor-pointer rounded-lg border border-slate-100 dark:border-slate-800/40 hover:border-violet-500/30 dark:hover:border-violet-500/30 transition-all font-medium"
              title="Clique ou arraste para adicionar à tela"
            >
              <Activity className="w-4 h-4 text-violet-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="truncate font-semibold text-slate-850 dark:text-slate-200">{w.name}</p>
                {w.description && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{w.description}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  // ─── Variables Tab ──────────────────────────────────────────────────────────
  const renderVariablesTab = () => (
    <div className="flex-1 overflow-y-auto">
      {deployedObjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <Variable className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-2" />
          <p className="text-xs text-slate-500 font-medium">Nenhum objeto deployado</p>
        </div>
      ) : (
        deployedObjects
          .filter((o) => o.name.toLowerCase().includes(search.toLowerCase()))
          .map((obj) => {
            const isExpanded = expandedObjects.has(`var-${obj.id}`);
            const ownProps = propertyRepo.getAll().filter((p) => p.targetId === obj.id);
            // Also get inherited props from template
            const template = templates.find((t) => t.id === obj.templateId);
            let allProps = [...ownProps];
            if (template) {
              const templateProps = propertyRepo.getAll().filter((p) => p.targetId === template.id);
              templateProps.forEach((tp) => {
                if (!allProps.find((p) => p.name === tp.name)) {
                  allProps.push(tp);
                }
              });
            }

            return (
              <div key={obj.id} className="border-b border-slate-100 dark:border-slate-800/40">
                <button
                  onClick={() => setExpandedObjects((prev) => {
                    const next = new Set(prev);
                    const k = `var-${obj.id}`;
                    if (next.has(k)) next.delete(k); else next.add(k);
                    return next;
                  })}
                  className="w-full flex items-center gap-1.5 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300 text-left font-semibold"
                >
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  <Box className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="flex-1 truncate">{obj.name}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{allProps.length} vars</span>
                </button>

                {isExpanded && (
                  <div className="pl-6 pb-1 bg-slate-50/30 dark:bg-slate-950/10">
                    {allProps.length === 0 ? (
                      <p className="text-[11px] text-slate-400 dark:text-slate-600 px-3 py-1">Sem propriedades</p>
                    ) : (
                      allProps.map((prop) => (
                        <div
                          key={prop.id}
                          draggable
                          onDragStart={(e) => handleDragVariableRef(e, obj.id, prop.name)}
                          onClick={() => {
                            if (!selectedScreen) return;
                            addVariableRef(obj.id, prop.name, 60, 60);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-[11px] text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 cursor-pointer rounded-md mx-1 transition-colors"
                          title={`${prop.dataType} · Clique para adicionar à tela`}
                        >
                          <Variable className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="flex-1 truncate font-medium">{prop.name}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{prop.dataType}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
      )}
    </div>
  );

  // ─── OPC Tags Tab ──────────────────────────────────────────────────────────
  const renderOpcTagsTab = () => (
    <div className="flex-1 overflow-y-auto">
      {opcTags.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <Network className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-2" />
          <p className="text-xs text-slate-500 font-medium">Nenhuma tag OPC cadastrada</p>
        </div>
      ) : (
        opcTags
          .filter((t) => t.path.toLowerCase().includes(search.toLowerCase()) || t.name.toLowerCase().includes(search.toLowerCase()))
          .map((tag) => (
            <div
              key={tag.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('screen/variable-ref', JSON.stringify({
                  objectId: 'OPC_VIRTUAL',
                  propertyName: tag.path
                }));
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => {
                if (!selectedScreen) return;
                addVariableRef('OPC_VIRTUAL', tag.path, 60, 60);
              }}
              className="flex items-center gap-1.5 px-3 py-2 hover:bg-sky-50 dark:hover:bg-sky-900/20 text-xs text-slate-600 dark:text-slate-405 hover:text-sky-700 dark:hover:text-sky-300 cursor-pointer rounded-lg border border-transparent hover:border-sky-500/20 transition-all font-medium"
              title={`${tag.dataType} · Clique ou arraste para adicionar`}
            >
              <Network className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="truncate block font-semibold text-slate-800 dark:text-slate-200">{tag.name}</span>
                <span className="text-[9px] text-slate-400 truncate block font-mono">{tag.path}</span>
              </div>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono shrink-0 bg-slate-100 dark:bg-slate-800 px-1 rounded">{tag.dataType}</span>
            </div>
          ))
      )}
    </div>
  );

  // ─── Tools Tab ──────────────────────────────────────────────────────────────
  const renderToolsTab = () => {
    const shapeTools = [
      { label: 'Retângulo', icon: Square, action: () => setActiveTool('rectangle'), color: 'text-blue-500 dark:text-blue-400' },
      { label: 'Círculo', icon: Circle, action: () => setActiveTool('circle'), color: 'text-emerald-500 dark:text-emerald-400' },
      { label: 'Texto', icon: Type, action: () => setActiveTool('text'), color: 'text-amber-500 dark:text-amber-400' },
      { label: 'Linha', icon: Minus, action: () => setActiveTool('line'), color: 'text-slate-500 dark:text-slate-400' },
    ];

    const handleImportImage = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,.svg';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const uri = ev.target?.result as string;
          if (uri) {
            addImageElement(uri, 80, 80);
          }
        };
        reader.readAsDataURL(file);
      };
      input.click();
    };

    return (
      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Formas</p>
        <div className="grid grid-cols-2 gap-1.5 mb-4">
          {shapeTools.map((tool) => (
            <button
              key={tool.label}
              onClick={tool.action}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/50 hover:border-violet-500/50 dark:hover:border-violet-500/50 transition-all group"
            >
              <tool.icon className={cn('w-5 h-5 transition-colors', tool.color, 'group-hover:scale-110')} />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 font-medium">{tool.label}</span>
            </button>
          ))}
        </div>

        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Mídia</p>
        <button
          onClick={handleImportImage}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/50 hover:border-violet-500/50 dark:hover:border-violet-500/50 transition-all text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium"
        >
          <ImageIcon className="w-4 h-4 text-violet-500 dark:text-violet-400" />
          Importar Imagem (PNG/SVG)
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Explorer de Recursos</p>

        {/* Tabs */}
        <div className="flex gap-0.5 bg-slate-100 dark:bg-slate-800/60 p-0.5 rounded-lg mb-2 overflow-x-auto">
          {([
            { id: 'widgets', label: 'Widgets', icon: Activity },
            { id: 'generic-widgets', label: 'Genéricos', icon: Boxes },
            { id: 'variables', label: 'Vars', icon: Variable },
            { id: 'opc-tags', label: 'OPC', icon: Network },
            { id: 'tools', label: 'Formas', icon: Square },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded-md text-[10px] font-semibold transition-colors shrink-0',
                activeTab === tab.id
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search (only for data tabs) */}
        {activeTab !== 'tools' && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-violet-500 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'widgets' && renderWidgetsTab()}
        {activeTab === 'generic-widgets' && renderGenericWidgetsTab()}
        {activeTab === 'variables' && renderVariablesTab()}
        {activeTab === 'opc-tags' && renderOpcTagsTab()}
        {activeTab === 'tools' && renderToolsTab()}
      </div>
    </div>
  );
};
