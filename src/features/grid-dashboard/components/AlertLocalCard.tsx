import React from 'react';
import { Bell, BellOff, CheckCircle, Clock, AlertTriangle, Info } from 'lucide-react';
import type { TankCardData } from '../types';
import { useProcessAlertStore } from '../../../store/useProcessAlertStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { cn } from '../../../utils/cn';
import type { ProcessAlertSeverity, ProcessAlertStatus } from '../../../types/processAlert';

interface AlertLocalCardProps {
  card: TankCardData;
  isSelected?: boolean;
  isViewMode?: boolean;
  onClick?: () => void;
}

const SEVERITY_CONFIG: Record<ProcessAlertSeverity, {
  label: string;
  bg: string;
  text: string;
  border: string;
  icon: React.ReactNode;
}> = {
  critical: {
    label: 'CRÍTICO',
    bg: 'bg-red-500/10 dark:bg-red-500/15',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500/30',
    icon: <AlertTriangle className="w-2.5 h-2.5" />,
  },
  important: {
    label: 'IMPORTANTE',
    bg: 'bg-pink-500/10 dark:bg-pink-500/15',
    text: 'text-pink-600 dark:text-pink-400',
    border: 'border-pink-500/30',
    icon: <AlertTriangle className="w-2.5 h-2.5" />,
  },
  attention: {
    label: 'ATENÇÃO',
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
    icon: <AlertTriangle className="w-2.5 h-2.5" />,
  },
  info: {
    label: 'INFO',
    bg: 'bg-sky-500/10 dark:bg-sky-500/15',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-500/30',
    icon: <Info className="w-2.5 h-2.5" />,
  },
};

const STATUS_CONFIG: Record<ProcessAlertStatus, {
  rowBg: string;
  opacity: string;
  pulseDot: string;
}> = {
  active_unacknowledged: {
    rowBg: 'hover:bg-red-50/40 dark:hover:bg-red-950/10',
    opacity: 'opacity-100',
    pulseDot: 'bg-red-500 animate-pulse',
  },
  active_acknowledged: {
    rowBg: 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
    opacity: 'opacity-90',
    pulseDot: 'bg-amber-400',
  },
  resolved: {
    rowBg: 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30',
    opacity: 'opacity-50',
    pulseDot: 'bg-emerald-500',
  },
  expired: {
    rowBg: 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30',
    opacity: 'opacity-40',
    pulseDot: 'bg-slate-400',
  },
};

function formatTimeShort(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Agora';
    if (diffMin < 60) return `${diffMin}m`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h`;
    return `${Math.floor(diffH / 24)}d`;
  } catch {
    return '—';
  }
}

export const AlertLocalCard: React.FC<AlertLocalCardProps> = ({
  card,
  isSelected = false,
  isViewMode = false,
  onClick,
}) => {
  const cfg = card.alertConfig;
  const occurrences = useProcessAlertStore((s) => s.occurrences);
  const acknowledgeAlert = useProcessAlertStore((s) => s.acknowledgeAlert);
  const currentUser = useAuthStore((s) => s.currentUser);

  if (!cfg) {
    return (
      <div
        className={cn(
          'flex-1 rounded-2xl border flex flex-col items-center justify-center p-4 text-center transition-all',
          isSelected
            ? 'border-sky-500 ring-2 ring-sky-500/20 bg-slate-50 dark:bg-[#1a1b1f]'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16171b]'
        )}
        onClick={onClick}
      >
        <Bell className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
        <p className="text-xs text-slate-400 dark:text-slate-500">Card de Alertas não configurado</p>
        {!isViewMode && <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">Clique para configurar</p>}
      </div>
    );
  }

  // Filter occurrences by scope
  const filtered = occurrences.filter((occ) => {
    // Scope filter
    if (cfg.scopeType === 'object' && cfg.scopeId) {
      if (occ.relatedObjectId !== cfg.scopeId) return false;
    } else if (cfg.scopeType === 'area' && cfg.scopeId) {
      if (!occ.responsibleAreas.includes(cfg.scopeId)) return false;
    }

    // Hide resolved unless configured to show
    if (!cfg.showResolved && (occ.status === 'resolved' || occ.status === 'expired')) {
      return false;
    }

    return true;
  });

  // Sort: active_unacknowledged first, then active_acknowledged, then resolved, by time desc
  const statusOrder: Record<ProcessAlertStatus, number> = {
    active_unacknowledged: 0,
    active_acknowledged: 1,
    resolved: 2,
    expired: 3,
  };
  const sorted = [...filtered].sort((a, b) => {
    const so = statusOrder[a.status] - statusOrder[b.status];
    if (so !== 0) return so;
    return new Date(b.activatedAt).getTime() - new Date(a.activatedAt).getTime();
  });

  const displayed = sorted.slice(0, cfg.maxItems);
  const activeUnackCount = filtered.filter((o) => o.status === 'active_unacknowledged').length;

  const accentColor = activeUnackCount > 0 ? '#ef4444' : '#10b981';

  return (
    <div
      className={cn(
        'flex-1 rounded-2xl border flex flex-col overflow-hidden transition-all duration-200 relative',
        isSelected && !isViewMode
          ? 'border-sky-500 ring-2 ring-sky-500/20'
          : 'border-slate-200 dark:border-slate-800',
        'bg-white dark:bg-[#16171b]'
      )}
      onClick={!isViewMode ? onClick : undefined}
    >
      {/* Accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-colors duration-300"
        style={{ backgroundColor: accentColor }}
      />

      {/* Header */}
      <div className="pl-4 pr-3 pt-3 pb-2 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Bell className="w-3 h-3 text-rose-500 shrink-0" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 font-mono">
              Alertas Locais
            </span>
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">
            {card.title}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
            {cfg.scopeType === 'all' ? 'Escopo global' : cfg.scopeName}
          </p>
        </div>

        {/* Badge: active unack count */}
        {activeUnackCount > 0 && (
          <div className="shrink-0 ml-2">
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-sm animate-pulse">
              {activeUnackCount}
            </span>
          </div>
        )}
        {activeUnackCount === 0 && displayed.length > 0 && (
          <BellOff className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-2" />
        )}
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-slate-100 dark:border-slate-800/60" />

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 px-4 text-slate-400 dark:text-slate-500">
            <CheckCircle className="w-6 h-6 mb-2 text-emerald-500 opacity-60" />
            <p className="text-[11px] font-medium">Nenhum alerta ativo</p>
            <p className="text-[10px] opacity-60 mt-0.5 text-center">
              {cfg.scopeType === 'all' ? 'Sistema sem alertas' : `${cfg.scopeName} sem alertas`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
            {displayed.map((occ) => {
              const sev = SEVERITY_CONFIG[occ.severity];
              const statusCfg = STATUS_CONFIG[occ.status];

              return (
                <div
                  key={occ.id}
                  className={cn(
                    'px-4 py-2 transition-colors',
                    statusCfg.rowBg,
                    statusCfg.opacity
                  )}
                >
                  <div className="flex items-start gap-2">
                    {/* Status dot */}
                    <div className="shrink-0 mt-1.5">
                      <span className={cn('inline-block w-1.5 h-1.5 rounded-full', statusCfg.pulseDot)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {/* Severity badge */}
                        <span className={cn(
                          'inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold border',
                          sev.bg, sev.text, sev.border
                        )}>
                          {sev.icon}
                          {sev.label}
                        </span>

                        {/* Code */}
                        <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 truncate">
                          {occ.code}
                        </span>

                        {/* Time */}
                        <div className="ml-auto flex items-center gap-0.5 text-[9px] text-slate-400 shrink-0">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTimeShort(occ.activatedAt)}
                        </div>
                      </div>

                      {/* Message */}
                      <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 leading-tight line-clamp-2">
                        {occ.name}
                      </p>

                      {/* Object/Movement */}
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate">
                          {occ.relatedObjectName || occ.relatedMovementNumber || '—'}
                        </span>

                        {/* Acknowledge button */}
                        {occ.status === 'active_unacknowledged' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              acknowledgeAlert(occ.id, currentUser?.name || 'Operador');
                            }}
                            className="shrink-0 ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 transition-colors cursor-pointer"
                            title="Reconhecer alerta"
                          >
                            Reconhecer
                          </button>
                        )}
                        {occ.status === 'active_acknowledged' && (
                          <span className="shrink-0 ml-2 text-[9px] text-amber-500 dark:text-amber-400 font-semibold">
                            Reconhecido
                          </span>
                        )}
                        {(occ.status === 'resolved' || occ.status === 'expired') && (
                          <span className="shrink-0 ml-2 text-[9px] text-emerald-500 font-semibold">
                            Encerrado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer: count */}
      {sorted.length > cfg.maxItems && (
        <div className="px-4 py-1.5 border-t border-slate-100 dark:border-slate-800/40 text-[9px] text-slate-400 dark:text-slate-500 text-center">
          +{sorted.length - cfg.maxItems} ocorrências não exibidas
        </div>
      )}
    </div>
  );
};
