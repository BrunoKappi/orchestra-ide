import React from 'react';
import { BarChart3, AlertTriangle, CheckCircle, X } from 'lucide-react';
import type { FlowNodeV2, FlowEdgeV2 } from '../../../types/flowV2';
import { cn } from '../../../utils/cn';

interface FlowV2InspectorPanelProps {
  nodes: FlowNodeV2[];
  edges: FlowEdgeV2[];
  isOpen: boolean;
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
}

export const FlowV2InspectorPanel: React.FC<FlowV2InspectorPanelProps> = ({
  nodes,
  edges,
  isOpen,
  onClose,
  onSelectNode,
}) => {
  if (!isOpen) return null;

  // Calculate topology stats
  const totalNodes = nodes.length;
  const totalEdges = edges.length;

  // Find orphan nodes (nodes with zero connections)
  const connectedNodeIds = new Set<string>();
  edges.forEach((e) => {
    connectedNodeIds.add(e.source);
    connectedNodeIds.add(e.target);
  });

  const orphanNodes = nodes.filter((n) => !connectedNodeIds.has(n.id) && n.data.nodeType !== 'container' && n.data.nodeType !== 'sticky_note');

  // Simple complexity calculation (Cyclomatic complexity = E - V + 2P)
  const complexityIndex = Math.max(1, totalEdges - totalNodes + 2);

  return (
    <div className="absolute bottom-4 left-76 right-84 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-30 select-none animate-in slide-in-from-bottom-2 duration-150">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
            Painel de Inspeção & Métricas do Fluxo
          </h3>
        </div>

        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 text-xs">
        {/* Stat Card 1: Nodes & Edges */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Topologia</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-extrabold text-sky-600 dark:text-sky-400">{totalNodes}</span>
            <span className="text-[10px] text-slate-500">nós</span>
            <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{totalEdges}</span>
            <span className="text-[10px] text-slate-500">conexões</span>
          </div>
        </div>

        {/* Stat Card 2: Complexity */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Complexidade</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{complexityIndex}</span>
            <span className="text-[10px] text-slate-500">índice ciclomático</span>
          </div>
        </div>

        {/* Stat Card 3: Orphan Nodes */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Blocos Desconectados</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={cn('text-lg font-extrabold', orphanNodes.length > 0 ? 'text-amber-500' : 'text-emerald-500')}>
              {orphanNodes.length}
            </span>
            <span className="text-[10px] text-slate-500">órfãos</span>
          </div>
        </div>

        {/* Stat Card 4: Status */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Integridade do Fluxo</span>
          <div className="mt-1 flex items-center gap-1.5 font-bold">
            {orphanNodes.length === 0 ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Fluxo Válido</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-amber-600 dark:text-amber-400">Atenção com Blocos Órfãos</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Orphan Nodes List if any */}
      {orphanNodes.length > 0 && (
        <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-bold text-amber-500 shrink-0">Clique para selecionar:</span>
          {orphanNodes.map((node) => (
            <button
              key={node.id}
              onClick={() => onSelectNode(node.id)}
              className="px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-mono border border-amber-500/30 shrink-0 transition-colors"
            >
              {node.data.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
