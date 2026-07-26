import React, { useState, useEffect } from 'react';
import { useOmmStore } from '../../store/useOmmStore';
import { X } from 'lucide-react';
import type { OmmPriority, OmmStatus, MovementType, ProductCategory, MeasurementMethod } from '../../types';

export const MovementDialog: React.FC = () => {
  const isOpen = useOmmStore((s) => s.isMovementDialogOpen);
  const editingId = useOmmStore((s) => s.editingMovementId);
  const closeDialog = useOmmStore((s) => s.closeMovementDialog);
  const createMovement = useOmmStore((s) => s.createMovement);
  const updateMovement = useOmmStore((s) => s.updateMovement);
  const movements = useOmmStore((s) => s.movements);
  
  // Auxiliary records
  const orders = useOmmStore((s) => s.orders);
  const products = useOmmStore((s) => s.products);
  const areas = useOmmStore((s) => s.areas);
  const equipments = useOmmStore((s) => s.equipments);
  const alignments = useOmmStore((s) => s.alignments);
  const operators = useOmmStore((s) => s.operators);

  // Form states
  const [orderId, setOrderId] = useState('');
  const [number, setNumber] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<MovementType>('Transfer');
  const [category, setCategory] = useState<ProductCategory>('Refined');
  const [productId, setProductId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [originId, setOriginId] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [viaId, setViaId] = useState('');
  const [meterId, setMeterId] = useState('');
  const [alignmentId, setAlignmentId] = useState('');
  const [measurementMethod, setMeasurementMethod] = useState<MeasurementMethod>('FlowMeter');
  const [priority, setPriority] = useState<OmmPriority>('Normal');
  const [operatorId, setOperatorId] = useState('');
  const [status, setStatus] = useState<OmmStatus>('Issued');
  const [plannedVolume, setPlannedVolume] = useState(1000);
  const [plannedFlow, setPlannedFlow] = useState(100);
  const [plannedStartAt, setPlannedStartAt] = useState('');
  const [plannedEndAt, setPlannedEndAt] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingId) {
      const mov = movements.find((m) => m.id === editingId);
      if (mov) {
        setOrderId(mov.orderId);
        setNumber(mov.number);
        setDescription(mov.description);
        setType(mov.type);
        setCategory(mov.category);
        setProductId(mov.productId);
        setAreaId(mov.areaId);
        setOriginId(mov.originId);
        setDestinationId(mov.destinationId);
        setViaId(mov.viaId ?? '');
        setMeterId(mov.meterId ?? '');
        setAlignmentId(mov.alignmentId ?? '');
        setMeasurementMethod(mov.measurementMethod);
        setPriority(mov.priority);
        setOperatorId(mov.operatorId);
        setStatus(mov.status);
        setPlannedVolume(mov.plannedVolume);
        setPlannedFlow(mov.plannedFlow);
        setPlannedStartAt(mov.plannedStartAt ? mov.plannedStartAt.substring(0, 16) : '');
        setPlannedEndAt(mov.plannedEndAt ? mov.plannedEndAt.substring(0, 16) : '');
        setNotes(mov.notes);
      }
    } else {
      setOrderId(orders[0]?.id ?? '');
      setNumber(`MOV-${String(movements.length + 1).padStart(4, '0')}`);
      setDescription('');
      setType('Transfer');
      setCategory('Refined');
      setProductId(products[0]?.id ?? '');
      setAreaId(areas[0]?.id ?? '');
      setOriginId(equipments[0]?.id ?? '');
      setDestinationId(equipments[1]?.id ?? '');
      setViaId('');
      setMeterId('');
      setAlignmentId('');
      setMeasurementMethod('FlowMeter');
      setPriority('Normal');
      setOperatorId(operators[0]?.id ?? '');
      setStatus('Issued');
      setPlannedVolume(1000);
      setPlannedFlow(100);
      setPlannedStartAt(new Date().toISOString().substring(0, 16));
      setPlannedEndAt(new Date(Date.now() + 8 * 3600 * 1000).toISOString().substring(0, 16));
      setNotes('');
    }
  }, [editingId, isOpen, movements, orders, products, areas, equipments, operators]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!productId || !originId || !destinationId) {
      alert('Produto, Origem e Destino são obrigatórios!');
      return;
    }

    const payload = {
      orderId,
      number,
      description,
      type,
      category,
      productId,
      areaId,
      originId,
      destinationId,
      viaId: viaId || null,
      meterId: meterId || null,
      alignmentId: alignmentId || null,
      measurementMethod,
      priority,
      operatorId,
      status,
      plannedVolume: Number(plannedVolume),
      plannedMass: Number(plannedVolume) * 0.85, // estimate mass
      plannedFlow: Number(plannedFlow),
      simFlowRate: Number(plannedFlow),
      plannedStartAt: plannedStartAt ? new Date(plannedStartAt).toISOString() : null,
      plannedEndAt: plannedEndAt ? new Date(plannedEndAt).toISOString() : null,
      notes,
    };

    if (editingId) {
      updateMovement(editingId, payload);
    } else {
      createMovement(payload);
    }
    closeDialog();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {editingId ? 'Editar Movimento' : 'Novo Movimento'}
            </h3>
            <p className="text-[10px] text-slate-400">Configure a rota, produto, quantidade e planejamento temporal</p>
          </div>
          <button onClick={closeDialog} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            {/* Associated Order */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Ordem Relacionada</label>
              <select
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] outline-none text-slate-700 dark:text-slate-200"
              >
                <option value="">(Nenhuma ordem)</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>{o.number} - {o.description}</option>
                ))}
              </select>
            </div>

            {/* Movement Number */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Número do Movimento</label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] outline-none text-slate-700 dark:text-slate-200 font-mono"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo de Movimento</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MovementType)}
                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] outline-none text-slate-700 dark:text-slate-200"
              >
                <option value="Transfer">Transferência</option>
                <option value="Receipt">Recebimento</option>
                <option value="Dispatch">Expedição</option>
                <option value="Internal">Interno</option>
                <option value="Recirculation">Recirculação</option>
                <option value="Blending">Blending</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Categoria de Produto</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] outline-none text-slate-700 dark:text-slate-200"
              >
                <option value="Refined">Refinados</option>
                <option value="Crude">Cru</option>
                <option value="Intermediate">Intermediário</option>
                <option value="LPG">GLP</option>
                <option value="Chemical">Químico</option>
              </select>
            </div>

            {/* Product */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Produto</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] outline-none text-slate-700 dark:text-slate-200"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Area */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Área</label>
              <select
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] outline-none text-slate-700 dark:text-slate-200"
              >
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {/* Origin Equipment */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Equipamento de Origem</label>
              <select
                value={originId}
                onChange={(e) => setOriginId(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] outline-none text-slate-700 dark:text-slate-200"
              >
                {equipments.map((eq) => (
                  <option key={eq.id} value={eq.id}>{eq.tag} - {eq.name}</option>
                ))}
              </select>
            </div>

            {/* Destination Equipment */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Equipamento de Destino</label>
              <select
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] outline-none text-slate-700 dark:text-slate-200"
              >
                {equipments.map((eq) => (
                  <option key={eq.id} value={eq.id}>{eq.tag} - {eq.name}</option>
                ))}
              </select>
            </div>

            {/* Via (optional pump/manifold) */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Equipamento Via (Opcional)</label>
              <select
                value={viaId}
                onChange={(e) => setViaId(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] outline-none text-slate-700 dark:text-slate-200"
              >
                <option value="">Nenhum</option>
                {equipments.filter(e => e.type === 'Pump' || e.type === 'Manifold').map((eq) => (
                  <option key={eq.id} value={eq.id}>{eq.tag} - {eq.name}</option>
                ))}
              </select>
            </div>

            {/* Meter (optional flowmeter) */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Medidor (Opcional)</label>
              <select
                value={meterId}
                onChange={(e) => setMeterId(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] outline-none text-slate-700 dark:text-slate-200"
              >
                <option value="">Nenhum</option>
                {equipments.filter(e => e.type === 'FlowMeter').map((eq) => (
                  <option key={eq.id} value={eq.id}>{eq.tag} - {eq.name}</option>
                ))}
              </select>
            </div>

            {/* Alignment (optional alignment) */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Alinhamento (Opcional)</label>
              <select
                value={alignmentId}
                onChange={(e) => setAlignmentId(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] outline-none text-slate-700 dark:text-slate-200"
              >
                <option value="">Nenhum</option>
                {alignments.map((al) => (
                  <option key={al.id} value={al.id}>{al.code} - {al.name}</option>
                ))}
              </select>
            </div>

            {/* Measurement Method */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Método de Medição</label>
              <select
                value={measurementMethod}
                onChange={(e) => setMeasurementMethod(e.target.value as MeasurementMethod)}
                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] outline-none text-slate-700 dark:text-slate-200"
              >
                <option value="FlowMeter">Medidor de Vazão</option>
                <option value="TankGauging">Medição de Tanque (Gauging)</option>
                <option value="Manual">Manual</option>
                <option value="Calculated">Calculado</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as OmmPriority)}
                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] outline-none text-slate-700 dark:text-slate-200"
              >
                <option value="Low">Baixa</option>
                <option value="Normal">Normal</option>
                <option value="High">Alta</option>
                <option value="Critical">Crítica</option>
              </select>
            </div>

            {/* Operator */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Operador Responsável</label>
              <select
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] outline-none text-slate-700 dark:text-slate-200"
              >
                {operators.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OmmStatus)}
                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] outline-none text-slate-700 dark:text-slate-200"
              >
                <option value="Issued">Issued</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Closed">Closed</option>
                <option value="Canceled">Canceled</option>
              </select>
            </div>

            {/* Planned Volume */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Volume Planejado (m³)</label>
              <input
                type="number"
                value={plannedVolume}
                onChange={(e) => setPlannedVolume(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] outline-none text-slate-700 dark:text-slate-200 font-mono text-right"
              />
            </div>

            {/* Planned Flow */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Vazão Planejada (m³/h)</label>
              <input
                type="number"
                value={plannedFlow}
                onChange={(e) => setPlannedFlow(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] outline-none text-slate-700 dark:text-slate-200 font-mono text-right"
              />
            </div>

            {/* Planned Start */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Início Previsto</label>
              <input
                type="datetime-local"
                value={plannedStartAt}
                onChange={(e) => setPlannedStartAt(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] outline-none text-slate-700 dark:text-slate-200 font-mono"
              />
            </div>

            {/* Planned End */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Término Previsto</label>
              <input
                type="datetime-local"
                value={plannedEndAt}
                onChange={(e) => setPlannedEndAt(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] outline-none text-slate-700 dark:text-slate-200 font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Observações</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Digite notas e informações operacionais..."
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] outline-none text-slate-700 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <button
            onClick={closeDialog}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-sky-600 text-white rounded-xl text-[11px] font-bold hover:bg-sky-500 shadow-md shadow-sky-500/10 cursor-pointer"
          >
            Salvar Movimento
          </button>
        </div>
      </div>
    </div>
  );
};
