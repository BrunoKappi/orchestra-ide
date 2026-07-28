import React, { useState } from 'react';
import {
  Sliders,
  Database,
  X,
  Search,
  Code,
  Bell,
  Zap,
  Workflow,
  MessageSquare,
  Settings,
  Palette,
  Play,
  HelpCircle,
  FileCode,
  Table,
} from 'lucide-react';
import type { FlowNodeV2 } from '../../../types/flowV2';
import { useObjectModelStore } from '../../../store/useObjectModelStore';
import { useFlowStore } from '../../../store/useFlowStore';
import { scriptRepo } from '../../../repository/ScriptRepository';
import { GlobalPropertyPickerModal } from './GlobalPropertyPickerModal';
import { cn } from '../../../utils/cn';

interface FlowV2PropertyInspectorProps {
  selectedNode: FlowNodeV2 | null;
  onUpdateNodeData: (nodeId: string, updates: any) => void;
  onClose: () => void;
}

type TabType = 'general' | 'appearance' | 'data' | 'execution' | 'integrations' | 'comments' | 'advanced';

export const FlowV2PropertyInspector: React.FC<FlowV2PropertyInspectorProps> = ({
  selectedNode,
  onUpdateNodeData,
  onClose,
}) => {
  const { objects, templates } = useObjectModelStore();
  const { flowcharts } = useFlowStore();

  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isPropertyPickerOpen, setIsPropertyPickerOpen] = useState(false);

  if (!selectedNode) return null;

  const data = selectedNode.data;
  const meta = data.metadata || { id: selectedNode.id, name: data.label };

  const handleTextChange = (field: string, value: any) => {
    onUpdateNodeData(selectedNode.id, {
      [field]: value,
    });
  };

  const handleMetaChange = (metaField: string, value: any) => {
    const updatedMeta = { ...meta, [metaField]: value };
    onUpdateNodeData(selectedNode.id, {
      metadata: updatedMeta,
      ...(metaField === 'targetPropertyName' ? { description: `Referência: ${value}` } : {}),
    });
  };

  // Extract all real scripts from Templates & Objects via scriptRepo
  const realScriptsList = React.useMemo(() => {
    const scripts = scriptRepo.getAll();
    return scripts.map((s) => ({
      id: s.id,
      name: s.name,
      owner: s.targetType === 'template' ? `Template (${s.targetId})` : `Objeto (${s.targetId})`,
      code: s.code || '',
    }));
  }, [templates, objects]);

  const tabs: Array<{ id: TabType; label: string; icon: any }> = [
    { id: 'general', label: 'Geral', icon: Sliders },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'data', label: 'Dados', icon: Database },
    { id: 'execution', label: 'Execução', icon: Play },
    { id: 'integrations', label: 'Integrações', icon: Zap },
    { id: 'comments', label: 'Comentários', icon: MessageSquare },
    { id: 'advanced', label: 'Avançado', icon: Settings },
  ];

  return (
    <aside className="w-84 border-l border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col h-full shrink-0 select-none z-20 shadow-2xl">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
              {data.label || 'Propriedades do Bloco'}
            </h3>
            <span className="text-[10px] text-slate-400 font-mono block truncate">Nó: {selectedNode.id}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 scrollbar-none text-[11px] font-semibold shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-2.5 py-2 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-all cursor-pointer',
              activeTab === tab.id
                ? 'border-sky-500 text-sky-600 dark:text-sky-400 bg-white dark:bg-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Contents Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* 1. GERAL */}
        {activeTab === 'general' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Título do Nó</label>
              <input
                type="text"
                value={data.label || ''}
                onChange={(e) => handleTextChange('label', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-sky-500 text-slate-900 dark:text-slate-100 font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Categoria do Processo</label>
              <input
                type="text"
                value={data.category || ''}
                onChange={(e) => handleTextChange('category', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-sky-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Descrição do Bloco</label>
              <textarea
                value={data.description || ''}
                onChange={(e) => handleTextChange('description', e.target.value)}
                rows={3}
                placeholder="Descreva o objetivo deste bloco no processo..."
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-sky-500 text-slate-900 dark:text-slate-100 resize-none"
              />
            </div>

            {/* Node Type Info */}
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Tipo Técnico</span>
              <span className="font-mono font-bold text-sky-600 dark:text-sky-400 block">{data.nodeType}</span>
              {data.industrialType && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">
                  Subtipo: {data.industrialType}
                </span>
              )}
            </div>

            {data.nodeType === 'container' && (
              <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Título da Área Contêiner</label>
                <input
                  type="text"
                  value={data.containerTitle || ''}
                  onChange={(e) => handleTextChange('containerTitle', e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-sky-500"
                />
              </div>
            )}
          </div>
        )}

        {/* 2. APARÊNCIA */}
        {activeTab === 'appearance' && (
          <div className="space-y-3.5">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Cor da Borda</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={data.borderColor || '#0ea5e9'}
                  onChange={(e) => handleTextChange('borderColor', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0"
                />
                <span className="font-mono text-xs text-slate-500">{data.borderColor || '#0ea5e9'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Cor de Fundo do Cartão</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={data.backgroundColor || '#ffffff'}
                  onChange={(e) => handleTextChange('backgroundColor', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0"
                />
                <span className="font-mono text-xs text-slate-500">{data.backgroundColor || 'Padrão'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Cor do Texto</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={data.textColor || '#0f172a'}
                  onChange={(e) => handleTextChange('textColor', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0"
                />
                <span className="font-mono text-xs text-slate-500">{data.textColor || '#0f172a'}</span>
              </div>
            </div>

            {/* Note Color for Sticky Notes */}
            {data.nodeType === 'sticky_note' && (
              <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Estilo da Nota Adesiva</label>
                <div className="flex items-center gap-2">
                  {['yellow', 'blue', 'green', 'pink', 'purple'].map((c) => (
                    <button
                      key={c}
                      onClick={() => handleTextChange('noteColor', c)}
                      className={cn(
                        'w-7 h-7 rounded-full border border-black/20 capitalize font-bold text-[9px] cursor-pointer transition-all',
                        c === 'yellow' && 'bg-amber-300',
                        c === 'blue' && 'bg-sky-300',
                        c === 'green' && 'bg-emerald-300',
                        c === 'pink' && 'bg-pink-300',
                        c === 'purple' && 'bg-purple-300',
                        data.noteColor === c && 'ring-2 ring-slate-900 dark:ring-white scale-110'
                      )}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. DADOS & OPERADORES */}
        {activeTab === 'data' && (
          <div className="space-y-3.5">
            {/* Global Property Picker Button */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Propriedade Alvo (Orquestra)</span>
                <span className="text-[10px] text-sky-500 font-mono">Property Browser</span>
              </label>

              <div className="flex gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={meta.targetPropertyName || ''}
                  placeholder="Nenhuma propriedade vinculada..."
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono text-[11px] truncate cursor-pointer"
                  onClick={() => setIsPropertyPickerOpen(true)}
                />

                <button
                  onClick={() => setIsPropertyPickerOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Buscar</span>
                </button>
              </div>
            </div>

            {/* Logical & Relational Operators for Compare/Gateways */}
            {(data.industrialType === 'compare_variable' ||
              data.industrialType === 'execute_expression' ||
              data.nodeType === 'gateway_exclusive') && (
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-emerald-500" />
                  <span>Configuração de Comparação / Operador</span>
                </h4>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Operador Relacional / Lógico</label>
                  <select
                    value={meta.comparisonOperator || '=='}
                    onChange={(e) => handleMetaChange('comparisonOperator', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-mono"
                  >
                    <option value="==">== (Igual a)</option>
                    <option value="!=">!= (Diferente de)</option>
                    <option value=">">&gt; (Maior que)</option>
                    <option value="<">&lt; (Menor que)</option>
                    <option value=">=">&gt;= (Maior ou Igual a)</option>
                    <option value="<=">&lt;= (Menor ou Igual a)</option>
                    <option value="AND">AND (E Lógico)</option>
                    <option value="OR">OR (OU Lógico)</option>
                    <option value="NOT">NOT (Negação)</option>
                    <option value="contains">Contém (Texto)</option>
                    <option value="starts_with">Inicia com (Texto)</option>
                    <option value="ends_with">Termina com (Texto)</option>
                    <option value="regex">Expressão Regular (Regex)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Valor de Comparação (Limite)</label>
                  <input
                    type="text"
                    value={meta.compareValue || ''}
                    onChange={(e) => handleMetaChange('compareValue', e.target.value)}
                    placeholder="ex: 100, true, 'NORMAL'..."
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-mono"
                  />
                </div>
              </div>
            )}

            {/* Database Table & SQL Query */}
            {data.industrialType === 'query_history' && (
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-blue-500" />
                  <span>Banco de Dados & Tabela Simulada</span>
                </h4>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Tabela de Dados</label>
                  <select
                    value={meta.dbTable || 'historian_logs'}
                    onChange={(e) => handleMetaChange('dbTable', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  >
                    <option value="historian_logs">historian_logs (Leituras de Processo)</option>
                    <option value="alarm_history">alarm_history (Histórico de Alarmes)</option>
                    <option value="event_logs">event_logs (Eventos do Sistema)</option>
                    <option value="production_batches">production_batches (Lotes de Produção)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Consulta SQL Simulada</label>
                  <textarea
                    value={meta.sqlQuery || 'SELECT * FROM historian_logs LIMIT 50;'}
                    onChange={(e) => handleMetaChange('sqlQuery', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-mono text-[11px]"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. EXECUÇÃO */}
        {activeTab === 'execution' && (
          <div className="space-y-3.5">
            {/* Real Script Automation Selector */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Code className="w-4 h-4 text-purple-500" />
                <span>Script Registrado no Orquestra</span>
              </label>

              <select
                value={meta.scriptId || ''}
                onChange={(e) => {
                  const selectedScript = realScriptsList.find((s) => s.id === e.target.value);
                  handleMetaChange('scriptId', e.target.value);
                  if (selectedScript) {
                    handleMetaChange('scriptName', selectedScript.name);
                    handleTextChange('description', `Script: ${selectedScript.name} (${selectedScript.owner})`);
                  }
                }}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
              >
                <option value="">Selecione um script cadastrado...</option>
                {realScriptsList.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.name} ({sc.owner})
                  </option>
                ))}
              </select>
            </div>

            {/* Delay & Timer duration */}
            {(data.industrialType === 'delay' || data.industrialType === 'timer') && (
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Tempo de Pausa (ms)</label>
                <input
                  type="number"
                  value={meta.durationMs || 1000}
                  onChange={(e) => handleMetaChange('durationMs', Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-mono"
                />
              </div>
            )}

            {/* Simulated Payload */}
            <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Carga Útil de Simulação (Simulated Payload)</label>
              <input
                type="text"
                value={data.simValue !== undefined ? String(data.simValue) : ''}
                onChange={(e) => handleTextChange('simValue', e.target.value)}
                placeholder="ex: 85.5, 'SUCCESS'..."
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-mono"
              />
            </div>
          </div>
        )}

        {/* 5. INTEGRAÇÕES */}
        {activeTab === 'integrations' && (
          <div className="space-y-3.5">
            {/* Alarm Manager Integration */}
            <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                <Bell className="w-4 h-4 text-rose-500" />
                <span>Integração com Alarm Manager</span>
              </h4>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Ação sobre o Alarme</label>
                <select
                  value={meta.alarmAction || 'ack'}
                  onChange={(e) => handleMetaChange('alarmAction', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-xs"
                >
                  <option value="ack">Reconhecer Alarme (Acknowledge)</option>
                  <option value="wait">Aguardar Ativação de Alarme</option>
                  <option value="change_severity">Alterar Severidade</option>
                  <option value="query_active">Consultar Alarmes Ativos</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Severidade do Alarme</label>
                <select
                  value={meta.alarmSeverity || 'high'}
                  onChange={(e) => handleMetaChange('alarmSeverity', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-xs"
                >
                  <option value="low">Baixa (Low)</option>
                  <option value="medium">Média (Medium)</option>
                  <option value="high">Alta (High)</option>
                  <option value="critical">Crítica (Critical)</option>
                </select>
              </div>
            </div>

            {/* Event Engine Integration */}
            <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                <Zap className="w-4 h-4 text-orange-500" />
                <span>Integração com Event Engine</span>
              </h4>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Nome do Evento</label>
                <input
                  type="text"
                  value={meta.raiseEventName || ''}
                  onChange={(e) => handleMetaChange('raiseEventName', e.target.value)}
                  placeholder="ex: EVT_EMERGENCY_STOP"
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-mono text-xs"
                />
              </div>
            </div>

            {/* Sub-flowchart execution */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Workflow className="w-4 h-4 text-indigo-500" />
                <span>Fluxograma Sub-Processo</span>
              </label>
              <select
                value={meta.targetFlowchartId || ''}
                onChange={(e) => handleMetaChange('targetFlowchartId', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
              >
                <option value="">Selecione um fluxograma...</option>
                {flowcharts.map((fc) => (
                  <option key={fc.id} value={fc.id}>
                    {fc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* 6. COMENTÁRIOS & NOTAS */}
        {activeTab === 'comments' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Documentação & Observações</label>
              <textarea
                value={meta.userComments || ''}
                onChange={(e) => handleMetaChange('userComments', e.target.value)}
                rows={6}
                placeholder="Insira notas operacionais, requisitos ou observações para este nó..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-sky-500 text-slate-900 dark:text-slate-100 resize-none font-sans"
              />
            </div>
          </div>
        )}

        {/* 7. AVANÇADO */}
        {activeTab === 'advanced' && (
          <div className="space-y-3.5">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Prioridade de Execução (1-100)</label>
              <input
                type="number"
                value={meta.priority || 10}
                onChange={(e) => handleMetaChange('priority', Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Política de Erros / Retentativas</label>
              <select
                value={meta.errorPolicy || 'stop'}
                onChange={(e) => handleMetaChange('errorPolicy', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
              >
                <option value="stop">Parar Execução (Fail Stop)</option>
                <option value="continue">Ignorar e Continuar (Continue on Error)</option>
                <option value="retry">Tentar Novamente (Retry 3x)</option>
              </select>
            </div>

            {/* Raw JSON viewer/editor */}
            <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Metadados em JSON Raw</span>
                <FileCode className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <pre className="p-2.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-[10px] max-h-40 overflow-y-auto border border-slate-800">
                {JSON.stringify(meta, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Global Property Picker Modal */}
      <GlobalPropertyPickerModal
        isOpen={isPropertyPickerOpen}
        onClose={() => setIsPropertyPickerOpen(false)}
        onSelectProperty={(prop) => {
          handleMetaChange('targetPropertyId', prop.id);
          handleMetaChange('targetPropertyName', `${prop.targetName}.${prop.name}`);
        }}
        selectedPropertyId={meta.targetPropertyId}
      />
    </aside>
  );
};
