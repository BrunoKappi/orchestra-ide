import React, { useState, useMemo, useEffect } from 'react';
import { useLogStore } from '../store/useLogStore';
import { HeaderNavigation } from '../components/navigation/HeaderNavigation';
import { Modal } from '../components/ui/Modal';
import {
  Search,
  Filter,
  RotateCcw,
  FileDown,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  History,
  FileText,
  Activity,
  ShieldAlert,
  AlertTriangle,
  ArrowUpDown,
  Database,
} from 'lucide-react';
import type { AuditLog, LogSeverity } from '../types/log';
import { cn } from '../utils/cn';

export const LogsPage: React.FC = () => {
  const { logs, init } = useLogStore();

  // Initialize logs on mount
  useEffect(() => {
    init();
  }, [init]);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedOperation, setSelectedOperation] = useState<string>('all');
  const [selectedResult, setSelectedResult] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Sorting
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  // Detail Modal / Drawer state
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset Filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedModule('all');
    setSelectedUser('all');
    setSelectedSeverity('all');
    setSelectedOperation('all');
    setSelectedResult('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Get distinct values for filter selectors based on actual logs
  const modulesList = useMemo(() => {
    const set = new Set(logs.map((l) => l.module));
    return Array.from(set).sort();
  }, [logs]);

  const usersList = useMemo(() => {
    const set = new Set(logs.map((l) => l.user));
    return Array.from(set).sort();
  }, [logs]);

  const operationsList = useMemo(() => {
    const set = new Set(logs.map((l) => l.operation));
    return Array.from(set).sort();
  }, [logs]);

  // Statistics / KPIs
  const stats = useMemo(() => {
    const total = logs.length;
    
    // Events today (based on date part of timestamp)
    const todayStr = new Date().toISOString().substring(0, 10);
    const today = logs.filter((l) => l.timestamp.startsWith(todayStr)).length;

    const critical = logs.filter((l) => l.severity === 'Crítico').length;
    
    const admin = logs.filter(
      (l) => l.module === 'Segurança' || ['CREATE', 'DELETE', 'CONFIGURE'].includes(l.operation)
    ).length;

    const failures = logs.filter((l) => l.result === 'Falha' || l.severity === 'Erro').length;

    return { total, today, critical, admin, failures };
  }, [logs]);

  // Filtered & Sorted logs
  const filteredLogs = useMemo(() => {
    let result = [...logs];

    // Text search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (l) =>
          l.user.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.entity.toLowerCase().includes(q) ||
          (l.targetId && l.targetId.toLowerCase().includes(q))
      );
    }

    // Module filter
    if (selectedModule !== 'all') {
      result = result.filter((l) => l.module === selectedModule);
    }

    // User filter
    if (selectedUser !== 'all') {
      result = result.filter((l) => l.user === selectedUser);
    }

    // Severity filter
    if (selectedSeverity !== 'all') {
      result = result.filter((l) => l.severity === selectedSeverity);
    }

    // Operation filter
    if (selectedOperation !== 'all') {
      result = result.filter((l) => l.operation === selectedOperation);
    }

    // Result filter
    if (selectedResult !== 'all') {
      result = result.filter((l) => l.result === selectedResult);
    }

    // Date range filter
    if (startDate) {
      result = result.filter((l) => l.timestamp >= startDate + ' 00:00:00');
    }
    if (endDate) {
      result = result.filter((l) => l.timestamp <= endDate + ' 23:59:59');
    }

    // Sort by timestamp
    result.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.timestamp.localeCompare(b.timestamp);
      } else {
        return b.timestamp.localeCompare(a.timestamp);
      }
    });

    return result;
  }, [
    logs,
    searchTerm,
    selectedModule,
    selectedUser,
    selectedSeverity,
    selectedOperation,
    selectedResult,
    startDate,
    endDate,
    sortOrder,
  ]);

  // Paginated logs
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredLogs.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredLogs, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredLogs.length / rowsPerPage) || 1;

  // Sync page if out of bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredLogs.length, currentPage, totalPages]);

  // Copy to clipboard helper
  const handleCopyDetails = (log: AuditLog) => {
    const text = `
LOG DETAILS - ORQUESTRA INDUSTRIAL
---------------------------------------
ID: ${log.id}
Data e Hora: ${log.timestamp}
Responsável: ${log.user}
Módulo: ${log.module}
Entidade: ${log.entity}
Operação: ${log.operation}
Ação: ${log.action}
Descrição: ${log.description}
Severidade: ${log.severity}
Resultado: ${log.result}
Origem: ${log.origin}
ID Registro Afetado: ${log.targetId || '-'}
Valor Anterior: ${log.previousValue || '-'}
Valor Posterior: ${log.newValue || '-'}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // CSV Export helper
  const exportToCSV = () => {
    const headers = [
      'ID',
      'Data e Hora',
      'Usuario',
      'Modulo',
      'Entidade',
      'Operacao',
      'Acao',
      'Descricao',
      'Severidade',
      'Resultado',
      'Origem',
      'ID Registro Afetado',
    ];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      l.user,
      l.module,
      l.entity,
      l.operation,
      l.action,
      l.description.replace(/"/g, '""'),
      l.severity,
      l.result,
      l.origin,
      l.targetId || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `orquestra_audit_logs_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // JSON Export helper
  const exportToJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(filteredLogs, null, 2)
    )}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `orquestra_audit_logs_${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to parse potential JSON stringified property configurations
  const parseDiffValues = (valStr?: string) => {
    if (!valStr) return null;
    try {
      if (valStr.startsWith('{') || valStr.startsWith('[')) {
        return JSON.parse(valStr);
      }
    } catch {
      // Ignora e trata como texto
    }
    return valStr;
  };

  // Render previous vs new value diff table
  const renderValueDiff = (log: AuditLog) => {
    const prevParsed = parseDiffValues(log.previousValue);
    const newParsed = parseDiffValues(log.newValue);

    if (!prevParsed && !newParsed) return null;

    // Case 1: Simple text values
    if (typeof prevParsed === 'string' || typeof newParsed === 'string' || !prevParsed || !newParsed) {
      const prevVal = String(prevParsed || log.previousValue || '-');
      const newVal = String(newParsed || log.newValue || '-');
      return (
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-500">
                <th className="px-3 py-1.5 w-1/2">Estado Anterior</th>
                <th className="px-3 py-1.5 w-1/2">Novo Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr className="divide-x divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-350">
                <td className="px-3 py-2 font-mono break-all bg-red-500/5 text-red-600 dark:text-red-400">
                  {prevVal}
                </td>
                <td className="px-3 py-2 font-mono break-all bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">
                  {newVal}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    // Case 2: Object key-value changes
    const keys = Array.from(new Set([...Object.keys(prevParsed), ...Object.keys(newParsed)]));
    return (
      <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-[11px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-500">
              <th className="px-3 py-1.5">Propriedade</th>
              <th className="px-3 py-1.5">Valor Anterior</th>
              <th className="px-3 py-1.5">Novo Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {keys.map((k) => {
              const prev = prevParsed[k] !== undefined ? String(prevParsed[k]) : undefined;
              const next = newParsed[k] !== undefined ? String(newParsed[k]) : undefined;
              if (prev === next) return null; // Apenas mudanças
              return (
                <tr key={k} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10">
                  <td className="px-3 py-1.5 font-semibold font-mono text-slate-500">{k}</td>
                  <td className="px-3 py-1.5 font-mono text-red-500 bg-red-500/5">{prev ?? '-'}</td>
                  <td className="px-3 py-1.5 font-mono text-emerald-500 bg-emerald-500/5">{next ?? '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <HeaderNavigation />

      {/* KPI Stats Top Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 shrink-0">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-[1600px] mx-auto">
          {/* Card 1: Total Eventos */}
          <div className="bg-slate-50/60 dark:bg-slate-950/20 border border-slate-200/80 dark:border-slate-800 p-2.5 rounded-lg flex items-center gap-3">
            <div className="p-2 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total de Eventos</p>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{stats.total}</h3>
            </div>
          </div>

          {/* Card 2: Hoje */}
          <div className="bg-slate-50/60 dark:bg-slate-950/20 border border-slate-200/80 dark:border-slate-800 p-2.5 rounded-lg flex items-center gap-3">
            <div className="p-2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Eventos de Hoje</p>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{stats.today}</h3>
            </div>
          </div>

          {/* Card 3: Críticos */}
          <div className="bg-slate-50/60 dark:bg-slate-950/20 border border-slate-200/80 dark:border-slate-800 p-2.5 rounded-lg flex items-center gap-3">
            <div className="p-2 rounded bg-red-500/10 text-red-600 dark:text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Alterações Críticas</p>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{stats.critical}</h3>
            </div>
          </div>

          {/* Card 4: Administrativos */}
          <div className="bg-slate-50/60 dark:bg-slate-950/20 border border-slate-200/80 dark:border-slate-800 p-2.5 rounded-lg flex items-center gap-3">
            <div className="p-2 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Ações Admin</p>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{stats.admin}</h3>
            </div>
          </div>

          {/* Card 5: Falhas */}
          <div className="bg-slate-50/60 dark:bg-slate-950/20 border border-slate-200/80 dark:border-slate-800 p-2.5 rounded-lg flex items-center gap-3 col-span-2 md:col-span-1">
            <div className="p-2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Falhas / Erros</p>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{stats.failures}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <main className="flex-1 overflow-hidden flex flex-col md:flex-row max-w-[1600px] w-full mx-auto p-4 md:p-6 gap-6">
        
        {/* Filters Sidebar (Sleek collapsible-style sidebar) */}
        <div className="w-full md:w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col shrink-0 overflow-y-auto max-h-full">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-sky-500" />
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Filtros Combinados</h3>
            </div>
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-sky-500 transition-colors cursor-pointer"
              title="Limpar todos os filtros"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpar</span>
            </button>
          </div>

          <div className="space-y-4 text-xs flex-1">
            {/* Free Search */}
            <div>
              <label className="block font-bold text-slate-500 dark:text-slate-450 mb-1.5">Busca Livre</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  placeholder="Usuário, descrição, ID..."
                  className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-sky-500 text-xs transition-colors"
                />
              </div>
            </div>

            {/* Date Range Start */}
            <div>
              <label className="block font-bold text-slate-500 dark:text-slate-400 mb-1.5">Período De</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 text-xs transition-all"
              />
            </div>

            {/* Date Range End */}
            <div>
              <label className="block font-bold text-slate-500 dark:text-slate-400 mb-1.5">Até</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 text-xs transition-all"
              />
            </div>

            {/* Module Filter */}
            <div>
              <label className="block font-bold text-slate-500 dark:text-slate-400 mb-1.5">Módulo</label>
              <select
                value={selectedModule}
                onChange={(e) => { setSelectedModule(e.target.value); setCurrentPage(1); }}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 text-xs transition-all font-medium"
              >
                <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="all">Todos os Módulos</option>
                {modulesList.map((m) => (
                  <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* User Filter */}
            <div>
              <label className="block font-bold text-slate-500 dark:text-slate-400 mb-1.5">Usuário Responsável</label>
              <select
                value={selectedUser}
                onChange={(e) => { setSelectedUser(e.target.value); setCurrentPage(1); }}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 text-xs transition-all font-medium"
              >
                <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="all">Todos os Usuários</option>
                {usersList.map((u) => (
                  <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            {/* Severity Filter */}
            <div>
              <label className="block font-bold text-slate-500 dark:text-slate-400 mb-1.5">Severidade</label>
              <select
                value={selectedSeverity}
                onChange={(e) => { setSelectedSeverity(e.target.value); setCurrentPage(1); }}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 text-xs transition-all font-medium"
              >
                <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="all">Todas</option>
                <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="Informação">Informação</option>
                <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="Sucesso">Sucesso</option>
                <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="Aviso">Aviso</option>
                <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="Erro">Erro</option>
                <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="Crítico">Crítico</option>
              </select>
            </div>

            {/* Operation Filter */}
            <div>
              <label className="block font-bold text-slate-500 dark:text-slate-400 mb-1.5">Operação (BPMN/CRUD)</label>
              <select
                value={selectedOperation}
                onChange={(e) => { setSelectedOperation(e.target.value); setCurrentPage(1); }}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 text-xs transition-all font-medium"
              >
                <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="all">Todas</option>
                {operationsList.map((op) => (
                  <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>

            {/* Result Filter */}
            <div>
              <label className="block font-bold text-slate-500 dark:text-slate-400 mb-1.5">Resultado</label>
              <select
                value={selectedResult}
                onChange={(e) => { setSelectedResult(e.target.value); setCurrentPage(1); }}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 text-xs transition-all font-medium"
              >
                <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="all">Todos</option>
                <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="Sucesso">Sucesso</option>
                <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="Falha">Falha</option>
                <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="Bloqueado">Bloqueado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabela de Logs (SCADA/MES Style Table) */}
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-2xs">
          
          {/* Action Bar */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between shrink-0 text-xs">
            <div className="font-semibold text-slate-500">
              Mostrando <strong className="text-slate-800 dark:text-slate-200">{filteredLogs.length}</strong> eventos registrados
            </div>
            
            {/* Export & Administrative actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-650 dark:text-slate-300 font-semibold rounded-lg cursor-pointer transition-colors shadow-2xs"
                title="Exportar registros filtrados em CSV"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </button>

              <button
                onClick={exportToJSON}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-650 dark:text-slate-300 font-semibold rounded-lg cursor-pointer transition-colors shadow-2xs"
                title="Exportar registros filtrados em JSON"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Exportar JSON</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto bg-white dark:bg-slate-900 relative">
            <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="sticky top-0 bg-slate-100/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 z-10 text-slate-500 font-bold select-none backdrop-blur-xs">
                  <th 
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3.5 py-2.5 w-[140px] cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Data e Hora</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-3.5 py-2.5 w-[120px]">Usuário</th>
                  <th className="px-3.5 py-2.5 w-[100px]">Módulo</th>
                  <th className="px-3.5 py-2.5 w-[100px]">Entidade</th>
                  <th className="px-3.5 py-2.5 w-[90px]">Operação</th>
                  <th className="px-3.5 py-2.5">Ação</th>
                  <th className="px-3.5 py-2.5 w-[90px]">Severidade</th>
                  <th className="px-3.5 py-2.5 w-[90px]">Resultado</th>
                  <th className="px-3.5 py-2.5 w-[80px]">Origem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                {paginatedLogs.map((log) => {
                  
                  // Color codes for severities (Modern, light dark support)
                  const severityStyles: Record<LogSeverity, string> = {
                    'Informação': 'bg-sky-500/10 text-sky-600 dark:text-sky-400 dark:bg-sky-500/5',
                    'Sucesso': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 dark:bg-emerald-500/5',
                    'Aviso': 'bg-amber-500/10 text-amber-600 dark:text-amber-450 dark:bg-amber-500/5',
                    'Erro': 'bg-red-500/10 text-red-650 dark:text-red-450 dark:bg-red-500/5',
                    'Crítico': 'bg-purple-500/10 text-purple-650 dark:text-purple-450 dark:bg-purple-500/5 font-bold border border-purple-500/30 ring-1 ring-purple-500/15',
                  };

                  const resultStyles = {
                    'Sucesso': 'text-emerald-650 dark:text-emerald-450',
                    'Falha': 'text-red-600 dark:text-red-400 font-semibold',
                    'Bloqueado': 'text-amber-600 dark:text-amber-400 font-semibold',
                  };

                  return (
                    <tr 
                      key={log.id} 
                      onClick={() => setSelectedLog(log)}
                      className={cn(
                        "hover:bg-slate-50/80 dark:hover:bg-slate-950/40 cursor-pointer transition-colors border-l-2",
                        selectedLog?.id === log.id 
                          ? "bg-sky-50/50 dark:bg-sky-950/20 border-l-sky-500" 
                          : "border-l-transparent"
                      )}
                    >
                      <td className="px-3.5 py-2 text-slate-450 dark:text-slate-500">{log.timestamp}</td>
                      <td className="px-3.5 py-2 font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{log.user}</td>
                      <td className="px-3.5 py-2">
                        {(() => {
                          const m = log.module;
                          let bg = 'bg-slate-100 dark:bg-slate-800/80';
                          let text = 'text-slate-700 dark:text-slate-300';
                          let border = 'border-slate-200 dark:border-slate-700';

                          if (m === 'OMM') {
                            bg = 'bg-sky-50 dark:bg-sky-950/40';
                            text = 'text-sky-700 dark:text-sky-350';
                            border = 'border-sky-200 dark:border-sky-800/60';
                          } else if (m === 'Segurança') {
                            bg = 'bg-purple-50 dark:bg-purple-950/40';
                            text = 'text-purple-700 dark:text-purple-355';
                            border = 'border-purple-200 dark:border-purple-800/60';
                          } else if (m === 'Cut-off') {
                            bg = 'bg-amber-50 dark:bg-amber-950/40';
                            text = 'text-amber-700 dark:text-amber-355';
                            border = 'border-amber-200 dark:border-amber-800/60';
                          } else if (m === 'Orquestra') {
                            bg = 'bg-indigo-50 dark:bg-indigo-950/40';
                            text = 'text-indigo-700 dark:text-indigo-355';
                            border = 'border-indigo-200 dark:border-indigo-800/60';
                          } else if (m === 'Alarmes') {
                            bg = 'bg-rose-50 dark:bg-rose-950/40';
                            text = 'text-rose-700 dark:text-rose-355';
                            border = 'border-rose-200 dark:border-rose-800/60';
                          } else if (m === 'Simulador') {
                            bg = 'bg-emerald-50 dark:bg-emerald-950/40';
                            text = 'text-emerald-700 dark:text-emerald-355';
                            border = 'border-emerald-200 dark:border-emerald-800/60';
                          }

                          return (
                            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border", bg, text, border)}>
                              {m}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-3.5 py-2 text-slate-500 dark:text-slate-400">{log.entity}</td>
                      <td className="px-3.5 py-2 text-slate-450 dark:text-slate-500">{log.operation}</td>
                      <td className="px-3.5 py-2 font-medium text-slate-750 dark:text-slate-200 truncate max-w-[300px]" title={log.action}>
                        {log.action}
                      </td>
                      <td className="px-3.5 py-2">
                        <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide", severityStyles[log.severity])}>
                          {log.severity}
                        </span>
                      </td>
                      <td className={cn("px-3.5 py-2 font-semibold", resultStyles[log.result])}>
                        {log.result}
                      </td>
                      <td className="px-3.5 py-2 text-slate-400 capitalize">{log.origin}</td>
                    </tr>
                  );
                })}

                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-400 font-sans">
                      <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold">Nenhum evento encontrado</p>
                      <p className="text-xs text-slate-450 mt-1">Experimente ajustar os filtros ou redefinir a busca.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Controls */}
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs bg-slate-50/50 dark:bg-slate-900/30">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Registros por página:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="px-1.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded outline-none text-xs"
              >
                <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value={10}>10</option>
                <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value={15}>15</option>
                <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value={20}>20</option>
                <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-slate-500">
                Página <strong className="text-slate-800 dark:text-slate-200">{currentPage}</strong> de <strong className="text-slate-800 dark:text-slate-200">{totalPages}</strong>
              </span>
              
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Detalhes da Evidência */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Detalhes da Evidência"
        subtitle="Registro completo de alterações e auditoria de segurança"
        maxWidth="max-w-xl"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            {/* Event title and ID with Copy Button */}
            <div>
              <span className="text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase block mb-1">Identificador de Evento</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-500 select-all block bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50 font-semibold flex-1 truncate text-left">
                  {selectedLog.id}
                </span>
                <button
                  onClick={() => handleCopyDetails(selectedLog)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 font-semibold cursor-pointer transition-colors shadow-2xs shrink-0"
                  title="Copiar detalhes para a área de transferência"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Status and Severity Badges */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Severidade</span>
                <span className={cn(
                  "px-2.5 py-1 rounded text-center block text-[11px] font-bold tracking-wider font-mono",
                  selectedLog.severity === 'Informação' && 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
                  selectedLog.severity === 'Sucesso' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450',
                  selectedLog.severity === 'Aviso' && 'bg-amber-500/10 text-amber-600 dark:text-amber-450',
                  selectedLog.severity === 'Erro' && 'bg-red-500/10 text-red-600 dark:text-red-400',
                  selectedLog.severity === 'Crítico' && 'bg-purple-500/15 text-purple-650 dark:text-purple-400 border border-purple-500/30'
                )}>
                  {selectedLog.severity}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Resultado</span>
                <span className={cn(
                  "px-2.5 py-1 rounded text-center block text-[11px] font-bold tracking-wider font-mono",
                  selectedLog.result === 'Sucesso' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450',
                  selectedLog.result === 'Falha' && 'bg-red-500/10 text-red-650 dark:text-red-400',
                  selectedLog.result === 'Bloqueado' && 'bg-amber-500/10 text-amber-650 dark:text-amber-400'
                )}>
                  {selectedLog.result}
                </span>
              </div>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 p-3 rounded-xl">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Data e Hora Exata</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-left block">{selectedLog.timestamp}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Usuário Responsável</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-left block">{selectedLog.user}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Módulo</span>
                <span className="font-semibold text-slate-850 dark:text-slate-300 text-left block">{selectedLog.module}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Entidade Afetada</span>
                <span className="font-semibold text-slate-850 dark:text-slate-300 text-left block">{selectedLog.entity}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Operação (BPMN)</span>
                <span className="font-semibold text-slate-850 dark:text-slate-300 font-mono text-[11px] text-left block">{selectedLog.operation}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Origem da Ação</span>
                <span className="font-semibold text-slate-850 dark:text-slate-300 capitalize text-left block">{selectedLog.origin}</span>
              </div>
            </div>

            {/* Action & Description */}
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Ação Executada</span>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/50 dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200/50 dark:border-slate-800 text-left">
                {selectedLog.action}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Descrição Completa</span>
              <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-sans bg-slate-100/20 dark:bg-slate-900/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 text-left">
                {selectedLog.description}
              </p>
            </div>

            {/* Target ID affected */}
            {selectedLog.targetId && (
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Registro Afetado</span>
                <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 bg-sky-500/5 px-2.5 py-1.5 rounded-lg border border-sky-500/10 font-semibold font-mono text-[11px]">
                  <Database className="w-3.5 h-3.5" />
                  <span>{selectedLog.targetId}</span>
                </div>
              </div>
            )}

            {/* Diff Values previous vs after */}
            {(selectedLog.previousValue || selectedLog.newValue) && (
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">Alteração de Estado (Anterior vs Posterior)</span>
                {renderValueDiff(selectedLog)}
              </div>
            )}

            {/* Operational Block/Metadata */}
            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Metadados Adicionais</span>
                <pre className="text-[10px] text-slate-600 dark:text-slate-455 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200/30 dark:border-slate-800/30 overflow-auto font-mono text-left">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
