use tree_sitter::Node;

use super::LanguageParser;
use crate::analysis::{parser::SymbolCollector, types::SymbolKind};

pub struct PythonParser;

impl LanguageParser for PythonParser {
    fn id(&self) -> &'static str {
        "python"
    }

    fn extensions(&self) -> &'static [&'static str] {
        &["py", "pyi"]
    }

    fn language(&self, _extension: &str) -> tree_sitter::Language {
        tree_sitter_python::LANGUAGE.into()
    }

    fn collect_symbols(&self, root: Node<'_>, collector: &mut SymbolCollector<'_>) {
        visit(root, collector, None);
    }
}

fn visit(node: Node<'_>, collector: &mut SymbolCollector<'_>, parent: Option<&str>) {
    let next_parent = match node.kind() {
        "class_definition" => collector
            .push_named(node, SymbolKind::Class, "name", "body", parent)
            .map(str::to_owned),
        "function_definition" => {
            let kind = if parent.is_some() {
                SymbolKind::Method
            } else {
                SymbolKind::Function
            };
            collector
                .push_named(node, kind, "name", "body", parent)
                .map(str::to_owned)
        }
        "expression_statement" => {
            if let Some(assignment) = node.named_child(0)
                && matches!(assignment.kind(), "assignment" | "annotated_assignment")
            {
                collector.push_python_constant(assignment, parent);
            }
            None
        }
        _ => None,
    };

    let child_parent = next_parent.as_deref().or(parent);
    let mut cursor = node.walk();
    for child in node.named_children(&mut cursor) {
        visit(child, collector, child_parent);
    }
}
