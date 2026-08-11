import React, { useState, useEffect, useMemo } from 'react';
import { useOmmStore } from '../../store/useOmmStore';
import { SearchableSelect } from '../../../../components/ui/SearchableSelect';
import { TankGeometrySvg } from '../../../../components/TankGeometrySvg';
import { convertLevelToVolume, convertVolumeToLevel, getStrappingConfig } from '../../utils/strappingUtils';
import {
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Settings,
  Gauge,
  Info,
  Scale,
  Activity
} from 'lucide-react';
import { cn } from '../../../../utils/cn';

// ---------------------------------------------------------------------------
// Custom Trend Chart Component
// Renders solid historical trend line + dashed projected future trend line.
// ---------------------------------------------------------------------------
const MultiTrendChart: React.FC<{
  title: string;
  yUnit: string;
  originTag: string;
  destTag: string;
  originVal: number;
  destVal: number;
  originFinal: number;
  destFinal: number;
  maxVal: number;
  isSimulating: boolean;
}> = ({
  title,
  yUnit,
  originTag,
  destTag,
  originVal,
  destVal,
  originFinal,
  destFinal,
  maxVal,
  isSimulating,
}) => {
  const width = 450;
  const height = 110;
  const pad = { top: 12, right: 12, bottom: 20, left: 45 };
  const graphW = width - pad.left - pad.right;
  const graphH = height - pad.top - pad.bottom;

  // Generate 25 historical points (slightly wavy but steady state leading to current value)
  const historyPoints = 25;
  const originHist = useMemo(() => {
    return Array.from({ length: historyPoints }).map((_, idx) => {
      const progress = idx / (historyPoints - 1);
      const wave = Math.sin(progress * 5) * 0.4;
      return originVal + (isSimulating ? (1 - progress) * 2 : 0) + wave;
    });
  }, [originVal, isSimulating]);

  const destHist = useMemo(() => {
    return Array.from({ length: historyPoints }).map((_, idx) => {
      const progress = idx / (historyPoints - 1);
      const wave = Math.cos(progress * 6) * 0.3;
      return destVal - (isSimulating ? (1 - progress) * 2 : 0) + wave;
    });
  }, [destVal, isSimulating]);

  const toX = (index: number, total: number) => {
    return pad.left + (index / (total - 1)) * graphW;
  };

  const toY = (val: number) => {
    const clamped = Math.max(0, Math.min(val, maxVal));
    const pct = clamped / (maxVal || 1);
    return pad.top + graphH - pct * graphH;
  };

  // Build SVG Paths for History (Solid Line)
  const originHistPath = originHist
    .map((val, i) => `${i === 0 ? 'M' : 'L'} ${toX(i, historyPoints + 15).toFixed(1)} ${toY(val).toFixed(1)}`)
    .join(' ');

  const destHistPath = destHist
    .map((val, i) => `${i === 0 ? 'M' : 'L'} ${toX(i, historyPoints + 15).toFixed(1)} ${toY(val).toFixed(1)}`)
    .join(' ');

  // Projected line starting from end of history (index 24) to the future (index 39)
  const projectionPoints = 15;
  const originProjPath = Array.from({ length: projectionPoints })
    .map((_, i) => {
      const t = i / (projectionPoints - 1);
      const val = originVal + t * (originFinal - originVal);
      const idx = historyPoints - 1 + i;
      return `${i === 0 ? 'M' : 'L'} ${toX(idx, historyPoints + projectionPoints).toFixed(1)} ${toY(val).toFixed(1)}`;
    })
    .join(' ');

  const destProjPath = Array.from({ length: projectionPoints })
    .map((_, i) => {
      const t = i / (projectionPoints - 1);
      const val = destVal + t * (destFinal - destVal);
      const idx = historyPoints - 1 + i;
      return `${i === 0 ? 'M' : 'L'} ${toX(idx, historyPoints + projectionPoints).toFixed(1)} ${toY(val).toFixed(1)}`;
    })
    .join(' ');

  // Y Axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map((f) => ({
    label: (maxVal * f).toFixed(0),
    y: toY(maxVal * f),
  }));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{title}</h4>
        <div className="flex items-center gap-2 text-[9px] font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-amber-500 rounded" />
            <span className="text-slate-650 dark:text-slate-300">{originTag}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-sky-500 rounded" />
            <span className="text-slate-650 dark:text-slate-300">{destTag}</span>
          </span>
        </div>
      </div>

      <div className="relative h-[110px] w-full">
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
          {/* Y Axis Grid Lines */}
          {yTicks.map((t, idx) => (
            <g key={idx}>
              <line
                x1={pad.left} y1={t.y}
                x2={width - pad.right} y2={t.y}
                stroke="currentColor"
                className="text-slate-100 dark:text-slate-800/40"
                strokeWidth="0.75"
                strokeDasharray={idx === 0 ? '' : '3 3'}
              />
              <text x={pad.left - 6} y={t.y + 3} fontSize="8" textAnchor="end" className="fill-slate-450 dark:fill-slate-500 font-mono">
                {t.label}{yUnit}
              </text>
            </g>
          ))}

          {/* Separation line for Projection */}
          <line
            x1={toX(historyPoints - 1, historyPoints + projectionPoints)}
            y1={pad.top}
            x2={toX(historyPoints - 1, historyPoints + projectionPoints)}
            y2={height - pad.bottom}
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.6"
          />
          <text
            x={toX(historyPoints - 1, historyPoints + projectionPoints) + 3}
            y={pad.top + 8}
            fontSize="7"
            className="fill-amber-500 font-bold uppercase tracking-wider"
          >
            Projeção
          </text>

          {/* Historical Lines (Solid) */}
          <path d={originHistPath} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
          <path d={destHistPath} fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" />

          {/* Projected Lines (Dashed) */}
          <path d={originProjPath} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" strokeLinecap="round" />
          <path d={destProjPath} fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="3 3" strokeLinecap="round" />

          {/* Dots on Current Values */}
          <circle cx={toX(historyPoints - 1, historyPoints + projectionPoints)} cy={toY(originVal)} r="3" fill="#f59e0b" className="animate-pulse" />
          <circle cx={toX(historyPoints - 1, historyPoints + projectionPoints)} cy={toY(destVal)} r="3" fill="#0ea5e9" className="animate-pulse" />
        </svg>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export const SimulationCalculator: React.FC = () => {
  const equipments = useOmmStore((s) => s.equipments);
  const movements = useOmmStore((s) => s.movements);
  const products = useOmmStore((s) => s.products);

  const [activeSubTab, setActiveSubTab] = useState<'simulacao' | 'conversoes' | 'cenarios'>('simulacao');

  // Filter out only tanks/vessels for dropdowns
  const tanks = useMemo(() => {
    return equipments.filter((e) => e.type === 'Tank' || e.type === 'Vessel' || e.type === 'Sphere');
  }, [equipments]);

  // Dropdown options
  const tankOptions = useMemo(() => {
    return tanks.map((t) => ({
      value: t.id,
      label: t.tag,
      subLabel: t.name,
      color: products.find((p) => p.id === t.productId)?.color || '#64748b'
    }));
  }, [tanks, products]);

  const productOptions = useMemo(() => {
    return products.map((p) => ({
      value: p.id,
      label: p.name,
      subLabel: `${p.density} kg/m³`,
      color: p.color
    }));
  }, [products]);

  // Active Global Movement (if any)
  const activeMovement = useMemo(() => {
    return movements.find((m) => m.status === 'Active');
  }, [movements]);

  // ---------------------------------------------------------------------------
  // TAB 1: Simulação Operacional State
  // ---------------------------------------------------------------------------
  const [simOriginId, setSimOriginId] = useState('');
  const [simDestId, setSimDestId] = useState('');
  const [simFlow, setSimFlow] = useState(100);
  const [simVol, setSimVol] = useState(1000);
  const [simMass, setSimMass] = useState(720);
  const [simDuration, setSimDuration] = useState(10); // in hours
  const [simStart, setSimStart] = useState('');
  const [simProductId, setSimProductId] = useState('');
  const [simDensity, setSimDensity] = useState(720);

  // Toggle checks
  const [useGlobalFlow, setUseGlobalFlow] = useState(false);
  const [useStrapping, setUseStrapping] = useState(true);
  const [autoUpdate, setAutoUpdate] = useState(true);

  // Trigger manual simulation calculations
  const [manualCalcTrigger, setManualCalcTrigger] = useState(0);

  const originTank = useMemo(() => tanks.find((t) => t.id === simOriginId) || null, [tanks, simOriginId]);
  const destTank = useMemo(() => tanks.find((t) => t.id === simDestId) || null, [tanks, simDestId]);
  const selectedProduct = useMemo(() => products.find((p) => p.id === simProductId) || null, [products, simProductId]);

  // Prefill fields when tank changes
  useEffect(() => {
    if (originTank) {
      const pId = originTank.productId || '';
      setSimProductId(pId);
      const prod = products.find((p) => p.id === pId);
      const dens = prod?.density || originTank.density || 720;
      setSimDensity(dens);

      // Recalculate mass based on current volume and density
      const m = simVol * (dens / 1000);
      setSimMass(Number(m.toFixed(1)));
    }
  }, [simOriginId]);

  // Import Active Movement parameters
  const handleImportMovement = () => {
    if (activeMovement) {
      setSimOriginId(activeMovement.originId);
      setSimDestId(activeMovement.destinationId);
      setSimProductId(activeMovement.productId);
      const prod = products.find((p) => p.id === activeMovement.productId);
      const dens = prod?.density || 720;
      setSimDensity(dens);
      setSimFlow(activeMovement.simFlowRate || activeMovement.plannedFlow || 100);
      setSimVol(activeMovement.plannedVolume || 1000);
      setSimStart(activeMovement.plannedStartAt || new Date().toISOString().substring(0, 16));

      // Calculate Mass and Duration
      const m = activeMovement.plannedVolume * (dens / 1000);
      setSimMass(Number(m.toFixed(1)));
      const dur = activeMovement.plannedVolume / (activeMovement.simFlowRate || activeMovement.plannedFlow || 100);
      setSimDuration(Number(dur.toFixed(2)));
    }
  };

  // Smart Sync Inputs (simulated volume, mass, duration, flow)
  const handleInputChange = (field: 'flow' | 'vol' | 'mass' | 'duration' | 'density', value: number) => {
    if (field === 'flow') {
      setSimFlow(value);
      if (value > 0) {
        const dur = simVol / value;
        setSimDuration(Number(dur.toFixed(2)));
      }
    } else if (field === 'vol') {
      setSimVol(value);
      const m = value * (simDensity / 1000);
      setSimMass(Number(m.toFixed(1)));
      if (simFlow > 0) {
        const dur = value / simFlow;
        setSimDuration(Number(dur.toFixed(2)));
      }
    } else if (field === 'mass') {
      setSimMass(value);
      const v = value / (simDensity / 1000);
      setSimVol(Number(v.toFixed(1)));
      if (simFlow > 0) {
        const dur = v / simFlow;
        setSimDuration(Number(dur.toFixed(2)));
      }
    } else if (field === 'duration') {
      setSimDuration(value);
      if (simFlow > 0) {
        const v = simFlow * value;
        setSimVol(Number(v.toFixed(1)));
        const m = v * (simDensity / 1000);
        setSimMass(Number(m.toFixed(1)));
      }
    } else if (field === 'density') {
      setSimDensity(value);
      const m = simVol * (value / 1000);
      setSimMass(Number(m.toFixed(1)));
    }
  };

  // Global Flow Override
  useEffect(() => {
    if (useGlobalFlow && activeMovement) {
      const activeFlow = activeMovement.currentFlow || activeMovement.simFlowRate || activeMovement.plannedFlow || 100;
      setSimFlow(activeFlow);
      if (activeFlow > 0) {
        const dur = simVol / activeFlow;
        setSimDuration(Number(dur.toFixed(2)));
      }
    }
  }, [useGlobalFlow, activeMovement, simVol]);

  // Compute Results (either live or static)
  const calculations = useMemo(() => {
    // If not autoUpdating, we only recalculate on manualCalcTrigger
    void manualCalcTrigger;

    if (!originTank || !destTank) return null;

    const flowRate = simFlow || 100;
    const dens = simDensity || 720;
    const strappingOrigin = useStrapping ? getStrappingConfig(originTank.id) : null;
    const strappingDest = useStrapping ? getStrappingConfig(destTank.id) : null;

    // Check if there is an active movement between these specific tanks
    const isLiveActive = activeMovement &&
      (activeMovement.originId === originTank.id) &&
      (activeMovement.destinationId === destTank.id);

    // Initial volumes
    const origStartVol = originTank.currentVolume;
    const destStartVol = destTank.currentVolume;

    let volMoved = simVol;
    let pctComplete = 0;
    let volRemainingTransfer = simVol;

    if (isLiveActive && activeMovement) {
      volMoved = activeMovement.currentVolume || 0;
      pctComplete = activeMovement.percentComplete || 0;
      volRemainingTransfer = Math.max(0, activeMovement.plannedVolume - volMoved);
    }

    // Final volumes
    const origFinalVol = Math.max(0, origStartVol - volRemainingTransfer);
    const destFinalVol = Math.min(destTank.capacity, destStartVol + volRemainingTransfer);

    // Convert final volumes to levels
    const origFinalLvl = convertVolumeToLevel(origFinalVol, strappingOrigin, originTank.capacity);
    const destFinalLvl = convertVolumeToLevel(destFinalVol, strappingDest, destTank.capacity);

    // Times to conclusion
    const ettcHours = flowRate > 0 ? volRemainingTransfer / flowRate : 0;
    const ettcMins = Math.round(ettcHours * 60);
    const ettcString = flowRate > 0 ? `${Math.floor(ettcHours)}h ${ettcMins % 60}m` : '—';

    let etocString = '—';
    const startBase = simStart ? new Date(simStart) : new Date();
    if (flowRate > 0) {
      const etocDate = new Date(startBase.getTime() + ettcHours * 60 * 60 * 1000);
      etocString = etocDate.toLocaleString('pt-BR', { hour12: false });
    }

    // Limits Calculations
    // High level volume limits
    const destHighVol = convertLevelToVolume(80, strappingDest, destTank.capacity);
    const destMaxVol = convertLevelToVolume(100, strappingDest, destTank.capacity);
    const origLowVol = convertLevelToVolume(15, strappingOrigin, originTank.capacity);
    const origMinVol = convertLevelToVolume(5, strappingOrigin, originTank.capacity);

    // Time to reach limits
    let timeToDestHigh = -1; // -1 means N/A
    if (destStartVol < destHighVol && flowRate > 0) {
      timeToDestHigh = (destHighVol - destStartVol) / flowRate;
    }
    let timeToDestMax = -1;
    if (destStartVol < destMaxVol && flowRate > 0) {
      timeToDestMax = (destMaxVol - destStartVol) / flowRate;
    }
    let timeToOrigLow = -1;
    if (origStartVol > origLowVol && flowRate > 0) {
      timeToOrigLow = (origStartVol - origLowVol) / flowRate;
    }
    let timeToOrigMin = -1;
    if (origStartVol > origMinVol && flowRate > 0) {
      timeToOrigMin = (origStartVol - origMinVol) / flowRate;
    }

    // Alarm logic
    const willOverflow = destFinalVol >= destMaxVol;
    const willEmpty = origFinalVol <= origMinVol;
    const willHigh = destFinalVol >= destHighVol && !willOverflow;
    const willLow = origFinalVol <= origLowVol && !willEmpty;

    return {
      ettcString,
      etocString,
      volMoved,
      massMoved: volMoved * (dens / 1000),
      volRemainingTransfer,
      pctComplete,
      origFinalVol,
      origFinalLvl,
      destFinalVol,
      destFinalLvl,
      timeToDestHigh,
      timeToDestMax,
      timeToOrigLow,
      timeToOrigMin,
      willOverflow,
      willEmpty,
      willHigh,
      willLow,
      isLiveActive
    };
  }, [
    simOriginId,
    simDestId,
    simFlow,
    simVol,
    simDensity,
    useStrapping,
    simStart,
    activeMovement,
    originTank,
    destTank,
    manualCalcTrigger
  ]);

  // ---------------------------------------------------------------------------
  // TAB 2: Conversões (Calculadora F38) State
  // ---------------------------------------------------------------------------
  const [convTankId, setConvTankId] = useState('');
  const [convInputType, setConvInputType] = useState<'level' | 'volume' | 'mass'>('level');
  const [convLevel, setConvLevel] = useState('50');
  const [convVolume, setConvVolume] = useState('500');
  const [convMass, setConvMass] = useState('360');
  const [convDensity, setConvDensity] = useState('720');

  const convTank = useMemo(() => tanks.find((t) => t.id === convTankId) || null, [tanks, convTankId]);

  // Prefill F38 fields when selected tank changes
  useEffect(() => {
    if (convTank) {
      const prod = products.find((p) => p.id === convTank.productId);
      const dens = prod?.density || convTank.density || 720;
      setConvDensity(String(dens));

      // Calculate initial starting from the tank's actual level
      const strapping = getStrappingConfig(convTank.id);
      const initialVol = convertLevelToVolume(convTank.currentLevel, strapping, convTank.capacity);
      const initialMass = initialVol * (dens / 1000);

      setConvLevel(convTank.currentLevel.toFixed(1));
      setConvVolume(initialVol.toFixed(1));
      setConvMass(initialMass.toFixed(1));
    }
  }, [convTankId]);

  // Perform Conversions
  const handleConversionChange = (type: 'level' | 'volume' | 'mass' | 'density', valStr: string) => {
    if (type === 'level') {
      setConvLevel(valStr);
      const lvl = parseFloat(valStr);
      if (!isNaN(lvl) && convTank) {
        const strapping = getStrappingConfig(convTank.id);
        const v = convertLevelToVolume(lvl, strapping, convTank.capacity);
        const d = parseFloat(convDensity) || 720;
        const m = v * (d / 1000);
        setConvVolume(v.toFixed(1));
        setConvMass(m.toFixed(1));
      }
    } else if (type === 'volume') {
      setConvVolume(valStr);
      const vol = parseFloat(valStr);
      if (!isNaN(vol) && convTank) {
        const strapping = getStrappingConfig(convTank.id);
        const l = convertVolumeToLevel(vol, strapping, convTank.capacity);
        const d = parseFloat(convDensity) || 720;
        const m = vol * (d / 1000);
        setConvLevel(l.toFixed(1));
        setConvMass(m.toFixed(1));
      }
    } else if (type === 'mass') {
      setConvMass(valStr);
      const mass = parseFloat(valStr);
      if (!isNaN(mass) && convTank) {
        const d = parseFloat(convDensity) || 720;
        const vol = mass / (d / 1000);
        const strapping = getStrappingConfig(convTank.id);
        const l = convertVolumeToLevel(vol, strapping, convTank.capacity);
        setConvVolume(vol.toFixed(1));
        setConvLevel(l.toFixed(1));
      }
    } else if (type === 'density') {
      setConvDensity(valStr);
      const d = parseFloat(valStr);
      const vol = parseFloat(convVolume);
      if (!isNaN(d) && !isNaN(vol)) {
        const m = vol * (d / 1000);
        setConvMass(m.toFixed(1));
      }
    }
  };

  // ---------------------------------------------------------------------------
  // TAB 3: Cenários Playground State
  // ---------------------------------------------------------------------------
  const [sceneOriginId, setSceneOriginId] = useState('');
  const [sceneDestId, setSceneDestId] = useState('');
  const [sceneFlow, setSceneFlow] = useState(150);
  const [sceneVol, setSceneVol] = useState(2000);
  const [sceneDensity, setSceneDensity] = useState(800);
  const [sceneStart, setSceneStart] = useState('');

  // Simulation Running State for Scenario
  const [isScenePlaying, setIsScenePlaying] = useState(false);
  const [sceneProgressVol, setSceneProgressVol] = useState(0);

  const sceneOriginTank = useMemo(() => tanks.find((t) => t.id === sceneOriginId) || null, [tanks, sceneOriginId]);
  const sceneDestTank = useMemo(() => tanks.find((t) => t.id === sceneDestId) || null, [tanks, sceneDestId]);

  // Local Scenario Loop
  useEffect(() => {
    let interval: number | undefined;
    if (isScenePlaying) {
      interval = window.setInterval(() => {
        setSceneProgressVol((prev) => {
          // Simulate a transferring speed: 50 m³ per tick
          const step = (sceneFlow / 120); // 1 tick represents flow / 120 volume
          const next = prev + step;
          if (next >= sceneVol) {
            setIsScenePlaying(false);
            return sceneVol;
          }
          return next;
        });
      }, 500);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isScenePlaying, sceneVol, sceneFlow]);

  // Reset progress when play toggles on
  const handlePlayToggle = () => {
    if (!isScenePlaying) {
      setSceneProgressVol(0);
    }
    setIsScenePlaying(!isScenePlaying);
  };

  // Prefill Scenario fields
  useEffect(() => {
    if (sceneOriginTank) {
      const pId = sceneOriginTank.productId || '';
      const prod = products.find((p) => p.id === pId);
      setSceneDensity(prod?.density || sceneOriginTank.density || 720);
    }
  }, [sceneOriginId]);

  // Compute Scenario outputs
  const scenarioResults = useMemo(() => {
    if (!sceneOriginTank || !sceneDestTank) return null;

    const strappingOrigin = getStrappingConfig(sceneOriginTank.id);
    const strappingDest = getStrappingConfig(sceneDestTank.id);

    // Initial volumes
    const origStartVol = sceneOriginTank.currentVolume;
    const destStartVol = sceneDestTank.currentVolume;

    // Remaining transfer based on playing progress
    const simulatedTransferred = isScenePlaying ? sceneProgressVol : sceneVol;
    const finalOrigVol = Math.max(0, origStartVol - simulatedTransferred);
    const finalDestVol = Math.min(sceneDestTank.capacity, destStartVol + simulatedTransferred);

    const finalOrigLvl = convertVolumeToLevel(finalOrigVol, strappingOrigin, sceneOriginTank.capacity);
    const finalDestLvl = convertVolumeToLevel(finalDestVol, strappingDest, sceneDestTank.capacity);

    const ettcHours = sceneFlow > 0 ? (sceneVol - sceneProgressVol) / sceneFlow : 0;
    const ettcMins = Math.round(ettcHours * 60);
    const ettcString = sceneFlow > 0 ? `${Math.floor(ettcHours)}h ${ettcMins % 60}m` : '—';

    let etocString = '—';
    const startBase = sceneStart ? new Date(sceneStart) : new Date();
    if (sceneFlow > 0) {
      const etocDate = new Date(startBase.getTime() + ettcHours * 60 * 60 * 1000);
      etocString = etocDate.toLocaleString('pt-BR', { hour12: false });
    }

    // Limits
    const destHighVol = convertLevelToVolume(80, strappingDest, sceneDestTank.capacity);
    const destMaxVol = convertLevelToVolume(100, strappingDest, sceneDestTank.capacity);
    const origLowVol = convertLevelToVolume(15, strappingOrigin, sceneOriginTank.capacity);
    const origMinVol = convertLevelToVolume(5, strappingOrigin, sceneOriginTank.capacity);

    const willOverflow = finalDestVol >= destMaxVol;
    const willEmpty = finalOrigVol <= origMinVol;
    const willHigh = finalDestVol >= destHighVol && !willOverflow;
    const willLow = finalOrigVol <= origLowVol && !willEmpty;

    let timeToDestHigh = -1;
    if (destStartVol < destHighVol && sceneFlow > 0) {
      timeToDestHigh = (destHighVol - destStartVol) / sceneFlow;
    }
    let timeToOrigLow = -1;
    if (origStartVol > origLowVol && sceneFlow > 0) {
      timeToOrigLow = (origStartVol - origLowVol) / sceneFlow;
    }

    return {
      ettcString,
      etocString,
      finalOrigVol,
      finalOrigLvl,
      finalDestVol,
      finalDestLvl,
      willOverflow,
      willEmpty,
      willHigh,
      willLow,
      timeToDestHigh,
      timeToOrigLow,
      percentComplete: (simulatedTransferred / sceneVol) * 100
    };
  }, [
    sceneOriginId,
    sceneDestId,
    sceneFlow,
    sceneVol,
    sceneProgressVol,
    isScenePlaying,
    sceneOriginTank,
    sceneDestTank,
    sceneStart
  ]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      {/* Secondary Sub-Tabs Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
          {[
            { id: 'simulacao', label: 'Simulação Operacional', icon: <Gauge className="w-3.5 h-3.5" /> },
            { id: 'conversoes', label: 'Conversões (F38)', icon: <Scale className="w-3.5 h-3.5" /> },
            { id: 'cenarios', label: 'Playground de Cenários', icon: <Settings className="w-3.5 h-3.5" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all",
                activeSubTab === tab.id
                  ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-250"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeSubTab === 'simulacao' && activeMovement && (
          <button
            onClick={handleImportMovement}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-200 dark:border-sky-800/80 bg-sky-50 dark:bg-sky-950/20 hover:bg-sky-100 dark:hover:bg-sky-950/40 text-sky-700 dark:text-sky-400 text-xs font-semibold cursor-pointer transition-all shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
            Importar Movimento Ativo ({activeMovement.number})
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">

        {/* -------------------------------------------------------------------
            SUB-TAB 1: SIMULAÇÃO OPERACIONAL
            ------------------------------------------------------------------- */}
        {activeSubTab === 'simulacao' && (
          <div className="p-4 space-y-4 max-w-7xl mx-auto">
            {/* Grid for Inputs: Areas 1 & 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Area 1: Origem e Destino (lg:col-span-5) */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                  Origem e Destino
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tanque de Origem</label>
                    <SearchableSelect
                      value={simOriginId}
                      onChange={setSimOriginId}
                      options={tankOptions.filter((opt) => opt.value !== simDestId)}
                      placeholder="Origem..."
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tanque de Destino</label>
                    <SearchableSelect
                      value={simDestId}
                      onChange={setSimDestId}
                      options={tankOptions.filter((opt) => opt.value !== simOriginId)}
                      placeholder="Destino..."
                    />
                  </div>
                </div>

                {/* Summary Row */}
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {/* Origin summary */}
                  <div className="bg-slate-50/50 dark:bg-slate-950/40 rounded-xl p-3 border border-slate-100 dark:border-slate-850/80">
                    <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1.5">Resumo Origem</span>
                    {originTank ? (
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between"><span className="text-slate-400">Produto:</span> <span className="font-semibold">{products.find((p) => p.id === originTank.productId)?.name || '—'}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Nível:</span> <span className="font-mono font-semibold">{originTank.currentLevel.toFixed(1)}%</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Volume:</span> <span className="font-mono font-semibold">{originTank.currentVolume.toFixed(0)} m³</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Massa:</span> <span className="font-mono font-semibold">{originTank.currentMass.toFixed(1)} t</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Temp.:</span> <span className="font-mono font-semibold">{originTank.temperature.toFixed(1)} °C</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Densidade:</span> <span className="font-mono font-semibold">{originTank.density.toFixed(0)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Status:</span> <span className="font-semibold text-emerald-600 dark:text-emerald-400">{originTank.isSending ? 'Enviando' : 'Normal'}</span></div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 italic text-center py-4">Selecione a origem</div>
                    )}
                  </div>

                  {/* Destination summary */}
                  <div className="bg-slate-50/50 dark:bg-slate-950/40 rounded-xl p-3 border border-slate-100 dark:border-slate-850/80">
                    <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1.5">Resumo Destino</span>
                    {destTank ? (
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between"><span className="text-slate-400">Produto:</span> <span className="font-semibold">{products.find((p) => p.id === destTank.productId)?.name || '—'}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Nível:</span> <span className="font-mono font-semibold">{destTank.currentLevel.toFixed(1)}%</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Volume:</span> <span className="font-mono font-semibold">{destTank.currentVolume.toFixed(0)} m³</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Massa:</span> <span className="font-mono font-semibold">{destTank.currentMass.toFixed(1)} t</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Temp.:</span> <span className="font-mono font-semibold">{destTank.temperature.toFixed(1)} °C</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Densidade:</span> <span className="font-mono font-semibold">{destTank.density.toFixed(0)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Status:</span> <span className="font-semibold text-sky-600 dark:text-sky-400">{destTank.isReceiving ? 'Recebendo' : 'Normal'}</span></div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 italic text-center py-4">Selecione o destino</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Area 2: Parâmetros da Simulação (lg:col-span-7) */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                  Parâmetros de Simulação
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Vazão (m³/h)</label>
                    <input
                      type="number"
                      value={simFlow}
                      disabled={useGlobalFlow}
                      onChange={(e) => handleInputChange('flow', parseFloat(e.target.value) || 0)}
                      className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Volume (m³)</label>
                    <input
                      type="number"
                      value={simVol}
                      onChange={(e) => handleInputChange('vol', parseFloat(e.target.value) || 0)}
                      className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Massa (t)</label>
                    <input
                      type="number"
                      value={simMass}
                      onChange={(e) => handleInputChange('mass', parseFloat(e.target.value) || 0)}
                      className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Duração (h)</label>
                    <input
                      type="number"
                      value={simDuration}
                      onChange={(e) => handleInputChange('duration', parseFloat(e.target.value) || 0)}
                      className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Produto</label>
                    <SearchableSelect
                      value={simProductId}
                      onChange={setSimProductId}
                      options={productOptions}
                      placeholder="Produto..."
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Densidade (kg/m³)</label>
                    <input
                      type="number"
                      value={simDensity}
                      onChange={(e) => handleInputChange('density', parseFloat(e.target.value) || 0)}
                      className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Data/Hora Início (Opc.)</label>
                    <input
                      type="datetime-local"
                      value={simStart}
                      onChange={(e) => setSimStart(e.target.value)}
                      className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                {/* Swtiches Row */}
                <div className="flex flex-wrap items-center justify-between gap-4 mt-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useGlobalFlow}
                        onChange={(e) => setUseGlobalFlow(e.target.checked)}
                        className="rounded text-sky-500 focus:ring-sky-500"
                      />
                      Vazão global
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useStrapping}
                        onChange={(e) => setUseStrapping(e.target.checked)}
                        className="rounded text-sky-500 focus:ring-sky-500"
                      />
                      Utilizar Arqueação (Strapping)
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoUpdate}
                        onChange={(e) => setAutoUpdate(e.target.checked)}
                        className="rounded text-sky-500 focus:ring-sky-500"
                      />
                      Autocalcular
                    </label>
                  </div>

                  {!autoUpdate && (
                    <button
                      onClick={() => setManualCalcTrigger((t) => t + 1)}
                      className="px-4 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold cursor-pointer transition-all"
                    >
                      Calcular Simulação
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Error or waiting selection message */}
            {!calculations ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                <Activity className="w-12 h-12 text-slate-350 dark:text-slate-650 mb-3 animate-pulse" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Aguardando Seleção de Rota</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1">Selecione o tanque de origem e o tanque de destino acima para habilitar o painel de previsões e simulação visual.</p>
              </div>
            ) : (
              <>
                {/* Area 3: Resultados da Simulação */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
                  <h3 className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
                    Resultados e Análise de Simulação
                  </h3>

                  {calculations.isLiveActive && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400 p-2.5 rounded-lg text-xs font-semibold mb-4 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                        Exibindo dados reais do movimento ativo em execução no simulador global.
                      </span>
                      <span>Progresso: {calculations.pctComplete.toFixed(1)}%</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    {[
                      { label: 'Tempo Est. Conclusão (ETTC)', value: calculations.ettcString, desc: 'Tempo restante previsto', color: 'text-slate-800 dark:text-slate-100' },
                      { label: 'Previsão Conclusão (ETOC)', value: calculations.etocString, desc: 'Horário final estimado', color: 'text-sky-650 dark:text-sky-400' },
                      { label: 'Volume Movimentado', value: `${calculations.volMoved.toFixed(0)} m³`, desc: 'Volume transferido', color: 'text-slate-800 dark:text-slate-100 font-mono' },
                      { label: 'Massa Movimentada', value: `${calculations.massMoved.toFixed(1)} t`, desc: 'Massa transferida', color: 'text-slate-800 dark:text-slate-100 font-mono' },
                      { label: 'Volume Restante', value: `${calculations.volRemainingTransfer.toFixed(0)} m³`, desc: 'Volume a transferir', color: 'text-slate-800 dark:text-slate-100 font-mono' },
                      { label: 'Percentual Concluído', value: `${calculations.pctComplete.toFixed(1)}%`, desc: 'Fração concluída', color: 'text-emerald-650 dark:text-emerald-400 font-mono' },
                      { label: 'Vazão Utilizada', value: `${simFlow} m³/h`, desc: 'Taxa de bombeamento', color: 'text-slate-800 dark:text-slate-100 font-mono' },
                      { label: 'Produto Planejado', value: selectedProduct?.name || '—', desc: 'Líquido simulado', color: 'text-slate-800 dark:text-slate-100' },
                      { label: 'Densidade Relativa', value: `${simDensity} kg/m³`, desc: 'Densidade do fluxo', color: 'text-slate-800 dark:text-slate-100 font-mono' },
                      { label: 'Capacidade em Uso', value: `${(simVol / (destTank?.capacity || 1) * 100).toFixed(1)}%`, desc: 'Do tanque destino', color: 'text-slate-850 dark:text-slate-200 font-mono' },
                      { label: 'Ocupação Final Destino', value: `${calculations.destFinalLvl.toFixed(1)}%`, desc: `${calculations.destFinalVol.toFixed(0)} m³ estimados`, color: 'text-slate-800 dark:text-slate-100 font-mono' },
                      { label: 'Ocupação Final Origem', value: `${calculations.origFinalLvl.toFixed(1)}%`, desc: `${calculations.origFinalVol.toFixed(0)} m³ estimados`, color: 'text-slate-800 dark:text-slate-100 font-mono' }
                    ].map((card, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-205 dark:border-slate-900 flex flex-col justify-between">
                        <div>
                          <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{card.label}</div>
                          <div className={cn("text-sm font-black mt-1 tracking-tight truncate", card.color)}>{card.value}</div>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-1">{card.desc}</div>
                      </div>
                    ))}
                  </div>

                  {/* Limits and Alarm Badges */}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest mb-2.5">
                        Previsão de Limites Operacionais
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-900">
                          <span className="text-slate-450">Tempo até High Level (80% Destino):</span>
                          <span className="font-mono font-semibold">{calculations.timeToDestHigh >= 0 ? `${calculations.timeToDestHigh.toFixed(1)}h` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-900">
                          <span className="text-slate-450">Tempo até Low Level (15% Origem):</span>
                          <span className="font-mono font-semibold">{calculations.timeToOrigLow >= 0 ? `${calculations.timeToOrigLow.toFixed(1)}h` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-900">
                          <span className="text-slate-450">Tempo até Máx (100% Destino):</span>
                          <span className="font-mono font-semibold">{calculations.timeToDestMax >= 0 ? `${calculations.timeToDestMax.toFixed(1)}h` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-900">
                          <span className="text-slate-450">Tempo até Mín Op (5% Origem):</span>
                          <span className="font-mono font-semibold">{calculations.timeToOrigMin >= 0 ? `${calculations.timeToOrigMin.toFixed(1)}h` : 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest mb-1.5 block">
                        Status de Risco de Segurança
                      </span>

                      {/* Alarms Badges */}
                      <div className="flex flex-wrap gap-2">
                        {calculations.willOverflow && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 rounded-lg text-xs font-bold animate-pulse">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            CRÍTICO: Risco de Transbordo no Tanque de Destino ({destTank?.tag})
                          </div>
                        )}
                        {calculations.willEmpty && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 rounded-lg text-xs font-bold animate-pulse">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            CRÍTICO: Risco de Esgotamento/Cavitação no Tanque de Origem ({originTank?.tag})
                          </div>
                        )}
                        {calculations.willHigh && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-bold">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            AVISO: Tanque de Destino ultrapassará Nível Alto (80%)
                          </div>
                        )}
                        {calculations.willLow && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-bold">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            AVISO: Tanque de Origem cairá abaixo de Nível Baixo (15%)
                          </div>
                        )}
                        {!calculations.willOverflow && !calculations.willEmpty && !calculations.willHigh && !calculations.willLow && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            SEGURO: Transferência dentro dos limites operacionais tolerados
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Area 4: Visualização Gráfica */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Side by side Tank visualization with animation (lg:col-span-6) */}
                  <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center shadow-2xs min-h-[300px]">
                    <h3 className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 mb-4 w-full text-left">
                      Diagrama de Fluxo Físico
                    </h3>

                    {/* Pipe Flow Keyframes */}
                    <style dangerouslySetInnerHTML={{__html: `
                      @keyframes pipe-dash-calc {
                        to { stroke-dashoffset: -20; }
                      }
                      .animate-pipe-calc {
                        stroke-dasharray: 6, 6;
                        animation: pipe-dash-calc 1s linear infinite;
                      }
                      @keyframes spinner-calc {
                        to { transform: rotate(360deg); }
                      }
                      .animate-spinner-calc {
                        animation: spinner-calc 3s linear infinite;
                      }
                    `}} />

                    <div className="w-full flex items-center justify-between gap-2 max-w-md my-4">
                      {/* Origin Tank SVG */}
                      <div className="flex flex-col items-center">
                        <span className="font-mono text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded mb-1">
                          {originTank?.tag}
                        </span>
                        <TankGeometrySvg
                          geometry={originTank?.name.startsWith('V-3') ? 'spherical' : originTank?.name.startsWith('V-4') ? 'pressurized' : 'vertical_cylindrical'}
                          levelPercent={originTank?.currentLevel || 0}
                          fillColor={selectedProduct?.color || '#3b82f6'}
                          width={70}
                          height={90}
                        />
                        <span className="text-[10px] font-bold mt-1 text-slate-700 dark:text-slate-350">{originTank?.currentLevel.toFixed(1)}%</span>
                      </div>

                      {/* Animated Pipe */}
                      <div className="flex-1 relative h-16 flex items-center justify-center">
                        <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none" className="overflow-visible">
                          <path d="M 0,20 L 100,20" fill="none" stroke="#e2e8f0" strokeWidth="6" className="dark:stroke-slate-800" />
                          {(simFlow > 0 || calculations.isLiveActive) && (
                            <path d="M 0,20 L 100,20" fill="none" stroke={selectedProduct?.color || '#3b82f6'} strokeWidth="3" className="animate-pipe-calc" />
                          )}
                        </svg>

                        {/* Pump Icon */}
                        <div className="absolute bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-1.5 rounded-full shadow-md">
                          <Activity className={cn("w-3.5 h-3.5 text-slate-400", (simFlow > 0 || calculations.isLiveActive) && "animate-spinner-calc text-emerald-500")} />
                        </div>
                      </div>

                      {/* Destination Tank SVG */}
                      <div className="flex flex-col items-center">
                        <span className="font-mono text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded mb-1">
                          {destTank?.tag}
                        </span>
                        <TankGeometrySvg
                          geometry={destTank?.name.startsWith('V-3') ? 'spherical' : destTank?.name.startsWith('V-4') ? 'pressurized' : 'vertical_cylindrical'}
                          levelPercent={destTank?.currentLevel || 0}
                          fillColor={selectedProduct?.color || '#0ea5e9'}
                          width={70}
                          height={90}
                        />
                        <span className="text-[10px] font-bold mt-1 text-slate-700 dark:text-slate-350">{destTank?.currentLevel.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Trend chart projections (lg:col-span-6) */}
                  <div className="lg:col-span-6 flex flex-col gap-4">
                    <MultiTrendChart
                      title="Projeção de Tendência de Nível (%)"
                      yUnit="%"
                      originTag={originTank?.tag || 'Origem'}
                      destTag={destTank?.tag || 'Destino'}
                      originVal={originTank?.currentLevel || 0}
                      destVal={destTank?.currentLevel || 0}
                      originFinal={calculations.origFinalLvl}
                      destFinal={calculations.destFinalLvl}
                      maxVal={100}
                      isSimulating={simFlow > 0}
                    />

                    <MultiTrendChart
                      title="Projeção de Tendência de Volume (m³)"
                      yUnit=""
                      originTag={originTank?.tag || 'Origem'}
                      destTag={destTank?.tag || 'Destino'}
                      originVal={originTank?.currentVolume || 0}
                      destVal={destTank?.currentVolume || 0}
                      originFinal={calculations.origFinalVol}
                      destFinal={calculations.destFinalVol}
                      maxVal={Math.max(originTank?.capacity || 15000, destTank?.capacity || 15000)}
                      isSimulating={simFlow > 0}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------
            SUB-TAB 2: CONVERSÕES (Calculadora F38)
            ------------------------------------------------------------------- */}
        {activeSubTab === 'conversoes' && (
          <div className="p-4 max-w-5xl mx-auto space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Scale className="w-5 h-5 text-sky-500" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Calculadora de Conversões F38</h3>
                  <p className="text-[10px] text-slate-400">Conversão de unidades volumétricas e mássicas baseada em arqueação e densidade.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Selection panel */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Equipamento / Tanque</label>
                    <SearchableSelect
                      value={convTankId}
                      onChange={setConvTankId}
                      options={tankOptions}
                      placeholder="Selecione o equipamento..."
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Unidade de Entrada Principal</label>
                    <div className="flex bg-slate-100 dark:bg-slate-950 border border-slate-250 dark:border-slate-900 rounded-lg p-0.5 text-xs font-semibold">
                      {[
                        { id: 'level', label: 'Nível (%)' },
                        { id: 'volume', label: 'Volume (m³)' },
                        { id: 'mass', label: 'Massa (t)' }
                      ].map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setConvInputType(type.id as any)}
                          className={cn(
                            "flex-1 py-1 rounded-md text-center transition-all cursor-pointer",
                            convInputType === type.id
                              ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-2xs"
                              : "text-slate-500 dark:text-slate-450 hover:text-slate-700"
                          )}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Densidade do Produto (kg/m³)</label>
                    <input
                      type="number"
                      value={convDensity}
                      onChange={(e) => handleConversionChange('density', e.target.value)}
                      className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* Conversion results panel */}
                <div className="md:col-span-2 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-205 dark:border-slate-900 flex flex-col justify-between">
                  {convTank ? (
                    <div className="space-y-4">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Resultados da Conversão F38 para {convTank.tag}</span>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Level Input/Output */}
                        <div className={cn(
                          "p-3 rounded-xl border flex flex-col justify-between",
                          convInputType === 'level'
                            ? "bg-sky-50/30 dark:bg-sky-950/10 border-sky-300 dark:border-sky-850"
                            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                        )}>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nível</span>
                            {convInputType === 'level' ? (
                              <div className="flex items-center gap-1 mt-1.5">
                                <input
                                  type="number"
                                  value={convLevel}
                                  onChange={(e) => handleConversionChange('level', e.target.value)}
                                  className="w-full bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded px-2 py-1 text-base font-bold font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
                                />
                                <span className="text-xs font-bold">%</span>
                              </div>
                            ) : (
                              <div className="text-xl font-black font-mono mt-1 text-slate-800 dark:text-slate-100">
                                {parseFloat(convLevel).toFixed(1)} <span className="text-sm font-semibold">%</span>
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-400 mt-2">Altura linear do tanque</span>
                        </div>

                        {/* Volume Input/Output */}
                        <div className={cn(
                          "p-3 rounded-xl border flex flex-col justify-between",
                          convInputType === 'volume'
                            ? "bg-sky-50/30 dark:bg-sky-950/10 border-sky-300 dark:border-sky-850"
                            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                        )}>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Volume</span>
                            {convInputType === 'volume' ? (
                              <div className="flex items-center gap-1 mt-1.5">
                                <input
                                  type="number"
                                  value={convVolume}
                                  onChange={(e) => handleConversionChange('volume', e.target.value)}
                                  className="w-full bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded px-2 py-1 text-base font-bold font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
                                />
                                <span className="text-xs font-bold">m³</span>
                              </div>
                            ) : (
                              <div className="text-xl font-black font-mono mt-1 text-slate-800 dark:text-slate-100">
                                {parseFloat(convVolume).toFixed(1)} <span className="text-sm font-semibold">m³</span>
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-400 mt-2">Volume arqueado estimado</span>
                        </div>

                        {/* Mass Input/Output */}
                        <div className={cn(
                          "p-3 rounded-xl border flex flex-col justify-between",
                          convInputType === 'mass'
                            ? "bg-sky-50/30 dark:bg-sky-950/10 border-sky-300 dark:border-sky-850"
                            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                        )}>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Massa</span>
                            {convInputType === 'mass' ? (
                              <div className="flex items-center gap-1 mt-1.5">
                                <input
                                  type="number"
                                  value={convMass}
                                  onChange={(e) => handleConversionChange('mass', e.target.value)}
                                  className="w-full bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded px-2 py-1 text-base font-bold font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
                                />
                                <span className="text-xs font-bold">t</span>
                              </div>
                            ) : (
                              <div className="text-xl font-black font-mono mt-1 text-slate-800 dark:text-slate-100">
                                {parseFloat(convMass).toFixed(1)} <span className="text-sm font-semibold">t</span>
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-400 mt-2">Massa com base na densidade</span>
                        </div>
                      </div>

                      {/* Interpolation Detail Info */}
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850 flex items-start gap-2 text-xs">
                        <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-700 dark:text-slate-300">Resolução de Arqueação (Calibration Table)</div>
                          <div className="text-slate-400 leading-relaxed text-[11px]">
                            Este tanque possui arqueação configurada no Orquestra IDE. As conversões bidirecionais entre Nível (%) e Volume (m³) são calculadas em tempo real utilizando interpolação linear contínua entre os pontos de calibração calibrados fisicamente.
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs italic">
                      <Scale className="w-8 h-8 text-slate-350 dark:text-slate-650 mb-2 animate-bounce" />
                      Selecione um tanque para iniciar as conversões de volume e massa.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
            SUB-TAB 3: CENÁRIOS (Playground)
            ------------------------------------------------------------------- */}
        {activeSubTab === 'cenarios' && (
          <div className="p-4 max-w-7xl mx-auto space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Inputs Panel (lg:col-span-5) */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest">
                    Cenário Playground
                  </h3>
                  <button
                    onClick={handlePlayToggle}
                    disabled={!sceneOriginId || !sceneDestId}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all shadow-2xs",
                      isScenePlaying
                        ? "bg-amber-500 hover:bg-amber-600 text-white"
                        : "bg-emerald-500 hover:bg-emerald-600 text-white",
                      (!sceneOriginId || !sceneDestId) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isScenePlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {isScenePlaying ? 'Pausar Simulação' : 'Rodar Simulação'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tanque de Origem</label>
                    <SearchableSelect
                      value={sceneOriginId}
                      onChange={setSceneOriginId}
                      options={tankOptions.filter((opt) => opt.value !== sceneDestId)}
                      placeholder="Origem..."
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tanque de Destino</label>
                    <SearchableSelect
                      value={sceneDestId}
                      onChange={setSceneDestId}
                      options={tankOptions.filter((opt) => opt.value !== sceneOriginId)}
                      placeholder="Destino..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Vazão Simulada (m³/h)</label>
                    <input
                      type="number"
                      value={sceneFlow}
                      onChange={(e) => setSceneFlow(parseFloat(e.target.value) || 0)}
                      className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-205 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 dark:text-slate-100 font-mono focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Quantidade (m³)</label>
                    <input
                      type="number"
                      value={sceneVol}
                      onChange={(e) => setSceneVol(parseFloat(e.target.value) || 0)}
                      className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-205 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 dark:text-slate-100 font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Densidade (kg/m³)</label>
                    <input
                      type="number"
                      value={sceneDensity}
                      onChange={(e) => setSceneDensity(parseFloat(e.target.value) || 0)}
                      className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-205 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 dark:text-slate-100 font-mono focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Data/Hora Início</label>
                    <input
                      type="datetime-local"
                      value={sceneStart}
                      onChange={(e) => setSceneStart(e.target.value)}
                      className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-205 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Simulation Output and Visual Graphs (lg:col-span-7) */}
              <div className="lg:col-span-7 space-y-4">
                {!scenarioResults ? (
                  <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[250px]">
                    <Settings className="w-10 h-10 text-slate-350 dark:text-slate-650 mb-2 animate-spin" style={{ animationDuration: '6s' }} />
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Configurando Playground</h4>
                    <p className="text-xs text-slate-400 mt-1">Configure o tanque de origem e de destino para rodar um teste de impacto operacional temporário.</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450 block">Previsão e Simulação de Cenário</span>

                      {isScenePlaying && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono text-slate-400">
                            <span>Simulação local em andamento:</span>
                            <span>{scenarioResults.percentComplete.toFixed(0)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-sky-500 rounded-full transition-all duration-300" style={{ width: `${scenarioResults.percentComplete}%` }} />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-205 dark:border-slate-900">
                          <div className="text-[9px] text-slate-400 uppercase tracking-wider">ETTC Estimado</div>
                          <div className="text-sm font-black mt-1 text-slate-800 dark:text-slate-100">{scenarioResults.ettcString}</div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-205 dark:border-slate-900">
                          <div className="text-[9px] text-slate-400 uppercase tracking-wider">Previsão ETOC</div>
                          <div className="text-sm font-black mt-1 text-slate-800 dark:text-slate-100">{scenarioResults.etocString}</div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-205 dark:border-slate-900">
                          <div className="text-[9px] text-slate-400 uppercase tracking-wider">Volume Final Origem</div>
                          <div className="text-sm font-black mt-1 text-slate-800 dark:text-slate-100 font-mono">
                            {scenarioResults.finalOrigLvl.toFixed(1)}%
                          </div>
                          <div className="text-[9px] text-slate-400">{scenarioResults.finalOrigVol.toFixed(0)} m³</div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-205 dark:border-slate-900">
                          <div className="text-[9px] text-slate-400 uppercase tracking-wider">Volume Final Destino</div>
                          <div className="text-sm font-black mt-1 text-slate-800 dark:text-slate-100 font-mono">
                            {scenarioResults.finalDestLvl.toFixed(1)}%
                          </div>
                          <div className="text-[9px] text-slate-400">{scenarioResults.finalDestVol.toFixed(0)} m³</div>
                        </div>
                      </div>

                      {/* Local scenario predicted alarms */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-850">
                        <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Alarmes Previstos (Estático)</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {scenarioResults.willOverflow && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 rounded text-[10px] font-bold">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Transbordo Previsto no Destino ({sceneDestTank?.tag})
                            </div>
                          )}
                          {scenarioResults.willEmpty && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 rounded text-[10px] font-bold">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Esgotamento Previsto na Origem ({sceneOriginTank?.tag})
                            </div>
                          )}
                          {!scenarioResults.willOverflow && !scenarioResults.willEmpty && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded text-[10px] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Nenhum alarme operacional previsto
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Graphic simulation comparison */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Origin Tank card mockup */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-4 rounded-2xl flex flex-col items-center shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider mb-2">
                          Origem: {sceneOriginTank?.tag}
                        </span>
                        <TankGeometrySvg
                          geometry={sceneOriginTank?.name.startsWith('V-3') ? 'spherical' : sceneOriginTank?.name.startsWith('V-4') ? 'pressurized' : 'vertical_cylindrical'}
                          levelPercent={scenarioResults.finalOrigLvl}
                          fillColor="#f59e0b"
                          width={75}
                          height={95}
                        />
                        <div className="text-center mt-2">
                          <span className="text-sm font-bold text-slate-850 dark:text-slate-200 font-mono">{scenarioResults.finalOrigLvl.toFixed(1)}%</span>
                          <span className="block text-[10px] text-slate-400">{scenarioResults.finalOrigVol.toFixed(0)} m³</span>
                        </div>
                      </div>

                      {/* Destination Tank card mockup */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-4 rounded-2xl flex flex-col items-center shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider mb-2">
                          Destino: {sceneDestTank?.tag}
                        </span>
                        <TankGeometrySvg
                          geometry={sceneDestTank?.name.startsWith('V-3') ? 'spherical' : sceneDestTank?.name.startsWith('V-4') ? 'pressurized' : 'vertical_cylindrical'}
                          levelPercent={scenarioResults.finalDestLvl}
                          fillColor="#0ea5e9"
                          width={75}
                          height={95}
                        />
                        <div className="text-center mt-2">
                          <span className="text-sm font-bold text-slate-850 dark:text-slate-200 font-mono">{scenarioResults.finalDestLvl.toFixed(1)}%</span>
                          <span className="block text-[10px] text-slate-400">{scenarioResults.finalDestVol.toFixed(0)} m³</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
