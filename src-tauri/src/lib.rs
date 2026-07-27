use serde::Serialize;

use ai::{
    commands::{clear_ai_key, get_ai_settings, run_ai_action, save_ai_settings},
    settings::{AISettingsState, KeyringSecretStore},
};
use analysis::{
    cache::AnalysisState,
    commands::{analyze_file, get_project_statistics},
};
use documentation::commands::{export_documentation, generate_documentation};
use project::commands::{ScanRegistry, cancel_scan, open_project};
use search::commands::{get_dependency_graph, search_project};
use tauri::Manager;

mod ai;
mod analysis;
mod documentation;
mod languages;
mod project;
mod search;

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
        .manage(AnalysisState::default())
        .setup(|app| {
            let settings_path = app.path().app_config_dir()?.join("ai-settings.json");
            app.manage(AISettingsState::load(
                settings_path,
                Box::new(KeyringSecretStore),
            ));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            application_info,
            open_project,
            cancel_scan,
            analyze_file,
            get_project_statistics,
            search_project,
            get_dependency_graph,
            generate_documentation,
            export_documentation,
            get_ai_settings,
            save_ai_settings,
            clear_ai_key,
            run_ai_action
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
