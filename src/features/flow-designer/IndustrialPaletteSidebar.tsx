import React, { useState } from 'react';
import {
  Cpu,
  Layers,
  Search,
  Database,
  Sliders,
  Code,
  Clock,
  Bell,
  Play,
  Activity,
  FileText,
  MessageSquare,
  FolderPlus,
  GitBranch,
  StopCircle,
  Workflow,
  Radio,
  Zap,
  Info,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import type { IndustrialNodeType, FlowContextType } from '../../types/flow';
import { useObjectModelStore } from '../../store/useObjectModelStore';
import { useFlowStore } from '../../store/useFlowStore';
import { cn } from '../../utils/cn';
import { inheritanceService } from '../../services/InheritanceService';

interface IndustrialPaletteSidebarProps {
  contextType: FlowContextType;
  targetId: string | null;
}

interface IndustrialNodeDef {
  type: IndustrialNodeType;
  label: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const INDUSTRIAL_NODES: IndustrialNodeDef[] = [
  { type: 'read_property', label: 'Ler Propriedade', category: 'Dados & Propriedades', description: 'Lê o valor de uma propriedade de objeto', icon: Database, color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/30 hover:border-sky-400 dark:hover:border-sky-400/50' },
  { type: 'write_property', label: 'Escrever Propriedade', category: 'Dados & Propriedades', description: 'Escreve um valor fixo ou calculado em uma propriedade', icon: Sliders, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 hover:border-amber-400 dark:hover:border-amber-400/50' },
  { type: 'compare_variable', label: 'Comparar Variável', category: 'Lógica & Decisão', description: 'Avalia expressões compostas com operadores ==, !=, >, <, Between, Contains', icon: GitBranch, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 hover:border-emerald-400 dark:hover:border-emerald-400/50' },
  { type: 'execute_expression', label: 'Executar Expressão', category: 'Lógica & Decisão', description: 'Executa cálculo matemático ou lógico intermediário', icon: Zap, color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/30 hover:border-teal-400 dark:hover:border-teal-400/50' },
  { type: 'execute_script', label: 'Executar Script', category: 'Automação & Código', description: 'Executa um script de código registrado no objeto', icon: Code, color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30 hover:border-purple-400 dark:hover:border-purple-400/50' },
  { type: 'call_flowchart', label: 'Chamar Fluxograma', category: 'Automação & Código', description: 'Executa um sub-fluxograma de processo', icon: Workflow, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 hover:border-indigo-400 dark:hover:border-indigo-400/50' },
  { type: 'delay', label: 'Delay', category: 'Tempo & Eventos', description: 'Pausa a execução do fluxo por um tempo determinado em ms', icon: Clock, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 hover:border-blue-400 dark:hover:border-blue-400/50' },
  { type: 'timer', label: 'Timer', category: 'Tempo & Eventos', description: 'Temporizador periódico ou agendamento cron', icon: Clock, color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/30 hover:border-cyan-400 dark:hover:border-cyan-400/50' },
  { type: 'wait_alarm', label: 'Esperar Alarme', category: 'Alarmes & Eventos', description: 'Bloqueia o fluxo até um alarme específico ser ativado/desativado', icon: Bell, color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 hover:border-rose-400 dark:hover:border-rose-400/50' },
  { type: 'ack_alarm', label: 'Reconhecer Alarme', category: 'Alarmes & Eventos', description: 'Reconhece automaticamente um alarme ativo', icon: Bell, color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 hover:border-red-400 dark:hover:border-red-400/50' },
  { type: 'query_history', label: 'Consultar Histórico', category: 'Dados & Propriedades', description: 'Consulta dados armazenados no Historian', icon: Activity, color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/30 hover:border-violet-400 dark:hover:border-violet-400/50' },
  { type: 'raise_event', label: 'Gerar Evento', category: 'Tempo & Eventos', description: 'Dispara um evento customizado no sistema', icon: Radio, color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30 hover:border-orange-400 dark:hover:border-orange-400/50' },
  { type: 'update_widget', label: 'Atualizar Widget', category: 'Supervisório & IHM', description: 'Dispara atualização visual em um Widget supervisório', icon: Layers, color: 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-500/10 border-pink-200 dark:border-pink-500/30 hover:border-pink-400 dark:hover:border-pink-400/50' },
  { type: 'update_faceplate', label: 'Atualizar Faceplate', category: 'Supervisório & IHM', description: 'Atualiza o estado de um Faceplate de operação', icon: FileText, color: 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-500/10 border-fuchsia-200 dark:border-fuchsia-500/30 hover:border-fuchsia-400 dark:hover:border-fuchsia-400/50' },
  { type: 'start_sim', label: 'Iniciar Simulação', category: 'Controle de Simulação', description: 'Inicia o motor de simulação de dados', icon: Play, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 hover:border-emerald-400 dark:hover:border-emerald-400/50' },
  { type: 'stop_sim', label: 'Parar Simulação', category: 'Controle de Simulação', description: 'Interrompe a simulação em tempo real', icon: StopCircle, color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 hover:border-rose-400 dark:hover:border-rose-400/50' },
  { type: 'log', label: 'Log', category: 'Documentação & Utilidades', description: 'Grava uma mensagem de log no sistema', icon: Info, color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/30 hover:border-sky-400 dark:hover:border-sky-400/50' },
  { type: 'comment', label: 'Comentário', category: 'Documentação & Utilidades', description: 'Insere anotação de texto livre no processo', icon: MessageSquare, color: 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/30 hover:border-slate-400 dark:hover:border-slate-400/50' },
  { type: 'logical_group', label: 'Grupo Lógico', category: 'Documentação & Utilidades', description: 'Agrupa visualmente blocos relacionados com cor customizada', icon: FolderPlus, color: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/30 border-slate-200 dark:border-slate-650' },
];

export const IndustrialPaletteSidebar: React.FC<IndustrialPaletteSidebarProps> = ({
  contextType,
  targetId,
}) => {
  const [activeTab, setActiveTab] = useState<'nodes' | 'library'>('nodes');
  const [searchQuery, setSearchQuery] = useState('');
  const [globalPropSearch, setGlobalPropSearch] = useState('');

  // Library filters & collapsibles
  const [libDataTypeFilter, setLibDataTypeFilter] = useState('ALL');
  const [libCategoryFilter, setLibCategoryFilter] = useState('ALL');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const { objects, templates, selectedTemplate, selectedObject } = useObjectModelStore();

  const currentEntityName =
    contextType === 'template'
      ? selectedTemplate?.name || 'Template'
      : contextType === 'instance'
      ? selectedObject?.name || 'Instância'
      : 'Projetos Globais';

  const currentProperties = React.useMemo(() => {
    if (contextType === 'global' || !targetId) return [];
    return inheritanceService.getMergedProperties(targetId, contextType === 'template' ? 'template' : 'instance');
  }, [targetId, contextType, objects, templates]);

  const currentScripts = React.useMemo(() => {
    if (contextType === 'global' || !targetId) return [];
    return inheritanceService.getMergedScripts(targetId, contextType === 'template' ? 'template' : 'instance');
  }, [targetId, contextType, objects, templates]);

  const filteredNodes = INDUSTRIAL_NODES.filter(
    (n) =>
      n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(filteredNodes.map((n) => n.category)));

  // Global properties and scripts across all templates & objects
  const allGlobalProperties = React.useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      fullName: string;
      dataType: string;
      description: string;
      category: string;
      engineeringUnit: string;
      ownerName: string;
      ownerType: 'template' | 'instance';
      ownerId: string;
    }> = [];

    templates.forEach(t => {
      const props = inheritanceService.getMergedProperties(t.id, 'template');
      props.forEach(p => {
        list.push({
          id: p.id,
          name: p.name,
          fullName: `${t.name}.${p.name}`,
          dataType: p.dataType,
          description: p.description || '',
          category: p.category || 'Geral',
          engineeringUnit: p.historyConfig?.engineeringUnit || '',
          ownerName: t.name,
          ownerType: 'template',
          ownerId: t.id
        });
      });
    });

    objects.forEach(obj => {
      const props = inheritanceService.getMergedProperties(obj.id, 'instance');
      props.forEach(p => {
        list.push({
          id: p.id,
          name: p.name,
          fullName: `${obj.name}.${p.name}`,
          dataType: p.dataType,
          description: p.description || '',
          category: p.category || 'Geral',
          engineeringUnit: p.historyConfig?.engineeringUnit || '',
          ownerName: obj.name,
          ownerType: 'instance',
          ownerId: obj.id
        });
      });
    });

    return list;
  }, [objects, templates]);

  const allGlobalScripts = React.useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      fullName: string;
      trigger: string;
      description: string;
      ownerName: string;
      ownerType: 'template' | 'instance';
      ownerId: string;
    }> = [];

    templates.forEach(t => {
      const scripts = inheritanceService.getMergedScripts(t.id, 'template');
      scripts.forEach(s => {
        list.push({
          id: s.id,
          name: s.name,
          fullName: `${t.name}.${s.name}`,
          trigger: s.trigger,
          description: s.description || '',
          ownerName: t.name,
          ownerType: 'template',
          ownerId: t.id
        });
      });
    });

    objects.forEach(obj => {
      const scripts = inheritanceService.getMergedScripts(obj.id, 'instance');
      scripts.forEach(s => {
        list.push({
          id: s.id,
          name: s.name,
          fullName: `${obj.name}.${s.name}`,
          trigger: s.trigger,
          description: s.description || '',
          ownerName: obj.name,
          ownerType: 'instance',
          ownerId: obj.id
        });
      });
    });

    return list;
  }, [objects, templates]);

  const filteredGlobalProperties = React.useMemo(() => {
    return allGlobalProperties.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(globalPropSearch.toLowerCase()) ||
        p.ownerName.toLowerCase().includes(globalPropSearch.toLowerCase()) ||
        p.fullName.toLowerCase().includes(globalPropSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(globalPropSearch.toLowerCase());
      
      const matchesType = libDataTypeFilter === 'ALL' || p.dataType === libDataTypeFilter;
      const matchesCat = libCategoryFilter === 'ALL' || p.category === libCategoryFilter;

      return matchesSearch && matchesType && matchesCat;
    });
  }, [allGlobalProperties, globalPropSearch, libDataTypeFilter, libCategoryFilter]);

  const filteredGlobalScripts = React.useMemo(() => {
    return allGlobalScripts.filter(s => {
      return (
        s.name.toLowerCase().includes(globalPropSearch.toLowerCase()) ||
        s.ownerName.toLowerCase().includes(globalPropSearch.toLowerCase()) ||
        s.fullName.toLowerCase().includes(globalPropSearch.toLowerCase()) ||
        s.description.toLowerCase().includes(globalPropSearch.toLowerCase())
      );
    });
  }, [allGlobalScripts, globalPropSearch]);

  return (
    <aside className="w-80 h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col text-slate-850 dark:text-slate-200 select-none z-10 shrink-0 transition-colors duration-200">
      {/* Sidebar Header Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/60 p-1">
        <button
          onClick={() => setActiveTab('nodes')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer',
            activeTab === 'nodes'
              ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Blocos BPMN</span>
        </button>

        <button
          onClick={() => setActiveTab('library')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer',
            activeTab === 'library'
              ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Biblioteca</span>
        </button>
      </div>

      {/* Tab 1: Industrial & BPMN Nodes */}
      {activeTab === 'nodes' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search Bar */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar nós industriais..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Palette Content Scroll */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {categories.map((cat) => (
              <div key={cat} className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-505 dark:text-slate-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-1">
                  <ChevronRight className="w-3 h-3 text-sky-500" />
                  <span>{cat}</span>
                </h4>

                <div className="grid grid-cols-1 gap-1.5">
                  {filteredNodes
                    .filter((n) => n.category === cat)
                    .map((node) => {
                      const IconComp = node.icon;
                      return (
                        <div
                          key={node.type}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData(
                              'application/react-flow-node',
                              JSON.stringify({ type: node.type, label: node.label })
                            );
                          }}
                          onClick={() => {
                            useFlowStore.getState().addIndustrialNode(node.type, node.label);
                          }}
                          className={cn(
                            'group flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing hover:scale-[1.01]',
                            node.color
                          )}
                          title={`${node.label}: ${node.description} (Clique para inserir ou arraste)`}
                        >
                          <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 shrink-0">
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-semibold truncate text-slate-800 dark:text-slate-100">
                              {node.label}
                            </h5>
                            <p className="text-[10px] text-slate-505 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {node.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Context-Aware Property & Resource Library */}
      {activeTab === 'library' && (
        <div className="flex-1 flex flex-col overflow-hidden p-3 space-y-3">
          <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-850/40 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400">Contexto Ativo</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 uppercase">
                {contextType}
              </span>
            </div>
            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{currentEntityName}</p>
          </div>

          {contextType !== 'global' && targetId ? (
            <div className="flex-1 flex flex-col overflow-hidden space-y-4">
              {/* Properties Section */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-850 shrink-0">
                  <Database className="w-3 h-3 text-sky-500" />
                  <span>Propriedades do Objeto</span>
                </h4>
                {currentProperties.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-2 shrink-0">Nenhuma propriedade cadastrada.</p>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-2 mt-2 pr-1">
                    {/* Grouped by Category */}
                    {Object.entries(
                      currentProperties.reduce<Record<string, typeof currentProperties>>((acc, prop) => {
                        const cat = prop.category || 'Geral';
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(prop);
                        return acc;
                      }, {})
                    ).map(([cat, props]) => {
                      const isCollapsed = collapsedCategories[cat];
                      return (
                        <div key={cat} className="space-y-1.5">
                          <button
                            type="button"
                            onClick={() => toggleCategory(cat)}
                            className="w-full flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                          >
                            {isCollapsed ? <ChevronRight className="w-3 h-3 text-sky-500" /> : <ChevronDown className="w-3 h-3 text-sky-500" />}
                            <span>{cat} ({props.length})</span>
                          </button>

                          {!isCollapsed && (
                            <div className="pl-2 space-y-1">
                              {props.map((prop) => {
                                const propNameInCanvas = contextType === 'instance' && currentEntityName === 'Tank101' ? `me.${prop.name}` : `${currentEntityName}.${prop.name}`;
                                return (
                                  <div
                                    key={prop.id}
                                    draggable={true}
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData('application/react-flow-node', JSON.stringify({
                                        type: 'ask_property',
                                        label: prop.name,
                                        extraMetadata: {
                                          propertyId: prop.id,
                                          propertyName: propNameInCanvas
                                        }
                                      }));
                                    }}
                                    onDoubleClick={() => {
                                      useFlowStore.getState().showPropertyPrompt(prop.id, propNameInCanvas);
                                    }}
                                    className="group flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:border-sky-500/30 cursor-grab active:cursor-grabbing transition-colors"
                                    title="Duplo clique ou arraste para criar bloco de Leitura ou Escrita"
                                  >
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 truncate">{prop.name}</span>
                                      {prop.description && (
                                        <span className="text-[9px] text-slate-400 truncate">{prop.description}</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {prop.historyConfig?.engineeringUnit && (
                                        <span className="text-[9px] font-medium text-slate-400 font-mono">
                                          {prop.historyConfig.engineeringUnit}
                                        </span>
                                      )}
                                      <span className="text-[9px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
                                        {prop.dataType}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Scripts Section */}
              <div className="h-44 flex flex-col overflow-hidden border-t border-slate-200 dark:border-slate-800 pt-2 shrink-0">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-850 shrink-0">
                  <Code className="w-3 h-3 text-purple-500" />
                  <span>Scripts Disponíveis</span>
                </h4>
                {currentScripts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-2 shrink-0">Nenhum script associado.</p>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-1.5 mt-2 pr-1">
                    {currentScripts.map((script) => (
                      <div
                        key={script.id}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/react-flow-node', JSON.stringify({
                            type: 'execute_script',
                            label: `Executar ${script.name}`,
                            extraMetadata: {
                              targetScriptId: script.id
                            }
                          }));
                        }}
                        onDoubleClick={() => {
                          useFlowStore.getState().addIndustrialNode('execute_script', `Executar ${script.name}`, {
                            targetScriptId: script.id
                          });
                        }}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 flex flex-col gap-1 hover:border-purple-500/30 cursor-grab active:cursor-grabbing transition-colors"
                        title="Duplo clique ou arraste para criar bloco de Script"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-semibold text-purple-650 dark:text-purple-300 truncate">{script.name}</span>
                          <span className="text-[9px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 px-1 rounded">{script.trigger}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Global Context: Integrated Property & Script Browser with filters */
            <div className="flex-1 flex flex-col overflow-hidden space-y-3">
              {/* Pesquisa e Filtros */}
              <div className="space-y-2 bg-slate-50/50 dark:bg-slate-950/30 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={globalPropSearch}
                    onChange={(e) => setGlobalPropSearch(e.target.value)}
                    placeholder="Pesquisar objeto, prop, script..."
                    className="w-full pl-8 pr-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {/* Tipo de Dado */}
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[8px]">Tipo de Dado</span>
                    <select
                      value={libDataTypeFilter}
                      onChange={(e) => setLibDataTypeFilter(e.target.value)}
                      className="w-full px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded outline-none text-slate-800 dark:text-slate-200"
                    >
                      <option value="ALL">Todos os Tipos</option>
                      <option value="Boolean">Boolean</option>
                      <option value="Integer">Integer</option>
                      <option value="Float">Float</option>
                      <option value="String">String</option>
                    </select>
                  </div>

                  {/* Categoria */}
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[8px]">Categoria</span>
                    <select
                      value={libCategoryFilter}
                      onChange={(e) => setLibCategoryFilter(e.target.value)}
                      className="w-full px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded outline-none text-slate-800 dark:text-slate-200"
                    >
                      <option value="ALL">Todas</option>
                      {Array.from(new Set(allGlobalProperties.map(p => p.category))).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* Properties Section */}
                <div className="space-y-1.5">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                    <span>Propriedades ({filteredGlobalProperties.length})</span>
                  </h5>
                  {filteredGlobalProperties.length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic p-1">Nenhuma propriedade correspondente.</div>
                  ) : (
                    <div className="space-y-1.5">
                      {filteredGlobalProperties.map((item) => (
                        <div
                          key={item.id + '_' + item.fullName}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('application/react-flow-node', JSON.stringify({
                              type: 'ask_property',
                              label: item.name,
                              extraMetadata: {
                                propertyId: item.id,
                                propertyName: item.fullName
                              }
                            }));
                          }}
                          onDoubleClick={() => {
                            useFlowStore.getState().showPropertyPrompt(item.id, item.fullName);
                          }}
                          className="flex flex-col gap-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:border-sky-500/30 cursor-grab active:cursor-grabbing transition-colors"
                          title="Duplo clique ou arraste para vincular"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-mono font-semibold text-sky-600 dark:text-sky-400 truncate">{item.name}</span>
                            <span className="text-[8px] font-bold bg-slate-250 dark:bg-slate-800 text-slate-650 dark:text-slate-450 px-1.5 py-0.5 rounded uppercase">
                              {item.dataType}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-slate-500 dark:text-slate-400">
                            <span className="truncate">Objeto: {item.ownerName} ({item.ownerType === 'template' ? 'Template' : 'Instância'})</span>
                            {item.engineeringUnit && <span>{item.engineeringUnit}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scripts Section */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                    <span>Scripts ({filteredGlobalScripts.length})</span>
                  </h5>
                  {filteredGlobalScripts.length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic p-1">Nenhum script correspondente.</div>
                  ) : (
                    <div className="space-y-1.5">
                      {filteredGlobalScripts.map((item) => (
                        <div
                          key={item.id + '_' + item.fullName}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('application/react-flow-node', JSON.stringify({
                              type: 'execute_script',
                              label: `Executar ${item.name}`,
                              extraMetadata: {
                                targetScriptId: item.id
                              }
                            }));
                          }}
                          onDoubleClick={() => {
                            useFlowStore.getState().addIndustrialNode('execute_script', `Executar ${item.name}`, {
                              targetScriptId: item.id
                            });
                          }}
                          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 flex flex-col gap-1 hover:border-purple-500/30 cursor-grab active:cursor-grabbing transition-colors"
                          title="Duplo clique ou arraste para criar bloco script"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-semibold text-purple-650 dark:text-purple-300 truncate">{item.name}</span>
                            <span className="text-[8px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-650 dark:text-purple-400 px-1.5 py-0.5 rounded uppercase">{item.trigger}</span>
                          </div>
                          <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
                            Objeto: {item.ownerName} ({item.ownerType === 'template' ? 'Template' : 'Instância'})
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
