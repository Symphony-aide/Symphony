/// Language detection from file extensions
///
/// Maps file extensions to language identifiers for LSP server selection.

use std::path::Path;

/// Supported programming languages
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Language {
    /// TypeScript language
    TypeScript,
    /// JavaScript language
    JavaScript,
    /// Python language
    Python,
    /// Rust language
    Rust,
    /// Go language
    Go,
}

impl Language {
    /// Get the language identifier string
    ///
    /// Returns the canonical language identifier used for LSP server selection.
    ///
    /// # Examples
    ///
    /// ```
    /// use lsp_manager_symphony::Language;
    ///
    /// assert_eq!(Language::TypeScript.as_str(), "typescript");
    /// assert_eq!(Language::Python.as_str(), "python");
    /// ```
    pub fn as_str(&self) -> &'static str {
        match self {
            Language::TypeScript => "typescript",
            Language::JavaScript => "javascript",
            Language::Python => "python",
            Language::Rust => "rust",
            Language::Go => "go",
        }
    }

    /// Get the display name for the language
    ///
    /// Returns a human-readable name for UI display.
    pub fn display_name(&self) -> &'static str {
        match self {
            Language::TypeScript => "TypeScript",
            Language::JavaScript => "JavaScript",
            Language::Python => "Python",
            Language::Rust => "Rust",
            Language::Go => "Go",
        }
    }

    /// Get all supported languages
    ///
    /// Returns a slice of all languages supported by the LSP manager.
    pub fn all() -> &'static [Language] {
        &[
            Language::TypeScript,
            Language::JavaScript,
            Language::Python,
            Language::Rust,
            Language::Go,
        ]
    }
}

impl std::fmt::Display for Language {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.display_name())
    }
}

/// Detect language from file path
///
/// Analyzes the file extension to determine the programming language.
/// Returns `None` if the language is not supported.
///
/// # Arguments
///
/// * `file_path` - Path to the file
///
/// # Returns
///
/// The detected language, or `None` if not supported
///
/// # Examples
///
/// ```
/// use lsp_manager_symphony::{detect_language, Language};
///
/// assert_eq!(detect_language("src/main.rs"), Some(Language::Rust));
/// assert_eq!(detect_language("app.tsx"), Some(Language::TypeScript));
/// assert_eq!(detect_language("script.py"), Some(Language::Python));
/// assert_eq!(detect_language("main.go"), Some(Language::Go));
/// assert_eq!(detect_language("index.js"), Some(Language::JavaScript));
/// assert_eq!(detect_language("unknown.txt"), None);
/// ```
pub fn detect_language(file_path: &str) -> Option<Language> {
    let path = Path::new(file_path);
    let extension = path.extension()?.to_str()?;

    match extension {
        // TypeScript
        "ts" | "tsx" => Some(Language::TypeScript),
        
        // JavaScript
        "js" | "jsx" | "mjs" | "cjs" => Some(Language::JavaScript),
        
        // Python
        "py" | "pyi" | "pyw" => Some(Language::Python),
        
        // Rust
        "rs" => Some(Language::Rust),
        
        // Go
        "go" => Some(Language::Go),
        
        // Unsupported
        _ => None,
    }
}

/// Get file extensions for a language
///
/// Returns all file extensions associated with a language.
///
/// # Arguments
///
/// * `language` - The language to query
///
/// # Returns
///
/// A slice of file extensions (without the leading dot)
///
/// # Examples
///
/// ```
/// use lsp_manager_symphony::{Language, get_extensions_for_language};
///
/// assert_eq!(get_extensions_for_language(Language::TypeScript), &["ts", "tsx"]);
/// assert_eq!(get_extensions_for_language(Language::Python), &["py", "pyi", "pyw"]);
/// ```
pub fn get_extensions_for_language(language: Language) -> &'static [&'static str] {
    match language {
        Language::TypeScript => &["ts", "tsx"],
        Language::JavaScript => &["js", "jsx", "mjs", "cjs"],
        Language::Python => &["py", "pyi", "pyw"],
        Language::Rust => &["rs"],
        Language::Go => &["go"],
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_typescript() {
        assert_eq!(detect_language("src/main.ts"), Some(Language::TypeScript));
        assert_eq!(detect_language("Component.tsx"), Some(Language::TypeScript));
        assert_eq!(
            detect_language("/path/to/file.ts"),
            Some(Language::TypeScript)
        );
    }

    #[test]
    fn test_detect_javascript() {
        assert_eq!(detect_language("app.js"), Some(Language::JavaScript));
        assert_eq!(detect_language("Component.jsx"), Some(Language::JavaScript));
        assert_eq!(detect_language("module.mjs"), Some(Language::JavaScript));
        assert_eq!(detect_language("config.cjs"), Some(Language::JavaScript));
    }

    #[test]
    fn test_detect_python() {
        assert_eq!(detect_language("script.py"), Some(Language::Python));
        assert_eq!(detect_language("types.pyi"), Some(Language::Python));
        assert_eq!(detect_language("gui.pyw"), Some(Language::Python));
    }

    #[test]
    fn test_detect_rust() {
        assert_eq!(detect_language("main.rs"), Some(Language::Rust));
        assert_eq!(detect_language("lib.rs"), Some(Language::Rust));
        assert_eq!(detect_language("src/module.rs"), Some(Language::Rust));
    }

    #[test]
    fn test_detect_go() {
        assert_eq!(detect_language("main.go"), Some(Language::Go));
        assert_eq!(detect_language("server.go"), Some(Language::Go));
    }

    #[test]
    fn test_detect_unsupported() {
        assert_eq!(detect_language("file.txt"), None);
        assert_eq!(detect_language("README.md"), None);
        assert_eq!(detect_language("config.json"), None);
        assert_eq!(detect_language("no_extension"), None);
    }

    #[test]
    fn test_language_as_str() {
        assert_eq!(Language::TypeScript.as_str(), "typescript");
        assert_eq!(Language::JavaScript.as_str(), "javascript");
        assert_eq!(Language::Python.as_str(), "python");
        assert_eq!(Language::Rust.as_str(), "rust");
        assert_eq!(Language::Go.as_str(), "go");
    }

    #[test]
    fn test_language_display_name() {
        assert_eq!(Language::TypeScript.display_name(), "TypeScript");
        assert_eq!(Language::JavaScript.display_name(), "JavaScript");
        assert_eq!(Language::Python.display_name(), "Python");
        assert_eq!(Language::Rust.display_name(), "Rust");
        assert_eq!(Language::Go.display_name(), "Go");
    }

    #[test]
    fn test_get_extensions_for_language() {
        assert_eq!(
            get_extensions_for_language(Language::TypeScript),
            &["ts", "tsx"]
        );
        assert_eq!(
            get_extensions_for_language(Language::JavaScript),
            &["js", "jsx", "mjs", "cjs"]
        );
        assert_eq!(
            get_extensions_for_language(Language::Python),
            &["py", "pyi", "pyw"]
        );
        assert_eq!(get_extensions_for_language(Language::Rust), &["rs"]);
        assert_eq!(get_extensions_for_language(Language::Go), &["go"]);
    }

    #[test]
    fn test_all_languages() {
        let all = Language::all();
        assert_eq!(all.len(), 5);
        assert!(all.contains(&Language::TypeScript));
        assert!(all.contains(&Language::JavaScript));
        assert!(all.contains(&Language::Python));
        assert!(all.contains(&Language::Rust));
        assert!(all.contains(&Language::Go));
    }
}
