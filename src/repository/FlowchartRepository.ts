import type {
  FlowchartEntity,
  FlowchartFolderEntity,
  FlowchartNodeEntity,
} from '../types/flow';
import { STORAGE_KEYS } from './storageKey';

const FLOW_KEY = STORAGE_KEYS.FLOWCHARTS;
const FOLDER_KEY = STORAGE_KEYS.FLOWCHART_FOLDERS;
const NODE_KEY = STORAGE_KEYS.FLOWCHART_NODES;

function loadFlowcharts(): FlowchartEntity[] {
  try {
    const raw = localStorage.getItem(FLOW_KEY);
    return raw ? (JSON.parse(raw) as FlowchartEntity[]) : [];
  } catch {
    return [];
  }
}

function saveFlowcharts(items: FlowchartEntity[]): void {
  localStorage.setItem(FLOW_KEY, JSON.stringify(items));
}

function loadFolders(): FlowchartFolderEntity[] {
  try {
    const raw = localStorage.getItem(FOLDER_KEY);
    return raw ? (JSON.parse(raw) as FlowchartFolderEntity[]) : [];
  } catch {
    return [];
  }
}

function saveFolders(items: FlowchartFolderEntity[]): void {
  localStorage.setItem(FOLDER_KEY, JSON.stringify(items));
}

function loadNodes(): FlowchartNodeEntity[] {
  try {
    const raw = localStorage.getItem(NODE_KEY);
    return raw ? (JSON.parse(raw) as FlowchartNodeEntity[]) : [];
  } catch {
    return [];
  }
}

function saveNodes(items: FlowchartNodeEntity[]): void {
  localStorage.setItem(NODE_KEY, JSON.stringify(items));
}

export const flowchartRepo = {
  getAll(): FlowchartEntity[] {
    return loadFlowcharts();
  },

  getById(id: string): FlowchartEntity | undefined {
    return loadFlowcharts().find((f) => f.id === id);
  },

  getByTarget(targetId: string): FlowchartEntity[] {
    return loadFlowcharts().filter((f) => f.targetId === targetId);
  },

  getGlobal(): FlowchartEntity[] {
    return loadFlowcharts().filter((f) => f.contextType === 'global');
  },

  create(flowchart: FlowchartEntity): void {
    const all = loadFlowcharts();
    all.push(flowchart);
    saveFlowcharts(all);
  },

  update(id: string, updates: Partial<FlowchartEntity>): void {
    const all = loadFlowcharts().map((f) =>
      f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f
    );
    saveFlowcharts(all);
  },

  delete(id: string): void {
    saveFlowcharts(loadFlowcharts().filter((f) => f.id !== id));
  },

  saveAll(flowcharts: FlowchartEntity[]): void {
    saveFlowcharts(flowcharts);
  },

  // Folders & Hierarchy Nodes
  getAllFolders(): FlowchartFolderEntity[] {
    return loadFolders();
  },

  saveFolders(folders: FlowchartFolderEntity[]): void {
    saveFolders(folders);
  },

  getAllNodes(): FlowchartNodeEntity[] {
    return loadNodes();
  },

  saveNodes(nodes: FlowchartNodeEntity[]): void {
    saveNodes(nodes);
  },
};
