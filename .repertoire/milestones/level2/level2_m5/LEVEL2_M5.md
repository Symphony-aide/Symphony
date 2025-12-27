# M5: Visual Orchestration Backend - Level 2 Decomposition

> **Parent**: [MILESTONES_LEVEL1.md](../MILESTONES_LEVEL1.md)
> **Duration**: 2-3 months
> **Goal**: Backend support for visual workflow composition and monitoring

---

## 📋 Glossary

**Terms and Definitions**:
- **OFB Python**: Out of Boundary Python - refers to Python API components that handle authoritative validation, RBAC, and data persistence outside the Rust boundary
- **Pre-validation**: Lightweight technical validation in Rust to prevent unnecessary HTTP requests (NOT business logic)
- **Authoritative Validation**: Complete validation including RBAC, business rules, and data constraints performed by OFB Python
- **Two-Layer Architecture**: Rust (orchestration + pre-validation) + OFB Python (validation + persistence)
- **DAG**: Directed Acyclic Graph
- **Harmony Board**: Visual workflow composer interface
- **Template System**: Reusable workflow patterns with parameterization
- **State Machine**: Finite state machine for workflow execution states

---

## 📋 Overview

M5 provides the backend data structures and APIs that power the Harmony Board
visual workflow composer and orchestration monitoring. This milestone creates
the foundation for Symphony's visual programming capabilities.

```
M5: Visual Orchestration Backend
├── M5.1: Workflow Data Model
│   ├── M5.1.1: Workflow Struct
│   ├── M5.1.2: Node Types
│   ├── M5.1.3: Edge Types
│   ├── M5.1.4: Workflow Builder
│   ├── M5.1.5: Metadata System
│   └── M5.1.6: Unit Tests
├── M5.2: DAG Validation & Operations
│   ├── M5.2.1: Cycle Detection
│   ├── M5.2.2: Topological Sort
│   ├── M5.2.3: Dependency Resolver
│   ├── M5.2.4: Graph Traversal
│   ├── M5.2.5: Validation Pipeline
│   └── M5.2.6: Property Tests
├── M5.3: Workflow Serialization
│   ├── M5.3.1: JSON Serialization
│   ├── M5.3.2: Binary Serialization
│   ├── M5.3.3: Pretty Printer
│   ├── M5.3.4: Schema Versioning
│   ├── M5.3.5: Migration System
│   └── M5.3.6: Round-trip Tests
├── M5.4: Template System
│   ├── M5.4.1: Template Definition
│   ├── M5.4.2: Parameter Schema
│   ├── M5.4.3: Instantiation
│   ├── M5.4.4: Template Library
│   ├── M5.4.5: Versioning
│   └── M5.4.6: Validation Tests
└── M5.5: Execution State API
    ├── M5.5.1: State Machine
    ├── M5.5.2: State Transitions
    ├── M5.5.3: Progress Tracking
    ├── M5.5.4: Control Commands
    ├── M5.5.5: Event Streaming
    ├── M5.5.6: Audit Log
    └── M5.5.7: Integration Tests
```


---

## 📊 M5.1: Workflow Data Model

**Crate**: `symphony-workflow-model`
**Duration**: 2 weeks
**Dependencies**: None (foundational)


### M5.1.1: Workflow Struct (2 days)

**Goal**: Define the core workflow container structure

**Deliverables**:
```rust
// src/workflow.rs

use chrono::{DateTime, Utc};
use std::collections::HashMap;

/// Unique identifier for workflows
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct WorkflowId(pub Uuid);

/// Semantic version for workflow schemas
#[derive(Debug, Clone, PartialEq)]
pub struct Version {
    pub major: u32,
    pub minor: u32,
    pub patch: u32,
}

/// Core workflow structure containing all nodes and edges
pub struct Workflow {
    pub id: WorkflowId,
    pub name: String,
    pub description: Option<String>,
    pub version: Version,
    pub nodes: HashMap<NodeId, Node>,
    pub edges: Vec<Edge>,
    pub metadata: WorkflowMetadata,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Workflow {
    pub fn new(name: impl Into<String>) -> Self;
    pub fn add_node(&mut self, node: Node) -> NodeId;
    pub fn add_edge(&mut self, edge: Edge) -> Result<(), EdgeError>;
    pub fn remove_node(&mut self, id: &NodeId) -> Option<Node>;
    pub fn get_node(&self, id: &NodeId) -> Option<&Node>;
    pub fn get_node_mut(&mut self, id: &NodeId) -> Option<&mut Node>;
    pub fn node_count(&self) -> usize;
    pub fn edge_count(&self) -> usize;
}
```

**Tasks**:
- [ ] Define `WorkflowId` with UUID generation
- [ ] Define `Version` struct with comparison traits
- [ ] Define `Workflow` struct with all fields
- [ ] Implement node management methods
- [ ] Implement edge management methods
- [ ] Add `Clone`, `Debug`, `PartialEq` derives
- [ ] Write unit tests for workflow creation

**Acceptance Criteria**:
- ✅ Workflows can contain 10,000+ nodes
- ✅ Node lookup is O(1)
- ✅ All fields are properly initialized


---

### M5.1.2: Node Types (3 days)

**Goal**: Define all node types for workflow composition

**Deliverables**:
```rust
// src/node.rs

/// Unique identifier for nodes within a workflow
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct NodeId(pub Uuid);

/// Position for visual layout
#[derive(Debug, Clone, PartialEq)]
pub struct Position {
    pub x: f64,
    pub y: f64,
}

/// Common node properties
pub struct NodeBase {
    pub id: NodeId,
    pub name: String,
    pub description: Option<String>,
    pub position: Position,
    pub enabled: bool,
    pub metadata: HashMap<String, Value>,
}

/// Node type enumeration
pub enum Node {
    /// AI/ML model invocation
    Instrument(InstrumentNode),
    /// Data transformation/utility
    Operator(OperatorNode),
    /// Flow control (branch, merge, loop)
    Control(ControlNode),
    /// Workflow input port
    Input(InputNode),
    /// Workflow output port
    Output(OutputNode),
}

/// AI/ML model node
pub struct InstrumentNode {
    pub base: NodeBase,
    pub model_id: String,
    pub model_version: Option<Version>,
    pub config: InstrumentConfig,
    pub inputs: Vec<PortDefinition>,
    pub outputs: Vec<PortDefinition>,
}

/// Data transformation node
pub struct OperatorNode {
    pub base: NodeBase,
    pub operator_type: OperatorType,
    pub config: OperatorConfig,
    pub inputs: Vec<PortDefinition>,
    pub outputs: Vec<PortDefinition>,
}

/// Flow control node
pub struct ControlNode {
    pub base: NodeBase,
    pub control_type: ControlType,
    pub condition: Option<Expression>,
}

/// Control flow types
pub enum ControlType {
    Branch,      // Conditional branching
    Merge,       // Join multiple paths
    Loop,        // Iteration
    Parallel,    // Fork into parallel paths
    Join,        // Wait for all parallel paths
}

/// Port definition for inputs/outputs
pub struct PortDefinition {
    pub name: String,
    pub data_type: DataType,
    pub required: bool,
    pub default_value: Option<Value>,
}
```

**Tasks**:
- [ ] Define `NodeId` with UUID generation
- [ ] Define `Position` for visual layout
- [ ] Define `NodeBase` with common properties
- [ ] Implement `Node` enum with all variants
- [ ] Define `InstrumentNode` for AI models
- [ ] Define `OperatorNode` for transformations
- [ ] Define `ControlNode` for flow control
- [ ] Define `InputNode` and `OutputNode`
- [ ] Define `PortDefinition` for I/O ports
- [ ] Implement `From` conversions between types
- [ ] Write unit tests for each node type

**Acceptance Criteria**:
- ✅ All node types representable
- ✅ Nodes have unique IDs
- ✅ Port definitions support all data types


---

### M5.1.3: Edge Types (2 days)

**Goal**: Define edge types for connecting nodes

**Deliverables**:
```rust
// src/edge.rs

/// Unique identifier for edges
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct EdgeId(pub Uuid);

/// Edge type enumeration
pub enum Edge {
    /// Data flow between nodes
    Data(DataEdge),
    /// Execution order control
    Control(ControlEdge),
    /// Conditional branching
    Conditional(ConditionalEdge),
}

/// Data flow edge connecting output to input ports
pub struct DataEdge {
    pub id: EdgeId,
    pub source_node: NodeId,
    pub source_port: String,
    pub target_node: NodeId,
    pub target_port: String,
    pub transform: Option<DataTransform>,
}

/// Control flow edge defining execution order
pub struct ControlEdge {
    pub id: EdgeId,
    pub source_node: NodeId,
    pub target_node: NodeId,
    pub priority: i32,
}

/// Conditional edge with branching logic
pub struct ConditionalEdge {
    pub id: EdgeId,
    pub source_node: NodeId,
    pub target_node: NodeId,
    pub condition: Expression,
    pub label: Option<String>,
}

/// Data transformation applied during edge traversal
pub struct DataTransform {
    pub transform_type: TransformType,
    pub config: HashMap<String, Value>,
}

pub enum TransformType {
    Map,        // Transform each element
    Filter,     // Filter elements
    Reduce,     // Aggregate elements
    Flatten,    // Flatten nested structures
    Custom,     // Custom transformation
}

impl Edge {
    pub fn source_node(&self) -> &NodeId;
    pub fn target_node(&self) -> &NodeId;
    pub fn id(&self) -> &EdgeId;
}
```

**Tasks**:
- [ ] Define `EdgeId` with UUID generation
- [ ] Define `Edge` enum with all variants
- [ ] Implement `DataEdge` for data flow
- [ ] Implement `ControlEdge` for execution order
- [ ] Implement `ConditionalEdge` for branching
- [ ] Define `DataTransform` for edge transformations
- [ ] Add helper methods for edge access
- [ ] Write unit tests for edge creation

**Acceptance Criteria**:
- ✅ All edge types connect nodes correctly
- ✅ Data edges validate port compatibility
- ✅ Conditional edges support expressions


---

### M5.1.4: Workflow Builder (2 days)

**Goal**: Fluent API for constructing workflows

**Deliverables**:
```rust
// src/builder.rs

pub struct WorkflowBuilder {
    workflow: Workflow,
    current_node: Option<NodeId>,
}

impl WorkflowBuilder {
    pub fn new(name: impl Into<String>) -> Self;
    
    /// Add an instrument node
    pub fn instrument(self, name: &str, model_id: &str) -> Self;
    
    /// Add an operator node
    pub fn operator(self, name: &str, op_type: OperatorType) -> Self;
    
    /// Add a control node
    pub fn control(self, name: &str, control_type: ControlType) -> Self;
    
    /// Add an input node
    pub fn input(self, name: &str, data_type: DataType) -> Self;
    
    /// Add an output node
    pub fn output(self, name: &str, data_type: DataType) -> Self;
    
    /// Connect current node to another
    pub fn connect_to(self, target: &str, port: &str) -> Self;
    
    /// Connect with data edge
    pub fn data_edge(self, from: &str, from_port: &str, to: &str, to_port: &str) -> Self;
    
    /// Connect with control edge
    pub fn control_edge(self, from: &str, to: &str) -> Self;
    
    /// Set node position
    pub fn at(self, x: f64, y: f64) -> Self;
    
    /// Add metadata
    pub fn with_metadata(self, key: &str, value: Value) -> Self;
    
    /// Build the workflow
    pub fn build(self) -> Result<Workflow, BuilderError>;
}

// Usage example:
// let workflow = WorkflowBuilder::new("My Workflow")
//     .input("prompt", DataType::String)
//     .instrument("enhance", "gpt-4")
//     .connect_to("enhance", "input")
//     .operator("format", OperatorType::JsonFormat)
//     .connect_to("format", "input")
//     .output("result", DataType::String)
//     .connect_to("result", "input")
//     .build()?;
```

**Tasks**:
- [ ] Implement `WorkflowBuilder` struct
- [ ] Add node creation methods
- [ ] Add edge creation methods
- [ ] Add position and metadata methods
- [ ] Implement validation in `build()`
- [ ] Add error handling for invalid operations
- [ ] Write fluent API tests

**Acceptance Criteria**:
- ✅ Builder API is ergonomic and chainable
- ✅ Invalid workflows rejected at build time
- ✅ Builder supports all node and edge types


---

### M5.1.5: Metadata System (1 day)

**Goal**: Extensible metadata for workflows and nodes

**Deliverables**:
```rust
// src/metadata.rs

/// Workflow-level metadata
pub struct WorkflowMetadata {
    pub author: Option<String>,
    pub tags: Vec<String>,
    pub category: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub custom: HashMap<String, Value>,
}

impl WorkflowMetadata {
    pub fn new() -> Self;
    pub fn with_author(self, author: impl Into<String>) -> Self;
    pub fn with_tag(self, tag: impl Into<String>) -> Self;
    pub fn with_custom(self, key: impl Into<String>, value: Value) -> Self;
    pub fn get_custom(&self, key: &str) -> Option<&Value>;
}

/// Node-level metadata
pub struct NodeMetadata {
    pub documentation: Option<String>,
    pub examples: Vec<String>,
    pub warnings: Vec<String>,
    pub custom: HashMap<String, Value>,
}
```

**Tasks**:
- [ ] Define `WorkflowMetadata` struct
- [ ] Define `NodeMetadata` struct
- [ ] Add builder methods for metadata
- [ ] Support arbitrary custom fields
- [ ] Write metadata tests

**Acceptance Criteria**:
- ✅ Metadata supports arbitrary key-value pairs
- ✅ Standard fields have typed accessors
- ✅ Metadata serializes correctly

---

### M5.1.6: Unit Tests (1 day)

**Goal**: Comprehensive test coverage for data model

**Tasks**:
- [ ] Test workflow creation and modification
- [ ] Test all node types
- [ ] Test all edge types
- [ ] Test builder API
- [ ] Test metadata system
- [ ] Achieve >90% code coverage


---

## 🔍 M5.2: DAG Validation & Operations

**Crate**: `symphony-workflow-model` (extended)
**Duration**: 2 weeks
**Dependencies**: M5.1


### M5.2.1: Cycle Detection (2 days)

**Goal**: Detect cycles in workflow graphs to ensure valid DAGs

**Deliverables**:
```rust
// src/validation/cycles.rs

/// Result of cycle detection
pub struct CycleDetectionResult {
    pub has_cycle: bool,
    pub cycle_path: Option<Vec<NodeId>>,
}

impl Workflow {
    /// Detect if the workflow contains any cycles
    pub fn detect_cycles(&self) -> CycleDetectionResult;
    
    /// Check if adding an edge would create a cycle
    pub fn would_create_cycle(&self, from: &NodeId, to: &NodeId) -> bool;
}

/// Internal cycle detection using DFS with coloring
fn detect_cycle_dfs(
    graph: &HashMap<NodeId, Vec<NodeId>>,
    start: &NodeId,
) -> Option<Vec<NodeId>>;
```

**Tasks**:
- [ ] Implement DFS-based cycle detection
- [ ] Track cycle path for error reporting
- [ ] Add `would_create_cycle` for edge validation
- [ ] Optimize for large graphs (10,000+ nodes)
- [ ] Write tests with various cycle patterns

**Acceptance Criteria**:
- ✅ Detects all cycles in O(V + E) time
- ✅ Returns the actual cycle path
- ✅ Works for graphs up to 10,000 nodes


---

### M5.2.2: Topological Sort (2 days)

**Goal**: Determine valid execution order for workflow nodes

**Deliverables**:
```rust
// src/validation/topo_sort.rs

/// Error when topological sort fails
#[derive(Debug)]
pub struct CycleError {
    pub cycle_path: Vec<NodeId>,
}

impl Workflow {
    /// Get nodes in topological order (execution order)
    pub fn topological_sort(&self) -> Result<Vec<NodeId>, CycleError>;
    
    /// Get execution levels (nodes at same level can run in parallel)
    pub fn execution_levels(&self) -> Result<Vec<Vec<NodeId>>, CycleError>;
}

/// Kahn's algorithm for topological sorting
fn kahns_algorithm(
    nodes: &HashMap<NodeId, Node>,
    edges: &[Edge],
) -> Result<Vec<NodeId>, CycleError>;
```

**Tasks**:
- [ ] Implement Kahn's algorithm for topological sort
- [ ] Implement execution level grouping
- [ ] Handle disconnected components
- [ ] Ensure deterministic ordering
- [ ] Write tests for various graph shapes

**Acceptance Criteria**:
- ✅ Sort is deterministic (same input = same output)
- ✅ Execution levels enable parallel execution
- ✅ Handles disconnected subgraphs


---

### M5.2.3: Dependency Resolver (2 days)

**Goal**: Resolve node dependencies for execution planning

**Deliverables**:
```rust
// src/validation/dependencies.rs

/// Dependency information for a node
pub struct NodeDependencies {
    pub node_id: NodeId,
    pub direct_dependencies: Vec<NodeId>,
    pub all_dependencies: Vec<NodeId>,
    pub direct_dependents: Vec<NodeId>,
    pub all_dependents: Vec<NodeId>,
}

impl Workflow {
    /// Get all dependencies for a node
    pub fn get_dependencies(&self, node_id: &NodeId) -> NodeDependencies;
    
    /// Get nodes that must complete before this node
    pub fn get_predecessors(&self, node_id: &NodeId) -> Vec<NodeId>;
    
    /// Get nodes that depend on this node
    pub fn get_successors(&self, node_id: &NodeId) -> Vec<NodeId>;
    
    /// Get the critical path (longest dependency chain)
    pub fn critical_path(&self) -> Vec<NodeId>;
}
```

**Tasks**:
- [ ] Implement direct dependency lookup
- [ ] Implement transitive dependency resolution
- [ ] Implement dependent (successor) lookup
- [ ] Calculate critical path
- [ ] Cache dependency information
- [ ] Write dependency resolution tests

**Acceptance Criteria**:
- ✅ Dependency lookup is O(1) after initial calculation
- ✅ Critical path identifies bottlenecks
- ✅ Handles complex dependency graphs


---

### M5.2.4: Graph Traversal (2 days)

**Goal**: Utility functions for traversing workflow graphs

**Deliverables**:
```rust
// src/validation/traversal.rs

/// Traversal order
pub enum TraversalOrder {
    BreadthFirst,
    DepthFirst,
    TopologicalOrder,
}

/// Visitor trait for graph traversal
pub trait NodeVisitor {
    fn visit(&mut self, node: &Node, depth: usize) -> VisitResult;
}

pub enum VisitResult {
    Continue,
    Skip,      // Skip children
    Stop,      // Stop traversal
}

impl Workflow {
    /// Traverse all nodes in specified order
    pub fn traverse<V: NodeVisitor>(&self, order: TraversalOrder, visitor: &mut V);
    
    /// Get all ancestors of a node
    pub fn ancestors(&self, node_id: &NodeId) -> Vec<NodeId>;
    
    /// Get all descendants of a node
    pub fn descendants(&self, node_id: &NodeId) -> Vec<NodeId>;
    
    /// Find path between two nodes
    pub fn find_path(&self, from: &NodeId, to: &NodeId) -> Option<Vec<NodeId>>;
    
    /// Get all paths between two nodes
    pub fn all_paths(&self, from: &NodeId, to: &NodeId) -> Vec<Vec<NodeId>>;
}
```

**Tasks**:
- [ ] Implement BFS traversal
- [ ] Implement DFS traversal
- [ ] Implement visitor pattern
- [ ] Add ancestor/descendant queries
- [ ] Implement path finding
- [ ] Write traversal tests

**Acceptance Criteria**:
- ✅ All traversal orders work correctly
- ✅ Visitor pattern enables custom logic
- ✅ Path finding handles multiple paths


---

### M5.2.5: Validation Pipeline (2 days)

**Goal**: Comprehensive workflow validation

**Deliverables**:
```rust
// src/validation/pipeline.rs

/// Validation error types
#[derive(Debug)]
pub enum ValidationError {
    CycleDetected { path: Vec<NodeId> },
    OrphanNode { node_id: NodeId },
    DisconnectedInput { node_id: NodeId, port: String },
    TypeMismatch { edge_id: EdgeId, expected: DataType, found: DataType },
    MissingRequiredInput { node_id: NodeId, port: String },
    DuplicateNodeId { id: NodeId },
    InvalidEdge { edge_id: EdgeId, reason: String },
}

/// Validation result
pub struct ValidationResult {
    pub is_valid: bool,
    pub errors: Vec<ValidationError>,
    pub warnings: Vec<ValidationWarning>,
}

impl Workflow {
    /// Run full validation pipeline
    pub fn validate(&self) -> ValidationResult;
    
    /// Validate specific aspects
    pub fn validate_structure(&self) -> Vec<ValidationError>;
    pub fn validate_types(&self) -> Vec<ValidationError>;
    pub fn validate_connectivity(&self) -> Vec<ValidationError>;
}

/// Validation pipeline configuration
pub struct ValidationConfig {
    pub check_cycles: bool,
    pub check_types: bool,
    pub check_connectivity: bool,
    pub allow_orphan_nodes: bool,
}
```

**Tasks**:
- [ ] Define all validation error types
- [ ] Implement structure validation
- [ ] Implement type compatibility checking
- [ ] Implement connectivity validation
- [ ] Create configurable validation pipeline
- [ ] Add validation warnings (non-fatal)
- [ ] Write comprehensive validation tests

**Acceptance Criteria**:
- ✅ All invalid workflows rejected
- ✅ Clear error messages with context
- ✅ Validation completes in <10ms for typical workflows


---

### M5.2.6: Property Tests (1 day)

**Goal**: Property-based testing for DAG invariants

**Deliverables**:
```rust
// tests/property_tests.rs

use proptest::prelude::*;

proptest! {
    #[test]
    fn topological_sort_respects_dependencies(workflow in arb_valid_workflow()) {
        let sorted = workflow.topological_sort().unwrap();
        for edge in &workflow.edges {
            let source_idx = sorted.iter().position(|n| n == edge.source_node()).unwrap();
            let target_idx = sorted.iter().position(|n| n == edge.target_node()).unwrap();
            prop_assert!(source_idx < target_idx);
        }
    }
    
    #[test]
    fn cycle_detection_finds_all_cycles(workflow in arb_workflow_with_cycle()) {
        let result = workflow.detect_cycles();
        prop_assert!(result.has_cycle);
    }
    
    #[test]
    fn valid_workflows_pass_validation(workflow in arb_valid_workflow()) {
        let result = workflow.validate();
        prop_assert!(result.is_valid);
    }
}
```

**Tasks**:
- [ ] Create arbitrary workflow generators
- [ ] Write property tests for topological sort
- [ ] Write property tests for cycle detection
- [ ] Write property tests for validation
- [ ] Run with 1000+ test cases

**Acceptance Criteria**:
- ✅ All property tests pass
- ✅ Edge cases covered by generators
- ✅ No panics on any generated input


---

## 💾 M5.3: Workflow Serialization

**Crate**: `symphony-workflow-model` (extended)
**Duration**: 2 weeks
**Dependencies**: M5.1


### M5.3.1: JSON Serialization (2 days)

**Goal**: Human-readable JSON format for workflow interchange

**Deliverables**:
```rust
// src/serialize/json.rs

use serde::{Deserialize, Serialize};

impl Workflow {
    /// Serialize to JSON string
    pub fn to_json(&self) -> Result<String, SerializeError>;
    
    /// Serialize to JSON with pretty formatting
    pub fn to_json_pretty(&self) -> Result<String, SerializeError>;
    
    /// Deserialize from JSON string
    pub fn from_json(json: &str) -> Result<Self, DeserializeError>;
    
    /// Serialize to JSON writer
    pub fn to_json_writer<W: Write>(&self, writer: W) -> Result<(), SerializeError>;
    
    /// Deserialize from JSON reader
    pub fn from_json_reader<R: Read>(reader: R) -> Result<Self, DeserializeError>;
}

/// JSON schema version for compatibility
#[derive(Serialize, Deserialize)]
struct JsonEnvelope {
    pub schema_version: String,
    pub workflow: Workflow,
}
```

**Tasks**:
- [ ] Add serde derives to all types
- [ ] Implement JSON serialization
- [ ] Implement JSON deserialization
- [ ] Add schema version envelope
- [ ] Handle special types (DateTime, UUID)
- [ ] Write round-trip tests

**Acceptance Criteria**:
- ✅ JSON is human-readable
- ✅ Round-trip preserves all data
- ✅ Schema version included for compatibility


---

### M5.3.2: Binary Serialization (2 days)

**Goal**: Compact binary format for performance

**Deliverables**:
```rust
// src/serialize/binary.rs

impl Workflow {
    /// Serialize to MessagePack bytes
    pub fn to_msgpack(&self) -> Result<Vec<u8>, SerializeError>;
    
    /// Deserialize from MessagePack bytes
    pub fn from_msgpack(bytes: &[u8]) -> Result<Self, DeserializeError>;
    
    /// Serialize to Bincode bytes (fastest)
    pub fn to_bincode(&self) -> Result<Vec<u8>, SerializeError>;
    
    /// Deserialize from Bincode bytes
    pub fn from_bincode(bytes: &[u8]) -> Result<Self, DeserializeError>;
}

/// Compression options for binary formats
pub enum Compression {
    None,
    Lz4,
    Zstd,
}

impl Workflow {
    /// Serialize with compression
    pub fn to_compressed(&self, compression: Compression) -> Result<Vec<u8>, SerializeError>;
    
    /// Deserialize with auto-detected compression
    pub fn from_compressed(bytes: &[u8]) -> Result<Self, DeserializeError>;
}
```

**Tasks**:
- [ ] Implement MessagePack serialization
- [ ] Implement Bincode serialization
- [ ] Add optional compression (LZ4, Zstd)
- [ ] Benchmark size vs JSON
- [ ] Write round-trip tests

**Acceptance Criteria**:
- ✅ Binary format 50%+ smaller than JSON
- ✅ Serialization <1ms for typical workflows
- ✅ Compression reduces size by additional 30%+


---

### M5.3.3: Pretty Printer (2 days)

**Goal**: Human-readable text representation for debugging

**Deliverables**:
```rust
// src/serialize/pretty.rs

pub trait PrettyPrint {
    fn pretty_print(&self) -> String;
    fn pretty_print_compact(&self) -> String;
}

impl PrettyPrint for Workflow {
    fn pretty_print(&self) -> String {
        // Multi-line, indented, with colors
    }
    
    fn pretty_print_compact(&self) -> String {
        // Single-line summary
    }
}

impl PrettyPrint for Node {
    fn pretty_print(&self) -> String;
    fn pretty_print_compact(&self) -> String;
}

/// Pretty print configuration
pub struct PrettyConfig {
    pub use_colors: bool,
    pub indent_size: usize,
    pub max_depth: usize,
    pub show_metadata: bool,
}

impl Workflow {
    pub fn pretty_print_with_config(&self, config: &PrettyConfig) -> String;
}
```

**Tasks**:
- [ ] Implement `PrettyPrint` trait
- [ ] Add workflow pretty printing
- [ ] Add node pretty printing
- [ ] Add edge pretty printing
- [ ] Support colorized output
- [ ] Add configurable formatting

**Acceptance Criteria**:
- ✅ Output is human-readable
- ✅ Shows workflow structure clearly
- ✅ Colors work in terminals


---

### M5.3.4: Schema Versioning (2 days)

**Goal**: Track schema versions for compatibility

**Deliverables**:
```rust
// src/serialize/versioning.rs

/// Schema version information
pub struct SchemaVersion {
    pub major: u32,
    pub minor: u32,
    pub patch: u32,
}

impl SchemaVersion {
    pub const CURRENT: SchemaVersion = SchemaVersion { major: 1, minor: 0, patch: 0 };
    
    pub fn is_compatible(&self, other: &SchemaVersion) -> bool;
    pub fn requires_migration(&self, other: &SchemaVersion) -> bool;
}

/// Versioned workflow envelope
#[derive(Serialize, Deserialize)]
pub struct VersionedWorkflow {
    pub schema_version: SchemaVersion,
    pub created_with: String,  // Symphony version
    pub workflow: serde_json::Value,  // Raw for migration
}

impl VersionedWorkflow {
    pub fn wrap(workflow: &Workflow) -> Self;
    pub fn unwrap(self) -> Result<Workflow, MigrationError>;
}
```

**Tasks**:
- [ ] Define `SchemaVersion` struct
- [ ] Implement version comparison
- [ ] Create versioned envelope
- [ ] Add version to all serialized formats
- [ ] Write version compatibility tests

**Acceptance Criteria**:
- ✅ Version included in all serialized workflows
- ✅ Compatibility checking works correctly
- ✅ Old versions can be detected


---

### M5.3.5: Migration System (2 days)

**Goal**: Migrate workflows between schema versions

**Deliverables**:
```rust
// src/serialize/migration.rs

/// Migration trait for version upgrades
pub trait Migration {
    fn from_version(&self) -> SchemaVersion;
    fn to_version(&self) -> SchemaVersion;
    fn migrate(&self, workflow: serde_json::Value) -> Result<serde_json::Value, MigrationError>;
}

/// Migration registry
pub struct MigrationRegistry {
    migrations: Vec<Box<dyn Migration>>,
}

impl MigrationRegistry {
    pub fn register(&mut self, migration: Box<dyn Migration>);
    pub fn migrate(&self, workflow: VersionedWorkflow, target: SchemaVersion) -> Result<Workflow, MigrationError>;
    pub fn can_migrate(&self, from: SchemaVersion, to: SchemaVersion) -> bool;
}

/// Built-in migrations
pub struct MigrationV1_0ToV1_1;
impl Migration for MigrationV1_0ToV1_1 {
    // ...
}
```

**Tasks**:
- [ ] Define `Migration` trait
- [ ] Implement `MigrationRegistry`
- [ ] Create migration path finding
- [ ] Add rollback support
- [ ] Write migration tests

**Acceptance Criteria**:
- ✅ Old workflows can be migrated
- ✅ Migration chain works (v1.0 → v1.1 → v1.2)
- ✅ Failed migrations don't corrupt data

---

### M5.3.6: Round-trip Tests (1 day)

**Goal**: Ensure serialization preserves all data

**Deliverables**:
```rust
// tests/serialization_tests.rs

use proptest::prelude::*;

proptest! {
    #[test]
    fn json_roundtrip(workflow in arb_workflow()) {
        let json = workflow.to_json().unwrap();
        let decoded = Workflow::from_json(&json).unwrap();
        prop_assert_eq!(workflow, decoded);
    }
    
    #[test]
    fn msgpack_roundtrip(workflow in arb_workflow()) {
        let bytes = workflow.to_msgpack().unwrap();
        let decoded = Workflow::from_msgpack(&bytes).unwrap();
        prop_assert_eq!(workflow, decoded);
    }
    
    #[test]
    fn bincode_roundtrip(workflow in arb_workflow()) {
        let bytes = workflow.to_bincode().unwrap();
        let decoded = Workflow::from_bincode(&bytes).unwrap();
        prop_assert_eq!(workflow, decoded);
    }
}
```

**Tasks**:
- [ ] Write JSON round-trip property tests
- [ ] Write MessagePack round-trip tests
- [ ] Write Bincode round-trip tests
- [ ] Test with edge cases (empty, large, unicode)
- [ ] Run with 1000+ test cases

**Acceptance Criteria**:
- ✅ All round-trip tests pass
- ✅ Edge cases handled correctly
- ✅ No data loss in any format


---

## 📋 M5.4: Template System

**Crate**: `symphony-workflow-templates`
**Duration**: 2 weeks
**Dependencies**: M5.1, M5.3


### M5.4.1: Template Definition (2 days)

**Goal**: Define parameterized workflow templates

**Deliverables**:
```rust
// src/template.rs

/// Unique identifier for templates
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct TemplateId(pub Uuid);

/// Workflow template with parameter placeholders
pub struct WorkflowTemplate {
    pub id: TemplateId,
    pub name: String,
    pub description: String,
    pub version: Version,
    pub workflow: Workflow,
    pub parameters: Vec<ParameterDefinition>,
    pub metadata: TemplateMetadata,
}

/// Template metadata
pub struct TemplateMetadata {
    pub author: String,
    pub category: String,
    pub tags: Vec<String>,
    pub icon: Option<String>,
    pub documentation_url: Option<String>,
    pub examples: Vec<TemplateExample>,
}

/// Example usage of a template
pub struct TemplateExample {
    pub name: String,
    pub description: String,
    pub parameters: HashMap<String, Value>,
}

impl WorkflowTemplate {
    pub fn new(name: impl Into<String>, workflow: Workflow) -> Self;
    pub fn add_parameter(&mut self, param: ParameterDefinition);
    pub fn validate(&self) -> Result<(), TemplateError>;
}
```

**Tasks**:
- [ ] Define `TemplateId` with UUID
- [ ] Define `WorkflowTemplate` struct
- [ ] Define `TemplateMetadata`
- [ ] Add example support
- [ ] Implement template validation
- [ ] Write template creation tests

**Acceptance Criteria**:
- ✅ Templates can parameterize any workflow property
- ✅ Metadata supports marketplace requirements
- ✅ Examples demonstrate usage


---

### M5.4.2: Parameter Schema (2 days)

**Goal**: Define parameter types and validation

**Deliverables**:
```rust
// src/parameters.rs

/// Parameter definition
pub struct ParameterDefinition {
    pub name: String,
    pub display_name: String,
    pub description: String,
    pub param_type: ParameterType,
    pub required: bool,
    pub default_value: Option<Value>,
    pub constraints: Vec<ParameterConstraint>,
    pub ui_hints: ParameterUIHints,
}

/// Parameter types
pub enum ParameterType {
    String,
    Integer,
    Float,
    Boolean,
    Enum(Vec<String>),
    Array(Box<ParameterType>),
    Object(Vec<ParameterDefinition>),
    ModelId,      // AI model selection
    DataType,     // Data type selection
    Expression,   // Workflow expression
}

/// Parameter constraints
pub enum ParameterConstraint {
    MinLength(usize),
    MaxLength(usize),
    MinValue(f64),
    MaxValue(f64),
    Pattern(String),  // Regex
    OneOf(Vec<Value>),
    Custom(String),   // Custom validator name
}

/// UI hints for parameter rendering
pub struct ParameterUIHints {
    pub widget: Option<String>,  // text, textarea, select, slider, etc.
    pub placeholder: Option<String>,
    pub help_text: Option<String>,
    pub group: Option<String>,
    pub order: i32,
}

impl ParameterDefinition {
    pub fn validate_value(&self, value: &Value) -> Result<(), ValidationError>;
}
```

**Tasks**:
- [ ] Define `ParameterDefinition` struct
- [ ] Define `ParameterType` enum
- [ ] Define `ParameterConstraint` enum
- [ ] Add UI hints for form generation
- [ ] Implement value validation
- [ ] Write parameter validation tests

**Acceptance Criteria**:
- ✅ All common parameter types supported
- ✅ Constraints validated correctly
- ✅ UI hints enable form generation


---

### M5.4.3: Instantiation (3 days)

**Goal**: Create workflows from templates with parameters

**Deliverables**:
```rust
// src/instantiate.rs

/// Template instantiation context
pub struct InstantiationContext {
    pub parameters: HashMap<String, Value>,
    pub overrides: HashMap<String, Value>,
}

/// Instantiation result
pub struct InstantiationResult {
    pub workflow: Workflow,
    pub warnings: Vec<InstantiationWarning>,
    pub applied_defaults: Vec<String>,
}

impl WorkflowTemplate {
    /// Instantiate template with parameters
    pub fn instantiate(&self, params: &HashMap<String, Value>) -> Result<InstantiationResult, InstantiationError>;
    
    /// Instantiate with context (includes overrides)
    pub fn instantiate_with_context(&self, ctx: &InstantiationContext) -> Result<InstantiationResult, InstantiationError>;
    
    /// Get required parameters
    pub fn required_parameters(&self) -> Vec<&ParameterDefinition>;
    
    /// Validate parameters before instantiation
    pub fn validate_parameters(&self, params: &HashMap<String, Value>) -> Result<(), ValidationError>;
}

/// Parameter placeholder in workflow
pub struct Placeholder {
    pub path: String,      // JSON path to value
    pub parameter: String, // Parameter name
    pub transform: Option<String>, // Optional transformation
}

impl WorkflowTemplate {
    /// Find all placeholders in template
    pub fn find_placeholders(&self) -> Vec<Placeholder>;
}
```

**Tasks**:
- [ ] Implement placeholder detection
- [ ] Implement parameter substitution
- [ ] Handle nested placeholders
- [ ] Apply default values
- [ ] Validate result workflow
- [ ] Write instantiation tests

**Acceptance Criteria**:
- ✅ All placeholders replaced correctly
- ✅ Defaults applied for missing optional params
- ✅ Invalid parameters rejected with clear errors


---

### M5.4.4: Template Library (2 days)

**Goal**: Manage collection of templates

**Deliverables**:
```rust
// src/library.rs

/// Template library for storage and retrieval
pub struct TemplateLibrary {
    templates: HashMap<TemplateId, WorkflowTemplate>,
    index: TemplateIndex,
}

/// Search index for templates
pub struct TemplateIndex {
    by_name: HashMap<String, TemplateId>,
    by_category: HashMap<String, Vec<TemplateId>>,
    by_tag: HashMap<String, Vec<TemplateId>>,
}

/// Search query for templates
pub struct TemplateQuery {
    pub text: Option<String>,
    pub category: Option<String>,
    pub tags: Vec<String>,
    pub author: Option<String>,
    pub limit: usize,
    pub offset: usize,
}

impl TemplateLibrary {
    pub fn new() -> Self;
    pub fn add(&mut self, template: WorkflowTemplate) -> Result<(), LibraryError>;
    pub fn get(&self, id: &TemplateId) -> Option<&WorkflowTemplate>;
    pub fn get_by_name(&self, name: &str) -> Option<&WorkflowTemplate>;
    pub fn search(&self, query: &TemplateQuery) -> Vec<&WorkflowTemplate>;
    pub fn list_categories(&self) -> Vec<&str>;
    pub fn list_tags(&self) -> Vec<&str>;
    pub fn remove(&mut self, id: &TemplateId) -> Option<WorkflowTemplate>;
}
```

**Tasks**:
- [ ] Implement `TemplateLibrary` struct
- [ ] Add search index
- [ ] Implement text search
- [ ] Add category/tag filtering
- [ ] Support pagination
- [ ] Write library tests

**Acceptance Criteria**:
- ✅ Search returns results in <100ms
- ✅ Supports 1000+ templates
- ✅ Filtering works correctly


---

### M5.4.5: Versioning (1 day)

**Goal**: Version management for templates

**Deliverables**:
```rust
// src/versioning.rs

impl TemplateLibrary {
    /// Add new version of existing template
    pub fn add_version(&mut self, template: WorkflowTemplate) -> Result<(), LibraryError>;
    
    /// Get all versions of a template
    pub fn get_versions(&self, name: &str) -> Vec<&WorkflowTemplate>;
    
    /// Get latest version
    pub fn get_latest(&self, name: &str) -> Option<&WorkflowTemplate>;
    
    /// Get specific version
    pub fn get_version(&self, name: &str, version: &Version) -> Option<&WorkflowTemplate>;
}

/// Version constraint for dependencies
pub enum VersionConstraint {
    Exact(Version),
    Range { min: Option<Version>, max: Option<Version> },
    Compatible(Version),  // ^1.2.3 style
}
```

**Tasks**:
- [ ] Implement version tracking
- [ ] Add version constraint parsing
- [ ] Implement version resolution
- [ ] Write versioning tests

**Acceptance Criteria**:
- ✅ Multiple versions coexist
- ✅ Latest version easily accessible
- ✅ Version constraints work correctly

---

### M5.4.6: Validation Tests (1 day)

**Goal**: Comprehensive template validation tests

**Tasks**:
- [ ] Test template creation
- [ ] Test parameter validation
- [ ] Test instantiation
- [ ] Test library operations
- [ ] Test versioning
- [ ] Achieve >90% coverage


---

## 🎛️ M5.5: Execution State API

**Crate**: `symphony-workflow-execution`
**Duration**: 3 weeks
**Dependencies**: M5.1, M5.2


### M5.5.1: State Machine (2 days)

**Goal**: Define execution states and valid transitions

**Deliverables**:
```rust
// src/state.rs

/// Workflow execution states
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ExecutionState {
    /// Waiting to start
    Pending,
    /// Currently executing
    Running,
    /// Temporarily paused
    Paused,
    /// Successfully completed
    Completed,
    /// Failed with error
    Failed { error: ExecutionError },
    /// Cancelled by user
    Cancelled,
    /// Waiting for external input
    WaitingForInput { prompt: String },
}

/// Node execution states
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum NodeState {
    Pending,
    Queued,
    Running,
    Completed { output: Value },
    Failed { error: NodeError },
    Skipped { reason: String },
}

/// Execution context tracking all state
pub struct ExecutionContext {
    pub execution_id: ExecutionId,
    pub workflow_id: WorkflowId,
    pub state: ExecutionState,
    pub node_states: HashMap<NodeId, NodeState>,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub metadata: HashMap<String, Value>,
}

impl ExecutionContext {
    pub fn new(workflow_id: WorkflowId) -> Self;
    pub fn is_terminal(&self) -> bool;
    pub fn is_running(&self) -> bool;
    pub fn duration(&self) -> Option<Duration>;
}
```

**Tasks**:
- [ ] Define `ExecutionState` enum
- [ ] Define `NodeState` enum
- [ ] Define `ExecutionContext` struct
- [ ] Add state query methods
- [ ] Implement state serialization
- [ ] Write state tests

**Acceptance Criteria**:
- ✅ All execution states representable
- ✅ Terminal states identified correctly
- ✅ Context tracks all relevant information


---

### M5.5.2: State Transitions (2 days)

**Goal**: Implement valid state transitions with validation

**Deliverables**:
```rust
// src/transitions.rs

/// State transition result
pub struct TransitionResult {
    pub from: ExecutionState,
    pub to: ExecutionState,
    pub timestamp: DateTime<Utc>,
    pub reason: Option<String>,
}

/// State machine for execution
pub struct ExecutionStateMachine {
    context: ExecutionContext,
    history: Vec<TransitionResult>,
}

impl ExecutionStateMachine {
    pub fn new(workflow_id: WorkflowId) -> Self;
    
    /// Attempt state transition
    pub fn transition(&mut self, to: ExecutionState) -> Result<TransitionResult, TransitionError>;
    
    /// Check if transition is valid
    pub fn can_transition(&self, to: &ExecutionState) -> bool;
    
    /// Get valid transitions from current state
    pub fn valid_transitions(&self) -> Vec<ExecutionState>;
    
    /// Get transition history
    pub fn history(&self) -> &[TransitionResult];
    
    /// Update node state
    pub fn update_node(&mut self, node_id: NodeId, state: NodeState) -> Result<(), TransitionError>;
}

/// Valid transitions:
/// Pending -> Running
/// Running -> Paused, Completed, Failed, Cancelled, WaitingForInput
/// Paused -> Running, Cancelled
/// WaitingForInput -> Running, Cancelled
/// Completed, Failed, Cancelled -> (terminal, no transitions)
```

**Tasks**:
- [ ] Define valid transition rules
- [ ] Implement transition validation
- [ ] Track transition history
- [ ] Add node state updates
- [ ] Implement rollback support
- [ ] Write transition tests

**Acceptance Criteria**:
- ✅ Invalid transitions rejected
- ✅ History preserved for debugging
- ✅ Transitions are atomic


---

### M5.5.3: Progress Tracking (2 days)

**Goal**: Track execution progress for UI updates

**Deliverables**:
```rust
// src/progress.rs

/// Overall progress information
pub struct Progress {
    pub total_nodes: usize,
    pub completed_nodes: usize,
    pub failed_nodes: usize,
    pub running_nodes: usize,
    pub pending_nodes: usize,
    pub percentage: f64,
    pub estimated_remaining: Option<Duration>,
}

/// Node progress information
pub struct NodeProgress {
    pub node_id: NodeId,
    pub state: NodeState,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub progress_percentage: Option<f64>,
    pub status_message: Option<String>,
}

impl ExecutionContext {
    /// Get overall progress
    pub fn progress(&self) -> Progress;
    
    /// Get progress for specific node
    pub fn node_progress(&self, node_id: &NodeId) -> Option<NodeProgress>;
    
    /// Get all node progress
    pub fn all_node_progress(&self) -> Vec<NodeProgress>;
    
    /// Update node progress
    pub fn update_progress(&mut self, node_id: NodeId, percentage: f64, message: Option<String>);
}

/// Progress estimator based on historical data
pub struct ProgressEstimator {
    historical_durations: HashMap<String, Vec<Duration>>,
}

impl ProgressEstimator {
    pub fn estimate_remaining(&self, ctx: &ExecutionContext, workflow: &Workflow) -> Option<Duration>;
}
```

**Tasks**:
- [ ] Implement `Progress` struct
- [ ] Implement `NodeProgress` struct
- [ ] Add progress calculation
- [ ] Implement time estimation
- [ ] Add progress update methods
- [ ] Write progress tests

**Acceptance Criteria**:
- ✅ Progress updates within 10ms of node completion
- ✅ Percentage calculation accurate
- ✅ Time estimation improves with history


---

### M5.5.4: Control Commands (2 days)

**Goal**: Commands to control workflow execution

**Deliverables**:
```rust
// src/control.rs

/// Control commands for execution
pub enum ControlCommand {
    /// Start execution
    Start,
    /// Pause execution
    Pause,
    /// Resume from pause
    Resume,
    /// Cancel execution
    Cancel { reason: Option<String> },
    /// Retry failed node
    RetryNode { node_id: NodeId },
    /// Skip failed node
    SkipNode { node_id: NodeId },
    /// Provide input for waiting node
    ProvideInput { node_id: NodeId, input: Value },
}

/// Command result
pub struct CommandResult {
    pub success: bool,
    pub message: String,
    pub new_state: ExecutionState,
}

/// Execution controller
pub struct ExecutionController {
    state_machine: ExecutionStateMachine,
}

impl ExecutionController {
    pub fn new(workflow_id: WorkflowId) -> Self;
    
    /// Execute a control command
    pub fn execute_command(&mut self, cmd: ControlCommand) -> Result<CommandResult, ControlError>;
    
    /// Check if command is valid in current state
    pub fn can_execute(&self, cmd: &ControlCommand) -> bool;
    
    /// Get available commands
    pub fn available_commands(&self) -> Vec<ControlCommand>;
}
```

**Tasks**:
- [ ] Define `ControlCommand` enum
- [ ] Implement command execution
- [ ] Add command validation
- [ ] Implement retry logic
- [ ] Implement skip logic
- [ ] Write command tests

**Acceptance Criteria**:
- ✅ Commands take effect within 100ms
- ✅ Invalid commands rejected with clear errors
- ✅ Retry and skip work correctly


---

### M5.5.5: Event Streaming (3 days)

**Goal**: Real-time event stream for UI updates

**Deliverables**:
```rust
// src/events.rs

use tokio::sync::broadcast;

/// Execution events
#[derive(Debug, Clone)]
pub enum ExecutionEvent {
    /// Execution started
    Started { execution_id: ExecutionId },
    /// State changed
    StateChanged { from: ExecutionState, to: ExecutionState },
    /// Node started
    NodeStarted { node_id: NodeId },
    /// Node progress updated
    NodeProgress { node_id: NodeId, percentage: f64, message: Option<String> },
    /// Node completed
    NodeCompleted { node_id: NodeId, output: Value },
    /// Node failed
    NodeFailed { node_id: NodeId, error: NodeError },
    /// Execution completed
    Completed { result: ExecutionResult },
    /// Execution failed
    Failed { error: ExecutionError },
    /// Log message
    Log { level: LogLevel, message: String },
}

/// Event stream for subscribers
pub struct EventStream {
    sender: broadcast::Sender<ExecutionEvent>,
}

impl EventStream {
    pub fn new(capacity: usize) -> Self;
    
    /// Subscribe to events
    pub fn subscribe(&self) -> broadcast::Receiver<ExecutionEvent>;
    
    /// Emit an event
    pub fn emit(&self, event: ExecutionEvent);
    
    /// Get event history (if buffered)
    pub fn history(&self) -> Vec<ExecutionEvent>;
}

/// Event filter for selective subscription
pub struct EventFilter {
    pub event_types: Option<Vec<String>>,
    pub node_ids: Option<Vec<NodeId>>,
    pub min_level: Option<LogLevel>,
}

impl EventStream {
    pub fn subscribe_filtered(&self, filter: EventFilter) -> FilteredReceiver;
}
```

**Tasks**:
- [ ] Define `ExecutionEvent` enum
- [ ] Implement broadcast channel
- [ ] Add event filtering
- [ ] Implement event history
- [ ] Add backpressure handling
- [ ] Write streaming tests

**Acceptance Criteria**:
- ✅ Events delivered within 1ms
- ✅ Multiple subscribers supported
- ✅ Filtering reduces unnecessary traffic


---

### M5.5.6: Audit Log (2 days)

**Goal**: Persistent log of all execution events

**Deliverables**:
```rust
// src/audit.rs

/// Audit log entry
pub struct AuditEntry {
    pub id: AuditEntryId,
    pub execution_id: ExecutionId,
    pub timestamp: DateTime<Utc>,
    pub event_type: String,
    pub details: Value,
    pub actor: Option<String>,
}

/// Audit log storage
pub struct AuditLog {
    storage: Box<dyn AuditStorage>,
}

#[async_trait]
pub trait AuditStorage: Send + Sync {
    async fn append(&self, entry: AuditEntry) -> Result<(), AuditError>;
    async fn query(&self, query: AuditQuery) -> Result<Vec<AuditEntry>, AuditError>;
    async fn get_by_execution(&self, execution_id: &ExecutionId) -> Result<Vec<AuditEntry>, AuditError>;
}

/// Query for audit entries
pub struct AuditQuery {
    pub execution_id: Option<ExecutionId>,
    pub event_types: Option<Vec<String>>,
    pub start_time: Option<DateTime<Utc>>,
    pub end_time: Option<DateTime<Utc>>,
    pub limit: usize,
    pub offset: usize,
}

impl AuditLog {
    pub async fn log(&self, execution_id: ExecutionId, event: &ExecutionEvent) -> Result<(), AuditError>;
    pub async fn query(&self, query: AuditQuery) -> Result<Vec<AuditEntry>, AuditError>;
    pub async fn export(&self, execution_id: &ExecutionId, format: ExportFormat) -> Result<Vec<u8>, AuditError>;
}
```

**Tasks**:
- [ ] Define `AuditEntry` struct
- [ ] Define `AuditStorage` trait
- [ ] Implement in-memory storage
- [ ] Implement file-based storage
- [ ] Add query support
- [ ] Add export functionality
- [ ] Write audit tests

**Acceptance Criteria**:
- ✅ All events logged persistently
- ✅ Query returns results in <100ms
- ✅ Export supports JSON and CSV

---

### M5.5.7: Integration Tests (2 days)

**Goal**: End-to-end tests for execution API

**Tasks**:
- [ ] Test full execution lifecycle
- [ ] Test pause/resume flow
- [ ] Test retry/skip flow
- [ ] Test event streaming
- [ ] Test audit logging
- [ ] Test concurrent executions
- [ ] Achieve >90% coverage


---

## 📊 M5 Summary

| Sub-Milestone | Tasks | Duration | Status |
|---------------|-------|----------|--------|
| M5.1.1 Workflow Struct | 7 | 2 days | 📋 |
| M5.1.2 Node Types | 11 | 3 days | 📋 |
| M5.1.3 Edge Types | 8 | 2 days | 📋 |
| M5.1.4 Workflow Builder | 7 | 2 days | 📋 |
| M5.1.5 Metadata System | 5 | 1 day | 📋 |
| M5.1.6 Unit Tests | 6 | 1 day | 📋 |
| M5.2.1 Cycle Detection | 5 | 2 days | 📋 |
| M5.2.2 Topological Sort | 5 | 2 days | 📋 |
| M5.2.3 Dependency Resolver | 6 | 2 days | 📋 |
| M5.2.4 Graph Traversal | 6 | 2 days | 📋 |
| M5.2.5 Validation Pipeline | 7 | 2 days | 📋 |
| M5.2.6 Property Tests | 5 | 1 day | 📋 |
| M5.3.1 JSON Serialization | 6 | 2 days | 📋 |
| M5.3.2 Binary Serialization | 5 | 2 days | 📋 |
| M5.3.3 Pretty Printer | 6 | 2 days | 📋 |
| M5.3.4 Schema Versioning | 5 | 2 days | 📋 |
| M5.3.5 Migration System | 5 | 2 days | 📋 |
| M5.3.6 Round-trip Tests | 5 | 1 day | 📋 |
| M5.4.1 Template Definition | 6 | 2 days | 📋 |
| M5.4.2 Parameter Schema | 6 | 2 days | 📋 |
| M5.4.3 Instantiation | 6 | 3 days | 📋 |
| M5.4.4 Template Library | 6 | 2 days | 📋 |
| M5.4.5 Versioning | 4 | 1 day | 📋 |
| M5.4.6 Validation Tests | 6 | 1 day | 📋 |
| M5.5.1 State Machine | 6 | 2 days | 📋 |
| M5.5.2 State Transitions | 6 | 2 days | 📋 |
| M5.5.3 Progress Tracking | 6 | 2 days | 📋 |
| M5.5.4 Control Commands | 6 | 2 days | 📋 |
| M5.5.5 Event Streaming | 6 | 3 days | 📋 |
| M5.5.6 Audit Log | 7 | 2 days | 📋 |
| M5.5.7 Integration Tests | 7 | 2 days | 📋 |

**Total Tasks**: ~175 detailed tasks
**Total Duration**: 11 weeks (with parallelization: ~8 weeks)

---

**Next**: [MILESTONE_LEVEL2_M4.md](./MILESTONE_LEVEL2_M4.md)
