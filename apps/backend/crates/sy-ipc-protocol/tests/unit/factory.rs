//! Factory module link for unit tests
//!
//! Re-exports all factory types from the main factory module.

// Import the factory from the parent directory
#[path = "../factory.rs"]
pub mod parent_factory;

pub use parent_factory::*;
