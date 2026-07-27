import React, { useEffect } from 'react';
import { Boxes, FolderTree, Search } from 'lucide-react';
import { useObjectModelStore } from '../store/useObjectModelStore';
import { ResizableSplitPane } from '../components/ui/ResizableSplitPane';
import { DerivationTree } from '../features/object-model/DerivationTree';
import { DeploymentTree } from '../features/object-model/DeploymentTree';
import { CentralEditor } from '../features/object-model/CentralEditor';
import { HeaderNavigation } from '../components/navigation/HeaderNavigation';
import { cn } from '../utils/cn';

export const IDELayout: React.FC = () => {
  const {
    activeSidebarTab,
    setActiveSidebarTab,
    theme,
    searchQuery,
    setSearchQuery,
    templates,
    objects,
    init,
  } = useObjectModelStore();


  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    // Ensure light theme is the default — only add dark class when explicitly set to dark
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // On mount: always start as light by removing any stale dark class
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const leftPaneContent = (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sidebar Top Search Input */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/30">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates & instances..."
            className="w-full pl-8 pr-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
          />
        </div>
      </div>

      {/* Sidebar Tabs: Derivation vs Deployment */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60 text-xs font-medium">
        <button
          onClick={() => setActiveSidebarTab('derivation')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 border-b-2 font-semibold transition-colors duration-150',
            activeSidebarTab === 'derivation'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          )}
        >
          <Boxes className="w-3.5 h-3.5 text-sky-500" />
          <span>Derivation</span>
        </button>

        <button
          onClick={() => setActiveSidebarTab('deployment')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 border-b-2 font-semibold transition-colors duration-150',
            activeSidebarTab === 'deployment'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          )}
        >
          <FolderTree className="w-3.5 h-3.5 text-amber-500" />
          <span>Deployment</span>
        </button>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
        {activeSidebarTab === 'derivation' ? <DerivationTree /> : <DeploymentTree />}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Shared Header Navigation */}
      <HeaderNavigation />


      {/* Main IDE Workspace */}
      <main className="flex-1 overflow-hidden">
        <ResizableSplitPane
          leftPane={leftPaneContent}
          rightPane={<CentralEditor />}
          initialLeftWidth={320}
        />
      </main>

      {/* Bottom Status Bar */}
      <footer className="h-6 border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center justify-between px-3 text-[11px] text-slate-500 dark:text-slate-400 shrink-0 select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              LocalStorage DB Active
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            <span>Templates: <strong className="text-slate-600 dark:text-slate-300">{templates.length}</strong></span>
            <span>Instances: <strong className="text-slate-600 dark:text-slate-300">{objects.length}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-400">
          <span>Orquestra Industrial Object Platform MVP v1.0</span>
        </div>
      </footer>
    </div>
  );
};
