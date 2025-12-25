# F005: Message Registry

> **Parent**: Inherited from M1.1.5 (Message Registry)  
> **Status**: [ ] Not Started  
> **Effort**: 2 days  
> **Type**: Infrastructure  

---

## Problem Statement

Symphony's IPC protocol requires centralized management of message types, schemas, and versions to ensure system-wide consistency and enable schema evolution. Without a message registry, components cannot discover available message types, validate against current schemas, or handle version compatibility, leading to integration failures and runtime errors.

## Solution Approach

Implement a comprehensive message registry system that provides:
- Central registration of message types with versioning
- Schema storage and retrieval with version management
- Message validation integration with registered schemas
- Type discovery and capability querying
- Schema evolution support with backward compatibility
- Runtime registration and updates for dynamic systems

## Dependencies Analysis

### External Dependencies

| Library | Purpose | Alternative 1 | Alternative 2 | Alternative 3 | Cross-Platform | Local Env | Cloud Env | Consistency & Stability | Maintained | Ecosystem | Limitation 1 | Limitation 2 | Limitation 3 | Decision | Rationale |
|---------|---------|---------------|---------------|---------------|----------------|-----------|-----------|------------------------|------------|-----------|--------------|--------------|--------------|----------|-----------|
| semver 1.0.20 | Version management | version-compare | custom versioning | string versions | ✅ All platforms | ✅ Works | ✅ Works | ✅ Deterministic | ✅ Active (2024-09) | High | Semantic versioning only | N/A | N/A | ✅ Selected | Standard semantic versioning, excellent API |
| dashmap 5.5.3 | Concurrent HashMap | std::collections::HashMap + RwLock | parking_lot::RwLock + HashMap | custom concurrent map | ✅ All platforms | ✅ Works | ✅ Works | ✅ Deterministic | ✅ Active (2024-08) | High | Memory overhead | Complex API | N/A | ✅ Selected | Excellent concurrent performance, lock-free reads |
| serde 1.0.193 | Serialization | N/A | N/A | N/A | ✅ All platforms | ✅ Works | ✅ Works | ✅ Deterministic | ✅ Active (2024-12) | High | N/A | N/A | N/A | ✅ Selected | Already required by previous features |

**Notes**:
- ✅ = Works correctly / Yes
- ❌ = Does not work / No / Critical issue
- ⚠️ = Partial support / Works with caveats
- N/A = Not applicable

### Internal Dependencies

**Requires**: 
- F001: Message Envelope Design (message type definitions)
- F004: Schema Validation (MessageSchema and validation)

**Enables**: 
- Runtime message type discovery
- Schema-based message validation
- Version compatibility checking
- Dynamic system reconfiguration

## Acceptance Criteria

1. **Type Registration**: All message types registered at system startup with version information
2. **Schema Storage**: Message schemas stored and retrievable by type name and version
3. **Version Lookup**: O(1) schema lookup by type name and version
4. **Validation Integration**: Registry provides schemas for message validation
5. **Backward Compatibility**: Support for multiple schema versions simultaneously
6. **Thread Safety**: Concurrent access from multiple threads without data races
7. **Discovery API**: Components can query available message types and capabilities

## Success Metrics

- Registration time: <1ms per message type during startup
- Lookup performance: <0.001ms (1 microsecond) for schema retrieval
- Memory efficiency: <1KB overhead per registered message type
- Concurrent access: Support 1000+ concurrent lookups without contention
- Version resolution: Automatic selection of compatible schema versions

## User Stories

### Story 1: System Startup Registration
**As a** Symphony core system  
**I want to** register all message types and schemas during startup  
**So that** components can discover and validate messages throughout runtime  

**Example**:
```rust
let mut registry = MessageRegistry::new();

// Register message types with schemas
registry.register::<RequestMessage>()?;
registry.register::<ResponseMessage>()?;
registry.register::<EventMessage>()?;

// Registry is now ready for runtime use
```

### Story 2: Runtime Message Validation
**As a** Symphony IPC component  
**I want to** validate messages using registry schemas  
**So that** I can ensure data integrity without hardcoded validation logic  

**Example**:
```rust
let message: Message<Value> = receive_message().await?;
let message_type = message.header.message_type.to_string();

match registry.validate(&message) {
    Ok(()) => process_message(message),
    Err(ValidationError::UnknownType { type_name }) => {
        log::error!("Unknown message type: {}", type_name);
    }
}
```

### Story 3: Schema Version Management
**As a** Symphony system administrator  
**I want to** manage multiple schema versions simultaneously  
**So that** I can support gradual system upgrades without breaking compatibility  

**Example**:
```rust
// Register multiple versions of the same message type
registry.register_schema("RequestMessage", Version::new(1, 0, 0), schema_v1)?;
registry.register_schema("RequestMessage", Version::new(1, 1, 0), schema_v1_1)?;

// Automatic version resolution for compatibility
let schema = registry.get_compatible_schema("RequestMessage", Version::new(1, 0, 5))?;
// Returns v1.1.0 schema (compatible with v1.0.5)
```

### Story 4: Type Discovery
**As a** Symphony extension  
**I want to** discover available message types and their capabilities  
**So that** I can integrate with the system without hardcoded dependencies  

**Example**:
```rust
let available_types = registry.list_types();
for type_info in available_types {
    println!("Type: {}, Version: {}, Capabilities: {:?}", 
             type_info.name, type_info.version, type_info.capabilities);
}
```

## Timeline

- **Day 1**: Implement MessageRegistry, type registration, and schema storage
- **Day 2**: Add version management, validation integration, and comprehensive testing

## Out of Scope

- Distributed registry (single-process registry only)
- Schema migration tools (manual schema updates)
- Registry persistence (in-memory registry only)
- Network schema synchronization (handled by transport layer)
- Visual registry management UI (may be added later)

## Risk Assessment

**Low Risk**: Message registry is a straightforward data structure with well-defined operations. The main complexity is in version resolution logic, which can be thoroughly tested.

**Mitigation**: Comprehensive unit tests for version resolution, concurrent access testing, and performance benchmarking to ensure scalability.