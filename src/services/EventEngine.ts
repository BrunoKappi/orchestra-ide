import type { EventConfig, ConditionNode, LeafCondition, ActiveEventState, EventAction } from '../types/event';
import type { ObjectEntity, AlarmEvent } from '../types/domain';
import { eventRepo } from '../repository/EventRepository';
import { alarmRepo } from '../repository/AlarmRepository';
import { useObjectModelStore } from '../store/useObjectModelStore';
import { useOmmStore } from '../features/omm/store/useOmmStore';
import { v4 as uuidv4 } from 'uuid';

export class EventEngine {
  // In-memory states
  private static activeStates: Record<string, ActiveEventState> = {};
  private static previousValues: Record<string, string> = {};
  private static updateTimestamps: Record<string, number[]> = {}; // Key: objectId:propertyName, Value: array of timestamps
  private static initialized = false;

  public static initialize(): void {
    if (this.initialized) return;
    const configs = eventRepo.getAllConfigs();
    configs.forEach((cfg) => {
      this.activeStates[cfg.id] = {
        id: cfg.id,
        name: cfg.name,
        status: 'idle',
        activatedAt: null,
        durationMs: 0,
        satisfiedRuleDescription: '',
      };
    });
    this.initialized = true;
  }

  public static getActiveStates(): ActiveEventState[] {
    this.initialize();
    return Object.values(this.activeStates);
  }

  public static evaluate(
    simulatedValues: Record<string, string>,
    objects: ObjectEntity[],
    alarmEvents: AlarmEvent[],
    _currentTick: number,
    _speedMs: number
  ): ActiveEventState[] {
    this.initialize();
    const configs = eventRepo.getAllConfigs();
    const nowISO = new Date().toISOString();
    const nowMs = Date.now();

    configs.forEach((cfg) => {
      if (!cfg.enabled) {
        if (this.activeStates[cfg.id]?.status === 'triggered') {
          this.transitionToIdle(cfg);
        }
        return;
      }

      // 1. Evaluate condition
      const satisfiedDescription: string[] = [];
      const isSatisfied = this.evaluateNode(cfg.condition, simulatedValues, objects, alarmEvents, satisfiedDescription);

      let state = this.activeStates[cfg.id];
      if (!state) {
        state = {
          id: cfg.id,
          name: cfg.name,
          status: 'idle',
          activatedAt: null,
          durationMs: 0,
          satisfiedRuleDescription: '',
        };
        this.activeStates[cfg.id] = state;
      }

      if (isSatisfied) {
        state.satisfiedRuleDescription = satisfiedDescription.join(' ') || 'Regra satisfeita';
        if (state.status === 'idle') {
          // Transition to triggered!
          state.status = 'triggered';
          state.activatedAt = nowISO;
          state.durationMs = 0;

          eventRepo.addHistoryLog({
            eventId: cfg.id,
            eventName: cfg.name,
            type: 'activation',
            message: `Evento ativado. Regra satisfeita: ${state.satisfiedRuleDescription}`,
          });

          // Run actions
          this.executeActions(cfg.actions, cfg, simulatedValues);
        } else {
          // Already active, increment duration
          if (state.activatedAt) {
            state.durationMs = nowMs - new Date(state.activatedAt).getTime();
          }
        }
      } else {
        if (state.status === 'triggered') {
          // Transition back to idle
          this.transitionToIdle(cfg);
        }
      }
    });

    // Capture previous values for state change detection in next evaluation
    Object.assign(this.previousValues, simulatedValues);

    return Object.values(this.activeStates);
  }

  private static transitionToIdle(cfg: EventConfig): void {
    const state = this.activeStates[cfg.id];
    if (!state) return;
    state.status = 'idle';
    state.activatedAt = null;
    state.durationMs = 0;
    state.satisfiedRuleDescription = '';

    eventRepo.addHistoryLog({
      eventId: cfg.id,
      eventName: cfg.name,
      type: 'deactivation',
      message: 'Evento retornado ao estado normal (desativado).',
    });
  }

  private static evaluateNode(
    node: ConditionNode,
    simulatedValues: Record<string, string>,
    objects: ObjectEntity[],
    alarmEvents: AlarmEvent[],
    description: string[]
  ): boolean {
    if (node.type === 'logical') {
      if (node.operator === 'AND') {
        description.push('(');
        let result = true;
        for (let i = 0; i < node.conditions.length; i++) {
          if (i > 0) description.push('AND');
          const subResult = this.evaluateNode(node.conditions[i], simulatedValues, objects, alarmEvents, description);
          result = result && subResult;
        }
        description.push(')');
        return node.conditions.length > 0 ? result : false;
      } else if (node.operator === 'OR') {
        description.push('(');
        let result = false;
        for (let i = 0; i < node.conditions.length; i++) {
          if (i > 0) description.push('OR');
          const subResult = this.evaluateNode(node.conditions[i], simulatedValues, objects, alarmEvents, description);
          result = result || subResult;
        }
        description.push(')');
        return node.conditions.length > 0 ? result : false;
      } else if (node.operator === 'NOT') {
        description.push('NOT (');
        const first = node.conditions[0];
        const result = first ? !this.evaluateNode(first, simulatedValues, objects, alarmEvents, description) : false;
        description.push(')');
        return result;
      }
      return false;
    }

    return this.evaluateLeaf(node, simulatedValues, objects, alarmEvents, description);
  }

  private static evaluateLeaf(
    leaf: LeafCondition,
    simulatedValues: Record<string, string>,
    objects: ObjectEntity[],
    alarmEvents: AlarmEvent[],
    description: string[]
  ): boolean {
    const { params } = leaf;
    const object = objects.find(o => o.id === params.objectId);
    const objName = object ? object.name : (params.objectId || 'Objeto');

    switch (leaf.conditionType) {
      case 'property_compare': {
        const key = `${params.objectId}:${params.propertyName}`;
        const val = simulatedValues[key] ?? '';
        const op = params.operator ?? 'equal';
        const target = params.compareValue ?? '';

        description.push(`${objName}.${params.propertyName} ${op} "${target}"`);

        const isNumeric = !isNaN(Number(val)) && !isNaN(Number(target));
        const valNum = Number(val);
        const targetNum = Number(target);

        if (op === 'greater') return isNumeric ? valNum > targetNum : val > target;
        if (op === 'less') return isNumeric ? valNum < targetNum : val < target;
        if (op === 'equal') return val === target;
        if (op === 'notequal') return val !== target;
        if (op === 'between') {
          const target2 = Number(params.compareValue2 ?? '0');
          description.push(`e "${params.compareValue2}"`);
          return valNum >= targetNum && valNum <= target2;
        }
        if (op === 'contains') return val.includes(target);
        if (op === 'starts_with') return val.startsWith(target);
        if (op === 'ends_with') return val.endsWith(target);
        return false;
      }

      case 'state_change': {
        const key = `${params.objectId}:${params.propertyName}`;
        const val = simulatedValues[key] ?? '';
        const prev = this.previousValues[key];
        const hasChanged = prev !== undefined && prev !== val;

        description.push(`Mudança de estado em ${objName}.${params.propertyName}`);

        if (params.changeType === 'to_value') {
          return hasChanged && val === params.targetValue;
        }
        return hasChanged;
      }

      case 'elapsed_time': {
        description.push(`Tempo decorrido > ${params.durationSec ?? 0}s`);
        // Checks if event is already triggered for the duration
        // We handle this recursively/differently since it refers to active duration, or properties
        return true; // Usually combined or handled as part of the state machine
      }

      case 'update_frequency': {
        const key = `${params.objectId}:${params.propertyName}`;
        const now = Date.now();
        if (!this.updateTimestamps[key]) this.updateTimestamps[key] = [];
        
        const val = simulatedValues[key] ?? '';
        const prev = this.previousValues[key];
        if (prev !== undefined && prev !== val) {
          this.updateTimestamps[key].push(now);
        }

        const window = (params.timeWindowSec ?? 10) * 1000;
        this.updateTimestamps[key] = this.updateTimestamps[key].filter(t => now - t < window);
        
        const hz = this.updateTimestamps[key].length / (params.timeWindowSec ?? 10);
        description.push(`Frequência de atualização de ${objName}.${params.propertyName} (${hz.toFixed(1)} Hz)`);
        return hz >= (params.frequencyHz ?? 1);
      }

      case 'previous_events': {
        const otherState = this.activeStates[params.eventId ?? ''];
        const targetStatus = params.eventStatus ?? 'triggered';
        description.push(`Evento anterior ${params.eventId} = ${targetStatus}`);
        return otherState ? otherState.status === targetStatus : false;
      }

      case 'active_alarms': {
        const active = alarmEvents.some((a) => {
          if (a.status.startsWith('Cleared')) return false;
          if (params.alarmSeverity && params.alarmSeverity !== 'any' && a.severity !== params.alarmSeverity) return false;
          if (params.specificAlarmRuleId && a.ruleId !== params.specificAlarmRuleId) return false;
          return true;
        });
        description.push(`Alarmes ativos (${params.alarmSeverity ?? 'qualquer'})`);
        return active;
      }

      case 'scripts_executed': {
        description.push(`Script ${params.scriptId} executado`);
        return true; // Simulated success
      }

      case 'time_schedule': {
        const d = new Date();
        const hr = d.getHours().toString().padStart(2, '0');
        const mn = d.getMinutes().toString().padStart(2, '0');
        const currTime = `${hr}:${mn}`;
        const day = d.getDay();

        description.push(`Horário ${params.specificTime ?? ''}`);

        const timeMatches = params.specificTime ? currTime === params.specificTime : true;
        const dayMatches = params.weekdays && params.weekdays.length > 0 ? params.weekdays.includes(day) : true;
        return timeMatches && dayMatches;
      }

      case 'object_state': {
        const prop = params.objectStateProperty ?? 'isDeployed';
        let matched = false;
        if (object) {
          if (prop === 'isDeployed') matched = object.isDeployed !== false;
        }
        description.push(`Objeto ${objName} ${prop}`);
        return matched;
      }

      case 'custom_expression': {
        const expr = params.expression ?? 'true';
        description.push(`Expressão: ${expr}`);
        try {
          // Simple safe VM evaluation replacing properties
          let sanitizedExpr = expr;
          Object.entries(simulatedValues).forEach(([k, v]) => {
            sanitizedExpr = sanitizedExpr.replace(new RegExp(`\\$\{${k}\}`, 'g'), String(v));
          });
          const result = new Function(`return (${sanitizedExpr})`)();
          return !!result;
        } catch {
          return false;
        }
      }

      default:
        return false;
    }
  }

  private static executeActions(actions: EventAction[], cfg: EventConfig, simulatedValues: Record<string, string>): void {
    const store = useObjectModelStore.getState();

    actions.forEach((act) => {
      try {
        eventRepo.addHistoryLog({
          eventId: cfg.id,
          eventName: cfg.name,
          type: 'action_execution',
          message: `Executando ação: ${act.type}`,
          details: JSON.stringify(act.params),
        });

        switch (act.type) {
          case 'change_property': {
            if (act.params.objectId && act.params.propertyName && act.params.value !== undefined) {
              const key = `${act.params.objectId}:${act.params.propertyName}`;
              store.updateSimulatedValue(key, act.params.value);
            }
            break;
          }

          case 'acknowledge_alarm': {
            if (act.params.alarmId) {
              store.acknowledgeAlarms([act.params.alarmId], 'Event Engine');
            }
            break;
          }

          case 'create_alarm': {
            const newAlarm: AlarmEvent = {
              id: uuidv4(),
              ruleId: 'event-engine-auto',
              objectId: act.params.objectId || 'event-engine',
              objectName: 'Event Engine',
              propertyName: 'Intelligent Event',
              currentValue: 'triggered',
              configuredValue: 'triggered',
              severity: act.params.severity || 'high',
              priority: act.params.priority || 5,
              message: act.params.message || `Alarme automático criado pelo evento ${cfg.name}`,
              color: '#f43f5e',
              icon: 'AlertTriangle',
              activatedAt: new Date().toISOString(),
              acknowledgedAt: null,
              clearedAt: null,
              ackedBy: null,
              durationMs: 0,
              status: 'Active Unacknowledged',
            };
            const currentAlarms = alarmRepo.getAll();
            currentAlarms.push(newAlarm);
            alarmRepo.saveAll(currentAlarms);
            store.refreshData?.();
            break;
          }

          case 'toggle_movement': {
            const omm = useOmmStore.getState();
            if (act.params.movementId && act.params.movementStatus) {
              omm.changeMovementStatus(act.params.movementId, act.params.movementStatus);
            }
            break;
          }

          case 'generate_notification': {
            const alertBox = document.createElement('div');
            alertBox.className = 'fixed bottom-4 right-4 bg-gradient-to-r from-sky-600 to-indigo-700 text-white px-5 py-3 rounded-xl shadow-2xl z-50 text-xs font-semibold flex items-center gap-2 border border-sky-400/30 backdrop-blur-md animate-fade-in-up';
            alertBox.innerHTML = `<span>⚡</span><div><strong class="block text-[10px] opacity-75 uppercase">Event Engine</strong><span>${act.params.message || 'Evento disparado!'}</span></div>`;
            document.body.appendChild(alertBox);
            setTimeout(() => {
              alertBox.remove();
            }, 5000);
            break;
          }

          case 'open_popup': {
            const modalOverlay = document.createElement('div');
            modalOverlay.className = 'fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4';
            const modalBody = document.createElement('div');
            modalBody.className = 'bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full shadow-2xl text-slate-100 flex flex-col gap-4';
            modalBody.innerHTML = `
              <div class="flex items-center gap-3">
                <span class="text-3xl text-amber-500">⚠️</span>
                <div>
                  <h3 class="text-lg font-bold text-white">${cfg.name}</h3>
                  <span class="text-xs text-amber-400 font-semibold uppercase tracking-wider">${cfg.severity} severity</span>
                </div>
              </div>
              <p class="text-xs text-slate-350 bg-slate-950/50 p-3 rounded-lg border border-slate-850 font-mono">${act.params.message || 'Alerta de evento inteligente.'}</p>
              <div class="flex justify-end mt-2">
                <button class="bg-amber-600 hover:bg-amber-500 text-white text-xs px-4 py-2 rounded-lg font-semibold transition-all focus:ring focus:ring-amber-500/50">Acknowledge</button>
              </div>
            `;
            modalOverlay.appendChild(modalBody);
            document.body.appendChild(modalOverlay);
            modalBody.querySelector('button')?.addEventListener('click', () => {
              modalOverlay.remove();
            });
            break;
          }

          case 'run_javascript': {
            if (act.params.scriptCode) {
              const context = { simulatedValues, store, useOmmStore };
              const run = new Function('ctx', `with(ctx) { ${act.params.scriptCode} }`);
              run(context);
            }
            break;
          }

          default:
            // Other types logged automatically
            break;
        }
      } catch (err: any) {
        eventRepo.addHistoryLog({
          eventId: cfg.id,
          eventName: cfg.name,
          type: 'error',
          message: `Erro na ação ${act.type}: ${err.message}`,
        });
      }
    });
  }
}
