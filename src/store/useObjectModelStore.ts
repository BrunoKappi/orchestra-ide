import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import type {
  DataType,
  DeploymentFolderEntity,
  DeploymentNodeEntity,
  EntityType,
  MergedProperty,
  MergedScript,
  ObjectEntity,
  ScriptTrigger,
  TemplateEntity,
  AssociatedWidgetEntity,
  MergedAssociatedWidget,
  MockConfig,
  MergedMockConfig,
  AlarmEvent,
  PropertyAlarmConfig,
  PropertyHistoryConfig,
  ProductEntity,
  AreaEntity,
  EquipmentGraphicConfig,
} from '../types/domain';
import { templateRepo } from '../repository/TemplateRepository';
import { objectRepo } from '../repository/ObjectRepository';
import { propertyRepo } from '../repository/PropertyRepository';
import { scriptRepo } from '../repository/ScriptRepository';
import { deploymentRepo } from '../repository/DeploymentRepository';
import { associatedWidgetRepo } from '../repository/AssociatedWidgetRepository';
import { mockConfigRepo } from '../repository/MockConfigRepository';
import { alarmRepo } from '../repository/AlarmRepository';
import { screenRepo } from '../repository/ScreenRepository';
import { screenFolderRepo } from '../repository/ScreenFolderRepository';
import { flowchartRepo } from '../repository/FlowchartRepository';
import { widgetRepo } from '../repository/WidgetRepository';
import { widgetFolderRepo } from '../repository/WidgetFolderRepository';
import { inheritanceService } from '../services/InheritanceService';
import { exportImportService } from '../services/ExportImportService';
import { seedService } from '../services/SeedService';
import { simulationEngine } from '../services/simulationEngine';
import { AlarmEngine } from '../services/AlarmEngine';
import { historyEngine } from '../services/HistoryEngine';
import { propertyBrowserService } from '../services/PropertyBrowserService';
import { STORAGE_KEYS } from '../repository/storageKey';
import type { ActiveEventState } from '../types/event';
import { useOpcStore } from './useOpcStore';

interface ObjectModelStoreState {
  // Navigation & Theme
  activeSidebarTab: 'derivation' | 'deployment';
  activeEditorTab: 'properties' | 'graphics';
  theme: 'light' | 'dark';
  searchQuery: string;
  products: ProductEntity[];
  areas: AreaEntity[];
  movements: any[];
  saveEquipmentGraphicConfig: (id: string, type: EntityType, config: EquipmentGraphicConfig) => void;

  // Active selection
  selectedEntity: { id: string; type: EntityType } | null;

  // Cached Database Entities (reactive)
  templates: TemplateEntity[];
  objects: ObjectEntity[];
  deploymentFolders: DeploymentFolderEntity[];
  deploymentNodes: DeploymentNodeEntity[];

  // Currently displayed entity details
  selectedTemplate: TemplateEntity | null;
  selectedObject: ObjectEntity | null;
  mergedProperties: MergedProperty[];
  mergedScripts: MergedScript[];
  mergedAssociatedWidgets: MergedAssociatedWidget[];
  mergedMockConfigs: MergedMockConfig[];

  // Simulation Engine State
  isSimulating: boolean;
  simulationSpeedMs: number;
  simulationTickCount: number;
  simulatedValues: Record<string, string>;
  historyValues: Record<string, number[]>;

  // Modal Control States
  isPropertyModalOpen: boolean;
  editingProperty: MergedProperty | null;
  isScriptModalOpen: boolean;
  editingScript: MergedScript | null;
  isMockModalOpen: boolean;
  editingMockProperty: MergedProperty | null;
  isExportImportModalOpen: boolean;
  exportImportMode: 'export' | 'import';
  exportPayload: string;

  // Alarm modal & state
  isAlarmConfigModalOpen: boolean;
  editingAlarmProperty: MergedProperty | null;
  alarmEvents: AlarmEvent[];
  activeEvents: ActiveEventState[];
  evaluateEvents: () => void;

  // History modal state
  isHistoryConfigModalOpen: boolean;
  editingHistoryProperty: MergedProperty | null;



  // Actions
  init: () => void;
  setActiveSidebarTab: (tab: 'derivation' | 'deployment') => void;
  setActiveEditorTab: (tab: 'properties' | 'graphics') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setSearchQuery: (query: string) => void;
  selectEntity: (id: string | null, type?: EntityType) => void;

  // Simulator Actions
  toggleSimulation: (running?: boolean) => void;
  setSimulationSpeed: (speedMs: number) => void;
  tickSimulation: () => void;
  openMockConfigModal: (property: MergedProperty) => void;
  closeMockConfigModal: () => void;
  saveMockConfig: (configData: Partial<MockConfig> & { propertyName: string; targetId?: string; targetType?: EntityType }) => void;
  deleteMockConfig: (propertyName: string, targetId?: string) => void;
  toggleMockConfigEnabled: (propertyName: string, targetId?: string, targetType?: EntityType) => void;
  updateSimulatedValue: (key: string, value: string) => void;


  // Entity CRUD
  createRootTemplate: (name: string, description?: string) => string;
  createDerivedTemplate: (parentTemplateId: string, name?: string) => string;
  createInstance: (templateId: string, name?: string) => string;
  renameEntity: (id: string, type: EntityType, newName: string) => void;
  duplicateEntity: (id: string, type: EntityType) => string;
  deleteEntity: (id: string, type: EntityType) => void;
  updateEntityDetails: (id: string, type: EntityType, updates: { name?: string; description?: string }) => void;

  // Property Actions
  openAddPropertyModal: () => void;
  openEditPropertyModal: (property: MergedProperty) => void;
  closePropertyModal: () => void;
  saveProperty: (data: { name: string; dataType: DataType; defaultValue: string; description: string; category?: string; opcTagPath?: string }) => void;
  deleteProperty: (propertyId: string) => void;
  duplicateProperty: (property: MergedProperty) => void;
  bindOpcTagToProperty: (propertyId: string, opcTagPath: string) => void;

  // Script Actions
  openAddScriptModal: () => void;
  openEditScriptModal: (script: MergedScript) => void;
  closeScriptModal: () => void;
  saveScript: (data: { name: string; trigger: ScriptTrigger; triggerExpression: string; loopTimeMs: number | null; code: string; description: string }) => void;
  deleteScript: (scriptId: string) => void;
  duplicateScript: (script: MergedScript) => void;

  // Graphic / Associated Widget Actions
  associateWidget: (widgetId: string) => void;
  disassociateWidget: (associationId: string) => void;
  updateWidgetMappings: (associationId: string, mappings: AssociatedWidgetEntity['mappings']) => void;

  // Deployment Actions
  createDeploymentFolder: (name: string, parentFolderId?: string | null) => string;
  renameDeploymentFolder: (folderId: string, newName: string) => void;
  deleteDeploymentFolder: (folderId: string) => void;
  addInstanceToDeployment: (objectId: string, targetFolderId?: string | null) => void;
  moveObjectToFolder: (objectId: string, targetFolderId: string | null) => void;
  removeNodeFromDeployment: (nodeId: string) => void;
  deployObject: (objectId: string) => void;
  undeployObject: (objectId: string) => void;
  toggleObjectDeployment: (objectId: string) => void;

  // Export / Import
  openExportModal: (id: string, type: EntityType) => void;
  openImportModal: () => void;
  closeExportImportModal: () => void;
  importJsonPayload: (jsonString: string) => boolean;

  // Alarm Actions
  openAlarmConfigModal: (property: MergedProperty) => void;
  closeAlarmConfigModal: () => void;
  saveAlarmConfig: (propertyName: string, config: PropertyAlarmConfig, targetId?: string, targetType?: EntityType) => void;
  acknowledgeAlarms: (ids: string[], username?: string) => void;
  clearAlarmHistory: () => void;

  // History Actions
  openHistoryConfigModal: (property: MergedProperty) => void;
  closeHistoryConfigModal: () => void;
  saveHistoryConfig: (propertyName: string, config: PropertyHistoryConfig, targetId?: string, targetType?: EntityType) => void;

  isInitialized: boolean;

  // System
  resetAllData: () => void;
  resetMockData: () => void;
  clearAllData: () => void;
  refreshData: () => void;
}

export const useObjectModelStore = create<ObjectModelStoreState>()(
  immer((set, get) => ({
    isInitialized: false,

    activeSidebarTab: 'derivation',
    activeEditorTab: 'properties',
    theme: 'light',
    searchQuery: '',

    selectedEntity: null,

    templates: [],
    objects: [],
    deploymentFolders: [],
    deploymentNodes: [],

    selectedTemplate: null,
    selectedObject: null,
    mergedProperties: [],
    mergedScripts: [],
    mergedAssociatedWidgets: [],
    mergedMockConfigs: [],

    isSimulating: true,
    simulationSpeedMs: 1000,
    simulationTickCount: 0,
    simulatedValues: {},
    historyValues: {},

    isPropertyModalOpen: false,
    editingProperty: null,
    isScriptModalOpen: false,
    editingScript: null,
    isMockModalOpen: false,
    editingMockProperty: null,
    isExportImportModalOpen: false,
    exportImportMode: 'export',
    exportPayload: '',

    isAlarmConfigModalOpen: false,
    editingAlarmProperty: null,
    alarmEvents: [],
    activeEvents: [],

    isHistoryConfigModalOpen: false,
    editingHistoryProperty: null,

    products: [],
    areas: [],
    movements: [],

    init: () => {
      if (get().isInitialized) {
        get().refreshData();
        return;
      }
      seedService.seedInitialDataIfNeeded();
      historyEngine.init();
      simulationEngine.start(10);
      simulationEngine.subscribe(() => {
        get().refreshData();
      });

      get().refreshData();

      // Auto-select TK-301 or first available object
      const objects = objectRepo.getAll();
      const templates = templateRepo.getAll();
      if (objects.length > 0) {
        get().selectEntity(objects[0].id, 'instance');
      } else if (templates.length > 0) {
        get().selectEntity(templates[0].id, 'template');
      }

      set((state) => {
        state.isInitialized = true;
      });
    },

    setActiveSidebarTab: (tab) => set((state) => { state.activeSidebarTab = tab; }),
    setActiveEditorTab: (tab) => set((state) => { state.activeEditorTab = tab; }),
    setTheme: (theme) => set((state) => { state.theme = theme; }),
    toggleTheme: () => set((state) => { state.theme = state.theme === 'light' ? 'dark' : 'light'; }),
    setSearchQuery: (query) => set((state) => { state.searchQuery = query; }),

    saveEquipmentGraphicConfig: (id: string, type: EntityType, config: EquipmentGraphicConfig) => {
      if (type === 'template') {
        const tpl = templateRepo.getById(id);
        if (tpl) {
          tpl.graphicConfig = config;
          templateRepo.save(tpl);
        }
      } else {
        const obj = objectRepo.getById(id);
        if (obj) {
          obj.graphicConfig = config;
          objectRepo.save(obj);
        }
      }
      get().refreshData();
    },

    refreshData: () => {
      const templates = templateRepo.getAll();
      const objects = objectRepo.getAll();
      const folders = deploymentRepo.getFolders();
      const nodes = deploymentRepo.getNodes();
      const alarmEvents = alarmRepo.getAll();

      const rawProds = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      const products = rawProds ? JSON.parse(rawProds) : [];
      const rawAreas = localStorage.getItem(STORAGE_KEYS.AREAS);
      const areas = rawAreas ? JSON.parse(rawAreas) : [];
      const rawMovs = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      const movements = rawMovs ? JSON.parse(rawMovs) : [];

      set((state) => {
        state.templates = templates;
        state.objects = objects;
        state.deploymentFolders = folders;
        state.deploymentNodes = nodes;
        state.alarmEvents = alarmEvents;
        state.products = products;
        state.areas = areas;
        state.movements = movements;

        // Ensure all properties of all objects are initialized in simulatedValues
        objects.forEach((obj) => {
          const props = inheritanceService.getMergedProperties(obj.id, 'instance');
          props.forEach((prop) => {
            const key = `${obj.id}:${prop.name}`;
            state.simulatedValues[key] = prop.defaultValue;
          });
        });
      });

      // Rebuild the Property Browser's index
      try {
        const screens = screenRepo.getAll();
        const associatedWidgets = associatedWidgetRepo.getAll();
        const mockConfigs = mockConfigRepo.getAll();
        propertyBrowserService.rebuildIndex(
          templates,
          objects,
          screens,
          associatedWidgets,
          mockConfigs
        );
      } catch (err) {
        console.error('Failed to rebuild property browser index:', err);
      }

      const currentSel = get().selectedEntity;
      if (currentSel) {
        get().selectEntity(currentSel.id, currentSel.type);
      }
    },

    selectEntity: (id, type) => {
      if (!id || !type) {
        set((state) => {
          state.selectedEntity = null;
          state.selectedTemplate = null;
          state.selectedObject = null;
          state.mergedProperties = [];
          state.mergedScripts = [];
          state.mergedAssociatedWidgets = [];
          state.mergedMockConfigs = [];
          state.simulatedValues = {};
          state.historyValues = {};
        });
        return;
      }

      if (type === 'template') {
        const template = templateRepo.getById(id);
        const props = inheritanceService.getMergedProperties(id, 'template');
        const scripts = inheritanceService.getMergedScripts(id, 'template');
        const assocs = inheritanceService.getMergedAssociatedWidgets(id, 'template');
        const mockConfigs = inheritanceService.getMergedMockConfigs(id, 'template', props);

        set((state) => {
          state.selectedEntity = { id, type: 'template' };
          state.selectedTemplate = template;
          state.selectedObject = null;
          state.mergedProperties = props;
          state.mergedScripts = scripts;
          state.mergedAssociatedWidgets = assocs;
          state.mergedMockConfigs = mockConfigs;

          props.forEach((p) => {
            if (state.simulatedValues[p.name] === undefined) {
              state.simulatedValues[p.name] = p.defaultValue;
            }
            const num = parseFloat(state.simulatedValues[p.name]);
            if (!isNaN(num) && !state.historyValues[p.name]) {
              state.historyValues[p.name] = [num];
            }
          });
        });
      } else {
        const obj = objectRepo.getById(id);
        const props = inheritanceService.getMergedProperties(id, 'instance');
        const scripts = inheritanceService.getMergedScripts(id, 'instance');
        const assocs = inheritanceService.getMergedAssociatedWidgets(id, 'instance');
        const mockConfigs = inheritanceService.getMergedMockConfigs(id, 'instance', props);

        set((state) => {
          state.selectedEntity = { id, type: 'instance' };
          state.selectedObject = obj;
          state.selectedTemplate = null;
          state.mergedProperties = props;
          state.mergedScripts = scripts;
          state.mergedAssociatedWidgets = assocs;
          state.mergedMockConfigs = mockConfigs;

          props.forEach((p) => {
            const key = `${id}:${p.name}`;
            if (state.simulatedValues[key] === undefined) {
              state.simulatedValues[key] = p.defaultValue;
            }
            state.simulatedValues[p.name] = state.simulatedValues[key];

            const num = parseFloat(state.simulatedValues[key]);
            if (!isNaN(num)) {
              if (!state.historyValues[key]) {
                state.historyValues[key] = [num];
              }
              state.historyValues[p.name] = state.historyValues[key];
            }
          });
        });
      }
    },

    toggleSimulation: (running) => set((state) => {
      state.isSimulating = running !== undefined ? running : !state.isSimulating;
      try {
        localStorage.setItem(STORAGE_KEYS.SIMULATOR_SETTINGS, JSON.stringify({
          isSimulating: state.isSimulating,
          simulationSpeedMs: state.simulationSpeedMs,
        }));
      } catch (e) {
        console.error('Failed to save simulator settings to localStorage:', e);
      }
    }),

    setSimulationSpeed: (speedMs) => set((state) => {
      state.simulationSpeedMs = speedMs;
      try {
        localStorage.setItem(STORAGE_KEYS.SIMULATOR_SETTINGS, JSON.stringify({
          isSimulating: state.isSimulating,
          simulationSpeedMs: state.simulationSpeedMs,
        }));
      } catch (e) {
        console.error('Failed to save simulator settings to localStorage:', e);
      }
    }),

    tickSimulation: () => {
      const { objects, selectedEntity, simulatedValues, historyValues, simulationTickCount } = get();

      const nextTick = simulationTickCount + 1;
      const nextValues: Record<string, string> = { ...simulatedValues };
      const nextHistory: Record<string, number[]> = { ...historyValues };

      // Copia todas as tags OPC UA/DA para simulatedValues para compatibilidade com Telas e Widgets
      const opcNodes = useOpcStore.getState().nodes;
      opcNodes.forEach((n) => {
        if (n.type === 'tag') {
          const newVal = n.value ?? '0';
          nextValues[`OPC_VIRTUAL:${n.path}`] = newVal;
          // Grava histórico para tags OPC no Historian
          historyEngine.record('OPC_VIRTUAL', n.path, newVal, {
            enabled: true,
            collectionMode: 'on_change',
            intervalMs: 1000,
            retentionMs: 3600000,
            maxSamples: 1000,
            deadband: 0,
            compression: false,
            engineeringUnit: n.engineeringUnit || '',
            notes: ''
          }, 'simulation');
        }
      });

      // Iterate through all objects, simulating ONLY DEPLOYED objects
      objects.forEach((obj) => {
        const isDeployed = obj.isDeployed !== false; // Default to true if not explicitly set false
        if (!isDeployed) return; // Skip undeployed objects — they do not run in runtime

        const props = inheritanceService.getMergedProperties(obj.id, 'instance');

        props.forEach((prop) => {
          const key = `${obj.id}:${prop.name}`;

          // OPC Tag Binding
          if (prop.opcTagPath) {
            const opcNodes = useOpcStore.getState().nodes;
            const opcNode = opcNodes.find((n) => n.path === prop.opcTagPath && n.type === 'tag');
            if (opcNode) {
              const newVal = opcNode.value ?? prop.defaultValue;
              nextValues[key] = newVal;
              if (selectedEntity?.id === obj.id) {
                nextValues[prop.name] = newVal;
              }
              const num = parseFloat(newVal);
              if (!isNaN(num)) {
                const histKey = key;
                const hist = nextHistory[histKey] ? [...nextHistory[histKey]] : [];
                hist.push(num);
                if (hist.length > 15) hist.shift();
                nextHistory[histKey] = hist;
                if (selectedEntity?.id === obj.id) {
                  nextHistory[prop.name] = hist;
                }
              }
              if (prop.historyConfig?.enabled) {
                historyEngine.record(obj.id, prop.id, newVal, prop.historyConfig, 'simulation');
              }
              return; // Ignora simulação normal/mock
            }
          }

          if (nextValues[key] === undefined) {
            nextValues[key] = prop.defaultValue;
          }
          if (selectedEntity?.id === obj.id) {
            nextValues[prop.name] = nextValues[key];
          }
        });
      });

      const alarmEvents = alarmRepo.getAll();

      set((state) => {
        state.simulationTickCount = nextTick;
        state.simulatedValues = nextValues;
        state.historyValues = nextHistory;
        state.alarmEvents = alarmEvents;
        state.activeEvents = [];
      });
    },

    openMockConfigModal: (property) => set((state) => {
      state.isMockModalOpen = true;
      state.editingMockProperty = property;
    }),

    closeMockConfigModal: () => set((state) => {
      state.isMockModalOpen = false;
      state.editingMockProperty = null;
    }),

    saveMockConfig: (configData) => {
      const targetId = configData.targetId || get().selectedEntity?.id;
      const targetType = configData.targetType || get().selectedEntity?.type || 'instance';
      if (!targetId) return;

      const existing = mockConfigRepo.getByTargetAndProperty(targetId, configData.propertyName);
      const now = new Date().toISOString();

      if (existing) {
        mockConfigRepo.save({
          ...existing,
          ...configData,
          targetId,
          targetType,
          updatedAt: now,
        });
      } else {
        mockConfigRepo.save({
          id: uuidv4(),
          targetId,
          targetType,
          propertyName: configData.propertyName,
          enabled: configData.enabled ?? true,
          preset: configData.preset || 'range',
          params: configData.params || {},
          createdAt: now,
          updatedAt: now,
        });
      }

      get().closeMockConfigModal();
      get().refreshData();
    },

    deleteMockConfig: (propertyName, targetId) => {
      const selId = targetId || get().selectedEntity?.id;
      if (!selId) return;
      mockConfigRepo.delete(selId, propertyName);
      get().refreshData();
    },

    toggleMockConfigEnabled: (propertyName, targetId, targetType) => {
      const selId = targetId || get().selectedEntity?.id;
      const selType = targetType || get().selectedEntity?.type || 'instance';
      if (!selId) return;

      const props = inheritanceService.getMergedProperties(selId, selType);
      const mergedConfigs = inheritanceService.getMergedMockConfigs(selId, selType, props);
      const currentConfig = mergedConfigs.find((c) => c.propertyName === propertyName);

      if (currentConfig) {
        mockConfigRepo.save({
          ...currentConfig,
          targetId: selId,
          targetType: selType,
          enabled: !currentConfig.enabled,
          updatedAt: new Date().toISOString(),
        });
      } else {
        mockConfigRepo.save({
          id: uuidv4(),
          targetId: selId,
          targetType: selType,
          propertyName,
          enabled: false,
          preset: 'range',
          params: { min: 0, max: 100 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      get().refreshData();
    },

    updateSimulatedValue: (key, value) => {
      // Record in HistoryEngine for runtime updates
      const parts = key.split(':');
      if (parts.length === 2) {
        const [objectId, propName] = parts;
        const obj = objectRepo.getById(objectId);
        if (obj) {
          const props = inheritanceService.getMergedProperties(objectId, 'instance');
          const prop = props.find((p) => p.name === propName);
          if (prop?.historyConfig?.enabled) {
            historyEngine.record(objectId, prop.id, value, prop.historyConfig, 'runtime');
          }
        }
      }

      set((state) => {
        state.simulatedValues[key] = value;
        const num = parseFloat(value);
        if (!isNaN(num)) {
          if (!state.historyValues[key]) {
            state.historyValues[key] = [];
          }
          state.historyValues[key].push(num);
          if (state.historyValues[key].length > 15) {
            state.historyValues[key].shift();
          }
        }

        // SelectedEntity mapping fallback
        if (parts.length === 2 && state.selectedEntity?.id === parts[0]) {
          const num2 = parseFloat(value);
          state.simulatedValues[parts[1]] = value;
          if (!isNaN(num2)) {
            if (!state.historyValues[parts[1]]) {
              state.historyValues[parts[1]] = [];
            }
            state.historyValues[parts[1]].push(num2);
            if (state.historyValues[parts[1]].length > 15) {
              state.historyValues[parts[1]].shift();
            }
          }
        }

        // Re-evaluate alarms instantly on manual update
        AlarmEngine.evaluate(state.simulatedValues, state.objects, inheritanceService.getMergedProperties.bind(inheritanceService));
        state.alarmEvents = alarmRepo.getAll();
        state.activeEvents = [];
      });
    },

    evaluateEvents: () => {
      set((state) => {
        state.activeEvents = [];
      });
    },


    openAlarmConfigModal: (property) => set((state) => {
      state.isAlarmConfigModalOpen = true;
      state.editingAlarmProperty = property;
    }),

    closeAlarmConfigModal: () => set((state) => {
      state.isAlarmConfigModalOpen = false;
      state.editingAlarmProperty = null;
    }),

    saveAlarmConfig: (propertyName, configData, targetId, targetType) => {
      const activeId = targetId || get().selectedEntity?.id;
      const activeType = targetType || get().selectedEntity?.type;
      if (!activeId || !activeType) return;

      const properties = propertyRepo.getByTargetId(activeId);
      const prop = properties.find((p) => p.name === propertyName);

      if (prop) {
        prop.alarmConfig = configData;
        prop.updatedAt = new Date().toISOString();
        propertyRepo.save(prop);
      } else {
        const mergedProps = inheritanceService.getMergedProperties(activeId, activeType);
        const inheritedProp = mergedProps.find((p) => p.name === propertyName);
        if (inheritedProp) {
          const now = new Date().toISOString();
          propertyRepo.save({
            id: uuidv4(),
            targetId: activeId,
            targetType: activeType,
            name: inheritedProp.name,
            dataType: inheritedProp.dataType,
            defaultValue: inheritedProp.defaultValue,
            description: inheritedProp.description,
            alarmConfig: configData,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      get().closeAlarmConfigModal();
      get().refreshData();
    },

    openHistoryConfigModal: (property) => set((state) => {
      state.isHistoryConfigModalOpen = true;
      state.editingHistoryProperty = property;
    }),

    closeHistoryConfigModal: () => set((state) => {
      state.isHistoryConfigModalOpen = false;
      state.editingHistoryProperty = null;
    }),

    saveHistoryConfig: (propertyName, configData, targetId, targetType) => {
      const activeId = targetId || get().selectedEntity?.id;
      const activeType = targetType || get().selectedEntity?.type;
      if (!activeId || !activeType) return;

      const properties = propertyRepo.getByTargetId(activeId);
      const prop = properties.find((p) => p.name === propertyName);

      if (prop) {
        prop.historyConfig = configData;
        prop.updatedAt = new Date().toISOString();
        propertyRepo.save(prop);
      } else {
        const mergedProps = inheritanceService.getMergedProperties(activeId, activeType);
        const inheritedProp = mergedProps.find((p) => p.name === propertyName);
        if (inheritedProp) {
          const now = new Date().toISOString();
          propertyRepo.save({
            id: uuidv4(),
            targetId: activeId,
            targetType: activeType,
            name: inheritedProp.name,
            dataType: inheritedProp.dataType,
            defaultValue: inheritedProp.defaultValue,
            description: inheritedProp.description,
            historyConfig: configData,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      get().closeHistoryConfigModal();
      get().refreshData();
    },

    acknowledgeAlarms: (ids, username = 'Operator') => {
      const all = alarmRepo.getAll();
      const now = new Date().toISOString();
      let changed = false;

      const updated = all.map((evt) => {
        if (ids.includes(evt.id)) {
          if (evt.status === 'Active Unacknowledged') {
            changed = true;
            return {
              ...evt,
              status: 'Active Acknowledged' as const,
              acknowledgedAt: now,
              ackedBy: username,
            };
          } else if (evt.status === 'Cleared Unacknowledged') {
            changed = true;
            return {
              ...evt,
              status: 'Cleared Acknowledged' as const,
              acknowledgedAt: now,
              ackedBy: username,
            };
          }
        }
        return evt;
      });

      if (changed) {
        alarmRepo.saveAll(updated);
        set((state) => {
          state.alarmEvents = updated;
        });
      }
    },

    clearAlarmHistory: () => {
      const all = alarmRepo.getAll();
      const unresolved = all.filter((evt) => evt.status !== 'Cleared Acknowledged');
      alarmRepo.saveAll(unresolved);
      set((state) => {
        state.alarmEvents = unresolved;
      });
    },

    // Entity Operations
    createRootTemplate: (name, description = '') => {
      const id = uuidv4();
      const now = new Date().toISOString();
      templateRepo.save({
        id,
        name,
        parentTemplateId: null,
        description,
        createdAt: now,
        updatedAt: now,
      });
      get().refreshData();
      get().selectEntity(id, 'template');
      return id;
    },

    createDerivedTemplate: (parentTemplateId, name) => {
      const parent = templateRepo.getById(parentTemplateId);
      const id = uuidv4();
      const now = new Date().toISOString();
      const templateName = name || (parent ? `Derived ${parent.name}` : 'New Template');

      templateRepo.save({
        id,
        name: templateName,
        parentTemplateId,
        description: parent ? `Derived from ${parent.name}` : '',
        createdAt: now,
        updatedAt: now,
      });

      get().refreshData();
      get().selectEntity(id, 'template');
      return id;
    },

    createInstance: (templateId, name) => {
      const t = templateRepo.getById(templateId);
      const id = uuidv4();
      const now = new Date().toISOString();

      const count = objectRepo.getByTemplateId(templateId).length + 1;
      const instanceName = name || (t ? `${t.name.replace(/\s+/g, '')}_${count}` : `Instance_${count}`);

      objectRepo.save({
        id,
        name: instanceName,
        templateId,
        description: t ? `Instance of ${t.name}` : '',
        createdAt: now,
        updatedAt: now,
      });

      get().refreshData();
      get().selectEntity(id, 'instance');
      return id;
    },

    renameEntity: (id, type, newName) => {
      get().updateEntityDetails(id, type, { name: newName });
    },

    updateEntityDetails: (id, type, updates) => {
      const now = new Date().toISOString();
      if (type === 'template') {
        const t = templateRepo.getById(id);
        if (t) {
          templateRepo.save({ ...t, ...updates, updatedAt: now });
        }
      } else {
        const o = objectRepo.getById(id);
        if (o) {
          objectRepo.save({ ...o, ...updates, updatedAt: now });
        }
      }
      get().refreshData();
    },

    duplicateEntity: (id, type) => {
      if (type === 'template') {
        const payload = exportImportService.exportEntity(id, 'template');
        payload.rootEntity.data.name = `${payload.rootEntity.data.name}_Copy`;
        const result = exportImportService.importPayload(payload);
        get().refreshData();
        get().selectEntity(result.importedRootId, 'template');
        return result.importedRootId;
      } else {
        const payload = exportImportService.exportEntity(id, 'instance');
        payload.rootEntity.data.name = `${payload.rootEntity.data.name}_Copy`;
        const result = exportImportService.importPayload(payload);
        get().refreshData();
        get().selectEntity(result.importedRootId, 'instance');
        return result.importedRootId;
      }
    },

    deleteEntity: (id, type) => {
      if (type === 'template') {
        const collectDescendantTemplates = (tid: string): string[] => {
          const children = templateRepo.getAll().filter((x) => x.parentTemplateId === tid);
          let list = [tid];
          children.forEach((c) => {
            list = list.concat(collectDescendantTemplates(c.id));
          });
          return list;
        };

        const allTemplateIds = collectDescendantTemplates(id);
        allTemplateIds.forEach((tid) => {
          const insts = objectRepo.getByTemplateId(tid);
          insts.forEach((inst) => {
            propertyRepo.deleteByTargetId(inst.id);
            scriptRepo.deleteByTargetId(inst.id);
            associatedWidgetRepo.deleteByTargetId(inst.id);
            deploymentRepo.deleteNodeByTargetId(inst.id);
            objectRepo.delete(inst.id);
          });

          propertyRepo.deleteByTargetId(tid);
          scriptRepo.deleteByTargetId(tid);
          associatedWidgetRepo.deleteByTargetId(tid);
          templateRepo.delete(tid);
        });
      } else {
        propertyRepo.deleteByTargetId(id);
        scriptRepo.deleteByTargetId(id);
        associatedWidgetRepo.deleteByTargetId(id);
        deploymentRepo.deleteNodeByTargetId(id);
        objectRepo.delete(id);
      }

      get().refreshData();

      const cur = get().selectedEntity;
      if (cur && cur.id === id) {
        const remainingObjects = objectRepo.getAll();
        const remainingTemplates = templateRepo.getAll();
        if (remainingObjects.length > 0) {
          get().selectEntity(remainingObjects[0].id, 'instance');
        } else if (remainingTemplates.length > 0) {
          get().selectEntity(remainingTemplates[0].id, 'template');
        } else {
          get().selectEntity(null);
        }
      }
    },

    // Property Actions
    openAddPropertyModal: () => set((state) => {
      state.editingProperty = null;
      state.isPropertyModalOpen = true;
    }),
    openEditPropertyModal: (property) => set((state) => {
      state.editingProperty = property;
      state.isPropertyModalOpen = true;
    }),
    closePropertyModal: () => set((state) => {
      state.isPropertyModalOpen = false;
      state.editingProperty = null;
    }),

    saveProperty: (data) => {
      const sel = get().selectedEntity;
      if (!sel) return;

      const editing = get().editingProperty;
      const now = new Date().toISOString();

      if (editing && !editing.isInherited) {
        propertyRepo.save({
          id: editing.id,
          targetId: sel.id,
          targetType: sel.type,
          name: data.name,
          dataType: data.dataType,
          defaultValue: data.defaultValue,
          description: data.description,
          category: data.category,
          opcTagPath: data.opcTagPath,
          createdAt: editing.createdAt,
          updatedAt: now,
        });
      } else {
        propertyRepo.save({
          id: uuidv4(),
          targetId: sel.id,
          targetType: sel.type,
          name: data.name,
          dataType: data.dataType,
          defaultValue: data.defaultValue,
          description: data.description,
          category: data.category,
          opcTagPath: data.opcTagPath,
          createdAt: now,
          updatedAt: now,
        });
      }

      get().closePropertyModal();
      get().refreshData();
    },



    deleteProperty: (propertyId) => {
      propertyRepo.delete(propertyId);
      get().refreshData();
    },

    duplicateProperty: (prop) => {
      const sel = get().selectedEntity;
      if (!sel) return;

      const now = new Date().toISOString();
      propertyRepo.save({
        id: uuidv4(),
        targetId: sel.id,
        targetType: sel.type,
        name: `${prop.name}_Copy`,
        dataType: prop.dataType,
        defaultValue: prop.defaultValue,
        description: prop.description,
        createdAt: now,
        updatedAt: now,
      });
      get().refreshData();
    },

    bindOpcTagToProperty: (propertyId, opcTagPath) => {
      const prop = propertyRepo.getById(propertyId);
      if (prop) {
        prop.opcTagPath = opcTagPath;
        propertyRepo.save(prop);
        get().refreshData();
      }
    },

    // Script Actions
    openAddScriptModal: () => set((state) => {
      state.editingScript = null;
      state.isScriptModalOpen = true;
    }),
    openEditScriptModal: (script) => set((state) => {
      state.editingScript = script;
      state.isScriptModalOpen = true;
    }),
    closeScriptModal: () => set((state) => {
      state.isScriptModalOpen = false;
      state.editingScript = null;
    }),

    saveScript: (data) => {
      const sel = get().selectedEntity;
      if (!sel) return;

      const editing = get().editingScript;
      const now = new Date().toISOString();

      if (editing && !editing.isInherited) {
        scriptRepo.save({
          id: editing.id,
          targetId: sel.id,
          targetType: sel.type,
          name: data.name,
          trigger: data.trigger,
          triggerExpression: data.triggerExpression,
          loopTimeMs: data.loopTimeMs,
          code: data.code,
          description: data.description,
          createdAt: editing.createdAt,
          updatedAt: now,
        });
      } else {
        scriptRepo.save({
          id: uuidv4(),
          targetId: sel.id,
          targetType: sel.type,
          name: data.name,
          trigger: data.trigger,
          triggerExpression: data.triggerExpression,
          loopTimeMs: data.loopTimeMs,
          code: data.code,
          description: data.description,
          createdAt: now,
          updatedAt: now,
        });
      }

      get().closeScriptModal();
      get().refreshData();
    },

    deleteScript: (scriptId) => {
      scriptRepo.delete(scriptId);
      get().refreshData();
    },

    duplicateScript: (script) => {
      const sel = get().selectedEntity;
      if (!sel) return;

      const now = new Date().toISOString();
      scriptRepo.save({
        id: uuidv4(),
        targetId: sel.id,
        targetType: sel.type,
        name: `${script.name}_Copy`,
        trigger: script.trigger,
        triggerExpression: script.triggerExpression || '',
        loopTimeMs: script.loopTimeMs ?? null,
        code: script.code,
        description: script.description,
        createdAt: now,
        updatedAt: now,
      });
      get().refreshData();
    },

    // Deployment Actions
    createDeploymentFolder: (name, parentFolderId = null) => {
      const id = uuidv4();
      const now = new Date().toISOString();
      const existingInParent = deploymentRepo
        .getFolders()
        .filter((f) => f.parentFolderId === parentFolderId).length;

      deploymentRepo.saveFolder({
        id,
        name,
        parentFolderId: parentFolderId || null,
        order: existingInParent,
        createdAt: now,
        updatedAt: now,
      });

      deploymentRepo.saveNode({
        id: uuidv4(),
        type: 'folder',
        targetId: id,
        parentFolderId: parentFolderId || null,
        order: existingInParent,
        createdAt: now,
        updatedAt: now,
      });

      get().refreshData();
      return id;
    },

    renameDeploymentFolder: (folderId, newName) => {
      const folder = deploymentRepo.getFolders().find((f) => f.id === folderId);
      if (folder) {
        deploymentRepo.saveFolder({
          ...folder,
          name: newName,
          updatedAt: new Date().toISOString(),
        });
        get().refreshData();
      }
    },

    deleteDeploymentFolder: (folderId) => {
      deploymentRepo.deleteFolder(folderId);
      get().refreshData();
    },

    addInstanceToDeployment: (objectId, targetFolderId = null) => {
      const existing = deploymentRepo
        .getNodes()
        .find((n) => n.type === 'object' && n.targetId === objectId);

      const now = new Date().toISOString();
      if (existing) {
        deploymentRepo.saveNode({
          ...existing,
          parentFolderId: targetFolderId || null,
          updatedAt: now,
        });
      } else {
        const order = deploymentRepo
          .getNodes()
          .filter((n) => n.parentFolderId === (targetFolderId || null)).length;

        deploymentRepo.saveNode({
          id: uuidv4(),
          type: 'object',
          targetId: objectId,
          parentFolderId: targetFolderId || null,
          order,
          createdAt: now,
          updatedAt: now,
        });
      }
      get().refreshData();
    },

    moveObjectToFolder: (objectId, targetFolderId) => {
      const existing = deploymentRepo
        .getNodes()
        .find((n) => n.type === 'object' && n.targetId === objectId);

      const now = new Date().toISOString();
      if (existing) {
        deploymentRepo.saveNode({
          ...existing,
          parentFolderId: targetFolderId,
          updatedAt: now,
        });
      } else {
        const order = deploymentRepo
          .getNodes()
          .filter((n) => n.parentFolderId === targetFolderId).length;
        deploymentRepo.saveNode({
          id: uuidv4(),
          type: 'object',
          targetId: objectId,
          parentFolderId: targetFolderId,
          order,
          createdAt: now,
          updatedAt: now,
        });
      }
      get().refreshData();
    },

    removeNodeFromDeployment: (nodeId) => {
      deploymentRepo.deleteNode(nodeId);
      get().refreshData();
    },

    deployObject: (objectId) => {
      const obj = objectRepo.getById(objectId);
      if (obj) {
        objectRepo.save({
          ...obj,
          isDeployed: true,
          updatedAt: new Date().toISOString(),
        });
        get().refreshData();
      }
    },

    undeployObject: (objectId) => {
      const obj = objectRepo.getById(objectId);
      if (obj) {
        objectRepo.save({
          ...obj,
          isDeployed: false,
          updatedAt: new Date().toISOString(),
        });
        get().refreshData();
      }
    },

    toggleObjectDeployment: (objectId) => {
      const obj = objectRepo.getById(objectId);
      if (obj) {
        objectRepo.save({
          ...obj,
          isDeployed: !obj.isDeployed,
          updatedAt: new Date().toISOString(),
        });
        get().refreshData();
      }
    },

    // Export & Import
    openExportModal: (id, type) => {
      const payload = exportImportService.exportEntity(id, type);
      set((state) => {
        state.exportImportMode = 'export';
        state.exportPayload = JSON.stringify(payload, null, 2);
        state.isExportImportModalOpen = true;
      });
    },

    openImportModal: () => {
      set((state) => {
        state.exportImportMode = 'import';
        state.exportPayload = '';
        state.isExportImportModalOpen = true;
      });
    },

    closeExportImportModal: () => {
      set((state) => {
        state.isExportImportModalOpen = false;
        state.exportPayload = '';
      });
    },

    importJsonPayload: (jsonString) => {
      try {
        const payload = JSON.parse(jsonString);
        const result = exportImportService.importPayload(payload);
        get().refreshData();
        get().selectEntity(result.importedRootId, result.importedRootType);
        get().closeExportImportModal();
        return true;
      } catch (err) {
        console.error('Import failed:', err);
        return false;
      }
    },

    resetAllData: () => {
      seedService.seedInitialDataIfNeeded(true);
      get().init();
    },

    resetMockData: () => {
      seedService.seedInitialDataIfNeeded(true);
      get().init();
    },

    clearAllData: () => {
      // 1. Clear database repos
      templateRepo.saveAll([]);
      objectRepo.saveAll([]);
      propertyRepo.saveAll([]);
      scriptRepo.saveAll([]);
      deploymentRepo.saveAllFolders([]);
      deploymentRepo.saveAllNodes([]);
      associatedWidgetRepo.saveAll([]);
      mockConfigRepo.saveAll([]);
      alarmRepo.clear();
      widgetRepo.saveAll([]);
      widgetFolderRepo.saveFolders([]);
      widgetFolderRepo.saveNodes([]);
      screenRepo.saveAll([]);
      screenFolderRepo.saveAllFolders([]);
      screenFolderRepo.saveAllNodes([]);
      flowchartRepo.saveAll([]);
      flowchartRepo.saveFolders([]);
      flowchartRepo.saveNodes([]);

      // 2. Set seeded to true so that it does not auto-seed on init
      localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');

      // 3. Clear store state
      set((state) => {
        state.templates = [];
        state.objects = [];
        state.deploymentFolders = [];
        state.deploymentNodes = [];
        state.selectedEntity = null;
        state.selectedTemplate = null;
        state.selectedObject = null;
        state.mergedProperties = [];
        state.mergedScripts = [];
        state.mergedAssociatedWidgets = [];
        state.mergedMockConfigs = [];
        state.simulatedValues = {};
        state.historyValues = {};
        state.alarmEvents = [];
      });

      // 4. Rebuild search index
      try {
        propertyBrowserService.rebuildIndex([], [], [], [], []);
      } catch (err) {
        console.error(err);
      }
    },

    associateWidget: (widgetId) => {
      const sel = get().selectedEntity;
      if (!sel) return;

      const now = new Date().toISOString();
      associatedWidgetRepo.save({
        id: uuidv4(),
        targetId: sel.id,
        targetType: sel.type,
        widgetId,
        mappings: {},
        createdAt: now,
        updatedAt: now,
      });
      get().refreshData();
    },

    disassociateWidget: (associationId) => {
      associatedWidgetRepo.delete(associationId);
      get().refreshData();
    },

    updateWidgetMappings: (associationId, mappings) => {
      const existing = associatedWidgetRepo.getById(associationId);
      const sel = get().selectedEntity;
      if (!existing || !sel) return;

      const now = new Date().toISOString();
      if (existing.targetId !== sel.id) {
        associatedWidgetRepo.save({
          id: uuidv4(),
          targetId: sel.id,
          targetType: sel.type,
          widgetId: existing.widgetId,
          mappings,
          createdAt: now,
          updatedAt: now,
        });
      } else {
        associatedWidgetRepo.save({
          ...existing,
          mappings,
          updatedAt: now,
        });
      }
      get().refreshData();
    },
  }))
);
