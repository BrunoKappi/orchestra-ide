/**
 * Safe localStorage wrapper that prevents QuotaExceededError crashes.
 * Automatically handles quota cleanup if storage fills up.
 */

export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    if (
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' ||
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        err.code === 22 ||
        err.code === 1014)
    ) {
      console.warn(`[SafeStorage] QuotaExceededError when setting key "${key}". Attempting auto-cleanup...`);
      
      // Cleanup strategy:
      // 1. Remove old historian samples
      try {
        const historianIndex = localStorage.getItem('historian_v1_index');
        if (historianIndex) {
          const keys: string[] = JSON.parse(historianIndex);
          // Prune all historian keys
          keys.forEach((k) => localStorage.removeItem(`historian_v1_${k}`));
          localStorage.removeItem('historian_v1_index');
        }
      } catch {
        // ignore
      }

      // 2. Prune old alarm events to max 50
      try {
        const alarmKey = 'archestra_db_alarm_events_v1';
        const alarmsRaw = localStorage.getItem(alarmKey);
        if (alarmsRaw) {
          const alarms = JSON.parse(alarmsRaw);
          if (Array.isArray(alarms) && alarms.length > 50) {
            localStorage.setItem(alarmKey, JSON.stringify(alarms.slice(-50)));
          }
        }
      } catch {
        // ignore
      }

      // 3. Retry setting the key
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (retryErr) {
        console.error(`[SafeStorage] Retry failed for key "${key}"`, retryErr);
        return false;
      }
    }
    console.error(`[SafeStorage] Failed to set localStorage key "${key}"`, err);
    return false;
  }
}

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
