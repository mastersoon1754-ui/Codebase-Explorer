import {
  ArrowRight,
  FileCode2,
  FolderOpen,
  GitBranch,
  ScanSearch,
} from "lucide-react";

const features = [
  {
    icon: ScanSearch,
    title: "Map the structure",
    copy: "Index files, languages, and symbols without sending source code anywhere.",
  },
  {
    icon: GitBranch,
    title: "Follow relationships",
    copy: "Move through imports, references, and call paths in one connected workspace.",
  },
  {
    icon: FileCode2,
    title: "Create documentation",
    copy: "Turn analysis into diagrams and portable project documentation.",
  },
];

export function WelcomeView() {
  return (
    <section className="welcome">
      <div className="welcome__content">
        <div className="eyebrow">Local-first code intelligence</div>
        <h1>Understand the code before changing it.</h1>
        <p className="welcome__intro">
          Open a project to build a navigable map of its structure, symbols, and
          dependencies. Analysis stays on your machine.
        </p>
        <div className="welcome__actions">
          <button className="primary-button" disabled type="button">
            <FolderOpen aria-hidden="true" size={17} />
            Open project folder
          </button>
          <span className="coming-soon">
            Folder scanning arrives in the next milestone
          </span>
        </div>
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, copy }) => (
            <article className="feature-card" key={title}>
              <Icon aria-hidden="true" size={19} strokeWidth={1.6} />
              <h2>{title}</h2>
              <p>{copy}</p>
              <span className="feature-card__link">
                Built for the desktop{" "}
                <ArrowRight aria-hidden="true" size={13} />
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
