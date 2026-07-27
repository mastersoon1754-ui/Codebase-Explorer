import { invoke } from "@tauri-apps/api/core";
import type { DocumentationBundle, ExportFormat } from "./types";

export function generateDocumentation(scanId: string) {
  return invoke<DocumentationBundle>("generate_documentation", { scanId });
}

export function exportDocumentation(
  scanId: string,
  format: ExportFormat,
  destination: string,
) {
  return invoke<void>("export_documentation", { scanId, format, destination });
}
