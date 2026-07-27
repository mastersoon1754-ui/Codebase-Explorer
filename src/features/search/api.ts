import { invoke } from "@tauri-apps/api/core";
import type { SearchResult } from "./types";

export function searchProject(scanId: string, query: string, limit = 40) {
  return invoke<SearchResult[]>("search_project", { scanId, query, limit });
}
