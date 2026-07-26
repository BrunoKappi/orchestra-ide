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

    // Seed Sample Flowcharts
    flowchartRepo.saveAll([
      {
        id: uuidv4(),
        name: 'Controle de Bombeamento e Nível da Planta',
        description: 'Fluxograma global de automação para controle de transferência de fluido entre tanques de processo.',
        category: 'Automação de Produção',
        tags: ['Bombeamento', 'Nível', 'Nível Alto', 'Batelada'],
        version: '1.0.0',
        author: 'Engenharia de Automação',
        contextType: 'global',
        targetId: null,
        folderId: null,
        bpmnXml: `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Início da Batelada">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:serviceTask id="Task_ReadLevel" name="Ler Propriedade: Nível Tanque">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:serviceTask>
    <bpmn:exclusiveGateway id="Gateway_Compare" name="Nível > 80%?">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_High</bpmn:outgoing>
      <bpmn:outgoing>Flow_Normal</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:serviceTask id="Task_StartPump" name="Escrever Propriedade: Ligar Bomba">
      <bpmn:incoming>Flow_High</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
    </bpmn:serviceTask>
    <bpmn:intermediateCatchEvent id="Event_Delay" name="Aguardar 5s">
      <bpmn:incoming>Flow_Normal</bpmn:incoming>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
    </bpmn:intermediateCatchEvent>
    <bpmn:endEvent id="EndEvent_1" name="Fim da Sequência">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:incoming>Flow_4</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_ReadLevel" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_ReadLevel" targetRef="Gateway_Compare" />
    <bpmn:sequenceFlow id="Flow_High" name="Sim" sourceRef="Gateway_Compare" targetRef="Task_StartPump" />
    <bpmn:sequenceFlow id="Flow_Normal" name="Não" sourceRef="Gateway_Compare" targetRef="Event_Delay" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Task_StartPump" targetRef="EndEvent_1" />
    <bpmn:sequenceFlow id="Flow_4" sourceRef="Event_Delay" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="160" y="120" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_Task_ReadLevel" bpmnElement="Task_ReadLevel">
        <dc:Bounds x="250" y="98" width="160" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_Gateway_Compare" bpmnElement="Gateway_Compare" isMarkerVisible="true">
        <dc:Bounds x="465" y="113" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_Task_StartPump" bpmnElement="Task_StartPump">
        <dc:Bounds x="570" y="40" width="160" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_Event_Delay" bpmnElement="Event_Delay">
        <dc:Bounds x="630" y="192" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_EndEvent_1" bpmnElement="EndEvent_1">
        <dc:Bounds x="800" y="120" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Edge_Flow_1" bpmnElement="Flow_1">
        <di:waypoint x="196" y="138" />
        <di:waypoint x="250" y="138" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_Flow_2" bpmnElement="Flow_2">
        <di:waypoint x="410" y="138" />
        <di:waypoint x="465" y="138" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_Flow_High" bpmnElement="Flow_High">
        <di:waypoint x="490" y="113" />
        <di:waypoint x="490" y="80" />
        <di:waypoint x="570" y="80" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_Flow_Normal" bpmnElement="Flow_Normal">
        <di:waypoint x="490" y="163" />
        <di:waypoint x="490" y="210" />
        <di:waypoint x="630" y="210" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_Flow_3" bpmnElement="Flow_3">
        <di:waypoint x="730" y="80" />
        <di:waypoint x="818" y="80" />
        <di:waypoint x="818" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_Flow_4" bpmnElement="Flow_4">
        <di:waypoint x="666" y="210" />
        <di:waypoint x="818" y="210" />
        <di:waypoint x="818" y="156" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`,
        nodeMetadata: {
          Task_ReadLevel: {
            id: 'Task_ReadLevel',
            name: 'Ler Propriedade: Nível Tanque',
            isIndustrialNode: true,
            industrialType: 'read_property',
            targetPropertyName: 'me.Level',
          },
          Gateway_Compare: {
            id: 'Gateway_Compare',
            name: 'Nível > 80%?',
            isIndustrialNode: true,
            industrialType: 'compare_variable',
            expression: {
              logic: 'AND',
              conditions: [
                {
                  id: 'c1',
                  leftOperand: 'me.Level',
                  leftOperandType: 'property',
                  operator: 'GreaterThan',
                  rightOperand: '80.0',
                  rightOperandType: 'constant',
                },
              ],
            },
          },
          Task_StartPump: {
            id: 'Task_StartPump',
            name: 'Escrever Propriedade: Ligar Bomba',
            isIndustrialNode: true,
            industrialType: 'write_property',
            targetPropertyName: 'PUMP_001.Status',
            assignment: {
              targetProperty: 'PUMP_001.Status',
              sourceType: 'constant',
              sourceValue: 'true',
            },
          },
          Event_Delay: {
            id: 'Event_Delay',
            name: 'Aguardar 5s',
            isIndustrialNode: true,
            industrialType: 'delay',
            durationMs: 5000,
          },
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: 'Procedimento de Drenagem e Segurança do Tanque',
        description: 'Fluxograma específico do modelo Tank Template para rotina de drenagem automática quando alarmes são acionados.',
        category: 'Procedimento Operacional',
        tags: ['Segurança', 'Tanque', 'Drenagem', 'Alarme'],
        version: '1.0.0',
        author: 'Sistemas Industriais',
        contextType: 'template',
        targetId: tankTemplateId,
        folderId: null,
        bpmnXml: `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_2" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_2" isExecutable="false">
    <bpmn:startEvent id="Start_Alarm" name="Evento Alarme Nível HH">
      <bpmn:outgoing>Flow_A1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:serviceTask id="Task_Ack" name="Reconhecer Alarme">
      <bpmn:incoming>Flow_A1</bpmn:incoming>
      <bpmn:outgoing>Flow_A2</bpmn:outgoing>
    </bpmn:serviceTask>
    <bpmn:serviceTask id="Task_ScriptDrain" name="Executar Script: Iniciar Drenagem">
      <bpmn:incoming>Flow_A2</bpmn:incoming>
      <bpmn:outgoing>Flow_A3</bpmn:outgoing>
    </bpmn:serviceTask>
    <bpmn:endEvent id="End_Drain" name="Drenagem Concluída">
      <bpmn:incoming>Flow_A3</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_A1" sourceRef="Start_Alarm" targetRef="Task_Ack" />
    <bpmn:sequenceFlow id="Flow_A2" sourceRef="Task_Ack" targetRef="Task_ScriptDrain" />
    <bpmn:sequenceFlow id="Flow_A3" sourceRef="Task_ScriptDrain" targetRef="End_Drain" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_2">
    <bpmndi:BPMNPlane id="BPMNPlane_2" bpmnElement="Process_2">
      <bpmndi:BPMNShape id="Shape_Start_Alarm" bpmnElement="Start_Alarm">
        <dc:Bounds x="160" y="120" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_Task_Ack" bpmnElement="Task_Ack">
        <dc:Bounds x="250" y="98" width="160" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_Task_ScriptDrain" bpmnElement="Task_ScriptDrain">
        <dc:Bounds x="460" y="98" width="180" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_End_Drain" bpmnElement="End_Drain">
        <dc:Bounds x="690" y="120" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Edge_Flow_A1" bpmnElement="Flow_A1">
        <di:waypoint x="196" y="138" />
        <di:waypoint x="250" y="138" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_Flow_A2" bpmnElement="Flow_A2">
        <di:waypoint x="410" y="138" />
        <di:waypoint x="460" y="138" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_Flow_A3" bpmnElement="Flow_A3">
        <di:waypoint x="640" y="138" />
        <di:waypoint x="690" y="138" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`,
        nodeMetadata: {
          Task_Ack: {
            id: 'Task_Ack',
            name: 'Reconhecer Alarme',
            isIndustrialNode: true,
            industrialType: 'ack_alarm',
          },
          Task_ScriptDrain: {
            id: 'Task_ScriptDrain',
            name: 'Executar Script: Iniciar Drenagem',
            isIndustrialNode: true,
            industrialType: 'execute_script',
          },
        },
        createdAt: now,
        updatedAt: now,
      },
    ]);

    localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
  }
}

export const seedService = new SeedService();
