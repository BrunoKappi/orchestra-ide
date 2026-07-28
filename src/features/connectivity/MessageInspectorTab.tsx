import React, { useState } from 'react';
import { Code, FileText, GitCompare, Layers, Copy, Check } from 'lucide-react';
import { useConnectivityStore } from '../../store/useConnectivityStore';

export const MessageInspectorTab: React.FC = () => {
  const { messageTraces, selectedTraceId, setSelectedTraceId } = useConnectivityStore();

  const [activeViewMode, setActiveViewMode] = useState<'json' | 'tree' | 'diff' | 'text'>('json');
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  const activeTrace = messageTraces.find((t) => t.id === selectedTraceId) || messageTraces[0];
  const activeStep = activeTrace?.steps[selectedStepIndex] || activeTrace?.steps[0];

  const handleCopyPayload = (payload: any) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-xs">
      {/* Left Sidebar: Execution Trace History */}
      <aside className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs mb-1">
            Rastros de Mensagens Simuladas
          </h3>
          <p className="text-[11px] text-slate-400">
            Selecione uma execução para inspecionar os payloads
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {messageTraces.map((trace) => (
            <button
              key={trace.id}
              onClick={() => {
                setSelectedTraceId(trace.id);
                setSelectedStepIndex(0);
              }}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                activeTrace?.id === trace.id
                  ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 shadow-sm'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                  {trace.flowName}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                  {trace.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>{new Date(trace.timestamp).toLocaleTimeString()}</span>
                <span>{trace.totalDurationMs} ms</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-1">
                Gatilho: {trace.trigger}
              </p>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Inspector Details Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
        {activeTrace ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Trace Timeline Steps Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    Inspeção do Pipeline: {activeTrace.flowName}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    ID do Rastro: <span className="font-mono text-sky-500">{activeTrace.id}</span> | Tempo Total: {activeTrace.totalDurationMs}ms
                  </p>
                </div>

                {/* View Mode Toggle Buttons */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveViewMode('json')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded font-semibold transition-colors ${
                      activeViewMode === 'json' ? 'bg-sky-600 text-white' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </button>

                  <button
                    onClick={() => setActiveViewMode('tree')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded font-semibold transition-colors ${
                      activeViewMode === 'tree' ? 'bg-sky-600 text-white' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Árvore</span>
                  </button>

                  <button
                    onClick={() => setActiveViewMode('diff')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded font-semibold transition-colors ${
                      activeViewMode === 'diff' ? 'bg-sky-600 text-white' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    <span>Diff</span>
                  </button>

                  <button
                    onClick={() => setActiveViewMode('text')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded font-semibold transition-colors ${
                      activeViewMode === 'text' ? 'bg-sky-600 text-white' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Texto</span>
                  </button>
                </div>
              </div>

              {/* Timeline Steps Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {activeTrace.steps.map((step, idx) => (
                  <button
                    key={step.stepId}
                    onClick={() => setSelectedStepIndex(idx)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all ${
                      selectedStepIndex === idx
                        ? 'bg-sky-600 text-white border-sky-600 shadow-md font-semibold'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-400'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate max-w-[120px] text-xs">{step.nodeName}</span>
                      <span className="text-[9px] opacity-80 font-mono">{step.durationMs} ms</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step Details & Payload Viewers */}
            {activeStep ? (
              <div className="flex-1 flex overflow-hidden">
                {/* Step Payload In */}
                <div className="flex-1 border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
                  <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Payload de Entrada (Entrada no Bloco)
                    </span>
                    <button
                      onClick={() => handleCopyPayload(activeStep.payloadIn)}
                      className="flex items-center gap-1 text-[11px] text-sky-500 font-semibold hover:underline"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copiar JSON</span>
                    </button>
                  </div>

                  <div className="flex-1 overflow-auto p-4 font-mono text-xs bg-slate-950 text-slate-100">
                    <pre className="leading-relaxed text-emerald-400">
                      {JSON.stringify(activeStep.payloadIn, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Step Payload Out */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Payload Resultante (Saída do Bloco)
                    </span>
                    <button
                      onClick={() => handleCopyPayload(activeStep.payloadOut)}
                      className="flex items-center gap-1 text-[11px] text-sky-500 font-semibold hover:underline"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copiar JSON</span>
                    </button>
                  </div>

                  <div className="flex-1 overflow-auto p-4 font-mono text-xs bg-slate-950 text-slate-100">
                    <pre className="leading-relaxed text-sky-400">
                      {JSON.stringify(activeStep.payloadOut, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            Nenhum rastro simulado selecionado.
          </div>
        )}
      </main>
    </div>
  );
};
