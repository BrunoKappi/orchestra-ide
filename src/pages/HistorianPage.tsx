import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  TrendingUp, Search, ChevronRight, ChevronDown,
  Download, Calendar, X, Activity,
  BarChart2, Table2, Copy, Check,
  Database, FolderOpen
} from 'lucide-react';
import { useObjectModelStore } from '../store/useObjectModelStore';
import { HeaderNavigation } from '../components/navigation/HeaderNavigation';
import { historyEngine } from '../services/HistoryEngine';
import { inheritanceService } from '../services/InheritanceService';
import type { HistorySample } from '../types/domain';
import { cn } from '../utils/cn';

// ─── Colour palette for multiple curves ─────────────────────────────────────
const CURVE_COLORS = [
  '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#3b82f6', '#ec4899', '#84cc16',
];

// ─── Period presets ──────────────────────────────────────────────────────────
type PeriodPreset = '1m' | '5m' | '15m' | '30m' | '1h' | '24h' | '7d' | '30d' | 'custom';

function getPeriodRange(preset: PeriodPreset, customFrom?: Date, customTo?: Date): { from: Date; to: Date } {
  const now = new Date();
  const to = customTo ?? now;
  switch (preset) {
    case '1m': return { from: new Date(now.getTime() - 60_000), to };
    case '5m': return { from: new Date(now.getTime() - 300_000), to };
    case '15m': return { from: new Date(now.getTime() - 900_000), to };
    case '30m': return { from: new Date(now.getTime() - 1_800_000), to };
    case '1h': return { from: new Date(now.getTime() - 3_600_000), to };
    case '24h': return { from: new Date(now.getTime() - 86_400_000), to };
    case '7d': return { from: new Date(now.getTime() - 7 * 86_400_000), to };
    case '30d': return { from: new Date(now.getTime() - 30 * 86_400_000), to };
    case 'custom': return { from: customFrom ?? new Date(now.getTime() - 86_400_000), to };
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface SelectedVariable {
  objectId: string;
  objectName: string;
  propertyId: string;
  propertyName: string;
  unit: string;
  colorIndex: number;
}

// ─── SVG Trend Chart ─────────────────────────────────────────────────────────
interface ChartData {
  variable: SelectedVariable;
  samples: HistorySample[];
}

const CHART_PADDING = { top: 24, right: 16, bottom: 48, left: 56 };

interface TrendChartProps {
  data: ChartData[];
  from: Date;
  to: Date;
  calculatedFrom: Date;
  calculatedTo: Date;
  onViewRangeChange: (from: Date | null, to: Date | null) => void;
}

function TrendChart({ data, from, to, calculatedFrom, calculatedTo, onViewRangeChange }: TrendChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 320 });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; items: { label: string; value: string; color: string }[] } | null>(null);

  // Pan State
  const [isPanning, setIsPanning] = useState(false);
  const panRef = useRef<{ startX: number; fromMs: number; toMs: number } | null>(null);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        setSize({ width, height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { innerW, innerH } = useMemo(() => ({
    innerW: size.width - CHART_PADDING.left - CHART_PADDING.right,
    innerH: size.height - CHART_PADDING.top - CHART_PADDING.bottom,
  }), [size]);

  const fromMs = from.getTime();
  const toMs = to.getTime();
  const timeRange = toMs - fromMs;

  // Global numeric range across all series
  const { globalMin, globalMax } = useMemo(() => {
    let min = Infinity, max = -Infinity;
    data.forEach(({ samples }) => {
      samples.forEach((s) => {
        const n = parseFloat(s.value);
        if (!isNaN(n)) { min = Math.min(min, n); max = Math.max(max, n); }
      });
    });
    if (!isFinite(min)) { min = 0; max = 100; }
    if (min === max) { min -= 1; max += 1; }
    const pad = (max - min) * 0.08;
    return { globalMin: min - pad, globalMax: max + pad };
  }, [data]);

  const xScale = useCallback((ts: number): number => {
    return CHART_PADDING.left + ((ts - fromMs) / timeRange) * innerW;
  }, [fromMs, timeRange, innerW]);

  const yScale = useCallback((val: number): number => {
    return CHART_PADDING.top + innerH - ((val - globalMin) / (globalMax - globalMin)) * innerH;
  }, [innerH, globalMin, globalMax]);

  // Build polyline points per series
  const paths = useMemo(() => data.map(({ variable, samples }) => {
    const pts = samples
      .filter((s) => !isNaN(parseFloat(s.value)))
      .map((s) => `${xScale(new Date(s.timestamp).getTime())},${yScale(parseFloat(s.value))}`)
      .join(' ');
    return { variable, pts };
  }), [data, xScale, yScale]);

  // Y axis ticks
  const yTicks = useMemo(() => {
    const count = 5;
    return Array.from({ length: count + 1 }, (_, i) => {
      const val = globalMin + ((globalMax - globalMin) / count) * i;
      return { val, y: yScale(val) };
    });
  }, [globalMin, globalMax, yScale]);

  // X axis ticks (5 evenly spaced)
  const xTicks = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const ts = fromMs + (timeRange / 5) * i;
      const d = new Date(ts);
      const label = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      return { ts, label, x: xScale(ts) };
    });
  }, [fromMs, timeRange, xScale]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // only left click
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    if (mx < CHART_PADDING.left) return; // don't drag if clicking Y labels

    setIsPanning(true);
    panRef.current = {
      startX: e.clientX,
      fromMs: from.getTime(),
      toMs: to.getTime(),
    };
    setTooltip(null);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;

    if (isPanning && panRef.current) {
      const { startX, fromMs, toMs } = panRef.current;
      const dx = e.clientX - startX;
      // drag speed is ratio of time window width
      const timeDelta = -((dx / innerW) * (toMs - fromMs));
      const newFrom = new Date(fromMs + timeDelta);
      const newTo = new Date(toMs + timeDelta);
      onViewRangeChange(newFrom, newTo);
    } else {
      // Normal hover tooltip
      const items = data.map(({ variable, samples }) => {
        const mouseTs = fromMs + ((mx - CHART_PADDING.left) / innerW) * timeRange;
        let nearest: HistorySample | null = null;
        let minDist = Infinity;
        samples.forEach((s) => {
          const dist = Math.abs(new Date(s.timestamp).getTime() - mouseTs);
          if (dist < minDist) { minDist = dist; nearest = s; }
        });
        return {
          label: `${variable.objectName}.${variable.propertyName}`,
          value: nearest != null ? `${(nearest as HistorySample).value}${variable.unit ? ' ' + variable.unit : ''}` : '—',
          color: CURVE_COLORS[variable.colorIndex % CURVE_COLORS.length],
        };
      });

      setTooltip({ x: mx, y: 40, items });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    panRef.current = null;
  };

  const handleZoom = (factor: number) => {
    const mid = (fromMs + toMs) / 2;
    const duration = toMs - fromMs;
    const newDuration = duration * factor;
    onViewRangeChange(
      new Date(mid - newDuration / 2),
      new Date(mid + newDuration / 2)
    );
  };

  // Wheel zoom (Ctrl + Wheel) & Pan (Wheel)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl) {
        // Ctrl + Wheel: Zoom In / Zoom Out temporal scale
        const zoomFactor = e.deltaY < 0 ? 0.8 : 1.25;
        const rect = el.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const relativeMouse = Math.max(0, Math.min(1, (mx - CHART_PADDING.left) / Math.max(1, innerW)));
        const mouseTs = fromMs + relativeMouse * timeRange;

        const newDuration = timeRange * zoomFactor;
        const newFromMs = mouseTs - relativeMouse * newDuration;
        const newToMs = mouseTs + (1 - relativeMouse) * newDuration;

        onViewRangeChange(new Date(newFromMs), new Date(newToMs));
      } else {
        // Normal Wheel: Shift time range left/right (pan)
        const deltaPixels = e.deltaY !== 0 ? e.deltaY : e.deltaX;
        const timeShift = (deltaPixels / Math.max(1, innerW)) * timeRange * 0.25;
        onViewRangeChange(new Date(fromMs + timeShift), new Date(toMs + timeShift));
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [fromMs, toMs, timeRange, innerW, onViewRangeChange]);

  // Check if there are any samples overall for the selected variables,
  // to avoid showing the empty state if the user just scrolled out of the current viewport.
  const hasAnySamplesOverall = useMemo(() => {
    return data.some((d) => {
      const allSamples = historyEngine.query({
        objectId: d.variable.objectId,
        propertyId: d.variable.propertyId,
      });
      return allSamples.length > 0;
    });
  }, [data]);

  if (data.length === 0 || !hasAnySamplesOverall) {
    const hasVars = data.length > 0;
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Activity className={cn("w-10 h-10 opacity-30", hasVars && "animate-pulse opacity-50")} />
        <p className="text-sm font-medium">
          {hasVars ? 'Aguardando primeiras amostras...' : 'Nenhuma variável selecionada'}
        </p>
        <p className="text-xs text-slate-400 max-w-sm text-center">
          {hasVars
            ? 'Os dados começarão a aparecer assim que a simulação registrar amostras. Aguarde alguns segundos.'
            : 'Selecione variáveis na lista à esquerda para visualizar tendências históricas.'}
        </p>
      </div>
    );
  }

  const isOverridden = from.getTime() !== calculatedFrom.getTime() || to.getTime() !== calculatedTo.getTime();

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full"
      onMouseLeave={() => { setTooltip(null); handleMouseUp(); }}
    >
      {/* Zoom & Reset Overlay Buttons */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 px-1.5 py-1 rounded-lg shadow-sm z-30 select-none">
        <button
          onClick={() => handleZoom(0.75)}
          className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded font-bold text-[10px] text-slate-700 dark:text-slate-350 cursor-pointer transition-colors"
          title="Zoom In (Aproximar)"
        >
          Zoom +
        </button>
        <button
          onClick={() => handleZoom(1.33)}
          className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded font-bold text-[10px] text-slate-700 dark:text-slate-350 cursor-pointer transition-colors"
          title="Zoom Out (Afastar)"
        >
          Zoom -
        </button>
        {isOverridden && (
          <button
            onClick={() => onViewRangeChange(null, null)}
            className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600 dark:text-sky-400 rounded font-bold text-[10px] cursor-pointer transition-colors border border-sky-200/50 dark:border-sky-900/50"
            title="Restaurar visualização automática tempo real"
          >
            Auto-Scroll
          </button>
        )}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${size.width} ${size.height}`}
        width="100%"
        height="100%"
        className={cn("absolute inset-0 select-none", isPanning ? "cursor-grabbing" : "cursor-grab")}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Grid lines */}
        {yTicks.map(({ y, val }, i) => (
          <g key={i}>
            <line
              x1={CHART_PADDING.left} y1={y}
              x2={size.width - CHART_PADDING.right} y2={y}
              stroke="currentColor" strokeWidth={0.5}
              className="text-slate-200 dark:text-slate-700"
              strokeDasharray="4 3"
            />
            <text
              x={CHART_PADDING.left - 6} y={y + 4}
              textAnchor="end" fontSize={10}
              className="fill-slate-400 dark:fill-slate-500 font-mono"
            >
              {val.toFixed(1)}
            </text>
          </g>
        ))}

        {/* X axis ticks */}
        {xTicks.map(({ x, label }, i) => (
          <g key={i}>
            <line
              x1={x} y1={CHART_PADDING.top}
              x2={x} y2={size.height - CHART_PADDING.bottom}
              stroke="currentColor" strokeWidth={0.5}
              className="text-slate-200 dark:text-slate-700"
              strokeDasharray="4 3"
            />
            <text
              x={x} y={size.height - CHART_PADDING.bottom + 16}
              textAnchor="middle" fontSize={10}
              className="fill-slate-400 dark:fill-slate-500"
            >
              {label}
            </text>
          </g>
        ))}

        {/* Axes */}
        <line
          x1={CHART_PADDING.left} y1={CHART_PADDING.top}
          x2={CHART_PADDING.left} y2={size.height - CHART_PADDING.bottom}
          stroke="currentColor" strokeWidth={1}
          className="text-slate-300 dark:text-slate-600"
        />
        <line
          x1={CHART_PADDING.left} y1={size.height - CHART_PADDING.bottom}
          x2={size.width - CHART_PADDING.right} y2={size.height - CHART_PADDING.bottom}
          stroke="currentColor" strokeWidth={1}
          className="text-slate-300 dark:text-slate-600"
        />

        {/* Data curves */}
        {paths.map(({ variable, pts }) => pts && (
          <polyline
            key={`${variable.objectId}:${variable.propertyId}`}
            points={pts}
            fill="none"
            stroke={CURVE_COLORS[variable.colorIndex % CURVE_COLORS.length]}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* Tooltip vertical line */}
        {tooltip && !isPanning && (
          <line
            x1={tooltip.x} y1={CHART_PADDING.top}
            x2={tooltip.x} y2={size.height - CHART_PADDING.bottom}
            stroke="#8b5cf6" strokeWidth={1} strokeDasharray="4 3"
          />
        )}
      </svg>

      {/* Tooltip card */}
      {tooltip && !isPanning && (
        <div
          className="absolute pointer-events-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 z-20 min-w-[160px]"
          style={{ left: tooltip.x + 12, top: tooltip.y }}
        >
          {tooltip.items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
              <span className="text-slate-500 dark:text-slate-400 truncate max-w-[100px]">{item.label}</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 ml-auto">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export const HistorianPage: React.FC = () => {
  const { objects, mergedProperties, simulationTickCount, simulatedValues } = useObjectModelStore();

  const getPropValue = useCallback((objectId: string, propertyId: string, propertyName: string) => {
    if (objectId === 'OPC_VIRTUAL') {
      const liveKey = `OPC_VIRTUAL:${propertyId}`;
      return simulatedValues[liveKey] ?? '0';
    }
    const liveKey = `${objectId}:${propertyName}`;
    if (simulatedValues[liveKey] !== undefined) {
      return simulatedValues[liveKey];
    }
    const props = inheritanceService.getMergedProperties(objectId, 'instance') as any[];
    const prop = props?.find((p) => p.id === propertyId || p.name === propertyName);
    return prop?.defaultValue ?? '0';
  }, [simulatedValues]);

  // Sidebar state
  const [expandedObjects, setExpandedObjects] = useState<Set<string>>(new Set());
  const [sidebarSearch, setSidebarSearch] = useState('');

  // Selected variables (can be multiple)
  const [selectedVars, setSelectedVars] = useState<SelectedVariable[]>([]);
  const colorCounterRef = useRef(0);

  // Period
  const [period, setPeriod] = useState<PeriodPreset>('1h');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // View window overrides (for pan & zoom)
  const [viewFrom, setViewFrom] = useState<Date | null>(null);
  const [viewTo, setViewTo] = useState<Date | null>(null);

  // View mode
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const [tablePage, setTablePage] = useState(1);
  const TABLE_PAGE_SIZE = 50;

  // Copy feedback
  const [copiedRow, setCopiedRow] = useState<string | null>(null);

  // Refresh counter to re-query on tick or timer
  const [refreshTick, setRefreshTick] = useState(0);
  useEffect(() => { setRefreshTick((n) => n + 1); }, [simulationTickCount]);

  // Active second-by-second data collection for selected variables in Historian Page
  useEffect(() => {
    const interval = setInterval(() => {
      selectedVars.forEach((v) => {
        const currentValue = getPropValue(v.objectId, v.propertyId, v.propertyName);
        
        historyEngine.record(
          v.objectId,
          v.propertyId,
          currentValue,
          {
            enabled: true,
            collectionMode: 'interval',
            intervalMs: 0, // Bypass rate limit to ensure every tick is recorded
            retentionMs: 86400000,
            maxSamples: 5000,
            deadband: 0,
            compression: false,
            engineeringUnit: v.unit,
            notes: 'historian-live-collect',
          },
          'simulation'
        );
      });
      
      setRefreshTick((n) => n + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedVars, getPropValue]);

  // Hook startMonitoring / stopMonitoring on-demand without losing history on array change
  const monitoredRefs = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    const nextSet = new Set(selectedVars.map(v => `${v.objectId}:${v.propertyId}`));
    
    // Stop monitoring variables that were removed
    monitoredRefs.current.forEach((k) => {
      if (!nextSet.has(k)) {
        const [objId, propId] = k.split(':');
        historyEngine.stopMonitoring(objId, propId);
      }
    });
    
    // Start monitoring variables that were added
    nextSet.forEach((k) => {
      if (!monitoredRefs.current.has(k)) {
        const [objId, propId] = k.split(':');
        historyEngine.startMonitoring(objId, propId);
      }
    });
    
    monitoredRefs.current = nextSet;
    
    // Do NOT stop monitoring everything on unmount of this specific effect, 
    // only on actual component unmount.
  }, [selectedVars]);

  useEffect(() => {
    // True unmount cleanup
    return () => {
      monitoredRefs.current.forEach((k) => {
        const [objId, propId] = k.split(':');
        historyEngine.stopMonitoring(objId, propId);
      });
    };
  }, []);

  // Determine time range
  const calculatedRange = useMemo(() => {
    const cf = customFrom ? new Date(customFrom) : undefined;
    const ct = customTo ? new Date(customTo) : undefined;
    return getPeriodRange(period, cf, ct);
  }, [period, customFrom, customTo, refreshTick]); // eslint-disable-line

  const from = viewFrom ?? calculatedRange.from;
  const to = viewTo ?? calculatedRange.to;

  const historianObjects = useMemo(() => {
    return objects.map((obj) => {
      const props = inheritanceService.getMergedProperties(obj.id, 'instance') as typeof mergedProperties;
      const histProps = props.filter((p) => {
        const name = p.name.toLowerCase();
        if (p.dataType !== 'Float' && p.dataType !== 'Integer') return false;
        if (
          name.includes('limit') ||
          name.includes('high') ||
          name.includes('low') ||
          name.includes('capacity') ||
          name.includes('tag') ||
          name.includes('vcf') ||
          name.includes('description') ||
          name.includes('template')
        ) {
          return false;
        }
        return true;
      });
      return { obj, histProps };
    }).filter(({ histProps }) => histProps.length > 0);
  }, [objects, refreshTick]); // eslint-disable-line

  // Filter sidebar
  const filteredHistorianObjects = useMemo(() => {
    if (!sidebarSearch.trim()) return historianObjects;
    const q = sidebarSearch.toLowerCase();
    return historianObjects
      .map(({ obj, histProps }) => ({
        obj,
        histProps: histProps.filter(
          (p) => p.name.toLowerCase().includes(q) || obj.name.toLowerCase().includes(q)
        ),
      }))
      .filter(({ histProps }) => histProps.length > 0);
  }, [historianObjects, sidebarSearch]);

  // Toggle variable selection — also seeds an immediate first data point
  function toggleVar(objectId: string, objectName: string, propertyId: string, propertyName: string, unit: string) {
    setSelectedVars((prev) => {
      const exists = prev.find((v) => v.objectId === objectId && v.propertyId === propertyId);
      if (exists) {
        // Clear history immediately when deselected to free up memory
        historyEngine.clearKey(objectId, propertyId);
        return prev.filter((v) => !(v.objectId === objectId && v.propertyId === propertyId));
      }
      
      const ci = colorCounterRef.current++ % CURVE_COLORS.length;

      // Clear any pre-collected simulation background samples so we start from scratch
      historyEngine.clearKey(objectId, propertyId);

      // Seed an immediate first sample so the chart shows something right away.
      const currentValue = getPropValue(objectId, propertyId, propertyName);
      historyEngine.record(objectId, propertyId, currentValue, {
        enabled: true,
        collectionMode: 'interval',
        intervalMs: 0, // force record regardless of interval
        retentionMs: 86400000,
        maxSamples: 5000,
        deadband: 0,
        compression: false,
        engineeringUnit: unit,
        notes: 'historian-seed',
      }, 'simulation');

      return [...prev, { objectId, objectName, propertyId, propertyName, unit, colorIndex: ci }];
    });
  }

  // Query samples for each selected variable
  const chartData: ChartData[] = useMemo(() => {
    return selectedVars.map((v) => ({
      variable: v,
      samples: historyEngine.query({ objectId: v.objectId, propertyId: v.propertyId, from, to }),
    }));
  }, [selectedVars, from, to, refreshTick]); // eslint-disable-line

  // All samples flat (for table view)
  const allSamples = useMemo(() => {
    return chartData
      .flatMap(({ variable, samples }) =>
        samples.map((s) => ({ ...s, _objName: variable.objectName, _propName: variable.propertyName, _color: CURVE_COLORS[variable.colorIndex % CURVE_COLORS.length] }))
      )
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [chartData]);

  // Stats per variable
  const stats = useMemo(() =>
    chartData.map(({ variable, samples }) => ({
      variable,
      ...historyEngine.getStats(samples),
    }))
  , [chartData]);

  // Export
  function exportCsv() {
    const csv = historyEngine.exportCsv(allSamples);
    download('historian_export.csv', csv, 'text/csv');
  }
  function exportJson() {
    const json = historyEngine.exportJson(allSamples);
    download('historian_export.json', json, 'application/json');
  }
  function download(name: string, content: string, mime: string) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: mime }));
    a.download = name;
    a.click();
  }

  function copyRow(sample: HistorySample & { _objName: string; _propName: string }) {
    const text = `${sample.timestamp}\t${sample._objName}.${sample._propName}\t${sample.value}\t${sample.quality}\t${sample.source}`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedRow(sample.timestamp + sample.propertyId);
    setTimeout(() => setCopiedRow(null), 1500);
  }

  // Pagination
  const pagedSamples = allSamples.slice((tablePage - 1) * TABLE_PAGE_SIZE, tablePage * TABLE_PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(allSamples.length / TABLE_PAGE_SIZE));

  const qualityColor = (q: string) => {
    if (q === 'Good') return 'text-emerald-500';
    if (q === 'Bad') return 'text-rose-500';
    return 'text-amber-500';
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <HeaderNavigation />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar: Variable Explorer ───────────────────────────────── */}
        <aside className="w-72 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-violet-500" />
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Explorador de Variáveis</span>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {filteredHistorianObjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-xs gap-2 text-center px-4">
                <Database className="w-6 h-6 opacity-40" />
                <p>Nenhuma propriedade com histórico habilitado.</p>
                <p className="text-slate-300 dark:text-slate-600">Configure o histórico na aba Properties do Orquestra IDE.</p>
              </div>
            ) : (
              filteredHistorianObjects.map(({ obj, histProps }) => {
                const isExpanded = expandedObjects.has(obj.id);
                return (
                  <div key={obj.id} className="mb-1">
                    <button
                      onClick={() => setExpandedObjects((prev) => {
                        const next = new Set(prev);
                        next.has(obj.id) ? next.delete(obj.id) : next.add(obj.id);
                        return next;
                      })}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
                    >
                      {isExpanded
                        ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      }
                      <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{obj.name}</span>
                      <span className="ml-auto text-[10px] text-violet-500 font-semibold shrink-0">{histProps.length}</span>
                    </button>

                    {isExpanded && histProps.map((prop) => {
                      const isSelected = selectedVars.some(
                        (v) => v.objectId === obj.id && v.propertyId === prop.id
                      );
                      const selectedVar = selectedVars.find(
                        (v) => v.objectId === obj.id && v.propertyId === prop.id
                      );
                      return (
                        <button
                          key={prop.id}
                          onClick={() => toggleVar(obj.id, obj.name, prop.id, prop.name, prop.historyConfig?.engineeringUnit ?? '')}
                          className={cn(
                            'w-full flex items-center gap-2 pl-7 pr-2 py-1.5 rounded-lg text-left transition-colors',
                            isSelected
                              ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                          )}
                        >
                          {isSelected && (
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: selectedVar ? CURVE_COLORS[selectedVar.colorIndex % CURVE_COLORS.length] : '#8b5cf6' }}
                            />
                          )}
                          {!isSelected && <span className="w-2 h-2 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />}
                          <span className="text-xs font-mono truncate">{prop.name}</span>
                          {prop.historyConfig?.engineeringUnit && (
                            <span className="text-[10px] text-slate-400 ml-auto shrink-0">{prop.historyConfig.engineeringUnit}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>

          {/* Selected vars summary */}
          {selectedVars.length > 0 && (
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-violet-50 dark:bg-violet-950/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-300">
                  {selectedVars.length} variável{selectedVars.length > 1 ? 'is' : ''} selecionada{selectedVars.length > 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => setSelectedVars([])}
                  className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold"
                >
                  Limpar
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedVars.map((v) => (
                  <span
                    key={`${v.objectId}:${v.propertyId}`}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold text-white"
                    style={{ background: CURVE_COLORS[v.colorIndex % CURVE_COLORS.length] }}
                  >
                    {v.propertyName}
                    <button onClick={() => toggleVar(v.objectId, v.objectName, v.propertyId, v.propertyName, v.unit)}>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ── Main Content ──────────────────────────────────────────────── */}
        <main
          className="flex-1 flex flex-col overflow-hidden"
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDrop={(e) => {
            e.preventDefault();
            const raw = e.dataTransfer.getData('opc/tag-ref');
            if (raw) {
              try {
                const tag = JSON.parse(raw);
                setSelectedVars((prev) => {
                  const exists = prev.find((v) => v.objectId === 'OPC_VIRTUAL' && v.propertyId === tag.path);
                  if (exists) return prev;
                  const ci = colorCounterRef.current++ % CURVE_COLORS.length;

                  // Clear background history for this tag so it starts from scratch
                  historyEngine.clearKey('OPC_VIRTUAL', tag.path);

                  // Seed an immediate first sample for dropped OPC tag
                  const currentValue = getPropValue('OPC_VIRTUAL', tag.path, tag.name);
                  historyEngine.record('OPC_VIRTUAL', tag.path, currentValue, {
                    enabled: true,
                    collectionMode: 'interval',
                    intervalMs: 0,
                    retentionMs: 86400000,
                    maxSamples: 5000,
                    deadband: 0,
                    compression: false,
                    engineeringUnit: tag.engineeringUnit || '',
                    notes: 'historian-seed',
                  }, 'simulation');

                  return [...prev, {
                    objectId: 'OPC_VIRTUAL',
                    objectName: 'OPC Network',
                    propertyId: tag.path,
                    propertyName: tag.name,
                    unit: tag.engineeringUnit || '',
                    colorIndex: ci
                  }];
                });
              } catch (err) {
                console.error('Falha ao processar drop de tag OPC no Historian:', err);
              }
            }
          }}
        >

          {/* Top toolbar */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex-wrap">
            {/* Period presets */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-semibold">
              {(['1m', '5m', '15m', '30m', '1h', '24h', '7d', '30d', 'custom'] as PeriodPreset[]).map((p) => {
                let label = '';
                switch (p) {
                  case '1m': label = '1 Minuto'; break;
                  case '5m': label = '5 Minutos'; break;
                  case '15m': label = '15 Minutos'; break;
                  case '30m': label = '30 Minutos'; break;
                  case '1h': label = 'Última Hora'; break;
                  case '24h': label = '24 Horas'; break;
                  case '7d': label = '7 Dias'; break;
                  case '30d': label = '30 Dias'; break;
                  case 'custom': label = 'Personalizado'; break;
                }
                return (
                  <button
                    key={p}
                    onClick={() => {
                      setPeriod(p);
                      setViewFrom(null);
                      setViewTo(null);
                    }}
                    className={cn(
                      'px-3 py-1 rounded-md transition-colors',
                      period === p
                        ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Custom date range */}
            {period === 'custom' && (
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="datetime-local"
                  value={customFrom}
                  onChange={(e) => {
                    setCustomFrom(e.target.value);
                    setViewFrom(null);
                    setViewTo(null);
                  }}
                  className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-violet-500 text-xs"
                />
                <span className="text-slate-400">até</span>
                <input
                  type="datetime-local"
                  value={customTo}
                  onChange={(e) => {
                    setCustomTo(e.target.value);
                    setViewFrom(null);
                    setViewTo(null);
                  }}
                  className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-violet-500 text-xs"
                />
              </div>
            )}

            <div className="ml-auto flex items-center gap-2">
              {/* View toggle */}
              <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                <button
                  onClick={() => setView('chart')}
                  className={cn('p-1.5 rounded-md transition-colors', view === 'chart' ? 'bg-white dark:bg-slate-700 text-violet-600 shadow-xs' : 'text-slate-500')}
                  title="Gráfico"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setView('table')}
                  className={cn('p-1.5 rounded-md transition-colors', view === 'table' ? 'bg-white dark:bg-slate-700 text-violet-600 shadow-xs' : 'text-slate-500')}
                  title="Tabela"
                >
                  <Table2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Export */}
              {allSamples.length > 0 && (
                <>
                  <button
                    onClick={exportCsv}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    CSV
                  </button>
                  <button
                    onClick={exportJson}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    JSON
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Empty state when no vars selected */}
          {selectedVars.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-violet-300" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Selecione variáveis para visualizar</p>
                <p className="text-xs mt-1">Expanda os objetos no painel esquerdo e clique nas propriedades com histórico habilitado.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">

              {/* Stats bar */}
              <div className="flex items-center gap-4 px-5 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 shrink-0 overflow-x-auto">
                {stats.map(({ variable, min, max, avg, last, count }) => (
                  <div
                    key={`${variable.objectId}:${variable.propertyId}`}
                    className="flex items-center gap-3 shrink-0 text-[11px]"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: CURVE_COLORS[variable.colorIndex % CURVE_COLORS.length] }}
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {variable.objectName}.{variable.propertyName}
                    </span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-500">Min: <strong className="text-slate-700 dark:text-slate-200">{min?.toFixed(2) ?? '—'}</strong></span>
                    <span className="text-slate-500">Max: <strong className="text-slate-700 dark:text-slate-200">{max?.toFixed(2) ?? '—'}</strong></span>
                    <span className="text-slate-500">Avg: <strong className="text-slate-700 dark:text-slate-200">{avg?.toFixed(2) ?? '—'}</strong></span>
                    <span className="text-slate-500">Último: <strong className="text-slate-700 dark:text-slate-200">{last ?? '—'}{variable.unit ? ' ' + variable.unit : ''}</strong></span>
                    <span className="text-slate-500">Amostras: <strong className="text-violet-600 dark:text-violet-400">{count.toLocaleString()}</strong></span>
                    <span className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                  </div>
                ))}
              </div>

              {view === 'chart' ? (
                /* Chart area */
                <div className="flex-1 flex flex-col overflow-hidden p-4">
                  <div className="flex-1 w-full flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                    <TrendChart
                      data={chartData}
                      from={from}
                      to={to}
                      calculatedFrom={calculatedRange.from}
                      calculatedTo={calculatedRange.to}
                      onViewRangeChange={(newFrom, newTo) => {
                        setViewFrom(newFrom);
                        setViewTo(newTo);
                      }}
                    />
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                    {selectedVars.map((v) => (
                      <div key={`${v.objectId}:${v.propertyId}`} className="flex items-center gap-1.5 text-xs">
                        <span className="w-8 h-0.5 rounded-full" style={{ background: CURVE_COLORS[v.colorIndex % CURVE_COLORS.length] }} />
                        <span className="text-slate-600 dark:text-slate-300 font-medium">{v.objectName}.{v.propertyName}</span>
                        {v.unit && <span className="text-slate-400">({v.unit})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Table view */
                <div className="flex-1 overflow-hidden flex flex-col p-4 gap-3">
                  <div className="flex-1 overflow-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-xs">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 sticky top-0">
                        <tr className="text-slate-600 dark:text-slate-400 font-semibold select-none">
                          <th className="py-2.5 px-4">Timestamp</th>
                          <th className="py-2.5 px-4">Objeto.Propriedade</th>
                          <th className="py-2.5 px-4">Valor</th>
                          <th className="py-2.5 px-4">Qualidade</th>
                          <th className="py-2.5 px-4">Origem</th>
                          <th className="py-2.5 px-4 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {pagedSamples.length > 0 ? pagedSamples.map((s, i) => (
                          <tr key={i} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-2 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              {new Date(s.timestamp).toLocaleString('pt-BR')}
                            </td>
                            <td className="py-2 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: (s as any)._color }} />
                                <span className="font-mono text-[11px] text-slate-700 dark:text-slate-200">
                                  {(s as any)._objName}.{(s as any)._propName}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-4 font-mono text-[11px] font-semibold text-slate-900 dark:text-slate-100">{s.value}</td>
                            <td className={cn('py-2 px-4 text-[11px] font-semibold', qualityColor(s.quality))}>{s.quality}</td>
                            <td className="py-2 px-4 text-[11px] text-slate-400 capitalize">{s.source}</td>
                            <td className="py-2 px-4 text-right">
                              <button
                                onClick={() => copyRow(s as any)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all"
                                title="Copiar linha"
                              >
                                {copiedRow === s.timestamp + s.propertyId
                                  ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  : <Copy className="w-3.5 h-3.5" />
                                }
                              </button>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                              Nenhuma amostra encontrada no período selecionado.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{allSamples.length.toLocaleString()} amostras · Página {tablePage} de {totalPages}</span>
                      <div className="flex items-center gap-1">
                        <button
                          disabled={tablePage === 1}
                          onClick={() => setTablePage((p) => p - 1)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                        >
                          Anterior
                        </button>
                        <button
                          disabled={tablePage === totalPages}
                          onClick={() => setTablePage((p) => p + 1)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                        >
                          Próxima
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
