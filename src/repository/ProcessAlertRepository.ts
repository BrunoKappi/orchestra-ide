import type { ProcessAlertRule, ProcessAlertOccur, ProcessAlertDefinition } from '../types/processAlert';
import { safeGetItem, safeSetItem } from '../utils/safeStorage';

const RULES_KEY = 'omm_process_alert_rules_v1';
const DEFINITIONS_KEY = 'omm_process_alert_definitions_v1';
const OCCURRENCES_KEY = 'omm_process_alert_occurrences_v1';
const MAX_OCCURRENCES = 200;

export class ProcessAlertRepository {
  public getRules(): ProcessAlertRule[] {
    try {
      const data = safeGetItem(RULES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveRules(rules: ProcessAlertRule[]): void {
    safeSetItem(RULES_KEY, JSON.stringify(rules));
  }

  public getDefinitions(): ProcessAlertDefinition[] {
    try {
      const data = safeGetItem(DEFINITIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveDefinitions(definitions: ProcessAlertDefinition[]): void {
    safeSetItem(DEFINITIONS_KEY, JSON.stringify(definitions));
  }

  public getOccurrences(): ProcessAlertOccur[] {
    try {
      const data = safeGetItem(OCCURRENCES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveOccurrences(occurrences: ProcessAlertOccur[]): void {
    const capped = occurrences.length > MAX_OCCURRENCES 
      ? occurrences.slice(-MAX_OCCURRENCES) 
      : occurrences;
    safeSetItem(OCCURRENCES_KEY, JSON.stringify(capped));
  }

  public saveOccurrence(occ: ProcessAlertOccur): ProcessAlertOccur {
    const all = this.getOccurrences();
    const index = all.findIndex((o) => o.id === occ.id);
    if (index >= 0) {
      all[index] = { ...occ };
    } else {
      all.push(occ);
    }
    this.saveOccurrences(all);
    return occ;
  }

  public deleteOccurrence(id: string): boolean {
    const all = this.getOccurrences();
    const filtered = all.filter((o) => o.id !== id);
    if (filtered.length < all.length) {
      this.saveOccurrences(filtered);
      return true;
    }
    return false;
  }

  public clear(): void {
    safeSetItem(OCCURRENCES_KEY, JSON.stringify([]));
    safeSetItem(DEFINITIONS_KEY, JSON.stringify([]));
  }
}

export const processAlertRepo = new ProcessAlertRepository();
