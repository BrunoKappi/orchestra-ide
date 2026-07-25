import type { EntityType, PropertyEntity } from '../types/domain';
import type { MockConfig, MockPresetType } from '../types/mock';
import { v4 as uuidv4 } from 'uuid';

export class MockSimulationService {
  /**
   * Generates the next simulated string value for a property given a MockConfig and tick context.
   */
  public generateSimulatedValue(
    config: MockConfig,
    tickCount: number,
    currentValue?: string
  ): string {
    if (!config.enabled) {
      return currentValue ?? '0';
    }

    const params = config.params || {};

    switch (config.preset) {
      case 'sine': {
        const min = params.min ?? 0;
        const max = params.max ?? 100;
        const period = Math.max(1, params.periodSeconds ?? 10);
        const decimals = params.decimals ?? 2;
        const sineFactor = (Math.sin((2 * Math.PI * tickCount) / period) + 1) / 2;
        const val = min + (max - min) * sineFactor;
        return val.toFixed(decimals);
      }

      case 'range': {
        const min = params.min ?? 0;
        const max = params.max ?? 100;
        const decimals = params.decimals ?? 2;
        const rand = min + Math.random() * (max - min);
        return rand.toFixed(decimals);
      }

      case 'step': {
        const min = params.min ?? 0;
        const max = params.max ?? 100;
        const step = params.step ?? 1;
        const decimals = params.decimals ?? 0;

        const currentNum = currentValue ? parseFloat(currentValue) : min;
        let nextVal = currentNum + step;
        if (nextVal > max) {
          nextVal = min;
        }
        return nextVal.toFixed(decimals);
      }

      case 'walk': {
        const min = params.min ?? 0;
        const max = params.max ?? 100;
        const step = params.step ?? 2;
        const decimals = params.decimals ?? 2;
        const curr = currentValue ? parseFloat(currentValue) : (min + max) / 2;
        const delta = (Math.random() - 0.5) * 2 * step;
        let nextVal = Math.min(max, Math.max(min, curr + delta));
        return nextVal.toFixed(decimals);
      }

      case 'boolean_toggle': {
        const interval = params.toggleIntervalSec ?? 2;
        const prob = params.booleanProbability ?? 0.5;

        if (params.mode === 'random') {
          return Math.random() < prob ? 'true' : 'false';
        } else {
          // Periodic toggle
          const isTrue = Math.floor(tickCount / interval) % 2 === 0;
          return isTrue ? 'true' : 'false';
        }
      }

      case 'enum_list': {
        const options = params.options && params.options.length > 0
          ? params.options
          : ['RUNNING', 'STOPPED', 'WARNING', 'ALARM'];

        if (params.mode === 'sequential') {
          const idx = tickCount % options.length;
          return options[idx];
        } else {
          const idx = Math.floor(Math.random() * options.length);
          return options[idx];
        }
      }

      case 'date_now': {
        return new Date().toISOString();
      }

      case 'custom': {
        return params.customValue || currentValue || 'OK';
      }

      default:
        return currentValue ?? '0';
    }
  }

  /**
   * Generates a smart default MockConfig for a given PropertyEntity based on its DataType.
   */
  public getDefaultMockConfig(
    targetId: string,
    targetType: EntityType,
    property: PropertyEntity
  ): MockConfig {
    const now = new Date().toISOString();
    let preset: MockPresetType = 'range';
    let params = {};

    switch (property.dataType) {
      case 'Float':
        preset = 'sine';
        params = { min: 0, max: 100, periodSeconds: 10, decimals: 2 };
        break;

      case 'Integer':
        preset = 'step';
        params = { min: 0, max: 100, step: 1, decimals: 0 };
        break;

      case 'Boolean':
        preset = 'boolean_toggle';
        params = { toggleIntervalSec: 2, mode: 'periodic' };
        break;

      case 'String':
      case 'Enum':
        preset = 'enum_list';
        params = { options: ['NORMAL', 'RUNNING', 'WARNING', 'ALARM'], mode: 'random' };
        break;

      case 'Date':
        preset = 'date_now';
        params = {};
        break;

      default:
        preset = 'custom';
        params = { customValue: property.defaultValue || 'OK' };
        break;
    }

    return {
      id: uuidv4(),
      targetId,
      targetType,
      propertyName: property.name,
      enabled: true,
      preset,
      params,
      createdAt: now,
      updatedAt: now,
    };
  }
}

export const mockSimulationService = new MockSimulationService();
