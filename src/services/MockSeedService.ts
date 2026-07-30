import { v4 as uuidv4 } from 'uuid';
import { STORAGE_KEYS } from '../repository/storageKey';
import { templateRepo } from '../repository/TemplateRepository';
import { objectRepo } from '../repository/ObjectRepository';
import { propertyRepo } from '../repository/PropertyRepository';
import { scriptRepo } from '../repository/ScriptRepository';
import { deploymentRepo } from '../repository/DeploymentRepository';
import { associatedWidgetRepo } from '../repository/AssociatedWidgetRepository';
import { widgetRepo } from '../repository/WidgetRepository';
import { mockConfigRepo } from '../repository/MockConfigRepository';
import { alarmRepo } from '../repository/AlarmRepository';
import { flowchartRepo } from '../repository/FlowchartRepository';
import { screenRepo } from '../repository/ScreenRepository';
import { screenFolderRepo } from '../repository/ScreenFolderRepository';
import { widgetFolderRepo } from '../repository/WidgetFolderRepository';
import { opcRepo } from '../repository/OpcRepository';
import { useConnectivityStore } from '../store/useConnectivityStore';

export class MockSeedService {
  public seedMockData(): void {
    // 1. Wipe existing data in repositories
    templateRepo.saveAll([]);
    objectRepo.saveAll([]);
    propertyRepo.saveAll([]);
    scriptRepo.saveAll([]);
    deploymentRepo.saveAllFolders([]);
    deploymentRepo.saveAllNodes([]);
    associatedWidgetRepo.saveAll([]);
    mockConfigRepo.saveAll([]);
    alarmRepo.clear();
    widgetRepo.saveAll([]);
    widgetFolderRepo.saveFolders([]);
    widgetFolderRepo.saveNodes([]);
    screenRepo.saveAll([]);
    screenFolderRepo.saveAllFolders([]);
    screenFolderRepo.saveAllNodes([]);
    opcRepo.saveAll([]);

    const now = new Date().toISOString();

    // 2. Templates
    // Tank (Tanque) Template
    const tankTemplateId = uuidv4();
    templateRepo.save({
      id: tankTemplateId,
      name: 'Tanque Industrial Template',
      parentTemplateId: null,
      description: 'Template para tanques verticais com controle de nível, temperatura e segurança de fluxo',
      createdAt: now,
      updatedAt: now,
    });

    // Tank Properties
    const tankProps = [
      { name: 'Tag', dataType: 'String', defaultValue: 'TQ-MOCK-001', description: 'Tag identificadora do Tanque' },
      { name: 'Level_PV', dataType: 'Float', defaultValue: '50.0', description: 'Nível atual do tanque (%)' },
      { name: 'Temp_PV', dataType: 'Float', defaultValue: '25.0', description: 'Temperatura interna do fluido (°C)' },
      { name: 'InletValveStatus', dataType: 'Boolean', defaultValue: 'false', description: 'Estado da válvula de entrada (Aberta/Fechada)' },
      { name: 'OutletValveStatus', dataType: 'Boolean', defaultValue: 'false', description: 'Estado da válvula de saída (Aberta/Fechada)' },
    ];

    const tankPropIds: Record<string, string> = {};
    tankProps.forEach((p) => {
      let alarmConfig: any = undefined;
      const propId = uuidv4();
      tankPropIds[p.name] = propId;

      if (p.name === 'Level_PV') {
        alarmConfig = {
          enabled: true,
          rules: [
            {
              id: uuidv4(),
              type: 'H',
              enabled: true,
              blocked: false,
              compareValue: '85.0',
              severity: 'high',
              priority: 75,
              message: 'Nível do Tanque Alto (> 85%)',
              color: '#f97316',
              icon: 'AlertTriangle',
              activationDelay: 1,
              returnDelay: 1,
              hysteresis: 1.0,
              requireAck: true,
              historical: true,
            },
            {
              id: uuidv4(),
              type: 'HH',
              enabled: true,
              blocked: false,
              compareValue: '95.0',
              severity: 'critical',
              priority: 98,
              message: 'Nível do Tanque Crítico (> 95%) - Risco de Transbordo',
              color: '#ef4444',
              icon: 'ShieldAlert',
              activationDelay: 0,
              returnDelay: 1,
              hysteresis: 0.5,
              requireAck: true,
              historical: true,
            }
          ]
        };
      } else if (p.name === 'Temp_PV') {
        alarmConfig = {
          enabled: true,
          rules: [
            {
              id: uuidv4(),
              type: 'H',
              enabled: true,
              blocked: false,
              compareValue: '70.0',
              severity: 'high',
              priority: 60,
              message: 'Temperatura do Tanque Alta (> 70°C)',
              color: '#eab308',
              icon: 'AlertCircle',
              activationDelay: 2,
              returnDelay: 2,
              hysteresis: 2.0,
              requireAck: true,
              historical: true,
            }
          ]
        };
      }

      propertyRepo.save({
        id: propId,
        targetId: tankTemplateId,
        targetType: 'template',
        name: p.name,
        dataType: p.dataType as any,
        defaultValue: p.defaultValue,
        description: p.description,
        alarmConfig,
        createdAt: now,
        updatedAt: now,
      });
    });

    // Sphere (Esfera) Template
    const sphereTemplateId = uuidv4();
    templateRepo.save({
      id: sphereTemplateId,
      name: 'Esfera Gás Template',
      parentTemplateId: null,
      description: 'Template para vasos de pressão esféricos utilizados no armazenamento de gases liquefeitos',
      createdAt: now,
      updatedAt: now,
    });

    // Sphere Properties
    const sphereProps = [
      { name: 'Tag', dataType: 'String', defaultValue: 'ESF-MOCK-002', description: 'Tag identificadora da Esfera' },
      { name: 'Pressure_PV', dataType: 'Float', defaultValue: '12.0', description: 'Pressão interna da Esfera (bar)' },
      { name: 'Temp_PV', dataType: 'Float', defaultValue: '30.0', description: 'Temperatura interna (°C)' },
      { name: 'SafetyValveStatus', dataType: 'Boolean', defaultValue: 'false', description: 'Status da válvula de alívio de segurança (Aberta/Fechada)' },
      { name: 'Level_PV', dataType: 'Float', defaultValue: '45.0', description: 'Nível volumétrico do líquido comprimido (%)' },
    ];

    const spherePropIds: Record<string, string> = {};
    sphereProps.forEach((p) => {
      let alarmConfig: any = undefined;
      const propId = uuidv4();
      spherePropIds[p.name] = propId;

      if (p.name === 'Pressure_PV') {
        alarmConfig = {
          enabled: true,
          rules: [
            {
              id: uuidv4(),
              type: 'H',
              enabled: true,
              blocked: false,
              compareValue: '18.0',
              severity: 'high',
              priority: 85,
              message: 'Pressão da Esfera Elevada (> 18 bar)',
              color: '#f97316',
              icon: 'AlertTriangle',
              activationDelay: 1,
              returnDelay: 1,
              hysteresis: 0.5,
              requireAck: true,
              historical: true,
            },
            {
              id: uuidv4(),
              type: 'HH',
              enabled: true,
              blocked: false,
              compareValue: '22.0',
              severity: 'critical',
              priority: 99,
              message: 'Pressão da Esfera Crítica (> 22 bar) - Alívio Necessário',
              color: '#ef4444',
              icon: 'ShieldAlert',
              activationDelay: 0,
              returnDelay: 1,
              hysteresis: 0.2,
              requireAck: true,
              historical: true,
            }
          ]
        };
      }

      propertyRepo.save({
        id: propId,
        targetId: sphereTemplateId,
        targetType: 'template',
        name: p.name,
        dataType: p.dataType as any,
        defaultValue: p.defaultValue,
        description: p.description,
        alarmConfig,
        createdAt: now,
        updatedAt: now,
      });
    });

    // 3. Simulator Configurations
    // Tank Simulators
    mockConfigRepo.save({
      id: uuidv4(),
      targetId: tankTemplateId,
      targetType: 'template',
      propertyName: 'Level_PV',
      enabled: true,
      preset: 'sine',
      params: { min: 25, max: 92, periodSeconds: 20, decimals: 1 },
      createdAt: now,
      updatedAt: now,
    });
    mockConfigRepo.save({
      id: uuidv4(),
      targetId: tankTemplateId,
      targetType: 'template',
      propertyName: 'Temp_PV',
      enabled: true,
      preset: 'walk',
      params: { min: 22, max: 48, step: 0.3, decimals: 1 },
      createdAt: now,
      updatedAt: now,
    });
    mockConfigRepo.save({
      id: uuidv4(),
      targetId: tankTemplateId,
      targetType: 'template',
      propertyName: 'InletValveStatus',
      enabled: true,
      preset: 'sine',
      params: { min: 0, max: 1, periodSeconds: 15, decimals: 0 },
      createdAt: now,
      updatedAt: now,
    });

    // Sphere Simulators
    mockConfigRepo.save({
      id: uuidv4(),
      targetId: sphereTemplateId,
      targetType: 'template',
      propertyName: 'Pressure_PV',
      enabled: true,
      preset: 'walk',
      params: { min: 10, max: 24, step: 0.5, decimals: 2 },
      createdAt: now,
      updatedAt: now,
    });
    mockConfigRepo.save({
      id: uuidv4(),
      targetId: sphereTemplateId,
      targetType: 'template',
      propertyName: 'Temp_PV',
      enabled: true,
      preset: 'sine',
      params: { min: 28, max: 62, periodSeconds: 30, decimals: 1 },
      createdAt: now,
      updatedAt: now,
    });
    mockConfigRepo.save({
      id: uuidv4(),
      targetId: sphereTemplateId,
      targetType: 'template',
      propertyName: 'Level_PV',
      enabled: true,
      preset: 'sine',
      params: { min: 30, max: 80, periodSeconds: 25, decimals: 1 },
      createdAt: now,
      updatedAt: now,
    });

    // 4. Objects (Instances)
    const tankInstId = uuidv4();
    objectRepo.save({
      id: tankInstId,
      name: 'TQ_01_Armazenamento',
      templateId: tankTemplateId,
      description: 'Tanque Vertical de Armazenamento Principal de Fluido - Área A',
      isDeployed: true,
      createdAt: now,
      updatedAt: now,
    });

    const sphereInstId = uuidv4();
    objectRepo.save({
      id: sphereInstId,
      name: 'ESF_02_Propano',
      templateId: sphereTemplateId,
      description: 'Esfera de Armazenamento de Gás Liquefeito - Área B',
      isDeployed: true,
      createdAt: now,
      updatedAt: now,
    });

    // 5. Deployment Folders & Nodes
    const rootFolderId = uuidv4();
    deploymentRepo.saveFolder({
      id: rootFolderId,
      name: 'Planta Serrano',
      parentFolderId: null,
      order: 0,
      createdAt: now,
      updatedAt: now,
    });

    const areaAFolderId = uuidv4();
    deploymentRepo.saveFolder({
      id: areaAFolderId,
      name: 'Área A - Estocagem Líquidos',
      parentFolderId: rootFolderId,
      order: 0,
      createdAt: now,
      updatedAt: now,
    });

    const areaBFolderId = uuidv4();
    deploymentRepo.saveFolder({
      id: areaBFolderId,
      name: 'Área B - Estocagem Gases',
      parentFolderId: rootFolderId,
      order: 1,
      createdAt: now,
      updatedAt: now,
    });

    // Deployment nodes mapping
    deploymentRepo.saveNode({
      id: uuidv4(),
      type: 'folder',
      targetId: areaAFolderId,
      parentFolderId: rootFolderId,
      order: 0,
      createdAt: now,
      updatedAt: now,
    });
    deploymentRepo.saveNode({
      id: uuidv4(),
      type: 'object',
      targetId: tankInstId,
      parentFolderId: areaAFolderId,
      order: 0,
      createdAt: now,
      updatedAt: now,
    });
    deploymentRepo.saveNode({
      id: uuidv4(),
      type: 'folder',
      targetId: areaBFolderId,
      parentFolderId: rootFolderId,
      order: 1,
      createdAt: now,
      updatedAt: now,
    });
    deploymentRepo.saveNode({
      id: uuidv4(),
      type: 'object',
      targetId: sphereInstId,
      parentFolderId: areaBFolderId,
      order: 0,
      createdAt: now,
      updatedAt: now,
    });

    // 6. OPC Tag Seeds
    const opcServerId = uuidv4();
    const opcTags = [
      { id: opcServerId, name: 'Serrano_OPC_Server', type: 'server_ua' as const, path: 'Serrano_OPC_Server', parentId: null },
      { id: uuidv4(), name: 'Planta_Mock', type: 'area' as const, path: 'Serrano_OPC_Server.Planta_Mock', parentId: opcServerId },
      // Tank tags
      {
        id: uuidv4(),
        name: 'TQ_01_Level',
        type: 'tag' as const,
        path: 'Serrano_OPC_Server.Planta_Mock.TQ_01_Level',
        dataType: 'Float' as const,
        value: '52.4',
        quality: 'Good' as const,
        timestamp: now,
        engineeringUnit: '%',
        description: 'Vazão/Nível lido diretamente do Transmissor de Nível LT-101',
        parentId: null as string | null,
      },
      // Sphere tags
      {
        id: uuidv4(),
        name: 'ESF_02_Pressure',
        type: 'tag' as const,
        path: 'Serrano_OPC_Server.Planta_Mock.ESF_02_Pressure',
        dataType: 'Float' as const,
        value: '12.85',
        quality: 'Good' as const,
        timestamp: now,
        engineeringUnit: 'bar',
        description: 'Pressão lida diretamente do sensor PT-202 da Esfera 2',
        parentId: null as string | null,
      }
    ];

    // Correct parent relationships
    opcTags[1].parentId = opcTags[0].id;
    opcTags[2].parentId = opcTags[1].id;
    opcTags[3].parentId = opcTags[1].id;
    opcRepo.saveAll(opcTags as any);

    // 7. Widgets Creation (PREMIUM DESIGN & DYNAMICS)
    const widgetFolderId = uuidv4();
    widgetFolderRepo.saveFolders([
      {
        id: widgetFolderId,
        name: 'Serrano Premium Mock',
        parentFolderId: null,
        order: 0,
        createdAt: now,
        updatedAt: now,
      }
    ]);

    // Widget 1: Premium Vertical Tank Monitor
    const tankWidgetId = uuidv4();
    const tankWLevelId = uuidv4();
    const tankWTempId = uuidv4();
    const tankWInletId = uuidv4();

    const tankWidget = {
      id: tankWidgetId,
      name: 'Tanque Premium Monitor',
      description: 'Painel completo do Tanque com animação gradativa de fluidos, LED de alarmes e dados.',
      canvasWidth: 360,
      canvasHeight: 340,
      backgroundColor: '#090d16',
      gridSize: 10,
      customProperties: [
        { id: tankWLevelId, name: 'Level_PV', dataType: 'Float' as const, defaultValue: '50.0', description: 'Nível (%)' },
        { id: tankWTempId, name: 'Temp_PV', dataType: 'Float' as const, defaultValue: '25.0', description: 'Temperatura (°C)' },
        { id: tankWInletId, name: 'InletStatus', dataType: 'Boolean' as const, defaultValue: 'false', description: 'Válvula de Entrada' },
      ],
      elements: [
        // Card Background Frame
        {
          id: uuidv4(),
          name: 'Outer Card Frame',
          type: 'rectangle' as const,
          x: 10,
          y: 10,
          width: 340,
          height: 320,
          rotation: 0,
          zIndex: 1,
          fill: '#0f172a',
          stroke: '#1e293b',
          strokeWidth: 2,
          strokeStyle: 'solid' as const,
          cornerRadius: 16,
          bindings: [],
        },
        // Header Text
        {
          id: uuidv4(),
          name: 'Widget Title',
          type: 'text' as const,
          x: 25,
          y: 25,
          width: 200,
          height: 25,
          rotation: 0,
          zIndex: 2,
          fill: 'transparent',
          stroke: 'transparent',
          strokeWidth: 0,
          strokeStyle: 'solid' as const,
          fontSize: 14,
          textContent: 'TQ-MOCK-001 (Armazenamento)',
          textColor: '#94a3b8',
          bindings: [],
        },
        // Led Indicator / Alarm light
        {
          id: uuidv4(),
          name: 'Alarm Status Led',
          type: 'status_light' as const,
          x: 300,
          y: 20,
          width: 20,
          height: 20,
          rotation: 0,
          zIndex: 3,
          fill: '#10b981',
          stroke: '#047857',
          strokeWidth: 1.5,
          strokeStyle: 'solid' as const,
          bindings: [],
          dynamics: [
            {
              id: uuidv4(),
              type: 'fill' as const,
              variableId: tankWLevelId,
              config: {
                ranges: [
                  { lo: 0, hi: 85, color: '#10b981' }, // Good
                  { lo: 85, hi: 95, color: '#f59e0b' }, // High (Orange)
                  { lo: 95, hi: 100, color: '#ef4444' } // Critical (Red)
                ]
              }
            }
          ]
        },
        // Physical Tank Structure
        {
          id: uuidv4(),
          name: 'Tank Vessel body',
          type: 'tank' as const,
          x: 40,
          y: 70,
          width: 140,
          height: 200,
          rotation: 0,
          zIndex: 2,
          fill: '#1e293b',
          stroke: '#475569',
          strokeWidth: 3,
          strokeStyle: 'solid' as const,
          bindings: [],
          dynamics: [
            {
              id: uuidv4(),
              type: 'fill_level' as const,
              variableId: tankWLevelId,
              config: {
                fillLevel: {
                  minValue: 0,
                  maxValue: 100,
                  fillColor: '#0ea5e9', // Blue fluid
                  emptyColor: '#1e293b',
                  direction: 'bottom-up'
                }
              }
            }
          ]
        },
        // Level Indicator Text overlay
        {
          id: uuidv4(),
          name: 'Tank Level Pct Overlay',
          type: 'text' as const,
          x: 50,
          y: 150,
          width: 120,
          height: 30,
          rotation: 0,
          zIndex: 4,
          fill: 'transparent',
          stroke: 'transparent',
          strokeWidth: 0,
          strokeStyle: 'solid' as const,
          fontSize: 20,
          textContent: '50.0 %',
          textColor: '#ffffff',
          textAlignment: 'center' as const,
          bindings: [
            { id: uuidv4(), property: 'textContent' as const, customPropId: tankWLevelId }
          ],
        },
        // Numeric Display temperature
        {
          id: uuidv4(),
          name: 'Temperature Box',
          type: 'variable_display' as const,
          x: 200,
          y: 80,
          width: 130,
          height: 50,
          rotation: 0,
          zIndex: 3,
          fill: '#0f172a',
          stroke: '#3b82f6',
          strokeWidth: 1.5,
          strokeStyle: 'solid' as const,
          cornerRadius: 8,
          fontSize: 12,
          textColor: '#3b82f6',
          textAlignment: 'center' as const,
          showLabel: true,
          showUnit: true,
          unit: '°C',
          decimalPlaces: 1,
          customLabel: 'Temperatura',
          bindings: [
            { id: uuidv4(), property: 'textContent' as const, customPropId: tankWTempId }
          ],
        },
        // Inlet valve status display
        {
          id: uuidv4(),
          name: 'Inlet Valve Status Display',
          type: 'variable_display' as const,
          x: 200,
          y: 150,
          width: 130,
          height: 50,
          rotation: 0,
          zIndex: 3,
          fill: '#0f172a',
          stroke: '#10b981',
          strokeWidth: 1.5,
          strokeStyle: 'solid' as const,
          cornerRadius: 8,
          fontSize: 12,
          textColor: '#10b981',
          textAlignment: 'center' as const,
          showLabel: true,
          showUnit: false,
          customLabel: 'Valv. Entrada',
          bindings: [
            { id: uuidv4(), property: 'textContent' as const, customPropId: tankWInletId }
          ],
        }
      ],
      createdAt: now,
      updatedAt: now,
    };

    // Widget 2: Gas Sphere Monitor Widget
    const sphereWidgetId = uuidv4();
    const sphereWPressId = uuidv4();
    const sphereWTempId = uuidv4();
    const sphereWLevelId = uuidv4();

    const sphereWidget = {
      id: sphereWidgetId,
      name: 'Esfera Premium Monitor',
      description: 'Painel dinâmico em formato esférico com indicador de pressão e nível volumétrico em gradiente premium.',
      canvasWidth: 360,
      canvasHeight: 340,
      backgroundColor: '#090d16',
      gridSize: 10,
      customProperties: [
        { id: sphereWPressId, name: 'Pressure_PV', dataType: 'Float' as const, defaultValue: '12.0', description: 'Pressão (bar)' },
        { id: sphereWTempId, name: 'Temp_PV', dataType: 'Float' as const, defaultValue: '30.0', description: 'Temperatura (°C)' },
        { id: sphereWLevelId, name: 'Level_PV', dataType: 'Float' as const, defaultValue: '45.0', description: 'Nível Gás (%)' },
      ],
      elements: [
        // Card Frame
        {
          id: uuidv4(),
          name: 'Outer Frame',
          type: 'rectangle' as const,
          x: 10,
          y: 10,
          width: 340,
          height: 320,
          rotation: 0,
          zIndex: 1,
          fill: '#0e1726',
          stroke: '#3b82f6',
          strokeWidth: 1.5,
          strokeStyle: 'solid' as const,
          cornerRadius: 16,
          bindings: [],
        },
        // Structural Legs for the Gas Sphere (aesthetic lines)
        {
          id: uuidv4(),
          name: 'Left Leg Pillar',
          type: 'line' as const,
          x: 80,
          y: 200,
          width: 20,
          height: 80,
          rotation: 0,
          zIndex: 2,
          fill: 'transparent',
          stroke: '#475569',
          strokeWidth: 4,
          strokeStyle: 'solid' as const,
          bindings: [],
        },
        {
          id: uuidv4(),
          name: 'Right Leg Pillar',
          type: 'line' as const,
          x: 160,
          y: 200,
          width: 20,
          height: 80,
          rotation: 0,
          zIndex: 2,
          fill: 'transparent',
          stroke: '#475569',
          strokeWidth: 4,
          strokeStyle: 'solid' as const,
          bindings: [],
        },
        // Sphere Vessel body (Circle shape with fill level inside)
        {
          id: uuidv4(),
          name: 'Sphere Body Vessel',
          type: 'circle' as const,
          x: 50,
          y: 70,
          width: 160,
          height: 160,
          rotation: 0,
          zIndex: 3,
          fill: '#1e293b',
          stroke: '#3b82f6',
          strokeWidth: 3,
          strokeStyle: 'solid' as const,
          bindings: [],
          dynamics: [
            {
              id: uuidv4(),
              type: 'fill_level' as const,
              variableId: sphereWLevelId,
              config: {
                fillLevel: {
                  minValue: 0,
                  maxValue: 100,
                  fillColor: '#8b5cf6', // Purple liquified gas
                  emptyColor: '#1e293b',
                  direction: 'bottom-up'
                }
              }
            },
            {
              id: uuidv4(),
              type: 'stroke' as const,
              variableId: sphereWPressId,
              config: {
                ranges: [
                  { lo: 0, hi: 18, color: '#3b82f6' }, // OK
                  { lo: 18, hi: 22, color: '#f97316' }, // High
                  { lo: 22, hi: 50, color: '#ef4444' } // High-High (Flash red)
                ]
              }
            }
          ]
        },
        // Pressure Readout text inside sphere
        {
          id: uuidv4(),
          name: 'Pressure Digital readout',
          type: 'text' as const,
          x: 70,
          y: 130,
          width: 120,
          height: 40,
          rotation: 0,
          zIndex: 4,
          fill: 'transparent',
          stroke: 'transparent',
          strokeWidth: 0,
          strokeStyle: 'solid' as const,
          fontSize: 18,
          textContent: '12.0 bar',
          textColor: '#ffffff',
          textAlignment: 'center' as const,
          bindings: [
            { id: uuidv4(), property: 'textContent' as const, customPropId: sphereWPressId }
          ],
        },
        // Variable Display Box 1: Temperature
        {
          id: uuidv4(),
          name: 'Sphere Temp Value Display',
          type: 'variable_display' as const,
          x: 225,
          y: 80,
          width: 110,
          height: 50,
          rotation: 0,
          zIndex: 4,
          fill: '#0f172a',
          stroke: '#6366f1',
          strokeWidth: 1,
          strokeStyle: 'solid' as const,
          cornerRadius: 8,
          fontSize: 12,
          textColor: '#a5b4fc',
          textAlignment: 'center' as const,
          showLabel: true,
          showUnit: true,
          unit: '°C',
          decimalPlaces: 1,
          customLabel: 'Temp. Gás',
          bindings: [
            { id: uuidv4(), property: 'textContent' as const, customPropId: sphereWTempId }
          ],
        },
        // Variable Display Box 2: Volume level
        {
          id: uuidv4(),
          name: 'Sphere Level Pct Display',
          type: 'variable_display' as const,
          x: 225,
          y: 150,
          width: 110,
          height: 50,
          rotation: 0,
          zIndex: 4,
          fill: '#0f172a',
          stroke: '#8b5cf6',
          strokeWidth: 1,
          strokeStyle: 'solid' as const,
          cornerRadius: 8,
          fontSize: 12,
          textColor: '#c084fc',
          textAlignment: 'center' as const,
          showLabel: true,
          showUnit: true,
          unit: '%',
          decimalPlaces: 1,
          customLabel: 'Vol. Líquido',
          bindings: [
            { id: uuidv4(), property: 'textContent' as const, customPropId: sphereWLevelId }
          ],
        }
      ],
      createdAt: now,
      updatedAt: now,
    };

    widgetRepo.saveAll([tankWidget, sphereWidget]);

    const widgetNodes = [
      {
        id: widgetFolderId,
        type: 'folder' as const,
        targetId: widgetFolderId,
        parentFolderId: null,
        order: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: tankWidgetId,
        type: 'widget' as const,
        targetId: tankWidgetId,
        parentFolderId: widgetFolderId,
        order: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: sphereWidgetId,
        type: 'widget' as const,
        targetId: sphereWidgetId,
        parentFolderId: widgetFolderId,
        order: 1,
        createdAt: now,
        updatedAt: now,
      }
    ];
    widgetFolderRepo.saveNodes(widgetNodes);

    // 8. Associate Widgets with Templates
    associatedWidgetRepo.save({
      id: uuidv4(),
      targetId: tankTemplateId,
      targetType: 'template',
      widgetId: tankWidgetId,
      mappings: {
        [tankWLevelId]: { type: 'property', value: 'me.Level_PV' },
        [tankWTempId]: { type: 'property', value: 'me.Temp_PV' },
        [tankWInletId]: { type: 'property', value: 'me.InletValveStatus' },
      },
      createdAt: now,
      updatedAt: now,
    });

    associatedWidgetRepo.save({
      id: uuidv4(),
      targetId: sphereTemplateId,
      targetType: 'template',
      widgetId: sphereWidgetId,
      mappings: {
        [sphereWPressId]: { type: 'property', value: 'me.Pressure_PV' },
        [sphereWTempId]: { type: 'property', value: 'me.Temp_PV' },
        [sphereWLevelId]: { type: 'property', value: 'me.Level_PV' },
      },
      createdAt: now,
      updatedAt: now,
    });

    // 9. Screens (Telas) Creation
    const screenFolderId = uuidv4();
    screenFolderRepo.saveAllFolders([
      {
        id: screenFolderId,
        name: 'Sinópticos Serrano',
        parentFolderId: null,
        order: 0,
        createdAt: now,
        updatedAt: now,
      }
    ]);

    const mainScreenId = uuidv4();
    const screenElement1Id = uuidv4();
    const screenElement2Id = uuidv4();

    const mainScreen = {
      id: mainScreenId,
      name: 'Sinóptico de Distribuição e Estocagem',
      description: 'Fluxo sinóptico de automação ligando o Tanque TQ-01 à Esfera ESF-02 com controle em tempo real.',
      canvasWidth: 1000,
      canvasHeight: 550,
      backgroundColor: '#0a0f1d',
      gridSize: 10,
      elements: [
        // Title Text on Screen
        {
          id: uuidv4(),
          name: 'Screen Title Header',
          type: 'text' as const,
          x: 30,
          y: 20,
          width: 600,
          height: 40,
          rotation: 0,
          zIndex: 1,
          fill: 'transparent',
          stroke: 'transparent',
          strokeWidth: 0,
          strokeStyle: 'solid' as const,
          fontSize: 22,
          textContent: 'TERMINAL DE LOGÍSTICA E REFINO - SERRANO',
          textColor: '#f8fafc',
          bindings: [],
        },
        // Decorative Pipes connecting Tank and Sphere
        {
          id: uuidv4(),
          name: 'Horizontal Pipe Line 1',
          type: 'line' as const,
          x: 390,
          y: 230,
          width: 170,
          height: 10,
          rotation: 0,
          zIndex: 1,
          fill: 'transparent',
          stroke: '#3b82f6',
          strokeWidth: 8,
          strokeStyle: 'solid' as const,
          bindings: [],
        },
        {
          id: uuidv4(),
          name: 'Vertical Pipe Drop',
          type: 'line' as const,
          x: 560,
          y: 230,
          width: 10,
          height: 80,
          rotation: 0,
          zIndex: 1,
          fill: 'transparent',
          stroke: '#3b82f6',
          strokeWidth: 8,
          strokeStyle: 'solid' as const,
          bindings: [],
        },
        // Premium Tank Instance (using our customized Widget Instance)
        {
          id: screenElement1Id,
          name: 'TQ_01 Widget Instance',
          type: 'widget-instance' as const,
          x: 30,
          y: 80,
          width: 360,
          height: 340,
          zIndex: 5,
          rotation: 0,
          objectId: tankInstId,
          widgetId: tankWidgetId,
          mappings: {
            [tankWLevelId]: { type: 'property' as const, value: 'me.Level_PV' },
            [tankWTempId]: { type: 'property' as const, value: 'me.Temp_PV' },
            [tankWInletId]: { type: 'property' as const, value: 'me.InletValveStatus' },
          }
        },
        // Premium Sphere Instance (using our customized Widget Instance)
        {
          id: screenElement2Id,
          name: 'ESF_02 Widget Instance',
          type: 'widget-instance' as const,
          x: 570,
          y: 120,
          width: 360,
          height: 340,
          zIndex: 5,
          rotation: 0,
          objectId: sphereInstId,
          widgetId: sphereWidgetId,
          mappings: {
            [sphereWPressId]: { type: 'property' as const, value: 'me.Pressure_PV' },
            [sphereWTempId]: { type: 'property' as const, value: 'me.Temp_PV' },
            [sphereWLevelId]: { type: 'property' as const, value: 'me.Level_PV' },
          }
        },
        // Flow indicators
        {
          id: uuidv4(),
          name: 'Flow Label Indicator',
          type: 'text' as const,
          x: 410,
          y: 200,
          width: 130,
          height: 25,
          rotation: 0,
          zIndex: 3,
          fill: 'transparent',
          stroke: 'transparent',
          strokeWidth: 0,
          strokeStyle: 'solid' as const,
          fontSize: 12,
          textContent: 'FLUXO DE TRANSFERÊNCIA',
          textColor: '#60a5fa',
          textAlignment: 'center' as const,
          bindings: [],
        }
      ],
      createdAt: now,
      updatedAt: now,
    };

    screenRepo.saveAll([mainScreen]);

    const screenNodes = [
      {
        id: screenFolderId,
        type: 'folder' as const,
        targetId: screenFolderId,
        parentFolderId: null,
        order: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: mainScreenId,
        type: 'screen' as const,
        targetId: mainScreenId,
        parentFolderId: screenFolderId,
        order: 0,
        createdAt: now,
        updatedAt: now,
      }
    ];
    screenFolderRepo.saveAllNodes(screenNodes);

    // 10. Process Flowcharts (BPMN Flowcharts)
    flowchartRepo.saveAll([
      {
        id: uuidv4(),
        name: 'Controle de Pressurização e Drenagem da Esfera',
        description: 'Fluxo operacional de segurança para alívio automático de pressão e contingenciamento na Esfera de Propano.',
        category: 'Rotina de Segurança',
        tags: ['Gás', 'Pressão', 'Válvula Alívio', 'Esfera'],
        version: '1.0.2',
        author: 'Sistemas Serrano',
        contextType: 'global',
        targetId: null,
        folderId: null,
        bpmnXml: `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_MockFlow" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_MockFlow" isExecutable="false">
    <bpmn:startEvent id="Start_Press" name="Sensor de Pressão > 18 bar">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:serviceTask id="Task_OpenSafetyValve" name="Escrever Propriedade: Abrir Válvula Alívio">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:serviceTask>
    <bpmn:intermediateCatchEvent id="Event_Vent" name="Aguardar Redução Pressão">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
    </bpmn:intermediateCatchEvent>
    <bpmn:endEvent id="End_Safe" name="Pressão Normalizada">
      <bpmn:incoming>Flow_3</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="Start_Press" targetRef="Task_OpenSafetyValve" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_OpenSafetyValve" targetRef="Event_Vent" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Event_Vent" targetRef="End_Safe" />
  </bpmn:process>
</bpmn:definitions>`,
        nodeMetadata: {
          Task_OpenSafetyValve: {
            id: 'Task_OpenSafetyValve',
            name: 'Abrir Válvula Alívio',
            isIndustrialNode: true,
            industrialType: 'execute_script',
          }
        },
        createdAt: now,
        updatedAt: now,
      }
    ]);

    // 11. Connectivity Seeding
    useConnectivityStore.getState().resetToSeedData();

    // Mark storage as seeded
    localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
  }
}

export const mockSeedService = new MockSeedService();
