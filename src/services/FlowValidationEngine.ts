import type { FlowchartEntity, FlowValidationProblem } from '../types/flow';
import type { PropertyEntity } from '../types/domain';

export class FlowValidationEngine {
  public static validate(
    flowchart: FlowchartEntity,
    availableProperties: PropertyEntity[] = []
  ): FlowValidationProblem[] {
    const problems: FlowValidationProblem[] = [];
    const xml = flowchart.bpmnXml || '';
    const nodeMeta = flowchart.nodeMetadata || {};

    if (!xml.trim()) {
      problems.push({
        id: 'val_empty_xml',
        nodeId: 'root',
        nodeName: flowchart.name,
        type: 'error',
        code: 'EMPTY_DIAGRAM',
        message: 'O fluxograma está vazio. Adicione um Evento Inicial para começar.',
      });
      return problems;
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, 'text/xml');
    
    // 1. Validate Start Event
    const startEvents = Array.from(xmlDoc.getElementsByTagNameNS('*', 'startEvent'));
    if (startEvents.length === 0) {
      problems.push({
        id: 'val_no_start',
        nodeId: 'canvas',
        nodeName: 'Fluxograma',
        type: 'error',
        code: 'MISSING_START_EVENT',
        message: 'Nenhum Evento Inicial encontrado no fluxograma.',
        detail: 'Todo processo BPMN deve possuir ao menos um Evento Inicial (Start Event).',
      });
    }

    // 2. Validate End Event
    const endEvents = Array.from(xmlDoc.getElementsByTagNameNS('*', 'endEvent'));
    if (endEvents.length === 0) {
      problems.push({
        id: 'val_no_end',
        nodeId: 'canvas',
        nodeName: 'Fluxograma',
        type: 'warning',
        code: 'MISSING_END_EVENT',
        message: 'Nenhum Evento Final encontrado no fluxograma.',
        detail: 'Recomenda-se definir um Evento Final para encerramento claro da execução.',
      });
    }

    // 3. Find all flows and connected elements
    const sequenceFlows = Array.from(xmlDoc.getElementsByTagNameNS('*', 'sequenceFlow'));
    const connectedSources = new Set<string>();
    const connectedTargets = new Set<string>();

    sequenceFlows.forEach((sf) => {
      const sourceRef = sf.getAttribute('sourceRef');
      const targetRef = sf.getAttribute('targetRef');
      const id = sf.getAttribute('id') || 'unknown';
      
      if (sourceRef) {
        connectedSources.add(sourceRef);
        const sourceMeta = nodeMeta[sourceRef];
        if (sourceMeta?.isIndustrialNode && (sourceMeta.industrialType === 'comment' || sourceMeta.industrialType === 'logical_group')) {
          problems.push({
            id: `val_conn_invalid_source_${id}`,
            nodeId: sourceRef,
            nodeName: sourceMeta.name,
            type: 'error',
            code: 'INVALID_SEQUENCE_SOURCE',
            message: `O bloco "${sourceMeta.name}" (${sourceMeta.industrialType === 'comment' ? 'Comentário' : 'Grupo Lógico'}) não deve iniciar conexões de fluxo.`,
            detail: 'Comentários e Grupos Lógicos são apenas visuais e não possuem execução operacional no fluxo.',
          });
        }
      }
      
      if (targetRef) {
        connectedTargets.add(targetRef);
        const targetMeta = nodeMeta[targetRef];
        if (targetMeta?.isIndustrialNode && (targetMeta.industrialType === 'comment' || targetMeta.industrialType === 'logical_group')) {
          problems.push({
            id: `val_conn_invalid_target_${id}`,
            nodeId: targetRef,
            nodeName: targetMeta.name,
            type: 'error',
            code: 'INVALID_SEQUENCE_TARGET',
            message: `O fluxo de sequência não deve conectar-se ao bloco "${targetMeta.name}" (${targetMeta.industrialType === 'comment' ? 'Comentário' : 'Grupo Lógico'}).`,
            detail: 'Comentários e Grupos Lógicos são apenas visuais e não devem receber conexões operacionais.',
          });
        }
      }
    });

    // 4. Validate Gateways
    const gateways = [
      ...Array.from(xmlDoc.getElementsByTagNameNS('*', 'exclusiveGateway')),
      ...Array.from(xmlDoc.getElementsByTagNameNS('*', 'parallelGateway')),
      ...Array.from(xmlDoc.getElementsByTagNameNS('*', 'inclusiveGateway')),
      ...Array.from(xmlDoc.getElementsByTagNameNS('*', 'eventBasedGateway')),
    ];

    gateways.forEach((gw) => {
      const id = gw.getAttribute('id') || 'unknown';
      const name = gw.getAttribute('name') || id;
      const outgoing = sequenceFlows.filter((sf) => sf.getAttribute('sourceRef') === id);

      if (outgoing.length === 0) {
        problems.push({
          id: `val_gw_no_out_${id}`,
          nodeId: id,
          nodeName: name,
          type: 'error',
          code: 'GATEWAY_NO_OUTGOING',
          message: `O Gateway "${name}" não possui nenhuma conexão de saída.`,
        });
      } else if (outgoing.length === 1 && gw.tagName.includes('exclusiveGateway')) {
        problems.push({
          id: `val_gw_single_out_${id}`,
          nodeId: id,
          nodeName: name,
          type: 'warning',
          code: 'EXCLUSIVE_GATEWAY_SINGLE_BRANCH',
          message: `O Gateway Exclusivo "${name}" possui apenas 1 fluxo de saída.`,
          detail: 'Gateways de decisão geralmente devem possuir 2 ou mais ramos de saída.',
        });
      }
    });

    // 5. Validate Tasks and Industrial Nodes metadata
    const tasks = [
      ...Array.from(xmlDoc.getElementsByTagNameNS('*', 'task')),
      ...Array.from(xmlDoc.getElementsByTagNameNS('*', 'serviceTask')),
      ...Array.from(xmlDoc.getElementsByTagNameNS('*', 'scriptTask')),
      ...Array.from(xmlDoc.getElementsByTagNameNS('*', 'userTask')),
      ...Array.from(xmlDoc.getElementsByTagNameNS('*', 'sendTask')),
      ...Array.from(xmlDoc.getElementsByTagNameNS('*', 'receiveTask')),
      ...Array.from(xmlDoc.getElementsByTagNameNS('*', 'subProcess')),
      ...Array.from(xmlDoc.getElementsByTagNameNS('*', 'callActivity')),
      ...Array.from(xmlDoc.getElementsByTagNameNS('*', 'intermediateCatchEvent')),
      ...Array.from(xmlDoc.getElementsByTagNameNS('*', 'intermediateThrowEvent')),
      ...Array.from(xmlDoc.getElementsByTagNameNS('*', 'textAnnotation')),
      ...Array.from(xmlDoc.getElementsByTagNameNS('*', 'group')),
    ];

    tasks.forEach((task) => {
      const id = task.getAttribute('id') || 'unknown';
      const name = task.getAttribute('name') || id;

      const hasIn = connectedTargets.has(id);
      const hasOut = connectedSources.has(id);

      const meta = nodeMeta[id];

      // Visual helper elements like comment or group do not need sequence flow connections
      const isVisualElement = meta?.isIndustrialNode && (meta.industrialType === 'comment' || meta.industrialType === 'logical_group');

      if (!hasIn && !hasOut && !isVisualElement && task.tagName !== 'textAnnotation' && task.tagName !== 'group') {
        problems.push({
          id: `val_disconnected_${id}`,
          nodeId: id,
          nodeName: name,
          type: 'warning',
          code: 'DISCONNECTED_ELEMENT',
          message: `O bloco "${name}" está desconectado do fluxo principal.`,
        });
      }

      // Check Industrial Node Specific Validations
      if (meta && meta.isIndustrialNode) {
        switch (meta.industrialType) {
          case 'read_property':
          case 'write_property':
            if (!meta.targetPropertyId && !meta.targetPropertyName) {
              problems.push({
                id: `val_no_prop_${id}`,
                nodeId: id,
                nodeName: name,
                type: 'error',
                code: 'MISSING_PROPERTY_REFERENCE',
                message: `O bloco "${name}" não possui nenhuma propriedade configurada.`,
              });
            } else if (
              meta.targetPropertyId &&
              availableProperties.length > 0 &&
              !availableProperties.some((p) => p.id === meta.targetPropertyId) &&
              !meta.targetPropertyName?.includes('.') // Skip validation if referencing property on another object
            ) {
              problems.push({
                id: `val_invalid_prop_${id}`,
                nodeId: id,
                nodeName: name,
                type: 'error',
                code: 'INVALID_PROPERTY_REFERENCE',
                message: `O bloco "${name}" referencia uma propriedade inexistente no escopo local.`,
              });
            }
            break;

          case 'compare_variable':
            if (
              !meta.expression ||
              !meta.expression.conditions ||
              meta.expression.conditions.length === 0
            ) {
              problems.push({
                id: `val_no_cond_${id}`,
                nodeId: id,
                nodeName: name,
                type: 'warning',
                code: 'EMPTY_COMPARISON_EXPRESSION',
                message: `O bloco de decisão "${name}" não possui nenhuma condição definida.`,
              });
            }
            break;

          case 'execute_script':
            if (!meta.targetScriptId && (!meta.comments || !meta.comments.trim())) {
              problems.push({
                id: `val_no_script_${id}`,
                nodeId: id,
                nodeName: name,
                type: 'error',
                code: 'MISSING_SCRIPT_REFERENCE',
                message: `O bloco "${name}" não especificou nenhum script para ser executado.`,
              });
            }
            break;

          case 'call_flowchart':
            if (!meta.targetFlowchartId) {
              problems.push({
                id: `val_no_subflow_${id}`,
                nodeId: id,
                nodeName: name,
                type: 'error',
                code: 'MISSING_SUBFLOW_REFERENCE',
                message: `O bloco "${name}" não selecionou o fluxograma filho a chamar.`,
              });
            }
            break;

          case 'timer':
            if (meta.timerMode === 'cron' && (!meta.cronExpression || !meta.cronExpression.trim())) {
              problems.push({
                id: `val_timer_cron_${id}`,
                nodeId: id,
                nodeName: name,
                type: 'error',
                code: 'MISSING_CRON_EXPRESSION',
                message: `O Timer "${name}" em modo Cron não possui expressão cron definida.`,
              });
            } else if (meta.timerMode !== 'cron' && (!meta.durationMs || meta.durationMs <= 0)) {
              problems.push({
                id: `val_timer_duration_${id}`,
                nodeId: id,
                nodeName: name,
                type: 'warning',
                code: 'INVALID_TIMER_DURATION',
                message: `O Timer "${name}" deve possuir um tempo de intervalo válido maior que 0.`,
              });
            }
            break;

          case 'delay':
            if (!meta.durationMs || meta.durationMs <= 0) {
              problems.push({
                id: `val_delay_duration_${id}`,
                nodeId: id,
                nodeName: name,
                type: 'warning',
                code: 'INVALID_DELAY_DURATION',
                message: `O Delay "${name}" deve possuir um tempo de atraso válido maior que 0.`,
              });
            }
            break;

          case 'wait_alarm':
          case 'ack_alarm':
            if (!meta.alarmRuleId || !meta.alarmRuleId.trim()) {
              problems.push({
                id: `val_alarm_empty_${id}`,
                nodeId: id,
                nodeName: name,
                type: 'error',
                code: 'MISSING_ALARM_REFERENCE',
                message: `O bloco de alarme "${name}" não possui regra ou tag de alarme configurada.`,
              });
            }
            break;

          case 'query_history':
            if (!meta.queryHistoryProp || !meta.queryHistoryProp.trim()) {
              problems.push({
                id: `val_history_empty_${id}`,
                nodeId: id,
                nodeName: name,
                type: 'error',
                code: 'MISSING_HISTORY_REFERENCE',
                message: `O bloco de histórico "${name}" não possui propriedade de consulta configurada.`,
              });
            }
            break;

          case 'raise_event':
            if (!meta.raiseEventName || !meta.raiseEventName.trim()) {
              problems.push({
                id: `val_event_empty_${id}`,
                nodeId: id,
                nodeName: name,
                type: 'error',
                code: 'MISSING_EVENT_NAME',
                message: `O bloco "${name}" não possui nome do evento configurado.`,
              });
            }
            break;
        }
      }
    });

    return problems;
  }
}
