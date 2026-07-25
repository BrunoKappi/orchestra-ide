import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  TableProperties,
  ArrowUpDown,
  Download,
  ExternalLink,
  Tag,
  Cpu,
  Monitor,
  Activity,
  Bell,
  TrendingUp,
  ChevronRight,
  ChevronDown,
  Info,
  Layers,
  CheckSquare,
  Square
} from 'lucide-react';

import { HeaderNavigation } from '../components/navigation/HeaderNavigation';
import { useObjectModelStore } from '../store/useObjectModelStore';
import { useWidgetStore } from '../store/useWidgetStore';
import { propertyBrowserService } from '../services/PropertyBrowserService';
import type { IndexedProperty } from '../services/PropertyBrowserService';
import { inheritanceService } from '../services/InheritanceService';
import { screenRepo } from '../repository/ScreenRepository';
import { cn } from '../utils/cn';

export const PropertyBrowserPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    simulatedValues,
    isSimulating,
    tickSimulation,
    selectEntity,
    alarmEvents,
    acknowledgeAlarms
  } = useObjectModelStore();

  const { widgets, selectWidget } = useWidgetStore();

  // Search and Filter States
  const [searchText, setSearchText] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dataTypeFilter, setDataTypeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const targetFilter = 'ALL';
  const templateFilter = 'ALL';
  const [targetTypeFilter, setTargetTypeFilter] = useState<'template' | 'instance' | 'all'>('all');
  
  const [isInheritedFilter, setIsInheritedFilter] = useState<boolean | null>(null);
  const [isOverriddenFilter, setIsOverriddenFilter] = useState<boolean | null>(null);
  const [hasAlarmFilter, setHasAlarmFilter] = useState(false);
  const [hasHistoryFilter, setHasHistoryFilter] = useState(false);
  const [isSimulatedFilter, setIsSimulatedFilter] = useState(false);
  const [isUsedInScreensFilter, setIsUsedInScreensFilter] = useState(false);

  // Layout States
  const [selectedPropId, setSelectedPropId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<keyof IndexedProperty>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [groupBy, setGroupBy] = useState<'none' | 'object' | 'template'>('none');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Accordion state for grouping
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Real-time flash effect state
  const [prevValues, setPrevValues] = useState<Record<string, string>>({});
  const [changedProps, setChangedProps] = useState<Record<string, boolean>>({});

  // Trigger simulation ticks if active
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      tickSimulation();
    }, 1000);
    return () => clearInterval(interval);
  }, [isSimulating, tickSimulation]);

  // Flash highlight on changed values
  useEffect(() => {
    const newlyChanged: Record<string, boolean> = {};
    Object.keys(simulatedValues).forEach((key) => {
      if (prevValues[key] !== undefined && prevValues[key] !== simulatedValues[key]) {
        newlyChanged[key] = true;
      }
    });

    if (Object.keys(newlyChanged).length > 0) {
      setChangedProps(newlyChanged);
      const timer = setTimeout(() => setChangedProps({}), 600);
      setPrevValues(simulatedValues);
      return () => clearTimeout(timer);
    }
    setPrevValues(simulatedValues);
  }, [simulatedValues]);

  // Reset pagination on search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, dataTypeFilter, categoryFilter, targetFilter, templateFilter, targetTypeFilter, isInheritedFilter, isOverriddenFilter, hasAlarmFilter, hasHistoryFilter, isSimulatedFilter, isUsedInScreensFilter]);

  // Execute query against property index
  const getFilteredProperties = (): IndexedProperty[] => {
    const filters = {
      dataType: dataTypeFilter,
      category: categoryFilter,
      targetId: targetFilter,
      sourceTemplateId: templateFilter,
      targetType: targetTypeFilter,
      isInherited: isInheritedFilter !== null ? isInheritedFilter : undefined,
      isOverridden: isOverriddenFilter !== null ? isOverriddenFilter : undefined,
      hasAlarm: hasAlarmFilter || undefined,
      hasHistory: hasHistoryFilter || undefined,
      isSimulated: isSimulatedFilter || undefined,
      isUsedInScreens: isUsedInScreensFilter || undefined,
    };

    let result = propertyBrowserService.search(searchText, filters);

    // Sorting
    result.sort((a, b) => {
      let aVal = a[sortBy] ?? '';
      let bVal = b[sortBy] ?? '';

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        return sortOrder === 'asc' ? (aVal ? 1 : 0) - (bVal ? 1 : 0) : (bVal ? 1 : 0) - (aVal ? 1 : 0);
      }
      return 0;
    });

    return result;
  };

  const filteredProperties = getFilteredProperties();

  // Unique categories list for filtering
  const categories = Array.from(
    new Set(propertyBrowserService.getIndex().map((p) => p.category || 'Geral'))
  );

  // Selected Property Computation
  const selectedProp = propertyBrowserService.getIndex().find((p) => p.id === selectedPropId);

  // Grouping computation
  const getGroupedData = (data: IndexedProperty[]) => {
    if (groupBy === 'none') return { 'All': data };

    const groups: Record<string, IndexedProperty[]> = {};
    data.forEach((p) => {
      const key = groupBy === 'object' 
        ? (p.targetType === 'instance' ? p.targetName : 'Templates (Modelos)')
        : (p.sourceTemplateName || 'Sem Modelo');

      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });

    return groups;
  };

  const groupedData = getGroupedData(filteredProperties);

  // Bulk Row Selection Toggle
  const toggleRow = (id: string) => {
    const next = new Set(selectedRows);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedRows(next);
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === filteredProperties.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredProperties.map((p) => p.id)));
    }
  };

  // CSV & JSON Exporters
  const handleExport = (format: 'csv' | 'json') => {
    const dataToExport = selectedRows.size > 0
      ? filteredProperties.filter((p) => selectedRows.has(p.id))
      : filteredProperties;

    if (dataToExport.length === 0) {
      alert('Nenhum dado para exportar.');
      return;
    }

    if (format === 'json') {
      const payload = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `properties_export_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // CSV format
      const headers = ['Nome', 'Tipo de Dado', 'Alvo', 'Tipo de Alvo', 'Origem', 'Categoria', 'Valor Padrao', 'Unidade', 'Alarme Habilitado', 'Historico Habilitado', 'Simulado'];
      const rows = dataToExport.map((p) => [
        p.name,
        p.dataType,
        p.targetName,
        p.targetType,
        p.sourceTemplateName || '—',
        p.category,
        p.defaultValue,
        p.engineeringUnit,
        p.hasAlarm ? 'Sim' : 'Nao',
        p.hasHistory ? 'Sim' : 'Nao',
        p.isSimulated ? 'Sim' : 'Nao',
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.map(val => `"${val}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `properties_export_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Cross-Navigation Actions
  const handleJumpToObject = (targetId: string, targetType: 'template' | 'instance') => {
    selectEntity(targetId, targetType);
    if (targetType === 'template') {
      navigate('/orchestra');
    } else {
      navigate('/runtime');
    }
  };

  const handleJumpToWidget = (widgetId: string) => {
    selectWidget(widgetId);
    navigate('/widgets');
  };

  const handleJumpToScreen = (screenId: string) => {
    navigate(`/screen/${screenId}`);
  };

  // Get real-time value from store
  const getLiveValue = (prop: IndexedProperty) => {
    const key = prop.targetType === 'instance'
      ? `${prop.targetId}:${prop.name}`
      : prop.name;
    return simulatedValues[key] ?? prop.defaultValue ?? '—';
  };

  // Resolve detail panel scripts
  const getRelatedScripts = (prop: IndexedProperty) => {
    if (!prop) return [];
    try {
      const allScripts = inheritanceService.getMergedScripts(prop.targetId, prop.targetType);
      return allScripts.filter(
        (s) =>
          (s.code || '').includes(prop.name) ||
          (s.triggerExpression || '').includes(prop.name)
      );
    } catch {
      return [];
    }
  };

  // Resolve detail panel screens
  const getRelatedScreens = (prop: IndexedProperty) => {
    if (!prop) return [];
    const matched: { id: string; name: string }[] = [];
    const allScreens = screenRepo.getAll();

    allScreens.forEach((scr) => {
      const uses = (scr.elements || []).some((el) => {
        if (el.objectId !== prop.targetId) return false;
        if (el.type === 'variable-display' && el.propertyName === prop.name) return true;
        if (el.type === 'widget-instance' && el.mappings) {
          return Object.values(el.mappings).some(
            (m) => m.type === 'property' && (m.value === prop.name || m.value === `${prop.targetId}:${prop.name}` || m.value === `me.${prop.name}`)
          );
        }
        return false;
      });
      if (uses) matched.push({ id: scr.id, name: scr.name });
    });
    return matched;
  };

  // Resolve detail panel widgets
  const getRelatedWidgets = (prop: IndexedProperty) => {
    if (!prop) return [];
    const matched: { id: string; name: string }[] = [];
    // Verify widgets associated with this object/template
    try {
      const assocs = inheritanceService.getMergedAssociatedWidgets(prop.targetId, prop.targetType);
      assocs.forEach((assoc) => {
        const hasMapping = Object.values(assoc.mappings || {}).some(
          (m) => m.type === 'property' && (m.value === prop.name || m.value === `me.${prop.name}`)
        );
        if (hasMapping) {
          const w = widgets.find((x) => x.id === assoc.widgetId);
          if (w) matched.push({ id: w.id, name: w.name });
        }
      });
    } catch {}
    return matched;
  };

  // Get active alarms for selected property
  const getActiveAlarms = (prop: IndexedProperty) => {
    if (!prop || prop.targetType !== 'instance') return [];
    return alarmEvents.filter(
      (evt) =>
        evt.objectId === prop.targetId &&
        evt.propertyName === prop.name &&
        (evt.status === 'Active Unacknowledged' || evt.status === 'Active Acknowledged')
    );
  };

  // Table sorting logic
  const handleSort = (column: keyof IndexedProperty) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Pagination helper
  const totalPages = Math.ceil(filteredProperties.length / rowsPerPage) || 1;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      <HeaderNavigation />

      {/* Main Workspace split */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Index Explorer Table & Filter Sidebar */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-100/30 dark:bg-slate-900/30 p-6 overflow-hidden gap-5">
          
          {/* Action Header Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs shrink-0 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <TableProperties className="w-5 h-5 text-sky-500" />
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Property Explorer</h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 rounded-full border border-sky-200/50">
                  {filteredProperties.length} Properties
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors",
                    showAdvanced 
                      ? "border-sky-500/50 bg-sky-50/50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                  )}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filtros</span>
                </button>

                <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-0.5 text-xs font-medium">
                  <span className="px-2 text-[10px] text-slate-400">Agrupar por:</span>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as any)}
                    className="bg-transparent text-xs text-slate-700 dark:text-slate-200 outline-none pr-1.5 cursor-pointer"
                  >
                    <option value="none">Nenhum</option>
                    <option value="object">Objeto</option>
                    <option value="template">Template</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleExport('json')}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-855 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 rounded-lg text-xs font-semibold transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-855 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 rounded-lg text-xs font-semibold transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Busca instantânea por propriedade, descrição, objeto, template, categoria ou unidade de engenharia..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-950 dark:text-slate-50"
              />
            </div>

            {/* Advanced Filters Card */}
            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3.5 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-600 dark:text-slate-400 transition-all">
                {/* DataType Filter */}
                <div className="space-y-1">
                  <label className="font-bold text-[10px] text-slate-400 uppercase">Tipo de Dado</label>
                  <select
                    value={dataTypeFilter}
                    onChange={(e) => setDataTypeFilter(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 p-1.5 rounded-lg outline-none cursor-pointer"
                  >
                    <option value="ALL">Todos os Tipos</option>
                    <option value="String">String</option>
                    <option value="Boolean">Boolean</option>
                    <option value="Integer">Integer</option>
                    <option value="Float">Float</option>
                    <option value="Date">Date</option>
                    <option value="Enum">Enum</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div className="space-y-1">
                  <label className="font-bold text-[10px] text-slate-400 uppercase">Categoria</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 p-1.5 rounded-lg outline-none cursor-pointer"
                  >
                    <option value="ALL">Todas as Categorias</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Target Type Filter */}
                <div className="space-y-1">
                  <label className="font-bold text-[10px] text-slate-400 uppercase">Contexto</label>
                  <select
                    value={targetTypeFilter}
                    onChange={(e) => setTargetTypeFilter(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 p-1.5 rounded-lg outline-none cursor-pointer"
                  >
                    <option value="all">Templates & Instâncias</option>
                    <option value="template">Apenas Templates</option>
                    <option value="instance">Apenas Instâncias (Objetos)</option>
                  </select>
                </div>

                {/* Scope Filter */}
                <div className="space-y-1">
                  <label className="font-bold text-[10px] text-slate-400 uppercase">Origem/Herança</label>
                  <select
                    value={isInheritedFilter === null ? 'all' : isInheritedFilter ? 'inherited' : 'local'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setIsInheritedFilter(val === 'all' ? null : val === 'inherited');
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 p-1.5 rounded-lg outline-none cursor-pointer"
                  >
                    <option value="all">Todas as Origens</option>
                    <option value="local">Locais (Definidas no Alvo)</option>
                    <option value="inherited">Herdadas (Do Modelo)</option>
                  </select>
                </div>

                {/* Overridden Selector */}
                <div className="space-y-1">
                  <label className="font-bold text-[10px] text-slate-400 uppercase">Propriedade Sobrescrita</label>
                  <select
                    value={isOverriddenFilter === null ? 'all' : isOverriddenFilter ? 'overridden' : 'normal'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setIsOverriddenFilter(val === 'all' ? null : val === 'overridden');
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 p-1.5 rounded-lg outline-none cursor-pointer"
                  >
                    <option value="all">Qualquer Status</option>
                    <option value="overridden">Sim, Sobrescritas</option>
                    <option value="normal">Não Sobrescritas</option>
                  </select>
                </div>

                {/* Boolean Checks */}
                <div className="col-span-1 md:col-span-3 lg:col-span-3 flex flex-wrap gap-x-5 gap-y-2.5 items-center pt-2">
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium hover:text-slate-850 dark:hover:text-slate-200">
                    <input
                      type="checkbox"
                      checked={hasAlarmFilter}
                      onChange={(e) => setHasAlarmFilter(e.target.checked)}
                      className="rounded border-slate-350 accent-sky-500 w-3.5 h-3.5"
                    />
                    <span>Com Alarme</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium hover:text-slate-850 dark:hover:text-slate-200">
                    <input
                      type="checkbox"
                      checked={hasHistoryFilter}
                      onChange={(e) => setHasHistoryFilter(e.target.checked)}
                      className="rounded border-slate-350 accent-sky-500 w-3.5 h-3.5"
                    />
                    <span>Com Histórico (Historian)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium hover:text-slate-850 dark:hover:text-slate-200">
                    <input
                      type="checkbox"
                      checked={isSimulatedFilter}
                      onChange={(e) => setIsSimulatedFilter(e.target.checked)}
                      className="rounded border-slate-350 accent-sky-500 w-3.5 h-3.5"
                    />
                    <span>Simuladas (Mock)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium hover:text-slate-850 dark:hover:text-slate-200">
                    <input
                      type="checkbox"
                      checked={isUsedInScreensFilter}
                      onChange={(e) => setIsUsedInScreensFilter(e.target.checked)}
                      className="rounded border-slate-350 accent-sky-500 w-3.5 h-3.5"
                    />
                    <span>Utilizadas em Telas</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Table Container */}
          <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse text-xs select-none">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold sticky top-0 z-10">
                    <th className="p-3 w-10 text-center">
                      <button onClick={toggleSelectAll} className="p-0.5 hover:bg-slate-250 dark:hover:bg-slate-700 rounded transition-colors text-slate-400">
                        {selectedRows.size === filteredProperties.length && filteredProperties.length > 0 ? (
                          <CheckSquare className="w-3.5 h-3.5 text-sky-500" />
                        ) : (
                          <Square className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </th>
                    <th className="p-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1">
                        <span>Nome</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
                      </div>
                    </th>
                    <th className="p-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50" onClick={() => handleSort('targetName')}>
                      <div className="flex items-center gap-1">
                        <span>Alvo (Objeto/Template)</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
                      </div>
                    </th>
                    <th className="p-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50" onClick={() => handleSort('sourceTemplateName')}>
                      <div className="flex items-center gap-1">
                        <span>Origem</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
                      </div>
                    </th>
                    <th className="p-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50" onClick={() => handleSort('category')}>
                      <div className="flex items-center gap-1">
                        <span>Categoria</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
                      </div>
                    </th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3 text-right">Valor Atual</th>
                    <th className="p-3">Unidade</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Referências</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {Object.entries(groupedData).map(([groupName, props]) => {
                    const isCollapsed = collapsedGroups[groupName];
                    const hasGroup = groupBy !== 'none';
                    const groupProps = props;

                    return (
                      <React.Fragment key={groupName}>
                        {hasGroup && (
                          <tr 
                            onClick={() => setCollapsedGroups({ ...collapsedGroups, [groupName]: !isCollapsed })}
                            className="bg-slate-100/50 dark:bg-slate-850 cursor-pointer font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-150/70 dark:hover:bg-slate-800/80 transition-colors"
                          >
                            <td colSpan={10} className="p-2.5 pl-3">
                              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                <span>{groupName}</span>
                                <span className="px-1.5 py-0.2 rounded bg-slate-200/60 dark:bg-slate-700 font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                  {groupProps.length}
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}

                        {!isCollapsed && (
                          groupProps
                            .slice(
                              groupBy !== 'none' ? 0 : (currentPage - 1) * rowsPerPage,
                              groupBy !== 'none' ? undefined : currentPage * rowsPerPage
                            )
                            .map((prop) => {
                              const isSelected = selectedPropId === prop.id;
                              const isChecked = selectedRows.has(prop.id);
                              const liveVal = getLiveValue(prop);
                              const key = prop.targetType === 'instance' ? `${prop.targetId}:${prop.name}` : prop.name;
                              const flashClass = changedProps[key] 
                                ? 'bg-amber-100/60 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 font-semibold' 
                                : '';

                              return (
                                <tr
                                  key={prop.id}
                                  onClick={() => setSelectedPropId(prop.id)}
                                  className={cn(
                                    "hover:bg-slate-50/50 dark:hover:bg-slate-800/20 cursor-pointer transition-colors",
                                    isSelected && "bg-sky-50 dark:bg-sky-950/20 border-l-2 border-sky-500"
                                  )}
                                >
                                  {/* Selection Checkbox */}
                                  <td className="p-3 text-center" onClick={(e) => { e.stopPropagation(); toggleRow(prop.id); }}>
                                    <button className="p-0.5 rounded text-slate-400">
                                      {isChecked ? (
                                        <CheckSquare className="w-3.5 h-3.5 text-sky-500" />
                                      ) : (
                                        <Square className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </td>

                                  {/* Name & Origin indicators */}
                                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                                    <div className="flex items-center gap-1.5">
                                      <span>{prop.name}</span>
                                      {prop.isOverridden && (
                                        <span className="px-1 py-0.1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900 rounded text-[8px] font-bold uppercase tracking-wider scale-90 shrink-0">
                                          Override
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Target */}
                                  <td className="p-3">
                                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-350">
                                      {prop.targetType === 'template' ? <Layers className="w-3 h-3 text-sky-500" /> : <Cpu className="w-3 h-3 text-emerald-500" />}
                                      <span className="truncate">{prop.targetName}</span>
                                    </div>
                                  </td>

                                  {/* Source origin */}
                                  <td className="p-3 text-slate-500 truncate">
                                    {prop.sourceTemplateName || '—'}
                                  </td>

                                  {/* Category */}
                                  <td className="p-3">
                                    <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                      <Tag className="w-2.5 h-2.5 text-slate-400" />
                                      <span>{prop.category}</span>
                                    </span>
                                  </td>

                                  {/* DataType */}
                                  <td className="p-3 font-mono text-[10px]">
                                    {prop.dataType}
                                  </td>

                                  {/* Current Live Value */}
                                  <td className={cn("p-3 text-right font-mono font-bold text-slate-700 dark:text-slate-200 transition-all", flashClass)}>
                                    {liveVal}
                                  </td>

                                  {/* Unit */}
                                  <td className="p-3 text-slate-500 font-mono">
                                    {prop.engineeringUnit}
                                  </td>

                                  {/* Status indicators */}
                                  <td className="p-3">
                                    <div className="flex items-center justify-center gap-1.5">
                                      {/* Alarms */}
                                      {prop.hasAlarm && (
                                        <span title="Alarme Configurado">
                                          <Bell className="w-3.5 h-3.5 text-rose-500" />
                                        </span>
                                      )}
                                      {/* History */}
                                      {prop.hasHistory && (
                                        <span title="Histórico (Historian) Ativo">
                                          <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                                        </span>
                                      )}
                                      {/* Simulated */}
                                      {prop.isSimulated && (
                                        <span title="Simulação Ativa">
                                          <Activity className="w-3.5 h-3.5 text-amber-500" />
                                        </span>
                                      )}
                                      {!prop.hasAlarm && !prop.hasHistory && !prop.isSimulated && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-350 dark:bg-slate-600" />
                                      )}
                                    </div>
                                  </td>

                                  {/* Widget and screen usage counter */}
                                  <td className="p-3 text-center text-slate-400 text-[10px]">
                                    <span className="font-mono">
                                      {prop.widgetsCount}w / {prop.screensCount}s
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                        )}
                      </React.Fragment>
                    );
                  })}

                  {filteredProperties.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400 italic">
                        Nenhuma propriedade encontrada para os critérios de busca e filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Pagination Controls */}
            {groupBy === 'none' && filteredProperties.length > 0 && (
              <div className="h-12 border-t border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shrink-0 select-none text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 text-[11px]">
                <div className="flex items-center gap-2">
                  <span>Exibir</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 outline-none cursor-pointer font-bold text-slate-650"
                  >
                    <option value={15}>15</option>
                    <option value={30}>30</option>
                    <option value={50}>50</option>
                  </select>
                  <span>linhas por página</span>
                </div>

                <div className="flex items-center gap-3">
                  <span>
                    Mostrando <strong className="text-slate-700 dark:text-slate-300">{(currentPage - 1) * rowsPerPage + 1}</strong> a <strong className="text-slate-700 dark:text-slate-300">{Math.min(currentPage * rowsPerPage, filteredProperties.length)}</strong> de <strong className="text-slate-700 dark:text-slate-300">{filteredProperties.length}</strong>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      Anterior
                    </button>
                    <span className="font-semibold text-slate-600 px-1 font-mono">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      Próximo
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Properties Sidebar Information Panel */}
        <aside className="w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 overflow-hidden shadow-xl">
          {selectedProp ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header Info */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-950/20">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-800/40 text-[9px] font-bold uppercase tracking-wider">
                    {selectedProp.dataType}
                  </span>
                  
                  <button
                    onClick={() => handleJumpToObject(selectedProp.targetId, selectedProp.targetType)}
                    className="flex items-center gap-1 text-[10px] font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    <span>Ver no Modeler</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-slate-400 text-xs font-normal font-mono">{selectedProp.targetName}.</span>
                  <span>{selectedProp.name}</span>
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed italic bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800/60">
                  {selectedProp.description || 'Sem descrição definida para esta variável.'}
                </p>
              </div>

              {/* Detail body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
                
                {/* 1. Real-time Status Card */}
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 p-4 rounded-xl space-y-2.5">
                  <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Monitoramento</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-455 block">Valor Atual</span>
                      <strong className="text-base font-mono font-bold text-slate-800 dark:text-slate-100 block mt-0.5 truncate">
                        {getLiveValue(selectedProp)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-455 block">Valor Padrão</span>
                      <strong className="text-sm font-mono text-slate-700 dark:text-slate-350 block mt-1 truncate">
                        {selectedProp.defaultValue}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-455 block">Unidade</span>
                      <strong className="text-sm font-mono text-slate-700 dark:text-slate-350 block mt-1 truncate">
                        {selectedProp.engineeringUnit}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-455 block">Qualidade</span>
                      <strong className="text-sm text-emerald-500 font-semibold block mt-1 flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        {selectedProp.quality}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 2. Alarm Configuration */}
                {selectedProp.hasAlarm ? (
                  <div className="p-4 rounded-xl border border-rose-100 dark:border-rose-950/40 bg-rose-50/20 dark:bg-rose-950/10 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-[10px] text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-rose-500" />
                        <span>Alarmes Configurados</span>
                      </h4>
                      {getActiveAlarms(selectedProp).length > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white font-mono text-[9px] font-bold shrink-0 animate-pulse">
                          ATIVO
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2 bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/30 p-3 rounded-lg text-[11px] leading-relaxed">
                      <div>
                        <span className="text-slate-455">Limite de Engenharia (HH / H / L / LL):</span>
                        <div className="flex flex-wrap gap-1.5 mt-1 font-mono">
                          {selectedProp.id.includes('Level') || selectedProp.name.toLowerCase().includes('level') || selectedProp.name.toLowerCase().includes('nivel') ? (
                            <>
                              <span className="px-1 rounded bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-455 text-[9px]">HH: 90</span>
                              <span className="px-1 rounded bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-455 text-[9px]">H: 80</span>
                              <span className="px-1 rounded bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-455 text-[9px]">L: 15</span>
                              <span className="px-1 rounded bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-455 text-[9px]">LL: 5</span>
                            </>
                          ) : (
                            <span className="italic text-slate-400">Padrões do sensor</span>
                          )}
                        </div>
                      </div>

                      {getActiveAlarms(selectedProp).map((evt) => (
                        <div key={evt.id} className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                          <span className="text-rose-600 font-bold">{evt.message}</span>
                          <button
                            onClick={() => acknowledgeAlarms([evt.id])}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded font-semibold text-[10px]"
                          >
                            Reconhecer
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/10 text-slate-400 italic">
                    Nenhum alarme configurado para esta propriedade.
                  </div>
                )}

                {/* 3. History Config */}
                {selectedProp.hasHistory ? (
                  <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-950/40 bg-indigo-50/20 dark:bg-indigo-950/10 space-y-2.5">
                    <h4 className="font-bold text-[10px] text-indigo-500 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Configurações do Historian</span>
                    </h4>
                    <div className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/30 p-3 rounded-lg grid grid-cols-2 gap-y-2 gap-x-4 text-[11px]">
                      <div>
                        <span className="text-slate-455 block">Taxa Amostral</span>
                        <strong className="text-slate-700 dark:text-slate-200 font-mono">1.0s (Intervalo)</strong>
                      </div>
                      <div>
                        <span className="text-slate-455 block">Retenção local</span>
                        <strong className="text-slate-700 dark:text-slate-200 font-mono">24h</strong>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-455 block">Compressão Deadband</span>
                        <strong className="text-slate-700 dark:text-slate-200 font-mono">Habilitado (Mag: 0.1)</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/10 text-slate-400 italic">
                    Histórico do Historian não configurado.
                  </div>
                )}

                {/* 4. Related Scripts */}
                <div className="space-y-2.5">
                  <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Scripts Relacionados</h4>
                  {getRelatedScripts(selectedProp).length > 0 ? (
                    <div className="space-y-1.5">
                      {getRelatedScripts(selectedProp).map((scr) => (
                        <div
                          key={scr.id}
                          className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-700 dark:text-slate-350 block truncate">{scr.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">Gatilho: {scr.trigger}</span>
                          </div>
                          
                          <button
                            onClick={() => handleJumpToObject(selectedProp.targetId, selectedProp.targetType)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-sky-500 rounded transition-colors"
                            title="Ir para o script"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic pl-1">Nenhum script utiliza essa propriedade.</p>
                  )}
                </div>

                {/* 5. Screens References */}
                <div className="space-y-2.5">
                  <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Telas Vinculadas</h4>
                  {getRelatedScreens(selectedProp).length > 0 ? (
                    <div className="space-y-1.5">
                      {getRelatedScreens(selectedProp).map((scr) => (
                        <div
                          key={scr.id}
                          className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Monitor className="w-3.5 h-3.5 text-violet-500" />
                            <span className="font-bold text-slate-700 dark:text-slate-350 truncate">{scr.name}</span>
                          </div>
                          
                          <button
                            onClick={() => handleJumpToScreen(scr.id)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-sky-500 rounded transition-colors"
                            title="Ver Tela"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic pl-1">Nenhuma tela exibe essa propriedade.</p>
                  )}
                </div>

                {/* 6. Widget References */}
                <div className="space-y-2.5">
                  <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Widgets Associados</h4>
                  {getRelatedWidgets(selectedProp).length > 0 ? (
                    <div className="space-y-1.5">
                      {getRelatedWidgets(selectedProp).map((w) => (
                        <div
                          key={w.id}
                          className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="font-bold text-slate-700 dark:text-slate-350 truncate">{w.name}</span>
                          </div>
                          
                          <button
                            onClick={() => handleJumpToWidget(w.id)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-sky-500 rounded transition-colors"
                            title="Ir para o Componente"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic pl-1">Nenhum widget de componente mapeado a essa propriedade.</p>
                  )}
                </div>

              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Info className="w-10 h-10 text-slate-300 dark:text-slate-750 mb-3" />
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nenhuma Variável Selecionada</h4>
              <p className="text-xs max-w-[240px] mt-1.5 leading-relaxed text-slate-500">
                Selecione uma propriedade na tabela da esquerda para carregar suas informações e relações no sistema.
              </p>
            </div>
          )}
        </aside>

      </div>
    </div>
  );
};
