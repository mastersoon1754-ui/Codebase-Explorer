import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ProjectEntry } from "../project/types";
import { FileTree } from "./FileTree";

vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => count * 26,
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        key: index,
        start: index * 26,
      })),
    scrollToIndex: vi.fn(),
  }),
}));

const entries: ProjectEntry[] = [
  {
    path: "src",
    name: "src",
    parent: null,
    kind: "directory",
    size: 0,
    language: null,
  },
  {
    path: "src/main.ts",
    name: "main.ts",
    parent: "src",
    kind: "file",
    size: 42,
    language: "typescript",
  },
  {
    path: "README.md",
    name: "README.md",
    parent: null,
    kind: "file",
    size: 20,
    language: "markdown",
  },
];

describe("FileTree", () => {
  it("expands directories to reveal their children", () => {
    render(<FileTree entries={entries} />);

    expect(screen.queryByText("main.ts")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("treeitem", { name: /src/i }));

    expect(screen.getByText("main.ts")).toBeInTheDocument();
  });

  it("supports keyboard expansion", () => {
    render(<FileTree entries={entries} />);
    const tree = screen.getByRole("tree", { name: "Project files" });

    fireEvent.keyDown(tree, { key: "ArrowRight" });

    expect(screen.getByText("main.ts")).toBeInTheDocument();
    expect(screen.getByRole("treeitem", { name: /src/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
});
