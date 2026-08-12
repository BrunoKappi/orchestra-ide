export type ProcessAlertSeverity = 'info' | 'attention' | 'important' | 'critical';

export type ProcessAlertStatus = 'active_unacknowledged' | 'active_acknowledged' | 'resolved' | 'expired';

export interface ProcessAlertRule {
  id: string;
  code: string; // Ex: PR-001
  name: string;
  type: string; // Ex: 'movement_delayed_start', 'process_ttl', etc.
  description: string;
  severity: ProcessAlertSeverity;
  enabled: boolean;
  colorHighlight: string; // Cor CSS (Hex, ex: '#3b82f6')
  soundFile: string; // ID/Preset do som (ex: 'double-beep')
  soundVolume: number; // Volume de 0 a 100
  repeatIntervalSec: number; // Intervalo de repetição (0 = sem repetição)
  params: Record<string, any>; // Parâmetros específicos (ex: { startDelayMin: 5, progressPctThreshold: 90 })
  createdAt: string;
  updatedAt: string;
}

export interface ProcessAlertDefinition {
  id: string;
  code: string; // Ex: AL-001
  name: string;
  enabled: boolean;
  ruleId: string; // ID do Preset da regra relacionada (ref: ProcessAlertRule)
  areaId: string; // ID da Área relacionada (ref: OmmArea)
  targetObjectId: string | null; // Opcional: filtro para objeto específico (ex: tank ID)
  targetMovementId: string | null; // Opcional: filtro para movimento específico (ex: movement ID)
  customParams?: Record<string, any>; // Opcional: parâmetros sobrescritos em relação ao preset
  createdAt: string;
  updatedAt: string;
}

export interface ProcessAlertOccur {
  id: string;
  ruleId: string;
  definitionId: string | null; // Ref à definição do alerta (null para disparos manuais de teste)
  code: string; // Código do alerta gerado (geralmente herdado da definição)
  name: string; // Nome do alerta gerado (geralmente herdado da definição)
  type: string;
  description: string;
  severity: ProcessAlertSeverity;
  responsibleAreas: string[];
  relatedObjectId: string | null;
  relatedObjectName: string | null;
  relatedMovementId: string | null;
  relatedMovementNumber: string | null;
  conditionSummary: string;
  currentValue: string;
  limitValue: string;
  status: ProcessAlertStatus;
  activatedAt: string;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  resolvedAt: string | null;
  colorHighlight: string;
  soundFile: string;
  soundVolume: number;
  isTest: boolean; // Indica se é um alerta simulado de teste
  lastNotifiedAt: string | null; // Data/Hora do último aviso (para lógica de repetição)
}
