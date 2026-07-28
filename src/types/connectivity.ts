import type { Node, Edge } from '@xyflow/react';

export type ConnectionCategory =
  | 'Database'
  | 'Industrial'
  | 'Enterprise ERP'
  | 'Messaging & Queue'
  | 'Files & Storage'
  | 'Web APIs & Protocols'
  | 'Utilities';

export type ConnectionType =
  | 'SQL Server'
  | 'Oracle'
  | 'PostgreSQL'
  | 'MySQL'
  | 'SQLite'
  | 'SAP'
  | 'REST API'
  | 'SOAP'
  | 'OPC UA'
  | 'OPC DA'
  | 'MQTT Broker'
  | 'RabbitMQ'
  | 'Kafka'
  | 'Modbus TCP'
  | 'Siemens S7'
  | 'Allen Bradley'
  | 'PI System'
  | 'IP21'
  | 'CSV'
  | 'Excel'
  | 'XML'
  | 'JSON'
  | 'FTP'
  | 'SFTP'
  | 'SMTP'
  | 'WebSocket'
  | 'File System';

export type ConnectionEnvironment = 'Production' | 'Staging' | 'Development' | 'Testing';

export type ConnectionStatus = 'Connected' | 'Disconnected' | 'Warning' | 'Error' | 'Degraded';

export type HealthIndicator = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';

export interface ConnectivityConnection {
  id: string;
  name: string;
  type: ConnectionType;
  category: ConnectionCategory;
  description: string;
  environment: ConnectionEnvironment;
  status: ConnectionStatus;
  lastCommunication: string;
  simulatedLatencyMs: number;
  messagesProcessedCount: number;
  msgPerSecond: number;
  color: string;
  icon: string;
  tags: string[];
  notes: string;
  healthIndicator: HealthIndicator;
  healthPercentage: number;
  isFavorite: boolean;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type FlowCategory =
  | 'Industrial IoT'
  | 'ERP Integration'
  | 'Database Sync'
  | 'Alarm Notification'
  | 'Quality Analytics'
  | 'Cut-off Historian'
  | 'Custom Pipeline';

export type FlowStatus = 'Draft' | 'Running' | 'Paused' | 'Stopped';

export interface ConnectivityFlowNodeData extends Record<string, unknown> {
  label: string;
  category: 'Entrada' | 'Transformação' | 'Industrial' | 'Banco de Dados' | 'Comunicação' | 'Utilidades';
  blockType: string;
  iconName: string;
  color: string;
  description: string;
  inputsCount: number;
  outputsCount: number;
  properties: Record<string, any>;
}

export interface ConnectivityFolder {
  id: string;
  name: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectivityFlow {
  id: string;
  folderId?: string | null;
  name: string;
  description: string;
  category: FlowCategory;
  version: string;
  author: string;
  status: FlowStatus;
  createdAt: string;
  updatedAt: string;
  documentation: string;
  nodes: Node<ConnectivityFlowNodeData>[];
  edges: Edge[];
  executedCount: number;
  lastExecutedAt?: string;
  avgDurationMs: number;
  errorRatePercent: number;
}

export interface MessageStepTrace {
  stepId: string;
  nodeName: string;
  nodeType: string;
  payloadIn: any;
  payloadOut: any;
  durationMs: number;
  status: 'Success' | 'Warning' | 'Error';
  logMessage?: string;
  timestamp: string;
}

export interface ConnectivityMessageTrace {
  id: string;
  flowId: string;
  flowName: string;
  timestamp: string;
  trigger: string;
  totalDurationMs: number;
  status: 'Success' | 'Warning' | 'Error';
  steps: MessageStepTrace[];
}

export type ScheduleTriggerType =
  | 'Timer'
  | 'Fixed Interval'
  | 'Cron Expression'
  | 'Manual'
  | 'System Event'
  | 'Variable Change'
  | 'Alarm'
  | 'State Change'
  | 'Cut-off Execution'
  | 'OMM Event';

export type ScheduleStatus = 'Active' | 'Paused' | 'Disabled';

export interface ConnectivitySchedule {
  id: string;
  flowId: string;
  flowName: string;
  triggerType: ScheduleTriggerType;
  cronExpression?: string;
  intervalSeconds?: number;
  eventPattern?: string;
  status: ScheduleStatus;
  lastRunAt?: string;
  nextRunAt?: string;
  runCount: number;
  description: string;
}

export type LogSeverity = 'Info' | 'Warning' | 'Error' | 'Critical';
export type LogStatus = 'Success' | 'Warning' | 'Error' | 'Running';

export interface ConnectivityLogEntry {
  id: string;
  timestamp: string;
  flowId: string;
  flowName: string;
  durationMs: number;
  messageCount: number;
  source: string;
  destination: string;
  status: LogStatus;
  severity: LogSeverity;
  triggeredBy: string;
  details: string;
  traceId?: string;
}

export interface ConnectivityGlobalVariable {
  id: string;
  name: string;
  type: 'String' | 'Number' | 'Boolean' | 'JSON' | 'Date' | 'Secret';
  value: string;
  description: string;
  category: string;
  environment: ConnectionEnvironment;
  updatedAt: string;
}

export interface ConnectivitySecret {
  id: string;
  name: string;
  category: 'Password' | 'API Token' | 'Private Key' | 'OAuth Secret' | 'Connection String';
  valueMasked: string;
  realValue: string;
  lastRotatedAt: string;
  status: 'Active' | 'Expiring Soon' | 'Expired';
  associatedConnections: string[];
  description: string;
}

export interface MappingTransformationStep {
  id: string;
  type: 'Converter' | 'Concatenate' | 'Regex' | 'JS Expression' | 'Format Date' | 'Math Calc' | 'Lookup';
  name: string;
  config: Record<string, any>;
}

export interface ConnectivityMappingRule {
  id: string;
  name: string;
  description: string;
  sourceModule: 'Orquestra Object' | 'OPC Tag' | 'Runtime Variable' | 'OMM Movement' | 'Simulator' | 'Quality';
  sourceEntity: string;
  sourceField: string;
  transformations: MappingTransformationStep[];
  targetModule: 'Object Property' | 'OMM Variable' | 'Widget' | 'Faceplate' | 'Database' | 'Alarm' | 'Event' | 'KPI';
  targetEntity: string;
  targetField: string;
  enabled: boolean;
  updatedAt: string;
}
