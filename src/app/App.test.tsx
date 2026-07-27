import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
  });

  it("renders the empty project workspace", () => {
    render(<App />);

    expect(screen.getByRole("banner")).toHaveTextContent("Codebase Explorer");
    expect(
      screen.getByRole("heading", {
        name: "Understand the code before changing it.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /open project folder/i }),
    ).toBeDisabled();
  });

  it("persists a theme change", async () => {
    render(<App />);

    await waitFor(() =>
      expect(document.documentElement).toHaveAttribute("data-theme", "dark"),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Switch to light theme" }),
    );

    await waitFor(() =>
      expect(document.documentElement).toHaveAttribute("data-theme", "light"),
    );
    expect(localStorage.getItem("codebase-explorer-theme")).toBe("light");
  });
});
