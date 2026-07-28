import { memo } from 'react';
import { NodeResizer, type NodeProps } from '@xyflow/react';
import { Layers, Tag } from 'lucide-react';
import type { FlowNodeV2Data } from '../../../types/flowV2';
import { cn } from '../../../utils/cn';

export const ContainerNode = memo(({ data, selected }: NodeProps<any>) => {
  const nodeData = data as FlowNodeV2Data;
  const title = nodeData.containerTitle || nodeData.label || 'Área de Processamento';
  const color = nodeData.containerColor || 'sky';

  const getColorClasses = (c: string) => {
    switch (c) {
      case 'emerald':
        return 'border-emerald-500/40 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 header-bg-emerald-500/10';
      case 'amber':
        return 'border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-400 header-bg-amber-500/10';
      case 'rose':
        return 'border-rose-500/40 bg-rose-500/5 text-rose-600 dark:text-rose-400 header-bg-rose-500/10';
      case 'purple':
        return 'border-purple-500/40 bg-purple-500/5 text-purple-600 dark:text-purple-400 header-bg-purple-500/10';
      case 'indigo':
        return 'border-indigo-500/40 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 header-bg-indigo-500/10';
      default:
        return 'border-sky-500/40 bg-sky-500/5 text-sky-600 dark:text-sky-400 header-bg-sky-500/10';
    }
  };

  const colorClass = getColorClasses(color);

  return (
    <div
      className={cn(
        'relative w-full h-full min-w-[320px] min-h-[220px] rounded-3xl border-2 border-dashed backdrop-blur-xs transition-all select-none p-4 flex flex-col justify-between',
        colorClass,
        selected ? 'ring-2 ring-sky-500 border-solid shadow-lg' : 'opacity-85 hover:opacity-100'
      )}
    >
      <NodeResizer minWidth={250} minHeight={180} isVisible={selected} lineClassName="border-sky-500" handleClassName="h-3 w-3 bg-sky-500 rounded border-2 border-white" />

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/40 dark:border-slate-800/40">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50">
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
        </div>

        <span className="text-[10px] font-mono opacity-60">Área Lógica</span>
      </div>

      <div className="flex-1 pointer-events-none" />

      {/* Footer Tag */}
      <div className="text-[9px] text-slate-400 font-medium flex items-center gap-1 opacity-70">
        <Tag className="w-3 h-3" />
        <span>Agrupamento de Automação</span>
      </div>
    </div>
  );
});

ContainerNode.displayName = 'ContainerNode';
