import React, { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import type { OmmStatus } from '../../types';

export interface OmmFlowEdgeData {
  [key: string]: unknown;
  movementId?: string;
  status: OmmStatus;
  currentFlow: number;       // m³/h
  productName: string;
  productColor: string;
  simPaused?: boolean;
  movementNumber?: string;
  currentVolume?: number;
  plannedVolume?: number;
  percentComplete?: number;
}

// ---------------------------------------------------------------------------
// Visual config per movement status
// ---------------------------------------------------------------------------
const STATUS_EDGE_STYLE: Record<OmmStatus, {
  stroke: string;
  strokeWidth: number;
  opacity: number;
  dashArray: string | null;
  animated: boolean;
  animColor: string;
}> = {
  Active:    { stroke: '#10b981', strokeWidth: 3, opacity: 1,    dashArray: null,    animated: true,  animColor: '#34d399' },
  Issued:    { stroke: '#94a3b8', strokeWidth: 2, opacity: 0.7,  dashArray: '6 4',   animated: false, animColor: '#94a3b8' },
  Completed: { stroke: '#3b82f6', strokeWidth: 1.5, opacity: 0.5, dashArray: '4 6', animated: false, animColor: '#3b82f6' },
  Closed:    { stroke: '#8b5cf6', strokeWidth: 1.5, opacity: 0.4, dashArray: '4 6', animated: false, animColor: '#8b5cf6' },
  Canceled:  { stroke: '#f43f5e', strokeWidth: 1.5, opacity: 0.35, dashArray: '8 8', animated: false, animColor: '#f43f5e' },
};

const STATUS_LABEL: Record<OmmStatus, string> = {
  Active:    'ATIVO',
  Issued:    'EMITIDO',
  Completed: 'CONCLUÍDO',
  Closed:    'FECHADO',
  Canceled:  'CANCELADO',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const OmmFlowEdge: React.FC<EdgeProps> = memo(({
  sourceX, sourceY,
  targetX, targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  selected,
}) => {
  const edgeData = data as OmmFlowEdgeData | undefined;
  const status = edgeData?.status ?? 'Issued';
  const cfg = STATUS_EDGE_STYLE[status];

  // If the active movement is paused, switch to amber style
  const isPaused = status === 'Active' && edgeData?.simPaused;
  const stroke = selected
    ? '#0284c7'
    : isPaused
      ? '#f59e0b'
      : cfg.stroke;
  const animated = !isPaused && cfg.animated;
  const animColor = isPaused ? '#fcd34d' : cfg.animColor;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  return (
    <>
      {/* Base pipe line */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke,
          strokeWidth: selected ? cfg.strokeWidth + 1 : cfg.strokeWidth,
          opacity: cfg.opacity,
          strokeDasharray: cfg.dashArray ?? undefined,
          transition: 'stroke 0.3s, stroke-width 0.2s',
        }}
      />

      {/* Animated flow particles (only for active, non-paused movements) */}
      {animated && (
        <path
          d={edgePath}
          fill="none"
          stroke={animColor}
          strokeWidth={cfg.strokeWidth - 1}
          strokeDasharray="8 14"
          style={{
            pointerEvents: 'none',
            opacity: 0.85,
            animation: 'omm-flow-dash 1.2s linear infinite',
          }}
        />
      )}

      {/* Inline keyframe for the animated dash */}
      {animated && (
        <style>{`
          @keyframes omm-flow-dash {
            to { stroke-dashoffset: -22; }
          }
        `}</style>
      )}

      {/* Edge label: flow rate + status */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'none',
          }}
          className="nodrag nopan"
        >
          {edgeData && (
            <div
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl shadow-lg border text-center font-sans
                ${status === 'Active' && !isPaused
                  ? 'bg-emerald-50/90 dark:bg-emerald-950/90 border-emerald-250 dark:border-emerald-800'
                  : isPaused
                    ? 'bg-amber-50/90 dark:bg-amber-950/90 border-amber-250 dark:border-amber-800'
                    : 'bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700'
                }`}
            >
              {/* Movement Number */}
              {edgeData.movementNumber && (
                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                  {edgeData.movementNumber}
                </span>
              )}

              {status === 'Active' && !isPaused && edgeData.currentFlow > 0 && (
                <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                  {edgeData.currentFlow.toFixed(1)} m³/h
                </span>
              )}
              {isPaused && (
                <span className="text-[9px] font-mono font-bold text-amber-700 dark:text-amber-300">
                  ⏸ PAUSADO
                </span>
              )}

              {/* Volume Progress */}
              {edgeData.currentVolume !== undefined && edgeData.plannedVolume !== undefined && (
                <span className="text-[8px] font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap mt-0.5">
                  {Math.round(edgeData.currentVolume)}/{Math.round(edgeData.plannedVolume)} m³ ({edgeData.percentComplete?.toFixed(0)}%)
                </span>
              )}

              <span
                className="text-[7.5px] font-bold uppercase tracking-widest mt-0.5"
                style={{ color: isPaused ? '#d97706' : stroke }}
              >
                {STATUS_LABEL[status]}
              </span>
              {edgeData.productName && status === 'Active' && (
                <span className="text-[8px] font-semibold text-slate-550 dark:text-slate-400 whitespace-nowrap mt-0.5">
                  {edgeData.productName}
                </span>
              )}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

OmmFlowEdge.displayName = 'OmmFlowEdge';
