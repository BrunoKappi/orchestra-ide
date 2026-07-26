import React, { useEffect, useRef, useState } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import ReactDOM from 'react-dom/client';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Undo,
  Redo,
  Sparkles,
  Search,
  Plus,
  Trash2,
  Copy,
  Clipboard,
  MessageSquare,
  FolderPlus,
  Play,
  StopCircle,
  Bell,
  Clock,
  Code,
  Workflow,
  Zap,
  Database,
  Sliders,
  GitBranch,
  Radio,
  Layers,
  FileText,
  Info,
  Activity
} from 'lucide-react';
import { useFlowStore, mapIndustrialTypeToBpmnType } from '../../store/useFlowStore';
import { useObjectModelStore } from '../../store/useObjectModelStore';
import { ContextMenu, type ContextMenuItem } from '../../components/ui/ContextMenu';
import type { FlowNodeMetadata } from '../../types/flow';

interface BpmnCanvasProps {
  bpmnXml: string;
  onXmlChange?: (newXml: string) => void;
}

const ICON_MAP: Record<string, any> = {
  read_property: Database,
  write_property: Sliders,
  compare_variable: GitBranch,
  execute_expression: Zap,
  execute_script: Code,
  call_flowchart: Workflow,
  delay: Clock,
  timer: Clock,
  wait_alarm: Bell,
  ack_alarm: Bell,
  query_history: Activity,
  raise_event: Radio,
  update_widget: Layers,
  update_faceplate: FileText,
  start_sim: Play,
  stop_sim: StopCircle,
  log: Info,
  comment: MessageSquare,
  logical_group: FolderPlus,
};

const COLOR_MAP: Record<string, string> = {
  read_property: 'text-sky-400 border-sky-500/50 bg-sky-950/90',
  write_property: 'text-amber-400 border-amber-500/50 bg-amber-950/90',
  compare_variable: 'text-emerald-400 border-emerald-500/50 bg-emerald-950/90',
  execute_expression: 'text-teal-400 border-teal-500/50 bg-teal-950/90',
  execute_script: 'text-purple-400 border-purple-500/50 bg-purple-950/90',
  call_flowchart: 'text-indigo-400 border-indigo-500/50 bg-indigo-950/90',
  delay: 'text-blue-400 border-blue-500/50 bg-blue-950/90',
  timer: 'text-cyan-400 border-cyan-500/50 bg-cyan-950/90',
  wait_alarm: 'text-rose-400 border-rose-500/50 bg-rose-950/90',
  ack_alarm: 'text-red-400 border-red-500/50 bg-red-950/90',
  query_history: 'text-violet-400 border-violet-500/50 bg-violet-950/90',
  raise_event: 'text-orange-400 border-orange-500/50 bg-orange-950/90',
  update_widget: 'text-pink-400 border-pink-500/50 bg-pink-950/90',
  update_faceplate: 'text-fuchsia-400 border-fuchsia-500/50 bg-fuchsia-950/90',
  start_sim: 'text-emerald-400 border-emerald-500/50 bg-emerald-950/90',
  stop_sim: 'text-rose-400 border-rose-500/50 bg-rose-950/90',
  log: 'text-sky-400 border-sky-500/50 bg-sky-950/90',
  comment: 'text-slate-400 border-slate-500/50 bg-slate-900/90',
  logical_group: 'text-slate-300 border-slate-500/50 bg-slate-900/90',
};

const NodeOverlayIcon: React.FC<{ type: string }> = ({ type }) => {
  const Icon = ICON_MAP[type];
  const colorClass = COLOR_MAP[type] || 'text-slate-400 border-slate-700 bg-slate-900/90';
  if (!Icon) return null;
  return (
    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shadow-md ${colorClass} industrial-overlay-badge bg-slate-950/95`}>
      <Icon className="w-3 h-3" />
    </div>
  );
};

export const BpmnCanvas: React.FC<BpmnCanvasProps> = ({ bpmnXml, onXmlChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<BpmnModeler | null>(null);
  const { theme } = useObjectModelStore();
  const { setSelectedNodeId, runValidation, selectedNodeId, activeFlowchart, setModelerInstance } = useFlowStore();

  const [canvasSearchQuery, setCanvasSearchQuery] = useState('');
  const [searchResultsCount, setSearchResultsCount] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; element: any } | null>(null);

  // Initialize BPMN Modeler
  useEffect(() => {
    if (!containerRef.current) return;

    const modeler = new BpmnModeler({
      container: containerRef.current,
      keyboard: { bindTo: document },
    });

    modelerRef.current = modeler;
    setModelerInstance(modeler);

    // Load initial XML & sync attributes
    if (bpmnXml) {
      modeler.importXML(bpmnXml).then(() => {
        const elementRegistry = modeler.get('elementRegistry');
        const modeling = modeler.get('modeling');
        let changed = false;
        
        elementRegistry.forEach((element: any) => {
          if (element.type === 'bpmn:Process') return;
          const storeMeta = useFlowStore.getState().activeFlowchart?.nodeMetadata?.[element.id];
          const hasAttr = element.businessObject?.$attrs?.['orquestra:metadata'];
          
          if (storeMeta && !hasAttr) {
            modeling.updateProperties(element, {
              'orquestra:metadata': JSON.stringify(storeMeta)
            });
            changed = true;
          }
        });
        
        if (changed) {
          modeler.saveXML({ format: true }).then(({ xml }: { xml: string }) => {
            if (onXmlChange) onXmlChange(xml);
          });
        }
      }).catch((err: any) => {
        console.error('Error loading BPMN XML:', err);
      });
    }

    // Event listeners
    const eventBus = modeler.get('eventBus');
    
    // Selection change
    eventBus.on('selection.changed', (e: any) => {
      const newSelection = e.newSelection || [];
      if (newSelection.length > 0) {
        setSelectedNodeId(newSelection[0].id);
      } else {
        setSelectedNodeId(null);
      }
    });

    // Handle contextmenu on elements and canvas
    eventBus.on('element.contextmenu', (e: any) => {
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();
      const isProcess = e.element.type === 'bpmn:Process';
      setContextMenu({
        x: e.originalEvent.clientX,
        y: e.originalEvent.clientY,
        element: isProcess ? null : e.element,
      });
    });

    eventBus.on('canvas.contextmenu', (e: any) => {
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();
      setContextMenu({
        x: e.originalEvent.clientX,
        y: e.originalEvent.clientY,
        element: null,
      });
    });

    // Sync label double-click updates back to metadata
    eventBus.on('element.changed', (e: any) => {
      const element = e.element;
      if (!element || element.type === 'bpmn:Process') return;
      
      const newName = element.businessObject?.name;
      if (newName !== undefined) {
        const metaStr = element.businessObject?.$attrs?.['orquestra:metadata'];
        let meta = null;
        if (metaStr) {
          try { meta = JSON.parse(metaStr); } catch (err) {}
        }
        
        if (meta && meta.name !== newName) {
          const updatedMeta = { ...meta, name: newName };
          element.businessObject.$attrs['orquestra:metadata'] = JSON.stringify(updatedMeta);
          
          // Force store update of metadata
          const currentFc = useFlowStore.getState().activeFlowchart;
          if (currentFc) {
            useFlowStore.getState().updateFlowchart(currentFc.id, {
              nodeMetadata: {
                ...(currentFc.nodeMetadata || {}),
                [element.id]: updatedMeta
              }
            });
          }
        }
      }
    });

    // Extract metadata from canvas elements and update store
    const extractMetadataFromCanvas = (modelerInst: BpmnModeler): Record<string, FlowNodeMetadata> => {
      const metadata: Record<string, FlowNodeMetadata> = {};
      const registry = modelerInst.get('elementRegistry');
      registry.forEach((element: any) => {
        if (element.type === 'bpmn:Process') return;
        const metaStr = element.businessObject?.$attrs?.['orquestra:metadata'];
        if (metaStr) {
          try {
            metadata[element.id] = JSON.parse(metaStr);
          } catch (err) {
            console.warn('Failed to parse metadata for element:', element.id, err);
          }
        }
      });
      return metadata;
    };

    // Diagram change (elements added, moved, deleted, updated)
    const handleDiagramChange = async () => {
      try {
        const { xml } = await modeler.saveXML({ format: true });
        const metadata = extractMetadataFromCanvas(modeler);
        
        const currentFc = useFlowStore.getState().activeFlowchart;
        if (currentFc) {
          useFlowStore.getState().updateFlowchart(currentFc.id, {
            bpmnXml: xml,
            nodeMetadata: metadata
          });
        }
        runValidation();
      } catch (err) {
        console.error('Failed to export BPMN XML:', err);
      }
    };

    eventBus.on('commandStack.changed', handleDiagramChange);

    return () => {
      modeler.destroy();
      setModelerInstance(null);
      modelerRef.current = null;
    };
  }, []); // Run once on mount

  // Sync overlays and markers
  useEffect(() => {
    const modeler = modelerRef.current;
    if (!modeler || !activeFlowchart) return;
    
    // Clear and redraw
    const overlaysModule = modeler.get('overlays');
    overlaysModule.remove({ type: 'industrial-badge' });
    
    const canvasModule = modeler.get('canvas');
    const elementRegistry = modeler.get('elementRegistry');
    
    elementRegistry.forEach((element: any) => {
      const id = element.id;
      const meta = activeFlowchart.nodeMetadata?.[id];
      
      const markersToRemove = [
        'industrial-node',
        'node-read-property', 'node-write-property', 'node-compare-variable', 'node-execute-script',
        'node-call-flowchart', 'node-delay', 'node-timer', 'node-wait-alarm', 'node-ack-alarm',
        'node-query-history', 'node-raise-event', 'node-update-widget', 'node-update-faceplate',
        'node-start-sim', 'node-stop-sim', 'node-execute-expression', 'node-log', 'node-comment', 'node-logical-group'
      ];
      markersToRemove.forEach(m => canvasModule.removeMarker(id, m));
      
      if (meta && meta.isIndustrialNode && meta.industrialType) {
        canvasModule.addMarker(id, 'industrial-node');
        canvasModule.addMarker(id, `node-${meta.industrialType.replace(/_/g, '-')}`);
        
        const overlayContainer = document.createElement('div');
        overlayContainer.className = 'industrial-overlay-badge';
        const root = ReactDOM.createRoot(overlayContainer);
        root.render(<NodeOverlayIcon type={meta.industrialType} />);
        
        overlaysModule.add(id, 'industrial-badge', {
          position: {
            top: -12,
            right: -12
          },
          html: overlayContainer
        });
      }

      // Apply custom colors from metadata directly to DOM elements
      const gfx = elementRegistry.getGraphics(id);
      if (gfx) {
        const shapeElements = gfx.querySelectorAll('.djs-visual rect, .djs-visual polygon, .djs-visual circle, .djs-visual path');
        const labelElements = gfx.querySelectorAll('.djs-label, text, .djs-label tspan');
        
        const strokeColor = meta?.borderColor || meta?.color;
        const fillColor = meta?.backgroundColor;
        const textColor = meta?.textColor;
        
        shapeElements.forEach((shape: any) => {
          // If it's a logical group, don't override fill with white/dark base color unless explicitly customized
          if (meta?.industrialType === 'logical_group' && !fillColor) {
            shape.style.removeProperty('fill');
          } else if (fillColor) {
            shape.style.setProperty('fill', fillColor, 'important');
          } else {
            shape.style.removeProperty('fill');
          }

          if (strokeColor) {
            shape.style.setProperty('stroke', strokeColor, 'important');
          } else {
            shape.style.removeProperty('stroke');
          }
        });

        labelElements.forEach((label: any) => {
          if (textColor) {
            label.style.setProperty('fill', textColor, 'important');
          } else {
            label.style.removeProperty('fill');
          }
        });
      }
    });
  }, [activeFlowchart?.nodeMetadata, theme]);

  // Update XML when prop changes from outside
  useEffect(() => {
    if (!modelerRef.current || !bpmnXml) return;

    modelerRef.current.saveXML({ format: true }).then(({ xml }: { xml: string }) => {
      if (xml !== bpmnXml) {
        modelerRef.current?.importXML(bpmnXml).catch((err: any) => {
          console.error('Error importing updated XML:', err);
        });
      }
    }).catch(() => {
      modelerRef.current?.importXML(bpmnXml);
    });
  }, [bpmnXml]);

  // Handle external node selection
  useEffect(() => {
    if (!modelerRef.current || !selectedNodeId) return;

    try {
      const elementRegistry = modelerRef.current.get('elementRegistry');
      const selection = modelerRef.current.get('selection');
      const canvas = modelerRef.current.get('canvas');

      const element = elementRegistry.get(selectedNodeId);
      if (element) {
        selection.select(element);
        canvas.scrollToElement(element);
      }
    } catch (err) {
      console.warn('Could not focus element on canvas:', selectedNodeId, err);
    }
  }, [selectedNodeId]);

  // Controls
  const handleZoomIn = () => {
    if (modelerRef.current) {
      const zoomScroll = modelerRef.current.get('zoomScroll');
      zoomScroll.stepZoom(1);
    }
  };

  const handleZoomOut = () => {
    if (modelerRef.current) {
      const zoomScroll = modelerRef.current.get('zoomScroll');
      zoomScroll.stepZoom(-1);
    }
  };

  const handleResetZoom = () => {
    if (modelerRef.current) {
      const canvas = modelerRef.current.get('canvas');
      canvas.zoom('fit-viewport');
    }
  };

  const handleUndo = () => {
    if (modelerRef.current) {
      const commandStack = modelerRef.current.get('commandStack');
      commandStack.undo();
    }
  };

  const handleRedo = () => {
    if (modelerRef.current) {
      const commandStack = modelerRef.current.get('commandStack');
      commandStack.redo();
    }
  };

  // Instant canvas element search
  const handleSearchCanvas = (query: string) => {
    setCanvasSearchQuery(query);
    if (!modelerRef.current || !query.trim()) {
      setSearchResultsCount(0);
      return;
    }

    const elementRegistry = modelerRef.current.get('elementRegistry');
    const selection = modelerRef.current.get('selection');
    const q = query.toLowerCase();

    const matches: any[] = [];
    elementRegistry.forEach((element: any) => {
      const label = (element.businessObject?.name || element.id || '').toLowerCase();
      if (label.includes(q) && element.type !== 'bpmn:Process') {
        matches.push(element);
      }
    });

    setSearchResultsCount(matches.length);

    if (matches.length > 0) {
      selection.select(matches);
      modelerRef.current.get('canvas').scrollToElement(matches[0]);
      setSelectedNodeId(matches[0].id);
    }
  };

  // Context Menu operations
  const createShapeAtCoords = (type: string, name: string) => {
    if (!modelerRef.current || !contextMenu) return;
    const modeler = modelerRef.current;
    const canvas = modeler.get('canvas');
    const elementFactory = modeler.get('elementFactory');
    const modeling = modeler.get('modeling');
    const parent = canvas.getRootElement();
    const viewbox = canvas.viewbox();
    
    const rect = containerRef.current!.getBoundingClientRect();
    const x = (contextMenu.x - rect.left - viewbox.x) / viewbox.scale;
    const y = (contextMenu.y - rect.top - viewbox.y) / viewbox.scale;
    
    const shape = elementFactory.createShape({ type });
    shape.businessObject.name = name;
    
    modeling.createShape(shape, { x, y }, parent);
  };

  const pasteElementAtCoords = () => {
    const { clipboard } = useFlowStore.getState();
    if (!clipboard || !modelerRef.current || !contextMenu) return;
    const modeler = modelerRef.current;
    const canvas = modeler.get('canvas');
    const elementFactory = modeler.get('elementFactory');
    const modeling = modeler.get('modeling');
    const parent = canvas.getRootElement();
    const viewbox = canvas.viewbox();
    
    const rect = containerRef.current!.getBoundingClientRect();
    const x = (contextMenu.x - rect.left - viewbox.x) / viewbox.scale;
    const y = (contextMenu.y - rect.top - viewbox.y) / viewbox.scale;
    
    const bpmnType = mapIndustrialTypeToBpmnType(clipboard.type as any) || clipboard.type;
    const shape = elementFactory.createShape({ type: bpmnType });
    shape.businessObject.name = clipboard.name;
    
    if (clipboard.metadata) {
      shape.businessObject.$attrs['orquestra:metadata'] = JSON.stringify({
        ...clipboard.metadata,
        id: undefined,
        name: clipboard.name
      });
    }
    
    modeling.createShape(shape, { x, y }, parent);
  };

  const copyElement = (element: any) => {
    const metaStr = element.businessObject?.$attrs?.['orquestra:metadata'];
    let metadata = null;
    if (metaStr) {
      try { metadata = JSON.parse(metaStr); } catch (e) {}
    }
    useFlowStore.getState().setClipboard({
      type: metadata?.industrialType || element.type,
      name: element.businessObject.name || element.id,
      metadata
    });
  };

  const cutElement = (element: any) => {
    copyElement(element);
    deleteElement(element);
  };

  const duplicateElement = (element: any) => {
    if (!modelerRef.current) return;
    const modeling = modelerRef.current.get('modeling');
    const elementFactory = modelerRef.current.get('elementFactory');
    const canvas = modelerRef.current.get('canvas');
    const parent = canvas.getRootElement();
    
    const x = element.x + 60;
    const y = element.y + 60;
    const name = element.businessObject.name ? `${element.businessObject.name} (Cópia)` : '';
    
    const shape = elementFactory.createShape({ type: element.type });
    shape.businessObject.name = name;
    
    const metaStr = element.businessObject.$attrs?.['orquestra:metadata'];
    if (metaStr) {
      try {
        const meta = JSON.parse(metaStr);
        shape.businessObject.$attrs['orquestra:metadata'] = JSON.stringify({
          ...meta,
          id: undefined,
          name
        });
      } catch (e) {}
    }
    
    modeling.createShape(shape, { x, y }, parent);
  };

  const deleteElement = (element: any) => {
    if (!modelerRef.current) return;
    const modeling = modelerRef.current.get('modeling');
    modeling.removeElements([element]);
  };

  const groupElement = (element: any) => {
    if (!modelerRef.current) return;
    const modeling = modelerRef.current.get('modeling');
    const elementFactory = modelerRef.current.get('elementFactory');
    const canvas = modelerRef.current.get('canvas');
    const parent = canvas.getRootElement();
    
    const padding = 20;
    const shape = elementFactory.createShape({
      type: 'bpmn:Group',
      width: element.width + padding * 2,
      height: element.height + padding * 2
    });
    
    modeling.createShape(shape, { x: element.x + element.width / 2, y: element.y + element.height / 2 }, parent);
  };

  const addCommentElement = (element: any) => {
    if (!modelerRef.current) return;
    const modeling = modelerRef.current.get('modeling');
    const elementFactory = modelerRef.current.get('elementFactory');
    const canvas = modelerRef.current.get('canvas');
    const parent = canvas.getRootElement();
    
    const textAnnotation = elementFactory.createShape({
      type: 'bpmn:TextAnnotation'
    });
    textAnnotation.businessObject.text = 'Anotação do processo';
    
    const annotationShape = modeling.createShape(textAnnotation, { x: element.x + element.width + 120, y: element.y }, parent);
    
    modeling.connect(element, annotationShape, {
      type: 'bpmn:Association'
    });
  };

  const getContextMenuItems = (element: any): ContextMenuItem[] => {
    const { clipboard } = useFlowStore.getState();
    
    if (!element) {
      return [
        {
          label: 'Inserir Evento Inicial',
          icon: <Plus className="w-3.5 h-3.5" />,
          action: () => createShapeAtCoords('bpmn:StartEvent', 'Início')
        },
        {
          label: 'Inserir Evento Final',
          icon: <Plus className="w-3.5 h-3.5" />,
          action: () => createShapeAtCoords('bpmn:EndEvent', 'Fim')
        },
        {
          label: 'Inserir Tarefa Padrão',
          icon: <Plus className="w-3.5 h-3.5" />,
          action: () => createShapeAtCoords('bpmn:Task', 'Nova Tarefa')
        },
        {
          label: 'Inserir Gateway Exclusivo',
          icon: <Plus className="w-3.5 h-3.5" />,
          action: () => createShapeAtCoords('bpmn:ExclusiveGateway', 'Decisão')
        },
        { divider: true },
        {
          label: 'Colar Elemento',
          icon: <Clipboard className="w-3.5 h-3.5" />,
          disabled: !clipboard,
          action: pasteElementAtCoords
        }
      ];
    }

    const isConnection = element.type === 'bpmn:SequenceFlow' || element.type === 'bpmn:Association';

    if (isConnection) {
      return [
        {
          label: 'Excluir Conexão',
          icon: <Trash2 className="w-3.5 h-3.5 text-rose-500" />,
          danger: true,
          action: () => deleteElement(element)
        }
      ];
    }

    return [
      {
        label: 'Copiar',
        icon: <Copy className="w-3.5 h-3.5" />,
        action: () => copyElement(element)
      },
      {
        label: 'Recortar',
        icon: <Trash2 className="w-3.5 h-3.5" />,
        action: () => cutElement(element)
      },
      {
        label: 'Duplicar',
        icon: <Copy className="w-3.5 h-3.5 text-emerald-400" />,
        action: () => duplicateElement(element)
      },
      { divider: true },
      {
        label: 'Agrupar Elemento',
        icon: <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />,
        action: () => groupElement(element)
      },
      {
        label: 'Adicionar Nota Explicativa',
        icon: <MessageSquare className="w-3.5 h-3.5 text-sky-400" />,
        action: () => addCommentElement(element)
      },
      { divider: true },
      {
        label: 'Excluir Elemento',
        icon: <Trash2 className="w-3.5 h-3.5 text-rose-500" />,
        danger: true,
        action: () => deleteElement(element)
      }
    ];
  };

  return (
    <div 
      className="relative flex-1 h-full w-full bg-slate-50 dark:bg-slate-900 overflow-hidden group select-none transition-colors duration-200"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const dataStr = e.dataTransfer.getData('application/react-flow-node');
        if (!dataStr || !modelerRef.current) return;
        
        try {
          const { type, label, extraMetadata } = JSON.parse(dataStr);
          const rect = containerRef.current!.getBoundingClientRect();
          const canvasModule = modelerRef.current.get('canvas');
          const viewbox = canvasModule.viewbox();
          
          const clientX = e.clientX - rect.left;
          const clientY = e.clientY - rect.top;
          
          const x = (clientX - viewbox.x) / viewbox.scale;
          const y = (clientY - viewbox.y) / viewbox.scale;
          
          useFlowStore.getState().addIndustrialNodeAtCoords(type, label, { x, y }, extraMetadata);
        } catch (err) {
          console.error('Failed to parse dropped data:', err);
        }
      }}
    >
      {/* Canvas Mount Target */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Floating Canvas Toolbar */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-white dark:bg-slate-800/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xl text-slate-700 dark:text-slate-300">
        {/* Search inside canvas */}
        <div className="relative flex items-center border-r border-slate-200 dark:border-slate-700/60 pr-2">
          <Search className="w-3.5 h-3.5 absolute left-2 text-slate-400" />
          <input
            type="text"
            value={canvasSearchQuery}
            onChange={(e) => handleSearchCanvas(e.target.value)}
            placeholder="Buscar elementos..."
            className="w-36 pl-7 pr-2 py-1 bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-200"
          />
          {searchResultsCount > 0 && (
            <span className="ml-1 text-[10px] font-mono font-bold bg-sky-500/20 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded">
              {searchResultsCount}
            </span>
          )}
        </div>

        <button
          onClick={handleUndo}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
          title="Desfazer (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>

        <button
          onClick={handleRedo}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
          title="Refazer (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700/60" />

        <button
          onClick={handleZoomIn}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
          title="Aumentar Zoom (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={handleZoomOut}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
          title="Diminuir Zoom (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={handleResetZoom}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
          title="Ajustar à Tela"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Canvas Watermark / Hint */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-white dark:bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/40 text-[11px] text-slate-500 dark:text-slate-400">
        <Sparkles className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 animate-pulse" />
        <span>Arraste nós da paleta lateral ou clique no canvas para adicionar conexões inteligentes BPMN 2.0</span>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems(contextMenu.element)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};
