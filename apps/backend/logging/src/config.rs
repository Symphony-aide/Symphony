use std::env;

#[derive(Debug)]
pub struct LogConfig {
    pub level: String,
    pub format: String,
    pub file: Option<String>,
}

impl LogConfig {
    pub fn from_env() -> Self {
        Self {
            level: env::var("SYMPHONY_LOG_LEVEL").unwrap_or_else(|_| "info".to_string()),
            format: env::var("SYMPHONY_LOG_FORMAT").unwrap_or_else(|_| "console".to_string()),
            file: env::var("SYMPHONY_LOG_FILE").ok(),
        }
    }
}
