import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  reconnectEdge,
  type Connection as ReactFlowConnection,
  type Node,
  type Edge,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Play,
  Save,
  Maximize2,
  Minimize2,
  Workflow,
  Sliders,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Focus,
  Check,
} from 'lucide-react';
import { useConnectivityStore } from '../../store/useConnectivityStore';
import { CustomFlowNode } from './CustomFlowNode';
import { FlowsTreeSidebar } from './FlowsTreeSidebar';
import { FlowBlockLibrary } from './FlowBlockLibrary';
import { FlowEdgeCustom } from './FlowEdgeCustom';
import { FlowPropertyPanel } from './FlowPropertyPanel';
import type { ConnectivityFlowNodeData } from '../../types/connectivity';
import { v4 as uuidv4 } from 'uuid';

const nodeTypes = {
  custom: CustomFlowNode,
  customNode: CustomFlowNode,
};

const edgeTypes = {
  default: FlowEdgeCustom,
  custom: FlowEdgeCustom,
};

// Immersive Mode Floating Toolbar Component
interface FloatingImmersiveBarProps {
  onExit: () => void;
  onSave: () => void;
  isSaved: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onTogglePanels: () => void;
  showPanels: boolean;
  flowName: string;
}

const FloatingImmersiveBar: React.FC<FloatingImmersiveBarProps> = ({
  onExit,
  onSave,
  isSaved,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onTogglePanels,
  showPanels,
  flowName,
}) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl select-none text-xs text-slate-700 dark:text-slate-200 transition-all duration-200 animate-in fade-in slide-in-from-top-4">
      {/* Exit Immersive Button */}
      <button
        onClick={onExit}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold transition-colors"
        title="Sair do Modo Imersivo (Esc)"
      >
        <Minimize2 className="w-3.5 h-3.5" />
        <span>Sair</span>
      </button>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

      {/* Flow Title */}
      <div className="flex items-center gap-1.5 px-2 py-0.5 max-w-[140px] md:max-w-[200px] truncate">
        <Workflow className="w-3.5 h-3.5 text-sky-500 shrink-0" />
        <span className="font-semibold truncate text-slate-800 dark:text-slate-100">{flowName}</span>
      </div>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

      {/* Save Button */}
      <button
        onClick={onSave}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-semibold text-white transition-all shadow-xs ${
          isSaved
            ? 'bg-emerald-600 hover:bg-emerald-500'
            : 'bg-sky-600 hover:bg-sky-500'
        }`}
        title="Salvar Fluxo (Ctrl+S)"
      >
        {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
        <span>{isSaved ? 'Salvo!' : 'Salvar'}</span>
      </button>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5">
        <button
          disabled={!canUndo}
          onClick={onUndo}
          title="Desfazer"
          className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors ${
            !canUndo ? 'opacity-40 cursor-not-allowed' : ''
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          disabled={!canRedo}
          onClick={onRedo}
          title="Refazer"
          className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors ${
            !canRedo ? 'opacity-40 cursor-not-allowed' : ''
          }`}
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => zoomIn()}
          title="Aumentar Zoom (+)"
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => zoomOut()}
          title="Diminuir Zoom (-)"
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => fitView({ padding: 0.2, duration: 400 })}
          title="Centralizar Fluxo"
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
        >
          <Focus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

      {/* Toggle Panels / Settings */}
      <button
        onClick={onTogglePanels}
        title={showPanels ? 'Ocultar Painéis Laterais' : 'Exibir Painéis Laterais'}
        className={`p-1.5 rounded-lg transition-colors ${
          showPanels
            ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold'
            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
        }`}
      >
        <Sliders className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

const FlowDesignerContent: React.FC = () => {
  const {
    flows,
    selectedFlowId,
    updateFlowNodesEdges,
    executeFlowSimulation,
  } = useConnectivityStore();

  const currentFlow = useMemo(
    () => flows.find((f) => f.id === selectedFlowId) || flows[0],
    [flows, selectedFlowId]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(currentFlow?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(currentFlow?.edges || []);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showImmersivePanels, setShowImmersivePanels] = useState(true);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  // Simple Undo/Redo stack history
  const [history, setHistory] = useState<{ nodes: Node<ConnectivityFlowNodeData>[]; edges: Edge[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Sync state when flow changes
  useEffect(() => {
    if (currentFlow) {
      setNodes(currentFlow.nodes || []);
      setEdges(currentFlow.edges || []);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setHistory([{ nodes: currentFlow.nodes || [], edges: currentFlow.edges || [] }]);
      setHistoryIndex(0);
    }
  }, [currentFlow?.id]);

  const saveHistoryStep = useCallback((newNodes: Node<ConnectivityFlowNodeData>[], newEdges: Edge[]) => {
    setHistory((prev) => {
      const nextHistory = prev.slice(0, historyIndex + 1);
      return [...nextHistory, { nodes: newNodes, edges: newEdges }];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevStep = history[historyIndex - 1];
      setNodes(prevStep.nodes);
      setEdges(prevStep.edges);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextStep = history[historyIndex + 1];
      setNodes(nextStep.nodes);
      setEdges(nextStep.edges);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // Handle Save Flow
  const handleSaveFlow = useCallback(() => {
    if (currentFlow) {
      updateFlowNodesEdges(currentFlow.id, nodes, edges);
      setIsSavedFeedback(true);
      setTimeout(() => setIsSavedFeedback(false), 2000);
    }
  }, [currentFlow, nodes, edges, updateFlowNodesEdges]);

  // Handle Connection Creation
  const onConnect = useCallback(
    (params: ReactFlowConnection) => {
      const newEdge: Edge = {
        ...params,
        id: `edge-${uuidv4()}`,
        type: 'custom',
        animated: true,
        data: { animated: true },
        style: { stroke: '#0284c7', strokeWidth: 2 },
      };
      setEdges((eds) => {
        const nextEdges = addEdge(newEdge, eds);
        saveHistoryStep(nodes, nextEdges);
        return nextEdges;
      });
    },
    [setEdges, nodes, saveHistoryStep]
  );

  // Handle Edge Reconnection
  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: ReactFlowConnection) => {
      setEdges((els) => {
        const nextEdges = reconnectEdge(oldEdge, newConnection, els);
        saveHistoryStep(nodes, nextEdges);
        return nextEdges;
      });
    },
    [setEdges, nodes, saveHistoryStep]
  );

  // Drag & Drop Block from Library
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const rawData = event.dataTransfer.getData('application/reactflow-node');
      if (!rawData) return;

      try {
        const block = JSON.parse(rawData);
        const position = {
          x: event.clientX - 350,
          y: event.clientY - 120,
        };

        const newNode: Node<ConnectivityFlowNodeData> = {
          id: `node-${uuidv4()}`,
          type: 'custom',
          position,
          data: {
            label: block.label,
            category: block.nodeCategory || (block.category === 'Fontes de Dados' ? 'Banco de Dados' : 'Industrial'),
            blockType: block.type,
            iconName: block.iconName || 'Cpu',
            color: block.color || '#0284c7',
            description: block.description || '',
            inputsCount: block.inputsCount !== undefined ? block.inputsCount : 1,
            outputsCount: block.outputsCount !== undefined ? block.outputsCount : 1,
            customOutputs: block.customOutputs || undefined,
            properties: block.defaultProperties || {},
          },
        };

        setNodes((nds) => {
          const nextNodes = nds.concat(newNode);
          saveHistoryStep(nextNodes, edges);
          return nextNodes;
        });
        setSelectedNodeId(newNode.id);
      } catch (err) {
        console.error('Failed to parse drag node:', err);
      }
    },
    [setNodes, edges, saveHistoryStep]
  );

  // Selection handlers
  const onSelectionChange = useCallback(
    ({ nodes: selNodes, edges: selEdges }: { nodes: Node[]; edges: Edge[] }) => {
      if (selNodes.length > 0) {
        setSelectedNodeId(selNodes[0].id);
        setSelectedEdgeId(null);
      } else if (selEdges.length > 0) {
        setSelectedEdgeId(selEdges[0].id);
        setSelectedNodeId(null);
      } else {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
      }
    },
    []
  );

  // Keybindings (Delete / Backspace / Esc / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveFlow();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
          setEdges((eds) => eds.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId));
          setSelectedNodeId(null);
        } else if (selectedEdgeId) {
          setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdgeId));
          setSelectedEdgeId(null);
        }
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          setSelectedNodeId(null);
          setSelectedEdgeId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedEdgeId, isFullscreen, setNodes, setEdges, handleSaveFlow]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) as Node<ConnectivityFlowNodeData> | null,
    [nodes, selectedNodeId]
  );

  const selectedEdge = useMemo(
    () => edges.find((e) => e.id === selectedEdgeId) || null,
    [edges, selectedEdgeId]
  );

  const handleUpdateNodeData = (id: string, updatedData: Partial<ConnectivityFlowNodeData>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, ...updatedData },
          };
        }
        return node;
      })
    );
  };

  const handleUpdateEdgeData = (id: string, edgeData: Partial<Edge>) => {
    setEdges((eds) =>
      eds.map((e) => {
        if (e.id === id) {
          return { ...e, ...edgeData };
        }
        return e;
      })
    );
  };

  const handleDeleteNode = (id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    setSelectedNodeId(null);
  };

  const handleDeleteEdge = (id: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== id));
    setSelectedEdgeId(null);
  };

  if (!currentFlow) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        Nenhum fluxo selecionado.
      </div>
    );
  }

  // Common Canvas Element shared between Standard and Immersive layout
  const renderCanvasSection = (showLibraryAndProps: boolean) => (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Collapsible Left Block Library */}
      {showLibraryAndProps && (
        <FlowBlockLibrary collapsed={false} onToggleCollapse={() => {}} />
      )}

      {/* ReactFlow Canvas */}
      <div className="flex-1 h-full w-full relative bg-slate-950">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onReconnect={onReconnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          className="bg-slate-950"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
          <Controls className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 fill-slate-700 dark:fill-slate-200 rounded-xl shadow-lg" />
          <MiniMap
            nodeColor={(node) => (node.data as any)?.color || '#0284c7'}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg"
          />
        </ReactFlow>
      </div>

      {/* Right Property Panel */}
      {showLibraryAndProps && (
        <FlowPropertyPanel
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onUpdateNode={handleUpdateNodeData}
          onUpdateEdge={handleUpdateEdgeData}
          onDeleteNode={handleDeleteNode}
          onDeleteEdge={handleDeleteEdge}
          onClose={() => {
            setSelectedNodeId(null);
            setSelectedEdgeId(null);
          }}
        />
      )}
    </div>
  );

  // IMMERSIVE FULLSCREEN MODE OVERLAY (100% Viewport)
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col w-screen h-screen overflow-hidden select-none">
        {/* Floating Action Bar (Figma / Miro / tldraw style) */}
        <FloatingImmersiveBar
          onExit={() => setIsFullscreen(false)}
          onSave={handleSaveFlow}
          isSaved={isSavedFeedback}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onTogglePanels={() => setShowImmersivePanels(!showImmersivePanels)}
          showPanels={showImmersivePanels}
          flowName={currentFlow.name}
        />

        {/* 100% Viewport Flow Canvas */}
        {renderCanvasSection(showImmersivePanels)}
      </div>
    );
  }

  // STANDARD MODE LAYOUT
  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-900">
      {/* Left Tree Navigation Sidebar */}
      <FlowsTreeSidebar />

      {/* Main Canvas Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Workspace Top Toolbar */}
        <div className="h-11 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-3 shrink-0 z-10 select-none shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Workflow className="w-4 h-4 text-sky-500" />
              <h2 className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>{currentFlow.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-mono text-[10px] uppercase font-bold">
                  {currentFlow.status}
                </span>
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 hidden md:inline">
              {currentFlow.description}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => executeFlowSimulation(currentFlow.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-2xs transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simular Execução</span>
            </button>

            <button
              onClick={handleSaveFlow}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white font-semibold text-xs shadow-2xs transition-all ${
                isSavedFeedback ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-sky-600 hover:bg-sky-500'
              }`}
            >
              {isSavedFeedback ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSavedFeedback ? 'Salvo!' : 'Salvar Fluxo'}</span>
            </button>

            <button
              onClick={() => setIsFullscreen(true)}
              title="Modo Tela Cheia Imersivo"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5 text-sky-500" />
              <span>Modo Imersivo</span>
            </button>
          </div>
        </div>

        {/* ReactFlow Canvas & Panels */}
        {renderCanvasSection(true)}
      </div>
    </div>
  );
};

export const FlowDesignerTab: React.FC = () => {
  return (
    <ReactFlowProvider>
      <FlowDesignerContent />
    </ReactFlowProvider>
  );
};
