use std::{fs, path::Path};

use serde_json::Value as JsonValue;

use crate::project::types::{EntryKind, ProjectEntry};

use super::types::{
    AnalysisError, DependencyScope, FileStatistic, ManifestDependency, ProjectStatistics,
};

const SOURCE_LANGUAGES: &[&str] = &["python", "javascript", "typescript"];

pub fn calculate_statistics(
    root: &Path,
    entries: &[ProjectEntry],
) -> Result<ProjectStatistics, AnalysisError> {
    let mut total_lines = 0;
    let mut source_lines = 0;
    let mut blank_lines = 0;
    let mut comment_lines = 0;
    let mut largest_files: Vec<FileStatistic> = entries
        .iter()
        .filter(|entry| entry.kind == EntryKind::File)
        .map(|entry| FileStatistic {
            path: entry.path.clone(),
            size: entry.size,
            lines: 0,
        })
        .collect();
    largest_files.sort_by(|left, right| {
        right
            .size
            .cmp(&left.size)
            .then_with(|| left.path.cmp(&right.path))
    });
    largest_files.truncate(10);

    for entry in entries.iter().filter(|entry| {
        entry.kind == EntryKind::File
            && entry
                .language
                .as_deref()
                .is_some_and(|language| SOURCE_LANGUAGES.contains(&language))
            && entry.size <= 5 * 1024 * 1024
    }) {
        let Ok(source) = fs::read_to_string(root.join(&entry.path)) else {
            continue;
        };
        let counts = count_lines(&source, entry.language.as_deref().unwrap_or_default());
        total_lines += counts.0;
        source_lines += counts.1;
        blank_lines += counts.2;
        comment_lines += counts.3;
        if let Some(file) = largest_files
            .iter_mut()
            .find(|file| file.path == entry.path)
        {
            file.lines = counts.0;
        }
    }

    let mut dependencies = Vec::new();
    for entry in entries.iter().filter(|entry| entry.kind == EntryKind::File) {
        match entry.path.as_str() {
            "package.json" => dependencies.extend(package_dependencies(&root.join(&entry.path))?),
            "requirements.txt" => {
                dependencies.extend(requirements_dependencies(&root.join(&entry.path))?)
            }
            "pyproject.toml" => {
                dependencies.extend(pyproject_dependencies(&root.join(&entry.path))?)
            }
            _ => {}
        }
    }
    dependencies.sort_by(|left, right| {
        left.name
            .cmp(&right.name)
            .then_with(|| left.manifest.cmp(&right.manifest))
    });

    Ok(ProjectStatistics {
        total_lines,
        source_lines,
        blank_lines,
        comment_lines,
        largest_files,
        dependencies,
    })
}

fn count_lines(source: &str, language: &str) -> (u64, u64, u64, u64) {
    let mut total = 0;
    let mut code = 0;
    let mut blank = 0;
    let mut comments = 0;
    let mut in_block_comment = false;
    for line in source.lines() {
        total += 1;
        let trimmed = line.trim();
        if trimmed.is_empty() {
            blank += 1;
        } else if language == "python" && trimmed.starts_with('#') {
            comments += 1;
        } else if language != "python"
            && (in_block_comment
                || trimmed.starts_with("//")
                || trimmed.starts_with("/*")
                || trimmed.starts_with('*'))
        {
            comments += 1;
            if trimmed.starts_with("/*") && !trimmed.contains("*/") {
                in_block_comment = true;
            }
            if trimmed.contains("*/") {
                in_block_comment = false;
            }
        } else {
            code += 1;
        }
    }
    (total, code, blank, comments)
}

fn package_dependencies(path: &Path) -> Result<Vec<ManifestDependency>, AnalysisError> {
    let source = fs::read_to_string(path).map_err(manifest_error)?;
    let value: JsonValue = serde_json::from_str(&source).map_err(manifest_error)?;
    let mut dependencies = Vec::new();
    for (key, scope) in [
        ("dependencies", DependencyScope::Runtime),
        ("devDependencies", DependencyScope::Development),
        ("optionalDependencies", DependencyScope::Optional),
    ] {
        if let Some(items) = value.get(key).and_then(JsonValue::as_object) {
            dependencies.extend(items.iter().map(|(name, version)| ManifestDependency {
                name: name.clone(),
                version: version.as_str().map(str::to_owned),
                scope,
                manifest: "package.json".into(),
            }));
        }
    }
    Ok(dependencies)
}

fn requirements_dependencies(path: &Path) -> Result<Vec<ManifestDependency>, AnalysisError> {
    let source = fs::read_to_string(path).map_err(manifest_error)?;
    Ok(source
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty() && !line.starts_with('#') && !line.starts_with('-'))
        .filter_map(|line| {
            let split_at = line.find(['=', '<', '>', '~', '!']).unwrap_or(line.len());
            let name = line[..split_at].trim();
            (!name.is_empty()).then(|| ManifestDependency {
                name: name.to_owned(),
                version: (split_at < line.len()).then(|| line[split_at..].trim().to_owned()),
                scope: DependencyScope::Runtime,
                manifest: "requirements.txt".into(),
            })
        })
        .collect())
}

fn pyproject_dependencies(path: &Path) -> Result<Vec<ManifestDependency>, AnalysisError> {
    let source = fs::read_to_string(path).map_err(manifest_error)?;
    let value: toml::Value = toml::from_str(&source).map_err(manifest_error)?;
    let mut dependencies = Vec::new();
    if let Some(items) = value
        .get("project")
        .and_then(|project| project.get("dependencies"))
        .and_then(toml::Value::as_array)
    {
        dependencies.extend(
            items
                .iter()
                .filter_map(toml::Value::as_str)
                .filter_map(|item| {
                    let split_at = item.find(['=', '<', '>', '~', '!']).unwrap_or(item.len());
                    let name = item[..split_at].trim();
                    (!name.is_empty()).then(|| ManifestDependency {
                        name: name.to_owned(),
                        version: (split_at < item.len())
                            .then(|| item[split_at..].trim().to_owned()),
                        scope: DependencyScope::Runtime,
                        manifest: "pyproject.toml".into(),
                    })
                }),
        );
    }
    Ok(dependencies)
}

fn manifest_error(error: impl std::fmt::Display) -> AnalysisError {
    AnalysisError::new(
        "manifestInvalid",
        format!("Could not read dependency manifest: {error}"),
    )
}

#[cfg(test)]
mod tests {
    use tempfile::tempdir;

    use super::*;

    fn file(path: &str, size: u64, language: Option<&str>) -> ProjectEntry {
        ProjectEntry {
            path: path.into(),
            name: path.into(),
            parent: None,
            kind: EntryKind::File,
            size,
            language: language.map(str::to_owned),
        }
    }

    #[test]
    fn counts_source_lines_and_orders_largest_files() {
        let fixture = tempdir().unwrap();
        fs::write(fixture.path().join("main.py"), "# note\n\nvalue = 1\n").unwrap();
        fs::write(fixture.path().join("app.ts"), "// note\nconst value = 1;\n").unwrap();
        let entries = [
            file("main.py", 20, Some("python")),
            file("app.ts", 100, Some("typescript")),
        ];

        let statistics = calculate_statistics(fixture.path(), &entries).unwrap();

        assert_eq!(statistics.total_lines, 5);
        assert_eq!(statistics.source_lines, 2);
        assert_eq!(statistics.blank_lines, 1);
        assert_eq!(statistics.comment_lines, 2);
        assert_eq!(statistics.largest_files[0].path, "app.ts");
    }

    #[test]
    fn reads_javascript_and_python_manifests() {
        let fixture = tempdir().unwrap();
        fs::write(
            fixture.path().join("package.json"),
            r#"{"dependencies":{"react":"^19"},"devDependencies":{"vitest":"^4"}}"#,
        )
        .unwrap();
        fs::write(
            fixture.path().join("requirements.txt"),
            "requests==2.32\n# comment\n",
        )
        .unwrap();
        fs::write(
            fixture.path().join("pyproject.toml"),
            "[project]\ndependencies = [\"pydantic>=2\"]\n",
        )
        .unwrap();
        let entries = [
            file("package.json", 10, Some("json")),
            file("requirements.txt", 10, None),
            file("pyproject.toml", 10, Some("toml")),
        ];

        let statistics = calculate_statistics(fixture.path(), &entries).unwrap();

        assert!(
            statistics
                .dependencies
                .iter()
                .any(|item| item.name == "react" && item.scope == DependencyScope::Runtime)
        );
        assert!(
            statistics
                .dependencies
                .iter()
                .any(|item| item.name == "vitest" && item.scope == DependencyScope::Development)
        );
        assert!(
            statistics
                .dependencies
                .iter()
                .any(|item| item.name == "requests")
        );
        assert!(
            statistics
                .dependencies
                .iter()
                .any(|item| item.name == "pydantic")
        );
    }
}
