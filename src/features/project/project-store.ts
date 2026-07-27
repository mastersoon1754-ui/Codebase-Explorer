import { create } from "zustand";
import { cancelProjectScan, chooseProjectFolder, scanProject } from "./api";
import { analyzeSourceFile } from "../symbols/api";
import type { FileAnalysis, SymbolInfo } from "../symbols/types";
import type { ProjectSnapshot, ScanError, ScanProgress } from "./types";

type ProjectState = {
  project: ProjectSnapshot | null;
  progress: ScanProgress | null;
  error: string | null;
  isScanning: boolean;
  selectedFile: FileAnalysis | null;
  isAnalyzing: boolean;
  selectedSymbol: SymbolInfo | null;
  openProject: () => Promise<void>;
  cancelScan: () => Promise<void>;
  updateProgress: (progress: ScanProgress) => void;
  selectFile: (path: string) => Promise<void>;
  selectSymbol: (symbol: SymbolInfo | null) => void;
};

function errorMessage(error: unknown) {
  if (typeof error === "object" && error && "message" in error) {
    return String((error as ScanError).message);
  }
  return String(error);
}

function createScanId() {
  return crypto.randomUUID();
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: null,
  progress: null,
  error: null,
  isScanning: false,
  selectedFile: null,
  isAnalyzing: false,
  selectedSymbol: null,

  async openProject() {
    const path = await chooseProjectFolder();
    if (!path) return;

    const scanId = createScanId();
    set({
      isScanning: true,
      error: null,
      progress: { scanId, filesScanned: 0, currentPath: "" },
    });

    try {
      const project = await scanProject(path, scanId);
      set({
        project,
        selectedFile: null,
        selectedSymbol: null,
        isScanning: false,
        progress: null,
      });
    } catch (error) {
      const cancelled =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as ScanError).code === "cancelled";
      set({
        error: cancelled ? null : errorMessage(error),
        isScanning: false,
        progress: null,
      });
    }
  },

  async cancelScan() {
    const scanId = get().progress?.scanId;
    if (scanId) await cancelProjectScan(scanId);
  },

  updateProgress(progress) {
    if (get().progress?.scanId === progress.scanId) {
      set({ progress });
    }
  },

  async selectFile(path) {
    const project = get().project;
    if (!project) return;
    set({
      selectedFile: null,
      selectedSymbol: null,
      isAnalyzing: true,
      error: null,
    });
    try {
      const selectedFile = await analyzeSourceFile(project.scanId, path);
      set({ selectedFile, isAnalyzing: false });
    } catch (error) {
      set({ error: errorMessage(error), isAnalyzing: false });
    }
  },

  selectSymbol(selectedSymbol) {
    set({ selectedSymbol });
  },
}));
