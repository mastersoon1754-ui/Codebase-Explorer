use std::{
    collections::HashMap,
    path::PathBuf,
    sync::{Mutex, MutexGuard},
};

use super::types::FileAnalysis;

#[derive(Default)]
pub struct AnalysisState {
    projects: Mutex<HashMap<String, PathBuf>>,
    files: Mutex<HashMap<(String, String), FileAnalysis>>,
}

impl AnalysisState {
    pub fn register_project(&self, scan_id: String, root: PathBuf) {
        self.projects
            .lock()
            .expect("project registry lock poisoned")
            .insert(scan_id, root);
    }

    pub fn project_root(&self, scan_id: &str) -> Option<PathBuf> {
        self.projects
            .lock()
            .expect("project registry lock poisoned")
            .get(scan_id)
            .cloned()
    }

    pub fn files(&self) -> MutexGuard<'_, HashMap<(String, String), FileAnalysis>> {
        self.files.lock().expect("analysis cache lock poisoned")
    }
}
