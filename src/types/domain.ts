export type DataType =
  | 'String'
  | 'Boolean'
  | 'Integer'
  | 'Float'
  | 'Date'
  | 'Enum'
  | 'Array'
  | 'Object';

export * from './mock';
export * from './flow';
import type { FlowchartEntity } from './flow';


export type ScriptTrigger =
  | 'Initialize'
  | 'Execute'
  | 'Shutdown'
  | 'Value Changed'
  | 'On True'
  | 'On False'
  | 'While True'
  | 'Manual'
  | 'Custom';

export type EntityType = 'template' | 'instance';

export interface TemplateEntity {
  id: string;
  name: string;
  parentTemplateId: string | null;
  description: string;
  graphicConfig?: EquipmentGraphicConfig;
  strappingConfig?: TankStrappingConfig;
  createdAt: string;
  updatedAt: string;
}

export interface ObjectEntity {
  id: string;
  name: string;
  templateId: string;
  description: string;
  isDeployed?: boolean;
  graphicConfig?: EquipmentGraphicConfig;
  strappingConfig?: TankStrappingConfig;
  createdAt: string;
  updatedAt: string;
}

export type TankGeometryType =
  | 'vertical_cylindrical'
  | 'horizontal_cylindrical'
  | 'spherical'
  | 'pressurized';

// ----------------------------------------------------------------------------
// Tank Strapping / Capacity Table Types (API MPMS Chapter 2.2A — simplified)
// ----------------------------------------------------------------------------

/** A single point in the capacity table: measured level → corresponding volume */
export interface StrappingPoint {
  /** Measured level value (unit defined by TankStrappingConfig.levelUnit) */
  level: number;
  /** Volume at the given level (unit defined by TankStrappingConfig.volumeUnit) */
  volume: number;
}

export type StrappingLevelUnit = 'mm' | 'cm' | 'm' | '%';
export type StrappingVolumeUnit = 'm³' | 'bbl' | 'L';

/**
 * Simplified tank strapping / capacity table configuration.
 * Associates a tank with its level-to-volume relationship for inventory management.
 * Stored directly on TemplateEntity or ObjectEntity (same pattern as graphicConfig).
 */
export interface TankStrappingConfig {
  /** Engineering unit used for the level column */
  levelUnit: StrappingLevelUnit;
  /** Engineering unit used for the volume column */
  volumeUnit: StrappingVolumeUnit;
  /** Total reference height of the tank shell (meters) */
  referenceHeight: number;
  /** Nominal working capacity (in volumeUnit) */
  nominalCapacity: number;
  /** Ordered list of capacity table points — at least 2 required */
  points: StrappingPoint[];
  /** Optional technical notes about the calibration */
  notes?: string;
}

/**
 * Binding between a visual field in the equipment card and a property name
 * on the object. The component resolves this against the instance's real properties at runtime.
 */
export interface FieldBinding {
  /** Name of the property on the object (e.g. 'LevelPercent', 'Temperature') */
  propertyName: string;
  /** Display label shown in the card header */
  label: string;
  /** Engineering unit displayed next to the value */
  unit: string;
  /** Number of decimal places for numeric values */
  decimalPlaces: number;
  /** Whether this field is shown on the card */
  visible: boolean;
}

export interface EquipmentGraphicConfig {
  geometryType: TankGeometryType;
  /**
   * @deprecated Use fieldBindings instead. Kept for legacy compatibility.
   */
  visibleFields: {
    tag: boolean;
    description: boolean;
    product: boolean;
    level: boolean;
    volume: boolean;
    temperature: boolean;
    pressure: boolean;
    flow: boolean;
    density: boolean;
    status: boolean;
    alarm: boolean;
  };
  /**
   * Ordered list of field-to-property bindings for the card display.
   * Each visible binding resolves against the instance's real property values.
   */
  fieldBindings: FieldBinding[];
  fieldOrder?: string[];
  decimalPlaces: number;
  showLevelFill: boolean;
  showFooter: boolean;
}

export interface ProductEntity {
  id: string;
  code: string;
  name: string;
  description: string;
  density: number;
  densityUnit: string;
  category: string;
  physicalState: 'Líquido' | 'Gás' | 'Pressurizado';
  color: string;
}

export interface AreaEntity {
  id: string;
  code: string;
  name: string;
  description: string;
}


export interface PropertyHistoryConfig {
  enabled: boolean;
  /** 'interval' = fixed sampling period; 'on_change' = record on every value change */
  collectionMode?: 'interval' | 'on_change';
  intervalMs?: number;       // minimum 1000 ms
  periodMs?: number;
  storageType?: string;
  retentionMs?: number;      // e.g. 86400000 = 24 h
  maxSamples?: number;       // e.g. 10000
  deadband?: number;         // minimum change magnitude to record a new sample
  compression?: boolean;
  engineeringUnit?: string;
  notes?: string;
}

export type SampleQuality = 'Good' | 'Bad' | 'Uncertain';

export interface HistorySample {
  timestamp: string;        // ISO 8601
  value: string;
  quality: SampleQuality;
  source: 'simulation' | 'runtime' | 'manual';
  objectId: string;
  propertyId: string;
}

export interface PropertyEntity {
  id: string;
  targetId: string;
  targetType: EntityType;
  name: string;
  dataType: DataType;
  defaultValue: string;
  description: string;
  category?: string;
  alarmConfig?: PropertyAlarmConfig;
  historyConfig?: PropertyHistoryConfig;
  opcTagPath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScriptEntity {
  id: string;
  targetId: string;
  targetType: EntityType;
  name: string;
  trigger: ScriptTrigger;
  triggerExpression: string; // Expression for value-based triggers (e.g. "me.Level > 80")
  loopTimeMs: number | null;  // Loop interval in ms — for Execute and While True
  code: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeploymentFolderEntity {
  id: string;
  name: string;
  parentFolderId: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeploymentNodeEntity {
  id: string;
  type: 'folder' | 'object';
  targetId: string;
  parentFolderId: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Derived/Merged models for UI rendering
export interface MergedProperty extends PropertyEntity {
  isInherited: boolean;
  sourceTemplateId?: string;
  sourceTemplateName?: string;
  isOverridden?: boolean;
}

export interface MergedScript extends ScriptEntity {
  isInherited: boolean;
  sourceTemplateId?: string;
  sourceTemplateName?: string;
  isOverridden?: boolean;
}

export interface DerivationTreeNode {
  id: string;
  name: string;
  type: 'root_template' | 'derived_template' | 'instance';
  entityId: string;
  parentTemplateId: string | null;
  description: string;
  children: DerivationTreeNode[];
}

export interface DeploymentTreeNode {
  id: string;
  name: string;
  type: 'folder' | 'object' | 'unassigned_root';
  targetId: string;
  parentFolderId: string | null;
  order: number;
  children: DeploymentTreeNode[];
  objectDetail?: ObjectEntity;
  templateName?: string;
}

export interface ExportDataPayload {
  version: string;
  exportedAt: string;
  rootEntity: {
    type: EntityType;
    data: TemplateEntity | ObjectEntity;
  };
  templates: TemplateEntity[];
  objects: ObjectEntity[];
  properties: PropertyEntity[];
  scripts: ScriptEntity[];
  deploymentFolders?: DeploymentFolderEntity[];
  deploymentNodes?: DeploymentNodeEntity[];
  associatedWidgets?: AssociatedWidgetEntity[];
  flowcharts?: FlowchartEntity[];
}

export interface AssociatedWidgetEntity {
  id: string;
  targetId: string;
  targetType: EntityType;
  widgetId: string;
  mappings: {
    [widgetPropId: string]: {
      type: 'property' | 'fixed';
      value: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface MergedAssociatedWidget extends AssociatedWidgetEntity {
  widgetName: string;
  isInherited: boolean;
  sourceTemplateId?: string;
  sourceTemplateName?: string;
  isOverridden?: boolean;
}

// ----------------------------------------------------------------------------
// Graphic Widget / Supervisory SCADA Types
// ----------------------------------------------------------------------------

export type WidgetCustomPropertyDataType =
  | 'Float'
  | 'Integer'
  | 'Boolean'
  | 'String'
  | 'Color';

export interface WidgetCustomProperty {
  id: string;
  name: string;
  dataType: WidgetCustomPropertyDataType;
  defaultValue: string;
  description: string;
  // Prepared for future 1-to-1 association with Object Instance attributes
  mappedObjectPropertyId?: string | null;
  mappedObjectPropertyName?: string | null;
}

export type WidgetElementType =
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'text'
  | 'status_light'
  | 'gauge'
  | 'tank'
  | 'variable_display'
  | 'image';


export type WidgetBindingProperty =
  | 'fill'
  | 'stroke'
  | 'textContent'
  | 'value'
  | 'visibility';

export interface WidgetElementBinding {
  id: string;
  property: WidgetBindingProperty;
  customPropId: string;
  // Boolean/Discrete bindings
  trueValue?: string;   // e.g. "#22c55e" or "RUNNING"
  falseValue?: string;  // e.g. "#ef4444" or "STOPPED"
  // Analog range bindings (for Float/Integer)
  analogRanges?: WidgetAnalogRange[];
}

// Analog range entry: "if val between lo and hi → use color/text"
export interface WidgetAnalogRange {
  id: string;
  lo: number;
  hi: number;
  value: string;  // color hex or text depending on property
  label?: string; // optional description for the range
}

export interface FillLevelConfig {
  minValue: number;
  maxValue: number;
  fillColor: string;
  emptyColor: string;
  direction: 'bottom-up' | 'top-down' | 'left-right' | 'right-left';
}

export interface DynamicRule {
  id: string;
  type: 'fill' | 'stroke' | 'visibility' | 'fill_level';
  variableId: string;
  config: any;
}

export interface WidgetElement {
  id: string;
  name: string;
  type: WidgetElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  cornerRadius?: number;
  fontSize?: number;
  textContent?: string;
  textColor?: string;
  textAlignment?: 'left' | 'center' | 'right';
  // Variable display specific
  showLabel?: boolean;
  showUnit?: boolean;
  unit?: string;
  decimalPlaces?: number;
  conversionFactor?: number;  // raw * factor = displayed value
  customLabel?: string;
  imageUri?: string;
  bindings: WidgetElementBinding[];
  dynamics?: DynamicRule[];
}

export interface WidgetEntity {
  id: string;
  name: string;
  description: string;
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  gridSize: number;
  elements: WidgetElement[];
  customProperties: WidgetCustomProperty[];
  createdAt: string;
  updatedAt: string;
}

export interface WidgetFolderEntity {
  id: string;
  name: string;
  parentFolderId: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface WidgetNodeEntity {
  id: string;
  type: 'folder' | 'widget';
  targetId: string;
  parentFolderId: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface WidgetTreeNode {
  id: string;
  name: string;
  type: 'folder' | 'widget' | 'unassigned_root';
  targetId: string;
  parentFolderId: string | null;
  order: number;
  children: WidgetTreeNode[];
  widgetDetail?: WidgetEntity;
}

// ----------------------------------------------------------------------------
// Screen Designer Types
// ----------------------------------------------------------------------------

export type ScreenElementType =
  | 'widget-instance'
  | 'variable-display'
  | 'rectangle'
  | 'circle'
  | 'text'
  | 'image'
  | 'line';

export interface ScreenElement {
  id: string;
  name: string;
  type: ScreenElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  rotation: number;

  // Widget instance binding
  objectId?: string;
  widgetId?: string;
  mappings?: {
    [widgetPropId: string]: {
      type: 'property' | 'fixed';
      value: string;
    };
  };

  // Variable display
  propertyName?: string;
  showLabel?: boolean;
  showUnit?: boolean;
  unit?: string;
  fontSize?: number;
  textColor?: string;
  decimalPlaces?: number;
  customLabel?: string;
  conversionFactor?: number;
  backgroundColor?: string;
  padding?: number;

  // Shape styles
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  cornerRadius?: number;
  textContent?: string;
  textAlignment?: 'left' | 'center' | 'right';

  // Image
  imageUri?: string;

  // Line connections
  fromElementId?: string;
  toElementId?: string;
  fromX?: number;
  fromY?: number;
  toX?: number;
  toY?: number;
  arrowEnd?: boolean;
  arrowStart?: boolean;
}

export interface ScreenEntity {
  id: string;
  name: string;
  description: string;
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  gridSize: number;
  elements: ScreenElement[];
  createdAt: string;
  updatedAt: string;
}

export interface ScreenFolderEntity {
  id: string;
  name: string;
  parentFolderId: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScreenNodeEntity {
  id: string;
  type: 'folder' | 'screen';
  targetId: string;
  parentFolderId: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScreenTreeNode {
  id: string;
  name: string;
  type: 'folder' | 'screen' | 'unassigned_root';
  targetId: string;
  parentFolderId: string | null;
  order: number;
  children: ScreenTreeNode[];
  screenDetail?: ScreenEntity;
}

// ----------------------------------------------------------------------------
// SCADA Alarm System Types
// ----------------------------------------------------------------------------

export type AlarmConditionType =
  | 'HH'
  | 'H'
  | 'L'
  | 'LL'
  | 'Equal'
  | 'NotEqual'
  | 'BitTrue'
  | 'BitFalse'
  | 'TextMatch';

export interface AlarmRule {
  id: string;
  type: AlarmConditionType;
  enabled: boolean;
  blocked: boolean;
  compareValue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  priority: number;
  message: string;
  color: string;
  icon: string;
  activationDelay: number; // in seconds
  returnDelay: number;     // in seconds
  hysteresis: number;
  requireAck: boolean;
  historical: boolean;
}

export interface PropertyAlarmConfig {
  enabled: boolean;
  rules: AlarmRule[];
}

export interface AlarmEvent {
  id: string;
  ruleId: string;
  objectId: string;
  objectName: string;
  propertyName: string;
  currentValue: string;
  configuredValue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  priority: number;
  message: string;
  color: string;
  icon: string;
  activatedAt: string;
  acknowledgedAt: string | null;
  clearedAt: string | null;
  ackedBy: string | null;
  durationMs: number | null;
  status:
    | 'Active Unacknowledged'
    | 'Active Acknowledged'
    | 'Cleared Unacknowledged'
    | 'Cleared Acknowledged';
}


