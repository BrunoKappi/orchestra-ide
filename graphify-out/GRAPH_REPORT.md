# Graph Report - MVP 2  (2026-08-08)

## Corpus Check
- 170 files · ~185,123 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1042 nodes · 2937 edges · 44 communities (37 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ce7338f3`
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
- [[_COMMUNITY_Community 43|Community 43]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 82 edges
2. `useObjectModelStore` - 77 edges
3. `useOmmStore` - 42 edges
4. `useConnectivityStore` - 27 edges
5. `InheritanceService` - 25 edges
6. `useWidgetStore` - 25 edges
7. `STORAGE_KEYS` - 22 edges
8. `OmmStoreActions` - 21 edges
9. `ObjectModelStoreState` - 21 edges
10. `safeSetItem()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `TrendChartCardProps` --references--> `TankCardData`  [EXTRACTED]
  src/features/grid-dashboard/components/TrendChartCard.tsx → src/features/grid-dashboard/types.ts
- `ToolButton()` --calls--> `cn()`  [EXTRACTED]
  src/features/widget-editor/WidgetCanvasEditor.tsx → src/utils/cn.ts
- `DataTypeBadge()` --calls--> `cn()`  [EXTRACTED]
  src/features/widget-editor/WidgetInspectorPanel.tsx → src/utils/cn.ts
- `TabButton()` --calls--> `cn()`  [EXTRACTED]
  src/features/widget-editor/WidgetInspectorPanel.tsx → src/utils/cn.ts
- `GridDashboardPage()` --calls--> `useObjectModelStore`  [INFERRED]
  src/pages/GridDashboardPage.tsx → src/store/useObjectModelStore.ts

## Import Cycles
- 3-file cycle: `src/features/widget-editor/Dynamics/FillDynamicEditor.tsx -> src/features/widget-editor/WidgetInspectorPanel.tsx -> src/features/widget-editor/Dynamics/StrokeDynamicEditor.tsx -> src/features/widget-editor/Dynamics/FillDynamicEditor.tsx`

## Communities (44 total, 7 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.18
Nodes (10): ActionType, ConditionNode, EventAction, EventConfig, EventHistoryLog, LeafCondition, LeafConditionType, LogicalCondition (+2 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (55): AnalyticsTab(), ConnectionDesignerTab(), CustomFlowNode, nodeIcons, categoryIcons, DataSourcesTab(), BlockDefinition, FlowBlockLibrary() (+47 more)

### Community 2 - "Community 2"
Cohesion: 0.28
Nodes (6): AlarmRepository, TemplateRepository, AlarmEvent, TemplateEntity, safeGetItem(), safeSetItem()

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (37): dependencies, bpmn-js, clsx, dayjs, @hookform/resolvers, immer, lucide-react, react (+29 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (49): alarmRepo, alignmentRepo, areaRepo, auditRepo, clearAllOmmData(), cutoffRepo, defaultSimState, engUnitRepo (+41 more)

### Community 5 - "Community 5"
Cohesion: 0.14
Nodes (9): ScreenLayout(), ScreenCanvasEditor(), WidgetInstanceRenderer(), ScreenElementInspector(), ExplorerTab, ScreenExplorerPanel(), useScreenStore, ResizableSplitPane() (+1 more)

### Community 6 - "Community 6"
Cohesion: 0.17
Nodes (15): screenFolderRepo, ContextMenuState, RenameState, ScreenTree(), ScreenStoreState, ScreenToolType, AlarmConditionType, FillLevelConfig (+7 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (52): ActiveDirectoryTab(), ACTIONS, MODULES, PermissionMatrixView(), UserModal(), UserModalProps, SecurityPage(), ActiveDirectoryActions (+44 more)

### Community 8 - "Community 8"
Cohesion: 0.06
Nodes (61): FlowV2EditorModal(), ObjectSelectorModal(), ObjectSelectorModalProps, IDELayout(), HeaderNavigation(), AlarmConfigModal(), AssociatedWidgetsEditor(), WidgetThumbnail() (+53 more)

### Community 9 - "Community 9"
Cohesion: 0.23
Nodes (11): widgetFolderRepo, WidgetFolderRepository, WidgetSeedService, InspectorTabType, ToolType, WidgetStoreState, WidgetCustomPropertyDataType, WidgetElementBinding (+3 more)

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (51): edgeTypes, FlowV2Canvas(), FlowV2CanvasProps, nodeTypes, FlowV2EditorContent(), FlowV2Header(), FlowV2HeaderProps, FlowV2InspectorPanel() (+43 more)

### Community 11 - "Community 11"
Cohesion: 0.19
Nodes (12): GridDashboardHeader(), GridDashboardHeaderProps, GridScreenManagerModal(), GridScreenManagerModalProps, GridSettingsModal(), GridSettingsModalProps, GridConfig, GridLayoutState (+4 more)

### Community 13 - "Community 13"
Cohesion: 0.42
Nodes (3): DeploymentRepository, DeploymentFolderEntity, DeploymentNodeEntity

### Community 14 - "Community 14"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 15 - "Community 15"
Cohesion: 0.08
Nodes (32): TankFlowVisualizer(), TankFlowVisualizerProps, useOmmStore, ColDef, DEFAULT_VISIBLE_COLUMNS, movementColumnDefs, NumberCell(), PRIORITY_CONFIG (+24 more)

### Community 16 - "Community 16"
Cohesion: 0.06
Nodes (29): OmmLayout(), VIEW_TABS, KpiCardProps, OmmKpiHeader(), GROUP_BY_OPTIONS, GroupByOption, OmmToolbar(), ToolbarButton() (+21 more)

### Community 17 - "Community 17"
Cohesion: 0.16
Nodes (18): FillDynamicEditor(), FillDynamicEditorProps, FillLevelDynamicEditor(), FillLevelDynamicEditorProps, StrokeDynamicEditor(), StrokeDynamicEditorProps, validateDynamicRule(), ValidationError (+10 more)

### Community 18 - "Community 18"
Cohesion: 0.29
Nodes (5): MockConfigRepository, MockSimulationService, MockConfig, MockConfigParams, MockPresetType

### Community 19 - "Community 19"
Cohesion: 0.26
Nodes (10): getNodeIcon(), OpcBrowserPage(), opcRepo, OpcRepository, OpcStoreState, OpcConnectorInterface, OpcDataType, OpcNodeEntity (+2 more)

### Community 20 - "Community 20"
Cohesion: 0.18
Nodes (5): lastRecordedAt, lastRecordedValue, pendingPersist, Store, SampleQuality

### Community 21 - "Community 21"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 22 - "Community 22"
Cohesion: 0.09
Nodes (33): alarmRepo, deploymentRepo, objectRepo, propertyRepo, widgetRepo, AlarmEngine, historyEngine, makeProp() (+25 more)

### Community 23 - "Community 23"
Cohesion: 0.22
Nodes (6): CutoffStatus, OmmCutoffSnapshot, CompareViewProps, CutoffCardProps, CutoffHistory(), STATUS_CONFIG

### Community 25 - "Community 25"
Cohesion: 0.29
Nodes (7): TrendChartCard(), TrendChartCardProps, xGridTicks, yGridTicks, TimeWindow, TrendChartExpandedModal(), useResizeObserver()

### Community 26 - "Community 26"
Cohesion: 0.18
Nodes (12): WidgetLayout(), buildTree(), useWidgetStore, WidgetBindingProperty, WidgetElement, WidgetTreeNode, ToolButton(), ToolButtonProps (+4 more)

### Community 27 - "Community 27"
Cohesion: 0.26
Nodes (3): BaseRepository, SingletonRepository, if()

### Community 28 - "Community 28"
Cohesion: 0.16
Nodes (9): TankGeometrySvg(), TankGeometrySvgProps, DEFAULT_CONFIG, DEFAULT_FIELD_BINDINGS, GEOMETRY_OPTIONS, getFillColor(), PROPERTY_UNITS, FieldBinding (+1 more)

### Community 29 - "Community 29"
Cohesion: 0.17
Nodes (8): AdminEditModalProps, AdminPanel(), AdminSection, Column, CrudTableProps, EditModalProps, FieldDef, SECTIONS

### Community 30 - "Community 30"
Cohesion: 0.27
Nodes (7): OmmSimulationEngine, simulateWaveform(), OmmEquipment, OmmEvent, OmmHistoryPoint, OmmMovement, OmmSimulatorState

### Community 31 - "Community 31"
Cohesion: 0.27
Nodes (10): ObjectPropertySimRow, scriptRepo, templateRepo, ExportImportService, InheritanceService, EntityType, ExportDataPayload, MergedProperty (+2 more)

### Community 32 - "Community 32"
Cohesion: 0.21
Nodes (11): RuntimeWidgetInstance(), ScreenRuntimePage(), extractPropertyName(), FillLevelStyle, resolveColorDynamic(), resolveCustomPropValue(), ResolvedWidgetElementStyle, resolveFillLevelDynamic() (+3 more)

### Community 33 - "Community 33"
Cohesion: 0.25
Nodes (11): markOmmSeeded(), hoursAgo(), hoursFromNow(), makeAlignments(), makeEquipments(), makeMovement(), movNum(), nextCutoff() (+3 more)

### Community 34 - "Community 34"
Cohesion: 0.22
Nodes (8): GlobalPropertyPickerModalProps, associatedWidgetRepo, AssociatedWidgetRepository, mockConfigRepo, screenRepo, IndexedProperty, PropertyBrowserService, AssociatedWidgetEntity

### Community 38 - "Community 38"
Cohesion: 0.26
Nodes (10): CellPos, GridCanvas(), GridCanvasProps, GridCardInspectorProps, getLevelColor(), IndustrialTankCard(), IndustrialTankCardProps, resolveObjectPropValue() (+2 more)

### Community 39 - "Community 39"
Cohesion: 0.32
Nodes (6): GridCardInspector(), CardStatus, generateRandomTankCard(), reRandomizeTankValues(), STATUS_LIST, TANK_PRESETS

### Community 40 - "Community 40"
Cohesion: 0.43
Nodes (4): CardVisibleFields, GridScreenEntity, gridScreenRepo, GridScreenStoreState

## Knowledge Gaps
- **249 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+244 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 8` to `Community 34`, `Community 5`, `Community 38`, `Community 39`, `Community 6`, `Community 10`, `Community 11`, `Community 15`, `Community 16`, `Community 17`, `Community 19`, `Community 25`, `Community 26`, `Community 28`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `useObjectModelStore` connect `Community 8` to `Community 32`, `Community 1`, `Community 34`, `Community 5`, `Community 38`, `Community 7`, `Community 40`, `Community 10`, `Community 11`, `Community 22`, `Community 25`, `Community 28`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `useOmmStore` connect `Community 15` to `Community 4`, `Community 8`, `Community 16`, `Community 22`, `Community 23`, `Community 29`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _249 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05201292976785189 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.09831649831649832 - nodes in this community are weakly interconnected._