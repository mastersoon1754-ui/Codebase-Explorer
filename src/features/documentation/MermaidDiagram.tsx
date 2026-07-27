import mermaid from "mermaid";
import { useEffect, useId, useState } from "react";

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "strict",
  theme: "dark",
});

export default function MermaidDiagram({ source }: { source: string }) {
  const reactId = useId();
  const [svg, setSvg] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let current = true;
    const id = `mermaid-${reactId.replace(/[^a-zA-Z0-9]/g, "")}`;
    mermaid
      .render(id, source)
      .then((result) => {
        if (current) setSvg(result.svg);
      })
      .catch(() => {
        if (current) setFailed(true);
      });
    return () => {
      current = false;
    };
  }, [reactId, source]);

  if (failed) {
    return (
      <pre className="diagram-source">
        <code>{source}</code>
      </pre>
    );
  }
  return (
    <div
      aria-label="Generated diagram"
      className="mermaid-diagram"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
