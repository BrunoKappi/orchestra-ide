import React, { useEffect, useRef, useState } from 'react';
import {
  Save,
  X,
  CheckCircle,
  MousePointer,
  Square,
  Circle,
  Type,
  Lightbulb,
  Gauge,
  Container,
  Grid,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Variable,
  ChevronDown,
  Image as ImageIcon,
} from 'lucide-react';
import { useWidgetStore } from '../../store/useWidgetStore';
import type { WidgetElement, WidgetCustomProperty, WidgetBindingProperty } from '../../types/domain';
import { cn } from '../../utils/cn';

// Helper function to format and display variables on canvas
const getVariableDisplayText = (elem: WidgetElement, customProperties: WidgetCustomProperty[]) => {
  // Find textContent binding
  const binding = elem.bindings.find((b) => b.property === 'textContent' || b.property === 'value');
  if (!binding) {
    return elem.textContent || '###';
  }

  const prop = customProperties.find((p) => p.id === binding.customPropId);
  if (!prop) {
    return elem.textContent || '###';
  }

  // If no default value, show placeholder
  if (!prop.defaultValue && prop.defaultValue !== '0') {
    const labelPrefix = elem.showLabel !== false
      ? `${elem.customLabel || prop.name}: `
      : '';
    const unitSuffix = elem.showUnit && elem.unit ? ` ${elem.unit}` : '';
    return `${labelPrefix}###${unitSuffix}`;
  }

  // Get raw default value
  let valueStr = prop.defaultValue || '###';

  // Format numeric values
  if (prop.dataType === 'Float' || prop.dataType === 'Integer') {
    let val = parseFloat(prop.defaultValue);
    if (!isNaN(val)) {
      if (elem.conversionFactor !== undefined) {
        val = val * elem.conversionFactor;
      }
      const decimals = elem.decimalPlaces !== undefined ? elem.decimalPlaces : 2;
      valueStr = val.toFixed(decimals);
    }
  }

  // Label prefix
  let labelPrefix = '';
  if (elem.showLabel !== false) {
    const labelText = elem.customLabel !== undefined && elem.customLabel !== '' 
      ? elem.customLabel 
      : prop.name;
    if (labelText) {
      labelPrefix = `${labelText}: `;
    }
  }

  // Unit suffix
  let unitSuffix = '';
  if (elem.showUnit && elem.unit) {
    unitSuffix = ` ${elem.unit}`;
  }

  return `${labelPrefix}${valueStr}${unitSuffix}`;
};


// No canvas de DESIGN, as dinâmicas NÃO são avaliadas.
// Elas só serão aplicadas em runtime, quando o widget for associado
// a objetos reais com dados ao vivo. As funções abaixo são mantidas
// apenas para uso futuro pelo runtime engine.

// Helper function to evaluate dynamic SCADA bindings (fill, stroke, visibility, value)
const evaluateBinding = (
  elem: WidgetElement,
  property: WidgetBindingProperty,
  customProperties: WidgetCustomProperty[],
  defaultValue: any
): any => {
  const binding = elem.bindings.find((b) => b.property === property);
  if (!binding) return defaultValue;

  const prop = customProperties.find((p) => p.id === binding.customPropId);
  if (!prop) return defaultValue;

  if (property === 'value') {
    const val = parseFloat(prop.defaultValue);
    return isNaN(val) ? 0 : val;
  }

  return defaultValue;
};


export const WidgetCanvasEditor: React.FC = () => {
  const {
    selectedWidget,
    selectedElementId,
    activeTool,
    setActiveTool,
    isGridEnabled,
    setIsGridEnabled,
    snapToGrid,
    setSnapToGrid,
    zoom,
    setZoom,
    hasUnsavedChanges,
    saveCurrentWidget,
    closeWidget,
    selectElement,
    addElement,
    updateElement,
    deleteElement,
    duplicateElement,
    reorderElementZ,
    addImageElement,
  } = useWidgetStore();

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null); // 'se' | 'sw' | 'ne' | 'nw'
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isInsertOpen, setIsInsertOpen] = useState(false);

  const gridSize = selectedWidget?.gridSize || 10;

  const snap = (val: number): number => {
    if (!snapToGrid) return Math.round(val);
    return Math.round(val / gridSize) * gridSize;
  };

  const getCanvasCoordsFromClient = (clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const rawX = (clientX - rect.left) / (zoom / 100);
    const rawY = (clientY - rect.top) / (zoom / 100);
    return { x: snap(rawX), y: snap(rawY) };
  };

  // GLOBAL POINTER LISTENERS for Drag and Resize
  useEffect(() => {
    if (!selectedWidget || !selectedElementId) return;
    const selectedElement = selectedWidget.elements.find((e) => e.id === selectedElementId);
    if (!selectedElement) return;

    const handleGlobalPointerMove = (e: PointerEvent) => {
      const coords = getCanvasCoordsFromClient(e.clientX, e.clientY);

      if (isDragging) {
        const newX = Math.max(0, coords.x - dragOffset.x);
        const newY = Math.max(0, coords.y - dragOffset.y);
        updateElement(selectedElementId, { x: newX, y: newY });
      } else if (isResizing) {
        let newW = selectedElement.width;
        let newH = selectedElement.height;
        if (isResizing.includes('e')) {
          newW = Math.max(20, coords.x - selectedElement.x);
        }
        if (isResizing.includes('s')) {
          newH = Math.max(20, coords.y - selectedElement.y);
        }
        updateElement(selectedElementId, { width: newW, height: newH });
      }
    };

    const handleGlobalPointerUp = () => {
      if (isDragging || isResizing) {
        setIsDragging(false);
        setIsResizing(null);
      }
    };

    if (isDragging || isResizing) {
      window.addEventListener('pointermove', handleGlobalPointerMove);
      window.addEventListener('pointerup', handleGlobalPointerUp);
      window.addEventListener('mouseup', handleGlobalPointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('mouseup', handleGlobalPointerUp);
    };
  }, [isDragging, isResizing, selectedElementId, selectedWidget, dragOffset, zoom, snapToGrid, gridSize]);

  // Keyboard shortcut to delete or move shapes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElementId || !selectedWidget) return;
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
        return; // Avoid deleting or moving while typing
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteElement(selectedElementId);
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const selectedElement = selectedWidget.elements.find((el) => el.id === selectedElementId);
        if (!selectedElement) return;

        let newX = selectedElement.x;
        let newY = selectedElement.y;
        let step = e.shiftKey ? 10 : 1;
        if (snapToGrid) {
          step = e.shiftKey ? gridSize * 10 : gridSize;
        }

        if (e.key === 'ArrowUp') newY = Math.max(0, selectedElement.y - step);
        if (e.key === 'ArrowDown') newY = selectedElement.y + step;
        if (e.key === 'ArrowLeft') newX = Math.max(0, selectedElement.x - step);
        if (e.key === 'ArrowRight') newX = selectedElement.x + step;

        updateElement(selectedElementId, { x: newX, y: newY });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElementId, deleteElement, selectedWidget, updateElement, snapToGrid, gridSize]);

  // Clipboard Paste Event to allow pasting images directly
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (!selectedWidget) return;
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
        return;
      }
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result as string;
              addImageElement(base64, 50, 50);
            };
            reader.readAsDataURL(file);
            e.preventDefault();
          }
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => {
      window.removeEventListener('paste', handleGlobalPaste);
    };
  }, [selectedWidget, addImageElement]);

  if (!selectedWidget) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-100/50 dark:bg-slate-950 text-slate-400 p-8 select-none">
        <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-600 mb-4 shadow-inner">
          <Container className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Nenhum Widget Gráfico Selecionado
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-500 text-center max-w-sm">
          Selecione ou crie um componente na estrutura de pastas da barra lateral para abrir a central de edição vetorial InTouch.
        </p>
      </div>
    );
  }

  const { canvasWidth, canvasHeight, backgroundColor, elements } = selectedWidget;
  const selectedElement = elements.find((e) => e.id === selectedElementId);

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const target = e.target as SVGElement;
    const isBackground =
      target === svgRef.current ||
      target.getAttribute('data-canvas-bg') === 'true';

    if (activeTool !== 'select' && activeTool !== 'image') {
      const coords = getCanvasCoordsFromClient(e.clientX, e.clientY);
      addElement(activeTool, coords.x, coords.y);
    } else {
      if (isBackground) {
        selectElement(null);
      }
    }
  };

  const handleMouseDownElement = (e: React.MouseEvent, elem: WidgetElement) => {
    if (activeTool !== 'select') {
      return;
    }
    e.stopPropagation();
    selectElement(elem.id);
    setIsDragging(true);
    const coords = getCanvasCoordsFromClient(e.clientX, e.clientY);
    setDragOffset({
      x: coords.x - elem.x,
      y: coords.y - elem.y,
    });
  };

  // Image Upload handler
  const handleImageUploadClick = () => {
    setIsInsertOpen(false);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png, image/jpeg, image/gif, image/svg+xml';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          const base64 = readerEvent.target?.result as string;
          addImageElement(base64, 50, 50);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-slate-200/60 dark:bg-slate-950 select-none">
      {/* Top Action Bar */}
      <div className="h-12 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shrink-0 shadow-xs z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
              {selectedWidget.name}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({canvasWidth}x{canvasHeight}px)
            </span>
          </div>

          {hasUnsavedChanges ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
              Alterações Pendentes
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Salvo
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={saveCurrentWidget}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            title="Salvar alterações"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar</span>
          </button>

          <button
            onClick={() => {
              if (hasUnsavedChanges) {
                const confirmed = window.confirm(
                  'Existem alterações não salvas. Deseja fechar sem salvar?'
                );
                if (!confirmed) return;
              }
              closeWidget();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
            title="Fechar widget"
          >
            <X className="w-3.5 h-3.5" />
            <span>Fechar</span>
          </button>
        </div>

      </div>

      {/* Sub Toolbar */}
      <div className="h-10 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shrink-0 text-xs">
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 relative">
          <ToolButton
            active={activeTool === 'select'}
            onClick={() => {
              setActiveTool('select');
              setIsInsertOpen(false);
            }}
            icon={<MousePointer className="w-3.5 h-3.5" />}
            label="Seleção"
          />
          
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 my-auto" />
          
          <div className="relative">
            <button
              onClick={() => setIsInsertOpen(!isInsertOpen)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-semibold text-xs',
                activeTool !== 'select'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
              )}
            >
              <span>{activeTool === 'select' ? '+ Inserir Elemento' : `Ferramenta: ${activeTool}`}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {isInsertOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsInsertOpen(false)} />
                <div className="absolute left-0 mt-1.5 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-1 z-30 text-[11px] animate-in fade-in slide-in-from-top-1 duration-100">
                  <button
                    onClick={() => { setActiveTool('rectangle'); setIsInsertOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                  >
                    <Square className="w-3.5 h-3.5 text-slate-400" />
                    <span>Retângulo</span>
                  </button>
                  <button
                    onClick={() => { setActiveTool('circle'); setIsInsertOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                  >
                    <Circle className="w-3.5 h-3.5 text-slate-400" />
                    <span>Círculo</span>
                  </button>
                  <button
                    onClick={() => { setActiveTool('text'); setIsInsertOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                  >
                    <Type className="w-3.5 h-3.5 text-slate-400" />
                    <span>Texto</span>
                  </button>
                  <button
                    onClick={() => { setActiveTool('variable_display'); setIsInsertOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-cyan-600 dark:text-cyan-400"
                  >
                    <Variable className="w-3.5 h-3.5" />
                    <span>Display Variável</span>
                  </button>
                  <button
                    onClick={() => { setActiveTool('status_light'); setIsInsertOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-amber-500"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Lâmpada LED</span>
                  </button>
                  <button
                    onClick={() => { setActiveTool('tank'); setIsInsertOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sky-500"
                  >
                    <Container className="w-3.5 h-3.5" />
                    <span>Tanque</span>
                  </button>
                  <button
                    onClick={() => { setActiveTool('gauge'); setIsInsertOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-emerald-500"
                  >
                    <Gauge className="w-3.5 h-3.5" />
                    <span>Manômetro</span>
                  </button>
                  
                  <div className="my-1 border-t border-slate-150 dark:border-slate-800" />
                  
                  <button
                    onClick={handleImageUploadClick}
                    className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-indigo-650 dark:text-indigo-400"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Importar Imagem</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {selectedElement && (
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 truncate max-w-[120px]">
              {selectedElement.name}
            </span>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 my-auto" />

            <button
              onClick={() => duplicateElement(selectedElement.id)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400"
              title="Duplicar"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => reorderElementZ(selectedElement.id, 'up')}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400"
              title="Frente"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => reorderElementZ(selectedElement.id, 'down')}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400"
              title="Trás"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => deleteElement(selectedElement.id)}
              className="p-1 hover:bg-red-50 dark:hover:bg-red-950/50 rounded text-red-600 dark:text-red-400"
              title="Excluir (Delete)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsGridEnabled(!isGridEnabled)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition-colors',
                isGridEnabled
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
              )}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Grade</span>
            </button>

            <button
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={cn(
                'px-2 py-1 rounded-md text-[11px] font-medium border transition-colors',
                snapToGrid
                  ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
              )}
              title="Snap à Grade: Encaixa elementos automaticamente nos pontos da grade ao mover ou redimensionar"
            >
              Snap à Grade
            </button>
          </div>

          <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 my-auto" />

          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
              title="Reduzir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <span className="w-12 text-center text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
              {zoom}%
            </span>

            <button
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setZoom(100)}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
              title="Resetar Zoom"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Scroll Area */}
      <div className="flex-1 overflow-auto p-12 flex items-center justify-center relative cursor-crosshair">
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center center',
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
          }}
          className="relative shadow-2xl rounded-lg border-2 border-slate-300 dark:border-slate-700 transition-transform duration-75 shrink-0"
        >
          <svg
            ref={svgRef}
            width={canvasWidth}
            height={canvasHeight}
            onClick={handleCanvasClick}
            className="w-full h-full rounded-md overflow-hidden block"
            style={{ backgroundColor: backgroundColor || '#0f172a' }}
          >
            <defs>
              {isGridEnabled && (
                <pattern
                  id="canvas-grid"
                  width={gridSize}
                  height={gridSize}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-slate-400/20 dark:text-slate-700/40"
                  />
                </pattern>
              )}
              {sortedElements.map((elem) => {
                const hasValueBinding = elem.bindings.some((b) => b.property === 'value') && (elem.type === 'rectangle' || elem.type === 'circle');
                if (!hasValueBinding) return null;

                const levelVal = evaluateBinding(elem, 'value', selectedWidget.customProperties, 50);
                const pct = Math.min(100, Math.max(0, levelVal));
                // In design mode use static fill color
                const gradFill = elem.fill;

                return (
                  <linearGradient id={`grad-level-${elem.id}`} key={`grad-${elem.id}`} x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor={gradFill === 'transparent' ? 'rgba(0,0,0,0)' : gradFill} stopOpacity="1" />
                    <stop offset={`${pct}%`} stopColor={gradFill === 'transparent' ? 'rgba(0,0,0,0)' : gradFill} stopOpacity="1" />
                    <stop offset={`${pct}%`} stopColor={gradFill === 'transparent' ? 'rgba(0,0,0,0)' : gradFill} stopOpacity="0.15" />
                    <stop offset="100%" stopColor={gradFill === 'transparent' ? 'rgba(0,0,0,0)' : gradFill} stopOpacity="0.15" />
                  </linearGradient>
                );
              })}

            </defs>

            {isGridEnabled && (
              <rect data-canvas-bg="true" width="100%" height="100%" fill="url(#canvas-grid)" />
            )}
            {!isGridEnabled && (
              <rect data-canvas-bg="true" width="100%" height="100%" fill="transparent" />
            )}

            {sortedElements.map((elem) => {
              const isSelected = selectedElementId === elem.id;
              // In design mode, always show elements as visible (dynamics applied only in runtime)
              const visibility = 'visible';

              return (
                <g 
                  key={elem.id} 
                  onMouseDown={(e) => handleMouseDownElement(e, elem)}
                  style={{ visibility: visibility as any }}
                >
                  {elem.type === 'rectangle' && (() => {
                    const hasValueBinding = elem.bindings.some((b) => b.property === 'value');
                    // In design mode: always use static fill/stroke, ignore dynamics
                    const finalFill = hasValueBinding ? `url(#grad-level-${elem.id})` : elem.fill;
                    const finalStroke = elem.stroke;
                    return (
                      <rect
                        x={elem.x}
                        y={elem.y}
                        width={elem.width}
                        height={elem.height}
                        fill={finalFill}
                        stroke={finalStroke}
                        strokeWidth={elem.strokeWidth}
                        rx={elem.cornerRadius || 0}
                        ry={elem.cornerRadius || 0}
                        strokeDasharray={elem.strokeStyle === 'dashed' ? '6,3' : elem.strokeStyle === 'dotted' ? '2,2' : undefined}
                      />
                    );
                  })()}

                  {elem.type === 'circle' && (() => {
                    const hasValueBinding = elem.bindings.some((b) => b.property === 'value');
                    // In design mode: always use static fill/stroke, ignore dynamics
                    const finalFill = hasValueBinding ? `url(#grad-level-${elem.id})` : elem.fill;
                    const finalStroke = elem.stroke;
                    return (
                      <ellipse
                        cx={elem.x + elem.width / 2}
                        cy={elem.y + elem.height / 2}
                        rx={elem.width / 2}
                        ry={elem.height / 2}
                        fill={finalFill}
                        stroke={finalStroke}
                        strokeWidth={elem.strokeWidth}
                        strokeDasharray={elem.strokeStyle === 'dashed' ? '6,3' : elem.strokeStyle === 'dotted' ? '2,2' : undefined}
                      />
                    );
                  })()}

                  {elem.type === 'text' && (() => {
                    const finalTextColor = evaluateBinding(elem, 'textColor' as any, selectedWidget.customProperties, elem.textColor || '#ffffff');
                    const evaluatedText = evaluateBinding(elem, 'textContent', selectedWidget.customProperties, elem.textContent || 'Text Label');
                    return (
                      <text
                        x={elem.x + (elem.textAlignment === 'center' ? elem.width / 2 : elem.textAlignment === 'right' ? elem.width : 0)}
                        y={elem.y + elem.height / 1.4}
                        fill={finalTextColor}
                        fontSize={elem.fontSize || 14}
                        fontWeight="600"
                        fontFamily="sans-serif"
                        textAnchor={elem.textAlignment === 'center' ? 'middle' : elem.textAlignment === 'right' ? 'end' : 'start'}
                      >
                        {evaluatedText}
                      </text>
                    );
                  })()}

                  {elem.type === 'variable_display' && (() => {
                    // In design mode: always use static fill/stroke, ignore dynamics
                    const finalFill = elem.fill || '#0f172a';
                    const finalStroke = elem.stroke || '#0ea5e9';
                    const finalTextColor = elem.textColor || '#38bdf8';
                    return (
                      <g>
                        <rect
                          x={elem.x}
                          y={elem.y}
                          width={elem.width}
                          height={elem.height}
                          fill={finalFill}
                          stroke={finalStroke}
                          strokeWidth={elem.strokeWidth || 1.5}
                          rx={elem.cornerRadius || 6}
                          ry={elem.cornerRadius || 6}
                          strokeDasharray={elem.strokeStyle === 'dashed' ? '6,3' : elem.strokeStyle === 'dotted' ? '2,2' : undefined}
                        />
                        <text
                          x={elem.x + elem.width / 2}
                          y={elem.y + elem.height / 1.6}
                          fill={finalTextColor}
                          fontSize={elem.fontSize || 13}
                          fontWeight="bold"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {getVariableDisplayText(elem, selectedWidget.customProperties)}
                        </text>
                      </g>
                    );
                  })()}

                  {elem.type === 'status_light' && (() => {
                    // In design mode: always use static fill/stroke, ignore dynamics
                    const finalFill = elem.fill || '#22c55e';
                    const finalStroke = elem.stroke || '#38bdf8';
                    return (
                      <g>
                        <circle
                          cx={elem.x + elem.width / 2}
                          cy={elem.y + elem.height / 2}
                          r={Math.min(elem.width, elem.height) / 2}
                          fill="#1e293b"
                          stroke={finalStroke}
                          strokeWidth={elem.strokeWidth || 2}
                          strokeDasharray={elem.strokeStyle === 'dashed' ? '6,3' : elem.strokeStyle === 'dotted' ? '2,2' : undefined}
                        />
                        <circle
                          cx={elem.x + elem.width / 2}
                          cy={elem.y + elem.height / 2}
                          r={Math.min(elem.width, elem.height) / 2.6}
                          fill={finalFill}
                        />
                      </g>
                    );
                  })()}

                  {elem.type === 'tank' && (() => {
                    // In design mode: always use static fill/stroke, ignore dynamics
                    const finalFill = elem.fill || '#1e293b';
                    const finalStroke = elem.stroke || '#0284c7';
                    const levelVal = evaluateBinding(elem, 'value', selectedWidget.customProperties, 75);
                    const pct = Math.min(100, Math.max(0, levelVal));
                    const fillHeight = (elem.height * 0.7 - 6) * (pct / 100);
                    const fillY = elem.y + elem.height * 0.3 + (elem.height * 0.7 - 6) - fillHeight;
                    return (
                      <g>
                        <rect
                          x={elem.x}
                          y={elem.y}
                          width={elem.width}
                          height={elem.height}
                          fill={finalFill}
                          stroke={finalStroke}
                          strokeWidth={elem.strokeWidth || 2}
                          rx={12}
                          ry={12}
                          strokeDasharray={elem.strokeStyle === 'dashed' ? '6,3' : elem.strokeStyle === 'dotted' ? '2,2' : undefined}
                        />
                        <rect
                          x={elem.x + 6}
                          y={fillY}
                          width={elem.width - 12}
                          height={fillHeight}
                          fill={finalStroke}
                          opacity="0.8"
                          rx={6}
                          ry={6}
                        />
                        <text
                          x={elem.x + elem.width / 2}
                          y={elem.y + elem.height / 2}
                          fill="#ffffff"
                          fontSize={13}
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {Math.round(pct)}%
                        </text>
                      </g>
                    );
                  })()}

                  {elem.type === 'gauge' && (() => {
                    // In design mode: always use static fill/stroke, ignore dynamics
                    const finalFill = elem.fill || '#1e293b';
                    const finalStroke = elem.stroke || '#f59e0b';
                    const levelVal = evaluateBinding(elem, 'value', selectedWidget.customProperties, 45);
                    const pct = Math.min(100, Math.max(0, levelVal));
                    const angle = -135 + (pct / 100) * 270;
                    const cx = elem.x + elem.width / 2;
                    const cy = elem.y + elem.height / 2;
                    return (
                      <g>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={Math.min(elem.width, elem.height) / 2 - 4}
                          fill={finalFill}
                          stroke={finalStroke}
                          strokeWidth={elem.strokeWidth || 3}
                          strokeDasharray={elem.strokeStyle === 'dashed' ? '6,3' : elem.strokeStyle === 'dotted' ? '2,2' : undefined}
                        />
                        <line
                          x1={cx}
                          y1={cy}
                          x2={cx + elem.width / 3.5}
                          y2={cy - elem.height / 3.5}
                          stroke="#ef4444"
                          strokeWidth={3}
                          transform={`rotate(${angle}, ${cx}, ${cy})`}
                        />
                        <circle
                          cx={cx}
                          cy={cy}
                          r={5}
                          fill={finalStroke}
                        />
                      </g>
                    );
                  })()}

                  {elem.type === 'image' && elem.imageUri && (
                    <image
                      href={elem.imageUri}
                      x={elem.x}
                      y={elem.y}
                      width={elem.width}
                      height={elem.height}
                      preserveAspectRatio="none"
                    />
                  )}

                  {isSelected && (
                    <g>
                      <rect
                        x={elem.x - 2}
                        y={elem.y - 2}
                        width={elem.width + 4}
                        height={elem.height + 4}
                        fill="none"
                        stroke="#0ea5e9"
                        strokeWidth={1.5}
                        strokeDasharray="4,4"
                      />
                      <rect
                        x={elem.x + elem.width - 4}
                        y={elem.y + elem.height - 4}
                        width={8}
                        height={8}
                        fill="#0ea5e9"
                        stroke="#ffffff"
                        strokeWidth={1}
                        className="cursor-se-resize"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setIsResizing('se');
                        }}
                      />
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};

interface ToolButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const ToolButton: React.FC<ToolButtonProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium',
      active
        ? 'bg-emerald-655 text-emerald-600 dark:text-emerald-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
    )}
    title={label}
  >
    {icon}
    <span>{label}</span>
  </button>
);
