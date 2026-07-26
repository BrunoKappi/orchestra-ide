import React, { useMemo } from 'react';
import { useOmmStore } from '../../store/useOmmStore';
import { Droplets, Package, BarChart3, TrendingUp } from 'lucide-react';

// ---------------------------------------------------------------------------
// Donut chart (SVG)
// ---------------------------------------------------------------------------
interface DonutSlice { label: string; value: number; color: string }

const DonutChart: React.FC<{ slices: DonutSlice[]; total: number; unit: string; size?: number }> = ({
  slices, total, unit, size = 120,
}) => {
  const r = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;

  let cumulativeAngle = -90;

  const arcs = slices
    .filter((s) => s.value > 0)
    .map((s) => {
      const pct = s.value / total;
      const angle = pct * 360;
      const startRad = (cumulativeAngle * Math.PI) / 180;
      const endRad = ((cumulativeAngle + angle) * Math.PI) / 180;
      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);
      const large = angle > 180 ? 1 : 0;
      cumulativeAngle += angle;
      return { ...s, pct, d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z` };
    });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((arc, i) => (
        <path key={i} d={arc.d} fill={arc.color} opacity="0.85" stroke="white" strokeWidth="1" />
      ))}
      {/* Center hole */}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="white" className="dark:fill-slate-900" />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="currentColor" className="fill-slate-700 dark:fill-slate-200">
        {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toFixed(0)}
      </text>
      <text x={cx} y={cy + 9} textAnchor="middle" fontSize="9" fill="currentColor" className="fill-slate-400">
        {unit}
      </text>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Inventory Dashboard
// ---------------------------------------------------------------------------
export const InventoryDashboard: React.FC = () => {
  const equipments = useOmmStore((s) => s.equipments);
  const products = useOmmStore((s) => s.products);

  const tanks = useMemo(() => equipments.filter((e) => e.type === 'Tank' || e.type === 'Vessel'), [equipments]);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  // Inventory by product
  const byProduct = useMemo(() => {
    const map: Map<string, { name: string; color: string; volume: number; mass: number; tankCount: number }> = new Map();
    tanks.forEach((t) => {
      if (!t.productId) return;
      const prod = productMap.get(t.productId);
      if (!prod) return;
      const existing = map.get(t.productId) ?? { name: prod.name, color: prod.color, volume: 0, mass: 0, tankCount: 0 };
      existing.volume += t.currentVolume;
      existing.mass += t.currentMass;
      existing.tankCount++;
      map.set(t.productId, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.volume - a.volume);
  }, [tanks, productMap]);

  const totalVolume = byProduct.reduce((s, p) => s + p.volume, 0);
  const totalMass = byProduct.reduce((s, p) => s + p.mass, 0);
  const totalCapacity = tanks.reduce((s, t) => s + t.capacity, 0);
  const avgOccupancy = tanks.length > 0 ? tanks.reduce((s, t) => s + t.currentLevel, 0) / tanks.length : 0;

  // Donut slices
  const donutSlices: DonutSlice[] = byProduct.map((p) => ({
    label: p.name,
    value: p.volume,
    color: p.color,
  }));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shrink-0">
        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Dashboard de Inventário</span>
        <span className="ml-3 text-[10px] text-slate-400">{tanks.length} tanques monitorados</span>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* KPI row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Volume Total', value: `${(totalVolume / 1000).toFixed(1)}k m³`, icon: <Droplets className="w-4 h-4 text-cyan-500" />, color: 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800/50' },
            { label: 'Massa Total', value: `${(totalMass / 1000).toFixed(1)} kt`, icon: <Package className="w-4 h-4 text-violet-500" />, color: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800/50' },
            { label: 'Capacidade Total', value: `${(totalCapacity / 1000).toFixed(1)}k m³`, icon: <BarChart3 className="w-4 h-4 text-slate-400" />, color: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700' },
            { label: 'Ocupação Média', value: `${avgOccupancy.toFixed(1)}%`, icon: <TrendingUp className="w-4 h-4 text-emerald-500" />, color: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50' },
          ].map((k) => (
            <div key={k.label} className={`flex items-center gap-3 p-3 rounded-xl border ${k.color}`}>
              <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/60">
                {k.icon}
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-medium">{k.label}</div>
                <div className="text-base font-bold text-slate-800 dark:text-slate-100">{k.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="grid grid-cols-3 gap-4">
          {/* Product distribution donut */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Distribuição por Produto</div>
            <div className="flex items-center gap-4">
              <DonutChart slices={donutSlices} total={totalVolume || 1} unit="m³" size={140} />
              <div className="flex-1 space-y-1.5">
                {byProduct.slice(0, 6).map((p) => (
                  <div key={p.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 truncate flex-1">{p.name}</span>
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      {totalVolume > 0 ? ((p.volume / totalVolume) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tank list */}
          <div className="col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tanques e Vasos</span>
            </div>
            <div className="overflow-auto max-h-[280px]">
              <table className="w-full text-[11px]">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-3 py-1.5 text-left text-[10px] font-bold uppercase text-slate-400">Tag</th>
                    <th className="px-3 py-1.5 text-left text-[10px] font-bold uppercase text-slate-400">Produto</th>
                    <th className="px-3 py-1.5 text-left text-[10px] font-bold uppercase text-slate-400">Nível</th>
                    <th className="px-3 py-1.5 text-right text-[10px] font-bold uppercase text-slate-400">Volume</th>
                    <th className="px-3 py-1.5 text-right text-[10px] font-bold uppercase text-slate-400">Massa</th>
                    <th className="px-3 py-1.5 text-right text-[10px] font-bold uppercase text-slate-400">Cap.</th>
                  </tr>
                </thead>
                <tbody>
                  {tanks.map((t, i) => {
                    const prod = t.productId ? productMap.get(t.productId) : null;
                    return (
                      <tr key={t.id} className={`border-t border-slate-100 dark:border-slate-800 ${i % 2 === 0 ? '' : 'bg-slate-50/40 dark:bg-slate-800/20'}`}>
                        <td className="px-3 py-1.5 font-mono font-bold text-slate-700 dark:text-slate-200">{t.tag}</td>
                        <td className="px-3 py-1.5">
                          {prod ? (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: prod.color }} />
                              <span className="text-slate-600 dark:text-slate-300 truncate max-w-[100px]">{prod.name}</span>
                            </span>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-3 py-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${t.currentLevel}%`, backgroundColor: prod?.color ?? '#64748b' }} />
                            </div>
                            <span className="font-mono text-[10px] text-slate-500">{t.currentLevel.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono text-slate-600 dark:text-slate-300">{t.currentVolume.toFixed(0)} m³</td>
                        <td className="px-3 py-1.5 text-right font-mono text-slate-500">{(t.currentMass / 1000).toFixed(2)} kt</td>
                        <td className="px-3 py-1.5 text-right font-mono text-slate-400">{t.capacity.toFixed(0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Product inventory cards */}
        <div className="grid grid-cols-4 gap-3">
          {byProduct.map((p) => (
            <div key={p.name} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{p.name}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Volume</span>
                  <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{p.volume.toFixed(0)} m³</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Massa</span>
                  <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{(p.mass / 1000).toFixed(2)} kt</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Tanques</span>
                  <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{p.tankCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
