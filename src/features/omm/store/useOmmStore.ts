import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuid } from 'uuid';
import type {
  OmmStoreState,
  OmmOrder,
  OmmMovement,
  OmmEquipment,
  OmmAuditEntry,
  MovementRow,
  OmmKpiMetrics,
  OmmStatus,
  OmmProduct,
  OmmArea,
  OmmAlignment,
  OmmMovementTypeConfig,
  OmmPriorityConfig,
  OmmEngUnitConfig,
} from '../types';
import {
  orderRepo,
  movementRepo,
  productRepo,
  areaRepo,
  equipmentRepo,
  alignmentRepo,
  movementTypeRepo,
  priorityRepo,
  engUnitRepo,
  alarmRepo,
  auditRepo,
  cutoffRepo,
  simStateRepo,
  isOmmSeeded,
  clearAllOmmData,
} from '../repository';
import { seedOmmData, syncActiveMovementsToGlobal } from '../services/OmmSeedService';
import { ommSimulationEngine } from '../services/OmmSimulationEngine';
import { simulationEngine } from '../../../services/simulationEngine';
import { propertyRepo as globalPropertyRepo } from '../../../repository/PropertyRepository';
import { STORAGE_KEYS } from '../../../repository/storageKey';

// ---------------------------------------------------------------------------
// Security users type (from Security module)
// ---------------------------------------------------------------------------
export interface SecurityUser {
  id: string;
  name: string;
  login: string;
  role: string;
  areaId?: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Store interface
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
  setGlobalSearch: (q: string) => void;
  setTableGroupBy: (by: string | null) => void;
  setTableFilter: (key: string, value: string) => void;
  clearTableFilters: () => void;

  openOrderDialog: (id?: string | null) => void;
  closeOrderDialog: () => void;
  openMovementModal: (id?: string | null) => void;
  closeMovementModal: () => void;
  openSimulatorModal: () => void;
  closeSimulatorModal: () => void;

  // Simulator
  toggleSimulator: () => void;
  setSimulatorSpeed: (mult: number) => void;
  stepSimulationTime: (minutes: number) => void;
  setSimulatedTime: (timeStr: string) => void;
  updateEquipment: (id: string, data: Partial<OmmEquipment>) => void;
  saveScenario: (name: string) => void;
  loadScenario: (id: string) => void;

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
  toggleMovementPause: (id: string) => void;
  setMovementFlowRate: (id: string, rate: number) => void;

  // Auxiliary CRUDs
  createProduct: (data: Partial<OmmProduct>) => string;
  updateProduct: (id: string, data: Partial<OmmProduct>) => void;
  deleteProduct: (id: string) => string | null;

  createArea: (data: Partial<OmmArea>) => string;
  updateArea: (id: string, data: Partial<OmmArea>) => void;
  deleteArea: (id: string) => string | null;

  createAlignment: (data: Partial<OmmAlignment>) => string;
  updateAlignment: (id: string, data: Partial<OmmAlignment>) => void;
  deleteAlignment: (id: string) => string | null;

  createMovementType: (data: Partial<OmmMovementTypeConfig>) => string;
  updateMovementType: (id: string, data: Partial<OmmMovementTypeConfig>) => void;
  deleteMovementType: (id: string) => string | null;

  createPriority: (data: Partial<OmmPriorityConfig>) => string;
  updatePriority: (id: string, data: Partial<OmmPriorityConfig>) => void;
  deletePriority: (id: string) => string | null;

  createEngUnit: (data: Partial<OmmEngUnitConfig>) => string;
  updateEngUnit: (id: string, data: Partial<OmmEngUnitConfig>) => void;
  deleteEngUnit: (id: string) => string | null;

  // Alarms
  acknowledgeAlarm: (id: string) => void;
  triggerEquipmentFault: (id: string, fault: any) => void;

  // Audit
  addAuditEntry: (entry: Partial<OmmAuditEntry>) => void;

  // Cut-off
  executeManualCutoff: (notes: string) => void;

  // Derived selectors
  getMovementRows: () => MovementRow[];
  getKpiMetrics: () => OmmKpiMetrics;
  getMovementById: (id: string) => OmmMovement | null;
  getOrderById: (id: string) => OmmOrder | null;
  getEquipmentById: (id: string) => OmmEquipment | null;
  getSecurityUsers: () => SecurityUser[];
  openTelemetryModal: (tankId: string) => void;
  closeTelemetryModal: () => void;
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
  movementTypes: [],
  priorities: [],
  engUnits: [],
  alarms: [],
  auditLog: [],
  cutoffSnapshots: [],
  simulatorState: {
    isRunning: false,
    speedMultiplier: 10,
    simulatedTime: new Date().toISOString(),
    tickCount: 0,
    lastTickAt: new Date().toISOString(),
    activeMovementCount: 0,
  },
  securityUsers: [],
  selectedMovementId: null,
  selectedOrderId: null,
  activeView: 'movements',
  tableFilters: {},
  globalSearch: '',
  tableGroupBy: null,
  isSeeded: false,
  isOrderDialogOpen: false,
  isMovementModalOpen: false,
  isSimulatorModalOpen: false,
  editingOrderId: null,
  editingMovementId: null,
  telemetryTankId: null,
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

      // Subscribe to central SimulationEngine — refresh on every tick
      simulationEngine.subscribe(() => {
        get().refresh();
      });

      // No-op stub for compatibility
      ommSimulationEngine.setOnTick(() => {});

      // Start the global simulation engine if it was running
      const simState = simStateRepo.get();
      if (simState.isRunning) {
        simulationEngine.start(simState.speedMultiplier);
      }
    },

    refresh: () => {
      // Sync OMM equipment state from the unified propertyRepo
      const allProps = globalPropertyRepo.getAll();
      const propsByObj: Record<string, Record<string, string>> = {};
      allProps.forEach((p) => {
        if (!propsByObj[p.targetId]) propsByObj[p.targetId] = {};
        propsByObj[p.targetId][p.name] = p.defaultValue;
      });

      const syncedEquipments = equipmentRepo.getAll().map((eq) => {
        const props = propsByObj[eq.id];
        if (!props) return eq;
        const cap   = parseFloat(props['Capacity']    || String(eq.capacity));
        const lvl   = parseFloat(props['Level']       || String(eq.currentLevel));
        const vol   = parseFloat(props['Volume']      || String(eq.currentVolume));
        const temp  = parseFloat(props['Temperature'] || String(eq.temperature));
        const press = parseFloat(props['Pressure']    || String(eq.pressure));
        const dens  = parseFloat(props['Density']     || String(eq.density));
        const flow  = parseFloat(props['Flow']        || '0');
        const flowIn  = flow > 0 ? flow : 0;
        const flowOut = flow < 0 ? Math.abs(flow) : 0;
        const mass = (vol * dens) / 1000;
        return {
          ...eq,
          capacity: cap,
          currentLevel: lvl,
          currentVolume: vol,
          currentMass: mass,
          temperature: temp,
          pressure: press,
          density: dens,
          flowIn,
          flowOut,
          isSending: flowOut > 0,
          isReceiving: flowIn > 0,
        };
      });

      if (syncedEquipments.length > 0) {
        equipmentRepo.saveAll(syncedEquipments);
      }

      const simState = simStateRepo.get();
      simState.isRunning = simulationEngine.getIsRunning();

      set((state) => {
        state.orders            = orderRepo.getAll();
        state.movements         = movementRepo.getAll();
        state.products          = productRepo.getAll();
        state.areas             = areaRepo.getAll();
        state.equipments        = syncedEquipments;
        state.alignments        = alignmentRepo.getAll();
        state.movementTypes     = movementTypeRepo.getAll();
        state.priorities        = priorityRepo.getAll();
        state.engUnits          = engUnitRepo.getAll();
        state.alarms            = alarmRepo.getAll().slice(-100);
        state.auditLog          = auditRepo.getAll().slice(-500);
        state.cutoffSnapshots   = cutoffRepo.getAll();
        state.simulatorState    = simState;
        const rawSec = localStorage.getItem(STORAGE_KEYS.SECURITY_USERS);
        state.securityUsers     = rawSec ? JSON.parse(rawSec) : [];
        state.isSeeded          = isOmmSeeded();
      });
    },

    clearAll: () => {
      simulationEngine.stop();
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
    setSelectedMovement: (id) => set((s) => { s.selectedMovementId = id; }),
    setSelectedOrder: (id) => set((s) => { s.selectedOrderId = id; }),
    setGlobalSearch: (q) => set((s) => { s.globalSearch = q; }),
    setTableGroupBy: (by) => set((s) => { s.tableGroupBy = by; }),
    setTableFilter: (key, value) => set((s) => { s.tableFilters[key] = value; }),
    clearTableFilters: () => set((s) => { s.tableFilters = {}; }),

    openOrderDialog: (id) => set((s) => {
      s.isOrderDialogOpen = true;
      s.editingOrderId = id ?? null;
    }),
    closeOrderDialog: () => set((s) => {
      s.isOrderDialogOpen = false;
      s.editingOrderId = null;
    }),
    openMovementModal: (id) => set((s) => {
      s.isMovementModalOpen = true;
      s.editingMovementId = id ?? null;
    }),
    closeMovementModal: () => set((s) => {
      s.isMovementModalOpen = false;
      s.editingMovementId = null;
    }),
    openTelemetryModal: (tankId) => set((s) => {
      s.telemetryTankId = tankId;
    }),
    closeTelemetryModal: () => set((s) => {
      s.telemetryTankId = null;
    }),
    openSimulatorModal: () => set((s) => { s.isSimulatorModalOpen = true; }),
    closeSimulatorModal: () => set((s) => { s.isSimulatorModalOpen = false; }),

    // -------------------------------------------------------------------------
    // Simulator
    // -------------------------------------------------------------------------
    toggleSimulator: () => {
      const running = simulationEngine.getIsRunning();
      const simState = simStateRepo.get();
      if (running) {
        simulationEngine.stop();
        simState.isRunning = false;
      } else {
        simulationEngine.start(simState.speedMultiplier);
        simState.isRunning = true;
      }
      simStateRepo.set(simState);
      set((s) => { s.simulatorState.isRunning = !running; });
    },

    setSimulatorSpeed: (mult) => {
      const simState = simStateRepo.get();
      simState.speedMultiplier = mult;
      simStateRepo.set(simState);
      simulationEngine.setSpeed(mult);
      set((s) => { s.simulatorState.speedMultiplier = mult; });
    },

    stepSimulationTime: (minutes) => {
      set((s) => {
        const cur = new Date(s.simulatorState.simulatedTime || new Date().toISOString());
        cur.setMinutes(cur.getMinutes() + minutes);
        s.simulatorState.simulatedTime = cur.toISOString();
      });
    },

    setSimulatedTime: (timeStr) => {
      set((s) => {
        s.simulatorState.simulatedTime = timeStr;
      });
    },

    updateEquipment: (id, data) => {
      const existing = equipmentRepo.getById(id);
      if (!existing) return;
      const updated = { ...existing, ...data };
      equipmentRepo.save(updated);
      get().refresh();
    },

    saveScenario: (name) => {
      console.log('Scenario saved:', name);
    },

    loadScenario: (id) => {
      console.log('Scenario loaded:', id);
    },

    // -------------------------------------------------------------------------
    // Orders CRUD
    // -------------------------------------------------------------------------
    createOrder: (data) => {
      const id = uuid();
      const count = orderRepo.count() + 1;
      const ord: OmmOrder = {
        number: `ORD-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`,
        description: data.description ?? '',
        areaId: data.areaId ?? '',
        status: 'Issued',
        priority: data.priority ?? 'Normal',
        operatorId: data.operatorId ?? '',
        notes: data.notes ?? '',
        movementIds: [],
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
      const count = movementRepo.count() + 1;
      const mov: OmmMovement = {
        orderId: data.orderId ?? '',
        number: `MOV-${String(count).padStart(4, '0')}`,
        description: data.description ?? '',
        typeId: data.typeId ?? 'mtype-t2t',
        productId: data.productId ?? '',
        areaId: data.areaId ?? '',
        originId: data.originId ?? '',
        destinationId: data.destinationId ?? '',
        alignmentId: data.alignmentId ?? null,
        priority: data.priority ?? 'Normal',
        operatorId: data.operatorId ?? '',
        plannedVolume: data.plannedVolume ?? 0,
        plannedFlow: data.plannedFlow ?? 100,
        engUnitId: data.engUnitId ?? 'unit-m3',
        simFlowRate: data.simFlowRate ?? (data.plannedFlow ?? 100),
        simPaused: false,
        completedAt: null,
        closedAt: null,
        canceledAt: null,
        lastUpdatedAt: ts,
        notes: data.notes ?? '',
        createdAt: ts,
        updatedAt: ts,
        ...data,
        id,
        status: 'Issued',    // always Issued on create
        currentVolume: 0,
        currentFlow: 0,
        percentComplete: 0,
        issuedAt: data.issuedAt ?? ts,
        activatedAt: data.activatedAt ?? null,
        etoc: data.etoc ?? null,
      };
      movementRepo.save(mov);

      // Link to order
      if (mov.orderId) {
        const order = orderRepo.getById(mov.orderId);
        if (order && !order.movementIds.includes(id)) {
          orderRepo.save({ ...order, movementIds: [...order.movementIds, id], updatedAt: ts });
        }
      }

      get().addAuditEntry({ entityType: 'Movement', entityId: id, entityNumber: mov.number, action: 'CREATE', description: 'Movimento criado', operator: 'Operador', source: 'UI' });
      get().refresh();
      return id;
    },

    updateMovement: (id, data) => {
      const existing = movementRepo.getById(id);
      if (!existing) return;
      const ts = new Date().toISOString();
      const updated = { ...existing, ...data, updatedAt: ts, lastUpdatedAt: ts };
      movementRepo.save(updated);

      // Sync to global movements so simulationEngine uses updated plannedVolume/status
      const allMovements = movementRepo.getAll();
      syncActiveMovementsToGlobal(allMovements);

      get().addAuditEntry({ entityType: 'Movement', entityId: id, entityNumber: existing.number, action: 'UPDATE', description: 'Movimento atualizado', operator: 'Operador', source: 'UI' });
      get().refresh();
    },

    changeMovementStatus: (id, status) => {
      const existing = movementRepo.getById(id);
      if (!existing) return;

      // Guard: do not change status of Closed or Canceled movements via simulator
      // (this action is always manual from UI, so it's always allowed)
      const ts = new Date().toISOString();
      const update: Partial<OmmMovement> = { status, updatedAt: ts, lastUpdatedAt: ts };
      if (status === 'Active') {
        // Activating: reset flow but keep currentVolume
        update.currentFlow = existing.simFlowRate || existing.plannedFlow || 100;
      }
      if (status === 'Completed') {
        update.completedAt = ts;
        update.currentFlow = 0;
      }
      if (status === 'Closed') {
        update.closedAt = ts;
        update.currentFlow = 0;
      }
      if (status === 'Canceled') {
        update.canceledAt = ts;
        update.currentFlow = 0;
      }
      movementRepo.save({ ...existing, ...update });

      // Sync to global movements
      const allMovements = movementRepo.getAll();
      syncActiveMovementsToGlobal(allMovements);

      get().addAuditEntry({ entityType: 'Movement', entityId: id, entityNumber: existing.number, action: 'STATUS_CHANGE', oldValue: existing.status, newValue: status, description: `Status alterado para ${status}`, operator: 'Operador', source: 'UI' });
      get().refresh();
    },

    deleteMovement: (id) => {
      movementRepo.delete(id);
      // Update order movementIds
      const orders = orderRepo.getAll();
      orders.forEach((o) => {
        if (o.movementIds.includes(id)) {
          orderRepo.save({ ...o, movementIds: o.movementIds.filter((mid) => mid !== id), updatedAt: new Date().toISOString() });
        }
      });
      get().refresh();
    },

    toggleMovementPause: (id) => {
      const mov = movementRepo.getById(id);
      if (!mov) return;
      const updated = { ...mov, simPaused: !mov.simPaused, updatedAt: new Date().toISOString() };
      movementRepo.save(updated);
      // Sync to global
      const allMovements = movementRepo.getAll();
      syncActiveMovementsToGlobal(allMovements);
      get().refresh();
    },

    setMovementFlowRate: (id, rate) => {
      const mov = movementRepo.getById(id);
      if (!mov) return;
      const updated = { ...mov, simFlowRate: rate, updatedAt: new Date().toISOString() };
      movementRepo.save(updated);
      const allMovements = movementRepo.getAll();
      syncActiveMovementsToGlobal(allMovements);
      get().addAuditEntry({ entityType: 'Movement', entityId: id, entityNumber: mov.number, action: 'SIM_PARAM_CHANGE', field: 'simFlowRate', oldValue: String(mov.simFlowRate), newValue: String(rate), description: 'Vazão de simulação alterada', operator: 'Operador', source: 'UI' });
      get().refresh();
    },

    // -------------------------------------------------------------------------
    // Products CRUD
    // -------------------------------------------------------------------------
    createProduct: (data) => {
      const id = uuid();
      const entity: OmmProduct = {
        id,
        code: data.code ?? 'PROD',
        name: data.name ?? 'Novo Produto',
        description: data.description ?? '',
        density: data.density ?? 850,
        engUnitId: data.engUnitId ?? 'unit-m3',
        color: data.color ?? '#64748b',
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
      productRepo.save({ ...existing, ...data, updatedAt: new Date().toISOString() });
      get().refresh();
    },
    deleteProduct: (id) => {
      if (movementRepo.getAll().some((m) => m.productId === id)) {
        return 'Não é possível excluir este produto pois está em uso em movimentos.';
      }
      const existing = productRepo.getById(id);
      productRepo.delete(id);
      get().addAuditEntry({ entityType: 'Config', entityId: id, entityNumber: existing?.code ?? 'PROD', action: 'DELETE', description: `Produto ${existing?.name} excluído`, operator: 'Operador', source: 'UI' });
      get().refresh();
      return null;
    },

    // -------------------------------------------------------------------------
    // Areas CRUD
    // -------------------------------------------------------------------------
    createArea: (data) => {
      const id = uuid();
      const entity: OmmArea = {
        id,
        code: data.code ?? 'AREA',
        name: data.name ?? 'Nova Área',
        description: data.description ?? '',
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
      areaRepo.save({ ...existing, ...data, updatedAt: new Date().toISOString() });
      get().refresh();
    },
    deleteArea: (id) => {
      if (movementRepo.getAll().some((m) => m.areaId === id) || orderRepo.getAll().some((o) => o.areaId === id)) {
        return 'Não é possível excluir esta área pois está em uso.';
      }
      const existing = areaRepo.getById(id);
      areaRepo.delete(id);
      get().addAuditEntry({ entityType: 'Config', entityId: id, entityNumber: existing?.code ?? 'AREA', action: 'DELETE', description: `Área ${existing?.name} excluída`, operator: 'Operador', source: 'UI' });
      get().refresh();
      return null;
    },

    // -------------------------------------------------------------------------
    // Alignments CRUD
    // -------------------------------------------------------------------------
    createAlignment: (data) => {
      const id = uuid();
      const entity: OmmAlignment = {
        id,
        code: data.code ?? 'ALN-000',
        name: data.name ?? 'Novo Alinhamento',
        description: data.description ?? '',
        fromEquipmentId: data.fromEquipmentId ?? '',
        toEquipmentId: data.toEquipmentId ?? '',
        available: data.available ?? true,
        color: data.color ?? '#3b82f6',
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
      alignmentRepo.save({ ...existing, ...data, updatedAt: new Date().toISOString() });
      get().refresh();
    },
    deleteAlignment: (id) => {
      if (movementRepo.getAll().some((m) => m.alignmentId === id)) {
        return 'Não é possível excluir pois o alinhamento está associado a movimentos.';
      }
      const existing = alignmentRepo.getById(id);
      alignmentRepo.delete(id);
      get().addAuditEntry({ entityType: 'Config', entityId: id, entityNumber: existing?.code ?? 'ALN', action: 'DELETE', description: `Alinhamento ${existing?.name} excluído`, operator: 'Operador', source: 'UI' });
      get().refresh();
      return null;
    },

    // -------------------------------------------------------------------------
    // Movement Types CRUD
    // -------------------------------------------------------------------------
    createMovementType: (data) => {
      const id = uuid();
      const entity: OmmMovementTypeConfig = {
        id,
        code: data.code ?? 'Transfer',
        name: data.name ?? 'Novo Tipo',
        category: data.category ?? 'Internal',
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
      movementTypeRepo.save({ ...existing, ...data, updatedAt: new Date().toISOString() });
      get().refresh();
    },
    deleteMovementType: (id) => {
      const existing = movementTypeRepo.getById(id);
      if (existing && movementRepo.getAll().some((m) => m.typeId === id)) {
        return 'Não é possível excluir pois o tipo está associado a movimentos.';
      }
      movementTypeRepo.delete(id);
      get().addAuditEntry({ entityType: 'Config', entityId: id, entityNumber: existing?.code ?? 'TYP', action: 'DELETE', description: `Tipo de movimento ${existing?.name} excluído`, operator: 'Operador', source: 'UI' });
      get().refresh();
      return null;
    },

    // -------------------------------------------------------------------------
    // Priorities CRUD
    // -------------------------------------------------------------------------
    createPriority: (data) => {
      const id = uuid();
      const entity: OmmPriorityConfig = {
        id,
        code: data.code ?? 'Normal',
        name: data.name ?? 'Nova Prioridade',
        color: data.color ?? '#3b82f6',
        level: data.level ?? 2,
        description: data.description ?? '',
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
      priorityRepo.save({ ...existing, ...data, updatedAt: new Date().toISOString() });
      get().refresh();
    },
    deletePriority: (id) => {
      const existing = priorityRepo.getById(id);
      if (existing && (movementRepo.getAll().some((m) => m.priority === existing.code) || orderRepo.getAll().some((o) => o.priority === existing.code))) {
        return 'Não é possível excluir pois a prioridade está associada a ordens ou movimentos.';
      }
      priorityRepo.delete(id);
      get().addAuditEntry({ entityType: 'Config', entityId: id, entityNumber: existing?.code ?? 'PRIO', action: 'DELETE', description: `Prioridade ${existing?.name} excluída`, operator: 'Operador', source: 'UI' });
      get().refresh();
      return null;
    },

    // -------------------------------------------------------------------------
    // Engineering Units CRUD
    // -------------------------------------------------------------------------
    createEngUnit: (data) => {
      const id = uuid();
      const entity: OmmEngUnitConfig = {
        id,
        symbol: data.symbol ?? 'm³',
        name: data.name ?? 'Nova Unidade',
        category: data.category ?? 'Volume',
        decimals: data.decimals ?? 1,
        factor: data.factor ?? 1,
        active: data.active ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      engUnitRepo.save(entity);
      get().addAuditEntry({ entityType: 'Config', entityId: id, entityNumber: entity.symbol, action: 'CREATE', description: `Unidade de engenharia ${entity.name} criada`, operator: 'Operador', source: 'UI' });
      get().refresh();
      return id;
    },
    updateEngUnit: (id, data) => {
      const existing = engUnitRepo.getById(id);
      if (!existing) return;
      engUnitRepo.save({ ...existing, ...data, updatedAt: new Date().toISOString() });
      get().refresh();
    },
    deleteEngUnit: (id) => {
      const existing = engUnitRepo.getById(id);
      if (existing && (movementRepo.getAll().some((m) => m.engUnitId === id) || productRepo.getAll().some((p) => p.engUnitId === id))) {
        return 'Não é possível excluir pois a unidade está em uso.';
      }
      engUnitRepo.delete(id);
      get().addAuditEntry({ entityType: 'Config', entityId: id, entityNumber: existing?.symbol ?? 'UNIT', action: 'DELETE', description: `Unidade de engenharia ${existing?.name} excluída`, operator: 'Operador', source: 'UI' });
      get().refresh();
      return null;
    },

    // -------------------------------------------------------------------------
    // Alarms
    // -------------------------------------------------------------------------
    acknowledgeAlarm: (id) => {
      const alarm = alarmRepo.getById(id);
      if (!alarm) return;
      alarmRepo.save({ ...alarm, acknowledged: true, acknowledgedAt: new Date().toISOString(), acknowledgedBy: 'Operador' });
      get().refresh();
    },

    triggerEquipmentFault: (id, fault) => {
      console.log('Fault triggered for equipment:', id, fault);
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
    // Cut-off
    // -------------------------------------------------------------------------
    executeManualCutoff: (notes) => {
      const equipments = equipmentRepo.getAll();
      const activeMovements = movementRepo.getAll().filter((m) => m.status === 'Active');
      const coNumber = `CO-MAN-${new Date().getFullYear()}-${String(cutoffRepo.count() + 1).padStart(3, '0')}`;

      const inventory = equipments.map((e) => ({
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

      const totalVol  = inventory.reduce((sum, item) => sum + item.volume, 0);
      const totalMass = inventory.reduce((sum, item) => sum + item.mass, 0);

      const midnightToday = new Date();
      midnightToday.setHours(0, 0, 0, 0);
      const midnightTomorrow = new Date(midnightToday.getTime() + 86_400_000);

      // A movement "crosses midnight" when it is active across the day boundary
      const crossingIds = activeMovements
        .filter((m) => {
          const start = m.activatedAt ? new Date(m.activatedAt) : null;
          const end   = m.etoc        ? new Date(m.etoc)        : null;
          if (!start) return false;
          // Started before tomorrow and ends after midnight (or has no known end)
          return start < midnightTomorrow && (end === null || end > midnightToday);
        })
        .map((m) => m.id);

      const snapshot = {
        id: uuid(),
        number: coNumber,
        executedAt: new Date().toISOString(),
        status: 'Validated' as const,
        inventoryByEquipment: inventory,
        movementsActive: activeMovements.map((m) => m.id),
        movementsCrossing: crossingIds,
        totalVolume: totalVol,
        totalMass: totalMass,
        notes: notes || 'Cut-off manual executado via interface',
        validatedBy: 'Operador',
        validatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      cutoffRepo.save(snapshot);
      get().addAuditEntry({ entityType: 'Cutoff', entityId: snapshot.id, entityNumber: coNumber, action: 'CUTOFF', description: `Cut-off manual executado. Snap: ${coNumber}`, operator: 'Operador', source: 'UI' });
      get().refresh();
    },

    // -------------------------------------------------------------------------
    // Derived selectors
    // -------------------------------------------------------------------------
    getMovementRows: (): MovementRow[] => {
      const { movements, orders, products, areas, equipments, alignments, movementTypes, engUnits } = get();
      const orderMap      = new Map(orders.map((o) => [o.id, o]));
      const productMap    = new Map(products.map((p) => [p.id, p]));
      const areaMap       = new Map(areas.map((a) => [a.id, a]));
      const equipMap      = new Map(equipments.map((e) => [e.id, e]));
      const alignMap      = new Map(alignments.map((a) => [a.id, a]));
      const typeMap       = new Map(movementTypes.map((t) => [t.id, t]));
      const engUnitMap    = new Map(engUnits.map((u) => [u.id, u]));

      // Security users for operator names
      const securityUsers = get().getSecurityUsers();
      const userMap = new Map(securityUsers.map((u) => [u.id, u]));

      return movements.map((m): MovementRow => {
        const order     = orderMap.get(m.orderId);
        const product   = productMap.get(m.productId);
        const area      = areaMap.get(m.areaId);
        const origin    = equipMap.get(m.originId);
        const dest      = equipMap.get(m.destinationId);
        const align     = m.alignmentId ? alignMap.get(m.alignmentId) : null;
        const movType   = typeMap.get(m.typeId);
        const engUnit   = engUnitMap.get(m.engUnitId);
        const operator  = userMap.get(m.operatorId);

        return {
          ...m,
          orderNumber:       order?.number ?? '-',
          productName:       product?.name ?? '-',
          productColor:      product?.color ?? '#64748b',
          areaName:          area?.name ?? '-',
          operatorName:      operator?.name ?? '-',
          originTag:         origin?.tag ?? m.originId,
          originName:        origin?.name ?? m.originId,
          destinationTag:    dest?.tag ?? m.destinationId,
          destinationName:   dest?.name ?? m.destinationId,
          alignmentCode:     align?.code ?? null,
          movementTypeName:  movType?.name ?? m.typeId,
          movementTypeColor: movType?.color ?? '#64748b',
          engUnitSymbol:     engUnit?.symbol ?? 'm³',
        };
      });
    },

    getKpiMetrics: (): OmmKpiMetrics => {
      const { orders, movements, alarms, simulatorState } = get();
      const active = movements.filter((m) => m.status === 'Active');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();
      const completedToday = movements.filter(
        (m) => (m.status === 'Completed' || m.status === 'Closed') && (m.completedAt ?? '') >= todayIso,
      );

      return {
        totalOrders:      orders.length,
        totalMovements:   movements.length,
        issuedCount:      movements.filter((m) => m.status === 'Issued').length,
        activeCount:      active.length,
        completedCount:   movements.filter((m) => m.status === 'Completed').length,
        closedCount:      movements.filter((m) => m.status === 'Closed').length,
        canceledCount:    movements.filter((m) => m.status === 'Canceled').length,
        dailyVolume:      completedToday.reduce((sum, m) => sum + m.currentVolume, 0),
        activeAlarms:     alarms.filter((a) => a.isActive && !a.acknowledged).length,
        simulatorRunning: simulatorState.isRunning,
        simulatedTime:    simulatorState.simulatedTime,
      };
    },

    getMovementById: (id) => movementRepo.getById(id),
    getOrderById: (id) => orderRepo.getById(id),
    getEquipmentById: (id) => equipmentRepo.getById(id),

    getSecurityUsers: (): SecurityUser[] => {
      const raw = localStorage.getItem(STORAGE_KEYS.SECURITY_USERS);
      return raw ? JSON.parse(raw) : [];
    },
  })),
);
