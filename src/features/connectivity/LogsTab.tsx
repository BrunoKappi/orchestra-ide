import React, { useState, useMemo } from 'react';
import { Search, X, Terminal } from 'lucide-react';
import { useConnectivityStore } from '../../store/useConnectivityStore';
import type { ConnectivityLogEntry, LogSeverity } from '../../types/connectivity';

export const LogsTab: React.FC = () => {
  const { logs } = useConnectivityStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [selectedLog, setSelectedLog] = useState<ConnectivityLogEntry | null>(null);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (severityFilter !== 'All' && log.severity !== severityFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          log.flowName.toLowerCase().includes(q) ||
          log.source.toLowerCase().includes(q) ||
          log.destination.toLowerCase().includes(q) ||
          log.details.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, severityFilter, searchQuery]);

  const severityBadge = (sev: LogSeverity) => {
    switch (sev) {
      case 'Info':
        return (
          <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-500 font-mono font-bold text-[11px]">
            INFO
          </span>
        );
      case 'Warning':
        return (
          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-mono font-bold text-[11px]">
            WARN
          </span>
        );
      case 'Error':
      case 'Critical':
        return (
          <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-mono font-bold text-[11px]">
            {sev.toUpperCase()}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Table Section */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Filter Bar */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 shrink-0 select-none shadow-2xs">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar por fluxo, origem ou detalhes de log..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100"
            >
              <option value="All">Todas Severidades</option>
              <option value="Info">Info</option>
              <option value="Warning">Warning</option>
              <option value="Error">Error</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <span className="text-xs font-mono text-slate-400">
            {filteredLogs.length} registros de log
          </span>
        </div>

        {/* Compact Table */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
                  <th className="py-3 px-4">Horário</th>
                  <th className="py-3 px-4">Fluxo Executado</th>
                  <th className="py-3 px-4">Severidade</th>
                  <th className="py-3 px-4">Origem ➔ Destino</th>
                  <th className="py-3 px-4">Duração</th>
                  <th className="py-3 px-4">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800 text-xs">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`cursor-pointer transition-colors ${
                      selectedLog?.id === log.id
                        ? 'bg-sky-500/10 dark:bg-sky-500/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">
                      {log.flowName}
                    </td>
                    <td className="py-3 px-4">{severityBadge(log.severity)}</td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {log.source} ➔ {log.destination}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {log.durationMs} ms
                    </td>
                    <td className="py-3 px-4 text-slate-500 truncate max-w-xs">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Side Drawer Details */}
      {selectedLog && (
        <aside className="w-96 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 select-none shadow-xl z-20">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-500" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100">
                Detalhes da Execução
              </h3>
            </div>
            <button
              onClick={() => setSelectedLog(null)}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Fluxo
              </label>
              <div className="font-bold text-sm text-slate-800 dark:text-slate-100">
                {selectedLog.flowName}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Duração
                </label>
                <div className="font-mono text-xs text-slate-700 dark:text-slate-300">
                  {selectedLog.durationMs} ms
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Mensagens
                </label>
                <div className="font-mono text-xs text-slate-700 dark:text-slate-300">
                  {selectedLog.messageCount} msgs
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Detalhes do Registro
              </label>
              <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-lg border border-slate-800 whitespace-pre-wrap">
                {selectedLog.details}
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};
