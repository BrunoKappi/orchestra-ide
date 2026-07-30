export type CardStatus = 'NORMAL' | 'ATENÇÃO' | 'CRITICAL';

export interface CardVisibleFields {
  showLevel: boolean;
  showPressure: boolean;
  showTemperature: boolean;
  showStrappingFactor: boolean;
  showVolume: boolean;
}

export interface TankCardData {
  id: string;
  tag: string;
  category: string;
  title: string;
  description: string;
  
  // Simulated values
  levelPercent: number; // e.g. 80.2
  pressure: number; // e.g. 5.99 mbar
  pressureUnit: string; // mbar
  temperature: number; // e.g. 28.26 °C
  strappingFactor: number; // e.g. 249.31 m³/ %
  calculatedVolume: number; // e.g. 20120.6 m³
  volumeUnit: string; // m³
  status: CardStatus;
  footerLabel: string; // e.g. "Arqueamento"
  
  // Custom visual settings
  statusColor?: string; // hex or preset
  borderColor?: string;
  visibleFields: CardVisibleFields;

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
