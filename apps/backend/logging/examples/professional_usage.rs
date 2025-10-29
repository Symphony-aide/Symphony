//! Professional usage with all features

use std::time::Duration;
use sylogging::{
    init_logging_with_config, load_config, ContextBuilder, HealthMonitor, Logger,
    PerformanceTracker, SlaMonitor,
};

fn main() {
    // Load configuration from file
    let config =
        load_config(Some("logging.toml")).unwrap_or_else(|_| sylogging::LoggingConfig::from_env());

    // Initialize logging
    let _guard = init_logging_with_config(&config).expect("Failed to initialize logging");

    // Create context with correlation ID
    let context = ContextBuilder::new()
        .user_id("user123".to_string())
        .operation("process_request".to_string())
        .field("service".to_string(), "api".to_string())
        .build();

    // Use logger with context
    let logger = Logger::with_context(context);
    logger.info("Processing request with context");
    logger.warn("Low memory warning");
    logger.error("Failed to connect to database");
    logger.fatal("Critical system failure");

    // Performance tracking
    let perf_tracker = PerformanceTracker::new();
    perf_tracker.record_message(Duration::from_micros(100));
    let metrics = perf_tracker.get_metrics();
    println!("Performance: {:?}", metrics);

    // Health monitoring
    let health_monitor = HealthMonitor::new();
    let health = health_monitor.check_health();
    println!("Health: {:?}", health);

    // SLA monitoring
    let sla_monitor = SlaMonitor::new();
    sla_monitor.record_success(Duration::from_millis(50));
    let sla_metrics = sla_monitor.get_metrics();
    println!("SLA: {:?}", sla_metrics);
}
