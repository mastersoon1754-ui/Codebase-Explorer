# Codebase Explorer

Codebase Explorer is a local-first desktop application for understanding unfamiliar codebases. It is designed to index project structure, symbols, dependencies, and references, then turn that analysis into searchable documentation and diagrams.

The application is in active development. It can open and scan local projects, search paths and symbols, display interactive dependency and Mermaid diagrams, and parse Python, JavaScript, TypeScript, and TSX source files with Tree-sitter. Generated project documentation can be exported as Markdown, self-contained HTML, or PDF.

An optional OpenAI-compatible provider can explain selected files and symbols or review selected source for refactoring and potentially dead code. Core analysis remains local and fully functional without provider configuration.

## Principles

- Local analysis by default
- Fully useful without an AI provider
- Incremental work for large repositories
- Extensible language parsers
- Portable Markdown, HTML, and PDF documentation

## Development

Requirements:

- Node.js 20 or newer
- Rust 1.88 or newer
- The platform prerequisites listed in the [Tauri documentation](https://v2.tauri.app/start/prerequisites/)

Install dependencies and start the desktop application:

```sh
npm install
npm run tauri dev
```

Run the quality checks:

```sh
npm run quality
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --locked --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo test --locked --manifest-path src-tauri/Cargo.toml
```

## Documentation

- [Architecture](docs/architecture.md)
- [Language plugins](docs/language-plugins.md)
- [Performance](docs/performance.md)
- [Contributing](docs/contributing.md)
- [Security policy](docs/security.md)
- [Release process](docs/releasing.md)

## Roadmap

The staged implementation plan is available in [`docs/superpowers/plans/2026-07-27-codebase-explorer.md`](docs/superpowers/plans/2026-07-27-codebase-explorer.md).

## License

Codebase Explorer is available under the MIT License.
