use std::{
    collections::HashMap,
    path::PathBuf,
    sync::{Arc, Mutex, atomic::AtomicBool},
};

use super::{
    scanner::scan_project,
    types::{ProjectSnapshot, ScanError, ScanProgress},
};
use tauri::{AppHandle, Emitter, State};

use crate::analysis::cache::AnalysisState;

#[derive(Default)]
pub struct ScanRegistry(Mutex<HashMap<String, Arc<AtomicBool>>>);

#[tauri::command]
pub async fn open_project(
    app: AppHandle,
    registry: State<'_, ScanRegistry>,
    analysis: State<'_, AnalysisState>,
    path: PathBuf,
    scan_id: String,
) -> Result<ProjectSnapshot, ScanError> {
    let cancellation = Arc::new(AtomicBool::new(false));
    registry
        .0
        .lock()
        .expect("scan registry lock poisoned")
        .insert(scan_id.clone(), Arc::clone(&cancellation));

    let app_handle = app.clone();
    let worker_scan_id = scan_id.clone();
    let result = tauri::async_runtime::spawn_blocking(move || {
        scan_project(
            &path,
            worker_scan_id.clone(),
            &cancellation,
            |files_scanned, current_path| {
                let _ = app_handle.emit(
                    "project-scan-progress",
                    ScanProgress {
                        scan_id: worker_scan_id.clone(),
                        files_scanned,
                        current_path: current_path.to_owned(),
                    },
                );
            },
        )
    })
    .await
    .map_err(|error| ScanError {
        code: "scanFailed",
        message: format!("Project scanner stopped unexpectedly: {error}"),
    })?;

    registry
        .0
        .lock()
        .expect("scan registry lock poisoned")
        .remove(&scan_id);
    if let Ok(snapshot) = &result {
        analysis.register_project(
            scan_id,
            PathBuf::from(&snapshot.root),
            snapshot.entries.clone(),
        );
    }
    result
}

#[tauri::command]
pub fn cancel_scan(registry: State<'_, ScanRegistry>, scan_id: String) -> bool {
    let scans = registry.0.lock().expect("scan registry lock poisoned");
    scans.get(&scan_id).is_some_and(|flag| {
        flag.store(true, std::sync::atomic::Ordering::Relaxed);
        true
    })
}
