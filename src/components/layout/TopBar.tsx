import { Command, Download, Search, SlidersHorizontal } from "lucide-react";
import { ThemeToggle } from "../theme/ThemeToggle";

export function TopBar({
  canSearch,
  onSearch,
}: {
  canSearch: boolean;
  onSearch: () => void;
}) {
  return (
    <header className="top-bar">
      <div className="brand">
        <div className="brand__mark" aria-hidden="true">
          <Command size={17} strokeWidth={2} />
        </div>
        <span>Codebase Explorer</span>
      </div>
      <button
        className="search-trigger"
        disabled={!canSearch}
        onClick={onSearch}
        type="button"
      >
        <Search aria-hidden="true" size={15} />
        <span>Search files and symbols</span>
        <kbd>Ctrl K</kbd>
      </button>
      <div className="toolbar-actions">
        <button
          aria-label="Export documentation"
          className="icon-button"
          disabled
          type="button"
        >
          <Download aria-hidden="true" size={17} />
        </button>
        <ThemeToggle />
        <button
          aria-label="Application settings"
          className="icon-button"
          type="button"
        >
          <SlidersHorizontal aria-hidden="true" size={17} />
        </button>
      </div>
    </header>
  );
}
