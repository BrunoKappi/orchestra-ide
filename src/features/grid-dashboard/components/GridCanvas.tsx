import React, { useState, useRef, useEffect } from 'react';
import type { TankCardData, GridConfig } from '../types';
import { IndustrialTankCard } from './IndustrialTankCard';
import { TrendChartCard } from './TrendChartCard';
import { cn } from '../../../utils/cn';

interface GridCanvasProps {
  config: GridConfig;
  cards: TankCardData[];
  selectedCardId: string | null;
  isViewMode: boolean;
  onSelectCard: (id: string | null) => void;
  onAddCard: (startRow: number, startCol: number, rowSpan: number, colSpan: number) => void;
  onUpdateCardPosition: (id: string, startRow: number, startCol: number, rowSpan: number, colSpan: number) => void;
}

interface CellPos {
  r: number; // 1-indexed
  c: number; // 1-indexed
}

export const GridCanvas: React.FC<GridCanvasProps> = ({
  config,
  cards,
  selectedCardId,
  isViewMode,
  onSelectCard,
  onAddCard,
  onUpdateCardPosition,
}) => {
  const { rows, cols } = config;
  const containerRef = useRef<HTMLDivElement>(null);

  // Selection state for adding new card
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<CellPos | null>(null);
  const [selectionCurrent, setSelectionCurrent] = useState<CellPos | null>(null);

  // Dragging card state for moving card
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<CellPos>({ r: 0, c: 0 }); // offset from card start
  const [dragTargetCell, setDragTargetCell] = useState<CellPos | null>(null);

  // Resizing card state
  const [resizingCardId, setResizingCardId] = useState<string | null>(null);
  const [resizeTargetSpan, setResizeTargetSpan] = useState<{ rowSpan: number; colSpan: number } | null>(null);

  // Helper: Check if cell overlaps with an existing card (optionally ignoring ignoreCardId)
  const isCellOccupied = (r: number, c: number, ignoreCardId?: string) => {
    return cards.some(card => {
      if (card.id === ignoreCardId) return false;
      const endR = card.startRow + card.rowSpan - 1;
      const endC = card.startCol + card.colSpan - 1;
      return r >= card.startRow && r <= endR && c >= card.startCol && c <= endC;
    });
  };

  // Helper: Check if range overlaps with existing cards
  const isRangeOccupied = (
    sRow: number,
    sCol: number,
    rSpan: number,
    cSpan: number,
    ignoreCardId?: string
  ) => {
    const eRow = sRow + rSpan - 1;
    const eCol = sCol + cSpan - 1;

    // Check bounds
    if (sRow < 1 || sCol < 1 || eRow > rows || eCol > cols) return true;

    return cards.some(card => {
      if (card.id === ignoreCardId) return false;
      const cardEndRow = card.startRow + card.rowSpan - 1;
      const cardEndCol = card.startCol + card.colSpan - 1;

      return !(
        sRow > cardEndRow ||
        eRow < card.startRow ||
        sCol > cardEndCol ||
        eCol < card.startCol
      );
    });
  };

  // Calculate grid cell under pointer
  const getCellFromEvent = (e: React.MouseEvent | MouseEvent): CellPos | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;

    const cellWidth = rect.width / cols;
    const cellHeight = rect.height / rows;

    const c = Math.min(cols, Math.max(1, Math.floor(x / cellWidth) + 1));
    const r = Math.min(rows, Math.max(1, Math.floor(y / cellHeight) + 1));

    return { r, c };
  };

  // Mouse handlers for selection (Adding new card)
  const handleMouseDownCell = (r: number, c: number, e: React.MouseEvent) => {
    if (isViewMode) return;
    // If clicking on an empty area (not a card)
    if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.gridCell) {
      if (isCellOccupied(r, c)) return;
      onSelectCard(null);
      setIsSelecting(true);
      setSelectionStart({ r, c });
      setSelectionCurrent({ r, c });
    }
  };

  const handleMouseEnterCell = (r: number, c: number) => {
    if (isSelecting && selectionStart) {
      setSelectionCurrent({ r, c });
    }
  };

  useEffect(() => {
    const handleMouseUpGlobal = () => {
      if (isSelecting && selectionStart && selectionCurrent) {
        const sRow = Math.min(selectionStart.r, selectionCurrent.r);
        const eRow = Math.max(selectionStart.r, selectionCurrent.r);
        const sCol = Math.min(selectionStart.c, selectionCurrent.c);
        const eCol = Math.max(selectionStart.c, selectionCurrent.c);

        const rSpan = eRow - sRow + 1;
        const cSpan = eCol - sCol + 1;

        if (!isRangeOccupied(sRow, sCol, rSpan, cSpan)) {
          onAddCard(sRow, sCol, rSpan, cSpan);
        }

        setIsSelecting(false);
        setSelectionStart(null);
        setSelectionCurrent(null);
      }

      // Finish Dragging Card
      if (draggedCardId && dragTargetCell) {
        const card = cards.find(c => c.id === draggedCardId);
        if (card) {
          const targetSRow = Math.max(1, Math.min(rows - card.rowSpan + 1, dragTargetCell.r - dragOffset.r));
          const targetSCol = Math.max(1, Math.min(cols - card.colSpan + 1, dragTargetCell.c - dragOffset.c));

          if (!isRangeOccupied(targetSRow, targetSCol, card.rowSpan, card.colSpan, card.id)) {
            onUpdateCardPosition(card.id, targetSRow, targetSCol, card.rowSpan, card.colSpan);
          }
        }
        setDraggedCardId(null);
        setDragTargetCell(null);
      }

      // Finish Resizing Card
      if (resizingCardId && resizeTargetSpan) {
        const card = cards.find(c => c.id === resizingCardId);
        if (card) {
          if (!isRangeOccupied(card.startRow, card.startCol, resizeTargetSpan.rowSpan, resizeTargetSpan.colSpan, card.id)) {
            onUpdateCardPosition(card.id, card.startRow, card.startCol, resizeTargetSpan.rowSpan, resizeTargetSpan.colSpan);
          }
        }
        setResizingCardId(null);
        setResizeTargetSpan(null);
      }
    };

    window.addEventListener('mouseup', handleMouseUpGlobal);
    return () => window.removeEventListener('mouseup', handleMouseUpGlobal);
  }, [isSelecting, selectionStart, selectionCurrent, draggedCardId, dragTargetCell, resizingCardId, resizeTargetSpan, cards, rows, cols]);

  // Global mousemove for smooth drag & drop and resizing
  useEffect(() => {
    const handleMouseMoveGlobal = (e: MouseEvent) => {
      const cell = getCellFromEvent(e);
      if (!cell) return;

      if (draggedCardId) {
        setDragTargetCell(cell);
      }

      if (resizingCardId) {
        const card = cards.find(c => c.id === resizingCardId);
        if (card) {
          const newRSpan = Math.max(1, cell.r - card.startRow + 1);
          const newCSpan = Math.max(1, cell.c - card.startCol + 1);
          setResizeTargetSpan({ rowSpan: newRSpan, colSpan: newCSpan });
        }
      }
    };

    if (draggedCardId || resizingCardId) {
      window.addEventListener('mousemove', handleMouseMoveGlobal);
      return () => window.removeEventListener('mousemove', handleMouseMoveGlobal);
    }
  }, [draggedCardId, resizingCardId, cards]);

  // Selection box calculation
  let selBox = null;
  if (isSelecting && selectionStart && selectionCurrent) {
    const sRow = Math.min(selectionStart.r, selectionCurrent.r);
    const eRow = Math.max(selectionStart.r, selectionCurrent.r);
    const sCol = Math.min(selectionStart.c, selectionCurrent.c);
    const eCol = Math.max(selectionStart.c, selectionCurrent.c);

    const rSpan = eRow - sRow + 1;
    const cSpan = eCol - sCol + 1;
    const hasConflict = isRangeOccupied(sRow, sCol, rSpan, cSpan);

    selBox = {
      startRow: sRow,
      startCol: sCol,
      rowSpan: rSpan,
      colSpan: cSpan,
      hasConflict,
    };
  }

  // Drag ghost calculation
  let dragGhost = null;
  if (draggedCardId && dragTargetCell) {
    const card = cards.find(c => c.id === draggedCardId);
    if (card) {
      const targetSRow = Math.max(1, Math.min(rows - card.rowSpan + 1, dragTargetCell.r - dragOffset.r));
      const targetSCol = Math.max(1, Math.min(cols - card.colSpan + 1, dragTargetCell.c - dragOffset.c));
      const hasConflict = isRangeOccupied(targetSRow, targetSCol, card.rowSpan, card.colSpan, card.id);

      dragGhost = {
        startRow: targetSRow,
        startCol: targetSCol,
        rowSpan: card.rowSpan,
        colSpan: card.colSpan,
        hasConflict,
      };
    }
  }

  // Resize ghost calculation
  let resizeGhost = null;
  if (resizingCardId && resizeTargetSpan) {
    const card = cards.find(c => c.id === resizingCardId);
    if (card) {
      const hasConflict = isRangeOccupied(card.startRow, card.startCol, resizeTargetSpan.rowSpan, resizeTargetSpan.colSpan, card.id);
      resizeGhost = {
        startRow: card.startRow,
        startCol: card.startCol,
        rowSpan: resizeTargetSpan.rowSpan,
        colSpan: resizeTargetSpan.colSpan,
        hasConflict,
      };
    }
  }

  // Start Card Move Drag
  const handleStartCardDrag = (card: TankCardData, e: React.MouseEvent) => {
    if (isViewMode) return;
    e.stopPropagation();
    onSelectCard(card.id);

    const cell = getCellFromEvent(e);
    if (cell) {
      setDragOffset({
        r: cell.r - card.startRow,
        c: cell.c - card.startCol,
      });
      setDraggedCardId(card.id);
      setDragTargetCell(cell);
    }
  };

  // Start Card Resize Drag
  const handleStartResize = (card: TankCardData, e: React.MouseEvent) => {
    if (isViewMode) return;
    e.stopPropagation();
    onSelectCard(card.id);
    setResizingCardId(card.id);
    setResizeTargetSpan({ rowSpan: card.rowSpan, colSpan: card.colSpan });
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-6 overflow-auto">
      <div
        ref={containerRef}
        className={cn(
          "grid w-full h-full min-h-[550px] relative rounded-2xl transition-all duration-300 shadow-sm border p-2.5",
          isViewMode
            ? "bg-slate-100/80 dark:bg-[#0d0e12] border-transparent"
            : "bg-slate-50/80 dark:bg-[#111216] border-slate-200 dark:border-slate-800/80"
        )}
        style={{
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gap: '8px',
        }}
      >
        {/* Background Cell Lines (Only in Edit Mode) */}
        {!isViewMode &&
          Array.from({ length: rows }).map((_, rIdx) =>
            Array.from({ length: cols }).map((_, cIdx) => {
              const r = rIdx + 1;
              const c = cIdx + 1;
              const occupied = isCellOccupied(r, c);

              return (
                <div
                  key={`cell_${r}_${c}`}
                  data-grid-cell="true"
                  style={{ gridRow: r, gridColumn: c }}
                  onMouseDown={(e) => handleMouseDownCell(r, c, e)}
                  onMouseEnter={() => handleMouseEnterCell(r, c)}
                  className={cn(
                    "rounded-xl border border-dashed transition-colors flex items-center justify-center text-[10px] font-mono select-none",
                    occupied
                      ? "border-slate-200/40 dark:border-slate-800/40 bg-slate-100/20 dark:bg-slate-900/20"
                      : "border-slate-300/60 dark:border-slate-800/60 hover:bg-sky-500/5 hover:border-sky-400/40 cursor-crosshair"
                  )}
                />
              );
            })
          )}

        {/* Render Cards */}
        {cards.map((card) => {
          const isSelected = selectedCardId === card.id;
          const isBeingMoved = draggedCardId === card.id;

          return (
            <div
              key={card.id}
              style={{
                gridRow: `${card.startRow} / span ${card.rowSpan}`,
                gridColumn: `${card.startCol} / span ${card.colSpan}`,
              }}
              className={cn(
                "relative flex flex-col transition-opacity duration-200",
                isBeingMoved && "opacity-40"
              )}
            >
              {/* Tank Component or Trend Chart */}
              {card.isTrend ? (
                <TrendChartCard
                  card={card}
                  isSelected={isSelected}
                  isViewMode={isViewMode}
                  onClick={() => !isViewMode && onSelectCard(card.id)}
                />
              ) : (
                <IndustrialTankCard
                  card={card}
                  isSelected={isSelected}
                  isViewMode={isViewMode}
                  onClick={() => !isViewMode && onSelectCard(card.id)}
                />
              )}

              {/* Move Handle (Edit mode overlay when selected) */}
              {!isViewMode && isSelected && (
                <>
                  <div
                    onMouseDown={(e) => handleStartCardDrag(card, e)}
                    className="absolute top-2 right-2 px-2 py-0.5 rounded bg-sky-500 text-white text-[10px] font-semibold cursor-grab active:cursor-grabbing shadow-md flex items-center gap-1 z-20"
                    title="Arrastar cartão"
                  >
                    <span>✥ Arrasto</span>
                  </div>

                  {/* Resize Handle at Bottom-Right */}
                  <div
                    onMouseDown={(e) => handleStartResize(card, e)}
                    className="absolute bottom-1 right-1 w-5 h-5 bg-sky-500 hover:bg-sky-400 text-white rounded-md cursor-se-resize flex items-center justify-center z-30 shadow-md transition-transform hover:scale-110"
                    title="Redimensionar área"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-10 10M19 15l-4 4" />
                    </svg>
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* Selection Rect Highlight Overlay */}
        {selBox && (
          <div
            style={{
              gridRow: `${selBox.startRow} / span ${selBox.rowSpan}`,
              gridColumn: `${selBox.startCol} / span ${selBox.colSpan}`,
            }}
            className={cn(
              "rounded-xl border-2 border-dashed flex items-center justify-center p-2 z-30 transition-colors shadow-lg pointer-events-none",
              selBox.hasConflict
                ? "bg-red-500/20 border-red-500 text-red-600 dark:text-red-400 font-bold"
                : "bg-sky-500/20 border-sky-500 text-sky-600 dark:text-sky-400 font-bold"
            )}
          >
            <span className="text-xs font-mono bg-white/80 dark:bg-slate-900/80 px-2.5 py-1 rounded-md shadow-sm border border-current">
              {selBox.hasConflict ? "⚠️ Ocupado" : `+ Novo Cartão (${selBox.rowSpan}x${selBox.colSpan})`}
            </span>
          </div>
        )}

        {/* Drag Ghost Highlight Overlay */}
        {dragGhost && (
          <div
            style={{
              gridRow: `${dragGhost.startRow} / span ${dragGhost.rowSpan}`,
              gridColumn: `${dragGhost.startCol} / span ${dragGhost.colSpan}`,
            }}
            className={cn(
              "rounded-xl border-2 border-dashed flex items-center justify-center p-2 z-40 transition-colors pointer-events-none shadow-xl",
              dragGhost.hasConflict
                ? "bg-red-500/30 border-red-500 text-red-500"
                : "bg-emerald-500/30 border-emerald-500 text-emerald-600 dark:text-emerald-400"
            )}
          >
            <span className="text-xs font-mono bg-white/90 dark:bg-slate-900/90 px-2.5 py-1 rounded-md shadow-md">
              {dragGhost.hasConflict ? "⚠️ Posição Inválida" : "✓ Soltar Aqui"}
            </span>
          </div>
        )}

        {/* Resize Ghost Highlight Overlay */}
        {resizeGhost && (
          <div
            style={{
              gridRow: `${resizeGhost.startRow} / span ${resizeGhost.rowSpan}`,
              gridColumn: `${resizeGhost.startCol} / span ${resizeGhost.colSpan}`,
            }}
            className={cn(
              "rounded-xl border-2 border-dashed flex items-center justify-center p-2 z-40 transition-colors pointer-events-none shadow-xl",
              resizeGhost.hasConflict
                ? "bg-red-500/30 border-red-500 text-red-500"
                : "bg-sky-500/30 border-sky-500 text-sky-400"
            )}
          >
            <span className="text-xs font-mono bg-white/90 dark:bg-slate-900/90 px-2.5 py-1 rounded-md shadow-md">
              {resizeGhost.hasConflict ? "⚠️ Conflito no Redimensionamento" : `Resize: ${resizeGhost.rowSpan}x${resizeGhost.colSpan}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
