import React, { useState, useRef } from 'react';
import {
  FolderPlus,
  FilePlus2,
  Search,
  Folder,
  FolderOpen,
  Monitor,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  ExternalLink,
  Play,
} from 'lucide-react';
import { useScreenStore } from '../../store/useScreenStore';
import type { ScreenTreeNode } from '../../types/domain';
import { cn } from '../../utils/cn';

interface ContextMenuState {
  x: number;
  y: number;
  node: ScreenTreeNode;
}

interface RenameState {
  id: string;
  type: 'screen' | 'folder';
  value: string;
}

export const ScreenTree: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    selectedScreenId,
    selectScreen,
    createScreen,
    createFolder,
    renameScreen,
    renameFolder,
    duplicateScreen,
    deleteScreen,
    deleteFolder,
    getScreenTree,
  } = useScreenStore();

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renaming, setRenaming] = useState<RenameState | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const tree = getScreenTree();

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const handleContextMenu = (e: React.MouseEvent, node: ScreenTreeNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  const closeContextMenu = () => setContextMenu(null);

  const startRename = (id: string, type: 'screen' | 'folder', currentName: string) => {
    setRenaming({ id, type, value: currentName });
    closeContextMenu();
    setTimeout(() => renameInputRef.current?.focus(), 50);
  };

  const commitRename = () => {
    if (!renaming) return;
    const name = renaming.value.trim();
    if (name) {
      if (renaming.type === 'screen') renameScreen(renaming.id, name);
      else renameFolder(renaming.id, name);
    }
    setRenaming(null);
  };

  const openRuntime = (screenId: string) => {
    window.open(`/#/screen/${screenId}`, '_blank');
    closeContextMenu();
  };

  const filterNodes = (nodes: ScreenTreeNode[], query: string): ScreenTreeNode[] => {
    if (!query) return nodes;
    return nodes.flatMap((n) => {
      if (n.type === 'folder') {
        const filtered = filterNodes(n.children, query);
        if (filtered.length > 0) return [{ ...n, children: filtered }];
        return [];
      }
      return n.name.toLowerCase().includes(query.toLowerCase()) ? [n] : [];
    });
  };

  const renderNode = (node: ScreenTreeNode, depth = 0): React.ReactNode => {
    const isFolder = node.type === 'folder';
    const isExpanded = expandedFolders.has(node.targetId);
    const isSelected = node.type === 'screen' && selectedScreenId === node.targetId;
    const isRenaming = renaming?.id === node.targetId;

    return (
      <div key={node.id}>
        <div
          className={cn(
            'group flex items-center gap-1.5 px-2 py-1 rounded-md text-xs cursor-pointer select-none transition-colors duration-100',
            isSelected
              ? 'bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 font-semibold'
              : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
          )}
          style={{ paddingLeft: `${8 + depth * 14}px` }}
          onClick={() => {
            if (isFolder) toggleFolder(node.targetId);
            else selectScreen(node.targetId);
          }}
          onContextMenu={(e) => handleContextMenu(e, node)}
          onDoubleClick={() => {
            if (!isFolder) openRuntime(node.targetId);
          }}
        >
          {isFolder ? (
            <>
              <span className="text-slate-400 shrink-0">
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </span>
              {isExpanded ? (
                <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              )}
            </>
          ) : (
            <>
              <span className="w-3.5 shrink-0" />
              <Monitor className="w-3.5 h-3.5 text-violet-500 shrink-0" />
            </>
          )}

          {isRenaming ? (
            <input
              ref={renameInputRef}
              value={renaming.value}
              onChange={(e) => setRenaming((r) => r ? { ...r, value: e.target.value } : null)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setRenaming(null);
              }}
              className="flex-1 min-w-0 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs px-1 py-0.5 rounded outline-none border border-violet-500"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="flex-1 min-w-0 truncate font-medium">{node.name}</span>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); handleContextMenu(e, node); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-opacity"
          >
            <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {isFolder && isExpanded && (
          <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  const visibleTree = filterNodes(tree, searchQuery);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Telas</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => createFolder()}
              title="Nova Pasta"
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => createScreen()}
              title="Nova Tela"
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar telas..."
            className="w-full pl-8 pr-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-violet-500 transition-colors"
          />
        </div>
      </div>

      {/* Tree */}
      <div
        className="flex-1 overflow-y-auto p-2 space-y-0.5"
        onClick={closeContextMenu}
      >
        {visibleTree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <Monitor className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-3" />
            <p className="text-xs text-slate-500 font-medium">Nenhuma tela criada</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-600 mt-1">Clique no + para criar uma nova tela</p>
          </div>
        ) : (
          visibleTree.map((node) => renderNode(node, 0))
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeContextMenu} />
          <div
            className="fixed z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 min-w-40 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in duration-100"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.node.type === 'screen' && (
              <>
                <button
                  onClick={() => { selectScreen(contextMenu.node.targetId); closeContextMenu(); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                >
                  <Monitor className="w-3.5 h-3.5 text-violet-500" />
                  Abrir Tela
                </button>
                <button
                  onClick={() => openRuntime(contextMenu.node.targetId)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-500" />
                  Abrir em Runtime
                  <ExternalLink className="w-3 h-3 text-slate-400 dark:text-slate-500 ml-auto" />
                </button>
                <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
              </>
            )}
            <button
              onClick={() => startRename(contextMenu.node.targetId, contextMenu.node.type as 'screen' | 'folder', contextMenu.node.name)}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-400" />
              Renomear
            </button>
            {contextMenu.node.type === 'screen' && (
              <button
                onClick={() => { duplicateScreen(contextMenu.node.targetId); closeContextMenu(); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                Duplicar
              </button>
            )}
            {contextMenu.node.type === 'screen' && (
              <button
                onClick={() => { createScreen('Nova Tela', contextMenu.node.parentFolderId); closeContextMenu(); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
              >
                <FilePlus2 className="w-3.5 h-3.5 text-slate-400" />
                Nova Tela Aqui
              </button>
            )}
            {contextMenu.node.type === 'folder' && (
              <>
                <button
                  onClick={() => { createScreen('Nova Tela', contextMenu.node.targetId); toggleFolder(contextMenu.node.targetId); closeContextMenu(); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                >
                  <FilePlus2 className="w-3.5 h-3.5 text-slate-400" />
                  Nova Tela na Pasta
                </button>
                <button
                  onClick={() => { createFolder('Nova Pasta', contextMenu.node.targetId); toggleFolder(contextMenu.node.targetId); closeContextMenu(); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-slate-400" />
                  Nova Subpasta
                </button>
              </>
            )}
            <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
            <button
              onClick={() => {
                const isFolder = contextMenu.node.type === 'folder';
                if (window.confirm(`Excluir "${contextMenu.node.name}"${isFolder ? ' e todo seu conteúdo' : ''}?`)) {
                  if (isFolder) deleteFolder(contextMenu.node.targetId);
                  else deleteScreen(contextMenu.node.targetId);
                }
                closeContextMenu();
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 text-left"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir
            </button>
          </div>
        </>
      )}
    </div>
  );
};

