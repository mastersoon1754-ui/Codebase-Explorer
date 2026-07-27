export type SymbolKind =
  "class" | "function" | "method" | "interface" | "enum" | "constant";

export type SourcePosition = {
  row: number;
  column: number;
};

export type SourceRange = {
  start: SourcePosition;
  end: SourcePosition;
};

export type SymbolInfo = {
  id: string;
  name: string;
  qualifiedName: string;
  kind: SymbolKind;
  signature: string;
  documentation: string | null;
  range: SourceRange;
  parentId: string | null;
};

export type FileAnalysis = {
  path: string;
  language: string;
  contentHash: string;
  source: string;
  symbols: SymbolInfo[];
  imports: ImportRelation[];
  calls: CallRelation[];
  parseErrors: number;
  cached: boolean;
};

export type ImportRelation = {
  module: string;
  kind: "local" | "external";
  resolvedPath: string | null;
  range: SourceRange;
};

export type CallRelation = {
  target: string;
  caller: string | null;
  range: SourceRange;
};
