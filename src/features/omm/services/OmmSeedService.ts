/**
 * OmmSeedService
 *
 * Seeds the OMM module with initial data coherent with the Orquestra object model.
 * Runs ONLY once (guarded by isOmmSeeded()). Does NOT re-run on every render/navigation.
 *
 * Equipment data is sourced from objectRepo/propertyRepo (real Orquestra objects).
 * Operators are sourced from STORAGE_KEYS.SECURITY_USERS (Security module).
 * Products, Areas, Alignments, Movement Types, Priorities, Eng Units are OMM-owned.
 */

import { objectRepo } from '../../../repository/ObjectRepository';
import { propertyRepo } from '../../../repository/PropertyRepository';
import { STORAGE_KEYS } from '../../../repository/storageKey';
import type {
  OmmProduct,
  OmmArea,
  OmmEquipment,
  OmmAlignment,
  OmmMovementTypeConfig,
  OmmPriorityConfig,
  OmmEngUnitConfig,
  OmmOrder,
  OmmMovement,
  OmmSimulatorState,
  EquipmentType,
} from '../types';
import {
  productRepo,
  areaRepo,
  equipmentRepo,
  alignmentRepo,
  movementTypeRepo,
  priorityRepo,
  engUnitRepo,
  orderRepo,
  movementRepo,
  simStateRepo,
  markOmmSeeded,
} from '../repository';

const now = () => new Date().toISOString();

// ---------------------------------------------------------------------------
// Helper: resolve equipment type from object name
// ---------------------------------------------------------------------------
function resolveEquipmentType(name: string): EquipmentType {
  // V-3xx are spherical tanks (e.g. V-301, V-302 — Esferas de Eteno)
  if (name.startsWith('V-3')) return 'Sphere';
  // V-4xx are pressurized vessels (e.g. V-401, V-402 — Vasos de Propeno)
  if (name.startsWith('V-4') || name.startsWith('V-')) return 'Vessel';
  return 'Tank';
}

export function seedOmmData(): void {
  // -------------------------------------------------------------------------
  // 1. Products
  // -------------------------------------------------------------------------
  const products: OmmProduct[] = [
    {
      id: 'prod-naphtha',
      code: 'NAF-01',
      name: 'Nafta Petroquímica',
      description: 'Alimentação para unidade de craqueamento petroquímico',
      density: 720,
      engUnitId: 'unit-m3',
      color: '#f59e0b',
      active: true,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'prod-benzene',
      code: 'BZ-02',
      name: 'Benzeno Purificado',
      description: 'Aromático purificado grau químico (pureza >99.9%)',
      density: 876,
      engUnitId: 'unit-m3',
      color: '#8b5cf6',
      active: true,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'prod-ethene',
      code: 'ETH-03',
      name: 'Eteno (Etileno)',
      description: 'Olefina monômero para polietileno',
      density: 568,
      engUnitId: 'unit-m3',
      color: '#06b6d4',
      active: true,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'prod-propene',
      code: 'PRP-04',
      name: 'Propeno (Propileno)',
      description: 'Monômero para polipropileno de alta pureza',
      density: 514,
      engUnitId: 'unit-m3',
      color: '#3b82f6',
      active: true,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'prod-paraxylene',
      code: 'PXY-05',
      name: 'Para-Xileno',
      description: 'Intermediário para cadeia de poliéster / PTA',
      density: 861,
      engUnitId: 'unit-m3',
      color: '#ec4899',
      active: true,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'prod-fueloil',
      code: 'FO-06',
      name: 'Óleo Combustível Heavy',
      description: 'Frações pesadas para utilidades de caldeira',
      density: 980,
      engUnitId: 'unit-m3',
      color: '#64748b',
      active: true,
      createdAt: now(),
      updatedAt: now(),
    },
  ];
  productRepo.saveAll(products);

  // -------------------------------------------------------------------------
  // 2. Areas (mirrored from global areas for consistency)
  // -------------------------------------------------------------------------
  const globalAreasRaw = localStorage.getItem(STORAGE_KEYS.AREAS);
  const globalAreas: Array<{ id: string; code: string; name: string; description: string }> =
    globalAreasRaw ? JSON.parse(globalAreasRaw) : [];

  const ommAreas: OmmArea[] = [
    {
      id: 'area-300',
      code: 'A-300',
      name: 'Unidade 300 — Matéria-Prima',
      description: globalAreas.find((a) => a.id === 'area-300')?.description ?? 'Parque de Tanques de Nafta e Condensados',
      color: '#f59e0b',
      active: true,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'area-400',
      code: 'A-400',
      name: 'Unidade 400 — Intermediários',
      description: globalAreas.find((a) => a.id === 'area-400')?.description ?? 'Parque de Tanques de Benzeno e Para-Xileno',
      color: '#ec4899',
      active: true,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'area-500',
      code: 'A-500',
      name: 'Unidade 500 — Olefinas',
      description: globalAreas.find((a) => a.id === 'area-500')?.description ?? 'Esferas e Vasos Pressurizados de Eteno e Propeno',
      color: '#3b82f6',
      active: true,
      createdAt: now(),
      updatedAt: now(),
    },
  ];
  areaRepo.saveAll(ommAreas);

  // -------------------------------------------------------------------------
  // 3. Engineering Units
  // -------------------------------------------------------------------------
  const engUnits: OmmEngUnitConfig[] = [
    { id: 'unit-m3',    symbol: 'm³',    name: 'Metro Cúbico',          category: 'Volume',      decimals: 1, factor: 1,     active: true, createdAt: now(), updatedAt: now() },
    { id: 'unit-m3h',   symbol: 'm³/h',  name: 'Metro Cúbico por Hora', category: 'Flow',        decimals: 1, factor: 1,     active: true, createdAt: now(), updatedAt: now() },
    { id: 'unit-degc',  symbol: '°C',    name: 'Grau Celsius',          category: 'Temperature', decimals: 1, factor: 1,     active: true, createdAt: now(), updatedAt: now() },
    { id: 'unit-bar',   symbol: 'bar',   name: 'Bar',                   category: 'Pressure',    decimals: 2, factor: 1,     active: true, createdAt: now(), updatedAt: now() },
    { id: 'unit-kgm3',  symbol: 'kg/m³', name: 'Quilograma por Metro Cúbico', category: 'Density', decimals: 1, factor: 1,  active: true, createdAt: now(), updatedAt: now() },
    { id: 'unit-pct',   symbol: '%',     name: 'Porcentagem',           category: 'Level',       decimals: 1, factor: 1,     active: true, createdAt: now(), updatedAt: now() },
  ];
  engUnitRepo.saveAll(engUnits);

  // -------------------------------------------------------------------------
  // 4. Movement Types
  // -------------------------------------------------------------------------
  const movementTypes: OmmMovementTypeConfig[] = [
    { id: 'mtype-t2t',  code: 'TankToTank',    name: 'Tanque → Tanque',    category: 'Internal',  color: '#3b82f6', description: 'Transferência entre tanques atmosféricos', active: true, createdAt: now(), updatedAt: now() },
    { id: 'mtype-t2s',  code: 'TankToSphere',  name: 'Tanque → Esfera',    category: 'Internal',  color: '#06b6d4', description: 'Transferência de tanque para esfera pressurizada', active: true, createdAt: now(), updatedAt: now() },
    { id: 'mtype-s2t',  code: 'SphereToTank',  name: 'Esfera → Tanque',    category: 'Internal',  color: '#0891b2', description: 'Transferência de esfera para tanque atmosférico', active: true, createdAt: now(), updatedAt: now() },
    { id: 'mtype-t2a',  code: 'TankToArea',    name: 'Tanque → Área',      category: 'Transfer',  color: '#8b5cf6', description: 'Transferência de tanque para área de processo', active: true, createdAt: now(), updatedAt: now() },
    { id: 'mtype-a2t',  code: 'AreaToTank',    name: 'Área → Tanque',      category: 'Transfer',  color: '#7c3aed', description: 'Transferência de área de processo para tanque', active: true, createdAt: now(), updatedAt: now() },
    { id: 'mtype-a2a',  code: 'AreaToArea',    name: 'Área → Área',        category: 'Transfer',  color: '#6d28d9', description: 'Transferência entre áreas de processo', active: true, createdAt: now(), updatedAt: now() },
    { id: 'mtype-load', code: 'Loading',       name: 'Carregamento',       category: 'External',  color: '#f59e0b', description: 'Carregamento em caminhão, vagão ou navio', active: true, createdAt: now(), updatedAt: now() },
    { id: 'mtype-unld', code: 'Unloading',     name: 'Descarregamento',    category: 'External',  color: '#d97706', description: 'Recebimento de produto externo', active: true, createdAt: now(), updatedAt: now() },
    { id: 'mtype-recirc', code: 'Recirculation', name: 'Recirculação',     category: 'Internal',  color: '#64748b', description: 'Recirculação interna do equipamento', active: true, createdAt: now(), updatedAt: now() },
  ];
  movementTypeRepo.saveAll(movementTypes);

  // -------------------------------------------------------------------------
  // 5. Priorities
  // -------------------------------------------------------------------------
  const priorities: OmmPriorityConfig[] = [
    { id: 'prio-low',  code: 'Low',      name: 'Baixa',    color: '#94a3b8', level: 1, description: 'Movimento de baixa prioridade, pode aguardar',     active: true, createdAt: now(), updatedAt: now() },
    { id: 'prio-norm', code: 'Normal',   name: 'Normal',   color: '#3b82f6', level: 2, description: 'Prioridade padrão de operação',                    active: true, createdAt: now(), updatedAt: now() },
    { id: 'prio-high', code: 'High',     name: 'Alta',     color: '#f59e0b', level: 3, description: 'Movimento prioritário, executar antes do planejado', active: true, createdAt: now(), updatedAt: now() },
    { id: 'prio-crit', code: 'Critical', name: 'Crítica',  color: '#ef4444', level: 4, description: 'Emergência operacional, executar imediatamente',     active: true, createdAt: now(), updatedAt: now() },
  ];
  priorityRepo.saveAll(priorities);

  // -------------------------------------------------------------------------
  // 6. Equipments — mirrored from objectRepo + propertyRepo
  // -------------------------------------------------------------------------
  const objects = objectRepo.getAll();
  const allProps = propertyRepo.getAll();

  const propsByObject: Record<string, Record<string, string>> = {};
  allProps.forEach((p) => {
    if (!propsByObject[p.targetId]) propsByObject[p.targetId] = {};
    propsByObject[p.targetId][p.name] = p.defaultValue;
  });

  const ommEquipments: OmmEquipment[] = objects.map((obj) => {
    const props = propsByObject[obj.id] || {};
    const cap   = parseFloat(props['Capacity']    || '15000');
    const lvl   = parseFloat(props['Level']       || '50');
    const vol   = parseFloat(props['Volume']      || String((cap * lvl) / 100));
    const temp  = parseFloat(props['Temperature'] || '25');
    const press = parseFloat(props['Pressure']    || '1.0');
    const dens  = parseFloat(props['Density']     || '720');
    const flow  = parseFloat(props['Flow']        || '0');
    const flowIn  = flow > 0 ? flow : 0;
    const flowOut = flow < 0 ? Math.abs(flow) : 0;
    const mass = (vol * dens) / 1000;

    const areaId = obj.name.startsWith('TK-3') ? 'area-300'
                 : obj.name.startsWith('TK-4') ? 'area-400'
                 : 'area-500';

    // Map product by productName property
    const productName = props['Product'] || '';
    const productId = productName.includes('Nafta') ? 'prod-naphtha'
                    : productName.includes('Benz')  ? 'prod-benzene'
                    : productName.includes('Eteno') ? 'prod-ethene'
                    : productName.includes('Propen') ? 'prod-propene'
                    : productName.includes('Xileno') ? 'prod-paraxylene'
                    : null;
    const nameUpper = obj.name.toUpperCase();
    let x = 80;
    let y = 90;
    let color = '#3b82f6';

    if (nameUpper.includes('301')) { x = 80; y = 90; color = '#f59e0b'; }
    else if (nameUpper.includes('302')) { x = 240; y = 90; color = '#f59e0b'; }
    else if (nameUpper.includes('303')) { x = 400; y = 90; color = '#f59e0b'; }
    else if (nameUpper.includes('401')) { x = 80; y = 280; color = '#ec4899'; }
    else if (nameUpper.includes('402')) { x = 240; y = 280; color = '#ec4899'; }
    else if (nameUpper.includes('403')) { x = 400; y = 280; color = '#ec4899'; }
    else if (nameUpper.includes('501')) { x = 580; y = 100; color = '#06b6d4'; }
    else if (nameUpper.includes('502')) { x = 740; y = 100; color = '#3b82f6'; }
    else if (nameUpper.includes('503')) { x = 660; y = 280; color = '#3b82f6'; }

    return {
      id:           obj.id,
      tag:          props['Tag'] || obj.name,
      name:         obj.name,
      type:         resolveEquipmentType(obj.name),
      areaId,
      productId,
      capacity:     cap,
      currentLevel: lvl,
      currentVolume: vol,
      currentMass:  mass,
      temperature:  temp,
      pressure:     press,
      density:      dens,
      isActive:     true,
      isSending:    flowOut > 0,
      isReceiving:  flowIn > 0,
      flowIn,
      flowOut,
      x,
      y,
      width: 90,
      height: 115,
      color,
    };
  });
  equipmentRepo.saveAll(ommEquipments);

  // -------------------------------------------------------------------------
  // 7. Alignments — routes between real equipment
  // -------------------------------------------------------------------------
  const alignments: OmmAlignment[] = [
    {
      id: 'aln-301-302',
      code: 'ALN-A300-01',
      name: 'TK-301 ↔ TK-302',
      description: 'Duto principal de nafta entre TK-301 e TK-302',
      fromEquipmentId: 'tank-tk-301',
      toEquipmentId:   'tank-tk-302',
      available: true,
      color: '#f59e0b',
      active: true,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'aln-302-301',
      code: 'ALN-A300-02',
      name: 'TK-302 ↔ TK-301',
      description: 'Retorno de nafta TK-302 para TK-301',
      fromEquipmentId: 'tank-tk-302',
      toEquipmentId:   'tank-tk-301',
      available: true,
      color: '#f59e0b',
      active: true,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'aln-403-404',
      code: 'ALN-A400-01',
      name: 'TK-403 ↔ TK-404',
      description: 'Linha de para-xileno entre TK-403 e TK-404',
      fromEquipmentId: 'tank-tk-403',
      toEquipmentId:   'tank-tk-404',
      available: true,
      color: '#ec4899',
      active: true,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'aln-404-403',
      code: 'ALN-A400-02',
      name: 'TK-404 ↔ TK-403',
      description: 'Retorno de para-xileno TK-404 para TK-403',
      fromEquipmentId: 'tank-tk-404',
      toEquipmentId:   'tank-tk-403',
      available: true,
      color: '#ec4899',
      active: true,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'aln-v301-v302',
      code: 'ALN-A500-01',
      name: 'V-301 ↔ V-302',
      description: 'Manifold de olefinas — transferência de eteno',
      fromEquipmentId: 'tank-v-301',
      toEquipmentId:   'tank-v-302',
      available: true,
      color: '#06b6d4',
      active: true,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'aln-v401-v402',
      code: 'ALN-A500-02',
      name: 'V-401 ↔ V-402',
      description: 'Manifold de olefinas — transferência de propeno',
      fromEquipmentId: 'tank-v-401',
      toEquipmentId:   'tank-v-402',
      available: true,
      color: '#3b82f6',
      active: true,
      createdAt: now(),
      updatedAt: now(),
    },
  ];
  alignmentRepo.saveAll(alignments);

  // -------------------------------------------------------------------------
  // 8. Orders
  // -------------------------------------------------------------------------
  const orders: OmmOrder[] = [
    {
      id: 'ord-1',
      number: 'ORD-2026-001',
      description: 'Ordem de Movimentação de Nafta — Balanço Quinzenal',
      areaId: 'area-300',
      status: 'Active',
      priority: 'Normal',
      operatorId: 'usr-1',
      notes: 'Movimentações programadas para balanço de tancagem de nafta',
      movementIds: ['mov-0001', 'mov-0002'],
      completedAt: null,
      closedAt: null,
      canceledAt: null,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'ord-2',
      number: 'ORD-2026-002',
      description: 'Ordem de Transferência de Olefinas — Balanceamento de Inventário',
      areaId: 'area-500',
      status: 'Active',
      priority: 'High',
      operatorId: 'usr-3',
      notes: 'Transferência de eteno e propeno para equalização de inventário',
      movementIds: ['mov-0003', 'mov-0004', 'mov-0005'],
      completedAt: null,
      closedAt: null,
      canceledAt: null,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'ord-3',
      number: 'ORD-2026-003',
      description: 'Ordem de Movimentação de Para-Xileno',
      areaId: 'area-400',
      status: 'Issued',
      priority: 'Normal',
      operatorId: 'usr-2',
      notes: 'Programação de transferência de para-xileno entre tanques',
      movementIds: ['mov-0006'],
      completedAt: null,
      closedAt: null,
      canceledAt: null,
      createdAt: now(),
      updatedAt: now(),
    },
  ];
  orderRepo.saveAll(orders);

  // -------------------------------------------------------------------------
  // 9. Movements — referencing real Orquestra object IDs
  // -------------------------------------------------------------------------
  const n = Date.now();
  const movements: OmmMovement[] = [
    {
      id: 'mov-0001',
      orderId: 'ord-1',
      number: 'MOV-0001',
      description: 'Transferência de Nafta TK-301 → TK-302',
      typeId: 'mtype-t2t',
      productId: 'prod-naphtha',
      areaId: 'area-300',
      originId: 'tank-tk-301',
      destinationId: 'tank-tk-302',
      alignmentId: 'aln-301-302',
      status: 'Active',
      priority: 'Normal',
      operatorId: 'usr-1',
      plannedVolume: 2000,
      plannedFlow: 120,
      engUnitId: 'unit-m3',
      currentVolume: 450,
      currentFlow: 120,
      percentComplete: 22.5,
      simFlowRate: 120,
      simPaused: false,
      issuedAt: new Date(n - 3600000 * 4).toISOString(),
      activatedAt: new Date(n - 3600000 * 2).toISOString(),
      plannedStartAt: new Date(n - 3600000 * 4).toISOString(),
      etoc: new Date(n + 3600000 * 12.9).toISOString(),
      completedAt: null,
      closedAt: null,
      canceledAt: null,
      lastUpdatedAt: now(),
      notes: 'Transferência de equalização de inventário mensal',
      createdAt: new Date(n - 3600000 * 4).toISOString(),
      updatedAt: now(),
    },
    {
      id: 'mov-0002',
      orderId: 'ord-1',
      number: 'MOV-0002',
      description: 'Transferência de Nafta TK-302 → TK-301 (programada)',
      typeId: 'mtype-t2t',
      productId: 'prod-naphtha',
      areaId: 'area-300',
      originId: 'tank-tk-302',
      destinationId: 'tank-tk-301',
      alignmentId: 'aln-302-301',
      status: 'Issued',
      priority: 'Low',
      operatorId: 'usr-2',
      plannedVolume: 1500,
      plannedFlow: 80,
      engUnitId: 'unit-m3',
      currentVolume: 0,
      currentFlow: 0,
      percentComplete: 0,
      simFlowRate: 80,
      simPaused: false,
      issuedAt: new Date(n - 3600000 * 1).toISOString(),
      activatedAt: null,
      plannedStartAt: new Date(n + 3600000 * 2).toISOString(),
      etoc: new Date(n + 3600000 * 20.7).toISOString(),
      completedAt: null,
      closedAt: null,
      canceledAt: null,
      lastUpdatedAt: now(),
      notes: 'Aguardando conclusão do MOV-0001',
      createdAt: new Date(n - 3600000 * 1).toISOString(),
      updatedAt: now(),
    },
    {
      id: 'mov-0003',
      orderId: 'ord-2',
      number: 'MOV-0003',
      description: 'Transferência de Eteno V-301 → V-302 (concluída)',
      typeId: 'mtype-t2s',
      productId: 'prod-ethene',
      areaId: 'area-500',
      originId: 'tank-v-301',
      destinationId: 'tank-v-302',
      alignmentId: 'aln-v301-v302',
      status: 'Completed',
      priority: 'Normal',
      operatorId: 'usr-3',
      plannedVolume: 800,
      plannedFlow: 150,
      engUnitId: 'unit-m3',
      currentVolume: 800,
      currentFlow: 0,
      percentComplete: 100,
      simFlowRate: 150,
      simPaused: false,
      issuedAt: new Date(n - 3600000 * 8).toISOString(),
      activatedAt: new Date(n - 3600000 * 7).toISOString(),
      plannedStartAt: new Date(n - 3600000 * 8).toISOString(),
      etoc: new Date(n - 3600000 * 3).toISOString(),
      completedAt: new Date(n - 3600000 * 3).toISOString(),
      closedAt: null,
      canceledAt: null,
      lastUpdatedAt: now(),
      notes: 'Transferência concluída sem intercorrências',
      createdAt: new Date(n - 3600000 * 8).toISOString(),
      updatedAt: now(),
    },
    {
      id: 'mov-0004',
      orderId: 'ord-2',
      number: 'MOV-0004',
      description: 'Transferência de Propeno V-401 → V-402',
      typeId: 'mtype-t2t',
      productId: 'prod-propene',
      areaId: 'area-500',
      originId: 'tank-v-401',
      destinationId: 'tank-v-402',
      alignmentId: 'aln-v401-v402',
      status: 'Active',
      priority: 'High',
      operatorId: 'usr-3',
      plannedVolume: 600,
      plannedFlow: 80,
      engUnitId: 'unit-m3',
      currentVolume: 120,
      currentFlow: 80,
      percentComplete: 20,
      simFlowRate: 80,
      simPaused: false,
      issuedAt: new Date(n - 3600000 * 3).toISOString(),
      activatedAt: new Date(n - 3600000 * 1.5).toISOString(),
      plannedStartAt: new Date(n - 3600000 * 3).toISOString(),
      etoc: new Date(n + 3600000 * 6).toISOString(),
      completedAt: null,
      closedAt: null,
      canceledAt: null,
      lastUpdatedAt: now(),
      notes: 'Transferência de balanceamento de inventário de propeno',
      createdAt: new Date(n - 3600000 * 3).toISOString(),
      updatedAt: now(),
    },
    {
      id: 'mov-0005',
      orderId: 'ord-2',
      number: 'MOV-0005',
      description: 'Transferência de Eteno V-302 → V-301 (fechada)',
      typeId: 'mtype-t2s',
      productId: 'prod-ethene',
      areaId: 'area-500',
      originId: 'tank-v-302',
      destinationId: 'tank-v-301',
      alignmentId: 'aln-v301-v302',
      status: 'Closed',
      priority: 'Normal',
      operatorId: 'usr-3',
      plannedVolume: 500,
      plannedFlow: 100,
      engUnitId: 'unit-m3',
      currentVolume: 500,
      currentFlow: 0,
      percentComplete: 100,
      simFlowRate: 100,
      simPaused: false,
      issuedAt: new Date(n - 3600000 * 12).toISOString(),
      activatedAt: new Date(n - 3600000 * 10).toISOString(),
      plannedStartAt: new Date(n - 3600000 * 12).toISOString(),
      etoc: new Date(n - 3600000 * 6).toISOString(),
      completedAt: new Date(n - 3600000 * 6).toISOString(),
      closedAt: new Date(n - 3600000 * 4).toISOString(),
      canceledAt: null,
      lastUpdatedAt: now(),
      notes: 'Movimento encerrado e consolidado no cut-off',
      createdAt: new Date(n - 3600000 * 12).toISOString(),
      updatedAt: now(),
    },
    {
      id: 'mov-0006',
      orderId: 'ord-3',
      number: 'MOV-0006',
      description: 'Transferência de Para-Xileno TK-404 → TK-403 (cancelada)',
      typeId: 'mtype-t2t',
      productId: 'prod-paraxylene',
      areaId: 'area-400',
      originId: 'tank-tk-404',
      destinationId: 'tank-tk-403',
      alignmentId: 'aln-404-403',
      status: 'Canceled',
      priority: 'Normal',
      operatorId: 'usr-2',
      plannedVolume: 500,
      plannedFlow: 60,
      engUnitId: 'unit-m3',
      currentVolume: 0,
      currentFlow: 0,
      percentComplete: 0,
      simFlowRate: 60,
      simPaused: false,
      issuedAt: new Date(n - 3600000 * 5).toISOString(),
      activatedAt: null,
      plannedStartAt: new Date(n - 3600000 * 5).toISOString(),
      etoc: null,
      completedAt: null,
      closedAt: null,
      canceledAt: new Date(n - 3600000 * 2).toISOString(),
      lastUpdatedAt: now(),
      notes: 'Cancelado por falha no alinhamento de dutos',
      createdAt: new Date(n - 3600000 * 5).toISOString(),
      updatedAt: now(),
    },
  ];
  movementRepo.saveAll(movements);

  // -------------------------------------------------------------------------
  // 10. Sync STORAGE_KEYS.MOVEMENTS so the global SimulationEngine can track
  //     Active OMM movements and update tank volumes in propertyRepo.
  //
  //     Only Active movements are synced to the global list.
  // -------------------------------------------------------------------------
  syncActiveMovementsToGlobal(movements);

  // -------------------------------------------------------------------------
  // 11. Simulator state
  // -------------------------------------------------------------------------
  const defaultSim: OmmSimulatorState = {
    isRunning: true,
    speedMultiplier: 10,
    simulatedTime: now(),
    tickCount: 0,
    lastTickAt: now(),
    activeMovementCount: movements.filter((m) => m.status === 'Active').length,
  };
  simStateRepo.set(defaultSim);

  markOmmSeeded();
}

/**
 * Syncs OMM movements to STORAGE_KEYS.MOVEMENTS so the global SimulationEngine
 * can process Active transfers and update tank volumes.
 *
 * This is called after seeding and also by the store after any movement update.
 */
export function syncActiveMovementsToGlobal(ommMovements: OmmMovement[]): void {
  const activeMovements = ommMovements.filter(
    (m) => m.status === 'Active' && !m.simPaused,
  );

  const globalMovements = activeMovements.map((m) => ({
    id: m.id,
    code: m.number,
    description: m.description,
    sourceTankId: m.originId,
    sourceTankTag: m.originId,
    destinationTankId: m.destinationId,
    destinationTankTag: m.destinationId,
    productId: m.productId,
    productName: '',
    via: '',
    areaId: m.areaId,
    operatorId: m.operatorId,
    operatorName: '',
    flowRate: m.simFlowRate || m.plannedFlow || 100,
    plannedVolume: m.plannedVolume,
    volumeMoved: m.currentVolume,
    remainingVolume: Math.max(0, m.plannedVolume - m.currentVolume),
    status: 'Active' as const,
    ettc: '',
    etoc: '',
    startTime: m.updatedAt,
  }));

  localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(globalMovements));
}
