# Level 2 M4 Design: Extension Ecosystem Architecture

> **Technical Architecture**: Detailed design and crate structures for M4 Extension Ecosystem

**Parent**: Level 1 M4 Extension Ecosystem  
**Architecture**: Orchestra Kit - Complete extension system with sandboxing  
**Integration**: M1 IPC, M3 Pit extensions, M5 Workflow nodes

---

## 🏗️ High-Level Architecture

### Extension Ecosystem Overview
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SYMPHONY EXTENSION ECOSYSTEM                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         EXTENSION LOADER                                ││
│  │  Discovery → Dependency Resolution → Loading → State Machine            ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                        │
│  ┌─────────────────┐  ┌───────────┴───────────┐  ┌─────────────────────────┐│
│  │  MANIFEST       │  │   PERMISSION          │  │   PROCESS ISOLATION    ││
│  │  SYSTEM         │  │   FRAMEWORK           │  │   (SANDBOX)            ││
│  │                 │  │                       │  │                        ││
│  │ • Schema        │  │ • Permission Types    │  │ • Process Spawning     ││
│  │ • Capabilities  │  │ • Scopes & Levels     │  │ • Memory Limits        ││
│  │ • Dependencies  │  │ • Runtime Checker     │  │ • CPU Limits           ││
│  │ • Config        │  │ • Policy Engine       │  │ • Filesystem Sandbox   ││
│  │ • Resources     │  │ • Request/Grant Flow  │  │ • Network Sandbox      ││
│  │ • Marketplace   │  │ • Audit Logging       │  │ • Health Monitoring    ││
│  └─────────────────┘  └───────────────────────┘  └─────────────────────────┘│
│                                    │                                        │
│  ┌─────────────────────────────────┴───────────────────────────────────────┐│
│  │                         EXTENSION TYPES                                 ││
│  │                                                                         ││
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         ││
│  │  │  🎻 Instruments │  │  ⚙️ Operators    │  │  🧩 Addons       │         ││
│  │  │   (AI Models)   │  │  (Utilities)    │  │  (UI Enhance)   │         ││
│  │  │                 │  │                 │  │                 │         ││
│  │  │ • Invoke        │  │ • Process       │  │ • Render        │         ││
│  │  │ • Configure     │  │ • Validate      │  │ • Handle Events │         ││
│  │  │ • Streaming     │  │ • Schema        │  │ • State Mgmt    │         ││
│  │  │ • Metrics       │  │ • Transform     │  │ • Placement     │         ││
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                        │
│  ┌─────────────────────────────────┴───────────────────────────────────────┐│
│  │                      REGISTRY & DISCOVERY                               ││
│  │  Local Registry (SQLite) ↔ Marketplace Client ↔ Version Management     ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Crate Structure and Dependencies

### Manifest System (extends M1.5 SDK)
```
apps/backend/crates/symphony-extension-sdk/
├── Cargo.toml                    # serde, toml, semver
├── src/
│   ├── manifest/
│   │   ├── mod.rs
│   │   ├── schema.rs            # ExtensionManifest, ExtensionType, Author
│   │   ├── capabilities.rs      # Capability, standard capabilities
│   │   ├── dependencies.rs      # Dependency, VersionConstraint
│   │   ├── config.rs            # ConfigSchema, ConfigProperty, ConfigType
│   │   ├── resources.rs         # ResourceRequirements (memory, CPU, GPU, storage, network)
│   │   └── marketplace.rs       # MarketplaceMetadata, PricingModel, SupportInfo
│   └── ...
└── tests/
    └── manifest_tests.rs        # Parsing and validation tests
```

### Permission Framework
```
apps/backend/crates/symphony-permissions/
├── Cargo.toml                    # async-trait, serde
├── src/
│   ├── lib.rs
│   ├── types.rs                 # PermissionType, FileSystemPermission, NetworkPermission, etc.
│   ├── scopes.rs                # PermissionScope, PermissionLevel, Permission
│   ├── checker.rs               # PermissionChecker, CheckResult
│   ├── policy.rs                # PermissionPolicy, PolicyRule, PolicyCondition
│   ├── flow.rs                  # PermissionRequest, PermissionResponse, PermissionFlowManager
│   ├── ui.rs                    # PermissionUIData, RiskLevel
│   └── audit.rs                 # PermissionAuditEntry, PermissionAuditLog
└── tests/
    ├── checker_tests.rs
    ├── policy_tests.rs
    └── audit_tests.rs
```

### Process Isolation (Sandbox)
```
apps/backend/crates/symphony-sandbox/
├── Cargo.toml                    # tokio, nix (Linux), windows-rs (Windows)
├── src/
│   ├── lib.rs
│   ├── process.rs               # SandboxConfig, SandboxedProcess, ProcessStatus
│   ├── limits/
│   │   ├── mod.rs
│   │   ├── memory.rs            # MemoryLimiter (cgroups, Job Objects)
│   │   └── cpu.rs               # CpuLimiter
│   ├── filesystem.rs            # FilesystemConfig, FilesystemSandbox
│   ├── network.rs               # NetworkConfig, NetworkSandbox
│   ├── health.rs                # ProcessHealth, HealthMonitor
│   └── termination.rs           # Graceful shutdown, force kill
└── tests/
    ├── process_tests.rs
    ├── limits_tests.rs
    ├── filesystem_tests.rs
    ├── network_tests.rs
    └── security_tests.rs        # Escape attempt tests
```

### Extension Loader
```
apps/backend/crates/symphony-extension-loader/
├── Cargo.toml                    # notify (file watching), petgraph
├── src/
│   ├── lib.rs
│   ├── discovery.rs             # DiscoveryConfig, DiscoveredExtension, ExtensionDiscoverer
│   ├── resolver.rs              # DependencyResolver, ResolutionResult
│   ├── loader.rs                # ExtensionLoader, LoadedExtension
│   ├── hot_reload.rs            # HotReloadConfig, HotReloadManager
│   └── state.rs                 # ExtensionState, ExtensionStateMachine
└── tests/
    ├── discovery_tests.rs
    ├── resolver_tests.rs
    ├── loader_tests.rs
    └── hot_reload_tests.rs
```

### Registry & Discovery
```
apps/backend/crates/symphony-extension-registry/
├── Cargo.toml                    # rusqlite, reqwest
├── src/
│   ├── lib.rs
│   ├── registry.rs              # LocalRegistry, RegistryEntry
│   ├── marketplace.rs           # MarketplaceClient, MarketplaceListing
│   ├── search.rs                # Full-text search with filters
│   ├── versions.rs              # Version management (install, update, rollback)
│   ├── signatures.rs            # Signature verification
│   ├── ratings.rs               # Rating/review system
│   └── analytics.rs             # Opt-in usage analytics
└── tests/
    ├── registry_tests.rs
    └── marketplace_tests.rs
```

### Extension Types
```
apps/backend/crates/symphony-extension-types/
├── Cargo.toml                    # async-trait
├── src/
│   ├── lib.rs
│   ├── instrument/
│   │   ├── mod.rs
│   │   ├── trait.rs             # Instrument trait
│   │   └── base.rs              # BaseInstrument
│   ├── operator/
│   │   ├── mod.rs
│   │   ├── trait.rs             # Operator trait
│   │   └── base.rs              # BaseOperator
│   ├── addon/
│   │   ├── mod.rs
│   │   ├── trait.rs             # Addon trait
│   │   └── base.rs              # BaseAddon
│   └── examples/
│       ├── mock_instrument.rs   # Example AI model
│       ├── json_operator.rs     # Example JSON transformer
│       └── status_addon.rs      # Example status panel
└── tests/
    ├── instrument_tests.rs
    ├── operator_tests.rs
    └── addon_tests.rs
```

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

## 🔒 Security Architecture

### Permission Hierarchy
```
Permission Types:
├── FileSystem
│   ├── path_pattern (glob)
│   └── operations (read, write, delete, execute)
├── Network
│   ├── host_pattern (glob)
│   ├── ports (ranges)
│   └── protocols (HTTP, HTTPS, WebSocket)
├── System
│   ├── Environment
│   ├── ProcessSpawn
│   ├── Clipboard
│   ├── Notifications
│   └── SystemInfo
├── Model
│   ├── model_pattern (glob)
│   └── operations (invoke, configure, train)
├── IPC
│   └── channel access
└── UserData
    └── data access
```

### Sandbox Layers
```
┌─────────────────────────────────────────────────────────────┐
│                    EXTENSION PROCESS                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │              NETWORK SANDBOX                            ││
│  │  • Allowed hosts only                                   ││
│  │  • Port restrictions                                    ││
│  │  • Protocol filtering                                   ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │              FILESYSTEM SANDBOX                         ││
│  │  • Isolated root directory                              ││
│  │  • Allowed paths whitelist                              ││
│  │  • Read-only mounts                                     ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │              RESOURCE LIMITS                            ││
│  │  • Memory limit (cgroups/Job Objects)                   ││
│  │  • CPU limit                                            ││
│  │  • Thread limit                                         ││
│  │  • File descriptor limit                                ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Platform-Specific Implementations
| Feature | Linux | Windows | macOS |
|---------|-------|---------|-------|
| Memory Limits | cgroups v2 | Job Objects | resource limits |
| CPU Limits | cgroups v2 | Job Objects | resource limits |
| Filesystem | namespaces + bind mounts | AppContainer | sandbox-exec |
| Network | network namespaces + iptables | Windows Firewall | sandbox-exec |

---

## 🎯 Performance Targets

| Component | Metric | Target |
|-----------|--------|--------|
| **Permission Checker** | Check latency | <0.01ms |
| **Manifest Parser** | Parse time | <1ms |
| **Extension Discovery** | Scan time | <100ms per directory |
| **Dependency Resolution** | Resolution time | <10ms for 100 extensions |
| **Process Spawn** | Spawn time | <100ms |
| **Hot Reload** | Detection time | <1s |
| **Registry Lookup** | Query time | O(1) |
| **Marketplace Search** | Response time | <500ms |
