import React, { useState, useMemo, useEffect } from 'react';
import { useSecurityStore } from '../store/useSecurityStore';
import { HeaderNavigation } from '../components/navigation/HeaderNavigation';
import { useObjectModelStore } from '../store/useObjectModelStore';
import { UserModal } from '../features/security/components/UserModal';
import { PermissionMatrixView } from '../features/security/components/PermissionMatrixView';
import {
  ShieldAlert,
  Users,
  User as UserIcon,
  Shield,
  History,
  Briefcase,
  Search,
  Plus,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';

export const SecurityPage: React.FC = () => {
  const {
    users,
    groups,
    profiles,
    roles,
    auditLogs,
    deleteUser,
    addGroup,
    updateGroup,
    deleteGroup,
    addProfile,
    updateProfile,
    deleteProfile,
    addRole,
    updateRole,
    deleteRole
  } = useSecurityStore();

  const theme = useObjectModelStore((s) => s.theme);

  const [activeTab, setActiveTab] = useState<'users' | 'groups' | 'profiles' | 'roles' | 'permissions' | 'audit'>('users');

  // Users Table States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProfile, setFilterProfile] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modals / Editors States
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Group Editor States
  const [isGroupEditorOpen, setIsGroupEditorOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupColor, setGroupColor] = useState('bg-sky-500');
  const [groupObs, setGroupObs] = useState('');

  // Profile Editor States
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState('');
  const [profileDesc, setProfileDesc] = useState('');

  // Role Editor States
  const [isRoleEditorOpen, setIsRoleEditorOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');

  // Audit Filter
  const [auditSearch, setAuditSearch] = useState('');

  // Apply dark/light theme classes on load or store sync
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // COLOR CHOICES FOR GROUPS
  const COLOR_PALETTES = [
    'bg-sky-500',
    'bg-blue-600',
    'bg-indigo-600',
    'bg-violet-600',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-emerald-500',
    'bg-green-600',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-slate-500'
  ];

  // ----------------------------------------------------
  // USERS LOGIC (Search, Filter, Sort, Pagination)
  // ----------------------------------------------------
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        const matchesSearch =
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.login.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.area.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesProfile = filterProfile === 'all' || user.profileId === filterProfile;
        const matchesGroup = filterGroup === 'all' || user.groupIds.includes(filterGroup);
        const matchesStatus = filterStatus === 'all' || user.status === filterStatus;

        return matchesSearch && matchesProfile && matchesGroup && matchesStatus;
      })
      .sort((a: any, b: any) => {
        let valA = a[sortField] || '';
        let valB = b[sortField] || '';

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [users, searchQuery, filterProfile, filterGroup, filterStatus, sortField, sortOrder]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterProfile, filterGroup, filterStatus]);

  // Open User Modal helper
  const handleAddUser = () => {
    setSelectedUserId(null);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (id: string) => {
    setSelectedUserId(id);
    setIsUserModalOpen(true);
  };

  // ----------------------------------------------------
  // GROUPS LOGIC
  // ----------------------------------------------------
  const handleOpenGroupAdd = () => {
    setEditingGroupId(null);
    setGroupName('');
    setGroupDesc('');
    setGroupColor('bg-sky-500');
    setGroupObs('');
    setIsGroupEditorOpen(true);
  };

  const handleOpenGroupEdit = (g: any) => {
    setEditingGroupId(g.id);
    setGroupName(g.name);
    setGroupDesc(g.description);
    setGroupColor(g.color || 'bg-sky-500');
    setGroupObs(g.observations || '');
    setIsGroupEditorOpen(true);
  };

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName) return;

    if (editingGroupId) {
      updateGroup(editingGroupId, {
        name: groupName,
        description: groupDesc,
        color: groupColor,
        observations: groupObs
      });
    } else {
      addGroup({
        name: groupName,
        description: groupDesc,
        color: groupColor,
        observations: groupObs
      });
    }
    setIsGroupEditorOpen(false);
  };

  // ----------------------------------------------------
  // PROFILES LOGIC
  // ----------------------------------------------------
  const handleOpenProfileAdd = () => {
    setEditingProfileId(null);
    setProfileName('');
    setProfileDesc('');
    setIsProfileEditorOpen(true);
  };

  const handleOpenProfileEdit = (p: any) => {
    setEditingProfileId(p.id);
    setProfileName(p.name);
    setProfileDesc(p.description);
    setIsProfileEditorOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName) return;

    if (editingProfileId) {
      updateProfile(editingProfileId, {
        name: profileName,
        description: profileDesc
      });
    } else {
      addProfile({
        name: profileName,
        description: profileDesc
      });
    }
    setIsProfileEditorOpen(false);
  };

  // ----------------------------------------------------
  // ROLES LOGIC
  // ----------------------------------------------------
  const handleOpenRoleAdd = () => {
    setEditingRoleId(null);
    setRoleName('');
    setRoleDesc('');
    setIsRoleEditorOpen(true);
  };

  const handleOpenRoleEdit = (r: any) => {
    setEditingRoleId(r.id);
    setRoleName(r.name);
    setRoleDesc(r.description);
    setIsRoleEditorOpen(true);
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName) return;

    if (editingRoleId) {
      updateRole(editingRoleId, {
        name: roleName,
        description: roleDesc
      });
    } else {
      addRole({
        name: roleName,
        description: roleDesc
      });
    }
    setIsRoleEditorOpen(false);
  };

  // ----------------------------------------------------
  // AUDIT LOGS FILTER
  // ----------------------------------------------------
  const filteredAudits = useMemo(() => {
    if (!auditSearch) return auditLogs;
    const q = auditSearch.toLowerCase();
    return auditLogs.filter(
      (log) =>
        log.user.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.target.toLowerCase().includes(q) ||
        log.description.toLowerCase().includes(q)
    );
  }, [auditLogs, auditSearch]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <HeaderNavigation />

      <main className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* SIDEBAR TABS */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex md:flex-col overflow-y-auto z-10">
          <div className="p-4 hidden md:block">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Segurança Industrial</h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-snug">Painel administrativo de controle de acessos corporativo (RBAC).</p>
          </div>

          <nav className="flex-1 flex md:flex-col gap-1 p-2 md:p-3 w-full shrink-0">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold w-full transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <UserIcon className="w-4 h-4 shrink-0 text-sky-500" />
              <span>Usuários</span>
              <span className="ml-auto text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">
                {users.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('groups')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold w-full transition-all cursor-pointer ${
                activeTab === 'groups'
                  ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4 shrink-0 text-orange-500" />
              <span>Grupos</span>
              <span className="ml-auto text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">
                {groups.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('profiles')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold w-full transition-all cursor-pointer ${
                activeTab === 'profiles'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>Perfis</span>
              <span className="ml-auto text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">
                {profiles.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('roles')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold w-full transition-all cursor-pointer ${
                activeTab === 'roles'
                  ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Briefcase className="w-4 h-4 shrink-0 text-violet-500" />
              <span>Funções (Cargos)</span>
              <span className="ml-auto text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">
                {roles.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('permissions')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold w-full transition-all cursor-pointer ${
                activeTab === 'permissions'
                  ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Shield className="w-4 h-4 shrink-0 text-pink-500" />
              <span>Permissões (Matriz)</span>
            </button>

            <div className="hidden md:block my-2 border-t border-slate-200 dark:border-slate-850" />

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold w-full transition-all cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-slate-500/10 text-slate-700 dark:text-slate-300 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4 shrink-0 text-slate-500" />
              <span>Auditoria</span>
            </button>
          </nav>
        </div>

        {/* WORKSPACE AREA */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 md:p-6 bg-slate-50 dark:bg-slate-950">
          {/* TAB CONTENT: USERS */}
          {activeTab === 'users' && (
            <div className="flex-1 flex flex-col overflow-hidden space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                  <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Administração de Usuários</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Gerencie credenciais, status, preferências e perfis de segurança corporativa.</p>
                </div>
                <button
                  onClick={handleAddUser}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-semibold cursor-pointer shadow-sm shadow-sky-500/10 self-start transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Usuário</span>
                </button>
              </div>

              {/* Advanced Search & Filtering Bar */}
              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center gap-3 shrink-0">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Pesquisar por nome, login, e-mail, cargo, área..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400 font-semibold">Filtros:</span>

                  <select
                    value={filterProfile}
                    onChange={(e) => setFilterProfile(e.target.value)}
                    className="px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg outline-none cursor-pointer text-slate-600 dark:text-slate-350"
                  >
                    <option value="all">Todos Perfis</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterGroup}
                    onChange={(e) => setFilterGroup(e.target.value)}
                    className="px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg outline-none cursor-pointer text-slate-600 dark:text-slate-350"
                  >
                    <option value="all">Todos Grupos</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg outline-none cursor-pointer text-slate-600 dark:text-slate-350"
                  >
                    <option value="all">Todos Status</option>
                    <option value="Ativo">Ativos</option>
                    <option value="Inativo">Inativos</option>
                  </select>
                </div>
              </div>

              {/* Modern Table */}
              <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-slate-250 dark:border-slate-800 z-10 text-slate-500 font-bold">
                        <th onClick={() => handleSort('name')} className="px-4 py-3 cursor-pointer hover:text-slate-800 select-none">
                          Usuário {sortField === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th onClick={() => handleSort('login')} className="px-4 py-3 cursor-pointer hover:text-slate-800 select-none">
                          Login {sortField === 'login' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th onClick={() => handleSort('email')} className="px-4 py-3 cursor-pointer hover:text-slate-800 select-none">
                          E-mail {sortField === 'email' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th onClick={() => handleSort('role')} className="px-4 py-3 cursor-pointer hover:text-slate-800 select-none">
                          Cargo / Área {sortField === 'role' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th className="px-4 py-3">Grupo(s)</th>
                        <th className="px-4 py-3">Perfil</th>
                        <th onClick={() => handleSort('status')} className="px-4 py-3 cursor-pointer hover:text-slate-800 select-none">
                          Status {sortField === 'status' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th className="px-4 py-3">Prefs (Lang/Tema)</th>
                        <th className="px-4 py-3 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {paginatedUsers.map((user) => {
                        const userProfile = profiles.find((p) => p.id === user.profileId);
                        const userGroups = groups.filter((g) => user.groupIds.includes(g.id));

                        return (
                          <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.login}`}
                                  alt=""
                                  className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 object-contain p-0.5 shrink-0 border border-slate-200/50 dark:border-slate-700/50"
                                />
                                <div>
                                  <span className="font-semibold text-slate-950 dark:text-slate-200 block">{user.name}</span>
                                  <span className="text-[10px] text-slate-400 block">Último Acesso: {user.lastAccess}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">@{user.login}</td>
                            <td className="px-4 py-2.5 font-medium">{user.email}</td>
                            <td className="px-4 py-2.5">
                              <span className="font-medium text-slate-950 dark:text-slate-200 block">{user.role || '-'}</span>
                              <span className="text-[10px] text-slate-400 block">{user.area || '-'}</span>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex flex-wrap gap-1">
                                {userGroups.map((ug) => (
                                  <span
                                    key={ug.id}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold text-white ${ug.color || 'bg-slate-455'}`}
                                  >
                                    {ug.name}
                                  </span>
                                ))}
                                {userGroups.length === 0 && <span className="text-slate-400">-</span>}
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 border border-slate-200 dark:border-slate-750">
                                {userProfile ? userProfile.name : 'Nenhum'}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  user.status === 'Ativo'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-455'
                                }`}
                              >
                                {user.status === 'Ativo' ? (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span>Ativo</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    <span>Inativo</span>
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="text-[10px] bg-slate-50 dark:bg-slate-950 px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-slate-850 text-slate-500 font-medium">
                                {user.language} / {user.preferredTheme}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleEditUser(user.id)}
                                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-550 dark:text-slate-350 transition-colors cursor-pointer"
                                  title="Editar Usuário"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Remover usuário ${user.name}?`)) {
                                      deleteUser(user.id);
                                    }
                                  }}
                                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-850 hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                  title="Deletar Usuário"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                            Nenhum usuário correspondente aos filtros foi encontrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-semibold">
                    Exibindo {paginatedUsers.length} de {filteredUsers.length} usuários
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className="p-1 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 transition-colors text-xs font-semibold"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-bold px-2">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                      className="p-1 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 transition-colors text-xs font-semibold"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: GROUPS */}
          {activeTab === 'groups' && (
            <div className="flex-1 flex flex-col overflow-hidden space-y-4">
              <div className="flex items-center justify-between shrink-0">
                <div>
                  <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Grupos Organizacionais</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure grupos como Operação, Manutenção ou Engenharia para gerenciamento de acessos corporativos.</p>
                </div>
                <button
                  onClick={handleOpenGroupAdd}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-semibold cursor-pointer shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Grupo</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groups.map((group) => {
                    const membersCount = users.filter((u) => u.groupIds.includes(group.id)).length;
                    return (
                      <div
                        key={group.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors relative"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`w-3.5 h-3.5 rounded-full ${group.color || 'bg-slate-400'}`} />
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{group.name}</h3>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenGroupEdit(group)}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-750 transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Remover o grupo ${group.name}?`)) {
                                  deleteGroup(group.id);
                                }
                              }}
                              className="p-1 rounded hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal flex-1">{group.description || 'Sem descrição cadastrada.'}</p>

                        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-xs text-slate-400">
                          <span className="font-semibold text-slate-500 dark:text-slate-400">{membersCount} Membro(s) Associado(s)</span>
                          {group.observations && (
                            <span className="text-[10px] italic max-w-[150px] truncate" title={group.observations}>
                              Obs: {group.observations}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: PROFILES */}
          {activeTab === 'profiles' && (
            <div className="flex-1 flex flex-col overflow-hidden space-y-4">
              <div className="flex items-center justify-between shrink-0">
                <div>
                  <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Perfis de Acesso</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure papéis padrões de segurança como Administrador, Operador, Supervisor ou Visitante.</p>
                </div>
                <button
                  onClick={handleOpenProfileAdd}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-semibold cursor-pointer shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Perfil</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profiles.map((profile) => {
                    const associatedUsersCount = users.filter((u) => u.profileId === profile.id).length;
                    return (
                      <div
                        key={profile.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3 hover:border-slate-350 dark:hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                            <Shield className="w-4.5 h-4.5" />
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{profile.name}</h3>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenProfileEdit(profile)}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-750 transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Remover perfil ${profile.name}?`)) {
                                  deleteProfile(profile.id);
                                }
                              }}
                              className="p-1 rounded hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal flex-1">{profile.description}</p>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-850 text-xs text-slate-400 font-semibold">
                          {associatedUsersCount} Usuário(s) Associado(s)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: ROLES */}
          {activeTab === 'roles' && (
            <div className="flex-1 flex flex-col overflow-hidden space-y-4">
              <div className="flex items-center justify-between shrink-0">
                <div>
                  <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Funções (Cargos Organizacionais)</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Crie cargos e responsabilidades organizacionais que existam independentemente dos perfis de acesso.</p>
                </div>
                <button
                  onClick={handleOpenRoleAdd}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-semibold cursor-pointer shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Função</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roles.map((role) => {
                    const matchedUsersCount = users.filter((u) => u.role === role.name).length;
                    return (
                      <div
                        key={role.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-2.5 hover:border-slate-350 dark:hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-violet-500">
                            <Briefcase className="w-4 h-4" />
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{role.name}</h3>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenRoleEdit(role)}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-750 transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Remover função/cargo ${role.name}?`)) {
                                  deleteRole(role.id);
                                }
                              }}
                              className="p-1 rounded hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal flex-1">{role.description}</p>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-850 text-xs text-slate-400 font-semibold">
                          {matchedUsersCount} Usuário(s) Atribuído(s)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: PERMISSIONS */}
          {activeTab === 'permissions' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <PermissionMatrixView />
            </div>
          )}

          {/* TAB CONTENT: AUDIT */}
          {activeTab === 'audit' && (
            <div className="flex-1 flex flex-col overflow-hidden space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                  <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Log de Auditoria</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Histórico completo de alterações realizadas nas credenciais e regras de acesso do sistema.</p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder="Filtrar por ação, alvo, descrição..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              {/* Log Table */}
              <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10 text-slate-500 font-bold">
                        <th className="px-4 py-3 min-w-[140px]">Data e Hora</th>
                        <th className="px-4 py-3 min-w-[120px]">Usuário Responsável</th>
                        <th className="px-4 py-3 min-w-[90px]">Operação</th>
                        <th className="px-4 py-3 min-w-[150px]">Alvo</th>
                        <th className="px-4 py-3">Descrição da Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-350">
                      {filteredAudits.map((log) => {
                        let actionBadge = 'bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-400';
                        if (log.action === 'Criar') actionBadge = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
                        if (log.action === 'Editar') actionBadge = 'bg-sky-500/10 text-sky-600 dark:text-sky-400';
                        if (log.action === 'Excluir') actionBadge = 'bg-rose-500/10 text-rose-600 dark:text-rose-455';
                        if (log.action === 'Configuração') actionBadge = 'bg-amber-500/10 text-amber-600 dark:text-amber-400';

                        return (
                          <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                            <td className="px-4 py-2.5 font-mono text-slate-400">{log.timestamp}</td>
                            <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-200">{log.user}</td>
                            <td className="px-4 py-2.5">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${actionBadge}`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">{log.target}</td>
                            <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 leading-normal">{log.description}</td>
                          </tr>
                        );
                      })}
                      {filteredAudits.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                            Nenhum registro de auditoria encontrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* USER MODAL */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        userId={selectedUserId}
      />

      {/* IN-PLACE MODAL FOR GROUPS */}
      {isGroupEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {editingGroupId ? 'Editar Grupo' : 'Novo Grupo'}
              </h3>
            </div>
            <form onSubmit={handleSaveGroup} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Nome do Grupo *</label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ex: Engenharia"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Descrição</label>
                <textarea
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder="Explique o propósito deste grupo..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-sky-500 resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-2">Cor de Identificação</label>
                <div className="grid grid-cols-6 gap-2">
                  {COLOR_PALETTES.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setGroupColor(color)}
                      className={`h-6 rounded-md transition-all ${color} ${
                        groupColor === color
                          ? 'ring-2 ring-sky-500 ring-offset-2 dark:ring-offset-slate-900 scale-110 shadow-md'
                          : 'opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Observações</label>
                <input
                  type="text"
                  value={groupObs}
                  onChange={(e) => setGroupObs(e.target.value)}
                  placeholder="Notas internas..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGroupEditorOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-850 hover:bg-slate-100 text-slate-650 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-505 text-white font-bold cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IN-PLACE MODAL FOR PROFILES */}
      {isProfileEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {editingProfileId ? 'Editar Perfil' : 'Novo Perfil'}
              </h3>
            </div>
            <form onSubmit={handleSaveProfile} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Nome do Perfil *</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Ex: Administrador"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Descrição</label>
                <textarea
                  value={profileDesc}
                  onChange={(e) => setProfileDesc(e.target.value)}
                  placeholder="Explique os privilégios deste perfil..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-sky-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProfileEditorOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-850 hover:bg-slate-100 text-slate-650 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-505 text-white font-bold cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IN-PLACE MODAL FOR ROLES (FUNCTIONS) */}
      {isRoleEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {editingRoleId ? 'Editar Função' : 'Nova Função'}
              </h3>
            </div>
            <form onSubmit={handleSaveRole} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Nome da Função (Cargo) *</label>
                <input
                  type="text"
                  required
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="Ex: Engenheiro de Automação"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Descrição</label>
                <textarea
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  placeholder="Descrição da responsabilidade organizacional..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-sky-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRoleEditorOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-850 hover:bg-slate-100 text-slate-650 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-505 text-white font-bold cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
