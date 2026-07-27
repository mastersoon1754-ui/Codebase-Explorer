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
- [x] Commit with `feat: establish desktop application foundation` and push to `main`.

### Task 2: Project Discovery and File Tree

**Files:** `src-tauri/src/project/*`, `src/features/project/*`, and `src/features/explorer/*`.

**Produces:** `open_project`, `cancel_scan`, `ProjectSnapshot`, progress events, language totals, and a virtualized tree.

- [x] Write scanner tests for exclusions, binary files, symlinks, language detection, cancellation, and errors.
- [x] Implement a cancellable filesystem walk with stable relative paths and bounded progress events.
- [x] Add the native folder picker and typed frontend command adapter.
- [x] Render the tree with virtualization and keyboard navigation.
- [x] Run all checks, commit with `feat: add incremental project discovery`, and push.

### Task 3: Parsing and Symbol Index

**Files:** `src-tauri/src/analysis/*`, `src-tauri/src/languages/*`, and `src/features/symbols/*`.

**Produces:** `LanguageParser` trait, tree-sitter adapters, content-hash cache, symbol records, signatures, documentation, and source ranges.

- [x] Test Python, JavaScript, TypeScript, and TSX fixtures for every supported symbol kind.
- [x] Implement parser adapters and a registry that is independent from the scan pipeline.
- [x] Cache file fingerprints and analysis records for the active application session.
- [x] Parse selected files off the UI thread and render source and symbol details.
- [x] Run all checks, commit with `feat: index project symbols with tree-sitter`, and push.

### Task 4: Statistics, Dependencies, and References

**Files:** `src-tauri/src/analysis/{statistics,dependencies,references}.rs`, `src/features/statistics/*`, and `src/features/dependencies/*`.

**Produces:** LOC and file statistics, manifest dependencies, resolved import edges, symbol references, and statically identifiable call edges.

- [x] Test statistics, largest-file ordering, manifest parsing, import resolution, and direct calls.
- [x] Compute project statistics from cached scan and parse records.
- [x] Resolve local and external imports and direct calls with source locations.
- [x] Populate inspector views with statistics, dependencies, imports, and calls.
- [x] Run all checks, commit with `feat: map project dependencies and calls`, and push.

### Task 5: Search and Interactive Graphs

**Files:** `src-tauri/src/search/*`, `src/features/search/*`, and `src/features/graph/*`.

**Produces:** Ranked cancellable search and Cytoscape dependency and call graphs.

- [x] Test exact, prefix, fuzzy, and path search ranking.
- [x] Build a cached project-wide path, symbol, and dependency index.
- [x] Add the keyboard-driven global search palette.
- [x] Render an interactive dependency graph with focus, pan, zoom, and source navigation.
- [x] Run all checks, commit with `feat: add project search and interactive graphs`, and push.

### Task 6: Diagrams, Documentation, and Export

**Files:** `src-tauri/src/documentation/*`, `src-tauri/src/export/*`, `src/features/documentation/*`, and `src/features/export/*`.

**Produces:** Linked project documentation, escaped Mermaid definitions, and Markdown, self-contained HTML, and PDF exports.

- [x] Test stable documentation output, Mermaid escaping, self-contained HTML, and PDF pages.
- [x] Generate an overview, symbols, statistics, and diagrams from indexed data.
- [x] Render folder, class, and dependency diagrams with source fallback.
- [x] Export through a native destination picker without requiring network access.
- [x] Run all checks, commit with `feat: generate and export project documentation`, and push.

### Task 7: Optional AI Provider Layer

**Files:** `src-tauri/src/ai/*`, `src-tauri/src/settings.rs`, `src/features/ai/*`, and `src/features/settings/*`.

**Produces:** Provider-neutral optional actions for explanations, summaries, documentation, dead-code review, and refactoring review.

- [x] Test disabled states, secret redaction, logical cancellation, provider errors, and prompt size limits with a fake provider.
- [x] Store credentials in the operating-system credential store, never in project data or logs.
- [x] Send only explicitly selected file or symbol context and ignore responses after user cancellation.
- [x] Verify every non-AI workflow with no API key configured.
- [x] Run all checks, commit with `feat: add optional AI-assisted insights`, and push.

### Task 8: Scale and Release Readiness

**Files:** `tests/e2e/*`, `tests/fixtures/*`, `docs/architecture.md`, `docs/language-plugins.md`, `docs/contributing.md`, and release configuration.

**Produces:** A measured 100,000-file workflow, end-to-end coverage, extension documentation, accessibility validation, and distributable bundles.

- [x] Generate deterministic large-project fixtures outside Git and record scan and memory budgets.
- [x] Remove unbounded project-session caches found by profiling and retain lazy, virtualized UI boundaries.
- [x] Test the open, scan, browse, parse, symbol, search, documentation, export, theme, and offline orchestration layers.
- [x] Audit automated accessibility, keyboard access, reduced motion, compact windows, CSP, and recoverable errors.
- [x] Document architecture, language plugins, development, testing, performance, security, and packaging.
- [x] Run the local release matrix and produce Windows MSI and NSIS bundles.
- [ ] Commit with `chore: prepare Codebase Explorer for release`, push, and verify the cross-platform CI matrix.
