import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Gauge, Check, TrendingUp } from 'lucide-react';
import { useObjectModelStore } from '../../../store/useObjectModelStore';
import { inheritanceService } from '../../../services/InheritanceService';
import { cn } from '../../../utils/cn';

interface ObjectSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (objectId: string) => void;
  alreadySelectedIds?: string[];
  initialSelectedProps?: Array<{
    objectId: string;
    propertyName: string;
    objectName: string;
    propertyLabel: string;
  }>;
  onSelectTrend?: (
    properties: Array<{
      objectId: string;
      propertyName: string;
      objectName: string;
      propertyLabel: string;
    }>
  ) => void;
}

export const ObjectSelectorModal: React.FC<ObjectSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  alreadySelectedIds = [],
  initialSelectedProps = [],
  onSelectTrend,
}) => {
  const { objects, templates, simulatedValues } = useObjectModelStore();
  const [activeTab, setActiveTab] = useState<'equipment' | 'trends'>('equipment');
  const [search, setSearch] = useState('');
  const [trendSearch, setTrendSearch] = useState('');
  
  // Selection state for trend properties
  const [selectedProps, setSelectedProps] = useState<Array<{
    objectId: string;
    propertyName: string;
    objectName: string;
    propertyLabel: string;
  }>>([]);

  // Sync selectedProps when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedProps(initialSelectedProps || []);
      if (initialSelectedProps && initialSelectedProps.length > 0) {
        setActiveTab('trends');
      } else {
        setActiveTab('equipment');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Original equipment filtering
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

  // Retrieve all numeric or pseudo-numeric properties across all objects
  const allPropertiesList = useMemo(() => {
    const list: Array<{
      objectId: string;
      objectName: string;
      propertyName: string;
      propertyId: string;
      propertyLabel: string;
      dataType: string;
      description: string;
      currentValue: string;
      unit: string;
    }> = [];

    objects.forEach((obj) => {
      const props = inheritanceService.getMergedProperties(obj.id, 'instance');
      props.forEach((prop) => {
        // Strict numeric check (Integer or Float/number)
        const isNumeric =
          prop.dataType === 'Float' ||
          prop.dataType === 'Integer' ||
          !isNaN(parseFloat(prop.defaultValue));
          
        if (isNumeric) {
          const key = `${obj.id}:${prop.name}`;
          const currentVal = simulatedValues[key] ?? prop.defaultValue;

          // Resolve unit from name
          let unit = '';
          const nameLower = prop.name.toLowerCase();
          if (nameLower.includes('level') || nameLower.includes('percent')) {
            unit = '%';
          } else if (nameLower.includes('press')) {
            unit = 'bar';
          } else if (nameLower.includes('temp')) {
            unit = '°C';
          } else if (nameLower.includes('flow') || nameLower.includes('vaz')) {
            unit = 'm³/h';
          } else if (nameLower.includes('volum')) {
            unit = 'm³';
          } else if (nameLower.includes('mass')) {
            unit = 't';
          } else if (nameLower.includes('capacity')) {
            unit = 'm³';
          }

          list.push({
            objectId: obj.id,
            objectName: obj.name,
            propertyName: prop.name,
            propertyId: prop.id,
            propertyLabel: prop.name,
            dataType: prop.dataType,
            description: prop.description || '',
            currentValue: currentVal,
            unit,
          });
        }
      });
    });

    return list;
  }, [objects, simulatedValues]);

  // Trend variables filtering (Global search across object, property, dataType and unit)
  const filteredTrends = useMemo(() => {
    const q = trendSearch.toLowerCase().trim();
    if (!q) return allPropertiesList;
    return allPropertiesList.filter(
      (item) =>
        item.objectName.toLowerCase().includes(q) ||
        item.propertyName.toLowerCase().includes(q) ||
        item.dataType.toLowerCase().includes(q) ||
        item.unit.toLowerCase().includes(q)
    );
  }, [allPropertiesList, trendSearch]);

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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              {initialSelectedProps.length > 0 ? (
                <>
                  <TrendingUp className="w-4 h-4 text-sky-500" />
                  Editar Variáveis de Tendência
                </>
              ) : (
                'Adicionar ao Painel'
              )}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Escolha entre vincular um equipamento ou configurar um gráfico de tendências de variáveis
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection (only show when not explicitly editing a trend card) */}
        {initialSelectedProps.length === 0 && (
          <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 bg-slate-50/50 dark:bg-slate-900/50">
            <button
              onClick={() => setActiveTab('equipment')}
              className={cn(
                "px-4 py-3 text-xs font-bold transition-all relative border-b-2 flex items-center gap-1.5 cursor-pointer",
                activeTab === 'equipment'
                  ? "border-sky-500 text-sky-650 dark:text-sky-400"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              <Gauge className="w-3.5 h-3.5" />
              Equipamentos
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={cn(
                "px-4 py-3 text-xs font-bold transition-all relative border-b-2 flex items-center gap-1.5 cursor-pointer",
                activeTab === 'trends'
                  ? "border-sky-500 text-sky-650 dark:text-sky-400"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Gráficos de Tendência
            </button>
          </div>
        )}

        {/* Tab Content: Search & List */}
        {activeTab === 'equipment' ? (
          <>
            {/* Search Equipment */}
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por TAG, nome ou template..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/30 text-slate-800 dark:text-slate-200 placeholder:text-slate-450"
                  autoFocus
                />
              </div>
            </div>

            {/* Equipment List */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
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
                          onSelect(obj.id);
                          onClose();
                        }}
                        className="relative text-left p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 hover:bg-sky-50/30 dark:hover:bg-sky-950/10 cursor-pointer bg-white dark:bg-slate-900 transition-all duration-150"
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-[9px] font-bold">
                            Já Adicionado
                          </div>
                        )}

                        <div
                          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                          style={{ backgroundColor: color }}
                        />

                        <div className="pl-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-mono font-bold tracking-wider text-sky-600 dark:text-sky-450 uppercase">
                              {obj.name}
                            </span>
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono"
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

                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
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
                              <div className="h-1 rounded-full bg-slate-200 dark:bg-slate-750 overflow-hidden">
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
          </>
        ) : (
          <>
            {/* Search Trends */}
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome da variável, objeto, tipo ou unidade (ex: TK-301, Level, Float, %)..."
                  value={trendSearch}
                  onChange={(e) => setTrendSearch(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/30 text-slate-800 dark:text-slate-200 placeholder:text-slate-450"
                  autoFocus
                />
              </div>
            </div>

            {/* Flat compact list of variables */}
            <div className="flex-1 overflow-y-auto px-5 py-3 bg-slate-50/30 dark:bg-slate-900/20">
              {filteredTrends.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
                  <TrendingUp className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-xs font-medium">Nenhuma variável de processo encontrada</p>
                  <p className="text-[11px] opacity-60 mt-1 text-center max-w-sm">
                    Digite o nome de uma variável ou objeto na busca acima para selecionar
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                  {/* Table Header */}
                  <div className="grid grid-cols-[auto_1.3fr_1.5fr_0.7fr_0.7fr_1.1fr] gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-850/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <div className="w-4"></div>
                    <div>Objeto Origem</div>
                    <div>Variável</div>
                    <div>Tipo</div>
                    <div>Unidade</div>
                    <div className="text-right">Valor Atual</div>
                  </div>

                  {/* List Body */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[44vh] overflow-y-auto">
                    {filteredTrends.map((item) => {
                      const isChecked = selectedProps.some(
                        (p) => p.objectId === item.objectId && p.propertyName === item.propertyName
                      );

                      const toggleCheck = () => {
                        if (isChecked) {
                          setSelectedProps((prev) =>
                            prev.filter(
                              (p) => !(p.objectId === item.objectId && p.propertyName === item.propertyName)
                            )
                          );
                        } else {
                          setSelectedProps((prev) => [
                            ...prev,
                            {
                              objectId: item.objectId,
                              propertyName: item.propertyName,
                              objectName: item.objectName,
                              propertyLabel: item.propertyName,
                            },
                          ]);
                        }
                      };

                      return (
                        <div
                          key={`${item.objectId}-${item.propertyName}`}
                          onClick={toggleCheck}
                          className={cn(
                            "grid grid-cols-[auto_1.3fr_1.5fr_0.7fr_0.7fr_1.1fr] gap-3 px-4 py-2.5 items-center hover:bg-sky-500/5 dark:hover:bg-sky-500/10 cursor-pointer select-none transition-colors",
                            isChecked && "bg-sky-500/10 dark:bg-sky-500/15"
                          )}
                        >
                          {/* Modern Custom Checkbox */}
                          <div className="flex items-center">
                            <div
                              className={cn(
                                "w-4 h-4 rounded-md border flex items-center justify-center transition-all duration-150 shadow-2xs",
                                isChecked
                                  ? "bg-sky-500 border-sky-600 text-white ring-2 ring-sky-500/20"
                                  : "bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:border-sky-400"
                              )}
                            >
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>

                          {/* Object Badge */}
                          <div className="min-w-0 flex items-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-mono truncate">
                              {item.objectName}
                            </span>
                          </div>

                          {/* Variable Name */}
                          <div className="min-w-0 flex items-center">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate font-mono">
                              {item.propertyName}
                            </span>
                          </div>

                          {/* Data Type */}
                          <div className="flex items-center">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase border border-slate-200 dark:border-slate-700">
                              {item.dataType}
                            </span>
                          </div>

                          {/* Unit */}
                          <div className="flex items-center">
                            {item.unit ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                {item.unit}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-300 dark:text-slate-600 font-mono">-</span>
                            )}
                          </div>

                          {/* Current Value (Real-time) */}
                          <div className="text-right font-mono font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center justify-end gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            {parseFloat(item.currentValue || '0').toFixed(1)}
                            {item.unit && (
                              <span className="text-[10px] font-sans font-medium text-slate-400 ml-0.5">
                                {item.unit}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-150 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-950/60">
          {activeTab === 'equipment' ? (
            <>
              <span>{filteredObjects.length} equipamentos disponíveis</span>
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <span>{selectedProps.length} variáveis selecionadas</span>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (selectedProps.length > 0 && onSelectTrend) {
                      onSelectTrend(selectedProps);
                      onClose();
                    }
                  }}
                  disabled={selectedProps.length === 0}
                  className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-colors shadow-sm cursor-pointer"
                >
                  {initialSelectedProps.length > 0 ? 'Salvar Alterações' : 'Adicionar Gráfico'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
