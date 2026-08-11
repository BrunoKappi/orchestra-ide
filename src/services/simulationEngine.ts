import { propertyRepo } from '../repository/PropertyRepository';
import { objectRepo } from '../repository/ObjectRepository';
import { STORAGE_KEYS } from '../repository/storageKey';
import { AlarmEngine } from './AlarmEngine';
import { inheritanceService } from './InheritanceService';
import { ProcessAlertEngine } from './ProcessAlertEngine';

export interface MovementEntity {
  id: string;
  code: string;
  description: string;
  sourceTankId: string;
  sourceTankTag: string;
  destinationTankId: string;
  destinationTankTag: string;
  productId: string;
  productName: string;
  via: string;
  areaId: string;
  operatorId: string;
  operatorName: string;
  flowRate: number;
  plannedVolume: number;
  volumeMoved: number;
  remainingVolume: number;
  status: 'Issued' | 'Active' | 'Completed' | 'Closed' | 'Canceled';
  ettc: string;
  etoc: string;
  startTime: string | null;
}

// OMM movement type (sync interface)
interface OmmMovementSyncEntry {
  id: string;
  number?: string;
  code?: string;
  description?: string;
  originId?: string;
  destinationId?: string;
  sourceTankId?: string;
  destinationTankId?: string;
  status: 'Issued' | 'Active' | 'Completed' | 'Closed' | 'Canceled';
  plannedVolume: number;
  plannedFlow?: number;
  currentVolume: number;
  currentFlow: number;
  percentComplete: number;
  simFlowRate: number;
  simPaused: boolean;
  completedAt: string | null;
  updatedAt: string;
}

// Storage keys
const OMM_MOVEMENTS_KEY = 'omm_v2_movements';



export class SimulationEngine {
  private timer: number | null = null;
  private isRunning: boolean = false;
  private speedMult: number = 1;
  private tickListeners: Array<() => void> = [];
  private tickCount: number = 0;

  public start(_speedMult: number = 1): void {
    this.speedMult = 1;
    if (this.isRunning) return;
    this.isRunning = true;
    this.timer = window.setInterval(() => {
      this.tick();
    }, 1000);
  }

  public stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  public setSpeed(_speedMult: number): void {
    this.speedMult = 1;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public subscribe(listener: () => void): () => void {
    this.tickListeners.push(listener);
    return () => {
      this.tickListeners = this.tickListeners.filter((l) => l !== listener);
    };
  }

  public notifyListeners(): void {
    this.tickListeners.forEach((fn) => fn());
  }

  public tick(): void {
    this.tickCount++;

    // -------------------------------------------------------------------------
    // Read OMM movements (authoritative state for movements)
    // -------------------------------------------------------------------------
    const rawOmmMovements = localStorage.getItem(OMM_MOVEMENTS_KEY);
    const ommMovements: OmmMovementSyncEntry[] = rawOmmMovements
      ? JSON.parse(rawOmmMovements)
      : [];

    const allProps = propertyRepo.getAll();
    const propsByObject: Record<string, Record<string, any>> = {};

    allProps.forEach((p) => {
      if (!propsByObject[p.targetId]) {
        propsByObject[p.targetId] = {};
      }
      propsByObject[p.targetId][p.name] = p;
    });

    let updatedOmmMovements = false;

    // Reset flow and status on all tanks before accumulating active transfers
    Object.keys(propsByObject).forEach((objId) => {
      const pFlow = propsByObject[objId]['Flow'];
      if (pFlow && pFlow.defaultValue !== '0.0') {
        pFlow.defaultValue = '0.0';
        propertyRepo.save(pFlow);
      }
      const pStatus = propsByObject[objId]['Status'];
      if (pStatus && pStatus.defaultValue === 'Em Transferência') {
        pStatus.defaultValue = 'Normal';
        propertyRepo.save(pStatus);
      }
    });

    // -------------------------------------------------------------------------
    // Process active transfers — driven by OMM movements
    // -------------------------------------------------------------------------
    ommMovements.forEach((ommMov) => {
      if (ommMov.status !== 'Active') return;
      if (ommMov.simPaused) return;

      const srcId = ommMov.originId || ommMov.sourceTankId;
      const destId = ommMov.destinationId || ommMov.destinationTankId;

      if (!srcId || !destId) return;

      const srcProps = propsByObject[srcId];
      const destProps = propsByObject[destId];

      if (!srcProps || !destProps) return;

      const flowRate = ommMov.simFlowRate > 0 ? ommMov.simFlowRate : (ommMov.plannedFlow || 100);
      // Delta time in hours for 1s tick with speed multiplier
      const deltaTimeHours = (1 * this.speedMult) / 3600;
      let deltaVol = flowRate * deltaTimeHours;

      const srcCap = parseFloat(srcProps['Capacity']?.defaultValue || '15000');
      const srcVol = parseFloat(srcProps['Volume']?.defaultValue || '10000');
      const srcDensity = parseFloat(srcProps['Density']?.defaultValue || '720');

      const destCap = parseFloat(destProps['Capacity']?.defaultValue || '15000');
      const destVol = parseFloat(destProps['Volume']?.defaultValue || '5000');
      const destDensity = parseFloat(destProps['Density']?.defaultValue || '720');

      const srcMinHeel = srcCap * 0.05;
      const srcAvailableVol = Math.max(0, srcVol - srcMinHeel);
      const destAvailableVol = Math.max(0, destCap - destVol);
      const remainingMovVol = Math.max(0, ommMov.plannedVolume - ommMov.currentVolume);

      deltaVol = Math.min(deltaVol, srcAvailableVol, destAvailableVol, remainingMovVol);

      if (deltaVol > 0) {
        // Update Source tank
        const newSrcVol = Math.max(0, srcVol - deltaVol);
        const newSrcLvl = (newSrcVol / srcCap) * 100;
        const newSrcMass = (newSrcVol * srcDensity) / 1000;

        this.updateProp(srcProps, 'Volume', newSrcVol.toFixed(4));
        this.updateProp(srcProps, 'Level', newSrcLvl.toFixed(4));
        this.updateProp(srcProps, 'Mass', newSrcMass.toFixed(4));
        this.updateProp(srcProps, 'Flow', (-flowRate).toFixed(1));
        this.updateProp(srcProps, 'Status', 'Em Transferência');

        // Update Destination tank
        const newDestVol = Math.min(destCap, destVol + deltaVol);
        const newDestLvl = (newDestVol / destCap) * 100;
        const newDestMass = (newDestVol * destDensity) / 1000;

        this.updateProp(destProps, 'Volume', newDestVol.toFixed(4));
        this.updateProp(destProps, 'Level', newDestLvl.toFixed(4));
        this.updateProp(destProps, 'Mass', newDestMass.toFixed(4));
        this.updateProp(destProps, 'Flow', flowRate.toFixed(1));
        this.updateProp(destProps, 'Status', 'Em Transferência');

        // Update movement progress
        const newCurrentVol = Math.min(ommMov.plannedVolume, ommMov.currentVolume + deltaVol);
        const newPct = (newCurrentVol / ommMov.plannedVolume) * 100;
        const nowIso = new Date().toISOString();

        ommMov.currentVolume = newCurrentVol;
        ommMov.currentFlow = flowRate;
        ommMov.percentComplete = newPct;
        ommMov.updatedAt = nowIso;

        // Auto-complete when planned volume reached
        if (newCurrentVol >= ommMov.plannedVolume) {
          ommMov.status = 'Completed';
          ommMov.currentFlow = 0;
          ommMov.completedAt = nowIso;
        }

        updatedOmmMovements = true;
      }
    });

    // Write updated OMM movements back
    if (updatedOmmMovements) {
      localStorage.setItem(OMM_MOVEMENTS_KEY, JSON.stringify(ommMovements));
      // Sync active movements to global movements format
      const activeOnly = ommMovements.filter((m) => m.status === 'Active' && !m.simPaused).map((m) => ({
        id: m.id,
        code: m.number || m.code || m.id,
        description: m.description,
        sourceTankId: m.originId || m.sourceTankId,
        sourceTankTag: m.originId || m.sourceTankId,
        destinationTankId: m.destinationId || m.destinationTankId,
        destinationTankTag: m.destinationId || m.destinationTankId,
        flowRate: m.simFlowRate || m.plannedFlow || 100,
        plannedVolume: m.plannedVolume,
        volumeMoved: m.currentVolume,
        remainingVolume: Math.max(0, m.plannedVolume - m.currentVolume),
        status: m.status,
      }));
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(activeOnly));
    }

    // -------------------------------------------------------------------------
    // Process micro-variations (temperature, pressure, density noise & continuous drift)
    // -------------------------------------------------------------------------
    Object.keys(propsByObject).forEach((objId) => {
      const objProps = propsByObject[objId];
      if (objProps['Temperature']) {
        const currentTemp = parseFloat(objProps['Temperature'].defaultValue || '25.0');
        const noise = (Math.random() - 0.5) * 0.02; // was 0.15 — reduced to avoid chart spikes
        const newTemp = Math.max(-20, Math.min(80, currentTemp + noise));
        this.updateProp(objProps, 'Temperature', newTemp.toFixed(2));
      }
      if (objProps['Pressure']) {
        const currentPress = parseFloat(objProps['Pressure'].defaultValue || '1.2');
        const noise = (Math.random() - 0.5) * 0.004; // was 0.03 — reduced
        const newPress = Math.max(0.1, Math.min(35, currentPress + noise));
        this.updateProp(objProps, 'Pressure', newPress.toFixed(3));
      }
      if (objProps['Density']) {
        const currentDens = parseFloat(objProps['Density'].defaultValue || '720.0');
        const noise = (Math.random() - 0.5) * 0.1; // was 0.8 — reduced
        const newDens = Math.max(400, Math.min(1200, currentDens + noise));
        this.updateProp(objProps, 'Density', newDens.toFixed(2));
      }
    });

    // Record history samples every N ticks
    // (Handled in useObjectModelStore to include inherited properties properly)

    // Check Alarm Thresholds
    this.evaluateAlarms(propsByObject);

    // Check Process Alert Rules
    this.evaluateProcessAlerts(propsByObject, ommMovements);

    this.notifyListeners();
  }

  private updateProp(objProps: Record<string, any>, propName: string, value: string): void {
    if (objProps[propName]) {
      if (objProps[propName].defaultValue !== value) {
        objProps[propName].defaultValue = value;
        propertyRepo.save(objProps[propName]);
      }
    }
  }



  private evaluateAlarms(propsByObject: Record<string, Record<string, any>>): void {
    const objects = objectRepo.getAll();
    const simValues: Record<string, string> = {};

    Object.keys(propsByObject).forEach((objId) => {
      const objProps = propsByObject[objId];
      Object.keys(objProps).forEach((propName) => {
        simValues[`${objId}:${propName}`] = objProps[propName].defaultValue;
      });
    });

    AlarmEngine.evaluate(
      simValues,
      objects,
      (objectId, type) => inheritanceService.getMergedProperties(objectId, type)
    );
  }

  private evaluateProcessAlerts(
    propsByObject: Record<string, Record<string, any>>,
    ommMovements: any[]
  ): void {
    const objects = objectRepo.getAll();
    const simValues: Record<string, string> = {};

    Object.keys(propsByObject).forEach((objId) => {
      const objProps = propsByObject[objId];
      Object.keys(objProps).forEach((propName) => {
        simValues[`${objId}:${propName}`] = objProps[propName].defaultValue;
      });
    });

    ProcessAlertEngine.evaluate(simValues, objects, ommMovements);
  }
}

export const simulationEngine = new SimulationEngine();
