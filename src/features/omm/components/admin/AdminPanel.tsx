import React, { useState } from 'react';
import { useOmmStore } from '../../store/useOmmStore';
import { Settings, Package2, MapPin, Cpu, Users, Database, RefreshCw, Trash2 } from 'lucide-react';

type AdminSection = 'products' | 'areas' | 'equipments' | 'operators' | 'system';

const SECTIONS: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
  { id: 'products',   label: 'Produtos',     icon: <Package2 className="w-4 h-4" /> },
  { id: 'areas',      label: 'Áreas',        icon: <MapPin className="w-4 h-4" /> },
  { id: 'equipments', label: 'Equipamentos', icon: <Cpu className="w-4 h-4" /> },
  { id: 'operators',  label: 'Operadores',   icon: <Users className="w-4 h-4" /> },
  { id: 'system',     label: 'Sistema',      icon: <Settings className="w-4 h-4" /> },
];

export const AdminPanel: React.FC = () => {
  const [section, setSection] = useState<AdminSection>('products');
  const products = useOmmStore((s) => s.products);
  const areas = useOmmStore((s) => s.areas);
  const equipments = useOmmStore((s) => s.equipments);
  const operators = useOmmStore((s) => s.operators);
  const clearAll = useOmmStore((s) => s.clearAll);
  const init = useOmmStore((s) => s.init);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleReset = () => {
    clearAll();
    setTimeout(() => init(), 100);
    setConfirmReset(false);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-48 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col shrink-0">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Administração</div>
        </div>
        <nav className="flex-1 py-2">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-semibold transition-colors cursor-pointer
                ${section === s.id
                  ? 'bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400'
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
      <div className="flex-1 overflow-auto p-4">
        {section === 'products' && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Produtos Cadastrados ({products.length})</div>
            <div className="grid grid-cols-2 gap-2">
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{p.name}</div>
                    <div className="flex gap-2 text-[10px] text-slate-400 font-mono">
                      <span>{p.code}</span>
                      <span>·</span>
                      <span>{p.category}</span>
                      <span>·</span>
                      <span>{p.density20} kg/m³</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'areas' && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Áreas Responsáveis ({areas.length})</div>
            <div className="space-y-2">
              {areas.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                  <div className="flex-1">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{a.name}</div>
                    <div className="text-[10px] text-slate-400">{a.description}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Supervisão: <span className="font-semibold">{a.supervisor}</span></div>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{a.code}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'equipments' && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Equipamentos ({equipments.length})</div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-3 py-1.5 text-left text-[10px] font-bold uppercase text-slate-400">Tag</th>
                    <th className="px-3 py-1.5 text-left text-[10px] font-bold uppercase text-slate-400">Nome</th>
                    <th className="px-3 py-1.5 text-left text-[10px] font-bold uppercase text-slate-400">Tipo</th>
                    <th className="px-3 py-1.5 text-right text-[10px] font-bold uppercase text-slate-400">Cap. (m³)</th>
                    <th className="px-3 py-1.5 text-right text-[10px] font-bold uppercase text-slate-400">Nível</th>
                  </tr>
                </thead>
                <tbody>
                  {equipments.map((e, i) => (
                    <tr key={e.id} className={`border-t border-slate-100 dark:border-slate-800 ${i % 2 === 0 ? '' : 'bg-slate-50/40 dark:bg-slate-800/20'}`}>
                      <td className="px-3 py-1.5 font-mono font-bold text-slate-700 dark:text-slate-200">{e.tag}</td>
                      <td className="px-3 py-1.5 text-slate-600 dark:text-slate-300">{e.name}</td>
                      <td className="px-3 py-1.5 text-slate-500">{e.type}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-slate-500">{e.capacity > 0 ? e.capacity.toLocaleString() : '—'}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-slate-500">{e.capacity > 0 ? `${e.currentLevel.toFixed(1)}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {section === 'operators' && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Operadores ({operators.length})</div>
            <div className="grid grid-cols-2 gap-2">
              {operators.map((op) => (
                <div key={op.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[11px] ${op.isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                    {op.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="flex-1">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{op.name}</div>
                    <div className="text-[10px] text-slate-400">{op.role} · {op.area}</div>
                    <div className={`text-[9px] font-semibold ${op.isOnline ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {op.isOnline ? '● Online' : '○ Offline'}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">{op.code}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'system' && (
          <div className="space-y-4 max-w-lg">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Configurações do Sistema</div>

            {/* Stats */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-slate-400" />
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Banco de Dados (localStorage)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="text-slate-500">Ordens:</div>
                <div className="font-mono font-bold text-slate-700 dark:text-slate-200">{useOmmStore.getState().orders.length}</div>
                <div className="text-slate-500">Movimentos:</div>
                <div className="font-mono font-bold text-slate-700 dark:text-slate-200">{useOmmStore.getState().movements.length}</div>
                <div className="text-slate-500">Equipamentos:</div>
                <div className="font-mono font-bold text-slate-700 dark:text-slate-200">{equipments.length}</div>
                <div className="text-slate-500">Produtos:</div>
                <div className="font-mono font-bold text-slate-700 dark:text-slate-200">{products.length}</div>
              </div>
            </div>

            {/* Rebuild seed */}
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
    </div>
  );
};
