//! Message envelope system for IPC communication
//!
//! Provides message envelope types, correlation IDs, and metadata
//! for reliable inter-process communication in Symphony.

use serde::{Deserialize, Serialize};
use sy_commons::{debug::duck, error::SymphonyError};
use uuid::Uuid;

/// Correlation ID for tracking request/response pairs across process boundaries
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct CorrelationId(pub Uuid);

impl CorrelationId {
    /// Creates a new unique correlation ID
    ///
    /// # Examples
    ///
    /// ```
    /// use sy_ipc_protocol::CorrelationId;
    ///
    /// let id1 = CorrelationId::new();
    /// let id2 = CorrelationId::new();
    /// assert_ne!(id1, id2);
    /// ```
    pub fn new() -> Self {
        duck!("Creating new correlation ID");
        Self(Uuid::new_v4())
    }

    /// Creates a correlation ID from a string representation
    ///
    /// # Arguments
    ///
    /// * `request_id` - UUID string representation
    ///
    /// # Errors
    ///
    /// Returns `SymphonyError` if the string is not a valid UUID
    ///
    /// # Examples
    ///
    /// ```
    /// use sy_ipc_protocol::CorrelationId;
    ///
    /// let id = CorrelationId::from_request("550e8400-e29b-41d4-a716-446655440000").unwrap();
    /// assert_eq!(id.to_string(), "550e8400-e29b-41d4-a716-446655440000");
    /// ```
    pub fn from_request(request_id: &str) -> Result<Self, SymphonyError> {
        duck!("Creating correlation ID from string: {}", request_id);
        let uuid = Uuid::parse_str(request_id)
            .map_err(|e| SymphonyError::Validation {
                message: format!("Invalid UUID format: {}", e),
                field: Some("correlation_id".to_string()),
                value: Some(request_id.to_string()),
            })?;
        Ok(Self(uuid))
    }
}

impl std::fmt::Display for CorrelationId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl Default for CorrelationId {
    fn default() -> Self {
        Self::new()
    }
}

/// Message types for type-safe routing
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum MessageType {
    /// Operations targeting The Pit infrastructure extensions
    PitOperation,
    /// Commands for extension management
    ExtensionCommand,
    /// Decisions from The Conductor orchestration engine
    ConductorDecision,
    /// Data access operations
    DataAccess,
    /// Requests to XI-editor
    XiRequest,
    /// Responses from XI-editor
    XiResponse,
    /// Notifications from XI-editor
    XiNotification,
    /// Events from XI-editor
    XiEvent,
    /// System health checks
    HealthCheck,
    /// System-wide events
    SystemEvent,
    /// Error reports
    ErrorReport,
}

/// Message priority levels for routing and processing
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum MessagePriority {
    /// System-critical messages that must be processed immediately
    Critical,
    /// User-facing operations with high priority
    High,
    /// Standard operations with normal priority
    Normal,
    /// Background tasks with low priority
    Low,
}

/// Metadata for message routing and processing hints
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageMetadata {
    /// Priority level for message processing
    pub priority: MessagePriority,
    /// Routing hints for message delivery
    pub routing_hints: Vec<String>,
    /// Optional timeout in milliseconds
    pub timeout_ms: Option<u64>,
    /// Number of retry attempts
    pub retry_count: u32,
    /// Source component identifier
    pub source_component: String,
    /// Optional target component identifier
    pub target_component: Option<String>,
}

impl Default for MessageMetadata {
    fn default() -> Self {
        Self {
            priority: MessagePriority::Normal,
            routing_hints: Vec::new(),
            timeout_ms: None,
            retry_count: 0,
            source_component: "unknown".to_string(),
            target_component: None,
        }
    }
}

/// Universal message envelope for all IPC communication
///
/// Provides correlation, routing, and metadata for reliable message delivery
/// across Symphony's distributed architecture.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageEnvelope<T> {
    /// Unique correlation ID for request/response tracking
    pub correlation_id: CorrelationId,
    /// Message type for routing
    pub message_type: MessageType,
    /// Processing and routing metadata
    pub metadata: MessageMetadata,
    /// Message payload
    pub payload: T,
    /// Message creation timestamp
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

impl<T> MessageEnvelope<T> {
    /// Creates a new message envelope with default metadata
    ///
    /// # Arguments
    ///
    /// * `message_type` - Type of message for routing
    /// * `payload` - Message payload
    ///
    /// # Examples
    ///
    /// ```
    /// use sy_ipc_protocol::{MessageEnvelope, MessageType};
    ///
    /// let envelope = MessageEnvelope::new(
    ///     MessageType::PitOperation,
    ///     "test payload".to_string(),
    /// );
    /// assert_eq!(envelope.message_type, MessageType::PitOperation);
    /// assert_eq!(envelope.payload, "test payload");
    /// ```
    pub fn new(message_type: MessageType, payload: T) -> Self {
        duck!("Creating new message envelope for type: {:?}", message_type);
        Self {
            correlation_id: CorrelationId::new(),
            message_type,
            metadata: MessageMetadata::default(),
            payload,
            timestamp: chrono::Utc::now(),
        }
    }

    /// Creates a new message envelope with custom metadata
    ///
    /// # Arguments
    ///
    /// * `message_type` - Type of message for routing
    /// * `payload` - Message payload
    /// * `metadata` - Custom metadata for processing hints
    ///
    /// # Examples
    ///
    /// ```
    /// use sy_ipc_protocol::{MessageEnvelope, MessageType, MessageMetadata, MessagePriority};
    ///
    /// let metadata = MessageMetadata {
    ///     priority: MessagePriority::High,
    ///     routing_hints: vec!["urgent".to_string()],
    ///     timeout_ms: Some(1000),
    ///     retry_count: 0,
    ///     source_component: "test".to_string(),
    ///     target_component: Some("target".to_string()),
    /// };
    ///
    /// let envelope = MessageEnvelope::with_metadata(
    ///     MessageType::ExtensionCommand,
    ///     "urgent payload".to_string(),
    ///     metadata,
    /// );
    /// assert_eq!(envelope.metadata.priority, MessagePriority::High);
    /// ```
    pub fn with_metadata(message_type: MessageType, payload: T, metadata: MessageMetadata) -> Self {
        duck!("Creating message envelope with custom metadata for type: {:?}", message_type);
        Self {
            correlation_id: CorrelationId::new(),
            message_type,
            metadata,
            payload,
            timestamp: chrono::Utc::now(),
        }
    }

    /// Creates a message envelope with a specific correlation ID
    ///
    /// Used for response messages that need to correlate with a request.
    ///
    /// # Arguments
    ///
    /// * `correlation_id` - Correlation ID from the original request
    /// * `message_type` - Type of message for routing
    /// * `payload` - Message payload
    /// * `metadata` - Processing and routing metadata
    pub fn with_correlation(
        correlation_id: CorrelationId,
        message_type: MessageType,
        payload: T,
        metadata: MessageMetadata,
    ) -> Self {
        duck!("Creating message envelope with correlation ID: {}", correlation_id);
        Self {
            correlation_id,
            message_type,
            metadata,
            payload,
            timestamp: chrono::Utc::now(),
        }
    }
}