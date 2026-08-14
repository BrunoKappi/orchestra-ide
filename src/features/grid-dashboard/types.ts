import type { TankGeometryType, FieldBinding } from '../../types/domain';

export type CardStatus = 'NORMAL' | 'ATENÇÃO' | 'CRITICAL';

/**
 * Discriminator for the five card types in the Grid Designer.
 * - 'equipment' / undefined → IndustrialTankCard (legacy default)
 * - 'trend'     → TrendChartCard
 * - 'command'   → CommandCard
 * - 'alert'     → AlertLocalCard
 * - 'kpi'       → KpiCard
 */
export type GridCardType = 'equipment' | 'trend' | 'command' | 'alert' | 'kpi';

/** Configuration specific to Command cards */
export interface CommandCardConfig {
  objectId: string;
  objectName: string;
  propertyName: string;
  propertyLabel: string;
  /** Detected data type of the property: 'Boolean' | 'Float' | 'Integer' | 'Enum' | 'String' */
  dataType: string;
  /** Enum options when dataType === 'Enum' */
  enumOptions?: string[];
  commandLabel: string;
  /** If true, shows a confirmation dialog before executing the command */
  confirmBeforeExecute: boolean;
}

/** Configuration specific to Alert Local cards */
export interface AlertCardConfig {
  /** 'all' = show all occurrences; 'object' = filter by relatedObjectId; 'area' = filter by responsibleAreas */
  scopeType: 'all' | 'object' | 'area';
  /** ID of the object or area to filter by (null when scopeType = 'all') */
  scopeId: string | null;
  scopeName: string;
  /** Whether to show resolved/expired occurrences */
  showResolved: boolean;
  /** Maximum number of rows to display */
  maxItems: number;
}

/** Configuration specific to KPI / Indicator cards */
export interface KpiCardConfig {
  objectId: string;
  objectName: string;
  propertyName: string;
  propertyLabel: string;
  unit: string;
  /** Optional target / goal value for the progress bar */
  goalValue: number | null;
  /**
   * How to interpret the goal:
   * 'max'       = higher is better (fill bar fills toward goal)
   * 'min'       = lower is better (bar inverts — over-goal is bad)
   * 'reference' = neutral comparison (show delta only, no color judgment)
   */
  goalType: 'max' | 'min' | 'reference';
  decimalPlaces: number;
}

export interface TankCardData {
  id: string;

  /** Discriminates between the five card types. Undefined = legacy equipment card. */
  cardType?: GridCardType;

  /** ID of the ObjectEntity this card is bound to */
  objectId?: string;

  // Display fields (resolved at render time from objectId's properties)
  tag: string;
  title: string;
  description: string;
  category: string;

  /** Geometry type — controls which SVG is drawn */
  geometryType: TankGeometryType;

  /** Level fill percentage 0–100, read from the object's LevelPercent property */
  levelPercent: number;

  /** Operational status — drives status color */
  status: CardStatus;
  footerLabel: string;

  // Custom visual overrides (per-card, not from object model)
  statusColor?: string;
  borderColor?: string;

  /**
   * Field bindings resolved from the object's graphicConfig.
   * Each entry maps a display label to a real property name + unit.
   */
  fieldBindings: FieldBinding[];

  // Optional simulation/mock fields
  pressure?: number;
  pressureUnit?: string;
  temperature?: number;
  strappingFactor?: number;
  calculatedVolume?: number;
  volumeUnit?: string;
  visibleFields?: {
    showLevel: boolean;
    showPressure: boolean;
    showTemperature: boolean;
    showStrappingFactor: boolean;
    showVolume: boolean;
  };

  // Grid position (1-indexed)
  startRow: number;
  startCol: number;
  rowSpan: number;
  colSpan: number;

  /** Legacy trend flag — kept for backward compatibility */
  isTrend?: boolean;
  trendProperties?: Array<{
    objectId: string;
    propertyName: string;
    label: string;
    color?: string;
  }>;

  /** Present when cardType === 'command' */
  commandConfig?: CommandCardConfig;

  /** Present when cardType === 'alert' */
  alertConfig?: AlertCardConfig;

  /** Present when cardType === 'kpi' */
  kpiConfig?: KpiCardConfig;
}

export interface GridConfig {
  screenName: string;
  rows: number;
  cols: number;
}

export interface GridLayoutState {
  config: GridConfig;
  cards: TankCardData[];
}

export interface GridScreenEntity {
  id: string;
  name: string;
  rows: number;
  cols: number;
  cards: TankCardData[];
  createdAt: string;
  updatedAt: string;
}
