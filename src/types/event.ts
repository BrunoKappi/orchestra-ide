export type SeverityType = 'low' | 'medium' | 'high' | 'critical';

export type LogicalOperator = 'AND' | 'OR' | 'NOT';

export type LeafConditionType =
  | 'property_compare'
  | 'state_change'
  | 'elapsed_time'
  | 'update_frequency'
  | 'previous_events'
  | 'active_alarms'
  | 'scripts_executed'
  | 'time_schedule'
  | 'object_state'
  | 'custom_expression';

export interface LeafCondition {
  id: string;
  type: 'leaf';
  conditionType: LeafConditionType;
  params: {
    objectId?: string;
    propertyName?: string;
    operator?: 'greater' | 'less' | 'equal' | 'notequal' | 'between' | 'contains' | 'starts_with' | 'ends_with';
    compareValue?: string;
    compareValue2?: string; // For between
    changeType?: 'any' | 'to_value';
    targetValue?: string;
    durationSec?: number;
    frequencyHz?: number;
    timeWindowSec?: number;
    eventId?: string;
    eventStatus?: 'triggered' | 'idle';
    alarmSeverity?: 'low' | 'medium' | 'high' | 'critical' | 'any';
    specificAlarmRuleId?: string;
    scriptId?: string;
    specificTime?: string; // "HH:MM"
    weekdays?: number[]; // [0,1,2,3,4,5,6] (0 = Sunday)
    objectStateProperty?: 'isDeployed' | 'createdAt' | 'updatedAt';
    expression?: string;
  };
}

export interface LogicalCondition {
  id: string;
  type: 'logical';
  operator: LogicalOperator;
  conditions: ConditionNode[];
}

export type ConditionNode = LogicalCondition | LeafCondition;

export type ActionType =
  | 'record_history'
  | 'generate_notification'
  | 'open_popup'
  | 'run_javascript'
  | 'change_property'
  | 'toggle_movement'
  | 'acknowledge_alarm'
  | 'create_alarm'
  | 'send_message'
  | 'change_variable'
  | 'generate_log'
  | 'audit_log'
  | 'execute_flowchart'
  | 'start_recipe'
  | 'external_integration';

export interface EventAction {
  id: string;
  type: ActionType;
  params: {
    propertyName?: string;
    value?: string;
    message?: string;
    scriptCode?: string;
    objectId?: string;
    movementId?: string;
    movementStatus?: 'Active' | 'Completed' | 'Closed';
    alarmId?: string;
    flowchartId?: string;
    recipeId?: string;
    url?: string;
    [key: string]: any;
  };
}

export interface EventConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: SeverityType;
  priority: number;
  enabled: boolean;
  group: string;
  responsibleArea: string;
  observations: string;
  condition: ConditionNode;
  actions: EventAction[];
  createdAt: string;
  updatedAt: string;
}

export interface ActiveEventState {
  id: string; // matches EventConfig.id
  name: string;
  status: 'triggered' | 'idle';
  activatedAt: string | null;
  durationMs: number;
  satisfiedRuleDescription: string;
}

export interface EventHistoryLog {
  id: string;
  eventId: string;
  eventName: string;
  timestamp: string;
  type: 'activation' | 'deactivation' | 'action_execution' | 'error';
  message: string;
  details?: string;
}
