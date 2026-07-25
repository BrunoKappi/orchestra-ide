import type {
  EntityType,
  MergedProperty,
  MergedScript,
  PropertyEntity,
  ScriptEntity,
  TemplateEntity,
  AssociatedWidgetEntity,
  MergedAssociatedWidget,
  MockConfig,
  MergedMockConfig,
} from '../types/domain';
import { objectRepo } from '../repository/ObjectRepository';
import { propertyRepo } from '../repository/PropertyRepository';
import { scriptRepo } from '../repository/ScriptRepository';
import { templateRepo } from '../repository/TemplateRepository';
import { associatedWidgetRepo } from '../repository/AssociatedWidgetRepository';
import { widgetRepo } from '../repository/WidgetRepository';
import { mockConfigRepo } from '../repository/MockConfigRepository';
import { mockSimulationService } from './MockSimulationService';

export class InheritanceService {
  /**
   * Get template inheritance chain from current template up to root template.
   * [currentTemplate, parentTemplate, grandparentTemplate, ...]
   */
  public getTemplateAncestryChain(templateId: string): TemplateEntity[] {
    const chain: TemplateEntity[] = [];
    const visited = new Set<string>();
    let currentId: string | null = templateId;

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const template = templateRepo.getById(currentId);
      if (!template) break;
      chain.push(template);
      currentId = template.parentTemplateId;
    }

    return chain;
  }

  /**
   * Compute merged properties for a target entity (Template or Instance).
   */
  public getMergedProperties(
    targetId: string,
    targetType: EntityType
  ): MergedProperty[] {
    let startingTemplateId: string | null = null;
    let localProps: PropertyEntity[] = [];

    if (targetType === 'template') {
      const template = templateRepo.getById(targetId);
      if (!template) return [];
      startingTemplateId = template.parentTemplateId;
      localProps = propertyRepo.getByTargetId(targetId);
    } else {
      const objectEntity = objectRepo.getById(targetId);
      if (!objectEntity) return [];
      startingTemplateId = objectEntity.templateId;
      localProps = propertyRepo.getByTargetId(targetId);
    }

    const propMap = new Map<string, MergedProperty>();

    // 1. Traverse ancestry chain from root template down to target's immediate parent
    if (startingTemplateId) {
      const ancestry = this.getTemplateAncestryChain(startingTemplateId).reverse();
      for (const t of ancestry) {
        const ancestorProps = propertyRepo.getByTargetId(t.id);
        for (const p of ancestorProps) {
          propMap.set(p.name, {
            ...p,
            isInherited: true,
            sourceTemplateId: t.id,
            sourceTemplateName: t.name,
          });
        }
      }
    }

    // 2. Overlay local properties
    for (const p of localProps) {
      const existing = propMap.get(p.name);
      propMap.set(p.name, {
        ...p,
        isInherited: false,
        isOverridden: !!existing,
        sourceTemplateId: existing ? existing.sourceTemplateId : undefined,
        sourceTemplateName: existing ? existing.sourceTemplateName : undefined,
      });
    }

    return Array.from(propMap.values());
  }

  /**
   * Compute merged scripts for a target entity (Template or Instance).
   */
  public getMergedScripts(
    targetId: string,
    targetType: EntityType
  ): MergedScript[] {
    let startingTemplateId: string | null = null;
    let localScripts: ScriptEntity[] = [];

    if (targetType === 'template') {
      const template = templateRepo.getById(targetId);
      if (!template) return [];
      startingTemplateId = template.parentTemplateId;
      localScripts = scriptRepo.getByTargetId(targetId);
    } else {
      const objectEntity = objectRepo.getById(targetId);
      if (!objectEntity) return [];
      startingTemplateId = objectEntity.templateId;
      localScripts = scriptRepo.getByTargetId(targetId);
    }

    const scriptMap = new Map<string, MergedScript>();

    if (startingTemplateId) {
      const ancestry = this.getTemplateAncestryChain(startingTemplateId).reverse();
      for (const t of ancestry) {
        const ancestorScripts = scriptRepo.getByTargetId(t.id);
        for (const s of ancestorScripts) {
          scriptMap.set(s.name, {
            ...s,
            isInherited: true,
            sourceTemplateId: t.id,
            sourceTemplateName: t.name,
          });
        }
      }
    }

    for (const s of localScripts) {
      const existing = scriptMap.get(s.name);
      scriptMap.set(s.name, {
        ...s,
        isInherited: false,
        isOverridden: !!existing,
        sourceTemplateId: existing ? existing.sourceTemplateId : undefined,
        sourceTemplateName: existing ? existing.sourceTemplateName : undefined,
      });
    }

    return Array.from(scriptMap.values());
  }

  /**
   * Compute merged associated widgets for a target entity (Template or Instance).
   */
  public getMergedAssociatedWidgets(
    targetId: string,
    targetType: EntityType
  ): MergedAssociatedWidget[] {
    let startingTemplateId: string | null = null;
    let localAssocs: AssociatedWidgetEntity[] = [];

    if (targetType === 'template') {
      const template = templateRepo.getById(targetId);
      if (!template) return [];
      startingTemplateId = template.parentTemplateId;
      localAssocs = associatedWidgetRepo.getByTargetId(targetId);
    } else {
      const objectEntity = objectRepo.getById(targetId);
      if (!objectEntity) return [];
      startingTemplateId = objectEntity.templateId;
      localAssocs = associatedWidgetRepo.getByTargetId(targetId);
    }

    const assocMap = new Map<string, MergedAssociatedWidget>();

    // 1. Traverse ancestry chain from root template down to target's immediate parent
    if (startingTemplateId) {
      const ancestry = this.getTemplateAncestryChain(startingTemplateId).reverse();
      for (const t of ancestry) {
        const ancestorAssocs = associatedWidgetRepo.getByTargetId(t.id);
        for (const a of ancestorAssocs) {
          const w = widgetRepo.getById(a.widgetId);
          assocMap.set(a.widgetId, {
            ...a,
            widgetName: w ? w.name : 'Unknown Graphic',
            isInherited: true,
            sourceTemplateId: t.id,
            sourceTemplateName: t.name,
          });
        }
      }
    }

    // 2. Overlay local associations
    for (const a of localAssocs) {
      const existing = assocMap.get(a.widgetId);
      const w = widgetRepo.getById(a.widgetId);
      assocMap.set(a.widgetId, {
        ...a,
        widgetName: w ? w.name : 'Unknown Graphic',
        isInherited: false,
        isOverridden: !!existing,
        sourceTemplateId: existing ? existing.sourceTemplateId : undefined,
        sourceTemplateName: existing ? existing.sourceTemplateName : undefined,
      });
    }

    return Array.from(assocMap.values());
  }

  /**
   * Compute merged mock configurations for a target entity (Template or Instance).
   */
  public getMergedMockConfigs(
    targetId: string,
    targetType: EntityType,
    mergedProperties: MergedProperty[]
  ): MergedMockConfig[] {
    let startingTemplateId: string | null = null;
    let localConfigs: MockConfig[] = [];

    if (targetType === 'template') {
      const template = templateRepo.getById(targetId);
      if (!template) return [];
      startingTemplateId = template.parentTemplateId;
      localConfigs = mockConfigRepo.getByTargetId(targetId);
    } else {
      const objectEntity = objectRepo.getById(targetId);
      if (!objectEntity) return [];
      startingTemplateId = objectEntity.templateId;
      localConfigs = mockConfigRepo.getByTargetId(targetId);
    }

    const configMap = new Map<string, MergedMockConfig>();

    // 1. Ancestry chain mock configs
    if (startingTemplateId) {
      const ancestry = this.getTemplateAncestryChain(startingTemplateId).reverse();
      for (const t of ancestry) {
        const ancestorConfigs = mockConfigRepo.getByTargetId(t.id);
        for (const c of ancestorConfigs) {
          configMap.set(c.propertyName, {
            ...c,
            isInherited: true,
            sourceTemplateId: t.id,
            sourceTemplateName: t.name,
          });
        }
      }
    }

    // 2. Overlay local mock configs
    for (const c of localConfigs) {
      const existing = configMap.get(c.propertyName);
      configMap.set(c.propertyName, {
        ...c,
        isInherited: false,
        isOverridden: !!existing,
        sourceTemplateId: existing ? existing.sourceTemplateId : undefined,
        sourceTemplateName: existing ? existing.sourceTemplateName : undefined,
      });
    }

    // 3. For any property without explicit MockConfig, provide default MockConfig
    const result: MergedMockConfig[] = [];
    for (const prop of mergedProperties) {
      const existing = configMap.get(prop.name);
      if (existing) {
        result.push(existing);
      } else {
        const defaultConfig = mockSimulationService.getDefaultMockConfig(
          targetId,
          targetType,
          prop
        );
        result.push({
          ...defaultConfig,
          isInherited: prop.isInherited,
          sourceTemplateId: prop.sourceTemplateId,
          sourceTemplateName: prop.sourceTemplateName,
          isOverridden: false,
        });
      }
    }

    return result;
  }
}

export const inheritanceService = new InheritanceService();

