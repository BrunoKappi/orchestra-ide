// =============================================================================
// OMM – Order Movement Manager — Domain Types (Simplified)
// =============================================================================

// ---------------------------------------------------------------------------
// Enums / Union Types
// ---------------------------------------------------------------------------

export type OmmStatus = 'Issued' | 'Active' | 'Completed' | 'Closed' | 'Canceled';

export type OmmPriority = 'Low' | 'Normal' | 'High' | 'Critical';

export type MovementType =
  | 'TankToTank'
  | 'TankToSphere'
  | 'SphereToTank'
  | 'TankToArea'
  | 'AreaToTank'
  | 'AreaToArea'
  | 'Loading'
  | 'Unloading'
  | 'Recirculation';

export type EquipmentType =
  | 'Tank'
  | 'Vessel'
  | 'Sphere'
  | 'Pump'
  | 'Pipeline'
  | 'Manifold'
  | 'Ship'
  | 'Truck'
  | 'RailCar'
  | 'Area';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'STATUS_CHANGE'
  | 'ACTIVATE'
  | 'COMPLETE'
  | 'CLOSE'
  | 'CANCEL'
  | 'DELETE'
  | 'SIM_START'
  | 'SIM_STOP'
  | 'SIM_PARAM_CHANGE'
  | 'COMMENT'
  | 'CUTOFF';

export type AlarmSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type CutoffStatus = 'Open' | 'Locked' | 'Validated' | 'Sent';

// ---------------------------------------------------------------------------
// Core Entities
// ---------------------------------------------------------------------------

export interface OmmOrder {
  id: string;
  number: string;          // ORD-001
  description: string;
  areaId: string;          // areaId ref
  status: OmmStatus;
  priority: OmmPriority;
  operatorId: string;      // userId ref from Security module
  notes: string;
  movementIds: string[];
  completedAt: string | null;
  closedAt: string | null;
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OmmMovement {
  id: string;
  orderId: string;
  number: string;          // MOV-0001
  description: string;
  // Classification
  typeId: string;          // ref to OmmMovementTypeConfig.id
  productId: string;
  areaId: string;
  // Route
  originId: string;        // objectRepo ID (real Orquestra equipment)
  destinationId: string;   // objectRepo ID (real Orquestra equipment)
  alignmentId: string | null;
  // Status
  status: OmmStatus;
  priority: OmmPriority;
  operatorId: string;      // userId ref from Security module
  // Planned quantities
  plannedVolume: number;   // m³
  plannedFlow: number;     // m³/h
  engUnitId: string;       // ref to OmmEngUnitConfig.id
  // Actuals (simulation computed — never set manually)
  currentVolume: number;   // m³ — written by SimulationEngine
  currentFlow: number;     // m³/h — written by SimulationEngine
  percentComplete: number; // 0-100 — written by SimulationEngine
  // Simulation config (per-movement)
  simFlowRate: number;     // m³/h override for simulation
  simPaused: boolean;      // pauses this specific movement in simulation
  // Timestamps
  issuedAt?: string;
  activatedAt?: string | null;
  etoc?: string | null;
  completedAt: string | null;
  closedAt: string | null;
  canceledAt: string | null;
  lastUpdatedAt: string;
  // Simulator scenario configurations
  plannedStartAt?: string;
  plannedEndAt?: string;
  simSpeedMultiplier?: number;
  type?: string;
  // Meta
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface OmmProduct {
  id: string;
  code: string;
  name: string;
  description: string;
  density: number;         // kg/m³ reference density
  engUnitId: string;       // default engineering unit
  color: string;           // CSS color for UI identification
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OmmArea {
  id: string;
  code: string;
  name: string;
  description: string;
  color: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// OmmEquipment is a read-only mirror of objectRepo — not edited in OMM Admin
export interface OmmEquipment {
  id: string;
  tag: string;
  name: string;
  type: EquipmentType;
  areaId: string;
  productId: string | null;
  capacity: number;        // m³
  currentLevel: number;    // % 0-100
  currentVolume: number;   // m³
  currentMass: number;     // t
  temperature: number;     // °C
  pressure: number;        // bar
  density: number;         // kg/m³
  isActive: boolean;
  isSending: boolean;
  isReceiving: boolean;
  flowIn: number;          // m³/h
  flowOut: number;         // m³/h
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
  simMode?: 'Auto' | 'Manual';
  autoConfig?: {
    level?: any;
    temperature?: any;
    pressure?: any;
    density?: any;
    flowIn?: any;
    flowOut?: any;
  };
}

export interface OmmAlignment {
  id: string;
  code: string;
  name: string;
  description: string;
  fromEquipmentId: string; // objectRepo ID
  toEquipmentId: string;   // objectRepo ID
  available: boolean;
  color: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Audit Log
// ---------------------------------------------------------------------------

export interface OmmAuditEntry {
  id: string;
  entityType: 'Order' | 'Movement' | 'Cutoff' | 'Config';
  entityId: string;
  entityNumber: string;
  action: AuditAction;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  description: string;
  operator: string;
  source: 'UI' | 'Simulation' | 'System';
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Alarm (minimal for OMM context)
// ---------------------------------------------------------------------------

export interface OmmAlarm {
  id: string;
  movementId: string | null;
  equipmentId: string | null;
  type: string;
  severity: AlarmSeverity;
  message: string;
  isActive: boolean;
  acknowledged: boolean;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  activatedAt: string;
  clearedAt: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Cut-off Snapshot
// ---------------------------------------------------------------------------

export interface OmmCutoffSnapshot {
  id: string;
  number: string;          // CO-2024-001
  executedAt: string;
  status: CutoffStatus;
  inventoryByEquipment: Array<{
    equipmentId: string;
    tag: string;
    name: string;
    productId: string;
    level: number;
    volume: number;
    mass: number;
    temperature: number;
    density: number;
  }>;
  movementsActive: string[];
  movementsCrossing: string[];
  totalVolume: number;
  totalMass: number;
  notes: string;
  validatedBy: string | null;
  validatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Simulation State
// ---------------------------------------------------------------------------

export interface OmmSimulatorState {
  isRunning: boolean;
  speedMultiplier: number; // 1 = real-time, 10 = 10x, 60 = 1min/sec
  simulatedTime: string;
  tickCount: number;
  lastTickAt: string;
  activeMovementCount: number;
  nextCutoffAt?: string | null;
}

// ---------------------------------------------------------------------------
// Auxiliary Entities
// ---------------------------------------------------------------------------

export interface OmmMovementTypeConfig {
  id: string;
  code: string;
  name: string;
  category: string;        // e.g. 'Internal', 'External', 'Loading'
  color: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OmmPriorityConfig {
  id: string;
  code: string;
  name: string;
  color: string;
  level: number;           // 1=Low, 2=Normal, 3=High, 4=Critical
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OmmEngUnitConfig {
  id: string;
  symbol: string;          // m³, m³/h, °C, bar, kg/m³, %
  name: string;
  category: string;        // Volume, Flow, Temperature, Pressure, Density
  decimals: number;        // decimal places to display
  factor: number;          // conversion factor (1 = base unit)
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Derived / UI Models
// ---------------------------------------------------------------------------

export interface MovementRow extends OmmMovement {
  // Denormalized for table display
  orderNumber: string;
  productName: string;
  productColor: string;
  areaName: string;
  operatorName: string;
  originTag: string;
  originName: string;
  destinationTag: string;
  destinationName: string;
  alignmentCode: string | null;
  movementTypeName: string;
  movementTypeColor: string;
  engUnitSymbol: string;
}

export interface OmmKpiMetrics {
  totalOrders: number;
  totalMovements: number;
  issuedCount: number;
  activeCount: number;
  completedCount: number;
  closedCount: number;
  canceledCount: number;
  dailyVolume: number;
  activeAlarms: number;
  simulatorRunning: boolean;
  simulatedTime: string;
}

// ---------------------------------------------------------------------------
// Store State Interface
// ---------------------------------------------------------------------------

export interface OmmStoreState {
  // Core data
  orders: OmmOrder[];
  movements: OmmMovement[];
  products: OmmProduct[];
  areas: OmmArea[];
  equipments: OmmEquipment[];  // read-only mirror from objectRepo
  alignments: OmmAlignment[];
  movementTypes: OmmMovementTypeConfig[];
  priorities: OmmPriorityConfig[];
  engUnits: OmmEngUnitConfig[];
  alarms: OmmAlarm[];
  auditLog: OmmAuditEntry[];
  cutoffSnapshots: OmmCutoffSnapshot[];
  simulatorState: OmmSimulatorState;
  securityUsers: Array<{ id: string; name: string; login: string; role: string; areaId?: string; status: string }>;

  // UI state
  selectedMovementId: string | null;
  selectedOrderId: string | null;
  activeView: 'overview' | 'movements' | 'plant' | 'timeline' | 'inventory' | 'cutoff' | 'admin' | 'calculator';
  tableFilters: Record<string, string>;
  globalSearch: string;
  tableGroupBy: string | null;
  isSeeded: boolean;

  // Dialog states
  isOrderDialogOpen: boolean;
  isMovementModalOpen: boolean;       // the new central movement modal
  isSimulatorModalOpen: boolean;
  editingOrderId: string | null;
  editingMovementId: string | null;   // null = create mode
  telemetryTankId: string | null;
}
