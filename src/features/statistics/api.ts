import { invoke } from "@tauri-apps/api/core";
import type { ProjectStatistics } from "./types";

export function loadProjectStatistics(scanId: string) {
  return invoke<ProjectStatistics>("get_project_statistics", { scanId });
}
