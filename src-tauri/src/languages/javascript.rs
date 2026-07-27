use tree_sitter::Node;

use super::LanguageParser;
use crate::analysis::{parser::SymbolCollector, types::SymbolKind};

pub struct JavaScriptParser;

impl LanguageParser for JavaScriptParser {
    fn id(&self) -> &'static str {
        "javascript"
    }

    fn extensions(&self) -> &'static [&'static str] {
        &["js", "jsx", "mjs", "cjs"]
    }

    fn language(&self, _extension: &str) -> tree_sitter::Language {
        tree_sitter_javascript::LANGUAGE.into()
    }

    fn collect_symbols(&self, root: Node<'_>, collector: &mut SymbolCollector<'_>) {
        visit(root, collector, None);
    }
}

pub(super) fn visit(node: Node<'_>, collector: &mut SymbolCollector<'_>, parent: Option<&str>) {
    let next_parent = match node.kind() {
        "class_declaration" | "class" => collector
            .push_named(node, SymbolKind::Class, "name", "body", parent)
            .map(str::to_owned),
        "function_declaration" | "generator_function_declaration" => collector
            .push_named(node, SymbolKind::Function, "name", "body", parent)
            .map(str::to_owned),
        "method_definition" => collector
            .push_named(node, SymbolKind::Method, "name", "body", parent)
            .map(str::to_owned),
        "lexical_declaration" => {
            collector.push_javascript_declarations(node, parent);
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
