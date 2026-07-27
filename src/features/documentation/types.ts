export type DocumentationBundle = {
  projectName: string;
  markdown: string;
  folderDiagram: string;
  classDiagram: string;
  dependencyDiagram: string;
};

export type ExportFormat = "markdown" | "html" | "pdf";
