//! Error types for the Symphony IPC Message Bus

use thiserror::Error;
use uuid::Uuid;

/// Main error type for message bus operations
#[derive(Error, Debug, Clone)]
pub enum BusError {
    #[error("No route found for routing key: {0}")]
    NoRouteFound(String),
    
    #[error("Endpoint not found: {0}")]
    EndpointNotFound(String),
    
    #[error("Endpoint unhealthy: {0}")]
    EndpointUnhealthy(String),
    
    #[error("Message delivery failed: {0}")]
    DeliveryFailed(String),
    
    #[error("Missing correlation ID for response message")]
    MissingCorrelationId,
    
    #[error("Message too large: {size} bytes (max: {max_size} bytes)")]
    MessageTooLarge { size: usize, max_size: usize },
    
    #[error("Bus is shutting down")]
    BusShuttingDown,
    
    #[error("Router error: {0}")]
    Router(#[from] RouterError),
    
    #[error("Correlation error: {0}")]
    Correlation(#[from] CorrelationError),
    
    #[error("Pub/sub error: {0}")]
    PubSub(#[from] PubSubError),
    
    #[error("Health monitoring error: {0}")]
    Health(#[from] HealthError),
    
    #[error("Configuration error: {0}")]
    Configuration(String),
    
    #[error("Internal error: {0}")]
    Internal(String),
}

/// Router-specific errors
#[derive(Error, Debug, Clone)]
pub enum RouterError {
    #[error("Invalid routing pattern: {0}")]
    InvalidPattern(String),
    
    #[error("Route already exists: {0}")]
    RouteAlreadyExists(String),
    
    #[error("Route not found: {0}")]
    RouteNotFound(String),
    
    #[error("Pattern compilation failed: {0}")]
    PatternCompilationFailed(String),
    
    #[error("Route priority conflict for pattern: {0}")]
    PriorityConflict(String),
}

/// Correlation management errors
#[derive(Error, Debug, Clone)]
pub enum CorrelationError {
    #[error("Correlation not found: {0}")]
    CorrelationNotFound(Uuid),
    
    #[error("Request timeout for correlation: {0}")]
    RequestTimeout(Uuid),
    
    #[error("Response channel closed")]
    ResponseChannelClosed,
    
    #[error("Correlation already exists: {0}")]
    CorrelationAlreadyExists(Uuid),
    
    #[error("Invalid correlation ID format")]
    InvalidCorrelationId,
    
    #[error("Correlation cleanup failed: {0}")]
    CleanupFailed(String),
}

/// Publish/subscribe errors
#[derive(Error, Debug, Clone)]
pub enum PubSubError {
    #[error("Invalid topic pattern: {0}")]
    InvalidPattern(String),
    
    #[error("Subscription not found: {0}")]
    SubscriptionNotFound(usize),
    
    #[error("Topic not found: {0}")]
    TopicNotFound(String),
    
    #[error("Receive failed: {0}")]
    ReceiveFailed(String),
    
    #[error("Publish failed: {0}")]
    PublishFailed(String),
    
    #[error("Subscriber limit exceeded: {current}/{max}")]
    SubscriberLimitExceeded { current: usize, max: usize },
    
    #[error("Channel capacity exceeded")]
    ChannelCapacityExceeded,
}

/// Health monitoring errors
#[derive(Error, Debug, Clone)]
pub enum HealthError {
    #[error("Endpoint not registered: {0}")]
    EndpointNotRegistered(String),
    
    #[error("Health check failed: {0}")]
    HealthCheckFailed(String),
    
    #[error("Circuit breaker open for endpoint: {0}")]
    CircuitBreakerOpen(String),
    
    #[error("Health monitor not running")]
    MonitorNotRunning,
    
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
    pub fn is_retryable(&self) -> bool {
        match self {
            BusError::EndpointUnhealthy(_) => true,
            BusError::DeliveryFailed(_) => true,
            BusError::Health(HealthError::HealthCheckFailed(_)) => true,
            BusError::Internal(_) => true,
            _ => false,
        }
    }
    
    /// Check if error indicates a temporary condition
    pub fn is_temporary(&self) -> bool {
        match self {
            BusError::EndpointUnhealthy(_) => true,
            BusError::BusShuttingDown => false,
            BusError::Health(HealthError::CircuitBreakerOpen(_)) => true,
            _ => false,
        }
    }
}

impl RouterError {
    /// Check if error is due to invalid configuration
    pub fn is_configuration_error(&self) -> bool {
        matches!(
            self,
            RouterError::InvalidPattern(_) | RouterError::PatternCompilationFailed(_)
        )
    }
}

impl CorrelationError {
    /// Check if error is due to timeout
    pub fn is_timeout(&self) -> bool {
        matches!(self, CorrelationError::RequestTimeout(_))
    }
}

impl PubSubError {
    /// Check if error is due to capacity limits
    pub fn is_capacity_error(&self) -> bool {
        matches!(
            self,
            PubSubError::SubscriberLimitExceeded { .. } | PubSubError::ChannelCapacityExceeded
        )
    }
}

impl HealthError {
    /// Check if error indicates endpoint is down
    pub fn is_endpoint_down(&self) -> bool {
        matches!(
            self,
            HealthError::HealthCheckFailed(_) | HealthError::CircuitBreakerOpen(_)
        )
    }
}