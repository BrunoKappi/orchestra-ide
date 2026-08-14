import React, { useEffect, useRef } from 'react';
import { useBatchStore } from '../../../../store/useBatchStore';
import {
  Play,
  Pause,
  XCircle,
  Terminal,
  Activity,
  Calendar,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const BatchExecutionPanel: React.FC = () => {
  const {
    activeBatch,
    pauseBatch,
    resumeBatch,
    cancelBatch,
    subTab,
    recipes,
    selectedRecipeId,
    startBatch,
  } = useBatchStore();

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll terminal logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeBatch?.logs.length]);

  if (subTab !== 'monitor' || !activeBatch) {
    return null;
  }

  const recipe = recipes.find((r) => r.id === selectedRecipeId);

  // Compute status colors and icons
  let statusColor = 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
  let StatusIcon = Clock;

  switch (activeBatch.status) {
    case 'running':
      statusColor = 'text-amber-600 bg-amber-500/10 border-amber-500/30 animate-pulse';
      StatusIcon = Activity;
      break;
    case 'paused':
      statusColor = 'text-sky-600 bg-sky-500/10 border-sky-500/30';
      StatusIcon = Pause;
      break;
    case 'completed':
      statusColor = 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30';
      StatusIcon = CheckCircle2;
      break;
    case 'error':
      statusColor = 'text-red-600 bg-red-500/10 border-red-500/30';
      StatusIcon = AlertTriangle;
      break;
    case 'canceled':
      statusColor = 'text-rose-600 bg-rose-500/10 border-rose-500/30';
      StatusIcon = XCircle;
      break;
  }

  // Format execution duration
  const getDurationString = () => {
    if (!activeBatch.startedAt) return '00:00';
    const start = new Date(activeBatch.startedAt).getTime();
    const end = activeBatch.endedAt ? new Date(activeBatch.endedAt).getTime() : Date.now();
    const diffSec = Math.floor((end - start) / 1000);
    const min = String(Math.floor(diffSec / 60)).padStart(2, '0');
    const sec = String(diffSec % 60).padStart(2, '0');
    return `${min}:${sec}`;
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row h-52 shrink-0 select-none overflow-hidden">
      {/* Control / Details section */}
      <div className="w-full md:w-80 p-4 border-r border-slate-100 dark:border-slate-800/80 flex flex-col justify-between shrink-0 space-y-3">
        <div className="space-y-2">
          {/* Batch Number & Status */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-850 dark:text-slate-100 font-mono">
              {activeBatch.batchNumber}
            </span>
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${statusColor}`}>
              <StatusIcon className="w-3 h-3" />
              <span>{activeBatch.status}</span>
            </div>
          </div>

          {/* Recipe Name */}
          <p className="text-[11px] text-slate-500 dark:text-slate-450 truncate">
            Receita: <span className="font-semibold text-slate-755 dark:text-slate-200">{activeBatch.recipeName}</span>
          </p>

          {/* Times */}
          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono mt-1">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-450 shrink-0" />
              <span>{activeBatch.startedAt ? new Date(activeBatch.startedAt).toLocaleTimeString() : '--:--'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-450 shrink-0" />
              <span className="font-bold text-slate-650 dark:text-slate-300">{getDurationString()}</span>
            </div>
          </div>
        </div>

        {/* Buttons Controls */}
        <div className="flex items-center gap-2">
          {activeBatch.status === 'running' && (
            <>
              <button
                onClick={pauseBatch}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pausar</span>
              </button>
              <button
                onClick={cancelBatch}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Abortar</span>
              </button>
            </>
          )}

          {activeBatch.status === 'paused' && (
            <>
              <button
                onClick={resumeBatch}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Retomar</span>
              </button>
              <button
                onClick={cancelBatch}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Abortar</span>
              </button>
            </>
          )}

          {(activeBatch.status === 'completed' || activeBatch.status === 'canceled' || activeBatch.status === 'error') && (
            <button
              onClick={() => recipe && startBatch(recipe.id)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar Lote</span>
            </button>
          )}
        </div>
      </div>

      {/* Terminal log section */}
      <div className="flex-1 bg-slate-950 p-3.5 flex flex-col font-mono text-[10px] text-slate-300 select-text overflow-hidden">
        {/* Terminal Header */}
        <div className="flex items-center gap-1.5 text-slate-500 mb-2 border-b border-slate-900 pb-1.5 shrink-0 select-none">
          <Terminal className="w-3.5 h-3.5 text-emerald-500" />
          <span className="font-bold text-[9px] uppercase tracking-wider text-slate-400">
            Console de Execução Industrial (Logs de Processo)
          </span>
        </div>

        {/* Logs Stream */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1.5 scrollbar-thin">
          {activeBatch.logs.map((log, idx) => {
            // Regex to parse timestamp, tag (optional) and message
            const match = log.match(/^\[(\d{2}:\d{2}:\d{2})\]\s*(?:\[([^\]]+)\])?\s*(.*)$/);
            
            if (match) {
              const [_, timestamp, tag, message] = match;
              
              let tagStyle = 'bg-slate-800 text-slate-400 border-slate-700';
              let textStyle = 'text-slate-300';
              
              if (tag) {
                switch (tag.toUpperCase()) {
                  case 'INÍCIO':
                    tagStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                    textStyle = 'text-slate-200 font-bold';
                    break;
                  case 'SUCESSO':
                    tagStyle = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35 font-bold';
                    textStyle = 'text-emerald-400';
                    break;
                  case 'ERRO':
                    tagStyle = 'bg-red-500/15 text-red-400 border-red-500/35 font-bold';
                    textStyle = 'text-red-400 font-bold';
                    break;
                  case 'OMM':
                    tagStyle = 'bg-blue-500/15 text-blue-400 border-blue-500/35';
                    textStyle = 'text-blue-300';
                    break;
                  case 'INFO':
                    tagStyle = 'bg-slate-800 text-slate-400 border-slate-700';
                    textStyle = 'text-slate-300';
                    break;
                  case 'PROCESSO':
                    tagStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                    textStyle = 'text-amber-300';
                    break;
                }
              }
              
              return (
                <div key={idx} className="flex items-start gap-2 py-0.5 leading-relaxed hover:bg-slate-900/35 rounded px-1 transition-colors">
                  {/* Timestamp */}
                  <span className="text-slate-500 select-none shrink-0 font-mono text-[9px] mt-0.5">
                    {timestamp}
                  </span>
                  
                  {/* Tag badge */}
                  {tag && (
                    <span className={`px-1.5 py-0.25 text-[8px] font-bold tracking-wider uppercase rounded border shrink-0 font-sans ${tagStyle}`}>
                      {tag}
                    </span>
                  )}
                  
                  {/* Message body */}
                  <span className={`break-all font-mono ${textStyle}`}>
                    {message}
                  </span>
                </div>
              );
            }
            
            // Fallback for unexpected formats
            return (
              <div key={idx} className="text-slate-350 leading-relaxed break-all font-mono py-0.5">
                {log}
              </div>
            );
          })}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
};
