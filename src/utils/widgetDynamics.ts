import type React from 'react';
import type { WidgetElement, DynamicRule, AssociatedWidgetEntity, WidgetCustomProperty } from '../types/domain';
import { inheritanceService } from '../services/InheritanceService';

// Extracts the property name from a mapping value like "me.nivel" → "nivel"
function extractPropertyName(mappingValue: string): string {
  if (mappingValue.startsWith('me.')) {
    return mappingValue.slice(3);
  }
  return mappingValue;
}

// Resolves the raw string value of a widget custom property from the simulated values.
function resolveCustomPropValue(
  customPropId: string,
  mappings: AssociatedWidgetEntity['mappings'],
  simulatedValues: Record<string, string>,
  objectId: string
): string | undefined {
  const mapping = mappings[customPropId];
  if (!mapping) return undefined;

  if (mapping.type === 'fixed') {
    return mapping.value;
  }

  // type === 'property'
  const val = mapping.value;

  // Check if it's a direct mapping to an object property (e.g. "objId:propName")
  if (val && val.includes(':')) {
    const [targetObjId, propName] = val.split(':');
    if (!targetObjId || !propName) return undefined;

    const liveValue = simulatedValues[val];
    if (liveValue !== undefined) {
      return liveValue;
    }

    // Fallback to property default value
    try {
      const props = inheritanceService.getMergedProperties(targetObjId, 'instance');
      const prop = props.find((p) => p.name === propName);
      return prop?.defaultValue;
    } catch (err) {
      return undefined;
    }
  }

  // Otherwise, it's relative to the associated object ("me.propName" or "propName")
  const propName = extractPropertyName(val);
  if (!propName) return undefined;

  const liveValue = simulatedValues[`${objectId}:${propName}`];
  if (liveValue !== undefined) {
    return liveValue;
  }

  // Fallback to property default value from database via inheritanceService
  if (objectId) {
    try {
      const props = inheritanceService.getMergedProperties(objectId, 'instance');
      const prop = props.find((p) => p.name === propName);
      return prop?.defaultValue;
    } catch (err) {
      console.error('Error fetching fallback property value:', err);
      return undefined;
    }
  }
  return undefined;
}

// ─── Fill / Stroke color resolution ──────────────────────────────────────────

function resolveColorDynamic(
  rule: DynamicRule,
  rawValue: string | undefined,
  defaultColor: string
): string {
  if (rawValue === undefined) return defaultColor;
  const config = rule.config || {};

  // Boolean: true/false → color
  if (config.boolean) {
    const isTrue = rawValue === 'true' || rawValue === '1';
    return isTrue ? (config.boolean.trueColor ?? defaultColor) : (config.boolean.falseColor ?? defaultColor);
  }

  // Color variable: use value directly as CSS color
  if (rawValue.startsWith('#') || rawValue.startsWith('rgb')) {
    return rawValue;
  }

  // Boolean fallback if no config.boolean is defined
  const isTrueString = rawValue === 'true' || rawValue === '1';
  const isFalseString = rawValue === 'false' || rawValue === '0';
  if (isTrueString || isFalseString) {
    return isTrueString ? '#22c55e' : '#ef4444';
  }

  // Float/Integer: analog ranges
  if (config.ranges && config.ranges.length > 0) {
    const num = parseFloat(rawValue);
    if (!isNaN(num)) {
      for (const range of config.ranges) {
        const lo = parseFloat(range.lo);
        const hi = parseFloat(range.hi);
        if (!isNaN(lo) && !isNaN(hi) && num >= lo && num <= hi) {
          return range.color ?? range.value ?? defaultColor;
        }
      }
    }
  }

  // String mappings
  if (config.stringMappings && config.stringMappings.length > 0) {
    const match = config.stringMappings.find((m: any) => m.value === rawValue);
    if (match) {
      return match.color ?? match.value ?? defaultColor;
    }
  }

  return defaultColor;
}

// ─── Visibility resolution ────────────────────────────────────────────────────

function resolveVisibilityDynamic(
  rule: DynamicRule,
  rawValue: string | undefined
): boolean /* isHidden */ {
  if (rawValue === undefined) return false;
  const config = rule.config || {};

  // Boolean
  if (config.visibilityBoolean !== undefined) {
    const isTrue = rawValue === 'true' || rawValue === '1';
    // Default: visible when TRUE → hidden when FALSE; invert flips this
    return config.visibilityBoolean.invert ? isTrue : !isTrue;
  }

  // Float / Integer
  if (config.visibilityNumeric !== undefined) {
    const { operator = '>', value = 0, invert = false } = config.visibilityNumeric;
    const num = parseFloat(rawValue);
    if (!isNaN(num)) {
      let condition: boolean;
      switch (operator) {
        case '>': condition = num > value; break;
        case '>=': condition = num >= value; break;
        case '<': condition = num < value; break;
        case '<=': condition = num <= value; break;
        case '==': condition = num === value; break;
        case '!=': condition = num !== value; break;
        default: condition = false;
      }
      return invert ? !condition : condition;
    }
  }

  // String
  if (config.visibilityString !== undefined) {
    const { operator = '==', value = '' } = config.visibilityString;
    let condition: boolean;
    switch (operator) {
      case '==': condition = rawValue === value; break;
      case '!=': condition = rawValue !== value; break;
      case 'contains': condition = rawValue.includes(value); break;
      default: condition = false;
    }
    return !condition;
  }

  return false;
}

// ─── Fill Level resolution ────────────────────────────────────────────────────

export interface FillLevelStyle {
  containerStyle: React.CSSProperties;
  overlayStyle: React.CSSProperties;
}

function resolveFillLevelDynamic(
  rule: DynamicRule,
  rawValue: string | undefined,
  elementFill: string
): FillLevelStyle | null {
  // If rule.config or config.fillLevel is missing, use an empty object so we can apply defaults
  const flConfig = rule.config?.fillLevel ?? {};

  const {
    minValue = 0,
    maxValue = 100,
    fillColor = '#0ea5e9', // Set a default bright level color if not explicitly defined
    emptyColor = 'transparent',
    direction = 'bottom-up',
  } = flConfig;

  const minVal = parseFloat(minValue as any);
  const maxVal = parseFloat(maxValue as any);
  const safeMin = isNaN(minVal) ? 0 : minVal;
  const safeMax = isNaN(maxVal) ? 100 : maxVal;

  const num = rawValue !== undefined ? parseFloat(rawValue) : 0;
  const clampedNum = isNaN(num) ? safeMin : Math.min(safeMax, Math.max(safeMin, num));
  const range = safeMax - safeMin || 1;
  const pct = ((clampedNum - safeMin) / range) * 100;

  // Fallback container background to elementFill if emptyColor is transparent, so the shape's body remains visible
  const containerStyle: React.CSSProperties = {
    background: emptyColor === 'transparent' ? (elementFill === 'transparent' ? 'transparent' : elementFill) : emptyColor,
    overflow: 'hidden',
  };

  let overlayStyle: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: fillColor,
    transition: 'all 0.4s ease',
  };

  switch (direction) {
    case 'bottom-up':
      overlayStyle = { ...overlayStyle, bottom: 0, left: 0, right: 0, height: `${pct}%` };
      break;
    case 'top-down':
      overlayStyle = { ...overlayStyle, top: 0, left: 0, right: 0, height: `${pct}%` };
      break;
    case 'left-right':
      overlayStyle = { ...overlayStyle, top: 0, bottom: 0, left: 0, width: `${pct}%` };
      break;
    case 'right-left':
      overlayStyle = { ...overlayStyle, top: 0, bottom: 0, right: 0, width: `${pct}%` };
      break;
  }

  return { containerStyle, overlayStyle };
}

// ─── Main resolver ────────────────────────────────────────────────────────────

export interface ResolvedWidgetElementStyle {
  fill: string;
  stroke: string;
  isHidden: boolean;
  fillLevel: FillLevelStyle | null;
}

/**
 * Resolves the final visual style for a single widget element, applying all
 * configured DynamicRules by looking up values from simulatedValues via the
 * AssociatedWidgetEntity mappings.
 */
export function resolveWidgetElementStyle(
  el: WidgetElement,
  mappings: AssociatedWidgetEntity['mappings'],
  simulatedValues: Record<string, string>,
  objectId: string
): ResolvedWidgetElementStyle {
  let fill = el.fill;
  let stroke = el.stroke;
  let isHidden = false;
  let fillLevel: FillLevelStyle | null = null;

  const dynamics = el.dynamics ?? [];

  for (const rule of dynamics) {
    const rawValue = resolveCustomPropValue(rule.variableId, mappings, simulatedValues, objectId);
    console.debug('[WidgetDynamic]', { elId: el.id, ruleType: rule.type, variableId: rule.variableId, rawValue, config: rule.config, mappingsKeys: Object.keys(mappings) });

    switch (rule.type) {
      case 'fill':
        fill = resolveColorDynamic(rule, rawValue, fill);
        console.debug('[WidgetDynamic] fill resolved ->', fill);
        break;
      case 'stroke':
        stroke = resolveColorDynamic(rule, rawValue, stroke);
        break;
      case 'visibility':
        isHidden = resolveVisibilityDynamic(rule, rawValue);
        break;
      case 'fill_level':
        fillLevel = resolveFillLevelDynamic(rule, rawValue, fill);
        console.debug('[WidgetDynamic] fillLevel resolved ->', fillLevel);
        break;
    }
  }

  return { fill, stroke, isHidden, fillLevel };
}

export function resolveWidgetElementText(
  el: WidgetElement,
  customProperties: WidgetCustomProperty[],
  mappings: AssociatedWidgetEntity['mappings'],
  simulatedValues: Record<string, string>,
  objectId: string
): string {
  const binding = el.bindings?.find((b) => b.property === 'textContent' || b.property === 'value');
  if (!binding) {
    return el.textContent || '';
  }

  const prop = customProperties.find((p) => p.id === binding.customPropId);
  if (!prop) {
    return el.textContent || '';
  }

  // Resolve raw value
  const rawValue = resolveCustomPropValue(binding.customPropId, mappings, simulatedValues, objectId) ?? prop.defaultValue ?? '—';

  let valueStr = rawValue;

  // Format numeric values
  if (prop.dataType === 'Float' || prop.dataType === 'Integer') {
    let val = parseFloat(rawValue);
    if (!isNaN(val)) {
      if (el.conversionFactor !== undefined) {
        val = val * el.conversionFactor;
      }
      const decimals = el.decimalPlaces !== undefined ? el.decimalPlaces : 2;
      valueStr = val.toFixed(decimals);
    }
  }

  // Label prefix
  let labelPrefix = '';
  if (el.showLabel !== false) {
    const labelText = el.customLabel !== undefined && el.customLabel !== '' 
      ? el.customLabel 
      : prop.name;
    if (labelText) {
      labelPrefix = `${labelText}: `;
    }
  }

  // Unit suffix
  let unitSuffix = '';
  if (el.showUnit && el.unit) {
    unitSuffix = ` ${el.unit}`;
  }

  return `${labelPrefix}${valueStr}${unitSuffix}`;
}

