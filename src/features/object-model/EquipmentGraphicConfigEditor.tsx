import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  Sliders,
  Eye,
  Boxes,
  Save,
  Link,
  Trash2,
  Plus,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useObjectModelStore } from '../../store/useObjectModelStore';
import type { EquipmentGraphicConfig, TankGeometryType, FieldBinding } from '../../types/domain';
import { TankGeometrySvg } from '../../components/TankGeometrySvg';
import { cn } from '../../utils/cn';

const PROPERTY_UNITS: Record<string, string> = {
  Capacity: 'm³',
  Volume: 'm³',
  Level: '%',
  Flow: 'm³/h',
  Temperature: '°C',
  Pressure: 'bar',
  Density: 'kg/m³',
  Mass: 't',
  VCF: '',
};

const DEFAULT_FIELD_BINDINGS: FieldBinding[] = [
  { propertyName: 'Level', label: 'Nível', unit: '%', decimalPlaces: 1, visible: true },
  { propertyName: 'Volume', label: 'Volume', unit: 'm³', decimalPlaces: 1, visible: true },
  { propertyName: 'Temperature', label: 'Temperatura', unit: '°C', decimalPlaces: 1, visible: true },
  { propertyName: 'Pressure', label: 'Pressão', unit: 'bar', decimalPlaces: 2, visible: true },
  { propertyName: 'Flow', label: 'Vazão', unit: 'm³/h', decimalPlaces: 1, visible: true },
  { propertyName: 'Density', label: 'Densidade', unit: 'kg/m³', decimalPlaces: 1, visible: false },
  { propertyName: 'Mass', label: 'Massa', unit: 't', decimalPlaces: 1, visible: false },
];

const DEFAULT_CONFIG: EquipmentGraphicConfig = {
  geometryType: 'vertical_cylindrical',
  visibleFields: {
    tag: true, description: true, product: true, level: true,
    volume: true, temperature: true, pressure: true, flow: true,
    density: true, status: true, alarm: true,
  },
  fieldBindings: DEFAULT_FIELD_BINDINGS,
  decimalPlaces: 1,
  showLevelFill: true,
  showFooter: true,
};

const GEOMETRY_OPTIONS: Array<{ type: TankGeometryType; title: string; description: string }> = [
  { type: 'vertical_cylindrical', title: 'Cilíndrico Vertical', description: 'Tanque vertical com teto atmosférico (API 650)' },
  { type: 'horizontal_cylindrical', title: 'Cilíndrico Horizontal', description: 'Tanque horizontal para médios volumes (API 12F)' },
  { type: 'spherical', title: 'Esférico Pressurizado', description: 'Esfera para gases liquefeitos (API 2510)' },
  { type: 'pressurized', title: 'Vaso Pressurizado', description: 'Vaso com tampos abaulados (ASME VIII)' },
];

/** Returns color for the liquid fill based on geometry/status */
function getFillColor(geometry: TankGeometryType, levelPercent: number): string {
  if (levelPercent >= 80) return '#ef4444';     // High level — red
  if (levelPercent <= 15) return '#f59e0b';      // Low level — amber
  if (geometry === 'spherical' || geometry === 'pressurized') return '#818cf8'; // Pressurized — violet
  return '#38bdf8'; // Normal — sky blue
}

export const EquipmentGraphicConfigEditor: React.FC = () => {
  const {
    selectedEntity,
    selectedTemplate,
    selectedObject,
    mergedProperties,
    saveEquipmentGraphicConfig,
  } = useObjectModelStore();

  const simulatedValues = useObjectModelStore((s) => s.simulatedValues);

  const activeEntity = selectedEntity?.type === 'template' ? selectedTemplate : selectedObject;
  const currentConfig: EquipmentGraphicConfig = activeEntity?.graphicConfig || DEFAULT_CONFIG;

  const [config, setConfig] = useState<EquipmentGraphicConfig>({
    ...DEFAULT_CONFIG,
    ...currentConfig,
    fieldBindings: currentConfig.fieldBindings?.length ? currentConfig.fieldBindings : DEFAULT_FIELD_BINDINGS,
  });
  const [isSaved, setIsSaved] = useState(false);

  // Sync state if selected entity changes
  React.useEffect(() => {
    const cfg = activeEntity?.graphicConfig || DEFAULT_CONFIG;
    setConfig({
      ...DEFAULT_CONFIG,
      ...cfg,
      fieldBindings: cfg.fieldBindings?.length ? cfg.fieldBindings : DEFAULT_FIELD_BINDINGS,
    });
  }, [selectedEntity?.id]);

  if (!selectedEntity || !activeEntity) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400 dark:text-slate-500">
        <Layers className="w-12 h-12 mb-3 stroke-[1.5] text-slate-300 dark:text-slate-600" />
        <p className="text-sm font-semibold">Nenhum equipamento selecionado</p>
        <p className="text-xs mt-1">Selecione um Template ou Instância na árvore lateral para configurar o modelo gráfico.</p>
      </div>
    );
  }

  // Resolve property value (with live updates for instances)
  const getPropVal = (propName: string, fallback: string): string => {
    if (selectedEntity.type === 'instance') {
      const key = `${selectedEntity.id}:${propName}`;
      const simVal = simulatedValues[key];
      if (simVal !== undefined) return simVal;
    }
    const prop = mergedProperties.find((p) => p.name === propName);
    return prop?.defaultValue ?? fallback;
  };

  // Live values from real properties
  const tagVal = getPropVal('Tag', activeEntity.name);
  const descVal = getPropVal('Description', activeEntity.description || '');
  const prodVal = getPropVal('Product', '—');
  const levelPercent = parseFloat(getPropVal('Level', '50'));
  const inventoryStatus = getPropVal('Status', 'Normal');
  const fillColor = getFillColor(config.geometryType, levelPercent);

  const handleSave = () => {
    if (selectedEntity) {
      saveEquipmentGraphicConfig(selectedEntity.id, selectedEntity.type, config);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleGeometryChange = (type: TankGeometryType) => {
    setConfig((prev) => ({ ...prev, geometryType: type }));
  };

  const handleBindingChange = (idx: number, field: keyof FieldBinding, value: string | number | boolean) => {
    setConfig((prev) => {
      const bindings = [...prev.fieldBindings];
      bindings[idx] = { ...bindings[idx], [field]: value };
      return { ...prev, fieldBindings: bindings };
    });
  };

  const handleAddBinding = () => {
    setConfig((prev) => ({
      ...prev,
      fieldBindings: [
        ...prev.fieldBindings,
        { propertyName: '', label: 'Novo Campo', unit: '', decimalPlaces: 1, visible: true },
      ],
    }));
  };

  const handleRemoveBinding = (idx: number) => {
    setConfig((prev) => ({
      ...prev,
      fieldBindings: prev.fieldBindings.filter((_, i) => i !== idx),
    }));
  };

  const handleMoveBinding = (idx: number, direction: -1 | 1) => {
    setConfig((prev) => {
      const bindings = [...prev.fieldBindings];
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= bindings.length) return prev;
      const temp = bindings[idx];
      bindings[idx] = bindings[targetIdx];
      bindings[targetIdx] = temp;
      return { ...prev, fieldBindings: bindings };
    });
  };

  // Available property names for the dropdown (from merged properties)
  const availablePropNames = mergedProperties.map((p) => p.name).sort();

  const getPropDetails = (name: string) => {
    return mergedProperties.find((p) => p.name === name);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto p-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Configuração Gráfica do Equipamento
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 font-mono text-[10px] font-semibold border border-sky-200 dark:border-sky-800">
              {selectedEntity.type === 'template' ? 'Template Base' : 'Instância Concreta'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Geometria, bindings de propriedades e opções visuais herdadas pelas instâncias.
          </p>
        </div>

        <button
          onClick={handleSave}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all shadow-sm cursor-pointer',
            isSaved
              ? 'bg-emerald-600 text-white'
              : 'bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white'
          )}
        >
          {isSaved ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvo!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Salvar</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-7 flex flex-col gap-6">

          {/* 1. Geometry Selection */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Boxes className="w-4 h-4 text-sky-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                1. Geometria Industrial
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {GEOMETRY_OPTIONS.map((g) => {
                const isSelected = config.geometryType === g.type;
                return (
                  <button
                    key={g.type}
                    onClick={() => handleGeometryChange(g.type)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border transition-all text-left cursor-pointer relative overflow-hidden',
                      isSelected
                        ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/30 ring-2 ring-sky-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    )}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                    )}
                    {/* Mini SVG preview */}
                    <div className="shrink-0 w-10 h-12 opacity-80">
                      <TankGeometrySvg geometry={g.type} levelPercent={55} fillColor="#38bdf8" width={40} height={48} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{g.title}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">{g.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Field Bindings */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  2. Bindings de Propriedades
                </h3>
              </div>
              <button
                onClick={handleAddBinding}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Adicionar
              </button>
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-3">
              Cada campo visual do componente aponta para uma propriedade real do objeto.
              O componente resolve o valor em runtime para a instância correta.
            </p>

            <div className="space-y-2">
              {config.fieldBindings.map((binding, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex items-center gap-2 p-2.5 rounded-lg border text-xs transition-all',
                    binding.visible
                      ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
                      : 'border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30 opacity-60'
                  )}
                >
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      disabled={idx === 0}
                      onClick={() => handleMoveBinding(idx, -1)}
                      className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Mover para cima"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      disabled={idx === config.fieldBindings.length - 1}
                      onClick={() => handleMoveBinding(idx, 1)}
                      className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Mover para baixo"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Visibility toggle */}
                  <button
                    onClick={() => handleBindingChange(idx, 'visible', !binding.visible)}
                    className={cn(
                      'w-5 h-5 rounded flex items-center justify-center shrink-0 transition',
                      binding.visible
                        ? 'bg-sky-500 text-white'
                        : 'border border-slate-300 dark:border-slate-600 text-slate-400'
                    )}
                    title={binding.visible ? 'Ocultar campo' : 'Exibir campo'}
                  >
                    <Eye className="w-3 h-3" />
                  </button>

                  {/* Property selector with detailed labels (name - type (unit)) */}
                  <select
                    value={binding.propertyName}
                    onChange={(e) => handleBindingChange(idx, 'propertyName', e.target.value)}
                    className="flex-1 min-w-0 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[11px] outline-none focus:border-sky-500 truncate"
                    title="Propriedade vinculada"
                  >
                    <option value="">— selecionar propriedade —</option>
                    {availablePropNames.map((name) => {
                      const prop = getPropDetails(name);
                      const unit = prop ? PROPERTY_UNITS[prop.name] : '';
                      const unitStr = unit ? ` (${unit})` : '';
                      const label = prop ? `${prop.name} - ${prop.dataType}${unitStr}` : name;
                      return (
                        <option key={name} value={name}>
                          {label}
                        </option>
                      );
                    })}
                  </select>

                  {/* Label */}
                  <input
                    type="text"
                    value={binding.label}
                    onChange={(e) => handleBindingChange(idx, 'label', e.target.value)}
                    placeholder="Rótulo"
                    className="w-24 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] outline-none focus:border-sky-500"
                  />

                  {/* Unit */}
                  <input
                    type="text"
                    value={binding.unit}
                    onChange={(e) => handleBindingChange(idx, 'unit', e.target.value)}
                    placeholder="Unid."
                    className="w-14 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[11px] outline-none focus:border-sky-500"
                  />

                  {/* Decimal places */}
                  <select
                    value={binding.decimalPlaces}
                    onChange={(e) => handleBindingChange(idx, 'decimalPlaces', parseInt(e.target.value, 10))}
                    className="w-10 px-1 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] outline-none focus:border-sky-500"
                    title="Casas decimais"
                  >
                    {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>

                  {/* Remove */}
                  <button
                    onClick={() => handleRemoveBinding(idx)}
                    className="text-red-400 hover:text-red-600 transition shrink-0 cursor-pointer"
                    title="Remover binding"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {config.fieldBindings.length === 0 && (
                <p className="text-center text-[11px] text-slate-400 py-4">
                  Nenhum binding configurado. Clique em + Adicionar para vincular propriedades.
                </p>
              )}
            </div>
          </div>

          {/* 3. Visual Options */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                3. Opções Visuais
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Casas Decimais (padrão):
                </label>
                <select
                  value={config.decimalPlaces}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, decimalPlaces: parseInt(e.target.value, 10) }))
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono text-xs font-semibold outline-none focus:border-sky-500"
                >
                  <option value={0}>0 (Ex: 75)</option>
                  <option value={1}>1 (Ex: 75.0)</option>
                  <option value={2}>2 (Ex: 75.00)</option>
                </select>
              </div>

              <div className="flex flex-col justify-end gap-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.showLevelFill}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, showLevelFill: e.target.checked }))
                    }
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span>Animação de Nível no SVG</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.showFooter}
                    onChange={(e) => setConfig((prev) => ({ ...prev, showFooter: e.target.checked }))}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span>Rodapé com Status</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Preview */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Prévia do Componente
              </span>
              <span className="text-[11px] font-mono text-slate-400">Live Render</span>
            </div>

            {/* Dark Card Preview */}
            <div className="p-4 rounded-xl bg-slate-900 text-slate-100 shadow-xl border border-slate-800 flex flex-col gap-3">

              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h4 className="font-mono font-bold text-sm text-sky-400 tracking-wide">{tagVal || '—'}</h4>
                  <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{descVal || activeEntity.description}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-800/50">
                  OK
                </span>
              </div>

              {/* Product */}
              {prodVal && prodVal !== '—' && (
                <div className="flex items-center justify-between text-xs bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/50">
                  <span className="text-slate-400 text-[11px]">Produto:</span>
                  <span className="font-semibold text-amber-400 truncate max-w-[130px]">{prodVal}</span>
                </div>
              )}

              {/* SVG + Metrics */}
              <div className="flex items-center gap-3 my-1 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                {/* Geometry SVG */}
                <div className="shrink-0">
                  <TankGeometrySvg
                    geometry={config.geometryType}
                    levelPercent={config.showLevelFill ? levelPercent : 0}
                    fillColor={fillColor}
                    width={60}
                    height={80}
                  />
                </div>

                {/* Metric cells from fieldBindings (Scrollable area for unlimited variables) */}
                <div className="flex-1 min-w-0 max-h-[160px] overflow-y-auto pr-1">
                  <div className={cn(
                    "grid gap-1.5 text-xs",
                    config.fieldBindings.filter((b) => b.visible && b.propertyName).length > 4 
                      ? "grid-cols-2" 
                      : "grid-cols-1"
                  )}>
                    {config.fieldBindings
                      .filter((b) => b.visible && b.propertyName)
                      .map((binding) => {
                        const rawVal = getPropVal(binding.propertyName, '—');
                        const numericVal = parseFloat(rawVal);
                        const displayVal = !isNaN(numericVal)
                          ? numericVal.toFixed(binding.decimalPlaces)
                          : rawVal;

                        return (
                          <div key={binding.propertyName} className="bg-slate-900/80 p-1.5 rounded border border-slate-800 min-w-0">
                            <span className="text-[9px] text-slate-400 block truncate" title={binding.label}>{binding.label}</span>
                            <span className="font-mono font-bold text-sky-300 text-[11px] truncate block">
                              {displayVal}
                              {binding.unit && <span className="text-slate-500 text-[9px] ml-0.5">{binding.unit}</span>}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                  {config.fieldBindings.filter((b) => b.visible && b.propertyName).length === 0 && (
                    <div className="text-center text-[10px] text-slate-500 py-2">
                      Configure os bindings para exibir dados aqui
                    </div>
                  )}
                </div>
              </div>

              {/* Level bar */}
              {config.showLevelFill && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Nível</span>
                    <span className="font-mono font-bold text-sky-300">{levelPercent.toFixed(1)} %</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${levelPercent}%`, backgroundColor: fillColor }}
                    />
                  </div>
                </div>
              )}

              {/* Footer */}
              {config.showFooter && (
                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-slate-800">
                  <span>Status:</span>
                  <span className="font-semibold text-emerald-400">{inventoryStatus}</span>
                </div>
              )}
            </div>

            {/* Info about inheritance */}
            {selectedEntity.type === 'template' && (
              <div className="mt-3 p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/30 text-[11px] text-amber-400/80">
                <span className="font-semibold">Herança:</span> Esta configuração será herdada por todos os templates derivados e instâncias, podendo ser sobrescrita individualmente.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

