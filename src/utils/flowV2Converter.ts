import { v4 as uuidv4 } from 'uuid';
import type { FlowchartEntity, IndustrialNodeType } from '../types/flow';
import type { FlowV2Data, FlowNodeV2, FlowEdgeV2, FlowV2Port, FlowNodeV2Data } from '../types/flowV2';

export const getPortsForNodeType = (
  type: string,
  industrialType?: IndustrialNodeType
): { inputs: FlowV2Port[]; outputs: FlowV2Port[] } => {
  if (type === 'start') {
    return {
      inputs: [],
      outputs: [{ id: 'out', name: 'Início', type: 'output', dataType: 'trigger', color: '#10b981' }],
    };
  }

  if (type === 'end') {
    return {
      inputs: [{ id: 'in', name: 'Entrada', type: 'input', dataType: 'trigger', color: '#ef4444' }],
      outputs: [],
    };
  }

  if (type === 'gateway_exclusive' || industrialType === 'compare_variable') {
    return {
      inputs: [{ id: 'in', name: 'Avaliar', type: 'input', dataType: 'any', color: '#0ea5e9' }],
      outputs: [
        { id: 'true', name: 'Verdadeiro (True)', type: 'output', dataType: 'boolean', color: '#10b981' },
        { id: 'false', name: 'Falso (False)', type: 'output', dataType: 'boolean', color: '#f43f5e' },
      ],
    };
  }

  if (type === 'gateway_parallel') {
    return {
      inputs: [{ id: 'in', name: 'Entrada', type: 'input', dataType: 'trigger', color: '#0ea5e9' }],
      outputs: [
        { id: 'out1', name: 'Ramo A', type: 'output', dataType: 'trigger', color: '#3b82f6' },
        { id: 'out2', name: 'Ramo B', type: 'output', dataType: 'trigger', color: '#8b5cf6' },
      ],
    };
  }

  if (industrialType === 'read_property') {
    return {
      inputs: [{ id: 'in', name: 'Ler', type: 'input', dataType: 'trigger', color: '#0ea5e9' }],
      outputs: [
        { id: 'val', name: 'Valor Lido', type: 'output', dataType: 'any', color: '#38bdf8' },
        { id: 'next', name: 'Próximo', type: 'output', dataType: 'trigger', color: '#10b981' },
      ],
    };
  }

  if (industrialType === 'write_property') {
    return {
      inputs: [
        { id: 'in', name: 'Executar', type: 'input', dataType: 'trigger', color: '#f59e0b' },
        { id: 'val', name: 'Valor', type: 'input', dataType: 'any', color: '#fbbf24' },
      ],
      outputs: [{ id: 'next', name: 'Sucesso', type: 'output', dataType: 'trigger', color: '#10b981' }],
    };
  }

  if (industrialType === 'wait_alarm' || industrialType === 'ack_alarm') {
    return {
      inputs: [{ id: 'in', name: 'Entrada', type: 'input', dataType: 'trigger', color: '#f43f5e' }],
      outputs: [
        { id: 'ack', name: 'Reconhecido', type: 'output', dataType: 'trigger', color: '#10b981' },
        { id: 'timeout', name: 'Timeout', type: 'output', dataType: 'trigger', color: '#f59e0b' },
      ],
    };
  }

  if (type === 'container' || type === 'sticky_note') {
    return { inputs: [], outputs: [] };
  }

  // Default block ports
  return {
    inputs: [{ id: 'in', name: 'Entrada', type: 'input', dataType: 'trigger', color: '#0ea5e9' }],
    outputs: [
      { id: 'out', name: 'Saída', type: 'output', dataType: 'trigger', color: '#10b981' },
      { id: 'err', name: 'Erro', type: 'output', dataType: 'trigger', color: '#ef4444' },
    ],
  };
};

export const convertEntityToXyflow = (fc: FlowchartEntity): FlowV2Data => {
  if (fc.xyflowData && fc.xyflowData.nodes && fc.xyflowData.nodes.length > 0) {
    return fc.xyflowData;
  }

  // Generate initial default React Flow canvas if missing
  const startId = `node_start_${uuidv4().substring(0, 6)}`;
  const readId = `node_read_${uuidv4().substring(0, 6)}`;
  const condId = `node_cond_${uuidv4().substring(0, 6)}`;
  const writeId = `node_write_${uuidv4().substring(0, 6)}`;
  const endId = `node_end_${uuidv4().substring(0, 6)}`;

  const nodes: FlowNodeV2[] = [
    {
      id: startId,
      type: 'flowCard',
      position: { x: 100, y: 150 },
      data: {
        label: 'Partida do Processo',
        description: 'Ponto de início do fluxo de automação',
        category: 'Controle',
        nodeType: 'start',
        inputs: [],
        outputs: [{ id: 'out', name: 'Início', type: 'output', dataType: 'trigger', color: '#10b981' }],
        metadata: { id: startId, name: 'Partida do Processo' },
      },
    },
    {
      id: readId,
      type: 'flowCard',
      position: { x: 340, y: 130 },
      data: {
        label: 'Ler Nível do Tanque',
        description: 'Obtém valor atual do sensor de nível TANK_01',
        category: 'Leitura',
        nodeType: 'read_property',
        isIndustrialNode: true,
        industrialType: 'read_property',
        inputs: [{ id: 'in', name: 'Ler', type: 'input', dataType: 'trigger', color: '#0ea5e9' }],
        outputs: [
          { id: 'val', name: 'Valor Lido', type: 'output', dataType: 'any', color: '#38bdf8' },
          { id: 'next', name: 'Próximo', type: 'output', dataType: 'trigger', color: '#10b981' },
        ],
        metadata: {
          id: readId,
          name: 'Ler Nível do Tanque',
          isIndustrialNode: true,
          industrialType: 'read_property',
          targetPropertyName: 'TANK_01.Level',
        },
      },
    },
    {
      id: condId,
      type: 'flowCard',
      position: { x: 620, y: 120 },
      data: {
        label: 'Nível > 80% ?',
        description: 'Verifica condição de alarme de alto nível',
        category: 'Lógica',
        nodeType: 'compare_variable',
        isIndustrialNode: true,
        industrialType: 'compare_variable',
        inputs: [{ id: 'in', name: 'Avaliar', type: 'input', dataType: 'any', color: '#0ea5e9' }],
        outputs: [
          { id: 'true', name: 'Verdadeiro', type: 'output', dataType: 'boolean', color: '#10b981' },
          { id: 'false', name: 'Falso', type: 'output', dataType: 'boolean', color: '#f43f5e' },
        ],
        metadata: {
          id: condId,
          name: 'Nível > 80% ?',
          isIndustrialNode: true,
          industrialType: 'compare_variable',
        },
      },
    },
    {
      id: writeId,
      type: 'flowCard',
      position: { x: 920, y: 80 },
      data: {
        label: 'Fechar Válvula Entrada',
        description: 'Comanda fechamento da válvula VALV_INLET',
        category: 'Escrita',
        nodeType: 'write_property',
        isIndustrialNode: true,
        industrialType: 'write_property',
        inputs: [
          { id: 'in', name: 'Executar', type: 'input', dataType: 'trigger', color: '#f59e0b' },
          { id: 'val', name: 'Valor', type: 'input', dataType: 'any', color: '#fbbf24' },
        ],
        outputs: [{ id: 'next', name: 'Sucesso', type: 'output', dataType: 'trigger', color: '#10b981' }],
        metadata: {
          id: writeId,
          name: 'Fechar Válvula Entrada',
          isIndustrialNode: true,
          industrialType: 'write_property',
          targetPropertyName: 'VALV_INLET.Command',
        },
      },
    },
    {
      id: endId,
      type: 'flowCard',
      position: { x: 1200, y: 150 },
      data: {
        label: 'Fim de Ciclo',
        description: 'Finaliza a sequência de controle',
        category: 'Controle',
        nodeType: 'end',
        inputs: [{ id: 'in', name: 'Entrada', type: 'input', dataType: 'trigger', color: '#ef4444' }],
        outputs: [],
        metadata: { id: endId, name: 'Fim de Ciclo' },
      },
    },
  ];

  const edges: FlowEdgeV2[] = [
    {
      id: `e_${startId}_${readId}`,
      source: startId,
      sourceHandle: 'out',
      target: readId,
      targetHandle: 'in',
      type: 'animatedFlow',
      animated: true,
      data: { label: 'Iniciar', color: '#10b981' },
    },
    {
      id: `e_${readId}_${condId}`,
      source: readId,
      sourceHandle: 'next',
      target: condId,
      targetHandle: 'in',
      type: 'animatedFlow',
      animated: true,
      data: { label: 'Dados', color: '#0ea5e9' },
    },
    {
      id: `e_${condId}_${writeId}`,
      source: condId,
      sourceHandle: 'true',
      target: writeId,
      targetHandle: 'in',
      type: 'animatedFlow',
      animated: true,
      data: { label: 'Sim (Nível Alto)', color: '#10b981' },
    },
    {
      id: `e_${writeId}_${endId}`,
      source: writeId,
      sourceHandle: 'next',
      target: endId,
      targetHandle: 'in',
      type: 'animatedFlow',
      animated: true,
      data: { label: 'Concluído', color: '#6366f1' },
    },
  ];

  return {
    nodes,
    edges,
    viewport: { x: 50, y: 50, zoom: 0.9 },
    backgroundType: 'dots',
    gridSize: 15,
  };
};

export const createNewNodeData = (
  type: string,
  label: string,
  industrialType?: IndustrialNodeType,
  extraMeta?: any
): FlowNodeV2Data => {
  const ports = getPortsForNodeType(type, industrialType);
  const isInd = Boolean(industrialType);

  return {
    label,
    description: `Nó ${label} do processo`,
    category: isInd ? 'Orquestra Industrial' : 'BPMN Core',
    nodeType: type as any,
    isIndustrialNode: isInd,
    industrialType,
    inputs: ports.inputs,
    outputs: ports.outputs,
    metadata: {
      id: '',
      name: label,
      isIndustrialNode: isInd,
      industrialType,
      ...extraMeta,
    },
  };
};
