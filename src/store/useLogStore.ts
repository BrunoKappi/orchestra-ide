import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import { STORAGE_KEYS } from '../repository/storageKey';
import type { AuditLog } from '../types/log';

interface LogStoreState {
  logs: AuditLog[];
  isInitialized: boolean;
}

interface LogStoreActions {
  init: () => void;
  addLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  resetMockLogs: () => void;
}

type LogStore = LogStoreState & LogStoreActions;

// Helper storage functions
const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const saveToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err: any) {
    if ((err.name === 'QuotaExceededError' || err.code === 22) && Array.isArray(value) && value.length > 10) {
      console.warn(`[Storage] Quota excedida para ${key}. Removendo os 20% mais antigos.`);
      const newLength = Math.floor(value.length * 0.8);
      const pruned = value.slice(0, newLength);
      // Salva de forma recursiva com tamanho reduzido
      saveToStorage(key, pruned);
    } else {
      console.error('Storage save error:', err);
    }
  }
};

// Seed initial audit log history
const getMockLogs = (): AuditLog[] => {
  return [
    {
      id: 'log-seed-1',
      timestamp: '2026-08-01 08:00:00',
      user: 'Sistema',
      module: 'Segurança',
      entity: 'Perfis de Acesso',
      operation: 'CREATE',
      action: 'Perfis Semeados',
      description: 'Perfis iniciais semeados no banco de dados (Administrador, Engenharia, Operador, Visitante).',
      severity: 'Sucesso',
      result: 'Sucesso',
      origin: 'sistema',
    },
    {
      id: 'log-seed-2',
      timestamp: '2026-08-01 08:00:00',
      user: 'Sistema',
      module: 'Segurança',
      entity: 'Grupos Organizacionais',
      operation: 'CREATE',
      action: 'Grupos Semeados',
      description: 'Grupos iniciais semeados no banco de dados (Engenharia, Operação).',
      severity: 'Sucesso',
      result: 'Sucesso',
      origin: 'sistema',
    },
    {
      id: 'log-seed-3',
      timestamp: '2026-08-01 08:00:02',
      user: 'Sistema',
      module: 'Segurança',
      entity: 'Matriz de Permissões',
      operation: 'CREATE',
      action: 'Políticas Configuradas',
      description: 'Políticas e matrizes padrão vinculadas aos perfis criados.',
      severity: 'Sucesso',
      result: 'Sucesso',
      origin: 'sistema',
    },
    {
      id: 'log-seed-4',
      timestamp: '2026-08-01 08:05:00',
      user: 'Sistema',
      module: 'Segurança',
      entity: 'Usuários',
      operation: 'CREATE',
      action: 'Usuários Semeados',
      description: 'Carga inicial de usuários ativos e inativos efetuada com sucesso.',
      severity: 'Sucesso',
      result: 'Sucesso',
      origin: 'sistema',
    },
    {
      id: 'log-seed-5',
      timestamp: '2026-08-01 09:10:00',
      user: 'Sistema',
      module: 'Orquestra',
      entity: 'Template',
      operation: 'CREATE',
      action: 'Template de Tanque Criado',
      description: 'Template base para equipamentos de tancagem industrial (Tank Template) semeado com sucesso.',
      severity: 'Sucesso',
      result: 'Sucesso',
      origin: 'sistema',
      targetId: 'tpl-tank',
    },
    {
      id: 'log-seed-6',
      timestamp: '2026-08-01 09:30:00',
      user: 'Sistema',
      module: 'Orquestra',
      entity: 'Objeto',
      operation: 'CREATE',
      action: 'Tanque TK-301 Criado',
      description: 'Instância de tanque TK-301 do tipo Atmospheric Tank criada com sucesso na Unidade 300.',
      severity: 'Sucesso',
      result: 'Sucesso',
      origin: 'sistema',
      targetId: 'tank-tk-301',
    },
    {
      id: 'log-seed-7',
      timestamp: '2026-08-02 14:22:15',
      user: 'moliveira',
      module: 'Orquestra',
      entity: 'Propriedade',
      operation: 'UPDATE',
      action: 'Propriedade Configurada',
      description: 'Configuração da propriedade Level no TK-301 alterada.',
      severity: 'Informação',
      result: 'Sucesso',
      targetId: 'tank-tk-301',
      previousValue: '{"defaultValue": "0"}',
      newValue: '{"defaultValue": "75"}',
      origin: 'manual',
    },
    {
      id: 'log-seed-8',
      timestamp: '2026-08-03 11:05:40',
      user: 'moliveira',
      module: 'Grid Designer',
      entity: 'Tela',
      operation: 'CREATE',
      action: 'Tela Principal Criada',
      description: 'Criação da tela sinóptica principal de visualização de tanques no Grid Dashboard.',
      severity: 'Sucesso',
      result: 'Sucesso',
      origin: 'manual',
    },
    {
      id: 'log-seed-9',
      timestamp: '2026-08-03 16:45:00',
      user: 'rmendes',
      module: 'Fluxogramas',
      entity: 'Fluxograma',
      operation: 'CREATE',
      action: 'Fluxograma de Segurança Criado',
      description: 'Criação do fluxograma lógico "Verificação de Sobrenível TK-301" para monitoramento de intertravamentos.',
      severity: 'Sucesso',
      result: 'Sucesso',
      origin: 'manual',
    },
    {
      id: 'log-seed-10',
      timestamp: '2026-08-04 10:15:30',
      user: 'moliveira',
      module: 'Connectivity Studio',
      entity: 'Conexão',
      operation: 'CREATE',
      action: 'Data Source OPC Conectado',
      description: 'Configuração de conexão bem sucedida com o servidor local OPC-UA na porta 4840.',
      severity: 'Sucesso',
      result: 'Sucesso',
      origin: 'manual',
    },
    {
      id: 'log-seed-11',
      timestamp: '2026-08-05 13:00:00',
      user: 'rmendes',
      module: 'Alarmes',
      entity: 'Alarme',
      operation: 'CONFIGURE',
      action: 'Configuração de Alarme Modificada',
      description: 'Limites de segurança HH do TK-301 configurados pelo engenheiro.',
      severity: 'Aviso',
      result: 'Sucesso',
      targetId: 'tank-tk-301',
      previousValue: '{"HHLevelLimit": "95"}',
      newValue: '{"HHLevelLimit": "90"}',
      origin: 'manual',
    },
    {
      id: 'log-seed-12',
      timestamp: '2026-08-06 07:30:00',
      user: 'asouza',
      module: 'OMM',
      entity: 'Ordem',
      operation: 'CREATE',
      action: 'Ordem ORD-2026-001 Criada',
      description: 'Ordem de movimentação ORD-2026-001 de Nafta criada na supervisão.',
      severity: 'Sucesso',
      result: 'Sucesso',
      targetId: 'ord-1',
      origin: 'manual',
    },
    {
      id: 'log-seed-13',
      timestamp: '2026-08-06 08:00:00',
      user: 'csilva',
      module: 'OMM',
      entity: 'Movimento',
      operation: 'ACTIVATE',
      action: 'Movimento MOV-0001 Ativado',
      description: 'Movimento de Nafta TK-301 para TK-302 ativado e em execução.',
      severity: 'Sucesso',
      result: 'Sucesso',
      targetId: 'mov-0001',
      origin: 'manual',
    },
    {
      id: 'log-seed-14',
      timestamp: '2026-08-06 08:00:05',
      user: 'rmendes',
      module: 'Simulador',
      entity: 'Simulador',
      operation: 'EXECUTE',
      action: 'Simulador Iniciado',
      description: 'Motor do simulador global iniciado pelo engenheiro de automação.',
      severity: 'Sucesso',
      result: 'Sucesso',
      origin: 'manual',
    },
    {
      id: 'log-seed-15',
      timestamp: '2026-08-07 10:11:42',
      user: 'jlima',
      module: 'Runtime',
      entity: 'Propriedade',
      operation: 'UPDATE',
      action: 'Alteração Manual de Valor',
      description: 'Operadora alterou manualmente o valor de Nível do TK-301 no painel.',
      severity: 'Informação',
      result: 'Sucesso',
      targetId: 'tank-tk-301',
      previousValue: '75.0',
      newValue: '77.5',
      origin: 'manual',
    },
    {
      id: 'log-seed-16',
      timestamp: '2026-08-07 10:12:00',
      user: 'jlima',
      module: 'Alarmes',
      entity: 'Alarme',
      operation: 'ACKNOWLEDGE',
      action: 'Alarme Reconhecido',
      description: 'Reconhecimento manual de alarme de nível HH do tanque TK-301 efetuado no console.',
      severity: 'Sucesso',
      result: 'Sucesso',
      targetId: 'tank-tk-301',
      origin: 'manual',
    },
    {
      id: 'log-seed-17',
      timestamp: '2026-08-08 23:59:59',
      user: 'asouza',
      module: 'Cut-off',
      entity: 'Snapshot',
      operation: 'EXECUTE',
      action: 'Cut-off Executado',
      description: 'Fechamento operacional e snapshot do inventário de nafta diário executado com sucesso.',
      severity: 'Sucesso',
      result: 'Sucesso',
      origin: 'manual',
    },
    {
      id: 'log-seed-18',
      timestamp: '2026-08-09 09:12:35',
      user: 'Bruno Kappi',
      module: 'Segurança',
      entity: 'Usuário',
      operation: 'CREATE',
      action: 'Novo Usuário Criado',
      description: 'Criação do usuário "csilva" (Carlos Silva) pelo administrador de segurança.',
      severity: 'Sucesso',
      result: 'Sucesso',
      origin: 'manual',
    },
    {
      id: 'log-seed-19',
      timestamp: '2026-08-09 10:05:12',
      user: 'csilva',
      module: 'OMM',
      entity: 'Movimento',
      operation: 'ACTIVATE',
      action: 'Tentativa de Ação Bloqueada',
      description: 'Ação Bloqueada: Alinhamento aln-301-302 já em uso por outra transferência ativa.',
      severity: 'Erro',
      result: 'Bloqueado',
      targetId: 'mov-0002',
      origin: 'manual',
    },
    {
      id: 'log-seed-20',
      timestamp: '2026-08-09 11:15:00',
      user: 'rmendes',
      module: 'Orquestra',
      entity: 'Objeto',
      operation: 'UPDATE',
      action: 'Propriedade Configurada',
      description: 'Capacidade do tanque TK-302 alterada para 20000 m³.',
      severity: 'Informação',
      result: 'Sucesso',
      targetId: 'tank-tk-302',
      origin: 'manual',
    },
    {
      id: 'log-seed-21',
      timestamp: '2026-08-09 13:40:22',
      user: 'asouza',
      module: 'OMM',
      entity: 'Movimento',
      operation: 'UPDATE',
      action: 'Vazão Alterada',
      description: 'Vazão de simulação do movimento MOV-0001 alterada para 120 m³/h.',
      severity: 'Sucesso',
      result: 'Sucesso',
      targetId: 'mov-0001',
      origin: 'manual',
    },
    {
      id: 'log-seed-22',
      timestamp: '2026-08-09 15:20:05',
      user: 'rmendes',
      module: 'Alarmes',
      entity: 'Alarme',
      operation: 'CONFIGURE',
      action: 'Limites de Alarme Ajustados',
      description: 'Limite de nível alto (H) do tanque TK-401 configurado em 85%.',
      severity: 'Aviso',
      result: 'Sucesso',
      targetId: 'tank-tk-401',
      origin: 'manual',
    },
    {
      id: 'log-seed-23',
      timestamp: '2026-08-09 18:00:00',
      user: 'Sistema',
      module: 'Segurança',
      entity: 'Sessão',
      operation: 'DELETE',
      action: 'Sessão Expirada',
      description: 'Sessão do usuário moliveira encerrada por inatividade de 30 minutos.',
      severity: 'Informação',
      result: 'Sucesso',
      origin: 'sistema',
    },
    {
      id: 'log-seed-24',
      timestamp: '2026-08-09 22:30:11',
      user: 'Bruno Kappi',
      module: 'Segurança',
      entity: 'Diretiva de Senha',
      operation: 'UPDATE',
      action: 'Diretiva de Complexidade Alterada',
      description: 'Comprimento mínimo de senha alterado para 10 caracteres.',
      severity: 'Sucesso',
      result: 'Sucesso',
      origin: 'manual',
    },
    {
      id: 'log-seed-25',
      timestamp: '2026-08-10 02:00:00',
      user: 'Sistema',
      module: 'Simulador',
      entity: 'Backup',
      operation: 'EXECUTE',
      action: 'Backup Automático Concluído',
      description: 'Backup automático diário do banco de dados simulado executado com sucesso.',
      severity: 'Sucesso',
      result: 'Sucesso',
      origin: 'sistema',
    },
    {
      id: 'log-seed-26',
      timestamp: '2026-08-10 06:12:45',
      user: 'csilva',
      module: 'Connectivity Studio',
      entity: 'Servidor OPC',
      operation: 'UPDATE',
      action: 'Reconexão Realizada',
      description: 'Servidor OPC UA local reconectado após breve perda de comunicação.',
      severity: 'Aviso',
      result: 'Sucesso',
      origin: 'sistema',
    },
    {
      id: 'log-seed-27',
      timestamp: '2026-08-10 07:05:00',
      user: 'jlima',
      module: 'OMM',
      entity: 'Movimento',
      operation: 'ACTIVATE',
      action: 'Movimento MOV-0004 Iniciado',
      description: 'Movimento de Propeno V-401 para V-402 ativado com sucesso.',
      severity: 'Sucesso',
      result: 'Sucesso',
      targetId: 'mov-0004',
      origin: 'manual',
    },
  ];
};

export const useLogStore = create<LogStore>()(
  immer((set, get) => ({
    logs: [],
    isInitialized: false,

    init: () => {
      if (get().isInitialized) return;
      const initialLogs = loadFromStorage<AuditLog[]>(STORAGE_KEYS.LOGS, []);
      if (initialLogs.length === 0) {
        const defaultLogs = getMockLogs();
        saveToStorage(STORAGE_KEYS.LOGS, defaultLogs);
        set((state) => {
          state.logs = defaultLogs;
          state.isInitialized = true;
        });
      } else {
        set((state) => {
          state.logs = initialLogs;
          state.isInitialized = true;
        });
      }
    },

    addLog: (logInput) => {
      // Garante que o histórico de logs/mock seja carregado antes de adicionar novos registros
      get().init();

      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newLog: AuditLog = {
        id: `log-${uuidv4()}`,
        timestamp: nowStr,
        ...logInput,
      };

      set((state) => {
        state.logs.unshift(newLog);
        if (state.logs.length > 200) {
          state.logs = state.logs.slice(0, 200);
        }
        saveToStorage(STORAGE_KEYS.LOGS, state.logs);
      });
    },

    clearLogs: () => {
      set((state) => {
        state.logs = [];
        saveToStorage(STORAGE_KEYS.LOGS, []);
      });
    },

    resetMockLogs: () => {
      const defaultLogs = getMockLogs();
      set((state) => {
        state.logs = defaultLogs;
        saveToStorage(STORAGE_KEYS.LOGS, defaultLogs);
      });
    },
  }))
);
