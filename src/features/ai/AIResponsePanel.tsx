import { Brain, RotateCcw, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAIStore } from "./ai-store";

export function AIResponsePanel() {
  const response = useAIStore((state) => state.response);
  const error = useAIStore((state) => state.error);
  const loading = useAIStore((state) => state.loading);
  const cancel = useAIStore((state) => state.cancel);
  const retry = useAIStore((state) => state.retry);
  const close = useAIStore((state) => state.closeResponse);

  if (!response && !error && !loading) return null;
  return (
    <aside aria-label="AI response" className="ai-response-panel">
      <header>
        <span>
          <Brain size={15} />
          AI insight
        </span>
        <button aria-label="Close AI response" onClick={close} type="button">
          <X size={14} />
        </button>
      </header>
      <div className="ai-response-content">
        {loading ? (
          <p>Waiting for the configured provider...</p>
        ) : error ? (
          <div className="ai-error">
            <p>{error}</p>
            <button onClick={retry} type="button">
              <RotateCcw size={12} />
              Retry
            </button>
          </div>
        ) : response ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {response.content}
          </ReactMarkdown>
        ) : null}
      </div>
      <footer>
        {loading ? (
          <button onClick={cancel} type="button">
            Cancel
          </button>
        ) : response ? (
          <span>
            {response.provider} · {response.model}
          </span>
        ) : null}
      </footer>
    </aside>
  );
}
