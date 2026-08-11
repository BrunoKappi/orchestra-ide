import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import type { ProcessAlertRule, ProcessAlertOccur, ProcessAlertSeverity, ProcessAlertDefinition } from '../types/processAlert';
import { processAlertRepo } from '../repository/ProcessAlertRepository';
import { useLogStore } from './useLogStore';

interface ProcessAlertStoreState {
  rules: ProcessAlertRule[];
  definitions: ProcessAlertDefinition[];
  occurrences: ProcessAlertOccur[];
  activeToasts: Array<{
    id: string;
    occurId: string;
    code: string;
    name: string;
    description: string;
    severity: ProcessAlertSeverity;
    colorHighlight: string;
    activatedAt: string;
    isTest?: boolean;
  }>;
  isInitialized: boolean;
}

interface ProcessAlertStoreActions {
  init: () => void;
  refresh: () => void;
  acknowledgeAlert: (id: string, operatorName: string) => void;
  acknowledgeMultiple: (ids: string[], operatorName: string) => void;
  toggleRule: (id: string) => void;
  updateRule: (id: string, updates: Partial<ProcessAlertRule>) => void;
  
  // Actions for Alert Definitions (Configured alerts)
  createDefinition: (data: Partial<ProcessAlertDefinition>) => void;
  updateDefinition: (id: string, data: Partial<ProcessAlertDefinition>) => void;
  deleteDefinition: (id: string) => void;
  toggleDefinition: (id: string) => void;

  triggerTestAlert: (ruleId: string) => void;
  addToast: (occ: ProcessAlertOccur) => void;
  removeToast: (id: string) => void;
  resetToDefaults: () => void;
  clearAll: () => void;
}

type ProcessAlertStore = ProcessAlertStoreState & ProcessAlertStoreActions;

export const DEFAULT_RULES: ProcessAlertRule[] = [
  {
    id: 'rule-delayed-start',
    code: 'PR-OMM-01',
    name: 'Início Atrasado de Movimentação',
    type: 'movement_delayed_start',
    description: 'Alerta quando uma movimentação autorizada (Issued) excede o horário planejado para iniciar.',
    severity: 'attention',
    enabled: true,
    colorHighlight: '#f59e0b',
    soundFile: 'double-beep',
    soundVolume: 70,
    repeatIntervalSec: 120,
    params: { startDelayMin: 5 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rule-delayed-end',
    code: 'PR-OMM-02',
    name: 'Término Atrasado de Movimentação',
    type: 'movement_delayed_end',
    description: 'Alerta quando uma transferência ativa excede o horário de conclusão planejado.',
    severity: 'important',
    enabled: true,
    colorHighlight: '#ec4899',
    soundFile: 'chime',
    soundVolume: 80,
    repeatIntervalSec: 180,
    params: { endDelayMin: 10 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rule-near-goal',
    code: 'PR-OMM-03',
    name: 'Transferência Próxima da Meta',
    type: 'movement_near_goal',
    description: 'Avisa quando a transferência em andamento atinge o percentual configurado do volume planejado (meta).',
    severity: 'info',
    enabled: true,
    colorHighlight: '#3b82f6',
    soundFile: 'single-beep',
    soundVolume: 50,
    repeatIntervalSec: 0,
    params: { progressPctThreshold: 90 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rule-goal-reached',
    code: 'PR-OMM-04',
    name: 'Meta Operacional Atingida',
    type: 'movement_goal_reached',
    description: 'Notifica que as condições e volume planejados para a movimentação foram alcançados.',
    severity: 'info',
    enabled: true,
    colorHighlight: '#10b981',
    soundFile: 'success-chime',
    soundVolume: 60,
    repeatIntervalSec: 0,
    params: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rule-physical-completion-pending',
    code: 'PR-OMM-05',
    name: 'Conclusão Física Pendente',
    type: 'movement_physical_completion_pending',
    description: 'Sinaliza que o volume planejado foi transferido, mas a movimentação ainda precisa ser formalmente encerrada no sistema.',
    severity: 'attention',
    enabled: true,
    colorHighlight: '#8b5cf6',
    soundFile: 'double-beep',
    soundVolume: 60,
    repeatIntervalSec: 300,
    params: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rule-movement-deviation',
    code: 'PR-OMM-06',
    name: 'Desvio de Comportamento na Movimentação',
    type: 'movement_deviation',
    description: 'Alerta se a vazão real diferir de forma relevante da vazão planejada ou se não houver variação no tanque em movimento ativo.',
    severity: 'important',
    enabled: true,
    colorHighlight: '#f97316',
    soundFile: 'chime',
    soundVolume: 80,
    repeatIntervalSec: 60,
    params: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rule-transfer-divergence',
    code: 'PR-OMM-07',
    name: 'Divergência de Transferência',
    type: 'movement_divergence',
    description: 'Identifica divergência (desbalanço) entre a massa/volume retirado da origem e o recebido no destino.',
    severity: 'critical',
    enabled: true,
    colorHighlight: '#ef4444',
    soundFile: 'industrial-warning',
    soundVolume: 90,
    repeatIntervalSec: 60,
    params: { divergenceTolerancePct: 5 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rule-process-ttl',
    code: 'PR-PRED-01',
    name: 'Alerta Preditivo TTL (Time to Limits)',
    type: 'process_ttl',
    description: 'Calcula o tempo aproximado para atingir os limites operacionais do tanque baseado na tendência e taxa de variação.',
    severity: 'critical',
    enabled: true,
    colorHighlight: '#dc2626',
    soundFile: 'industrial-warning',
    soundVolume: 90,
    repeatIntervalSec: 60,
    params: { ttlThresholdMin: 30 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rule-unexpected-evolution',
    code: 'PR-PRED-02',
    name: 'Evolução Inesperada do Processo',
    type: 'process_unexpected_evolution',
    description: 'Detecta alteração de nível em tanques sem que haja movimentação ativa autorizada.',
    severity: 'attention',
    enabled: true,
    colorHighlight: '#f59e0b',
    soundFile: 'single-beep',
    soundVolume: 70,
    repeatIntervalSec: 120,
    params: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_DEFINITIONS: ProcessAlertDefinition[] = [
  {
    id: 'def-delayed-start',
    code: 'AL-OMM-01',
    name: 'Início Atrasado — Olefinas',
    enabled: true,
    ruleId: 'rule-delayed-start',
    areaId: 'area-500',
    targetObjectId: null,
    targetMovementId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'def-delayed-end',
    code: 'AL-OMM-02',
    name: 'Atraso de Término — Nafta',
    enabled: true,
    ruleId: 'rule-delayed-end',
    areaId: 'area-300',
    targetObjectId: null,
    targetMovementId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'def-near-goal',
    code: 'AL-OMM-03',
    name: 'Progresso da Meta — Nafta',
    enabled: true,
    ruleId: 'rule-near-goal',
    areaId: 'area-300',
    targetObjectId: null,
    targetMovementId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'def-goal-reached',
    code: 'AL-OMM-04',
    name: 'Meta Atingida — Eteno',
    enabled: true,
    ruleId: 'rule-goal-reached',
    areaId: 'area-500',
    targetObjectId: null,
    targetMovementId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'def-physical-completion',
    code: 'AL-OMM-05',
    name: 'Encerramento Pendente — Olefinas',
    enabled: true,
    ruleId: 'rule-physical-completion-pending',
    areaId: 'area-500',
    targetObjectId: null,
    targetMovementId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'def-deviation',
    code: 'AL-OMM-06',
    name: 'Desvio de Vazão — Intermediários',
    enabled: true,
    ruleId: 'rule-movement-deviation',
    areaId: 'area-400',
    targetObjectId: null,
    targetMovementId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'def-divergence',
    code: 'AL-OMM-07',
    name: 'Divergência de Transferência — Olefinas',
    enabled: true,
    ruleId: 'rule-transfer-divergence',
    areaId: 'area-500',
    targetObjectId: null,
    targetMovementId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'def-ttl',
    code: 'AL-PRED-01',
    name: 'Tempo Limite (TTL) — Matéria-Prima',
    enabled: true,
    ruleId: 'rule-process-ttl',
    areaId: 'area-300',
    targetObjectId: null,
    targetMovementId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'def-unexpected',
    code: 'AL-PRED-02',
    name: 'Evolução Inesperada — Nafta',
    enabled: true,
    ruleId: 'rule-unexpected-evolution',
    areaId: 'area-300',
    targetObjectId: null,
    targetMovementId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const useProcessAlertStore = create<ProcessAlertStore>()(
  immer((set, get) => ({
    rules: [],
    definitions: [],
    occurrences: [],
    activeToasts: [],
    isInitialized: false,

    init: () => {
      if (get().isInitialized) return;

      let storedRules = processAlertRepo.getRules();
      if (storedRules.length === 0) {
        processAlertRepo.saveRules(DEFAULT_RULES);
        storedRules = DEFAULT_RULES;
      }

      let storedDefs = processAlertRepo.getDefinitions();
      if (storedDefs.length === 0) {
        processAlertRepo.saveDefinitions(DEFAULT_DEFINITIONS);
        storedDefs = DEFAULT_DEFINITIONS;
      }

      let storedOccs = processAlertRepo.getOccurrences();
      if (storedOccs.length === 0) {
        const mockOccs = getMockOccurrences();
        processAlertRepo.saveOccurrences(mockOccs);
        storedOccs = mockOccs;
      }

      set((state) => {
        state.rules = storedRules;
        state.definitions = storedDefs;
        state.occurrences = storedOccs;
        state.isInitialized = true;
      });
    },

    refresh: () => {
      const storedRules = processAlertRepo.getRules();
      const storedDefs = processAlertRepo.getDefinitions();
      const storedOccs = processAlertRepo.getOccurrences();
      set((state) => {
        state.rules = storedRules;
        state.definitions = storedDefs;
        state.occurrences = storedOccs;
      });
    },

    acknowledgeAlert: (id, operatorName) => {
      const all = processAlertRepo.getOccurrences();
      const index = all.findIndex((o) => o.id === id);
      if (index >= 0 && all[index].status === 'active_unacknowledged') {
        const updated = {
          ...all[index],
          status: 'active_acknowledged' as const,
          acknowledgedAt: new Date().toISOString(),
          acknowledgedBy: operatorName,
        };
        all[index] = updated;
        processAlertRepo.saveOccurrences(all);

        useLogStore.getState().addLog({
          user: operatorName,
          module: 'Alertas de Processo',
          entity: 'Alerta',
          operation: 'ACKNOWLEDGE',
          action: 'Alerta Reconhecido',
          description: `Alerta "${updated.name}" (${updated.code}) reconhecido pelo operador.`,
          severity: updated.severity === 'critical' ? 'Aviso' : 'Informação',
          result: 'Sucesso',
          origin: 'manual',
          targetId: updated.id,
        });

        get().refresh();
      }
    },

    acknowledgeMultiple: (ids, operatorName) => {
      const all = processAlertRepo.getOccurrences();
      let changed = false;

      ids.forEach((id) => {
        const index = all.findIndex((o) => o.id === id);
        if (index >= 0 && all[index].status === 'active_unacknowledged') {
          const updated = {
            ...all[index],
            status: 'active_acknowledged' as const,
            acknowledgedAt: new Date().toISOString(),
            acknowledgedBy: operatorName,
          };
          all[index] = updated;
          changed = true;

          useLogStore.getState().addLog({
            user: operatorName,
            module: 'Alertas de Processo',
            entity: 'Alerta',
            operation: 'ACKNOWLEDGE',
            action: 'Alerta Reconhecido',
            description: `Alerta "${updated.name}" (${updated.code}) reconhecido na ação em lote.`,
            severity: updated.severity === 'critical' ? 'Aviso' : 'Informação',
            result: 'Sucesso',
            origin: 'manual',
            targetId: updated.id,
          });
        }
      });

      if (changed) {
        processAlertRepo.saveOccurrences(all);
        get().refresh();
      }
    },

    toggleRule: (id) => {
      const rules = processAlertRepo.getRules();
      const index = rules.findIndex((r) => r.id === id);
      if (index >= 0) {
        rules[index].enabled = !rules[index].enabled;
        rules[index].updatedAt = new Date().toISOString();
        processAlertRepo.saveRules(rules);
        get().refresh();

        useLogStore.getState().addLog({
          user: 'Sistema',
          module: 'Alertas de Processo',
          entity: 'Configuração',
          operation: 'UPDATE',
          action: 'Regra de Alerta Trocada',
          description: `Regra de alerta "${rules[index].name}" foi ${rules[index].enabled ? 'habilitada' : 'desabilitada'}.`,
          severity: 'Informação',
          result: 'Sucesso',
          origin: 'sistema',
          targetId: id,
        });
      }
    },

    updateRule: (id, updates) => {
      const rules = processAlertRepo.getRules();
      const index = rules.findIndex((r) => r.id === id);
      if (index >= 0) {
        rules[index] = {
          ...rules[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        processAlertRepo.saveRules(rules);
        get().refresh();

        useLogStore.getState().addLog({
          user: 'Sistema',
          module: 'Alertas de Processo',
          entity: 'Configuração',
          operation: 'UPDATE',
          action: 'Regra de Alerta Atualizada',
          description: `Parâmetros da regra de alerta "${rules[index].name}" foram modificados.`,
          severity: 'Informação',
          result: 'Sucesso',
          origin: 'sistema',
          targetId: id,
        });
      }
    },

    createDefinition: (data) => {
      const defs = processAlertRepo.getDefinitions();
      const newDef: ProcessAlertDefinition = {
        id: `def-${uuidv4()}`,
        code: data.code || `AL-${Math.floor(100 + Math.random() * 900)}`,
        name: data.name || 'Alerta Sem Nome',
        enabled: data.enabled ?? true,
        ruleId: data.ruleId || '',
        areaId: data.areaId || '',
        targetObjectId: data.targetObjectId || null,
        targetMovementId: data.targetMovementId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      defs.push(newDef);
      processAlertRepo.saveDefinitions(defs);
      get().refresh();

      useLogStore.getState().addLog({
        user: 'Sistema',
        module: 'Alertas de Processo',
        entity: 'Configuração',
        operation: 'CREATE',
        action: 'Alerta Configurado Criado',
        description: `Definição de alerta "${newDef.name}" (${newDef.code}) criada com sucesso.`,
        severity: 'Informação',
        result: 'Sucesso',
        origin: 'sistema',
        targetId: newDef.id,
      });
    },

    updateDefinition: (id, updates) => {
      const defs = processAlertRepo.getDefinitions();
      const index = defs.findIndex((d) => d.id === id);
      if (index >= 0) {
        defs[index] = {
          ...defs[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        processAlertRepo.saveDefinitions(defs);
        get().refresh();

        useLogStore.getState().addLog({
          user: 'Sistema',
          module: 'Alertas de Processo',
          entity: 'Configuração',
          operation: 'UPDATE',
          action: 'Alerta Configurado Atualizado',
          description: `Definição de alerta "${defs[index].name}" (${defs[index].code}) atualizada.`,
          severity: 'Informação',
          result: 'Sucesso',
          origin: 'sistema',
          targetId: id,
        });
      }
    },

    deleteDefinition: (id) => {
      const defs = processAlertRepo.getDefinitions();
      const filtered = defs.filter((d) => d.id !== id);
      if (filtered.length < defs.length) {
        const deleted = defs.find((d) => d.id === id);
        processAlertRepo.saveDefinitions(filtered);
        get().refresh();

        useLogStore.getState().addLog({
          user: 'Sistema',
          module: 'Alertas de Processo',
          entity: 'Configuração',
          operation: 'DELETE',
          action: 'Alerta Configurado Excluído',
          description: `Definição de alerta "${deleted?.name}" (${deleted?.code}) foi excluída.`,
          severity: 'Informação',
          result: 'Sucesso',
          origin: 'sistema',
          targetId: id,
        });
      }
    },

    toggleDefinition: (id) => {
      const defs = processAlertRepo.getDefinitions();
      const index = defs.findIndex((d) => d.id === id);
      if (index >= 0) {
        defs[index].enabled = !defs[index].enabled;
        defs[index].updatedAt = new Date().toISOString();
        processAlertRepo.saveDefinitions(defs);
        get().refresh();

        useLogStore.getState().addLog({
          user: 'Sistema',
          module: 'Alertas de Processo',
          entity: 'Configuração',
          operation: 'UPDATE',
          action: 'Alerta Configurado Alterado',
          description: `Definição de alerta "${defs[index].name}" (${defs[index].code}) foi ${defs[index].enabled ? 'habilitada' : 'desabilitada'}.`,
          severity: 'Informação',
          result: 'Sucesso',
          origin: 'sistema',
          targetId: id,
        });
      }
    },

    triggerTestAlert: (ruleId) => {
      const rules = get().rules;
      const rule = rules.find((r) => r.id === ruleId);
      if (!rule) return;

      const testOccur: ProcessAlertOccur = {
        id: `test-${uuidv4()}`,
        ruleId: rule.id,
        definitionId: null,
        code: `${rule.code}-TEST`,
        name: `${rule.name} [TESTE]`,
        type: rule.type,
        description: `Disparo de teste manual para validação da regra: ${rule.description}`,
        severity: rule.severity,
        responsibleAreas: ['area-300', 'area-400', 'area-500'],
        relatedObjectId: 'tank-tk-301',
        relatedObjectName: 'TK-301',
        relatedMovementId: 'mov-0001',
        relatedMovementNumber: 'MOV-0001',
        conditionSummary: 'DISPARO DE TESTE MANUAL',
        currentValue: '95%',
        limitValue: '90%',
        status: 'active_unacknowledged',
        activatedAt: new Date().toISOString(),
        acknowledgedAt: null,
        acknowledgedBy: null,
        resolvedAt: null,
        colorHighlight: rule.colorHighlight,
        soundFile: rule.soundFile,
        soundVolume: rule.soundVolume,
        isTest: true,
        lastNotifiedAt: new Date().toISOString(),
      };

      set((state) => {
        state.occurrences.push(testOccur);
      });
      processAlertRepo.saveOccurrence(testOccur);
      get().refresh();

      get().addToast(testOccur);
      playSynthesizedSound(rule.soundFile, rule.soundVolume / 100);
    },

    addToast: (occ) => {
      const toastId = `toast-${uuidv4()}`;
      set((state) => {
        state.activeToasts.push({
          id: toastId,
          occurId: occ.id,
          code: occ.code,
          name: occ.name,
          description: occ.description,
          severity: occ.severity,
          colorHighlight: occ.colorHighlight,
          activatedAt: occ.activatedAt,
          isTest: occ.isTest,
        });
      });

      setTimeout(() => {
        get().removeToast(toastId);
      }, 5000);
    },

    removeToast: (id) => {
      set((state) => {
        state.activeToasts = state.activeToasts.filter((t) => t.id !== id);
      });
    },

    resetToDefaults: () => {
      processAlertRepo.saveRules(DEFAULT_RULES);
      processAlertRepo.saveDefinitions(DEFAULT_DEFINITIONS);
      const mockOccs = getMockOccurrences();
      processAlertRepo.saveOccurrences(mockOccs);
      
      set((state) => {
        state.rules = DEFAULT_RULES;
        state.definitions = DEFAULT_DEFINITIONS;
        state.occurrences = mockOccs;
      });

      useLogStore.getState().addLog({
        user: 'Sistema',
        module: 'Alertas de Processo',
        entity: 'Banco de Dados',
        operation: 'UPDATE',
        action: 'Mocks de Alertas Restaurados',
        description: 'Mapeamento de regras de alertas operacionais e histórico redefinido para o padrão da POC.',
        severity: 'Informação',
        result: 'Sucesso',
        origin: 'sistema',
      });
    },

    clearAll: () => {
      processAlertRepo.clear();
      set((state) => {
        state.occurrences = [];
        state.definitions = [];
        state.activeToasts = [];
      });
    },
  }))
);

export function playSynthesizedSound(soundType: string, volume: number = 0.5) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume * 0.15, ctx.currentTime);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    if (soundType === 'single-beep') {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (soundType === 'double-beep') {
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.connect(gainNode);
      osc1.start(now);
      osc1.stop(now + 0.1);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.2);
      osc2.connect(gainNode);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.3);
    } else if (soundType === 'chime') {
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        
        const node = ctx.createGain();
        node.gain.setValueAtTime(volume * 0.05, now + idx * 0.08);
        node.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.6);
        
        osc.connect(node);
        node.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.6);
      });
    } else if (soundType === 'success-chime') {
      const notes = [440, 554, 659, 880];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        const node = ctx.createGain();
        node.gain.setValueAtTime(volume * 0.08, now + idx * 0.06);
        node.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.4);

        osc.connect(node);
        node.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.4);
      });
    } else if (soundType === 'industrial-warning') {
      const duration = 0.8;
      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(550, now);
      osc1.frequency.linearRampToValueAtTime(650, now + 0.2);
      osc1.frequency.linearRampToValueAtTime(550, now + 0.4);
      osc1.frequency.linearRampToValueAtTime(650, now + 0.6);
      osc1.frequency.linearRampToValueAtTime(550, now + 0.8);

      const node = ctx.createGain();
      node.gain.setValueAtTime(volume * 0.04, now);
      node.gain.linearRampToValueAtTime(volume * 0.04, now + 0.7);
      node.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc1.connect(node);
      node.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + duration);
    }
  } catch (err) {
    console.error('Audio synthesizer error:', err);
  }
}

function getMockOccurrences(): ProcessAlertOccur[] {
  const n = Date.now();
  const dateStr = (msOffset: number) => new Date(n + msOffset).toISOString();

  return [
    {
      id: 'mock-occ-1',
      ruleId: 'rule-process-ttl',
      definitionId: 'def-ttl',
      code: 'AL-PRED-01',
      name: 'Tempo Limite (TTL) — Matéria-Prima',
      type: 'process_ttl',
      description: 'Tanque de recebimento TK-302 se aproximando de limite operacional alto (TTL = 22 min).',
      severity: 'critical',
      responsibleAreas: ['area-300'],
      relatedObjectId: 'tank-tk-302',
      relatedObjectName: 'TK-302',
      relatedMovementId: 'mov-0001',
      relatedMovementNumber: 'MOV-0001',
      conditionSummary: 'TTL < 30 min (Alto)',
      currentValue: '22 min',
      limitValue: '30 min',
      status: 'active_unacknowledged',
      activatedAt: dateStr(-120000),
      acknowledgedAt: null,
      acknowledgedBy: null,
      resolvedAt: null,
      colorHighlight: '#dc2626',
      soundFile: 'industrial-warning',
      soundVolume: 90,
      isTest: false,
      lastNotifiedAt: dateStr(-120000),
    },
    {
      id: 'mock-occ-2',
      ruleId: 'rule-delayed-start',
      definitionId: 'def-delayed-start',
      code: 'AL-OMM-01',
      name: 'Início Atrasado — Olefinas',
      type: 'movement_delayed_start',
      description: 'Movimentação MOV-0004 de propeno atrasou mais de 5 minutos para iniciar.',
      severity: 'attention',
      responsibleAreas: ['area-500'],
      relatedObjectId: 'tank-v-401',
      relatedObjectName: 'V-401',
      relatedMovementId: 'mov-0004',
      relatedMovementNumber: 'MOV-0004',
      conditionSummary: 'tempo > plannedStartAt + 5 min',
      currentValue: '8 min de atraso',
      limitValue: '5 min',
      status: 'active_acknowledged',
      activatedAt: dateStr(-300000),
      acknowledgedAt: dateStr(-180000),
      acknowledgedBy: 'Operador Bruno',
      resolvedAt: null,
      colorHighlight: '#f59e0b',
      soundFile: 'double-beep',
      soundVolume: 70,
      isTest: false,
      lastNotifiedAt: dateStr(-300000),
    },
    {
      id: 'mock-occ-3',
      ruleId: 'rule-goal-reached',
      definitionId: 'def-goal-reached',
      code: 'AL-OMM-04',
      name: 'Meta Atingida — Eteno',
      type: 'movement_goal_reached',
      description: 'Transferência de eteno do V-301 para o V-302 atingiu a meta planejada.',
      severity: 'info',
      responsibleAreas: ['area-500'],
      relatedObjectId: 'tank-v-302',
      relatedObjectName: 'V-302',
      relatedMovementId: 'mov-0003',
      relatedMovementNumber: 'MOV-0003',
      conditionSummary: 'status === Completed',
      currentValue: '100% de volume',
      limitValue: '100%',
      status: 'resolved',
      activatedAt: dateStr(-3600000 * 2),
      acknowledgedAt: null,
      acknowledgedBy: null,
      resolvedAt: dateStr(-3600000 * 2 + 1000),
      colorHighlight: '#10b981',
      soundFile: 'success-chime',
      soundVolume: 60,
      isTest: false,
      lastNotifiedAt: dateStr(-3600000 * 2),
    },
    {
      id: 'mock-occ-4',
      ruleId: 'rule-unexpected-evolution',
      definitionId: 'def-unexpected',
      code: 'AL-PRED-02',
      name: 'Evolução Inesperada — Nafta',
      type: 'process_unexpected_evolution',
      description: 'Variação não programada de nível no tanque de nafta TK-301.',
      severity: 'attention',
      responsibleAreas: ['area-300'],
      relatedObjectId: 'tank-tk-301',
      relatedObjectName: 'TK-301',
      relatedMovementId: null,
      relatedMovementNumber: null,
      conditionSummary: 'Variação de volume sem movimento ativo',
      currentValue: '+12 m³/h',
      limitValue: '0 m³/h',
      status: 'resolved',
      activatedAt: dateStr(-3600000 * 24),
      acknowledgedAt: dateStr(-3600000 * 24 + 60000),
      acknowledgedBy: 'Supervisor Carlos',
      resolvedAt: dateStr(-3600000 * 23),
      colorHighlight: '#f59e0b',
      soundFile: 'single-beep',
      soundVolume: 70,
      isTest: false,
      lastNotifiedAt: dateStr(-3600000 * 24),
    },
  ];
}
