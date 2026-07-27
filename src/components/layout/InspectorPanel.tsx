import { BarChart3, Braces, GitFork } from "lucide-react";
import { SymbolOutline } from "../../features/symbols/SymbolOutline";
import { SymbolDetails } from "../../features/symbols/SymbolDetails";
import { useProjectStore } from "../../features/project/project-store";

const sections = [
  { label: "Overview", icon: BarChart3 },
  { label: "Dependencies", icon: GitFork },
  { label: "References", icon: Braces },
];

export function InspectorPanel() {
  const analysis = useProjectStore((state) => state.selectedFile);
  const selectedSymbol = useProjectStore((state) => state.selectedSymbol);
  const selectSymbol = useProjectStore((state) => state.selectSymbol);
  return (
    <aside className="side-panel inspector-panel">
      <div className="panel-heading">
        <span>Inspector</span>
      </div>
      <div
        className="inspector-tabs"
        role="tablist"
        aria-label="Inspector views"
      >
        {sections.map(({ label, icon: Icon }, index) => (
          <button
            aria-selected={index === 0}
            className="inspector-tab"
            data-active={index === 0 || undefined}
            key={label}
            role="tab"
            type="button"
          >
            <Icon aria-hidden="true" size={14} />
            {label}
          </button>
        ))}
      </div>
      {selectedSymbol ? (
        <SymbolDetails
          symbol={selectedSymbol}
          onBack={() => selectSymbol(null)}
        />
      ) : analysis ? (
        <SymbolOutline
          symbols={analysis.symbols}
          selectedId={null}
          onSelect={selectSymbol}
        />
      ) : (
        <div className="empty-inspector">
          <div className="metric-placeholder">
            <span />
            <span />
            <span />
            <span />
          </div>
          <p>Select a file or symbol to inspect its details.</p>
        </div>
      )}
    </aside>
  );
}
