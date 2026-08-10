# Graph Report - MVP 2  (2026-08-10)

## Corpus Check
- 176 files · ~194,852 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1082 nodes · 3039 edges · 44 communities (39 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8922aa96`
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
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 84 edges
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
- `IndustrialTankCardProps` --references--> `TankCardData`  [EXTRACTED]
  src/features/grid-dashboard/components/IndustrialTankCard.tsx → src/features/grid-dashboard/types.ts
- `TrendChartExpandedModalProps` --references--> `TankCardData`  [EXTRACTED]
  src/features/grid-dashboard/components/TrendChartExpandedModal.tsx → src/features/grid-dashboard/types.ts
- `InteractiveDiagramCanvas()` --calls--> `useOmmStore`  [EXTRACTED]
  src/features/omm/components/detail/TankFlowVisualizer.tsx → src/features/omm/store/useOmmStore.ts
- `PlantFlowCanvas()` --calls--> `useOmmStore`  [EXTRACTED]
  src/features/omm/components/views/PlantOverview.tsx → src/features/omm/store/useOmmStore.ts

## Import Cycles
- 3-file cycle: `src/features/widget-editor/Dynamics/FillDynamicEditor.tsx -> src/features/widget-editor/WidgetInspectorPanel.tsx -> src/features/widget-editor/Dynamics/StrokeDynamicEditor.tsx -> src/features/widget-editor/Dynamics/FillDynamicEditor.tsx`

## Communities (44 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.16
Nodes (18): FillDynamicEditor(), FillDynamicEditorProps, FillLevelDynamicEditor(), FillLevelDynamicEditorProps, StrokeDynamicEditor(), StrokeDynamicEditorProps, validateDynamicRule(), ValidationError (+10 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (53): AnalyticsTab(), ConnectionDesignerTab(), CustomFlowNode, nodeIcons, categoryIcons, DataSourcesTab(), BlockDefinition, FlowBlockLibrary() (+45 more)

### Community 2 - "Community 2"
Cohesion: 0.15
Nodes (13): screenFolderRepo, ContextMenuState, RenameState, ScreenStoreState, ScreenToolType, AlarmConditionType, FillLevelConfig, ScreenElement (+5 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (37): dependencies, bpmn-js, clsx, dayjs, @hookform/resolvers, immer, lucide-react, react (+29 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (54): alarmRepo, alignmentRepo, areaRepo, auditRepo, clearAllOmmData(), cutoffRepo, defaultSimState, engUnitRepo (+46 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (22): UniversalMappingTab(), ScreenLayout(), WidgetLayout(), ScreenDesignerPage(), WidgetsPage(), ScreenCanvasEditor(), WidgetInstanceRenderer(), ScreenElementInspector() (+14 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (52): ActiveDirectoryTab(), ACTIONS, MODULES, PermissionMatrixView(), UserModal(), UserModalProps, SecurityPage(), ActiveDirectoryActions (+44 more)

### Community 8 - "Community 8"
Cohesion: 0.05
Nodes (69): ObjectSelectorModal(), ObjectSelectorModalProps, IDELayout(), HeaderNavigation(), AlarmConfigModal(), AssociatedWidgetsEditor(), WidgetThumbnail(), CentralEditor() (+61 more)

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (21): deploymentRepo, templateRepo, makeProp(), PropDef, SeedService, activeEvents, currentConfig, id (+13 more)

### Community 10 - "Community 10"
Cohesion: 0.06
Nodes (53): edgeTypes, FlowV2Canvas(), FlowV2CanvasProps, nodeTypes, FlowV2EditorContent(), FlowV2EditorModal(), FlowV2Header(), FlowV2HeaderProps (+45 more)

### Community 11 - "Community 11"
Cohesion: 0.24
Nodes (9): CellPos, GridCanvas(), GridCanvasProps, GridDashboardHeader(), GridDashboardHeaderProps, GridSettingsModal(), GridSettingsModalProps, GridConfig (+1 more)

### Community 12 - "Community 12"
Cohesion: 0.20
Nodes (10): InspectorTabType, ToolType, WidgetStoreState, WidgetBindingProperty, WidgetCustomPropertyDataType, WidgetElement, WidgetElementBinding, WidgetElementType (+2 more)

### Community 13 - "Community 13"
Cohesion: 0.42
Nodes (3): DeploymentRepository, DeploymentFolderEntity, DeploymentNodeEntity

### Community 14 - "Community 14"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (17): ColDef, DEFAULT_VISIBLE_COLUMNS, movementColumnDefs, PRIORITY_CONFIG, STATUS_CONFIG, MovementRow, AccuracyBar(), FlowDisplay() (+9 more)

### Community 16 - "Community 16"
Cohesion: 0.08
Nodes (26): OmmLayout(), VIEW_TABS, KpiCardProps, OmmKpiHeader(), GROUP_BY_OPTIONS, GroupByOption, OmmToolbar(), ToolbarButton() (+18 more)

### Community 17 - "Community 17"
Cohesion: 0.30
Nodes (6): widgetFolderRepo, WidgetFolderRepository, widgetRepo, WidgetSeedService, WidgetFolderEntity, WidgetNodeEntity

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
Cohesion: 0.17
Nodes (11): ActionType, ActiveEventState, ConditionNode, EventAction, EventConfig, EventHistoryLog, LeafCondition, LeafConditionType (+3 more)

### Community 23 - "Community 23"
Cohesion: 0.17
Nodes (6): lastRecordedAt, lastRecordedValue, pendingPersist, Store, PropertyHistoryConfig, SampleQuality

### Community 24 - "Community 24"
Cohesion: 0.07
Nodes (18): alarmRepo, AlarmRepository, objectRepo, ObjectRepository, PropertyRepository, STORAGE_KEYS, TemplateRepository, AlarmEngine (+10 more)

### Community 25 - "Community 25"
Cohesion: 0.12
Nodes (13): OmmPriority, ModalTab, MovementModal(), PRIORITY_OPTIONS, STATUS_COLORS, STATUS_LABELS, TABS, OrderDialog() (+5 more)

### Community 27 - "Community 27"
Cohesion: 0.26
Nodes (3): BaseRepository, SingletonRepository, if()

### Community 28 - "Community 28"
Cohesion: 0.16
Nodes (7): TankGeometrySvg(), TankGeometrySvgProps, TankGeometryType, MiniTrendChart(), MiniTrendChartProps, TankTelemetryDashboardProps, VariableHistory

### Community 29 - "Community 29"
Cohesion: 0.17
Nodes (8): AdminEditModalProps, AdminPanel(), AdminSection, Column, CrudTableProps, EditModalProps, FieldDef, SECTIONS

### Community 30 - "Community 30"
Cohesion: 0.29
Nodes (6): OmmSimulationEngine, simulateWaveform(), OmmEvent, OmmHistoryPoint, OmmMovement, OmmSimulatorState

### Community 31 - "Community 31"
Cohesion: 0.35
Nodes (8): WidgetMappingModalProps, ObjectPropertySimRow, InheritanceService, EntityType, MergedAssociatedWidget, MergedProperty, MergedScript, MergedMockConfig

### Community 33 - "Community 33"
Cohesion: 0.15
Nodes (11): AlarmSeverity, AuditAction, CutoffStatus, EventType, OmmCutoffSnapshot, ProductCategory, SimulationMode, CompareViewProps (+3 more)

### Community 34 - "Community 34"
Cohesion: 0.15
Nodes (10): GlobalPropertyPickerModal(), GlobalPropertyPickerModalProps, RuntimeWidgetInstance(), associatedWidgetRepo, mockConfigRepo, screenRepo, IndexedProperty, PropertyBrowserService (+2 more)

### Community 35 - "Community 35"
Cohesion: 0.27
Nodes (8): TrendChartCard(), xGridTicks, yGridTicks, TimeWindow, TrendChartExpandedModal(), TrendChartExpandedModalProps, useResizeObserver(), historyEngine

### Community 38 - "Community 38"
Cohesion: 0.24
Nodes (8): GridScreenManagerModal(), GridScreenManagerModalProps, GridScreenEntity, gridScreenRepo, propertyRepo, buildCardFromObject(), GridScreenStoreState, useGridScreenStore

### Community 42 - "Community 42"
Cohesion: 0.21
Nodes (12): GridCardInspector(), GridCardInspectorProps, TrendChartCardProps, CardStatus, CardVisibleFields, GridLayoutState, TankCardData, FieldBinding (+4 more)

### Community 44 - "Community 44"
Cohesion: 0.60
Nodes (3): scriptRepo, ExportImportService, ExportDataPayload

### Community 46 - "Community 46"
Cohesion: 0.60
Nodes (4): getLevelColor(), IndustrialTankCard(), IndustrialTankCardProps, resolveObjectPropValue()

### Community 47 - "Community 47"
Cohesion: 0.33
Nodes (9): extractPropertyName(), FillLevelStyle, resolveColorDynamic(), resolveCustomPropValue(), ResolvedWidgetElementStyle, resolveFillLevelDynamic(), resolveVisibilityDynamic(), resolveWidgetElementStyle() (+1 more)

## Knowledge Gaps
- **261 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+256 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 8` to `Community 0`, `Community 34`, `Community 35`, `Community 2`, `Community 5`, `Community 38`, `Community 10`, `Community 11`, `Community 42`, `Community 12`, `Community 46`, `Community 19`, `Community 20`, `Community 25`, `Community 28`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `useOmmStore` connect `Community 16` to `Community 33`, `Community 4`, `Community 8`, `Community 9`, `Community 15`, `Community 20`, `Community 25`, `Community 29`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `useObjectModelStore` connect `Community 8` to `Community 34`, `Community 35`, `Community 2`, `Community 5`, `Community 38`, `Community 7`, `Community 9`, `Community 10`, `Community 11`, `Community 46`, `Community 28`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _261 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05348101265822785 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.14624505928853754 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._