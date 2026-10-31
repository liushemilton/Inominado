# Graph Report - Inominado  (2026-10-31)

## Corpus Check
- Corpus is ~490 words - fits in a single context window. You may not need a graph.

## Summary
- 43 nodes · 53 edges · 9 communities (6 shown, 3 thin omitted)
- Extraction: 85% EXTRACTED · 15% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Vite Build Tooling
- App Entry & Setup Docs
- Graphify Agent Workflow
- Package Manifest
- JSConfig Path Aliases
- NPM Scripts
- Vue App Sources
- Vue Runtime Dependency
- Node Engine Constraint

## God Nodes (most connected - your core abstractions)
1. `AGENTS.md graphify Agent Instructions` - 5 edges
2. `Vue 3 + Vite Starter Template` - 5 edges
3. `scripts` - 4 edges
4. `Inominado README` - 4 edges
5. `vue` - 3 edges
6. `@vitejs/plugin-vue` - 3 edges
7. `vite` - 3 edges
8. `vite-plugin-vue-devtools` - 3 edges
9. `Graphify Query-First Protocol` - 3 edges
10. `Project Setup Workflow (npm install / dev / build)` - 3 edges

## Surprising Connections (you probably didn't know these)
- `index.html Vite Entry Document` --conceptually_related_to--> `Vue 3 + Vite Starter Template`  [INFERRED]
  index.html → README.md
- `/src/main.js Module Entry Script` --conceptually_related_to--> `Project Setup Workflow (npm install / dev / build)`  [INFERRED]
  index.html → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Vite + Vue 3 App Bootstrap Flow** — index_html, index_app_mount_point, index_main_js_entry, readme_vue3_vite_template, readme_project_setup [INFERRED 0.85]
- **Graphify Agent Workflow Rules** — agents_graphify, agents_graphify_query_first_protocol, agents_graphify_skill_invocation, agents_graphify_incremental_update, agents_graphify_wiki_navigation [EXTRACTED 1.00]

## Communities (9 total, 3 thin omitted)

### Community 0 - "Vite Build Tooling"
Cohesion: 0.28
Nodes (7): devDependencies, vite@^8.2.2, vite-plugin-vue-devtools@^8.2.1, @vitejs/plugin-vue@^6.0.8, vite, vite-plugin-vue-devtools, @vitejs/plugin-vue

### Community 1 - "App Entry & Setup Docs"
Cohesion: 0.43
Nodes (8): #app Mount Point, index.html Vite Entry Document, /src/main.js Module Entry Script, Recommended Browser Setup (Vue.js devtools), Recommended IDE Setup (VS Code + Vue Official), Inominado README, Project Setup Workflow (npm install / dev / build), Vue 3 + Vite Starter Template

### Community 2 - "Graphify Agent Workflow"
Cohesion: 0.53
Nodes (3): AGENTS.md graphify Agent Instructions, /graphify Skill Invocation Rule, Graphify Wiki Index Navigation

### Community 3 - "Package Manifest"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 4 - "JSConfig Path Aliases"
Cohesion: 0.50
Nodes (3): compilerOptions, paths, exclude

### Community 5 - "NPM Scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, preview

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `scripts` connect `NPM Scripts` to `Package Manifest`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Vue 3 + Vite Starter Template` (e.g. with `index.html Vite Entry Document` and `Recommended Browser Setup (Vue.js devtools)`) actually correct?**
  _`Vue 3 + Vite Starter Template` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Why does `vue` connect `Vue App Sources` to `Package Manifest`, `Vue Runtime Dependency`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Vite Build Tooling` to `Package Manifest`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._