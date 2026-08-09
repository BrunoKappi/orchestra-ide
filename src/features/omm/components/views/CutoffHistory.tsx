import React, { useState } from 'react';
import { useOmmStore } from '../../store/useOmmStore';
import {
  Clock, CheckCircle2, AlertCircle, Send, Play, Settings,
  ChevronDown, ChevronUp, Columns, X, Download,
} from 'lucide-react';
import type { CutoffStatus, OmmCutoffSnapshot } from '../../types';

// Export Cutoff to printable formatted PDF
function exportCutoffPdf(co: OmmCutoffSnapshot) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const invRowsHtml = co.inventoryByEquipment
    .map(
      (inv) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-weight:bold;">${inv.tag}</td>
      <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;font-family:monospace;">${inv.volume.toFixed(1)} m³</td>
      <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;font-family:monospace;">${(inv.mass / 1000).toFixed(2)} t</td>
      <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;font-family:monospace;">${inv.level.toFixed(1)}%</td>
    </tr>`
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Relatório de Fechamento (Cutoff) ${co.number}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #0f172a; line-height: 1.5; background: #ffffff; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: bold; color: #0f172a; }
          .subtitle { font-size: 11px; color: #64748b; margin-top: 2px; }
          .badge { display: inline-block; padding: 4px 12px; background: #e0f2fe; color: #0369a1; font-weight: bold; font-size: 12px; border-radius: 6px; font-family: monospace; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
          .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
          .kpi-title { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; }
          .kpi-value { font-size: 16px; font-weight: bold; color: #0f172a; font-family: monospace; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th { background: #f1f5f9; padding: 8px; text-align: left; font-size: 10px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; }
          .section-title { font-size: 13px; font-weight: bold; color: #334155; margin-top: 25px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">Relatório de Fechamento de Inventário (Cutoff)</div>
            <div class="subtitle">Orquestra IDE — Módulo OMM (Oil Movement & Management)</div>
          </div>
          <div>
            <span class="badge">${co.number}</span>
          </div>
        </div>

        <div style="font-size:12px;color:#475569;margin-bottom:15px;">
          <strong>Data/Hora de Execução:</strong> ${co.executedAt ? new Date(co.executedAt).toLocaleString('pt-BR') : 'Pendente'}<br/>
          <strong>Status do Snapshot:</strong> ${co.status} | <strong>Escopo:</strong> Planta Geral
        </div>

        <div class="grid">
          <div class="kpi-card">
            <div class="kpi-title">Volume Total</div>
            <div class="kpi-value">${co.totalVolume.toFixed(0)} m³</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Massa Total</div>
            <div class="kpi-value">${(co.totalMass / 1000).toFixed(2)} kt</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Movimentos Ativos</div>
            <div class="kpi-value">${co.movementsActive.length}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Cruzando Meia-Noite</div>
            <div class="kpi-value">${co.movementsCrossing.length}</div>
          </div>
        </div>

        <div class="section-title">Inventário Detalhado dos Tanques</div>
        <table>
          <thead>
            <tr>
              <th>Equipamento (Tag)</th>
              <th style="text-align:right;">Volume Armazenado</th>
              <th style="text-align:right;">Massa Efetiva</th>
              <th style="text-align:right;">Nível (%)</th>
            </tr>
          </thead>
          <tbody>
            ${invRowsHtml || '<tr><td colspan="4" style="text-align:center;padding:10px;color:#94a3b8;">Nenhum inventário disponível.</td></tr>'}
          </tbody>
        </table>

        ${co.notes ? `<div style="margin-top:20px;padding:10px;background:#f8fafc;border-left:3px solid #0284c7;font-size:11px;font-style:italic;"><strong>Observações:</strong> ${co.notes}</div>` : ''}

        <div style="margin-top:40px;padding-top:10px;border-top:1px solid #e2e8f0;text-align:center;font-size:10px;color:#94a3b8;">
          Documento gerado automaticamente pelo Sistema OMM — Orquestra IDE
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

// ─── Status config ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<CutoffStatus, { label: string; icon: React.ReactNode; color: string }> = {
  Open:      { label: 'Aberto',     icon: <Clock className="w-4 h-4" />,        color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50' },
  Locked:    { label: 'Bloqueado',  icon: <AlertCircle className="w-4 h-4" />,  color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/50' },
  Validated: { label: 'Validado',   icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50' },
  Sent:      { label: 'Enviado',    icon: <Send className="w-4 h-4" />,          color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50' },
};

// ─── Snapshot comparison ─────────────────────────────────────────────────────

interface CompareViewProps {
  a: OmmCutoffSnapshot;
  b: OmmCutoffSnapshot;
  onClose: () => void;
}

const CompareView: React.FC<CompareViewProps> = ({ a, b, onClose }) => {
  const rows = [
    { label: 'Volume Total (m³)', va: a.totalVolume.toFixed(0), vb: b.totalVolume.toFixed(0), delta: b.totalVolume - a.totalVolume },
    { label: 'Massa Total (t)', va: (a.totalMass / 1000).toFixed(2), vb: (b.totalMass / 1000).toFixed(2), delta: (b.totalMass - a.totalMass) / 1000 },
    { label: 'Movimentos Ativos', va: String(a.movementsActive.length), vb: String(b.movementsActive.length), delta: b.movementsActive.length - a.movementsActive.length },
    { label: 'Cruzando Meia-noite', va: String(a.movementsCrossing.length), vb: String(b.movementsCrossing.length), delta: b.movementsCrossing.length - a.movementsCrossing.length },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-[640px] max-h-[85vh] overflow-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100">Comparar Snapshots</div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <div className="p-5">
          {/* Header row */}
          <div className="grid grid-cols-4 gap-2 mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <div>Métrica</div>
            <div className="text-center">{a.number}</div>
            <div className="text-center">{b.number}</div>
            <div className="text-center">Δ Variação</div>
          </div>
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.label} className="grid grid-cols-4 gap-2 py-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                <div className="text-slate-500 font-medium">{r.label}</div>
                <div className="text-center font-mono text-slate-700 dark:text-slate-200">{r.va}</div>
                <div className="text-center font-mono text-slate-700 dark:text-slate-200">{r.vb}</div>
                <div className={`text-center font-mono font-bold ${r.delta > 0 ? 'text-emerald-600' : r.delta < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                  {r.delta > 0 ? `+${r.delta.toFixed(2)}` : r.delta.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Inventory comparison */}
          {a.inventoryByEquipment.length > 0 && b.inventoryByEquipment.length > 0 && (
            <div className="mt-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Inventário de Equipamentos</div>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <th className="px-3 py-1.5 text-left text-[10px] font-bold uppercase text-slate-400">Tag</th>
                      <th className="px-3 py-1.5 text-right text-[10px] font-bold uppercase text-slate-400">Vol {a.number}</th>
                      <th className="px-3 py-1.5 text-right text-[10px] font-bold uppercase text-slate-400">Vol {b.number}</th>
                      <th className="px-3 py-1.5 text-right text-[10px] font-bold uppercase text-slate-400">Δ (m³)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {a.inventoryByEquipment.map((ia) => {
                      const ib = b.inventoryByEquipment.find((x) => x.equipmentId === ia.equipmentId);
                      if (!ib) return null;
                      const delta = ib.volume - ia.volume;
                      return (
                        <tr key={ia.equipmentId} className="border-t border-slate-100 dark:border-slate-800">
                          <td className="px-3 py-1.5 font-mono font-bold text-slate-700 dark:text-slate-200">{ia.tag}</td>
                          <td className="px-3 py-1.5 text-right font-mono text-slate-500">{ia.volume.toFixed(0)}</td>
                          <td className="px-3 py-1.5 text-right font-mono text-slate-500">{ib.volume.toFixed(0)}</td>
                          <td className={`px-3 py-1.5 text-right font-mono font-bold ${delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                            {delta > 0 ? `+${delta.toFixed(0)}` : delta.toFixed(0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Cutoff Card ─────────────────────────────────────────────────────────────

interface CutoffCardProps {
  co: OmmCutoffSnapshot;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectForCompare: () => void;
  isSelectedForCompare: boolean;
}

const CutoffCard: React.FC<CutoffCardProps> = ({ co, isExpanded, onToggle, onSelectForCompare, isSelectedForCompare }) => {
  const cfg = STATUS_CONFIG[co.status];
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border overflow-hidden transition-all
      ${isSelectedForCompare ? 'border-sky-400 dark:border-sky-600 shadow-md shadow-sky-500/10' : 'border-slate-200 dark:border-slate-700'}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onSelectForCompare}
            title="Selecionar para comparar"
            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors cursor-pointer
              ${isSelectedForCompare ? 'bg-sky-500 border-sky-500' : 'border-slate-300 dark:border-slate-600 hover:border-sky-400'}`}
          >
            {isSelectedForCompare && <div className="w-2 h-2 bg-white rounded-sm" />}
          </button>
          <div>
            <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">{co.number}</span>
            <span className="ml-2 text-[11px] text-slate-400">
              {co.executedAt ? new Date(co.executedAt).toLocaleString('pt-BR') : 'Pendente'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Baixar PDF button */}
          <button
            onClick={() => exportCutoffPdf(co)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
            title="Baixar Cutoff em PDF formatado"
          >
            <Download className="w-3.5 h-3.5 text-sky-500" />
            <span>Baixar PDF</span>
          </button>
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${cfg.color}`}>
            {cfg.icon}
            {cfg.label}
          </span>
          <button onClick={onToggle} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-400">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 p-3">
        <div>
          <div className="text-[9px] text-slate-400 uppercase">Volume Total</div>
          <div className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">{co.totalVolume.toFixed(0)} m³</div>
        </div>
        <div>
          <div className="text-[9px] text-slate-400 uppercase">Massa Total</div>
          <div className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">{(co.totalMass / 1000).toFixed(2)} kt</div>
        </div>
        <div>
          <div className="text-[9px] text-slate-400 uppercase">Movimentos Ativos</div>
          <div className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">{co.movementsActive.length}</div>
        </div>
        <div>
          <div className="text-[9px] text-slate-400 uppercase">Cruzando Meia-noite</div>
          <div className={`font-mono text-sm font-bold ${co.movementsCrossing.length > 0 ? 'text-amber-500' : 'text-slate-700 dark:text-slate-200'}`}>
            {co.movementsCrossing.length}
          </div>
        </div>
      </div>

      {isExpanded && co.inventoryByEquipment.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-4 pb-3">
          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-2 mb-1.5">Inventário de Tanques</div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr>
                  <th className="text-left text-[9px] text-slate-400 pb-1">Tag</th>
                  <th className="text-right text-[9px] text-slate-400 pb-1">Volume (m³)</th>
                  <th className="text-right text-[9px] text-slate-400 pb-1">Massa (t)</th>
                  <th className="text-right text-[9px] text-slate-400 pb-1">Nível (%)</th>
                </tr>
              </thead>
              <tbody>
                {co.inventoryByEquipment.map((inv) => (
                  <tr key={inv.equipmentId} className="border-t border-slate-50 dark:border-slate-800/50">
                    <td className="py-1 font-mono text-slate-700 dark:text-slate-300">{inv.tag}</td>
                    <td className="py-1 text-right font-mono text-slate-500">{inv.volume.toFixed(0)}</td>
                    <td className="py-1 text-right font-mono text-slate-500">{(inv.mass / 1000).toFixed(2)}</td>
                    <td className="py-1 text-right font-mono text-slate-500">{inv.level.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {co.notes && (
        <div className="px-4 pb-3 text-[11px] text-slate-500 dark:text-slate-400 italic border-t border-slate-100 dark:border-slate-800 pt-2">
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
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export const CutoffHistory: React.FC = () => {
  const cutoffs = useOmmStore((s) => s.cutoffSnapshots);
  const simState = useOmmStore((s) => s.simulatorState);
  const executeManualCutoff = useOmmStore((s) => s.executeManualCutoff);
  // setCutoffHour is not yet implemented in the store — using no-op placeholder
  const setCutoffHour = (_hour: number) => {};

  const nextCutoff = simState.nextCutoffAt ? new Date(simState.nextCutoffAt as string) : null;
  const simNow = new Date(simState.simulatedTime);
  const hoursToNext = nextCutoff ? (nextCutoff.getTime() - simNow.getTime()) / 3_600_000 : null;

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [cutoffNotes, setCutoffNotes] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tempCutoffHour, setTempCutoffHour] = useState((simState as any).cutoffHour ?? 0);
  const [compareView, setCompareView] = useState<{ a: OmmCutoffSnapshot; b: OmmCutoffSnapshot } | null>(null);

  const handleToggleExpand = (id: string) => {
    setExpandedId((prev) => prev === id ? null : id);
  };

  const handleToggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const handleRunCompare = () => {
    if (compareIds.length !== 2) return;
    const a = cutoffs.find((c) => c.id === compareIds[0]);
    const b = cutoffs.find((c) => c.id === compareIds[1]);
    if (a && b) setCompareView({ a, b });
  };

  const handleManualCutoff = async () => {
    setIsExecuting(true);
    await new Promise((r) => setTimeout(r, 800)); // visual feedback
    executeManualCutoff(cutoffNotes);
    setCutoffNotes('');
    setIsExecuting(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shrink-0 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Histórico de Cut-off</span>
          <span className="ml-3 text-[10px] text-slate-400">{cutoffs.length} snapshots registrados</span>
        </div>
        <div className="flex items-center gap-2">
          {compareIds.length === 2 && (
            <button
              onClick={handleRunCompare}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-600 text-white text-[11px] font-bold hover:bg-sky-500 cursor-pointer transition-colors"
            >
              <Columns className="w-3.5 h-3.5" /> Comparar Selecionados
            </button>
          )}
          {compareIds.length > 0 && (
            <button
              onClick={() => setCompareIds([])}
              className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Limpar seleção
            </button>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-slate-400"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Settings panel */}
        {showSettings && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Configuração de Cut-off</div>
            <div className="flex items-center gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Horário do Corte Diário</label>
                <div className="flex items-center gap-2">
                  <select
                    value={tempCutoffHour}
                    onChange={(e) => setTempCutoffHour(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-200 outline-none focus:border-sky-500 font-mono"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setCutoffHour(tempCutoffHour)}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-[11px] font-bold hover:bg-sky-500 cursor-pointer transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Next cutoff card */}
        <div className="bg-gradient-to-r from-violet-50 to-white dark:from-violet-950/20 dark:to-slate-900 rounded-2xl border border-violet-200 dark:border-violet-800/50 p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-violet-500 mb-2">Próximo Cut-off</div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {nextCutoff
                  ? nextCutoff.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                  : 'Não configurado'
                }
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Horário configurado: {((simState as any).cutoffHour ?? 0).toString().padStart(2, '0')}:00 diariamente
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

          {/* Manual cutoff trigger */}
          <div className="mt-3 pt-3 border-t border-violet-200 dark:border-violet-800/30 flex items-center gap-3">
            <input
              value={cutoffNotes}
              onChange={(e) => setCutoffNotes(e.target.value)}
              placeholder="Observações para o cut-off manual (opcional)..."
              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] outline-none focus:border-sky-500"
            />
            <button
              onClick={handleManualCutoff}
              disabled={isExecuting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-[11px] font-bold hover:bg-violet-500 disabled:opacity-60 cursor-pointer transition-colors whitespace-nowrap"
            >
              {isExecuting ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Executando...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Executar Cut-off Agora
                </>
              )}
            </button>
          </div>
        </div>

        {/* Compare hint */}
        {compareIds.length > 0 && compareIds.length < 2 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/50 text-[11px] text-sky-600 dark:text-sky-400 font-semibold">
            <Columns className="w-3.5 h-3.5" />
            Selecione mais 1 snapshot para comparar ({2 - compareIds.length} restante)
          </div>
        )}

        {/* Cutoff list */}
        {cutoffs.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <div className="text-slate-400 font-medium">Nenhum snapshot registrado</div>
            <div className="text-[11px] text-slate-300 dark:text-slate-600 mt-1">
              Snapshots são gerados automaticamente no horário do cut-off ou manualmente
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {[...cutoffs].reverse().map((co) => (
              <CutoffCard
                key={co.id}
                co={co}
                isExpanded={expandedId === co.id}
                onToggle={() => handleToggleExpand(co.id)}
                onSelectForCompare={() => handleToggleCompare(co.id)}
                isSelectedForCompare={compareIds.includes(co.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Compare modal */}
      {compareView && (
        <CompareView
          a={compareView.a}
          b={compareView.b}
          onClose={() => setCompareView(null)}
        />
      )}
    </div>
  );
};
