import React from "react";
import type { TankCardData } from "../types";
import { X, Trash2, Sliders, Eye, TrendingUp } from "lucide-react";

interface GridCardInspectorProps {
  card: TankCardData;
  onClose: () => void;
  onUpdateCard: (updatedCard: TankCardData) => void;
  onDeleteCard: (id: string) => void;
  onEditTrendVariables?: () => void;
}

export const GridCardInspector: React.FC<GridCardInspectorProps> = ({
  card,
  onClose,
  onUpdateCard,
  onDeleteCard,
  onEditTrendVariables,
}) => {

  return (
    <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16171b] flex flex-col h-full shadow-xl z-20 transition-all">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-500" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
            Propriedades do Cartão
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-5 overflow-y-auto">
        {/* Identificação */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Identificação
          </label>

          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
              {card.isTrend ? "Título do Gráfico" : "Título do Equipamento"}
            </label>
            <input
              type="text"
              value={card.title}
              onChange={(e) => onUpdateCard({ ...card, title: e.target.value })}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Conditional Configuration Sections */}
        {card.cardType === 'command' ? (
          <>
            {/* Configurações do Comando */}
            <div className="space-y-3.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                Configurações do Comando
              </label>

              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                  Label do Comando
                </label>
                <input
                  type="text"
                  value={card.commandConfig?.commandLabel || ""}
                  onChange={(e) => {
                    if (card.commandConfig) {
                      onUpdateCard({
                        ...card,
                        commandConfig: { ...card.commandConfig, commandLabel: e.target.value },
                        title: e.target.value,
                      });
                    }
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">Exigir Confirmação</span>
                <input
                  type="checkbox"
                  checked={card.commandConfig?.confirmBeforeExecute || false}
                  onChange={() => {
                    if (card.commandConfig) {
                      onUpdateCard({
                        ...card,
                        commandConfig: { ...card.commandConfig, confirmBeforeExecute: !card.commandConfig.confirmBeforeExecute },
                      });
                    }
                  }}
                  className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 border-slate-300 dark:border-slate-700"
                />
              </label>

              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-[10px] text-slate-400 font-mono">
                <div>Objeto: {card.commandConfig?.objectName}</div>
                <div>Propriedade: {card.commandConfig?.propertyName}</div>
                <div>Tipo: {card.commandConfig?.dataType}</div>
              </div>
            </div>
          </>
        ) : card.cardType === 'alert' ? (
          <>
            {/* Configurações do Alerta */}
            <div className="space-y-3.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                Configurações do Painel
              </label>

              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                  Máximo de Alertas Exibidos
                </label>
                <select
                  value={card.alertConfig?.maxItems || 5}
                  onChange={(e) => {
                    if (card.alertConfig) {
                      onUpdateCard({
                        ...card,
                        alertConfig: { ...card.alertConfig, maxItems: parseInt(e.target.value) || 5 },
                      });
                    }
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {[3, 5, 8, 10].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">Exibir Alertas Encerrados</span>
                <input
                  type="checkbox"
                  checked={card.alertConfig?.showResolved || false}
                  onChange={() => {
                    if (card.alertConfig) {
                      onUpdateCard({
                        ...card,
                        alertConfig: { ...card.alertConfig, showResolved: !card.alertConfig.showResolved },
                      });
                    }
                  }}
                  className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 border-slate-300 dark:border-slate-700"
                />
              </label>

              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-[10px] text-slate-400 font-mono">
                <div>Escopo: {card.alertConfig?.scopeType === 'all' ? 'Global (Todos)' : card.alertConfig?.scopeType === 'object' ? 'Por Objeto' : 'Por Área'}</div>
                {card.alertConfig?.scopeType !== 'all' && <div>Origem: {card.alertConfig?.scopeName}</div>}
              </div>
            </div>
          </>
        ) : card.cardType === 'kpi' ? (
          <>
            {/* Configurações do Indicador */}
            <div className="space-y-3.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                Configurações da Meta
              </label>

              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                  Valor da Meta
                </label>
                <input
                  type="number"
                  value={card.kpiConfig?.goalValue !== null && card.kpiConfig?.goalValue !== undefined ? card.kpiConfig.goalValue : ""}
                  onChange={(e) => {
                    if (card.kpiConfig) {
                      const val = parseFloat(e.target.value);
                      onUpdateCard({
                        ...card,
                        kpiConfig: { ...card.kpiConfig, goalValue: isNaN(val) ? null : val },
                      });
                    }
                  }}
                  placeholder="Nenhuma meta de referência"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                  Tipo de Meta
                </label>
                <select
                  value={card.kpiConfig?.goalType || "max"}
                  onChange={(e) => {
                    if (card.kpiConfig) {
                      onUpdateCard({
                        ...card,
                        kpiConfig: { ...card.kpiConfig, goalType: e.target.value as any },
                      });
                    }
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="max">Maximizar (Maior é melhor)</option>
                  <option value="min">Minimizar (Menor é melhor)</option>
                  <option value="reference">Referência (Sem julgamento)</option>
                </select>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-[10px] text-slate-400 font-mono">
                <div>Objeto: {card.kpiConfig?.objectName}</div>
                <div>Propriedade: {card.kpiConfig?.propertyName}</div>
                {card.kpiConfig?.unit && <div>Unidade: {card.kpiConfig.unit}</div>}
              </div>
            </div>
          </>
        ) : card.isTrend || card.cardType === 'trend' ? (
          <>
            {/* Variáveis no Gráfico */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-sky-500" /> Variáveis no Gráfico
              </label>

              {onEditTrendVariables && (
                <button
                  onClick={onEditTrendVariables}
                  className="w-full py-1.5 px-3 rounded-lg border border-sky-500/20 dark:border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-655 dark:text-sky-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer mb-2"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Editar Variáveis do Gráfico
                </button>
              )}
              
              <div className="space-y-2">
                {(card.trendProperties || []).map((prop) => {
                  const color = prop.color || '#3b82f6';
                  return (
                    <div
                      key={`${prop.objectId}-${prop.propertyName}`}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs font-semibold text-slate-705 dark:text-slate-250 truncate font-mono">
                          {prop.label}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => {
                          const updated = (card.trendProperties || []).filter(
                            (p) => !(p.objectId === prop.objectId && p.propertyName === prop.propertyName)
                          );
                          onUpdateCard({
                            ...card,
                            trendProperties: updated,
                            title: updated.length === 1
                              ? `Tendência de ${updated[0].label}`
                              : updated.length > 1
                                ? `Gráfico de Tendência (${updated.length} var)`
                                : "Gráfico de Tendência"
                          });
                        }}
                        className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0 transition-colors"
                        title="Remover do gráfico"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
                {(!card.trendProperties || card.trendProperties.length === 0) && (
                  <p className="text-[11px] text-slate-400 italic">
                    Nenhuma variável configurada neste gráfico.
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Exibição de Campos */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-sky-500" /> Exibição de Campos (Bindings)
              </label>

              <div className="space-y-2 text-xs">
                {(card.fieldBindings || []).map((binding, idx) => (
                  <label
                    key={binding.propertyName || idx}
                    className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <span className="text-slate-700 dark:text-slate-300 font-mono font-semibold">
                      {binding.label} ({binding.propertyName})
                    </span>
                    <input
                      type="checkbox"
                      checked={binding.visible}
                      onChange={() => {
                        const newBindings = [...card.fieldBindings];
                        newBindings[idx] = {
                          ...newBindings[idx],
                          visible: !newBindings[idx].visible,
                        };
                        onUpdateCard({ ...card, fieldBindings: newBindings });
                      }}
                      className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 border-slate-300 dark:border-slate-700"
                    />
                  </label>
                ))}
                {(!card.fieldBindings || card.fieldBindings.length === 0) && (
                  <p className="text-[11px] text-slate-400">
                    Nenhum binding ativo no momento.
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Ações Locais */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button
            onClick={() => onDeleteCard(card.id)}
            className="w-full py-2 px-3 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold text-xs flex items-center justify-center gap-2 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
            Remover da Grade
          </button>
        </div>
      </div>
    </div>
  );
};

