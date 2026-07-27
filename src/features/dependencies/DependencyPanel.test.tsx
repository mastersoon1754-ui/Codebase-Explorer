import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { FileAnalysis } from "../symbols/types";
import type { ProjectStatistics } from "../statistics/types";
import { CallPanel, DependencyPanel } from "./DependencyPanel";

const statistics: ProjectStatistics = {
  totalLines: 120,
  sourceLines: 90,
  blankLines: 20,
  commentLines: 10,
  largestFiles: [],
  dependencies: [
    {
      name: "react",
      version: "^19",
      scope: "runtime",
      manifest: "package.json",
    },
  ],
};

const analysis: FileAnalysis = {
  path: "src/app.ts",
  language: "typescript",
  contentHash: "hash",
  source: "import { get } from './http';\nget();",
  symbols: [],
  imports: [
    {
      module: "./http",
      kind: "local",
      resolvedPath: "src/http.ts",
      range: {
        start: { row: 1, column: 1 },
        end: { row: 1, column: 30 },
      },
    },
  ],
  calls: [
    {
      target: "get",
      caller: null,
      range: {
        start: { row: 2, column: 1 },
        end: { row: 2, column: 6 },
      },
    },
  ],
  parseErrors: 0,
  cached: false,
};

describe("DependencyPanel", () => {
  it("shows manifest dependencies when no file is selected", () => {
    render(<DependencyPanel analysis={null} statistics={statistics} />);

    expect(screen.getByText("react")).toBeInTheDocument();
    expect(screen.getByText("^19 · runtime")).toBeInTheDocument();
  });

  it("shows resolved imports for the selected file", () => {
    render(<DependencyPanel analysis={analysis} statistics={statistics} />);

    expect(screen.getByText("./http")).toBeInTheDocument();
    expect(screen.getByText("src/http.ts")).toBeInTheDocument();
  });

  it("shows direct calls and their scope", () => {
    render(<CallPanel analysis={analysis} />);

    expect(screen.getByText("get")).toBeInTheDocument();
    expect(screen.getByText("module scope")).toBeInTheDocument();
  });
});
