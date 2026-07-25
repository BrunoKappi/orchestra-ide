import type { PropertyEntity } from '../types/domain';
import { STORAGE_KEYS } from './storageKey';

export class PropertyRepository {
  public getAll(): PropertyEntity[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROPERTIES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public getByTargetId(targetId: string): PropertyEntity[] {
    const all = this.getAll();
    return all.filter((p) => p.targetId === targetId);
  }

  public getById(id: string): PropertyEntity | null {
    const all = this.getAll();
    return all.find((p) => p.id === id) || null;
  }

  public save(property: PropertyEntity): PropertyEntity {
    const all = this.getAll();
    const index = all.findIndex((p) => p.id === property.id);
    if (index >= 0) {
      all[index] = { ...property, updatedAt: new Date().toISOString() };
    } else {
      all.push(property);
    }
    localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(all));
    return property;
  }

  public delete(id: string): boolean {
    let all = this.getAll();
    const initialLen = all.length;
    all = all.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(all));
    return all.length < initialLen;
  }

  public deleteByTargetId(targetId: string): void {
    let all = this.getAll();
    all = all.filter((p) => p.targetId !== targetId);
    localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(all));
  }

  public saveAll(properties: PropertyEntity[]): void {
    localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(properties));
  }
}

export const propertyRepo = new PropertyRepository();
