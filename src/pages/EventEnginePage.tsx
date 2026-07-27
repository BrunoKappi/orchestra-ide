import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Activity, 
  Plus, 
  Trash2, 
  Clock, 
  Search, 
  Settings, 
  Edit, 
  Play, 
  X, 
  Save,
  Grid
} from 'lucide-react';
import { useObjectModelStore } from '../store/useObjectModelStore';
import { eventRepo } from '../repository/EventRepository';
import type { EventConfig, ConditionNode, LeafCondition, LogicalCondition, EventAction, SeverityType } from '../types/event';
import { v4 as uuidv4 } from 'uuid';
import { inheritanceService } from '../services/InheritanceService';
import { HeaderNavigation } from '../components/navigation/HeaderNavigation';

export function EventEnginePage() {
  const { objects, activeEvents, refreshData, evaluateEvents } = useObjectModelStore();
  
  const [activeTab, setActiveTab] = useState<'monitor' | 'builder'>('monitor');
  const [eventConfigs, setEventConfigs] = useState<EventConfig[]>([]);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [searchLogQuery, setSearchLogQuery] = useState('');
  
  // Selected config for editing (null means creating new)
  const [editingEvent, setEditingEvent] = useState<EventConfig | null>(null);

  // Load configs & history on mount
  useEffect(() => {
    refreshData();
    setEventConfigs(eventRepo.getAllConfigs());
    setHistoryLogs(eventRepo.getHistory());
  }, [refreshData]);

  // Poll for real-time monitoring updates
  useEffect(() => {
    const timer = setInterval(() => {
      // Trigger evaluation in the store to update live duration/state
      evaluateEvents();
      setHistoryLogs(eventRepo.getHistory());
    }, 1000);
    return () => clearInterval(timer);
  }, [evaluateEvents]);

  const handleSaveEvent = () => {
    if (!editingEvent) return;
    if (!editingEvent.name.trim()) {
      alert('Por favor, info o nome do evento.');
      return;
    }
    eventRepo.saveConfig(editingEvent);
    setEventConfigs(eventRepo.getAllConfigs());
    setEditingEvent(null);
    setActiveTab('monitor');
  };

  const handleCreateNewEvent = () => {
    const newEvent: EventConfig = {
      id: uuidv4(),
      name: 'Novo Evento Inteligente',
      description: 'Descrição do novo evento de negócios.',
      category: 'Processo',
      severity: 'medium',
      priority: 3,
      enabled: true,
      group: 'Padrão',
      responsibleArea: 'Operações',
      observations: '',
      condition: {
        id: uuidv4(),
        type: 'logical',
        operator: 'AND',
        conditions: [
          {
            id: uuidv4(),
            type: 'leaf',
            conditionType: 'property_compare',
            params: {
              objectId: objects[0]?.id || '',
              propertyName: 'Level',
              operator: 'greater',
              compareValue: '80',
            }
          }
        ]
      },
      actions: [
        {
          id: uuidv4(),
          type: 'generate_notification',
          params: {
            message: 'Alerta: Evento inteligente disparado!',
          }
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setEditingEvent(newEvent);
    setActiveTab('builder');
  };

  const handleDeleteEvent = (id: string) => {
    if (confirm('Deseja realmente excluir esta regra de evento?')) {
      eventRepo.deleteConfig(id);
      setEventConfigs(eventRepo.getAllConfigs());
    }
  };

  const handleToggleEventEnabled = (cfg: EventConfig) => {
    const updated = { ...cfg, enabled: !cfg.enabled };
    eventRepo.saveConfig(updated);
    setEventConfigs(eventRepo.getAllConfigs());
  };

  // Helper to resolve all property list from objects
  const allProperties: { objectId: string; objectName: string; propName: string; dataType: string }[] = [];
  objects.forEach((obj) => {
    try {
      const props = inheritanceService.getMergedProperties(obj.id, 'instance');
      props.forEach((p) => {
        allProperties.push({
          objectId: obj.id,
          objectName: obj.name,
          propName: p.name,
          dataType: p.dataType
        });
      });
    } catch (e) {
      // Skip
    }
  });

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <HeaderNavigation />

      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Event Engine</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Geração e processamento de regras industriais complexas</p>
          </div>
        </div>

        <div className="flex gap-2 bg-slate-200/50 dark:bg-slate-950 p-1 rounded-xl border border-slate-300 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('monitor')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'monitor'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Monitor Real-Time</span>
          </button>
          <button
            onClick={() => {
              if (!editingEvent) handleCreateNewEvent();
              setActiveTab('builder');
            }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'builder'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Visual Builder</span>
          </button>
        </div>
      </div>

      {/* Main Workspace content */}
      <div className="flex-1 overflow-hidden flex">
        {activeTab === 'monitor' ? (
          <div className="flex-1 overflow-hidden flex gap-4 p-6">
            {/* Monitor Left: Triggered & Configured Events list */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Painel Operacional</span>
                <button
                  onClick={handleCreateNewEvent}
                  className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs px-3.5 py-1.5 rounded-lg font-semibold transition-all shadow-md shadow-sky-600/10"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nova Regra</span>
                </button>
              </div>

              {/* Grid of rules */}
              <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                {eventConfigs.map((cfg) => {
                  const activeState = activeEvents.find((ae) => ae.id === cfg.id);
                  const isTriggered = activeState?.status === 'triggered';
                  
                  return (
                    <div
                      key={cfg.id}
                      className={`relative flex flex-col gap-3 p-4 rounded-xl border transition-all ${
                        isTriggered
                          ? 'bg-rose-500/5 border-rose-500/30 shadow-lg'
                          : cfg.enabled
                          ? 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700'
                          : 'bg-slate-100/40 dark:bg-slate-950/40 border-slate-200 dark:border-slate-900 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              isTriggered
                                ? 'bg-rose-500 animate-ping'
                                : cfg.enabled
                                ? 'bg-emerald-500'
                                : 'bg-slate-400 dark:bg-slate-700'
                            }`}
                          />
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{cfg.name}</h3>
                        </div>

                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                          <button
                            onClick={() => {
                              setEditingEvent(cfg);
                              setActiveTab('builder');
                            }}
                            className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                            title="Editar Regra"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(cfg.id)}
                            className="p-1 text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 transition-colors"
                            title="Excluir Regra"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{cfg.description}</p>

                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-950/30 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/50">
                        <div>
                          <strong className="text-slate-500 dark:text-slate-400">Categoria:</strong> {cfg.category}
                        </div>
                        <div>
                          <strong className="text-slate-500 dark:text-slate-400">Severidade:</strong>{' '}
                          <span className={`uppercase font-semibold ${
                            cfg.severity === 'critical' ? 'text-rose-600 dark:text-rose-400' :
                            cfg.severity === 'high' ? 'text-amber-600 dark:text-amber-400' :
                            cfg.severity === 'medium' ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-500 dark:text-slate-400'
                          }`}>{cfg.severity}</span>
                        </div>
                        <div>
                          <strong className="text-slate-500 dark:text-slate-400">Grupo:</strong> {cfg.group}
                        </div>
                        <div>
                          <strong className="text-slate-500 dark:text-slate-400">Responsável:</strong> {cfg.responsibleArea}
                        </div>
                      </div>

                      {/* Rule details and action feedback */}
                      {isTriggered && (
                        <div className="mt-1 flex flex-col gap-2 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">ATIVADO</span>
                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                              {((activeState.durationMs || 0) / 1000).toFixed(1)}s
                            </span>
                          </div>
                          <p className="text-[10px] text-rose-600 dark:text-rose-400 italic font-mono truncate">
                            {activeState.satisfiedRuleDescription}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-between items-center mt-1 border-t border-slate-200 dark:border-slate-800 pt-2 text-[10px]">
                        <span className="text-slate-500 font-mono">Prioridade: {cfg.priority}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400">Habilitado</span>
                          <input
                            type="checkbox"
                            checked={cfg.enabled}
                            onChange={() => handleToggleEventEnabled(cfg)}
                            className="w-3.5 h-3.5 accent-sky-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monitor Right: History logs Drawer */}
            <div className="w-96 flex flex-col gap-4 border-l border-slate-200 dark:border-slate-800 pl-4 overflow-hidden shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Logs de Auditoria</span>
                <button
                  onClick={() => {
                    if (confirm('Deseja limpar todos os logs do histórico de eventos?')) {
                      eventRepo.clearHistory();
                      setHistoryLogs([]);
                    }
                  }}
                  className="text-[10px] text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 font-semibold cursor-pointer"
                >
                  Limpar Histórico
                </button>
              </div>

              {/* Search Log Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Pesquisar logs..."
                  value={searchLogQuery}
                  onChange={(e) => setSearchLogQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors text-slate-900 dark:text-white"
                />
              </div>

              {/* History list */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
                {historyLogs
                  .filter((log) => {
                    const q = searchLogQuery.toLowerCase();
                    return (
                      log.eventName.toLowerCase().includes(q) ||
                      log.message.toLowerCase().includes(q) ||
                      (log.details && log.details.toLowerCase().includes(q))
                    );
                  })
                  .map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col gap-1.5 text-[11px]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{log.eventName}</span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                          log.type === 'activation' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' :
                          log.type === 'deactivation' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                          log.type === 'action_execution' ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400' :
                          'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                        }`}>
                          {log.type}
                        </span>
                        <p className="text-slate-600 dark:text-slate-300">{log.message}</p>
                      </div>

                      {log.details && (
                        <pre className="text-[9px] text-slate-500 bg-slate-50 dark:bg-slate-950 p-1.5 rounded overflow-x-auto font-mono max-h-16 border border-slate-100 dark:border-slate-850">
                          {log.details}
                        </pre>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          /* Visual Rule Builder tab */
          <div className="flex-1 overflow-hidden flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between shrink-0">
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  {editingEvent ? 'Configurar Regra de Evento' : 'Criar Nova Regra'}
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{editingEvent?.name || 'Novo Evento'}</h2>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingEvent(null);
                    setActiveTab('monitor');
                  }}
                  className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 text-xs px-4 py-2 rounded-lg font-semibold transition-all border border-slate-200 dark:border-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEvent}
                  className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs px-4 py-2 rounded-lg font-semibold transition-all shadow-md shadow-sky-600/10 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Regra</span>
                </button>
              </div>
            </div>

            {editingEvent && (
              <div className="flex-1 overflow-hidden flex gap-6">
                {/* Visual Builder Left Panel: Metadata */}
                <div className="w-80 flex flex-col gap-4 overflow-y-auto border-r border-slate-200 dark:border-slate-800 pr-6 shrink-0 text-xs">
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Nome do Evento</label>
                    <input
                      type="text"
                      value={editingEvent.name}
                      onChange={(e) => setEditingEvent({ ...editingEvent, name: e.target.value })}
                      placeholder="Ex: Falha Crítica Tanque 01"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Descrição</label>
                    <textarea
                      rows={2}
                      value={editingEvent.description}
                      onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                      placeholder="Descreva o propósito deste evento inteligente..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none focus:border-sky-500 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Categoria</label>
                      <input
                        type="text"
                        value={editingEvent.category}
                        onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value })}
                        placeholder="Ex: Segurança"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Severidade</label>
                      <select
                        value={editingEvent.severity}
                        onChange={(e) => setEditingEvent({ ...editingEvent, severity: e.target.value as SeverityType })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none focus:border-sky-500 cursor-pointer"
                      >

                        <option value="low">Baixa (Low)</option>
                        <option value="medium">Média (Medium)</option>
                        <option value="high">Alta (High)</option>
                        <option value="critical">Crítica (Critical)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Prioridade</label>
                      <input
                        type="number"
                        value={editingEvent.priority}
                        onChange={(e) => setEditingEvent({ ...editingEvent, priority: parseInt(e.target.value) || 1 })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Grupo</label>
                      <input
                        type="text"
                        value={editingEvent.group}
                        onChange={(e) => setEditingEvent({ ...editingEvent, group: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Área Responsável</label>
                    <input
                      type="text"
                      value={editingEvent.responsibleArea}
                      onChange={(e) => setEditingEvent({ ...editingEvent, responsibleArea: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Observações Internas</label>
                    <textarea
                      rows={2}
                      value={editingEvent.observations}
                      onChange={(e) => setEditingEvent({ ...editingEvent, observations: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none focus:border-sky-500 resize-none font-mono text-[10px]"
                    />
                  </div>
                </div>

                {/* Visual Builder Right Panel: Rule Tree + Actions */}
                <div className="flex-1 overflow-y-auto flex flex-col gap-6 pr-2">
                  {/* Condition Builder */}
                  <div className="flex flex-col gap-3 p-5 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/80 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Grid className="w-4 h-4 text-sky-500" />
                        <span>Construtor Visual de Regras (Condições)</span>
                      </span>
                    </div>

                    <div className="mt-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                      <ConditionNodeEditor
                        node={editingEvent.condition}
                        allProperties={allProperties}
                        onChange={(updatedNode) => setEditingEvent({ ...editingEvent, condition: updatedNode })}
                      />
                    </div>
                  </div>

                  {/* Actions Builder */}
                  <div className="flex flex-col gap-3 p-5 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/80 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Play className="w-4 h-4 text-emerald-500" />
                        <span>Ações Automatizadas (Ao Disparar)</span>
                      </span>
                      <button
                        onClick={() => {
                          const newAction: EventAction = {
                            id: uuidv4(),
                            type: 'generate_notification',
                            params: { message: 'Alerta gerado automaticamente!' }
                          };
                          setEditingEvent({
                            ...editingEvent,
                            actions: [...editingEvent.actions, newAction]
                          });
                        }}
                        className="flex items-center gap-1 text-xs text-sky-500 dark:text-sky-400 hover:text-sky-655 dark:hover:text-sky-300 font-semibold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar Ação
                      </button>
                    </div>

                    <div className="flex flex-col gap-3 mt-2">
                      {editingEvent.actions.map((action, idx) => (
                        <div key={action.id} className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-sky-500 dark:text-sky-400">Ação #{idx + 1}</span>
                            <button
                              onClick={() => {
                                const updatedActions = editingEvent.actions.filter((a) => a.id !== action.id);
                                setEditingEvent({ ...editingEvent, actions: updatedActions });
                              }}
                              className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Tipo de Ação</label>
                              <select
                                value={action.type}
                                onChange={(e) => {
                                  const updatedActions = [...editingEvent.actions];
                                  updatedActions[idx] = { ...action, type: e.target.value as any };
                                  setEditingEvent({ ...editingEvent, actions: updatedActions });
                                }}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none focus:border-sky-500 cursor-pointer"
                              >
                                <option value="generate_notification">Gerar Notificação (Toast)</option>
                                <option value="open_popup">Abrir Popup Modal</option>
                                <option value="change_property">Alterar Propriedade de Objeto</option>
                                <option value="toggle_movement">Iniciar/Finalizar Movimento (OMM)</option>
                                <option value="acknowledge_alarm">Reconhecer Alarme</option>
                                <option value="create_alarm">Criar Alarme Automaticamente</option>
                                <option value="run_javascript">Executar Script JavaScript</option>
                                <option value="audit_log">Registrar Log de Auditoria</option>
                                <option value="record_history">Registrar Histórico</option>
                              </select>
                            </div>

                            {/* Dynamically render action properties */}
                            <div className="flex flex-col justify-end">
                              {action.type === 'generate_notification' && (
                                <div>
                                  <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Mensagem</label>
                                  <input
                                    type="text"
                                    value={action.params.message || ''}
                                    onChange={(e) => {
                                      const updatedActions = [...editingEvent.actions];
                                      updatedActions[idx].params = { ...action.params, message: e.target.value };
                                      setEditingEvent({ ...editingEvent, actions: updatedActions });
                                    }}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none focus:border-sky-500"
                                  />
                                </div>
                              )}

                              {action.type === 'open_popup' && (
                                <div>
                                  <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Mensagem do Modal</label>
                                  <input
                                    type="text"
                                    value={action.params.message || ''}
                                    onChange={(e) => {
                                      const updatedActions = [...editingEvent.actions];
                                      updatedActions[idx].params = { ...action.params, message: e.target.value };
                                      setEditingEvent({ ...editingEvent, actions: updatedActions });
                                    }}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none focus:border-sky-500"
                                  />
                                </div>
                              )}

                              {action.type === 'change_property' && (
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="col-span-2">
                                    <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Propriedade Global</label>
                                    <select
                                      value={action.params.objectId ? `${action.params.objectId}:${action.params.propertyName}` : ''}
                                      onChange={(e) => {
                                        const [objId, propName] = e.target.value.split(':');
                                        const updatedActions = [...editingEvent.actions];
                                        updatedActions[idx].params = { ...action.params, objectId: objId, propertyName: propName };
                                        setEditingEvent({ ...editingEvent, actions: updatedActions });
                                      }}
                                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none focus:border-sky-500 cursor-pointer"
                                    >
                                      <option value="">Selecione...</option>
                                      {allProperties.map((p) => (
                                        <option key={`${p.objectId}:${p.propName}`} value={`${p.objectId}:${p.propName}`}>
                                          {p.objectName}.{p.propName}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Valor</label>
                                    <input
                                      type="text"
                                      value={action.params.value || ''}
                                      onChange={(e) => {
                                        const updatedActions = [...editingEvent.actions];
                                        updatedActions[idx].params = { ...action.params, value: e.target.value };
                                        setEditingEvent({ ...editingEvent, actions: updatedActions });
                                      }}
                                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none focus:border-sky-500"
                                    />
                                  </div>
                                </div>
                              )}

                              {action.type === 'toggle_movement' && (
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">ID Movimento (OMM)</label>
                                    <input
                                      type="text"
                                      value={action.params.movementId || ''}
                                      onChange={(e) => {
                                        const updatedActions = [...editingEvent.actions];
                                        updatedActions[idx].params = { ...action.params, movementId: e.target.value };
                                        setEditingEvent({ ...editingEvent, actions: updatedActions });
                                      }}
                                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none focus:border-sky-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Status Alvo</label>
                                    <select
                                      value={action.params.movementStatus || 'Active'}
                                      onChange={(e) => {
                                        const updatedActions = [...editingEvent.actions];
                                        updatedActions[idx].params = { ...action.params, movementStatus: e.target.value as 'Active' | 'Completed' | 'Closed' };
                                        setEditingEvent({ ...editingEvent, actions: updatedActions });
                                      }}
                                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none focus:border-sky-500 cursor-pointer"
                                    >
                                      <option value="Active">Iniciar (Active)</option>
                                      <option value="Completed">Finalizar (Completed)</option>
                                      <option value="Closed">Fechar (Closed)</option>
                                    </select>
                                  </div>
                                </div>
                              )}

                              {action.type === 'run_javascript' && (
                                <div className="col-span-2">
                                  <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Código JS (Sandbox)</label>
                                  <textarea
                                    rows={3}
                                    value={action.params.scriptCode || ''}
                                    onChange={(e) => {
                                      const updatedActions = [...editingEvent.actions];
                                      updatedActions[idx].params = { ...action.params, scriptCode: e.target.value };
                                      setEditingEvent({ ...editingEvent, actions: updatedActions });
                                    }}
                                    placeholder="Ex: console.log('Hello');"
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none focus:border-sky-500 font-mono resize-none"
                                  />
                                </div>
                              )}

                              {action.type === 'audit_log' && (
                                <div>
                                  <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Detalhes do Log</label>
                                  <input
                                    type="text"
                                    value={action.params.message || ''}
                                    onChange={(e) => {
                                      const updatedActions = [...editingEvent.actions];
                                      updatedActions[idx].params = { ...action.params, message: e.target.value };
                                      setEditingEvent({ ...editingEvent, actions: updatedActions });
                                    }}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none focus:border-sky-500"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Condition Node Editor recursive component
interface ConditionNodeEditorProps {
  node: ConditionNode;
  allProperties: { objectId: string; objectName: string; propName: string; dataType: string }[];
  onChange: (updatedNode: ConditionNode) => void;
}

const ConditionNodeEditor: React.FC<ConditionNodeEditorProps> = ({ node, allProperties, onChange }) => {
  const { objects } = useObjectModelStore();
  if (node.type === 'logical') {
    return (
      <div className="flex flex-col gap-3 p-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Grupo Lógico:</span>
            <select
              value={node.operator}
              onChange={(e) => onChange({ ...node, operator: e.target.value as any })}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white font-semibold cursor-pointer"
            >
              <option value="AND">AND (E)</option>
              <option value="OR">OR (OU)</option>
              <option value="NOT">NOT (NÃO)</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                const newLeaf: LeafCondition = {
                  id: uuidv4(),
                  type: 'leaf',
                  conditionType: 'property_compare',
                  params: {
                    objectId: allProperties[0]?.objectId || '',
                    propertyName: allProperties[0]?.propName || '',
                    operator: 'equal',
                    compareValue: '',
                  }
                };
                onChange({ ...node, conditions: [...node.conditions, newLeaf] });
              }}
              className="text-[10px] text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-bold border border-sky-500/20 px-2 py-1 rounded bg-sky-500/5 transition-colors cursor-pointer"
            >
              + Condição
            </button>
            {node.operator !== 'NOT' && (
              <button
                onClick={() => {
                  const newLogical: LogicalCondition = {
                    id: uuidv4(),
                    type: 'logical',
                    operator: 'AND',
                    conditions: []
                  };
                  onChange({ ...node, conditions: [...node.conditions, newLogical] });
                }}
                className="text-[10px] text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-bold border border-sky-500/20 px-2 py-1 rounded bg-sky-500/5 transition-colors cursor-pointer"
              >
                + Grupo
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-1">
          {node.conditions.map((child, idx) => (
            <div key={child.id} className="relative pl-4 border-l border-slate-200 dark:border-slate-800">
              {/* Delete node button */}
              <button
                onClick={() => {
                  const updatedConditions = node.conditions.filter((c) => c.id !== child.id);
                  onChange({ ...node, conditions: updatedConditions });
                }}
                className="absolute left-[-10px] top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full p-0.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/30 transition-colors shadow-md cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
              </button>
              
              <ConditionNodeEditor
                node={child}
                allProperties={allProperties}
                onChange={(updatedChild) => {
                  const updatedConditions = [...node.conditions];
                  updatedConditions[idx] = updatedChild;
                  onChange({ ...node, conditions: updatedConditions });
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
      <div>
        <label className="block text-[10px] text-slate-500 font-bold mb-1">Tipo de Comparação</label>
        <select
          value={node.conditionType}
          onChange={(e) => onChange({ ...node, conditionType: e.target.value as any })}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none cursor-pointer"
        >
          <option value="property_compare">Property Compare</option>
          <option value="state_change">State Change</option>
          <option value="update_frequency">Update Frequency</option>
          <option value="active_alarms">Active Alarms</option>
          <option value="time_schedule">Schedule (Time/Days)</option>
          <option value="object_state">Object State</option>
          <option value="custom_expression">Custom Expression</option>
        </select>
      </div>

      {node.conditionType === 'property_compare' && (
        <>
          <div className="col-span-2 grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1">Variável (Global Property Browser)</label>
              <select
                value={node.params.objectId ? `${node.params.objectId}:${node.params.propertyName}` : ''}
                onChange={(e) => {
                  const [objId, propName] = e.target.value.split(':');
                  onChange({
                    ...node,
                    params: { ...node.params, objectId: objId, propertyName: propName }
                  });
                }}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none"
              >
                <option value="">Selecione...</option>
                {allProperties.map((p) => (
                  <option key={`${p.objectId}:${p.propName}`} value={`${p.objectId}:${p.propName}`}>
                    {p.objectName}.{p.propName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1">Operador</label>
              <select
                value={node.params.operator}
                onChange={(e) => onChange({ ...node, params: { ...node.params, operator: e.target.value as any } })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="greater">Maior que (&gt;)</option>
                <option value="less">Menor que (&lt;)</option>
                <option value="equal">Igual a (=)</option>
                <option value="notequal">Diferente de (!=)</option>
                <option value="contains">Contém Texto</option>
                <option value="starts_with">Inicia Com</option>
                <option value="ends_with">Termina Com</option>
                <option value="between">Entre Valores</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 font-bold mb-1">Valor Alvo</label>
            {node.params.operator === 'between' ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Min"
                  value={node.params.compareValue || ''}
                  onChange={(e) => onChange({ ...node, params: { ...node.params, compareValue: e.target.value } })}
                  className="w-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none"
                />
                <input
                  type="text"
                  placeholder="Max"
                  value={node.params.compareValue2 || ''}
                  onChange={(e) => onChange({ ...node, params: { ...node.params, compareValue2: e.target.value } })}
                  className="w-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none"
                />
              </div>
            ) : (
              <input
                type="text"
                placeholder="Valor"
                value={node.params.compareValue || ''}
                onChange={(e) => onChange({ ...node, params: { ...node.params, compareValue: e.target.value } })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none"
              />
            )}
          </div>
        </>
      )}

      {node.conditionType === 'state_change' && (
        <>
          <div>
            <label className="block text-[10px] text-slate-500 font-bold mb-1">Variável</label>
            <select
              value={node.params.objectId ? `${node.params.objectId}:${node.params.propertyName}` : ''}
              onChange={(e) => {
                const [objId, propName] = e.target.value.split(':');
                onChange({
                  ...node,
                  params: { ...node.params, objectId: objId, propertyName: propName }
                });
              }}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none"
            >
              <option value="">Selecione...</option>
              {allProperties.map((p) => (
                <option key={`${p.objectId}:${p.propName}`} value={`${p.objectId}:${p.propName}`}>
                  {p.objectName}.{p.propName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 font-bold mb-1">Tipo de Mudança</label>
            <select
              value={node.params.changeType}
              onChange={(e) => onChange({ ...node, params: { ...node.params, changeType: e.target.value as any } })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="any">Qualquer Mudança</option>
              <option value="to_value">Mudança para Valor Específico</option>
            </select>
          </div>
          <div>
            {node.params.changeType === 'to_value' && (
              <>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">Valor Alvo</label>
                <input
                  type="text"
                  placeholder="Ex: true"
                  value={node.params.targetValue || ''}
                  onChange={(e) => onChange({ ...node, params: { ...node.params, targetValue: e.target.value } })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none"
                />
              </>
            )}
          </div>
        </>
      )}

      {node.conditionType === 'update_frequency' && (
        <>
          <div>
            <label className="block text-[10px] text-slate-500 font-bold mb-1">Variável</label>
            <select
              value={node.params.objectId ? `${node.params.objectId}:${node.params.propertyName}` : ''}
              onChange={(e) => {
                const [objId, propName] = e.target.value.split(':');
                onChange({
                  ...node,
                  params: { ...node.params, objectId: objId, propertyName: propName }
                });
              }}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none"
            >
              <option value="">Selecione...</option>
              {allProperties.map((p) => (
                <option key={`${p.objectId}:${p.propName}`} value={`${p.objectId}:${p.propName}`}>
                  {p.objectName}.{p.propName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 font-bold mb-1">Freq. Mínima (Hz)</label>
            <input
              type="number"
              placeholder="Ex: 5"
              value={node.params.frequencyHz || ''}
              onChange={(e) => onChange({ ...node, params: { ...node.params, frequencyHz: parseFloat(e.target.value) || 1 } })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 font-bold mb-1">Janela de Tempo (s)</label>
            <input
              type="number"
              placeholder="Ex: 10"
              value={node.params.timeWindowSec || ''}
              onChange={(e) => onChange({ ...node, params: { ...node.params, timeWindowSec: parseInt(e.target.value) || 10 } })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none"
            />
          </div>
        </>
      )}

      {node.conditionType === 'active_alarms' && (
        <>
          <div className="col-span-2">
            <label className="block text-[10px] text-slate-500 font-bold mb-1">Severidade Alvo</label>
            <select
              value={node.params.alarmSeverity}
              onChange={(e) => onChange({ ...node, params: { ...node.params, alarmSeverity: e.target.value as any } })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="any">Qualquer Severidade</option>
              <option value="critical">Crítico (Critical)</option>
              <option value="high">Alto (High)</option>
              <option value="medium">Médio (Medium)</option>
              <option value="low">Baixo (Low)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 font-bold mb-1">ID Regra Alarme (Opcional)</label>
            <input
              type="text"
              placeholder="Ex: hh-limit"
              value={node.params.specificAlarmRuleId || ''}
              onChange={(e) => onChange({ ...node, params: { ...node.params, specificAlarmRuleId: e.target.value } })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none"
            />
          </div>
        </>
      )}

      {node.conditionType === 'time_schedule' && (
        <>
          <div>
            <label className="block text-[10px] text-slate-500 font-bold mb-1">Horário (HH:MM)</label>
            <input
              type="text"
              placeholder="Ex: 14:30"
              value={node.params.specificTime || ''}
              onChange={(e) => onChange({ ...node, params: { ...node.params, specificTime: e.target.value } })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] text-slate-500 font-bold mb-1">Dias da Semana (0-Dom, 6-Sáb)</label>
            <div className="flex gap-1 mt-1.5">
              {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                const label = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][day];
                const active = node.params.weekdays?.includes(day) ?? false;
                return (
                  <button
                    key={day}
                    onClick={() => {
                      const current = node.params.weekdays || [];
                      const next = current.includes(day)
                        ? current.filter((d) => d !== day)
                        : [...current, day];
                      onChange({ ...node, params: { ...node.params, weekdays: next } });
                    }}
                    className={`w-6 h-6 rounded-full text-[9px] font-bold transition-all border cursor-pointer ${
                      active
                        ? 'bg-sky-600 border-sky-500 text-white shadow-sm shadow-sky-600/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {node.conditionType === 'object_state' && (
        <>
          <div>
            <label className="block text-[10px] text-slate-500 font-bold mb-1">Objeto</label>
            <select
              value={node.params.objectId || ''}
              onChange={(e) => onChange({ ...node, params: { ...node.params, objectId: e.target.value } })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="">Selecione...</option>
              {objects.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 font-bold mb-1">Estado a Verificar</label>
            <select
              value={node.params.objectStateProperty}
              onChange={(e) => onChange({ ...node, params: { ...node.params, objectStateProperty: e.target.value as any } })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="isDeployed">Objeto Ativo/Publicado (isDeployed)</option>
            </select>
          </div>
        </>
      )}

      {node.conditionType === 'custom_expression' && (
        <div className="col-span-3">
          <label className="block text-[10px] text-slate-500 font-bold mb-1">Expressão Customizada (JS / Ex: {"\\${inst-tanque-01:Level} > 80"})</label>
          <input
            type="text"
            value={node.params.expression || ''}
            onChange={(e) => onChange({ ...node, params: { ...node.params, expression: e.target.value } })}
            placeholder="Ex: ${inst-tanque-01:Level} > 80"
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white outline-none font-mono"
          />
        </div>
      )}
    </div>
  );
};
