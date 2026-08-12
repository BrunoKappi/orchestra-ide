import type { PropertyEntity } from '../types/domain';
import { STORAGE_KEYS } from './storageKey';
import { safeGetItem, safeSetItem } from '../utils/safeStorage';

export class PropertyRepository {
  private cache: PropertyEntity[] | null = null;

  public invalidateCache(): void {
    this.cache = null;
  }

  public getAll(): PropertyEntity[] {
    if (!this.cache) {
      try {
        const data = safeGetItem(STORAGE_KEYS.PROPERTIES);
        this.cache = data ? JSON.parse(data) : [];
      } catch {
        this.cache = [];
      }
    }
    return this.cache!;
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
    const updated = { ...property, updatedAt: new Date().toISOString() };
    if (index >= 0) {
      all[index] = updated;
    } else {
      all.push(updated);
    }
    safeSetItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(all));
    return updated;
  }

  public delete(id: string): boolean {
    let all = this.getAll();
    const initialLen = all.length;
    all = all.filter((p) => p.id !== id);
    this.cache = all;
    safeSetItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(all));
    return all.length < initialLen;
  }

  public deleteByTargetId(targetId: string): void {
    let all = this.getAll();
    all = all.filter((p) => p.targetId !== targetId);
    this.cache = all;
    safeSetItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(all));
  }

  public saveAll(properties: PropertyEntity[]): void {
    this.cache = properties;
    safeSetItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(properties));
  }
}

export const propertyRepo = new PropertyRepository();
