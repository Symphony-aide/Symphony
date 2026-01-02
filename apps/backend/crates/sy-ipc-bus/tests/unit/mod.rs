//! Unit tests for sy-ipc-bus components
//!
//! This module organizes all unit tests for the message bus components.
//! Tests are organized by feature flags for selective execution.

// Allow common test patterns that clippy flags but are acceptable in tests
#![allow(clippy::unwrap_used)]
#![allow(clippy::panic)]
#![allow(clippy::needless_borrow)]
#![allow(clippy::uninlined_format_args)]
#![allow(clippy::overly_complex_bool_expr)]

pub mod bus_core_test;
pub mod correlation_test;
pub mod health_monitor_test;
pub mod pubsub_test;
pub mod router_test;
