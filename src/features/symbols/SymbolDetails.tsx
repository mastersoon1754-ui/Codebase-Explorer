import { ArrowLeft, MapPin } from "lucide-react";
import type { SymbolInfo } from "./types";
import { Brain } from "lucide-react";
import { useProjectStore } from "../project/project-store";
import { useAIStore } from "../ai/ai-store";

export function SymbolDetails({
  symbol,
  onBack,
}: {
  symbol: SymbolInfo;
  onBack: () => void;
}) {
  const project = useProjectStore((state) => state.project);
  const file = useProjectStore((state) => state.selectedFile);
  const configured = useAIStore((state) => state.settings?.configured);
  const loading = useAIStore((state) => state.loading);
  const run = useAIStore((state) => state.run);
  return (
    <div className="symbol-details">
      <button className="symbol-details__back" onClick={onBack} type="button">
        <ArrowLeft size={12} /> All symbols
      </button>
      <span className="symbol-details__kind">{symbol.kind}</span>
      <h2>{symbol.name}</h2>
      <div className="symbol-location">
        <MapPin size={12} /> Line {symbol.range.start.row}, column{" "}
        {symbol.range.start.column}
      </div>
      <div className="section-label">Signature</div>
      <pre className="symbol-signature">
        <code>{symbol.signature}</code>
      </pre>
      {configured && project && file && (
        <button
          className="ai-symbol-action"
          disabled={loading}
          onClick={() =>
            run({
              scanId: project.scanId,
              path: file.path,
              action: "explainSymbol",
              symbolId: symbol.id,
            })
          }
          type="button"
        >
          <Brain size={13} /> Explain symbol
        </button>
      )}
      {symbol.documentation && (
        <>
          <div className="section-label">Documentation</div>
          <p className="symbol-documentation">{symbol.documentation}</p>
        </>
      )}
    </div>
  );
}
