# Graph Report - MVP 2  (2026-07-25)

## Corpus Check
- 75 files · ~63,773 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 425 nodes · 1248 edges · 17 communities (13 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3c9e90a4`
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

## God Nodes (most connected - your core abstractions)
1. `useObjectModelStore` - 48 edges
2. `cn()` - 45 edges
3. `useWidgetStore` - 27 edges
4. `compilerOptions` - 18 edges
5. `STORAGE_KEYS` - 16 edges
6. `ObjectModelStoreState` - 16 edges
7. `ObjectEntity` - 16 edges
8. `InheritanceService` - 15 edges
9. `EntityType` - 15 edges
10. `WidgetCustomProperty` - 15 edges

## Surprising Connections (you probably didn't know these)
- `ContextMenuState` --references--> `ScreenTreeNode`  [EXTRACTED]
  src/features/screen-designer/ScreenTree.tsx → src/types/domain.ts
- `ToolButton()` --calls--> `cn()`  [EXTRACTED]
  src/features/widget-editor/WidgetCanvasEditor.tsx → src/utils/cn.ts
- `DataTypeBadge()` --calls--> `cn()`  [EXTRACTED]
  src/features/widget-editor/WidgetInspectorPanel.tsx → src/utils/cn.ts
- `TabButton()` --calls--> `cn()`  [EXTRACTED]
  src/features/widget-editor/WidgetInspectorPanel.tsx → src/utils/cn.ts
- `WidgetTree()` --calls--> `buildTree()`  [INFERRED]
  src/features/widget-editor/WidgetTree.tsx → src/store/useScreenStore.ts

## Import Cycles
- 3-file cycle: `src/features/widget-editor/Dynamics/FillDynamicEditor.tsx -> src/features/widget-editor/WidgetInspectorPanel.tsx -> src/features/widget-editor/Dynamics/StrokeDynamicEditor.tsx -> src/features/widget-editor/Dynamics/FillDynamicEditor.tsx`

## Communities (17 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (28): WidgetMappingModalProps, ObjectPropertySimRow, alarmRepo, associatedWidgetRepo, deploymentRepo, mockConfigRepo, objectRepo, ObjectRepository (+20 more)

### Community 1 - "Community 1"
Cohesion: 0.16
Nodes (18): FillDynamicEditor(), FillDynamicEditorProps, FillLevelDynamicEditor(), FillLevelDynamicEditorProps, StrokeDynamicEditor(), StrokeDynamicEditorProps, validateDynamicRule(), ValidationError (+10 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (35): dependencies, clsx, dayjs, @hookform/resolvers, immer, lucide-react, react, react-dom (+27 more)

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
Cohesion: 0.09
Nodes (25): RuntimeWidgetInstance(), screenFolderRepo, screenRepo, buildTree(), ScreenStoreState, ScreenToolType, AlarmConditionType, FillLevelConfig (+17 more)

### Community 7 - "Community 7"
Cohesion: 0.19
Nodes (7): MockConfigRepository, PropertyRepository, MockSimulationService, PropertyEntity, MockConfig, MockConfigParams, MockPresetType

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (21): ScreenLayout(), WidgetLayout(), ScreenCanvasEditor(), WidgetInstanceRenderer(), ScreenElementInspector(), ExplorerTab, ScreenExplorerPanel(), ContextMenuState (+13 more)

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 15 - "Community 15"
Cohesion: 0.07
Nodes (48): IDELayout(), HeaderNavigation(), HeaderNavigationProps, AlarmConfigModal(), AssociatedWidgetsEditor(), WidgetThumbnail(), CentralEditor(), DeploymentTree() (+40 more)

## Knowledge Gaps
- **99 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `name` (+94 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useObjectModelStore` connect `Community 15` to `Community 0`, `Community 9`, `Community 6`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `cn()` connect `Community 15` to `Community 9`, `Community 1`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `AlarmEvent` connect `Community 10` to `Community 0`, `Community 6`, `Community 15`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _99 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.10753945061367622 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._