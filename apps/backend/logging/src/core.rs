//! Core logging functionality
//!
//! Provides the foundational logging infrastructure including context management,
//! correlation IDs, and enhanced log levels.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fmt;
use tracing::{debug, error, info, trace, warn};
use uuid::Uuid;

// ============================================================================
// Log Levels
// ============================================================================

/// Extended log levels for professional logging
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize, Default)]
pub enum LogLevel {
    /// Trace-level messages for very detailed debugging
    Trace,
    /// Debug-level messages for debugging
    Debug,
    /// Informational messages
    #[default]
    Info,
    /// Warning messages
    Warn,
    /// Error messages
    Error,
    /// Fatal errors that require immediate attention
    Fatal,
}

impl LogLevel {
    /// Convert to tracing::Level
    pub fn to_tracing_level(&self) -> tracing::Level {
        match self {
            LogLevel::Trace => tracing::Level::TRACE,
            LogLevel::Debug => tracing::Level::DEBUG,
            LogLevel::Info => tracing::Level::INFO,
            LogLevel::Warn => tracing::Level::WARN,
            LogLevel::Error => tracing::Level::ERROR,
            LogLevel::Fatal => tracing::Level::ERROR,
        }
    }

    /// Parse log level from string
    #[allow(clippy::should_implement_trait)]
    pub fn from_str(s: &str) -> Result<Self, String> {
        match s.to_lowercase().as_str() {
            "trace" => Ok(LogLevel::Trace),
            "debug" => Ok(LogLevel::Debug),
            "info" => Ok(LogLevel::Info),
            "warn" | "warning" => Ok(LogLevel::Warn),
            "error" => Ok(LogLevel::Error),
            "fatal" => Ok(LogLevel::Fatal),
            _ => Err(format!("Invalid log level: {}", s)),
        }
    }

    /// Get string representation
    pub fn as_str(&self) -> &'static str {
        match self {
            LogLevel::Trace => "TRACE",
            LogLevel::Debug => "DEBUG",
            LogLevel::Info => "INFO",
            LogLevel::Warn => "WARN",
            LogLevel::Error => "ERROR",
            LogLevel::Fatal => "FATAL",
        }
    }
}

impl fmt::Display for LogLevel {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

// ============================================================================
// Log Context
// ============================================================================

/// Logging context with correlation and enrichment data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogContext {
    /// Correlation ID for request tracing
    pub correlation_id: String,
    /// Request ID (optional, for HTTP requests)
    pub request_id: Option<String>,
    /// User ID (optional)
    pub user_id: Option<String>,
    /// Session ID (optional)
    pub session_id: Option<String>,
    /// Operation name (optional)
    pub operation: Option<String>,
    /// Additional custom fields
    pub custom_fields: HashMap<String, String>,
}

impl LogContext {
    /// Create a new context with a generated correlation ID
    pub fn new() -> Self {
        Self {
            correlation_id: Uuid::new_v4().to_string(),
            request_id: None,
            user_id: None,
            session_id: None,
            operation: None,
            custom_fields: HashMap::new(),
        }
    }

    /// Create a context with a specific correlation ID
    pub fn with_correlation_id(correlation_id: String) -> Self {
        Self {
            correlation_id,
            request_id: None,
            user_id: None,
            session_id: None,
            operation: None,
            custom_fields: HashMap::new(),
        }
    }

    /// Set request ID
    pub fn with_request_id(mut self, request_id: String) -> Self {
        self.request_id = Some(request_id);
        self
    }

    /// Set user ID
    pub fn with_user_id(mut self, user_id: String) -> Self {
        self.user_id = Some(user_id);
        self
    }

    /// Set session ID
    pub fn with_session_id(mut self, session_id: String) -> Self {
        self.session_id = Some(session_id);
        self
    }

    /// Set operation name
    pub fn with_operation(mut self, operation: String) -> Self {
        self.operation = Some(operation);
        self
    }

    /// Add a custom field
    pub fn with_field(mut self, key: String, value: String) -> Self {
        self.custom_fields.insert(key, value);
        self
    }

    /// Add multiple custom fields
    pub fn with_fields(mut self, fields: HashMap<String, String>) -> Self {
        self.custom_fields.extend(fields);
        self
    }
}

impl Default for LogContext {
    fn default() -> Self {
        Self::new()
    }
}

/// Builder for LogContext
pub struct ContextBuilder {
    context: LogContext,
}

impl ContextBuilder {
    /// Create a new builder
    pub fn new() -> Self {
        Self {
            context: LogContext::new(),
        }
    }

    /// Create a builder with a specific correlation ID
    pub fn with_correlation_id(correlation_id: String) -> Self {
        Self {
            context: LogContext::with_correlation_id(correlation_id),
        }
    }

    /// Set request ID
    pub fn request_id(mut self, request_id: String) -> Self {
        self.context.request_id = Some(request_id);
        self
    }

    /// Set user ID
    pub fn user_id(mut self, user_id: String) -> Self {
        self.context.user_id = Some(user_id);
        self
    }

    /// Set session ID
    pub fn session_id(mut self, session_id: String) -> Self {
        self.context.session_id = Some(session_id);
        self
    }

    /// Set operation name
    pub fn operation(mut self, operation: String) -> Self {
        self.context.operation = Some(operation);
        self
    }

    /// Add a custom field
    pub fn field(mut self, key: String, value: String) -> Self {
        self.context.custom_fields.insert(key, value);
        self
    }

    /// Build the context
    pub fn build(self) -> LogContext {
        self.context
    }
}

impl Default for ContextBuilder {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Logger
// ============================================================================

/// Enhanced logger with context awareness
pub struct Logger {
    context: Option<LogContext>,
}

impl Logger {
    /// Create a new logger without context
    pub fn new() -> Self {
        Self { context: None }
    }

    /// Create a logger with context
    pub fn with_context(context: LogContext) -> Self {
        Self {
            context: Some(context),
        }
    }

    /// Log a message at the specified level
    pub fn log(&self, level: LogLevel, message: &str) {
        if let Some(ctx) = &self.context {
            self.log_with_context(level, message, ctx);
        } else {
            self.log_without_context(level, message);
        }
    }

    /// Log with context enrichment
    fn log_with_context(&self, level: LogLevel, message: &str, ctx: &LogContext) {
        match level {
            LogLevel::Trace => {
                trace!(
                    correlation_id = %ctx.correlation_id,
                    request_id = ?ctx.request_id,
                    user_id = ?ctx.user_id,
                    session_id = ?ctx.session_id,
                    operation = ?ctx.operation,
                    "{}",
                    message
                );
            }
            LogLevel::Debug => {
                debug!(
                    correlation_id = %ctx.correlation_id,
                    request_id = ?ctx.request_id,
                    user_id = ?ctx.user_id,
                    session_id = ?ctx.session_id,
                    operation = ?ctx.operation,
                    "{}",
                    message
                );
            }
            LogLevel::Info => {
                info!(
                    correlation_id = %ctx.correlation_id,
                    request_id = ?ctx.request_id,
                    user_id = ?ctx.user_id,
                    session_id = ?ctx.session_id,
                    operation = ?ctx.operation,
                    "{}",
                    message
                );
            }
            LogLevel::Warn => {
                warn!(
                    correlation_id = %ctx.correlation_id,
                    request_id = ?ctx.request_id,
                    user_id = ?ctx.user_id,
                    session_id = ?ctx.session_id,
                    operation = ?ctx.operation,
                    "{}",
                    message
                );
            }
            LogLevel::Error => {
                error!(
                    correlation_id = %ctx.correlation_id,
                    request_id = ?ctx.request_id,
                    user_id = ?ctx.user_id,
                    session_id = ?ctx.session_id,
                    operation = ?ctx.operation,
                    "{}",
                    message
                );
            }
            LogLevel::Fatal => {
                error!(
                    level = "FATAL",
                    correlation_id = %ctx.correlation_id,
                    request_id = ?ctx.request_id,
                    user_id = ?ctx.user_id,
                    session_id = ?ctx.session_id,
                    operation = ?ctx.operation,
                    "💀 FATAL: {}",
                    message
                );
            }
        }
    }

    /// Log without context
    fn log_without_context(&self, level: LogLevel, message: &str) {
        match level {
            LogLevel::Trace => trace!("{}", message),
            LogLevel::Debug => debug!("{}", message),
            LogLevel::Info => info!("{}", message),
            LogLevel::Warn => warn!("{}", message),
            LogLevel::Error => error!("{}", message),
            LogLevel::Fatal => error!("💀 FATAL: {}", message),
        }
    }

    /// Convenience methods for each log level
    pub fn trace(&self, message: &str) {
        self.log(LogLevel::Trace, message);
    }

    pub fn debug(&self, message: &str) {
        self.log(LogLevel::Debug, message);
    }

    pub fn info(&self, message: &str) {
        self.log(LogLevel::Info, message);
    }

    pub fn warn(&self, message: &str) {
        self.log(LogLevel::Warn, message);
    }

    pub fn error(&self, message: &str) {
        self.log(LogLevel::Error, message);
    }

    pub fn fatal(&self, message: &str) {
        self.log(LogLevel::Fatal, message);
    }
}

impl Default for Logger {
    fn default() -> Self {
        Self::new()
    }
}
