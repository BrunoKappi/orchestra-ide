import type { EventConfig, EventHistoryLog } from '../types/event';
import { STORAGE_KEYS } from './storageKey';
import { v4 as uuidv4 } from 'uuid';

export class EventRepository {
  public getAllConfigs(): EventConfig[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EVENT_CONFIGS);
      if (!data) {
        // Seed default events
        const defaults = this.getSeeds();
        this.saveAllConfigs(defaults);
        return defaults;
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  public getById(id: string): EventConfig | null {
    const all = this.getAllConfigs();
    return all.find((evt) => evt.id === id) || null;
  }

  public saveConfig(config: EventConfig): EventConfig {
    const all = this.getAllConfigs();
    const index = all.findIndex((evt) => evt.id === config.id);
    if (index >= 0) {
      all[index] = { ...config, updatedAt: new Date().toISOString() };
    } else {
      all.push({
        ...config,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    this.saveAllConfigs(all);
    return config;
  }

  public saveAllConfigs(configs: EventConfig[]): void {
    localStorage.setItem(STORAGE_KEYS.EVENT_CONFIGS, JSON.stringify(configs));
  }

  public deleteConfig(id: string): boolean {
    let all = this.getAllConfigs();
    const initialLen = all.length;
    all = all.filter((evt) => evt.id !== id);
    this.saveAllConfigs(all);
    return all.length < initialLen;
  }

  public getHistory(): EventHistoryLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EVENT_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public addHistoryLog(log: Omit<EventHistoryLog, 'id' | 'timestamp'>): EventHistoryLog {
    const all = this.getHistory();
    const newLog: EventHistoryLog = {
      ...log,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
    };
    all.unshift(newLog); // Newer logs first
    if (all.length > 500) {
      all.pop(); // Keep history capped at 500 entries
    }
    localStorage.setItem(STORAGE_KEYS.EVENT_HISTORY, JSON.stringify(all));
    return newLog;
  }

  public clearHistory(): void {
    localStorage.setItem(STORAGE_KEYS.EVENT_HISTORY, JSON.stringify([]));
  }

  public clearAll(): void {
    localStorage.setItem(STORAGE_KEYS.EVENT_CONFIGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EVENT_HISTORY, JSON.stringify([]));
  }

  private getSeeds(): EventConfig[] {
    return [
      {
        id: 'seed-event-critical-level-temp',
        name: 'Sobrecarga de Nível e Temperatura',
        description: 'Disparado quando o nível do tanque ultrapassa 85% e a temperatura excede 75°C simultaneamente.',
        category: 'Segurança',
        severity: 'critical',
        priority: 1,
        enabled: true,
        group: 'Operações',
        responsibleArea: 'Manutenção',
        observations: 'Risco de transbordo com líquido aquecido.',
        condition: {
          id: uuidv4(),
          type: 'logical',
          operator: 'AND',
          conditions: [
            {
              id: uuidv4(),
              type: 'leaf',
              conditionType: 'property_compare',
              params: {
                objectId: 'inst-tanque-01', // Standard tank in seed data
                propertyName: 'Level',
                operator: 'greater',
                compareValue: '85',
              },
            },
            {
              id: uuidv4(),
              type: 'leaf',
              conditionType: 'property_compare',
              params: {
                objectId: 'inst-tanque-01',
                propertyName: 'Temperature',
                operator: 'greater',
                compareValue: '75',
              },
            },
          ],
        },
        actions: [
          {
            id: uuidv4(),
            type: 'generate_notification',
            params: {
              message: 'Alerta Crítico: Sobrecarga detectada no Tanque 01! Nível e temperatura altos!',
            },
          },
          {
            id: uuidv4(),
            type: 'audit_log',
            params: {
              message: 'Evento de sobrecarga registrado automaticamente pelo Event Engine.',
            },
          },
          {
            id: uuidv4(),
            type: 'change_property',
            params: {
              objectId: 'inst-tanque-01',
              propertyName: 'OutletValve',
              value: 'true', // Open outlet valve to discharge as safety protocol
            },
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'seed-event-valve-fault',
        name: 'Falha de Válvula Travada',
        description: 'Válvula de entrada aberta mas vazão de entrada igual a zero por mais de 5 segundos.',
        category: 'Processo',
        severity: 'high',
        priority: 2,
        enabled: true,
        group: 'Manutenção',
        responsibleArea: 'Automação',
        observations: 'Pode indicar obstrução física na tubulação.',
        condition: {
          id: uuidv4(),
          type: 'logical',
          operator: 'AND',
          conditions: [
            {
              id: uuidv4(),
              type: 'leaf',
              conditionType: 'property_compare',
              params: {
                objectId: 'inst-tanque-01',
                propertyName: 'InletValve',
                operator: 'equal',
                compareValue: 'true',
              },
            },
            {
              id: uuidv4(),
              type: 'leaf',
              conditionType: 'property_compare',
              params: {
                objectId: 'inst-tanque-01',
                propertyName: 'InletFlow',
                operator: 'equal',
                compareValue: '0',
              },
            },
          ],
        },
        actions: [
          {
            id: uuidv4(),
            type: 'open_popup',
            params: {
              message: 'Aviso de Processo: Válvula de Entrada aberta no Tanque 01 mas vazão zerada! Verifique obstruções.',
            },
          },
          {
            id: uuidv4(),
            type: 'create_alarm',
            params: {
              message: 'Alarme de Processo: Falha na vazão de entrada do Tanque 01',
              severity: 'high',
              priority: 10,
            },
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }
}

export const eventRepo = new EventRepository();
