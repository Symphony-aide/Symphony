# Design Document

## Overview

This design document specifies the architecture for implementing syntax highlighting and Language Server Protocol (LSP) integration in Symphony IDE. The solution leverages Monaco Editor's built-in syntax highlighting capabilities (TextMate grammars) and virtual scrolling for optimal performance with large files, while implementing a robust backend LSP architecture for intelligent code features. The design follows Symphony's proven extension pattern, extending the existing typescript-lsp extension to support multiple languages through Symphony's IPC Bus.

The implementation will provide developers with a modern code editing experience featuring real-time syntax highlighting, intelligent code completion, diagnostics, navigation features, and symbol search—all while maintaining Symphony's performance standards and architectural principles. By using Monaco's built-in features and the existing backend LSP infrastructure, we achieve rapid development, universal language support, and production-ready reliability.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React/Monaco)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Monaco Editor (Built-in Features)                      │  │
│  │  ✅ Syntax Highlighting (TextMate grammars)            │  │
│  │  ✅ Virtual Scrolling (automatic)                       │  │
│  │  ✅ Large File Optimization (automatic)                │  │
│  │  ✅ Theme Support (built-in)                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  LSP Client UI Integration                               │  │
│  │  - Monaco language client                                │  │
│  │  - Completion provider                                   │  │
│  │  - Diagnostic markers                                    │  │
│  │  - Hover provider                                        │  │
│  │  - Definition provider                                   │  │
│  │  - Symbol providers                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ IPC Bus
┌─────────────────────────────────────────────────────────────────┐
│              Backend (Rust Extension - UFE)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  LSP Extension Manager (extends typescript-lsp)         │  │
│  │  - Multi-language server management                      │  │
│  │  - Language detection                                    │  │
│  │  - Configuration management                              │  │
│  │  - Server lifecycle coordination                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  LSP Server Process Manager                              │  │
│  │  - Process spawning (stdio)                              │  │
│  │  - Health monitoring                                     │  │
│  │  - Auto-restart on crash                                 │  │
│  │  - Message routing                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ stdio
┌─────────────────────────────────────────────────────────────────┐
│              Language Servers (Native Processes)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  TypeScript  │  │    Python    │  │     Rust     │  ...    │
│  │   (tsserver) │  │   (pyright)  │  │(rust-analyzer)│        │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **File Open**: User opens a file in Monaco Editor
2. **Syntax Highlighting**: Monaco automatically applies TextMate grammar and theme
3. **Virtual Scrolling**: Monaco automatically virtualizes large files (10,000+ lines)
4. **Language Detection**: Frontend detects language from file extension
5. **LSP Activation**: Frontend requests LSP server activation via IPC
6. **Server Spawn**: Backend extension spawns appropriate language server (reuses existing if available)
7. **Initialization**: LSP handshake and capability negotiation
8. **Document Sync**: File content synchronized with language server via IPC
9. **Feature Requests**: User actions trigger LSP requests (completion, hover, etc.)
10. **Response Handling**: Backend processes responses and sends to frontend via IPC
11. **UI Update**: Monaco providers display results in editor

### Architecture Benefits

- **Proven Pattern**: Extends existing typescript-lsp extension
- **Universal Language Support**: Works with any LSP server (TypeScript, Python, Rust, Go, etc.)
- **Production Ready**: Monaco is battle-tested by VS Code
- **Automatic Optimization**: Virtual scrolling and large file handling built-in
- **Rapid Development**: Reuse existing code and patterns
- **Easy Maintenance**: Standard LSP protocol, well-documented
- **Desktop Optimized**: Perfect for Tauri-based Symphony IDE

## Components and Interfaces

### Frontend Components

#### 1. Monaco Editor Integration

**Location**: `packages/components/code-editor/`

**Responsibilities**:
- Integrate Monaco Editor with Symphony
- Configure built-in syntax highlighting (TextMate grammars)
- Set up theme management
- Handle large file optimization
- Manage editor lifecycle

**Key Features**:

```typescript
// Monaco Editor provides built-in:
// ✅ Syntax highlighting (TextMate grammars for all major languages)
// ✅ Virtual scrolling (automatic for large files)
// ✅ Theme support (vs-dark, vs-light, custom themes)
// ✅ Performance optimization (automatic)

interface MonacoEditorConfig {
  /**
   * Configure Monaco Editor instance
   * @param language - Language identifier (e.g., 'typescript', 'python')
   * @param theme - Theme name (e.g., 'vs-dark', 'vs-light')
   * @returns Configured editor instance
   */
  initializeParser(language: string): Promise<void>;

  /**
   * Parse document and generate syntax tokens
   * @param content - Source code content
   * @param language - Language identifier
   * @returns Array of syntax tokens with positions and scopes
   */
  parseDocument(content: string, language: string): SyntaxToken[];

  /**
   * Update syntax tree incrementally after edit
   * @param edit - Edit operation details
   * @returns Updated syntax tokens for changed region
   */
  applyEdit(edit: EditOperation): SyntaxToken[];

  /**
   * Get cached syntax tree for document
   * @param documentUri - Document identifier
   * @returns Cached syntax tree or null
   */
  getCachedTree(documentUri: string): Tree | null;
}

interface SyntaxToken {
  startIndex: number;
  endIndex: number;
  scopes: string[];
  text: string;
}

interface EditOperation {
  startIndex: number;
  oldEndIndex: number;
  newEndIndex: number;
  startPosition: Position;
  oldEndPosition: Position;
  newEndPosition: Position;
}
```

#### 2. LSP Client UI Integration

**Location**: `packages/components/code-editor/src/lsp/`

**Responsibilities**:
- Integrate LSP features with Monaco Editor
- Display completion suggestions
- Render diagnostic markers and tooltips
- Show hover information
- Handle navigation commands
- Manage symbol search UI

**Key Interfaces**:

```typescript
interface LSPClientUI {
  /**
   * Register LSP client with Monaco Editor
   * @param editor - Monaco editor instance
   * @param client - LSP client connection
   */
  registerWithEditor(
    editor: monaco.editor.IStandaloneCodeEditor,
    client: LSPClient
  ): void;

  /**
   * Display code completion suggestions
   * @param items - Completion items from LSP server
   * @param position - Cursor position
   */
  showCompletions(
    items: CompletionItem[],
    position: monaco.Position
  ): void;

  /**
   * Update diagnostic markers in editor
   * @param diagnostics - Diagnostic information from LSP
   */
  updateDiagnostics(diagnostics: Diagnostic[]): void;

  /**
   * Show hover information tooltip
   * @param content - Hover content (markdown)
   * @param range - Text range for hover
   */
  showHover(content: MarkupContent, range: monaco.Range): void;

  /**
   * Navigate to symbol definition
   * @param location - Definition location
   */
  goToDefinition(location: Location): void;

  /**
   * Display symbol search results
   * @param symbols - Workspace symbols
   */
  showSymbolSearch(symbols: SymbolInformation[]): void;
}

interface LSPClient {
  /**
   * Send request to LSP server via IPC
   * @param method - LSP method name
   * @param params - Request parameters
   * @returns Promise resolving to response
   */
  sendRequest<T>(method: string, params: any): Promise<T>;

  /**
   * Send notification to LSP server
   * @param method - LSP method name
   * @param params - Notification parameters
   */
  sendNotification(method: string, params: any): void;

  /**
   * Register handler for server notifications
   * @param method - LSP method name
   * @param handler - Callback function
   */
  onNotification(method: string, handler: (params: any) => void): void;
}
```

### Backend Components

#### 3. LSP Extension Manager

**Location**: `apps/backend/developed_extensions/lsp-manager/`

**Responsibilities**:
- Manage LSP server lifecycle
- Detect language from file extensions
- Load server configurations
- Handle server registration
- Coordinate multiple language servers

**Key Interfaces**:

```rust
/// LSP Extension Manager for Symphony
///
/// Manages the lifecycle of language servers, including spawning,
/// monitoring, and coordinating multiple server instances.
pub struct LSPExtensionManager {
    servers: HashMap<String, Arc<Mutex<LSPServerInstance>>>,
    configurations: HashMap<String, ServerConfiguration>,
    client_factory: Arc<dyn LSPClientFactory>,
}

impl LSPExtensionManager {
    /// Create new LSP extension manager
    ///
    /// Initializes the manager with default server configurations
    /// and prepares for server spawning.
    pub fn new() -> Self;

    /// Register language server configuration
    ///
    /// # Arguments
    /// * `language` - Language identifier (e.g., "typescript")
    /// * `config` - Server configuration including command and args
    ///
    /// # Examples
    /// ```
    /// manager.register_server("typescript", ServerConfiguration {
    ///     command: "typescript-language-server",
    ///     args: vec!["--stdio"],
    ///     transport: TransportKind::Stdio,
    /// });
    /// ```
    pub fn register_server(
        &mut self,
        language: String,
        config: ServerConfiguration,
    ) -> Result<()>;

    /// Start language server for document
    ///
    /// Spawns a new server process if one doesn't exist for the language.
    /// Returns existing server if already running.
    ///
    /// # Arguments
    /// * `document_uri` - Document URI
    /// * `language` - Language identifier
    ///
    /// # Returns
    /// Arc reference to server instance
    pub async fn start_server(
        &mut self,
        document_uri: &str,
        language: &str,
    ) -> Result<Arc<Mutex<LSPServerInstance>>>;

    /// Stop language server
    ///
    /// Gracefully shuts down server process and cleans up resources.
    ///
    /// # Arguments
    /// * `language` - Language identifier
    pub async fn stop_server(&mut self, language: &str) -> Result<()>;

    /// Restart crashed server
    ///
    /// Automatically restarts a server that has crashed or become unresponsive.
    ///
    /// # Arguments
    /// * `language` - Language identifier
    pub async fn restart_server(&mut self, language: &str) -> Result<()>;

    /// Detect language from file path
    ///
    /// # Arguments
    /// * `file_path` - Path to file
    ///
    /// # Returns
    /// Language identifier or None if not supported
    pub fn detect_language(&self, file_path: &str) -> Option<String>;
}

/// Server configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfiguration {
    /// Command to execute
    pub command: String,
    /// Command arguments
    pub args: Vec<String>,
    /// Transport mechanism
    pub transport: TransportKind,
    /// Environment variables
    pub env: HashMap<String, String>,
    /// Working directory
    pub cwd: Option<PathBuf>,
}

/// Transport mechanism for LSP communication
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TransportKind {
    /// Standard input/output
    Stdio,
    /// TCP socket
    Socket { host: String, port: u16 },
}
```

#### 4. LSP Client Implementation

**Location**: `apps/backend/developed_extensions/lsp-manager/src/client/`

**Responsibilities**:
- Implement JSON-RPC 2.0 protocol
- Handle request/response lifecycle
- Process server notifications
- Manage message routing
- Track pending requests

**Key Interfaces**:

```rust
/// LSP Client implementation
///
/// Handles communication with language servers using JSON-RPC 2.0 protocol.
/// Manages request/response lifecycle and notification processing.
pub struct LSPClient {
    server_process: Arc<Mutex<LSPServerProcess>>,
    pending_requests: Arc<Mutex<HashMap<RequestId, oneshot::Sender<JsonValue>>>>,
    notification_handlers: Arc<Mutex<HashMap<String, NotificationHandler>>>,
    next_request_id: AtomicU64,
}

impl LSPClient {
    /// Create new LSP client
    ///
    /// # Arguments
    /// * `server_process` - Server process handle
    pub fn new(server_process: Arc<Mutex<LSPServerProcess>>) -> Self;

    /// Initialize LSP connection
    ///
    /// Performs LSP handshake and capability negotiation.
    ///
    /// # Arguments
    /// * `params` - Initialization parameters
    ///
    /// # Returns
    /// Server capabilities
    ///
    /// # Examples
    /// ```
    /// let capabilities = client.initialize(InitializeParams {
    ///     process_id: Some(std::process::id()),
    ///     root_uri: Some("file:///workspace".to_string()),
    ///     capabilities: ClientCapabilities::default(),
    /// }).await?;
    /// ```
    pub async fn initialize(
        &self,
        params: InitializeParams,
    ) -> Result<ServerCapabilities>;

    /// Send request to server
    ///
    /// Sends JSON-RPC request and waits for response.
    ///
    /// # Arguments
    /// * `method` - LSP method name
    /// * `params` - Request parameters
    ///
    /// # Returns
    /// Response from server
    ///
    /// # Examples
    /// ```
    /// let result: CompletionList = client.send_request(
    ///     "textDocument/completion",
    ///     CompletionParams { /* ... */ }
    /// ).await?;
    /// ```
    pub async fn send_request<P, R>(
        &self,
        method: &str,
        params: P,
    ) -> Result<R>
    where
        P: Serialize,
        R: DeserializeOwned;

    /// Send notification to server
    ///
    /// Sends one-way notification without expecting response.
    ///
    /// # Arguments
    /// * `method` - LSP method name
    /// * `params` - Notification parameters
    ///
    /// # Examples
    /// ```
    /// client.send_notification(
    ///     "textDocument/didOpen",
    ///     DidOpenTextDocumentParams { /* ... */ }
    /// ).await?;
    /// ```
    pub async fn send_notification<P>(
        &self,
        method: &str,
        params: P,
    ) -> Result<()>
    where
        P: Serialize;

    /// Register notification handler
    ///
    /// Registers callback for server-initiated notifications.
    ///
    /// # Arguments
    /// * `method` - LSP method name
    /// * `handler` - Callback function
    ///
    /// # Examples
    /// ```
    /// client.on_notification(
    ///     "textDocument/publishDiagnostics",
    ///     |params: PublishDiagnosticsParams| {
    ///         // Handle diagnostics
    ///     }
    /// );
    /// ```
    pub fn on_notification<F>(&self, method: &str, handler: F)
    where
        F: Fn(JsonValue) + Send + Sync + 'static;

    /// Shutdown client
    ///
    /// Sends shutdown request and terminates connection.
    pub async fn shutdown(&self) -> Result<()>;
}

/// JSON-RPC message types
#[derive(Debug, Serialize, Deserialize)]
#[serde(untagged)]
pub enum Message {
    Request(Request),
    Response(Response),
    Notification(Notification),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Request {
    pub jsonrpc: String,
    pub id: RequestId,
    pub method: String,
    pub params: Option<JsonValue>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Response {
    pub jsonrpc: String,
    pub id: RequestId,
    pub result: Option<JsonValue>,
    pub error: Option<ResponseError>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Notification {
    pub jsonrpc: String,
    pub method: String,
    pub params: Option<JsonValue>,
}
```

#### 5. LSP Server Process Manager

**Location**: `apps/backend/developed_extensions/lsp-manager/src/process/`

**Responsibilities**:
- Spawn server processes
- Monitor process health
- Handle stdio/socket communication
- Implement auto-restart logic
- Track resource usage

**Key Interfaces**:

```rust
/// LSP Server Process Manager
///
/// Manages external language server processes, including spawning,
/// monitoring, and communication.
pub struct LSPServerProcess {
    config: ServerConfiguration,
    process: Option<Child>,
    stdin: Option<ChildStdin>,
    stdout_reader: Option<BufReader<ChildStdout>>,
    stderr_reader: Option<BufReader<ChildStderr>>,
    health_monitor: Arc<Mutex<HealthMonitor>>,
}

impl LSPServerProcess {
    /// Spawn new server process
    ///
    /// # Arguments
    /// * `config` - Server configuration
    ///
    /// # Returns
    /// New server process instance
    ///
    /// # Examples
    /// ```
    /// let process = LSPServerProcess::spawn(ServerConfiguration {
    ///     command: "rust-analyzer",
    ///     args: vec![],
    ///     transport: TransportKind::Stdio,
    ///     env: HashMap::new(),
    ///     cwd: None,
    /// }).await?;
    /// ```
    pub async fn spawn(config: ServerConfiguration) -> Result<Self>;

    /// Write message to server stdin
    ///
    /// # Arguments
    /// * `message` - JSON-RPC message
    ///
    /// # Examples
    /// ```
    /// process.write_message(&Message::Request(Request {
    ///     jsonrpc: "2.0".to_string(),
    ///     id: RequestId::Number(1),
    ///     method: "initialize".to_string(),
    ///     params: Some(json!({})),
    /// })).await?;
    /// ```
    pub async fn write_message(&mut self, message: &Message) -> Result<()>;

    /// Read message from server stdout
    ///
    /// # Returns
    /// Next message from server or None if stream ended
    pub async fn read_message(&mut self) -> Result<Option<Message>>;

    /// Check if process is alive
    ///
    /// # Returns
    /// true if process is running
    pub fn is_alive(&self) -> bool;

    /// Kill server process
    ///
    /// Forcefully terminates the server process.
    pub async fn kill(&mut self) -> Result<()>;

    /// Get process ID
    ///
    /// # Returns
    /// Process ID or None if not running
    pub fn pid(&self) -> Option<u32>;
}

/// Health monitor for server processes
pub struct HealthMonitor {
    last_heartbeat: Instant,
    heartbeat_interval: Duration,
    restart_count: u32,
    max_restarts: u32,
}

impl HealthMonitor {
    /// Create new health monitor
    ///
    /// # Arguments
    /// * `heartbeat_interval` - Expected time between heartbeats
    /// * `max_restarts` - Maximum restart attempts
    pub fn new(heartbeat_interval: Duration, max_restarts: u32) -> Self;

    /// Record heartbeat
    ///
    /// Updates last heartbeat timestamp.
    pub fn heartbeat(&mut self);

    /// Check if server is healthy
    ///
    /// # Returns
    /// true if server responded within heartbeat interval
    pub fn is_healthy(&self) -> bool;

    /// Record restart attempt
    ///
    /// # Returns
    /// true if restart should be attempted
    pub fn should_restart(&mut self) -> bool;
}
```

## Data Models

### LSP Protocol Types

```rust
/// LSP initialization parameters
#[derive(Debug, Serialize, Deserialize)]
pub struct InitializeParams {
    pub process_id: Option<u32>,
    pub root_uri: Option<String>,
    pub capabilities: ClientCapabilities,
    pub initialization_options: Option<JsonValue>,
}

/// Client capabilities
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ClientCapabilities {
    pub text_document: Option<TextDocumentClientCapabilities>,
    pub workspace: Option<WorkspaceClientCapabilities>,
}

/// Server capabilities
#[derive(Debug, Serialize, Deserialize)]
pub struct ServerCapabilities {
    pub completion_provider: Option<CompletionOptions>,
    pub hover_provider: Option<bool>,
    pub definition_provider: Option<bool>,
    pub references_provider: Option<bool>,
    pub document_symbol_provider: Option<bool>,
    pub workspace_symbol_provider: Option<bool>,
    pub text_document_sync: Option<TextDocumentSyncKind>,
}

/// Completion item
#[derive(Debug, Serialize, Deserialize)]
pub struct CompletionItem {
    pub label: String,
    pub kind: Option<CompletionItemKind>,
    pub detail: Option<String>,
    pub documentation: Option<MarkupContent>,
    pub insert_text: Option<String>,
    pub sort_text: Option<String>,
}

/// Diagnostic information
#[derive(Debug, Serialize, Deserialize)]
pub struct Diagnostic {
    pub range: Range,
    pub severity: Option<DiagnosticSeverity>,
    pub code: Option<String>,
    pub source: Option<String>,
    pub message: String,
}

/// Position in document
#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
pub struct Position {
    pub line: u32,
    pub character: u32,
}

/// Range in document
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Range {
    pub start: Position,
    pub end: Position,
}

/// Location in workspace
#[derive(Debug, Serialize, Deserialize)]
pub struct Location {
    pub uri: String,
    pub range: Range,
}
```

### Tree-sitter Types

```typescript
interface Tree {
  rootNode: SyntaxNode;
  edit(edit: Edit): void;
  getChangedRanges(oldTree: Tree): Range[];
}

interface SyntaxNode {
  type: string;
  startPosition: Point;
  endPosition: Point;
  startIndex: number;
  endIndex: number;
  children: SyntaxNode[];
  text: string;
}

interface Point {
  row: number;
  column: number;
}

interface Edit {
  startIndex: number;
  oldEndIndex: number;
  newEndIndex: number;
  startPosition: Point;
  oldEndPosition: Point;
  newEndPosition: Point;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Syntax highlighting applies to all supported files
*For any* file with a supported language extension (JavaScript, TypeScript, Python, Rust, Go), opening the file should result in Tree-sitter parsing being applied and syntax tokens being generated.
**Validates: Requirements 1.1**

### Property 2: Theme changes update all syntax colors
*For any* editor theme and any file with syntax highlighting, changing the theme should result in all syntax tokens being re-colored to match the new theme.
**Validates: Requirements 1.4**

### Property 3: Syntax tree caching preserves parse results
*For any* file, parsing it twice without modifications should reuse the cached syntax tree rather than re-parsing from scratch.
**Validates: Requirements 1.5**

### Property 4: Completion items display with correct metadata
*For any* set of completion items received from an LSP server, all items should be displayed in the UI with their corresponding type icons and ranking.
**Validates: Requirements 2.2**

### Property 5: Completion insertion places text at cursor
*For any* completion item and cursor position, selecting the completion should insert the completion text at the exact cursor location.
**Validates: Requirements 2.3**

### Property 6: Completion filtering matches typed prefix
*For any* list of completion items and typed prefix, the filtered results should only include items that match the prefix.
**Validates: Requirements 2.5**

### Property 7: Diagnostics appear in editor gutter
*For any* diagnostic received from an LSP server, the diagnostic should be displayed as a marker in the editor gutter at the correct line.
**Validates: Requirements 3.1**

### Property 8: Diagnostic tooltips show full messages
*For any* diagnostic marker, hovering over it should display a tooltip containing the complete diagnostic message.
**Validates: Requirements 3.3**

### Property 9: Diagnostic updates refresh UI markers
*For any* change in diagnostics for a document, the editor should update all underlines and gutter markers to reflect the new diagnostic state.
**Validates: Requirements 3.4**

### Property 10: Highest severity diagnostic shows in gutter
*For any* line with multiple diagnostics of different severities, the gutter marker should display the diagnostic with the highest severity level.
**Validates: Requirements 3.5**

### Property 11: Cross-file navigation opens correct location
*For any* symbol definition in a different file, triggering go-to-definition should open that file and position the cursor at the definition location.
**Validates: Requirements 4.2**

### Property 12: Multiple definitions show selection list
*For any* symbol with multiple definition locations, triggering go-to-definition should display a list containing all definition locations.
**Validates: Requirements 4.3**

### Property 13: Find references displays all locations
*For any* symbol, triggering find-references should display all reference locations in a results panel.
**Validates: Requirements 4.5**

### Property 14: Hover requests sent for all symbols
*For any* symbol in the editor, hovering over it should trigger a hover information request to the LSP server.
**Validates: Requirements 5.1**

### Property 15: Markdown in hover renders correctly
*For any* hover content containing markdown, the tooltip should render the markdown with proper formatting (bold, italic, lists, etc.).
**Validates: Requirements 5.3**

### Property 16: Code blocks in hover are highlighted
*For any* hover content containing code blocks, the code should be displayed with syntax highlighting applied.
**Validates: Requirements 5.4**

### Property 17: Symbol search requests match queries
*For any* workspace symbol search query, the system should send a request to the LSP server with the query text.
**Validates: Requirements 6.2**

### Property 18: Symbol results display with metadata
*For any* set of symbol search results, all symbols should be displayed with their type icons and file location information.
**Validates: Requirements 6.3**

### Property 19: Symbol selection navigates to location
*For any* symbol in search results, selecting it should navigate the editor to that symbol's location.
**Validates: Requirements 6.4**

### Property 20: Fuzzy matching updates search results
*For any* symbol search query, typing additional characters should update the results using fuzzy matching logic.
**Validates: Requirements 6.5**

### Property 21: Language detection spawns correct server
*For any* file with a supported language extension, opening the file should spawn the appropriate LSP server process for that language.
**Validates: Requirements 7.1**

### Property 22: Server crashes trigger automatic restart
*For any* LSP server process that crashes, the system should automatically restart the server and restore the connection.
**Validates: Requirements 7.2**

### Property 23: IDE shutdown stops all servers
*For any* set of running LSP servers, closing the IDE should gracefully shutdown all server processes.
**Validates: Requirements 7.3**

### Property 24: Same language reuses server instance
*For any* multiple files using the same language, all files should communicate with a single shared LSP server instance.
**Validates: Requirements 7.5**

### Property 25: Rapid input is debounced
*For any* sequence of rapid user inputs triggering LSP requests, the system should debounce the requests to limit frequency.
**Validates: Requirements 8.4**

### Property 26: Custom server paths are used
*For any* configured LSP server path, the system should use the configured path instead of the default location when spawning the server.
**Validates: Requirements 9.1**

### Property 27: Settings changes apply without restart
*For any* LSP server setting modification, the new settings should take effect without requiring an IDE restart.
**Validates: Requirements 9.2**

### Property 28: LSP messages are logged when enabled
*For any* LSP communication message, when logging is enabled, the message should be written to the debug log.
**Validates: Requirements 9.4**

### Property 29: File open requests document symbols
*For any* file opened in the editor, the system should send a document symbols request to the LSP server.
**Validates: Requirements 10.1**

### Property 30: Document symbols display hierarchically
*For any* set of document symbols received from the LSP server, they should be displayed in a hierarchical outline view preserving parent-child relationships.
**Validates: Requirements 10.2**

### Property 31: Outline item click navigates to symbol
*For any* item in the outline view, clicking it should navigate the editor to that symbol's location.
**Validates: Requirements 10.3**

### Property 32: Content changes update outline
*For any* file content modification, the outline view should update to reflect the current document structure.
**Validates: Requirements 10.4**

### Property 33: Symbol types show correct icons
*For any* symbol in the outline view, the displayed icon should match the symbol type (function, class, variable, etc.).
**Validates: Requirements 10.5**


## Error Handling

### Frontend Error Handling

#### Monaco Editor Errors
- **Grammar Loading Failures**: If a TextMate grammar fails to load, Monaco falls back to basic tokenization automatically
- **Theme Loading Errors**: If custom theme fails to load, fall back to default vs-dark theme and log the error
- **Large File Handling**: Monaco automatically handles large files with virtual scrolling; no special error handling needed

#### LSP Client Errors
- **Connection Failures**: Display user-friendly notification when IPC connection to backend fails
- **Request Timeouts**: Cancel stale requests after 5 seconds and show timeout message
- **Invalid Responses**: Log malformed responses and continue operation without crashing
- **Server Unavailable**: Show inline message in editor when LSP features are unavailable

### Backend Error Handling

#### LSP Server Process Errors
- **Spawn Failures**: Log detailed error with server command and path, notify user with actionable message
- **Initialization Failures**: Retry initialization once, then mark server as failed and notify user
- **Crash Detection**: Monitor process exit codes and stderr output to detect crashes
- **Auto-restart Logic**: Implement exponential backoff (1s, 2s, 4s, 8s, 16s) with maximum 5 restart attempts
- **Resource Exhaustion**: Monitor memory usage and kill servers exceeding 1GB RAM

#### Communication Errors
- **JSON-RPC Parse Errors**: Log malformed messages and send error response to client
- **Protocol Violations**: Detect invalid LSP messages and log with full context
- **IPC Transport Errors**: Reconnect automatically on transport failure with exponential backoff
- **Message Routing Errors**: Return proper error responses when server is not available

#### Configuration Errors
- **Invalid Server Paths**: Validate executable exists and is executable before spawning
- **Missing Dependencies**: Check for required runtime dependencies (Node.js for TypeScript, Python for pyright)
- **Permission Errors**: Detect and report permission issues with clear remediation steps
- **Configuration Validation**: Validate all settings before applying, provide clear error messages

### Error Recovery Strategies

#### Graceful Degradation
- **LSP Unavailable**: Editor continues to work with Monaco's built-in features (syntax highlighting, basic completion)
- **Server Crash**: Automatically restart server in background, restore document synchronization
- **Feature Failure**: Individual LSP features (completion, hover, etc.) fail independently without affecting others

#### User Notifications
- **Error Severity Levels**:
  - **Critical**: Server spawn failures, configuration errors (show modal dialog)
  - **Warning**: Server crashes, temporary failures (show notification toast)
  - **Info**: Server restarts, recovery actions (show status bar message)
- **Actionable Messages**: All error messages include suggested actions (check settings, install dependencies, etc.)
- **Error Logging**: All errors logged to Symphony's logging system with full context for debugging

#### State Recovery
- **Document Synchronization**: Re-sync all open documents after server restart
- **Pending Requests**: Cancel all pending requests on server crash, retry after restart
- **Diagnostic Preservation**: Cache last known diagnostics until server recovers
- **Completion State**: Clear completion cache on server restart to prevent stale suggestions

## Testing Strategy

### Dual Testing Approach

This implementation requires both unit testing and property-based testing to ensure comprehensive correctness:

- **Unit tests** verify specific examples, edge cases, and error conditions
- **Property tests** verify universal properties that should hold across all inputs
- Together they provide comprehensive coverage: unit tests catch concrete bugs, property tests verify general correctness

### Property-Based Testing

**Library Selection**: Use **fast-check** for TypeScript/JavaScript property-based testing and **proptest** for Rust property-based testing.

**Configuration**: Each property-based test should run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Test Tagging**: Each property-based test must be tagged with a comment explicitly referencing the correctness property from this design document using this exact format:

```typescript
// **Feature: syntax-highlighting-lsp, Property 1: Syntax highlighting applies to all supported files**
```

**Property Implementation**: Each correctness property defined in this document must be implemented by a SINGLE property-based test.

**Test Organization**: Property-based tests should be placed as close to implementation as possible to catch errors early in development.

### Unit Testing

Unit tests should cover:

- **Specific Examples**: Concrete test cases demonstrating correct behavior
- **Edge Cases**: Empty inputs, boundary values, special characters
- **Error Conditions**: Invalid inputs, network failures, server crashes
- **Integration Points**: IPC communication, Monaco integration, LSP protocol compliance
- **UI Interactions**: User actions triggering LSP features

Unit tests are helpful but should be focused. Property-based tests handle covering lots of inputs, so unit tests should focus on specific scenarios and integration points.

### Frontend Testing

**Framework**: Use Vitest for unit testing and React Testing Library for component testing.

**Test Coverage**:
- Monaco Editor integration and configuration
- LSP client request/response handling
- Completion provider UI integration
- Diagnostic marker rendering
- Navigation provider functionality
- Hover tooltip rendering
- Symbol search UI and filtering
- Outline view updates and navigation

**Mocking Strategy**: Mock IPC client for isolated component testing, use real Monaco Editor instance for integration tests.

### Backend Testing

**Framework**: Use Rust's built-in test framework with proptest for property-based testing.

**Test Coverage**:
- LSP server process spawning and lifecycle
- JSON-RPC message serialization/deserialization
- Language detection from file extensions
- Server configuration loading and validation
- Health monitoring and auto-restart logic
- IPC message routing
- Error handling and recovery

**Integration Testing**: Test complete LSP workflows with real language servers in isolated test environments.

### Performance Testing

**Benchmarks**:
- Syntax highlighting latency for files of varying sizes (100, 1000, 10000 lines)
- LSP request/response latency for each feature
- Memory usage with multiple language servers
- Server startup time for each supported language

**Performance Targets**:
- Syntax highlighting: <100ms for 10,000 line files
- Completion requests: <200ms response time
- Diagnostic updates: <100ms to display
- Navigation: <300ms to jump to definition
- Hover: <200ms to display tooltip

### End-to-End Testing

**Workflows to Test**:
1. Open file → syntax highlighting applied → LSP server started → completion works
2. Edit file → diagnostics update → hover shows info → go-to-definition navigates
3. Search symbols → results displayed → selection navigates to location
4. Server crash → auto-restart → features restored → documents re-synced
5. Change settings → server restarted with new config → features work with new settings

**Test Environments**:
- Test with real projects in each supported language (TypeScript, Python, Rust, Go)
- Test with large files (10,000+ lines)
- Test with multiple files open simultaneously
- Test server crash scenarios
- Test configuration changes

