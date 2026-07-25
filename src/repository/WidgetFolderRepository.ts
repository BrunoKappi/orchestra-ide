import type { WidgetFolderEntity, WidgetNodeEntity } from '../types/domain';
import { STORAGE_KEYS } from './storageKey';

export class WidgetFolderRepository {
  public getFolders(): WidgetFolderEntity[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WIDGET_FOLDERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public getNodes(): WidgetNodeEntity[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WIDGET_NODES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveFolder(folder: WidgetFolderEntity): WidgetFolderEntity {
    const folders = this.getFolders();
    const idx = folders.findIndex((f) => f.id === folder.id);
    const updated = { ...folder, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      folders[idx] = updated;
    } else {
      folders.push(updated);
    }
    localStorage.setItem(STORAGE_KEYS.WIDGET_FOLDERS, JSON.stringify(folders));
    return updated;
  }

  public deleteFolder(folderId: string): void {
    let folders = this.getFolders();
    folders = folders.filter((f) => f.id !== folderId);
    localStorage.setItem(STORAGE_KEYS.WIDGET_FOLDERS, JSON.stringify(folders));

    let nodes = this.getNodes();
    nodes = nodes.filter((n) => n.id !== folderId && n.parentFolderId !== folderId);
    localStorage.setItem(STORAGE_KEYS.WIDGET_NODES, JSON.stringify(nodes));
  }

  public saveNodes(nodes: WidgetNodeEntity[]): void {
    localStorage.setItem(STORAGE_KEYS.WIDGET_NODES, JSON.stringify(nodes));
  }

  public saveFolders(folders: WidgetFolderEntity[]): void {
    localStorage.setItem(STORAGE_KEYS.WIDGET_FOLDERS, JSON.stringify(folders));
  }
}

export const widgetFolderRepo = new WidgetFolderRepository();
