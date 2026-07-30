import { useState, useEffect } from 'react';
import { HeaderNavigation } from '../components/navigation/HeaderNavigation';
import type { GridConfig, TankCardData, GridLayoutState } from '../features/grid-dashboard/types';
import { generateRandomTankCard } from '../features/grid-dashboard/utils/mockGenerator';
import { GridCanvas } from '../features/grid-dashboard/components/GridCanvas';
import { GridDashboardHeader } from '../features/grid-dashboard/components/GridDashboardHeader';
import { GridCardInspector } from '../features/grid-dashboard/components/GridCardInspector';
import { GridSettingsModal } from '../features/grid-dashboard/components/GridSettingsModal';

const STORAGE_KEY = 'grid_dashboard_layout';

export const GridDashboardPage = () => {
  // Config & Cards State
  const [config, setConfig] = useState<GridConfig>({
    screenName: 'Dashboard de Tanques Industriais',
    rows: 8,
    cols: 8,
  });

  const [cards, setCards] = useState<TankCardData[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // Modals state
  const [isNewScreenModalOpen, setIsNewScreenModalOpen] = useState(false);
  const [isChangeGridModalOpen, setIsChangeGridModalOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Initialize or load from localStorage on mount
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
        console.error("Erro ao carregar layout salvo do localStorage:", e);
      }
    }

    // Default Initial Cards if nothing saved
    const initialCard1 = generateRandomTankCard(1, 1, 3, 3, 0);
    const initialCard2 = generateRandomTankCard(1, 4, 3, 3, 1);
    const initialCard3 = generateRandomTankCard(4, 1, 3, 3, 2);
    setCards([initialCard1, initialCard2, initialCard3]);
  }, []);

  // Save to localStorage
  const handleSaveLayout = () => {
    const data: GridLayoutState = {
      config,
      cards,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    showToast("✓ Layout salvo com sucesso no localStorage!");
  };

  // Load from localStorage
  const handleLoadLayout = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: GridLayoutState = JSON.parse(saved);
        if (parsed.config && Array.isArray(parsed.cards)) {
          setConfig(parsed.config);
          setCards(parsed.cards);
          setSelectedCardId(null);
          showToast("✓ Layout recarregado do localStorage!");
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    showToast("⚠️ Nenhum layout salvo encontrado no localStorage.");
  };

  // Create New Screen
  const handleConfirmNewScreen = (newConfig: GridConfig) => {
    setConfig(newConfig);
    setCards([]);
    setSelectedCardId(null);
    showToast(`Nova tela "${newConfig.screenName}" criada!`);
  };

  // Change Grid Dimensions
  const handleConfirmChangeGrid = (newConfig: GridConfig) => {
    setConfig(newConfig);
    // Filter out cards that are outside new bounds
    const filteredCards = cards.filter(
      c => c.startRow <= newConfig.rows && c.startCol <= newConfig.cols
    );
    setCards(filteredCards);
    showToast(`Tamanho da grade alterado para ${newConfig.rows}x${newConfig.cols}`);
  };

  // Clear Screen
  const handleClearScreen = () => {
    if (cards.length === 0) return;
    if (window.confirm("Deseja realmente remover todos os cartões da tela?")) {
      setCards([]);
      setSelectedCardId(null);
      showToast("Tela limpa!");
    }
  };

  // Add Card on Area Selection
  const handleAddCard = (sRow: number, sCol: number, rSpan: number, cSpan: number) => {
    const newCard = generateRandomTankCard(sRow, sCol, rSpan, cSpan, cards.length);
    setCards((prev) => [...prev, newCard]);
    setSelectedCardId(newCard.id);
  };

  // Update Card Position or Size
  const handleUpdateCardPosition = (
    id: string,
    sRow: number,
    sCol: number,
    rSpan: number,
    cSpan: number
  ) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, startRow: sRow, startCol: sCol, rowSpan: rSpan, colSpan: cSpan }
          : c
      )
    );
  };

  // Update Card Properties
  const handleUpdateCard = (updatedCard: TankCardData) => {
    setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
  };

  // Delete Card
  const handleDeleteCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    if (selectedCardId === id) setSelectedCardId(null);
  };

  const selectedCard = cards.find((c) => c.id === selectedCardId);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-[#0b0c0e] text-slate-900 dark:text-slate-100 transition-colors">
      {/* App Header Navigation */}
      <HeaderNavigation />

      {/* Grid Dashboard Header Toolbar */}
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

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900/90 dark:bg-slate-100/90 text-white dark:text-slate-900 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl z-50 animate-fade-in flex items-center gap-2 border border-slate-700 dark:border-slate-300">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Canvas Center */}
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

        {/* Card Inspector Side Panel */}
        {!isViewMode && selectedCard && (
          <GridCardInspector
            card={selectedCard}
            onClose={() => setSelectedCardId(null)}
            onUpdateCard={handleUpdateCard}
            onDeleteCard={handleDeleteCard}
          />
        )}
      </div>

      {/* Modal Nova Tela */}
      <GridSettingsModal
        isOpen={isNewScreenModalOpen}
        initialConfig={{ screenName: 'Nova Tela de Dashboard', rows: 8, cols: 8 }}
        titleText="Nova Tela de Dashboard por Grade"
        onClose={() => setIsNewScreenModalOpen(false)}
        onConfirm={handleConfirmNewScreen}
      />

      {/* Modal Alterar Grade */}
      <GridSettingsModal
        isOpen={isChangeGridModalOpen}
        initialConfig={config}
        titleText="Alterar Dimensões da Grade"
        onClose={() => setIsChangeGridModalOpen(false)}
        onConfirm={handleConfirmChangeGrid}
      />
    </div>
  );
};
