import React, { useMemo, useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { useObjectModelStore } from '../../../store/useObjectModelStore';
import { inheritanceService } from '../../../services/InheritanceService';
import { historyEngine } from '../../../services/HistoryEngine';
import { useResizeObserver } from '../../../hooks/useResizeObserver';
import { cn } from '../../../utils/cn';
import type { TankCardData } from '../types';

const yGridTicks = [0.25, 0.5, 0.75];
const xGridTicks = [0.2, 0.5, 0.8];

interface TrendChartCardProps {
  card: TankCardData;
  isSelected?: boolean;
  isViewMode?: boolean;
  onClick?: () => void;
  onExpand?: () => void;
}

export const TrendChartCard: React.FC<TrendChartCardProps> = ({
  card,
  isSelected = false,
  isViewMode = false,
  onClick,
  onExpand,
}) => {
  const { simulatedValues, theme } = useObjectModelStore();
  const { elementRef, dimensions } = useResizeObserver<HTMLDivElement>();

  const handleClick = (e: React.MouseEvent) => {
    if (isViewMode && onExpand) {
      e.stopPropagation();
      onExpand();
      return;
    }
    if (onClick) onClick();
  };

  // Selection/Hover state for interactive tooltip
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

  const isCompact = card.rowSpan < 2 || card.colSpan < 2;
  const isDark = theme === 'dark';

  // Helper to determine natural property limits for industrial variables
  const getPropertyRange = (propertyName: string, points: number[], objectId: string) => {
    const nameLower = propertyName.toLowerCase();
    let defaultMin = 0;
    let defaultMax = 100;
    
    if (nameLower.includes('level') || nameLower.includes('percent')) {
      return { min: 0, max: 100 };
    }
    
    // Resolve object capacity
    const props = inheritanceService.getMergedProperties(objectId, 'instance');
    if (nameLower.includes('pressure') || nameLower.includes('press')) {
      const hpProp = props.find(p => p.name === 'HighPressure');
      const lpProp = props.find(p => p.name === 'LowPressure');
      const hp = hpProp ? parseFloat(hpProp.defaultValue) : 2.5;
      const lp = lpProp ? parseFloat(lpProp.defaultValue) : 0.0;
      defaultMin = Math.max(0, lp - 0.2);
      defaultMax = hp + 0.5;
    } else if (nameLower.includes('temp')) {
      defaultMin = 0;
      defaultMax = 100;
    } else if (nameLower.includes('flow') || nameLower.includes('vaz')) {
      defaultMin = -200;
      defaultMax = 1000;
    } else if (nameLower.includes('volume')) {
      const capProp = props.find(p => p.name === 'Capacity');
      const capacity = capProp ? parseFloat(capProp.defaultValue) : 15000;
      defaultMin = 0;
      defaultMax = capacity;
      return { min: defaultMin, max: defaultMax };
    } else if (nameLower.includes('mass')) {
      const capProp = props.find(p => p.name === 'Capacity');
      const densityProp = props.find(p => p.name === 'Density');
      const capacity = capProp ? parseFloat(capProp.defaultValue) : 15000;
      const density = densityProp ? parseFloat(densityProp.defaultValue) : 800;
      defaultMin = 0;
      defaultMax = (capacity * density) / 1000;
      return { min: defaultMin, max: defaultMax };
    }

    if (points.length > 0) {
      const dataMin = Math.min(...points);
      const dataMax = Math.max(...points);
      let min = Math.min(defaultMin, dataMin);
      let max = Math.max(defaultMax, dataMax);
      const range = max - min;
      if (range === 0) {
        min -= 1;
        max += 1;
      } else {
        min = Math.max(0, min - range * 0.05);
        max = max + range * 0.05;
      }
      return { min, max };
    }

    return { min: defaultMin, max: defaultMax };
  };

  // Real-time temporal history buffer (max 30 samples window)
  const [historyBuffer, setHistoryBuffer] = useState<Record<string, Array<{ timestamp: number; value: number }>>>({});

  // Initialize history buffer from historyEngine or baseline on card props change
  useEffect(() => {
    const trendProps = card.trendProperties || [];
    const now = Date.now();
    const initialBuffer: Record<string, Array<{ timestamp: number; value: number }>> = {};

    trendProps.forEach((prop) => {
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
        // Build 30 baseline temporal points spaced 1.5s apart ending at now
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
      } else if (pts.length > 30) {
        pts = pts.slice(pts.length - 30);
      }

      initialBuffer[key] = pts;
    });

    setHistoryBuffer(initialBuffer);
  }, [card.id, card.trendProperties]);

  // Update history buffer on every global simulator tick (simulatedValues update)
  useEffect(() => {
    const trendProps = card.trendProperties || [];
    if (trendProps.length === 0) return;

    setHistoryBuffer((prev) => {
      const next = { ...prev };
      const now = Date.now();
      let hasUpdates = false;

      trendProps.forEach((prop) => {
        const key = `${prop.objectId}:${prop.propertyName}`;
        const curRaw = simulatedValues[key];
        const val = curRaw != null ? parseFloat(curRaw) : 0;
        const numVal = isNaN(val) ? 0 : val;

        const currentList = prev[key] ? [...prev[key]] : [];
        currentList.push({ timestamp: now, value: numVal });
        if (currentList.length > 30) {
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
    const trendProps = card.trendProperties || [];
    return trendProps.map((prop) => {
      const key = `${prop.objectId}:${prop.propertyName}`;
      const currentRaw = simulatedValues[key];
      const currentValue = currentRaw != null ? parseFloat(currentRaw) : 0;

      const points = historyBuffer[key] || [
        { timestamp: Date.now(), value: currentValue }
      ];

      // Resolve engineering unit
      let unit = '';
      const nameLower = prop.propertyName.toLowerCase();
      if (nameLower.includes('level') || nameLower.includes('percent')) {
        unit = '%';
      } else if (nameLower.includes('press')) {
        unit = 'bar';
      } else if (nameLower.includes('temp')) {
        unit = '°C';
      } else if (nameLower.includes('flow') || nameLower.includes('vaz')) {
        unit = 'm³/h';
      } else if (nameLower.includes('volum')) {
        unit = 'm³';
      } else if (nameLower.includes('mass')) {
        unit = 't';
      } else if (nameLower.includes('density') || nameLower.includes('dens')) {
        unit = 'kg/m³';
      }

      return {
        ...prop,
        points,
        currentValue,
        unit,
      };
    });
  }, [card.trendProperties, simulatedValues, historyBuffer]);

  // Compute X and Y axis scale bounds across all series
  const { minTime, maxTime, ranges, shareYScale } = useMemo(() => {
    let minTime = Infinity;
    let maxTime = -Infinity;

    series.forEach((s) => {
      s.points.forEach((p) => {
        if (p.timestamp < minTime) minTime = p.timestamp;
        if (p.timestamp > maxTime) maxTime = p.timestamp;
      });
    });

    const now = Date.now();
    if (minTime === Infinity) minTime = now - 45000;
    if (maxTime === -Infinity) maxTime = now;

    // Ensure minTime and maxTime span exactly the samples' range so points fill 100% of chart width
    if (maxTime <= minTime) {
      maxTime = minTime + 1000;
    }

    // Determine if all series share the same unit
    const firstUnit = series[0]?.unit || '';
    const shareYScale = series.every((s) => s.unit === firstUnit);

    const ranges = new Map<string, { min: number; max: number }>();
    if (shareYScale && series.length > 0) {
      let globalMin = Infinity;
      let globalMax = -Infinity;
      series.forEach((s) => {
        const r = getPropertyRange(s.propertyName, s.points.map(p => p.value), s.objectId);
        if (r.min < globalMin) globalMin = r.min;
        if (r.max > globalMax) globalMax = r.max;
      });
      if (globalMin === Infinity) globalMin = 0;
      if (globalMax === -Infinity) globalMax = 100;

      series.forEach((s) => {
        ranges.set(`${s.objectId}:${s.propertyName}`, { min: globalMin, max: globalMax });
      });
    } else {
      series.forEach((s) => {
        const r = getPropertyRange(s.propertyName, s.points.map(p => p.value), s.objectId);
        ranges.set(`${s.objectId}:${s.propertyName}`, r);
      });
    }

    return { minTime, maxTime, ranges, shareYScale };
  }, [series]);

  // Viewport geometry math
  const paddingLeft = isCompact ? 12 : 42;
  const paddingRight = 12;
  const paddingTop = isCompact ? 10 : 16;
  const paddingBottom = isCompact ? 10 : 20;

  const chartWidth = dimensions.width - paddingLeft - paddingRight;
  const chartHeight = dimensions.height - paddingTop - paddingBottom;

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

  // Format timestamp for X labels
  const formatTime = (ms: number) => {
    const d = new Date(ms);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    
    if (maxTime - minTime > 3600 * 1000) {
      return `${hh}:${mm}`;
    }
    return `${hh}:${mm}:${ss}`;
  };

  // Generate SVG Path & Fill Area for a series
  const generatePaths = (s: typeof series[0]) => {
    const key = `${s.objectId}:${s.propertyName}`;
    const pts = s.points;
    if (pts.length === 0 || chartWidth <= 0 || chartHeight <= 0) {
      return { pathD: '', areaD: '', lastX: paddingLeft, lastY: paddingTop + chartHeight / 2 };
    }

    const coords = pts.map((p) => ({
      x: getX(p.timestamp),
      y: getY(p.value, key),
    }));

    coords.sort((a, b) => a.x - b.x);

    let pathD = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
    if (coords.length > 1) {
      for (let i = 0; i < coords.length - 1; i++) {
        const curr = coords[i];
        const next = coords[i + 1];
        const cpX1 = curr.x + (next.x - curr.x) / 3;
        const cpY1 = curr.y;
        const cpX2 = curr.x + 2 * (next.x - curr.x) / 3;
        const cpY2 = next.y;
        pathD += ` C ${cpX1.toFixed(1)} ${cpY1.toFixed(1)}, ${cpX2.toFixed(1)} ${cpY2.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
      }
    }

    const last = coords[coords.length - 1];
    const bottomY = paddingTop + chartHeight;
    const areaD = coords.length > 1
      ? `${pathD} L ${last.x.toFixed(1)} ${bottomY.toFixed(1)} L ${coords[0].x.toFixed(1)} ${bottomY.toFixed(1)} Z`
      : '';

    return { pathD, areaD, lastX: last.x, lastY: last.y };
  };

  // Handle interactive tooltips on mouse hover
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (series.length === 0 || chartWidth <= 0 || chartHeight <= 0) return;

    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;

    // Convert pixels to timestamp
    const pct = (mouseX - paddingLeft) / chartWidth;
    const targetTimestamp = minTime + pct * (maxTime - minTime);

    // Find the closest sample timestamp in any series
    let closestTimestamp = 0;
    let minDiff = Infinity;

    series.forEach((s) => {
      s.points.forEach((p) => {
        const diff = Math.abs(p.timestamp - targetTimestamp);
        if (diff < minDiff) {
          minDiff = diff;
          closestTimestamp = p.timestamp;
        }
      });
    });

    if (closestTimestamp === 0) return;

    // Retrieve values from all series at this specific timestamp
    const values: Array<{
      objectId: string;
      propertyName: string;
      label: string;
      value: number;
      unit: string;
      color: string;
    }> = [];
    series.forEach((s) => {
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

  // Determine Y Axis Ticks to draw
  const yTicks = useMemo(() => {
    if (series.length === 0) return [];
    const firstSeries = series[0];
    const key = `${firstSeries.objectId}:${firstSeries.propertyName}`;
    const range = ranges.get(key) || { min: 0, max: 100 };
    return [
      range.max,
      range.min + (range.max - range.min) * 0.5,
      range.min
    ];
  }, [series, ranges]);

  // Determine X Axis Ticks to draw (1/4, 2/4, 3/4 time spacing)
  const xTicks = useMemo(() => {
    return [
      minTime + (maxTime - minTime) * 0.2,
      minTime + (maxTime - minTime) * 0.5,
      minTime + (maxTime - minTime) * 0.8
    ];
  }, [minTime, maxTime]);

  return (
    <div
      onClick={handleClick}
      style={{ borderColor: card.borderColor || '#0284c740' }}
      className={cn(
        'relative w-full h-full rounded-xl flex flex-col overflow-hidden transition-all duration-200 select-none group',
        'bg-white dark:bg-[#16171b] border shadow-sm dark:shadow-md',
        isSelected
          ? 'border-sky-500 dark:border-sky-400 ring-2 ring-sky-500/20 z-10'
          : 'hover:border-slate-350 dark:hover:border-slate-700',
        (isViewMode || !isViewMode) && 'cursor-pointer'
      )}
    >
      {/* Decorative left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-sky-500" />

      {/* Main Content Container */}
      <div className="p-3 pl-4 flex flex-col flex-1 overflow-hidden">
        
        {/* Header (Title & real-time values) */}
        <div className="shrink-0 flex items-start justify-between mb-2">
          <div className="min-w-0 pr-2">
            <div className="text-[9px] font-mono font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-sky-500" />
              TENDÊNCIA LIVE
            </div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate" title={card.title}>
              {card.title}
            </h4>
          </div>
          
          {/* Live Values Grid (Only rendered when EXACTLY 1 variable is selected to keep header visual stability) */}
          {!isCompact && series.length === 1 && (
            <div className="flex flex-wrap gap-x-2 gap-y-0.5 justify-end text-[10px] font-bold font-mono text-right max-w-[60%]">
              {series.map((s) => (
                <span
                  key={`${s.objectId}-${s.propertyName}`}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800"
                  style={{ color: s.color || '#3b82f6' }}
                >
                  <span className="w-1 h-1 rounded-full bg-current animate-pulse shrink-0" />
                  <span className="text-[9px] text-slate-450 dark:text-slate-500 font-sans font-medium truncate max-w-[55px]">
                    {s.label.split('.')[0]}
                  </span>
                  <span>
                    {s.currentValue.toFixed(1)}
                    {s.unit && <span className="text-[8px] font-sans font-medium ml-0.5 opacity-80">{s.unit}</span>}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic SVG Container */}
        <div
          ref={elementRef}
          className="flex-1 min-h-0 relative w-full border border-slate-100 dark:border-slate-800/80 rounded-lg overflow-hidden bg-slate-50/15 dark:bg-slate-950/20"
        >
          {series.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              Nenhuma variável configurada.
            </div>
          ) : chartWidth <= 0 || chartHeight <= 0 ? (
            null
          ) : (
            <svg
              width="100%"
              height="100%"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoverData(null)}
              className="overflow-visible"
            >
              {/* Draw Ultra-Subtle Horizontal Gridlines */}
              {yGridTicks.map((tickPct, idx) => (
                <line
                  key={idx}
                  x1={paddingLeft}
                  y1={paddingTop + chartHeight * tickPct}
                  x2={paddingLeft + chartWidth}
                  y2={paddingTop + chartHeight * tickPct}
                  stroke={isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}
                  strokeDasharray="2,2"
                />
              ))}

              {/* Draw Ultra-Subtle Vertical Gridlines */}
              {xGridTicks.map((tickTime, idx) => (
                <line
                  key={idx}
                  x1={getX(tickTime)}
                  y1={paddingTop}
                  x2={getX(tickTime)}
                  y2={paddingTop + chartHeight}
                  stroke={isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}
                  strokeDasharray="2,2"
                />
              ))}

              {/* Draw Y-Axis Labels (Only when not compact and shared scale matches first series) */}
              {!isCompact && shareYScale && yTicks.map((tickVal, idx) => {
                const textY = getY(tickVal, `${series[0].objectId}:${series[0].propertyName}`);
                return (
                  <text
                    key={idx}
                    x={paddingLeft - 6}
                    y={textY}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="text-[9px] font-mono fill-slate-400 dark:fill-slate-500 select-none"
                  >
                    {tickVal.toFixed(0)}
                    {idx === 0 && series[0].unit}
                  </text>
                );
              })}

              {/* Draw Series Lines and Areas */}
              {series.map((s) => {
                const { pathD, areaD, lastX, lastY } = generatePaths(s);
                const color = s.color || '#3b82f6';
                if (!pathD) return null;

                return (
                  <g key={`${s.objectId}-${s.propertyName}`}>
                    <defs>
                      <linearGradient id={`grad-${s.objectId}-${s.propertyName}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.12" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {areaD && (
                      <path d={areaD} fill={`url(#grad-${s.objectId}-${s.propertyName})`} />
                    )}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={color}
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {s.points.length > 0 && (
                      <g>
                        <circle
                          cx={lastX}
                          cy={lastY}
                          r="3"
                          fill={color}
                        />
                        <circle
                          cx={lastX}
                          cy={lastY}
                          r="6"
                          fill={color}
                          opacity="0.3"
                          className="animate-ping"
                        />
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Draw X-Axis Time Labels at ticks */}
              {!isCompact && xTicks.map((tickTime, idx) => (
                <text
                  key={idx}
                  x={getX(tickTime)}
                  y={paddingTop + chartHeight + 12}
                  textAnchor="middle"
                  className="text-[8.5px] font-mono fill-slate-400 dark:fill-slate-500 select-none"
                >
                  {formatTime(tickTime)}
                </text>
              ))}

              {/* Interactive Tooltip Cursor Line */}
              {hoverData && (
                <line
                  x1={hoverData.x}
                  y1={paddingTop}
                  x2={hoverData.x}
                  y2={paddingTop + chartHeight}
                  stroke={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.15)'}
                  strokeWidth="1.2"
                />
              )}
            </svg>
          )}

          {/* Hover interactive tooltip popup overlay */}
          {hoverData && (
            <div
              className="absolute z-30 pointer-events-none p-2 rounded-lg border bg-white/95 dark:bg-slate-900/95 shadow-xl border-slate-200 dark:border-slate-800 text-[10px] min-w-[130px] flex flex-col gap-1 backdrop-blur-xs font-sans"
              style={{
                left: hoverData.x > dimensions.width - 150 ? hoverData.x - 145 : hoverData.x + 8,
                top: Math.max(8, Math.min(hoverData.y - 12, dimensions.height - 85)),
              }}
            >
              <div className="font-bold text-slate-400 dark:text-slate-500 font-mono border-b border-slate-100 dark:border-slate-800 pb-0.5 mb-0.5">
                {formatTime(hoverData.timestamp)}
              </div>
              {hoverData.values.map((v) => (
                <div key={`${v.objectId}-${v.propertyName}`} className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: v.color }} />
                    <span className="text-slate-700 dark:text-slate-350 font-semibold truncate font-mono">
                      {v.label.split('.')[0]} • {v.propertyName}
                    </span>
                  </div>
                  <span className="font-bold text-slate-850 dark:text-slate-100 font-mono shrink-0">
                    {v.value.toFixed(1)}
                    {v.unit && <span className="text-[8px] font-sans font-medium text-slate-400 dark:text-slate-500 ml-0.5">{v.unit}</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend (bottom compact row for multi-series description) */}
        {!isCompact && series.length > 0 && (
          <div className="shrink-0 border-t border-slate-100 dark:border-slate-800/80 pt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
            {series.map((s) => (
              <div
                key={`${s.objectId}-${s.propertyName}`}
                className="flex items-center gap-1.5 text-[9px] font-medium"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: s.color || '#3b82f6' }}
                />
                <span className="text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                  {s.label.split('.')[0]} • {s.propertyName}
                </span>
                <span className="text-[8px] text-slate-350 dark:text-slate-600 font-mono uppercase">
                  ({s.unit || 's/u'})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
