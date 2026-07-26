import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuid } from 'uuid';
import type {
  OmmStoreState,
  OmmOrder,
  OmmMovement,
  OmmEquipment,
  OmmEvent,
  OmmAlarm,
  OmmAuditEntry,
  OmmHistoryPoint,
  MovementRow,
  OmmKpiMetrics,
  OmmStatus,
  OmmProduct,
  OmmArea,
  OmmAlignment,
  OmmOperator,
  OmmUserGroup,
  OmmMovementTypeConfig,
  OmmPriorityConfig,
  OmmMeasurementMethodConfig,
  OmmEngUnitConfig,
} from '../types';
import {
  orderRepo,
  movementRepo,
  productRepo,
  areaRepo,
  equipmentRepo,
  alignmentRepo,
  operatorRepo,
  userGroupRepo,
  movementTypeRepo,
  priorityRepo,
  measurementMethodRepo,
  engUnitRepo,
  eventRepo,
  alarmRepo,
  auditRepo,
  historyRepo,
  cutoffRepo,
  simStateRepo,
  isOmmSeeded,
  clearAllOmmData,
} from '../repository';
import { seedOmmData } from '../services/OmmSeedService';
import { ommSimulationEngine } from '../services/OmmSimulationEngine';

// ---------------------------------------------------------------------------
// Store interface extension
// ---------------------------------------------------------------------------
interface OmmStoreActions {
  // Init
  init: () => void;
  refresh: () => void;
  clearAll: () => void;

  // Navigation & Dialogs
  setActiveView: (view: OmmStoreState['activeView']) => void;
  setSelectedMovement: (id: string | null) => void;
  setSelectedOrder: (id: string | null) => void;
  setDetailPanelTab: (tab: string) => void;
  setDetailPanelOpen: (open: boolean) => void;
  setGlobalSearch: (q: string) => void;
  setTableGroupBy: (field: string | null) => void;
  setColumnVisibility: (cols: Record<string, boolean>) => void;

  openOrderDialog: (id?: string | null) => void;
  closeOrderDialog: () => void;
  openMovementDialog: (id?: string | null) => void;
  closeMovementDialog: () => void;
  openSimulatorModal: () => void;
  closeSimulatorModal: () => void;
  saveScenario: (name: string) => void;
  loadScenario: (name: string) => void;

  // Simulator
  toggleSimulator: () => void;
  setSimulatorSpeed: (mult: number) => void;
  stepSimulationTime: (minutes: number) => void;
  setSimulatedTime: (iso: string) => void;
  updateEquipment: (id: string, data: Partial<OmmEquipment>) => void;
  triggerEquipmentFault: (id: string, fault: 'comm_loss' | 'meter_freeze' | 'drift' | 'none') => void;

  // Cut-off
  executeManualCutoff: (notes: string) => void;
  setCutoffHour: (hour: number) => void;

  // Orders CRUD
  createOrder: (data: Partial<OmmOrder>) => string;
  updateOrder: (id: string, data: Partial<OmmOrder>) => void;
  changeOrderStatus: (id: string, status: OmmStatus) => void;
  deleteOrder: (id: string) => void;

  // Movements CRUD
  createMovement: (data: Partial<OmmMovement>) => string;
  updateMovement: (id: string, data: Partial<OmmMovement>) => void;
  changeMovementStatus: (id: string, status: OmmStatus) => void;
  deleteMovement: (id: string) => void;
  duplicateMovement: (id: string) => string;

  // Simulation actions per movement
  setMovementFlowRate: (id: string, rate: number) => void;
  toggleMovementPause: (id: string) => void;
  setMovementSimMode: (id: string, mode: OmmMovement['simMode']) => void;

  // Auxiliary CRUDs (Returns error message string if validation fails, null on success)
  createProduct: (data: Partial<OmmProduct>) => string;
  updateProduct: (id: string, data: Partial<OmmProduct>) => void;
  deleteProduct: (id: string) => string | null;

  createArea: (data: Partial<OmmArea>) => string;
  updateArea: (id: string, data: Partial<OmmArea>) => void;
  deleteArea: (id: string) => string | null;

  createEquipmentEntity: (data: Partial<OmmEquipment>) => string;
  updateEquipmentEntity: (id: string, data: Partial<OmmEquipment>) => void;
  deleteEquipmentEntity: (id: string) => string | null;

  createAlignment: (data: Partial<OmmAlignment>) => string;
  updateAlignment: (id: string, data: Partial<OmmAlignment>) => void;
  deleteAlignment: (id: string) => string | null;

  createOperator: (data: Partial<OmmOperator>) => string;
  updateOperator: (id: string, data: Partial<OmmOperator>) => void;
  deleteOperator: (id: string) => string | null;

  createUserGroup: (data: Partial<OmmUserGroup>) => string;
  updateUserGroup: (id: string, data: Partial<OmmUserGroup>) => void;
  deleteUserGroup: (id: string) => string | null;

  createMovementType: (data: Partial<OmmMovementTypeConfig>) => string;
  updateMovementType: (id: string, data: Partial<OmmMovementTypeConfig>) => void;
  deleteMovementType: (id: string) => string | null;

  createPriority: (data: Partial<OmmPriorityConfig>) => string;
  updatePriority: (id: string, data: Partial<OmmPriorityConfig>) => void;
  deletePriority: (id: string) => string | null;

  createMeasurementMethod: (data: Partial<OmmMeasurementMethodConfig>) => string;
  updateMeasurementMethod: (id: string, data: Partial<OmmMeasurementMethodConfig>) => void;
  deleteMeasurementMethod: (id: string) => string | null;

  createEngUnit: (data: Partial<OmmEngUnitConfig>) => string;
  updateEngUnit: (id: string, data: Partial<OmmEngUnitConfig>) => void;
  deleteEngUnit: (id: string) => string | null;

  // Events
  acknowledgeEvent: (id: string) => void;

  // Alarms
  acknowledgeAlarm: (id: string) => void;

  // Audit
  addAuditEntry: (entry: Partial<OmmAuditEntry>) => void;

  // Derived selectors
  getMovementRows: () => MovementRow[];
  getKpiMetrics: () => OmmKpiMetrics;
  getMovementById: (id: string) => OmmMovement | null;
  getOrderById: (id: string) => OmmOrder | null;
  getEquipmentById: (id: string) => OmmEquipment | null;
  getEventsForMovement: (movId: string) => OmmEvent[];
  getAlarmsForMovement: (movId: string) => OmmAlarm[];
  getAuditForEntity: (entityId: string) => OmmAuditEntry[];
  getHistoryForMovement: (movId: string) => OmmHistoryPoint[];
}

type OmmStore = OmmStoreState & OmmStoreActions;

// ---------------------------------------------------------------------------
// Default state
// ---------------------------------------------------------------------------
const defaultState: OmmStoreState = {
  orders: [],
  movements: [],
  products: [],
  areas: [],
  equipments: [],
  alignments: [],
  operators: [],
  userGroups: [],
  movementTypes: [],
  priorities: [],
  measurementMethods: [],
  engUnits: [],
  events: [],
  alarms: [],
  auditLog: [],
  historyPoints: [],
  cutoffSnapshots: [],
  simulatorState: {
    isRunning: false,
    speedMultiplier: 60,
    simulatedTime: new Date().toISOString(),
    tickCount: 0,
    lastTickAt: new Date().toISOString(),
    nextCutoffAt: '',
    cutoffHour: 1,
    activeMovementCount: 0,
  },
  selectedMovementId: null,
  selectedOrderId: null,
  detailPanelTab: 'general',
  activeView: 'movements',
  isDetailPanelOpen: false,
  tableGroupBy: null,
  tableFilters: {},
  globalSearch: '',
  columnVisibility: {},
  isSeeded: false,
  isOrderDialogOpen: false,
  isMovementDialogOpen: false,
  isSimulatorModalOpen: false,
  editingOrderId: null,
  editingMovementId: null,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const useOmmStore = create<OmmStore>()(
  immer((set, get) => ({
    ...defaultState,

    // -------------------------------------------------------------------------
    // Init & Refresh
    // -------------------------------------------------------------------------
    init: () => {
      if (!isOmmSeeded()) {
        seedOmmData();
      }
      get().refresh();

      // Start simulation engine
      const simState = simStateRepo.get();
      if (simState.isRunning) {
        ommSimulationEngine.start();
      }

      ommSimulationEngine.setOnTick(() => {
        get().refresh();
      });
    },

    refresh: () => {
      set((state) => {
        state.orders = orderRepo.getAll();
        state.movements = movementRepo.getAll();
        state.products = productRepo.getAll();
        state.areas = areaRepo.getAll();
        state.equipments = equipmentRepo.getAll();
        state.alignments = alignmentRepo.getAll();
        state.operators = operatorRepo.getAll();
        state.userGroups = userGroupRepo.getAll();
        state.movementTypes = movementTypeRepo.getAll();
        state.priorities = priorityRepo.getAll();
        state.measurementMethods = measurementMethodRepo.getAll();
        state.engUnits = engUnitRepo.getAll();
        state.events = eventRepo.getAll().slice(-200);
        state.alarms = alarmRepo.getAll().slice(-100);
        state.auditLog = auditRepo.getAll().slice(-500);
        state.historyPoints = historyRepo.getAll().slice(-2000);
        state.cutoffSnapshots = cutoffRepo.getAll();
        state.simulatorState = simStateRepo.get();
        state.isSeeded = isOmmSeeded();
      });
    },

    clearAll: () => {
      ommSimulationEngine.stop();
      clearAllOmmData();
      set((state) => {
        Object.assign(state, defaultState);
      });
    },

    // -------------------------------------------------------------------------
    // Navigation & Dialogs
    // -------------------------------------------------------------------------
    setActiveView: (view) => set((s) => { s.activeView = view; }),
    setSelectedMovement: (id) => set((s) => {
      s.selectedMovementId = id;
      s.isDetailPanelOpen = id !== null;
      if (id) s.detailPanelTab = 'general';
    }),
    setSelectedOrder: (id) => set((s) => { s.selectedOrderId = id; }),
    setDetailPanelTab: (tab) => set((s) => { s.detailPanelTab = tab; }),
    setDetailPanelOpen: (open) => set((s) => { s.isDetailPanelOpen = open; }),
    setGlobalSearch: (q) => set((s) => { s.globalSearch = q; }),
    setTableGroupBy: (field) => set((s) => { s.tableGroupBy = field; }),
    setColumnVisibility: (cols) => set((s) => { s.columnVisibility = cols; }),

    openOrderDialog: (id) => set((s) => {
      s.isOrderDialogOpen = true;
      s.editingOrderId = id ?? null;
    }),
    closeOrderDialog: () => set((s) => {
      s.isOrderDialogOpen = false;
      s.editingOrderId = null;
    }),
    openMovementDialog: (id) => set((s) => {
      s.isMovementDialogOpen = true;
      s.editingMovementId = id ?? null;
    }),
    closeMovementDialog: () => set((s) => {
      s.isMovementDialogOpen = false;
      s.editingMovementId = null;
    }),

    openSimulatorModal: () => set((s) => {
      s.isSimulatorModalOpen = true;
    }),

    closeSimulatorModal: () => set((s) => {
      s.isSimulatorModalOpen = false;
    }),

    saveScenario: (name) => {
      const equipments = equipmentRepo.getAll();
      const movements = movementRepo.getAll();
      const orders = orderRepo.getAll();
      const simState = simStateRepo.get();
      
      const newScenario = {
        id: uuid(),
        name,
        simulatedTime: simState.simulatedTime,
        equipments,
        movements,
        orders,
        isPredefined: false
      };
      
      const raw = localStorage.getItem('omm_v2_scenarios');
      const list = raw ? JSON.parse(raw) : [];
      list.push(newScenario);
      localStorage.setItem('omm_v2_scenarios', JSON.stringify(list));
      
      get().addAuditEntry({
        entityType: 'Config',
        entityId: 'sim',
        entityNumber: 'SIM',
        action: 'SIM_PARAM_CHANGE',
        description: `Cenário de simulação "${name}" salvo com sucesso`,
        operator: 'Operador',
        source: 'UI'
      });
    },

    loadScenario: (scenarioId) => {
      if (scenarioId.startsWith('predefined_')) {
        const type = scenarioId.replace('predefined_', '');
        const equipments = equipmentRepo.getAll();
        const movements = movementRepo.getAll();
        
        movements.forEach(m => {
          if (m.status === 'Active') {
            m.status = 'Completed';
            m.completedAt = simStateRepo.get().simulatedTime;
          }
        });
        
        equipments.forEach(e => {
          e.flowIn = 0;
          e.flowOut = 0;
          e.isSending = false;
          e.isReceiving = false;
          e.simMode = 'manual';
        });

        if (type === 'normal') {
          equipments.forEach((e, i) => {
            e.currentLevel = 50 + (i % 3) * 10;
            e.currentVolume = (e.capacity * e.currentLevel) / 100;
            e.currentMass = (e.currentVolume * (e.density || 850)) / 1000;
            e.temperature = 25;
            e.pressure = 1.0;
          });
        } else if (type === 'shutdown') {
          equipments.forEach(e => {
            e.currentLevel = 40;
            e.currentVolume = (e.capacity * e.currentLevel) / 100;
            e.currentMass = (e.currentVolume * (e.density || 850)) / 1000;
            e.temperature = 20;
            e.pressure = 0.1;
          });
        } else if (type === 'max_prod') {
          equipments.forEach((e) => {
            if (e.type === 'Tank') {
              e.flowIn = 600;
              e.currentLevel = 85;
              e.currentVolume = (e.capacity * e.currentLevel) / 100;
              e.currentMass = (e.currentVolume * (e.density || 850)) / 1000;
              e.temperature = 38;
              e.pressure = 2.4;
            }
          });
        } else if (type === 'transfer') {
          const tq101 = equipments.find(e => e.tag === 'TQ-101');
          const tq102 = equipments.find(e => e.tag === 'TQ-102');
          if (tq101 && tq102) {
            tq101.isSending = true;
            tq102.isReceiving = true;
            
            const newMov: OmmMovement = {
              id: uuid(),
              orderId: uuid(),
              number: `MOV-SIM-${Date.now().toString().slice(-4)}`,
              description: 'Transferência simulada de teste',
              type: 'Transfer',
              category: 'Refined',
              productId: tq101.productId || '',
              areaId: tq101.areaId,
              originId: tq101.id,
              viaId: null,
              destinationId: tq102.id,
              alignmentId: null,
              meterId: null,
              measurementMethod: 'TankGauging',
              status: 'Active',
              priority: 'Normal',
              operatorId: 'OP001',
              plannedVolume: 1000,
              plannedMass: 850,
              plannedFlow: 200,
              plannedStartAt: simStateRepo.get().simulatedTime,
              plannedEndAt: null,
              currentVolume: 10,
              currentMass: 8.5,
              currentFlow: 200,
              avgFlow: 200,
              temperature: 25,
              pressure: 1.0,
              density: 850,
              density20: 850,
              vcf: 1.0,
              correctedVolume: 10,
              accuracy: 99.8,
              percentComplete: 1.0,
              ettcMin: 300,
              etoc: null,
              initialLevel: tq101.currentLevel,
              currentLevel: tq101.currentLevel,
              destLevel: tq102.currentLevel,
              finalLevel: null,
              simFlowRate: 200,
              simNoise: 0.01,
              simMode: 'fixed',
              simPaused: false,
              simSpeedMultiplier: 1.0,
              issuedAt: simStateRepo.get().simulatedTime,
              activatedAt: simStateRepo.get().simulatedTime,
              completedAt: null,
              closedAt: null,
              canceledAt: null,
              lastUpdatedAt: simStateRepo.get().simulatedTime,
              notes: 'Movimento simulado automático',
              tags: [],
              createdAt: simStateRepo.get().simulatedTime,
              updatedAt: simStateRepo.get().simulatedTime
            };
            movements.push(newMov);
          }
        } else if (type === 'road_load') {
          const tq101 = equipments.find(e => e.tag === 'TQ-101');
          if (tq101) {
            tq101.isSending = true;
          }
        } else if (type === 'marine_load') {
          const tq103 = equipments.find(e => e.tag === 'TQ-103');
          if (tq103) {
            tq103.isSending = true;
          }
        } else if (type === 'instrument_fail') {
          const tq101 = equipments.find(e => e.tag === 'TQ-101');
          if (tq101) {
            setTimeout(() => get().triggerEquipmentFault(tq101.id, 'meter_freeze'), 0);
          }
        } else if (type === 'opc_loss') {
          const tq101 = equipments.find(e => e.tag === 'TQ-101');
          if (tq101) {
            setTimeout(() => get().triggerEquipmentFault(tq101.id, 'comm_loss'), 0);
          }
        } else if (type === 'emergency') {
          equipments.forEach((e, i) => {
            if (i < 2) {
              e.currentLevel = 98;
              e.temperature = 65;
              e.pressure = 4.2;
            }
          });
        }
        
        equipmentRepo.saveAll(equipments);
        movementRepo.saveAll(movements);
      } else {
        const raw = localStorage.getItem('omm_v2_scenarios');
        const list = raw ? JSON.parse(raw) : [];
        const scenario = list.find((s: any) => s.id === scenarioId || s.name === scenarioId);
        if (scenario) {
          equipmentRepo.saveAll(scenario.equipments);
          movementRepo.saveAll(scenario.movements);
          orderRepo.saveAll(scenario.orders);
          
          const simState = simStateRepo.get();
          simState.simulatedTime = scenario.simulatedTime;
          simStateRepo.set(simState);
        }
      }
      
      get().addAuditEntry({
        entityType: 'Config',
        entityId: 'sim',
        entityNumber: 'SIM',
        action: 'SIM_PARAM_CHANGE',
        description: `Cenário de simulação carregado`,
        operator: 'Operador',
        source: 'UI'
      });
      get().refresh();
    },

    // -------------------------------------------------------------------------
    // Simulator
    // -------------------------------------------------------------------------
    toggleSimulator: () => {
      const state = simStateRepo.get();
      state.isRunning = !state.isRunning;
      simStateRepo.set(state);
      if (state.isRunning) {
        ommSimulationEngine.start();
      } else {
        ommSimulationEngine.stop();
      }
      set((s) => { s.simulatorState.isRunning = state.isRunning; });
    },

    setSimulatorSpeed: (mult) => {
      const state = simStateRepo.get();
      state.speedMultiplier = mult;
      simStateRepo.set(state);
      set((s) => { s.simulatorState.speedMultiplier = mult; });
    },

    stepSimulationTime: (minutes) => {
      const state = simStateRepo.get();
      const dtMs = minutes * 60_000;
      const simNow = new Date(new Date(state.simulatedTime).getTime() + dtMs);
      state.simulatedTime = simNow.toISOString();
      simStateRepo.set(state);
      get().addAuditEntry({ entityType: 'Config', entityId: 'sim', entityNumber: 'SIM', action: 'SIM_PARAM_CHANGE', description: `Avanço manual de ${minutes} min na simulação`, operator: 'Operador', source: 'UI' });
      get().refresh();
    },

    setSimulatedTime: (iso) => {
      const state = simStateRepo.get();
      state.simulatedTime = iso;
      simStateRepo.set(state);
      get().addAuditEntry({ entityType: 'Config', entityId: 'sim', entityNumber: 'SIM', action: 'SIM_PARAM_CHANGE', description: `Relógio virtual alterado para ${iso}`, operator: 'Operador', source: 'UI' });
      get().refresh();
    },

    updateEquipment: (id, data) => {
      const existing = equipmentRepo.getById(id);
      if (!existing) return;
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      equipmentRepo.save(updated);
      get().addAuditEntry({ entityType: 'Equipment', entityId: id, entityNumber: existing.tag, action: 'UPDATE', description: `Equipamento ${existing.tag} atualizado manualmente`, operator: 'Operador', source: 'UI' });
      get().refresh();
    },

    triggerEquipmentFault: (id, fault) => {
      const existing = equipmentRepo.getById(id);
      if (!existing) return;
      if (fault !== 'none') {
        const alarm = {
          id: uuid(),
          movementId: null,
          equipmentId: id,
          type: 'EquipmentFault',
          severity: 'High' as const,
          message: `Falha em ${existing.tag}: ${fault === 'comm_loss' ? 'Perda de Comunicação' : fault === 'meter_freeze' ? 'Medidor Travado' : 'Desvio de Processo'}`,
          isActive: true,
          acknowledged: false,
          acknowledgedBy: null,
          acknowledgedAt: null,
          activatedAt: new Date().toISOString(),
          clearedAt: null,
          createdAt: new Date().toISOString(),
        };
        alarmRepo.save(alarm);
        get().addAuditEntry({ entityType: 'Equipment', entityId: id, entityNumber: existing.tag, action: 'STATUS_CHANGE', oldValue: 'Normal', newValue: fault, description: `Falha ativada: ${fault}`, operator: 'Operador', source: 'UI' });
      } else {
        const alarms = alarmRepo.getAll();
        const activeForEquip = alarms.filter(a => a.equipmentId === id && a.isActive);
        activeForEquip.forEach(a => {
          a.isActive = false;
          a.clearedAt = new Date().toISOString();
          alarmRepo.save(a);
        });
        get().addAuditEntry({ entityType: 'Equipment', entityId: id, entityNumber: existing.tag, action: 'STATUS_CHANGE', oldValue: 'Fault', newValue: 'Normal', description: `Falhas limpas no equipamento`, operator: 'Operador', source: 'UI' });
      }
      get().refresh();
    },

    // -------------------------------------------------------------------------
    // Cut-off
    // -------------------------------------------------------------------------
    executeManualCutoff: (notes) => {
      const simState = simStateRepo.get();
      const simNow = new Date(simState.simulatedTime);
      const coNumber = `CO-MAN-${new Date().getFullYear()}-${String(cutoffRepo.count() + 1).padStart(3, '0')}`;
      const equipments = equipmentRepo.getAll();
      const activeMovements = movementRepo.getAll().filter(m => m.status === 'Active');

      const inventory = equipments.map(e => ({
        equipmentId: e.id,
        tag: e.tag,
        name: e.name,
        productId: e.productId ?? '',
        level: e.currentLevel,
        volume: e.currentVolume,
        mass: e.currentMass,
        temperature: e.temperature,
        density: e.density,
      }));

      const totalVol = inventory.reduce((sum, item) => sum + item.volume, 0);
      const totalMass = inventory.reduce((sum, item) => sum + item.mass, 0);

      const snapshot = {
        id: uuid(),
        number: coNumber,
        scheduledAt: simNow.toISOString(),
        executedAt: new Date().toISOString(),
        status: 'Validated' as const,
        inventoryByEquipment: inventory,
        movementsActive: activeMovements.map(m => m.id),
        movementsCrossing: activeMovements.filter(m => {
          if (!m.plannedStartAt || !m.plannedEndAt) return false;
          return new Date(m.plannedStartAt) < simNow && new Date(m.plannedEndAt) > simNow;
        }).map(m => m.id),
        totalVolume: totalVol,
        totalMass: totalMass,
        notes: notes || 'Cut-off manual executado via interface',
        validatedBy: 'Operador',
        validatedAt: new Date().toISOString(),
        sentAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      cutoffRepo.save(snapshot);
      get().addAuditEntry({
        entityType: 'Cutoff',
        entityId: snapshot.id,
        entityNumber: coNumber,
        action: 'CUTOFF',
        description: `Cut-off manual executado. Snap: ${coNumber}`,
        operator: 'Operador',
        source: 'UI',
      });
      get().refresh();
    },

    setCutoffHour: (hour) => {
      const state = simStateRepo.get();
      state.cutoffHour = hour;
      simStateRepo.set(state);
      get().addAuditEntry({ entityType: 'Config', entityId: 'cutoff', entityNumber: 'CUTOFF', action: 'SIM_PARAM_CHANGE', description: `Hora do Cut-off alterada para às ${hour}:00`, operator: 'Operador', source: 'UI' });
      get().refresh();
    },

    // -------------------------------------------------------------------------
    // Orders CRUD
    // -------------------------------------------------------------------------
    createOrder: (data) => {
      const id = uuid();
      const ord: OmmOrder = {
        number: `ORD-${String(orderRepo.count() + 1).padStart(3, '0')}`,
        description: data.description ?? '',
        area: data.area ?? '',
        status: 'Issued',
        priority: data.priority ?? 'Normal',
        operator: data.operator ?? '',
        notes: data.notes ?? '',
        movementIds: [],
        issuedAt: new Date().toISOString(),
        activatedAt: null,
        completedAt: null,
        closedAt: null,
        canceledAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data,
        id,
      };
      orderRepo.save(ord);
      get().addAuditEntry({ entityType: 'Order', entityId: id, entityNumber: ord.number, action: 'CREATE', description: 'Ordem criada', operator: 'Operador', source: 'UI' });
      get().refresh();
      return id;
    },

    updateOrder: (id, data) => {
      const existing = orderRepo.getById(id);
      if (!existing) return;
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      orderRepo.save(updated);
      get().addAuditEntry({ entityType: 'Order', entityId: id, entityNumber: existing.number, action: 'UPDATE', description: 'Ordem atualizada', operator: 'Operador', source: 'UI' });
      get().refresh();
    },

    changeOrderStatus: (id, status) => {
      const existing = orderRepo.getById(id);
      if (!existing) return;
      const ts = new Date().toISOString();
      const update: Partial<OmmOrder> = { status, updatedAt: ts };
      if (status === 'Active') update.activatedAt = ts;
      if (status === 'Completed') update.completedAt = ts;
      if (status === 'Closed') update.closedAt = ts;
      if (status === 'Canceled') update.canceledAt = ts;
      orderRepo.save({ ...existing, ...update });
      get().addAuditEntry({ entityType: 'Order', entityId: id, entityNumber: existing.number, action: 'STATUS_CHANGE', oldValue: existing.status, newValue: status, description: `Status alterado para ${status}`, operator: 'Operador', source: 'UI' });
      get().refresh();
    },

    deleteOrder: (id) => {
      orderRepo.delete(id);
      get().refresh();
    },

    // -------------------------------------------------------------------------
    // Movements CRUD
    // -------------------------------------------------------------------------
    createMovement: (data) => {
      const id = uuid();
      const ts = new Date().toISOString();
      const mov: OmmMovement = {
        orderId: data.orderId ?? '',
        number: `MOV-${String(movementRepo.count() + 1).padStart(4, '0')}`,
        description: data.description ?? '',
        type: data.type ?? 'Transfer',
        category: data.category ?? 'Refined',
        productId: data.productId ?? '',
        areaId: data.areaId ?? '',
        originId: data.originId ?? '',
        viaId: data.viaId ?? null,
        destinationId: data.destinationId ?? '',
        alignmentId: data.alignmentId ?? null,
        meterId: data.meterId ?? null,
        measurementMethod: data.measurementMethod ?? 'FlowMeter',
        status: 'Issued',
        priority: data.priority ?? 'Normal',
        operatorId: data.operatorId ?? '',
        plannedVolume: data.plannedVolume ?? 0,
        plannedMass: data.plannedMass ?? 0,
        plannedFlow: data.plannedFlow ?? 0,
        plannedStartAt: data.plannedStartAt ?? null,
        plannedEndAt: data.plannedEndAt ?? null,
        currentVolume: 0,
        currentMass: 0,
        currentFlow: 0,
        avgFlow: 0,
        temperature: 25,
        pressure: 1,
        density: 845,
        density20: 850,
        vcf: 0.999,
        correctedVolume: 0,
        accuracy: 100,
        percentComplete: 0,
        ettcMin: 0,
        etoc: null,
        initialLevel: 0,
        currentLevel: 0,
        destLevel: 0,
        finalLevel: null,
        simFlowRate: data.plannedFlow ?? 100,
        simNoise: 0.02,
        simMode: 'fixed',
        simPaused: false,
        simSpeedMultiplier: 1,
        issuedAt: ts,
        activatedAt: null,
        completedAt: null,
        closedAt: null,
        canceledAt: null,
        lastUpdatedAt: ts,
        notes: data.notes ?? '',
        tags: [],
        createdAt: ts,
        updatedAt: ts,
        ...data,
        id,
      };
      movementRepo.save(mov);
      get().addAuditEntry({ entityType: 'Movement', entityId: id, entityNumber: mov.number, action: 'CREATE', description: 'Movimento criado', operator: 'Operador', source: 'UI' });
      get().refresh();
      return id;
    },

    updateMovement: (id, data) => {
      const existing = movementRepo.getById(id);
      if (!existing) return;
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      movementRepo.save(updated);
      get().addAuditEntry({ entityType: 'Movement', entityId: id, entityNumber: existing.number, action: 'UPDATE', description: 'Movimento atualizado', operator: 'Operador', source: 'UI' });
      get().refresh();
    },

    changeMovementStatus: (id, status) => {
      const existing = movementRepo.getById(id);
      if (!existing) return;
      const ts = new Date().toISOString();
      const update: Partial<OmmMovement> = { status, updatedAt: ts };
      if (status === 'Active') update.activatedAt = ts;
      if (status === 'Completed') { update.completedAt = ts; update.currentFlow = 0; }
      if (status === 'Closed') update.closedAt = ts;
      if (status === 'Canceled') { update.canceledAt = ts; update.currentFlow = 0; }
      movementRepo.save({ ...existing, ...update });
      get().addAuditEntry({ entityType: 'Movement', entityId: id, entityNumber: existing.number, action: 'STATUS_CHANGE', oldValue: existing.status, newValue: status, description: `Status alterado para ${status}`, operator: 'Operador', source: 'UI' });
      get().refresh();
    },

    deleteMovement: (id) => {
      movementRepo.delete(id);
      get().refresh();
    },

    duplicateMovement: (id) => {
      const existing = movementRepo.getById(id);
      if (!existing) return '';
      const ts = new Date().toISOString();
      const newMov: OmmMovement = {
        ...existing,
        id: uuid(),
        number: `MOV-${String(movementRepo.count() + 1).padStart(4, '0')}`,
        status: 'Issued',
        currentVolume: 0,
        currentMass: 0,
        currentFlow: 0,
        percentComplete: 0,
        activatedAt: null,
        completedAt: null,
        closedAt: null,
        canceledAt: null,
        issuedAt: ts,
        createdAt: ts,
        updatedAt: ts,
        lastUpdatedAt: ts,
      };
      movementRepo.save(newMov);
      get().refresh();
      return newMov.id;
    },

    // -------------------------------------------------------------------------
    // Simulation per-movement controls
    // -------------------------------------------------------------------------
    setMovementFlowRate: (id, rate) => {
      const mov = movementRepo.getById(id);
      if (!mov) return;
      movementRepo.save({ ...mov, simFlowRate: rate, updatedAt: new Date().toISOString() });
      get().addAuditEntry({ entityType: 'Movement', entityId: id, entityNumber: mov.number, action: 'SIM_PARAM_CHANGE', field: 'simFlowRate', oldValue: String(mov.simFlowRate), newValue: String(rate), description: 'Vazão de simulação alterada', operator: 'Operador', source: 'UI' });
      get().refresh();
    },

    toggleMovementPause: (id) => {
      const mov = movementRepo.getById(id);
      if (!mov) return;
      movementRepo.save({ ...mov, simPaused: !mov.simPaused, updatedAt: new Date().toISOString() });
      get().refresh();
    },

    setMovementSimMode: (id, mode) => {
      const mov = movementRepo.getById(id);
      if (!mov) return;
      movementRepo.save({ ...mov, simMode: mode, updatedAt: new Date().toISOString() });
      get().refresh();
    },

    // -------------------------------------------------------------------------
    // Auxiliary CRUDs
    // -------------------------------------------------------------------------
    createProduct: (data) => {
      const id = uuid();
      const entity = {
        id,
        code: data.code ?? 'PROD',
        name: data.name ?? 'Novo Produto',
        category: data.category ?? 'Refined',
        density20: data.density20 ?? 850,
        apiGravity: data.apiGravity ?? 30,
        flashPoint: data.flashPoint ?? 40,
        viscosity: data.viscosity ?? 5,
        color: data.color ?? '#64748b',
        unit: data.unit ?? 'm³',
        active: data.active ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      productRepo.save(entity);
      get().addAuditEntry({ entityType: 'Config', entityId: id, entityNumber: entity.code, action: 'CREATE', description: `Produto ${entity.name} criado`, operator: 'Operador', source: 'UI' });
      get().refresh();
      return id;
    },
    updateProduct: (id, data) => {
      const existing = productRepo.getById(id);
      if (!existing) return;
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      productRepo.save(updated);
      get().refresh();
    },
    deleteProduct: (id) => {
      const movements = movementRepo.getAll();
      const equipments = equipmentRepo.getAll();
      const isUsedInMov = movements.some(m => m.productId === id);
      const isUsedInEquip = equipments.some(e => e.productId === id);
      if (isUsedInMov || isUsedInEquip) {
        return 'Não é possível excluir este produto pois ele está em uso em equipamentos ou movimentações.';
      }
      const existing = productRepo.getById(id);
      productRepo.delete(id);
      get().addAuditEntry({ entityType: 'Config', entityId: id, entityNumber: existing?.code ?? 'PROD', action: 'DELETE', description: `Produto ${existing?.name} excluído`, operator: 'Operador', source: 'UI' });
      get().refresh();
      return null;
    },

    createArea: (data) => {
      const id = uuid();
      const entity = {
        id,
        code: data.code ?? 'AREA',
        name: data.name ?? 'Nova Área',
        description: data.description ?? '',
        supervisor: data.supervisor ?? '',
        color: data.color ?? '#3b82f6',
        active: data.active ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      areaRepo.save(entity);
      get().addAuditEntry({ entityType: 'Config', entityId: id, entityNumber: entity.code, action: 'CREATE', description: `Área ${entity.name} criada`, operator: 'Operador', source: 'UI' });
      get().refresh();
      return id;
    },
    updateArea: (id, data) => {
      const existing = areaRepo.getById(id);
      if (!existing) return;
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      areaRepo.save(updated);
      get().refresh();
    },
    deleteArea: (id) => {
      const movements = movementRepo.getAll();
      const equipments = equipmentRepo.getAll();
      const orders = orderRepo.getAll();
      if (movements.some(m => m.areaId === id) || equipments.some(e => e.areaId === id) || orders.some(o => o.area === id)) {
        return 'Não é possível excluir esta área pois ela está em uso.';
      }
      const existing = areaRepo.getById(id);
      areaRepo.delete(id);
      get().addAuditEntry({ entityType: 'Config', entityId: id, entityNumber: existing?.code ?? 'AREA', action: 'DELETE', description: `Área ${existing?.name} excluída`, operator: 'Operador', source: 'UI' });
      get().refresh();
      return null;
    },

    createEquipmentEntity: (data) => {
      const id = uuid();
      const entity = {
        id,
        tag: data.tag ?? 'EQ-000',
        name: data.name ?? 'Novo Equipamento',
        type: data.type ?? 'Tank',
        areaId: data.areaId ?? '',
        productId: data.productId ?? null,
        capacity: data.capacity ?? 0,
        currentLevel: data.currentLevel ?? 0,
        currentVolume: data.currentVolume ?? 0,
        currentMass: data.currentMass ?? 0,
        temperature: data.temperature ?? 20,
        pressure: data.pressure ?? 1,
        density: data.density ?? 850,
        isActive: data.isActive ?? true,
        isSending: false,
        isReceiving: false,
        latitude: data.latitude ?? 0,
        longitude: data.longitude ?? 0,
        x: data.x ?? 100,
        y: data.y ?? 100,
        width: data.width ?? 80,
        height: data.height ?? 100,
        color: data.color ?? '#64748b',
        notes: data.notes ?? '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      equipmentRepo.save(entity);
      get().addAuditEntry({ entityType: 'Equipment', entityId: id, entityNumber: entity.tag, action: 'CREATE', description: `Equipamento ${entity.name} criado`, operator: 'Operador', source: 'UI' });
      get().refresh();
      return id;
    },
    updateEquipmentEntity: (id, data) => {
      const existing = equipmentRepo.getById(id);
      if (!existing) return;
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      equipmentRepo.save(updated);
      get().refresh();
    },
    deleteEquipmentEntity: (id) => {
      const movements = movementRepo.getAll();
      const alignments = alignmentRepo.getAll();
      if (movements.some(m => m.originId === id || m.destinationId === id || m.viaId === id || m.meterId === id) ||
          alignments.some(a => a.fromEquipmentId === id || a.toEquipmentId === id || a.viaEquipmentIds.includes(id))) {
        return 'Não é possível excluir o equipamento pois ele está associado a movimentos ou alinhamentos.';
      }
      const existing = equipmentRepo.getById(id);
      equipmentRepo.delete(id);
      get().addAuditEntry({ entityType: 'Equipment', entityId: id, entityNumber: existing?.tag ?? 'EQ', action: 'DELETE', description: `Equipamento ${existing?.name} excluído`, operator: 'Operador', source: 'UI' });
      get().refresh();
      return null;
    },

    createAlignment: (data) => {
      const id = uuid();
      const entity = {
        id,
        code: data.code ?? 'ALN-000',
        name: data.name ?? 'Novo Alinhamento',
        description: data.description ?? '',
        fromEquipmentId: data.fromEquipmentId ?? '',
        toEquipmentId: data.toEquipmentId ?? '',
        viaEquipmentIds: data.viaEquipmentIds ?? [],
        active: data.active ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      alignmentRepo.save(entity);
      get().addAuditEntry({ entityType: 'Config', entityId: id, entityNumber: entity.code, action: 'CREATE', description: `Alinhamento ${entity.name} criado`, operator: 'Operador', source: 'UI' });
      get().refresh();
      return id;
    },
    updateAlignment: (id, data) => {
      const existing = alignmentRepo.getById(id);
      if (!existing) return;
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      alignmentRepo.save(updated);
      get().refresh();
    },
    deleteAlignment: (id) => {
      if (movementRepo.getAll().some(m => m.alignmentId === id)) {
        return 'Não é possível excluir pois o alinhamento está associado a movimentos.';
      }
      const existing = alignmentRepo.getById(id);
      alignmentRepo.delete(id);
      get().addAuditEntry({ entityType: 'Config', entityId: id, entityNumber: existing?.code ?? 'ALN', action: 'DELETE', description: `Alinhamento ${existing?.name} excluído`, operator: 'Operador', source: 'UI' });
      get().refresh();
      return null;
    },

    createOperator: (data) => {
      const id = uuid();
      const entity = {
        id,
        code: data.code ?? 'OP-000',
        name: data.name ?? 'Novo Operador',
        role: data.role ?? 'Operator Sr.',
        area: data.area ?? '',
        isOnline: data.isOnline ?? false,
        lastSeen: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      operatorRepo.save(entity);
      get().addAuditEntry({ entityType: 'Config', entityId: id, entityNumber: entity.code, action: 'CREATE', description: `Operador ${entity.name} criado`, operator: 'Operador', source: 'UI' });
      get().refresh();
      return id;
    },
    updateOperator: (id, data) => {
      const existing = operatorRepo.getById(id);
      if (!existing) return;
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      operatorRepo.save(updated);
      get().refresh();
    },
    deleteOperator: (id) => {
      if (movementRepo.getAll().some(m => m.operatorId === id) || orderRepo.getAll().some(o => o.operator === id)) {
        return 'Não é possível excluir pois o operador está associado a ordens ou movimentos.';
      }
      const existing = operatorRepo.getById(id);
      operatorRepo.delete(id);
      get().addAuditEntry({ entityType: 'Config', entityId: id, entityNumber: existing?.code ?? 'OP', action: 'DELETE', description: `Operador ${existing?.name} excluído`, operator: 'Operador', source: 'UI' });
      get().refresh();
      return null;
    },

    createUserGroup: (data) => {
      const id = uuid();
      const entity = {
        id,
        code: data.code ?? 'GRP',
        name: data.name ?? 'Novo Grupo de Usuários',
        description: data.description ?? '',
        active: data.active ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      userGroupRepo.save(entity);
      get().addAuditEntry({ entityType: 'Config', entityId: id, entityNumber: 'GRP', action: 'CREATE', description: `Grupo ${entity.name} criado`, operator: 'Operador', source: 'UI' });
      get().refresh();
      return id;
    },
    updateUserGroup: (id, data) => {
      const existing = userGroupRepo.getById(id);
      if (!existing) return;
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      userGroupRepo.save(updated);
      get().refresh();
    },
    deleteUserGroup: (id) => {
      const existing = userGroupRepo.getById(id);
      userGroupRepo.delete(id);
      get().addAuditEntry({ entityType: 'Config', entityId: id, entityNumber: 'GRP', action: 'DELETE', description: `Grupo ${existing?.name} excluído`, operator: 'Operador', source: 'UI' });
      get().refresh();
      return null;
    },

    createMovementType: (data) => {
      const id = uuid();
      const entity = {
        id,
        code: data.code ?? 'Transfer',
        name: data.name ?? 'Novo Tipo Mov.',
        color: data.color ?? '#6366f1',
        description: data.description ?? '',
        active: data.active ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      movementTypeRepo.save(entity);
      get().addAuditEntry({ entityType: 'Config', entityId: id, entityNumber: entity.code, action: 'CREATE', description: `Tipo de movimento ${entity.name} criado`, operator: 'Operador', source: 'UI' });
      get().refresh();
      return id;
    },
    updateMovementType: (id, data) => {
      const existing = movementTypeRepo.getById(id);
      if (!existing) return;
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      movementTypeRepo.save(updated);
      get().refresh();
    },
    deleteMovementType: (id) => {
      const existing = movementTypeRepo.getById(id);
      if (existing && movementRepo.getAll().some(m => m.type === existing.code)) {
        return 'Não é possível excluir pois o tipo está associado a movimentos.';
      }
      movementTypeRepo.delete(id);
      get().addAuditEntry({ entityType: 'Config', entityId: id, entityNumber: existing?.code ?? 'TYP', action: 'DELETE', description: `Tipo de movimento ${existing?.name} excluído`, operator: 'Operador', source: 'UI' });
      get().refresh();
      return null;
    },

    createPriority: (data) => {
      const id = uuid();
      const entity = {
        id,
        code: data.code ?? 'Normal',
        name: data.name ?? 'Nova Prioridade',
        color: data.color ?? '#3b82f6',
        level: data.level ?? 2,
        active: data.active ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      priorityRepo.save(entity);
      get().addAuditEntry({ entityType: 'Config', entityId: id, entityNumber: entity.code, action: 'CREATE', description: `Prioridade ${entity.name} criada`, operator: 'Operador', source: 'UI' });
      get().refresh();
      return id;
    },
    updatePriority: (id, data) => {
      const existing = priorityRepo.getById(id);
      if (!existing) return;
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      priorityRepo.save(updated);
      get().refresh();
    },
    deletePriority: (id) => {
      const existing = priorityRepo.getById(id);
      if (existing && (movementRepo.getAll().some(m => m.priority === existing.code) || orderRepo.getAll().some(o => o.priority === existing.code))) {
        return 'Não é possível excluir pois a prioridade está associada a ordens ou movimentos.';
      }
      priorityRepo.delete(id);
      get().addAuditEntry({ entityType: 'Config', entityId: id, entityNumber: existing?.code ?? 'PRIO', action: 'DELETE', description: `Prioridade ${existing?.name} excluída`, operator: 'Operador', source: 'UI' });
      get().refresh();
      return null;
    },

    createMeasurementMethod: (data) => {
      const id = uuid();
      const entity = {
        id,
        code: data.code ?? 'FlowMeter',
        name: data.name ?? 'Novo Método Med.',
        description: data.description ?? '',
        active: data.active ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      measurementMethodRepo.save(entity);
      get().addAuditEntry({ entityType: 'Config', entityId: id, entityNumber: entity.code, action: 'CREATE', description: `Método de medição ${entity.name} criado`, operator: 'Operador', source: 'UI' });
      get().refresh();
      return id;
    },
    updateMeasurementMethod: (id, data) => {
      const existing = measurementMethodRepo.getById(id);
      if (!existing) return;
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      measurementMethodRepo.save(updated);
      get().refresh();
    },
    deleteMeasurementMethod: (id) => {
      const existing = measurementMethodRepo.getById(id);
      if (existing && movementRepo.getAll().some(m => m.measurementMethod === existing.code)) {
        return 'Não é possível excluir pois o método está associado a movimentos.';
      }
      measurementMethodRepo.delete(id);
      get().addAuditEntry({ entityType: 'Config', entityId: id, entityNumber: existing?.code ?? 'MTHD', action: 'DELETE', description: `Método de medição ${existing?.name} excluído`, operator: 'Operador', source: 'UI' });
      get().refresh();
      return null;
    },

    createEngUnit: (data) => {
      const id = uuid();
      const entity = {
        id,
        code: data.code ?? 'M3',
        name: data.name ?? 'Nova Unidade',
        symbol: data.symbol ?? 'm³',
        dimension: data.dimension ?? 'Volume',
        active: data.active ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      engUnitRepo.save(entity);
      get().addAuditEntry({ entityType: 'Config', entityId: id, entityNumber: entity.code, action: 'CREATE', description: `Unidade de engenharia ${entity.name} criada`, operator: 'Operador', source: 'UI' });
      get().refresh();
      return id;
    },
    updateEngUnit: (id, data) => {
      const existing = engUnitRepo.getById(id);
      if (!existing) return;
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      engUnitRepo.save(updated);
      get().refresh();
    },
    deleteEngUnit: (id) => {
      const existing = engUnitRepo.getById(id);
      if (existing && productRepo.getAll().some(p => p.unit === existing.symbol)) {
        return 'Não é possível excluir pois a unidade está associada a produtos.';
      }
      engUnitRepo.delete(id);
      get().addAuditEntry({ entityType: 'Config', entityId: id, entityNumber: existing?.code ?? 'UNIT', action: 'DELETE', description: `Unidade de engenharia ${existing?.name} excluída`, operator: 'Operador', source: 'UI' });
      get().refresh();
      return null;
    },

    // -------------------------------------------------------------------------
    // Events & Alarms
    // -------------------------------------------------------------------------
    acknowledgeEvent: (id) => {
      const evt = eventRepo.getById(id);
      if (!evt) return;
      eventRepo.save({ ...evt, acknowledged: true, acknowledgedAt: new Date().toISOString(), acknowledgedBy: 'Operador' });
      get().refresh();
    },

    acknowledgeAlarm: (id) => {
      const alarm = alarmRepo.getById(id);
      if (!alarm) return;
      alarmRepo.save({ ...alarm, acknowledged: true, acknowledgedAt: new Date().toISOString(), acknowledgedBy: 'Operador' });
      get().refresh();
    },

    // -------------------------------------------------------------------------
    // Audit
    // -------------------------------------------------------------------------
    addAuditEntry: (entry) => {
      const full: OmmAuditEntry = {
        id: uuid(),
        entityType: entry.entityType ?? 'Movement',
        entityId: entry.entityId ?? '',
        entityNumber: entry.entityNumber ?? '',
        action: entry.action ?? 'UPDATE',
        field: entry.field ?? null,
        oldValue: entry.oldValue ?? null,
        newValue: entry.newValue ?? null,
        description: entry.description ?? '',
        operator: entry.operator ?? 'Sistema',
        source: entry.source ?? 'System',
        createdAt: new Date().toISOString(),
      };
      const existing = auditRepo.getAll();
      auditRepo.saveAll([...existing, full].slice(-1000));
    },

    // -------------------------------------------------------------------------
    // Derived selectors
    // -------------------------------------------------------------------------
    getMovementRows: (): MovementRow[] => {
      const { movements, orders, products, areas, equipments, operators, alignments } = get();
      const orderMap = new Map(orders.map((o) => [o.id, o]));
      const productMap = new Map(products.map((p) => [p.id, p]));
      const areaMap = new Map(areas.map((a) => [a.id, a]));
      const equipMap = new Map(equipments.map((e) => [e.id, e]));
      const operatorMap = new Map(operators.map((o) => [o.id, o]));
      const alignMap = new Map(alignments.map((a) => [a.id, a]));

      return movements.map((m): MovementRow => {
        const order = orderMap.get(m.orderId);
        const product = productMap.get(m.productId);
        const area = areaMap.get(m.areaId);
        const origin = equipMap.get(m.originId);
        const dest = equipMap.get(m.destinationId);
        const via = m.viaId ? equipMap.get(m.viaId) : null;
        const meter = m.meterId ? equipMap.get(m.meterId) : null;
        const operator = operatorMap.get(m.operatorId);
        const align = m.alignmentId ? alignMap.get(m.alignmentId) : null;

        return {
          ...m,
          orderNumber: order?.number ?? '-',
          productName: product?.name ?? '-',
          productColor: product?.color ?? '#64748b',
          areaName: area?.name ?? '-',
          operatorName: operator?.name ?? '-',
          originTag: origin?.tag ?? '-',
          originName: origin?.name ?? '-',
          destinationTag: dest?.tag ?? '-',
          destinationName: dest?.name ?? '-',
          viaTag: via?.tag ?? null,
          meterTag: meter?.tag ?? null,
          alignmentCode: align?.code ?? null,
        };
      });
    },

    getKpiMetrics: (): OmmKpiMetrics => {
      const { orders, movements, alarms, operators, simulatorState } = get();
      const active = movements.filter((m) => m.status === 'Active');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();
      const completedToday = movements.filter(
        (m) => (m.status === 'Completed' || m.status === 'Closed') && (m.completedAt ?? '') >= todayIso,
      );
      const avgAcc = active.length > 0
        ? active.reduce((sum, m) => sum + m.accuracy, 0) / active.length
        : 100;

      return {
        totalOrders: orders.length,
        totalMovements: movements.length,
        issuedCount: movements.filter((m) => m.status === 'Issued').length,
        activeCount: active.length,
        completedCount: movements.filter((m) => m.status === 'Completed').length,
        closedCount: movements.filter((m) => m.status === 'Closed').length,
        canceledCount: movements.filter((m) => m.status === 'Canceled').length,
        avgAccuracy: avgAcc,
        dailyVolume: completedToday.reduce((sum, m) => sum + m.currentVolume, 0),
        dailyMass: completedToday.reduce((sum, m) => sum + m.currentMass, 0),
        activeAlarms: alarms.filter((a) => a.isActive && !a.acknowledged).length,
        operatorsOnline: operators.filter((o) => o.isOnline).length,
        simulatorRunning: simulatorState.isRunning,
        simulatedTime: simulatorState.simulatedTime,
        nextCutoffAt: simulatorState.nextCutoffAt,
      };
    },

    getMovementById: (id) => movementRepo.getById(id),
    getOrderById: (id) => orderRepo.getById(id),
    getEquipmentById: (id) => equipmentRepo.getById(id),

    getEventsForMovement: (movId) =>
      get().events.filter((e) => e.movementId === movId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

    getAlarmsForMovement: (movId) =>
      get().alarms.filter((a) => a.movementId === movId),

    getAuditForEntity: (entityId) =>
      get().auditLog.filter((a) => a.entityId === entityId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

    getHistoryForMovement: (movId) =>
      get().historyPoints.filter((h) => h.movementId === movId).sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
  })),
);
