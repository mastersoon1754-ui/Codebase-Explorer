import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { generateDocumentation } from "./api";
import DocumentationView from "./DocumentationView";

vi.mock("./api", () => ({ generateDocumentation: vi.fn() }));

describe("DocumentationView", () => {
  it("renders generated Markdown", async () => {
    vi.mocked(generateDocumentation).mockResolvedValue({
      projectName: "Example",
      markdown: "# Example\n\n- Files: 12",
      folderDiagram: "flowchart TD",
      classDiagram: "classDiagram",
      dependencyDiagram: "flowchart LR",
    });
    render(<DocumentationView scanId="scan-1" />);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Example" }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("Files: 12")).toBeInTheDocument();
  });
});
