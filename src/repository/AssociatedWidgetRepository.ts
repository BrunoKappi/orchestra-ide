import type { AssociatedWidgetEntity } from '../types/domain';
import { STORAGE_KEYS } from './storageKey';

export class AssociatedWidgetRepository {
  public getAll(): AssociatedWidgetEntity[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ASSOCIATED_WIDGETS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public getByTargetId(targetId: string): AssociatedWidgetEntity[] {
    const all = this.getAll();
    return all.filter((p) => p.targetId === targetId);
  }

  public getById(id: string): AssociatedWidgetEntity | null {
    const all = this.getAll();
    return all.find((p) => p.id === id) || null;
  }

  public save(entity: AssociatedWidgetEntity): AssociatedWidgetEntity {
    const all = this.getAll();
    const index = all.findIndex((p) => p.id === entity.id);
    if (index >= 0) {
      all[index] = { ...entity, updatedAt: new Date().toISOString() };
    } else {
      all.push(entity);
    }
    localStorage.setItem(STORAGE_KEYS.ASSOCIATED_WIDGETS, JSON.stringify(all));
    return entity;
  }

  public delete(id: string): boolean {
    let all = this.getAll();
    const initialLen = all.length;
    all = all.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.ASSOCIATED_WIDGETS, JSON.stringify(all));
    return all.length < initialLen;
  }

  public deleteByTargetId(targetId: string): void {
    let all = this.getAll();
    all = all.filter((p) => p.targetId !== targetId);
    localStorage.setItem(STORAGE_KEYS.ASSOCIATED_WIDGETS, JSON.stringify(all));
  }

  public saveAll(entities: AssociatedWidgetEntity[]): void {
    localStorage.setItem(STORAGE_KEYS.ASSOCIATED_WIDGETS, JSON.stringify(entities));
  }
}

export const associatedWidgetRepo = new AssociatedWidgetRepository();
