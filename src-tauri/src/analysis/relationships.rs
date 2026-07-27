use std::path::{Component, Path, PathBuf};

use super::types::{FileAnalysis, ImportKind};

pub fn resolve_imports(root: &Path, relative_path: &str, analysis: &mut FileAnalysis) {
    let source_dir = Path::new(relative_path)
        .parent()
        .unwrap_or_else(|| Path::new(""));
    for import in &mut analysis.imports {
        let candidate = if analysis.language == "python" {
            python_candidate(source_dir, &import.module)
        } else if import.module.starts_with('.') {
            Some(source_dir.join(&import.module))
        } else {
            None
        };
        let Some(candidate) = candidate else {
            import.kind = ImportKind::External;
            continue;
        };
        if let Some(resolved) = resolve_candidate(root, &candidate, &analysis.language) {
            import.kind = ImportKind::Local;
            import.resolved_path = Some(resolved);
        } else {
            import.kind = ImportKind::External;
        }
    }
}

fn python_candidate(source_dir: &Path, module: &str) -> Option<PathBuf> {
    if module.starts_with('.') {
        let dot_count = module
            .chars()
            .take_while(|character| *character == '.')
            .count();
        let mut base = source_dir.to_path_buf();
        for _ in 1..dot_count {
            base.pop();
        }
        let suffix = module.trim_start_matches('.').replace('.', "/");
        return Some(base.join(suffix));
    }
    Some(PathBuf::from(module.replace('.', "/")))
}

fn resolve_candidate(root: &Path, candidate: &Path, language: &str) -> Option<String> {
    if candidate
        .components()
        .any(|part| matches!(part, Component::ParentDir))
    {
        let absolute = root.join(candidate).canonicalize().ok()?;
        if !absolute.starts_with(root) {
            return None;
        }
    }
    let extensions: &[&str] = match language {
        "python" => &["py", "pyi"],
        "typescript" => &["ts", "tsx", "mts", "cts", "js", "jsx"],
        _ => &["js", "jsx", "mjs", "cjs", "ts", "tsx"],
    };
    let mut candidates = Vec::new();
    if candidate.extension().is_some() {
        candidates.push(candidate.to_path_buf());
    } else {
        candidates.extend(
            extensions
                .iter()
                .map(|extension| candidate.with_extension(extension)),
        );
        candidates.extend(extensions.iter().map(|extension| {
            candidate.join(if language == "python" {
                format!("__init__.{extension}")
            } else {
                format!("index.{extension}")
            })
        }));
    }
    candidates.into_iter().find_map(|path| {
        let absolute = root.join(&path);
        absolute.is_file().then(|| normalized(&path))
    })
}

fn normalized(path: &Path) -> String {
    path.components()
        .filter_map(|component| match component {
            Component::Normal(value) => value.to_str(),
            Component::ParentDir => Some(".."),
            _ => None,
        })
        .collect::<Vec<_>>()
        .join("/")
}

#[cfg(test)]
mod tests {
    use std::fs;

    use tempfile::tempdir;

    use super::*;
    use crate::analysis::parser::parse_file;

    #[test]
    fn resolves_typescript_files_and_index_modules() {
        let fixture = tempdir().unwrap();
        fs::create_dir_all(fixture.path().join("src/lib")).unwrap();
        fs::write(
            fixture.path().join("src/http.ts"),
            "export const get = () => 1;",
        )
        .unwrap();
        fs::write(
            fixture.path().join("src/lib/index.ts"),
            "export const value = 1;",
        )
        .unwrap();
        let mut analysis = parse_file(
            Path::new("src/client.ts"),
            "src/client.ts",
            "import { get } from './http';\nimport { value } from './lib';".into(),
        )
        .unwrap();

        resolve_imports(fixture.path(), "src/client.ts", &mut analysis);

        assert_eq!(
            analysis.imports[0].resolved_path.as_deref(),
            Some("src/http.ts")
        );
        assert_eq!(
            analysis.imports[1].resolved_path.as_deref(),
            Some("src/lib/index.ts")
        );
    }

    #[test]
    fn resolves_python_relative_and_project_imports() {
        let fixture = tempdir().unwrap();
        fs::create_dir_all(fixture.path().join("app")).unwrap();
        fs::write(fixture.path().join("app/models.py"), "class User: pass").unwrap();
        fs::write(fixture.path().join("settings.py"), "DEBUG = True").unwrap();
        let mut analysis = parse_file(
            Path::new("app/service.py"),
            "app/service.py",
            "from .models import User\nimport settings\nimport requests".into(),
        )
        .unwrap();

        resolve_imports(fixture.path(), "app/service.py", &mut analysis);

        assert_eq!(
            analysis.imports[0].resolved_path.as_deref(),
            Some("app/models.py")
        );
        assert_eq!(
            analysis.imports[1].resolved_path.as_deref(),
            Some("settings.py")
        );
        assert_eq!(analysis.imports[2].kind, ImportKind::External);
    }
}
