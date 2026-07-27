import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { vi } from "vitest";
import type { SymbolInfo } from "./types";
import { SymbolOutline } from "./SymbolOutline";

const symbol: SymbolInfo = {
  id: "service.py:Service.run",
  name: "run",
  qualifiedName: "Service.run",
  kind: "method",
  signature: "def run(self) -> None",
  documentation: "Run the service.",
  range: {
    start: { row: 8, column: 5 },
    end: { row: 10, column: 1 },
  },
  parentId: "service.py:Service",
};

describe("SymbolOutline", () => {
  it("shows symbol names, kinds, and source lines", () => {
    render(
      <SymbolOutline symbols={[symbol]} selectedId={null} onSelect={vi.fn()} />,
    );

    expect(screen.getByText("run")).toBeInTheDocument();
    expect(screen.getByText("method")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("shows a clear empty state", () => {
    render(<SymbolOutline symbols={[]} selectedId={null} onSelect={vi.fn()} />);

    expect(
      screen.getByText("No symbols found in this file."),
    ).toBeInTheDocument();
  });
});
