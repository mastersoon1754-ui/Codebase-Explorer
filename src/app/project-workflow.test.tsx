import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProjectStore } from "../features/project/project-store";
import { analyzeSourceFile } from "../features/symbols/api";
import { loadProjectStatistics } from "../features/statistics/api";
import { chooseProjectFolder, scanProject } from "../features/project/api";
import { App } from "./App";

vi.mock("../features/project/api", () => ({
  onScanProgress: vi.fn().mockResolvedValue(() => undefined),
  chooseProjectFolder: vi.fn(),
  scanProject: vi.fn(),
  cancelProjectScan: vi.fn(),
}));
vi.mock("../features/symbols/api", () => ({ analyzeSourceFile: vi.fn() }));
vi.mock("../features/statistics/api", () => ({
  loadProjectStatistics: vi.fn(),
}));
vi.mock("../features/ai/api", () => ({
  getAISettings: vi.fn().mockResolvedValue({
    endpoint: "https://api.openai.com/v1",
    model: "gpt-4.1-mini",
    configured: false,
  }),
  runAIAction: vi.fn(),
}));
vi.mock("../features/explorer/FileTree", () => ({
  FileTree: ({ onSelectFile }: { onSelectFile: (path: string) => void }) => (
    <button onClick={() => onSelectFile("src/main.ts")} type="button">
      main.ts
    </button>
  ),
}));

describe("Project workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useProjectStore.setState({
      project: null,
      progress: null,
      error: null,
      isScanning: false,
      selectedFile: null,
      selectedSymbol: null,
      statistics: null,
      isAnalyzing: false,
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
    vi.mocked(chooseProjectFolder).mockResolvedValue("C:/example");
    vi.mocked(scanProject).mockResolvedValue({
      scanId: "scan-1",
      root: "C:/example",
      name: "example",
      entries: [
        {
          path: "src/main.ts",
          name: "main.ts",
          parent: "src",
          kind: "file",
          size: 30,
          language: "typescript",
        },
      ],
      languages: [{ id: "typescript", fileCount: 1, totalBytes: 30 }],
      fileCount: 1,
      totalBytes: 30,
      skippedCount: 0,
    });
    vi.mocked(loadProjectStatistics).mockResolvedValue({
      totalLines: 1,
      sourceLines: 1,
      blankLines: 0,
      commentLines: 0,
      largestFiles: [],
      dependencies: [],
    });
    vi.mocked(analyzeSourceFile).mockResolvedValue({
      path: "src/main.ts",
      language: "typescript",
      contentHash: "hash",
      source: "export function main() {}",
      symbols: [
        {
          id: "src/main.ts:main",
          name: "main",
          qualifiedName: "main",
          kind: "function",
          signature: "export function main()",
          documentation: null,
          range: {
            start: { row: 1, column: 1 },
            end: { row: 1, column: 26 },
          },
          parentId: null,
        },
      ],
      imports: [],
      calls: [],
      parseErrors: 0,
      cached: false,
    });
  });

  it("opens a project and reveals source and symbols", async () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Open project folder" }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "example" }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "main.ts" }));

    await waitFor(() =>
      expect(screen.getByLabelText("Source code")).toHaveTextContent(
        "export function main()",
      ),
    );
    expect(screen.getByLabelText("File symbols")).toHaveTextContent("main");
  });
});
