import React, { useState } from 'react';
import {
  Code,
  Edit2,
  Trash2,
  Copy,
  Plus,
  Layers,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { useObjectModelStore } from '../../store/useObjectModelStore';
import { cn } from '../../utils/cn';

export const ScriptsEditor: React.FC = () => {
  const {
    mergedScripts,
    openAddScriptModal,
    openEditScriptModal,
    deleteScript,
    duplicateScript,
  } = useObjectModelStore();

  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(
    mergedScripts.length > 0 ? mergedScripts[0].id : null
  );

  const [search, setSearch] = useState('');

  const filteredScripts = mergedScripts.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.trigger.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase())
  );

  const activeScript =
    mergedScripts.find((s) => s.id === selectedScriptId) ||
    (filteredScripts.length > 0 ? filteredScripts[0] : null);

  const getTriggerColor = (trigger: string) => {
    switch (trigger) {
      case 'Initialize':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60';
      case 'Execute':
        return 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200/60';
      case 'Shutdown':
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/60';
      case 'Value Changed':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/60';
      case 'On True':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60';
      case 'On False':
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/60';
      case 'While True':
        return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/60';
      case 'Manual':
        return 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200/60';
      case 'Custom':
        return 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200/60';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200';
    }
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden p-6 gap-6">
      {/* Left List of Scripts */}
      <div className="w-80 flex flex-col h-full border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden shrink-0 shadow-xs">
        {/* Header bar */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scripts..."
              className="w-full pl-8 pr-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs outline-none focus:border-sky-500"
            />
          </div>
          <button
            onClick={openAddScriptModal}
            className="flex items-center gap-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-xs font-semibold shrink-0 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Script Items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredScripts.length > 0 ? (
            filteredScripts.map((script) => {
              const isSelected = activeScript?.id === script.id;
              return (
                <div
                  key={script.id}
                  onClick={() => setSelectedScriptId(script.id)}
                  className={cn(
                    'group p-2.5 rounded-lg border text-xs cursor-pointer transition-all duration-150',
                    isSelected
                      ? 'bg-sky-500/10 border-sky-500/40 text-slate-900 dark:text-slate-100 font-medium'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <Code className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <span className="truncate font-semibold">{script.name}</span>
                    </div>

                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded text-[10px] font-mono border shrink-0',
                        getTriggerColor(script.trigger)
                      )}
                    >
                      {script.trigger}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    {script.isInherited ? (
                      <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-normal">
                        <Layers className="w-3 h-3" />
                        <span>Inherited</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-normal">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Local</span>
                      </span>
                    )}

                    {/* Hover Actions */}
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditScriptModal(script);
                        }}
                        className="p-0.5 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateScript(script);
                        }}
                        className="p-0.5 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      {!script.isInherited && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteScript(script.id);
                          }}
                          className="p-0.5 hover:text-rose-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-xs text-slate-400">
              No scripts defined.
            </div>
          )}
        </div>
      </div>

      {/* Right Code Viewer / Editor Area */}
      <div className="flex-1 flex flex-col h-full border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        {activeScript ? (
          <>
            {/* Header detail */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {activeScript.name}
                  </h4>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-mono border',
                      getTriggerColor(activeScript.trigger)
                    )}
                  >
                    Trigger: {activeScript.trigger}
                  </span>
                </div>
                {activeScript.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {activeScript.description}
                  </p>
                )}
                {activeScript.triggerExpression && (
                  <p className="text-[11px] text-slate-400 font-mono mt-1">
                    <span className="text-slate-500 font-sans">Expression: </span>{activeScript.triggerExpression}
                  </p>
                )}
                {activeScript.loopTimeMs !== null && activeScript.loopTimeMs !== undefined && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    <span className="text-slate-500">Loop: </span>{activeScript.loopTimeMs}ms
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditScriptModal(activeScript)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Script</span>
                </button>
              </div>
            </div>

            {/* Script Textarea Display */}
            <div className="flex-1 p-4 bg-slate-950 flex flex-col font-mono text-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-500 text-[11px]">
                <span>Orquestra Script Editor (JavaScript / Pseudo-code)</span>
                <span>Stored only (Execution disabled in MVP)</span>
              </div>
              <textarea
                value={activeScript.code}
                readOnly
                className="flex-1 w-full bg-transparent text-emerald-400 outline-none resize-none leading-relaxed"
                placeholder="// Write script logic here..."
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-xs p-6 text-center">
            Select a script from the sidebar or click "New" to create one.
          </div>
        )}
      </div>
    </div>
  );
};
