# Graph Report - MVP 2  (2026-07-26)

## Corpus Check
- 119 files · ~111,740 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 697 nodes · 1984 edges · 28 communities (23 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a285a9f1`
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
- [[_COMMUNITY_Community 27|Community 27]]

## God Nodes (most connected - your core abstractions)
1. `useObjectModelStore` - 66 edges
2. `cn()` - 59 edges
3. `useOmmStore` - 39 edges
4. `useWidgetStore` - 29 edges
5. `InheritanceService` - 20 edges
6. `ObjectEntity` - 18 edges
7. `compilerOptions` - 18 edges
8. `STORAGE_KEYS` - 17 edges
9. `ObjectModelStoreState` - 17 edges
10. `AssociatedWidgetEntity` - 16 edges

## Surprising Connections (you probably didn't know these)
- `HistoryConfigModal()` --calls--> `Field()`  [INFERRED]
  src/features/object-model/HistoryConfigModal.tsx → src/features/omm/components/detail/tabs/GeneralTab.tsx
- `PropertySelectorModal()` --calls--> `useObjectModelStore`  [EXTRACTED]
  src/features/flow-designer/NodePropertyInspector.tsx → src/store/useObjectModelStore.ts
- `WidgetThumbnail()` --calls--> `cn()`  [EXTRACTED]
  src/features/object-model/AssociatedWidgetsEditor.tsx → src/utils/cn.ts
- `ToolButton()` --calls--> `cn()`  [EXTRACTED]
  src/features/widget-editor/WidgetCanvasEditor.tsx → src/utils/cn.ts
- `DataTypeBadge()` --calls--> `cn()`  [EXTRACTED]
  src/features/widget-editor/WidgetInspectorPanel.tsx → src/utils/cn.ts

## Import Cycles
- 3-file cycle: `src/features/widget-editor/Dynamics/FillDynamicEditor.tsx -> src/features/widget-editor/WidgetInspectorPanel.tsx -> src/features/widget-editor/Dynamics/StrokeDynamicEditor.tsx -> src/features/widget-editor/Dynamics/FillDynamicEditor.tsx`

## Communities (28 total, 5 thin omitted)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (27): FillDynamicEditor(), FillDynamicEditorProps, FillLevelDynamicEditor(), FillLevelDynamicEditorProps, StrokeDynamicEditor(), StrokeDynamicEditorProps, validateDynamicRule(), ValidationError (+19 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (36): dependencies, bpmn-js, clsx, dayjs, @hookform/resolvers, immer, lucide-react, react (+28 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (40): alarmRepo, alignmentRepo, areaRepo, auditRepo, clearAllOmmData(), cutoffRepo, defaultSimState, equipmentRepo (+32 more)

### Community 4 - "Community 4"
Cohesion: 0.17
Nodes (15): widgetFolderRepo, WidgetFolderRepository, widgetRepo, WidgetRepository, WidgetSeedService, InspectorTabType, ToolType, WidgetStoreState (+7 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (41): ScreenLayout(), WidgetLayout(), ScreenDesignerPage(), RuntimeWidgetInstance(), WidgetsPage(), associatedWidgetRepo, propertyRepo, screenFolderRepo (+33 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (24): AdminPanel(), AdminSection, SECTIONS, OmmLayout(), VIEW_TABS, DetailPanel(), KpiCardProps, OmmKpiHeader() (+16 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (25): INDUSTRIAL_NODES, IndustrialNodeDef, IndustrialPaletteSidebarProps, COMPARISON_OPERATORS, PRESET_COLORS, PropertySelectorModal(), PropertySelectorProps, flowchartRepo (+17 more)

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (24): WidgetMappingModalProps, ObjectPropertySimRow, AssociatedWidgetRepository, MockConfigRepository, templateRepo, TemplateRepository, ExportImportService, InheritanceService (+16 more)

### Community 11 - "Community 11"
Cohesion: 0.15
Nodes (10): DEFAULT_CONFIG, HistoryConfigModal(), msToHours(), screenRepo, historyEngine, lastRecordedAt, lastRecordedValue, Store (+2 more)

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 15 - "Community 15"
Cohesion: 0.18
Nodes (14): HeaderNavigation(), HeaderNavigationProps, MockConfigModal(), PRESET_OPTIONS, AlarmViewerPage(), DatabasePage(), DB_TABLES, DbTable (+6 more)

### Community 16 - "Community 16"
Cohesion: 0.10
Nodes (24): TabConfig, TABS, DEFAULT_VISIBLE_COLUMNS, movementColumnDefs, AlarmsTab(), ACTION_COLORS, ACTION_LABELS, AuditTab() (+16 more)

### Community 17 - "Community 17"
Cohesion: 0.11
Nodes (20): GROUP_BY_OPTIONS, GroupByOption, ToolbarButtonProps, OmmStoreActions, AlarmSeverity, AuditAction, CutoffStatus, EquipmentType (+12 more)

### Community 18 - "Community 18"
Cohesion: 0.25
Nodes (11): AlarmConfigModal(), AssociatedWidgetsEditor(), CentralEditor(), ExportImportModal(), PropertiesTable(), PropertyModal(), ScriptModal(), ScriptsEditor() (+3 more)

### Community 20 - "Community 20"
Cohesion: 0.09
Nodes (15): alarmRepo, AlarmRepository, deploymentRepo, DeploymentRepository, mockConfigRepo, objectRepo, ObjectRepository, STORAGE_KEYS (+7 more)

### Community 21 - "Community 21"
Cohesion: 0.24
Nodes (11): IDELayout(), DeploymentTree(), DerivationTree(), OrchestraPage(), DeploymentTreeNode, DerivationTreeNode, ContextMenu(), ContextMenuItem (+3 more)

### Community 23 - "Community 23"
Cohesion: 0.16
Nodes (12): WidgetThumbnail(), PropertyFormData, propertySchema, ALL_TRIGGERS, EXPRESSION_TRIGGERS, LOOP_TRIGGERS, ScriptFormData, TRIGGER_LABELS (+4 more)

### Community 24 - "Community 24"
Cohesion: 0.21
Nodes (11): BpmnCanvas(), BpmnCanvasProps, COLOR_MAP, ICON_MAP, FlowDesignerModal(), IndustrialPaletteSidebar(), NodePropertyInspector(), ProblemsPanel() (+3 more)

### Community 25 - "Community 25"
Cohesion: 0.21
Nodes (5): OmmSimulationEngine, SIM_MODES, SimulationTab(), OmmEvent, OmmMovement

### Community 26 - "Community 26"
Cohesion: 0.20
Nodes (9): CHART_PADDING, ChartData, CURVE_COLORS, HistorianPage(), PeriodPreset, SelectedVariable, TrendChart(), TrendChartProps (+1 more)

## Knowledge Gaps
- **156 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `name` (+151 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useObjectModelStore` connect `Community 18` to `Community 6`, `Community 9`, `Community 11`, `Community 15`, `Community 21`, `Community 23`, `Community 24`, `Community 26`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `useOmmStore` connect `Community 7` to `Community 3`, `Community 16`, `Community 17`, `Community 25`, `Community 27`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `cn()` connect `Community 15` to `Community 1`, `Community 6`, `Community 9`, `Community 11`, `Community 18`, `Community 21`, `Community 23`, `Community 24`, `Community 26`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _156 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.10960960960960961 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.10909090909090909 - nodes in this community are weakly interconnected._