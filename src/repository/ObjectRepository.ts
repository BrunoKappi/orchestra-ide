import type { ObjectEntity } from '../types/domain';
import { STORAGE_KEYS } from './storageKey';
import { safeGetItem, safeSetItem } from '../utils/safeStorage';

export class ObjectRepository {
  public getAll(): ObjectEntity[] {
    try {
      const data = safeGetItem(STORAGE_KEYS.OBJECTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
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
    if (index >= 0) {
      all[index] = { ...obj, updatedAt: new Date().toISOString() };
    } else {
      all.push(obj);
    }
    safeSetItem(STORAGE_KEYS.OBJECTS, JSON.stringify(all));
    return obj;
  }

  public delete(id: string): boolean {
    let all = this.getAll();
    const initialLen = all.length;
    all = all.filter((o) => o.id !== id);
    safeSetItem(STORAGE_KEYS.OBJECTS, JSON.stringify(all));
    return all.length < initialLen;
  }

  public saveAll(objects: ObjectEntity[]): void {
    safeSetItem(STORAGE_KEYS.OBJECTS, JSON.stringify(objects));
  }
}

export const objectRepo = new ObjectRepository();
