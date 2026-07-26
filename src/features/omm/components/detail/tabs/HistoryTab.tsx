import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useOmmStore } from '../../../store/useOmmStore';
import type { OmmEvent } from '../../../types';
import { CheckCircle2, AlertTriangle, Info, Zap, Activity } from 'lucide-react';

const EVENT_ICONS: Record<string, React.ReactNode> = {
  COMPLETION: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
  THRESHOLD_90PCT: <Zap className="w-3.5 h-3.5 text-amber-500" />,
  FLOW_DEVIATION: <Activity className="w-3.5 h-3.5 text-orange-500" />,
  LOW_ACCURACY: <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />,
  DENSITY_CHANGE: <Info className="w-3.5 h-3.5 text-blue-500" />,
  STATUS_CHANGE: <Info className="w-3.5 h-3.5 text-sky-500" />,
  CUTOFF_CROSSING: <Zap className="w-3.5 h-3.5 text-violet-500" />,
  ALARM_ACTIVE: <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />,
  SYSTEM: <Info className="w-3.5 h-3.5 text-slate-400" />,
};

const SEVERITY_STYLES: Record<string, string> = {
  Low: 'border-slate-200 dark:border-slate-700',
  Medium: 'border-amber-200 dark:border-amber-800/50',
  High: 'border-orange-200 dark:border-orange-800/50',
  Critical: 'border-rose-300 dark:border-rose-800/60',
};

const EventItem: React.FC<{ evt: OmmEvent }> = ({ evt }) => {
  const acknowledge = useOmmStore((s) => s.acknowledgeEvent);
  const icon = EVENT_ICONS[evt.type] ?? <Info className="w-3.5 h-3.5 text-slate-400" />;
  const ts = new Date(evt.createdAt);

  return (
    <div className={`relative border-l-2 pl-3 py-2 pr-3 ${SEVERITY_STYLES[evt.severity]} bg-white dark:bg-slate-900 rounded-r-lg ml-2`}>
      {/* Timeline dot */}
      <div className="absolute -left-[7px] top-3 w-3 h-3 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          {icon}
          <div>
            <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">{evt.message}</div>
            {evt.value && (
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">Valor: {evt.value}</div>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[9px] text-slate-400 font-mono">
            {ts.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-[9px] text-slate-300 dark:text-slate-600 font-mono">
            {ts.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </div>
          {!evt.acknowledged && (
            <button
              onClick={() => acknowledge(evt.id)}
              className="mt-1 text-[9px] text-sky-500 hover:text-sky-600 cursor-pointer font-semibold"
            >
              ACK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const HistoryTab: React.FC<{ movementId: string }> = ({ movementId }) => {
  const events = useOmmStore(useShallow((s) => s.events.filter((e) => e.movementId === movementId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))));

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Linha do Tempo — {events.length} eventos
        </span>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8">
          <Info className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <div className="text-sm text-slate-400">Nenhum evento registrado</div>
          <div className="text-[11px] text-slate-300 dark:text-slate-600 mt-1">Eventos aparecem quando o movimento está ativo</div>
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-200 dark:border-slate-700 space-y-2 ml-2">
          {events.map((evt) => (
            <EventItem key={evt.id} evt={evt} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryTab;
