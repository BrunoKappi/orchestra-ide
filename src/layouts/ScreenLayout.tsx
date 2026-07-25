import React, { useEffect } from 'react';
import { useScreenStore } from '../store/useScreenStore';
import { useWidgetStore } from '../store/useWidgetStore';
import { useObjectModelStore } from '../store/useObjectModelStore';
import { HeaderNavigation } from '../components/navigation/HeaderNavigation';
import { ResizableSplitPane } from '../components/ui/ResizableSplitPane';
import { ScreenTree } from '../features/screen-designer/ScreenTree';
import { ScreenCanvasEditor } from '../features/screen-designer/ScreenCanvasEditor';
import { ScreenElementInspector } from '../features/screen-designer/ScreenElementInspector';

export const ScreenLayout: React.FC = () => {
  const { init: initScreens, screens, selectedScreen } = useScreenStore();
  const { init: initWidgets } = useWidgetStore();
  const { init: initObjects } = useObjectModelStore();

  useEffect(() => {
    initScreens();
    initWidgets();
    initObjects();
  }, [initScreens, initWidgets, initObjects]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans select-none">
      {/* Top Navigation */}
      <HeaderNavigation />

      {/* Main Workspace */}
      <main className="flex-1 overflow-hidden">
        <ResizableSplitPane
          leftPane={<ScreenTree />}
          rightPane={
            <ResizableSplitPane
              leftPane={<ScreenCanvasEditor />}
              rightPane={<ScreenElementInspector />}
              initialLeftWidth={1050}
              minLeftWidth={400}
              maxLeftWidth={1800}
            />
          }
          initialLeftWidth={260}
        />
      </main>

      {/* Bottom Status Bar */}
      <footer className="h-6 border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center justify-between px-3 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            <span className="font-medium text-slate-700 dark:text-slate-300 font-medium">Screen Designer Active</span>
          </div>
          <span>Telas: <strong className="text-slate-600 dark:text-slate-300">{screens.length}</strong></span>
        </div>
        <div>
          {selectedScreen && (
            <span>Editando: <strong className="text-violet-600 dark:text-violet-400">{selectedScreen.name}</strong></span>
          )}
        </div>
        <span>Orquestra Screen Designer v1.0</span>
      </footer>
    </div>
  );
};

