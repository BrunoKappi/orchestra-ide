import React, { useState } from 'react';
import {
  Folder,
  FolderPlus,
  FilePlus,
  ChevronRight,
  ChevronDown,
  Shapes,
  MoreVertical,
  Edit2,
  Copy,
  Trash2,
  Search,
  FolderOpen,
} from 'lucide-react';
import { useWidgetStore } from '../../store/useWidgetStore';
import type { WidgetTreeNode } from '../../types/domain';
import { cn } from '../../utils/cn';

interface ContextMenuState {
  x: number;
  y: number;
  nodeId: string | null;
  nodeType: 'folder' | 'widget' | 'empty';
  nodeName?: string;
}

export const WidgetTree: React.FC = () => {
  const {
    folders,
    widgets,
    nodes,
    searchQuery,
    setSearchQuery,
    selectedWidgetId,
    selectWidget,
    createWidget,
    renameWidget,
    duplicateWidget,
    deleteWidget,
    createFolder,
    renameFolder,
    deleteFolder,
    moveWidgetToFolder,
  } = useWidgetStore();

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const buildTree = (): WidgetTreeNode[] => {
    const folderMap = new Map<string, WidgetTreeNode>();
    const rootNodes: WidgetTreeNode[] = [];

    folders.forEach((f) => {
      folderMap.set(f.id, {
        id: f.id,
        name: f.name,
        type: 'folder',
        targetId: f.id,
        parentFolderId: f.parentFolderId,
        order: f.order,
        children: [],
      });
    });

    folders.forEach((f) => {
      const node = folderMap.get(f.id)!;
      if (f.parentFolderId && folderMap.has(f.parentFolderId)) {
        folderMap.get(f.parentFolderId)!.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    widgets.forEach((w) => {
      const nodeRef = nodes.find((n) => n.targetId === w.id && n.type === 'widget');
      const parentFolderId = nodeRef ? nodeRef.parentFolderId : null;

      const widgetNode: WidgetTreeNode = {
        id: w.id,
        name: w.name,
        type: 'widget',
        targetId: w.id,
        parentFolderId,
        order: nodeRef ? nodeRef.order : 0,
        children: [],
        widgetDetail: w,
      };

      if (parentFolderId && folderMap.has(parentFolderId)) {
        folderMap.get(parentFolderId)!.children.push(widgetNode);
      } else {
        rootNodes.push(widgetNode);
      }
    });

    return rootNodes;
  };

  const tree = buildTree();

  const filterTree = (items: WidgetTreeNode[]): WidgetTreeNode[] => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();

    return items
      .map((item) => {
        if (item.type === 'folder') {
          const matchingChildren = filterTree(item.children);
          const matchesFolder = item.name.toLowerCase().includes(q);
          if (matchesFolder || matchingChildren.length > 0) {
            return { ...item, children: matchingChildren };
          }
          return null;
        } else {
          return item.name.toLowerCase().includes(q) ? item : null;
        }
      })
      .filter(Boolean) as WidgetTreeNode[];
  };

  const filteredTree = filterTree(tree);

  const startRename = (id: string, currentName: string) => {
    setEditingNodeId(id);
    setEditingName(currentName);
    setContextMenu(null);
  };

  const submitRename = (id: string, type: 'folder' | 'widget') => {
    if (editingName.trim()) {
      if (type === 'folder') {
        renameFolder(id, editingName.trim());
      } else {
        renameWidget(id, editingName.trim());
      }
    }
    setEditingNodeId(null);
  };

  const handleContextMenu = (
    e: React.MouseEvent,
    nodeId: string | null,
    type: 'folder' | 'widget' | 'empty',
    name?: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      nodeId,
      nodeType: type,
      nodeName: name,
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    e.stopPropagation();
    setDraggedWidgetId(widgetId);
    e.dataTransfer.setData('text/plain', widgetId);
  };

  const handleDragOverFolder = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverFolderId !== folderId) {
      setDragOverFolderId(folderId);
    }
  };

  const handleDropOnFolder = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const widgetId = e.dataTransfer.getData('text/plain') || draggedWidgetId;
    if (widgetId && widgetId !== folderId) {
      moveWidgetToFolder(widgetId, folderId);
      setExpandedFolders((prev) => ({ ...prev, [folderId]: true }));
    }
    setDraggedWidgetId(null);
    setDragOverFolderId(null);
  };

  const handleDropOnRoot = (e: React.DragEvent) => {
    e.preventDefault();
    const widgetId = e.dataTransfer.getData('text/plain') || draggedWidgetId;
    if (widgetId) {
      moveWidgetToFolder(widgetId, null);
    }
    setDraggedWidgetId(null);
    setDragOverFolderId(null);
  };

  const renderNode = (node: WidgetTreeNode, depth = 0) => {
    const isFolder = node.type === 'folder';
    const isExpanded = expandedFolders[node.id] ?? true;
    const isSelected = !isFolder && selectedWidgetId === node.id;
    const isEditing = editingNodeId === node.id;
    const isDragTarget = isFolder && dragOverFolderId === node.id;

    return (
      <div
        key={node.id}
        className="select-none"
        onDragOver={(e) => isFolder && handleDragOverFolder(e, node.id)}
        onDragLeave={() => isFolder && setDragOverFolderId(null)}
        onDrop={(e) => isFolder && handleDropOnFolder(e, node.id)}
      >
        <div
          draggable={!isFolder}
          onDragStart={(e) => !isFolder && handleDragStart(e, node.id)}
          onClick={() => {
            if (isFolder) {
              toggleFolder(node.id);
            } else {
              selectWidget(node.id);
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, node.id, isFolder ? 'folder' : 'widget', node.name)}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
          className={cn(
            'flex items-center justify-between py-1.5 pr-2 rounded-lg text-xs font-medium cursor-pointer transition-colors group relative',
            isSelected
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold border-l-2 border-emerald-500'
              : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300',
            isDragTarget && 'bg-amber-100 dark:bg-amber-950/60 border-2 border-amber-500'
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {isFolder ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(node.id);
                }}
                className="p-0.5 hover:bg-slate-300/50 dark:hover:bg-slate-700/50 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>
            ) : (
              <div className="w-3.5 h-3.5" />
            )}

            {isFolder ? (
              isExpanded ? (
                <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-amber-500 shrink-0" />
              )
            ) : (
              <Shapes className="w-4 h-4 text-emerald-500 shrink-0" />
            )}

            {isEditing ? (
              <input
                type="text"
                autoFocus
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => submitRename(node.id, isFolder ? 'folder' : 'widget')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitRename(node.id, isFolder ? 'folder' : 'widget');
                  if (e.key === 'Escape') setEditingNodeId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="px-1.5 py-0.5 text-xs bg-white dark:bg-slate-900 border border-emerald-500 rounded outline-none w-full"
              />
            ) : (
              <span className="truncate">{node.name}</span>
            )}
          </div>

          {!isEditing && (
            <button
              onClick={(e) => handleContextMenu(e, node.id, isFolder ? 'folder' : 'widget', node.name)}
              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-300/50 dark:hover:bg-slate-700/50 rounded text-slate-500 transition-opacity"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {isFolder && isExpanded && (
          <div className="mt-0.5">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      onClick={closeContextMenu}
      onContextMenu={(e) => handleContextMenu(e, null, 'empty')}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDropOnRoot}
      className="flex flex-col h-full overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800"
    >
      {/* Top Search Filter */}
      <div
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.stopPropagation()}
        className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/30"
      >
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar widgets e pastas..."
            className="w-full pl-8 pr-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>


      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[200px]">
        {filteredTree.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            Nenhum widget. Clique com botão direito nesta área para criar uma Pasta ou Widget.
          </div>
        ) : (
          filteredTree.map((node) => renderNode(node))
        )}
      </div>

      {/* Right-Click Context Menu Popup */}
      {contextMenu && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
          className="fixed w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-1 z-50 text-xs animate-in fade-in duration-100"
        >
          {contextMenu.nodeType === 'empty' && (
            <>
              <button
                onClick={() => {
                  createFolder('Nova Pasta', null);
                  closeContextMenu();
                }}
                className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
                <span>Nova Pasta Raiz</span>
              </button>

              <button
                onClick={() => {
                  createWidget('Novo Widget Gráfico', null);
                  closeContextMenu();
                }}
                className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
              >
                <FilePlus className="w-3.5 h-3.5 text-emerald-500" />
                <span>Novo Widget Raiz</span>
              </button>
            </>
          )}

          {contextMenu.nodeType === 'folder' && contextMenu.nodeId && (
            <>
              <button
                onClick={() => {
                  createWidget('Novo Widget', contextMenu.nodeId);
                  closeContextMenu();
                }}
                className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
              >
                <FilePlus className="w-3.5 h-3.5 text-emerald-500" />
                <span>Adicionar Widget</span>
              </button>

              <button
                onClick={() => {
                  createFolder('Nova Subpasta', contextMenu.nodeId);
                  closeContextMenu();
                }}
                className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
                <span>Nova Subpasta</span>
              </button>

              <div className="my-1 border-t border-slate-200 dark:border-slate-800" />

              <button
                onClick={() => startRename(contextMenu.nodeId!, contextMenu.nodeName || '')}
                className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Renomear Pasta</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm(`Excluir pasta "${contextMenu.nodeName}"?`)) {
                    deleteFolder(contextMenu.nodeId!);
                  }
                  closeContextMenu();
                }}
                className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Pasta</span>
              </button>
            </>
          )}

          {contextMenu.nodeType === 'widget' && contextMenu.nodeId && (
            <>
              <button
                onClick={() => startRename(contextMenu.nodeId!, contextMenu.nodeName || '')}
                className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Renomear</span>
              </button>

              <button
                onClick={() => {
                  duplicateWidget(contextMenu.nodeId!);
                  closeContextMenu();
                }}
                className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Duplicar</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm(`Excluir widget "${contextMenu.nodeName}"?`)) {
                    deleteWidget(contextMenu.nodeId!);
                  }
                  closeContextMenu();
                }}
                className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Widget</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
