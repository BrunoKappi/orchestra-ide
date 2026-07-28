import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  MarkerType,
  BackgroundVariant,
  reconnectEdge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  type ReactFlowInstance,
  type NodeTypes,
  type EdgeTypes,
  type Edge,
} from '@xyflow/react';
import { FlowCardNode } from '../nodes/FlowCardNode';
import { ContainerNode } from '../nodes/ContainerNode';
import { StickyNoteNode } from '../nodes/StickyNoteNode';
import { AnimatedFlowEdge } from '../edges/AnimatedFlowEdge';
import { createNewNodeData } from '../../../utils/flowV2Converter';
import type { FlowNodeV2, FlowEdgeV2, FlowV2Data } from '../../../types/flowV2';
import { useObjectModelStore } from '../../../store/useObjectModelStore';

const nodeTypes: NodeTypes = {
  flowCard: FlowCardNode as any,
  container: ContainerNode as any,
  sticky_note: StickyNoteNode as any,
};

const edgeTypes: EdgeTypes = {
  animatedFlow: AnimatedFlowEdge as any,
};

interface FlowV2CanvasProps {
  initialData: FlowV2Data;
  onNodesChange: (changes: NodeChange<any>[]) => void;
  onEdgesChange: (changes: EdgeChange<any>[]) => void;
  nodes: FlowNodeV2[];
  edges: FlowEdgeV2[];
  setNodes: React.Dispatch<React.SetStateAction<FlowNodeV2[]>>;
  setEdges: React.Dispatch<React.SetStateAction<FlowEdgeV2[]>>;
  onNodeSelect: (nodeId: string | null) => void;
  backgroundType: 'dots' | 'lines' | 'none';
}

export const FlowV2Canvas: React.FC<FlowV2CanvasProps> = ({
  onNodesChange,
  onEdgesChange,
  nodes,
  edges,
  setNodes,
  setEdges,
  onNodeSelect,
  backgroundType,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const edgeReconnectSuccessful = useRef(true);
  const [rfInstance, setRfInstance] = React.useState<ReactFlowInstance | null>(null);
  const { theme } = useObjectModelStore();
  const isDark = theme === 'dark';

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: FlowEdgeV2 = {
        ...params,
        id: `e_${params.source}_${params.target}_${Date.now()}`,
        type: 'animatedFlow',
        animated: true,
        data: {
          color: '#0284c7',
          strokeWidth: 2,
          lineStyle: 'bezier',
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      edgeReconnectSuccessful.current = true;
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
    },
    [setEdges]
  );

  const onReconnectEnd = useCallback(
    (_: any, edge: Edge) => {
      if (!edgeReconnectSuccessful.current) {
        setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      }
      edgeReconnectSuccessful.current = true;
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (!rfInstance || !reactFlowWrapper.current) return;

      const type = event.dataTransfer.getData('application/reactflow-type');
      const name = event.dataTransfer.getData('application/reactflow-name');
      const indType = event.dataTransfer.getData('application/reactflow-industrial');

      if (!type) return;

      const position = rfInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNodeId = `node_${Date.now().toString(36)}`;
      const nodeType = type === 'container' ? 'container' : type === 'sticky_note' ? 'sticky_note' : 'flowCard';

      const newNode: FlowNodeV2 = {
        id: newNodeId,
        type: nodeType,
        position,
        data: createNewNodeData(type, name, indType as any),
      };

      setNodes((nds) => nds.concat(newNode));
      onNodeSelect(newNodeId);
    },
    [rfInstance, setNodes, onNodeSelect]
  );

  return (
    <div className="flex-1 h-full w-full relative overflow-hidden" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={onReconnect}
        onReconnectStart={onReconnectStart}
        onReconnectEnd={onReconnectEnd}
        onInit={setRfInstance}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeClick={(_, node) => onNodeSelect(node.id)}
        onPaneClick={() => onNodeSelect(null)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        reconnectRadius={20}
        edgesReconnectable={true}
        edgesFocusable={true}
        elementsSelectable={true}
        defaultEdgeOptions={{
          type: 'animatedFlow',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: '#0284c7' },
        }}
        colorMode={isDark ? 'dark' : 'light'}
      >
        {/* Discrete, low-contrast background grid matching Connectivity Studio */}
        {backgroundType === 'dots' && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color={isDark ? '#334155' : '#cbd5e1'}
          />
        )}
        {backgroundType === 'lines' && (
          <Background
            variant={BackgroundVariant.Lines}
            gap={28}
            size={1}
            color={isDark ? '#1e293b' : '#e2e8f0'}
          />
        )}

        {/* Floating Controls */}
        <Controls className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-1" />

        {/* MiniMap */}
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'container') return isDark ? '#1e293b' : '#e2e8f0';
            if (node.type === 'sticky_note') return '#f59e0b';
            return isDark ? '#0ea5e9' : '#0284c7';
          }}
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden"
          maskColor={isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(241, 245, 249, 0.7)'}
        />
      </ReactFlow>
    </div>
  );
};
