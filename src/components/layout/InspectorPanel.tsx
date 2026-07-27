import { BarChart3, GitFork, PhoneCall } from "lucide-react";
import { useState } from "react";
import { SymbolOutline } from "../../features/symbols/SymbolOutline";
import { SymbolDetails } from "../../features/symbols/SymbolDetails";
import { useProjectStore } from "../../features/project/project-store";
import { ProjectStatisticsPanel } from "../../features/statistics/ProjectStatisticsPanel";
import {
  CallPanel,
  DependencyPanel,
} from "../../features/dependencies/DependencyPanel";

const sections = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "dependencies", label: "Dependencies", icon: GitFork },
  { id: "calls", label: "Calls", icon: PhoneCall },
] as const;

type InspectorSection = (typeof sections)[number]["id"];

export function InspectorPanel() {
  const analysis = useProjectStore((state) => state.selectedFile);
  const selectedSymbol = useProjectStore((state) => state.selectedSymbol);
  const selectSymbol = useProjectStore((state) => state.selectSymbol);
  const statistics = useProjectStore((state) => state.statistics);
  const [section, setSection] = useState<InspectorSection>("overview");
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
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            aria-selected={section === id}
            className="inspector-tab"
            data-active={section === id || undefined}
            key={label}
            onClick={() => setSection(id)}
            role="tab"
            type="button"
          >
            <Icon aria-hidden="true" size={14} />
            {label}
          </button>
        ))}
      </div>
      {section === "dependencies" ? (
        <DependencyPanel analysis={analysis} statistics={statistics} />
      ) : section === "calls" ? (
        <CallPanel analysis={analysis} />
      ) : selectedSymbol ? (
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
        <ProjectStatisticsPanel statistics={statistics} />
      )}
    </aside>
  );
}
