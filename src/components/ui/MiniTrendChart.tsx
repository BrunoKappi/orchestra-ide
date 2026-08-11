import React, { useMemo } from 'react';

interface MiniTrendChartProps {
  values: number[];
  color?: string;
  height?: number;
  showPoints?: boolean;
  min?: number;
  max?: number;
}

export const MiniTrendChart: React.FC<MiniTrendChartProps> = ({
  values,
  color = '#38bdf8',
  height = 64,
  showPoints = true,
  min,
  max,
}) => {
  const safeValues = values.length > 0 ? values : [0];
  
  // Custom scaling limits to prevent noise stretching
  let minVal = min !== undefined ? min : Math.min(...safeValues);
  let maxVal = max !== undefined ? max : Math.max(...safeValues);
  
  if (min === undefined || max === undefined) {
    const actualMin = Math.min(...safeValues);
    const actualMax = Math.max(...safeValues);
    const actualRange = actualMax - actualMin;
    
    if (min === undefined && max === undefined) {
      if (actualRange < 0.5) {
        const mid = (actualMin + actualMax) / 2;
        minVal = mid - 1.0;
        maxVal = mid + 1.0;
      } else {
        minVal = actualMin;
        maxVal = actualMax;
      }
    } else if (min !== undefined && max === undefined) {
      if (actualMax - minVal < 0.5) {
        maxVal = minVal + 2.0;
      }
    } else if (min === undefined && max !== undefined) {
      if (maxVal - actualMin < 0.5) {
        minVal = maxVal - 2.0;
      }
    }
  }

  // Ensure strict inequality
  if (minVal === maxVal) {
    minVal -= 1;
    maxVal += 1;
  }

  const range = maxVal - minVal;

  const width = 500;
  const padding = 6;

  const points = useMemo(() => {
    if (safeValues.length === 0) return [];
    const step = safeValues.length > 1 ? width / (safeValues.length - 1) : width;
    
    return safeValues.map((val, idx) => {
      const x = idx * step;
      const relativeVal = range === 0 ? 0.5 : (val - minVal) / range;
      const y = height - padding - relativeVal * (height - padding * 2);
      return { x, y };
    });
  }, [safeValues, minVal, maxVal, range, height]);

  const polylinePointsStr = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  const areaPathStr = useMemo(() => {
    if (points.length === 0) return '';
    const firstX = points[0].x.toFixed(1);
    const lastX = points[points.length - 1].x.toFixed(1);
    return `M ${firstX},${height} L ${polylinePointsStr.split(' ').join(' L ')} L ${lastX},${height} Z`;
  }, [points, height, polylinePointsStr]);

  // Unique ID for SVG gradient to avoid collisions when multiple charts render
  const gradientId = useMemo(() => `trend-grad-${Math.random().toString(36).substring(2, 9)}`, []);

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="overflow-visible select-none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Ultra-subtle grid lines */}
      <line
        x1="0"
        y1={height / 2}
        x2={width}
        y2={height / 2}
        stroke="#e2e8f0"
        className="dark:stroke-slate-800/40"
        strokeDasharray="3 3"
      />
      <line
        x1="0"
        y1={height - 2}
        x2={width}
        y2={height - 2}
        stroke="#cbd5e1"
        className="dark:stroke-slate-800/20"
      />

      {/* Gradient filled area */}
      {points.length > 0 && (
        <path d={areaPathStr} fill={`url(#${gradientId})`} />
      )}

      {/* Trend polyline */}
      {points.length > 0 && (
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polylinePointsStr}
          className="transition-all duration-300"
        />
      )}

      {/* Glowing live dot at current (last) sample */}
      {showPoints && points.length > 0 && (
        <>
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="5"
            fill={color}
            className="animate-ping opacity-60"
            style={{ transformOrigin: `${points[points.length - 1].x}px ${points[points.length - 1].y}px` }}
          />
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="3.5"
            fill={color}
            stroke="#ffffff"
            strokeWidth="1.5"
            className="dark:stroke-slate-900"
          />
        </>
      )}
    </svg>
  );
};
