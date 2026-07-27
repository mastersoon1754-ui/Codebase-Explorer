import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  FileText,
  Folder,
  FolderOpen,
} from "lucide-react";
import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { ProjectEntry } from "../project/types";

type TreeRow = {
  entry: ProjectEntry;
  depth: number;
};

function buildVisibleRows(entries: ProjectEntry[], expanded: Set<string>) {
  const children = new Map<string | null, ProjectEntry[]>();
  for (const entry of entries) {
    const siblings = children.get(entry.parent) ?? [];
    siblings.push(entry);
    children.set(entry.parent, siblings);
  }
  for (const siblings of children.values()) {
    siblings.sort((left, right) => {
      if (left.kind !== right.kind) return left.kind === "directory" ? -1 : 1;
      return left.name.localeCompare(right.name);
    });
  }

  const rows: TreeRow[] = [];
  function visit(parent: string | null, depth: number) {
    for (const entry of children.get(parent) ?? []) {
      rows.push({ entry, depth });
      if (entry.kind === "directory" && expanded.has(entry.path)) {
        visit(entry.path, depth + 1);
      }
    }
  }
  visit(null, 0);
  return rows;
}

function EntryIcon({
  entry,
  expanded,
}: {
  entry: ProjectEntry;
  expanded: boolean;
}) {
  if (entry.kind === "directory") {
    return expanded ? <FolderOpen size={15} /> : <Folder size={15} />;
  }
  return entry.language ? <FileCode2 size={14} /> : <FileText size={14} />;
}

export function FileTree({ entries }: { entries: ProjectEntry[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const rows = useMemo(
    () => buildVisibleRows(entries, expanded),
    [entries, expanded],
  );
  // TanStack Virtual manages its own mutable instance and is intentionally not compiler-memoized.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 26,
    overscan: 12,
  });

  function toggle(path: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const row = rows[activeIndex];
    if (!row) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, rows.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "ArrowRight" && row.entry.kind === "directory") {
      event.preventDefault();
      if (!expanded.has(row.entry.path)) toggle(row.entry.path);
    } else if (event.key === "ArrowLeft" && row.entry.kind === "directory") {
      event.preventDefault();
      if (expanded.has(row.entry.path)) toggle(row.entry.path);
    } else if (event.key === "Enter" && row.entry.kind === "directory") {
      event.preventDefault();
      toggle(row.entry.path);
    } else {
      return;
    }
    virtualizer.scrollToIndex(activeIndex);
  }

  return (
    <div
      aria-label="Project files"
      className="file-tree"
      onKeyDown={handleKeyDown}
      ref={parentRef}
      role="tree"
      tabIndex={0}
    >
      <div
        className="file-tree__inner"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index];
          const isExpanded = expanded.has(row.entry.path);
          return (
            <button
              aria-expanded={
                row.entry.kind === "directory" ? isExpanded : undefined
              }
              aria-level={row.depth + 1}
              className="tree-row"
              data-active={virtualRow.index === activeIndex || undefined}
              key={row.entry.path}
              onClick={() => {
                setActiveIndex(virtualRow.index);
                if (row.entry.kind === "directory") toggle(row.entry.path);
              }}
              role="treeitem"
              style={{
                paddingLeft: `${8 + row.depth * 14}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              tabIndex={-1}
              title={row.entry.path}
              type="button"
            >
              <span className="tree-row__chevron">
                {row.entry.kind === "directory" &&
                  (isExpanded ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  ))}
              </span>
              <span className="tree-row__icon">
                <EntryIcon entry={row.entry} expanded={isExpanded} />
              </span>
              <span className="tree-row__name">{row.entry.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
