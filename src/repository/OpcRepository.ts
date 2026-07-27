import type { OpcNodeEntity } from '../types/opc';
import { STORAGE_KEYS } from './storageKey';
import { v4 as uuidv4 } from 'uuid';

export class OpcRepository {
  public getAll(): OpcNodeEntity[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.OPC_NODES);
      if (!data) {
        return this.seedInitialData();
      }
      return JSON.parse(data);
    } catch {
      return this.seedInitialData();
    }
  }

  public saveAll(nodes: OpcNodeEntity[]): void {
    localStorage.setItem(STORAGE_KEYS.OPC_NODES, JSON.stringify(nodes));
  }

  public save(node: OpcNodeEntity): OpcNodeEntity {
    const all = this.getAll();
    const index = all.findIndex((n) => n.id === node.id);
    if (index >= 0) {
      all[index] = { ...node };
    } else {
      all.push(node);
    }
    this.saveAll(all);
    return node;
  }

  public delete(id: string): boolean {
    const all = this.getAll();
    const initialLen = all.length;
    // Find all children recursively to delete them as well
    const toDeleteIds = new Set<string>([id]);
    let added = true;
    while (added) {
      added = false;
      for (const node of all) {
        if (node.parentId && toDeleteIds.has(node.parentId) && !toDeleteIds.has(node.id)) {
          toDeleteIds.add(node.id);
          added = true;
        }
      }
    }

    const filtered = all.filter((n) => !toDeleteIds.has(n.id));
    this.saveAll(filtered);
    return filtered.length < initialLen;
  }

  public seedInitialData(): OpcNodeEntity[] {
    const nodes: OpcNodeEntity[] = [];

    // ─── SERVER 1: OPC UA Refinery ──────────────────────────────────────────
    const serverUaId = uuidv4();
    nodes.push({
      id: serverUaId,
      name: 'OPC_UA_Refinery',
      type: 'server_ua',
      parentId: null,
      path: 'OPC_UA_Refinery',
      description: 'Principal Servidor OPC UA de Refino da Planta Serrano',
    });

    const areas = ['Boiler_Area', 'Reactor_Area', 'Utility_Area'];
    const areaDescriptions = ['Área de Caldeiras e Vapor', 'Área de Reatores Químicos', 'Área de Utilidades e Água Fria'];

    areas.forEach((area, areaIdx) => {
      const areaId = uuidv4();
      nodes.push({
        id: areaId,
        name: area,
        type: 'area',
        parentId: serverUaId,
        path: `OPC_UA_Refinery.${area}`,
        description: areaDescriptions[areaIdx],
      });

      const devices = [`PLC_${area.split('_')[0]}_01`, `PLC_${area.split('_')[0]}_02`];
      devices.forEach((dev) => {
        const devId = uuidv4();
        nodes.push({
          id: devId,
          name: dev,
          type: 'plc',
          parentId: areaId,
          path: `OPC_UA_Refinery.${area}.${dev}`,
          description: `Controlador Lógico Programável do ${area}`,
        });

        // Add typical industrial tags (TE, PT, FT, LT, Valve, Motor)
        const tags = [
          { name: 'TE_101', desc: 'Sensor de Temperatura', unit: '°C', type: 'Float' as const, freq: 1000, val: '82.5' },
          { name: 'PT_102', desc: 'Sensor de Pressão', unit: 'bar', type: 'Float' as const, freq: 1000, val: '4.8' },
          { name: 'FT_103', desc: 'Transmissor de Vazão', unit: 'm³/h', type: 'Float' as const, freq: 2000, val: '124.3' },
          { name: 'LT_104', desc: 'Indicador de Nível', unit: '%', type: 'Float' as const, freq: 1000, val: '64.2' },
          { name: 'XV_105', desc: 'Válvula de Controle de Bloqueio', unit: '', type: 'String' as const, freq: 2000, val: 'OPEN' },
          { name: 'PMP_106', desc: 'Bomba de Recirculação', unit: '', type: 'Boolean' as const, freq: 1000, val: 'true' },
          { name: 'SP_TEMP', desc: 'Setpoint de Temperatura da Área', unit: '°C', type: 'Float' as const, freq: 5000, val: '85.0' },
          { name: 'CMD_START', desc: 'Comando de Partida do Equipamento', unit: '', type: 'Boolean' as const, freq: 1000, val: 'false' },
          { name: 'ALM_ACTIVE', desc: 'Alarme Geral Ativo', unit: '', type: 'Boolean' as const, freq: 500, val: 'false' },
          { name: 'DIAG_OK', desc: 'Diagnóstico de Comunicação do CLP', unit: '', type: 'Boolean' as const, freq: 3000, val: 'true' }
        ];

        tags.forEach((t) => {
          nodes.push({
            id: uuidv4(),
            name: t.name,
            type: 'tag',
            parentId: devId,
            path: `OPC_UA_Refinery.${area}.${dev}.${t.name}`,
            dataType: t.type,
            value: t.val,
            quality: 'Good',
            timestamp: new Date().toISOString(),
            engineeringUnit: t.unit,
            updateFrequencyMs: t.freq,
            description: `${t.desc} - ${dev}`,
            isFavorite: false,
          });
        });
      });
    });

    // ─── SERVER 2: OPC DA Legacy Water Treatment ─────────────────────────────
    const serverDaId = uuidv4();
    nodes.push({
      id: serverDaId,
      name: 'OPC_DA_WaterTreatment',
      type: 'server_da',
      parentId: null,
      path: 'OPC_DA_WaterTreatment',
      description: 'Servidor OPC DA Herdado da Estação de Tratamento de Água (ETA)',
    });

    const sections = ['Inlet_Station', 'Filter_Station', 'Outlet_Station'];
    const sectionDescriptions = ['Estação de Entrada e Gradeamento', 'Estação de Filtros de Areia', 'Estação de Elevatória e Cloração'];

    sections.forEach((sec, secIdx) => {
      const secId = uuidv4();
      nodes.push({
        id: secId,
        name: sec,
        type: 'equipment',
        parentId: serverDaId,
        path: `OPC_DA_WaterTreatment.${sec}`,
        description: sectionDescriptions[secIdx],
      });

      const devices = [`Controller_${sec}`];
      devices.forEach((dev) => {
        const devId = uuidv4();
        nodes.push({
          id: devId,
          name: dev,
          type: 'controller',
          parentId: secId,
          path: `OPC_DA_WaterTreatment.${sec}.${dev}`,
          description: `Controlador Dedicado de ${sec}`,
        });

        const tags = [
          { name: 'PH_VAL', desc: 'Sensor de pH de Água', unit: 'pH', type: 'Float' as const, freq: 5000, val: '7.2', quality: 'Good' as const },
          { name: 'TURB_VAL', desc: 'Medidor de Turbidez', unit: 'NTU', type: 'Float' as const, freq: 5000, val: '0.85', quality: 'Good' as const },
          { name: 'FLOW_RATE', desc: 'Vazão de Água', unit: 'L/s', type: 'Float' as const, freq: 1000, val: '45.8', quality: 'Good' as const },
          { name: 'TANK_LVL', desc: 'Nível do Tanque de Armazenamento', unit: 'm', type: 'Float' as const, freq: 2000, val: '3.42', quality: 'Good' as const },
          { name: 'VALVE_STAT', desc: 'Status da Válvula Reguladora', unit: '', type: 'String' as const, freq: 2000, val: 'RUNNING', quality: 'Good' as const },
          { name: 'COMMS_LOSS', desc: 'Perda de Comunicação com Instrumento', unit: '', type: 'Boolean' as const, freq: 1000, val: 'false', quality: 'Good' as const }
        ];

        tags.forEach((t) => {
          nodes.push({
            id: uuidv4(),
            name: t.name,
            type: 'tag',
            parentId: devId,
            path: `OPC_DA_WaterTreatment.${sec}.${dev}.${t.name}`,
            dataType: t.type,
            value: t.val,
            quality: t.quality,
            timestamp: new Date().toISOString(),
            engineeringUnit: t.unit,
            updateFrequencyMs: t.freq,
            description: `${t.desc} - ${dev}`,
            isFavorite: false,
          });
        });
      });
    });

    this.saveAll(nodes);
    return nodes;
  }
}

export const opcRepo = new OpcRepository();
