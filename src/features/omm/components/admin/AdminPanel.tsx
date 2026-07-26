import React, { useState, useMemo, useRef } from 'react';
import { useOmmStore } from '../../store/useOmmStore';
import {
  Settings, Package2, MapPin, Cpu, Users, Database, RefreshCw, Trash2,
  Plus, Edit2, Copy, Download, Upload, Search, ChevronUp, ChevronDown,
  AlertTriangle, X, Check, Zap, AlignLeft, Gauge, Hash,
} from 'lucide-react';
import type {
  OmmProduct, OmmArea, OmmEquipment, OmmOperator, OmmAlignment,
  OmmUserGroup, OmmMovementTypeConfig, OmmPriorityConfig,
  OmmMeasurementMethodConfig, OmmEngUnitConfig,
} from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminSection =
  | 'products' | 'areas' | 'equipments' | 'operators'
  | 'alignments' | 'usergroups' | 'movementtypes'
  | 'priorities' | 'measurementmethods' | 'engunits' | 'system';

const SECTIONS: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
  { id: 'products',          label: 'Produtos',          icon: <Package2 className="w-4 h-4" /> },
  { id: 'areas',             label: 'Áreas',             icon: <MapPin className="w-4 h-4" /> },
  { id: 'equipments',        label: 'Equipamentos',      icon: <Cpu className="w-4 h-4" /> },
  { id: 'operators',         label: 'Operadores',        icon: <Users className="w-4 h-4" /> },
  { id: 'alignments',        label: 'Alinhamentos',      icon: <AlignLeft className="w-4 h-4" /> },
  { id: 'usergroups',        label: 'Grupos de Usuário', icon: <Users className="w-4 h-4" /> },
  { id: 'movementtypes',     label: 'Tipos de Movimento',icon: <Zap className="w-4 h-4" /> },
  { id: 'priorities',        label: 'Prioridades',       icon: <Hash className="w-4 h-4" /> },
  { id: 'measurementmethods',label: 'Métodos Med.',      icon: <Gauge className="w-4 h-4" /> },
  { id: 'engunits',          label: 'Unidades Eng.',     icon: <Hash className="w-4 h-4" /> },
  { id: 'system',            label: 'Sistema',           icon: <Settings className="w-4 h-4" /> },
];

// ─── Generic CRUD Table ──────────────────────────────────────────────────────

interface Column<T> {
  key: string;
  label: string;
  accessor: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  width?: number;
}

interface CrudTableProps<T extends { id: string }> {
  title: string;
  rows: T[];
  columns: Column<T>[];
  onAdd: () => void;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  onDuplicate?: (row: T) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  searchFields: (row: T) => string;
}

function CrudTable<T extends { id: string }>({
  title, rows, columns, onAdd, onEdit, onDelete, onDuplicate, onExport, onImport, searchFields,
}: CrudTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const PAGE_SIZE = 15;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = rows.filter((r) => searchFields(r).toLowerCase().includes(q));
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col?.sortValue) {
        list = [...list].sort((a, b) => {
          const av = col.sortValue!(a);
          const bv = col.sortValue!(b);
          const cmp = typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av).localeCompare(String(bv));
          return sortDir === 'asc' ? cmp : -cmp;
        });
      }
    }
    return list;
  }, [rows, search, sortKey, sortDir]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImport(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Table toolbar */}
      <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder={`Buscar em ${title}...`}
              className="pl-8 pr-3 py-1.5 w-52 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] outline-none focus:border-sky-500"
            />
          </div>
          <span className="text-[10px] text-slate-400">{filtered.length} registros</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-sky-600 text-white rounded-lg text-[11px] font-bold hover:bg-sky-500 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Novo
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> JSON
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
          >
            <Upload className="w-3.5 h-3.5" /> Importar
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-[11px] border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-50 dark:bg-slate-800/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortValue && handleSort(col.key)}
                  style={col.width ? { width: col.width } : undefined}
                  className={`px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-700 select-none
                    ${col.sortValue ? 'cursor-pointer hover:text-slate-600 dark:hover:text-slate-200' : ''}`}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (sortDir === 'asc'
                      ? <ChevronUp className="w-3 h-3" />
                      : <ChevronDown className="w-3 h-3" />
                    )}
                  </span>
                </th>
              ))}
              <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-700 w-28">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-10 text-slate-400 text-[11px]">
                  Nenhum registro encontrado
                </td>
              </tr>
            )}
            {pageRows.map((row, i) => (
              <tr
                key={row.id}
                className={`border-t border-slate-100 dark:border-slate-800 hover:bg-sky-50/40 dark:hover:bg-sky-950/10 transition-colors
                  ${i % 2 === 1 ? 'bg-slate-50/30 dark:bg-slate-800/10' : ''}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-2 text-slate-700 dark:text-slate-300">
                    {col.accessor(row)}
                  </td>
                ))}
                <td className="px-3 py-1.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(row)}
                      title="Editar"
                      className="p-1 rounded hover:bg-sky-100 dark:hover:bg-sky-900/30 text-slate-400 hover:text-sky-600 cursor-pointer transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {onDuplicate && (
                      <button
                        onClick={() => onDuplicate(row)}
                        title="Duplicar"
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => { setDeleteTarget(row); setDeleteError(null); }}
                      title="Excluir"
                      className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-2 shrink-0">
          <span className="text-[10px] text-slate-400">
            Página {page + 1} de {pages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2 py-0.5 rounded text-[10px] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
              disabled={page === pages - 1}
              className="px-2 py-0.5 rounded text-[10px] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Próximo →
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 w-80">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">Confirmar Exclusão</div>
                <div className="text-[11px] text-slate-400">Esta ação não pode ser desfeita.</div>
              </div>
            </div>
            {deleteError && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 text-[11px] text-rose-600 dark:text-rose-400">
                {deleteError}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const err = onDelete(deleteTarget) as unknown as string | null;
                  if (err) {
                    setDeleteError(err);
                  } else {
                    setDeleteTarget(null);
                    setDeleteError(null);
                  }
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-rose-600 text-white rounded-lg text-[11px] font-bold hover:bg-rose-500 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir
              </button>
              <button
                onClick={() => { setDeleteTarget(null); setDeleteError(null); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Simple Field Edit Modal ──────────────────────────────────────────────────

interface FieldDef {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'color' | 'select' | 'checkbox';
  options?: string[];
  required?: boolean;
}

interface EditModalProps {
  title: string;
  fields: FieldDef[];
  initial: Record<string, any>;
  onSave: (data: Record<string, any>) => void;
  onClose: () => void;
}

const EditModal: React.FC<EditModalProps> = ({ title, fields, initial, onSave, onClose }) => {
  const [form, setForm] = useState<Record<string, any>>({ ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    const errs: Record<string, string> = {};
    fields.forEach((f) => {
      if (f.required && !form[f.key]) errs[f.key] = 'Campo obrigatório';
    });
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 w-96 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {f.label}{f.required && <span className="text-rose-500 ml-0.5">*</span>}
              </label>
              {f.type === 'select' ? (
                <select
                  value={form[f.key] ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-200 outline-none focus:border-sky-500"
                >
                  {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === 'color' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form[f.key] ?? '#6366f1'}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="w-10 h-8 rounded cursor-pointer border border-slate-200"
                  />
                  <input
                    type="text"
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-200 outline-none focus:border-sky-500"
                  />
                </div>
              ) : f.type === 'checkbox' ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!form[f.key]}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">Ativado</span>
                </label>
              ) : (
                <input
                  type={f.type ?? 'text'}
                  value={form[f.key] ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-200 outline-none focus:border-sky-500"
                />
              )}
              {errors[f.key] && (
                <div className="text-[10px] text-rose-500 mt-0.5">{errors[f.key]}</div>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-sky-600 text-white rounded-lg text-[11px] font-bold hover:bg-sky-500 cursor-pointer transition-colors"
          >
            <Check className="w-3.5 h-3.5" /> Salvar
          </button>
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main AdminPanel ──────────────────────────────────────────────────────────

export const AdminPanel: React.FC = () => {
  const [section, setSection] = useState<AdminSection>('products');
  const [editTarget, setEditTarget] = useState<{ entity: any; isNew: boolean } | null>(null);

  const products = useOmmStore((s) => s.products);
  const areas = useOmmStore((s) => s.areas);
  const equipments = useOmmStore((s) => s.equipments);
  const operators = useOmmStore((s) => s.operators);
  const alignments = useOmmStore((s) => s.alignments);
  const userGroups = useOmmStore((s) => s.userGroups);
  const movementTypes = useOmmStore((s) => s.movementTypes);
  const priorities = useOmmStore((s) => s.priorities);
  const measurementMethods = useOmmStore((s) => s.measurementMethods);
  const engUnits = useOmmStore((s) => s.engUnits);

  const store = useOmmStore.getState;
  const clearAll = useOmmStore((s) => s.clearAll);
  const init = useOmmStore((s) => s.init);
  const refresh = useOmmStore((s) => s.refresh);
  const [confirmReset, setConfirmReset] = useState(false);

  // ─── Products ──────────────────────────────────────────────────────────────

  const productFields: FieldDef[] = [
    { key: 'name', label: 'Nome', required: true },
    { key: 'code', label: 'Código', required: true },
    { key: 'category', label: 'Categoria', type: 'select', options: ['Crude', 'Diesel', 'Gasolina', 'Nafta', 'GLP', 'Querosene', 'Fuel Oil', 'Outro'] },
    { key: 'color', label: 'Cor', type: 'color' },
    { key: 'density20', label: 'Densidade 20°C (kg/m³)', type: 'number' },
    { key: 'flashPoint', label: 'Ponto de Fulgor (°C)', type: 'number' },
    { key: 'viscosity', label: 'Viscosidade (cSt)', type: 'number' },
  ];

  const exportJson = (data: any[], name: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omm-${name}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const importJson = (file: File, handler: (data: any[]) => void) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const list = Array.isArray(data) ? data : data.items ?? [];
        handler(list);
        refresh();
      } catch { /* invalid json */ }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    clearAll();
    setTimeout(() => init(), 100);
    setConfirmReset(false);
  };

  const sectionTitle = SECTIONS.find((s) => s.id === section)?.label ?? '';

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-52 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col shrink-0">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Administração</div>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-semibold transition-colors cursor-pointer
                ${section === s.id
                  ? 'bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border-r-2 border-sky-500'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col p-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 shrink-0">
          {sectionTitle}
        </div>

        {/* ── Products ── */}
        {section === 'products' && (
          <CrudTable<OmmProduct>
            title="Produtos"
            rows={products}
            columns={[
              { key: 'color', label: '', accessor: (r) => <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />, width: 30 },
              { key: 'name', label: 'Nome', accessor: (r) => <span className="font-semibold">{r.name}</span>, sortValue: (r) => r.name },
              { key: 'code', label: 'Código', accessor: (r) => <span className="font-mono text-slate-400">{r.code}</span>, sortValue: (r) => r.code, width: 90 },
              { key: 'category', label: 'Categoria', accessor: (r) => r.category, sortValue: (r) => r.category, width: 100 },
              { key: 'density20', label: 'Densidade', accessor: (r) => <span className="font-mono">{r.density20} kg/m³</span>, sortValue: (r) => r.density20, width: 110 },
            ]}
            onAdd={() => setEditTarget({ entity: { name: '', code: '', category: 'Crude', color: '#6366f1', density20: 850 }, isNew: true })}
            onEdit={(r) => setEditTarget({ entity: r, isNew: false })}
            onDelete={(r) => store().deleteProduct(r.id) as any}
            onDuplicate={(r) => store().createProduct({ ...r, id: undefined as any, name: r.name + ' (cópia)', code: r.code + '_CPY' })}
            onExport={() => exportJson(products, 'products')}
            onImport={(f) => importJson(f, (list) => list.forEach((p) => store().createProduct(p)))}
            searchFields={(r) => `${r.name} ${r.code} ${r.category}`}
          />
        )}

        {/* ── Areas ── */}
        {section === 'areas' && (
          <CrudTable<OmmArea>
            title="Áreas"
            rows={areas}
            columns={[
              { key: 'color', label: '', accessor: (r) => <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />, width: 30 },
              { key: 'name', label: 'Nome', accessor: (r) => <span className="font-semibold">{r.name}</span>, sortValue: (r) => r.name },
              { key: 'code', label: 'Código', accessor: (r) => <span className="font-mono text-slate-400">{r.code}</span>, sortValue: (r) => r.code, width: 80 },
              { key: 'supervisor', label: 'Supervisor', accessor: (r) => r.supervisor, sortValue: (r) => r.supervisor, width: 140 },
              { key: 'description', label: 'Descrição', accessor: (r) => <span className="text-slate-400 truncate">{r.description}</span> },
            ]}
            onAdd={() => setEditTarget({ entity: { name: '', code: '', supervisor: '', description: '', color: '#10b981' }, isNew: true })}
            onEdit={(r) => setEditTarget({ entity: r, isNew: false })}
            onDelete={(r) => store().deleteArea(r.id) as any}
            onDuplicate={(r) => store().createArea({ ...r, id: undefined as any, name: r.name + ' (cópia)', code: r.code + '_C' })}
            onExport={() => exportJson(areas, 'areas')}
            onImport={(f) => importJson(f, (list) => list.forEach((a) => store().createArea(a)))}
            searchFields={(r) => `${r.name} ${r.code} ${r.supervisor} ${r.description}`}
          />
        )}

        {/* ── Equipments ── */}
        {section === 'equipments' && (
          <CrudTable<OmmEquipment>
            title="Equipamentos"
            rows={equipments}
            columns={[
              { key: 'tag', label: 'Tag', accessor: (r) => <span className="font-mono font-bold">{r.tag}</span>, sortValue: (r) => r.tag, width: 90 },
              { key: 'name', label: 'Nome', accessor: (r) => <span className="font-semibold">{r.name}</span>, sortValue: (r) => r.name },
              { key: 'type', label: 'Tipo', accessor: (r) => r.type, sortValue: (r) => r.type, width: 90 },
              { key: 'capacity', label: 'Cap. (m³)', accessor: (r) => <span className="font-mono text-right">{r.capacity > 0 ? r.capacity.toLocaleString() : '—'}</span>, sortValue: (r) => r.capacity, width: 90 },
              { key: 'currentLevel', label: 'Nível', accessor: (r) => r.capacity > 0 ? <span className="font-mono">{r.currentLevel.toFixed(1)}%</span> : <span className="text-slate-300">—</span>, width: 70 },
            ]}
            onAdd={() => setEditTarget({ entity: { tag: '', name: '', type: 'Tank', capacity: 10000, currentLevel: 50 }, isNew: true })}
            onEdit={(r) => setEditTarget({ entity: r, isNew: false })}
            onDelete={(r) => store().deleteEquipmentEntity(r.id) as any}
            onExport={() => exportJson(equipments, 'equipments')}
            onImport={(f) => importJson(f, (list) => list.forEach((e) => store().createEquipmentEntity(e)))}
            searchFields={(r) => `${r.tag} ${r.name} ${r.type}`}
          />
        )}

        {/* ── Operators ── */}
        {section === 'operators' && (
          <CrudTable<OmmOperator>
            title="Operadores"
            rows={operators}
            columns={[
              { key: 'name', label: 'Nome', accessor: (r) => (
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${r.isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                    {r.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                  </div>
                  <span className="font-semibold">{r.name}</span>
                </div>
              ), sortValue: (r) => r.name },
              { key: 'code', label: 'Código', accessor: (r) => <span className="font-mono text-slate-400">{r.code}</span>, sortValue: (r) => r.code, width: 80 },
              { key: 'role', label: 'Função', accessor: (r) => r.role, sortValue: (r) => r.role, width: 120 },
              { key: 'area', label: 'Área', accessor: (r) => r.area, sortValue: (r) => r.area, width: 120 },
              { key: 'isOnline', label: 'Status', accessor: (r) => (
                <span className={`text-[10px] font-bold ${r.isOnline ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {r.isOnline ? '● Online' : '○ Offline'}
                </span>
              ), width: 80 },
            ]}
            onAdd={() => setEditTarget({ entity: { name: '', code: '', role: 'Operador', area: '', isOnline: false }, isNew: true })}
            onEdit={(r) => setEditTarget({ entity: r, isNew: false })}
            onDelete={(r) => store().deleteOperator(r.id) as any}
            onDuplicate={(r) => store().createOperator({ ...r, id: undefined as any, name: r.name + ' (cópia)', code: r.code + '_C' })}
            onExport={() => exportJson(operators, 'operators')}
            onImport={(f) => importJson(f, (list) => list.forEach((o) => store().createOperator(o)))}
            searchFields={(r) => `${r.name} ${r.code} ${r.role} ${r.area}`}
          />
        )}

        {section === 'alignments' && (
          <CrudTable<OmmAlignment>
            title="Alinhamentos"
            rows={alignments}
            columns={[
              { key: 'code', label: 'Código', accessor: (r) => <span className="font-mono font-bold">{r.code}</span>, sortValue: (r) => r.code, width: 100 },
              { key: 'name', label: 'Descrição', accessor: (r) => r.name, sortValue: (r) => r.name },
              { key: 'description', label: 'Obs.', accessor: (r) => <span className="text-slate-400">{r.description}</span> },
              { key: 'active', label: 'Ativo', accessor: (r) => (
                <span className={`text-[10px] font-bold ${r.active ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {r.active ? '● Sim' : '○ Não'}
                </span>
              ), width: 60 },
            ]}
            onAdd={() => setEditTarget({ entity: { code: '', name: '', description: '', fromEquipmentId: '', toEquipmentId: '', viaEquipmentIds: [], active: true }, isNew: true })}
            onEdit={(r) => setEditTarget({ entity: r, isNew: false })}
            onDelete={(r) => store().deleteAlignment(r.id) as any}
            onExport={() => exportJson(alignments, 'alignments')}
            onImport={(f) => importJson(f, (list) => list.forEach((a) => store().createAlignment(a)))}
            searchFields={(r) => `${r.code} ${r.name}`}
          />
        )}

        {/* ── User Groups ── */}
        {section === 'usergroups' && (
          <CrudTable<OmmUserGroup>
            title="Grupos de Usuário"
            rows={userGroups}
            columns={[
              { key: 'name', label: 'Nome', accessor: (r) => <span className="font-semibold">{r.name}</span>, sortValue: (r) => r.name },
              { key: 'code', label: 'Código', accessor: (r) => <span className="font-mono text-slate-400">{r.code}</span>, width: 90 },
              { key: 'description', label: 'Descrição', accessor: (r) => <span className="text-slate-400">{r.description}</span> },
            ]}
            onAdd={() => setEditTarget({ entity: { name: '', code: '', description: '' }, isNew: true })}
            onEdit={(r) => setEditTarget({ entity: r, isNew: false })}
            onDelete={(r) => store().deleteUserGroup(r.id) as any}
            onExport={() => exportJson(userGroups, 'usergroups')}
            onImport={(f) => importJson(f, (list) => list.forEach((g) => store().createUserGroup(g)))}
            searchFields={(r) => `${r.name} ${r.code}`}
          />
        )}

        {/* ── Movement Types ── */}
        {section === 'movementtypes' && (
          <CrudTable<OmmMovementTypeConfig>
            title="Tipos de Movimento"
            rows={movementTypes}
            columns={[
              { key: 'color', label: '', accessor: (r) => <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />, width: 30 },
              { key: 'name', label: 'Nome', accessor: (r) => <span className="font-semibold">{r.name}</span>, sortValue: (r) => r.name },
              { key: 'code', label: 'Código', accessor: (r) => <span className="font-mono text-slate-400">{r.code}</span>, width: 90 },
              { key: 'description', label: 'Descrição', accessor: (r) => <span className="text-slate-400">{r.description}</span> },
            ]}
            onAdd={() => setEditTarget({ entity: { name: '', code: '', description: '', color: '#6366f1' }, isNew: true })}
            onEdit={(r) => setEditTarget({ entity: r, isNew: false })}
            onDelete={(r) => store().deleteMovementType(r.id) as any}
            onExport={() => exportJson(movementTypes, 'movementtypes')}
            onImport={(f) => importJson(f, (list) => list.forEach((t) => store().createMovementType(t)))}
            searchFields={(r) => `${r.name} ${r.code}`}
          />
        )}

        {/* ── Priorities ── */}
        {section === 'priorities' && (
          <CrudTable<OmmPriorityConfig>
            title="Prioridades"
            rows={priorities}
            columns={[
              { key: 'color', label: '', accessor: (r) => <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />, width: 30 },
              { key: 'name', label: 'Nome', accessor: (r) => <span className="font-semibold">{r.name}</span>, sortValue: (r) => r.name },
              { key: 'code', label: 'Código', accessor: (r) => <span className="font-mono text-slate-400">{r.code}</span>, width: 90 },
              { key: 'level', label: 'Nível', accessor: (r) => <span className="font-mono">{r.level}</span>, sortValue: (r) => r.level, width: 60 },
            ]}
            onAdd={() => setEditTarget({ entity: { name: '', code: '', level: 1, color: '#6366f1' }, isNew: true })}
            onEdit={(r) => setEditTarget({ entity: r, isNew: false })}
            onDelete={(r) => store().deletePriority(r.id) as any}
            onExport={() => exportJson(priorities, 'priorities')}
            onImport={(f) => importJson(f, (list) => list.forEach((p) => store().createPriority(p)))}
            searchFields={(r) => `${r.name} ${r.code}`}
          />
        )}

        {/* ── Measurement Methods ── */}
        {section === 'measurementmethods' && (
          <CrudTable<OmmMeasurementMethodConfig>
            title="Métodos de Medição"
            rows={measurementMethods}
            columns={[
              { key: 'name', label: 'Nome', accessor: (r) => <span className="font-semibold">{r.name}</span>, sortValue: (r) => r.name },
              { key: 'code', label: 'Código', accessor: (r) => <span className="font-mono text-slate-400">{r.code}</span>, width: 90 },
              { key: 'description', label: 'Descrição', accessor: (r) => <span className="text-slate-400">{r.description}</span> },
            ]}
            onAdd={() => setEditTarget({ entity: { name: '', code: '', description: '' }, isNew: true })}
            onEdit={(r) => setEditTarget({ entity: r, isNew: false })}
            onDelete={(r) => store().deleteMeasurementMethod(r.id) as any}
            onExport={() => exportJson(measurementMethods, 'measurementmethods')}
            onImport={(f) => importJson(f, (list) => list.forEach((m) => store().createMeasurementMethod(m)))}
            searchFields={(r) => `${r.name} ${r.code}`}
          />
        )}

        {/* ── Eng Units ── */}
        {section === 'engunits' && (
          <CrudTable<OmmEngUnitConfig>
            title="Unidades de Engenharia"
            rows={engUnits}
            columns={[
              { key: 'symbol', label: 'Símbolo', accessor: (r) => <span className="font-mono font-bold">{r.symbol}</span>, sortValue: (r) => r.symbol, width: 70 },
              { key: 'name', label: 'Nome', accessor: (r) => <span className="font-semibold">{r.name}</span>, sortValue: (r) => r.name },
              { key: 'dimension', label: 'Dimensão', accessor: (r) => <span className="text-slate-400">{r.dimension}</span>, sortValue: (r) => r.dimension, width: 110 },
            ]}
            onAdd={() => setEditTarget({ entity: { name: '', symbol: '', dimension: '' }, isNew: true })}
            onEdit={(r) => setEditTarget({ entity: r, isNew: false })}
            onDelete={(r) => store().deleteEngUnit(r.id) as any}
            onExport={() => exportJson(engUnits, 'engunits')}
            onImport={(f) => importJson(f, (list) => list.forEach((u) => store().createEngUnit(u)))}
            searchFields={(r) => `${r.name} ${r.symbol} ${r.dimension}`}
          />
        )}

        {/* ── System ── */}
        {section === 'system' && (
          <div className="space-y-4 max-w-lg">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-slate-400" />
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Banco de Dados (localStorage)</span>
              </div>
              <div className="grid grid-cols-2 gap-y-1.5 text-[11px]">
                {[
                  ['Ordens', useOmmStore.getState().orders.length],
                  ['Movimentos', useOmmStore.getState().movements.length],
                  ['Equipamentos', equipments.length],
                  ['Produtos', products.length],
                  ['Áreas', areas.length],
                  ['Operadores', operators.length],
                  ['Alinhamentos', alignments.length],
                  ['Grupos de Usuário', userGroups.length],
                  ['Tipos de Movimento', movementTypes.length],
                  ['Prioridades', priorities.length],
                  ['Métodos de Medição', measurementMethods.length],
                  ['Unidades de Eng.', engUnits.length],
                ].map(([label, val]) => (
                  <React.Fragment key={String(label)}>
                    <div className="text-slate-500">{label}:</div>
                    <div className="font-mono font-bold text-slate-700 dark:text-slate-200">{val}</div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-4 h-4 text-sky-400" />
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Recriar Dados de Demonstração</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">Apaga todos os dados e recria o conjunto de demonstração com ordens e movimentos fictícios.</p>
              {!confirmReset ? (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-[11px] font-bold hover:bg-sky-500 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Recriar Dados de Demo
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-500 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Confirmar Reset
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editTarget && section === 'products' && (
        <EditModal
          title={editTarget.isNew ? 'Novo Produto' : 'Editar Produto'}
          fields={productFields}
          initial={editTarget.entity}
          onSave={(data) => {
            if (editTarget.isNew) store().createProduct(data as any);
            else store().updateProduct(editTarget.entity.id, data as any);
            setEditTarget(null);
            refresh();
          }}
          onClose={() => setEditTarget(null)}
        />
      )}
      {editTarget && section === 'areas' && (
        <EditModal
          title={editTarget.isNew ? 'Nova Área' : 'Editar Área'}
          fields={[
            { key: 'name', label: 'Nome', required: true },
            { key: 'code', label: 'Código', required: true },
            { key: 'color', label: 'Cor', type: 'color' },
            { key: 'supervisor', label: 'Supervisor' },
            { key: 'description', label: 'Descrição' },
          ]}
          initial={editTarget.entity}
          onSave={(data) => {
            if (editTarget.isNew) store().createArea(data as any);
            else store().updateArea(editTarget.entity.id, data as any);
            setEditTarget(null);
            refresh();
          }}
          onClose={() => setEditTarget(null)}
        />
      )}
      {editTarget && section === 'equipments' && (
        <EditModal
          title={editTarget.isNew ? 'Novo Equipamento' : 'Editar Equipamento'}
          fields={[
            { key: 'tag', label: 'Tag', required: true },
            { key: 'name', label: 'Nome', required: true },
            { key: 'type', label: 'Tipo', type: 'select', options: ['Tank', 'Pipe', 'Pump', 'Meter', 'Valve', 'Vessel'] },
            { key: 'capacity', label: 'Capacidade (m³)', type: 'number' },
            { key: 'currentLevel', label: 'Nível Atual (%)', type: 'number' },
          ]}
          initial={editTarget.entity}
          onSave={(data) => {
            if (editTarget.isNew) store().createEquipmentEntity(data as any);
            else store().updateEquipmentEntity(editTarget.entity.id, data as any);
            setEditTarget(null);
            refresh();
          }}
          onClose={() => setEditTarget(null)}
        />
      )}
      {editTarget && section === 'operators' && (
        <EditModal
          title={editTarget.isNew ? 'Novo Operador' : 'Editar Operador'}
          fields={[
            { key: 'name', label: 'Nome', required: true },
            { key: 'code', label: 'Código', required: true },
            { key: 'role', label: 'Função' },
            { key: 'area', label: 'Área' },
            { key: 'isOnline', label: 'Online', type: 'checkbox' },
          ]}
          initial={editTarget.entity}
          onSave={(data) => {
            if (editTarget.isNew) store().createOperator(data as any);
            else store().updateOperator(editTarget.entity.id, data as any);
            setEditTarget(null);
            refresh();
          }}
          onClose={() => setEditTarget(null)}
        />
      )}
      {editTarget && section === 'alignments' && (
        <EditModal
          title={editTarget.isNew ? 'Novo Alinhamento' : 'Editar Alinhamento'}
          fields={[
            { key: 'code', label: 'Código', required: true },
            { key: 'name', label: 'Descrição', required: true },
            { key: 'productId', label: 'ID Produto' },
            { key: 'isActive', label: 'Ativo', type: 'checkbox' },
          ]}
          initial={editTarget.entity}
          onSave={(data) => {
            if (editTarget.isNew) store().createAlignment(data as any);
            else store().updateAlignment(editTarget.entity.id, data as any);
            setEditTarget(null);
            refresh();
          }}
          onClose={() => setEditTarget(null)}
        />
      )}
      {editTarget && section === 'usergroups' && (
        <EditModal
          title={editTarget.isNew ? 'Novo Grupo de Usuário' : 'Editar Grupo de Usuário'}
          fields={[
            { key: 'name', label: 'Nome', required: true },
            { key: 'code', label: 'Código', required: true },
            { key: 'description', label: 'Descrição' },
          ]}
          initial={editTarget.entity}
          onSave={(data) => {
            if (editTarget.isNew) store().createUserGroup(data as any);
            else store().updateUserGroup(editTarget.entity.id, data as any);
            setEditTarget(null);
            refresh();
          }}
          onClose={() => setEditTarget(null)}
        />
      )}
      {editTarget && section === 'movementtypes' && (
        <EditModal
          title={editTarget.isNew ? 'Novo Tipo de Movimento' : 'Editar Tipo de Movimento'}
          fields={[
            { key: 'name', label: 'Nome', required: true },
            { key: 'code', label: 'Código', required: true },
            { key: 'color', label: 'Cor', type: 'color' },
            { key: 'description', label: 'Descrição' },
          ]}
          initial={editTarget.entity}
          onSave={(data) => {
            if (editTarget.isNew) store().createMovementType(data as any);
            else store().updateMovementType(editTarget.entity.id, data as any);
            setEditTarget(null);
            refresh();
          }}
          onClose={() => setEditTarget(null)}
        />
      )}
      {editTarget && section === 'priorities' && (
        <EditModal
          title={editTarget.isNew ? 'Nova Prioridade' : 'Editar Prioridade'}
          fields={[
            { key: 'name', label: 'Nome', required: true },
            { key: 'code', label: 'Código', required: true },
            { key: 'level', label: 'Nível (1-10)', type: 'number' },
            { key: 'color', label: 'Cor', type: 'color' },
          ]}
          initial={editTarget.entity}
          onSave={(data) => {
            if (editTarget.isNew) store().createPriority(data as any);
            else store().updatePriority(editTarget.entity.id, data as any);
            setEditTarget(null);
            refresh();
          }}
          onClose={() => setEditTarget(null)}
        />
      )}
      {editTarget && section === 'measurementmethods' && (
        <EditModal
          title={editTarget.isNew ? 'Novo Método de Medição' : 'Editar Método de Medição'}
          fields={[
            { key: 'name', label: 'Nome', required: true },
            { key: 'code', label: 'Código', required: true },
            { key: 'description', label: 'Descrição' },
          ]}
          initial={editTarget.entity}
          onSave={(data) => {
            if (editTarget.isNew) store().createMeasurementMethod(data as any);
            else store().updateMeasurementMethod(editTarget.entity.id, data as any);
            setEditTarget(null);
            refresh();
          }}
          onClose={() => setEditTarget(null)}
        />
      )}
      {editTarget && section === 'engunits' && (
        <EditModal
          title={editTarget.isNew ? 'Nova Unidade de Eng.' : 'Editar Unidade de Eng.'}
          fields={[
            { key: 'symbol', label: 'Símbolo', required: true },
            { key: 'name', label: 'Nome', required: true },
            { key: 'dimension', label: 'Dimensão (ex: Volume, Massa, Vazão)' },
          ]}
          initial={editTarget.entity}
          onSave={(data) => {
            if (editTarget.isNew) store().createEngUnit(data as any);
            else store().updateEngUnit(editTarget.entity.id, data as any);
            setEditTarget(null);
            refresh();
          }}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
};
