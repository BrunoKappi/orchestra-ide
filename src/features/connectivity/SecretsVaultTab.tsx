import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Plus,
  RefreshCw,
  Trash2,
  Search,
  Key,
  Lock,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useConnectivityStore } from '../../store/useConnectivityStore';
import type { ConnectivitySecret } from '../../types/connectivity';

export const SecretsVaultTab: React.FC = () => {
  const { secrets, rotateSecret, addSecret, deleteSecret } = useConnectivityStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSecretName, setNewSecretName] = useState('');
  const [newSecretCat, setNewSecretCat] = useState<ConnectivitySecret['category']>('Password');
  const [newSecretVal, setNewSecretVal] = useState('');
  const [newSecretDesc, setNewSecretDesc] = useState('');

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredSecrets = secrets.filter(
    (sec) =>
      sec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddSecretSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecretName.trim()) return;

    addSecret({
      name: newSecretName.trim(),
      category: newSecretCat,
      valueMasked: '••••••••••••••••',
      realValue: newSecretVal || 'secret-value-123',
      status: 'Active',
      associatedConnections: [],
      description: newSecretDesc || 'Credencial segura de integração',
    });

    setNewSecretName('');
    setNewSecretVal('');
    setNewSecretDesc('');
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Top Bar */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 shrink-0 select-none shadow-2xs">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por nome, categoria ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">
            {filteredSecrets.length} segredos
          </span>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Segredo</span>
          </button>
        </div>
      </div>

      {/* Secrets List Table */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
                <th className="py-3 px-4">Nome do Segredo</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Valor Mascarado</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Última Rotação</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800 text-xs">
              {filteredSecrets.map((sec) => {
                const isRevealed = revealedIds[sec.id];

                return (
                  <tr
                    key={sec.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>{sec.name}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                        {sec.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-[11px] text-slate-700 dark:text-slate-300">
                          {isRevealed ? sec.realValue : sec.valueMasked}
                        </span>
                        <button
                          onClick={() => toggleReveal(sec.id)}
                          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold text-xs border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{sec.status}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(sec.lastRotatedAt).toLocaleDateString('pt-BR')}
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-xs truncate max-w-xs">
                      {sec.description}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => rotateSecret(sec.id)}
                          title="Rotacionar Credencial"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Deseja excluir o segredo "${sec.name}"?`)) {
                              deleteSecret(sec.id);
                            }
                          }}
                          title="Excluir Segredo"
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

      {/* Modal for Adding New Secret */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Lock className="w-4 h-4 text-sky-500" />
                <span>Novo Segredo / Credencial</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSecretSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome da Chave
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: API_KEY_ORACLE_PROD"
                  value={newSecretName}
                  onChange={(e) => setNewSecretName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Categoria
                </label>
                <select
                  value={newSecretCat}
                  onChange={(e) => setNewSecretCat(e.target.value as any)}
                  className="w-full px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100"
                >
                  <option value="Password">Password / Senha</option>
                  <option value="API Token">API Token</option>
                  <option value="Connection String">Connection String</option>
                  <option value="OAuth Secret">OAuth Secret</option>
                  <option value="Private Key">Private Key</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Valor Sensível
                </label>
                <input
                  type="password"
                  required
                  placeholder="Digitar valor da senha ou chave API..."
                  value={newSecretVal}
                  onChange={(e) => setNewSecretVal(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  placeholder="Finalidade e escopo de uso..."
                  value={newSecretDesc}
                  onChange={(e) => setNewSecretDesc(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-2xs"
                >
                  Salvar Segredo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
