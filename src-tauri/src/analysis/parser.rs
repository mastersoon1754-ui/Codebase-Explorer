use std::path::Path;

use tree_sitter::{Node, Parser, Point};

use crate::languages::parser_for_path;

use super::types::{AnalysisError, FileAnalysis, SourcePosition, SourceRange, Symbol, SymbolKind};

pub fn parse_file(
    path: &Path,
    relative_path: &str,
    source: String,
) -> Result<FileAnalysis, AnalysisError> {
    let language_parser = parser_for_path(path).ok_or_else(|| {
        AnalysisError::new(
            "unsupportedLanguage",
            "No parser is available for this file",
        )
    })?;
    let extension = path
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or_default();
    let mut parser = Parser::new();
    parser
        .set_language(&language_parser.language(extension))
        .map_err(|error| AnalysisError::new("parserFailed", error.to_string()))?;
    let tree = parser
        .parse(&source, None)
        .ok_or_else(|| AnalysisError::new("parserFailed", "Tree-sitter returned no syntax tree"))?;
    let mut collector = SymbolCollector::new(relative_path, &source);
    language_parser.collect_symbols(tree.root_node(), &mut collector);
    let parse_errors = count_errors(tree.root_node());
    let content_hash = blake3::hash(source.as_bytes()).to_hex().to_string();
    let symbols = collector.symbols;

    Ok(FileAnalysis {
        path: relative_path.to_owned(),
        language: language_parser.id().to_owned(),
        content_hash,
        source,
        symbols,
        parse_errors,
        cached: false,
    })
}

pub struct SymbolCollector<'a> {
    path: &'a str,
    source: &'a str,
    pub symbols: Vec<Symbol>,
}

impl<'a> SymbolCollector<'a> {
    fn new(path: &'a str, source: &'a str) -> Self {
        Self {
            path,
            source,
            symbols: Vec::new(),
        }
    }

    pub fn push_named(
        &mut self,
        node: Node<'_>,
        kind: SymbolKind,
        name_field: &str,
        body_field: &str,
        parent: Option<&str>,
    ) -> Option<&str> {
        let name_node = node.child_by_field_name(name_field)?;
        let name = self.text(name_node)?.trim();
        if name.is_empty() {
            return None;
        }
        let signature_end = node
            .child_by_field_name(body_field)
            .map_or(node.end_byte(), |body| body.start_byte());
        let signature = self.source[node.start_byte()..signature_end]
            .trim()
            .trim_end_matches(':')
            .trim()
            .to_owned();
        self.push_symbol(node, name, kind, signature, parent);
        Some(name)
    }

    pub fn push_python_constant(&mut self, node: Node<'_>, parent: Option<&str>) {
        if parent.is_some() {
            return;
        }
        let Some(left) = node.child_by_field_name("left") else {
            return;
        };
        let Some(name) = self.text(left).map(str::trim) else {
            return;
        };
        if is_constant_name(name) {
            let signature = self.text(node).unwrap_or(name).trim().to_owned();
            self.push_symbol(node, name, SymbolKind::Constant, signature, parent);
        }
    }

    pub fn push_javascript_declarations(&mut self, node: Node<'_>, parent: Option<&str>) {
        let declaration = self.text(node).unwrap_or_default().trim_start();
        let is_const =
            declaration.starts_with("const ") || declaration.starts_with("export const ");
        let mut cursor = node.walk();
        for child in node.named_children(&mut cursor) {
            if child.kind() != "variable_declarator" {
                continue;
            }
            let Some(name_node) = child.child_by_field_name("name") else {
                continue;
            };
            let Some(name) = self.text(name_node).map(str::trim) else {
                continue;
            };
            let value_kind = child.child_by_field_name("value").map(|value| value.kind());
            let kind = match value_kind {
                Some("arrow_function" | "function" | "generator_function") => SymbolKind::Function,
                _ if is_const && is_constant_name(name) => SymbolKind::Constant,
                _ => continue,
            };
            let signature = self.text(child).unwrap_or(name).trim().to_owned();
            self.push_symbol(child, name, kind, signature, parent);
        }
    }

    fn push_symbol(
        &mut self,
        node: Node<'_>,
        name: &str,
        kind: SymbolKind,
        signature: String,
        parent: Option<&str>,
    ) {
        let qualified_name =
            parent.map_or_else(|| name.to_owned(), |value| format!("{value}.{name}"));
        let parent_id = parent.map(|value| format!("{}:{value}", self.path));
        self.symbols.push(Symbol {
            id: format!("{}:{qualified_name}", self.path),
            name: name.to_owned(),
            qualified_name,
            kind,
            signature,
            documentation: preceding_documentation(node, self.source),
            range: range(node),
            parent_id,
        });
    }

    fn text(&self, node: Node<'_>) -> Option<&'a str> {
        self.source.get(node.byte_range())
    }
}

fn is_constant_name(name: &str) -> bool {
    !name.is_empty()
        && name
            .chars()
            .any(|character| character.is_ascii_alphabetic())
        && name.chars().all(|character| {
            character.is_ascii_uppercase() || character.is_ascii_digit() || character == '_'
        })
}

fn preceding_documentation(node: Node<'_>, source: &str) -> Option<String> {
    let previous = node.prev_named_sibling()?;
    if !matches!(previous.kind(), "comment" | "string")
        || previous.end_position().row + 2 < node.start_position().row
    {
        return None;
    }
    source.get(previous.byte_range()).map(|text| {
        text.trim()
            .trim_matches(|character| matches!(character, '#' | '/' | '*' | '"' | '\''))
            .trim()
            .to_owned()
    })
}

fn range(node: Node<'_>) -> SourceRange {
    SourceRange {
        start: position(node.start_position()),
        end: position(node.end_position()),
    }
}

fn position(point: Point) -> SourcePosition {
    SourcePosition {
        row: point.row + 1,
        column: point.column + 1,
    }
}

fn count_errors(node: Node<'_>) -> usize {
    let mut count = usize::from(node.is_error() || node.is_missing());
    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        count += count_errors(child);
    }
    count
}

#[cfg(test)]
mod tests {
    use super::*;

    fn parse(path: &str, source: &str) -> FileAnalysis {
        parse_file(Path::new(path), path, source.to_owned()).unwrap()
    }

    #[test]
    fn extracts_python_classes_functions_methods_and_constants() {
        let analysis = parse(
            "service.py",
            "MAX_RETRIES: int = 3\n\nclass Service:\n    def run(self, value: str) -> bool:\n        return True\n\ndef create(name: str = 'x') -> Service:\n    return Service()\n",
        );

        assert!(
            analysis
                .symbols
                .iter()
                .any(|symbol| symbol.kind == SymbolKind::Constant && symbol.name == "MAX_RETRIES")
        );
        assert!(
            analysis
                .symbols
                .iter()
                .any(|symbol| symbol.kind == SymbolKind::Class && symbol.name == "Service")
        );
        assert!(
            analysis
                .symbols
                .iter()
                .any(|symbol| symbol.kind == SymbolKind::Method
                    && symbol.qualified_name == "Service.run")
        );
        assert!(
            analysis
                .symbols
                .iter()
                .any(|symbol| symbol.kind == SymbolKind::Function
                    && symbol.signature.contains("create(name: str"))
        );
        assert_eq!(analysis.symbols.len(), 4);
    }

    #[test]
    fn extracts_javascript_declarations_and_arrow_functions() {
        let analysis = parse(
            "index.js",
            "const API_URL = 'https://example.test';\nexport function load(id) { return id; }\nconst normalize = (value) => value.trim();\nclass Client { request(path) { return path; } }\n",
        );

        assert!(
            analysis
                .symbols
                .iter()
                .any(|symbol| symbol.kind == SymbolKind::Constant && symbol.name == "API_URL")
        );
        assert!(
            analysis
                .symbols
                .iter()
                .any(|symbol| symbol.kind == SymbolKind::Function && symbol.name == "normalize")
        );
        assert!(
            analysis
                .symbols
                .iter()
                .any(|symbol| symbol.kind == SymbolKind::Method
                    && symbol.qualified_name == "Client.request")
        );
        assert_eq!(analysis.symbols.len(), 5);
    }

    #[test]
    fn extracts_typescript_interfaces_enums_and_signatures() {
        let analysis = parse(
            "types.ts",
            "export interface User { id: string; displayName(): string; }\nexport enum Role { Admin, Member }\nexport const DEFAULT_ROLE: Role = Role.Member;\nexport function findUser(id: string): User | null { return null; }\n",
        );

        assert!(
            analysis
                .symbols
                .iter()
                .any(|symbol| symbol.kind == SymbolKind::Interface && symbol.name == "User")
        );
        assert!(
            analysis
                .symbols
                .iter()
                .any(|symbol| symbol.kind == SymbolKind::Enum && symbol.name == "Role")
        );
        assert!(
            analysis
                .symbols
                .iter()
                .any(|symbol| symbol.kind == SymbolKind::Constant && symbol.name == "DEFAULT_ROLE")
        );
        assert!(analysis.symbols.iter().any(|symbol| {
            symbol
                .signature
                .contains("findUser(id: string): User | null")
        }));
    }

    #[test]
    fn parses_tsx_with_the_tsx_grammar() {
        let analysis = parse(
            "Card.tsx",
            "interface CardProps { title: string }\nexport function Card({ title }: CardProps) { return <article>{title}</article>; }\n",
        );

        assert_eq!(analysis.parse_errors, 0);
        assert!(
            analysis
                .symbols
                .iter()
                .any(|symbol| symbol.name == "CardProps")
        );
        assert!(analysis.symbols.iter().any(|symbol| symbol.name == "Card"));
    }
}
