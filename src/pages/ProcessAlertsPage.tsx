import React, { useState, useMemo, useEffect } from "react";
import {
  AlertTriangle,
  Volume2,
  Check,
  Search,
  Settings,
  Bell,
  CheckSquare,
  Activity,
  FilterX,
  X,
  Info,
  Layers,
  ChevronRight,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import { HeaderNavigation } from "../components/navigation/HeaderNavigation";
import {
  useProcessAlertStore,
  playSynthesizedSound,
} from "../store/useProcessAlertStore";
import { useOmmStore } from "../features/omm/store/useOmmStore";
import { useObjectModelStore } from "../store/useObjectModelStore";
import { useAuthStore } from "../store/useAuthStore";
import type {
  ProcessAlertRule,
  ProcessAlertSeverity,
  ProcessAlertStatus,
  ProcessAlertDefinition,
} from "../types/processAlert";
import { cn } from "../utils/cn";

const getParamLabel = (key: string): string => {
  switch (key) {
    case "startDelayMin":
      return "Atraso de Início Mínimo (min)";
    case "endDelayMin":
      return "Atraso de Término Mínimo (min)";
    case "progressPctThreshold":
      return "Limite do Progresso (%)";
    case "divergenceTolerancePct":
      return "Tolerância Divergência (%)";
    case "ttlThresholdMin":
    case "ttlMinThreshold":
      return "Limite de Tempo Preditivo (min)";
    case "pendingMin":
      return "Tempo Limite para Encerramento (min)";
    case "flowDeviationPct":
      return "Tolerância de Desvio de Vazão (%)";
    case "rateThreshold":
      return "Taxa Limite de Evolução (m³/h)";
    default:
      return key;
  }
};

const getAreaColor = (areaId: string, areasList?: any[]) => {
  if (areasList && areasList.length > 0) {
    const found = areasList.find((a) => a.id === areaId);
    if (found?.color) return found.color;
  }
  if (areaId === "area-300") return "#0ea5e9"; // Blue / Sky
  if (areaId === "area-400") return "#ec4899"; // Pink / Emerald
  if (areaId === "area-500") return "#f59e0b"; // Amber
  return "#64748b"; // Slate
};

const getAreaCode = (areaId: string, areasList?: any[]) => {
  if (areasList && areasList.length > 0) {
    const found = areasList.find((a) => a.id === areaId);
    if (found?.code) return found.code;
  }
  if (areaId === "area-300") return "UN-300";
  if (areaId === "area-400") return "UN-400";
  if (areaId === "area-500") return "UN-500";
  return areaId;
};

export const ProcessAlertsPage: React.FC = () => {
  const {
    rules,
    definitions,
    occurrences,
    init: initAlerts,
    acknowledgeAlert,
    acknowledgeMultiple,
    toggleRule,
    updateRule,
    createDefinition,
    updateDefinition,
    deleteDefinition,
    toggleDefinition,
    triggerTestAlert,
    resetToDefaults,
    clearAll: clearAllAlerts,
  } = useProcessAlertStore();

  const { areas, init: initOmm } = useOmmStore();
  const { objects } = useObjectModelStore();
  const { currentUser } = useAuthStore();

  const operatorName = currentUser?.name || "Operador Serrano";

  // Initialize Store
  useEffect(() => {
    initAlerts();
    initOmm();
  }, [initAlerts, initOmm]);

  // Tabs: 'active' | 'history' | 'definitions' | 'presets'
  const [activeTab, setActiveTab] = useState<
    "active" | "history" | "definitions" | "presets"
  >("active");

  // Filters State for Occurrences
  const [searchTerm, setSearchTerm] = useState("");
  const [filterArea, setFilterArea] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all"); // all, 15m, 1h, 24h

  // Selection & Details State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedOccurId, setSelectedOccurId] = useState<string | null>(null);

  // Preset Modal State
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Definition Modal State
  const [isDefModalOpen, setIsDefModalOpen] = useState(false);
  const [editingDefId, setEditingDefId] = useState<string | null>(null);

  // Definition Form Fields
  const [defCode, setDefCode] = useState("");
  const [defName, setDefName] = useState("");
  const [defRuleId, setDefRuleId] = useState("");
  const [defAreaId, setDefAreaId] = useState("");
  const [defTargetObjectId, setDefTargetObjectId] = useState("");
  const [defEnabled, setDefEnabled] = useState(false);
  const [defOverrideParams, setDefOverrideParams] = useState(false);
  const [defCustomParams, setDefCustomParams] = useState<Record<string, any>>({});

  // Reset selected items when changing tabs
  useEffect(() => {
    setSelectedIds([]);
    setSelectedOccurId(null);
  }, [activeTab]);

  // Reset page when filters change
  useEffect(() => {
    setSelectedOccurId(null);
  }, [searchTerm, filterArea, filterSeverity, filterType, filterPeriod]);

  // Get selected occurrence
  const selectedOccur = useMemo(() => {
    return occurrences.find((o) => o.id === selectedOccurId) || null;
  }, [occurrences, selectedOccurId]);

  // Get selected preset
  const selectedPreset = useMemo(() => {
    return rules.find((r) => r.id === selectedPresetId) || null;
  }, [rules, selectedPresetId]);

  // Open definition modal for creation
  const handleOpenCreateDef = () => {
    setEditingDefId(null);
    setDefCode(`AL-${Math.floor(100 + Math.random() * 900)}`);
    setDefName("");
    const initialRule = rules[0];
    setDefRuleId(initialRule?.id || "");
    setDefAreaId(areas[0]?.id || "");
    setDefTargetObjectId("");
    setDefEnabled(false);
    setDefOverrideParams(false);
    setDefCustomParams({});
    setIsDefModalOpen(true);
  };

  // Open definition modal for edit
  const handleOpenEditDef = (def: ProcessAlertDefinition) => {
    setEditingDefId(def.id);
    setDefCode(def.code);
    setDefName(def.name);
    setDefRuleId(def.ruleId);
    setDefAreaId(def.areaId);
    setDefTargetObjectId(def.targetObjectId || "");
    setDefEnabled(def.enabled);
    const hasCustom = !!def.customParams && Object.keys(def.customParams).length > 0;
    setDefOverrideParams(hasCustom);
    setDefCustomParams(def.customParams ? { ...def.customParams } : {});
    setIsDefModalOpen(true);
  };

  // Save Definition Form
  const handleSaveDefinition = () => {
    const payload: Partial<ProcessAlertDefinition> = {
      code: defCode,
      name: defName,
      ruleId: defRuleId,
      areaId: defAreaId,
      targetObjectId: defTargetObjectId || null,
      enabled: defEnabled,
      customParams: defOverrideParams && Object.keys(defCustomParams).length > 0 ? defCustomParams : undefined,
    };

    if (editingDefId) {
      updateDefinition(editingDefId, payload);
    } else {
      createDefinition(payload);
    }
    setIsDefModalOpen(false);
    setEditingDefId(null);
  };

  // Filter tanks for the object selection dropdown based on selected Area
  const filteredTanks = useMemo(() => {
    if (!defAreaId) return objects;
    return objects.filter((obj) => {
      const name = obj.name || "";
      if (defAreaId === "area-300")
        return name.startsWith("TK-3") || name.startsWith("V-3");
      if (defAreaId === "area-400")
        return name.startsWith("TK-4") || name.startsWith("V-4");
      if (defAreaId === "area-500")
        return name.startsWith("TK-5") || name.startsWith("V-5");
      return true;
    });
  }, [objects, defAreaId]);

  // Processed Occurrences list
  const filteredOccurrences = useMemo(() => {
    let list = [...occurrences];

    // Filter by Active vs History
    if (activeTab === "active") {
      list = list.filter(
        (o) => o.status === "active_unacknowledged",
      );
    } else if (activeTab === "history") {
      list = list.filter(
        (o) =>
          o.status === "active_acknowledged" ||
          o.status === "resolved" ||
          o.status === "expired",
      );
    }

    // Filter by text search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (o) =>
          o.code.toLowerCase().includes(q) ||
          o.name.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q) ||
          (o.relatedObjectName &&
            o.relatedObjectName.toLowerCase().includes(q)) ||
          (o.relatedMovementNumber &&
            o.relatedMovementNumber.toLowerCase().includes(q)),
      );
    }

    // Filter by Area
    if (filterArea !== "all") {
      list = list.filter((o) => o.responsibleAreas.includes(filterArea));
    }

    // Filter by Severity
    if (filterSeverity !== "all") {
      list = list.filter((o) => o.severity === filterSeverity);
    }

    // Filter by Type
    if (filterType !== "all") {
      list = list.filter((o) => o.type === filterType);
    }

    // Filter by Period
    if (filterPeriod !== "all") {
      const nowMs = Date.now();
      if (filterPeriod === "15m") {
        list = list.filter(
          (o) => nowMs - new Date(o.activatedAt).getTime() <= 15 * 60 * 1000,
        );
      } else if (filterPeriod === "1h") {
        list = list.filter(
          (o) => nowMs - new Date(o.activatedAt).getTime() <= 60 * 60 * 1000,
        );
      } else if (filterPeriod === "24h") {
        list = list.filter(
          (o) =>
            nowMs - new Date(o.activatedAt).getTime() <= 24 * 60 * 60 * 1000,
        );
      }
    }

    return list.sort(
      (a, b) =>
        new Date(b.activatedAt).getTime() - new Date(a.activatedAt).getTime(),
    );
  }, [
    occurrences,
    activeTab,
    searchTerm,
    filterArea,
    filterSeverity,
    filterType,
    filterPeriod,
  ]);

  // Clean filters helper
  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterArea("all");
    setFilterSeverity("all");
    setFilterType("all");
    setFilterPeriod("all");
  };

  // Toggle selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredOccurrences.map((o) => o.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Execute Acknowledge Selected
  const handleAckSelected = () => {
    const unacked = filteredOccurrences
      .filter(
        (o) =>
          selectedIds.includes(o.id) && o.status === "active_unacknowledged",
      )
      .map((o) => o.id);

    if (unacked.length > 0) {
      acknowledgeMultiple(unacked, operatorName);
      setSelectedIds([]);
    }
  };

  // Sound Test Helper
  const handlePlaySoundPreset = (soundPreset: string, vol: number) => {
    playSynthesizedSound(soundPreset, vol / 100);
  };

  // Save Preset Configuration Updates
  const handleUpdateRuleParam = (
    ruleId: string,
    field: keyof ProcessAlertRule,
    value: any,
  ) => {
    updateRule(ruleId, { [field]: value });
  };

  // Helpers to translate and format badges
  const getSeverityBadge = (sev: ProcessAlertSeverity) => {
    switch (sev) {
      case "info":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            Informativo
          </span>
        );
      case "attention":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Atenção
          </span>
        );
      case "important":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
            Importante
          </span>
        );
      case "critical":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 animate-pulse">
            Crítico
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: ProcessAlertStatus, isTest?: boolean) => {
    if (isTest) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-405 border border-purple-500/20">
          Simulado (Teste)
        </span>
      );
    }
    switch (status) {
      case "active_unacknowledged":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Ativo (Não Reconhecido)
          </span>
        );
      case "active_acknowledged":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Ativo (Reconhecido)
          </span>
        );
      case "resolved":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Resolvido (Autolimpado)
          </span>
        );
      case "expired":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-750">
            Expirado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <HeaderNavigation />

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Main Panel Content Area */}
        <div className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden min-w-0">
          {/* Dashboard Header Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 select-none">
            <div className="space-y-0.5">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Alertas de Processo e Operações
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Camada de monitoramento operacional preditivo para controle de
                movimentações, desvios e Time to Limits (TTL).
              </p>
            </div>

            {/* Top Navigation Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveTab("active")}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                  activeTab === "active"
                    ? "bg-sky-500 text-white border-sky-500 shadow-2xs"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
                )}>
                Alertas Ativos
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                  activeTab === "history"
                    ? "bg-sky-500 text-white border-sky-500 shadow-2xs"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
                )}>
                Histórico
              </button>
              <button
                onClick={() => setActiveTab("definitions")}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1",
                  activeTab === "definitions"
                    ? "bg-sky-500 text-white border-sky-500 shadow-2xs"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
                )}>
                <Layers className="w-3.5 h-3.5" />
                Alertas Configurados
              </button>
              <button
                onClick={() => setActiveTab("presets")}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1",
                  activeTab === "presets"
                    ? "bg-sky-500 text-white border-sky-500 shadow-2xs"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
                )}>
                <Settings className="w-3.5 h-3.5" />
                Presets de Regras
              </button>
            </div>
          </div>

          {/* Filters Bar (Only for Occurrences Tabs) */}
          {(activeTab === "active" || activeTab === "history") && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xs flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Pesquisar por código, tag, equipamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-xs font-semibold"
                />
              </div>

              {/* Area select */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase select-none">
                  Área:
                </span>
                <select
                  value={filterArea}
                  onChange={(e) => setFilterArea(e.target.value)}
                  className="px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-semibold">
                  <option value="all">Todas as Áreas</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code}
                    </option>
                  ))}
                </select>
              </div>

              {/* Severity select */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase select-none">
                  Severidade:
                </span>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-semibold">
                  <option value="all">Todas</option>
                  <option value="info">Informativo</option>
                  <option value="attention">Atenção</option>
                  <option value="important">Importante</option>
                  <option value="critical">Crítico</option>
                </select>
              </div>

              {/* Type select */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase select-none">
                  Tipo:
                </span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-semibold">
                  <option value="all">Todos os tipos</option>
                  <option value="movement_delayed_start">
                    Início Atrasado
                  </option>
                  <option value="movement_delayed_end">Término Atrasado</option>
                  <option value="movement_near_goal">Volume Próximo</option>
                  <option value="movement_goal_reached">Meta Atingida</option>
                  <option value="movement_physical_completion_pending">
                    Fechamento Pendente
                  </option>
                  <option value="movement_deviation">Desvio Vazão</option>
                  <option value="movement_divergence">Divergência</option>
                  <option value="process_ttl">Tempo Limite (TTL)</option>
                  <option value="process_unexpected_evolution">
                    Vazão Inesperada
                  </option>
                </select>
              </div>

              {/* Time Period select */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase select-none">
                  Período:
                </span>
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className="px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-semibold">
                  <option value="all">Tudo</option>
                  <option value="15m">Últimos 15 min</option>
                  <option value="1h">Última 1 hora</option>
                  <option value="24h">Últimas 24 horas</option>
                </select>
              </div>

              {/* Clear button */}
              {(searchTerm ||
                filterArea !== "all" ||
                filterSeverity !== "all" ||
                filterType !== "all" ||
                filterPeriod !== "all") && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer">
                  <FilterX className="w-3.5 h-3.5" />
                  Limpar
                </button>
              )}
            </div>
          )}

          {/* Grid / Content lists based on Active Tab */}
          <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs overflow-hidden flex flex-col">
            {/* 1. OCCURRENCES VIEWS (Active or History) */}
            {(activeTab === "active" || activeTab === "history") && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Checkbox block for batch actions */}
                {activeTab === "active" && filteredOccurrences.length > 0 && (
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-150 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-500">
                        {selectedIds.length} selecionado
                        {selectedIds.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAckSelected}
                        disabled={selectedIds.length === 0}
                        className={cn(
                          "px-3 py-1.5 rounded-lg font-bold border transition-colors flex items-center gap-1.5 cursor-pointer text-[10px]",
                          selectedIds.length > 0
                            ? "bg-amber-500 border-amber-500 text-white hover:bg-amber-600"
                            : "bg-slate-100 dark:bg-slate-850 border-slate-200 dark:border-slate-850 text-slate-400 cursor-not-allowed",
                        )}>
                        <CheckSquare className="w-3.5 h-3.5" />
                        Reconhecer Selecionados
                      </button>
                    </div>
                  </div>
                )}

                {filteredOccurrences.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12 select-none">
                    <Bell className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3 animate-pulse" />
                    <p className="text-sm text-slate-400 dark:text-slate-500 font-bold font-sans">
                      Nenhum alerta de processo encontrado.
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm font-sans">
                      {activeTab === "active"
                        ? "Todas as condições operacionais estão dentro do padrão ou as regras estão desabilitadas."
                        : "Nenhum alerta histórico registrado no momento."}
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-xs font-sans border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[10px] uppercase font-bold tracking-wider select-none bg-slate-50/50 dark:bg-slate-950/20">
                          {activeTab === "active" && (
                            <th className="p-2.5 w-8">
                              <input
                                type="checkbox"
                                checked={
                                  selectedIds.length ===
                                  filteredOccurrences.length
                                }
                                onChange={handleSelectAll}
                                className="rounded"
                              />
                            </th>
                          )}
                          <th className="p-2.5 whitespace-nowrap">Código</th>
                          <th className="p-2.5">Nome / Condição</th>
                          <th className="p-2.5 whitespace-nowrap">
                            Severidade
                          </th>
                          <th className="p-2.5 whitespace-nowrap">Status</th>
                          <th className="p-2.5 whitespace-nowrap">
                            Objeto/Movimento
                          </th>
                          <th className="p-2.5 whitespace-nowrap">
                            Valor Atual
                          </th>
                          <th className="p-2.5 whitespace-nowrap">Limite</th>
                          <th className="p-2.5 whitespace-nowrap">
                            Ativado Em
                          </th>
                          <th className="p-2.5 w-8">Ver</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOccurrences.map((occ) => {
                          const isSelected = selectedOccurId === occ.id;
                          const isCheckboxSelected = selectedIds.includes(
                            occ.id,
                          );
                          return (
                            <tr
                              key={occ.id}
                              onClick={() => setSelectedOccurId(occ.id)}
                              style={{ borderLeftColor: occ.colorHighlight }}
                              className={cn(
                                "border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors cursor-pointer border-l-3",
                                isSelected
                                  ? "bg-slate-100/50 dark:bg-slate-800/40"
                                  : "",
                              )}>
                              {activeTab === "active" && (
                                <td
                                  className="p-2.5"
                                  onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isCheckboxSelected}
                                    onChange={() => handleSelectOne(occ.id)}
                                    className="rounded"
                                  />
                                </td>
                              )}
                              <td className="p-2.5 whitespace-nowrap font-bold font-mono text-slate-550 dark:text-slate-400">
                                {occ.code}
                              </td>
                              <td className="p-2.5 max-w-[280px]">
                                <div
                                  className="font-bold text-slate-800 dark:text-slate-200 truncate"
                                  title={occ.name}>
                                  {occ.name}
                                </div>
                                <div
                                  className="text-[10px] text-slate-455 truncate"
                                  title={occ.conditionSummary}>
                                  {occ.conditionSummary}
                                </div>
                              </td>
                              <td className="p-2.5 whitespace-nowrap">
                                {getSeverityBadge(occ.severity)}
                              </td>
                              <td className="p-2.5 whitespace-nowrap">
                                {getStatusBadge(occ.status, occ.isTest)}
                              </td>
                              <td className="p-2.5 whitespace-nowrap">
                                {occ.relatedMovementNumber ? (
                                  <span className="font-semibold text-sky-600 dark:text-sky-400">
                                    {occ.relatedMovementNumber}
                                  </span>
                                ) : occ.relatedObjectName ? (
                                  <span className="font-semibold text-indigo-500">
                                    {occ.relatedObjectName}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-650">
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 whitespace-nowrap font-semibold font-mono text-slate-700 dark:text-slate-350">
                                {occ.currentValue}
                              </td>
                              <td className="p-2.5 whitespace-nowrap font-semibold font-mono text-slate-500 dark:text-slate-455">
                                {occ.limitValue}
                              </td>
                              <td className="p-2.5 whitespace-nowrap font-mono text-slate-500 dark:text-slate-455">
                                {new Date(occ.activatedAt).toLocaleTimeString(
                                  "pt-BR",
                                )}{" "}
                                {new Date(occ.activatedAt).toLocaleDateString(
                                  "pt-BR",
                                  { day: "2-digit", month: "2-digit" },
                                )}
                              </td>
                              <td className="p-2.5 text-center">
                                <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 2. CONFIGURED ALERTS TAB (DEFINITIONS) */}
            {activeTab === "definitions" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-150 dark:border-slate-800 text-xs select-none">
                  <span className="font-bold text-slate-500">
                    Instâncias de Monitoramento: {definitions.length} Alertas
                    Ativos no Processo
                  </span>

                  <button
                    onClick={handleOpenCreateDef}
                    className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer text-xs shadow-2xs">
                    <Plus className="w-4 h-4" /> Criar Novo Alerta
                  </button>
                </div>

                {definitions.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12 select-none">
                    <Layers className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3 animate-pulse" />
                    <p className="text-sm text-slate-400 dark:text-slate-500 font-bold font-sans">
                      Nenhum alerta de processo configurado.
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm font-sans">
                      Clique no botão acima para criar e associar um novo
                      monitoramento a um preset e área.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-xs font-sans border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[10px] uppercase font-bold tracking-wider select-none bg-slate-50/50 dark:bg-slate-950/20">
                          <th className="p-2.5 whitespace-nowrap">Código</th>
                          <th className="p-2.5">Nome</th>
                          <th className="p-2.5">Preset Regra</th>
                          <th className="p-2.5 whitespace-nowrap">Área</th>
                          <th className="p-2.5">Alvo Monitorado</th>
                          <th className="p-2.5 whitespace-nowrap text-center">
                            Habilitado
                          </th>
                          <th className="p-2.5 whitespace-nowrap">Criado Em</th>
                          <th className="p-2.5 w-16 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {definitions.map((def) => {
                          const r = rules.find((x) => x.id === def.ruleId);
                          const a = areas.find((x) => x.id === def.areaId);
                          const obj = objects.find(
                            (x) => x.id === def.targetObjectId,
                          );

                          return (
                            <tr
                              key={def.id}
                              className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/30 dark:hover:bg-slate-850/20 transition-colors">
                              <td className="p-2.5 font-bold font-mono text-slate-550 dark:text-slate-400 whitespace-nowrap">
                                {def.code}
                              </td>
                              <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">
                                {def.name}
                              </td>
                              <td className="p-2.5 text-slate-600 dark:text-slate-400">
                                <span className="font-semibold">
                                  {r?.name || "Regra Não Encontrada"}
                                </span>
                              </td>
                              <td className="p-2.5 whitespace-nowrap">
                                <span
                                  style={{
                                    backgroundColor:
                                      (a?.color || getAreaColor(def.areaId)) +
                                      "1a",
                                    color: a?.color || getAreaColor(def.areaId),
                                    borderColor:
                                      (a?.color || getAreaColor(def.areaId)) +
                                      "33",
                                  }}
                                  className="px-2 py-0.5 rounded border text-[9px] font-bold">
                                  {a?.code || getAreaCode(def.areaId)}
                                </span>
                              </td>
                              <td className="p-2.5 text-slate-550 dark:text-slate-400">
                                {obj ? (
                                  <span className="font-semibold text-indigo-500">
                                    {obj.name} ({obj.description})
                                  </span>
                                ) : (
                                  <span className="italic text-slate-400">
                                    Todos os tanques da área
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 text-center whitespace-nowrap">
                                <button
                                  onClick={() => toggleDefinition(def.id)}
                                  className={cn(
                                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                    def.enabled
                                      ? "bg-emerald-500"
                                      : "bg-slate-200 dark:bg-slate-800",
                                  )}>
                                  <span
                                    className={cn(
                                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                                      def.enabled
                                        ? "translate-x-4"
                                        : "translate-x-0",
                                    )}
                                  />
                                </button>
                              </td>
                              <td className="p-2.5 text-slate-500 font-mono whitespace-nowrap">
                                {new Date(def.createdAt).toLocaleTimeString(
                                  "pt-BR",
                                )}{" "}
                                {new Date(def.createdAt).toLocaleDateString(
                                  "pt-BR",
                                  { day: "2-digit", month: "2-digit" },
                                )}
                              </td>
                              <td className="p-2.5 flex justify-center gap-1.5 whitespace-nowrap">
                                <button
                                  onClick={() => handleOpenEditDef(def)}
                                  className="p-1 text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                                  title="Editar Alerta">
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => deleteDefinition(def.id)}
                                  className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-450 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                                  title="Excluir Alerta">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 3. RULE PRESETS VIEW */}
            {activeTab === "presets" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-150 dark:border-slate-800 text-xs select-none">
                  <span className="font-bold text-slate-500">
                    Modelos Operacionais: {rules.length} Presets Disponíveis
                    para Associação
                  </span>

                  <div className="flex gap-2">
                    <button
                      onClick={resetToDefaults}
                      className="px-3 py-1.5 rounded-lg font-bold border border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 cursor-pointer text-[10px]">
                      Restaurar Padrões
                    </button>
                    <button
                      onClick={clearAllAlerts}
                      className="px-3 py-1.5 rounded-lg font-bold border border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-450 hover:bg-rose-500/20 cursor-pointer text-[10px]">
                      Limpar Ocorrências
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                  {rules.map((rule) => {
                    return (
                      <div
                        key={rule.id}
                        onClick={() => {
                          setSelectedPresetId(rule.id);
                          setIsPresetModalOpen(true);
                        }}
                        style={{ borderLeftColor: rule.colorHighlight }}
                        className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 cursor-pointer hover:border-sky-400 hover:shadow-2xs dark:hover:border-sky-500/50 transition-all flex flex-col justify-between border-l-4 bg-slate-50/20 dark:bg-slate-900/10">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold font-mono text-slate-500">
                                  {rule.code}
                                </span>
                                {getSeverityBadge(rule.severity)}
                              </div>
                              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-1">
                                {rule.name}
                              </h4>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRule(rule.id);
                              }}
                              className={cn(
                                "px-2 py-0.5 rounded text-[9px] font-bold border cursor-pointer select-none",
                                rule.enabled
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                  : "bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-850",
                              )}>
                              {rule.enabled ? "ATIVO" : "DESABILITADO"}
                            </button>
                          </div>

                          <p className="text-[11px] text-slate-500 leading-normal">
                            {rule.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-455 font-semibold font-mono">
                          <span className="flex items-center gap-1">
                            <Volume2 className="w-3.5 h-3.5 text-slate-400" />{" "}
                            Som: {rule.soundFile} ({rule.soundVolume}%)
                          </span>

                          <span className="text-sky-500 font-bold flex items-center gap-1 hover:underline">
                            Configurar <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Details and Context Panel (Only displayed for occurrences lists) */}
        {(activeTab === "active" || activeTab === "history") && (
          <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto p-6 flex flex-col space-y-6 shrink-0 shadow-xs select-none">
            {selectedOccur ? (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-6">
                  {/* Sidebar Header */}
                  <div className="flex items-start justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] font-bold font-mono text-slate-400">
                        {selectedOccur.code}
                      </span>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {selectedOccur.name}
                      </h3>
                    </div>
                    <button
                      onClick={() => setSelectedOccurId(null)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Occurrence Properties */}
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800/40">
                      <span className="text-slate-455 font-medium">
                        Severidade:
                      </span>
                      {getSeverityBadge(selectedOccur.severity)}
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800/40">
                      <span className="text-slate-455 font-medium">
                        Status:
                      </span>
                      {getStatusBadge(
                        selectedOccur.status,
                        selectedOccur.isTest,
                      )}
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800/40">
                      <span className="text-slate-455 font-medium">
                        Disparo Manual:
                      </span>
                      <span className="font-bold text-slate-600 dark:text-slate-350">
                        {selectedOccur.isTest ? "Sim (Teste)" : "Não (Real)"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800/40">
                      <span className="text-slate-455 font-medium">
                        Ativado em:
                      </span>
                      <span className="font-mono text-slate-600 dark:text-slate-350">
                        {new Date(selectedOccur.activatedAt).toLocaleString(
                          "pt-BR",
                        )}
                      </span>
                    </div>

                    {selectedOccur.acknowledgedAt && (
                      <>
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800/40">
                          <span className="text-slate-455 font-medium">
                            Reconhecido em:
                          </span>
                          <span className="font-mono text-slate-600 dark:text-slate-350">
                            {new Date(
                              selectedOccur.acknowledgedAt,
                            ).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800/40">
                          <span className="text-slate-455 font-medium">
                            Reconhecido por:
                          </span>
                          <span className="font-semibold text-slate-600 dark:text-slate-300">
                            {selectedOccur.acknowledgedBy}
                          </span>
                        </div>
                      </>
                    )}

                    {selectedOccur.resolvedAt && (
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800/40">
                        <span className="text-slate-455 font-medium">
                          Resolvido em:
                        </span>
                        <span className="font-mono text-slate-600 dark:text-slate-350">
                          {new Date(selectedOccur.resolvedAt).toLocaleString(
                            "pt-BR",
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Context object details */}
                  <div className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3.5 text-xs">
                    <h4 className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">
                      Contexto Operacional
                    </h4>

                    {selectedOccur.relatedMovementNumber && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-455">Movimentação:</span>
                        <span className="font-bold text-sky-600 dark:text-sky-400">
                          {selectedOccur.relatedMovementNumber}
                        </span>
                      </div>
                    )}

                    {selectedOccur.relatedObjectName && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-455">Equipamento:</span>
                        <span className="font-bold text-indigo-500">
                          {selectedOccur.relatedObjectName}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-455">Condição Regra:</span>
                      <span className="font-semibold text-slate-600 dark:text-slate-350 text-right">
                        {selectedOccur.conditionSummary}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-150 dark:border-slate-850">
                      <span className="text-slate-455 font-semibold">
                        Valor Observado:
                      </span>
                      <span className="font-bold font-mono text-rose-500">
                        {selectedOccur.currentValue}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-455 font-semibold">
                        Limite Parâmetro:
                      </span>
                      <span className="font-bold font-mono text-slate-500">
                        {selectedOccur.limitValue}
                      </span>
                    </div>
                  </div>

                  {/* Areas responsibles */}
                  <div className="space-y-1.5 text-xs">
                    <span className="text-slate-455 font-medium">
                      Áreas Responsáveis:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedOccur.responsibleAreas.map((areaId) => {
                        const a = areas.find((x) => x.id === areaId);
                        const color = a?.color || getAreaColor(areaId);
                        const code = a?.code || getAreaCode(areaId);
                        return (
                          <span
                            key={areaId}
                            style={{
                              backgroundColor: color + "1a",
                              color: color,
                              borderColor: color + "33",
                            }}
                            className="px-2 py-0.5 rounded border text-[9px] font-bold">
                            {code}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Ack button */}
                {selectedOccur.status === "active_unacknowledged" && (
                  <button
                    onClick={() =>
                      acknowledgeAlert(selectedOccur.id, operatorName)
                    }
                    className="w-full mt-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs">
                    <Check className="w-4 h-4" />
                    Reconhecer Alerta
                  </button>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 py-20 select-none">
                <Info className="w-8 h-8 opacity-40 mb-2 animate-pulse" />
                <p className="text-xs font-bold font-sans">
                  Selecione um alerta
                </p>
                <p className="text-[10px] mt-0.5 font-sans">
                  Clique em uma linha para ver detalhes e ações operacionais.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 4. PRESET CONFIG DIALOG MODAL                                         */}
      {/* ===================================================================== */}
      {isPresetModalOpen && selectedPreset && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 select-none">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div
              style={{ borderBottomColor: selectedPreset.colorHighlight }}
              className="px-6 py-4 border-b-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold font-mono text-slate-400">
                  {selectedPreset.code}
                </span>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {selectedPreset.name}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsPresetModalOpen(false);
                  setSelectedPresetId(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-655 dark:hover:text-slate-250 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh] text-xs">
              <p className="text-[11px] text-slate-500 font-sans leading-normal bg-slate-50 dark:bg-slate-950/40 p-3 rounded-lg border border-slate-200 dark:border-slate-850">
                {selectedPreset.description}
              </p>

              {/* Severity Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-600 dark:text-slate-400 font-bold">
                  Severidade:
                </label>
                <select
                  value={selectedPreset.severity}
                  onChange={(e) =>
                    handleUpdateRuleParam(
                      selectedPreset.id,
                      "severity",
                      e.target.value,
                    )
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-semibold">
                  <option value="info">Informativo</option>
                  <option value="attention">Atenção</option>
                  <option value="important">Importante</option>
                  <option value="critical">Crítico</option>
                </select>
              </div>

              {/* Highlight Color */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-600 dark:text-slate-400 font-bold">
                  Cor de Destaque:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={selectedPreset.colorHighlight}
                    onChange={(e) =>
                      handleUpdateRuleParam(
                        selectedPreset.id,
                        "colorHighlight",
                        e.target.value,
                      )
                    }
                    className="w-8 h-8 rounded border border-slate-200 dark:border-slate-800 bg-transparent p-0 overflow-hidden cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={selectedPreset.colorHighlight.toUpperCase()}
                    onChange={(e) =>
                      handleUpdateRuleParam(
                        selectedPreset.id,
                        "colorHighlight",
                        e.target.value,
                      )
                    }
                    className="flex-1 px-3 py-1.5 border rounded-lg text-xs font-mono font-bold bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 uppercase"
                  />
                </div>
              </div>

              {/* Sound Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-600 dark:text-slate-400 font-bold">
                  Som de Alerta:
                </label>
                <select
                  value={selectedPreset.soundFile}
                  onChange={(e) =>
                    handleUpdateRuleParam(
                      selectedPreset.id,
                      "soundFile",
                      e.target.value,
                    )
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-semibold">
                  <option value="single-beep">Bip Simples</option>
                  <option value="double-beep">Bip Duplo</option>
                  <option value="chime">Chime Harmônico</option>
                  <option value="success-chime">Chime de Sucesso</option>
                  <option value="industrial-warning">Alarme Industrial</option>
                </select>
              </div>

              {/* Volume */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="text-slate-600 dark:text-slate-400 font-bold">
                    Volume:
                  </label>
                  <span className="font-mono font-bold text-sky-500">
                    {selectedPreset.soundVolume}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedPreset.soundVolume}
                    onChange={(e) =>
                      handleUpdateRuleParam(
                        selectedPreset.id,
                        "soundVolume",
                        parseInt(e.target.value),
                      )
                    }
                    className="flex-1 accent-sky-500 h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-100 dark:bg-slate-850"
                  />
                  <button
                    onClick={() =>
                      handlePlaySoundPreset(
                        selectedPreset.soundFile,
                        selectedPreset.soundVolume,
                      )
                    }
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-lg text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-850 cursor-pointer flex items-center gap-1 font-semibold whitespace-nowrap">
                    <Volume2 className="w-3.5 h-3.5" /> Testar
                  </button>
                </div>
              </div>

              {/* Params configuration */}
              {Object.keys(selectedPreset.params).map((key) => {
                const label =
                  key === "startDelayMin"
                    ? "Atraso de Início Mínimo (min):"
                    : key === "endDelayMin"
                      ? "Atraso de Término Mínimo (min):"
                      : key === "progressPctThreshold"
                        ? "Limite do Progresso (%):"
                        : key === "divergenceTolerancePct"
                          ? "Tolerância Divergência (%):"
                          : key === "ttlThresholdMin"
                            ? "Limite de Tempo Preditivo (min):"
                            : `${key}:`;

                return (
                  <div
                    key={key}
                    className="flex flex-col gap-1.5 border-t pt-3.5 border-slate-150 dark:border-slate-800">
                    <label className="text-slate-600 dark:text-slate-400 font-bold">
                      {label}
                    </label>
                    <input
                      type="number"
                      value={selectedPreset.params[key]}
                      onChange={(e) => {
                        const updatedParams = {
                          ...selectedPreset.params,
                          [key]: parseFloat(e.target.value) || 0,
                        };
                        handleUpdateRuleParam(
                          selectedPreset.id,
                          "params",
                          updatedParams,
                        );
                      }}
                      className="w-full px-3 py-2 border rounded-lg text-xs font-mono font-bold bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    />
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/20 border-t border-slate-150 dark:border-slate-800 flex justify-between gap-2 shrink-0">
              <button
                onClick={() => triggerTestAlert(selectedPreset.id)}
                className="px-3.5 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer text-xs">
                <Activity className="w-3.5 h-3.5" /> Teste manual
              </button>
              <button
                onClick={() => {
                  setIsPresetModalOpen(false);
                  setSelectedPresetId(null);
                }}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-705 text-slate-700 dark:text-slate-200 font-bold rounded-xl cursor-pointer text-xs">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. DEFINITION CONFIG DIALOG MODAL                                     */}
      {/* ===================================================================== */}
      {isDefModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 select-none">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {editingDefId
                  ? "Editar Alerta Configurado"
                  : "Criar Novo Alerta Configurado"}
              </h3>
              <button
                onClick={() => {
                  setIsDefModalOpen(false);
                  setEditingDefId(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-655 dark:hover:text-slate-250 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* Code */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-600 dark:text-slate-400 font-bold">
                  Identificador / Código:
                </label>
                <input
                  type="text"
                  value={defCode}
                  onChange={(e) => setDefCode(e.target.value)}
                  placeholder="Ex: AL-301"
                  className="w-full px-3 py-2 border rounded-lg text-xs font-mono font-bold bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-600 dark:text-slate-400 font-bold">
                  Nome do Alerta:
                </label>
                <input
                  type="text"
                  value={defName}
                  onChange={(e) => setDefName(e.target.value)}
                  placeholder="Ex: TTL Alto Parque de Nafta"
                  className="w-full px-3 py-2 border rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>

              {/* Preset Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-600 dark:text-slate-400 font-bold">
                  Regra Preset (Modelo):
                </label>
                <select
                  value={defRuleId}
                  onChange={(e) => setDefRuleId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-semibold">
                  <option value="">Selecione um preset...</option>
                  {rules.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Area Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-600 dark:text-slate-400 font-bold">
                  Área Operacional Responsável:
                </label>
                <select
                  value={defAreaId}
                  onChange={(e) => setDefAreaId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-semibold">
                  <option value="">Selecione uma área...</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} — {a.name.split(" — ")[1] || a.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Object Selection (Tanks/Equipment) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-600 dark:text-slate-400 font-bold">
                  Tanque/Equipamento Alvo (Opcional):
                </label>
                <select
                  value={defTargetObjectId}
                  onChange={(e) => setDefTargetObjectId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-semibold">
                  <option value="">Todos os tanques da área</option>
                  {filteredTanks.map((obj) => (
                    <option key={obj.id} value={obj.id}>
                      {obj.name} ({obj.description})
                    </option>
                  ))}
                </select>
              </div>

              {/* Enabled toggle */}
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-650 dark:text-slate-400 font-bold">
                  Habilitado desde a criação:
                </span>
                <button
                  type="button"
                  onClick={() => setDefEnabled(!defEnabled)}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    defEnabled
                      ? "bg-emerald-500"
                      : "bg-slate-200 dark:bg-slate-800",
                  )}>
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                      defEnabled ? "translate-x-4" : "translate-x-0",
                    )}
                  />
                </button>
              </div>

              {/* Preset Parameter Override Section */}
              {(() => {
                const selectedRule = rules.find((r) => r.id === defRuleId);
                if (!selectedRule || !selectedRule.params || Object.keys(selectedRule.params).length === 0) {
                  return null;
                }

                return (
                  <div className="border-t border-slate-150 dark:border-slate-800 pt-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-700 dark:text-slate-300 font-bold flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={defOverrideParams}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setDefOverrideParams(checked);
                            if (checked && Object.keys(defCustomParams).length === 0 && selectedRule.params) {
                              setDefCustomParams({ ...selectedRule.params });
                            }
                          }}
                          className="rounded border-slate-300 dark:border-slate-700 text-sky-500 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                        />
                        Sobrescrever valor de referência do preset
                      </label>
                    </div>

                    {defOverrideParams && (
                      <div className="pl-6 space-y-3 pt-1 bg-slate-50/50 dark:bg-slate-950/30 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                        {Object.keys(selectedRule.params).map((paramKey) => {
                          const defaultVal = selectedRule.params[paramKey];
                          const currentVal =
                            defCustomParams[paramKey] !== undefined
                              ? defCustomParams[paramKey]
                              : defaultVal;
                          const labelText = getParamLabel(paramKey);

                          return (
                            <div key={paramKey} className="flex flex-col gap-1">
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                  {labelText}:
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  (Preset padrão: {defaultVal})
                                </span>
                              </div>
                              <input
                                type="number"
                                value={currentVal}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  setDefCustomParams((prev) => ({
                                    ...prev,
                                    [paramKey]: isNaN(val) ? 0 : val,
                                  }));
                                }}
                                className="w-full px-3 py-1.5 border rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/20 border-t border-slate-150 dark:border-slate-800 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => {
                  setIsDefModalOpen(false);
                  setEditingDefId(null);
                }}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-350 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl cursor-pointer text-xs">
                Cancelar
              </button>
              <button
                onClick={handleSaveDefinition}
                disabled={!defCode || !defName || !defRuleId || !defAreaId}
                className={cn(
                  "px-4 py-2 text-white font-bold rounded-xl cursor-pointer text-xs transition-colors",
                  !defCode || !defName || !defRuleId || !defAreaId
                    ? "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed border dark:border-slate-800"
                    : "bg-sky-500 hover:bg-sky-600",
                )}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
