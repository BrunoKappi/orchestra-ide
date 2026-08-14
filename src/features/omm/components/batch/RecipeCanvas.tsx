import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import { Trash2 } from 'lucide-react';
import { useBatchStore } from '../../../../store/useBatchStore';
import { BatchStepNode } from './BatchStepNode';

const nodeTypes = {
  customNode: BatchStepNode,
};

// Colors representing block configurations
const blockStyles: Record<string, { blockType: string; color: string; category: string; iconName: string }> = {
  start: { blockType: 'INÍCIO', color: '#10b981', category: 'Controle', iconName: 'Play' },
  transfer: { blockType: 'TRANSFERÊNCIA', color: '#3b82f6', category: 'Operação', iconName: 'ArrowLeftRight' },
  agitate: { blockType: 'AGITAÇÃO', color: '#eab308', category: 'Operação', iconName: 'RotateCw' },
  heat: { blockType: 'AQUECIMENTO', color: '#f97316', category: 'Operação', iconName: 'Zap' },
  cool: { blockType: 'RESFRIAMENTO', color: '#0284c7', category: 'Operação', iconName: 'Snowflake' },
  cip: { blockType: 'LIMPEZA / CIP', color: '#0d9488', category: 'Operação', iconName: 'Droplets' },
  separate: { blockType: 'SEPARAÇÃO', color: '#4f46e5', category: 'Operação', iconName: 'Filter' },
  cutoff: { blockType: 'CUT-OFF', color: '#a855f7', category: 'Controle', iconName: 'Database' },
  end: { blockType: 'FIM', color: '#ef4444', category: 'Controle', iconName: 'Zap' },
};

const FlowCanvas: React.FC = () => {
  const {
    recipes,
    selectedRecipeId,
    activeBatch,
    subTab,
    setSelectedNodeId,
    updateRecipeNodesEdges,
  } = useBatchStore();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const { getNodes, getEdges } = useReactFlow();

  // Active Recipe details
  const currentRecipe = useMemo(
    () => recipes.find((r) => r.id === selectedRecipeId),
    [recipes, selectedRecipeId]
  );

  const isReadOnly = subTab === 'monitor' && activeBatch?.status === 'running';

  const [nodes, setNodes, onNodesChange] = useNodesState(currentRecipe?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(currentRecipe?.edges || []);

  // Sync ReactFlow state when current recipe or store changes
  useEffect(() => {
    if (currentRecipe) {
      setNodes(currentRecipe.nodes || []);
      setEdges(currentRecipe.edges || []);
      setSelectedEdgeId(null);
    }
  }, [currentRecipe, selectedRecipeId, setNodes, setEdges]);

  // Persist nodes/edges to the store on change (only if not running)
  const handleNodesChange = useCallback(
    (changes: any) => {
      if (isReadOnly) return;
      onNodesChange(changes);
      if (currentRecipe) {
        // Sync immediately to store using the updated ReactFlow state
        setTimeout(() => {
          updateRecipeNodesEdges(currentRecipe.id, getNodes(), getEdges());
        }, 0);
      }
    },
    [onNodesChange, currentRecipe, updateRecipeNodesEdges, isReadOnly, getNodes, getEdges]
  );

  const handleEdgesChange = useCallback(
    (changes: any) => {
      if (isReadOnly) return;
      onEdgesChange(changes);

      const isRemoved = changes.some((c: any) => c.type === 'remove' && c.id === selectedEdgeId);
      if (isRemoved) {
        setSelectedEdgeId(null);
      }

      if (currentRecipe) {
        // Sync immediately to store using the updated ReactFlow state
        setTimeout(() => {
          updateRecipeNodesEdges(currentRecipe.id, getNodes(), getEdges());
        }, 0);
      }
    },
    [onEdgesChange, currentRecipe, updateRecipeNodesEdges, isReadOnly, getNodes, getEdges, selectedEdgeId]
  );

  // Connection Handler
  const onConnect = useCallback(
    (params: Connection) => {
      if (isReadOnly) return;
      setSelectedEdgeId(null);
      const newEdge: Edge = {
        ...params,
        id: `e-${uuidv4()}`,
        animated: true,
        style: { stroke: '#94a3b8', strokeWidth: 2 },
      };
      setEdges((eds) => {
        const nextEdges = addEdge(newEdge, eds);
        if (currentRecipe) {
          updateRecipeNodesEdges(currentRecipe.id, getNodes(), nextEdges);
        }
        return nextEdges;
      });
    },
    [setEdges, currentRecipe, updateRecipeNodesEdges, isReadOnly, getNodes]
  );

  // Drag and drop steps from Palette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (!reactFlowWrapper.current || !reactFlowInstance || !currentRecipe || isReadOnly) return;

      const type = event.dataTransfer.getData('application/reactflow-step');
      if (!type) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const styleDef = blockStyles[type] || blockStyles.transfer;
      const newNodeId = `step-${type}-${uuidv4().substring(0, 6)}`;
      const newNode: Node = {
        id: newNodeId,
        type: 'customNode',
        position,
        data: {
          label: `Nova Etapa ${styleDef.blockType.toLowerCase()}`,
          stepType: type,
          description: `Configuração da etapa ${styleDef.blockType.toLowerCase()}`,
          inputsCount: type === 'start' ? 0 : 1,
          outputsCount: type === 'end' ? 0 : 1,
          color: styleDef.color,
          blockType: styleDef.blockType,
          category: styleDef.category,
          iconName: styleDef.iconName,
        },
      };

      setNodes((nds) => {
        const nextNodes = [...nds, newNode];
        updateRecipeNodesEdges(currentRecipe.id, nextNodes, edges);
        return nextNodes;
      });

      setSelectedNodeId(newNodeId);
      setSelectedEdgeId(null);
    },
    [reactFlowInstance, currentRecipe, edges, updateRecipeNodesEdges, isReadOnly, setNodes, setSelectedNodeId]
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
      setSelectedEdgeId(null);
    },
    [setSelectedNodeId]
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, [setSelectedNodeId]);

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setSelectedEdgeId(edge.id);
      setSelectedNodeId(null);
    },
    [setSelectedNodeId, setSelectedEdgeId]
  );

  const deleteSelectedEdge = useCallback(() => {
    if (!selectedEdgeId || isReadOnly || !currentRecipe) return;
    const nextEdges = edges.filter((e) => e.id !== selectedEdgeId);
    setEdges(nextEdges);
    updateRecipeNodesEdges(currentRecipe.id, nodes, nextEdges);
    setSelectedEdgeId(null);
  }, [selectedEdgeId, isReadOnly, currentRecipe, edges, nodes, updateRecipeNodesEdges, setEdges]);

  // Compute edges with selection style highlights dynamically
  const styledEdges = useMemo(() => {
    return edges.map((edge) => {
      const isSelected = edge.id === selectedEdgeId;
      return {
        ...edge,
        style: {
          ...edge.style,
          stroke: isSelected ? '#3b82f6' : '#94a3b8',
          strokeWidth: isSelected ? 3.5 : 2,
        },
        animated: isSelected || edge.animated,
      };
    });
  }, [edges, selectedEdgeId]);

  return (
    <div className="w-full h-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onEdgeClick={handleEdgeClick}
        onInit={setReactFlowInstance}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodesDraggable={!isReadOnly}
        nodesConnectable={!isReadOnly}
        elementsSelectable={true}
        deleteKeyCode={['Backspace', 'Delete']}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: true }}
        className="bg-slate-50 dark:bg-slate-950"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgb(148 163 184 / 0.2)"
        />
        <Controls className="!bg-white dark:!bg-slate-900 !border-slate-200 dark:!border-slate-800 !shadow-md !rounded-xl overflow-hidden" />
        <MiniMap
          className="!bg-white dark:!bg-slate-900 !border-slate-200 dark:!border-slate-800 !rounded-xl !shadow-md"
          nodeColor={(node) => node.data?.color as string || '#94a3b8'}
          style={{ width: 120, height: 80 }}
          maskColor="rgba(15, 23, 42, 0.08)"
        />
      </ReactFlow>

      {selectedEdgeId && !isReadOnly && (
        <button
          onClick={deleteSelectedEdge}
          className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-650 hover:bg-red-500 text-white font-semibold text-xs shadow-lg transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Excluir Conexão</span>
        </button>
      )}
    </div>
  );
};

export const RecipeCanvas: React.FC = () => (
  <ReactFlowProvider>
    <FlowCanvas />
  </ReactFlowProvider>
);
