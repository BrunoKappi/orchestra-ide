import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  BackgroundVariant,
  type Node,
  type Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useShallow } from 'zustand/react/shallow';
import { useOmmStore } from '../../store/useOmmStore';
import { OmmTankNode, type OmmTankNodeData } from '../flow/OmmTankNode';
import { OmmFlowEdge, type OmmFlowEdgeData } from '../flow/OmmFlowEdge';
import { TankTelemetryModal } from '../ui/TankTelemetryModal';
import type { OmmEquipment, OmmMovement, OmmStatus } from '../../types';
import { Layers, Activity, Filter } from 'lucide-react';

// ---------------------------------------------------------------------------
// XYFlow node/edge type registries
// ---------------------------------------------------------------------------
const nodeTypes = { ommTank: OmmTankNode };
const edgeTypes = { ommFlow: OmmFlowEdge };

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------
const NODE_W = 200;  // compact node width
const GAP_H  = 240;  // horizontal gap between paired nodes (room for edge + label)
const GAP_V  = 380;  // vertical gap between rows

// ---------------------------------------------------------------------------
// Smart layout: position nodes based on movement pairs.
// Connected pairs sit side-by-side; orphan equipment fills rows below.
// ---------------------------------------------------------------------------
function computeInitialLayout(
  equipments: OmmEquipment[],
  movements: OmmMovement[],
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const placed    = new Set<string>();

  // Sort so Active movements place first, then Issued, then others
  const sorted = [...movements].sort((a, b) => {
    const p = (s: string) => s === 'Active' ? 0 : s === 'Issued' ? 1 : 2;
    return p(a.status) - p(b.status);
  });

  let row = 0;

  for (const mov of sorted) {
    const hasOrigin = equipments.some((e) => e.id === mov.originId);
    const hasDest   = equipments.some((e) => e.id === mov.destinationId);
    if (!hasOrigin || !hasDest) continue;

    // Avoid re-placing the same pair from a duplicate movement
    const pairKey = [mov.originId, mov.destinationId].sort().join('|');
    if (placed.has(pairKey)) continue;

    const y = 60 + row * GAP_V;

    if (!placed.has(mov.originId)) {
      positions.set(mov.originId, { x: 60, y });
    }
    if (!placed.has(mov.destinationId)) {
      positions.set(mov.destinationId, { x: 60 + NODE_W + GAP_H, y });
    }

    placed.add(mov.originId);
    placed.add(mov.destinationId);
    placed.add(pairKey);
    row++;
  }

  // Remaining equipments without any movement — horizontal row below
  const orphans = equipments.filter((e) => !placed.has(e.id));
  const orphanY  = 60 + row * GAP_V;
  orphans.forEach((eq, idx) => {
    positions.set(eq.id, { x: 60 + idx * (NODE_W + 60), y: orphanY });
  });

  return positions;
}

// ---------------------------------------------------------------------------
// Filter type
// ---------------------------------------------------------------------------
type MovementFilter = 'all' | 'active' | 'issued';

// ---------------------------------------------------------------------------
// Inner canvas (must be inside ReactFlowProvider)
// ---------------------------------------------------------------------------
const PlantFlowCanvas: React.FC = () => {
  const equipments = useOmmStore((s) => s.equipments);
  const movements  = useOmmStore(useShallow((s) => s.movements));
  const products   = useOmmStore(useShallow((s) => s.products));
  const areas      = useOmmStore(useShallow((s) => s.areas));
  const openMovementModal = useOmmStore((s) => s.openMovementModal);

  const [filter,     setFilter]     = useState<MovementFilter>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [telemetryId, setTelemetryId] = useState<string | null>(null);

  // Track whether initial layout has been applied
  const initialLayoutDone = useRef(false);

  // ------------------------------------------------------------------
  // Filtered movements (for edges)
  // ------------------------------------------------------------------
  const filteredMovements = useMemo(() => {
    let result = movements;
    if (filter === 'active') {
      result = movements.filter((m) => m.status === 'Active');
    } else if (filter === 'issued') {
      result = movements.filter((m) => m.status === 'Active' || m.status === 'Issued');
    }
    if (areaFilter !== 'all') {
      result = result.filter((m) => m.areaId === areaFilter);
    }
    return result;
  }, [movements, filter, areaFilter]);

  // ------------------------------------------------------------------
  // Compute initial positions once at mount
  // ------------------------------------------------------------------
  const initialPositions = useMemo(
    () => computeInitialLayout(equipments, movements),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [], // intentionally stable — computed only once
  );

  // ------------------------------------------------------------------
  // Node definitions (data only; XYFlow owns positions after mount)
  // ------------------------------------------------------------------
  const nodeDefinitions = useMemo<Node<OmmTankNodeData>[]>(() => {
    return equipments.map((eq) => {
      const product = products.find((p) => p.id === eq.productId) ?? null;
      const pos     = initialPositions.get(eq.id) ?? { x: 60, y: 60 };
      return {
        id:         eq.id,
        type:       'ommTank',
        position:   pos,
        draggable:  true,
        selectable: true,
        data: {
          equipment:    eq,
          product,
          compact:      true,
          movementRole: null,
        },
      };
    });
  }, [equipments, products, initialPositions]);

  // ------------------------------------------------------------------
  // XYFlow node state — initialized once; data patched on store changes
  // without resetting user-set positions
  // ------------------------------------------------------------------
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(
    nodeDefinitions as Node[],
  );
  const [, , onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    if (!initialLayoutDone.current) {
      initialLayoutDone.current = true;
      return;
    }
    setRfNodes((prev) => {
      let changed = false;
      const updated = prev.map((n) => {
        const def = nodeDefinitions.find((d) => d.id === n.id);
        if (!def) return n;
        // Only patch data (not position) to preserve user drag positions
        if (JSON.stringify(n.data) === JSON.stringify(def.data)) return n;
        changed = true;
        return { ...n, data: def.data };
      });
      const newNodes = nodeDefinitions.filter((d) => !prev.some((n) => n.id === d.id));
      if (newNodes.length > 0) changed = true;
      return changed ? [...updated, ...newNodes] : prev;
    });
  }, [nodeDefinitions, setRfNodes]);

  // ------------------------------------------------------------------
  // Build edges from filtered movements — deduplicate by (source, target)
  // so that two movements between the same pair (A→B and B→A) don't
  // render overlapping arrows. Priority: Active > Issued > others.
  // ------------------------------------------------------------------
  const edges = useMemo<Edge<OmmFlowEdgeData>[]>(() => {
    const STATUS_PRIORITY: Record<OmmStatus, number> = {
      Active: 0, Issued: 1, Completed: 2, Closed: 3, Canceled: 4,
    };

    // Deduplicate: keep only one movement per undirected pair of tanks (origin & destination).
    // If two movements share the same pair, keep the one with higher priority.
    const seen = new Map<string, OmmMovement>();
    for (const mov of filteredMovements) {
      const key = [mov.originId, mov.destinationId].sort().join('—');
      const existing = seen.get(key);
      if (!existing || STATUS_PRIORITY[mov.status] < STATUS_PRIORITY[existing.status]) {
        seen.set(key, mov);
      }
    }

    return Array.from(seen.values()).map((mov) => {
      const product  = products.find((p) => p.id === mov.productId);
      const isActive = mov.status === 'Active';
      return {
        id:           `edge-${mov.id}`,
        source:       mov.originId,
        target:       mov.destinationId,
        sourceHandle: 'right',
        targetHandle: 'left',
        type:         'ommFlow',
        animated:     isActive && !mov.simPaused,
        markerEnd: {
          type:   MarkerType.ArrowClosed,
          width:  14,
          height: 14,
          color:  isActive ? '#10b981' : '#94a3b8',
        },
        data: {
          movementId:   mov.id,
          status:       mov.status as OmmStatus,
          currentFlow:  mov.currentFlow,
          productName:  product?.name ?? '',
          productColor: product?.color ?? '#3b82f6',
          simPaused:    mov.simPaused,
          movementNumber: mov.number,
          currentVolume: mov.currentVolume,
          plannedVolume: mov.plannedVolume,
          percentComplete: mov.percentComplete,
        },
      };
    });
  }, [filteredMovements, products]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setTelemetryId(node.id);
  }, []);

  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    const edgeData = edge.data as OmmFlowEdgeData & { movementId?: string };
    if (edgeData?.movementId) {
      openMovementModal(edgeData.movementId);
    }
  }, [openMovementModal]);

  // Summary counts
  const activeCount = movements.filter((m) => m.status === 'Active').length;
  const totalEq     = equipments.length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Vista da Planta Industrial</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-500" />
              {activeCount} mov. ativos
            </span>
            <span>·</span>
            <span>{totalEq} equipamentos</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter className="w-3 h-3 text-slate-400 shrink-0" />

          {/* Movement status filter */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 gap-0.5">
            {([
              { id: 'all',    label: 'Todos' },
              { id: 'issued', label: 'Em Andamento' },
              { id: 'active', label: 'Somente Ativos' },
            ] as { id: MovementFilter; label: string }[]).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setFilter(opt.id)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer
                  ${filter === opt.id
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Area filter */}
          {areas.length > 0 && (
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              <option value="all">Todas as Áreas</option>
              {areas.filter((a) => a.active).map((a) => (
                <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* XYFlow Canvas */}
      <div className="flex-1 min-h-0">
        <ReactFlow
          nodes={rfNodes as Node[]}
          edges={edges as Edge[]}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={true}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          minZoom={0.2}
          maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
          className="bg-slate-50 dark:bg-slate-950"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="rgb(148 163 184 / 0.25)"
          />
          <Controls
            className="!bg-white dark:!bg-slate-900 !border-slate-200 dark:!border-slate-700 !shadow-md !rounded-xl overflow-hidden"
            showInteractive={false}
          />
          <MiniMap
            className="!bg-white dark:!bg-slate-900 !border-slate-200 dark:!border-slate-700 !rounded-xl !shadow-md overflow-hidden"
            nodeColor={(node) => {
              const d = (node.data as unknown) as OmmTankNodeData;
              return d?.equipment?.isSending
                ? '#f59e0b'
                : d?.equipment?.isReceiving
                  ? '#10b981'
                  : '#94a3b8';
            }}
            maskColor="rgb(241 245 249 / 0.6)"
            style={{ width: 140, height: 90 }}
          />
        </ReactFlow>
      </div>

      {/* Tank telemetry modal on node click */}
      <TankTelemetryModal
        isOpen={!!telemetryId}
        objectId={telemetryId}
        onClose={() => setTelemetryId(null)}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Exported component — wraps in ReactFlowProvider
// ---------------------------------------------------------------------------
export const PlantOverview: React.FC = () => (
  <ReactFlowProvider>
    <PlantFlowCanvas />
  </ReactFlowProvider>
);
