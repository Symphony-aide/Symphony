//! Core message bus implementation
//!
//! This module provides the central `MessageBus` that coordinates all message routing,
//! correlation, pub/sub, and health monitoring functionality.

use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;
use sy_commons::debug::duck;

use crate::error::{BusResult};
use crate::router::PatternRouter;
use crate::correlation::CorrelationManager;
use crate::pubsub::PubSubManager;
use crate::health::HealthMonitor;
use crate::MessageEnvelope;

/// Configuration for the message bus
#[derive(Debug, Clone)]
pub struct BusConfig {
    /// Maximum message size in bytes
    pub max_message_size: usize,
    /// Correlation timeout duration
    pub correlation_timeout: Duration,
    /// Health check interval
    pub health_check_interval: Duration,
    /// Message batch size for throughput optimization
    pub batch_size: usize,
    /// Maximum concurrent deliveries
    pub max_concurrent_deliveries: usize,
}

impl Default for BusConfig {
    fn default() -> Self {
        Self {
            max_message_size: 1024 * 1024, // 1MB
            correlation_timeout: Duration::from_secs(30),
            health_check_interval: Duration::from_secs(5),
            batch_size: 100,
            max_concurrent_deliveries: 1000,
        }
    }
}

/// Central message bus for Symphony IPC communication
///
/// The `MessageBus` provides high-performance message routing with pattern-based routing,
/// request/response correlation, publish/subscribe messaging, and health monitoring.
///
/// # Performance Targets
///
/// - <0.1ms average routing latency
/// - >10,000 messages per second sustained throughput
/// - <1ms delivery time to all subscribers
/// - <100ms failure detection time
/// - <0.01% message loss rate under normal conditions
///
/// # Examples
///
/// ```rust
/// use sy_ipc_bus::{MessageBus, BusConfig};
///
/// #[tokio::main]
/// async fn main() -> Result<(), Box<dyn std::error::Error>> {
///     let config = BusConfig::default();
///     let bus = MessageBus::new(config);
///     
///     // Register a route
///     bus.register_route("user.*", "user-service", 100).await?;
///     
///     Ok(())
/// }
/// ```
pub struct MessageBus {
    router: Arc<PatternRouter>,
    correlation_manager: Arc<CorrelationManager>,
    pubsub_manager: Arc<PubSubManager>,
    health_monitor: Arc<HealthMonitor>,
    config: BusConfig,
    shutdown: Arc<RwLock<bool>>,
}

impl MessageBus {
    /// Create a new message bus with the given configuration
    ///
    /// # Arguments
    ///
    /// * `config` - Configuration for the message bus
    ///
    /// # Examples
    ///
    /// ```rust
    /// use sy_ipc_bus::{MessageBus, BusConfig};
    ///
    /// #[tokio::main]
    /// async fn main() {
    ///     let config = BusConfig::default();
    ///     let bus = MessageBus::new(config);
    /// }
    /// ```
    #[must_use]
    pub fn new(config: BusConfig) -> Self {
        duck!("Creating new MessageBus with config: {:?}", config);
        
        Self {
            router: Arc::new(PatternRouter::new()),
            correlation_manager: Arc::new(CorrelationManager::new(config.correlation_timeout)),
            pubsub_manager: Arc::new(PubSubManager::new()),
            health_monitor: Arc::new(HealthMonitor::new(config.health_check_interval)),
            config,
            shutdown: Arc::new(RwLock::new(false)),
        }
    }
    
    /// Register a route for message routing
    ///
    /// # Arguments
    ///
    /// * `pattern` - Routing pattern (supports wildcards and regex)
    /// * `endpoint_id` - Target endpoint identifier
    /// * `priority` - Route priority (higher values have higher priority)
    ///
    /// # Errors
    ///
    /// Returns `BusError::Router` if the pattern is invalid or route registration fails.
    ///
    /// # Examples
    ///
    /// ```rust
    /// # use sy_ipc_bus::{MessageBus, BusConfig};
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// let bus = MessageBus::new(BusConfig::default());
    /// bus.register_route("user.*", "user-service", 100).await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn register_route(&self, pattern: &str, endpoint_id: &str, priority: u32) -> BusResult<()> {
        duck!("Registering route: pattern={}, endpoint={}, priority={}", pattern, endpoint_id, priority);
        
        // Register route in router
        self.router.register_route(pattern, endpoint_id.to_string(), priority).await?;
        
        // Register endpoint for health monitoring
        let _ = self.health_monitor.register_endpoint(endpoint_id).await;
        
        Ok(())
    }
    
    /// Route a message through the bus
    ///
    /// # Arguments
    ///
    /// * `message` - Message envelope to route
    ///
    /// # Errors
    ///
    /// Returns various `BusError` variants depending on the failure:
    /// - `BusError::NoRouteFound` if no matching route exists
    /// - `BusError::EndpointNotFound` if the target endpoint doesn't exist
    /// - `BusError::DeliveryFailed` if message delivery fails
    ///
    /// # Examples
    ///
    /// ```rust
    /// # use sy_ipc_bus::{MessageBus, BusConfig};
    /// # use sy_ipc_protocol::{MessageEnvelope, MessageType};
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// let bus = MessageBus::new(BusConfig::default());
    /// 
    /// // Create a test message
    /// let message = MessageEnvelope::new(
    ///     MessageType::PitOperation,
    ///     b"test payload".to_vec(),
    /// );
    /// 
    /// // Route the message (will fail until route is registered)
    /// // bus.route_message(message).await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn route_message(&self, message: MessageEnvelope) -> BusResult<()> {
        duck!("Routing message: type={:?}, correlation_id={}", message.message_type, message.correlation_id);
        
        // Check if bus is shutting down
        {
            let shutdown = self.shutdown.read().await;
            if *shutdown {
                return Err(crate::error::BusError::BusShuttingDown);
            }
        }
        
        // Check message size
        let message_size = message.payload.len();
        if message_size > self.config.max_message_size {
            return Err(crate::error::BusError::MessageTooLarge {
                size: message_size,
                max_size: self.config.max_message_size,
            });
        }
        
        let start = std::time::Instant::now();
        
        // Route based on message type
        match message.message_type {
            sy_ipc_protocol::MessageType::PitOperation |
            sy_ipc_protocol::MessageType::ExtensionCommand |
            sy_ipc_protocol::MessageType::ConductorDecision |
            sy_ipc_protocol::MessageType::DataAccess |
            sy_ipc_protocol::MessageType::XiRequest => {
                self.handle_request(message).await
            }
            sy_ipc_protocol::MessageType::XiResponse => {
                self.handle_response(message).await
            }
            sy_ipc_protocol::MessageType::XiNotification |
            sy_ipc_protocol::MessageType::HealthCheck |
            sy_ipc_protocol::MessageType::ErrorReport => {
                self.handle_notification(&message)
            }
            sy_ipc_protocol::MessageType::SystemEvent |
            sy_ipc_protocol::MessageType::XiEvent => {
                self.handle_event(message).await
            }
        }?;
        
        let routing_time = start.elapsed();
        if routing_time > std::time::Duration::from_nanos(100_000) {
            duck!("Message routing took {}μs (target: <100μs)", routing_time.as_micros());
        }
        
        Ok(())
    }
    
    /// Shutdown the message bus gracefully
    ///
    /// This stops all background tasks and prevents new messages from being processed.
    ///
    /// # Examples
    ///
    /// ```rust
    /// # use sy_ipc_bus::{MessageBus, BusConfig};
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// let bus = MessageBus::new(BusConfig::default());
    /// bus.shutdown().await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn shutdown(&self) -> BusResult<()> {
        duck!("Shutting down MessageBus");
        
        // Set shutdown flag
        {
            let mut shutdown = self.shutdown.write().await;
            *shutdown = true;
        }
        
        // Stop health monitoring
        let _ = self.health_monitor.stop_monitoring().await;
        
        // Cleanup health monitor
        let _ = self.health_monitor.cleanup().await;
        
        Ok(())
    }
    
    /// Handle request messages
    async fn handle_request(&self, message: MessageEnvelope) -> BusResult<()> {
        // For now, we'll use the message type as a simple routing key
        // In a real implementation, this would extract routing information from metadata
        let routing_key = format!("{:?}", message.message_type).to_lowercase();
        
        // Find matching route
        let route = self.router.find_route(&routing_key)
            .ok_or_else(|| crate::error::BusError::NoRouteFound(routing_key.clone()))?;
        
        // Register correlation for response if needed
        // This is a simplified implementation
        let correlation_id = message.correlation_id.to_string();
        if let Some(reply_to) = message.metadata.target_component.as_ref() {
            let _ = self.correlation_manager.register_request(correlation_id, reply_to.clone()).await;
        }
        
        // Simulate message delivery (in real implementation, this would deliver to actual endpoint)
        duck!("Delivering request to endpoint: {}", route.endpoint_id);
        
        Ok(())
    }
    
    /// Handle response messages
    async fn handle_response(&self, message: MessageEnvelope) -> BusResult<()> {
        let correlation_id = message.correlation_id.to_string();
        
        // Find original request endpoint
        let reply_to = self.correlation_manager.resolve_correlation(correlation_id).await?;
        
        // Simulate response delivery
        duck!("Delivering response to: {}", reply_to);
        
        Ok(())
    }
    
    /// Handle notification messages
    fn handle_notification(&self, message: &MessageEnvelope) -> BusResult<()> {
        let routing_key = format!("{:?}", message.message_type).to_lowercase();
        
        // Find all matching routes (notifications can go to multiple endpoints)
        let routes = self.router.find_all_routes(&routing_key);
        
        if routes.is_empty() {
            return Err(crate::error::BusError::NoRouteFound(routing_key));
        }
        
        // Simulate delivery to all matching endpoints
        for route in routes {
            duck!("Delivering notification to endpoint: {}", route.endpoint_id);
        }
        
        Ok(())
    }
    
    /// Handle event messages
    async fn handle_event(&self, message: MessageEnvelope) -> BusResult<()> {
        let topic = format!("{:?}", message.message_type).to_lowercase();
        
        // Events go through pub/sub system
        let delivered = self.pubsub_manager.publish(&topic, message).await?;
        
        duck!("Published event to {} subscribers", delivered);
        
        Ok(())
    }
}