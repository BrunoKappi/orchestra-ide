import React, { useEffect } from 'react';
import { useWidgetStore } from '../store/useWidgetStore';
import { HeaderNavigation } from '../components/navigation/HeaderNavigation';
import { ResizableSplitPane } from '../components/ui/ResizableSplitPane';
import { WidgetTree } from '../features/widget-editor/WidgetTree';
import { WidgetCanvasEditor } from '../features/widget-editor/WidgetCanvasEditor';
import { WidgetInspectorPanel } from '../features/widget-editor/WidgetInspectorPanel';

export const WidgetLayout: React.FC = () => {
  const { init, widgets, folders, selectedWidget } = useWidgetStore();

  useEffect(() => {
    init();
  }, [init]);

  const leftPane = <WidgetTree />;

  const centerRightContent = (
    <ResizableSplitPane
      leftPane={<WidgetCanvasEditor />}
      rightPane={<WidgetInspectorPanel />}
      initialLeftWidth={850}
      minLeftWidth={400}
      maxLeftWidth={1800}
    />
  );


  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans select-none">
      {/* Top Navigation */}
      <HeaderNavigation />

      {/* Main SCADA Widget Workspace */}
      <main className="flex-1 overflow-hidden">
        <ResizableSplitPane
          leftPane={leftPane}
          rightPane={centerRightContent}
          initialLeftWidth={320}
        />
      </main>

      {/* Bottom Status Bar */}
      <footer className="h-6 border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center justify-between px-3 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Widget SCADA Database Active
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            <span>Pastas: <strong className="text-slate-600 dark:text-slate-300">{folders.length}</strong></span>
            <span>Widgets Gráficos: <strong className="text-slate-600 dark:text-slate-300">{widgets.length}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-400">
          {selectedWidget && (
            <span>Editando: <strong className="text-emerald-600 dark:text-emerald-400">{selectedWidget.name}</strong></span>
          )}
          <span>Orquestra Supervisory Graphic Widgets v1.0</span>
        </div>
      </footer>
    </div>
  );
};
