import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { save } from "@tauri-apps/plugin-dialog";
import { exportDocumentation } from "../documentation/api";
import { ExportDialog } from "./ExportDialog";

vi.mock("@tauri-apps/plugin-dialog", () => ({ save: vi.fn() }));
vi.mock("../documentation/api", () => ({ exportDocumentation: vi.fn() }));

describe("ExportDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports the selected format to the chosen destination", async () => {
    vi.mocked(save).mockResolvedValue("C:/docs/example.pdf");
    vi.mocked(exportDocumentation).mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(
      <ExportDialog scanId="scan-1" projectName="Example" onClose={onClose} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /PDF/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /Choose destination/i }),
    );

    await waitFor(() =>
      expect(exportDocumentation).toHaveBeenCalledWith(
        "scan-1",
        "pdf",
        "C:/docs/example.pdf",
      ),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("does not export when the save dialog is cancelled", async () => {
    vi.mocked(save).mockResolvedValue(null);
    render(
      <ExportDialog scanId="scan-1" projectName="Example" onClose={vi.fn()} />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Choose destination/i }),
    );
    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(exportDocumentation).not.toHaveBeenCalled();
  });
});
