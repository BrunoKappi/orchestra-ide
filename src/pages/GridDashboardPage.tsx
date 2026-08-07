import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { HeaderNavigation } from '../components/navigation/HeaderNavigation';
import type { GridConfig, TankCardData, GridLayoutState } from '../features/grid-dashboard/types';
import { GridCanvas } from '../features/grid-dashboard/components/GridCanvas';
import { GridDashboardHeader } from '../features/grid-dashboard/components/GridDashboardHeader';
import { GridCardInspector } from '../features/grid-dashboard/components/GridCardInspector';
import { GridSettingsModal } from '../features/grid-dashboard/components/GridSettingsModal';
import { ObjectSelectorModal } from '../features/grid-dashboard/components/ObjectSelectorModal';
import { useObjectModelStore } from '../store/useObjectModelStore';
import { propertyRepo } from '../repository/PropertyRepository';

const STORAGE_KEY = 'grid_dashboard_layout';


const buildCardFromObject = (
  objectId: string,
  startRow: number,
  startCol: number,
  rowSpan: number,
  colSpan: number,
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

  // Determine category from template hierarchy
  let category = 'EQUIPAMENTO';
  if (tmpl) {
    const name = tmpl.name.toLowerCase();
    if (name.includes('nafta') || name.includes('matéria')) category = 'MATÉRIA-PRIMA';
    else if (name.includes('benzeno') || name.includes('intermediár')) category = 'INTERMEDIÁRIOS';
    else if (name.includes('eteno') || name.includes('olefina') || name.includes('press')) category = 'OLEFINAS';
    else if (name.includes('produto') || name.includes('acabado')) category = 'PRODUTO ACABADO';
  }

  // Auto-determine border color by category
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

export const GridDashboardPage = () => {
  const [config, setConfig] = useState<GridConfig>({
    screenName: 'Dashboard de Tanques Industriais',
    rows: 8,
    cols: 8,
  });

  const [cards, setCards] = useState<TankCardData[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // Pending add card position (to show object selector)
  const [pendingAdd, setPendingAdd] = useState<{ sRow: number; sCol: number; rSpan: number; cSpan: number } | null>(null);

  // State for editing variables of a trend card
  const [editingTrendCard, setEditingTrendCard] = useState<TankCardData | null>(null);

  const [isNewScreenModalOpen, setIsNewScreenModalOpen] = useState(false);
  const [isChangeGridModalOpen, setIsChangeGridModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const { objects, simulatedValues, isSimulating, simulationSpeedMs, tickSimulation } = useObjectModelStore();

  // Sync card live values from the simulatedValues store and object graphicConfig
  const syncCardValues = useCallback((prevCards: TankCardData[]): TankCardData[] => {
    const { objects, templates } = useObjectModelStore.getState();
    return prevCards.map((card) => {
      const objectId = card.objectId;
      if (!objectId) return card;

      const obj = objects.find((o) => o.id === objectId);
      const tmpl = obj ? templates.find((t) => t.id === obj.templateId) : undefined;
      const graphicCfg = obj?.graphicConfig || tmpl?.graphicConfig;

      const geometryType = graphicCfg?.geometryType || card.geometryType || 'vertical_cylindrical';
      const fieldBindings = graphicCfg?.fieldBindings?.length
        ? graphicCfg.fieldBindings
        : card.fieldBindings || [];

      const getVal = (propName: string, fallback: number) => {
        const key = `${objectId}:${propName}`;
        const v = simulatedValues[key];
        return v != null ? parseFloat(v) : fallback;
      };

      const getStr = (propName: string, fallback: string) => {
        const key = `${objectId}:${propName}`;
        return simulatedValues[key] ?? fallback;
      };

      const lvl = getVal('Level', card.levelPercent);
      const invStatus = getStr('Status', 'Normal');
      const flow = getVal('Flow', 0);

      let status: TankCardData['status'] = 'NORMAL';
      if (lvl >= 90 || lvl <= 5) status = 'CRITICAL';
      else if (lvl >= 80 || lvl <= 15 || flow !== 0) status = 'ATENÇÃO';

      return {
        ...card,
        geometryType,
        fieldBindings,
        levelPercent: lvl,
        status,
        footerLabel: invStatus,
      };
    });
  }, [simulatedValues]);

  useEffect(() => {
    setCards((prev) => syncCardValues(prev));
  }, [simulatedValues, syncCardValues]);

  // Start simulation loop if active
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      tickSimulation();
    }, simulationSpeedMs);
    return () => clearInterval(interval);
  }, [isSimulating, simulationSpeedMs, tickSimulation]);

  // Load saved layout on mount, seeding defaults if no layout exists
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: GridLayoutState = JSON.parse(saved);
        if (parsed.config && Array.isArray(parsed.cards)) {
          setConfig(parsed.config);
          setCards(parsed.cards);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Seed default cards from real objects if available
    if (objects.length > 0) {
      const defaultTags = ['TK-301', 'TK-302', 'TK-401', 'V-301'];
      const defaultPositions = [
        { startRow: 1, startCol: 1, rowSpan: 3, colSpan: 3 },
        { startRow: 1, startCol: 4, rowSpan: 3, colSpan: 3 },
        { startRow: 4, startCol: 1, rowSpan: 3, colSpan: 3 },
        { startRow: 4, startCol: 4, rowSpan: 3, colSpan: 3 },
      ];
      const defaultCards: TankCardData[] = [];
      defaultTags.forEach((tag, i) => {
        const obj = objects.find((o) => o.name === tag);
        if (obj) {
          const pos = defaultPositions[i];
          defaultCards.push(buildCardFromObject(obj.id, pos.startRow, pos.startCol, pos.rowSpan, pos.colSpan));
        }
      });
      if (defaultCards.length > 0) setCards(defaultCards);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveLayout = () => {
    const data: GridLayoutState = { config, cards };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    showToast('✓ Layout salvo com sucesso!');
  };

  const handleLoadLayout = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: GridLayoutState = JSON.parse(saved);
        if (parsed.config && Array.isArray(parsed.cards)) {
          setConfig(parsed.config);
          setCards(parsed.cards);
          setSelectedCardId(null);
          showToast('✓ Layout recarregado do armazenamento!');
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    showToast('⚠️ Nenhum layout salvo encontrado.');
  };

  const handleConfirmNewScreen = (newConfig: GridConfig) => {
    setConfig(newConfig);
    setCards([]);
    setSelectedCardId(null);
    showToast(`Nova tela "${newConfig.screenName}" criada!`);
  };

  const handleConfirmChangeGrid = (newConfig: GridConfig) => {
    setConfig(newConfig);
    const filteredCards = cards.filter(
      (c) => c.startRow <= newConfig.rows && c.startCol <= newConfig.cols,
    );
    setCards(filteredCards);
    showToast(`Grade alterada para ${newConfig.rows}x${newConfig.cols}`);
  };

  const handleClearScreen = () => {
    if (cards.length === 0) return;
    if (window.confirm('Deseja realmente remover todos os cartões da tela?')) {
      setCards([]);
      setSelectedCardId(null);
      showToast('Tela limpa!');
    }
  };

  // When the user selects an area on the grid, open ObjectSelectorModal
  const handleAddCard = (sRow: number, sCol: number, rSpan: number, cSpan: number) => {
    setPendingAdd({ sRow, sCol, rSpan, cSpan });
  };

  // Called when user picks an object in the selector
  const handleObjectSelected = (objectId: string) => {
    if (!pendingAdd) return;
    const { sRow, sCol, rSpan, cSpan } = pendingAdd;
    const newCard = buildCardFromObject(objectId, sRow, sCol, rSpan, cSpan);
    setCards((prev) => {
      // Replace existing card for same object if any
      const filtered = prev.filter((c) => c.objectId !== objectId);
      return [...filtered, newCard];
    });
    setSelectedCardId(newCard.id);
    setPendingAdd(null);
    showToast(`✓ Equipamento ${newCard.tag} adicionado ao Grid`);
  };

  const handleTrendSelected = (
    properties: Array<{ objectId: string; propertyName: string; objectName: string; propertyLabel: string }>
  ) => {
    if (!pendingAdd) return;
    const { sRow, sCol, rSpan, cSpan } = pendingAdd;

    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];
    const trendProps = properties.map((p, idx) => ({
      objectId: p.objectId,
      propertyName: p.propertyName,
      label: `${p.objectName}.${p.propertyLabel || p.propertyName}`,
      color: colors[idx % colors.length]
    }));

    const newCard: TankCardData = {
      id: `trend-${uuidv4()}`,
      tag: 'TENDÊNCIA',
      category: 'GRÁFICO',
      title: trendProps.length === 1 
        ? `Tendência de ${trendProps[0].label}` 
        : `Gráfico de Tendência (${trendProps.length} var)`,
      description: 'Gráfico de tendência em tempo real',
      geometryType: 'vertical_cylindrical',
      levelPercent: 0,
      status: 'NORMAL',
      footerLabel: 'Live',
      fieldBindings: [],
      startRow: sRow,
      startCol: sCol,
      rowSpan: rSpan,
      colSpan: cSpan,
      isTrend: true,
      trendProperties: trendProps
    };

    setCards((prev) => [...prev, newCard]);
    setSelectedCardId(newCard.id);
    setPendingAdd(null);
    showToast(`✓ Gráfico de tendência adicionado ao Grid`);
  };

  const handleSaveTrendEdit = (
    properties: Array<{ objectId: string; propertyName: string; objectName: string; propertyLabel: string }>
  ) => {
    if (!editingTrendCard) return;

    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];
    const trendProps = properties.map((p, idx) => {
      const existing = editingTrendCard.trendProperties?.find(
        (ep) => ep.objectId === p.objectId && ep.propertyName === p.propertyName
      );
      return {
        objectId: p.objectId,
        propertyName: p.propertyName,
        label: `${p.objectName}.${p.propertyLabel || p.propertyName}`,
        color: existing?.color || colors[idx % colors.length]
      };
    });

    const updatedCard: TankCardData = {
      ...editingTrendCard,
      trendProperties: trendProps,
      title: trendProps.length === 1
        ? `Tendência de ${trendProps[0].label}`
        : `Gráfico de Tendência (${trendProps.length} var)`,
    };

    setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
    setSelectedCardId(updatedCard.id);
    setEditingTrendCard(null);
    showToast(`✓ Gráfico de tendência atualizado`);
  };

  const handleUpdateCardPosition = (id: string, sRow: number, sCol: number, rSpan: number, cSpan: number) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, startRow: sRow, startCol: sCol, rowSpan: rSpan, colSpan: cSpan }
          : c,
      ),
    );
  };

  const handleUpdateCard = (updatedCard: TankCardData) => {
    setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
  };

  const handleDeleteCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    if (selectedCardId === id) setSelectedCardId(null);
  };

  const selectedCard = cards.find((c) => c.id === selectedCardId);
  const alreadySelectedObjectIds = cards
    .map((c) => c.objectId)
    .filter((id): id is string => id != null);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-[#0b0c0e] text-slate-900 dark:text-slate-100 transition-colors">
      <HeaderNavigation />

      <GridDashboardHeader
        config={config}
        isViewMode={isViewMode}
        cardCount={cards.length}
        onNewScreen={() => setIsNewScreenModalOpen(true)}
        onSaveLayout={handleSaveLayout}
        onLoadLayout={handleLoadLayout}
        onChangeGrid={() => setIsChangeGridModalOpen(true)}
        onClearScreen={handleClearScreen}
        onToggleMode={() => {
          setIsViewMode(!isViewMode);
          setSelectedCardId(null);
        }}
      />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900/90 dark:bg-slate-100/90 text-white dark:text-slate-900 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl z-50 flex items-center gap-2 border border-slate-700 dark:border-slate-300">
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 overflow-auto">
          <GridCanvas
            config={config}
            cards={cards}
            selectedCardId={selectedCardId}
            isViewMode={isViewMode}
            onSelectCard={(id) => setSelectedCardId(id)}
            onAddCard={handleAddCard}
            onUpdateCardPosition={handleUpdateCardPosition}
          />
        </div>

        {!isViewMode && selectedCard && (
          <GridCardInspector
            card={selectedCard}
            onClose={() => setSelectedCardId(null)}
            onUpdateCard={handleUpdateCard}
            onDeleteCard={handleDeleteCard}
            onEditTrendVariables={() => setEditingTrendCard(selectedCard)}
          />
        )}
      </div>

      <GridSettingsModal
        isOpen={isNewScreenModalOpen}
        initialConfig={{ screenName: 'Nova Tela de Dashboard', rows: 8, cols: 8 }}
        titleText="Nova Tela de Dashboard por Grade"
        onClose={() => setIsNewScreenModalOpen(false)}
        onConfirm={handleConfirmNewScreen}
      />

      <GridSettingsModal
        isOpen={isChangeGridModalOpen}
        initialConfig={config}
        titleText="Alterar Dimensões da Grade"
        onClose={() => setIsChangeGridModalOpen(false)}
        onConfirm={handleConfirmChangeGrid}
      />

      <ObjectSelectorModal
        isOpen={pendingAdd !== null || editingTrendCard !== null}
        onClose={() => {
          setPendingAdd(null);
          setEditingTrendCard(null);
        }}
        onSelect={handleObjectSelected}
        alreadySelectedIds={alreadySelectedObjectIds}
        initialSelectedProps={
          editingTrendCard
            ? editingTrendCard.trendProperties?.map((p) => {
                const obj = objects.find((o) => o.id === p.objectId);
                return {
                  objectId: p.objectId,
                  propertyName: p.propertyName,
                  objectName: obj?.name || '',
                  propertyLabel: p.label.split('.').slice(1).join('.') || p.propertyName,
                };
              })
            : []
        }
        onSelectTrend={(properties) => {
          if (editingTrendCard) {
            handleSaveTrendEdit(properties);
          } else {
            handleTrendSelected(properties);
          }
        }}
      />
    </div>
  );
};
