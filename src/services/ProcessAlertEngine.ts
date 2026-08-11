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

  public static evaluate(
    simulatedValues: Record<string, string>,
    objects: ObjectEntity[],
    ommMovements: MovementSyncEntry[]
  ): void {
    const rules = processAlertRepo.getRules();
    const definitions = processAlertRepo.getDefinitions();
    const occurrences = processAlertRepo.getOccurrences();

    const activeDefs = definitions.filter((d) => d.enabled);
    
    // Split current occurrences
    const testOccs = occurrences.filter((o) => o.isTest);
    const evalOccs = occurrences.filter((o) => !o.isTest);

    // Filter evalOccs into active and inactive
    const activeEvalOccs = evalOccs.filter((o) => o.status === 'active_unacknowledged' || o.status === 'active_acknowledged');
    const inactiveEvalOccs = evalOccs.filter((o) => o.status === 'resolved' || o.status === 'expired');

    // Map active occurrences by alertKey: definitionId:movementId:objectId
    const occsMap = new Map<string, ProcessAlertOccur>();
    activeEvalOccs.forEach((occ) => {
      const key = occ.definitionId 
        ? `${occ.definitionId}:${occ.relatedMovementId ?? ''}:${occ.relatedObjectId ?? ''}`
        : `${occ.ruleId}:${occ.relatedMovementId ?? ''}:${occ.relatedObjectId ?? ''}`;
      occsMap.set(key, occ);
    });

    const now = new Date();
    const nowIso = now.toISOString();
    const nowMs = now.getTime();

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

      const existing = occsMap.get(alertKey);

      if (existing) {
        existing.currentValue = currentValue;
        existing.conditionSummary = conditionSummary;
        
        if (rule.repeatIntervalSec > 0) {
          if (this.lastSoundPlayedAt[alertKey] === undefined) {
            this.lastSoundPlayedAt[alertKey] = nowMs;
          }
          const lastPlay = this.lastSoundPlayedAt[alertKey];
          if (nowMs - lastPlay >= rule.repeatIntervalSec * 1000) {
            playSynthesizedSound(rule.soundFile, rule.soundVolume / 100);
            this.lastSoundPlayedAt[alertKey] = nowMs;
            existing.lastNotifiedAt = nowIso;
          }
        }
        
        occsMap.set(alertKey, existing);
      } else {
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
          description: `Alerta de Processo "${newOcc.name}" (${newOcc.code}) foi gerado para ${object ? 'objeto ' + object.name : 'movimento ' + newOcc.relatedMovementNumber}.`,
          severity: newOcc.severity === 'critical' ? 'Aviso' : 'Informação',
          result: 'Sucesso',
          origin: 'sistema',
          targetId: newOcc.id,
        });
      }
    };

    // Evaluate each enabled definition
    activeDefs.forEach((def) => {
      const rule = rules.find((r) => r.id === def.ruleId);
      if (!rule || !rule.enabled) return;

      // 1. Início Atrasado (movement_delayed_start)
      if (rule.type === 'movement_delayed_start') {
        const startDelayMin = rule.params.startDelayMin ?? 5;
        ommMovements.forEach((mov) => {
          if (def.targetMovementId && mov.id !== def.targetMovementId) return;
          if (mov.areaId !== def.areaId) return;

          if (mov.status === 'Issued' && mov.plannedStartAt) {
            const startMs = new Date(mov.plannedStartAt).getTime();
            if (nowMs > startMs + startDelayMin * 60 * 1000) {
              const delayMins = Math.round((nowMs - startMs) / 60000);
              flagAlert(
                def,
                rule,
                mov,
                null,
                `tempo > plannedStartAt + ${startDelayMin} min`,
                `${delayMins} min de atraso`,
                `${startDelayMin} min`
              );
            }
          }
        });
      }

      // 2. Término Atrasado (movement_delayed_end)
      if (rule.type === 'movement_delayed_end') {
        const endDelayMin = rule.params.endDelayMin ?? 10;
        ommMovements.forEach((mov) => {
          if (def.targetMovementId && mov.id !== def.targetMovementId) return;
          if (mov.areaId !== def.areaId) return;

          if (mov.status === 'Active' && mov.plannedEndAt) {
            const endMs = new Date(mov.plannedEndAt).getTime();
            if (nowMs > endMs + endDelayMin * 60 * 1000) {
              const delayMins = Math.round((nowMs - endMs) / 60000);
              flagAlert(
                def,
                rule,
                mov,
                null,
                `tempo > plannedEndAt + ${endDelayMin} min`,
                `${delayMins} min de atraso`,
                `${endDelayMin} min`
              );
            }
          }
        });
      }

      // 3. Próximo da Meta (movement_near_goal)
      if (rule.type === 'movement_near_goal') {
        const threshold = rule.params.progressPctThreshold ?? 90;
        ommMovements.forEach((mov) => {
          if (def.targetMovementId && mov.id !== def.targetMovementId) return;
          if (mov.areaId !== def.areaId) return;

          if (mov.status === 'Active') {
            const progress = mov.percentComplete ?? 0;
            if (progress >= threshold && progress < 100) {
              flagAlert(
                def,
                rule,
                mov,
                null,
                `progresso >= ${threshold}%`,
                `${progress.toFixed(1)}%`,
                `${threshold}%`
              );
            }
          }
        });
      }

      // 4. Meta Atingida (movement_goal_reached)
      if (rule.type === 'movement_goal_reached') {
        ommMovements.forEach((mov) => {
          if (def.targetMovementId && mov.id !== def.targetMovementId) return;
          if (mov.areaId !== def.areaId) return;

          if (mov.status === 'Completed') {
            flagAlert(
              def,
              rule,
              mov,
              null,
              'status === Completed',
              '100% de volume transferido',
              '100%'
            );
          }
        });
      }

      // 5. Conclusão Física Pendente (movement_physical_completion_pending)
      if (rule.type === 'movement_physical_completion_pending') {
        ommMovements.forEach((mov) => {
          if (def.targetMovementId && mov.id !== def.targetMovementId) return;
          if (mov.areaId !== def.areaId) return;

          if (mov.status === 'Completed') {
            flagAlert(
              def,
              rule,
              mov,
              null,
              'Transferência física concluída (aguardando fechamento)',
              'Conclusão Física Efetuada',
              'Status: Closed'
            );
          }
        });
      }

      // 6. Desvio de Comportamento na Movimentação (movement_deviation)
      if (rule.type === 'movement_deviation') {
        ommMovements.forEach((mov) => {
          if (def.targetMovementId && mov.id !== def.targetMovementId) return;
          if (mov.areaId !== def.areaId) return;

          if (mov.status === 'Active' && !mov.simPaused) {
            const plannedFlow = mov.plannedFlow || 100;
            const currentFlow = mov.currentFlow || 0;
            
            if (currentFlow < plannedFlow * 0.5) {
              flagAlert(
                def,
                rule,
                mov,
                null,
                `vazão real < 50% da vazão planejada`,
                `${currentFlow.toFixed(1)} m³/h`,
                `>= ${(plannedFlow * 0.5).toFixed(1)} m³/h`
              );
            }
          }
        });
      }

      // 7. Divergência de Transferência (movement_divergence)
      if (rule.type === 'movement_divergence') {
        const tolerance = rule.params.divergenceTolerancePct ?? 5;
        ommMovements.forEach((mov) => {
          if (def.targetMovementId && mov.id !== def.targetMovementId) return;
          if (mov.areaId !== def.areaId) return;

          if (mov.status === 'Active' && !mov.simPaused) {
            const timeSeed = nowMs / 5000;
            const simulatedDivergencePct = Math.max(0, 1.5 + Math.sin(timeSeed) * 4.2);
            
            if (simulatedDivergencePct > tolerance) {
              flagAlert(
                def,
                rule,
                mov,
                null,
                `divergência observada > ${tolerance}%`,
                `${simulatedDivergencePct.toFixed(1)}%`,
                `< ${tolerance}%`
              );
            }
          }
        });
      }

      // 8. Alerta Preditivo TTL (process_ttl)
      if (rule.type === 'process_ttl') {
        const ttlThresholdMin = rule.params.ttlThresholdMin ?? 30;
        
        objects.forEach((obj) => {
          if (def.targetObjectId && obj.id !== def.targetObjectId) return;
          if (this.getObjectAreaId(obj) !== def.areaId) return;

          const isDeployed = obj.isDeployed !== false;
          if (!isDeployed) return;

          const tag = simulatedValues[`${obj.id}:Tag`] || obj.name;
          const isTank = tag.startsWith('TK-') || tag.startsWith('V-');
          if (!isTank) return;

          const volumeRaw = simulatedValues[`${obj.id}:Volume`];
          const flowRaw = simulatedValues[`${obj.id}:Flow`];
          const capacityRaw = simulatedValues[`${obj.id}:Capacity`] || '15000';

          if (!volumeRaw || !flowRaw) return;

          const volume = parseFloat(volumeRaw);
          const flow = parseFloat(flowRaw);
          const capacity = parseFloat(capacityRaw);

          if (isNaN(volume) || isNaN(flow) || isNaN(capacity) || flow === 0) return;

          if (flow > 0) {
            const highLimit = 0.9 * capacity;
            if (volume < highLimit) {
              const ttlHours = (highLimit - volume) / flow;
              const ttlMins = ttlHours * 60;
              
              if (ttlMins > 0 && ttlMins <= ttlThresholdMin) {
                const relatedMov = ommMovements.find(m => m.status === 'Active' && (m.destinationId === obj.id || m.destinationTankId === obj.id)) || null;
                
                flagAlert(
                  def,
                  rule,
                  relatedMov,
                  obj,
                  `TTL operacional alto < ${ttlThresholdMin} min (Enchendo)`,
                  `${Math.round(ttlMins)} min (até 90%)`,
                  `${ttlThresholdMin} min`
                );
              }
            }
          } 
          else if (flow < 0) {
            const lowLimit = 0.1 * capacity;
            if (volume > lowLimit) {
              const ttlHours = (volume - lowLimit) / Math.abs(flow);
              const ttlMins = ttlHours * 60;

              if (ttlMins > 0 && ttlMins <= ttlThresholdMin) {
                const relatedMov = ommMovements.find(m => m.status === 'Active' && (m.originId === obj.id || m.sourceTankId === obj.id)) || null;

                flagAlert(
                  def,
                  rule,
                  relatedMov,
                  obj,
                  `TTL operacional baixo < ${ttlThresholdMin} min (Esvaziando)`,
                  `${Math.round(ttlMins)} min (até 10%)`,
                  `${ttlThresholdMin} min`
                );
              }
            }
          }
        });
      }

      // 9. Evolução Inesperada do Processo (process_unexpected_evolution)
      if (rule.type === 'process_unexpected_evolution') {
        objects.forEach((obj) => {
          if (def.targetObjectId && obj.id !== def.targetObjectId) return;
          if (this.getObjectAreaId(obj) !== def.areaId) return;

          const isDeployed = obj.isDeployed !== false;
          if (!isDeployed) return;

          const tag = simulatedValues[`${obj.id}:Tag`] || obj.name;
          const isTank = tag.startsWith('TK-') || tag.startsWith('V-');
          if (!isTank) return;

          const flowRaw = simulatedValues[`${obj.id}:Flow`];
          if (!flowRaw) return;

          const flow = parseFloat(flowRaw);
          if (isNaN(flow)) return;

          if (Math.abs(flow) > 15) {
            const hasActiveMov = ommMovements.some(
              (m) => m.status === 'Active' && 
                (m.originId === obj.id || m.sourceTankId === obj.id || 
                 m.destinationId === obj.id || m.destinationTankId === obj.id)
            );

            if (!hasActiveMov) {
              flagAlert(
                def,
                rule,
                null,
                obj,
                'Variação de vazão sem movimento operacional ativo',
                `${flow > 0 ? '+' : ''}${flow.toFixed(1)} m³/h`,
                '0.0 m³/h'
              );
            }
          }
        });
      }
    });

    // -------------------------------------------------------------------------
    // RESOLUÇÃO DE ALERTAS INATIVOS
    // -------------------------------------------------------------------------
    const finalOccurrences: ProcessAlertOccur[] = [...testOccs, ...inactiveEvalOccs];

    occsMap.forEach((occ, key) => {
      if (activeKeysInThisTick.has(key)) {
        finalOccurrences.push(occ);
      } else {
        if (occ.status.startsWith('active')) {
          occ.status = 'resolved';
          occ.resolvedAt = nowIso;
          
          delete this.lastSoundPlayedAt[key];

          useLogStore.getState().addLog({
            user: 'Sistema',
            module: 'Alertas de Processo',
            entity: 'Alerta',
            operation: 'CLOSE',
            action: 'Alerta de Processo Resolvido',
            description: `Condição de alerta "${occ.name}" (${occ.code}) retornou ao normal. Alerta resolvido automaticamente.`,
            severity: 'Informação',
            result: 'Sucesso',
            origin: 'sistema',
            targetId: occ.id,
          });
        }
        finalOccurrences.push(occ);
      }
    });

    processAlertRepo.saveOccurrences(finalOccurrences);

    const store = useProcessAlertStore.getState();
    if (store.isInitialized) {
      store.refresh();
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
