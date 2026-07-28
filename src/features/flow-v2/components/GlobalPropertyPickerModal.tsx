import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Database,
  Check,
  Boxes,
  Box,
  SlidersHorizontal,
  Bell,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { useObjectModelStore } from '../../../store/useObjectModelStore';
import { propertyBrowserService } from '../../../services/PropertyBrowserService';
import type { IndexedProperty } from '../../../services/PropertyBrowserService';
import { screenRepo } from '../../../repository/ScreenRepository';
import { associatedWidgetRepo } from '../../../repository/AssociatedWidgetRepository';
import { mockConfigRepo } from '../../../repository/MockConfigRepository';
import { cn } from '../../../utils/cn';

interface GlobalPropertyPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProperty: (property: IndexedProperty) => void;
  selectedPropertyId?: string;
  allowedDataTypes?: string[];
}

export const GlobalPropertyPickerModal: React.FC<GlobalPropertyPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectProperty,
  selectedPropertyId,
  allowedDataTypes,
}) => {
  const { templates, objects } = useObjectModelStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [dataTypeFilter, setDataTypeFilter] = useState<string>('ALL');
  const [targetTypeFilter, setTargetTypeFilter] = useState<'all' | 'template' | 'instance'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Rebuild property browser index on mount / store updates
  useEffect(() => {
    propertyBrowserService.rebuildIndex(
      templates,
      objects,
      screenRepo.getAll(),
      associatedWidgetRepo.getAll(),
      mockConfigRepo.getAll()
    );
  }, [templates, objects]);

  if (!isOpen) return null;

  const allIndex = propertyBrowserService.getIndex();

  const categories = Array.from(new Set(allIndex.map((p) => p.category || 'Geral')));

  const filteredProperties = propertyBrowserService.search(searchQuery, {
    dataType: dataTypeFilter,
    targetType: targetTypeFilter,
    category: categoryFilter,
  }).filter((p) => {
    if (allowedDataTypes && allowedDataTypes.length > 0) {
      return allowedDataTypes.includes(p.dataType);
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Property Browser Global</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-bold border border-sky-200/50">
                  {filteredProperties.length} encontradas
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Selecione uma variável do modelo de objetos ou templates do Orquestra IDE
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Quick Filters Bar */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por nome da propriedade, objeto, template, descrição ou tipo..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-sky-500 text-slate-900 dark:text-slate-100 transition-colors"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            
            {/* Target Type Filter */}
            <select
              value={targetTypeFilter}
              onChange={(e) => setTargetTypeFilter(e.target.value as any)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="all">Todos Contextos</option>
              <option value="instance">Objetos (Instâncias)</option>
              <option value="template">Templates (Modelos)</option>
            </select>

            {/* Data Type Filter */}
            <select
              value={dataTypeFilter}
              onChange={(e) => setDataTypeFilter(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="ALL">Todos Tipos de Dado</option>
              <option value="String">String</option>
              <option value="Boolean">Boolean</option>
              <option value="Integer">Integer</option>
              <option value="Float">Float</option>
              <option value="Date">Date</option>
              <option value="Enum">Enum</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="ALL">Todas Categorias</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 bg-slate-50/50 dark:bg-slate-900/50">
          {filteredProperties.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Database className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
              <span>Nenhuma propriedade encontrada para os filtros aplicados.</span>
            </div>
          ) : (
            filteredProperties.map((prop) => {
              const isSelected = selectedPropertyId === prop.id || selectedPropertyId === `${prop.targetName}.${prop.name}`;
              return (
                <div
                  key={prop.id}
                  onClick={() => {
                    onSelectProperty(prop);
                    onClose();
                  }}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group',
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:border-sky-400 hover:shadow-xs'
                  )}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5',
                        prop.targetType === 'template'
                          ? 'bg-sky-500/10 border-sky-500/20 text-sky-500'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                      )}
                    >
                      {prop.targetType === 'template' ? <Boxes className="w-4 h-4" /> : <Box className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {prop.targetName}.{prop.name}
                        </span>

                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400">
                          {prop.dataType}
                        </span>

                        {prop.isOverridden && (
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                            Override
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {prop.description || `Propriedade ${prop.category} em ${prop.targetName}`}
                      </p>

                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400 font-medium">
                        <span>Origem: <strong>{prop.sourceTemplateName || prop.targetName}</strong></span>
                        <span>•</span>
                        <span>Categoria: <strong>{prop.category}</strong></span>
                        {prop.engineeringUnit && prop.engineeringUnit !== '—' && (
                          <>
                            <span>•</span>
                            <span>Unidade: <strong>{prop.engineeringUnit}</strong></span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Indicators & Selection Badge */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1">
                      {prop.hasAlarm && (
                        <span title="Alarme Configurado">
                          <Bell className="w-3.5 h-3.5 text-rose-500" />
                        </span>
                      )}
                      {prop.hasHistory && (
                        <span title="Historian Habilitado">
                          <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                        </span>
                      )}
                      {prop.isSimulated && (
                        <span title="Simulação Ativa">
                          <Activity className="w-3.5 h-3.5 text-amber-500" />
                        </span>
                      )}
                    </div>

                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center transition-all',
                        isSelected
                          ? 'bg-sky-500 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-0 group-hover:opacity-100'
                      )}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
