import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import type { ProjectSnapshot, ScanProgress } from "./types";

export async function chooseProjectFolder() {
  const selected = await open({
    directory: true,
    multiple: false,
    title: "Open project folder",
  });
  return typeof selected === "string" ? selected : null;
}

export function scanProject(path: string, scanId: string) {
  return invoke<ProjectSnapshot>("open_project", { path, scanId });
}

export function cancelProjectScan(scanId: string) {
  return invoke<boolean>("cancel_scan", { scanId });
}

export function onScanProgress(
  handler: (progress: ScanProgress) => void,
): Promise<UnlistenFn> {
  return listen<ScanProgress>("project-scan-progress", (event) => {
    handler(event.payload);
  });
}
