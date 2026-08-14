import React from 'react';
import { useBatchStore } from '../../../../store/useBatchStore';
import { useOmmStore } from '../../store/useOmmStore';
import { Sliders, X, Settings, Trash2 } from 'lucide-react';

export const BatchStepInspector: React.FC = () => {
  const {
    recipes,
    selectedRecipeId,
    selectedNodeId,
    setSelectedNodeId,
    updateRecipeNodesEdges,
    subTab,
    activeBatch,
  } = useBatchStore();

  const { equipments, products } = useOmmStore();

  const currentRecipe = recipes.find((r) => r.id === selectedRecipeId);
  const selectedNode = currentRecipe?.nodes.find((n) => n.id === selectedNodeId);

  const deleteSelectedNode = () => {
    if (!currentRecipe || !selectedNodeId || isReadOnly) return;
    const nextNodes = currentRecipe.nodes.filter((n) => n.id !== selectedNodeId);
    const nextEdges = currentRecipe.edges.filter(
      (e) => e.source !== selectedNodeId && e.target !== selectedNodeId
    );
    updateRecipeNodesEdges(currentRecipe.id, nextNodes, nextEdges);
    setSelectedNodeId(null);
  };

  const isReadOnly = subTab === 'monitor' && activeBatch?.status === 'running';

  if (!selectedNode) {
    return null;
  }

  const stepType = selectedNode.data.stepType as string;
  const label = (selectedNode.data.label as string) || '';
  const description = (selectedNode.data.description as string) || '';

  const updateNodeData = (updates: Record<string, any>) => {
    if (!currentRecipe || !selectedNodeId || isReadOnly) return;
    const nextNodes = currentRecipe.nodes.map((node) => {
      if (node.id === selectedNodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            ...updates,
          },
        };
      }
      return node;
    });
    updateRecipeNodesEdges(currentRecipe.id, nextNodes, currentRecipe.edges);
  };

  return (
    <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full shrink-0 shadow-xl z-10 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 select-none">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-sky-500" />
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-250 uppercase tracking-wider">
            Propriedades da Etapa
          </h3>
        </div>
        <button
          onClick={() => setSelectedNodeId(null)}
          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-450 dark:text-slate-500 hover:text-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Fields scrollable container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-700 dark:text-slate-350 text-xs">
        {/* Info Box for Running batch */}
        {isReadOnly && (
          <div className="p-3 bg-amber-500/10 border border-amber-550/20 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-700 dark:text-amber-400">
            <span className="text-base select-none">⚠️</span>
            <div>
              <p className="font-bold">Lote em Execução</p>
              <p className="text-[10px] mt-0.5 opacity-90 leading-tight">
                As configurações desta etapa estão bloqueadas para edição estrutural no momento.
              </p>
            </div>
          </div>
        )}

        {/* Common Info */}
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1">
              Nome da Etapa
            </label>
            <input
              type="text"
              value={label}
              disabled={isReadOnly}
              onChange={(e) => updateNodeData({ label: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 transition-shadow disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1">
              Descrição
            </label>
            <textarea
              value={description}
              disabled={isReadOnly}
              onChange={(e) => updateNodeData({ description: e.target.value })}
              rows={2}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none disabled:opacity-60"
            />
          </div>
        </div>

        {/* Parameters by type */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
            <Sliders className="w-3.5 h-3.5" />
            <span>Fórmula de Processo</span>
          </div>

          {stepType === 'start' && (
            <div className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl text-[10px] text-slate-450 italic">
              Ponto de entrada inicial da sequência lógica do processo. Não requer configurações operacionais.
            </div>
          )}

          {stepType === 'end' && (
            <div className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl text-[10px] text-slate-450 italic">
              Ponto de término do lote. Conclui as execuções contidas e gera os relatórios.
            </div>
          )}

          {stepType === 'transfer' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1">
                  Tanque de Origem
                </label>
                <select
                  value={selectedNode.data.originId as string || ''}
                  disabled={isReadOnly}
                  onChange={(e) => updateNodeData({ originId: e.target.value })}
                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60 cursor-pointer"
                >
                  <option value="">Selecione a Origem...</option>
                  {equipments.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.tag} — {eq.name} ({eq.capacity} m³)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1">
                  Tanque de Destino
                </label>
                <select
                  value={selectedNode.data.destinationId as string || ''}
                  disabled={isReadOnly}
                  onChange={(e) => updateNodeData({ destinationId: e.target.value })}
                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60 cursor-pointer"
                >
                  <option value="">Selecione o Destino...</option>
                  {equipments.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.tag} — {eq.name} ({eq.capacity} m³)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1">
                  Produto
                </label>
                <select
                  value={selectedNode.data.productId as string || ''}
                  disabled={isReadOnly}
                  onChange={(e) => updateNodeData({ productId: e.target.value })}
                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60 cursor-pointer"
                >
                  <option value="">Selecione o Produto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1">
                    Volume (m³)
                  </label>
                  <input
                    type="number"
                    value={selectedNode.data.plannedVolume as number || ''}
                    disabled={isReadOnly}
                    onChange={(e) => updateNodeData({ plannedVolume: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1">
                    Vazão (m³/h)
                  </label>
                  <input
                    type="number"
                    value={selectedNode.data.plannedFlow as number || ''}
                    disabled={isReadOnly}
                    onChange={(e) => updateNodeData({ plannedFlow: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
                  />
                </div>
              </div>
            </div>
          )}

          {stepType === 'agitate' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1">
                  Vaso / Agitador
                </label>
                <select
                  value={selectedNode.data.vesselId as string || ''}
                  disabled={isReadOnly}
                  onChange={(e) => updateNodeData({ vesselId: e.target.value })}
                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60 cursor-pointer"
                >
                  <option value="">Selecione o Vaso...</option>
                  {equipments.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.tag} — {eq.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1">
                    Velocidade (RPM)
                  </label>
                  <input
                    type="number"
                    value={selectedNode.data.agitatorSpeedRpm as number || ''}
                    disabled={isReadOnly}
                    onChange={(e) => updateNodeData({ agitatorSpeedRpm: parseInt(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1">
                    Duração (s)
                  </label>
                  <input
                    type="number"
                    value={selectedNode.data.durationSeconds as number || ''}
                    disabled={isReadOnly}
                    onChange={(e) => updateNodeData({ durationSeconds: parseInt(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
                  />
                </div>
              </div>
            </div>
          )}

          {stepType === 'heat' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1">
                  Equipamento
                </label>
                <select
                  value={selectedNode.data.heatVesselId as string || ''}
                  disabled={isReadOnly}
                  onChange={(e) => updateNodeData({ heatVesselId: e.target.value })}
                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60 cursor-pointer"
                >
                  <option value="">Selecione o Vaso...</option>
                  {equipments.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.tag} — {eq.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1">
                    Temp. Alvo (°C)
                  </label>
                  <input
                    type="number"
                    value={selectedNode.data.targetTemperature as number || ''}
                    disabled={isReadOnly}
                    onChange={(e) => updateNodeData({ targetTemperature: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1">
                    Taxa (°C/s)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={selectedNode.data.heatingRate as number || ''}
                    disabled={isReadOnly}
                    onChange={(e) => updateNodeData({ heatingRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
                  />
                </div>
              </div>
            </div>
          )}

          {stepType === 'cool' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1">
                  Vaso / Resfriador
                </label>
                <select
                  value={selectedNode.data.heatVesselId as string || ''}
                  disabled={isReadOnly}
                  onChange={(e) => updateNodeData({ heatVesselId: e.target.value })}
                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60 cursor-pointer"
                >
                  <option value="">Selecione o Vaso...</option>
                  {equipments.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.tag} — {eq.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1">
                    Temp. Alvo (°C)
                  </label>
                  <input
                    type="number"
                    value={selectedNode.data.targetTemperature as number || ''}
                    disabled={isReadOnly}
                    onChange={(e) => updateNodeData({ targetTemperature: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1">
                    Resfriar (°C/s)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={selectedNode.data.coolingRate as number || ''}
                    disabled={isReadOnly}
                    onChange={(e) => updateNodeData({ coolingRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
                  />
                </div>
              </div>
            </div>
          )}

          {stepType === 'cip' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1">
                  Vaso para Limpeza (CIP)
                </label>
                <select
                  value={selectedNode.data.vesselId as string || ''}
                  disabled={isReadOnly}
                  onChange={(e) => updateNodeData({ vesselId: e.target.value })}
                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60 cursor-pointer"
                >
                  <option value="">Selecione o Vaso...</option>
                  {equipments.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.tag} — {eq.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1">
                  Agente de Limpeza
                </label>
                <select
                  value={selectedNode.data.cipAgent as string || ''}
                  disabled={isReadOnly}
                  onChange={(e) => updateNodeData({ cipAgent: e.target.value })}
                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60 cursor-pointer"
                >
                  <option value="">Selecione o Agente...</option>
                  <option value="Soda (NaOH) 2%">Soda (NaOH) 2%</option>
                  <option value="Ácido Nítrico (HNO3) 1%">Ácido Nítrico (HNO3) 1%</option>
                  <option value="Água Purificada (PW)">Água Purificada (PW)</option>
                  <option value="Detergente Neutro">Detergente Neutro</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1">
                  Duração (s)
                </label>
                <input
                  type="number"
                  value={selectedNode.data.durationSeconds as number || ''}
                  disabled={isReadOnly}
                  onChange={(e) => updateNodeData({ durationSeconds: parseInt(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
                />
              </div>
            </div>
          )}

          {stepType === 'separate' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1">
                  Vaso para Separação
                </label>
                <select
                  value={selectedNode.data.vesselId as string || ''}
                  disabled={isReadOnly}
                  onChange={(e) => updateNodeData({ vesselId: e.target.value })}
                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60 cursor-pointer"
                >
                  <option value="">Selecione o Vaso...</option>
                  {equipments.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.tag} — {eq.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1">
                  Método de Separação
                </label>
                <select
                  value={selectedNode.data.separationMethod as string || ''}
                  disabled={isReadOnly}
                  onChange={(e) => updateNodeData({ separationMethod: e.target.value })}
                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60 cursor-pointer"
                >
                  <option value="">Selecione o Método...</option>
                  <option value="Decantação Estática">Decantação Estática</option>
                  <option value="Filtração por Cartucho">Filtração por Cartucho</option>
                  <option value="Centrifugação">Centrifugação</option>
                  <option value="Separação Magnética">Separação Magnética</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1">
                  Duração (s)
                </label>
                <input
                  type="number"
                  value={selectedNode.data.durationSeconds as number || ''}
                  disabled={isReadOnly}
                  onChange={(e) => updateNodeData({ durationSeconds: parseInt(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
                />
              </div>
            </div>
          )}

          {stepType === 'cutoff' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1">
                  Notas de Fechamento
                </label>
                <textarea
                  value={selectedNode.data.cutoffNotes as string || ''}
                  disabled={isReadOnly}
                  onChange={(e) => updateNodeData({ cutoffNotes: e.target.value })}
                  rows={3}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none disabled:opacity-60"
                  placeholder="Instruções para o Cut-off contábil..."
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions (Delete Node) */}
      {!isReadOnly && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 flex justify-end shrink-0">
          <button
            onClick={deleteSelectedNode}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-[11px] rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Excluir Etapa</span>
          </button>
        </div>
      )}
    </div>
  );
};
