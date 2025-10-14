use crate::config::LogConfig;
use crate::panic_handler::set_panic_hook;
use tracing_subscriber::{fmt, EnvFilter};
use std::fs::OpenOptions;

pub fn init_logging(cfg: &LogConfig) {
    let env_filter = EnvFilter::new(&cfg.level);
    set_panic_hook();

    match (cfg.format.as_str(), &cfg.file) {
        // JSON format with file output
        ("json", Some(file_path)) => {
            let file = OpenOptions::new()
                .create(true)
                .append(true)
                .open(file_path)
                .expect("Failed to open log file");
            
            fmt()
                .with_env_filter(env_filter)
                .json()
                .with_current_span(false)
                .with_writer(file)
                .init();
        }
        // Console format (colored, pretty)
        _ => {
            fmt()
                .with_env_filter(env_filter)
                .pretty()
                .with_target(false)
                .init();
        }
    }

    tracing::info!("✅ Logging system initialized");
}
