import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Play, Pause, Maximize, Minimize } from 'lucide-react';
import { screenRepo } from '../repository/ScreenRepository';
import { useObjectModelStore } from '../store/useObjectModelStore';
import { useWidgetStore } from '../store/useWidgetStore';

import { inheritanceService } from '../services/InheritanceService';
import { resolveWidgetElementStyle, resolveWidgetElementText } from '../utils/widgetDynamics';
import type { ScreenEntity, ScreenElement } from '../types/domain';

// ─── Variable Display ─────────────────────────────────────────────────────────
const RuntimeVariableDisplay: React.FC<{
  element: ScreenElement;
  simulatedValues: Record<string, string>;
}> = ({ element, simulatedValues }) => {
  const key = element.objectId && element.propertyName
    ? `${element.objectId}:${element.propertyName}`
    : null;
  const rawValue = key ? (simulatedValues[key] ?? '—') : '—';

  let displayValue = rawValue;
  if (element.decimalPlaces !== undefined && !isNaN(parseFloat(rawValue))) {
    let num = parseFloat(rawValue);
    if (element.conversionFactor) num *= element.conversionFactor;
    displayValue = num.toFixed(element.decimalPlaces);
  }

  const label = element.showLabel !== false
    ? `${element.customLabel || element.propertyName || ''}: `
    : '';
  const unit = element.showUnit && element.unit ? ` ${element.unit}` : '';

  return (
    <div
      className="w-full h-full flex items-center px-2 overflow-hidden"
      style={{
        fontSize: element.fontSize ?? 13,
        color: element.textColor ?? '#f1f5f9',
        background: element.backgroundColor ?? element.fill ?? 'transparent',
        border: `${element.strokeWidth ?? 1}px solid ${element.stroke ?? '#334155'}`,
        borderRadius: element.cornerRadius ?? 4,
      }}
    >
      {label && <span style={{ color: '#94a3b8', marginRight: 2, flexShrink: 0 }}>{label}</span>}
      <span style={{ fontFamily: 'monospace', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {displayValue}
      </span>
      {unit && <span style={{ color: '#94a3b8', marginLeft: 2, flexShrink: 0 }}>{unit}</span>}
    </div>
  );
};

// ─── Widget Instance Runtime ──────────────────────────────────────────────────
const RuntimeWidgetInstance: React.FC<{
  element: ScreenElement;
  simulatedValues: Record<string, string>;
}> = ({ element, simulatedValues }) => {
  const { widgets } = useWidgetStore();
  const widget = widgets.find((w) => w.id === element.widgetId);

  if (!widget) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-800/80 border border-dashed border-slate-600 text-slate-500 text-xs">
        Widget não encontrado
      </div>
    );
  }

  // Resolve association mappings for this object ↔ widget pair
  const objectId = element.objectId ?? '';
  const association = objectId
    ? inheritanceService.getMergedAssociatedWidgets(objectId, 'instance').find(
        (a) => a.widgetId === widget.id
      )
    : null;
  const mappings = association?.mappings ?? element.mappings ?? {};

  const scaleX = element.width / widget.canvasWidth;
  const scaleY = element.height / widget.canvasHeight;
  const scale = Math.min(scaleX, scaleY);

  return (
    <div className="w-full h-full overflow-hidden relative">
      <div
        style={{
          width: widget.canvasWidth,
          height: widget.canvasHeight,
          transform: `scale(${scale})`,
          transformOrigin: '0 0',
          position: 'absolute',
          background: widget.backgroundColor,
        }}
      >
        {widget.elements.map((el) => {
          const resolved = resolveWidgetElementStyle(el, mappings, simulatedValues, objectId);
          if (resolved.isHidden) return null;

          const textContent = resolveWidgetElementText(el, widget.customProperties, mappings, simulatedValues, objectId);

          const baseStyle: React.CSSProperties = {
            position: 'absolute',
            left: el.x,
            top: el.y,
            width: el.width,
            height: el.height,
            border: `${el.strokeWidth}px ${el.strokeStyle} ${resolved.stroke}`,
            borderRadius: (el.type === 'circle' || el.type === 'status_light') ? '50%' : el.type === 'tank' ? 12 : el.cornerRadius,
            fontSize: el.fontSize,
            color: el.textColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: el.textAlignment === 'left' ? 'flex-start' : el.textAlignment === 'right' ? 'flex-end' : 'center',
            overflow: 'hidden',
            boxSizing: 'border-box',
            padding: '2px 4px',
            transition: 'background 0.4s ease, border-color 0.4s ease',
          };

          if (resolved.fillLevel) {
            return (
              <div key={el.id} style={{ ...baseStyle, ...resolved.fillLevel.containerStyle, padding: 0, display: 'block' }}>
                <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                  <div style={resolved.fillLevel.overlayStyle} />
                  {textContent && (
                    <span style={{ position: 'relative', zIndex: 1, padding: '2px 4px' }}>
                      {textContent}
                    </span>
                  )}
                </div>
              </div>
            );
          }

          if (el.type === 'image') {
            return (
              <div key={el.id} style={{ ...baseStyle, background: resolved.fill }}>
                {el.imageUri ? (
                  <img src={el.imageUri} alt="" className="w-full h-full object-contain" draggable={false} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800/60 text-slate-500 text-[10px]">
                    Sem imagem
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={el.id} style={{ ...baseStyle, background: resolved.fill }}>
              {textContent}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Element Runtime Renderer ─────────────────────────────────────────────────
const RuntimeElement: React.FC<{
  element: ScreenElement;
  simulatedValues: Record<string, string>;
}> = ({ element, simulatedValues }) => {

  if (element.type === 'line') {
    const x1 = element.fromX ?? element.x;
    const y1 = element.fromY ?? element.y;
    const x2 = element.toX ?? (element.x + (element.width || 100));
    const y2 = element.toY ?? (element.y + (element.height || 0));
    const svgLeft = Math.min(x1, x2) - 10;
    const svgTop = Math.min(y1, y2) - 10;
    const svgW = Math.abs(x2 - x1) + 20;
    const svgH = Math.abs(y2 - y1) + 20;

    return (
      <svg
        style={{
          position: 'absolute',
          left: svgLeft, top: svgTop,
          width: svgW, height: svgH,
          zIndex: element.zIndex,
          pointerEvents: 'none',
          overflow: 'visible',
        }}
      >
        <defs>
          <marker id={`arrow-rt-${element.id}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill={element.stroke ?? '#64748b'} />
          </marker>
        </defs>
        <line
          x1={x1 - svgLeft} y1={y1 - svgTop} x2={x2 - svgLeft} y2={y2 - svgTop}
          stroke={element.stroke ?? '#64748b'}
          strokeWidth={element.strokeWidth ?? 2}
          strokeDasharray={element.strokeStyle === 'dashed' ? '8 4' : element.strokeStyle === 'dotted' ? '2 4' : undefined}
          markerEnd={element.arrowEnd ? `url(#arrow-rt-${element.id})` : undefined}
          markerStart={element.arrowStart ? `url(#arrow-rt-${element.id})` : undefined}
        />
      </svg>
    );
  }

  const style: React.CSSProperties = {
    position: 'absolute',
    left: element.x, top: element.y,
    width: element.width, height: element.height,
    zIndex: element.zIndex,
    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
    boxSizing: 'border-box',
  };

  const getContent = () => {
    switch (element.type) {
      case 'widget-instance':
        return <RuntimeWidgetInstance element={element} simulatedValues={simulatedValues} />;
      case 'variable-display':
        return <RuntimeVariableDisplay element={element} simulatedValues={simulatedValues} />;
      case 'rectangle':
        return (
          <div className="w-full h-full" style={{
            background: element.fill ?? '#3b82f6',
            border: `${element.strokeWidth ?? 1}px ${element.strokeStyle ?? 'solid'} ${element.stroke ?? '#1d4ed8'}`,
            borderRadius: element.cornerRadius ?? 4,
          }} />
        );
      case 'circle':
        return (
          <div className="w-full h-full" style={{
            background: element.fill ?? '#10b981',
            border: `${element.strokeWidth ?? 1}px ${element.strokeStyle ?? 'solid'} ${element.stroke ?? '#059669'}`,
            borderRadius: '50%',
          }} />
        );
      case 'text':
        return (
          <div className="w-full h-full flex items-center px-1 overflow-hidden" style={{
            fontSize: element.fontSize ?? 14,
            color: element.textColor ?? '#f1f5f9',
            justifyContent: element.textAlignment === 'right' ? 'flex-end' : element.textAlignment === 'left' ? 'flex-start' : 'center',
          }}>
            {element.textContent}
          </div>
        );
      case 'image':
        return element.imageUri
          ? <img src={element.imageUri} alt="" className="w-full h-full object-contain" draggable={false} />
          : null;
      default:
        return null;
    }
  };

  return (
    <div style={style}>
      {getContent()}
    </div>
  );
};

// ─── Runtime Page ─────────────────────────────────────────────────────────────
export const ScreenRuntimePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [screen, setScreen] = useState<ScreenEntity | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    simulatedValues,
    isSimulating,
    toggleSimulation,
    init: initObjects,
  } = useObjectModelStore();

  const { init: initWidgets } = useWidgetStore();

  useEffect(() => {
    initObjects();
    initWidgets();
  }, [initObjects, initWidgets]);

  useEffect(() => {
    if (!id) return;
    const found = screenRepo.getById(id);
    setScreen(found ?? null);
  }, [id]);

  // Simulation tick is handled globally by App.tsx


  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!screen) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="text-center">
          <p className="text-2xl font-bold mb-2">Tela não encontrada</p>
          <p className="text-sm mb-4">ID: {id}</p>
          <button
            onClick={() => navigate('/screens')}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-500"
          >
            Voltar ao Designer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-screen h-screen overflow-hidden bg-black flex flex-col"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Minimal Runtime Toolbar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-950/90 border-b border-slate-800/60 shrink-0 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-violet-400">{screen.name}</span>
          <span className="text-[10px] text-slate-500">Runtime</span>
          <div className={`flex items-center gap-1.5 text-[10px] ${isSimulating ? 'text-emerald-400' : 'text-slate-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isSimulating ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            {isSimulating ? 'Simulador Ativo' : 'Simulador Parado'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleSimulation()}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              isSimulating
                ? 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 border border-amber-600/30'
                : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-600/30'
            }`}
          >
            {isSimulating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isSimulating ? 'Pausar' : 'Iniciar'} Sim
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md text-slate-400 hover:bg-slate-800 transition-colors"
            title="Tela Cheia"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => window.close()}
            className="p-1.5 rounded-md text-slate-400 hover:bg-red-900/40 hover:text-red-400 transition-colors"
            title="Fechar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-950 p-4">
        <div
          className="relative shrink-0"
          style={{
            width: screen.canvasWidth,
            height: screen.canvasHeight,
            background: screen.backgroundColor,
            boxShadow: '0 0 40px rgba(0,0,0,0.8)',
          }}
        >
          {[...screen.elements]
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((el) => (
              <RuntimeElement key={el.id} element={el} simulatedValues={simulatedValues} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default ScreenRuntimePage;
