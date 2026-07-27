# Changelog

All notable changes to Codebase Explorer will be documented in this file.

The project follows [Semantic Versioning](https://semver.org/) after the first tagged release.

## Unreleased

### Added

- Local project scanning with ignore rules, language detection, cancellation, and a virtualized file tree
- Tree-sitter parsing for Python, JavaScript, TypeScript, and TSX
- Symbol, import, direct-call, dependency, and source-statistics inspection
- Project-wide file and symbol search
- Interactive Cytoscape dependency graph
- Generated Markdown documentation and Mermaid diagrams
- Markdown, self-contained HTML, and PDF exports
- Dark and light themes with compact-window layouts
- Optional OpenAI-compatible explanations and reviews with operating-system credential storage

### Security

- Canonical project roots and relative-path validation for source access
- Explicit WebView Content Security Policy
- HTTPS-only remote AI providers with localhost exceptions
- Strict Mermaid rendering and escaped project-controlled export content
