import React, { useState } from 'react';
import {
  Database,
  Globe,
  Radio,
  MessageSquare,
  Briefcase,
  Save,
  Play,
  CheckCircle2,
  Server,
} from 'lucide-react';
import { useConnectivityStore } from '../../store/useConnectivityStore';

export const ConnectionDesignerTab: React.FC = () => {
  const { connections, updateConnection, testConnection } = useConnectivityStore();

  const [selectedConnId, setSelectedConnId] = useState<string>(connections[0]?.id || '');

  const activeConn = connections.find((c) => c.id === selectedConnId) || connections[0];
  const [configState, setConfigState] = useState<Record<string, any>>(activeConn?.config || {});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleSelectConnection = (connId: string) => {
    setSelectedConnId(connId);
    const conn = connections.find((c) => c.id === connId);
    if (conn) {
      setConfigState(conn.config || {});
      setSaveSuccessMsg(false);
      setTestResult(null);
    }
  };

  const handleSaveConfig = () => {
    if (activeConn) {
      updateConnection(activeConn.id, {
        config: configState,
      });
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
    }
  };

  const handleTest = async () => {
    if (activeConn) {
      const res = await testConnection(activeConn.id);
      setTestResult(`${res.status}: ${res.message} (${res.latencyMs}ms)`);
    }
  };

  return (
    <div className="flex h-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-xs">
      {/* Left Sidebar: Connection Selector */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs mb-1">
            Selecione uma Conexão
          </h3>
          <p className="text-[11px] text-slate-400">
            Configure parâmetros específicos por tecnologia
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {connections.map((conn) => (
            <button
              key={conn.id}
              onClick={() => handleSelectConnection(conn.id)}
              className={`w-full text-left p-2.5 rounded-lg flex items-center gap-2.5 transition-all ${
                activeConn?.id === conn.id
                  ? 'bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-semibold'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: conn.color }}
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate">{conn.name}</span>
                <span className="text-[10px] text-slate-400 font-mono truncate">{conn.type}</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Designer Form */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
        {activeConn ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm font-bold text-sm"
                  style={{ backgroundColor: activeConn.color }}
                >
                  {activeConn.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    Designer de Conexão: {activeConn.name}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Tecnologia: <span className="font-semibold text-sky-500">{activeConn.type}</span> | Categoria: {activeConn.category}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTest}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold rounded-lg text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Simular Handshake</span>
                </button>

                <button
                  onClick={handleSaveConfig}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-sm transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Parâmetros</span>
                </button>
              </div>
            </div>

            {saveSuccessMsg && (
              <div className="p-2.5 bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 px-4 text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Configurações atualizadas e persistidas com sucesso no banco de dados local!</span>
              </div>
            )}

            {testResult && (
              <div className="p-2.5 bg-sky-500/10 border-b border-sky-500/30 text-sky-700 dark:text-sky-300 flex items-center gap-2 px-4 text-xs font-mono">
                <Play className="w-3.5 h-3.5 text-sky-500" />
                <span>{testResult}</span>
              </div>
            )}

            {/* Dynamic Technology Specific Form Content */}
            <div className="flex-1 overflow-y-auto p-6 max-w-4xl space-y-6">
              {/* SQL Server / Relational Databases */}
              {(activeConn.type === 'SQL Server' ||
                activeConn.type === 'Oracle' ||
                activeConn.type === 'PostgreSQL' ||
                activeConn.type === 'MySQL') && (
                <div className="space-y-4">
                  <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-800 dark:text-sky-300 text-xs flex items-center gap-2">
                    <Database className="w-4 h-4 text-sky-500" />
                    <span>Configuração de Conexão com Banco de Dados Relacional Empresarial</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Host / Servidor / Cluster IP
                      </label>
                      <input
                        type="text"
                        value={configState.host || ''}
                        onChange={(e) => setConfigState({ ...configState, host: e.target.value })}
                        placeholder="sqlserver-prod.corp.internal"
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Porta
                      </label>
                      <input
                        type="number"
                        value={configState.port || 1433}
                        onChange={(e) => setConfigState({ ...configState, port: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Nome do Banco de Dados (Database)
                      </label>
                      <input
                        type="text"
                        value={configState.database || ''}
                        onChange={(e) => setConfigState({ ...configState, database: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Usuário de Conexão
                      </label>
                      <input
                        type="text"
                        value={configState.user || ''}
                        onChange={(e) => setConfigState({ ...configState, user: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Senha Simulada
                      </label>
                      <input
                        type="password"
                        value="••••••••••••"
                        readOnly
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Tamanho do Pool (Connections)
                      </label>
                      <input
                        type="number"
                        value={configState.poolSize || 50}
                        onChange={(e) => setConfigState({ ...configState, poolSize: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Timeout (segundos)
                      </label>
                      <input
                        type="number"
                        value={configState.timeout || 30}
                        onChange={(e) => setConfigState({ ...configState, timeout: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* REST API Form */}
              {activeConn.type === 'REST API' && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-500" />
                    <span>Configuração de Endpoint REST Web API</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      URL Base da API
                    </label>
                    <input
                      type="text"
                      value={configState.baseUrl || ''}
                      onChange={(e) => setConfigState({ ...configState, baseUrl: e.target.value })}
                      placeholder="https://api.wms.corp/v1"
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Método HTTP Padrão
                      </label>
                      <select
                        value={configState.method || 'POST'}
                        onChange={(e) => setConfigState({ ...configState, method: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                        <option value="PATCH">PATCH</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Tipo de Autenticação
                      </label>
                      <select
                        value={configState.authType || 'OAuth 2.0'}
                        onChange={(e) => setConfigState({ ...configState, authType: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold"
                      >
                        <option value="None">None</option>
                        <option value="Basic">Basic Auth</option>
                        <option value="Bearer Token">Bearer Token</option>
                        <option value="OAuth 2.0">OAuth 2.0</option>
                        <option value="API Key">API Key</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* OPC UA / DA */}
              {(activeConn.type === 'OPC UA' || activeConn.type === 'OPC DA') && (
                <div className="space-y-4">
                  <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-lg text-teal-800 dark:text-teal-300 text-xs flex items-center gap-2">
                    <Radio className="w-4 h-4 text-teal-500" />
                    <span>Configuração do Servidor OPC UA Industrial Kepware / SCADA</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Endpoint URL
                    </label>
                    <input
                      type="text"
                      value={configState.endpointUrl || ''}
                      onChange={(e) => setConfigState({ ...configState, endpointUrl: e.target.value })}
                      placeholder="opc.tcp://192.168.10.50:4840"
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Namespace Index
                      </label>
                      <input
                        type="number"
                        value={configState.namespaceIndex || 2}
                        onChange={(e) => setConfigState({ ...configState, namespaceIndex: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Security Policy
                      </label>
                      <select
                        value={configState.securityPolicy || 'Basic256Sha256'}
                        onChange={(e) => setConfigState({ ...configState, securityPolicy: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold"
                      >
                        <option value="None">None</option>
                        <option value="Basic128Rsa15">Basic128Rsa15</option>
                        <option value="Basic256">Basic256</option>
                        <option value="Basic256Sha256">Basic256Sha256</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Security Mode
                      </label>
                      <select
                        value={configState.securityMode || 'SignAndEncrypt'}
                        onChange={(e) => setConfigState({ ...configState, securityMode: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold"
                      >
                        <option value="None">None</option>
                        <option value="Sign">Sign</option>
                        <option value="SignAndEncrypt">Sign & Encrypt</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* MQTT Broker */}
              {activeConn.type === 'MQTT Broker' && (
                <div className="space-y-4">
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-800 dark:text-purple-300 text-xs flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-500" />
                    <span>Configuração do Broker MQTT / IoT Middleware</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Broker URL / Address
                      </label>
                      <input
                        type="text"
                        value={configState.brokerUrl || ''}
                        onChange={(e) => setConfigState({ ...configState, brokerUrl: e.target.value })}
                        placeholder="mqtt://broker-emqx.internal.corp"
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Porta (1883 / 8883 SSL)
                      </label>
                      <input
                        type="number"
                        value={configState.port || 1883}
                        onChange={(e) => setConfigState({ ...configState, port: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Client ID
                      </label>
                      <input
                        type="text"
                        value={configState.clientId || 'Orchestra_Studio'}
                        onChange={(e) => setConfigState({ ...configState, clientId: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Nível QoS (Quality of Service)
                      </label>
                      <select
                        value={configState.qos || 1}
                        onChange={(e) => setConfigState({ ...configState, qos: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold"
                      >
                        <option value={0}>QoS 0 - At most once</option>
                        <option value={1}>QoS 1 - At least once</option>
                        <option value={2}>QoS 2 - Exactly once</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* SAP ERP */}
              {activeConn.type === 'SAP' && (
                <div className="space-y-4">
                  <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-800 dark:text-sky-300 text-xs flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-sky-500" />
                    <span>Configuração de Conector SAP S/4HANA NCo RFC / BAPI</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Application Host (ashost)
                      </label>
                      <input
                        type="text"
                        value={configState.ashost || ''}
                        onChange={(e) => setConfigState({ ...configState, ashost: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        System Number (sysnr)
                      </label>
                      <input
                        type="text"
                        value={configState.sysnr || '00'}
                        onChange={(e) => setConfigState({ ...configState, sysnr: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Client Mandante
                      </label>
                      <input
                        type="text"
                        value={configState.client || '100'}
                        onChange={(e) => setConfigState({ ...configState, client: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Generic Raw View for other types */}
              {!['SQL Server', 'Oracle', 'PostgreSQL', 'MySQL', 'REST API', 'OPC UA', 'OPC DA', 'MQTT Broker', 'SAP'].includes(activeConn.type) && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-500/10 border border-slate-500/20 rounded-lg text-slate-800 dark:text-slate-300 text-xs flex items-center gap-2">
                    <Server className="w-4 h-4 text-slate-500" />
                    <span>Configuração Específica para Protocolo {activeConn.type}</span>
                  </div>

                  <div className="space-y-3 font-mono">
                    {Object.entries(configState).map(([k, v]) => (
                      <div key={k} className="grid grid-cols-3 gap-2 items-center">
                        <label className="font-semibold text-slate-600 dark:text-slate-400 capitalize">
                          {k}
                        </label>
                        <input
                          type="text"
                          value={typeof v === 'object' ? JSON.stringify(v) : String(v)}
                          onChange={(e) => setConfigState({ ...configState, [k]: e.target.value })}
                          className="col-span-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            Selecione uma conexão no menu lateral para abrir o designer.
          </div>
        )}
      </main>
    </div>
  );
};
