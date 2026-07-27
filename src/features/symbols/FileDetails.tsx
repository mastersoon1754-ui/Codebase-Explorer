import { AlertTriangle, Braces, FileCode2 } from "lucide-react";
import type { FileAnalysis } from "./types";
import { AIActions } from "../ai/AIActions";

export function FileDetails({
  analysis,
  scanId,
}: {
  analysis: FileAnalysis;
  scanId: string;
}) {
  const pathParts = analysis.path.split("/");
  return (
    <section className="file-details">
      <header className="file-details__header">
        <div>
          <div className="eyebrow">{analysis.language} source</div>
          <h1>{pathParts[pathParts.length - 1]}</h1>
          <p>{analysis.path}</p>
        </div>
        <div className="file-details__facts">
          <span>
            <Braces size={13} /> {analysis.symbols.length} symbols
          </span>
          <span>
            <FileCode2 size={13} /> {analysis.source.split("\n").length} lines
          </span>
          {analysis.parseErrors > 0 && (
            <span className="parse-warning">
              <AlertTriangle size={13} /> {analysis.parseErrors} syntax issues
            </span>
          )}
        </div>
        <AIActions path={analysis.path} scanId={scanId} />
      </header>
      <div className="source-view" aria-label="Source code">
        <pre>
          <code>{analysis.source}</code>
        </pre>
      </div>
    </section>
  );
}
