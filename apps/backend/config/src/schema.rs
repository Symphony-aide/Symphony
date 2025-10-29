//! Configuration schema validation

use serde_json::Value;
use sytypes::{SymphonyError, SymphonyResult};

/// Configuration schema validator
pub struct ConfigSchema;

impl ConfigSchema {
    /// Validate configuration against schema
    pub fn validate(config: &Value, schema: &Value) -> SymphonyResult<()> {
        // Basic validation - can be extended with jsonschema crate
        if !Self::validate_type(config, schema) {
            return Err(SymphonyError::Config("Type mismatch".to_string()));
        }

        Ok(())
    }

    fn validate_type(value: &Value, schema: &Value) -> bool {
        // Simple type checking
        match (value, schema.get("type").and_then(|t| t.as_str())) {
            (Value::String(_), Some("string")) => true,
            (Value::Number(_), Some("number")) => true,
            (Value::Bool(_), Some("boolean")) => true,
            (Value::Array(_), Some("array")) => true,
            (Value::Object(_), Some("object")) => true,
            (Value::Null, Some("null")) => true,
            (_, None) => true, // No type specified
            _ => false,
        }
    }

    /// Generate default schema for Symphony configuration
    pub fn default_schema() -> Value {
        serde_json::json!({
            "type": "object",
            "properties": {
                "core": {
                    "type": "object",
                    "properties": {
                        "log_level": { "type": "string" },
                        "data_dir": { "type": "string" },
                        "cache_dir": { "type": "string" },
                        "max_concurrent_tasks": { "type": "number" }
                    }
                },
                "extensions": {
                    "type": "object",
                    "properties": {
                        "extensions_dir": { "type": "string" },
                        "auto_update": { "type": "boolean" },
                        "marketplace_url": { "type": "string" }
                    }
                },
                "aide": {
                    "type": "object",
                    "properties": {
                        "enabled": { "type": "boolean" },
                        "model_cache_dir": { "type": "string" },
                        "max_models_in_memory": { "type": "number" },
                        "artifact_retention_days": { "type": "number" }
                    }
                },
                "ide": {
                    "type": "object",
                    "properties": {
                        "font_family": { "type": "string" },
                        "font_size": { "type": "number" },
                        "tab_size": { "type": "number" },
                        "line_numbers": { "type": "boolean" },
                        "theme": { "type": "string" }
                    }
                },
                "ipc": {
                    "type": "object",
                    "properties": {
                        "transport": { "type": "string" },
                        "format": { "type": "string" },
                        "max_message_size": { "type": "number" },
                        "connection_timeout": { "type": "number" }
                    }
                }
            }
        })
    }
}
