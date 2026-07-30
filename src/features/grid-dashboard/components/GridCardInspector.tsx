import React from 'react';
import type { TankCardData, CardStatus } from '../types';
import { reRandomizeTankValues } from '../utils/mockGenerator';
import { X, RefreshCw, Trash2, Sliders, Eye, Palette } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface GridCardInspectorProps {
  card: TankCardData;
  onClose: () => void;
  onUpdateCard: (updatedCard: TankCardData) => void;
  onDeleteCard: (id: string) => void;
}

export const GridCardInspector: React.FC<GridCardInspectorProps> = ({
  card,
  onClose,
  onUpdateCard,
  onDeleteCard,
}) => {
  const handleStatusChange = (status: CardStatus) => {
    onUpdateCard({
      ...card,
      status,
    });
  };

  const handleToggleField = (field: keyof TankCardData['visibleFields']) => {
    onUpdateCard({
      ...card,
      visibleFields: {
        ...card.visibleFields,
        [field]: !card.visibleFields[field],
      },
    });
  };

  const handleReRandomize = () => {
    const updated = reRandomizeTankValues(card);
    onUpdateCard(updated);
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
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
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
              Título do Equipamento
            </label>
            <input
              type="text"
              value={card.title}
              onChange={(e) => onUpdateCard({ ...card, title: e.target.value })}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

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

          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
              Categoria / Tipo
            </label>
            <input
              type="text"
              value={card.category}
              onChange={(e) => onUpdateCard({ ...card, category: e.target.value })}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Status Operacional */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-sky-500" /> Status Operacional
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(['NORMAL', 'ATENÇÃO', 'CRITICAL'] as CardStatus[]).map((st) => (
              <button
                key={st}
                onClick={() => handleStatusChange(st)}
                className={cn(
                  "py-1.5 px-2 text-[10px] font-bold rounded-lg border transition-all uppercase font-mono",
                  card.status === st
                    ? st === 'CRITICAL'
                      ? "bg-red-500 text-white border-red-600 shadow-sm"
                      : st === 'ATENÇÃO'
                      ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                      : "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Exibição de Campos */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-sky-500" /> Exibição de Campos
          </label>

          <div className="space-y-2 text-xs">
            {[
              { key: 'showLevel', label: 'Percentual de Nível Medido' },
              { key: 'showPressure', label: 'Pressão (mbar)' },
              { key: 'showTemperature', label: 'Temperatura (°C)' },
              { key: 'showStrappingFactor', label: 'Fator de Arqueamento' },
              { key: 'showVolume', label: 'Volume Calculado' },
            ].map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <span className="text-slate-700 dark:text-slate-300">{label}</span>
                <input
                  type="checkbox"
                  checked={card.visibleFields[key as keyof TankCardData['visibleFields']]}
                  onChange={() => handleToggleField(key as keyof TankCardData['visibleFields'])}
                  className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 border-slate-300 dark:border-slate-700"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Ações Locais */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button
            onClick={handleReRandomize}
            className="w-full py-2 px-3 rounded-lg border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Regerar Dados Simulado
          </button>

          <button
            onClick={() => onDeleteCard(card.id)}
            className="w-full py-2 px-3 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Excluir Cartão da Grade
          </button>
        </div>
      </div>
    </div>
  );
};
