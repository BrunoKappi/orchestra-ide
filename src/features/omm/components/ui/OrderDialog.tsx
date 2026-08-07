import React, { useState, useEffect, useMemo } from 'react';
import { useOmmStore } from '../../store/useOmmStore';
import { SearchableSelect } from '../../../../components/ui/SearchableSelect';
import { X, Plus, Trash2 } from 'lucide-react';
import type { OmmPriority } from '../../types';

export const OrderDialog: React.FC = () => {
  const isOpen        = useOmmStore((s) => s.isOrderDialogOpen);
  const editingId     = useOmmStore((s) => s.editingOrderId);
  const closeDialog   = useOmmStore((s) => s.closeOrderDialog);
  const createOrder   = useOmmStore((s) => s.createOrder);
  const updateOrder   = useOmmStore((s) => s.updateOrder);
  const orders        = useOmmStore((s) => s.orders);

  const areas         = useOmmStore((s) => s.areas);
  const products      = useOmmStore((s) => s.products);
  const equipments    = useOmmStore((s) => s.equipments);
  const movementTypes = useOmmStore((s) => s.movementTypes);
  const securityUsers = useOmmStore((s) => s.securityUsers);
  const createMovement= useOmmStore((s) => s.createMovement);

  // Form states
  const [number, setNumber]           = useState('');
  const [description, setDescription] = useState('');
  const [areaId, setAreaId]           = useState('');
  const [priority, setPriority]       = useState<OmmPriority>('Normal');
  const [operatorId, setOperatorId]   = useState('');
  const [notes, setNotes]             = useState('');

  // Sub-movements state
  const [subMovements, setSubMovements] = useState<Array<{
    typeId: string;
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
        setAreaId(ord.areaId);
        setPriority(ord.priority);
        setOperatorId(ord.operatorId);
        setNotes(ord.notes);
      }
    } else {
      setNumber('');
      setDescription('');
      setAreaId(areas[0]?.id ?? '');
      setPriority('Normal');
      setOperatorId(securityUsers[0]?.id ?? '');
      setNotes('');
      setSubMovements([]);
    }
  }, [isOpen, editingId]);

  const handleAddSubMovement = () => {
    setSubMovements([
      ...subMovements,
      {
        typeId: movementTypes[0]?.id ?? '',
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

  const handleSubMovChange = (idx: number, field: string, val: any) => {
    setSubMovements(
      subMovements.map((sm, i) => {
        if (i !== idx) return sm;
        return { ...sm, [field]: val };
      })
    );
  };

  const handleSave = () => {
    if (!number || !areaId) {
      alert('Número e Área são obrigatórios.');
      return;
    }
    const orderData = {
      number,
      description,
      areaId,
      priority,
      operatorId,
      notes,
    };

    if (editingId) {
      updateOrder(editingId, orderData);
    } else {
      // Create order first
      const ordId = createOrder(orderData);
      // Create sub movements linked to this order
      subMovements.forEach((sm) => {
        createMovement({
          orderId: ordId,
          typeId: sm.typeId,
          productId: sm.productId,
          areaId,
          priority,
          operatorId,
          originId: sm.originId,
          destinationId: sm.destinationId,
          plannedVolume: Number(sm.plannedVolume),
          plannedFlow: Number(sm.plannedFlow),
        });
      });
    }
    closeDialog();
  };

  const inputCls = "w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] outline-none text-slate-800 dark:text-slate-200 focus:border-sky-500 shadow-sm";

  // Option Mappings
  const areaOptions = useMemo(() => [
    { value: '', label: 'Selecione a Área...' },
    ...areas.filter((a) => a.active).map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` })),
  ], [areas]);

  const priorityOptions = useMemo(() => [
    { value: 'Low', label: 'Baixa' },
    { value: 'Normal', label: 'Normal' },
    { value: 'High', label: 'Alta' },
    { value: 'Critical', label: 'Crítica' },
  ], []);

  const operatorOptions = useMemo(() => [
    { value: '', label: '— Sem Operador —' },
    ...securityUsers.map((u) => ({ value: u.id, label: `${u.name} (${u.role})` })),
  ], [securityUsers]);

  const typeOptions = useMemo(() => movementTypes.filter((t) => t.active).map((t) => ({
    value: t.id,
    label: t.name,
  })), [movementTypes]);

  const productOptions = useMemo(() => products.filter((p) => p.active).map((p) => ({
    value: p.id,
    label: `${p.code} — ${p.name}`,
    color: p.color,
  })), [products]);

  const equipOptions = useMemo(() => equipments.map((e) => ({
    value: e.id,
    label: `${e.tag} — ${e.name}`,
    subLabel: e.type,
    color: e.color,
  })), [equipments]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-250">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {editingId ? 'Editar Ordem de Movimentação' : 'Nova Ordem de Movimentação'}
            </h3>
            <p className="text-[10px] text-slate-550 dark:text-slate-400">Insira as informações básicas e adicione movimentos planejados</p>
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
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Número da Ordem</label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Descrição</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex. Movimentação de Nafta — Balanço Quinzenal"
                className={inputCls}
              />
            </div>

            {/* Area */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Área Responsável</label>
              <SearchableSelect
                value={areaId}
                onChange={(val: string) => setAreaId(val)}
                options={areaOptions}
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Prioridade</label>
              <SearchableSelect
                value={priority}
                onChange={(val: string) => setPriority(val as OmmPriority)}
                options={priorityOptions}
              />
            </div>

            {/* Operator */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Operador Responsável</label>
              <SearchableSelect
                value={operatorId}
                onChange={(val: string) => setOperatorId(val)}
                options={operatorOptions}
              />
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Observações</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas de instrução operacional..."
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>

          {/* Sub Movements Section (Create mode only) */}
          {!editingId && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Movimentos da Ordem</h4>
                  <p className="text-[10px] text-slate-550 dark:text-slate-400">Adicione os movimentos individuais que compõem esta ordem</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddSubMovement}
                  className="flex items-center gap-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-505 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors shadow-sm"
                >
                  <Plus className="w-3 h-3" />
                  Adicionar Movimento
                </button>
              </div>

              {subMovements.length === 0 ? (
                <div className="p-4 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 text-[11px]">
                  Nenhum movimento adicionado a esta ordem.
                </div>
              ) : (
                <div className="space-y-3">
                  {subMovements.map((sm, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 relative group">
                      <button
                        type="button"
                        onClick={() => handleRemoveSubMovement(idx)}
                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase">Movimento #{idx + 1}</div>
                      
                      {/* Grid containing submovements parameters */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-550 dark:text-slate-450 uppercase mb-0.5">Tipo</label>
                          <SearchableSelect
                            value={sm.typeId}
                            onChange={(val: string) => handleSubMovChange(idx, 'typeId', val)}
                            options={typeOptions}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-555 dark:text-slate-455 uppercase mb-0.5">Produto</label>
                          <SearchableSelect
                            value={sm.productId}
                            onChange={(val: string) => handleSubMovChange(idx, 'productId', val)}
                            options={productOptions}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-555 dark:text-slate-455 uppercase mb-0.5">Origem</label>
                          <SearchableSelect
                            value={sm.originId}
                            onChange={(val: string) => handleSubMovChange(idx, 'originId', val)}
                            options={equipOptions}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-555 dark:text-slate-455 uppercase mb-0.5">Destino</label>
                          <SearchableSelect
                            value={sm.destinationId}
                            onChange={(val: string) => handleSubMovChange(idx, 'destinationId', val)}
                            options={equipOptions}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-555 dark:text-slate-455 uppercase mb-0.5">Vol. Plan (m³)</label>
                          <input
                            type="number"
                            value={sm.plannedVolume}
                            onChange={(e) => handleSubMovChange(idx, 'plannedVolume', e.target.value)}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-555 dark:text-slate-455 uppercase mb-0.5">Vazão (m³/h)</label>
                          <input
                            type="number"
                            value={sm.plannedFlow}
                            onChange={(e) => handleSubMovChange(idx, 'plannedFlow', e.target.value)}
                            className={inputCls}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 shrink-0">
          <button
            type="button"
            onClick={closeDialog}
            className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-505 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-md shadow-sky-500/20"
          >
            Salvar Ordem
          </button>
        </div>
      </div>
    </div>
  );
};
