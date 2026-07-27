# Performance

Codebase Explorer keeps filesystem traversal and source parsing outside the UI thread. The project tree is represented as a flat list across the Tauri boundary and virtualized in React, so only visible rows are mounted.

## Scanner Benchmark

The release benchmark creates 100 directories with 1,000 TypeScript files each in an operating-system temporary directory. Fixture creation is excluded from the measured interval.

Reference measurement on Windows, 27 July 2026:

| Metric                 |  Result | Regression budget |
| ---------------------- | ------: | ----------------: |
| Files                  | 100,000 |           100,000 |
| Directory entries      | 100,100 |           100,100 |
| Scan duration          |  832 ms |               5 s |
| Resident memory growth | 26.1 MB |            128 MB |

Run the benchmark explicitly:

```sh
cargo test --manifest-path src-tauri/Cargo.toml scans_one_hundred_thousand_files_within_release_budget -- --ignored --nocapture
```

The test is ignored during routine CI because creating 100,000 files is substantially slower than scanning them and can vary widely between hosted filesystems. Release candidates must run it on a local SSD and one target-platform CI runner.

## Scale Boundaries

- Progress events are emitted for the first file and every 250 files thereafter.
- Symbol parsing skips files larger than 5 MB.
- Known binary formats and generated dependency directories are excluded from analysis.
- Project search and dependency indexing are built lazily and cached for the active project session.
- Cytoscape, Mermaid, documentation rendering, and AI response rendering are loaded only when used.
- AI context is capped at 40,000 characters and is never part of the local project index.
