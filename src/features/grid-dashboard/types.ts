import type { TankGeometryType, FieldBinding } from '../../types/domain';

export type CardStatus = 'NORMAL' | 'ATENÇÃO' | 'CRITICAL';

export interface TankCardData {
  id: string;
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
