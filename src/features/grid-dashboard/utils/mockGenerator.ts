import type { TankCardData, CardStatus } from '../types';

const TANK_PRESETS = [
  { tag: 'TQ-301', category: 'TANQUE CILÍNDRICO', title: 'Nafta Central (TQ-301)', description: 'Armazenamento de Nafta Pesada', product: 'Nafta Central', baseVol: 20000, footerLabel: 'Arqueamento' },
  { tag: 'TQ-102', category: 'TANQUE VERTICAL', title: 'Diesel S10 (TQ-102)', description: 'Tanque de Estocagem Principal', product: 'Diesel S-10', baseVol: 45000, footerLabel: 'Medição Radar' },
  { tag: 'TQ-205', category: 'TANQUE ATMOSFÉRICO', title: 'Etanol Anidro (TQ-205)', description: 'Parque de Biocombustíveis', product: 'Etanol Anidro', baseVol: 18000, footerLabel: 'Pressão Positiva' },
  { tag: 'TQ-408', category: 'ESFERA GLP', title: 'Gás Liquefeito (TQ-408)', description: 'Armazenamento Pressurizado', product: 'GLP Especial', baseVol: 8500, footerLabel: 'Pressurizado' },
  { tag: 'TQ-510', category: 'TANQUE DE TETO FLUTUANTE', title: 'Óleo Cru Pre-Sal (TQ-510)', description: 'Recebimento de Plataforma', product: 'Óleo Cru', baseVol: 80000, footerLabel: 'Telemetria' },
  { tag: 'TQ-104', category: 'TANQUE CILÍNDRICO', title: 'Gasolina A (TQ-104)', description: 'Pátio de Mistura 04', product: 'Gasolina Formulação', baseVol: 32000, footerLabel: 'Arqueamento' },
  { tag: 'TQ-602', category: 'TANQUE REFRIGERADO', title: 'Amônia Anidra (TQ-602)', description: 'Estoque Criogênico', product: 'Amônia Industrial', baseVol: 12500, footerLabel: 'Crio-Sensor' },
  { tag: 'TQ-703', category: 'ESFERA PRESSURIZADA', title: 'Butano Grau Químico (TQ-703)', description: 'Vasos de Pressão A', product: 'Butano Liquefeito', baseVol: 6400, footerLabel: 'Valvula Seg.' },
  { tag: 'TQ-809', category: 'TANQUE VERTICAL', title: 'Querosene de Aviação (TQ-809)', description: 'Pátio JET A-1', product: 'JET A-1 QAV', baseVol: 28000, footerLabel: 'Qualidade OK' },
  { tag: 'TQ-901', category: 'TANQUE CILÍNDRICO', title: 'Biodiesel B100 (TQ-901)', description: 'Estoque Renovável', product: 'Biodiesel Puro', baseVol: 15000, footerLabel: 'Medição Laser' },
];

const STATUS_LIST: CardStatus[] = ['NORMAL', 'NORMAL', 'NORMAL', 'ATENÇÃO', 'CRITICAL'];

export function generateRandomTankCard(
  startRow: number,
  startCol: number,
  rowSpan: number,
  colSpan: number,
  existingCount: number = 0
): TankCardData {
  const presetIndex = (existingCount + Math.floor(Math.random() * 3)) % TANK_PRESETS.length;
  const preset = TANK_PRESETS[presetIndex];

  const levelPercent = Number((Math.random() * 85 + 10).toFixed(1)); // 10.0% to 95.0%
  const pressure = Number((Math.random() * 12 + 0.5).toFixed(2)); // 0.50 to 12.50 mbar
  const temperature = Number((Math.random() * 25 + 18).toFixed(2)); // 18.00 to 43.00 °C
  const strappingFactor = Number((Math.random() * 150 + 150).toFixed(2)); // 150.00 to 300.00 m³/%
  
  const totalCap = preset.baseVol;
  const calculatedVolume = Number(((levelPercent / 100) * totalCap).toFixed(1));
  
  let status: CardStatus = STATUS_LIST[Math.floor(Math.random() * STATUS_LIST.length)];
  if (levelPercent > 88 || levelPercent < 15) {
    status = levelPercent > 90 ? 'CRITICAL' : 'ATENÇÃO';
  }

  const id = `card_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  return {
    id,
    tag: preset.tag,
    category: preset.category,
    title: preset.title,
    description: preset.description,
    levelPercent,
    pressure,
    pressureUnit: 'mbar',
    temperature,
    geometryType: 'vertical_cylindrical',
    fieldBindings: [],
    strappingFactor,
    calculatedVolume,
    volumeUnit: 'm³',
    status,
    footerLabel: preset.footerLabel,
    visibleFields: {
      showLevel: true,
      showPressure: true,
      showTemperature: true,
      showStrappingFactor: true,
      showVolume: true,
    },
    startRow,
    startCol,
    rowSpan: Math.max(1, rowSpan),
    colSpan: Math.max(1, colSpan),
  };
}

export function reRandomizeTankValues(card: TankCardData): TankCardData {
  const levelPercent = Number((Math.random() * 85 + 10).toFixed(1));
  const pressure = Number((Math.random() * 12 + 0.5).toFixed(2));
  const temperature = Number((Math.random() * 25 + 18).toFixed(2));
  const strappingFactor = Number((Math.random() * 150 + 150).toFixed(2));
  const baseVol = 25000;
  const calculatedVolume = Number(((levelPercent / 100) * baseVol).toFixed(1));

  let status: CardStatus = card.status;
  if (levelPercent > 90) status = 'CRITICAL';
  else if (levelPercent > 80 || levelPercent < 20) status = 'ATENÇÃO';
  else status = 'NORMAL';

  return {
    ...card,
    levelPercent,
    pressure,
    temperature,
    strappingFactor,
    calculatedVolume,
    status,
  };
}
