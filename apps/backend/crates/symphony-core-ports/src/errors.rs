//! Error types for Symphony's core ports
//!
//! This module defines comprehensive error types for all port operations,
//! with proper error propagation and context preservation.

use crate::types::*;
use sy_commons::SymphonyError;
use thiserror::Error;

/// Core error types for all port operations
#[derive(Error, Debug)]
pub enum PortError {
	/// Text editing operation failed
	#[error("Text editing operation failed: {message}")]
	TextEditingFailed { message: String },

	/// Pit operation failed
	#[error("Pit operation failed: {operation} - {message}")]
	PitOperationFailed { operation: String, message: String },

	/// Extension operation failed
	#[error("Extension operation failed: {extension_id:?} - {message}")]
	ExtensionOperationFailed {
		extension_id: ExtensionId,
		message: String,
	},

	/// Conductor operation failed
	#[error("Conductor operation failed: {message}")]
	ConductorOperationFailed { message: String },

	/// Data access operation failed
	#[error("Data access operation failed: {operation} - {message}")]
	DataAccessFailed { operation: String, message: String },

	/// Process communication failed
	#[error("Process communication failed: {process_id:?} - {message}")]
	ProcessCommunicationFailed {
		process_id: ProcessId,
		message: String,
	},

	/// State synchronization failed
	#[error("State synchronization failed: {component} - {message}")]
	SynchronizationError { component: String, message: String },

	/// Pre-validation failed
	#[error("Pre-validation failed: {field} - {message}")]
	PreValidationError { field: String, message: String },

	/// Authoritative validation failed
	#[error("Authoritative validation failed: {message}")]
	AuthoritativeValidationError { message: String },
}

// Conversion to sy-commons::SymphonyError
impl From<PortError> for SymphonyError {
	fn from(err: PortError) -> Self {
		match err {
			PortError::TextEditingFailed { message } => SymphonyError::Generic {
				message: format!("Text editing operation failed: {}", message),
				source: None,
			},
			PortError::PitOperationFailed { operation, message } => SymphonyError::Generic {
				message: format!("Pit operation failed: {} - {}", operation, message),
				source: None,
			},
			PortError::ExtensionOperationFailed {
				extension_id,
				message,
			} => SymphonyError::Generic {
				message: format!("Extension operation failed: {:?} - {}", extension_id, message),
				source: None,
			},
			PortError::ConductorOperationFailed { message } => SymphonyError::Generic {
				message: format!("Conductor operation failed: {}", message),
				source: None,
			},
			PortError::DataAccessFailed { operation, message } => SymphonyError::Generic {
				message: format!("Data access operation failed: {} - {}", operation, message),
				source: None,
			},
			PortError::ProcessCommunicationFailed {
				process_id,
				message,
			} => SymphonyError::Generic {
				message: format!("Process communication failed: {:?} - {}", process_id, message),
				source: None,
			},
			PortError::SynchronizationError { component, message } => SymphonyError::Generic {
				message: format!("State synchronization failed: {} - {}", component, message),
				source: None,
			},
			PortError::PreValidationError { field, message } => SymphonyError::Validation {
				message: format!("Pre-validation failed: {}", message),
				field: Some(field),
				value: None,
			},
			PortError::AuthoritativeValidationError { message } => SymphonyError::Validation {
				message: format!("Authoritative validation failed: {}", message),
				field: None,
				value: None,
			},
		}
	}
}
