import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import type { Node, Edge } from '@xyflow/react';
import type { RecipeEntity, BatchInstanceEntity, BatchStepState } from '../types/batch';
import { useOmmStore } from '../features/omm/store/useOmmStore';
import { useObjectModelStore } from './useObjectModelStore';
import { simulationEngine } from '../services/simulationEngine';
import { propertyRepo } from '../repository/PropertyRepository';
import { useLogStore } from './useLogStore';

interface BatchStoreState {
  recipes: RecipeEntity[];
  batches: BatchInstanceEntity[];
  selectedRecipeId: string | null;
  selectedBatchId: string | null;
  activeBatch: BatchInstanceEntity | null;
  subTab: 'designer' | 'monitor' | 'list';
  selectedNodeId: string | null;

  // Actions
  init: () => void;
  createRecipe: (name: string, description?: string) => RecipeEntity;
  updateRecipeNodesEdges: (id: string, nodes: Node[], edges: Edge[]) => void;
  saveRecipe: (id: string, updates: Partial<RecipeEntity>) => void;
  deleteRecipe: (id: string) => void;
  duplicateRecipe: (id: string) => RecipeEntity | null;
  setSelectedRecipeId: (id: string | null) => void;
  setSelectedBatchId: (id: string | null) => void;
  setSubTab: (tab: 'designer' | 'monitor' | 'list') => void;
  setSelectedNodeId: (id: string | null) => void;

  // Batch Execution Actions
  startBatch: (recipeId: string) => void;
  pauseBatch: () => void;
  resumeBatch: () => void;
  cancelBatch: () => void;
  clearHistory: () => void;
  resetBatchStore: () => void;
}

export const STORAGE_KEYS = {
  RECIPES: 'omm_batch_recipes',
  BATCHES: 'omm_batch_instances',
};

// Default Demo Recipe (Nafta)
const getDemoRecipe = (): RecipeEntity => ({
  id: 'recipe-demo-nafta',
  name: 'Batelada Nafta Petroquímica',
  description: 'Ciclo completo de transferência, agitação, aquecimento e cut-off de nafta.',
  category: 'Produção',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  nodes: [
    {
      id: 'step-start',
      type: 'customNode',
      position: { x: 50, y: 180 },
      data: {
        label: 'Início',
        stepType: 'start',
        description: 'Início do Lote',
        inputsCount: 0,
        outputsCount: 1,
        color: '#10b981',
        blockType: 'INÍCIO',
        category: 'Controle',
        iconName: 'Play',
      },
    },
    {
      id: 'step-transfer-1',
      type: 'customNode',
      position: { x: 400, y: 180 },
      data: {
        label: 'Dosagem de Nafta',
        stepType: 'transfer',
        description: 'Drenagem de Nafta TK-301 para TK-302',
        inputsCount: 1,
        outputsCount: 1,
        color: '#3b82f6',
        blockType: 'TRANSFERÊNCIA',
        category: 'Operação',
        iconName: 'ArrowLeftRight',
        originId: 'tank-tk-301',
        destinationId: 'tank-tk-302',
        productId: 'prod-naphtha',
        plannedVolume: 12,
        plannedFlow: 900,
      },
    },
    {
      id: 'step-agitate',
      type: 'customNode',
      position: { x: 750, y: 180 },
      data: {
        label: 'Homogeneização',
        stepType: 'agitate',
        description: 'Agitação no TK-302 para mistura',
        inputsCount: 1,
        outputsCount: 1,
        color: '#eab308',
        blockType: 'AGITAÇÃO',
        category: 'Operação',
        iconName: 'RotateCw',
        vesselId: 'tank-tk-302',
        agitatorSpeedRpm: 180,
        durationSeconds: 15,
      },
    },
    {
      id: 'step-heat',
      type: 'customNode',
      position: { x: 1100, y: 180 },
      data: {
        label: 'Reação Térmica',
        stepType: 'heat',
        description: 'Aquecer TK-302 a 32°C',
        inputsCount: 1,
        outputsCount: 1,
        color: '#f97316',
        blockType: 'AQUECIMENTO',
        category: 'Operação',
        iconName: 'Zap',
        heatVesselId: 'tank-tk-302',
        targetTemperature: 32.0,
        heatingRate: 0.5,
      },
    },
    {
      id: 'step-cutoff',
      type: 'customNode',
      position: { x: 1450, y: 180 },
      data: {
        label: 'Cut-off de Segurança',
        stepType: 'cutoff',
        description: 'Balanço de Inventário Lote',
        inputsCount: 1,
        outputsCount: 1,
        color: '#a855f7',
        blockType: 'CUT-OFF',
        category: 'Controle',
        iconName: 'Database',
        cutoffEquipmentIds: ['tank-tk-301', 'tank-tk-302'],
        cutoffNotes: 'Balanço contábil do lote de nafta concluído.',
      },
    },
    {
      id: 'step-transfer-2',
      type: 'customNode',
      position: { x: 1800, y: 180 },
      data: {
        label: 'Retorno de Nafta',
        stepType: 'transfer',
        description: 'Enviar Nafta TK-302 de volta para TK-301',
        inputsCount: 1,
        outputsCount: 1,
        color: '#3b82f6',
        blockType: 'TRANSFERÊNCIA',
        category: 'Operação',
        iconName: 'ArrowLeftRight',
        originId: 'tank-tk-302',
        destinationId: 'tank-tk-301',
        productId: 'prod-naphtha',
        plannedVolume: 12,
        plannedFlow: 900,
      },
    },
    {
      id: 'step-end',
      type: 'customNode',
      position: { x: 2150, y: 180 },
      data: {
        label: 'Fim',
        stepType: 'end',
        description: 'Finalização do Lote',
        inputsCount: 1,
        outputsCount: 0,
        color: '#ef4444',
        blockType: 'FIM',
        category: 'Controle',
        iconName: 'Zap',
      },
    },
  ],
  edges: [
    { id: 'e-1', source: 'step-start', target: 'step-transfer-1', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
    { id: 'e-2', source: 'step-transfer-1', target: 'step-agitate', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
    { id: 'e-3', source: 'step-agitate', target: 'step-heat', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
    { id: 'e-4', source: 'step-heat', target: 'step-cutoff', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
    { id: 'e-5', source: 'step-cutoff', target: 'step-transfer-2', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
    { id: 'e-6', source: 'step-transfer-2', target: 'step-end', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
  ],
});

// Mock Recipe (Gasoline Formulation)
const getGasolineRecipe = (): RecipeEntity => ({
  id: 'recipe-demo-gasolina',
  name: 'Formulação de Gasolina',
  description: 'Blendagem de aromáticos, homogeneização térmica e transferência para expedição.',
  category: 'Produção',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  nodes: [
    {
      id: 'gas-start',
      type: 'customNode',
      position: { x: 50, y: 180 },
      data: {
        label: 'Início',
        stepType: 'start',
        description: 'Início do Lote de Gasolina',
        inputsCount: 0,
        outputsCount: 1,
        color: '#10b981',
        blockType: 'INÍCIO',
        category: 'Controle',
        iconName: 'Play',
      },
    },
    {
      id: 'gas-transfer-1',
      type: 'customNode',
      position: { x: 400, y: 180 },
      data: {
        label: 'Dosagem de Aromáticos',
        stepType: 'transfer',
        description: 'Alimentação de Benzeno TK-401 para TK-402',
        inputsCount: 1,
        outputsCount: 1,
        color: '#3b82f6',
        blockType: 'TRANSFERÊNCIA',
        category: 'Operação',
        iconName: 'ArrowLeftRight',
        originId: 'tank-tk-401',
        destinationId: 'tank-tk-402',
        productId: 'prod-benzene',
        plannedVolume: 12,
        plannedFlow: 900,
      },
    },
    {
      id: 'gas-agitate',
      type: 'customNode',
      position: { x: 750, y: 180 },
      data: {
        label: 'Mistura Blend',
        stepType: 'agitate',
        description: 'Agitação rápida no TK-402',
        inputsCount: 1,
        outputsCount: 1,
        color: '#eab308',
        blockType: 'AGITAÇÃO',
        category: 'Operação',
        iconName: 'RotateCw',
        vesselId: 'tank-tk-402',
        agitatorSpeedRpm: 200,
        durationSeconds: 12,
      },
    },
    {
      id: 'gas-heat',
      type: 'customNode',
      position: { x: 1100, y: 180 },
      data: {
        label: 'Aquecimento Blend',
        stepType: 'heat',
        description: 'Ajuste térmico no TK-402',
        inputsCount: 1,
        outputsCount: 1,
        color: '#f97316',
        blockType: 'AQUECIMENTO',
        category: 'Operação',
        iconName: 'Zap',
        heatVesselId: 'tank-tk-402',
        targetTemperature: 35.0,
        heatingRate: 0.8,
      },
    },
    {
      id: 'gas-cutoff',
      type: 'customNode',
      position: { x: 1450, y: 180 },
      data: {
        label: 'Cut-off Blend',
        stepType: 'cutoff',
        description: 'Balanço de massa final da gasolina',
        inputsCount: 1,
        outputsCount: 1,
        color: '#a855f7',
        blockType: 'CUT-OFF',
        category: 'Controle',
        iconName: 'Database',
        cutoffEquipmentIds: ['tank-tk-401', 'tank-tk-402'],
        cutoffNotes: 'Balanço contábil da gasolina concluído.',
      },
    },
    {
      id: 'gas-transfer-2',
      type: 'customNode',
      position: { x: 1800, y: 180 },
      data: {
        label: 'Envio para Expedição',
        stepType: 'transfer',
        description: 'Drenagem do TK-402 para TK-403',
        inputsCount: 1,
        outputsCount: 1,
        color: '#3b82f6',
        blockType: 'TRANSFERÊNCIA',
        category: 'Operação',
        iconName: 'ArrowLeftRight',
        originId: 'tank-tk-402',
        destinationId: 'tank-tk-403',
        productId: 'prod-benzene',
        plannedVolume: 12,
        plannedFlow: 900,
      },
    },
    {
      id: 'gas-end',
      type: 'customNode',
      position: { x: 2150, y: 180 },
      data: {
        label: 'Fim',
        stepType: 'end',
        description: 'Finalização do Processo de Gasolina',
        inputsCount: 1,
        outputsCount: 0,
        color: '#ef4444',
        blockType: 'FIM',
        category: 'Controle',
        iconName: 'Zap',
      },
    },
  ],
  edges: [
    { id: 'eg-1', source: 'gas-start', target: 'gas-transfer-1', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
    { id: 'eg-2', source: 'gas-transfer-1', target: 'gas-agitate', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
    { id: 'eg-3', source: 'gas-agitate', target: 'gas-heat', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
    { id: 'eg-4', source: 'gas-heat', target: 'gas-cutoff', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
    { id: 'eg-5', source: 'gas-cutoff', target: 'gas-transfer-2', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
    { id: 'eg-6', source: 'gas-transfer-2', target: 'gas-end', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
  ],
});

let isSubscribed = false;

export const useBatchStore = create<BatchStoreState>()(
  immer((set, get) => ({
    recipes: [],
    batches: [],
    selectedRecipeId: null,
    selectedBatchId: null,
    activeBatch: null,
    subTab: 'list',
    selectedNodeId: null,

    init: () => {
      // Load saved recipes and batches
      const savedRecipes = localStorage.getItem(STORAGE_KEYS.RECIPES);
      const savedBatches = localStorage.getItem(STORAGE_KEYS.BATCHES);

      let recipesList: RecipeEntity[] = [];
      if (savedRecipes) {
        try {
          recipesList = JSON.parse(savedRecipes);
          if (!recipesList.some((r) => r.id === 'recipe-demo-gasolina')) {
            recipesList.push(getGasolineRecipe());
            localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipesList));
          }
        } catch (e) {
          recipesList = [getDemoRecipe(), getGasolineRecipe()];
        }
      } else {
        recipesList = [getDemoRecipe(), getGasolineRecipe()];
        localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipesList));
      }

      let batchesList: BatchInstanceEntity[] = [];
      if (savedBatches) {
        try {
          batchesList = JSON.parse(savedBatches);
        } catch (e) {
          batchesList = [];
        }
      }

      set((state) => {
        state.recipes = recipesList;
        state.batches = batchesList;
        if (recipesList.length > 0 && !state.selectedRecipeId) {
          state.selectedRecipeId = recipesList[0].id;
        }
      });

      // Avoid double subscription
      if (!isSubscribed) {
        simulationEngine.subscribe(() => {
          const active = get().activeBatch;
          if (active && active.status === 'running') {
            // Tick active batch
            set((state) => {
              if (state.activeBatch && state.activeBatch.status === 'running') {
                const batch = state.activeBatch;
                const recipe = state.recipes.find((r) => r.id === batch.recipeId);
                if (!recipe) return;

                const ommStore = useOmmStore.getState();
                const globalProps = propertyRepo.getAll();
                const propsByObj: Record<string, Record<string, any>> = {};
                globalProps.forEach((p) => {
                  if (!propsByObj[p.targetId]) propsByObj[p.targetId] = {};
                  propsByObj[p.targetId][p.name] = p;
                });

                // Helper to add logs to the active batch
                const logToBatch = (msg: string, stepId?: string) => {
                  const nowStr = new Date().toLocaleTimeString();
                  const fullMsg = `[${nowStr}] ${msg}`;
                  batch.logs.push(fullMsg);
                  if (stepId) {
                    if (!batch.stepLogs[stepId]) batch.stepLogs[stepId] = [];
                    batch.stepLogs[stepId].push(fullMsg);
                  }
                  // Register in global audit log too
                  useLogStore.getState().addLog({
                    user: 'Bruno Kappi',
                    module: 'OMM Batch',
                    entity: 'Lote',
                    operation: 'MONITOR',
                    action: stepId ? 'Etapa Executando' : 'Mudança de Estado Lote',
                    description: msg,
                    severity: 'Informação',
                    result: 'Sucesso',
                    origin: 'system',
                    targetId: batch.id,
                  });
                };

                // Trigger activation of downstream nodes
                const activateNextSteps = (completedStepId: string) => {
                  const outgoingEdges = recipe.edges.filter((e) => e.source === completedStepId);
                  outgoingEdges.forEach((edge) => {
                    const targetNode = recipe.nodes.find((n) => n.id === edge.target);
                    if (!targetNode) return;

                    const targetType = targetNode.data.stepType as string;

                    // If it is a join node, check if all inputs are completed
                    if (targetType === 'join') {
                      const incomingEdges = recipe.edges.filter((e) => e.target === targetNode.id);
                      const allCompleted = incomingEdges.every(
                        (inEdge) => batch.stepStates[inEdge.source] === 'completed'
                      );
                      if (allCompleted) {
                        batch.stepStates[targetNode.id] = 'completed';
                        logToBatch(`[INFO] Sincronização atingida na etapa: "${targetNode.data.label}"`, targetNode.id);
                        activateNextSteps(targetNode.id);
                      } else {
                        batch.stepStates[targetNode.id] = 'running';
                        logToBatch(`[INFO] Aguardando sincronização na etapa: "${targetNode.data.label}"`, targetNode.id);
                      }
                    } else {
                      batch.stepStates[targetNode.id] = 'running';
                      batch.activeStepIds.push(targetNode.id);
                      batch.stepElapsedSeconds[targetNode.id] = 0;
                      batch.stepProgress[targetNode.id] = 0;
                      logToBatch(`[INFO] Etapa iniciada: "${targetNode.data.label}"`, targetNode.id);
                    }
                  });
                };

                const currentActiveStepIds = [...batch.activeStepIds];
                currentActiveStepIds.forEach((stepId) => {
                  const node = recipe.nodes.find((n) => n.id === stepId);
                  if (!node) return;

                  const stepType = node.data.stepType as string;
                  batch.stepElapsedSeconds[stepId] = (batch.stepElapsedSeconds[stepId] || 0) + 1;

                  if (stepType === 'start') {
                    batch.stepStates[stepId] = 'completed';
                    batch.stepProgress[stepId] = 100;
                    logToBatch(`[SUCESSO] Etapa "${node.data.label}" concluída.`);
                    activateNextSteps(stepId);
                    batch.activeStepIds = batch.activeStepIds.filter((id) => id !== stepId);
                  } 
                  else if (stepType === 'end') {
                    batch.stepStates[stepId] = 'completed';
                    batch.stepProgress[stepId] = 100;
                    batch.status = 'completed';
                    batch.endedAt = new Date().toISOString();
                    logToBatch(`[SUCESSO] Etapa final "${node.data.label}" alcançada. Lote concluído.`);
                    batch.activeStepIds = [];
                    if (batch.orderId) {
                      ommStore.changeOrderStatus(batch.orderId, 'Completed');
                    }
                  } 
                  else if (stepType === 'transfer') {
                    const originId = node.data.originId as string;
                    const destinationId = node.data.destinationId as string;
                    const productId = node.data.productId as string;
                    const plannedVolume = Number(node.data.plannedVolume || 1000);
                    const plannedFlow = Number(node.data.plannedFlow || 100);

                    if (!originId || !destinationId) {
                      batch.stepStates[stepId] = 'error';
                      batch.status = 'error';
                      logToBatch(`[ERRO] Erro na etapa de Transferência: Tanques de Origem/Destino não configurados!`, stepId);
                      return;
                    }

                    const activeMovId = batch.stepActiveMovementId?.[stepId];
                    if (!activeMovId) {
                      // Retrieve origin and destination tags for visual logging
                      const originTank = ommStore.equipments.find((e) => e.id === originId);
                      const destTank = ommStore.equipments.find((e) => e.id === destinationId);
                      const originTag = originTank?.tag || originId;
                      const destTag = destTank?.tag || destinationId;

                      // Find alignment if existing
                      const alignment = ommStore.alignments.find(
                        (a) => (a.fromEquipmentId === originId && a.toEquipmentId === destinationId)
                      );

                       // Create movement
                      const movId = ommStore.createMovement({
                        description: `Lote ${batch.batchNumber} - ${node.data.label}`,
                        productId,
                        areaId: originTank?.areaId || 'area-300',
                        originId,
                        destinationId,
                        alignmentId: alignment ? alignment.id : null,
                        plannedVolume,
                        plannedFlow,
                        simFlowRate: plannedFlow,
                        orderId: batch.orderId || '',
                      });

                      ommStore.changeMovementStatus(movId, 'Active');
                      if (!batch.stepActiveMovementId) batch.stepActiveMovementId = {};
                      batch.stepActiveMovementId[stepId] = movId;

                      const createdMov = ommStore.movements.find((m) => m.id === movId);
                      const movNumber = createdMov?.number || movId;
                      const orderNumber = ommStore.orders.find((o) => o.id === batch.orderId)?.number || '';

                      logToBatch(
                        `[OMM] Transferência ativa no OMM: ${originTag} ➔ ${destTag} (${plannedVolume} m³ a ${plannedFlow} m³/h) sob Ordem ${orderNumber}. Movimento: ${movNumber}`,
                        stepId
                      );
                    } else {
                      // Monitor movement progress
                      const movement = ommStore.movements.find((m) => m.id === activeMovId);
                      if (movement) {
                        batch.stepProgress[stepId] = Math.round(movement.percentComplete);
                        const movNumber = movement.number || activeMovId;
                        if (movement.status === 'Completed') {
                          batch.stepStates[stepId] = 'completed';
                          batch.stepProgress[stepId] = 100;
                          logToBatch(`[SUCESSO] Transferência do OMM concluída com sucesso. Movimento: ${movNumber}`, stepId);
                          activateNextSteps(stepId);
                          batch.activeStepIds = batch.activeStepIds.filter((id) => id !== stepId);
                        } else if (movement.status === 'Canceled') {
                          batch.stepStates[stepId] = 'error';
                          batch.status = 'error';
                          logToBatch(`[ERRO] Lote abortado: Movimento ${movNumber} do OMM foi cancelado pelo operador.`, stepId);
                        }
                      } else {
                        batch.stepStates[stepId] = 'error';
                        batch.status = 'error';
                        logToBatch(`[ERRO] Erro: Movimento associado ${activeMovId} sumiu do sistema!`, stepId);
                      }
                    }
                  } 
                  else if (stepType === 'agitate') {
                    const vesselId = node.data.vesselId as string;
                    const rpm = Number(node.data.agitatorSpeedRpm || 100);
                    const duration = Number(node.data.durationSeconds || 10);
                    const elapsed = batch.stepElapsedSeconds[stepId];

                    if (!vesselId) {
                      batch.stepStates[stepId] = 'error';
                      batch.status = 'error';
                      logToBatch(`[ERRO] Erro na etapa de Agitação: Misturador/Vaso não selecionado!`, stepId);
                      return;
                    }

                    const progress = Math.min(100, Math.round((elapsed / duration) * 100));
                    batch.stepProgress[stepId] = progress;

                    if (elapsed === 1) {
                      // Turn on agitator speed property on vessel
                      const vesselName = ommStore.equipments.find((e) => e.id === vesselId)?.tag || vesselId;
                      logToBatch(`[INFO] Ligando agitador no vaso ${vesselName} a ${rpm} RPM (Duração: ${duration}s).`, stepId);
                      
                      // Dynamically ensure agitator speed property exists
                      let prop = propsByObj[vesselId]?.['AgitatorSpeed'];
                      if (!prop) {
                        // Create and save property in repository
                        propertyRepo.save({
                          id: `prop-${uuidv4()}`,
                          targetId: vesselId,
                          targetType: 'instance',
                          name: 'AgitatorSpeed',
                          dataType: 'Float',
                          defaultValue: rpm.toString(),
                          description: 'Velocidade de rotação do agitador',
                          category: 'Processo',
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                        });
                      } else {
                        prop.defaultValue = rpm.toString();
                        propertyRepo.save(prop);
                      }
                      useObjectModelStore.getState().refreshData();
                    }

                    if (elapsed >= duration) {
                      // Agitation finished, turn off
                      const prop = propsByObj[vesselId]?.['AgitatorSpeed'];
                      if (prop) {
                        prop.defaultValue = '0.0';
                        propertyRepo.save(prop);
                      }
                      useObjectModelStore.getState().refreshData();

                      batch.stepStates[stepId] = 'completed';
                      batch.stepProgress[stepId] = 100;
                      logToBatch(`[SUCESSO] Agitação concluída. Agitador desligado.`, stepId);
                      activateNextSteps(stepId);
                      batch.activeStepIds = batch.activeStepIds.filter((id) => id !== stepId);
                    }
                  } 
                  else if (stepType === 'heat') {
                    const vesselId = node.data.heatVesselId as string;
                    const targetTemp = Number(node.data.targetTemperature || 30);
                    const rate = Number(node.data.heatingRate || 0.5);

                    if (!vesselId) {
                      batch.stepStates[stepId] = 'error';
                      batch.status = 'error';
                      logToBatch(`[ERRO] Erro na etapa de Aquecimento: Vaso não selecionado!`, stepId);
                      return;
                    }

                    let tempProp = propsByObj[vesselId]?.['Temperature'];
                    if (!tempProp) {
                      batch.stepStates[stepId] = 'error';
                      batch.status = 'error';
                      logToBatch(`[ERRO] Erro: Propriedade Temperature não encontrada no equipamento ${vesselId}!`, stepId);
                      return;
                    }

                    const currentTemp = parseFloat(tempProp.defaultValue || '25.0');
                    if (currentTemp >= targetTemp) {
                      batch.stepStates[stepId] = 'completed';
                      batch.stepProgress[stepId] = 100;
                      logToBatch(`[SUCESSO] Temperatura alvo de ${targetTemp}°C atingida (Atual: ${currentTemp.toFixed(1)}°C).`, stepId);
                      activateNextSteps(stepId);
                      batch.activeStepIds = batch.activeStepIds.filter((id) => id !== stepId);
                    } else {
                      // Apply heating rate
                      const nextTemp = Math.min(targetTemp, currentTemp + rate);
                      tempProp.defaultValue = nextTemp.toFixed(2);
                      propertyRepo.save(tempProp);
                      useObjectModelStore.getState().refreshData();

                      const progress = Math.min(99, Math.round(((currentTemp - 20) / (targetTemp - 20 || 1)) * 100)); // rough progress estimate
                      batch.stepProgress[stepId] = Math.max(0, progress);
                      if (batch.stepElapsedSeconds[stepId] % 5 === 0) {
                        logToBatch(`[PROCESSO] Aquecendo... Temperatura atual: ${currentTemp.toFixed(1)}°C / Alvo: ${targetTemp}°C.`, stepId);
                      }
                    }
                  } 
                  else if (stepType === 'cool') {
                    const vesselId = node.data.heatVesselId as string;
                    const targetTemp = Number(node.data.targetTemperature || 15);
                    const rate = Number(node.data.coolingRate || 0.5);

                    if (!vesselId) {
                      batch.stepStates[stepId] = 'error';
                      batch.status = 'error';
                      logToBatch(`[ERRO] Erro na etapa de Resfriamento: Vaso não selecionado!`, stepId);
                      return;
                    }

                    let tempProp = propsByObj[vesselId]?.['Temperature'];
                    if (!tempProp) {
                      batch.stepStates[stepId] = 'error';
                      batch.status = 'error';
                      logToBatch(`[ERRO] Erro: Propriedade Temperature não encontrada no equipamento ${vesselId}!`, stepId);
                      return;
                    }

                    const currentTemp = parseFloat(tempProp.defaultValue || '25.0');
                    if (currentTemp <= targetTemp) {
                      batch.stepStates[stepId] = 'completed';
                      batch.stepProgress[stepId] = 100;
                      logToBatch(`[SUCESSO] Temperatura alvo de resfriamento de ${targetTemp}°C atingida (Atual: ${currentTemp.toFixed(1)}°C).`, stepId);
                      activateNextSteps(stepId);
                      batch.activeStepIds = batch.activeStepIds.filter((id) => id !== stepId);
                    } else {
                      // Apply cooling rate
                      const nextTemp = Math.max(targetTemp, currentTemp - rate);
                      tempProp.defaultValue = nextTemp.toFixed(2);
                      propertyRepo.save(tempProp);
                      useObjectModelStore.getState().refreshData();

                      const progress = Math.min(99, Math.round(((40 - currentTemp) / (40 - targetTemp || 1)) * 100)); // rough progress estimate
                      batch.stepProgress[stepId] = Math.max(0, progress);
                      if (batch.stepElapsedSeconds[stepId] % 5 === 0) {
                        logToBatch(`[PROCESSO] Resfriando... Temperatura atual: ${currentTemp.toFixed(1)}°C / Alvo: ${targetTemp}°C.`, stepId);
                      }
                    }
                  }
                  else if (stepType === 'cip') {
                    const vesselId = node.data.vesselId as string;
                    const agent = node.data.cipAgent || 'Soda (NaOH) 2%';
                    const duration = Number(node.data.durationSeconds || 15);
                    const elapsed = batch.stepElapsedSeconds[stepId];

                    if (!vesselId) {
                      batch.stepStates[stepId] = 'error';
                      batch.status = 'error';
                      logToBatch(`[ERRO] Erro na etapa de Limpeza/CIP: Vaso não selecionado!`, stepId);
                      return;
                    }

                    const progress = Math.min(100, Math.round((elapsed / duration) * 100));
                    batch.stepProgress[stepId] = progress;

                    if (elapsed === 1) {
                      const vesselName = ommStore.equipments.find((e) => e.id === vesselId)?.tag || vesselId;
                      logToBatch(`[INFO] Iniciando ciclo CIP no vaso ${vesselName} usando ${agent} (Tempo: ${duration}s).`, stepId);
                    }

                    if (elapsed >= duration) {
                      batch.stepStates[stepId] = 'completed';
                      batch.stepProgress[stepId] = 100;
                      logToBatch(`[SUCESSO] Ciclo CIP concluído com sucesso no vaso.`, stepId);
                      activateNextSteps(stepId);
                      batch.activeStepIds = batch.activeStepIds.filter((id) => id !== stepId);
                    }
                  }
                  else if (stepType === 'separate') {
                    const vesselId = node.data.vesselId as string;
                    const method = node.data.separationMethod || 'Decantação Estática';
                    const duration = Number(node.data.durationSeconds || 20);
                    const elapsed = batch.stepElapsedSeconds[stepId];

                    if (!vesselId) {
                      batch.stepStates[stepId] = 'error';
                      batch.status = 'error';
                      logToBatch(`[ERRO] Erro na etapa de Separação: Vaso não selecionado!`, stepId);
                      return;
                    }

                    const progress = Math.min(100, Math.round((elapsed / duration) * 100));
                    batch.stepProgress[stepId] = progress;

                    if (elapsed === 1) {
                      const vesselName = ommStore.equipments.find((e) => e.id === vesselId)?.tag || vesselId;
                      logToBatch(`[INFO] Iniciando processo de Separação (${method}) no vaso ${vesselName} (Tempo: ${duration}s).`, stepId);
                    }

                    if (elapsed >= duration) {
                      batch.stepStates[stepId] = 'completed';
                      batch.stepProgress[stepId] = 100;
                      logToBatch(`[SUCESSO] Processo de Separação (${method}) concluído.`, stepId);
                      activateNextSteps(stepId);
                      batch.activeStepIds = batch.activeStepIds.filter((id) => id !== stepId);
                    }
                  }
                  else if (stepType === 'cutoff') {
                    // Triggers manual cutoff
                    logToBatch(`[INFO] Executando Cut-off contábil automático para fechamento de balanço de lote.`, stepId);
                    ommStore.executeManualCutoff(`Cut-off Lote ${batch.batchNumber}`);
                    
                    batch.stepStates[stepId] = 'completed';
                    batch.stepProgress[stepId] = 100;
                    logToBatch(`[SUCESSO] Cut-off executado e validado.`, stepId);
                    activateNextSteps(stepId);
                    batch.activeStepIds = batch.activeStepIds.filter((id) => id !== stepId);
                  }
                  else if (stepType === 'split') {
                    batch.stepStates[stepId] = 'completed';
                    batch.stepProgress[stepId] = 100;
                    logToBatch(`[INFO] Divisão paralela alcançada. Disparando fluxos paralelos.`, stepId);
                    activateNextSteps(stepId);
                    batch.activeStepIds = batch.activeStepIds.filter((id) => id !== stepId);
                  }
                });

                // Sync and persist active batch in instances history
                const idx = state.batches.findIndex((b) => b.id === batch.id);
                if (idx !== -1) {
                  state.batches[idx] = { ...batch };
                } else {
                  state.batches.push({ ...batch });
                }
                localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(state.batches));
              }
            });
          }
        });
        isSubscribed = true;
      }
    },

    createRecipe: (name, description = '') => {
      const newRecipe: RecipeEntity = {
        id: `recipe-${uuidv4()}`,
        name,
        description,
        category: 'Personalizado',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodes: [
          {
            id: 'step-start',
            type: 'customNode',
            position: { x: 100, y: 150 },
            data: {
              label: 'Início',
              stepType: 'start',
              description: 'Início do Lote',
              inputsCount: 0,
              outputsCount: 1,
              color: '#10b981',
              blockType: 'INÍCIO',
              category: 'Controle',
              iconName: 'Play',
            },
          },
          {
            id: 'step-end',
            type: 'customNode',
            position: { x: 500, y: 150 },
            data: {
              label: 'Fim',
              stepType: 'end',
              description: 'Finalização do Lote',
              inputsCount: 1,
              outputsCount: 0,
              color: '#ef4444',
              blockType: 'FIM',
              category: 'Controle',
              iconName: 'Zap',
            },
          },
        ],
        edges: [
          { id: `e-${uuidv4()}`, source: 'step-start', target: 'step-end', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
        ],
      };

      set((state) => {
        state.recipes.push(newRecipe);
        state.selectedRecipeId = newRecipe.id;
        state.subTab = 'designer';
        localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(state.recipes));
      });

      useLogStore.getState().addLog({
        user: 'Bruno Kappi',
        module: 'OMM Batch',
        entity: 'Receita',
        operation: 'CREATE',
        action: 'Nova Receita Criada',
        description: `Receita industrial "${name}" criada pelo usuário no designer.`,
        severity: 'Informação',
        result: 'Sucesso',
        origin: 'manual',
        targetId: newRecipe.id,
      });

      return newRecipe;
    },

    updateRecipeNodesEdges: (id, nodes, edges) => {
      set((state) => {
        const recipe = state.recipes.find((r) => r.id === id);
        if (recipe) {
          recipe.nodes = nodes;
          recipe.edges = edges;
          recipe.updatedAt = new Date().toISOString();
          localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(state.recipes));
        }
      });
    },

    saveRecipe: (id, updates) => {
      set((state) => {
        const recipe = state.recipes.find((r) => r.id === id);
        if (recipe) {
          Object.assign(recipe, updates);
          recipe.updatedAt = new Date().toISOString();
          localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(state.recipes));
        }
      });

      useLogStore.getState().addLog({
        user: 'Bruno Kappi',
        module: 'OMM Batch',
        entity: 'Receita',
        operation: 'UPDATE',
        action: 'Receita Atualizada',
        description: `Configurações da receita "${updates.name || id}" salvas.`,
        severity: 'Informação',
        result: 'Sucesso',
        origin: 'manual',
        targetId: id,
      });
    },

    deleteRecipe: (id) => {
      set((state) => {
        state.recipes = state.recipes.filter((r) => r.id !== id);
        if (state.selectedRecipeId === id) {
          state.selectedRecipeId = state.recipes.length > 0 ? state.recipes[0].id : null;
        }
        localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(state.recipes));
      });

      useLogStore.getState().addLog({
        user: 'Bruno Kappi',
        module: 'OMM Batch',
        entity: 'Receita',
        operation: 'DELETE',
        action: 'Receita Removida',
        description: `Receita ${id} removida do banco local.`,
        severity: 'Informação',
        result: 'Sucesso',
        origin: 'manual',
        targetId: id,
      });
    },

    duplicateRecipe: (id) => {
      let duplicated: RecipeEntity | null = null;
      set((state) => {
        const recipe = state.recipes.find((r) => r.id === id);
        if (recipe) {
          duplicated = {
            ...recipe,
            id: `recipe-${uuidv4()}`,
            name: `${recipe.name} (Cópia)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // Deep copy nodes to avoid reference conflicts in React Flow
            nodes: recipe.nodes.map((n) => ({ ...n, id: `${n.id}-${uuidv4().substring(0, 4)}` })),
            edges: recipe.edges.map((e) => ({
              ...e,
              id: `e-${uuidv4()}`,
              source: e.source,
              target: e.target,
            })),
          };
          
          // Re-map duplicated edges to point to the new node IDs
          recipe.nodes.forEach((oldNode, idx) => {
            const newNode = duplicated!.nodes[idx];
            duplicated!.edges.forEach((edge) => {
              if (edge.source === oldNode.id) edge.source = newNode.id;
              if (edge.target === oldNode.id) edge.target = newNode.id;
            });
          });

          state.recipes.push(duplicated!);
          state.selectedRecipeId = duplicated!.id;
          state.subTab = 'designer';
          localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(state.recipes));
        }
      });

      if (duplicated) {
        useLogStore.getState().addLog({
          user: 'Bruno Kappi',
          module: 'OMM Batch',
          entity: 'Receita',
          operation: 'CREATE',
          action: 'Receita Duplicada',
          description: `Duplicação da receita "${id}" concluída. Nova receita: "${(duplicated as RecipeEntity).name}".`,
          severity: 'Informação',
          result: 'Sucesso',
          origin: 'manual',
          targetId: (duplicated as RecipeEntity).id,
        });
      }
      return duplicated;
    },

    setSelectedRecipeId: (id) => set((state) => { state.selectedRecipeId = id; }),
    setSelectedBatchId: (id) => set((state) => { state.selectedBatchId = id; }),
    setSubTab: (tab) => set((state) => { state.subTab = tab; }),
    setSelectedNodeId: (id) => set((state) => { state.selectedNodeId = id; }),

    startBatch: (recipeId) => {
      const recipe = get().recipes.find((r) => r.id === recipeId);
      if (!recipe) return;

      // Validate recipe nodes (Must have start and end nodes)
      const hasStart = recipe.nodes.some((n) => n.data.stepType === 'start');
      const hasEnd = recipe.nodes.some((n) => n.data.stepType === 'end');
      if (!hasStart || !hasEnd) {
        alert('Erro de Validação: A receita precisa conter etapas de Início e Fim conectadas!');
        return;
      }

      // Format Batch Number: BATCH-YYMMDD-HHMM
      const now = new Date();
      const yr = now.getFullYear().toString().substring(2);
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const dy = String(now.getDate()).padStart(2, '0');
      const hr = String(now.getHours()).padStart(2, '0');
      const mn = String(now.getMinutes()).padStart(2, '0');
      const batchNum = `BATCH-${yr}${mo}${dy}-${hr}${mn}`;

      const startNode = recipe.nodes.find((n) => n.data.stepType === 'start')!;
      
      // Create an order in OMM system representing this batch
      const ommStore = useOmmStore.getState();
      const orderCount = ommStore.orders.length + 1;
      const batchOrderNumber = `BAT-${now.getFullYear()}-${String(orderCount).padStart(3, '0')}`;

      const orderId = ommStore.createOrder({
        number: batchOrderNumber,
        description: `Batelada ${batchNum} - Receita: ${recipe.name}`,
        status: 'Active',
        priority: 'Normal',
        areaId: recipe.id.includes('gasolina') ? 'area-400' : 'area-300',
      });

      const initialStates: Record<string, BatchStepState> = {};
      const initialProgress: Record<string, number> = {};
      const initialElapsed: Record<string, number> = {};

      recipe.nodes.forEach((n) => {
        initialStates[n.id] = 'pending';
        initialProgress[n.id] = 0;
        initialElapsed[n.id] = 0;
      });

      // Start node runs immediately
      initialStates[startNode.id] = 'running';

      const newBatch: BatchInstanceEntity = {
        id: `batch-${uuidv4()}`,
        recipeId,
        recipeName: recipe.name,
        batchNumber: batchNum,
        status: 'running',
        createdAt: now.toISOString(),
        startedAt: now.toISOString(),
        endedAt: null,
        activeStepIds: [startNode.id],
        stepStates: initialStates,
        stepElapsedSeconds: initialElapsed,
        stepProgress: initialProgress,
        stepActiveMovementId: {},
        stepLogs: {},
        logs: [`[${now.toLocaleTimeString()}] [INÍCIO] Inicializando lote ${batchNum}...`],
        orderId,
      };

      set((state) => {
        state.activeBatch = newBatch;
        state.selectedBatchId = newBatch.id;
        state.batches.unshift(newBatch);
        state.subTab = 'monitor';
        localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(state.batches));
      });

      useLogStore.getState().addLog({
        user: 'Bruno Kappi',
        module: 'OMM Batch',
        entity: 'Lote',
        operation: 'ACTIVATE',
        action: 'Lote Iniciado',
        description: `Batelada ${batchNum} baseada na receita "${recipe.name}" iniciada pelo operador.`,
        severity: 'Informação',
        result: 'Sucesso',
        origin: 'manual',
        targetId: newBatch.id,
      });
    },

    pauseBatch: () => {
      set((state) => {
        if (state.activeBatch) {
          state.activeBatch.status = 'paused';
          const nowStr = new Date().toLocaleTimeString();
          state.activeBatch.logs.push(`[${nowStr}] Lote pausado manualmente pelo operador.`);
          
          // Also pause any active movement in OMM
          const activeMovs = state.activeBatch.stepActiveMovementId || {};
          const ommStore = useOmmStore.getState();
          Object.values(activeMovs).forEach((movId) => {
            ommStore.toggleMovementPause(movId);
          });
        }
      });
    },

    resumeBatch: () => {
      set((state) => {
        if (state.activeBatch) {
          state.activeBatch.status = 'running';
          const nowStr = new Date().toLocaleTimeString();
          state.activeBatch.logs.push(`[${nowStr}] Lote retomado pelo operador.`);

          // Resume OMM movements
          const activeMovs = state.activeBatch.stepActiveMovementId || {};
          const ommStore = useOmmStore.getState();
          Object.values(activeMovs).forEach((movId) => {
            const mov = ommStore.movements.find(m => m.id === movId);
            if (mov && mov.simPaused) {
              ommStore.toggleMovementPause(movId);
            }
          });
        }
      });
    },

    cancelBatch: () => {
      set((state) => {
        if (state.activeBatch) {
          state.activeBatch.status = 'canceled';
          state.activeBatch.endedAt = new Date().toISOString();
          const nowStr = new Date().toLocaleTimeString();
          state.activeBatch.logs.push(`[${nowStr}] Lote abortado e cancelado pelo operador.`);

           // Cancel active OMM movements
           const activeMovs = state.activeBatch.stepActiveMovementId || {};
           const ommStore = useOmmStore.getState();
           Object.values(activeMovs).forEach((movId) => {
             ommStore.changeMovementStatus(movId, 'Canceled');
           });

           // Cancel OMM order if exists
           if (state.activeBatch.orderId) {
             ommStore.changeOrderStatus(state.activeBatch.orderId, 'Canceled');
           }

          // Reset agitator or temperatures if they were executing
          const recipe = state.recipes.find((r) => r.id === state.activeBatch!.recipeId);
          if (recipe) {
            state.activeBatch!.activeStepIds.forEach((stepId) => {
              const node = recipe.nodes.find((n) => n.id === stepId);
              if (!node) return;
              if (node.data.stepType === 'agitate' && node.data.vesselId) {
                const globalProps = propertyRepo.getAll();
                const prop = globalProps.find(p => p.targetId === node.data.vesselId && p.name === 'AgitatorSpeed');
                if (prop) {
                  prop.defaultValue = '0.0';
                  propertyRepo.save(prop);
                }
              }
              state.activeBatch!.stepStates[stepId] = 'pending';
            });
          }
          state.activeBatch.activeStepIds = [];
          
          const idx = state.batches.findIndex((b) => b.id === state.activeBatch!.id);
          if (idx !== -1) {
            state.batches[idx] = { ...state.activeBatch };
          }
          localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(state.batches));
        }
      });
    },

    clearHistory: () => {
      set((state) => {
        state.batches = [];
        state.activeBatch = null;
        localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify([]));
      });
    },

    resetBatchStore: () => {
      set((state) => {
        state.recipes = [getDemoRecipe(), getGasolineRecipe()];
        state.batches = [];
        state.activeBatch = null;
        state.selectedRecipeId = 'recipe-demo-nafta';
        state.subTab = 'list';
        localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(state.recipes));
        localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify([]));
      });
    },
  }))
);
