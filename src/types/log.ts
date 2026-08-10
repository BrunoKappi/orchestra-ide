export type LogSeverity = 'Informação' | 'Sucesso' | 'Aviso' | 'Erro' | 'Crítico';

export type LogOperation =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'EXECUTE'
  | 'ACKNOWLEDGE'
  | 'CLOSE'
  | 'CANCEL'
  | 'ACTIVATE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'CONFIGURE'
  | 'EXPORT'
  | 'IMPORT';

export interface AuditLog {
  id: string;
  timestamp: string; // Formato: YYYY-MM-DD HH:mm:ss
  user: string;
  module: string; // Ex: Orquestra, Runtime, Alarmes, OMM, Segurança, Grid Designer, Fluxogramas, Connectivity Studio, Simulador, Cut-off, Inventário, Sistema
  entity: string; // Ex: Objeto, Template, Movimento, Usuário, Tela, Fluxo, Conexão, Alarme, etc.
  operation: LogOperation;
  action: string; // Descrição curta/amigável (ex: "Objeto criado", "Alarme reconhecido")
  description: string; // Detalhes da operação
  severity: LogSeverity;
  result: 'Sucesso' | 'Falha' | 'Bloqueado';
  origin: string; // Ex: 'manual', 'sistema', 'simulador'
  targetId?: string; // ID da entidade afetada
  previousValue?: string; // Valor anterior (quando aplicável)
  newValue?: string; // Novo valor (quando aplicável)
  metadata?: Record<string, any>; // Metadados extras
}
