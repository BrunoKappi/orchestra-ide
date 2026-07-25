import type { PropertyHistoryConfig, HistorySample, SampleQuality } from '../types/domain';

const STORAGE_PREFIX = 'historian_v1_';
const MAX_SAMPLES_HARD_CAP = 50_000;

// Tracks the last recorded timestamp per key to enforce interval-based collection
const lastRecordedAt = new Map<string, number>();
// Tracks the last recorded value per key to enforce deadband
const lastRecordedValue = new Map<string, string>();

type Store = Map<string, HistorySample[]>;
let store: Store = new Map();
let initialized = false;

function key(objectId: string, propertyId: string): string {
  return `${objectId}:${propertyId}`;
}

function loadFromStorage(): void {
  try {
    const index = localStorage.getItem(`${STORAGE_PREFIX}index`);
    if (!index) return;
    const keys: string[] = JSON.parse(index);
    keys.forEach((k) => {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${k}`);
      if (raw) {
        store.set(k, JSON.parse(raw));
      }
    });
  } catch {
    // Storage corrupt — start clean
    store = new Map();
  }
}

function persistKey(k: string): void {
  try {
    const samples = store.get(k) ?? [];
    localStorage.setItem(`${STORAGE_PREFIX}${k}`, JSON.stringify(samples));

    // Maintain index
    const index = localStorage.getItem(`${STORAGE_PREFIX}index`);
    const keys: string[] = index ? JSON.parse(index) : [];
    if (!keys.includes(k)) {
      keys.push(k);
      localStorage.setItem(`${STORAGE_PREFIX}index`, JSON.stringify(keys));
    }
  } catch {
    // Quota exceeded — skip silently
  }
}

function purgeExpiredSamples(k: string, retentionMs: number, maxSamples: number): void {
  const samples = store.get(k);
  if (!samples || samples.length === 0) return;

  const cutoff = Date.now() - retentionMs;
  let filtered = samples.filter((s) => new Date(s.timestamp).getTime() >= cutoff);

  const cap = Math.min(maxSamples, MAX_SAMPLES_HARD_CAP);
  if (filtered.length > cap) {
    filtered = filtered.slice(filtered.length - cap);
  }

  store.set(k, filtered);
}

export const historyEngine = {
  /** Must be called once at application start */
  init(): void {
    if (initialized) return;
    loadFromStorage();
    initialized = true;
  },

  /**
   * Record a new sample, respecting config (deadband, interval, on_change).
   * Returns true if a sample was actually recorded.
   */
  record(
    objectId: string,
    propertyId: string,
    value: string,
    config: PropertyHistoryConfig,
    source: HistorySample['source'] = 'simulation',
    quality: SampleQuality = 'Good'
  ): boolean {
    if (!config.enabled) return false;

    const k = key(objectId, propertyId);
    const now = Date.now();

    // --- Deadband check ---
    const prevValue = lastRecordedValue.get(k);
    if (prevValue !== undefined && config.deadband > 0) {
      const prevNum = parseFloat(prevValue);
      const curNum = parseFloat(value);
      if (!isNaN(prevNum) && !isNaN(curNum)) {
        if (Math.abs(curNum - prevNum) < config.deadband) return false;
      } else {
        // String values: only record if changed
        if (prevValue === value) return false;
      }
    }

    // --- Collection mode check ---
    if (config.collectionMode === 'interval') {
      const last = lastRecordedAt.get(k) ?? 0;
      if (now - last < config.intervalMs) return false;
    }

    // --- Purge old samples before inserting ---
    purgeExpiredSamples(k, config.retentionMs, config.maxSamples);

    const sample: HistorySample = {
      timestamp: new Date(now).toISOString(),
      value,
      quality,
      source,
      objectId,
      propertyId,
    };

    const existing = store.get(k) ?? [];
    existing.push(sample);
    store.set(k, existing);

    lastRecordedAt.set(k, now);
    lastRecordedValue.set(k, value);

    persistKey(k);
    return true;
  },

  /**
   * Query samples with optional filters.
   */
  query(opts: {
    objectId?: string;
    propertyId?: string;
    from?: Date;
    to?: Date;
  } = {}): HistorySample[] {
    let results: HistorySample[] = [];

    store.forEach((samples, k) => {
      const [oid, pid] = k.split(':');
      if (opts.objectId && oid !== opts.objectId) return;
      if (opts.propertyId && pid !== opts.propertyId) return;
      results = results.concat(samples);
    });

    if (opts.from) {
      const f = opts.from.getTime();
      results = results.filter((s) => new Date(s.timestamp).getTime() >= f);
    }
    if (opts.to) {
      const t = opts.to.getTime();
      results = results.filter((s) => new Date(s.timestamp).getTime() <= t);
    }

    results.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    return results;
  },

  /** Get all keys that have recorded samples */
  getKeys(): string[] {
    return Array.from(store.keys());
  },

  /** Stats for a set of samples */
  getStats(samples: HistorySample[]): {
    min: number | null;
    max: number | null;
    avg: number | null;
    last: string | null;
    count: number;
  } {
    if (samples.length === 0) {
      return { min: null, max: null, avg: null, last: null, count: 0 };
    }
    const numericValues = samples
      .map((s) => parseFloat(s.value))
      .filter((v) => !isNaN(v));

    const last = samples[samples.length - 1].value;

    if (numericValues.length === 0) {
      return { min: null, max: null, avg: null, last, count: samples.length };
    }

    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);
    const avg = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
    return { min, max, avg, last, count: samples.length };
  },

  exportJson(samples: HistorySample[]): string {
    return JSON.stringify(samples, null, 2);
  },

  exportCsv(samples: HistorySample[]): string {
    const header = 'timestamp,value,quality,source,objectId,propertyId';
    const rows = samples.map((s) =>
      [s.timestamp, s.value, s.quality, s.source, s.objectId, s.propertyId]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    return [header, ...rows].join('\n');
  },

  /** Clear all history for a specific key */
  clearKey(objectId: string, propertyId: string): void {
    const k = key(objectId, propertyId);
    store.delete(k);
    lastRecordedAt.delete(k);
    lastRecordedValue.delete(k);
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${k}`);
      const index = localStorage.getItem(`${STORAGE_PREFIX}index`);
      if (index) {
        const keys: string[] = JSON.parse(index).filter((ki: string) => ki !== k);
        localStorage.setItem(`${STORAGE_PREFIX}index`, JSON.stringify(keys));
      }
    } catch {
      // ignore
    }
  },

  /** Clear ALL history */
  clearAll(): void {
    const keys = Array.from(store.keys());
    store = new Map();
    lastRecordedAt.clear();
    lastRecordedValue.clear();
    try {
      keys.forEach((k) => localStorage.removeItem(`${STORAGE_PREFIX}${k}`));
      localStorage.removeItem(`${STORAGE_PREFIX}index`);
    } catch {
      // ignore
    }
  },
};
