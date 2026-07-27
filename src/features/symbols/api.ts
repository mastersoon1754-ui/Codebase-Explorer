import { invoke } from "@tauri-apps/api/core";
import type { FileAnalysis } from "./types";

export function analyzeSourceFile(scanId: string, path: string) {
  return invoke<FileAnalysis>("analyze_file", { scanId, path });
}
