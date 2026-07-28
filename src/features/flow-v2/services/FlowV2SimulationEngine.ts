import { propertyRepo } from '../../../repository/PropertyRepository';
import type { FlowNodeV2, FlowEdgeV2 } from '../../../types/flowV2';

export interface SimulationStepResult {
  nodes: FlowNodeV2[];
  edges: FlowEdgeV2[];
  log: string;
}

export class FlowV2SimulationEngine {
  private isRunning: boolean = false;
  private timerId: any = null;
  private onUpdateCallback: ((nodes: FlowNodeV2[], edges: FlowEdgeV2[], statusLog: string) => void) | null = null;

  public startSimulation(
    nodes: FlowNodeV2[],
    edges: FlowEdgeV2[],
    onUpdate: (nodes: FlowNodeV2[], edges: FlowEdgeV2[], statusLog: string) => void
  ) {
    this.stopSimulation();
    this.isRunning = true;
    this.onUpdateCallback = onUpdate;

    // Reset simulation visual states on all nodes and edges
    let currentNodes = nodes.map((n) => ({
      ...n,
      data: { ...n.data, simState: 'idle' as const, simValue: undefined },
    }));

    let currentEdges = edges.map((e) => ({
      ...e,
      data: { ...e.data, isSimulatingActive: false, simPayload: undefined },
    }));

    // Find start nodes or nodes with 0 incoming edges
    const startNodes = currentNodes.filter(
      (n) => n.data.nodeType === 'start' || !currentEdges.some((e) => e.target === n.id)
    );

    const executionQueue = startNodes.length > 0 ? startNodes.map((n) => n.id) : [currentNodes[0]?.id].filter(Boolean);

    this.runNextStep(executionQueue, currentNodes, currentEdges);
  }

  private runNextStep(queue: string[], currentNodes: FlowNodeV2[], currentEdges: FlowEdgeV2[]) {
    if (!this.isRunning || queue.length === 0) {
      this.finishSimulation(currentNodes, currentEdges);
      return;
    }

    const currentNodeId = queue.shift()!;

    // Fetch live properties from propertyRepo
    const storeProperties = propertyRepo.getAll() || [];

    // Mark current node as executing
    currentNodes = currentNodes.map((node) => {
      if (node.id === currentNodeId) {
        let simVal: any = Math.floor(Math.random() * 100);

        // If node references a target property, read real value if available
        if (node.data.metadata?.targetPropertyName) {
          const propName = node.data.metadata.targetPropertyName;
          const found: any = storeProperties.find((p: any) => p.name === propName || p.id === node.data.metadata?.targetPropertyId);
          if (found && (found.value !== undefined || found.defaultValue !== undefined)) {
            const val = found.value ?? found.defaultValue;
            simVal = Number(val) || val;
          }
        }

        return {
          ...node,
          data: {
            ...node.data,
            simState: 'executing' as const,
            simValue: simVal,
          },
        };
      } else {
        return node;
      }
    });

    // Notify UI
    if (this.onUpdateCallback) {
      this.onUpdateCallback(currentNodes, currentEdges, `Executando nó: ${currentNodeId}`);
    }

    // After short delay, complete current node execution and pass to outgoing edges
    this.timerId = setTimeout(() => {
      if (!this.isRunning) return;

      const currentNode = currentNodes.find((n) => n.id === currentNodeId);
      const outputVal = currentNode?.data.simValue ?? 'OK';

      // Update node to success
      currentNodes = currentNodes.map((node) =>
        node.id === currentNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                simState: 'success' as const,
              },
            }
          : node
      );

      // Find outgoing edges from this node
      const outgoingEdges = currentEdges.filter((e) => e.source === currentNodeId);

      // Activate outgoing edges with payload
      currentEdges = currentEdges.map((e) => {
        if (e.source === currentNodeId) {
          return {
            ...e,
            data: {
              ...e.data,
              isSimulatingActive: true,
              simPayload: outputVal,
            },
          };
        } else {
          return e;
        }
      });

      if (this.onUpdateCallback) {
        this.onUpdateCallback(currentNodes, currentEdges, `Transmitindo dados pelo fluxo...`);
      }

      // Collect target nodes for next step
      outgoingEdges.forEach((e) => {
        if (!queue.includes(e.target)) {
          queue.push(e.target);
        }
      });

      // Schedule continuation
      this.timerId = setTimeout(() => {
        // Deactivate edge animations
        currentEdges = currentEdges.map((e) =>
          e.source === currentNodeId
            ? { ...e, data: { ...e.data, isSimulatingActive: false } }
            : e
        );

        this.runNextStep(queue, currentNodes, currentEdges);
      }, 1000);
    }, 1200);
  }

  private finishSimulation(nodes: FlowNodeV2[], edges: FlowEdgeV2[]) {
    this.isRunning = false;
    if (this.onUpdateCallback) {
      this.onUpdateCallback(nodes, edges, 'Simulação de fluxo finalizada com sucesso!');
    }
  }

  public stopSimulation() {
    this.isRunning = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}

export const simulationEngine = new FlowV2SimulationEngine();
