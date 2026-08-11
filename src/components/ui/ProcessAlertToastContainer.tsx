import React from 'react';
import { X } from 'lucide-react';
import { useProcessAlertStore } from '../../store/useProcessAlertStore';

export const ProcessAlertToastContainer: React.FC = () => {
  const activeToasts = useProcessAlertStore((s) => s.activeToasts);
  const removeToast = useProcessAlertStore((s) => s.removeToast);

  if (activeToasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm pointer-events-none">
      {activeToasts.map((toast) => {
        return (
          <div
            key={toast.id}
            style={{ borderLeftColor: toast.colorHighlight }}
            className="pointer-events-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 border-l-4 shadow-lg flex items-start justify-between gap-4 animate-in slide-in-from-bottom-5 fade-in duration-200 max-w-sm select-none"
          >
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 text-[10px] font-bold font-mono text-slate-400">
                <span>{toast.code}</span>
                {toast.isTest && (
                  <span className="px-1 py-0.2 bg-purple-600 text-white rounded text-[8px] tracking-widest font-sans font-bold">
                    TESTE
                  </span>
                )}
                <span className="font-sans font-normal text-[9px]">• {new Date(toast.activatedAt).toLocaleTimeString('pt-BR')}</span>
              </div>
              <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                {toast.name}
              </h5>
              <p className="text-[10px] text-slate-550 dark:text-slate-400 leading-normal">
                {toast.description}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-0.5 text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
