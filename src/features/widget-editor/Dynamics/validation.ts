import type { DynamicRule, WidgetCustomProperty } from '../../../types/domain';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateDynamicRule(
  rule: DynamicRule,
  variables: WidgetCustomProperty[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!rule.variableId) {
    errors.push({ field: 'variableId', message: 'Nenhuma variável selecionada.' });
    return errors;
  }

  const variable = variables.find((v) => v.id === rule.variableId);
  if (!variable) {
    errors.push({ field: 'variableId', message: 'Variável selecionada não existe no widget.' });
    return errors;
  }

  if (rule.type === 'visibility' && variable.dataType === 'Color') {
    errors.push({ field: 'variableId', message: 'Variáveis do tipo Color não são compatíveis com Visibilidade.' });
    return errors;
  }

  const config = rule.config || {};

  if (rule.type === 'fill' || rule.type === 'stroke') {
    if (variable.dataType === 'Boolean') {
      const boolConfig = config.boolean;
      if (!boolConfig || !boolConfig.trueColor || !boolConfig.falseColor) {
        errors.push({ field: 'config', message: 'Configuração de cores True/False incompleta.' });
      }
    } else if (variable.dataType === 'Float' || variable.dataType === 'Integer') {
      const ranges = config.ranges || [];
      if (ranges.length === 0) {
        errors.push({ field: 'config', message: 'Adicione pelo menos uma faixa de valores.' });
      } else {
        // Validate each range
        ranges.forEach((r: any, idx: number) => {
          const loVal = parseFloat(r.lo);
          const hiVal = parseFloat(r.hi);
          if (isNaN(loVal) || isNaN(hiVal)) {
            errors.push({ field: `range-${idx}`, message: `Faixa ${idx + 1} possui valores inválidos.` });
          } else if (loVal >= hiVal) {
            errors.push({ field: `range-${idx}`, message: `Faixa ${idx + 1}: Valor inicial deve ser menor que o final.` });
          }
        });

        // Validate overlap
        const validRanges = ranges
          .map((r: any) => ({
            ...r,
            lo: parseFloat(r.lo),
            hi: parseFloat(r.hi),
          }))
          .filter((r: any) => !isNaN(r.lo) && !isNaN(r.hi) && r.lo < r.hi);

        const sorted = [...validRanges].sort((a, b) => a.lo - b.lo);
        for (let i = 0; i < sorted.length - 1; i++) {
          if (sorted[i].hi > sorted[i + 1].lo) {
            errors.push({
              field: 'ranges-overlap',
              message: `As faixas [${sorted[i].lo}–${sorted[i].hi}] e [${sorted[i + 1].lo}–${sorted[i + 1].hi}] se sobrepõem.`,
            });
          }
        }
      }
    } else if (variable.dataType === 'String') {
      const mappings = config.stringMappings || [];
      if (mappings.length === 0) {
        errors.push({ field: 'config', message: 'Adicione pelo menos um mapeamento de texto.' });
      } else {
        const values = mappings.map((m: any) => m.value.trim());
        const duplicates = values.filter((val: string, index: number) => values.indexOf(val) !== index);
        if (duplicates.length > 0) {
          errors.push({ field: 'stringMappings', message: `Valores duplicados mapeados: "${duplicates.join(', ')}".` });
        }
        mappings.forEach((m: any, idx: number) => {
          if (!m.value.trim()) {
            errors.push({ field: `mapping-${idx}`, message: `Mapeamento ${idx + 1}: O valor de texto não pode ser vazio.` });
          }
        });
      }
    }
  } else if (rule.type === 'visibility') {
    if (variable.dataType === 'Boolean') {
      // Boolean visibility only has invert, which is always valid
    } else if (variable.dataType === 'Float' || variable.dataType === 'Integer') {
      const numConfig = config.numeric;
      if (!numConfig || numConfig.value === undefined || numConfig.value === '' || isNaN(parseFloat(numConfig.value))) {
        errors.push({ field: 'config', message: 'Valor numérico da condição inválido ou vazio.' });
      }
    } else if (variable.dataType === 'String') {
      const strConfig = config.string;
      if (!strConfig || strConfig.value === undefined || strConfig.value === '') {
        errors.push({ field: 'config', message: 'Valor de comparação da condição vazio.' });
      }
    }
  }

  return errors;
}
