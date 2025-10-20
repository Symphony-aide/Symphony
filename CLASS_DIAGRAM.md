# Symphony IDE - Comprehensive Class Diagram

This document contains the complete class diagram for the Symphony IDE system using Mermaid notation.

## Core Architecture Classes

```mermaid
classDiagram-v2
    %% ============================================
    %% FOUNDATION LAYER - Core Types & Config
    %% ============================================
    
    class Core {
        <<orchestration host>>
        +JsonRpcServer server
        +ExtensionRegistry registry
        +IpcBus messageBus
        +start() void
        +shutdown() void
        +handleRequest(request: JsonRpcRequest) JsonRpcResponse
    }
    
    class TypeSystem {
        <<zero-cost abstractions>>
        +ExtensionId
        +MelodyId
        +ArtifactId
        +NodeId
        +validate(type: Type) bool
    }
    
    class ConfigManager {
        +config: Config
        +loadConfig(path: String) Result~Config~
        +hotReload() void
        +merge(configs: List~Config~) Config
        +get(key: String) Value
    }
    
    class Config {
        +toml: TomlValue
        +json: JsonValue
        +yaml: YamlValue
        +get(path: String) Option~Value~
    }
    
    %% ============================================
    %% EXTENSION SYSTEM - Core API
    %% ============================================
    
    class Extension {
        <<interface>>
        +id: ExtensionId
        +manifest: Manifest
        +activate() Result~void~
        +deactivate() Result~void~
        +execute(params: Params) Result~Output~
    }
    
    class Manifest {
        +name: String
        +version: SemanticVersion
        +type: ExtensionType
        +dependencies: List~Dependency~
        +capabilities: List~Capability~
        +validate() Result~void~
    }
    
    class ExtensionType {
        <<enumeration>>
        Instrument
        Operator
        Motif
    }
    
    class Persistor {
        <<interface>>
        +save(key: String, data: Bytes) Result~void~
        +load(key: String) Result~Bytes~
        +delete(key: String) Result~void~
    }
    
    %% ============================================
    %% THE PIT - AIDE Layer (In-Process Extensions)
    %% ============================================
    
    class PitCore {
        +extensions: Map~ExtensionId, Extension~
        +register(ext: Extension) Result~void~
        +unregister(id: ExtensionId) Result~void~
        +getExtension(id: ExtensionId) Option~Extension~
    }
    
    class PoolManager {
        +models: Map~ModelId, ModelState~
        +cache: LruCache~ModelId, Model~
        +allocate(modelId: ModelId) Result~Model~
        +deallocate(modelId: ModelId) void
        +predictivePreWarm(pattern: UsagePattern) void
        +getState(modelId: ModelId) ModelState
    }
    
    class ModelState {
        <<enumeration>>
        Unloaded
        Loading
        Warming
        Ready
        Active
    }
    
    class DagTracker {
        +workflows: Map~MelodyId, Dag~
        +execute(melody: Melody) Result~Output~
        +topologicalSort(dag: Dag) List~NodeId~
        +parallelExecute(nodes: List~Node~) Result~List~Output~~
        +checkpoint(melodyId: MelodyId) Result~void~
        +resume(melodyId: MelodyId) Result~void~
    }
    
    class Dag {
        +nodes: Map~NodeId, Node~
        +edges: List~Edge~
        +validate() Result~void~
        +detectCycles() bool
        +getExecutionOrder() List~NodeId~
    }
    
    class Node {
        +id: NodeId
        +type: NodeType
        +params: Map~String, Value~
        +inputs: List~Port~
        +outputs: List~Port~
        +execute(inputs: Map~String, Value~) Result~Map~String, Value~~
    }
    
    class ArtifactStore {
        +artifacts: Map~ArtifactId, Artifact~
        +index: TantivyIndex
        +store(artifact: Artifact) Result~ArtifactId~
        +retrieve(id: ArtifactId) Result~Artifact~
        +search(query: String) List~Artifact~
        +deduplicate() void
        +scoreQuality(id: ArtifactId) f64
    }
    
    class Artifact {
        +id: ArtifactId
        +hash: ContentHash
        +data: Bytes
        +metadata: Metadata
        +version: u32
        +qualityScore: f64
        +createdAt: Timestamp
    }
    
    class ArbitrationEngine {
        +policies: List~Policy~
        +resolveConflict(resources: List~Resource~) Result~Resolution~
        +applyFairness(requests: List~Request~) List~Request~
        +prioritize(tasks: List~Task~) List~Task~
    }
    
    class StaleManager {
        +lifecycle: Map~ArtifactId, LifecycleStage~
        +transition(id: ArtifactId) Result~void~
        +getStage(id: ArtifactId) LifecycleStage
        +cleanup() void
    }
    
    class LifecycleStage {
        <<enumeration>>
        SSD_1_7_Days
        HDD_8_30_Days
        Cloud_30Plus_Days
    }
    
    %% ============================================
    %% IPC COMMUNICATION BACKBONE
    %% ============================================
    
    class IpcBus {
        +processes: Map~ProcessId, Process~
        +transport: Transport
        +protocol: Protocol
        +security: Security
        +send(msg: Message) Result~void~
        +receive() Result~Message~
        +broadcast(msg: Message) void
    }
    
    class Transport {
        <<interface>>
        +connect() Result~Connection~
        +disconnect() void
        +send(data: Bytes) Result~void~
        +receive() Result~Bytes~
    }
    
    class UnixSocketTransport {
        +path: String
        +socket: UnixSocket
    }
    
    class NamedPipeTransport {
        +name: String
        +pipe: NamedPipe
    }
    
    class Protocol {
        +serialize(msg: Message) Bytes
        +deserialize(data: Bytes) Result~Message~
        +frame(data: Bytes) Bytes
        +unframe(data: Bytes) Bytes
    }
    
    class Message {
        +id: MessageId
        +sender: ProcessId
        +receiver: ProcessId
        +payload: Bytes
        +timestamp: Timestamp
    }
    
    class Security {
        +authenticate(process: ProcessId) Result~Token~
        +validate(msg: Message) bool
        +rateLimit(process: ProcessId) bool
    }
    
    %% ============================================
    %% CONDUCTOR - RL Orchestration (Python)
    %% ============================================
    
    class Conductor {
        +model: RlModel
        +bridge: OrchestrationBridge
        +bindings: PyO3Bindings
        +generateMelody(prompt: String) Result~Melody~
        +calculateReward(outcome: Outcome) f64
        +updatePolicy(experience: Experience) void
        +train(data: TrainingData) void
    }
    
    class RlModel {
        +policy: Policy
        +valueFunction: ValueFunction
        +predict(state: State) Action
        +update(experience: Experience) void
    }
    
    class OrchestrationBridge {
        +toWorkflow(melody: Melody) Dag
        +fromWorkflow(dag: Dag) Melody
        +collectReward(execution: Execution) f64
    }
    
    class PyO3Bindings {
        +rustToPython(value: RustValue) PyObject
        +pythonToRust(obj: PyObject) RustValue
        +callPython(fn: String, args: List~Value~) Result~Value~
    }
    
    %% ============================================
    %% ORCHESTRATION ENGINE
    %% ============================================
    
    class OrchestrationCore {
        +mode: ExecutionMode
        +execute(melody: Melody) Result~Output~
        +switchMode(mode: ExecutionMode) void
    }
    
    class ExecutionMode {
        <<enumeration>>
        Maestro_RL
        Manual_UserDriven
    }
    
    class MelodyEngine {
        +melodies: Map~MelodyId, Melody~
        +create(name: String) Melody
        +load(id: MelodyId) Result~Melody~
        +save(melody: Melody) Result~void~
        +compose(nodes: List~Node~) Melody
    }
    
    class Melody {
        +id: MelodyId
        +name: String
        +dag: Dag
        +metadata: Metadata
        +isPublic: bool
        +createdBy: UserId
        +validate() Result~void~
    }
    
    %% ============================================
    %% ORCHESTRA KIT - Extension Ecosystem
    %% ============================================
    
    class OrchestraKit {
        +registry: Registry
        +marketplace: Marketplace
        +installer: Installer
        +lifecycle: LifecycleManager
        +security: SecurityManager
    }
    
    class Registry {
        +extensions: Map~ExtensionId, ExtensionInfo~
        +register(ext: Extension) Result~void~
        +unregister(id: ExtensionId) Result~void~
        +search(query: String) List~ExtensionInfo~
        +getVersion(id: ExtensionId, version: SemanticVersion) Option~Extension~
    }
    
    class Marketplace {
        +browse() List~ExtensionInfo~
        +download(id: ExtensionId) Result~Bytes~
        +upload(package: Package) Result~void~
        +rate(id: ExtensionId, rating: u8) void
        +review(id: ExtensionId, text: String) void
    }
    
    class Installer {
        +install(package: Package) Result~void~
        +uninstall(id: ExtensionId) Result~void~
        +resolveDependencies(manifest: Manifest) Result~List~Dependency~~
        +verifySignature(package: Package) bool
        +rollback(id: ExtensionId) Result~void~
    }
    
    class LifecycleManager {
        +states: Map~ExtensionId, ChamberingState~
        +transition(id: ExtensionId, state: ChamberingState) Result~void~
        +getState(id: ExtensionId) ChamberingState
    }
    
    class ChamberingState {
        <<enumeration>>
        Installed
        Loading
        Activated
        Running
    }
    
    class SecurityManager {
        +sandbox: Sandbox
        +permissions: PermissionManager
        +checkCapability(id: ExtensionId, cap: Capability) bool
        +enforceLimit(id: ExtensionId, resource: Resource) bool
    }
    
    class Sandbox {
        +isolate(ext: Extension) Result~void~
        +restrict(permissions: List~Permission~) void
    }
    
    %% ============================================
    %% HARMONY BOARD - Visual Workflow Designer
    %% ============================================
    
    class HarmonyBoard {
        +canvas: Canvas
        +palette: NodePalette
        +validator: WorkflowValidator
        +createMelody() Melody
        +visualize(melody: Melody) void
        +monitor(execution: Execution) void
    }
    
    class Canvas {
        +nodes: List~VisualNode~
        +edges: List~VisualEdge~
        +addNode(node: VisualNode) void
        +connectNodes(from: NodeId, to: NodeId) Result~void~
        +render() void
    }
    
    class NodePalette {
        +instruments: List~Instrument~
        +operators: List~Operator~
        +motifs: List~Motif~
        +getNodes(type: ExtensionType) List~Node~
    }
    
    class WorkflowValidator {
        +validateConnection(from: Port, to: Port) Result~void~
        +validateDag(dag: Dag) Result~void~
        +checkTypeSafety(edge: Edge) bool
        +detectCycles(dag: Dag) bool
    }
    
    %% ============================================
    %% BOOTSTRAP SYSTEM
    %% ============================================
    
    class BootstrapCore {
        +phases: List~Phase~
        +currentPhase: u8
        +phaseManager: PhaseManager
        +healthChecker: HealthChecker
        +initialize() Result~void~
        +rollback() Result~void~
    }
    
    class PhaseManager {
        +executePhase(phase: Phase) Result~void~
        +parallelInit(tasks: List~Task~) Result~void~
        +validatePhase(phase: Phase) bool
    }
    
    class Phase {
        <<enumeration>>
        Foundation_Types_Config
        IPC_MessageBus
        Pit_Components
        Conductor_RL
    }
    
    class HealthChecker {
        +probes: List~Probe~
        +check() Result~HealthStatus~
        +validate(component: Component) bool
    }
    
    %% ============================================
    %% IDE LAYER - Traditional Features
    %% ============================================
    
    class IdeCore {
        +fileOps: FileOperations
        +lsp: LspClient
        +syntaxHighlighter: SyntaxHighlighter
        +terminal: Terminal
    }
    
    class FileOperations {
        +open(path: String) Result~File~
        +save(file: File) Result~void~
        +delete(path: String) Result~void~
        +watch(path: String) void
    }
    
    class LspClient {
        +servers: Map~LanguageId, LspServer~
        +connect(language: LanguageId) Result~void~
        +sendRequest(req: LspRequest) Result~LspResponse~
        +handleNotification(notif: LspNotification) void
    }
    
    class UiBridge {
        +sendToFrontend(event: Event) void
        +receiveFromFrontend() Result~Event~
        +sync() void
    }
    
    class VirtualDom {
        +tree: VirtualNode
        +render() ReactComponent
        +diff(old: VirtualNode, new: VirtualNode) Patch
        +apply(patch: Patch) void
    }
    
    %% ============================================
    %% INFRASTRUCTURE SERVICES
    %% ============================================
    
    class PermissionManager {
        +roles: Map~UserId, Role~
        +checkPermission(user: UserId, action: Action) bool
        +grant(user: UserId, permission: Permission) void
        +revoke(user: UserId, permission: Permission) void
        +audit(action: Action) void
    }
    
    class Logger {
        +level: LogLevel
        +log(msg: String, level: LogLevel) void
        +trace(span: Span) void
        +structured(data: JsonValue) void
    }
    
    class Hooks {
        +registerProtocol(scheme: String) void
        +notify(title: String, body: String) void
        +registerFileAssociation(ext: String) void
    }
    
    %% ============================================
    %% APPLICATIONS
    %% ============================================
    
    class DesktopApp {
        +window: TauriWindow
        +webview: Webview
        +launch() void
        +handleEvent(event: Event) void
    }
    
    class ServerApp {
        +httpServer: HttpServer
        +wsServer: WebSocketServer
        +clients: Map~ClientId, Client~
        +start(port: u16) void
        +broadcast(msg: Message) void
    }
    
    class TerminalApp {
        +pty: Pty
        +shell: Shell
        +spawn(cmd: String) Result~Process~
        +write(data: Bytes) void
        +read() Result~Bytes~
    }
    
    %% ============================================
    %% POLYPHONY STORE
    %% ============================================
    
    class PolyphonyStore {
        +melodies: Map~MelodyId, Melody~
        +database: Database
        +index: SearchIndex
        +save(melody: Melody) Result~void~
        +load(id: MelodyId) Result~Melody~
        +search(query: String) List~Melody~
        +publish(id: MelodyId) Result~void~
    }
    
    %% ============================================
    %% CARETS CLI & SDK
    %% ============================================
    
    class CaretsCli {
        +new(name: String, type: ExtensionType) Result~void~
        +test() Result~TestReport~
        +publish() Result~void~
        +scaffold(template: Template) Result~void~
    }
    
    class ExtensionSdk {
        +core: SdkCore
        +testing: TestingFramework
        +metrics: MetricsCollector
        +buildExtension(manifest: Manifest) Result~Extension~
    }
    
    class TestingFramework {
        +mocks: List~Mock~
        +fixtures: List~Fixture~
        +runTests(tests: List~Test~) TestReport
    }
    
    class MetricsCollector {
        +metrics: Map~String, Metric~
        +collect(name: String, value: f64) void
        +export() PrometheusMetrics
    }
    
    %% ============================================
    %% RELATIONSHIPS
    %% ============================================
    
    Core --> TypeSystem : uses
    Core --> ConfigManager : uses
    Core --> IpcBus : contains
    Core --> Extension : manages
    
    Extension <|.. PitCore : implements
    Extension --> Manifest : has
    Manifest --> ExtensionType : has
    
    PitCore --> PoolManager : contains
    PitCore --> DagTracker : contains
    PitCore --> ArtifactStore : contains
    PitCore --> ArbitrationEngine : contains
    PitCore --> StaleManager : contains
    
    PoolManager --> ModelState : manages
    DagTracker --> Dag : executes
    Dag --> Node : contains
    ArtifactStore --> Artifact : stores
    StaleManager --> LifecycleStage : manages
    
    IpcBus --> Transport : uses
    IpcBus --> Protocol : uses
    IpcBus --> Security : uses
    IpcBus --> Message : sends
    Transport <|.. UnixSocketTransport : implements
    Transport <|.. NamedPipeTransport : implements
    
    Conductor --> RlModel : uses
    Conductor --> OrchestrationBridge : uses
    Conductor --> PyO3Bindings : uses
    
    OrchestrationCore --> ExecutionMode : has
    OrchestrationCore --> MelodyEngine : uses
    MelodyEngine --> Melody : manages
    Melody --> Dag : contains
    
    OrchestraKit --> Registry : contains
    OrchestraKit --> Marketplace : contains
    OrchestraKit --> Installer : contains
    OrchestraKit --> LifecycleManager : contains
    OrchestraKit --> SecurityManager : contains
    LifecycleManager --> ChamberingState : manages
    SecurityManager --> Sandbox : uses
    
    HarmonyBoard --> Canvas : uses
    HarmonyBoard --> NodePalette : uses
    HarmonyBoard --> WorkflowValidator : uses
    Canvas --> Node : displays
    
    BootstrapCore --> PhaseManager : uses
    BootstrapCore --> HealthChecker : uses
    PhaseManager --> Phase : executes
    
    IdeCore --> FileOperations : uses
    IdeCore --> LspClient : uses
    IdeCore --> UiBridge : uses
    UiBridge --> VirtualDom : uses
    
    DesktopApp --> Core : launches
    ServerApp --> Core : launches
    
    PolyphonyStore --> Melody : stores
    
    CaretsCli --> ExtensionSdk : uses
    ExtensionSdk --> TestingFramework : contains
    ExtensionSdk --> MetricsCollector : contains
```

## Class Diagram Legend

### Stereotypes
- `<<interface>>`: Abstract interface/trait
- `<<enumeration>>`: Enum type
- `<<orchestration host>>`: Main orchestration component
- `<<zero-cost abstractions>>`: Type system with no runtime overhead

### Relationships
- `-->`: Association (uses/contains)
- `<|..`: Implementation (implements interface)
- `--|>`: Inheritance (extends class)

### Key Components by Layer

1. **Foundation**: Core, TypeSystem, ConfigManager
2. **The Pit (AIDE)**: PoolManager, DagTracker, ArtifactStore, ArbitrationEngine, StaleManager
3. **IPC**: IpcBus, Transport, Protocol, Security
4. **Conductor**: RlModel, OrchestrationBridge, PyO3Bindings
5. **Orchestration**: OrchestrationCore, MelodyEngine, Melody
6. **Orchestra Kit**: Registry, Marketplace, Installer, LifecycleManager, SecurityManager
7. **Harmony Board**: Canvas, NodePalette, WorkflowValidator
8. **Bootstrap**: BootstrapCore, PhaseManager, HealthChecker
9. **IDE**: FileOperations, LspClient, UiBridge, VirtualDom
10. **Infrastructure**: PermissionManager, Logger, Hooks
11. **Applications**: DesktopApp, ServerApp, TerminalApp
12. **Polyphony**: PolyphonyStore
13. **SDK**: CaretsCli, ExtensionSdk, TestingFramework, MetricsCollector

---

**Total Classes**: 80+ classes covering the entire Symphony IDE architecture
