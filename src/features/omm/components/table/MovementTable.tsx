import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  flexRender,
  type SortingState,
  type ColumnFiltersState,
  type GroupingState,
  type ExpandedState,
  type RowSelectionState,
  type VisibilityState,
} from '@tanstack/react-table';
import { useOmmStore } from '../../store/useOmmStore';
import type { MovementRow } from '../../types';
import { movementColumnDefs, DEFAULT_VISIBLE_COLUMNS } from './columnDefs';
import { ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { StatusBadge } from '../ui/OmmBadges';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ROW_HEIGHT = 34; // px — matches compact industrial table rows

// ---------------------------------------------------------------------------
// Group row renderer
// ---------------------------------------------------------------------------
const GroupRowRenderer: React.FC<{
  row: ReturnType<ReturnType<typeof useReactTable<MovementRow>>['getRowModel']>['rows'][0];
}> = ({ row }) => {
  const groupValue = String(row.groupingValue ?? '');
  const subRowCount = row.subRows.length;
  const activeCount = row.subRows.filter((r) => r.original.status === 'Active').length;

  return (
    <tr
      className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 cursor-pointer select-none"
      onClick={() => row.toggleExpanded()}
    >
      <td colSpan={100} className="px-3 py-1.5">
        <div className="flex items-center gap-2 text-[11px]">
          {row.getIsExpanded()
            ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          }
          <span className="font-bold text-slate-700 dark:text-slate-200">{groupValue || '(sem valor)'}</span>
          <span className="text-slate-400">—</span>
          <span className="text-slate-500">{subRowCount} movimentos</span>
          {activeCount > 0 && (
            <StatusBadge status="Active" size="xs" />
          )}
        </div>
      </td>
    </tr>
  );
};

// ---------------------------------------------------------------------------
// Main table component
// ---------------------------------------------------------------------------
export const MovementTable: React.FC = () => {
  const getMovementRows = useOmmStore((s) => s.getMovementRows);
  const movements = useOmmStore((s) => s.movements);
  const rows = useMemo(() => getMovementRows(), [getMovementRows, movements]);
  const selectedMovementId = useOmmStore((s) => s.selectedMovementId);
  const globalSearch = useOmmStore((s) => s.globalSearch);
  const tableGroupBy = useOmmStore((s) => s.tableGroupBy);
  const setSelectedMovement = useOmmStore((s) => s.setSelectedMovement);

  const [sorting, setSorting] = useState<SortingState>([{ id: 'status', desc: false }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [grouping, setGrouping] = useState<GroupingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>(true);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    Object.fromEntries(
      movementColumnDefs
        .map((c) => [c.id as string, DEFAULT_VISIBLE_COLUMNS.has(c.id as string)])
        .filter(([k]) => k)
    )
  );

  // Update grouping when store changes
  useEffect(() => {
    setGrouping(tableGroupBy ? [tableGroupBy] : []);
  }, [tableGroupBy]);

  // Auto-expand groups
  useEffect(() => {
    if (grouping.length > 0) setExpanded(true);
  }, [grouping]);

  const data = useMemo(() => {
    if (!globalSearch) return rows;
    const q = globalSearch.toLowerCase();
    return rows.filter((r) =>
      r.number.toLowerCase().includes(q) ||
      r.orderNumber.toLowerCase().includes(q) ||
      r.productName.toLowerCase().includes(q) ||
      r.areaName.toLowerCase().includes(q) ||
      r.originTag.toLowerCase().includes(q) ||
      r.destinationTag.toLowerCase().includes(q) ||
      r.operatorName.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q) ||
      r.movementTypeName.toLowerCase().includes(q)
    );
  }, [rows, globalSearch]);

  const table = useReactTable({
    data,
    columns: movementColumnDefs,
    state: { sorting, columnFilters, grouping, expanded, rowSelection, columnVisibility },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    enableRowSelection: true,
    enableMultiRowSelection: true,
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
  });

  const tableRows = table.getRowModel().rows;

  // Virtualization
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(500);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setContainerHeight(el.clientHeight);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const overscan = 5;
  const visibleStart = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - overscan);
  const visibleEnd = Math.min(tableRows.length, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + overscan);
  const visibleRows = tableRows.slice(visibleStart, visibleEnd);
  const paddingTop = visibleStart * ROW_HEIGHT;
  const paddingBottom = (tableRows.length - visibleEnd) * ROW_HEIGHT;

  const headers = table.getFlatHeaders();

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Row count */}
      <div className="flex items-center gap-3 px-4 py-1 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-[10px] text-slate-400 shrink-0">
        <span>{data.length} movimentos</span>
        {Object.keys(rowSelection).length > 0 && (
          <span className="text-sky-600 dark:text-sky-400 font-semibold">
            {Object.keys(rowSelection).length} selecionado(s)
          </span>
        )}
        {globalSearch && (
          <span className="text-amber-600 dark:text-amber-400">Filtrado por: "{globalSearch}"</span>
        )}
        {tableGroupBy && (
          <span className="text-violet-600 dark:text-violet-400">Agrupado por: {tableGroupBy}</span>
        )}
      </div>

      {/* Table scroll container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto"
        onScroll={handleScroll}
        style={{ contain: 'strict' }}
      >
        <table
          className="w-full border-collapse"
          style={{ minWidth: table.getTotalSize() }}
        >
          {/* Header */}
          <thead className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      style={{
                        width: header.getSize(),
                        position: 'relative',
                      }}
                      className="px-2 py-1.5 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-r border-slate-100 dark:border-slate-800 last:border-r-0 select-none whitespace-nowrap overflow-hidden"
                    >
                      <div
                        className={`flex items-center gap-1 ${canSort ? 'cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors' : ''}`}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span className="ml-0.5 shrink-0">
                            {sorted === 'asc' ? <ArrowUp className="w-2.5 h-2.5 text-sky-500" />
                              : sorted === 'desc' ? <ArrowDown className="w-2.5 h-2.5 text-sky-500" />
                              : <ArrowUpDown className="w-2.5 h-2.5 opacity-30" />
                            }
                          </span>
                        )}
                      </div>
                      {/* Resize handle */}
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-sky-400 transition-colors"
                          style={{ userSelect: 'none', touchAction: 'none' }}
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          {/* Body */}
          <tbody>
            {paddingTop > 0 && <tr><td style={{ height: paddingTop }} /></tr>}

            {visibleRows.map((row) => {
              if (row.getIsGrouped()) {
                return <GroupRowRenderer key={row.id} row={row} />;
              }

              const isSelected = row.original.id === selectedMovementId;
              const isActive = row.original.status === 'Active';

              return (
                <tr
                  key={row.id}
                  onClick={() => {
                    setSelectedMovement(row.original.id);
                  }}
                  className={`
                    border-b border-slate-100 dark:border-slate-800/60 cursor-pointer transition-colors
                    ${isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/30 border-l-2 border-l-sky-500'
                      : isActive
                      ? 'hover:bg-emerald-50/40 dark:hover:bg-emerald-950/10'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }
                  `}
                  style={{ height: ROW_HEIGHT }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{ width: cell.column.getSize(), maxWidth: cell.column.getSize() }}
                      className="px-2 py-0 border-r border-slate-100 dark:border-slate-800/60 last:border-r-0 overflow-hidden"
                    >
                      <div className="truncate">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}

            {paddingBottom > 0 && <tr><td style={{ height: paddingBottom }} /></tr>}

            {tableRows.length === 0 && (
              <tr>
                <td colSpan={headers.length} className="py-16 text-center">
                  <div className="text-slate-400 dark:text-slate-500 text-sm">Nenhum movimento encontrado</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
