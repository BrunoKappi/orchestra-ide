import type { AlarmEvent } from '../types/domain';
import { STORAGE_KEYS } from './storageKey';

export class AlarmRepository {
  public getAll(): AlarmEvent[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ALARM_EVENTS);
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
    localStorage.setItem(STORAGE_KEYS.ALARM_EVENTS, JSON.stringify(all));
    return event;
  }

  public saveAll(events: AlarmEvent[]): void {
    localStorage.setItem(STORAGE_KEYS.ALARM_EVENTS, JSON.stringify(events));
  }

  public delete(id: string): boolean {
    let all = this.getAll();
    const initialLen = all.length;
    all = all.filter((evt) => evt.id !== id);
    localStorage.setItem(STORAGE_KEYS.ALARM_EVENTS, JSON.stringify(all));
    return all.length < initialLen;
  }

  public clear(): void {
    localStorage.setItem(STORAGE_KEYS.ALARM_EVENTS, JSON.stringify([]));
  }
}

export const alarmRepo = new AlarmRepository();
