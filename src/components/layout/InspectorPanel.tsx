import { BarChart3, Braces, GitFork } from "lucide-react";

const sections = [
  { label: "Overview", icon: BarChart3 },
  { label: "Dependencies", icon: GitFork },
  { label: "References", icon: Braces },
];

export function InspectorPanel() {
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
      <div className="empty-inspector">
        <div className="metric-placeholder">
          <span />
          <span />
          <span />
          <span />
        </div>
        <p>Select a file or symbol to inspect its details.</p>
      </div>
    </aside>
  );
}
