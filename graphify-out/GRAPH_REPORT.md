# Graph Report - MVP 2  (2026-08-10)

## Corpus Check
- 180 files · ~200,327 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1097 nodes · 3090 edges · 52 communities (46 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c01e079c`
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
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 88 edges
2. `useObjectModelStore` - 83 edges
3. `useOmmStore` - 47 edges
4. `useConnectivityStore` - 27 edges
5. `InheritanceService` - 25 edges
6. `useWidgetStore` - 25 edges
7. `STORAGE_KEYS` - 23 edges
8. `OmmStoreActions` - 21 edges
9. `ObjectModelStoreState` - 21 edges
10. `HeaderNavigation()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `TrendChartExpandedModalProps` --references--> `TankCardData`  [EXTRACTED]
  src/features/grid-dashboard/components/TrendChartExpandedModal.tsx → src/features/grid-dashboard/types.ts
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

## Communities (52 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (37): FillDynamicEditor(), FillDynamicEditorProps, FillLevelDynamicEditor(), FillLevelDynamicEditorProps, StrokeDynamicEditor(), StrokeDynamicEditorProps, validateDynamicRule(), ValidationError (+29 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (55): AnalyticsTab(), ConnectionDesignerTab(), CustomFlowNode, nodeIcons, categoryIcons, DataSourcesTab(), BlockDefinition, FlowBlockLibrary() (+47 more)

### Community 2 - "Community 2"
Cohesion: 0.19
Nodes (10): screenFolderRepo, ContextMenuState, RenameState, ScreenStoreState, ScreenToolType, ScreenElement, ScreenElementType, ScreenFolderEntity (+2 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (37): dependencies, bpmn-js, clsx, dayjs, @hookform/resolvers, immer, lucide-react, react (+29 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (53): alarmRepo, alignmentRepo, areaRepo, auditRepo, cutoffRepo, defaultSimState, engUnitRepo, equipmentRepo (+45 more)

### Community 5 - "Community 5"
Cohesion: 0.22
Nodes (11): WidgetLayout(), WidgetsPage(), buildTree(), useWidgetStore, WidgetTreeNode, ResizableSplitPane(), ResizableSplitPaneProps, WidgetCanvasEditor() (+3 more)

### Community 6 - "Community 6"
Cohesion: 0.18
Nodes (10): FlowsV2Page(), HomePage(), LoginPage(), OmmPage(), App(), AuthGuard(), AuthGuardProps, AuthState (+2 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (52): ActiveDirectoryTab(), ACTIONS, MODULES, PermissionMatrixView(), UserModal(), UserModalProps, SecurityPage(), ActiveDirectoryActions (+44 more)

### Community 8 - "Community 8"
Cohesion: 0.20
Nodes (12): ObjectSelectorModal(), ObjectSelectorModalProps, AlarmConfigModal(), ExportImportModal(), MockConfigModal(), PropertiesTable(), PropertyFormData, PropertyModal() (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (24): deploymentRepo, clearAllOmmData(), mockConfigRepo, objectRepo, widgetRepo, makeProp(), PropDef, SeedService (+16 more)

### Community 10 - "Community 10"
Cohesion: 0.06
Nodes (51): edgeTypes, FlowV2Canvas(), FlowV2CanvasProps, nodeTypes, FlowV2EditorContent(), FlowV2EditorModal(), FlowV2Header(), FlowV2HeaderProps (+43 more)

### Community 11 - "Community 11"
Cohesion: 0.20
Nodes (16): HeaderNavigation(), AssociatedWidgetsEditor(), WidgetThumbnail(), WidgetMappingModal(), WidgetMappingModalProps, DatabaseAnalyticsPage(), DBHistoryPoint, PerformanceHistoryPoint (+8 more)

### Community 12 - "Community 12"
Cohesion: 0.26
Nodes (8): ScreenLayout(), ScreenDesignerPage(), ScreenCanvasEditor(), WidgetInstanceRenderer(), ScreenElementInspector(), ScreenExplorerPanel(), ScreenTree(), useScreenStore

### Community 13 - "Community 13"
Cohesion: 0.22
Nodes (12): IDELayout(), CentralEditor(), DeploymentTree(), DerivationTree(), OrchestraPage(), DeploymentTreeNode, DerivationTreeNode, ContextMenu() (+4 more)

### Community 14 - "Community 14"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 15 - "Community 15"
Cohesion: 0.09
Nodes (30): useOmmStore, ColDef, DEFAULT_VISIBLE_COLUMNS, movementColumnDefs, NumberCell(), PRIORITY_CONFIG, PriorityCell(), PriorityCellSelector() (+22 more)

### Community 16 - "Community 16"
Cohesion: 0.07
Nodes (23): OmmLayout(), VIEW_TABS, KpiCardProps, OmmKpiHeader(), GROUP_BY_OPTIONS, GroupByOption, OmmToolbar(), ToolbarButton() (+15 more)

### Community 17 - "Community 17"
Cohesion: 0.19
Nodes (8): RuntimePage(), SavedView, MiniTrendChart(), MiniTrendChartProps, TankTelemetryDashboard(), TankTelemetryDashboardProps, VariableHistory, TankTelemetryModalProps

### Community 18 - "Community 18"
Cohesion: 0.27
Nodes (6): PRESET_OPTIONS, MockConfigRepository, MockSimulationService, MockConfig, MockConfigParams, MockPresetType

### Community 19 - "Community 19"
Cohesion: 0.26
Nodes (10): getNodeIcon(), OpcBrowserPage(), opcRepo, OpcRepository, OpcStoreState, OpcConnectorInterface, OpcDataType, OpcNodeEntity (+2 more)

### Community 20 - "Community 20"
Cohesion: 0.08
Nodes (24): edgeTypes, InteractiveDiagramCanvas(), nodeTypes, TankFlowVisualizer(), TankFlowVisualizerProps, OmmFlowEdge, OmmFlowEdgeData, STATUS_EDGE_STYLE (+16 more)

### Community 21 - "Community 21"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 22 - "Community 22"
Cohesion: 0.17
Nodes (11): ActionType, ActiveEventState, ConditionNode, EventAction, EventConfig, EventHistoryLog, LeafCondition, LeafConditionType (+3 more)

### Community 23 - "Community 23"
Cohesion: 0.17
Nodes (6): lastRecordedAt, lastRecordedValue, monitoredKeys, pendingPersist, Store, SampleQuality

### Community 24 - "Community 24"
Cohesion: 0.23
Nodes (8): alarmRepo, AlarmRepository, STORAGE_KEYS, AlarmEngine, MovementEntity, OmmMovementSyncEntry, AlarmEvent, AlarmRule

### Community 25 - "Community 25"
Cohesion: 0.15
Nodes (11): TankGeometrySvg(), TankGeometrySvgProps, DEFAULT_CONFIG, DEFAULT_FIELD_BINDINGS, EquipmentGraphicConfigEditor(), GEOMETRY_OPTIONS, getFillColor(), PROPERTY_UNITS (+3 more)

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
Cohesion: 0.15
Nodes (11): associatedWidgetRepo, flowchartRepo, propertyRepo, scriptRepo, templateRepo, ExplorerTab, ExportImportService, InheritanceService (+3 more)

### Community 32 - "Community 32"
Cohesion: 0.24
Nodes (6): LogStore, LogStoreActions, LogStoreState, AuditLog, LogOperation, LogSeverity

### Community 33 - "Community 33"
Cohesion: 0.15
Nodes (11): AlarmSeverity, AuditAction, CutoffStatus, EventType, OmmCutoffSnapshot, ProductCategory, SimulationMode, CompareViewProps (+3 more)

### Community 34 - "Community 34"
Cohesion: 0.23
Nodes (7): GlobalPropertyPickerModal(), GlobalPropertyPickerModalProps, screenRepo, IndexedProperty, PropertyBrowserService, DataType, ScreenEntity

### Community 35 - "Community 35"
Cohesion: 0.56
Nodes (3): PropertyRepository, PropertyEntity, safeSetItem()

### Community 36 - "Community 36"
Cohesion: 0.44
Nodes (3): TemplateRepository, TemplateEntity, safeGetItem()

### Community 37 - "Community 37"
Cohesion: 0.42
Nodes (3): DeploymentRepository, DeploymentFolderEntity, DeploymentNodeEntity

### Community 38 - "Community 38"
Cohesion: 0.26
Nodes (10): CellPos, GridCanvas(), GridCanvasProps, GridCardInspectorProps, getLevelColor(), IndustrialTankCard(), IndustrialTankCardProps, resolveObjectPropValue() (+2 more)

### Community 39 - "Community 39"
Cohesion: 0.27
Nodes (8): TrendChartCard(), xGridTicks, yGridTicks, TimeWindow, TrendChartExpandedModal(), TrendChartExpandedModalProps, useResizeObserver(), historyEngine

### Community 42 - "Community 42"
Cohesion: 0.23
Nodes (10): GridDashboardHeader(), GridDashboardHeaderProps, GridScreenManagerModal(), GridScreenManagerModalProps, GridSettingsModal(), GridSettingsModalProps, GridConfig, DEFAULT_VISIBLE_FIELDS (+2 more)

### Community 44 - "Community 44"
Cohesion: 0.31
Nodes (6): CardVisibleFields, GridLayoutState, GridScreenEntity, gridScreenRepo, buildCardFromObject(), GridScreenStoreState

### Community 47 - "Community 47"
Cohesion: 0.21
Nodes (11): RuntimeWidgetInstance(), ScreenRuntimePage(), extractPropertyName(), FillLevelStyle, resolveColorDynamic(), resolveCustomPropValue(), ResolvedWidgetElementStyle, resolveFillLevelDynamic() (+3 more)

### Community 49 - "Community 49"
Cohesion: 0.32
Nodes (6): GridCardInspector(), CardStatus, generateRandomTankCard(), reRandomizeTankValues(), STATUS_LIST, TANK_PRESETS

### Community 50 - "Community 50"
Cohesion: 0.43
Nodes (5): SimulatorEditor(), ObjectPropertySimRow, SimulatorPage(), MergedProperty, MergedMockConfig

### Community 51 - "Community 51"
Cohesion: 0.40
Nodes (4): DEFAULT_CONFIG, HistoryConfigModal(), msToHours(), PropertyHistoryConfig

## Knowledge Gaps
- **267 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+262 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 11` to `Community 0`, `Community 2`, `Community 5`, `Community 6`, `Community 8`, `Community 10`, `Community 12`, `Community 13`, `Community 16`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 25`, `Community 28`, `Community 31`, `Community 34`, `Community 38`, `Community 39`, `Community 42`, `Community 49`, `Community 50`, `Community 51`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `useOmmStore` connect `Community 15` to `Community 33`, `Community 4`, `Community 6`, `Community 9`, `Community 11`, `Community 16`, `Community 50`, `Community 20`, `Community 29`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `useObjectModelStore` connect `Community 8` to `Community 1`, `Community 6`, `Community 7`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 17`, `Community 18`, `Community 25`, `Community 28`, `Community 31`, `Community 34`, `Community 38`, `Community 39`, `Community 42`, `Community 44`, `Community 47`, `Community 50`, `Community 51`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _267 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07832167832167833 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05201292976785189 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._