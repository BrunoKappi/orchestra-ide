import type { DeploymentFolderEntity, DeploymentNodeEntity } from '../types/domain';
import { STORAGE_KEYS } from './storageKey';

export class DeploymentRepository {
  // Folders
  public getFolders(): DeploymentFolderEntity[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DEPLOYMENT_FOLDERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveFolder(folder: DeploymentFolderEntity): DeploymentFolderEntity {
    const all = this.getFolders();
    const index = all.findIndex((f) => f.id === folder.id);
    if (index >= 0) {
      all[index] = { ...folder, updatedAt: new Date().toISOString() };
    } else {
      all.push(folder);
    }
    localStorage.setItem(STORAGE_KEYS.DEPLOYMENT_FOLDERS, JSON.stringify(all));
    return folder;
  }

  public deleteFolder(id: string): void {
    let folders = this.getFolders();
    let nodes = this.getNodes();

    const folderIdsToDelete = new Set<string>([id]);
    let addedAny = true;
    while (addedAny) {
      addedAny = false;
      for (const f of folders) {
        if (f.parentFolderId && folderIdsToDelete.has(f.parentFolderId) && !folderIdsToDelete.has(f.id)) {
          folderIdsToDelete.add(f.id);
          addedAny = true;
        }
      }
    }

    folders = folders.filter((f) => !folderIdsToDelete.has(f.id));
    localStorage.setItem(STORAGE_KEYS.DEPLOYMENT_FOLDERS, JSON.stringify(folders));

    nodes = nodes.filter((n) => !folderIdsToDelete.has(n.targetId) && (!n.parentFolderId || !folderIdsToDelete.has(n.parentFolderId)));
    localStorage.setItem(STORAGE_KEYS.DEPLOYMENT_NODES, JSON.stringify(nodes));
  }

  // Nodes
  public getNodes(): DeploymentNodeEntity[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DEPLOYMENT_NODES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveNode(node: DeploymentNodeEntity): DeploymentNodeEntity {
    const all = this.getNodes();
    const index = all.findIndex((n) => n.id === node.id);
    if (index >= 0) {
      all[index] = { ...node, updatedAt: new Date().toISOString() };
    } else {
      all.push(node);
    }
    localStorage.setItem(STORAGE_KEYS.DEPLOYMENT_NODES, JSON.stringify(all));
    return node;
  }

  public deleteNode(id: string): void {
    let all = this.getNodes();
    all = all.filter((n) => n.id !== id);
    localStorage.setItem(STORAGE_KEYS.DEPLOYMENT_NODES, JSON.stringify(all));
  }

  public deleteNodeByTargetId(targetId: string): void {
    let all = this.getNodes();
    all = all.filter((n) => n.targetId !== targetId);
    localStorage.setItem(STORAGE_KEYS.DEPLOYMENT_NODES, JSON.stringify(all));
  }

  public saveAllFolders(folders: DeploymentFolderEntity[]): void {
    localStorage.setItem(STORAGE_KEYS.DEPLOYMENT_FOLDERS, JSON.stringify(folders));
  }

  public saveAllNodes(nodes: DeploymentNodeEntity[]): void {
    localStorage.setItem(STORAGE_KEYS.DEPLOYMENT_NODES, JSON.stringify(nodes));
  }
}

export const deploymentRepo = new DeploymentRepository();
