//! Domain type validation tests
//! 
//! These tests verify domain types work correctly and enforce constraints.
//! Following TDD principles, these tests are written FIRST and should FAIL initially.

use symphony_core_ports::types::*;
use proptest::prelude::*;
use uuid::Uuid;
use serde_json;

#[cfg(feature = "unit")]
mod identifier_tests {
    use super::*;

    #[test]
    fn test_buffer_id_uniqueness() {
        // RED PHASE: This test should FAIL because BufferId doesn't exist yet
        let id1 = BufferId(Uuid::new_v4());
        let id2 = BufferId(Uuid::new_v4());
        assert_ne!(id1, id2);
    }

    #[test]
    fn test_view_id_uniqueness() {
        let id1 = ViewId(Uuid::new_v4());
        let id2 = ViewId(Uuid::new_v4());
        assert_ne!(id1, id2);
    }

    #[test]
    fn test_model_id_uniqueness() {
        let id1 = ModelId(Uuid::new_v4());
        let id2 = ModelId(Uuid::new_v4());
        assert_ne!(id1, id2);
    }

    #[test]
    fn test_extension_id_uniqueness() {
        let id1 = ExtensionId(Uuid::new_v4());
        let id2 = ExtensionId(Uuid::new_v4());
        assert_ne!(id1, id2);
    }

    #[test]
    fn test_process_id_uniqueness() {
        let id1 = ProcessId(Uuid::new_v4());
        let id2 = ProcessId(Uuid::new_v4());
        assert_ne!(id1, id2);
    }

    #[test]
    fn test_workflow_id_uniqueness() {
        let id1 = WorkflowId(Uuid::new_v4());
        let id2 = WorkflowId(Uuid::new_v4());
        assert_ne!(id1, id2);
    }
}

#[cfg(feature = "unit")]
mod position_and_range_tests {
    use super::*;

    #[test]
    fn test_position_creation() {
        let pos = Position { line: 42, column: 17 };
        assert_eq!(pos.line, 42);
        assert_eq!(pos.column, 17);
    }

    #[test]
    fn test_position_serialization_roundtrip() {
        let pos = Position { line: 42, column: 17 };
        let json = serde_json::to_string(&pos).unwrap();
        let deserialized: Position = serde_json::from_str(&json).unwrap();
        assert_eq!(pos, deserialized);
    }

    #[test]
    fn test_range_creation() {
        let start = Position { line: 0, column: 0 };
        let end = Position { line: 1, column: 5 };
        let range = Range { start, end };
        assert_eq!(range.start, start);
        assert_eq!(range.end, end);
    }

    #[test]
    fn test_range_serialization_roundtrip() {
        let range = Range {
            start: Position { line: 0, column: 0 },
            end: Position { line: 1, column: 5 },
        };
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
            let start = Position { line: start_line, column: start_col };
            let end = Position { line: end_line, column: end_col };
            let range = Range { start, end };
            
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
        let spec = ModelSpec {
            name: "test-model".to_string(),
            version: "1.0.0".to_string(),
            model_type: ModelType::Language,
            resource_requirements: ResourceRequirements {
                memory_mb: 1024,
                cpu_cores: 2.0,
                gpu_memory_mb: Some(512),
                network_access: true,
            },
            configuration: std::collections::HashMap::new(),
        };
        
        assert_eq!(spec.name, "test-model");
        assert_eq!(spec.version, "1.0.0");
        assert_eq!(spec.resource_requirements.memory_mb, 1024);
    }

    #[test]
    fn test_extension_manifest_creation() {
        let manifest = ExtensionManifest {
            name: "test-extension".to_string(),
            version: "1.0.0".to_string(),
            extension_type: ExtensionType::Instrument,
            permissions: vec![Permission::FileRead, Permission::NetworkAccess],
            dependencies: vec![],
            entry_point: "main.py".to_string(),
        };
        
        assert_eq!(manifest.name, "test-extension");
        assert_eq!(manifest.extension_type, ExtensionType::Instrument);
        assert_eq!(manifest.permissions.len(), 2);
    }

    #[test]
    fn test_workflow_definition_creation() {
        let definition = WorkflowDefinition {
            name: "test-workflow".to_string(),
            version: "1.0.0".to_string(),
            steps: vec![],
            dependencies: vec![],
            timeout: std::time::Duration::from_secs(300),
        };
        
        assert_eq!(definition.name, "test-workflow");
        assert_eq!(definition.timeout.as_secs(), 300);
    }
}

#[cfg(feature = "unit")]
mod event_type_tests {
    use super::*;

    #[test]
    fn test_text_editing_event_serialization() {
        let event = TextEditingEvent::BufferCreated {
            buffer_id: BufferId(Uuid::new_v4()),
            file_path: Some(std::path::PathBuf::from("test.txt")),
        };
        
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
        let event = SyncEvent::ProcessStarted {
            process_id: ProcessId(Uuid::new_v4()),
            binary_type: BinaryType::Symphony,
        };
        
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
        let requirements = ResourceRequirements {
            memory_mb: 2048,
            cpu_cores: 4.0,
            gpu_memory_mb: Some(1024),
            network_access: true,
        };
        
        assert_eq!(requirements.memory_mb, 2048);
        assert_eq!(requirements.cpu_cores, 4.0);
        assert_eq!(requirements.gpu_memory_mb, Some(1024));
        assert!(requirements.network_access);
    }

    #[test]
    fn test_health_status_variants() {
        let healthy = HealthStatus::Healthy;
        let degraded = HealthStatus::Degraded { message: "Slow response".to_string() };
        let unhealthy = HealthStatus::Unhealthy { error: "Connection failed".to_string() };
        let unknown = HealthStatus::Unknown;
        
        match healthy {
            HealthStatus::Healthy => (),
            _ => panic!("Expected Healthy variant"),
        }
        
        match degraded {
            HealthStatus::Degraded { message } => assert_eq!(message, "Slow response"),
            _ => panic!("Expected Degraded variant"),
        }
        
        match unhealthy {
            HealthStatus::Unhealthy { error } => assert_eq!(error, "Connection failed"),
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