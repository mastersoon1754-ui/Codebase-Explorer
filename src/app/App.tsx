import { ActivityRail } from "../components/layout/ActivityRail";
import { ExplorerPanel } from "../components/layout/ExplorerPanel";
import { InspectorPanel } from "../components/layout/InspectorPanel";
import { TopBar } from "../components/layout/TopBar";
import { WelcomeView } from "../components/layout/WelcomeView";
import { ThemeProvider } from "../components/theme/ThemeProvider";
import { ProjectOverview } from "../features/project/ProjectOverview";
import { FileDetails } from "../features/symbols/FileDetails";
import { onScanProgress } from "../features/project/api";
import { useProjectStore } from "../features/project/project-store";
import "./styles.css";

function Workspace() {
  const project = useProjectStore((state) => state.project);
  const isScanning = useProjectStore((state) => state.isScanning);
  const progress = useProjectStore((state) => state.progress);
  const updateProgress = useProjectStore((state) => state.updateProgress);
  const selectedFile = useProjectStore((state) => state.selectedFile);
  const isAnalyzing = useProjectStore((state) => state.isAnalyzing);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    onScanProgress(updateProgress).then((dispose) => {
      unlisten = dispose;
    });
    return () => unlisten?.();
  }, [updateProgress]);

  return (
    <div className="app-shell">
      <TopBar />
      <div className="workspace">
        <ActivityRail />
        <ExplorerPanel />
        <main className="content">
          {selectedFile ? (
            <FileDetails analysis={selectedFile} />
          ) : project ? (
            <ProjectOverview project={project} />
          ) : (
            <WelcomeView />
          )}
        </main>
        <InspectorPanel />
      </div>
      <footer className="status-bar">
        <span>{project?.name ?? "Codebase Explorer"}</span>
        <span className="status-bar__hint">
          {isScanning
            ? `Scanning ${progress?.filesScanned ?? 0} files`
            : project
              ? project.root
              : "No project open"}
        </span>
        <span>
          {isScanning ? "Indexing" : isAnalyzing ? "Parsing" : "Ready"}
        </span>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <Workspace />
    </ThemeProvider>
  );
}
import { useEffect } from "react";
