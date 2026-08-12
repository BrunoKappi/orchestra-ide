import type { ObjectEntity } from '../types/domain';
import { STORAGE_KEYS } from './storageKey';
import { safeGetItem, safeSetItem } from '../utils/safeStorage';

export class ObjectRepository {
  private cache: ObjectEntity[] | null = null;

  public invalidateCache(): void {
    this.cache = null;
  }

  public getAll(): ObjectEntity[] {
    if (!this.cache) {
      try {
        const data = safeGetItem(STORAGE_KEYS.OBJECTS);
        this.cache = data ? JSON.parse(data) : [];
      } catch {
        this.cache = [];
      }
    }
    return this.cache!;
  }

  public getById(id: string): ObjectEntity | null {
    const all = this.getAll();
    return all.find((o) => o.id === id) || null;
  }

  public getByTemplateId(templateId: string): ObjectEntity[] {
    const all = this.getAll();
    return all.filter((o) => o.templateId === templateId);
  }

  public save(obj: ObjectEntity): ObjectEntity {
    const all = this.getAll();
    const index = all.findIndex((o) => o.id === obj.id);
    const updated = { ...obj, updatedAt: new Date().toISOString() };
    if (index >= 0) {
      all[index] = updated;
    } else {
      all.push(updated);
    }
    safeSetItem(STORAGE_KEYS.OBJECTS, JSON.stringify(all));
    return updated;
  }

  public delete(id: string): boolean {
    let all = this.getAll();
    const initialLen = all.length;
    all = all.filter((o) => o.id !== id);
    this.cache = all;
    safeSetItem(STORAGE_KEYS.OBJECTS, JSON.stringify(all));
    return all.length < initialLen;
  }

  public saveAll(objects: ObjectEntity[]): void {
    this.cache = objects;
    safeSetItem(STORAGE_KEYS.OBJECTS, JSON.stringify(objects));
  }
}

export const objectRepo = new ObjectRepository();
