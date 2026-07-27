import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-context";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      aria-label={`Switch to ${nextTheme} theme`}
      className="icon-button"
      onClick={toggleTheme}
      type="button"
    >
      {theme === "dark" ? (
        <Sun aria-hidden="true" size={17} />
      ) : (
        <Moon aria-hidden="true" size={17} />
      )}
    </button>
  );
}
