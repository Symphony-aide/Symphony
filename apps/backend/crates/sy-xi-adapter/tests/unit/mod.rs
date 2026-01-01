//! Unit tests for XI-editor adapter components
//!
//! This module organizes unit tests for all adapter components using
//! factory-based test data generation and comprehensive test coverage.

pub mod jsonrpc_client_test;
pub mod process_manager_test;

// Re-export factory for use in tests
pub use crate::factory::*;