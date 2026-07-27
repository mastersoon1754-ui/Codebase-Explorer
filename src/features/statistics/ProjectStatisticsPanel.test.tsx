import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProjectStatisticsPanel } from "./ProjectStatisticsPanel";

describe("ProjectStatisticsPanel", () => {
  it("renders line totals and largest files", () => {
    render(
      <ProjectStatisticsPanel
        statistics={{
          totalLines: 1200,
          sourceLines: 900,
          blankLines: 200,
          commentLines: 100,
          dependencies: [],
          largestFiles: [{ path: "src/parser.ts", size: 4096, lines: 150 }],
        }}
      />,
    );

    expect(
      screen.getByText((text) => text.replace(/\D/g, "") === "1200"),
    ).toBeInTheDocument();
    expect(screen.getByText("src/parser.ts")).toBeInTheDocument();
    expect(screen.getByText("4.0 KB")).toBeInTheDocument();
  });
});
