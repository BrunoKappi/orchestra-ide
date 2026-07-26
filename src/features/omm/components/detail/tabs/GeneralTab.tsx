import React from 'react';
import { useOmmStore } from '../../../store/useOmmStore';
import { StatusBadge, PriorityBadge, ProgressBar, AccuracyBar, FlowDisplay, VolumeDisplay, TimeDisplay, ProductDot } from '../../ui/OmmBadges';

interface FieldProps {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}

const Field: React.FC<FieldProps> = ({ label, value, mono }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wide">{label}</span>
    <span className={`text-[12px] text-slate-700 dark:text-slate-200 ${mono ? 'font-mono' : 'font-medium'}`}>
      {value}
    </span>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-4">
    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 px-4">{title}</div>
    <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-4">
      {children}
    </div>
  </div>
);

export const GeneralTab: React.FC<{ movementId: string }> = ({ movementId }) => {
  const movement = useOmmStore((s) => s.movements.find((m) => m.id === movementId));
  const order = useOmmStore((s) => movement ? s.orders.find((o) => o.id === movement.orderId) : null);
  const product = useOmmStore((s) => movement ? s.products.find((p) => p.id === movement.productId) : null);
  const area = useOmmStore((s) => movement ? s.areas.find((a) => a.id === movement.areaId) : null);
  const operator = useOmmStore((s) => movement ? s.operators.find((o) => o.id === movement.operatorId) : null);
  const origin = useOmmStore((s) => movement ? s.equipments.find((e) => e.id === movement.originId) : null);
  const dest = useOmmStore((s) => movement ? s.equipments.find((e) => e.id === movement.destinationId) : null);

  if (!movement) return null;

  const volRemaining = movement.plannedVolume - movement.currentVolume;

  return (
    <div className="py-3">
      <Section title="Identificação">
        <Field label="Número" value={<span className="font-mono font-bold text-sky-600 dark:text-sky-400">{movement.number}</span>} />
        <Field label="Ordem" value={<span className="font-mono text-slate-600 dark:text-slate-300">{order?.number ?? '—'}</span>} />
        <Field label="Status" value={<StatusBadge status={movement.status} />} />
        <Field label="Prioridade" value={<PriorityBadge priority={movement.priority} />} />
        <Field label="Tipo" value={movement.type} />
        <Field label="Categoria" value={movement.category} />
      </Section>

      <div className="border-t border-slate-100 dark:border-slate-800 my-2" />

      <Section title="Produto e Área">
        <Field label="Produto" value={product ? <ProductDot color={product.color} name={product.name} /> : '—'} />
        <Field label="Código" value={<span className="font-mono">{product?.code ?? '—'}</span>} />
        <Field label="Área Resp." value={area?.name ?? '—'} />
        <Field label="Operador" value={operator?.name ?? '—'} />
        <Field label="Método Med." value={movement.measurementMethod} />
        <Field label="Notas" value={movement.notes || '—'} />
      </Section>

      <div className="border-t border-slate-100 dark:border-slate-800 my-2" />

      <Section title="Rota">
        <Field label="Origem" value={<span className="font-mono font-bold">{origin?.tag ?? '—'}</span>} />
        <Field label="Destino" value={<span className="font-mono font-bold">{dest?.tag ?? '—'}</span>} />
        <div className="col-span-2">
          <Field label="Nome Origem" value={origin?.name ?? '—'} />
        </div>
        <div className="col-span-2">
          <Field label="Nome Destino" value={dest?.name ?? '—'} />
        </div>
      </Section>

      <div className="border-t border-slate-100 dark:border-slate-800 my-2" />

      <Section title="Quantidades">
        <Field label="Vol. Planejado" value={<VolumeDisplay value={movement.plannedVolume} unit="m³" />} />
        <Field label="Vol. Atual" value={<VolumeDisplay value={movement.currentVolume} unit="m³" />} />
        <Field label="Vol. Restante" value={<VolumeDisplay value={volRemaining} unit="m³" />} />
        <Field label="Massa Atual" value={<VolumeDisplay value={movement.currentMass} unit="t" />} />
        <div className="col-span-2">
          <Field label="Progresso" value={<ProgressBar value={movement.percentComplete} />} />
        </div>
      </Section>

      <div className="border-t border-slate-100 dark:border-slate-800 my-2" />

      <Section title="Desempenho">
        <Field label="Vazão Inst." value={<FlowDisplay value={movement.currentFlow} />} />
        <Field label="Vazão Média" value={<FlowDisplay value={movement.avgFlow} />} />
        <Field label="Vazão Plan." value={<FlowDisplay value={movement.plannedFlow} />} />
        <Field label="Accuracy" value={<AccuracyBar value={movement.accuracy} />} />
        <Field label="ETTC" value={movement.status === 'Active' && movement.ettcMin > 0 ? `${Math.round(movement.ettcMin)} min` : '—'} mono />
        <Field label="ETOC" value={<TimeDisplay iso={movement.etoc} />} />
      </Section>

      <div className="border-t border-slate-100 dark:border-slate-800 my-2" />

      <Section title="Timestamps">
        <Field label="Emissão" value={<TimeDisplay iso={movement.issuedAt} />} />
        <Field label="Ativação" value={<TimeDisplay iso={movement.activatedAt} />} />
        <Field label="Conclusão" value={<TimeDisplay iso={movement.completedAt} />} />
        <Field label="Fechamento" value={<TimeDisplay iso={movement.closedAt} />} />
        <Field label="Cancelamento" value={<TimeDisplay iso={movement.canceledAt} />} />
        <Field label="Atualização" value={<TimeDisplay iso={movement.lastUpdatedAt} />} />
      </Section>
    </div>
  );
};
