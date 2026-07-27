use std::path::Path;

use tree_sitter::{Language, Node};

use crate::analysis::parser::SymbolCollector;

mod javascript;
mod python;
mod typescript;

pub trait LanguageParser: Send + Sync {
    fn id(&self) -> &'static str;
    fn extensions(&self) -> &'static [&'static str];
    fn language(&self, extension: &str) -> Language;
    fn collect_symbols(&self, root: Node<'_>, collector: &mut SymbolCollector<'_>);
}

static PYTHON: python::PythonParser = python::PythonParser;
static JAVASCRIPT: javascript::JavaScriptParser = javascript::JavaScriptParser;
static TYPESCRIPT: typescript::TypeScriptParser = typescript::TypeScriptParser;

pub fn parser_for_path(path: &Path) -> Option<&'static dyn LanguageParser> {
    let extension = path.extension()?.to_str()?.to_ascii_lowercase();
    [&PYTHON as &dyn LanguageParser, &JAVASCRIPT, &TYPESCRIPT]
        .into_iter()
        .find(|parser| parser.extensions().contains(&extension.as_str()))
}
