use tree_sitter::Node;

use super::LanguageParser;
use crate::analysis::{parser::SymbolCollector, types::SymbolKind};

pub struct TypeScriptParser;

impl LanguageParser for TypeScriptParser {
    fn id(&self) -> &'static str {
        "typescript"
    }

    fn extensions(&self) -> &'static [&'static str] {
        &["ts", "tsx", "mts", "cts"]
    }

    fn language(&self, extension: &str) -> tree_sitter::Language {
        if extension == "tsx" {
            tree_sitter_typescript::LANGUAGE_TSX.into()
        } else {
            tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into()
        }
    }

    fn collect_symbols(&self, root: Node<'_>, collector: &mut SymbolCollector<'_>) {
        visit(root, collector, None);
    }
}

fn visit(node: Node<'_>, collector: &mut SymbolCollector<'_>, parent: Option<&str>) {
    let next_parent = match node.kind() {
        "class_declaration" | "abstract_class_declaration" => collector
            .push_named(node, SymbolKind::Class, "name", "body", parent)
            .map(str::to_owned),
        "interface_declaration" => collector
            .push_named(node, SymbolKind::Interface, "name", "body", parent)
            .map(str::to_owned),
        "enum_declaration" => collector
            .push_named(node, SymbolKind::Enum, "name", "body", parent)
            .map(str::to_owned),
        "function_declaration" | "generator_function_declaration" => collector
            .push_named(node, SymbolKind::Function, "name", "body", parent)
            .map(str::to_owned),
        "method_definition" | "method_signature" => collector
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
