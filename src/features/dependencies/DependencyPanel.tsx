import { ArrowRight, Box, FileInput } from "lucide-react";
import type { FileAnalysis } from "../symbols/types";
import type { ProjectStatistics } from "../statistics/types";

export function DependencyPanel({
  analysis,
  statistics,
}: {
  analysis: FileAnalysis | null;
  statistics: ProjectStatistics | null;
}) {
  if (analysis) {
    if (!analysis.imports.length) {
      return (
        <p className="inspector-empty-copy">No imports found in this file.</p>
      );
    }
    return (
      <div className="relation-list">
        {analysis.imports.map((item, index) => (
          <div
            className="relation-row"
            key={`${item.module}-${item.range.start.row}-${index}`}
          >
            <FileInput size={13} />
            <span>
              <strong>{item.module}</strong>
              <small>{item.resolvedPath ?? `${item.kind} module`}</small>
            </span>
            <code>{item.range.start.row}</code>
          </div>
        ))}
      </div>
    );
  }

  if (!statistics) {
    return (
      <p className="inspector-empty-copy">Project dependencies are loading.</p>
    );
  }
  if (!statistics.dependencies.length) {
    return (
      <p className="inspector-empty-copy">
        No supported dependency manifests found.
      </p>
    );
  }
  return (
    <div className="relation-list">
      {statistics.dependencies.map((item) => (
        <div
          className="relation-row"
          key={`${item.manifest}-${item.scope}-${item.name}`}
        >
          <Box size={13} />
          <span>
            <strong>{item.name}</strong>
            <small>
              {item.version ?? "version unspecified"} · {item.scope}
            </small>
          </span>
        </div>
      ))}
    </div>
  );
}

export function CallPanel({ analysis }: { analysis: FileAnalysis | null }) {
  if (!analysis) {
    return (
      <p className="inspector-empty-copy">
        Select a source file to inspect direct calls.
      </p>
    );
  }
  if (!analysis.calls.length) {
    return (
      <p className="inspector-empty-copy">
        No direct calls found in this file.
      </p>
    );
  }
  return (
    <div className="relation-list">
      {analysis.calls.map((call, index) => (
        <div
          className="relation-row"
          key={`${call.target}-${call.range.start.row}-${index}`}
        >
          <ArrowRight size={13} />
          <span>
            <strong>{call.target}</strong>
            <small>
              {call.caller ? `called by ${call.caller}` : "module scope"}
            </small>
          </span>
          <code>{call.range.start.row}</code>
        </div>
      ))}
    </div>
  );
}
