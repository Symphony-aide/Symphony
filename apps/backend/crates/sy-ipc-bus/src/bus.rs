//! Core message bus implementation
//!
//! This module provides the central `MessageBus` that coordinates all message routing,
//! correlation, pub/sub, and health monitoring functionality.

use std::sync::Arc;
use std::time::Duration;
use sy_commons::debug::duck;
use sy_commons::{error, info, warn, Config, ResultContext};
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};

use crate::correlation::CorrelationManager;
use crate::error::BusResult;
use crate::health::HealthMonitor;
use crate::pubsub::PubSubManager;
use crate::router::PatternRouter;
use crate::MessageEnvelope;

/// Configuration for the message bus using sy-commons config system
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BusConfig {
	/// Maximum message size in bytes
	pub max_message_size: usize,
	/// Correlation timeout duration in seconds
	pub correlation_timeout_secs: u64,
	/// Health check interval in seconds
	pub health_check_interval_secs: u64,
	/// Message batch size for throughput optimization
	pub batch_size: usize,
	/// Maximum concurrent deliveries
	pub max_concurrent_deliveries: usize,
	/// Channel capacity for pub/sub topics
	pub pubsub_channel_capacity: usize,
	/// Routing latency threshold in nanoseconds
	pub routing_latency_threshold_ns: u64,
	/// Cleanup interval for expired correlations in seconds
	pub correlation_cleanup_interval_secs: u64,
}

impl Config for BusConfig {}

impl Default for BusConfig {
	fn default() -> Self {
		Self {
			max_message_size: 1024 * 1024, // 1MB
			correlation_timeout_secs: 30,
			health_check_interval_secs: 5,
			batch_size: 100,
			max_concurrent_deliveries: 1000,
			pubsub_channel_capacity: 1000,
			routing_latency_threshold_ns: 100_000, // 100μs
			correlation_cleanup_interval_secs: 30,
		}
	}
}

impl BusConfig {
	/// Get correlation timeout as Duration
	pub fn correlation_timeout(&self) -> Duration {
		Duration::from_secs(self.correlation_timeout_secs)
	}

	/// Get health check interval as Duration
	pub fn health_check_interval(&self) -> Duration {
		Duration::from_secs(self.health_check_interval_secs)
	}

	/// Get routing latency threshold as Duration
	pub fn routing_latency_threshold(&self) -> Duration {
		Duration::from_nanos(self.routing_latency_threshold_ns)
	}

	/// Get correlation cleanup interval as Duration
	pub fn correlation_cleanup_interval(&self) -> Duration {
		Duration::from_secs(self.correlation_cleanup_interval_secs)
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
			correlation_manager: Arc::new(CorrelationManager::new(config.correlation_timeout())),
			pubsub_manager: Arc::new(PubSubManager::new_with_capacity(config.pubsub_channel_capacity)),
			health_monitor: Arc::new(HealthMonitor::new(config.health_check_interval())),
			config,
			shutdown: Arc::new(RwLock::new(false)),
		}
	}

	/// Create a new message bus from environment configuration
	///
	/// # Arguments
	///
	/// * `environment` - Environment name (e.g., "development", "production")
	///
	/// # Errors
	///
	/// Returns `BusError::Configuration` if configuration loading fails.
	///
	/// # Examples
	///
	/// ```rust
	/// use sy_ipc_bus::MessageBus;
	///
	/// #[tokio::main]
	/// async fn main() -> Result<(), Box<dyn std::error::Error>> {
	///     // This would work with proper config files:
	///     // let bus = MessageBus::from_config("production")?;
	///     Ok(())
	/// }
	/// ```
	pub fn from_config(environment: &str) -> BusResult<Self> {
		let config: BusConfig = BusConfig::load(environment)
			.map_err(|e| crate::error::BusError::Configuration(
				format!("Failed to load bus configuration for environment '{}': {}", environment, e)
			))?;
		
		info!("Loaded bus configuration for environment: {}", environment);
		Ok(Self::new(config))
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
	pub async fn register_route(
		&self,
		pattern: &str,
		endpoint_id: &str,
		priority: u32,
	) -> BusResult<()> {
		duck!(
			"Registering route: pattern={}, endpoint={}, priority={}",
			pattern,
			endpoint_id,
			priority
		);

		// Register route in router
		self.router.register_route(pattern, endpoint_id.to_string(), priority).await?;

		// Register endpoint for health monitoring
		let _ = self.health_monitor.register_endpoint(endpoint_id).await;

		info!(
			"Route registered successfully: pattern={}, endpoint={}, priority={}",
			pattern, endpoint_id, priority
		);

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
		let correlation_id = message.correlation_id.to_string(); // Extract before moving
		duck!(
			"Routing message: type={:?}, correlation_id={}",
			message.message_type,
			correlation_id
		);

		// Check if bus is shutting down
		{
			let shutdown = self.shutdown.read().await;
			if *shutdown {
				warn!(
					"Message routing rejected - bus is shutting down: correlation_id={}",
					correlation_id
				);
				return Err(crate::error::BusError::BusShuttingDown);
			}
		}

		// Check message size
		let message_size = message.payload.len();
		if message_size > self.config.max_message_size {
			error!(
				"Message too large: size={} bytes, max={} bytes, correlation_id={}",
				message_size, self.config.max_message_size, correlation_id
			);
			return Err(crate::error::BusError::MessageTooLarge {
				size: message_size,
				max_size: self.config.max_message_size,
			});
		}

		let start = std::time::Instant::now();

		// Route based on message type
		let result = match message.message_type {
			sy_ipc_protocol::MessageType::PitOperation
			| sy_ipc_protocol::MessageType::ExtensionCommand
			| sy_ipc_protocol::MessageType::ConductorDecision
			| sy_ipc_protocol::MessageType::DataAccess
			| sy_ipc_protocol::MessageType::XiRequest => {
				self.handle_request(message).await?
			},
			sy_ipc_protocol::MessageType::XiResponse => {
				self.handle_response(message).await?
			},
			sy_ipc_protocol::MessageType::XiNotification
			| sy_ipc_protocol::MessageType::HealthCheck
			| sy_ipc_protocol::MessageType::ErrorReport => {
				self.handle_notification(&message)?
			},
			sy_ipc_protocol::MessageType::SystemEvent | sy_ipc_protocol::MessageType::XiEvent => {
				self.handle_event(message).await?
			},
		};

		let routing_time = start.elapsed();
		if routing_time > self.config.routing_latency_threshold() {
			warn!(
				"Message routing exceeded target latency: {}μs (target: <{}μs), correlation_id={}",
				routing_time.as_micros(),
				self.config.routing_latency_threshold().as_micros(),
				correlation_id
			);
		} else {
			info!(
				"Message routed successfully: routing_time={}μs, correlation_id={}",
				routing_time.as_micros(),
				correlation_id
			);
		}

		Ok(result)
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

		info!("MessageBus shutdown completed successfully");

		Ok(())
	}

	/// Handle request messages
	async fn handle_request(&self, message: MessageEnvelope) -> BusResult<()> {
		// For now, we'll use the message type as a simple routing key
		// In a real implementation, this would extract routing information from metadata
		let routing_key = format!("{:?}", message.message_type).to_lowercase();

		// Find matching route
		let route = self
			.router
			.find_route(&routing_key)
			.ok_or_else(|| crate::error::BusError::NoRouteFound(routing_key.clone()))?;

		// Register correlation for response if needed
		// This is a simplified implementation
		let correlation_id = message.correlation_id.to_string();
		if let Some(reply_to) = message.metadata.target_component.as_ref() {
			let _ = self
				.correlation_manager
				.register_request(correlation_id.clone(), reply_to.clone())
				.await
				.context(&format!("Failed to register correlation for request: {}", correlation_id));
		}

		// TODO: Implement actual message delivery to endpoint
		// This is a stub implementation that simulates message delivery
		// Future implementation should:
		// 1. Look up endpoint connection details from registry
		// 2. Serialize message using appropriate protocol (MessagePack/Bincode)
		// 3. Send message via transport layer (Unix sockets/Named pipes)
		// 4. Handle delivery failures and retries
		// 5. Update endpoint health status based on delivery success
		duck!("Delivering request to endpoint: {} (STUB IMPLEMENTATION)", route.endpoint_id);

		Ok(())
	}

	/// Handle response messages
	async fn handle_response(&self, message: MessageEnvelope) -> BusResult<()> {
		let correlation_id = message.correlation_id.to_string();

		// Find original request endpoint
		let reply_to = self.correlation_manager.resolve_correlation(correlation_id.clone()).await?;

		// TODO: Implement actual response delivery to original requester
		// This is a stub implementation that simulates response delivery
		// Future implementation should:
		// 1. Look up original requester connection details
		// 2. Serialize response message using appropriate protocol
		// 3. Send response via transport layer
		// 4. Handle delivery failures and cleanup correlation
		// 5. Update metrics for request/response latency
		duck!("Delivering response to: {} (STUB IMPLEMENTATION)", reply_to);

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

		// TODO: Implement actual notification delivery to all matching endpoints
		// This is a stub implementation that simulates notification delivery
		// Future implementation should:
		// 1. Deliver to all matching endpoints in parallel
		// 2. Handle partial delivery failures gracefully
		// 3. Implement delivery guarantees (at-least-once, exactly-once)
		// 4. Update delivery metrics and endpoint health
		// 5. Support notification filtering and transformation
		for route in routes {
			duck!("Delivering notification to endpoint: {} (STUB IMPLEMENTATION)", route.endpoint_id);
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
