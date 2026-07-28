import React, { useState } from 'react';
import { Plus, Copy, Check, Trash2, Search } from 'lucide-react';
import { useConnectivityStore } from '../../store/useConnectivityStore';
import type { ConnectivityGlobalVariable } from '../../types/connectivity';
import { Modal } from '../../components/ui/Modal';

export const GlobalVariablesTab: React.FC = () => {
  const { globalVariables, addGlobalVariable, deleteGlobalVariable } = useConnectivityStore();

  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<ConnectivityGlobalVariable>>({
    name: '',
    type: 'String',
    value: '',
    description: '',
    category: 'General',
    environment: 'Production',
  });

  const handleCopyPlaceholder = (name: string, id: string) => {
    navigator.clipboard.writeText(`{{${name}}}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredVars = globalVariables.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-xs">
      {/* Header Toolbar */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar variáveis globais {{...}}"
              className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
            />
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold cursor-pointer shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nova Variável Global</span>
        </button>
      </div>

      {/* Grid of Global Variables */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVars.map((gvar) => (
          <div
            key={gvar.id}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold font-mono text-sm text-sky-600 dark:text-sky-400">
                  {`{{${gvar.name}}}`}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-[10px]">
                  {gvar.type}
                </span>
              </div>
              <p className="text-slate-500 text-[11px] mb-2">{gvar.description}</p>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-800/60 font-mono text-[11px] break-all">
                <span className="text-slate-400">Valor: </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {gvar.value}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => handleCopyPlaceholder(gvar.name, gvar.id)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 font-semibold rounded-lg hover:bg-sky-100 transition-colors"
              >
                {copiedId === gvar.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === gvar.id ? 'Copiado!' : 'Copiar {{...}}'}</span>
              </button>

              <button
                onClick={() => deleteGlobalVariable(gvar.id)}
                className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nova Variável */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastrar Variável Global Reutilizável"
        subtitle="Crie marcadores como {{NOME_VARIAVEL}} para uso nos pipelines"
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome da Variável (sem chaves)
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
              placeholder="ex: ERP_BASE_URL"
              className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
              >
                <option value="String">String</option>
                <option value="Number">Number</option>
                <option value="Boolean">Boolean</option>
                <option value="JSON">JSON</option>
                <option value="Date">Date</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor
              </label>
              <input
                type="text"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descrição
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (formData.name) {
                  addGlobalVariable({
                    name: formData.name,
                    type: formData.type || 'String',
                    value: formData.value || '',
                    description: formData.description || '',
                    category: 'Custom',
                    environment: 'Production',
                  });
                  setIsModalOpen(false);
                }
              }}
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold shadow-xs"
            >
              Salvar Variável
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
