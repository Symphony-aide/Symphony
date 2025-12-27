# M5: Visual Orchestration Backend - Requirements

> **Parent**: [LEVEL2_M5.md](./LEVEL2_M5.md)
> **Type**: ATDD Acceptance Criteria & Gherkin Scenarios

---

## 📖 Glossary

| Term | Definition |
|------|------------|
| **OFB Python** | Out of Boundary Python - refers to Python API components that handle authoritative validation, RBAC, and data persistence outside the Rust boundary |
| **Pre-validation** | Lightweight technical validation in Rust to prevent unnecessary HTTP requests (NOT business logic) |
| **Authoritative Validation** | Complete validation including RBAC, business rules, and data constraints performed by OFB Python |
| **Two-Layer Architecture** | Rust (orchestration + pre-validation) + OFB Python (validation + persistence) |
| **Workflow** | A directed acyclic graph (DAG) of nodes and edges representing an AI orchestration pipeline |
| **Node** | A processing unit in a workflow (Instrument, Operator, Control, Input, Output) |
| **Edge** | A connection between nodes (Data, Control, Conditional) |
| **Template** | A parameterized workflow definition that can be instantiated with specific values |
| **Execution State** | The current status of a workflow execution (Pending, Running, Paused, etc.) |
| **DAG** | Directed Acyclic Graph - a graph with directed edges and no cycles |
| **Topological Sort** | An ordering of nodes where all dependencies come before dependents |
| **Port** | An input or output connection point on a node |
| **Mock-Based Contract Testing** | Testing approach using mocked dependencies to verify component contracts |
| **WireMock Contract Verification** | HTTP endpoint mocking for testing integration with OFB Python services |
| **Three-Layer Testing** | Unit tests (<100ms), Integration tests (<5s), Pre-validation tests (<1ms) |

---

## 🎯 M5.1: Workflow Data Model

### Feature: Workflow Creation and Management

```gherkin
Feature: Workflow Data Model
  As a workflow designer
  I want to create and manage workflow structures
  So that I can define AI orchestration pipelines

  Scenario: Create empty workflow
    Given I want to create a new workflow
    When I create a workflow named "My Pipeline"
    Then the workflow should have a unique ID
    And the workflow should have zero nodes
    And the workflow should have zero edges
    And the workflow should have a creation timestamp

  Scenario: Add nodes to workflow
    Given a workflow named "Test Workflow"
    When I add an Instrument node named "GPT-4"
    And I add an Operator node named "JSON Format"
    Then the workflow should have 2 nodes
    And node lookup by ID should be O(1)

  Scenario: Support large workflows
    Given a workflow named "Large Workflow"
    When I add 10,000 nodes to the workflow
    Then all nodes should be accessible
    And node lookup should complete in under 1ms

  Scenario: Add edges between nodes
    Given a workflow with nodes "Input", "Process", "Output"
    When I add a data edge from "Input" to "Process"
    And I add a data edge from "Process" to "Output"
    Then the workflow should have 2 edges
    And the edges should connect the correct ports
```

### Feature: Node Types

```gherkin
Feature: Node Type Support
  As a workflow designer
  I want different node types for different purposes
  So that I can build comprehensive AI pipelines

  Scenario: Create Instrument node for AI models
    Given I want to add an AI model to my workflow
    When I create an Instrument node with model "gpt-4"
    Then the node should have configurable inputs
    And the node should have configurable outputs
    And the node should support model versioning

  Scenario: Create Operator node for data transformation
    Given I want to transform data in my workflow
    When I create an Operator node of type "JsonFormat"
    Then the node should have input ports
    And the node should have output ports
    And the node should have transformation config

  Scenario: Create Control node for flow control
    Given I want to add branching logic
    When I create a Control node of type "Branch"
    Then the node should support conditional expressions
    And the node should have multiple output paths
```

### Feature: Edge Types

```gherkin
Feature: Edge Type Support
  As a workflow designer
  I want different edge types for different connection semantics
  So that I can express complex data and control flows

  Scenario: Create data edge with port mapping
    Given nodes "Source" with output "result" and "Target" with input "data"
    When I create a data edge from "Source.result" to "Target.data"
    Then the edge should validate port compatibility
    And the edge should support optional data transformation

  Scenario: Create control edge for execution order
    Given nodes "First" and "Second"
    When I create a control edge from "First" to "Second"
    Then "Second" should execute after "First" completes
    And the edge should support priority ordering

  Scenario: Create conditional edge for branching
    Given a Branch node and target nodes "TruePath" and "FalsePath"
    When I create conditional edges with expressions
    Then each edge should have a condition expression
    And edges should have optional labels
```

---

## 🎯 M5.2: DAG Validation & Operations

### Feature: Cycle Detection

```gherkin
Feature: Cycle Detection
  As a workflow validator
  I want to detect cycles in workflow graphs
  So that I can ensure valid DAG structure

  Scenario: Detect simple cycle
    Given a workflow with nodes A -> B -> C -> A
    When I run cycle detection
    Then a cycle should be detected
    And the cycle path should be reported as [A, B, C, A]

  Scenario: Detect no cycle in valid DAG
    Given a workflow with nodes A -> B -> C (no back edges)
    When I run cycle detection
    Then no cycle should be detected

  Scenario: Prevent cycle creation
    Given a valid DAG workflow
    When I attempt to add an edge that would create a cycle
    Then the edge should be rejected
    And an error should explain the cycle path

  Scenario: Handle large graphs efficiently
    Given a workflow with 10,000 nodes
    When I run cycle detection
    Then detection should complete in O(V + E) time
```

### Feature: Topological Sort

```gherkin
Feature: Topological Sort
  As a workflow executor
  I want to determine valid execution order
  So that dependencies are satisfied before execution

  Scenario: Sort simple linear workflow
    Given a workflow A -> B -> C
    When I perform topological sort
    Then the result should be [A, B, C]

  Scenario: Sort workflow with parallel paths
    Given a workflow with A -> B, A -> C, B -> D, C -> D
    When I perform topological sort
    Then A should come before B and C
    And B and C should come before D

  Scenario: Determine execution levels
    Given a workflow with parallel opportunities
    When I calculate execution levels
    Then nodes at the same level can execute in parallel
    And all dependencies are in earlier levels

  Scenario: Deterministic ordering
    Given the same workflow structure
    When I perform topological sort multiple times
    Then the result should be identical each time
```

### Feature: Dependency Resolution

```gherkin
Feature: Dependency Resolution
  As a workflow analyzer
  I want to resolve node dependencies
  So that I can plan execution and identify bottlenecks

  Scenario: Get direct dependencies
    Given a node with 3 incoming edges
    When I query direct dependencies
    Then I should get exactly 3 predecessor nodes

  Scenario: Get transitive dependencies
    Given a node at the end of a chain A -> B -> C -> D
    When I query all dependencies of D
    Then I should get [A, B, C]

  Scenario: Calculate critical path
    Given a workflow with multiple paths of different lengths
    When I calculate the critical path
    Then I should get the longest dependency chain
    And this identifies the execution bottleneck
```

### Feature: Validation Pipeline

```gherkin
Feature: Workflow Validation
  As a workflow designer
  I want comprehensive validation
  So that I catch errors before execution

  Scenario: Validate structure
    Given a workflow with potential structural issues
    When I run structure validation
    Then cycles should be detected
    And orphan nodes should be flagged
    And duplicate IDs should be rejected

  Scenario: Validate type compatibility
    Given edges connecting ports of different types
    When I run type validation
    Then incompatible connections should be flagged
    And the expected vs actual types should be reported

  Scenario: Validate connectivity
    Given a workflow with disconnected inputs
    When I run connectivity validation
    Then required inputs without connections should be flagged
    And the specific missing connections should be listed

  Scenario: Complete validation pipeline
    Given a workflow with multiple issues
    When I run full validation
    Then all errors should be collected
    And warnings should be separated from errors
    And validation should complete in under 10ms for typical workflows
```

---

## 🎯 M5.3: Workflow Serialization

### Feature: JSON Serialization

```gherkin
Feature: JSON Serialization
  As a workflow user
  I want human-readable JSON format
  So that I can inspect and edit workflows manually

  Scenario: Serialize workflow to JSON
    Given a complete workflow with nodes and edges
    When I serialize to JSON
    Then the output should be valid JSON
    And the output should include schema version
    And the output should be human-readable

  Scenario: Deserialize workflow from JSON
    Given a valid JSON workflow file
    When I deserialize the JSON
    Then I should get a complete Workflow object
    And all nodes and edges should be restored
    And metadata should be preserved

  Scenario: Round-trip preservation
    Given any valid workflow
    When I serialize to JSON and deserialize back
    Then the result should equal the original
    And no data should be lost
```

### Feature: Binary Serialization

```gherkin
Feature: Binary Serialization
  As a system component
  I want compact binary format
  So that I can store and transmit workflows efficiently

  Scenario: Serialize to MessagePack
    Given a workflow
    When I serialize to MessagePack
    Then the output should be at least 50% smaller than JSON
    And serialization should complete in under 1ms

  Scenario: Serialize with compression
    Given a large workflow
    When I serialize with LZ4 compression
    Then the output should be 30%+ smaller than uncompressed
    And compression should not significantly impact speed

  Scenario: Binary round-trip
    Given any valid workflow
    When I serialize to binary and deserialize back
    Then the result should equal the original
```

### Feature: Schema Versioning

```gherkin
Feature: Schema Versioning
  As a system maintainer
  I want schema version tracking
  So that I can handle format evolution

  Scenario: Include version in serialization
    Given a workflow
    When I serialize in any format
    Then the schema version should be included
    And the Symphony version should be recorded

  Scenario: Detect incompatible versions
    Given a workflow serialized with schema v2.0
    When I attempt to load with schema v1.0 reader
    Then incompatibility should be detected
    And migration should be suggested

  Scenario: Migrate between versions
    Given a workflow in schema v1.0 format
    When I migrate to schema v1.1
    Then the workflow should be updated correctly
    And no data should be lost
    And the new version should be recorded
```

---

## 🎯 M5.4: Template System

### Feature: Template Definition

```gherkin
Feature: Template Definition
  As a workflow author
  I want to create parameterized templates
  So that others can reuse my workflow patterns

  Scenario: Create template from workflow
    Given a working workflow
    When I convert it to a template with parameters
    Then the template should have parameter definitions
    And the template should have metadata for discovery
    And the template should include usage examples

  Scenario: Define parameter with constraints
    Given a template parameter "model_name"
    When I add constraints (required, enum values)
    Then validation should enforce the constraints
    And UI hints should guide user input
```

### Feature: Template Instantiation

```gherkin
Feature: Template Instantiation
  As a workflow user
  I want to create workflows from templates
  So that I can quickly set up common patterns

  Scenario: Instantiate with all parameters
    Given a template with 3 required parameters
    When I provide all 3 parameter values
    Then a valid workflow should be created
    And all placeholders should be replaced

  Scenario: Instantiate with defaults
    Given a template with optional parameters having defaults
    When I provide only required parameters
    Then defaults should be applied for optional parameters
    And the workflow should be valid

  Scenario: Reject invalid parameters
    Given a template with constrained parameters
    When I provide values violating constraints
    Then instantiation should fail
    And specific validation errors should be returned
```

### Feature: Template Library

```gherkin
Feature: Template Library
  As a workflow user
  I want to search and browse templates
  So that I can find useful patterns

  Scenario: Search templates by text
    Given a library with 100 templates
    When I search for "code review"
    Then relevant templates should be returned
    And results should be ranked by relevance
    And search should complete in under 100ms

  Scenario: Filter by category and tags
    Given templates with various categories and tags
    When I filter by category "AI/ML" and tag "GPT"
    Then only matching templates should be returned

  Scenario: Manage template versions
    Given a template with multiple versions
    When I request the latest version
    Then I should get the most recent release
    And I should be able to access specific versions
```

---

## 🎯 M5.5: Execution State API

### Feature: State Machine

```gherkin
Feature: Execution State Machine
  As an execution engine
  I want well-defined execution states
  So that I can track and control workflow execution

  Scenario: Track workflow execution state
    Given a workflow execution
    When the execution progresses
    Then the state should transition correctly
    And invalid transitions should be rejected

  Scenario: Track node execution states
    Given a running workflow
    When individual nodes execute
    Then each node's state should be tracked
    And node outputs should be captured
```

### Feature: State Transitions

```gherkin
Feature: State Transitions
  As an execution controller
  I want valid state transitions
  So that execution follows correct lifecycle

  Scenario: Valid transition from Pending to Running
    Given an execution in Pending state
    When I start the execution
    Then the state should transition to Running
    And the transition should be recorded in history

  Scenario: Invalid transition from Completed
    Given an execution in Completed state
    When I attempt to transition to Running
    Then the transition should be rejected
    And an error should explain why

  Scenario: Transition history
    Given an execution that has gone through multiple states
    When I query the transition history
    Then I should see all transitions with timestamps
```

### Feature: Progress Tracking

```gherkin
Feature: Progress Tracking
  As a user
  I want to see execution progress
  So that I know how much work remains

  Scenario: Calculate overall progress
    Given a workflow with 10 nodes, 3 completed
    When I query progress
    Then I should see 30% completion
    And I should see counts for each state

  Scenario: Estimate remaining time
    Given historical execution data
    When I query estimated remaining time
    Then I should get a reasonable estimate
    And the estimate should improve with more history

  Scenario: Real-time progress updates
    Given a running execution
    When a node completes
    Then progress should update within 10ms
```

### Feature: Control Commands

```gherkin
Feature: Execution Control
  As a user
  I want to control workflow execution
  So that I can pause, resume, or cancel as needed

  Scenario: Pause running execution
    Given a running workflow execution
    When I send a Pause command
    Then the execution should pause
    And running nodes should complete before pausing

  Scenario: Resume paused execution
    Given a paused workflow execution
    When I send a Resume command
    Then the execution should continue from where it paused

  Scenario: Cancel execution
    Given a running workflow execution
    When I send a Cancel command
    Then the execution should stop
    And the state should be Cancelled
    And a cancellation reason should be recorded

  Scenario: Retry failed node
    Given an execution with a failed node
    When I send a RetryNode command
    Then the node should be re-executed
    And downstream nodes should wait for completion
```

### Feature: Event Streaming

```gherkin
Feature: Event Streaming
  As a UI component
  I want real-time execution events
  So that I can update the display immediately

  Scenario: Subscribe to execution events
    Given a running execution
    When I subscribe to the event stream
    Then I should receive events as they occur
    And events should arrive within 1ms of occurrence

  Scenario: Filter events by type
    Given an event stream with many event types
    When I subscribe with a filter for NodeCompleted events
    Then I should only receive NodeCompleted events

  Scenario: Multiple subscribers
    Given a running execution
    When multiple clients subscribe
    Then all clients should receive all events
    And no events should be lost
```

### Feature: Audit Logging

```gherkin
Feature: Audit Logging
  As a system administrator
  I want persistent execution logs
  So that I can review and debug past executions

  Scenario: Log all execution events
    Given a workflow execution
    When the execution completes
    Then all events should be persisted
    And events should be queryable by execution ID

  Scenario: Query audit log
    Given audit logs for multiple executions
    When I query by time range and event type
    Then matching entries should be returned
    And query should complete in under 100ms

  Scenario: Export audit log
    Given an execution's audit log
    When I export to JSON format
    Then I should get a complete event history
    And the export should be importable
```

---

## ✅ Acceptance Criteria Summary

| Component | Key Criteria |
|-----------|--------------|
| Workflow Data Model | 10,000+ nodes, O(1) lookup, all node/edge types |
| DAG Validation | O(V+E) cycle detection, deterministic sort, <10ms validation |
| Serialization | 50%+ binary compression, round-trip preservation, version migration |
| Template System | Constraint validation, <100ms search, version management |
| Execution State | Valid transitions only, <10ms progress updates, <1ms event delivery |
| Audit Log | Persistent storage, <100ms queries, JSON/CSV export |

---

## 🧪 Testing Strategy

### Three-Layer Testing Architecture

**Layer 1: Unit Tests (Rust) - <100ms**
- **Mock-Based Contract Testing**: All external dependencies mocked using mockall
- **Boundary Separation**: Rust tests focus on workflow data structures, DAG algorithms, and serialization
- **Coverage**: Workflow creation/modification, node/edge types, builder API, validation algorithms
- **Property Tests**: Topological sort correctness, cycle detection, serialization round-trips
- **Performance**: Sub-100ms execution for entire unit test suite

**Layer 2: Integration Tests (Rust + OFB Python) - <5s**
- **WireMock Contract Verification**: HTTP endpoints mocked with WireMock for OFB Python integration
- **Cross-Component Workflows**: Full execution lifecycle, pause/resume, retry/skip flows
- **Event Streaming**: Multiple subscribers, concurrent executions
- **Template System**: Instantiation with OFB Python validation
- **Audit Logging**: Persistence and querying with OFB Python storage

**Layer 3: Pre-validation Tests (Rust) - <1ms**
- **Technical Validation Only**: Schema validation, type checking, basic structural constraints
- **No Business Logic**: Pre-validation does NOT include user permissions, workflow authorization, or data persistence
- **Fast Rejection**: Prevent unnecessary HTTP requests to OFB Python layer
- **Examples**: JSON schema validation, DAG cycle detection, required field checks

### Testing Boundary Separation

**Rust Layer Tests**:
- Workflow data model operations
- DAG validation algorithms (cycle detection, topological sort)
- Serialization formats (JSON, MessagePack, Bincode)
- Template instantiation logic
- State machine transitions
- Event streaming and progress tracking
- Performance benchmarks (10,000+ node workflows)

**OFB Python Layer Tests** (via WireMock):
- Authoritative workflow validation with business rules
- User permission checking for workflow operations
- Template marketplace integration
- Audit log persistence and querying
- Workflow execution authorization
