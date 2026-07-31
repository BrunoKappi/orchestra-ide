import React, { useState, useRef } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Box,
  Edit2,
  Trash2,
  FolderX,
  Rocket,
  PowerOff,
} from 'lucide-react';
import type { DeploymentTreeNode } from '../../types/domain';
import { useObjectModelStore } from '../../store/useObjectModelStore';
import { ContextMenu, type ContextMenuItem } from '../../components/ui/ContextMenu';
import { buildDeploymentTree } from '../../utils/tree';
import { cn } from '../../utils/cn';

export const DeploymentTree: React.FC = () => {
  const {
    deploymentFolders,
    deploymentNodes,
    objects,
    templates,
    searchQuery,
    selectedEntity,
    selectEntity,
    createDeploymentFolder,
    renameDeploymentFolder,
    deleteDeploymentFolder,
    moveObjectToFolder,
    removeNodeFromDeployment,
    deployObject,
    undeployObject,
    deleteEntity,
  } = useObjectModelStore();

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    '__unassigned__': true,
    ...deploymentFolders.reduce((acc, f) => ({ ...acc, [`dep_fold_${f.id}`]: true }), {}),
  });

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: DeploymentTreeNode | null;
  } | null>(null);

  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  // Drag and drop state
  const [draggingObjectId, setDraggingObjectId] = useState<string | null>(null);
  const [dropTargetFolderId, setDropTargetFolderId] = useState<string | null | '__unassigned__'>('__NONE__');
  const dragObjectRef = useRef<string | null>(null);

  const rawTree = buildDeploymentTree(
    deploymentFolders,
    deploymentNodes,
    objects,
    templates,
    searchQuery
  );

  // Split tree into assigned folders and unassigned objects
  const assignedFolderNodes = rawTree.filter((n) => n.type === 'folder');
  // Objects at root level (no folder) from the flat deployment nodes
  const assignedObjectIds = new Set(
    deploymentNodes
      .filter((n) => n.type === 'object' && n.parentFolderId !== null)
      .map((n) => n.targetId)
  );
  const unassignedObjects = objects.filter((o) => !assignedObjectIds.has(o.id));

  const toggleFolder = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => ({ ...prev, [key]: !prev[key] }));
    selectEntity(null);
  };

  const handleContextMenu = (e: React.MouseEvent, node: DeploymentTreeNode | null) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  const startFolderRename = (folderId: string, currentName: string) => {
    setEditingFolderId(folderId);
    setEditingName(currentName);
  };

  const submitFolderRename = (folderId: string) => {
    if (editingName.trim()) {
      renameDeploymentFolder(folderId, editingName.trim());
    }
    setEditingFolderId(null);
  };

  // ─── Drag Handlers ────────────────────────────────────────────────────────
  const onDragStart = (objectId: string) => {
    setDraggingObjectId(objectId);
    dragObjectRef.current = objectId;
  };

  const onDragEnd = () => {
    setDraggingObjectId(null);
    setDropTargetFolderId('__NONE__');
    dragObjectRef.current = null;
  };

  const onDragOverFolder = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetFolderId(folderId === null ? '__unassigned__' : folderId);
  };

  const onDropOnFolder = (targetFolderId: string | null) => {
    const objectId = dragObjectRef.current;
    if (!objectId) return;
    moveObjectToFolder(objectId, targetFolderId);
    setDraggingObjectId(null);
    setDropTargetFolderId('__NONE__');
    dragObjectRef.current = null;
  };

  // ─── Context Menu Items ────────────────────────────────────────────────────
  const getEmptyAreaMenuItems = (): ContextMenuItem[] => [
    {
      label: 'Nova Pasta',
      icon: <Folder className="w-3.5 h-3.5 text-amber-500" />,
      action: () => {
        const id = createDeploymentFolder('New Folder');
        setExpandedFolders((prev) => ({ ...prev, [`dep_fold_${id}`]: true }));
        setTimeout(() => startFolderRename(id, 'New Folder'), 50);
      },
    },
  ];

  const getFolderContextMenuItems = (node: DeploymentTreeNode): ContextMenuItem[] => [
    {
      label: 'Renomear Pasta',
      icon: <Edit2 className="w-3.5 h-3.5" />,
      action: () => startFolderRename(node.targetId, node.name),
    },
    {
      label: 'Nova Subpasta',
      icon: <Folder className="w-3.5 h-3.5 text-amber-400" />,
      action: () => {
        const id = createDeploymentFolder('New Folder', node.targetId);
        setExpandedFolders((prev) => ({
          ...prev,
          [`dep_fold_${node.targetId}`]: true,
          [`dep_fold_${id}`]: true,
        }));
        setTimeout(() => startFolderRename(id, 'New Folder'), 50);
      },
    },
    {
      label: 'Excluir Pasta',
      icon: <Trash2 className="w-3.5 h-3.5 text-rose-500" />,
      danger: true,
      divider: true,
      action: () => {
        if (confirm(`Tem certeza que deseja excluir a pasta "${node.name}" e todo seu conteúdo?`)) {
          deleteDeploymentFolder(node.targetId);
        }
      },
    },
  ];

  const getObjectContextMenuItems = (node: DeploymentTreeNode): ContextMenuItem[] => {
    const targetObj = objects.find((o) => o.id === node.targetId);
    const isDeployed = targetObj ? targetObj.isDeployed !== false : true;

    return [
      {
        label: 'Selecionar Objeto',
        icon: <Box className="w-3.5 h-3.5 text-sky-500" />,
        action: () => selectEntity(node.targetId, 'instance'),
      },
      isDeployed
        ? {
            label: 'Desfazer Deploy (Undeploy)',
            icon: <PowerOff className="w-3.5 h-3.5 text-amber-500" />,
            action: () => undeployObject(node.targetId),
            divider: true,
          }
        : {
            label: 'Fazer Deploy (Deploy)',
            icon: <Rocket className="w-3.5 h-3.5 text-emerald-500" />,
            action: () => deployObject(node.targetId),
            divider: true,
          },
      {
        label: 'Mover para Sem Destino',
        icon: <FolderX className="w-3.5 h-3.5 text-slate-400" />,
        action: () => moveObjectToFolder(node.targetId, null),
      },
      {
        label: 'Remover do Deployment',
        icon: <Trash2 className="w-3.5 h-3.5 text-rose-500" />,
        danger: true,
        divider: true,
        action: () => {
          const deployNode = deploymentNodes.find(
            (n) => n.type === 'object' && n.targetId === node.targetId
          );
          if (deployNode) removeNodeFromDeployment(deployNode.id);
        },
      },
      {
        label: 'Excluir Objeto',
        icon: <Trash2 className="w-3.5 h-3.5 text-rose-600" />,
        danger: true,
        action: () => {
          if (confirm(`Tem certeza que deseja excluir permanentemente o objeto "${node.name}"?`)) {
            deleteEntity(node.targetId, 'instance');
          }
        },
      },
    ];
  };

  // ─── Render Object Row ─────────────────────────────────────────────────────
  const renderObjectRow = (node: DeploymentTreeNode, depth: number) => {
    const targetObj = objects.find((o) => o.id === node.targetId);
    const isDeployed = targetObj ? targetObj.isDeployed !== false : true;
    const isSelected = selectedEntity?.id === node.targetId && selectedEntity.type === 'instance';
    const isDragging = draggingObjectId === node.targetId;

    return (
      <div
        key={`obj-${node.targetId}`}
        draggable
        onDragStart={() => onDragStart(node.targetId)}
        onDragEnd={onDragEnd}
        onClick={(e) => {
          e.stopPropagation();
          selectEntity(node.targetId, 'instance');
        }}
        onContextMenu={(e) => handleContextMenu(e, node)}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        className={cn(
          'group flex items-center gap-1.5 py-1.5 pr-3 rounded-md text-xs font-medium cursor-grab active:cursor-grabbing transition-all duration-150',
          isDragging && 'opacity-40',
          isSelected
            ? isDeployed
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold border-l-2 border-emerald-500'
              : 'bg-slate-500/10 text-slate-700 dark:text-slate-300 font-semibold border-l-2 border-slate-400'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
        )}
      >
        <span className="w-4 shrink-0" />
        <Box
          className={cn(
            'w-4 h-4 shrink-0 transition-colors',
            isDeployed ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'
          )}
        />
        <span className="truncate flex-1">{node.name}</span>
        {node.templateName && (
          <span className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 font-normal px-1 rounded bg-slate-100 dark:bg-slate-800 shrink-0 transition-opacity">
            {node.templateName}
          </span>
        )}

        {/* Delete action button on hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Tem certeza que deseja excluir permanentemente o objeto "${node.name}"?`)) {
              deleteEntity(node.targetId, 'instance');
            }
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 shrink-0 transition-opacity"
          title="Excluir Objeto"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  // ─── Render Folder Node ────────────────────────────────────────────────────
  const renderFolderNode = (node: DeploymentTreeNode, depth: number): React.ReactNode => {
    const key = `dep_fold_${node.targetId}`;
    const isExpanded = expandedFolders[key] ?? true;
    const isDropTarget = dropTargetFolderId === node.targetId;
    const isEditing = editingFolderId === node.targetId;

    return (
      <div key={key}>
        <div
          onDragOver={(e) => onDragOverFolder(e, node.targetId)}
          onDragLeave={() => setDropTargetFolderId('__NONE__')}
          onDrop={() => onDropOnFolder(node.targetId)}
          onClick={(e) => toggleFolder(key, e)}
          onContextMenu={(e) => handleContextMenu(e, node)}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          className={cn(
            'group flex items-center gap-1.5 py-1.5 pr-3 rounded-md text-xs font-semibold cursor-pointer transition-all duration-150',
            isDropTarget
              ? 'bg-amber-100 dark:bg-amber-900/40 border border-amber-400 text-amber-700'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
          )}
        >
          <button className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>

          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-amber-500 shrink-0" />
          )}

          {isEditing ? (
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={() => submitFolderRename(node.targetId)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitFolderRename(node.targetId);
                if (e.key === 'Escape') setEditingFolderId(null);
              }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-white dark:bg-slate-900 px-1.5 py-0.5 border border-amber-400 rounded text-xs outline-none"
            />
          ) : (
            <span className="truncate flex-1">{node.name}</span>
          )}

          <span className="opacity-0 group-hover:opacity-70 text-[10px] text-slate-400 font-normal shrink-0 group-hover:hidden mr-1">
            {node.children.length}
          </span>

          {/* Delete action button on hover */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Tem certeza que deseja excluir a pasta "${node.name}" e todo seu conteúdo?`)) {
                deleteDeploymentFolder(node.targetId);
              }
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 shrink-0 transition-opacity"
            title="Excluir Pasta"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
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

  // ─── Render Unassigned pseudo-folder ──────────────────────────────────────
  const renderUnassignedFolder = () => {
    if (unassignedObjects.length === 0) return null;
    const isExpanded = expandedFolders['__unassigned__'] ?? true;
    const isDropTarget = dropTargetFolderId === '__unassigned__';

    return (
      <div key="__unassigned__">
        <div
          onDragOver={(e) => onDragOverFolder(e, null)}
          onDragLeave={() => setDropTargetFolderId('__NONE__')}
          onDrop={() => onDropOnFolder(null)}
          onClick={(e) => {
            e.stopPropagation();
            setExpandedFolders((prev) => ({ ...prev, '__unassigned__': !prev['__unassigned__'] }));
            selectEntity(null);
          }}
          className={cn(
            'flex items-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold cursor-pointer transition-all duration-150 mb-1',
            isDropTarget
              ? 'bg-orange-100 dark:bg-orange-900/40 border border-orange-400 text-orange-700'
              : 'bg-orange-50/60 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400 hover:bg-orange-100/60 dark:hover:bg-orange-900/20 border border-orange-200 dark:border-orange-900/30'
          )}
        >
          <button className="p-0.5 shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
          <FolderX className="w-4 h-4 text-orange-400 shrink-0" />
          <span className="flex-1">Sem Destino</span>
          <span className="text-[10px] font-normal text-orange-400 px-1 rounded bg-orange-100 dark:bg-orange-900/30">
            {unassignedObjects.length}
          </span>
        </div>

        {isExpanded && (
          <div className="flex flex-col mb-1">
            {unassignedObjects.length === 0 ? (
              <div
                onDragOver={(e) => onDragOverFolder(e, null)}
                onDragLeave={() => setDropTargetFolderId('__NONE__')}
                onDrop={() => onDropOnFolder(null)}
                className={cn(
                  'py-3 text-center text-[11px] text-slate-400 rounded-md mx-2 my-1 border-2 border-dashed transition-colors',
                  isDropTarget ? 'border-orange-400 bg-orange-50' : 'border-slate-200 dark:border-slate-700'
                )}
              >
                Arraste objetos aqui
              </div>
            ) : (
              unassignedObjects.map((obj) => {
                const tmpl = templates.find((t) => t.id === obj.templateId);
                const isDeployed = obj.isDeployed !== false;
                const isSelected = selectedEntity?.id === obj.id && selectedEntity.type === 'instance';
                const isDragging = draggingObjectId === obj.id;
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
                return (
                  <div
                    key={`unassigned-${obj.id}`}
                    draggable
                    onDragStart={() => onDragStart(obj.id)}
                    onDragEnd={onDragEnd}
                    onClick={(e) => {
                      e.stopPropagation();
                      selectEntity(obj.id, 'instance');
                    }}
                    onContextMenu={(e) => handleContextMenu(e, nodeObj)}
                    style={{ paddingLeft: '22px' }}
                    className={cn(
                      'group flex items-center gap-1.5 py-1.5 pr-3 rounded-md text-xs font-medium cursor-grab active:cursor-grabbing transition-all duration-150',
                      isDragging && 'opacity-40',
                      isSelected
                        ? isDeployed
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold border-l-2 border-emerald-500'
                          : 'bg-slate-500/10 text-slate-700 dark:text-slate-300 font-semibold border-l-2 border-slate-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                    )}
                  >
                    <Box
                      className={cn(
                        'w-4 h-4 shrink-0 transition-colors',
                        isDeployed ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'
                      )}
                    />
                    <span className="truncate flex-1">{obj.name}</span>
                    {tmpl && (
                      <span className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 font-normal px-1 rounded bg-slate-100 dark:bg-slate-800 shrink-0 transition-opacity">
                        {tmpl.name}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Tree Content */}
      <div
        data-tree-content="true"
        onContextMenu={(e) => {
          // Trigger on clicks directly on the scroll container (empty area)
          if ((e.target as HTMLElement).closest('[data-tree-node]') === null) {
            handleContextMenu(e, null);
          }
        }}
        onClick={() => selectEntity(null)}
        className="flex-1 overflow-y-auto p-1.5 space-y-0.5"
      >
        {/* Unassigned pseudo-folder always at top */}
        {renderUnassignedFolder()}

        {/* Assigned folders */}
        {assignedFolderNodes.map((node) => renderFolderNode(node, 0))}

        {assignedFolderNodes.length === 0 && unassignedObjects.length === 0 && (
          <div className="p-4 text-center text-xs text-slate-400">
            Nenhum objeto ou pasta criado ainda.
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={
            contextMenu.node === null
              ? getEmptyAreaMenuItems()
              : contextMenu.node.type === 'folder'
              ? getFolderContextMenuItems(contextMenu.node)
              : getObjectContextMenuItems(contextMenu.node)
          }
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};
