# Graph Report - MVP 2  (2026-08-11)

## Corpus Check
- 190 files · ~221,616 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1170 nodes · 3313 edges · 46 communities (39 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ef963b11`
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
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
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
9. `HeaderNavigation()` - 22 edges
10. `ObjectModelStoreState` - 22 edges

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

## Communities (46 total, 7 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.21
Nodes (13): widgetFolderRepo, WidgetFolderRepository, widgetRepo, WidgetSeedService, InspectorTabType, ToolType, WidgetStoreState, WidgetCustomPropertyDataType (+5 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (53): AnalyticsTab(), ConnectionDesignerTab(), CustomFlowNode, nodeIcons, categoryIcons, DataSourcesTab(), BlockDefinition, FlowBlockLibrary() (+45 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (29): useOmmStore, ColDef, DEFAULT_VISIBLE_COLUMNS, movementColumnDefs, NumberCell(), PRIORITY_CONFIG, PriorityCell(), PriorityCellSelector() (+21 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (37): dependencies, bpmn-js, clsx, dayjs, @hookform/resolvers, immer, lucide-react, react (+29 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (84): AdminEditModalProps, AdminPanel(), AdminSection, Column, CrudTableProps, EditModalProps, FieldDef, SECTIONS (+76 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (17): screenRepo, ContextMenuState, RenameState, ScreenStoreState, ScreenToolType, AlarmConditionType, FillLevelConfig, ScreenElement (+9 more)

### Community 6 - "Community 6"
Cohesion: 0.17
Nodes (11): FlowV2EditorModal(), FlowsV2Page(), HomePage(), LoginPage(), ProcessAlertsPage(), RuntimePage(), AuthGuard(), AuthGuardProps (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (52): ActiveDirectoryTab(), ACTIONS, MODULES, PermissionMatrixView(), UserModal(), UserModalProps, SecurityPage(), ActiveDirectoryActions (+44 more)

### Community 8 - "Community 8"
Cohesion: 0.24
Nodes (11): AlarmConfigModal(), CentralEditor(), ExportImportModal(), PropertiesTable(), PropertyFormData, PropertyModal(), propertySchema, StrappingConfigEditor() (+3 more)

### Community 9 - "Community 9"
Cohesion: 0.07
Nodes (29): CurveChartProps, DEFAULT_STRAPPING, GEOMETRY_CURVE_NOTES, GEOMETRY_LABELS, deploymentRepo, screenFolderRepo, STORAGE_KEYS, templateRepo (+21 more)

### Community 10 - "Community 10"
Cohesion: 0.06
Nodes (51): edgeTypes, FlowV2Canvas(), FlowV2CanvasProps, nodeTypes, FlowV2EditorContent(), FlowV2Header(), FlowV2HeaderProps, FlowV2InspectorPanel() (+43 more)

### Community 11 - "Community 11"
Cohesion: 0.16
Nodes (14): WidgetThumbnail(), DEFAULT_CONFIG, HistoryConfigModal(), msToHours(), WidgetMappingModal(), WidgetMappingModalProps, DatabaseAnalyticsPage(), DBHistoryPoint (+6 more)

### Community 12 - "Community 12"
Cohesion: 0.42
Nodes (3): DeploymentRepository, DeploymentFolderEntity, DeploymentNodeEntity

### Community 13 - "Community 13"
Cohesion: 0.24
Nodes (11): IDELayout(), DeploymentTree(), DerivationTree(), OrchestraPage(), DeploymentTreeNode, DerivationTreeNode, ContextMenu(), ContextMenuItem (+3 more)

### Community 14 - "Community 14"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 15 - "Community 15"
Cohesion: 0.12
Nodes (12): VIEW_TABS, KpiCardProps, OmmKpiHeader(), GROUP_BY_OPTIONS, GroupByOption, OmmToolbar(), ToolbarButton(), ToolbarButtonProps (+4 more)

### Community 16 - "Community 16"
Cohesion: 0.18
Nodes (11): OmmLayout(), HeaderNavigation(), LogsPage(), OmmPage(), LogStore, LogStoreActions, LogStoreState, useLogStore (+3 more)

### Community 17 - "Community 17"
Cohesion: 0.17
Nodes (12): MiniTrendChart(), MiniTrendChartProps, TankTelemetryDashboardProps, VariableHistory, generateRamp(), generateSinusoidal(), generateTrendHistory(), GenerateTrendHistoryOptions (+4 more)

### Community 18 - "Community 18"
Cohesion: 0.27
Nodes (6): PRESET_OPTIONS, MockConfigRepository, MockSimulationService, MockConfig, MockConfigParams, MockPresetType

### Community 19 - "Community 19"
Cohesion: 0.21
Nodes (13): UniversalMappingTab(), getNodeIcon(), OpcBrowserPage(), opcRepo, OpcRepository, App(), OpcStoreState, useOpcStore (+5 more)

### Community 20 - "Community 20"
Cohesion: 0.12
Nodes (15): edgeTypes, InteractiveDiagramCanvas(), nodeTypes, TankFlowVisualizer(), TankFlowVisualizerProps, OmmFlowEdge, OmmFlowEdgeData, STATUS_EDGE_STYLE (+7 more)

### Community 21 - "Community 21"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 22 - "Community 22"
Cohesion: 0.17
Nodes (11): ActionType, ActiveEventState, ConditionNode, EventAction, EventConfig, EventHistoryLog, LeafCondition, LeafConditionType (+3 more)

### Community 23 - "Community 23"
Cohesion: 0.15
Nodes (8): TankGeometrySvg(), TankGeometrySvgProps, CompactNode(), DetailedNode(), OmmTankNode, resolveGeometry(), TYPE_HEADER_COLOR, TankGeometryType

### Community 24 - "Community 24"
Cohesion: 0.24
Nodes (10): ObjectSelectorModal(), ObjectSelectorModalProps, MockConfigModal(), SimulatorEditor(), ObjectPropertySimRow, SimulatorPage(), MergedProperty, MergedMockConfig (+2 more)

### Community 25 - "Community 25"
Cohesion: 0.29
Nodes (7): DEFAULT_CONFIG, DEFAULT_FIELD_BINDINGS, EquipmentGraphicConfigEditor(), GEOMETRY_OPTIONS, getFillColor(), PROPERTY_UNITS, EquipmentGraphicConfig

### Community 27 - "Community 27"
Cohesion: 0.26
Nodes (3): BaseRepository, SingletonRepository, if()

### Community 28 - "Community 28"
Cohesion: 0.20
Nodes (9): CHART_PADDING, ChartData, CURVE_COLORS, HistorianPage(), PeriodPreset, SelectedVariable, TrendChart(), TrendChartProps (+1 more)

### Community 30 - "Community 30"
Cohesion: 0.20
Nodes (9): OmmPriority, OrderDialog(), SearchableSelect(), SearchableSelectProps, SelectOption, convertLevelToVolume(), convertVolumeToLevel(), getStrappingConfig() (+1 more)

### Community 31 - "Community 31"
Cohesion: 0.35
Nodes (6): scriptRepo, ExportImportService, InheritanceService, EntityType, ExportDataPayload, MergedScript

### Community 32 - "Community 32"
Cohesion: 0.16
Nodes (18): FillDynamicEditor(), FillDynamicEditorProps, FillLevelDynamicEditor(), FillLevelDynamicEditorProps, StrokeDynamicEditor(), StrokeDynamicEditorProps, validateDynamicRule(), ValidationError (+10 more)

### Community 33 - "Community 33"
Cohesion: 0.18
Nodes (8): ModalTab, PRIORITY_OPTIONS, STATUS_COLORS, STATUS_LABELS, TABS, TankTelemetryDashboard(), TankTelemetryModal(), TankTelemetryModalProps

### Community 35 - "Community 35"
Cohesion: 0.07
Nodes (32): ToastContainer(), SavedView, alarmRepo, AlarmRepository, ObjectRepository, processAlertRepo, ProcessAlertRepository, PropertyRepository (+24 more)

### Community 36 - "Community 36"
Cohesion: 0.17
Nodes (12): ScreenLayout(), ScreenDesignerPage(), propertyRepo, ScreenCanvasEditor(), WidgetInstanceRenderer(), ScreenElementInspector(), ExplorerTab, ScreenExplorerPanel() (+4 more)

### Community 37 - "Community 37"
Cohesion: 0.29
Nodes (6): GlobalPropertyPickerModal(), GlobalPropertyPickerModalProps, associatedWidgetRepo, mockConfigRepo, IndexedProperty, PropertyBrowserService

### Community 44 - "Community 44"
Cohesion: 0.06
Nodes (47): CellPos, GridCanvas(), GridCanvasProps, GridCardInspector(), GridCardInspectorProps, GridDashboardHeader(), GridDashboardHeaderProps, GridScreenManagerModal() (+39 more)

### Community 47 - "Community 47"
Cohesion: 0.21
Nodes (11): RuntimeWidgetInstance(), ScreenRuntimePage(), extractPropertyName(), FillLevelStyle, resolveColorDynamic(), resolveCustomPropValue(), ResolvedWidgetElementStyle, resolveFillLevelDynamic() (+3 more)

### Community 52 - "Community 52"
Cohesion: 0.18
Nodes (12): WidgetLayout(), AssociatedWidgetsEditor(), WidgetsPage(), buildTree(), useWidgetStore, WidgetBindingProperty, ToolButton(), ToolButtonProps (+4 more)

## Knowledge Gaps
- **279 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+274 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 24` to `Community 5`, `Community 6`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 13`, `Community 16`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 25`, `Community 28`, `Community 30`, `Community 32`, `Community 35`, `Community 36`, `Community 37`, `Community 44`, `Community 52`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Why does `useOmmStore` connect `Community 2` to `Community 33`, `Community 35`, `Community 4`, `Community 6`, `Community 9`, `Community 44`, `Community 15`, `Community 16`, `Community 17`, `Community 20`, `Community 24`, `Community 30`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `useObjectModelStore` connect `Community 8` to `Community 5`, `Community 6`, `Community 7`, `Community 9`, `Community 10`, `Community 11`, `Community 13`, `Community 16`, `Community 17`, `Community 18`, `Community 19`, `Community 24`, `Community 25`, `Community 28`, `Community 33`, `Community 35`, `Community 36`, `Community 37`, `Community 44`, `Community 47`, `Community 52`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _279 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05348101265822785 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08961593172119488 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._