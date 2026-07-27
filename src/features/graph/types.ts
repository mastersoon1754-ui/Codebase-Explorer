export type DependencyGraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type GraphNode = {
  id: string;
  label: string;
  path: string;
};

export type GraphEdge = {
  source: string;
  target: string;
};
