import React from 'react';
import {
  X,
  Sliders,
  Trash2,
  Settings2,
  Info,
} from 'lucide-react';
import type { Node, Edge } from '@xyflow/react';
import type { ConnectivityFlowNodeData } from '../../types/connectivity';

interface FlowPropertyPanelProps {
  selectedNode: Node<ConnectivityFlowNodeData> | null;
  selectedEdge: Edge | null;
  onUpdateNode: (id: string, data: Partial<ConnectivityFlowNodeData>) => void;
  onUpdateEdge: (id: string, edgeData: Partial<Edge>) => void;
  onDeleteNode: (id: string) => void;
  onDeleteEdge: (id: string) => void;
  onClose: () => void;
}

export const FlowPropertyPanel: React.FC<FlowPropertyPanelProps> = ({
  selectedNode,
  selectedEdge,
  onUpdateNode,
  onUpdateEdge,
  onDeleteNode,
  onDeleteEdge,
  onClose,
}) => {
  if (!selectedNode && !selectedEdge) return null;

  if (selectedEdge) {
    return (
      <aside className="w-80 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 select-none shadow-xl z-20">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-sky-500" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100">
              Propriedades da Ligação
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Rótulo da Ligação
            </label>
            <input
              type="text"
              value={(selectedEdge.label as string) || ''}
              onChange={(e) => onUpdateEdge(selectedEdge.id, { label: e.target.value })}
              placeholder="Ex: Sucesso / payload > 50"
              className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/80 dark:border-slate-700/60">
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Animação de Dados
              </span>
              <span className="text-[10px] text-slate-400">Exibir pulso visual de fluxo</span>
            </div>
            <input
              type="checkbox"
              checked={selectedEdge.data?.animated !== false}
              onChange={(e) =>
                onUpdateEdge(selectedEdge.id, {
                  data: { ...selectedEdge.data, animated: e.target.checked },
                })
              }
              className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
            />
          </div>

          <div className="p-3 bg-sky-500/10 dark:bg-sky-500/20 rounded-lg border border-sky-500/20 text-xs text-sky-700 dark:text-sky-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Info className="w-3.5 h-3.5" />
              <span>Origem e Destino</span>
            </div>
            <p className="font-mono text-[10px]">
              {selectedEdge.source} ➔ {selectedEdge.target}
            </p>
          </div>
        </div>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
          <button
            onClick={() => onDeleteEdge(selectedEdge.id)}
            className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold text-xs rounded-lg flex items-center justify-center gap-2 border border-red-500/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir Conexão (Delete)</span>
          </button>
        </div>
      </aside>
    );
  }

  if (!selectedNode) return null;

  // Node Property Editor
  const nodeData = selectedNode.data;
  const properties = nodeData.properties || {};

  const handlePropertyChange = (key: string, val: any) => {
    onUpdateNode(selectedNode.id, {
      properties: {
        ...properties,
        [key]: val,
      },
    });
  };

  return (
    <aside className="w-80 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 select-none shadow-xl z-20">
      {/* Property Panel Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-xs"
            style={{ backgroundColor: nodeData.color || '#0284c7' }}
          >
            🔌
          </div>
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100">
              {nodeData.label}
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">{nodeData.blockType}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Form Fields */}
      <div className="p-4 space-y-4 flex-1 overflow-y-auto scrollbar-thin">
        {/* Node Name */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Nome do Bloco
          </label>
          <input
            type="text"
            value={nodeData.label}
            onChange={(e) => onUpdateNode(selectedNode.id, { label: e.target.value })}
            className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Descrição
          </label>
          <textarea
            rows={2}
            value={nodeData.description}
            onChange={(e) => onUpdateNode(selectedNode.id, { description: e.target.value })}
            className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100 resize-none"
          />
        </div>

        {/* Categoria & Color */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Categoria
            </label>
            <select
              value={nodeData.category}
              onChange={(e) => onUpdateNode(selectedNode.id, { category: e.target.value as any })}
              className="w-full px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100"
            >
              <option value="Entrada">Entrada</option>
              <option value="Transformação">Transformação</option>
              <option value="Industrial">Industrial</option>
              <option value="Banco de Dados">Banco de Dados</option>
              <option value="Comunicação">Comunicação</option>
              <option value="Utilidades">Utilidades</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Cor do Bloco
            </label>
            <input
              type="color"
              value={nodeData.color || '#0284c7'}
              onChange={(e) => onUpdateNode(selectedNode.id, { color: e.target.value })}
              className="w-full h-8 bg-transparent cursor-pointer rounded border border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        {/* Dynamic Property Browser Configuration */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-sky-500" />
            <span>Configurações Específicas</span>
          </h4>

          <div className="space-y-3">
            {/* HTTP Listener (REST API Entrada) */}
            {nodeData.blockType === 'http_listener' && (
              <>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Método HTTP
                  </label>
                  <select
                    value={properties.httpMethod || 'POST'}
                    onChange={(e) => handlePropertyChange('httpMethod', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Rota / Caminho
                  </label>
                  <input
                    type="text"
                    value={properties.httpPath || ''}
                    onChange={(e) => handlePropertyChange('httpPath', e.target.value)}
                    placeholder="/api/v1/webhook"
                    className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Porta do Servidor
                  </label>
                  <input
                    type="number"
                    value={properties.port || 8080}
                    onChange={(e) => handlePropertyChange('port', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100 font-mono"
                  />
                </div>
              </>
            )}

            {/* HTTP Response */}
            {nodeData.blockType === 'http_response' && (
              <>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Status Code
                  </label>
                  <input
                    type="number"
                    value={properties.responseStatus || 200}
                    onChange={(e) => handlePropertyChange('responseStatus', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Content Type
                  </label>
                  <input
                    type="text"
                    value={properties.contentType || 'application/json'}
                    onChange={(e) => handlePropertyChange('contentType', e.target.value)}
                    placeholder="application/json"
                    className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Corpo da Resposta (Body)
                  </label>
                  <textarea
                    rows={4}
                    value={properties.responseBody || ''}
                    onChange={(e) => handlePropertyChange('responseBody', e.target.value)}
                    placeholder='{"success": true}'
                    className="w-full px-2.5 py-1.5 bg-slate-900 text-emerald-400 border border-slate-700 rounded-lg text-xs font-mono outline-none resize-none"
                  />
                </div>
              </>
            )}

            {/* OPC UA Subscription */}
            {nodeData.blockType === 'opc_subscription' && (
              <>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Endereço Tag / OPC UA Node
                  </label>
                  <input
                    type="text"
                    value={properties.nodeAddress || ''}
                    onChange={(e) => handlePropertyChange('nodeAddress', e.target.value)}
                    placeholder="ns=2;s=Line1.Tanque01.Nivel"
                    className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Intervalo de Polling (ms)
                  </label>
                  <input
                    type="number"
                    value={properties.pollingRateMs || properties.pollIntervalMs || 500}
                    onChange={(e) => handlePropertyChange('pollingRateMs', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100 font-mono"
                  />
                </div>
              </>
            )}

            {/* MQTT Blocks */}
            {(nodeData.blockType === 'mqtt_subscription' || nodeData.blockType === 'mqtt_publish') && (
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Tópico MQTT
                </label>
                <input
                  type="text"
                  value={properties.mqttTopic || ''}
                  onChange={(e) => handlePropertyChange('mqttTopic', e.target.value)}
                  placeholder="sensors/temp/telemetry"
                  className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100"
                />
              </div>
            )}

            {/* Cron Trigger */}
            {nodeData.blockType === 'cron_trigger' && (
              <>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Expressão Cron
                  </label>
                  <input
                    type="text"
                    value={properties.cronExpression || '*/5 * * * *'}
                    onChange={(e) => handlePropertyChange('cronExpression', e.target.value)}
                    placeholder="*/5 * * * *"
                    className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Intervalo (Segundos)
                  </label>
                  <input
                    type="number"
                    value={properties.intervalSeconds || 300}
                    onChange={(e) => handlePropertyChange('intervalSeconds', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100 font-mono"
                  />
                </div>
              </>
            )}

            {/* Variable Change Trigger */}
            {nodeData.blockType === 'variable_change_trigger' && (
              <>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Variável Alvo
                  </label>
                  <input
                    type="text"
                    value={properties.targetVariable || ''}
                    onChange={(e) => handlePropertyChange('targetVariable', e.target.value)}
                    placeholder="VAR_GLOBAL_PRODUCAO"
                    className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Banda Morta (Deadband)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={properties.deadband || 0.1}
                    onChange={(e) => handlePropertyChange('deadband', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100 font-mono"
                  />
                </div>
              </>
            )}

            {/* End Flow */}
            {nodeData.blockType === 'end_flow' && (
              <>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Código de Saída
                  </label>
                  <input
                    type="number"
                    value={properties.exitCode || 0}
                    onChange={(e) => handlePropertyChange('exitCode', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Motivo / Mensagem
                  </label>
                  <input
                    type="text"
                    value={properties.exitReason || ''}
                    onChange={(e) => handlePropertyChange('exitReason', e.target.value)}
                    placeholder="Fluxo encerrado"
                    className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </>
            )}

            {/* Fallback to original layout for default blocks */}
            {!['http_listener', 'http_response', 'opc_subscription', 'mqtt_subscription', 'mqtt_publish', 'cron_trigger', 'variable_change_trigger', 'end_flow'].includes(nodeData.blockType) && (
              <>
                {/* Tag / OPC Address */}
                {(properties.nodeAddress !== undefined || nodeData.blockType.includes('opc') || nodeData.blockType.includes('property')) && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Endereço Tag / OPC UA Node
                    </label>
                    <input
                      type="text"
                      value={properties.nodeAddress || ''}
                      onChange={(e) => handlePropertyChange('nodeAddress', e.target.value)}
                      placeholder="ns=2;s=Line1.Tanque01.Nivel"
                      className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                )}

                {/* SQL Query / Script */}
                {(properties.query !== undefined || properties.scriptCode !== undefined || nodeData.blockType === 'sql_query' || nodeData.blockType === 'execute_script') && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Instrução SQL / Script Code
                    </label>
                    <textarea
                      rows={4}
                      value={properties.query || properties.scriptCode || ''}
                      onChange={(e) =>
                        handlePropertyChange(
                          properties.query !== undefined ? 'query' : 'scriptCode',
                          e.target.value
                        )
                      }
                      placeholder="SELECT * FROM Producao WHERE Data = NOW()"
                      className="w-full px-2.5 py-1.5 bg-slate-900 text-emerald-400 border border-slate-700 rounded-lg text-xs font-mono outline-none resize-none"
                    />
                  </div>
                )}

                {/* Interval / Refresh ms */}
                {(properties.pollIntervalMs !== undefined || properties.pollingRateMs !== undefined) && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Intervalo de Polling (ms)
                    </label>
                    <input
                      type="number"
                      value={properties.pollIntervalMs || properties.pollingRateMs || 1000}
                      onChange={(e) => handlePropertyChange(properties.pollIntervalMs !== undefined ? 'pollIntervalMs' : 'pollingRateMs', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100 font-mono"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Panel Footer Actions */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
        <button
          onClick={() => onDeleteNode(selectedNode.id)}
          className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold text-xs rounded-lg flex items-center justify-center gap-2 border border-red-500/30 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Excluir Bloco</span>
        </button>
      </div>
    </aside>
  );
};
