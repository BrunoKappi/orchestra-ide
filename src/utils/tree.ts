import type {
  DeploymentFolderEntity,
  DeploymentNodeEntity,
  DeploymentTreeNode,
  DerivationTreeNode,
  ObjectEntity,
  TemplateEntity,
} from '../types/domain';

export function buildDerivationTree(
  templates: TemplateEntity[],
  objects: ObjectEntity[],
  searchQuery: string = ''
): DerivationTreeNode[] {
  const query = searchQuery.toLowerCase().trim();

  // Root templates are those with parentTemplateId === null
  const rootTemplates = templates.filter((t) => !t.parentTemplateId);

  function processTemplate(t: TemplateEntity): DerivationTreeNode {
    // Child templates derived from this template
    const childTemplates = templates
      .filter((ct) => ct.parentTemplateId === t.id)
      .map((ct) => processTemplate(ct));

    // Instances belonging to this template
    const instances: DerivationTreeNode[] = objects
      .filter((o) => o.templateId === t.id)
      .map((o) => ({
        id: `inst_${o.id}`,
        name: o.name,
        type: 'instance' as const,
        entityId: o.id,
        parentTemplateId: t.id,
        description: o.description,
        children: [],
      }));

    const isRoot = !t.parentTemplateId;

    return {
      id: `tmpl_${t.id}`,
      name: t.name,
      type: isRoot ? 'root_template' : 'derived_template',
      entityId: t.id,
      parentTemplateId: t.parentTemplateId,
      description: t.description,
      children: [...childTemplates, ...instances],
    };
  }

  const nodes = rootTemplates.map((rt) => processTemplate(rt));

  if (!query) return nodes;

  // Filter tree based on query
  function filterNode(node: DerivationTreeNode): DerivationTreeNode | null {
    const matchesSelf =
      node.name.toLowerCase().includes(query) ||
      node.description.toLowerCase().includes(query);

    const filteredChildren = node.children
      .map((child) => filterNode(child))
      .filter((c): c is DerivationTreeNode => c !== null);

    if (matchesSelf || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren,
      };
    }
    return null;
  }

  return nodes
    .map((n) => filterNode(n))
    .filter((n): n is DerivationTreeNode => n !== null);
}

export function buildDeploymentTree(
  folders: DeploymentFolderEntity[],
  nodes: DeploymentNodeEntity[],
  objects: ObjectEntity[],
  templates: TemplateEntity[],
  searchQuery: string = ''
): DeploymentTreeNode[] {
  const query = searchQuery.toLowerCase().trim();
  const templateMap = new Map(templates.map((t) => [t.id, t.name]));
  const objectMap = new Map(objects.map((o) => [o.id, o]));

  function getFolderNode(folder: DeploymentFolderEntity): DeploymentTreeNode {
    // Child folders
    const childFolders = folders
      .filter((f) => f.parentFolderId === folder.id)
      .sort((a, b) => a.order - b.order)
      .map((f) => getFolderNode(f));

    // Objects inside this folder
    const childObjectNodes: DeploymentTreeNode[] = nodes
      .filter((n) => n.type === 'object' && n.parentFolderId === folder.id)
      .map((n) => {
        const obj = objectMap.get(n.targetId);
        return {
          id: `dep_obj_${n.id}`,
          name: obj ? obj.name : 'Unknown Object',
          type: 'object' as const,
          targetId: n.targetId,
          parentFolderId: folder.id,
          order: n.order,
          children: [],
          objectDetail: obj,
          templateName: obj ? templateMap.get(obj.templateId) || 'Unknown Template' : '',
        };
      });

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

  // Root level folders
  const rootFolders = folders
    .filter((f) => !f.parentFolderId)
    .sort((a, b) => a.order - b.order)
    .map((f) => getFolderNode(f));

  // Root level unassigned objects
  const rootUnassignedNodes: DeploymentTreeNode[] = nodes
    .filter((n) => n.type === 'object' && !n.parentFolderId)
    .map((n) => {
      const obj = objectMap.get(n.targetId);
      return {
        id: `dep_obj_${n.id}`,
        name: obj ? obj.name : 'Unassigned Object',
        type: 'object' as const,
        targetId: n.targetId,
        parentFolderId: null,
        order: n.order,
        children: [],
        objectDetail: obj,
        templateName: obj ? templateMap.get(obj.templateId) || 'Unknown Template' : '',
      };
    });

  const fullTree = [...rootFolders, ...rootUnassignedNodes];

  if (!query) return fullTree;

  function filterDepNode(node: DeploymentTreeNode): DeploymentTreeNode | null {
    const matchesSelf = node.name.toLowerCase().includes(query);
    const filteredChildren = node.children
      .map((child) => filterDepNode(child))
      .filter((c): c is DeploymentTreeNode => c !== null);

    if (matchesSelf || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren,
      };
    }
    return null;
  }

  return fullTree
    .map((n) => filterDepNode(n))
    .filter((n): n is DeploymentTreeNode => n !== null);
}
