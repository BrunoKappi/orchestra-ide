# Graph Report - MVP 2  (2026-07-25)

## Corpus Check
- 58 files · ~37,872 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 336 nodes · 939 edges · 16 communities (12 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

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

## God Nodes (most connected - your core abstractions)
1. `cn()` - 32 edges
2. `useObjectModelStore` - 31 edges
3. `compilerOptions` - 18 edges
4. `useWidgetStore` - 15 edges
5. `EntityType` - 15 edges
6. `MockConfig` - 15 edges
7. `compilerOptions` - 15 edges
8. `ObjectModelStoreState` - 14 edges
9. `WidgetCustomProperty` - 14 edges
10. `ObjectEntity` - 13 edges

## Surprising Connections (you probably didn't know these)
- `ToolButton()` --calls--> `cn()`  [EXTRACTED]
  src/features/widget-editor/WidgetCanvasEditor.tsx → src/utils/cn.ts
- `DataTypeBadge()` --calls--> `cn()`  [EXTRACTED]
  src/features/widget-editor/WidgetInspectorPanel.tsx → src/utils/cn.ts
- `TabButton()` --calls--> `cn()`  [EXTRACTED]
  src/features/widget-editor/WidgetInspectorPanel.tsx → src/utils/cn.ts
- `HeaderNavigation()` --calls--> `useWidgetStore`  [EXTRACTED]
  src/components/navigation/HeaderNavigation.tsx → src/store/useWidgetStore.ts
- `WidgetThumbnail()` --calls--> `cn()`  [EXTRACTED]
  src/features/object-model/AssociatedWidgetsEditor.tsx → src/utils/cn.ts

## Import Cycles
- 3-file cycle: `src/features/widget-editor/Dynamics/FillDynamicEditor.tsx -> src/features/widget-editor/WidgetInspectorPanel.tsx -> src/features/widget-editor/Dynamics/StrokeDynamicEditor.tsx -> src/features/widget-editor/Dynamics/FillDynamicEditor.tsx`

## Communities (16 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.13
Nodes (24): WidgetMappingModalProps, ObjectPropertySimRow, associatedWidgetRepo, AssociatedWidgetRepository, deploymentRepo, mockConfigRepo, objectRepo, propertyRepo (+16 more)

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (30): FillDynamicEditor(), FillDynamicEditorProps, FillLevelDynamicEditor(), FillLevelDynamicEditorProps, StrokeDynamicEditor(), StrokeDynamicEditorProps, validateDynamicRule(), ValidationError (+22 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (35): dependencies, clsx, dayjs, @hookform/resolvers, immer, lucide-react, react, react-dom (+27 more)

### Community 3 - "Community 3"
Cohesion: 0.10
Nodes (37): IDELayout(), HeaderNavigation(), HeaderNavigationProps, AssociatedWidgetsEditor(), WidgetThumbnail(), CentralEditor(), DeploymentTree(), DerivationTree() (+29 more)

### Community 4 - "Community 4"
Cohesion: 0.21
Nodes (8): widgetFolderRepo, WidgetFolderRepository, widgetRepo, WidgetRepository, WidgetSeedService, WidgetEntity, WidgetFolderEntity, WidgetNodeEntity

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 7 - "Community 7"
Cohesion: 0.27
Nodes (6): MockConfigRepository, MockSimulationService, DataType, MockConfig, MockConfigParams, MockPresetType

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 9 - "Community 9"
Cohesion: 0.42
Nodes (3): DeploymentRepository, DeploymentFolderEntity, DeploymentNodeEntity

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 15 - "Community 15"
Cohesion: 0.16
Nodes (11): WidgetLayout(), OrchestraPage(), WidgetsPage(), useWidgetStore, WidgetTreeNode, ResizableSplitPane(), ResizableSplitPaneProps, WidgetCanvasEditor() (+3 more)

## Knowledge Gaps
- **92 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `name` (+87 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 3` to `Community 1`, `Community 15`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `useObjectModelStore` connect `Community 3` to `Community 0`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `MockConfig` connect `Community 7` to `Community 0`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _92 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.12862745098039216 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.10465116279069768 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._