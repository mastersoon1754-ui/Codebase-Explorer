import { ArrowLeft, MapPin } from "lucide-react";
import type { SymbolInfo } from "./types";

export function SymbolDetails({
  symbol,
  onBack,
}: {
  symbol: SymbolInfo;
  onBack: () => void;
}) {
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
      {symbol.documentation && (
        <>
          <div className="section-label">Documentation</div>
          <p className="symbol-documentation">{symbol.documentation}</p>
        </>
      )}
    </div>
  );
}
