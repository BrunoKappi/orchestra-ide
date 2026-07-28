import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react';
import { X } from 'lucide-react';

export const FlowEdgeCustom: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  label,
  data,
}) => {
  const { setEdges } = useReactFlow();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeClickDelete = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    setEdges((edges) => edges.filter((e) => e.id !== id));
  };

  const isAnimated = data?.animated !== false;
  const edgeColor = selected ? '#0284c7' : (style.stroke as string) || '#64748b';

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: selected ? 3 : 2,
          stroke: edgeColor,
          transition: 'stroke 0.2s, stroke-width 0.2s',
        }}
      />

      {/* Animated glowing particle trace */}
      {isAnimated && (
        <path
          d={edgePath}
          fill="none"
          stroke="#38bdf8"
          strokeWidth={3}
          strokeDasharray="6 12"
          className="animate-[dash_1.5s_linear_infinite]"
          style={{
            pointerEvents: 'none',
            opacity: 0.8,
          }}
        />
      )}

      {/* Interactive Edge Label & Quick Delete Button */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan flex items-center gap-1 group"
        >
          {label && (
            <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-300 shadow-2xs">
              {label}
            </span>
          )}

          <button
            onClick={onEdgeClickDelete}
            title="Excluir Conexão (Delete / Backspace)"
            className={`w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md transition-all ${
              selected ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 scale-95 hover:scale-110'
            }`}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
