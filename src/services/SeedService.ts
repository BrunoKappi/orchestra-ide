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
import { widgetSeedService } from './WidgetSeedService';


export class SeedService {
  public seedInitialDataIfNeeded(force: boolean = false): void {
    const isSeeded = localStorage.getItem(STORAGE_KEYS.SEEDED);
    if (isSeeded && !force) return;

    // Clear existing data
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

    // 1. Tank Template (Root Template)
    const tankTemplateId = uuidv4();
    templateRepo.save({
      id: tankTemplateId,
      name: 'Tank Template',
      parentTemplateId: null,
      description: 'Base template for industrial process tanks',
      createdAt: now,
      updatedAt: now,
    });

    // Tank Template Properties
    const tankProps = [
      { name: 'Tag', dataType: 'String', defaultValue: 'TANK_000', description: 'Equipment identification tag' },
      { name: 'Description', dataType: 'String', defaultValue: 'Base Tank Equipment', description: 'Detailed equipment description' },
      { name: 'Level', dataType: 'Float', defaultValue: '0.0', description: 'Current fluid level percentage (0-100%)' },
      { name: 'Temperature', dataType: 'Float', defaultValue: '25.0', description: 'Current process temperature (°C)' },
      { name: 'Pressure', dataType: 'Float', defaultValue: '1.013', description: 'Internal pressure (bar)' },
      { name: 'Flow', dataType: 'Float', defaultValue: '0.0', description: 'Inlet/Outlet flow rate (m³/h)' },
    ];

    tankProps.forEach((p) => {
      let alarmConfig: any = undefined;

      if (p.name === 'Level') {
        alarmConfig = {
          enabled: true,
          rules: [
            {
              id: uuidv4(),
              type: 'H',
              enabled: true,
              blocked: false,
              compareValue: '80.0',
              severity: 'high',
              priority: 70,
              message: 'Nível do Tanque Alto (> 80%)',
              color: '#f97316',
              icon: 'AlertTriangle',
              activationDelay: 2,
              returnDelay: 1,
              hysteresis: 2.0,
              requireAck: true,
              historical: true,
            },
            {
              id: uuidv4(),
              type: 'HH',
              enabled: true,
              blocked: false,
              compareValue: '90.0',
              severity: 'critical',
              priority: 95,
              message: 'Nível do Tanque Crítico (> 90%)',
              color: '#ef4444',
              icon: 'ShieldAlert',
              activationDelay: 0,
              returnDelay: 1,
              hysteresis: 1.0,
              requireAck: true,
              historical: true,
            }
          ]
        };
      } else if (p.name === 'Temperature') {
        alarmConfig = {
          enabled: true,
          rules: [
            {
              id: uuidv4(),
              type: 'H',
              enabled: true,
              blocked: false,
              compareValue: '60.0',
              severity: 'medium',
              priority: 50,
              message: 'Temperatura do Tanque Alta (> 60°C)',
              color: '#eab308',
              icon: 'AlertCircle',
              activationDelay: 3,
              returnDelay: 2,
              hysteresis: 3.0,
              requireAck: true,
              historical: true,
            }
          ]
        };
      }

      propertyRepo.save({
        id: uuidv4(),
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


    // Tank Template Default Mock Configurations
    mockConfigRepo.save({
      id: uuidv4(),
      targetId: tankTemplateId,
      targetType: 'template',
      propertyName: 'Level',
      enabled: true,
      preset: 'sine',
      params: { min: 0, max: 100, periodSeconds: 10, decimals: 2 },
      createdAt: now,
      updatedAt: now,
    });

    mockConfigRepo.save({
      id: uuidv4(),
      targetId: tankTemplateId,
      targetType: 'template',
      propertyName: 'Temperature',
      enabled: true,
      preset: 'walk',
      params: { min: 20, max: 90, step: 1.5, decimals: 1 },
      createdAt: now,
      updatedAt: now,
    });

    mockConfigRepo.save({
      id: uuidv4(),
      targetId: tankTemplateId,
      targetType: 'template',
      propertyName: 'Pressure',
      enabled: true,
      preset: 'range',
      params: { min: 1.0, max: 4.5, decimals: 3 },
      createdAt: now,
      updatedAt: now,
    });

    mockConfigRepo.save({
      id: uuidv4(),
      targetId: tankTemplateId,
      targetType: 'template',
      propertyName: 'Flow',
      enabled: true,
      preset: 'sine',
      params: { min: 0, max: 150, periodSeconds: 8, decimals: 1 },
      createdAt: now,
      updatedAt: now,
    });

    // Tank Template Script
    scriptRepo.save({
      id: uuidv4(),
      targetId: tankTemplateId,
      targetType: 'template',
      name: 'OnLevelHighAlarm',
      trigger: 'Value Changed',
      triggerExpression: 'me.Level > 85.0',
      loopTimeMs: null,
      code: `// High level alarm logic for Tank
if (me.Level > 85.0) {
  LogWarning("Tank " + me.Tag + " level exceeded high limit: " + me.Level + "%");
  me.AlarmStatus = true;
}`,
      description: 'Triggers when fluid level exceeds high threshold',
      createdAt: now,
      updatedAt: now,
    });

    // 2. Storage Tank Template (Derived Template)
    const storageTankTemplateId = uuidv4();
    templateRepo.save({
      id: storageTankTemplateId,
      name: 'Storage Tank',
      parentTemplateId: tankTemplateId,
      description: 'Specialized storage tank with high-capacity controls',
      createdAt: now,
      updatedAt: now,
    });

    // Additional Property for Storage Tank
    propertyRepo.save({
      id: uuidv4(),
      targetId: storageTankTemplateId,
      targetType: 'template',
      name: 'Capacity',
      dataType: 'Float',
      defaultValue: '5000.0',
      description: 'Maximum storage volumetric capacity (Liters)',
      createdAt: now,
      updatedAt: now,
    });

    // 3. Pump Template (Root Template)
    const pumpTemplateId = uuidv4();
    templateRepo.save({
      id: pumpTemplateId,
      name: 'Pump Template',
      parentTemplateId: null,
      description: 'Base template for centrifugal process pumps',
      createdAt: now,
      updatedAt: now,
    });

    const pumpProps = [
      { name: 'Tag', dataType: 'String', defaultValue: 'PUMP_000', description: 'Pump Tag ID' },
      { name: 'Status', dataType: 'Boolean', defaultValue: 'false', description: 'Run status (Running / Stopped)' },
      { name: 'SpeedRPM', dataType: 'Integer', defaultValue: '1750', description: 'Operational rotational speed (RPM)' },
      { name: 'Vibration', dataType: 'Float', defaultValue: '0.12', description: 'Vibration amplitude (mm/s RMS)' },
    ];

    pumpProps.forEach((p) => {
      propertyRepo.save({
        id: uuidv4(),
        targetId: pumpTemplateId,
        targetType: 'template',
        name: p.name,
        dataType: p.dataType as any,
        defaultValue: p.defaultValue,
        description: p.description,
        createdAt: now,
        updatedAt: now,
      });
    });

    // Pump Script
    scriptRepo.save({
      id: uuidv4(),
      targetId: pumpTemplateId,
      targetType: 'template',
      name: 'OnStartupCheck',
      trigger: 'Initialize',
      triggerExpression: '',
      loopTimeMs: null,
      code: `// Initial safety checks for pump startup
LogInfo("Initializing Pump " + me.Tag + "...");
me.Status = false;
me.Vibration = 0.0;`,
      description: 'Initialization script executed on start',
      createdAt: now,
      updatedAt: now,
    });

    // 4. Instances (Objects)
    const tank101Id = uuidv4();
    objectRepo.save({
      id: tank101Id,
      name: 'Tank101',
      templateId: storageTankTemplateId,
      description: 'Raw Water Storage Tank 101 in Area A',
      isDeployed: true,
      createdAt: now,
      updatedAt: now,
    });

    // Custom local override for Tank101
    propertyRepo.save({
      id: uuidv4(),
      targetId: tank101Id,
      targetType: 'instance',
      name: 'Tag',
      dataType: 'String',
      defaultValue: 'TK-101-RAW',
      description: 'Specific Tag for Tank 101',
      createdAt: now,
      updatedAt: now,
    });

    const tank102Id = uuidv4();
    objectRepo.save({
      id: tank102Id,
      name: 'Tank102',
      templateId: storageTankTemplateId,
      description: 'Treated Water Storage Tank 102 in Area A',
      isDeployed: false,
      createdAt: now,
      updatedAt: now,
    });

    const pump201Id = uuidv4();
    objectRepo.save({
      id: pump201Id,
      name: 'Pump201',
      templateId: pumpTemplateId,
      description: 'Main Feed Pump 201 in Area B',
      isDeployed: true,
      createdAt: now,
      updatedAt: now,
    });

    // 5. Deployment Tree Structure
    // Plant Folder
    const plantFolderId = uuidv4();
    deploymentRepo.saveFolder({
      id: plantFolderId,
      name: 'Plant',
      parentFolderId: null,
      order: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Área A Subfolder inside Plant
    const areaAFolderId = uuidv4();
    deploymentRepo.saveFolder({
      id: areaAFolderId,
      name: 'Área A',
      parentFolderId: plantFolderId,
      order: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Área B Subfolder inside Plant
    const areaBFolderId = uuidv4();
    deploymentRepo.saveFolder({
      id: areaBFolderId,
      name: 'Área B',
      parentFolderId: plantFolderId,
      order: 1,
      createdAt: now,
      updatedAt: now,
    });

    // Deployment Nodes
    // Node for Área A folder inside Plant
    deploymentRepo.saveNode({
      id: uuidv4(),
      type: 'folder',
      targetId: areaAFolderId,
      parentFolderId: plantFolderId,
      order: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Node for Tank101 inside Área A
    deploymentRepo.saveNode({
      id: uuidv4(),
      type: 'object',
      targetId: tank101Id,
      parentFolderId: areaAFolderId,
      order: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Node for Tank102 inside Área A
    deploymentRepo.saveNode({
      id: uuidv4(),
      type: 'object',
      targetId: tank102Id,
      parentFolderId: areaAFolderId,
      order: 1,
      createdAt: now,
      updatedAt: now,
    });

    // Node for Área B folder inside Plant
    deploymentRepo.saveNode({
      id: uuidv4(),
      type: 'folder',
      targetId: areaBFolderId,
      parentFolderId: plantFolderId,
      order: 1,
      createdAt: now,
      updatedAt: now,
    });

    // Node for Pump201 inside Área B
    deploymentRepo.saveNode({
      id: uuidv4(),
      type: 'object',
      targetId: pump201Id,
      parentFolderId: areaBFolderId,
      order: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Seeding default Graphic associations
    widgetSeedService.seedIfEmpty();
    const widgets = widgetRepo.getAll();
    const tankWidget = widgets.find(w => w.name.toLowerCase().includes('tank level'));
    const pumpWidget = widgets.find(w => w.name.toLowerCase().includes('motor pump'));

    if (tankWidget) {
      const levelProp = tankWidget.customProperties.find(p => p.name === 'Level_PV');
      const alarmProp = tankWidget.customProperties.find(p => p.name === 'HighAlarm');
      associatedWidgetRepo.save({
        id: uuidv4(),
        targetId: tankTemplateId,
        targetType: 'template',
        widgetId: tankWidget.id,
        mappings: {
          ...(levelProp ? { [levelProp.id]: { type: 'property', value: 'me.Level' } } : {}),
          ...(alarmProp ? { [alarmProp.id]: { type: 'fixed', value: 'false' } } : {}),
        },
        createdAt: now,
        updatedAt: now,
      });
    }

    if (pumpWidget) {
      const stateProp = pumpWidget.customProperties.find(p => p.name === 'PumpState');
      const speedProp = pumpWidget.customProperties.find(p => p.name === 'MotorSpeed');
      const tagProp = pumpWidget.customProperties.find(p => p.name === 'HeaderTag');
      associatedWidgetRepo.save({
        id: uuidv4(),
        targetId: pumpTemplateId,
        targetType: 'template',
        widgetId: pumpWidget.id,
        mappings: {
          ...(stateProp ? { [stateProp.id]: { type: 'property', value: 'me.Status' } } : {}),
          ...(speedProp ? { [speedProp.id]: { type: 'property', value: 'me.SpeedRPM' } } : {}),
          ...(tagProp ? { [tagProp.id]: { type: 'property', value: 'me.Tag' } } : {}),
        },
        createdAt: now,
        updatedAt: now,
      });
    }

    localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
  }
}

export const seedService = new SeedService();
