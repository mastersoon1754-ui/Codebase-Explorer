import { Box, Braces, Brackets, CircleDot, FunctionSquare } from "lucide-react";
import type { SymbolInfo, SymbolKind } from "./types";

const icons = {
  class: Box,
  function: FunctionSquare,
  method: CircleDot,
  interface: Braces,
  enum: Brackets,
  constant: CircleDot,
} satisfies Record<SymbolKind, typeof Box>;

export function SymbolOutline({
  symbols,
  selectedId,
  onSelect,
}: {
  symbols: SymbolInfo[];
  selectedId: string | null;
  onSelect: (symbol: SymbolInfo) => void;
}) {
  if (!symbols.length) {
    return (
      <p className="inspector-empty-copy">No symbols found in this file.</p>
    );
  }

  return (
    <div className="symbol-outline" aria-label="File symbols">
      {symbols.map((symbol) => {
        const Icon = icons[symbol.kind];
        return (
          <button
            className="symbol-row"
            data-active={selectedId === symbol.id || undefined}
            key={symbol.id}
            onClick={() => onSelect(symbol)}
            type="button"
          >
            <Icon aria-hidden="true" size={13} />
            <span>
              <strong>{symbol.name}</strong>
              <small>{symbol.kind}</small>
            </span>
            <code>{symbol.range.start.row}</code>
          </button>
        );
      })}
    </div>
  );
}
