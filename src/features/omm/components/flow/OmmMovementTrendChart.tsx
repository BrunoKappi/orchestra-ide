import React, { memo } from 'react';

interface OmmMovementTrendChartProps {
  /** Display label (e.g. "Tendência de Nível") */
  title: string;
  /** Equipment tag used as chart ID/key */
  tag: string;
  /** Historical sample values (0–100 scale, matching level %) */
  values: number[];
  /** Line/area color (CSS color string) */
  color: string;
  /** Current live value — rendered as a dot on the right edge */
  currentValue: number;
  /** Optional suffix for the value label (default: "%") */
  unit?: string;
  /** Chart height in pixels (default: 70) */
  height?: number;
}

export const OmmMovementTrendChart: React.FC<OmmMovementTrendChartProps> = memo(({
  title,
  tag,
  values,
  color,
  currentValue,
  unit = '%',
  height = 70,
}) => {
  const width = 280;
  const points = values.length > 0 ? values : [currentValue];

  const pathD = points
    .map((val, idx) => {
      const x = (idx / Math.max(1, points.length - 1)) * width;
      const y = height - (val / 100) * (height - 10) - 5;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  const gradId = `grad-omm-${tag.replace(/[^a-z0-9]/gi, '_')}`;

  return (
    <div className="flex flex-col bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs select-text">
      <div className="flex justify-between items-center mb-1.5">
        <div>
          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
            {tag}
          </span>
          <h4 className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
            {title}
          </h4>
        </div>
        <div className="text-right font-mono">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
            {currentValue.toFixed(1)}{unit}
          </span>
        </div>
      </div>

      <div className="relative border-b border-l border-slate-200 dark:border-slate-800" style={{ height }}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines at 25%, 50%, 75% */}
          {[0.25, 0.5, 0.75].map((pct) => (
            <line
              key={pct}
              x1="0" y1={height * pct}
              x2={width} y2={height * pct}
              stroke="currentColor"
              className="text-slate-100 dark:text-slate-800/40"
              strokeDasharray="3 3"
            />
          ))}

          <path d={areaD} fill={`url(#${gradId})`} />
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Live dot at the rightmost point */}
          {points.length > 0 && (
            <circle
              cx={width}
              cy={height - (points[points.length - 1] / 100) * (height - 10) - 5}
              r="3"
              fill={color}
              className="animate-pulse"
            />
          )}
        </svg>
      </div>
    </div>
  );
});

OmmMovementTrendChart.displayName = 'OmmMovementTrendChart';
