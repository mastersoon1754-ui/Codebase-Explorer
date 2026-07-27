import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useAIStore } from "./ai-store";
import { AIActions } from "./AIActions";

describe("AIActions", () => {
  beforeEach(() => {
    useAIStore.setState({ settings: null, loading: false });
  });

  it("is absent when no provider key is configured", () => {
    render(<AIActions scanId="scan-1" path="src/app.ts" />);
    expect(screen.queryByLabelText("AI actions")).not.toBeInTheDocument();
  });

  it("appears only after provider configuration", () => {
    useAIStore.setState({
      settings: {
        endpoint: "https://provider.test/v1",
        model: "model-a",
        configured: true,
      },
    });
    render(<AIActions scanId="scan-1" path="src/app.ts" />);
    expect(screen.getByLabelText("AI actions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Explain file" })).toBeEnabled();
  });
});
