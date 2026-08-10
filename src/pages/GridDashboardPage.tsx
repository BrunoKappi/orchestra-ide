import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Edit3 } from 'lucide-react';
import { HeaderNavigation } from '../components/navigation/HeaderNavigation';
import type { GridConfig, TankCardData } from '../features/grid-dashboard/types';
import { GridCanvas } from '../features/grid-dashboard/components/GridCanvas';
import { GridDashboardHeader } from '../features/grid-dashboard/components/GridDashboardHeader';
import { GridCardInspector } from '../features/grid-dashboard/components/GridCardInspector';
import { GridSettingsModal } from '../features/grid-dashboard/components/GridSettingsModal';
import { ObjectSelectorModal } from '../features/grid-dashboard/components/ObjectSelectorModal';
import { GridScreenManagerModal } from '../features/grid-dashboard/components/GridScreenManagerModal';
import { TrendChartExpandedModal } from '../features/grid-dashboard/components/TrendChartExpandedModal';
import { useGridScreenStore, buildCardFromObject } from '../store/useGridScreenStore';
import { useObjectModelStore } from '../store/useObjectModelStore';

export const GridDashboardPage = () => {
  const {
    activeScreen,
    isViewMode,
    init,
    createScreen,
    renameScreen,
    toggleViewMode,
    updateActiveScreenConfig,
    updateActiveScreenCards,
    updateCard,
    deleteCardFromActiveScreen,
    clearActiveScreenCards,
  } = useGridScreenStore();

  const { objects, isSimulating, simulationSpeedMs, tickSimulation } = useObjectModelStore();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Modals
  const [isScreenManagerOpen, setIsScreenManagerOpen] = useState(false);
  const [isNewScreenModalOpen, setIsNewScreenModalOpen] = useState(false);
  const [isChangeGridModalOpen, setIsChangeGridModalOpen] = useState(false);
  const [expandedTrendCard, setExpandedTrendCard] = useState<TankCardData | null>(null);

  // Pending add position
  const [pendingAdd, setPendingAdd] = useState<{ sRow: number; sCol: number; rSpan: number; cSpan: number } | null>(null);

  // Editing trend card properties
  const [editingTrendCard, setEditingTrendCard] = useState<TankCardData | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Init grid screen store on mount
  useEffect(() => {
    init();
  }, [init]);

  // Global simulator loop
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      tickSimulation();
    }, simulationSpeedMs);
    return () => clearInterval(interval);
  }, [isSimulating, simulationSpeedMs, tickSimulation]);

  const cards = activeScreen?.cards || [];
  const config: GridConfig = {
    screenName: activeScreen?.name || 'Dashboard de Tanques Industriais',
    rows: activeScreen?.rows || 8,
    cols: activeScreen?.cols || 8,
  };

  const handleConfirmNewScreen = (newConfig: GridConfig) => {
    createScreen(newConfig.screenName);
    updateActiveScreenConfig(newConfig.rows, newConfig.cols, newConfig.screenName);
    setSelectedCardId(null);
    setIsNewScreenModalOpen(false);
    showToast(`✓ Nova tela "${newConfig.screenName}" criada!`);
  };

  const handleConfirmChangeGrid = (newConfig: GridConfig) => {
    updateActiveScreenConfig(newConfig.rows, newConfig.cols, newConfig.screenName);
    setIsChangeGridModalOpen(false);
    showToast(`✓ Grade alterada para ${newConfig.rows}x${newConfig.cols}`);
  };

  const handleClearScreen = () => {
    if (cards.length === 0) return;
    if (window.confirm('Deseja realmente remover todos os cartões desta tela?')) {
      clearActiveScreenCards();
      setSelectedCardId(null);
      showToast('Tela limpa!');
    }
  };

  const handleAddCard = (sRow: number, sCol: number, rSpan: number, cSpan: number) => {
    setPendingAdd({ sRow, sCol, rSpan, cSpan });
  };

  const handleObjectSelected = (objectId: string) => {
    if (!pendingAdd) return;
    const { sRow, sCol, rSpan, cSpan } = pendingAdd;
    const newCard = buildCardFromObject(objectId, sRow, sCol, rSpan, cSpan);
    const filtered = cards.filter((c) => c.objectId !== objectId);
    updateActiveScreenCards([...filtered, newCard]);
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
      color: colors[idx % colors.length],
    }));

    const newCard: TankCardData = {
      id: `trend-${uuidv4()}`,
      tag: 'TENDÊNCIA',
      category: 'GRÁFICO',
      title:
        trendProps.length === 1
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
      trendProperties: trendProps,
    };

    updateActiveScreenCards([...cards, newCard]);
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
        color: existing?.color || colors[idx % colors.length],
      };
    });

    const updatedCard: TankCardData = {
      ...editingTrendCard,
      trendProperties: trendProps,
      title:
        trendProps.length === 1
          ? `Tendência de ${trendProps[0].label}`
          : `Gráfico de Tendência (${trendProps.length} var)`,
    };

    updateCard(updatedCard);
    setSelectedCardId(updatedCard.id);
    setEditingTrendCard(null);
    showToast(`✓ Gráfico de tendência atualizado`);
  };

  const handleUpdateCardPosition = (id: string, sRow: number, sCol: number, rSpan: number, cSpan: number) => {
    const updatedCards = cards.map((c) =>
      c.id === id ? { ...c, startRow: sRow, startCol: sCol, rowSpan: rSpan, colSpan: cSpan } : c
    );
    updateActiveScreenCards(updatedCards);
  };

  const handleDeleteCard = (id: string) => {
    deleteCardFromActiveScreen(id);
    if (selectedCardId === id) setSelectedCardId(null);
    showToast('Cartão removido');
  };

  const selectedCard = cards.find((c) => c.id === selectedCardId);
  const alreadySelectedObjectIds = cards.map((c) => c.objectId).filter((id): id is string => id != null);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-[#0b0c0e] text-slate-900 dark:text-slate-100 transition-colors">
      {!isViewMode && <HeaderNavigation />}

      {!isViewMode && (
        <GridDashboardHeader
          config={config}
          isViewMode={isViewMode}
          cardCount={cards.length}
          onOpenScreenManager={() => setIsScreenManagerOpen(true)}
          onRenameScreen={(newName) => {
            if (activeScreen) {
              renameScreen(activeScreen.id, newName);
              showToast(`✓ Tela renomeada para "${newName}"`);
            }
          }}
          onChangeGrid={() => setIsChangeGridModalOpen(true)}
          onClearScreen={handleClearScreen}
          onToggleMode={() => {
            toggleViewMode();
            setSelectedCardId(null);
          }}
        />
      )}

      {isViewMode && (
        <button
          onClick={() => {
            toggleViewMode();
            setSelectedCardId(null);
          }}
          className="fixed top-4 right-4 z-50 py-2 px-3.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-2 border border-amber-600 shadow-md ring-2 ring-amber-500/20 hover:scale-105 transition-all cursor-pointer"
          title="Voltar para o Modo de Edição"
        >
          <Edit3 className="w-4 h-4" />
          <span>Voltar para Edição</span>
        </button>
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900/90 dark:bg-slate-100/90 text-white dark:text-slate-900 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl z-50 flex items-center gap-2 border border-slate-700 dark:border-slate-300 animate-in fade-in-50 slide-in-from-bottom-2 duration-200">
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
            onExpandTrend={(card) => setExpandedTrendCard(card)}
          />
        </div>

        {!isViewMode && selectedCard && (
          <GridCardInspector
            card={selectedCard}
            onClose={() => setSelectedCardId(null)}
            onUpdateCard={(updated) => updateCard(updated)}
            onDeleteCard={handleDeleteCard}
            onEditTrendVariables={() => setEditingTrendCard(selectedCard)}
          />
        )}
      </div>

      <GridScreenManagerModal
        isOpen={isScreenManagerOpen}
        onClose={() => setIsScreenManagerOpen(false)}
      />

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

      <TrendChartExpandedModal
        isOpen={expandedTrendCard !== null}
        card={expandedTrendCard}
        onClose={() => setExpandedTrendCard(null)}
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
