use serde::Serialize;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectEntry {
    pub path: String,
    pub name: String,
    pub parent: Option<String>,
    pub kind: EntryKind,
    pub size: u64,
    pub language: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum EntryKind {
    Directory,
    File,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LanguageTotal {
    pub id: String,
    pub file_count: u64,
    pub total_bytes: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSnapshot {
    pub scan_id: String,
    pub root: String,
    pub name: String,
    pub entries: Vec<ProjectEntry>,
    pub languages: Vec<LanguageTotal>,
    pub file_count: u64,
    pub total_bytes: u64,
    pub skipped_count: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanProgress {
    pub scan_id: String,
    pub files_scanned: u64,
    pub current_path: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanError {
    pub code: &'static str,
    pub message: String,
}

impl ScanError {
    pub fn invalid_root(message: impl Into<String>) -> Self {
        Self {
            code: "invalidRoot",
            message: message.into(),
        }
    }

    pub fn cancelled() -> Self {
        Self {
            code: "cancelled",
            message: "Project scan was cancelled".into(),
        }
    }
}
