import React, { useState } from 'react';
import {
  Edit2,
  Trash2,
  Copy,
  Plus,
  ArrowUpDown,
  Search,
  CheckCircle2,
  Layers,
  Bell,
  BellRing,
  TrendingUp,
  Link,
} from 'lucide-react';
import { useObjectModelStore } from '../../store/useObjectModelStore';
import { cn } from '../../utils/cn';


export const PropertiesTable: React.FC = () => {
  const {
    mergedProperties,
    openAddPropertyModal,
    openEditPropertyModal,
    deleteProperty,
    duplicateProperty,
    openAlarmConfigModal,
    openHistoryConfigModal,
    bindOpcTagToProperty,
  } = useObjectModelStore();

  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'name' | 'dataType'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const filteredProperties = mergedProperties
    .filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.dataType.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const valA = a[sortField].toLowerCase();
      const valB = b[sortField].toLowerCase();
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

  const toggleSort = (field: 'name' | 'dataType') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-4 mb-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search properties..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        {/* Add Property Button */}
        <button
          onClick={openAddPropertyModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Property</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-xs">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 sticky top-0 backdrop-blur-xs z-10">
            <tr className="text-slate-600 dark:text-slate-400 font-semibold select-none">
              <th className="py-3 px-4 w-1/4">
                <button
                  onClick={() => toggleSort('name')}
                  className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  <span>Property Name</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-3 px-4 w-1/6">
                <button
                  onClick={() => toggleSort('dataType')}
                  className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  <span>Type</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-3 px-4 w-1/4">Default Value</th>
              <th className="py-3 px-4 w-1/5">Origin & Status</th>
              <th className="py-3 px-4 text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredProperties.length > 0 ? (
              filteredProperties.map((prop) => (
                <tr
                  key={prop.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const raw = e.dataTransfer.getData('opc/tag-ref');
                    if (raw) {
                      try {
                        const tag = JSON.parse(raw);
                        bindOpcTagToProperty(prop.id, tag.path);
                      } catch (err) {
                        console.error('Falha ao processar drop de tag OPC:', err);
                      }
                    }
                  }}
                  className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* Property Name & Description */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                        {prop.name}
                      </div>
                      {prop.alarmConfig?.enabled && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 text-[9px] font-bold text-rose-500 uppercase font-sans shrink-0">
                          <BellRing className="w-2.5 h-2.5 text-rose-500 animate-bounce" />
                          <span>Alarme</span>
                        </span>
                      )}
                      {prop.historyConfig?.enabled && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/40 text-[9px] font-bold text-violet-500 uppercase font-sans shrink-0">
                          <TrendingUp className="w-2.5 h-2.5 text-violet-500" />
                          <span>Hist</span>
                        </span>
                      )}
                    </div>

                    {prop.description && (
                      <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {prop.description}
                      </div>
                    )}

                    {prop.opcTagPath && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-sky-600 dark:text-sky-400 font-mono">
                        <Link className="w-3 h-3 text-sky-500 shrink-0" />
                        <span className="truncate max-w-xs">{prop.opcTagPath}</span>
                      </div>
                    )}
                  </td>

                  {/* Type */}
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {prop.dataType}
                    </span>
                  </td>

                  {/* Default Value */}
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="truncate block max-w-xs">
                      {prop.defaultValue !== '' ? prop.defaultValue : <span className="text-slate-300 dark:text-slate-600 italic">empty</span>}
                    </span>
                  </td>

                  {/* Origin & Status Badge */}
                  <td className="py-3 px-4">
                    {prop.isInherited ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60">
                        <Layers className="w-3 h-3 text-sky-500 shrink-0" />
                        <span>Inherited ({prop.sourceTemplateName || 'Parent'})</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span>{prop.isOverridden ? 'Local Override' : 'Local'}</span>
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openHistoryConfigModal(prop)}
                        title="Configurar Histórico"
                        className={cn(
                          'p-1 rounded transition-colors',
                          prop.historyConfig?.enabled
                            ? 'text-violet-500 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/40'
                            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openAlarmConfigModal(prop)}
                        title="Configure Alarms"
                        className={cn(
                          "p-1 rounded transition-colors",
                          prop.alarmConfig?.enabled
                            ? "text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                      >
                        <Bell className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditPropertyModal(prop)}
                        title="Edit Property"
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => duplicateProperty(prop)}
                        title="Duplicate Property"
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {!prop.isInherited && (
                        <button
                          onClick={() => deleteProperty(prop.id)}
                          title="Delete Property"
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                  No properties defined yet. Click "Add Property" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
