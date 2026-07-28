import React from 'react';
import { TrendingUp, Server, Clock, CheckCircle2, Layers, Zap } from 'lucide-react';
import { useConnectivityStore } from '../../store/useConnectivityStore';

export const AnalyticsTab: React.FC = () => {
  const { connections, flows } = useConnectivityStore();

  const totalConnections = connections.length;
  const activeConnections = connections.filter((c) => c.status === 'Connected').length;
  const totalFlows = flows.length;
  const activeFlows = flows.filter((f) => f.status === 'Running').length;
  const totalThroughput = connections.reduce((acc, c) => acc + c.msgPerSecond, 0);
  const avgLatency = Math.round(
    connections.reduce((acc, c) => acc + c.simulatedLatencyMs, 0) / (totalConnections || 1)
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 space-y-6 text-xs">
      {/* Header Title */}
      <div>
        <h2 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-sky-500" />
          <span>Pipeline Analytics & Middleware Metrics</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
          Monitoramento consolidado em tempo real de vazão, mensagens e saúde do barramento industrial
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Fluxos Ativos</span>
            <Layers className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-mono">
            {activeFlows} <span className="text-xs font-normal text-slate-400">/ {totalFlows}</span>
          </div>
          <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            98.5% operacional
          </span>
        </div>

        {/* Card 2 */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Conexões Ativas</span>
            <Server className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-mono">
            {activeConnections} <span className="text-xs font-normal text-slate-400">/ {totalConnections}</span>
          </div>
          <span className="text-[10px] text-emerald-500 font-semibold">Sem falhas críticas</span>
        </div>

        {/* Card 3 */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Throughput Total</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-mono">
            {totalThroughput.toLocaleString()} <span className="text-xs font-normal text-slate-400">msg/s</span>
          </div>
          <span className="text-[10px] text-sky-500 font-semibold">+12% vs última hora</span>
        </div>

        {/* Card 4 */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Latência Média</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-mono">
            {avgLatency} <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
          <span className="text-[10px] text-emerald-500 font-semibold">Excelente desempenho</span>
        </div>
      </div>

      {/* Charts & Ranking Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Flows Ranking */}
        <div className="col-span-2 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              Ranking dos Fluxos Mais Utilizados
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Ordenado por volume</span>
          </div>

          <div className="space-y-3">
            {flows.slice(0, 5).map((flow, idx) => (
              <div key={flow.id} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-sky-500/10 text-sky-600 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {flow.name}
                    </span>
                  </div>
                  <span className="font-mono text-slate-500">
                    {flow.executedCount.toLocaleString()} execuções ({flow.avgDurationMs}ms)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-sky-600 h-full rounded-full"
                    style={{ width: `${Math.min(100, (flow.executedCount / 500000) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Middleware Health Card */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
            Disponibilidade Simulada
          </h3>

          <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
            <div className="w-24 h-24 rounded-full border-4 border-emerald-500 flex items-center justify-center font-extrabold text-2xl text-emerald-500 font-mono shadow-md">
              99.98%
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">
              SLA do Barramento Industrial
            </span>
            <p className="text-[11px] text-slate-400">
              Operando dentro dos parâmetros ideais de alta disponibilidade e tolerância a falhas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
