use std::{collections::BTreeSet, fs, path::Path};

use crate::{
    analysis::{parser::parse_file, relationships::resolve_imports},
    project::types::{EntryKind, ProjectEntry},
};

use super::types::{
    DependencyGraph, GraphEdge, GraphNode, ProjectIndex, SearchResult, SearchResultKind,
};

const SUPPORTED_LANGUAGES: &[&str] = &["python", "javascript", "typescript"];

pub fn build_index(root: &Path, project_entries: &[ProjectEntry]) -> ProjectIndex {
    let mut entries = Vec::new();
    let mut nodes = Vec::new();
    let mut edges = BTreeSet::new();

    for entry in project_entries
        .iter()
        .filter(|entry| entry.kind == EntryKind::File)
    {
        let analyzable = entry
            .language
            .as_deref()
            .is_some_and(|language| SUPPORTED_LANGUAGES.contains(&language))
            && entry.size <= 5 * 1024 * 1024;
        entries.push(SearchResult {
            kind: SearchResultKind::File,
            label: entry.name.clone(),
            detail: entry.path.clone(),
            path: entry.path.clone(),
            line: None,
            symbol_id: None,
            analyzable,
            score: 0,
        });
        if !analyzable {
            continue;
        }

        let path = root.join(&entry.path);
        let Ok(source) = fs::read_to_string(&path) else {
            continue;
        };
        let Ok(mut analysis) = parse_file(&path, &entry.path, source) else {
            continue;
        };
        resolve_imports(root, &entry.path, &mut analysis);
        nodes.push(GraphNode {
            id: entry.path.clone(),
            label: entry.name.clone(),
            path: entry.path.clone(),
        });
        entries.extend(analysis.symbols.into_iter().map(|symbol| SearchResult {
            kind: SearchResultKind::Symbol,
            label: symbol.name,
            detail: format!("{} · {:?}", entry.path, symbol.kind).to_lowercase(),
            path: entry.path.clone(),
            line: Some(symbol.range.start.row),
            symbol_id: Some(symbol.id),
            analyzable: true,
            score: 0,
        }));
        for import in analysis.imports {
            if let Some(target) = import.resolved_path {
                edges.insert((entry.path.clone(), target));
            }
        }
    }

    let node_ids: BTreeSet<&str> = nodes.iter().map(|node| node.id.as_str()).collect();
    let edges = edges
        .into_iter()
        .filter(|(source, target)| {
            node_ids.contains(source.as_str()) && node_ids.contains(target.as_str())
        })
        .map(|(source, target)| GraphEdge { source, target })
        .collect();
    nodes.sort_by(|left, right| left.path.cmp(&right.path));

    ProjectIndex {
        entries,
        graph: DependencyGraph { nodes, edges },
    }
}

pub fn search(index: &ProjectIndex, query: &str, limit: usize) -> Vec<SearchResult> {
    let query = query.trim().to_lowercase();
    if query.is_empty() {
        return Vec::new();
    }
    let mut results: Vec<SearchResult> = index
        .entries
        .iter()
        .filter_map(|entry| {
            let label = entry.label.to_lowercase();
            let path = entry.path.to_lowercase();
            let score = match_score(&label, &query)
                .or_else(|| match_score(&path, &query).map(|score| score.saturating_sub(10)))?;
            let mut result = entry.clone();
            result.score = score + u32::from(entry.kind == SearchResultKind::Symbol) * 5;
            Some(result)
        })
        .collect();
    results.sort_by(|left, right| {
        right
            .score
            .cmp(&left.score)
            .then_with(|| left.label.to_lowercase().cmp(&right.label.to_lowercase()))
            .then_with(|| left.path.cmp(&right.path))
    });
    results.truncate(limit.min(100));
    results
}

fn match_score(candidate: &str, query: &str) -> Option<u32> {
    if candidate == query {
        return Some(1000);
    }
    if candidate.starts_with(query) {
        return Some(800_u32.saturating_sub((candidate.len() - query.len()) as u32));
    }
    if let Some(position) = candidate.find(query) {
        return Some(600_u32.saturating_sub(position as u32));
    }
    let mut query_chars = query.chars();
    let mut current = query_chars.next()?;
    let mut gaps = 0_u32;
    let mut matched = 0_u32;
    for character in candidate.chars() {
        if character == current {
            matched += 1;
            if let Some(next) = query_chars.next() {
                current = next;
            } else {
                return Some(400_u32.saturating_sub(gaps));
            }
        } else if matched > 0 {
            gaps += 1;
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use std::fs;

    use tempfile::tempdir;

    use super::*;

    fn file(path: &str, language: &str) -> ProjectEntry {
        ProjectEntry {
            path: path.into(),
            name: Path::new(path)
                .file_name()
                .unwrap()
                .to_string_lossy()
                .into_owned(),
            parent: Path::new(path)
                .parent()
                .filter(|path| !path.as_os_str().is_empty())
                .map(|path| path.to_string_lossy().replace('\\', "/")),
            kind: EntryKind::File,
            size: 100,
            language: Some(language.into()),
        }
    }

    #[test]
    fn ranks_exact_prefix_path_and_fuzzy_matches() {
        let index = ProjectIndex {
            entries: vec![
                result("Parser", "src/parser.ts", SearchResultKind::Symbol),
                result("ParserFactory", "src/factory.ts", SearchResultKind::Symbol),
                result("app.ts", "src/parser/app.ts", SearchResultKind::File),
                result("ProjectScanner", "src/scanner.ts", SearchResultKind::Symbol),
            ],
            graph: DependencyGraph::default(),
        };

        let exact = search(&index, "parser", 10);
        assert_eq!(exact[0].label, "Parser");
        assert_eq!(exact[1].label, "ParserFactory");
        assert_eq!(exact[2].path, "src/parser/app.ts");
        assert_eq!(search(&index, "prjscan", 10)[0].label, "ProjectScanner");
    }

    #[test]
    fn builds_symbols_and_local_dependency_edges() {
        let fixture = tempdir().unwrap();
        fs::create_dir(fixture.path().join("src")).unwrap();
        fs::write(
            fixture.path().join("src/a.ts"),
            "import { b } from './b';\nexport function a() { return b(); }",
        )
        .unwrap();
        fs::write(
            fixture.path().join("src/b.ts"),
            "export function b() { return 1; }",
        )
        .unwrap();
        let entries = [
            file("src/a.ts", "typescript"),
            file("src/b.ts", "typescript"),
        ];

        let index = build_index(fixture.path(), &entries);

        assert!(
            index
                .entries
                .iter()
                .any(|entry| entry.label == "a" && entry.kind == SearchResultKind::Symbol)
        );
        assert_eq!(index.graph.nodes.len(), 2);
        assert_eq!(
            index.graph.edges,
            vec![GraphEdge {
                source: "src/a.ts".into(),
                target: "src/b.ts".into()
            }]
        );
    }

    fn result(label: &str, path: &str, kind: SearchResultKind) -> SearchResult {
        SearchResult {
            kind,
            label: label.into(),
            detail: path.into(),
            path: path.into(),
            line: None,
            symbol_id: None,
            analyzable: true,
            score: 0,
        }
    }
}
