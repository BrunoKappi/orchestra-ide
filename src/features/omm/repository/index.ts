import { BaseRepository, SingletonRepository } from './BaseRepository';
import type {
  OmmOrder,
  OmmMovement,
  OmmProduct,
  OmmArea,
  OmmEquipment,
  OmmAlignment,
  OmmMovementTypeConfig,
  OmmPriorityConfig,
  OmmEngUnitConfig,
  OmmAlarm,
  OmmAuditEntry,
  OmmCutoffSnapshot,
  OmmSimulatorState,
} from '../types';

// Storage key namespace
const NS = 'omm_v2';

const defaultSimState: OmmSimulatorState = {
  isRunning: false,
  speedMultiplier: 10,
  simulatedTime: new Date().toISOString(),
  tickCount: 0,
  lastTickAt: new Date().toISOString(),
  activeMovementCount: 0,
};

export const orderRepo = new BaseRepository<OmmOrder>(`${NS}_orders`);
export const movementRepo = new BaseRepository<OmmMovement>(`${NS}_movements`);
export const productRepo = new BaseRepository<OmmProduct>(`${NS}_products`);
export const areaRepo = new BaseRepository<OmmArea>(`${NS}_areas`);
export const equipmentRepo = new BaseRepository<OmmEquipment>(`${NS}_equipments`);
export const alignmentRepo = new BaseRepository<OmmAlignment>(`${NS}_alignments`);
export const movementTypeRepo = new BaseRepository<OmmMovementTypeConfig>(`${NS}_movement_types`);
export const priorityRepo = new BaseRepository<OmmPriorityConfig>(`${NS}_priorities`);
export const engUnitRepo = new BaseRepository<OmmEngUnitConfig>(`${NS}_eng_units`);
export const alarmRepo = new BaseRepository<OmmAlarm>(`${NS}_alarms`);
export const auditRepo = new BaseRepository<OmmAuditEntry>(`${NS}_audit`);
export const cutoffRepo = new BaseRepository<OmmCutoffSnapshot>(`${NS}_cutoffs`);
export const simStateRepo = new SingletonRepository<OmmSimulatorState>(
  `${NS}_sim_state`,
  defaultSimState,
);

// Seeded flag
export const OMM_SEEDED_KEY = `${NS}_seeded`;
export function isOmmSeeded(): boolean {
  return localStorage.getItem(OMM_SEEDED_KEY) === 'true';
}
export function markOmmSeeded(): void {
  localStorage.setItem(OMM_SEEDED_KEY, 'true');
}

export function clearAllOmmData(): void {
  orderRepo.clear();
  movementRepo.clear();
  productRepo.clear();
  areaRepo.clear();
  equipmentRepo.clear();
  alignmentRepo.clear();
  movementTypeRepo.clear();
  priorityRepo.clear();
  engUnitRepo.clear();
  alarmRepo.clear();
  auditRepo.clear();
  cutoffRepo.clear();
  simStateRepo.clear();
  localStorage.removeItem(OMM_SEEDED_KEY);
}
