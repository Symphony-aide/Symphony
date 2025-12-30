//! Error handling and propagation tests
//! 
//! These tests verify error handling works correctly across all scenarios.
//! Following TDD principles, these tests are written FIRST and should FAIL initially.

use symphony_core_ports::errors::*;
use symphony_core_ports::types::*;
use sy_commons::SymphonyError;
use uuid::Uuid;

#[cfg(feature = "unit")]
mod port_error_tests {
    use super::*;

    #[test]
    fn test_port_error_to_symphony_error_conversion() {
        // RED PHASE: This test should FAIL because PortError doesn't exist yet
        let port_error = PortError::TextEditingFailed {
            message: "Buffer not found".to_string(),
        };
        let symphony_error: SymphonyError = port_error.into();
        
        // Verify the error message contains expected content
        let error_string = symphony_error.to_string();
        assert!(error_string.contains("Text editing operation failed"));
        assert!(error_string.contains("Buffer not found"));
    }

    #[test]
    fn test_pit_operation_error_conversion() {
        let port_error = PortError::PitOperationFailed {
            operation: "allocate_model".to_string(),
            message: "Insufficient memory".to_string(),
        };
        let symphony_error: SymphonyError = port_error.into();
        
        let error_string = symphony_error.to_string();
        assert!(error_string.contains("Pit operation failed"));
        assert!(error_string.contains("allocate_model"));
        assert!(error_string.contains("Insufficient memory"));
    }

    #[test]
    fn test_extension_operation_error_conversion() {
        let extension_id = ExtensionId(Uuid::new_v4());
        let port_error = PortError::ExtensionOperationFailed {
            extension_id,
            message: "Extension crashed".to_string(),
        };
        let symphony_error: SymphonyError = port_error.into();
        
        let error_string = symphony_error.to_string();
        assert!(error_string.contains("Extension operation failed"));
        assert!(error_string.contains("Extension crashed"));
    }

    #[test]
    fn test_conductor_operation_error_conversion() {
        let port_error = PortError::ConductorOperationFailed {
            message: "Python subprocess died".to_string(),
        };
        let symphony_error: SymphonyError = port_error.into();
        
        let error_string = symphony_error.to_string();
        assert!(error_string.contains("Conductor operation failed"));
        assert!(error_string.contains("Python subprocess died"));
    }

    #[test]
    fn test_data_access_error_conversion() {
        let port_error = PortError::DataAccessFailed {
            operation: "create_workflow".to_string(),
            message: "Database connection failed".to_string(),
        };
        let symphony_error: SymphonyError = port_error.into();
        
        let error_string = symphony_error.to_string();
        assert!(error_string.contains("Data access operation failed"));
        assert!(error_string.contains("create_workflow"));
        assert!(error_string.contains("Database connection failed"));
    }

    #[test]
    fn test_process_communication_error_conversion() {
        let process_id = ProcessId(Uuid::new_v4());
        let port_error = PortError::ProcessCommunicationFailed {
            process_id,
            message: "Connection timeout".to_string(),
        };
        let symphony_error: SymphonyError = port_error.into();
        
        let error_string = symphony_error.to_string();
        assert!(error_string.contains("Process communication failed"));
        assert!(error_string.contains("Connection timeout"));
    }

    #[test]
    fn test_synchronization_error_conversion() {
        let port_error = PortError::SynchronizationError {
            component: "buffer_manager".to_string(),
            message: "State mismatch detected".to_string(),
        };
        let symphony_error: SymphonyError = port_error.into();
        
        let error_string = symphony_error.to_string();
        assert!(error_string.contains("State synchronization failed"));
        assert!(error_string.contains("buffer_manager"));
        assert!(error_string.contains("State mismatch detected"));
    }

    #[test]
    fn test_pre_validation_error_conversion() {
        let port_error = PortError::PreValidationError {
            field: "workflow_name".to_string(),
            message: "Name cannot be empty".to_string(),
        };
        let symphony_error: SymphonyError = port_error.into();
        
        match symphony_error {
            SymphonyError::Validation { message, field, .. } => {
                assert!(message.contains("Pre-validation failed"));
                assert!(message.contains("Name cannot be empty"));
                assert_eq!(field, Some("workflow_name".to_string()));
            }
            _ => panic!("Expected Validation error variant"),
        }
    }

    #[test]
    fn test_authoritative_validation_error_conversion() {
        let port_error = PortError::AuthoritativeValidationError {
            message: "User lacks permission".to_string(),
        };
        let symphony_error: SymphonyError = port_error.into();
        
        let error_string = symphony_error.to_string();
        assert!(error_string.contains("Authoritative validation failed"));
        assert!(error_string.contains("User lacks permission"));
    }
}

#[cfg(feature = "unit")]
mod error_context_tests {
    use super::*;

    #[test]
    fn test_error_context_preservation() {
        let original_error = PortError::ProcessCommunicationFailed {
            process_id: ProcessId(Uuid::new_v4()),
            message: "Connection timeout".to_string(),
        };
        
        let error_string = original_error.to_string();
        assert!(error_string.contains("Process communication failed"));
        assert!(error_string.contains("Connection timeout"));
        
        // Verify the process ID is included in the error message
        // (The exact format will depend on the Display implementation)
        assert!(error_string.len() > 50); // Should be a substantial error message
    }

    #[test]
    fn test_error_debug_formatting() {
        let error = PortError::TextEditingFailed {
            message: "Test error".to_string(),
        };
        
        let debug_string = format!("{:?}", error);
        assert!(debug_string.contains("TextEditingFailed"));
        assert!(debug_string.contains("Test error"));
    }

    #[test]
    fn test_error_chain_preservation() {
        // Test that error chains are preserved when converting to SymphonyError
        let port_error = PortError::DataAccessFailed {
            operation: "query_database".to_string(),
            message: "SQL syntax error".to_string(),
        };
        
        let symphony_error: SymphonyError = port_error.into();
        
        // The error should maintain its information through the conversion
        let error_string = symphony_error.to_string();
        assert!(error_string.contains("Data access operation failed"));
        assert!(error_string.contains("query_database"));
        assert!(error_string.contains("SQL syntax error"));
    }
}

#[cfg(feature = "unit")]
mod error_categorization_tests {
    use super::*;

    #[test]
    fn test_technical_error_category() {
        // Technical errors: Network failures, serialization errors, resource exhaustion
        let errors = vec![
            PortError::ProcessCommunicationFailed {
                process_id: ProcessId(Uuid::new_v4()),
                message: "Network timeout".to_string(),
            },
            PortError::SynchronizationError {
                component: "serializer".to_string(),
                message: "Failed to serialize message".to_string(),
            },
            PortError::PitOperationFailed {
                operation: "allocate_model".to_string(),
                message: "Out of memory".to_string(),
            },
        ];
        
        for error in errors {
            let symphony_error: SymphonyError = error.into();
            // All should convert successfully
            assert!(!symphony_error.to_string().is_empty());
        }
    }

    #[test]
    fn test_business_logic_error_category() {
        // Business logic errors: Validation failures, permission denied, resource not found
        let errors = vec![
            PortError::PreValidationError {
                field: "user_id".to_string(),
                message: "Invalid format".to_string(),
            },
            PortError::AuthoritativeValidationError {
                message: "Permission denied".to_string(),
            },
            PortError::ExtensionOperationFailed {
                extension_id: ExtensionId(Uuid::new_v4()),
                message: "Extension not found".to_string(),
            },
        ];
        
        for error in errors {
            let symphony_error: SymphonyError = error.into();
            // All should convert successfully
            assert!(!symphony_error.to_string().is_empty());
        }
    }

    #[test]
    fn test_system_error_category() {
        // System errors: Process crashes, communication failures, timeout errors
        let errors = vec![
            PortError::ConductorOperationFailed {
                message: "Python process crashed".to_string(),
            },
            PortError::ProcessCommunicationFailed {
                process_id: ProcessId(Uuid::new_v4()),
                message: "IPC channel closed".to_string(),
            },
            PortError::DataAccessFailed {
                operation: "connect".to_string(),
                message: "Connection timeout".to_string(),
            },
        ];
        
        for error in errors {
            let symphony_error: SymphonyError = error.into();
            // All should convert successfully
            assert!(!symphony_error.to_string().is_empty());
        }
    }
}