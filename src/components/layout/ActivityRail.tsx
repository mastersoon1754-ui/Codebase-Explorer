import {
  Boxes,
  Files,
  GitFork,
  Search,
  Settings,
  type LucideIcon,
} from "lucide-react";

type RailItem = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

const primaryItems: RailItem[] = [
  { label: "Explorer", icon: Files, active: true },
  { label: "Search", icon: Search },
  { label: "Dependencies", icon: GitFork },
  { label: "Symbols", icon: Boxes },
];

function RailButton({ label, icon: Icon, active }: RailItem) {
  return (
    <button
      aria-label={label}
      className="rail-button"
      data-active={active || undefined}
      type="button"
    >
      <Icon aria-hidden="true" size={20} strokeWidth={1.7} />
    </button>
  );
}

export function ActivityRail() {
  return (
    <nav aria-label="Workspace views" className="activity-rail">
      <div className="activity-rail__main">
        {primaryItems.map((item) => (
          <RailButton key={item.label} {...item} />
        ))}
      </div>
      <RailButton label="Settings" icon={Settings} />
    </nav>
  );
}
