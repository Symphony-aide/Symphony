# Feature Definition: F001 - sy-commons Foundation

**Feature ID**: F001  
**Feature Name**: sy_commons_foundation  
**Parent Milestone**: M1.0.1 (sy-commons Foundation)  
**Implementation Priority**: 🔴 Critical - PREREQUISITE for ALL Symphony development  
**Estimated Effort**: 3-4 days  
**Assigned Developer**: TBD  
**Status**: [ ] Not Started

---

## 📋 Problem Statement

Symphony requires a foundational common library (`sy-commons`) that provides shared functionality across all Rust crates. Currently, there is no centralized error handling, logging, configuration, or utility system, which will lead to code duplication and inconsistent patterns across the codebase.

**Core Rule**: "Common First" - Any functionality that can be shared across crates MUST be implemented in sy-commons first.

---

## 🎯 Solution Approach

Create a comprehensive `sy-commons` crate that serves as the foundation for all Symphony Rust development, providing:

1. **SymphonyError**: Base error type for ALL Symphony crates
2. **Professional Logging**: tracing-based system with Console, File, and JSON outputs
3. **Environment Configuration**: TOML-based configuration with Figment parsing
4. **Safe Filesystem Utilities**: Professional architecture with low complexity
5. **Pre-validation Helpers**: Simple rule validation utilities (NOT business logic)
6. **Duck Debugging**: Temporary debugging utilities with searchable format
7. **Complete lib.rs Guide**: Comprehensive documentation and re-exports
8. **Co-located Tests**: Every public function tested in the same file

---

## ✅ Acceptance Criteria

### AC1: SymphonyError Base Error System
**Given** Symphony needs consistent error handling across all crates  
**When** SymphonyError is implemented  
**Then** it provides Validation, IO, Serialization, and Generic variants  
**And** implements From traits for common error types  
**And** supports error context with ResultContext trait  
**And** includes error categorization system  
**And** has comprehensive error tests

### AC2: Professional Logging System
**Given** Symphony needs professional logging capabilities  
**When** logging system is implemented  
**Then** it integrates tracing and tracing-subscriber  
**And** supports Console output formatter  
**And** supports File output with rotation  
**And** supports JSON output for cloud analysis  
**And** provides LoggingConfig structure  
**And** includes init_logging function  
**And** re-exports logging macros (info!, warn!, error!)  
**And** has logging integration tests

### AC3: Environment Configuration System
**Given** Symphony needs type-safe configuration management  
**When** configuration system is implemented  
**Then** it creates Config structure with Deserialize  
**And** implements load_config function using Figment  
**And** supports default.toml, test.toml, production.toml  
**And** provides type-safe configuration parsing  
**And** has configuration tests for all TOML files

### AC4: Safe Filesystem Utilities
**Given** Symphony needs safe filesystem operations  
**When** filesystem utilities are implemented  
**Then** they provide safe file reading with error handling  
**And** support platform directories using directories::ProjectDirs  
**And** provide safe file writing with atomic operations  
**And** include directory creation utilities  
**And** include file existence checking  
**And** provide path validation utilities  
**And** have comprehensive filesystem operation tests

### AC5: Pre-validation Rule Helpers
**Given** Symphony needs lightweight technical validation  
**When** pre-validation helpers are implemented  
**Then** they define PreValidationRule trait  
**And** implement common validation rules (non-empty, format, size)  
**And** provide rule composition utilities  
**And** achieve performance-optimized validation (<1ms)  
**And** have pre-validation performance tests

### AC6: Duck Debugging Utilities
**Given** Symphony needs temporary debugging capabilities  
**When** duck debugging utilities are implemented  
**Then** they provide duck! macro for temporary debugging  
**And** use searchable format with [DUCK DEBUGGING] prefix  
**And** have duck debugging tests

### AC7: Complete lib.rs Guide
**Given** Symphony needs comprehensive API documentation  
**When** lib.rs guide is implemented  
**Then** it documents all public APIs with examples  
**And** provides comprehensive usage guide  
**And** includes re-exports for all public functionality  
**And** has documentation tests

---

## 📊 Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Test Coverage** | 100% for all public functions | cargo tarpaulin |
| **Error Handling Consistency** | All Symphony crates use SymphonyError | Code review |
| **Logging Integration** | All three output formats work | Integration tests |
| **Configuration Parsing** | All three TOML files parse correctly | Unit tests |
| **Filesystem Safety** | All operations handle errors gracefully | Error injection tests |
| **Pre-validation Performance** | <1ms for all validation rules | Benchmark tests |
| **Documentation Completeness** | All public APIs documented with examples | rustdoc generation |
| **OCP Compliance** | Extensible but not modifiable | Architecture review |

---

## 👥 User Stories

### Story 1: Error Handling Developer
**As a** Symphony Rust developer  
**I want** consistent error handling across all crates  
**So that** I can handle errors uniformly and provide clear error messages to users

**Example**: 
```rust
use sy_commons::SymphonyError;

fn my_function() -> Result<String, SymphonyError> {
    let content = std::fs::read_to_string("file.txt")
        .map_err(SymphonyError::from)?;
    Ok(content)
}
```

### Story 2: Logging Developer
**As a** Symphony developer  
**I want** professional logging capabilities  
**So that** I can debug issues in development and monitor production systems

**Example**:
```rust
use sy_commons::logging::{info, warn, error};

fn process_file(path: &str) {
    info!("Processing file: {}", path);
    match read_file(path) {
        Ok(content) => info!("File processed successfully"),
        Err(e) => error!("Failed to process file: {}", e),
    }
}
```

### Story 3: Configuration Developer
**As a** Symphony developer  
**I want** type-safe configuration management  
**So that** I can easily configure different environments without runtime errors

**Example**:
```rust
use sy_commons::config::{Config, load_config};

#[derive(Deserialize)]
struct AppConfig {
    database_url: String,
    log_level: String,
}

let config: AppConfig = load_config("production")?;
```

---

## 🔗 Dependencies

### Requires (Blocking Dependencies)
- None (This is the foundation crate)

### Enables (Features that depend on this)
- **ALL M1 sub-milestones**: M1.1, M1.2, M1.3, M1.4, M1.5, M1.6, M1.7, M1.8, M1.9, M1.10, M1.11
- **ALL Symphony crates**: Every Rust crate in Symphony must depend on sy-commons

### External Dependencies
- `thiserror` - Error handling derive macros
- `tracing` - Structured logging framework
- `tracing-subscriber` - Logging output formatters
- `figment` - Configuration management
- `serde` - Serialization framework
- `directories` - Platform directory utilities
- `tokio` - Async runtime (for file operations)

---

## 🚫 Out of Scope

- **Business Logic Validation**: Pre-validation helpers are for technical validation only, not business rules
- **Database Operations**: sy-commons is for common utilities, not data persistence
- **Network Operations**: HTTP clients and network utilities belong in specific crates
- **UI Components**: Frontend-specific utilities belong in frontend packages
- **AI/ML Operations**: Model-specific utilities belong in AI-specific crates
- **Extension System**: Extension-specific utilities belong in extension crates

---

## 🧪 Testability Requirements

- **Unit Tests**: Every public function must have co-located tests
- **Integration Tests**: Logging system must have integration tests
- **Performance Tests**: Pre-validation helpers must have performance benchmarks
- **Documentation Tests**: All code examples in documentation must be tested
- **Error Injection Tests**: Filesystem utilities must handle all error conditions

---

## 📝 Notes

- This feature is a PREREQUISITE for ALL other Symphony development
- The "Common First" rule must be enforced: any shared functionality goes in sy-commons first
- OCP (Open-Closed Principle) compliance is critical: extensible but not modifiable
- All other Symphony crates MUST use sy-commons for error handling, logging, and configuration
- Duck debugging utilities are temporary and should be easily removable in production builds