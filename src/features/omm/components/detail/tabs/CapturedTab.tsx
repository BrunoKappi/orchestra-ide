import React from 'react';
import { useOmmStore } from '../../../store/useOmmStore';

interface CapturedRowProps {
  label: string;
  value: string;
  unit?: string;
  quality?: 'Good' | 'Bad' | 'Uncertain';
  highlight?: boolean;
}

const CapturedRow: React.FC<CapturedRowProps> = ({ label, value, unit, quality = 'Good', highlight }) => {
  const qualityColor = quality === 'Good' ? 'bg-emerald-500' : quality === 'Uncertain' ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg transition-colors ${highlight ? 'bg-sky-50/60 dark:bg-sky-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${qualityColor}`} />
        <span className="text-[11px] text-slate-600 dark:text-slate-400">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[12px] font-bold text-slate-700 dark:text-slate-200">{value}</span>
        {unit && <span className="text-[10px] text-slate-400">{unit}</span>}
      </div>
    </div>
  );
};

export const CapturedTab: React.FC<{ movementId: string }> = ({ movementId }) => {
  const movement = useOmmStore((s) => s.movements.find((m) => m.id === movementId));
  const origin = useOmmStore((s) => movement ? s.equipments.find((e) => e.id === movement.originId) : null);

  if (!movement) return null;

  const quality = movement.accuracy >= 99 ? 'Good' : movement.accuracy >= 97 ? 'Uncertain' : 'Bad';

  return (
    <div className="py-3">
      <div className="flex items-center justify-between px-4 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Variáveis Adquiridas
        </span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold
          ${quality === 'Good' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
            : quality === 'Uncertain' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
            : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'}`}>
          Qualidade: {quality}
        </span>
      </div>

      <div className="px-2 space-y-0.5">
        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-600 px-3 pb-1">Vazão & Volume</div>
        <CapturedRow label="Vazão Instantânea" value={movement.currentFlow.toFixed(2)} unit="m³/h" quality={movement.currentFlow > 0 ? 'Good' : 'Uncertain'} highlight />
        <CapturedRow label="Vazão Média" value={movement.avgFlow.toFixed(2)} unit="m³/h" />
        <CapturedRow label="Vazão Planejada" value={movement.plannedFlow.toFixed(2)} unit="m³/h" />
        <CapturedRow label="Volume Observado" value={movement.currentVolume.toFixed(2)} unit="m³" highlight />
        <CapturedRow label="Volume Corrigido (20°C)" value={movement.correctedVolume.toFixed(2)} unit="m³" highlight />
        <CapturedRow label="Fator VCF" value={movement.vcf.toFixed(5)} quality="Good" />
        <CapturedRow label="Massa Acumulada" value={movement.currentMass.toFixed(2)} unit="t" />
        <CapturedRow label="Estoque Inicial" value={movement.initialLevel.toFixed(1)} unit="%" />
        <CapturedRow label="Estoque Final" value={movement.finalLevel != null ? movement.finalLevel.toFixed(1) : '—'} unit="%" />

        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-600 px-3 pt-2 pb-1">Temperatura & Pressão</div>
        <CapturedRow label="Temperatura" value={movement.temperature.toFixed(2)} unit="°C" />
        <CapturedRow label="Pressão" value={movement.pressure.toFixed(3)} unit="kgf/cm²" />

        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-600 px-3 pt-2 pb-1">Densidade</div>
        <CapturedRow label="Densidade @ T°" value={movement.density.toFixed(2)} unit="kg/m³" />
        <CapturedRow label="Densidade @ 20°C" value={movement.density20.toFixed(2)} unit="kg/m³" />

        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-600 px-3 pt-2 pb-1">Qualidade de Medição</div>
        <CapturedRow label="Accuracy" value={movement.accuracy.toFixed(3)} unit="%" quality={quality} highlight />
        <CapturedRow label="% Concluído" value={movement.percentComplete.toFixed(1)} unit="%" />
        <CapturedRow label="ETTC" value={movement.ettcMin > 0 ? `${Math.round(movement.ettcMin)}` : '—'} unit={movement.ettcMin > 0 ? 'min' : ''} />

        {origin && (
          <>
            <div className="text-[9px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-600 px-3 pt-2 pb-1">Nível do Tanque Origem</div>
            <CapturedRow label={origin.tag} value={origin.currentLevel.toFixed(2)} unit="%" quality="Good" highlight />
            <CapturedRow label="Volume no Tanque" value={origin.currentVolume.toFixed(0)} unit="m³" />
          </>
        )}
      </div>
    </div>
  );
};
