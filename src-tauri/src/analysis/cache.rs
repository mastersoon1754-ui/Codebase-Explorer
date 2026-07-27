use std::{
    collections::HashMap,
    path::PathBuf,
    sync::{Mutex, MutexGuard},
};

use super::types::FileAnalysis;
use crate::project::types::ProjectEntry;
use crate::search::types::ProjectIndex;

#[derive(Clone)]
pub struct ProjectRecord {
    pub root: PathBuf,
    pub entries: Vec<ProjectEntry>,
}

#[derive(Default)]
pub struct AnalysisState {
    projects: Mutex<HashMap<String, ProjectRecord>>,
    files: Mutex<HashMap<(String, String), FileAnalysis>>,
    search_indexes: Mutex<HashMap<String, ProjectIndex>>,
}

impl AnalysisState {
    pub fn register_project(&self, scan_id: String, root: PathBuf, entries: Vec<ProjectEntry>) {
        self.projects
            .lock()
            .expect("project registry lock poisoned")
            .insert(scan_id, ProjectRecord { root, entries });
    }

    pub fn project_root(&self, scan_id: &str) -> Option<PathBuf> {
        self.projects
            .lock()
            .expect("project registry lock poisoned")
            .get(scan_id)
            .map(|project| project.root.clone())
    }

    pub fn project(&self, scan_id: &str) -> Option<ProjectRecord> {
        self.projects
            .lock()
            .expect("project registry lock poisoned")
            .get(scan_id)
            .cloned()
    }

    pub fn files(&self) -> MutexGuard<'_, HashMap<(String, String), FileAnalysis>> {
        self.files.lock().expect("analysis cache lock poisoned")
    }

    pub fn search_index(&self, scan_id: &str) -> Option<ProjectIndex> {
        self.search_indexes
            .lock()
            .expect("search index lock poisoned")
            .get(scan_id)
            .cloned()
    }

    pub fn store_search_index(&self, scan_id: String, index: ProjectIndex) {
        self.search_indexes
            .lock()
            .expect("search index lock poisoned")
            .insert(scan_id, index);
    }
}
