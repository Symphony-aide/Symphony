//! Symphony Logging System
//! 
//! Provides structured logging capabilities for Symphony using the tracing ecosystem.

use tracing::{info, warn, error, debug, trace};
use tracing_subscriber::EnvFilter;

/// Initialize the logging system with default configuration
pub fn init() {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();
}

/// Initialize the logging system with custom configuration
pub fn init_with_level(level: &str) {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::new(level))
        .init();
}

/// Log an info message
pub fn log_info(message: &str) {
    info!("{}", message);
}

/// Log a warning message
pub fn log_warn(message: &str) {
    warn!("{}", message);
}

/// Log an error message
pub fn log_error(message: &str) {
    error!("{}", message);
}

/// Log a debug message
pub fn log_debug(message: &str) {
    debug!("{}", message);
}

/// Log a trace message
pub fn log_trace(message: &str) {
    trace!("{}", message);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_logging_functions() {
        // These won't output during tests unless RUST_LOG is set
        log_info("Test info message");
        log_warn("Test warning message");
        log_error("Test error message");
        log_debug("Test debug message");
        log_trace("Test trace message");
    }
}
