# Releasing

Codebase Explorer currently produces unsigned development bundles. Signing identities and credentials must never be committed to the repository.

## Release Candidate

1. Confirm the worktree is clean and CI is green.
2. Run the full quality matrix from [`contributing.md`](contributing.md).
3. Run the large-project benchmark from [`performance.md`](performance.md).
4. Test open, cancel, browse, search, graph, documentation, export, theme, restart, and offline workflows on each target platform.
5. Verify all core workflows with no AI key configured.
6. Verify credential creation and deletion with the native credential manager on each platform.
7. Build release bundles with `npm run tauri build`.
8. Install each bundle on a clean user account and repeat the smoke workflow.
9. Sign bundles using protected platform-specific CI credentials.
10. Publish artifacts and SHA-256 checksums from the same commit.

## Platform Artifacts

Tauri produces platform-specific installers according to `src-tauri/tauri.conf.json`. On Windows this includes MSI and NSIS bundles. macOS and Linux artifacts require their respective build hosts and system prerequisites.

## Versioning

Keep `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json` on the same semantic version. Release commits should contain only version, changelog, and release-configuration changes.

## Signing

Configure signing through CI environment secrets and platform key stores. Do not place certificates, private keys, passwords, Apple API credentials, or Tauri signing keys in repository files, command history, or build logs.
