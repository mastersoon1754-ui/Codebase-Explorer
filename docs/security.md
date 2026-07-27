# Security Policy

## Reporting

Do not open a public issue for a vulnerability that could expose local source code, credentials, arbitrary files, or generated documents. Contact the repository owner privately through GitHub security advisories when available.

Include the affected commit, operating system, reproduction steps, and impact. Do not include real API keys or private source code.

## Supported Version

Until the first tagged release, security fixes are applied to the latest commit on `main`. After releases begin, this document will list supported release lines.

## Security Boundaries

- Project roots are canonicalized by Rust.
- Analysis commands accept registered scan identifiers and relative paths.
- Parent-directory traversal outside the project is rejected.
- Source files larger than 5 MB are not parsed.
- The WebView has an explicit Content Security Policy and no direct Internet access.
- Exported HTML escapes project-controlled text and contains no remote assets.
- Mermaid uses strict mode and escaped generated labels.
- AI credentials use the operating-system credential manager.
- AI endpoints require HTTPS except on localhost.
- AI is disabled by default and receives source only after an explicit action.

## Deployment Checklist

- Build from a clean, reviewed commit.
- Run the complete frontend and Rust quality matrix.
- Run the 100,000-file benchmark.
- Inspect Tauri capabilities and CSP changes.
- Scan the repository and build logs for credentials.
- Sign platform bundles outside the repository using protected CI secrets.
- Publish checksums with release artifacts.
