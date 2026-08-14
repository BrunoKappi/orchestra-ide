import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Play,
  ArrowLeftRight,
  RotateCw,
  Zap,
  Database,
  Flag,
  GitFork,
  Merge,
  Clock,
  Thermometer,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Snowflake,
  Droplets,
  Filter,
} from 'lucide-react';
import { useBatchStore } from '../../../../store/useBatchStore';
import { useOmmStore } from '../../store/useOmmStore';

const stepIcons: Record<string, any> = {
  start: Play,
  transfer: ArrowLeftRight,
  agitate: RotateCw,
  heat: Zap,
  cool: Snowflake,
  cip: Droplets,
  separate: Filter,
  cutoff: Database,
  end: Flag,
  split: GitFork,
  join: Merge,
};

export const BatchStepNode: React.FC<any> = memo(({ id, data, selected }) => {
  const { activeBatch } = useBatchStore();
  const { equipments, movements, products } = useOmmStore();

  const stepType = data.stepType || 'transfer';
  const IconComponent = stepIcons[stepType] || HelpCircle;

  // Retrieve execution state of this node in the current active batch
  const state = activeBatch ? activeBatch.stepStates[id] || 'pending' : 'pending';
  const progress = activeBatch ? activeBatch.stepProgress[id] || 0 : 0;
  const elapsed = activeBatch ? activeBatch.stepElapsedSeconds[id] || 0 : 0;

  // Style overrides by state
  let stateBorderColor = 'border-slate-200 dark:border-slate-800';
  let stateBgClass = 'bg-white dark:bg-slate-900';
  let glowClass = '';
  let statusBadge = null;

  if (activeBatch) {
    switch (state) {
      case 'running':
        stateBorderColor = 'border-amber-500 dark:border-amber-500';
        glowClass = 'ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10 animate-pulse';
        statusBadge = (
          <span className="flex items-center gap-1 text-[8px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded border border-amber-500/20 animate-pulse">
            <Clock className="w-2.5 h-2.5 text-amber-500" />
            RUNNING
          </span>
        );
        break;
      case 'completed':
        stateBorderColor = 'border-emerald-500 dark:border-emerald-500';
        stateBgClass = 'bg-slate-50/90 dark:bg-slate-900/90';
        statusBadge = (
          <span className="flex items-center gap-0.5 text-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-emerald-500/20">
            <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
            OK
          </span>
        );
        break;
      case 'error':
        stateBorderColor = 'border-red-500 dark:border-red-500';
        glowClass = 'ring-2 ring-red-500/30 shadow-lg shadow-red-500/10';
        statusBadge = (
          <span className="flex items-center gap-0.5 text-[8px] bg-red-500/10 text-red-600 dark:text-red-400 font-bold px-1.5 py-0.5 rounded border border-red-500/20">
            <AlertCircle className="w-2.5 h-2.5 text-red-500" />
            ERR
          </span>
        );
        break;
      default:
        stateBgClass = 'bg-white dark:bg-slate-900 opacity-60';
        break;
    }
  }

  // Gather specific preview configurations based on step type
  const renderBodyDetails = () => {
    switch (stepType) {
      case 'transfer': {
        const srcTank = equipments.find((e) => e.id === data.originId);
        const dstTank = equipments.find((e) => e.id === data.destinationId);
        const originTag = srcTank?.tag || data.originId || 'Origem';
        const destTag = dstTank?.tag || data.destinationId || 'Destino';
        const plannedVol = data.plannedVolume || 0;
        
        const product = products.find((p) => p.id === data.productId);
        const productTag = product?.code || '';

        // Find current transfer volume if running
        let currentVol = 0;
        if (state === 'completed') {
          currentVol = plannedVol;
        } else if (state === 'running' && activeBatch) {
          const movId = activeBatch.stepActiveMovementId?.[id];
          const movement = movements.find((m) => m.id === movId);
          if (movement) {
            currentVol = Math.round(movement.currentVolume);
          }
        }

        return (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              <span className="font-semibold text-slate-700 dark:text-slate-200">{originTag}</span>
              <ArrowLeftRight className="w-3 h-3 mx-1 text-slate-450 shrink-0" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">{destTag}</span>
            </div>
            
            {/* Render progress bar if running or completed */}
            {(state === 'running' || state === 'completed') && (
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span>{currentVol} m³</span>
                  <span>{progress}% de {plannedVol} m³</span>
                </div>
              </div>
            )}
            {state === 'pending' && (
              <div className="flex justify-between items-center text-[9.5px] font-mono text-slate-450 dark:text-slate-400 mt-1.5">
                <span>{productTag ? `Prod: ${productTag}` : 'S/ Prod'}</span>
                <span>{plannedVol} m³ | {data.plannedFlow || 100} m³/h</span>
              </div>
            )}
          </div>
        );
      }

      case 'agitate': {
        const vesselTag = equipments.find((e) => e.id === data.vesselId)?.tag || data.vesselId || 'Vaso';
        const rpm = data.agitatorSpeedRpm || 120;
        const duration = data.durationSeconds || 10;

        return (
          <div className="space-y-1.5">
            <div className="text-[10px] font-medium text-slate-700 dark:text-slate-200">
              Vaso: <span className="font-bold">{vesselTag}</span>
            </div>

            {(state === 'running' || state === 'completed') && (
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span>{rpm} RPM</span>
                  <span>{elapsed}s / {duration}s</span>
                </div>
              </div>
            )}
            {state === 'pending' && (
              <div className="text-[9px] font-mono text-slate-400 text-right">
                Speed: {rpm} RPM | Tempo: {duration}s
              </div>
            )}
          </div>
        );
      }

      case 'heat': {
        const vesselId = data.heatVesselId;
        const vesselTag = equipments.find((e) => e.id === vesselId)?.tag || vesselId || 'Vaso';
        const targetTemp = data.targetTemperature || 30;

        // Retrieve current temperature from OmmStore mirrored equipment list
        const currentEquipment = equipments.find((e) => e.id === vesselId);
        const currentTemp = currentEquipment?.temperature ?? 25;

        return (
          <div className="space-y-1.5">
            <div className="text-[10px] font-medium text-slate-700 dark:text-slate-200">
              Vaso: <span className="font-bold">{vesselTag}</span>
            </div>

            {(state === 'running' || state === 'completed') && (
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                  <span className="flex items-center text-orange-500">
                    <Thermometer className="w-3 h-3 mr-0.5" />
                    {currentTemp.toFixed(1)}°C
                  </span>
                  <span>Alvo: {targetTemp}°C</span>
                </div>
              </div>
            )}
            {state === 'pending' && (
              <div className="text-[9px] font-mono text-slate-400 text-right">
                Temp Alvo: {targetTemp}°C (+{data.heatingRate || 0.5}°C/s)
              </div>
            )}
          </div>
        );
      }

      case 'cool': {
        const vesselId = data.heatVesselId;
        const vesselTag = equipments.find((e) => e.id === vesselId)?.tag || vesselId || 'Vaso';
        const targetTemp = data.targetTemperature || 15;
        const currentEquipment = equipments.find((e) => e.id === vesselId);
        const currentTemp = currentEquipment?.temperature ?? 25;

        return (
          <div className="space-y-1.5">
            <div className="text-[10px] font-medium text-slate-700 dark:text-slate-200">
              Vaso: <span className="font-bold">{vesselTag}</span>
            </div>

            {(state === 'running' || state === 'completed') && (
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-sky-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                  <span className="flex items-center text-sky-500">
                    <Thermometer className="w-3 h-3 mr-0.5" />
                    {currentTemp.toFixed(1)}°C
                  </span>
                  <span>Alvo: {targetTemp}°C</span>
                </div>
              </div>
            )}
            {state === 'pending' && (
              <div className="text-[9px] font-mono text-slate-400 text-right">
                Temp Alvo: {targetTemp}°C (-{data.coolingRate || 0.5}°C/s)
              </div>
            )}
          </div>
        );
      }

      case 'cip': {
        const vesselTag = equipments.find((e) => e.id === data.vesselId)?.tag || data.vesselId || 'Vaso';
        const agent = data.cipAgent || 'Soda (NaOH) 2%';
        const duration = data.durationSeconds || 15;

        return (
          <div className="space-y-1.5">
            <div className="text-[10px] font-medium text-slate-700 dark:text-slate-200">
              Vaso: <span className="font-bold">{vesselTag}</span>
            </div>
            
            {(state === 'running' || state === 'completed') && (
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-teal-500 rounded-full transition-all duration-350"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span>{agent}</span>
                  <span>{elapsed}s / {duration}s</span>
                </div>
              </div>
            )}
            {state === 'pending' && (
              <div className="text-[9px] font-mono text-slate-400 text-right">
                Agente: {agent} | Tempo: {duration}s
              </div>
            )}
          </div>
        );
      }

      case 'separate': {
        const vesselTag = equipments.find((e) => e.id === data.vesselId)?.tag || data.vesselId || 'Vaso';
        const method = data.separationMethod || 'Decantação Estática';
        const duration = data.durationSeconds || 20;

        return (
          <div className="space-y-1.5">
            <div className="text-[10px] font-medium text-slate-700 dark:text-slate-200">
              Vaso: <span className="font-bold">{vesselTag}</span>
            </div>
            
            {(state === 'running' || state === 'completed') && (
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-350"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span>{method}</span>
                  <span>{elapsed}s / {duration}s</span>
                </div>
              </div>
            )}
            {state === 'pending' && (
              <div className="text-[9px] font-mono text-slate-400 text-right">
                Método: {method} | Tempo: {duration}s
              </div>
            )}
          </div>
        );
      }

      case 'cutoff': {
        return (
          <div className="text-[9px] text-slate-400 italic">
            {data.cutoffNotes || 'Balanço volumétrico automatizado'}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      className={`min-w-[210px] rounded-xl border-2 shadow-md transition-all select-none ${stateBgClass} ${stateBorderColor} ${glowClass} ${
        selected ? 'border-sky-500 ring-2 ring-sky-500/30' : ''
      }`}
    >
      {/* Input Handles */}
      {stepType !== 'start' && (
        <Handle
          type="target"
          position={Position.Left}
          id="in_left"
          className="w-3 h-3 bg-sky-500 border-2 border-white dark:border-slate-900 rounded-full hover:scale-110 transition-transform"
        />
      )}

      {/* Header bar */}
      <div
        className="px-3 py-1.5 flex items-center justify-between text-white font-bold text-xs rounded-t-[10px]"
        style={{ backgroundColor: data.color || '#64748b' }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <IconComponent className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{data.blockType}</span>
        </div>
        <div>
          {statusBadge ? (
            statusBadge
          ) : (
            <span className="text-[8px] bg-black/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
              {data.category || 'Fase'}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2">
        <div className="space-y-0.5">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate">
            {data.label}
          </h4>
          {data.description && (
            <p className="text-[10px] text-slate-400 dark:text-slate-550 leading-tight">
              {data.description}
            </p>
          )}
        </div>

        {/* Custom fields and progress indicators */}
        {renderBodyDetails()}
      </div>

      {/* Output Handles */}
      {stepType !== 'end' && (
        <Handle
          type="source"
          position={Position.Right}
          id="out_right"
          className="w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full hover:scale-110 transition-transform"
        />
      )}
    </div>
  );
});

BatchStepNode.displayName = 'BatchStepNode';
