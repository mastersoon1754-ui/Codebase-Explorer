import { invoke } from "@tauri-apps/api/core";
import type { AIAction, AIResponse, AISettings } from "./types";

export function getAISettings() {
  return invoke<AISettings>("get_ai_settings");
}

export function saveAISettings(
  endpoint: string,
  model: string,
  apiKey?: string,
) {
  return invoke<AISettings>("save_ai_settings", {
    endpoint,
    model,
    apiKey: apiKey || null,
  });
}

export function clearAIKey() {
  return invoke<AISettings>("clear_ai_key");
}

export function runAIAction(request: {
  scanId: string;
  path: string;
  action: AIAction;
  symbolId?: string;
}) {
  return invoke<AIResponse>("run_ai_action", {
    request: { ...request, symbolId: request.symbolId ?? null },
  });
}
