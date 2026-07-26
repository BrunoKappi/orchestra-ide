# Graph Report - MVP 2  (2026-07-26)

## Corpus Check
- 92 files · ~90,847 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 518 nodes · 1535 edges · 21 communities (16 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e051117e`
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

## God Nodes (most connected - your core abstractions)
1. `useObjectModelStore` - 64 edges
2. `cn()` - 59 edges
3. `useWidgetStore` - 29 edges
4. `InheritanceService` - 20 edges
5. `ObjectEntity` - 18 edges
6. `compilerOptions` - 18 edges
7. `STORAGE_KEYS` - 17 edges
8. `ObjectModelStoreState` - 17 edges
9. `AssociatedWidgetEntity` - 16 edges
10. `EntityType` - 15 edges

## Surprising Connections (you probably didn't know these)
- `PropertySelectorModal()` --calls--> `useObjectModelStore`  [EXTRACTED]
  src/features/flow-designer/NodePropertyInspector.tsx → src/store/useObjectModelStore.ts
- `WidgetInstanceRenderer()` --calls--> `useWidgetStore`  [EXTRACTED]
  src/features/screen-designer/ScreenCanvasEditor.tsx → src/store/useWidgetStore.ts
- `DataTypeBadge()` --calls--> `cn()`  [EXTRACTED]
  src/features/widget-editor/WidgetInspectorPanel.tsx → src/utils/cn.ts
- `TabButton()` --calls--> `cn()`  [EXTRACTED]
  src/features/widget-editor/WidgetInspectorPanel.tsx → src/utils/cn.ts
- `TrendChart()` --calls--> `cn()`  [EXTRACTED]
  src/pages/HistorianPage.tsx → src/utils/cn.ts

## Import Cycles
- 3-file cycle: `src/features/widget-editor/Dynamics/FillDynamicEditor.tsx -> src/features/widget-editor/WidgetInspectorPanel.tsx -> src/features/widget-editor/Dynamics/StrokeDynamicEditor.tsx -> src/features/widget-editor/Dynamics/FillDynamicEditor.tsx`

## Communities (21 total, 5 thin omitted)

### Community 1 - "Community 1"
Cohesion: 0.16
Nodes (18): FillDynamicEditor(), FillDynamicEditorProps, FillLevelDynamicEditor(), FillLevelDynamicEditorProps, StrokeDynamicEditor(), StrokeDynamicEditorProps, validateDynamicRule(), ValidationError (+10 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (36): dependencies, bpmn-js, clsx, dayjs, @hookform/resolvers, immer, lucide-react, react (+28 more)

### Community 3 - "Community 3"
Cohesion: 0.42
Nodes (3): DeploymentRepository, DeploymentFolderEntity, DeploymentNodeEntity

### Community 4 - "Community 4"
Cohesion: 0.17
Nodes (15): widgetFolderRepo, WidgetFolderRepository, widgetRepo, WidgetRepository, WidgetSeedService, InspectorTabType, ToolType, WidgetStoreState (+7 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (24): ScreenLayout(), screenFolderRepo, screenRepo, ScreenCanvasEditor(), WidgetInstanceRenderer(), ScreenElementInspector(), ExplorerTab, ScreenExplorerPanel() (+16 more)

### Community 7 - "Community 7"
Cohesion: 0.29
Nodes (5): MockConfigRepository, MockSimulationService, MockConfig, MockConfigParams, MockPresetType

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (30): BpmnCanvas(), BpmnCanvasProps, COLOR_MAP, ICON_MAP, FlowDesignerModal(), INDUSTRIAL_NODES, IndustrialNodeDef, IndustrialPaletteSidebarProps (+22 more)

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (31): WidgetMappingModalProps, ObjectPropertySimRow, alarmRepo, associatedWidgetRepo, deploymentRepo, flowchartRepo, mockConfigRepo, objectRepo (+23 more)

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (14): CHART_PADDING, ChartData, CURVE_COLORS, PeriodPreset, SelectedVariable, TrendChart(), TrendChartProps, historyEngine (+6 more)

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 15 - "Community 15"
Cohesion: 0.06
Nodes (56): IndustrialPaletteSidebar(), IDELayout(), WidgetLayout(), HeaderNavigation(), HeaderNavigationProps, AlarmConfigModal(), AssociatedWidgetsEditor(), WidgetThumbnail() (+48 more)

### Community 16 - "Community 16"
Cohesion: 0.17
Nodes (13): RuntimeWidgetInstance(), ScreenRuntimePage(), AssociatedWidgetRepository, AssociatedWidgetEntity, extractPropertyName(), FillLevelStyle, resolveColorDynamic(), resolveCustomPropValue() (+5 more)

### Community 18 - "Community 18"
Cohesion: 0.24
Nodes (11): DeploymentTree(), DerivationTree(), DeploymentTreeNode, DerivationTreeNode, ContextMenu(), ContextMenuItem, ContextMenuProps, ResizableSplitPane() (+3 more)

## Knowledge Gaps
- **120 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `name` (+115 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useObjectModelStore` connect `Community 15` to `Community 6`, `Community 9`, `Community 10`, `Community 11`, `Community 16`, `Community 18`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `cn()` connect `Community 15` to `Community 1`, `Community 6`, `Community 9`, `Community 10`, `Community 11`, `Community 18`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `AlarmEvent` connect `Community 20` to `Community 10`, `Community 6`, `Community 15`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _120 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 6` be split into smaller, more focused modules?**
  _Cohesion score 0.08325624421831637 - nodes in this community are weakly interconnected._