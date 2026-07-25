import type { WidgetEntity } from '../types/domain';
import { STORAGE_KEYS } from './storageKey';

export class WidgetRepository {
  public getAll(): WidgetEntity[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WIDGETS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public getById(id: string): WidgetEntity | null {
    const all = this.getAll();
    return all.find((w) => w.id === id) || null;
  }

  public save(widget: WidgetEntity): WidgetEntity {
    const all = this.getAll();
    const index = all.findIndex((w) => w.id === widget.id);
    const updated = { ...widget, updatedAt: new Date().toISOString() };
    if (index >= 0) {
      all[index] = updated;
    } else {
      all.push(updated);
    }
    localStorage.setItem(STORAGE_KEYS.WIDGETS, JSON.stringify(all));
    return updated;
  }

  public delete(id: string): boolean {
    let all = this.getAll();
    const initialLen = all.length;
    all = all.filter((w) => w.id !== id);
    localStorage.setItem(STORAGE_KEYS.WIDGETS, JSON.stringify(all));
    return all.length < initialLen;
  }

  public saveAll(widgets: WidgetEntity[]): void {
    localStorage.setItem(STORAGE_KEYS.WIDGETS, JSON.stringify(widgets));
  }
}

export const widgetRepo = new WidgetRepository();
