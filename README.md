# Codebase Explorer

Codebase Explorer is a local-first desktop application for understanding unfamiliar codebases. It is designed to index project structure, symbols, dependencies, and references, then turn that analysis into searchable documentation and diagrams.

The application is in active development. The current milestone can open and scan local projects, detect common languages, and display large file trees through a virtualized explorer. Source parsing and symbol indexing are the next milestone.

## Principles

- Local analysis by default
- Fully useful without an AI provider
- Incremental work for large repositories
- Extensible language parsers
- Portable Markdown, HTML, and PDF documentation

## Development

Requirements:

- Node.js 20 or newer
- Rust 1.85 or newer
- The platform prerequisites listed in the [Tauri documentation](https://v2.tauri.app/start/prerequisites/)

Install dependencies and start the desktop application:

```sh
npm install
npm run tauri dev
```

Run the quality checks:

```sh
npm test -- --run
npm run lint
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
```

## Roadmap

The staged implementation plan is available in [`docs/superpowers/plans/2026-07-27-codebase-explorer.md`](docs/superpowers/plans/2026-07-27-codebase-explorer.md).

## License

Codebase Explorer is available under the MIT License.
