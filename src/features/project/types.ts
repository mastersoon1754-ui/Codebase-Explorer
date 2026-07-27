export type EntryKind = "directory" | "file";

export type ProjectEntry = {
  path: string;
  name: string;
  parent: string | null;
  kind: EntryKind;
  size: number;
  language: string | null;
};

export type LanguageTotal = {
  id: string;
  fileCount: number;
  totalBytes: number;
};

export type ProjectSnapshot = {
  scanId: string;
  root: string;
  name: string;
  entries: ProjectEntry[];
  languages: LanguageTotal[];
  fileCount: number;
  totalBytes: number;
  skippedCount: number;
};

export type ScanProgress = {
  scanId: string;
  filesScanned: number;
  currentPath: string;
};

export type ScanError = {
  code: string;
  message: string;
};
