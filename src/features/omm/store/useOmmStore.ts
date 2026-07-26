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
} from '../types';
import {
  orderRepo,
  movementRepo,
  productRepo,
  areaRepo,
  equipmentRepo,
  alignmentRepo,
  operatorRepo,
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

  // Navigation
  setActiveView: (view: OmmStoreState['activeView']) => void;
  setSelectedMovement: (id: string | null) => void;
  setSelectedOrder: (id: string | null) => void;
  setDetailPanelTab: (tab: string) => void;
  setDetailPanelOpen: (open: boolean) => void;
  setGlobalSearch: (q: string) => void;
  setTableGroupBy: (field: string | null) => void;
  setColumnVisibility: (cols: Record<string, boolean>) => void;

  // Simulator
  toggleSimulator: () => void;
  setSimulatorSpeed: (mult: number) => void;

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
    // Navigation
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
