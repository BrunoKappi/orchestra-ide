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
} from 'lucide-react';

import { HeaderNavigation } from '../components/navigation/HeaderNavigation';
import { useObjectModelStore } from '../store/useObjectModelStore';
import { inheritanceService } from '../services/InheritanceService';
import type { MergedProperty, DeploymentTreeNode } from '../types/domain';
import { cn } from '../utils/cn';
import { TankTelemetryDashboard } from '../components/ui/TankTelemetryDashboard';

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

  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
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

  // Reset tab to telemetry when selecting another object
  useEffect(() => {
    setDetailTab('telemetry');
  }, [selectedObjectId]);

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
    setSelectedObjectId(null);
  };

  // Get active deployed objects
  const deployedObjects = objects.filter((o) => o.isDeployed !== false);

  // Build the hierarchical runtime tree (containing only deployed objects)
  const buildRuntimeTree = (): DeploymentTreeNode[] => {
    const templateMap = new Map(templates.map((t) => [t.id, t.name]));
    const objectMap = new Map(objects.map((o) => [o.id, o]));
    const searchTerm = sidebarSearch.toLowerCase().trim();

    function processFolder(folder: any): DeploymentTreeNode | null {
      // Child folders recursively processed
      const childFolders = deploymentFolders
        .filter((f) => f.parentFolderId === folder.id)
        .sort((a, b) => a.order - b.order)
        .map((f) => processFolder(f))
        .filter((n): n is DeploymentTreeNode => n !== null);

      // Child objects that are deployed and match filter
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

    // Root level folders
    const rootFolders = deploymentFolders
      .filter((f) => !f.parentFolderId)
      .sort((a, b) => a.order - b.order)
      .map((f): DeploymentTreeNode | null => processFolder(f))
      .filter((n): n is DeploymentTreeNode => n !== null);

    // Root level unassigned objects
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

  // Find unassigned objects for "Sem Destino"
  const assignedObjectIds = new Set(
    deploymentNodes
      .filter((n) => n.type === 'object' && n.parentFolderId !== null)
      .map((n) => n.targetId)
  );
  const unassignedDeployedObjects = deployedObjects.filter((o) => !assignedObjectIds.has(o.id));
  const filteredUnassigned = unassignedDeployedObjects.filter(
    (o) => !sidebarSearch || o.name.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  // Selected Object detail computing
  const selectedObj = objects.find((o) => o.id === selectedObjectId);
  const originTemplate = selectedObj ? templates.find((t) => t.id === selectedObj.templateId) : null;
  
  // Properties computation
  const allProperties: MergedProperty[] = selectedObjectId
    ? inheritanceService.getMergedProperties(selectedObjectId, 'instance')
    : [];

  const filteredProperties = allProperties
    .filter((prop) => {
      // 1. Text filter (name, value, description)
      const key = `${selectedObjectId}:${prop.name}`;
      const val = simulatedValues[key] ?? prop.defaultValue;
      const matchText =
        prop.name.toLowerCase().includes(propertySearch.toLowerCase()) ||
        prop.description.toLowerCase().includes(propertySearch.toLowerCase()) ||
        val.toLowerCase().includes(propertySearch.toLowerCase());

      // 2. Type Filter
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

  // Check if object is a tank/vessel with telemetry data
  const hasTelemetry = useMemo(() => {
    return allProperties.some((p) => p.name === 'Level' || p.name === 'Volume');
  }, [allProperties]);

  // Quick stats computed
  const localPropsCount = allProperties.filter((p) => !p.isInherited).length;
  const inheritedPropsCount = allProperties.filter((p) => p.isInherited).length;



  const renderObjectRow = (node: DeploymentTreeNode, depth: number) => {
    const isSelected = selectedObjectId === node.targetId;
    return (
      <div
        key={node.id}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedObjectId(node.targetId);
        }}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        className={cn(
          "flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-xs font-medium cursor-pointer transition-colors select-none",
          isSelected
            ? "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-l-2 border-sky-500"
            : "text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800/40"
        )}
      >
        <Box className={cn("w-3.5 h-3.5", isSelected ? "text-sky-500" : "text-slate-400")} />
        <div className="flex-1 truncate">
          <span className="font-semibold">{node.name}</span>
          {node.templateName && (
            <span className="text-[9px] text-slate-400 dark:text-slate-550 ml-1.5 font-normal">
              ({node.templateName})
            </span>
          )}
        </div>
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
        <aside className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 overflow-hidden">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
              Objetos em Deployment
            </h3>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar objetos..."
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          <div 
            className="flex-1 overflow-y-auto p-2 space-y-1"
            onClick={() => setSelectedObjectId(null)}
          >
            {renderUnassignedFolder()}
            {runtimeTree.map((node) => renderFolderNode(node, 0))}
            {runtimeTree.length === 0 && filteredUnassigned.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400 italic">
                Nenhum objeto rodando encontrado.
              </div>
            )}
          </div>
        </aside>

        {/* Central Display Pane */}
        <main className="flex-1 flex flex-col bg-slate-100/50 dark:bg-slate-950/20 overflow-hidden">
          {selectedObj ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
              
              {/* Object Header Info */}
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

              {/* Conditional rendering based on active tab */}
              {detailTab === 'telemetry' && hasTelemetry ? (
                <div className="flex-1 overflow-hidden">
                  <TankTelemetryDashboard objectId={selectedObjectId!} />
                </div>
              ) : (
                /* Tab 1: Properties Table View */
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
                            const key = `${selectedObjectId}:${prop.name}`;
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
            /* Welcome / Placeholder screen when no object is selected */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 shadow-2xs mb-4">
                <Zap className="w-8 h-8 text-sky-500 animate-pulse" />
              </div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Painel de Telemetria e Monitoramento de Runtime
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                Selecione um dos objetos ativos (running) na árvore de deployment à esquerda para ver suas variáveis e propriedades em tempo real.
              </p>
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
