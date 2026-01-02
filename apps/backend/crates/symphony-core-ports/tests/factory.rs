//! Test data factories for symphony-core-ports
//!
//! MANDATORY: All tests must use specific factory structs for data generation.
//! ZERO TOLERANCE for hardcoded test data.

use std::collections::HashMap;
use std::path::PathBuf;
use sy_commons::testing::safe_generator;
use symphony_core_ports::types::*;

/// Factory for generating UUID test data
pub struct UUIDTestFactory;

impl UUIDTestFactory {
	pub fn valid() -> String {
		let id = safe_generator().next_unique_id();
		format!("550e8400-e29b-41d4-a716-{:012x}", id)
	}

	pub fn invalid() -> String {
		let valid = Self::valid();
		safe_generator().mutate_to_invalid(&valid)
	}
}

/// Factory for generating BufferId test data
pub struct BufferIdTestFactory;

impl BufferIdTestFactory {
	pub fn valid() -> BufferId {
		let uuid_str = UUIDTestFactory::valid();
		BufferId(uuid::Uuid::parse_str(&uuid_str).unwrap())
	}

	pub fn batch(count: usize) -> Vec<BufferId> {
		(0..count).map(|_| Self::valid()).collect()
	}
}

/// Factory for generating ViewId test data
pub struct ViewIdTestFactory;

impl ViewIdTestFactory {
	pub fn valid() -> ViewId {
		let uuid_str = UUIDTestFactory::valid();
		ViewId(uuid::Uuid::parse_str(&uuid_str).unwrap())
	}
}

/// Factory for generating Position test data
pub struct PositionTestFactory;

impl PositionTestFactory {
	pub fn valid() -> Position {
		let line = safe_generator().number_in_range(0, 1000) as u32;
		let column = safe_generator().number_in_range(0, 1000) as u32;
		Position { line, column }
	}

	pub fn with_line(line: u32) -> Position {
		let column = safe_generator().number_in_range(0, 1000) as u32;
		Position { line, column }
	}

	pub fn with_column(column: u32) -> Position {
		let line = safe_generator().number_in_range(0, 1000) as u32;
		Position { line, column }
	}
}

/// Factory for generating Range test data
pub struct RangeTestFactory;

impl RangeTestFactory {
	pub fn valid() -> Range {
		let start = PositionTestFactory::valid();
		let end_line = start.line + safe_generator().number_in_range(1, 10) as u32;
		let end_column = start.column + safe_generator().number_in_range(1, 10) as u32;
		let end = Position {
			line: end_line,
			column: end_column,
		};

		Range { start, end }
	}

	pub fn with_positions(start: Position, end: Position) -> Range {
		Range { start, end }
	}
}

/// Factory for generating ResourceRequirements test data
pub struct ResourceRequirementsTestFactory;

impl ResourceRequirementsTestFactory {
	pub fn valid() -> ResourceRequirements {
		ResourceRequirements {
			memory_mb: safe_generator().number_in_range(512, 8192),
			cpu_cores: (safe_generator().number_in_range(1, 16) as f32),
			gpu_memory_mb: if safe_generator().number_in_range(0, 2) == 0 {
				None
			} else {
				Some(safe_generator().number_in_range(256, 4096))
			},
			network_access: safe_generator().number_in_range(0, 2) == 1,
		}
	}

	pub fn with_memory(memory_mb: u64) -> ResourceRequirements {
		let mut req = Self::valid();
		req.memory_mb = memory_mb;
		req
	}
}

/// Factory for generating ModelSpec test data
pub struct ModelSpecTestFactory;

impl ModelSpecTestFactory {
	pub fn valid() -> ModelSpec {
		let id = safe_generator().next_unique_id();
		ModelSpec {
			name: format!("test-model-{}", id),
			version: format!("1.{}.0", id % 100),
			model_type: ModelType::Language,
			resource_requirements: ResourceRequirementsTestFactory::valid(),
			configuration: HashMap::new(),
		}
	}

	pub fn with_name(name: &str) -> ModelSpec {
		let mut spec = Self::valid();
		spec.name = name.to_string();
		spec
	}
}

/// Factory for generating ExtensionManifest test data
pub struct ExtensionManifestTestFactory;

impl ExtensionManifestTestFactory {
	pub fn valid() -> ExtensionManifest {
		let id = safe_generator().next_unique_id();
		ExtensionManifest {
			name: format!("test-extension-{}", id),
			version: format!("1.{}.0", id % 100),
			extension_type: ExtensionType::Instrument,
			permissions: vec![Permission::FileRead, Permission::NetworkAccess],
			dependencies: vec![],
			entry_point: "main.py".to_string(),
		}
	}

	pub fn with_type(extension_type: ExtensionType) -> ExtensionManifest {
		let mut manifest = Self::valid();
		manifest.extension_type = extension_type;
		manifest
	}
}

/// Factory for generating WorkflowDefinition test data
pub struct WorkflowDefinitionTestFactory;

impl WorkflowDefinitionTestFactory {
	pub fn valid() -> WorkflowDefinition {
		let id = safe_generator().next_unique_id();
		WorkflowDefinition {
			name: format!("test-workflow-{}", id),
			version: format!("1.{}.0", id % 100),
			steps: vec![],
			dependencies: vec![],
			timeout: std::time::Duration::from_secs(safe_generator().number_in_range(60, 3600)),
		}
	}

	pub fn with_timeout_secs(secs: u64) -> WorkflowDefinition {
		let mut def = Self::valid();
		def.timeout = std::time::Duration::from_secs(secs);
		def
	}
}

/// Factory for generating TextEditingEvent test data
pub struct TextEditingEventTestFactory;

impl TextEditingEventTestFactory {
	pub fn buffer_created() -> TextEditingEvent {
		let id = safe_generator().next_unique_id();
		TextEditingEvent::BufferCreated {
			buffer_id: BufferIdTestFactory::valid(),
			file_path: Some(PathBuf::from(format!("test-file-{}.txt", id))),
		}
	}
}

/// Factory for generating SyncEvent test data
pub struct SyncEventTestFactory;

impl SyncEventTestFactory {
	pub fn process_started() -> SyncEvent {
		SyncEvent::ProcessStarted {
			process_id: ProcessId(uuid::Uuid::new_v4()),
			binary_type: BinaryType::Symphony,
		}
	}
}

/// Factory for generating HealthStatus test data
pub struct HealthStatusTestFactory;

impl HealthStatusTestFactory {
	pub fn healthy() -> HealthStatus {
		HealthStatus::Healthy
	}

	pub fn degraded() -> HealthStatus {
		let id = safe_generator().next_unique_id();
		HealthStatus::Degraded {
			message: format!("Performance degraded - issue {}", id),
		}
	}

	pub fn unhealthy() -> HealthStatus {
		let id = safe_generator().next_unique_id();
		HealthStatus::Unhealthy {
			error: format!("System error - code {}", id),
		}
	}

	pub fn unknown() -> HealthStatus {
		HealthStatus::Unknown
	}
}
