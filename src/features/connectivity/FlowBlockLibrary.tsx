import React, { useState } from 'react';
import {
  Search,
  Star,
  Clock,
  ChevronDown,
  ChevronRight,
  Cpu,
  Database,
  Layers,
  Code,
  Zap,
  Globe,
  Radio,
  FileSpreadsheet,
  FileCode,
  Sliders,
  Bell,
  PlayCircle,
  Activity,
  Box,
  Hash,
  Terminal,
  Clock3,
  GitBranch,
  Repeat,
  Variable,
  Wrench,
  Server,
  Layers3,
  MessageSquare,
} from 'lucide-react';
import { useConnectivityStore } from '../../store/useConnectivityStore';

interface BlockDefinition {
  type: string;
  label: string;
  category: 'Entradas & Gatilhos' | 'Respostas & Saídas' | 'Operações Industriais' | 'Fontes de Dados' | 'Lógica & Controle' | 'Protocolos & Formatos' | 'Utilitários';
  icon: any;
  color: string;
  description: string;
  defaultProperties?: Record<string, any>;
  isDataSource?: boolean;
  dataSourceType?: string;
  inputsCount?: number;
  outputsCount?: number;
  customOutputs?: { id: string; label: string; color?: string }[];
  nodeCategory?: 'Entrada' | 'Transformação' | 'Industrial' | 'Banco de Dados' | 'Comunicação' | 'Utilidades' | 'Saída' | 'Resposta';
  iconName?: string;
}

export const INDUSTRIAL_BLOCKS: BlockDefinition[] = [
  // Entradas & Gatilhos
  { type: 'http_listener', label: 'REST API (Entrada Webhook)', category: 'Entradas & Gatilhos', icon: Globe, color: '#10b981', description: 'Inicia o fluxo ao receber uma requisição HTTP REST/Webhook.', inputsCount: 0, outputsCount: 1, nodeCategory: 'Entrada', iconName: 'Globe', defaultProperties: { httpMethod: 'POST', httpPath: '/api/v1/trigger', port: 8080 } },
  { type: 'opc_subscription', label: 'Assinatura OPC UA', category: 'Entradas & Gatilhos', icon: Radio, color: '#059669', description: 'Escuta alterações de tags OPC UA em tempo real.', inputsCount: 0, outputsCount: 1, nodeCategory: 'Entrada', iconName: 'Radio', defaultProperties: { connectionId: '', nodeAddress: '', pollingRateMs: 500 } },
  { type: 'mqtt_subscription', label: 'Assinatura MQTT', category: 'Entradas & Gatilhos', icon: MessageSquare, color: '#0284c7', description: 'Dispara o fluxo quando mensagens chegam a um tópico MQTT.', inputsCount: 0, outputsCount: 1, nodeCategory: 'Entrada', iconName: 'MessageSquare', defaultProperties: { connectionId: '', mqttTopic: 'sensors/+/telemetry' } },
  { type: 'cron_trigger', label: 'Agendamento Cron', category: 'Entradas & Gatilhos', icon: Clock, color: '#6366f1', description: 'Executa o fluxo de forma recorrente por expressão cron.', inputsCount: 0, outputsCount: 1, nodeCategory: 'Entrada', iconName: 'Clock', defaultProperties: { cronExpression: '*/5 * * * *', intervalSeconds: 300 } },
  { type: 'variable_change_trigger', label: 'Mudança de Variável', category: 'Entradas & Gatilhos', icon: Activity, color: '#f59e0b', description: 'Inicia o fluxo quando uma variável global é modificada.', inputsCount: 0, outputsCount: 1, nodeCategory: 'Entrada', iconName: 'Activity', defaultProperties: { targetVariable: '', deadband: 0.1 } },
  { type: 'system_event_trigger', label: 'Evento de Sistema', category: 'Entradas & Gatilhos', icon: Bell, color: '#ef4444', description: 'Inicia o fluxo com base em eventos de alarme do sistema.', inputsCount: 0, outputsCount: 1, nodeCategory: 'Entrada', iconName: 'Bell', defaultProperties: { eventType: 'AlarmCreated', severity: 'High' } },

  // Respostas & Saídas
  { type: 'http_response', label: 'Resposta REST API', category: 'Respostas & Saídas', icon: Globe, color: '#10b981', description: 'Envia resposta HTTP (status e payload) para o client solicitante.', inputsCount: 1, outputsCount: 0, nodeCategory: 'Resposta', iconName: 'Globe', defaultProperties: { responseStatus: 200, contentType: 'application/json', responseBody: '{"success": true}' } },
  { type: 'end_flow', label: 'Finalizar Fluxo', category: 'Respostas & Saídas', icon: Zap, color: '#64748b', description: 'Termina a execução do fluxo corrente imediatamente.', inputsCount: 1, outputsCount: 0, nodeCategory: 'Saída', iconName: 'Zap', defaultProperties: { exitCode: 0, exitReason: 'Fluxo concluído com sucesso' } },
  { type: 'mqtt_publish', label: 'Publicar MQTT', category: 'Respostas & Saídas', icon: MessageSquare, color: '#0284c7', description: 'Publica payload de saída em broker MQTT externo.', inputsCount: 1, outputsCount: 0, nodeCategory: 'Saída', iconName: 'MessageSquare', defaultProperties: { connectionId: '', mqttTopic: 'sensors/outputs' } },

  // Operações Industriais
  { type: 'read_property', label: 'Ler Propriedade', category: 'Operações Industriais', icon: Cpu, color: '#0284c7', description: 'Lê o valor atual de uma propriedade de objeto ou tag industrial.' },
  { type: 'write_property', label: 'Escrever Propriedade', category: 'Operações Industriais', icon: Zap, color: '#0284c7', description: 'Escreve um valor em uma propriedade ou ponto de telemetria.' },
  { type: 'read_object', label: 'Ler Objeto', category: 'Operações Industriais', icon: Box, color: '#0284c7', description: 'Obtém a estrutura completa e dados de um objeto do Orquestra.' },
  { type: 'write_object', label: 'Escrever Objeto', category: 'Operações Industriais', icon: Box, color: '#0284c7', description: 'Atualiza propriedades de um objeto cadastrado.' },
  { type: 'find_objects', label: 'Buscar Objetos', category: 'Operações Industriais', icon: Search, color: '#0284c7', description: 'Pesquisa objetos por classe, tag ou localidade.' },
  { type: 'find_variables', label: 'Buscar Variáveis', category: 'Operações Industriais', icon: Hash, color: '#0284c7', description: 'Lista variáveis de runtime ou tags de CLP.' },
  { type: 'find_alarms', label: 'Buscar Alarmes', category: 'Operações Industriais', icon: Bell, color: '#eab308', description: 'Consulta alarmes ativos ou histórico de ocorrências.' },
  { type: 'query_historian', label: 'Consultar Histórico', category: 'Operações Industriais', icon: Clock, color: '#6366f1', description: 'Busca séries temporais no banco historiador.' },
  { type: 'execute_script', label: 'Executar Script', category: 'Operações Industriais', icon: Terminal, color: '#8b5cf6', description: 'Executa código TypeScript/JavaScript no servidor.', customOutputs: [{ id: 'success', label: 'Sucesso', color: '#10b981' }, { id: 'error', label: 'Erro', color: '#ef4444' }] },
  { type: 'execute_flowchart', label: 'Executar Fluxograma', category: 'Operações Industriais', icon: PlayCircle, color: '#8b5cf6', description: 'Dispara um fluxograma de processo do módulo Fluxogramas 2.', customOutputs: [{ id: 'success', label: 'Sucesso', color: '#10b981' }, { id: 'error', label: 'Erro', color: '#ef4444' }] },
  { type: 'update_faceplate', label: 'Atualizar Faceplate', category: 'Operações Industriais', icon: Sliders, color: '#10b981', description: 'Envia sinal de atualização visual para Faceplate no SCADA.' },
  { type: 'update_widget', label: 'Atualizar Widget', category: 'Operações Industriais', icon: Layers, color: '#10b981', description: 'Atualiza o estado de um Widget no Dashboard.' },
  { type: 'update_kpi', label: 'Atualizar KPI', category: 'Operações Industriais', icon: Activity, color: '#10b981', description: 'Recalcula e persiste valor de um indicador KPI.' },
  { type: 'create_event', label: 'Criar Evento', category: 'Operações Industriais', icon: Activity, color: '#f59e0b', description: 'Registra um evento de auditoria ou operação.' },
  { type: 'create_alarm', label: 'Criar Alarme', category: 'Operações Industriais', icon: Bell, color: '#ef4444', description: 'Gera um alarme crítico no sistema de supervisão.' },
  { type: 'acknowledge_alarm', label: 'Reconhecer Alarme', category: 'Operações Industriais', icon: Bell, color: '#10b981', description: 'Reconhece o alarme por ID de ocorrência.' },
  { type: 'create_omm_order', label: 'Criar Ordem OMM', category: 'Operações Industriais', icon: Layers3, color: '#ec4899', description: 'Gera ordem de manutenção preventiva/corretiva no OMM.' },
  { type: 'create_omm_movement', label: 'Criar Movimento OMM', category: 'Operações Industriais', icon: Layers3, color: '#ec4899', description: 'Registra movimentação de materiais ou ativos.' },
  { type: 'update_movement', label: 'Atualizar Movimento', category: 'Operações Industriais', icon: Layers3, color: '#ec4899', description: 'Atualiza o status de um movimento logístico/OMM.' },
  { type: 'execute_cutoff', label: 'Executar Cut-off', category: 'Operações Industriais', icon: Clock3, color: '#6366f1', description: 'Dispara fechamento de balanço de massa/produção.' },
  { type: 'read_runtime', label: 'Ler Runtime', category: 'Operações Industriais', icon: Cpu, color: '#0284c7', description: 'Lê estado de memória e variáveis de execução.' },
  { type: 'write_runtime', label: 'Escrever Runtime', category: 'Operações Industriais', icon: Cpu, color: '#0284c7', description: 'Atualiza registrador de memória do runtime.' },
 
  // Protocolos & Formatos
  { type: 'rest_api', label: 'REST API', category: 'Protocolos & Formatos', icon: Globe, color: '#3b82f6', description: 'Requisição HTTP GET, POST, PUT, DELETE para API externa.', customOutputs: [{ id: 'success', label: 'Sucesso', color: '#10b981' }, { id: 'error', label: 'Erro', color: '#ef4444' }] },
  { type: 'sql_query', label: 'SQL Query', category: 'Protocolos & Formatos', icon: Database, color: '#0284c7', description: 'Executa comando SQL ANSI (Select, Insert, Update).', customOutputs: [{ id: 'success', label: 'Sucesso', color: '#10b981' }, { id: 'error', label: 'Erro', color: '#ef4444' }] },
  { type: 'mqtt_pub_sub', label: 'MQTT Client', category: 'Protocolos & Formatos', icon: Radio, color: '#10b981', description: 'Publica ou assina tópicos em broker MQTT.', customOutputs: [{ id: 'success', label: 'Sucesso', color: '#10b981' }, { id: 'error', label: 'Erro', color: '#ef4444' }] },
  { type: 'opc_ua_client', label: 'OPC UA Client', category: 'Protocolos & Formatos', icon: Cpu, color: '#0284c7', description: 'Leitura/escrita industrial via protocolo OPC UA.', customOutputs: [{ id: 'success', label: 'Sucesso', color: '#10b981' }, { id: 'error', label: 'Erro', color: '#ef4444' }] },
  { type: 'modbus_tcp', label: 'Modbus TCP', category: 'Protocolos & Formatos', icon: Cpu, color: '#f59e0b', description: 'Comunicação Modbus TCP com inversores/CLPs.', customOutputs: [{ id: 'success', label: 'Sucesso', color: '#10b981' }, { id: 'error', label: 'Erro', color: '#ef4444' }] },
  { type: 'csv_parser', label: 'Leitor CSV', category: 'Protocolos & Formatos', icon: FileSpreadsheet, color: '#10b981', description: 'Converte arquivo CSV em objetos JSON.', customOutputs: [{ id: 'success', label: 'Sucesso', color: '#10b981' }, { id: 'error', label: 'Erro', color: '#ef4444' }] },
  { type: 'excel_parser', label: 'Leitor Excel', category: 'Protocolos & Formatos', icon: FileSpreadsheet, color: '#10b981', description: 'Lê planilhas XLSX / XLS.', customOutputs: [{ id: 'success', label: 'Sucesso', color: '#10b981' }, { id: 'error', label: 'Erro', color: '#ef4444' }] },
  { type: 'json_transform', label: 'JSON Transform', category: 'Protocolos & Formatos', icon: FileCode, color: '#6366f1', description: 'Mapeia e transforma payloads JSON.' },
  { type: 'xml_parser', label: 'Leitor XML', category: 'Protocolos & Formatos', icon: FileCode, color: '#6366f1', description: 'Parser de payloads XML para objetos estruturados.', customOutputs: [{ id: 'success', label: 'Sucesso', color: '#10b981' }, { id: 'error', label: 'Erro', color: '#ef4444' }] },
 
  // Lógica & Controle
  { type: 'expressions', label: 'Expressões Math', category: 'Lógica & Controle', icon: Code, color: '#8b5cf6', description: 'Avalia expressões matemáticas ou fórmulas complexas.' },
  { type: 'conditions', label: 'Condição (If/Switch)', category: 'Lógica & Controle', icon: GitBranch, color: '#f59e0b', description: 'Bifurca o fluxo com base em regras lógicas.', customOutputs: [{ id: 'true', label: 'Verdadeiro', color: '#10b981' }, { id: 'false', label: 'Falso', color: '#ef4444' }] },
  { type: 'loop', label: 'Loop (ForEach)', category: 'Lógica & Controle', icon: Repeat, color: '#8b5cf6', description: 'Itera sobre uma coleção de itens.', customOutputs: [{ id: 'body', label: 'Item (Loop)', color: '#8b5cf6' }, { id: 'done', label: 'Concluído', color: '#3b82f6' }] },
  { type: 'timer_delay', label: 'Temporizador', category: 'Lógica & Controle', icon: Clock3, color: '#eab308', description: 'Aposta atraso ou agendamento cíclico.' },
  { type: 'local_variable', label: 'Variável Local', category: 'Lógica & Controle', icon: Variable, color: '#64748b', description: 'Guarda valor em memória durante a execução do fluxo.' },
  { type: 'global_variable', label: 'Variável Global', category: 'Lógica & Controle', icon: Variable, color: '#64748b', description: 'Lê ou escreve em variável global do sistema.' },
 
  // Utilitários
  { type: 'logger', label: 'Logger / Debugger', category: 'Utilitários', icon: Terminal, color: '#64748b', description: 'Imprime mensagem nos logs de monitoramento.' },
  { type: 'notification', label: 'Notificação Push', category: 'Utilitários', icon: Bell, color: '#3b82f6', description: 'Envia alerta para equipe no Teams/Slack/Email.' },
  { type: 'utility_tool', label: 'Utilitário genérico', category: 'Utilitários', icon: Wrench, color: '#64748b', description: 'Bloco utilitário para auxílio de dados.' },
];

interface FlowBlockLibraryProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const FlowBlockLibrary: React.FC<FlowBlockLibraryProps> = ({
  collapsed: _collapsed,
  onToggleCollapse: _onToggleCollapse,
}) => {
  const { connections } = useConnectivityStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'fav' | 'recent'>('all');
  const [favorites, setFavorites] = useState<string[]>(['read_property', 'sql_query', 'conditions']);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Entradas & Gatilhos': true,
    'Respostas & Saídas': true,
    'Operações Industriais': true,
    'Fontes de Dados': true,
    'Lógica & Controle': true,
    'Protocolos & Formatos': true,
    'Utilitários': true,
  });

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const toggleFavorite = (type: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const onDragStart = (e: React.DragEvent, block: BlockDefinition) => {
    e.dataTransfer.setData('application/reactflow-node', JSON.stringify(block));
    e.dataTransfer.effectAllowed = 'move';
  };

  // Convert registered data sources into dynamic blocks
  const dataSourceBlocks: BlockDefinition[] = connections.map((conn) => ({
    type: `datasource_${conn.id}`,
    label: conn.name,
    category: 'Fontes de Dados',
    icon: Server,
    color: conn.color || '#0284c7',
    description: `${conn.type} (${conn.environment}) - ${conn.description}`,
    isDataSource: true,
    dataSourceType: conn.type,
    defaultProperties: { connectionId: conn.id, connectionName: conn.name },
  }));

  const allBlocks = [...INDUSTRIAL_BLOCKS, ...dataSourceBlocks];

  // Filter blocks
  const filteredBlocks = allBlocks.filter((b) => {
    const matchesSearch =
      b.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeTabFilter === 'fav') return favorites.includes(b.type);
    return true;
  });

  const categories = [
    'Entradas & Gatilhos',
    'Respostas & Saídas',
    'Operações Industriais',
    'Fontes de Dados',
    'Lógica & Controle',
    'Protocolos & Formatos',
    'Utilitários',
  ] as const;

  return (
    <aside className="w-72 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 select-none z-10">
      {/* Library Top Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-xs">
              🧱
            </div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Biblioteca de Blocos
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">{allBlocks.length} blocos</span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar bloco ou fonte de dados..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs outline-none focus:border-sky-500 transition-all text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/60 text-[11px]">
          <button
            onClick={() => setActiveTabFilter('all')}
            className={`flex-1 py-1 rounded font-semibold text-center transition-all ${
              activeTabFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveTabFilter('fav')}
            className={`flex-1 py-1 rounded font-semibold text-center flex items-center justify-center gap-1 transition-all ${
              activeTabFilter === 'fav'
                ? 'bg-white dark:bg-slate-900 text-amber-500 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Star className="w-3 h-3 fill-current" />
            <span>Favoritos</span>
          </button>
        </div>
      </div>

      {/* Block List Categories */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin">
        {categories.map((category) => {
          const categoryBlocks = filteredBlocks.filter((b) => b.category === category);
          if (categoryBlocks.length === 0) return null;
          const isExpanded = expandedCategories[category];

          return (
            <div key={category} className="border border-slate-200/80 dark:border-slate-800 rounded-lg overflow-hidden">
              {/* Category Accordion Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>{category}</span>
                </div>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-mono text-[10px]">
                  {categoryBlocks.length}
                </span>
              </button>

              {/* Category Blocks Grid */}
              {isExpanded && (
                <div className="p-1.5 space-y-1 bg-white dark:bg-slate-900">
                  {categoryBlocks.map((block) => {
                    const Icon = block.icon;
                    const isFav = favorites.includes(block.type);

                    return (
                      <div
                        key={block.type}
                        draggable
                        onDragStart={(e) => onDragStart(e, block)}
                        className="group flex items-start gap-2.5 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800 hover:border-sky-500/50 hover:bg-sky-500/5 dark:hover:bg-sky-500/10 cursor-grab active:cursor-grabbing transition-all select-none"
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs mt-0.5"
                          style={{ backgroundColor: block.color }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-sky-600 dark:group-hover:text-sky-400">
                              {block.label}
                            </span>
                            <button
                              onClick={(e) => toggleFavorite(block.type, e)}
                              className="text-slate-300 hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Star className={`w-3.5 h-3.5 ${isFav ? 'text-amber-500 fill-amber-500 opacity-100' : ''}`} />
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1 leading-relaxed">
                            {block.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
