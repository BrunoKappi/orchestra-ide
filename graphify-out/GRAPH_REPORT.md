# Graph Report - MVP 2  (2026-07-31)

## Corpus Check
- 181 files · ~206,668 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1038 nodes · 2924 edges · 36 communities (32 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ed15822c`
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
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]

## God Nodes (most connected - your core abstractions)
1. `useObjectModelStore` - 84 edges
2. `cn()` - 82 edges
3. `useOmmStore` - 54 edges
4. `useWidgetStore` - 31 edges
5. `useConnectivityStore` - 28 edges
6. `useFlowStore` - 23 edges
7. `HeaderNavigation()` - 22 edges
8. `ObjectEntity` - 22 edges
9. `OmmStoreActions` - 21 edges
10. `STORAGE_KEYS` - 21 edges

## Surprising Connections (you probably didn't know these)
- `OpcBrowserPage()` --calls--> `getNodeIcon()`  [INFERRED]
  src/pages/OpcBrowserPage.tsx → src/features/flow-v2/nodes/FlowCardNode.tsx
- `HistoryConfigModal()` --calls--> `Field()`  [INFERRED]
  src/features/object-model/HistoryConfigModal.tsx → src/features/omm/components/detail/tabs/GeneralTab.tsx
- `App()` --calls--> `useObjectModelStore`  [EXTRACTED]
  src/App.tsx → src/store/useObjectModelStore.ts
- `IndustrialNodeDef` --references--> `IndustrialNodeType`  [EXTRACTED]
  src/features/flow-designer/IndustrialPaletteSidebar.tsx → src/types/flow.ts
- `PropertySelectorModal()` --calls--> `useObjectModelStore`  [EXTRACTED]
  src/features/flow-designer/NodePropertyInspector.tsx → src/store/useObjectModelStore.ts

## Import Cycles
- 3-file cycle: `src/features/widget-editor/Dynamics/FillDynamicEditor.tsx -> src/features/widget-editor/WidgetInspectorPanel.tsx -> src/features/widget-editor/Dynamics/StrokeDynamicEditor.tsx -> src/features/widget-editor/Dynamics/FillDynamicEditor.tsx`

## Communities (36 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.15
Nodes (21): CellPos, GridCanvas(), GridCanvasProps, GridCardInspector(), GridCardInspectorProps, GridDashboardHeader(), GridDashboardHeaderProps, GridSettingsModal() (+13 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (53): FillDynamicEditor(), FillDynamicEditorProps, FillLevelDynamicEditor(), FillLevelDynamicEditorProps, StrokeDynamicEditor(), StrokeDynamicEditorProps, validateDynamicRule(), ValidationError (+45 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (37): dependencies, bpmn-js, clsx, dayjs, @hookform/resolvers, immer, lucide-react, react (+29 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (39): alarmRepo, alignmentRepo, areaRepo, auditRepo, clearAllOmmData(), cutoffRepo, defaultSimState, engUnitRepo (+31 more)

### Community 4 - "Community 4"
Cohesion: 0.40
Nodes (5): INDUSTRIAL_NODES, IndustrialNodeDef, IndustrialPaletteSidebarProps, propertyRepo, FlowContextType

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (24): UniversalMappingTab(), HeaderNavigationProps, ExportImportModal(), DEFAULT_CONFIG, HistoryConfigModal(), msToHours(), PropertyFormData, PropertyModal() (+16 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (26): AdminPanel(), OmmLayout(), VIEW_TABS, DetailPanel(), KpiCardProps, OmmKpiHeader(), GROUP_BY_OPTIONS, GroupByOption (+18 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (18): COMPARISON_OPERATORS, PRESET_COLORS, PropertySelectorModal(), PropertySelectorProps, flowchartRepo, FlowValidationEngine, FlowStoreState, mapIndustrialTypeToBpmnType() (+10 more)

### Community 10 - "Community 10"
Cohesion: 0.42
Nodes (6): FlowV2CanvasProps, FlowV2InspectorPanelProps, FlowV2SimulationEngine, SimulationStepResult, FlowEdgeV2, FlowNodeV2

### Community 11 - "Community 11"
Cohesion: 0.05
Nodes (51): ActiveDirectoryTab(), ACTIONS, MODULES, PermissionMatrixView(), UserModal(), UserModalProps, SecurityPage(), ActiveDirectoryActions (+43 more)

### Community 15 - "Community 15"
Cohesion: 0.12
Nodes (12): ScreenLayout(), ScreenCanvasEditor(), WidgetInstanceRenderer(), ScreenElementInspector(), ExplorerTab, ScreenExplorerPanel(), ContextMenuState, RenameState (+4 more)

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
Cohesion: 0.24
Nodes (11): IDELayout(), DeploymentTree(), DerivationTree(), OrchestraPage(), DeploymentTreeNode, DerivationTreeNode, ContextMenu(), ContextMenuItem (+3 more)

### Community 23 - "Community 23"
Cohesion: 0.22
Nodes (10): FlowV2EditorModal(), FlowV2Header(), FlowV2HeaderProps, FlowV2InspectorPanel(), FlowV2Palette(), FlowV2PaletteProps, PALETTE_ITEMS, PaletteItem (+2 more)

### Community 24 - "Community 24"
Cohesion: 0.27
Nodes (8): opcRepo, OpcRepository, OpcStoreState, OpcConnectorInterface, OpcDataType, OpcNodeEntity, OpcNodeType, OpcQuality

### Community 25 - "Community 25"
Cohesion: 0.13
Nodes (10): OmmSimulationEngine, simulateWaveform(), EVENT_ICONS, EventItem(), HistoryTab(), SEVERITY_STYLES, SIM_MODES, SimulationTab() (+2 more)

### Community 27 - "Community 27"
Cohesion: 0.05
Nodes (53): AnalyticsTab(), ConnectionDesignerTab(), CustomFlowNode, nodeIcons, categoryIcons, DataSourcesTab(), BlockDefinition, FlowBlockLibrary() (+45 more)

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (8): CustomKpi, DEFAULT_WIDGETS, KpiFilter, KpiStore, KpiStoreActions, KpiStoreState, KpiWidget, STORAGE_KEYS

### Community 31 - "Community 31"
Cohesion: 0.13
Nodes (18): edgeTypes, FlowV2Canvas(), nodeTypes, AnimatedFlowEdge, ContainerNode, FlowCardNode, getNodeIcon(), StickyNoteNode (+10 more)

### Community 32 - "Community 32"
Cohesion: 0.13
Nodes (11): DatabasePage(), DB_TABLES, DbTable, EventEnginePage(), FlowsV2Page(), OmmPage(), OpcBrowserPage(), ScreenDesignerPage() (+3 more)

### Community 33 - "Community 33"
Cohesion: 0.17
Nodes (13): WidgetLayout(), HeaderNavigation(), PropertyBrowserPage(), buildTree(), useWidgetStore, WidgetBindingProperty, WidgetTreeNode, ToolButton() (+5 more)

### Community 34 - "Community 34"
Cohesion: 0.10
Nodes (16): alarmRepo, deploymentRepo, DeploymentRepository, objectRepo, ObjectRepository, ScriptRepository, STORAGE_KEYS, templateRepo (+8 more)

### Community 35 - "Community 35"
Cohesion: 0.22
Nodes (7): CHART_PADDING, CURVE_COLORS, HistorianPage(), PeriodPreset, SelectedVariable, TrendChart(), TrendChartProps

### Community 36 - "Community 36"
Cohesion: 0.17
Nodes (13): FlowV2EditorContent(), FlowV2PropertyInspector(), FlowV2PropertyInspectorProps, TabType, BpmnCanvas(), BpmnCanvasProps, COLOR_MAP, ICON_MAP (+5 more)

### Community 40 - "Community 40"
Cohesion: 0.18
Nodes (19): GlobalPropertyPickerModal(), IndustrialPaletteSidebar(), AlarmConfigModal(), AssociatedWidgetsEditor(), WidgetThumbnail(), CentralEditor(), MockConfigModal(), PRESET_OPTIONS (+11 more)

### Community 41 - "Community 41"
Cohesion: 0.07
Nodes (36): GlobalPropertyPickerModalProps, WidgetMappingModalProps, RuntimeWidgetInstance(), ObjectPropertySimRow, associatedWidgetRepo, AssociatedWidgetRepository, mockConfigRepo, MockConfigRepository (+28 more)

## Knowledge Gaps
- **233 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+228 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useObjectModelStore` connect `Community 40` to `Community 32`, `Community 33`, `Community 35`, `Community 36`, `Community 4`, `Community 6`, `Community 41`, `Community 9`, `Community 11`, `Community 15`, `Community 20`, `Community 21`, `Community 31`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `useOmmStore` connect `Community 7` to `Community 3`, `Community 6`, `Community 16`, `Community 17`, `Community 18`, `Community 20`, `Community 25`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `cn()` connect `Community 40` to `Community 0`, `Community 33`, `Community 32`, `Community 35`, `Community 36`, `Community 4`, `Community 6`, `Community 1`, `Community 41`, `Community 10`, `Community 9`, `Community 15`, `Community 21`, `Community 23`, `Community 24`, `Community 31`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _233 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1477832512315271 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05002337540906966 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._