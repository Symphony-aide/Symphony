# F009: Extension Manifest Schema

> **Parent**: Inherited from M1.5.1 (Manifest Schema)  
> **Status**: [ ] Not Started  
> **Effort**: 2 days  
> **Type**: Infrastructure  

---

## Problem Statement

Symphony's extension ecosystem requires a standardized manifest format to describe extension metadata, dependencies, permissions, and capabilities. Without a well-defined schema, extensions cannot be properly validated, loaded, or managed by the system, preventing the realization of Symphony's extensible architecture vision.

## Solution Approach

Design and implement a comprehensive extension manifest schema that includes:
- TOML-based manifest format for human readability and tooling support
- Complete metadata specification (name, version, author, description)
- Extension type classification (Instruments, Operators, Motifs)
- Dependency declaration with version constraints
- Permission system for security and capability management
- Lifecycle configuration and entry points
- Validation schema with comprehensive error reporting

## Dependencies Analysis

### External Dependencies

| Library | Purpose | Alternative 1 | Alternative 2 | Alternative 3 | Cross-Platform | Local Env | Cloud Env | Consistency & Stability | Maintained | Ecosystem | Limitation 1 | Limitation 2 | Limitation 3 | Decision | Rationale |
|---------|---------|---------------|---------------|---------------|----------------|-----------|-----------|------------------------|------------|-----------|--------------|--------------|--------------|----------|-----------|
| toml 0.8.8 | TOML parsing | serde_yaml | serde_json | custom format | ✅ All platforms | ✅ Works | ✅ Works | ✅ Deterministic | ✅ Active (2024-10) | High | Less common than JSON | Whitespace sensitive | N/A | ✅ Selected | Human-readable, excellent for config files |
| semver 1.0.20 | Version management | version-compare | custom versioning | string versions | ✅ All platforms | ✅ Works | ✅ Works | ✅ Deterministic | ✅ Active (2024-09) | High | Semantic versioning only | N/A | N/A | ✅ Selected | Standard semantic versioning, dependency resolution |
| serde 1.0.193 | Serialization | manual parsing | custom deserializer | N/A | ✅ All platforms | ✅ Works | ✅ Works | ✅ Deterministic | ✅ Active (2024-12) | High | N/A | N/A | N/A | ✅ Selected | Already required, excellent TOML integration |

**Notes**:
- ✅ = Works correctly / Yes
- ❌ = Does not work / No / Critical issue
- ⚠️ = Partial support / Works with caveats
- N/A = Not applicable

### Internal Dependencies

**Requires**: 
- Rust workspace configuration
- Serde ecosystem setup

**Enables**: 
- F010: Manifest Parser (parsing and validation)
- F011: Extension Lifecycle (lifecycle management)
- F012: Permission System (security model)
- Extension loader and registry systems

## Acceptance Criteria

1. **TOML Format**: Manifest uses TOML format for human readability and tool support
2. **Complete Metadata**: All essential extension information captured in schema
3. **Type Classification**: Clear extension type system (Instruments, Operators, Motifs)
4. **Dependency Management**: Semantic versioning with constraint specification
5. **Permission Model**: Granular permission system for security
6. **Validation**: Comprehensive validation with clear error messages
7. **Extensibility**: Schema supports future additions without breaking changes

## Success Metrics

- Schema completeness: 100% of extension requirements captured
- Validation accuracy: All invalid manifests rejected with clear errors
- Parse performance: <1ms for typical manifest files
- Human readability: Non-technical users can understand basic manifests
- Tool support: Standard TOML tools work with Symphony manifests

## User Stories

### Story 1: Extension Manifest Creation
**As an** extension developer  
**I want to** create a manifest file describing my extension  
**So that** Symphony can properly load and manage my extension  

**Example**:
```toml
# symphony-extension.toml
[package]
name = "ai-code-generator"
version = "1.2.0"
description = "AI-powered code generation instrument"
authors = ["Jane Developer <jane@example.com>"]
license = "MIT"
homepage = "https://github.com/jane/ai-code-generator"

[extension]
type = "instrument"
entry_point = "ai_code_generator.main:CodeGenerator"
min_symphony_version = "0.1.0"

[dependencies]
openai-api = "^1.0.0"
tokio = "^1.0.0"

[permissions]
network = ["openai.com", "api.anthropic.com"]
filesystem = ["read", "write"]
ipc = ["send", "receive"]

[lifecycle]
on_load = "initialize"
on_activate = "start_service"
on_deactivate = "stop_service"
on_unload = "cleanup"
```

### Story 2: Extension Type Classification
**As a** Symphony extension manager  
**I want to** understand what type of extension I'm loading  
**So that** I can apply appropriate security policies and integration patterns  

**Example**:
```rust
let manifest = ExtensionManifest::from_file("symphony-extension.toml")?;

match manifest.extension.extension_type {
    ExtensionType::Instrument => {
        // AI/ML model - requires network permissions, high memory
        apply_instrument_policies(&manifest);
    }
    ExtensionType::Operator => {
        // Utility function - minimal permissions, fast startup
        apply_operator_policies(&manifest);
    }
    ExtensionType::Motif => {
        // UI enhancement - requires UI permissions, moderate resources
        apply_motif_policies(&manifest);
    }
}
```

### Story 3: Dependency Resolution
**As a** Symphony package manager  
**I want to** resolve extension dependencies automatically  
**So that** users don't need to manually manage complex dependency trees  

**Example**:
```rust
let manifest = ExtensionManifest::from_file("symphony-extension.toml")?;

for (name, constraint) in &manifest.dependencies {
    let available_versions = registry.get_versions(name)?;
    let compatible_version = constraint.find_compatible(&available_versions)?;
    
    if compatible_version.is_none() {
        return Err(DependencyError::NoCompatibleVersion {
            package: name.clone(),
            constraint: constraint.clone(),
        });
    }
}
```

## Timeline

- **Day 1**: Design manifest schema structure, define all required fields and types
- **Day 2**: Implement TOML serialization/deserialization and comprehensive validation

## Out of Scope

- Manifest parsing implementation (handled by F010)
- Extension loading logic (handled by extension loader)
- Dependency resolution algorithm (handled by package manager)
- Manifest signing/verification (may be added for security)
- Visual manifest editors (may be added later)

## Risk Assessment

**Low Risk**: Manifest schema definition is primarily a design exercise with well-understood requirements. TOML is a mature format with excellent Rust support.

**Mitigation**: Validate schema design with extension developers, comprehensive testing of edge cases, and clear migration path for schema evolution.