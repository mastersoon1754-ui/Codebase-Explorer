export type SearchResult = {
  kind: "file" | "symbol";
  label: string;
  detail: string;
  path: string;
  line: number | null;
  symbolId: string | null;
  analyzable: boolean;
};
