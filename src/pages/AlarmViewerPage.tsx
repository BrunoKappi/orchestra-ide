import React, { useState, useMemo, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  ShieldAlert,
  AlertCircle,
  Search,
  FilterX,
  Download,
  CheckCircle,
  Clock,
  Trash2,
  User,
  ChevronRight,
  ChevronLeft,
  Calendar,
  CheckSquare,
  SlidersHorizontal,
  FolderSync
} from 'lucide-react';
import { useObjectModelStore } from '../store/useObjectModelStore';
import { HeaderNavigation } from '../components/navigation/HeaderNavigation';
import type { AlarmEvent } from '../types/domain';
import { cn } from '../utils/cn';

export const AlarmViewerPage: React.FC = () => {
  const {
    alarmEvents,
    objects,
    acknowledgeAlarms,
    clearAlarmHistory
  } = useObjectModelStore();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterObject, setFilterObject] = useState<string>('all');
  const [filterProperty, setFilterProperty] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all'); // all, 10m, 1h, 24h, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Table Configuration State
  const [sortBy, setSortBy] = useState<keyof AlarmEvent>('activatedAt');
  const [sortAsc, setSortAsc] = useState(false);
  const [groupBy, setGroupBy] = useState<'none' | 'object' | 'severity' | 'status'>('none');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedAlarmId, setSelectedAlarmId] = useState<string | null>(null);
  const [operatorName, setOperatorName] = useState('Operator');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selected Alarm Object
  const selectedAlarm = useMemo(() => {
    return alarmEvents.find((evt) => evt.id === selectedAlarmId) || null;
  }, [alarmEvents, selectedAlarmId]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchTerm, activeTab, filterSeverity, filterStatus, filterObject, filterProperty, filterPriority, filterPeriod, customStartDate, customEndDate, groupBy]);

  // Unique lists for filter dropdowns
  const uniqueProperties = useMemo(() => {
    const props = new Set<string>();
    alarmEvents.forEach((evt) => {
      if (evt.propertyName) props.add(evt.propertyName);
    });
    return Array.from(props);
  }, [alarmEvents]);

  // Filter & Sort Events
  const filteredEvents = useMemo(() => {
    let result = [...alarmEvents];

    // Mode: Active Alarms vs History
    if (activeTab === 'active') {
      result = result.filter((evt) => evt.status !== 'Cleared Acknowledged');
    }

    // Text Search (message, object, property, current value)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (evt) =>
          evt.message.toLowerCase().includes(q) ||
          evt.objectName.toLowerCase().includes(q) ||
          evt.propertyName.toLowerCase().includes(q) ||
          evt.currentValue.toLowerCase().includes(q)
      );
    }

    // Severity Filter
    if (filterSeverity !== 'all') {
      result = result.filter((evt) => evt.severity === filterSeverity);
    }

    // Status Filter
    if (filterStatus !== 'all') {
      result = result.filter((evt) => evt.status === filterStatus);
    }

    // Object Filter
    if (filterObject !== 'all') {
      result = result.filter((evt) => evt.objectId === filterObject);
    }

    // Property Filter
    if (filterProperty) {
      result = result.filter((evt) => evt.propertyName === filterProperty);
    }

    // Priority Filter
    if (filterPriority !== 'all') {
      const p = parseInt(filterPriority);
      if (p === 1) result = result.filter((evt) => evt.priority <= 30);
      else if (p === 2) result = result.filter((evt) => evt.priority > 30 && evt.priority <= 70);
      else if (p === 3) result = result.filter((evt) => evt.priority > 70);
    }

    // Period Filter
    if (filterPeriod !== 'all') {
      const nowMs = Date.now();
      if (filterPeriod === '10m') {
        result = result.filter((evt) => nowMs - new Date(evt.activatedAt).getTime() <= 10 * 60 * 1000);
      } else if (filterPeriod === '1h') {
        result = result.filter((evt) => nowMs - new Date(evt.activatedAt).getTime() <= 60 * 60 * 1000);
      } else if (filterPeriod === '24h') {
        result = result.filter((evt) => nowMs - new Date(evt.activatedAt).getTime() <= 24 * 60 * 60 * 1000);
      } else if (filterPeriod === 'custom' && customStartDate) {
        const start = new Date(customStartDate).getTime();
        const end = customEndDate ? new Date(customEndDate).getTime() : nowMs;
        result = result.filter((evt) => {
          const act = new Date(evt.activatedAt).getTime();
          return act >= start && act <= end;
        });
      }
    }

    // Sort Events
    result.sort((a, b) => {
      let valA: any = a[sortBy] ?? '';
      let valB: any = b[sortBy] ?? '';

      // Handle String vs Number vs Date
      if (sortBy === 'activatedAt' || sortBy === 'acknowledgedAt' || sortBy === 'clearedAt') {
        valA = valA ? new Date(valA).getTime() : 0;
        valB = valB ? new Date(valB).getTime() : 0;
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [alarmEvents, activeTab, searchTerm, filterSeverity, filterStatus, filterObject, filterProperty, filterPriority, filterPeriod, customStartDate, customEndDate, sortBy, sortAsc]);

  // Grouped Events list
  const groupedEvents = useMemo(() => {
    if (groupBy === 'none') return null;

    const groups: Record<string, AlarmEvent[]> = {};
    filteredEvents.forEach((evt) => {
      let key = 'Other';
      if (groupBy === 'object') key = evt.objectName;
      else if (groupBy === 'severity') key = evt.severity.toUpperCase();
      else if (groupBy === 'status') key = evt.status;

      if (!groups[key]) groups[key] = [];
      groups[key].push(evt);
    });

    return groups;
  }, [filteredEvents, groupBy]);

  // Counters for topo
  const activeSeverityCounters = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0, critical: 0 };
    alarmEvents.forEach((evt) => {
      // count active alarms (unacknowledged or active acknowledged)
      if (evt.status.startsWith('Active')) {
        counts[evt.severity] = (counts[evt.severity] || 0) + 1;
      }
    });
    return counts;
  }, [alarmEvents]);

  // Paginated Events
  const paginatedEvents = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredEvents.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredEvents, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / itemsPerPage));

  // Handlers
  const handleSort = (field: keyof AlarmEvent) => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(true);
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    const visibleIds = paginatedEvents.map((evt) => evt.id);
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds(selectedIds.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds([...new Set([...selectedIds, ...visibleIds])]);
    }
  };

  const handleAckSelected = () => {
    if (selectedIds.length === 0) return;
    acknowledgeAlarms(selectedIds, operatorName);
    setSelectedIds([]);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterSeverity('all');
    setFilterStatus('all');
    setFilterObject('all');
    setFilterProperty('');
    setFilterPriority('all');
    setFilterPeriod('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setGroupBy('none');
  };

  // Export functions
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredEvents, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `alarm_report_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Status', 'Severity', 'Priority', 'Object', 'Property', 'Message', 'Current Value', 'Config Value', 'Activated At', 'Acknowledged At', 'Cleared At', 'Acked By', 'Duration (ms)'];
    const rows = filteredEvents.map((evt) => [
      evt.id,
      evt.status,
      evt.severity,
      evt.priority,
      evt.objectName,
      evt.propertyName,
      evt.message,
      evt.currentValue,
      evt.configuredValue,
      evt.activatedAt,
      evt.acknowledgedAt || '',
      evt.clearedAt || '',
      evt.ackedBy || '',
      evt.durationMs || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
      
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `alarm_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const formatDuration = (ms: number | null) => {
    if (ms === null || ms === undefined) return '-';
    if (ms < 1000) return `${ms}ms`;
    const sec = Math.floor(ms / 1000);
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    if (min < 60) return `${min}m ${remainingSec}s`;
    const hrs = Math.floor(min / 60);
    const remainingMin = min % 60;
    return `${hrs}h ${remainingMin}m`;
  };

  const renderIcon = (iconName: string, className = 'w-4 h-4') => {
    switch (iconName) {
      case 'ShieldAlert':
        return <ShieldAlert className={className} />;
      case 'AlertTriangle':
        return <AlertTriangle className={className} />;
      case 'AlertCircle':
        return <AlertCircle className={className} />;
      case 'Bell':
      default:
        return <Bell className={className} />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <HeaderNavigation />

      {/* Main Content Pane */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        {/* Left main panel */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          
          {/* Severity counters header */}
          <div className="grid grid-cols-4 border-b border-slate-100 dark:border-slate-800 select-none">
            <div className="flex items-center gap-3 p-4 border-r border-slate-100 dark:border-slate-800/60 bg-rose-50/20 dark:bg-rose-950/10">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 shrink-0" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Crítico</span>
                <span className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono leading-none">
                  {activeSeverityCounters.critical}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border-r border-slate-100 dark:border-slate-800/60 bg-orange-50/20 dark:bg-orange-950/10">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 shrink-0" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Alto</span>
                <span className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono leading-none">
                  {activeSeverityCounters.high}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border-r border-slate-100 dark:border-slate-800/60 bg-yellow-50/20 dark:bg-yellow-950/10">
              <div className="w-9 h-9 rounded-xl bg-yellow-500/10 text-yellow-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 shrink-0" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Médio</span>
                <span className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono leading-none">
                  {activeSeverityCounters.medium}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-blue-50/20 dark:bg-blue-950/10">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Bell className="w-5 h-5 shrink-0" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Baixo</span>
                <span className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono leading-none">
                  {activeSeverityCounters.low}
                </span>
              </div>
            </div>
          </div>

          {/* Action and filter bar */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              {/* Active vs History Toggles */}
              <div className="flex items-center bg-slate-150 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/50 text-[11px] font-semibold">
                <button
                  onClick={() => setActiveTab('active')}
                  className={cn(
                    'px-3 py-1 rounded-md transition-all duration-150',
                    activeTab === 'active'
                      ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-450 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  )}
                >
                  Alarmes Ativos
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={cn(
                    'px-3 py-1 rounded-md transition-all duration-150',
                    activeTab === 'history'
                      ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-450 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  )}
                >
                  Histórico Completo
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Busca rápida por mensagem, objeto..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              {/* Operator details & Ack / Clear */}
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800">
                  <User className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                  <input
                    type="text"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    placeholder="Operador"
                    className="w-16 bg-transparent outline-none border-none text-[11px] font-semibold text-slate-700 dark:text-slate-350"
                    title="Nome do Operador para Reconhecimento"
                  />
                </div>

                <button
                  onClick={handleAckSelected}
                  disabled={selectedIds.length === 0}
                  className="flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 dark:disabled:text-slate-600 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Reconhecer ({selectedIds.length})</span>
                </button>

                {activeTab === 'history' && (
                  <button
                    onClick={clearAlarmHistory}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/30 text-rose-600 border border-rose-200/60 dark:border-rose-900/40 rounded-lg font-semibold transition-colors"
                    title="Limpar ocorrências resolvidas"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Limpar Histórico</span>
                  </button>
                )}

                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shrink-0">
                  <button
                    onClick={handleExportJSON}
                    className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 transition-colors"
                    title="Exportar JSON"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span className="text-[10px] font-semibold ml-1 mr-0.5">JSON</span>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                    title="Exportar CSV"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span className="text-[10px] font-semibold ml-1 mr-0.5">CSV</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Advanced Filters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 pt-3 border-t border-slate-150 dark:border-slate-800/60 text-[11px]">
              {/* Severity */}
              <div>
                <span className="block text-slate-400 font-semibold mb-1 uppercase text-[9px]">Severidade</span>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg outline-none text-[11px] focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-all font-medium"
                >
                  <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="all">Todas</option>
                  <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="critical">Critical (Crítica)</option>
                  <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-105" value="high">High (Alta)</option>
                  <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="medium">Medium (Média)</option>
                  <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="low">Low (Baixa)</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <span className="block text-slate-400 font-semibold mb-1 uppercase text-[9px]">Estado</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg outline-none text-[11px] focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-all font-medium"
                >
                  <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="all">Todos</option>
                  <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="Active Unacknowledged">Active Unacknowledged</option>
                  <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="Active Acknowledged">Active Acknowledged</option>
                  <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="Cleared Unacknowledged">Cleared Unacknowledged</option>
                  <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="Cleared Acknowledged">Cleared Acknowledged</option>
                </select>
              </div>

              {/* Object */}
              <div>
                <span className="block text-slate-400 font-semibold mb-1 uppercase text-[9px]">Objeto</span>
                <select
                  value={filterObject}
                  onChange={(e) => setFilterObject(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg outline-none text-[11px] focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-all font-medium"
                >
                  <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="all">Todos</option>
                  {objects.map((obj) => (
                    <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" key={obj.id} value={obj.id}>
                      {obj.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Property */}
              <div>
                <span className="block text-slate-400 font-semibold mb-1 uppercase text-[9px]">Propriedade</span>
                <select
                  value={filterProperty}
                  onChange={(e) => setFilterProperty(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg outline-none text-[11px] focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-all font-medium"
                >
                  <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="">Todas</option>
                  {uniqueProperties.map((p) => (
                    <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <span className="block text-slate-400 font-semibold mb-1 uppercase text-[9px]">Prioridade</span>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg outline-none text-[11px] focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-all font-medium"
                >
                  <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="all">Todas</option>
                  <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="1">Baixa (P ≤ 30)</option>
                  <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="2">Média (30 &lt; P ≤ 70)</option>
                  <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="3">Alta (P &gt; 70)</option>
                </select>
              </div>

              {/* Period / Grouping */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="block text-slate-400 font-semibold uppercase text-[9px]">Agrupamento</span>
                </div>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg outline-none text-[11px] focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-all font-medium"
                >
                  <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="none">Sem Agrupamento</option>
                  <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="object">Por Objeto</option>
                  <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="severity">Por Severidade</option>
                  <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="status">Por Estado</option>
                </select>
              </div>

            </div>

            {/* Time Filter Sub-panel */}
            <div className="flex items-center gap-4 text-[11px] pt-2 border-t border-slate-100 dark:border-slate-850 select-none">
              <span className="block text-slate-400 font-semibold uppercase text-[9px]">Período</span>
              <div className="flex items-center gap-1.5">
                {['all', '10m', '1h', '24h', 'custom'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setFilterPeriod(p)}
                    className={cn(
                      'px-2.5 py-1 rounded transition-colors font-medium border',
                      filterPeriod === p
                        ? 'bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-950/40 dark:border-sky-900/60 dark:text-sky-300'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 hover:bg-slate-50'
                    )}
                  >
                    {p === 'all' && 'Tudo'}
                    {p === '10m' && 'Últimos 10 min'}
                    {p === '1h' && 'Última 1 hora'}
                    {p === '24h' && 'Últimas 24 horas'}
                    {p === 'custom' && 'Personalizado'}
                  </button>
                ))}
              </div>

              {filterPeriod === 'custom' && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-150">
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="datetime-local"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="bg-transparent border-none outline-none font-mono text-[10px] text-slate-700 dark:text-slate-300"
                    />
                  </div>
                  <span className="text-slate-450">até</span>
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="datetime-local"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="bg-transparent border-none outline-none font-mono text-[10px] text-slate-700 dark:text-slate-300"
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleClearFilters}
                className="ml-auto flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <FilterX className="w-3.5 h-3.5" />
                <span>Limpar Filtros</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto bg-slate-50/20 dark:bg-slate-900/20">
            {filteredEvents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-10 text-center select-none text-slate-400">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <CheckCircle className="w-6 h-6 text-slate-300 dark:text-slate-750" />
                </div>
                <h4 className="font-semibold text-slate-750 dark:text-slate-350">Tudo Normal</h4>
                <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">Nenhuma ocorrência atende aos filtros definidos.</p>
              </div>
            ) : groupBy !== 'none' ? (
              // Grouped View
              <div className="p-4 space-y-6">
                {Object.entries(groupedEvents || {}).map(([groupTitle, list]) => (
                  <div key={groupTitle} className="space-y-2">
                    <h5 className="font-bold text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 select-none">
                      <FolderSync className="w-4 h-4 text-slate-450 shrink-0" />
                      <span>{groupTitle}</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">
                        {list.length}
                      </span>
                    </h5>
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                      {renderTableBody(list, false)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Standard paginated view
              renderTableBody(paginatedEvents, true)
            )}
          </div>

          {/* Table pagination footer (only when not grouped) */}
          {groupBy === 'none' && filteredEvents.length > 0 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500 select-none">
              <span>
                Exibindo <span className="font-bold text-slate-700 dark:text-slate-300">
                  {Math.min(filteredEvents.length, (currentPage - 1) * itemsPerPage + 1)}
                </span> a <span className="font-bold text-slate-700 dark:text-slate-300">
                  {Math.min(filteredEvents.length, currentPage * itemsPerPage)}
                </span> de <span className="font-bold text-slate-700 dark:text-slate-300">{filteredEvents.length}</span> alarmes
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors',
                      currentPage === i + 1
                        ? 'bg-sky-600 text-white'
                        : 'border border-slate-205 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Details Side Panel */}
        <div className="w-80 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden shrink-0">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2 select-none">
            <SlidersHorizontal className="w-4 h-4 text-sky-500" />
            <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">Detalhes do Alarme</h4>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-5 text-xs">
            {selectedAlarm ? (
              <div className="space-y-4">
                {/* Visual Header */}
                <div className="p-4 rounded-xl flex items-start gap-3 text-slate-900/90 border" style={{ backgroundColor: `${selectedAlarm.color}15`, borderColor: `${selectedAlarm.color}40` }}>
                  <div className="p-2 rounded-lg text-white" style={{ backgroundColor: selectedAlarm.color }}>
                    {renderIcon(selectedAlarm.icon, 'w-5 h-5')}
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-wide" style={{ color: selectedAlarm.color }}>
                      {selectedAlarm.severity} (Prioridade: {selectedAlarm.priority})
                    </span>
                    <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5 break-words">
                      {selectedAlarm.propertyName}
                    </h5>
                    <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                      {selectedAlarm.objectName}
                    </span>
                  </div>
                </div>

                {/* State Transition Details */}
                <div className="space-y-2.5">
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-850 pb-1.5">
                    <span className="text-slate-400 font-semibold">Estado Atual</span>
                    <span className={cn(
                      'font-bold',
                      selectedAlarm.status.startsWith('Active') ? 'text-rose-500 animate-pulse' : 'text-emerald-500'
                    )}>
                      {selectedAlarm.status}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-850 pb-1.5">
                    <span className="text-slate-400 font-semibold">Valor Atual</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                      {selectedAlarm.currentValue}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-850 pb-1.5">
                    <span className="text-slate-400 font-semibold">Valor Disparo</span>
                    <span className="font-mono text-slate-700 dark:text-slate-200">
                      {selectedAlarm.configuredValue}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-850 pb-1.5">
                    <span className="text-slate-400 font-semibold">Ativação</span>
                    <span className="font-mono text-slate-650 dark:text-slate-350">
                      {new Date(selectedAlarm.activatedAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-850 pb-1.5">
                    <span className="text-slate-400 font-semibold">Duração</span>
                    <span className="font-mono text-slate-650 dark:text-slate-350">
                      {formatDuration(selectedAlarm.durationMs)}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-850 pb-1.5">
                    <span className="text-slate-400 font-semibold">Retorno Normal</span>
                    <span className="font-mono text-slate-650 dark:text-slate-350">
                      {selectedAlarm.clearedAt ? new Date(selectedAlarm.clearedAt).toLocaleString() : <span className="text-rose-450 italic">Ainda ativo</span>}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-850 pb-1.5">
                    <span className="text-slate-400 font-semibold">Reconhecimento</span>
                    <span className="font-mono text-slate-650 dark:text-slate-350">
                      {selectedAlarm.acknowledgedAt ? new Date(selectedAlarm.acknowledgedAt).toLocaleString() : <span className="text-slate-400 italic">Pendente</span>}
                    </span>
                  </div>

                  {selectedAlarm.ackedBy && (
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-850 pb-1.5">
                      <span className="text-slate-400 font-semibold">Resp. Reconhecer</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {selectedAlarm.ackedBy}
                      </span>
                    </div>
                  )}
                </div>

                {/* Message detail area */}
                <div className="space-y-1 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200/50 dark:border-slate-750/50">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Mensagem Customizada</span>
                  <p className="text-slate-700 dark:text-slate-350 leading-relaxed break-words font-medium">
                    {selectedAlarm.message}
                  </p>
                </div>

                {/* Quick actions in Details side panel */}
                {!selectedAlarm.acknowledgedAt && (
                  <button
                    onClick={() => acknowledgeAlarms([selectedAlarm.id], operatorName)}
                    className="w-full mt-2 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>Reconhecer Alarme</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-20 select-none">
                <Bell className="w-8 h-8 text-slate-300 dark:text-slate-750 mb-2" />
                <p className="font-semibold">Nenhum alarme selecionado.</p>
                <p className="text-[10px] text-slate-450 mt-0.5">Selecione uma linha da tabela para ver todos os detalhes.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render Table Element Helper
  function renderTableBody(eventsList: AlarmEvent[], showHeader: boolean) {
    return (
      <table className="w-full border-collapse text-left text-xs bg-white dark:bg-slate-900 select-none">
        {showHeader && (
          <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 sticky top-0 backdrop-blur-xs z-10">
            <tr className="text-slate-500 dark:text-slate-400 font-semibold select-none">
              <th className="py-2.5 px-3 w-8 whitespace-nowrap">
                <button
                  onClick={toggleSelectAll}
                  className="p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </th>
              <th className="py-2.5 px-3 w-28 whitespace-nowrap">
                <button onClick={() => handleSort('status')} className="flex items-center gap-1 font-semibold hover:text-slate-905 dark:hover:text-slate-200">
                  <span>Estado</span>
                </button>
              </th>
              <th className="py-2.5 px-3 w-16 whitespace-nowrap">
                <button onClick={() => handleSort('severity')} className="flex items-center gap-1 font-semibold hover:text-slate-905 dark:hover:text-slate-200">
                  <span>Severidade</span>
                </button>
              </th>
              <th className="py-2.5 px-3 w-28 whitespace-nowrap">
                <button onClick={() => handleSort('objectName')} className="flex items-center gap-1 font-semibold hover:text-slate-905 dark:hover:text-slate-200">
                  <span>Objeto</span>
                </button>
              </th>
              <th className="py-2.5 px-3 w-28 whitespace-nowrap">
                <button onClick={() => handleSort('propertyName')} className="flex items-center gap-1 font-semibold hover:text-slate-905 dark:hover:text-slate-200">
                  <span>Propriedade</span>
                </button>
              </th>
              <th className="py-2.5 px-3 w-16 whitespace-nowrap">Valor</th>
              <th className="py-2.5 px-3">Mensagem</th>
              <th className="py-2.5 px-3 w-40 whitespace-nowrap">
                <button onClick={() => handleSort('activatedAt')} className="flex items-center gap-1 font-semibold hover:text-slate-905 dark:hover:text-slate-200">
                  <span>Data/Hora Ativação</span>
                </button>
              </th>
              <th className="py-2.5 px-3 w-16 text-right whitespace-nowrap">Duração</th>

            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {eventsList.map((evt) => {
            const isSelected = selectedIds.includes(evt.id);
            const isAlarmActive = evt.status.startsWith('Active');
            const isActiveUnacknowledged = evt.status === 'Active Unacknowledged';
            const isSelectedDetail = selectedAlarmId === evt.id;

            return (
              <tr
                key={evt.id}
                onClick={() => setSelectedAlarmId(evt.id)}
                className={cn(
                  'group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer relative',
                  isActiveUnacknowledged && 'bg-rose-500/5 dark:bg-rose-950/5 border-l-2',
                  isSelectedDetail && 'bg-sky-500/5 dark:bg-sky-950/10 border-l-2 border-sky-600'
                )}
                style={isActiveUnacknowledged ? { borderLeftColor: evt.color } : {}}
              >
                {/* Select Box */}
                <td className="py-2 px-2.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => toggleSelect(evt.id)}
                    className="p-1 rounded text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-850 flex items-center justify-center"
                  >
                    {isSelected ? (
                      <CheckCircle className="w-3.5 h-3.5 text-sky-500" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-350 dark:border-slate-700" />
                    )}
                  </button>
                </td>

                {/* Status */}
                <td className="py-2 px-2.5 whitespace-nowrap">
                  <span className={cn(
                    'font-semibold text-[10px] inline-flex items-center gap-1',
                    isAlarmActive ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'
                  )}>
                    {isAlarmActive ? <Clock className="w-3 h-3 text-rose-500 animate-spin" style={{ animationDuration: '4s' }} /> : <CheckCircle className="w-3 h-3 text-emerald-500" />}
                    <span>{evt.status.replace('Acknowledged', 'Ack').replace('Unacknowledged', 'Unack')}</span>
                  </span>
                </td>

                {/* Severity Badge */}
                <td className="py-2 px-2.5 whitespace-nowrap">
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wide text-white font-mono"
                    style={{ backgroundColor: evt.color }}
                  >
                    {renderIcon(evt.icon, 'w-2.5 h-2.5')}
                    <span>{evt.severity}</span>
                  </span>
                </td>

                {/* Object */}
                <td className="py-2 px-2.5 whitespace-nowrap font-semibold text-slate-700 dark:text-slate-300">
                  {evt.objectName}
                </td>

                {/* Property */}
                <td className="py-2 px-2.5 whitespace-nowrap font-mono font-medium text-slate-650 dark:text-slate-300">
                  {evt.propertyName}
                </td>

                {/* Value */}
                <td className="py-2 px-2.5 whitespace-nowrap font-mono font-bold text-slate-750 dark:text-slate-200">
                  {evt.currentValue}
                </td>

                {/* Message */}
                <td className="py-2 px-2.5 font-medium text-slate-800 dark:text-slate-200 line-clamp-1 max-w-xs mt-1.5">
                  {evt.message}
                </td>

                {/* Date/Time */}
                <td className="py-2 px-2.5 whitespace-nowrap font-mono text-slate-500 dark:text-slate-400 text-[10px]">
                  {new Date(evt.activatedAt).toLocaleString()}
                </td>

                {/* Duration */}
                <td className="py-2 px-2.5 whitespace-nowrap font-mono text-slate-600 dark:text-slate-300 text-right font-medium">
                  {formatDuration(evt.durationMs)}
                </td>

              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }
};
