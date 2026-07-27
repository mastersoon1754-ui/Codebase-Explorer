use serde::Serialize;

use project::commands::{ScanRegistry, cancel_scan, open_project};

mod project;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ApplicationInfo {
    name: &'static str,
    version: &'static str,
}

#[tauri::command]
fn application_info() -> ApplicationInfo {
    ApplicationInfo {
        name: "Codebase Explorer",
        version: env!("CARGO_PKG_VERSION"),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(ScanRegistry::default())
        .invoke_handler(tauri::generate_handler![
            application_info,
            open_project,
            cancel_scan
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn application_metadata_matches_package() {
        let info = application_info();

        assert_eq!(info.name, "Codebase Explorer");
        assert_eq!(info.version, env!("CARGO_PKG_VERSION"));
    }
}
