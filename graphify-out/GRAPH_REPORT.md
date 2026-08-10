# Graph Report - MVP 2  (2026-08-10)

## Corpus Check
- 177 files · ~199,684 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1087 nodes · 3052 edges · 45 communities (38 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7db89cc6`
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
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 86 edges
2. `useObjectModelStore` - 77 edges
3. `useOmmStore` - 44 edges
4. `useConnectivityStore` - 27 edges
5. `InheritanceService` - 25 edges
6. `useWidgetStore` - 25 edges
7. `STORAGE_KEYS` - 23 edges
8. `OmmStoreActions` - 21 edges
9. `ObjectModelStoreState` - 21 edges
10. `safeSetItem()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `OpcBrowserPage()` --calls--> `getNodeIcon()`  [INFERRED]
  src/pages/OpcBrowserPage.tsx → src/features/flow-v2/nodes/FlowCardNode.tsx
- `InteractiveDiagramCanvas()` --calls--> `useOmmStore`  [EXTRACTED]
  src/features/omm/components/detail/TankFlowVisualizer.tsx → src/features/omm/store/useOmmStore.ts
- `PlantFlowCanvas()` --calls--> `useOmmStore`  [EXTRACTED]
  src/features/omm/components/views/PlantOverview.tsx → src/features/omm/store/useOmmStore.ts
- `ContextMenuState` --references--> `ScreenTreeNode`  [EXTRACTED]
  src/features/screen-designer/ScreenTree.tsx → src/types/domain.ts
- `ToolButton()` --calls--> `cn()`  [EXTRACTED]
  src/features/widget-editor/WidgetCanvasEditor.tsx → src/utils/cn.ts

## Import Cycles
- 3-file cycle: `src/features/widget-editor/Dynamics/FillDynamicEditor.tsx -> src/features/widget-editor/WidgetInspectorPanel.tsx -> src/features/widget-editor/Dynamics/StrokeDynamicEditor.tsx -> src/features/widget-editor/Dynamics/FillDynamicEditor.tsx`

## Communities (45 total, 7 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.16
Nodes (18): FillDynamicEditor(), FillDynamicEditorProps, FillLevelDynamicEditor(), FillLevelDynamicEditorProps, StrokeDynamicEditor(), StrokeDynamicEditorProps, validateDynamicRule(), ValidationError (+10 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (55): AnalyticsTab(), ConnectionDesignerTab(), CustomFlowNode, nodeIcons, categoryIcons, DataSourcesTab(), BlockDefinition, FlowBlockLibrary() (+47 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (14): RuntimeWidgetInstance(), screenFolderRepo, screenRepo, ScreenStoreState, ScreenToolType, AlarmConditionType, FillLevelConfig, ScreenElement (+6 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (37): dependencies, bpmn-js, clsx, dayjs, @hookform/resolvers, immer, lucide-react, react (+29 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (60): alarmRepo, alignmentRepo, areaRepo, auditRepo, clearAllOmmData(), cutoffRepo, defaultSimState, engUnitRepo (+52 more)

### Community 5 - "Community 5"
Cohesion: 0.18
Nodes (12): WidgetLayout(), WidgetsPage(), buildTree(), useWidgetStore, WidgetBindingProperty, WidgetTreeNode, ToolButton(), ToolButtonProps (+4 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (52): ActiveDirectoryTab(), ACTIONS, MODULES, PermissionMatrixView(), UserModal(), UserModalProps, SecurityPage(), ActiveDirectoryActions (+44 more)

### Community 8 - "Community 8"
Cohesion: 0.15
Nodes (24): ObjectSelectorModal(), ObjectSelectorModalProps, AlarmConfigModal(), AssociatedWidgetsEditor(), WidgetThumbnail(), CentralEditor(), ExportImportModal(), DEFAULT_CONFIG (+16 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (31): alarmRepo, deploymentRepo, objectRepo, propertyRepo, widgetRepo, AlarmEngine, makeProp(), PropDef (+23 more)

### Community 10 - "Community 10"
Cohesion: 0.06
Nodes (52): edgeTypes, FlowV2Canvas(), FlowV2CanvasProps, nodeTypes, FlowV2EditorContent(), FlowV2EditorModal(), FlowV2Header(), FlowV2HeaderProps (+44 more)

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (17): IDELayout(), HeaderNavigation(), DatabaseAnalyticsPage(), DBHistoryPoint, PerformanceHistoryPoint, TableStats, FlowsV2Page(), LogsPage() (+9 more)

### Community 12 - "Community 12"
Cohesion: 0.14
Nodes (10): ScreenLayout(), ScreenDesignerPage(), ScreenCanvasEditor(), ScreenElementInspector(), ContextMenuState, RenameState, ScreenTree(), useScreenStore (+2 more)

### Community 13 - "Community 13"
Cohesion: 0.18
Nodes (12): DeploymentTree(), DerivationTree(), DeploymentRepository, DeploymentFolderEntity, DeploymentNodeEntity, DeploymentTreeNode, DerivationTreeNode, ContextMenu() (+4 more)

### Community 14 - "Community 14"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 15 - "Community 15"
Cohesion: 0.09
Nodes (29): useOmmStore, ColDef, DEFAULT_VISIBLE_COLUMNS, movementColumnDefs, NumberCell(), PRIORITY_CONFIG, PriorityCell(), PriorityCellSelector() (+21 more)

### Community 16 - "Community 16"
Cohesion: 0.10
Nodes (15): OmmLayout(), VIEW_TABS, KpiCardProps, OmmKpiHeader(), GROUP_BY_OPTIONS, GroupByOption, OmmToolbar(), ToolbarButton() (+7 more)

### Community 17 - "Community 17"
Cohesion: 0.22
Nodes (12): widgetFolderRepo, WidgetFolderRepository, WidgetSeedService, InspectorTabType, ToolType, WidgetStoreState, WidgetCustomPropertyDataType, WidgetElement (+4 more)

### Community 18 - "Community 18"
Cohesion: 0.29
Nodes (5): MockConfigRepository, MockSimulationService, MockConfig, MockConfigParams, MockPresetType

### Community 19 - "Community 19"
Cohesion: 0.31
Nodes (8): opcRepo, OpcRepository, OpcStoreState, OpcConnectorInterface, OpcDataType, OpcNodeEntity, OpcNodeType, OpcQuality

### Community 20 - "Community 20"
Cohesion: 0.08
Nodes (24): edgeTypes, InteractiveDiagramCanvas(), nodeTypes, TankFlowVisualizer(), TankFlowVisualizerProps, OmmFlowEdge, OmmFlowEdgeData, STATUS_EDGE_STYLE (+16 more)

### Community 21 - "Community 21"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 22 - "Community 22"
Cohesion: 0.18
Nodes (10): ActionType, ConditionNode, EventAction, EventConfig, EventHistoryLog, LeafCondition, LeafConditionType, LogicalCondition (+2 more)

### Community 23 - "Community 23"
Cohesion: 0.13
Nodes (12): TrendChartCard(), xGridTicks, yGridTicks, TimeWindow, TrendChartExpandedModal(), useResizeObserver(), historyEngine, lastRecordedAt (+4 more)

### Community 24 - "Community 24"
Cohesion: 0.27
Nodes (6): AlarmRepository, ObjectRepository, AlarmEvent, ObjectEntity, safeGetItem(), safeSetItem()

### Community 25 - "Community 25"
Cohesion: 0.08
Nodes (18): TankGeometrySvg(), TankGeometrySvgProps, TankGeometryType, OmmPriority, MiniTrendChart(), MiniTrendChartProps, ModalTab, MovementModal() (+10 more)

### Community 27 - "Community 27"
Cohesion: 0.26
Nodes (3): BaseRepository, SingletonRepository, if()

### Community 28 - "Community 28"
Cohesion: 0.20
Nodes (9): CHART_PADDING, ChartData, CURVE_COLORS, HistorianPage(), PeriodPreset, SelectedVariable, TrendChart(), TrendChartProps (+1 more)

### Community 29 - "Community 29"
Cohesion: 0.17
Nodes (8): AdminEditModalProps, AdminPanel(), AdminSection, Column, CrudTableProps, EditModalProps, FieldDef, SECTIONS

### Community 30 - "Community 30"
Cohesion: 0.29
Nodes (6): OmmSimulationEngine, simulateWaveform(), OmmEvent, OmmHistoryPoint, OmmMovement, OmmSimulatorState

### Community 31 - "Community 31"
Cohesion: 0.22
Nodes (13): WidgetMappingModalProps, ObjectPropertySimRow, flowchartRepo, scriptRepo, templateRepo, ExportImportService, InheritanceService, EntityType (+5 more)

### Community 32 - "Community 32"
Cohesion: 0.24
Nodes (6): LogStore, LogStoreActions, LogStoreState, AuditLog, LogOperation, LogSeverity

### Community 33 - "Community 33"
Cohesion: 0.22
Nodes (6): CutoffStatus, OmmCutoffSnapshot, CompareViewProps, CutoffCardProps, CutoffHistory(), STATUS_CONFIG

### Community 34 - "Community 34"
Cohesion: 0.27
Nodes (7): GlobalPropertyPickerModal(), GlobalPropertyPickerModalProps, associatedWidgetRepo, mockConfigRepo, IndexedProperty, PropertyBrowserService, DataType

### Community 36 - "Community 36"
Cohesion: 0.49
Nodes (3): STORAGE_KEYS, TemplateRepository, TemplateEntity

### Community 37 - "Community 37"
Cohesion: 0.33
Nodes (6): DEFAULT_CONFIG, DEFAULT_FIELD_BINDINGS, EquipmentGraphicConfigEditor(), GEOMETRY_OPTIONS, getFillColor(), PROPERTY_UNITS

### Community 42 - "Community 42"
Cohesion: 0.09
Nodes (34): CellPos, GridCanvas(), GridCanvasProps, GridCardInspector(), GridCardInspectorProps, GridDashboardHeader(), GridDashboardHeaderProps, GridScreenManagerModal() (+26 more)

### Community 47 - "Community 47"
Cohesion: 0.18
Nodes (12): WidgetInstanceRenderer(), ExplorerTab, ScreenExplorerPanel(), extractPropertyName(), FillLevelStyle, resolveColorDynamic(), resolveCustomPropValue(), ResolvedWidgetElementStyle (+4 more)

## Knowledge Gaps
- **264 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+259 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 8` to `Community 0`, `Community 34`, `Community 37`, `Community 5`, `Community 10`, `Community 42`, `Community 11`, `Community 13`, `Community 12`, `Community 47`, `Community 19`, `Community 20`, `Community 23`, `Community 25`, `Community 28`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Why does `useObjectModelStore` connect `Community 8` to `Community 1`, `Community 34`, `Community 2`, `Community 37`, `Community 7`, `Community 9`, `Community 10`, `Community 42`, `Community 11`, `Community 12`, `Community 13`, `Community 47`, `Community 23`, `Community 25`, `Community 28`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `useOmmStore` connect `Community 15` to `Community 33`, `Community 4`, `Community 8`, `Community 9`, `Community 16`, `Community 20`, `Community 25`, `Community 29`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _264 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05201292976785189 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1396011396011396 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._