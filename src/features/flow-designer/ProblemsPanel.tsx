import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { useFlowStore } from '../../store/useFlowStore';
import { cn } from '../../utils/cn';

export const ProblemsPanel: React.FC = () => {
  const { problems, isProblemsPanelOpen, toggleProblemsPanel, setSelectedNodeId, selectedNodeId } =
    useFlowStore();

  const errorCount = problems.filter((p) => p.type === 'error').length;
  const warningCount = problems.filter((p) => p.type === 'warning').length;

  return (
    <div className="border-t border-slate-800 bg-slate-900 select-none z-20 shrink-0">
      {/* Panel Header Toggle Bar */}
      <div
        onClick={toggleProblemsPanel}
        className="h-8 px-4 flex items-center justify-between bg-slate-950/80 hover:bg-slate-800/80 cursor-pointer transition-colors text-xs border-b border-slate-800/50"
      >
        <div className="flex items-center gap-3 font-semibold">
          <div className="flex items-center gap-1 text-slate-300">
            <span>Problemas & Validação</span>
          </div>

          <div className="flex items-center gap-2">
            {errorCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 font-bold text-[10px]">
                <ShieldAlert className="w-3 h-3 text-rose-400" />
                <span>{errorCount} Erro{errorCount > 1 ? 's' : ''}</span>
              </span>
            )}

            {warningCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-bold text-[10px]">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span>{warningCount} Aviso{warningCount > 1 ? 's' : ''}</span>
              </span>
            )}

            {problems.length === 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <span>Nenhum Problema</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          {isProblemsPanelOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Expanded List Body */}
      {isProblemsPanelOpen && (
        <div className="h-44 overflow-y-auto p-2 space-y-1 bg-slate-950/90 text-xs">
          {problems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <CheckCircle className="w-6 h-6 text-emerald-400 mb-1" />
              <p className="font-semibold text-slate-300">Validação Concluída com Sucesso!</p>
              <p className="text-[11px]">O fluxograma não possui erros estruturais ou de propriedades.</p>
            </div>
          ) : (
            problems.map((prob) => {
              const isSelected = selectedNodeId === prob.nodeId;
              const isError = prob.type === 'error';

              return (
                <div
                  key={prob.id}
                  onClick={() => setSelectedNodeId(prob.nodeId)}
                  className={cn(
                    'flex items-start gap-2.5 p-2 rounded-lg border transition-all cursor-pointer hover:bg-slate-900',
                    isSelected
                      ? 'border-sky-500 bg-sky-950/30'
                      : isError
                      ? 'border-rose-900/40 bg-rose-950/10'
                      : 'border-amber-900/40 bg-amber-950/10'
                  )}
                >
                  <div className="mt-0.5 shrink-0">
                    {isError ? (
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          'font-bold text-xs truncate',
                          isError ? 'text-rose-300' : 'text-amber-300'
                        )}
                      >
                        {prob.message}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0">
                        Nó: {prob.nodeName} ({prob.nodeId})
                      </span>
                    </div>

                    {prob.detail && (
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{prob.detail}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
