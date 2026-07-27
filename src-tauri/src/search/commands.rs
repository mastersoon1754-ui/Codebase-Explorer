use tauri::State;

use crate::analysis::{cache::AnalysisState, types::AnalysisError};

use super::{
    index::{build_index, search},
    types::{DependencyGraph, SearchResult},
};

async fn ensure_index(
    state: &State<'_, AnalysisState>,
    scan_id: &str,
) -> Result<super::types::ProjectIndex, AnalysisError> {
    if let Some(index) = state.search_index(scan_id) {
        return Ok(index);
    }
    let project = state.project(scan_id).ok_or_else(|| {
        AnalysisError::new("projectNotFound", "The project is no longer available")
    })?;
    let index =
        tauri::async_runtime::spawn_blocking(move || build_index(&project.root, &project.entries))
            .await
            .map_err(|error| {
                AnalysisError::new(
                    "indexFailed",
                    format!("Project index stopped unexpectedly: {error}"),
                )
            })?;
    state.store_search_index(scan_id.to_owned(), index.clone());
    Ok(index)
}

#[tauri::command]
pub async fn search_project(
    state: State<'_, AnalysisState>,
    scan_id: String,
    query: String,
    limit: usize,
) -> Result<Vec<SearchResult>, AnalysisError> {
    let index = ensure_index(&state, &scan_id).await?;
    Ok(search(&index, &query, limit))
}

#[tauri::command]
pub async fn get_dependency_graph(
    state: State<'_, AnalysisState>,
    scan_id: String,
) -> Result<DependencyGraph, AnalysisError> {
    Ok(ensure_index(&state, &scan_id).await?.graph)
}
