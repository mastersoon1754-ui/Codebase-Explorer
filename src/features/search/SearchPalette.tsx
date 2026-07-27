import { FileCode2, Search, Shapes, X } from "lucide-react";
import {
  useDeferredValue,
  useEffect,
  useState,
  type KeyboardEvent,
} from "react";
import { searchProject } from "./api";
import type { SearchResult } from "./types";

export function SearchPalette({
  scanId,
  onClose,
  onSelect,
}: {
  scanId: string;
  onClose: () => void;
  onSelect: (result: SearchResult) => void;
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [completedQuery, setCompletedQuery] = useState("");
  const [searchError, setSearchError] = useState(false);
  const isSearching =
    Boolean(deferredQuery.trim()) && completedQuery !== deferredQuery;

  useEffect(() => {
    if (!deferredQuery.trim()) {
      return;
    }
    let current = true;
    searchProject(scanId, deferredQuery)
      .then((nextResults) => {
        if (current) {
          setResults(nextResults);
          setSearchError(false);
          setActiveIndex(0);
          setCompletedQuery(deferredQuery);
        }
      })
      .catch(() => {
        if (current) {
          setResults([]);
          setSearchError(true);
          setCompletedQuery(deferredQuery);
        }
      });
    return () => {
      current = false;
    };
  }, [deferredQuery, scanId]);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      onSelect(results[activeIndex]);
    }
  }

  return (
    <div className="palette-backdrop" onMouseDown={onClose} role="presentation">
      <section
        aria-label="Search project"
        aria-modal="true"
        className="search-palette"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="search-palette__input">
          <Search aria-hidden="true" size={17} />
          <input
            aria-label="Search files and symbols"
            autoFocus
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search files and symbols"
            value={query}
          />
          <button aria-label="Close search" onClick={onClose} type="button">
            <X size={15} />
          </button>
        </div>
        <div className="search-results" role="listbox">
          {!query.trim() ? (
            <p>Type a file, function, class, or symbol name.</p>
          ) : isSearching ? (
            <p>Searching project index...</p>
          ) : searchError ? (
            <p>The project index could not be searched. Try again.</p>
          ) : results.length ? (
            results.map((result, index) => {
              const Icon = result.kind === "symbol" ? Shapes : FileCode2;
              return (
                <button
                  aria-selected={index === activeIndex}
                  data-active={index === activeIndex || undefined}
                  key={`${result.kind}-${result.path}-${result.symbolId ?? "file"}`}
                  onClick={() => onSelect(result)}
                  onMouseEnter={() => setActiveIndex(index)}
                  role="option"
                  type="button"
                >
                  <Icon aria-hidden="true" size={15} />
                  <span>
                    <strong>{result.label}</strong>
                    <small>{result.detail}</small>
                  </span>
                  <code>{result.line ? `:${result.line}` : result.kind}</code>
                </button>
              );
            })
          ) : (
            <p>No matching files or symbols.</p>
          )}
        </div>
        <footer className="search-palette__footer">
          <span>↑↓ Navigate</span>
          <span>Enter Open</span>
          <span>Esc Close</span>
        </footer>
      </section>
    </div>
  );
}
