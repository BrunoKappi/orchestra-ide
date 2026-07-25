import type { ScriptEntity } from '../types/domain';
import { STORAGE_KEYS } from './storageKey';

export class ScriptRepository {
  public getAll(): ScriptEntity[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SCRIPTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public getByTargetId(targetId: string): ScriptEntity[] {
    const all = this.getAll();
    return all.filter((s) => s.targetId === targetId);
  }

  public getById(id: string): ScriptEntity | null {
    const all = this.getAll();
    return all.find((s) => s.id === id) || null;
  }

  public save(script: ScriptEntity): ScriptEntity {
    const all = this.getAll();
    const index = all.findIndex((s) => s.id === script.id);
    if (index >= 0) {
      all[index] = { ...script, updatedAt: new Date().toISOString() };
    } else {
      all.push(script);
    }
    localStorage.setItem(STORAGE_KEYS.SCRIPTS, JSON.stringify(all));
    return script;
  }

  public delete(id: string): boolean {
    let all = this.getAll();
    const initialLen = all.length;
    all = all.filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SCRIPTS, JSON.stringify(all));
    return all.length < initialLen;
  }

  public deleteByTargetId(targetId: string): void {
    let all = this.getAll();
    all = all.filter((s) => s.targetId !== targetId);
    localStorage.setItem(STORAGE_KEYS.SCRIPTS, JSON.stringify(all));
  }

  public saveAll(scripts: ScriptEntity[]): void {
    localStorage.setItem(STORAGE_KEYS.SCRIPTS, JSON.stringify(scripts));
  }
}

export const scriptRepo = new ScriptRepository();
