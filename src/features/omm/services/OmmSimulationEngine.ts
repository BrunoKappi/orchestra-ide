/**
 * OmmSimulationEngine - Stub
 *
 * The OMM simulation is now driven by the central SimulationEngine in
 * src/services/simulationEngine.ts, which processes STORAGE_KEYS.MOVEMENTS
 * and updates propertyRepo directly.
 *
 * This stub exists only to satisfy imports in useOmmStore.ts without
 * running a conflicting second setInterval.
 */

export class OmmSimulationEngine {
  /** No-op: the central SimulationEngine handles all simulation */
  public setOnTick(_cb: () => void): void {}

  /** No-op: the central SimulationEngine handles all simulation */
  public start(): void {}

  /** No-op */
  public stop(): void {}

  /** Always returns false - this engine is disabled */
  public isRunning(): boolean {
    return false;
  }
}

export const ommSimulationEngine = new OmmSimulationEngine();
