# Language Plugins

Language support is implemented through the Rust `LanguageParser` trait in `src-tauri/src/languages/mod.rs`.

```rust
pub trait LanguageParser: Send + Sync {
    fn id(&self) -> &'static str;
    fn extensions(&self) -> &'static [&'static str];
    fn language(&self, extension: &str) -> tree_sitter::Language;
    fn collect_symbols(&self, root: Node<'_>, collector: &mut SymbolCollector<'_>);
}
```

## Add A Language

1. Add the Tree-sitter grammar crate to `src-tauri/Cargo.toml` with an exact compatible version.
2. Create `src-tauri/src/languages/<language>.rs`.
3. Implement `LanguageParser` with a stable lowercase identifier and all recognized extensions.
4. Register one static parser in `src-tauri/src/languages/mod.rs` and include it in `parser_for_path`.
5. Add extensions to `detect_language` in `src-tauri/src/project/scanner.rs` so project statistics identify the language before parsing.
6. Add the language identifier to the supported-language lists in statistics, search indexing, and `FileTree` until those lists are consolidated into generated parser metadata.
7. Add parser fixtures that cover every supported symbol kind and malformed syntax.
8. Add import resolution rules only when they can be tested against real module conventions.

## Symbol Collection

Use `SymbolCollector` helpers instead of creating `Symbol` values manually:

- `push_named` extracts a named declaration, signature, range, parent, and adjacent documentation.
- `push_python_constant` handles module-level uppercase assignments.
- `push_javascript_declarations` handles arrow functions and uppercase constants.

Only report symbols that the syntax tree proves. Do not infer runtime types, dynamic calls, or references without a confidence field and a clearly documented algorithm.

## Required Tests

A language adapter should include fixtures for:

- Functions and async or generator variants
- Classes and methods
- Interfaces and enums when the language supports them
- Constants according to the language convention
- Generic parameters, annotations, default values, and multiline signatures
- Documentation comments or docstrings
- Imports and direct calls
- Files with recoverable parse errors
- Language variants such as TSX when they use a separate grammar

Run:

```sh
cargo test --manifest-path src-tauri/Cargo.toml analysis::parser
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
```

## Extension Boundary

The current plugin system is compile-time Rust registration, not runtime loading. This keeps grammar execution inside the signed application and avoids executing third-party native libraries. A future runtime plugin format requires a sandboxed process or WebAssembly boundary, versioned schemas, explicit permissions, and signature verification.
