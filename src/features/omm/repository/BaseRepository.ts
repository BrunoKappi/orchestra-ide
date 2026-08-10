// Generic localStorage-backed repository following the existing project pattern

export class BaseRepository<T extends { id: string }> {
  private readonly storageKey: string;
  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  public getAll(): T[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
      return [];
    }
  }

  public getById(id: string): T | null {
    return this.getAll().find((item) => item.id === id) ?? null;
  }

  public save(entity: T): T {
    const all = this.getAll();
    const idx = all.findIndex((item) => item.id === entity.id);
    if (idx >= 0) {
      all[idx] = { ...entity };
    } else {
      all.push(entity);
    }
    this.persist(all);
    return entity;
  }

  public saveAll(entities: T[]): void {
    this.persist(entities);
  }

  public delete(id: string): boolean {
    const all = this.getAll();
    const filtered = all.filter((item) => item.id !== id);
    this.persist(filtered);
    return filtered.length < all.length;
  }

  public clear(): void {
    this.persist([]);
  }

  public count(): number {
    return this.getAll().length;
  }

  private persist(data: T[]): void {
    let attempts = 0;
    let currentData = [...data];
    while (attempts < 3) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(currentData));
        return;
      } catch (e: any) {
        if ((e.name === 'QuotaExceededError' || e.code === 22) && currentData.length > 10) {
          console.warn(`[OmmRepo] Quota excedida para ${this.storageKey}. Removendo os 20% mais antigos.`);
          const dropCount = Math.max(1, Math.floor(currentData.length * 0.2));
          currentData = currentData.slice(dropCount);
          attempts++;
        } else {
          console.error(`[OmmRepo] Failed to persist to ${this.storageKey}`, e);
          break;
        }
      }
    }
  }
}

// Singleton value store (for objects like simulator state)
export class SingletonRepository<T> {
  private readonly storageKey: string;
  private readonly defaultValue: T;
  constructor(
    storageKey: string,
    defaultValue: T,
  ) {
    this.storageKey = storageKey;
    this.defaultValue = defaultValue;
  }

  public get(): T {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as T) : { ...this.defaultValue };
    } catch {
      return { ...this.defaultValue };
    }
  }

  public set(value: T): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(value));
    } catch (e) {
      console.error(`[OmmSingleton] Failed to persist ${this.storageKey}`, e);
    }
  }

  public clear(): void {
    localStorage.removeItem(this.storageKey);
  }
}
