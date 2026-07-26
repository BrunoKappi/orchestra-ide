import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Sliders,
  FileText,
  GitBranch,
  Code,
  Clock,
  Plus,
  Trash2,
  Workflow,
  Database,
  MessageSquare,
  ExternalLink,
  Bell,
  Play,
  Activity,
  Radio,
  Layers,
  Zap,
  Info,
  Palette,
  Search,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderPlus,
  X,
} from 'lucide-react';
import { useFlowStore } from '../../store/useFlowStore';
import { useObjectModelStore } from '../../store/useObjectModelStore';
import type {
  ComparisonOperator,
  ComparisonCondition,
  IndustrialNodeType,
} from '../../types/flow';
import { cn } from '../../utils/cn';
import { inheritanceService } from '../../services/InheritanceService';

const COMPARISON_OPERATORS: Array<{ value: ComparisonOperator; label: string }> = [
  { value: 'Equal', label: 'Igual (==)' },
  { value: 'NotEqual', label: 'Diferente (!=)' },
  { value: 'GreaterThan', label: 'Maior (>)' },
  { value: 'LessThan', label: 'Menor (<)' },
  { value: 'GreaterOrEqual', label: 'Maior ou Igual (>=)' },
  { value: 'LessOrEqual', label: 'Menor ou Igual (<=)' },
  { value: 'Between', label: 'Entre (Between)' },
  { value: 'Contains', label: 'Contém (Contains)' },
  { value: 'StartsWith', label: 'Começa Com' },
  { value: 'EndsWith', label: 'Termina Com' },
  { value: 'AND', label: 'E Lógico (AND)' },
  { value: 'OR', label: 'OU Lógico (OR)' },
  { value: 'NOT', label: 'NÃO Lógico (NOT)' },
  { value: 'XOR', label: 'OU Exclusivo (XOR)' },
];


const getContrastColor = (hexOrRgba: string): string => {
  if (!hexOrRgba) return '';
  const cleanStr = hexOrRgba.replace(/\s+/g, '').toLowerCase();
  let r = 255, g = 255, b = 255;
  if (cleanStr.startsWith('#')) {
    const hex = cleanStr.replace('#', '');
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length >= 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
  } else if (cleanStr.startsWith('rgb')) {
    const match = cleanStr.match(/\d+/g);
    if (match && match.length >= 3) {
      r = parseInt(match[0]);
      g = parseInt(match[1]);
      b = parseInt(match[2]);
    }
  }
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#ffffff';
};

const PropertySelectorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelect: (propId: string, propName: string) => void;
  title: string;
}> = ({ isOpen, onClose, onSelect, title }) => {
  const { objects, templates } = useObjectModelStore();
  const [search, setSearch] = useState('');
  if (!isOpen) return null;
  const [dataTypeFilter, setDataTypeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleExpand = (nodeKey: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeKey]: prev[nodeKey] === false }));
  };

  const isExpanded = (nodeKey: string) => expandedNodes[nodeKey] !== false;

  const allProperties = React.useMemo(() => {
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

  const categoriesList = React.useMemo(() => {
    const set = new Set<string>();
    allProperties.forEach(p => set.add(p.category));
    return ['ALL', ...Array.from(set)];
  }, [allProperties]);

  const filteredProperties = React.useMemo(() => {
    return allProperties.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.fullName.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.ownerName.toLowerCase().includes(search.toLowerCase()) ||
        p.dataType.toLowerCase().includes(search.toLowerCase());
      
      const matchesType = dataTypeFilter === 'ALL' || p.dataType === dataTypeFilter;
      const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter;

      return matchesSearch && matchesType && matchesCat;
    });
  }, [allProperties, search, dataTypeFilter, categoryFilter]);

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case 'Boolean':
        return <Radio className="w-3.5 h-3.5 text-sky-500 shrink-0" />;
      case 'Integer':
      case 'Float':
        return <Activity className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
      case 'String':
        return <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      default:
        return <Database className="w-3.5 h-3.5 text-purple-500 shrink-0" />;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl h-[500px] flex flex-col shadow-2xl overflow-hidden text-slate-850 dark:text-slate-100">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-500" />
            <h3 className="font-bold text-xs">Seletor de Propriedade - {title}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-250 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por propriedade, objeto, template, descrição..."
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-xs outline-none focus:border-sky-500"
            />
          </div>
          <div className="flex gap-2 text-xs">
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-450 uppercase">Tipo de Dado</span>
              <select
                value={dataTypeFilter}
                onChange={(e) => setDataTypeFilter(e.target.value)}
                className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg outline-none"
              >
                <option value="ALL">Todos os Tipos</option>
                <option value="Boolean">Boolean</option>
                <option value="Integer">Integer</option>
                <option value="Float">Float</option>
                <option value="String">String</option>
              </select>
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-450 uppercase">Categoria</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg outline-none"
              >
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat === 'ALL' ? 'Todas as Categorias' : cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {search.trim() ? (
            <div className="space-y-1.5">
              {filteredProperties.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">Nenhuma propriedade encontrada.</p>
              ) : (
                filteredProperties.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelect(p.id, p.ownerType === 'instance' && p.ownerName === 'Tank101' ? `me.${p.name}` : p.fullName)}
                    className="w-full text-left p-2 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 hover:border-sky-500/50 hover:bg-sky-500/5 transition-all flex items-center justify-between gap-3 group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {renderTypeIcon(p.dataType)}
                      <div className="min-w-0">
                        <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-150 group-hover:text-sky-500 transition-colors">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {p.ownerName} ({p.ownerType === 'template' ? 'Template' : 'Instância'}) • {p.category}
                        </div>
                        {p.description && (
                          <div className="text-[10px] text-slate-450 dark:text-slate-500 italic truncate mt-0.5">
                            {p.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {p.engineeringUnit && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-semibold text-slate-650 dark:text-slate-350">
                          {p.engineeringUnit}
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950/50 text-[9px] font-bold text-sky-600 dark:text-sky-400 border border-sky-205/30 font-mono">
                        {p.dataType}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleExpand('templates')}
                  className="w-full flex items-center gap-1.5 py-1 px-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg text-xs font-bold text-slate-500 uppercase tracking-wider text-left cursor-pointer"
                >
                  {isExpanded('templates') ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <Folder className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                  <span>Templates</span>
                </button>

                {isExpanded('templates') && (
                  <div className="pl-4 space-y-2 border-l border-slate-200 dark:border-slate-800 ml-3 mt-1">
                    {templates.map(tmpl => {
                      const tmplProps = filteredProperties.filter(p => p.ownerId === tmpl.id && p.ownerType === 'template');
                      if (tmplProps.length === 0) return null;
                      const tmplKey = `tmpl_${tmpl.id}`;
                      const categories = Array.from(new Set(tmplProps.map(p => p.category)));

                      return (
                        <div key={tmpl.id} className="space-y-1">
                          <button
                            type="button"
                            onClick={() => toggleExpand(tmplKey)}
                            className="w-full flex items-center gap-1.5 py-1 px-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 text-left cursor-pointer"
                          >
                            {isExpanded(tmplKey) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            <span>{tmpl.name}</span>
                          </button>

                          {isExpanded(tmplKey) && (
                            <div className="pl-4 border-l border-slate-250 dark:border-slate-800/80 ml-2 mt-1 space-y-2">
                              {categories.map(cat => {
                                const catProps = tmplProps.filter(p => p.category === cat);
                                const catKey = `${tmplKey}_cat_${cat}`;
                                return (
                                  <div key={cat} className="space-y-1">
                                    <button
                                      type="button"
                                      onClick={() => toggleExpand(catKey)}
                                      className="w-full flex items-center gap-1.5 py-0.5 px-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded text-[11px] font-bold text-slate-550 dark:text-slate-400 text-left cursor-pointer"
                                    >
                                      {isExpanded(catKey) ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
                                      <span>{cat}</span>
                                    </button>

                                    {isExpanded(catKey) && (
                                      <div className="pl-3 space-y-1 mt-1">
                                        {catProps.map(p => (
                                          <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => onSelect(p.id, p.fullName)}
                                            className="w-full text-left p-1.5 px-2 rounded-lg hover:bg-sky-500/5 hover:text-sky-500 font-mono text-xs flex items-center justify-between cursor-pointer"
                                          >
                                            <span className="truncate">{p.name}</span>
                                            <span className="text-[10px] opacity-75 font-semibold font-sans">{p.dataType}</span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
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

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleExpand('objects')}
                  className="w-full flex items-center gap-1.5 py-1 px-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg text-xs font-bold text-slate-500 uppercase tracking-wider text-left cursor-pointer"
                >
                  {isExpanded('objects') ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <Folder className="w-4 h-4 text-sky-500 fill-sky-500/20" />
                  <span>Instâncias (Objetos)</span>
                </button>

                {isExpanded('objects') && (
                  <div className="pl-4 space-y-2 border-l border-slate-200 dark:border-slate-800 ml-3 mt-1">
                    {objects.map(obj => {
                      const objProps = filteredProperties.filter(p => p.ownerId === obj.id && p.ownerType === 'instance');
                      if (objProps.length === 0) return null;
                      const objKey = `obj_${obj.id}`;
                      const categories = Array.from(new Set(objProps.map(p => p.category)));

                      return (
                        <div key={obj.id} className="space-y-1">
                          <button
                            type="button"
                            onClick={() => toggleExpand(objKey)}
                            className="w-full flex items-center gap-1.5 py-1 px-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 text-left cursor-pointer"
                          >
                            {isExpanded(objKey) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                            <span>{obj.name}</span>
                          </button>

                          {isExpanded(objKey) && (
                            <div className="pl-4 border-l border-slate-250 dark:border-slate-800/80 ml-2 mt-1 space-y-2">
                              {categories.map(cat => {
                                const catProps = objProps.filter(p => p.category === cat);
                                const catKey = `${objKey}_cat_${cat}`;
                                return (
                                  <div key={cat} className="space-y-1">
                                    <button
                                      type="button"
                                      onClick={() => toggleExpand(catKey)}
                                      className="w-full flex items-center gap-1.5 py-0.5 px-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded text-[11px] font-bold text-slate-555 dark:text-slate-400 text-left cursor-pointer"
                                    >
                                      {isExpanded(catKey) ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
                                      <span>{cat}</span>
                                    </button>

                                    {isExpanded(catKey) && (
                                      <div className="pl-3 space-y-1 mt-1">
                                        {catProps.map(p => (
                                          <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => onSelect(p.id, obj.name === 'Tank101' ? `me.${p.name}` : p.fullName)}
                                            className="w-full text-left p-1.5 px-2 rounded-lg hover:bg-sky-500/5 hover:text-sky-500 font-mono text-xs flex items-center justify-between cursor-pointer"
                                          >
                                            <span className="truncate">{p.name}</span>
                                            <span className="text-[10px] opacity-75 font-semibold font-sans">{p.dataType}</span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
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
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

interface PropertySelectorProps {
  label: string;
  value: string;
  onSelect: (propId: string, propName: string) => void;
}

const PropertySelector: React.FC<PropertySelectorProps> = ({ label, value, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{label}</label>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex-1 flex items-center justify-between px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-lg text-left text-xs font-mono text-slate-800 dark:text-slate-200 shadow-sm hover:border-sky-500 transition-colors cursor-pointer"
        >
          <span className="truncate">{value || 'Selecionar propriedade...'}</span>
          <Database className="w-3.5 h-3.5 text-slate-450 dark:text-slate-500 shrink-0 ml-1.5" />
        </button>
      </div>
      
      {isOpen && (
        <PropertySelectorModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSelect={(id, name) => {
            onSelect(id, name);
            setIsOpen(false);
          }}
          title={label}
        />
      )}
    </div>
  );
};

export const NodePropertyInspector: React.FC = () => {
  const { selectedNodeId, selectedNodeMeta, updateNodeMetadata, activeFlowchart, flowcharts, openDesigner } =
    useFlowStore();
  const { mergedScripts } = useObjectModelStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [documentation, setDocumentation] = useState('');
  const [borderColor, setBorderColor] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('');
  const [textColor, setTextColor] = useState('');
  const [isIndustrialNode, setIsIndustrialNode] = useState(false);
  const [industrialType, setIndustrialType] = useState<IndustrialNodeType>('read_property');

  // Expression State
  const [conditions, setConditions] = useState<ComparisonCondition[]>([]);
  const [expressionLogic, setExpressionLogic] = useState<'AND' | 'OR'>('AND');

  // Assignment State
  const [targetProperty, setTargetProperty] = useState('');
  const [assignmentSourceType, setAssignmentSourceType] = useState<'constant' | 'property' | 'expression' | 'prev_node'>('constant');
  const [assignmentValue, setAssignmentValue] = useState('');

  // Timing State
  const [durationMs, setDurationMs] = useState(1000);
  const [timerMode, setTimerMode] = useState<'interval' | 'timeout' | 'cron'>('interval');
  const [cronExpression, setCronExpression] = useState('');

  // Target script & subflow
  const [targetScriptId, setTargetScriptId] = useState('');
  const [targetFlowchartId, setTargetFlowchartId] = useState('');

  // Alarm & events & history
  const [alarmRuleId, setAlarmRuleId] = useState('');
  const [raiseEventName, setRaiseEventName] = useState('');
  const [raiseEventPayload, setRaiseEventPayload] = useState('');
  const [queryHistoryProp, setQueryHistoryProp] = useState('');
  const [logLevel, setLogLevel] = useState<'info' | 'warning' | 'error'>('info');
  const [logMessage, setLogMessage] = useState('');
  const [comments, setComments] = useState('');
  const [groupColor, setGroupColor] = useState('#64748b');

  // Sync state when selectedNodeId or selectedNodeMeta changes
  useEffect(() => {
    if (!selectedNodeMeta) return;

    setName(selectedNodeMeta.name || selectedNodeId || '');
    setDescription(selectedNodeMeta.description || '');
    setDocumentation(selectedNodeMeta.documentation || '');
    setBorderColor(selectedNodeMeta.borderColor || selectedNodeMeta.color || '');
    setBackgroundColor(selectedNodeMeta.backgroundColor || '');
    setTextColor(selectedNodeMeta.textColor || '');
    setIsIndustrialNode(!!selectedNodeMeta.isIndustrialNode);
    setIndustrialType(selectedNodeMeta.industrialType || 'read_property');

    setConditions(selectedNodeMeta.expression?.conditions || []);
    setExpressionLogic(selectedNodeMeta.expression?.logic || 'AND');

    setTargetProperty(selectedNodeMeta.targetPropertyName || selectedNodeMeta.assignment?.targetProperty || '');
    setAssignmentSourceType((selectedNodeMeta.assignment?.sourceType as any) || 'constant');
    setAssignmentValue(selectedNodeMeta.assignment?.sourceValue || '');

    setDurationMs(selectedNodeMeta.durationMs || 1000);
    setTimerMode(selectedNodeMeta.timerMode || 'interval');
    setCronExpression(selectedNodeMeta.cronExpression || '');

    setTargetScriptId(selectedNodeMeta.targetScriptId || '');
    setTargetFlowchartId(selectedNodeMeta.targetFlowchartId || '');
    setAlarmRuleId(selectedNodeMeta.alarmRuleId || '');
    setRaiseEventName(selectedNodeMeta.raiseEventName || '');
    setRaiseEventPayload(selectedNodeMeta.raiseEventPayload || '');
    setQueryHistoryProp(selectedNodeMeta.queryHistoryProp || '');
    setLogLevel(selectedNodeMeta.logLevel || 'info');
    setLogMessage(selectedNodeMeta.logMessage || '');
    setComments(selectedNodeMeta.comments || '');
    setGroupColor(selectedNodeMeta.groupColor || '#64748b');
  }, [selectedNodeId, selectedNodeMeta]);

  if (!selectedNodeId) {
    return (
      <aside className="w-80 h-full border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-slate-500 dark:text-slate-400 select-none z-10 shrink-0 transition-colors duration-200">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-400 dark:text-slate-500 shadow-xs">
          <Sliders className="w-6 h-6 animate-pulse" />
        </div>
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Nenhum Elemento Selecionado</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
          Clique em qualquer nó ou conexão BPMN no canvas para editar seus metadados, parâmetros industriais e expressões.
        </p>
      </aside>
    );
  }

  const handleSaveGeneral = () => {
    if (!selectedNodeId) return;

    updateNodeMetadata(selectedNodeId, {
      name,
      description,
      documentation,
      color: borderColor,
      borderColor,
      backgroundColor,
      textColor,
      isIndustrialNode,
      industrialType: isIndustrialNode ? industrialType : undefined,
      targetPropertyName: targetProperty,
      assignment: {
        targetProperty,
        sourceType: assignmentSourceType,
        sourceValue: assignmentValue,
      },
      expression: {
        logic: expressionLogic,
        conditions,
      },
      durationMs,
      timerMode,
      cronExpression,
      targetScriptId,
      targetFlowchartId,
      alarmRuleId,
      raiseEventName,
      raiseEventPayload,
      queryHistoryProp,
      logLevel,
      logMessage,
      comments,
      groupColor,
    });
  };

  const handleBorderColorChange = (newColor: string) => {
    setBorderColor(newColor);
    updateNodeMetadata(selectedNodeId, { borderColor: newColor, color: newColor });
  };

  const handleBackgroundColorChange = (newColor: string) => {
    setBackgroundColor(newColor);
    const contrastText = getContrastColor(newColor);
    if (contrastText) {
      setTextColor(contrastText);
      updateNodeMetadata(selectedNodeId, { backgroundColor: newColor, textColor: contrastText });
    } else {
      updateNodeMetadata(selectedNodeId, { backgroundColor: newColor });
    }
  };

  const handleTextColorChange = (newColor: string) => {
    setTextColor(newColor);
    updateNodeMetadata(selectedNodeId, { textColor: newColor });
  };

  const handleResetColors = () => {
    setBorderColor('');
    setBackgroundColor('');
    setTextColor('');
    updateNodeMetadata(selectedNodeId, { borderColor: '', color: '', backgroundColor: '', textColor: '' });
  };

  const handleAddCondition = () => {
    const newCond: ComparisonCondition = {
      id: `cond_${Date.now()}`,
      leftOperand: 'me.Level',
      leftOperandType: 'property',
      operator: 'GreaterThan',
      rightOperand: '50.0',
      rightOperandType: 'constant',
    };
    const updated = [...conditions, newCond];
    setConditions(updated);
    if (selectedNodeId) {
      updateNodeMetadata(selectedNodeId, {
        expression: { logic: expressionLogic, conditions: updated },
      });
    }
  };

  const handleRemoveCondition = (condId: string) => {
    const updated = conditions.filter((c) => c.id !== condId);
    setConditions(updated);
    if (selectedNodeId) {
      updateNodeMetadata(selectedNodeId, {
        expression: { logic: expressionLogic, conditions: updated },
      });
    }
  };

  const handleUpdateCondition = (condId: string, updates: Partial<ComparisonCondition>) => {
    const updated = conditions.map((c) => (c.id === condId ? { ...c, ...updates } : c));
    setConditions(updated);
    if (selectedNodeId) {
      updateNodeMetadata(selectedNodeId, {
        expression: { logic: expressionLogic, conditions: updated },
      });
    }
  };

  return (
    <aside className="w-80 h-full border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col text-slate-800 dark:text-slate-200 select-none z-10 shrink-0 transition-colors duration-200">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Sliders className="w-4 h-4 text-sky-500 shrink-0" />
          <span className="text-xs font-bold truncate">Propriedades do Nó</span>
        </div>
        <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-300 px-2 py-0.5 rounded truncate">
          {selectedNodeId}
        </span>
      </div>

      {/* Content Form Scroll */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* Identificação Geral */}
        <div className="space-y-3">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-805 pb-1">
            <FileText className="w-3.5 h-3.5 text-sky-500" />
            <span>Identificação</span>
          </h4>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Nome no Canvas</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleSaveGeneral}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-sky-500 text-slate-850 dark:text-slate-200"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSaveGeneral}
              placeholder="Descrição curta..."
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-sky-500 text-slate-850 dark:text-slate-200"
            />
          </div>

          {/* Seção de Aparência */}
          <div className="space-y-3 pt-2">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-sky-500" />
              <span>Aparência do Bloco</span>
            </label>
            <div className="space-y-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              {/* Cor da Borda */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase">Cor da Borda</span>
                  {borderColor && (
                    <button type="button" onClick={() => handleBorderColorChange('')} className="text-[9px] text-rose-500 hover:underline cursor-pointer">Restaurar</button>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="color"
                    value={borderColor.startsWith('#') && borderColor.length === 7 ? borderColor : '#3b82f6'}
                    onChange={(e) => handleBorderColorChange(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-200 dark:border-slate-700 bg-transparent cursor-pointer p-0 shrink-0"
                  />
                  <input
                    type="text"
                    value={borderColor}
                    onChange={(e) => handleBorderColorChange(e.target.value)}
                    placeholder="ex: #3b82f6 ou rgba(...)"
                    className="flex-1 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono"
                  />
                </div>
              </div>

              {/* Cor de Fundo */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase">Cor de Fundo</span>
                  {backgroundColor && (
                    <button type="button" onClick={() => handleBackgroundColorChange('')} className="text-[9px] text-rose-500 hover:underline cursor-pointer">Restaurar</button>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="color"
                    value={backgroundColor.startsWith('#') && backgroundColor.length === 7 ? backgroundColor : '#ffffff'}
                    onChange={(e) => handleBackgroundColorChange(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-200 dark:border-slate-700 bg-transparent cursor-pointer p-0 shrink-0"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => handleBackgroundColorChange(e.target.value)}
                    placeholder="ex: #ffffff ou rgba(...)"
                    className="flex-1 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono"
                  />
                </div>
              </div>

              {/* Cor do Texto */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase">Cor do Texto</span>
                  {textColor && (
                    <button type="button" onClick={() => handleTextColorChange('')} className="text-[9px] text-rose-500 hover:underline cursor-pointer">Restaurar</button>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="color"
                    value={textColor.startsWith('#') && textColor.length === 7 ? textColor : '#000000'}
                    onChange={(e) => handleTextColorChange(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-200 dark:border-slate-700 bg-transparent cursor-pointer p-0 shrink-0"
                  />
                  <input
                    type="text"
                    value={textColor}
                    onChange={(e) => handleTextColorChange(e.target.value)}
                    placeholder="ex: #000000"
                    className="flex-1 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono"
                  />
                </div>
              </div>

              {/* Live Preview Swatch */}
              <div
                className="p-2 text-center rounded-lg border text-xs font-bold transition-all"
                style={{
                  borderColor: borderColor || '#cbd5e1',
                  backgroundColor: backgroundColor || 'transparent',
                  color: textColor || 'inherit',
                }}
              >
                Preview do Bloco
              </div>

              {/* Reset Button */}
              {(borderColor || backgroundColor || textColor) && (
                <button
                  type="button"
                  onClick={handleResetColors}
                  className="w-full py-1 rounded border border-slate-250 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Restaurar Cores do Tema
                </button>
              )}
            </div>
          </div>

          {/* Toggle Nó Industrial */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Bloco Industrial</span>
              <input
                type="checkbox"
                checked={isIndustrialNode}
                onChange={(e) => {
                  setIsIndustrialNode(e.target.checked);
                  updateNodeMetadata(selectedNodeId, { isIndustrialNode: e.target.checked });
                }}
                className="w-4 h-4 accent-sky-500 cursor-pointer"
              />
            </div>

            {isIndustrialNode && (
              <div className="space-y-1 pt-1">
                <label className="text-[9px] font-bold text-sky-600 dark:text-sky-400 uppercase">Tipo do Bloco</label>
                <select
                  value={industrialType}
                  onChange={(e) => {
                    const newType = e.target.value as IndustrialNodeType;
                    setIndustrialType(newType);
                    updateNodeMetadata(selectedNodeId, { industrialType: newType });
                  }}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sky-600 dark:text-sky-300 font-bold"
                >
                  <option value="read_property">Ler Propriedade</option>
                  <option value="write_property">Escrever Propriedade</option>
                  <option value="compare_variable">Comparar Variável</option>
                  <option value="execute_script">Executar Script</option>
                  <option value="call_flowchart">Chamar Fluxograma</option>
                  <option value="delay">Delay (Pausa)</option>
                  <option value="timer">Timer</option>
                  <option value="wait_alarm">Esperar Alarme</option>
                  <option value="ack_alarm">Reconhecer Alarme</option>
                  <option value="query_history">Consultar Histórico</option>
                  <option value="raise_event">Gerar Evento</option>
                  <option value="update_widget">Atualizar Widget</option>
                  <option value="update_faceplate">Atualizar Faceplate</option>
                  <option value="start_sim">Iniciar Simulação</option>
                  <option value="stop_sim">Parar Simulação</option>
                  <option value="execute_expression">Executar Expressão</option>
                  <option value="log">Log Mensagem</option>
                  <option value="comment">Comentário Libre</option>
                  <option value="logical_group">Grupo Lógico</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Editores Específicos de Blocos Industriais */}
        {isIndustrialNode && (
          <div className="space-y-4">
            {/* 1. Ler e Escrever Propriedades */}
            {(industrialType === 'read_property' || industrialType === 'write_property') && (
              <div className="space-y-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  <span>Vinculação de Propriedade</span>
                </h4>

                <PropertySelector
                  label="Referência / Variável"
                  value={targetProperty}
                  onSelect={(propId, propName) => {
                    setTargetProperty(propName);
                    updateNodeMetadata(selectedNodeId, {
                      targetPropertyId: propId,
                      targetPropertyName: propName,
                      assignment: {
                        targetProperty: propName,
                        sourceType: assignmentSourceType,
                        sourceValue: assignmentValue
                      }
                    });
                  }}
                />

                {industrialType === 'write_property' && (
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Tipo de Atribuição</label>
                      <select
                        value={assignmentSourceType}
                        onChange={(e) => {
                          setAssignmentSourceType(e.target.value as any);
                          handleSaveGeneral();
                        }}
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg outline-none text-xs"
                      >
                        <option value="constant">Valor Fixo / Constante</option>
                        <option value="property">Outra Propriedade</option>
                        <option value="expression">Expressão Dinâmica</option>
                        <option value="prev_node">Valor do Nó Anterior</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      {assignmentSourceType === 'property' ? (
                        <PropertySelector
                          label="Valor a Atribuir (Propriedade)"
                          value={assignmentValue}
                          onSelect={(_propId, propName) => {
                            setAssignmentValue(propName);
                            updateNodeMetadata(selectedNodeId, {
                              assignment: {
                                targetProperty,
                                sourceType: assignmentSourceType,
                                sourceValue: propName
                              }
                            });
                          }}
                        />
                      ) : (
                        <>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Valor a Atribuir</label>
                          <input
                            type="text"
                            value={assignmentValue}
                            onChange={(e) => setAssignmentValue(e.target.value)}
                            onBlur={handleSaveGeneral}
                            placeholder={assignmentSourceType === 'expression' ? "ex: me.Value * 1.8" : "ex: 120.5, true"}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-lg outline-none focus:border-sky-500 font-mono text-slate-800 dark:text-slate-200"
                          />
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. Comparar Variável (ゲートウェイ / Exclusive) */}
            {industrialType === 'compare_variable' && (
              <div className="space-y-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>Condição de Decisão</span>
                  </h4>
                  <button
                    onClick={handleAddCondition}
                    className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-650 dark:text-emerald-400 hover:bg-emerald-500/20 rounded-md text-[10px] font-bold border border-emerald-500/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Condição</span>
                  </button>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-[10px] text-slate-550 dark:text-slate-400 uppercase font-bold">Junção Lógica:</span>
                  <div className="flex bg-white dark:bg-slate-900 p-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => {
                        setExpressionLogic('AND');
                        updateNodeMetadata(selectedNodeId, { expression: { logic: 'AND', conditions } });
                      }}
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer',
                        expressionLogic === 'AND' ? 'bg-emerald-500 text-white' : 'text-slate-400 dark:text-slate-500'
                      )}
                    >
                      AND
                    </button>
                    <button
                      onClick={() => {
                        setExpressionLogic('OR');
                        updateNodeMetadata(selectedNodeId, { expression: { logic: 'OR', conditions } });
                      }}
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer',
                        expressionLogic === 'OR' ? 'bg-emerald-500 text-white' : 'text-slate-400 dark:text-slate-500'
                      )}
                    >
                      OR
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {conditions.length === 0 ? (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 italic text-center py-2">
                      Nenhuma regra. Clique em "+ Condição".
                    </p>
                  ) : (
                    conditions.map((cond, idx) => (
                      <div key={cond.id} className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 space-y-2 relative">
                        <div className="flex items-center justify-between text-[9px] text-slate-450 font-bold">
                          <span>Condição #{idx + 1}</span>
                          <button
                            onClick={() => handleRemoveCondition(cond.id)}
                            className="text-rose-500 hover:text-rose-600 p-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Left Operand Type */}
                        <div className="flex items-center justify-between text-[9px] font-bold text-slate-450 uppercase">
                          <span>Operando Esquerdo</span>
                          <select
                            value={cond.leftOperandType || 'property'}
                            onChange={(e) => handleUpdateCondition(cond.id, { leftOperandType: e.target.value as any })}
                            className="bg-transparent border-0 outline-none text-sky-500 font-bold text-[9px]"
                          >
                            <option value="property">Propriedade</option>
                            <option value="constant">Constante</option>
                          </select>
                        </div>

                        {/* Left Operand Selector / Input */}
                        {(cond.leftOperandType || 'property') === 'property' ? (
                          <PropertySelector
                            label=""
                            value={cond.leftOperand}
                            onSelect={(_propId, propName) => {
                              handleUpdateCondition(cond.id, { leftOperand: propName });
                            }}
                          />
                        ) : (
                          <input
                            type="text"
                            value={cond.leftOperand}
                            onChange={(e) => handleUpdateCondition(cond.id, { leftOperand: e.target.value })}
                            placeholder="Valor Constante"
                            className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-mono text-[11px]"
                          />
                        )}

                        {/* Operator */}
                        <select
                          value={cond.operator}
                          onChange={(e) =>
                            handleUpdateCondition(cond.id, { operator: e.target.value as ComparisonOperator })
                          }
                          className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-emerald-600 dark:text-emerald-300 text-[11px] font-bold"
                        >
                          {COMPARISON_OPERATORS.map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>

                        {/* Right Operand Type */}
                        <div className="flex items-center justify-between text-[9px] font-bold text-slate-450 uppercase">
                          <span>Operando Direito</span>
                          <select
                            value={cond.rightOperandType || 'constant'}
                            onChange={(e) => handleUpdateCondition(cond.id, { rightOperandType: e.target.value as any })}
                            className="bg-transparent border-0 outline-none text-sky-500 font-bold text-[9px]"
                          >
                            <option value="property">Propriedade</option>
                            <option value="constant">Constante</option>
                          </select>
                        </div>

                        {/* Right Operand Selector / Input */}
                        {(cond.rightOperandType || 'constant') === 'property' ? (
                          <PropertySelector
                            label=""
                            value={cond.rightOperand}
                            onSelect={(_propId, propName) => {
                              handleUpdateCondition(cond.id, { rightOperand: propName });
                            }}
                          />
                        ) : (
                          <input
                            type="text"
                            value={cond.rightOperand}
                            onChange={(e) => handleUpdateCondition(cond.id, { rightOperand: e.target.value })}
                            placeholder="Valor Constante"
                            className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-mono text-[11px]"
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 3. Executar Expressão */}
            {industrialType === 'execute_expression' && (
              <div className="space-y-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-teal-650 dark:text-teal-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 animate-pulse" />
                  <span>Expressão Matemática</span>
                </h4>
                
                <PropertySelector
                  label="Salvar Resultado Em (Propriedade)"
                  value={selectedNodeMeta?.targetPropertyName || ''}
                  onSelect={(propId, propName) => {
                    updateNodeMetadata(selectedNodeId, {
                      targetPropertyId: propId,
                      targetPropertyName: propName
                    });
                  }}
                />

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Expressão</label>
                  <input
                    type="text"
                    value={targetProperty}
                    onChange={(e) => setTargetProperty(e.target.value)}
                    onBlur={handleSaveGeneral}
                    placeholder="ex: (me.Value * 1.8) + 32"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-teal-500 text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
              </div>
            )}

            {/* 4. Executar Script */}
            {industrialType === 'execute_script' && (
              <div className="space-y-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-650 dark:text-purple-400 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5" />
                  <span>Configuração de Script</span>
                </h4>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Script Associado</label>
                  <select
                    value={targetScriptId}
                    onChange={(e) => {
                      setTargetScriptId(e.target.value);
                      updateNodeMetadata(selectedNodeId, { targetScriptId: e.target.value });
                    }}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-purple-600 dark:text-purple-300 font-semibold text-xs"
                  >
                    <option value="">-- Selecionar Script --</option>
                    {mergedScripts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.trigger})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* 5. Chamar Fluxograma */}
            {industrialType === 'call_flowchart' && (
              <div className="space-y-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-650 dark:text-indigo-400 flex items-center gap-1.5">
                  <Workflow className="w-3.5 h-3.5" />
                  <span>Sub-Fluxo do Processo</span>
                </h4>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Fluxograma Alvo</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={targetFlowchartId}
                      onChange={(e) => {
                        setTargetFlowchartId(e.target.value);
                        updateNodeMetadata(selectedNodeId, { targetFlowchartId: e.target.value });
                      }}
                      className="flex-1 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-indigo-600 dark:text-indigo-300 text-xs font-semibold"
                    >
                      <option value="">-- Selecionar Fluxo --</option>
                      {flowcharts
                        .filter((f) => f.id !== activeFlowchart?.id)
                        .map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                    </select>

                    {targetFlowchartId && (
                      <button
                        type="button"
                        onClick={() => openDesigner(targetFlowchartId)}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                        title="Abrir Fluxograma Filho"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 6. Delay (Pausa) */}
            {industrialType === 'delay' && (
              <div className="space-y-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Atraso / Delay</span>
                </h4>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Tempo de Pausa (ms)</label>
                  <input
                    type="number"
                    value={durationMs}
                    onChange={(e) => setDurationMs(Number(e.target.value))}
                    onBlur={handleSaveGeneral}
                    min={100}
                    step={100}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 font-mono"
                  />
                  <div className="text-[10px] text-slate-400 mt-0.5">Equivale a {(durationMs / 1000).toFixed(1)}s</div>
                </div>
              </div>
            )}

            {/* 7. Timer */}
            {industrialType === 'timer' && (
              <div className="space-y-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-cyan-650 dark:text-cyan-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Agendamento / Timer</span>
                </h4>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Modo do Timer</label>
                  <div className="flex bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    {(['interval', 'timeout', 'cron'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setTimerMode(m);
                          updateNodeMetadata(selectedNodeId, { timerMode: m });
                        }}
                        className={cn(
                          'flex-1 py-1 rounded text-[9px] font-bold uppercase transition-all cursor-pointer',
                          timerMode === m ? 'bg-cyan-500 text-white' : 'text-slate-400'
                        )}
                      >
                        {m === 'interval' ? 'Intervalo' : m === 'timeout' ? 'Timeout' : 'Cron'}
                      </button>
                    ))}
                  </div>
                </div>

                {timerMode === 'cron' ? (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Expressão CRON</label>
                    <input
                      type="text"
                      value={cronExpression}
                      onChange={(e) => setCronExpression(e.target.value)}
                      onBlur={handleSaveGeneral}
                      placeholder="*/5 * * * * (a cada 5min)"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-mono"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Tempo (ms)</label>
                    <input
                      type="number"
                      value={durationMs}
                      onChange={(e) => setDurationMs(Number(e.target.value))}
                      onBlur={handleSaveGeneral}
                      min={100}
                      step={500}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-mono"
                    />
                  </div>
                )}
              </div>
            )}

            {/* 8. Esperar Alarme e Reconhecer Alarme */}
            {(industrialType === 'wait_alarm' || industrialType === 'ack_alarm') && (
              <div className="space-y-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" />
                  <span>Configuração de Alarme</span>
                </h4>

                <PropertySelector
                  label="Regra do Alarme / Variável"
                  value={alarmRuleId}
                  onSelect={(propId, propName) => {
                    setAlarmRuleId(propName);
                    updateNodeMetadata(selectedNodeId, {
                      targetPropertyId: propId,
                      alarmRuleId: propName
                    });
                  }}
                />
              </div>
            )}

            {/* 9. Consultar Histórico */}
            {industrialType === 'query_history' && (
              <div className="space-y-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-violet-650 dark:text-violet-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Consulta ao Historian</span>
                </h4>
                <PropertySelector
                  label="Propriedade a Consultar"
                  value={queryHistoryProp}
                  onSelect={(propId, propName) => {
                    setQueryHistoryProp(propName);
                    updateNodeMetadata(selectedNodeId, {
                      targetPropertyId: propId,
                      queryHistoryProp: propName
                    });
                  }}
                />
              </div>
            )}

            {/* 10. Gerar Evento */}
            {industrialType === 'raise_event' && (
              <div className="space-y-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5" />
                  <span>Gerador de Evento</span>
                </h4>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Nome do Evento</label>
                  <input
                    type="text"
                    value={raiseEventName}
                    onChange={(e) => setRaiseEventName(e.target.value)}
                    onBlur={handleSaveGeneral}
                    placeholder="ex: OnBatchCompleted"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Payload (JSON)</label>
                  <textarea
                    value={raiseEventPayload}
                    onChange={(e) => setRaiseEventPayload(e.target.value)}
                    onBlur={handleSaveGeneral}
                    rows={2}
                    placeholder='{"batchId": 45, "status": "OK"}'
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-mono resize-none text-[11px]"
                  />
                </div>
              </div>
            )}

            {/* 11. Atualizar Widget / Faceplate */}
            {(industrialType === 'update_widget' || industrialType === 'update_faceplate') && (
              <div className="space-y-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Comando de Supervisório</span>
                </h4>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">ID do Componente visual</label>
                  <input
                    type="text"
                    value={targetProperty}
                    onChange={(e) => setTargetProperty(e.target.value)}
                    onBlur={handleSaveGeneral}
                    placeholder="ex: widget_valve_10"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-mono"
                  />
                </div>
              </div>
            )}

            {/* 12. Iniciar / Parar Simulação */}
            {(industrialType === 'start_sim' || industrialType === 'stop_sim') && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1 text-center">
                <Play className="w-6 h-6 mx-auto text-emerald-500" />
                <div className="font-semibold mt-1">Simulação de Sinais</div>
                <div className="text-[10px] text-slate-500">Este nó dispara/para simulações do Sinal Mock do Orquestra ao passar pela execução.</div>
              </div>
            )}

            {/* 13. Log Mensagem */}
            {industrialType === 'log' && (
              <div className="space-y-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-sky-650 dark:text-sky-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>Registrador de Log</span>
                </h4>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Nível do Log</label>
                  <select
                    value={logLevel}
                    onChange={(e) => {
                      setLogLevel(e.target.value as any);
                      updateNodeMetadata(selectedNodeId, { logLevel: e.target.value as any });
                    }}
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-bold"
                  >
                    <option value="info">INFORMAÇÃO (Info)</option>
                    <option value="warning">ALERTA (Warning)</option>
                    <option value="error">ERRO (Error)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Mensagem a Registrar</label>
                  <input
                    type="text"
                    value={logMessage}
                    onChange={(e) => setLogMessage(e.target.value)}
                    onBlur={handleSaveGeneral}
                    placeholder="Mensagem do log..."
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                  />
                </div>
              </div>
            )}

            {/* 14. Comentário Libre */}
            {industrialType === 'comment' && (
              <div className="space-y-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Texto do Comentário</span>
                </h4>
                <div className="space-y-1">
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    onBlur={handleSaveGeneral}
                    rows={4}
                    placeholder="Escreva anotações livres para este nó..."
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-sans resize-none text-[11px]"
                  />
                </div>
              </div>
            )}

            {/* 15. Grupo Lógico */}
            {industrialType === 'logical_group' && (
              <div className="space-y-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Grupo Lógico</span>
                </h4>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Cor do Grupo</label>
                  <input
                    type="color"
                    value={groupColor}
                    onChange={(e) => setGroupColor(e.target.value)}
                    onBlur={handleSaveGeneral}
                    className="w-full h-8 bg-transparent cursor-pointer border-0 outline-none rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Campo de Documentação Técnica */}
        <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-slate-500" />
            <span>Documentação Adicional</span>
          </label>
          <textarea
            value={documentation}
            onChange={(e) => setDocumentation(e.target.value)}
            onBlur={handleSaveGeneral}
            rows={3}
            placeholder="Documentação operacional e notas adicionais..."
            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-sky-500 text-slate-800 dark:text-slate-200 resize-none text-[11px]"
          />
        </div>
      </div>
    </aside>
  );
};
