import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';

export interface KpiWidget {
  id: string;
  name: string;
  type: 'card' | 'gauge' | 'line' | 'bar' | 'pie' | 'area' | 'trend' | 'heatmap' | 'table' | 'events';
  kpiKey: string; // Key of the KPI (predefined or custom)
  x: number; // grid column (0-11)
  y: number; // grid row (arbitrary index)
  w: number; // grid width (1-12)
  h: number; // grid height (units)
  config?: {
    thresholds?: { warning: number; critical: number; target: number };
    maxLimit?: number;
    color?: string;
  };
}

export interface CustomKpi {
  id: string;
  name: string;
  description: string;
  formula: string; // e.g. "Tank101:Level * 0.5 + Tank102:Level * 0.5" or aggregates
  variables: Array<{ label: string; path: string }>; // e.g. [{ label: 'V1', path: 'Tank101:Level' }]
  expression: string; // e.g. "V1 * 0.5 + V2 * 0.5"
}

export interface KpiFilter {
  period: string; // '1h' | '8h' | '24h' | 'today' | 'all'
  areaId: string; // 'all' or id
  productId: string; // 'all' or id
  equipmentId: string; // 'all' or id
  operatorId: string; // 'all' or id
}

interface KpiStoreState {
  widgets: KpiWidget[];
  customKpis: CustomKpi[];
  filters: KpiFilter;
  isTvMode: boolean;
}

interface KpiStoreActions {
  addWidget: (type: KpiWidget['type'], kpiKey: string, name: string) => void;
  removeWidget: (id: string) => void;
  updateWidgetLayout: (id: string, layout: Partial<Pick<KpiWidget, 'x' | 'y' | 'w' | 'h'>>) => void;
  saveLayout: () => void;
  resetLayout: () => void;
  setFilter: (key: keyof KpiFilter, value: string) => void;
  addCustomKpi: (kpi: Omit<CustomKpi, 'id'>) => void;
  deleteCustomKpi: (id: string) => void;
  setTvMode: (enabled: boolean) => void;
}

type KpiStore = KpiStoreState & KpiStoreActions;

const STORAGE_KEYS = {
  WIDGETS: 'kpi_dashboard_widgets_v1',
  CUSTOM_KPIS: 'kpi_dashboard_custom_kpis_v1',
  FILTERS: 'kpi_dashboard_filters_v1',
};

const DEFAULT_WIDGETS: KpiWidget[] = [
  { id: 'w-prod-total', name: 'Produção Total', type: 'card', kpiKey: 'prod_total', x: 0, y: 0, w: 3, h: 3 },
  { id: 'w-prod-hour', name: 'Produção por Hora', type: 'card', kpiKey: 'prod_hour', x: 3, y: 0, w: 3, h: 3 },
  { id: 'w-vol-mov', name: 'Volume Movimentado', type: 'card', kpiKey: 'vol_mov', x: 6, y: 0, w: 3, h: 3 },
  { id: 'w-massa-mov', name: 'Massa Movimentada', type: 'card', kpiKey: 'massa_mov', x: 9, y: 0, w: 3, h: 3 },

  { id: 'w-gauge-tank', name: 'Ocupação Média dos Tanques', type: 'gauge', kpiKey: 'tank_occupancy', x: 0, y: 3, w: 4, h: 6, config: { thresholds: { warning: 75, critical: 90, target: 50 }, maxLimit: 100 } },
  { id: 'w-gauge-eff', name: 'Eficiência Operacional (OEE)', type: 'gauge', kpiKey: 'oee', x: 4, y: 3, w: 4, h: 6, config: { thresholds: { warning: 60, critical: 40, target: 85 }, maxLimit: 100 } },
  { id: 'w-gauge-accuracy', name: 'Acurácia Média', type: 'gauge', kpiKey: 'avg_accuracy', x: 8, y: 3, w: 4, h: 6, config: { thresholds: { warning: 90, critical: 80, target: 98 }, maxLimit: 100 } },

  { id: 'w-trend', name: 'Tendência de Produção', type: 'line', kpiKey: 'prod_trend', x: 0, y: 9, w: 8, h: 6 },
  { id: 'w-pie-product', name: 'Distribuição por Produto', type: 'pie', kpiKey: 'prod_by_product', x: 8, y: 9, w: 4, h: 6 },

  { id: 'w-alarms-bar', name: 'Alarmes por Área', type: 'bar', kpiKey: 'alarms_by_area', x: 0, y: 15, w: 6, h: 6 },
  { id: 'w-heatmap', name: 'Intensidade de Utilização (Equipamentos)', type: 'heatmap', kpiKey: 'equip_heatmap', x: 6, y: 15, w: 6, h: 6 },

  { id: 'w-table-summary', name: 'Resumo Operacional dos Equipamentos', type: 'table', kpiKey: 'equip_table', x: 0, y: 21, w: 7, h: 7 },
  { id: 'w-events', name: 'Principais Eventos e Alarmes Recentes', type: 'events', kpiKey: 'event_list', x: 7, y: 21, w: 5, h: 7 },
];

const loadInitialWidgets = (): KpiWidget[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WIDGETS);
    return raw ? JSON.parse(raw) : DEFAULT_WIDGETS;
  } catch {
    return DEFAULT_WIDGETS;
  }
};

const loadInitialCustomKpis = (): CustomKpi[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_KPIS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const loadInitialFilters = (): KpiFilter => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FILTERS);
    return raw ? JSON.parse(raw) : { period: 'today', areaId: 'all', productId: 'all', equipmentId: 'all', operatorId: 'all' };
  } catch {
    return { period: 'today', areaId: 'all', productId: 'all', equipmentId: 'all', operatorId: 'all' };
  }
};

export const useKpiStore = create<KpiStore>()(
  immer((set, get) => ({
    widgets: loadInitialWidgets(),
    customKpis: loadInitialCustomKpis(),
    filters: loadInitialFilters(),
    isTvMode: false,

    addWidget: (type, kpiKey, name) => set((state) => {
      let maxY = 0;
      state.widgets.forEach((w) => {
        if (w.y + w.h > maxY) maxY = w.y + w.h;
      });

      const w = type === 'card' ? 3 : type === 'gauge' ? 4 : 6;
      const h = type === 'card' ? 3 : type === 'gauge' ? 6 : 6;

      state.widgets.push({
        id: `widget-${uuidv4()}`,
        name,
        type,
        kpiKey,
        x: 0,
        y: maxY,
        w,
        h,
        config: {
          thresholds: { warning: 70, critical: 85, target: 90 },
          maxLimit: 100,
        }
      });
      localStorage.setItem(STORAGE_KEYS.WIDGETS, JSON.stringify(state.widgets));
    }),

    removeWidget: (id) => set((state) => {
      state.widgets = state.widgets.filter((w) => w.id !== id);
      localStorage.setItem(STORAGE_KEYS.WIDGETS, JSON.stringify(state.widgets));
    }),

    updateWidgetLayout: (id, layout) => set((state) => {
      const idx = state.widgets.findIndex((w) => w.id === id);
      if (idx !== -1) {
        state.widgets[idx] = { ...state.widgets[idx], ...layout };
        localStorage.setItem(STORAGE_KEYS.WIDGETS, JSON.stringify(state.widgets));
      }
    }),

    saveLayout: () => {
      localStorage.setItem(STORAGE_KEYS.WIDGETS, JSON.stringify(get().widgets));
    },

    resetLayout: () => set((state) => {
      state.widgets = DEFAULT_WIDGETS;
      localStorage.setItem(STORAGE_KEYS.WIDGETS, JSON.stringify(DEFAULT_WIDGETS));
    }),

    setFilter: (key, value) => set((state) => {
      state.filters[key] = value;
      localStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(state.filters));
    }),

    addCustomKpi: (kpi) => set((state) => {
      const newKpi: CustomKpi = {
        id: `custom-kpi-${uuidv4()}`,
        ...kpi,
      };
      state.customKpis.push(newKpi);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_KPIS, JSON.stringify(state.customKpis));
    }),

    deleteCustomKpi: (id) => set((state) => {
      state.customKpis = state.customKpis.filter((k) => k.id !== id);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_KPIS, JSON.stringify(state.customKpis));
    }),

    setTvMode: (enabled) => set((state) => {
      state.isTvMode = enabled;
    }),
  }))
);
