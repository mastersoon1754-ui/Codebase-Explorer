import cytoscape, { type Core } from "cytoscape";
import { Focus, GitFork, Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { loadDependencyGraph } from "./api";
import type { DependencyGraphData } from "./types";

export default function DependencyGraph({
  scanId,
  onSelectFile,
}: {
  scanId: string;
  onSelectFile: (path: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Core | null>(null);
  const [data, setData] = useState<DependencyGraphData | null>(null);

  useEffect(() => {
    loadDependencyGraph(scanId).then(setData);
  }, [scanId]);

  useEffect(() => {
    if (!containerRef.current || !data) return;
    const graph = cytoscape({
      container: containerRef.current,
      elements: [
        ...data.nodes.map((node) => ({ data: node })),
        ...data.edges.map((edge, index) => ({
          data: {
            id: `edge-${index}`,
            source: edge.source,
            target: edge.target,
          },
        })),
      ],
      layout: { name: "cose", animate: false, nodeRepulsion: () => 9000 },
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#83b596",
            color: "#e7e9e2",
            label: "data(label)",
            "font-family": "Cascadia Code, Consolas, monospace",
            "font-size": 8,
            "text-valign": "bottom",
            "text-margin-y": 7,
            width: 16,
            height: 16,
          },
        },
        {
          selector: "edge",
          style: {
            width: 1,
            "line-color": "#596255",
            "target-arrow-color": "#596255",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
          },
        },
        {
          selector: ":selected",
          style: { "background-color": "#d1a642", "line-color": "#d1a642" },
        },
      ],
    });
    graph.on("tap", "node", (event) => onSelectFile(event.target.data("path")));
    graphRef.current = graph;
    return () => {
      graphRef.current = null;
      graph.destroy();
    };
  }, [data, onSelectFile]);

  return (
    <section className="dependency-graph">
      <header>
        <div>
          <div className="eyebrow">Project relationships</div>
          <h1>Dependency graph</h1>
        </div>
        <div className="graph-controls">
          <button
            aria-label="Zoom in"
            onClick={() =>
              graphRef.current?.zoom(graphRef.current.zoom() * 1.2)
            }
            type="button"
          >
            <Plus size={15} />
          </button>
          <button
            aria-label="Zoom out"
            onClick={() =>
              graphRef.current?.zoom(graphRef.current.zoom() / 1.2)
            }
            type="button"
          >
            <Minus size={15} />
          </button>
          <button
            aria-label="Fit graph"
            onClick={() => graphRef.current?.fit(undefined, 40)}
            type="button"
          >
            <Focus size={15} />
          </button>
        </div>
      </header>
      {!data ? (
        <div className="graph-empty">
          <GitFork size={20} />
          <p>Building the project index...</p>
        </div>
      ) : data.nodes.length ? (
        <div
          aria-label="Interactive dependency graph"
          className="graph-canvas"
          ref={containerRef}
        />
      ) : (
        <div className="graph-empty">
          <GitFork size={20} />
          <p>No supported source files were found.</p>
        </div>
      )}
    </section>
  );
}
