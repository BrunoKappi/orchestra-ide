/**
 * trendHistorySimulator.ts
 *
 * Generates synthetic historical data for tank process variable trend charts.
 * This makes charts show realistic curves instead of flat lines when real
 * historical data hasn't accumulated yet (prototype / demo mode).
 *
 * The generated history always ends at `currentValue` so it connects
 * seamlessly with live data.
 */

export type TrendDirection = 'up' | 'down' | 'stable';

export interface GenerateTrendHistoryOptions {
  /** Process variable name — drives the shape of the generated curve */
  variableName: string;
  /** The current (live) value — the history will converge to this */
  currentValue: number;
  /** Direction of the trend leading up to currentValue */
  trend: TrendDirection;
  /** Number of historical samples to generate (default: 50) */
  numSamples?: number;
  /** Physical lower bound (clamp). e.g. 0 for Level */
  minBound?: number;
  /** Physical upper bound (clamp). e.g. 100 for Level */
  maxBound?: number;
  /** Optional time offset (e.g. Date.now()) to animate/scroll the generated curves over time */
  timeOffset?: number;
}

// ---------------------------------------------------------------------------
// Small deterministic pseudo-random helper (seeded, reproducible per call)
// ---------------------------------------------------------------------------
function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------
export function generateTrendHistory(opts: GenerateTrendHistoryOptions): number[] {
  const {
    variableName,
    currentValue,
    trend,
    numSamples = 50,
    minBound,
    maxBound,
  } = opts;

  const name = variableName.toLowerCase();
  // Stable seed based on variable name so noise doesn't flicker wildly when currentValue changes
  const seed = name.charCodeAt(0) * 17 + name.length * 31;
  const rand = seededRand(seed);

  const clamp = (v: number) => {
    let result = v;
    if (minBound !== undefined) result = Math.max(minBound, result);
    if (maxBound !== undefined) result = Math.min(maxBound, result);
    return result;
  };

  // Temperature: sinusoidal with optional drift
  if (name.includes('temp')) {
    return generateSinusoidal({
      currentValue,
      numSamples,
      amplitude: 2.0,
      periodSamples: 30,
      trend,
      trendDrift: trend !== 'stable' ? 1.5 : 0,
      noiseAmp: 0.1,
      rand,
      clamp,
      timeOffset: opts.timeOffset,
    });
  }

  // Pressure: moderate oscillation
  if (name.includes('press')) {
    return generateSinusoidal({
      currentValue,
      numSamples,
      amplitude: 0.15,
      periodSamples: 20,
      trend,
      trendDrift: trend !== 'stable' ? 0.08 : 0,
      noiseAmp: 0.02,
      rand,
      clamp,
      timeOffset: opts.timeOffset,
    });
  }

  // Density: very slow drift, nearly stable
  if (name.includes('density') || name.includes('dens')) {
    return generateSinusoidal({
      currentValue,
      numSamples,
      amplitude: 0.5,
      periodSamples: 40,
      trend: 'stable',
      trendDrift: 0,
      noiseAmp: 0.05,
      rand,
      clamp,
      timeOffset: opts.timeOffset,
    });
  }

  // Level / Volume / Mass / Flow: ramp with noise
  return generateRamp({
    currentValue,
    numSamples,
    trend,
    noiseAmp: Math.max(0.05, Math.abs(currentValue) * 0.005),
    rand,
    clamp,
    timeOffset: opts.timeOffset,
    minBound: opts.minBound,
    maxBound: opts.maxBound,
  });
}

// ---------------------------------------------------------------------------
// Ramp generator — for slow physical accumulation variables
// ---------------------------------------------------------------------------
interface RampOptions {
  currentValue: number;
  numSamples: number;
  trend: TrendDirection;
  noiseAmp: number;
  rand: () => number;
  clamp: (v: number) => number;
  timeOffset?: number;
  minBound?: number;
  maxBound?: number;
}

function generateRamp(opts: RampOptions): number[] {
  const { currentValue, numSamples, trend, noiseAmp, rand, clamp, minBound, maxBound } = opts;

  // Use bounds to calculate a visible amplitude if available, otherwise fallback
  const range = (maxBound !== undefined && minBound !== undefined)
    ? (maxBound - minBound)
    : Math.max(100, Math.abs(currentValue) * 2);
  
  // Amplitude is 15% of the range or current value (min 5 units to always show movement)
  const amplitude = Math.max(5, range * 0.15, Math.abs(currentValue) * 0.15);

  let startVal: number;
  switch (trend) {
    case 'down':
      // History started high and fell to currentValue
      startVal = currentValue + amplitude;
      break;
    case 'up':
      // History started low and rose to currentValue
      startVal = currentValue - amplitude;
      break;
    default:
      // Stable
      startVal = currentValue;
      break;
  }

  const result: number[] = [];

  for (let i = 0; i < numSamples; i++) {
    const t = i / (numSamples - 1); // 0 → 1

    let baseVal: number;
    if (trend === 'stable') {
      // Stable line at currentValue with only high-frequency noise
      baseVal = currentValue;
    } else {
      // Linear interpolation from startVal to currentValue with organic angle variations
      const wave = Math.sin(t * Math.PI * 2) * ((currentValue - startVal) * 0.08);
      baseVal = startVal + (currentValue - startVal) * t + wave;
    }

    // Add noise
    const noise = (rand() - 0.5) * 2 * noiseAmp;
    result.push(clamp(baseVal + noise));
  }

  return result;
}

// ---------------------------------------------------------------------------
// Sinusoidal generator — for temperature, pressure, density
// ---------------------------------------------------------------------------
interface SinusoidalOptions {
  currentValue: number;
  numSamples: number;
  amplitude: number;
  periodSamples: number;
  trend: TrendDirection;
  trendDrift: number;
  noiseAmp: number;
  rand: () => number;
  clamp: (v: number) => number;
  timeOffset?: number;
}

function generateSinusoidal(opts: SinusoidalOptions): number[] {
  const {
    currentValue,
    numSamples,
    amplitude,
    periodSamples,
    trend,
    trendDrift,
    noiseAmp,
    rand,
    clamp,
    timeOffset = 0,
  } = opts;

  const result: number[] = [];

  // Animate the sine wave based on timeOffset
  const animPhase = (timeOffset / 5000) * Math.PI * 2;
  const phaseOffset = -Math.PI / 2 + animPhase; 
  const endPhase = 2 * Math.PI * (numSamples / periodSamples) + phaseOffset;
  const endSin = Math.sin(endPhase);
  const baseStart = currentValue - endSin * amplitude;

  for (let i = 0; i < numSamples; i++) {
    const t = i / (numSamples - 1);
    const phase = 2 * Math.PI * (i / periodSamples) + phaseOffset;
    const sinVal = Math.sin(phase) * amplitude;

    // Apply trend drift: starts at 0 drift, grows to trendDrift
    let driftDir = 0;
    if (trend === 'down') driftDir = -1;
    else if (trend === 'up') driftDir = 1;
    const drift = driftDir * trendDrift * t;

    const noise = (rand() - 0.5) * 2 * noiseAmp;
    result.push(clamp(baseStart + sinVal + drift + noise));
  }

  return result;
}
