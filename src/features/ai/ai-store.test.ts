import { describe, expect, it, vi } from "vitest";
import { runAIAction } from "./api";
import { useAIStore } from "./ai-store";

vi.mock("./api", () => ({
  getAISettings: vi.fn(),
  runAIAction: vi.fn(),
}));

describe("AI store", () => {
  it("ignores a response after logical cancellation", async () => {
    let resolveRequest!: (value: {
      content: string;
      model: string;
      provider: string;
    }) => void;
    vi.mocked(runAIAction).mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    useAIStore.setState({
      response: null,
      loading: false,
      requestVersion: 0,
      lastRequest: null,
    });

    const pending = useAIStore.getState().run({
      scanId: "scan-1",
      path: "src/app.ts",
      action: "explainFile",
    });
    useAIStore.getState().cancel();
    resolveRequest({ content: "Late", model: "model-a", provider: "test" });
    await pending;

    expect(useAIStore.getState().response).toBeNull();
    expect(useAIStore.getState().loading).toBe(false);
  });

  it("retries the last explicit action", async () => {
    vi.mocked(runAIAction).mockResolvedValue({
      content: "Recovered",
      model: "model-a",
      provider: "test",
    });
    useAIStore.setState({
      response: null,
      loading: false,
      requestVersion: 0,
      lastRequest: {
        scanId: "scan-1",
        path: "src/app.ts",
        action: "explainFile",
      },
    });

    await useAIStore.getState().retry();

    expect(runAIAction).toHaveBeenCalledWith({
      scanId: "scan-1",
      path: "src/app.ts",
      action: "explainFile",
    });
    expect(useAIStore.getState().response?.content).toBe("Recovered");
  });
});
