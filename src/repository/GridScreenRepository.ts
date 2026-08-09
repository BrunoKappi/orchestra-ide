import { STORAGE_KEYS } from './storageKey';
import type { GridScreenEntity } from '../features/grid-dashboard/types';

const LEGACY_STORAGE_KEY = 'grid_dashboard_layout';

export const gridScreenRepo = {
  getAll(): GridScreenEntity[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.GRID_SCREENS);
      if (raw) {
        const screens: GridScreenEntity[] = JSON.parse(raw);
        if (Array.isArray(screens) && screens.length > 0) {
          return screens;
        }
      }
    } catch (e) {
      console.error('Error loading grid screens from storage:', e);
    }

    // Fallback: check legacy single layout storage key for backward compatibility
    try {
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw);
        if (legacy?.config && Array.isArray(legacy?.cards)) {
          const now = new Date().toISOString();
          const migrated: GridScreenEntity = {
            id: 'default-grid-screen',
            name: legacy.config.screenName || 'Dashboard de Tanques Industriais',
            rows: legacy.config.rows || 8,
            cols: legacy.config.cols || 8,
            cards: legacy.cards,
            createdAt: now,
            updatedAt: now,
          };
          this.saveAll([migrated]);
          return [migrated];
        }
      }
    } catch (e) {
      console.error('Error loading legacy grid layout:', e);
    }

    return [];
  },

  getById(id: string): GridScreenEntity | undefined {
    const screens = this.getAll();
    return screens.find((s) => s.id === id);
  },

  save(screen: GridScreenEntity): void {
    const screens = this.getAll();
    const idx = screens.findIndex((s) => s.id === screen.id);
    const updated = { ...screen, updatedAt: new Date().toISOString() };
    if (idx !== -1) {
      screens[idx] = updated;
    } else {
      screens.push(updated);
    }
    this.saveAll(screens);
  },

  saveAll(screens: GridScreenEntity[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.GRID_SCREENS, JSON.stringify(screens));
    } catch (e) {
      console.error('Error saving grid screens to storage:', e);
    }
  },

  delete(id: string): void {
    const screens = this.getAll().filter((s) => s.id !== id);
    this.saveAll(screens);
  },
};
