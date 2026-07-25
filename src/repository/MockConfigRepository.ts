import type { MockConfig } from '../types/mock';
import { STORAGE_KEYS } from './storageKey';

export class MockConfigRepository {
  public getAll(): MockConfig[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MOCK_CONFIGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public getByTargetId(targetId: string): MockConfig[] {
    const all = this.getAll();
    return all.filter((m) => m.targetId === targetId);
  }

  public getByTargetAndProperty(targetId: string, propertyName: string): MockConfig | null {
    const all = this.getAll();
    return all.find((m) => m.targetId === targetId && m.propertyName === propertyName) || null;
  }

  public save(config: MockConfig): MockConfig {
    const all = this.getAll();
    const index = all.findIndex(
      (m) => m.targetId === config.targetId && m.propertyName === config.propertyName
    );
    if (index >= 0) {
      all[index] = { ...config, updatedAt: new Date().toISOString() };
    } else {
      all.push(config);
    }
    localStorage.setItem(STORAGE_KEYS.MOCK_CONFIGS, JSON.stringify(all));
    return config;
  }

  public delete(targetId: string, propertyName: string): boolean {
    let all = this.getAll();
    const initialLen = all.length;
    all = all.filter((m) => !(m.targetId === targetId && m.propertyName === propertyName));
    localStorage.setItem(STORAGE_KEYS.MOCK_CONFIGS, JSON.stringify(all));
    return all.length < initialLen;
  }

  public deleteByTargetId(targetId: string): void {
    let all = this.getAll();
    all = all.filter((m) => m.targetId !== targetId);
    localStorage.setItem(STORAGE_KEYS.MOCK_CONFIGS, JSON.stringify(all));
  }

  public saveAll(configs: MockConfig[]): void {
    localStorage.setItem(STORAGE_KEYS.MOCK_CONFIGS, JSON.stringify(configs));
  }
}

export const mockConfigRepo = new MockConfigRepository();
