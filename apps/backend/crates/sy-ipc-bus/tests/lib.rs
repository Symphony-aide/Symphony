//! Integration tests for sy-ipc-bus
//!
//! This module provides comprehensive testing for the Symphony IPC Message Bus,
//! including unit tests, integration tests, and performance benchmarks.

// Allow common test patterns that clippy flags but are acceptable in tests
#![allow(clippy::unwrap_used)]
#![allow(clippy::panic)]
#![allow(clippy::needless_borrow)]
#![allow(clippy::uninlined_format_args)]
#![allow(clippy::overly_complex_bool_expr)]

// Test modules
pub mod factory;
pub mod unit;

// Re-export factory for use in tests
pub use factory::*;