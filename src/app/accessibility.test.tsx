import "@testing-library/jest-dom/vitest";
import { render } from "@testing-library/react";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAIStore } from "../features/ai/ai-store";
import { App } from "./App";

vi.mock("../features/project/api", () => ({
  onScanProgress: vi.fn().mockResolvedValue(() => undefined),
  chooseProjectFolder: vi.fn().mockResolvedValue(null),
  scanProject: vi.fn(),
  cancelProjectScan: vi.fn(),
}));
vi.mock("../features/ai/api", () => ({
  getAISettings: vi.fn().mockResolvedValue({
    endpoint: "https://api.openai.com/v1",
    model: "gpt-4.1-mini",
    configured: false,
  }),
  runAIAction: vi.fn(),
}));

describe("Accessibility", () => {
  beforeEach(() => {
    localStorage.clear();
    useAIStore.setState({ settings: null, response: null, error: null });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
  });

  it("has no serious automated accessibility violations in the empty workspace", async () => {
    const { container } = render(<App />);
    const result = await axe.run(container, {
      rules: {
        "color-contrast": { enabled: false },
      },
    });

    expect(
      result.violations.filter((violation) =>
        ["serious", "critical"].includes(violation.impact ?? ""),
      ),
    ).toEqual([]);
  });
});
