import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { searchProject } from "./api";
import { SearchPalette } from "./SearchPalette";

vi.mock("./api", () => ({ searchProject: vi.fn() }));

const results = [
  {
    kind: "symbol" as const,
    label: "Parser",
    detail: "src/parser.ts · class",
    path: "src/parser.ts",
    line: 8,
    symbolId: "src/parser.ts:Parser",
    analyzable: true,
  },
  {
    kind: "file" as const,
    label: "parser.test.ts",
    detail: "src/parser.test.ts",
    path: "src/parser.test.ts",
    line: null,
    symbolId: null,
    analyzable: true,
  },
];

describe("SearchPalette", () => {
  it("searches and opens the keyboard-selected result", async () => {
    vi.mocked(searchProject).mockResolvedValue(results);
    const onSelect = vi.fn();
    render(
      <SearchPalette scanId="scan-1" onClose={vi.fn()} onSelect={onSelect} />,
    );

    const input = screen.getByRole("textbox", {
      name: "Search files and symbols",
    });
    fireEvent.change(input, { target: { value: "parser" } });
    await waitFor(() => expect(screen.getByText("Parser")).toBeInTheDocument());
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSelect).toHaveBeenCalledWith(results[1]);
  });

  it("closes with Escape", () => {
    const onClose = vi.fn();
    render(
      <SearchPalette scanId="scan-1" onClose={onClose} onSelect={vi.fn()} />,
    );

    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });

    expect(onClose).toHaveBeenCalledOnce();
  });
});
