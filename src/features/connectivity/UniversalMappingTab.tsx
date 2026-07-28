import React, { useState, useMemo } from 'react';
import { Plus, ArrowLeftRight } from 'lucide-react';
import { useConnectivityStore } from '../../store/useConnectivityStore';
import { useObjectModelStore } from '../../store/useObjectModelStore';
import { useOpcStore } from '../../store/useOpcStore';
import type { ConnectivityMappingRule } from '../../types/connectivity';
import { Modal } from '../../components/ui/Modal';

export const UniversalMappingTab: React.FC = () => {
  const { mappingRules, addMappingRule } = useConnectivityStore();
  const { objects } = useObjectModelStore();
  const { nodes: opcNodes } = useOpcStore();

  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(
    mappingRules[0]?.id || null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeRule = useMemo(
    () => mappingRules.find((r) => r.id === selectedRuleId) || mappingRules[0],
    [mappingRules, selectedRuleId]
  );

  // Form modal state
  const [formData, setFormData] = useState<Partial<ConnectivityMappingRule>>({
    name: '',
    description: '',
    sourceModule: 'Orquestra Object',
    sourceEntity: objects[0]?.name || 'Tanque_Misturador_01',
    sourceField: 'Temperatura',
    targetModule: 'Object Property',
    targetEntity: objects[0]?.name || 'Tanque_Misturador_01',
    targetField: 'SetPoint',
    enabled: true,
  });

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-xs">
      {/* Top Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
        <div>
          <h2 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-sky-500" />
            <span>Universal Mapping Studio (Mapeamento Visual 3 Colunas)</span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Conecte entidades de Origem do Orquestra, aplique transformações intermediárias e mapeie para Destinos
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold cursor-pointer shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo Mapeamento</span>
        </button>
      </div>

      {/* Rules Selector Bar */}
      <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60 flex items-center gap-2 overflow-x-auto shrink-0">
        <span className="font-bold text-slate-500 text-[11px] shrink-0">Mapeamentos:</span>
        {mappingRules.map((rule) => (
          <button
            key={rule.id}
            onClick={() => setSelectedRuleId(rule.id)}
            className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all shrink-0 ${
              activeRule?.id === rule.id
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {rule.name}
          </button>
        ))}
      </div>

      {/* 3 Columns Universal Visual Mapper Workspace */}
      {activeRule ? (
        <div className="flex-1 grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800 overflow-hidden bg-white dark:bg-slate-900">
          {/* Column 1: ORIGEM (Source) */}
          <div className="flex flex-col overflow-hidden p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                  COLUNA 1: ORIGEM (SOURCE)
                </h3>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-semibold px-2 py-0.5 rounded">
                {activeRule.sourceModule}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
              <div>
                <span className="text-[11px] text-slate-400">Entidade Selecionada:</span>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {activeRule.sourceEntity}
                </h4>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-mono">
                <span className="text-slate-400">Propriedade/Campo: </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {activeRule.sourceField}
                </span>
              </div>
            </div>

            {/* Available Platform Entities List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              <h4 className="font-semibold text-slate-500 text-[11px]">
                Entidades Disponíveis no Orquestra
              </h4>

              <div className="space-y-1.5 font-mono text-[11px]">
                {objects.map((obj) => (
                  <div
                    key={obj.id}
                    className="p-2 rounded bg-slate-100 dark:bg-slate-800/60 flex items-center justify-between text-slate-700 dark:text-slate-300"
                  >
                    <span className="truncate">Objeto: {obj.name}</span>
                    <span className="text-[9px] text-sky-500 font-bold">Orquestra</span>
                  </div>
                ))}
                {opcNodes.slice(0, 3).map((node: any) => (
                  <div
                    key={node.id}
                    className="p-2 rounded bg-slate-100 dark:bg-slate-800/60 flex items-center justify-between text-slate-700 dark:text-slate-300"
                  >
                    <span className="truncate">Tag OPC: {node.name}</span>
                    <span className="text-[9px] text-emerald-500 font-bold">OPC UA</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: TRANSFORMAÇÕES (Central Pipeline) */}
          <div className="flex flex-col overflow-hidden p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sky-500" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                  COLUNA 2: TRANSFORMAÇÕES
                </h3>
              </div>
              <span className="text-[10px] bg-sky-500/10 text-sky-600 font-semibold px-2 py-0.5 rounded">
                {activeRule.transformations.length} Etapas
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {activeRule.transformations.map((step, idx) => (
                <div
                  key={step.id}
                  className="p-3 rounded-xl border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900 shadow-xs space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-600 dark:text-sky-400">
                      Etapa {idx + 1}: {step.name}
                    </span>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                      {step.type}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded font-mono text-[10px] text-slate-500">
                    Config: {JSON.stringify(step.config)}
                  </div>
                </div>
              ))}

              <div className="p-3 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-xl text-center text-slate-400 font-semibold cursor-pointer hover:border-sky-500 transition-colors">
                + Adicionar Etapa de Conversão/Cálculo
              </div>
            </div>
          </div>

          {/* Column 3: DESTINO (Target) */}
          <div className="flex flex-col overflow-hidden p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                  COLUNA 3: DESTINO (TARGET)
                </h3>
              </div>
              <span className="text-[10px] bg-purple-500/10 text-purple-600 font-semibold px-2 py-0.5 rounded">
                {activeRule.targetModule}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-3">
              <div>
                <span className="text-[11px] text-slate-400">Entidade Destino:</span>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {activeRule.targetEntity}
                </h4>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-mono">
                <span className="text-slate-400">Campo Mapeado: </span>
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  {activeRule.targetField}
                </span>
              </div>
            </div>

            {/* Target Modules List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              <h4 className="font-semibold text-slate-500 text-[11px]">
                Módulos de Destino Suportados
              </h4>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold">
                {['Object Property', 'OMM Variable', 'Widget', 'Faceplate', 'Database', 'Alarm', 'Event', 'KPI'].map((mod) => (
                  <div
                    key={mod}
                    className="p-2 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-center"
                  >
                    {mod}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal Novo Mapeamento */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Criar Mapeamento Universal"
        subtitle="Mapeie Origem -> Transformação -> Destino entre módulos do Orquestra"
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome do Mapeamento
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="ex: Mapeamento_OPC_para_Tanque"
              className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Módulo de Origem
              </label>
              <select
                value={formData.sourceModule}
                onChange={(e) => setFormData({ ...formData, sourceModule: e.target.value as any })}
                className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
              >
                <option value="Orquestra Object">Orquestra Object</option>
                <option value="OPC Tag">OPC Tag Browser</option>
                <option value="Runtime Variable">Runtime Variable</option>
                <option value="OMM Movement">OMM Movement</option>
                <option value="Simulator">Simulator Tag</option>
                <option value="Quality">Quality Module Field</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Entidade / Tag de Origem
              </label>
              <input
                type="text"
                value={formData.sourceEntity}
                onChange={(e) => setFormData({ ...formData, sourceEntity: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
              />
            </div>
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
                  addMappingRule({
                    name: formData.name,
                    description: formData.description || 'Novo mapeamento universal',
                    sourceModule: formData.sourceModule || 'Orquestra Object',
                    sourceEntity: formData.sourceEntity || 'Tanque_01',
                    sourceField: 'Temperatura',
                    transformations: [
                      { id: 't1', type: 'Converter', name: 'Format Float', config: { precision: 2 } },
                    ],
                    targetModule: formData.targetModule || 'Object Property',
                    targetEntity: formData.targetEntity || 'Tanque_01',
                    targetField: 'SetPoint',
                    enabled: true,
                  });
                  setIsModalOpen(false);
                }
              }}
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold shadow-xs"
            >
              Salvar Mapeamento
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
