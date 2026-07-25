import { v4 as uuidv4 } from 'uuid';
import type {
  EntityType,
  ExportDataPayload,
  ObjectEntity,
  PropertyEntity,
  ScriptEntity,
  TemplateEntity,
  AssociatedWidgetEntity,
} from '../types/domain';
import { objectRepo } from '../repository/ObjectRepository';
import { propertyRepo } from '../repository/PropertyRepository';
import { scriptRepo } from '../repository/ScriptRepository';
import { templateRepo } from '../repository/TemplateRepository';
import { associatedWidgetRepo } from '../repository/AssociatedWidgetRepository';
import { inheritanceService } from './InheritanceService';

export class ExportImportService {
  /**
   * Export a target entity (Template or Instance) to JSON payload.
   */
  public exportEntity(targetId: string, targetType: EntityType): ExportDataPayload {
    const templatesToExport: TemplateEntity[] = [];
    const objectsToExport: ObjectEntity[] = [];
    const propertiesToExport: PropertyEntity[] = [];
    const scriptsToExport: ScriptEntity[] = [];
    const associatedWidgetsToExport: AssociatedWidgetEntity[] = [];

    if (targetType === 'template') {
      const rootTemplate = templateRepo.getById(targetId);
      if (!rootTemplate) throw new Error('Template not found');

      // Include root template and all derived templates recursively
      const collectTemplates = (tid: string) => {
        const t = templateRepo.getById(tid);
        if (t && !templatesToExport.some((x) => x.id === t.id)) {
          templatesToExport.push(t);

          // Get local properties and scripts
          propertiesToExport.push(...propertyRepo.getByTargetId(t.id));
          scriptsToExport.push(...scriptRepo.getByTargetId(t.id));
          associatedWidgetsToExport.push(...associatedWidgetRepo.getByTargetId(t.id));

          // Get child templates
          const childTemplates = templateRepo
            .getAll()
            .filter((ct) => ct.parentTemplateId === t.id);
          childTemplates.forEach((ct) => collectTemplates(ct.id));

          // Get instances belonging to this template
          const insts = objectRepo.getByTemplateId(t.id);
          insts.forEach((inst) => {
            if (!objectsToExport.some((o) => o.id === inst.id)) {
              objectsToExport.push(inst);
              propertiesToExport.push(...propertyRepo.getByTargetId(inst.id));
              scriptsToExport.push(...scriptRepo.getByTargetId(inst.id));
              associatedWidgetsToExport.push(...associatedWidgetRepo.getByTargetId(inst.id));
            }
          });
        }
      };

      // Also collect ancestor chain so template of origin can be rebuilt if imported in isolation
      const ancestry = inheritanceService.getTemplateAncestryChain(targetId);
      ancestry.forEach((t) => {
        if (!templatesToExport.some((x) => x.id === t.id)) {
          templatesToExport.push(t);
          propertiesToExport.push(...propertyRepo.getByTargetId(t.id));
          scriptsToExport.push(...scriptRepo.getByTargetId(t.id));
          associatedWidgetsToExport.push(...associatedWidgetRepo.getByTargetId(t.id));
        }
      });

      collectTemplates(targetId);

      return {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        rootEntity: { type: 'template', data: rootTemplate },
        templates: templatesToExport,
        objects: objectsToExport,
        properties: propertiesToExport,
        scripts: scriptsToExport,
        associatedWidgets: associatedWidgetsToExport,
      };
    } else {
      const obj = objectRepo.getById(targetId);
      if (!obj) throw new Error('Object instance not found');

      objectsToExport.push(obj);
      propertiesToExport.push(...propertyRepo.getByTargetId(obj.id));
      scriptsToExport.push(...scriptRepo.getByTargetId(obj.id));
      associatedWidgetsToExport.push(...associatedWidgetRepo.getByTargetId(obj.id));

      // Collect origin template chain
      const ancestry = inheritanceService.getTemplateAncestryChain(obj.templateId);
      ancestry.forEach((t) => {
        if (!templatesToExport.some((x) => x.id === t.id)) {
          templatesToExport.push(t);
          propertiesToExport.push(...propertyRepo.getByTargetId(t.id));
          scriptsToExport.push(...scriptRepo.getByTargetId(t.id));
          associatedWidgetsToExport.push(...associatedWidgetRepo.getByTargetId(t.id));
        }
      });

      return {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        rootEntity: { type: 'instance', data: obj },
        templates: templatesToExport,
        objects: objectsToExport,
        properties: propertiesToExport,
        scripts: scriptsToExport,
        associatedWidgets: associatedWidgetsToExport,
      };
    }
  }

  /**
   * Import JSON payload and reconstruct entities with clean ID remapping.
   */
  public importPayload(payload: ExportDataPayload): {
    importedRootId: string;
    importedRootType: EntityType;
  } {
    if (!payload.version || !payload.rootEntity) {
      throw new Error('Invalid export file format');
    }

    const idMap = new Map<string, string>(); // oldId -> newId

    // Map template IDs
    for (const t of payload.templates || []) {
      const existing = templateRepo.getById(t.id);
      if (existing) {
        idMap.set(t.id, uuidv4());
      } else {
        idMap.set(t.id, t.id);
      }
    }

    // Map object IDs
    for (const o of payload.objects || []) {
      const existing = objectRepo.getById(o.id);
      if (existing) {
        idMap.set(o.id, uuidv4());
      } else {
        idMap.set(o.id, o.id);
      }
    }

    // Save templates with updated IDs & parent references
    for (const t of payload.templates || []) {
      const newId = idMap.get(t.id) || uuidv4();
      const newParentId = t.parentTemplateId
        ? idMap.get(t.parentTemplateId) || t.parentTemplateId
        : null;

      const updatedName =
        newId !== t.id ? `${t.name} (Imported)` : t.name;

      templateRepo.save({
        ...t,
        id: newId,
        name: updatedName,
        parentTemplateId: newParentId,
        updatedAt: new Date().toISOString(),
      });
    }

    // Save objects with updated IDs & template references
    for (const o of payload.objects || []) {
      const newId = idMap.get(o.id) || uuidv4();
      const newTemplateId = idMap.get(o.templateId) || o.templateId;

      const updatedName =
        newId !== o.id ? `${o.name}_Imported` : o.name;

      objectRepo.save({
        ...o,
        id: newId,
        name: updatedName,
        templateId: newTemplateId,
        updatedAt: new Date().toISOString(),
      });
    }

    // Save properties
    for (const p of payload.properties || []) {
      const newTargetId = idMap.get(p.targetId) || p.targetId;
      const newPropId = uuidv4();

      propertyRepo.save({
        ...p,
        id: newPropId,
        targetId: newTargetId,
        updatedAt: new Date().toISOString(),
      });
    }

    // Save scripts
    for (const s of payload.scripts || []) {
      const newTargetId = idMap.get(s.targetId) || s.targetId;
      const newScriptId = uuidv4();

      scriptRepo.save({
        ...s,
        id: newScriptId,
        targetId: newTargetId,
        updatedAt: new Date().toISOString(),
      });
    }

    // Save associated widgets
    for (const aw of payload.associatedWidgets || []) {
      const newTargetId = idMap.get(aw.targetId) || aw.targetId;
      const newAssocId = uuidv4();

      associatedWidgetRepo.save({
        ...aw,
        id: newAssocId,
        targetId: newTargetId,
        updatedAt: new Date().toISOString(),
      });
    }

    const importedRootId =
      idMap.get(payload.rootEntity.data.id) || payload.rootEntity.data.id;

    return {
      importedRootId,
      importedRootType: payload.rootEntity.type,
    };
  }
}

export const exportImportService = new ExportImportService();
