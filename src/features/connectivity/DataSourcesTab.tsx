import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Star,
  Copy,
  Trash2,
  Download,
  RefreshCw,
  Edit2,
  Database,
  Radio,
  Globe,
  FileText,
  MessageSquare,
  Briefcase,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Server,
  X,
} from 'lucide-react';
import { useConnectivityStore } from '../../store/useConnectivityStore';
import type {
  ConnectivityConnection,
  ConnectionCategory,
  ConnectionStatus,
} from '../../types/connectivity';

const categoryIcons: Record<ConnectionCategory, any> = {
  Database: Database,
  Industrial: Radio,
  'Enterprise ERP': Briefcase,
  'Messaging & Queue': MessageSquare,
  'Files & Storage': FileText,
  'Web APIs & Protocols': Globe,
  Utilities: Sliders,
};

export const DataSourcesTab: React.FC = () => {
  const {
    connections,
    addConnection,
    updateConnection,
    deleteConnection,
    duplicateConnection,
    toggleFavoriteConnection,
    testConnection,
  } = useConnectivityStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedEnv, setSelectedEnv] = useState<string>('All');
  const [selectedStatus] = useState<string>('All');
  const [editingConnection, setEditingConnection] = useState<ConnectivityConnection | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const filteredConnections = useMemo(() => {
    return connections.filter((conn) => {
      const matchesSearch =
        conn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conn.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conn.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'All' || conn.category === selectedCategory;
      const matchesEnv = selectedEnv === 'All' || conn.environment === selectedEnv;
      const matchesStatus = selectedStatus === 'All' || conn.status === selectedStatus;
      return matchesSearch && matchesCat && matchesEnv && matchesStatus;
    });
  }, [connections, searchQuery, selectedCategory, selectedEnv, selectedStatus]);

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    await testConnection(id);
    setTestingId(null);
  };

  const handleExportJson = (conn: ConnectivityConnection) => {
    const jsonStr = JSON.stringify(conn, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conn.name.toLowerCase().replace(/\s+/g, '_')}_datasource.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateNewSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const type = formData.get('type') as any;
    const category = formData.get('category') as any;
    const environment = formData.get('environment') as any;
    const description = formData.get('description') as string;

    addConnection({
      name,
      type,
      category,
      description,
      environment,
      status: 'Connected',
      lastCommunication: new Date().toISOString(),
      simulatedLatencyMs: 12,
      messagesProcessedCount: 0,
      msgPerSecond: 0,
      color: '#0284c7',
      icon: 'Server',
      tags: ['New'],
      notes: '',
      healthIndicator: 'Excellent',
      healthPercentage: 98,
      isFavorite: false,
      config: {},
    });

    setIsCreatingNew(false);
  };

  const statusBadge = (status: ConnectionStatus) => {
    switch (status) {
      case 'Connected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold text-xs border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Conectado</span>
          </span>
        );
      case 'Warning':
      case 'Degraded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-semibold text-xs border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Alerta / Degradado</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-500 font-semibold text-xs border border-red-500/20">
            <XCircle className="w-3.5 h-3.5" />
            <span>Desconectado</span>
          </span>
        );
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Main Table Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Filter Bar */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 shrink-0 select-none shadow-2xs">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar por nome, tipo ou descrição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100"
            >
              <option value="All">Todas Categorias</option>
              <option value="Database">Database</option>
              <option value="Industrial">Industrial</option>
              <option value="Enterprise ERP">Enterprise ERP</option>
              <option value="Messaging & Queue">Messaging & Queue</option>
              <option value="Files & Storage">Files & Storage</option>
              <option value="Web APIs & Protocols">Web APIs & Protocols</option>
            </select>

            <select
              value={selectedEnv}
              onChange={(e) => setSelectedEnv(e.target.value)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100"
            >
              <option value="All">Todos Ambientes</option>
              <option value="Production">Produção</option>
              <option value="Staging">Homologação</option>
              <option value="Development">Desenvolvimento</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">
              {filteredConnections.length} conexões
            </span>
            <button
              onClick={() => setIsCreatingNew(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-2xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Fonte de Dados</span>
            </button>
          </div>
        </div>

        {/* Compact Table View */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
                  <th className="py-3 px-4">Nome & Categoria</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Ambiente</th>
                  <th className="py-3 px-4">Latência</th>
                  <th className="py-3 px-4">Última Comunicação</th>
                  <th className="py-3 px-4 text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800 text-xs">
                {filteredConnections.map((conn) => {
                  const CatIcon = categoryIcons[conn.category] || Server;
                  const isTesting = testingId === conn.id;

                  return (
                    <tr
                      key={conn.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-100">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleFavoriteConnection(conn.id)}
                            className="text-slate-300 hover:text-amber-500 transition-colors"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                conn.isFavorite ? 'text-amber-500 fill-amber-500' : ''
                              }`}
                            />
                          </button>
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs font-bold"
                            style={{ backgroundColor: conn.color || '#0284c7' }}
                          >
                            <CatIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-100">
                              {conn.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {conn.category}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {conn.type}
                      </td>

                      <td className="py-3 px-4">{statusBadge(conn.status)}</td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {conn.environment}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {conn.simulatedLatencyMs} ms
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(conn.lastCommunication).toLocaleTimeString('pt-BR')}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-90 group-hover:opacity-100">
                          <button
                            onClick={() => handleTestConnection(conn.id)}
                            disabled={isTesting}
                            title="Testar Conexão"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                          >
                            <RefreshCw
                              className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-sky-500' : ''}`}
                            />
                          </button>
                          <button
                            onClick={() => setEditingConnection(conn)}
                            title="Editar Parâmetros"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => duplicateConnection(conn.id)}
                            title="Duplicar Conexão"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleExportJson(conn)}
                            title="Exportar JSON"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Deseja excluir a conexão "${conn.name}"?`)) {
                                deleteConnection(conn.id);
                              }
                            }}
                            title="Excluir"
                            className="p-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/20 text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Side Panel / Drawer for Editing Connection */}
      {editingConnection && (
        <aside className="w-96 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 select-none shadow-xl z-20">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-sky-500" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100">
                Editar Fonte de Dados
              </h3>
            </div>
            <button
              onClick={() => setEditingConnection(null)}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Nome da Conexão
              </label>
              <input
                type="text"
                value={editingConnection.name}
                onChange={(e) =>
                  setEditingConnection({ ...editingConnection, name: e.target.value })
                }
                className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100 font-semibold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Descrição
              </label>
              <textarea
                rows={3}
                value={editingConnection.description}
                onChange={(e) =>
                  setEditingConnection({ ...editingConnection, description: e.target.value })
                }
                className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Status
                </label>
                <select
                  value={editingConnection.status}
                  onChange={(e) =>
                    setEditingConnection({ ...editingConnection, status: e.target.value as any })
                  }
                  className="w-full px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100"
                >
                  <option value="Connected">Connected</option>
                  <option value="Warning">Warning</option>
                  <option value="Disconnected">Disconnected</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Ambiente
                </label>
                <select
                  value={editingConnection.environment}
                  onChange={(e) =>
                    setEditingConnection({
                      ...editingConnection,
                      environment: e.target.value as any,
                    })
                  }
                  className="w-full px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100"
                >
                  <option value="Production">Production</option>
                  <option value="Staging">Staging</option>
                  <option value="Development">Development</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-end gap-2">
            <button
              onClick={() => setEditingConnection(null)}
              className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                updateConnection(editingConnection.id, editingConnection);
                setEditingConnection(null);
              }}
              className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-2xs"
            >
              Salvar Alterações
            </button>
          </div>
        </aside>
      )}

      {/* Modal for Creating New Data Source */}
      {isCreatingNew && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-500" />
                <span>Nova Fonte de Dados</span>
              </h3>
              <button
                onClick={() => setIsCreatingNew(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome da Conexão
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Ex: DB_SQLServer_Producao"
                  className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tipo
                  </label>
                  <select
                    name="type"
                    className="w-full px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100"
                  >
                    <option value="SQL Server">SQL Server</option>
                    <option value="OPC UA">OPC UA</option>
                    <option value="MQTT Broker">MQTT Broker</option>
                    <option value="REST API">REST API</option>
                    <option value="PostgreSQL">PostgreSQL</option>
                    <option value="SAP">SAP</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Categoria
                  </label>
                  <select
                    name="category"
                    className="w-full px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100"
                  >
                    <option value="Database">Database</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Web APIs & Protocols">Web APIs & Protocols</option>
                    <option value="Enterprise ERP">Enterprise ERP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Ambiente
                </label>
                <select
                  name="environment"
                  className="w-full px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100"
                >
                  <option value="Production">Production</option>
                  <option value="Staging">Staging</option>
                  <option value="Development">Development</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Descrição
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Finalidade desta integração..."
                  className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-2xs"
                >
                  Cadastrar Fonte de Dados
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
