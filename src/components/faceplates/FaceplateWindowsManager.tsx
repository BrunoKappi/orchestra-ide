import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Minus,
  Tv,
  Bell,
  TrendingUp,
  Sliders,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useObjectModelStore } from '../../store/useObjectModelStore';
import { useWidgetStore } from '../../store/useWidgetStore';
import { resolveWidgetElementStyle, resolveWidgetElementText } from '../../utils/widgetDynamics';
import { cn } from '../../utils/cn';

interface OpenFaceplateWindow {
  id: string;
  objectId: string;
  faceplateId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  zIndex: number;
}

export const FaceplateWindowsManager: React.FC = () => {
  const {
    openFaceplates,
    closeFaceplate,
    toggleMinimizeFaceplate,
    updateFaceplatePosition,
    updateFaceplateSize,
    bringFaceplateToFront,
    objects,
    simulatedValues,
    updateSimulatedValue,
    alarmEvents,
    acknowledgeAlarms,
    historyValues
  } = useObjectModelStore();

  const { widgets } = useWidgetStore();

  const [activeTabs, setActiveTabs] = useState<Record<string, 'ihm' | 'params' | 'alarms' | 'trends'>>({});
  
  // Drag state
  const dragRef = useRef<{ winId: string; startX: number; startY: number; initX: number; initY: number } | null>(null);
  // Resize state
  const resizeRef = useRef<{ winId: string; startWidth: number; startHeight: number; startX: number; startY: number } | null>(null);

  // Set default tabs
  useEffect(() => {
    const nextTabs = { ...activeTabs };
    let changed = false;
    openFaceplates.forEach((w) => {
      if (!nextTabs[w.id]) {
        nextTabs[w.id] = 'ihm';
        changed = true;
      }
    });
    if (changed) setActiveTabs(nextTabs);
  }, [openFaceplates, activeTabs]);

  // Window drag handlers
  const handleHeaderMouseDown = (win: OpenFaceplateWindow, e: React.MouseEvent) => {
    e.preventDefault();
    bringFaceplateToFront(win.id);
    dragRef.current = {
      winId: win.id,
      startX: e.clientX,
      startY: e.clientY,
      initX: win.x,
      initY: win.y,
    };
    document.addEventListener('mousemove', handleDragMouseMove);
    document.addEventListener('mouseup', handleDragMouseUp);
  };

  const handleDragMouseMove = (e: MouseEvent) => {
    if (!dragRef.current) return;
    const { winId, startX, startY, initX, initY } = dragRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // Boundary constraints
    const nx = Math.max(0, Math.min(window.innerWidth - 150, initX + dx));
    const ny = Math.max(0, Math.min(window.innerHeight - 50, initY + dy));

    updateFaceplatePosition(winId, nx, ny);
  };

  const handleDragMouseUp = () => {
    dragRef.current = null;
    document.removeEventListener('mousemove', handleDragMouseMove);
    document.removeEventListener('mouseup', handleDragMouseUp);
  };

  // Window resize handlers
  const handleResizeMouseDown = (win: OpenFaceplateWindow, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    bringFaceplateToFront(win.id);
    resizeRef.current = {
      winId: win.id,
      startWidth: win.width,
      startHeight: win.height,
      startX: e.clientX,
      startY: e.clientY,
    };
    document.addEventListener('mousemove', handleResizeMouseMove);
    document.addEventListener('mouseup', handleResizeMouseUp);
  };

  const handleResizeMouseMove = (e: MouseEvent) => {
    if (!resizeRef.current) return;
    const { winId, startWidth, startHeight, startX, startY } = resizeRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const nw = Math.max(300, Math.min(1200, startWidth + dx));
    const nh = Math.max(250, Math.min(800, startHeight + dy));

    updateFaceplateSize(winId, nw, nh);
  };

  const handleResizeMouseUp = () => {
    resizeRef.current = null;
    document.removeEventListener('mousemove', handleResizeMouseMove);
    document.removeEventListener('mouseup', handleResizeMouseUp);
  };

  if (openFaceplates.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden select-none">
      {openFaceplates.map((win) => {
        const obj = objects.find((o) => o.id === win.objectId);
        const faceplateWidget = widgets.find((w) => w.id === win.faceplateId);

        if (!obj || !faceplateWidget) return null;

        const isMinimized = win.isMinimized;
        const currentTab = activeTabs[win.id] || 'ihm';

        // Resolve faceplate mapping variables
        // Mappings format inside widgets expects: { propId: { type: 'property', value: 'objectId:propName' } }
        // Object/template mappings contains: { propId: propName }
        const faceplateMappings = obj.faceplateMappings || {};

        const resolvedMappings: Record<string, { type: 'property' | 'fixed'; value: string }> = {};
        faceplateWidget.customProperties.forEach((cp) => {
          const mappedName = faceplateMappings[cp.id];
          if (mappedName) {
            resolvedMappings[cp.id] = {
              type: 'property',
              value: `${win.objectId}:${mappedName}`
            };
          } else {
            resolvedMappings[cp.id] = {
              type: 'fixed',
              value: cp.defaultValue
            };
          }
        });

        // Compute alarms count for this object
        const activeAlarmsCount = alarmEvents.filter(
          (evt) =>
            evt.objectId === win.objectId &&
            (evt.status === 'Active Unacknowledged' || evt.status === 'Active Acknowledged')
        ).length;

        // Command handler
        const handleCommandSubmit = (propName: string, val: string) => {
          updateSimulatedValue(`${win.objectId}:${propName}`, val);
        };

        // Render Trend Sparkline
        const renderSparkline = (propName: string) => {
          const key = `${win.objectId}:${propName}`;
          const history = historyValues[key] || [];
          if (history.length <= 1) return <span className="text-[10px] text-slate-500 italic">Colhendo dados...</span>;

          const min = Math.min(...history);
          const max = Math.max(...history);
          const range = max - min || 1;
          const w = 150;
          const h = 24;

          const points = history
            .map((val, idx) => {
              const x = (idx / (history.length - 1)) * w;
              const y = h - ((val - min) / range) * h;
              return `${x},${y}`;
            })
            .join(' ');

          return (
            <div className="flex items-center gap-2">
              <svg width={w} height={h} className="overflow-visible border-b border-slate-200 dark:border-slate-800">
                <polyline fill="none" stroke="#0ea5e9" strokeWidth="1.5" points={points} />
              </svg>
              <div className="text-[9px] font-mono text-slate-400 leading-none">
                <div>Max: {max.toFixed(1)}</div>
                <div className="mt-1">Min: {min.toFixed(1)}</div>
              </div>
            </div>
          );
        };

        return (
          <div
            key={win.id}
            style={{
              left: win.x,
              top: win.y,
              width: win.width,
              height: isMinimized ? 'auto' : win.height,
              zIndex: win.zIndex,
            }}
            onClick={() => bringFaceplateToFront(win.id)}
            className={cn(
              "absolute bg-white dark:bg-slate-900 border rounded-xl shadow-2xl flex flex-col pointer-events-auto border-slate-250 dark:border-slate-800",
              isMinimized ? "h-10 resize-none shadow-md overflow-hidden bg-slate-100 dark:bg-slate-950" : ""
            )}
          >
            {/* WINDOW HEADER */}
            <div
              onMouseDown={(e) => handleHeaderMouseDown(win, e)}
              className="h-10 px-3.5 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-850 flex items-center justify-between cursor-move rounded-t-xl shrink-0 text-slate-700 dark:text-slate-200 select-none font-semibold text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Tv className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="truncate max-w-[200px]" title={`${obj.name} Faceplate`}>
                  Faceplate: <strong className="text-slate-900 dark:text-white font-bold">{obj.name}</strong>
                </span>
                {activeAlarmsCount > 0 && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.2 text-[8px] font-bold bg-rose-500 text-white rounded shrink-0 animate-pulse">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    {activeAlarmsCount} ALARME
                  </span>
                )}
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-1.5 pointer-events-auto" onMouseDown={(e) => e.stopPropagation()}>
                <button
                  onClick={() => toggleMinimizeFaceplate(win.id)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                  title="Minimizar / Restaurar"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => closeFaceplate(win.id)}
                  className="p-1 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 rounded transition-colors text-slate-500"
                  title="Fechar"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* WINDOW BODY */}
            {!isMinimized && (
              <div className="flex-1 flex flex-col overflow-hidden text-xs">
                {/* Internal Tab switcher */}
                <div className="flex border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 px-2.5 py-1 text-[11px] shrink-0 font-medium">
                  <button
                    onClick={() => setActiveTabs({ ...activeTabs, [win.id]: 'ihm' })}
                    className={cn(
                      "flex items-center gap-1 py-1 px-2.5 border-b-2 transition-all font-semibold",
                      currentTab === 'ihm'
                        ? "border-sky-500 text-sky-600 dark:text-sky-400"
                        : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                    )}
                  >
                    <Tv className="w-3 h-3" />
                    <span>IHM</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTabs({ ...activeTabs, [win.id]: 'params' })}
                    className={cn(
                      "flex items-center gap-1 py-1 px-2.5 border-b-2 transition-all font-semibold",
                      currentTab === 'params'
                        ? "border-sky-500 text-sky-600 dark:text-sky-400"
                        : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                    )}
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Comandos</span>
                  </button>

                  <button
                    onClick={() => setActiveTabs({ ...activeTabs, [win.id]: 'alarms' })}
                    className={cn(
                      "flex items-center gap-1 py-1 px-2.5 border-b-2 transition-all font-semibold",
                      currentTab === 'alarms'
                        ? "border-sky-500 text-sky-600 dark:text-sky-400"
                        : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                    )}
                  >
                    <Bell className="w-3 h-3" />
                    <span>Alarmes ({activeAlarmsCount})</span>
                  </button>

                  <button
                    onClick={() => setActiveTabs({ ...activeTabs, [win.id]: 'trends' })}
                    className={cn(
                      "flex items-center gap-1 py-1 px-2.5 border-b-2 transition-all font-semibold",
                      currentTab === 'trends'
                        ? "border-sky-500 text-sky-600 dark:text-sky-400"
                        : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                    )}
                  >
                    <TrendingUp className="w-3 h-3" />
                    <span>Tendências</span>
                  </button>
                </div>

                {/* Tab content panel */}
                <div className="flex-1 overflow-auto p-4 bg-slate-50/30 dark:bg-slate-900/10">
                  {/* TAB 1: IHM CANVAS PREVIEW */}
                  {currentTab === 'ihm' && (
                    <div className="w-full h-full flex items-center justify-center bg-slate-950 rounded-lg overflow-hidden border border-slate-250 dark:border-slate-800/40 relative">
                      <div
                        style={{
                          width: faceplateWidget.canvasWidth,
                          height: faceplateWidget.canvasHeight,
                          background: faceplateWidget.backgroundColor,
                          transform: `scale(${Math.min(
                            (win.width - 40) / faceplateWidget.canvasWidth,
                            (win.height - 110) / faceplateWidget.canvasHeight
                          )})`,
                          transformOrigin: 'center center',
                        }}
                        className="relative shrink-0"
                      >
                        {faceplateWidget.elements.map((el) => {
                          const resolved = resolveWidgetElementStyle(
                            el,
                            resolvedMappings,
                            simulatedValues,
                            win.objectId
                          );
                          if (resolved.isHidden) return null;

                          const textContent = resolveWidgetElementText(
                            el,
                            faceplateWidget.customProperties,
                            resolvedMappings,
                            simulatedValues,
                            win.objectId
                          );

                          const elStyle: React.CSSProperties = {
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
                            transition: 'all 0.4s ease',
                          };

                          if (resolved.fillLevel) {
                            return (
                              <div key={el.id} style={{ ...elStyle, ...resolved.fillLevel.containerStyle, padding: 0, display: 'block' }}>
                                <div style={{ position: 'relative', width: '100%', height: '105%', overflow: 'hidden' }}>
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
                              <div key={el.id} style={{ ...elStyle, background: resolved.fill }}>
                                {el.imageUri ? (
                                  <img src={el.imageUri} alt="" className="w-full h-full object-contain" draggable={false} />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-slate-850 text-slate-500 text-[10px]">
                                    Sem imagem
                                  </div>
                                )}
                              </div>
                            );
                          }

                          return (
                            <div key={el.id} style={{ ...elStyle, background: resolved.fill }}>
                              {textContent}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: PARAMETERS & OPERATIONAL COMMANDS */}
                  {currentTab === 'params' && (
                    <div className="space-y-3">
                      <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 leading-snug">
                        Modifique os parâmetros operacionais abaixo para emitir comandos em tempo real ao equipamento.
                      </div>
                      
                      <div className="space-y-2">
                        {faceplateWidget.customProperties.map((cp) => {
                          const mappedPropName = faceplateMappings[cp.id];
                          if (!mappedPropName) {
                            return (
                              <div key={cp.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg flex items-center justify-between text-slate-400 italic">
                                <span>{cp.name}</span>
                                <span>Não mapeada</span>
                              </div>
                            );
                          }

                          const liveKey = `${win.objectId}:${mappedPropName}`;
                          const liveVal = simulatedValues[liveKey] ?? cp.defaultValue;

                          return (
                            <div key={cp.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div>
                                <span className="font-bold text-slate-700 dark:text-slate-250 block">{cp.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">Mapeado: {mappedPropName} ({cp.dataType})</span>
                              </div>

                              <div className="flex items-center gap-2">
                                {cp.dataType === 'Boolean' ? (
                                  <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-250 dark:border-slate-700">
                                    <button
                                      onClick={() => handleCommandSubmit(mappedPropName, 'true')}
                                      className={cn(
                                        "px-2.5 py-1 rounded-md text-[10px] font-bold transition-all",
                                        liveVal === 'true'
                                          ? "bg-emerald-500 text-white shadow-xs"
                                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                                      )}
                                    >
                                      LIGADO
                                    </button>
                                    <button
                                      onClick={() => handleCommandSubmit(mappedPropName, 'false')}
                                      className={cn(
                                        "px-2.5 py-1 rounded-md text-[10px] font-bold transition-all",
                                        liveVal === 'false'
                                          ? "bg-rose-500 text-white shadow-xs"
                                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                                      )}
                                    >
                                      DESLIGADO
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      defaultValue={liveVal}
                                      onBlur={(e) => handleCommandSubmit(mappedPropName, e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCommandSubmit(mappedPropName, (e.target as HTMLInputElement).value);
                                      }}
                                      className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded font-mono text-[11px] text-right outline-none focus:border-sky-500"
                                    />
                                    <span className="text-[10px] text-slate-400">cmd</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: ACTIVE ALARMS LIST */}
                  {currentTab === 'alarms' && (
                    <div className="space-y-2.5">
                      <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider pl-1">Alarmes Ativos no Equipamento</h4>
                      
                      <div className="space-y-2">
                        {alarmEvents
                          .filter(
                            (evt) =>
                              evt.objectId === win.objectId &&
                              evt.status !== 'Cleared Acknowledged'
                          )
                          .map((evt) => (
                            <div
                              key={evt.id}
                              style={{ borderLeftColor: evt.color || '#f43f5e' }}
                              className="p-3 bg-white dark:bg-slate-900 border border-l-4 border-slate-200 dark:border-slate-850 rounded-lg flex items-center justify-between text-xs gap-3 shadow-2xs"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800 dark:text-slate-250">{evt.propertyName}</span>
                                  <span className="px-1.5 py-0.1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-455 border border-rose-100 rounded text-[9px] font-semibold uppercase scale-90">
                                    {evt.severity}
                                  </span>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 mt-1 leading-snug">{evt.message}</p>
                                <span className="text-[9px] text-slate-400 block mt-1 font-mono">{evt.activatedAt}</span>
                              </div>

                              {evt.status.includes('Unacknowledged') && (
                                <button
                                  onClick={() => acknowledgeAlarms([evt.id])}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded font-semibold text-[10px]"
                                >
                                  Reconhecer
                                </button>
                              )}
                            </div>
                          ))}

                        {alarmEvents.filter(
                          (evt) =>
                            evt.objectId === win.objectId &&
                            evt.status !== 'Cleared Acknowledged'
                        ).length === 0 && (
                          <div className="p-8 text-center text-slate-400 italic bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl flex flex-col items-center justify-center gap-2">
                            <CheckCircle className="w-8 h-8 text-emerald-500" />
                            <span>Tudo normal. Nenhum alarme ativo.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: REAL-TIME TREND CHARTS */}
                  {currentTab === 'trends' && (
                    <div className="space-y-3.5">
                      <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider pl-1">Históricos Recentes (Sensores)</h4>
                      
                      <div className="space-y-2">
                        {faceplateWidget.customProperties
                          .filter((cp) => cp.dataType === 'Float' || cp.dataType === 'Integer')
                          .map((cp) => {
                            const mappedPropName = faceplateMappings[cp.id];
                            if (!mappedPropName) return null;

                            return (
                              <div key={cp.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg space-y-2.5">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <span className="font-bold text-slate-750 dark:text-slate-300 block">{cp.name}</span>
                                    <span className="text-[9px] text-slate-400 font-mono">Variável: {mappedPropName}</span>
                                  </div>
                                  <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                                    {simulatedValues[`${win.objectId}:${mappedPropName}`] || '0'}
                                  </span>
                                </div>

                                <div className="pt-1.5 border-t border-slate-100 dark:border-slate-850/60">
                                  {renderSparkline(mappedPropName)}
                                </div>
                              </div>
                            );
                          })}

                        {faceplateWidget.customProperties.filter((cp) => cp.dataType === 'Float' || cp.dataType === 'Integer').length === 0 && (
                          <div className="p-6 text-center text-slate-455 italic">
                            Nenhuma variável numérica neste faceplate para exibir gráficos de tendência.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Resize handle corner */}
            {!isMinimized && (
              <div
                onMouseDown={(e) => handleResizeMouseDown(win, e)}
                className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize pointer-events-auto"
                style={{
                  background: 'linear-gradient(135deg, transparent 40%, rgba(100,116,139,0.5) 40%)'
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
