# Graph Report - MVP 2  (2026-08-07)

## Corpus Check
- 163 files · ~172,082 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1010 nodes · 2813 edges · 39 communities (37 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0a7fc7fd`
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
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 43|Community 43]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 76 edges
2. `useObjectModelStore` - 72 edges
3. `useOmmStore` - 39 edges
4. `useConnectivityStore` - 27 edges
5. `useWidgetStore` - 25 edges
6. `OmmStoreActions` - 21 edges
7. `STORAGE_KEYS` - 21 edges
8. `ObjectModelStoreState` - 21 edges
9. `InheritanceService` - 19 edges
10. `safeSetItem()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `IndustrialTankCardProps` --references--> `TankCardData`  [EXTRACTED]
  src/features/grid-dashboard/components/IndustrialTankCard.tsx → src/features/grid-dashboard/types.ts
- `WidgetThumbnail()` --calls--> `cn()`  [EXTRACTED]
  src/features/object-model/AssociatedWidgetsEditor.tsx → src/utils/cn.ts
- `WidgetMappingModalProps` --references--> `MergedAssociatedWidget`  [EXTRACTED]
  src/features/object-model/WidgetMappingModal.tsx → src/types/domain.ts
- `ContextMenuState` --references--> `ScreenTreeNode`  [EXTRACTED]
  src/features/screen-designer/ScreenTree.tsx → src/types/domain.ts
- `ToolButton()` --calls--> `cn()`  [EXTRACTED]
  src/features/widget-editor/WidgetCanvasEditor.tsx → src/utils/cn.ts

## Import Cycles
- 3-file cycle: `src/features/widget-editor/Dynamics/FillDynamicEditor.tsx -> src/features/widget-editor/WidgetInspectorPanel.tsx -> src/features/widget-editor/Dynamics/StrokeDynamicEditor.tsx -> src/features/widget-editor/Dynamics/FillDynamicEditor.tsx`

## Communities (39 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.18
Nodes (10): ActionType, ConditionNode, EventAction, EventConfig, EventHistoryLog, LeafCondition, LeafConditionType, LogicalCondition (+2 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (53): AnalyticsTab(), ConnectionDesignerTab(), CustomFlowNode, nodeIcons, categoryIcons, DataSourcesTab(), BlockDefinition, FlowBlockLibrary() (+45 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (13): AlarmRepository, ObjectRepository, PropertyRepository, STORAGE_KEYS, TemplateRepository, AlarmEngine, AlarmEvent, AlarmRule (+5 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (37): dependencies, bpmn-js, clsx, dayjs, @hookform/resolvers, immer, lucide-react, react (+29 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (49): alarmRepo, alignmentRepo, areaRepo, auditRepo, clearAllOmmData(), cutoffRepo, defaultSimState, engUnitRepo (+41 more)

### Community 5 - "Community 5"
Cohesion: 0.24
Nodes (8): eventRepo, historyRepo, OmmSimulationEngine, simulateWaveform(), OmmEvent, OmmHistoryPoint, OmmMovement, OmmSimulatorState

### Community 6 - "Community 6"
Cohesion: 0.23
Nodes (7): widgetFolderRepo, WidgetFolderRepository, WidgetRepository, WidgetSeedService, WidgetEntity, WidgetFolderEntity, WidgetNodeEntity

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (52): ActiveDirectoryTab(), ACTIONS, MODULES, PermissionMatrixView(), UserModal(), UserModalProps, SecurityPage(), ActiveDirectoryActions (+44 more)

### Community 8 - "Community 8"
Cohesion: 0.20
Nodes (13): HeaderNavigation(), AlarmViewerPage(), FlowsV2Page(), CHART_PADDING, ChartData, CURVE_COLORS, HistorianPage(), PeriodPreset (+5 more)

### Community 9 - "Community 9"
Cohesion: 0.14
Nodes (20): UniversalMappingTab(), AlarmConfigModal(), AssociatedWidgetsEditor(), WidgetThumbnail(), CentralEditor(), ExportImportModal(), DEFAULT_CONFIG, HistoryConfigModal() (+12 more)

### Community 10 - "Community 10"
Cohesion: 0.06
Nodes (50): edgeTypes, FlowV2Canvas(), FlowV2CanvasProps, nodeTypes, FlowV2EditorContent(), FlowV2Header(), FlowV2HeaderProps, FlowV2InspectorPanel() (+42 more)

### Community 11 - "Community 11"
Cohesion: 0.13
Nodes (22): CellPos, GridCanvas(), GridCanvasProps, GridCardInspector(), GridCardInspectorProps, GridDashboardHeader(), GridDashboardHeaderProps, GridSettingsModal() (+14 more)

### Community 12 - "Community 12"
Cohesion: 0.20
Nodes (11): ScreenLayout(), ScreenCanvasEditor(), WidgetInstanceRenderer(), ScreenElementInspector(), ExplorerTab, ScreenExplorerPanel(), ContextMenuState, RenameState (+3 more)

### Community 13 - "Community 13"
Cohesion: 0.42
Nodes (3): DeploymentRepository, DeploymentFolderEntity, DeploymentNodeEntity

### Community 14 - "Community 14"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 15 - "Community 15"
Cohesion: 0.09
Nodes (29): useOmmStore, ColDef, DEFAULT_VISIBLE_COLUMNS, movementColumnDefs, NumberCell(), PRIORITY_CONFIG, PriorityCell(), PriorityCellSelector() (+21 more)

### Community 16 - "Community 16"
Cohesion: 0.09
Nodes (18): VIEW_TABS, KpiCardProps, OmmKpiHeader(), GROUP_BY_OPTIONS, GroupByOption, OmmToolbar(), ToolbarButton(), ToolbarButtonProps (+10 more)

### Community 17 - "Community 17"
Cohesion: 0.16
Nodes (18): FillDynamicEditor(), FillDynamicEditorProps, FillLevelDynamicEditor(), FillLevelDynamicEditorProps, StrokeDynamicEditor(), StrokeDynamicEditorProps, validateDynamicRule(), ValidationError (+10 more)

### Community 18 - "Community 18"
Cohesion: 0.06
Nodes (53): GlobalPropertyPickerModal(), GlobalPropertyPickerModalProps, PRESET_OPTIONS, ObjectPropertySimRow, alarmRepo, associatedWidgetRepo, AssociatedWidgetRepository, deploymentRepo (+45 more)

### Community 19 - "Community 19"
Cohesion: 0.26
Nodes (10): getNodeIcon(), OpcBrowserPage(), opcRepo, OpcRepository, OpcStoreState, OpcConnectorInterface, OpcDataType, OpcNodeEntity (+2 more)

### Community 20 - "Community 20"
Cohesion: 0.08
Nodes (10): historyEngine, lastRecordedAt, lastRecordedValue, Store, MovementEntity, OmmMovementSyncEntry, SimulationEngine, SampleQuality (+2 more)

### Community 21 - "Community 21"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 22 - "Community 22"
Cohesion: 0.14
Nodes (11): FlowV2EditorModal(), OmmLayout(), IDELayout(), GridDashboardPage(), OmmPage(), OrchestraPage(), RuntimePage(), ScreenDesignerPage() (+3 more)

### Community 23 - "Community 23"
Cohesion: 0.25
Nodes (6): CutoffStatus, OmmCutoffSnapshot, CompareViewProps, CutoffCardProps, CutoffHistory(), STATUS_CONFIG

### Community 24 - "Community 24"
Cohesion: 0.16
Nodes (13): WidgetLayout(), buildTree(), useWidgetStore, WidgetBindingProperty, WidgetTreeNode, ResizableSplitPane(), ResizableSplitPaneProps, ToolButton() (+5 more)

### Community 25 - "Community 25"
Cohesion: 0.32
Nodes (9): DeploymentTree(), DerivationTree(), DeploymentTreeNode, DerivationTreeNode, ContextMenu(), ContextMenuItem, ContextMenuProps, buildDeploymentTree() (+1 more)

### Community 26 - "Community 26"
Cohesion: 0.20
Nodes (12): screenFolderRepo, ScreenStoreState, ScreenToolType, AlarmConditionType, FillLevelConfig, ScreenElement, ScreenElementType, ScreenEntity (+4 more)

### Community 27 - "Community 27"
Cohesion: 0.26
Nodes (3): BaseRepository, SingletonRepository, if()

### Community 28 - "Community 28"
Cohesion: 0.14
Nodes (11): TankGeometrySvg(), TankGeometrySvgProps, TankFlowVisualizer(), TankFlowVisualizerProps, DEFAULT_CONFIG, DEFAULT_FIELD_BINDINGS, EquipmentGraphicConfigEditor(), GEOMETRY_OPTIONS (+3 more)

### Community 29 - "Community 29"
Cohesion: 0.17
Nodes (8): AdminEditModalProps, AdminPanel(), AdminSection, Column, CrudTableProps, EditModalProps, FieldDef, SECTIONS

### Community 30 - "Community 30"
Cohesion: 0.21
Nodes (11): RuntimeWidgetInstance(), ScreenRuntimePage(), extractPropertyName(), FillLevelStyle, resolveColorDynamic(), resolveCustomPropValue(), ResolvedWidgetElementStyle, resolveFillLevelDynamic() (+3 more)

### Community 31 - "Community 31"
Cohesion: 0.39
Nodes (7): InspectorTabType, ToolType, WidgetStoreState, WidgetCustomPropertyDataType, WidgetElement, WidgetElementBinding, WidgetElementType

### Community 33 - "Community 33"
Cohesion: 0.25
Nodes (11): markOmmSeeded(), hoursAgo(), hoursFromNow(), makeAlignments(), makeEquipments(), makeMovement(), movNum(), nextCutoff() (+3 more)

### Community 34 - "Community 34"
Cohesion: 0.60
Nodes (4): getLevelColor(), IndustrialTankCard(), IndustrialTankCardProps, resolveObjectPropValue()

### Community 36 - "Community 36"
Cohesion: 0.14
Nodes (11): OmmPriority, ModalTab, MovementModal(), PRIORITY_OPTIONS, STATUS_COLORS, STATUS_LABELS, TABS, OrderDialog() (+3 more)

## Knowledge Gaps
- **240 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+235 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 8` to `Community 32`, `Community 34`, `Community 36`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 17`, `Community 18`, `Community 19`, `Community 22`, `Community 24`, `Community 25`, `Community 28`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `STORAGE_KEYS` connect `Community 2` to `Community 35`, `Community 4`, `Community 6`, `Community 7`, `Community 10`, `Community 13`, `Community 18`, `Community 19`, `Community 20`, `Community 26`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `useObjectModelStore` connect `Community 9` to `Community 32`, `Community 34`, `Community 7`, `Community 8`, `Community 10`, `Community 11`, `Community 12`, `Community 16`, `Community 18`, `Community 20`, `Community 22`, `Community 25`, `Community 28`, `Community 30`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _240 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05348101265822785 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._