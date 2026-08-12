import React, { useState } from 'react';
import { useOmmStore } from '../../store/useOmmStore';
import {
  Package2, MapPin, AlignLeft, Zap, Hash, Settings,
  Plus, Edit2, Trash2, Search, RefreshCw, X,
} from 'lucide-react';

type AdminSection =
  | 'products' | 'areas' | 'alignments'
  | 'movementtypes' | 'priorities' | 'engunits' | 'system';

const SECTIONS: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
  { id: 'products',      label: 'Produtos',          icon: <Package2 className="w-4 h-4" /> },
  { id: 'areas',         label: 'Áreas',             icon: <MapPin className="w-4 h-4" /> },
  { id: 'alignments',    label: 'Alinhamentos',      icon: <AlignLeft className="w-4 h-4" /> },
  { id: 'movementtypes', label: 'Tipos de Movimento',icon: <Zap className="w-4 h-4" /> },
  { id: 'priorities',    label: 'Prioridades',       icon: <Hash className="w-4 h-4" /> },
  { id: 'engunits',      label: 'Unidades Eng.',     icon: <Hash className="w-4 h-4" /> },
  { id: 'system',        label: 'Sistema',           icon: <Settings className="w-4 h-4" /> },
];

export const AdminPanel: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AdminSection>('products');
  const [search, setSearch]               = useState('');
  const [editingItem, setEditingItem]     = useState<any | null>(null);
  const [isNew, setIsNew]                 = useState(false);
  const [deleteError, setDeleteError]     = useState<string | null>(null);
  const [confirmReset, setConfirmReset]   = useState(false);

  const products      = useOmmStore((s) => s.products);
  const areas         = useOmmStore((s) => s.areas);
  const equipments    = useOmmStore((s) => s.equipments);
  const alignments    = useOmmStore((s) => s.alignments);
  const movementTypes = useOmmStore((s) => s.movementTypes);
  const priorities    = useOmmStore((s) => s.priorities);
  const engUnits      = useOmmStore((s) => s.engUnits);

  const deleteProduct      = useOmmStore((s) => s.deleteProduct);
  const deleteArea         = useOmmStore((s) => s.deleteArea);
  const deleteAlignment    = useOmmStore((s) => s.deleteAlignment);
  const deleteMovementType = useOmmStore((s) => s.deleteMovementType);
  const deletePriority     = useOmmStore((s) => s.deletePriority);
  const deleteEngUnit      = useOmmStore((s) => s.deleteEngUnit);

  const createProduct      = useOmmStore((s) => s.createProduct);
  const updateProduct      = useOmmStore((s) => s.updateProduct);
  const createArea         = useOmmStore((s) => s.createArea);
  const updateArea         = useOmmStore((s) => s.updateArea);
  const createAlignment    = useOmmStore((s) => s.createAlignment);
  const updateAlignment    = useOmmStore((s) => s.updateAlignment);
  const createMovementType = useOmmStore((s) => s.createMovementType);
  const updateMovementType = useOmmStore((s) => s.updateMovementType);
  const createPriority     = useOmmStore((s) => s.createPriority);
  const updatePriority     = useOmmStore((s) => s.updatePriority);
  const createEngUnit      = useOmmStore((s) => s.createEngUnit);
  const updateEngUnit      = useOmmStore((s) => s.updateEngUnit);

  const clearAll           = useOmmStore((s) => s.clearAll);
  const init               = useOmmStore((s) => s.init);

  const handleSaveItem = (data: any) => {
    if (isNew) {
      switch (activeSection) {
        case 'products':      createProduct(data); break;
        case 'areas':         createArea(data); break;
        case 'alignments':    createAlignment(data); break;
        case 'movementtypes': createMovementType(data); break;
        case 'priorities':    createPriority(data); break;
        case 'engunits':      createEngUnit(data); break;
      }
    } else {
      switch (activeSection) {
        case 'products':      updateProduct(editingItem.id, data); break;
        case 'areas':         updateArea(editingItem.id, data); break;
        case 'alignments':    updateAlignment(editingItem.id, data); break;
        case 'movementtypes': updateMovementType(editingItem.id, data); break;
        case 'priorities':    updatePriority(editingItem.id, data); break;
        case 'engunits':      updateEngUnit(editingItem.id, data); break;
      }
    }
    setEditingItem(null);
  };

  const handleResetData = () => {
    clearAll();
    init();
    setConfirmReset(false);
  };

  const handleDeleteItem = (id: string) => {
    let err: string | null = null;
    switch (activeSection) {
      case 'products':      err = deleteProduct(id); break;
      case 'areas':         err = deleteArea(id); break;
      case 'alignments':    err = deleteAlignment(id); break;
      case 'movementtypes': err = deleteMovementType(id); break;
      case 'priorities':    err = deletePriority(id); break;
      case 'engunits':      err = deleteEngUnit(id); break;
    }
    if (err) setDeleteError(err);
  };

  const renderTable = () => {
    const q = search.toLowerCase();

    if (activeSection === 'products') {
      const list = products.filter((p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
      return (
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3">Código</th>
              <th className="p-3">Nome</th>
              <th className="p-3">Densidade</th>
              <th className="p-3">Cor</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {list.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="p-3 font-mono font-bold text-sky-600 dark:text-sky-400">{item.code}</td>
                <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{item.name}</td>
                <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{item.density} kg/m³</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-700" style={{ backgroundColor: item.color }} />
                    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{item.color}</span>
                  </div>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.active ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                    {item.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => { setEditingItem(item); setIsNew(false); }} className="p-1 hover:text-sky-600 dark:hover:text-sky-400 text-slate-400"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDeleteItem(item.id)} className="p-1 hover:text-rose-600 dark:hover:text-rose-400 text-slate-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeSection === 'areas') {
      const list = areas.filter((a) => a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q));
      return (
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3">Código</th>
              <th className="p-3">Nome</th>
              <th className="p-3">Cor</th>
              <th className="p-3">Descrição</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {list.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="p-3 font-mono font-bold text-sky-600 dark:text-sky-400">{item.code}</td>
                <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{item.name}</td>
                <td className="p-3">
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700 shadow-sm shrink-0" style={{ backgroundColor: item.color || '#3b82f6' }} />
                    <span className="text-slate-600 dark:text-slate-400 font-semibold">{item.color || '#3b82f6'}</span>
                  </div>
                </td>
                <td className="p-3 text-slate-500 dark:text-slate-400 truncate max-w-xs">{item.description}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.active ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                    {item.active ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => { setEditingItem(item); setIsNew(false); }} className="p-1 hover:text-sky-600 dark:hover:text-sky-400 text-slate-400"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDeleteItem(item.id)} className="p-1 hover:text-rose-600 dark:hover:text-rose-400 text-slate-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeSection === 'alignments') {
      const list = alignments.filter((a) => a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q));
      return (
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3">Código</th>
              <th className="p-3">Nome</th>
              <th className="p-3">Origem</th>
              <th className="p-3">Destino</th>
              <th className="p-3">Disponível</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {list.map((item) => {
              const fromEq = equipments.find((e) => e.id === item.fromEquipmentId);
              const toEq   = equipments.find((e) => e.id === item.toEquipmentId);
              return (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-bold text-sky-600 dark:text-sky-400">{item.code}</td>
                  <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{item.name}</td>
                  <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{fromEq?.tag ?? item.fromEquipmentId}</td>
                  <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{toEq?.tag ?? item.toEquipmentId}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.available ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'}`}>
                      {item.available ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => { setEditingItem(item); setIsNew(false); }} className="p-1 hover:text-sky-600 dark:hover:text-sky-400 text-slate-400"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDeleteItem(item.id)} className="p-1 hover:text-rose-600 dark:hover:text-rose-400 text-slate-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    }

    if (activeSection === 'movementtypes') {
      const list = movementTypes.filter((t) => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q));
      return (
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3">Código</th>
              <th className="p-3">Nome</th>
              <th className="p-3">Categoria</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {list.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="p-3 font-mono font-bold text-sky-600 dark:text-sky-400">{item.code}</td>
                <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{item.name}</td>
                <td className="p-3 text-slate-500 dark:text-slate-400">{item.category}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.active ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                    {item.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => { setEditingItem(item); setIsNew(false); }} className="p-1 hover:text-sky-600 dark:hover:text-sky-400 text-slate-400"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDeleteItem(item.id)} className="p-1 hover:text-rose-600 dark:hover:text-rose-400 text-slate-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeSection === 'priorities') {
      const list = priorities.filter((p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
      return (
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3">Nível</th>
              <th className="p-3">Código</th>
              <th className="p-3">Nome</th>
              <th className="p-3">Cor</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {list.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{item.level}</td>
                <td className="p-3 font-mono text-sky-600 dark:text-sky-400 font-bold">{item.code}</td>
                <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{item.name}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{item.color}</span>
                  </div>
                </td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => { setEditingItem(item); setIsNew(false); }} className="p-1 hover:text-sky-600 dark:hover:text-sky-400 text-slate-400"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDeleteItem(item.id)} className="p-1 hover:text-rose-600 dark:hover:text-rose-400 text-slate-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeSection === 'engunits') {
      const list = engUnits.filter((u) => u.name.toLowerCase().includes(q) || u.symbol.toLowerCase().includes(q));
      return (
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3">Símbolo</th>
              <th className="p-3">Nome</th>
              <th className="p-3">Categoria</th>
              <th className="p-3">Decimais</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {list.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="p-3 font-mono font-bold text-sky-600 dark:text-sky-400">{item.symbol}</td>
                <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{item.name}</td>
                <td className="p-3 text-slate-500 dark:text-slate-400">{item.category}</td>
                <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{item.decimals}</td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => { setEditingItem(item); setIsNew(false); }} className="p-1 hover:text-sky-600 dark:hover:text-sky-400 text-slate-400"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDeleteItem(item.id)} className="p-1 hover:text-rose-600 dark:hover:text-rose-400 text-slate-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeSection === 'system') {
      return (
        <div className="p-6 max-w-xl space-y-6">
          <div className="bg-white dark:bg-slate-800/60 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Resetar Dados do OMM</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Reseta o repositório local do OMM para o estado inicial de seed, recriando as ordens e movimentos de demonstração.
              Esta ação limpa o localStorage do OMM e reinicia com dados integrados aos objetos do Orquestra.
            </p>
            {confirmReset ? (
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleResetData}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Confirmar Reset Completo
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-rose-600 hover:text-white text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-200 dark:border-slate-600"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Resetar para Dados de Demonstração
              </button>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sidebar navigation */}
      <div className="w-56 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-1 shrink-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-2">
          Administração OMM
        </div>
        {SECTIONS.map((sec) => {
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => { setActiveSection(sec.id); setSearch(''); setEditingItem(null); setDeleteError(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isActive
                  ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              {sec.icon}
              {sec.label}
            </button>
          );
        })}
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-950">
        {/* Top bar for table actions */}
        {activeSection !== 'system' && (
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
            <button
              onClick={() => { setEditingItem({}); setIsNew(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar
            </button>
          </div>
        )}

        {/* Delete error notification */}
        {deleteError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border-b border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center justify-between">
            <span>{deleteError}</span>
            <button onClick={() => setDeleteError(null)} className="p-1 hover:text-rose-900 dark:hover:text-rose-200"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Table view */}
        <div className="flex-1 overflow-y-auto">
          {renderTable()}
        </div>
      </div>

      {editingItem && (
        <AdminEditModal
          item={editingItem}
          isNew={isNew}
          section={activeSection}
          equipments={equipments}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveItem}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Edit Modal Subcomponent
// ---------------------------------------------------------------------------
interface AdminEditModalProps {
  item: any;
  isNew: boolean;
  section: AdminSection;
  equipments: any[];
  onClose: () => void;
  onSave: (data: any) => void;
}

const AdminEditModal: React.FC<AdminEditModalProps> = ({
  item,
  isNew,
  section,
  equipments,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<any>(() => {
    if (section === 'products') {
      return {
        code: item.code ?? '',
        name: item.name ?? '',
        description: item.description ?? '',
        density: item.density ?? 850,
        color: item.color ?? '#3b82f6',
        active: item.active ?? true,
      };
    }
    if (section === 'areas') {
      return {
        code: item.code ?? '',
        name: item.name ?? '',
        description: item.description ?? '',
        color: item.color ?? '#0ea5e9',
        active: item.active ?? true,
      };
    }
    if (section === 'alignments') {
      return {
        code: item.code ?? '',
        name: item.name ?? '',
        description: item.description ?? '',
        fromEquipmentId: item.fromEquipmentId ?? (equipments[0]?.id ?? ''),
        toEquipmentId: item.toEquipmentId ?? (equipments[0]?.id ?? ''),
        available: item.available ?? true,
        active: item.active ?? true,
      };
    }
    if (section === 'movementtypes') {
      return {
        code: item.code ?? '',
        name: item.name ?? '',
        category: item.category ?? 'Internal',
        color: item.color ?? '#6366f1',
        description: item.description ?? '',
        active: item.active ?? true,
      };
    }
    if (section === 'priorities') {
      return {
        level: item.level ?? 2,
        code: item.code ?? '',
        name: item.name ?? '',
        color: item.color ?? '#3b82f6',
        active: item.active ?? true,
      };
    }
    if (section === 'engunits') {
      return {
        symbol: item.symbol ?? 'm³',
        name: item.name ?? '',
        category: item.category ?? 'Volume',
        decimals: item.decimals ?? 1,
        factor: item.factor ?? 1,
        active: item.active ?? true,
      };
    }
    return {};
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shrink-0">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {isNew ? 'Adicionar' : 'Editar'} {
              section === 'products' ? 'Produto' :
              section === 'areas' ? 'Área' :
              section === 'alignments' ? 'Alinhamento' :
              section === 'movementtypes' ? 'Tipo de Movimento' :
              section === 'priorities' ? 'Prioridade' :
              section === 'engunits' ? 'Unidade de Eng.' : ''
            }
          </h3>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {section === 'products' && (
            <>
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Código</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Nome</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-sky-500 min-h-[60px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 dark:text-slate-400">Densidade (kg/m³)</label>
                  <input
                    type="number"
                    required
                    value={formData.density}
                    onChange={(e) => handleChange('density', parseFloat(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 dark:text-slate-400">Cor</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => handleChange('color', e.target.value)}
                      className="w-8 h-8 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => handleChange('color', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-850 dark:text-slate-100 font-mono text-[10px] focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {section === 'areas' && (
            <>
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Código</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Nome</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Cor de Identificação</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.color || '#0ea5e9'}
                    onChange={(e) => handleChange('color', e.target.value)}
                    className="w-8 h-8 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color || '#0ea5e9'}
                    onChange={(e) => handleChange('color', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-850 dark:text-slate-100 font-mono text-[10px] focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-sky-500 min-h-[60px]"
                />
              </div>
            </>
          )}

          {section === 'alignments' && (
            <>
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Código</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Nome</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Origem (Equipamento)</label>
                <select
                  value={formData.fromEquipmentId}
                  onChange={(e) => handleChange('fromEquipmentId', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                >
                  <option value="">Selecione...</option>
                  {equipments.map((eq) => (
                    <option key={eq.id} value={eq.id}>{eq.tag} - {eq.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Destino (Equipamento)</label>
                <select
                  value={formData.toEquipmentId}
                  onChange={(e) => handleChange('toEquipmentId', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                >
                  <option value="">Selecione...</option>
                  {equipments.map((eq) => (
                    <option key={eq.id} value={eq.id}>{eq.tag} - {eq.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.available}
                  onChange={(e) => handleChange('available', e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <label htmlFor="available" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">Disponível</label>
              </div>
            </>
          )}

          {section === 'movementtypes' && (
            <>
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Código</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Nome</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Categoria</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                >
                  <option value="Internal">Internal (Transferência)</option>
                  <option value="Import">Import (Recebimento)</option>
                  <option value="Export">Export (Expedição)</option>
                  <option value="Recirculation">Recirculation (Recirculação)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Cor</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleChange('color', e.target.value)}
                    className="w-8 h-8 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => handleChange('color', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-850 dark:text-slate-100 font-mono text-[10px] focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-sky-500 min-h-[60px]"
                />
              </div>
            </>
          )}

          {section === 'priorities' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 dark:text-slate-400">Nível (Order)</label>
                  <input
                    type="number"
                    required
                    value={formData.level}
                    onChange={(e) => handleChange('level', parseInt(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 dark:text-slate-400">Código</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => handleChange('code', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Nome</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Cor</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleChange('color', e.target.value)}
                    className="w-8 h-8 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => handleChange('color', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-850 dark:text-slate-100 font-mono text-[10px] focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </>
          )}

          {section === 'engunits' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 dark:text-slate-400">Símbolo</label>
                  <input
                    type="text"
                    required
                    value={formData.symbol}
                    onChange={(e) => handleChange('symbol', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 dark:text-slate-400">Nome</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Categoria</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                >
                  <option value="Volume">Volume</option>
                  <option value="Flow">Flow (Vazão)</option>
                  <option value="Mass">Mass (Massa)</option>
                  <option value="Temperature">Temperature</option>
                  <option value="Pressure">Pressure</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 dark:text-slate-400">Casas Decimais</label>
                  <input
                    type="number"
                    required
                    value={formData.decimals}
                    onChange={(e) => handleChange('decimals', parseInt(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 dark:text-slate-400">Fator de Conversão</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.factor}
                    onChange={(e) => handleChange('factor', parseFloat(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => handleChange('active', e.target.checked)}
              className="rounded border-slate-350 text-sky-600 focus:ring-sky-500"
            />
            <label htmlFor="active" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">Ativo</label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold transition-colors cursor-pointer shadow-sm shadow-sky-500/20"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

