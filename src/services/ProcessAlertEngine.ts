import { v4 as uuidv4 } from 'uuid';
import { processAlertRepo } from '../repository/ProcessAlertRepository';
import type { ProcessAlertRule, ProcessAlertOccur, ProcessAlertDefinition } from '../types/processAlert';
import { useProcessAlertStore, playSynthesizedSound } from '../store/useProcessAlertStore';
import { useLogStore } from '../store/useLogStore';
import type { ObjectEntity } from '../types/domain';

interface MovementSyncEntry {
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
  plannedStartAt?: string;
  plannedEndAt?: string;
  areaId?: string;
}

export class ProcessAlertEngine {
  private static lastSoundPlayedAt: Record<string, number> = {};
  private static absentTicks: Record<string, number> = {};
  private static readonly GRACE_PERIOD_TICKS = 3;
  // After resolving, keep the fired guard alive for this duration to prevent
  // immediate re-trigger when the condition is still true on the next tick.
  private static readonly FIRED_KEY_TTL_MS = 5 * 60 * 1000; // 5 minutes

  public static evaluate(
    simulatedValues: Record<string, string>,
    objects: ObjectEntity[],
    ommMovements: MovementSyncEntry[]
  ): void {
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();

    const rules = processAlertRepo.getRules();
    const definitions = processAlertRepo.getDefinitions();
    const occurrences = processAlertRepo.getOccurrences();

    const activeDefs = definitions.filter((d) => d.enabled);
    
    const testOccs = occurrences.filter((o) => o.isTest);
    const evalOccs = occurrences.filter((o) => !o.isTest);

    const activeEvalOccs = evalOccs.filter((o) => o.status === 'active_unacknowledged' || o.status === 'active_acknowledged');
    const inactiveEvalOccs = evalOccs.filter((o) => o.status === 'resolved' || o.status === 'expired');

    const occsMap = new Map<string, ProcessAlertOccur>();
    const recentlyFiredKeys = new Set<string>();

    activeEvalOccs.forEach((occ) => {
      const key = occ.definitionId 
        ? `${occ.definitionId}:${occ.relatedMovementId ?? ''}:${occ.relatedObjectId ?? ''}`
        : `${occ.ruleId}:${occ.relatedMovementId ?? ''}:${occ.relatedObjectId ?? ''}`;
      occsMap.set(key, { ...occ });
      recentlyFiredKeys.add(key);
    });

    inactiveEvalOccs.forEach((occ) => {
      const key = occ.definitionId
        ? `${occ.definitionId}:${occ.relatedMovementId ?? ''}:${occ.relatedObjectId ?? ''}`
        : `${occ.ruleId}:${occ.relatedMovementId ?? ''}:${occ.relatedObjectId ?? ''}`;
      
      if (occ.resolvedAt) {
        const resolvedMs = new Date(occ.resolvedAt).getTime();
        // Keep guard alive for TTL after resolution
        if (nowMs - resolvedMs < this.FIRED_KEY_TTL_MS) {
          recentlyFiredKeys.add(key);
        }
      } else {
        const activatedMs = new Date(occ.activatedAt).getTime();
        if (nowMs - activatedMs < this.FIRED_KEY_TTL_MS) {
          recentlyFiredKeys.add(key);
        }
      }
    });

    const activeKeysInThisTick = new Set<string>();

    const flagAlert = (
      definition: ProcessAlertDefinition,
      rule: ProcessAlertRule,
      movement: MovementSyncEntry | null,
      object: ObjectEntity | null,
      conditionSummary: string,
      currentValue: string,
      limitValue: string
    ) => {
      const defId = definition.id;
      const movId = movement?.id ?? null;
      const objId = object?.id ?? null;
      const alertKey = `${defId}:${movId ?? ''}:${objId ?? ''}`;
      
      activeKeysInThisTick.add(alertKey);
      delete this.absentTicks[alertKey];

      const existing = occsMap.get(alertKey);

      if (existing) {
        existing.currentValue = currentValue;
        existing.conditionSummary = conditionSummary;
        
        if (rule.repeatIntervalSec > 0) {
          const lastPlay = this.lastSoundPlayedAt[alertKey] || 0;
          if (nowMs - lastPlay >= rule.repeatIntervalSec * 1000) {
            playSynthesizedSound(rule.soundFile, rule.soundVolume / 100);
            this.lastSoundPlayedAt[alertKey] = nowMs;
            existing.lastNotifiedAt = nowIso;
          }
        }
        occsMap.set(alertKey, existing);
      } else {
        // Primary guard: block if this alert already fired and hasn't been fully cleared
        if (recentlyFiredKeys.has(alertKey)) return;

        const newOcc: ProcessAlertOccur = {
          id: `occ-${uuidv4()}`,
          ruleId: rule.id,
          definitionId: defId,
          code: definition.code,
          name: definition.name,
          type: rule.type,
          description: this.formatDescription(rule.description, movement, object),
          severity: rule.severity,
          responsibleAreas: [definition.areaId],
          relatedObjectId: objId,
          relatedObjectName: object?.name ?? null,
          relatedMovementId: movId,
          relatedMovementNumber: movement?.number || movement?.code || null,
          conditionSummary,
          currentValue,
          limitValue,
          status: 'active_unacknowledged',
          activatedAt: nowIso,
          acknowledgedAt: null,
          acknowledgedBy: null,
          resolvedAt: null,
          colorHighlight: rule.colorHighlight,
          soundFile: rule.soundFile,
          soundVolume: rule.soundVolume,
          isTest: false,
          lastNotifiedAt: nowIso,
        };

        occsMap.set(alertKey, newOcc);
        this.lastSoundPlayedAt[alertKey] = nowMs;

        useProcessAlertStore.getState().addToast(newOcc);
        playSynthesizedSound(rule.soundFile, rule.soundVolume / 100);

        useLogStore.getState().addLog({
          user: 'Sistema',
          module: 'Alertas de Processo',
          entity: 'Alerta',
          operation: 'CREATE',
          action: 'Alerta de Processo Ativado',
          description: `Alerta de Processo "${newOcc.name}" (${newOcc.code}) foi gerado.`,
          severity: newOcc.severity === 'critical' ? 'Aviso' : 'Informação',
          result: 'Sucesso',
          origin: 'sistema',
          targetId: newOcc.id,
        });
      }
    };

    const getMovementArea = (mov: MovementSyncEntry): string | null => {
      if (mov.areaId) return mov.areaId;
      const srcId = mov.sourceTankId || mov.originId;
      if (srcId) {
        const areaProp = simulatedValues[`${srcId}:Area`];
        if (areaProp) {
          if (areaProp.includes('300')) return 'area-300';
          if (areaProp.includes('400')) return 'area-400';
          if (areaProp.includes('500')) return 'area-500';
        }
        const srcObj = objects.find((o) => o.id === srcId || o.name === srcId);
        if (srcObj) return ProcessAlertEngine.getObjectAreaId(srcObj);
      }
      return null;
    };

    activeDefs.forEach((def) => {
      const rule = rules.find((r) => r.id === def.ruleId);
      if (!rule || !rule.enabled) return;

      if (rule.type === 'movement_delayed_start') {
        const startDelayMin = def.customParams?.startDelayMin ?? rule.params.startDelayMin ?? 5;
        ommMovements.forEach((mov) => {
          if (def.targetMovementId && mov.id !== def.targetMovementId) return;
          const movArea = getMovementArea(mov);
          if (def.areaId && movArea && movArea !== def.areaId) return;

          if (mov.status === 'Issued' && mov.plannedStartAt) {
            const startMs = new Date(mov.plannedStartAt).getTime();
            if (nowMs > startMs + startDelayMin * 60 * 1000) {
              const delayMins = Math.round((nowMs - startMs) / 60000);
              flagAlert(def, rule, mov, null, `tempo > plannedStartAt + ${startDelayMin} min`, `${delayMins} min de atraso`, `${startDelayMin} min`);
            }
          }
        });
      }

      if (rule.type === 'movement_delayed_end') {
        const endDelayMin = def.customParams?.endDelayMin ?? rule.params.endDelayMin ?? 10;
        ommMovements.forEach((mov) => {
          if (def.targetMovementId && mov.id !== def.targetMovementId) return;
          const movArea = getMovementArea(mov);
          if (def.areaId && movArea && movArea !== def.areaId) return;

          if (mov.status === 'Active' && mov.plannedEndAt) {
            const endMs = new Date(mov.plannedEndAt).getTime();
            if (nowMs > endMs + endDelayMin * 60 * 1000) {
              const delayMins = Math.round((nowMs - endMs) / 60000);
              flagAlert(def, rule, mov, null, `tempo > plannedEndAt + ${endDelayMin} min`, `${delayMins} min de atraso`, `${endDelayMin} min`);
            }
          }
        });
      }

      if (rule.type === 'movement_near_goal') {
        const customThreshold = def.customParams?.progressPctThreshold ? Number(def.customParams.progressPctThreshold) : null;
        const defaultThreshold = Number(rule.params.progressPctThreshold ?? 90);
        
        ommMovements.forEach((mov) => {
          if (def.targetMovementId && mov.id !== def.targetMovementId) return;
          const movArea = getMovementArea(mov);
          if (def.areaId && movArea && movArea !== def.areaId) return;

          if (mov.status === 'Active') {
            const progress = mov.percentComplete ?? 0;
            
            // Check custom threshold if it exists
            if (customThreshold !== null && progress >= customThreshold && progress < 100) {
              flagAlert(def, rule, mov, null, `progresso >= ${customThreshold}% (Custom)`, `${progress.toFixed(1)}%`, `${customThreshold}%`);
            }
            
            // Check default threshold (always check unless custom is exactly the same)
            if (progress >= defaultThreshold && progress < 100 && customThreshold !== defaultThreshold) {
              // Pass a cloned definition with a modified ID to generate a separate alert key for the default threshold
              const defaultDef = { ...def, id: `${def.id}-default`, name: `${def.name} (Padrão)` };
              flagAlert(defaultDef, rule, mov, null, `progresso >= ${defaultThreshold}% (Padrão)`, `${progress.toFixed(1)}%`, `${defaultThreshold}%`);
            }
          }
        });
      }

      if (rule.type === 'movement_goal_reached') {
        ommMovements.forEach((mov) => {
          if (def.targetMovementId && mov.id !== def.targetMovementId) return;
          const movArea = getMovementArea(mov);
          if (def.areaId && movArea && movArea !== def.areaId) return;

          if (mov.status === 'Completed') {
            flagAlert(def, rule, mov, null, 'status === Completed', '100% de volume transferido', '100%');
          }
        });
      }

      if (rule.type === 'movement_physical_completion_pending') {
        ommMovements.forEach((mov) => {
          if (def.targetMovementId && mov.id !== def.targetMovementId) return;
          const movArea = getMovementArea(mov);
          if (def.areaId && movArea && movArea !== def.areaId) return;

          if (mov.status === 'Completed') {
            flagAlert(def, rule, mov, null, 'Transferência física concluída (aguardando fechamento)', 'Conclusão Física Efetuada', 'Status: Closed');
          }
        });
      }

      if (rule.type === 'movement_deviation') {
        const flowDeviationPct = Number(def.customParams?.flowDeviationPct ?? rule.params.flowDeviationPct ?? 50);
        ommMovements.forEach((mov) => {
          if (def.targetMovementId && mov.id !== def.targetMovementId) return;
          const movArea = getMovementArea(mov);
          if (def.areaId && movArea && movArea !== def.areaId) return;

          if (mov.status === 'Active' && !mov.simPaused) {
            const plannedFlow = mov.plannedFlow || 100;
            const currentFlow = mov.currentFlow || 0;
            const factor = (100 - flowDeviationPct) / 100;
            if (currentFlow < plannedFlow * factor) {
              flagAlert(def, rule, mov, null, `vazão real < ${100 - flowDeviationPct}% da vazão planejada`, `${currentFlow.toFixed(1)} m³/h`, `>= ${(plannedFlow * factor).toFixed(1)} m³/h`);
            }
          }
        });
      }

      if (rule.type === 'movement_divergence') {
        const tolerance = Number(def.customParams?.divergenceTolerancePct ?? rule.params.divergenceTolerancePct ?? 5);
        ommMovements.forEach((mov) => {
          if (def.targetMovementId && mov.id !== def.targetMovementId) return;
          const movArea = getMovementArea(mov);
          if (def.areaId && movArea && movArea !== def.areaId) return;

          if (mov.status === 'Active' && !mov.simPaused) {
            const timeSeed = nowMs / 5000;
            const simulatedDivergencePct = Math.max(0, 1.5 + Math.sin(timeSeed) * 4.2);
            if (simulatedDivergencePct > tolerance) {
              flagAlert(def, rule, mov, null, `divergência observada > ${tolerance}%`, `${simulatedDivergencePct.toFixed(1)}%`, `< ${tolerance}%`);
            }
          }
        });
      }

      if (rule.type === 'process_ttl') {
        const ttlThresholdMin = def.customParams?.ttlThresholdMin ?? def.customParams?.ttlMinThreshold ?? rule.params.ttlThresholdMin ?? rule.params.ttlMinThreshold ?? 30;
        objects.forEach((obj) => {
          if (def.targetObjectId && obj.id !== def.targetObjectId) return;
          if (this.getObjectAreaId(obj) !== def.areaId) return;
          if (obj.isDeployed === false) return;

          const tag = simulatedValues[`${obj.id}:Tag`] || obj.name;
          if (!(tag.startsWith('TK-') || tag.startsWith('V-'))) return;

          const volume = parseFloat(simulatedValues[`${obj.id}:Volume`]);
          const flow = parseFloat(simulatedValues[`${obj.id}:Flow`]);
          const capacity = parseFloat(simulatedValues[`${obj.id}:Capacity`] || '15000');

          if (isNaN(volume) || isNaN(flow) || isNaN(capacity) || flow === 0) return;

          if (flow > 0) {
            const highLimit = 0.9 * capacity;
            if (volume < highLimit) {
              const ttlMins = ((highLimit - volume) / flow) * 60;
              if (ttlMins > 0 && ttlMins <= ttlThresholdMin) {
                const relatedMov = ommMovements.find(m => m.status === 'Active' && (m.destinationId === obj.id || m.destinationTankId === obj.id)) || null;
                flagAlert(def, rule, relatedMov, obj, `TTL operacional alto < ${ttlThresholdMin} min (Enchendo)`, `${Math.round(ttlMins)} min (até 90%)`, `${ttlThresholdMin} min`);
              }
            }
          } else if (flow < 0) {
            const lowLimit = 0.1 * capacity;
            if (volume > lowLimit) {
              const ttlMins = ((volume - lowLimit) / Math.abs(flow)) * 60;
              if (ttlMins > 0 && ttlMins <= ttlThresholdMin) {
                const relatedMov = ommMovements.find(m => m.status === 'Active' && (m.originId === obj.id || m.sourceTankId === obj.id)) || null;
                flagAlert(def, rule, relatedMov, obj, `TTL operacional baixo < ${ttlThresholdMin} min (Esvaziando)`, `${Math.round(ttlMins)} min (até 10%)`, `${ttlThresholdMin} min`);
              }
            }
          }
        });
      }

      if (rule.type === 'process_unexpected_evolution') {
        objects.forEach((obj) => {
          if (def.targetObjectId && obj.id !== def.targetObjectId) return;
          if (this.getObjectAreaId(obj) !== def.areaId) return;
          if (obj.isDeployed === false) return;

          const flow = parseFloat(simulatedValues[`${obj.id}:Flow`]);
          if (isNaN(flow) || Math.abs(flow) <= 15) return;

          const hasActiveMov = ommMovements.some((m) => m.status === 'Active' && (m.originId === obj.id || m.sourceTankId === obj.id || m.destinationId === obj.id || m.destinationTankId === obj.id));
          if (!hasActiveMov) {
            flagAlert(def, rule, null, obj, 'Variação de vazão sem movimento operacional ativo', `${flow > 0 ? '+' : ''}${flow.toFixed(1)} m³/h`, '0.0 m³/h');
          }
        });
      }
    });

    const finalOccurrences: ProcessAlertOccur[] = [...testOccs, ...inactiveEvalOccs];

    occsMap.forEach((occ, key) => {
      if (activeKeysInThisTick.has(key)) {
        finalOccurrences.push(occ);
      } else {
        this.absentTicks[key] = (this.absentTicks[key] || 0) + 1;
        if (this.absentTicks[key] >= this.GRACE_PERIOD_TICKS) {
          if (occ.status.startsWith('active')) {
            occ.status = 'resolved';
            occ.resolvedAt = nowIso;
            delete this.lastSoundPlayedAt[key];
          }
          finalOccurrences.push(occ);
        } else {
          finalOccurrences.push(occ);
        }
      }
    });

    const occsBefore = JSON.stringify(occurrences);
    const occsAfter = JSON.stringify(finalOccurrences);

    if (occsBefore !== occsAfter) {
      processAlertRepo.saveOccurrences(finalOccurrences);

      const store = useProcessAlertStore.getState();
      if (store.isInitialized) {
        store.refresh();
      }
    }

  }

  private static getObjectAreaId(obj: ObjectEntity): string {
    const name = obj.name || '';
    if (name.startsWith('TK-3') || name.startsWith('V-3')) return 'area-300';
    if (name.startsWith('TK-4') || name.startsWith('V-4')) return 'area-400';
    if (name.startsWith('TK-5') || name.startsWith('V-5')) return 'area-500';
    if (obj.id.includes('300') || obj.id.includes('30')) return 'area-300';
    if (obj.id.includes('400') || obj.id.includes('40')) return 'area-400';
    if (obj.id.includes('500') || obj.id.includes('50')) return 'area-500';
    return 'area-300';
  }

  private static formatDescription(template: string, movement: MovementSyncEntry | null, object: ObjectEntity | null): string {
    let desc = template;
    if (movement) {
      desc = desc.replace('movimentação', `movimentação ${movement.number || movement.code || ''}`);
      desc = desc.replace('transferência', `transferência ${movement.number || movement.code || ''}`);
    }
    if (object) {
      desc = desc.replace('tanque', `tanque ${object.name}`);
    }
    return desc;
  }
}
