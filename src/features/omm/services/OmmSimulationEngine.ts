import type {
  OmmMovement,
  OmmEquipment,
  OmmEvent,
  OmmHistoryPoint,
  OmmSimulatorState,
} from '../types';
import { v4 as uuid } from 'uuid';
import {
  movementRepo,
  equipmentRepo,
  eventRepo,
  historyRepo,
  simStateRepo,
} from '../repository';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TICK_INTERVAL_MS = 1000; // 1 second real time
const HISTORY_DECIMATION = 5;  // store 1 in every 5 ticks

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Core tick
  // -------------------------------------------------------------------------
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

    const updatedMovements: OmmMovement[] = [];
    const updatedEquipments: OmmEquipment[] = [];
    const newEvents: OmmEvent[] = [];
    const newHistory: OmmHistoryPoint[] = [];

    for (const mov of movements) {
      const result = this.computeMovement(mov, state, dtMs / 3_600_000, equipMap);
      updatedMovements.push(result.movement);
      newEvents.push(...result.events);
      if (this.tickCount % HISTORY_DECIMATION === 0) {
        newHistory.push(this.captureHistoryPoint(result.movement));
      }
      // Update equipment levels
      if (result.originUpdate) updatedEquipments.push(result.originUpdate);
      if (result.destUpdate) updatedEquipments.push(result.destUpdate);
    }

    // Persist
    if (updatedMovements.length > 0) {
      const allMovs = movementRepo.getAll();
      const movMap = new Map(allMovs.map((m) => [m.id, m]));
      updatedMovements.forEach((m) => movMap.set(m.id, m));
      movementRepo.saveAll(Array.from(movMap.values()));
    }

    if (updatedEquipments.length > 0) {
      const eqMap = new Map(equipments.map((e) => [e.id, e]));
      updatedEquipments.forEach((e) => eqMap.set(e.id, e));
      equipmentRepo.saveAll(Array.from(eqMap.values()));
    }

    if (newEvents.length > 0) {
      const existing = eventRepo.getAll();
      eventRepo.saveAll([...existing, ...newEvents].slice(-500)); // keep last 500
    }

    if (newHistory.length > 0) {
      const existing = historyRepo.getAll();
      historyRepo.saveAll([...existing, ...newHistory].slice(-5000)); // keep last 5000
    }

    state.activeMovementCount = movements.length;
    simStateRepo.set(state);

    this.onTickCallback?.();
  }

  // -------------------------------------------------------------------------
  // Movement computation
  // -------------------------------------------------------------------------
  private computeMovement(
    mov: OmmMovement,
    _state: OmmSimulatorState,
    dtHours: number,
    equipMap: Map<string, OmmEquipment>,
  ): {
    movement: OmmMovement;
    events: OmmEvent[];
    originUpdate: OmmEquipment | null;
    destUpdate: OmmEquipment | null;
  } {
    const events: OmmEvent[] = [];
    const updated = { ...mov };

    // Compute instantaneous flow with noise
    const baseFlow = updated.simFlowRate * updated.simSpeedMultiplier;
    const noise = (Math.random() - 0.5) * 2 * updated.simNoise * baseFlow;
    const flow = Math.max(0, baseFlow + noise);

    // Apply waveform if sine mode
    let effectiveFlow = flow;
    if (updated.simMode === 'sine') {
      const t = Date.now() / 60000;
      effectiveFlow = flow * (0.8 + 0.2 * Math.sin(t * Math.PI));
    } else if (updated.simMode === 'ramp') {
      const ramp = Math.min(1, updated.percentComplete / 100 + 0.2);
      effectiveFlow = flow * ramp;
    }

    const deltaVol = effectiveFlow * dtHours;

    updated.currentFlow = effectiveFlow;
    updated.currentVolume = Math.min(updated.currentVolume + deltaVol, updated.plannedVolume);
    updated.currentMass = (updated.currentVolume * updated.density) / 1000;
    updated.correctedVolume = updated.currentVolume * updated.vcf;
    updated.percentComplete = (updated.currentVolume / updated.plannedVolume) * 100;

    // Running avg flow
    updated.avgFlow = updated.avgFlow * 0.95 + effectiveFlow * 0.05;

    // Accuracy with drift
    updated.accuracy = Math.max(95, updated.accuracy - Math.random() * 0.01);

    // Temperature drift
    updated.temperature += (Math.random() - 0.5) * 0.1;

    // Estimated time to complete
    const remaining = updated.plannedVolume - updated.currentVolume;
    if (effectiveFlow > 0) {
      updated.ettcMin = (remaining / effectiveFlow) * 60;
      updated.etoc = new Date(Date.now() + updated.ettcMin * 60_000).toISOString();
    }

    updated.lastUpdatedAt = new Date().toISOString();

    // Equipment level updates
    let originUpdate: OmmEquipment | null = null;
    let destUpdate: OmmEquipment | null = null;

    const origin = equipMap.get(updated.originId);
    if (origin && origin.capacity > 0) {
      const pctDelta = (deltaVol / origin.capacity) * 100;
      const newLvl = Math.max(0, origin.currentLevel - pctDelta);
      originUpdate = {
        ...origin,
        currentLevel: newLvl,
        currentVolume: (origin.capacity * newLvl) / 100,
        currentMass: (origin.capacity * newLvl * origin.density) / 100_000,
        isSending: true,
        updatedAt: new Date().toISOString(),
      };
      updated.currentLevel = newLvl;
    }

    const dest = equipMap.get(updated.destinationId);
    if (dest && dest.capacity > 0) {
      const pctDelta = (deltaVol / dest.capacity) * 100;
      const newLvl = Math.min(100, dest.currentLevel + pctDelta);
      destUpdate = {
        ...dest,
        currentLevel: newLvl,
        currentVolume: (dest.capacity * newLvl) / 100,
        currentMass: (dest.capacity * newLvl * dest.density) / 100_000,
        isReceiving: true,
        updatedAt: new Date().toISOString(),
      };
      updated.destLevel = newLvl;
    }

    // Auto-complete when 100%
    if (updated.currentVolume >= updated.plannedVolume * 0.9999) {
      updated.status = 'Completed';
      updated.completedAt = new Date().toISOString();
      updated.percentComplete = 100;
      updated.currentFlow = 0;
      if (originUpdate) originUpdate.isSending = false;
      if (destUpdate) destUpdate.isReceiving = false;
      events.push(this.makeEvent(updated, 'COMPLETION', 'Low', 'Movimento concluído automaticamente', updated.currentVolume.toFixed(0) + ' m³ transferidos'));
    }

    // 90% threshold event
    if (updated.percentComplete >= 90 && mov.percentComplete < 90) {
      events.push(this.makeEvent(updated, 'THRESHOLD_90PCT', 'Medium', '90% do volume planejado atingido', updated.currentVolume.toFixed(0)));
    }

    // Flow deviation event
    const deviation = Math.abs(effectiveFlow - updated.plannedFlow) / updated.plannedFlow;
    if (deviation > 0.2 && Math.random() < 0.01) {
      events.push(this.makeEvent(updated, 'FLOW_DEVIATION', 'Medium', 'Desvio de vazão detectado', `${(deviation * 100).toFixed(1)}%`));
    }

    // Low accuracy event
    if (updated.accuracy < 96 && Math.random() < 0.005) {
      events.push(this.makeEvent(updated, 'LOW_ACCURACY', 'High', 'Accuracy abaixo do limite', updated.accuracy.toFixed(2) + '%'));
    }

    return { movement: updated, events, originUpdate, destUpdate };
  }

  private makeEvent(
    mov: OmmMovement,
    type: OmmEvent['type'],
    severity: OmmEvent['severity'],
    message: string,
    value: string | null,
  ): OmmEvent {
    return {
      id: uuid(),
      movementId: mov.id,
      orderId: mov.orderId,
      equipmentId: null,
      type,
      severity,
      message,
      detail: `${mov.number} — ${message}`,
      value,
      threshold: null,
      acknowledged: false,
      acknowledgedBy: null,
      acknowledgedAt: null,
      resolvedAt: null,
      createdAt: new Date().toISOString(),
    };
  }

  private captureHistoryPoint(mov: OmmMovement): OmmHistoryPoint {
    return {
      id: uuid(),
      movementId: mov.id,
      timestamp: new Date().toISOString(),
      volume: mov.currentVolume,
      mass: mov.currentMass,
      flow: mov.currentFlow,
      temperature: mov.temperature,
      pressure: mov.pressure,
      density: mov.density,
      level: mov.currentLevel,
      accuracy: mov.accuracy,
      quality: 'Good',
    };
  }

  private triggerCutoff(_state: OmmSimulatorState, _simNow: Date): void {
    // Cutoff logic handled by store when it detects crossing
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
        createdAt: new Date().toISOString(),
      },
    ]);
  }
}

export const ommSimulationEngine = new OmmSimulationEngine();
