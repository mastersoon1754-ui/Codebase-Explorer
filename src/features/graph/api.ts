import { invoke } from "@tauri-apps/api/core";
import type { DependencyGraphData } from "./types";

export function loadDependencyGraph(scanId: string) {
  return invoke<DependencyGraphData>("get_dependency_graph", { scanId });
}
