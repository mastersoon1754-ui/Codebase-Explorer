use std::path::PathBuf;
use tauri::State;

use super::{
    export::export,
    generator::generate,
    types::{DocumentationBundle, ExportFormat},
};
use crate::{
    analysis::{cache::AnalysisState, statistics::calculate_statistics, types::AnalysisError},
    search::commands::ensure_index,
};

#[tauri::command]
pub async fn generate_documentation(
    state: State<'_, AnalysisState>,
    scan_id: String,
) -> Result<DocumentationBundle, AnalysisError> {
    let project = state.project(&scan_id).ok_or_else(|| {
        AnalysisError::new("projectNotFound", "The project is no longer available")
    })?;
    let index = ensure_index(&state, &scan_id).await?;
    tauri::async_runtime::spawn_blocking(move || {
        let statistics = calculate_statistics(&project.root, &project.entries)?;
        Ok(generate(
            &project.root,
            &project.entries,
            &statistics,
            &index,
        ))
    })
    .await
    .map_err(|error| AnalysisError::new("documentationFailed", error.to_string()))?
}

#[tauri::command]
pub async fn export_documentation(
    state: State<'_, AnalysisState>,
    scan_id: String,
    format: ExportFormat,
    destination: PathBuf,
) -> Result<(), AnalysisError> {
    let bundle = generate_documentation(state, scan_id).await?;
    tauri::async_runtime::spawn_blocking(move || export(&bundle, format, &destination))
        .await
        .map_err(|error| AnalysisError::new("exportFailed", error.to_string()))?
}
