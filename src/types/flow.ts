export type FlowContextType = 'global' | 'template' | 'instance';

export type IndustrialNodeType =
  | 'read_property'
  | 'write_property'
  | 'compare_variable'
  | 'execute_script'
  | 'call_flowchart'
  | 'delay'
  | 'timer'
  | 'wait_alarm'
  | 'ack_alarm'
  | 'query_history'
  | 'raise_event'
  | 'update_widget'
  | 'update_faceplate'
  | 'start_sim'
  | 'stop_sim'
  | 'execute_expression'
  | 'log'
  | 'comment'
  | 'logical_group';

export type ComparisonOperator =
  | 'Equal'
  | 'NotEqual'
  | 'GreaterThan'
  | 'LessThan'
  | 'GreaterOrEqual'
  | 'LessOrEqual'
  | 'Between'
  | 'Contains'
  | 'StartsWith'
  | 'EndsWith'
  | 'AND'
  | 'OR'
  | 'NOT'
  | 'XOR';

export interface ComparisonCondition {
  id: string;
  leftOperand: string; // e.g. "me.Level" or local variable or constant
  leftOperandType: 'property' | 'constant' | 'variable' | 'prev_node';
  operator: ComparisonOperator;
  rightOperand: string;
  rightOperandType: 'property' | 'constant' | 'variable' | 'prev_node';
  secondaryOperand?: string; // For 'Between'
}

export interface FlowExpression {
  conditions: ComparisonCondition[];
  logic: 'AND' | 'OR';
  customScript?: string;
}

export interface FlowAssignment {
  targetProperty: string;
  sourceType: 'constant' | 'property' | 'expression' | 'prev_node';
  sourceValue: string;
}

export interface FlowNodeMetadata {
  id: string; // BPMN element ID (e.g. Activity_123)
  name: string;
  description?: string;
  documentation?: string;
  color?: string;
  category?: string;
  isIndustrialNode?: boolean;
  industrialType?: IndustrialNodeType;
  
  // Custom node colors
  borderColor?: string;
  backgroundColor?: string;
  textColor?: string;

  // Specific node configurations
  expression?: FlowExpression;
  assignment?: FlowAssignment;
  targetObjectId?: string;
  targetPropertyId?: string;
  targetPropertyName?: string;
  targetScriptId?: string;
  targetFlowchartId?: string;
  targetWidgetId?: string;
  alarmRuleId?: string;
  durationMs?: number;
  timerMode?: 'interval' | 'timeout' | 'cron';
  cronExpression?: string;
  queryHistoryProp?: string;
  logLevel?: 'info' | 'warning' | 'error';
  logMessage?: string;
  raiseEventName?: string;
  raiseEventPayload?: string;
  comments?: string;
  groupColor?: string;
}

export interface FlowchartEntity {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  version: string;
  createdAt: string;
  updatedAt: string;
  author: string;
  
  contextType: FlowContextType;
  targetId: string | null; // templateId or objectId if bound
  folderId?: string | null;
  
  bpmnXml: string;
  nodeMetadata: Record<string, FlowNodeMetadata>; // Keyed by BPMN element ID
}

export interface FlowchartFolderEntity {
  id: string;
  name: string;
  parentFolderId: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface FlowchartNodeEntity {
  id: string;
  type: 'folder' | 'flowchart';
  targetId: string;
  parentFolderId: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface FlowchartTreeNode {
  id: string;
  name: string;
  type: 'folder' | 'flowchart' | 'unassigned_root';
  targetId: string;
  parentFolderId: string | null;
  order: number;
  children: FlowchartTreeNode[];
  flowchartDetail?: FlowchartEntity;
}

export interface FlowValidationProblem {
  id: string;
  nodeId: string;
  nodeName: string;
  type: 'error' | 'warning';
  code: string;
  message: string;
  detail?: string;
}
