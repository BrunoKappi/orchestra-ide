import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Play, Pause, RefreshCw, Plus, Trash2, 
  Maximize2, Minimize2, Tv, LayoutGrid, Filter, Activity, Cpu
} from 'lucide-react';
import { useObjectModelStore } from '../store/useObjectModelStore';
import { useOmmStore } from '../features/omm/store/useOmmStore';
import { useKpiStore } from '../store/useKpiStore';
import type { KpiWidget, CustomKpi } from '../store/useKpiStore';
import { HeaderNavigation } from '../components/navigation/HeaderNavigation';
import { Modal } from '../components/ui/Modal';

// Predefined metric options for visual editor
const PREDEFINED_METRICS = [
  { value: 'prod_total', label: 'Produção Total (m³)' },
  { value: 'prod_hour', label: 'Produção por Hora (m³/h)' },
  { value: 'vol_mov', label: 'Volume Movimentado (m³)' },
  { value: 'massa_mov', label: 'Massa Movimentada (ton)' },
  { value: 'active_orders', label: 'Número de Ordens Ativas' },
  { value: 'active_movements', label: 'Número de Movimentos Ativos' },
  { value: 'active_alarms', label: 'Alarmes Ativos' },
  { value: 'critical_alarms', label: 'Alarmes Críticos' },
  { value: 'avg_accuracy', label: 'Acurácia Média (%)' },
  { value: 'tank_occupancy', label: 'Ocupação Média dos Tanques (%)' },
  { value: 'oee', label: 'Eficiência Operacional - OEE (%)' },
  { value: 'energy_consumption', label: 'Consumo Simulado de Energia (kWh)' },
];

export const KpiDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Stores
  const { theme, simulatedValues, objects, alarmEvents, isSimulating, toggleSimulation } = useObjectModelStore();
  const ommStore = useOmmStore();
  
  const { 
    widgets, 
    customKpis, 
    filters, 
    isTvMode, 
    addWidget, 
    removeWidget, 
    updateWidgetLayout, 
    resetLayout, 
    setFilter, 
    addCustomKpi, 
    setTvMode 
  } = useKpiStore();

  // Component UI States
  const [fullscreenWidgetId, setFullscreenWidgetId] = useState<string | null>(null);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  const [isCustomKpiOpen, setIsCustomKpiOpen] = useState(false);
  
  // Custom KPI Visual Editor States
  const [customKpiName, setCustomKpiName] = useState('');
  const [customKpiDesc, setCustomKpiDesc] = useState('');
  const [selectedVar1, setSelectedVar1] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('+');
  const [selectedVar2, setSelectedVar2] = useState('');
  const [selectedAgg, setSelectedAgg] = useState('AVG');

  // Drag and Drop implementation states
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const widgetStartLayout = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-refresh tick counter to force-update charts / indicators
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Extract OMM context & data
  const ommMovements = ommStore.movements || [];
  const ommOrders = ommStore.orders || [];
  const ommAlarms = ommStore.alarms || [];
  const ommOperators = ommStore.operators || [];
  const ommEquipments = ommStore.equipments || [];
  const ommProducts = ommStore.products || [];
  const ommAreas = ommStore.areas || [];
  const cutoffSnapshots = ommStore.cutoffSnapshots || [];

  // Filter evaluations
  const activeFilters = {
    period: filters.period,
    areaId: filters.areaId,
    productId: filters.productId,
    equipmentId: filters.equipmentId,
    operatorId: filters.operatorId,
  };

  const filteredMovements = ommMovements.filter((m) => {
    if (activeFilters.productId !== 'all' && m.productId !== activeFilters.productId) return false;
    if (activeFilters.areaId !== 'all' && m.areaId !== activeFilters.areaId) return false;
    if (activeFilters.operatorId !== 'all' && m.operatorId !== activeFilters.operatorId) return false;
    if (activeFilters.equipmentId !== 'all' && m.originId !== activeFilters.equipmentId && m.destinationId !== activeFilters.equipmentId) return false;
    return true;
  });

  const completedMovements = filteredMovements.filter((m) => m.status === 'Completed' || m.status === 'Closed');
  const activeMovements = filteredMovements.filter((m) => m.status === 'Active');

  // Compute 22+ standard KPIs
  const computeKpiValue = (key: string): number | string => {
    switch (key) {
      case 'prod_total':
        return completedMovements.reduce((sum, m) => sum + (m.currentVolume || 0), 0).toFixed(1);
      
      case 'prod_hour': {
        const total = completedMovements.reduce((sum, m) => sum + (m.currentVolume || 0), 0);
        const hours = isSimulating ? 1.2 : 1.0;
        return (total / hours).toFixed(1);
      }
      
      case 'vol_mov':
        return filteredMovements.reduce((sum, m) => sum + (m.currentVolume || 0), 0).toFixed(1);
      
      case 'massa_mov':
        return filteredMovements.reduce((sum, m) => sum + (m.currentMass || 0), 0).toFixed(1);
      
      case 'active_orders':
        return ommOrders.filter((o) => o.status === 'Active').length;
      
      case 'active_movements':
        return activeMovements.length;
      
      case 'active_alarms': {
        const activeIDE = (alarmEvents || []).filter((a) => a.status.startsWith('Active')).length;
        const activeOMM = ommAlarms.filter((a) => a.isActive && !a.acknowledged).length;
        return activeIDE + activeOMM;
      }

      case 'critical_alarms': {
        const critIDE = (alarmEvents || []).filter((a) => a.status.startsWith('Active') && a.severity === 'critical').length;
        const critOMM = ommAlarms.filter((a) => a.isActive && a.severity === 'Critical').length;
        return critIDE + critOMM;
      }

      case 'acknowledged_alarms': {
        const ackIDE = (alarmEvents || []).filter((a) => a.acknowledgedAt !== null).length;
        const ackOMM = ommAlarms.filter((a) => a.acknowledged).length;
        return ackIDE + ackOMM;
      }

      case 'avg_accuracy': {
        if (filteredMovements.length === 0) return '99.5';
        const sum = filteredMovements.reduce((acc, m) => acc + (m.accuracy || 100), 0);
        return (sum / filteredMovements.length).toFixed(1);
      }

      case 'avg_movement_time': {
        if (completedMovements.length === 0) return '14.5 min';
        const times = completedMovements.map((m) => {
          const start = new Date(m.activatedAt || '').getTime();
          const end = new Date(m.completedAt || '').getTime();
          return isNaN(start) || isNaN(end) ? 15 : (end - start) / 60000;
        });
        const avg = times.reduce((s, t) => s + t, 0) / times.length;
        return `${avg.toFixed(1)} min`;
      }

      case 'oee': {
        // OEE = Availability * Performance * Quality
        const avail = ommEquipments.length > 0 
          ? (ommEquipments.filter(e => e.isActive || e.isSending || e.isReceiving).length / ommEquipments.length) * 100
          : 95;
        const quality = parseFloat(computeKpiValue('avg_accuracy') as string);
        return ((avail * 92 * quality) / 10000).toFixed(1);
      }

      case 'availability': {
        if (ommEquipments.length === 0) return '94.2';
        const avail = (ommEquipments.filter(e => e.isActive).length / ommEquipments.length) * 100;
        return avail.toFixed(1);
      }

      case 'utilization': {
        if (ommEquipments.length === 0) return '68.5';
        const activeCount = ommEquipments.filter(e => e.isSending || e.isReceiving).length;
        return ((activeCount / ommEquipments.length) * 100).toFixed(1);
      }

      case 'tank_occupancy': {
        // Average Level of Tank objects
        const tankObjects = objects.filter((obj) => obj.name.toLowerCase().includes('tank') || obj.description.toLowerCase().includes('tank'));
        if (tankObjects.length === 0) return '42.8';
        let sum = 0;
        let count = 0;
        tankObjects.forEach((obj) => {
          const val = simulatedValues[`${obj.id}:Level`] || simulatedValues[`${obj.id}:Nivel`] || '0.0';
          const num = parseFloat(val);
          if (!isNaN(num)) {
            sum += num;
            count++;
          }
        });
        return count > 0 ? (sum / count).toFixed(1) : '42.8';
      }

      case 'energy_consumption': {
        // Baseline 450 kWh + simulated ticks * 12 kWh per active movement
        const base = 485;
        const activePower = activeMovements.length * 15.5;
        return (base + activePower + Math.sin(Date.now() / 10000) * 10).toFixed(1);
      }

      case 'wip_products':
        return activeMovements.length > 0 
          ? new Set(activeMovements.map(m => m.productId)).size 
          : 0;

      case 'completed_today':
        return completedMovements.length;

      case 'cutoffs_count':
        return cutoffSnapshots.length;

      case 'connected_users':
        return ommOperators.filter(o => o.isOnline).length;

      case 'sim_integrity':
        return isSimulating ? '99.9%' : '0.0% (Offline)';

      default: {
        // Check for Custom KPI
        const custom = customKpis.find(c => c.id === key);
        if (custom) {
          return evaluateCustomKpi(custom);
        }
        return '0.0';
      }
    }
  };

  // Safe Math & Expression Evaluator for Custom KPIs
  const evaluateCustomKpi = (kpi: CustomKpi): string => {
    try {
      let expr = kpi.expression;
      kpi.variables.forEach((v) => {
        const val = simulatedValues[v.path] || computeKpiValue(v.path).toString();
        const numVal = parseFloat(val) || 0;
        // Replace label cleanly
        expr = expr.replace(new RegExp(v.label, 'g'), numVal.toString());
      });
      // Basic math operations evaluator (safe regex only allowing arithmetic symbols and floats)
      if (/^[0-9.+\-*/()\s]+$/.test(expr)) {
        const res = Function(`"use strict"; return (${expr})`)();
        return typeof res === 'number' && !isNaN(res) ? res.toFixed(2) : '0.00';
      }
      return 'N/A';
    } catch {
      return 'Error';
    }
  };

  // Visual widget addition handler
  const handleAddWidget = (type: KpiWidget['type'], key: string, name: string) => {
    addWidget(type, key, name);
    setIsAddWidgetOpen(false);
  };

  // Custom KPI submission
  const handleSaveCustomKpi = () => {
    if (!customKpiName) return;
    
    // Variables mapping
    const v1Label = 'V1';
    const v2Label = 'V2';
    
    const variables = [
      { label: v1Label, path: selectedVar1 },
    ];
    let expression = v1Label;
    
    if (selectedVar2) {
      variables.push({ label: v2Label, path: selectedVar2 });
      expression = `(${v1Label} ${selectedOperator} ${v2Label})`;
    }

    if (selectedAgg && selectedAgg !== 'NONE') {
      expression = `${selectedAgg}(${expression})`;
    }

    addCustomKpi({
      name: customKpiName,
      description: customKpiDesc || `Custom KPI of ${selectedVar1}`,
      formula: `${selectedAgg !== 'NONE' ? selectedAgg + '(' : ''}${selectedVar1}${selectedVar2 ? ' ' + selectedOperator + ' ' + selectedVar2 : ''}${selectedAgg !== 'NONE' ? ')' : ''}`,
      variables,
      expression: selectedVar2 ? `(${v1Label} ${selectedOperator} ${v2Label})` : v1Label, // Keep clean mathematical operations
    });

    // Reset Visual Fields
    setCustomKpiName('');
    setCustomKpiDesc('');
    setSelectedVar1('');
    setSelectedVar2('');
    setIsCustomKpiOpen(false);
  };

  // Drag-and-drop mechanics
  const handleMouseDown = (id: string, e: React.MouseEvent, type: 'drag' | 'resize') => {
    if (isTvMode) return;
    e.stopPropagation();
    
    const widget = widgets.find((w) => w.id === id);
    if (!widget) return;

    if (type === 'drag') {
      setDraggingId(id);
    } else {
      setResizingId(id);
    }

    dragStartPos.current = { x: e.clientX, y: e.clientY };
    widgetStartLayout.current = { x: widget.x, y: widget.y, w: widget.w, h: widget.h };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId && !resizingId) return;

    const deltaX = e.clientX - dragStartPos.current.x;
    const deltaY = e.clientY - dragStartPos.current.y;

    const colWidth = containerRef.current ? containerRef.current.clientWidth / 12 : 80;
    const rowHeight = 40; // Approx height per unit grid

    const gridDeltaX = Math.round(deltaX / colWidth);
    const gridDeltaY = Math.round(deltaY / rowHeight);

    if (draggingId) {
      let newX = widgetStartLayout.current.x + gridDeltaX;
      let newY = widgetStartLayout.current.y + gridDeltaY;

      // Boundaries checks
      newX = Math.max(0, Math.min(12 - widgetStartLayout.current.w, newX));
      newY = Math.max(0, newY);

      updateWidgetLayout(draggingId, { x: newX, y: newY });
    } else if (resizingId) {
      let newW = widgetStartLayout.current.w + gridDeltaX;
      let newH = widgetStartLayout.current.h + gridDeltaY;

      newW = Math.max(1, Math.min(12 - widgetStartLayout.current.x, newW));
      newH = Math.max(2, newH);

      updateWidgetLayout(resizingId, { w: newW, h: newH });
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
    setResizingId(null);
  };

  // Exports Dashboard metrics
  const triggerExport = (format: 'json' | 'csv') => {
    const data = widgets.map((w) => ({
      widget: w.name,
      type: w.type,
      kpi: w.kpiKey,
      value: computeKpiValue(w.kpiKey),
    }));

    let blob: Blob;
    let fileName = `kpi_dashboard_export_${Date.now()}`;

    if (format === 'json') {
      blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      fileName += '.json';
    } else {
      const csv = 'Widget,Type,KPI,Value\n' + data.map(d => `"${d.widget}","${d.type}","${d.kpi}","${d.value}"`).join('\n');
      blob = new Blob([csv], { type: 'text/csv' });
      fileName += '.csv';
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // PNG Dashboard Screenshot simulation export
  const triggerPngExport = () => {
    // Generate simple notification
    const alertBox = document.createElement('div');
    alertBox.className = 'fixed bottom-4 right-4 bg-sky-600 text-white px-4 py-2.5 rounded-lg shadow-lg z-50 text-xs font-semibold';
    alertBox.innerText = '📸 Capturando imagem do dashboard...';
    document.body.appendChild(alertBox);
    
    setTimeout(() => {
      alertBox.innerText = '✅ Dashboard exportado com sucesso!';
      setTimeout(() => alertBox.remove(), 2000);
      
      // Trigger virtual download of an SVG mock snapshot
      const mockSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <rect width="100%" height="100%" fill="#090d16"/>
        <text x="400" y="50" fill="#fff" font-size="24" font-family="sans-serif" text-anchor="middle">Serrano Industrial KPI Dashboard</text>
        <text x="400" y="80" fill="#888" font-size="14" font-family="sans-serif" text-anchor="middle">Exportado em: ${new Date().toLocaleString()}</text>
      </svg>`;
      const blob = new Blob([mockSvg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kpi_dashboard_snapshot_${Date.now()}.png`;
      a.click();
    }, 1200);
  };

  // Render visual widget contents (Charts & Indicators)
  const renderWidgetContent = (w: KpiWidget) => {
    const val = computeKpiValue(w.kpiKey);
    const num = parseFloat(String(val)) || 0;
    const threshold = w.config?.thresholds || { warning: 75, critical: 90, target: 80 };

    // Get color theme based on alarms thresholds
    let colorClass = 'text-slate-800 dark:text-slate-200';
    
    if (w.type === 'gauge' || w.type === 'card') {
      if (num >= threshold.critical) {
        colorClass = 'text-rose-500';
      } else if (num >= threshold.warning) {
        colorClass = 'text-amber-500';
      } else {
        colorClass = 'text-emerald-500';
      }
    }

    // Navigation trigger mapping
    const handleWidgetClick = () => {
      if (w.kpiKey.includes('alarm')) {
        navigate('/alarms');
      } else if (w.kpiKey.includes('tank')) {
        // Try finding a Tank template property
        navigate('/properties');
      } else if (w.kpiKey.includes('prod') || w.kpiKey.includes('movement') || w.kpiKey.includes('order')) {
        navigate('/omm');
      } else {
        navigate('/runtime');
      }
    };

    switch (w.type) {
      case 'card': {
        // Simple numeric indicator with micro sparkline graph
        return (
          <div 
            onClick={handleWidgetClick}
            className="flex flex-col justify-between h-full cursor-pointer hover:bg-slate-50/20 dark:hover:bg-slate-800/10 transition-colors p-3"
          >
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{w.name}</span>
              <Activity className="w-3.5 h-3.5 text-sky-500" />
            </div>
            <div className="my-2 flex items-baseline gap-2">
              <span className={`text-2xl font-bold font-mono tracking-tight ${colorClass}`}>{val}</span>
              {typeof val === 'number' || !isNaN(parseFloat(String(val))) ? (
                <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-50/50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded">
                  +3.2%
                </span>
              ) : null}
            </div>
            <div className="h-6 w-full opacity-60">
              {/* Mini Sparkline Graph */}
              <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path 
                  d="M0,15 Q15,5 30,12 T60,8 T90,14 L100,5" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5"
                  className="text-sky-500"
                />
              </svg>
            </div>
          </div>
        );
      }

      case 'gauge': {
        // Velocímetro SVG Gauge
        const percent = Math.min(100, Math.max(0, num));
        return (
          <div 
            onClick={handleWidgetClick}
            className="flex flex-col items-center justify-center h-full p-4 cursor-pointer hover:bg-slate-50/10 dark:hover:bg-slate-800/5 transition-colors"
          >
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">{w.name}</span>
            <div className="relative w-36 h-20 flex items-end justify-center overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 100 50">
                {/* Arc Background */}
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e2e8f0" strokeWidth="12" className="dark:stroke-slate-800" />
                {/* Arc Value Fill */}
                <path 
                  d="M 10 50 A 40 40 0 0 1 90 50" 
                  fill="none" 
                  stroke={percent >= threshold.critical ? '#ef4444' : percent >= threshold.warning ? '#f59e0b' : '#10b981'} 
                  strokeWidth="12" 
                  strokeDasharray={`${(percent / 100) * 125.6} 125.6`}
                />
              </svg>
              {/* Central Value */}
              <div className="absolute bottom-0 text-center">
                <span className="text-lg font-bold font-mono text-slate-700 dark:text-slate-200">{val}%</span>
              </div>
            </div>
            <div className="flex justify-between w-full text-[10px] text-slate-400 px-4 mt-1">
              <span>0%</span>
              <span className="text-[9px] uppercase font-bold text-sky-500">Target: {threshold.target}%</span>
              <span>100%</span>
            </div>
          </div>
        );
      }

      case 'line':
      case 'area': {
        // Line & Area SVG Charting
        return (
          <div className="flex flex-col h-full p-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">{w.name}</span>
            <div className="flex-1 min-h-0 relative">
              <svg className="w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
                {/* Gridlines */}
                <line x1="0" y1="25" x2="200" y2="25" stroke="#f1f5f9" strokeWidth="0.5" className="dark:stroke-slate-800" />
                <line x1="0" y1="50" x2="200" y2="50" stroke="#f1f5f9" strokeWidth="0.5" className="dark:stroke-slate-800" />
                <line x1="0" y1="75" x2="200" y2="75" stroke="#f1f5f9" strokeWidth="0.5" className="dark:stroke-slate-800" />
                {/* Area under curve */}
                {w.type === 'area' && (
                  <path 
                    d="M0,80 Q30,50 60,60 T120,30 T170,45 L200,15 L200,100 L0,100 Z" 
                    fill="url(#area-gradient)" 
                    opacity="0.3"
                  />
                )}
                {/* Wave Line */}
                <path 
                  d="M0,80 Q30,50 60,60 T120,30 T170,45 L200,15" 
                  fill="none" 
                  stroke="#ef4444" 
                  strokeWidth="2.5" 
                  className="text-sky-500 stroke-sky-500" 
                />
                
                {/* Gradients declarations */}
                <defs>
                  <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Tooltip Overlay */}
              <div className="absolute top-2 right-2 bg-slate-900/90 text-white text-[9px] px-1.5 py-0.5 rounded font-mono border border-slate-700">
                Pico: 185.2 m³ às 09:00
              </div>
            </div>
          </div>
        );
      }

      case 'bar': {
        // High-contrast clean vertical bars
        const areasData = [
          { name: 'Área A', count: 4 },
          { name: 'Área B', count: 8 },
          { name: 'Área C', count: 2 },
          { name: 'Área D', count: 6 },
        ];
        return (
          <div className="flex flex-col h-full p-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">{w.name}</span>
            <div className="flex-1 flex justify-between items-end gap-2 px-2">
              {areasData.map((d, i) => {
                const heightPercent = (d.count / 10) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-full relative bg-slate-100 dark:bg-slate-800 rounded-t-md overflow-hidden" style={{ height: '70px' }}>
                      <div 
                        className="absolute bottom-0 w-full bg-violet-500 hover:bg-violet-600 transition-all rounded-t-md" 
                        style={{ height: `${heightPercent}%` }} 
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 font-semibold mt-1.5 truncate max-w-full">{d.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'pie': {
        // Simple Pie / Donut SVG
        return (
          <div className="flex flex-col h-full p-3 justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{w.name}</span>
            <div className="flex items-center justify-center my-auto relative">
              <svg className="w-24 h-24" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" strokeWidth="4" className="dark:stroke-slate-800" />
                <circle 
                  cx="18" cy="18" r="15.915" 
                  fill="none" 
                  stroke="#3b82f6" 
                  strokeWidth="4.2" 
                  strokeDasharray="40 100" 
                  strokeDashoffset="25" 
                />
                <circle 
                  cx="18" cy="18" r="15.915" 
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth="4.2" 
                  strokeDasharray="35 100" 
                  strokeDashoffset="85" 
                />
                <circle 
                  cx="18" cy="18" r="15.915" 
                  fill="none" 
                  stroke="#f59e0b" 
                  strokeWidth="4.2" 
                  strokeDasharray="25 100" 
                  strokeDashoffset="120" 
                />
              </svg>
              {/* Donut Center Label */}
              <div className="absolute text-center">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Total</span>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">3 prod</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 text-[9px] text-slate-400 font-medium">
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-sky-500" />40% Nafta</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500" />35% Diesel</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500" />25% GLP</div>
            </div>
          </div>
        );
      }

      case 'heatmap': {
        // 2D visual layout intensity grid
        const cols = Array.from({ length: 6 });
        const rows = Array.from({ length: 4 });
        return (
          <div className="flex flex-col h-full p-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">{w.name}</span>
            <div className="flex-1 grid grid-cols-6 gap-1 min-h-0">
              {rows.map((_, rIdx) => 
                cols.map((_, cIdx) => {
                  const intensity = Math.round((Math.sin(rIdx + cIdx) + 1) * 2);
                  const colors = [
                    'bg-slate-100 dark:bg-slate-900',
                    'bg-sky-950/20 dark:bg-sky-950/40 text-sky-400',
                    'bg-sky-500/20 text-sky-400',
                    'bg-sky-500/50 text-white',
                    'bg-sky-600 text-white',
                  ];
                  return (
                    <div 
                      key={`${rIdx}-${cIdx}`} 
                      className={`rounded-sm flex items-center justify-center text-[8px] font-mono hover:scale-105 transition-transform ${colors[intensity]}`}
                      title={`Intensidade: ${intensity}`}
                    >
                      {intensity > 0 ? `${intensity}h` : ''}
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex justify-between items-center mt-1.5 text-[8px] text-slate-400">
              <span>Baixa Intensidade</span>
              <span>Alta Intensidade</span>
            </div>
          </div>
        );
      }

      case 'table': {
        // Tabular Operational summary
        return (
          <div className="flex flex-col h-full p-3 overflow-hidden">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">{w.name}</span>
            <div className="flex-1 overflow-y-auto text-[10px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[8px] font-bold">
                    <th className="pb-1.5 font-semibold">Equipamento</th>
                    <th className="pb-1.5 font-semibold">Tag</th>
                    <th className="pb-1.5 font-semibold">Status</th>
                    <th className="pb-1.5 font-semibold text-right">Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-medium">
                  {ommEquipments.slice(0, 5).map((e, idx) => {
                    const statusText = e.isSending || e.isReceiving ? 'running' : e.isActive ? 'idle' : 'offline';
                    return (
                      <tr 
                        key={idx} 
                        onClick={() => navigate('/omm')}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer"
                      >
                        <td className="py-1.5 truncate max-w-[100px] text-slate-700 dark:text-slate-300">{e.name}</td>
                        <td className="py-1.5 font-mono text-slate-500">{e.tag}</td>
                        <td className="py-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                            statusText === 'running' ? 'bg-emerald-500/10 text-emerald-500' :
                            statusText === 'idle' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-rose-500/10 text-rose-500'
                          }`}>
                            {statusText}
                          </span>
                        </td>
                        <td className="py-1.5 text-right font-mono text-slate-600 dark:text-slate-400">{(420.5 + idx * 80).toFixed(1)} m³</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case 'events': {
        // Timeline of recent alarms & events
        const recentAlarms = (alarmEvents || []).slice(0, 5);
        return (
          <div className="flex flex-col h-full p-3 overflow-hidden">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">{w.name}</span>
            <div className="flex-1 overflow-y-auto space-y-2">
              {recentAlarms.length > 0 ? (
                recentAlarms.map((a, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => navigate('/alarms')}
                    className="p-1.5 rounded bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80 text-[10px] cursor-pointer hover:border-sky-500 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">{a.propertyName}</span>
                      <span className={`px-1 rounded text-[8px] font-bold uppercase ${
                        a.severity === 'critical' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {a.severity}
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[9px] line-clamp-1">{a.message}</p>
                    <span className="text-[8px] text-slate-400 font-mono block mt-0.5">{new Date(a.activatedAt).toLocaleTimeString()}</span>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  Sem eventos ou alarmes ativos
                </div>
              )}
            </div>
          </div>
        );
      }

      default:
        return <div className="p-4 text-xs">Tipo de widget desconhecido</div>;
    }
  };

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-slate-50 font-sans ${isTvMode ? 'dark bg-slate-950 text-white' : ''}`}>
      {/* Navigation header hides in TV presentation mode */}
      {!isTvMode && <HeaderNavigation />}

      {/* KPI Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
            <TrendingUp className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100">KPI Dashboard</h1>
            <p className="text-[10px] text-slate-400">Industrial & Management Analytics Real-time Portal</p>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Simulator state toggles directly */}
          <button 
            onClick={() => toggleSimulation()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer font-semibold ${
              isSimulating 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-455'
            }`}
          >
            {isSimulating ? <Play className="w-3.5 h-3.5 animate-spin" /> : <Pause className="w-3.5 h-3.5" />}
            <span>Simulação: {isSimulating ? 'Ativa' : 'Pausada'}</span>
          </button>

          {/* Filters Toggle Button */}
          <div className="relative">
            <button 
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtros</span>
            </button>

            {isFilterDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-50 space-y-2.5 animate-in fade-in duration-100">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b pb-1">Filtros Operacionais</h4>
                <div>
                  <label className="text-[10px] text-slate-400 font-medium">Período</label>
                  <select 
                    value={filters.period}
                    onChange={(e) => setFilter('period', e.target.value)}
                    className="w-full p-1 bg-slate-50 dark:bg-slate-800 border rounded text-[11px] outline-none"
                  >
                    <option value="today">Hoje (Turno Atual)</option>
                    <option value="1h">Última 1 Hora</option>
                    <option value="8h">Último Turno (8h)</option>
                    <option value="24h">Últimas 24 Horas</option>
                    <option value="all">Histórico Completo</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-medium">Área</label>
                  <select 
                    value={filters.areaId}
                    onChange={(e) => setFilter('areaId', e.target.value)}
                    className="w-full p-1 bg-slate-50 dark:bg-slate-800 border rounded text-[11px] outline-none"
                  >
                    <option value="all">Todas as Áreas</option>
                    {ommAreas.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-medium">Produto</label>
                  <select 
                    value={filters.productId}
                    onChange={(e) => setFilter('productId', e.target.value)}
                    className="w-full p-1 bg-slate-50 dark:bg-slate-800 border rounded text-[11px] outline-none"
                  >
                    <option value="all">Todos os Produtos</option>
                    {ommProducts.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end pt-1">
                  <button 
                    onClick={() => setIsFilterDropdownOpen(false)}
                    className="px-2.5 py-1 bg-sky-500 text-white rounded text-[10px] font-semibold"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Triggers */}
          <button 
            onClick={() => setIsAddWidgetOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold cursor-pointer shadow-sm shadow-orange-500/25"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Widget</span>
          </button>

          <button 
            onClick={() => setIsCustomKpiOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold cursor-pointer shadow-sm shadow-sky-500/25"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>KPI Personalizado</span>
          </button>

          <button 
            onClick={() => setTvMode(!isTvMode)}
            className={`p-1.5 rounded-lg border cursor-pointer ${isTvMode ? 'bg-orange-500 text-white border-orange-500' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            title="Modo TV Kiosk"
          >
            <Tv className="w-4 h-4" />
          </button>

          {/* Export options */}
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shrink-0">
            <button 
              onClick={() => triggerExport('json')}
              className="px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 border-r border-slate-200 dark:border-slate-800 text-[10px] font-semibold cursor-pointer"
            >
              JSON
            </button>
            <button 
              onClick={() => triggerExport('csv')}
              className="px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 border-r border-slate-200 dark:border-slate-800 text-[10px] font-semibold cursor-pointer"
            >
              CSV
            </button>
            <button 
              onClick={triggerPngExport}
              className="px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-semibold cursor-pointer"
            >
              PNG
            </button>
          </div>

          <button 
            onClick={resetLayout}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer font-semibold"
            title="Resetar Layout Inicial"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Resetar Layout</span>
          </button>
        </div>
      </div>

      {/* Main Grid View area */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950 relative min-h-0 select-none"
        style={{ contentVisibility: 'auto' }}
      >
        {isTvMode && (
          <button 
            onClick={() => setTvMode(false)}
            className="fixed top-4 right-4 bg-slate-900/80 text-white p-2 rounded-full border border-slate-700 z-50 hover:bg-slate-800 transition-colors"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        )}

        <div className="grid grid-cols-12 gap-4 auto-rows-[40px] relative">
          {widgets.map((w) => {
            const isFullscreen = fullscreenWidgetId === w.id;
            
            // Layout placement style
            const style: React.CSSProperties = isFullscreen 
              ? {
                  position: 'fixed',
                  top: '10px',
                  left: '10px',
                  width: 'calc(100vw - 20px)',
                  height: 'calc(100vh - 20px)',
                  zIndex: 100,
                }
              : {
                  gridColumn: `span ${w.w}`,
                  gridRow: `span ${w.h}`,
                };

            return (
              <div 
                key={w.id}
                style={style}
                className={`group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-xs overflow-hidden flex flex-col transition-shadow hover:shadow-md ${
                  draggingId === w.id ? 'opacity-50 ring-2 ring-sky-500' : ''
                }`}
              >
                {/* Drag Handle Title Bar */}
                <div 
                  onMouseDown={(e) => handleMouseDown(w.id, e, 'drag')}
                  className={`px-3 py-1.5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between shrink-0 cursor-move transition-colors group-hover:bg-slate-100 dark:group-hover:bg-slate-850`}
                >
                  <div className="flex items-center gap-1.5">
                    <LayoutGrid className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 font-sans tracking-wide truncate max-w-[120px] md:max-w-[200px]">
                      {w.name}
                    </span>
                  </div>
                  
                  {/* Action links */}
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setFullscreenWidgetId(isFullscreen ? null : w.id)}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer"
                      title={isFullscreen ? 'Minimizar' : 'Tela Cheia'}
                    >
                      <Maximize2 className="w-2.5 h-2.5" />
                    </button>
                    <button 
                      onClick={() => removeWidget(w.id)}
                      className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                      title="Deletar Widget"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                {/* Widget Dynamic View Content */}
                <div className="flex-1 min-h-0 bg-white/50 dark:bg-slate-900/30">
                  {renderWidgetContent(w)}
                </div>

                {/* Resize Handle bottom-right */}
                {!isTvMode && !isFullscreen && (
                  <div 
                    onMouseDown={(e) => handleMouseDown(w.id, e, 'resize')}
                    className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize bg-slate-300 dark:bg-slate-700 rounded-br-xl opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Widget Options Modal */}
      <Modal
        isOpen={isAddWidgetOpen}
        onClose={() => setIsAddWidgetOpen(false)}
        title="Adicionar Widget ao Dashboard"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Selecione o tipo de visualização e a variável para adicionar um novo painel ao seu dashboard.</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button 
              onClick={() => handleAddWidget('card', 'prod_total', 'Produção Total')}
              className="p-3 border rounded-xl hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-sky-950/20 text-left space-y-1 transition-all"
            >
              <div className="font-semibold text-slate-800 dark:text-slate-200">Cartão de Indicador</div>
              <div className="text-[10px] text-slate-400">Exibição de valores numéricos de destaque com sparklines.</div>
            </button>
            <button 
              onClick={() => handleAddWidget('gauge', 'oee', 'OEE do Processo')}
              className="p-3 border rounded-xl hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-sky-950/20 text-left space-y-1 transition-all"
            >
              <div className="font-semibold text-slate-800 dark:text-slate-200">Velocímetro (Gauge)</div>
              <div className="text-[10px] text-slate-400">Radial para limites críticos, setpoints e warning.</div>
            </button>
            <button 
              onClick={() => handleAddWidget('line', 'prod_trend', 'Tendência')}
              className="p-3 border rounded-xl hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-sky-950/20 text-left space-y-1 transition-all"
            >
              <div className="font-semibold text-slate-800 dark:text-slate-200">Gráfico de Linha/Área</div>
              <div className="text-[10px] text-slate-400">Histórico de oscilações, taxas e tendências contínuas.</div>
            </button>
            <button 
              onClick={() => handleAddWidget('pie', 'prod_by_product', 'Distribuição')}
              className="p-3 border rounded-xl hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-sky-950/20 text-left space-y-1 transition-all"
            >
              <div className="font-semibold text-slate-800 dark:text-slate-200">Gráfico de Pizza</div>
              <div className="text-[10px] text-slate-400">Gráfico de rosca para analisar divisões e shares.</div>
            </button>
          </div>
        </div>
      </Modal>

      {/* Visual Custom KPI Builder Modal */}
      <Modal
        isOpen={isCustomKpiOpen}
        onClose={() => setIsCustomKpiOpen(false)}
        title="Criar KPI Personalizado"
      >
        <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-350">
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase">Nome do KPI</label>
            <input 
              type="text" 
              placeholder="Ex: Eficiência de Mistura" 
              value={customKpiName}
              onChange={(e) => setCustomKpiName(e.target.value)}
              className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-sky-500 text-xs text-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase">Descrição</label>
            <input 
              type="text" 
              placeholder="Cálculo matemático customizado..." 
              value={customKpiDesc}
              onChange={(e) => setCustomKpiDesc(e.target.value)}
              className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-sky-500 text-xs text-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 items-end">
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase">Variável 1</label>
              <select 
                value={selectedVar1}
                onChange={(e) => setSelectedVar1(e.target.value)}
                className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-xs"
              >
                <option value="">Selecione...</option>
                {PREDEFINED_METRICS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase">Operação</label>
              <select 
                value={selectedOperator}
                onChange={(e) => setSelectedOperator(e.target.value)}
                className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-xs"
              >
                <option value="+">+</option>
                <option value="-">-</option>
                <option value="*">*</option>
                <option value="/">/</option>
                <option value="%">%</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase">Variável 2</label>
              <select 
                value={selectedVar2}
                onChange={(e) => setSelectedVar2(e.target.value)}
                className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-xs"
              >
                <option value="">Nenhuma (Unicamp)</option>
                {PREDEFINED_METRICS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="text-[10px] font-semibold text-slate-400 uppercase">Agregação Matemática</label>
            <select 
              value={selectedAgg}
              onChange={(e) => setSelectedAgg(e.target.value)}
              className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-xs"
            >
              <option value="NONE">Sem agregação (Valor Direto)</option>
              <option value="AVG">Média Aritmética (AVG)</option>
              <option value="SUM">Somatório (SUM)</option>
              <option value="MIN">Mínimo (MIN)</option>
              <option value="MAX">Máximo (MAX)</option>
            </select>
          </div>

          {/* Formula preview */}
          {selectedVar1 && (
            <div className="p-3 bg-slate-100/50 dark:bg-slate-900 border rounded-lg space-y-1">
              <span className="text-[9px] uppercase font-bold text-sky-500">Expressão da Fórmula Gerada</span>
              <p className="font-mono text-[11px] text-slate-800 dark:text-white truncate">
                {selectedAgg !== 'NONE' ? `${selectedAgg}(` : ''}
                {selectedVar1}
                {selectedVar2 ? ` ${selectedOperator} ${selectedVar2}` : ''}
                {selectedAgg !== 'NONE' ? ')' : ''}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t dark:border-slate-800">
            <button 
              onClick={() => setIsCustomKpiOpen(false)}
              className="px-3 py-1.5 rounded-lg border dark:border-slate-800 text-slate-500 font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSaveCustomKpi}
              className="px-3.5 py-1.5 rounded-lg bg-sky-500 text-white font-semibold hover:bg-sky-600 transition-colors cursor-pointer"
            >
              Salvar KPI
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default KpiDashboardPage;
