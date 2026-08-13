import type { AlarmEvent } from '../types/domain';
import { STORAGE_KEYS } from './storageKey';
import { safeGetItem, safeSetItem } from '../utils/safeStorage';

const MAX_ALARM_EVENTS = 200;

export class AlarmRepository {
  private cache: AlarmEvent[] | null = null;

  public invalidateCache(): void {
    this.cache = null;
  }

  public getAll(): AlarmEvent[] {
    if (!this.cache) {
      try {
        const data = safeGetItem(STORAGE_KEYS.ALARM_EVENTS);
        this.cache = data ? JSON.parse(data) : [];
      } catch {
        this.cache = [];
      }
    }
    return [...this.cache!];
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
    this.cache = all;
    safeSetItem(STORAGE_KEYS.ALARM_EVENTS, JSON.stringify(all));
    return event;
  }

  public saveAll(events: AlarmEvent[]): void {
    const capped = events.length > MAX_ALARM_EVENTS ? events.slice(-MAX_ALARM_EVENTS) : events;
    this.cache = [...capped];
    safeSetItem(STORAGE_KEYS.ALARM_EVENTS, JSON.stringify(capped));
  }

  public delete(id: string): boolean {
    let all = this.getAll();
    const initialLen = all.length;
    all = all.filter((evt) => evt.id !== id);
    this.cache = all;
    safeSetItem(STORAGE_KEYS.ALARM_EVENTS, JSON.stringify(all));
    return all.length < initialLen;
  }

  public clear(): void {
    this.cache = [];
    safeSetItem(STORAGE_KEYS.ALARM_EVENTS, JSON.stringify([]));
  }
}

export const alarmRepo = new AlarmRepository();
