import type { ScreenEntity } from '../types/domain';
import { STORAGE_KEYS } from './storageKey';

const KEY = STORAGE_KEYS.SCREENS;

function load(): ScreenEntity[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ScreenEntity[]) : [];
  } catch {
    return [];
  }
}

function save(items: ScreenEntity[]): void {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export const screenRepo = {
  getAll(): ScreenEntity[] {
    return load();
  },

  getById(id: string): ScreenEntity | undefined {
    return load().find((s) => s.id === id);
  },

  create(screen: ScreenEntity): void {
    const all = load();
    all.push(screen);
    save(all);
  },

  update(id: string, updates: Partial<ScreenEntity>): void {
    const all = load().map((s) =>
      s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
    );
    save(all);
  },

  delete(id: string): void {
    save(load().filter((s) => s.id !== id));
  },

  saveAll(screens: ScreenEntity[]): void {
    save(screens);
  },
};
