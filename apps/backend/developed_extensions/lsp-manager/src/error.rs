/// Error types for LSP Manager
///
/// Provides comprehensive error handling for LSP server management,
/// process spawning, and communication.

use thiserror::Error;

/// LSP Manager error types
#[derive(Error, Debug)]
pub enum LSPError {
    /// Server process failed to spawn
    #[error("Failed to spawn LSP server for {language}: {source}")]
    SpawnError {
        language: String,
        source: std::io::Error,
    },

    /// Server initialization failed
    #[error("LSP server initialization failed for {language}: {message}")]
    InitializationError { language: String, message: String },

    /// Server crashed unexpectedly
    #[error("LSP server crashed for {language}: exit code {exit_code}")]
    ServerCrashed { language: String, exit_code: i32 },

    /// Maximum restart attempts exceeded
    #[error("LSP server for {language} exceeded maximum restart attempts ({max_attempts})")]
    MaxRestartsExceeded {
        language: String,
        max_attempts: u32,
    },

    /// Communication error with server
    #[error("Communication error with {language} server: {message}")]
    CommunicationError { language: String, message: String },

    /// JSON-RPC parse error
    #[error("Failed to parse JSON-RPC message: {0}")]
    JsonRpcParseError(String),

    /// Invalid server configuration
    #[error("Invalid server configuration for {language}: {message}")]
    ConfigurationError { language: String, message: String },

    /// Server executable not found
    #[error("Server executable not found for {language}: {path}")]
    ExecutableNotFound { language: String, path: String },

    /// Permission denied for server executable
    #[error("Permission denied for {language} server executable: {path}")]
    PermissionDenied { language: String, path: String },

    /// Server timeout
    #[error("LSP server timeout for {language}: operation took longer than {timeout_ms}ms")]
    Timeout {
        language: String,
        timeout_ms: u64,
    },

    /// IO error
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    /// Serialization error
    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),

    /// Generic error
    #[error("LSP error: {0}")]
    Other(String),
}

/// Result type for LSP operations
pub type LSPResult<T> = Result<T, LSPError>;

impl LSPError {
    /// Create a spawn error
    pub fn spawn_error(language: impl Into<String>, source: std::io::Error) -> Self {
        Self::SpawnError {
            language: language.into(),
            source,
        }
    }

    /// Create an initialization error
    pub fn initialization_error(
        language: impl Into<String>,
        message: impl Into<String>,
    ) -> Self {
        Self::InitializationError {
            language: language.into(),
            message: message.into(),
        }
    }

    /// Create a server crashed error
    pub fn server_crashed(language: impl Into<String>, exit_code: i32) -> Self {
        Self::ServerCrashed {
            language: language.into(),
            exit_code,
        }
    }

    /// Create a max restarts exceeded error
    pub fn max_restarts_exceeded(language: impl Into<String>, max_attempts: u32) -> Self {
        Self::MaxRestartsExceeded {
            language: language.into(),
            max_attempts,
        }
    }

    /// Create a communication error
    pub fn communication_error(
        language: impl Into<String>,
        message: impl Into<String>,
    ) -> Self {
        Self::CommunicationError {
            language: language.into(),
            message: message.into(),
        }
    }

    /// Create a configuration error
    pub fn configuration_error(
        language: impl Into<String>,
        message: impl Into<String>,
    ) -> Self {
        Self::ConfigurationError {
            language: language.into(),
            message: message.into(),
        }
    }

    /// Create an executable not found error
    pub fn executable_not_found(language: impl Into<String>, path: impl Into<String>) -> Self {
        Self::ExecutableNotFound {
            language: language.into(),
            path: path.into(),
        }
    }

    /// Create a permission denied error
    pub fn permission_denied(language: impl Into<String>, path: impl Into<String>) -> Self {
        Self::PermissionDenied {
            language: language.into(),
            path: path.into(),
        }
    }

    /// Create a timeout error
    pub fn timeout(language: impl Into<String>, timeout_ms: u64) -> Self {
        Self::Timeout {
            language: language.into(),
            timeout_ms,
        }
    }

    /// Get user-facing error message with actionable remediation
    pub fn user_message(&self) -> String {
        match self {
            Self::SpawnError { language, .. } => {
                format!(
                    "Failed to start {} language server. Please ensure the server is installed and in your PATH.",
                    language
                )
            }
            Self::InitializationError { language, message } => {
                format!(
                    "Failed to initialize {} language server: {}. Check your project configuration.",
                    language, message
                )
            }
            Self::ServerCrashed { language, .. } => {
                format!(
                    "{} language server crashed. It will be restarted automatically.",
                    language
                )
            }
            Self::MaxRestartsExceeded { language, .. } => {
                format!(
                    "{} language server has crashed too many times. Please check the logs and restart Symphony.",
                    language
                )
            }
            Self::ExecutableNotFound { language, path } => {
                format!(
                    "{} language server not found at '{}'. Please install the server or configure the correct path in settings.",
                    language, path
                )
            }
            Self::PermissionDenied { language, path } => {
                format!(
                    "Permission denied for {} language server at '{}'. Please check file permissions.",
                    language, path
                )
            }
            Self::Timeout { language, timeout_ms } => {
                format!(
                    "{} language server operation timed out after {}ms. The server may be unresponsive.",
                    language, timeout_ms
                )
            }
            _ => self.to_string(),
        }
    }
}
