//! Domain type validation tests
//! 
//! These tests verify domain types work correctly and enforce constraints.
//! Following TDD principles, these tests are written FIRST and should FAIL initially.
//! 
//! MANDATORY: All tests use specific factory structs. NO hardcoded values allowed.

use symphony_core_ports::types::*;
use proptest::prelude::*;
use uuid::Uuid;
use serde_json;

mod factory;
use factory::*;

#[cfg(feature = "unit")]
mod identifier_tests {
    use super::*;

    #[test]
    fn test_buffer_id_uniqueness() {
        // RED PHASE: This test should FAIL because BufferId doesn't exist yet
        let id1 = BufferIdTestFactory::valid();
        let id2 = BufferIdTestFactory::valid();
        assert_ne!(id1, id2);
    }

    #[test]
    fn test_view_id_uniqueness() {
        let id1 = ViewIdTestFactory::valid();
        let id2 = ViewIdTestFactory::valid();
        assert_ne!(id1, id2);
    }

    #[test]
    fn test_model_id_uniqueness() {
        let id1 = ModelId(uuid::Uuid::new_v4());
        let id2 = ModelId(uuid::Uuid::new_v4());
        assert_ne!(id1, id2);
    }

    #[test]
    fn test_extension_id_uniqueness() {
        let id1 = ExtensionId(uuid::Uuid::new_v4());
        let id2 = ExtensionId(uuid::Uuid::new_v4());
        assert_ne!(id1, id2);
    }

    #[test]
    fn test_process_id_uniqueness() {
        let id1 = ProcessId(uuid::Uuid::new_v4());
        let id2 = ProcessId(uuid::Uuid::new_v4());
        assert_ne!(id1, id2);
    }

    #[test]
    fn test_workflow_id_uniqueness() {
        let id1 = WorkflowId(uuid::Uuid::new_v4());
        let id2 = WorkflowId(uuid::Uuid::new_v4());
        assert_ne!(id1, id2);
    }
}

#[cfg(feature = "unit")]
mod position_and_range_tests {
    use super::*;

    #[test]
    fn test_position_creation() {
        let pos = PositionTestFactory::valid();
        assert!(pos.line < 1000); // Factory generates 0..1000
        assert!(pos.column < 1000);
    }

    #[test]
    fn test_position_with_specific_values() {
        let pos = PositionTestFactory::with_line(42);
        assert_eq!(pos.line, 42);
        assert!(pos.column < 1000);
    }

    #[test]
    fn test_position_serialization_roundtrip() {
        let pos = PositionTestFactory::valid();
        let json = serde_json::to_string(&pos).unwrap();
        let deserialized: Position = serde_json::from_str(&json).unwrap();
        assert_eq!(pos, deserialized);
    }

    #[test]
    fn test_range_creation() {
        let range = RangeTestFactory::valid();
        // Factory ensures end is after start
        assert!(range.end.line >= range.start.line);
        if range.end.line == range.start.line {
            assert!(range.end.column >= range.start.column);
        }
    }

    #[test]
    fn test_range_with_specific_positions() {
        let start = PositionTestFactory::with_line(0);
        let end = PositionTestFactory::with_line(1);
        let range = RangeTestFactory::with_positions(start, end);
        assert_eq!(range.start.line, 0);
        assert_eq!(range.end.line, 1);
    }

    #[test]
    fn test_range_serialization_roundtrip() {
        let range = RangeTestFactory::valid();
        let json = serde_json::to_string(&range).unwrap();
        let deserialized: Range = serde_json::from_str(&json).unwrap();
        assert_eq!(range, deserialized);
    }

        proptest! {
            #[test]
            fn test_range_validity(
                start_line in 0u32..1000,
                start_col in 0u32..1000,
                end_line in 0u32..1000,
                end_col in 0u32..1000
            ) {
                let start = PositionTestFactory::with_line(start_line);
                let start = Position { line: start_line, column: start_col };
                let end = Position { line: end_line, column: end_col };
                let range = RangeTestFactory::with_positions(start, end);
                
                // Range should serialize and deserialize correctly
                let json = serde_json::to_string(&range).unwrap();
                let deserialized: Range = serde_json::from_str(&json).unwrap();
                prop_assert_eq!(range, deserialized);
            }
        }
}

#[cfg(feature = "unit")]
mod specification_type_tests {
    use super::*;

    #[test]
    fn test_model_spec_creation() {
        let spec = ModelSpecTestFactory::valid();
        
        assert!(!spec.name.is_empty());
        assert!(!spec.version.is_empty());
        assert_eq!(spec.model_type, ModelType::Language); // Default from factory
        assert!(spec.resource_requirements.memory_mb >= 512);
    }

    #[test]
    fn test_model_spec_with_specific_values() {
        let spec = ModelSpecTestFactory::with_name("test-model");
        
        assert_eq!(spec.name, "test-model");
        assert!(!spec.version.is_empty());
        assert_eq!(spec.model_type, ModelType::Language);
    }

    #[test]
    fn test_extension_manifest_creation() {
        let manifest = ExtensionManifestTestFactory::valid();
        
        assert!(!manifest.name.is_empty());
        assert!(!manifest.version.is_empty());
        assert_eq!(manifest.extension_type, ExtensionType::Instrument); // Default from factory
        assert_eq!(manifest.permissions.len(), 2); // Default from factory
        assert_eq!(manifest.entry_point, "main.py"); // Default from factory
    }

    #[test]
    fn test_extension_manifest_with_specific_values() {
        let manifest = ExtensionManifestTestFactory::with_type(ExtensionType::Operator);
        
        assert!(!manifest.name.is_empty());
        assert_eq!(manifest.extension_type, ExtensionType::Operator);
    }

    #[test]
    fn test_workflow_definition_creation() {
        let definition = WorkflowDefinitionTestFactory::valid();
        
        assert!(!definition.name.is_empty());
        assert!(!definition.version.is_empty());
        assert!(definition.timeout.as_secs() >= 60); // Factory generates 60..3600
        assert!(definition.timeout.as_secs() <= 3600);
    }

    #[test]
    fn test_workflow_definition_with_timeout() {
        let definition = WorkflowDefinitionTestFactory::with_timeout_secs(300);
        
        assert!(!definition.name.is_empty());
        assert_eq!(definition.timeout.as_secs(), 300);
    }
}

#[cfg(feature = "unit")]
mod event_type_tests {
    use super::*;

    #[test]
    fn test_text_editing_event_serialization() {
        let event = TextEditingEventTestFactory::buffer_created();
        
        let json = serde_json::to_string(&event).unwrap();
        let deserialized: TextEditingEvent = serde_json::from_str(&json).unwrap();
        
        match (event, deserialized) {
            (
                TextEditingEvent::BufferCreated { buffer_id: id1, file_path: path1 },
                TextEditingEvent::BufferCreated { buffer_id: id2, file_path: path2 }
            ) => {
                assert_eq!(id1, id2);
                assert_eq!(path1, path2);
            }
            _ => panic!("Event types don't match"),
        }
    }

    #[test]
    fn test_sync_event_serialization() {
        let event = SyncEventTestFactory::process_started();
        
        let json = serde_json::to_string(&event).unwrap();
        let deserialized: SyncEvent = serde_json::from_str(&json).unwrap();
        
        match (event, deserialized) {
            (
                SyncEvent::ProcessStarted { process_id: id1, binary_type: type1 },
                SyncEvent::ProcessStarted { process_id: id2, binary_type: type2 }
            ) => {
                assert_eq!(id1, id2);
                assert_eq!(type1, type2);
            }
            _ => panic!("Event types don't match"),
        }
    }
}

#[cfg(feature = "unit")]
mod resource_type_tests {
    use super::*;

    #[test]
    fn test_resource_requirements_creation() {
        let requirements = ResourceRequirementsTestFactory::valid();
        
        assert!(requirements.memory_mb >= 512);
        assert!(requirements.memory_mb <= 8192);
        assert!(requirements.cpu_cores >= 1.0);
        assert!(requirements.cpu_cores <= 16.0);
        // gpu_memory_mb can be None or Some(256..4096)
        if let Some(gpu_mem) = requirements.gpu_memory_mb {
            assert!(gpu_mem >= 256);
            assert!(gpu_mem <= 4096);
        }
    }

    #[test]
    fn test_resource_requirements_with_specific_values() {
        let requirements = ResourceRequirementsTestFactory::with_memory(2048);
        
        assert_eq!(requirements.memory_mb, 2048);
        assert!(requirements.cpu_cores >= 1.0);
    }

    #[test]
    fn test_health_status_variants() {
        let healthy = HealthStatusTestFactory::healthy();
        let degraded = HealthStatusTestFactory::degraded();
        let unhealthy = HealthStatusTestFactory::unhealthy();
        let unknown = HealthStatusTestFactory::unknown();
        
        match healthy {
            HealthStatus::Healthy => (),
            _ => panic!("Expected Healthy variant"),
        }
        
        match degraded {
            HealthStatus::Degraded { message } => assert!(!message.is_empty()),
            _ => panic!("Expected Degraded variant"),
        }
        
        match unhealthy {
            HealthStatus::Unhealthy { error } => assert!(!error.is_empty()),
            _ => panic!("Expected Unhealthy variant"),
        }
        
        match unknown {
            HealthStatus::Unknown => (),
            _ => panic!("Expected Unknown variant"),
        }
    }

    #[test]
    fn test_extension_type_variants() {
        assert_eq!(ExtensionType::Instrument, ExtensionType::Instrument);
        assert_eq!(ExtensionType::Operator, ExtensionType::Operator);
        assert_eq!(ExtensionType::Motif, ExtensionType::Motif);
        assert_ne!(ExtensionType::Instrument, ExtensionType::Operator);
    }
}