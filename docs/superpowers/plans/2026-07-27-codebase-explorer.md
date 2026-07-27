# Codebase Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished local-first desktop application that analyzes Python, JavaScript, and TypeScript projects and turns the results into searchable, interactive documentation.

**Architecture:** Tauri owns filesystem access, parsing, caching, and exports in Rust. React renders a typed three-pane workspace and receives incremental progress from Tauri events. Language support is isolated behind a Rust parser trait so new tree-sitter grammars do not alter the analysis pipeline.

**Tech Stack:** Tauri 2, Rust, tree-sitter, React 19, TypeScript, Tailwind CSS 4, Zustand, TanStack Virtual, Cytoscape.js, Mermaid, Vitest, and React Testing Library.

## Global Constraints

- Write source, identifiers, comments, documentation, commits, and interface copy in English.
- Keep every core workflow functional without an AI provider or API key.
- Run scanning and parsing outside the UI thread and update only changed files.
- Support dark, light, desktop, and compact window layouts.
- Test, commit, and push each numbered stage before starting the next stage.

---

### Task 1: Desktop Foundation

**Files:** `src/app/*`, `src/components/layout/*`, `src/components/theme/*`, `src-tauri/src/*`, root tool configuration, CI, README, and license.

**Produces:** Responsive workspace shell, persisted theme preference, Tauri application metadata command, and frontend/Rust quality gates.

- [x] Scaffold Tauri 2 with React and TypeScript.
- [x] Add Tailwind, Vitest, ESLint, Prettier, and GitHub Actions.
- [x] Replace template content with the desktop workspace shell.
- [x] Test theme persistence and the empty-project state.
- [x] Run frontend tests, lint, build, format checks, Rust tests, fmt, and Clippy.
- [ ] Commit with `feat: establish desktop application foundation` and push to `main`.

### Task 2: Project Discovery and File Tree

**Files:** `src-tauri/src/project/*`, `src/features/project/*`, and `src/features/explorer/*`.

**Produces:** `open_project`, `cancel_scan`, `ProjectSnapshot`, progress events, language totals, and a virtualized tree.

- [ ] Write scanner tests for exclusions, binary files, symlinks, language detection, cancellation, and errors.
- [ ] Implement a cancellable filesystem walk with stable relative paths and bounded progress events.
- [ ] Add the native folder picker and typed frontend command adapter.
- [ ] Render the tree with virtualization, keyboard navigation, and persistent expansion state.
- [ ] Run all checks, commit with `feat: add incremental project discovery`, and push.

### Task 3: Parsing and Symbol Index

**Files:** `src-tauri/src/analysis/*`, `src-tauri/src/languages/*`, and `src/features/symbols/*`.

**Produces:** `LanguageParser` trait, tree-sitter adapters, content-hash cache, symbol records, signatures, documentation, and source ranges.

- [ ] Test Python, JavaScript, TypeScript, and TSX fixtures for every supported symbol kind.
- [ ] Implement parser adapters and a registry that is independent from the scan pipeline.
- [ ] Persist file fingerprints and analysis records, deleting stale entries on rescan.
- [ ] Stream analysis progress and render file and symbol details.
- [ ] Run all checks, commit with `feat: index project symbols with tree-sitter`, and push.

### Task 4: Statistics, Dependencies, and References

**Files:** `src-tauri/src/analysis/{statistics,dependencies,references}.rs`, `src/features/statistics/*`, and `src/features/dependencies/*`.

**Produces:** LOC and file statistics, manifest dependencies, resolved import edges, symbol references, and statically identifiable call edges.

- [ ] Test statistics, largest-file ordering, manifest parsing, import resolution, references, and direct calls.
- [ ] Compute project statistics from cached scan and parse records.
- [ ] Resolve relationships with source locations, relationship kinds, and confidence levels.
- [ ] Populate inspector views with navigable data.
- [ ] Run all checks, commit with `feat: map project dependencies and references`, and push.

### Task 5: Search and Interactive Graphs

**Files:** `src-tauri/src/search/*`, `src/features/search/*`, and `src/features/graph/*`.

**Produces:** Ranked cancellable search and Cytoscape dependency and call graphs.

- [ ] Test exact, prefix, fuzzy, path, and filtered search ranking.
- [ ] Build a persisted search index updated by incremental analysis.
- [ ] Add the keyboard-driven global search palette.
- [ ] Render filterable graphs with focus, pan, zoom, and source navigation.
- [ ] Run all checks, commit with `feat: add project search and interactive graphs`, and push.

### Task 6: Diagrams, Documentation, and Export

**Files:** `src-tauri/src/documentation/*`, `src-tauri/src/export/*`, `src/features/documentation/*`, and `src/features/export/*`.

**Produces:** Linked project documentation, escaped Mermaid definitions, and Markdown, self-contained HTML, and PDF exports.

- [ ] Test stable documentation output, Mermaid escaping, HTML assets, and PDF pages.
- [ ] Generate overview, folder, file, and symbol documentation from indexed data.
- [ ] Render folder, class, and dependency diagrams with source fallback.
- [ ] Export through a native destination picker without requiring network access.
- [ ] Run all checks, commit with `feat: generate and export project documentation`, and push.

### Task 7: Optional AI Provider Layer

**Files:** `src-tauri/src/ai/*`, `src-tauri/src/settings.rs`, `src/features/ai/*`, and `src/features/settings/*`.

**Produces:** Provider-neutral optional actions for explanations, summaries, documentation, dead-code review, and refactoring review.

- [ ] Test the disabled state, redaction, cancellation, provider errors, and prompt size limits with a fake provider.
- [ ] Store credentials in the operating-system credential store, never in project data or logs.
- [ ] Send only explicitly selected context and stream cancellable responses.
- [ ] Verify every non-AI workflow with no API key configured.
- [ ] Run all checks, commit with `feat: add optional AI-assisted insights`, and push.

### Task 8: Scale and Release Readiness

**Files:** `tests/e2e/*`, `tests/fixtures/*`, `docs/architecture.md`, `docs/language-plugins.md`, `docs/contributing.md`, and release configuration.

**Produces:** A measured 100,000-file workflow, end-to-end coverage, extension documentation, accessibility validation, and distributable bundles.

- [ ] Generate deterministic large-project fixtures outside Git and record scan, memory, cancellation, and rescan budgets.
- [ ] Remove blocking work, unbounded channels, full-tree rerenders, and redundant cache writes found by profiling.
- [ ] Test open, scan, browse, search, graph, document, export, theme, restart, and offline workflows end to end.
- [ ] Audit keyboard access, focus order, contrast, reduced motion, compact windows, and recoverable errors.
- [ ] Document architecture, language plugins, development, testing, security, and packaging.
- [ ] Run the complete CI matrix, commit with `chore: prepare Codebase Explorer for release`, and push.
