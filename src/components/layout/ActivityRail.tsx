import {
  BookOpen,
  Files,
  GitFork,
  Search,
  Settings,
  type LucideIcon,
} from "lucide-react";

type RailItem = {
  label: string;
  icon: LucideIcon;
  id: "explorer" | "search" | "graph" | "documentation" | "settings";
};

const primaryItems: RailItem[] = [
  { id: "explorer", label: "Explorer", icon: Files },
  { id: "search", label: "Search", icon: Search },
  { id: "graph", label: "Dependencies", icon: GitFork },
  { id: "documentation", label: "Documentation", icon: BookOpen },
];

function RailButton({
  label,
  icon: Icon,
  active,
  onClick,
}: RailItem & { active?: boolean; onClick?: () => void }) {
  return (
    <button
      aria-label={label}
      className="rail-button"
      data-active={active || undefined}
      onClick={onClick}
      type="button"
    >
      <Icon aria-hidden="true" size={20} strokeWidth={1.7} />
    </button>
  );
}

export function ActivityRail({
  activeView,
  onNavigate,
}: {
  activeView: "explorer" | "graph" | "documentation";
  onNavigate: (view: "explorer" | "search" | "graph" | "documentation") => void;
}) {
  return (
    <nav aria-label="Workspace views" className="activity-rail">
      <div className="activity-rail__main">
        {primaryItems.map((item) => (
          <RailButton
            active={item.id === activeView}
            key={item.label}
            onClick={() => {
              if (item.id !== "settings") {
                onNavigate(item.id);
              }
            }}
            {...item}
          />
        ))}
      </div>
      <RailButton id="settings" label="Settings" icon={Settings} />
    </nav>
  );
}
