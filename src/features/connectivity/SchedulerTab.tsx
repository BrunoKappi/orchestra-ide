import React, { useState } from 'react';
import { Play, Pause, Plus, Trash2 } from 'lucide-react';
import { useConnectivityStore } from '../../store/useConnectivityStore';
import type { ConnectivitySchedule, ScheduleTriggerType } from '../../types/connectivity';
import { Modal } from '../../components/ui/Modal';

export const SchedulerTab: React.FC = () => {
  const {
    schedules,
    flows,
    toggleScheduleStatus,
    triggerScheduleNow,
    addSchedule,
    deleteSchedule,
  } = useConnectivityStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<ConnectivitySchedule>>({
    flowId: flows[0]?.id || '',
    triggerType: 'Fixed Interval',
    intervalSeconds: 5,
    cronExpression: '*/5 * * * *',
    description: 'Agendamento automático de sincronização',
  });

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-xs">
      {/* Top Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
        <div>
          <h2 className="font-bold text-sm text-slate-800 dark:text-slate-100">
            Scheduler & Agendamento de Pipelines
          </h2>
          <p className="text-[11px] text-slate-400">
            Gerencie gatilhos temporais (Cron, Intervalo, Timers) e eventos da plataforma
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold cursor-pointer shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo Agendamento</span>
        </button>
      </div>

      {/* Grid of Schedules Cards */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schedules.map((sched) => {
          const isActive = sched.status === 'Active';
          return (
            <div
              key={sched.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                isActive
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                  : 'bg-slate-100/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                    {sched.flowName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {sched.status}
                  </span>
                </div>

                <p className="text-slate-500 dark:text-slate-400 text-[11px] mb-3">
                  {sched.description}
                </p>

                <div className="space-y-1.5 text-[11px] font-mono bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tipo Gatilho:</span>
                    <span className="font-semibold text-sky-500">{sched.triggerType}</span>
                  </div>
                  {sched.cronExpression && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cron:</span>
                      <span className="font-bold text-amber-500">{sched.cronExpression}</span>
                    </div>
                  )}
                  {sched.intervalSeconds && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Intervalo:</span>
                      <span>A cada {sched.intervalSeconds}s</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Execuções:</span>
                    <span className="font-semibold">{sched.runCount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => triggerScheduleNow(sched.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors shadow-xs"
                >
                  <Play className="w-3 h-3" />
                  <span>Executar Agora</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleScheduleStatus(sched.id)}
                    className="p-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
                    title={isActive ? 'Pausar' : 'Ativar'}
                  >
                    {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => deleteSchedule(sched.id)}
                    className="p-1.5 border border-slate-200 dark:border-slate-700 hover:bg-rose-500/10 text-rose-500 rounded-lg"
                    title="Excluir Agendamento"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Novo Agendamento */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Novo Agendamento de Pipeline"
        subtitle="Configure um acionamento automático por tempo ou eventos"
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Selecione o Fluxo
            </label>
            <select
              value={formData.flowId}
              onChange={(e) => setFormData({ ...formData, flowId: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
            >
              {flows.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Gatilho
              </label>
              <select
                value={formData.triggerType}
                onChange={(e) => setFormData({ ...formData, triggerType: e.target.value as ScheduleTriggerType })}
                className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
              >
                <option value="Fixed Interval">Fixed Interval (Segundos)</option>
                <option value="Cron Expression">Cron Expression</option>
                <option value="Timer">Timer de Execução Única</option>
                <option value="System Event">Evento do Sistema</option>
                <option value="Alarm">Alarme Ativado</option>
                <option value="OMM Event">Movimento OMM</option>
                <option value="Cut-off Execution">Fechamento Cut-off</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Expressão Cron / Intervalo
              </label>
              <input
                type="text"
                value={formData.cronExpression}
                onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descrição
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                const flow = flows.find((f) => f.id === formData.flowId);
                addSchedule({
                  flowId: formData.flowId || '',
                  flowName: flow?.name || 'Pipeline Agendado',
                  triggerType: formData.triggerType || 'Fixed Interval',
                  cronExpression: formData.cronExpression,
                  intervalSeconds: 5,
                  status: 'Active',
                  runCount: 0,
                  description: formData.description || 'Novo agendamento',
                });
                setIsModalOpen(false);
              }}
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold shadow-xs"
            >
              Salvar Agendamento
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
