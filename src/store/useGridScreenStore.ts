import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import type { GridScreenEntity, TankCardData } from '../features/grid-dashboard/types';
import { gridScreenRepo } from '../repository/GridScreenRepository';
import { useObjectModelStore } from './useObjectModelStore';
import { propertyRepo } from '../repository/PropertyRepository';
import { useLogStore } from './useLogStore';

interface GridScreenStoreState {
  screens: GridScreenEntity[];
  activeScreenId: string | null;
  activeScreen: GridScreenEntity | null;
  isViewMode: boolean;

  // Actions
  init: () => void;
  selectScreen: (id: string) => void;
  createScreen: (name?: string) => string;
  renameScreen: (id: string, newName: string) => void;
  duplicateScreen: (id: string) => string;
  deleteScreen: (id: string) => void;
  toggleViewMode: () => void;
  setIsViewMode: (viewMode: boolean) => void;

  updateActiveScreenConfig: (rows: number, cols: number, screenName?: string) => void;
  updateActiveScreenCards: (cards: TankCardData[]) => void;
  updateCard: (updatedCard: TankCardData) => void;
  deleteCardFromActiveScreen: (cardId: string) => void;
  clearActiveScreenCards: () => void;
  saveActiveScreen: () => void;
}

export const buildCardFromObject = (
  objectId: string,
  startRow: number,
  startCol: number,
  rowSpan: number,
  colSpan: number
): TankCardData => {
  const { objects, templates } = useObjectModelStore.getState();
  const obj = objects.find((o) => o.id === objectId);
  const tmpl = obj ? templates.find((t) => t.id === obj.templateId) : undefined;
  const graphicCfg = obj?.graphicConfig || tmpl?.graphicConfig;

  const geometryType = graphicCfg?.geometryType || 'vertical_cylindrical';
  const fieldBindings = graphicCfg?.fieldBindings?.length
    ? graphicCfg.fieldBindings
    : [
        { propertyName: 'Level', label: 'Nível', unit: '%', decimalPlaces: 1, visible: true },
        { propertyName: 'Volume', label: 'Volume', unit: 'm³', decimalPlaces: 1, visible: true },
        { propertyName: 'Temperature', label: 'Temperatura', unit: '°C', decimalPlaces: 1, visible: true },
        { propertyName: 'Pressure', label: 'Pressão', unit: 'bar', decimalPlaces: 2, visible: true },
        { propertyName: 'Flow', label: 'Vazão', unit: 'm³/h', decimalPlaces: 1, visible: true },
      ];

  if (!obj) {
    return {
      id: `card-${objectId}`,
      objectId,
      tag: objectId,
      category: 'EQUIPAMENTO',
      title: objectId,
      description: '',
      geometryType,
      levelPercent: 0,
      status: 'NORMAL',
      footerLabel: 'Aguardando dados',
      fieldBindings,
      startRow,
      startCol,
      rowSpan,
      colSpan,
    };
  }

  const allProps = propertyRepo.getAll().filter((p) => p.targetId === objectId);
  const propMap: Record<string, string> = {};
  allProps.forEach((p) => { propMap[p.name] = p.defaultValue; });

  const tag = propMap['Tag'] || obj.name;
  const lvl = parseFloat(propMap['Level'] || '50');

  let category = 'EQUIPAMENTO';
  if (tmpl) {
    const name = tmpl.name.toLowerCase();
    if (name.includes('nafta') || name.includes('matéria')) category = 'MATÉRIA-PRIMA';
    else if (name.includes('benzeno') || name.includes('intermediár')) category = 'INTERMEDIÁRIOS';
    else if (name.includes('eteno') || name.includes('olefina') || name.includes('press')) category = 'OLEFINAS';
    else if (name.includes('produto') || name.includes('acabado')) category = 'PRODUTO ACABADO';
  }

  const borderColors: Record<string, string> = {
    'MATÉRIA-PRIMA': '#0284c7',
    'INTERMEDIÁRIOS': '#8b5cf6',
    'OLEFINAS': '#06b6d4',
    'PRODUTO ACABADO': '#10b981',
    'EQUIPAMENTO': '#64748b',
  };

  return {
    id: `card-${objectId}`,
    objectId,
    tag,
    category,
    title: obj.description || obj.name,
    description: obj.description,
    geometryType,
    levelPercent: lvl,
    status: 'NORMAL',
    footerLabel: 'Normal',
    borderColor: borderColors[category],
    fieldBindings,
    startRow,
    startCol,
    rowSpan,
    colSpan,
  };
};

export const createDefaultSeededScreen = (): GridScreenEntity => {
  const { objects } = useObjectModelStore.getState();
  const defaultCards: TankCardData[] = [];

  if (objects.length > 0) {
    const defaultTags = ['TK-301', 'TK-302', 'TK-401', 'V-301'];
    const defaultPositions = [
      { startRow: 1, startCol: 1, rowSpan: 3, colSpan: 3 },
      { startRow: 1, startCol: 4, rowSpan: 3, colSpan: 3 },
      { startRow: 4, startCol: 1, rowSpan: 3, colSpan: 3 },
      { startRow: 4, startCol: 4, rowSpan: 3, colSpan: 3 },
    ];

    defaultTags.forEach((tag, i) => {
      const obj = objects.find((o) => o.name === tag);
      if (obj) {
        const pos = defaultPositions[i];
        defaultCards.push(buildCardFromObject(obj.id, pos.startRow, pos.startCol, pos.rowSpan, pos.colSpan));
      }
    });

    // Add default trend card if objects exist
    const tk301 = objects.find((o) => o.name === 'TK-301');
    const tk302 = objects.find((o) => o.name === 'TK-302');
    if (tk301 || tk302) {
      const trendProps = [];
      if (tk301) trendProps.push({ objectId: tk301.id, propertyName: 'Level', label: 'TK-301.Level', color: '#3b82f6' });
      if (tk302) trendProps.push({ objectId: tk302.id, propertyName: 'Level', label: 'TK-302.Level', color: '#8b5cf6' });

      defaultCards.push({
        id: `trend-${uuidv4()}`,
        tag: 'TENDÊNCIA',
        category: 'GRÁFICO',
        title: 'Tendência de Níveis de Estocagem',
        description: 'Gráfico de tendência em tempo real',
        geometryType: 'vertical_cylindrical',
        levelPercent: 0,
        status: 'NORMAL',
        footerLabel: 'Live',
        fieldBindings: [],
        startRow: 1,
        startCol: 7,
        rowSpan: 6,
        colSpan: 2,
        isTrend: true,
        trendProperties: trendProps,
      });
    }
  }

  const now = new Date().toISOString();
  return {
    id: `grid-screen-${uuidv4().slice(0, 8)}`,
    name: 'Dashboard de Tanques Industriais',
    rows: 8,
    cols: 8,
    cards: defaultCards,
    createdAt: now,
    updatedAt: now,
  };
};

export const useGridScreenStore = create<GridScreenStoreState>()(
  immer((set, get) => ({
    screens: [],
    activeScreenId: null,
    activeScreen: null,
    isViewMode: false,

    init: () => {
      useObjectModelStore.getState().init();
      let screens = gridScreenRepo.getAll();
      if (screens.length === 0) {
        const seeded = createDefaultSeededScreen();
        gridScreenRepo.save(seeded);
        screens = [seeded];
      }

      const activeId = screens[0].id;
      set((state) => {
        state.screens = screens;
        state.activeScreenId = activeId;
        state.activeScreen = screens[0];
      });
    },

    selectScreen: (id) => {
      const screen = get().screens.find((s) => s.id === id);
      if (!screen) return;
      set((state) => {
        state.activeScreenId = id;
        state.activeScreen = screen;
      });
    },

    createScreen: (name = 'Nova Tela de Dashboard') => {
      const now = new Date().toISOString();
      const newScreen: GridScreenEntity = {
        id: `grid-screen-${uuidv4().slice(0, 8)}`,
        name,
        rows: 8,
        cols: 8,
        cards: [],
        createdAt: now,
        updatedAt: now,
      };

      gridScreenRepo.save(newScreen);

      useLogStore.getState().addLog({
        user: 'Bruno Kappi',
        module: 'Grid Designer',
        entity: 'Tela',
        operation: 'CREATE',
        action: 'Tela Criada',
        description: `Nova tela sinóptica "${name}" criada no Grid Designer.`,
        severity: 'Sucesso',
        result: 'Sucesso',
        origin: 'manual',
        targetId: newScreen.id,
      });

      set((state) => {
        state.screens.push(newScreen);
        state.activeScreenId = newScreen.id;
        state.activeScreen = newScreen;
      });

      return newScreen.id;
    },

    renameScreen: (id, newName) => {
      const screens = get().screens;
      const target = screens.find((s) => s.id === id);
      if (!target) return;

      const prevName = target.name;
      const updated = { ...target, name: newName, updatedAt: new Date().toISOString() };
      gridScreenRepo.save(updated);

      useLogStore.getState().addLog({
        user: 'Bruno Kappi',
        module: 'Grid Designer',
        entity: 'Tela',
        operation: 'UPDATE',
        action: 'Tela Renomeada',
        description: `Tela sinóptica "${prevName}" renomeada para "${newName}".`,
        severity: 'Informação',
        result: 'Sucesso',
        origin: 'manual',
        targetId: id,
        previousValue: prevName,
        newValue: newName,
      });

      set((state) => {
        const sc = state.screens.find((s) => s.id === id);
        if (sc) sc.name = newName;
        if (state.activeScreen?.id === id) state.activeScreen.name = newName;
      });
    },

    duplicateScreen: (id) => {
      const original = get().screens.find((s) => s.id === id);
      if (!original) return id;

      const now = new Date().toISOString();
      const duplicate: GridScreenEntity = {
        ...original,
        id: `grid-screen-${uuidv4().slice(0, 8)}`,
        name: `${original.name} (cópia)`,
        cards: original.cards.map((c) => ({ ...c, id: `${c.id}-copy-${uuidv4().slice(0, 4)}` })),
        createdAt: now,
        updatedAt: now,
      };

      gridScreenRepo.save(duplicate);

      useLogStore.getState().addLog({
        user: 'Bruno Kappi',
        module: 'Grid Designer',
        entity: 'Tela',
        operation: 'CREATE',
        action: 'Tela Duplicada',
        description: `Tela sinóptica "${original.name}" duplicada com sucesso. Cópia: "${duplicate.name}".`,
        severity: 'Sucesso',
        result: 'Sucesso',
        origin: 'manual',
        targetId: duplicate.id,
      });

      set((state) => {
        state.screens.push(duplicate);
        state.activeScreenId = duplicate.id;
        state.activeScreen = duplicate;
      });

      return duplicate.id;
    },

    deleteScreen: (id) => {
      const target = get().screens.find((s) => s.id === id);
      gridScreenRepo.delete(id);

      if (target) {
        useLogStore.getState().addLog({
          user: 'Bruno Kappi',
          module: 'Grid Designer',
          entity: 'Tela',
          operation: 'DELETE',
          action: 'Tela Excluída',
          description: `Tela sinóptica "${target.name}" deletada com sucesso.`,
          severity: 'Aviso',
          result: 'Sucesso',
          origin: 'manual',
          targetId: id,
        });
      }

      set((state) => {
        state.screens = state.screens.filter((s) => s.id !== id);
        if (state.activeScreenId === id) {
          if (state.screens.length > 0) {
            state.activeScreenId = state.screens[0].id;
            state.activeScreen = state.screens[0];
          } else {
            const fresh = createDefaultSeededScreen();
            gridScreenRepo.save(fresh);
            state.screens = [fresh];
            state.activeScreenId = fresh.id;
            state.activeScreen = fresh;
          }
        }
      });
    },

    toggleViewMode: () => set((state) => { state.isViewMode = !state.isViewMode; }),
    setIsViewMode: (viewMode) => set((state) => { state.isViewMode = viewMode; }),

    updateActiveScreenConfig: (rows, cols, screenName) => {
      const { activeScreen } = get();
      if (!activeScreen) return;

      const updatedName = screenName !== undefined ? screenName : activeScreen.name;
      // Filter cards that fall outside new grid dimensions
      const filteredCards = activeScreen.cards.filter(
        (c) => c.startRow <= rows && c.startCol <= cols
      );

      const updated: GridScreenEntity = {
        ...activeScreen,
        rows,
        cols,
        name: updatedName,
        cards: filteredCards,
        updatedAt: new Date().toISOString(),
      };

      gridScreenRepo.save(updated);

      useLogStore.getState().addLog({
        user: 'Bruno Kappi',
        module: 'Grid Designer',
        entity: 'Configuração de Layout',
        operation: 'CONFIGURE',
        action: 'Layout da Tela Atualizado',
        description: `Dimensões da tela "${activeScreen.name}" configuradas para ${rows} linhas e ${cols} colunas.`,
        severity: 'Informação',
        result: 'Sucesso',
        origin: 'manual',
        targetId: activeScreen.id,
      });

      set((state) => {
        if (state.activeScreen) {
          state.activeScreen.rows = rows;
          state.activeScreen.cols = cols;
          state.activeScreen.name = updatedName;
          state.activeScreen.cards = filteredCards;
        }
        const idx = state.screens.findIndex((s) => s.id === activeScreen.id);
        if (idx !== -1) state.screens[idx] = updated;
      });
    },

    updateActiveScreenCards: (cards) => {
      const { activeScreen } = get();
      if (!activeScreen) return;

      const updated: GridScreenEntity = {
        ...activeScreen,
        cards,
        updatedAt: new Date().toISOString(),
      };

      gridScreenRepo.save(updated);

      set((state) => {
        if (state.activeScreen) {
          state.activeScreen.cards = cards;
        }
        const idx = state.screens.findIndex((s) => s.id === activeScreen.id);
        if (idx !== -1) state.screens[idx] = updated;
      });
    },

    updateCard: (updatedCard) => {
      const { activeScreen } = get();
      if (!activeScreen) return;

      const newCards = activeScreen.cards.map((c) =>
        c.id === updatedCard.id ? updatedCard : c
      );

      get().updateActiveScreenCards(newCards);
    },

    deleteCardFromActiveScreen: (cardId) => {
      const { activeScreen } = get();
      if (!activeScreen) return;

      const newCards = activeScreen.cards.filter((c) => c.id !== cardId);
      get().updateActiveScreenCards(newCards);
    },

    clearActiveScreenCards: () => {
      const { activeScreen } = get();
      if (!activeScreen) return;

      get().updateActiveScreenCards([]);
    },

    saveActiveScreen: () => {
      const { activeScreen } = get();
      if (activeScreen) {
        gridScreenRepo.save(activeScreen);
      }
    },
  }))
);
