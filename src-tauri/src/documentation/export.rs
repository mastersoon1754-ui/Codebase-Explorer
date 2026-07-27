use std::{fs, path::Path};

use lopdf::{Document, Object, Stream, dictionary};

use crate::analysis::types::AnalysisError;

use super::types::{DocumentationBundle, ExportFormat};

pub fn export(
    bundle: &DocumentationBundle,
    format: ExportFormat,
    destination: &Path,
) -> Result<(), AnalysisError> {
    match format {
        ExportFormat::Markdown => fs::write(destination, &bundle.markdown).map_err(export_error),
        ExportFormat::Html => fs::write(destination, html(bundle)).map_err(export_error),
        ExportFormat::Pdf => pdf(bundle, destination),
    }
}

fn html(bundle: &DocumentationBundle) -> String {
    let body = escape_html(&bundle.markdown);
    format!(
        "<!doctype html><html lang=\"en\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width\"><title>{}</title><style>body{{max-width:960px;margin:40px auto;padding:0 24px;background:#111310;color:#e7e9e2;font:15px/1.6 system-ui}}pre{{white-space:pre-wrap;font-family:ui-monospace,monospace}}</style><body><pre>{body}</pre></body></html>",
        escape_html(&bundle.project_name)
    )
}

fn pdf(bundle: &DocumentationBundle, destination: &Path) -> Result<(), AnalysisError> {
    let mut document = Document::with_version("1.5");
    let pages_id = document.new_object_id();
    let font_id = document.add_object(
        dictionary! { "Type" => "Font", "Subtype" => "Type1", "BaseFont" => "Helvetica" },
    );
    let mut lines: Vec<String> = bundle.markdown.lines().map(sanitize_pdf).collect();
    if lines.is_empty() {
        lines.push(bundle.project_name.clone());
    }
    let mut page_ids = Vec::new();
    for chunk in lines.chunks(48) {
        let content = pdf_content(chunk);
        let content_id = document.add_object(Stream::new(dictionary! {}, content));
        let page_id = document.add_object(dictionary! {
            "Type" => "Page", "Parent" => pages_id,
            "MediaBox" => vec![0.into(), 0.into(), 612.into(), 792.into()],
            "Contents" => content_id,
            "Resources" => dictionary! { "Font" => dictionary! { "F1" => font_id } },
        });
        page_ids.push(page_id);
    }
    document.objects.insert(pages_id, Object::Dictionary(dictionary! { "Type" => "Pages", "Kids" => page_ids.iter().copied().map(Object::Reference).collect::<Vec<_>>(), "Count" => page_ids.len() as i64 }));
    let catalog_id = document.add_object(dictionary! { "Type" => "Catalog", "Pages" => pages_id });
    document.trailer.set("Root", catalog_id);
    document.compress();
    document.save(destination).map(|_| ()).map_err(export_error)
}

fn pdf_content(lines: &[String]) -> Vec<u8> {
    let mut content = String::from("BT /F1 10 Tf 50 750 Td 13 TL ");
    for line in lines {
        content.push_str(&format!(
            "({}) Tj T* ",
            line.replace('\\', "\\\\")
                .replace('(', "\\(")
                .replace(')', "\\)")
        ));
    }
    content.push_str("ET");
    content.into_bytes()
}

fn sanitize_pdf(value: &str) -> String {
    value
        .chars()
        .map(|character| if character.is_ascii() { character } else { '?' })
        .collect()
}
fn escape_html(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}
fn export_error(error: impl std::fmt::Display) -> AnalysisError {
    AnalysisError::new(
        "exportFailed",
        format!("Could not export documentation: {error}"),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    fn bundle() -> DocumentationBundle {
        DocumentationBundle {
            project_name: "Example <App>".into(),
            markdown: "# Example\n\nHello".into(),
            folder_diagram: "flowchart TD".into(),
            class_diagram: "classDiagram".into(),
            dependency_diagram: "flowchart LR".into(),
        }
    }

    #[test]
    fn html_is_self_contained_and_escaped() {
        let output = html(&bundle());
        assert!(output.contains("Example &lt;App&gt;"));
        assert!(!output.contains("<script"));
    }
    #[test]
    fn writes_a_valid_pdf() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("docs.pdf");
        pdf(&bundle(), &path).unwrap();
        assert!(Document::load(&path).is_ok());
    }

    #[test]
    fn empty_markdown_still_produces_one_page() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("empty.pdf");
        let mut value = bundle();
        value.markdown.clear();
        pdf(&value, &path).unwrap();
        assert_eq!(Document::load(&path).unwrap().get_pages().len(), 1);
    }
}
