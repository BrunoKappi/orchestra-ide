import React, { useState, useEffect } from 'react';
import { useSecurityStore } from '../../../store/useSecurityStore';
import type { PermissionAction, PermissionValue, PermissionMatrix } from '../../../types/security';
import { Check, X, ShieldAlert, Users, User, Shield, Info } from 'lucide-react';

const MODULES = [
  'Orquestra IDE',
  'Deployment',
  'Objetos',
  'Templates',
  'Componentes Gráficos',
  'Designer de Telas',
  'Runtime',
  'Banco de Dados',
  'Simulador',
  'Alarmes',
  'Histórico',
  'Faceplates',
  'Fluxogramas',
  'OMM',
  'KPI Dashboard',
  'Operations Center',
  'Quality Management',
  'Event Engine',
  'OPC Browser',
  'Property Browser'
];

const ACTIONS: PermissionAction[] = [
  'Visualizar',
  'Criar',
  'Editar',
  'Excluir',
  'Importar',
  'Exportar',
  'Executar',
  'Configurar',
  'Administrar'
];

export const PermissionMatrixView: React.FC = () => {
  const { profiles, groups, users, permissionConfigs, savePermissionConfig } = useSecurityStore();

  const [targetType, setTargetType] = useState<'profile' | 'group' | 'user'>('profile');
  const [targetId, setTargetId] = useState('');
  const [matrix, setMatrix] = useState<PermissionMatrix>({});

  // Sync default target ID on type change
  useEffect(() => {
    if (targetType === 'profile' && profiles.length > 0) {
      setTargetId(profiles[0].id);
    } else if (targetType === 'group' && groups.length > 0) {
      setTargetId(groups[0].id);
    } else if (targetType === 'user' && users.length > 0) {
      setTargetId(users[0].id);
    }
  }, [targetType, profiles, groups, users]);

  // Load existing matrix when target changes
  useEffect(() => {
    if (targetId) {
      const config = permissionConfigs.find(
        (c) => c.targetType === targetType && c.targetId === targetId
      );
      if (config) {
        setMatrix(config.matrix || {});
      } else {
        setMatrix({});
      }
    }
  }, [targetType, targetId, permissionConfigs]);

  const getCellState = (moduleName: string, action: PermissionAction): PermissionValue => {
    return matrix[moduleName]?.[action] || 'Herdeiro';
  };

  const handleCellClick = (moduleName: string, action: PermissionAction) => {
    const currentState = getCellState(moduleName, action);
    let nextState: PermissionValue = 'Herdeiro';

    if (currentState === 'Herdeiro') {
      nextState = 'Permitido';
    } else if (currentState === 'Permitido') {
      nextState = 'Negado';
    } else {
      nextState = 'Herdeiro';
    }

    const updatedMatrix = {
      ...matrix,
      [moduleName]: {
        ...(matrix[moduleName] || {}),
        [action]: nextState
      }
    };

    setMatrix(updatedMatrix);
    savePermissionConfig(targetType, targetId, updatedMatrix);
  };

  // Helper to render value badges or controls
  const renderCell = (moduleName: string, action: PermissionAction) => {
    const val = getCellState(moduleName, action);

    let bgClass = 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500';
    let icon = <span className="text-[10px] font-semibold opacity-60">Herdado</span>;

    if (val === 'Permitido') {
      bgClass = 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
      icon = <Check className="w-3.5 h-3.5" />;
    } else if (val === 'Negado') {
      bgClass = 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-455 border border-rose-500/30';
      icon = <X className="w-3.5 h-3.5" />;
    }

    return (
      <button
        onClick={() => handleCellClick(moduleName, action)}
        className={`w-full h-9 flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer select-none outline-none ${bgClass}`}
        title={`${moduleName} - ${action}: Clique para alterar (Herdeiro -> Permitido -> Negado)`}
      >
        {icon}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Settings Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-lg">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Matriz Operacional de Permissões</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Defina permissões refinadas de leitura, escrita e administração da planta.</p>
          </div>
        </div>

        {/* Selection / Filtering */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-slate-250 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-950 text-xs font-semibold">
            <button
              onClick={() => setTargetType('profile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                targetType === 'profile' ? 'bg-white dark:bg-slate-900 shadow-sm text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Perfis</span>
            </button>
            <button
              onClick={() => setTargetType('group')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                targetType === 'group' ? 'bg-white dark:bg-slate-900 shadow-sm text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Grupos</span>
            </button>
            <button
              onClick={() => setTargetType('user')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                targetType === 'user' ? 'bg-white dark:bg-slate-900 shadow-sm text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Usuário</span>
            </button>
          </div>

          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium outline-none focus:border-sky-500 cursor-pointer min-w-[160px]"
          >
            {targetType === 'profile' &&
              profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            {targetType === 'group' &&
              groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            {targetType === 'user' &&
              users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.login})
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Info Warning Bar */}
      <div className="px-4 py-2 bg-blue-500/5 border-b border-blue-500/10 text-[11px] text-blue-600 dark:text-blue-400 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Controle de Herança:</strong> Permissões marcadas como <em>Herdado</em> receberão o acesso padrão do Perfil. Ao definir explicitamente como <em>Permitido</em> (verde) ou <em>Negado</em> (vermelho), você sobrescreverá as regras herdadas para este escopo específico.
        </p>
      </div>

      {/* Matrix Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10">
              <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 min-w-[200px]">Módulo do Sistema</th>
              {ACTIONS.map((act) => (
                <th key={act} className="px-2 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 text-center min-w-[90px]">{act}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {MODULES.map((mod) => (
              <tr key={mod} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                <td className="px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {mod}
                </td>
                {ACTIONS.map((act) => (
                  <td key={act} className="px-1.5 py-1 text-center">
                    {renderCell(mod, act)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status Legend Footer */}
      <div className="p-3 border-t border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between flex-wrap gap-3 text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            <span>Herdeiro / Padrão</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/40" />
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Permitido Explicito</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-500/20 border border-rose-500/40" />
            <span className="text-rose-600 dark:text-rose-455 font-semibold">Negado Explicito</span>
          </div>
        </div>
        <div>
          <span>Persistido no LocalStorage DB</span>
        </div>
      </div>
    </div>
  );
};
