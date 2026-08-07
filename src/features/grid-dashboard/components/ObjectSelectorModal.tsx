import React, { useState, useMemo } from 'react';
import { Search, X, Gauge, Check } from 'lucide-react';
import { useObjectModelStore } from '../../../store/useObjectModelStore';
import { cn } from '../../../utils/cn';

interface ObjectSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (objectId: string) => void;
  alreadySelectedIds?: string[];
}

export const ObjectSelectorModal: React.FC<ObjectSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  alreadySelectedIds = [],
}) => {
  const { objects, templates, simulatedValues } = useObjectModelStore();
  const [search, setSearch] = useState('');

  const filteredObjects = useMemo(() => {
    const q = search.toLowerCase();
    return objects.filter((o) => {
      const tmpl = templates.find((t) => t.id === o.templateId);
      const templateName = tmpl?.name ?? '';
      return (
        o.name.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q) ||
        templateName.toLowerCase().includes(q)
      );
    });
  }, [objects, templates, search]);

  if (!isOpen) return null;

  const getLevel = (objId: string) => {
    const key = `${objId}:Level`;
    const val = simulatedValues[key];
    return val != null ? parseFloat(val) : null;
  };

  const getStatus = (level: number | null): { color: string; label: string } => {
    if (level == null) return { color: '#64748b', label: 'N/D' };
    if (level >= 90) return { color: '#ef4444', label: 'CRÍTICO' };
    if (level >= 80) return { color: '#f97316', label: 'ALERTA' };
    if (level <= 5) return { color: '#ef4444', label: 'CRÍTICO' };
    if (level <= 15) return { color: '#eab308', label: 'ATENÇÃO' };
    return { color: '#10b981', label: 'NORMAL' };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Selecionar Equipamento
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Escolha um objeto para vincular ao card do Grid Designer
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por TAG, nome ou template..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/30 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
              autoFocus
            />
          </div>
        </div>

        {/* Object List */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {filteredObjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Gauge className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-xs font-medium">Nenhum equipamento encontrado</p>
              <p className="text-[11px] opacity-60 mt-1">
                Crie objetos no Orquestra IDE primeiro
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filteredObjects.map((obj) => {
                const level = getLevel(obj.id);
                const { color, label } = getStatus(level);
                const tmpl = templates.find((t) => t.id === obj.templateId);
                const isSelected = alreadySelectedIds.includes(obj.id);

                return (
                  <button
                    key={obj.id}
                    onClick={() => {
                      if (!isSelected) {
                        onSelect(obj.id);
                        onClose();
                      }
                    }}
                    disabled={isSelected}
                    className={cn(
                      'relative text-left p-3 rounded-xl border transition-all duration-150',
                      isSelected
                        ? 'border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50'
                        : 'border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-sky-950/20 cursor-pointer bg-white dark:bg-slate-900',
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}

                    {/* Status bar */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                      style={{ backgroundColor: color }}
                    />

                    <div className="pl-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-mono font-bold tracking-wider text-sky-600 dark:text-sky-400 uppercase">
                          {obj.name}
                        </span>
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${color}20`,
                            color,
                            border: `1px solid ${color}40`,
                          }}
                        >
                          {label}
                        </span>
                      </div>

                      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate">
                        {obj.description || obj.name}
                      </p>

                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {tmpl?.name ?? 'Sem template'}
                      </p>

                      {level != null && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                            <span className="text-slate-400">Nível</span>
                            <span className="font-bold" style={{ color }}>
                              {level.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, level)}%`, backgroundColor: color }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>{filteredObjects.length} equipamentos disponíveis</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
