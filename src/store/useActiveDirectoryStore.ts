import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';

export interface ADConnectionConfig {
  connectionName: string;
  status: 'Ativa' | 'Inativa';
  server: string;
  ldapPort: number;
  ldapsPort: number;
  domain: string;
  baseDn: string;
  serviceUser: string;
  servicePassword?: string;
  timeout: number;
  useSslTls: boolean;
  trustedCert: string;
  authMethod: 'Simple' | 'SASL/GSSAPI' | 'SASL/DIGEST-MD5';
  ldapVersion: 'v2' | 'v3';
  description: string;
}

export interface ADUser {
  guid: string;
  sid: string;
  name: string;
  login: string;
  displayName: string;
  email: string;
  role: string;
  department: string;
  company: string;
  phone: string;
  accountStatus: 'Ativa' | 'Inativa' | 'Bloqueada';
  lastLogon: string;
  dn: string;
  ou: string;
  memberOf: string[]; // Group names
  avatarUrl: string;
}

export interface ADGroup {
  guid: string;
  name: string;
  description: string;
  dn: string;
  type: 'Security' | 'Distribution';
  memberCount: number;
}

export interface ADOU {
  guid: string;
  name: string;
  description: string;
  dn: string;
}

export interface ADComputer {
  guid: string;
  name: string;
  operatingSystem: string;
  dn: string;
  status: 'Ativo' | 'Inativo';
  description: string;
}

export interface ADGroupMapping {
  adGroupName: string;
  profileId: string; // ID of existing RBAC profile (e.g. profile-admin, profile-eng, etc.)
}

export interface ADSyncLog {
  id: string;
  date: string;
  time: string;
  responsible: string;
  operation: string;
  processedCount: number;
  durationMs: number;
  status: 'Sucesso' | 'Falha';
  message: string;
}

export interface ADAdvancedSettings {
  ldapFilter: string;
  syncedAttributes: string;
  syncFrequency: string;
  excludedOUs: string;
  transformLoginLower: boolean;
  normalizeNames: boolean;
  updateGroupsOnLogin: boolean;
  conflictResolution: 'Sobrescrever Local' | 'Manter Local' | 'Mesclar';
}

export interface ADStats {
  syncedUsersCount: number;
  groupsFoundCount: number;
  ousCount: number;
  lastSyncTime: string;
  syncDuration: string;
  linkedProfilesCount: number;
  successRate: string;
}

interface ActiveDirectoryState {
  config: ADConnectionConfig;
  users: ADUser[];
  groups: ADGroup[];
  ous: ADOU[];
  computers: ADComputer[];
  mappings: ADGroupMapping[];
  logs: ADSyncLog[];
  advanced: ADAdvancedSettings;
  stats: ADStats;
  isSyncing: boolean;
  syncProgress: number;
  syncLogMsg: string;
}

interface ActiveDirectoryActions {
  updateConfig: (config: Partial<ADConnectionConfig>) => void;
  restoreDefaults: () => void;
  testConnection: () => Promise<{ success: boolean; message: string }>;
  saveMappings: (mappings: ADGroupMapping[]) => void;
  updateAdvanced: (settings: Partial<ADAdvancedSettings>) => void;
  triggerSync: (options: {
    syncUsers: boolean;
    syncGroups: boolean;
    syncOUs: boolean;
    updateExisting: boolean;
    importNew: boolean;
    disableRemoved: boolean;
    isManual: boolean;
  }) => Promise<void>;
  clearLogs: () => void;
}

type ActiveDirectoryStore = ActiveDirectoryState & ActiveDirectoryActions;

const STORAGE_KEYS = {
  AD_CONFIG: 'archestra_ad_config_v1',
  AD_USERS: 'archestra_ad_users_v1',
  AD_GROUPS: 'archestra_ad_groups_v1',
  AD_OUS: 'archestra_ad_ous_v1',
  AD_COMPUTERS: 'archestra_ad_computers_v1',
  AD_MAPPINGS: 'archestra_ad_mappings_v1',
  AD_LOGS: 'archestra_ad_logs_v1',
  AD_ADVANCED: 'archestra_ad_advanced_v1',
  AD_STATS: 'archestra_ad_stats_v1',
};

const DEFAULT_CONFIG: ADConnectionConfig = {
  connectionName: 'Active Directory Serrano Corp',
  status: 'Ativa',
  server: 'dc01.serrano.corp',
  ldapPort: 389,
  ldapsPort: 636,
  domain: 'serrano.corp',
  baseDn: 'DC=serrano,DC=corp',
  serviceUser: 'serrano\\svc-orchestra',
  servicePassword: 'ServicePassword123',
  timeout: 30,
  useSslTls: true,
  trustedCert: '-----BEGIN CERTIFICATE-----\nMIIFdzCCBF+gAwIBAgIQDfsfSDFjkl345234JKF823h4JKF89sdjfKLDhjkfHJKsdf\nMIIFdzCCBF+gAwIBAgIQDfsfSDFjkl345234JKF823h4JKF89sdjfKLDhjkfHJKsdf\n-----END CERTIFICATE-----',
  authMethod: 'Simple',
  ldapVersion: 'v3',
  description: 'Integração de produção com o Active Directory principal da empresa para autenticação unificada e provisionamento RBAC.',
};

const DEFAULT_USERS: ADUser[] = [
  {
    guid: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    sid: 'S-1-5-21-36238143-2124132213-298312093-1102',
    name: 'Bruno Kappi',
    login: 'bruno.kappi',
    displayName: 'Bruno Kappi (Engenharia)',
    email: 'bruno.kappi@serrano.corp',
    role: 'Engenheiro de Automação',
    department: 'Automação Industrial',
    company: 'Serrano S/A',
    phone: '+55 (11) 98888-1111',
    accountStatus: 'Ativa',
    lastLogon: '2026-07-29 09:12:00',
    dn: 'CN=Bruno Kappi,OU=Automacao,DC=serrano,DC=corp',
    ou: 'Automação',
    memberOf: ['Automação', 'Engenharia', 'TI'],
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=bruno',
  },
  {
    guid: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    sid: 'S-1-5-21-36238143-2124132213-298312093-1103',
    name: 'Carlos Souza',
    login: 'carlos.souza',
    displayName: 'Carlos Souza (Operação)',
    email: 'carlos.souza@serrano.corp',
    role: 'Operador de Painel',
    department: 'Operação de Utilidades',
    company: 'Serrano S/A',
    phone: '+55 (11) 98888-2222',
    accountStatus: 'Ativa',
    lastLogon: '2026-07-29 08:30:00',
    dn: 'CN=Carlos Souza,OU=Operacao,DC=serrano,DC=corp',
    ou: 'Operação',
    memberOf: ['Operação', 'Produção'],
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=carlos',
  },
  {
    guid: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
    sid: 'S-1-5-21-36238143-2124132213-298312093-1104',
    name: 'Ana Martins',
    login: 'ana.martins',
    displayName: 'Ana Martins (Supervisão)',
    email: 'ana.martins@serrano.corp',
    role: 'Supervisor de Planta',
    department: 'Supervisão de Utilidades',
    company: 'Serrano S/A',
    phone: '+55 (11) 98888-3333',
    accountStatus: 'Ativa',
    lastLogon: '2026-07-29 09:05:00',
    dn: 'CN=Ana Martins,OU=Diretoria,DC=serrano,DC=corp',
    ou: 'Diretoria',
    memberOf: ['Supervisores', 'TI'],
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=ana',
  },
  {
    guid: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a',
    sid: 'S-1-5-21-36238143-2124132213-298312093-1105',
    name: 'João Ferreira',
    login: 'joao.ferreira',
    displayName: 'João Ferreira (Manutenção)',
    email: 'joao.ferreira@serrano.corp',
    role: 'Técnico de Manutenção',
    department: 'Manutenção Elétrica',
    company: 'Serrano S/A',
    phone: '+55 (11) 98888-4444',
    accountStatus: 'Inativa',
    lastLogon: '2026-07-20 14:00:00',
    dn: 'CN=João Ferreira,OU=Operacao,DC=serrano,DC=corp',
    ou: 'Operação',
    memberOf: ['Manutenção', 'Produção'],
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=joao',
  },
  {
    guid: 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b',
    sid: 'S-1-5-21-36238143-2124132213-298312093-1106',
    name: 'Maria Oliveira',
    login: 'maria.oliveira',
    displayName: 'Maria Oliveira (Visitante)',
    email: 'maria.oliveira@serrano.corp',
    role: 'Visitante Corporativo',
    department: 'Administração Geral',
    company: 'Serrano S/A',
    phone: '+55 (11) 98888-5555',
    accountStatus: 'Ativa',
    lastLogon: '2026-07-29 08:00:00',
    dn: 'CN=Maria Oliveira,OU=Diretoria,DC=serrano,DC=corp',
    ou: 'Diretoria',
    memberOf: ['Visitantes'],
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=maria',
  },
  {
    guid: 'f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c',
    sid: 'S-1-5-21-36238143-2124132213-298312093-1107',
    name: 'Roberto Silva',
    login: 'roberto.silva',
    displayName: 'Roberto Silva (TI)',
    email: 'roberto.silva@serrano.corp',
    role: 'Administrador de TI',
    department: 'Tecnologia da Informação',
    company: 'Serrano S/A',
    phone: '+55 (11) 97777-1111',
    accountStatus: 'Ativa',
    lastLogon: '2026-07-29 09:25:00',
    dn: 'CN=Roberto Silva,OU=TI,DC=serrano,DC=corp',
    ou: 'TI',
    memberOf: ['TI', 'Administradores'],
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=roberto',
  }
];

const DEFAULT_GROUPS: ADGroup[] = [
  { guid: 'g1', name: 'Administradores', description: 'Administradores do Domínio com privilégios elevados', dn: 'CN=Administradores,OU=Groups,DC=serrano,DC=corp', type: 'Security', memberCount: 2 },
  { guid: 'g2', name: 'Engenharia', description: 'Grupo de Engenharia de Automação e Processos', dn: 'CN=Engenharia,OU=Groups,DC=serrano,DC=corp', type: 'Security', memberCount: 4 },
  { guid: 'g3', name: 'Produção', description: 'Equipe de produção industrial e manufatura', dn: 'CN=Producao,OU=Groups,DC=serrano,DC=corp', type: 'Security', memberCount: 15 },
  { guid: 'g4', name: 'Manutenção', description: 'Grupo de instrumentistas e mecânicos de manutenção', dn: 'CN=Manutencao,OU=Groups,DC=serrano,DC=corp', type: 'Security', memberCount: 6 },
  { guid: 'g5', name: 'Operação', description: 'Operadores de Painel SCADA e sala de controle', dn: 'CN=Operacao,OU=Groups,DC=serrano,DC=corp', type: 'Security', memberCount: 12 },
  { guid: 'g6', name: 'Laboratório', description: 'Técnicos químicos e analistas de qualidade de laboratório', dn: 'CN=Laboratorio,OU=Groups,DC=serrano,DC=corp', type: 'Security', memberCount: 3 },
  { guid: 'g7', name: 'TI', description: 'Suporte, infraestrutura e administração de sistemas TI', dn: 'CN=TI,OU=Groups,DC=serrano,DC=corp', type: 'Security', memberCount: 5 },
  { guid: 'g8', name: 'Automação', description: 'Engenheiros e desenvolvedores de sistemas de controle SCADA/DCS', dn: 'CN=Automacao,OU=Groups,DC=serrano,DC=corp', type: 'Security', memberCount: 8 },
  { guid: 'g9', name: 'Supervisores', description: 'Supervisores de produção, manutenção e utilidades', dn: 'CN=Supervisores,OU=Groups,DC=serrano,DC=corp', type: 'Security', memberCount: 4 },
  { guid: 'g10', name: 'Visitantes', description: 'Acessos temporários, estagiários e auditores externos', dn: 'CN=Visitantes,OU=Groups,DC=serrano,DC=corp', type: 'Security', memberCount: 10 }
];

const DEFAULT_OUS: ADOU[] = [
  { guid: 'ou1', name: 'TI', description: 'Unidade Organizacional da equipe de TI', dn: 'OU=TI,DC=serrano,DC=corp' },
  { guid: 'ou2', name: 'Automação', description: 'Unidade Organizacional da equipe de Automação', dn: 'OU=Automacao,DC=serrano,DC=corp' },
  { guid: 'ou3', name: 'Operação', description: 'Unidade Organizacional das equipes de Operações e Processo', dn: 'OU=Operacao,DC=serrano,DC=corp' },
  { guid: 'ou4', name: 'Engenharia', description: 'Unidade Organizacional da equipe de Engenharia', dn: 'OU=Engenharia,DC=serrano,DC=corp' },
  { guid: 'ou5', name: 'Diretoria', description: 'Diretores e gerências corporativas', dn: 'OU=Diretoria,DC=serrano,DC=corp' }
];

const DEFAULT_COMPUTERS: ADComputer[] = [
  { guid: 'c1', name: 'WS-ENG-01', operatingSystem: 'Windows 11 Enterprise', dn: 'CN=WS-ENG-01,CN=Computers,DC=serrano,DC=corp', status: 'Ativo', description: 'Estação de Engenharia de Automação principal' },
  { guid: 'c2', name: 'SCADA-SRV-01', operatingSystem: 'Windows Server 2022 Datacenter', dn: 'CN=SCADA-SRV-01,CN=Computers,DC=serrano,DC=corp', status: 'Ativo', description: 'Servidor SCADA Central Primário' },
  { guid: 'c3', name: 'PLC-GATEWAY-02', operatingSystem: 'Windows 10 IoT Enterprise', dn: 'CN=PLC-GATEWAY-02,CN=Computers,DC=serrano,DC=corp', status: 'Ativo', description: 'Gateway OPC UA de aquisição de dados do campo' }
];

const DEFAULT_MAPPINGS: ADGroupMapping[] = [
  { adGroupName: 'Administradores', profileId: 'profile-admin' },
  { adGroupName: 'TI', profileId: 'profile-admin' },
  { adGroupName: 'Engenharia', profileId: 'profile-eng' },
  { adGroupName: 'Automação', profileId: 'profile-eng' },
  { adGroupName: 'Operação', profileId: 'profile-op' },
  { adGroupName: 'Produção', profileId: 'profile-op' },
  { adGroupName: 'Supervisores', profileId: 'profile-eng' },
  { adGroupName: 'Visitantes', profileId: 'profile-vis' }
];

const DEFAULT_ADVANCED: ADAdvancedSettings = {
  ldapFilter: '(&(objectClass=user)(sAMAccountName=*))',
  syncedAttributes: 'cn,mail,sAMAccountName,title,department,company,telephoneNumber,thumbnailPhoto',
  syncFrequency: 'A cada 1 hora',
  excludedOUs: 'OU=Temporary,OU=Disabled,DC=serrano,DC=corp',
  transformLoginLower: true,
  normalizeNames: true,
  updateGroupsOnLogin: true,
  conflictResolution: 'Sobrescrever Local',
};

const DEFAULT_LOGS: ADSyncLog[] = [
  {
    id: 'l1',
    date: '2026-07-29',
    time: '08:00:00',
    responsible: 'Sistema (Agendador)',
    operation: 'Sincronização Automática Completa',
    processedCount: 31,
    durationMs: 1450,
    status: 'Sucesso',
    message: 'Sincronização periódica concluída com sucesso. 6 usuários atualizados, 10 grupos importados, 5 OUs processadas.'
  }
];

const DEFAULT_STATS: ADStats = {
  syncedUsersCount: 6,
  groupsFoundCount: 10,
  ousCount: 5,
  lastSyncTime: '2026-07-29 08:00:00',
  syncDuration: '1.45s',
  linkedProfilesCount: 8,
  successRate: '100%'
};

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

export const useActiveDirectoryStore = create<ActiveDirectoryStore>()(
  immer((set, get) => {
    // Seed Check
    const isSeeded = localStorage.getItem('archestra_ad_seeded') === 'true';

    if (!isSeeded) {
      saveToStorage(STORAGE_KEYS.AD_CONFIG, DEFAULT_CONFIG);
      saveToStorage(STORAGE_KEYS.AD_USERS, DEFAULT_USERS);
      saveToStorage(STORAGE_KEYS.AD_GROUPS, DEFAULT_GROUPS);
      saveToStorage(STORAGE_KEYS.AD_OUS, DEFAULT_OUS);
      saveToStorage(STORAGE_KEYS.AD_COMPUTERS, DEFAULT_COMPUTERS);
      saveToStorage(STORAGE_KEYS.AD_MAPPINGS, DEFAULT_MAPPINGS);
      saveToStorage(STORAGE_KEYS.AD_LOGS, DEFAULT_LOGS);
      saveToStorage(STORAGE_KEYS.AD_ADVANCED, DEFAULT_ADVANCED);
      saveToStorage(STORAGE_KEYS.AD_STATS, DEFAULT_STATS);
      localStorage.setItem('archestra_ad_seeded', 'true');
    }

    return {
      config: loadFromStorage(STORAGE_KEYS.AD_CONFIG, DEFAULT_CONFIG),
      users: loadFromStorage(STORAGE_KEYS.AD_USERS, DEFAULT_USERS),
      groups: loadFromStorage(STORAGE_KEYS.AD_GROUPS, DEFAULT_GROUPS),
      ous: loadFromStorage(STORAGE_KEYS.AD_OUS, DEFAULT_OUS),
      computers: loadFromStorage(STORAGE_KEYS.AD_COMPUTERS, DEFAULT_COMPUTERS),
      mappings: loadFromStorage(STORAGE_KEYS.AD_MAPPINGS, DEFAULT_MAPPINGS),
      logs: loadFromStorage(STORAGE_KEYS.AD_LOGS, DEFAULT_LOGS),
      advanced: loadFromStorage(STORAGE_KEYS.AD_ADVANCED, DEFAULT_ADVANCED),
      stats: loadFromStorage(STORAGE_KEYS.AD_STATS, DEFAULT_STATS),

      isSyncing: false,
      syncProgress: 0,
      syncLogMsg: '',

      updateConfig: (configUpdate) => set((state) => {
        state.config = { ...state.config, ...configUpdate };
        saveToStorage(STORAGE_KEYS.AD_CONFIG, state.config);
      }),

      restoreDefaults: () => set((state) => {
        state.config = DEFAULT_CONFIG;
        state.advanced = DEFAULT_ADVANCED;
        state.mappings = DEFAULT_MAPPINGS;
        saveToStorage(STORAGE_KEYS.AD_CONFIG, DEFAULT_CONFIG);
        saveToStorage(STORAGE_KEYS.AD_ADVANCED, DEFAULT_ADVANCED);
        saveToStorage(STORAGE_KEYS.AD_MAPPINGS, DEFAULT_MAPPINGS);
      }),

      testConnection: async () => {
        const config = get().config;
        return new Promise<{ success: boolean; message: string }>((resolve) => {
          setTimeout(() => {
            if (!config.server || !config.domain || !config.serviceUser || !config.servicePassword) {
              resolve({
                success: false,
                message: 'Falha na validação: Certifique-se de que os campos Servidor, Domínio, Usuário de Serviço e Senha estão preenchidos.'
              });
            } else {
              resolve({
                success: true,
                message: `Conexão bem-sucedida com o Servidor ${config.server} na porta ${config.useSslTls ? config.ldapsPort : config.ldapPort}. Domínio: ${config.domain}`
              });
            }
          }, 1200); // 1.2s simulation timeout
        });
      },

      saveMappings: (newMappings) => set((state) => {
        state.mappings = newMappings;
        saveToStorage(STORAGE_KEYS.AD_MAPPINGS, newMappings);
      }),

      updateAdvanced: (advancedUpdate) => set((state) => {
        state.advanced = { ...state.advanced, ...advancedUpdate };
        saveToStorage(STORAGE_KEYS.AD_ADVANCED, state.advanced);
      }),

      triggerSync: async (options) => {
        set((state) => {
          state.isSyncing = true;
          state.syncProgress = 5;
          state.syncLogMsg = 'Iniciando handshake LDAP...';
        });

        // Simula progressos e mensagens
        const steps = [
          { p: 15, msg: 'Conectando ao Domain Controller (LDAPS)...' },
          { p: 30, msg: `Pesquisando na base DN: ${get().config.baseDn}...` },
          { p: 45, msg: options.syncOUs ? 'Sincronizando Unidades Organizacionais...' : 'Ignorando OUs...' },
          { p: 60, msg: options.syncGroups ? 'Lendo e vinculando Grupos de Segurança...' : 'Ignorando Grupos...' },
          { p: 75, msg: options.syncUsers ? 'Buscando novos usuários e atualizando existentes...' : 'Ignorando Usuários...' },
          { p: 90, msg: 'Resolvendo políticas de conflito e mapeamentos RBAC...' },
          { p: 100, msg: 'Sincronização concluída!' }
        ];

        for (const step of steps) {
          await new Promise((r) => setTimeout(r, 600));
          set((state) => {
            state.syncProgress = step.p;
            state.syncLogMsg = step.msg;
          });
        }

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0];

        const durationMs = 3800 + Math.floor(Math.random() * 500);

        set((state) => {
          state.isSyncing = false;
          state.syncProgress = 0;
          state.syncLogMsg = '';

          // Create new simulated log
          const newLog: ADSyncLog = {
            id: `log-${uuidv4()}`,
            date: dateStr,
            time: timeStr,
            responsible: options.isManual ? 'Bruno Kappi' : 'Sistema (Agendador)',
            operation: options.isManual ? 'Sincronização Manual Completa' : 'Sincronização Automática Completa',
            processedCount: (options.syncUsers ? state.users.length : 0) + (options.syncGroups ? state.groups.length : 0) + (options.syncOUs ? state.ous.length : 0) + state.computers.length,
            durationMs: durationMs,
            status: 'Sucesso',
            message: `Sincronização simulada executada com sucesso. Filtro LDAP: "${state.advanced.ldapFilter}". Resolução de conflitos: "${state.advanced.conflictResolution}".`
          };

          state.logs.unshift(newLog);
          saveToStorage(STORAGE_KEYS.AD_LOGS, state.logs);

          // Update stats
          state.stats = {
            syncedUsersCount: options.syncUsers ? state.users.length : state.stats.syncedUsersCount,
            groupsFoundCount: options.syncGroups ? state.groups.length : state.stats.groupsFoundCount,
            ousCount: options.syncOUs ? state.ous.length : state.stats.ousCount,
            lastSyncTime: `${dateStr} ${timeStr}`,
            syncDuration: `${(durationMs / 1000).toFixed(2)}s`,
            linkedProfilesCount: state.mappings.length,
            successRate: '100%'
          };
          saveToStorage(STORAGE_KEYS.AD_STATS, state.stats);
        });
      },

      clearLogs: () => set((state) => {
        state.logs = [];
        saveToStorage(STORAGE_KEYS.AD_LOGS, []);
      })
    };
  })
);
