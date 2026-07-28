import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  Workflow,
  Copy,
  Trash2,
  Edit2,
  Download,
  FolderPlus,
  RefreshCw,
  Clipboard,
  Move,
  Eye,
} from 'lucide-react';
import { useConnectivityStore } from '../../store/useConnectivityStore';
import type { ConnectivityFolder, ConnectivityFlow } from '../../types/connectivity';

interface FlowsTreeSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

type ContextMenuTarget =
  | { type: 'empty' }
  | { type: 'folder'; folder: ConnectivityFolder }
  | { type: 'flow'; flow: ConnectivityFlow };

interface ContextMenuState {
  x: number;
  y: number;
  target: ContextMenuTarget;
}

export const FlowsTreeSidebar: React.FC<FlowsTreeSidebarProps> = () => {
  const {
    folders,
    flows,
    selectedFlowId,
    setSelectedFlowId,
    addFolder,
    updateFolder,
    deleteFolder,
    moveFolder,
    moveFlowToFolder,
    addFlow,
    duplicateFlow,
    deleteFlow,
  } = useConnectivityStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolderIds, setExpandedFolderIds] = useState<Record<string, boolean>>({
    'folder-industrial': true,
    'folder-erp': true,
    'folder-analytics': true,
  });

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState('');

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Clipboard state for Copy & Paste
  const [copiedItem, setCopiedItem] = useState<{ id: string; type: 'folder' | 'flow' } | null>(null);

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<{ id: string; type: 'folder' | 'flow' } | null>(null);

  // Close context menu on outside click or scroll
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', handleClickOutside, true);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', handleClickOutside, true);
    };
  }, []);

  const toggleFolderExpand = (folderId: string) => {
    setExpandedFolderIds((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleDragStart = (e: React.DragEvent, id: string, type: 'folder' | 'flow') => {
    setDraggedItem({ id, type });
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, type }));
  };

  const handleDropOnFolder = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItem) return;

    if (draggedItem.type === 'flow') {
      moveFlowToFolder(draggedItem.id, targetFolderId);
    } else if (draggedItem.type === 'folder' && targetFolderId !== draggedItem.id) {
      moveFolder(draggedItem.id, targetFolderId);
    }
    setDraggedItem(null);
  };

  const handleCreateNewFlow = (folderId: string | null = null) => {
    const name = `Novo Fluxo ${flows.length + 1}`;
    addFlow({
      folderId,
      name,
      description: 'Pipeline de orquestração de dados industrial',
      category: 'Industrial IoT',
      version: '1.0.0',
      author: 'Engenharia de Dados',
      status: 'Draft',
      documentation: 'Fluxo criado via Connectivity Studio.',
      nodes: [
        {
          id: 'node-start-1',
          type: 'custom',
          position: { x: 250, y: 150 },
          data: {
            label: 'Entrada OPC-UA Tag',
            category: 'Entrada',
            blockType: 'OPC UA Read',
            iconName: 'Cpu',
            color: '#0284c7',
            description: 'Leitura contínua de telemetria',
            inputsCount: 0,
            outputsCount: 1,
            properties: { nodeAddress: 'ns=2;s=Device1.Temperature', pollIntervalMs: 1000 },
          },
        },
      ],
      edges: [],
      executedCount: 0,
      avgDurationMs: 0,
      errorRatePercent: 0,
    });
    if (folderId) {
      setExpandedFolderIds((prev) => ({ ...prev, [folderId]: true }));
    }
  };

  const handleCreateFolder = (parentId: string | null = null) => {
    const folderName = prompt('Nome da nova pasta:', 'Nova Pasta');
    if (folderName && folderName.trim()) {
      addFolder(folderName.trim(), parentId);
      if (parentId) {
        setExpandedFolderIds((prev) => ({ ...prev, [parentId]: true }));
      }
    }
  };

  const handleExportFlow = (flow: ConnectivityFlow) => {
    const jsonStr = JSON.stringify(flow, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${flow.name.toLowerCase().replace(/\s+/g, '_')}_flow.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportFolder = (folder: ConnectivityFolder) => {
    const folderFlows = flows.filter((f) => f.folderId === folder.id);
    const payload = {
      folder,
      flows: folderFlows,
    };
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${folder.name.toLowerCase().replace(/\s+/g, '_')}_folder.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const startRenaming = (id: string, currentName: string) => {
    setEditingItemId(id);
    setEditingItemName(currentName);
    setContextMenu(null);
  };

  const saveRename = (id: string, type: 'folder' | 'flow') => {
    if (editingItemName.trim()) {
      if (type === 'folder') {
        updateFolder(id, { name: editingItemName.trim() });
      } else {
        const { updateFlow } = useConnectivityStore.getState();
        updateFlow(id, { name: editingItemName.trim() });
      }
    }
    setEditingItemId(null);
  };

  const handleMoveFlowPrompt = (flow: ConnectivityFlow) => {
    const folderOptions = folders.map((f) => `- ${f.name} (ID: ${f.id})`).join('\n');
    const input = prompt(
      `Digite a pasta destino para "${flow.name}":\nDeixe em branco para Raiz.\n\nPastas disponíveis:\n${folderOptions || '(Nenhuma pasta criada)'}`
    );
    if (input !== null) {
      const match = folders.find(
        (f) => f.name.toLowerCase() === input.trim().toLowerCase() || f.id === input.trim()
      );
      moveFlowToFolder(flow.id, match ? match.id : null);
    }
  };

  const handlePaste = (targetFolderId: string | null = null) => {
    if (!copiedItem) return;
    if (copiedItem.type === 'flow') {
      duplicateFlow(copiedItem.id);
      const latestFlow = flows[flows.length - 1];
      if (latestFlow && targetFolderId) {
        moveFlowToFolder(latestFlow.id, targetFolderId);
      }
    } else if (copiedItem.type === 'folder') {
      const folderToCopy = folders.find((f) => f.id === copiedItem.id);
      if (folderToCopy) {
        addFolder(`${folderToCopy.name} (Cópia)`, targetFolderId);
      }
    }
  };

  const handleContextMenuOpen = (
    e: React.MouseEvent,
    target: ContextMenuTarget
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 200;
    const menuHeight = 260;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 10);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 10);

    setContextMenu({ x, y, target });
  };

  // Filter items by search query
  const filteredFlows = flows.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFolderNode = (folder: ConnectivityFolder, depth = 0) => {
    const isExpanded = expandedFolderIds[folder.id];
    const subfolders = folders.filter((f) => f.parentId === folder.id);
    const folderFlows = filteredFlows.filter((f) => f.folderId === folder.id);

    return (
      <div key={folder.id} className="select-none">
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, folder.id, 'folder')}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDropOnFolder(e, folder.id)}
          onContextMenu={(e) => handleContextMenuOpen(e, { type: 'folder', folder })}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          className="group flex items-center justify-between py-1 px-2 rounded-md hover:bg-slate-200/70 dark:hover:bg-slate-800/60 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
          onClick={() => toggleFolderExpand(folder.id)}
        >
          <div className="flex items-center gap-1.5 overflow-hidden">
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-amber-500 shrink-0" />
            )}

            {editingItemId === folder.id ? (
              <input
                type="text"
                value={editingItemName}
                onChange={(e) => setEditingItemName(e.target.value)}
                onBlur={() => saveRename(folder.id, 'folder')}
                onKeyDown={(e) => e.key === 'Enter' && saveRename(folder.id, 'folder')}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 border border-sky-500 rounded px-1.5 py-0.5 text-xs outline-none text-slate-800 dark:text-slate-100"
              />
            ) : (
              <span className="truncate">{folder.name}</span>
            )}
          </div>

          <span className="text-[10px] text-slate-400 font-mono opacity-60 group-hover:opacity-100">
            {folderFlows.length + subfolders.length}
          </span>
        </div>

        {/* Subfolders & Nested Flows */}
        {isExpanded && (
          <div>
            {subfolders.map((sf) => renderFolderNode(sf, depth + 1))}
            {folderFlows.map((flow) => renderFlowItem(flow, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderFlowItem = (flow: ConnectivityFlow, depth = 0) => {
    const isSelected = selectedFlowId === flow.id;
    return (
      <div
        key={flow.id}
        draggable
        onDragStart={(e) => handleDragStart(e, flow.id, 'flow')}
        onContextMenu={(e) => handleContextMenuOpen(e, { type: 'flow', flow })}
        style={{ paddingLeft: `${depth * 14 + 22}px` }}
        onClick={() => setSelectedFlowId(flow.id)}
        className={`group flex items-center justify-between py-1 px-2 rounded-md cursor-pointer text-xs transition-all my-0.5 select-none ${
          isSelected
            ? 'bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 font-semibold border-l-2 border-sky-500'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Workflow className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-sky-500' : 'text-slate-400'}`} />
          {editingItemId === flow.id ? (
            <input
              type="text"
              value={editingItemName}
              onChange={(e) => setEditingItemName(e.target.value)}
              onBlur={() => saveRename(flow.id, 'flow')}
              onKeyDown={(e) => e.key === 'Enter' && saveRename(flow.id, 'flow')}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-sky-500 rounded px-1.5 py-0.5 text-xs outline-none text-slate-800 dark:text-slate-100"
            />
          ) : (
            <span className="truncate">{flow.name}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              flow.status === 'Running' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          />
        </div>
      </div>
    );
  };

  const rootFolders = folders.filter((f) => !f.parentId);
  const rootFlows = filteredFlows.filter((f) => !f.folderId);

  return (
    <aside
      onContextMenu={(e) => handleContextMenuOpen(e, { type: 'empty' })}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => handleDropOnFolder(e, null)}
      className="w-60 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 select-none relative"
    >
      {/* Search Input Bar */}
      <div className="p-2.5 border-b border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 rounded-lg text-xs outline-none focus:border-sky-500 transition-all text-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Tree View Canvas */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin">
        {/* Single Unified Folder & Flow Tree */}
        {rootFolders.map((folder) => renderFolderNode(folder, 0))}
        {rootFlows.map((flow) => renderFlowItem(flow, 0))}

        {filteredFlows.length === 0 && rootFolders.length === 0 && (
          <div className="p-6 text-center text-xs text-slate-400 italic">
            Nenhum item encontrado. Clique com o botão direito para criar.
          </div>
        )}
      </div>

      {/* Floating Right-Click Context Menu */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-1 text-xs text-slate-700 dark:text-slate-200 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Empty Area Menu */}
          {contextMenu.target.type === 'empty' && (
            <>
              <button
                onClick={() => {
                  setContextMenu(null);
                  handleCreateFolder(null);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
                <span>Nova Pasta</span>
              </button>
              <button
                onClick={() => {
                  setContextMenu(null);
                  handleCreateNewFlow(null);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-sky-500" />
                <span>Novo Fluxo</span>
              </button>
              <div className="my-1 border-t border-slate-200 dark:border-slate-800" />
              <button
                disabled={!copiedItem}
                onClick={() => {
                  setContextMenu(null);
                  handlePaste(null);
                }}
                className={`w-full px-3 py-1.5 flex items-center gap-2.5 transition-colors ${
                  copiedItem
                    ? 'hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400'
                    : 'opacity-40 cursor-not-allowed'
                }`}
              >
                <Clipboard className="w-3.5 h-3.5 text-slate-400" />
                <span>Colar</span>
              </button>
              <button
                onClick={() => {
                  setContextMenu(null);
                  window.location.reload();
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                <span>Atualizar</span>
              </button>
            </>
          )}

          {/* Folder Menu */}
          {contextMenu.target.type === 'folder' && (
            <>
              <button
                onClick={() => {
                  const folder = (contextMenu.target as any).folder;
                  setContextMenu(null);
                  handleCreateNewFlow(folder.id);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-sky-500" />
                <span>Novo Fluxo</span>
              </button>
              <button
                onClick={() => {
                  const folder = (contextMenu.target as any).folder;
                  setContextMenu(null);
                  handleCreateFolder(folder.id);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
                <span>Nova Subpasta</span>
              </button>
              <div className="my-1 border-t border-slate-200 dark:border-slate-800" />
              <button
                onClick={() => {
                  const folder = (contextMenu.target as any).folder;
                  startRenaming(folder.id, folder.name);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Renomear</span>
              </button>
              <button
                onClick={() => {
                  const folder = (contextMenu.target as any).folder;
                  setCopiedItem({ id: folder.id, type: 'folder' });
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copiar Pasta</span>
              </button>
              <button
                onClick={() => {
                  const folder = (contextMenu.target as any).folder;
                  setContextMenu(null);
                  handleExportFolder(folder);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Exportar Pasta</span>
              </button>
              <div className="my-1 border-t border-slate-200 dark:border-slate-800" />
              <button
                onClick={() => {
                  const folder = (contextMenu.target as any).folder;
                  setContextMenu(null);
                  if (confirm(`Deseja excluir a pasta "${folder.name}" e seu conteúdo?`)) {
                    deleteFolder(folder.id);
                  }
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2.5 text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Pasta</span>
              </button>
            </>
          )}

          {/* Flow Menu */}
          {contextMenu.target.type === 'flow' && (
            <>
              <button
                onClick={() => {
                  const flow = (contextMenu.target as any).flow;
                  setSelectedFlowId(flow.id);
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 transition-colors font-semibold"
              >
                <Eye className="w-3.5 h-3.5 text-sky-500" />
                <span>Abrir Fluxo</span>
              </button>
              <button
                onClick={() => {
                  const flow = (contextMenu.target as any).flow;
                  startRenaming(flow.id, flow.name);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Renomear</span>
              </button>
              <button
                onClick={() => {
                  const flow = (contextMenu.target as any).flow;
                  duplicateFlow(flow.id);
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Duplicar Fluxo</span>
              </button>
              <button
                onClick={() => {
                  const flow = (contextMenu.target as any).flow;
                  setContextMenu(null);
                  handleExportFlow(flow);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Exportar JSON</span>
              </button>
              <button
                onClick={() => {
                  const flow = (contextMenu.target as any).flow;
                  setContextMenu(null);
                  handleMoveFlowPrompt(flow);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              >
                <Move className="w-3.5 h-3.5 text-slate-400" />
                <span>Mover para Pasta</span>
              </button>
              <div className="my-1 border-t border-slate-200 dark:border-slate-800" />
              <button
                onClick={() => {
                  const flow = (contextMenu.target as any).flow;
                  setContextMenu(null);
                  if (confirm(`Deseja excluir o fluxo "${flow.name}"?`)) {
                    deleteFlow(flow.id);
                  }
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2.5 text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Fluxo</span>
              </button>
            </>
          )}
        </div>
      )}
    </aside>
  );
};
