// =============================================================================
// OMM – Order Movement Manager — Domain Types
// =============================================================================

// ---------------------------------------------------------------------------
// Enums / Union Types
// ---------------------------------------------------------------------------

export type OmmStatus = 'Issued' | 'Active' | 'Completed' | 'Closed' | 'Canceled';

export type OmmPriority = 'Low' | 'Normal' | 'High' | 'Critical';

export type MovementType =
  | 'Transfer'
  | 'Receipt'
  | 'Dispatch'
  | 'Internal'
  | 'Recirculation'
  | 'Blending'
  | 'Stripping'
  | 'Loading'
  | 'Unloading'
  | 'Sampling';

export type ProductCategory =
  | 'Crude'
  | 'Refined'
  | 'Intermediate'
  | 'Additive'
  | 'Chemical'
  | 'Utility'
  | 'LPG'
  | 'Gas'
  | 'Water'
  | 'Waste';

export type EquipmentType =
  | 'Tank'
  | 'Vessel'
  | 'ProcessUnit'
  | 'Pump'
  | 'Pipeline'
  | 'Manifold'
  | 'Ship'
  | 'Truck'
  | 'RailCar'
  | 'FlowMeter'
  | 'LevelGauge'
  | 'Valve'
  | 'HeatExchanger'
  | 'Area';

export type MeasurementMethod =
  | 'FlowMeter'
  | 'TankGauging'
  | 'OpenTankGauging'
  | 'MassFlowMeter'
  | 'TruckScale'
  | 'ShipDraft'
  | 'Manual'
  | 'Calculated';

export type SimulationMode = 'fixed' | 'ramp' | 'sine' | 'variable' | 'noise';

export type AlarmSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

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
  | 'ACKNOWLEDGE'
  | 'EXPORT'
  | 'IMPORT'
  | 'CUTOFF';

export type EventType =
  | 'THRESHOLD_90PCT'
  | 'FLOW_DEVIATION'
  | 'TEMPERATURE_LIMIT'
  | 'LOW_ACCURACY'
  | 'DENSITY_CHANGE'
  | 'COMM_LOSS'
  | 'METER_FREEZE'
  | 'STATUS_CHANGE'
  | 'CUTOFF_CROSSING'
  | 'COMPLETION'
  | 'ALARM_ACTIVE'
  | 'MIDNIGHT_SELECTION'
  | 'OPERATOR_COMMENT'
  | 'SYSTEM';

export type CutoffStatus = 'Open' | 'Locked' | 'Validated' | 'Sent';

// ---------------------------------------------------------------------------
// Core Entities
// ---------------------------------------------------------------------------

export interface OmmOrder {
  id: string;
  number: string;           // ORD-001
  description: string;
  area: string;             // areaId ref
  status: OmmStatus;
  priority: OmmPriority;
  operator: string;         // operatorId ref
  notes: string;
  movementIds: string[];
  issuedAt: string;
  activatedAt: string | null;
  completedAt: string | null;
  closedAt: string | null;
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OmmMovement {
  id: string;
  orderId: string;
  number: string;           // MOV-001
  description: string;
  // Classification
  type: MovementType;
  category: ProductCategory;
  productId: string;
  areaId: string;
  // Route
  originId: string;
  viaId: string | null;
  destinationId: string;
  alignmentId: string | null;
  meterId: string | null;
  measurementMethod: MeasurementMethod;
  // Status
  status: OmmStatus;
  priority: OmmPriority;
  operatorId: string;
  // Planned quantities
  plannedVolume: number;    // m³
  plannedMass: number;      // t
  plannedFlow: number;      // m³/h
  plannedStartAt: string | null;
  plannedEndAt: string | null;
  // Actuals (simulation computed)
  currentVolume: number;
  currentMass: number;
  currentFlow: number;
  avgFlow: number;
  temperature: number;      // °C
  pressure: number;         // kgf/cm²
  density: number;          // kg/m³ @ operating temp
  density20: number;        // kg/m³ @ 20°C
  vcf: number;              // Volume Correction Factor
  correctedVolume: number;  // m³ @ 20°C
  accuracy: number;         // %
  percentComplete: number;
  ettcMin: number;          // Estimated time to complete (min)
  etoc: string | null;      // ISO timestamp
  initialLevel: number;     // % in origin equipment
  currentLevel: number;     // % in origin equipment (decreasing)
  destLevel: number;        // % in destination equipment (increasing)
  finalLevel: number | null;
  // Simulation config
  simFlowRate: number;      // m³/h
  simNoise: number;         // 0..1
  simMode: SimulationMode;
  simPaused: boolean;
  simSpeedMultiplier: number;
  // Timestamps
  issuedAt: string;
  activatedAt: string | null;
  completedAt: string | null;
  closedAt: string | null;
  canceledAt: string | null;
  lastUpdatedAt: string;
  // Meta
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface OmmProduct {
  id: string;
  code: string;
  name: string;
  category: ProductCategory;
  density20: number;        // kg/m³ @ 20°C reference
  apiGravity: number;
  flashPoint: number;       // °C
  viscosity: number;        // cSt
  color: string;            // CSS color for UI
  unit: string;             // m³ or t
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OmmArea {
  id: string;
  code: string;
  name: string;
  description: string;
  supervisor: string;
  color: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OmmEquipment {
  id: string;
  tag: string;              // e.g. TQ-101
  name: string;
  type: EquipmentType;
  areaId: string;
  productId: string | null; // current product
  capacity: number;         // m³ or t
  currentLevel: number;     // % 0-100
  currentVolume: number;    // m³
  currentMass: number;      // t
  temperature: number;      // °C
  pressure: number;         // kgf/cm²
  density: number;          // kg/m³
  isActive: boolean;
  isSending: boolean;
  isReceiving: boolean;
  latitude: number;         // for plant map
  longitude: number;
  x: number;                // canvas position
  y: number;
  width: number;
  height: number;
  color: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface OmmAlignment {
  id: string;
  code: string;
  name: string;
  description: string;
  fromEquipmentId: string;
  toEquipmentId: string;
  viaEquipmentIds: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OmmOperator {
  id: string;
  code: string;
  name: string;
  role: string;
  area: string;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Event & Alarm Entities
// ---------------------------------------------------------------------------

export interface OmmEvent {
  id: string;
  movementId: string | null;
  orderId: string | null;
  equipmentId: string | null;
  type: EventType;
  severity: AlarmSeverity;
  message: string;
  detail: string;
  value: string | null;
  threshold: string | null;
  acknowledged: boolean;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

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
// Audit Log
// ---------------------------------------------------------------------------

export interface OmmAuditEntry {
  id: string;
  entityType: 'Order' | 'Movement' | 'Equipment' | 'Cutoff' | 'Config';
  entityId: string;
  entityNumber: string;
  action: AuditAction;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  description: string;
  operator: string;
  source: 'UI' | 'Simulation' | 'System' | 'API';
  createdAt: string;
}

// ---------------------------------------------------------------------------
// History (time-series data per movement)
// ---------------------------------------------------------------------------

export interface OmmHistoryPoint {
  id: string;
  movementId: string;
  timestamp: string;
  volume: number;
  mass: number;
  flow: number;
  temperature: number;
  pressure: number;
  density: number;
  level: number;
  accuracy: number;
  quality: 'Good' | 'Bad' | 'Uncertain';
}

// ---------------------------------------------------------------------------
// Cut-off Snapshot
// ---------------------------------------------------------------------------

export interface OmmCutoffSnapshot {
  id: string;
  number: string;            // CO-2024-001
  scheduledAt: string;       // e.g. 01:00 every day
  executedAt: string | null;
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
  movementsActive: string[];   // movement IDs that were active at cutoff
  movementsCrossing: string[]; // movement IDs crossing midnight
  totalVolume: number;
  totalMass: number;
  notes: string;
  validatedBy: string | null;
  validatedAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Simulation Engine State
// ---------------------------------------------------------------------------

export interface OmmSimulatorState {
  isRunning: boolean;
  speedMultiplier: number;   // 1 = real-time, 10 = 10x, 60 = 1min/sec
  simulatedTime: string;     // ISO timestamp (simulated "now")
  tickCount: number;
  lastTickAt: string;
  nextCutoffAt: string;      // next scheduled cutoff ISO
  cutoffHour: number;        // default 1 (01:00)
  activeMovementCount: number;
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
  viaTag: string | null;
  meterTag: string | null;
  alignmentCode: string | null;
}

export interface OmmKpiMetrics {
  totalOrders: number;
  totalMovements: number;
  issuedCount: number;
  activeCount: number;
  completedCount: number;
  closedCount: number;
  canceledCount: number;
  avgAccuracy: number;
  dailyVolume: number;
  dailyMass: number;
  activeAlarms: number;
  operatorsOnline: number;
  simulatorRunning: boolean;
  simulatedTime: string;
  nextCutoffAt: string;
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
  equipments: OmmEquipment[];
  alignments: OmmAlignment[];
  operators: OmmOperator[];
  events: OmmEvent[];
  alarms: OmmAlarm[];
  auditLog: OmmAuditEntry[];
  historyPoints: OmmHistoryPoint[];
  cutoffSnapshots: OmmCutoffSnapshot[];
  simulatorState: OmmSimulatorState;

  // UI state
  selectedMovementId: string | null;
  selectedOrderId: string | null;
  detailPanelTab: string;
  activeView: 'movements' | 'plant' | 'timeline' | 'inventory' | 'cutoff' | 'admin';
  isDetailPanelOpen: boolean;
  tableGroupBy: string | null;
  tableFilters: Record<string, string>;
  globalSearch: string;
  columnVisibility: Record<string, boolean>;
  isSeeded: boolean;

  // Dialog states
  isOrderDialogOpen: boolean;
  isMovementDialogOpen: boolean;
  editingOrderId: string | null;
  editingMovementId: string | null;
}
