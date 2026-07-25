import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Boxes,
  Box,
  Copy,
  Download,
  FolderInput,
  Trash2,
  Edit2,
} from 'lucide-react';
import type { DerivationTreeNode } from '../../types/domain';
import { useObjectModelStore } from '../../store/useObjectModelStore';
import { ContextMenu, type ContextMenuItem } from '../../components/ui/ContextMenu';
import { buildDerivationTree } from '../../utils/tree';
import { cn } from '../../utils/cn';

export const DerivationTree: React.FC = () => {
  const {
    templates,
    objects,
    selectedEntity,
    searchQuery,
    selectEntity,
    createRootTemplate,
    createDerivedTemplate,
    createInstance,
    renameEntity,
    duplicateEntity,
    deleteEntity,
    openExportModal,
    openImportModal,
  } = useObjectModelStore();

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    ...templates.reduce((acc, t) => ({ ...acc, [`tmpl_${t.id}`]: true }), {}),
  });

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: DerivationTreeNode | null;
  } | null>(null);

  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  const treeNodes = buildDerivationTree(templates, objects, searchQuery);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleContextMenu = (e: React.MouseEvent, node: DerivationTreeNode | null) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  const startRename = (node: DerivationTreeNode) => {
    setEditingNodeId(node.id);
    setEditingName(node.name);
  };

  const submitRename = (node: DerivationTreeNode) => {
    if (editingName.trim()) {
      const type = node.type === 'instance' ? 'instance' : 'template';
      renameEntity(node.entityId, type, editingName.trim());
    }
    setEditingNodeId(null);
  };

  const getEmptyAreaMenuItems = (): ContextMenuItem[] => [
    {
      label: 'Criar Novo Template Base',
      icon: <Boxes className="w-3.5 h-3.5 text-sky-500" />,
      action: () => createRootTemplate('New Root Template'),
    },
    {
      label: 'Importar JSON',
      icon: <FolderInput className="w-3.5 h-3.5" />,
      action: () => openImportModal(),
    },
  ];

  const getContextMenuItems = (node: DerivationTreeNode): ContextMenuItem[] => {
    const isTemplate = node.type !== 'instance';
    const items: ContextMenuItem[] = [];

    if (isTemplate) {
      items.push({
        label: 'Criar Template Derivado',
        icon: <Boxes className="w-3.5 h-3.5 text-sky-500" />,
        action: () => {
          createDerivedTemplate(node.entityId);
          setExpandedNodes((prev) => ({ ...prev, [node.id]: true }));
        },
      });
      items.push({
        label: 'Criar Instância',
        icon: <Box className="w-3.5 h-3.5 text-emerald-500" />,
        action: () => {
          createInstance(node.entityId);
          setExpandedNodes((prev) => ({ ...prev, [node.id]: true }));
        },
      });
    }

    items.push({
      label: 'Renomear',
      icon: <Edit2 className="w-3.5 h-3.5" />,
      action: () => startRename(node),
    });

    items.push({
      label: 'Duplicar',
      icon: <Copy className="w-3.5 h-3.5" />,
      action: () => {
        const type = node.type === 'instance' ? 'instance' : 'template';
        duplicateEntity(node.entityId, type);
      },
    });

    items.push({
      label: 'Exportar JSON',
      icon: <Download className="w-3.5 h-3.5" />,
      action: () => {
        const type = node.type === 'instance' ? 'instance' : 'template';
        openExportModal(node.entityId, type);
      },
      divider: true,
    });

    items.push({
      label: 'Importar JSON',
      icon: <FolderInput className="w-3.5 h-3.5" />,
      action: () => openImportModal(),
    });

    items.push({
      label: 'Excluir',
      icon: <Trash2 className="w-3.5 h-3.5 text-rose-500" />,
      danger: true,
      divider: true,
      action: () => {
        const type = node.type === 'instance' ? 'instance' : 'template';
        deleteEntity(node.entityId, type);
      },
    });

    return items;
  };

  const renderNode = (node: DerivationTreeNode, depth: number = 0) => {
    const isExpanded = expandedNodes[node.id] ?? true;
    const hasChildren = node.children.length > 0;
    const isSelected =
      selectedEntity?.id === node.entityId &&
      ((selectedEntity.type === 'instance' && node.type === 'instance') ||
        (selectedEntity.type === 'template' && node.type !== 'instance'));

    const isEditing = editingNodeId === node.id;

    return (
      <div key={node.id} className="select-none">
        <div
          onClick={(e) => {
            e.stopPropagation();
            const type = node.type === 'instance' ? 'instance' : 'template';
            selectEntity(node.entityId, type);
          }}
          onContextMenu={(e) => handleContextMenu(e, node)}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          className={cn(
            'group flex items-center gap-1.5 py-1.5 pr-3 rounded-md text-xs font-medium cursor-pointer transition-colors duration-150',
            isSelected
              ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 font-semibold border-l-2 border-sky-500'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
          )}
        >
          {/* Chevron expand button */}
          <button
            onClick={(e) => toggleExpand(node.id, e)}
            className={cn(
              'p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0 transition-transform',
              !hasChildren && 'opacity-0 pointer-events-none'
            )}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Node type icon */}
          {node.type === 'root_template' && (
            <Boxes className="w-4 h-4 text-sky-500 shrink-0" />
          )}
          {node.type === 'derived_template' && (
            <Boxes className="w-4 h-4 text-indigo-500 shrink-0" />
          )}
          {node.type === 'instance' && (
            <Box className="w-4 h-4 text-emerald-500 shrink-0" />
          )}

          {/* Node label */}
          {isEditing ? (
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={() => submitRename(node)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitRename(node);
                if (e.key === 'Escape') setEditingNodeId(null);
              }}
              autoFocus
              className="flex-1 bg-white dark:bg-slate-900 px-1.5 py-0.5 border border-sky-500 rounded text-xs outline-none"
            />
          ) : (
            <span className="truncate flex-1">{node.name}</span>
          )}

          {/* Type Badge indicator on hover */}
          <span className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 font-normal px-1 rounded bg-slate-100 dark:bg-slate-800 transition-opacity shrink-0">
            {node.type === 'root_template'
              ? 'Template'
              : node.type === 'derived_template'
              ? 'Derived'
              : 'Instance'}
          </span>
        </div>

        {/* Child items */}
        {hasChildren && isExpanded && (
          <div className="flex flex-col">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-hidden"
      onContextMenu={(e) => {
        // Only trigger on the empty area (not on tree nodes)
        if (e.target === e.currentTarget || (e.target as HTMLElement).closest('[data-tree-node]') === null) {
          const treeContent = (e.target as HTMLElement).closest('[data-tree-content]');
          if (treeContent) {
            handleContextMenu(e, null);
          }
        }
      }}
    >

      {/* Tree View list */}
      <div
        data-tree-content="true"
        onContextMenu={(e) => handleContextMenu(e, null)}
        onClick={() => selectEntity(null)}
        className="flex-1 overflow-y-auto p-1.5 space-y-0.5"
      >
        {treeNodes.length > 0 ? (
          treeNodes.map((node) => (
            <div key={node.id} data-tree-node="true">
              {renderNode(node, 0)}
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-xs text-slate-400 space-y-1">
            <p>No templates yet.</p>
            <p className="text-slate-300">Right-click here to create your first template.</p>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.node ? getContextMenuItems(contextMenu.node) : getEmptyAreaMenuItems()}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};
