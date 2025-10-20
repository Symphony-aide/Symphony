# Symphony IDE - Comprehensive Sequence Diagrams

> **Purpose**: This document provides detailed sequence diagrams covering all major workflows in Symphony IDE, showing interactions between actors, components, and systems.

---

## 1. Developer Workflow: Execute Melody (AI-Driven)

```mermaid
sequenceDiagram
    actor Dev as Developer
    participant UI as Frontend UI
    participant Core as Core (Rust)
    participant Conductor as 🎩 Conductor (Python RL)
    participant Pit as The Pit (In-Process)
    participant PoolMgr as Pool Manager
    participant DAG as DAG Tracker
    participant Artifact as Artifact Store
    
    Dev->>UI: Write Prompt
    UI->>Core: JSON-RPC: submitPrompt()
    Core->>Conductor: Process Prompt
    
    alt Maestro Mode (RL)
        Conductor->>Conductor: Analyze Context
        Conductor->>Conductor: Generate Melody (DAG)
        Conductor-->>Core: Melody Generated
    else Manual Mode
        Core-->>UI: Request Melody Selection
        UI-->>Dev: Show Melody Browser
        Dev->>UI: Select Melody
        UI->>Core: Selected Melody ID
    end
    
    Core->>Conductor: Orchestrate Tasks
    Conductor->>Pit: Dispatch Task Batch
    
    Pit->>PoolMgr: Allocate AI Model
    PoolMgr->>PoolMgr: Check Cache (50-100ns)
    alt Model Ready
        PoolMgr-->>Pit: Model Handle
    else Model Not Loaded
        PoolMgr->>PoolMgr: Load & Warm Model
        PoolMgr-->>Pit: Model Handle
    end
    
    Pit->>DAG: Execute Workflow
    DAG->>DAG: Topological Sort
    DAG->>DAG: Parallel Execution
    
    loop For Each Task Node
        DAG->>PoolMgr: Execute Task
        PoolMgr->>PoolMgr: Run AI Model
        PoolMgr-->>DAG: Task Result
        DAG->>Artifact: Store Result
        Artifact->>Artifact: Content-Addressable Storage
        Artifact->>Artifact: Quality Scoring
        Artifact-->>DAG: Artifact ID
    end
    
    DAG-->>Pit: Workflow Complete
    Pit-->>Conductor: Execution Results
    Conductor->>Conductor: Calculate Rewards (RL)
    Conductor-->>Core: Task Completed
    Core-->>UI: Update Status
    UI-->>Dev: Show Results
    
    Dev->>UI: View Artifacts
    UI->>Core: getArtifacts()
    Core->>Artifact: Retrieve Artifacts
    Artifact-->>Core: Artifact Data
    Core-->>UI: Artifact List
    UI-->>Dev: Display Artifacts
```

---

## 2. Extension Creator Workflow: Build & Publish Extension

```mermaid
sequenceDiagram
    actor Creator as Extension Creator
    participant CLI as Carets CLI
    participant SDK as Extension SDK
    participant Testing as Testing Framework
    participant Registry as Orchestra Kit Registry
    participant Marketplace as Grand Stage
    participant Security as Security Module
    
    Creator->>CLI: carets new my-instrument
    CLI->>SDK: Generate Template
    SDK->>SDK: Create Manifest (Symphony.toml)
    SDK->>SDK: Scaffold Code Structure
    SDK-->>CLI: Template Created
    CLI-->>Creator: Project Ready
    
    Creator->>Creator: Develop Extension Code
    
    Creator->>CLI: carets test
    CLI->>Testing: Run Test Suite
    Testing->>Testing: Unit Tests
    Testing->>Testing: Integration Tests
    Testing-->>CLI: Test Results
    CLI-->>Creator: All Tests Passed ✓
    
    Creator->>CLI: carets publish
    CLI->>SDK: Validate Manifest
    SDK->>SDK: Check Dependencies
    SDK->>SDK: Verify Semantic Version
    SDK-->>CLI: Validation OK
    
    CLI->>Security: Sign Extension
    Security->>Security: Generate Signature
    Security-->>CLI: Signed Package
    
    CLI->>Registry: Register Extension
    Registry->>Registry: Check Name Conflict
    Registry->>Registry: Store Metadata
    Registry-->>CLI: Registered
    
    CLI->>Marketplace: Upload Package
    Marketplace->>Marketplace: Virus Scan
    Marketplace->>Marketplace: Store Binary
    Marketplace-->>CLI: Published
    
    CLI-->>Creator: Extension Published Successfully
    
    Creator->>Marketplace: Monitor Analytics
    Marketplace-->>Creator: Downloads, Ratings, Reviews
```

---

## 3. Developer Workflow: Install & Use Extension

```mermaid
sequenceDiagram
    actor Dev as Developer
    participant UI as Frontend UI
    participant Core as Core (Rust)
    participant Marketplace as Grand Stage
    participant Installer as Kit Installer
    participant Lifecycle as Kit Lifecycle
    participant Security as Kit Security
    participant Extension as Loaded Extension
    
    Dev->>UI: Browse Extensions
    UI->>Marketplace: Search Extensions
    Marketplace-->>UI: Extension List
    UI-->>Dev: Display Results
    
    Dev->>UI: Select & Install Extension
    UI->>Core: installExtension(id)
    Core->>Marketplace: Download Package
    Marketplace-->>Core: Extension Binary
    
    Core->>Installer: Install Extension
    Installer->>Installer: Verify Signature
    Installer->>Installer: Resolve Dependencies
    
    alt Dependencies Missing
        Installer->>Marketplace: Download Dependencies
        Marketplace-->>Installer: Dependency Packages
    end
    
    Installer->>Installer: Extract Files
    Installer-->>Core: Installation Complete
    
    Core->>Lifecycle: Load Extension
    Lifecycle->>Lifecycle: State: Installed → Loading
    Lifecycle->>Security: Check Permissions
    Security->>Security: Validate Capabilities
    Security-->>Lifecycle: Permissions OK
    
    Lifecycle->>Extension: Initialize
    Extension->>Extension: Setup Resources
    Extension-->>Lifecycle: Ready
    Lifecycle->>Lifecycle: State: Loading → Loaded → Activated
    
    Lifecycle-->>Core: Extension Active
    Core-->>UI: Extension Ready
    UI-->>Dev: Extension Installed ✓
    
    Dev->>UI: Use Extension Feature
    UI->>Core: Call Extension API
    Core->>Security: Enforce Capabilities
    Security->>Security: Check Permissions
    Security-->>Core: Authorized
    
    Core->>Extension: Execute Function
    Extension->>Extension: Process Request
    Extension-->>Core: Result
    Core-->>UI: Response
    UI-->>Dev: Feature Executed
    
    Note over Lifecycle,Extension: Chambering States:<br/>Installed → Loading → Loaded<br/>→ Activated → Running
```

---

## 4. Conductor Workflow: Generate Melody from Prompt

```mermaid
sequenceDiagram
    actor Dev as Developer
    participant UI as Frontend UI
    participant Core as Core (Rust)
    participant Conductor as 🎩 Conductor (Python RL)
    participant Bridge as Orchestration Bridge
    participant RL as RL Model (PyTorch)
    participant MelodyEngine as Melody Engine
    participant Polyphony as Polyphony Store
    
    Dev->>UI: Write Complex Prompt
    UI->>Core: submitPrompt(text)
    Core->>Conductor: Process Prompt
    
    Conductor->>Conductor: Parse Intent
    Conductor->>Conductor: Extract Context
    Conductor->>Conductor: Analyze Project State
    
    Conductor->>RL: Get Action Probabilities
    RL->>RL: Encode State
    RL->>RL: Forward Pass
    RL-->>Conductor: Action Distribution
    
    Conductor->>MelodyEngine: Generate Workflow DAG
    MelodyEngine->>MelodyEngine: Create Nodes
    MelodyEngine->>MelodyEngine: Define Dependencies
    MelodyEngine->>MelodyEngine: Assign Resources
    MelodyEngine-->>Conductor: Melody DAG
    
    Conductor->>Conductor: Optimize Workflow
    Conductor->>Conductor: Predict Execution Time
    
    Conductor-->>Core: Generated Melody
    Core-->>UI: Show Melody Preview
    UI-->>Dev: Display Workflow Graph
    
    Dev->>UI: Approve & Execute
    UI->>Core: executeMelody(id)
    Core->>Conductor: Start Execution
    
    Conductor->>Bridge: Dispatch Tasks
    Bridge->>Bridge: Calculate Rewards
    Bridge-->>Conductor: Execution Metrics
    
    Conductor->>RL: Update Model
    RL->>RL: Backpropagation
    RL->>RL: Update Weights
    RL-->>Conductor: Model Updated
    
    Note over Conductor,RL: Reinforcement Learning:<br/>State → Action → Reward<br/>→ Policy Update
    
    opt Save Melody
        Dev->>UI: Save as Template
        UI->>Core: saveMelody()
        Core->>Polyphony: Store Melody
        Polyphony-->>Core: Saved
        Core-->>UI: Melody Saved
    end
```

---

## 5. Harmony Board: Real-Time Monitoring

```mermaid
sequenceDiagram
    actor Dev as Developer
    participant UI as Harmony Board UI
    participant Core as Core (Rust)
    participant DAG as DAG Tracker
    participant Metrics as Metrics Module
    participant Logging as Logging Service
    
    Dev->>UI: Open Harmony Board
    UI->>Core: subscribeToWorkflow(id)
    Core->>DAG: Register Observer
    DAG-->>Core: Subscription Active
    Core-->>UI: WebSocket Connected
    
    loop Real-Time Updates
        DAG->>DAG: Execute Task Node
        DAG->>Metrics: Record Metrics
        Metrics->>Metrics: Timestamp, Duration, Status
        Metrics-->>DAG: Logged
        
        DAG->>Logging: Log Event
        Logging->>Logging: Structured Log (JSON)
        Logging-->>DAG: Logged
        
        DAG->>Core: Emit Progress Event
        Core->>UI: WebSocket: taskProgress
        UI->>UI: Update Visualization
        UI-->>Dev: Show Progress
        
        alt Task Failed
            DAG->>Core: Emit Error Event
            Core->>UI: WebSocket: taskError
            UI->>UI: Highlight Failed Node
            UI-->>Dev: Show Error Details
            
            Dev->>UI: Inspect Error
            UI->>Core: getTaskLogs(taskId)
            Core->>Logging: Retrieve Logs
            Logging-->>Core: Log Entries
            Core-->>UI: Error Logs
            UI-->>Dev: Display Stack Trace
        end
    end
    
    DAG->>DAG: Workflow Complete
    DAG->>Core: Emit Complete Event
    Core->>UI: WebSocket: workflowComplete
    UI->>UI: Show Summary
    UI-->>Dev: Execution Complete ✓
    
    Dev->>UI: View Performance Metrics
    UI->>Core: getMetrics(workflowId)
    Core->>Metrics: Aggregate Metrics
    Metrics-->>Core: Stats (avg, p50, p99)
    Core-->>UI: Metrics Data
    UI-->>Dev: Display Charts
```

---

## 6. Manual Melody Creation: Harmony Board Drag & Drop

```mermaid
sequenceDiagram
    actor User as Developer/Creator
    participant UI as Harmony Board UI
    participant Core as Core (Rust)
    participant MelodyEngine as Melody Engine
    participant Registry as Orchestra Kit Registry
    participant Polyphony as Polyphony Store
    participant Validator as Workflow Validator
    
    User->>UI: Open Harmony Board (Creation Mode)
    UI->>Core: getAvailableNodes()
    Core->>Registry: List Extensions
    Registry-->>Core: Instruments, Operators, Motifs
    Core-->>UI: Node Palette
    UI-->>User: Display Available Nodes
    
    User->>UI: Drag Instrument Node
    UI->>UI: Add Node to Canvas
    User->>UI: Drag Operator Node
    UI->>UI: Add Node to Canvas
    User->>UI: Drag Another Operator
    UI->>UI: Add Node to Canvas
    
    User->>UI: Connect Nodes (Draw Edge)
    UI->>UI: Create Dependency Link
    UI->>UI: Validate Connection Types
    
    alt Invalid Connection
        UI-->>User: Error: Type Mismatch
        User->>UI: Fix Connection
    end
    
    User->>UI: Configure Node Parameters
    UI->>UI: Show Node Settings Panel
    User->>UI: Set Input Values
    User->>UI: Set Resource Limits
    User->>UI: Set Timeout
    UI->>UI: Update Node Config
    
    User->>UI: Add More Nodes & Connections
    UI->>UI: Build Workflow Graph
    
    User->>UI: Validate Workflow
    UI->>Core: validateMelody(graph)
    Core->>Validator: Check DAG Structure
    Validator->>Validator: Detect Cycles
    Validator->>Validator: Check Type Safety
    Validator->>Validator: Verify Resource Constraints
    
    alt Validation Failed
        Validator-->>Core: Errors Found
        Core-->>UI: Validation Errors
        UI-->>User: Highlight Issues
        User->>UI: Fix Issues
        User->>UI: Revalidate
    else Validation Passed
        Validator-->>Core: Valid DAG
        Core-->>UI: Workflow Valid ✓
    end
    
    User->>UI: Save Melody
    UI->>Core: saveMelody(name, description, graph)
    Core->>MelodyEngine: Create Melody
    MelodyEngine->>MelodyEngine: Serialize DAG
    MelodyEngine->>MelodyEngine: Generate Metadata
    MelodyEngine->>MelodyEngine: Calculate Complexity Score
    MelodyEngine-->>Core: Melody Created
    
    Core->>Polyphony: Store Melody
    Polyphony->>Polyphony: Save to Database
    Polyphony->>Polyphony: Index for Search
    Polyphony-->>Core: Melody Saved
    
    Core-->>UI: Save Successful
    UI-->>User: Melody Saved ✓
    
    opt Publish to Polyphony Store
        User->>UI: Publish Melody
        UI->>Core: publishMelody(id)
        Core->>Polyphony: Set Public Visibility
        Polyphony->>Polyphony: Add to Marketplace
        Polyphony-->>Core: Published
        Core-->>UI: Published Successfully
        UI-->>User: Melody Now Public
    end
    
    opt Execute Melody
        User->>UI: Run Melody
        UI->>Core: executeMelody(id)
        Note over Core: Continues to Diagram #1<br/>(Execute Melody workflow)
    end
    
    Note over User,Polyphony: Manual Creation Features:<br/>- Drag & Drop Interface<br/>- Visual Node Connection<br/>- Real-time Validation<br/>- Type Safety Checking<br/>- Save & Publish
```

---

## 7. The Pit: High-Performance Task Execution

```mermaid
sequenceDiagram
    participant Conductor as 🎩 Conductor
    participant Pit as The Pit Core
    participant PoolMgr as Pool Manager
    participant DAG as DAG Tracker
    participant Arbitration as Arbitration Engine
    participant Artifact as Artifact Store
    participant Stale as Stale Manager
    
    Conductor->>Pit: Dispatch Task Batch
    Pit->>Arbitration: Request Resources
    Arbitration->>Arbitration: Check Conflicts
    Arbitration->>Arbitration: Apply Fairness Policy
    Arbitration-->>Pit: Resources Allocated
    
    Pit->>PoolMgr: Allocate AI Models
    PoolMgr->>PoolMgr: Check Cache (50-100ns)
    
    alt Cache Hit
        PoolMgr-->>Pit: Model Handle (Fast Path)
    else Cache Miss
        PoolMgr->>PoolMgr: Predictive Pre-warming
        PoolMgr->>PoolMgr: Load Model
        PoolMgr->>PoolMgr: State: Unloaded → Loading → Warming → Ready
        PoolMgr-->>Pit: Model Handle
    end
    
    Pit->>DAG: Execute Workflow
    DAG->>DAG: Topological Sort
    DAG->>DAG: Identify Parallel Nodes
    
    par Parallel Execution
        DAG->>PoolMgr: Execute Task A
        PoolMgr-->>DAG: Result A
    and
        DAG->>PoolMgr: Execute Task B
        PoolMgr-->>DAG: Result B
    and
        DAG->>PoolMgr: Execute Task C
        PoolMgr-->>DAG: Result C
    end
    
    loop For Each Result
        DAG->>Artifact: Store Artifact
        Artifact->>Artifact: Content-Addressable Hash
        Artifact->>Artifact: Check Deduplication (20-40% savings)
        
        alt Duplicate Found
            Artifact-->>DAG: Existing Artifact ID
        else New Artifact
            Artifact->>Artifact: Store Content
            Artifact->>Artifact: Quality Scoring
            Artifact->>Artifact: Index with Tantivy
            Artifact-->>DAG: New Artifact ID
        end
        
        DAG->>Stale: Register Artifact
        Stale->>Stale: Set Lifecycle Timer
        Note over Stale: 1-7 days: SSD<br/>8-30 days: HDD<br/>30+ days: Cloud
    end
    
    DAG->>DAG: Checkpoint Progress
    DAG-->>Pit: Workflow Complete
    Pit-->>Conductor: Execution Results
    
    Note over Pit,Stale: Performance Targets:<br/>Pool: 50-100ns allocation<br/>DAG: 10K-node workflows<br/>Artifact: 1-5ms store, 0.5-2ms retrieve
```

---

## 8. IPC Communication: Cross-Process Messaging

```mermaid
sequenceDiagram
    participant ExtProc as Extension Process
    participant Transport as IPC Transport
    participant Protocol as IPC Protocol
    participant Security as IPC Security
    participant Bus as IPC Bus
    participant Core as Core Process
    
    ExtProc->>Transport: Send Message
    Transport->>Transport: Serialize (MessagePack)
    
    alt Unix/Linux/macOS
        Transport->>Transport: Unix Domain Socket
    else Windows
        Transport->>Transport: Named Pipe
    end
    
    Transport->>Protocol: Frame Message
    Protocol->>Protocol: Add Header
    Protocol->>Protocol: Add Length Prefix
    Protocol-->>Transport: Framed Message
    
    Transport->>Security: Authenticate
    Security->>Security: Verify Process ID
    Security->>Security: Check Rate Limit
    Security->>Security: Validate Message
    
    alt Authentication Failed
        Security-->>Transport: Reject
        Transport-->>ExtProc: Error: Unauthorized
    else Authentication OK
        Security-->>Transport: Authorized
        
        Transport->>Bus: Route Message
        Bus->>Bus: Lookup Destination
        Bus->>Bus: Queue Message (0.1-0.3ms latency)
        Bus->>Core: Deliver Message
        
        Core->>Core: Process Request
        Core->>Bus: Send Response
        
        Bus->>Transport: Route Response
        Transport->>Protocol: Frame Response
        Protocol->>Transport: Serialized Response
        Transport->>ExtProc: Deliver Response
        
        ExtProc->>ExtProc: Handle Response
    end
    
    Note over Transport,Bus: IPC Performance:<br/>Latency: 0.1-0.3ms<br/>Transport: Unix Socket / Named Pipe<br/>Serialization: MessagePack / bincode
```

---

## 9. Bootstrap Sequence: System Initialization

```mermaid
sequenceDiagram
    participant Main as Main Process
    participant Bootstrap as Bootstrap Core
    participant Phase as Phase Manager
    participant Health as Health Checker
    participant Types as Types Package
    participant Config as Config Manager
    participant IPC as IPC Bus
    participant Pit as The Pit
    participant Conductor as 🎩 Conductor
    participant UI as Frontend UI
    
    Main->>Bootstrap: Initialize System
    Bootstrap->>Phase: Start Phase 1: Foundation
    
    Phase->>Types: Load Type System
    Types->>Types: Register Core Types
    Types->>Types: Zero-Cost Abstractions
    Types-->>Phase: Types Ready
    
    Phase->>Config: Load Configuration
    Config->>Config: Parse TOML/JSON/YAML
    Config->>Config: Hierarchical Merge
    Config->>Config: Enable Hot-Reload
    Config-->>Phase: Config Ready
    
    Phase-->>Bootstrap: Phase 1 Complete ✓
    
    Bootstrap->>Phase: Start Phase 2: IPC
    Phase->>IPC: Initialize Message Bus
    IPC->>IPC: Setup Transport Layer
    IPC->>IPC: Initialize Security
    IPC->>IPC: Start Process Lifecycle Manager
    IPC-->>Phase: IPC Ready
    
    Phase-->>Bootstrap: Phase 2 Complete ✓
    
    Bootstrap->>Phase: Start Phase 3: The Pit
    
    par Parallel Pit Initialization
        Phase->>Pit: Initialize Pool Manager
        Pit->>Pit: Setup Model Cache
        Pit-->>Phase: Pool Manager Ready
    and
        Phase->>Pit: Initialize DAG Tracker
        Pit->>Pit: Setup Execution Engine
        Pit-->>Phase: DAG Tracker Ready
    and
        Phase->>Pit: Initialize Artifact Store
        Pit->>Pit: Setup Tantivy Index
        Pit-->>Phase: Artifact Store Ready
    and
        Phase->>Pit: Initialize Arbitration Engine
        Pit-->>Phase: Arbitration Ready
    and
        Phase->>Pit: Initialize Stale Manager
        Pit-->>Phase: Stale Manager Ready
    end
    
    Phase-->>Bootstrap: Phase 3 Complete ✓
    
    Bootstrap->>Phase: Start Phase 4: Conductor
    Phase->>Conductor: Initialize Python Bridge
    Conductor->>Conductor: Load PyO3 Bindings (~0.01ms)
    Conductor->>Conductor: Initialize RL Model
    Conductor->>Conductor: Load Trained Weights
    Conductor-->>Phase: Conductor Ready
    
    Phase-->>Bootstrap: Phase 4 Complete ✓
    
    Bootstrap->>Health: Run Health Checks
    Health->>Health: Validate All Components
    Health->>Health: Check Readiness Probes
    
    alt Health Check Failed
        Health-->>Bootstrap: Failure Detected
        Bootstrap->>Bootstrap: Rollback Initialization
        Bootstrap-->>Main: Initialization Failed ✗
    else Health Check Passed
        Health-->>Bootstrap: All Systems Operational
        
        Bootstrap->>UI: Start Frontend
        UI->>UI: Load React App
        UI->>UI: Connect WebSocket
        UI-->>Bootstrap: UI Ready
        
        Bootstrap-->>Main: System Ready ✓
        Main->>Main: Enter Main Loop
    end
    
    Note over Bootstrap,Conductor: Phased Initialization:<br/>1. Types → Config<br/>2. IPC<br/>3. The Pit (parallel)<br/>4. Conductor<br/>5. Health Check
```

---

## Key Architectural Patterns

### Performance Characteristics
- **Pool Manager**: 50-100ns allocation (cache hit), >80% prediction accuracy
- **DAG Tracker**: 10,000-node workflows, parallel execution
- **Artifact Store**: 1-5ms store, 0.5-2ms retrieve, 20-40% dedup savings
- **IPC Bus**: 0.1-0.3ms message latency
- **Conductor Bridge**: ~0.01ms PyO3 overhead

### Execution Models
- **In-Process (The Pit)**: 50-100ns latency, 1M+ ops/sec
- **Out-of-Process (UFE)**: 0.1-0.5ms latency, isolated processes
- **Python Conductor**: 0.5-2ms latency, RL orchestration

### State Machines
- **Extension Lifecycle (Chambering)**: Installed → Loading → Loaded → Activated → Running → Paused → Error
- **Model Lifecycle**: Unloaded → Loading → Warming → Ready → Active
- **Artifact Lifecycle**: 1-7 days SSD → 8-30 days HDD → 30+ days Cloud

---

## Glossary

- **Conductor (🎩)**: AI orchestration engine using reinforcement learning
- **Melody (🎵)**: Composable workflow (DAG of tasks)
- **The Pit**: High-performance in-process extension layer
- **Orchestra Kit (🎭)**: Extension management system
- **Harmony Board (🎛️)**: Visual workflow monitoring dashboard
- **Instrument (🎻)**: AI/ML model extension
- **Operator (⚙️)**: Workflow utility extension
- **Motif (🧩)**: UI/UX enhancement extension
- **Chambering**: Extension lifecycle state machine
- **Artifact**: Generated output (code, docs, tests, config)
- **Grand Stage**: Extension marketplace
- **Polyphony Store**: Melody (workflow) marketplace
