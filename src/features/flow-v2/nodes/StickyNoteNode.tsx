import { memo } from 'react';
import { NodeResizer, type NodeProps } from '@xyflow/react';
import { StickyNote, Edit3 } from 'lucide-react';
import type { FlowNodeV2Data } from '../../../types/flowV2';
import { cn } from '../../../utils/cn';

export const StickyNoteNode = memo(({ data, selected }: NodeProps<any>) => {
  const nodeData = data as FlowNodeV2Data;
  const text = nodeData.noteText || nodeData.label || 'Nota / Documentação do processo...';
  const color = nodeData.noteColor || 'yellow';

  const getColorClasses = (c: string) => {
    switch (c) {
      case 'blue':
        return 'bg-sky-100/90 dark:bg-sky-950/80 border-sky-300 dark:border-sky-800 text-sky-950 dark:text-sky-100';
      case 'green':
        return 'bg-emerald-100/90 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100';
      case 'pink':
        return 'bg-pink-100/90 dark:bg-pink-950/80 border-pink-300 dark:border-pink-800 text-pink-950 dark:text-pink-100';
      case 'purple':
        return 'bg-purple-100/90 dark:bg-purple-950/80 border-purple-300 dark:border-purple-800 text-purple-950 dark:text-purple-100';
      default:
        return 'bg-amber-100/90 dark:bg-amber-950/80 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100';
    }
  };

  return (
    <div
      className={cn(
        'relative min-w-[180px] min-h-[140px] rounded-2xl border p-3.5 shadow-md backdrop-blur-xs select-none flex flex-col justify-between transition-all rotate-[-1deg] hover:rotate-0',
        getColorClasses(color),
        selected ? 'ring-2 ring-amber-500 shadow-xl scale-[1.02]' : ''
      )}
    >
      <NodeResizer minWidth={150} minHeight={100} isVisible={selected} lineClassName="border-amber-500" handleClassName="h-2.5 w-2.5 bg-amber-500 rounded-full" />

      <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-1.5 mb-2">
        <div className="flex items-center gap-1.5">
          <StickyNote className="w-3.5 h-3.5 opacity-70" />
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Nota Operacional</span>
        </div>
        <Edit3 className="w-3 h-3 opacity-40" />
      </div>

      <p className="text-xs font-sans whitespace-pre-wrap leading-relaxed flex-1 opacity-90 italic">
        {text}
      </p>

      <div className="text-[9px] opacity-40 text-right font-mono mt-1">
        Orquestra Docs
      </div>
    </div>
  );
});

StickyNoteNode.displayName = 'StickyNoteNode';
