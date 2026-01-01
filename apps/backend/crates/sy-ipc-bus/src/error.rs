//! Error types for the Symphony IPC Message Bus

use thiserror::Error;
use uuid::Uuid;

/// Main error type for message bus operations
#[derive(Error, Debug, Clone)]
pub enum BusError {
    /// No route found for the given routing key
    #[error("No route found for routing key: {0}")]
    NoRouteFound(String),
    
    /// Endpoint not found in the registry
    #[error("Endpoint not found: {0}")]
    EndpointNotFound(String),
    
    /// Endpoint is unhealthy and cannot receive messages
    #[error("Endpoint unhealthy: {0}")]
    EndpointUnhealthy(String),
    
    /// Message delivery failed
    #[error("Message delivery failed: {0}")]
    DeliveryFailed(String),
    
    /// Missing correlation ID for response message
    #[error("Missing correlation ID for response message")]
    MissingCorrelationId,
    
    /// Message exceeds maximum allowed size
    #[error("Message too large: {size} bytes (max: {max_size} bytes)")]
    MessageTooLarge { 
        /// Current message size in bytes
        size: usize, 
        /// Maximum allowed size in bytes
        max_size: usize 
    },
    
    /// Bus is shutting down and cannot process new messages
    #[error("Bus is shutting down")]
    BusShuttingDown,
    
    /// Router-related error
    #[error("Router error: {0}")]
    Router(#[from] RouterError),
    
    /// Correlation management error
    #[error("Correlation error: {0}")]
    Correlation(#[from] CorrelationError),
    
    /// Publish/subscribe error
    #[error("Pub/sub error: {0}")]
    PubSub(#[from] PubSubError),
    
    /// Health monitoring error
    #[error("Health monitoring error: {0}")]
    Health(#[from] HealthError),
    
    /// Configuration error
    #[error("Configuration error: {0}")]
    Configuration(String),
    
    /// Internal system error
    #[error("Internal error: {0}")]
    Internal(String),
}

/// Router-specific errors
#[derive(Error, Debug, Clone)]
pub enum RouterError {
    /// Invalid routing pattern syntax
    #[error("Invalid routing pattern: {0}")]
    InvalidPattern(String),
    
    /// Route already exists for this pattern
    #[error("Route already exists: {0}")]
    RouteAlreadyExists(String),
    
    /// Route not found for removal
    #[error("Route not found: {0}")]
    RouteNotFound(String),
    
    /// Pattern compilation failed
    #[error("Pattern compilation failed: {0}")]
    PatternCompilationFailed(String),
    
    /// Route priority conflict
    #[error("Route priority conflict for pattern: {0}")]
    PriorityConflict(String),
}

/// Correlation management errors
#[derive(Error, Debug, Clone)]
pub enum CorrelationError {
    /// Correlation ID not found in pending requests
    #[error("Correlation not found: {0}")]
    CorrelationNotFound(Uuid),
    
    /// Request timed out waiting for response
    #[error("Request timeout for correlation: {0}")]
    RequestTimeout(Uuid),
    
    /// Response channel was closed unexpectedly
    #[error("Response channel closed")]
    ResponseChannelClosed,
    
    /// Correlation ID already exists
    #[error("Correlation already exists: {0}")]
    CorrelationAlreadyExists(Uuid),
    
    /// Invalid correlation ID format
    #[error("Invalid correlation ID format")]
    InvalidCorrelationId,
    
    /// Correlation cleanup operation failed
    #[error("Correlation cleanup failed: {0}")]
    CleanupFailed(String),
}

/// Publish/subscribe errors
#[derive(Error, Debug, Clone)]
pub enum PubSubError {
    /// Invalid topic pattern syntax
    #[error("Invalid topic pattern: {0}")]
    InvalidPattern(String),
    
    /// Subscription not found for unsubscribe
    #[error("Subscription not found: {0}")]
    SubscriptionNotFound(usize),
    
    /// Topic not found in registry
    #[error("Topic not found: {0}")]
    TopicNotFound(String),
    
    /// Failed to receive message from channel
    #[error("Receive failed: {0}")]
    ReceiveFailed(String),
    
    /// Failed to publish message to topic
    #[error("Publish failed: {0}")]
    PublishFailed(String),
    
    /// Subscriber limit exceeded for topic
    #[error("Subscriber limit exceeded: {current}/{max}")]
    SubscriberLimitExceeded { 
        /// Current number of subscribers
        current: usize, 
        /// Maximum allowed subscribers
        max: usize 
    },
    
    /// Channel capacity exceeded
    #[error("Channel capacity exceeded")]
    ChannelCapacityExceeded,
}

/// Health monitoring errors
#[derive(Error, Debug, Clone)]
pub enum HealthError {
    /// Endpoint not registered for health monitoring
    #[error("Endpoint not registered: {0}")]
    EndpointNotRegistered(String),
    
    /// Health check operation failed
    #[error("Health check failed: {0}")]
    HealthCheckFailed(String),
    
    /// Circuit breaker is open for endpoint
    #[error("Circuit breaker open for endpoint: {0}")]
    CircuitBreakerOpen(String),
    
    /// Health monitor is not running
    #[error("Health monitor not running")]
    MonitorNotRunning,
    
    /// Invalid health configuration
    #[error("Invalid health configuration: {0}")]
    InvalidConfiguration(String),
}

/// Result type alias for bus operations
pub type BusResult<T> = Result<T, BusError>;

/// Result type alias for router operations
pub type RouterResult<T> = Result<T, RouterError>;

/// Result type alias for correlation operations
pub type CorrelationResult<T> = Result<T, CorrelationError>;

/// Result type alias for pub/sub operations
pub type PubSubResult<T> = Result<T, PubSubError>;

/// Result type alias for health operations
pub type HealthResult<T> = Result<T, HealthError>;

impl BusError {
    /// Check if error is retryable
    #[must_use]
    pub const fn is_retryable(&self) -> bool {
        matches!(self, Self::EndpointUnhealthy(_) | Self::DeliveryFailed(_) | Self::Health(HealthError::HealthCheckFailed(_)) | Self::Internal(_))
    }
    
    /// Check if error indicates a temporary condition
    #[must_use]
    pub const fn is_temporary(&self) -> bool {
        matches!(
            self,
            Self::EndpointUnhealthy(_) | Self::Health(HealthError::CircuitBreakerOpen(_))
        )
    }
}

impl RouterError {
    /// Check if error is due to invalid configuration
    #[must_use]
    pub const fn is_configuration_error(&self) -> bool {
        matches!(
            self,
            Self::InvalidPattern(_) | Self::PatternCompilationFailed(_)
        )
    }
}

impl CorrelationError {
    /// Check if error is due to timeout
    #[must_use]
    pub const fn is_timeout(&self) -> bool {
        matches!(self, Self::RequestTimeout(_))
    }
}

impl PubSubError {
    /// Check if error is due to capacity limits
    #[must_use]
    pub const fn is_capacity_error(&self) -> bool {
        matches!(
            self,
            Self::SubscriberLimitExceeded { .. } | Self::ChannelCapacityExceeded
        )
    }
}

impl HealthError {
    /// Check if error indicates endpoint is down
    #[must_use]
    pub const fn is_endpoint_down(&self) -> bool {
        matches!(
            self,
            Self::HealthCheckFailed(_) | Self::CircuitBreakerOpen(_)
        )
    }
}