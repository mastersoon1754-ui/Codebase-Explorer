import { KeyRound, ShieldCheck, Trash2, X } from "lucide-react";
import { useState } from "react";
import { clearAIKey, saveAISettings } from "../ai/api";
import { useAIStore } from "../ai/ai-store";

export function AISettingsDialog({ onClose }: { onClose: () => void }) {
  const current = useAIStore((state) => state.settings);
  const setSettings = useAIStore((state) => state.setSettings);
  const [endpoint, setEndpoint] = useState(
    current?.endpoint ?? "https://api.openai.com/v1",
  );
  const [model, setModel] = useState(current?.model ?? "gpt-4.1-mini");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(false);
    try {
      setSettings(await saveAISettings(endpoint, model, apiKey));
      onClose();
    } catch {
      setSaving(false);
      setError(true);
    }
  }
  async function handleClear() {
    setSettings(await clearAIKey());
    setApiKey("");
  }

  return (
    <div className="palette-backdrop" onMouseDown={onClose} role="presentation">
      <section
        aria-label="AI provider settings"
        aria-modal="true"
        className="settings-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header>
          <div>
            <div className="eyebrow">Optional integration</div>
            <h2>AI provider</h2>
          </div>
          <button aria-label="Close settings" onClick={onClose} type="button">
            <X size={15} />
          </button>
        </header>
        <p className="settings-note">
          <ShieldCheck size={14} />
          Core analysis remains local. Source is sent only when you run an AI
          action.
        </p>
        <label>
          Endpoint
          <input
            onChange={(event) => setEndpoint(event.target.value)}
            spellCheck={false}
            value={endpoint}
          />
        </label>
        <label>
          Model
          <input
            onChange={(event) => setModel(event.target.value)}
            spellCheck={false}
            value={model}
          />
        </label>
        <label>
          API key
          <span className="secret-input">
            <KeyRound size={14} />
            <input
              autoComplete="off"
              onChange={(event) => setApiKey(event.target.value)}
              placeholder={
                current?.configured
                  ? "Stored in system credential manager"
                  : "Enter API key"
              }
              type="password"
              value={apiKey}
            />
          </span>
        </label>
        {error && (
          <p className="export-error">Provider settings could not be saved.</p>
        )}
        <footer>
          {current?.configured && (
            <button
              className="danger-button"
              onClick={handleClear}
              type="button"
            >
              <Trash2 size={13} />
              Remove key
            </button>
          )}
          <span />
          <button className="secondary-button" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="primary-button"
            disabled={saving}
            onClick={handleSave}
            type="button"
          >
            {saving ? "Saving" : "Save provider"}
          </button>
        </footer>
      </section>
    </div>
  );
}
