import React, { useState } from "react";
import {
  Sliders,
  Variable,
  Zap,
  Maximize,
  Plus,
  Trash2,
  Link,
  Edit2,
} from "lucide-react";
import { useWidgetStore } from "../../store/useWidgetStore";
import type {
  WidgetCustomProperty,
  WidgetCustomPropertyDataType,
  WidgetElement,
  DynamicRule,
} from "../../types/domain";
import { cn } from "../../utils/cn";
import { Modal } from "../../components/ui/Modal";
import { FillDynamicEditor } from './Dynamics/FillDynamicEditor';
import { StrokeDynamicEditor } from './Dynamics/StrokeDynamicEditor';
import { VisibilityDynamicEditor } from './Dynamics/VisibilityDynamicEditor';
import { FillLevelDynamicEditor } from './Dynamics/FillLevelDynamicEditor';
import { validateDynamicRule } from './Dynamics/validation';

export const WidgetInspectorPanel: React.FC = () => {
  const {
    selectedWidget,
    selectedElementId,
    inspectorTab,
    setInspectorTab,
    updateElement,
    addCustomProperty,
    updateCustomProperty,
    deleteCustomProperty,
    addVariableDisplayElement,
    updateCanvasSettings,
    addElementDynamic,
    updateElementDynamic,
    removeElementDynamic,
    duplicateElementDynamic,
  } = useWidgetStore();

  // Collapsed rules state for dynamics cards
  const [collapsedRules, setCollapsedRules] = useState<Record<string, boolean>>({});

  const toggleCollapseRule = (id: string) => {
    setCollapsedRules((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Variables modal state
  const [isPropModalOpen, setIsPropModalOpen] = useState(false);
  const [editingPropId, setEditingPropId] = useState<string | null>(null);
  const [propName, setPropName] = useState("");
  const [propType, setPropType] = useState<WidgetCustomPropertyDataType>("Float");
  const [propDefault, setPropDefault] = useState("");
  const [propMapping, setPropMapping] = useState("");

  if (!selectedWidget) return null;

  const selectedElement = selectedWidget.elements.find((e) => e.id === selectedElementId);

  // Property Modal Save Handler
  const handleSaveProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propName.trim()) return;

    const payload = {
      name: propName.trim(),
      dataType: propType,
      defaultValue: propDefault,
      description: "",
      mappedObjectPropertyName: propMapping || undefined,
    };

    if (editingPropId) {
      updateCustomProperty(editingPropId, payload);
    } else {
      addCustomProperty(payload);
    }

    setPropName("");
    setPropDefault("");
    setPropMapping("");
    setEditingPropId(null);
    setIsPropModalOpen(false);
  };

  const handleOpenNewProperty = () => {
    setPropName("");
    setPropType("Float");
    setPropDefault("");
    setPropMapping("");
    setEditingPropId(null);
    setIsPropModalOpen(true);
  };

  const handleOpenEditProperty = (prop: WidgetCustomProperty) => {
    setPropName(prop.name);
    setPropType(prop.dataType);
    setPropDefault(prop.defaultValue);
    setPropMapping(prop.mappedObjectPropertyName || "");
    setEditingPropId(prop.id);
    setIsPropModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 text-xs overflow-hidden select-none">
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50">
        <TabButton active={inspectorTab === "properties"} onClick={() => setInspectorTab("properties")} icon={<Sliders className="w-3.5 h-3.5" />} label="Forma" />
        <TabButton active={inspectorTab === "variables"} onClick={() => setInspectorTab("variables")} icon={<Variable className="w-3.5 h-3.5 text-amber-500" />} label="Variáveis" />
        <TabButton active={inspectorTab === "bindings"} onClick={() => setInspectorTab("bindings")} icon={<Zap className="w-3.5 h-3.5 text-emerald-500" />} label="Dinâmica" />
        <TabButton active={inspectorTab === "canvas"} onClick={() => setInspectorTab("canvas")} icon={<Maximize className="w-3.5 h-3.5 text-sky-500" />} label="Canvas" />
      </div>

      {inspectorTab === "properties" && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!selectedElement ? (
            <EmptyState text="Nenhuma forma selecionada. Clique em um elemento no canvas." />
          ) : (
            <ShapePropertiesEditor element={selectedElement} onUpdate={(up) => updateElement(selectedElement.id, up)} />
          )}
        </div>
      )}

      {inspectorTab === "variables" && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-200">Variáveis ({selectedWidget.customProperties.length})</span>
            <button onClick={handleOpenNewProperty} className="flex items-center gap-1 px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium transition-colors">
              <Plus className="w-3.5 h-3.5" /><span>Nova</span>
            </button>
          </div>

          <div className="space-y-2">
            {selectedWidget.customProperties.length === 0 ? (
              <EmptyState text="Nenhuma variável criada para este widget." />
            ) : selectedWidget.customProperties.map((prop) => (
              <div key={prop.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1.5 animate-in fade-in duration-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate pr-2" title={prop.name}>{prop.name}</span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <DataTypeBadge type={prop.dataType} />
                    <button onClick={() => handleOpenEditProperty(prop)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400" title="Editar"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { if (window.confirm(`Excluir variável "${prop.name}"?`)) deleteCustomProperty(prop.id); }} className="p-1 hover:bg-red-50 dark:hover:bg-red-950/50 rounded text-red-500" title="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Default: <strong className="text-slate-700 dark:text-slate-300">{prop.defaultValue || "—"}</strong></span>
                  <button onClick={() => addVariableDisplayElement(prop.id)} className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-[10px] transition-colors">+ Canvas</button>
                </div>
                {prop.mappedObjectPropertyName && (
                  <div className="flex items-center gap-1 text-[11px] text-sky-600 dark:text-sky-400 pt-1 border-t border-slate-200 dark:border-slate-800/60">
                    <Link className="w-3 h-3" /><span>Tag: <strong>{prop.mappedObjectPropertyName}</strong></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {inspectorTab === "bindings" && (() => {
        const renderSummary = (rule: DynamicRule, variable?: WidgetCustomProperty) => {
          if (!variable) return 'Sem variável configurada';
          const config = rule.config || {};
          
          if (rule.type === 'fill' || rule.type === 'stroke') {
            if (variable.dataType === 'Color') {
              return 'Mapeia diretamente para a cor da variável';
            }
            if (variable.dataType === 'Boolean') {
              const b = config.boolean || {};
              return `Boolean: True -> ${b.trueColor || '—'} / False -> ${b.falseColor || '—'}`;
            }
            if (variable.dataType === 'Float' || variable.dataType === 'Integer') {
              const ranges = config.ranges || [];
              return `Faixas (${ranges.length}): ${ranges.map((r: any) => `[${r.lo}–${r.hi}]->${r.color}`).join(', ')}`;
            }
            if (variable.dataType === 'String') {
              const mappings = config.stringMappings || [];
              return `Texto (${mappings.length}): ${mappings.map((m: any) => `"${m.value}"->${m.color}`).join(', ')}`;
            }
          } else if (rule.type === 'visibility') {
            if (variable.dataType === 'Boolean') {
              const b = config.visibilityBoolean || {};
              return `Visibilidade: ${b.invert ? 'Invertida (TRUE = Oculto)' : 'Padrão (TRUE = Visível)'}`;
            }
            if (variable.dataType === 'Float' || variable.dataType === 'Integer') {
              const n = config.visibilityNumeric || {};
              return `Condição: Valor ${n.operator || '>'} ${n.value === undefined ? '—' : n.value} ${n.invert ? '(Invertido)' : ''}`;
            }
            if (variable.dataType === 'String') {
              const s = config.visibilityString || {};
              return `Condição: Valor ${s.operator || '=='} "${s.value || ''}"`;
            }
            if (variable.dataType === 'Color') {
              return 'Não compatível com tipo Color';
            }
          } else if (rule.type === 'fill_level') {
            const fl = config.fillLevel || {};
            return `Nível: ${fl.minValue ?? 0} → ${fl.maxValue ?? 100} | Cor: ${fl.fillColor || '—'} | Dir: ${fl.direction || 'bottom-up'}`;
          }
          return 'Não configurada';
        };

        return (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!selectedElement ? (
              <EmptyState text="Selecione uma forma no canvas para configurar dinâmicas." />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    Dinâmicas ({(selectedElement.dynamics || []).length})
                  </span>
                  <button
                    onClick={() => addElementDynamic(selectedElement.id, { type: 'fill', variableId: '', config: {} })}
                    className="flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nova</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {(!selectedElement.dynamics || selectedElement.dynamics.length === 0) ? (
                    <EmptyState text="Nenhuma dinâmica configurada para esta forma. Clique em Nova acima." />
                  ) : (
                    selectedElement.dynamics.map((rule) => {
                      const isCollapsed = collapsedRules[rule.id];
                      const variable = selectedWidget.customProperties.find((v) => v.id === rule.variableId);
                      const validationErrors = validateDynamicRule(rule, selectedWidget.customProperties);
                      const hasError = validationErrors.length > 0;

                      return (
                        <div
                          key={rule.id}
                          className={cn(
                            "border rounded-lg bg-slate-50 dark:bg-slate-800/40 transition-all",
                            hasError
                              ? "border-red-300 dark:border-red-900/60"
                              : "border-slate-200 dark:border-slate-800"
                          )}
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/20 rounded-t-lg">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-750 dark:text-slate-200 uppercase tracking-wider text-[10px]">
                                {rule.type === 'fill' ? 'Fill Color' : rule.type === 'stroke' ? 'Stroke Color' : 'Visibility'}
                              </span>
                              {hasError && (
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" title="Erros de validação presentes" />
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => toggleCollapseRule(rule.id)}
                                className="px-1.5 py-0.5 text-[10px] text-slate-500 hover:text-slate-750 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded font-semibold"
                              >
                                {isCollapsed ? 'Expandir' : 'Recolher'}
                              </button>
                              <button
                                type="button"
                                onClick={() => duplicateElementDynamic(selectedElement.id, rule.id)}
                                className="px-1.5 py-0.5 text-[10px] text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/30 rounded font-semibold"
                              >
                                Duplicar
                              </button>
                              <button
                                type="button"
                                onClick={() => removeElementDynamic(selectedElement.id, rule.id)}
                                className="px-1.5 py-0.5 text-[10px] text-red-550 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded font-semibold"
                              >
                                Excluir
                              </button>
                            </div>
                          </div>

                          {/* Content */}
                          {!isCollapsed && (
                            <div className="p-3 space-y-3">
                              <FormField label="Tipo da Dinâmica">
                                <select
                                  value={rule.type}
                                  onChange={(e) => updateElementDynamic(selectedElement.id, rule.id, { type: e.target.value as any, config: {} })}
                                  className={inputCls}
                                >
                                  <option value="fill">Fill Color (Cor de Preenchimento)</option>
                                  <option value="stroke">Stroke Color (Cor de Borda)</option>
                                  <option value="visibility">Visibility (Visibilidade)</option>
                                  <option value="fill_level">Fill Level (Preenchimento Gradual)</option>
                                </select>
                              </FormField>

                              <FormField label="Variável de Origem">
                                <select
                                  value={rule.variableId}
                                  onChange={(e) => updateElementDynamic(selectedElement.id, rule.id, { variableId: e.target.value, config: {} })}
                                  className={inputCls}
                                >
                                  <option value="">Selecione uma variável...</option>
                                  {selectedWidget.customProperties
                                    .filter((cp) => {
                                      if (rule.type === 'fill_level') {
                                        return cp.dataType === 'Float' || cp.dataType === 'Integer';
                                      }
                                      return true;
                                    })
                                    .map((cp) => (
                                      <option key={cp.id} value={cp.id}>
                                        {cp.name} ({cp.dataType})
                                      </option>
                                    ))}
                                </select>
                                {rule.type === 'fill_level' && selectedWidget.customProperties.filter(cp => cp.dataType === 'Float' || cp.dataType === 'Integer').length === 0 && (
                                  <p className="text-[10px] text-amber-500 mt-1">Nenhuma variável Float/Integer disponível. Crie uma na aba Variáveis.</p>
                                )}
                              </FormField>

                              {/* Specific Editor */}
                              {variable ? (
                                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                                  {rule.type === 'fill' && (
                                    <FillDynamicEditor
                                      rule={rule}
                                      variable={variable}
                                      onChange={(updates) => updateElementDynamic(selectedElement.id, rule.id, updates)}
                                    />
                                  )}
                                  {rule.type === 'stroke' && (
                                    <StrokeDynamicEditor
                                      rule={rule}
                                      variable={variable}
                                      onChange={(updates) => updateElementDynamic(selectedElement.id, rule.id, updates)}
                                    />
                                  )}
                                  {rule.type === 'visibility' && (
                                    <VisibilityDynamicEditor
                                      rule={rule}
                                      variable={variable}
                                      onChange={(updates) => updateElementDynamic(selectedElement.id, rule.id, updates)}
                                    />
                                  )}
                                  {rule.type === 'fill_level' && (
                                    <FillLevelDynamicEditor
                                      rule={rule}
                                      variable={variable}
                                      onChange={(updates) => updateElementDynamic(selectedElement.id, rule.id, updates)}
                                    />
                                  )}
                                </div>
                              ) : (
                                rule.variableId && (
                                  <div className="text-[10px] text-red-500 italic">
                                    Variável selecionada não encontrada.
                                  </div>
                                )
                              )}

                              {/* Validation Errors */}
                              {hasError && (
                                <div className="p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-150 dark:border-red-900/60 rounded text-[10px] text-red-650 dark:text-red-400 space-y-1">
                                  <p className="font-bold">Erros de Validação:</p>
                                  <ul className="list-disc list-inside">
                                    {validationErrors.map((err, i) => (
                                      <li key={i}>{err.message}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Summary when Collapsed */}
                          {isCollapsed && (
                            <div className="p-3 text-[10px] text-slate-500 dark:text-slate-400 space-y-1 bg-white/40 dark:bg-slate-900/10">
                              <div>
                                Variável: <strong className="text-slate-700 dark:text-slate-350">{variable ? variable.name : '—'}</strong> 
                                {variable && <span className="text-[9px] text-slate-450 ml-1">({variable.dataType})</span>}
                              </div>
                              <div className="text-slate-450 italic truncate">
                                {renderSummary(rule, variable)}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {inspectorTab === "canvas" && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <h4 className="font-bold text-slate-800 dark:text-slate-200">Container do Canvas</h4>
          <FormField label="Largura (px)">
            <input type="number" value={selectedWidget.canvasWidth} onChange={(e) => updateCanvasSettings({ canvasWidth: Number(e.target.value) })} className={inputCls} />
          </FormField>
          <FormField label="Altura (px)">
            <input type="number" value={selectedWidget.canvasHeight} onChange={(e) => updateCanvasSettings({ canvasHeight: Number(e.target.value) })} className={inputCls} />
          </FormField>
          <FormField label="Cor de Fundo">
            <ColorPicker value={selectedWidget.backgroundColor || "#0f172a"} onChange={(v) => updateCanvasSettings({ backgroundColor: v })} />
          </FormField>
          <FormField label="Grade (px)">
            <select value={selectedWidget.gridSize || 10} onChange={(e) => updateCanvasSettings({ gridSize: Number(e.target.value) })} className={inputCls}>
              <option value={5}>5 px</option>
              <option value={10}>10 px</option>
              <option value={15}>15 px</option>
              <option value={20}>20 px</option>
            </select>
          </FormField>
        </div>
      )}

      {/* ─── Variable Modal Dialogue ────────────────────────────────────────── */}
      <Modal
        isOpen={isPropModalOpen}
        onClose={() => {
          setIsPropModalOpen(false);
          setEditingPropId(null);
        }}
        title={editingPropId ? "Editar Variável" : "Nova Variável"}
      >
        <form onSubmit={handleSaveProperty} className="space-y-4">
          <FormField label="Nome da Variável">
            <input type="text" required placeholder="Ex: MotorSpeed" value={propName} onChange={(e) => setPropName(e.target.value)} className={inputCls} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tipo de Dado">
              <select value={propType} onChange={(e) => setPropType(e.target.value as WidgetCustomPropertyDataType)} className={inputCls}>
                <option value="Float">Float</option>
                <option value="Integer">Integer</option>
                <option value="Boolean">Boolean</option>
                <option value="String">String</option>
                <option value="Color">Color</option>
              </select>
            </FormField>
            <FormField label="Valor Inicial Padrão">
              <input type="text" placeholder="Ex: 0.0 / true" value={propDefault} onChange={(e) => setPropDefault(e.target.value)} className={inputCls} />
            </FormField>
          </div>
          <FormField label="Tag Mapping / Derivation (opcional)">
            <input type="text" placeholder="Ex: Motor_1.Valves.FlowRate" value={propMapping} onChange={(e) => setPropMapping(e.target.value)} className={inputCls} />
          </FormField>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-150 dark:border-slate-800">
            <button type="button" onClick={() => { setIsPropModalOpen(false); setEditingPropId(null); }} className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold transition-colors">Cancelar</button>
            <button type="submit" className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold transition-colors">Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ─── Shape Properties Editor ─────────────────────────────────────────────────

interface ShapePropertiesEditorProps {
  element: WidgetElement;
  onUpdate: (updates: Partial<WidgetElement>) => void;
}

const ShapePropertiesEditor: React.FC<ShapePropertiesEditorProps> = ({ element, onUpdate }) => {
  const isVarDisplay = element.type === "variable_display";
  const isText = element.type === "text" || isVarDisplay;
  const isImage = element.type === "image";
  const isShape = ["rectangle", "circle", "status_light", "gauge", "tank"].includes(element.type);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <span className="font-bold text-slate-800 dark:text-slate-200 truncate pr-2">{element.name}</span>
        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-500 uppercase flex-shrink-0">{element.type}</span>
      </div>

      <FormField label="Nome da Forma">
        <input type="text" value={element.name} onChange={(e) => onUpdate({ name: e.target.value })} className={inputCls} />
      </FormField>

      <SectionLabel>Posição e Tamanho</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        {(["x", "y", "width", "height"] as const).map((k) => (
          <FormField key={k} label={k === "x" ? "X" : k === "y" ? "Y" : k === "width" ? "Largura" : "Altura"}>
            <input type="number" value={element[k]} onChange={(e) => onUpdate({ [k]: Number(e.target.value) })} className={inputCls} />
          </FormField>
        ))}
      </div>

      {(isShape || isVarDisplay) && (
        <>
          <SectionLabel>Aparência</SectionLabel>
          <FormField label="Preenchimento (Fill)">
            <ColorPicker value={element.fill} onChange={(v) => onUpdate({ fill: v })} />
          </FormField>
          <FormField label="Borda (Stroke)">
            <ColorPicker value={element.stroke} onChange={(v) => onUpdate({ stroke: v })} />
          </FormField>
          <div className="grid grid-cols-2 gap-2">
            <FormField label="Espessura da Borda">
              <input type="number" min={0} max={20} value={element.strokeWidth} onChange={(e) => onUpdate({ strokeWidth: Number(e.target.value) })} className={inputCls} />
            </FormField>
            <FormField label="Estilo da Borda">
              <select value={element.strokeStyle || "solid"} onChange={(e) => onUpdate({ strokeStyle: e.target.value as 'solid' | 'dashed' | 'dotted' })} className={inputCls}>
                <option value="solid">Sólida</option>
                <option value="dashed">Tracejada</option>
                <option value="dotted">Pontilhada</option>
              </select>
            </FormField>
          </div>
          {element.type === "rectangle" && (
            <FormField label="Arredondamento (px)">
              <input type="number" min={0} value={element.cornerRadius ?? 0} onChange={(e) => onUpdate({ cornerRadius: Number(e.target.value) })} className={inputCls} />
            </FormField>
          )}
        </>
      )}

      {isText && !isVarDisplay && (
        <>
          <SectionLabel>Texto</SectionLabel>
          <FormField label="Conteúdo">
            <input type="text" value={element.textContent || ""} onChange={(e) => onUpdate({ textContent: e.target.value })} className={inputCls} />
          </FormField>
          <FormField label="Cor do Texto">
            <ColorPicker value={element.textColor || "#ffffff"} onChange={(v) => onUpdate({ textColor: v })} />
          </FormField>
          <FormField label="Tamanho da Fonte (px)">
            <input type="number" value={element.fontSize || 14} onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })} className={inputCls} />
          </FormField>
          <FormField label="Alinhamento">
            <select value={element.textAlignment || "center"} onChange={(e) => onUpdate({ textAlignment: e.target.value as "left" | "center" | "right" })} className={inputCls}>
              <option value="left">Esquerda</option>
              <option value="center">Centro</option>
              <option value="right">Direita</option>
            </select>
          </FormField>
        </>
      )}

      {isVarDisplay && (
        <>
          <SectionLabel>Exibição da Variável</SectionLabel>
          <div className="flex items-center gap-4 py-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={element.showLabel ?? true} onChange={(e) => onUpdate({ showLabel: e.target.checked })} className="rounded" />
              <span className="text-[11px] text-slate-650 dark:text-slate-400 font-medium">Exibir Rótulo</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={element.showUnit ?? false} onChange={(e) => onUpdate({ showUnit: e.target.checked })} className="rounded" />
              <span className="text-[11px] text-slate-650 dark:text-slate-400 font-medium">Exibir Unidade</span>
            </label>
          </div>
          <FormField label="Rótulo Personalizado (deixe em branco para usar nome da variável)">
            <input type="text" placeholder="Ex: Vazão / Temperatura" value={element.customLabel || ""} onChange={(e) => onUpdate({ customLabel: e.target.value })} className={inputCls} />
          </FormField>
          <FormField label="Unidade de Medida (ex: rpm, bar, °C)">
            <input type="text" placeholder="Ex: rpm" value={element.unit || ""} onChange={(e) => onUpdate({ unit: e.target.value })} className={inputCls} />
          </FormField>
          <div className="grid grid-cols-2 gap-2">
            <FormField label="Casas Decimais">
              <input type="number" min={0} max={6} value={element.decimalPlaces ?? 2} onChange={(e) => onUpdate({ decimalPlaces: Number(e.target.value) })} className={inputCls} />
            </FormField>
            <FormField label="Fator de Conversão">
              <input type="number" step="any" value={element.conversionFactor ?? 1} onChange={(e) => onUpdate({ conversionFactor: Number(e.target.value) })} className={inputCls} />
            </FormField>
          </div>
          <FormField label="Cor do Texto">
            <ColorPicker value={element.textColor || "#38bdf8"} onChange={(v) => onUpdate({ textColor: v })} />
          </FormField>
          <FormField label="Tamanho da Fonte (px)">
            <input type="number" value={element.fontSize || 14} onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })} className={inputCls} />
          </FormField>
        </>
      )}

      {isImage && (
        <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
          <SectionLabel>Imagem Importada</SectionLabel>
          <div className="flex items-center justify-center border border-dashed border-slate-350 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-900 overflow-hidden max-h-32">
            {element.imageUri ? (
              <img src={element.imageUri} alt="Asset preview" className="max-h-24 max-w-full object-contain" />
            ) : (
              <span className="text-slate-400 italic">Sem imagem</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/png, image/jpeg, image/gif, image/svg+xml';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (readerEvent) => {
                    onUpdate({ imageUri: readerEvent.target?.result as string });
                  };
                  reader.readAsDataURL(file);
                }
              };
              input.click();
            }}
            className="w-full py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium text-[11px] transition-colors"
          >
            Substituir Imagem
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const inputCls = "w-full mt-1 p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs outline-none focus:border-sky-500 dark:focus:border-sky-500 transition-colors";

export const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">{label}</label>
    {children}
  </div>
);

export const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-600 pt-1">{children}</p>
);

export const ColorPicker: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const isTransparent = value === 'transparent';
  return (
    <div className="flex items-center gap-2 mt-1">
      <input
        type="color"
        value={value && value.startsWith('#') ? value : '#000000'}
        onChange={(e) => onChange(e.target.value)}
        disabled={isTransparent}
        className="w-8 h-7 rounded border border-slate-200 dark:border-slate-700 cursor-pointer flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000 ou transparent"
        className={cn(inputCls, "mt-0 flex-1 font-mono")}
      />
      <button
        type="button"
        onClick={() => onChange(isTransparent ? '#ffffff' : 'transparent')}
        className={cn(
          "px-2.5 py-1.5 rounded text-[10px] font-semibold border transition-colors shrink-0",
          isTransparent
            ? "bg-sky-100 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-bold"
            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
        )}
      >
        Transparente
      </button>
    </div>
  );
};

export const DataTypeBadge: React.FC<{ type: WidgetCustomPropertyDataType }> = ({ type }) => {
  const colors: Record<WidgetCustomPropertyDataType, string> = {
    Float: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400",
    Integer: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
    Boolean: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
    String: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400",
    Color: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400",
  };
  return <span className={cn("px-1.5 py-0.5 rounded font-mono text-[10px] flex-shrink-0", colors[type])}>{type}</span>;
};

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="p-4 text-center text-slate-400 dark:text-slate-600 text-[11px]">{text}</div>
);

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={cn("flex-1 flex items-center justify-center gap-1 py-2 px-1.5 border-b-2 font-semibold transition-colors text-[11px]", active ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900" : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200")}>
    {icon}<span className="hidden sm:inline">{label}</span>
  </button>
);
