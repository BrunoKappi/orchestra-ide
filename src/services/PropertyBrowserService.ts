import type {
  TemplateEntity,
  ObjectEntity,
  ScreenEntity,
  AssociatedWidgetEntity,
  MergedProperty,
  DataType,
} from '../types/domain';
import { inheritanceService } from './InheritanceService';

export interface IndexedProperty {
  id: string; // "type:targetId:name"
  name: string;
  targetId: string;
  targetType: 'template' | 'instance';
  targetName: string;
  sourceTemplateId?: string;
  sourceTemplateName?: string;
  isInherited: boolean;
  isOverridden: boolean;
  dataType: DataType;
  defaultValue: string;
  description: string;
  category: string;
  engineeringUnit: string;
  quality: 'Good' | 'Bad' | 'Uncertain';
  hasAlarm: boolean;
  hasHistory: boolean;
  isSimulated: boolean;
  widgetsCount: number;
  screensCount: number;
}

export class PropertyBrowserService {
  private index: IndexedProperty[] = [];

  public rebuildIndex(
    templates: TemplateEntity[],
    objects: ObjectEntity[],
    screens: ScreenEntity[],
    associatedWidgets: AssociatedWidgetEntity[],
    mockConfigs: any[] // we can check if it has a custom simulation config enabled
  ): void {
    const nextIndex: IndexedProperty[] = [];
    const templateMap = new Map(templates.map((t) => [t.id, t]));

    // Helper: calculate references
    const countReferences = (targetId: string, propName: string) => {
      let widgetsCount = 0;
      let screensCount = 0;

      // 1. Associated Widgets referencing this property
      associatedWidgets.forEach((assoc) => {
        if (assoc.targetId === targetId) {
          Object.values(assoc.mappings || {}).forEach((m) => {
            if (m.type === 'property' && (m.value === propName || m.value === `me.${propName}`)) {
              widgetsCount++;
            }
          });
        }
      });

      // 2. Screens referencing this property
      screens.forEach((screen) => {
        (screen.elements || []).forEach((el) => {
          if (el.objectId === targetId) {
            // Direct variable display
            if (el.type === 'variable-display' && el.propertyName === propName) {
              screensCount++;
            }
            // Mappings inside widget instance on screen
            if (el.type === 'widget-instance' && el.mappings) {
              Object.values(el.mappings).forEach((m) => {
                if (m.type === 'property' && (m.value === propName || m.value === `${targetId}:${propName}` || m.value === `me.${propName}`)) {
                  screensCount++;
                }
              });
            }
          }
        });
      });

      return { widgetsCount, screensCount };
    };

    // Rebuild index for Template Properties
    templates.forEach((tmpl) => {
      let props: MergedProperty[] = [];
      try {
        props = inheritanceService.getMergedProperties(tmpl.id, 'template');
      } catch (e) {
        console.error('Failed to get template properties for index:', e);
      }

      props.forEach((prop) => {
        const { widgetsCount, screensCount } = countReferences(tmpl.id, prop.name);
        const hasAlarm = !!(prop.alarmConfig?.enabled && prop.alarmConfig.rules?.some((r) => r.enabled));
        const hasHistory = !!(prop.historyConfig?.enabled);

        nextIndex.push({
          id: `template:${tmpl.id}:${prop.name}`,
          name: prop.name,
          targetId: tmpl.id,
          targetType: 'template',
          targetName: tmpl.name,
          sourceTemplateId: prop.sourceTemplateId,
          sourceTemplateName: prop.sourceTemplateName,
          isInherited: prop.isInherited,
          isOverridden: !!prop.isOverridden,
          dataType: prop.dataType,
          defaultValue: prop.defaultValue,
          description: prop.description || '',
          category: prop.category || 'Geral',
          engineeringUnit: prop.historyConfig?.engineeringUnit || '—',
          quality: 'Good',
          hasAlarm,
          hasHistory,
          isSimulated: false, // Templates themselves are not simulated dynamically
          widgetsCount,
          screensCount,
        });
      });
    });

    // Rebuild index for Object Instance Properties
    objects.forEach((obj) => {
      let props: MergedProperty[] = [];
      try {
        props = inheritanceService.getMergedProperties(obj.id, 'instance');
      } catch (e) {
        console.error('Failed to get object properties for index:', e);
      }

      props.forEach((prop) => {
        const { widgetsCount, screensCount } = countReferences(obj.id, prop.name);
        const hasAlarm = !!(prop.alarmConfig?.enabled && prop.alarmConfig.rules?.some((r) => r.enabled));
        const hasHistory = !!(prop.historyConfig?.enabled);

        // Check if mock simulation is enabled for this instance property
        const hasMock = mockConfigs.some(
          (c) => c.targetId === obj.id && c.propertyName === prop.name && c.enabled
        );

        nextIndex.push({
          id: `instance:${obj.id}:${prop.name}`,
          name: prop.name,
          targetId: obj.id,
          targetType: 'instance',
          targetName: obj.name,
          sourceTemplateId: prop.sourceTemplateId || obj.templateId,
          sourceTemplateName: prop.sourceTemplateName || templateMap.get(obj.templateId)?.name,
          isInherited: prop.isInherited,
          isOverridden: !!prop.isOverridden,
          dataType: prop.dataType,
          defaultValue: prop.defaultValue,
          description: prop.description || '',
          category: prop.category || 'Geral',
          engineeringUnit: prop.historyConfig?.engineeringUnit || '—',
          quality: 'Good', // default quality
          hasAlarm,
          hasHistory,
          isSimulated: hasMock,
          widgetsCount,
          screensCount,
        });
      });
    });

    this.index = nextIndex;
  }

  public getIndex(): IndexedProperty[] {
    return this.index;
  }

  public search(
    query: string,
    filters: {
      dataType?: string;
      category?: string;
      targetId?: string;
      sourceTemplateId?: string;
      targetType?: 'template' | 'instance' | 'all';
      isInherited?: boolean;
      isOverridden?: boolean;
      hasAlarm?: boolean;
      hasHistory?: boolean;
      isSimulated?: boolean;
      isUsedInScreens?: boolean;
    } = {}
  ): IndexedProperty[] {
    const q = query.toLowerCase().trim();

    return this.index.filter((prop) => {
      // 1. Text Search: name, description, object/template name, source template name, category, engineering unit, type
      if (q) {
        const match =
          prop.name.toLowerCase().includes(q) ||
          prop.description.toLowerCase().includes(q) ||
          prop.targetName.toLowerCase().includes(q) ||
          (prop.sourceTemplateName || '').toLowerCase().includes(q) ||
          prop.category.toLowerCase().includes(q) ||
          prop.engineeringUnit.toLowerCase().includes(q) ||
          prop.dataType.toLowerCase().includes(q);

        if (!match) return false;
      }

      // 2. Data Type filter
      if (filters.dataType && filters.dataType !== 'ALL') {
        if (prop.dataType.toUpperCase() !== filters.dataType.toUpperCase()) return false;
      }

      // 3. Category filter
      if (filters.category && filters.category !== 'ALL') {
        if (prop.category.toLowerCase() !== filters.category.toLowerCase()) return false;
      }

      // 4. Object Instance target filter
      if (filters.targetId && filters.targetId !== 'ALL') {
        if (prop.targetId !== filters.targetId) return false;
      }

      // 5. Source Template filter
      if (filters.sourceTemplateId && filters.sourceTemplateId !== 'ALL') {
        if (prop.sourceTemplateId !== filters.sourceTemplateId) return false;
      }

      // 6. Target Type filter (template vs instance)
      if (filters.targetType && filters.targetType !== 'all') {
        if (prop.targetType !== filters.targetType) return false;
      }

      // 7. Inherited filter
      if (filters.isInherited !== undefined) {
        if (prop.isInherited !== filters.isInherited) return false;
      }

      // 8. Overridden filter
      if (filters.isOverridden !== undefined) {
        if (prop.isOverridden !== filters.isOverridden) return false;
      }

      // 9. Alarm filter
      if (filters.hasAlarm !== undefined && filters.hasAlarm) {
        if (!prop.hasAlarm) return false;
      }

      // 10. History filter
      if (filters.hasHistory !== undefined && filters.hasHistory) {
        if (!prop.hasHistory) return false;
      }

      // 11. Simulated filter
      if (filters.isSimulated !== undefined && filters.isSimulated) {
        if (!prop.isSimulated) return false;
      }

      // 12. Screen usage filter
      if (filters.isUsedInScreens !== undefined && filters.isUsedInScreens) {
        if (prop.screensCount === 0) return false;
      }

      return true;
    });
  }
}

export const propertyBrowserService = new PropertyBrowserService();
