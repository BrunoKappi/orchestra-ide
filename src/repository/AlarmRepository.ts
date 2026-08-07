import type { AlarmEvent } from '../types/domain';
import { STORAGE_KEYS } from './storageKey';
import { safeGetItem, safeSetItem } from '../utils/safeStorage';

const MAX_ALARM_EVENTS = 200;

export class AlarmRepository {
  public getAll(): AlarmEvent[] {
    try {
      const data = safeGetItem(STORAGE_KEYS.ALARM_EVENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public getById(id: string): AlarmEvent | null {
    const all = this.getAll();
    return all.find((evt) => evt.id === id) || null;
  }

  public save(event: AlarmEvent): AlarmEvent {
    const all = this.getAll();
    const index = all.findIndex((evt) => evt.id === event.id);
    if (index >= 0) {
      all[index] = { ...event };
    } else {
      all.push(event);
    }
    // Cap total stored alarms to avoid infinite array growth
    if (all.length > MAX_ALARM_EVENTS) {
      all.splice(0, all.length - MAX_ALARM_EVENTS);
    }
    safeSetItem(STORAGE_KEYS.ALARM_EVENTS, JSON.stringify(all));
    return event;
  }

  public saveAll(events: AlarmEvent[]): void {
    const capped = events.length > MAX_ALARM_EVENTS ? events.slice(-MAX_ALARM_EVENTS) : events;
    safeSetItem(STORAGE_KEYS.ALARM_EVENTS, JSON.stringify(capped));
  }

  public delete(id: string): boolean {
    let all = this.getAll();
    const initialLen = all.length;
    all = all.filter((evt) => evt.id !== id);
    safeSetItem(STORAGE_KEYS.ALARM_EVENTS, JSON.stringify(all));
    return all.length < initialLen;
  }

  public clear(): void {
    safeSetItem(STORAGE_KEYS.ALARM_EVENTS, JSON.stringify([]));
  }
}

export const alarmRepo = new AlarmRepository();
