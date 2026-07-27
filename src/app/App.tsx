import { ActivityRail } from "../components/layout/ActivityRail";
import { ExplorerPanel } from "../components/layout/ExplorerPanel";
import { InspectorPanel } from "../components/layout/InspectorPanel";
import { TopBar } from "../components/layout/TopBar";
import { WelcomeView } from "../components/layout/WelcomeView";
import { ThemeProvider } from "../components/theme/ThemeProvider";
import "./styles.css";

export function App() {
  return (
    <ThemeProvider>
      <div className="app-shell">
        <TopBar />
        <div className="workspace">
          <ActivityRail />
          <ExplorerPanel />
          <main className="content">
            <WelcomeView />
          </main>
          <InspectorPanel />
        </div>
        <footer className="status-bar">
          <span>Codebase Explorer</span>
          <span className="status-bar__hint">No project open</span>
          <span>Ready</span>
        </footer>
      </div>
    </ThemeProvider>
  );
}
