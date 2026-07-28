# Graph Report - MVP 2  (2026-07-28)

## Corpus Check
- 171 files · ~190,315 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 984 nodes · 2778 edges · 44 communities (34 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9af35ac0`
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
- [[_COMMUNITY_Community 44|Community 44]]

## God Nodes (most connected - your core abstractions)
1. `useObjectModelStore` - 84 edges
2. `cn()` - 74 edges
3. `useOmmStore` - 54 edges
4. `useWidgetStore` - 31 edges
5. `useConnectivityStore` - 27 edges
6. `useFlowStore` - 23 edges
7. `ObjectEntity` - 22 edges
8. `HeaderNavigation()` - 21 edges
9. `OmmStoreActions` - 21 edges
10. `InheritanceService` - 21 edges

## Surprising Connections (you probably didn't know these)
- `OpcBrowserPage()` --calls--> `getNodeIcon()`  [INFERRED]
  src/pages/OpcBrowserPage.tsx → src/features/flow-v2/nodes/FlowCardNode.tsx
- `HistoryConfigModal()` --calls--> `Field()`  [INFERRED]
  src/features/object-model/HistoryConfigModal.tsx → src/features/omm/components/detail/tabs/GeneralTab.tsx
- `App()` --calls--> `useObjectModelStore`  [EXTRACTED]
  src/App.tsx → src/store/useObjectModelStore.ts
- `PropertySelectorModal()` --calls--> `useObjectModelStore`  [EXTRACTED]
  src/features/flow-designer/NodePropertyInspector.tsx → src/store/useObjectModelStore.ts
- `FlowV2EditorContent()` --calls--> `useFlowStore`  [EXTRACTED]
  src/features/flow-v2/components/FlowV2EditorModal.tsx → src/store/useFlowStore.ts

## Import Cycles
- 3-file cycle: `src/features/widget-editor/Dynamics/FillDynamicEditor.tsx -> src/features/widget-editor/WidgetInspectorPanel.tsx -> src/features/widget-editor/Dynamics/StrokeDynamicEditor.tsx -> src/features/widget-editor/Dynamics/FillDynamicEditor.tsx`

## Communities (44 total, 10 thin omitted)

### Community 1 - "Community 1"
Cohesion: 0.16
Nodes (18): FillDynamicEditor(), FillDynamicEditorProps, FillLevelDynamicEditor(), FillLevelDynamicEditorProps, StrokeDynamicEditor(), StrokeDynamicEditorProps, validateDynamicRule(), ValidationError (+10 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (37): dependencies, bpmn-js, clsx, dayjs, @hookform/resolvers, immer, lucide-react, react (+29 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (39): alarmRepo, alignmentRepo, areaRepo, auditRepo, clearAllOmmData(), cutoffRepo, defaultSimState, engUnitRepo (+31 more)

### Community 4 - "Community 4"
Cohesion: 0.22
Nodes (12): widgetFolderRepo, WidgetFolderRepository, WidgetSeedService, InspectorTabType, ToolType, WidgetStoreState, WidgetCustomPropertyDataType, WidgetElement (+4 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 6 - "Community 6"
Cohesion: 0.17
Nodes (15): AlarmConfigModal(), CentralEditor(), ExportImportModal(), DEFAULT_CONFIG, HistoryConfigModal(), msToHours(), PropertiesTable(), PropertyFormData (+7 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (26): AdminPanel(), OmmLayout(), VIEW_TABS, DetailPanel(), KpiCardProps, OmmKpiHeader(), GROUP_BY_OPTIONS, GroupByOption (+18 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 9 - "Community 9"
Cohesion: 0.10
Nodes (21): INDUSTRIAL_NODES, IndustrialPaletteSidebarProps, COMPARISON_OPERATORS, PRESET_COLORS, PropertySelectorModal(), PropertySelectorProps, propertyRepo, FlowValidationEngine (+13 more)

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (27): ACTIONS, MODULES, PermissionMatrixView(), UserModal(), UserModalProps, SecurityPage(), DEFAULT_AUDITS, DEFAULT_GROUPS (+19 more)

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 15 - "Community 15"
Cohesion: 0.13
Nodes (13): screenFolderRepo, ScreenStoreState, ScreenToolType, AlarmConditionType, FillLevelConfig, PropertyAlarmConfig, ScreenElement, ScreenElementType (+5 more)

### Community 16 - "Community 16"
Cohesion: 0.08
Nodes (29): TabConfig, TABS, DEFAULT_VISIBLE_COLUMNS, movementColumnDefs, PriorityCellSelector(), StatusCellSelector(), TypeCellSelector(), AlarmsTab() (+21 more)

### Community 17 - "Community 17"
Cohesion: 0.29
Nodes (5): CutoffStatus, OmmCutoffSnapshot, CompareViewProps, CutoffCardProps, STATUS_CONFIG

### Community 18 - "Community 18"
Cohesion: 0.09
Nodes (31): AdminSection, Column, CrudTableProps, EditModalProps, FieldDef, SECTIONS, OmmStoreActions, EquipmentsTab() (+23 more)

### Community 20 - "Community 20"
Cohesion: 0.10
Nodes (18): ConditionNodeEditor(), ConditionNodeEditorProps, AlarmRepository, eventRepo, EventRepository, EventEngine, AlarmEvent, ActionType (+10 more)

### Community 21 - "Community 21"
Cohesion: 0.14
Nodes (16): BpmnCanvasProps, COLOR_MAP, ICON_MAP, DeploymentTree(), DerivationTree(), DeploymentRepository, mapIndustrialTypeToBpmnType(), DeploymentFolderEntity (+8 more)

### Community 23 - "Community 23"
Cohesion: 0.22
Nodes (10): ScreenLayout(), ScreenCanvasEditor(), WidgetInstanceRenderer(), ScreenElementInspector(), ExplorerTab, ScreenExplorerPanel(), ContextMenuState, RenameState (+2 more)

### Community 24 - "Community 24"
Cohesion: 0.27
Nodes (8): opcRepo, OpcRepository, OpcStoreState, OpcConnectorInterface, OpcDataType, OpcNodeEntity, OpcNodeType, OpcQuality

### Community 25 - "Community 25"
Cohesion: 0.13
Nodes (10): OmmSimulationEngine, simulateWaveform(), EVENT_ICONS, EventItem(), HistoryTab(), SEVERITY_STYLES, SIM_MODES, SimulationTab() (+2 more)

### Community 27 - "Community 27"
Cohesion: 0.05
Nodes (55): AnalyticsTab(), ConnectionDesignerTab(), CustomFlowNode, nodeIcons, categoryIcons, DataSourcesTab(), BlockDefinition, FlowBlockLibrary() (+47 more)

### Community 28 - "Community 28"
Cohesion: 0.13
Nodes (14): HeaderNavigationProps, KpiDashboardPage(), PREDEFINED_METRICS, CustomKpi, DEFAULT_WIDGETS, KpiFilter, KpiStore, KpiStoreActions (+6 more)

### Community 30 - "Community 30"
Cohesion: 0.32
Nodes (4): ObjectRepository, AlarmEngine, AlarmRule, ObjectEntity

### Community 31 - "Community 31"
Cohesion: 0.08
Nodes (36): edgeTypes, FlowV2Canvas(), FlowV2CanvasProps, nodeTypes, FlowV2EditorContent(), FlowV2EditorModal(), FlowV2InspectorPanel(), FlowV2InspectorPanelProps (+28 more)

### Community 32 - "Community 32"
Cohesion: 0.13
Nodes (14): HeaderNavigation(), AlarmViewerPage(), DatabasePage(), DB_TABLES, DbTable, EventEnginePage(), HistorianPage(), OmmPage() (+6 more)

### Community 33 - "Community 33"
Cohesion: 0.23
Nodes (10): RuntimeWidgetInstance(), extractPropertyName(), FillLevelStyle, resolveColorDynamic(), resolveCustomPropValue(), ResolvedWidgetElementStyle, resolveFillLevelDynamic(), resolveVisibilityDynamic() (+2 more)

### Community 34 - "Community 34"
Cohesion: 0.14
Nodes (16): GlobalPropertyPickerModalProps, alarmRepo, associatedWidgetRepo, deploymentRepo, flowchartRepo, mockConfigRepo, objectRepo, screenRepo (+8 more)

### Community 35 - "Community 35"
Cohesion: 0.11
Nodes (14): CHART_PADDING, ChartData, CURVE_COLORS, PeriodPreset, SelectedVariable, TrendChart(), TrendChartProps, historyEngine (+6 more)

### Community 36 - "Community 36"
Cohesion: 0.21
Nodes (14): FlowV2Header(), FlowV2HeaderProps, BpmnCanvas(), FlowDesignerModal(), IndustrialPaletteSidebar(), NodePropertyInspector(), ProblemsPanel(), MockConfigModal() (+6 more)

### Community 37 - "Community 37"
Cohesion: 0.23
Nodes (12): WidgetMappingModalProps, ObjectPropertySimRow, InheritanceService, MockSimulationService, ObjectModelStoreState, EntityType, MergedAssociatedWidget, MergedProperty (+4 more)

### Community 38 - "Community 38"
Cohesion: 0.38
Nodes (4): IDELayout(), OrchestraPage(), ResizableSplitPane(), ResizableSplitPaneProps

### Community 40 - "Community 40"
Cohesion: 0.13
Nodes (16): GlobalPropertyPickerModal(), WidgetLayout(), AssociatedWidgetsEditor(), WidgetThumbnail(), WidgetMappingModal(), WidgetsPage(), buildTree(), useWidgetStore (+8 more)

### Community 42 - "Community 42"
Cohesion: 0.29
Nodes (6): ALL_TRIGGERS, EXPRESSION_TRIGGERS, LOOP_TRIGGERS, ScriptFormData, TRIGGER_LABELS, ScriptTrigger

## Knowledge Gaps
- **211 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `name` (+206 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useObjectModelStore` connect `Community 6` to `Community 32`, `Community 33`, `Community 34`, `Community 35`, `Community 36`, `Community 38`, `Community 40`, `Community 9`, `Community 42`, `Community 11`, `Community 15`, `Community 20`, `Community 21`, `Community 23`, `Community 27`, `Community 28`, `Community 31`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Why does `useOmmStore` connect `Community 7` to `Community 3`, `Community 16`, `Community 17`, `Community 18`, `Community 20`, `Community 25`, `Community 28`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Why does `cn()` connect `Community 36` to `Community 32`, `Community 1`, `Community 34`, `Community 35`, `Community 38`, `Community 6`, `Community 40`, `Community 9`, `Community 15`, `Community 21`, `Community 23`, `Community 24`, `Community 28`, `Community 31`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _211 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.11205073995771671 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._