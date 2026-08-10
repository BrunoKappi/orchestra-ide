import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Thermometer, Activity, Droplets, ArrowUpRight, ArrowDownRight, Gauge } from 'lucide-react';
import { TankGeometrySvg } from '../../../../components/TankGeometrySvg';
import type { OmmEquipment, OmmProduct, EquipmentType } from '../../types';

// ---------------------------------------------------------------------------
// Node data shape
// ---------------------------------------------------------------------------
export interface OmmTankNodeData {
  [key: string]: unknown;
  equipment: OmmEquipment;
  product: OmmProduct | null;
  /** If true, renders a more compact layout suitable for the Plant overview */
  compact: boolean;
  /** Optional movement status label shown on the node header badge */
  movementRole?: 'origin' | 'destination' | null;
}

// ---------------------------------------------------------------------------
// Geometry helper
// ---------------------------------------------------------------------------
function resolveGeometry(type: EquipmentType): 'vertical_cylindrical' | 'horizontal_cylindrical' | 'spherical' | 'pressurized' | 'vertical_cylindrical' {
  switch (type) {
    case 'Sphere':  return 'spherical';
    case 'Vessel':  return 'pressurized';
    case 'Ship':    return 'horizontal_cylindrical';
    default:        return 'vertical_cylindrical';
  }
}

// ---------------------------------------------------------------------------
// Header color per equipment type (Connectivity Studio–style colored header)
// ---------------------------------------------------------------------------
const TYPE_HEADER_COLOR: Record<string, string> = {
  Tank:     '#0284c7',   // sky-600
  Vessel:   '#7c3aed',   // violet-600
  Sphere:   '#0891b2',   // cyan-600
  Pump:     '#059669',   // emerald-600
  Pipeline: '#64748b',   // slate-500
  Manifold: '#d97706',   // amber-600
  Ship:     '#1d4ed8',   // blue-700
  Truck:    '#92400e',   // amber-900
  RailCar:  '#374151',   // gray-700
  Area:     '#4b5563',   // gray-600
};

// ---------------------------------------------------------------------------
// Status indicator
// ---------------------------------------------------------------------------
const StatusDot: React.FC<{ isSending: boolean; isReceiving: boolean; isActive: boolean }> = ({
  isSending, isReceiving, isActive,
}) => {
  if (isSending)   return <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" title="Enviando" />;
  if (isReceiving) return <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Recebendo" />;
  if (isActive)    return <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" title="Ativo" />;
  return             <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" title="Ocioso" />;
};

// ---------------------------------------------------------------------------
// Level bar (horizontal, colored fill)
// ---------------------------------------------------------------------------
const LevelBar: React.FC<{ pct: number; color: string }> = ({ pct, color }) => (
  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
    <div
      className="h-full rounded-full transition-all duration-700"
      style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: color }}
    />
  </div>
);

// ---------------------------------------------------------------------------
// Metric row (compact key/value)
// ---------------------------------------------------------------------------
const Metric: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-1 text-[9px]">
    <span className="shrink-0 text-slate-400">{icon}</span>
    <span className="text-slate-500 dark:text-slate-400 truncate">{label}</span>
    <span className="ml-auto font-mono font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">{value}</span>
  </div>
);

// ---------------------------------------------------------------------------
// COMPACT NODE (Plant Overview)
// ---------------------------------------------------------------------------
const CompactNode: React.FC<{ data: OmmTankNodeData; selected: boolean }> = ({ data, selected }) => {
  const { equipment: eq, product, movementRole } = data;
  const headerColor = TYPE_HEADER_COLOR[eq.type] ?? '#64748b';
  const prodColor = product?.color ?? '#3b82f6';
  const geometry = resolveGeometry(eq.type);
  const isTankLike = ['Tank', 'Vessel', 'Sphere', 'Ship'].includes(eq.type);

  const borderClass = selected
    ? 'border-sky-400 ring-2 ring-sky-400/30'
    : eq.isSending
      ? 'border-amber-400 dark:border-amber-500'
      : eq.isReceiving
        ? 'border-emerald-400 dark:border-emerald-500'
        : 'border-slate-200 dark:border-slate-700';

  return (
    <div className={`w-[200px] rounded-xl overflow-visible shadow-lg border-2 transition-all duration-200 bg-white dark:bg-slate-900 ${borderClass}`}>
      {/* Handles — all 4 directions to support multiple movements */}
      <Handle type="source" position={Position.Right}  id="right"  style={{ top: '50%' }}
        className="w-2.5 h-2.5 !bg-slate-400 dark:!bg-slate-500 border-2 !border-white dark:!border-slate-900 rounded-full" />
      <Handle type="target" position={Position.Left}   id="left"   style={{ top: '50%' }}
        className="w-2.5 h-2.5 !bg-slate-400 dark:!bg-slate-500 border-2 !border-white dark:!border-slate-900 rounded-full" />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ left: '50%' }}
        className="w-2.5 h-2.5 !bg-slate-400 dark:!bg-slate-500 border-2 !border-white dark:!border-slate-900 rounded-full" />
      <Handle type="target" position={Position.Top}    id="top"    style={{ left: '50%' }}
        className="w-2.5 h-2.5 !bg-slate-400 dark:!bg-slate-500 border-2 !border-white dark:!border-slate-900 rounded-full" />

      {/* Colored header */}
      <div
        className="flex items-center justify-between px-2.5 py-1.5 text-white rounded-t-[10px]"
        style={{ backgroundColor: headerColor }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <StatusDot isSending={eq.isSending} isReceiving={eq.isReceiving} isActive={eq.isActive} />
          <span className="font-mono text-[10px] font-bold truncate">{eq.tag}</span>
        </div>
        <span className="text-[8px] bg-black/20 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
          {eq.type}
        </span>
      </div>

      {/* Body */}
      <div className="p-2.5 space-y-2">
        {/* Equipment name */}
        <div className="text-[9px] font-semibold text-slate-600 dark:text-slate-300 truncate">{eq.name}</div>

        {/* Tank visual + level */}
        <div className="flex items-center gap-2">
          {isTankLike && (
            <div className="shrink-0">
              <TankGeometrySvg
                geometry={geometry}
                levelPercent={eq.currentLevel}
                fillColor={prodColor}
                width={38}
                height={52}
              />
            </div>
          )}
          <div className="flex-1 min-w-0 space-y-1.5">
            {product && (
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: prodColor }} />
                <span className="text-[9px] font-semibold text-slate-700 dark:text-slate-200 truncate">{product.code}</span>
              </div>
            )}
            <div>
              <div className="flex justify-between text-[9px] font-mono mb-0.5">
                <span className="text-slate-500 dark:text-slate-400">Nível</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{eq.currentLevel.toFixed(1)}%</span>
              </div>
              <LevelBar pct={eq.currentLevel} color={prodColor} />
            </div>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="space-y-1 pt-1.5 border-t border-slate-100 dark:border-slate-800">
          <Metric
            icon={<Droplets className="w-3 h-3" />}
            label="Volume"
            value={`${eq.currentVolume.toFixed(0)} m³`}
          />
          <Metric
            icon={<Activity className="w-3 h-3" />}
            label="Massa"
            value={`${eq.currentMass.toFixed(1)} t`}
          />
          <Metric
            icon={<Thermometer className="w-3 h-3" />}
            label="Temp."
            value={`${eq.temperature.toFixed(1)} °C`}
          />
          <Metric
            icon={<Gauge className="w-3 h-3" />}
            label="Pressão"
            value={`${eq.pressure.toFixed(2)} bar`}
          />
          {eq.isSending && eq.flowOut > 0 && (
            <Metric
              icon={<ArrowUpRight className="w-3 h-3 text-amber-500" />}
              label="Saída"
              value={`${eq.flowOut.toFixed(1)} m³/h`}
            />
          )}
          {eq.isReceiving && eq.flowIn > 0 && (
            <Metric
              icon={<ArrowDownRight className="w-3 h-3 text-emerald-500" />}
              label="Entrada"
              value={`${eq.flowIn.toFixed(1)} m³/h`}
            />
          )}
        </div>

        {/* Capacity footer */}
        <div className="flex items-center justify-between text-[9px] pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-slate-400 dark:text-slate-500">Cap. total</span>
          <span className="font-mono text-slate-500 dark:text-slate-400">{eq.capacity.toFixed(0)} m³</span>
        </div>

        {/* Role badge if in a movement */}
        {movementRole && (
          <div className={`text-center text-[8px] font-bold uppercase tracking-wider rounded py-0.5
            ${movementRole === 'origin'
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
              : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            {movementRole === 'origin' ? '↑ Origem' : '↓ Destino'}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// DETAILED NODE (Movement Modal)
// ---------------------------------------------------------------------------
const DetailedNode: React.FC<{ data: OmmTankNodeData; selected: boolean }> = ({ data, selected }) => {
  const { equipment: eq, product, movementRole } = data;
  const headerColor = TYPE_HEADER_COLOR[eq.type] ?? '#64748b';
  const prodColor = product?.color ?? '#3b82f6';
  const geometry = resolveGeometry(eq.type);
  const isTankLike = ['Tank', 'Vessel', 'Sphere', 'Ship'].includes(eq.type);

  const roleHeaderLabel = movementRole === 'origin'
    ? 'ORIGEM'
    : movementRole === 'destination'
      ? 'DESTINO'
      : null;

  const roleBg = movementRole === 'origin'
    ? 'from-amber-500/10 to-transparent'
    : movementRole === 'destination'
      ? 'from-emerald-500/10 to-transparent'
      : 'from-transparent to-transparent';

  return (
    <div
      className={`w-[220px] rounded-xl overflow-hidden shadow-lg border-2 transition-all duration-200 bg-white dark:bg-slate-900
        ${selected
          ? 'border-sky-400 ring-2 ring-sky-400/30'
          : movementRole === 'origin'
            ? 'border-amber-400 dark:border-amber-600'
            : movementRole === 'destination'
              ? 'border-emerald-400 dark:border-emerald-600'
              : 'border-slate-200 dark:border-slate-700'
        }`}
    >
      {/* Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-3 h-3 !bg-slate-400 dark:!bg-slate-500 border-2 !border-white dark:!border-slate-900 rounded-full"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="w-3 h-3 !bg-slate-400 dark:!bg-slate-500 border-2 !border-white dark:!border-slate-900 rounded-full"
      />

      {/* Role stripe above header */}
      {roleHeaderLabel && (
        <div className={`px-3 py-0.5 text-[8px] font-bold uppercase tracking-widest text-center
          ${movementRole === 'origin'
            ? 'bg-amber-500 text-white'
            : 'bg-emerald-600 text-white'
          }`}
        >
          {movementRole === 'origin' ? '↑ Equipamento de Origem' : '↓ Equipamento de Destino'}
        </div>
      )}

      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 text-white"
        style={{ backgroundColor: headerColor }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <StatusDot isSending={eq.isSending} isReceiving={eq.isReceiving} isActive={eq.isActive} />
          <span className="font-mono text-[11px] font-bold truncate">{eq.tag}</span>
        </div>
        <span className="text-[8px] bg-black/20 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
          {eq.type}
        </span>
      </div>

      {/* Body */}
      <div className={`p-3 space-y-3 bg-gradient-to-b ${roleBg}`}>
        {/* Equipment name */}
        <div className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold truncate">{eq.name}</div>

        {/* Tank visual + level */}
        <div className="flex items-center gap-3">
          {isTankLike && (
            <div className="shrink-0">
              <TankGeometrySvg
                geometry={geometry}
                levelPercent={eq.currentLevel}
                fillColor={prodColor}
                width={52}
                height={72}
              />
            </div>
          )}
          <div className="flex-1 space-y-2">
            {/* Product */}
            {product && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: prodColor }} />
                <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">{product.name}</span>
              </div>
            )}
            {/* Level display */}
            <div>
              <div className="flex justify-between text-[9px] mb-1 font-mono">
                <span className="text-slate-500">Nível</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{eq.currentLevel.toFixed(1)}%</span>
              </div>
              <LevelBar pct={eq.currentLevel} color={prodColor} />
            </div>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
          <Metric
            icon={<Droplets className="w-3 h-3" />}
            label="Volume"
            value={`${eq.currentVolume.toFixed(1)} m³`}
          />
          <Metric
            icon={<Activity className="w-3 h-3" />}
            label="Massa"
            value={`${(eq.currentMass).toFixed(1)} t`}
          />
          <Metric
            icon={<Thermometer className="w-3 h-3" />}
            label="Temp."
            value={`${eq.temperature.toFixed(1)} °C`}
          />
          <Metric
            icon={<Gauge className="w-3 h-3" />}
            label="Pressão"
            value={`${eq.pressure.toFixed(2)} bar`}
          />
          {eq.isSending && eq.flowOut > 0 && (
            <Metric
              icon={<ArrowUpRight className="w-3 h-3 text-amber-500" />}
              label="Saída"
              value={`${eq.flowOut.toFixed(1)} m³/h`}
            />
          )}
          {eq.isReceiving && eq.flowIn > 0 && (
            <Metric
              icon={<ArrowDownRight className="w-3 h-3 text-emerald-500" />}
              label="Entrada"
              value={`${eq.flowIn.toFixed(1)} m³/h`}
            />
          )}
        </div>

        {/* Capacity footer */}
        <div className="flex items-center justify-between text-[9px] pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-slate-400">Cap. total</span>
          <span className="font-mono text-slate-600 dark:text-slate-300">{eq.capacity.toFixed(0)} m³</span>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Exported XYFlow node — switches between compact and detailed
// ---------------------------------------------------------------------------
export const OmmTankNode: React.FC<{ data: OmmTankNodeData; selected: boolean }> = memo(
  ({ data, selected }) => {
    if (data.compact) {
      return <CompactNode data={data} selected={selected} />;
    }
    return <DetailedNode data={data} selected={selected} />;
  },
);

OmmTankNode.displayName = 'OmmTankNode';
