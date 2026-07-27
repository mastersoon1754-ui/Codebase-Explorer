# Contributing

Contributions should be small, testable, and scoped to one product behavior. Open an issue before large architectural changes or new runtime dependencies.

## Development Setup

Install Node.js 20 or newer, Rust 1.88 or newer, and the platform prerequisites from the [Tauri documentation](https://v2.tauri.app/start/prerequisites/).

```sh
npm install
npm run tauri dev
```

## Quality Gates

Run the same checks as CI before submitting a pull request:

```sh
npm run format:check
npm run lint
npm test -- --run
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
```

Run `npm run tauri build -- --debug --no-bundle` when changing Tauri commands, capabilities, plugins, CSP, or Rust dependencies.

Run the large-project benchmark before changes to scanning, path representation, or project serialization:

```sh
cargo test --manifest-path src-tauri/Cargo.toml scans_one_hundred_thousand_files_within_release_budget -- --ignored --nocapture
```

## Code Style

- Write code, comments, commits, documentation, and interface copy in English.
- Prefer focused feature modules and explicit typed boundaries.
- Keep the application fully functional without an AI provider.
- Do not add source upload, telemetry, or network behavior without explicit user control and documentation.
- Add tests for observable behavior and security boundaries, not implementation details.
- Avoid claiming semantic references or dead code when the analysis is only syntactic.

## Pull Requests

A pull request should include:

- A concise explanation of the user-visible change
- Tests for new behavior and important failures
- Performance impact for scanning, indexing, or rendering changes
- Security impact for filesystem, export, WebView, or network changes
- Screenshots for visible desktop and compact-window changes

Do not commit generated bundles, temporary fixtures, credentials, local project caches, or exported documentation.
