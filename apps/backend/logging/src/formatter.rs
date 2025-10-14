use serde::Serialize;
use chrono::Utc;

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
