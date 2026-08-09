import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Bell, Save, Lock, Unlock, Database, Tag } from 'lucide-react';
import { useObjectModelStore } from '../../store/useObjectModelStore';
import { Modal } from '../../components/ui/Modal';
import { inheritanceService } from '../../services/InheritanceService';
import type { AlarmConditionType, AlarmRule } from '../../types/domain';
import { v4 as uuidv4 } from 'uuid';

export const AlarmConfigModal: React.FC = () => {
  const {
    isAlarmConfigModalOpen,
    editingAlarmProperty,
    selectedEntity,
    objects,
    closeAlarmConfigModal,
    saveAlarmConfig,
  } = useObjectModelStore();

  const [selectedObjectId, setSelectedObjectId] = useState<string>('');
  const [selectedPropName, setSelectedPropName] = useState<string>('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [rules, setRules] = useState<AlarmRule[]>([]);

  // Initialize selected object and property when modal opens
  useEffect(() => {
    if (!isAlarmConfigModalOpen) return;

    if (objects.length > 0) {
      let initialObjId = objects[0].id;
      if (selectedEntity?.type === 'instance') {
        const foundObj = objects.find((o) => o.id === selectedEntity.id);
        if (foundObj) initialObjId = foundObj.id;
      }
      setSelectedObjectId(initialObjId);

      const mergedProps = inheritanceService.getMergedProperties(initialObjId, 'instance');
      let initialPropName = editingAlarmProperty?.name || (mergedProps[0]?.name ?? '');
      if (!mergedProps.some((p) => p.name === initialPropName) && mergedProps.length > 0) {
        initialPropName = mergedProps[0].name;
      }
      setSelectedPropName(initialPropName);

      const currentProp = mergedProps.find((p) => p.name === initialPropName);
      if (currentProp?.alarmConfig) {
        setIsEnabled(currentProp.alarmConfig.enabled ?? false);
        setRules(JSON.parse(JSON.stringify(currentProp.alarmConfig.rules || [])));
      } else {
        setIsEnabled(false);
        setRules([]);
      }
    }
  }, [isAlarmConfigModalOpen, editingAlarmProperty, selectedEntity, objects]);

  // Available properties for current object
  const availableProperties = useMemo(() => {
    if (!selectedObjectId) return [];
    return inheritanceService.getMergedProperties(selectedObjectId, 'instance');
  }, [selectedObjectId]);

  // Current active property
  const activeProp = useMemo(() => {
    return availableProperties.find((p) => p.name === selectedPropName) || availableProperties[0] || null;
  }, [availableProperties, selectedPropName]);

  // Object change handler
  const handleObjectChange = (objId: string) => {
    setSelectedObjectId(objId);
    const props = inheritanceService.getMergedProperties(objId, 'instance');
    const firstPropName = props[0]?.name ?? '';
    setSelectedPropName(firstPropName);

    const targetProp = props.find((p) => p.name === firstPropName);
    if (targetProp?.alarmConfig) {
      setIsEnabled(targetProp.alarmConfig.enabled ?? false);
      setRules(JSON.parse(JSON.stringify(targetProp.alarmConfig.rules || [])));
    } else {
      setIsEnabled(false);
      setRules([]);
    }
  };

  // Property change handler
  const handlePropChange = (pName: string) => {
    setSelectedPropName(pName);
    const targetProp = availableProperties.find((p) => p.name === pName);
    if (targetProp?.alarmConfig) {
      setIsEnabled(targetProp.alarmConfig.enabled ?? false);
      setRules(JSON.parse(JSON.stringify(targetProp.alarmConfig.rules || [])));
    } else {
      setIsEnabled(false);
      setRules([]);
    }
  };

  if (!isAlarmConfigModalOpen) return null;

  const selectedObj = objects.find((o) => o.id === selectedObjectId);
  const dataType = activeProp?.dataType || 'String';
  const isNumeric = dataType === 'Integer' || dataType === 'Float';

  // Available condition types based on data type
  const getConditionOptions = (): { value: AlarmConditionType; label: string }[] => {
    switch (dataType) {
      case 'Float':
      case 'Integer':
        return [
          { value: 'HH', label: 'High High (HH)' },
          { value: 'H', label: 'High (H)' },
          { value: 'L', label: 'Low (L)' },
          { value: 'LL', label: 'Low Low (LL)' },
          { value: 'Equal', label: 'Equal (==)' },
          { value: 'NotEqual', label: 'Not Equal (!=)' },
        ];
      case 'Boolean':
        return [
          { value: 'BitTrue', label: 'Bit True (TRUE)' },
          { value: 'BitFalse', label: 'Bit False (FALSE)' },
          { value: 'Equal', label: 'Equal (==)' },
          { value: 'NotEqual', label: 'Not Equal (!=)' },
        ];
      case 'String':
        return [
          { value: 'TextMatch', label: 'Text Equal (==)' },
          { value: 'NotEqual', label: 'Text Not Equal (!=)' },
        ];
      default:
        return [
          { value: 'Equal', label: 'Equal (==)' },
          { value: 'NotEqual', label: 'Not Equal (!=)' },
        ];
    }
  };

  const handleAddRule = () => {
    const options = getConditionOptions();
    if (options.length === 0 || !activeProp) return;

    const defaultType = options[0].value;

    const newRule: AlarmRule = {
      id: uuidv4(),
      type: defaultType,
      enabled: true,
      blocked: false,
      compareValue: dataType === 'Boolean' ? 'true' : '0',
      severity: 'medium',
      priority: 50,
      message: `[${selectedObj?.name || 'Objeto'}] Alerta em ${activeProp.name}`,
      color: '#eab308',
      icon: 'AlertCircle',
      activationDelay: 0,
      returnDelay: 0,
      hysteresis: 0,
      requireAck: true,
      historical: true,
    };

    setRules([...rules, newRule]);
  };

  const handleRemoveRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  const handleUpdateRule = (id: string, updates: Partial<AlarmRule>) => {
    setRules(
      rules.map((r) => {
        if (r.id === id) {
          const updated = { ...r, ...updates };

          if (updates.severity) {
            if (updates.severity === 'critical') {
              updated.color = '#ef4444';
              updated.icon = 'ShieldAlert';
            } else if (updates.severity === 'high') {
              updated.color = '#f97316';
              updated.icon = 'AlertTriangle';
            } else if (updates.severity === 'medium') {
              updated.color = '#eab308';
              updated.icon = 'AlertCircle';
            } else {
              updated.color = '#3b82f6';
              updated.icon = 'Bell';
            }
          }

          return updated;
        }
        return r;
      })
    );
  };

  const handleSave = () => {
    if (!selectedPropName || !selectedObjectId) return;
    saveAlarmConfig(
      selectedPropName,
      {
        enabled: isEnabled,
        rules,
      },
      selectedObjectId,
      'instance'
    );
  };

  return (
    <Modal
      isOpen={isAlarmConfigModalOpen}
      onClose={closeAlarmConfigModal}
      title="Setup de Alarmes de Processo"
      subtitle="Configure limites e regras de monitoramento SCADA associadas aos objetos reais da aplicação."
      maxWidth="max-w-4xl"
    >
      <div className="space-y-5 text-xs text-slate-800 dark:text-slate-200">
        {/* Object & Property Selection Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
              <Database className="w-3.5 h-3.5 text-sky-500" />
              <span>Objeto Real (Equipamento)</span>
            </label>
            <select
              value={selectedObjectId}
              onChange={(e) => handleObjectChange(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none focus:border-sky-500 transition-colors"
            >
              {objects.map((obj) => (
                <option key={obj.id} value={obj.id}>
                  {obj.name} ({obj.description || 'Equipamento'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5 text-sky-500" />
              <span>Propriedade Vinculada</span>
            </label>
            <select
              value={selectedPropName}
              onChange={(e) => handlePropChange(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none focus:border-sky-500 transition-colors"
            >
              {availableProperties.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.dataType} - {p.description || p.category || 'Atributo'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Enable / Disable Alarms Main Toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="space-y-0.5">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">
              Habilitar Alarmes para {activeProp?.name ?? 'esta propriedade'}
            </h4>
            <p className="text-[11px] text-slate-400">
              Ativa ou desativa a avaliação contínua pelo simulador global. Tipo de Dado: <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">{dataType}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsEnabled(!isEnabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              isEnabled ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                isEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {isEnabled && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Regras de Alarme</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-mono">
                  {rules.length}
                </span>
              </h4>
              <button
                type="button"
                onClick={handleAddRule}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors font-semibold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Regra</span>
              </button>
            </div>

            {rules.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <Bell className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="font-semibold text-slate-400">Nenhum limite ou alarme cadastrado.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Clique em "Adicionar Regra" para monitorar esta variável.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1">
                {rules.map((rule, idx) => (
                  <div
                    key={rule.id}
                    className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 rounded-xl shadow-2xs relative group"
                  >
                    {/* Header Controls */}
                    <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-mono font-bold text-[10px] text-slate-400">
                          {idx + 1}
                        </span>

                        {/* Condition Type */}
                        <select
                          value={rule.type}
                          onChange={(e) => handleUpdateRule(rule.id, { type: e.target.value as AlarmConditionType })}
                          className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-semibold text-slate-900 dark:text-slate-100 text-xs focus:border-sky-500"
                        >
                          {getConditionOptions().map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>

                        {/* Severity Badge */}
                        <select
                          value={rule.severity}
                          onChange={(e) => handleUpdateRule(rule.id, { severity: e.target.value as any })}
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase border outline-none ${
                            rule.severity === 'critical'
                              ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300'
                              : rule.severity === 'high'
                              ? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/40 dark:border-orange-900/60 dark:text-orange-300'
                              : rule.severity === 'medium'
                              ? 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-950/40 dark:border-yellow-900/60 dark:text-yellow-300'
                              : 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-300'
                          }`}
                        >
                          <option value="low">Low (Baixa)</option>
                          <option value="medium">Medium (Média)</option>
                          <option value="high">High (Alta)</option>
                          <option value="critical">Critical (Crítica)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Block Temporarily Toggle */}
                        <button
                          type="button"
                          onClick={() => handleUpdateRule(rule.id, { blocked: !rule.blocked })}
                          className={`p-1.5 rounded-lg border flex items-center justify-center transition-colors ${
                            rule.blocked
                              ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-400'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                          }`}
                          title={rule.blocked ? 'Desbloquear Geração de Alarmes' : 'Bloquear Temporariamente Alarme'}
                        >
                          {rule.blocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>

                        {/* Enable toggle for individual rule */}
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rule.enabled}
                            onChange={(e) => handleUpdateRule(rule.id, { enabled: e.target.checked })}
                            className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
                          />
                          <span className="text-[10px] text-slate-500 font-semibold uppercase">Ativo</span>
                        </label>

                        {/* Delete Rule */}
                        <button
                          type="button"
                          onClick={() => handleRemoveRule(rule.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                          title="Remover Regra"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Rule parameters grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Compare value (hide for BitTrue / BitFalse) */}
                      {rule.type !== 'BitTrue' && rule.type !== 'BitFalse' && (
                        <div className="md:col-span-1">
                          <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                            Valor Limite
                          </label>
                          {dataType === 'Boolean' ? (
                            <select
                              value={rule.compareValue}
                              onChange={(e) => handleUpdateRule(rule.id, { compareValue: e.target.value })}
                              className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-mono focus:border-sky-500"
                            >
                              <option value="true">TRUE</option>
                              <option value="false">FALSE</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={rule.compareValue}
                              onChange={(e) => handleUpdateRule(rule.id, { compareValue: e.target.value })}
                              placeholder="ex: 85.0"
                              className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-mono focus:border-sky-500"
                            />
                          )}
                        </div>
                      )}

                      {/* Custom Message */}
                      <div className={rule.type === 'BitTrue' || rule.type === 'BitFalse' ? 'md:col-span-2' : 'md:col-span-2'}>
                        <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                          Mensagem Personalizada
                        </label>
                        <input
                          type="text"
                          value={rule.message}
                          onChange={(e) => handleUpdateRule(rule.id, { message: e.target.value })}
                          placeholder="Mensagem do alarme..."
                          className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-sky-500"
                        />
                      </div>

                      {/* Priority */}
                      <div className="md:col-span-1">
                        <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                          Prioridade (1-100)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={rule.priority}
                          onChange={(e) => handleUpdateRule(rule.id, { priority: parseInt(e.target.value) || 1 })}
                          className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-mono focus:border-sky-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      {/* Delays & Hysteresis */}
                      <div>
                        <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                          Delay de Ativação (seg)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={rule.activationDelay}
                          onChange={(e) => handleUpdateRule(rule.id, { activationDelay: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-mono focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                          Delay de Retorno (seg)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={rule.returnDelay}
                          onChange={(e) => handleUpdateRule(rule.id, { returnDelay: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-mono focus:border-sky-500"
                        />
                      </div>

                      {/* Hysteresis (numeric only) */}
                      {isNumeric && (
                        <div>
                          <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                            Histerese
                          </label>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={rule.hysteresis}
                            onChange={(e) => handleUpdateRule(rule.id, { hysteresis: Math.max(0, parseFloat(e.target.value) || 0) })}
                            className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-mono focus:border-sky-500"
                          />
                        </div>
                      )}

                      {/* Action style/color picker */}
                      <div>
                        <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                          Cor Associada
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={rule.color}
                            onChange={(e) => handleUpdateRule(rule.id, { color: e.target.value })}
                            className="w-7 h-7 rounded border border-slate-200 cursor-pointer overflow-hidden p-0"
                          />
                          <input
                            type="text"
                            value={rule.color}
                            onChange={(e) => handleUpdateRule(rule.id, { color: e.target.value })}
                            className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-mono focus:border-sky-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                      {/* Checkboxes for options */}
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rule.requireAck}
                          onChange={(e) => handleUpdateRule(rule.id, { requireAck: e.target.checked })}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
                        />
                        <div className="leading-none">
                          <span className="font-semibold text-slate-750 dark:text-slate-200">Requerer Reconhecimento (Ack)</span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">Alarme precisa ser reconhecido pelo operador.</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rule.historical}
                          onChange={(e) => handleUpdateRule(rule.id, { historical: e.target.checked })}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
                        />
                        <div className="leading-none">
                          <span className="font-semibold text-slate-750 dark:text-slate-200">Registrar no Histórico</span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">Grava os eventos na tabela de histórico de alarmes.</span>
                        </div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer controls */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={closeAlarmConfigModal}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar Configuração</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
