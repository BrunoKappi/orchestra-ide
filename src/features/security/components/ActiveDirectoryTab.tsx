import React, { useState } from 'react';
import { useActiveDirectoryStore } from '../../../store/useActiveDirectoryStore';
import { useSecurityStore } from '../../../store/useSecurityStore';
import {
  Server,
  Database,
  Users,
  User as UserIcon,
  Cpu,
  Folder,
  Shield,
  RefreshCw,
  Settings,
  Activity,
  FileText,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Play,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Trash2,
  Info
} from 'lucide-react';

export const ActiveDirectoryTab: React.FC = () => {
  const {
    config,
    users,
    groups,
    ous,
    computers,
    mappings,
    logs,
    advanced,
    stats,
    isSyncing,
    syncProgress,
    syncLogMsg,
    updateConfig,
    restoreDefaults,
    testConnection,
    saveMappings,
    updateAdvanced,
    triggerSync,
    clearLogs
  } = useActiveDirectoryStore();

  const { profiles } = useSecurityStore();

  // Internal states
  const [showPassword, setShowPassword] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'groups' | 'ous' | 'computers'>('users');
  const [activeMainTab, setActiveMainTab] = useState<'config' | 'sync' | 'mappings' | 'logs'>('config');

  // Sync checkboxes
  const [syncUsers, setSyncUsers] = useState(true);
  const [syncGroups, setSyncGroups] = useState(true);
  const [syncOUs, setSyncOUs] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [importNew, setImportNew] = useState(true);
  const [disableRemoved, setDisableRemoved] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Search filter for tables
  const [tableSearch, setTableSearch] = useState('');

  // Handle Testing Connection
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testConnection();
      setTestResult(res);
    } catch {
      setTestResult({ success: false, message: 'Ocorreu um erro inesperado ao testar conexão.' });
    } finally {
      setIsTesting(false);
    }
  };

  // Handle Triggering simulated Sync
  const handleTriggerSync = async () => {
    if (isSyncing) return;
    await triggerSync({
      syncUsers,
      syncGroups,
      syncOUs,
      updateExisting,
      importNew,
      disableRemoved,
      isManual: true
    });
  };

  // Handle Mapping change
  const handleMappingChange = (groupName: string, profileId: string) => {
    const existingIdx = mappings.findIndex(m => m.adGroupName === groupName);
    let newMappings = [...mappings];
    if (existingIdx !== -1) {
      if (profileId === '') {
        // remove mapping
        newMappings = newMappings.filter(m => m.adGroupName !== groupName);
      } else {
        newMappings[existingIdx] = { adGroupName: groupName, profileId };
      }
    } else if (profileId !== '') {
      newMappings.push({ adGroupName: groupName, profileId });
    }
    saveMappings(newMappings);
  };

  // Filtering lists based on search query
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
    u.login.toLowerCase().includes(tableSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(tableSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(tableSearch.toLowerCase()) ||
    u.department.toLowerCase().includes(tableSearch.toLowerCase())
  );

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
    g.description.toLowerCase().includes(tableSearch.toLowerCase())
  );

  const filteredOUs = ous.filter(o =>
    o.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
    o.description.toLowerCase().includes(tableSearch.toLowerCase())
  );

  const filteredComputers = computers.filter(c =>
    c.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
    c.operatingSystem.toLowerCase().includes(tableSearch.toLowerCase()) ||
    c.description.toLowerCase().includes(tableSearch.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-4">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Server className="w-5 h-5 text-sky-500" />
            <span>Integração com Active Directory</span>
            <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Demonstração / PoC
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure a sincronização de contas de usuários corporativos e mapeamento de grupos de segurança LDAP.
          </p>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex space-x-6 text-xs font-semibold">
          <button
            onClick={() => setActiveMainTab('config')}
            className={`pb-3 transition-colors border-b-2 cursor-pointer ${
              activeMainTab === 'config'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Configuração da Conexão
          </button>
          <button
            onClick={() => setActiveMainTab('sync')}
            className={`pb-3 transition-colors border-b-2 cursor-pointer ${
              activeMainTab === 'sync'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Objetos & Sincronização
          </button>
          <button
            onClick={() => setActiveMainTab('mappings')}
            className={`pb-3 transition-colors border-b-2 cursor-pointer ${
              activeMainTab === 'mappings'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Mapeamento de Grupos
          </button>
          <button
            onClick={() => setActiveMainTab('logs')}
            className={`pb-3 transition-colors border-b-2 cursor-pointer ${
              activeMainTab === 'logs'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Logs de Sincronização
          </button>
        </div>
      </div>

      {/* Main Workspace Scrollable Area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        
        {/* TAB 1: CONNECTION CONFIGURATION */}
        {activeMainTab === 'config' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-sky-500" /> Parâmetros de Comunicação LDAP/AD
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Connection Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-650 dark:text-slate-400 mb-1">
                    Nome da Conexão
                  </label>
                  <input
                    type="text"
                    value={config.connectionName}
                    onChange={(e) => updateConfig({ connectionName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-650 dark:text-slate-400 mb-1">
                    Status Administrativo
                  </label>
                  <select
                    value={config.status}
                    onChange={(e) => updateConfig({ status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
                  >
                    <option value="Ativa">Ativa (Habilitada)</option>
                    <option value="Inativa">Inativa (Desabilitada)</option>
                  </select>
                </div>

                {/* Domain Controller Host */}
                <div>
                  <label className="block text-xs font-semibold text-slate-650 dark:text-slate-400 mb-1">
                    Servidor / Domain Controller
                  </label>
                  <input
                    type="text"
                    value={config.server}
                    onChange={(e) => updateConfig({ server: e.target.value })}
                    placeholder="Ex: dc01.suaempresa.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                {/* LDAP Port */}
                <div>
                  <label className="block text-xs font-semibold text-slate-650 dark:text-slate-400 mb-1">
                    Porta LDAP (Padrão: 389)
                  </label>
                  <input
                    type="number"
                    value={config.ldapPort}
                    onChange={(e) => updateConfig({ ldapPort: parseInt(e.target.value) || 389 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                {/* LDAPS Port */}
                <div>
                  <label className="block text-xs font-semibold text-slate-650 dark:text-slate-400 mb-1">
                    Porta LDAPS (SSL/TLS: 636)
                  </label>
                  <input
                    type="number"
                    value={config.ldapsPort}
                    onChange={(e) => updateConfig({ ldapsPort: parseInt(e.target.value) || 636 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                {/* Domain Windows */}
                <div>
                  <label className="block text-xs font-semibold text-slate-650 dark:text-slate-400 mb-1">
                    Domínio Windows (NetBIOS)
                  </label>
                  <input
                    type="text"
                    value={config.domain}
                    onChange={(e) => updateConfig({ domain: e.target.value })}
                    placeholder="Ex: empresa.corp"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                {/* Base DN */}
                <div>
                  <label className="block text-xs font-semibold text-slate-650 dark:text-slate-400 mb-1">
                    Base Distinguished Name (Base DN)
                  </label>
                  <input
                    type="text"
                    value={config.baseDn}
                    onChange={(e) => updateConfig({ baseDn: e.target.value })}
                    placeholder="Ex: DC=empresa,DC=corp"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                {/* Service Account User */}
                <div>
                  <label className="block text-xs font-semibold text-slate-650 dark:text-slate-400 mb-1">
                    Usuário de Serviço (Bind DN)
                  </label>
                  <input
                    type="text"
                    value={config.serviceUser}
                    onChange={(e) => updateConfig({ serviceUser: e.target.value })}
                    placeholder="Ex: CN=SvcOrchestra,OU=ServiceAccounts,..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                {/* Service Account Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-650 dark:text-slate-400 mb-1">
                    Senha de Serviço
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={config.servicePassword || ''}
                      onChange={(e) => updateConfig({ servicePassword: e.target.value })}
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Connection Timeout */}
                <div>
                  <label className="block text-xs font-semibold text-slate-650 dark:text-slate-400 mb-1">
                    Timeout de Conexão (segundos)
                  </label>
                  <input
                    type="number"
                    value={config.timeout}
                    onChange={(e) => updateConfig({ timeout: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                {/* SSL/TLS Toggle */}
                <div className="flex items-center gap-3 h-full pt-4">
                  <input
                    type="checkbox"
                    id="useSslTls"
                    checked={config.useSslTls}
                    onChange={(e) => updateConfig({ useSslTls: e.target.checked })}
                    className="w-4 h-4 text-sky-600 border-slate-300 rounded-sm focus:ring-sky-500"
                  />
                  <label htmlFor="useSslTls" className="text-xs font-semibold text-slate-755 dark:text-slate-350 cursor-pointer select-none">
                    Utilizar SSL/TLS (LDAPS criptografado)
                  </label>
                </div>

                {/* Auth Method */}
                <div>
                  <label className="block text-xs font-semibold text-slate-650 dark:text-slate-400 mb-1">
                    Método de Autenticação
                  </label>
                  <select
                    value={config.authMethod}
                    onChange={(e) => updateConfig({ authMethod: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
                  >
                    <option value="Simple">Simple Bind</option>
                    <option value="SASL/GSSAPI">Kerberos (SASL/GSSAPI)</option>
                    <option value="SASL/DIGEST-MD5">SASL/DIGEST-MD5</option>
                  </select>
                </div>

                {/* LDAP Version */}
                <div>
                  <label className="block text-xs font-semibold text-slate-650 dark:text-slate-400 mb-1">
                    Versão do Protocolo LDAP
                  </label>
                  <select
                    value={config.ldapVersion}
                    onChange={(e) => updateConfig({ ldapVersion: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
                  >
                    <option value="v3">LDAP v3 (Recomendado)</option>
                    <option value="v2">LDAP v2</option>
                  </select>
                </div>

                {/* Connection Description */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-650 dark:text-slate-400 mb-1">
                    Descrição da Conexão
                  </label>
                  <input
                    type="text"
                    value={config.description}
                    onChange={(e) => updateConfig({ description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              {/* Trusted Certificate Textarea */}
              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-650 dark:text-slate-400 mb-1">
                  Certificado Confiável CA (Formato PEM/Base64)
                </label>
                <textarea
                  rows={3}
                  value={config.trustedCert}
                  onChange={(e) => updateConfig({ trustedCert: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-mono outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              {/* Connection Buttons Actions */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={restoreDefaults}
                  className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-lg transition-colors cursor-pointer"
                >
                  Restaurar Valores Padrão
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="px-4 py-2 text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 active:bg-sky-500/30 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isTesting ? 'Validando...' : 'Testar Conexão'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      alert('Configuração salva localmente com sucesso!');
                    }}
                    className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Salvar Configuração
                  </button>
                </div>
              </div>

              {/* Test Connection Results Alert Box */}
              {testResult && (
                <div className={`mt-4 p-4 rounded-xl border flex items-start gap-3 animate-in fade-in duration-200 ${
                  testResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-400'
                }`}>
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 shrink-0 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">{testResult.success ? 'Conexão Estabelecida' : 'Erro de Conexão'}</h4>
                    <p className="text-[11px] mt-1 font-semibold leading-relaxed">{testResult.message}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Simulated Architecture Information Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-xl flex gap-3">
              <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                <span className="font-bold text-slate-700 dark:text-slate-250">Nota de Integração Arquitetural:</span> Esta interface e seu estado foram modelados para refletir a especificação real de um barramento LDAP corporativo. Numa implantação final, este módulo se conecta nativamente com provedores como Microsoft Active Directory, Microsoft Entra ID (Azure AD), OpenLDAP ou Okta, gerenciando autenticação integrada (Single Sign-On / SSO) e provisionando tokens JWT de segurança para os perfis RBAC locais da plataforma.
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: OBJECTS TABLES & SIMULATED SYNC PROGRESS */}
        {activeMainTab === 'sync' && (
          <div className="space-y-4 flex flex-col">
            
            {/* Sync control block */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Sync settings actions */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5" /> Escopo do Serviço de Sincronização
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <label className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={syncUsers}
                        onChange={(e) => setSyncUsers(e.target.checked)}
                        className="w-4 h-4 text-sky-600 border-slate-350 focus:ring-sky-500"
                      />
                      <span>Usuários</span>
                    </label>

                    <label className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={syncGroups}
                        onChange={(e) => setSyncGroups(e.target.checked)}
                        className="w-4 h-4 text-sky-600 border-slate-350 focus:ring-sky-500"
                      />
                      <span>Grupos de Segurança</span>
                    </label>

                    <label className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={syncOUs}
                        onChange={(e) => setSyncOUs(e.target.checked)}
                        className="w-4 h-4 text-sky-600 border-slate-350 focus:ring-sky-500"
                      />
                      <span>Estrutura (OUs)</span>
                    </label>

                    <label className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={updateExisting}
                        onChange={(e) => setUpdateExisting(e.target.checked)}
                        className="w-4 h-4 text-sky-600 border-slate-350 focus:ring-sky-500"
                      />
                      <span>Atualizar Existentes</span>
                    </label>

                    <label className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={importNew}
                        onChange={(e) => setImportNew(e.target.checked)}
                        className="w-4 h-4 text-sky-600 border-slate-350 focus:ring-sky-500"
                      />
                      <span>Importar Novos</span>
                    </label>

                    <label className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={disableRemoved}
                        onChange={(e) => setDisableRemoved(e.target.checked)}
                        className="w-4 h-4 text-sky-600 border-slate-350 focus:ring-sky-500"
                      />
                      <span>Inativar Removidos</span>
                    </label>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-450">Sincronização Periódica:</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full">
                      Automática ({advanced.syncFrequency})
                    </span>
                  </div>

                  <button
                    onClick={handleTriggerSync}
                    disabled={isSyncing}
                    className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Iniciar Sincronização</span>
                  </button>
                </div>
              </div>

              {/* Statistics Panel */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-sky-500" /> Estatísticas do AD Local
                </h3>
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-lg">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Usuários</div>
                    <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{stats.syncedUsersCount}</div>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-lg">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Grupos de Seg.</div>
                    <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{stats.groupsFoundCount}</div>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-lg">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Unidades Org.</div>
                    <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{stats.ousCount}</div>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-lg">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Perfis Vinculados</div>
                    <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{stats.linkedProfilesCount}</div>
                  </div>
                </div>
                <div className="mt-3 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between items-center">
                  <span>Última Sync: <strong className="text-slate-700 dark:text-slate-350">{stats.lastSyncTime}</strong></span>
                  <span>Duração: <strong className="text-slate-700 dark:text-slate-350">{stats.syncDuration}</strong></span>
                </div>
              </div>
            </div>

            {/* Sync Progress Bar */}
            {isSyncing && (
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 animate-pulse">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-500" />
                    <span>{syncLogMsg}</span>
                  </span>
                  <span className="text-sky-600 dark:text-sky-400 font-bold">{syncProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-sky-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${syncProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Advanced Settings Drawer Accordion */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                className="w-full px-5 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
              >
                <span className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-500" /> Configurações Avançadas de Atributos & Filtros
                </span>
                {isAdvancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {isAdvancedOpen && (
                <div className="p-5 border-t border-slate-150 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* LDAP query filter */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-650 dark:text-slate-450 mb-1">
                      Filtro de Consulta LDAP
                    </label>
                    <input
                      type="text"
                      value={advanced.ldapFilter}
                      onChange={(e) => updateAdvanced({ ldapFilter: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 font-mono"
                    />
                  </div>

                  {/* Attributes synchronized */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-650 dark:text-slate-450 mb-1">
                      Atributos LDAP Mapeados
                    </label>
                    <input
                      type="text"
                      value={advanced.syncedAttributes}
                      onChange={(e) => updateAdvanced({ syncedAttributes: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 font-mono"
                    />
                  </div>

                  {/* Excluded OUs */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-650 dark:text-slate-450 mb-1">
                      Excluir Unidades Organizacionais (DNs)
                    </label>
                    <input
                      type="text"
                      value={advanced.excludedOUs}
                      onChange={(e) => updateAdvanced({ excludedOUs: e.target.value })}
                      placeholder="Ex: OU=Test,DC=corp"
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Frequência de sync */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-650 dark:text-slate-450 mb-1">
                      Frequência de Sincronização Periódica
                    </label>
                    <select
                      value={advanced.syncFrequency}
                      onChange={(e) => updateAdvanced({ syncFrequency: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500"
                    >
                      <option value="A cada 30 minutos">A cada 30 minutos</option>
                      <option value="A cada 1 hora">A cada 1 hora</option>
                      <option value="A cada 6 horas">A cada 6 horas</option>
                      <option value="A cada 12 horas">A cada 12 horas</option>
                      <option value="Diário">Diário (Meia-noite)</option>
                      <option value="Semanal">Semanal (Domingo)</option>
                    </select>
                  </div>

                  {/* Conflict resolution */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-650 dark:text-slate-450 mb-1">
                      Estratégia de Resolução de Conflitos
                    </label>
                    <select
                      value={advanced.conflictResolution}
                      onChange={(e) => updateAdvanced({ conflictResolution: e.target.value as any })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500"
                    >
                      <option value="Sobrescrever Local">Sobrescrever Dados Locais pelo AD (Recomendado)</option>
                      <option value="Manter Local">Priorizar Dados Locais e ignorar AD</option>
                      <option value="Mesclar">Mesclar Atributos (Preencher vazios)</option>
                    </select>
                  </div>

                  {/* Attribute transforms and settings */}
                  <div className="flex flex-col justify-center gap-2 pt-2">
                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={advanced.transformLoginLower}
                        onChange={(e) => updateAdvanced({ transformLoginLower: e.target.checked })}
                        className="w-3.5 h-3.5 text-sky-600 rounded-sm"
                      />
                      <span>Forçar Login em Letras Minúsculas</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={advanced.normalizeNames}
                        onChange={(e) => updateAdvanced({ normalizeNames: e.target.checked })}
                        className="w-3.5 h-3.5 text-sky-600 rounded-sm"
                      />
                      <span>Normalizar Nomes de Exibição (Remover espaços extras)</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={advanced.updateGroupsOnLogin}
                        onChange={(e) => updateAdvanced({ updateGroupsOnLogin: e.target.checked })}
                        className="w-3.5 h-3.5 text-sky-600 rounded-sm"
                      />
                      <span>Atualizar Membros do Grupo a cada Logon do Usuário</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Objects visualizer tables with inner tabs */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col flex-1 min-h-[400px]">
              
              {/* Inner Tabs header & search filter */}
              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-150 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  <button
                    onClick={() => setActiveSubTab('users')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      activeSubTab === 'users'
                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800'
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>Usuários ({users.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveSubTab('groups')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      activeSubTab === 'groups'
                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800'
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Grupos de Segurança ({groups.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveSubTab('ous')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      activeSubTab === 'ous'
                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800'
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5" />
                    <span>Unidades Organizacionais ({ous.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveSubTab('computers')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      activeSubTab === 'computers'
                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800'
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Computadores ({computers.length})</span>
                  </button>
                </div>

                {/* Filter Search Input */}
                <input
                  type="text"
                  placeholder="Pesquisar nesta tabela..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="px-3 py-1 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 w-full md:w-60"
                />
              </div>

              {/* Grid content container */}
              <div className="flex-1 overflow-auto">
                
                {/* SUB TAB: USERS */}
                {activeSubTab === 'users' && (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-850 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="px-4 py-2.5">Foto</th>
                        <th className="px-4 py-2.5">Nome Completo</th>
                        <th className="px-4 py-2.5">Login / Username</th>
                        <th className="px-4 py-2.5">E-mail</th>
                        <th className="px-4 py-2.5">Cargo / Departamento</th>
                        <th className="px-4 py-2.5">Distinguished Name (DN)</th>
                        <th className="px-4 py-2.5">Unidade Organizacional</th>
                        <th className="px-4 py-2.5">Grupos Membros</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5">Último Logon</th>
                        <th className="px-4 py-2.5">SID / GUID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-650 dark:text-slate-300 font-medium">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="px-4 py-8 text-center text-slate-400">Nenhum usuário simulado encontrado.</td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.guid} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                            <td className="px-4 py-2.5">
                              <img src={u.avatarUrl} alt={u.name} className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-0.5 object-contain" />
                            </td>
                            <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">{u.name}</td>
                            <td className="px-4 py-2.5 font-mono text-[11px]">@{u.login}</td>
                            <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{u.email}</td>
                            <td className="px-4 py-2.5">
                              <div className="font-semibold text-slate-700 dark:text-slate-200">{u.role}</div>
                              <div className="text-[10px] text-slate-400">{u.department} ({u.company})</div>
                            </td>
                            <td className="px-4 py-2.5 max-w-[200px] truncate font-mono text-[10px]" title={u.dn}>{u.dn}</td>
                            <td className="px-4 py-2.5">
                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 text-[10px] font-bold rounded-md">
                                {u.ou}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex flex-wrap gap-1 max-w-[220px]">
                                {u.memberOf.map(grp => (
                                  <span key={grp} className="px-1.5 py-0.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[9px] font-bold rounded">
                                    {grp}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                u.accountStatus === 'Ativa'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              }`}>
                                {u.accountStatus}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap text-slate-450 dark:text-slate-500 text-[11px] font-mono">{u.lastLogon}</td>
                            <td className="px-4 py-2.5">
                              <div className="text-[9px] font-mono text-slate-400 truncate max-w-[120px]" title={`SID: ${u.sid}`}>S: {u.sid.split('-').pop()}</div>
                              <div className="text-[9px] font-mono text-slate-400 truncate max-w-[120px]" title={`GUID: ${u.guid}`}>G: {u.guid.substring(0, 8)}...</div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {/* SUB TAB: SECURITY GROUPS */}
                {activeSubTab === 'groups' && (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-850 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="px-4 py-2.5">Nome do Grupo</th>
                        <th className="px-4 py-2.5">Descrição</th>
                        <th className="px-4 py-2.5">Distinguished Name</th>
                        <th className="px-4 py-2.5">Tipo</th>
                        <th className="px-4 py-2.5">Membros Ativos</th>
                        <th className="px-4 py-2.5">GUID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-650 dark:text-slate-300 font-medium">
                      {filteredGroups.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-400">Nenhum grupo simulado encontrado.</td>
                        </tr>
                      ) : (
                        filteredGroups.map((g) => (
                          <tr key={g.guid} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                            <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                              <Users className="w-3.5 h-3.5 text-slate-400" /> {g.name}
                            </td>
                            <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{g.description}</td>
                            <td className="px-4 py-2.5 font-mono text-[10px] max-w-[300px] truncate" title={g.dn}>{g.dn}</td>
                            <td className="px-4 py-2.5">
                              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-md">
                                {g.type}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-bold text-slate-700 dark:text-slate-300">{g.memberCount} usuários</td>
                            <td className="px-4 py-2.5 font-mono text-[10px] text-slate-400">{g.guid}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {/* SUB TAB: ORGANIZATIONAL UNITS */}
                {activeSubTab === 'ous' && (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-850 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="px-4 py-2.5">Nome da OU</th>
                        <th className="px-4 py-2.5">Descrição</th>
                        <th className="px-4 py-2.5">Distinguished Name (DN)</th>
                        <th className="px-4 py-2.5">GUID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-650 dark:text-slate-300 font-medium">
                      {filteredOUs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-slate-400">Nenhuma Unidade Organizacional encontrada.</td>
                        </tr>
                      ) : (
                        filteredOUs.map((o) => (
                          <tr key={o.guid} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                            <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                              <Folder className="w-3.5 h-3.5 text-amber-500" /> {o.name}
                            </td>
                            <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{o.description}</td>
                            <td className="px-4 py-2.5 font-mono text-[10px]" title={o.dn}>{o.dn}</td>
                            <td className="px-4 py-2.5 font-mono text-[10px] text-slate-400">{o.guid}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {/* SUB TAB: COMPUTERS */}
                {activeSubTab === 'computers' && (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-850 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="px-4 py-2.5">Hostname</th>
                        <th className="px-4 py-2.5">Sistema Operacional</th>
                        <th className="px-4 py-2.5">Descrição</th>
                        <th className="px-4 py-2.5">DN</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5">GUID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-650 dark:text-slate-300 font-medium">
                      {filteredComputers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-400">Nenhum computador encontrado no domínio.</td>
                        </tr>
                      ) : (
                        filteredComputers.map((c) => (
                          <tr key={c.guid} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                            <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                              <Cpu className="w-3.5 h-3.5 text-sky-500" /> {c.name}
                            </td>
                            <td className="px-4 py-2.5 text-slate-650 dark:text-slate-300">{c.operatingSystem}</td>
                            <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{c.description}</td>
                            <td className="px-4 py-2.5 font-mono text-[10px] max-w-[200px] truncate" title={c.dn}>{c.dn}</td>
                            <td className="px-4 py-2.5">
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full">
                                {c.status}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-mono text-[10px] text-slate-400">{c.guid}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GROUP MAPPINGS RBAC */}
        {activeMainTab === 'mappings' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-sky-500" /> Vinculação de Perfis RBAC locais aos Grupos do Active Directory
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                Associe cada grupo de segurança lido do Active Directory a um perfil administrativo e operacional (RBAC) local do Orquestra IDE. Usuários pertencentes a esses grupos herdarão automaticamente as respectivas políticas e matrizes de permissões.
              </p>

              <div className="border border-slate-200 dark:border-slate-850 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-850 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="px-5 py-3">Grupo de Segurança AD</th>
                      <th className="px-5 py-3">Distinguished Name (AD Target)</th>
                      <th className="px-5 py-3 text-center">Relação de Herança</th>
                      <th className="px-5 py-3">Perfil do Sistema (RBAC)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-350">
                    {groups.map((grp) => {
                      const mapping = mappings.find(m => m.adGroupName === grp.name);
                      return (
                        <tr key={grp.guid} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-800 dark:text-slate-100">{grp.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{grp.description}</div>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-[10px] text-slate-400">{grp.dn}</td>
                          <td className="px-5 py-3.5 text-center">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              <span>Mapeado</span> <ArrowRight className="w-3 h-3" />
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <select
                              value={mapping?.profileId || ''}
                              onChange={(e) => handleMappingChange(grp.name, e.target.value)}
                              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-xs outline-none focus:border-sky-500 font-semibold cursor-pointer w-60"
                            >
                              <option value="">-- Sem Perfil (Ignorar) --</option>
                              {profiles.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: HISTORICAL LOGS */}
        {activeMainTab === 'logs' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-sky-500" /> Histórico de Execuções e Auditoria de Sincronização
                </h3>
                {logs.length > 0 && (
                  <button
                    onClick={clearLogs}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-450 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpar Histórico</span>
                  </button>
                )}
              </div>

              <div className="border border-slate-200 dark:border-slate-850 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-850 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="px-4 py-2.5">Data/Hora</th>
                      <th className="px-4 py-2.5">Responsável</th>
                      <th className="px-4 py-2.5">Operação Executada</th>
                      <th className="px-4 py-2.5 text-center">Objetos Processados</th>
                      <th className="px-4 py-2.5 text-center">Duração</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5">Detalhes / Mensagem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-350">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400">Nenhum log registrado. Execute uma sincronização simulada.</td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px]">
                            {log.date} <span className="text-slate-400">{log.time}</span>
                          </td>
                          <td className="px-4 py-3 font-semibold">{log.responsible}</td>
                          <td className="px-4 py-3 text-slate-800 dark:text-slate-200 font-semibold">{log.operation}</td>
                          <td className="px-4 py-3 text-center font-bold text-slate-800 dark:text-slate-200">{log.processedCount}</td>
                          <td className="px-4 py-3 text-center font-mono text-slate-450 dark:text-slate-500">{(log.durationMs / 1000).toFixed(2)}s</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.status === 'Sucesso'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">{log.message}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
