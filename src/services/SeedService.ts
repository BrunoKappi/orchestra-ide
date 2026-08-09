import { v4 as uuidv4 } from 'uuid';
import { STORAGE_KEYS } from '../repository/storageKey';
import { templateRepo } from '../repository/TemplateRepository';
import { objectRepo } from '../repository/ObjectRepository';
import { propertyRepo } from '../repository/PropertyRepository';
import { scriptRepo } from '../repository/ScriptRepository';
import { deploymentRepo } from '../repository/DeploymentRepository';
import { associatedWidgetRepo } from '../repository/AssociatedWidgetRepository';
import { mockConfigRepo } from '../repository/MockConfigRepository';
import { alarmRepo } from '../repository/AlarmRepository';
import type { ProductEntity, AreaEntity, EquipmentGraphicConfig, PropertyEntity, PropertyAlarmConfig } from '../types/domain';
import { AlarmEngine } from './AlarmEngine';
import { inheritanceService } from './InheritanceService';

// ---------------------------------------------------------------------------
// Helper: create a PropertyEntity skeleton
// ---------------------------------------------------------------------------
type PropDef = Omit<PropertyEntity, 'id' | 'createdAt' | 'updatedAt'>;

function makeProp(
  targetId: string,
  targetType: 'template' | 'instance',
  name: string,
  dataType: PropertyEntity['dataType'],
  defaultValue: string,
  description: string,
  category?: string,
  historyConfig?: PropertyEntity['historyConfig'],
): PropDef {
  return { targetId, targetType, name, dataType, defaultValue, description, category, historyConfig };
}

export class SeedService {
  public seedInitialDataIfNeeded(force: boolean = false): void {
    const isSeeded = localStorage.getItem(STORAGE_KEYS.SEEDED);
    if (isSeeded && !force) return;

    // 1. Clear existing storage
    templateRepo.saveAll([]);
    objectRepo.saveAll([]);
    propertyRepo.saveAll([]);
    scriptRepo.saveAll([]);
    deploymentRepo.saveAllFolders([]);
    deploymentRepo.saveAllNodes([]);
    associatedWidgetRepo.saveAll([]);
    mockConfigRepo.saveAll([]);
    alarmRepo.clear();

    const now = new Date().toISOString();

    // -------------------------------------------------------------------------
    // 2. Products Catalog
    // -------------------------------------------------------------------------
    const products: ProductEntity[] = [
      {
        id: 'prod-naphtha',
        code: 'NAF-01',
        name: 'Nafta Petroquímica',
        description: 'Alimentação para unidade de craqueamento petroquímico',
        density: 720,
        densityUnit: 'kg/m³',
        category: 'Hidrocarboneto Leve',
        physicalState: 'Líquido',
        color: '#f59e0b',
      },
      {
        id: 'prod-benzene',
        code: 'BZ-02',
        name: 'Benzeno Purificado',
        description: 'Aromático purificado grau químico (pureza >99.9%)',
        density: 876,
        densityUnit: 'kg/m³',
        category: 'Aromáticos',
        physicalState: 'Líquido',
        color: '#8b5cf6',
      },
      {
        id: 'prod-ethene',
        code: 'ETH-03',
        name: 'Eteno (Etileno)',
        description: 'Olefrina monômero para polietileno',
        density: 568,
        densityUnit: 'kg/m³',
        category: 'Olefinas',
        physicalState: 'Pressurizado',
        color: '#06b6d4',
      },
      {
        id: 'prod-propene',
        code: 'PRP-04',
        name: 'Propeno (Propileno)',
        description: 'Monoméro para polipropileno de alta pureza',
        density: 514,
        densityUnit: 'kg/m³',
        category: 'Olefinas',
        physicalState: 'Pressurizado',
        color: '#3b82f6',
      },
      {
        id: 'prod-paraxylene',
        code: 'PXY-05',
        name: 'Para-Xileno',
        description: 'Intermediário para cadeia de poliéster / PTA',
        density: 861,
        densityUnit: 'kg/m³',
        category: 'Aromáticos',
        physicalState: 'Líquido',
        color: '#ec4899',
      },
      {
        id: 'prod-fueloil',
        code: 'FO-06',
        name: 'Óleo Combustível Heavy',
        description: 'Frações pesadas para utilidades de caldeira',
        density: 980,
        densityUnit: 'kg/m³',
        category: 'Combustível',
        physicalState: 'Líquido',
        color: '#64748b',
      },
    ];
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

    // -------------------------------------------------------------------------
    // 3. Areas
    // -------------------------------------------------------------------------
    const areas: AreaEntity[] = [
      {
        id: 'area-300',
        code: 'A-300',
        name: 'Unidade 300 - Parque de Tanques de Matéria-Prima',
        description: 'Armazenamento e bombeamento de Nafta e Condensados',
      },
      {
        id: 'area-400',
        code: 'A-400',
        name: 'Unidade 400 - Parque de Tanques Intermediários',
        description: 'Armazenamento de Benzeno, Para-Xileno e Aromáticos',
      },
      {
        id: 'area-500',
        code: 'A-500',
        name: 'Unidade 500 - Esferas e Pressurizados de Olefinas',
        description: 'Armazenamento liquefeito pressurizado de Eteno e Propeno',
      },
    ];
    localStorage.setItem(STORAGE_KEYS.AREAS, JSON.stringify(areas));

    // -------------------------------------------------------------------------
    // 4. Users (Security & Operators)
    // -------------------------------------------------------------------------
    const users = [
      {
        id: 'usr-1',
        name: 'Carlos Silva',
        login: 'csilva',
        email: 'carlos.silva@braskem-poc.com',
        role: 'Operador de Inventário',
        group: 'Operações Matéria-Prima',
        areaId: 'area-300',
        status: 'Active',
        lastLogin: now,
      },
      {
        id: 'usr-2',
        name: 'Ana Souza',
        login: 'asouza',
        email: 'ana.souza@braskem-poc.com',
        role: 'Supervisora de Movimentação',
        group: 'Supervisão de Parque',
        areaId: 'area-400',
        status: 'Active',
        lastLogin: now,
      },
      {
        id: 'usr-3',
        name: 'Roberto Mendes',
        login: 'rmendes',
        email: 'roberto.mendes@braskem-poc.com',
        role: 'Engenheiro de Processos',
        group: 'Engenharia de Produção',
        areaId: 'area-500',
        status: 'Active',
        lastLogin: now,
      },
      {
        id: 'usr-4',
        name: 'Juliana Lima',
        login: 'jlima',
        email: 'juliana.lima@braskem-poc.com',
        role: 'Operadora de Painel',
        group: 'Operações Matéria-Prima',
        areaId: 'area-300',
        status: 'Active',
        lastLogin: now,
      },
      {
        id: 'usr-5',
        name: 'Marcos Oliveira',
        login: 'moliveira',
        email: 'marcos.oliveira@braskem-poc.com',
        role: 'Engenheiro de Automação',
        group: 'Engenharia de Automação',
        areaId: 'area-400',
        status: 'Active',
        lastLogin: now,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.SECURITY_USERS, JSON.stringify(users));

    // -------------------------------------------------------------------------
    // 5. Templates
    // -------------------------------------------------------------------------
    const baseTankTplId = 'tpl-tank';

    const defaultGraphicConfig: EquipmentGraphicConfig = {
      geometryType: 'vertical_cylindrical',
      visibleFields: {
        tag: true,
        description: true,
        product: true,
        level: true,
        volume: true,
        temperature: true,
        pressure: true,
        flow: true,
        density: true,
        status: true,
        alarm: true,
      },
      fieldBindings: [
        { propertyName: 'Level', label: 'Nível', unit: '%', decimalPlaces: 1, visible: true },
        { propertyName: 'Volume', label: 'Volume', unit: 'm³', decimalPlaces: 1, visible: true },
        { propertyName: 'Temperature', label: 'Temperatura', unit: '°C', decimalPlaces: 1, visible: true },
        { propertyName: 'Pressure', label: 'Pressão', unit: 'bar', decimalPlaces: 2, visible: true },
        { propertyName: 'Flow', label: 'Vazão', unit: 'm³/h', decimalPlaces: 1, visible: true },
        { propertyName: 'Density', label: 'Densidade', unit: 'kg/m³', decimalPlaces: 1, visible: false },
        { propertyName: 'Mass', label: 'Massa', unit: 't', decimalPlaces: 1, visible: false },
      ],
      decimalPlaces: 1,
      showLevelFill: true,
      showFooter: true,
    };

    // Root Template: Base Tank
    templateRepo.save({
      id: baseTankTplId,
      name: 'Tank Template',
      parentTemplateId: null,
      description: 'Template base para equipamentos de tancagem industrial. Define as propriedades comuns a todos os tanques.',
      graphicConfig: defaultGraphicConfig,
      createdAt: now,
      updatedAt: now,
    });

    // -------------------------------------------------------------------------
    // 5a. Properties on the BASE TANK TEMPLATE
    // These are inherited by all derived templates and instances.
    // -------------------------------------------------------------------------
    const baseTplProps: PropDef[] = [
      // Identificação
      makeProp(baseTankTplId, 'template', 'Tag', 'String', '', 'TAG industrial do equipamento (ex: TK-301)', 'Identificação'),
      makeProp(baseTankTplId, 'template', 'Description', 'String', '', 'Descrição operacional completa', 'Identificação'),
      makeProp(baseTankTplId, 'template', 'Area', 'String', '', 'Área da planta industrial onde o equipamento está localizado', 'Identificação'),
      makeProp(baseTankTplId, 'template', 'Product', 'String', '', 'Produto petroquímico armazenado', 'Identificação'),

      // Estado Operacional
      makeProp(baseTankTplId, 'template', 'Status', 'String', 'Normal', 'Status operacional e de inventário do tanque', 'Status'),

      // Capacidade e Inventário (Com Historian/Storyon ativado)
      makeProp(baseTankTplId, 'template', 'Capacity', 'Float', '15000.0', 'Capacidade volumétrica nominal total (m³)', 'Inventário'),
      makeProp(baseTankTplId, 'template', 'Volume', 'Float', '0.0', 'Volume atual armazenado (m³)', 'Inventário', { enabled: true, periodMs: 1000, storageType: 'Memory', engineeringUnit: 'm³' }),
      makeProp(baseTankTplId, 'template', 'Level', 'Float', '0.0', 'Nível de preenchimento do tanque (%)', 'Inventário', { enabled: true, periodMs: 1000, storageType: 'Memory', engineeringUnit: '%' }),
      makeProp(baseTankTplId, 'template', 'Mass', 'Float', '0.0', 'Massa total armazenada (toneladas)', 'Inventário'),
      makeProp(baseTankTplId, 'template', 'VCF', 'Float', '1.000', 'Fator de Correção de Volume (Volume Correction Factor)', 'Inventário'),

      // Processo (Com Historian/Storyon ativado)
      makeProp(baseTankTplId, 'template', 'Flow', 'Float', '0.0', 'Vazão volumétrica atual (m³/h)', 'Processo', { enabled: true, periodMs: 1000, storageType: 'Memory', engineeringUnit: 'm³/h' }),
      makeProp(baseTankTplId, 'template', 'Temperature', 'Float', '20.0', 'Temperatura interna do produto (°C)', 'Processo', { enabled: true, periodMs: 1000, storageType: 'Memory', engineeringUnit: '°C' }),
      makeProp(baseTankTplId, 'template', 'Pressure', 'Float', '1.0', 'Pressão manométrica interna (bar)', 'Processo', { enabled: true, periodMs: 1000, storageType: 'Memory', engineeringUnit: 'bar' }),
      makeProp(baseTankTplId, 'template', 'Density', 'Float', '800.0', 'Densidade operacional do produto (kg/m³)', 'Processo'),

      // Limites de Alarme
      makeProp(baseTankTplId, 'template', 'HighHighLevel', 'Float', '90.0', 'Limite de alarme Nível Muito Alto - HH (%)', 'Limites'),
      makeProp(baseTankTplId, 'template', 'HighLevel', 'Float', '80.0', 'Limite de alarme Nível Alto - H (%)', 'Limites'),
      makeProp(baseTankTplId, 'template', 'LowLevel', 'Float', '15.0', 'Limite de alarme Nível Baixo - L (%)', 'Limites'),
      makeProp(baseTankTplId, 'template', 'LowLowLevel', 'Float', '5.0', 'Limite de alarme Nível Muito Baixo - LL (%)', 'Limites'),
      makeProp(baseTankTplId, 'template', 'HighPressure', 'Float', '2.5', 'Limite de alarme Pressão Alta (bar)', 'Limites'),
      makeProp(baseTankTplId, 'template', 'LowPressure', 'Float', '0.9', 'Limite de alarme Pressão Baixa (bar)', 'Limites'),
    ];

    baseTplProps.forEach((p) =>
      propertyRepo.save({ id: uuidv4(), ...p, createdAt: now, updatedAt: now })
    );

    // -------------------------------------------------------------------------
    // 5b. Derived Templates
    // -------------------------------------------------------------------------
    const tplAtm = {
      id: 'tpl-atm-tank',
      name: 'Atmospheric Tank',
      parentTemplateId: baseTankTplId,
      description: 'Tanque cilíndrico vertical atmosférico de teto fixo ou flutuante (API 650)',
      graphicConfig: {
        ...defaultGraphicConfig,
        geometryType: 'vertical_cylindrical' as const,
      },
      createdAt: now,
      updatedAt: now,
    };

    const tplHoriz = {
      id: 'tpl-horiz-tank',
      name: 'Horizontal Tank',
      parentTemplateId: baseTankTplId,
      description: 'Tanque cilíndrico horizontal para médios e pequenos volumes (API 12F)',
      graphicConfig: {
        ...defaultGraphicConfig,
        geometryType: 'horizontal_cylindrical' as const,
        fieldBindings: defaultGraphicConfig.fieldBindings.map((fb) => ({
          ...fb,
          visible: fb.propertyName === 'Flow' ? false : fb.visible,
        })),
      },
      createdAt: now,
      updatedAt: now,
    };

    const tplSpherical = {
      id: 'tpl-spherical-tank',
      name: 'Spherical Tank',
      parentTemplateId: baseTankTplId,
      description: 'Esfera pressurizada para armazenamento de gases liquefeitos (API 2510)',
      graphicConfig: {
        ...defaultGraphicConfig,
        geometryType: 'spherical' as const,
        fieldBindings: defaultGraphicConfig.fieldBindings.map((fb) => ({
          ...fb,
          visible: fb.propertyName === 'Pressure' ? true : fb.visible,
        })),
      },
      createdAt: now,
      updatedAt: now,
    };

    const tplPressurized = {
      id: 'tpl-pressurized-tank',
      name: 'Pressurized Vessel',
      parentTemplateId: baseTankTplId,
      description: 'Vaso pressurizado cilíndrico com tampos abaulados (ASME VIII)',
      graphicConfig: {
        ...defaultGraphicConfig,
        geometryType: 'pressurized' as const,
        fieldBindings: defaultGraphicConfig.fieldBindings.map((fb) => ({
          ...fb,
          visible: fb.propertyName === 'Pressure' ? true : fb.visible,
        })),
      },
      createdAt: now,
      updatedAt: now,
    };

    templateRepo.save(tplAtm);
    templateRepo.save(tplHoriz);
    templateRepo.save(tplSpherical);
    templateRepo.save(tplPressurized);

    // -------------------------------------------------------------------------
    // 6. Tank Instances — only VALUE OVERRIDES (not duplicating template props)
    // -------------------------------------------------------------------------
    const tankSeeds = [
      // Unit 300 - Atmospheric Nafta Tanks
      {
        id: 'tank-tk-301',
        tag: 'TK-301',
        name: 'TK-301',
        description: 'Tanque Atmosférico de Nafta TK-301',
        templateId: 'tpl-atm-tank',
        areaId: 'area-300',
        areaName: 'Unidade 300 - Parque de Tanques de Matéria-Prima',
        productName: 'Nafta Petroquímica',
        capacity: 15000,
        level: 75.0,
        temp: 28.5,
        press: 1.02,
        flow: -120.0,
        density: 720.0,
        status: 'Em Transferência',
        hhLevel: 90.0, hLevel: 80.0, lLevel: 15.0, llLevel: 5.0,
        hPress: 2.5, lPress: 0.9,
        geometry: 'vertical_cylindrical' as const,
      },
      {
        id: 'tank-tk-302',
        tag: 'TK-302',
        name: 'TK-302',
        description: 'Tanque Atmosférico de Nafta TK-302',
        templateId: 'tpl-atm-tank',
        areaId: 'area-300',
        areaName: 'Unidade 300 - Parque de Tanques de Matéria-Prima',
        productName: 'Nafta Petroquímica',
        capacity: 15000,
        level: 35.0,
        temp: 27.8,
        press: 1.01,
        flow: 120.0,
        density: 720.0,
        status: 'Em Transferência',
        hhLevel: 90.0, hLevel: 80.0, lLevel: 15.0, llLevel: 5.0,
        hPress: 2.5, lPress: 0.9,
        geometry: 'vertical_cylindrical' as const,
      },
      // Unit 400 - Aromatics & Intermediates
      {
        id: 'tank-tk-403',
        tag: 'TK-403',
        name: 'TK-403',
        description: 'Tanque Horizontal Para-Xileno TK-403',
        templateId: 'tpl-horiz-tank',
        areaId: 'area-400',
        areaName: 'Unidade 400 - Parque de Tanques Intermediários',
        productName: 'Para-Xileno',
        capacity: 5000,
        level: 55.0,
        temp: 26.0,
        press: 1.15,
        flow: 0.0,
        density: 861.0,
        status: 'Normal',
        hhLevel: 90.0, hLevel: 80.0, lLevel: 15.0, llLevel: 5.0,
        hPress: 2.5, lPress: 0.9,
        geometry: 'horizontal_cylindrical' as const,
      },
      {
        id: 'tank-tk-404',
        tag: 'TK-404',
        name: 'TK-404',
        description: 'Tanque Horizontal Para-Xileno TK-404',
        templateId: 'tpl-horiz-tank',
        areaId: 'area-400',
        areaName: 'Unidade 400 - Parque de Tanques Intermediários',
        productName: 'Para-Xileno',
        capacity: 5000,
        level: 40.0,
        temp: 24.5,
        press: 1.12,
        flow: 0.0,
        density: 861.0,
        status: 'Normal',
        hhLevel: 90.0, hLevel: 80.0, lLevel: 15.0, llLevel: 5.0,
        hPress: 2.5, lPress: 0.9,
        geometry: 'horizontal_cylindrical' as const,
      },
      // Unit 500 - Spheres & Pressurized Vessels
      {
        id: 'tank-v-301',
        tag: 'V-301',
        name: 'V-301',
        description: 'Esfera Pressurizada de Eteno V-301',
        templateId: 'tpl-spherical-tank',
        areaId: 'area-500',
        areaName: 'Unidade 500 - Esferas e Pressurizados de Olefinas',
        productName: 'Eteno (Etileno)',
        capacity: 6000,
        level: 64.0,
        temp: -10.5,
        press: 18.5,
        flow: 0.0,
        density: 568.0,
        status: 'Normal',
        hhLevel: 90.0, hLevel: 80.0, lLevel: 15.0, llLevel: 5.0,
        hPress: 22.0, lPress: 10.0,
        geometry: 'spherical' as const,
      },
      {
        id: 'tank-v-302',
        tag: 'V-302',
        name: 'V-302',
        description: 'Esfera Pressurizada de Eteno V-302',
        templateId: 'tpl-spherical-tank',
        areaId: 'area-500',
        areaName: 'Unidade 500 - Esferas e Pressurizados de Olefinas',
        productName: 'Eteno (Etileno)',
        capacity: 6000,
        level: 48.0,
        temp: -12.0,
        press: 17.8,
        flow: 0.0,
        density: 568.0,
        status: 'Normal',
        hhLevel: 90.0, hLevel: 80.0, lLevel: 15.0, llLevel: 5.0,
        hPress: 22.0, lPress: 10.0,
        geometry: 'spherical' as const,
      },
      {
        id: 'tank-v-401',
        tag: 'V-401',
        name: 'V-401',
        description: 'Vaso Pressurizado de Propeno V-401',
        templateId: 'tpl-pressurized-tank',
        areaId: 'area-500',
        areaName: 'Unidade 500 - Esferas e Pressurizados de Olefinas',
        productName: 'Propeno (Propileno)',
        capacity: 4000,
        level: 72.0,
        temp: 15.0,
        press: 12.4,
        flow: 0.0,
        density: 514.0,
        status: 'Normal',
        hhLevel: 90.0, hLevel: 80.0, lLevel: 15.0, llLevel: 5.0,
        hPress: 15.0, lPress: 7.0,
        geometry: 'pressurized' as const,
      },
      {
        id: 'tank-v-402',
        tag: 'V-402',
        name: 'V-402',
        description: 'Vaso Pressurizado de Propeno V-402',
        templateId: 'tpl-pressurized-tank',
        areaId: 'area-500',
        areaName: 'Unidade 500 - Esferas e Pressurizados de Olefinas',
        productName: 'Propeno (Propileno)',
        capacity: 4000,
        level: 30.0,
        temp: 16.5,
        press: 11.5,
        flow: 0.0,
        density: 514.0,
        status: 'Normal',
        hhLevel: 90.0, hLevel: 80.0, lLevel: 15.0, llLevel: 5.0,
        hPress: 15.0, lPress: 7.0,
        geometry: 'pressurized' as const,
      },
    ];

    // Deployment folders (Areas)
    const folder300Id = 'folder-area-300';
    const folder400Id = 'folder-area-400';
    const folder500Id = 'folder-area-500';

    deploymentRepo.saveFolder({
      id: folder300Id,
      name: 'Unidade 300 - Matéria-Prima',
      parentFolderId: null,
      order: 1,
      createdAt: now,
      updatedAt: now,
    });
    deploymentRepo.saveFolder({
      id: folder400Id,
      name: 'Unidade 400 - Intermediários',
      parentFolderId: null,
      order: 2,
      createdAt: now,
      updatedAt: now,
    });
    deploymentRepo.saveFolder({
      id: folder500Id,
      name: 'Unidade 500 - Olefinas Pressurizadas',
      parentFolderId: null,
      order: 3,
      createdAt: now,
      updatedAt: now,
    });

    tankSeeds.forEach((seed, idx) => {
      const vol = (seed.capacity * seed.level) / 100;
      const mass = (vol * seed.density) / 1000;
      const targetFolderId =
        seed.areaId === 'area-300' ? folder300Id :
        seed.areaId === 'area-400' ? folder400Id : folder500Id;

      // Determine graphicConfig based on template
      const tplGraphic = seed.geometry === 'horizontal_cylindrical' ? tplHoriz.graphicConfig
        : seed.geometry === 'spherical' ? tplSpherical.graphicConfig
        : seed.geometry === 'pressurized' ? tplPressurized.graphicConfig
        : tplAtm.graphicConfig;

      // Save ObjectEntity
      objectRepo.save({
        id: seed.id,
        name: seed.name,
        templateId: seed.templateId,
        description: seed.description,
        isDeployed: true,
        graphicConfig: {
          ...tplGraphic,
          geometryType: seed.geometry,
        },
        createdAt: now,
        updatedAt: now,
      });

      // -----------------------------------------------------------------------
      // Instance-level OVERRIDES only — values that differ from template defaults.
      // -----------------------------------------------------------------------
      const instanceProps: PropDef[] = [
        makeProp(seed.id, 'instance', 'Tag', 'String', seed.tag, 'TAG industrial do equipamento', 'Identificação'),
        makeProp(seed.id, 'instance', 'Description', 'String', seed.description, 'Descrição operacional', 'Identificação'),
        makeProp(seed.id, 'instance', 'Area', 'String', seed.areaName, 'Área da planta industrial', 'Identificação'),
        makeProp(seed.id, 'instance', 'Product', 'String', seed.productName, 'Produto petroquímico armazenado', 'Identificação'),
        makeProp(seed.id, 'instance', 'Status', 'String', seed.status, 'Status operacional e de inventário', 'Status'),
        makeProp(seed.id, 'instance', 'Capacity', 'Float', seed.capacity.toString(), 'Capacidade volumétrica nominal total (m³)', 'Inventário'),
        makeProp(seed.id, 'instance', 'Level', 'Float', seed.level.toString(), 'Nível medido (%)', 'Inventário'),
        makeProp(seed.id, 'instance', 'Volume', 'Float', vol.toFixed(1), 'Volume atual (m³)', 'Inventário'),
        makeProp(seed.id, 'instance', 'Temperature', 'Float', seed.temp.toString(), 'Temperatura (°C)', 'Processo'),
        makeProp(seed.id, 'instance', 'Pressure', 'Float', seed.press.toString(), 'Pressão (bar)', 'Processo'),
        makeProp(seed.id, 'instance', 'Flow', 'Float', seed.flow.toString(), 'Vazão (m³/h)', 'Processo'),
        makeProp(seed.id, 'instance', 'Density', 'Float', seed.density.toString(), 'Densidade (kg/m³)', 'Processo'),
        makeProp(seed.id, 'instance', 'VCF', 'Float', '0.994', 'Fator de Correção de Volume', 'Inventário'),
        makeProp(seed.id, 'instance', 'Mass', 'Float', mass.toFixed(1), 'Massa total armazenada (t)', 'Inventário'),
        makeProp(seed.id, 'instance', 'HighHighLevel', 'Float', seed.hhLevel.toString(), 'Limite HH de nível (%)', 'Limites'),
        makeProp(seed.id, 'instance', 'HighLevel', 'Float', seed.hLevel.toString(), 'Limite H de nível (%)', 'Limites'),
        makeProp(seed.id, 'instance', 'LowLevel', 'Float', seed.lLevel.toString(), 'Limite L de nível (%)', 'Limites'),
        makeProp(seed.id, 'instance', 'LowLowLevel', 'Float', seed.llLevel.toString(), 'Limite LL de nível (%)', 'Limites'),
        makeProp(seed.id, 'instance', 'HighPressure', 'Float', seed.hPress.toString(), 'Limite de alta pressão (bar)', 'Limites'),
        makeProp(seed.id, 'instance', 'LowPressure', 'Float', seed.lPress.toString(), 'Limite de baixa pressão (bar)', 'Limites'),
      ];

      instanceProps.forEach((p) => {
        let alarmConfig: PropertyAlarmConfig | undefined = undefined;

        if (seed.id === 'tank-tk-301' && p.name === 'Level') {
          alarmConfig = {
            enabled: true,
            rules: [
              {
                id: 'rule-tk-301-level-h',
                type: 'H',
                enabled: true,
                blocked: false,
                compareValue: '70.0',
                severity: 'high',
                priority: 75,
                message: '[TK-301] Alerta: Nível elevado de Nafta (>= 70%)',
                color: '#f97316',
                icon: 'AlertTriangle',
                activationDelay: 0,
                returnDelay: 0,
                hysteresis: 1.0,
                requireAck: true,
                historical: true,
              },
              {
                id: 'rule-tk-301-level-hh',
                type: 'HH',
                enabled: true,
                blocked: false,
                compareValue: '85.0',
                severity: 'critical',
                priority: 95,
                message: '[TK-301] ALARME CRÍTICO: Nível Muito Alto de Nafta (>= 85%)',
                color: '#ef4444',
                icon: 'ShieldAlert',
                activationDelay: 0,
                returnDelay: 0,
                hysteresis: 1.0,
                requireAck: true,
                historical: true,
              },
            ],
          };
        } else if (seed.id === 'tank-tk-302' && p.name === 'Level') {
          alarmConfig = {
            enabled: true,
            rules: [
              {
                id: 'rule-tk-302-level-l',
                type: 'L',
                enabled: true,
                blocked: false,
                compareValue: '20.0',
                severity: 'low',
                priority: 25,
                message: '[TK-302] Aviso: Nível baixo de Nafta (<= 20%)',
                color: '#3b82f6',
                icon: 'Bell',
                activationDelay: 0,
                returnDelay: 0,
                hysteresis: 1.0,
                requireAck: true,
                historical: true,
              },
            ],
          };
        } else if (seed.id === 'tank-tk-302' && p.name === 'Flow') {
          alarmConfig = {
            enabled: true,
            rules: [
              {
                id: 'rule-tk-302-flow-h',
                type: 'H',
                enabled: true,
                blocked: false,
                compareValue: '100.0',
                severity: 'medium',
                priority: 50,
                message: '[TK-302] Alerta: Vazão de enchimento alta (>= 100 m³/h)',
                color: '#eab308',
                icon: 'AlertCircle',
                activationDelay: 0,
                returnDelay: 0,
                hysteresis: 5.0,
                requireAck: true,
                historical: true,
              },
            ],
          };
        } else if (seed.id === 'tank-v-301' && p.name === 'Pressure') {
          alarmConfig = {
            enabled: true,
            rules: [
              {
                id: 'rule-v-301-press-h',
                type: 'H',
                enabled: true,
                blocked: false,
                compareValue: '18.0',
                severity: 'critical',
                priority: 90,
                message: '[V-301] ALARME CRÍTICO: Pressão alta na Esfera de Eteno (>= 18.0 bar)',
                color: '#ef4444',
                icon: 'ShieldAlert',
                activationDelay: 0,
                returnDelay: 0,
                hysteresis: 0.5,
                requireAck: true,
                historical: true,
              },
            ],
          };
        } else if (seed.id === 'tank-v-401' && p.name === 'Level') {
          alarmConfig = {
            enabled: true,
            rules: [
              {
                id: 'rule-v-401-level-h',
                type: 'H',
                enabled: true,
                blocked: false,
                compareValue: '70.0',
                severity: 'high',
                priority: 70,
                message: '[V-401] Alerta: Nível elevado no Vaso de Propeno (>= 70%)',
                color: '#f97316',
                icon: 'AlertTriangle',
                activationDelay: 0,
                returnDelay: 0,
                hysteresis: 1.0,
                requireAck: true,
                historical: true,
              },
            ],
          };
        } else if (seed.id === 'tank-v-401' && p.name === 'Temperature') {
          alarmConfig = {
            enabled: true,
            rules: [
              {
                id: 'rule-v-401-temp-h',
                type: 'H',
                enabled: true,
                blocked: false,
                compareValue: '20.0',
                severity: 'medium',
                priority: 55,
                message: '[V-401] Alerta: Temperatura do Propeno acima do normal (>= 20 °C)',
                color: '#eab308',
                icon: 'AlertCircle',
                activationDelay: 0,
                returnDelay: 0,
                hysteresis: 0.5,
                requireAck: true,
                historical: true,
              },
            ],
          };
        } else if (seed.id === 'tank-tk-403' && p.name === 'Pressure') {
          alarmConfig = {
            enabled: true,
            rules: [
              {
                id: 'rule-tk-403-press-l',
                type: 'L',
                enabled: true,
                blocked: false,
                compareValue: '1.0',
                severity: 'low',
                priority: 30,
                message: '[TK-403] Aviso: Pressão abaixo do nominal (<= 1.0 bar)',
                color: '#3b82f6',
                icon: 'Bell',
                activationDelay: 0,
                returnDelay: 0,
                hysteresis: 0.05,
                requireAck: true,
                historical: true,
              },
            ],
          };
        }

        propertyRepo.save({ id: uuidv4(), ...p, alarmConfig, createdAt: now, updatedAt: now });
      });

      // Save Deployment Node
      deploymentRepo.saveNode({
        id: uuidv4(),
        type: 'object',
        targetId: seed.id,
        parentFolderId: targetFolderId,
        order: idx + 1,
        createdAt: now,
        updatedAt: now,
      });
    });

    const n = Date.now();
    const initialMovements = [
      {
        id: 'mov-0001',
        code: 'MOV-0001',
        description: 'Transferência de Nafta TK-301 → TK-302',
        sourceTankId: 'tank-tk-301',
        sourceTankTag: 'TK-301',
        destinationTankId: 'tank-tk-302',
        destinationTankTag: 'TK-302',
        productId: 'prod-naphtha',
        productName: 'Nafta Petroquímica',
        via: 'Duto Principal D-301',
        areaId: 'area-300',
        operatorId: 'usr-1',
        operatorName: 'Carlos Silva',
        flowRate: 120.0,
        plannedVolume: 2000.0,
        volumeMoved: 450.0,
        remainingVolume: 1550.0,
        status: 'Active',
        ettc: '12.9h',
        etoc: '12.9h',
        startTime: new Date(n - 3600000 * 2).toISOString(),
      },
      {
        id: 'mov-0004',
        code: 'MOV-0004',
        description: 'Transferência de Propeno V-401 → V-402',
        sourceTankId: 'tank-v-401',
        sourceTankTag: 'V-401',
        destinationTankId: 'tank-v-402',
        destinationTankTag: 'V-402',
        productId: 'prod-propene',
        productName: 'Propeno (Propileno)',
        via: 'Manifold de Olefinas M-501',
        areaId: 'area-500',
        operatorId: 'usr-3',
        operatorName: 'Roberto Mendes',
        flowRate: 80.0,
        plannedVolume: 600.0,
        volumeMoved: 120.0,
        remainingVolume: 480.0,
        status: 'Active',
        ettc: '6.0h',
        etoc: '6.0h',
        startTime: new Date(n - 3600000 * 1.5).toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(initialMovements));

    // Evaluate initial alarms dynamically for all deployed objects
    const objects = objectRepo.getAll();
    const simValues: Record<string, string> = {};
    const allProps = propertyRepo.getAll();
    allProps.forEach((p) => {
      simValues[`${p.targetId}:${p.name}`] = p.defaultValue;
    });

    AlarmEngine.evaluate(
      simValues,
      objects,
      (objectId, type) => inheritanceService.getMergedProperties(objectId, type)
    );

    localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
  }
}

export const seedService = new SeedService();
