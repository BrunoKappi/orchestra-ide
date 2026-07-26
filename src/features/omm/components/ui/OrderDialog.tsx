import React, { useState, useEffect } from 'react';
import { useOmmStore } from '../../store/useOmmStore';
import { X, Plus, Trash2 } from 'lucide-react';
import type { OmmPriority, OmmStatus } from '../../types';

export const OrderDialog: React.FC = () => {
  const isOpen = useOmmStore((s) => s.isOrderDialogOpen);
  const editingId = useOmmStore((s) => s.editingOrderId);
  const closeDialog = useOmmStore((s) => s.closeOrderDialog);
  const createOrder = useOmmStore((s) => s.createOrder);
  const updateOrder = useOmmStore((s) => s.updateOrder);
  const orders = useOmmStore((s) => s.orders);
  
  // Auxiliary records
  const areas = useOmmStore((s) => s.areas);
  const operators = useOmmStore((s) => s.operators);
  const products = useOmmStore((s) => s.products);
  const equipments = useOmmStore((s) => s.equipments);
  const createMovement = useOmmStore((s) => s.createMovement);

  // Form states
  const [number, setNumber] = useState('');
  const [description, setDescription] = useState('');
  const [areaId, setAreaId] = useState('');
  const [priority, setPriority] = useState<OmmPriority>('Normal');
  const [operatorId, setOperatorId] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<OmmStatus>('Issued');

  // Sub-movements state
  const [subMovements, setSubMovements] = useState<Array<{
    type: string;
    productId: string;
    originId: string;
    destinationId: string;
    plannedVolume: number;
    plannedFlow: number;
  }>>([]);

  useEffect(() => {
    if (editingId) {
      const ord = orders.find((o) => o.id === editingId);
      if (ord) {
        setNumber(ord.number);
        setDescription(ord.description);
        setAreaId(ord.area);
        setPriority(ord.priority);
        setOperatorId(ord.operator);
        setNotes(ord.notes);
        setStatus(ord.status);
      }
    } else {
      setNumber(`ORD-${String(orders.length + 1).padStart(3, '0')}`);
      setDescription('');
      setAreaId(areas[0]?.id ?? '');
      setPriority('Normal');
      setOperatorId(operators[0]?.id ?? '');
      setNotes('');
      setStatus('Issued');
      setSubMovements([]);
    }
  }, [editingId, isOpen, orders, areas, operators]);

  if (!isOpen) return null;

  const handleAddSubMovement = () => {
    setSubMovements([
      ...subMovements,
      {
        type: 'Transfer',
        productId: products[0]?.id ?? '',
        originId: equipments[0]?.id ?? '',
        destinationId: equipments[1]?.id ?? '',
        plannedVolume: 1000,
        plannedFlow: 100,
      },
    ]);
  };

  const handleRemoveSubMovement = (idx: number) => {
    setSubMovements(subMovements.filter((_, i) => i !== idx));
  };

  const handleSubMovChange = (idx: number, field: string, value: any) => {
    const updated = [...subMovements];
    updated[idx] = { ...updated[idx], [field]: value };
    setSubMovements(updated);
  };

  const handleSave = () => {
    if (!description) {
      alert('Descrição é obrigatória!');
      return;
    }

    const payload = {
      number,
      description,
      area: areaId,
      priority,
      operator: operatorId,
      notes,
      status,
    };

    if (editingId) {
      updateOrder(editingId, payload);
    } else {
      const newOrderId = createOrder(payload);
      // Create sub movements if any
      subMovements.forEach((sm) => {
        createMovement({
          orderId: newOrderId,
          type: sm.type as any,
          productId: sm.productId,
          areaId: areaId,
          originId: sm.originId,
          destinationId: sm.destinationId,
          plannedVolume: Number(sm.plannedVolume),
          plannedMass: Number(sm.plannedVolume) * 0.85,
          plannedFlow: Number(sm.plannedFlow),
          simFlowRate: Number(sm.plannedFlow),
          operatorId: operatorId,
          priority: priority,
          status: 'Issued',
        });
      });
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
              {editingId ? 'Editar Ordem de Movimentação' : 'Nova Ordem de Movimentação'}
            </h3>
            <p className="text-[10px] text-slate-400">Insira as informações básicas e adicione movimentos planejados</p>
          </div>
          <button onClick={closeDialog} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Number */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Número da Ordem</label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] outline-none text-slate-700 dark:text-slate-200 font-mono"
              />
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Descrição</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex. Descarga Navio Petróleo"
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] outline-none text-slate-700 dark:text-slate-200"
              />
            </div>

            {/* Area */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Área Responsável</label>
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

          {/* Sub movements section (Only for creation) */}
          {!editingId && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Movimentações Vinculadas ({subMovements.length})</span>
                <button
                  type="button"
                  onClick={handleAddSubMovement}
                  className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-sky-600 bg-sky-50 dark:bg-sky-950/20 dark:text-sky-400 rounded-lg border border-sky-100 dark:border-sky-900 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Movimento
                </button>
              </div>

              {subMovements.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-[10px]">
                  Nenhum movimento vinculado adicionado ainda. Salvar a ordem criará apenas os metadados.
                </div>
              ) : (
                <div className="space-y-2">
                  {subMovements.map((sm, index) => (
                    <div key={index} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px]">
                      {/* Type */}
                      <div className="w-24">
                        <select
                          value={sm.type}
                          onChange={(e) => handleSubMovChange(index, 'type', e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded outline-none text-slate-700 dark:text-slate-200"
                        >
                          <option value="Transfer">Transferência</option>
                          <option value="Receipt">Recebimento</option>
                          <option value="Dispatch">Expedição</option>
                          <option value="Internal">Interno</option>
                        </select>
                      </div>

                      {/* Product */}
                      <div className="w-28">
                        <select
                          value={sm.productId}
                          onChange={(e) => handleSubMovChange(index, 'productId', e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded outline-none text-slate-700 dark:text-slate-200"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Origin */}
                      <div className="w-24">
                        <select
                          value={sm.originId}
                          onChange={(e) => handleSubMovChange(index, 'originId', e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded outline-none text-slate-700 dark:text-slate-200"
                        >
                          {equipments.map((eq) => (
                            <option key={eq.id} value={eq.id}>{eq.tag}</option>
                          ))}
                        </select>
                      </div>

                      {/* Dest */}
                      <div className="w-24">
                        <select
                          value={sm.destinationId}
                          onChange={(e) => handleSubMovChange(index, 'destinationId', e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded outline-none text-slate-700 dark:text-slate-200"
                        >
                          {equipments.map((eq) => (
                            <option key={eq.id} value={eq.id}>{eq.tag}</option>
                          ))}
                        </select>
                      </div>

                      {/* Planned Vol */}
                      <div className="w-20">
                        <input
                          type="number"
                          value={sm.plannedVolume}
                          onChange={(e) => handleSubMovChange(index, 'plannedVolume', e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded outline-none font-mono text-right text-slate-700 dark:text-slate-200"
                        />
                      </div>

                      {/* Planned Flow */}
                      <div className="w-16">
                        <input
                          type="number"
                          value={sm.plannedFlow}
                          onChange={(e) => handleSubMovChange(index, 'plannedFlow', e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded outline-none font-mono text-right text-slate-700 dark:text-slate-200"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveSubMovement(index)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
            Salvar Ordem
          </button>
        </div>
      </div>
    </div>
  );
};
