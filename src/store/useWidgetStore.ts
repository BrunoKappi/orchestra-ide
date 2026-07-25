import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import type {
  WidgetCustomProperty,
  WidgetCustomPropertyDataType,
  WidgetElement,
  WidgetElementBinding,
  WidgetElementType,
  WidgetEntity,
  WidgetFolderEntity,
  WidgetNodeEntity,
  DynamicRule,
} from '../types/domain';
import { widgetRepo } from '../repository/WidgetRepository';
import { widgetFolderRepo } from '../repository/WidgetFolderRepository';
import { widgetSeedService } from '../services/WidgetSeedService';

export type ToolType =
  | 'select'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'text'
  | 'status_light'
  | 'gauge'
  | 'tank'
  | 'variable_display'
  | 'image';


export type InspectorTabType = 'properties' | 'variables' | 'bindings' | 'canvas';

interface WidgetStoreState {
  widgets: WidgetEntity[];
  folders: WidgetFolderEntity[];
  nodes: WidgetNodeEntity[];
  searchQuery: string;

  selectedWidgetId: string | null;
  selectedWidget: WidgetEntity | null;
  selectedElementId: string | null;

  activeTool: ToolType;
  inspectorTab: InspectorTabType;
  isGridEnabled: boolean;
  snapToGrid: boolean;
  zoom: number;
  hasUnsavedChanges: boolean;

  // Global Actions
  init: () => void;
  setSearchQuery: (query: string) => void;
  setActiveTool: (tool: ToolType) => void;
  setInspectorTab: (tab: InspectorTabType) => void;
  setIsGridEnabled: (enabled: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;
  setZoom: (zoom: number) => void;

  // Widget Selection & Editor Top Actions
  selectWidget: (id: string | null) => void;
  closeWidget: () => void;
  saveCurrentWidget: () => void;
  saveAndCloseWidget: () => void;

  // Widget CRUD
  createWidget: (name?: string, folderId?: string | null, isFaceplate?: boolean) => string;
  renameWidget: (id: string, newName: string) => void;
  duplicateWidget: (id: string) => string;
  deleteWidget: (id: string) => void;

  // Folder Tree CRUD
  createFolder: (name?: string, parentFolderId?: string | null) => string;
  renameFolder: (id: string, newName: string) => void;
  deleteFolder: (id: string) => void;
  moveWidgetToFolder: (widgetId: string, parentFolderId: string | null) => void;

  // Element Actions
  selectElement: (elementId: string | null) => void;
  addElement: (type: WidgetElementType, x: number, y: number) => void;
  updateElement: (elementId: string, updates: Partial<WidgetElement>) => void;
  deleteElement: (elementId: string) => void;
  duplicateElement: (elementId: string) => void;
  reorderElementZ: (elementId: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  addVariableDisplayElement: (customPropId: string) => void;
  addImageElement: (imageUri: string, x: number, y: number) => void;

  // Custom Property (Variable) Actions

  addCustomProperty: (prop: {
    name: string;
    dataType: WidgetCustomPropertyDataType;
    defaultValue: string;
    description: string;
    mappedObjectPropertyId?: string;
    mappedObjectPropertyName?: string;
  }) => void;
  updateCustomProperty: (propId: string, updates: Partial<WidgetCustomProperty>) => void;
  deleteCustomProperty: (propId: string) => void;

  // Dynamic Animation Binding Actions
  addElementBinding: (
    elementId: string,
    binding: Omit<WidgetElementBinding, 'id'>
  ) => void;
  updateElementBinding: (
    elementId: string,
    bindingId: string,
    updates: Partial<Omit<WidgetElementBinding, 'id'>>
  ) => void;
  removeElementBinding: (elementId: string, bindingId: string) => void;

  // Dynamics Actions
  addElementDynamic: (
    elementId: string,
    dynamic: Omit<DynamicRule, 'id'>
  ) => void;
  updateElementDynamic: (
    elementId: string,
    dynamicId: string,
    updates: Partial<Omit<DynamicRule, 'id'>>
  ) => void;
  removeElementDynamic: (elementId: string, dynamicId: string) => void;
  duplicateElementDynamic: (elementId: string, dynamicId: string) => void;

  // Canvas Settings Action
  updateCanvasSettings: (settings: {
    canvasWidth?: number;
    canvasHeight?: number;
    backgroundColor?: string;
    gridSize?: number;
  }) => void;
}

export const useWidgetStore = create<WidgetStoreState>()(
  immer((set, get) => ({
    widgets: [],
    folders: [],
    nodes: [],
    searchQuery: '',

    selectedWidgetId: null,
    selectedWidget: null,
    selectedElementId: null,

    activeTool: 'select',
    inspectorTab: 'properties',
    isGridEnabled: true,
    snapToGrid: true,
    zoom: 100,
    hasUnsavedChanges: false,

    init: () => {
      widgetSeedService.seedIfEmpty();
      const widgets = widgetRepo.getAll();
      const folders = widgetFolderRepo.getFolders();
      const nodes = widgetFolderRepo.getNodes();

      set((state) => {
        state.widgets = widgets;
        state.folders = folders;
        state.nodes = nodes;
        if (state.selectedWidgetId) {
          state.selectedWidget = widgets.find((w) => w.id === state.selectedWidgetId) || null;
        }
      });
    },

    setSearchQuery: (query) => {
      set((state) => {
        state.searchQuery = query;
      });
    },

    setActiveTool: (tool) => {
      set((state) => {
        state.activeTool = tool;
      });
    },

    setInspectorTab: (tab) => {
      set((state) => {
        state.inspectorTab = tab;
      });
    },

    setIsGridEnabled: (enabled) => {
      set((state) => {
        state.isGridEnabled = enabled;
      });
    },

    setSnapToGrid: (snap) => {
      set((state) => {
        state.snapToGrid = snap;
      });
    },

    setZoom: (zoom) => {
      set((state) => {
        state.zoom = zoom;
      });
    },

    selectWidget: (id) => {
      if (!id) {
        set((state) => {
          state.selectedWidgetId = null;
          state.selectedWidget = null;
          state.selectedElementId = null;
          state.hasUnsavedChanges = false;
        });
        return;
      }

      const widget = get().widgets.find((w) => w.id === id) || null;
      set((state) => {
        state.selectedWidgetId = id;
        state.selectedWidget = widget ? JSON.parse(JSON.stringify(widget)) : null;
        state.selectedElementId = null;
        state.hasUnsavedChanges = false;
        state.activeTool = 'select';
      });
    },

    closeWidget: () => {
      set((state) => {
        state.selectedWidgetId = null;
        state.selectedWidget = null;
        state.selectedElementId = null;
        state.hasUnsavedChanges = false;
      });
    },

    saveCurrentWidget: () => {
      const active = get().selectedWidget;
      if (!active) return;

      const saved = widgetRepo.save(active);
      const allWidgets = widgetRepo.getAll();

      set((state) => {
        state.widgets = allWidgets;
        state.selectedWidget = JSON.parse(JSON.stringify(saved));
        state.hasUnsavedChanges = false;
      });
    },

    saveAndCloseWidget: () => {
      get().saveCurrentWidget();
      get().closeWidget();
    },

    createWidget: (name = 'New Graphic Widget', folderId = null, isFaceplate = false) => {
      const newId = uuidv4();
      const newWidget: WidgetEntity = {
        id: newId,
        name,
        description: isFaceplate ? 'SCADA Faceplate Template' : 'SCADA Graphic Widget Template',
        canvasWidth: 400,
        canvasHeight: 300,
        backgroundColor: '#0f172a',
        gridSize: 10,
        elements: [],
        customProperties: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isFaceplate,
      };

      widgetRepo.save(newWidget);

      const newNode: WidgetNodeEntity = {
        id: newId,
        type: 'widget',
        targetId: newId,
        parentFolderId: folderId,
        order: get().nodes.filter((n) => n.parentFolderId === folderId).length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const currentNodes = widgetFolderRepo.getNodes();
      currentNodes.push(newNode);
      widgetFolderRepo.saveNodes(currentNodes);

      get().init();
      get().selectWidget(newId);
      return newId;
    },

    renameWidget: (id, newName) => {
      const widget = widgetRepo.getById(id);
      if (widget) {
        widget.name = newName;
        widgetRepo.save(widget);
        get().init();
      }
    },

    duplicateWidget: (id) => {
      const original = widgetRepo.getById(id);
      if (!original) return '';

      const newId = uuidv4();
      const copy: WidgetEntity = {
        ...JSON.parse(JSON.stringify(original)),
        id: newId,
        name: `${original.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      widgetRepo.save(copy);

      const existingNode = get().nodes.find((n) => n.targetId === id);
      const parentFolderId = existingNode ? existingNode.parentFolderId : null;

      const newNode: WidgetNodeEntity = {
        id: newId,
        type: 'widget',
        targetId: newId,
        parentFolderId,
        order: get().nodes.filter((n) => n.parentFolderId === parentFolderId).length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const currentNodes = widgetFolderRepo.getNodes();
      currentNodes.push(newNode);
      widgetFolderRepo.saveNodes(currentNodes);

      get().init();
      get().selectWidget(newId);
      return newId;
    },

    deleteWidget: (id) => {
      widgetRepo.delete(id);
      const currentNodes = widgetFolderRepo.getNodes().filter((n) => n.targetId !== id);
      widgetFolderRepo.saveNodes(currentNodes);

      if (get().selectedWidgetId === id) {
        get().closeWidget();
      }
      get().init();
    },

    createFolder: (name = 'New Folder', parentFolderId = null) => {
      const folderId = uuidv4();
      const folder: WidgetFolderEntity = {
        id: folderId,
        name,
        parentFolderId,
        order: get().folders.filter((f) => f.parentFolderId === parentFolderId).length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      widgetFolderRepo.saveFolder(folder);

      const node: WidgetNodeEntity = {
        id: folderId,
        type: 'folder',
        targetId: folderId,
        parentFolderId,
        order: folder.order,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const currentNodes = widgetFolderRepo.getNodes();
      currentNodes.push(node);
      widgetFolderRepo.saveNodes(currentNodes);

      get().init();
      return folderId;
    },

    renameFolder: (id, newName) => {
      const folder = get().folders.find((f) => f.id === id);
      if (folder) {
        folder.name = newName;
        widgetFolderRepo.saveFolder(folder);
        get().init();
      }
    },

    deleteFolder: (id) => {
      widgetFolderRepo.deleteFolder(id);
      get().init();
    },

    moveWidgetToFolder: (widgetId, parentFolderId) => {
      const nodes = widgetFolderRepo.getNodes();
      const nodeIndex = nodes.findIndex((n) => n.targetId === widgetId && n.type === 'widget');
      if (nodeIndex >= 0) {
        nodes[nodeIndex].parentFolderId = parentFolderId;
      } else {
        nodes.push({
          id: widgetId,
          type: 'widget',
          targetId: widgetId,
          parentFolderId,
          order: nodes.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      widgetFolderRepo.saveNodes(nodes);
      get().init();
    },

    selectElement: (elementId) => {
      set((state) => {
        state.selectedElementId = elementId;
      });
    },

    addElement: (type, x, y) => {
      const active = get().selectedWidget;
      if (!active) return;

      const elementId = uuidv4();
      const defaultName = `${type.charAt(0).toUpperCase() + type.slice(1)} ${active.elements.length + 1}`;

      let width = 100;
      let height = 80;
      let fill = '#0284c7';
      let stroke = '#38bdf8';
      let textContent = '';

      if (type === 'status_light') {
        width = 50;
        height = 50;
        fill = '#22c55e';
        stroke = '#16a34a';
      } else if (type === 'circle') {
        width = 50;
        height = 50;
      } else if (type === 'text') {
        width = 140;
        height = 35;
        fill = 'transparent';
        stroke = 'transparent';
        textContent = 'Sample Label';
      } else if (type === 'gauge' || type === 'tank') {
        width = 120;
        height = 140;
      } else if (type === 'variable_display') {
        width = 160;
        height = 42;
        fill = '#0f172a';
        stroke = '#0ea5e9';
        textContent = '{Variable}';
      }



      const newElem: WidgetElement = {
        id: elementId,
        name: defaultName,
        type,
        x: Math.max(0, x),
        y: Math.max(0, y),
        width,
        height,
        rotation: 0,
        zIndex: active.elements.length + 1,
        fill,
        stroke,
        strokeWidth: 2,
        strokeStyle: 'solid',
        cornerRadius: type === 'rectangle' ? 6 : 0,
        fontSize: 14,
        textContent,
        textColor: '#f8fafc',
        textAlignment: 'left',
        bindings: [],
        dynamics: [],
      };

      set((state) => {
        if (state.selectedWidget) {
          state.selectedWidget.elements.push(newElem);
          state.selectedElementId = elementId;
          state.hasUnsavedChanges = true;
          state.activeTool = 'select';
        }
      });
    },

    updateElement: (elementId, updates) => {
      set((state) => {
        if (state.selectedWidget) {
          const index = state.selectedWidget.elements.findIndex((e) => e.id === elementId);
          if (index >= 0) {
            state.selectedWidget.elements[index] = {
              ...state.selectedWidget.elements[index],
              ...updates,
            };
            state.hasUnsavedChanges = true;
          }
        }
      });
    },

    deleteElement: (elementId) => {
      set((state) => {
        if (state.selectedWidget) {
          state.selectedWidget.elements = state.selectedWidget.elements.filter((e) => e.id !== elementId);
          if (state.selectedElementId === elementId) {
            state.selectedElementId = null;
          }
          state.hasUnsavedChanges = true;
        }
      });
    },

    duplicateElement: (elementId) => {
      const active = get().selectedWidget;
      if (!active) return;
      const elem = active.elements.find((e) => e.id === elementId);
      if (!elem) return;

      const newElem: WidgetElement = {
        ...JSON.parse(JSON.stringify(elem)),
        id: uuidv4(),
        name: `${elem.name} (Copy)`,
        x: elem.x + 15,
        y: elem.y + 15,
        zIndex: active.elements.length + 1,
      };

      set((state) => {
        if (state.selectedWidget) {
          state.selectedWidget.elements.push(newElem);
          state.selectedElementId = newElem.id;
          state.hasUnsavedChanges = true;
        }
      });
    },

    reorderElementZ: (elementId, direction) => {
      set((state) => {
        if (!state.selectedWidget) return;
        const list = state.selectedWidget.elements;
        const index = list.findIndex((e) => e.id === elementId);
        if (index < 0) return;

        if (direction === 'up' && index < list.length - 1) {
          const temp = list[index];
          list[index] = list[index + 1];
          list[index + 1] = temp;
        } else if (direction === 'down' && index > 0) {
          const temp = list[index];
          list[index] = list[index - 1];
          list[index - 1] = temp;
        } else if (direction === 'top') {
          const [elem] = list.splice(index, 1);
          list.push(elem);
        } else if (direction === 'bottom') {
          const [elem] = list.splice(index, 1);
          list.unshift(elem);
        }
        // normalize zIndex values
        list.forEach((e, idx) => {
          e.zIndex = idx + 1;
        });
        state.hasUnsavedChanges = true;
      });
    },

    addVariableDisplayElement: (customPropId) => {
      const active = get().selectedWidget;
      if (!active) return;
      const prop = active.customProperties.find((p) => p.id === customPropId);
      if (!prop) return;

      const elementId = uuidv4();
      const bindingId = uuidv4();

      const newElem: WidgetElement = {
        id: elementId,
        name: `Var: ${prop.name}`,
        type: 'variable_display',
        x: 40,
        y: 40 + active.elements.length * 15,
        width: 170,
        height: 44,
        rotation: 0,
        zIndex: active.elements.length + 1,
        fill: '#0f172a',
        stroke: '#0ea5e9',
        strokeWidth: 1.5,
        strokeStyle: 'solid',
        cornerRadius: 6,
        fontSize: 14,
        textContent: `${prop.name}: ${prop.defaultValue || '0.0'}`,
        textColor: '#38bdf8',
        textAlignment: 'center',
        bindings: [
          {
            id: bindingId,
            property: 'textContent',
            customPropId: prop.id,
          },
        ],
        dynamics: [],
      };

      set((state) => {
        if (state.selectedWidget) {
          state.selectedWidget.elements.push(newElem);
          state.selectedElementId = elementId;
          state.hasUnsavedChanges = true;
          state.inspectorTab = 'properties';
        }
      });
    },

    addImageElement: (imageUri, x, y) => {
      set((state) => {
        if (state.selectedWidget) {
          const elementId = uuidv4();
          const defaultName = `Image ${state.selectedWidget.elements.length + 1}`;
          const newElem: WidgetElement = {
            id: elementId,
            name: defaultName,
            type: 'image',
            x: Math.max(0, x),
            y: Math.max(0, y),
            width: 60,
            height: 60,
            rotation: 0,
            zIndex: state.selectedWidget.elements.length + 1,
            fill: 'transparent',
            stroke: 'transparent',
            strokeWidth: 0,
            strokeStyle: 'solid',
            imageUri,
            bindings: [],
            dynamics: [],
          };
          state.selectedWidget.elements.push(newElem);
          state.selectedElementId = elementId;
          state.hasUnsavedChanges = true;
          state.activeTool = 'select';
        }
      });
    },


    addCustomProperty: (propData) => {
      const propId = uuidv4();
      const newProp: WidgetCustomProperty = {
        id: propId,
        ...propData,
      };

      set((state) => {
        if (state.selectedWidget) {
          state.selectedWidget.customProperties.push(newProp);
          state.hasUnsavedChanges = true;
        }
      });
    },

    updateCustomProperty: (propId, updates) => {
      set((state) => {
        if (state.selectedWidget) {
          const idx = state.selectedWidget.customProperties.findIndex((p) => p.id === propId);
          if (idx >= 0) {
            state.selectedWidget.customProperties[idx] = {
              ...state.selectedWidget.customProperties[idx],
              ...updates,
            };
            state.hasUnsavedChanges = true;
          }
        }
      });
    },

    deleteCustomProperty: (propId) => {
      set((state) => {
        if (state.selectedWidget) {
          state.selectedWidget.customProperties = state.selectedWidget.customProperties.filter(
            (p) => p.id !== propId
          );
          // Remove bindings referring to this propId
          state.selectedWidget.elements.forEach((elem) => {
            elem.bindings = elem.bindings.filter((b) => b.customPropId !== propId);
          });
          state.hasUnsavedChanges = true;
        }
      });
    },

    addElementBinding: (elementId, bindingData) => {
      const newBinding: WidgetElementBinding = {
        id: uuidv4(),
        ...bindingData,
      };

      set((state) => {
        if (state.selectedWidget) {
          const elem = state.selectedWidget.elements.find((e) => e.id === elementId);
          if (elem) {
            elem.bindings.push(newBinding);
            state.hasUnsavedChanges = true;
          }
        }
      });
    },

    updateElementBinding: (elementId, bindingId, updates) => {
      set((state) => {
        if (state.selectedWidget) {
          const elem = state.selectedWidget.elements.find((e) => e.id === elementId);
          if (elem) {
            const idx = elem.bindings.findIndex((b) => b.id === bindingId);
            if (idx >= 0) {
              elem.bindings[idx] = { ...elem.bindings[idx], ...updates };
              state.hasUnsavedChanges = true;
            }
          }
        }
      });
    },

    removeElementBinding: (elementId, bindingId) => {
      set((state) => {
        if (state.selectedWidget) {
          const elem = state.selectedWidget.elements.find((e) => e.id === elementId);
          if (elem) {
            elem.bindings = elem.bindings.filter((b) => b.id !== bindingId);
            state.hasUnsavedChanges = true;
          }
        }
      });
    },

    addElementDynamic: (elementId, dynamicData) => {
      const newDynamic: DynamicRule = {
        id: uuidv4(),
        ...dynamicData,
      };

      set((state) => {
        if (state.selectedWidget) {
          const elem = state.selectedWidget.elements.find((e) => e.id === elementId);
          if (elem) {
            if (!elem.dynamics) {
              elem.dynamics = [];
            }
            elem.dynamics.push(newDynamic);
            state.hasUnsavedChanges = true;
          }
        }
      });
    },

    updateElementDynamic: (elementId, dynamicId, updates) => {
      set((state) => {
        if (state.selectedWidget) {
          const elem = state.selectedWidget.elements.find((e) => e.id === elementId);
          if (elem && elem.dynamics) {
            const idx = elem.dynamics.findIndex((d) => d.id === dynamicId);
            if (idx >= 0) {
              elem.dynamics[idx] = { ...elem.dynamics[idx], ...updates };
              state.hasUnsavedChanges = true;
            }
          }
        }
      });
    },

    removeElementDynamic: (elementId, dynamicId) => {
      set((state) => {
        if (state.selectedWidget) {
          const elem = state.selectedWidget.elements.find((e) => e.id === elementId);
          if (elem && elem.dynamics) {
            elem.dynamics = elem.dynamics.filter((d) => d.id !== dynamicId);
            state.hasUnsavedChanges = true;
          }
        }
      });
    },

    duplicateElementDynamic: (elementId, dynamicId) => {
      set((state) => {
        if (state.selectedWidget) {
          const elem = state.selectedWidget.elements.find((e) => e.id === elementId);
          if (elem && elem.dynamics) {
            const target = elem.dynamics.find((d) => d.id === dynamicId);
            if (target) {
              const copy: DynamicRule = JSON.parse(JSON.stringify(target));
              copy.id = uuidv4();
              elem.dynamics.push(copy);
              state.hasUnsavedChanges = true;
            }
          }
        }
      });
    },

    updateCanvasSettings: (settings) => {
      set((state) => {
        if (state.selectedWidget) {
          if (settings.canvasWidth !== undefined) state.selectedWidget.canvasWidth = settings.canvasWidth;
          if (settings.canvasHeight !== undefined) state.selectedWidget.canvasHeight = settings.canvasHeight;
          if (settings.backgroundColor !== undefined) state.selectedWidget.backgroundColor = settings.backgroundColor;
          if (settings.gridSize !== undefined) state.selectedWidget.gridSize = settings.gridSize;
          state.hasUnsavedChanges = true;
        }
      });
    },
  }))
);
