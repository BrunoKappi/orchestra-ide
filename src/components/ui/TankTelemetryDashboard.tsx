import React, { useEffect, useState, useMemo } from 'react';
import { useObjectModelStore } from '../../store/useObjectModelStore';
import { inheritanceService } from '../../services/InheritanceService';
import { historyEngine } from '../../services/HistoryEngine';
import { TankGeometrySvg } from '../TankGeometrySvg';
import { MiniTrendChart } from './MiniTrendChart';
import { Thermometer, Gauge, Droplets, Activity, Percent, Database, HelpCircle } from 'lucide-react';
import { cn } from '../../utils/cn';


interface TankTelemetryDashboardProps {
  objectId: string;
  onClose?: () => void;
  compact?: boolean;
}

interface VariableHistory {
  name: string;
  label: string;
  unit: string;
  values: number[];
  color: string;
  icon: any;
}

export const TankTelemetryDashboard: React.FC<TankTelemetryDashboardProps> = ({ objectId, compact = false }) => {
  const { objects, templates, simulatedValues, init } = useObjectModelStore();

  useEffect(() => {
    init();
  }, [init]);

  // Find the selected object
  const objectDetail = objects.find((o) => o.id === objectId) ?? null;

  // Resolve geometry type from object configuration or template configuration
  const graphicCfg = objectDetail?.graphicConfig || (objectDetail ? templates.find((t) => t.id === objectDetail.templateId)?.graphicConfig : undefined);
  const geometryType = graphicCfg?.geometryType || 'vertical_cylindrical';

  // Resolve properties including inherited ones
  const allProperties = useMemo(() => {
    if (!objectDetail) return [];
    return inheritanceService.getMergedProperties(objectId, 'instance');
  }, [objectId, objectDetail]);

  // Finde variables of interest
  const processVariablesConfig = useMemo(() => {
    const numericProps = allProperties.filter((p) => {
      const name = p.name.toLowerCase();
      // Exclude strings, config parameters and thresholds
      if (p.dataType !== 'Float' && p.dataType !== 'Integer') return false;
      if (
        name.includes('limit') ||
        name.includes('high') ||
        name.includes('low') ||
        name.includes('capacity') ||
        name.includes('tag') ||
        name.includes('vcf')
      ) {
        return false;
      }
      return true;
    });
    return numericProps;
  }, [allProperties]);

  // Properties mapping (helper to get live values)
  const getLiveValue = (propName: string, fallback: string = '0.0'): string => {
    const key = `${objectId}:${propName}`;
    return simulatedValues[key] ?? fallback;
  };

  // State to hold local scrolling history of process variables
  const [historyData, setHistoryData] = useState<Record<string, number[]>>({});

  // Populate initial history from historyEngine or generate initial baseline
  useEffect(() => {
    if (!objectDetail) return;
    const initial: Record<string, number[]> = {};

    processVariablesConfig.forEach((prop) => {
      const propId = prop.id;
      const samples = historyEngine.query({ objectId, propertyId: propId });
      let vals = samples.map((s) => parseFloat(s.value)).filter((v) => !isNaN(v));

      if (vals.length === 0) {
        const curVal = parseFloat(getLiveValue(prop.name, prop.defaultValue));
        const startVal = isNaN(curVal) ? 0 : curVal;
        vals = Array.from({ length: 30 }, () => {
          const noise = (Math.random() - 0.5) * (startVal * 0.01 || 0.5);
          return Math.max(0, startVal + noise);
        });
      }

      if (vals.length > 30) {
        vals = vals.slice(vals.length - 30);
      } else if (vals.length < 30) {
        const pad = Array.from({ length: 30 - vals.length }, () => vals[0] ?? 0);
        vals = [...pad, ...vals];
      }

      initial[prop.name] = vals;
    });

    setHistoryData(initial);
  }, [objectId, objectDetail, processVariablesConfig]);

  // Update history buffer on every tick / simulatedValues change
  useEffect(() => {
    if (!objectDetail) return;

    setHistoryData((prev) => {
      const next = { ...prev };
      let changed = false;

      processVariablesConfig.forEach((prop) => {
        const curStr = getLiveValue(prop.name, prop.defaultValue);
        const curVal = parseFloat(curStr);
        const val = isNaN(curVal) ? 0 : curVal;

        const list = prev[prop.name] ? [...prev[prop.name]] : Array.from({ length: 30 }, () => val);
        list.push(val);
        if (list.length > 30) list.shift();
        next[prop.name] = list;
        changed = true;
      });

      return changed ? next : prev;
    });
  }, [simulatedValues]);

  if (!objectDetail) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 text-center rounded-xl border border-slate-200 dark:border-slate-800">
        <HelpCircle className="w-10 h-10 text-slate-400 mb-2 animate-bounce" />
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Equipamento Não Encontrado</h4>
        <p className="text-xs text-slate-400 mt-1">Este equipamento pode ter sido excluído ou não está ativo no runtime.</p>
      </div>
    );
  }

  // Get key values
  const currentLevel = parseFloat(getLiveValue('Level', '0.0'));
  const currentVolume = parseFloat(getLiveValue('Volume', '0.0'));
  const capacity = parseFloat(getLiveValue('Capacity', '10000.0'));
  const product = getLiveValue('Product', 'Nenhum');
  const tag = getLiveValue('Tag', objectDetail.name);

  // Map variables configurations for rendering
  const mappedVariables: VariableHistory[] = processVariablesConfig.map((prop) => {
    let color = '#38bdf8'; // sky
    let icon = Activity;

    if (prop.name === 'Level') {
      color = '#10b981'; // emerald
      icon = Percent;
    } else if (prop.name === 'Volume') {
      color = '#3b82f6'; // blue
      icon = Database;
    } else if (prop.name === 'Temperature') {
      color = '#f97316'; // orange
      icon = Thermometer;
    } else if (prop.name === 'Pressure') {
      color = '#8b5cf6'; // purple
      icon = Gauge;
    } else if (prop.name === 'Density') {
      color = '#06b6d4'; // cyan
      icon = Droplets;
    }

    return {
      name: prop.name,
      label: prop.description || prop.name,
      unit: prop.name === 'Level' ? '%' : prop.name === 'Temperature' ? '°C' : prop.name === 'Pressure' ? 'bar' : prop.name === 'Flow' ? 'm³/h' : prop.name === 'Density' ? 'kg/m³' : prop.name === 'Mass' ? 't' : 'm³',
      values: historyData[prop.name] || Array.from({ length: 30 }, () => 0),
      color,
      icon,
    };
  });

  return (
    <div className="flex flex-col h-full w-full bg-slate-50/30 dark:bg-slate-950/20 text-slate-900 dark:text-slate-100 overflow-hidden select-none">
      
      {/* Upper Telemetry Overview Grid */}
      <div className={`grid grid-cols-1 ${compact ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-5 p-4 sm:p-5 flex-1 overflow-y-auto`}>
        
        {/* Left Column: 3D tank visualization */}
        <div className={`${compact ? '' : 'lg:col-span-1'} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-between shadow-2xs relative`}>
          
          <div className="w-full text-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/40 px-2 py-0.5 rounded-full inline-block mb-1.5">
              {tag}
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-150 leading-tight">
              {objectDetail.name}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Produto: <span className="font-semibold text-slate-600 dark:text-slate-350">{product}</span>
            </p>
          </div>

          {/* 3D Cylinder Tank Rendering */}
          <div className={cn(
            "relative flex items-center justify-center my-2 group",
            compact ? "w-36 h-40" : "w-52 h-64 sm:w-60 sm:h-72"
          )}>
            {/* Render geometry component with appropriate dimensions */}
            <TankGeometrySvg
              geometry={geometryType}
              levelPercent={currentLevel}
              fillColor="#0284c7"
              width={compact ? 85 : 145}
              height={compact ? 120 : 210}
              className="z-10 drop-shadow-md transition-all duration-300 scale-105"
            />

            {/* Level badge overlay */}
            <div className="absolute bottom-2 bg-slate-900/90 backdrop-blur-xs text-white border border-slate-700 font-mono text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xl z-20">
              {currentLevel.toFixed(1)}%
            </div>
          </div>

          {/* Bottom stats summary */}
          <div className="w-full grid grid-cols-2 gap-2 mt-2 text-[11px] border-t border-slate-100 dark:border-slate-800 pt-3 select-text">
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-2 flex flex-col">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Volume</span>
              <strong className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                {currentVolume.toFixed(1)} m³
              </strong>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-2 flex flex-col">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Capacidade</span>
              <strong className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                {capacity.toFixed(0)} m³
              </strong>
            </div>
          </div>

        </div>

        {/* Right Columns (2/3): Real-time scrolling charts */}
        <div className={`${compact ? '' : 'lg:col-span-2'} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col shadow-2xs overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 shrink-0">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-150">
              Variáveis de Processo
            </h3>
            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 border border-emerald-100 dark:border-emerald-900/40 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Tempo Real
            </span>
          </div>

          {/* Scrolling Variable Trends - Hidden scrollbar visually, scroll still working */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {mappedVariables.map((v) => (
              <div key={v.name} className="border border-slate-100 dark:border-slate-800 rounded-xl p-3 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all select-text">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350">
                      <v.icon className="w-3.5 h-3.5" style={{ color: v.color }} />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block leading-tight">
                        {v.label}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        Histórico recente (últimas 30 amostras)
                      </span>
                    </div>
                  </div>
                  <div className="text-right font-mono select-none">
                    <span className="text-xs font-bold text-slate-850 dark:text-slate-100">
                      {(v.values[v.values.length - 1] ?? 0).toFixed(1)}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">
                      {v.unit}
                    </span>
                  </div>
                </div>
                {/* SVG Trend Chart */}
                <div className="h-16 w-full">
                  <MiniTrendChart values={v.values} color={v.color} />
                </div>
              </div>
            ))}

            {mappedVariables.length === 0 && (
              <div className="py-8 text-center text-slate-400 dark:text-slate-500 italic text-xs">
                Nenhuma variável de processo numérica disponível para este objeto.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
