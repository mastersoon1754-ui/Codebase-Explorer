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
        let mut projects = self
            .projects
            .lock()
            .expect("project registry lock poisoned");
        projects.clear();
        projects.insert(scan_id, ProjectRecord { root, entries });
        self.files
            .lock()
            .expect("analysis cache lock poisoned")
            .clear();
        self.search_indexes
            .lock()
            .expect("search index lock poisoned")
            .clear();
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::search::types::ProjectIndex;

    #[test]
    fn opening_another_project_releases_previous_session_data() {
        let state = AnalysisState::default();
        state.register_project("first".into(), PathBuf::from("first"), Vec::new());
        state.store_search_index("first".into(), ProjectIndex::default());

        state.register_project("second".into(), PathBuf::from("second"), Vec::new());

        assert!(state.project("first").is_none());
        assert!(state.search_index("first").is_none());
        assert!(state.project("second").is_some());
    }
}
