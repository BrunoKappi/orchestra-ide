import { v4 as uuid } from 'uuid';
import type {
  OmmProduct,
  OmmArea,
  OmmEquipment,
  OmmAlignment,
  OmmOperator,
  OmmOrder,
  OmmMovement,
  OmmUserGroup,
  OmmMovementTypeConfig,
  OmmPriorityConfig,
  OmmMeasurementMethodConfig,
  OmmEngUnitConfig,
  OmmSimulatorState,
} from '../types';
import {
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
  orderRepo,
  movementRepo,
  simStateRepo,
  markOmmSeeded,
} from '../repository';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const now = () => new Date().toISOString();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();
const nextCutoff = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(1, 0, 0, 0);
  return d.toISOString();
};

let movCounter = 1;
let ordCounter = 1;

const movNum = () => `MOV-${String(movCounter++).padStart(4, '0')}`;
const ordNum = () => `ORD-${String(ordCounter++).padStart(3, '0')}`;

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
const products: OmmProduct[] = [
  { id: uuid(), code: 'ANP', name: 'Nafta Petroquímica', category: 'Refined', density20: 720, apiGravity: 65.2, flashPoint: -10, viscosity: 0.5, color: '#f59e0b', unit: 'm³', active: true, createdAt: now(), updatedAt: now() },
  { id: uuid(), code: 'GAS', name: 'Gasolina S10', category: 'Refined', density20: 740, apiGravity: 60.1, flashPoint: -43, viscosity: 0.7, color: '#f97316', unit: 'm³', active: true, createdAt: now(), updatedAt: now() },
  { id: uuid(), code: 'DIE', name: 'Diesel S10', category: 'Refined', density20: 845, apiGravity: 36.5, flashPoint: 55, viscosity: 3.2, color: '#78716c', unit: 'm³', active: true, createdAt: now(), updatedAt: now() },
  { id: uuid(), code: 'JET', name: 'Querosene de Aviação', category: 'Refined', density20: 800, apiGravity: 45.3, flashPoint: 38, viscosity: 1.8, color: '#06b6d4', unit: 'm³', active: true, createdAt: now(), updatedAt: now() },
  { id: uuid(), code: 'CRU', name: 'Petróleo Cru Marlim', category: 'Crude', density20: 895, apiGravity: 26.8, flashPoint: 35, viscosity: 12.5, color: '#1c1917', unit: 'm³', active: true, createdAt: now(), updatedAt: now() },
  { id: uuid(), code: 'FUO', name: 'Óleo Combustível 1A', category: 'Refined', density20: 960, apiGravity: 15.7, flashPoint: 85, viscosity: 380, color: '#292524', unit: 'm³', active: true, createdAt: now(), updatedAt: now() },
  { id: uuid(), code: 'NAP', name: 'Nafta de Pirólise', category: 'Intermediate', density20: 695, apiGravity: 70.1, flashPoint: -20, viscosity: 0.4, color: '#a3e635', unit: 'm³', active: true, createdAt: now(), updatedAt: now() },
  { id: uuid(), code: 'LPG', name: 'GLP Propano', category: 'LPG', density20: 510, apiGravity: 145, flashPoint: -104, viscosity: 0.1, color: '#8b5cf6', unit: 't', active: true, createdAt: now(), updatedAt: now() },
];

// ---------------------------------------------------------------------------
// Areas
// ---------------------------------------------------------------------------
const areas: OmmArea[] = [
  { id: uuid(), code: 'UPR', name: 'Unidade de Processamento', description: 'Unidade principal de destilação e craqueamento', supervisor: 'Eng. Carlos Silva', color: '#3b82f6', active: true, createdAt: now(), updatedAt: now() },
  { id: uuid(), code: 'PAR', name: 'Parque de Tanques', description: 'Área de armazenamento e expedição de produtos acabados', supervisor: 'Eng. Ana Costa', color: '#10b981', active: true, createdAt: now(), updatedAt: now() },
  { id: uuid(), code: 'EXP', name: 'Expedição e Carregamento', description: 'Área de carregamento de caminhões e vagões', supervisor: 'Eng. Pedro Santos', color: '#f59e0b', active: true, createdAt: now(), updatedAt: now() },
  { id: uuid(), code: 'TER', name: 'Terminal Marítimo', description: 'Operações de navio e píer', supervisor: 'Eng. Mariana Lima', color: '#06b6d4', active: true, createdAt: now(), updatedAt: now() },
  { id: uuid(), code: 'QUI', name: 'Química Fina', description: 'Unidade de aditivação e blending', supervisor: 'Eng. Roberto Neves', color: '#a855f7', active: true, createdAt: now(), updatedAt: now() },
];

// ---------------------------------------------------------------------------
// Operators
// ---------------------------------------------------------------------------
const operators: OmmOperator[] = [
  { id: uuid(), code: 'OP001', name: 'João Ferreira', role: 'Operator Sr.', area: 'UPR', isOnline: true, lastSeen: now(), createdAt: now(), updatedAt: now() },
  { id: uuid(), code: 'OP002', name: 'Maria Souza', role: 'Operator Sr.', area: 'PAR', isOnline: true, lastSeen: now(), createdAt: now(), updatedAt: now() },
  { id: uuid(), code: 'OP003', name: 'Carlos Matos', role: 'Operator Jr.', area: 'EXP', isOnline: false, lastSeen: hoursAgo(2), createdAt: now(), updatedAt: now() },
  { id: uuid(), code: 'OP004', name: 'Ana Ribeiro', role: 'Supervisor', area: 'TER', isOnline: true, lastSeen: now(), createdAt: now(), updatedAt: now() },
  { id: uuid(), code: 'OP005', name: 'Lucas Pereira', role: 'Operator Jr.', area: 'QUI', isOnline: true, lastSeen: now(), createdAt: now(), updatedAt: now() },
  { id: uuid(), code: 'OP006', name: 'Beatriz Carvalho', role: 'Engineer', area: 'PAR', isOnline: false, lastSeen: hoursAgo(4), createdAt: now(), updatedAt: now() },
];

// ---------------------------------------------------------------------------
// Equipment (Tanks, Pumps, etc.)
// ---------------------------------------------------------------------------
function makeEquipments(
  prods: OmmProduct[],
  areasArr: OmmArea[],
): OmmEquipment[] {
  const [crude, gasoline, diesel, jet, naphtha, fo, nafpyr, lpg] = prods;
  const [upr, par, exp, ter] = areasArr;

  const eq = (
    tag: string,
    name: string,
    type: OmmEquipment['type'],
    areaId: string,
    productId: string | null,
    capacity: number,
    level: number,
    x: number,
    y: number,
    color: string,
  ): OmmEquipment => {
    const vol = (capacity * level) / 100;
    const dens = productId
      ? (prods.find((p) => p.id === productId)?.density20 ?? 850)
      : 850;
    return {
      id: uuid(),
      tag,
      name,
      type,
      areaId,
      productId,
      capacity,
      currentLevel: level,
      currentVolume: vol,
      currentMass: (vol * dens) / 1000,
      temperature: 25 + Math.random() * 15,
      pressure: 0.5 + Math.random() * 2,
      density: dens + Math.random() * 5,
      isActive: true,
      isSending: false,
      isReceiving: false,
      latitude: 0,
      longitude: 0,
      x,
      y,
      width: type === 'Tank' || type === 'Vessel' ? 80 : 40,
      height: type === 'Tank' || type === 'Vessel' ? 100 : 40,
      color,
      notes: '',
      createdAt: now(),
      updatedAt: now(),
    };
  };

  return [
    // Crude tanks
    eq('TQ-101', 'Tanque Petróleo Marlim A', 'Tank', par.id, crude.id, 50000, 72, 80, 80, '#44403c'),
    eq('TQ-102', 'Tanque Petróleo Marlim B', 'Tank', par.id, crude.id, 50000, 58, 200, 80, '#44403c'),
    eq('TQ-103', 'Tanque Petróleo Roncador', 'Tank', par.id, crude.id, 80000, 41, 320, 80, '#44403c'),
    // Gasoline tanks
    eq('TQ-201', 'Tanque Gasolina A', 'Tank', par.id, gasoline.id, 20000, 65, 80, 240, '#f97316'),
    eq('TQ-202', 'Tanque Gasolina B', 'Tank', par.id, gasoline.id, 20000, 88, 200, 240, '#f97316'),
    // Diesel tanks
    eq('TQ-301', 'Tanque Diesel S10 A', 'Tank', par.id, diesel.id, 30000, 54, 320, 240, '#78716c'),
    eq('TQ-302', 'Tanque Diesel S10 B', 'Tank', par.id, diesel.id, 30000, 77, 440, 240, '#78716c'),
    eq('TQ-303', 'Tanque Diesel S500', 'Tank', par.id, diesel.id, 25000, 33, 560, 240, '#78716c'),
    // Jet tanks
    eq('TQ-401', 'Tanque QAV A', 'Tank', par.id, jet.id, 15000, 61, 80, 400, '#06b6d4'),
    eq('TQ-402', 'Tanque QAV B', 'Tank', par.id, jet.id, 15000, 45, 200, 400, '#06b6d4'),
    // Naphtha tanks
    eq('TQ-501', 'Tanque Nafta Petroquímica', 'Tank', par.id, naphtha.id, 10000, 79, 320, 400, '#f59e0b'),
    eq('TQ-502', 'Tanque Nafta Pirólise', 'Tank', par.id, nafpyr.id, 8000, 52, 440, 400, '#a3e635'),
    // Fuel oil
    eq('TQ-601', 'Tanque Óleo Combustível', 'Tank', par.id, fo.id, 40000, 68, 560, 400, '#292524'),
    // LPG sphere
    eq('ES-101', 'Esfera GLP Propano A', 'Vessel', par.id, lpg.id, 5000, 84, 680, 240, '#8b5cf6'),
    eq('ES-102', 'Esfera GLP Propano B', 'Vessel', par.id, lpg.id, 5000, 67, 800, 240, '#8b5cf6'),
    // Process units
    eq('UA-001', 'Unidade Destilação Atm.', 'ProcessUnit', upr.id, null, 0, 0, 80, 560, '#3b82f6'),
    eq('UV-001', 'Unidade Destilação Vácuo', 'ProcessUnit', upr.id, null, 0, 0, 220, 560, '#3b82f6'),
    eq('HDS-001', 'Unidade HDS Diesel', 'ProcessUnit', upr.id, null, 0, 0, 360, 560, '#3b82f6'),
    // Pumps
    eq('BB-101', 'Bomba Produto Branco 1', 'Pump', par.id, null, 0, 0, 160, 320, '#64748b'),
    eq('BB-102', 'Bomba Produto Branco 2', 'Pump', par.id, null, 0, 0, 200, 320, '#64748b'),
    eq('BB-201', 'Bomba Petróleo 1', 'Pump', par.id, null, 0, 0, 160, 160, '#64748b'),
    eq('BB-202', 'Bomba Petróleo 2', 'Pump', par.id, null, 0, 0, 200, 160, '#64748b'),
    // Meters
    eq('FM-101', 'Medidor de Vazão GLP', 'FlowMeter', par.id, null, 0, 0, 500, 160, '#94a3b8'),
    eq('FM-201', 'Medidor Transferência Diesel', 'FlowMeter', par.id, null, 0, 0, 500, 320, '#94a3b8'),
    eq('FM-301', 'Medidor Embarque Gasolina', 'FlowMeter', exp.id, null, 0, 0, 500, 480, '#94a3b8'),
    // Ship berth
    eq('NAV-001', 'NE Presidente Prudente', 'Ship', ter.id, crude.id, 150000, 45, 900, 240, '#0ea5e9'),
    // Trucks
    eq('CAM-001', 'Pátio de Carregamento A', 'Truck', exp.id, null, 0, 0, 700, 560, '#84cc16'),
    eq('CAM-002', 'Pátio de Carregamento B', 'Truck', exp.id, null, 0, 0, 780, 560, '#84cc16'),
    // Pipeline manifold
    eq('MAN-001', 'Manifold Carga', 'Manifold', par.id, null, 0, 0, 380, 160, '#e879f9'),
    eq('MAN-002', 'Manifold Expedição', 'Manifold', exp.id, null, 0, 0, 580, 560, '#e879f9'),
  ];
}

// ---------------------------------------------------------------------------
// Alignments
// ---------------------------------------------------------------------------
function makeAlignments(eqs: OmmEquipment[]): OmmAlignment[] {
  const find = (tag: string) => eqs.find((e) => e.tag === tag)!;
  return [
    { id: uuid(), code: 'ALN-001', name: 'TQ-101 → TQ-201 via BB-201', description: 'Transferência petróleo para gasolina', fromEquipmentId: find('TQ-101').id, toEquipmentId: find('TQ-201').id, viaEquipmentIds: [find('BB-201').id], active: true, createdAt: now(), updatedAt: now() },
    { id: uuid(), code: 'ALN-002', name: 'TQ-301 → CAM-001 via BB-101', description: 'Expedição diesel caminhão', fromEquipmentId: find('TQ-301').id, toEquipmentId: find('CAM-001').id, viaEquipmentIds: [find('BB-101').id, find('FM-201').id], active: true, createdAt: now(), updatedAt: now() },
    { id: uuid(), code: 'ALN-003', name: 'NAV-001 → TQ-101 via BB-201', description: 'Descarga navio petróleo', fromEquipmentId: find('NAV-001').id, toEquipmentId: find('TQ-101').id, viaEquipmentIds: [find('BB-201').id], active: true, createdAt: now(), updatedAt: now() },
    { id: uuid(), code: 'ALN-004', name: 'TQ-201 → TQ-202 Transferência', description: 'Transferência interna gasolina', fromEquipmentId: find('TQ-201').id, toEquipmentId: find('TQ-202').id, viaEquipmentIds: [find('BB-101').id], active: true, createdAt: now(), updatedAt: now() },
    { id: uuid(), code: 'ALN-005', name: 'UA-001 → TQ-301 Diesel HDS', description: 'Envio diesel da unidade para tanque', fromEquipmentId: find('UA-001').id, toEquipmentId: find('TQ-301').id, viaEquipmentIds: [], active: true, createdAt: now(), updatedAt: now() },
  ];
}

// ---------------------------------------------------------------------------
// Movements builder
// ---------------------------------------------------------------------------
function makeMovement(
  orderId: string,
  opts: {
    type: OmmMovement['type'];
    category: OmmMovement['category'];
    productId: string;
    areaId: string;
    originId: string;
    destinationId: string;
    viaId?: string;
    meterId?: string;
    alignmentId?: string;
    status: OmmMovement['status'];
    priority: OmmMovement['priority'];
    operatorId: string;
    plannedVol: number;
    plannedFlow: number;
    percentComplete?: number;
    issuedAgo?: number;
    activatedAgo?: number | null;
  },
): OmmMovement {
  const pct = opts.percentComplete ?? (opts.status === 'Active' ? Math.random() * 80 + 5 : opts.status === 'Completed' || opts.status === 'Closed' ? 100 : 0);
  const curVol = (opts.plannedVol * pct) / 100;
  const density = 845;
  const vcf = 0.998 + Math.random() * 0.004;
  const corrVol = curVol * vcf;
  const curMass = (curVol * density) / 1000;
  const flow = opts.status === 'Active' ? opts.plannedFlow * (0.9 + Math.random() * 0.2) : 0;
  const remaining = opts.plannedVol - curVol;
  const ettc = flow > 0 ? (remaining / flow) * 60 : 0;
  const etocDate = flow > 0 ? new Date(Date.now() + ettc * 60_000).toISOString() : null;
  const issuedAt = hoursAgo(opts.issuedAgo ?? 24);
  const activatedAt = opts.activatedAgo != null ? hoursAgo(opts.activatedAgo) : opts.status === 'Active' ? hoursAgo(Math.random() * 6 + 0.5) : null;
  return {
    id: uuid(),
    orderId,
    number: movNum(),
    description: '',
    type: opts.type,
    category: opts.category,
    productId: opts.productId,
    areaId: opts.areaId,
    originId: opts.originId,
    viaId: opts.viaId ?? null,
    destinationId: opts.destinationId,
    alignmentId: opts.alignmentId ?? null,
    meterId: opts.meterId ?? null,
    measurementMethod: 'FlowMeter',
    status: opts.status,
    priority: opts.priority,
    operatorId: opts.operatorId,
    plannedVolume: opts.plannedVol,
    plannedMass: (opts.plannedVol * density) / 1000,
    plannedFlow: opts.plannedFlow,
    plannedStartAt: issuedAt,
    plannedEndAt: hoursFromNow(8),
    currentVolume: curVol,
    currentMass: curMass,
    currentFlow: flow,
    avgFlow: flow * 0.95,
    temperature: 25 + Math.random() * 20,
    pressure: 1 + Math.random() * 3,
    density,
    density20: density + 5,
    vcf,
    correctedVolume: corrVol,
    accuracy: 98 + Math.random() * 2,
    percentComplete: pct,
    ettcMin: ettc,
    etoc: etocDate,
    initialLevel: 60 + Math.random() * 30,
    currentLevel: 60 + Math.random() * 30 - pct * 0.3,
    destLevel: pct * 0.25,
    finalLevel: opts.status === 'Completed' || opts.status === 'Closed' ? 25 + Math.random() * 20 : null,
    simFlowRate: opts.plannedFlow,
    simNoise: 0.02,
    simMode: 'fixed',
    simPaused: false,
    simSpeedMultiplier: 1,
    issuedAt,
    activatedAt,
    completedAt: opts.status === 'Completed' || opts.status === 'Closed' ? hoursAgo(Math.random() * 2) : null,
    closedAt: opts.status === 'Closed' ? hoursAgo(Math.random()) : null,
    canceledAt: opts.status === 'Canceled' ? hoursAgo(Math.random() * 5) : null,
    lastUpdatedAt: now(),
    notes: '',
    tags: [],
    createdAt: issuedAt,
    updatedAt: now(),
  };
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------
export function seedOmmData(): void {
  // Persist products
  productRepo.saveAll(products);

  // Persist areas
  areaRepo.saveAll(areas);

  // Persist operators
  operatorRepo.saveAll(operators);

  // Build & persist equipments
  const equipments = makeEquipments(products, areas);
  equipmentRepo.saveAll(equipments);

  // Build & persist alignments
  const alignments = makeAlignments(equipments);
  alignmentRepo.saveAll(alignments);

  const find = (tag: string) => equipments.find((e) => e.tag === tag)!;
  const [crude, gasoline, diesel, jet, naphtha, , , lpg] = products;
  const [upr, par, exp, ter, qui] = areas;
  const [op1, op2, op3, op4, op5] = operators;

  const allOrders: OmmOrder[] = [];
  const allMovements: OmmMovement[] = [];

  // Helper to create order with movements
  const makeOrder = (
    status: OmmOrder['status'],
    priority: OmmOrder['priority'],
    areaId: string,
    operatorId: string,
    movs: OmmMovement[],
  ): OmmOrder => {
    const ord: OmmOrder = {
      id: uuid(),
      number: ordNum(),
      description: movs[0]?.type + ' - ' + (movs.length) + ' movimentos',
      area: areaId,
      status,
      priority,
      operator: operatorId,
      notes: '',
      movementIds: movs.map((m) => m.id),
      issuedAt: movs[0]?.issuedAt ?? now(),
      activatedAt: status !== 'Issued' ? movs[0]?.activatedAt ?? null : null,
      completedAt: status === 'Completed' || status === 'Closed' ? hoursAgo(1) : null,
      closedAt: status === 'Closed' ? hoursAgo(0.5) : null,
      canceledAt: status === 'Canceled' ? hoursAgo(3) : null,
      createdAt: movs[0]?.createdAt ?? now(),
      updatedAt: now(),
    };
    movs.forEach((m) => { m.orderId = ord.id; });
    return ord;
  };

  // --- Active orders ---
  for (let i = 0; i < 4; i++) {
    const movs = [
      makeMovement('', {
        type: 'Transfer', category: 'Refined', productId: diesel.id,
        areaId: par.id, originId: find('TQ-301').id, destinationId: find('TQ-302').id,
        viaId: find('BB-101').id, meterId: find('FM-201').id,
        status: 'Active', priority: 'High', operatorId: op1.id,
        plannedVol: 1000 + i * 200, plannedFlow: 150 + i * 10,
      }),
    ];
    const ord = makeOrder('Active', 'High', par.id, op1.id, movs);
    allOrders.push(ord);
    allMovements.push(...movs);
  }

  // Unloading from ship
  {
    const movs = [
      makeMovement('', {
        type: 'Unloading', category: 'Crude', productId: crude.id,
        areaId: ter.id, originId: find('NAV-001').id, destinationId: find('TQ-101').id,
        viaId: find('BB-201').id, status: 'Active', priority: 'Critical',
        operatorId: op4.id, plannedVol: 50000, plannedFlow: 800, percentComplete: 34,
      }),
      makeMovement('', {
        type: 'Unloading', category: 'Crude', productId: crude.id,
        areaId: ter.id, originId: find('NAV-001').id, destinationId: find('TQ-102').id,
        viaId: find('BB-202').id, status: 'Active', priority: 'Critical',
        operatorId: op4.id, plannedVol: 30000, plannedFlow: 600, percentComplete: 22,
      }),
    ];
    const ord = makeOrder('Active', 'Critical', ter.id, op4.id, movs);
    allOrders.push(ord);
    allMovements.push(...movs);
  }

  // Dispatch orders
  for (let i = 0; i < 3; i++) {
    const movs = [
      makeMovement('', {
        type: 'Dispatch', category: 'Refined', productId: gasoline.id,
        areaId: exp.id, originId: find('TQ-201').id, destinationId: find('CAM-001').id,
        viaId: find('BB-102').id, meterId: find('FM-301').id,
        status: i < 1 ? 'Active' : 'Issued', priority: 'Normal', operatorId: op3.id,
        plannedVol: 30 + i * 5, plannedFlow: 40,
      }),
    ];
    const ord = makeOrder(i < 1 ? 'Active' : 'Issued', 'Normal', exp.id, op3.id, movs);
    allOrders.push(ord);
    allMovements.push(...movs);
  }

  // Blending order
  {
    const movs = [
      makeMovement('', {
        type: 'Blending', category: 'Refined', productId: gasoline.id,
        areaId: qui.id, originId: find('TQ-201').id, destinationId: find('TQ-202').id,
        status: 'Active', priority: 'Normal', operatorId: op5.id,
        plannedVol: 500, plannedFlow: 80, percentComplete: 67,
      }),
      makeMovement('', {
        type: 'Blending', category: 'Additive', productId: naphtha.id,
        areaId: qui.id, originId: find('TQ-501').id, destinationId: find('TQ-202').id,
        status: 'Active', priority: 'Normal', operatorId: op5.id,
        plannedVol: 50, plannedFlow: 8, percentComplete: 67,
      }),
    ];
    const ord = makeOrder('Active', 'Normal', qui.id, op5.id, movs);
    allOrders.push(ord);
    allMovements.push(...movs);
  }

  // Issued orders (not yet started)
  for (let i = 0; i < 5; i++) {
    const productList = [diesel, gasoline, jet, naphtha];
    const prod = productList[i % productList.length];
    const movs = [
      makeMovement('', {
        type: 'Transfer', category: prod.category, productId: prod.id,
        areaId: par.id, originId: find('TQ-301').id, destinationId: find('TQ-302').id,
        status: 'Issued', priority: i % 3 === 0 ? 'High' : 'Normal', operatorId: op2.id,
        plannedVol: 500 + i * 100, plannedFlow: 100 + i * 20,
      }),
    ];
    const ord = makeOrder('Issued', i % 3 === 0 ? 'High' : 'Normal', par.id, op2.id, movs);
    allOrders.push(ord);
    allMovements.push(...movs);
  }

  // Completed orders
  for (let i = 0; i < 6; i++) {
    const movs = [
      makeMovement('', {
        type: i % 2 === 0 ? 'Transfer' : 'Dispatch', category: 'Refined',
        productId: i % 2 === 0 ? diesel.id : gasoline.id,
        areaId: par.id, originId: find('TQ-301').id, destinationId: find('TQ-302').id,
        status: 'Completed', priority: 'Normal', operatorId: op1.id,
        plannedVol: 800 + i * 50, plannedFlow: 120, percentComplete: 100,
        issuedAgo: 36 + i * 2,
      }),
    ];
    const ord = makeOrder('Completed', 'Normal', par.id, op1.id, movs);
    allOrders.push(ord);
    allMovements.push(...movs);
  }

  // Closed orders
  for (let i = 0; i < 4; i++) {
    const movs = [
      makeMovement('', {
        type: 'Transfer', category: 'Crude', productId: crude.id,
        areaId: ter.id, originId: find('NAV-001').id, destinationId: find('TQ-103').id,
        status: 'Closed', priority: 'Normal', operatorId: op4.id,
        plannedVol: 10000 + i * 1000, plannedFlow: 500, percentComplete: 100,
        issuedAgo: 72 + i * 3,
      }),
    ];
    const ord = makeOrder('Closed', 'Normal', ter.id, op4.id, movs);
    allOrders.push(ord);
    allMovements.push(...movs);
  }

  // Canceled orders
  for (let i = 0; i < 2; i++) {
    const movs = [
      makeMovement('', {
        type: 'Transfer', category: 'Refined', productId: jet.id,
        areaId: par.id, originId: find('TQ-401').id, destinationId: find('TQ-402').id,
        status: 'Canceled', priority: 'Low', operatorId: op2.id,
        plannedVol: 200 + i * 50, plannedFlow: 60, percentComplete: 0,
        issuedAgo: 12 + i * 6,
      }),
    ];
    const ord = makeOrder('Canceled', 'Low', par.id, op2.id, movs);
    allOrders.push(ord);
    allMovements.push(...movs);
  }

  // LPG orders
  {
    const movs = [
      makeMovement('', {
        type: 'Transfer', category: 'LPG', productId: lpg.id,
        areaId: par.id, originId: find('ES-101').id, destinationId: find('ES-102').id,
        status: 'Active', priority: 'High', operatorId: op2.id,
        plannedVol: 500, plannedFlow: 60, percentComplete: 45,
      }),
    ];
    const ord = makeOrder('Active', 'High', par.id, op2.id, movs);
    allOrders.push(ord);
    allMovements.push(...movs);
  }

  // Process → Tank orders
  for (let i = 0; i < 3; i++) {
    const movs = [
      makeMovement('', {
        type: 'Receipt', category: 'Refined', productId: diesel.id,
        areaId: upr.id, originId: find('HDS-001').id, destinationId: find('TQ-301').id,
        status: i < 1 ? 'Active' : 'Issued', priority: 'Normal', operatorId: op1.id,
        plannedVol: 2000 + i * 300, plannedFlow: 200, percentComplete: i < 1 ? 30 + i * 15 : 0,
      }),
    ];
    const ord = makeOrder(i < 1 ? 'Active' : 'Issued', 'Normal', upr.id, op1.id, movs);
    allOrders.push(ord);
    allMovements.push(...movs);
  }

  // Persist core
  orderRepo.saveAll(allOrders);
  movementRepo.saveAll(allMovements);

  // Seed auxiliary configurations
  const seededUserGroups: OmmUserGroup[] = [
    { id: uuid(), code: 'ADMIN', name: 'Administradores', description: 'Acesso total ao sistema', active: true, createdAt: now(), updatedAt: now() },
    { id: uuid(), code: 'OPS', name: 'Operadores', description: 'Acesso a movimentações e planta', active: true, createdAt: now(), updatedAt: now() },
    { id: uuid(), code: 'SUP', name: 'Supervisores', description: 'Acesso a validação de Cut-off e cadastros', active: true, createdAt: now(), updatedAt: now() },
  ];
  const seededMovementTypes: OmmMovementTypeConfig[] = [
    { id: uuid(), code: 'Transfer', name: 'Transferência Interna', color: '#3b82f6', description: 'Movimentação entre tanques', active: true, createdAt: now(), updatedAt: now() },
    { id: uuid(), code: 'Receipt', name: 'Recebimento', color: '#10b981', description: 'Recebimento de matéria-prima', active: true, createdAt: now(), updatedAt: now() },
    { id: uuid(), code: 'Dispatch', name: 'Expedição', color: '#f59e0b', description: 'Envio para carregamento', active: true, createdAt: now(), updatedAt: now() },
    { id: uuid(), code: 'Internal', name: 'Movimento Interno', color: '#8b5cf6', description: 'Movimento sem alinhamento fixo', active: true, createdAt: now(), updatedAt: now() },
  ];
  const seededPriorities: OmmPriorityConfig[] = [
    { id: uuid(), code: 'Low', name: 'Baixa', color: '#64748b', level: 1, active: true, createdAt: now(), updatedAt: now() },
    { id: uuid(), code: 'Normal', name: 'Normal', color: '#3b82f6', level: 2, active: true, createdAt: now(), updatedAt: now() },
    { id: uuid(), code: 'High', name: 'Alta', color: '#f59e0b', level: 3, active: true, createdAt: now(), updatedAt: now() },
    { id: uuid(), code: 'Critical', name: 'Crítica', color: '#ef4444', level: 4, active: true, createdAt: now(), updatedAt: now() },
  ];
  const seededMeasurementMethods: OmmMeasurementMethodConfig[] = [
    { id: uuid(), code: 'FlowMeter', name: 'Medidor de Vazão', description: 'Medição contínua via medidor de vazão', active: true, createdAt: now(), updatedAt: now() },
    { id: uuid(), code: 'TankGauging', name: 'Telemetria de Tanque', description: 'Medição automática por nível do tanque', active: true, createdAt: now(), updatedAt: now() },
    { id: uuid(), code: 'Manual', name: 'Medição Manual', description: 'Medição por trena/régua', active: true, createdAt: now(), updatedAt: now() },
  ];
  const seededEngUnits: OmmEngUnitConfig[] = [
    { id: uuid(), code: 'M3', name: 'Metro Cúbico', symbol: 'm³', dimension: 'Volume', active: true, createdAt: now(), updatedAt: now() },
    { id: uuid(), code: 'TON', name: 'Tonelada', symbol: 't', dimension: 'Massa', active: true, createdAt: now(), updatedAt: now() },
    { id: uuid(), code: 'LIT', name: 'Litro', symbol: 'L', dimension: 'Volume', active: true, createdAt: now(), updatedAt: now() },
  ];

  userGroupRepo.saveAll(seededUserGroups);
  movementTypeRepo.saveAll(seededMovementTypes);
  priorityRepo.saveAll(seededPriorities);
  measurementMethodRepo.saveAll(seededMeasurementMethods);
  engUnitRepo.saveAll(seededEngUnits);

  // Simulator state
  const simState: OmmSimulatorState = {
    isRunning: true,
    speedMultiplier: 60,
    simulatedTime: new Date().toISOString(),
    tickCount: 0,
    lastTickAt: now(),
    nextCutoffAt: nextCutoff(),
    cutoffHour: 1,
    activeMovementCount: allMovements.filter((m) => m.status === 'Active').length,
  };
  simStateRepo.set(simState);

  markOmmSeeded();
}
