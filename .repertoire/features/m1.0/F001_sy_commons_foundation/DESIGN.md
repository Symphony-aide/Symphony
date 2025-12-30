# Feature Design: F001 - sy-commons Foundation

**Feature ID**: F001  
**Feature Name**: sy_commons_foundation  
**Design Date**: December 28, 2025  
**Design Status**: [ ] Not Started

---

## 🏗️ System Architecture

### Crate Structure Overview
```
apps/backend/crates/utils/sy-commons/
├── Cargo.toml                    # Dependencies and metadata
├── README.md                     # Usage guide and examples
├── src/
│   ├── lib.rs                   # Public API and re-exports
│   ├── error.rs                 # SymphonyError base error type
│   ├── logging.rs               # Professional logging system
│   ├── config.rs                # Environment configuration
│   ├── filesystem.rs            # Safe filesystem utilities
│   ├── prevalidation.rs         # Pre-validation rule helpers
│   └── debug.rs                 # Duck debugging utilities
├── tests/
│   ├── integration_tests.rs     # Cross-component integration tests
│   └── config_files/            # Test configuration files
│       ├── default.toml
│       ├── test.toml
│       └── production.toml
└── benches/
    └── prevalidation_bench.rs   # Performance benchmarks
```

### Module Dependency Graph
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              sy-commons Crate                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                            lib.rs (Public API)                          │ │
│  │                                                                         │ │
│  │  • Re-exports all public APIs                                           │ │
│  │  • Comprehensive documentation                                          │ │
│  │  • Usage examples and guides                                            │ │
│  │  • Module organization                                                  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    │ (re-exports)                            │
│                                    ▼                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────┐ │
│  │   error.rs      │  │   logging.rs    │  │   config.rs     │  │ debug.rs│ │
│  │                 │  │                 │  │                 │  │         │ │
│  │ SymphonyError   │  │ LoggingConfig   │  │ Config trait    │  │ duck!() │ │
│  │ ResultContext   │  │ init_logging()  │  │ load_config()   │  │ macro   │ │
│  │ Error variants  │  │ Formatters      │  │ TOML parsing    │  │         │ │
│  └─────────┬───────┘  └─────────┬───────┘  └─────────┬───────┘  └─────────┘ │
│            │                    │                    │                       │
│            │ (used by)          │ (used by)          │ (used by)             │
│            ▼                    ▼                    ▼                       │
│  ┌─────────────────┐  ┌─────────────────────────────────────────────────────┐ │
│  │ filesystem.rs   │  │              prevalidation.rs                       │ │
│  │                 │  │                                                     │ │
│  │ Safe file ops   │  │ PreValidationRule trait                             │ │
│  │ Directory utils │  │ Common validation rules                             │ │
│  │ Path validation │  │ Rule composition                                    │ │
│  │ Platform dirs   │  │ Performance optimization (<1ms)                     │ │
│  └─────────────────┘  └─────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Module Design

### 1. Error Handling System (error.rs)

#### SymphonyError Enum Design
```rust
/// Base error type for all Symphony crates
#[derive(Debug, thiserror::Error)]
pub enum SymphonyError {
    #[error("Validation error: {message}")]
    Validation { 
        message: String,
        field: Option<String>,
        value: Option<String>,
    },
    
    #[error("IO error: {source}")]
    Io { 
        #[from]
        source: std::io::Error,
        context: Option<String>,
    },
    
    #[error("Serialization error: {message}")]
    Serialization { 
        message: String,
        format: String,
    },
    
    #[error("Configuration error: {message}")]
    Configuration { 
        message: String,
        file: Option<PathBuf>,
    },
    
    #[error("Generic error: {message}")]
    Generic { 
        message: String,
        source: Option<Box<dyn std::error::Error + Send + Sync>>,
    },
}
```

#### ResultContext Trait
```rust
/// Trait for adding context to Results
pub trait ResultContext<T> {
    fn with_context<F>(self, f: F) -> Result<T, SymphonyError>
    where
        F: FnOnce() -> String;
    
    fn with_field_context(self, field: &str, value: &str) -> Result<T, SymphonyError>;
}

impl<T, E> ResultContext<T> for Result<T, E>
where
    E: Into<SymphonyError>,
{
    fn with_context<F>(self, f: F) -> Result<T, SymphonyError>
    where
        F: FnOnce() -> String,
    {
        self.map_err(|e| {
            let mut error = e.into();
            // Add context to error
            error
        })
    }
    
    fn with_field_context(self, field: &str, value: &str) -> Result<T, SymphonyError> {
        self.map_err(|e| match e.into() {
            SymphonyError::Validation { message, .. } => SymphonyError::Validation {
                message,
                field: Some(field.to_string()),
                value: Some(value.to_string()),
            },
            other => other,
        })
    }
}
```

### 2. Logging System (logging.rs)

#### LoggingConfig Structure
```rust
/// Configuration for logging system
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoggingConfig {
    pub level: String,
    pub console: ConsoleConfig,
    pub file: Option<FileConfig>,
    pub json: Option<JsonConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsoleConfig {
    pub enabled: bool,
    pub format: ConsoleFormat,
    pub colors: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileConfig {
    pub enabled: bool,
    pub path: PathBuf,
    pub rotation: RotationConfig,
    pub max_files: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonConfig {
    pub enabled: bool,
    pub path: Option<PathBuf>,
    pub include_spans: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConsoleFormat {
    Pretty,
    Compact,
    Full,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RotationConfig {
    Daily,
    Hourly,
    Size(u64), // bytes
}
```

#### Logging Initialization
```rust
/// Initialize logging system with configuration
pub fn init_logging(config: LoggingConfig) -> Result<(), SymphonyError> {
    use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
    
    let mut layers = Vec::new();
    
    // Console layer
    if config.console.enabled {
        let console_layer = create_console_layer(&config.console)?;
        layers.push(console_layer);
    }
    
    // File layer
    if let Some(file_config) = config.file {
        if file_config.enabled {
            let file_layer = create_file_layer(&file_config)?;
            layers.push(file_layer);
        }
    }
    
    // JSON layer
    if let Some(json_config) = config.json {
        if json_config.enabled {
            let json_layer = create_json_layer(&json_config)?;
            layers.push(json_layer);
        }
    }
    
    tracing_subscriber::registry()
        .with(layers)
        .init();
    
    Ok(())
}

// Re-export tracing macros
pub use tracing::{debug, error, info, trace, warn};
```

### 3. Configuration System (config.rs)

#### Config Trait and Implementation
```rust
use figment::{Figment, providers::{Format, Toml, Env}};

/// Trait for configuration types
pub trait Config: for<'de> Deserialize<'de> + Sized {
    /// Load configuration for the specified environment
    fn load(environment: &str) -> Result<Self, SymphonyError> {
        load_config(environment)
    }
    
    /// Load configuration with custom figment
    fn load_with_figment(figment: Figment) -> Result<Self, SymphonyError> {
        figment.extract().map_err(|e| SymphonyError::Configuration {
            message: format!("Failed to parse configuration: {}", e),
            file: None,
        })
    }
}

/// Load configuration for the specified environment
pub fn load_config<T>(environment: &str) -> Result<T, SymphonyError>
where
    T: for<'de> Deserialize<'de>,
{
    let figment = Figment::new()
        .merge(Toml::file("config/default.toml"))
        .merge(Toml::file(format!("config/{}.toml", environment)))
        .merge(Env::prefixed("SYMPHONY_"));
    
    figment.extract().map_err(|e| SymphonyError::Configuration {
        message: format!("Failed to load {} configuration: {}", environment, e),
        file: Some(PathBuf::from(format!("config/{}.toml", environment))),
    })
}

/// Default configuration structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DefaultConfig {
    pub logging: LoggingConfig,
    pub filesystem: FilesystemConfig,
    pub debug: DebugConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilesystemConfig {
    pub temp_dir: Option<PathBuf>,
    pub max_file_size: u64,
    pub atomic_writes: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DebugConfig {
    pub duck_debugging: bool,
    pub performance_logging: bool,
}
```

### 4. Filesystem Utilities (filesystem.rs)

#### Safe File Operations
```rust
use directories::ProjectDirs;
use tokio::fs;
use std::path::{Path, PathBuf};

/// Safe file reading with error handling
pub async fn read_file<P: AsRef<Path>>(path: P) -> Result<String, SymphonyError> {
    let path = path.as_ref();
    validate_path(path)?;
    
    fs::read_to_string(path)
        .await
        .map_err(|e| SymphonyError::Io {
            source: e,
            context: Some(format!("Failed to read file: {}", path.display())),
        })
}

/// Safe file writing with atomic operations
pub async fn write_file<P: AsRef<Path>>(path: P, content: &str) -> Result<(), SymphonyError> {
    let path = path.as_ref();
    validate_path(path)?;
    
    // Create parent directories if they don't exist
    if let Some(parent) = path.parent() {
        create_dir_all(parent).await?;
    }
    
    // Atomic write using temporary file
    let temp_path = path.with_extension("tmp");
    
    fs::write(&temp_path, content)
        .await
        .map_err(|e| SymphonyError::Io {
            source: e,
            context: Some(format!("Failed to write temp file: {}", temp_path.display())),
        })?;
    
    fs::rename(&temp_path, path)
        .await
        .map_err(|e| SymphonyError::Io {
            source: e,
            context: Some(format!("Failed to rename temp file to: {}", path.display())),
        })?;
    
    Ok(())
}

/// Create directory and all parent directories
pub async fn create_dir_all<P: AsRef<Path>>(path: P) -> Result<(), SymphonyError> {
    let path = path.as_ref();
    validate_path(path)?;
    
    fs::create_dir_all(path)
        .await
        .map_err(|e| SymphonyError::Io {
            source: e,
            context: Some(format!("Failed to create directory: {}", path.display())),
        })
}

/// Check if file exists
pub async fn file_exists<P: AsRef<Path>>(path: P) -> bool {
    path.as_ref().exists()
}

/// Get platform-specific directories
pub fn get_project_dirs() -> Option<ProjectDirs> {
    ProjectDirs::from("com", "Symphony", "Symphony")
}

/// Validate path for security (prevent directory traversal)
fn validate_path<P: AsRef<Path>>(path: P) -> Result<(), SymphonyError> {
    let path = path.as_ref();
    
    // Check for directory traversal attempts
    if path.components().any(|c| matches!(c, std::path::Component::ParentDir)) {
        return Err(SymphonyError::Validation {
            message: "Path contains directory traversal".to_string(),
            field: Some("path".to_string()),
            value: Some(path.display().to_string()),
        });
    }
    
    Ok(())
}
```

### 5. Pre-validation System (prevalidation.rs)

#### PreValidationRule Trait
```rust
/// Trait for pre-validation rules
pub trait PreValidationRule<T> {
    type Error;
    
    /// Validate the value, returning Ok(()) if valid
    fn validate(&self, value: &T) -> Result<(), Self::Error>;
    
    /// Get a description of this rule
    fn description(&self) -> &str;
}

/// Common validation rules
pub struct NonEmptyRule;
pub struct MinLengthRule(pub usize);
pub struct MaxLengthRule(pub usize);
pub struct RegexRule(pub regex::Regex);
pub struct RangeRule<T>(pub T, pub T);

impl PreValidationRule<String> for NonEmptyRule {
    type Error = SymphonyError;
    
    fn validate(&self, value: &String) -> Result<(), Self::Error> {
        if value.is_empty() {
            Err(SymphonyError::Validation {
                message: "Value cannot be empty".to_string(),
                field: None,
                value: Some(value.clone()),
            })
        } else {
            Ok(())
        }
    }
    
    fn description(&self) -> &str {
        "Value must not be empty"
    }
}

impl PreValidationRule<String> for MinLengthRule {
    type Error = SymphonyError;
    
    fn validate(&self, value: &String) -> Result<(), Self::Error> {
        if value.len() < self.0 {
            Err(SymphonyError::Validation {
                message: format!("Value must be at least {} characters", self.0),
                field: None,
                value: Some(value.clone()),
            })
        } else {
            Ok(())
        }
    }
    
    fn description(&self) -> &str {
        "Value must meet minimum length requirement"
    }
}

/// Rule composition for complex validation
pub struct CompositeRule<T> {
    rules: Vec<Box<dyn PreValidationRule<T, Error = SymphonyError>>>,
}

impl<T> CompositeRule<T> {
    pub fn new() -> Self {
        Self { rules: Vec::new() }
    }
    
    pub fn add_rule<R>(mut self, rule: R) -> Self
    where
        R: PreValidationRule<T, Error = SymphonyError> + 'static,
    {
        self.rules.push(Box::new(rule));
        self
    }
}

impl<T> PreValidationRule<T> for CompositeRule<T> {
    type Error = SymphonyError;
    
    fn validate(&self, value: &T) -> Result<(), Self::Error> {
        for rule in &self.rules {
            rule.validate(value)?;
        }
        Ok(())
    }
    
    fn description(&self) -> &str {
        "Composite validation rule"
    }
}

/// Performance-optimized validation helper
pub fn validate_fast<T, R>(value: &T, rule: &R) -> Result<(), SymphonyError>
where
    R: PreValidationRule<T, Error = SymphonyError>,
{
    let start = std::time::Instant::now();
    let result = rule.validate(value);
    let duration = start.elapsed();
    
    // Ensure validation completes in <1ms
    if duration.as_millis() > 1 {
        warn!("Validation took {}ms, exceeding 1ms target", duration.as_millis());
    }
    
    result
}
```

### 6. Duck Debugging System (debug.rs)

#### Duck Debugging Macro
```rust
/// Duck debugging macro for temporary debugging
#[macro_export]
macro_rules! duck {
    ($($arg:tt)*) => {
        #[cfg(debug_assertions)]
        {
            eprintln!("[DUCK DEBUGGING] {}:{} - {}", 
                file!(), 
                line!(), 
                format_args!($($arg)*)
            );
        }
    };
}

/// Duck debugging with values
#[macro_export]
macro_rules! duck_value {
    ($expr:expr) => {
        #[cfg(debug_assertions)]
        {
            let value = &$expr;
            eprintln!("[DUCK DEBUGGING] {}:{} - {} = {:?}", 
                file!(), 
                line!(), 
                stringify!($expr),
                value
            );
            value
        }
        #[cfg(not(debug_assertions))]
        {
            $expr
        }
    };
}

/// Duck debugging utilities
pub struct DuckDebugger {
    enabled: bool,
    prefix: String,
}

impl DuckDebugger {
    pub fn new(enabled: bool) -> Self {
        Self {
            enabled,
            prefix: "[DUCK DEBUGGING]".to_string(),
        }
    }
    
    pub fn log<T: std::fmt::Debug>(&self, message: &str, value: &T) {
        if self.enabled {
            eprintln!("{} {} - {:?}", self.prefix, message, value);
        }
    }
    
    pub fn trace(&self, message: &str) {
        if self.enabled {
            eprintln!("{} {}", self.prefix, message);
        }
    }
}

// Re-export macros
pub use duck;
pub use duck_value;
```

---

## 📊 Data Structures

### Configuration File Schemas

#### default.toml
```toml
[logging]
level = "info"

[logging.console]
enabled = true
format = "pretty"
colors = true

[logging.file]
enabled = false
path = "logs/symphony.log"
max_files = 10

[logging.file.rotation]
type = "daily"

[logging.json]
enabled = false
include_spans = true

[filesystem]
max_file_size = 104857600  # 100MB
atomic_writes = true

[debug]
duck_debugging = true
performance_logging = false
```

#### test.toml
```toml
[logging]
level = "debug"

[logging.console]
enabled = true
format = "compact"
colors = false

[logging.file]
enabled = true
path = "test_logs/symphony_test.log"
max_files = 5

[filesystem]
max_file_size = 10485760  # 10MB
atomic_writes = true

[debug]
duck_debugging = true
performance_logging = true
```

#### production.toml
```toml
[logging]
level = "warn"

[logging.console]
enabled = false

[logging.file]
enabled = true
path = "/var/log/symphony/symphony.log"
max_files = 30

[logging.file.rotation]
type = "daily"

[logging.json]
enabled = true
path = "/var/log/symphony/symphony.json"
include_spans = false

[filesystem]
max_file_size = 1073741824  # 1GB
atomic_writes = true

[debug]
duck_debugging = false
performance_logging = false
```

---

## 🔄 Error Handling Strategy

### Error Flow Diagram
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Error Handling Flow                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│  │  External Error │    │  System Error   │    │  User Error     │        │
│  │  (std::io::Error│    │  (Internal)     │    │  (Validation)   │        │
│  │   serde::Error) │    │                 │    │                 │        │
│  └─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘        │
│            │                      │                      │                  │
│            │ From trait           │ Direct creation      │ Direct creation  │
│            ▼                      ▼                      ▼                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        SymphonyError                                    │ │
│  │                                                                         │ │
│  │  • Validation { message, field, value }                                │ │
│  │  • Io { source, context }                                              │ │
│  │  • Serialization { message, format }                                   │ │
│  │  • Configuration { message, file }                                     │ │
│  │  • Generic { message, source }                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    │ Error propagation                       │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        Error Context                                    │ │
│  │                                                                         │ │
│  │  • ResultContext trait adds context to errors                          │ │
│  │  • Field-specific context for validation errors                        │ │
│  │  • Stack trace preservation                                             │ │
│  │  • Actionable error messages                                            │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Error Categories
1. **Validation Errors**: User input validation failures
2. **IO Errors**: File system and network operation failures
3. **Serialization Errors**: Data format conversion failures
4. **Configuration Errors**: Configuration parsing and validation failures
5. **Generic Errors**: Catch-all for other error types

---

## ⚡ Performance Characteristics

### Performance Targets
| Operation | Target | Measurement |
|-----------|--------|-------------|
| **Pre-validation** | <1ms | Benchmark tests |
| **Error creation** | <0.01ms | Microbenchmarks |
| **Configuration loading** | <10ms | Integration tests |
| **File operations** | <5ms for small files | I/O benchmarks |
| **Logging overhead** | <0.1ms per log | Logging benchmarks |

### Memory Usage
- **Error types**: Minimal heap allocation
- **Configuration**: Cached after first load
- **Logging**: Async to avoid blocking
- **File operations**: Streaming for large files

---

## 🧪 Testing Architecture

### Test Organization
```
src/
├── error.rs              # Unit tests co-located
├── logging.rs            # Unit tests co-located
├── config.rs             # Unit tests co-located
├── filesystem.rs         # Unit tests co-located
├── prevalidation.rs      # Unit tests co-located
└── debug.rs              # Unit tests co-located

tests/
├── integration_tests.rs  # Cross-component tests
└── config_files/         # Test configuration files

benches/
└── prevalidation_bench.rs # Performance benchmarks
```

### Test Categories
1. **Unit Tests**: Test individual functions and methods
2. **Integration Tests**: Test component interactions
3. **Performance Tests**: Validate performance targets
4. **Documentation Tests**: Ensure examples work
5. **Error Path Tests**: Test all error conditions

---

## 🔒 Security Considerations

### Path Traversal Prevention
- Validate all file paths to prevent directory traversal attacks
- Use canonical paths for file operations
- Restrict file operations to allowed directories

### Configuration Security
- Validate all configuration values
- Sanitize sensitive information in logs
- Use secure defaults for all configuration options

### Error Information Disclosure
- Avoid exposing sensitive information in error messages
- Provide actionable error messages without revealing system internals
- Log detailed errors securely while showing safe messages to users

---

## 📋 API Documentation Structure

### lib.rs Public API
```rust
//! # sy-commons: Symphony Common Utilities
//! 
//! This crate provides foundational utilities for all Symphony Rust crates.
//! 
//! ## Features
//! 
//! - **Error Handling**: Standardized error types with context
//! - **Logging**: Professional logging with multiple output formats
//! - **Configuration**: Type-safe configuration management
//! - **Filesystem**: Safe filesystem operations
//! - **Pre-validation**: Performance-optimized validation rules
//! - **Debugging**: Temporary debugging utilities
//! 
//! ## Quick Start
//! 
//! ```rust
//! use sy_commons::{SymphonyError, init_logging, load_config};
//! 
//! // Initialize logging
//! let config = load_config("development")?;
//! init_logging(config.logging)?;
//! 
//! // Use error handling
//! fn my_function() -> Result<String, SymphonyError> {
//!     // Function implementation
//! }
//! ```

// Re-exports
pub use error::{SymphonyError, ResultContext};
pub use logging::{LoggingConfig, init_logging, debug, error, info, trace, warn};
pub use config::{Config, load_config, DefaultConfig};
pub use filesystem::{read_file, write_file, create_dir_all, file_exists, get_project_dirs};
pub use prevalidation::{PreValidationRule, NonEmptyRule, MinLengthRule, MaxLengthRule, validate_fast};
pub use debug::{duck, duck_value, DuckDebugger};
```

This design provides a comprehensive foundation for all Symphony Rust development with proper error handling, logging, configuration, and utility functions while maintaining high performance and security standards.