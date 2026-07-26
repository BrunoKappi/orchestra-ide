import { BaseRepository, SingletonRepository } from './BaseRepository';
import type {
  OmmOrder,
  OmmMovement,
  OmmProduct,
  OmmArea,
  OmmEquipment,
  OmmAlignment,
  OmmOperator,
  OmmEvent,
  OmmAlarm,
  OmmAuditEntry,
  OmmHistoryPoint,
  OmmCutoffSnapshot,
  OmmSimulatorState,
} from '../types';

// Storage key namespace
const NS = 'omm_v2';

const defaultSimState: OmmSimulatorState = {
  isRunning: false,
  speedMultiplier: 60,
  simulatedTime: new Date().toISOString(),
  tickCount: 0,
  lastTickAt: new Date().toISOString(),
  nextCutoffAt: '',
  cutoffHour: 1,
  activeMovementCount: 0,
};

export const orderRepo = new BaseRepository<OmmOrder>(`${NS}_orders`);
export const movementRepo = new BaseRepository<OmmMovement>(`${NS}_movements`);
export const productRepo = new BaseRepository<OmmProduct>(`${NS}_products`);
export const areaRepo = new BaseRepository<OmmArea>(`${NS}_areas`);
export const equipmentRepo = new BaseRepository<OmmEquipment>(`${NS}_equipments`);
export const alignmentRepo = new BaseRepository<OmmAlignment>(`${NS}_alignments`);
export const operatorRepo = new BaseRepository<OmmOperator>(`${NS}_operators`);
export const eventRepo = new BaseRepository<OmmEvent>(`${NS}_events`);
export const alarmRepo = new BaseRepository<OmmAlarm>(`${NS}_alarms`);
export const auditRepo = new BaseRepository<OmmAuditEntry>(`${NS}_audit`);
export const historyRepo = new BaseRepository<OmmHistoryPoint>(`${NS}_history`);
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
  operatorRepo.clear();
  eventRepo.clear();
  alarmRepo.clear();
  auditRepo.clear();
  historyRepo.clear();
  cutoffRepo.clear();
  simStateRepo.clear();
  localStorage.removeItem(OMM_SEEDED_KEY);
}
