# Graph Report - MVP 2  (2026-08-12)

## Corpus Check
- 190 files · ~222,743 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1174 nodes · 3320 edges · 40 communities (36 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `91af8941`
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
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 94 edges
2. `useObjectModelStore` - 87 edges
3. `useOmmStore` - 55 edges
4. `useConnectivityStore` - 27 edges
5. `InheritanceService` - 25 edges
6. `useWidgetStore` - 25 edges
7. `safeSetItem()` - 25 edges
8. `STORAGE_KEYS` - 23 edges
9. `ObjectEntity` - 23 edges
10. `HeaderNavigation()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `WidgetThumbnail()` --calls--> `cn()`  [EXTRACTED]
  src/features/object-model/AssociatedWidgetsEditor.tsx → src/utils/cn.ts
- `InteractiveDiagramCanvas()` --calls--> `useOmmStore`  [EXTRACTED]
  src/features/omm/components/detail/TankFlowVisualizer.tsx → src/features/omm/store/useOmmStore.ts
- `PlantFlowCanvas()` --calls--> `useOmmStore`  [EXTRACTED]
  src/features/omm/components/views/PlantOverview.tsx → src/features/omm/store/useOmmStore.ts
- `ToolButton()` --calls--> `cn()`  [EXTRACTED]
  src/features/widget-editor/WidgetCanvasEditor.tsx → src/utils/cn.ts
- `DataTypeBadge()` --calls--> `cn()`  [EXTRACTED]
  src/features/widget-editor/WidgetInspectorPanel.tsx → src/utils/cn.ts

## Import Cycles
- 3-file cycle: `src/features/widget-editor/Dynamics/FillDynamicEditor.tsx -> src/features/widget-editor/WidgetInspectorPanel.tsx -> src/features/widget-editor/Dynamics/StrokeDynamicEditor.tsx -> src/features/widget-editor/Dynamics/FillDynamicEditor.tsx`

## Communities (40 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.19
Nodes (14): widgetFolderRepo, WidgetFolderRepository, widgetRepo, WidgetInstanceRenderer(), WidgetSeedService, InspectorTabType, ToolType, WidgetStoreState (+6 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (53): AnalyticsTab(), ConnectionDesignerTab(), CustomFlowNode, nodeIcons, categoryIcons, DataSourcesTab(), BlockDefinition, FlowBlockLibrary() (+45 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (41): OmmLayout(), VIEW_TABS, KpiCardProps, OmmKpiHeader(), GROUP_BY_OPTIONS, GroupByOption, OmmToolbar(), ToolbarButton() (+33 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (37): dependencies, bpmn-js, clsx, dayjs, @hookform/resolvers, immer, lucide-react, react (+29 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (48): alarmRepo, alignmentRepo, areaRepo, auditRepo, clearAllOmmData(), cutoffRepo, defaultSimState, engUnitRepo (+40 more)

### Community 5 - "Community 5"
Cohesion: 0.14
Nodes (16): AssociatedWidgetsEditor(), WidgetThumbnail(), DerivationTree(), WidgetMappingModal(), WidgetMappingModalProps, AlarmConditionType, DerivationTreeNode, FillLevelConfig (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (15): HeaderNavigation(), FlowsV2Page(), GridDashboardPage(), HomePage(), LoginPage(), OmmPage(), ProcessAlertsPage(), ToastContainer() (+7 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (52): ActiveDirectoryTab(), ACTIONS, MODULES, PermissionMatrixView(), UserModal(), UserModalProps, SecurityPage(), ActiveDirectoryActions (+44 more)

### Community 8 - "Community 8"
Cohesion: 0.20
Nodes (18): ObjectSelectorModal(), ObjectSelectorModalProps, AlarmConfigModal(), CentralEditor(), EquipmentGraphicConfigEditor(), ExportImportModal(), MockConfigModal(), PRESET_OPTIONS (+10 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (17): DEFAULT_CONFIG, DEFAULT_FIELD_BINDINGS, GEOMETRY_OPTIONS, getFillColor(), PROPERTY_UNITS, activeEvents, currentConfig, id (+9 more)

### Community 10 - "Community 10"
Cohesion: 0.06
Nodes (52): edgeTypes, FlowV2Canvas(), FlowV2CanvasProps, nodeTypes, FlowV2EditorContent(), FlowV2EditorModal(), FlowV2Header(), FlowV2HeaderProps (+44 more)

### Community 11 - "Community 11"
Cohesion: 0.26
Nodes (7): historyRepo, movementRepo, OmmSimulationEngine, simulateWaveform(), OmmEvent, OmmMovement, OmmSimulatorState

### Community 12 - "Community 12"
Cohesion: 0.43
Nodes (5): UniversalMappingTab(), getNodeIcon(), OpcBrowserPage(), App(), useOpcStore

### Community 13 - "Community 13"
Cohesion: 0.27
Nodes (8): IDELayout(), DeploymentTree(), OrchestraPage(), DeploymentTreeNode, ContextMenu(), ContextMenuItem, ContextMenuProps, buildDeploymentTree()

### Community 14 - "Community 14"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 15 - "Community 15"
Cohesion: 0.17
Nodes (8): AdminEditModalProps, AdminPanel(), AdminSection, Column, CrudTableProps, EditModalProps, FieldDef, SECTIONS

### Community 17 - "Community 17"
Cohesion: 0.20
Nodes (8): RuntimePage(), SavedView, historyEngine, MiniTrendChart(), MiniTrendChartProps, TankTelemetryDashboard(), TankTelemetryDashboardProps, VariableHistory

### Community 18 - "Community 18"
Cohesion: 0.05
Nodes (44): GlobalPropertyPickerModal(), GlobalPropertyPickerModalProps, CurveChartProps, DEFAULT_STRAPPING, GEOMETRY_CURVE_NOTES, GEOMETRY_LABELS, ObjectPropertySimRow, associatedWidgetRepo (+36 more)

### Community 19 - "Community 19"
Cohesion: 0.30
Nodes (8): opcRepo, OpcRepository, OpcStoreState, OpcConnectorInterface, OpcDataType, OpcNodeEntity, OpcNodeType, OpcQuality

### Community 20 - "Community 20"
Cohesion: 0.09
Nodes (24): TankGeometrySvg(), edgeTypes, InteractiveDiagramCanvas(), nodeTypes, TankFlowVisualizer(), TankFlowVisualizerProps, OmmFlowEdge, OmmFlowEdgeData (+16 more)

### Community 21 - "Community 21"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 22 - "Community 22"
Cohesion: 0.17
Nodes (11): ActionType, ActiveEventState, ConditionNode, EventAction, EventConfig, EventHistoryLog, LeafCondition, LeafConditionType (+3 more)

### Community 25 - "Community 25"
Cohesion: 0.21
Nodes (8): PropertyFormData, propertySchema, DatabaseAnalyticsPage(), DBHistoryPoint, PerformanceHistoryPoint, TableStats, Modal(), ModalProps

### Community 27 - "Community 27"
Cohesion: 0.26
Nodes (3): BaseRepository, SingletonRepository, if()

### Community 28 - "Community 28"
Cohesion: 0.22
Nodes (8): CHART_PADDING, ChartData, CURVE_COLORS, PeriodPreset, SelectedVariable, TrendChart(), TrendChartProps, HistorySample

### Community 30 - "Community 30"
Cohesion: 0.09
Nodes (18): objectRepo, OmmPriority, ModalTab, MovementModal(), PRIORITY_OPTIONS, STATUS_COLORS, STATUS_LABELS, TABS (+10 more)

### Community 32 - "Community 32"
Cohesion: 0.16
Nodes (18): FillDynamicEditor(), FillDynamicEditorProps, FillLevelDynamicEditor(), FillLevelDynamicEditorProps, StrokeDynamicEditor(), StrokeDynamicEditorProps, validateDynamicRule(), ValidationError (+10 more)

### Community 35 - "Community 35"
Cohesion: 0.05
Nodes (39): LogsPage(), alarmRepo, AlarmRepository, ObjectRepository, processAlertRepo, ProcessAlertRepository, PropertyRepository, STORAGE_KEYS (+31 more)

### Community 36 - "Community 36"
Cohesion: 0.10
Nodes (18): ScreenLayout(), ScreenDesignerPage(), screenFolderRepo, ScreenCanvasEditor(), ScreenElementInspector(), ExplorerTab, ScreenExplorerPanel(), ContextMenuState (+10 more)

### Community 40 - "Community 40"
Cohesion: 0.12
Nodes (10): DEFAULT_CONFIG, HistoryConfigModal(), msToHours(), lastRecordedAt, lastRecordedValue, monitoredKeys, pendingPersist, Store (+2 more)

### Community 44 - "Community 44"
Cohesion: 0.06
Nodes (50): CellPos, GridCanvas(), GridCanvasProps, GridCardInspector(), GridCardInspectorProps, GridDashboardHeader(), GridDashboardHeaderProps, GridScreenManagerModal() (+42 more)

### Community 47 - "Community 47"
Cohesion: 0.16
Nodes (12): RuntimeWidgetInstance(), ScreenRuntimePage(), screenRepo, extractPropertyName(), FillLevelStyle, resolveColorDynamic(), resolveCustomPropValue(), ResolvedWidgetElementStyle (+4 more)

### Community 49 - "Community 49"
Cohesion: 0.22
Nodes (6): CutoffStatus, OmmCutoffSnapshot, CompareViewProps, CutoffCardProps, CutoffHistory(), STATUS_CONFIG

### Community 51 - "Community 51"
Cohesion: 0.25
Nodes (11): markOmmSeeded(), hoursAgo(), hoursFromNow(), makeAlignments(), makeEquipments(), makeMovement(), movNum(), nextCutoff() (+3 more)

### Community 52 - "Community 52"
Cohesion: 0.17
Nodes (12): WidgetLayout(), WidgetsPage(), buildTree(), useWidgetStore, ResizableSplitPane(), ResizableSplitPaneProps, ToolButton(), ToolButtonProps (+4 more)

## Knowledge Gaps
- **279 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+274 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 8` to `Community 32`, `Community 35`, `Community 36`, `Community 5`, `Community 6`, `Community 40`, `Community 9`, `Community 10`, `Community 44`, `Community 13`, `Community 12`, `Community 17`, `Community 18`, `Community 20`, `Community 52`, `Community 25`, `Community 28`, `Community 30`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `useObjectModelStore` connect `Community 8` to `Community 36`, `Community 5`, `Community 6`, `Community 7`, `Community 40`, `Community 9`, `Community 10`, `Community 44`, `Community 13`, `Community 12`, `Community 47`, `Community 17`, `Community 18`, `Community 25`, `Community 28`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `useOmmStore` connect `Community 2` to `Community 4`, `Community 6`, `Community 8`, `Community 9`, `Community 44`, `Community 15`, `Community 17`, `Community 49`, `Community 20`, `Community 30`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _279 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05348101265822785 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06077694235588972 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._