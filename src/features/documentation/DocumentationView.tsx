import { lazy, Suspense, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpen, Braces, FolderTree, GitFork } from "lucide-react";
import { generateDocumentation } from "./api";
import type { DocumentationBundle } from "./types";

const MermaidDiagram = lazy(() => import("./MermaidDiagram"));
type DocumentationTab = "document" | "folders" | "classes" | "dependencies";

export default function DocumentationView({ scanId }: { scanId: string }) {
  const [bundle, setBundle] = useState<DocumentationBundle | null>(null);
  const [tab, setTab] = useState<DocumentationTab>("document");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let current = true;
    generateDocumentation(scanId)
      .then((value) => {
        if (current) setBundle(value);
      })
      .catch(() => {
        if (current) setFailed(true);
      });
    return () => {
      current = false;
    };
  }, [scanId]);

  if (failed)
    return (
      <div className="documentation-empty">
        Documentation could not be generated.
      </div>
    );
  if (!bundle)
    return (
      <div className="documentation-empty">
        Generating project documentation...
      </div>
    );

  const tabs = [
    { id: "document" as const, label: "Document", icon: BookOpen },
    { id: "folders" as const, label: "Folders", icon: FolderTree },
    { id: "classes" as const, label: "Classes", icon: Braces },
    { id: "dependencies" as const, label: "Dependencies", icon: GitFork },
  ];
  const diagram =
    tab === "folders"
      ? bundle.folderDiagram
      : tab === "classes"
        ? bundle.classDiagram
        : bundle.dependencyDiagram;

  return (
    <section className="documentation-view">
      <header>
        <div>
          <div className="eyebrow">Generated locally</div>
          <h1>{bundle.projectName} documentation</h1>
        </div>
      </header>
      <nav aria-label="Documentation views">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            data-active={tab === id || undefined}
            key={id}
            onClick={() => setTab(id)}
            type="button"
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </nav>
      <div className="documentation-content">
        {tab === "document" ? (
          <article className="markdown-document">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {bundle.markdown}
            </ReactMarkdown>
          </article>
        ) : (
          <Suspense
            fallback={
              <div className="documentation-empty">
                Loading diagram renderer...
              </div>
            }
          >
            <MermaidDiagram source={diagram} />
          </Suspense>
        )}
      </div>
    </section>
  );
}
