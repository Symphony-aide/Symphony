# M4: Extension Ecosystem - Level 2 Decomposition

> **Parent**: [MILESTONES_LEVEL1.md](../MILESTONES_LEVEL1.md)
> **Duration**: 4-5 months
> **Goal**: Complete extension system for community and commercial extensions

---

## 📋 Overview

M4 builds the Orchestra Kit - Symphony's complete extension ecosystem that enables
community and commercial extensions to safely integrate with the platform. This
includes the manifest system, permissions, sandboxing, and the three extension types.

```
M4: Extension Ecosystem
├── M4.1: Manifest System
│   ├── M4.1.1: Full Schema Definition
│   ├── M4.1.2: Capability Declarations
│   ├── M4.1.3: Dependency Specification
│   ├── M4.1.4: Configuration Schema
│   ├── M4.1.5: Resource Requirements
│   ├── M4.1.6: Marketplace Metadata
│   └── M4.1.7: Validation Tests
├── M4.2: Permission Framework
│   ├── M4.2.1: Permission Types
│   ├── M4.2.2: Permission Scopes
│   ├── M4.2.3: Runtime Checker
│   ├── M4.2.4: Policy Engine
│   ├── M4.2.5: Request/Grant Flow
│   ├── M4.2.6: UI Generation
│   └── M4.2.7: Audit Logging
├── M4.3: Process Isolation
│   ├── M4.3.1: Process Spawning
│   ├── M4.3.2: Memory Limits
│   ├── M4.3.3: CPU Limits
│   ├── M4.3.4: Filesystem Sandbox
│   ├── M4.3.5: Network Sandbox
│   ├── M4.3.6: Health Monitoring
│   ├── M4.3.7: Termination
│   └── M4.3.8: Security Tests
├── M4.4: Extension Loader
│   ├── M4.4.1: Discovery
│   ├── M4.4.2: Dependency Resolution
│   ├── M4.4.3: Loading Sequence
│   ├── M4.4.4: Hot Reload
│   ├── M4.4.5: State Machine
│   ├── M4.4.6: Health Checks
│   ├── M4.4.7: Crash Recovery
│   └── M4.4.8: Integration Tests
├── M4.5: Registry & Discovery
│   ├── M4.5.1: Local Registry
│   ├── M4.5.2: Marketplace Client
│   ├── M4.5.3: Search & Filter
│   ├── M4.5.4: Version Management
│   ├── M4.5.5: Signature Verification
│   ├── M4.5.6: Rating System
│   └── M4.5.7: Analytics
└── M4.6: Extension Types
    ├── M4.6.1: Instrument Trait
    ├── M4.6.2: Base Instrument
    ├── M4.6.3: Operator Trait
    ├── M4.6.4: Base Operator
    ├── M4.6.5: Addon Trait
    ├── M4.6.6: Base Addon
    ├── M4.6.7: Example Instrument
    ├── M4.6.8: Example Operator
    └── M4.6.9: Example Addon
```

---

## 📋 M4.1: Manifest System

**Crate**: `symphony-extension-sdk` (extended from M1.5)
**Duration**: 3 weeks
**Dependencies**: M1.5


### M4.1.1: Full Schema Definition (2 days)

**Goal**: Comprehensive manifest schema for all extension metadata

**Deliverables**:
```rust
// src/manifest/schema.rs

/// Complete extension manifest
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionManifest {
    // Identity
    pub id: String,
    pub name: String,
    pub version: Version,
    pub description: String,
    
    // Classification
    pub extension_type: ExtensionType,
    pub category: String,
    pub tags: Vec<String>,
    
    // Capabilities & Requirements
    pub capabilities: Vec<Capability>,
    pub permissions: Vec<Permission>,
    pub dependencies: Vec<Dependency>,
    pub resources: ResourceRequirements,
    
    // Configuration
    pub config_schema: Option<ConfigSchema>,
    pub default_config: Option<Value>,
    
    // Lifecycle
    pub lifecycle: LifecycleConfig,
    pub entry_point: String,
    
    // Marketplace
    pub marketplace: Option<MarketplaceMetadata>,
    
    // Metadata
    pub author: Author,
    pub license: String,
    pub repository: Option<String>,
    pub homepage: Option<String>,
}

/// Extension types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExtensionType {
    Instrument,  // AI/ML models
    Operator,    // Workflow utilities
    Addon,       // UI enhancements
}

/// Author information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Author {
    pub name: String,
    pub email: Option<String>,
    pub url: Option<String>,
}
```

**Tasks**:
- [ ] Define complete `ExtensionManifest` struct
- [ ] Define `ExtensionType` enum
- [ ] Define `Author` struct
- [ ] Add TOML parsing support
- [ ] Add JSON parsing support
- [ ] Write schema documentation
- [ ] Write parsing tests

**Acceptance Criteria**:
- ✅ All extension metadata expressible
- ✅ Both TOML and JSON supported
- ✅ Schema is well-documented

---

### M4.1.2: Capability Declarations (2 days)

**Goal**: Declare what an extension can do

**Deliverables**:
```rust
// src/manifest/capabilities.rs

/// Capability declaration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Capability {
    pub name: String,
    pub version: Version,
    pub description: Option<String>,
}

/// Standard capabilities
pub mod capabilities {
    pub const AI_INFERENCE: &str = "ai.inference";
    pub const AI_TRAINING: &str = "ai.training";
    pub const DATA_TRANSFORM: &str = "data.transform";
    pub const DATA_VALIDATE: &str = "data.validate";
    pub const UI_PANEL: &str = "ui.panel";
    pub const UI_EDITOR: &str = "ui.editor";
    pub const WORKFLOW_NODE: &str = "workflow.node";
    pub const STORAGE_READ: &str = "storage.read";
    pub const STORAGE_WRITE: &str = "storage.write";
}

impl ExtensionManifest {
    /// Check if extension has a capability
    pub fn has_capability(&self, name: &str) -> bool;
    
    /// Get capability by name
    pub fn get_capability(&self, name: &str) -> Option<&Capability>;
    
    /// Validate capabilities are consistent with extension type
    pub fn validate_capabilities(&self) -> Result<(), ValidationError>;
}
```

**Tasks**:
- [ ] Define `Capability` struct
- [ ] Define standard capability constants
- [ ] Implement capability lookup
- [ ] Add capability validation
- [ ] Write capability tests

**Acceptance Criteria**:
- ✅ Standard capabilities cover common use cases
- ✅ Custom capabilities supported
- ✅ Validation catches inconsistencies

---

### M4.1.3: Dependency Specification (2 days)

**Goal**: Specify extension dependencies with version constraints

**Deliverables**:
```rust
// src/manifest/dependencies.rs

/// Dependency specification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Dependency {
    pub id: String,
    pub version_constraint: VersionConstraint,
    pub optional: bool,
    pub features: Vec<String>,
}

/// Version constraint types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VersionConstraint {
    /// Exact version: "=1.2.3"
    Exact(Version),
    /// Minimum version: ">=1.2.3"
    Minimum(Version),
    /// Compatible version: "^1.2.3" (>=1.2.3, <2.0.0)
    Compatible(Version),
    /// Range: ">=1.0.0, <2.0.0"
    Range { min: Version, max: Version },
    /// Any version: "*"
    Any,
}

impl VersionConstraint {
    /// Parse from string (e.g., "^1.2.3", ">=1.0.0")
    pub fn parse(s: &str) -> Result<Self, ParseError>;
    
    /// Check if version satisfies constraint
    pub fn satisfies(&self, version: &Version) -> bool;
}

impl Dependency {
    /// Check if a version satisfies this dependency
    pub fn is_satisfied_by(&self, version: &Version) -> bool;
}
```

**Tasks**:
- [ ] Define `Dependency` struct
- [ ] Define `VersionConstraint` enum
- [ ] Implement constraint parsing
- [ ] Implement satisfaction checking
- [ ] Support optional dependencies
- [ ] Write dependency tests

**Acceptance Criteria**:
- ✅ All common version constraints supported
- ✅ Parsing handles edge cases
- ✅ Satisfaction checking is correct

---

### M4.1.4: Configuration Schema (3 days)

**Goal**: Define configuration options for extensions

**Deliverables**:
```rust
// src/manifest/config.rs

/// Configuration schema definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigSchema {
    pub properties: Vec<ConfigProperty>,
    pub required: Vec<String>,
}

/// Configuration property
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigProperty {
    pub name: String,
    pub display_name: String,
    pub description: String,
    pub property_type: ConfigType,
    pub default: Option<Value>,
    pub constraints: Vec<ConfigConstraint>,
    pub ui_hints: ConfigUIHints,
}

/// Configuration types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConfigType {
    String,
    Integer,
    Float,
    Boolean,
    Enum(Vec<EnumOption>),
    Array(Box<ConfigType>),
    Object(ConfigSchema),
    Secret,  // Encrypted storage
    Path,    // File/directory path
    Url,     // URL validation
}

/// Enum option for select fields
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnumOption {
    pub value: String,
    pub label: String,
    pub description: Option<String>,
}

/// Configuration constraints
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConfigConstraint {
    MinLength(usize),
    MaxLength(usize),
    MinValue(f64),
    MaxValue(f64),
    Pattern(String),
    PathExists,
    UrlReachable,
}

impl ConfigSchema {
    /// Validate a configuration value
    pub fn validate(&self, config: &Value) -> Result<(), Vec<ValidationError>>;
    
    /// Apply defaults to partial config
    pub fn apply_defaults(&self, config: &mut Value);
    
    /// Generate JSON Schema for UI
    pub fn to_json_schema(&self) -> Value;
}
```

**Tasks**:
- [ ] Define `ConfigSchema` struct
- [ ] Define `ConfigProperty` struct
- [ ] Define `ConfigType` enum
- [ ] Implement validation
- [ ] Implement default application
- [ ] Generate JSON Schema for UI
- [ ] Write config tests

**Acceptance Criteria**:
- ✅ All common config types supported
- ✅ Validation catches invalid configs
- ✅ JSON Schema enables UI generation

---

### M4.1.5: Resource Requirements (2 days)

**Goal**: Specify resource needs for extensions

**Deliverables**:
```rust
// src/manifest/resources.rs

/// Resource requirements
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceRequirements {
    pub memory: MemoryRequirement,
    pub cpu: CpuRequirement,
    pub gpu: Option<GpuRequirement>,
    pub storage: StorageRequirement,
    pub network: NetworkRequirement,
}

/// Memory requirements
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryRequirement {
    pub minimum_mb: u64,
    pub recommended_mb: u64,
    pub maximum_mb: Option<u64>,
}

/// CPU requirements
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CpuRequirement {
    pub minimum_cores: f32,
    pub recommended_cores: f32,
    pub supports_multithreading: bool,
}

/// GPU requirements
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuRequirement {
    pub required: bool,
    pub minimum_vram_mb: u64,
    pub cuda_version: Option<String>,
    pub supported_backends: Vec<String>,
}

/// Storage requirements
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageRequirement {
    pub minimum_mb: u64,
    pub recommended_mb: u64,
    pub requires_ssd: bool,
}

/// Network requirements
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkRequirement {
    pub requires_internet: bool,
    pub bandwidth_mbps: Option<u32>,
    pub allowed_hosts: Vec<String>,
}

impl ResourceRequirements {
    /// Check if system meets requirements
    pub fn check_system(&self) -> ResourceCheckResult;
    
    /// Get resource allocation for sandbox
    pub fn to_sandbox_limits(&self) -> SandboxLimits;
}
```

**Tasks**:
- [ ] Define `ResourceRequirements` struct
- [ ] Define memory, CPU, GPU requirements
- [ ] Define storage, network requirements
- [ ] Implement system checking
- [ ] Convert to sandbox limits
- [ ] Write resource tests

**Acceptance Criteria**:
- ✅ All resource types specifiable
- ✅ System checking works on all platforms
- ✅ Sandbox limits derived correctly

---

### M4.1.6: Marketplace Metadata (2 days)

**Goal**: Metadata for marketplace listing

**Deliverables**:
```rust
// src/manifest/marketplace.rs

/// Marketplace metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketplaceMetadata {
    pub short_description: String,
    pub long_description: String,
    pub screenshots: Vec<Screenshot>,
    pub videos: Vec<Video>,
    pub pricing: PricingModel,
    pub support: SupportInfo,
    pub changelog: Vec<ChangelogEntry>,
}

/// Screenshot information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Screenshot {
    pub url: String,
    pub caption: String,
    pub thumbnail_url: Option<String>,
}

/// Pricing model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PricingModel {
    Free,
    OneTime { price_usd: f64 },
    Subscription { monthly_usd: f64, yearly_usd: Option<f64> },
    PayPerUse { rate: String },
    Freemium { free_tier: String, paid_features: Vec<String> },
}

/// Support information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SupportInfo {
    pub email: Option<String>,
    pub url: Option<String>,
    pub documentation_url: Option<String>,
    pub issues_url: Option<String>,
}

/// Changelog entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChangelogEntry {
    pub version: Version,
    pub date: String,
    pub changes: Vec<String>,
}
```

**Tasks**:
- [ ] Define `MarketplaceMetadata` struct
- [ ] Define `PricingModel` enum
- [ ] Define `SupportInfo` struct
- [ ] Add changelog support
- [ ] Validate marketplace metadata
- [ ] Write marketplace tests

**Acceptance Criteria**:
- ✅ All marketplace fields supported
- ✅ Multiple pricing models available
- ✅ Changelog tracks version history

---

### M4.1.7: Validation Tests (2 days)

**Goal**: Comprehensive manifest validation

**Tasks**:
- [ ] Test valid manifests parse correctly
- [ ] Test invalid manifests rejected
- [ ] Test capability validation
- [ ] Test dependency validation
- [ ] Test config schema validation
- [ ] Test resource requirement validation
- [ ] Property tests for round-trip
- [ ] Achieve >90% coverage

---

## 🔒 M4.2: Permission Framework

**Crate**: `symphony-permissions`
**Duration**: 3 weeks
**Dependencies**: M4.1


### M4.2.1: Permission Types (2 days)

**Goal**: Define all permission types for extension security

**Deliverables**:
```rust
// src/types.rs

/// Permission types
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum PermissionType {
    /// File system access
    FileSystem(FileSystemPermission),
    /// Network access
    Network(NetworkPermission),
    /// System access
    System(SystemPermission),
    /// AI model access
    Model(ModelPermission),
    /// IPC communication
    Ipc(IpcPermission),
    /// User data access
    UserData(UserDataPermission),
}

/// File system permission
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct FileSystemPermission {
    pub path_pattern: String,  // Glob pattern
    pub operations: FileOperations,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct FileOperations {
    pub read: bool,
    pub write: bool,
    pub delete: bool,
    pub execute: bool,
}

/// Network permission
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct NetworkPermission {
    pub host_pattern: String,  // Glob pattern for hosts
    pub ports: Vec<PortRange>,
    pub protocols: Vec<Protocol>,
}

/// System permission
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SystemPermission {
    Environment,      // Read environment variables
    ProcessSpawn,     // Spawn child processes
    Clipboard,        // Access clipboard
    Notifications,    // Show notifications
    SystemInfo,       // Read system information
}

/// Model permission
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ModelPermission {
    pub model_pattern: String,  // Glob pattern for model IDs
    pub operations: ModelOperations,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ModelOperations {
    pub invoke: bool,
    pub configure: bool,
    pub train: bool,
}
```

**Tasks**:
- [ ] Define `PermissionType` enum
- [ ] Define `FileSystemPermission`
- [ ] Define `NetworkPermission`
- [ ] Define `SystemPermission`
- [ ] Define `ModelPermission`
- [ ] Define `IpcPermission`
- [ ] Define `UserDataPermission`
- [ ] Write permission type tests

**Acceptance Criteria**:
- ✅ All security-relevant operations covered
- ✅ Permissions are granular
- ✅ Pattern matching supports common use cases

---

### M4.2.2: Permission Scopes (2 days)

**Goal**: Define permission scopes and levels

**Deliverables**:
```rust
// src/scopes.rs

/// Permission scope
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum PermissionScope {
    /// Single operation
    Once,
    /// Current session only
    Session,
    /// Persistent until revoked
    Persistent,
    /// Time-limited
    TimeLimited { expires_at: DateTime<Utc> },
}

/// Permission level
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum PermissionLevel {
    /// No access
    None = 0,
    /// Read-only access
    Read = 1,
    /// Read and write access
    ReadWrite = 2,
    /// Full access including delete
    Full = 3,
    /// Administrative access
    Admin = 4,
}

/// Complete permission with scope
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Permission {
    pub permission_type: PermissionType,
    pub scope: PermissionScope,
    pub level: PermissionLevel,
    pub reason: String,
}

impl Permission {
    /// Check if this permission covers another
    pub fn covers(&self, other: &Permission) -> bool;
    
    /// Check if permission is still valid
    pub fn is_valid(&self) -> bool;
}
```

**Tasks**:
- [ ] Define `PermissionScope` enum
- [ ] Define `PermissionLevel` enum
- [ ] Define `Permission` struct
- [ ] Implement coverage checking
- [ ] Implement validity checking
- [ ] Write scope tests

**Acceptance Criteria**:
- ✅ Scopes cover all use cases
- ✅ Levels are properly ordered
- ✅ Coverage checking is correct

---

### M4.2.3: Runtime Checker (3 days)

**Goal**: Check permissions at runtime

**Deliverables**:
```rust
// src/checker.rs

/// Permission check result
#[derive(Debug, Clone)]
pub enum CheckResult {
    Allowed,
    Denied { reason: String },
    NeedsPrompt { permission: Permission },
}

/// Runtime permission checker
pub struct PermissionChecker {
    granted: HashMap<String, Vec<Permission>>,  // extension_id -> permissions
    policy: PermissionPolicy,
}

impl PermissionChecker {
    pub fn new(policy: PermissionPolicy) -> Self;
    
    /// Check if extension has permission
    pub fn check(&self, extension_id: &str, permission: &Permission) -> CheckResult;
    
    /// Check file access
    pub fn check_file_access(&self, extension_id: &str, path: &Path, ops: FileOperations) -> CheckResult;
    
    /// Check network access
    pub fn check_network_access(&self, extension_id: &str, host: &str, port: u16) -> CheckResult;
    
    /// Check model access
    pub fn check_model_access(&self, extension_id: &str, model_id: &str, op: ModelOperation) -> CheckResult;
    
    /// Grant permission
    pub fn grant(&mut self, extension_id: &str, permission: Permission);
    
    /// Revoke permission
    pub fn revoke(&mut self, extension_id: &str, permission_type: &PermissionType);
    
    /// Revoke all permissions for extension
    pub fn revoke_all(&mut self, extension_id: &str);
}
```

**Tasks**:
- [ ] Implement `PermissionChecker` struct
- [ ] Implement permission checking
- [ ] Implement file access checking
- [ ] Implement network access checking
- [ ] Implement model access checking
- [ ] Implement grant/revoke
- [ ] Add caching for performance
- [ ] Write checker tests

**Acceptance Criteria**:
- ✅ All operations checked correctly
- ✅ Check latency <0.01ms
- ✅ Grant/revoke works correctly

---

### M4.2.4: Policy Engine (2 days)

**Goal**: Configurable permission policies

**Deliverables**:
```rust
// src/policy.rs

/// Permission policy
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionPolicy {
    pub default_action: PolicyAction,
    pub rules: Vec<PolicyRule>,
}

/// Policy action
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PolicyAction {
    Allow,
    Deny,
    Prompt,
}

/// Policy rule
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PolicyRule {
    pub name: String,
    pub condition: PolicyCondition,
    pub action: PolicyAction,
    pub priority: i32,
}

/// Policy condition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PolicyCondition {
    ExtensionId(String),
    ExtensionType(ExtensionType),
    PermissionType(String),
    Publisher(String),
    Verified(bool),
    And(Vec<PolicyCondition>),
    Or(Vec<PolicyCondition>),
    Not(Box<PolicyCondition>),
}

impl PermissionPolicy {
    /// Evaluate policy for a permission request
    pub fn evaluate(&self, ctx: &PolicyContext) -> PolicyAction;
    
    /// Load from file
    pub fn load(path: &Path) -> Result<Self, PolicyError>;
    
    /// Save to file
    pub fn save(&self, path: &Path) -> Result<(), PolicyError>;
}

/// Built-in policies
pub mod policies {
    pub fn strict() -> PermissionPolicy;      // Deny by default
    pub fn permissive() -> PermissionPolicy;  // Allow by default
    pub fn balanced() -> PermissionPolicy;    // Prompt for sensitive
}
```

**Tasks**:
- [ ] Define `PermissionPolicy` struct
- [ ] Define `PolicyRule` struct
- [ ] Define `PolicyCondition` enum
- [ ] Implement policy evaluation
- [ ] Create built-in policies
- [ ] Add policy persistence
- [ ] Write policy tests

**Acceptance Criteria**:
- ✅ Policies are flexible and composable
- ✅ Built-in policies cover common needs
- ✅ Policy evaluation is fast

---

### M4.2.5: Request/Grant Flow (2 days)

**Goal**: User-facing permission request flow

**Deliverables**:
```rust
// src/flow.rs

/// Permission request
#[derive(Debug, Clone)]
pub struct PermissionRequest {
    pub id: RequestId,
    pub extension_id: String,
    pub extension_name: String,
    pub permissions: Vec<Permission>,
    pub requested_at: DateTime<Utc>,
}

/// Permission response
#[derive(Debug, Clone)]
pub enum PermissionResponse {
    Granted { scope: PermissionScope },
    Denied { reason: Option<String> },
    Deferred,
}

/// Permission flow manager
pub struct PermissionFlowManager {
    pending: HashMap<RequestId, PermissionRequest>,
    checker: PermissionChecker,
}

impl PermissionFlowManager {
    /// Request permissions (may prompt user)
    pub async fn request(&mut self, request: PermissionRequest) -> PermissionResponse;
    
    /// Respond to pending request
    pub fn respond(&mut self, request_id: RequestId, response: PermissionResponse);
    
    /// Get pending requests
    pub fn pending_requests(&self) -> Vec<&PermissionRequest>;
    
    /// Cancel pending request
    pub fn cancel(&mut self, request_id: RequestId);
}
```

**Tasks**:
- [ ] Define `PermissionRequest` struct
- [ ] Define `PermissionResponse` enum
- [ ] Implement `PermissionFlowManager`
- [ ] Handle async user prompts
- [ ] Support batch requests
- [ ] Write flow tests

**Acceptance Criteria**:
- ✅ Flow handles async user interaction
- ✅ Batch requests work correctly
- ✅ Pending requests tracked properly

---

### M4.2.6: UI Generation (2 days)

**Goal**: Generate permission UI from requests

**Deliverables**:
```rust
// src/ui.rs

/// Permission UI data
#[derive(Debug, Clone, Serialize)]
pub struct PermissionUIData {
    pub title: String,
    pub description: String,
    pub icon: String,
    pub risk_level: RiskLevel,
    pub details: Vec<PermissionDetail>,
    pub recommendations: Vec<String>,
}

/// Risk level for UI display
#[derive(Debug, Clone, Serialize)]
pub enum RiskLevel {
    Low,
    Medium,
    High,
    Critical,
}

/// Permission detail for UI
#[derive(Debug, Clone, Serialize)]
pub struct PermissionDetail {
    pub category: String,
    pub description: String,
    pub examples: Vec<String>,
}

impl Permission {
    /// Generate UI data for this permission
    pub fn to_ui_data(&self) -> PermissionUIData;
}

impl PermissionRequest {
    /// Generate complete UI data for request
    pub fn to_ui_data(&self) -> Vec<PermissionUIData>;
    
    /// Get overall risk level
    pub fn risk_level(&self) -> RiskLevel;
}
```

**Tasks**:
- [ ] Define `PermissionUIData` struct
- [ ] Define `RiskLevel` enum
- [ ] Implement UI data generation
- [ ] Add risk level calculation
- [ ] Generate human-readable descriptions
- [ ] Write UI generation tests

**Acceptance Criteria**:
- ✅ UI data is human-readable
- ✅ Risk levels are accurate
- ✅ All permission types have good descriptions

---

### M4.2.7: Audit Logging (2 days)

**Goal**: Log all permission decisions

**Deliverables**:
```rust
// src/audit.rs

/// Permission audit entry
#[derive(Debug, Clone, Serialize)]
pub struct PermissionAuditEntry {
    pub id: AuditEntryId,
    pub timestamp: DateTime<Utc>,
    pub extension_id: String,
    pub permission: Permission,
    pub action: AuditAction,
    pub result: CheckResult,
    pub context: HashMap<String, Value>,
}

/// Audit action types
#[derive(Debug, Clone, Serialize)]
pub enum AuditAction {
    Check,
    Grant,
    Revoke,
    Request,
    Deny,
}

/// Permission audit log
pub struct PermissionAuditLog {
    storage: Box<dyn AuditStorage>,
}

impl PermissionAuditLog {
    /// Log a permission event
    pub async fn log(&self, entry: PermissionAuditEntry) -> Result<(), AuditError>;
    
    /// Query audit log
    pub async fn query(&self, query: AuditQuery) -> Result<Vec<PermissionAuditEntry>, AuditError>;
    
    /// Get entries for extension
    pub async fn for_extension(&self, extension_id: &str) -> Result<Vec<PermissionAuditEntry>, AuditError>;
    
    /// Export audit log
    pub async fn export(&self, format: ExportFormat) -> Result<Vec<u8>, AuditError>;
}
```

**Tasks**:
- [ ] Define `PermissionAuditEntry` struct
- [ ] Implement `PermissionAuditLog`
- [ ] Add query support
- [ ] Add export functionality
- [ ] Integrate with checker
- [ ] Write audit tests

**Acceptance Criteria**:
- ✅ All permission decisions logged
- ✅ Query returns results quickly
- ✅ Export supports common formats

---

## 🔐 M4.3: Process Isolation

**Crate**: `symphony-sandbox`
**Duration**: 4 weeks
**Dependencies**: M4.2


### M4.3.1: Process Spawning (3 days)

**Goal**: Spawn extension processes with isolation

**Deliverables**:
```rust
// src/process.rs

/// Sandbox configuration
#[derive(Debug, Clone)]
pub struct SandboxConfig {
    pub limits: ResourceLimits,
    pub filesystem: FilesystemConfig,
    pub network: NetworkConfig,
    pub environment: HashMap<String, String>,
}

/// Resource limits
#[derive(Debug, Clone)]
pub struct ResourceLimits {
    pub memory_mb: u64,
    pub cpu_percent: f32,
    pub max_threads: u32,
    pub max_file_descriptors: u32,
}

/// Sandboxed process handle
pub struct SandboxedProcess {
    pid: u32,
    config: SandboxConfig,
    status: ProcessStatus,
    ipc_channel: IpcChannel,
}

impl SandboxedProcess {
    /// Spawn a new sandboxed process
    pub async fn spawn(
        executable: &Path,
        args: &[String],
        config: SandboxConfig,
    ) -> Result<Self, SpawnError>;
    
    /// Get process status
    pub fn status(&self) -> ProcessStatus;
    
    /// Send message to process
    pub async fn send(&self, msg: &[u8]) -> Result<(), IpcError>;
    
    /// Receive message from process
    pub async fn receive(&self) -> Result<Vec<u8>, IpcError>;
    
    /// Wait for process to exit
    pub async fn wait(&mut self) -> Result<ExitStatus, ProcessError>;
}

/// Process status
#[derive(Debug, Clone)]
pub enum ProcessStatus {
    Starting,
    Running,
    Suspended,
    Exited(ExitStatus),
}
```

**Tasks**:
- [ ] Define `SandboxConfig` struct
- [ ] Define `SandboxedProcess` struct
- [ ] Implement process spawning
- [ ] Set up IPC channel
- [ ] Handle process lifecycle
- [ ] Write spawn tests

**Acceptance Criteria**:
- ✅ Processes spawn in isolation
- ✅ IPC channel works reliably
- ✅ Process status tracked correctly

---

### M4.3.2: Memory Limits (2 days)

**Goal**: Enforce memory limits on sandboxed processes

**Deliverables**:
```rust
// src/limits/memory.rs

/// Memory limiter
pub struct MemoryLimiter {
    limit_bytes: u64,
    current_usage: AtomicU64,
}

impl MemoryLimiter {
    pub fn new(limit_mb: u64) -> Self;
    
    /// Apply memory limit to process
    pub fn apply(&self, pid: u32) -> Result<(), LimitError>;
    
    /// Get current memory usage
    pub fn current_usage(&self, pid: u32) -> Result<u64, LimitError>;
    
    /// Check if limit exceeded
    pub fn is_exceeded(&self, pid: u32) -> Result<bool, LimitError>;
}

// Platform-specific implementations
#[cfg(target_os = "linux")]
mod linux {
    use cgroups_rs::*;
    
    pub fn apply_memory_limit(pid: u32, limit_bytes: u64) -> Result<(), LimitError> {
        // Use cgroups v2 memory controller
    }
}

#[cfg(target_os = "windows")]
mod windows {
    use windows::Win32::System::JobObjects::*;
    
    pub fn apply_memory_limit(pid: u32, limit_bytes: u64) -> Result<(), LimitError> {
        // Use Job Objects
    }
}

#[cfg(target_os = "macos")]
mod macos {
    pub fn apply_memory_limit(pid: u32, limit_bytes: u64) -> Result<(), LimitError> {
        // Use sandbox-exec or resource limits
    }
}
```

**Tasks**:
- [ ] Implement Linux memory limits (cgroups)
- [ ] Implement Windows memory limits (Job Objects)
- [ ] Implement macOS memory limits
- [ ] Add memory usage monitoring
- [ ] Handle limit exceeded events
- [ ] Write memory limit tests

**Acceptance Criteria**:
- ✅ Memory limits enforced within 10%
- ✅ Works on all platforms
- ✅ Exceeded limits trigger cleanup

---

### M4.3.3: CPU Limits (2 days)

**Goal**: Enforce CPU limits on sandboxed processes

**Deliverables**:
```rust
// src/limits/cpu.rs

/// CPU limiter
pub struct CpuLimiter {
    cpu_percent: f32,
    cpu_cores: f32,
}

impl CpuLimiter {
    pub fn new(cpu_percent: f32, cpu_cores: f32) -> Self;
    
    /// Apply CPU limit to process
    pub fn apply(&self, pid: u32) -> Result<(), LimitError>;
    
    /// Get current CPU usage
    pub fn current_usage(&self, pid: u32) -> Result<f32, LimitError>;
}

// Platform-specific implementations similar to memory
```

**Tasks**:
- [ ] Implement Linux CPU limits (cgroups)
- [ ] Implement Windows CPU limits (Job Objects)
- [ ] Implement macOS CPU limits
- [ ] Add CPU usage monitoring
- [ ] Write CPU limit tests

**Acceptance Criteria**:
- ✅ CPU limits enforced within 20%
- ✅ Works on all platforms
- ✅ Monitoring is accurate

---

### M4.3.4: Filesystem Sandbox (4 days)

**Goal**: Restrict filesystem access for sandboxed processes

**Deliverables**:
```rust
// src/filesystem.rs

/// Filesystem sandbox configuration
#[derive(Debug, Clone)]
pub struct FilesystemConfig {
    pub root_path: PathBuf,
    pub allowed_paths: Vec<PathPermission>,
    pub denied_paths: Vec<PathBuf>,
    pub read_only: bool,
}

/// Path permission
#[derive(Debug, Clone)]
pub struct PathPermission {
    pub path: PathBuf,
    pub operations: FileOperations,
}

/// Filesystem sandbox
pub struct FilesystemSandbox {
    config: FilesystemConfig,
}

impl FilesystemSandbox {
    pub fn new(config: FilesystemConfig) -> Self;
    
    /// Apply filesystem restrictions
    pub fn apply(&self, pid: u32) -> Result<(), SandboxError>;
    
    /// Check if path access is allowed
    pub fn check_access(&self, path: &Path, op: FileOperation) -> bool;
    
    /// Create sandbox root directory
    pub fn create_root(&self) -> Result<(), SandboxError>;
    
    /// Cleanup sandbox
    pub fn cleanup(&self) -> Result<(), SandboxError>;
}

// Platform-specific implementations
#[cfg(target_os = "linux")]
mod linux {
    pub fn apply_filesystem_sandbox(pid: u32, config: &FilesystemConfig) -> Result<(), SandboxError> {
        // Use namespaces and bind mounts
    }
}

#[cfg(target_os = "macos")]
mod macos {
    pub fn apply_filesystem_sandbox(pid: u32, config: &FilesystemConfig) -> Result<(), SandboxError> {
        // Use sandbox-exec profiles
    }
}

#[cfg(target_os = "windows")]
mod windows {
    pub fn apply_filesystem_sandbox(pid: u32, config: &FilesystemConfig) -> Result<(), SandboxError> {
        // Use AppContainer or restricted tokens
    }
}
```

**Tasks**:
- [ ] Define `FilesystemConfig` struct
- [ ] Implement Linux filesystem sandbox (namespaces)
- [ ] Implement macOS filesystem sandbox (sandbox-exec)
- [ ] Implement Windows filesystem sandbox
- [ ] Add path validation
- [ ] Implement cleanup
- [ ] Write filesystem sandbox tests

**Acceptance Criteria**:
- ✅ Extensions cannot access unauthorized paths
- ✅ Works on all platforms
- ✅ Cleanup removes all sandbox artifacts

---

### M4.3.5: Network Sandbox (3 days)

**Goal**: Restrict network access for sandboxed processes

**Deliverables**:
```rust
// src/network.rs

/// Network sandbox configuration
#[derive(Debug, Clone)]
pub struct NetworkConfig {
    pub enabled: bool,
    pub allowed_hosts: Vec<HostPermission>,
    pub denied_hosts: Vec<String>,
    pub allowed_ports: Vec<PortRange>,
}

/// Host permission
#[derive(Debug, Clone)]
pub struct HostPermission {
    pub pattern: String,  // Glob pattern
    pub ports: Vec<PortRange>,
    pub protocols: Vec<Protocol>,
}

/// Network sandbox
pub struct NetworkSandbox {
    config: NetworkConfig,
}

impl NetworkSandbox {
    pub fn new(config: NetworkConfig) -> Self;
    
    /// Apply network restrictions
    pub fn apply(&self, pid: u32) -> Result<(), SandboxError>;
    
    /// Check if connection is allowed
    pub fn check_connection(&self, host: &str, port: u16, protocol: Protocol) -> bool;
}

// Platform-specific implementations
#[cfg(target_os = "linux")]
mod linux {
    pub fn apply_network_sandbox(pid: u32, config: &NetworkConfig) -> Result<(), SandboxError> {
        // Use network namespaces and iptables/nftables
    }
}
```

**Tasks**:
- [ ] Define `NetworkConfig` struct
- [ ] Implement Linux network sandbox
- [ ] Implement macOS network sandbox
- [ ] Implement Windows network sandbox
- [ ] Add connection validation
- [ ] Write network sandbox tests

**Acceptance Criteria**:
- ✅ Unauthorized connections blocked
- ✅ Works on all platforms
- ✅ Allowed connections work normally

---

### M4.3.6: Health Monitoring (2 days)

**Goal**: Monitor sandboxed process health

**Deliverables**:
```rust
// src/health.rs

/// Process health status
#[derive(Debug, Clone)]
pub struct ProcessHealth {
    pub pid: u32,
    pub status: ProcessStatus,
    pub memory_usage: u64,
    pub cpu_usage: f32,
    pub uptime: Duration,
    pub last_activity: DateTime<Utc>,
}

/// Health monitor
pub struct HealthMonitor {
    processes: HashMap<u32, ProcessHealth>,
    check_interval: Duration,
}

impl HealthMonitor {
    pub fn new(check_interval: Duration) -> Self;
    
    /// Start monitoring a process
    pub fn monitor(&mut self, process: &SandboxedProcess);
    
    /// Stop monitoring a process
    pub fn unmonitor(&mut self, pid: u32);
    
    /// Get health status
    pub fn health(&self, pid: u32) -> Option<&ProcessHealth>;
    
    /// Check if process is healthy
    pub fn is_healthy(&self, pid: u32) -> bool;
    
    /// Get unhealthy processes
    pub fn unhealthy_processes(&self) -> Vec<u32>;
}
```

**Tasks**:
- [ ] Define `ProcessHealth` struct
- [ ] Implement `HealthMonitor`
- [ ] Add periodic health checks
- [ ] Detect hung processes
- [ ] Detect resource exhaustion
- [ ] Write health monitoring tests

**Acceptance Criteria**:
- ✅ Health checks detect failures within 1s
- ✅ Resource usage tracked accurately
- ✅ Hung processes detected

---

### M4.3.7: Termination (2 days)

**Goal**: Graceful and forced process termination

**Deliverables**:
```rust
// src/termination.rs

impl SandboxedProcess {
    /// Request graceful shutdown
    pub async fn shutdown(&mut self, timeout: Duration) -> Result<ExitStatus, TerminationError>;
    
    /// Force kill process
    pub fn kill(&mut self) -> Result<(), TerminationError>;
    
    /// Terminate with cleanup
    pub async fn terminate(&mut self) -> Result<(), TerminationError> {
        // 1. Send shutdown signal
        // 2. Wait for graceful exit
        // 3. Force kill if timeout
        // 4. Cleanup sandbox resources
    }
}

/// Termination manager for multiple processes
pub struct TerminationManager {
    processes: Vec<SandboxedProcess>,
}

impl TerminationManager {
    /// Terminate all processes
    pub async fn terminate_all(&mut self, timeout: Duration) -> Vec<Result<(), TerminationError>>;
}
```

**Tasks**:
- [ ] Implement graceful shutdown
- [ ] Implement force kill
- [ ] Add timeout handling
- [ ] Implement resource cleanup
- [ ] Handle zombie processes
- [ ] Write termination tests

**Acceptance Criteria**:
- ✅ Graceful shutdown works when possible
- ✅ Force kill always succeeds
- ✅ Resources cleaned up properly

---

### M4.3.8: Security Tests (3 days)

**Goal**: Test sandbox security

**Tasks**:
- [ ] Test filesystem escape attempts
- [ ] Test network bypass attempts
- [ ] Test resource limit bypass
- [ ] Test privilege escalation
- [ ] Test IPC security
- [ ] Fuzz test sandbox boundaries
- [ ] Document security model

**Acceptance Criteria**:
- ✅ No sandbox escapes found
- ✅ All bypass attempts blocked
- ✅ Security model documented

---

## 📦 M4.4: Extension Loader

**Crate**: `symphony-extension-loader`
**Duration**: 3 weeks
**Dependencies**: M4.1, M4.3


### M4.4.1: Discovery (2 days)

**Goal**: Discover extensions in configured locations

**Deliverables**:
```rust
// src/discovery.rs

/// Extension discovery configuration
#[derive(Debug, Clone)]
pub struct DiscoveryConfig {
    pub search_paths: Vec<PathBuf>,
    pub include_builtin: bool,
    pub include_user: bool,
    pub include_workspace: bool,
}

/// Discovered extension
#[derive(Debug, Clone)]
pub struct DiscoveredExtension {
    pub manifest: ExtensionManifest,
    pub path: PathBuf,
    pub source: ExtensionSource,
}

/// Extension source
#[derive(Debug, Clone)]
pub enum ExtensionSource {
    Builtin,
    User,
    Workspace,
    External(String),
}

/// Extension discoverer
pub struct ExtensionDiscoverer {
    config: DiscoveryConfig,
}

impl ExtensionDiscoverer {
    pub fn new(config: DiscoveryConfig) -> Self;
    
    /// Discover all extensions
    pub async fn discover(&self) -> Result<Vec<DiscoveredExtension>, DiscoveryError>;
    
    /// Discover extensions in a specific path
    pub async fn discover_in(&self, path: &Path) -> Result<Vec<DiscoveredExtension>, DiscoveryError>;
    
    /// Watch for new extensions
    pub fn watch(&self) -> Receiver<DiscoveryEvent>;
}
```

**Tasks**:
- [ ] Define `DiscoveryConfig` struct
- [ ] Implement directory scanning
- [ ] Parse manifests during discovery
- [ ] Support multiple sources
- [ ] Add file watching
- [ ] Write discovery tests

**Acceptance Criteria**:
- ✅ All configured paths scanned
- ✅ Invalid extensions skipped with warning
- ✅ File watching detects new extensions

---

### M4.4.2: Dependency Resolution (3 days)

**Goal**: Resolve extension dependencies with version constraints

**Deliverables**:
```rust
// src/resolver.rs

/// Dependency resolution result
#[derive(Debug)]
pub struct ResolutionResult {
    pub resolved: Vec<ResolvedExtension>,
    pub conflicts: Vec<DependencyConflict>,
    pub missing: Vec<MissingDependency>,
}

/// Resolved extension with version
#[derive(Debug)]
pub struct ResolvedExtension {
    pub extension: DiscoveredExtension,
    pub resolved_version: Version,
    pub dependencies: Vec<ResolvedExtension>,
}

/// Dependency conflict
#[derive(Debug)]
pub struct DependencyConflict {
    pub extension_id: String,
    pub required_by: Vec<(String, VersionConstraint)>,
    pub available: Vec<Version>,
}

/// Dependency resolver
pub struct DependencyResolver {
    available: HashMap<String, Vec<DiscoveredExtension>>,
}

impl DependencyResolver {
    pub fn new() -> Self;
    
    /// Add available extensions
    pub fn add_available(&mut self, extensions: Vec<DiscoveredExtension>);
    
    /// Resolve dependencies for extensions
    pub fn resolve(&self, requested: &[String]) -> ResolutionResult;
    
    /// Get load order (topologically sorted)
    pub fn load_order(&self, resolved: &[ResolvedExtension]) -> Vec<&ResolvedExtension>;
}
```

**Tasks**:
- [ ] Implement `DependencyResolver`
- [ ] Implement version constraint solving
- [ ] Detect conflicts
- [ ] Handle optional dependencies
- [ ] Calculate load order
- [ ] Write resolution tests

**Acceptance Criteria**:
- ✅ Complex dependency graphs resolved
- ✅ Conflicts detected and reported
- ✅ Load order respects dependencies

---

### M4.4.3: Loading Sequence (2 days)

**Goal**: Load extensions in correct order

**Deliverables**:
```rust
// src/loader.rs

/// Extension loader
pub struct ExtensionLoader {
    discoverer: ExtensionDiscoverer,
    resolver: DependencyResolver,
    sandbox_factory: SandboxFactory,
    loaded: HashMap<String, LoadedExtension>,
}

/// Loaded extension
pub struct LoadedExtension {
    pub manifest: ExtensionManifest,
    pub process: Option<SandboxedProcess>,  // None for in-process
    pub state: ExtensionState,
    pub loaded_at: DateTime<Utc>,
}

impl ExtensionLoader {
    pub fn new(config: LoaderConfig) -> Self;
    
    /// Load all discovered extensions
    pub async fn load_all(&mut self) -> Result<LoadResult, LoadError>;
    
    /// Load specific extension
    pub async fn load(&mut self, extension_id: &str) -> Result<&LoadedExtension, LoadError>;
    
    /// Unload extension
    pub async fn unload(&mut self, extension_id: &str) -> Result<(), UnloadError>;
    
    /// Get loaded extension
    pub fn get(&self, extension_id: &str) -> Option<&LoadedExtension>;
    
    /// List loaded extensions
    pub fn list(&self) -> Vec<&LoadedExtension>;
}
```

**Tasks**:
- [ ] Implement `ExtensionLoader`
- [ ] Load in dependency order
- [ ] Handle load failures gracefully
- [ ] Support partial loading
- [ ] Implement unloading
- [ ] Write loading tests

**Acceptance Criteria**:
- ✅ Extensions load in correct order
- ✅ Load failures don't break other extensions
- ✅ Unloading cleans up properly

---

### M4.4.4: Hot Reload (3 days)

**Goal**: Reload extensions without restart

**Deliverables**:
```rust
// src/hot_reload.rs

/// Hot reload configuration
#[derive(Debug, Clone)]
pub struct HotReloadConfig {
    pub enabled: bool,
    pub watch_paths: Vec<PathBuf>,
    pub debounce_ms: u64,
}

/// Hot reload manager
pub struct HotReloadManager {
    loader: ExtensionLoader,
    config: HotReloadConfig,
    watcher: FileWatcher,
}

impl HotReloadManager {
    pub fn new(loader: ExtensionLoader, config: HotReloadConfig) -> Self;
    
    /// Start watching for changes
    pub fn start(&mut self) -> Result<(), HotReloadError>;
    
    /// Stop watching
    pub fn stop(&mut self);
    
    /// Manually trigger reload
    pub async fn reload(&mut self, extension_id: &str) -> Result<(), HotReloadError>;
    
    /// Get reload events
    pub fn events(&self) -> Receiver<HotReloadEvent>;
}

/// Hot reload event
#[derive(Debug)]
pub enum HotReloadEvent {
    Reloading { extension_id: String },
    Reloaded { extension_id: String },
    Failed { extension_id: String, error: String },
}
```

**Tasks**:
- [ ] Implement file watching
- [ ] Implement reload logic
- [ ] Handle state preservation
- [ ] Add debouncing
- [ ] Emit reload events
- [ ] Write hot reload tests

**Acceptance Criteria**:
- ✅ Changes detected within 1s
- ✅ Reload preserves extension state
- ✅ Failed reloads don't break system

---

### M4.4.5: State Machine (2 days)

**Goal**: Track extension lifecycle state

**Deliverables**:
```rust
// src/state.rs

/// Extension state
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ExtensionState {
    Discovered,
    Loading,
    Loaded,
    Activating,
    Active,
    Deactivating,
    Inactive,
    Unloading,
    Unloaded,
    Failed { error: String },
}

/// State machine for extension lifecycle
pub struct ExtensionStateMachine {
    state: ExtensionState,
    history: Vec<StateTransition>,
}

impl ExtensionStateMachine {
    pub fn new() -> Self;
    
    /// Transition to new state
    pub fn transition(&mut self, to: ExtensionState) -> Result<(), StateError>;
    
    /// Check if transition is valid
    pub fn can_transition(&self, to: &ExtensionState) -> bool;
    
    /// Get current state
    pub fn state(&self) -> &ExtensionState;
    
    /// Get state history
    pub fn history(&self) -> &[StateTransition];
}
```

**Tasks**:
- [ ] Define `ExtensionState` enum
- [ ] Implement state machine
- [ ] Define valid transitions
- [ ] Track state history
- [ ] Write state machine tests

**Acceptance Criteria**:
- ✅ All states representable
- ✅ Invalid transitions rejected
- ✅ History preserved for debugging

---

### M4.4.6-M4.4.8: Health, Recovery, Tests (4 days)

**Tasks**:
- [ ] M4.4.6: Implement extension health checks
- [ ] M4.4.7: Implement crash recovery with auto-restart
- [ ] M4.4.8: Write comprehensive integration tests
- [ ] Test full lifecycle
- [ ] Test concurrent loading
- [ ] Test failure scenarios

---

## 🔍 M4.5: Registry & Discovery

**Crate**: `symphony-extension-registry`
**Duration**: 3 weeks
**Dependencies**: M4.4


### M4.5.1: Local Registry (2 days)

**Goal**: Local database of installed extensions

**Deliverables**:
```rust
// src/registry.rs

/// Local extension registry
pub struct LocalRegistry {
    db: Database,  // SQLite
}

/// Registry entry
#[derive(Debug, Clone)]
pub struct RegistryEntry {
    pub id: String,
    pub manifest: ExtensionManifest,
    pub installed_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub install_path: PathBuf,
    pub enabled: bool,
    pub config: Value,
}

impl LocalRegistry {
    pub fn new(db_path: &Path) -> Result<Self, RegistryError>;
    
    /// Add extension to registry
    pub fn add(&self, entry: RegistryEntry) -> Result<(), RegistryError>;
    
    /// Remove extension from registry
    pub fn remove(&self, id: &str) -> Result<(), RegistryError>;
    
    /// Get extension by ID
    pub fn get(&self, id: &str) -> Result<Option<RegistryEntry>, RegistryError>;
    
    /// List all extensions
    pub fn list(&self) -> Result<Vec<RegistryEntry>, RegistryError>;
    
    /// Update extension
    pub fn update(&self, entry: RegistryEntry) -> Result<(), RegistryError>;
}
```

**Tasks**:
- [ ] Set up SQLite database
- [ ] Implement CRUD operations
- [ ] Add indexing for fast lookup
- [ ] Handle migrations
- [ ] Write registry tests

**Acceptance Criteria**:
- ✅ CRUD operations work correctly
- ✅ Lookup is O(1)
- ✅ Database migrations work

---

### M4.5.2: Marketplace Client (3 days)

**Goal**: Client for remote extension marketplace

**Deliverables**:
```rust
// src/marketplace.rs

/// Marketplace client
pub struct MarketplaceClient {
    base_url: String,
    http_client: HttpClient,
    cache: MarketplaceCache,
}

/// Marketplace extension listing
#[derive(Debug, Clone, Deserialize)]
pub struct MarketplaceListing {
    pub id: String,
    pub name: String,
    pub description: String,
    pub version: Version,
    pub author: Author,
    pub downloads: u64,
    pub rating: f32,
    pub pricing: PricingModel,
}

impl MarketplaceClient {
    pub fn new(base_url: &str) -> Self;
    
    /// Search marketplace
    pub async fn search(&self, query: &SearchQuery) -> Result<SearchResults, MarketplaceError>;
    
    /// Get extension details
    pub async fn get_details(&self, id: &str) -> Result<MarketplaceListing, MarketplaceError>;
    
    /// Download extension
    pub async fn download(&self, id: &str, version: &Version) -> Result<PathBuf, MarketplaceError>;
    
    /// Get available versions
    pub async fn versions(&self, id: &str) -> Result<Vec<Version>, MarketplaceError>;
}
```

**Tasks**:
- [ ] Implement HTTP client
- [ ] Implement search API
- [ ] Implement download with progress
- [ ] Add response caching
- [ ] Handle authentication
- [ ] Write marketplace tests

**Acceptance Criteria**:
- ✅ Search returns relevant results
- ✅ Downloads work reliably
- ✅ Caching reduces API calls

---

### M4.5.3-M4.5.7: Search, Versions, Security, Ratings, Analytics (8 days)

**Tasks**:
- [ ] M4.5.3: Implement full-text search with filters
- [ ] M4.5.4: Implement version management (install, update, rollback)
- [ ] M4.5.5: Implement signature verification
- [ ] M4.5.6: Implement rating/review system
- [ ] M4.5.7: Add opt-in usage analytics

---

## 🎻 M4.6: Extension Types

**Crate**: `symphony-extension-types`
**Duration**: 4 weeks
**Dependencies**: M4.4, M5.1


### M4.6.1: Instrument Trait (2 days)

**Goal**: Define trait for AI/ML model extensions

**Deliverables**:
```rust
// src/instrument.rs

/// Instrument trait for AI/ML model extensions
#[async_trait]
pub trait Instrument: Extension {
    /// Invoke the model with input
    async fn invoke(&self, input: InstrumentInput) -> Result<InstrumentOutput, InstrumentError>;
    
    /// Configure the model
    fn configure(&mut self, config: InstrumentConfig) -> Result<(), ConfigError>;
    
    /// Get model capabilities
    fn capabilities(&self) -> &InstrumentCapabilities;
    
    /// Health check
    async fn health_check(&self) -> HealthStatus;
    
    /// Get usage metrics
    fn metrics(&self) -> &InstrumentMetrics;
}

/// Instrument input
#[derive(Debug, Clone)]
pub struct InstrumentInput {
    pub data: Value,
    pub parameters: HashMap<String, Value>,
    pub context: InvocationContext,
}

/// Instrument output
#[derive(Debug, Clone)]
pub struct InstrumentOutput {
    pub data: Value,
    pub metadata: OutputMetadata,
    pub usage: UsageInfo,
}

/// Instrument capabilities
#[derive(Debug, Clone)]
pub struct InstrumentCapabilities {
    pub input_types: Vec<DataType>,
    pub output_types: Vec<DataType>,
    pub supports_streaming: bool,
    pub supports_batching: bool,
    pub max_batch_size: Option<usize>,
    pub supports_async: bool,
}

/// Usage information for billing
#[derive(Debug, Clone)]
pub struct UsageInfo {
    pub tokens_input: Option<u64>,
    pub tokens_output: Option<u64>,
    pub compute_time_ms: u64,
    pub cost_estimate: Option<f64>,
}
```

**Tasks**:
- [ ] Define `Instrument` trait
- [ ] Define `InstrumentInput` and `InstrumentOutput`
- [ ] Define `InstrumentCapabilities`
- [ ] Define `UsageInfo` for billing
- [ ] Add streaming support
- [ ] Write trait tests

**Acceptance Criteria**:
- ✅ Trait covers all AI model use cases
- ✅ Streaming supported for large outputs
- ✅ Usage tracking enables billing

---

### M4.6.2: Base Instrument (3 days)

**Goal**: Base implementation with common functionality

**Deliverables**:
```rust
// src/instrument/base.rs

/// Base instrument implementation
pub struct BaseInstrument {
    manifest: ExtensionManifest,
    config: InstrumentConfig,
    capabilities: InstrumentCapabilities,
    metrics: InstrumentMetrics,
    state: InstrumentState,
}

impl BaseInstrument {
    pub fn new(manifest: ExtensionManifest) -> Self;
    
    /// Validate input against capabilities
    pub fn validate_input(&self, input: &InstrumentInput) -> Result<(), ValidationError>;
    
    /// Track invocation metrics
    pub fn track_invocation(&mut self, duration: Duration, usage: &UsageInfo);
    
    /// Get rate limiter
    pub fn rate_limiter(&self) -> &RateLimiter;
}

/// Instrument configuration
#[derive(Debug, Clone)]
pub struct InstrumentConfig {
    pub model_id: String,
    pub api_key: Option<String>,
    pub endpoint: Option<String>,
    pub timeout: Duration,
    pub max_retries: u32,
    pub rate_limit: Option<RateLimit>,
    pub custom: HashMap<String, Value>,
}

/// Instrument metrics
#[derive(Debug, Clone, Default)]
pub struct InstrumentMetrics {
    pub total_invocations: u64,
    pub successful_invocations: u64,
    pub failed_invocations: u64,
    pub total_tokens: u64,
    pub total_cost: f64,
    pub average_latency_ms: f64,
}
```

**Tasks**:
- [ ] Implement `BaseInstrument`
- [ ] Add input validation
- [ ] Implement metrics tracking
- [ ] Add rate limiting
- [ ] Implement retry logic
- [ ] Write base instrument tests

**Acceptance Criteria**:
- ✅ Common functionality reusable
- ✅ Metrics tracked accurately
- ✅ Rate limiting works correctly

---

### M4.6.3: Operator Trait (2 days)

**Goal**: Define trait for workflow utility extensions

**Deliverables**:
```rust
// src/operator.rs

/// Operator trait for workflow utilities
#[async_trait]
pub trait Operator: Extension {
    /// Process input data
    async fn process(&self, input: OperatorInput) -> Result<OperatorOutput, OperatorError>;
    
    /// Validate input before processing
    fn validate_input(&self, input: &OperatorInput) -> Result<(), ValidationError>;
    
    /// Validate output after processing
    fn validate_output(&self, output: &OperatorOutput) -> Result<(), ValidationError>;
    
    /// Get operator schema
    fn schema(&self) -> &OperatorSchema;
}

/// Operator input
#[derive(Debug, Clone)]
pub struct OperatorInput {
    pub data: Value,
    pub parameters: HashMap<String, Value>,
}

/// Operator output
#[derive(Debug, Clone)]
pub struct OperatorOutput {
    pub data: Value,
    pub metadata: HashMap<String, Value>,
}

/// Operator schema
#[derive(Debug, Clone)]
pub struct OperatorSchema {
    pub input_schema: JsonSchema,
    pub output_schema: JsonSchema,
    pub parameters_schema: JsonSchema,
}

/// Common operator types
pub enum OperatorType {
    Transform,    // Data transformation
    Filter,       // Data filtering
    Aggregate,    // Data aggregation
    Validate,     // Data validation
    Format,       // Data formatting
    Parse,        // Data parsing
    Custom,       // Custom operation
}
```

**Tasks**:
- [ ] Define `Operator` trait
- [ ] Define `OperatorInput` and `OperatorOutput`
- [ ] Define `OperatorSchema`
- [ ] Define `OperatorType` enum
- [ ] Add schema validation
- [ ] Write trait tests

**Acceptance Criteria**:
- ✅ Trait covers all utility use cases
- ✅ Schema validation works
- ✅ Common types defined

---

### M4.6.4: Base Operator (2 days)

**Goal**: Base implementation for operators

**Deliverables**:
```rust
// src/operator/base.rs

/// Base operator implementation
pub struct BaseOperator {
    manifest: ExtensionManifest,
    schema: OperatorSchema,
    config: OperatorConfig,
}

impl BaseOperator {
    pub fn new(manifest: ExtensionManifest, schema: OperatorSchema) -> Self;
    
    /// Validate against schema
    pub fn validate_against_schema(&self, data: &Value, schema: &JsonSchema) -> Result<(), ValidationError>;
}

/// Operator configuration
#[derive(Debug, Clone)]
pub struct OperatorConfig {
    pub timeout: Duration,
    pub max_input_size: usize,
    pub max_output_size: usize,
    pub custom: HashMap<String, Value>,
}
```

**Tasks**:
- [ ] Implement `BaseOperator`
- [ ] Add schema validation
- [ ] Add size limits
- [ ] Write base operator tests

---

### M4.6.5: Addon Trait (2 days)

**Goal**: Define trait for UI enhancement extensions

**Deliverables**:
```rust
// src/addon.rs

/// Addon trait for UI enhancements
#[async_trait]
pub trait Addon: Extension {
    /// Render the addon UI
    fn render(&self, props: AddonProps) -> VirtualNode;
    
    /// Handle UI events
    async fn handle_event(&mut self, event: AddonEvent) -> Result<(), AddonError>;
    
    /// Get addon state
    fn state(&self) -> &AddonState;
    
    /// Get addon placement
    fn placement(&self) -> AddonPlacement;
}

/// Addon properties
#[derive(Debug, Clone)]
pub struct AddonProps {
    pub width: u32,
    pub height: u32,
    pub theme: Theme,
    pub context: AddonContext,
}

/// Addon event
#[derive(Debug, Clone)]
pub enum AddonEvent {
    Click { x: i32, y: i32 },
    KeyPress { key: String, modifiers: Modifiers },
    Focus,
    Blur,
    Resize { width: u32, height: u32 },
    Custom(Value),
}

/// Addon placement
#[derive(Debug, Clone)]
pub enum AddonPlacement {
    Panel { position: PanelPosition },
    StatusBar { alignment: Alignment },
    Editor { location: EditorLocation },
    Modal,
    Floating { x: i32, y: i32 },
}

/// Virtual DOM node for rendering
#[derive(Debug, Clone)]
pub enum VirtualNode {
    Element {
        tag: String,
        props: HashMap<String, Value>,
        children: Vec<VirtualNode>,
    },
    Text(String),
    Component {
        name: String,
        props: HashMap<String, Value>,
    },
}
```

**Tasks**:
- [ ] Define `Addon` trait
- [ ] Define `AddonProps` and `AddonEvent`
- [ ] Define `AddonPlacement`
- [ ] Define `VirtualNode` for rendering
- [ ] Write trait tests

**Acceptance Criteria**:
- ✅ Trait covers all UI use cases
- ✅ Virtual DOM enables efficient rendering
- ✅ Event handling is comprehensive

---

### M4.6.6: Base Addon (2 days)

**Goal**: Base implementation for addons

**Deliverables**:
```rust
// src/addon/base.rs

/// Base addon implementation
pub struct BaseAddon {
    manifest: ExtensionManifest,
    state: AddonState,
    placement: AddonPlacement,
}

/// Addon state
#[derive(Debug, Clone, Default)]
pub struct AddonState {
    pub visible: bool,
    pub focused: bool,
    pub data: HashMap<String, Value>,
}

impl BaseAddon {
    pub fn new(manifest: ExtensionManifest, placement: AddonPlacement) -> Self;
    
    /// Update state
    pub fn set_state(&mut self, key: &str, value: Value);
    
    /// Get state value
    pub fn get_state(&self, key: &str) -> Option<&Value>;
}
```

**Tasks**:
- [ ] Implement `BaseAddon`
- [ ] Add state management
- [ ] Add visibility control
- [ ] Write base addon tests

---

### M4.6.7-M4.6.9: Example Extensions (6 days)

**Goal**: Create example extensions demonstrating best practices

**Tasks**:
- [ ] M4.6.7: Create example Instrument (mock AI model)
  - Demonstrates invocation, streaming, metrics
- [ ] M4.6.8: Create example Operator (JSON transformer)
  - Demonstrates schema validation, transformation
- [ ] M4.6.9: Create example Addon (status panel)
  - Demonstrates rendering, events, state

**Acceptance Criteria**:
- ✅ Examples are well-documented
- ✅ Examples demonstrate best practices
- ✅ Examples can be used as templates

---

## 📊 M4 Summary

| Sub-Milestone | Tasks | Duration | Status |
|---------------|-------|----------|--------|
| M4.1.1 Full Schema | 7 | 2 days | 📋 |
| M4.1.2 Capabilities | 5 | 2 days | 📋 |
| M4.1.3 Dependencies | 6 | 2 days | 📋 |
| M4.1.4 Config Schema | 7 | 3 days | 📋 |
| M4.1.5 Resources | 6 | 2 days | 📋 |
| M4.1.6 Marketplace | 6 | 2 days | 📋 |
| M4.1.7 Validation | 8 | 2 days | 📋 |
| M4.2.1 Permission Types | 8 | 2 days | 📋 |
| M4.2.2 Scopes | 6 | 2 days | 📋 |
| M4.2.3 Runtime Checker | 8 | 3 days | 📋 |
| M4.2.4 Policy Engine | 7 | 2 days | 📋 |
| M4.2.5 Request Flow | 6 | 2 days | 📋 |
| M4.2.6 UI Generation | 6 | 2 days | 📋 |
| M4.2.7 Audit Logging | 6 | 2 days | 📋 |
| M4.3.1 Process Spawning | 6 | 3 days | 📋 |
| M4.3.2 Memory Limits | 6 | 2 days | 📋 |
| M4.3.3 CPU Limits | 5 | 2 days | 📋 |
| M4.3.4 Filesystem Sandbox | 7 | 4 days | 📋 |
| M4.3.5 Network Sandbox | 6 | 3 days | 📋 |
| M4.3.6 Health Monitoring | 6 | 2 days | 📋 |
| M4.3.7 Termination | 6 | 2 days | 📋 |
| M4.3.8 Security Tests | 7 | 3 days | 📋 |
| M4.4.1 Discovery | 6 | 2 days | 📋 |
| M4.4.2 Dependency Resolution | 6 | 3 days | 📋 |
| M4.4.3 Loading Sequence | 6 | 2 days | 📋 |
| M4.4.4 Hot Reload | 6 | 3 days | 📋 |
| M4.4.5 State Machine | 5 | 2 days | 📋 |
| M4.4.6-8 Health/Recovery/Tests | 6 | 4 days | 📋 |
| M4.5.1 Local Registry | 5 | 2 days | 📋 |
| M4.5.2 Marketplace Client | 6 | 3 days | 📋 |
| M4.5.3-7 Search/Versions/etc | 10 | 8 days | 📋 |
| M4.6.1 Instrument Trait | 6 | 2 days | 📋 |
| M4.6.2 Base Instrument | 6 | 3 days | 📋 |
| M4.6.3 Operator Trait | 6 | 2 days | 📋 |
| M4.6.4 Base Operator | 4 | 2 days | 📋 |
| M4.6.5 Addon Trait | 5 | 2 days | 📋 |
| M4.6.6 Base Addon | 4 | 2 days | 📋 |
| M4.6.7-9 Examples | 6 | 6 days | 📋 |

**Total Tasks**: ~220 detailed tasks
**Total Duration**: 20 weeks (with parallelization: ~14 weeks)

---

## 🔗 Integration Points

### M4 ↔ M1 Integration
- Uses M1.1 protocol for extension IPC
- Uses M1.3 message bus for communication
- Extends M1.5 SDK foundation

### M4 ↔ M3 Integration
- M3.1 Pool Manager uses M4.6 Instrument trait
- M3.2 DAG Tracker uses M4.6 Operator trait
- The Pit extensions are M4 extensions

### M4 ↔ M5 Integration
- M4.6 extension types integrate with M5.1 workflow nodes
- Extensions can be workflow nodes

---

**Next**: [MILESTONE_LEVEL2_M3.md](./MILESTONE_LEVEL2_M3.md)
