import React from 'react';
import type { TankGeometryType } from '../types/domain';

interface TankGeometrySvgProps {
  geometry: TankGeometryType;
  /** Level fill percentage 0–100 */
  levelPercent: number;
  /** Hex color for the liquid fill */
  fillColor?: string;
  /** Total width of the SVG */
  width?: number;
  /** Total height of the SVG */
  height?: number;
  /** CSS class names */
  className?: string;
}

/**
 * Renders an industrial SVG tank representation based on geometry type.
 * Used both in EquipmentGraphicConfigEditor preview and IndustrialTankCard.
 */
export const TankGeometrySvg: React.FC<TankGeometrySvgProps> = ({
  geometry,
  levelPercent,
  fillColor = '#38bdf8',
  width = 72,
  height = 100,
  className,
}) => {
  const clampedLevel = Math.min(100, Math.max(0, levelPercent));

  switch (geometry) {
    case 'vertical_cylindrical':
      return <VerticalCylindricalSvg level={clampedLevel} fillColor={fillColor} width={width} height={height} className={className} />;
    case 'horizontal_cylindrical':
      return <HorizontalCylindricalSvg level={clampedLevel} fillColor={fillColor} width={width} height={height} className={className} />;
    case 'spherical':
      return <SphericalSvg level={clampedLevel} fillColor={fillColor} width={width} height={height} className={className} />;
    case 'pressurized':
      return <PressurizedSvg level={clampedLevel} fillColor={fillColor} width={width} height={height} className={className} />;
    default:
      return null;
  }
};

// ---------------------------------------------------------------------------
// 1. Vertical Cylindrical Tank
// ---------------------------------------------------------------------------
const VerticalCylindricalSvg: React.FC<{
  level: number; fillColor: string; width: number; height: number; className?: string;
}> = ({ level, fillColor, width, height, className }) => {
  const rx = width * 0.42;       // ellipse x-radius
  const ry = height * 0.055;     // ellipse y-radius (top/bottom caps)
  const cx = width / 2;
  const bodyTop = ry * 2;        // body starts below top cap
  const bodyHeight = height - bodyTop - ry * 2; // body height
  const bodyBottom = bodyTop + bodyHeight;

  // Fill: fills from bottom up
  const fillH = (level / 100) * bodyHeight;
  const fillY = bodyBottom - fillH;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} style={{ overflow: 'visible' }}>
      <defs>
        <clipPath id={`vc-clip-${level}`}>
          {/* Clip to tank body */}
          <rect x={cx - rx} y={bodyTop} width={rx * 2} height={bodyHeight} />
        </clipPath>
        <linearGradient id={`vc-fill-${level}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={fillColor} stopOpacity="0.7" />
          <stop offset="50%" stopColor={fillColor} stopOpacity="1" />
          <stop offset="100%" stopColor={fillColor} stopOpacity="0.7" />
        </linearGradient>
      </defs>

      {/* Tank body outline */}
      <rect
        x={cx - rx} y={bodyTop}
        width={rx * 2} height={bodyHeight}
        fill="#1e293b" stroke="#475569" strokeWidth="1.5"
      />

      {/* Liquid fill (clipped to body rect) */}
      {level > 0 && (
        <g clipPath={`url(#vc-clip-${level})`}>
          <rect
            x={cx - rx} y={fillY}
            width={rx * 2} height={fillH}
            fill={`url(#vc-fill-${level})`}
          />
          {/* Surface ripple */}
          <ellipse cx={cx} cy={fillY} rx={rx - 2} ry={ry * 0.7} fill={fillColor} opacity={0.5} />
        </g>
      )}

      {/* Top ellipse cap */}
      <ellipse cx={cx} cy={bodyTop} rx={rx} ry={ry} fill="#334155" stroke="#475569" strokeWidth="1.5" />

      {/* Bottom ellipse cap */}
      <ellipse cx={cx} cy={bodyBottom} rx={rx} ry={ry} fill="#1e293b" stroke="#475569" strokeWidth="1.5" />

      {/* Graduation marks on right side */}
      {[25, 50, 75].map((pct) => {
        const markY = bodyBottom - (pct / 100) * bodyHeight;
        return (
          <line
            key={pct}
            x1={cx + rx} y1={markY}
            x2={cx + rx + 4} y2={markY}
            stroke="#64748b" strokeWidth="1"
          />
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// 2. Horizontal Cylindrical Tank
// ---------------------------------------------------------------------------
const HorizontalCylindricalSvg: React.FC<{
  level: number; fillColor: string; width: number; height: number; className?: string;
}> = ({ level, fillColor, width, height, className }) => {
  const ry = height * 0.42;    // body half-height
  const rx = width * 0.06;     // ellipse x-radius (end caps)
  const cy = height / 2;
  const bodyLeft = rx * 2;
  const bodyWidth = width - bodyLeft * 2;
  const bodyRight = bodyLeft + bodyWidth;

  // Fill: fills from left side based on level
  const fillW = (level / 100) * bodyWidth;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} style={{ overflow: 'visible' }}>
      <defs>
        <clipPath id={`hc-clip-${level}`}>
          <rect x={bodyLeft} y={cy - ry} width={bodyWidth} height={ry * 2} />
        </clipPath>
        <linearGradient id={`hc-fill-${level}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={fillColor} stopOpacity="1" />
          <stop offset="100%" stopColor={fillColor} stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Tank body outline */}
      <rect
        x={bodyLeft} y={cy - ry}
        width={bodyWidth} height={ry * 2}
        fill="#1e293b" stroke="#475569" strokeWidth="1.5"
      />

      {/* Liquid fill */}
      {level > 0 && (
        <g clipPath={`url(#hc-clip-${level})`}>
          <rect
            x={bodyLeft} y={cy - ry}
            width={fillW} height={ry * 2}
            fill={`url(#hc-fill-${level})`}
          />
          {/* Surface ripple line */}
          <line
            x1={bodyLeft + fillW} y1={cy - ry}
            x2={bodyLeft + fillW} y2={cy + ry}
            stroke={fillColor} strokeWidth="1.5" opacity={0.7}
          />
        </g>
      )}

      {/* Left ellipse cap */}
      <ellipse cx={bodyLeft} cy={cy} rx={rx} ry={ry} fill="#334155" stroke="#475569" strokeWidth="1.5" />

      {/* Right ellipse cap */}
      <ellipse cx={bodyRight} cy={cy} rx={rx} ry={ry} fill="#1e293b" stroke="#475569" strokeWidth="1.5" />

      {/* Support legs */}
      <line x1={bodyLeft + bodyWidth * 0.25} y1={cy + ry} x2={bodyLeft + bodyWidth * 0.2} y2={height} stroke="#64748b" strokeWidth="1.5" />
      <line x1={bodyLeft + bodyWidth * 0.75} y1={cy + ry} x2={bodyLeft + bodyWidth * 0.8} y2={height} stroke="#64748b" strokeWidth="1.5" />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// 3. Spherical Tank
// ---------------------------------------------------------------------------
const SphericalSvg: React.FC<{
  level: number; fillColor: string; width: number; height: number; className?: string;
}> = ({ level, fillColor, width, height, className }) => {
  const cx = width / 2;
  const cy = height * 0.44;    // slightly above center to leave room for legs
  const r = Math.min(cx, cy) * 0.88;

  // Chord fill height: fill from bottom of circle up
  const fillH = (level / 100) * r * 2;
  const fillY = cy + r - fillH; // top of fill

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} style={{ overflow: 'visible' }}>
      <defs>
        <clipPath id={`sp-clip-${level}`}>
          <circle cx={cx} cy={cy} r={r - 1} />
        </clipPath>
        <radialGradient id={`sp-fill-${level}`} cx="30%" cy="30%">
          <stop offset="0%" stopColor={fillColor} stopOpacity="0.9" />
          <stop offset="100%" stopColor={fillColor} stopOpacity="0.5" />
        </radialGradient>
      </defs>

      {/* Sphere body */}
      <circle cx={cx} cy={cy} r={r} fill="#1e293b" stroke="#475569" strokeWidth="1.5" />

      {/* Liquid fill */}
      {level > 0 && (
        <g clipPath={`url(#sp-clip-${level})`}>
          <rect
            x={cx - r} y={fillY}
            width={r * 2} height={fillH}
            fill={`url(#sp-fill-${level})`}
          />
        </g>
      )}

      {/* Sphere highlight */}
      <circle cx={cx - r * 0.28} cy={cy - r * 0.28} r={r * 0.15} fill="white" opacity={0.08} />

      {/* Support legs */}
      {[-1, 0, 1].map((i) => (
        <line
          key={i}
          x1={cx + i * r * 0.45} y1={cy + r * 0.85}
          x2={cx + i * r * 0.6} y2={height}
          stroke="#64748b" strokeWidth="1.5"
        />
      ))}

      {/* Equator ring */}
      <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.15} fill="none" stroke="#475569" strokeWidth="1" opacity={0.5} />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// 4. Pressurized Vessel (horizontal cylinder with hemispherical heads)
// ---------------------------------------------------------------------------
const PressurizedSvg: React.FC<{
  level: number; fillColor: string; width: number; height: number; className?: string;
}> = ({ level, fillColor, width, height, className }) => {
  const cx = width / 2;
  const ry = height * 0.32;    // half-height of the vessel body
  const rx = width * 0.14;     // radius of the hemispherical heads
  const cy = height * 0.44;
  const bodyLeft = rx;
  const bodyWidth = width - rx * 2;
  const bodyRight = bodyLeft + bodyWidth;

  // Fill from left
  const fillW = (level / 100) * bodyWidth;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} style={{ overflow: 'visible' }}>
      <defs>
        <clipPath id={`pv-clip-${level}`}>
          {/* Simplified clip: rect over body only */}
          <rect x={bodyLeft} y={cy - ry} width={bodyWidth} height={ry * 2} />
        </clipPath>
        <linearGradient id={`pv-fill-${level}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={fillColor} stopOpacity="0.9" />
          <stop offset="100%" stopColor={fillColor} stopOpacity="0.55" />
        </linearGradient>
      </defs>

      {/* Vessel body */}
      <rect
        x={bodyLeft} y={cy - ry}
        width={bodyWidth} height={ry * 2}
        fill="#1e293b" stroke="#475569" strokeWidth="1.5"
      />

      {/* Liquid fill (body only) */}
      {level > 0 && (
        <g clipPath={`url(#pv-clip-${level})`}>
          <rect
            x={bodyLeft} y={cy - ry}
            width={fillW} height={ry * 2}
            fill={`url(#pv-fill-${level})`}
          />
        </g>
      )}

      {/* Left hemispherical head */}
      <ellipse cx={bodyLeft} cy={cy} rx={rx} ry={ry} fill="#1e293b" stroke="#475569" strokeWidth="1.5" />

      {/* Right hemispherical head */}
      <ellipse cx={bodyRight} cy={cy} rx={rx} ry={ry} fill="#1e293b" stroke="#475569" strokeWidth="1.5" />

      {/* Nozzle on top */}
      <rect x={cx - 3} y={cy - ry - 8} width={6} height={8} fill="#334155" stroke="#475569" strokeWidth="1" />
      <rect x={cx - 6} y={cy - ry - 10} width={12} height={3} fill="#475569" />

      {/* Support saddles */}
      <rect x={bodyLeft + bodyWidth * 0.22} y={cy + ry} width={6} height={height - (cy + ry)} fill="#334155" stroke="#475569" strokeWidth="1" />
      <rect x={bodyLeft + bodyWidth * 0.72} y={cy + ry} width={6} height={height - (cy + ry)} fill="#334155" stroke="#475569" strokeWidth="1" />

      {/* Pressure band rings */}
      {[0.3, 0.7].map((pos) => (
        <line
          key={pos}
          x1={bodyLeft + pos * bodyWidth} y1={cy - ry}
          x2={bodyLeft + pos * bodyWidth} y2={cy + ry}
          stroke="#475569" strokeWidth="1.5" opacity={0.6}
        />
      ))}
    </svg>
  );
};
