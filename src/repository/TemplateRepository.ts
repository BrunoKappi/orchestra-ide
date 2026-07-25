import type { TemplateEntity } from '../types/domain';
import { STORAGE_KEYS } from './storageKey';

export class TemplateRepository {
  public getAll(): TemplateEntity[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public getById(id: string): TemplateEntity | null {
    const all = this.getAll();
    return all.find((t) => t.id === id) || null;
  }

  public save(template: TemplateEntity): TemplateEntity {
    const all = this.getAll();
    const index = all.findIndex((t) => t.id === template.id);
    if (index >= 0) {
      all[index] = { ...template, updatedAt: new Date().toISOString() };
    } else {
      all.push(template);
    }
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(all));
    return template;
  }

  public delete(id: string): boolean {
    let all = this.getAll();
    const initialLen = all.length;
    all = all.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(all));
    return all.length < initialLen;
  }

  public saveAll(templates: TemplateEntity[]): void {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  }
}

export const templateRepo = new TemplateRepository();
