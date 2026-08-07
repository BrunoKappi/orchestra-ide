import { propertyRepo } from '../repository/PropertyRepository';
import { alarmRepo } from '../repository/AlarmRepository';
import { STORAGE_KEYS } from '../repository/storageKey';
import { historyEngine } from './HistoryEngine';
import type { AlarmEvent } from '../types/domain';

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

// OMM movement type (minimal interface for sync — avoid circular imports)
interface OmmMovementSyncEntry {
  id: string;
  status: 'Issued' | 'Active' | 'Completed' | 'Closed' | 'Canceled';
  plannedVolume: number;
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

// History sampling: record every N ticks to avoid filling localStorage
const HISTORY_SAMPLE_INTERVAL = 1;

export class SimulationEngine {
  private timer: number | null = null;
  private isRunning: boolean = false;
  private speedMult: number = 10;
  private tickListeners: Array<() => void> = [];
  private tickCount: number = 0;

  public start(speedMult: number = 10): void {
    this.speedMult = speedMult;
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

  public setSpeed(speedMult: number): void {
    this.speedMult = speedMult;
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

  private notifyListeners(): void {
    this.tickListeners.forEach((fn) => fn());
  }

  public tick(): void {
    this.tickCount++;

    // -------------------------------------------------------------------------
    // Read OMM movements (source of truth for plannedVolume, status, simPaused)
    // -------------------------------------------------------------------------
    const rawOmmMovements = localStorage.getItem(OMM_MOVEMENTS_KEY);
    const ommMovements: OmmMovementSyncEntry[] = rawOmmMovements
      ? JSON.parse(rawOmmMovements)
      : [];

    // Build a map for quick lookup
    const ommMovementMap = new Map(ommMovements.map((m) => [m.id, m]));

    // -------------------------------------------------------------------------
    // Read legacy global movements list (used to track origin/destination IDs)
    // -------------------------------------------------------------------------
    const rawMovements = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
    const movements: MovementEntity[] = rawMovements ? JSON.parse(rawMovements) : [];

    const allProps = propertyRepo.getAll();
    const propsByObject: Record<string, Record<string, any>> = {};

    allProps.forEach((p) => {
      if (!propsByObject[p.targetId]) {
        propsByObject[p.targetId] = {};
      }
      propsByObject[p.targetId][p.name] = p;
    });

    let updatedMovements = false;
    let updatedOmmMovements = false;

    // Reset flows on all tanks before accumulating active transfers
    Object.keys(propsByObject).forEach((objId) => {
      const pFlow = propsByObject[objId]['Flow'];
      if (pFlow) {
        if (pFlow.defaultValue !== '0.0') {
          pFlow.defaultValue = '0.0';
          propertyRepo.save(pFlow);
        }
      }
    });

    // -------------------------------------------------------------------------
    // Process active transfers — driven by OMM movements (authoritative state)
    // -------------------------------------------------------------------------
    movements.forEach((mov) => {
      // Check OMM authoritative state first
      const ommMov = ommMovementMap.get(mov.id);

      // Skip if OMM says this movement is not Active or is paused
      if (ommMov) {
        if (ommMov.status !== 'Active') return;
        if (ommMov.simPaused) return;

        // Use OMM's plannedVolume and currentVolume as the ground truth
        mov.plannedVolume = ommMov.plannedVolume;
        mov.volumeMoved = ommMov.currentVolume;
        mov.remainingVolume = Math.max(0, ommMov.plannedVolume - ommMov.currentVolume);

        // Use OMM's simFlowRate if set
        if (ommMov.simFlowRate > 0) {
          mov.flowRate = ommMov.simFlowRate;
        }
      } else {
        // Movement not in OMM store — skip if not Active in global list
        if (mov.status !== 'Active') return;
      }

      const srcProps = propsByObject[mov.sourceTankId];
      const destProps = propsByObject[mov.destinationTankId];

      if (!srcProps || !destProps) return;

      const flowRate = mov.flowRate || 100;
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
      const remainingMovVol = mov.remainingVolume;

      deltaVol = Math.min(deltaVol, srcAvailableVol, destAvailableVol, remainingMovVol);

      if (deltaVol > 0) {
        // Update Source tank
        const newSrcVol = Math.max(0, srcVol - deltaVol);
        const newSrcLvl = (newSrcVol / srcCap) * 100;
        const newSrcMass = (newSrcVol * srcDensity) / 1000;

        this.updateProp(srcProps, 'Volume', newSrcVol.toFixed(1));
        this.updateProp(srcProps, 'Level', newSrcLvl.toFixed(1));
        this.updateProp(srcProps, 'Mass', newSrcMass.toFixed(1));
        this.updateProp(srcProps, 'Flow', (-flowRate).toFixed(1));
        this.updateProp(srcProps, 'Status', 'Em Transferência');

        // Update Destination tank
        const newDestVol = Math.min(destCap, destVol + deltaVol);
        const newDestLvl = (newDestVol / destCap) * 100;
        const newDestMass = (newDestVol * destDensity) / 1000;

        this.updateProp(destProps, 'Volume', newDestVol.toFixed(1));
        this.updateProp(destProps, 'Level', newDestLvl.toFixed(1));
        this.updateProp(destProps, 'Mass', newDestMass.toFixed(1));
        this.updateProp(destProps, 'Flow', flowRate.toFixed(1));
        this.updateProp(destProps, 'Status', 'Em Transferência');

        // Update global movement progress
        mov.volumeMoved += deltaVol;
        mov.remainingVolume = Math.max(0, mov.plannedVolume - mov.volumeMoved);
        const hoursLeft = mov.remainingVolume / flowRate;
        mov.ettc = hoursLeft > 0 ? `${hoursLeft.toFixed(1)}h` : '0.0h';
        mov.etoc = mov.ettc;

        // -----------------------------------------------------------------------
        // Write progress back to OMM movements (authoritative store)
        // -----------------------------------------------------------------------
        if (ommMov) {
          const newCurrentVol = Math.min(ommMov.plannedVolume, ommMov.currentVolume + deltaVol);
          const newPct = (newCurrentVol / ommMov.plannedVolume) * 100;
          const nowIso = new Date().toISOString();

          ommMov.currentVolume = newCurrentVol;
          ommMov.currentFlow = flowRate;
          ommMov.percentComplete = newPct;
          ommMov.updatedAt = nowIso;

          // Auto-complete when planned volume reached
          if (newCurrentVol >= ommMov.plannedVolume) {
            mov.status = 'Completed';
            ommMov.status = 'Completed';
            ommMov.currentFlow = 0;
            ommMov.completedAt = nowIso;
            this.updateProp(srcProps, 'Status', 'Normal');
            this.updateProp(destProps, 'Status', 'Normal');
          }

          updatedOmmMovements = true;
        } else {
          // Fallback for movements not in OMM store
          if (mov.remainingVolume <= 0) {
            mov.status = 'Completed';
            this.updateProp(srcProps, 'Status', 'Normal');
            this.updateProp(destProps, 'Status', 'Normal');
          }
        }

        updatedMovements = true;
      }
    });

    if (updatedMovements) {
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
    }

    // Write updated OMM movements back — only if something changed
    if (updatedOmmMovements) {
      // Merge updated entries back into the full ommMovements array
      const updatedOmmList = ommMovements.map((m) => {
        const updated = ommMovementMap.get(m.id);
        return updated ?? m;
      });
      localStorage.setItem(OMM_MOVEMENTS_KEY, JSON.stringify(updatedOmmList));
    }

    // -------------------------------------------------------------------------
    // Process micro-variations (temperature / pressure noise)
    // -------------------------------------------------------------------------
    Object.keys(propsByObject).forEach((objId) => {
      const objProps = propsByObject[objId];
      if (objProps['Temperature']) {
        const currentTemp = parseFloat(objProps['Temperature'].defaultValue);
        const noise = (Math.random() - 0.5) * 0.05;
        const newTemp = Math.max(-20, Math.min(80, currentTemp + noise));
        this.updateProp(objProps, 'Temperature', newTemp.toFixed(1));
      }
      if (objProps['Pressure']) {
        const currentPress = parseFloat(objProps['Pressure'].defaultValue);
        const noise = (Math.random() - 0.5) * 0.002;
        const newPress = Math.max(0.1, Math.min(35, currentPress + noise));
        this.updateProp(objProps, 'Pressure', newPress.toFixed(2));
      }
    });

    // Record history samples every N ticks
    if (this.tickCount % HISTORY_SAMPLE_INTERVAL === 0) {
      this.recordHistory(propsByObject);
    }

    // Check Alarm Thresholds
    this.evaluateAlarms(propsByObject);

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

  private recordHistory(propsByObject: Record<string, Record<string, any>>): void {
    const trackedProps = ['Level', 'Volume', 'Temperature', 'Pressure', 'Flow', 'Mass'];
    const defaultHistConfig = {
      enabled: true,
      collectionMode: 'interval' as const,
      intervalMs: 1000,
      retentionMs: 3600000 * 24,
      maxSamples: 1000,
      deadband: 0,
      compression: false,
      engineeringUnit: '',
      notes: 'Auto-recorded by SimulationEngine',
    };

    Object.keys(propsByObject).forEach((objId) => {
      const objProps = propsByObject[objId];
      trackedProps.forEach((propName) => {
        if (objProps[propName]) {
          const prop = objProps[propName];
          historyEngine.record(objId, prop.id, prop.defaultValue, defaultHistConfig, 'simulation');
        }
      });
    });
  }

  private evaluateAlarms(propsByObject: Record<string, Record<string, any>>): void {
    const activeAlarms = alarmRepo.getAll();
    const now = new Date().toISOString();

    Object.keys(propsByObject).forEach((objId) => {
      const props = propsByObject[objId];
      const tag = props['Tag']?.defaultValue || objId;
      const level = parseFloat(props['Level']?.defaultValue || '50');
      const pressure = parseFloat(props['Pressure']?.defaultValue || '1.0');

      const hhLimit = parseFloat(props['HighHighLevel']?.defaultValue || '90');
      const hLimit = parseFloat(props['HighLevel']?.defaultValue || '80');
      const lLimit = parseFloat(props['LowLevel']?.defaultValue || '15');
      const llLimit = parseFloat(props['LowLowLevel']?.defaultValue || '5');
      const hPressLimit = parseFloat(props['HighPressure']?.defaultValue || '25');
      const lPressLimit = parseFloat(props['LowPressure']?.defaultValue || '0.9');

      // --- Level alarms ---
      this.checkHighAlarm(activeAlarms, now, `${objId}_HH_LEVEL`, objId, tag, 'Level',
        level >= hhLimit, level.toFixed(1), hhLimit.toString(), 'critical', 95,
        `[${tag}] ALARME CRÍTICO: Nível Muito Alto (${level.toFixed(1)}% >= ${hhLimit}%)`, '#ef4444', 'ShieldAlert');

      this.checkHighAlarm(activeAlarms, now, `${objId}_H_LEVEL`, objId, tag, 'Level',
        level >= hLimit && level < hhLimit, level.toFixed(1), hLimit.toString(), 'high', 75,
        `[${tag}] ALERTA: Nível Alto (${level.toFixed(1)}% >= ${hLimit}%)`, '#f97316', 'AlertTriangle');

      this.checkLowAlarm(activeAlarms, now, `${objId}_L_LEVEL`, objId, tag, 'Level',
        level <= lLimit && level > llLimit, level.toFixed(1), lLimit.toString(), 'medium', 55,
        `[${tag}] ALERTA: Nível Baixo (${level.toFixed(1)}% <= ${lLimit}%)`, '#eab308', 'AlertTriangle');

      this.checkLowAlarm(activeAlarms, now, `${objId}_LL_LEVEL`, objId, tag, 'Level',
        level <= llLimit, level.toFixed(1), llLimit.toString(), 'critical', 90,
        `[${tag}] ALARME CRÍTICO: Nível Muito Baixo (${level.toFixed(1)}% <= ${llLimit}%)`, '#ef4444', 'ShieldAlert');

      // --- Pressure alarms ---
      this.checkHighAlarm(activeAlarms, now, `${objId}_H_PRESS`, objId, tag, 'Pressure',
        pressure >= hPressLimit, pressure.toFixed(2), hPressLimit.toString(), 'high', 70,
        `[${tag}] ALERTA: Pressão Alta (${pressure.toFixed(2)} >= ${hPressLimit} bar)`, '#f97316', 'AlertTriangle');

      this.checkLowAlarm(activeAlarms, now, `${objId}_L_PRESS`, objId, tag, 'Pressure',
        pressure <= lPressLimit, pressure.toFixed(2), lPressLimit.toString(), 'medium', 50,
        `[${tag}] ALERTA: Pressão Baixa (${pressure.toFixed(2)} <= ${lPressLimit} bar)`, '#eab308', 'AlertTriangle');
    });
  }

  private checkHighAlarm(
    activeAlarms: AlarmEvent[],
    now: string,
    alarmKey: string,
    objId: string,
    tag: string,
    propName: string,
    condition: boolean,
    currentVal: string,
    configuredVal: string,
    severity: AlarmEvent['severity'],
    priority: number,
    message: string,
    color: string,
    icon: string,
  ): void {
    const existing = activeAlarms.find((a) => a.id === alarmKey);
    if (condition) {
      if (!existing || existing.status.startsWith('Cleared')) {
        alarmRepo.save({
          id: alarmKey, ruleId: alarmKey, objectId: objId, objectName: tag,
          propertyName: propName, currentValue: currentVal, configuredValue: configuredVal,
          severity, priority, message, color, icon,
          activatedAt: now, acknowledgedAt: null, clearedAt: null, ackedBy: null,
          durationMs: null, status: 'Active Unacknowledged',
        });
      } else if (existing && existing.status.startsWith('Active')) {
        if (existing.currentValue !== currentVal) {
          existing.currentValue = currentVal;
          alarmRepo.save(existing);
        }
      }
    } else if (existing && existing.status.startsWith('Active')) {
      existing.status = existing.status === 'Active Acknowledged' ? 'Cleared Acknowledged' : 'Cleared Unacknowledged';
      existing.clearedAt = now;
      alarmRepo.save(existing);
    }
  }

  private checkLowAlarm(
    activeAlarms: AlarmEvent[],
    now: string,
    alarmKey: string,
    objId: string,
    tag: string,
    propName: string,
    condition: boolean,
    currentVal: string,
    configuredVal: string,
    severity: AlarmEvent['severity'],
    priority: number,
    message: string,
    color: string,
    icon: string,
  ): void {
    this.checkHighAlarm(activeAlarms, now, alarmKey, objId, tag, propName, condition,
      currentVal, configuredVal, severity, priority, message, color, icon);
  }
}

export const simulationEngine = new SimulationEngine();
