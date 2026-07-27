import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import { STORAGE_KEYS } from '../repository/storageKey';
import type {
  SecurityUser,
  SecurityGroup,
  SecurityProfile,
  SecurityRole,
  SecurityPermissionConfig,
  SecurityAuditLog,
  PermissionMatrix
} from '../types/security';

interface SecurityStoreState {
  users: SecurityUser[];
  groups: SecurityGroup[];
  profiles: SecurityProfile[];
  roles: SecurityRole[];
  permissionConfigs: SecurityPermissionConfig[];
  auditLogs: SecurityAuditLog[];
}

interface SecurityStoreActions {
  addUser: (user: Omit<SecurityUser, 'id' | 'lastAccess'>) => void;
  updateUser: (id: string, user: Partial<Omit<SecurityUser, 'id' | 'lastAccess'>>) => void;
  deleteUser: (id: string) => void;

  addGroup: (group: Omit<SecurityGroup, 'id'>) => void;
  updateGroup: (id: string, group: Partial<Omit<SecurityGroup, 'id'>>) => void;
  deleteGroup: (id: string) => void;

  addProfile: (profile: Omit<SecurityProfile, 'id'>) => void;
  updateProfile: (id: string, profile: Partial<Omit<SecurityProfile, 'id'>>) => void;
  deleteProfile: (id: string) => void;

  addRole: (role: Omit<SecurityRole, 'id'>) => void;
  updateRole: (id: string, role: Partial<Omit<SecurityRole, 'id'>>) => void;
  deleteRole: (id: string) => void;

  savePermissionConfig: (targetType: 'profile' | 'group' | 'user', targetId: string, matrix: PermissionMatrix) => void;

  addAuditLog: (action: SecurityAuditLog['action'], target: string, description: string) => void;
  clearAllData: () => void;
}

type SecurityStore = SecurityStoreState & SecurityStoreActions;

// Deterministic IDs for default seeds
const SEED_PROFILES = {
  ADMIN: 'profile-admin',
  ENGENHARIA: 'profile-eng',
  OPERADOR: 'profile-op',
  VISITANTE: 'profile-vis'
};

const SEED_GROUPS = {
  ENGENHARIA: 'group-eng',
  OPERACAO: 'group-op'
};

// Initial Seed Data
const DEFAULT_PROFILES: SecurityProfile[] = [
  { id: SEED_PROFILES.ADMIN, name: 'Administrador', description: 'Acesso total e irrestrito a todas as configurações, módulos e ações do sistema.' },
  { id: SEED_PROFILES.ENGENHARIA, name: 'Engenharia', description: 'Permissão para criar, editar, simular e configurar templates, objetos, fluxogramas e banco de dados.' },
  { id: SEED_PROFILES.OPERADOR, name: 'Operador', description: 'Permissão focada em monitoramento, visualização, execução de rotinas, controle de alarmes e operação.' },
  { id: SEED_PROFILES.VISITANTE, name: 'Visitante', description: 'Permissão apenas de leitura para monitoramento básico, sem permissão para alterações.' }
];

const DEFAULT_GROUPS: SecurityGroup[] = [
  { id: SEED_GROUPS.ENGENHARIA, name: 'Engenharia', description: 'Grupo da Engenharia de Automação e Sistemas', color: 'bg-blue-600', observations: 'Responsáveis pela modelagem e design do sistema.' },
  { id: SEED_GROUPS.OPERACAO, name: 'Operação', description: 'Grupo dos Operadores de Painel e Supervisores', color: 'bg-orange-500', observations: 'Operação direta da planta industrial em turnos.' }
];

const DEFAULT_ROLES: SecurityRole[] = [
  { id: 'role-1', name: 'Engenheiro de Automação', description: 'Responsável pelo desenvolvimento da lógica e arquitetura do SCADA.' },
  { id: 'role-2', name: 'Operador de Painel', description: 'Responsável pela supervisão operacional e controle de processo da sala de controle.' },
  { id: 'role-3', name: 'Supervisor de Planta', description: 'Supervisão de equipe, turnos de produção e aprovações operacionais.' },
  { id: 'role-4', name: 'Técnico de Manutenção', description: 'Suporte a hardware, instrumentação e calibração de malhas.' },
  { id: 'role-5', name: 'Visitante Corporativo', description: 'Acesso temporário para auditorias ou visualizações gerenciais.' }
];

const DEFAULT_USERS: SecurityUser[] = [
  {
    id: 'user-1',
    name: 'Bruno Kappi',
    login: 'bruno.kappi',
    email: 'bruno.kappi@serrano.com.br',
    role: 'Engenheiro de Automação',
    area: 'Engenharia de Processos',
    groupIds: [SEED_GROUPS.ENGENHARIA],
    profileId: SEED_PROFILES.ADMIN,
    status: 'Ativo',
    lastAccess: '2026-07-27 09:30:14',
    language: 'pt-BR',
    preferredTheme: 'dark',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=bruno'
  },
  {
    id: 'user-2',
    name: 'Carlos Souza',
    login: 'carlos.souza',
    email: 'carlos.souza@serrano.com.br',
    role: 'Operador de Painel',
    area: 'Produção Central',
    groupIds: [SEED_GROUPS.OPERACAO],
    profileId: SEED_PROFILES.OPERADOR,
    status: 'Ativo',
    lastAccess: '2026-07-27 08:15:22',
    language: 'pt-BR',
    preferredTheme: 'light',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=carlos'
  },
  {
    id: 'user-3',
    name: 'Ana Martins',
    login: 'ana.martins',
    email: 'ana.martins@serrano.com.br',
    role: 'Supervisor de Planta',
    area: 'Supervisão de Utilidades',
    groupIds: [SEED_GROUPS.ENGENHARIA],
    profileId: SEED_PROFILES.ENGENHARIA,
    status: 'Ativo',
    lastAccess: '2026-07-26 17:45:09',
    language: 'pt-BR',
    preferredTheme: 'dark',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=ana'
  },
  {
    id: 'user-4',
    name: 'João Ferreira',
    login: 'joao.ferreira',
    email: 'joao.ferreira@serrano.com.br',
    role: 'Técnico de Manutenção',
    area: 'Manutenção Elétrica',
    groupIds: [SEED_GROUPS.OPERACAO],
    profileId: SEED_PROFILES.OPERADOR,
    status: 'Inativo',
    lastAccess: '2026-07-20 14:00:55',
    language: 'pt-BR',
    preferredTheme: 'light',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=joao'
  },
  {
    id: 'user-5',
    name: 'Maria Oliveira',
    login: 'maria.oliveira',
    email: 'maria.oliveira@serrano.com.br',
    role: 'Visitante Corporativo',
    area: 'Administração Geral',
    groupIds: [],
    profileId: SEED_PROFILES.VISITANTE,
    status: 'Ativo',
    lastAccess: '2026-07-27 10:02:11',
    language: 'en-US',
    preferredTheme: 'light',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=maria'
  }
];

const MODULE_LIST = [
  'Orquestra IDE',
  'Deployment',
  'Objetos',
  'Templates',
  'Componentes Gráficos',
  'Designer de Telas',
  'Runtime',
  'Banco de Dados',
  'Simulador',
  'Alarmes',
  'Histórico',
  'Faceplates',
  'Fluxogramas',
  'OMM',
  'KPI Dashboard',
  'Operations Center',
  'Quality Management',
  'Event Engine',
  'OPC Browser',
  'Property Browser'
];

const buildInitialPermissions = (): SecurityPermissionConfig[] => {
  const configs: SecurityPermissionConfig[] = [];

  // Seed para Perfil Administrador (Tudo Permitido)
  const adminMatrix: PermissionMatrix = {};
  MODULE_LIST.forEach((mod) => {
    adminMatrix[mod] = {
      Visualizar: 'Permitido',
      Criar: 'Permitido',
      Editar: 'Permitido',
      Excluir: 'Permitido',
      Importar: 'Permitido',
      Exportar: 'Permitido',
      Executar: 'Permitido',
      Configurar: 'Permitido',
      Administrar: 'Permitido'
    };
  });
  configs.push({
    id: 'perm-admin',
    targetType: 'profile',
    targetId: SEED_PROFILES.ADMIN,
    matrix: adminMatrix
  });

  // Seed para Perfil Engenharia (Tudo Permitido, exceto Administrar em alguns módulos)
  const engMatrix: PermissionMatrix = {};
  MODULE_LIST.forEach((mod) => {
    engMatrix[mod] = {
      Visualizar: 'Permitido',
      Criar: 'Permitido',
      Editar: 'Permitido',
      Excluir: 'Permitido',
      Importar: 'Permitido',
      Exportar: 'Permitido',
      Executar: 'Permitido',
      Configurar: 'Permitido',
      Administrar: mod === 'Orquestra IDE' || mod === 'Banco de Dados' ? 'Negado' : 'Herdeiro'
    };
  });
  configs.push({
    id: 'perm-eng',
    targetType: 'profile',
    targetId: SEED_PROFILES.ENGENHARIA,
    matrix: engMatrix
  });

  // Seed para Perfil Operador (Permitido Visualizar/Executar/Alarmes, Negado Criar/Editar em IDE/Templates)
  const opMatrix: PermissionMatrix = {};
  MODULE_LIST.forEach((mod) => {
    const isRuntimeOrAlarm = ['Runtime', 'Alarmes', 'Simulador', 'KPI Dashboard', 'Operations Center'].includes(mod);
    opMatrix[mod] = {
      Visualizar: 'Permitido',
      Criar: isRuntimeOrAlarm ? 'Permitido' : 'Negado',
      Editar: isRuntimeOrAlarm ? 'Permitido' : 'Negado',
      Excluir: 'Negado',
      Importar: 'Negado',
      Exportar: 'Permitido',
      Executar: 'Permitido',
      Configurar: 'Herdeiro',
      Administrar: 'Negado'
    };
  });
  configs.push({
    id: 'perm-op',
    targetType: 'profile',
    targetId: SEED_PROFILES.OPERADOR,
    matrix: opMatrix
  });

  // Seed para Visitante (Somente Visualização)
  const visMatrix: PermissionMatrix = {};
  MODULE_LIST.forEach((mod) => {
    visMatrix[mod] = {
      Visualizar: 'Permitido',
      Criar: 'Negado',
      Editar: 'Negado',
      Excluir: 'Negado',
      Importar: 'Negado',
      Exportar: 'Negado',
      Executar: 'Negado',
      Configurar: 'Negado',
      Administrar: 'Negado'
    };
  });
  configs.push({
    id: 'perm-vis',
    targetType: 'profile',
    targetId: SEED_PROFILES.VISITANTE,
    matrix: visMatrix
  });

  return configs;
};

const DEFAULT_AUDITS: SecurityAuditLog[] = [
  { id: 'audit-1', timestamp: '2026-07-27 08:00:00', user: 'Sistema', action: 'Criar', target: 'Perfis de Acesso', description: 'Perfis iniciais semeados no banco de dados (Administrador, Engenharia, Operador, Visitante).' },
  { id: 'audit-2', timestamp: '2026-07-27 08:00:00', user: 'Sistema', action: 'Criar', target: 'Grupos Organizacionais', description: 'Grupos iniciais semeados no banco de dados (Engenharia, Operação).' },
  { id: 'audit-3', timestamp: '2026-07-27 08:00:02', user: 'Sistema', action: 'Criar', target: 'Matriz de Permissões', description: 'Políticas e matrizes padrão vinculadas aos perfis criados.' },
  { id: 'audit-4', timestamp: '2026-07-27 08:05:00', user: 'Sistema', action: 'Criar', target: 'Usuários', description: 'Carga inicial de usuários ativos e inativos efetuada com sucesso.' }
];

// Helper functions for loading data
const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const saveToStorage = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const useSecurityStore = create<SecurityStore>()(
  immer((set, get) => {
    // Check if seeded
    const isSeeded = localStorage.getItem('archestra_security_seeded') === 'true';

    // If not seeded, write initial data to localStorage
    if (!isSeeded) {
      saveToStorage(STORAGE_KEYS.SECURITY_USERS, DEFAULT_USERS);
      saveToStorage(STORAGE_KEYS.SECURITY_GROUPS, DEFAULT_GROUPS);
      saveToStorage(STORAGE_KEYS.SECURITY_PROFILES, DEFAULT_PROFILES);
      saveToStorage(STORAGE_KEYS.SECURITY_ROLES, DEFAULT_ROLES);
      saveToStorage(STORAGE_KEYS.SECURITY_PERMISSION_CONFIGS, buildInitialPermissions());
      saveToStorage(STORAGE_KEYS.SECURITY_AUDIT_LOGS, DEFAULT_AUDITS);
      localStorage.setItem('archestra_security_seeded', 'true');
    }

    return {
      users: loadFromStorage(STORAGE_KEYS.SECURITY_USERS, DEFAULT_USERS),
      groups: loadFromStorage(STORAGE_KEYS.SECURITY_GROUPS, DEFAULT_GROUPS),
      profiles: loadFromStorage(STORAGE_KEYS.SECURITY_PROFILES, DEFAULT_PROFILES),
      roles: loadFromStorage(STORAGE_KEYS.SECURITY_ROLES, DEFAULT_ROLES),
      permissionConfigs: loadFromStorage(STORAGE_KEYS.SECURITY_PERMISSION_CONFIGS, []),
      auditLogs: loadFromStorage(STORAGE_KEYS.SECURITY_AUDIT_LOGS, DEFAULT_AUDITS),

      addAuditLog: (action, target, description) => set((state) => {
        const newLog: SecurityAuditLog = {
          id: `audit-${uuidv4()}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          user: 'Bruno Kappi', // Responsável simulado
          action,
          target,
          description
        };
        state.auditLogs.unshift(newLog);
        saveToStorage(STORAGE_KEYS.SECURITY_AUDIT_LOGS, state.auditLogs);
      }),

      addUser: (user) => set((state) => {
        const newUser: SecurityUser = {
          id: `user-${uuidv4()}`,
          lastAccess: '-',
          ...user
        };
        state.users.push(newUser);
        saveToStorage(STORAGE_KEYS.SECURITY_USERS, state.users);

        // Track in Audit
        const logMsg = `Usuário ${newUser.name} (${newUser.login}) cadastrado com perfil ${state.profiles.find(p => p.id === newUser.profileId)?.name || 'Desconhecido'}.`;
        get().addAuditLog('Criar', `Usuário: ${newUser.name}`, logMsg);
      }),

      updateUser: (id, userUpdate) => set((state) => {
        const idx = state.users.findIndex(u => u.id === id);
        if (idx !== -1) {
          const original = state.users[idx];
          state.users[idx] = { ...original, ...userUpdate };
          saveToStorage(STORAGE_KEYS.SECURITY_USERS, state.users);

          // Track in Audit
          const logMsg = `Usuário ${original.name} alterado. Campos modificados: ${Object.keys(userUpdate).join(', ')}.`;
          get().addAuditLog('Editar', `Usuário: ${original.name}`, logMsg);
        }
      }),

      deleteUser: (id) => set((state) => {
        const original = state.users.find(u => u.id === id);
        if (original) {
          state.users = state.users.filter(u => u.id !== id);
          saveToStorage(STORAGE_KEYS.SECURITY_USERS, state.users);

          // Track in Audit
          get().addAuditLog('Excluir', `Usuário: ${original.name}`, `Usuário ${original.name} removido do sistema.`);
        }
      }),

      addGroup: (group) => set((state) => {
        const newGroup: SecurityGroup = {
          id: `group-${uuidv4()}`,
          ...group
        };
        state.groups.push(newGroup);
        saveToStorage(STORAGE_KEYS.SECURITY_GROUPS, state.groups);

        get().addAuditLog('Criar', `Grupo: ${newGroup.name}`, `Grupo organizacional '${newGroup.name}' criado.`);
      }),

      updateGroup: (id, groupUpdate) => set((state) => {
        const idx = state.groups.findIndex(g => g.id === id);
        if (idx !== -1) {
          const original = state.groups[idx];
          state.groups[idx] = { ...original, ...groupUpdate };
          saveToStorage(STORAGE_KEYS.SECURITY_GROUPS, state.groups);

          get().addAuditLog('Editar', `Grupo: ${original.name}`, `Grupo '${original.name}' atualizado.`);
        }
      }),

      deleteGroup: (id) => set((state) => {
        const original = state.groups.find(g => g.id === id);
        if (original) {
          state.groups = state.groups.filter(g => g.id !== id);
          saveToStorage(STORAGE_KEYS.SECURITY_GROUPS, state.groups);

          // Clean up group assignments from users
          state.users.forEach((u) => {
            if (u.groupIds.includes(id)) {
              u.groupIds = u.groupIds.filter(gid => gid !== id);
            }
          });
          saveToStorage(STORAGE_KEYS.SECURITY_USERS, state.users);

          get().addAuditLog('Excluir', `Grupo: ${original.name}`, `Grupo '${original.name}' removido. Usuários desassociados.`);
        }
      }),

      addProfile: (profile) => set((state) => {
        const newProfile: SecurityProfile = {
          id: `profile-${uuidv4()}`,
          ...profile
        };
        state.profiles.push(newProfile);
        saveToStorage(STORAGE_KEYS.SECURITY_PROFILES, state.profiles);

        get().addAuditLog('Criar', `Perfil: ${newProfile.name}`, `Perfil de acesso '${newProfile.name}' cadastrado.`);
      }),

      updateProfile: (id, profileUpdate) => set((state) => {
        const idx = state.profiles.findIndex(p => p.id === id);
        if (idx !== -1) {
          const original = state.profiles[idx];
          state.profiles[idx] = { ...original, ...profileUpdate };
          saveToStorage(STORAGE_KEYS.SECURITY_PROFILES, state.profiles);

          get().addAuditLog('Editar', `Perfil: ${original.name}`, `Perfil '${original.name}' atualizado.`);
        }
      }),

      deleteProfile: (id) => set((state) => {
        const original = state.profiles.find(p => p.id === id);
        if (original) {
          state.profiles = state.profiles.filter(p => p.id !== id);
          saveToStorage(STORAGE_KEYS.SECURITY_PROFILES, state.profiles);

          // Clean up profile assignments from users (fall back to visitors or empty)
          state.users.forEach((u) => {
            if (u.profileId === id) {
              u.profileId = '';
            }
          });
          saveToStorage(STORAGE_KEYS.SECURITY_USERS, state.users);

          get().addAuditLog('Excluir', `Perfil: ${original.name}`, `Perfil de acesso '${original.name}' removido.`);
        }
      }),

      addRole: (role) => set((state) => {
        const newRole: SecurityRole = {
          id: `role-${uuidv4()}`,
          ...role
        };
        state.roles.push(newRole);
        saveToStorage(STORAGE_KEYS.SECURITY_ROLES, state.roles);

        get().addAuditLog('Criar', `Função: ${newRole.name}`, `Função/Cargo organizacional '${newRole.name}' cadastrado.`);
      }),

      updateRole: (id, roleUpdate) => set((state) => {
        const idx = state.roles.findIndex(r => r.id === id);
        if (idx !== -1) {
          const original = state.roles[idx];
          state.roles[idx] = { ...original, ...roleUpdate };
          saveToStorage(STORAGE_KEYS.SECURITY_ROLES, state.roles);

          get().addAuditLog('Editar', `Função: ${original.name}`, `Função '${original.name}' atualizado.`);
        }
      }),

      deleteRole: (id) => set((state) => {
        const original = state.roles.find(r => r.id === id);
        if (original) {
          state.roles = state.roles.filter(r => r.id !== id);
          saveToStorage(STORAGE_KEYS.SECURITY_ROLES, state.roles);

          get().addAuditLog('Excluir', `Função: ${original.name}`, `Função '${original.name}' removida.`);
        }
      }),

      savePermissionConfig: (targetType, targetId, matrix) => set((state) => {
        const idx = state.permissionConfigs.findIndex(pc => pc.targetType === targetType && pc.targetId === targetId);

        let targetName = targetId;
        if (targetType === 'profile') {
          targetName = state.profiles.find(p => p.id === targetId)?.name || targetId;
        } else if (targetType === 'group') {
          targetName = state.groups.find(g => g.id === targetId)?.name || targetId;
        } else if (targetType === 'user') {
          targetName = state.users.find(u => u.id === targetId)?.name || targetId;
        }

        if (idx !== -1) {
          state.permissionConfigs[idx].matrix = matrix;
        } else {
          state.permissionConfigs.push({
            id: `perm-${uuidv4()}`,
            targetType,
            targetId,
            matrix
          });
        }
        saveToStorage(STORAGE_KEYS.SECURITY_PERMISSION_CONFIGS, state.permissionConfigs);

        get().addAuditLog('Configuração', `Permissões: ${targetName}`, `Matriz de permissões alterada para o alvo (${targetType}): ${targetName}.`);
      }),

      clearAllData: () => set((state) => {
        // Reset to initial seed state
        state.users = DEFAULT_USERS;
        state.groups = DEFAULT_GROUPS;
        state.profiles = DEFAULT_PROFILES;
        state.roles = DEFAULT_ROLES;
        state.permissionConfigs = buildInitialPermissions();
        state.auditLogs = DEFAULT_AUDITS;

        saveToStorage(STORAGE_KEYS.SECURITY_USERS, DEFAULT_USERS);
        saveToStorage(STORAGE_KEYS.SECURITY_GROUPS, DEFAULT_GROUPS);
        saveToStorage(STORAGE_KEYS.SECURITY_PROFILES, DEFAULT_PROFILES);
        saveToStorage(STORAGE_KEYS.SECURITY_ROLES, DEFAULT_ROLES);
        saveToStorage(STORAGE_KEYS.SECURITY_PERMISSION_CONFIGS, buildInitialPermissions());
        saveToStorage(STORAGE_KEYS.SECURITY_AUDIT_LOGS, DEFAULT_AUDITS);
        localStorage.setItem('archestra_security_seeded', 'true');

        const newLog: SecurityAuditLog = {
          id: `audit-${uuidv4()}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          user: 'Bruno Kappi',
          action: 'Configuração',
          target: 'Limpeza de Dados',
          description: 'Módulo de Usuários e Segurança redefinido para a carga inicial padrão (Seeded).'
        };
        state.auditLogs.unshift(newLog);
        saveToStorage(STORAGE_KEYS.SECURITY_AUDIT_LOGS, state.auditLogs);
      })
    };
  })
);
