# Graph Report - MVP 2  (2026-08-11)

## Corpus Check
- 184 files · ~212,106 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1128 nodes · 3177 edges · 48 communities (43 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1d43546a`
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
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 92 edges
2. `useObjectModelStore` - 85 edges
3. `useOmmStore` - 53 edges
4. `useConnectivityStore` - 27 edges
5. `InheritanceService` - 25 edges
6. `useWidgetStore` - 25 edges
7. `STORAGE_KEYS` - 23 edges
8. `ObjectModelStoreState` - 22 edges
9. `OmmStoreActions` - 21 edges
10. `HeaderNavigation()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `IndustrialTankCardProps` --references--> `TankCardData`  [EXTRACTED]
  src/features/grid-dashboard/components/IndustrialTankCard.tsx → src/features/grid-dashboard/types.ts
- `TrendChartCardProps` --references--> `TankCardData`  [EXTRACTED]
  src/features/grid-dashboard/components/TrendChartCard.tsx → src/features/grid-dashboard/types.ts
- `TrendChartExpandedModalProps` --references--> `TankCardData`  [EXTRACTED]
  src/features/grid-dashboard/components/TrendChartExpandedModal.tsx → src/features/grid-dashboard/types.ts
- `InteractiveDiagramCanvas()` --calls--> `useOmmStore`  [EXTRACTED]
  src/features/omm/components/detail/TankFlowVisualizer.tsx → src/features/omm/store/useOmmStore.ts
- `PlantFlowCanvas()` --calls--> `useOmmStore`  [EXTRACTED]
  src/features/omm/components/views/PlantOverview.tsx → src/features/omm/store/useOmmStore.ts

## Import Cycles
- 3-file cycle: `src/features/widget-editor/Dynamics/FillDynamicEditor.tsx -> src/features/widget-editor/WidgetInspectorPanel.tsx -> src/features/widget-editor/Dynamics/StrokeDynamicEditor.tsx -> src/features/widget-editor/Dynamics/FillDynamicEditor.tsx`

## Communities (48 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.21
Nodes (13): widgetFolderRepo, WidgetFolderRepository, widgetRepo, WidgetSeedService, InspectorTabType, ToolType, WidgetStoreState, WidgetCustomPropertyDataType (+5 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (53): AnalyticsTab(), ConnectionDesignerTab(), CustomFlowNode, nodeIcons, categoryIcons, DataSourcesTab(), BlockDefinition, FlowBlockLibrary() (+45 more)

### Community 2 - "Community 2"
Cohesion: 0.17
Nodes (14): screenFolderRepo, ScreenStoreState, ScreenToolType, AlarmConditionType, FillLevelConfig, ScreenElement, ScreenElementType, ScreenEntity (+6 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (37): dependencies, bpmn-js, clsx, dayjs, @hookform/resolvers, immer, lucide-react, react (+29 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (82): AdminEditModalProps, AdminSection, Column, CrudTableProps, EditModalProps, FieldDef, SECTIONS, OmmTankNodeData (+74 more)

### Community 5 - "Community 5"
Cohesion: 0.14
Nodes (10): ScreenLayout(), ScreenDesignerPage(), ScreenCanvasEditor(), ScreenElementInspector(), ContextMenuState, RenameState, ScreenTree(), useScreenStore (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.13
Nodes (17): HeaderNavigation(), FlowsV2Page(), HomePage(), LoginPage(), OmmPage(), RuntimePage(), SavedView, ScreenRuntimePage() (+9 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (52): ActiveDirectoryTab(), ACTIONS, MODULES, PermissionMatrixView(), UserModal(), UserModalProps, SecurityPage(), ActiveDirectoryActions (+44 more)

### Community 8 - "Community 8"
Cohesion: 0.21
Nodes (13): AlarmConfigModal(), CentralEditor(), ExportImportModal(), MockConfigModal(), PropertiesTable(), PropertyFormData, PropertyModal(), propertySchema (+5 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (20): deploymentRepo, makeProp(), PropDef, SeedService, activeEvents, currentConfig, id, inheritedProp (+12 more)

### Community 10 - "Community 10"
Cohesion: 0.06
Nodes (54): edgeTypes, FlowV2Canvas(), FlowV2CanvasProps, nodeTypes, FlowV2EditorContent(), FlowV2EditorModal(), FlowV2Header(), FlowV2HeaderProps (+46 more)

### Community 11 - "Community 11"
Cohesion: 0.10
Nodes (15): AdminPanel(), OmmLayout(), VIEW_TABS, KpiCardProps, OmmKpiHeader(), GROUP_BY_OPTIONS, GroupByOption, OmmToolbar() (+7 more)

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
Cohesion: 0.13
Nodes (17): useOmmStore, ColDef, DEFAULT_VISIBLE_COLUMNS, movementColumnDefs, NumberCell(), PRIORITY_CONFIG, PriorityCell(), PriorityCellSelector() (+9 more)

### Community 16 - "Community 16"
Cohesion: 0.23
Nodes (8): LogsPage(), LogStore, LogStoreActions, LogStoreState, useLogStore, AuditLog, LogOperation, LogSeverity

### Community 17 - "Community 17"
Cohesion: 0.17
Nodes (12): MiniTrendChart(), MiniTrendChartProps, TankTelemetryDashboardProps, VariableHistory, generateRamp(), generateSinusoidal(), generateTrendHistory(), GenerateTrendHistoryOptions (+4 more)

### Community 18 - "Community 18"
Cohesion: 0.27
Nodes (6): PRESET_OPTIONS, MockConfigRepository, MockSimulationService, MockConfig, MockConfigParams, MockPresetType

### Community 19 - "Community 19"
Cohesion: 0.21
Nodes (13): UniversalMappingTab(), getNodeIcon(), OpcBrowserPage(), opcRepo, OpcRepository, ScreenExplorerPanel(), OpcStoreState, useOpcStore (+5 more)

### Community 20 - "Community 20"
Cohesion: 0.11
Nodes (16): edgeTypes, InteractiveDiagramCanvas(), nodeTypes, TankFlowVisualizer(), TankFlowVisualizerProps, OmmFlowEdge, OmmFlowEdgeData, STATUS_EDGE_STYLE (+8 more)

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
Cohesion: 0.15
Nodes (12): AccuracyBar(), FlowDisplay(), PRIORITY_CONFIG, PriorityBadge(), ProductDot(), ProgressBar(), STATUS_CONFIG, StatusBadge() (+4 more)

### Community 25 - "Community 25"
Cohesion: 0.16
Nodes (10): TankGeometrySvg(), TankGeometrySvgProps, DEFAULT_CONFIG, DEFAULT_FIELD_BINDINGS, EquipmentGraphicConfigEditor(), GEOMETRY_OPTIONS, getFillColor(), PROPERTY_UNITS (+2 more)

### Community 27 - "Community 27"
Cohesion: 0.26
Nodes (3): BaseRepository, SingletonRepository, if()

### Community 28 - "Community 28"
Cohesion: 0.20
Nodes (9): CHART_PADDING, ChartData, CURVE_COLORS, HistorianPage(), PeriodPreset, SelectedVariable, TrendChart(), TrendChartProps (+1 more)

### Community 29 - "Community 29"
Cohesion: 0.28
Nodes (5): CompactNode(), DetailedNode(), OmmTankNode, resolveGeometry(), TYPE_HEADER_COLOR

### Community 31 - "Community 31"
Cohesion: 0.25
Nodes (10): WidgetMappingModalProps, propertyRepo, ExplorerTab, ExportImportService, InheritanceService, EntityType, ExportDataPayload, MergedAssociatedWidget (+2 more)

### Community 32 - "Community 32"
Cohesion: 0.16
Nodes (18): FillDynamicEditor(), FillDynamicEditorProps, FillLevelDynamicEditor(), FillLevelDynamicEditorProps, StrokeDynamicEditor(), StrokeDynamicEditorProps, validateDynamicRule(), ValidationError (+10 more)

### Community 34 - "Community 34"
Cohesion: 0.33
Nodes (5): GlobalPropertyPickerModalProps, associatedWidgetRepo, mockConfigRepo, IndexedProperty, PropertyBrowserService

### Community 35 - "Community 35"
Cohesion: 0.08
Nodes (17): alarmRepo, AlarmRepository, ObjectRepository, PropertyRepository, STORAGE_KEYS, TemplateRepository, AlarmEngine, MovementEntity (+9 more)

### Community 37 - "Community 37"
Cohesion: 0.12
Nodes (14): OmmPriority, ModalTab, MovementModal(), PRIORITY_OPTIONS, STATUS_COLORS, STATUS_LABELS, TABS, OrderDialog() (+6 more)

### Community 39 - "Community 39"
Cohesion: 0.24
Nodes (9): TrendChartCard(), TrendChartCardProps, xGridTicks, yGridTicks, TimeWindow, TrendChartExpandedModal(), TrendChartExpandedModalProps, useResizeObserver() (+1 more)

### Community 40 - "Community 40"
Cohesion: 0.20
Nodes (11): CellPos, GridCanvas(), GridCanvasProps, GridDashboardHeader(), GridDashboardHeaderProps, GridSettingsModalProps, getLevelColor(), IndustrialTankCard() (+3 more)

### Community 44 - "Community 44"
Cohesion: 0.16
Nodes (13): GridCardInspector(), GridScreenManagerModal(), GridScreenManagerModalProps, GridSettingsModal(), GridLayoutState, GridScreenEntity, DEFAULT_VISIBLE_FIELDS, GridDashboardPage() (+5 more)

### Community 47 - "Community 47"
Cohesion: 0.16
Nodes (12): RuntimeWidgetInstance(), screenRepo, WidgetInstanceRenderer(), extractPropertyName(), FillLevelStyle, resolveColorDynamic(), resolveCustomPropValue(), ResolvedWidgetElementStyle (+4 more)

### Community 49 - "Community 49"
Cohesion: 0.33
Nodes (8): GridCardInspectorProps, CardStatus, CardVisibleFields, TankCardData, FieldBinding, reRandomizeTankValues(), STATUS_LIST, TANK_PRESETS

### Community 51 - "Community 51"
Cohesion: 0.17
Nodes (10): CurveChartProps, DEFAULT_STRAPPING, GEOMETRY_CURVE_NOTES, GEOMETRY_LABELS, templateRepo, StrappingPoint, TankStrappingConfig, convertLevelToVolume() (+2 more)

### Community 52 - "Community 52"
Cohesion: 0.18
Nodes (12): WidgetLayout(), WidgetsPage(), buildTree(), useWidgetStore, WidgetBindingProperty, WidgetTreeNode, ToolButton(), ToolButtonProps (+4 more)

### Community 53 - "Community 53"
Cohesion: 0.17
Nodes (16): ObjectSelectorModal(), ObjectSelectorModalProps, AssociatedWidgetsEditor(), WidgetThumbnail(), DEFAULT_CONFIG, HistoryConfigModal(), msToHours(), WidgetMappingModal() (+8 more)

## Knowledge Gaps
- **275 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+270 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 53` to `Community 5`, `Community 6`, `Community 8`, `Community 10`, `Community 11`, `Community 13`, `Community 16`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 25`, `Community 28`, `Community 31`, `Community 32`, `Community 34`, `Community 37`, `Community 39`, `Community 40`, `Community 44`, `Community 47`, `Community 49`, `Community 51`, `Community 52`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `useObjectModelStore` connect `Community 8` to `Community 5`, `Community 6`, `Community 7`, `Community 9`, `Community 10`, `Community 11`, `Community 13`, `Community 17`, `Community 18`, `Community 19`, `Community 25`, `Community 28`, `Community 31`, `Community 34`, `Community 37`, `Community 39`, `Community 40`, `Community 44`, `Community 47`, `Community 51`, `Community 53`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `useOmmStore` connect `Community 15` to `Community 4`, `Community 37`, `Community 6`, `Community 39`, `Community 9`, `Community 11`, `Community 17`, `Community 51`, `Community 20`, `Community 24`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _275 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05348101265822785 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.05193171608265948 - nodes in this community are weakly interconnected._