import type { AlarmEvent, AlarmRule, ObjectEntity, MergedProperty } from '../types/domain';
import { alarmRepo } from '../repository/AlarmRepository';
import { v4 as uuidv4 } from 'uuid';

export class AlarmEngine {
  // In-memory states for delay tracking
  private static conditionMetSince: Record<string, number> = {};
  private static normalSince: Record<string, number> = {};

  /**
   * Evaluates all properties of all running/deployed objects against their alarm configurations.
   * Modifies the active alarms database in response to state changes.
   *
   * @param simulatedValues The current map of property values (format objectId:propertyName -> string value)
   * @param objects The list of all objects in the system
   * @param getMergedProperties Method to fetch properties for a target
   */
  public static evaluate(
    simulatedValues: Record<string, string>,
    objects: ObjectEntity[],
    getMergedProperties: (objectId: string, type: 'instance') => MergedProperty[]
  ): void {
    const activeEvents = alarmRepo.getAll();
    const updatedEventsMap = new Map<string, AlarmEvent>();
    activeEvents.forEach((evt) => {
      // Map active alarms by objectId:propertyName:ruleId
      updatedEventsMap.set(`${evt.objectId}:${evt.propertyName}:${evt.ruleId}`, evt);
    });

    const now = new Date().toISOString();
    const nowMs = Date.now();

    objects.forEach((obj) => {
      const isDeployed = obj.isDeployed !== false;
      if (!isDeployed) return;

      const mergedProperties = getMergedProperties(obj.id, 'instance');

      mergedProperties.forEach((prop) => {
        // If alarms are not configured or not globally enabled for this property, skip
        if (!prop.alarmConfig || !prop.alarmConfig.enabled || !prop.alarmConfig.rules) {
          return;
        }

        const valueKey = `${obj.id}:${prop.name}`;
        const rawValue = simulatedValues[valueKey] ?? prop.defaultValue;

        prop.alarmConfig.rules.forEach((rule) => {
          if (!rule.enabled) return;

          const alarmKey = `${obj.id}:${prop.name}:${rule.id}`;
          const currentAlarm = updatedEventsMap.get(alarmKey);

          // Determine if condition is met
          const conditionMet = this.isConditionMet(rawValue, prop.dataType, rule, currentAlarm);

          if (conditionMet) {
            // Condition is active. Clear any normal-delay tracking.
            delete this.normalSince[alarmKey];

            // If rule generation is blocked temporarily, we do not activate a new alarm.
            if (rule.blocked) {
              delete this.conditionMetSince[alarmKey];
              return;
            }

            if (!currentAlarm || currentAlarm.status.startsWith('Cleared')) {
              // It's a potential activation
              if (!this.conditionMetSince[alarmKey]) {
                this.conditionMetSince[alarmKey] = nowMs;
              }

              const elapsedSec = (nowMs - this.conditionMetSince[alarmKey]) / 1000;
              if (elapsedSec >= (rule.activationDelay ?? 0)) {
                // Delay satisfied! We transition to Active Unacknowledged
                const newEvent: AlarmEvent = {
                  id: currentAlarm && currentAlarm.status === 'Cleared Unacknowledged' ? currentAlarm.id : uuidv4(),
                  ruleId: rule.id,
                  objectId: obj.id,
                  objectName: obj.name,
                  propertyName: prop.name,
                  currentValue: rawValue,
                  configuredValue: this.getConfiguredValueText(rule),
                  severity: rule.severity,
                  priority: rule.priority,
                  message: rule.message || `${prop.name} is in ${rule.type} state`,
                  color: rule.color,
                  icon: rule.icon,
                  activatedAt: now,
                  acknowledgedAt: null,
                  clearedAt: null,
                  ackedBy: null,
                  durationMs: 0,
                  status: 'Active Unacknowledged',
                };
                updatedEventsMap.set(alarmKey, newEvent);
              }
            } else {
              // Alarm is already active. Update current value & duration
              const actTime = new Date(currentAlarm.activatedAt).getTime();
              currentAlarm.currentValue = rawValue;
              currentAlarm.durationMs = nowMs - actTime;
              updatedEventsMap.set(alarmKey, currentAlarm);
            }
          } else {
            // Condition is NOT met. Clear activation-delay tracking.
            delete this.conditionMetSince[alarmKey];

            if (currentAlarm && currentAlarm.status.startsWith('Active')) {
              // Potential return to normal
              if (!this.normalSince[alarmKey]) {
                this.normalSince[alarmKey] = nowMs;
              }

              const elapsedSec = (nowMs - this.normalSince[alarmKey]) / 1000;
              if (elapsedSec >= (rule.returnDelay ?? 0)) {
                // Return delay satisfied! Transition from Active to Cleared
                const actTime = new Date(currentAlarm.activatedAt).getTime();
                currentAlarm.clearedAt = now;
                currentAlarm.durationMs = nowMs - actTime;

                if (currentAlarm.status === 'Active Unacknowledged') {
                  currentAlarm.status = 'Cleared Unacknowledged';
                } else if (currentAlarm.status === 'Active Acknowledged') {
                  currentAlarm.status = 'Cleared Acknowledged';
                }
                updatedEventsMap.set(alarmKey, currentAlarm);
                delete this.normalSince[alarmKey];
              } else {
                // Still waiting for return delay, but alarm is still active. Update duration
                const actTime = new Date(currentAlarm.activatedAt).getTime();
                currentAlarm.currentValue = rawValue;
                currentAlarm.durationMs = nowMs - actTime;
                updatedEventsMap.set(alarmKey, currentAlarm);
              }
            }
          }
        });
      });
    });

    // Save back to repository
    alarmRepo.saveAll(Array.from(updatedEventsMap.values()));
  }

  /**
   * Helper to check if a condition is met
   */
  private static isConditionMet(
    rawValue: string,
    dataType: string,
    rule: AlarmRule,
    currentAlarm?: AlarmEvent
  ): boolean {
    const isNumeric = dataType === 'Integer' || dataType === 'Float';
    const valueNum = isNumeric ? parseFloat(rawValue) : NaN;
    const compareNum = isNumeric ? parseFloat(rule.compareValue) : NaN;

    const hysteresis = rule.hysteresis ?? 0;
    const isCurrentlyActive = currentAlarm && currentAlarm.status.startsWith('Active');

    switch (rule.type) {
      case 'HH':
      case 'H': {
        if (!isNumeric || isNaN(valueNum) || isNaN(compareNum)) return false;
        if (isCurrentlyActive) {
          // Clears only when value falls below limit - hysteresis
          return valueNum >= (compareNum - hysteresis);
        } else {
          // Triggers when value goes above/equal to limit
          return valueNum >= compareNum;
        }
      }

      case 'L':
      case 'LL': {
        if (!isNumeric || isNaN(valueNum) || isNaN(compareNum)) return false;
        if (isCurrentlyActive) {
          // Clears only when value rises above limit + hysteresis
          return valueNum <= (compareNum + hysteresis);
        } else {
          // Triggers when value falls below/equal to limit
          return valueNum <= compareNum;
        }
      }

      case 'Equal': {
        if (dataType === 'Boolean') {
          const valBool = rawValue === 'true';
          const compBool = rule.compareValue === 'true' || rule.compareValue === '1';
          return valBool === compBool;
        }
        return rawValue.toLowerCase() === rule.compareValue.toLowerCase();
      }

      case 'NotEqual': {
        if (dataType === 'Boolean') {
          const valBool = rawValue === 'true';
          const compBool = rule.compareValue === 'true' || rule.compareValue === '1';
          return valBool !== compBool;
        }
        return rawValue.toLowerCase() !== rule.compareValue.toLowerCase();
      }

      case 'BitTrue': {
        return rawValue === 'true' || rawValue === '1' || rawValue === 'ON';
      }

      case 'BitFalse': {
        return rawValue === 'false' || rawValue === '0' || rawValue === 'OFF' || rawValue === '';
      }

      case 'TextMatch': {
        return rawValue.toLowerCase() === rule.compareValue.toLowerCase();
      }

      default:
        return false;
    }
  }

  private static getConfiguredValueText(rule: AlarmRule): string {
    if (rule.type === 'BitTrue') return 'TRUE';
    if (rule.type === 'BitFalse') return 'FALSE';
    return rule.compareValue;
  }
}
