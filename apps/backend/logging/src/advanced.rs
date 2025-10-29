//! Advanced features: sampling, processors, filtering

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;

// ============================================================================
// Log Sampling
// ============================================================================

/// Sampling strategy
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SamplingStrategy {
    /// No sampling (log everything)
    None,

    /// Sample every Nth log
    Rate(u64),

    /// Sample based on percentage (0-100)
    Percentage(f64),

    /// Adaptive sampling based on volume
    Adaptive { target_rate: u64, window_secs: u64 },

    /// Sample by log level
    ByLevel {
        trace_rate: u64,
        debug_rate: u64,
        info_rate: u64,
        warn_rate: u64,
        error_rate: u64,
    },
}

/// Log sampler
pub struct LogSampler {
    /// Sampling strategy
    strategy: SamplingStrategy,

    /// Counter for rate-based sampling
    counter: Arc<AtomicU64>,

    /// Logs in current window (for adaptive)
    window_count: Arc<AtomicU64>,
}

impl LogSampler {
    /// Create a new log sampler
    pub fn new(strategy: SamplingStrategy) -> Self {
        Self {
            strategy,
            counter: Arc::new(AtomicU64::new(0)),
            window_count: Arc::new(AtomicU64::new(0)),
        }
    }

    /// Check if log should be sampled (kept)
    pub fn should_sample(&self, level: &str) -> bool {
        match &self.strategy {
            SamplingStrategy::None => true,

            SamplingStrategy::Rate(n) => {
                let count = self.counter.fetch_add(1, Ordering::Relaxed);
                count.is_multiple_of(*n)
            }

            SamplingStrategy::Percentage(pct) => {
                use std::collections::hash_map::RandomState;
                use std::hash::BuildHasher;

                let hash =
                    RandomState::new().hash_one(self.counter.fetch_add(1, Ordering::Relaxed));

                (hash % 100) < (*pct as u64)
            }

            SamplingStrategy::Adaptive { target_rate, .. } => {
                let count = self.window_count.fetch_add(1, Ordering::Relaxed);
                count < *target_rate
            }

            SamplingStrategy::ByLevel {
                trace_rate,
                debug_rate,
                info_rate,
                warn_rate,
                error_rate,
            } => {
                let rate = match level.to_lowercase().as_str() {
                    "trace" => *trace_rate,
                    "debug" => *debug_rate,
                    "info" => *info_rate,
                    "warn" => *warn_rate,
                    "error" => *error_rate,
                    _ => 1,
                };

                if rate == 0 {
                    return false;
                }

                let count = self.counter.fetch_add(1, Ordering::Relaxed);
                count.is_multiple_of(rate)
            }
        }
    }

    /// Reset window (for adaptive sampling)
    pub fn reset_window(&self) {
        self.window_count.store(0, Ordering::Relaxed);
    }

    /// Get current count
    pub fn get_count(&self) -> u64 {
        self.counter.load(Ordering::Relaxed)
    }
}

// ============================================================================
// Log Processors
// ============================================================================

/// Log processor trait
pub trait LogProcessor: Send + Sync {
    /// Process a log entry
    fn process(&self, entry: &mut LogEntry) -> Result<(), String>;

    /// Get processor name
    fn name(&self) -> &'static str;
}

/// Log entry for processing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    pub timestamp: String,
    pub level: String,
    pub message: String,
    pub fields: HashMap<String, String>,
}

impl LogEntry {
    /// Create a new log entry
    pub fn new(level: String, message: String) -> Self {
        Self {
            timestamp: chrono::Utc::now().to_rfc3339(),
            level,
            message,
            fields: HashMap::new(),
        }
    }

    /// Add field
    pub fn with_field(mut self, key: String, value: String) -> Self {
        self.fields.insert(key, value);
        self
    }
}

// ============================================================================
// Built-in Processors
// ============================================================================

/// Field enrichment processor
pub struct EnrichmentProcessor {
    /// Fields to add
    fields: HashMap<String, String>,
}

impl EnrichmentProcessor {
    /// Create a new enrichment processor
    pub fn new(fields: HashMap<String, String>) -> Self {
        Self { fields }
    }
}

impl LogProcessor for EnrichmentProcessor {
    fn process(&self, entry: &mut LogEntry) -> Result<(), String> {
        for (key, value) in &self.fields {
            entry.fields.insert(key.clone(), value.clone());
        }
        Ok(())
    }

    fn name(&self) -> &'static str {
        "enrichment"
    }
}

/// Field filtering processor
pub struct FilterProcessor {
    /// Fields to keep (if Some) or remove (if None)
    keep_fields: Option<Vec<String>>,
    remove_fields: Option<Vec<String>>,
}

impl FilterProcessor {
    /// Create a processor that keeps only specified fields
    pub fn keep_only(fields: Vec<String>) -> Self {
        Self {
            keep_fields: Some(fields),
            remove_fields: None,
        }
    }

    /// Create a processor that removes specified fields
    pub fn remove(fields: Vec<String>) -> Self {
        Self {
            keep_fields: None,
            remove_fields: Some(fields),
        }
    }
}

impl LogProcessor for FilterProcessor {
    fn process(&self, entry: &mut LogEntry) -> Result<(), String> {
        if let Some(keep) = &self.keep_fields {
            entry.fields.retain(|k, _| keep.contains(k));
        }

        if let Some(remove) = &self.remove_fields {
            for field in remove {
                entry.fields.remove(field);
            }
        }

        Ok(())
    }

    fn name(&self) -> &'static str {
        "filter"
    }
}

/// Message transformation processor
pub struct TransformProcessor {
    /// Transformation function name
    transform_type: TransformType,
}

#[derive(Debug, Clone)]
pub enum TransformType {
    Uppercase,
    Lowercase,
    Trim,
    Truncate(usize),
}

impl TransformProcessor {
    /// Create a new transform processor
    pub fn new(transform_type: TransformType) -> Self {
        Self { transform_type }
    }
}

impl LogProcessor for TransformProcessor {
    fn process(&self, entry: &mut LogEntry) -> Result<(), String> {
        match &self.transform_type {
            TransformType::Uppercase => {
                entry.message = entry.message.to_uppercase();
            }
            TransformType::Lowercase => {
                entry.message = entry.message.to_lowercase();
            }
            TransformType::Trim => {
                entry.message = entry.message.trim().to_string();
            }
            TransformType::Truncate(len) => {
                if entry.message.len() > *len {
                    entry.message.truncate(*len);
                    entry.message.push_str("...");
                }
            }
        }
        Ok(())
    }

    fn name(&self) -> &'static str {
        "transform"
    }
}

// ============================================================================
// Processor Pipeline
// ============================================================================

/// Processor pipeline
pub struct ProcessorPipeline {
    /// Processors in order
    processors: Vec<Box<dyn LogProcessor>>,
}

impl ProcessorPipeline {
    /// Create a new pipeline
    pub fn new() -> Self {
        Self {
            processors: Vec::new(),
        }
    }

    /// Add a processor
    pub fn add_processor<P: LogProcessor + 'static>(mut self, processor: P) -> Self {
        self.processors.push(Box::new(processor));
        self
    }

    /// Process a log entry through the pipeline
    pub fn process(&self, entry: &mut LogEntry) -> Result<(), String> {
        for processor in &self.processors {
            processor.process(entry)?;
        }
        Ok(())
    }

    /// Get processor count
    pub fn len(&self) -> usize {
        self.processors.len()
    }

    /// Check if pipeline is empty
    pub fn is_empty(&self) -> bool {
        self.processors.is_empty()
    }
}

impl Default for ProcessorPipeline {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Conditional Logging
// ============================================================================

/// Conditional logger
pub struct ConditionalLogger {
    /// Conditions
    conditions: Vec<LogCondition>,
}

/// Log condition
pub struct LogCondition {
    /// Field to check
    pub field: String,

    /// Operator
    pub operator: ConditionOperator,

    /// Value to compare
    pub value: String,
}

#[derive(Debug, Clone)]
pub enum ConditionOperator {
    Equals,
    NotEquals,
    Contains,
    StartsWith,
    EndsWith,
    GreaterThan,
    LessThan,
}

impl ConditionalLogger {
    /// Create a new conditional logger
    pub fn new() -> Self {
        Self {
            conditions: Vec::new(),
        }
    }

    /// Add a condition
    pub fn add_condition(mut self, condition: LogCondition) -> Self {
        self.conditions.push(condition);
        self
    }

    /// Check if log should be logged based on conditions
    pub fn should_log(&self, entry: &LogEntry) -> bool {
        if self.conditions.is_empty() {
            return true;
        }

        for condition in &self.conditions {
            if !self.check_condition(condition, entry) {
                return false;
            }
        }

        true
    }

    /// Check a single condition
    fn check_condition(&self, condition: &LogCondition, entry: &LogEntry) -> bool {
        let field_value = entry.fields.get(&condition.field);

        if field_value.is_none() {
            return false;
        }

        let field_value = field_value.unwrap();

        match &condition.operator {
            ConditionOperator::Equals => field_value == &condition.value,
            ConditionOperator::NotEquals => field_value != &condition.value,
            ConditionOperator::Contains => field_value.contains(&condition.value),
            ConditionOperator::StartsWith => field_value.starts_with(&condition.value),
            ConditionOperator::EndsWith => field_value.ends_with(&condition.value),
            ConditionOperator::GreaterThan => {
                if let (Ok(fv), Ok(cv)) =
                    (field_value.parse::<f64>(), condition.value.parse::<f64>())
                {
                    fv > cv
                } else {
                    false
                }
            }
            ConditionOperator::LessThan => {
                if let (Ok(fv), Ok(cv)) =
                    (field_value.parse::<f64>(), condition.value.parse::<f64>())
                {
                    fv < cv
                } else {
                    false
                }
            }
        }
    }
}

impl Default for ConditionalLogger {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rate_sampling() {
        let sampler = LogSampler::new(SamplingStrategy::Rate(2));

        assert!(sampler.should_sample("info")); // 0 % 2 == 0
        assert!(!sampler.should_sample("info")); // 1 % 2 != 0
        assert!(sampler.should_sample("info")); // 2 % 2 == 0
    }

    #[test]
    fn test_enrichment_processor() {
        let mut fields = HashMap::new();
        fields.insert("env".to_string(), "production".to_string());

        let processor = EnrichmentProcessor::new(fields);
        let mut entry = LogEntry::new("info".to_string(), "test".to_string());

        processor.process(&mut entry).ok();

        assert_eq!(entry.fields.get("env"), Some(&"production".to_string()));
    }

    #[test]
    fn test_processor_pipeline() {
        let mut fields = HashMap::new();
        fields.insert("app".to_string(), "symphony".to_string());

        let pipeline = ProcessorPipeline::new()
            .add_processor(EnrichmentProcessor::new(fields))
            .add_processor(TransformProcessor::new(TransformType::Uppercase));

        let mut entry = LogEntry::new("info".to_string(), "test message".to_string());
        pipeline.process(&mut entry).ok();

        assert_eq!(entry.message, "TEST MESSAGE");
        assert!(entry.fields.contains_key("app"));
    }
}
