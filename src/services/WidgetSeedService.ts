import { v4 as uuidv4 } from 'uuid';
import type { WidgetEntity, WidgetFolderEntity, WidgetNodeEntity } from '../types/domain';
import { widgetRepo } from '../repository/WidgetRepository';
import { widgetFolderRepo } from '../repository/WidgetFolderRepository';

export class WidgetSeedService {
  public seedIfEmpty(): void {
    const existingWidgets = widgetRepo.getAll();
    if (existingWidgets.length > 0) {
      return; // Already populated
    }

    const folder1Id = uuidv4();
    const folder2Id = uuidv4();
    const folder3Id = uuidv4();

    const folders: WidgetFolderEntity[] = [
      {
        id: folder1Id,
        name: 'Pumps & Motors',
        parentFolderId: null,
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: folder2Id,
        name: 'Tanks & Vessels',
        parentFolderId: null,
        order: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: folder3Id,
        name: 'Sensors & Meters',
        parentFolderId: null,
        order: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const widget1Id = uuidv4();
    const widget2Id = uuidv4();
    const widget3Id = uuidv4();

    // Widget 1: Industrial Motor Pump
    const cp1Id = uuidv4();
    const cp2Id = uuidv4();
    const cp3Id = uuidv4();

    const widget1: WidgetEntity = {
      id: widget1Id,
      name: 'Motor Pump Graphic Widget',
      description: 'Industrial centrifugal pump with status LED and RPM indicator.',
      canvasWidth: 380,
      canvasHeight: 260,
      backgroundColor: '#0f172a',
      gridSize: 10,
      customProperties: [
        {
          id: cp1Id,
          name: 'PumpState',
          dataType: 'Boolean',
          defaultValue: 'true',
          description: 'Motor run status: True = Running, False = Stopped',
        },
        {
          id: cp2Id,
          name: 'MotorSpeed',
          dataType: 'Float',
          defaultValue: '1750.0',
          description: 'Shaft speed in RPM',
        },
        {
          id: cp3Id,
          name: 'HeaderTag',
          dataType: 'String',
          defaultValue: 'PUMP-101A',
          description: 'Equipment identifier tag',
        },
      ],
      elements: [
        // Outer housing / frame
        {
          id: uuidv4(),
          name: 'Pump Body Frame',
          type: 'rectangle',
          x: 20,
          y: 20,
          width: 340,
          height: 220,
          rotation: 0,
          zIndex: 1,
          fill: '#1e293b',
          stroke: '#38bdf8',
          strokeWidth: 2,
          strokeStyle: 'solid',
          cornerRadius: 12,
          bindings: [],
        },
        // Header Text
        {
          id: uuidv4(),
          name: 'Equipment Tag Title',
          type: 'text',
          x: 40,
          y: 40,
          width: 200,
          height: 30,
          rotation: 0,
          zIndex: 2,
          fill: 'transparent',
          stroke: 'transparent',
          strokeWidth: 0,
          strokeStyle: 'solid',
          fontSize: 16,
          textContent: 'PUMP-101A',
          textColor: '#f8fafc',
          textAlignment: 'left',
          bindings: [
            {
              id: uuidv4(),
              property: 'textContent',
              customPropId: cp3Id,
            },
          ],
        },
        // Status LED Lamp
        {
          id: uuidv4(),
          name: 'Run Status Lamp',
          type: 'status_light',
          x: 300,
          y: 35,
          width: 32,
          height: 32,
          rotation: 0,
          zIndex: 3,
          fill: '#22c55e',
          stroke: '#15803d',
          strokeWidth: 2,
          strokeStyle: 'solid',
          bindings: [],
          dynamics: [
            {
              id: uuidv4(),
              type: 'fill',
              variableId: cp1Id,
              config: {
                boolean: {
                  trueColor: '#22c55e',
                  falseColor: '#ef4444',
                },
              },
            },
          ],
        },
        // Motor Casing Circle
        {
          id: uuidv4(),
          name: 'Motor Rotor Disc',
          type: 'circle',
          x: 50,
          y: 90,
          width: 100,
          height: 100,
          rotation: 0,
          zIndex: 2,
          fill: '#334155',
          stroke: '#0ea5e9',
          strokeWidth: 3,
          strokeStyle: 'solid',
          bindings: [],
        },
        // RPM Display Box
        {
          id: uuidv4(),
          name: 'RPM Box',
          type: 'rectangle',
          x: 180,
          y: 110,
          width: 150,
          height: 60,
          rotation: 0,
          zIndex: 2,
          fill: '#0284c7',
          stroke: '#38bdf8',
          strokeWidth: 1,
          strokeStyle: 'solid',
          cornerRadius: 8,
          bindings: [],
        },
        {
          id: uuidv4(),
          name: 'RPM Text Value',
          type: 'text',
          x: 190,
          y: 125,
          width: 130,
          height: 30,
          rotation: 0,
          zIndex: 3,
          fill: 'transparent',
          stroke: 'transparent',
          strokeWidth: 0,
          strokeStyle: 'solid',
          fontSize: 18,
          textContent: '1750 RPM',
          textColor: '#ffffff',
          textAlignment: 'center',
          bindings: [
            {
              id: uuidv4(),
              property: 'textContent',
              customPropId: cp2Id,
            },
          ],
        },
        // Dynamic Variable Display Element
        {
          id: uuidv4(),
          name: 'Vazão/Velocidade Display',
          type: 'variable_display',
          x: 180,
          y: 180,
          width: 150,
          height: 42,
          rotation: 0,
          zIndex: 4,
          fill: '#0f172a',
          stroke: '#38bdf8',
          strokeWidth: 1.5,
          strokeStyle: 'solid',
          cornerRadius: 6,
          fontSize: 13,
          textColor: '#38bdf8',
          textAlignment: 'center',
          showLabel: true,
          showUnit: true,
          unit: 'RPM',
          decimalPlaces: 1,
          conversionFactor: 1,
          customLabel: 'Rotar',
          bindings: [
            {
              id: uuidv4(),
              property: 'textContent',
              customPropId: cp2Id,
            },
          ],
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Widget 2: Tank Level Monitor
    const cpLevelId = uuidv4();
    const cpAlarmId = uuidv4();

    const widget2: WidgetEntity = {
      id: widget2Id,
      name: 'Tank Level Monitor Widget',
      description: 'Storage tank with dynamic liquid level bar and high level alarm LED.',
      canvasWidth: 320,
      canvasHeight: 340,
      backgroundColor: '#090d16',
      gridSize: 10,
      customProperties: [
        {
          id: cpLevelId,
          name: 'Level_PV',
          dataType: 'Float',
          defaultValue: '75.5',
          description: 'Tank level in percentage (0-100%)',
        },
        {
          id: cpAlarmId,
          name: 'HighAlarm',
          dataType: 'Boolean',
          defaultValue: 'false',
          description: 'High level threshold alarm boolean',
        },
      ],
      elements: [
        // Tank Vessel Shape
        {
          id: uuidv4(),
          name: 'Tank Vessel Body',
          type: 'tank',
          x: 50,
          y: 30,
          width: 220,
          height: 240,
          rotation: 0,
          zIndex: 1,
          fill: '#1e293b',
          stroke: '#0284c7',
          strokeWidth: 3,
          strokeStyle: 'solid',
          bindings: [],
          dynamics: [
            {
              id: uuidv4(),
              type: 'stroke',
              variableId: cpAlarmId,
              config: {
                boolean: {
                  trueColor: '#ef4444',
                  falseColor: '#0284c7',
                },
              },
            },
          ],
        },
        // Level Percentage Text
        {
          id: uuidv4(),
          name: 'Level Text Readout',
          type: 'text',
          x: 70,
          y: 285,
          width: 180,
          height: 35,
          rotation: 0,
          zIndex: 3,
          fill: 'transparent',
          stroke: 'transparent',
          strokeWidth: 0,
          strokeStyle: 'solid',
          fontSize: 16,
          textContent: 'LEVEL: 75.5%',
          textColor: '#38bdf8',
          textAlignment: 'center',
          bindings: [
            {
              id: uuidv4(),
              property: 'textContent',
              customPropId: cpLevelId,
            },
          ],
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Widget 3: Digital Pressure Gauge
    const cpPressId = uuidv4();

    const widget3: WidgetEntity = {
      id: widget3Id,
      name: 'Digital Pressure Gauge Widget',
      description: 'Circular pressure sensor gauge face with numeric digital readout.',
      canvasWidth: 260,
      canvasHeight: 260,
      backgroundColor: '#0f172a',
      gridSize: 10,
      customProperties: [
        {
          id: cpPressId,
          name: 'Pressure_PV',
          dataType: 'Float',
          defaultValue: '4.85',
          description: 'Process pressure in Bar',
        },
      ],
      elements: [
        {
          id: uuidv4(),
          name: 'Gauge Face Dial',
          type: 'gauge',
          x: 20,
          y: 20,
          width: 220,
          height: 220,
          rotation: 0,
          zIndex: 1,
          fill: '#1e293b',
          stroke: '#f59e0b',
          strokeWidth: 4,
          strokeStyle: 'solid',
          bindings: [],
        },
        {
          id: uuidv4(),
          name: 'Pressure Digital Text',
          type: 'text',
          x: 40,
          y: 110,
          width: 180,
          height: 40,
          rotation: 0,
          zIndex: 3,
          fill: 'transparent',
          stroke: 'transparent',
          strokeWidth: 0,
          strokeStyle: 'solid',
          fontSize: 20,
          textContent: '4.85 bar',
          textColor: '#f59e0b',
          textAlignment: 'center',
          bindings: [
            {
              id: uuidv4(),
              property: 'textContent',
              customPropId: cpPressId,
            },
          ],
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save Widgets
    widgetRepo.saveAll([widget1, widget2, widget3]);

    // Save Folders & Nodes
    widgetFolderRepo.saveFolders(folders);

    const nodes: WidgetNodeEntity[] = [
      {
        id: folder1Id,
        type: 'folder',
        targetId: folder1Id,
        parentFolderId: null,
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: widget1Id,
        type: 'widget',
        targetId: widget1Id,
        parentFolderId: folder1Id,
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: folder2Id,
        type: 'folder',
        targetId: folder2Id,
        parentFolderId: null,
        order: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: widget2Id,
        type: 'widget',
        targetId: widget2Id,
        parentFolderId: folder2Id,
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: folder3Id,
        type: 'folder',
        targetId: folder3Id,
        parentFolderId: null,
        order: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: widget3Id,
        type: 'widget',
        targetId: widget3Id,
        parentFolderId: folder3Id,
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    widgetFolderRepo.saveNodes(nodes);
  }
}

export const widgetSeedService = new WidgetSeedService();
