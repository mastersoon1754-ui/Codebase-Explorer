use std::{fs, path::Path};

use tauri::State;

use super::{
    cache::AnalysisState,
    parser::parse_file,
    relationships::resolve_imports,
    statistics::calculate_statistics,
    types::{AnalysisError, FileAnalysis, ProjectStatistics},
};

const MAX_SOURCE_BYTES: u64 = 5 * 1024 * 1024;

#[tauri::command]
pub async fn analyze_file(
    state: State<'_, AnalysisState>,
    scan_id: String,
    path: String,
) -> Result<FileAnalysis, AnalysisError> {
    let root = state.project_root(&scan_id).ok_or_else(|| {
        AnalysisError::new("projectNotFound", "The project is no longer available")
    })?;
    let cache_key = (scan_id, path.clone());
    let cached = state.files().get(&cache_key).cloned();

    let analysis =
        tauri::async_runtime::spawn_blocking(move || analyze_path(&root, &path, cached.as_ref()))
            .await
            .map_err(|error| {
                AnalysisError::new(
                    "analysisFailed",
                    format!("Source analysis stopped unexpectedly: {error}"),
                )
            })??;

    if !analysis.cached {
        state.files().insert(cache_key, analysis.clone());
    }
    Ok(analysis)
}

#[tauri::command]
pub async fn get_project_statistics(
    state: State<'_, AnalysisState>,
    scan_id: String,
) -> Result<ProjectStatistics, AnalysisError> {
    let project = state.project(&scan_id).ok_or_else(|| {
        AnalysisError::new("projectNotFound", "The project is no longer available")
    })?;
    tauri::async_runtime::spawn_blocking(move || {
        calculate_statistics(&project.root, &project.entries)
    })
    .await
    .map_err(|error| {
        AnalysisError::new(
            "analysisFailed",
            format!("Project statistics stopped unexpectedly: {error}"),
        )
    })?
}

fn analyze_path(
    root: &Path,
    relative_path: &str,
    cached: Option<&FileAnalysis>,
) -> Result<FileAnalysis, AnalysisError> {
    let root = root.canonicalize().map_err(|error| {
        AnalysisError::new(
            "projectNotFound",
            format!("Could not open project folder: {error}"),
        )
    })?;
    let requested = root.join(relative_path);
    let canonical = requested.canonicalize().map_err(|error| {
        AnalysisError::new(
            "fileNotFound",
            format!("Could not open source file: {error}"),
        )
    })?;
    if !canonical.starts_with(&root) || !canonical.is_file() {
        return Err(AnalysisError::new(
            "invalidPath",
            "Source file is outside the open project",
        ));
    }
    let metadata = canonical.metadata().map_err(|error| {
        AnalysisError::new(
            "fileNotFound",
            format!("Could not inspect source file: {error}"),
        )
    })?;
    if metadata.len() > MAX_SOURCE_BYTES {
        return Err(AnalysisError::new(
            "fileTooLarge",
            "Source files larger than 5 MB are not parsed",
        ));
    }

    let bytes = fs::read(&canonical).map_err(|error| {
        AnalysisError::new(
            "fileNotFound",
            format!("Could not read source file: {error}"),
        )
    })?;
    let content_hash = blake3::hash(&bytes).to_hex().to_string();
    if let Some(cached) = cached.filter(|analysis| analysis.content_hash == content_hash) {
        let mut result = cached.clone();
        result.cached = true;
        return Ok(result);
    }
    let source = String::from_utf8(bytes)
        .map_err(|_| AnalysisError::new("invalidEncoding", "Source file is not valid UTF-8"))?;
    let mut analysis = parse_file(&canonical, relative_path, source)?;
    resolve_imports(&root, relative_path, &mut analysis);
    Ok(analysis)
}

#[cfg(test)]
mod tests {
    use std::fs;

    use tempfile::tempdir;

    use super::*;

    #[test]
    fn reuses_analysis_when_content_is_unchanged() {
        let fixture = tempdir().unwrap();
        let path = fixture.path().join("main.py");
        fs::write(&path, "def main():\n    pass\n").unwrap();
        let first = analyze_path(fixture.path(), "main.py", None).unwrap();
        let second = analyze_path(fixture.path(), "main.py", Some(&first)).unwrap();

        assert!(!first.cached);
        assert!(second.cached);
        assert_eq!(first.content_hash, second.content_hash);
    }

    #[test]
    fn rejects_parent_directory_traversal() {
        let parent = tempdir().unwrap();
        let root = parent.path().join("project");
        fs::create_dir(&root).unwrap();
        fs::write(parent.path().join("secret.py"), "SECRET = True").unwrap();

        let error = analyze_path(&root, "../secret.py", None).unwrap_err();

        assert_eq!(error.code, "invalidPath");
    }

    #[test]
    fn rejects_unsupported_files() {
        let fixture = tempdir().unwrap();
        fs::write(fixture.path().join("notes.txt"), "plain text").unwrap();

        let error = analyze_path(fixture.path(), "notes.txt", None).unwrap_err();

        assert_eq!(error.code, "unsupportedLanguage");
    }
}
