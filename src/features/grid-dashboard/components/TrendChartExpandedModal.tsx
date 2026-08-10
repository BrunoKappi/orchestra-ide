import React, { useMemo, useState, useEffect } from 'react';
import { X, TrendingUp, Clock } from 'lucide-react';
import { useObjectModelStore } from '../../../store/useObjectModelStore';
import { inheritanceService } from '../../../services/InheritanceService';
import { historyEngine } from '../../../services/HistoryEngine';
import { useResizeObserver } from '../../../hooks/useResizeObserver';
import { cn } from '../../../utils/cn';
import type { TankCardData } from '../types';

interface TrendChartExpandedModalProps {
  isOpen: boolean;
  card: TankCardData | null;
  onClose: () => void;
}

type TimeWindow = '1m' | '5m' | '15m' | '30m' | 'all';

export const TrendChartExpandedModal: React.FC<TrendChartExpandedModalProps> = ({
  isOpen,
  card,
  onClose,
}) => {
  const { simulatedValues, theme } = useObjectModelStore();
  const { elementRef, dimensions } = useResizeObserver<HTMLDivElement>();

  const [timeWindow, setTimeWindow] = useState<TimeWindow>('1m');
  const [hiddenSeriesKeys, setHiddenSeriesKeys] = useState<Set<string>>(new Set());
  const [hoverData, setHoverData] = useState<{
    x: number;
    y: number;
    timestamp: number;
    values: Array<{
      objectId: string;
      propertyName: string;
      label: string;
      value: number;
      unit: string;
      color: string;
    }>;
  } | null>(null);

  const isDark = theme === 'dark';

  // Helper to determine dynamic property limits based on current sample window
  const getPropertyRange = (_propertyName: string, points: number[]) => {
    if (points.length > 0) {
      const dataMin = Math.min(...points);
      const dataMax = Math.max(...points);
      const range = dataMax - dataMin;
      if (range === 0) {
        const span = Math.max(1.0, Math.abs(dataMin) * 0.05);
        return { min: dataMin - span, max: dataMax + span };
      }
      return {
        min: dataMin - range * 0.1,
        max: dataMax + range * 0.1,
      };
    }
    return { min: 0, max: 100 };
  };

  // Real-time temporal history buffer
  const [historyBuffer, setHistoryBuffer] = useState<Record<string, Array<{ timestamp: number; value: number }>>>({});

  useEffect(() => {
    if (!card || !card.trendProperties) return;
    const now = Date.now();
    const initialBuffer: Record<string, Array<{ timestamp: number; value: number }>> = {};

    card.trendProperties.forEach((prop) => {
      const key = `${prop.objectId}:${prop.propertyName}`;
      const props = inheritanceService.getMergedProperties(prop.objectId, 'instance');
      const propDef = props.find((p) => p.name === prop.propertyName);

      const samples = propDef ? historyEngine.query({ objectId: prop.objectId, propertyId: propDef.id }) : [];
      let pts = samples.map((s) => ({
        timestamp: new Date(s.timestamp).getTime(),
        value: parseFloat(s.value) ?? 0,
      })).filter((p) => !isNaN(p.value));

      const curRaw = simulatedValues[key];
      const curVal = curRaw != null ? parseFloat(curRaw) : 0;
      const startVal = isNaN(curVal) ? 0 : curVal;

      if (pts.length === 0) {
        pts = Array.from({ length: 30 }, (_, idx) => ({
          timestamp: now - (29 - idx) * 1500,
          value: startVal,
        }));
      } else if (pts.length < 30) {
        const firstPt = pts[0];
        const padCount = 30 - pts.length;
        const pad = Array.from({ length: padCount }, (_, idx) => ({
          timestamp: firstPt.timestamp - (padCount - idx) * 1500,
          value: firstPt.value,
        }));
        pts = [...pad, ...pts];
      }

      initialBuffer[key] = pts;
    });

    setHistoryBuffer(initialBuffer);
  }, [card?.id, card?.trendProperties]);

  useEffect(() => {
    if (!card || !card.trendProperties || card.trendProperties.length === 0) return;

    setHistoryBuffer((prev) => {
      const next = { ...prev };
      const now = Date.now();
      let hasUpdates = false;

      (card?.trendProperties || []).forEach((prop) => {
        const key = `${prop.objectId}:${prop.propertyName}`;
        const curRaw = simulatedValues[key];
        const val = curRaw != null ? parseFloat(curRaw) : 0;
        const numVal = isNaN(val) ? 0 : val;

        const currentList = prev[key] ? [...prev[key]] : [];
        currentList.push({ timestamp: now, value: numVal });
        if (currentList.length > 500) {
          currentList.shift();
        }
        next[key] = currentList;
        hasUpdates = true;
      });

      return hasUpdates ? next : prev;
    });
  }, [simulatedValues]);

  // Resolve properties and their current values and historical values
  const series = useMemo(() => {
    if (!card || !card.trendProperties) return [];
    return card.trendProperties.map((prop) => {
      const key = `${prop.objectId}:${prop.propertyName}`;
      const currentRaw = simulatedValues[key];
      const currentValue = currentRaw != null ? parseFloat(currentRaw) : 0;

      const points = historyBuffer[key] || [
        { timestamp: Date.now(), value: currentValue }
      ];

      let unit = '';
      const nameLower = prop.propertyName.toLowerCase();
      if (nameLower.includes('level') || nameLower.includes('percent')) unit = '%';
      else if (nameLower.includes('press')) unit = 'bar';
      else if (nameLower.includes('temp')) unit = '°C';
      else if (nameLower.includes('flow') || nameLower.includes('vaz')) unit = 'm³/h';
      else if (nameLower.includes('volum')) unit = 'm³';
      else if (nameLower.includes('mass')) unit = 't';
      else if (nameLower.includes('density') || nameLower.includes('dens')) unit = 'kg/m³';

      return {
        ...prop,
        key,
        points,
        currentValue,
        unit,
      };
    });
  }, [card, simulatedValues, historyBuffer]);

  // Compute time window bounds
  const { minTime, maxTime, filteredSeries, ranges } = useMemo(() => {
    const now = Date.now();
    let windowMs = 15 * 60 * 1000;
    if (timeWindow === '1m') windowMs = 1 * 60 * 1000;
    else if (timeWindow === '5m') windowMs = 5 * 60 * 1000;
    else if (timeWindow === '15m') windowMs = 15 * 60 * 1000;
    else if (timeWindow === '30m') windowMs = 30 * 60 * 1000;
    else if (timeWindow === 'all') windowMs = 60 * 60 * 1000;

    const maxTime = now;
    const minTime = now - windowMs;

    const filteredSeries = series.map((s) => {
      let pts = s.points.filter((p) => p.timestamp >= minTime);
      if (pts.length === 0 && s.points.length > 0) {
        pts = [s.points[s.points.length - 1]];
      }
      
      // If pts spans less than the window, interpolate backwards to start of window using stable flat line
      if (pts.length > 0 && pts[0].timestamp > minTime + 2000) {
        const firstVal = pts[0].value;
        const padPts = [
          { timestamp: minTime, value: firstVal },
          { timestamp: pts[0].timestamp - 1000, value: firstVal }
        ];
        pts = [...padPts, ...pts];
      }

      return {
        ...s,
        points: pts,
      };
    });

    // Determine if all series share the same unit
    const firstUnit = filteredSeries[0]?.unit || '';
    const shareYScale = filteredSeries.every((s) => s.unit === firstUnit);

    const ranges = new Map<string, { min: number; max: number }>();
    if (shareYScale && filteredSeries.length > 0) {
      let globalMin = Infinity;
      let globalMax = -Infinity;
      filteredSeries.forEach((s) => {
        const r = getPropertyRange(s.propertyName, s.points.map((p) => p.value));
        if (r.min < globalMin) globalMin = r.min;
        if (r.max > globalMax) globalMax = r.max;
      });
      if (globalMin === Infinity) globalMin = 0;
      if (globalMax === -Infinity) globalMax = 100;

      filteredSeries.forEach((s) => {
        ranges.set(s.key, { min: globalMin, max: globalMax });
      });
    } else {
      filteredSeries.forEach((s) => {
        const r = getPropertyRange(s.propertyName, s.points.map((p) => p.value));
        ranges.set(s.key, r);
      });
    }

    return { minTime, maxTime, filteredSeries, ranges };
  }, [series, timeWindow]);

  if (!isOpen || !card) return null;

  const activeSeriesList = filteredSeries.filter((s) => !hiddenSeriesKeys.has(s.key));

  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartWidth = Math.max(10, dimensions.width - paddingLeft - paddingRight);
  const chartHeight = Math.max(10, dimensions.height - paddingTop - paddingBottom);

  const getX = (t: number) => {
    const pct = (t - minTime) / (maxTime - minTime);
    return paddingLeft + pct * chartWidth;
  };

  const getY = (val: number, key: string) => {
    const range = ranges.get(key) || { min: 0, max: 100 };
    const denom = range.max - range.min;
    const pct = denom > 0 ? (val - range.min) / denom : 0.5;
    return paddingTop + chartHeight - pct * chartHeight;
  };

  const formatTime = (ms: number) => {
    const d = new Date(ms);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };

  const generatePaths = (s: (typeof filteredSeries)[0]) => {
    const pts = s.points;
    if (pts.length === 0 || chartWidth <= 0 || chartHeight <= 0) {
      return { pathD: '', areaD: '', lastX: paddingLeft, lastY: paddingTop + chartHeight / 2 };
    }

    const coords = pts.map((p) => ({
      x: getX(p.timestamp),
      y: getY(p.value, s.key),
    }));

    coords.sort((a, b) => a.x - b.x);

    let pathD = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
    if (coords.length > 1) {
      for (let i = 0; i < coords.length - 1; i++) {
        const curr = coords[i];
        const next = coords[i + 1];
        const cpX1 = curr.x + (next.x - curr.x) / 3;
        const cpY1 = curr.y;
        const cpX2 = curr.x + (2 * (next.x - curr.x)) / 3;
        const cpY2 = next.y;
        pathD += ` C ${cpX1.toFixed(1)} ${cpY1.toFixed(1)}, ${cpX2.toFixed(1)} ${cpY2.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
      }
    }

    const last = coords[coords.length - 1];
    const bottomY = paddingTop + chartHeight;
    const areaD =
      coords.length > 1
        ? `${pathD} L ${last.x.toFixed(1)} ${bottomY.toFixed(1)} L ${coords[0].x.toFixed(1)} ${bottomY.toFixed(1)} Z`
        : '';

    return { pathD, areaD, lastX: last.x, lastY: last.y };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeSeriesList.length === 0 || chartWidth <= 0 || chartHeight <= 0) return;

    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;

    const pct = (mouseX - paddingLeft) / chartWidth;
    const targetTimestamp = minTime + pct * (maxTime - minTime);

    let closestTimestamp = 0;
    let minDiff = Infinity;

    activeSeriesList.forEach((s) => {
      s.points.forEach((p) => {
        const diff = Math.abs(p.timestamp - targetTimestamp);
        if (diff < minDiff) {
          minDiff = diff;
          closestTimestamp = p.timestamp;
        }
      });
    });

    if (closestTimestamp === 0) return;

    const values: Array<{
      objectId: string;
      propertyName: string;
      label: string;
      value: number;
      unit: string;
      color: string;
    }> = [];

    activeSeriesList.forEach((s) => {
      const closestPoint = s.points.reduce((prev, curr) =>
        Math.abs(curr.timestamp - closestTimestamp) < Math.abs(prev.timestamp - closestTimestamp) ? curr : prev
      );

      values.push({
        objectId: s.objectId,
        propertyName: s.propertyName,
        label: s.label,
        value: closestPoint.value,
        unit: s.unit,
        color: s.color || '#3b82f6',
      });
    });

    setHoverData({
      x: getX(closestTimestamp),
      y: e.clientY - svgRect.top,
      timestamp: closestTimestamp,
      values,
    });
  };

  const toggleSeriesVisibility = (key: string) => {
    setHiddenSeriesKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const xGridTicks = [0, 0.25, 0.5, 0.75, 1];
  const yGridTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 select-none">
      <div className="bg-white dark:bg-[#16171b] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-[95vw] h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#16171b] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  {card.title}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  EXPANDIDO
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Análise histórica detalhada de tendências industriais em tempo real
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Window Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-sky-500" /> Janela:
              </span>
              {(['1m', '5m', '15m', '30m', 'all'] as TimeWindow[]).map((tw) => (
                <button
                  key={tw}
                  onClick={() => setTimeWindow(tw)}
                  className={cn(
                    "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer font-mono",
                    timeWindow === tw
                      ? "bg-sky-500 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  )}
                >
                  {tw === '1m' ? '1 Min' :
                   tw === '5m' ? '5 Min' :
                   tw === '15m' ? '15 Min' :
                   tw === '30m' ? '30 Min' : 'Tudo'}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SVG Chart Area */}
        <div className="flex-1 p-6 flex flex-col min-h-0 bg-slate-50/50 dark:bg-slate-950/40">
          <div
            ref={elementRef}
            className="flex-1 relative w-full border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden bg-white dark:bg-[#111216] shadow-inner"
          >
            {activeSeriesList.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400 font-mono">
                Nenhuma série visível selecionada.
              </div>
            ) : chartWidth <= 0 || chartHeight <= 0 ? null : (
              <svg
                width="100%"
                height="100%"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoverData(null)}
                className="overflow-visible"
              >
                {/* Horizontal gridlines & Y axis ticks */}
                {yGridTicks.map((pct, idx) => {
                  const y = paddingTop + chartHeight * (1 - pct);
                  const firstSeries = activeSeriesList[0];
                  const range = ranges.get(firstSeries.key) || { min: 0, max: 100 };
                  const val = range.min + (range.max - range.min) * pct;

                  return (
                    <g key={idx}>
                      <line
                        x1={paddingLeft}
                        y1={y}
                        x2={paddingLeft + chartWidth}
                        y2={y}
                        stroke={isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)'}
                        strokeDasharray="4,4"
                      />
                      <text
                        x={paddingLeft - 8}
                        y={y}
                        textAnchor="end"
                        dominantBaseline="middle"
                        className="text-[10px] font-mono fill-slate-400 dark:fill-slate-500 select-none font-semibold"
                      >
                        {val.toFixed(1)}
                      </text>
                    </g>
                  );
                })}

                {/* Vertical gridlines & X axis ticks */}
                {xGridTicks.map((pct, idx) => {
                  const x = paddingLeft + chartWidth * pct;
                  const time = minTime + (maxTime - minTime) * pct;

                  return (
                    <g key={idx}>
                      <line
                        x1={x}
                        y1={paddingTop}
                        x2={x}
                        y2={paddingTop + chartHeight}
                        stroke={isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)'}
                        strokeDasharray="4,4"
                      />
                      <text
                        x={x}
                        y={paddingTop + chartHeight + 16}
                        textAnchor="middle"
                        className="text-[10px] font-mono fill-slate-400 dark:fill-slate-500 select-none font-semibold"
                      >
                        {formatTime(time)}
                      </text>
                    </g>
                  );
                })}

                {/* Draw Series Lines and Areas */}
                {activeSeriesList.map((s) => {
                  const { pathD, areaD, lastX, lastY } = generatePaths(s);
                  const color = s.color || '#3b82f6';
                  if (!pathD) return null;

                  return (
                    <g key={s.key}>
                      <defs>
                        <linearGradient id={`expanded-grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {areaD && <path d={areaD} fill={`url(#expanded-grad-${s.key})`} />}
                      <path
                        d={pathD}
                        fill="none"
                        stroke={color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {s.points.length > 0 && (
                        <g>
                          <circle cx={lastX} cy={lastY} r="4" fill={color} />
                          <circle
                            cx={lastX}
                            cy={lastY}
                            r="8"
                            fill={color}
                            opacity="0.3"
                            className="animate-ping"
                          />
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Interactive Tooltip Cursor */}
                {hoverData && (
                  <line
                    x1={hoverData.x}
                    y1={paddingTop}
                    x2={hoverData.x}
                    y2={paddingTop + chartHeight}
                    stroke={isDark ? 'rgba(56, 189, 248, 0.6)' : 'rgba(2, 132, 199, 0.5)'}
                    strokeWidth="1.5"
                    strokeDasharray="3,3"
                  />
                )}
              </svg>
            )}

            {/* Hover Tooltip Card */}
            {hoverData && (
              <div
                className="absolute z-30 pointer-events-none p-3 rounded-xl border bg-white/95 dark:bg-slate-900/95 shadow-2xl border-slate-200 dark:border-slate-800 text-xs min-w-[180px] flex flex-col gap-1.5 backdrop-blur-md"
                style={{
                  left: hoverData.x > dimensions.width - 200 ? hoverData.x - 195 : hoverData.x + 12,
                  top: Math.max(12, Math.min(hoverData.y - 20, dimensions.height - 120)),
                }}
              >
                <div className="font-mono font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1 flex items-center justify-between">
                  <span>Horário:</span>
                  <span className="text-slate-800 dark:text-slate-200">{formatTime(hoverData.timestamp)}</span>
                </div>
                {hoverData.values.map((v) => (
                  <div key={`${v.objectId}-${v.propertyName}`} className="flex justify-between items-center gap-3">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: v.color }} />
                      <span className="text-slate-700 dark:text-slate-300 font-mono font-bold truncate">
                        {v.label}
                      </span>
                    </div>
                    <span className="font-mono font-extrabold text-slate-900 dark:text-white shrink-0">
                      {v.value.toFixed(1)}
                      {v.unit && <span className="text-[10px] font-sans font-medium text-slate-400 ml-1">{v.unit}</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Series Toggles */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16171b] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-400 uppercase font-mono mr-1">Séries:</span>
            {filteredSeries.map((s) => {
              const isHidden = hiddenSeriesKeys.has(s.key);
              const color = s.color || '#3b82f6';
              return (
                <button
                  key={s.key}
                  onClick={() => toggleSeriesVisibility(s.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl border text-xs font-bold font-mono flex items-center gap-2 transition-all cursor-pointer",
                    isHidden
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-750 opacity-60"
                      : "bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 shadow-2xs"
                  )}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: isHidden ? '#94a3b8' : color }}
                  />
                  <span>{s.label}</span>
                  <span className="text-[11px] font-extrabold text-sky-600 dark:text-sky-400 ml-1">
                    {s.currentValue.toFixed(1)} {s.unit}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar Visualização
          </button>
        </div>
      </div>
    </div>
  );
};
