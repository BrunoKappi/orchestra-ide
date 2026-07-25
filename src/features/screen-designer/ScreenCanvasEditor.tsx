import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Save,
  X,
  MousePointer,
  Square,
  Circle,
  Type,
  Minus,
  Grid,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Monitor,
  Boxes,
} from 'lucide-react';
import { useScreenStore } from '../../store/useScreenStore';
import { useObjectModelStore } from '../../store/useObjectModelStore';
import { useWidgetStore } from '../../store/useWidgetStore';
import { inheritanceService } from '../../services/InheritanceService';
import { resolveWidgetElementStyle, resolveWidgetElementText } from '../../utils/widgetDynamics';
import type { ScreenElement } from '../../types/domain';
import { ScreenExplorerPanel } from './ScreenExplorerPanel';
import { cn } from '../../utils/cn';


// ─── Widget Instance Renderer ────────────────────────────────────────────────
const WidgetInstanceRenderer: React.FC<{
  element: ScreenElement;
  simulatedValues: Record<string, string>;
}> = ({ element, simulatedValues }) => {
  const { widgets } = useWidgetStore();
  const widget = widgets.find((w) => w.id === element.widgetId);

  if (!widget) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-800/80 border border-dashed border-slate-600 rounded text-slate-500 text-[10px]">
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
            // fill_level: render container + overlay
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

// ─── Variable Display Renderer ────────────────────────────────────────────────
const VariableDisplayRenderer: React.FC<{
  element: ScreenElement;
  simulatedValues: Record<string, string>;
  isRuntime?: boolean;
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
      className="w-full h-full flex items-center px-2 rounded overflow-hidden"
      style={{
        fontSize: element.fontSize ?? 13,
        color: element.textColor ?? '#f1f5f9',
        background: element.backgroundColor ?? 'transparent',
        border: `${element.strokeWidth ?? 1}px solid ${element.stroke ?? '#334155'}`,
        borderRadius: element.cornerRadius ?? 4,
      }}
    >
      {label && <span className="text-slate-400 mr-0.5 truncate shrink-0">{label}</span>}
      <span className="font-mono font-semibold tabular-nums truncate">{displayValue}</span>
      {unit && <span className="text-slate-400 ml-0.5 shrink-0">{unit}</span>}
    </div>
  );
};

// ─── Element Renderer ─────────────────────────────────────────────────────────
const ElementRenderer: React.FC<{
  element: ScreenElement;
  isSelected: boolean;
  isRuntime?: boolean;
  simulatedValues: Record<string, string>;
  onSelect: (id: string) => void;
  onMove: (
    id: string,
    initialX: number,
    initialY: number,
    dx: number,
    dy: number,
    initialFromX?: number,
    initialFromY?: number,
    initialToX?: number,
    initialToY?: number
  ) => void;
  onResize: (id: string, w: number, h: number, x: number, y: number) => void;
  zoom: number;
  snap: (v: number) => number;
  onLinePointsChange: (id: string, fx: number, fy: number, tx: number, ty: number) => void;
}> = ({
  element,
  isSelected,
  isRuntime,
  simulatedValues,
  onSelect,
  onMove,
  onResize,
  zoom,
  snap,
  onLinePointsChange,
}) => {
  const dragStart = useRef<{
    mx: number;
    my: number;
    ex: number;
    ey: number;
    efx?: number;
    efy?: number;
    etx?: number;
    ety?: number;
  } | null>(null);
  const resizeStart = useRef<{ mx: number; my: number; ew: number; eh: number; ex: number; ey: number } | null>(null);

  const handleStartMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const mx = e.clientX;
    const my = e.clientY;
    const fx = element.fromX ?? element.x;
    const fy = element.fromY ?? element.y;
    const tx = element.toX ?? (element.x + (element.width || 100));
    const ty = element.toY ?? (element.y + (element.height || 0));

    const onMouseMove = (me: MouseEvent) => {
      const dx = (me.clientX - mx) / zoom;
      const dy = (me.clientY - my) / zoom;
      const newFx = snap(fx + dx);
      const newFy = snap(fy + dy);
      onLinePointsChange(element.id, newFx, newFy, tx, ty);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleEndMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const mx = e.clientX;
    const my = e.clientY;
    const fx = element.fromX ?? element.x;
    const fy = element.fromY ?? element.y;
    const tx = element.toX ?? (element.x + (element.width || 100));
    const ty = element.toY ?? (element.y + (element.height || 0));

    const onMouseMove = (me: MouseEvent) => {
      const dx = (me.clientX - mx) / zoom;
      const dy = (me.clientY - my) / zoom;
      const newTx = snap(tx + dx);
      const newTy = snap(ty + dy);
      onLinePointsChange(element.id, fx, fy, newTx, newTy);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isRuntime) return;
    e.stopPropagation();
    onSelect(element.id);
    dragStart.current = {
      mx: e.clientX,
      my: e.clientY,
      ex: element.x,
      ey: element.y,
      efx: element.fromX,
      efy: element.fromY,
      etx: element.toX,
      ety: element.toY,
    };

    const handleMouseMove = (me: MouseEvent) => {
      if (!dragStart.current) return;
      const dx = me.clientX - dragStart.current.mx;
      const dy = me.clientY - dragStart.current.my;
      onMove(
        element.id,
        dragStart.current.ex,
        dragStart.current.ey,
        dx,
        dy,
        dragStart.current.efx,
        dragStart.current.efy,
        dragStart.current.etx,
        dragStart.current.ety
      );
    };
    const onUp = () => {
      dragStart.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', onUp);
  };

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
          left: svgLeft,
          top: svgTop,
          width: svgW,
          height: svgH,
          zIndex: element.zIndex,
          pointerEvents: isRuntime ? 'none' : 'all',
          cursor: isRuntime ? 'default' : 'move',
          overflow: 'visible',
        }}
        onMouseDown={handleMouseDown}
        onClick={(e) => { e.stopPropagation(); onSelect(element.id); }}
      >
        {isSelected && !isRuntime && (
          <line x1={x1 - svgLeft} y1={y1 - svgTop} x2={x2 - svgLeft} y2={y2 - svgTop}
            stroke="#7c3aed" strokeWidth={(element.strokeWidth ?? 2) + 4} strokeOpacity={0.4}
          />
        )}
        <line
          x1={x1 - svgLeft} y1={y1 - svgTop} x2={x2 - svgLeft} y2={y2 - svgTop}
          stroke={element.stroke ?? '#64748b'}
          strokeWidth={element.strokeWidth ?? 2}
          strokeDasharray={element.strokeStyle === 'dashed' ? '8 4' : element.strokeStyle === 'dotted' ? '2 4' : undefined}
          markerEnd={element.arrowEnd ? 'url(#arrow)' : undefined}
          markerStart={element.arrowStart ? 'url(#arrow)' : undefined}
        />
        {/* Handles for resizing / moving ends */}
        {isSelected && !isRuntime && (
          <>
            <circle
              cx={x1 - svgLeft}
              cy={y1 - svgTop}
              r={6}
              fill="#7c3aed"
              stroke="#ffffff"
              strokeWidth={1.5}
              style={{ cursor: 'crosshair' }}
              onMouseDown={handleStartMouseDown}
            />
            <circle
              cx={x2 - svgLeft}
              cy={y2 - svgTop}
              r={6}
              fill="#7c3aed"
              stroke="#ffffff"
              strokeWidth={1.5}
              style={{ cursor: 'crosshair' }}
              onMouseDown={handleEndMouseDown}
            />
          </>
        )}
      </svg>
    );
  }

  const style: React.CSSProperties = {
    position: 'absolute',
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    zIndex: element.zIndex,
    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
    cursor: isRuntime ? 'default' : 'move',
    boxSizing: 'border-box',
  };

  const getInnerContent = () => {
    switch (element.type) {
      case 'widget-instance':
        return <WidgetInstanceRenderer element={element} simulatedValues={simulatedValues} />;
      case 'variable-display':
        return <VariableDisplayRenderer element={element} simulatedValues={simulatedValues} isRuntime={isRuntime} />;
      case 'rectangle':
        return (
          <div
            className="w-full h-full"
            style={{
              background: element.fill ?? '#3b82f6',
              border: `${element.strokeWidth ?? 1}px ${element.strokeStyle ?? 'solid'} ${element.stroke ?? '#1d4ed8'}`,
              borderRadius: element.cornerRadius ?? 4,
            }}
          />
        );
      case 'circle':
        return (
          <div
            className="w-full h-full"
            style={{
              background: element.fill ?? '#10b981',
              border: `${element.strokeWidth ?? 1}px ${element.strokeStyle ?? 'solid'} ${element.stroke ?? '#059669'}`,
              borderRadius: '50%',
            }}
          />
        );
      case 'text':
        return (
          <div
            className="w-full h-full flex items-center overflow-hidden px-1"
            style={{
              fontSize: element.fontSize ?? 14,
              color: element.textColor ?? '#f1f5f9',
              justifyContent: element.textAlignment === 'right' ? 'flex-end' : element.textAlignment === 'left' ? 'flex-start' : 'center',
              userSelect: 'none',
            }}
          >
            {element.textContent || 'Texto'}
          </div>
        );
      case 'image':
        return element.imageUri ? (
          <img src={element.imageUri} alt="" className="w-full h-full object-contain" draggable={false} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800/60 border border-dashed border-slate-600 text-slate-500 text-[10px]">
            Sem imagem
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={style}
      onMouseDown={handleMouseDown}
      onClick={(e) => { e.stopPropagation(); onSelect(element.id); }}
    >
      {getInnerContent()}
      {/* Selection outline */}
      {isSelected && !isRuntime && (
        <>
          <div className="absolute inset-0 border-2 border-violet-500 rounded pointer-events-none" style={{ zIndex: 1 }} />
          {/* Resize handle */}
          <div
            className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-violet-500 rounded-sm cursor-se-resize z-10"
            onMouseDown={(e) => {
              e.stopPropagation();
              resizeStart.current = { mx: e.clientX, my: e.clientY, ew: element.width, eh: element.height, ex: element.x, ey: element.y };
              const onMove = (me: MouseEvent) => {
                if (!resizeStart.current) return;
                const dw = (me.clientX - resizeStart.current.mx) / zoom;
                const dh = (me.clientY - resizeStart.current.my) / zoom;
                onResize(element.id, Math.max(20, resizeStart.current.ew + dw), Math.max(16, resizeStart.current.eh + dh), resizeStart.current.ex, resizeStart.current.ey);
              };
              const onUp = () => {
                resizeStart.current = null;
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
              };
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', onUp);
            }}
          />
        </>
      )}
    </div>
  );
};

// ─── Main Canvas Editor ───────────────────────────────────────────────────────
export const ScreenCanvasEditor: React.FC = () => {
  const {
    selectedScreen,
    selectedElementId,
    activeTool,
    isGridEnabled,
    snapToGrid,
    zoom,
    hasUnsavedChanges,
    selectElement,
    addElement,
    addLineElement,
    addImageElement,
    updateElement,
    deleteElement,
    duplicateElement,
    reorderElementZ,
    saveCurrentScreen,
    saveAndCloseScreen,
    setActiveTool,
    setIsGridEnabled,
    setZoom,
    addWidgetInstance,
    addVariableRef,
  } = useScreenStore();

  const { simulatedValues } = useObjectModelStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [lineStart, setLineStart] = useState<{ x: number; y: number } | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [_dragOffsets] = useState<Record<string, { ox: number; oy: number }>>({});
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);


  const getCanvasPos = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  }, [zoom]);

  const snap = useCallback((v: number) => {
    if (!snapToGrid || !isGridEnabled) return v;
    const grid = selectedScreen?.gridSize ?? 20;
    return Math.round(v / grid) * grid;
  }, [snapToGrid, isGridEnabled, selectedScreen?.gridSize]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElementId) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
        deleteElement(selectedElementId);
      }
      if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        duplicateElement(selectedElementId);
      }
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        saveCurrentScreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, deleteElement, duplicateElement, saveCurrentScreen]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const pos = getCanvasPos(e);
    const sx = snap(pos.x);
    const sy = snap(pos.y);

    if (activeTool === 'select') {
      selectElement(null);
      return;
    }
    if (activeTool === 'line') {
      if (!lineStart) {
        setLineStart({ x: sx, y: sy });
      } else {
        addLineElement(lineStart.x, lineStart.y, sx, sy);
        setLineStart(null);
        setActiveTool('select');
      }
      return;
    }
    if (activeTool === 'image') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,.svg,.png,.jpg,.jpeg,.webp';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const uri = ev.target?.result as string;
          if (uri) addImageElement(uri, sx, sy);
        };
        reader.readAsDataURL(file);
      };
      input.click();
      setActiveTool('select');
      return;
    }
    const typeMap: Record<string, Parameters<typeof addElement>[0]> = {
      rectangle: 'rectangle',
      circle: 'circle',
      text: 'text',
    };
    if (typeMap[activeTool]) {
      addElement(typeMap[activeTool], sx, sy);
      setActiveTool('select');
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (activeTool === 'line' && lineStart) {
      setHoverPos(getCanvasPos(e));
    }
  };

  const handleElementMove = useCallback((
    id: string,
    initialX: number,
    initialY: number,
    dx: number,
    dy: number,
    initialFromX?: number,
    initialFromY?: number,
    initialToX?: number,
    initialToY?: number
  ) => {
    const nx = snap(initialX + dx / zoom);
    const ny = snap(initialY + dy / zoom);
    
    const updates: Partial<ScreenElement> = { x: nx, y: ny };
    
    // Snapped delta
    const sdx = nx - initialX;
    const sdy = ny - initialY;
    
    if (initialFromX !== undefined) updates.fromX = initialFromX + sdx;
    if (initialFromY !== undefined) updates.fromY = initialFromY + sdy;
    if (initialToX !== undefined) updates.toX = initialToX + sdx;
    if (initialToY !== undefined) updates.toY = initialToY + sdy;

    updateElement(id, updates);
  }, [snap, zoom, updateElement]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const widgetDataStr = e.dataTransfer.getData('screen/widget-instance');
    const varDataStr = e.dataTransfer.getData('screen/variable-ref');
    
    const pos = getCanvasPos(e);
    const sx = snap(pos.x);
    const sy = snap(pos.y);

    if (widgetDataStr) {
      try {
        const { objectId, widgetId } = JSON.parse(widgetDataStr);
        addWidgetInstance(objectId, widgetId, sx, sy);
      } catch (err) {
        console.error(err);
      }
    } else if (varDataStr) {
      try {
        const { objectId, propertyName } = JSON.parse(varDataStr);
        addVariableRef(objectId, propertyName, sx, sy);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleElementResize = useCallback((id: string, w: number, h: number, _x: number, _y: number) => {
    updateElement(id, { width: snap(w), height: snap(h) });
  }, [snap, updateElement]);

  const handleLinePointsChange = useCallback((id: string, fx: number, fy: number, tx: number, ty: number) => {
    updateElement(id, {
      fromX: fx,
      fromY: fy,
      toX: tx,
      toY: ty,
      x: Math.min(fx, tx),
      y: Math.min(fy, ty),
      width: Math.max(1, Math.abs(tx - fx)),
      height: Math.max(1, Math.abs(ty - fy)),
    });
  }, [updateElement]);



  if (!selectedScreen) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-950">
        <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-6">
          <Monitor className="w-10 h-10 text-slate-700" />
        </div>
        <h3 className="text-sm font-semibold text-slate-400">Nenhuma Tela Selecionada</h3>
        <p className="text-xs text-slate-600 mt-1 max-w-xs">
          Selecione ou crie uma tela na sidebar para começar a construir
        </p>
      </div>
    );
  }

  const tools = [
    { id: 'select', icon: MousePointer, label: 'Selecionar (V)', shortcut: 'V' },
    { id: 'rectangle', icon: Square, label: 'Retângulo (R)', shortcut: 'R' },
    { id: 'circle', icon: Circle, label: 'Círculo (C)', shortcut: 'C' },
    { id: 'text', icon: Type, label: 'Texto (T)', shortcut: 'T' },
    { id: 'line', icon: Minus, label: 'Linha (L)', shortcut: 'L' },
    { id: 'image', icon: ImageIcon, label: 'Imagem (I)', shortcut: 'I' },
  ] as const;

  const selectedElement = selectedScreen.elements.find((e) => e.id === selectedElementId);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-950 relative">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900 text-slate-800 dark:text-slate-100 shrink-0">
        {/* Left: Tools */}
        <div className="flex items-center gap-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id as any)}
              title={tool.label}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                activeTool === tool.id
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              <tool.icon className="w-3.5 h-3.5" />
            </button>
          ))}

          <div className="w-px h-5 bg-slate-300 dark:bg-slate-800 mx-1" />

          {/* Explorer Trigger Button */}
          <button
            onClick={() => setIsExplorerOpen(true)}
            title="Explorar Recursos (Widgets, Variáveis, Formas)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-violet-50 hover:bg-violet-100 dark:bg-violet-600/20 dark:hover:bg-violet-600/30 text-violet-600 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30 transition-colors"
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Explorer</span>
          </button>

          <div className="w-px h-5 bg-slate-300 dark:bg-slate-800 mx-1" />

          <button
            onClick={() => setIsGridEnabled(!isGridEnabled)}
            title="Grade de Referência"
            className={cn(
              'p-1.5 rounded-md transition-colors',
              isGridEnabled
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            )}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          <button onClick={() => setZoom(Math.max(0.25, zoom - 0.25))} title="Zoom Out" className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 w-10 text-center font-medium">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(Math.min(3, zoom + 0.25))} title="Zoom In" className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setZoom(1)} title="Resetar Zoom" className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Screen Name */}
        <div className="flex items-center gap-2">
          <Monitor className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{selectedScreen.name}</span>
          {hasUnsavedChanges && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
        </div>

        {/* Right: Element actions + Save */}
        <div className="flex items-center gap-1">
          {selectedElement && (
            <>
              <button onClick={() => reorderElementZ(selectedElementId!, 'up')} title="Trazer para Frente" className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800">
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => reorderElementZ(selectedElementId!, 'down')} title="Enviar para Trás" className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800">
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => duplicateElement(selectedElementId!)} title="Duplicar (Ctrl+D)" className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800">
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => deleteElement(selectedElementId!)} title="Excluir (Del)" className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-5 bg-slate-300 dark:bg-slate-800 mx-1" />
            </>
          )}
          <button
            onClick={saveCurrentScreen}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors',
              hasUnsavedChanges
                ? 'bg-violet-600 text-white hover:bg-violet-500 shadow-xs'
                : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600'
            )}
          >
            <Save className="w-3.5 h-3.5" />
            Salvar
          </button>
          <button
            onClick={saveAndCloseScreen}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Fechar
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto bg-slate-200 dark:bg-slate-950 p-6 flex items-center justify-center">
        <div
          style={{
            width: selectedScreen.canvasWidth * zoom,
            height: selectedScreen.canvasHeight * zoom,
            transformOrigin: 'center center',
          }}
          className="shadow-2xl border border-slate-300 dark:border-slate-800"
        >
          <div
            ref={canvasRef}
            className="relative select-none"
            style={{
              width: selectedScreen.canvasWidth,
              height: selectedScreen.canvasHeight,
              background: selectedScreen.backgroundColor,
              transform: `scale(${zoom})`,
              transformOrigin: '0 0',
              cursor: activeTool === 'select' ? 'default' : activeTool === 'line' && lineStart ? 'crosshair' : 'crosshair',
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {/* Grid */}
            {isGridEnabled && (
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ width: '100%', height: '100%', zIndex: 0 }}
              >
                <defs>
                  <pattern
                    id="screen-grid"
                    width={selectedScreen.gridSize}
                    height={selectedScreen.gridSize}
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d={`M ${selectedScreen.gridSize} 0 L 0 0 0 ${selectedScreen.gridSize}`}
                      fill="none"
                      stroke="rgba(100,116,139,0.15)"
                      strokeWidth="0.5"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#screen-grid)" />
              </svg>
            )}

            {/* Arrow marker definition */}
            <svg className="absolute inset-0 pointer-events-none" style={{ width: 0, height: 0 }}>
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#64748b" />
                </marker>
              </defs>
            </svg>

            {/* Line preview */}
            {activeTool === 'line' && lineStart && hoverPos && (
              <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%', zIndex: 9999 }}>
                <line
                  x1={lineStart.x} y1={lineStart.y}
                  x2={hoverPos.x} y2={hoverPos.y}
                  stroke="#7c3aed" strokeWidth="2" strokeDasharray="6 3" opacity="0.7"
                />
              </svg>
            )}

            {/* Elements */}
            {[...selectedScreen.elements]
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((el) => (
                <ElementRenderer
                  key={el.id}
                  element={el}
                  isSelected={selectedElementId === el.id}
                  simulatedValues={simulatedValues}
                  onSelect={selectElement}
                  onMove={handleElementMove}
                  onResize={handleElementResize}
                  zoom={zoom}
                  snap={snap}
                  onLinePointsChange={handleLinePointsChange}
                />
              ))}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="h-5 border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center justify-between px-3 text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
        <span>
          Canvas: {selectedScreen.canvasWidth}×{selectedScreen.canvasHeight}px
          · {selectedScreen.elements.length} elementos
        </span>
        {selectedElement && (
          <span>
            Selecionado: {selectedElement.name} · x:{Math.round(selectedElement.x)} y:{Math.round(selectedElement.y)} · {Math.round(selectedElement.width)}×{Math.round(selectedElement.height)}
          </span>
        )}
        <span>
          {activeTool === 'line' && lineStart ? '🔵 Clique para finalizar a linha' : `Ferramenta: ${activeTool}`}
        </span>
      </div>

      {/* Explorer Modal overlay */}
      {isExplorerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={() => setIsExplorerOpen(false)}
          />
          <div className="relative w-full max-w-xl h-[80vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Close button */}
            <button
              onClick={() => setIsExplorerOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors z-50"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex-1 overflow-hidden">
              <ScreenExplorerPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
