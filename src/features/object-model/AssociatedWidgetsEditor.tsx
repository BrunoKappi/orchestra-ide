import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Plus,
  Grid,
  List,
  Edit2,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { useObjectModelStore } from '../../store/useObjectModelStore';
import { useWidgetStore } from '../../store/useWidgetStore';
import { WidgetMappingModal } from './WidgetMappingModal';
import { Modal } from '../../components/ui/Modal';
import type { MergedAssociatedWidget, WidgetEntity } from '../../types/domain';
import { cn } from '../../utils/cn';

// Simple Scaled SVG preview of a Widget
export const WidgetThumbnail: React.FC<{ widget: WidgetEntity; className?: string }> = ({
  widget,
  className,
}) => {
  return (
    <svg
      viewBox={`0 0 ${widget.canvasWidth || 400} ${widget.canvasHeight || 300}`}
      className={cn("bg-slate-900 border border-slate-800 rounded-lg overflow-hidden select-none pointer-events-none w-full h-full", className)}
      style={{ backgroundColor: widget.backgroundColor || '#0f172a' }}
    >
      {widget.elements.map((elem) => {
        const cx = elem.x + elem.width / 2;
        const cy = elem.y + elem.height / 2;

        switch (elem.type) {
          case 'rectangle':
            return (
              <rect
                key={elem.id}
                x={elem.x}
                y={elem.y}
                width={elem.width}
                height={elem.height}
                fill={elem.fill}
                stroke={elem.stroke}
                strokeWidth={elem.strokeWidth}
                rx={elem.cornerRadius || 0}
                ry={elem.cornerRadius || 0}
              />
            );
          case 'circle':
            return (
              <ellipse
                key={elem.id}
                cx={cx}
                cy={cy}
                rx={elem.width / 2}
                ry={elem.height / 2}
                fill={elem.fill}
                stroke={elem.stroke}
                strokeWidth={elem.strokeWidth}
              />
            );
          case 'line':
            return (
              <line
                key={elem.id}
                x1={elem.x}
                y1={elem.y}
                x2={elem.x + elem.width}
                y2={elem.y + elem.height}
                stroke={elem.stroke}
                strokeWidth={elem.strokeWidth}
              />
            );
          case 'text':
          case 'variable_display':
            return (
              <g key={elem.id}>
                {elem.type === 'variable_display' && (
                  <rect
                    x={elem.x}
                    y={elem.y}
                    width={elem.width}
                    height={elem.height}
                    fill={elem.fill || '#0f172a'}
                    stroke={elem.stroke || '#0ea5e9'}
                    strokeWidth={elem.strokeWidth || 1.5}
                    rx={elem.cornerRadius || 6}
                    ry={elem.cornerRadius || 6}
                  />
                )}
                <text
                  x={elem.type === 'variable_display' ? cx : elem.x}
                  y={elem.y + elem.height / 1.5}
                  fill={elem.textColor || '#ffffff'}
                  fontSize={elem.fontSize || 12}
                  fontWeight="bold"
                  fontFamily="monospace, sans-serif"
                  textAnchor={elem.type === 'variable_display' ? 'middle' : 'start'}
                >
                  {elem.textContent || elem.name}
                </text>
              </g>
            );
          case 'status_light':
            return (
              <g key={elem.id}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={Math.min(elem.width, elem.height) / 2}
                  fill="#1e293b"
                  stroke={elem.stroke || '#38bdf8'}
                  strokeWidth={elem.strokeWidth || 2}
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r={Math.min(elem.width, elem.height) / 2.6}
                  fill={elem.fill || '#22c55e'}
                />
              </g>
            );
          case 'tank':
            return (
              <g key={elem.id}>
                <rect
                  x={elem.x}
                  y={elem.y}
                  width={elem.width}
                  height={elem.height}
                  fill={elem.fill || '#1e293b'}
                  stroke={elem.stroke || '#0284c7'}
                  strokeWidth={elem.strokeWidth || 2}
                  rx={8}
                  ry={8}
                />
                <rect
                  x={elem.x + 4}
                  y={elem.y + elem.height * 0.4}
                  width={elem.width - 8}
                  height={elem.height * 0.6 - 4}
                  fill={elem.stroke || '#0284c7'}
                  opacity="0.6"
                  rx={4}
                  ry={4}
                />
              </g>
            );
          case 'gauge':
            return (
              <g key={elem.id}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={Math.min(elem.width, elem.height) / 2}
                  fill={elem.fill || '#1e293b'}
                  stroke={elem.stroke || '#f59e0b'}
                  strokeWidth={elem.strokeWidth || 2}
                />
                <line
                  x1={cx}
                  y1={cy}
                  x2={cx + (elem.width / 2.5) * Math.cos(-Math.PI / 4)}
                  y2={cy + (elem.height / 2.5) * Math.sin(-Math.PI / 4)}
                  stroke={elem.stroke || '#f59e0b'}
                  strokeWidth={2}
                />
              </g>
            );
          case 'image':
            return elem.imageUri ? (
              <image
                key={elem.id}
                href={elem.imageUri}
                x={elem.x}
                y={elem.y}
                width={elem.width}
                height={elem.height}
                preserveAspectRatio="none"
              />
            ) : (
              <rect
                key={elem.id}
                x={elem.x}
                y={elem.y}
                width={elem.width}
                height={elem.height}
                fill="transparent"
                stroke="#64748b"
                strokeWidth={1}
                strokeDasharray="4,4"
              />
            );
          default:
            return null;
        }
      })}
    </svg>
  );
};

export const AssociatedWidgetsEditor: React.FC = () => {
  const {
    mergedAssociatedWidgets,
    associateWidget,
    disassociateWidget,
  } = useObjectModelStore();

  const { widgets, init: initWidgets } = useWidgetStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mapping Modal State
  const [mappingAssoc, setMappingAssoc] = useState<MergedAssociatedWidget | null>(null);
  const [isMappingOpen, setIsMappingOpen] = useState(false);

  // Association Selection Modal State
  const [isAssociateModalOpen, setIsAssociateModalOpen] = useState(false);
  const [assocSearch, setAssocSearch] = useState('');
  const [assocViewMode, setAssocViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    initWidgets();
  }, [initWidgets]);

  const handleOpenMapping = (assoc: MergedAssociatedWidget) => {
    setMappingAssoc(assoc);
    setIsMappingOpen(true);
  };

  const handleOpenAssociateModal = () => {
    setAssocSearch('');
    setIsAssociateModalOpen(true);
  };

  const handleAssociate = (widgetId: string) => {
    associateWidget(widgetId);
    setIsAssociateModalOpen(false);

    // After associating, find the newly created association and open mappings for it!
    setTimeout(() => {
      const storeState = useObjectModelStore.getState();
      const newAssoc = storeState.mergedAssociatedWidgets.find(
        (aw) => aw.widgetId === widgetId && !aw.isInherited
      );
      if (newAssoc) {
        handleOpenMapping(newAssoc);
      }
    }, 50);
  };

  const filteredAssociated = mergedAssociatedWidgets.filter((aw) => {
    const q = searchQuery.toLowerCase();
    const widgetName = aw.widgetName.toLowerCase();
    const sourceTemplate = (aw.sourceTemplateName || '').toLowerCase();
    return widgetName.includes(q) || sourceTemplate.includes(q);
  });

  const availableWidgets = widgets.filter((w) => {
    const q = assocSearch.toLowerCase();
    return (
      w.name.toLowerCase().includes(q) || (w.description || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-6">
      <div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Componentes Gráficos Associados (Widgets)</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          Associação e mapeamento de componentes gráficos locais para este objeto.
        </p>
      </div>

      {/* Top action bar */}
      <div className="flex items-center justify-between gap-4 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search associated graphics..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-950 dark:text-slate-50"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Grid/List */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all",
                viewMode === 'grid' && "bg-white dark:bg-slate-700 shadow-xs text-sky-600 dark:text-sky-400"
              )}
              title="Grid View (Thumbnails)"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all",
                viewMode === 'list' && "bg-white dark:bg-slate-700 shadow-xs text-sky-600 dark:text-sky-400"
              )}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleOpenAssociateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Associate Graphic</span>
          </button>
        </div>
      </div>

      {/* Main Grid/List Container */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1">
        {filteredAssociated.length > 0 ? (
          viewMode === 'grid' ? (
            /* GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAssociated.map((assoc) => {
                const wDetail = widgets.find((w) => w.id === assoc.widgetId);
                const mappedVarsCount = Object.keys(assoc.mappings || {}).length;
                const totalVarsCount = wDetail?.customProperties.length || 0;

                return (
                  <div
                    key={assoc.id}
                    className={cn(
                      "group border rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all flex flex-col border-slate-200 dark:border-slate-800",
                      assoc.isInherited && "border-slate-200/50 dark:border-slate-800/50 bg-slate-50/20 dark:bg-slate-900/10"
                    )}
                  >
                    {/* Scale Preview Thumbnail */}
                    <div className="h-44 bg-slate-950/60 dark:bg-slate-950 p-3 relative flex items-center justify-center border-b border-slate-100 dark:border-slate-800/40">
                      {wDetail ? (
                        <WidgetThumbnail widget={wDetail} className="h-full aspect-[4/3] max-w-full" />
                      ) : (
                        <div className="text-slate-500 text-[11px]">No Preview Available</div>
                      )}

                      {/* Top Overlay Badges */}
                      <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 max-w-[90%]">
                        {assoc.isInherited ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-sky-50/90 dark:bg-sky-950/90 text-sky-700 dark:text-sky-300 rounded border border-sky-100 dark:border-sky-800/60 text-[10px] font-mono">
                            <Layers className="w-3 h-3 text-sky-500" />
                            <span>Inherited: {assoc.sourceTemplateName}</span>
                          </span>
                        ) : assoc.isOverridden ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50/90 dark:bg-indigo-950/90 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-100 dark:border-indigo-800/60 text-[10px] font-mono">
                            <CheckCircle2 className="w-3 h-3 text-indigo-500" />
                            <span>Override</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50/90 dark:bg-emerald-950/90 text-emerald-700 dark:text-emerald-300 rounded border border-emerald-100 dark:border-emerald-800/60 text-[10px] font-mono">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Local</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meta Detail Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {assoc.widgetName}
                        </h4>
                        {wDetail?.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {wDetail.description}
                          </p>
                        )}
                      </div>

                      {/* Mapping completeness and Buttons */}
                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-3 text-[11px]">
                        <span className="text-slate-400 font-mono">
                          Mapped: <span className="font-semibold text-slate-700 dark:text-slate-200">{mappedVarsCount}/{totalVarsCount}</span> vars
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenMapping(assoc)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg transition-all"
                            title="Edit mappings"
                          >
                            <Edit2 className="w-3 h-3 text-slate-500" />
                            <span>Map</span>
                          </button>

                          {/* Only show delete if it is local (not inherited) OR if it is a local override */}
                          {(!assoc.isInherited || assoc.isOverridden) && (
                            <button
                              onClick={() => disassociateWidget(assoc.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 hover:text-rose-600 transition-colors"
                              title={assoc.isOverridden ? "Revert override to parent template mappings" : "Remove graphic association"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* LIST VIEW */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold">
                    <th className="p-3.5 w-1/3">Widget Name</th>
                    <th className="p-3.5 w-1/4">Source Origin</th>
                    <th className="p-3.5 w-1/6">Variables Mapped</th>
                    <th className="p-3.5 w-1/6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredAssociated.map((assoc) => {
                    const wDetail = widgets.find((w) => w.id === assoc.widgetId);
                    const mappedCount = Object.keys(assoc.mappings || {}).length;
                    const totalCount = wDetail?.customProperties.length || 0;

                    return (
                      <tr key={assoc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-2">
                            <span>{assoc.widgetName}</span>
                            {assoc.isOverridden && (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 text-[9px] font-semibold uppercase tracking-wider">
                                Override
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5">
                          {assoc.isInherited ? (
                            <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-mono">
                              <Layers className="w-3 h-3 text-sky-500" />
                              <span>Inherited ({assoc.sourceTemplateName})</span>
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Local</span>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-slate-500">
                          {mappedCount} / {totalCount} mapped
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenMapping(assoc)}
                              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                              title="Edit Mappings"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {(!assoc.isInherited || assoc.isOverridden) && (
                              <button
                                onClick={() => disassociateWidget(assoc.id)}
                                className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500"
                                title={assoc.isOverridden ? "Revert to parent" : "Delete Association"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl text-center text-slate-400">
            <Layers className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3" />
            <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">No Graphics Associated</h4>
            <p className="text-xs max-w-sm mt-1 mb-4 text-slate-500">
              Associate SCADA graphics widgets with this template/instance to visualize its properties in real time.
            </p>
            <button
              onClick={handleOpenAssociateModal}
              className="flex items-center gap-1.5 px-4.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Associate Graphic</span>
            </button>
          </div>
        )}
      </div>

      {/* 1. Modal for Mappings (Variables Bindings) */}
      <WidgetMappingModal
        isOpen={isMappingOpen}
        onClose={() => setIsMappingOpen(false)}
        association={mappingAssoc}
      />

      {/* 2. Modal for Selecting and Associating a Graphic/Widget */}
      <Modal
        isOpen={isAssociateModalOpen}
        onClose={() => setIsAssociateModalOpen(false)}
        title="Select Graphic Widget to Associate"
        subtitle="Search and select from the database of graphic widgets defined in your Widget Editor."
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={assocSearch}
                onChange={(e) => setAssocSearch(e.target.value)}
                placeholder="Search widgets by name..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-900 dark:text-slate-50"
              />
            </div>

            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800">
              <button
                onClick={() => setAssocViewMode('grid')}
                className={cn(
                  "p-1 rounded text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                  assocViewMode === 'grid' && "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs"
                )}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setAssocViewMode('list')}
                className={cn(
                  "p-1 rounded text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                  assocViewMode === 'list' && "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs"
                )}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-[350px] overflow-y-auto pr-1">
            {availableWidgets.length > 0 ? (
              assocViewMode === 'grid' ? (
                /* MODAL GRID VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableWidgets.map((w) => {
                    const isAlreadyAssociated = mergedAssociatedWidgets.some(
                      (aw) => aw.widgetId === w.id
                    );

                    return (
                      <div
                        key={w.id}
                        onDoubleClick={() => !isAlreadyAssociated && handleAssociate(w.id)}
                        className={cn(
                          "border rounded-xl bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-xs transition-all",
                          isAlreadyAssociated
                            ? "opacity-55 border-slate-200 dark:border-slate-800"
                            : "hover:border-sky-500/60 hover:shadow-md cursor-pointer"
                        )}
                      >
                        {/* SVG Preview */}
                        <div className="h-32 bg-slate-950 p-2 relative flex items-center justify-center border-b border-slate-100 dark:border-slate-850">
                          <WidgetThumbnail widget={w} className="h-full aspect-[4/3] max-w-full" />
                          {isAlreadyAssociated && (
                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center text-[10px] font-semibold text-slate-200 uppercase tracking-wider">
                              Already Associated
                            </div>
                          )}
                        </div>

                        {/* Detail text */}
                        <div className="p-3 flex-1 flex flex-col justify-between gap-3">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 truncate" title={w.name}>
                              {w.name}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                              {w.description || "No description provided."}
                            </p>
                          </div>

                          {!isAlreadyAssociated ? (
                            <button
                              onClick={() => handleAssociate(w.id)}
                              className="w-full py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-center transition-colors"
                            >
                              Associate
                            </button>
                          ) : (
                            <div className="w-full py-1 text-center text-slate-400 font-mono text-[10px]">
                              Mapped
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* MODAL LIST VIEW */
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                        <th className="p-3">Graphic Name</th>
                        <th className="p-3">Description</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {availableWidgets.map((w) => {
                        const isAlreadyAssociated = mergedAssociatedWidgets.some(
                          (aw) => aw.widgetId === w.id
                        );

                        return (
                          <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                            <td className="p-3 font-bold text-slate-950 dark:text-slate-50">
                              {w.name}
                            </td>
                            <td className="p-3 text-slate-400 max-w-xs truncate">
                              {w.description || "-"}
                            </td>
                            <td className="p-3 text-right">
                              {!isAlreadyAssociated ? (
                                <button
                                  onClick={() => handleAssociate(w.id)}
                                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-md"
                                >
                                  Associate
                                </button>
                              ) : (
                                <span className="text-slate-400 font-mono text-[10px]">Associated</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="p-8 text-center text-slate-400">
                No graphics widgets found. Create some in the Widget Editor.
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAssociateModalOpen(false)}
              className="px-4 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
