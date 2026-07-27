use std::path::Path;

use crate::{
    analysis::types::ProjectStatistics,
    project::types::{EntryKind, ProjectEntry},
    search::types::ProjectIndex,
};

use super::types::DocumentationBundle;

pub fn generate(
    root: &Path,
    entries: &[ProjectEntry],
    statistics: &ProjectStatistics,
    index: &ProjectIndex,
) -> DocumentationBundle {
    let project_name = root
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("Project")
        .to_owned();
    let folder_diagram = folder_diagram(entries);
    let dependency_diagram = dependency_diagram(index);
    let class_diagram = class_diagram(index);
    let mut markdown = format!(
        "# {project_name}\n\nGenerated locally by Codebase Explorer.\n\n## Overview\n\n- Files: {}\n- Lines: {}\n- Source lines: {}\n- Dependencies: {}\n\n## Folder Structure\n\n```mermaid\n{folder_diagram}\n```\n\n## Dependencies\n\n```mermaid\n{dependency_diagram}\n```\n\n## Classes\n\n```mermaid\n{class_diagram}\n```\n\n## Symbols\n\n",
        entries
            .iter()
            .filter(|entry| entry.kind == EntryKind::File)
            .count(),
        statistics.total_lines,
        statistics.source_lines,
        statistics.dependencies.len(),
    );
    for symbol in index
        .entries
        .iter()
        .filter(|entry| entry.symbol_id.is_some())
    {
        markdown.push_str(&format!(
            "- **{}** in `{}`",
            escape_markdown(&symbol.label),
            symbol.path
        ));
        if let Some(line) = symbol.line {
            markdown.push_str(&format!(" at line {line}"));
        }
        markdown.push('\n');
    }
    DocumentationBundle {
        project_name,
        markdown,
        folder_diagram,
        class_diagram,
        dependency_diagram,
    }
}

fn folder_diagram(entries: &[ProjectEntry]) -> String {
    let mut output = String::from("flowchart TD\n  root[\"Project\"]\n");
    for entry in entries
        .iter()
        .filter(|entry| entry.kind == EntryKind::Directory)
        .take(200)
    {
        let id = mermaid_id(&entry.path);
        let parent = entry
            .parent
            .as_deref()
            .map(mermaid_id)
            .unwrap_or_else(|| "root".into());
        output.push_str(&format!(
            "  {parent} --> {id}[\"{}\"]\n",
            escape_mermaid(&entry.name)
        ));
    }
    output.trim_end().to_owned()
}

fn dependency_diagram(index: &ProjectIndex) -> String {
    let mut output = String::from("flowchart LR\n");
    for node in &index.graph.nodes {
        output.push_str(&format!(
            "  {}[\"{}\"]\n",
            mermaid_id(&node.id),
            escape_mermaid(&node.label)
        ));
    }
    for edge in &index.graph.edges {
        output.push_str(&format!(
            "  {} --> {}\n",
            mermaid_id(&edge.source),
            mermaid_id(&edge.target)
        ));
    }
    output.trim_end().to_owned()
}

fn class_diagram(index: &ProjectIndex) -> String {
    let mut output = String::from("classDiagram\n");
    for entry in index
        .entries
        .iter()
        .filter(|entry| entry.detail.ends_with("class"))
    {
        output.push_str(&format!("  class {}\n", mermaid_id(&entry.label)));
    }
    output.trim_end().to_owned()
}

fn mermaid_id(value: &str) -> String {
    format!(
        "n_{}",
        blake3::hash(value.as_bytes())
            .to_hex()
            .chars()
            .take(12)
            .collect::<String>()
    )
}

fn escape_mermaid(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('"', "&quot;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}
fn escape_markdown(value: &str) -> String {
    value.chars().fold(String::new(), |mut output, character| {
        if matches!(character, '*' | '_' | '`') {
            output.push('\\');
        }
        output.push(character);
        output
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{analysis::types::ProjectStatistics, search::types::DependencyGraph};

    #[test]
    fn generation_is_stable_and_escapes_mermaid_labels() {
        let entries = vec![ProjectEntry {
            path: "src/a\"b".into(),
            name: "a\"b".into(),
            parent: Some("src".into()),
            kind: EntryKind::Directory,
            size: 0,
            language: None,
        }];
        let stats = ProjectStatistics {
            total_lines: 10,
            source_lines: 8,
            blank_lines: 1,
            comment_lines: 1,
            largest_files: vec![],
            dependencies: vec![],
        };
        let index = ProjectIndex {
            entries: vec![],
            graph: DependencyGraph::default(),
        };
        let first = generate(Path::new("example"), &entries, &stats, &index);
        let second = generate(Path::new("example"), &entries, &stats, &index);
        assert_eq!(first, second);
        assert!(first.folder_diagram.contains("a&quot;b"));
    }
}
