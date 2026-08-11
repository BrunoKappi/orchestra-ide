import { objectRepo } from '../../../repository/ObjectRepository';
import type { TankStrappingConfig } from '../../../types/domain';

/**
 * Retrieves the strapping (calibration) configuration of a tank by its object ID.
 */
export function getStrappingConfig(objectId: string): TankStrappingConfig | null {
  const obj = objectRepo.getById(objectId);
  return obj?.strappingConfig || null;
}

/**
 * Converts a level (%) to volume (m³) using the tank strapping points.
 * Falls back to linear calculation based on capacity if no strapping is configured.
 */
export function convertLevelToVolume(level: number, strapping: TankStrappingConfig | null, capacity: number): number {
  if (strapping && strapping.points && strapping.points.length >= 2) {
    const sorted = [...strapping.points].sort((a, b) => a.level - b.level);
    const minPt = sorted[0];
    const maxPt = sorted[sorted.length - 1];

    if (level <= minPt.level) return minPt.volume;
    if (level >= maxPt.level) return maxPt.volume;

    // Linear interpolation
    for (let i = 0; i < sorted.length - 1; i++) {
      const p1 = sorted[i];
      const p2 = sorted[i + 1];
      if (level >= p1.level && level <= p2.level) {
        if (p2.level === p1.level) return p1.volume;
        const ratio = (level - p1.level) / (p2.level - p1.level);
        return p1.volume + ratio * (p2.volume - p1.volume);
      }
    }
  }

  // Fallback: linear capacity-based
  return (level / 100) * capacity;
}

/**
 * Converts a volume (m³) to level (%) using the tank strapping points.
 * Falls back to linear calculation based on capacity if no strapping is configured.
 */
export function convertVolumeToLevel(volume: number, strapping: TankStrappingConfig | null, capacity: number): number {
  if (strapping && strapping.points && strapping.points.length >= 2) {
    const sortedByVol = [...strapping.points].sort((a, b) => a.volume - b.volume);
    const minPt = sortedByVol[0];
    const maxPt = sortedByVol[sortedByVol.length - 1];

    if (volume <= minPt.volume) return minPt.level;
    if (volume >= maxPt.volume) return maxPt.level;

    // Linear interpolation
    for (let i = 0; i < sortedByVol.length - 1; i++) {
      const p1 = sortedByVol[i];
      const p2 = sortedByVol[i + 1];
      if (volume >= p1.volume && volume <= p2.volume) {
        if (p2.volume === p1.volume) return p1.level;
        const ratio = (volume - p1.volume) / (p2.volume - p1.volume);
        return p1.level + ratio * (p2.level - p1.level);
      }
    }
  }

  // Fallback: linear capacity-based
  return (volume / capacity) * 100;
}
