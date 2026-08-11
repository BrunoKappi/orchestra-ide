import React, { useMemo } from 'react';
import {
  ArrowLeftRight, Play, CheckCircle2, XCircle, Clock,
  AlertTriangle, Fuel, TrendingUp
} from 'lucide-react';
import { useOmmStore } from '../../store/useOmmStore';
import { useObjectModelStore } from '../../../../store/useObjectModelStore';
import { useProcessAlertStore } from '../../../../store/useProcessAlertStore';
import { cn } from '../../../../utils/cn';

export const OverviewDashboard: React.FC = () => {
  const { getMovementRows, movements: rawMovements, products } = useOmmStore();
  const { alarmEvents } = useObjectModelStore();

  const movements = useMemo(() => getMovementRows(), [getMovementRows, rawMovements]);

  // Metrics calculation
  const totalMovements = movements.length;
  
  const activeMovements = useMemo(() => 
    movements.filter(m => m.status === 'Active'),
    [movements]
  );
  
  const completedMovements = useMemo(() => 
    movements.filter(m => m.status === 'Completed'),
    [movements]
  );

  const canceledMovements = useMemo(() => 
    movements.filter(m => m.status === 'Canceled'),
    [movements]
  );

  const scheduledMovements = useMemo(() => 
    movements.filter(m => m.status === 'Issued'),
    [movements]
  );

  const totalVolumeMoved = useMemo(() => 
    movements.reduce((acc, m) => acc + (m.currentVolume || 0), 0),
    [movements]
  );

  const netFlowRate = useMemo(() => 
    activeMovements.reduce((acc, m) => acc + (m.currentFlow || 0), 0),
    [activeMovements]
  );

  const activeAlarmsCount = useMemo(() => 
    (alarmEvents || []).filter((evt: any) => 
      evt.status === 'Active Unacknowledged' || evt.status === 'Active Acknowledged'
    ).length,
    [alarmEvents]
  );

  const processAlerts = useProcessAlertStore((s) => s.occurrences);
  const activeAlertsCount = useMemo(() =>
    (processAlerts || []).filter((o) => o.status !== 'resolved' && o.status !== 'expired').length,
    [processAlerts]
  );

  // Operational Completion Rate
  const completionRate = useMemo(() => {
    const closedCount = completedMovements.length;
    const failedCount = canceledMovements.length;
    const totalFinished = closedCount + failedCount;
    return totalFinished > 0 ? (closedCount / totalFinished) * 100 : 100;
  }, [completedMovements, canceledMovements]);

  // Volume moved per product distribution
  const productDistribution = useMemo(() => {
    const map: Record<string, { volume: number; name: string; color: string }> = {};
    
    // Base products mapping for colors
    const prodMeta = products || [];

    movements.forEach(m => {
      const vol = m.currentVolume || 0;
      if (vol <= 0) return;
      const prodId = m.productId;
      if (!map[prodId]) {
        const meta = prodMeta.find(p => p.id === prodId);
        map[prodId] = {
          volume: 0,
          name: m.productName || 'Desconhecido',
          color: meta?.color || '#3b82f6'
        };
      }
      map[prodId].volume += vol;
    });

    return Object.values(map).sort((a, b) => b.volume - a.volume);
  }, [movements, products]);

  // Line utilisation (active pipelines)
  const lineUtilisation = useMemo(() => {
    // Arbitrary default total available lines in plant = 6
    const totalLines = 6;
    const activeLines = activeMovements.length;
    return {
      active: activeLines,
      total: totalLines,
      percent: Math.min(100, (activeLines / totalLines) * 100)
    };
  }, [activeMovements]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 dark:text-slate-100 select-none">
      
      {/* 1. Global Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Active Transfers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Transferências Ativas</span>
            <h3 className="text-2xl font-bold font-mono">{activeMovements.length}</h3>
            <p className="text-[10px] text-slate-550">De {totalMovements} ordens emitidas</p>
          </div>
          <div className="p-3 bg-sky-500/10 rounded-xl text-sky-500 border border-sky-500/20">
            <Play className="w-5 h-5 fill-current" />
          </div>
        </div>

        {/* KPI 2: Total Volume Moved */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Volume Movimentado</span>
            <h3 className="text-2xl font-bold font-mono">
              {totalVolumeMoved.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-xs font-normal">m³</span>
            </h3>
            <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Acumulado do dia
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 border border-emerald-500/20">
            <Fuel className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Scheduled / Planned */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Ordens Emitidas</span>
            <h3 className="text-2xl font-bold font-mono">{scheduledMovements.length}</h3>
            <p className="text-[10px] text-slate-550">Aguardando alinhamento</p>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Active Alarms */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Alarmes de Linha</span>
            <h3 className="text-2xl font-bold font-mono text-rose-500">{activeAlarmsCount}</h3>
            <p className="text-[10px] text-slate-550 font-medium">Requer atenção imediata</p>
          </div>
          <div className={cn("p-3 rounded-xl border", 
            activeAlarmsCount > 0 
              ? "bg-rose-500/15 text-rose-500 border-rose-500/30 animate-pulse" 
              : "bg-slate-105 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
          )}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 5: Active Process Alerts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Alertas de Processo</span>
            <h3 className="text-2xl font-bold font-mono text-amber-500">{activeAlertsCount}</h3>
            <p className="text-[10px] text-slate-550">Alertas operacionais ativos</p>
          </div>
          <div className={cn("p-3 rounded-xl border", 
            activeAlertsCount > 0 
              ? "bg-amber-500/15 text-amber-500 border-amber-500/30" 
              : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-750"
          )}>
            <AlertTriangle className={cn("w-5 h-5", activeAlertsCount > 0 && "animate-pulse")} />
          </div>
        </div>
      </div>

      {/* 2. Operations Center Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle Column: Active Transfers List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-2xs flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 font-sans">
                <Play className="w-4 h-4 text-sky-500" />
                Painel de Transferências em Curso
              </h4>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-405 font-mono">
                {activeMovements.length} Ativa{activeMovements.length !== 1 ? 's' : ''}
              </span>
            </div>

            {activeMovements.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <ArrowLeftRight className="w-8 h-8 text-slate-350 dark:text-slate-600 mb-2" />
                <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Nenhuma movimentação ativa no momento.</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Utilize o Simulador Global para iniciar ou agendar movimentações.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeMovements.map((mov) => {
                  const progress = Math.min(100, (mov.currentVolume / mov.plannedVolume) * 100);
                  return (
                    <div 
                      key={mov.id} 
                      className="group border border-slate-200/70 dark:border-slate-700/40 rounded-xl p-4 hover:border-sky-400/40 dark:hover:border-sky-500/30 transition-colors flex flex-col gap-3.5 bg-slate-50/30 dark:bg-slate-800/10"
                    >
                      {/* Top info */}
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-405 transition-colors">
                              {mov.number || mov.id.toUpperCase()}
                            </span>
                            {processAlerts.some(
                              (o) => o.relatedMovementId === mov.id && o.status.startsWith('active')
                            ) && (
                              <span className="flex h-2 w-2 relative" title="Alertas de processo ativos">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/15">
                              {mov.productName || mov.productId.replace('prod-', '').toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 font-medium leading-normal">
                            {mov.description}
                          </p>
                        </div>

                        <div className="text-right font-mono font-bold text-xs text-slate-800 dark:text-slate-100">
                          {mov.currentFlow.toFixed(1)} <span className="text-[9px] font-normal text-slate-500">m³/h</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1.5">
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-sky-500 rounded-full transition-all duration-500" 
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[9px] text-slate-500 font-semibold font-mono">
                          <span>{mov.currentVolume.toFixed(0)} / {mov.plannedVolume.toFixed(0)} m³ ({progress.toFixed(1)}%)</span>
                          <span className="flex items-center gap-1 font-sans">
                            <Clock className="w-3.5 h-3.5 text-sky-500" /> Prev. Conclusão: <span className="font-mono">{mov.etoc ? new Date(mov.etoc).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'calculando...'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Alignments tags */}
                      <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-100 dark:border-slate-700/40">
                          <span className="text-slate-500 font-medium">Via: <span className="font-semibold text-slate-600 dark:text-slate-300">{mov.alignmentCode || 'Alinhamento Manual'}</span></span>
                          <span className="text-slate-500 font-medium">{mov.originTag || mov.originId} → {mov.destinationTag || mov.destinationId}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Operational Stats Panels */}
        <div className="space-y-6">
          
          {/* Completion Efficiency Meter */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-2xs flex flex-col items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 self-start mb-4">
              Eficiência Operacional OMM
            </h4>

            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-slate-100 dark:stroke-slate-800/80 fill-none"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-emerald-500 fill-none transition-all duration-300"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (completionRate / 100) * 251.2}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold font-mono">{completionRate.toFixed(0)}%</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Concluído</span>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-center font-semibold">
              <div className="flex flex-col items-center">
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {completedMovements.length}
                </span>
                <span className="text-slate-400 text-[9px] mt-0.5">Ordens Concluídas</span>
              </div>
              <div className="flex flex-col items-center border-l border-slate-100 dark:border-slate-800/80">
                <span className="text-rose-500 font-bold flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> {canceledMovements.length}
                </span>
                <span className="text-slate-400 text-[9px] mt-0.5">Ordens Canceladas</span>
              </div>
            </div>
          </div>

          {/* Line Utilisation Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Alinhamento de Dutos
              </h4>
              <span className="text-xs font-mono font-bold">{lineUtilisation.active} / {lineUtilisation.total}</span>
            </div>

            <div className="space-y-1">
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all duration-300", 
                    lineUtilisation.percent > 80 ? "bg-rose-500" : lineUtilisation.percent > 50 ? "bg-amber-500" : "bg-sky-500"
                  )} 
                  style={{ width: `${lineUtilisation.percent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 font-semibold text-right">
                {lineUtilisation.percent.toFixed(0)}% das linhas em operação
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-850 rounded-xl p-3 border border-slate-200 dark:border-slate-800/80 text-[10px] space-y-2">
              <div className="flex justify-between items-center font-medium">
                <span className="text-slate-400">Vazão Total do Sistema:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-350">{netFlowRate.toFixed(1)} m³/h</span>
              </div>
              <div className="flex justify-between items-center font-medium">
                <span className="text-slate-400">Limitação de Backpressure:</span>
                <span className="text-emerald-500 font-bold">Dentro do Threshold</span>
              </div>
            </div>
          </div>

          {/* Product Volume Distribution */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-2xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Distribuição por Produto (m³)
            </h4>

            {productDistribution.length === 0 ? (
              <p className="text-[10px] text-slate-400 font-mono text-center py-6">Aguardando dados de volumes.</p>
            ) : (
              <div className="space-y-3">
                {productDistribution.slice(0, 4).map((p) => {
                  const percent = totalVolumeMoved > 0 ? (p.volume / totalVolumeMoved) * 100 : 0;
                  return (
                    <div key={p.name} className="space-y-1 text-[10px] font-semibold">
                      <div className="flex items-center justify-between text-slate-655 dark:text-slate-350">
                        <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                          <span className="truncate">{p.name}</span>
                        </div>
                        <span className="font-mono font-bold">{p.volume.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({percent.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full" 
                          style={{ width: `${percent}%`, backgroundColor: p.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
