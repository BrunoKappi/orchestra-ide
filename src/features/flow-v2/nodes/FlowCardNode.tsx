import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  Play,
  CheckCircle2,
  HelpCircle,
  Cpu,
  Database,
  Code,
  Clock,
  Bell,
  Activity,
  Layers,
  ArrowRight,
  Send,
  Workflow,
  Radio,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import type { FlowNodeV2Data } from '../../../types/flowV2';
import { cn } from '../../../utils/cn';

const getNodeIcon = (nodeType: string, industrialType?: string) => {
  if (industrialType === 'read_property') return Database;
  if (industrialType === 'write_property') return Send;
  if (industrialType === 'compare_variable') return HelpCircle;
  if (industrialType === 'execute_script') return Code;
  if (industrialType === 'call_flowchart') return Workflow;
  if (industrialType === 'delay' || industrialType === 'timer') return Clock;
  if (industrialType === 'wait_alarm' || industrialType === 'ack_alarm') return Bell;
  if (industrialType === 'query_history') return Activity;
  if (industrialType === 'raise_event') return Zap;
  if (industrialType === 'update_widget' || industrialType === 'update_faceplate') return Layers;

  if (nodeType === 'start') return Play;
  if (nodeType === 'end') return CheckCircle2;
  if (nodeType === 'gateway_exclusive') return HelpCircle;
  if (nodeType === 'gateway_parallel') return ArrowRight;

  return Cpu;
};

const getNodeColorStyle = (nodeType: string, industrialType?: string) => {
  if (industrialType === 'read_property') return 'from-sky-500/10 to-sky-500/5 border-sky-500/40 text-sky-500';
  if (industrialType === 'write_property') return 'from-amber-500/10 to-amber-500/5 border-amber-500/40 text-amber-500';
  if (industrialType === 'compare_variable') return 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/40 text-emerald-500';
  if (industrialType === 'execute_script') return 'from-purple-500/10 to-purple-500/5 border-purple-500/40 text-purple-500';
  if (industrialType === 'call_flowchart') return 'from-indigo-500/10 to-indigo-500/5 border-indigo-500/40 text-indigo-500';
  if (industrialType === 'delay' || industrialType === 'timer') return 'from-cyan-500/10 to-cyan-500/5 border-cyan-500/40 text-cyan-500';
  if (industrialType === 'wait_alarm' || industrialType === 'ack_alarm') return 'from-rose-500/10 to-rose-500/5 border-rose-500/40 text-rose-500';
  if (industrialType === 'query_history') return 'from-violet-500/10 to-violet-500/5 border-violet-500/40 text-violet-500';
  if (industrialType === 'raise_event') return 'from-orange-500/10 to-orange-500/5 border-orange-500/40 text-orange-500';

  if (nodeType === 'start') return 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/40 text-emerald-500';
  if (nodeType === 'end') return 'from-rose-500/10 to-rose-500/5 border-rose-500/40 text-rose-500';
  if (nodeType === 'gateway_exclusive') return 'from-amber-500/10 to-amber-500/5 border-amber-500/40 text-amber-500';

  return 'from-slate-500/10 to-slate-500/5 border-slate-300 dark:border-slate-700 text-sky-500';
};

// Check if node is missing essential required parameters
const getNodeValidationWarning = (nodeData: FlowNodeV2Data): string | null => {
  const meta = nodeData.metadata || {};
  const indType = nodeData.industrialType;

  if (indType === 'read_property' || indType === 'write_property') {
    if (!meta.targetPropertyName && !meta.targetPropertyId) return 'Selecione uma propriedade alvo';
  }
  if (indType === 'execute_script') {
    if (!meta.scriptId && !meta.scriptCode) return 'Selecione ou insira um script para execução';
  }
  if (indType === 'call_flowchart') {
    if (!meta.targetFlowchartId) return 'Selecione o sub-fluxograma de destino';
  }
  if (indType === 'raise_event') {
    if (!meta.raiseEventName && !meta.eventId) return 'Defina o nome/ID do evento';
  }
  return null;
};

export const FlowCardNode = memo(({ data, selected }: NodeProps<any>) => {
  const nodeData = data as FlowNodeV2Data;
  const Icon = getNodeIcon(nodeData.nodeType, nodeData.industrialType);
  const colorStyle = getNodeColorStyle(nodeData.nodeType, nodeData.industrialType);
  const validationWarning = getNodeValidationWarning(nodeData);

  const inputs = nodeData.inputs || [];
  const outputs = nodeData.outputs || [];

  return (
    <div
      className={cn(
        'group relative min-w-[220px] max-w-[310px] rounded-2xl border bg-white/95 dark:bg-slate-900/95 p-3.5 backdrop-blur-md shadow-md hover:shadow-xl transition-all duration-200 select-none',
        selected ? 'ring-2 ring-sky-500 border-sky-500 shadow-sky-500/20' : 'border-slate-200/90 dark:border-slate-800/90',
        nodeData.simState === 'executing' && 'ring-2 ring-sky-400 animate-pulse border-sky-400',
        nodeData.simState === 'success' && 'ring-2 ring-emerald-500 border-emerald-500',
        nodeData.simState === 'error' && 'ring-2 ring-rose-500 border-rose-500'
      )}
      style={{
        borderColor: nodeData.borderColor || undefined,
        backgroundColor: nodeData.backgroundColor || undefined,
      }}
    >
      {/* Top Banner Gradient & Icon */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn('w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 border shadow-2xs', colorStyle)}>
            <Icon className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <h4
              className="text-xs font-bold truncate text-slate-900 dark:text-slate-100 tracking-tight"
              style={{ color: nodeData.textColor || undefined }}
            >
              {nodeData.label}
            </h4>
            <span className="text-[10px] text-slate-400 font-medium tracking-tight block truncate">
              {nodeData.category || 'Geral'}
            </span>
          </div>
        </div>

        {/* Validation Warning Badge or Status Badge */}
        {validationWarning ? (
          <span
            title={validationWarning}
            className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0 flex items-center gap-1 animate-pulse"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Pendente</span>
          </span>
        ) : (
          nodeData.simState && nodeData.simState !== 'idle' && (
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1',
                nodeData.simState === 'executing' && 'bg-sky-500/20 text-sky-600 dark:text-sky-400 animate-pulse',
                nodeData.simState === 'success' && 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
                nodeData.simState === 'error' && 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
              )}
            >
              {nodeData.simState === 'executing' && <Radio className="w-2.5 h-2.5 animate-spin" />}
              {nodeData.simState}
            </span>
          )
        )}
      </div>

      {/* Description / Property Target info */}
      {nodeData.description && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
          {nodeData.description}
        </p>
      )}

      {/* Industrial target metadata highlight */}
      {nodeData.metadata?.targetPropertyName && (
        <div className="mt-2 p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-[10px] font-mono text-sky-600 dark:text-sky-400 flex items-center gap-1 truncate border border-sky-200/60 dark:border-sky-800/60">
          <Database className="w-3 h-3 shrink-0 text-sky-500" />
          <span className="truncate">{nodeData.metadata.targetPropertyName}</span>
        </div>
      )}

      {/* Live Simulation payload bubble */}
      {nodeData.simValue !== undefined && (
        <div className="mt-2 p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-600 dark:text-emerald-300 flex items-center justify-between shadow-2xs">
          <span className="font-bold">Valor Simulado:</span>
          <span className="truncate max-w-[110px]">{String(nodeData.simValue)}</span>
        </div>
      )}

      {/* Input Handles */}
      {inputs.map((inp, idx) => {
        const topPos = inputs.length === 1 ? '50%' : `${((idx + 1) * 100) / (inputs.length + 1)}%`;
        return (
          <div key={inp.id} className="group/handle">
            <Handle
              type="target"
              position={Position.Left}
              id={inp.id}
              style={{
                top: topPos,
                background: inp.color || '#0ea5e9',
                width: 10,
                height: 10,
                borderRadius: '50%',
                border: '2px solid white',
              }}
            />
            <span
              className="absolute left-3 text-[9px] font-semibold text-slate-400 dark:text-slate-500 pointer-events-none -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ top: topPos }}
            >
              {inp.name}
            </span>
          </div>
        );
      })}

      {/* Output Handles */}
      {outputs.map((out, idx) => {
        const topPos = outputs.length === 1 ? '50%' : `${((idx + 1) * 100) / (outputs.length + 1)}%`;
        return (
          <div key={out.id} className="group/handle">
            <Handle
              type="source"
              position={Position.Right}
              id={out.id}
              style={{
                top: topPos,
                background: out.color || '#10b981',
                width: 10,
                height: 10,
                borderRadius: '50%',
                border: '2px solid white',
              }}
            />
            <span
              className="absolute right-3 text-[9px] font-semibold text-slate-400 dark:text-slate-500 pointer-events-none -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-right"
              style={{ top: topPos }}
            >
              {out.name}
            </span>
          </div>
        );
      })}
    </div>
  );
});

FlowCardNode.displayName = 'FlowCardNode';
