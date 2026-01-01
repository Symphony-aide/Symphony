//! Integration tests for sy-ipc-bus
//!
//! This module provides comprehensive testing for the Symphony IPC Message Bus,
//! including unit tests, integration tests, and performance benchmarks.

// Test modules
pub mod factory;
pub mod unit;

// Re-export factory for use in tests
pub use factory::*;