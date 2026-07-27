import { Brain, FileQuestion, SearchX, WandSparkles } from "lucide-react";
import { useAIStore } from "./ai-store";
import type { AIAction } from "./types";

const actions: { id: AIAction; label: string; icon: typeof Brain }[] = [
  { id: "explainFile", label: "Explain file", icon: FileQuestion },
  { id: "suggestRefactoring", label: "Refactoring review", icon: WandSparkles },
  { id: "reviewDeadCode", label: "Dead code review", icon: SearchX },
];

export function AIActions({ scanId, path }: { scanId: string; path: string }) {
  const configured = useAIStore((state) => state.settings?.configured);
  const loading = useAIStore((state) => state.loading);
  const run = useAIStore((state) => state.run);

  if (!configured) return null;
  return (
    <div className="ai-actions" aria-label="AI actions">
      {actions.map(({ id, label, icon: Icon }) => (
        <button
          disabled={loading}
          key={id}
          onClick={() => run({ scanId, path, action: id })}
          type="button"
        >
          <Icon size={13} />
          {label}
        </button>
      ))}
    </div>
  );
}
