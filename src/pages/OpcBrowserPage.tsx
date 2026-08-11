import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Network,
  Search,
  ChevronDown,
  ChevronRight,
  Cpu,
  Database,
  Folder,
  Tag,
  Star,
  Plus,
  Trash2,
  Activity,
  Play,
  Pause,
  Info,
  Compass
} from 'lucide-react';
import { HeaderNavigation } from '../components/navigation/HeaderNavigation';
import { useOpcStore } from '../store/useOpcStore';
import type { OpcNodeEntity, OpcDataType, OpcNodeType, OpcQuality } from '../types/opc';
import { cn } from '../utils/cn';

export const OpcBrowserPage: React.FC = () => {
  const {
    nodes,
    searchQuery,
    selectedNodeId,
    expandedNodeIds,
    isSimulating,
    init,
    setSearchQuery,
    setSelectedNodeId,
    toggleFavorite,
    toggleNodeExpanded,
    expandAll,
    collapseAll,
    createNode,
    updateNode,
    deleteNode,
    toggleSimulation
  } = useOpcStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addNodeType, setAddNodeType] = useState<OpcNodeType>('server_ua');
  const [addName, setAddName] = useState('');
  const [addDataType, setAddDataType] = useState<OpcDataType>('Float');
  const [addUnit, setAddUnit] = useState('');
  const [addFreq, setAddFreq] = useState(1000);
  const [addDesc, setAddDesc] = useState('');
  const [addValue, setAddValue] = useState('');
  const [parentIdForNewNode, setParentIdForNewNode] = useState<string | null>(null);

  // Sparkline history for selected tag
  const [sparklineHistory, setSparklineHistory] = useState<number[]>([]);
  const lastValRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 176 });

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Run simulation in background
  useEffect(() => {
    init();
  }, [init]);

  // Simulation tick is handled globally by App.tsx


  // Handle selected tag history for sparkline
  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  const lastSelectedNodeIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedNode && selectedNode.type === 'tag') {
      const numVal = parseFloat(selectedNode.value || '0');
      if (!isNaN(numVal)) {
        setSparklineHistory((prev) => {
          if (lastSelectedNodeIdRef.current !== selectedNodeId) {
            lastSelectedNodeIdRef.current = selectedNodeId;
            return [numVal];
          }
          const next = [...prev, numVal];
          if (next.length > 30) next.shift();
          return next;
        });
      }
    } else {
      setSparklineHistory([]);
      lastSelectedNodeIdRef.current = selectedNodeId;
    }
  }, [selectedNode?.value, selectedNodeId]);

  // Flash highlight on changed value
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (selectedNode && selectedNode.type === 'tag') {
      if (lastValRef.current !== null && lastValRef.current !== selectedNode.value) {
        setFlash(true);
        const timer = setTimeout(() => setFlash(false), 500);
        lastValRef.current = selectedNode.value ?? null;
        return () => clearTimeout(timer);
      }
      lastValRef.current = selectedNode.value ?? null;
    }
  }, [selectedNode?.value]);

  // Filter nodes for search query
  const filteredNodes = useMemo(() => {
    if (!searchQuery) return nodes;
    
    // Find all nodes that match search criteria
    const matchingNodeIds = new Set<string>();
    const query = searchQuery.toLowerCase();
    
    nodes.forEach((n) => {
      if (
        n.name.toLowerCase().includes(query) ||
        (n.description && n.description.toLowerCase().includes(query)) ||
        n.path.toLowerCase().includes(query)
      ) {
        matchingNodeIds.add(n.id);
        
        // Add all ancestors to make sure it is visible in the tree
        let parentId = n.parentId;
        while (parentId) {
          matchingNodeIds.add(parentId);
          const parent = nodes.find((p) => p.id === parentId);
          parentId = parent ? parent.parentId : null;
        }
      }
    });

    return nodes.filter((n) => matchingNodeIds.has(n.id));
  }, [nodes, searchQuery]);

  // Group root nodes
  const rootNodes = useMemo(() => {
    return filteredNodes.filter((n) => n.parentId === null);
  }, [filteredNodes]);

  // Favorites list
  const favoriteTags = useMemo(() => {
    return nodes.filter((n) => n.type === 'tag' && n.isFavorite);
  }, [nodes]);

  const getNodeIcon = (type: OpcNodeType) => {
    switch (type) {
      case 'server_ua':
      case 'server_da':
        return <Database className="w-4 h-4 text-sky-500" />;
      case 'controller':
      case 'plc':
        return <Cpu className="w-4 h-4 text-emerald-500" />;
      case 'device':
      case 'area':
      case 'equipment':
        return <Network className="w-4 h-4 text-amber-500" />;
      case 'folder':
        return <Folder className="w-4 h-4 text-indigo-400" />;
      case 'tag':
        return <Tag className="w-3.5 h-3.5 text-violet-400" />;
    }
  };

  const getQualityColor = (quality?: OpcQuality) => {
    switch (quality) {
      case 'Good':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'Uncertain':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'Bad':
        return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'Communication Lost':
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
      default:
        return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  const handleDragStart = (e: React.DragEvent, node: OpcNodeEntity) => {
    e.dataTransfer.setData('opc/tag-ref', JSON.stringify({
      id: node.id,
      name: node.name,
      path: node.path,
      value: node.value,
      dataType: node.dataType,
      engineeringUnit: node.engineeringUnit,
      description: node.description
    }));

    // Compatible with screen designer variables dropping
    e.dataTransfer.setData('screen/variable-ref', JSON.stringify({
      objectId: 'OPC_VIRTUAL',
      propertyName: node.path
    }));

    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleOpenAddModal = (parentId: string | null, type: OpcNodeType) => {
    setParentIdForNewNode(parentId);
    setAddNodeType(type);
    setAddName('');
    setAddUnit('');
    setAddFreq(1000);
    setAddDesc('');
    setAddValue('');
    setIsAddModalOpen(true);
  };

  const handleCreateNodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) return;

    createNode({
      name: addName.trim(),
      type: addNodeType,
      parentId: parentIdForNewNode,
      dataType: addNodeType === 'tag' ? addDataType : undefined,
      engineeringUnit: addNodeType === 'tag' ? addUnit : undefined,
      updateFrequencyMs: addNodeType === 'tag' ? addFreq : undefined,
      description: addDesc.trim(),
      value: addNodeType === 'tag' ? addValue : undefined,
    });

    setIsAddModalOpen(false);
  };

  const renderTree = (node: OpcNodeEntity, depth: number) => {
    const isExpanded = expandedNodeIds.includes(node.id);
    const children = filteredNodes.filter((n) => n.parentId === node.id);
    const hasChildren = children.length > 0;
    const isSelected = selectedNodeId === node.id;

    return (
      <div key={node.id} className="select-none">
        <div
          onClick={() => setSelectedNodeId(node.id)}
          className={cn(
            'flex items-center gap-1.5 py-1 px-2 rounded-lg text-xs cursor-pointer group transition-all duration-150',
            isSelected
              ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold border-l-2 border-sky-500'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/40'
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          draggable={node.type === 'tag'}
          onDragStart={(e) => handleDragStart(e, node)}
        >
          {node.type !== 'tag' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNodeExpanded(node.id);
              }}
              className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          ) : (
            <span className="w-4.5 shrink-0" />
          )}

          {getNodeIcon(node.type)}
          <span className="truncate flex-1">{node.name}</span>

          {node.type === 'tag' && (
            <span className="text-[10px] opacity-75 font-mono bg-slate-100 dark:bg-slate-900/60 px-1 py-0.2 rounded font-normal max-w-[60px] truncate shrink-0">
              {node.value ?? '—'}
            </span>
          )}

          {/* Quick Actions hover menu */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 ml-1">
            {node.type !== 'tag' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Suggest suitable child type
                  const childType = node.type.includes('server')
                    ? 'area'
                    : node.type === 'area'
                    ? 'plc'
                    : 'tag';
                  handleOpenAddModal(node.id, childType);
                }}
                title="Adicionar Nó Filho"
                className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
            {node.type === 'tag' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(node.id);
                }}
                className={cn(
                  'p-0.5 rounded text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700',
                  node.isFavorite ? 'text-amber-500' : 'hover:text-amber-500'
                )}
                title={node.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Deseja realmente excluir "${node.name}" e todos os sub-itens?`)) {
                  deleteNode(node.id);
                  if (selectedNodeId === node.id) setSelectedNodeId(null);
                }
              }}
              title="Excluir"
              className="p-0.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {node.type !== 'tag' && isExpanded && hasChildren && (
          <div className="mt-0.5">
            {children.map((child) => renderTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <HeaderNavigation />

      {/* Main content grid */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT COLUMN: Tree & Search */}
        <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex flex-col shrink-0">
          
          {/* Header toolbar */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Network className="w-4 h-4 text-sky-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">OPC Network</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => toggleSimulation()}
                title={isSimulating ? 'Pausar Simulador' : 'Iniciar Simulador'}
                className={cn(
                  'p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors duration-150',
                  isSimulating
                    ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/35 text-amber-600 dark:text-amber-400'
                    : 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/35 text-emerald-600 dark:text-emerald-400'
                )}
              >
                {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => handleOpenAddModal(null, 'server_ua')}
                title="Novo Servidor OPC UA"
                className="p-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-b border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar tag, desc ou path..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          {/* Tree Control Buttons */}
          <div className="px-3 py-1.5 border-b border-slate-150 dark:border-slate-800/40 flex gap-2 text-[10px] text-slate-500">
            <button onClick={expandAll} className="hover:text-sky-500 font-semibold transition-colors">Expandir Tudo</button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button onClick={collapseAll} className="hover:text-sky-500 font-semibold transition-colors">Recolher Tudo</button>
          </div>

          {/* Favorites widget list */}
          {favoriteTags.length > 0 && (
            <div className="border-b border-slate-200 dark:border-slate-800 max-h-40 overflow-y-auto flex flex-col bg-amber-50/20 dark:bg-amber-950/5">
              <div className="px-3 py-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400/80 flex items-center gap-1.5">
                <Star className="w-3 h-3 fill-current" />
                <span>TAGS FAVORITAS</span>
              </div>
              <div className="px-1.5 pb-2 space-y-0.5">
                {favoriteTags.map((t) => (
                  <div
                    key={`fav-${t.id}`}
                    onClick={() => setSelectedNodeId(t.id)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, t)}
                    className={cn(
                      'flex items-center justify-between px-2 py-1 rounded text-xs cursor-pointer border border-transparent hover:border-amber-200 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition-all duration-150',
                      selectedNodeId === t.id && 'bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium'
                    )}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Tag className="w-3 h-3 text-amber-500" />
                      <span className="truncate max-w-[150px] font-mono text-[11px]">{t.name}</span>
                    </div>
                    <span className="font-mono text-[10px] opacity-80 bg-white dark:bg-slate-900/60 px-1 py-0.1 border border-slate-100 dark:border-slate-850 rounded">
                      {t.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hierarchical Tree Container */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {rootNodes.length > 0 ? (
              rootNodes.map((rn) => renderTree(rn, 0))
            ) : (
              <div className="text-center py-12 text-slate-400 dark:text-slate-600 text-xs">
                Nenhum nó encontrado.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Details & Monitor */}
        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950/20 overflow-y-auto p-6">
          
          {selectedNode ? (
            <div className="flex flex-col gap-6 max-w-4xl w-full mx-auto">
              
              {/* Node Summary Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-sky-500/10 rounded-xl">
                    {getNodeIcon(selectedNode.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">{selectedNode.name}</h2>
                      {selectedNode.type === 'tag' && (
                        <button
                          onClick={() => toggleFavorite(selectedNode.id)}
                          className={cn(
                            'p-1 rounded-full border border-slate-200 dark:border-slate-800 transition-colors',
                            selectedNode.isFavorite ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'text-slate-400 hover:text-amber-500'
                          )}
                        >
                          <Star className={cn('w-3.5 h-3.5', selectedNode.isFavorite && 'fill-current')} />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 mt-1 select-all">{selectedNode.path}</p>
                    {selectedNode.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{selectedNode.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 capitalize">
                    {selectedNode.type.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Tag Details Panel */}
              {selectedNode.type === 'tag' && (
                <>
                  {/* Real-time Display Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    
                    {/* Live Value Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[100px]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Valor Atual</span>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className={cn(
                          'text-3xl font-extrabold font-mono transition-all duration-300',
                          flash ? 'text-sky-500 scale-105' : 'text-slate-950 dark:text-white'
                        )}>
                          {selectedNode.value}
                        </span>
                        {selectedNode.engineeringUnit && (
                          <span className="text-xs text-slate-400 font-semibold">{selectedNode.engineeringUnit}</span>
                        )}
                      </div>
                      <div className="absolute top-3 right-3 flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
                      </div>
                    </div>

                    {/* Quality Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col justify-between min-h-[100px]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Qualidade</span>
                      <div className="mt-2">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border font-sans',
                          getQualityColor(selectedNode.quality)
                        )}>
                          {selectedNode.quality || 'Good'}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400">Atualizado dinamicamente</span>
                    </div>

                    {/* DataType Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col justify-between min-h-[100px]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Tipo de Dado</span>
                      <span className="text-lg font-bold font-mono text-slate-700 dark:text-slate-300 mt-2">{selectedNode.dataType || 'Float'}</span>
                      <span className="text-[9px] text-slate-400">Formato interno OPC</span>
                    </div>

                    {/* Update Frequency Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col justify-between min-h-[100px]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Frequência</span>
                      <span className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-2">{(selectedNode.updateFrequencyMs || 1000) / 1000}s</span>
                      <span className="text-[9px] text-slate-400">Ciclo de leitura OPC</span>
                    </div>

                  </div>

                  {/* Sparkline Trend Graphic */}
                  {selectedNode.dataType === 'Float' && sparklineHistory.length > 1 && (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-violet-500" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Tendência em Tempo Real</h3>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">Últimas {sparklineHistory.length} leituras</span>
                      </div>

                      {/* SVG Line Chart */}
                      <div ref={containerRef} className="h-44 w-full bg-slate-50 dark:bg-slate-950/40 rounded-lg p-2 relative">
                        <svg className="w-full h-full overflow-visible">
                          <defs>
                            <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Draw Gridlines */}
                          <line x1="0" y1={dimensions.height * 0.25} x2={dimensions.width} y2={dimensions.height * 0.25} stroke="rgba(100,116,139,0.08)" strokeWidth="1" />
                          <line x1="0" y1={dimensions.height * 0.5} x2={dimensions.width} y2={dimensions.height * 0.5} stroke="rgba(100,116,139,0.08)" strokeWidth="1" />
                          <line x1="0" y1={dimensions.height * 0.75} x2={dimensions.width} y2={dimensions.height * 0.75} stroke="rgba(100,116,139,0.08)" strokeWidth="1" />

                          {(() => {
                            const minVal = Math.min(...sparklineHistory) * 0.95;
                            const maxVal = Math.max(...sparklineHistory) * 1.05;
                            const diff = maxVal - minVal || 1;

                            const paddingX = 10;
                            const paddingY = 10;
                            const chartWidth = dimensions.width - paddingX * 2;
                            const chartHeight = dimensions.height - paddingY * 2;

                            const points = sparklineHistory.map((val, idx) => {
                              const x = paddingX + (idx / (sparklineHistory.length - 1)) * chartWidth;
                              const y = paddingY + chartHeight - ((val - minVal) / diff) * chartHeight;
                              return `${x},${y}`;
                            }).join(' ');

                            const areaPoints = `${paddingX},${dimensions.height} ${points} ${dimensions.width - paddingX},${dimensions.height}`;

                            const lastIdx = sparklineHistory.length - 1;
                            const lastX = paddingX + (lastIdx / (sparklineHistory.length - 1)) * chartWidth;
                            const lastY = paddingY + chartHeight - ((sparklineHistory[lastIdx] - minVal) / diff) * chartHeight;

                            return (
                              <>
                                <polyline fill="url(#sparkline-grad)" points={areaPoints} />
                                <polyline fill="none" stroke="#8b5cf6" strokeWidth="2.5" points={points} strokeLinecap="round" strokeLinejoin="round" />
                                {/* Pulsing last point */}
                                <circle cx={lastX} cy={lastY} r="4.5" fill="#8b5cf6" className="animate-pulse" />
                              </>
                            );
                          })()}
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Properties Table */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Atributos Estendidos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-850">
                        <span className="text-slate-400 font-semibold uppercase">Caminho OPC UA</span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium break-all select-all">{selectedNode.path}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-850">
                        <span className="text-slate-400 font-semibold uppercase">Último Timestamp</span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{selectedNode.timestamp ? new Date(selectedNode.timestamp).toLocaleTimeString() : '—'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-850">
                        <span className="text-slate-400 font-semibold uppercase">Vínculo de Integração</span>
                        <span className="text-slate-500 dark:text-slate-400">Arraste para propriedades</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-850">
                        <span className="text-slate-400 font-semibold uppercase">Unidade de Engenharia</span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{selectedNode.engineeringUnit || 'Ad-hoc'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Drag Info Banner */}
                  <div className="p-4 rounded-xl border border-sky-100 dark:border-sky-900/30 bg-sky-50/50 dark:bg-sky-950/20 text-xs text-sky-700 dark:text-sky-300 flex items-start gap-3">
                    <Info className="w-5 h-5 shrink-0 text-sky-500 mt-0.5" />
                    <div>
                      <p className="font-bold">Integração por Drag and Drop</p>
                      <p className="mt-1 leading-relaxed text-sky-600/90 dark:text-sky-300/80">
                        Esta tag pode ser arrastada e solta diretamente em propriedades de instâncias do Orquestra, no Canvas de Telas, no Painel do Historian ou em nós de Fluxograma para estabelecer vinculação instantânea.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Server / Device / Folder Details */}
              {selectedNode.type !== 'tag' && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Itens Sob Este Nó</h3>
                    <button
                      onClick={() => {
                        // Recommend next child type
                        const childType = selectedNode.type.includes('server')
                          ? 'area'
                          : selectedNode.type === 'area'
                          ? 'plc'
                          : 'tag';
                        handleOpenAddModal(selectedNode.id, childType);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Nó</span>
                    </button>
                  </div>

                  {(() => {
                    const children = nodes.filter((n) => n.parentId === selectedNode.id);
                    if (children.length === 0) {
                      return (
                        <p className="text-xs text-slate-400 py-4 text-center">Nenhum item cadastrado sob este nó.</p>
                      );
                    }

                    return (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
                        {children.map((child) => (
                          <div
                            key={child.id}
                            onClick={() => setSelectedNodeId(child.id)}
                            className="flex items-center justify-between py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/20 px-2 rounded-lg cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {getNodeIcon(child.type)}
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{child.name}</p>
                                <p className="text-[10px] text-slate-400 truncate">{child.path}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 capitalize">
                              {child.type.replace('_', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Configuration / Form to Edit Selected Node */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Configurar Nó</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    // Just updating description for now as proof of editability
                    alert('Nó atualizado com sucesso!');
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Nome do Nó</label>
                    <input
                      type="text"
                      value={selectedNode.name}
                      onChange={(e) => updateNode(selectedNode.id, { name: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Descrição</label>
                    <textarea
                      value={selectedNode.description || ''}
                      onChange={(e) => updateNode(selectedNode.id, { description: e.target.value })}
                      rows={2}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors resize-none"
                      placeholder="Descrição opcional..."
                    />
                  </div>
                  {selectedNode.type === 'tag' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Unidade de Engenharia</label>
                        <input
                          type="text"
                          value={selectedNode.engineeringUnit || ''}
                          onChange={(e) => updateNode(selectedNode.id, { engineeringUnit: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Frequência (ms)</label>
                        <input
                          type="number"
                          value={selectedNode.updateFrequencyMs || 1000}
                          onChange={(e) => updateNode(selectedNode.id, { updateFrequencyMs: parseInt(e.target.value) || 100 })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
                        />
                      </div>
                    </div>
                  )}
                </form>
              </div>

            </div>
          ) : (
            // Empty State Welcome Screen
            <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-6 shadow-xs">
                <Compass className="w-10 h-10 text-sky-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">OPC Network Explorer</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm leading-relaxed">
                Navegue pelas redes OPC UA e OPC DA, visualize variáveis industriais em tempo real, crie novos simuladores ou arraste tags para mapear aos objetos do Orquestra.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* CREATE NODE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden p-5 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 uppercase">
              Novo Nó OPC ({addNodeType.replace('_', ' ')})
            </h3>
            
            <form onSubmit={handleCreateNodeSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Nome do Nó</label>
                <input
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Ex: TE_204, PLC_03, Vapor_Area"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              {addNodeType === 'tag' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Tipo de Dado</label>
                      <select
                        value={addDataType}
                        onChange={(e) => setAddDataType(e.target.value as OpcDataType)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-2 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
                      >
                        <option value="Float">Float (Analógico)</option>
                        <option value="Integer">Integer (Inteiro)</option>
                        <option value="Boolean">Boolean (Digital)</option>
                        <option value="String">String (Texto)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Valor Inicial</label>
                      <input
                        type="text"
                        value={addValue}
                        onChange={(e) => setAddValue(e.target.value)}
                        placeholder="Ex: 0, true, NORMAL"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Unidade Eng.</label>
                      <input
                        type="text"
                        value={addUnit}
                        onChange={(e) => setAddUnit(e.target.value)}
                        placeholder="Ex: °C, bar, %"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Frequência (ms)</label>
                      <input
                        type="number"
                        value={addFreq}
                        onChange={(e) => setAddFreq(parseInt(e.target.value) || 1000)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Descrição</label>
                <textarea
                  value={addDesc}
                  onChange={(e) => setAddDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors resize-none"
                  placeholder="Descrição opcional..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold cursor-pointer transition-colors shadow-sm"
                >
                  Salvar Nó
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
