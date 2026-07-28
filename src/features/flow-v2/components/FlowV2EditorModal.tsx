import React, { useState, useEffect, useCallback } from 'react';
import { ReactFlowProvider, useNodesState, useEdgesState } from '@xyflow/react';
import { FlowV2Header } from './FlowV2Header';
import { FlowV2Palette } from './FlowV2Palette';
import { FlowV2Canvas } from './FlowV2Canvas';
import { FlowV2PropertyInspector } from './FlowV2PropertyInspector';
import { FlowV2InspectorPanel } from './FlowV2InspectorPanel';
import { useFlowStore } from '../../../store/useFlowStore';
import { convertEntityToXyflow, createNewNodeData } from '../../../utils/flowV2Converter';
import { simulationEngine } from '../services/FlowV2SimulationEngine';
import type { FlowNodeV2, FlowV2Data } from '../../../types/flowV2';
import type { IndustrialNodeType } from '../../../types/flow';

export const FlowV2EditorContent: React.FC = () => {
  const { activeFlowchart, isDesignerV2Open, updateActiveXyflowData } = useFlowStore();

  const [backgroundType, setBackgroundType] = useState<'dots' | 'lines' | 'none'>('dots');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [clipboardNode, setClipboardNode] = useState<FlowNodeV2 | null>(null);

  // Initialize nodes and edges state from activeFlowchart
  const initialData: FlowV2Data = React.useMemo(() => {
    if (!activeFlowchart) {
      return { nodes: [], edges: [] };
    }
    return convertEntityToXyflow(activeFlowchart);
  }, [activeFlowchart]);

  const [nodes, setNodes, onNodesChange] = useNodesState<any>(initialData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>(initialData.edges);

  useEffect(() => {
    if (activeFlowchart) {
      const data = convertEntityToXyflow(activeFlowchart);
      setNodes(data.nodes);
      setEdges(data.edges);
      if (data.backgroundType) setBackgroundType(data.backgroundType);
    }
  }, [activeFlowchart, setNodes, setEdges]);

  // Handle saving flowchart back to Zustand store & localStorage
  const handleSave = useCallback(() => {
    if (!activeFlowchart) return;
    const xyData: FlowV2Data = {
      nodes,
      edges,
      backgroundType,
    };
    updateActiveXyflowData(xyData);
  }, [activeFlowchart, nodes, edges, backgroundType, updateActiveXyflowData]);

  // Handle adding node from palette
  const handleAddNodeFromPalette = useCallback(
    (type: string, name: string, industrialType?: IndustrialNodeType) => {
      const newId = `node_${Date.now().toString(36)}`;
      const nodeType = type === 'container' ? 'container' : type === 'sticky_note' ? 'sticky_note' : 'flowCard';

      const newNode: FlowNodeV2 = {
        id: newId,
        type: nodeType,
        position: { x: 300 + Math.random() * 50, y: 200 + Math.random() * 50 },
        data: createNewNodeData(type, name, industrialType),
      };

      setNodes((nds) => nds.concat(newNode));
      setSelectedNodeId(newId);
    },
    [setNodes]
  );

  // Handle updating single node data from Inspector
  const handleUpdateNodeData = useCallback(
    (nodeId: string, updates: any) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                ...updates,
              },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  // Toggle Live Simulation Mode
  const handleToggleSimulation = useCallback(() => {
    if (isSimulating) {
      simulationEngine.stopSimulation();
      setIsSimulating(false);
      // Reset visual states
      setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, simState: 'idle' } })));
      setEdges((eds) => eds.map((e) => ({ ...e, data: { ...e.data, isSimulatingActive: false } })));
    } else {
      setIsSimulating(true);
      simulationEngine.startSimulation(nodes, edges, (updatedNodes, updatedEdges) => {
        setNodes(updatedNodes);
        setEdges(updatedEdges);
      });
    }
  }, [isSimulating, nodes, edges, setNodes, setEdges]);

  // Export JSON
  const handleExportJson = useCallback(() => {
    if (!activeFlowchart) return;
    const exportData = {
      ...activeFlowchart,
      xyflowData: { nodes, edges, backgroundType },
    };
    const str = JSON.stringify(exportData, null, 2);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeFlowchart.name.replace(/\s+/g, '_')}_xyflow.json`;
    a.click();
  }, [activeFlowchart, nodes, edges, backgroundType]);

  // Import JSON
  const handleImportJson = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt: any) => {
        try {
          const parsed = JSON.parse(evt.target.result);
          if (parsed.xyflowData && parsed.xyflowData.nodes) {
            setNodes(parsed.xyflowData.nodes);
            setEdges(parsed.xyflowData.edges || []);
          } else if (parsed.nodes) {
            setNodes(parsed.nodes);
            setEdges(parsed.edges || []);
          }
        } catch (err) {
          console.error('Falha ao importar JSON:', err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [setNodes, setEdges]);

  // Keyboard Shortcuts (Ctrl+S, Ctrl+C, Ctrl+V, Esc, Delete, Backspace)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDesignerV2Open) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        if (selectedNodeId) {
          const found = nodes.find((n) => n.id === selectedNodeId);
          if (found) setClipboardNode(found);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        if (clipboardNode) {
          const dupId = `node_${Date.now().toString(36)}`;
          const dupNode: FlowNodeV2 = {
            ...clipboardNode,
            id: dupId,
            position: { x: clipboardNode.position.x + 30, y: clipboardNode.position.y + 30 },
            data: { ...clipboardNode.data, label: `${clipboardNode.data.label} (Cópia)` },
          };
          setNodes((nds) => nds.concat(dupNode));
          setSelectedNodeId(dupId);
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
          setEdges((eds) => eds.filter((eg) => eg.source !== selectedNodeId && eg.target !== selectedNodeId && !eg.selected));
          setSelectedNodeId(null);
        } else {
          // Remove selected edges or selected nodes
          setEdges((eds) => eds.filter((eg) => !eg.selected));
          setNodes((nds) => nds.filter((n) => !n.selected));
        }
      } else if (e.key === 'Escape') {
        setSelectedNodeId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDesignerV2Open, handleSave, selectedNodeId, nodes, clipboardNode, setNodes, setEdges]);

  if (!isDesignerV2Open) return null;

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col w-screen h-screen overflow-hidden text-slate-900 dark:text-slate-100 font-sans">
      {/* Top Action Header */}
      <FlowV2Header
        onSave={handleSave}
        onAutoLayout={() => {}}
        onFitView={() => {}}
        onToggleSimulation={handleToggleSimulation}
        isSimulating={isSimulating}
        onExportJson={handleExportJson}
        onExportPng={() => {}}
        onImportJson={handleImportJson}
        onToggleStats={() => setIsStatsOpen(!isStatsOpen)}
        backgroundType={backgroundType}
        setBackgroundType={setBackgroundType}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Palette */}
        <FlowV2Palette onAddNode={handleAddNodeFromPalette} />

        {/* Central React Flow Canvas */}
        <FlowV2Canvas
          initialData={initialData}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodes={nodes}
          edges={edges}
          setNodes={setNodes}
          setEdges={setEdges}
          onNodeSelect={setSelectedNodeId}
          backgroundType={backgroundType}
        />

        {/* Right Property Inspector */}
        {selectedNode && (
          <FlowV2PropertyInspector
            selectedNode={selectedNode}
            onUpdateNodeData={handleUpdateNodeData}
            onClose={() => setSelectedNodeId(null)}
          />
        )}

        {/* Bottom Inspection & Stats Panel */}
        <FlowV2InspectorPanel
          nodes={nodes}
          edges={edges}
          isOpen={isStatsOpen}
          onClose={() => setIsStatsOpen(false)}
          onSelectNode={setSelectedNodeId}
        />
      </div>
    </div>
  );
};

export const FlowV2EditorModal: React.FC = () => {
  return (
    <ReactFlowProvider>
      <FlowV2EditorContent />
    </ReactFlowProvider>
  );
};
