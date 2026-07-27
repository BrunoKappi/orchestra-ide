export interface SecurityUser {
  id: string;
  name: string;
  login: string;
  email: string;
  role: string;          // Cargo (ex: Engenheiro de Automação)
  area: string;          // Área (ex: Utilidades, Processo)
  groupIds: string[];    // Grupos associados
  profileId: string;     // Perfil principal (ex: Administrador, Operador)
  status: 'Ativo' | 'Inativo';
  lastAccess: string;
  language: string;      // pt-BR, en-US, etc.
  preferredTheme: 'light' | 'dark';
  avatarUrl: string;
}

export interface SecurityGroup {
  id: string;
  name: string;
  description: string;
  color: string;         // Cor em formato CSS/Tailwind (ex: bg-blue-500)
  observations?: string;
}

export interface SecurityProfile {
  id: string;
  name: string;
  description: string;
}

export interface SecurityRole {
  id: string;
  name: string;
  description: string;
}

export type PermissionAction =
  | 'Visualizar'
  | 'Criar'
  | 'Editar'
  | 'Excluir'
  | 'Importar'
  | 'Exportar'
  | 'Executar'
  | 'Configurar'
  | 'Administrar';

export type PermissionValue = 'Herdeiro' | 'Permitido' | 'Negado';

export interface PermissionMatrix {
  [moduleName: string]: {
    [action in PermissionAction]?: PermissionValue;
  };
}

export interface SecurityPermissionConfig {
  id: string;
  targetType: 'profile' | 'group' | 'user';
  targetId: string;
  matrix: PermissionMatrix;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: 'Criar' | 'Editar' | 'Excluir' | 'Associação' | 'Configuração';
  target: string;
  description: string;
}
