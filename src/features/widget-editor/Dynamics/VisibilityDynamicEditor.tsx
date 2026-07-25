import React from 'react';
import type { DynamicRule, WidgetCustomProperty } from '../../../types/domain';
import { FormField, inputCls } from '../WidgetInspectorPanel';

interface VisibilityDynamicEditorProps {
  rule: DynamicRule;
  variable: WidgetCustomProperty;
  onChange: (updates: Partial<DynamicRule>) => void;
}

export const VisibilityDynamicEditor: React.FC<VisibilityDynamicEditorProps> = ({
  rule,
  variable,
  onChange,
}) => {
  const config = rule.config || {};

  // 1. Color DataType: Incompatible
  if (variable.dataType === 'Color') {
    return (
      <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg text-red-650 dark:text-red-400 font-medium">
        Variáveis do tipo Color não são compatíveis com a dinâmica de Visibilidade. Por favor, escolha outra variável.
      </div>
    );
  }

  // 2. Boolean DataType
  if (variable.dataType === 'Boolean') {
    const boolConfig = config.visibilityBoolean || { invert: false };

    const handleInvertChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({
        config: {
          ...config,
          visibilityBoolean: {
            invert: e.target.checked,
          },
        },
      });
    };

    return (
      <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Regra de Visibilidade Booleana</p>
        <div className="flex flex-col gap-2">
          <p className="text-[10px] text-slate-500">
            Por padrão, a forma estará <strong>Visível</strong> quando a variável for <code>TRUE</code> e <strong>Oculta</strong> quando for <code>FALSE</code>.
          </p>
          <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={boolConfig.invert}
              onChange={handleInvertChange}
              className="rounded text-sky-600 focus:ring-sky-500"
            />
            <span className="font-semibold text-slate-700 dark:text-slate-355 text-[11px]">Inverter condição (TRUE = Oculto, FALSE = Visível)</span>
          </label>
        </div>
      </div>
    );
  }

  // 3. Float/Integer DataType
  if (variable.dataType === 'Float' || variable.dataType === 'Integer') {
    const numConfig = config.visibilityNumeric || { operator: '>', value: 0, invert: false };

    const updateNumConfig = (updates: Partial<typeof numConfig>) => {
      onChange({
        config: {
          ...config,
          visibilityNumeric: {
            ...numConfig,
            ...updates,
          },
        },
      });
    };

    return (
      <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Condição Numérica</p>
        
        <div className="grid grid-cols-2 gap-2">
          <FormField label="Operador">
            <select
              value={numConfig.operator}
              onChange={(e) => updateNumConfig({ operator: e.target.value as any })}
              className={inputCls}
            >
              <option value=">">&gt; (Maior)</option>
              <option value=">=">&gt;= (Maior ou Igual)</option>
              <option value="<">&lt; (Menor)</option>
              <option value="<=">&lt;= (Menor ou Igual)</option>
              <option value="==">== (Igual)</option>
              <option value="!=">!= (Diferente)</option>
            </select>
          </FormField>

          <FormField label="Valor de Comparação">
            <input
              type="number"
              step="any"
              value={numConfig.value === undefined ? '' : numConfig.value}
              onChange={(e) => updateNumConfig({ value: e.target.value === '' ? undefined : Number(e.target.value) })}
              className={inputCls}
            />
          </FormField>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800/60">
          <p className="text-[10px] text-slate-500 mb-1.5">
            A forma estará <strong>Visível</strong> se a condição for atendida. Caso contrário, estará <strong>Oculta</strong>.
          </p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={numConfig.invert || false}
              onChange={(e) => updateNumConfig({ invert: e.target.checked })}
              className="rounded text-sky-600 focus:ring-sky-500"
            />
            <span className="font-semibold text-slate-700 dark:text-slate-355 text-[11px]">Inverter comportamento (Se verdadeiro = Ocultar)</span>
          </label>
        </div>
      </div>
    );
  }

  // 4. String DataType
  if (variable.dataType === 'String') {
    const strConfig = config.visibilityString || { operator: '==', value: '' };

    const updateStrConfig = (updates: Partial<typeof strConfig>) => {
      onChange({
        config: {
          ...config,
          visibilityString: {
            ...strConfig,
            ...updates,
          },
        },
      });
    };

    return (
      <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Condição de Texto (String)</p>
        
        <div className="space-y-2.5">
          <FormField label="Critério de Comparação">
            <select
              value={strConfig.operator}
              onChange={(e) => updateStrConfig({ operator: e.target.value as any })}
              className={inputCls}
            >
              <option value="==">Igual a</option>
              <option value="!=">Diferente de</option>
              <option value="contains">Contém</option>
              <option value="startsWith">Começa com</option>
              <option value="endsWith">Termina com</option>
            </select>
          </FormField>

          <FormField label="Valor de Comparação">
            <input
              type="text"
              placeholder="Digite o texto de comparação"
              value={strConfig.value || ''}
              onChange={(e) => updateStrConfig({ value: e.target.value })}
              className={inputCls}
            />
          </FormField>
        </div>

        <p className="text-[10px] text-slate-400 pt-1">
          A forma estará <strong>Visível</strong> se a condição for atendida. Caso contrário, estará <strong>Oculta</strong>.
        </p>
      </div>
    );
  }

  return null;
};
