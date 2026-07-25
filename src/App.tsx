import { Routes, Route, Navigate } from 'react-router-dom';
import { OrchestraPage } from './pages/OrchestraPage';
import { WidgetsPage } from './pages/WidgetsPage';
import { SimulatorPage } from './pages/SimulatorPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<OrchestraPage />} />
      <Route path="/orchestra" element={<OrchestraPage />} />
      <Route path="/widgets" element={<WidgetsPage />} />
      <Route path="/simulator" element={<SimulatorPage />} />
      <Route path="/simulador" element={<SimulatorPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
