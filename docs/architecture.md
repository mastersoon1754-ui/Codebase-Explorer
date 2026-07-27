# Architecture

Codebase Explorer is a local-first Tauri application. Rust owns all privileged operations and expensive analysis. React renders typed results and never receives unrestricted filesystem access.

## Process Boundaries

### Tauri Backend

The backend is organized by capability under `src-tauri/src`:

| Module          | Responsibility                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------- |
| `project`       | Cancellable filesystem traversal, exclusions, language detection, and flat project snapshots        |
| `languages`     | Tree-sitter grammar registry and language-specific symbol extraction                                |
| `analysis`      | File parsing, content hashes, imports, calls, statistics, and active-session caches                 |
| `search`        | Project-wide path and symbol ranking plus normalized dependency graph data                          |
| `documentation` | Deterministic Markdown and Mermaid generation plus Markdown, HTML, and PDF export                   |
| `ai`            | Optional provider abstraction, bounded prompts, HTTPS client, settings, and credential-store access |

Tauri commands accept a `scanId` and relative path. The backend resolves that pair against a previously registered canonical project root. Callers cannot use analysis commands to read arbitrary absolute paths or traverse outside the project.

Filesystem scans, parsing, indexing, statistics, documentation, and exports use blocking worker tasks. Progress events are bounded to avoid flooding the WebView.

### React Frontend

The frontend is organized by product feature under `src/features`. Zustand stores hold project and optional AI session state. Components call small typed adapters around Tauri commands rather than invoking commands directly throughout the view tree.

The project snapshot crosses the IPC boundary as a sorted flat entry list. `FileTree` derives expanded rows and uses TanStack Virtual, so large repositories do not create one DOM node per file.

Cytoscape, Mermaid, documentation rendering, and the AI response renderer are split into lazy chunks. The base workspace remains usable before those modules load.

## Data Flow

1. The user chooses a directory through the native Tauri dialog.
2. Rust canonicalizes and scans the root, applying ignore files and built-in exclusions.
3. React receives a flat `ProjectSnapshot` and renders a virtualized tree.
4. Selecting a supported source file sends `scanId + relativePath` to Rust.
5. Rust validates the path, hashes the content, reuses a matching active-session cache entry, and parses with the registered Tree-sitter adapter.
6. Search or graph access lazily builds a project-wide index and caches it by `scanId`.
7. Documentation generation consumes the scan inventory, statistics, and search graph rather than traversing the project again.

## Caching

Current caches are intentionally session-scoped:

- File analysis is keyed by `scanId + relativePath` and validated with BLAKE3.
- Search and dependency indexes are keyed by `scanId`.
- Opening a project creates a new scan identifier, isolating old results.

Persistent incremental caching is a future extension. A persistent implementation must version its schema and parser grammars, store no source text outside the application data directory without consent, and invalidate deleted or changed files by content hash.

## Security Model

- The WebView uses an explicit CSP and no remote scripts.
- Filesystem access occurs only in Rust through validated commands.
- HTML exports escape project-controlled text.
- Mermaid runs with `securityLevel: strict` and generated labels are escaped.
- AI keys are stored by the operating-system credential manager.
- AI source context is sent only after an explicit action and is capped at 40,000 characters.
- Remote AI endpoints must use HTTPS; plaintext HTTP is limited to localhost.

See [`security.md`](security.md) for reporting and deployment guidance.
