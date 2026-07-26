import React from 'react';
import { useOmmStore } from '../../store/useOmmStore';
import { Clock, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import type { CutoffStatus } from '../../types';

const STATUS_CONFIG: Record<CutoffStatus, { label: string; icon: React.ReactNode; color: string }> = {
  Open:      { label: 'Aberto',     icon: <Clock className="w-4 h-4" />,        color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50' },
  Locked:    { label: 'Bloqueado',  icon: <AlertCircle className="w-4 h-4" />,  color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/50' },
  Validated: { label: 'Validado',   icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50' },
  Sent:      { label: 'Enviado',    icon: <Send className="w-4 h-4" />,          color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50' },
};

export const CutoffHistory: React.FC = () => {
  const cutoffs = useOmmStore((s) => s.cutoffSnapshots);
  const simState = useOmmStore((s) => s.simulatorState);

  const nextCutoff = simState.nextCutoffAt ? new Date(simState.nextCutoffAt) : null;
  const simNow = new Date(simState.simulatedTime);
  const hoursToNext = nextCutoff ? (nextCutoff.getTime() - simNow.getTime()) / 3_600_000 : null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shrink-0">
        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Histórico de Cut-off</span>
        <span className="ml-3 text-[10px] text-slate-400">{cutoffs.length} snapshots registrados</span>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {/* Next cutoff card */}
        <div className="bg-gradient-to-r from-violet-50 to-white dark:from-violet-950/20 dark:to-slate-900 rounded-2xl border border-violet-200 dark:border-violet-800/50 p-4 mb-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-violet-500 mb-2">Próximo Cut-off</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {nextCutoff
                  ? nextCutoff.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                  : 'Não configurado'
                }
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Horário configurado: {simState.cutoffHour.toString().padStart(2, '0')}:00 diariamente
              </div>
            </div>
            {hoursToNext !== null && (
              <div className="text-right">
                <div className={`text-2xl font-bold font-mono ${hoursToNext < 1 ? 'text-rose-500' : hoursToNext < 3 ? 'text-amber-500' : 'text-violet-600 dark:text-violet-400'}`}>
                  {hoursToNext < 1 ? `${Math.round(hoursToNext * 60)}min` : `${hoursToNext.toFixed(1)}h`}
                </div>
                <div className="text-[10px] text-slate-400">para o corte</div>
              </div>
            )}
          </div>
        </div>

        {/* Cutoff list */}
        {cutoffs.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <div className="text-slate-400 font-medium">Nenhum snapshot registrado</div>
            <div className="text-[11px] text-slate-300 dark:text-slate-600 mt-1">
              Snapshots são gerados automaticamente no horário do cut-off
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {[...cutoffs].reverse().map((co) => {
              const cfg = STATUS_CONFIG[co.status];
              return (
                <div key={co.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">{co.number}</span>
                      <span className="ml-2 text-[11px] text-slate-400">
                        {co.executedAt ? new Date(co.executedAt).toLocaleString('pt-BR') : 'Pendente'}
                      </span>
                    </div>
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${cfg.color}`}>
                      {cfg.icon}
                      {cfg.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 p-3">
                    <div>
                      <div className="text-[9px] text-slate-400 uppercase">Volume Total</div>
                      <div className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">
                        {co.totalVolume.toFixed(0)} m³
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-400 uppercase">Massa Total</div>
                      <div className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">
                        {(co.totalMass / 1000).toFixed(2)} kt
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-400 uppercase">Movimentos Ativos</div>
                      <div className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">
                        {co.movementsActive.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-400 uppercase">Cruzando Meia-noite</div>
                      <div className={`font-mono text-sm font-bold ${co.movementsCrossing.length > 0 ? 'text-amber-500' : 'text-slate-700 dark:text-slate-200'}`}>
                        {co.movementsCrossing.length}
                      </div>
                    </div>
                  </div>
                  {co.notes && (
                    <div className="px-4 pb-3 text-[11px] text-slate-500 dark:text-slate-400 italic">
                      {co.notes}
                    </div>
                  )}
                  {co.validatedBy && (
                    <div className="px-4 pb-2 text-[10px] text-emerald-600 dark:text-emerald-400">
                      Validado por {co.validatedBy} em {co.validatedAt ? new Date(co.validatedAt).toLocaleString('pt-BR') : '—'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
