import { ChevronRight, FolderTree } from "lucide-react";

export function ExplorerPanel() {
  return (
    <aside className="side-panel explorer-panel">
      <div className="panel-heading">
        <span>Explorer</span>
        <button
          aria-label="Explorer options"
          className="text-button"
          type="button"
        >
          ...
        </button>
      </div>
      <div className="empty-tree">
        <div className="empty-tree__mark">
          <FolderTree aria-hidden="true" size={22} strokeWidth={1.5} />
        </div>
        <p>Your project files will appear here.</p>
        <button className="link-button" disabled type="button">
          Open folder
          <ChevronRight aria-hidden="true" size={14} />
        </button>
      </div>
    </aside>
  );
}
