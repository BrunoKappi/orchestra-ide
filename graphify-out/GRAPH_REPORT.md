# Graph Report - MVP 2  (2026-08-10)

## Corpus Check
- 173 files · ~192,119 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1056 nodes · 2983 edges · 37 communities (33 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8b1edd0b`
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
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 43|Community 43]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 84 edges
2. `useObjectModelStore` - 77 edges
3. `useOmmStore` - 42 edges
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
- `SelectionCheckboxCell()` --calls--> `useOmmStore`  [EXTRACTED]
  src/features/omm/components/table/columnDefs.tsx → src/features/omm/store/useOmmStore.ts
- `StatusCell()` --calls--> `useOmmStore`  [EXTRACTED]
  src/features/omm/components/table/columnDefs.tsx → src/features/omm/store/useOmmStore.ts
- `PriorityCell()` --calls--> `useOmmStore`  [EXTRACTED]
  src/features/omm/components/table/columnDefs.tsx → src/features/omm/store/useOmmStore.ts
- `NumberCell()` --calls--> `useOmmStore`  [EXTRACTED]
  src/features/omm/components/table/columnDefs.tsx → src/features/omm/store/useOmmStore.ts

## Import Cycles
- 3-file cycle: `src/features/widget-editor/Dynamics/FillDynamicEditor.tsx -> src/features/widget-editor/WidgetInspectorPanel.tsx -> src/features/widget-editor/Dynamics/StrokeDynamicEditor.tsx -> src/features/widget-editor/Dynamics/FillDynamicEditor.tsx`

## Communities (37 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.19
Nodes (13): IDELayout(), DeploymentTree(), DerivationTree(), OrchestraPage(), DeploymentTreeNode, DerivationTreeNode, ContextMenu(), ContextMenuItem (+5 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (53): AnalyticsTab(), ConnectionDesignerTab(), CustomFlowNode, nodeIcons, categoryIcons, DataSourcesTab(), BlockDefinition, FlowBlockLibrary() (+45 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (37): dependencies, bpmn-js, clsx, dayjs, @hookform/resolvers, immer, lucide-react, react (+29 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (49): alarmRepo, alignmentRepo, areaRepo, auditRepo, clearAllOmmData(), cutoffRepo, defaultSimState, engUnitRepo (+41 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (16): ScreenLayout(), ScreenDesignerPage(), ScreenCanvasEditor(), WidgetInstanceRenderer(), ScreenElementInspector(), ContextMenuState, RenameState, ScreenTree() (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.24
Nodes (3): gridScreenRepo, screenFolderRepo, STORAGE_KEYS

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (52): ActiveDirectoryTab(), ACTIONS, MODULES, PermissionMatrixView(), UserModal(), UserModalProps, SecurityPage(), ActiveDirectoryActions (+44 more)

### Community 8 - "Community 8"
Cohesion: 0.15
Nodes (24): ObjectSelectorModal(), ObjectSelectorModalProps, AlarmConfigModal(), WidgetThumbnail(), CentralEditor(), EquipmentGraphicConfigEditor(), ExportImportModal(), DEFAULT_CONFIG (+16 more)

### Community 9 - "Community 9"
Cohesion: 0.23
Nodes (8): alarmRepo, AlarmRepository, objectRepo, AlarmEngine, MovementEntity, OmmMovementSyncEntry, AlarmEvent, AlarmRule

### Community 10 - "Community 10"
Cohesion: 0.06
Nodes (55): edgeTypes, FlowV2Canvas(), FlowV2CanvasProps, nodeTypes, FlowV2EditorContent(), FlowV2EditorModal(), FlowV2Header(), FlowV2HeaderProps (+47 more)

### Community 11 - "Community 11"
Cohesion: 0.06
Nodes (47): CellPos, GridCanvas(), GridCanvasProps, GridCardInspector(), GridCardInspectorProps, GridDashboardHeader(), GridDashboardHeaderProps, GridScreenManagerModal() (+39 more)

### Community 13 - "Community 13"
Cohesion: 0.23
Nodes (5): DeploymentRepository, ScriptRepository, DeploymentFolderEntity, DeploymentNodeEntity, ScriptEntity

### Community 14 - "Community 14"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 15 - "Community 15"
Cohesion: 0.09
Nodes (27): ColDef, DEFAULT_VISIBLE_COLUMNS, movementColumnDefs, NumberCell(), PRIORITY_CONFIG, PriorityCell(), PriorityCellSelector(), SelectionCheckboxCell() (+19 more)

### Community 16 - "Community 16"
Cohesion: 0.09
Nodes (25): AdminPanel(), OmmLayout(), VIEW_TABS, KpiCardProps, OmmKpiHeader(), GROUP_BY_OPTIONS, GroupByOption, OmmToolbar() (+17 more)

### Community 17 - "Community 17"
Cohesion: 0.06
Nodes (49): FillDynamicEditor(), FillDynamicEditorProps, FillLevelDynamicEditor(), FillLevelDynamicEditorProps, StrokeDynamicEditor(), StrokeDynamicEditorProps, validateDynamicRule(), ValidationError (+41 more)

### Community 18 - "Community 18"
Cohesion: 0.27
Nodes (6): MockConfigRepository, MockSimulationService, DataType, MockConfig, MockConfigParams, MockPresetType

### Community 19 - "Community 19"
Cohesion: 0.31
Nodes (8): opcRepo, OpcRepository, OpcStoreState, OpcConnectorInterface, OpcDataType, OpcNodeEntity, OpcNodeType, OpcQuality

### Community 21 - "Community 21"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 22 - "Community 22"
Cohesion: 0.08
Nodes (31): deploymentRepo, makeProp(), PropDef, SeedService, activeEvents, currentConfig, id, inheritedProp (+23 more)

### Community 24 - "Community 24"
Cohesion: 0.27
Nodes (6): PropertyRepository, TemplateRepository, PropertyEntity, TemplateEntity, safeGetItem(), safeSetItem()

### Community 26 - "Community 26"
Cohesion: 0.19
Nodes (13): UniversalMappingTab(), WidgetLayout(), AssociatedWidgetsEditor(), OpcBrowserPage(), ExplorerTab, ScreenExplorerPanel(), useOpcStore, buildTree() (+5 more)

### Community 27 - "Community 27"
Cohesion: 0.26
Nodes (3): BaseRepository, SingletonRepository, if()

### Community 28 - "Community 28"
Cohesion: 0.06
Nodes (24): TankGeometrySvg(), TankGeometrySvgProps, TankFlowVisualizer(), TankFlowVisualizerProps, DEFAULT_CONFIG, DEFAULT_FIELD_BINDINGS, GEOMETRY_OPTIONS, getFillColor() (+16 more)

### Community 29 - "Community 29"
Cohesion: 0.10
Nodes (12): AdminEditModalProps, AdminSection, Column, CrudTableProps, EditModalProps, FieldDef, SECTIONS, CutoffStatus (+4 more)

### Community 30 - "Community 30"
Cohesion: 0.27
Nodes (7): OmmSimulationEngine, simulateWaveform(), OmmEquipment, OmmEvent, OmmHistoryPoint, OmmMovement, OmmSimulatorState

### Community 31 - "Community 31"
Cohesion: 0.25
Nodes (11): WidgetMappingModalProps, ObjectPropertySimRow, templateRepo, ExportImportService, InheritanceService, EntityType, ExportDataPayload, MergedAssociatedWidget (+3 more)

### Community 32 - "Community 32"
Cohesion: 0.17
Nodes (11): HeaderNavigation(), FlowsV2Page(), LogsPage(), OmmPage(), RuntimePage(), SavedView, ScreenRuntimePage(), WidgetsPage() (+3 more)

### Community 33 - "Community 33"
Cohesion: 0.25
Nodes (11): markOmmSeeded(), hoursAgo(), hoursFromNow(), makeAlignments(), makeEquipments(), makeMovement(), movNum(), nextCutoff() (+3 more)

### Community 34 - "Community 34"
Cohesion: 0.17
Nodes (8): GlobalPropertyPickerModalProps, RuntimeWidgetInstance(), associatedWidgetRepo, mockConfigRepo, screenRepo, IndexedProperty, PropertyBrowserService, ScreenEntity

### Community 36 - "Community 36"
Cohesion: 0.20
Nodes (9): CHART_PADDING, ChartData, CURVE_COLORS, HistorianPage(), PeriodPreset, SelectedVariable, TrendChart(), TrendChartProps (+1 more)

### Community 37 - "Community 37"
Cohesion: 0.24
Nodes (6): LogStore, LogStoreActions, LogStoreState, AuditLog, LogOperation, LogSeverity

## Knowledge Gaps
- **251 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+246 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 8` to `Community 0`, `Community 32`, `Community 34`, `Community 36`, `Community 5`, `Community 10`, `Community 11`, `Community 17`, `Community 19`, `Community 26`, `Community 28`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Why does `useObjectModelStore` connect `Community 8` to `Community 0`, `Community 32`, `Community 34`, `Community 36`, `Community 5`, `Community 7`, `Community 10`, `Community 11`, `Community 22`, `Community 26`, `Community 28`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `useOmmStore` connect `Community 16` to `Community 4`, `Community 8`, `Community 15`, `Community 22`, `Community 28`, `Community 29`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _251 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05348101265822785 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.09831649831649832 - nodes in this community are weakly interconnected._