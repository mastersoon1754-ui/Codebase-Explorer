import { create } from "zustand";
import { getAISettings, runAIAction } from "./api";
import type { AIAction, AIResponse, AISettings } from "./types";

type AIActionRequest = {
  scanId: string;
  path: string;
  action: AIAction;
  symbolId?: string;
};

type AIState = {
  settings: AISettings | null;
  response: AIResponse | null;
  error: string | null;
  loading: boolean;
  requestVersion: number;
  lastRequest: AIActionRequest | null;
  loadSettings: () => Promise<void>;
  setSettings: (settings: AISettings) => void;
  run: (request: AIActionRequest) => Promise<void>;
  cancel: () => void;
  retry: () => Promise<void>;
  closeResponse: () => void;
};

function message(error: unknown) {
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

export const useAIStore = create<AIState>((set, get) => ({
  settings: null,
  response: null,
  error: null,
  loading: false,
  requestVersion: 0,
  lastRequest: null,

  async loadSettings() {
    try {
      set({ settings: await getAISettings() });
    } catch {
      set({ settings: null });
    }
  },

  setSettings(settings) {
    set({ settings });
  },

  async run(request) {
    const requestVersion = get().requestVersion + 1;
    set({
      requestVersion,
      lastRequest: request,
      loading: true,
      response: null,
      error: null,
    });
    try {
      const response = await runAIAction(request);
      if (get().requestVersion === requestVersion) {
        set({ response, loading: false });
      }
    } catch (error) {
      if (get().requestVersion === requestVersion) {
        set({ error: message(error), loading: false });
      }
    }
  },

  cancel() {
    set((state) => ({
      requestVersion: state.requestVersion + 1,
      loading: false,
    }));
  },

  async retry() {
    const request = get().lastRequest;
    if (request) await get().run(request);
  },

  closeResponse() {
    set({ response: null, error: null });
  },
}));
