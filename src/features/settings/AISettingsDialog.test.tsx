import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveAISettings } from "../ai/api";
import { useAIStore } from "../ai/ai-store";
import { AISettingsDialog } from "./AISettingsDialog";

vi.mock("../ai/api", () => ({
  saveAISettings: vi.fn(),
  clearAIKey: vi.fn(),
}));

describe("AISettingsDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAIStore.setState({
      settings: null,
      response: null,
      error: null,
      loading: false,
      requestVersion: 0,
      lastRequest: null,
    });
  });

  it("saves provider settings and sends the key only to the backend command", async () => {
    vi.mocked(saveAISettings).mockResolvedValue({
      endpoint: "https://provider.test/v1",
      model: "model-a",
      configured: true,
    });
    render(<AISettingsDialog onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Endpoint"), {
      target: { value: "https://provider.test/v1" },
    });
    fireEvent.change(screen.getByLabelText("Model"), {
      target: { value: "model-a" },
    });
    fireEvent.change(screen.getByLabelText("API key"), {
      target: { value: "secret-key" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save provider" }));

    await waitFor(() =>
      expect(saveAISettings).toHaveBeenCalledWith(
        "https://provider.test/v1",
        "model-a",
        "secret-key",
      ),
    );
    expect(useAIStore.getState().settings?.configured).toBe(true);
  });

  it("explains that AI is optional and explicit", () => {
    render(<AISettingsDialog onClose={vi.fn()} />);
    expect(
      screen.getByText(/Core analysis remains local/i),
    ).toBeInTheDocument();
  });
});
