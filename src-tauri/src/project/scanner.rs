use std::{
    collections::{BTreeMap, BTreeSet},
    path::Path,
    sync::atomic::{AtomicBool, Ordering},
};

use ignore::WalkBuilder;

use super::types::{EntryKind, LanguageTotal, ProjectEntry, ProjectSnapshot, ScanError};

const EXCLUDED_DIRECTORIES: &[&str] = &[
    ".git",
    ".hg",
    ".svn",
    ".next",
    ".nuxt",
    ".pytest_cache",
    ".tox",
    ".venv",
    "__pycache__",
    "build",
    "coverage",
    "dist",
    "node_modules",
    "target",
    "vendor",
];

pub fn scan_project(
    root: &Path,
    scan_id: String,
    cancelled: &AtomicBool,
    mut on_progress: impl FnMut(u64, &str),
) -> Result<ProjectSnapshot, ScanError> {
    if !root.is_dir() {
        return Err(ScanError::invalid_root(format!(
            "Project folder does not exist: {}",
            root.display()
        )));
    }

    let root = root.canonicalize().map_err(|error| {
        ScanError::invalid_root(format!("Could not open project folder: {error}"))
    })?;
    let mut directories = BTreeSet::new();
    let mut files = Vec::new();
    let mut language_totals: BTreeMap<&'static str, (u64, u64)> = BTreeMap::new();
    let mut file_count: u64 = 0;
    let mut total_bytes: u64 = 0;
    let mut skipped_count: u64 = 0;

    let mut builder = WalkBuilder::new(&root);
    builder
        .hidden(false)
        .ignore(true)
        .git_ignore(true)
        .git_global(true)
        .git_exclude(true)
        .require_git(false)
        .follow_links(false)
        .filter_entry(|entry| {
            entry
                .file_name()
                .to_str()
                .is_none_or(|name| !EXCLUDED_DIRECTORIES.contains(&name))
        });

    for result in builder.build() {
        if cancelled.load(Ordering::Relaxed) {
            return Err(ScanError::cancelled());
        }

        let entry = match result {
            Ok(entry) => entry,
            Err(_) => {
                skipped_count += 1;
                continue;
            }
        };
        if entry.path() == root || entry.path_is_symlink() {
            continue;
        }

        let Some(relative_path) = normalized_relative_path(&root, entry.path()) else {
            skipped_count += 1;
            continue;
        };
        let Some(name) = entry.file_name().to_str().map(str::to_owned) else {
            skipped_count += 1;
            continue;
        };

        if entry.file_type().is_some_and(|kind| kind.is_dir()) {
            directories.insert(relative_path);
            continue;
        }
        if !entry.file_type().is_some_and(|kind| kind.is_file()) {
            continue;
        }
        if is_known_binary(entry.path()) {
            skipped_count += 1;
            continue;
        }

        let metadata = match entry.metadata() {
            Ok(metadata) => metadata,
            Err(_) => {
                skipped_count += 1;
                continue;
            }
        };
        let size = metadata.len();
        let language_id = detect_language(entry.path());
        if let Some(language_id) = language_id {
            let total = language_totals.entry(language_id).or_default();
            total.0 += 1;
            total.1 += size;
        }

        file_count += 1;
        total_bytes += size;
        if file_count == 1 || file_count.is_multiple_of(250) {
            on_progress(file_count, &relative_path);
        }
        files.push(ProjectEntry {
            parent: parent_path(&relative_path),
            path: relative_path,
            name,
            kind: EntryKind::File,
            size,
            language: language_id.map(str::to_owned),
        });
    }

    let mut entries: Vec<ProjectEntry> = directories
        .into_iter()
        .filter_map(|path| {
            let name = Path::new(&path).file_name()?.to_str()?.to_owned();
            Some(ProjectEntry {
                parent: parent_path(&path),
                path,
                name,
                kind: EntryKind::Directory,
                size: 0,
                language: None,
            })
        })
        .collect();
    entries.extend(files);
    entries.sort_by(|left, right| left.path.cmp(&right.path));

    let languages = language_totals
        .into_iter()
        .map(|(id, (file_count, total_bytes))| LanguageTotal {
            id: id.to_owned(),
            file_count,
            total_bytes,
        })
        .collect();
    let name = root
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("Project")
        .to_owned();

    Ok(ProjectSnapshot {
        scan_id,
        root: root.to_string_lossy().into_owned(),
        name,
        entries,
        languages,
        file_count,
        total_bytes,
        skipped_count,
    })
}

fn normalized_relative_path(root: &Path, path: &Path) -> Option<String> {
    let path = path.strip_prefix(root).ok()?;
    let parts: Option<Vec<&str>> = path.iter().map(|part| part.to_str()).collect();
    Some(parts?.join("/"))
}

fn parent_path(path: &str) -> Option<String> {
    Path::new(path)
        .parent()
        .filter(|parent| !parent.as_os_str().is_empty())
        .map(|parent| parent.to_string_lossy().replace('\\', "/"))
}

fn detect_language(path: &Path) -> Option<&'static str> {
    let extension = path.extension()?.to_str()?.to_ascii_lowercase();
    match extension.as_str() {
        "py" | "pyi" => Some("python"),
        "js" | "jsx" | "mjs" | "cjs" => Some("javascript"),
        "ts" | "tsx" | "mts" | "cts" => Some("typescript"),
        "json" => Some("json"),
        "css" | "scss" | "sass" | "less" => Some("css"),
        "html" | "htm" => Some("html"),
        "md" | "mdx" => Some("markdown"),
        "rs" => Some("rust"),
        "toml" => Some("toml"),
        "yaml" | "yml" => Some("yaml"),
        _ => None,
    }
}

fn is_known_binary(path: &Path) -> bool {
    let Some(extension) = path.extension().and_then(|value| value.to_str()) else {
        return false;
    };
    matches!(
        extension.to_ascii_lowercase().as_str(),
        "7z" | "a"
            | "avi"
            | "bin"
            | "bmp"
            | "class"
            | "dll"
            | "dylib"
            | "eot"
            | "exe"
            | "gif"
            | "gz"
            | "ico"
            | "jar"
            | "jpeg"
            | "jpg"
            | "lib"
            | "lockb"
            | "mov"
            | "mp3"
            | "mp4"
            | "o"
            | "otf"
            | "pdf"
            | "png"
            | "pyc"
            | "so"
            | "tar"
            | "ttf"
            | "wasm"
            | "wav"
            | "webm"
            | "webp"
            | "woff"
            | "woff2"
            | "zip"
    )
}

#[cfg(test)]
mod tests {
    use std::{fs, sync::atomic::AtomicBool};

    use tempfile::tempdir;

    use super::*;

    #[test]
    fn scans_project_entries_and_detects_languages() {
        let fixture = tempdir().unwrap();
        fs::create_dir_all(fixture.path().join("src/components")).unwrap();
        fs::write(
            fixture.path().join("src/main.ts"),
            "export const main = true;",
        )
        .unwrap();
        fs::write(
            fixture.path().join("src/components/App.tsx"),
            "export function App() {}",
        )
        .unwrap();
        fs::write(fixture.path().join("worker.py"), "def run():\n    pass\n").unwrap();
        fs::write(fixture.path().join("README.md"), "# Fixture").unwrap();

        let snapshot = scan_project(
            fixture.path(),
            "scan-1".into(),
            &AtomicBool::new(false),
            |_, _| {},
        )
        .unwrap();

        assert_eq!(snapshot.file_count, 4);
        assert!(snapshot.entries.iter().any(|entry| entry.path == "src"));
        assert!(snapshot.entries.iter().any(|entry| {
            entry.path == "src/components/App.tsx"
                && entry.language.as_deref() == Some("typescript")
        }));
        assert!(
            snapshot
                .languages
                .iter()
                .any(|language| { language.id == "typescript" && language.file_count == 2 })
        );
    }

    #[test]
    fn excludes_generated_and_dependency_directories() {
        let fixture = tempdir().unwrap();
        for directory in [".git", "node_modules", "dist", "target", "__pycache__"] {
            fs::create_dir_all(fixture.path().join(directory)).unwrap();
            fs::write(fixture.path().join(directory).join("ignored.js"), "ignored").unwrap();
        }
        fs::write(fixture.path().join("index.js"), "visible").unwrap();

        let snapshot = scan_project(
            fixture.path(),
            "scan-2".into(),
            &AtomicBool::new(false),
            |_, _| {},
        )
        .unwrap();

        assert_eq!(snapshot.file_count, 1);
        assert_eq!(snapshot.entries.len(), 1);
        assert_eq!(snapshot.entries[0].path, "index.js");
    }

    #[test]
    fn skips_known_binary_files() {
        let fixture = tempdir().unwrap();
        fs::write(fixture.path().join("logo.png"), [0, 1, 2, 3]).unwrap();
        fs::write(fixture.path().join("Dockerfile"), "FROM scratch").unwrap();

        let snapshot = scan_project(
            fixture.path(),
            "scan-binary".into(),
            &AtomicBool::new(false),
            |_, _| {},
        )
        .unwrap();

        assert_eq!(snapshot.file_count, 1);
        assert_eq!(snapshot.skipped_count, 1);
        assert_eq!(snapshot.entries[0].path, "Dockerfile");
    }

    #[test]
    fn respects_gitignore_files() {
        let fixture = tempdir().unwrap();
        fs::write(fixture.path().join(".gitignore"), "private.py\n").unwrap();
        fs::write(fixture.path().join("private.py"), "secret = True").unwrap();
        fs::write(fixture.path().join("public.py"), "public = True").unwrap();

        let snapshot = scan_project(
            fixture.path(),
            "scan-3".into(),
            &AtomicBool::new(false),
            |_, _| {},
        )
        .unwrap();

        assert!(
            snapshot
                .entries
                .iter()
                .any(|entry| entry.path == "public.py")
        );
        assert!(
            !snapshot
                .entries
                .iter()
                .any(|entry| entry.path == "private.py")
        );
    }

    #[test]
    fn stops_before_walking_when_cancelled() {
        let fixture = tempdir().unwrap();
        fs::write(fixture.path().join("main.py"), "print('hello')").unwrap();

        let result = scan_project(
            fixture.path(),
            "scan-4".into(),
            &AtomicBool::new(true),
            |_, _| {},
        );

        assert_eq!(result.unwrap_err().code, "cancelled");
    }

    #[test]
    fn rejects_paths_that_are_not_directories() {
        let fixture = tempdir().unwrap();
        let file = fixture.path().join("main.py");
        fs::write(&file, "print('hello')").unwrap();

        let result = scan_project(&file, "scan-5".into(), &AtomicBool::new(false), |_, _| {});

        assert_eq!(result.unwrap_err().code, "invalidRoot");
    }
}
