import type { ScreenFolderEntity, ScreenNodeEntity } from '../types/domain';
import { STORAGE_KEYS } from './storageKey';

const FOLDER_KEY = STORAGE_KEYS.SCREEN_FOLDERS;
const NODE_KEY = STORAGE_KEYS.SCREEN_NODES;

function loadFolders(): ScreenFolderEntity[] {
  try {
    const raw = localStorage.getItem(FOLDER_KEY);
    return raw ? (JSON.parse(raw) as ScreenFolderEntity[]) : [];
  } catch {
    return [];
  }
}

function saveFolders(items: ScreenFolderEntity[]): void {
  localStorage.setItem(FOLDER_KEY, JSON.stringify(items));
}

function loadNodes(): ScreenNodeEntity[] {
  try {
    const raw = localStorage.getItem(NODE_KEY);
    return raw ? (JSON.parse(raw) as ScreenNodeEntity[]) : [];
  } catch {
    return [];
  }
}

function saveNodes(items: ScreenNodeEntity[]): void {
  localStorage.setItem(NODE_KEY, JSON.stringify(items));
}

export const screenFolderRepo = {
  getAllFolders(): ScreenFolderEntity[] {
    return loadFolders();
  },

  createFolder(folder: ScreenFolderEntity): void {
    const all = loadFolders();
    all.push(folder);
    saveFolders(all);
  },

  updateFolder(id: string, updates: Partial<ScreenFolderEntity>): void {
    const all = loadFolders().map((f) =>
      f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f
    );
    saveFolders(all);
  },

  deleteFolder(id: string): void {
    saveFolders(loadFolders().filter((f) => f.id !== id));
  },

  getAllNodes(): ScreenNodeEntity[] {
    return loadNodes();
  },

  createNode(node: ScreenNodeEntity): void {
    const all = loadNodes();
    all.push(node);
    saveNodes(all);
  },

  updateNode(id: string, updates: Partial<ScreenNodeEntity>): void {
    const all = loadNodes().map((n) =>
      n.id === id ? { ...n, ...updates } : n
    );
    saveNodes(all);
  },

  deleteNode(id: string): void {
    saveNodes(loadNodes().filter((n) => n.id !== id));
  },

  deleteNodeByTargetId(targetId: string): void {
    saveNodes(loadNodes().filter((n) => n.targetId !== targetId));
  },

  saveAllFolders(folders: ScreenFolderEntity[]): void {
    saveFolders(folders);
  },

  saveAllNodes(nodes: ScreenNodeEntity[]): void {
    saveNodes(nodes);
  },
};
