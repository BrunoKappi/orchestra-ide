import React, { useEffect } from 'react';
import { useOmmStore } from '../store/useOmmStore';
import { OmmKpiHeader } from './layout/OmmKpiHeader';
import { OmmToolbar } from './layout/OmmToolbar';
import { MovementTable } from './table/MovementTable';
import { DetailPanel } from './detail/DetailPanel';
import { PlantOverview } from './views/PlantOverview';
import { MovementTimeline } from './views/MovementTimeline';
import { InventoryDashboard } from './views/InventoryDashboard';
import { CutoffHistory } from './views/CutoffHistory';
import { AdminPanel } from './admin/AdminPanel';
import { ArrowLeftRight } from 'lucide-react';

// ---------------------------------------------------------------------------
// View tab bar
// ---------------------------------------------------------------------------
const VIEW_TABS: { id: string; label: string }[] = [
  { id: 'movements', label: 'Movimentos' },
  { id: 'plant',     label: 'Planta' },
  { id: 'timeline',  label: 'Timeline' },
  { id: 'inventory', label: 'Inventário' },
  { id: 'cutoff',    label: 'Cut-off' },
  { id: 'admin',     label: 'Admin' },
];

// ---------------------------------------------------------------------------
// OMM Layout
// ---------------------------------------------------------------------------
export const OmmLayout: React.FC = () => {
  const init = useOmmStore((s) => s.init);
  const activeView = useOmmStore((s) => s.activeView);
  const setActiveView = useOmmStore((s) => s.setActiveView);
  const isDetailPanelOpen = useOmmStore((s) => s.isDetailPanelOpen);

  useEffect(() => {
    init();
    return () => {
      // Engine continues running in background across navigation
    };
  }, [init]);

  const renderMainContent = () => {
    switch (activeView) {
      case 'plant':     return <PlantOverview />;
      case 'timeline':  return <MovementTimeline />;
      case 'inventory': return <InventoryDashboard />;
      case 'cutoff':    return <CutoffHistory />;
      case 'admin':     return <AdminPanel />;
      default:          return (
        <div className="flex flex-1 overflow-hidden">
          <MovementTable />
          {isDetailPanelOpen && <DetailPanel />}
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Module title bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 shadow-sm shadow-sky-500/20">
              <ArrowLeftRight className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">OMM</div>
              <div className="text-[9px] text-slate-400 -mt-0.5 leading-none">Order Movement Manager</div>
            </div>
          </div>

          {/* View tabs */}
          <div className="flex items-center gap-0.5 ml-4 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as typeof activeView)}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer
                  ${activeView === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-[10px] text-slate-400 font-mono">
          Orquestra OMM v1.0 · PoC MES
        </div>
      </div>

      {/* KPI header (only on movements view) */}
      {activeView === 'movements' && <OmmKpiHeader />}

      {/* Toolbar (only on movements view) */}
      {activeView === 'movements' && <OmmToolbar />}

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {renderMainContent()}
      </div>
    </div>
  );
};
