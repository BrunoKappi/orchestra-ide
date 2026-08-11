import { useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { OrchestraPage } from './pages/OrchestraPage';
import { WidgetsPage } from './pages/WidgetsPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { ScreenDesignerPage } from './pages/ScreenDesignerPage';
import { ScreenRuntimePage } from './pages/ScreenRuntimePage';
import { RuntimePage } from './pages/RuntimePage';
import { AlarmViewerPage } from './pages/AlarmViewerPage';
import { HistorianPage } from './pages/HistorianPage';
import { FlowsV2Page } from './pages/FlowsV2Page';
import { FlowV2EditorModal } from './features/flow-v2/components/FlowV2EditorModal';
import { OmmPage } from './pages/OmmPage';
import { OpcBrowserPage } from './pages/OpcBrowserPage';
import { SecurityPage } from './pages/SecurityPage';
import { ConnectivityStudioPage } from './pages/ConnectivityStudioPage';
import { GridDashboardPage } from './pages/GridDashboardPage';
import { LogsPage } from './pages/LogsPage';
import { DatabaseAnalyticsPage } from './pages/DatabaseAnalyticsPage';

import { useObjectModelStore } from './store/useObjectModelStore';
import { useOpcStore } from './store/useOpcStore';
import { useAuthStore } from './store/useAuthStore';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';

const setFavicon = (emoji: string) => {
  const link = (document.querySelector("link[rel~='icon']") as HTMLLinkElement) || document.createElement('link');
  link.type = 'image/svg+xml';
  link.rel = 'icon';
  link.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${emoji}</text></svg>`;
  document.getElementsByTagName('head')[0].appendChild(link);
};

interface AuthGuardProps {
  children: React.ReactNode;
}

function AuthGuard({ children }: AuthGuardProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export function App() {
  const location = useLocation();
  const { theme, isSimulating, simulationSpeedMs, tickSimulation } = useObjectModelStore();
  const tickOpc = useOpcStore((s) => s.tickSimulation);

  // ─── Global simulation ticker ───────────────────────────────────────────────
  // Centralised here so the simulation always runs regardless of which page is
  // currently open. Individual pages must NOT have their own tickSimulation loops.
  const tick = useCallback(() => {
    tickSimulation();
    tickOpc();
  }, [tickSimulation, tickOpc]);
  useEffect(() => {
    if (!isSimulating) return;
    const id = setInterval(tick, simulationSpeedMs);
    return () => clearInterval(id);
  }, [isSimulating, simulationSpeedMs, tick]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const path = location.pathname;
    let title = 'Orquestra';
    let emoji = '⚙️';

    if (path === '/login') {
      title = 'Login - Serrano';
      emoji = '🔒';
    } else if (path === '/' || path === '/home') {
      title = 'Home - Serrano';
      emoji = '🏠';
    } else if (path === '/orchestra') {
      title = 'Orquestra IDE - Serrano';
      emoji = '⚙️';
    } else if (path === '/widgets') {
      title = 'Widgets - Serrano';
      emoji = '🎨';
    } else if (path === '/flows' || path === '/fluxos' || path === '/flows-v2' || path === '/fluxogramas') {
      title = 'Fluxogramas - Serrano';
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
    } else if (path === '/historian') {
      title = 'Historian - Serrano';
      emoji = '📈';
    } else if (path.startsWith('/omm')) {
      title = 'OMM - Order Movement Manager';
      emoji = '🔄';
    } else if (path === '/opc-browser') {
      title = 'OPC Network Browser - Serrano';
      emoji = '🌐';
    } else if (path === '/security') {
      title = 'Segurança & Acessos - Serrano';
      emoji = '🛡️';
    } else if (path === '/connectivity') {
      title = 'Connectivity Studio - Serrano';
      emoji = '🔌';
    } else if (path === '/grid-dashboard' || path === '/grid-designer') {
      title = 'Grid Designer - Serrano';
      emoji = '📐';
    } else if (path === '/logs') {
      title = 'Logs & Rastreabilidade - Serrano';
      emoji = '📋';
    } else if (path === '/database-analytics') {
      title = 'Database Analytics - Serrano';
      emoji = '🗄️';
    }

    document.title = title;
    setFavicon(emoji);
  }, [location]);

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<AuthGuard><HomePage /></AuthGuard>} />
        <Route path="/home" element={<AuthGuard><HomePage /></AuthGuard>} />
        <Route path="/orchestra" element={<AuthGuard><OrchestraPage /></AuthGuard>} />
        <Route path="/widgets" element={<AuthGuard><WidgetsPage /></AuthGuard>} />
        <Route path="/flows" element={<AuthGuard><FlowsV2Page /></AuthGuard>} />
        <Route path="/fluxos" element={<AuthGuard><FlowsV2Page /></AuthGuard>} />
        <Route path="/flows-v2" element={<AuthGuard><FlowsV2Page /></AuthGuard>} />
        <Route path="/fluxogramas" element={<AuthGuard><FlowsV2Page /></AuthGuard>} />
        <Route path="/simulator" element={<AuthGuard><SimulatorPage /></AuthGuard>} />
        <Route path="/simulador" element={<AuthGuard><SimulatorPage /></AuthGuard>} />
        <Route path="/screens" element={<AuthGuard><ScreenDesignerPage /></AuthGuard>} />
        <Route path="/screen/:id" element={<AuthGuard><ScreenRuntimePage /></AuthGuard>} />
        <Route path="/runtime" element={<AuthGuard><RuntimePage /></AuthGuard>} />
        <Route path="/alarms" element={<AuthGuard><AlarmViewerPage /></AuthGuard>} />
        <Route path="/historian" element={<AuthGuard><HistorianPage /></AuthGuard>} />
        <Route path="/omm" element={<AuthGuard><OmmPage /></AuthGuard>} />
        <Route path="/omm/*" element={<AuthGuard><OmmPage /></AuthGuard>} />
        <Route path="/opc-browser" element={<AuthGuard><OpcBrowserPage /></AuthGuard>} />
        <Route path="/security" element={<AuthGuard><SecurityPage /></AuthGuard>} />
        <Route path="/connectivity" element={<AuthGuard><ConnectivityStudioPage /></AuthGuard>} />
        <Route path="/grid-dashboard" element={<AuthGuard><GridDashboardPage /></AuthGuard>} />
        <Route path="/grid-designer" element={<AuthGuard><GridDashboardPage /></AuthGuard>} />
        <Route path="/logs" element={<AuthGuard><LogsPage /></AuthGuard>} />
        <Route path="/database-analytics" element={<AuthGuard><DatabaseAnalyticsPage /></AuthGuard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <FlowV2EditorModal />
    </>
  );
}

export default App;
