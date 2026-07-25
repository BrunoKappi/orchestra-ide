import React from 'react';
import type { DynamicRule, WidgetCustomProperty } from '../../../types/domain';
import { ColorPicker, FormField, inputCls } from '../WidgetInspectorPanel';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface FillDynamicEditorProps {
  rule: DynamicRule;
  variable: WidgetCustomProperty;
  onChange: (updates: Partial<DynamicRule>) => void;
}

export const FillDynamicEditor: React.FC<FillDynamicEditorProps> = ({
  rule,
  variable,
  onChange,
}) => {
  const config = rule.config || {};

  // 1. Color DataType: No additional config needed
  if (variable.dataType === 'Color') {
    return (
      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 italic">
        A cor utilizada será exatamente o valor dinâmico da variável "{variable.name}". Nenhuma configuração adicional é necessária.
      </div>
    );
  }

  // 2. Boolean DataType: True/False Colors
  if (variable.dataType === 'Boolean') {
    const booleanConfig = config.boolean || { trueColor: '#22c55e', falseColor: '#ef4444' };

    const updateBooleanConfig = (updates: Partial<typeof booleanConfig>) => {
      onChange({
        config: {
          ...config,
          boolean: {
            ...booleanConfig,
            ...updates,
          },
        },
      });
    };

    return (
      <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mapeamento Booleano</p>
        <div className="grid grid-cols-1 gap-3">
          <FormField label="Cor para TRUE">
            <ColorPicker
              value={booleanConfig.trueColor}
              onChange={(color) => updateBooleanConfig({ trueColor: color })}
            />
          </FormField>
          <FormField label="Cor para FALSE">
            <ColorPicker
              value={booleanConfig.falseColor}
              onChange={(color) => updateBooleanConfig({ falseColor: color })}
            />
          </FormField>
        </div>
      </div>
    );
  }

  // 3. Float/Integer DataType: Ranges (Faixas)
  if (variable.dataType === 'Float' || variable.dataType === 'Integer') {
    const ranges = config.ranges || [];

    const updateRanges = (newRanges: any[]) => {
      onChange({
        config: {
          ...config,
          ranges: newRanges,
        },
      });
    };

    const handleAddRange = () => {
      const newRange = {
        id: crypto.randomUUID(),
        lo: 0,
        hi: 100,
        color: '#22c55e',
      };
      updateRanges([...ranges, newRange]);
    };

    const handleUpdateRange = (id: string, updates: any) => {
      const updated = ranges.map((r: any) => (r.id === id ? { ...r, ...updates } : r));
      updateRanges(updated);
    };

    const handleDeleteRange = (id: string) => {
      updateRanges(ranges.filter((r: any) => r.id !== id));
    };

    const handleReorder = (index: number, direction: 'up' | 'down') => {
      const newRanges = [...ranges];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex >= 0 && targetIndex < newRanges.length) {
        const temp = newRanges[index];
        newRanges[index] = newRanges[targetIndex];
        newRanges[targetIndex] = temp;
        updateRanges(newRanges);
      }
    };

    return (
      <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-slate-550 uppercase tracking-wider">Faixas de Valores</p>
          <button
            type="button"
            onClick={handleAddRange}
            className="flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-medium transition-colors"
          >
            <Plus className="w-3 h-3" /><span>Adicionar Faixa</span>
          </button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {ranges.length === 0 ? (
            <p className="text-slate-400 italic text-center text-[10px] py-4">Nenhuma faixa configurada.</p>
          ) : (
            ranges.map((r: any, idx: number) => (
              <div
                key={r.id}
                className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2 animate-in fade-in duration-100"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-bold">Faixa {idx + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleReorder(idx, 'up')}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 disabled:opacity-30"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === ranges.length - 1}
                      onClick={() => handleReorder(idx, 'down')}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 disabled:opacity-30"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRange(r.id)}
                      className="p-1 hover:bg-red-50 dark:hover:bg-red-950/50 rounded text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <FormField label="De (Valor Inicial)">
                    <input
                      type="number"
                      step="any"
                      value={r.lo}
                      onChange={(e) => handleUpdateRange(r.id, { lo: e.target.value })}
                      className={inputCls}
                    />
                  </FormField>
                  <FormField label="Até (Valor Final)">
                    <input
                      type="number"
                      step="any"
                      value={r.hi}
                      onChange={(e) => handleUpdateRange(r.id, { hi: e.target.value })}
                      className={inputCls}
                    />
                  </FormField>
                </div>
                <FormField label="Cor correspondente">
                  <ColorPicker
                    value={r.color}
                    onChange={(color) => handleUpdateRange(r.id, { color: color })}
                  />
                </FormField>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // 4. String DataType: String Mappings
  if (variable.dataType === 'String') {
    const stringMappings = config.stringMappings || [];

    const updateMappings = (newMappings: any[]) => {
      onChange({
        config: {
          ...config,
          stringMappings: newMappings,
        },
      });
    };

    const handleAddMapping = () => {
      const newMapping = {
        id: crypto.randomUUID(),
        value: '',
        color: '#22c55e',
      };
      updateMappings([...stringMappings, newMapping]);
    };

    const handleUpdateMapping = (id: string, updates: any) => {
      const updated = stringMappings.map((m: any) => (m.id === id ? { ...m, ...updates } : m));
      updateMappings(updated);
    };

    const handleDeleteMapping = (id: string) => {
      updateMappings(stringMappings.filter((m: any) => m.id !== id));
    };

    return (
      <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-slate-550 uppercase tracking-wider">Mapeamento de Texto (String)</p>
          <button
            type="button"
            onClick={handleAddMapping}
            className="flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-medium transition-colors"
          >
            <Plus className="w-3 h-3" /><span>Adicionar Valor</span>
          </button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {stringMappings.length === 0 ? (
            <p className="text-slate-400 italic text-center text-[10px] py-4">Nenhum mapeamento configurado.</p>
          ) : (
            stringMappings.map((m: any, idx: number) => (
              <div
                key={m.id}
                className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2 animate-in fade-in duration-100"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-bold">Mapeamento {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteMapping(m.id)}
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-950/50 rounded text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <FormField label="Se o valor for exatamente igual a:">
                  <input
                    type="text"
                    placeholder="Ex: Running, Stopped, Fault"
                    value={m.value}
                    onChange={(e) => handleUpdateMapping(m.id, { value: e.target.value })}
                    className={inputCls}
                  />
                </FormField>
                <FormField label="Cor correspondente">
                  <ColorPicker
                    value={m.color}
                    onChange={(color) => handleUpdateMapping(m.id, { color: color })}
                  />
                </FormField>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return null;
};
