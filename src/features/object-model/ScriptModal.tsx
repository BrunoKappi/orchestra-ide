import React, { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { ScriptTrigger } from '../../types/domain';
import { useObjectModelStore } from '../../store/useObjectModelStore';
import { Modal } from '../../components/ui/Modal';

const ALL_TRIGGERS: ScriptTrigger[] = [
  'Initialize',
  'Execute',
  'Shutdown',
  'Value Changed',
  'On True',
  'On False',
  'While True',
  'Manual',
  'Custom',
];

// Triggers that require a trigger expression field
const EXPRESSION_TRIGGERS: ScriptTrigger[] = [
  'Value Changed',
  'On True',
  'On False',
  'While True',
  'Custom',
];

// Triggers that require a loop time field
const LOOP_TRIGGERS: ScriptTrigger[] = ['Execute', 'While True'];

const TRIGGER_LABELS: Record<ScriptTrigger, string> = {
  Initialize: 'Initialize (On Startup)',
  Execute: 'Execute (Cyclic Loop)',
  Shutdown: 'Shutdown (On Stop)',
  'Value Changed': 'Value Changed (Tag On-Change)',
  'On True': 'On True (While condition is true)',
  'On False': 'On False (While condition is false)',
  'While True': 'While True (Loop while condition holds)',
  Manual: 'Manual (Operator Triggered)',
  Custom: 'Custom Expression',
};

type ScriptFormData = {
  name: string;
  trigger: ScriptTrigger;
  triggerExpression: string;
  loopTimeMs: number | null;
  code: string;
  description: string;
};

export const ScriptModal: React.FC = () => {
  const { isScriptModalOpen, editingScript, closeScriptModal, saveScript, mergedProperties } =
    useObjectModelStore();

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<ScriptFormData>({
    defaultValues: {
      name: '',
      trigger: 'Execute',
      triggerExpression: '',
      loopTimeMs: 1000,
      code: '// Enter industrial automation script logic\n',
      description: '',
    },
  });

  const trigger = useWatch({ control, name: 'trigger' }) as ScriptTrigger;
  const triggerExpression = useWatch({ control, name: 'triggerExpression' });

  const showExpressionField = EXPRESSION_TRIGGERS.includes(trigger);
  const showLoopField = LOOP_TRIGGERS.includes(trigger);

  // IntelliSense state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionPrefix, setSuggestionPrefix] = useState('');
  const expressionRef = useRef<HTMLInputElement>(null);

  // Build suggestion list from current entity's merged properties
  const propertySuggestions = mergedProperties.map(
    (p) => `me.${p.name}`
  );

  // Detect "me." prefix and compute suggestions
  useEffect(() => {
    const val = triggerExpression ?? '';
    const meMatch = val.match(/me\.([a-zA-Z0-9_]*)$/);
    if (meMatch !== null) {
      const typed = meMatch[1].toLowerCase();
      const filtered = propertySuggestions.filter((s) =>
        s.toLowerCase().startsWith(`me.${typed}`)
      );
      setSuggestions(filtered.slice(0, 8));
      setSuggestionPrefix(`me.${meMatch[1]}`);
    } else {
      setSuggestions([]);
      setSuggestionPrefix('');
    }
  }, [triggerExpression]);

  const applySuggestion = (suggestion: string) => {
    const val = triggerExpression ?? '';
    const newVal = val.slice(0, val.length - suggestionPrefix.length) + suggestion;
    setValue('triggerExpression', newVal);
    setSuggestions([]);
    expressionRef.current?.focus();
  };

  useEffect(() => {
    if (editingScript) {
      reset({
        name: editingScript.name,
        trigger: editingScript.trigger as ScriptTrigger,
        triggerExpression: editingScript.triggerExpression ?? '',
        loopTimeMs: editingScript.loopTimeMs ?? 1000,
        code: editingScript.code,
        description: editingScript.description,
      });
    } else {
      reset({
        name: '',
        trigger: 'Execute',
        triggerExpression: '',
        loopTimeMs: 1000,
        code: '// Enter industrial automation script logic\n',
        description: '',
      });
    }
  }, [editingScript, reset, isScriptModalOpen]);

  const onSubmit = (data: ScriptFormData) => {
    saveScript({
      name: data.name,
      trigger: data.trigger as ScriptTrigger,
      triggerExpression: data.triggerExpression,
      loopTimeMs: showLoopField ? (data.loopTimeMs ?? null) : null,
      code: data.code,
      description: data.description,
    });
  };

  const isEditingInherited = editingScript?.isInherited;

  return (
    <Modal
      isOpen={isScriptModalOpen}
      onClose={closeScriptModal}
      title={
        editingScript
          ? isEditingInherited
            ? 'Override Inherited Script'
            : 'Edit Script'
          : 'Create New Script'
      }
      subtitle={
        isEditingInherited
          ? `Editing will create a local override for script "${editingScript.name}".`
          : 'Define automation routines triggered by runtime events.'
      }
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
        {/* Name */}
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
            Script Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            {...register('name')}
            placeholder="e.g. OnLevelAlarm"
            readOnly={isEditingInherited}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-sky-500 font-mono"
          />
          {errors.name && (
            <p className="text-rose-500 text-[11px] mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Trigger Selection */}
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
            Trigger Type <span className="text-rose-500">*</span>
          </label>
          <select
            {...register('trigger')}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-sky-500 font-medium"
          >
            {ALL_TRIGGERS.map((t) => (
              <option key={t} value={t}>
                {TRIGGER_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        {/* Trigger Expression — conditional */}
        {showExpressionField && (
          <div className="relative">
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Trigger Expression
              <span className="ml-2 text-[10px] font-normal text-slate-400">
                Type <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">me.</code> for IntelliSense
              </span>
            </label>
            <input
              type="text"
              {...register('triggerExpression')}
              ref={(el) => {
                register('triggerExpression').ref(el);
                (expressionRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
              }}
              placeholder={
                trigger === 'Value Changed'
                  ? 'e.g. me.Level'
                  : trigger === 'Custom'
                  ? 'e.g. me.Status == true && me.Pressure > 5.0'
                  : 'e.g. me.AlarmActive == true'
              }
              autoComplete="off"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-sky-500 font-mono"
            />
            {/* IntelliSense Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => applySuggestion(s)}
                    className="w-full text-left px-3 py-1.5 hover:bg-sky-50 dark:hover:bg-sky-900/30 text-xs font-mono text-slate-700 dark:text-slate-300 flex items-center gap-2"
                  >
                    <span className="text-sky-500 text-[10px] font-sans font-semibold uppercase tracking-wide w-10 shrink-0">prop</span>
                    {s}
                    <span className="ml-auto text-[10px] text-slate-400 font-sans">
                      {mergedProperties.find((p) => `me.${p.name}` === s)?.dataType}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Loop Time — conditional */}
        {showLoopField && (
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Loop Time (ms)
              <span className="ml-2 text-[10px] font-normal text-slate-400">
                Execution interval in milliseconds
              </span>
            </label>
            <input
              type="number"
              {...register('loopTimeMs')}
              min={50}
              step={50}
              placeholder="1000"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-sky-500 font-mono"
            />
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
            Description
          </label>
          <input
            type="text"
            {...register('description')}
            placeholder="Purpose of this script routine..."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-sky-500"
          />
        </div>

        {/* Code Content */}
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
            Script Code
          </label>
          <textarea
            {...register('code')}
            rows={8}
            placeholder="// Pseudocode or JavaScript routine..."
            className="w-full px-3 py-2 bg-slate-950 text-emerald-400 font-mono border border-slate-800 rounded-lg outline-none focus:border-sky-500 text-xs leading-relaxed"
          />
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={closeScriptModal}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-xs transition-colors"
          >
            {editingScript ? 'Save Changes' : 'Create Script'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
