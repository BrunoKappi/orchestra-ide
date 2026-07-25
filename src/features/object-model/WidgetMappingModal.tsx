import React, { useEffect, useState, useRef } from 'react';
import { useObjectModelStore } from '../../store/useObjectModelStore';
import { useWidgetStore } from '../../store/useWidgetStore';
import { Modal } from '../../components/ui/Modal';
import { ChevronDown, Check, Info } from 'lucide-react';
import type { MergedAssociatedWidget, AssociatedWidgetEntity } from '../../types/domain';
import { cn } from '../../utils/cn';

interface WidgetMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  association: MergedAssociatedWidget | null;
}

export const WidgetMappingModal: React.FC<WidgetMappingModalProps> = ({
  isOpen,
  onClose,
  association,
}) => {
  const { mergedProperties, updateWidgetMappings } = useObjectModelStore();
  const { widgets, init: initWidgets } = useWidgetStore();

  const [localMappings, setLocalMappings] = useState<AssociatedWidgetEntity['mappings']>({});
  const [activeDropdownPropId, setActiveDropdownPropId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initWidgets();
  }, [initWidgets]);

  const widget = widgets.find((w) => w.id === association?.widgetId);

  useEffect(() => {
    if (association) {
      setLocalMappings(association.mappings || {});
    } else {
      setLocalMappings({});
    }
  }, [association]);

  // Click outside to close any open dropdowns
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (activeDropdownPropId && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveDropdownPropId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [activeDropdownPropId]);

  if (!association || !widget) return null;

  const handleTypeChange = (cpId: string, type: 'property' | 'fixed') => {
    const cp = widget.customProperties.find((p) => p.id === cpId);
    setLocalMappings((prev) => ({
      ...prev,
      [cpId]: {
        type,
        value: type === 'property' ? '' : (cp?.defaultValue || ''),
      },
    }));
  };

  const handleValueChange = (cpId: string, value: string) => {
    setLocalMappings((prev) => ({
      ...prev,
      [cpId]: {
        type: prev[cpId]?.type || 'property',
        value,
      },
    }));
  };

  const handleSave = () => {
    // Collect all values, defaulting empty keys to property mapping with empty val or fixed val
    const finalMappings: AssociatedWidgetEntity['mappings'] = {};
    widget.customProperties.forEach((cp) => {
      const existing = localMappings[cp.id];
      if (existing) {
        finalMappings[cp.id] = existing;
      } else {
        finalMappings[cp.id] = {
          type: 'property',
          value: '',
        };
      }
    });

    updateWidgetMappings(association.id, finalMappings);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Map Graphics Variables: ${widget.name}`}
      subtitle={`Configure bindings from the object's attributes to the custom variables of the graphic widget.`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4 text-xs" ref={containerRef}>
        {association.isInherited && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border border-sky-100 dark:border-sky-900/40">
            <Info className="w-4 h-4 shrink-0 text-sky-500" />
            <p className="text-[11px]">
              This graphic widget is inherited from template <strong>{association.sourceTemplateName}</strong>. Editing its variables will create a local override on this entity.
            </p>
          </div>
        )}

        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm max-h-[65vh] min-h-[250px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <th className="p-3 w-1/3">Widget Variable</th>
                <th className="p-3 w-1/6">Type</th>
                <th className="p-3 w-1/2">Mapping / Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {widget.customProperties.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-slate-400">
                    This widget has no custom variables to map.
                  </td>
                </tr>
              ) : (
                widget.customProperties.map((cp) => {
                  const mapping = localMappings[cp.id] || { type: 'property', value: '' };
                  const isDropdownOpen = activeDropdownPropId === cp.id;

                  // Filter properties suggestions by search string in mapping value
                  const searchStr = mapping.type === 'property' ? mapping.value.toLowerCase() : '';
                  const filteredProps = mergedProperties.filter((p) => {
                    const fullName = `me.${p.name}`.toLowerCase();
                    const nameOnly = p.name.toLowerCase();
                    return fullName.includes(searchStr) || nameOnly.includes(searchStr);
                  });

                  return (
                    <tr key={cp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                      {/* Property Metadata */}
                      <td className="p-3 align-top">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{cp.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{cp.dataType}</div>
                        {cp.description && (
                          <div className="text-[10px] text-slate-500 mt-1 italic line-clamp-2" title={cp.description}>
                            {cp.description}
                          </div>
                        )}
                      </td>

                      {/* Mapping Type Toggle */}
                      <td className="p-3 align-top">
                        <div className="flex flex-col gap-1.5 mt-0.5">
                          <button
                            type="button"
                            onClick={() => handleTypeChange(cp.id, 'property')}
                            className={cn(
                              "px-2 py-1 rounded text-[10px] border font-semibold text-center transition-colors",
                              mapping.type === 'property'
                                ? "bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300"
                                : "bg-transparent border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            )}
                          >
                            Property
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTypeChange(cp.id, 'fixed')}
                            className={cn(
                              "px-2 py-1 rounded text-[10px] border font-semibold text-center transition-colors",
                              mapping.type === 'fixed'
                                ? "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                                : "bg-transparent border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            )}
                          >
                            Fixed Val
                          </button>
                        </div>
                      </td>

                      {/* Mapping Value Input & Autocomplete Dropdown */}
                      <td className="p-3 align-top relative">
                        {mapping.type === 'property' ? (
                          <div className="relative">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={mapping.value}
                                onChange={(e) => handleValueChange(cp.id, e.target.value)}
                                onFocus={() => setActiveDropdownPropId(cp.id)}
                                placeholder="me.PropertyName"
                                className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-sky-500 font-mono text-xs text-slate-900 dark:text-slate-100"
                              />
                              <button
                                type="button"
                                onClick={() => setActiveDropdownPropId(activeDropdownPropId === cp.id ? null : cp.id)}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Dropdown Suggestions Panel */}
                            {isDropdownOpen && (
                              <div className="absolute left-0 right-0 top-full z-50 mt-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden max-h-[280px] overflow-y-auto">
                                {filteredProps.length > 0 ? (
                                  filteredProps.map((p) => {
                                    const valueToSet = `me.${p.name}`;
                                    const isSelected = mapping.value === valueToSet;
                                    return (
                                      <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => {
                                          handleValueChange(cp.id, valueToSet);
                                          setActiveDropdownPropId(null);
                                        }}
                                        className={cn(
                                          "w-full text-left px-3 py-2 hover:bg-sky-50/60 dark:hover:bg-sky-900/30 text-[11px] font-mono flex items-center justify-between border-b border-slate-100 dark:border-slate-800/40 last:border-0 transition-colors",
                                          isSelected ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold" : "text-slate-700 dark:text-slate-300"
                                        )}
                                      >
                                        <div className="flex items-center gap-2 min-w-0 pr-2">
                                          <span className="text-[9px] uppercase font-sans font-semibold tracking-wider text-sky-500 bg-sky-500/10 px-1.5 py-0.5 rounded shrink-0">
                                            {p.dataType}
                                          </span>
                                          <span className="font-semibold">{valueToSet}</span>
                                          {p.description && (
                                            <span className="text-[10px] text-slate-400 font-sans font-normal truncate">
                                              - {p.description}
                                            </span>
                                          )}
                                        </div>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-sky-500 shrink-0" />}
                                      </button>
                                    );
                                  })
                                ) : (
                                  <div className="p-2.5 text-center text-slate-400 text-[10px]">
                                    No matching properties.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            {cp.dataType === 'Boolean' ? (
                              <select
                                value={mapping.value}
                                onChange={(e) => handleValueChange(cp.id, e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-sky-500 text-xs font-mono text-slate-900 dark:text-slate-100"
                              >
                                <option value="true">true</option>
                                <option value="false">false</option>
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={mapping.value}
                                onChange={(e) => handleValueChange(cp.id, e.target.value)}
                                placeholder={`e.g. ${cp.defaultValue || 'value'}`}
                                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-sky-500 font-mono text-xs text-slate-900 dark:text-slate-100"
                              />
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-sm transition-colors"
          >
            {association.isInherited ? 'Save Override' : 'Save Mappings'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
