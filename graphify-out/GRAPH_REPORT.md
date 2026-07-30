# Graph Report - MVP 2  (2026-07-30)

## Corpus Check
- 173 files · ~201,422 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1009 nodes · 2845 edges · 54 communities (45 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0d33348c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]

## God Nodes (most connected - your core abstractions)
1. `useObjectModelStore` - 84 edges
2. `cn()` - 74 edges
3. `useOmmStore` - 54 edges
4. `useWidgetStore` - 31 edges
5. `useConnectivityStore` - 28 edges
6. `useFlowStore` - 23 edges
7. `ObjectEntity` - 22 edges
8. `HeaderNavigation()` - 21 edges
9. `OmmStoreActions` - 21 edges
10. `STORAGE_KEYS` - 21 edges

## Surprising Connections (you probably didn't know these)
- `OpcBrowserPage()` --calls--> `getNodeIcon()`  [INFERRED]
  src/pages/OpcBrowserPage.tsx → src/features/flow-v2/nodes/FlowCardNode.tsx
- `GlobalVariablesTab()` --calls--> `useConnectivityStore`  [EXTRACTED]
  src/features/connectivity/GlobalVariablesTab.tsx → src/store/useConnectivityStore.ts
- `SchedulerTab()` --calls--> `useConnectivityStore`  [EXTRACTED]
  src/features/connectivity/SchedulerTab.tsx → src/store/useConnectivityStore.ts
- `IndustrialNodeDef` --references--> `IndustrialNodeType`  [EXTRACTED]
  src/features/flow-designer/IndustrialPaletteSidebar.tsx → src/types/flow.ts
- `PropertySelectorModal()` --calls--> `useObjectModelStore`  [EXTRACTED]
  src/features/flow-designer/NodePropertyInspector.tsx → src/store/useObjectModelStore.ts

## Import Cycles
- 3-file cycle: `src/features/widget-editor/Dynamics/FillDynamicEditor.tsx -> src/features/widget-editor/WidgetInspectorPanel.tsx -> src/features/widget-editor/Dynamics/StrokeDynamicEditor.tsx -> src/features/widget-editor/Dynamics/FillDynamicEditor.tsx`

## Communities (54 total, 9 thin omitted)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (27): FillDynamicEditor(), FillDynamicEditorProps, FillLevelDynamicEditor(), FillLevelDynamicEditorProps, StrokeDynamicEditor(), StrokeDynamicEditorProps, validateDynamicRule(), ValidationError (+19 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (37): dependencies, bpmn-js, clsx, dayjs, @hookform/resolvers, immer, lucide-react, react (+29 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (47): alarmRepo, alignmentRepo, areaRepo, auditRepo, clearAllOmmData(), cutoffRepo, defaultSimState, engUnitRepo (+39 more)

### Community 4 - "Community 4"
Cohesion: 0.42
Nodes (3): DeploymentRepository, DeploymentFolderEntity, DeploymentNodeEntity

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 6 - "Community 6"
Cohesion: 0.25
Nodes (7): ALL_TRIGGERS, EXPRESSION_TRIGGERS, LOOP_TRIGGERS, ScriptFormData, ScriptModal(), TRIGGER_LABELS, ScriptTrigger

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (20): OmmLayout(), VIEW_TABS, KpiCardProps, OmmKpiHeader(), GROUP_BY_OPTIONS, GroupByOption, OmmToolbar(), ToolbarButtonProps (+12 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (19): INDUSTRIAL_NODES, IndustrialNodeDef, IndustrialPaletteSidebarProps, COMPARISON_OPERATORS, PRESET_COLORS, PropertySelectorModal(), PropertySelectorProps, FlowValidationEngine (+11 more)

### Community 10 - "Community 10"
Cohesion: 0.28
Nodes (9): FlowV2CanvasProps, FlowV2InspectorPanelProps, FlowV2PropertyInspector(), FlowV2PropertyInspectorProps, TabType, FlowV2SimulationEngine, SimulationStepResult, FlowEdgeV2 (+1 more)

### Community 11 - "Community 11"
Cohesion: 0.13
Nodes (22): ACTIONS, MODULES, DEFAULT_AUDITS, DEFAULT_GROUPS, DEFAULT_PROFILES, DEFAULT_ROLES, DEFAULT_USERS, MODULE_LIST (+14 more)

### Community 12 - "Community 12"
Cohesion: 0.14
Nodes (16): AlarmConfigModal(), RuntimeWidgetInstance(), ContextMenuState, RenameState, ScreenStoreState, ScreenToolType, AlarmConditionType, FillLevelConfig (+8 more)

### Community 15 - "Community 15"
Cohesion: 0.13
Nodes (11): ScreenLayout(), OpcBrowserPage(), ScreenDesignerPage(), ScreenCanvasEditor(), WidgetInstanceRenderer(), ScreenElementInspector(), ExplorerTab, ScreenExplorerPanel() (+3 more)

### Community 16 - "Community 16"
Cohesion: 0.07
Nodes (30): DetailPanel(), TabConfig, TABS, useOmmStore, PriorityCellSelector(), StatusCellSelector(), TypeCellSelector(), AlarmsTab() (+22 more)

### Community 17 - "Community 17"
Cohesion: 0.25
Nodes (6): CutoffStatus, OmmCutoffSnapshot, CompareViewProps, CutoffCardProps, CutoffHistory(), STATUS_CONFIG

### Community 18 - "Community 18"
Cohesion: 0.20
Nodes (7): AdminPanel(), AdminSection, Column, CrudTableProps, EditModalProps, FieldDef, SECTIONS

### Community 20 - "Community 20"
Cohesion: 0.09
Nodes (18): AlarmRepository, eventRepo, EventRepository, ObjectRepository, EventEngine, AlarmEvent, ObjectEntity, ActionType (+10 more)

### Community 21 - "Community 21"
Cohesion: 0.22
Nodes (12): IDELayout(), CentralEditor(), DeploymentTree(), DerivationTree(), OrchestraPage(), DeploymentTreeNode, DerivationTreeNode, ContextMenu() (+4 more)

### Community 23 - "Community 23"
Cohesion: 0.20
Nodes (13): FlowV2EditorModal(), FlowV2InspectorPanel(), FlowV2Palette(), FlowV2PaletteProps, PALETTE_ITEMS, PaletteItem, simulationEngine, IndustrialNodeType (+5 more)

### Community 24 - "Community 24"
Cohesion: 0.30
Nodes (7): OpcRepository, OpcStoreState, OpcConnectorInterface, OpcDataType, OpcNodeEntity, OpcNodeType, OpcQuality

### Community 25 - "Community 25"
Cohesion: 0.24
Nodes (5): OmmSimulationEngine, simulateWaveform(), OmmEvent, OmmMovement, OmmSimulatorState

### Community 27 - "Community 27"
Cohesion: 0.11
Nodes (17): CustomFlowNode, nodeIcons, BlockDefinition, FlowBlockLibrary(), FlowBlockLibraryProps, INDUSTRIAL_BLOCKS, edgeTypes, FloatingImmersiveBarProps (+9 more)

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (8): CustomKpi, DEFAULT_WIDGETS, KpiFilter, KpiStore, KpiStoreActions, KpiStoreState, KpiWidget, STORAGE_KEYS

### Community 29 - "Community 29"
Cohesion: 0.08
Nodes (22): ActiveDirectoryActions, ActiveDirectoryState, ActiveDirectoryStore, ADAdvancedSettings, ADComputer, ADConnectionConfig, ADGroup, ADGroupMapping (+14 more)

### Community 30 - "Community 30"
Cohesion: 0.22
Nodes (12): widgetFolderRepo, WidgetFolderRepository, WidgetSeedService, InspectorTabType, ToolType, WidgetStoreState, WidgetCustomPropertyDataType, WidgetElement (+4 more)

### Community 31 - "Community 31"
Cohesion: 0.15
Nodes (13): edgeTypes, FlowV2Canvas(), nodeTypes, AnimatedFlowEdge, ContainerNode, FlowCardNode, getNodeIcon(), StickyNoteNode (+5 more)

### Community 32 - "Community 32"
Cohesion: 0.18
Nodes (15): AlarmViewerPage(), ConditionNodeEditor(), ConditionNodeEditorProps, EventEnginePage(), HistorianPage(), KpiDashboardPage(), PREDEFINED_METRICS, OmmPage() (+7 more)

### Community 33 - "Community 33"
Cohesion: 0.14
Nodes (14): GlobalPropertyPickerModal(), WidgetLayout(), WidgetsPage(), buildTree(), useWidgetStore, WidgetBindingProperty, ResizableSplitPane(), ResizableSplitPaneProps (+6 more)

### Community 34 - "Community 34"
Cohesion: 0.13
Nodes (16): alarmRepo, associatedWidgetRepo, deploymentRepo, flowchartRepo, mockConfigRepo, objectRepo, opcRepo, propertyRepo (+8 more)

### Community 35 - "Community 35"
Cohesion: 0.09
Nodes (18): DEFAULT_CONFIG, HistoryConfigModal(), msToHours(), CHART_PADDING, ChartData, CURVE_COLORS, PeriodPreset, SelectedVariable (+10 more)

### Community 36 - "Community 36"
Cohesion: 0.15
Nodes (14): FlowV2EditorContent(), FlowV2Header(), FlowV2HeaderProps, BpmnCanvas(), BpmnCanvasProps, COLOR_MAP, ICON_MAP, FlowDesignerModal() (+6 more)

### Community 37 - "Community 37"
Cohesion: 0.20
Nodes (14): DEFAULT_VISIBLE_COLUMNS, movementColumnDefs, FieldProps, MovementRow, AccuracyBar(), FlowDisplay(), PRIORITY_CONFIG, PriorityBadge() (+6 more)

### Community 38 - "Community 38"
Cohesion: 0.21
Nodes (11): AnalyticsTab(), ConnectionDesignerTab(), FlowDesignerContent(), FlowDesignerTab(), LogsTab(), MessageInspectorTab(), SecretsVaultTab(), ConnectivityStudioPage() (+3 more)

### Community 39 - "Community 39"
Cohesion: 0.32
Nodes (10): WidgetMappingModalProps, ObjectPropertySimRow, InheritanceService, ObjectModelStoreState, EntityType, MergedAssociatedWidget, MergedProperty, MergedScript (+2 more)

### Community 40 - "Community 40"
Cohesion: 0.16
Nodes (15): AssociatedWidgetsEditor(), WidgetThumbnail(), ExportImportModal(), MockConfigModal(), PRESET_OPTIONS, PropertiesTable(), PropertyFormData, PropertyModal() (+7 more)

### Community 41 - "Community 41"
Cohesion: 0.29
Nodes (5): MockConfigRepository, MockSimulationService, MockConfig, MockConfigParams, MockPresetType

### Community 42 - "Community 42"
Cohesion: 0.16
Nodes (14): categoryIcons, DataSourcesTab(), ConnectionCategory, ConnectionEnvironment, ConnectionStatus, ConnectionType, ConnectivityConnection, FlowCategory (+6 more)

### Community 43 - "Community 43"
Cohesion: 0.17
Nodes (5): ConnectivityStoreState, ConnectivityFlow, ConnectivityFolder, ConnectivityMessageTrace, ConnectivitySecret

### Community 44 - "Community 44"
Cohesion: 0.19
Nodes (9): GlobalVariablesTab(), SchedulerTab(), UniversalMappingTab(), ConnectivityGlobalVariable, ConnectivityMappingRule, ConnectivitySchedule, ScheduleTriggerType, Modal() (+1 more)

### Community 45 - "Community 45"
Cohesion: 0.31
Nodes (5): HeaderNavigation(), HeaderNavigationProps, DatabasePage(), DB_TABLES, DbTable

### Community 46 - "Community 46"
Cohesion: 0.40
Nodes (7): ActiveDirectoryTab(), PermissionMatrixView(), UserModal(), UserModalProps, SecurityPage(), useActiveDirectoryStore, useSecurityStore

### Community 48 - "Community 48"
Cohesion: 0.29
Nodes (10): markOmmSeeded(), hoursAgo(), hoursFromNow(), makeAlignments(), makeEquipments(), makeMovement(), movNum(), nextCutoff() (+2 more)

### Community 49 - "Community 49"
Cohesion: 0.33
Nodes (4): GlobalPropertyPickerModalProps, IndexedProperty, PropertyBrowserService, DataType

### Community 52 - "Community 52"
Cohesion: 0.67
Nodes (3): ExportImportService, ExportDataPayload, FlowchartEntity

## Knowledge Gaps
- **229 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+224 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useObjectModelStore` connect `Community 32` to `Community 33`, `Community 34`, `Community 35`, `Community 36`, `Community 6`, `Community 39`, `Community 40`, `Community 9`, `Community 10`, `Community 44`, `Community 45`, `Community 12`, `Community 15`, `Community 46`, `Community 49`, `Community 20`, `Community 21`, `Community 31`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Why does `useOmmStore` connect `Community 16` to `Community 32`, `Community 3`, `Community 37`, `Community 7`, `Community 17`, `Community 18`, `Community 20`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `cn()` connect `Community 40` to `Community 32`, `Community 33`, `Community 1`, `Community 35`, `Community 36`, `Community 39`, `Community 9`, `Community 10`, `Community 12`, `Community 45`, `Community 44`, `Community 15`, `Community 49`, `Community 21`, `Community 23`, `Community 24`, `Community 31`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _229 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.10960960960960961 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.10957910014513789 - nodes in this community are weakly interconnected._