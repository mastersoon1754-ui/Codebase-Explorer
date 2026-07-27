import { ChevronRight, FolderTree, LoaderCircle, X } from "lucide-react";
import { FileTree } from "../../features/explorer/FileTree";
import { useProjectStore } from "../../features/project/project-store";

export function ExplorerPanel() {
  const project = useProjectStore((state) => state.project);
  const progress = useProjectStore((state) => state.progress);
  const isScanning = useProjectStore((state) => state.isScanning);
  const error = useProjectStore((state) => state.error);
  const openProject = useProjectStore((state) => state.openProject);
  const cancelScan = useProjectStore((state) => state.cancelScan);
  const selectFile = useProjectStore((state) => state.selectFile);

  return (
    <aside className="side-panel explorer-panel">
      <div className="panel-heading">
        <span>Explorer</span>
        {isScanning ? (
          <button
            aria-label="Cancel project scan"
            className="text-button"
            onClick={cancelScan}
            type="button"
          >
            <X size={14} />
          </button>
        ) : (
          <button
            aria-label="Open another project"
            className="text-button"
            onClick={openProject}
            type="button"
          >
            +
          </button>
        )}
      </div>
      {isScanning ? (
        <div className="scan-progress" role="status">
          <LoaderCircle aria-hidden="true" className="spin" size={17} />
          <strong>Scanning project</strong>
          <span>{progress?.filesScanned ?? 0} files found</span>
          <span className="scan-progress__path">{progress?.currentPath}</span>
        </div>
      ) : project ? (
        <FileTree entries={project.entries} onSelectFile={selectFile} />
      ) : (
        <div className="empty-tree">
          <div className="empty-tree__mark">
            <FolderTree aria-hidden="true" size={22} strokeWidth={1.5} />
          </div>
          <p>{error ?? "Your project files will appear here."}</p>
          <button className="link-button" onClick={openProject} type="button">
            Open folder
            <ChevronRight aria-hidden="true" size={14} />
          </button>
        </div>
      )}
    </aside>
  );
}
