import { save } from "@tauri-apps/plugin-dialog";
import { Download, FileCode2, FileText, X } from "lucide-react";
import { useState } from "react";
import { exportDocumentation } from "../documentation/api";
import type { ExportFormat } from "../documentation/types";

const formats = [
  {
    id: "markdown" as const,
    label: "Markdown",
    extension: "md",
    icon: FileText,
  },
  { id: "html" as const, label: "HTML", extension: "html", icon: FileCode2 },
  { id: "pdf" as const, label: "PDF", extension: "pdf", icon: FileText },
];

export function ExportDialog({
  scanId,
  projectName,
  onClose,
}: {
  scanId: string;
  projectName: string;
  onClose: () => void;
}) {
  const [format, setFormat] = useState<ExportFormat>("markdown");
  const [exporting, setExporting] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleExport() {
    const selected = formats.find((item) => item.id === format)!;
    const destination = await save({
      title: "Export project documentation",
      defaultPath: `${projectName}-documentation.${selected.extension}`,
      filters: [{ name: selected.label, extensions: [selected.extension] }],
    });
    if (!destination) return;
    setExporting(true);
    setFailed(false);
    try {
      await exportDocumentation(scanId, format, destination);
      onClose();
    } catch {
      setFailed(true);
      setExporting(false);
    }
  }

  return (
    <div className="palette-backdrop" onMouseDown={onClose} role="presentation">
      <section
        aria-label="Export documentation"
        aria-modal="true"
        className="export-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header>
          <div>
            <div className="eyebrow">Portable documentation</div>
            <h2>Export project</h2>
          </div>
          <button aria-label="Close export" onClick={onClose} type="button">
            <X size={15} />
          </button>
        </header>
        <div className="export-formats">
          {formats.map(({ id, label, extension, icon: Icon }) => (
            <button
              data-active={format === id || undefined}
              key={id}
              onClick={() => setFormat(id)}
              type="button"
            >
              <Icon size={17} />
              <strong>{label}</strong>
              <small>.{extension}</small>
            </button>
          ))}
        </div>
        {failed && (
          <p className="export-error">
            The documentation could not be exported.
          </p>
        )}
        <footer>
          <button className="secondary-button" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="primary-button"
            disabled={exporting}
            onClick={handleExport}
            type="button"
          >
            <Download size={15} />
            {exporting ? "Exporting" : "Choose destination"}
          </button>
        </footer>
      </section>
    </div>
  );
}
