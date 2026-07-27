import { Files, HardDrive, Languages } from "lucide-react";
import type { ProjectSnapshot } from "./types";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProjectOverview({ project }: { project: ProjectSnapshot }) {
  const metrics = [
    { label: "Files", value: project.fileCount.toLocaleString(), icon: Files },
    { label: "Size", value: formatBytes(project.totalBytes), icon: HardDrive },
    {
      label: "Languages",
      value: String(project.languages.length),
      icon: Languages,
    },
  ];

  return (
    <section className="project-overview">
      <div className="project-overview__heading">
        <div className="eyebrow">Project indexed locally</div>
        <h1>{project.name}</h1>
        <p title={project.root}>{project.root}</p>
      </div>
      <div className="project-metrics">
        {metrics.map(({ label, value, icon: Icon }) => (
          <article key={label}>
            <Icon aria-hidden="true" size={17} />
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <div className="language-summary">
        <div className="section-label">Detected languages</div>
        {project.languages.length ? (
          <div className="language-list">
            {project.languages.map((language) => (
              <div className="language-row" key={language.id}>
                <span className={`language-dot language-dot--${language.id}`} />
                <span>{language.id}</span>
                <span>{language.fileCount.toLocaleString()} files</span>
                <span>{formatBytes(language.totalBytes)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted-copy">No recognized source files were found.</p>
        )}
      </div>
    </section>
  );
}
