import type { EntityType } from './domain';

export type MockPresetType =
  | 'range'
  | 'sine'
  | 'step'
  | 'walk'
  | 'boolean_toggle'
  | 'enum_list'
  | 'date_now'
  | 'custom';

export interface MockConfigParams {
  min?: number;
  max?: number;
  step?: number;
  periodSeconds?: number;
  options?: string[]; // Enum/List options
  mode?: 'random' | 'sequential';
  booleanProbability?: number; // 0..1
  toggleIntervalSec?: number;
  decimals?: number;
  customValue?: string;
}

export interface MockConfig {
  id: string;
  targetId: string;
  targetType: EntityType;
  propertyName: string;
  enabled: boolean;
  preset: MockPresetType;
  params: MockConfigParams;
  createdAt: string;
  updatedAt: string;
}

export interface MergedMockConfig extends MockConfig {
  isInherited: boolean;
  sourceTemplateId?: string;
  sourceTemplateName?: string;
  isOverridden?: boolean;
}
