import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Gauge, Check, TrendingUp, Zap, Bell, BarChart3, ChevronDown, Target } from 'lucide-react';
import { useObjectModelStore } from '../../../store/useObjectModelStore';
import { useProcessAlertStore } from '../../../store/useProcessAlertStore';
import { inheritanceService } from '../../../services/InheritanceService';
import { cn } from '../../../utils/cn';
import type { CommandCardConfig, AlertCardConfig, KpiCardConfig } from '../types';

type ActiveTab = 'equipment' | 'trends' | 'command' | 'alert' | 'kpi';

interface ObjectSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Callback for equipment tab */
  onSelect: (objectId: string) => void;
  alreadySelectedIds?: string[];
  initialSelectedProps?: Array<{
    objectId: string;
    propertyName: string;
    objectName: string;
    propertyLabel: string;
  }>;
  /** Callback for trend tab */
  onSelectTrend?: (
    properties: Array<{
      objectId: string;
      propertyName: string;
      objectName: string;
      propertyLabel: string;
    }>
  ) => void;
  /** Callback for command tab */
  onSelectCommand?: (config: CommandCardConfig) => void;
  /** Callback for alert tab */
  onSelectAlert?: (config: AlertCardConfig) => void;
  /** Callback for KPI tab */
  onSelectKpi?: (config: KpiCardConfig) => void;
}

const WRITABLE_TYPES = ['Boolean', 'Enum', 'Float', 'Integer'];
const READ_ONLY_NAMES = ['Tag', 'Description', 'Area', 'Level', 'Volume', 'Mass', 'Capacity', 'Status'];
const ENUM_OPTIONS_MAP: Record<string, string[]> = {
  OperationalMode: ['Automático', 'Manual', 'Manutenção'],
};

const TAB_BUTTONS: Array<{ id: ActiveTab; label: string; icon: React.ReactNode }> = [
  { id: 'equipment', label: 'Equipamentos', icon: <Gauge className="w-3.5 h-3.5" /> },
  { id: 'trends', label: 'Tendências', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { id: 'command', label: 'Comandos', icon: <Zap className="w-3.5 h-3.5" /> },
  { id: 'alert', label: 'Alertas Locais', icon: <Bell className="w-3.5 h-3.5" /> },
  { id: 'kpi', label: 'Indicadores', icon: <BarChart3 className="w-3.5 h-3.5" /> },
];

export const ObjectSelectorModal: React.FC<ObjectSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  alreadySelectedIds = [],
  initialSelectedProps = [],
  onSelectTrend,
  onSelectCommand,
  onSelectAlert,
  onSelectKpi,
}) => {
  const { objects, templates, simulatedValues } = useObjectModelStore();
  const { occurrences } = useProcessAlertStore();
  const areas = useObjectModelStore((s) => s.areas);

  const [activeTab, setActiveTab] = useState<ActiveTab>('equipment');
  const [search, setSearch] = useState('');
  const [trendSearch, setTrendSearch] = useState('');
  const [commandSearch, setCommandSearch] = useState('');
  const [kpiSearch, setKpiSearch] = useState('');

  // Trend selection state
  const [selectedProps, setSelectedProps] = useState<Array<{
    objectId: string;
    propertyName: string;
    objectName: string;
    propertyLabel: string;
  }>>([]);

  // Command selection state
  const [selectedObj, setSelectedObj] = useState<string | null>(null);
  const [selectedPropName, setSelectedPropName] = useState<string | null>(null);
  const [commandLabel, setCommandLabel] = useState('');
  const [confirmBeforeExecute, setConfirmBeforeExecute] = useState(false);

  // Alert config state
  const [alertScopeType, setAlertScopeType] = useState<'all' | 'object' | 'area'>('all');
  const [alertScopeId, setAlertScopeId] = useState<string | null>(null);
  const [alertScopeName, setAlertScopeName] = useState('Global');
  const [alertShowResolved, setAlertShowResolved] = useState(false);
  const [alertMaxItems, setAlertMaxItems] = useState(5);

  // KPI config state
  const [kpiPropKey, setKpiPropKey] = useState<string | null>(null); // "objectId:propertyName"
  const [kpiGoalValue, setKpiGoalValue] = useState<string>('');
  const [kpiGoalType, setKpiGoalType] = useState<'max' | 'min' | 'reference'>('max');

  useEffect(() => {
    if (isOpen) {
      setSelectedProps(initialSelectedProps || []);
      setSelectedObj(null);
      setSelectedPropName(null);
      setCommandLabel('');
      setKpiPropKey(null);
      setKpiGoalValue('');
      if (initialSelectedProps && initialSelectedProps.length > 0) {
        setActiveTab('trends');
      } else {
        setActiveTab('equipment');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ---- Equipment -----------------------------------------------------------
  const filteredObjects = useMemo(() => {
    const q = search.toLowerCase();
    return objects.filter((o) => {
      const tmpl = templates.find((t) => t.id === o.templateId);
      const templateName = tmpl?.name ?? '';
      return (
        o.name.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q) ||
        templateName.toLowerCase().includes(q)
      );
    });
  }, [objects, templates, search]);

  // ---- Numeric properties for Trend & KPI -----------------------------------
  const allPropertiesList = useMemo(() => {
    const list: Array<{
      objectId: string;
      objectName: string;
      propertyName: string;
      propertyId: string;
      propertyLabel: string;
      dataType: string;
      description: string;
      currentValue: string;
      unit: string;
    }> = [];

    objects.forEach((obj) => {
      const props = inheritanceService.getMergedProperties(obj.id, 'instance');
      props.forEach((prop) => {
        const isNumeric =
          prop.dataType === 'Float' ||
          prop.dataType === 'Integer' ||
          !isNaN(parseFloat(prop.defaultValue));

        if (isNumeric) {
          const key = `${obj.id}:${prop.name}`;
          const currentVal = simulatedValues[key] ?? prop.defaultValue;

          let unit = '';
          const nl = prop.name.toLowerCase();
          if (nl.includes('level') || nl.includes('percent')) unit = '%';
          else if (nl.includes('press')) unit = 'bar';
          else if (nl.includes('temp')) unit = '°C';
          else if (nl.includes('flow') || nl.includes('vaz')) unit = 'm³/h';
          else if (nl.includes('volum')) unit = 'm³';
          else if (nl.includes('mass')) unit = 't';
          else if (nl.includes('capacity')) unit = 'm³';
          else if (nl.includes('setpoint')) unit = '°C';

          list.push({
            objectId: obj.id,
            objectName: obj.name,
            propertyName: prop.name,
            propertyId: prop.id,
            propertyLabel: prop.name,
            dataType: prop.dataType,
            description: prop.description || '',
            currentValue: currentVal,
            unit,
          });
        }
      });
    });

    return list;
  }, [objects, simulatedValues]);

  // ---- Writable properties for Command -------------------------------------
  const writablePropertiesAll = useMemo(() => {
    const list: Array<{
      objectId: string;
      objectName: string;
      propertyName: string;
      dataType: string;
      description: string;
      currentValue: string;
      enumOptions?: string[];
    }> = [];

    objects.forEach((obj) => {
      const props = inheritanceService.getMergedProperties(obj.id, 'instance');
      props.forEach((prop) => {
        if (!WRITABLE_TYPES.includes(prop.dataType)) return;
        if (READ_ONLY_NAMES.includes(prop.name)) return;

        const key = `${obj.id}:${prop.name}`;
        const currentVal = simulatedValues[key] ?? prop.defaultValue;

        list.push({
          objectId: obj.id,
          objectName: obj.name,
          propertyName: prop.name,
          dataType: prop.dataType,
          description: prop.description || '',
          currentValue: currentVal,
          enumOptions: prop.dataType === 'Enum'
            ? (ENUM_OPTIONS_MAP[prop.name] || ['Opção A', 'Opção B'])
            : undefined,
        });
      });
    });

    return list;
  }, [objects, simulatedValues]);



  // Writable properties of the selected object for the Command second step
  const selectedObjWritableProps = useMemo(() => {
    if (!selectedObj) return [];
    return writablePropertiesAll.filter((p) => p.objectId === selectedObj);
  }, [selectedObj, writablePropertiesAll]);

  // ---- Trend filtering -------------------------------------------------------
  const filteredTrends = useMemo(() => {
    const q = trendSearch.toLowerCase().trim();
    if (!q) return allPropertiesList;
    return allPropertiesList.filter(
      (item) =>
        item.objectName.toLowerCase().includes(q) ||
        item.propertyName.toLowerCase().includes(q) ||
        item.dataType.toLowerCase().includes(q) ||
        item.unit.toLowerCase().includes(q)
    );
  }, [allPropertiesList, trendSearch]);

  // ---- KPI filtering --------------------------------------------------------
  const filteredKpi = useMemo(() => {
    const q = kpiSearch.toLowerCase().trim();
    if (!q) return allPropertiesList;
    return allPropertiesList.filter(
      (item) =>
        item.objectName.toLowerCase().includes(q) ||
        item.propertyName.toLowerCase().includes(q)
    );
  }, [allPropertiesList, kpiSearch]);

  if (!isOpen) return null;

  const getLevel = (objId: string) => {
    const key = `${objId}:Level`;
    const val = simulatedValues[key];
    return val != null ? parseFloat(val) : null;
  };

  const getStatus = (level: number | null): { color: string; label: string } => {
    if (level == null) return { color: '#64748b', label: 'N/D' };
    if (level >= 90) return { color: '#ef4444', label: 'CRÍTICO' };
    if (level >= 80) return { color: '#f97316', label: 'ALERTA' };
    if (level <= 5) return { color: '#ef4444', label: 'CRÍTICO' };
    if (level <= 15) return { color: '#eab308', label: 'ATENÇÃO' };
    return { color: '#10b981', label: 'NORMAL' };
  };

  // ---- Command submission ---------------------------------------------------
  const handleCommandSubmit = () => {
    if (!selectedObj || !selectedPropName) return;
    const objEntity = objects.find((o) => o.id === selectedObj);
    const propEntry = writablePropertiesAll.find(
      (p) => p.objectId === selectedObj && p.propertyName === selectedPropName
    );
    if (!objEntity || !propEntry) return;

    const cfg: CommandCardConfig = {
      objectId: selectedObj,
      objectName: objEntity.name,
      propertyName: selectedPropName,
      propertyLabel: selectedPropName,
      dataType: propEntry.dataType,
      enumOptions: propEntry.enumOptions,
      commandLabel: commandLabel.trim() || `${objEntity.name} · ${selectedPropName}`,
      confirmBeforeExecute,
    };
    onSelectCommand?.(cfg);
    onClose();
  };

  // ---- Alert submission ----------------------------------------------------
  const handleAlertSubmit = () => {
    const cfg: AlertCardConfig = {
      scopeType: alertScopeType,
      scopeId: alertScopeId,
      scopeName: alertScopeName,
      showResolved: alertShowResolved,
      maxItems: alertMaxItems,
    };
    onSelectAlert?.(cfg);
    onClose();
  };

  // ---- KPI submission ------------------------------------------------------
  const handleKpiSubmit = () => {
    if (!kpiPropKey) return;
    const [objectId, ...restParts] = kpiPropKey.split(':');
    const propertyName = restParts.join(':');
    const propEntry = allPropertiesList.find(
      (p) => p.objectId === objectId && p.propertyName === propertyName
    );
    if (!propEntry) return;

    const goalNum = parseFloat(kpiGoalValue);
    const cfg: KpiCardConfig = {
      objectId,
      objectName: propEntry.objectName,
      propertyName,
      propertyLabel: propertyName,
      unit: propEntry.unit,
      goalValue: isNaN(goalNum) ? null : goalNum,
      goalType: kpiGoalType,
      decimalPlaces: propEntry.dataType === 'Float' ? 1 : 0,
    };
    onSelectKpi?.(cfg);
    onClose();
  };

  const activeUnackCount = occurrences.filter((o) => o.status === 'active_unacknowledged').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Adicionar ao Painel
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Escolha o tipo de card para adicionar ao Grid Designer
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Bar */}
        {initialSelectedProps.length === 0 && (
          <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto">
            {TAB_BUTTONS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-3 text-xs font-bold transition-all relative border-b-2 whitespace-nowrap cursor-pointer shrink-0',
                  activeTab === tab.id
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                )}
              >
                {tab.icon}
                {tab.label}
                {tab.id === 'alert' && activeUnackCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold ml-0.5">
                    {activeUnackCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB: EQUIPMENT                                                   */}
        {/* ================================================================ */}
        {activeTab === 'equipment' && (
          <>
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por TAG, nome ou template..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/30 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {filteredObjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Gauge className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-xs font-medium">Nenhum equipamento encontrado</p>
                  <p className="text-[11px] opacity-60 mt-1">Crie objetos no Orquestra IDE primeiro</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {filteredObjects.map((obj) => {
                    const level = getLevel(obj.id);
                    const { color, label } = getStatus(level);
                    const tmpl = templates.find((t) => t.id === obj.templateId);
                    const isAlreadySelected = alreadySelectedIds.includes(obj.id);

                    return (
                      <button
                        key={obj.id}
                        onClick={() => { onSelect(obj.id); onClose(); }}
                        className="relative text-left p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 hover:bg-sky-50/30 dark:hover:bg-sky-950/10 cursor-pointer bg-white dark:bg-slate-900 transition-all duration-150"
                      >
                        {isAlreadySelected && (
                          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-[9px] font-bold">
                            Já Adicionado
                          </div>
                        )}
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: color }} />
                        <div className="pl-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-mono font-bold tracking-wider text-sky-600 dark:text-sky-400 uppercase">{obj.name}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono" style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}>{label}</span>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate">{obj.description || obj.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{tmpl?.name ?? 'Sem template'}</p>
                          {level != null && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                                <span className="text-slate-400">Nível</span>
                                <span className="font-bold" style={{ color }}>{level.toFixed(1)}%</span>
                              </div>
                              <div className="h-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, level)}%`, backgroundColor: color }} />
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-950/60">
              <span>{filteredObjects.length} equipamentos disponíveis</span>
              <button onClick={onClose} className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold transition-colors cursor-pointer">Cancelar</button>
            </div>
          </>
        )}

        {/* ================================================================ */}
        {/* TAB: TRENDS                                                      */}
        {/* ================================================================ */}
        {activeTab === 'trends' && (
          <>
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar variável, objeto, tipo ou unidade..."
                  value={trendSearch}
                  onChange={(e) => setTrendSearch(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/30 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                  autoFocus={activeTab === 'trends'}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3">
              {filteredTrends.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
                  <TrendingUp className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-xs font-medium">Nenhuma variável encontrada</p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                  <div className="grid grid-cols-[auto_1.3fr_1.5fr_0.7fr_0.7fr_1.1fr] gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <div className="w-4" />
                    <div>Objeto</div>
                    <div>Variável</div>
                    <div>Tipo</div>
                    <div>Unidade</div>
                    <div className="text-right">Valor</div>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[40vh] overflow-y-auto">
                    {filteredTrends.map((item) => {
                      const isChecked = selectedProps.some((p) => p.objectId === item.objectId && p.propertyName === item.propertyName);
                      const toggle = () => {
                        if (isChecked) {
                          setSelectedProps((prev) => prev.filter((p) => !(p.objectId === item.objectId && p.propertyName === item.propertyName)));
                        } else {
                          setSelectedProps((prev) => [...prev, { objectId: item.objectId, propertyName: item.propertyName, objectName: item.objectName, propertyLabel: item.propertyName }]);
                        }
                      };
                      return (
                        <div
                          key={`${item.objectId}-${item.propertyName}`}
                          onClick={toggle}
                          className={cn('grid grid-cols-[auto_1.3fr_1.5fr_0.7fr_0.7fr_1.1fr] gap-3 px-4 py-2.5 items-center hover:bg-sky-500/5 cursor-pointer select-none transition-colors', isChecked && 'bg-sky-500/10 dark:bg-sky-500/15')}
                        >
                          <div className="flex items-center">
                            <div className={cn('w-4 h-4 rounded-md border flex items-center justify-center transition-all', isChecked ? 'bg-sky-500 border-sky-600 text-white ring-2 ring-sky-500/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700')}>
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                          <div className="min-w-0"><span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-mono truncate">{item.objectName}</span></div>
                          <div className="min-w-0"><span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate font-mono">{item.propertyName}</span></div>
                          <div><span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase border border-slate-200 dark:border-slate-700">{item.dataType}</span></div>
                          <div>{item.unit ? <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">{item.unit}</span> : <span className="text-[10px] text-slate-300 dark:text-slate-600">-</span>}</div>
                          <div className="text-right font-mono font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center justify-end gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            {parseFloat(item.currentValue || '0').toFixed(1)}{item.unit && <span className="text-[10px] font-sans font-medium text-slate-400 ml-0.5">{item.unit}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-950/60">
              <span>{selectedProps.length} variáveis selecionadas</span>
              <div className="flex gap-2">
                <button onClick={onClose} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold transition-colors cursor-pointer">Cancelar</button>
                <button
                  onClick={() => { if (selectedProps.length > 0 && onSelectTrend) { onSelectTrend(selectedProps); onClose(); } }}
                  disabled={selectedProps.length === 0}
                  className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-colors shadow-sm cursor-pointer"
                >
                  {initialSelectedProps.length > 0 ? 'Salvar Alterações' : 'Adicionar Gráfico'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ================================================================ */}
        {/* TAB: COMMAND                                                     */}
        {/* ================================================================ */}
        {activeTab === 'command' && (
          <>
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/80">
              {!selectedObj ? (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar objeto ou propriedade..."
                    value={commandSearch}
                    onChange={(e) => setCommandSearch(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/30 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                    autoFocus={activeTab === 'command'}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setSelectedObj(null); setSelectedPropName(null); }}
                    className="text-[11px] text-sky-500 hover:text-sky-400 font-semibold cursor-pointer"
                  >
                    ← Voltar
                  </button>
                  <span className="text-[11px] text-slate-400">/</span>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{objects.find((o) => o.id === selectedObj)?.name}</span>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {!selectedObj ? (
                /* Step 1: Choose object */
                <div className="px-4 py-3">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">Selecione um equipamento</p>
                  <div className="grid grid-cols-2 gap-2">
                    {objects.filter((obj) => {
                      const q = commandSearch.toLowerCase().trim();
                      if (!q) return true;
                      const matchesObj = obj.name.toLowerCase().includes(q) || (obj.description || '').toLowerCase().includes(q);
                      const matchesProp = writablePropertiesAll.some((p) => p.objectId === obj.id && p.propertyName.toLowerCase().includes(q));
                      return matchesObj || matchesProp;
                    }).map((obj) => {
                      const hasProp = writablePropertiesAll.some((p) => p.objectId === obj.id);
                      if (!hasProp) return null;
                      const level = getLevel(obj.id);
                      const { color } = getStatus(level);
                      return (
                        <button
                          key={obj.id}
                          onClick={() => setSelectedObj(obj.id)}
                          className="relative text-left p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50/20 dark:hover:bg-amber-950/10 cursor-pointer bg-white dark:bg-slate-900 transition-all"
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: color }} />
                          <div className="pl-2">
                            <p className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 truncate">{obj.name}</p>
                            <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate mt-0.5">{obj.description || obj.name}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">{writablePropertiesAll.filter((p) => p.objectId === obj.id).length} propriedades controláveis</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Step 2: Choose property + configure */
                <div className="px-5 py-3 flex flex-col gap-3">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Selecione a propriedade de controle</p>

                  {selectedObjWritableProps.map((prop) => (
                    <button
                      key={prop.propertyName}
                      onClick={() => {
                        setSelectedPropName(prop.propertyName);
                        setCommandLabel(`${objects.find((o) => o.id === selectedObj)?.name} · ${prop.propertyName}`);
                      }}
                      className={cn(
                        'flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer',
                        selectedPropName === prop.propertyName
                          ? 'border-amber-400 bg-amber-50/30 dark:bg-amber-950/10 dark:border-amber-500'
                          : 'border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600 bg-white dark:bg-slate-900'
                      )}
                    >
                      <div>
                        <p className="text-xs font-bold font-mono text-slate-800 dark:text-slate-100">{prop.propertyName}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{prop.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase">{prop.dataType}</span>
                        <span className="text-xs font-mono text-slate-500">{prop.currentValue}</span>
                        {selectedPropName === prop.propertyName && <Check className="w-3.5 h-3.5 text-amber-500" />}
                      </div>
                    </button>
                  ))}

                  {selectedPropName && (
                    <div className="mt-2 flex flex-col gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Label do Botão</label>
                        <input
                          type="text"
                          value={commandLabel}
                          onChange={(e) => setCommandLabel(e.target.value)}
                          placeholder="Ex: Ligar bomba de transferência..."
                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <div
                          onClick={() => setConfirmBeforeExecute((v) => !v)}
                          className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer', confirmBeforeExecute ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700')}
                        >
                          <span className={cn('inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform', confirmBeforeExecute ? 'translate-x-4.5' : 'translate-x-0.5')} />
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Exigir confirmação antes de executar</span>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] bg-slate-50 dark:bg-slate-950/60">
              <span className="text-slate-400">{selectedObj && selectedPropName ? '1 propriedade selecionada' : 'Selecione objeto e propriedade'}</span>
              <div className="flex gap-2">
                <button onClick={onClose} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold transition-colors cursor-pointer">Cancelar</button>
                <button
                  onClick={handleCommandSubmit}
                  disabled={!selectedObj || !selectedPropName}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-colors shadow-sm cursor-pointer"
                >
                  Adicionar Comando
                </button>
              </div>
            </div>
          </>
        )}

        {/* ================================================================ */}
        {/* TAB: ALERT LOCAL                                                 */}
        {/* ================================================================ */}
        {activeTab === 'alert' && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Escopo dos Alertas</p>
                <div className="flex gap-2">
                  {(['all', 'object', 'area'] as const).map((scope) => (
                    <button
                      key={scope}
                      onClick={() => {
                        setAlertScopeType(scope);
                        setAlertScopeId(null);
                        setAlertScopeName(scope === 'all' ? 'Global' : '');
                      }}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer',
                        alertScopeType === scope
                          ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-rose-300'
                      )}
                    >
                      {scope === 'all' ? 'Todos' : scope === 'object' ? 'Por Objeto' : 'Por Área'}
                    </button>
                  ))}
                </div>
              </div>

              {alertScopeType === 'object' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Objeto</label>
                  <div className="relative">
                    <select
                      value={alertScopeId || ''}
                      onChange={(e) => {
                        const obj = objects.find((o) => o.id === e.target.value);
                        setAlertScopeId(e.target.value);
                        setAlertScopeName(obj?.name || '');
                      }}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/30 text-slate-800 dark:text-slate-200 appearance-none cursor-pointer"
                    >
                      <option value="">Selecione um objeto...</option>
                      {objects.map((obj) => <option key={obj.id} value={obj.id}>{obj.name} — {obj.description}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {alertScopeType === 'area' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Área</label>
                  <div className="relative">
                    <select
                      value={alertScopeId || ''}
                      onChange={(e) => {
                        const area = areas.find((a) => a.id === e.target.value);
                        setAlertScopeId(e.target.value);
                        setAlertScopeName(area?.name || '');
                      }}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/30 text-slate-800 dark:text-slate-200 appearance-none cursor-pointer"
                    >
                      <option value="">Selecione uma área...</option>
                      {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Quantidade máxima de alertas exibidos</label>
                <div className="flex gap-2">
                  {[3, 5, 8, 10].map((n) => (
                    <button
                      key={n}
                      onClick={() => setAlertMaxItems(n)}
                      className={cn('flex-1 py-2 rounded-lg border text-xs font-bold cursor-pointer transition-all', alertMaxItems === n ? 'border-rose-400 bg-rose-50/30 text-rose-600 dark:text-rose-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-rose-300')}
                    >{n}</button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                <div
                  onClick={() => setAlertShowResolved((v) => !v)}
                  className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer shrink-0', alertShowResolved ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700')}
                >
                  <span className={cn('inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform', alertShowResolved ? 'translate-x-4.5' : 'translate-x-0.5')} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Exibir alertas resolvidos</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Inclui ocorrências com status Encerrado e Expirado</p>
                </div>
              </label>

              <div className="p-3 rounded-xl bg-rose-50/40 dark:bg-rose-950/10 border border-rose-200/50 dark:border-rose-800/30 text-[11px] text-slate-500 dark:text-slate-400">
                <p className="font-bold text-rose-600 dark:text-rose-400 mb-1">Prévia</p>
                <p>{occurrences.filter((o) => {
                  if (alertScopeType === 'object' && alertScopeId) return o.relatedObjectId === alertScopeId;
                  if (alertScopeType === 'area' && alertScopeId) return o.responsibleAreas.includes(alertScopeId);
                  return true;
                }).filter((o) => alertShowResolved || (o.status !== 'resolved' && o.status !== 'expired')).length} alertas correspondem à configuração atual</p>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
              <span className="text-[11px] text-slate-400">Card de Alertas Locais</span>
              <div className="flex gap-2">
                <button onClick={onClose} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer">Cancelar</button>
                <button
                  onClick={handleAlertSubmit}
                  disabled={alertScopeType !== 'all' && !alertScopeId}
                  className="px-4 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
                >
                  Adicionar Card de Alertas
                </button>
              </div>
            </div>
          </>
        )}

        {/* ================================================================ */}
        {/* TAB: KPI                                                         */}
        {/* ================================================================ */}
        {activeTab === 'kpi' && (
          <>
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar variável ou objeto para o indicador..."
                  value={kpiSearch}
                  onChange={(e) => setKpiSearch(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/30 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                  autoFocus={activeTab === 'kpi'}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-3">
              {/* Variable selection */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 max-h-[30vh] overflow-y-auto">
                {filteredKpi.map((item) => {
                  const key = `${item.objectId}:${item.propertyName}`;
                  const isSelected = kpiPropKey === key;
                  return (
                    <div
                      key={key}
                      onClick={() => setKpiPropKey(key)}
                      className={cn('flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-800/60 last:border-0', isSelected ? 'bg-blue-500/10 dark:bg-blue-500/15' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40')}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn('w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all', isSelected ? 'bg-blue-500 border-blue-600 text-white ring-2 ring-blue-500/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700')}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 shrink-0">{item.objectName}</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 font-mono truncate">{item.propertyName}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        {item.unit && <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">{item.unit}</span>}
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-300 font-bold">{parseFloat(item.currentValue || '0').toFixed(1)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Goal config — only if variable selected */}
              {kpiPropKey && (
                <div className="flex flex-col gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Tipo de Meta</label>
                    <div className="flex gap-2">
                      {(['max', 'min', 'reference'] as const).map((gt) => (
                        <button
                          key={gt}
                          onClick={() => setKpiGoalType(gt)}
                          className={cn('flex-1 py-1.5 rounded-lg border text-[11px] font-bold cursor-pointer transition-all', kpiGoalType === gt ? 'border-blue-400 bg-blue-50/40 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-300')}
                        >
                          {gt === 'max' ? 'Maximizar' : gt === 'min' ? 'Minimizar' : 'Referência'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                      <Target className="w-3 h-3" /> Valor da Meta (opcional)
                    </label>
                    <input
                      type="number"
                      value={kpiGoalValue}
                      onChange={(e) => setKpiGoalValue(e.target.value)}
                      placeholder="Deixe vazio para mostrar somente o valor"
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
              <span className="text-[11px] text-slate-400">{kpiPropKey ? '1 indicador selecionado' : 'Selecione uma variável'}</span>
              <div className="flex gap-2">
                <button onClick={onClose} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer">Cancelar</button>
                <button
                  onClick={handleKpiSubmit}
                  disabled={!kpiPropKey}
                  className="px-4 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
                >
                  Adicionar Indicador
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
