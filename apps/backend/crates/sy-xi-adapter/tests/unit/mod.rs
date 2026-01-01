//! Unit tests for XI-editor adapter components
//!
//! This module organizes unit tests for all adapter components using
//! factory-based test data generation and comprehensive test coverage.

#![allow(clippy::unwrap_used)]
#![allow(clippy::expect_used)]
#![allow(clippy::default_trait_access)]
#![allow(clippy::collapsible_match)]
#![allow(clippy::uninlined_format_args)]
#![allow(clippy::doc_markdown)]

pub mod jsonrpc_client_test;
pub mod process_manager_test;

// Re-export factory for use in tests
pub use crate::factory::*;