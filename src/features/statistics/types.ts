export type ProjectStatistics = {
  totalLines: number;
  sourceLines: number;
  blankLines: number;
  commentLines: number;
  largestFiles: FileStatistic[];
  dependencies: ManifestDependency[];
};

export type FileStatistic = {
  path: string;
  size: number;
  lines: number;
};

export type ManifestDependency = {
  name: string;
  version: string | null;
  scope: "runtime" | "development" | "optional";
  manifest: string;
};
