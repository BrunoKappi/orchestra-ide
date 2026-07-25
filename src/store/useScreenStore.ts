import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import type {
  ScreenEntity,
  ScreenElement,
  ScreenElementType,
  ScreenFolderEntity,
  ScreenNodeEntity,
  ScreenTreeNode,
} from '../types/domain';
import { screenRepo } from '../repository/ScreenRepository';
import { screenFolderRepo } from '../repository/ScreenFolderRepository';

export type ScreenToolType =
  | 'select'
  | 'rectangle'
  | 'circle'
  | 'text'
  | 'line'
  | 'image';

interface ScreenStoreState {
  screens: ScreenEntity[];
  folders: ScreenFolderEntity[];
  nodes: ScreenNodeEntity[];
  searchQuery: string;

  selectedScreenId: string | null;
  selectedScreen: ScreenEntity | null;
  selectedElementId: string | null;

  activeTool: ScreenToolType;
  isGridEnabled: boolean;
  snapToGrid: boolean;
  zoom: number;
  hasUnsavedChanges: boolean;

  // Global Actions
  init: () => void;
  setSearchQuery: (q: string) => void;
  setActiveTool: (tool: ScreenToolType) => void;
  setIsGridEnabled: (v: boolean) => void;
  setSnapToGrid: (v: boolean) => void;
  setZoom: (z: number) => void;

  // Screen selection & editor
  selectScreen: (id: string | null) => void;
  closeScreen: () => void;
  saveCurrentScreen: () => void;
  saveAndCloseScreen: () => void;

  // Screen CRUD
  createScreen: (name?: string, folderId?: string | null) => string;
  renameScreen: (id: string, newName: string) => void;
  duplicateScreen: (id: string) => string;
  deleteScreen: (id: string) => void;
  updateScreenMeta: (id: string, updates: Partial<Pick<ScreenEntity, 'name' | 'description' | 'canvasWidth' | 'canvasHeight' | 'backgroundColor' | 'gridSize'>>) => void;

  // Folder CRUD
  createFolder: (name?: string, parentFolderId?: string | null) => string;
  renameFolder: (id: string, newName: string) => void;
  deleteFolder: (id: string) => void;
  moveScreenToFolder: (screenId: string, parentFolderId: string | null) => void;

  // Element Actions
  selectElement: (elementId: string | null) => void;
  addElement: (type: ScreenElementType, x: number, y: number) => void;
  addWidgetInstance: (objectId: string | undefined, widgetId: string, x: number, y: number) => void;
  addVariableRef: (objectId: string, propertyName: string, x: number, y: number) => void;
  addImageElement: (imageUri: string, x: number, y: number) => void;
  addLineElement: (fromX: number, fromY: number, toX: number, toY: number) => void;
  updateElement: (elementId: string, updates: Partial<ScreenElement>) => void;
  deleteElement: (elementId: string) => void;
  duplicateElement: (elementId: string) => void;
  reorderElementZ: (elementId: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;

  // Computed
  getScreenTree: () => ScreenTreeNode[];
}

const DEFAULT_CANVAS_WIDTH = 1280;
const DEFAULT_CANVAS_HEIGHT = 720;

function buildTree(
  nodes: ScreenNodeEntity[],
  folders: ScreenFolderEntity[],
  screens: ScreenEntity[],
  parentFolderId: string | null = null
): ScreenTreeNode[] {
  const folderNodes = nodes
    .filter((n) => n.type === 'folder' && n.parentFolderId === parentFolderId)
    .sort((a, b) => a.order - b.order)
    .map((n) => {
      const folder = folders.find((f) => f.id === n.targetId);
      return {
        id: n.id,
        name: folder?.name ?? 'Unknown',
        type: 'folder' as const,
        targetId: n.targetId,
        parentFolderId: n.parentFolderId,
        order: n.order,
        children: buildTree(nodes, folders, screens, n.targetId),
      };
    });

  const screenNodes = nodes
    .filter((n) => n.type === 'screen' && n.parentFolderId === parentFolderId)
    .sort((a, b) => a.order - b.order)
    .map((n) => {
      const screen = screens.find((s) => s.id === n.targetId);
      return {
        id: n.id,
        name: screen?.name ?? 'Unknown',
        type: 'screen' as const,
        targetId: n.targetId,
        parentFolderId: n.parentFolderId,
        order: n.order,
        children: [],
        screenDetail: screen,
      };
    });

  return [...folderNodes, ...screenNodes];
}

export const useScreenStore = create<ScreenStoreState>()(
  immer((set, get) => ({
    screens: [],
    folders: [],
    nodes: [],
    searchQuery: '',
    selectedScreenId: null,
    selectedScreen: null,
    selectedElementId: null,
    activeTool: 'select',
    isGridEnabled: true,
    snapToGrid: true,
    zoom: 1,
    hasUnsavedChanges: false,

    init() {
      const screens = screenRepo.getAll();
      const folders = screenFolderRepo.getAllFolders();
      const nodes = screenFolderRepo.getAllNodes();
      set((s) => {
        s.screens = screens;
        s.folders = folders;
        s.nodes = nodes;
      });
    },

    setSearchQuery: (q) => set((s) => { s.searchQuery = q; }),
    setActiveTool: (tool) => set((s) => { s.activeTool = tool; }),
    setIsGridEnabled: (v) => set((s) => { s.isGridEnabled = v; }),
    setSnapToGrid: (v) => set((s) => { s.snapToGrid = v; }),
    setZoom: (z) => set((s) => { s.zoom = Math.min(3, Math.max(0.25, z)); }),

    selectScreen(id) {
      const screen = get().screens.find((s) => s.id === id) ?? null;
      set((s) => {
        s.selectedScreenId = id;
        s.selectedScreen = screen;
        s.selectedElementId = null;
        s.hasUnsavedChanges = false;
      });
    },

    closeScreen() {
      set((s) => {
        s.selectedScreenId = null;
        s.selectedScreen = null;
        s.selectedElementId = null;
        s.hasUnsavedChanges = false;
      });
    },

    saveCurrentScreen() {
      const { selectedScreen } = get();
      if (!selectedScreen) return;
      screenRepo.update(selectedScreen.id, {
        elements: selectedScreen.elements,
        name: selectedScreen.name,
        description: selectedScreen.description,
        canvasWidth: selectedScreen.canvasWidth,
        canvasHeight: selectedScreen.canvasHeight,
        backgroundColor: selectedScreen.backgroundColor,
        gridSize: selectedScreen.gridSize,
      });
      set((s) => {
        s.hasUnsavedChanges = false;
        // Sync in list
        const idx = s.screens.findIndex((sc) => sc.id === selectedScreen.id);
        if (idx !== -1) s.screens[idx] = { ...selectedScreen, updatedAt: new Date().toISOString() };
      });
    },

    saveAndCloseScreen() {
      get().saveCurrentScreen();
      get().closeScreen();
    },

    createScreen(name = 'Nova Tela', folderId = null) {
      const id = uuidv4();
      const now = new Date().toISOString();
      const screen: ScreenEntity = {
        id,
        name,
        description: '',
        canvasWidth: DEFAULT_CANVAS_WIDTH,
        canvasHeight: DEFAULT_CANVAS_HEIGHT,
        backgroundColor: '#1e2235',
        gridSize: 20,
        elements: [],
        createdAt: now,
        updatedAt: now,
      };
      const node: ScreenNodeEntity = {
        id: uuidv4(),
        type: 'screen',
        targetId: id,
        parentFolderId: folderId,
        order: get().nodes.filter((n) => n.parentFolderId === folderId).length,
        createdAt: now,
        updatedAt: now,
      };
      screenRepo.create(screen);
      screenFolderRepo.createNode(node);
      set((s) => {
        s.screens.push(screen);
        s.nodes.push(node);
      });
      return id;
    },

    renameScreen(id, newName) {
      screenRepo.update(id, { name: newName });
      set((s) => {
        const sc = s.screens.find((x) => x.id === id);
        if (sc) sc.name = newName;
        if (s.selectedScreen?.id === id) s.selectedScreen.name = newName;
      });
    },

    duplicateScreen(id) {
      const original = get().screens.find((s) => s.id === id);
      if (!original) return id;
      const now = new Date().toISOString();
      const newId = uuidv4();
      const copy: ScreenEntity = {
        ...original,
        id: newId,
        name: `${original.name} (cópia)`,
        elements: original.elements.map((el) => ({ ...el, id: uuidv4() })),
        createdAt: now,
        updatedAt: now,
      };
      const node: ScreenNodeEntity = {
        id: uuidv4(),
        type: 'screen',
        targetId: newId,
        parentFolderId: get().nodes.find((n) => n.targetId === id)?.parentFolderId ?? null,
        order: get().nodes.length,
        createdAt: now,
        updatedAt: now,
      };
      screenRepo.create(copy);
      screenFolderRepo.createNode(node);
      set((s) => {
        s.screens.push(copy);
        s.nodes.push(node);
      });
      return newId;
    },

    deleteScreen(id) {
      screenRepo.delete(id);
      screenFolderRepo.deleteNodeByTargetId(id);
      set((s) => {
        s.screens = s.screens.filter((x) => x.id !== id);
        s.nodes = s.nodes.filter((n) => n.targetId !== id);
        if (s.selectedScreenId === id) {
          s.selectedScreenId = null;
          s.selectedScreen = null;
          s.selectedElementId = null;
        }
      });
    },

    updateScreenMeta(id, updates) {
      screenRepo.update(id, updates);
      set((s) => {
        const sc = s.screens.find((x) => x.id === id);
        if (sc) Object.assign(sc, updates);
        if (s.selectedScreen?.id === id) Object.assign(s.selectedScreen, updates);
      });
    },

    createFolder(name = 'Nova Pasta', parentFolderId = null) {
      const id = uuidv4();
      const now = new Date().toISOString();
      const folder: ScreenFolderEntity = { id, name, parentFolderId, order: get().folders.length, createdAt: now, updatedAt: now };
      const node: ScreenNodeEntity = { id: uuidv4(), type: 'folder', targetId: id, parentFolderId, order: get().nodes.filter((n) => n.parentFolderId === parentFolderId).length, createdAt: now, updatedAt: now };
      screenFolderRepo.createFolder(folder);
      screenFolderRepo.createNode(node);
      set((s) => { s.folders.push(folder); s.nodes.push(node); });
      return id;
    },

    renameFolder(id, newName) {
      screenFolderRepo.updateFolder(id, { name: newName });
      set((s) => { const f = s.folders.find((x) => x.id === id); if (f) f.name = newName; });
    },

    deleteFolder(id) {
      // Recursively collect and delete children
      const { nodes } = get();
      const childNodes = nodes.filter((n) => n.parentFolderId === id);
      childNodes.forEach((n) => {
        if (n.type === 'screen') get().deleteScreen(n.targetId);
        else if (n.type === 'folder') get().deleteFolder(n.targetId);
      });
      screenFolderRepo.deleteFolder(id);
      screenFolderRepo.deleteNodeByTargetId(id);
      set((s) => {
        s.folders = s.folders.filter((f) => f.id !== id);
        s.nodes = s.nodes.filter((n) => n.targetId !== id && n.parentFolderId !== id);
      });
    },

    moveScreenToFolder(screenId, parentFolderId) {
      set((s) => {
        const node = s.nodes.find((n) => n.targetId === screenId && n.type === 'screen');
        if (node) node.parentFolderId = parentFolderId;
      });
      const node = get().nodes.find((n) => n.targetId === screenId && n.type === 'screen');
      if (node) screenFolderRepo.updateNode(node.id, { parentFolderId });
    },

    selectElement: (elementId) => set((s) => { s.selectedElementId = elementId; }),

    addElement(type, x, y) {
      const { selectedScreen, snapToGrid, isGridEnabled } = get();
      if (!selectedScreen) return;

      const snap = (v: number, grid: number) =>
        snapToGrid && isGridEnabled ? Math.round(v / grid) * grid : v;

      const grid = selectedScreen.gridSize || 20;
      const snappedX = snap(x, grid);
      const snappedY = snap(y, grid);

      const defaultsByType: Record<string, Partial<ScreenElement>> = {
        rectangle: { width: 120, height: 80, fill: '#3b82f6', stroke: '#1d4ed8', strokeWidth: 1, cornerRadius: 4 },
        circle: { width: 80, height: 80, fill: '#10b981', stroke: '#059669', strokeWidth: 1 },
        text: { width: 160, height: 32, fill: 'transparent', stroke: 'none', strokeWidth: 0, textContent: 'Texto', fontSize: 14, textColor: '#f1f5f9', textAlignment: 'left' },
        image: { width: 120, height: 120, fill: 'transparent', stroke: '#475569', strokeWidth: 1 },
      };

      const defaults = defaultsByType[type] ?? { width: 100, height: 60, fill: '#334155', stroke: '#475569', strokeWidth: 1 };
      const id = uuidv4();
      const element: ScreenElement = {
        id,
        name: `${type}-${id.slice(0, 6)}`,
        type,
        x: snappedX,
        y: snappedY,
        zIndex: selectedScreen.elements.length,
        rotation: 0,
        ...defaults,
      } as ScreenElement;

      set((s) => {
        s.selectedScreen!.elements.push(element);
        s.selectedElementId = id;
        s.hasUnsavedChanges = true;
      });
    },

    addWidgetInstance(objectId, widgetId, x, y) {
      const { selectedScreen } = get();
      if (!selectedScreen) return;
      const id = uuidv4();
      const element: ScreenElement = {
        id,
        name: `widget-${id.slice(0, 6)}`,
        type: 'widget-instance',
        x, y,
        width: 200,
        height: 150,
        zIndex: selectedScreen.elements.length,
        rotation: 0,
        objectId: objectId || undefined,
        widgetId,
      };
      set((s) => {
        s.selectedScreen!.elements.push(element);
        s.selectedElementId = id;
        s.hasUnsavedChanges = true;
      });
    },

    addVariableRef(objectId, propertyName, x, y) {
      const { selectedScreen } = get();
      if (!selectedScreen) return;
      const id = uuidv4();
      const element: ScreenElement = {
        id,
        name: propertyName,
        type: 'variable-display',
        x, y,
        width: 180,
        height: 40,
        zIndex: selectedScreen.elements.length,
        rotation: 0,
        objectId,
        propertyName,
        showLabel: true,
        showUnit: false,
        fontSize: 13,
        textColor: '#f1f5f9',
        decimalPlaces: 2,
        backgroundColor: '#1e293b',
        fill: '#1e293b',
        stroke: '#334155',
        strokeWidth: 1,
        cornerRadius: 4,
      };
      set((s) => {
        s.selectedScreen!.elements.push(element);
        s.selectedElementId = id;
        s.hasUnsavedChanges = true;
      });
    },

    addImageElement(imageUri, x, y) {
      const { selectedScreen } = get();
      if (!selectedScreen) return;
      const id = uuidv4();
      const element: ScreenElement = {
        id,
        name: `image-${id.slice(0, 6)}`,
        type: 'image',
        x, y,
        width: 200,
        height: 150,
        zIndex: selectedScreen.elements.length,
        rotation: 0,
        imageUri,
        fill: 'transparent',
        stroke: 'none',
        strokeWidth: 0,
      };
      set((s) => {
        s.selectedScreen!.elements.push(element);
        s.selectedElementId = id;
        s.hasUnsavedChanges = true;
      });
    },

    addLineElement(fromX, fromY, toX, toY) {
      const { selectedScreen } = get();
      if (!selectedScreen) return;
      const id = uuidv4();
      const element: ScreenElement = {
        id,
        name: `line-${id.slice(0, 6)}`,
        type: 'line',
        x: Math.min(fromX, toX),
        y: Math.min(fromY, toY),
        width: Math.abs(toX - fromX) || 100,
        height: Math.abs(toY - fromY) || 1,
        zIndex: selectedScreen.elements.length,
        rotation: 0,
        fromX,
        fromY,
        toX,
        toY,
        stroke: '#64748b',
        strokeWidth: 2,
        strokeStyle: 'solid',
        arrowEnd: false,
        fill: 'transparent',
      };
      set((s) => {
        s.selectedScreen!.elements.push(element);
        s.selectedElementId = id;
        s.hasUnsavedChanges = true;
      });
    },

    updateElement(elementId, updates) {
      set((s) => {
        const el = s.selectedScreen?.elements.find((e) => e.id === elementId);
        if (el) { Object.assign(el, updates); s.hasUnsavedChanges = true; }
      });
    },

    deleteElement(elementId) {
      set((s) => {
        if (!s.selectedScreen) return;
        s.selectedScreen.elements = s.selectedScreen.elements.filter((e) => e.id !== elementId);
        if (s.selectedElementId === elementId) s.selectedElementId = null;
        s.hasUnsavedChanges = true;
      });
    },

    duplicateElement(elementId) {
      const { selectedScreen } = get();
      if (!selectedScreen) return;
      const el = selectedScreen.elements.find((e) => e.id === elementId);
      if (!el) return;
      const newEl: ScreenElement = { ...el, id: uuidv4(), x: el.x + 20, y: el.y + 20, zIndex: selectedScreen.elements.length };
      set((s) => {
        s.selectedScreen!.elements.push(newEl);
        s.selectedElementId = newEl.id;
        s.hasUnsavedChanges = true;
      });
    },

    reorderElementZ(elementId, direction) {
      set((s) => {
        if (!s.selectedScreen) return;
        const els = s.selectedScreen.elements;
        const idx = els.findIndex((e) => e.id === elementId);
        if (idx === -1) return;
        if (direction === 'up' && idx < els.length - 1) {
          [els[idx], els[idx + 1]] = [els[idx + 1], els[idx]];
        } else if (direction === 'down' && idx > 0) {
          [els[idx], els[idx - 1]] = [els[idx - 1], els[idx]];
        } else if (direction === 'top') {
          const el = els.splice(idx, 1)[0];
          els.push(el);
        } else if (direction === 'bottom') {
          const el = els.splice(idx, 1)[0];
          els.unshift(el);
        }
        els.forEach((e, i) => { e.zIndex = i; });
        s.hasUnsavedChanges = true;
      });
    },

    getScreenTree() {
      const { nodes, folders, screens } = get();
      return buildTree(nodes, folders, screens, null);
    },
  }))
);
