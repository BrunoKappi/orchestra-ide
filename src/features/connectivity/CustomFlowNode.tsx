import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Clock,
  Radio,
  MessageSquare,
  Database,
  FileText,
  Zap,
  Filter,
  ArrowLeftRight,
  Code,
  Sliders,
  Cpu,
  Bell,
  Activity,
  Layers,
  Globe,
  Mail,
  Lock,
  Terminal,
} from 'lucide-react';
import type { ConnectivityFlowNodeData } from '../../types/connectivity';

const nodeIcons: Record<string, any> = {
  Radio: Radio,
  Clock: Clock,
  MessageSquare: MessageSquare,
  Database: Database,
  FileText: FileText,
  Zap: Zap,
  Filter: Filter,
  ArrowLeftRight: ArrowLeftRight,
  Code: Code,
  Sliders: Sliders,
  Cpu: Cpu,
  Bell: Bell,
  Activity: Activity,
  Layers: Layers,
  Globe: Globe,
  Mail: Mail,
  Lock: Lock,
  Terminal: Terminal,
};

export const CustomFlowNode: React.FC<any> = memo(({ data, selected }) => {
  const nodeData = data as ConnectivityFlowNodeData;
  const IconComponent = nodeIcons[nodeData?.iconName] || Cpu;

  return (
    <div
      className={`min-w-[200px] rounded-xl bg-white dark:bg-slate-900 border-2 shadow-md transition-all select-none overflow-hidden ${
        selected ? 'border-sky-500 ring-2 ring-sky-500/30 shadow-sky-500/10' : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Input Handles */}
      {nodeData?.inputsCount > 0 && (
        <>
          <Handle
            type="target"
            position={Position.Left}
            id="in_left"
            className="w-3 h-3 bg-sky-500 border-2 border-white dark:border-slate-900 rounded-full"
          />
          <Handle
            type="target"
            position={Position.Top}
            id="in_top"
            className="w-3 h-3 bg-sky-500 border-2 border-white dark:border-slate-900 rounded-full"
          />
        </>
      )}

      {/* Header bar */}
      <div
        className="px-3 py-1.5 flex items-center justify-between text-white font-bold text-xs"
        style={{ backgroundColor: nodeData?.color || '#0284c7' }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <IconComponent className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{nodeData?.blockType}</span>
        </div>
        <span className="text-[9px] bg-black/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
          {nodeData?.category}
        </span>
      </div>

      {/* Body */}
      <div className="p-2.5 space-y-1">
        <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-xs truncate">
          {nodeData?.label}
        </h4>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {nodeData?.description}
        </p>

        {/* Selected Config Preview */}
        {nodeData?.properties && Object.keys(nodeData.properties).length > 0 && (
          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="truncate max-w-[140px]">
              {Object.values(nodeData.properties)[0]?.toString() || 'Configurado'}
            </span>
            <span className="text-sky-500 font-bold">⚙</span>
          </div>
        )}
      </div>

      {/* Output Handles */}
      {nodeData?.outputsCount > 0 && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="out_right"
            className="w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="out_bottom"
            className="w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"
          />
        </>
      )}
    </div>
  );
});

CustomFlowNode.displayName = 'CustomFlowNode';
