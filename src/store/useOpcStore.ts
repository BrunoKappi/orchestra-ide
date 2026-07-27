import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import type { OpcNodeEntity, OpcDataType, OpcNodeType, OpcQuality } from '../types/opc';
import { opcRepo } from '../repository/OpcRepository';

interface OpcStoreState {
  nodes: OpcNodeEntity[];
  searchQuery: string;
  selectedNodeId: string | null;
  expandedNodeIds: string[];
  isSimulating: boolean;
  
  // Actions
  init: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  toggleFavorite: (id: string) => void;
  toggleNodeExpanded: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  
  // CRUD
  createNode: (params: {
    name: string;
    type: OpcNodeType;
    parentId: string | null;
    dataType?: OpcDataType;
    engineeringUnit?: string;
    updateFrequencyMs?: number;
    description?: string;
    value?: string;
  }) => string;
  updateNode: (id: string, updates: Partial<OpcNodeEntity>) => void;
  deleteNode: (id: string) => void;

  // Simulator
  toggleSimulation: (running?: boolean) => void;
  tickSimulation: () => void;
}

export const useOpcStore = create<OpcStoreState>()(
  immer((set, get) => ({
    nodes: [],
    searchQuery: '',
    selectedNodeId: null,
    expandedNodeIds: [],
    isSimulating: true,

    init: () => {
      const data = opcRepo.getAll();
      set((state) => {
        state.nodes = data;
        // Expand root servers by default
        state.expandedNodeIds = data
          .filter((n) => n.type === 'server_ua' || n.type === 'server_da')
          .map((n) => n.id);
      });
    },

    setSearchQuery: (query) => {
      set((state) => {
        state.searchQuery = query;
      });
    },

    setSelectedNodeId: (id) => {
      set((state) => {
        state.selectedNodeId = id;
      });
    },

    toggleFavorite: (id) => {
      set((state) => {
        const node = state.nodes.find((n) => n.id === id);
        if (node) {
          node.isFavorite = !node.isFavorite;
          opcRepo.save(node);
        }
      });
    },

    toggleNodeExpanded: (id) => {
      set((state) => {
        const index = state.expandedNodeIds.indexOf(id);
        if (index >= 0) {
          state.expandedNodeIds.splice(index, 1);
        } else {
          state.expandedNodeIds.push(id);
        }
      });
    },

    expandAll: () => {
      set((state) => {
        state.expandedNodeIds = state.nodes
          .filter((n) => n.type !== 'tag')
          .map((n) => n.id);
      });
    },

    collapseAll: () => {
      set((state) => {
        state.expandedNodeIds = [];
      });
    },

    createNode: (params) => {
      const id = uuidv4();
      
      // Build full path
      let parentPath = '';
      if (params.parentId) {
        const parent = get().nodes.find((n) => n.id === params.parentId);
        if (parent) {
          parentPath = parent.path + '.';
        }
      }
      const path = parentPath + params.name;

      const newNode: OpcNodeEntity = {
        id,
        name: params.name,
        type: params.type,
        parentId: params.parentId,
        path,
        dataType: params.dataType,
        value: params.value ?? (params.type === 'tag' ? '0' : undefined),
        quality: params.type === 'tag' ? 'Good' : undefined,
        timestamp: params.type === 'tag' ? new Date().toISOString() : undefined,
        engineeringUnit: params.engineeringUnit,
        updateFrequencyMs: params.updateFrequencyMs ?? 1000,
        description: params.description,
        isFavorite: false,
      };

      set((state) => {
        state.nodes.push(newNode);
        // Automatically expand the parent
        if (params.parentId && !state.expandedNodeIds.includes(params.parentId)) {
          state.expandedNodeIds.push(params.parentId);
        }
      });

      opcRepo.save(newNode);
      return id;
    },

    updateNode: (id, updates) => {
      set((state) => {
        const index = state.nodes.findIndex((n) => n.id === id);
        if (index >= 0) {
          state.nodes[index] = { ...state.nodes[index], ...updates };
          opcRepo.save(state.nodes[index]);
        }
      });
    },

    deleteNode: (id) => {
      set((state) => {
        const index = state.nodes.findIndex((n) => n.id === id);
        if (index >= 0) {
          state.nodes.splice(index, 1);
        }
        // Also delete children from expanded ids if deleted
        const childrenToDelete = getChildrenIdsRecursive(get().nodes, id);
        state.expandedNodeIds = state.expandedNodeIds.filter(
          (expandedId) => expandedId !== id && !childrenToDelete.has(expandedId)
        );
        state.nodes = state.nodes.filter((n) => !childrenToDelete.has(n.id));
      });
      opcRepo.delete(id);
    },

    toggleSimulation: (running) => {
      set((state) => {
        state.isSimulating = running ?? !state.isSimulating;
      });
    },

    tickSimulation: () => {
      if (!get().isSimulating) return;

      set((state) => {
        const nowStr = new Date().toISOString();
        state.nodes.forEach((node) => {
          if (node.type !== 'tag') return;

          // Simulate value change based on datatype
          let currentVal = node.value ?? '0';
          let nextVal = currentVal;
          const randomFactor = Math.random();

          // 1. Simulate Quality Changes (92% Good, 4% Uncertain, 2% Bad, 2% Comm Lost)
          let quality: OpcQuality = 'Good';
          if (randomFactor > 0.98) {
            quality = 'Communication Lost';
          } else if (randomFactor > 0.96) {
            quality = 'Bad';
          } else if (randomFactor > 0.92) {
            quality = 'Uncertain';
          }

          if (quality === 'Communication Lost') {
            node.quality = quality;
            node.timestamp = nowStr;
            return;
          }

          // 2. Simulate Value Variations
          if (node.dataType === 'Float') {
            const currentNum = parseFloat(currentVal) || 0;
            // Add a small random walk
            const noise = (Math.random() - 0.5) * 1.5;
            nextVal = (currentNum + noise).toFixed(2);
            
            // Limit checks to keep values realistic
            const val = parseFloat(nextVal);
            if (node.name.includes('TEMP') || node.name.includes('TE')) {
              if (val < 10) nextVal = '10.00';
              if (val > 250) nextVal = '250.00';
            } else if (node.name.includes('PRES') || node.name.includes('PT')) {
              if (val < 0) nextVal = '0.00';
              if (val > 20) nextVal = '20.00';
            } else if (node.name.includes('LVL') || node.name.includes('LT')) {
              if (val < 0) nextVal = '0.00';
              if (val > 100) nextVal = '100.00';
            }
          } else if (node.dataType === 'Integer') {
            const currentNum = parseInt(currentVal, 10) || 0;
            const step = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
            nextVal = Math.max(0, currentNum + step).toString();
          } else if (node.dataType === 'Boolean') {
            // Toggles boolean values once in a while
            if (Math.random() > 0.95) {
              nextVal = currentVal === 'true' ? 'false' : 'true';
            }
          } else if (node.dataType === 'String') {
            if (node.name.includes('XV') || node.name.includes('VALVE')) {
              if (Math.random() > 0.98) {
                const states = ['OPEN', 'CLOSED', 'TRAVELING'];
                const currentIdx = states.indexOf(currentVal);
                const nextIdx = (currentIdx + 1) % states.length;
                nextVal = states[nextIdx];
              }
            } else if (node.name.includes('PMP') || node.name.includes('PUMP')) {
              if (Math.random() > 0.98) {
                nextVal = currentVal === 'RUNNING' ? 'STOPPED' : 'RUNNING';
              }
            }
          }

          node.value = nextVal;
          node.quality = quality;
          node.timestamp = nowStr;
        });
      });
    },
  }))
);

function getChildrenIdsRecursive(nodes: OpcNodeEntity[], parentId: string): Set<string> {
  const children = new Set<string>();
  let added = true;
  while (added) {
    added = false;
    for (const node of nodes) {
      if (node.parentId === parentId || (node.parentId && children.has(node.parentId))) {
        if (!children.has(node.id)) {
          children.add(node.id);
          added = true;
        }
      }
    }
  }
  return children;
}
