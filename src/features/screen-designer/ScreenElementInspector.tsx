import React, { useState } from 'react';
import {
  Square,
  Circle,
  Type,
  Minus,
  Image as ImageIcon,
  Activity,
  Variable,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Settings,
  Info,
} from 'lucide-react';
import { useScreenStore } from '../../store/useScreenStore';
import { useObjectModelStore } from '../../store/useObjectModelStore';
import { useWidgetStore } from '../../store/useWidgetStore';
import { propertyRepo } from '../../repository/PropertyRepository';
import { inheritanceService } from '../../services/InheritanceService';
import type { ScreenElement } from '../../types/domain';
import { cn } from '../../utils/cn';

const ColorInput: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{label}</span>
    <div className="flex items-center gap-1.5">
      <div className="w-5 h-5 rounded border border-slate-300 dark:border-slate-600 overflow-hidden shrink-0">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="w-6 h-6 -m-0.5 cursor-pointer border-0 p-0"
        />
      </div>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-20 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 text-[11px] px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 outline-none focus:border-violet-500"
      />
    </div>
  </div>
);

const NumberInput: React.FC<{
  label: string;
  value: number | undefined;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}> = ({ label, value, onChange, min = 0, max = 9999, step = 1 }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{label}</span>
    <input
      type="number"
      value={value ?? 0}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-20 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 text-[11px] px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 outline-none focus:border-violet-500 text-right"
    />
  </div>
);

const TextInput: React.FC<{
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate shrink-0">{label}</span>
    <input
      type="text"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="flex-1 min-w-0 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 text-[11px] px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 outline-none focus:border-violet-500"
    />
  </div>
);

const SelectInput: React.FC<{
  label: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}> = ({ label, value, options, onChange }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{label}</span>
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-28 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 text-[11px] px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 outline-none focus:border-violet-500"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-3 mb-1.5">{children}</p>
);

const GenericWidgetMappingEditor: React.FC<{
  element: ScreenElement;
  widget: any;
  allProps: { objectId: string; objectName: string; propertyName: string; dataType: string; value: string; label: string }[];
  onUpdateMappings: (mappings: any) => void;
}> = ({ element, widget, allProps, onUpdateMappings }) => {
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [activeSearchPropId, setActiveSearchPropId] = useState<string | null>(null);

  const mappings = element.mappings ?? {};

  const handleTypeChange = (cpId: string, type: 'property' | 'fixed') => {
    const cp = widget.customProperties.find((p: any) => p.id === cpId);
    const updated = {
      ...mappings,
      [cpId]: {
        type,
        value: type === 'property' ? '' : (cp?.defaultValue ?? ''),
      }
    };
    onUpdateMappings(updated);
  };

  const handleValueChange = (cpId: string, value: string) => {
    const updated = {
      ...mappings,
      [cpId]: {
        type: mappings[cpId]?.type ?? 'property',
        value,
      }
    };
    onUpdateMappings(updated);
  };

  return (
    <div className="space-y-3 mt-2">
      {widget.customProperties.length === 0 ? (
        <p className="text-[11px] text-slate-400 italic">Este widget não possui variáveis.</p>
      ) : (
        widget.customProperties.map((cp: any) => {
          const m = mappings[cp.id] ?? { type: 'property', value: '' };
          const searchQuery = searchQueries[cp.id] ?? '';
          const isActive = activeSearchPropId === cp.id;

          const filteredOptions = allProps.filter((opt) => {
            const q = searchQuery.toLowerCase();
            return opt.objectName.toLowerCase().includes(q) || opt.propertyName.toLowerCase().includes(q);
          });

          let selectedLabel = '';
          if (m.type === 'property' && m.value) {
            const found = allProps.find((o) => o.value === m.value);
            selectedLabel = found ? `${found.objectName}.${found.propertyName}` : m.value;
          }

          return (
            <div key={cp.id} className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">{cp.name}</span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono ml-2">({cp.dataType})</span>
                </div>
                
                <div className="flex bg-slate-105 dark:bg-slate-800 p-0.5 rounded-md text-[9px] font-semibold border border-slate-200/50 dark:border-slate-700/50">
                  <button
                    type="button"
                    onClick={() => handleTypeChange(cp.id, 'property')}
                    className={cn(
                      "px-1.5 py-0.5 rounded transition-all",
                      m.type === 'property'
                        ? "bg-violet-600 text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                    )}
                  >
                    Prop
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange(cp.id, 'fixed')}
                    className={cn(
                      "px-1.5 py-0.5 rounded transition-all",
                      m.type === 'fixed'
                        ? "bg-violet-600 text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                    )}
                  >
                    Fixo
                  </button>
                </div>
              </div>

              {cp.description && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 italic leading-snug">{cp.description}</p>
              )}

              {m.type === 'fixed' ? (
                <div>
                  {cp.dataType === 'Boolean' ? (
                    <select
                      value={m.value}
                      onChange={(e) => handleValueChange(cp.id, e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-200 text-[11px] px-2 py-1 rounded border border-slate-200 dark:border-slate-700 outline-none focus:border-violet-500"
                    >
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  ) : cp.dataType === 'Color' ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded border border-slate-300 dark:border-slate-600 overflow-hidden shrink-0">
                        <input
                          type="color"
                          value={m.value || '#000000'}
                          onChange={(e) => handleValueChange(cp.id, e.target.value)}
                          className="w-6 h-6 -m-0.5 cursor-pointer border-0 p-0"
                        />
                      </div>
                      <input
                        type="text"
                        value={m.value || ''}
                        onChange={(e) => handleValueChange(cp.id, e.target.value)}
                        placeholder="#000000"
                        className="flex-1 bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-200 text-[11px] px-2 py-1 rounded border border-slate-200 dark:border-slate-700 outline-none focus:border-violet-500 font-mono"
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={m.value}
                      onChange={(e) => handleValueChange(cp.id, e.target.value)}
                      placeholder={`Ex: ${cp.defaultValue || 'valor'}`}
                      className="w-full bg-slate-50 dark:bg-slate-850 text-slate-855 dark:text-slate-200 text-[11px] px-2 py-1 rounded border border-slate-200 dark:border-slate-700 outline-none focus:border-violet-500 font-mono"
                    />
                  )}
                </div>
              ) : (
                <div className="relative">
                  {selectedLabel && !isActive ? (
                    <div className="flex items-center justify-between gap-1 px-2 py-1 bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/40 rounded-md text-[11px] text-violet-700 dark:text-violet-400 font-semibold font-mono">
                      <span className="truncate">{selectedLabel}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSearchPropId(cp.id);
                          setSearchQueries({ ...searchQueries, [cp.id]: '' });
                        }}
                        className="text-[10px] text-violet-500 hover:text-violet-700 underline shrink-0 cursor-pointer"
                      >
                        Mudar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQueries({ ...searchQueries, [cp.id]: e.target.value });
                            setActiveSearchPropId(cp.id);
                          }}
                          onFocus={() => {
                            setActiveSearchPropId(cp.id);
                          }}
                          placeholder="Buscar objeto.var..."
                          className="w-full bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-200 text-[11px] px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 outline-none focus:border-violet-500 font-mono"
                        />
                        {isActive && (
                          <button
                            type="button"
                            onClick={() => setActiveSearchPropId(null)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 hover:text-slate-600"
                          >
                            Fechar
                          </button>
                        )}
                      </div>

                      {isActive && (
                        <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg max-h-[140px] overflow-y-auto z-50 divide-y divide-slate-100 dark:divide-slate-900">
                          {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  handleValueChange(cp.id, opt.value);
                                  setActiveSearchPropId(null);
                                }}
                                className="w-full text-left px-2 py-1.5 hover:bg-violet-50 dark:hover:bg-violet-950/30 text-[10px] font-mono flex flex-col justify-center transition-colors"
                              >
                                <div className="flex items-center gap-1">
                                  <span className="text-[8px] bg-sky-500/10 text-sky-500 px-1 py-0.5 rounded uppercase font-sans font-semibold shrink-0">
                                    {opt.dataType}
                                  </span>
                                  <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[80px]">{opt.objectName}</span>
                                  <span className="text-slate-400 dark:text-slate-500">.</span>
                                  <span className="text-violet-600 dark:text-violet-400 truncate">{opt.propertyName}</span>
                                </div>
                              </button>
                            ))
                          ) : (
                            <p className="p-2 text-center text-slate-400 text-[9px]">Não encontrado.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export const ScreenElementInspector: React.FC = () => {
  const { selectedScreen, selectedElementId, updateElement } = useScreenStore();
  const { objects, templates } = useObjectModelStore();
  const { widgets } = useWidgetStore();

  const element = selectedScreen?.elements.find((e) => e.id === selectedElementId);

  const allAvailableProperties = React.useMemo(() => {
    return objects
      .filter((o) => o.isDeployed !== false)
      .flatMap((obj) => {
        const ownProps = propertyRepo.getAll().filter((p) => p.targetId === obj.id);
        const template = templates.find((t) => t.id === obj.templateId);
        let allProps = [...ownProps];
        if (template) {
          const templateProps = propertyRepo.getAll().filter((p) => p.targetId === template.id);
          templateProps.forEach((tp) => {
            if (!allProps.find((p) => p.name === tp.name)) {
              allProps.push(tp);
            }
          });
        }
        return allProps.map((p) => ({
          objectId: obj.id,
          objectName: obj.name,
          propertyName: p.name,
          dataType: p.dataType,
          value: `${obj.id}:${p.name}`,
          label: `${obj.name}.${p.name}`
        }));
      });
  }, [objects, templates]);

  if (!element) {
    return (
      <div className="flex flex-col h-full overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 border-l border-slate-200 dark:border-slate-800">
        <div className="px-3 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/30">
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Inspetor</p>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 p-4 text-center">
          <Settings className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-3" />
          <p className="text-xs text-slate-500 font-medium">Selecione um elemento</p>
        </div>
      </div>
    );
  }

  const update = (updates: Partial<ScreenElement>) => {
    if (element.type === 'line') {
      const fx = updates.fromX !== undefined ? updates.fromX : (element.fromX ?? element.x);
      const fy = updates.fromY !== undefined ? updates.fromY : (element.fromY ?? element.y);
      const tx = updates.toX !== undefined ? updates.toX : (element.toX ?? (element.x + 100));
      const ty = updates.toY !== undefined ? updates.toY : (element.toY ?? element.y);

      updates.x = Math.min(fx, tx);
      updates.y = Math.min(fy, ty);
      updates.width = Math.max(1, Math.abs(tx - fx));
      updates.height = Math.max(1, Math.abs(ty - fy));
    }
    updateElement(element.id, updates);
  };

  const typeIcon = {
    'rectangle': <Square className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />,
    'circle': <Circle className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />,
    'text': <Type className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />,
    'line': <Minus className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />,
    'image': <ImageIcon className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />,
    'widget-instance': <Activity className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />,
    'variable-display': <Variable className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />,
  }[element.type];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 border-l border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="px-3 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/30 shrink-0">
        <div className="flex items-center gap-1.5">
          {typeIcon}
          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">{element.name}</p>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 capitalize">{element.type.replace('-', ' ')}</p>
      </div>

      {/* Inspector Content */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {/* Position & Size */}
        <SectionTitle>Posição & Tamanho</SectionTitle>
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <NumberInput label="X" value={element.x} onChange={(v) => update({ x: v })} />
            <NumberInput label="Y" value={element.y} onChange={(v) => update({ y: v })} />
            {element.type !== 'line' && (
              <>
                <NumberInput label="W" value={element.width} onChange={(v) => update({ width: Math.max(8, v) })} min={8} />
                <NumberInput label="H" value={element.height} onChange={(v) => update({ height: Math.max(8, v) })} min={8} />
              </>
            )}
          </div>
          <NumberInput label="Rotação" value={element.rotation} onChange={(v) => update({ rotation: v })} min={-360} max={360} />
        </div>

        {/* Shape-specific */}
        {(element.type === 'rectangle' || element.type === 'circle' || element.type === 'variable-display') && (
          <>
            <SectionTitle>Aparência</SectionTitle>
            <div className="space-y-1.5">
              <ColorInput label="Preenchimento" value={element.fill ?? '#3b82f6'} onChange={(v) => update({ fill: v })} />
              <ColorInput label="Borda" value={element.stroke ?? '#1d4ed8'} onChange={(v) => update({ stroke: v })} />
              <NumberInput label="Esp. Borda" value={element.strokeWidth ?? 1} onChange={(v) => update({ strokeWidth: v })} min={0} />
              <SelectInput
                label="Estilo Borda"
                value={element.strokeStyle ?? 'solid'}
                options={[{ value: 'solid', label: 'Sólido' }, { value: 'dashed', label: 'Tracejado' }, { value: 'dotted', label: 'Pontilhado' }]}
                onChange={(v) => update({ strokeStyle: v as any })}
              />
              {element.type === 'rectangle' && (
                <NumberInput label="Raio Canto" value={element.cornerRadius ?? 0} onChange={(v) => update({ cornerRadius: v })} max={100} />
              )}
            </div>
          </>
        )}

        {/* Text-specific */}
        {element.type === 'text' && (
          <>
            <SectionTitle>Texto</SectionTitle>
            <div className="space-y-1.5">
              <TextInput label="Conteúdo" value={element.textContent} onChange={(v) => update({ textContent: v })} placeholder="Digite..." />
              <ColorInput label="Cor Texto" value={element.textColor ?? '#f1f5f9'} onChange={(v) => update({ textColor: v })} />
              <NumberInput label="Tamanho Fonte" value={element.fontSize ?? 14} onChange={(v) => update({ fontSize: v })} min={8} max={96} />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Alinhamento</span>
                <div className="flex gap-1">
                  {([['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]] as const).map(([align, Icon]) => (
                    <button
                      key={align}
                      onClick={() => update({ textAlignment: align as any })}
                      className={cn('p-1 rounded transition-colors', element.textAlignment === align ? 'bg-violet-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700')}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Line-specific */}
        {element.type === 'line' && (
          <>
            <SectionTitle>Linha</SectionTitle>
            <div className="space-y-1.5">
              <ColorInput label="Cor" value={element.stroke ?? '#64748b'} onChange={(v) => update({ stroke: v })} />
              <NumberInput label="Espessura" value={element.strokeWidth ?? 2} onChange={(v) => update({ strokeWidth: v })} min={1} />
              <SelectInput
                label="Estilo"
                value={element.strokeStyle ?? 'solid'}
                options={[{ value: 'solid', label: 'Sólido' }, { value: 'dashed', label: 'Tracejado' }, { value: 'dotted', label: 'Pontilhado' }]}
                onChange={(v) => update({ strokeStyle: v as any })}
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Seta no fim</span>
                <input
                  type="checkbox"
                  checked={element.arrowEnd ?? false}
                  onChange={(e) => update({ arrowEnd: e.target.checked })}
                  className="accent-violet-500"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Seta no início</span>
                <input
                  type="checkbox"
                  checked={element.arrowStart ?? false}
                  onChange={(e) => update({ arrowStart: e.target.checked })}
                  className="accent-violet-500"
                />
              </div>
              <SectionTitle>Coordenadas</SectionTitle>
              <NumberInput label="X1" value={element.fromX ?? element.x} onChange={(v) => update({ fromX: v })} />
              <NumberInput label="Y1" value={element.fromY ?? element.y} onChange={(v) => update({ fromY: v })} />
              <NumberInput label="X2" value={element.toX ?? (element.x + 100)} onChange={(v) => update({ toX: v })} />
              <NumberInput label="Y2" value={element.toY ?? element.y} onChange={(v) => update({ toY: v })} />
            </div>
          </>
        )}

        {/* Variable Display-specific */}
        {element.type === 'variable-display' && (
          <>
            <SectionTitle>Variável</SectionTitle>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Objeto ID</span>
                <span className="text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-[120px] font-mono" title={element.objectId}>{element.objectId}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Propriedade</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 truncate font-semibold">{element.propertyName ?? '—'}</span>
              </div>
            </div>
            <SectionTitle>Exibição</SectionTitle>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Mostrar Rótulo</span>
                <input type="checkbox" checked={element.showLabel !== false} onChange={(e) => update({ showLabel: e.target.checked })} className="accent-violet-500" />
              </div>
              {element.showLabel !== false && (
                <TextInput label="Rótulo Custom" value={element.customLabel} onChange={(v) => update({ customLabel: v })} placeholder="Nome da prop." />
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Mostrar Unidade</span>
                <input type="checkbox" checked={element.showUnit === true} onChange={(e) => update({ showUnit: e.target.checked })} className="accent-violet-500" />
              </div>
              {element.showUnit && (
                <TextInput label="Unidade" value={element.unit} onChange={(v) => update({ unit: v })} placeholder="°C, bar, %" />
              )}
              <NumberInput label="Decimais" value={element.decimalPlaces ?? 2} onChange={(v) => update({ decimalPlaces: v })} min={0} max={8} />
              <NumberInput label="Fator Conversão" value={element.conversionFactor ?? 1} onChange={(v) => update({ conversionFactor: v })} step={0.01} />
            </div>
            <SectionTitle>Estilo</SectionTitle>
            <div className="space-y-1.5">
              <ColorInput label="Cor Texto" value={element.textColor ?? '#f1f5f9'} onChange={(v) => update({ textColor: v })} />
              <ColorInput label="Fundo" value={element.fill ?? '#1e293b'} onChange={(v) => update({ fill: v, backgroundColor: v })} />
              <ColorInput label="Borda" value={element.stroke ?? '#334155'} onChange={(v) => update({ stroke: v })} />
              <NumberInput label="Tamanho Fonte" value={element.fontSize ?? 13} onChange={(v) => update({ fontSize: v })} min={8} max={72} />
              <NumberInput label="Raio Canto" value={element.cornerRadius ?? 4} onChange={(v) => update({ cornerRadius: v })} max={50} />
            </div>
          </>
        )}

        {/* Widget instance mapping & info */}
        {element.type === 'widget-instance' && (() => {
          const widget = widgets.find((w) => w.id === element.widgetId);
          if (!widget) return null;

          if (element.objectId) {
            // Associated Widget: display read-only mappings configured on the object
            const assocObject = objects.find((o) => o.id === element.objectId);
            const association = inheritanceService.getMergedAssociatedWidgets(element.objectId, 'instance').find(
              (a) => a.widgetId === widget.id
            );
            const mappings = association?.mappings ?? {};

            return (
              <>
                <SectionTitle>Widget Associado</SectionTitle>
                <div className="space-y-1 text-[11px] p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Objeto</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold truncate max-w-[120px]" title={assocObject?.name}>{assocObject?.name ?? 'Desconhecido'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Widget</span>
                    <span className="text-violet-600 dark:text-violet-400 font-semibold truncate max-w-[120px]" title={widget.name}>{widget.name}</span>
                  </div>
                  
                  <div className="border-t border-slate-100 dark:border-slate-800/60 my-2" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mapeamento de Variáveis</p>
                  <p className="text-[9px] text-slate-400 italic mb-2">Este widget está associado ao objeto. As variáveis são configuradas nele.</p>
                  
                  <div className="space-y-2">
                    {widget.customProperties.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic">Sem variáveis.</p>
                    ) : (
                      widget.customProperties.map((cp) => {
                        const m = mappings[cp.id];
                        return (
                          <div key={cp.id} className="flex flex-col border-b border-slate-100 dark:border-slate-800/40 last:border-0 pb-1.5 last:pb-0">
                            <div className="flex justify-between text-[10px]">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{cp.name}</span>
                              <span className="text-slate-400 font-mono text-[9px]">({cp.dataType})</span>
                            </div>
                            <div className="text-[10px] text-sky-600 dark:text-sky-400 font-mono mt-0.5 truncate">
                              {m ? (m.type === 'property' ? `me.${m.value.replace('me.', '')}` : `Fixo: ${m.value}`) : '—'}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            );
          } else {
            // Generic Widget: display interactive variable mapping editor
            return (
              <>
                <SectionTitle>Mapeamento de Variáveis</SectionTitle>
                <div className="p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/20 text-sky-800 dark:text-sky-400 border border-sky-100 dark:border-sky-900/30 text-[10px] mb-2 leading-relaxed flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                  <p>
                    Este é um <strong>Widget Genérico</strong>. Mapeie suas variáveis para as propriedades de qualquer objeto ativo.
                  </p>
                </div>
                <GenericWidgetMappingEditor
                  element={element}
                  widget={widget}
                  allProps={allAvailableProperties}
                  onUpdateMappings={(updated) => update({ mappings: updated })}
                />
              </>
            );
          }
        })()}

        {/* Image */}
        {element.type === 'image' && element.imageUri && (
          <>
            <SectionTitle>Imagem</SectionTitle>
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 p-2">
              <img
                src={element.imageUri}
                alt="preview"
                className="w-full object-contain max-h-32"
              />
            </div>
          </>
        )}

        {/* Z-Index */}
        <SectionTitle>Camada</SectionTitle>
        <NumberInput label="Z-Index" value={element.zIndex} onChange={(v) => update({ zIndex: v })} min={0} />
      </div>
    </div>
  );
};

