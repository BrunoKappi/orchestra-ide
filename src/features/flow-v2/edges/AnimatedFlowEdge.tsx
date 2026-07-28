import React, { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react';
import { X } from 'lucide-react';
import type { FlowEdgeV2Data } from '../../../types/flowV2';
import { cn } from '../../../utils/cn';

export const AnimatedFlowEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
    selected,
  }: EdgeProps<any>) => {
    const { setEdges } = useReactFlow();
    const edgeData = data as FlowEdgeV2Data;
    const lineStyle = edgeData?.lineStyle || 'bezier';

    let edgePath = '';
    let labelX = 0;
    let labelY = 0;

    if (lineStyle === 'smoothstep') {
      const [path, lx, ly] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 24,
      });
      edgePath = path;
      labelX = lx;
      labelY = ly;
    } else if (lineStyle === 'straight') {
      const [path, lx, ly] = getStraightPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
      });
      edgePath = path;
      labelX = lx;
      labelY = ly;
    } else {
      // Default to smooth Bezier curve for Connectivity Studio style parity
      const [path, lx, ly] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      });
      edgePath = path;
      labelX = lx;
      labelY = ly;
    }

    const strokeColor = selected ? '#0284c7' : (edgeData?.color || style.stroke || '#64748b');
    const strokeWidth = selected ? 3 : Number(edgeData?.strokeWidth || style.strokeWidth || 2);
    const isAnimated = edgeData?.animated || edgeData?.isSimulatingActive || false;

    const onEdgeClickDelete = (evt: React.MouseEvent) => {
      evt.stopPropagation();
      setEdges((edges) => edges.filter((e) => e.id !== id));
    };

    return (
      <>
        {/* Glow aura when selected or active */}
        {(selected || edgeData?.isSimulatingActive) && (
          <path
            d={edgePath}
            fill="none"
            stroke={selected ? '#38bdf8' : '#10b981'}
            strokeWidth={strokeWidth + 5}
            strokeOpacity={0.4}
            className="animate-pulse"
          />
        )}

        {/* Base edge line */}
        <BaseEdge
          id={id}
          path={edgePath}
          markerEnd={markerEnd}
          style={{
            ...style,
            strokeWidth,
            stroke: strokeColor,
            transition: 'stroke 0.2s, stroke-width 0.2s',
          }}
        />

        {/* Animated glowing flow trace */}
        {isAnimated && (
          <path
            d={edgePath}
            fill="none"
            stroke={selected ? '#38bdf8' : '#38bdf8'}
            strokeWidth={strokeWidth}
            strokeDasharray="6 12"
            className="animate-[dash_1.5s_linear_infinite]"
            style={{
              pointerEvents: 'none',
              opacity: 0.85,
            }}
          />
        )}

        {/* Live Simulation Moving Particle */}
        {edgeData?.isSimulatingActive && (
          <circle r="4.5" fill="#10b981" className="animate-ping">
            <animateMotion dur="1.5s" repeatCount="indefinite" path={edgePath} />
          </circle>
        )}

        {/* Interactive Edge Label & Floating Delete Button */}
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan flex items-center gap-1.5 z-20 select-none group"
          >
            {edgeData?.label && (
              <span
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-xs transition-all font-mono',
                  selected
                    ? 'bg-sky-600 text-white border-sky-400 ring-2 ring-sky-500/30'
                    : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800'
                )}
              >
                {edgeData.label}
              </span>
            )}

            {/* Simulation Payload readout */}
            {edgeData?.simPayload !== undefined && (
              <span className="px-2 py-0.5 rounded-md text-[9px] font-mono bg-emerald-500 text-white shadow-md animate-bounce">
                ⚡ {String(edgeData.simPayload)}
              </span>
            )}

            {/* Hover / Selected Delete Button */}
            <button
              onClick={onEdgeClickDelete}
              title="Excluir Conexão (Delete / Backspace)"
              className={cn(
                'w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md transition-all cursor-pointer',
                selected ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 scale-95 hover:scale-110'
              )}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </EdgeLabelRenderer>
      </>
    );
  }
);

AnimatedFlowEdge.displayName = 'AnimatedFlowEdge';
