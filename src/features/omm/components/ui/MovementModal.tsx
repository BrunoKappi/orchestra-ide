import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useOmmStore } from '../../store/useOmmStore';
import type { OmmMovement, OmmStatus, OmmPriority } from '../../types';
import { SearchableSelect } from '../../../../components/ui/SearchableSelect';
import { TankFlowVisualizer } from '../detail/TankFlowVisualizer';
import { TankTelemetryModal } from './TankTelemetryModal';
import { TankTelemetryDashboard } from '../../../../components/ui/TankTelemetryDashboard';
import { TankGeometrySvg } from '../../../../components/TankGeometrySvg';
import {
  X, Save, Play, CheckCircle, XCircle, Archive,
  ArrowRight, Gauge, Settings, Info, Activity, ArrowLeftRight,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const PRIORITY_OPTIONS: { value: OmmPriority; label: string; color: string }[] = [
  { value: 'Low',      label: 'Baixa',   color: '#94a3b8' },
  { value: 'Normal',   label: 'Normal',  color: '#3b82f6' },
  { value: 'High',     label: 'Alta',    color: '#f59e0b' },
  { value: 'Critical', label: 'Crítica', color: '#ef4444' },
];

const STATUS_LABELS: Record<OmmStatus, string> = {
  Issued:    'Emitido',
  Active:    'Ativo',
  Completed: 'Concluído',
  Closed:    'Fechado',
  Canceled:  'Cancelado',
};

const STATUS_COLORS: Record<OmmStatus, string> = {
  Issued:    'text-slate-500 dark:text-slate-400',
  Active:    'text-emerald-600 dark:text-emerald-400',
  Completed: 'text-blue-600 dark:text-blue-400',
  Closed:    'text-violet-600 dark:text-violet-400',
  Canceled:  'text-rose-600 dark:text-rose-400',
};

// ---------------------------------------------------------------------------
// Tab types
// ---------------------------------------------------------------------------
type ModalTab = 'general' | 'movement' | 'flow' | 'comparison' | 'operation' | 'simulation' | 'previsibilidade';

const TABS: { id: ModalTab; label: string; icon: React.ReactNode }[] = [
  { id: 'general',        label: 'Geral',          icon: <Info className="w-3.5 h-3.5" /> },
  { id: 'movement',       label: 'Movimento',      icon: <ArrowRight className="w-3.5 h-3.5" /> },
  { id: 'flow',           label: 'Fluxo',          icon: <Activity className="w-3.5 h-3.5" /> },
  { id: 'comparison',     label: 'Comparação',     icon: <ArrowLeftRight className="w-3.5 h-3.5" /> },
  { id: 'previsibilidade', label: 'Previsibilidade', icon: <Gauge className="w-3.5 h-3.5" /> },
  { id: 'operation',      label: 'Operação',       icon: <Gauge className="w-3.5 h-3.5" /> },
  { id: 'simulation',     label: 'Simulação',      icon: <Settings className="w-3.5 h-3.5" /> },
];

// ---------------------------------------------------------------------------
// Field components
// ---------------------------------------------------------------------------
const FormField: React.FC<{
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}> = ({ label, required, children, hint }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
      {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <span className="text-[10px] text-slate-400 dark:text-slate-550">{hint}</span>}
  </div>
);

const inputCls = "w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-805 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition-colors shadow-sm";

// ---------------------------------------------------------------------------
// Info row for operation tab
// ---------------------------------------------------------------------------
const InfoRow: React.FC<{ label: string; value: React.ReactNode; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800">
    <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
    <span className={`text-xs font-semibold text-slate-800 dark:text-slate-200 ${mono ? 'font-mono' : ''}`}>{value}</span>
  </div>
);

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------
const ProgressBar: React.FC<{ pct: number }> = ({ pct }) => {
  const clamped = Math.min(100, Math.max(0, pct));
  const color = clamped >= 90 ? 'from-emerald-500 to-emerald-400' : clamped >= 50 ? 'from-sky-500 to-sky-400' : 'from-amber-500 to-amber-400';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-300`} style={{ width: `${clamped}%` }} />
      </div>
      <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 w-10 text-right">{clamped.toFixed(1)}%</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Modal
// ---------------------------------------------------------------------------
export const MovementModal: React.FC = () => {
  const isOpen        = useOmmStore((s) => s.isMovementModalOpen);
  const editingId     = useOmmStore((s) => s.editingMovementId);
  const closeModal    = useOmmStore((s) => s.closeMovementModal);

  const movements     = useOmmStore((s) => s.movements);
  const orders        = useOmmStore((s) => s.orders);
  const products      = useOmmStore((s) => s.products);
  const areas         = useOmmStore((s) => s.areas);
  const equipments    = useOmmStore((s) => s.equipments);
  const alignments    = useOmmStore((s) => s.alignments);
  const movementTypes = useOmmStore((s) => s.movementTypes);
  const engUnits      = useOmmStore((s) => s.engUnits);
  const securityUsers = useOmmStore((s) => s.securityUsers);

  const createMovement      = useOmmStore((s) => s.createMovement);
  const updateMovement      = useOmmStore((s) => s.updateMovement);
  const changeMovementStatus = useOmmStore((s) => s.changeMovementStatus);
  const toggleMovementPause = useOmmStore((s) => s.toggleMovementPause);
  const setMovementFlowRate = useOmmStore((s) => s.setMovementFlowRate);

  // ---- Form state ----
  const [activeTab, setActiveTab]         = useState<ModalTab>('general');
  const [orderId, setOrderId]             = useState('');
  const [description, setDescription]    = useState('');
  const [typeId, setTypeId]               = useState('');
  const [productId, setProductId]         = useState('');
  const [areaId, setAreaId]               = useState('');
  const [priority, setPriority]           = useState<OmmPriority>('Normal');
  const [operatorId, setOperatorId]       = useState('');
  const [originId, setOriginId]           = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [alignmentId, setAlignmentId]     = useState('');
  const [plannedVolume, setPlannedVolume] = useState(1000);
  const [plannedFlow, setPlannedFlow]     = useState(100);
  const [engUnitId, setEngUnitId]         = useState('unit-m3');
  const [notes, setNotes]                 = useState('');
  const [simFlowRate, setSimFlowRate]     = useState(100);
  const [dirty, setDirty]                 = useState(false);

  // State to trigger the interactive telemetry modal
  const [telemetryTankId, setTelemetryTankId] = useState<string | null>(null);

  // Current movement (for edit mode, always fresh from store)
  const currentMovement = movements.find((m) => m.id === editingId) ?? null;

  // ---- Populate form on open ----
  useEffect(() => {
    if (!isOpen) return;
    setActiveTab('general');
    setDirty(false);
    setTelemetryTankId(null);

    if (editingId && currentMovement) {
      setOrderId(currentMovement.orderId);
      setDescription(currentMovement.description);
      setTypeId(currentMovement.typeId);
      setProductId(currentMovement.productId);
      setAreaId(currentMovement.areaId);
      setPriority(currentMovement.priority);
      setOperatorId(currentMovement.operatorId);
      setOriginId(currentMovement.originId);
      setDestinationId(currentMovement.destinationId);
      setAlignmentId(currentMovement.alignmentId ?? '');
      setPlannedVolume(currentMovement.plannedVolume);
      setPlannedFlow(currentMovement.plannedFlow);
      setEngUnitId(currentMovement.engUnitId);
      setNotes(currentMovement.notes);
      setSimFlowRate(currentMovement.simFlowRate ?? currentMovement.plannedFlow ?? 100);
    } else {
      setOrderId(orders[0]?.id ?? '');
      setDescription('');
      setTypeId(movementTypes[0]?.id ?? '');
      setProductId(products[0]?.id ?? '');
      setAreaId(areas[0]?.id ?? '');
      setPriority('Normal');
      setOperatorId(securityUsers[0]?.id ?? '');
      setOriginId(equipments[0]?.id ?? '');
      setDestinationId(equipments[1]?.id ?? '');
      setAlignmentId('');
      setPlannedVolume(1000);
      setPlannedFlow(100);
      setEngUnitId('unit-m3');
      setNotes('');
      setSimFlowRate(100);
    }
  }, [isOpen, editingId]);

  useEffect(() => {
    if (isOpen && currentMovement && !dirty) {
      setSimFlowRate(currentMovement.simFlowRate ?? currentMovement.plannedFlow ?? 100);
    }
  }, [isOpen, currentMovement?.simFlowRate, dirty]);

  const mark = useCallback(() => setDirty(true), []);

  const handleSave = () => {
    if (!alignmentId) {
      alert('Alinhamento é obrigatório.');
      return;
    }
    if (!productId) {
      alert('Produto é obrigatório.');
      return;
    }
    const payload: Partial<OmmMovement> = {
      orderId,
      description,
      typeId,
      productId,
      areaId,
      priority,
      operatorId,
      originId,
      destinationId,
      alignmentId,
      plannedVolume,
      plannedFlow,
      engUnitId,
      notes,
      simFlowRate: simFlowRate || plannedFlow,
    };
    if (editingId) {
      updateMovement(editingId, payload);
    } else {
      createMovement(payload);
    }
    setDirty(false);
    closeModal();
  };

  // Convert items to SearchableSelect options format
  const orderOptions = useMemo(() => [
    { value: '', label: '— Sem Ordem —' },
    ...orders.map((o: any) => ({ value: o.id, label: `${o.number} — ${o.description}` })),
  ], [orders]);

  const typeOptions = useMemo(() => [
    { value: '', label: 'Selecione...' },
    ...movementTypes.filter((t) => t.active).map((t) => ({ value: t.id, label: t.name })),
  ], [movementTypes]);

  const productOptions = useMemo(() => [
    { value: '', label: 'Selecione...' },
    ...products.filter((p) => p.active).map((p) => ({ value: p.id, label: `${p.code} — ${p.name}`, color: p.color })),
  ], [products]);

  const areaOptions = useMemo(() => [
    { value: '', label: 'Selecione...' },
    ...areas.filter((a) => a.active).map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` })),
  ], [areas]);

  const priorityOptions = useMemo(() => PRIORITY_OPTIONS.map((p) => ({
    value: p.value,
    label: p.label,
    color: p.color,
  })), []);

  const operatorOptions = useMemo(() => [
    { value: '', label: '— Sem Operador —' },
    ...securityUsers.map((u) => ({ value: u.id, label: `${u.name} (${u.role})` })),
  ], [securityUsers]);

  const alignmentOptions = useMemo(() => [
    { value: '', label: '— Nenhum —' },
    ...alignments.filter((a) => a.active).map((a) => ({ value: a.id, label: `${a.code} — ${a.name}`, color: a.color })),
  ], [alignments]);

  const unitOptions = useMemo(() => engUnits.filter((u) => u.active && u.category === 'Volume').map((u) => ({
    value: u.id,
    label: u.symbol,
  })), [engUnits]);

  if (!isOpen) return null;

  const isEditMode = !!editingId && !!currentMovement;
  const canActivate  = isEditMode && currentMovement.status === 'Issued';
  const canComplete  = isEditMode && currentMovement.status === 'Active';
  const canClose     = isEditMode && currentMovement.status === 'Completed';
  const canCancel    = isEditMode && (currentMovement.status === 'Issued' || currentMovement.status === 'Active');

  // Business Rule: Disable route editing (Origin & Destination) if the movement is not in "Issued" state
  const cannotChangeRoute = isEditMode && currentMovement.status !== 'Issued';

  const currentUnit = engUnits.find((u) => u.id === engUnitId);

  // ---- General Tab ----
  const renderGeneral = () => (
    <div className="grid grid-cols-2 gap-4 p-5">
      <FormField label="Ordem" required>
        <SearchableSelect
          value={orderId}
          onChange={(val: string) => { setOrderId(val); mark(); }}
          options={orderOptions}
        />
      </FormField>

      <FormField label="Tipo de Movimento" required>
        <SearchableSelect
          value={typeId}
          onChange={(val: string) => { setTypeId(val); mark(); }}
          options={typeOptions}
        />
      </FormField>

      <FormField label="Produto" required>
        <SearchableSelect
          value={productId}
          onChange={(val: string) => { setProductId(val); mark(); }}
          options={productOptions}
        />
      </FormField>

      <FormField label="Área Responsável">
        <SearchableSelect
          value={areaId}
          onChange={(val: string) => { setAreaId(val); mark(); }}
          options={areaOptions}
        />
      </FormField>

      <FormField label="Prioridade">
        <SearchableSelect
          value={priority}
          onChange={(val: string) => { setPriority(val as OmmPriority); mark(); }}
          options={priorityOptions}
        />
      </FormField>

      <FormField label="Operador Responsável">
        <SearchableSelect
          value={operatorId}
          onChange={(val: string) => { setOperatorId(val); mark(); }}
          options={operatorOptions}
        />
      </FormField>

      <div className="col-span-2">
        <FormField label="Descrição">
          <input
            type="text"
            className={inputCls}
            placeholder="Descreva o movimento..."
            value={description}
            onChange={(e) => { setDescription(e.target.value); mark(); }}
          />
        </FormField>
      </div>

      <div className="col-span-2">
        <FormField label="Observações">
          <textarea
            className={`${inputCls} resize-none h-20`}
            placeholder="Notas e observações operacionais..."
            value={notes}
            onChange={(e) => { setNotes(e.target.value); mark(); }}
          />
        </FormField>
      </div>
    </div>
  );

  // ---- Movement Tab ----
  const renderMovement = () => {
    const fromEq = equipments.find((e) => e.id === originId);
    const toEq   = equipments.find((e) => e.id === destinationId);

    return (
      <div className="grid grid-cols-2 gap-4 p-5">
        <div className="col-span-2">
          <FormField label="Alinhamento (Rota)" required>
            <SearchableSelect
              value={alignmentId}
              onChange={(val: string) => {
                setAlignmentId(val);
                const selectedAlign = alignments.find((a) => a.id === val);
                if (selectedAlign) {
                  setOriginId(selectedAlign.fromEquipmentId);
                  setDestinationId(selectedAlign.toEquipmentId);
                } else {
                  setOriginId('');
                  setDestinationId('');
                }
                mark();
              }}
              options={alignmentOptions}
              disabled={cannotChangeRoute}
            />
          </FormField>
        </div>

        {/* Read-only Origin display */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Origem (Preenchida pelo Alinhamento)
          </label>
          <input
            type="text"
            readOnly
            className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-500 dark:text-slate-400 focus:outline-none cursor-not-allowed"
            value={fromEq ? `${fromEq.tag} — ${fromEq.name}` : 'Nenhum alinhamento selecionado'}
          />
        </div>

        {/* Read-only Destination display */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Destino (Preenchida pelo Alinhamento)
          </label>
          <input
            type="text"
            readOnly
            className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-500 dark:text-slate-400 focus:outline-none cursor-not-allowed"
            value={toEq ? `${toEq.tag} — ${toEq.name}` : 'Nenhum alinhamento selecionado'}
          />
        </div>

        {originId && (
          <div
            onClick={() => setTelemetryTankId(originId)}
            className="bg-slate-50 dark:bg-slate-800/60 hover:bg-sky-500/5 dark:hover:bg-slate-800 hover:border-sky-500/30 rounded-lg p-3 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer group"
            title="Clique para ver telemetria"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Origem — {fromEq?.tag}</div>
              <span className="text-[9px] text-sky-600 dark:text-sky-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Detalhes</span>
            </div>
            <div className="space-y-1">
              {[
                ['Tipo', fromEq?.type],
                ['Nível', `${(fromEq?.currentLevel ?? 0).toFixed(1)}%`],
                ['Volume', `${(fromEq?.currentVolume ?? 0).toFixed(1)} m³`],
                ['Capacidade', `${(fromEq?.capacity ?? 0).toFixed(0)} m³`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">{label}</span>
                  <span className="text-slate-800 dark:text-slate-200 font-mono">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {destinationId && (
          <div
            onClick={() => setTelemetryTankId(destinationId)}
            className="bg-slate-50 dark:bg-slate-800/60 hover:bg-sky-500/5 dark:hover:bg-slate-800 hover:border-sky-500/30 rounded-lg p-3 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer group"
            title="Clique para ver telemetria"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Destino — {toEq?.tag}</div>
              <span className="text-[9px] text-sky-600 dark:text-sky-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Detalhes</span>
            </div>
            <div className="space-y-1">
              {[
                ['Tipo', toEq?.type],
                ['Nível', `${(toEq?.currentLevel ?? 0).toFixed(1)}%`],
                ['Volume', `${(toEq?.currentVolume ?? 0).toFixed(1)} m³`],
                ['Cap. Disponível', `${Math.max(0, (toEq?.capacity ?? 0) - (toEq?.currentVolume ?? 0)).toFixed(0)} m³`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">{label}</span>
                  <span className="text-slate-800 dark:text-slate-200 font-mono">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <FormField label="Quantidade Planejada" required hint={`Unidade: ${currentUnit?.symbol ?? 'm³'}`}>
          <div className="grid grid-cols-[1fr_100px] gap-2">
            <input
              type="number"
              min={0}
              step={100}
              className={inputCls}
              value={plannedVolume}
              onChange={(e) => { setPlannedVolume(parseFloat(e.target.value) || 0); mark(); }}
            />
            <SearchableSelect
              value={engUnitId}
              onChange={(val: string) => { setEngUnitId(val); mark(); }}
              options={unitOptions}
            />
          </div>
        </FormField>

        <FormField label="Vazão Planejada" hint="m³/h">
          <input
            type="number"
            min={0}
            step={10}
            className={inputCls}
            value={plannedFlow}
            onChange={(e) => { setPlannedFlow(parseFloat(e.target.value) || 0); mark(); }}
          />
        </FormField>
      </div>
    );
  };

  // ---- Flow View Tab ----
  const renderFlow = () => (
    <div className="p-5 h-full min-h-[360px]">
      <TankFlowVisualizer
        originId={originId}
        destinationId={destinationId}
        movementId={editingId}
      />
    </div>
  );

  // ---- Operation Tab ----
  const renderOperation = () => {
    if (!currentMovement) {
      return (
        <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
          Salve o movimento para visualizar dados de operação.
        </div>
      );
    }
    const volRemaining = Math.max(0, currentMovement.plannedVolume - currentMovement.currentVolume);
    const eta = currentMovement.currentFlow > 0
      ? (volRemaining / currentMovement.currentFlow * 60).toFixed(0)
      : null;

    return (
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className={`text-sm font-bold ${STATUS_COLORS[currentMovement.status]}`}>
            ● {STATUS_LABELS[currentMovement.status]}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{currentMovement.number}</div>
        </div>

        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">Progresso da Transferência</div>
          <ProgressBar pct={currentMovement.percentComplete} />
        </div>

        <div className="space-y-0">
          <InfoRow label="Volume Movido"   value={`${currentMovement.currentVolume.toFixed(1)} m³`} mono />
          <InfoRow label="Vol. Planejado"  value={`${currentMovement.plannedVolume.toFixed(1)} m³`} mono />
          <InfoRow label="Vol. Restante"   value={`${volRemaining.toFixed(1)} m³`} mono />
          <InfoRow label="Vazão Atual"     value={currentMovement.currentFlow > 0 ? `${currentMovement.currentFlow.toFixed(1)} m³/h` : '—'} mono />
          <InfoRow label="ETA"             value={eta ? `${eta} min` : '—'} mono />
        </div>

        <div className="space-y-0 pt-2 border-t border-slate-200 dark:border-slate-800">
          <InfoRow label="Criado em"      value={new Date(currentMovement.createdAt).toLocaleString('pt-BR')} />
          <InfoRow label="Concluído em"   value={currentMovement.completedAt ? new Date(currentMovement.completedAt).toLocaleString('pt-BR') : '—'} />
          <InfoRow label="Última atualiz." value={new Date(currentMovement.lastUpdatedAt).toLocaleString('pt-BR')} />
        </div>
      </div>
    );
  };

  // ---- Simulation Tab ----
  const renderSimulation = () => {
    if (!currentMovement) {
      return (
        <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
          Salve o movimento para configurar simulação.
        </div>
      );
    }
    return (
      <div className="p-5 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Vazão de Simulação" hint="m³/h — sobrescreve a planejada durante simulação">
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min={0}
                step={10}
                className={`${inputCls} flex-1`}
                value={simFlowRate}
                onChange={(e) => { setSimFlowRate(parseFloat(e.target.value) || 0); mark(); }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMovementFlowRate(currentMovement.id, simFlowRate);
                  setDirty(false);
                }}
                className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                Aplicar
              </button>
            </div>
          </FormField>

          <FormField label="Estado do Movimento nesta Simulação">
            <div className="flex items-center gap-3 py-2">
              <div className={`text-sm font-bold ${currentMovement.simPaused ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {currentMovement.simPaused ? '⏸ Pausado' : '▶ Ativo na Simulação'}
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleMovementPause(currentMovement.id);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm ${
                currentMovement.simPaused
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-white'
              }`}
            >
              {currentMovement.simPaused ? '▶ Retomar Simulação' : '⏸ Pausar Simulação'}
            </button>
          </FormField>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">Estado Atual da Simulação</div>
          <InfoRow label="Volume Simulado"  value={`${currentMovement.currentVolume.toFixed(1)} m³`} mono />
          <InfoRow label="Progresso"        value={`${currentMovement.percentComplete.toFixed(1)}%`} mono />
          <InfoRow label="Vazão Efetiva"    value={currentMovement.currentFlow > 0 ? `${currentMovement.currentFlow.toFixed(1)} m³/h` : '—'} mono />
          <InfoRow label="Pausado"          value={currentMovement.simPaused ? 'Sim' : 'Não'} />
        </div>
      </div>
    );
  };

  // ---- Telemetry Comparison Tab ----
  const renderComparison = () => {
    if (!originId || !destinationId) {
      return (
        <div className="p-8 text-center text-xs text-slate-400 font-mono italic">
          Selecione um equipamento de Origem e um equipamento de Destino no movimento para visualizar a comparação de telemetria em tempo real.
        </div>
      );
    }

    const originEq = equipments.find((e) => e.id === originId);
    const destEq = equipments.find((e) => e.id === destinationId);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 h-full overflow-hidden max-h-[75vh]">
        {/* Left: Origin Tank */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xs flex-1 min-h-[450px]">
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
              Equipamento de Origem
            </span>
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
              {originEq?.tag || originId}
            </span>
          </div>
          <div className="flex-1 overflow-hidden min-h-0">
            <TankTelemetryDashboard objectId={originId} compact={true} />
          </div>
        </div>

        {/* Right: Destination Tank */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xs flex-1 min-h-[450px]">
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Equipamento de Destino
            </span>
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
              {destEq?.tag || destinationId}
            </span>
          </div>
          <div className="flex-1 overflow-hidden min-h-0">
            <TankTelemetryDashboard objectId={destinationId} compact={true} />
          </div>
        </div>
      </div>
    );
  };

  // ---- Previsibilidade Tab ----
  const renderPrevisibilidade = () => {
    if (!originId || !destinationId) {
      return (
        <div className="p-8 text-center text-xs text-slate-400 font-mono italic">
          Selecione Origem e Destino para calcular a previsibilidade do movimento.
        </div>
      );
    }

    const originEq = equipments.find((e) => e.id === originId);
    const destEq = equipments.find((e) => e.id === destinationId);

    if (!originEq || !destEq) {
      return (
        <div className="p-8 text-center text-xs text-slate-400 font-mono italic">
          Equipamentos não encontrados.
        </div>
      );
    }

    // Planned flow rate or current flow rate (use simFlowRate first, then plannedFlow)
    const currentFlowRate = simFlowRate || plannedFlow || 100;
    const currentMoved = currentMovement ? currentMovement.currentVolume : 0;
    const remainingToMove = Math.max(0, plannedVolume - currentMoved);

    // Remaining time in hours
    const hoursRemaining = currentFlowRate > 0 ? remainingToMove / currentFlowRate : 0;
    const minutesRemaining = Math.round(hoursRemaining * 60);
    const formatTimeRemaining = () => {
      if (currentFlowRate <= 0) return 'Infinito (Sem Vazão)';
      const hrs = Math.floor(minutesRemaining / 60);
      const mins = minutesRemaining % 60;
      if (hrs > 0) return `${hrs}h ${mins}min`;
      return `${mins} min`;
    };

    // Calculate final levels and volumes
    // Origin will DECREASE by remainingToMove
    const finalOriginVol = Math.max(0, originEq.currentVolume - remainingToMove);
    const finalOriginLevel = (finalOriginVol / originEq.capacity) * 100;

    // Destination will INCREASE by remainingToMove
    const finalDestVol = Math.min(destEq.capacity, destEq.currentVolume + remainingToMove);
    const finalDestLevel = (finalDestVol / destEq.capacity) * 100;

    // Product name
    const productObj = products.find((p) => p.id === productId);
    const prodColor = productObj ? productObj.color : '#3b82f6';

    return (
      <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Vazão e Tempo */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-2xs">
            <div>
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Parâmetros de Simulação</span>
              <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100 mt-1">Tempo e Velocidade</h4>
            </div>
            <div className="my-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Vazão Atual:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{currentFlowRate} m³/h</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Falta Transferir:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{remainingToMove.toFixed(1)} m³</span>
              </div>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-500">Tempo Restante:</span>
              <span className="text-sm font-bold text-sky-600 dark:text-sky-400 font-mono">{formatTimeRemaining()}</span>
            </div>
          </div>

          {/* Card 2: Origem Final */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-2xs">
            <div>
              <span className="text-[9px] uppercase tracking-wider font-bold text-rose-500">Origem final estimada</span>
              <h4 className="text-sm font-bold text-slate-855 dark:text-slate-100 mt-1">{originEq.tag}</h4>
            </div>
            <div className="my-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Volume Inicial:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{originEq.currentVolume.toFixed(1)} m³ ({originEq.currentLevel.toFixed(1)}%)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Volume Final Est.:</span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-450">{finalOriginVol.toFixed(1)} m³ ({finalOriginLevel.toFixed(1)}%)</span>
              </div>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-800 pt-2">
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, finalOriginLevel))}%` }} />
              </div>
            </div>
          </div>

          {/* Card 3: Destino Final */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-2xs">
            <div>
              <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-500">Destino final estimado</span>
              <h4 className="text-sm font-bold text-slate-855 dark:text-slate-100 mt-1">{destEq.tag}</h4>
            </div>
            <div className="my-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Volume Inicial:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{destEq.currentVolume.toFixed(1)} m³ ({destEq.currentLevel.toFixed(1)}%)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Volume Final Est.:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-450">{finalDestVol.toFixed(1)} m³ ({finalDestLevel.toFixed(1)}%)</span>
              </div>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-800 pt-2">
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, finalDestLevel))}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Visual comparison of levels */}
        <div className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-550 mb-4">Comparativo Visual de Níveis (Atual vs. Final Estimado)</h4>
          <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
            {/* Origin Tank Visual */}
            <div className="flex flex-col items-center p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-rose-500 mb-2">ORIGEM: {originEq.tag}</span>
              <div className="flex gap-4 items-center justify-center my-2">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-slate-400 font-mono">Atual</span>
                  <div className="w-16 h-24 bg-slate-100 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 p-0.5 flex items-center justify-center relative mt-1">
                    <TankGeometrySvg
                      geometry={originEq.type === 'Sphere' ? 'spherical' : originEq.type === 'Vessel' ? 'pressurized' : 'vertical_cylindrical'}
                      levelPercent={originEq.currentLevel}
                      fillColor={prodColor}
                      width={45}
                      height={75}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold mt-1 text-slate-700 dark:text-slate-300">{originEq.currentLevel.toFixed(0)}%</span>
                </div>
                <div className="text-slate-300 dark:text-slate-700 font-bold">➔</div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-slate-400 font-mono">Final</span>
                  <div className="w-16 h-24 bg-slate-100 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 p-0.5 flex items-center justify-center relative mt-1">
                    <TankGeometrySvg
                      geometry={originEq.type === 'Sphere' ? 'spherical' : originEq.type === 'Vessel' ? 'pressurized' : 'vertical_cylindrical'}
                      levelPercent={finalOriginLevel}
                      fillColor="#f43f5e"
                      width={45}
                      height={75}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold mt-1 text-rose-500">{finalOriginLevel.toFixed(0)}%</span>
                </div>
              </div>
            </div>

            {/* Destination Tank Visual */}
            <div className="flex flex-col items-center p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-emerald-500 mb-2">DESTINO: {destEq.tag}</span>
              <div className="flex gap-4 items-center justify-center my-2">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-slate-400 font-mono">Atual</span>
                  <div className="w-16 h-24 bg-slate-100 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 p-0.5 flex items-center justify-center relative mt-1">
                    <TankGeometrySvg
                      geometry={destEq.type === 'Sphere' ? 'spherical' : destEq.type === 'Vessel' ? 'pressurized' : 'vertical_cylindrical'}
                      levelPercent={destEq.currentLevel}
                      fillColor={prodColor}
                      width={45}
                      height={75}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold mt-1 text-slate-700 dark:text-slate-300">{destEq.currentLevel.toFixed(0)}%</span>
                </div>
                <div className="text-slate-300 dark:text-slate-700 font-bold">➔</div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-slate-400 font-mono">Final</span>
                  <div className="w-16 h-24 bg-slate-100 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 p-0.5 flex items-center justify-center relative mt-1">
                    <TankGeometrySvg
                      geometry={destEq.type === 'Sphere' ? 'spherical' : destEq.type === 'Vessel' ? 'pressurized' : 'vertical_cylindrical'}
                      levelPercent={finalDestLevel}
                      fillColor="#10b981"
                      width={45}
                      height={75}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold mt-1 text-emerald-500">{finalDestLevel.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
      >
        <div className="relative w-full max-w-6xl h-[85vh] max-h-[900px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                  {isEditMode ? currentMovement.number : 'NOVO MOVIMENTO'}
                </span>
                {isEditMode && (
                  <span className={`text-xs font-bold ${STATUS_COLORS[currentMovement.status]}`}>
                    ● {STATUS_LABELS[currentMovement.status]}
                  </span>
                )}
                {dirty && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-100 dark:bg-amber-400/10 px-2 py-0.5 rounded-full">
                    Não salvo
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {isEditMode ? 'Editar Movimento' : 'Criar Novo Movimento'}
              </div>
            </div>
            <button
              onClick={closeModal}
              className="p-1.5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 shrink-0 px-2">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-semibold border-b-2 transition-all cursor-pointer ${
                    isActive
                      ? 'border-sky-500 text-sky-600 dark:text-sky-400 bg-white dark:bg-sky-500/5'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto min-h-[300px]">
             {activeTab === 'general'    && renderGeneral()}
            {activeTab === 'movement'   && renderMovement()}
            {activeTab === 'flow'       && renderFlow()}
            {activeTab === 'comparison' && renderComparison()}
            {activeTab === 'previsibilidade' && renderPrevisibilidade()}
            {activeTab === 'operation'  && renderOperation()}
            {activeTab === 'simulation' && renderSimulation()}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 shrink-0 gap-3">
            <div className="flex items-center gap-2">
              {canCancel && (
                <button
                  onClick={() => { changeMovementStatus(editingId!, 'Canceled'); closeModal(); }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-400/10 hover:bg-rose-100 dark:hover:bg-rose-400/20 rounded-lg transition-colors cursor-pointer border border-rose-200 dark:border-rose-400/20"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Cancelar Movimento
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                Fechar
              </button>

              {canActivate && (
                <button
                  onClick={() => { changeMovementStatus(editingId!, 'Active'); }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-700/40 hover:bg-emerald-100 dark:hover:bg-emerald-700/60 rounded-lg transition-colors cursor-pointer border border-emerald-300 dark:border-emerald-600/30"
                >
                  <Play className="w-3.5 h-3.5" />
                  Ativar
                </button>
              )}

              {canComplete && (
                <button
                  onClick={() => { changeMovementStatus(editingId!, 'Completed'); }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-700/40 hover:bg-blue-100 dark:hover:bg-blue-700/60 rounded-lg transition-colors cursor-pointer border border-blue-300 dark:border-blue-600/30"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Completar
                </button>
              )}

              {canClose && (
                <button
                  onClick={() => { changeMovementStatus(editingId!, 'Closed'); }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-700/40 hover:bg-violet-100 dark:hover:bg-violet-700/60 rounded-lg transition-colors cursor-pointer border border-violet-300 dark:border-violet-600/30"
                >
                  <Archive className="w-3.5 h-3.5" />
                  Fechar
                </button>
              )}

              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors cursor-pointer shadow-md shadow-sky-500/20"
              >
                <Save className="w-3.5 h-3.5" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Telemetry Modal for Origin/Destination Tank Details */}
      <TankTelemetryModal
        isOpen={!!telemetryTankId}
        objectId={telemetryTankId}
        onClose={() => setTelemetryTankId(null)}
      />
    </>
  );
};
