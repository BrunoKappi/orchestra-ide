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
    let all = this.getFolders();
    all = all.filter((f) => f.id !== id);
    localStorage.setItem(STORAGE_KEYS.DEPLOYMENT_FOLDERS, JSON.stringify(all));

    // Also remove deployment nodes referencing this folder or inside this folder
    let nodes = this.getNodes();
    nodes = nodes.filter((n) => n.targetId !== id && n.parentFolderId !== id);
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
