import type { Node, Edge } from '@xyflow/react';

export type BatchStepType =
  | 'start'
  | 'transfer'
  | 'agitate'
  | 'heat'
  | 'cool'
  | 'cip'
  | 'separate'
  | 'cutoff'
  | 'end'
  | 'split'
  | 'join';

export type BatchStepState = 'pending' | 'running' | 'completed' | 'error';

export interface BatchStepConfig {
  label: string;
  stepType: BatchStepType;
  description?: string;

  // Transfer parameters
  originId?: string;       // Source tank instance ID
  destinationId?: string;  // Target tank/vessel instance ID
  productId?: string;      // Product ID to move
  plannedVolume?: number;  // Planned quantity in m³
  plannedFlow?: number;    // Transfer speed in m³/h

  // Agitation parameters
  vesselId?: string;       // Mixing vessel instance ID
  agitatorSpeedRpm?: number; // Target agitator RPM (e.g., 120)
  durationSeconds?: number;  // How long to agitate (seconds)

  // Heating parameters
  heatVesselId?: string;      // Heating vessel instance ID
  targetTemperature?: number; // Target temp in °C
  heatingRate?: number;       // °C per simulation tick

  // Cooling parameters
  coolingRate?: number;       // °C per simulation tick for cooling

  // CIP parameters
  cipAgent?: string;          // e.g. "Soda (NaOH)", "Água Purificada"

  // Separation parameters
  separationMethod?: string;  // e.g. "Decantação", "Filtração"

  // Cut-off parameters
  cutoffEquipmentIds?: string[];
  cutoffNotes?: string;
}

export interface RecipeEntity {
  id: string;
  name: string;
  description: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  nodes: Node[];
  edges: Edge[];
}

export interface BatchInstanceEntity {
  id: string;
  recipeId: string;
  recipeName: string;
  batchNumber: string; // e.g., BATCH-2026-001
  status: 'pending' | 'running' | 'completed' | 'paused' | 'error' | 'canceled';
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  activeStepIds: string[]; // parallel execution tracking
  stepStates: Record<string, BatchStepState>; // node ID -> step state
  stepElapsedSeconds: Record<string, number>; // node ID -> elapsed seconds
  stepProgress: Record<string, number>; // node ID -> completion percent (0-100)
  stepActiveMovementId?: Record<string, string>; // node ID -> OMM movement ID for transfer steps
  stepLogs: Record<string, string[]>; // node ID -> history of phase alerts/logs
  logs: string[]; // General execution logs for the entire batch
  orderId?: string; // OMM order ID reference
}
