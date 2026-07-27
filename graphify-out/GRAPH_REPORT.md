# Graph Report - MVP 2  (2026-07-27)

## Corpus Check
- 138 files · ~154,670 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 840 nodes · 2383 edges · 30 communities (24 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c21ddf17`
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
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]

## God Nodes (most connected - your core abstractions)
1. `useObjectModelStore` - 76 edges
2. `cn()` - 61 edges
3. `useOmmStore` - 54 edges
4. `useWidgetStore` - 29 edges
5. `ObjectEntity` - 22 edges
6. `OmmStoreActions` - 21 edges
7. `InheritanceService` - 21 edges
8. `STORAGE_KEYS` - 20 edges
9. `HeaderNavigation()` - 19 edges
10. `ObjectModelStoreState` - 18 edges

## Surprising Connections (you probably didn't know these)
- `HistoryConfigModal()` --calls--> `Field()`  [INFERRED]
  src/features/object-model/HistoryConfigModal.tsx → src/features/omm/components/detail/tabs/GeneralTab.tsx
- `PropertySelectorModal()` --calls--> `useObjectModelStore`  [EXTRACTED]
  src/features/flow-designer/NodePropertyInspector.tsx → src/store/useObjectModelStore.ts
- `EventItem()` --calls--> `useOmmStore`  [EXTRACTED]
  src/features/omm/components/detail/tabs/HistoryTab.tsx → src/features/omm/store/useOmmStore.ts
- `StatusCellSelector()` --calls--> `useOmmStore`  [EXTRACTED]
  src/features/omm/components/table/columnDefs.tsx → src/features/omm/store/useOmmStore.ts
- `PriorityCellSelector()` --calls--> `useOmmStore`  [EXTRACTED]
  src/features/omm/components/table/columnDefs.tsx → src/features/omm/store/useOmmStore.ts

## Import Cycles
- 3-file cycle: `src/features/widget-editor/Dynamics/FillDynamicEditor.tsx -> src/features/widget-editor/WidgetInspectorPanel.tsx -> src/features/widget-editor/Dynamics/StrokeDynamicEditor.tsx -> src/features/widget-editor/Dynamics/FillDynamicEditor.tsx`

## Communities (30 total, 6 thin omitted)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (27): FillDynamicEditor(), FillDynamicEditorProps, FillLevelDynamicEditor(), FillLevelDynamicEditorProps, StrokeDynamicEditor(), StrokeDynamicEditorProps, validateDynamicRule(), ValidationError (+19 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (36): dependencies, bpmn-js, clsx, dayjs, @hookform/resolvers, immer, lucide-react, react (+28 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (39): alarmRepo, alignmentRepo, areaRepo, auditRepo, clearAllOmmData(), cutoffRepo, defaultSimState, engUnitRepo (+31 more)

### Community 4 - "Community 4"
Cohesion: 0.21
Nodes (13): widgetFolderRepo, WidgetFolderRepository, widgetRepo, WidgetSeedService, InspectorTabType, ToolType, WidgetStoreState, WidgetCustomPropertyDataType (+5 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (76): IndustrialPaletteSidebar(), IDELayout(), HeaderNavigation(), HeaderNavigationProps, AlarmConfigModal(), AssociatedWidgetsEditor(), WidgetThumbnail(), CentralEditor() (+68 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (26): AdminPanel(), OmmLayout(), VIEW_TABS, DetailPanel(), KpiCardProps, OmmKpiHeader(), GROUP_BY_OPTIONS, GroupByOption (+18 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 9 - "Community 9"
Cohesion: 0.08
Nodes (32): BpmnCanvas(), BpmnCanvasProps, COLOR_MAP, ICON_MAP, FlowDesignerModal(), INDUSTRIAL_NODES, IndustrialNodeDef, IndustrialPaletteSidebarProps (+24 more)

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (31): WidgetMappingModalProps, RuntimeWidgetInstance(), ObjectPropertySimRow, associatedWidgetRepo, AssociatedWidgetRepository, deploymentRepo, mockConfigRepo, MockConfigRepository (+23 more)

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (27): ACTIONS, MODULES, PermissionMatrixView(), UserModal(), UserModalProps, SecurityPage(), DEFAULT_AUDITS, DEFAULT_GROUPS (+19 more)

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (17): screenFolderRepo, ContextMenuState, RenameState, buildTree(), ScreenStoreState, ScreenToolType, AlarmConditionType, FillLevelConfig (+9 more)

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
Cohesion: 0.08
Nodes (21): ConditionNodeEditor(), ConditionNodeEditorProps, alarmRepo, AlarmRepository, eventRepo, EventRepository, AlarmEngine, EventEngine (+13 more)

### Community 21 - "Community 21"
Cohesion: 0.42
Nodes (3): DeploymentRepository, DeploymentFolderEntity, DeploymentNodeEntity

### Community 23 - "Community 23"
Cohesion: 0.15
Nodes (13): WidgetLayout(), WidgetsPage(), WidgetInstanceRenderer(), useWidgetStore, WidgetBindingProperty, ResizableSplitPane(), ResizableSplitPaneProps, ToolButton() (+5 more)

### Community 24 - "Community 24"
Cohesion: 0.24
Nodes (10): OpcBrowserPage(), opcRepo, OpcRepository, OpcStoreState, useOpcStore, OpcConnectorInterface, OpcDataType, OpcNodeEntity (+2 more)

### Community 25 - "Community 25"
Cohesion: 0.13
Nodes (10): OmmSimulationEngine, simulateWaveform(), EVENT_ICONS, EventItem(), HistoryTab(), SEVERITY_STYLES, SIM_MODES, SimulationTab() (+2 more)

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (8): CustomKpi, DEFAULT_WIDGETS, KpiFilter, KpiStore, KpiStoreActions, KpiStoreState, KpiWidget, STORAGE_KEYS

### Community 30 - "Community 30"
Cohesion: 0.15
Nodes (9): ScreenLayout(), ScreenDesignerPage(), propertyRepo, ScreenCanvasEditor(), ScreenElementInspector(), ExplorerTab, ScreenExplorerPanel(), ScreenTree() (+1 more)

## Knowledge Gaps
- **184 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `name` (+179 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useOmmStore` connect `Community 7` to `Community 3`, `Community 6`, `Community 16`, `Community 17`, `Community 18`, `Community 20`, `Community 25`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Why does `useObjectModelStore` connect `Community 6` to `Community 9`, `Community 10`, `Community 11`, `Community 20`, `Community 30`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Why does `cn()` connect `Community 6` to `Community 1`, `Community 9`, `Community 15`, `Community 23`, `Community 24`, `Community 30`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _184 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.10960960960960961 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.11205073995771671 - nodes in this community are weakly interconnected._