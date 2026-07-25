import React from 'react';
import type { DynamicRule, WidgetCustomProperty } from '../../../types/domain';
import { ColorPicker, FormField, inputCls } from '../WidgetInspectorPanel';

interface FillLevelDynamicEditorProps {
  rule: DynamicRule;
  variable: WidgetCustomProperty;
  onChange: (updates: Partial<DynamicRule>) => void;
}

export const FillLevelDynamicEditor: React.FC<FillLevelDynamicEditorProps> = ({
  rule,
  variable,
  onChange,
}) => {
  if (variable.dataType !== 'Float' && variable.dataType !== 'Integer') {
    return (
      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg text-amber-700 dark:text-amber-400 text-[11px] font-medium">
        A dinâmica de Nível de Preenchimento é compatível apenas com variáveis do tipo{' '}
        <strong>Float</strong> ou <strong>Integer</strong>. Selecione uma variável numérica.
      </div>
    );
  }

  const config = rule.config?.fillLevel ?? {
    minValue: 0,
    maxValue: 100,
    fillColor: '#0ea5e9',
    emptyColor: 'transparent',
    direction: 'bottom-up',
  };

  const update = (updates: Partial<typeof config>) => {
    onChange({
      config: {
        ...rule.config,
        fillLevel: {
          ...config,
          ...updates,
        },
      },
    });
  };

  const pctPreview = Math.min(
    100,
    Math.max(0, ((50 - config.minValue) / (config.maxValue - config.minValue)) * 100)
  );

  return (
    <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg">
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
        Nível de Preenchimento
      </p>
      <p className="text-[10px] text-slate-500 leading-relaxed">
        O fundo do elemento será preenchido proporcionalmente ao valor da variável, como um tanque
        enchendo. O valor mínimo corresponde a 0% e o máximo a 100%.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <FormField label="Valor Mínimo">
          <input type="number" step="any" value={config.minValue}
            onChange={(e) => update({ minValue: parseFloat(e.target.value) || 0 })}
            className={inputCls} />
        </FormField>
        <FormField label="Valor Máximo">
          <input type="number" step="any" value={config.maxValue}
            onChange={(e) => update({ maxValue: parseFloat(e.target.value) || 100 })}
            className={inputCls} />
        </FormField>
      </div>
      <FormField label="Direção do Preenchimento">
        <select value={config.direction}
          onChange={(e) => update({ direction: e.target.value as any })}
          className={inputCls}>
          <option value="bottom-up">De baixo para cima (↑)</option>
          <option value="top-down">De cima para baixo (↓)</option>
          <option value="left-right">Da esquerda para a direita (→)</option>
          <option value="right-left">Da direita para a esquerda (←)</option>
        </select>
      </FormField>
      <FormField label="Cor do Preenchimento">
        <ColorPicker value={config.fillColor} onChange={(color) => update({ fillColor: color })} />
      </FormField>
      <FormField label="Cor do Fundo Vazio">
        <ColorPicker value={config.emptyColor} onChange={(color) => update({ emptyColor: color })} />
      </FormField>
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Prévia — valor intermediário
        </p>
        <div className="w-full h-8 rounded border border-slate-300 dark:border-slate-700 overflow-hidden relative"
          style={{ backgroundColor: config.emptyColor === 'transparent' ? '#1e293b' : config.emptyColor }}>
          {config.direction === 'bottom-up' && (
            <div className="absolute bottom-0 left-0 right-0 transition-all duration-300"
              style={{ height: `${pctPreview}%`, backgroundColor: config.fillColor }} />
          )}
          {config.direction === 'top-down' && (
            <div className="absolute top-0 left-0 right-0 transition-all duration-300"
              style={{ height: `${pctPreview}%`, backgroundColor: config.fillColor }} />
          )}
          {config.direction === 'left-right' && (
            <div className="absolute top-0 bottom-0 left-0 transition-all duration-300"
              style={{ width: `${pctPreview}%`, backgroundColor: config.fillColor }} />
          )}
          {config.direction === 'right-left' && (
            <div className="absolute top-0 bottom-0 right-0 transition-all duration-300"
              style={{ width: `${pctPreview}%`, backgroundColor: config.fillColor }} />
          )}
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow">
            {Math.round(pctPreview)}%
          </span>
        </div>
        <p className="text-[9px] text-slate-400 mt-1 text-center">
          Range: {config.minValue} → {config.maxValue} | Ref. 50 = {Math.round(pctPreview)}%
        </p>
      </div>
    </div>
  );
};