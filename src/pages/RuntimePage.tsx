import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  Box,
  Folder,
  FolderOpen,
  FolderX,
  ChevronDown,
  ChevronRight,
  Zap,
  Play,
  Pause,
  ArrowUpDown,
  Cpu,
  FileCode,
  Layers,
  Database,
  Edit2,
  Check,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Columns,
  Grid,
  Bookmark,
  Plus,
  Trash2,
} from 'lucide-react';

import { HeaderNavigation } from '../components/navigation/HeaderNavigation';
import { useObjectModelStore } from '../store/useObjectModelStore';
import { inheritanceService } from '../services/InheritanceService';
import type { MergedProperty, DeploymentTreeNode } from '../types/domain';
import { cn } from '../utils/cn';
import { safeGetItem, safeSetItem } from '../utils/safeStorage';
import { TankTelemetryDashboard } from '../components/ui/TankTelemetryDashboard';

interface SavedView {
  id: string;
  name: string;
  objectIds: string[];
  createdAt: string;
}

export const RuntimePage: React.FC = () => {
  const {
    objects,
    templates,
    deploymentFolders,
    deploymentNodes,
    isSimulating,
    simulationSpeedMs,
    simulatedValues,
    toggleSimulation,
    tickSimulation,
    init: initObjectModel,
    updateSimulatedValue,
  } = useObjectModelStore();

  const [editingPropKey, setEditingPropKey] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');

  // Multi-selection state (MAX 2 items)
  const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([]);
  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  // Sidebar tabs state ('objects' or 'views')
  const [sidebarTab, setSidebarTab] = useState<'objects' | 'views'>('objects');

  // Saved views state with persistence
  const [savedViews, setSavedViews] = useState<SavedView[]>(() => {
    const raw = safeGetItem('runtime_saved_views');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    return [
      { id: 'view-1', name: 'Tanque 101 + Tanque 102', objectIds: ['obj_tank_101', 'obj_tank_102'], createdAt: new Date().toISOString() },
      { id: 'view-2', name: 'Esfera 301 + Tanque 103', objectIds: ['obj_sphere_301', 'obj_tank_103'], createdAt: new Date().toISOString() },
    ];
  });

  const [newViewName, setNewViewName] = useState('');
  const [editingViewId, setEditingViewId] = useState<string | null>(null);
  const [editingViewName, setEditingViewName] = useState('');

  const saveViewsToStorage = (views: SavedView[]) => {
    setSavedViews(views);
    safeSetItem('runtime_saved_views', JSON.stringify(views));
  };

  const handleSaveCurrentView = () => {
    if (selectedObjectIds.length === 0) return;
    const names = selectedObjectIds
      .map((id) => objects.find((o) => o.id === id)?.name || id)
      .join(' + ');
    const name = newViewName.trim() || names || `View ${savedViews.length + 1}`;

    const newView: SavedView = {
      id: `view_${Date.now()}`,
      name,
      objectIds: [...selectedObjectIds],
      createdAt: new Date().toISOString(),
    };

    saveViewsToStorage([newView, ...savedViews]);
    setNewViewName('');
  };

  const handleDeleteView = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveViewsToStorage(savedViews.filter((v) => v.id !== id));
  };

  const handleStartRenameView = (v: SavedView, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingViewId(v.id);
    setEditingViewName(v.name);
  };

  const handleConfirmRenameView = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingViewName.trim()) return;
    saveViewsToStorage(
      savedViews.map((v) => (v.id === id ? { ...v, name: editingViewName.trim() } : v))
    );
    setEditingViewId(null);
  };

  const [sidebarSearch, setSidebarSearch] = useState('');
  const [propertySearch, setPropertySearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'type-asc' | 'type-desc'>('name-asc');
  
  // Real-time flash effect state
  const [prevValues, setPrevValues] = useState<Record<string, string>>({});
  const [changedProps, setChangedProps] = useState<Record<string, boolean>>({});

  // Tree expanded folders state
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    '__unassigned__': true,
  });

  // Detail tab state (Properties list vs. 3D Telemetry dashboard)
  const [detailTab, setDetailTab] = useState<'properties' | 'telemetry'>('telemetry');

  // Initialize objects on mount
  useEffect(() => {
    initObjectModel();
  }, [initObjectModel]);

  // Keep simulation tick running if isSimulating is active
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      tickSimulation();
    }, simulationSpeedMs);
    return () => clearInterval(interval);
  }, [isSimulating, simulationSpeedMs, tickSimulation]);

  // Flash highlight animation for changed values
  useEffect(() => {
    const newlyChanged: Record<string, boolean> = {};
    Object.keys(simulatedValues).forEach((key) => {
      if (prevValues[key] !== undefined && prevValues[key] !== simulatedValues[key]) {
        newlyChanged[key] = true;
      }
    });

    if (Object.keys(newlyChanged).length > 0) {
      setChangedProps(newlyChanged);
      const timer = setTimeout(() => setChangedProps({}), 600);
      return () => clearTimeout(timer);
    }
  }, [simulatedValues]);

  useEffect(() => {
    setPrevValues(simulatedValues);
  }, [simulatedValues]);

  // Reset tab to telemetry when selecting objects
  useEffect(() => {
    setDetailTab('telemetry');
  }, [selectedObjectIds]);

  // Expand folders on load
  useEffect(() => {
    const initial: Record<string, boolean> = { '__unassigned__': true };
    deploymentFolders.forEach((f) => {
      initial[`dep_fold_${f.id}`] = true;
    });
    setExpandedFolders((prev) => ({ ...initial, ...prev }));
  }, [deploymentFolders]);

  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  // Object selection with Ctrl key support capped to MAX 2 items
  const handleObjectClick = (targetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey) {
      setSelectedObjectIds((prev) => {
        if (prev.includes(targetId)) return prev.filter((id) => id !== targetId);
        if (prev.length >= 2) return [prev[1], targetId];
        return [...prev, targetId];
      });
    } else {
      setSelectedObjectIds([targetId]);
    }
  };

  const handleRemoveFromSelection = (idToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedObjectIds((prev) => prev.filter((id) => id !== idToRemove));
  };

  const handleClearSelection = () => {
    setSelectedObjectIds([]);
  };

  // Get active deployed objects
  const deployedObjects = objects.filter((o) => o.isDeployed !== false);

  // Build the hierarchical runtime tree (containing only deployed objects)
  const buildRuntimeTree = (): DeploymentTreeNode[] => {
    const templateMap = new Map(templates.map((t) => [t.id, t.name]));
    const objectMap = new Map(objects.map((o) => [o.id, o]));
    const searchTerm = sidebarSearch.toLowerCase().trim();

    function processFolder(folder: any): DeploymentTreeNode | null {
      const childFolders = deploymentFolders
        .filter((f) => f.parentFolderId === folder.id)
        .sort((a, b) => a.order - b.order)
        .map((f) => processFolder(f))
        .filter((n): n is DeploymentTreeNode => n !== null);

      const childObjectNodes: DeploymentTreeNode[] = deploymentNodes
        .filter((n) => n.type === 'object' && n.parentFolderId === folder.id)
        .map((n): DeploymentTreeNode | null => {
          const obj = objectMap.get(n.targetId);
          if (!obj || obj.isDeployed === false) return null;
          if (searchTerm && !obj.name.toLowerCase().includes(searchTerm)) return null;

          return {
            id: `dep_obj_${n.id}`,
            name: obj.name,
            type: 'object' as const,
            targetId: n.targetId,
            parentFolderId: folder.id,
            order: n.order,
            children: [],
            objectDetail: obj,
            templateName: templateMap.get(obj.templateId) || 'Unknown Template',
          };
        })
        .filter((n): n is DeploymentTreeNode => n !== null);

      const hasChildren = childFolders.length > 0 || childObjectNodes.length > 0;
      const matchesSearch = searchTerm && folder.name.toLowerCase().includes(searchTerm);

      if (hasChildren || matchesSearch) {
        return {
          id: `dep_fold_${folder.id}`,
          name: folder.name,
          type: 'folder' as const,
          targetId: folder.id,
          parentFolderId: folder.parentFolderId,
          order: folder.order,
          children: [...childFolders, ...childObjectNodes],
        };
      }
      return null;
    }

    const rootFolders = deploymentFolders
      .filter((f) => !f.parentFolderId)
      .sort((a, b) => a.order - b.order)
      .map((f): DeploymentTreeNode | null => processFolder(f))
      .filter((n): n is DeploymentTreeNode => n !== null);

    const rootUnassignedNodes: DeploymentTreeNode[] = deploymentNodes
      .filter((n) => n.type === 'object' && !n.parentFolderId)
      .map((n): DeploymentTreeNode | null => {
        const obj = objectMap.get(n.targetId);
        if (!obj || obj.isDeployed === false) return null;
        if (searchTerm && !obj.name.toLowerCase().includes(searchTerm)) return null;

        return {
          id: `dep_obj_${n.id}`,
          name: obj.name,
          type: 'object' as const,
          targetId: n.targetId,
          parentFolderId: null,
          order: n.order,
          children: [],
          objectDetail: obj,
          templateName: templateMap.get(obj.templateId) || 'Unknown Template',
        };
      })
      .filter((n): n is DeploymentTreeNode => n !== null);

    return [...rootFolders, ...rootUnassignedNodes];
  };

  const runtimeTree = buildRuntimeTree();

  // Find unassigned objects
  const assignedObjectIds = new Set(
    deploymentNodes
      .filter((n) => n.type === 'object' && n.parentFolderId !== null)
      .map((n) => n.targetId)
  );
  const unassignedDeployedObjects = deployedObjects.filter((o) => !assignedObjectIds.has(o.id));
  const filteredUnassigned = unassignedDeployedObjects.filter(
    (o) => !sidebarSearch || o.name.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  // Selected Object computing
  const primarySelectedId = selectedObjectIds[0] || null;
  const selectedObj = objects.find((o) => o.id === primarySelectedId);
  const originTemplate = selectedObj ? templates.find((t) => t.id === selectedObj.templateId) : null;
  
  // Properties computation for single selection
  const allProperties: MergedProperty[] = primarySelectedId
    ? inheritanceService.getMergedProperties(primarySelectedId, 'instance')
    : [];

  const filteredProperties = allProperties
    .filter((prop) => {
      const key = `${primarySelectedId}:${prop.name}`;
      const val = simulatedValues[key] ?? prop.defaultValue;
      const matchText =
        prop.name.toLowerCase().includes(propertySearch.toLowerCase()) ||
        prop.description.toLowerCase().includes(propertySearch.toLowerCase()) ||
        val.toLowerCase().includes(propertySearch.toLowerCase());

      const matchType = typeFilter === 'ALL' || prop.dataType.toUpperCase() === typeFilter.toUpperCase();

      return matchText && matchType;
    })
    .sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'type-asc') return a.dataType.localeCompare(b.dataType);
      if (sortBy === 'type-desc') return b.dataType.localeCompare(a.dataType);
      return 0;
    });

  const hasTelemetry = useMemo(() => {
    return allProperties.some((p) => p.name === 'Level' || p.name === 'Volume');
  }, [allProperties]);

  const localPropsCount = allProperties.filter((p) => !p.isInherited).length;
  const inheritedPropsCount = allProperties.filter((p) => p.isInherited).length;

  const renderObjectRow = (node: DeploymentTreeNode, depth: number) => {
    const isSelected = selectedObjectIds.includes(node.targetId);
    return (
      <div
        key={node.id}
        onClick={(e) => handleObjectClick(node.targetId, e)}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        className={cn(
          "flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-xs font-medium cursor-pointer transition-colors select-none",
          isSelected
            ? "bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-l-3 border-sky-500 shadow-2xs font-semibold"
            : "text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800/40"
        )}
        title="Clique para selecionar. Pressione Ctrl + Clique para seleção múltipla."
      >
        <Box className={cn("w-3.5 h-3.5 shrink-0", isSelected ? "text-sky-500" : "text-slate-400")} />
        <div className="flex-1 truncate">
          <span className="font-semibold">{node.name}</span>
          {node.templateName && (
            <span className="text-[9px] text-slate-400 dark:text-slate-550 ml-1.5 font-normal">
              ({node.templateName})
            </span>
          )}
        </div>
        {isSelected && selectedObjectIds.length > 1 && (
          <span className="w-4 h-4 rounded-full bg-sky-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
            {selectedObjectIds.indexOf(node.targetId) + 1}
          </span>
        )}
      </div>
    );
  };

  const renderFolderNode = (node: DeploymentTreeNode, depth: number) => {
    const folderKey = `dep_fold_${node.targetId}`;
    const isExpanded = expandedFolders[folderKey] ?? true;

    return (
      <div key={node.id} className="flex flex-col">
        <div
          onClick={(e) => toggleFolder(folderKey, e)}
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
          className="flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer select-none"
        >
          <span className="p-0.5 rounded-sm hover:bg-slate-200 dark:hover:bg-slate-700 shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-slate-400" />
            ) : (
              <ChevronRight className="w-3 h-3 text-slate-400" />
            )}
          </span>
          {isExpanded ? (
            <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          )}
          <span className="truncate flex-1">{node.name}</span>
        </div>

        {isExpanded && (
          <div className="flex flex-col">
            {node.children.map((child) =>
              child.type === 'folder'
                ? renderFolderNode(child, depth + 1)
                : renderObjectRow(child, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderUnassignedFolder = () => {
    if (filteredUnassigned.length === 0) return null;
    const isExpanded = expandedFolders['__unassigned__'] ?? true;

    return (
      <div key="__unassigned__" className="flex flex-col">
        <div
          onClick={(e) => toggleFolder('__unassigned__', e)}
          className="flex items-center gap-1.5 py-1.5 px-2 rounded-md bg-orange-50/60 dark:bg-orange-950/10 text-orange-700 dark:text-orange-400 border border-orange-100 dark:border-orange-950/30 text-xs font-semibold cursor-pointer select-none mb-1"
        >
          <span className="p-0.5 shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-orange-400" />
            ) : (
              <ChevronRight className="w-3 h-3 text-orange-400" />
            )}
          </span>
          <FolderX className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          <span className="flex-1">Sem Destino</span>
          <span className="text-[10px] font-normal text-orange-400 px-1.5 py-0.2 bg-orange-100 dark:bg-orange-900/30 rounded shrink-0">
            {filteredUnassigned.length}
          </span>
        </div>

        {isExpanded && (
          <div className="flex flex-col mb-2">
            {filteredUnassigned.map((obj) => {
              const tmpl = templates.find((t) => t.id === obj.templateId);
              const nodeObj: DeploymentTreeNode = {
                id: `unassigned-${obj.id}`,
                name: obj.name,
                type: 'object',
                targetId: obj.id,
                parentFolderId: null,
                order: 0,
                children: [],
                objectDetail: obj,
                templateName: tmpl?.name,
              };
              return renderObjectRow(nodeObj, 0);
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <HeaderNavigation />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar */}
        <aside className={cn(
          "border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 transition-all duration-300 overflow-hidden",
          isSidebarCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-80 opacity-100"
        )}>
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Deployment & Views
              </h3>
              <p className="text-[10px] text-slate-400">Selecione até 2 equipamentos (Ctrl+clique)</p>
            </div>
            <button
              onClick={() => setIsSidebarCollapsed(true)}
              title="Recolher Sidebar"
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* 2 Tabs Header */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/80 p-1 gap-1 shrink-0">
            <button
              onClick={() => setSidebarTab('objects')}
              className={cn(
                "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5",
                sidebarTab === 'objects'
                  ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-2xs font-bold border border-slate-200 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <Box className="w-3.5 h-3.5" />
              Objetos
            </button>
            <button
              onClick={() => setSidebarTab('views')}
              className={cn(
                "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5",
                sidebarTab === 'views'
                  ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-2xs font-bold border border-slate-200 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-500" />
              Views ({savedViews.length})
            </button>
          </div>

          {sidebarTab === 'objects' ? (
            <>
              <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar objetos..."
                    value={sidebarSearch}
                    onChange={(e) => setSidebarSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              <div 
                className="flex-1 overflow-y-auto p-2 space-y-1"
                onClick={() => setSelectedObjectIds([])}
              >
                {renderUnassignedFolder()}
                {runtimeTree.map((node) => renderFolderNode(node, 0))}
                {runtimeTree.length === 0 && filteredUnassigned.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400 italic">
                    Nenhum objeto rodando encontrado.
                  </div>
                )}
              </div>
            </>
          ) : (
            /* TAB 2: SAVED VIEWS MANAGEMENT */
            <div className="flex-1 flex flex-col overflow-hidden p-3">
              {/* Save current view card */}
              <div className="bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/40 rounded-xl p-3 mb-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1.5">
                  Salvar Visualização Atual
                </div>
                {selectedObjectIds.length === 0 ? (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    Selecione 1 ou 2 equipamentos na árvore para salvar esta configuração como uma View.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder={`Nome da View (ex: ${selectedObjectIds.map((id) => objects.find((o) => o.id === id)?.name || id).join(' + ')})`}
                      value={newViewName}
                      onChange={(e) => setNewViewName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-sky-500"
                    />
                    <button
                      onClick={handleSaveCurrentView}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Salvar View ({selectedObjectIds.length} selecionado{selectedObjectIds.length > 1 ? 's' : ''})
                    </button>
                  </div>
                )}
              </div>

              {/* List of Saved Views */}
              <div className="flex-1 overflow-y-auto space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  Minhas Visualizações Salvas
                </div>
                {savedViews.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 italic">
                    Nenhuma view salva ainda.
                  </div>
                ) : (
                  savedViews.map((v) => {
                    const isEditing = editingViewId === v.id;
                    const isActiveView =
                      selectedObjectIds.length === v.objectIds.length &&
                      selectedObjectIds.every((id) => v.objectIds.includes(id));

                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedObjectIds(v.objectIds.slice(0, 2))}
                        className={cn(
                          "p-3 rounded-xl border transition-all cursor-pointer select-none relative group",
                          isActiveView
                            ? "bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-700 shadow-2xs"
                            : "bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-sky-300"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          {isEditing ? (
                            <div className="flex items-center gap-1 flex-1 mr-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={editingViewName}
                                onChange={(e) => setEditingViewName(e.target.value)}
                                className="flex-1 px-2 py-1 bg-white dark:bg-slate-900 border border-sky-500 rounded text-xs"
                                autoFocus
                              />
                              <button
                                onClick={(e) => handleConfirmRenameView(v.id, e)}
                                className="p-1 text-emerald-600 hover:text-emerald-700"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 min-w-0">
                              <Bookmark className={cn("w-4 h-4 shrink-0", isActiveView ? "text-sky-500 fill-sky-500" : "text-amber-500")} />
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-150 truncate">
                                {v.name}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                            {!isEditing && (
                              <button
                                onClick={(e) => handleStartRenameView(v, e)}
                                title="Editar nome"
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDeleteView(v.id, e)}
                              title="Excluir view"
                              className="p-1 text-slate-400 hover:text-rose-500 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {v.objectIds.map((objId) => {
                            const obj = objects.find((o) => o.id === objId);
                            return (
                              <span
                                key={objId}
                                className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded"
                              >
                                {obj?.name || objId}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </aside>

        {/* Central Display Pane */}
        <main className="flex-1 flex flex-col bg-slate-100/50 dark:bg-slate-950/20 overflow-hidden relative">
          
          {/* Global Simulation Control Bar & Selection Bar */}
          <div className="px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 select-none shadow-2xs z-10">
            <div className="flex items-center gap-2">
              {isSidebarCollapsed && (
                <button
                  onClick={() => setIsSidebarCollapsed(false)}
                  title="Expandir Árvore de Deployment"
                  className="flex items-center gap-1 px-2.5 py-1 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-900/40 rounded-lg text-xs font-semibold hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors cursor-pointer mr-2"
                >
                  <PanelLeftOpen className="w-3.5 h-3.5" />
                  <span>Expandir Árvore</span>
                </button>
              )}

              {selectedObjectIds.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 mr-1">
                    Selecionados ({selectedObjectIds.length}):
                  </span>
                  {selectedObjectIds.map((id) => {
                    const obj = objects.find((o) => o.id === id);
                    if (!obj) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-900/50"
                      >
                        <Box className="w-3 h-3 text-sky-500" />
                        <span>{obj.name}</span>
                        <button
                          onClick={(e) => handleRemoveFromSelection(id, e)}
                          className="hover:text-rose-500 transition-colors p-0.5 rounded-full"
                          title="Remover da seleção"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                  {selectedObjectIds.length > 1 && (
                    <button
                      onClick={handleClearSelection}
                      className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline ml-1 cursor-pointer"
                    >
                      Limpar tudo
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Simulation Control Toggle */}
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 px-1">
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  isSimulating ? "bg-emerald-500 animate-ping" : "bg-amber-500"
                )} />
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {isSimulating ? 'Simulação Ativa' : 'Simulação Pausada'}
                </span>
              </div>
              
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
              
              <button
                onClick={() => toggleSimulation()}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all duration-150 cursor-pointer",
                  isSimulating
                    ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                )}
              >
                {isSimulating ? (
                  <>
                    <Pause className="w-3 h-3 fill-white" />
                    <span>Pausar</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-white" />
                    <span>Iniciar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          {selectedObjectIds.length === 0 ? (
            /* Welcome / Placeholder screen when no object is selected */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 shadow-2xs mb-4">
                <Zap className="w-8 h-8 text-sky-500 animate-pulse" />
              </div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Painel de Telemetria e Monitoramento de Runtime
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1 leading-relaxed">
                Selecione um dos equipamentos na árvore de deployment à esquerda.<br />
                <span className="font-semibold text-sky-600 dark:text-sky-400">Dica:</span> Mantenha a tecla <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[10px]">Ctrl</kbd> pressionada para selecionar múltiplos equipamentos simultaneamente.
              </p>
            </div>
          ) : selectedObjectIds.length === 1 ? (
            /* Single Equipment Detail View */
            <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
              
              {/* Header */}
              {selectedObj && (
                <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs select-none shrink-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
                        {selectedObj.name}
                      </h2>
                      {originTemplate && (
                        <span className="text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 px-2 py-0.5 border border-sky-100 dark:border-sky-900/40 rounded-full flex items-center gap-1">
                          <Cpu className="w-2.5 h-2.5" />
                          {originTemplate.name}
                        </span>
                      )}
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Objeto em Execução" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl truncate">
                      {selectedObj.description || 'Sem descrição cadastrada para este objeto.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Tabs selector if object has telemetry variables */}
              {hasTelemetry && (
                <div className="flex border-b border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 shrink-0">
                  <button
                    onClick={() => setDetailTab('telemetry')}
                    className={cn(
                      "px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer",
                      detailTab === 'telemetry'
                        ? "border-sky-500 text-sky-600 dark:text-sky-400 font-bold"
                        : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                    )}
                  >
                    Telemetria & Tendências (3D)
                  </button>
                  <button
                    onClick={() => setDetailTab('properties')}
                    className={cn(
                      "px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer",
                      detailTab === 'properties'
                        ? "border-sky-500 text-sky-600 dark:text-sky-400 font-bold"
                        : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                    )}
                  >
                    Propriedades Gerais
                  </button>
                </div>
              )}

              {/* Tab 1: Telemetry Dashboard */}
              {detailTab === 'telemetry' && hasTelemetry ? (
                <div className="flex-1 overflow-hidden">
                  <TankTelemetryDashboard objectId={primarySelectedId!} />
                </div>
              ) : (
                /* Tab 2: General Properties Table */
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Stats Bar */}
                  <div className="p-3 grid grid-cols-3 gap-3 shrink-0 select-none bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-3 rounded-lg flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-sky-500/10 dark:bg-sky-500/5 text-sky-50">
                        <Database className="w-4 h-4 text-sky-500" />
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total de Propriedades</span>
                        <strong className="text-base font-bold text-slate-800 dark:text-slate-100 leading-none">{allProperties.length}</strong>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-3 rounded-lg flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-violet-500/10 dark:bg-violet-500/5 text-violet-50">
                        <Layers className="w-4 h-4 text-violet-500" />
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Herdadas de Modelos</span>
                        <strong className="text-base font-bold text-slate-800 dark:text-slate-100 leading-none">{inheritedPropsCount}</strong>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-3 rounded-lg flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-50">
                        <FileCode className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Locais/Customizadas</span>
                        <strong className="text-base font-bold text-slate-800 dark:text-slate-100 leading-none">{localPropsCount}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Filtering Toolbar */}
                  <div className="px-4 py-2 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    {/* Search & Type filters */}
                    <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Pesquisar por nome, valor ou descrição..."
                          value={propertySearch}
                          onChange={(e) => setPropertySearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
                        />
                      </div>

                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-700 dark:text-slate-300"
                      >
                        <option value="ALL">Todos os Tipos</option>
                        <option value="String">String</option>
                        <option value="Boolean">Boolean</option>
                        <option value="Integer">Integer</option>
                        <option value="Float">Float</option>
                        <option value="Date">Date</option>
                        <option value="Enum">Enum</option>
                      </select>
                    </div>

                    {/* Sort Option */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      <span>Ordenar por:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-xs outline-none focus:border-sky-500 text-slate-700 dark:text-slate-300 font-semibold"
                      >
                        <option value="name-asc">Nome (A-Z)</option>
                        <option value="name-desc">Nome (Z-A)</option>
                        <option value="type-asc">Tipo (Ascendente)</option>
                        <option value="type-desc">Tipo (Descendente)</option>
                      </select>
                    </div>
                  </div>

                  {/* Properties Table */}
                  <div className="flex-1 overflow-auto p-4 bg-slate-50/20 dark:bg-slate-950/5">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-2xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                            <th className="py-2.5 px-4 font-semibold">Propriedade</th>
                            <th className="py-2.5 px-4 font-semibold w-[500px]">Valor Atual</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                          {filteredProperties.map((prop) => {
                            const key = `${primarySelectedId}:${prop.name}`;
                            const liveValue = simulatedValues[key] ?? prop.defaultValue;
                            const isChanged = changedProps[key];

                            return (
                              <tr
                                key={prop.id}
                                className="hover:bg-slate-50/60 dark:hover:bg-slate-800/10 transition-colors animate-in fade-in duration-100"
                              >
                                {/* Property Details */}
                                <td className="py-3 px-4">
                                  <div className="font-semibold text-slate-850 dark:text-slate-200">
                                    {prop.name}
                                  </div>
                                  {prop.description && (
                                    <div className="text-[10px] text-slate-400 mt-0.5 font-normal">
                                      {prop.description}
                                    </div>
                                  )}
                                </td>

                                {/* Current simulated value with flash edit */}
                                <td className="py-3 px-4">
                                  {editingPropKey === key ? (
                                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="text"
                                        value={tempValue}
                                        onChange={(e) => setTempValue(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            updateSimulatedValue(key, tempValue);
                                            setEditingPropKey(null);
                                          }
                                          if (e.key === 'Escape') {
                                            setEditingPropKey(null);
                                          }
                                        }}
                                        className="px-2 py-0.5 border border-sky-500 rounded bg-white dark:bg-slate-955 text-slate-900 dark:text-slate-100 font-mono text-xs w-28 outline-none focus:ring-1 focus:ring-sky-500/20"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => {
                                          updateSimulatedValue(key, tempValue);
                                          setEditingPropKey(null);
                                        }}
                                        className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors"
                                        title="Confirmar"
                                      >
                                        <Check className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => setEditingPropKey(null)}
                                        className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                                        title="Cancelar"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div
                                      onClick={() => {
                                        setEditingPropKey(key);
                                        setTempValue(liveValue);
                                      }}
                                      className={cn(
                                        "font-mono font-bold transition-all duration-305 rounded px-2 py-1 inline-flex items-center justify-between gap-2 min-w-[100px] cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/40 group/val",
                                        isChanged
                                          ? "bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 scale-102"
                                          : "bg-slate-100/50 dark:bg-slate-950/45 text-slate-800 dark:text-slate-350"
                                      )}
                                      title="Clique para alterar valor"
                                    >
                                      <span>{liveValue}{prop.historyConfig?.engineeringUnit ? ` ${prop.historyConfig.engineeringUnit}` : ''}</span>
                                      <Edit2 className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover/val:opacity-100 transition-opacity shrink-0" />
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}

                          {filteredProperties.length === 0 && (
                            <tr>
                              <td colSpan={2} className="py-8 text-center text-slate-400 dark:text-slate-550 italic">
                                Nenhuma propriedade encontrada para este filtro.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Multi-Equipment Split / Grid View */
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-100/60 dark:bg-slate-950/40 p-4">
              <div className="mb-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  {selectedObjectIds.length === 2 ? (
                    <Columns className="w-4 h-4 text-sky-500" />
                  ) : (
                    <Grid className="w-4 h-4 text-sky-500" />
                  )}
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Visualização Comparativa ({selectedObjectIds.length} Equipamentos)
                  </h3>
                </div>
              </div>

              {/* Grid / Split Layout */}
              <div className={cn(
                "flex-1 overflow-y-auto gap-4 min-h-0",
                selectedObjectIds.length === 2
                  ? "grid grid-cols-1 lg:grid-cols-2 h-full"
                  : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              )}>
                {selectedObjectIds.map((id) => {
                  const targetObj = objects.find((o) => o.id === id);
                  return (
                    <div
                      key={id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-sm relative group min-h-[450px]"
                    >
                      <div className="p-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <Box className="w-4 h-4 text-sky-500 shrink-0" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {targetObj?.name || id}
                          </span>
                        </div>
                        <button
                          onClick={(e) => handleRemoveFromSelection(id, e)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
                          title="Remover este equipamento"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-hidden">
                        <TankTelemetryDashboard objectId={id} compact={selectedObjectIds.length >= 3} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="h-6 border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center justify-between px-3 text-[11px] text-slate-500 dark:text-slate-400 shrink-0 select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Runtime Monitor Active
            </span>
          </div>
          <span>Objetos Rodando: <strong className="text-slate-600 dark:text-slate-300">{deployedObjects.length}</strong></span>
        </div>
        <span>Orquestra Runtime Panel v1.0</span>
      </footer>
    </div>
  );
};

export default RuntimePage;
