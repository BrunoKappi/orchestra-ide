import React, { useState, useCallback } from 'react';
import { Zap, Check, ChevronDown, AlertTriangle, Lock } from 'lucide-react';
import type { TankCardData } from '../types';
import { useObjectModelStore } from '../../../store/useObjectModelStore';
import { useLogStore } from '../../../store/useLogStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { cn } from '../../../utils/cn';

interface CommandCardProps {
  card: TankCardData;
  isSelected?: boolean;
  isViewMode?: boolean;
  onClick?: () => void;
}

const ENUM_OPTIONS_MAP: Record<string, string[]> = {
  OperationalMode: ['Automático', 'Manual', 'Manutenção'],
};

/** Resolve enum options from the property config or fallback map */
function resolveEnumOptions(propertyName: string, enumOptions?: string[]): string[] {
  if (enumOptions && enumOptions.length > 0) return enumOptions;
  return ENUM_OPTIONS_MAP[propertyName] || ['Opção A', 'Opção B'];
}

export const CommandCard: React.FC<CommandCardProps> = ({
  card,
  isSelected = false,
  isViewMode = false,
  onClick,
}) => {
  const cfg = card.commandConfig;
  const simulatedValues = useObjectModelStore((s) => s.simulatedValues);
  const updateSimulatedValue = useObjectModelStore((s) => s.updateSimulatedValue);
  // Subscribe to tick to trigger re-render on simulation updates
  const simulationTickCount = useObjectModelStore((s) => s.simulationTickCount);
  void simulationTickCount;

  const currentUser = useAuthStore((s) => s.currentUser);
  const addLog = useLogStore((s) => s.addLog);

  const [showDropdown, setShowDropdown] = useState(false);
  const [numericInput, setNumericInput] = useState<string>('');
  const [numericEditing, setNumericEditing] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<string | null>(null);

  if (!cfg) {
    return (
      <div
        className={cn(
          'flex-1 rounded-2xl border flex flex-col items-center justify-center p-4 text-center transition-all',
          isSelected
            ? 'border-sky-500 ring-2 ring-sky-500/20 bg-slate-50 dark:bg-[#1a1b1f]'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16171b]'
        )}
        onClick={onClick}
      >
        <Zap className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
        <p className="text-xs text-slate-400 dark:text-slate-500">Card de Comando não configurado</p>
        {!isViewMode && <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">Clique para configurar</p>}
      </div>
    );
  }

  const valueKey = `${cfg.objectId}:${cfg.propertyName}`;
  const rawValue = simulatedValues[valueKey] ?? '';
  const dataType = cfg.dataType;
  const enumOptions = resolveEnumOptions(cfg.propertyName, cfg.enumOptions);

  const executeCommand = useCallback((newValue: string) => {
    const prevValue = simulatedValues[valueKey] ?? '';
    const userName = currentUser?.name || 'Operador';

    // Log with Grid Designer origin BEFORE updating to avoid log duplication from Runtime module
    addLog({
      user: userName,
      module: 'Grid Designer',
      entity: 'Comando Operacional',
      operation: 'EXECUTE',
      action: `Comando: ${cfg.commandLabel}`,
      description: `Operador alterou "${cfg.propertyLabel}" de "${cfg.objectName}" via Grid Designer. Valor: "${prevValue}" → "${newValue}".`,
      severity: 'Informação',
      result: 'Sucesso',
      origin: 'grid-designer',
      targetId: cfg.objectId,
      previousValue: prevValue,
      newValue,
    });

    updateSimulatedValue(valueKey, newValue);
  }, [cfg, valueKey, simulatedValues, currentUser, addLog, updateSimulatedValue]);

  const handleExecute = useCallback((newValue: string) => {
    if (cfg.confirmBeforeExecute && dataType === 'Boolean') {
      setPendingConfirm(newValue);
      return;
    }
    executeCommand(newValue);
  }, [cfg.confirmBeforeExecute, dataType, executeCommand]);

  const handleConfirm = () => {
    if (pendingConfirm !== null) {
      executeCommand(pendingConfirm);
      setPendingConfirm(null);
    }
  };

  // Boolean value parsing
  const boolValue = rawValue === 'true' || rawValue === '1' || rawValue === 'True';

  // Accent color based on boolean state
  const accentColor = dataType === 'Boolean'
    ? (boolValue ? '#10b981' : '#64748b')
    : '#f59e0b';

  return (
    <div
      className={cn(
        'flex-1 rounded-2xl border flex flex-col overflow-hidden transition-all duration-200 relative',
        isSelected && !isViewMode
          ? 'border-sky-500 ring-2 ring-sky-500/20'
          : 'border-slate-200 dark:border-slate-800',
        'bg-white dark:bg-[#16171b]'
      )}
      onClick={!isViewMode ? onClick : undefined}
    >
      {/* Accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-colors duration-300"
        style={{ backgroundColor: accentColor }}
      />

      {/* Header */}
      <div className="pl-4 pr-3 pt-3 pb-2 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Zap className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 font-mono">
              Comando
            </span>
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">
            {cfg.commandLabel || cfg.propertyLabel}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
            {cfg.objectName} · {cfg.propertyLabel}
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-1 ml-2">
          <span className="text-[9px] font-mono font-semibold text-slate-400 dark:text-slate-500 uppercase">
            {dataType}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-slate-100 dark:border-slate-800/60" />

      {/* Value + Control */}
      <div className="px-4 py-3 flex-1 flex flex-col gap-3">
        {/* Current Value Display */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Valor atual</span>
          <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-100">
            {dataType === 'Boolean'
              ? (boolValue ? 'Ligado' : 'Desligado')
              : rawValue || '—'}
          </span>
        </div>

        {/* Control — Boolean */}
        {dataType === 'Boolean' && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {boolValue ? 'Ativo' : 'Inativo'}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleExecute(boolValue ? 'false' : 'true');
              }}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 cursor-pointer',
                boolValue
                  ? 'bg-emerald-500 hover:bg-emerald-400'
                  : 'bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
              )}
              title={boolValue ? 'Clique para desligar' : 'Clique para ligar'}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300',
                  boolValue ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        )}

        {/* Control — Enum */}
        {dataType === 'Enum' && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown((prev) => !prev);
              }}
              className={cn(
                'w-full flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer',
                'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700',
                'hover:border-sky-400 dark:hover:border-sky-500 hover:bg-sky-50/30 dark:hover:bg-sky-900/10',
                'text-slate-700 dark:text-slate-200'
              )}
            >
              <span className="truncate">{rawValue || enumOptions[0]}</span>
              <ChevronDown className={cn('w-3.5 h-3.5 text-slate-400 shrink-0 ml-1 transition-transform', showDropdown && 'rotate-180')} />
            </button>

            {showDropdown && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                {enumOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDropdown(false);
                      handleExecute(opt);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2',
                      opt === rawValue
                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}
                  >
                    {opt === rawValue && <Check className="w-3 h-3 shrink-0" />}
                    {opt !== rawValue && <span className="w-3 h-3 shrink-0" />}
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Control — Numeric */}
        {(dataType === 'Float' || dataType === 'Integer') && (
          <div className="flex items-center gap-2">
            {numericEditing ? (
              <div className="flex items-center gap-1.5 flex-1">
                <input
                  type="number"
                  value={numericInput}
                  onChange={(e) => setNumericInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setNumericEditing(false);
                      if (numericInput !== '') handleExecute(numericInput);
                    }
                    if (e.key === 'Escape') {
                      setNumericEditing(false);
                      setNumericInput('');
                    }
                  }}
                  className="flex-1 px-2 py-1 text-xs font-mono font-bold rounded-lg border border-sky-400 dark:border-sky-500 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  step={dataType === 'Integer' ? '1' : '0.1'}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setNumericEditing(false);
                    if (numericInput !== '') handleExecute(numericInput);
                  }}
                  className="px-2 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setNumericInput(rawValue);
                  setNumericEditing(true);
                }}
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-sky-400 dark:hover:border-sky-500 text-left text-xs font-mono font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                {rawValue || '0'}
              </button>
            )}
          </div>
        )}

        {/* Unsupported dataType notice */}
        {dataType === 'String' && (
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/60 rounded-lg px-2 py-1.5 border border-slate-200 dark:border-slate-800">
            <Lock className="w-3 h-3 shrink-0" />
            <span>Propriedade String — somente leitura no modo operacional</span>
          </div>
        )}
      </div>

      {/* Confirmation overlay */}
      {pendingConfirm !== null && (
        <div className="absolute inset-0 rounded-2xl bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-40 p-4">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
          <p className="text-xs font-bold text-white text-center">
            Confirmar alteração de {cfg.propertyLabel}?
          </p>
          <p className="text-[10px] text-slate-300 text-center">
            {cfg.objectName}: <span className="font-mono text-amber-300">{rawValue}</span>{' '}
            →{' '}
            <span className="font-mono text-emerald-400">
              {pendingConfirm === 'true' ? 'Ligado' : 'Desligado'}
            </span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setPendingConfirm(null); }}
              className="px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleConfirm(); }}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
