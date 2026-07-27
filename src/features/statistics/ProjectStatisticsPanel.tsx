import type { ProjectStatistics } from "./types";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProjectStatisticsPanel({
  statistics,
}: {
  statistics: ProjectStatistics | null;
}) {
  if (!statistics) {
    return (
      <p className="inspector-empty-copy">Project statistics are loading.</p>
    );
  }

  return (
    <div className="statistics-panel">
      <div className="statistics-grid">
        <div>
          <strong>{statistics.totalLines.toLocaleString()}</strong>
          <span>Total lines</span>
        </div>
        <div>
          <strong>{statistics.sourceLines.toLocaleString()}</strong>
          <span>Source</span>
        </div>
        <div>
          <strong>{statistics.commentLines.toLocaleString()}</strong>
          <span>Comments</span>
        </div>
        <div>
          <strong>{statistics.blankLines.toLocaleString()}</strong>
          <span>Blank</span>
        </div>
      </div>
      <div className="section-label">Largest files</div>
      <div className="largest-files">
        {statistics.largestFiles.map((file) => (
          <div key={file.path} title={file.path}>
            <span>{file.path}</span>
            <code>{formatBytes(file.size)}</code>
          </div>
        ))}
      </div>
    </div>
  );
}
