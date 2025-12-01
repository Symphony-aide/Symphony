/// Server configuration for LSP servers
///
/// Provides configuration structures and default settings for each supported language.

use crate::language::Language;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

/// Server configuration
///
/// Defines how to spawn and communicate with an LSP server.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfiguration {
    /// Command to execute (e.g., "typescript-language-server", "pyright-langserver")
    pub command: String,

    /// Command arguments
    pub args: Vec<String>,

    /// Environment variables
    #[serde(default)]
    pub env: HashMap<String, String>,

    /// Working directory (None = use project root)
    #[serde(default)]
    pub cwd: Option<PathBuf>,

    /// Whether the server is enabled
    #[serde(default = "default_enabled")]
    pub enabled: bool,
}

fn default_enabled() -> bool {
    true
}

impl ServerConfiguration {
    /// Create a new server configuration
    ///
    /// # Arguments
    ///
    /// * `command` - Server executable command
    /// * `args` - Command line arguments
    ///
    /// # Examples
    ///
    /// ```
    /// use lsp_manager_symphony::ServerConfiguration;
    ///
    /// let config = ServerConfiguration::new(
    ///     "typescript-language-server",
    ///     vec!["--stdio".to_string()]
    /// );
    /// ```
    pub fn new(command: impl Into<String>, args: Vec<String>) -> Self {
        Self {
            command: command.into(),
            args,
            env: HashMap::new(),
            cwd: None,
            enabled: true,
        }
    }

    /// Set environment variables
    ///
    /// # Arguments
    ///
    /// * `env` - Environment variables map
    pub fn with_env(mut self, env: HashMap<String, String>) -> Self {
        self.env = env;
        self
    }

    /// Set working directory
    ///
    /// # Arguments
    ///
    /// * `cwd` - Working directory path
    pub fn with_cwd(mut self, cwd: PathBuf) -> Self {
        self.cwd = Some(cwd);
        self
    }

    /// Set enabled status
    ///
    /// # Arguments
    ///
    /// * `enabled` - Whether the server is enabled
    pub fn with_enabled(mut self, enabled: bool) -> Self {
        self.enabled = enabled;
        self
    }

    /// Add an environment variable
    ///
    /// # Arguments
    ///
    /// * `key` - Environment variable name
    /// * `value` - Environment variable value
    pub fn add_env(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.env.insert(key.into(), value.into());
        self
    }
}

/// Get default server configuration for a language
///
/// Returns the default configuration for spawning a language server.
/// These configurations assume the language servers are installed and in PATH.
///
/// # Arguments
///
/// * `language` - The programming language
///
/// # Returns
///
/// Default server configuration
///
/// # Examples
///
/// ```
/// use lsp_manager_symphony::{Language, get_default_config};
///
/// let config = get_default_config(Language::TypeScript);
/// assert_eq!(config.command, "typescript-language-server");
/// ```
pub fn get_default_config(language: Language) -> ServerConfiguration {
    match language {
        Language::TypeScript | Language::JavaScript => {
            // TypeScript language server handles both TypeScript and JavaScript
            #[cfg(windows)]
            let command = "npx.cmd";
            #[cfg(not(windows))]
            let command = "npx";

            ServerConfiguration::new(
                command,
                vec![
                    "typescript-language-server".to_string(),
                    "--stdio".to_string(),
                ],
            )
        }

        Language::Python => {
            // Pyright language server for Python
            #[cfg(windows)]
            let command = "npx.cmd";
            #[cfg(not(windows))]
            let command = "npx";

            ServerConfiguration::new(
                command,
                vec!["pyright-langserver".to_string(), "--stdio".to_string()],
            )
        }

        Language::Rust => {
            // rust-analyzer for Rust
            ServerConfiguration::new("rust-analyzer", vec![])
        }

        Language::Go => {
            // gopls for Go
            ServerConfiguration::new("gopls", vec![])
        }
    }
}

/// Get all default configurations
///
/// Returns a map of all supported languages to their default configurations.
///
/// # Returns
///
/// HashMap mapping language identifiers to configurations
///
/// # Examples
///
/// ```
/// use lsp_manager_symphony::get_all_default_configs;
///
/// let configs = get_all_default_configs();
/// assert!(configs.contains_key("typescript"));
/// assert!(configs.contains_key("python"));
/// ```
pub fn get_all_default_configs() -> HashMap<String, ServerConfiguration> {
    let mut configs = HashMap::new();

    for language in Language::all() {
        configs.insert(language.as_str().to_string(), get_default_config(*language));
    }

    configs
}

/// Validate server configuration
///
/// Checks if a server configuration is valid and the executable exists.
///
/// # Arguments
///
/// * `config` - Server configuration to validate
///
/// # Returns
///
/// `Ok(())` if valid, `Err` with description if invalid
///
/// # Examples
///
/// ```
/// use lsp_manager_symphony::{ServerConfiguration, validate_config};
///
/// let config = ServerConfiguration::new("typescript-language-server", vec!["--stdio".to_string()]);
/// // validate_config(&config)?;
/// ```
pub fn validate_config(config: &ServerConfiguration) -> Result<(), String> {
    if config.command.is_empty() {
        return Err("Server command cannot be empty".to_string());
    }

    // Check if command is an absolute path
    if config.command.contains('/') || config.command.contains('\\') {
        let path = PathBuf::from(&config.command);
        if !path.exists() {
            return Err(format!("Server executable not found: {}", config.command));
        }
        if !path.is_file() {
            return Err(format!("Server path is not a file: {}", config.command));
        }
    }

    // Validate working directory if specified
    if let Some(cwd) = &config.cwd {
        if !cwd.exists() {
            return Err(format!("Working directory does not exist: {}", cwd.display()));
        }
        if !cwd.is_dir() {
            return Err(format!(
                "Working directory is not a directory: {}",
                cwd.display()
            ));
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_server_configuration_new() {
        let config = ServerConfiguration::new("test-server", vec!["--stdio".to_string()]);
        assert_eq!(config.command, "test-server");
        assert_eq!(config.args, vec!["--stdio"]);
        assert!(config.enabled);
        assert!(config.env.is_empty());
        assert!(config.cwd.is_none());
    }

    #[test]
    fn test_server_configuration_with_env() {
        let mut env = HashMap::new();
        env.insert("KEY".to_string(), "VALUE".to_string());

        let config = ServerConfiguration::new("test-server", vec![]).with_env(env.clone());
        assert_eq!(config.env, env);
    }

    #[test]
    fn test_server_configuration_with_cwd() {
        let cwd = PathBuf::from("/tmp");
        let config = ServerConfiguration::new("test-server", vec![]).with_cwd(cwd.clone());
        assert_eq!(config.cwd, Some(cwd));
    }

    #[test]
    fn test_server_configuration_with_enabled() {
        let config = ServerConfiguration::new("test-server", vec![]).with_enabled(false);
        assert!(!config.enabled);
    }

    #[test]
    fn test_server_configuration_add_env() {
        let config = ServerConfiguration::new("test-server", vec![])
            .add_env("KEY1", "VALUE1")
            .add_env("KEY2", "VALUE2");

        assert_eq!(config.env.get("KEY1"), Some(&"VALUE1".to_string()));
        assert_eq!(config.env.get("KEY2"), Some(&"VALUE2".to_string()));
    }

    #[test]
    fn test_get_default_config_typescript() {
        let config = get_default_config(Language::TypeScript);
        #[cfg(windows)]
        assert_eq!(config.command, "npx.cmd");
        #[cfg(not(windows))]
        assert_eq!(config.command, "npx");
        assert!(config.args.contains(&"typescript-language-server".to_string()));
        assert!(config.args.contains(&"--stdio".to_string()));
    }

    #[test]
    fn test_get_default_config_javascript() {
        let config = get_default_config(Language::JavaScript);
        // JavaScript uses the same server as TypeScript
        #[cfg(windows)]
        assert_eq!(config.command, "npx.cmd");
        #[cfg(not(windows))]
        assert_eq!(config.command, "npx");
        assert!(config.args.contains(&"typescript-language-server".to_string()));
    }

    #[test]
    fn test_get_default_config_python() {
        let config = get_default_config(Language::Python);
        #[cfg(windows)]
        assert_eq!(config.command, "npx.cmd");
        #[cfg(not(windows))]
        assert_eq!(config.command, "npx");
        assert!(config.args.contains(&"pyright-langserver".to_string()));
    }

    #[test]
    fn test_get_default_config_rust() {
        let config = get_default_config(Language::Rust);
        assert_eq!(config.command, "rust-analyzer");
    }

    #[test]
    fn test_get_default_config_go() {
        let config = get_default_config(Language::Go);
        assert_eq!(config.command, "gopls");
    }

    #[test]
    fn test_get_all_default_configs() {
        let configs = get_all_default_configs();
        assert_eq!(configs.len(), 5);
        assert!(configs.contains_key("typescript"));
        assert!(configs.contains_key("javascript"));
        assert!(configs.contains_key("python"));
        assert!(configs.contains_key("rust"));
        assert!(configs.contains_key("go"));
    }

    #[test]
    fn test_validate_config_empty_command() {
        let config = ServerConfiguration::new("", vec![]);
        assert!(validate_config(&config).is_err());
    }

    #[test]
    fn test_validate_config_valid() {
        let config = ServerConfiguration::new("test-server", vec!["--stdio".to_string()]);
        // This will pass because we don't check if the command exists in PATH
        assert!(validate_config(&config).is_ok());
    }
}
