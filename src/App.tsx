import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { OrchestraPage } from './pages/OrchestraPage';
import { WidgetsPage } from './pages/WidgetsPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { ScreenDesignerPage } from './pages/ScreenDesignerPage';
import { ScreenRuntimePage } from './pages/ScreenRuntimePage';
import { RuntimePage } from './pages/RuntimePage';
import { DatabasePage } from './pages/DatabasePage';
import { AlarmViewerPage } from './pages/AlarmViewerPage';
import { HistorianPage } from './pages/HistorianPage';
import { PropertyBrowserPage } from './pages/PropertyBrowserPage';
import { FlowsPage } from './pages/FlowsPage';
import { FlowDesignerModal } from './features/flow-designer/FlowDesignerModal';

const setFavicon = (emoji: string) => {
  const link = (document.querySelector("link[rel~='icon']") as HTMLLinkElement) || document.createElement('link');
  link.type = 'image/svg+xml';
  link.rel = 'icon';
  link.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${emoji}</text></svg>`;
  document.getElementsByTagName('head')[0].appendChild(link);
};

export function App() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = 'Orquestra';
    let emoji = '⚙️';

    if (path === '/' || path === '/orchestra') {
      title = 'Orquestra IDE - Serrano';
      emoji = '⚙️';
    } else if (path === '/properties') {
      title = 'Property Browser - Serrano';
      emoji = '🔍';
    } else if (path === '/widgets') {
      title = 'Widgets - Serrano';
      emoji = '🎨';
    } else if (path === '/flows' || path === '/fluxos') {
      title = 'Flow Designer - Serrano';
      emoji = '🔀';
    } else if (path === '/simulator' || path === '/simulador') {
      title = 'Simulador - Serrano';
      emoji = '⚡';
    } else if (path === '/screens') {
      title = 'Telas - Serrano';
      emoji = '🖥️';
    } else if (path.startsWith('/screen/')) {
      title = 'Visualização de Tela - Serrano';
      emoji = '📱';
    } else if (path === '/runtime') {
      title = 'Runtime - Serrano';
      emoji = '🚀';
    } else if (path === '/alarms') {
      title = 'Alarmes - Serrano';
      emoji = '🔔';
    } else if (path === '/database') {
      title = 'Banco de Dados - Serrano';
      emoji = '🛢️';
    } else if (path === '/historian') {
      title = 'Historian - Serrano';
      emoji = '📈';
    }

    document.title = title;
    setFavicon(emoji);
  }, [location]);

  return (
    <>
      <Routes>
        <Route path="/" element={<OrchestraPage />} />
        <Route path="/orchestra" element={<OrchestraPage />} />
        <Route path="/properties" element={<PropertyBrowserPage />} />
        <Route path="/widgets" element={<WidgetsPage />} />
        <Route path="/flows" element={<FlowsPage />} />
        <Route path="/fluxos" element={<FlowsPage />} />
        <Route path="/simulator" element={<SimulatorPage />} />
        <Route path="/simulador" element={<SimulatorPage />} />
        <Route path="/screens" element={<ScreenDesignerPage />} />
        <Route path="/screen/:id" element={<ScreenRuntimePage />} />
        <Route path="/runtime" element={<RuntimePage />} />
        <Route path="/alarms" element={<AlarmViewerPage />} />
        <Route path="/database" element={<DatabasePage />} />
        <Route path="/historian" element={<HistorianPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <FlowDesignerModal />
    </>
  );
}

export default App;
