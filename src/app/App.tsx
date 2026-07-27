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
import { SearchPalette } from "../features/search/SearchPalette";
import type { SearchResult } from "../features/search/types";
import { lazy, Suspense, useEffect, useState } from "react";
import "./styles.css";

const DependencyGraph = lazy(() => import("../features/graph/DependencyGraph"));

function Workspace() {
  const project = useProjectStore((state) => state.project);
  const isScanning = useProjectStore((state) => state.isScanning);
  const progress = useProjectStore((state) => state.progress);
  const updateProgress = useProjectStore((state) => state.updateProgress);
  const selectedFile = useProjectStore((state) => state.selectedFile);
  const isAnalyzing = useProjectStore((state) => state.isAnalyzing);
  const selectFile = useProjectStore((state) => state.selectFile);
  const selectSymbol = useProjectStore((state) => state.selectSymbol);
  const [view, setView] = useState<"explorer" | "graph">("explorer");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    onScanProgress(updateProgress).then((dispose) => {
      unlisten = dispose;
    });
    return () => unlisten?.();
  }, [updateProgress]);

  useEffect(() => {
    function handleShortcut(event: globalThis.KeyboardEvent) {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k" &&
        project
      ) {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [project]);

  function openSearchResult(result: SearchResult) {
    setSearchOpen(false);
    setView("explorer");
    if (!result.analyzable) return;
    void selectFile(result.path).then(() => {
      if (result.symbolId) {
        const symbol = useProjectStore
          .getState()
          .selectedFile?.symbols.find((item) => item.id === result.symbolId);
        if (symbol) selectSymbol(symbol);
      }
    });
  }

  return (
    <div className="app-shell">
      <TopBar
        canSearch={Boolean(project)}
        onSearch={() => setSearchOpen(true)}
      />
      <div className="workspace">
        <ActivityRail
          activeView={view}
          onNavigate={(nextView) => {
            if (nextView === "search") setSearchOpen(true);
            else setView(nextView);
          }}
        />
        <ExplorerPanel />
        <main className="content">
          {view === "graph" && project ? (
            <Suspense
              fallback={
                <div className="graph-empty">Loading graph renderer...</div>
              }
            >
              <DependencyGraph
                scanId={project.scanId}
                onSelectFile={(path) => {
                  setView("explorer");
                  void selectFile(path);
                }}
              />
            </Suspense>
          ) : selectedFile ? (
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
      {searchOpen && project && (
        <SearchPalette
          onClose={() => setSearchOpen(false)}
          onSelect={openSearchResult}
          scanId={project.scanId}
        />
      )}
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
