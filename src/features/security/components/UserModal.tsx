import React, { useState, useEffect } from 'react';
import { useSecurityStore } from '../../../store/useSecurityStore';
import { Modal } from '../../../components/ui/Modal';
import { User, Mail, Shield, Briefcase, MapPin, RefreshCw } from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null; // If null, we are creating a new user
}

export const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, userId }) => {
  const { users, groups, profiles, roles, addUser, updateUser } = useSecurityStore();

  const [name, setName] = useState('');
  const [login, setLogin] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [area, setArea] = useState('');
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [profileId, setProfileId] = useState('');
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo');
  const [language, setLanguage] = useState('pt-BR');
  const [preferredTheme, setPreferredTheme] = useState<'light' | 'dark'>('light');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Reset/Load form data when opening modal
  useEffect(() => {
    if (isOpen) {
      if (userId) {
        const user = users.find((u) => u.id === userId);
        if (user) {
          setName(user.name);
          setLogin(user.login);
          setEmail(user.email);
          setRole(user.role);
          setArea(user.area);
          setGroupIds(user.groupIds || []);
          setProfileId(user.profileId);
          setStatus(user.status);
          setLanguage(user.language);
          setPreferredTheme(user.preferredTheme);
          setAvatarUrl(user.avatarUrl);
        }
      } else {
        // Default values for new user
        setName('');
        setLogin('');
        setEmail('');
        setRole(roles[0]?.name || '');
        setArea('');
        setGroupIds([]);
        setProfileId(profiles[0]?.id || '');
        setStatus('Ativo');
        setLanguage('pt-BR');
        setPreferredTheme('light');
        setAvatarUrl('https://api.dicebear.com/7.x/bottts/svg?seed=' + Math.random().toString(36).substring(7));
      }
    }
  }, [isOpen, userId, users, profiles, roles]);

  const generateNewAvatar = () => {
    const seed = login.trim() || Math.random().toString(36).substring(7);
    setAvatarUrl(`https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !login || !email) {
      alert('Nome, Login e E-mail são obrigatórios!');
      return;
    }

    const userData = {
      name,
      login,
      email,
      role,
      area,
      groupIds,
      profileId,
      status,
      language,
      preferredTheme,
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${login}`
    };

    if (userId) {
      updateUser(userId, userData);
    } else {
      addUser(userData);
    }

    onClose();
  };

  const handleGroupToggle = (groupId: string) => {
    setGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={userId ? 'Editar Usuário' : 'Novo Usuário'}
      subtitle={userId ? 'Atualize as credenciais e acessos do usuário' : 'Cadastre um novo usuário na plataforma Serrano'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-slate-700 dark:text-slate-200">
        {/* Profile Card / Avatar section */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="relative group shrink-0">
            <img
              src={avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=placeholder'}
              alt="Avatar"
              className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-800 border-2 border-sky-500/20 object-contain p-1"
            />
            <button
              type="button"
              onClick={generateNewAvatar}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-md transition-colors"
              title="Gerar novo avatar"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 space-y-2">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">URL do Avatar</label>
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://api.dicebear.com/..."
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
            />
          </div>
        </div>

        {/* Informações Básicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              Nome Completo <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Bruno Kappi"
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              Username / Login <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold font-mono">@</span>
              <input
                type="text"
                required
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Ex: bruno.kappi"
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              E-mail Corporativo <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: bruno@serrano.com"
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              Área Operacional
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Ex: Utilidades, Processo"
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              Cargo / Função Organizacional
            </label>
            <div className="relative">
              <Briefcase className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors cursor-pointer appearance-none"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              Perfil Principal de Segurança
            </label>
            <div className="relative">
              <Shield className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={profileId}
                onChange={(e) => setProfileId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors cursor-pointer appearance-none"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Preferências e Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/60">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Idioma</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="pt-BR">Português (pt-BR)</option>
              <option value="en-US">English (en-US)</option>
              <option value="es-ES">Español (es-ES)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Tema Preferido</label>
            <select
              value={preferredTheme}
              onChange={(e) => setPreferredTheme(e.target.value as 'light' | 'dark')}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="light">Light Theme</option>
              <option value="dark">Dark Theme</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Status</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={status === 'Ativo'}
                  onChange={() => setStatus('Ativo')}
                  className="w-4 h-4 text-sky-600 border-slate-300 focus:ring-sky-500"
                />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Ativo</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={status === 'Inativo'}
                  onChange={() => setStatus('Inativo')}
                  className="w-4 h-4 text-sky-600 border-slate-300 focus:ring-sky-500"
                />
                <span className="text-rose-600 dark:text-rose-455 font-semibold">Inativo</span>
              </label>
            </div>
          </div>
        </div>

        {/* Associação de Grupos */}
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
            Grupos Organizacionais Associados
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {groups.map((g) => {
              const isChecked = groupIds.includes(g.id);
              return (
                <label
                  key={g.id}
                  className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer select-none transition-all ${
                    isChecked
                      ? 'border-sky-500 bg-sky-500/5 dark:bg-sky-500/10'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleGroupToggle(g.id)}
                    className="w-4 h-4 mt-0.5 rounded text-sky-600 focus:ring-sky-500"
                  />
                  <div className="text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">{g.name}</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${g.color || 'bg-slate-400'}`} />
                    </div>
                    {g.description && (
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{g.description}</p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-150 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-semibold shadow-sm cursor-pointer transition-colors"
          >
            {userId ? 'Salvar Alterações' : 'Criar Usuário'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
