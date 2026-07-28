import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import type {
  FlowchartEntity,
  FlowchartFolderEntity,
  FlowchartNodeEntity,
  FlowNodeMetadata,
  FlowValidationProblem,
  FlowContextType,
  IndustrialNodeType,
} from '../types/flow';
import { flowchartRepo } from '../repository/FlowchartRepository';
import { FlowValidationEngine } from '../services/FlowValidationEngine';
import { propertyRepo } from '../repository/PropertyRepository';
import { useObjectModelStore } from './useObjectModelStore';

export const mapIndustrialTypeToBpmnType = (type: IndustrialNodeType): string => {
  switch (type) {
    case 'compare_variable':
      return 'bpmn:ExclusiveGateway';
    case 'call_flowchart':
      return 'bpmn:CallActivity';
    case 'delay':
    case 'timer':
    case 'wait_alarm':
      return 'bpmn:IntermediateCatchEvent';
    case 'raise_event':
      return 'bpmn:IntermediateThrowEvent';
    case 'comment':
      return 'bpmn:TextAnnotation';
    case 'logical_group':
      return 'bpmn:Group';
    default:
      return 'bpmn:Task';
  }
};

import { seedService } from '../services/SeedService';

interface FlowStoreState {
  flowcharts: FlowchartEntity[];
  folders: FlowchartFolderEntity[];
  nodes: FlowchartNodeEntity[];

  // Active Flowchart Editor State
  isDesignerOpen: boolean;
  isDesignerV2Open: boolean;
  activeFlowchart: FlowchartEntity | null;
  selectedNodeId: string | null;
  selectedNodeMeta: FlowNodeMetadata | null;
  problems: FlowValidationProblem[];
  isProblemsPanelOpen: boolean;
  
  // Property Creation prompt
  propertyPrompt: {
    isOpen: boolean;
    propertyId: string;
    propertyName: string;
    coords?: { x: number; y: number };
  } | null;
  showPropertyPrompt: (id: string, name: string, coords?: { x: number; y: number }) => void;
  resolvePropertyPrompt: (action: 'read' | 'write') => void;
  closePropertyPrompt: () => void;

  // Search & Filter
  searchQuery: string;
  selectedCategory: string | null;
  selectedContext: 'all' | FlowContextType;
  selectedTag: string | null;

  // Modeler reference & Clipboard
  modelerInstance: any | null;
  setModelerInstance: (modeler: any | null) => void;
  clipboard: { type: string; name: string; metadata: FlowNodeMetadata | null } | null;
  setClipboard: (item: { type: string; name: string; metadata: FlowNodeMetadata | null } | null) => void;

  // Modeler Operations
  addIndustrialNode: (type: IndustrialNodeType, label: string, extraMetadata?: Partial<FlowNodeMetadata>) => void;
  addIndustrialNodeAtCoords: (type: IndustrialNodeType, label: string, coords: { x: number; y: number }, extraMetadata?: Partial<FlowNodeMetadata>) => void;

  // Actions
  init: () => void;
  clearAllData: () => void;
  openDesigner: (flowchartId: string) => void;
  closeDesigner: () => void;
  openDesignerV2: (flowchartId: string) => void;
  closeDesignerV2: () => void;
  updateActiveXyflowData: (data: any) => void;
  createFlowchart: (
    name: string,
    description: string,
    contextType: FlowContextType,
    targetId?: string | null,
    category?: string,
    tags?: string[]
  ) => FlowchartEntity;
  updateFlowchart: (id: string, updates: Partial<FlowchartEntity>) => void;
  deleteFlowchart: (id: string) => void;
  duplicateFlowchart: (id: string) => FlowchartEntity | null;
  importFlowchartJson: (jsonString: string) => FlowchartEntity | null;
  exportFlowchartJson: (id: string) => string;
  
  // Node Selection & Editing
  setSelectedNodeId: (nodeId: string | null) => void;
  updateNodeMetadata: (nodeId: string, updates: Partial<FlowNodeMetadata>) => void;
  
  // BPMN XML Update
  updateActiveBpmnXml: (xml: string) => void;
  
  // Validation
  runValidation: () => void;
  toggleProblemsPanel: () => void;

  // Search & Filter Setters
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (cat: string | null) => void;
  setSelectedContext: (ctx: 'all' | FlowContextType) => void;
  setSelectedTag: (tag: string | null) => void;
}

const DEFAULT_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Início">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Nova Tarefa">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="Fim">
      <bpmn:incoming>Flow_2</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="150" y="100" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_Task_1" bpmnElement="Task_1">
        <dc:Bounds x="240" y="78" width="160" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_EndEvent_1" bpmnElement="EndEvent_1">
        <dc:Bounds x="460" y="100" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Edge_Flow_1" bpmnElement="Flow_1">
        <di:waypoint x="186" y="118" />
        <di:waypoint x="240" y="118" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_Flow_2" bpmnElement="Flow_2">
        <di:waypoint x="400" y="118" />
        <di:waypoint x="460" y="118" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

export const useFlowStore = create<FlowStoreState>()(
  immer((set, get) => ({
    flowcharts: [],
    folders: [],
    nodes: [],

    isDesignerOpen: false,
    isDesignerV2Open: false,
    activeFlowchart: null,
    selectedNodeId: null,
    selectedNodeMeta: null,
    problems: [],
    isProblemsPanelOpen: false,
    propertyPrompt: null,

    showPropertyPrompt: (id, name, coords) => {
      set((state) => {
        state.propertyPrompt = { isOpen: true, propertyId: id, propertyName: name, coords };
      });
    },

    resolvePropertyPrompt: (action) => {
      const prompt = get().propertyPrompt;
      if (!prompt) return;
      const { propertyId, propertyName, coords } = prompt;

      if (action === 'read') {
        const label = `Ler ${propertyName}`;
        const meta = { targetPropertyId: propertyId, targetPropertyName: propertyName };
        if (coords) {
          get().addIndustrialNodeAtCoords('read_property', label, coords, meta);
        } else {
          get().addIndustrialNode('read_property', label, meta);
        }
      } else {
        const label = `Escrever ${propertyName}`;
        const meta = {
          targetPropertyId: propertyId,
          targetPropertyName: propertyName,
          assignment: {
            targetProperty: propertyName,
            sourceType: 'constant' as const,
            sourceValue: ''
          }
        };
        if (coords) {
          get().addIndustrialNodeAtCoords('write_property', label, coords, meta);
        } else {
          get().addIndustrialNode('write_property', label, meta);
        }
      }

      set((state) => {
        state.propertyPrompt = null;
      });
    },

    closePropertyPrompt: () => {
      set((state) => {
        state.propertyPrompt = null;
      });
    },

    searchQuery: '',
    selectedCategory: null,
    selectedContext: 'all',
    selectedTag: null,

    modelerInstance: null,
    setModelerInstance: (modeler) => {
      set((state) => {
        state.modelerInstance = modeler;
      });
    },
    clipboard: null,
    setClipboard: (item) => {
      set((state) => {
        state.clipboard = item;
      });
    },

    addIndustrialNode: (type, label, extraMetadata) => {
      const modeler = get().modelerInstance;
      if (!modeler) return;

      try {
        const elementFactory = modeler.get('elementFactory');
        const modeling = modeler.get('modeling');
        const canvas = modeler.get('canvas');
        const parent = canvas.getRootElement();
        const viewbox = canvas.viewbox();

        // Position at center of screen
        const x = viewbox.x + viewbox.width / 2;
        const y = viewbox.y + viewbox.height / 2;

        const bpmnType = mapIndustrialTypeToBpmnType(type);
        const shape = elementFactory.createShape({ type: bpmnType });
        shape.businessObject.name = label;

        const createdShape = modeling.createShape(shape, { x, y }, parent);
        const nodeId = createdShape.id;

        const defaultMeta: FlowNodeMetadata = {
          id: nodeId,
          name: label,
          isIndustrialNode: true,
          industrialType: type,
          ...extraMetadata
        };

        modeling.updateProperties(createdShape, {
          'orquestra:metadata': JSON.stringify(defaultMeta)
        });

        set((state) => {
          state.selectedNodeId = nodeId;
          state.selectedNodeMeta = defaultMeta;
        });

      } catch (err) {
        console.error('Failed to add industrial node:', err);
      }
    },

    addIndustrialNodeAtCoords: (type, label, coords, extraMetadata) => {
      const modeler = get().modelerInstance;
      if (!modeler) return;

      try {
        const elementFactory = modeler.get('elementFactory');
        const modeling = modeler.get('modeling');
        const canvas = modeler.get('canvas');
        const parent = canvas.getRootElement();

        const bpmnType = mapIndustrialTypeToBpmnType(type);
        const shape = elementFactory.createShape({ type: bpmnType });
        shape.businessObject.name = label;

        const createdShape = modeling.createShape(shape, coords, parent);
        const nodeId = createdShape.id;

        const defaultMeta: FlowNodeMetadata = {
          id: nodeId,
          name: label,
          isIndustrialNode: true,
          industrialType: type,
          ...extraMetadata
        };

        modeling.updateProperties(createdShape, {
          'orquestra:metadata': JSON.stringify(defaultMeta)
        });

        set((state) => {
          state.selectedNodeId = nodeId;
          state.selectedNodeMeta = defaultMeta;
        });

      } catch (err) {
        console.error('Failed to add industrial node at coordinates:', err);
      }
    },

    init: () => {
      // Initialize object model store to load templates, objects, properties, and scripts
      useObjectModelStore.getState().init();

      let allFlows = flowchartRepo.getAll();
      if (!allFlows || allFlows.length === 0) {
        seedService.seedInitialDataIfNeeded();
        allFlows = flowchartRepo.getAll();
      }
      const allFolders = flowchartRepo.getAllFolders();
      const allNodes = flowchartRepo.getAllNodes();

      set((state) => {
        state.flowcharts = allFlows;
        state.folders = allFolders;
        state.nodes = allNodes;
      });
    },

    clearAllData: () => {
      flowchartRepo.saveAll([]);
      flowchartRepo.saveFolders([]);
      flowchartRepo.saveNodes([]);
      set((state) => {
        state.flowcharts = [];
        state.folders = [];
        state.nodes = [];
        state.activeFlowchart = null;
        state.selectedNodeId = null;
        state.selectedNodeMeta = null;
        state.problems = [];
      });
    },

    openDesigner: (flowchartId: string) => {
      let flows = get().flowcharts;
      if (!flows || flows.length === 0) {
        get().init();
        flows = get().flowcharts;
      }

      let fc = flows.find((f) => f.id === flowchartId);
      if (!fc) {
        const repoFc = flowchartRepo.getById(flowchartId);
        if (repoFc) {
          fc = repoFc;
          set((state) => {
            if (!state.flowcharts.some((f) => f.id === repoFc.id)) {
              state.flowcharts.push(repoFc);
            }
          });
        }
      }

      if (!fc) {
        console.warn(`[useFlowStore] Flowchart not found for id: ${flowchartId}`);
        return;
      }

      set((state) => {
        state.activeFlowchart = fc;
        state.isDesignerOpen = true;
        state.selectedNodeId = null;
        state.selectedNodeMeta = null;
      });

      get().runValidation();
    },

    closeDesigner: () => {
      set((state) => {
        state.isDesignerOpen = false;
        state.activeFlowchart = null;
        state.selectedNodeId = null;
        state.selectedNodeMeta = null;
        state.problems = [];
        state.modelerInstance = null;
      });
    },

    openDesignerV2: (flowchartId: string) => {
      let flows = get().flowcharts;
      if (!flows || flows.length === 0) {
        get().init();
        flows = get().flowcharts;
      }

      let fc = flows.find((f) => f.id === flowchartId);
      if (!fc) {
        const repoFc = flowchartRepo.getById(flowchartId);
        if (repoFc) {
          fc = repoFc;
          set((state) => {
            if (!state.flowcharts.some((f) => f.id === repoFc.id)) {
              state.flowcharts.push(repoFc);
            }
          });
        }
      }

      if (!fc) return;

      set((state) => {
        state.activeFlowchart = fc;
        state.isDesignerV2Open = true;
        state.selectedNodeId = null;
        state.selectedNodeMeta = null;
      });

      get().runValidation();
    },

    closeDesignerV2: () => {
      set((state) => {
        state.isDesignerV2Open = false;
        state.activeFlowchart = null;
        state.selectedNodeId = null;
        state.selectedNodeMeta = null;
        state.problems = [];
      });
    },

    updateActiveXyflowData: (data: any) => {
      const active = get().activeFlowchart;
      if (!active) return;

      get().updateFlowchart(active.id, { xyflowData: data });
    },

    createFlowchart: (name, description, contextType, targetId = null, category = 'Processos', tags = []) => {
      const now = new Date().toISOString();
      const newFc: FlowchartEntity = {
        id: uuidv4(),
        name,
        description,
        category: category || 'Processos',
        tags: tags || [],
        version: '1.0.0',
        author: 'Usuário Orquestra',
        contextType,
        targetId: targetId || null,
        folderId: null,
        bpmnXml: DEFAULT_BPMN_XML,
        nodeMetadata: {},
        createdAt: now,
        updatedAt: now,
      };

      flowchartRepo.create(newFc);

      set((state) => {
        state.flowcharts.push(newFc);
      });

      return newFc;
    },

    updateFlowchart: (id, updates) => {
      flowchartRepo.update(id, updates);

      set((state) => {
        const idx = state.flowcharts.findIndex((f) => f.id === id);
        if (idx !== -1) {
          state.flowcharts[idx] = {
            ...state.flowcharts[idx],
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        }

        if (state.activeFlowchart?.id === id) {
          state.activeFlowchart = {
            ...state.activeFlowchart,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        }
      });

      get().runValidation();
    },

    deleteFlowchart: (id) => {
      flowchartRepo.delete(id);

      set((state) => {
        state.flowcharts = state.flowcharts.filter((f) => f.id !== id);
        if (state.activeFlowchart?.id === id) {
          state.isDesignerOpen = false;
          state.activeFlowchart = null;
        }
      });
    },

    duplicateFlowchart: (id) => {
      const source = get().flowcharts.find((f) => f.id === id);
      if (!source) return null;

      const now = new Date().toISOString();
      const duplicate: FlowchartEntity = {
        ...source,
        id: uuidv4(),
        name: `${source.name} (Cópia)`,
        createdAt: now,
        updatedAt: now,
      };

      flowchartRepo.create(duplicate);

      set((state) => {
        state.flowcharts.push(duplicate);
      });

      return duplicate;
    },

    importFlowchartJson: (jsonString) => {
      try {
        const data = JSON.parse(jsonString) as FlowchartEntity;
        if (!data.name || !data.bpmnXml) return null;

        const now = new Date().toISOString();
        const imported: FlowchartEntity = {
          ...data,
          id: uuidv4(),
          name: `${data.name} (Importado)`,
          createdAt: now,
          updatedAt: now,
        };

        flowchartRepo.create(imported);

        set((state) => {
          state.flowcharts.push(imported);
        });

        return imported;
      } catch {
        return null;
      }
    },

    exportFlowchartJson: (id) => {
      const fc = get().flowcharts.find((f) => f.id === id);
      if (!fc) return '';
      return JSON.stringify(fc, null, 2);
    },

    setSelectedNodeId: (nodeId) => {
      set((state) => {
        state.selectedNodeId = nodeId;
        if (nodeId && state.activeFlowchart?.nodeMetadata?.[nodeId]) {
          state.selectedNodeMeta = state.activeFlowchart.nodeMetadata[nodeId];
        } else if (nodeId) {
          // Initialize empty metadata entry if none exists yet
          const defaultMeta: FlowNodeMetadata = {
            id: nodeId,
            name: nodeId,
          };
          state.selectedNodeMeta = defaultMeta;
        } else {
          state.selectedNodeMeta = null;
        }
      });
    },

    updateNodeMetadata: (nodeId, updates) => {
      const active = get().activeFlowchart;
      if (!active) return;

      const currentMeta: FlowNodeMetadata = active.nodeMetadata?.[nodeId] || { id: nodeId, name: nodeId };
      const updatedMeta: FlowNodeMetadata = { ...currentMeta, ...updates };

      const updatedNodeMetadata = {
        ...(active.nodeMetadata || {}),
        [nodeId]: updatedMeta,
      };

      const modeler = get().modelerInstance;
      if (modeler) {
        try {
          const elementRegistry = modeler.get('elementRegistry');
          const modeling = modeler.get('modeling');
          const element = elementRegistry.get(nodeId);
          if (element) {
            modeling.updateProperties(element, {
              name: updates.name !== undefined ? updates.name : (element.businessObject.name || nodeId),
              'orquestra:metadata': JSON.stringify(updatedMeta)
            });

            const strokeColor = updatedMeta.borderColor !== undefined ? updatedMeta.borderColor : updatedMeta.color;
            const fillColor = updatedMeta.backgroundColor;
            if (strokeColor !== undefined || fillColor !== undefined) {
              const isDark = useObjectModelStore.getState().theme === 'dark';
              modeling.setColor(element, {
                fill: fillColor || (isDark ? '#111827' : '#ffffff'),
                stroke: strokeColor || (isDark ? '#334155' : '#cbd5e1')
              });
            }
            return;
          }
        } catch (e) {
          console.warn('Failed to update node in modeler:', e);
        }
      }

      get().updateFlowchart(active.id, {
        nodeMetadata: updatedNodeMetadata,
      });

      set((state) => {
        if (state.selectedNodeId === nodeId) {
          state.selectedNodeMeta = updatedMeta;
        }
      });
    },

    updateActiveBpmnXml: (xml) => {
      const active = get().activeFlowchart;
      if (!active) return;

      get().updateFlowchart(active.id, { bpmnXml: xml });
    },

    runValidation: () => {
      const active = get().activeFlowchart;
      if (!active) {
        set((state) => {
          state.problems = [];
        });
        return;
      }

      // Fetch available properties for target entity if bound
      let availableProperties = propertyRepo.getAll();
      if (active.targetId) {
        availableProperties = propertyRepo.getByTargetId(active.targetId);
      }

      const probs = FlowValidationEngine.validate(active, availableProperties);

      set((state) => {
        state.problems = probs;
      });
    },

    toggleProblemsPanel: () => {
      set((state) => {
        state.isProblemsPanelOpen = !state.isProblemsPanelOpen;
      });
    },

    setSearchQuery: (query) => {
      set((state) => {
        state.searchQuery = query;
      });
    },

    setSelectedCategory: (cat) => {
      set((state) => {
        state.selectedCategory = cat;
      });
    },

    setSelectedContext: (ctx) => {
      set((state) => {
        state.selectedContext = ctx;
      });
    },

    setSelectedTag: (tag) => {
      set((state) => {
        state.selectedTag = tag;
      });
    },
  }))
);
