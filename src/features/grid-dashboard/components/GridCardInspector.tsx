import React from "react";
import type { TankCardData, CardStatus } from "../types";
import { X, Trash2, Sliders, Eye, Palette, TrendingUp } from "lucide-react";
import { cn } from "../../../utils/cn";

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
  const handleStatusChange = (status: CardStatus) => {
    onUpdateCard({
      ...card,
      status,
    });
  };

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

          {!card.isTrend && (
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                Tag (Código)
              </label>
              <input
                type="text"
                value={card.tag}
                onChange={(e) => onUpdateCard({ ...card, tag: e.target.value })}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
              Categoria / Tipo
            </label>
            <input
              type="text"
              value={card.category}
              onChange={(e) =>
                onUpdateCard({ ...card, category: e.target.value })
              }
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Conditional Configuration Sections */}
        {!card.isTrend ? (
          <>
            {/* Status Operacional */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-sky-500" /> Status Operacional
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["NORMAL", "ATENÇÃO", "CRITICAL"] as CardStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className={cn(
                      "py-1.5 px-2 text-[10px] font-bold rounded-lg border transition-all uppercase font-mono",
                      card.status === st
                        ? st === "CRITICAL"
                          ? "bg-red-500 text-white border-red-600 shadow-sm"
                          : st === "ATENÇÃO"
                            ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                            : "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
                    )}>
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Exibição de Campos */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-sky-500" /> Exibição de Campos
                (Bindings)
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
        ) : (
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
        )}

        {/* Ações Locais */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button
            onClick={() => onDeleteCard(card.id)}
            className="w-full py-2 px-3 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold text-xs flex items-center justify-center gap-2 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
            {card.isTrend ? "Excluir Gráfico da Grade" : "Excluir Cartão da Grade"}
          </button>
        </div>
      </div>
    </div>
  );
};
