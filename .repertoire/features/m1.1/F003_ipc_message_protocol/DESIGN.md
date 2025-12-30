# F003 - IPC Message Protocol - Design

**Feature ID**: F003  
**Design Date**: December 28, 2025  
**Architecture**: Multi-format message protocol with schema validation  
**Implementation**: MessagePack/Bincode binary + JSON-RPC for XI-editor  

---

## System Architecture

### Message Protocol Architecture Overview
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SYMPHONY IPC MESSAGE PROTOCOL                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                        MESSAGE ENVELOPE LAYER                          │ │
│  │                                                                        │ │
│  │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │ │
│  │   │  Correlation    │  │   Message       │  │   Routing       │      │ │
│  │   │      ID         │  │    Type         │  │   Metadata      │      │ │
│  │   │   (UUID-based)  │  │ (Type-safe enum)│  │ (Processing     │      │ │
│  │   │                 │  │                 │  │    hints)       │      │ │
│  │   └─────────┬───────┘  └─────────┬───────┘  └─────────┬───────┘      │ │
│  │             │                    │                    │                │ │
│  │             └────────────────────┼────────────────────┘                │ │
│  │                                  │                                     │ │
│  └──────────────────────────────────┼─────────────────────────────────────┘ │
│                                     │                                       │
│  ┌──────────────────────────────────┼─────────────────────────────────────┐ │
│  │                        SERIALIZATION LAYER                             │ │
│  │                                  │                                      │ │
│  │  ┌──────────────┐ ┌─────────────┴─────────────┐ ┌──────────────┐      │ │
│  │  │ MessagePack  │ │       Bincode             │ │  JSON-RPC    │      │ │
│  │  │              │ │                           │ │              │      │ │
│  │  │• Cross-lang  │ │• Pure Rust performance    │ │• XI-editor   │      │ │
│  │  │• Compact     │ │• <0.01ms serialization    │ │• <1ms latency│      │ │
│  │  │• Efficient   │ │• Zero-copy where possible │ │• JSON-RPC 2.0│      │ │
│  │  │• <0.01ms     │ │• Type-safe                │ │• Compliant   │      │ │
│  │  └──────┬───────┘ └─────────────┬─────────────┘ └──────┬───────┘      │ │
│  │         │                       │                      │                │ │
│  └─────────┼───────────────────────┼──────────────────────┼────────────────┘ │
│            │                       │                      │                  │
│  ┌─────────┼───────────────────────┼──────────────────────┼────────────────┐ │
│  │         │              PROTOCOL LAYER                  │                 │ │
│  │         │                       │                      │                 │ │
│  │  ┌──────┴───────┐ ┌─────────────┴─────────────┐ ┌──────┴───────┐        │ │
│  │  │   Symphony   │ │      XI-editor            │ │   Schema     │        │ │
│  │  │   Internal   │ │      Protocol             │ │  Validation  │        │ │
│  │  │              │ │                           │ │              │        │ │
│  │  │• Pit ops     │ │• XiOperation (buffer,     │ │• Runtime     │        │ │
│  │  │• Extension   │ │  file, cursor ops)        │ │• Type-safe   │        │ │
│  │  │• Conductor   │ │• XiEvent (buffer changes, │ │• Error       │        │ │
│  │  │• Data access │ │  cursor moves, saves)     │ │  reporting   │        │ │
│  │  └──────────────┘ └───────────────────────────┘ └──────────────┘        │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         VALIDATION LAYER                                │ │
│  │                                                                         │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │ │
│  │  │   Message    │ │   Schema     │ │  Validation  │ │    Error     │  │ │
│  │  │   Registry   │ │  Definition  │ │   Engine     │ │  Reporting   │  │ │
│  │  │              │ │              │ │              │ │              │  │ │
│  │  │• Type-safe   │ │• JSON Schema │ │• Runtime     │ │• Actionable  │  │ │
│  │  │• Compile-    │ │• Custom      │ │• Fast        │ │• Detailed    │  │ │
│  │  │  time check  │ │  validation  │ │• Configurable│ │• Context     │  │ │
│  │  │• Auto-gen    │ │• Version     │ │• Extensible  │ │• Structured  │  │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Module Design

### 1. Message Envelope System (`src/message.rs`)

#### Core Message Envelope
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageEnvelope<T> {
    pub correlation_id: CorrelationId,
    pub message_type: MessageType,
    pub metadata: MessageMetadata,
    pub payload: T,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct CorrelationId(pub Uuid);

impl CorrelationId {
    pub fn new() -> Self {
        Self(Uuid::new_v4())
    }
    
    pub fn from_request(request_id: &str) -> Result<Self, MessageError> {
        Ok(Self(Uuid::parse_str(request_id)?))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MessageType {
    // Symphony Internal Messages
    PitOperation,
    ExtensionCommand,
    ConductorDecision,
    DataAccess,
    
    // XI-editor Messages
    XiRequest,
    XiResponse,
    XiNotification,
    XiEvent,
    
    // System Messages
    HealthCheck,
    SystemEvent,
    ErrorReport,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageMetadata {
    pub priority: MessagePriority,
    pub routing_hints: Vec<String>,
    pub timeout_ms: Option<u64>,
    pub retry_count: u32,
    pub source_component: String,
    pub target_component: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MessagePriority {
    Critical,    // System-critical messages
    High,        // User-facing operations
    Normal,      // Standard operations
    Low,         // Background tasks
}
```

### 2. Serialization Abstractions (`src/serialize.rs`)

#### Multi-Format Serialization
```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SerializationFormat {
    MessagePack,
    Bincode,
    Json,
}

#[async_trait]
pub trait MessageSerializer: Send + Sync {
    async fn serialize<T>(&self, message: &T) -> Result<Vec<u8>, SerializationError>
    where
        T: Serialize + Send + Sync;
    
    async fn deserialize<T>(&self, data: &[u8]) -> Result<T, SerializationError>
    where
        T: DeserializeOwned + Send + Sync;
    
    fn format(&self) -> SerializationFormat;
    fn content_type(&self) -> &'static str;
}

pub struct MessagePackSerializer;

#[async_trait]
impl MessageSerializer for MessagePackSerializer {
    async fn serialize<T>(&self, message: &T) -> Result<Vec<u8>, SerializationError>
    where
        T: Serialize + Send + Sync,
    {
        let start = std::time::Instant::now();
        let result = rmp_serde::to_vec(message)
            .map_err(|e| SerializationError::MessagePackError(e.to_string()))?;
        
        let duration = start.elapsed();
        if duration.as_millis() > 0 {
            tracing::warn!("MessagePack serialization took {}ms (target: <0.01ms)", duration.as_millis());
        }
        
        Ok(result)
    }
    
    async fn deserialize<T>(&self, data: &[u8]) -> Result<T, SerializationError>
    where
        T: DeserializeOwned + Send + Sync,
    {
        let start = std::time::Instant::now();
        let result = rmp_serde::from_slice(data)
            .map_err(|e| SerializationError::MessagePackError(e.to_string()))?;
        
        let duration = start.elapsed();
        if duration.as_millis() > 0 {
            tracing::warn!("MessagePack deserialization took {}ms (target: <0.01ms)", duration.as_millis());
        }
        
        Ok(result)
    }
    
    fn format(&self) -> SerializationFormat {
        SerializationFormat::MessagePack
    }
    
    fn content_type(&self) -> &'static str {
        "application/msgpack"
    }
}

pub struct BincodeSerializer;

#[async_trait]
impl MessageSerializer for BincodeSerializer {
    async fn serialize<T>(&self, message: &T) -> Result<Vec<u8>, SerializationError>
    where
        T: Serialize + Send + Sync,
    {
        let start = std::time::Instant::now();
        let result = bincode::serialize(message)
            .map_err(|e| SerializationError::BincodeError(e.to_string()))?;
        
        let duration = start.elapsed();
        if duration.as_millis() > 0 {
            tracing::warn!("Bincode serialization took {}ms (target: <0.01ms)", duration.as_millis());
        }
        
        Ok(result)
    }
    
    async fn deserialize<T>(&self, data: &[u8]) -> Result<T, SerializationError>
    where
        T: DeserializeOwned + Send + Sync,
    {
        let start = std::time::Instant::now();
        let result = bincode::deserialize(data)
            .map_err(|e| SerializationError::BincodeError(e.to_string()))?;
        
        let duration = start.elapsed();
        if duration.as_millis() > 0 {
            tracing::warn!("Bincode deserialization took {}ms (target: <0.01ms)", duration.as_millis());
        }
        
        Ok(result)
    }
    
    fn format(&self) -> SerializationFormat {
        SerializationFormat::Bincode
    }
    
    fn content_type(&self) -> &'static str {
        "application/octet-stream"
    }
}
```

### 3. JSON-RPC Implementation (`src/jsonrpc.rs`)

#### JSON-RPC 2.0 Compliant Messages
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum JsonRpcMessage {
    Request(JsonRpcRequest),
    Response(JsonRpcResponse),
    Notification(JsonRpcNotification),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcRequest {
    pub jsonrpc: String, // Always "2.0"
    pub method: String,
    pub params: Option<serde_json::Value>,
    pub id: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcResponse {
    pub jsonrpc: String, // Always "2.0"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<JsonRpcError>,
    pub id: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcNotification {
    pub jsonrpc: String, // Always "2.0"
    pub method: String,
    pub params: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcError {
    pub code: i32,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<serde_json::Value>,
}

// JSON-RPC Error Codes (per specification)
pub mod error_codes {
    pub const PARSE_ERROR: i32 = -32700;
    pub const INVALID_REQUEST: i32 = -32600;
    pub const METHOD_NOT_FOUND: i32 = -32601;
    pub const INVALID_PARAMS: i32 = -32602;
    pub const INTERNAL_ERROR: i32 = -32603;
    // Server error range: -32099 to -32000
}

pub struct JsonRpcClient {
    correlation_map: Arc<Mutex<HashMap<serde_json::Value, tokio::sync::oneshot::Sender<JsonRpcResponse>>>>,
    request_timeout: Duration,
}

impl JsonRpcClient {
    pub fn new(request_timeout: Duration) -> Self {
        Self {
            correlation_map: Arc::new(Mutex::new(HashMap::new())),
            request_timeout,
        }
    }
    
    pub async fn call(&self, method: &str, params: Option<serde_json::Value>) -> Result<serde_json::Value, JsonRpcError> {
        let id = serde_json::Value::String(Uuid::new_v4().to_string());
        let request = JsonRpcRequest {
            jsonrpc: "2.0".to_string(),
            method: method.to_string(),
            params,
            id: id.clone(),
        };
        
        let (tx, rx) = tokio::sync::oneshot::channel();
        self.correlation_map.lock().unwrap().insert(id.clone(), tx);
        
        // Send request (implementation depends on transport layer)
        self.send_request(request).await?;
        
        // Wait for response with timeout
        let response = tokio::time::timeout(self.request_timeout, rx)
            .await
            .map_err(|_| JsonRpcError {
                code: error_codes::INTERNAL_ERROR,
                message: "Request timeout".to_string(),
                data: None,
            })?
            .map_err(|_| JsonRpcError {
                code: error_codes::INTERNAL_ERROR,
                message: "Response channel closed".to_string(),
                data: None,
            })?;
        
        match response.error {
            Some(error) => Err(error),
            None => Ok(response.result.unwrap_or(serde_json::Value::Null)),
        }
    }
    
    pub async fn notify(&self, method: &str, params: Option<serde_json::Value>) -> Result<(), JsonRpcError> {
        let notification = JsonRpcNotification {
            jsonrpc: "2.0".to_string(),
            method: method.to_string(),
            params,
        };
        
        self.send_notification(notification).await
    }
    
    async fn send_request(&self, request: JsonRpcRequest) -> Result<(), JsonRpcError> {
        // Implementation depends on transport layer (F004)
        todo!("Implement with transport layer")
    }
    
    async fn send_notification(&self, notification: JsonRpcNotification) -> Result<(), JsonRpcError> {
        // Implementation depends on transport layer (F004)
        todo!("Implement with transport layer")
    }
}
```

### 4. XI-editor Protocol (`src/xi_protocol.rs`)

#### XI-editor Specific Messages
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "method", content = "params")]
pub enum XiOperation {
    // File Operations
    #[serde(rename = "new_view")]
    NewView { file_path: Option<String> },
    
    #[serde(rename = "close_view")]
    CloseView { view_id: String },
    
    #[serde(rename = "save")]
    Save { view_id: String, file_path: Option<String> },
    
    // Text Operations
    #[serde(rename = "edit")]
    Edit { view_id: String, delta: TextDelta },
    
    #[serde(rename = "insert")]
    Insert { view_id: String, chars: String },
    
    #[serde(rename = "delete_forward")]
    DeleteForward { view_id: String },
    
    #[serde(rename = "delete_backward")]
    DeleteBackward { view_id: String },
    
    // Cursor Operations
    #[serde(rename = "move_up")]
    MoveUp { view_id: String },
    
    #[serde(rename = "move_down")]
    MoveDown { view_id: String },
    
    #[serde(rename = "move_left")]
    MoveLeft { view_id: String },
    
    #[serde(rename = "move_right")]
    MoveRight { view_id: String },
    
    #[serde(rename = "click")]
    Click { view_id: String, line: u64, col: u64 },
    
    // Selection Operations
    #[serde(rename = "select_all")]
    SelectAll { view_id: String },
    
    #[serde(rename = "selection_for_find")]
    SelectionForFind { view_id: String, case_sensitive: bool },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "method", content = "params")]
pub enum XiEvent {
    // Buffer Events
    #[serde(rename = "update")]
    Update { 
        view_id: String, 
        update: ViewUpdate,
        rev: u64,
    },
    
    #[serde(rename = "scroll_to")]
    ScrollTo { 
        view_id: String, 
        line: u64, 
        col: u64,
    },
    
    // File Events
    #[serde(rename = "config_changed")]
    ConfigChanged { 
        view_id: String, 
        changes: serde_json::Value,
    },
    
    #[serde(rename = "theme_changed")]
    ThemeChanged { 
        name: String, 
        theme: serde_json::Value,
    },
    
    // Status Events
    #[serde(rename = "available_plugins")]
    AvailablePlugins { 
        view_id: String, 
        plugins: Vec<PluginDescription>,
    },
    
    #[serde(rename = "plugin_started")]
    PluginStarted { 
        view_id: String, 
        plugin: String,
    },
    
    #[serde(rename = "plugin_stopped")]
    PluginStopped { 
        view_id: String, 
        plugin: String, 
        code: i32,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextDelta {
    pub ops: Vec<DeltaOp>,
    pub base_len: usize,
    pub target_len: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "op")]
pub enum DeltaOp {
    #[serde(rename = "retain")]
    Retain { n: usize },
    
    #[serde(rename = "insert")]
    Insert { s: String },
    
    #[serde(rename = "delete")]
    Delete { n: usize },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ViewUpdate {
    pub lines: Vec<Line>,
    pub pristine: bool,
    pub cursor: Vec<u64>,
    pub selection: Vec<Selection>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Line {
    pub text: String,
    pub cursor: Vec<u64>,
    pub styles: Vec<StyleSpan>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Selection {
    pub start: u64,
    pub end: u64,
    pub cursor: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StyleSpan {
    pub offset: u64,
    pub len: u64,
    pub style_id: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginDescription {
    pub name: String,
    pub running: bool,
}
```

### 5. Schema Validation System (`src/schema.rs`)

#### Runtime Schema Validation
```rust
use serde_json::Value as JsonValue;

pub trait MessageSchema: Send + Sync {
    fn validate(&self, message: &JsonValue) -> Result<(), ValidationError>;
    fn schema_version(&self) -> &str;
    fn message_type(&self) -> &str;
}

pub struct SchemaValidator {
    schemas: HashMap<String, Box<dyn MessageSchema>>,
    validation_enabled: bool,
}

impl SchemaValidator {
    pub fn new() -> Self {
        Self {
            schemas: HashMap::new(),
            validation_enabled: true,
        }
    }
    
    pub fn register_schema<S: MessageSchema + 'static>(&mut self, schema: S) {
        let message_type = schema.message_type().to_string();
        self.schemas.insert(message_type, Box::new(schema));
    }
    
    pub async fn validate_message(&self, message_type: &str, message: &JsonValue) -> Result<(), ValidationError> {
        if !self.validation_enabled {
            return Ok(());
        }
        
        let start = std::time::Instant::now();
        
        let schema = self.schemas.get(message_type)
            .ok_or_else(|| ValidationError::SchemaNotFound(message_type.to_string()))?;
        
        let result = schema.validate(message);
        
        let duration = start.elapsed();
        if duration.as_millis() > 0 {
            tracing::warn!("Schema validation took {}ms for {}", duration.as_millis(), message_type);
        }
        
        result
    }
    
    pub fn disable_validation(&mut self) {
        self.validation_enabled = false;
    }
    
    pub fn enable_validation(&mut self) {
        self.validation_enabled = true;
    }
}

#[derive(Debug, Clone)]
pub struct JsonRpcSchema;

impl MessageSchema for JsonRpcSchema {
    fn validate(&self, message: &JsonValue) -> Result<(), ValidationError> {
        // Validate JSON-RPC 2.0 structure
        let obj = message.as_object()
            .ok_or_else(|| ValidationError::InvalidFormat("Message must be JSON object".to_string()))?;
        
        // Check jsonrpc field
        let jsonrpc = obj.get("jsonrpc")
            .and_then(|v| v.as_str())
            .ok_or_else(|| ValidationError::MissingField("jsonrpc".to_string()))?;
        
        if jsonrpc != "2.0" {
            return Err(ValidationError::InvalidValue("jsonrpc must be '2.0'".to_string()));
        }
        
        // Check method field (for requests and notifications)
        if obj.contains_key("method") {
            let method = obj.get("method")
                .and_then(|v| v.as_str())
                .ok_or_else(|| ValidationError::InvalidField("method must be string".to_string()))?;
            
            if method.is_empty() {
                return Err(ValidationError::InvalidValue("method cannot be empty".to_string()));
            }
        }
        
        // Check id field (required for requests and responses)
        if obj.contains_key("id") {
            let id = obj.get("id").unwrap();
            if !id.is_string() && !id.is_number() && !id.is_null() {
                return Err(ValidationError::InvalidField("id must be string, number, or null".to_string()));
            }
        }
        
        // Validate response structure
        if obj.contains_key("result") || obj.contains_key("error") {
            if !obj.contains_key("id") {
                return Err(ValidationError::MissingField("id required for responses".to_string()));
            }
            
            let has_result = obj.contains_key("result");
            let has_error = obj.contains_key("error");
            
            if has_result && has_error {
                return Err(ValidationError::InvalidFormat("response cannot have both result and error".to_string()));
            }
            
            if !has_result && !has_error {
                return Err(ValidationError::InvalidFormat("response must have either result or error".to_string()));
            }
        }
        
        Ok(())
    }
    
    fn schema_version(&self) -> &str {
        "2.0"
    }
    
    fn message_type(&self) -> &str {
        "jsonrpc"
    }
}

#[derive(Debug, thiserror::Error)]
pub enum ValidationError {
    #[error("Schema not found for message type: {0}")]
    SchemaNotFound(String),
    
    #[error("Invalid message format: {0}")]
    InvalidFormat(String),
    
    #[error("Missing required field: {0}")]
    MissingField(String),
    
    #[error("Invalid field: {0}")]
    InvalidField(String),
    
    #[error("Invalid value: {0}")]
    InvalidValue(String),
    
    #[error("Validation failed: {0}")]
    ValidationFailed(String),
}
```

## Data Structures

### Message Registry System
```rust
pub struct MessageRegistry {
    type_map: HashMap<String, MessageType>,
    serializers: HashMap<SerializationFormat, Box<dyn MessageSerializer>>,
    validator: SchemaValidator,
}

impl MessageRegistry {
    pub fn new() -> Self {
        let mut registry = Self {
            type_map: HashMap::new(),
            serializers: HashMap::new(),
            validator: SchemaValidator::new(),
        };
        
        // Register default serializers
        registry.register_serializer(SerializationFormat::MessagePack, Box::new(MessagePackSerializer));
        registry.register_serializer(SerializationFormat::Bincode, Box::new(BincodeSerializer));
        registry.register_serializer(SerializationFormat::Json, Box::new(JsonSerializer));
        
        // Register default schemas
        registry.validator.register_schema(JsonRpcSchema);
        
        registry
    }
    
    pub fn register_message_type(&mut self, type_name: String, message_type: MessageType) {
        self.type_map.insert(type_name, message_type);
    }
    
    pub fn register_serializer(&mut self, format: SerializationFormat, serializer: Box<dyn MessageSerializer>) {
        self.serializers.insert(format, serializer);
    }
    
    pub async fn serialize_message<T>(&self, message: &MessageEnvelope<T>, format: SerializationFormat) -> Result<Vec<u8>, SerializationError>
    where
        T: Serialize + Send + Sync,
    {
        let serializer = self.serializers.get(&format)
            .ok_or_else(|| SerializationError::UnsupportedFormat(format))?;
        
        serializer.serialize(message).await
    }
    
    pub async fn deserialize_message<T>(&self, data: &[u8], format: SerializationFormat) -> Result<MessageEnvelope<T>, SerializationError>
    where
        T: DeserializeOwned + Send + Sync,
    {
        let serializer = self.serializers.get(&format)
            .ok_or_else(|| SerializationError::UnsupportedFormat(format))?;
        
        serializer.deserialize(data).await
    }
}
```

## Performance Considerations

### Serialization Performance Optimization
- **Zero-Copy Deserialization**: Use `serde_json::from_slice` and similar methods where possible
- **Pre-allocated Buffers**: Reuse serialization buffers to reduce allocations
- **Streaming Serialization**: For large messages, use streaming serialization
- **Compression**: Optional compression for large payloads (configurable)

### Memory Usage Optimization
- **Message Pooling**: Reuse message envelope objects
- **Lazy Deserialization**: Deserialize payload only when needed
- **Compact Representations**: Use compact data structures for metadata
- **Reference Counting**: Use `Arc` for shared message data

### Validation Performance
- **Schema Caching**: Cache compiled schemas for reuse
- **Selective Validation**: Skip validation for trusted internal messages
- **Parallel Validation**: Validate multiple messages concurrently
- **Fast Path**: Optimize common message types

## Error Handling Strategy

### Error Categories
1. **Serialization Errors**: Format-specific serialization/deserialization failures
2. **Validation Errors**: Schema validation failures with detailed context
3. **Protocol Errors**: JSON-RPC protocol violations
4. **System Errors**: Resource exhaustion, timeout, network failures

### Error Recovery
- **Graceful Degradation**: Continue operation with reduced functionality
- **Error Reporting**: Detailed error context for debugging
- **Retry Logic**: Automatic retry for transient errors
- **Circuit Breaker**: Prevent cascade failures

---

**Design Complete**: Ready for TESTING phase  
**Next Phase**: TESTING.md - Comprehensive testing strategy and implementation