import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useOmmStore } from '../../../store/useOmmStore';
import { ClipboardList } from 'lucide-react';

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Criado',
  UPDATE: 'Atualizado',
  STATUS_CHANGE: 'Status alterado',
  ACTIVATE: 'Ativado',
  COMPLETE: 'Concluído',
  CLOSE: 'Fechado',
  CANCEL: 'Cancelado',
  DELETE: 'Excluído',
  SIM_START: 'Simulação iniciada',
  SIM_STOP: 'Simulação pausada',
  SIM_PARAM_CHANGE: 'Parâmetro de simulação alterado',
  COMMENT: 'Comentário adicionado',
  ACKNOWLEDGE: 'Reconhecido',
  EXPORT: 'Exportado',
  IMPORT: 'Importado',
  CUTOFF: 'Cut-off executado',
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'text-emerald-600 dark:text-emerald-400',
  UPDATE: 'text-sky-600 dark:text-sky-400',
  STATUS_CHANGE: 'text-violet-600 dark:text-violet-400',
  SIM_PARAM_CHANGE: 'text-amber-600 dark:text-amber-400',
  DELETE: 'text-rose-600 dark:text-rose-400',
  CANCEL: 'text-rose-600 dark:text-rose-400',
  CLOSE: 'text-slate-600 dark:text-slate-400',
};

export const AuditTab: React.FC<{ movementId: string }> = ({ movementId }) => {
  const entries = useOmmStore(useShallow((s) => s.auditLog.filter((a) => a.entityId === movementId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))));

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Auditoria — {entries.length} registros
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-8">
          <ClipboardList className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <div className="text-sm text-slate-400">Nenhuma ação registrada</div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
            >
              <div className="shrink-0 mt-0.5">
                <div className={`text-[10px] font-bold ${ACTION_COLORS[entry.action] ?? 'text-slate-500'}`}>
                  {ACTION_LABELS[entry.action] ?? entry.action}
                </div>
                <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                  {entry.source}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-slate-600 dark:text-slate-300">{entry.description}</div>
                {entry.field && (
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Campo: <span className="font-semibold">{entry.field}</span>
                    {entry.oldValue && <> · Anterior: <span className="text-rose-500">{entry.oldValue}</span></>}
                    {entry.newValue && <> · Novo: <span className="text-emerald-500">{entry.newValue}</span></>}
                  </div>
                )}
                <div className="text-[9px] text-slate-400 mt-0.5">
                  por <span className="font-semibold">{entry.operator}</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[9px] font-mono text-slate-400">
                  {new Date(entry.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div className="text-[9px] font-mono text-slate-300 dark:text-slate-600">
                  {new Date(entry.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
