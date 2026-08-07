import React from 'react';
import {
  Workflow,
  Database,
  FileText,
  TrendingUp,
  Shield,
  RotateCcw,
  Zap,
  Server,
} from 'lucide-react';
import { HeaderNavigation } from '../components/navigation/HeaderNavigation';
import { useConnectivityStore } from '../store/useConnectivityStore';
import { FlowDesignerTab } from '../features/connectivity/FlowDesignerTab';
import { DataSourcesTab } from '../features/connectivity/DataSourcesTab';
import { LogsTab } from '../features/connectivity/LogsTab';
import { AnalyticsTab } from '../features/connectivity/AnalyticsTab';
import { SecretsVaultTab } from '../features/connectivity/SecretsVaultTab';

export const ConnectivityStudioPage: React.FC = () => {
  const { activeTab, setActiveTab, connections, flows, resetToSeedData } = useConnectivityStore();

  const totalConns = connections.length;
  const activeConns = connections.filter((c) => c.status === 'Connected').length;
  const totalFlows = flows.length;
  const activeFlows = flows.filter((f) => f.status === 'Running').length;
  const totalMsgs = connections.reduce((acc, c) => acc + (c.messagesProcessedCount || 0), 0);

  const navTabs = [
    { id: 'flows', label: 'Fluxos', icon: Workflow, badge: totalFlows },
    { id: 'datasources', label: 'Data Sources', icon: Database, badge: totalConns },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'secrets', label: 'Secrets', icon: Shield },
  ];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Shared Main Header Navigation */}
      <HeaderNavigation />

      {/* Connectivity Studio Sub-Header & Stats Bar */}
      <div className="h-12 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 shrink-0 shadow-2xs select-none z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-sm font-bold text-sm">
            ⚡
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-800 dark:text-slate-100 tracking-wide">
              Connectivity Studio
            </h1>
            <p className="text-[11px] text-slate-400">
              Plataforma visual de orquestração de dados industriais & IoT
            </p>
          </div>
        </div>

        {/* Top Internal Module Tabs Bar */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs border border-slate-200/80 dark:border-slate-700/80 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-500' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Top Summary Stats */}
        <div className="hidden lg:flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300">
            <Server className="w-3.5 h-3.5 text-sky-500" />
            <span>
              Conexões: <strong className="text-emerald-500">{activeConns}</strong>/{totalConns}
            </span>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300">
            <Workflow className="w-3.5 h-3.5 text-amber-500" />
            <span>
              Fluxos: <strong className="text-sky-500">{activeFlows}</strong>/{totalFlows}
            </span>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300">
            <Zap className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              Msgs: <strong>{(totalMsgs / 1000000).toFixed(1)}M</strong>
            </span>
          </div>

          <button
            onClick={resetToSeedData}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold transition-colors"
            title="Resetar Carga Inicial do Studio"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Module Active Tab Viewport */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'flows' && <FlowDesignerTab />}
        {(activeTab === 'datasources' || activeTab === 'connection-designer') && <DataSourcesTab />}
        {(activeTab === 'logs' || activeTab === 'message-inspector' || activeTab === 'scheduler') && <LogsTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {(activeTab === 'secrets' || activeTab === 'secrets-vault' || activeTab === 'global-variables' || activeTab === 'universal-mapping') && (
          <SecretsVaultTab />
        )}
      </main>
    </div>
  );
};

export default ConnectivityStudioPage;
