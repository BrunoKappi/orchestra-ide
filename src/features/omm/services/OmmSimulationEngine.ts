import type {
  OmmMovement,
  OmmEquipment,
  OmmEvent,
  OmmHistoryPoint,
  OmmSimulatorState,
  OmmAlarm,
} from '../types';
import { v4 as uuid } from 'uuid';
import {
  movementRepo,
  equipmentRepo,
  eventRepo,
  historyRepo,
  simStateRepo,
  alarmRepo,
} from '../repository';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TICK_INTERVAL_MS = 1000; // 1 second real time
const HISTORY_DECIMATION = 5;  // store 1 in every 5 ticks

function simulateWaveform(
  config: { type: 'random' | 'ramp' | 'sine' | 'triangle' | 'sawtooth' | 'noise' | 'oscillation'; min: number; max: number; period: number; step?: number },
  tickCount: number,
  currentValue: number
): number {
  const min = config.min;
  const max = config.max;
  const period = Math.max(1, config.period);
  const step = config.step ?? 1;

  switch (config.type) {
    case 'random':
      return min + Math.random() * (max - min);

    case 'ramp': {
      const delta = (max - min) / period;
      let next = currentValue + delta;
      if (next > max) next = min;
      return next;
    }

    case 'sine': {
      const sineFactor = (Math.sin((2 * Math.PI * tickCount) / period) + 1) / 2;
      return min + (max - min) * sineFactor;
    }

    case 'triangle': {
      const factor = Math.abs(((tickCount / period) % 1) * 2 - 1);
      return min + (max - min) * factor;
    }

    case 'sawtooth': {
      const factor = (tickCount / period) % 1;
      return min + (max - min) * factor;
    }

    case 'noise': {
      const delta = (Math.random() - 0.5) * 2 * step;
      return Math.min(max, Math.max(min, currentValue + delta));
    }

    case 'oscillation': {
      const sineFactor = (Math.sin((2 * Math.PI * tickCount) / period) + 1) / 2;
      const base = min + (max - min) * sineFactor;
      const noise = (Math.random() - 0.5) * 2 * (step * 0.1);
      return Math.min(max, Math.max(min, base + noise));
    }

    default:
      return currentValue;
  }
}

export class OmmSimulationEngine {
  private timerId: ReturnType<typeof setInterval> | null = null;
  private tickCount = 0;
  private onTickCallback: (() => void) | null = null;

  public setOnTick(cb: () => void): void {
    this.onTickCallback = cb;
  }

  public start(): void {
    if (this.timerId !== null) return;
    this.timerId = setInterval(() => this.tick(), TICK_INTERVAL_MS);
  }

  public stop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public isRunning(): boolean {
    return this.timerId !== null;
  }

  private tick(): void {
    this.tickCount++;

    const state = simStateRepo.get();
    if (!state.isRunning) {
      this.stop();
      return;
    }

    // Advance simulated time
    const dtMs = TICK_INTERVAL_MS * state.speedMultiplier;
    const simNow = new Date(new Date(state.simulatedTime).getTime() + dtMs);
    state.simulatedTime = simNow.toISOString();
    state.tickCount = this.tickCount;
    state.lastTickAt = new Date().toISOString();

    // Check cutoff trigger
    const cutoff = new Date(state.nextCutoffAt);
    if (simNow >= cutoff) {
      this.triggerCutoff(state, simNow);
      const next = new Date(cutoff);
      next.setDate(next.getDate() + 1);
      state.nextCutoffAt = next.toISOString();
    }

    simStateRepo.set(state);

    // Process active movements
    const movements = movementRepo.getAll().filter((m) => m.status === 'Active' && !m.simPaused);
    const equipments = equipmentRepo.getAll();
    const equipMap = new Map<string, OmmEquipment>(equipments.map((e) => [e.id, e]));

    // Maps to accumulate inlet and outlet flow rates for each equipment
    const flowInMap = new Map<string, number>();
    const flowOutMap = new Map<string, number>();

    const updatedMovements: OmmMovement[] = [];
    const newEvents: OmmEvent[] = [];
    const newHistory: OmmHistoryPoint[] = [];

    // 1. Process and compute each active movement
    for (const mov of movements) {
      const baseFlow = mov.simFlowRate * mov.simSpeedMultiplier;
      const noise = (Math.random() - 0.5) * 2 * mov.simNoise * baseFlow;
      const flow = Math.max(0, baseFlow + noise);

      let effectiveFlow = flow;
      if (mov.simMode === 'sine') {
        const t = this.tickCount / 60;
        effectiveFlow = flow * (0.8 + 0.2 * Math.sin(t * Math.PI));
      } else if (mov.simMode === 'ramp') {
        const ramp = Math.min(1, mov.percentComplete / 100 + 0.2);
        effectiveFlow = flow * ramp;
      }

      const dtHours = dtMs / 3_600_000;
      const deltaVol = effectiveFlow * dtHours;

      const updated = { ...mov };
      updated.currentFlow = effectiveFlow;
      updated.currentVolume = Math.min(updated.currentVolume + deltaVol, updated.plannedVolume);
      updated.currentMass = (updated.currentVolume * updated.density) / 1000;
      updated.correctedVolume = updated.currentVolume * updated.vcf;
      updated.percentComplete = (updated.currentVolume / updated.plannedVolume) * 100;
      updated.avgFlow = updated.avgFlow * 0.95 + effectiveFlow * 0.05;
      updated.accuracy = Math.max(95, updated.accuracy - Math.random() * 0.01);
      updated.temperature += (Math.random() - 0.5) * 0.1;

      // Estimated time to complete
      const remaining = updated.plannedVolume - updated.currentVolume;
      if (effectiveFlow > 0) {
        updated.ettcMin = (remaining / effectiveFlow) * 60;
        updated.etoc = new Date(simNow.getTime() + updated.ettcMin * 60_000).toISOString();
      }

      updated.lastUpdatedAt = state.simulatedTime;

      // Update source/dest level references on movement
      const origin = equipMap.get(mov.originId);
      if (origin) {
        updated.currentLevel = origin.currentLevel;
        flowOutMap.set(mov.originId, (flowOutMap.get(mov.originId) || 0) + effectiveFlow);
      }
      const dest = equipMap.get(mov.destinationId);
      if (dest) {
        updated.destLevel = dest.currentLevel;
        flowInMap.set(mov.destinationId, (flowInMap.get(mov.destinationId) || 0) + effectiveFlow);
      }

      // Check auto-completion
      if (updated.currentVolume >= updated.plannedVolume * 0.9999) {
        updated.status = 'Completed';
        updated.completedAt = state.simulatedTime;
        updated.percentComplete = 100;
        updated.currentFlow = 0;
        newEvents.push({
          id: uuid(),
          movementId: updated.id,
          orderId: updated.orderId,
          equipmentId: null,
          type: 'COMPLETION',
          severity: 'Low',
          message: 'Movimento concluído automaticamente',
          detail: `${updated.number} — ${updated.currentVolume.toFixed(0)} m³ transferidos`,
          value: updated.currentVolume.toFixed(0),
          threshold: null,
          acknowledged: false,
          acknowledgedBy: null,
          acknowledgedAt: null,
          resolvedAt: null,
          createdAt: state.simulatedTime
        });
      }

      // 90% threshold event
      if (updated.percentComplete >= 90 && mov.percentComplete < 90) {
        newEvents.push({
          id: uuid(),
          movementId: updated.id,
          orderId: updated.orderId,
          equipmentId: null,
          type: 'THRESHOLD_90PCT',
          severity: 'Medium',
          message: '90% do volume planejado atingido',
          detail: `${updated.number} — 90% concluído`,
          value: updated.currentVolume.toFixed(0),
          threshold: null,
          acknowledged: false,
          acknowledgedBy: null,
          acknowledgedAt: null,
          resolvedAt: null,
          createdAt: state.simulatedTime
        });
      }

      updatedMovements.push(updated);

      if (this.tickCount % HISTORY_DECIMATION === 0) {
        newHistory.push({
          id: uuid(),
          movementId: updated.id,
          timestamp: state.simulatedTime,
          volume: updated.currentVolume,
          mass: updated.currentMass,
          flow: updated.currentFlow,
          temperature: updated.temperature,
          pressure: updated.pressure,
          density: updated.density,
          level: updated.currentLevel,
          accuracy: updated.accuracy,
          quality: 'Good',
        });
      }
    }

    // 2. Process and update equipment (Tanks) continuously
    const updatedEquipments: OmmEquipment[] = [];
    const newAlarms: OmmAlarm[] = [];

    for (const eq of equipments) {
      if (eq.type !== 'Tank' && eq.type !== 'Vessel') {
        updatedEquipments.push(eq);
        continue;
      }

      let currentFlowIn = flowInMap.get(eq.id) || 0;
      let currentFlowOut = flowOutMap.get(eq.id) || 0;

      // Handle automation settings if in auto mode
      if (eq.simMode === 'auto' && eq.autoConfig) {
        if (eq.autoConfig.flowIn) {
          eq.flowIn = simulateWaveform(eq.autoConfig.flowIn, this.tickCount, eq.flowIn || 0);
        }
        if (eq.autoConfig.flowOut) {
          eq.flowOut = simulateWaveform(eq.autoConfig.flowOut, this.tickCount, eq.flowOut || 0);
        }
        if (eq.autoConfig.temperature) {
          eq.temperature = simulateWaveform(eq.autoConfig.temperature, this.tickCount, eq.temperature || 25);
        }
        if (eq.autoConfig.pressure) {
          eq.pressure = simulateWaveform(eq.autoConfig.pressure, this.tickCount, eq.pressure || 1.0);
        }
        if (eq.autoConfig.density) {
          eq.density = simulateWaveform(eq.autoConfig.density, this.tickCount, eq.density || 850);
        }
        if (eq.autoConfig.level) {
          eq.currentLevel = simulateWaveform(eq.autoConfig.level, this.tickCount, eq.currentLevel || 50);
          eq.currentVolume = (eq.capacity * eq.currentLevel) / 100;
          eq.currentMass = (eq.currentVolume * eq.density) / 1000;
        }
      }

      // Add static/manual configurations
      currentFlowIn += eq.flowIn || 0;
      currentFlowOut += eq.flowOut || 0;

      // If not automated on level, compute it based on flows
      if (!(eq.simMode === 'auto' && eq.autoConfig?.level)) {
        const netFlow = currentFlowIn - currentFlowOut;
        const dtHours = dtMs / 3_600_000;
        const deltaVol = netFlow * dtHours;

        const newVolume = Math.max(0, Math.min(eq.capacity, eq.currentVolume + deltaVol));
        const newLevel = (newVolume / eq.capacity) * 100;
        const newMass = (newVolume * eq.density) / 1000;

        eq.currentVolume = newVolume;
        eq.currentLevel = newLevel;
        eq.currentMass = newMass;
      }

      eq.isSending = currentFlowOut > 0;
      eq.isReceiving = currentFlowIn > 0;
      eq.updatedAt = state.simulatedTime;

      // Level alarms evaluation
      const activeAlarms = alarmRepo.getAll();
      const highAlarmType = 'HighLevel';
      const lowAlarmType = 'LowLevel';

      // High Alarm (>= 95%)
      if (eq.currentLevel >= 95) {
        const exists = activeAlarms.some(a => a.equipmentId === eq.id && a.type === highAlarmType && a.isActive);
        if (!exists) {
          newAlarms.push({
            id: uuid(),
            movementId: null,
            equipmentId: eq.id,
            type: highAlarmType,
            severity: 'High',
            message: `Nível crítico alto no tanque ${eq.tag}: ${eq.currentLevel.toFixed(1)}%`,
            isActive: true,
            acknowledged: false,
            acknowledgedBy: null,
            acknowledgedAt: null,
            activatedAt: state.simulatedTime,
            clearedAt: null,
            createdAt: state.simulatedTime
          });
        }
      } else {
        const alarm = activeAlarms.find(a => a.equipmentId === eq.id && a.type === highAlarmType && a.isActive);
        if (alarm) {
          alarm.isActive = false;
          alarm.clearedAt = state.simulatedTime;
          alarmRepo.save(alarm);
        }
      }

      // Low Alarm (<= 5%)
      if (eq.currentLevel <= 5) {
        const exists = activeAlarms.some(a => a.equipmentId === eq.id && a.type === lowAlarmType && a.isActive);
        if (!exists) {
          newAlarms.push({
            id: uuid(),
            movementId: null,
            equipmentId: eq.id,
            type: lowAlarmType,
            severity: 'High',
            message: `Nível crítico baixo no tanque ${eq.tag}: ${eq.currentLevel.toFixed(1)}%`,
            isActive: true,
            acknowledged: false,
            acknowledgedBy: null,
            acknowledgedAt: null,
            activatedAt: state.simulatedTime,
            clearedAt: null,
            createdAt: state.simulatedTime
          });
        }
      } else {
        const alarm = activeAlarms.find(a => a.equipmentId === eq.id && a.type === lowAlarmType && a.isActive);
        if (alarm) {
          alarm.isActive = false;
          alarm.clearedAt = state.simulatedTime;
          alarmRepo.save(alarm);
        }
      }

      updatedEquipments.push(eq);
    }

    // Persist changes
    if (updatedMovements.length > 0) {
      const allMovs = movementRepo.getAll();
      const movMap = new Map(allMovs.map((m) => [m.id, m]));
      updatedMovements.forEach((m) => movMap.set(m.id, m));
      movementRepo.saveAll(Array.from(movMap.values()));
    }

    if (updatedEquipments.length > 0) {
      equipmentRepo.saveAll(updatedEquipments);
    }

    if (newAlarms.length > 0) {
      const existing = alarmRepo.getAll();
      alarmRepo.saveAll([...existing, ...newAlarms].slice(-100));
    }

    if (newEvents.length > 0) {
      const existing = eventRepo.getAll();
      eventRepo.saveAll([...existing, ...newEvents].slice(-500));
    }

    if (newHistory.length > 0) {
      const existing = historyRepo.getAll();
      historyRepo.saveAll([...existing, ...newHistory].slice(-5000));
    }

    state.activeMovementCount = movements.length;
    simStateRepo.set(state);

    this.onTickCallback?.();
  }

  private triggerCutoff(_state: OmmSimulatorState, _simNow: Date): void {
    eventRepo.saveAll([
      ...eventRepo.getAll(),
      {
        id: uuid(),
        movementId: null,
        orderId: null,
        equipmentId: null,
        type: 'CUTOFF_CROSSING',
        severity: 'Low',
        message: 'Cut-off automático executado',
        detail: 'Snapshot de inventário capturado automaticamente',
        value: _simNow.toISOString(),
        threshold: null,
        acknowledged: false,
        acknowledgedBy: null,
        acknowledgedAt: null,
        resolvedAt: null,
        createdAt: _simNow.toISOString(),
      },
    ]);
  }
}

export const ommSimulationEngine = new OmmSimulationEngine();
