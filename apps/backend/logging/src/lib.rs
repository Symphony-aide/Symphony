//! Symphony Logging System
//! 
//! Provides structured logging capabilities for Symphony using the tracing ecosystem.

use std::env;
use std::panic;
use std::path::Path;
use serde::Serialize;
use chrono::Utc;
use tracing::error;
use tracing_subscriber::{fmt, EnvFilter, layer::SubscriberExt, util::SubscriberInitExt};
use tracing_appender::non_blocking::WorkerGuard;

// ============================================================================
// Configuration
// ============================================================================

#[derive(Debug)]
pub struct LogConfig {
    pub level: String,
    pub format: String,
    pub file: Option<String>,
}

impl LogConfig {
    pub fn from_env() -> Self {
        // Try to load .env file (ignore if it doesn't exist)
        let _ = dotenvy::dotenv();
        
        Self {
            level: env::var("SYMPHONY_LOG_LEVEL").unwrap_or_else(|_| "info".to_string()),
            format: env::var("SYMPHONY_LOG_FORMAT").unwrap_or_else(|_| "console".to_string()),
            file: env::var("SYMPHONY_LOG_FILE").ok(),
        }
    }
}

// ============================================================================
// Formatter
// ============================================================================

#[derive(Serialize)]
pub struct LogEntry<'a> {
    pub timestamp: String,
    pub level: &'a str,
    pub message: &'a str,
    pub component: &'a str,
    pub request_id: Option<&'a str>,
    pub user_id: Option<&'a str>,
}

impl<'a> LogEntry<'a> {
    pub fn new(level: &'a str, message: &'a str, component: &'a str) -> Self {
        Self {
            timestamp: Utc::now().to_rfc3339(),
            level,
            message,
            component,
            request_id: None,
            user_id: None,
        }
    }
}

// ============================================================================
// Panic Handler
// ============================================================================

pub fn set_panic_hook() {
    panic::set_hook(Box::new(|info| {
        let location = info.location()
            .map(|l| format!("{}:{}", l.file(), l.line()))
            .unwrap_or_else(|| "unknown location".to_string());
        
        let msg = if let Some(s) = info.payload().downcast_ref::<&str>() {
            s.to_string()
        } else if let Some(s) = info.payload().downcast_ref::<String>() {
            s.clone()
        } else {
            "unknown panic message".to_string()
        };
        
        error!("💥 PANIC at {} => {}", location, msg);
    }));
}

// ============================================================================
// Logger Initialization
// ============================================================================

/// Initialize the logging system with async non-blocking writes
/// 
/// Returns a WorkerGuard that must be kept alive for the duration of the program
/// to ensure all logs are flushed before shutdown.
pub fn init_logging(cfg: &LogConfig) -> Option<WorkerGuard> {
    let env_filter = EnvFilter::new(&cfg.level);
    set_panic_hook();

    let guard = match (cfg.format.as_str(), &cfg.file) {
        // JSON format with async file output (non-blocking)
        ("json", Some(file_path)) => {
            match setup_async_file_logging(file_path, env_filter.clone()) {
                Ok(guard) => Some(guard),
                Err(e) => {
                    // Graceful degradation: fall back to console logging
                    eprintln!("⚠️  Failed to setup file logging: {}. Falling back to console.", e);
                    setup_console_logging(env_filter);
                    None
                }
            }
        }
        // Console format (colored, pretty)
        _ => {
            setup_console_logging(env_filter);
            None
        }
    };

    tracing::info!("Logging system initialized (async non-blocking)");
    guard
}

/// Setup async non-blocking file logging
fn setup_async_file_logging(file_path: &str, env_filter: EnvFilter) -> Result<WorkerGuard, String> {
    let path = Path::new(file_path);
    
    // Extract directory and filename
    let directory = path.parent()
        .ok_or_else(|| "Invalid file path".to_string())?;
    let filename = path.file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| "Invalid filename".to_string())?;
    
    // Create non-blocking appender
    let file_appender = tracing_appender::rolling::never(directory, filename);
    let (non_blocking, guard) = tracing_appender::non_blocking(file_appender);
    
    // Initialize with JSON formatter
    tracing_subscriber::registry()
        .with(env_filter)
        .with(
            fmt::layer()
                .json()
                .with_current_span(false)
                .with_writer(non_blocking)
        )
        .init();
    
    Ok(guard)
}

/// Setup console logging with colored output
fn setup_console_logging(env_filter: EnvFilter) {
    fmt()
        .with_env_filter(env_filter)
        .pretty()
        .with_target(false)
        .init();
}
