import React, { useState, useRef } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  Info,
  Ruler,
  FlaskConical,
  Hash,
  ArrowUpDown,
} from 'lucide-react';
import { useObjectModelStore } from '../../store/useObjectModelStore';
import { templateRepo } from '../../repository/TemplateRepository';
import type { TankStrappingConfig, StrappingPoint } from '../../types/domain';
import { cn } from '../../utils/cn';

// ---------------------------------------------------------------------------
// Default empty config
// ---------------------------------------------------------------------------
const DEFAULT_STRAPPING: TankStrappingConfig = {
  levelUnit: '%',
  volumeUnit: 'm³',
  referenceHeight: 10,
  nominalCapacity: 1000,
  points: [
    { level: 0, volume: 0 },
    { level: 25, volume: 250 },
    { level: 50, volume: 500 },
    { level: 75, volume: 750 },
    { level: 100, volume: 1000 },
  ],
};

const GEOMETRY_LABELS: Record<string, string> = {
  vertical_cylindrical: 'Cilíndrico Vertical',
  horizontal_cylindrical: 'Cilíndrico Horizontal',
  spherical: 'Esférico Pressurizado',
  pressurized: 'Vaso Pressurizado',
};

const GEOMETRY_CURVE_NOTES: Record<string, string> = {
  vertical_cylindrical: 'Relação linear — seção transversal constante',
  horizontal_cylindrical: 'Relação não-linear — setor circular variável',
  spherical: 'Relação côncava-convexa — calota esférica',
  pressurized: 'Relação aproximada — vaso com tampos abaulados',
};

// ---------------------------------------------------------------------------
// SVG Capacity Curve Chart
// ---------------------------------------------------------------------------
interface CurveChartProps {
  points: StrappingPoint[];
  currentLevel: number;
  nominalCapacity: number;
  levelUnit: string;
  volumeUnit: string;
}

const CurveChart: React.FC<CurveChartProps> = ({
  points,
  currentLevel,
  nominalCapacity,
  levelUnit,
  volumeUnit,
}) => {
  const W = 320;
  const H = 200;
  const PAD = { top: 12, right: 16, bottom: 36, left: 52 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  if (points.length < 2) {
    return (
      <div className="flex items-center justify-center h-48 text-xs text-slate-400 dark:text-slate-500">
        Adicione pelo menos 2 pontos para exibir a curva.
      </div>
    );
  }

  const sorted = [...points].sort((a, b) => a.level - b.level);
  const maxLevel = Math.max(...sorted.map((p) => p.level), 100);
  const maxVol = Math.max(...sorted.map((p) => p.volume), nominalCapacity, 1);

  const toX = (level: number) => PAD.left + (level / maxLevel) * chartW;
  const toY = (vol: number) => PAD.top + chartH - (vol / maxVol) * chartH;

  const pathD = sorted
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.level).toFixed(1)} ${toY(p.volume).toFixed(1)}`)
    .join(' ');

  const fillD = `${pathD} L ${toX(sorted[sorted.length - 1].level)} ${toY(0)} L ${toX(sorted[0].level)} ${toY(0)} Z`;

  const clampedLevel = Math.max(0, Math.min(currentLevel, maxLevel));
  const currentX = toX(clampedLevel);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    value: Math.round(maxVol * f),
    y: toY(maxVol * f),
  }));

  const xTicks = [0, 25, 50, 75, 100].map((v) => ({
    value: v,
    x: toX(v),
  }));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      aria-label="Curva de arqueação: nível vs volume"
    >
      {/* Grid lines */}
      {yTicks.map((t) => (
        <line
          key={`gy-${t.value}`}
          x1={PAD.left} y1={t.y}
          x2={PAD.left + chartW} y2={t.y}
          stroke="currentColor" strokeWidth="0.5"
          className="text-slate-200 dark:text-slate-700"
          strokeDasharray="4 3"
        />
      ))}
      {xTicks.map((t) => (
        <line
          key={`gx-${t.value}`}
          x1={t.x} y1={PAD.top}
          x2={t.x} y2={PAD.top + chartH}
          stroke="currentColor" strokeWidth="0.5"
          className="text-slate-200 dark:text-slate-700"
          strokeDasharray="4 3"
        />
      ))}

      {/* Fill under curve */}
      <path d={fillD} className="fill-sky-500/10 dark:fill-sky-400/10" />

      {/* Curve line */}
      <path
        d={pathD} fill="none"
        className="stroke-sky-500 dark:stroke-sky-400"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />

      {/* Data points */}
      {sorted.map((p, i) => (
        <circle
          key={`pt-${i}`}
          cx={toX(p.level)} cy={toY(p.volume)} r="2.5"
          className="fill-sky-500 dark:fill-sky-400 stroke-white dark:stroke-slate-900"
          strokeWidth="1"
        />
      ))}

      {/* Current level indicator */}
      {!isNaN(currentLevel) && currentLevel >= 0 && (
        <>
          <line
            x1={currentX} y1={PAD.top}
            x2={currentX} y2={PAD.top + chartH}
            stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 3"
          />
          <text x={currentX + 3} y={PAD.top + 10} fontSize="8" fill="#f59e0b" fontFamily="monospace">
            {currentLevel.toFixed(1)}%
          </text>
        </>
      )}

      {/* Axes */}
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + chartH}
        stroke="currentColor" strokeWidth="1" className="text-slate-300 dark:text-slate-600" />
      <line x1={PAD.left} y1={PAD.top + chartH} x2={PAD.left + chartW} y2={PAD.top + chartH}
        stroke="currentColor" strokeWidth="1" className="text-slate-300 dark:text-slate-600" />

      {/* Y-axis labels */}
      {yTicks.map((t) => (
        <text key={`yl-${t.value}`} x={PAD.left - 4} y={t.y + 3}
          fontSize="8" textAnchor="end"
          className="fill-slate-500 dark:fill-slate-400" fontFamily="monospace">
          {t.value >= 1000 ? `${(t.value / 1000).toFixed(0)}k` : t.value}
        </text>
      ))}

      {/* X-axis labels */}
      {xTicks.map((t) => (
        <text key={`xl-${t.value}`} x={t.x} y={PAD.top + chartH + 12}
          fontSize="8" textAnchor="middle"
          className="fill-slate-500 dark:fill-slate-400" fontFamily="monospace">
          {t.value}
        </text>
      ))}

      {/* Axis titles */}
      <text x={PAD.left + chartW / 2} y={H - 2} fontSize="8" textAnchor="middle"
        className="fill-slate-400 dark:fill-slate-500">
        Nível ({levelUnit})
      </text>
      <text x={8} y={PAD.top + chartH / 2} fontSize="8" textAnchor="middle"
        className="fill-slate-400 dark:fill-slate-500"
        transform={`rotate(-90, 8, ${PAD.top + chartH / 2})`}>
        Vol ({volumeUnit})
      </text>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export const StrappingConfigEditor: React.FC = () => {
  const {
    selectedEntity,
    selectedTemplate,
    selectedObject,
    saveStrappingConfig,
    simulatedValues,
  } = useObjectModelStore();

  const activeEntity = selectedEntity?.type === 'template' ? selectedTemplate : selectedObject;

  const resolveConfig = (): { config: TankStrappingConfig; isInherited: boolean } => {
    if (!activeEntity) return { config: DEFAULT_STRAPPING, isInherited: false };

    if (activeEntity.strappingConfig) {
      return { config: activeEntity.strappingConfig, isInherited: false };
    }

    if (selectedEntity?.type === 'instance' && selectedObject?.templateId) {
      const parentTpl = templateRepo.getById(selectedObject.templateId);
      if (parentTpl?.strappingConfig) {
        return { config: parentTpl.strappingConfig, isInherited: true };
      }
    }

    if (selectedEntity?.type === 'template' && selectedTemplate?.parentTemplateId) {
      const parentTpl = templateRepo.getById(selectedTemplate.parentTemplateId);
      if (parentTpl?.strappingConfig) {
        return { config: parentTpl.strappingConfig, isInherited: true };
      }
    }

    return { config: DEFAULT_STRAPPING, isInherited: false };
  };

  const { config: initialConfig, isInherited: initialInherited } = resolveConfig();
  const [config, setConfig] = useState<TankStrappingConfig>(initialConfig);
  const [isInherited, setIsInherited] = useState(initialInherited);
  const [isSaved, setIsSaved] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  // Sync on entity change
  const prevIdRef = useRef<string | null>(null);
  const currentId = selectedEntity?.id ?? null;
  if (prevIdRef.current !== currentId) {
    prevIdRef.current = currentId;
    const { config: freshConfig, isInherited: freshInherited } = resolveConfig();
    if (JSON.stringify(freshConfig) !== JSON.stringify(config)) {
      setConfig(freshConfig);
      setIsInherited(freshInherited);
    }
  }

  if (!selectedEntity || !activeEntity) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400 dark:text-slate-500">
        <BarChart3 className="w-12 h-12 mb-3 stroke-[1.5] text-slate-300 dark:text-slate-600" />
        <p className="text-sm font-semibold">Nenhum equipamento selecionado</p>
        <p className="text-xs mt-1">Selecione um Template ou Instância para configurar a arqueação.</p>
      </div>
    );
  }

  const isTemplate = selectedEntity.type === 'template';
  const geometryType = activeEntity.graphicConfig?.geometryType ?? 'vertical_cylindrical';
  const geometryLabel = GEOMETRY_LABELS[geometryType] ?? geometryType;
  const curveNote = GEOMETRY_CURVE_NOTES[geometryType] ?? '';

  const levelKey = selectedEntity.type === 'instance'
    ? `${selectedEntity.id}:Level`
    : 'Level';
  const currentLevel = parseFloat(simulatedValues[levelKey] ?? '50');

  const sortedPoints = [...config.points].sort((a, b) => a.level - b.level);
  const interpolateVolume = (level: number): number => {
    if (sortedPoints.length === 0) return 0;
    if (level <= sortedPoints[0].level) return sortedPoints[0].volume;
    if (level >= sortedPoints[sortedPoints.length - 1].level)
      return sortedPoints[sortedPoints.length - 1].volume;
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const lo = sortedPoints[i];
      const hi = sortedPoints[i + 1];
      if (level >= lo.level && level <= hi.level) {
        const t = (level - lo.level) / (hi.level - lo.level);
        return lo.volume + t * (hi.volume - lo.volume);
      }
    }
    return 0;
  };

  const derivedVolume = interpolateVolume(currentLevel);
  const fillPct = config.nominalCapacity > 0
    ? Math.round((derivedVolume / config.nominalCapacity) * 100)
    : 0;

  const handleSave = () => {
    if (!selectedEntity) return;
    saveStrappingConfig(selectedEntity.id, selectedEntity.type, config);
    setIsInherited(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handlePointChange = (idx: number, field: keyof StrappingPoint, raw: string) => {
    const value = parseFloat(raw);
    if (isNaN(value)) return;
    setConfig((prev) => {
      const pts = [...prev.points];
      pts[idx] = { ...pts[idx], [field]: value };
      return { ...prev, points: pts };
    });
  };

  const handleAddPoint = () => {
    const last = config.points[config.points.length - 1];
    const newLevel = last ? Math.min(last.level + 10, 100) : 0;
    const newVol = last
      ? Math.min(last.volume + config.nominalCapacity / 10, config.nominalCapacity)
      : 0;
    setConfig((prev) => ({
      ...prev,
      points: [...prev.points, { level: newLevel, volume: parseFloat(newVol.toFixed(1)) }],
    }));
  };

  const handleRemovePoint = (idx: number) => {
    setConfig((prev) => ({ ...prev, points: prev.points.filter((_, i) => i !== idx) }));
  };

  const handleFieldChange = <K extends keyof TankStrappingConfig>(
    field: K,
    value: TankStrappingConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto p-6 select-none">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Configuração de Arqueação
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 font-mono text-[10px] font-semibold border border-sky-200 dark:border-sky-800">
              {isTemplate ? 'Template Base' : 'Instância Concreta'}
            </span>
            {isInherited && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-mono text-[10px] font-semibold border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3" />
                Herdada do Template
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tabela de capacidade (API MPMS Ch. 2.2A simplificado) — relação nível × volume para gestão de inventário.
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
            <><CheckCircle2 className="w-4 h-4" /><span>Salvo!</span></>
          ) : (
            <><Save className="w-4 h-4" /><span>Salvar</span></>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ---------------------------------------------------------------- */}
        {/* LEFT COLUMN                                                       */}
        {/* ---------------------------------------------------------------- */}
        <div className="lg:col-span-7 flex flex-col gap-6">

          {/* 1. Summary */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-4 h-4 text-sky-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                1. Resumo da Configuração
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {[
                {
                  label: 'Geometria',
                  value: geometryLabel,
                  sub: curveNote,
                  mono: false,
                },
                {
                  label: 'Capacidade Nominal',
                  value: `${config.nominalCapacity.toLocaleString('pt-BR')} ${config.volumeUnit}`,
                  mono: true,
                },
                {
                  label: 'Altura de Referência',
                  value: `${config.referenceHeight} m`,
                  mono: true,
                },
                {
                  label: 'Pontos da Tabela',
                  value: `${config.points.length} pts`,
                  mono: true,
                },
                {
                  label: 'Unid. de Nível',
                  value: config.levelUnit,
                  mono: true,
                },
                {
                  label: 'Unid. de Volume',
                  value: config.volumeUnit,
                  mono: true,
                },
              ].map((card) => (
                <div key={card.label} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{card.label}</p>
                  <p className={cn('text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight', card.mono && 'font-mono')}>
                    {card.value}
                  </p>
                  {card.sub && <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{card.sub}</p>}
                </div>
              ))}
            </div>

            {/* Editable fields */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  <Ruler className="inline w-3 h-3 mr-1" />
                  Altura de Referência (m)
                </label>
                <input
                  type="number" step="0.1" min="0"
                  value={config.referenceHeight}
                  onChange={(e) => handleFieldChange('referenceHeight', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-sky-500 transition"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  <FlaskConical className="inline w-3 h-3 mr-1" />
                  Capacidade Nominal ({config.volumeUnit})
                </label>
                <input
                  type="number" step="1" min="0"
                  value={config.nominalCapacity}
                  onChange={(e) => handleFieldChange('nominalCapacity', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-sky-500 transition"
                />
              </div>
            </div>
          </div>

          {/* 2. Capacity Table */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  2. Tabela de Arqueação
                </h3>
              </div>
              <button
                onClick={handleAddPoint}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Adicionar Ponto
              </button>
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-3">
              Cada linha define o volume correspondente a um nível medido. Ordene do menor ao maior nível.
            </p>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_1fr_1fr_32px] gap-2 px-2 mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Nível ({config.levelUnit})
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Volume ({config.volumeUnit})
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                % Capacidade
              </span>
              <span />
            </div>

            <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
              {config.points.map((pt, idx) => {
                const pctCap = config.nominalCapacity > 0
                  ? ((pt.volume / config.nominalCapacity) * 100).toFixed(1)
                  : '—';
                const pctNum = parseFloat(pctCap);
                return (
                  <div
                    key={idx}
                    onClick={() => setEditingIdx(idx)}
                    className={cn(
                      'grid grid-cols-[1fr_1fr_1fr_32px] gap-2 items-center px-2 py-1.5 rounded-lg border transition-all text-xs cursor-pointer',
                      editingIdx === idx
                        ? 'border-sky-400 bg-sky-50 dark:bg-sky-950/20'
                        : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-200 dark:hover:border-slate-700'
                    )}
                  >
                    <input
                      type="number" step="0.1"
                      value={pt.level}
                      onChange={(e) => handlePointChange(idx, 'level', e.target.value)}
                      onFocus={() => setEditingIdx(idx)}
                      className="w-full bg-transparent font-mono text-xs text-slate-800 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-800 rounded px-1 py-0.5 border border-transparent focus:border-sky-400 transition"
                    />
                    <input
                      type="number" step="0.1"
                      value={pt.volume}
                      onChange={(e) => handlePointChange(idx, 'volume', e.target.value)}
                      onFocus={() => setEditingIdx(idx)}
                      className="w-full bg-transparent font-mono text-xs text-slate-800 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-800 rounded px-1 py-0.5 border border-transparent focus:border-sky-400 transition"
                    />
                    <span className={cn(
                      'font-mono text-xs font-semibold text-right',
                      pctNum > 95 ? 'text-rose-500'
                        : pctNum < 5 ? 'text-amber-500'
                        : 'text-emerald-600 dark:text-emerald-400'
                    )}>
                      {pctCap}%
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemovePoint(idx); }}
                      className="text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 transition cursor-pointer"
                      title="Remover ponto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {config.points.length === 0 && (
                <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400 dark:text-slate-500">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Nenhum ponto configurado. Clique em + Adicionar Ponto para começar.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* RIGHT COLUMN                                                      */}
        {/* ---------------------------------------------------------------- */}
        <div className="lg:col-span-5 flex flex-col gap-4">

          {/* Live reading */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Leitura Atual
              </span>
              <span className="ml-auto text-[11px] font-mono text-slate-400">Live</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Nível', value: isNaN(currentLevel) ? '—' : currentLevel.toFixed(1), unit: '%', color: 'text-sky-600 dark:text-sky-400' },
                { label: 'Volume', value: derivedVolume.toFixed(0), unit: config.volumeUnit, color: 'text-emerald-600 dark:text-emerald-400' },
                {
                  label: '% Cap.',
                  value: `${fillPct}`,
                  unit: '%',
                  color: fillPct > 85 ? 'text-rose-500' : fillPct < 15 ? 'text-amber-500' : 'text-slate-800 dark:text-slate-100',
                },
              ].map((card) => (
                <div key={card.label} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-100 dark:border-slate-700 text-center">
                  <p className="text-[9px] uppercase tracking-wider text-slate-400 mb-1">{card.label}</p>
                  <p className={cn('text-sm font-bold font-mono', card.color)}>
                    {card.value}
                    <span className="text-[10px] text-slate-400 ml-0.5">{card.unit}</span>
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Ocupação</span>
                <span className="font-mono font-bold text-sky-500">{fillPct}% da capacidade</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    fillPct > 85 ? 'bg-rose-500' : fillPct < 15 ? 'bg-amber-500' : 'bg-sky-500'
                  )}
                  style={{ width: `${Math.min(fillPct, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Capacity curve */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-6">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <BarChart3 className="w-4 h-4 text-sky-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Curva de Capacidade
              </span>
            </div>

            <CurveChart
              points={config.points}
              currentLevel={currentLevel}
              nominalCapacity={config.nominalCapacity}
              levelUnit={config.levelUnit}
              volumeUnit={config.volumeUnit}
            />

            <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-4 h-px bg-sky-500 rounded-full inline-block" />
                Curva Nível×Volume
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-4" style={{ borderTop: '1.5px dashed #f59e0b' }} />
                Nível Atual
              </span>
            </div>

            {isInherited && (
              <div className="mt-3 p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/30 text-[11px] text-amber-400/80">
                <span className="font-semibold">Configuração herdada:</span> Proveniente do template pai.
                Salve para criar uma configuração própria.
              </div>
            )}

            {isTemplate && !isInherited && (
              <div className="mt-3 p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/30 text-[11px] text-amber-400/80">
                <span className="font-semibold">Herança:</span> Esta arqueação será herdada por todos os
                templates derivados e instâncias que não possuírem configuração própria.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
