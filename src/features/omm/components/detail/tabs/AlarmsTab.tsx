import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useOmmStore } from '../../../store/useOmmStore';
import { Bell, CheckCircle2, AlertTriangle } from 'lucide-react';

export const AlarmsTab: React.FC<{ movementId: string }> = ({ movementId }) => {
  const alarms = useOmmStore(useShallow((s) => s.alarms.filter((a) => a.movementId === movementId)));
  const acknowledgeAlarm = useOmmStore((s) => s.acknowledgeAlarm);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Alarmes — {alarms.length} registros
        </span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold
          ${alarms.filter((a) => a.isActive && !a.acknowledged).length > 0
            ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
            : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
          }`}>
          {alarms.filter((a) => a.isActive && !a.acknowledged).length} ativos
        </span>
      </div>

      {alarms.length === 0 ? (
        <div className="text-center py-8">
          <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <div className="text-sm text-slate-400">Nenhum alarme registrado</div>
        </div>
      ) : (
        <div className="space-y-2">
          {alarms.map((alarm) => (
            <div
              key={alarm.id}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all
                ${alarm.isActive && !alarm.acknowledged
                  ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                }`}
            >
              {alarm.isActive && !alarm.acknowledged
                ? <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                : <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              }
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">{alarm.message}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                  {new Date(alarm.activatedAt).toLocaleString('pt-BR')}
                </div>
                {alarm.acknowledged && (
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ACK por {alarm.acknowledgedBy} em {alarm.acknowledgedAt ? new Date(alarm.acknowledgedAt).toLocaleTimeString('pt-BR') : '—'}
                  </div>
                )}
              </div>
              {!alarm.acknowledged && (
                <button
                  onClick={() => acknowledgeAlarm(alarm.id)}
                  className="text-[10px] px-2 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 hover:bg-rose-200 border border-rose-200 dark:border-rose-800 cursor-pointer font-semibold transition-colors shrink-0"
                >
                  ACK
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
