import type { Node, Edge } from '@xyflow/react';
import type { IndustrialNodeType, FlowNodeMetadata } from './flow';

export type FlowV2NodeType =
  | IndustrialNodeType
  | 'start'
  | 'end'
  | 'gateway_exclusive'
  | 'gateway_parallel'
  | 'subprocess'
  | 'container'
  | 'sticky_note'
  | 'custom_block';

export interface FlowV2Port {
  id: string;
  name: string;
  type: 'input' | 'output';
  dataType?: 'trigger' | 'boolean' | 'number' | 'string' | 'object' | 'any';
  color?: string;
}

export interface FlowNodeV2Data {
  [key: string]: unknown;
  label: string;
  description?: string;
  category?: string;
  iconName?: string;
  nodeType: FlowV2NodeType;
  isIndustrialNode?: boolean;
  industrialType?: IndustrialNodeType;
  
  // Custom Styling
  borderColor?: string;
  backgroundColor?: string;
  textColor?: string;
  width?: number;
  height?: number;
  
  // Dynamic Ports
  inputs?: FlowV2Port[];
  outputs?: FlowV2Port[];
  
  // Node Metadata (compatible with legacy FlowNodeMetadata)
  metadata: FlowNodeMetadata;
  
  // Real-time Simulation State
  simState?: 'idle' | 'executing' | 'success' | 'error';
  simValue?: any;
  simLog?: string;
  
  // Container & Sticky Note specifics
  containerTitle?: string;
  containerColor?: string;
  noteColor?: 'yellow' | 'blue' | 'green' | 'pink' | 'purple';
  noteText?: string;
}

export type FlowNodeV2 = Node<FlowNodeV2Data>;

export interface FlowEdgeV2Data {
  [key: string]: unknown;
  label?: string;
  animated?: boolean;
  color?: string;
  strokeWidth?: number;
  lineStyle?: 'smoothstep' | 'bezier' | 'straight';
  conditionValue?: 'true' | 'false' | string;
  
  // Real-time Simulation passing payload
  simPayload?: any;
  isSimulatingActive?: boolean;
}

export type FlowEdgeV2 = Edge<FlowEdgeV2Data>;

export interface FlowV2Data {
  nodes: FlowNodeV2[];
  edges: FlowEdgeV2[];
  viewport?: { x: number; y: number; zoom: number };
  backgroundType?: 'dots' | 'lines' | 'none';
  gridSize?: number;
}

export interface FlowV2Stats {
  totalNodes: number;
  totalEdges: number;
  complexityIndex: number;
  orphanNodes: string[];
  cyclesDetected: boolean;
  validationErrorsCount: number;
  validationWarningsCount: number;
}

export interface FlowV2Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  icon: string;
  flowData: FlowV2Data;
}
