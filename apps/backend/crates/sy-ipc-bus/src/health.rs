//! Health monitoring for message bus endpoints
//!
//! This module provides real-time health monitoring of bus endpoints with failure detection
//! and circuit breaker functionality.

use chrono::{DateTime, Utc};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use sy_commons::debug::duck;
use tokio::sync::RwLock;

use crate::error::HealthResult;

/// Health status of an endpoint
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum HealthStatus {
	/// Endpoint is healthy and available
	Healthy,
	/// Endpoint is unhealthy but may recover
	Unhealthy,
	/// Endpoint is down and circuit breaker is open
	Down,
	/// Endpoint status is unknown (not yet checked)
	Unknown,
}

/// Health check result
#[derive(Debug, Clone)]
pub struct HealthCheck {
	/// Endpoint identifier
	pub endpoint_id: String,
	/// Health status
	pub status: HealthStatus,
	/// When the check was performed
	pub checked_at: DateTime<Utc>,
	/// Response time in milliseconds
	pub response_time_ms: Option<u64>,
	/// Error message if unhealthy
	pub error_message: Option<String>,
}

/// Endpoint health information
#[derive(Debug, Clone)]
struct EndpointHealth {
	/// Current health status
	status: HealthStatus,
	/// Last health check
	last_check: DateTime<Utc>,
	/// Consecutive failure count
	failure_count: u32,
	/// Circuit breaker state
	circuit_breaker_open: bool,
	/// When circuit breaker was opened
	circuit_breaker_opened_at: Option<DateTime<Utc>>,
	/// Response time history (last 10 checks)
	response_times: Vec<u64>,
}

/// Configuration for health monitoring
#[derive(Debug, Clone)]
pub struct HealthConfig {
	/// How often to perform health checks
	pub check_interval: Duration,
	/// Timeout for health check requests
	pub check_timeout: Duration,
	/// Number of consecutive failures before marking as down
	pub failure_threshold: u32,
	/// How long to keep circuit breaker open
	pub circuit_breaker_timeout: Duration,
	/// Maximum response time before considering slow
	pub slow_response_threshold_ms: u64,
}

impl Default for HealthConfig {
	fn default() -> Self {
		Self {
			check_interval: Duration::from_secs(5),
			check_timeout: Duration::from_secs(1),
			failure_threshold: 3,
			circuit_breaker_timeout: Duration::from_secs(30),
			slow_response_threshold_ms: 1000,
		}
	}
}

/// Health monitor for message bus endpoints
///
/// The `HealthMonitor` provides real-time health monitoring of endpoints with:
/// - Periodic health checks
/// - Circuit breaker functionality
/// - Failure detection and recovery
/// - Performance monitoring
///
/// # Performance Targets
///
/// - <100ms failure detection time
/// - Automatic recovery detection
/// - Circuit breaker prevents cascade failures
/// - Configurable health check intervals
///
/// # Examples
///
/// ```rust
/// use sy_ipc_bus::{HealthMonitor, HealthConfig};
/// use std::time::Duration;
///
/// #[tokio::main]
/// async fn main() -> Result<(), Box<dyn std::error::Error>> {
///     let config = HealthConfig {
///         check_interval: Duration::from_secs(5),
///         failure_threshold: 3,
///         ..Default::default()
///     };
///     
///     let monitor = HealthMonitor::new_with_config(config);
///     
///     // Register an endpoint for monitoring
///     monitor.register_endpoint("user-service").await?;
///     
///     // Check if endpoint is healthy
///     let is_healthy = monitor.is_healthy("user-service").await;
///     println!("User service healthy: {}", is_healthy);
///     
///     Ok(())
/// }
/// ```
pub struct HealthMonitor {
	/// Health information for each endpoint
	endpoints: RwLock<HashMap<String, EndpointHealth>>,
	/// Health monitoring configuration
	config: HealthConfig,
	/// Whether monitoring is running
	running: Arc<RwLock<bool>>,
}

impl HealthMonitor {
	/// Create a new health monitor with default configuration
	///
	/// # Arguments
	///
	/// * `check_interval` - How often to perform health checks
	///
	/// # Examples
	///
	/// ```rust
	/// use sy_ipc_bus::HealthMonitor;
	/// use std::time::Duration;
	///
	/// let monitor = HealthMonitor::new(Duration::from_secs(5));
	/// ```
	#[must_use]
	pub fn new(check_interval: Duration) -> Self {
		duck!("Creating HealthMonitor with check interval: {:?}", check_interval);

		let config = HealthConfig {
			check_interval,
			..Default::default()
		};

		Self::new_with_config(config)
	}

	/// Create a new health monitor with custom configuration
	///
	/// # Arguments
	///
	/// * `config` - Health monitoring configuration
	///
	/// # Examples
	///
	/// ```rust
	/// use sy_ipc_bus::{HealthMonitor, HealthConfig};
	/// use std::time::Duration;
	///
	/// let config = HealthConfig {
	///     check_interval: Duration::from_secs(10),
	///     failure_threshold: 5,
	///     ..Default::default()
	/// };
	///
	/// let monitor = HealthMonitor::new_with_config(config);
	/// ```
	#[must_use]
	pub fn new_with_config(config: HealthConfig) -> Self {
		duck!("Creating HealthMonitor with config: {:?}", config);

		Self {
			endpoints: RwLock::new(HashMap::new()),
			config,
			running: Arc::new(RwLock::new(false)),
		}
	}

	/// Register an endpoint for health monitoring
	///
	/// # Arguments
	///
	/// * `endpoint_id` - Unique identifier for the endpoint
	///
	/// # Errors
	///
	/// Returns `HealthError::InvalidConfiguration` if the endpoint ID is invalid.
	///
	/// # Examples
	///
	/// ```rust
	/// # use sy_ipc_bus::HealthMonitor;
	/// # use std::time::Duration;
	/// # #[tokio::main]
	/// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
	/// let monitor = HealthMonitor::new(Duration::from_secs(5));
	/// monitor.register_endpoint("user-service").await?;
	/// # Ok(())
	/// # }
	/// ```
	pub async fn register_endpoint(&self, endpoint_id: &str) -> HealthResult<()> {
		duck!("Registering endpoint for health monitoring: {}", endpoint_id);

		if endpoint_id.is_empty() {
			return Err(crate::error::HealthError::InvalidConfiguration(
				"Endpoint ID cannot be empty".to_string(),
			));
		}

		let endpoint_health = EndpointHealth {
			status: HealthStatus::Unknown,
			last_check: Utc::now(),
			failure_count: 0,
			circuit_breaker_open: false,
			circuit_breaker_opened_at: None,
			response_times: Vec::new(),
		};

		self.endpoints.write().await.insert(endpoint_id.to_string(), endpoint_health);

		Ok(())
	}

	/// Unregister an endpoint from health monitoring
	///
	/// # Arguments
	///
	/// * `endpoint_id` - Unique identifier for the endpoint
	///
	/// # Errors
	///
	/// Returns `HealthError::EndpointNotRegistered` if the endpoint is not registered.
	///
	/// # Examples
	///
	/// ```rust
	/// # use sy_ipc_bus::HealthMonitor;
	/// # use std::time::Duration;
	/// # #[tokio::main]
	/// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
	/// let monitor = HealthMonitor::new(Duration::from_secs(5));
	/// monitor.register_endpoint("user-service").await?;
	/// monitor.unregister_endpoint("user-service").await?;
	/// # Ok(())
	/// # }
	/// ```
	pub async fn unregister_endpoint(&self, endpoint_id: &str) -> HealthResult<()> {
		duck!("Unregistering endpoint from health monitoring: {}", endpoint_id);

		let mut endpoints = self.endpoints.write().await;

		match endpoints.remove(endpoint_id) {
			Some(_) => Ok(()),
			None => Err(crate::error::HealthError::EndpointNotRegistered(endpoint_id.to_string())),
		}
	}

	/// Check if an endpoint is healthy
	///
	/// # Arguments
	///
	/// * `endpoint_id` - Unique identifier for the endpoint
	///
	/// # Returns
	///
	/// `true` if the endpoint is healthy, `false` otherwise.
	///
	/// # Examples
	///
	/// ```rust
	/// # use sy_ipc_bus::HealthMonitor;
	/// # use std::time::Duration;
	/// # #[tokio::main]
	/// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
	/// let monitor = HealthMonitor::new(Duration::from_secs(5));
	/// monitor.register_endpoint("user-service").await?;
	///
	/// let is_healthy = monitor.is_healthy("user-service").await;
	/// println!("User service healthy: {}", is_healthy);
	/// # Ok(())
	/// # }
	/// ```
	pub async fn is_healthy(&self, endpoint_id: &str) -> bool {
		duck!("Checking if endpoint is healthy: {}", endpoint_id);

		let endpoints = self.endpoints.read().await;

		match endpoints.get(endpoint_id) {
			Some(health) => {
				// Check if circuit breaker should be closed
				if health.circuit_breaker_open {
					if let Some(opened_at) = health.circuit_breaker_opened_at {
						let now = Utc::now();
						let elapsed = now.signed_duration_since(opened_at);

						if elapsed.to_std().unwrap_or(Duration::ZERO)
							>= self.config.circuit_breaker_timeout
						{
							// Circuit breaker timeout expired, consider healthy for retry
							return true;
						}
					}
					return false;
				}

				matches!(health.status, HealthStatus::Healthy)
			},
			None => false, // Unregistered endpoints are not healthy
		}
	}

	/// Perform a health check on an endpoint
	///
	/// # Arguments
	///
	/// * `endpoint_id` - Unique identifier for the endpoint
	///
	/// # Returns
	///
	/// A `HealthCheck` result with status and timing information.
	///
	/// # Errors
	///
	/// Returns `HealthError::EndpointNotRegistered` if the endpoint is not registered.
	/// Returns `HealthError::HealthCheckFailed` if the health check fails.
	///
	/// # Examples
	///
	/// ```rust
	/// # use sy_ipc_bus::HealthMonitor;
	/// # use std::time::Duration;
	/// # #[tokio::main]
	/// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
	/// let monitor = HealthMonitor::new(Duration::from_secs(5));
	/// monitor.register_endpoint("user-service").await?;
	///
	/// let health_check = monitor.perform_health_check("user-service").await?;
	/// println!("Health status: {:?}", health_check.status);
	/// # Ok(())
	/// # }
	/// ```
	pub async fn perform_health_check(&self, endpoint_id: &str) -> HealthResult<HealthCheck> {
		duck!("Performing health check on endpoint: {}", endpoint_id);

		let start = std::time::Instant::now();
		let now = Utc::now();

		// TODO: Implement actual health check against endpoint
		// This is a stub implementation that assumes endpoints are healthy
		// Future implementation should:
		// 1. Send health check request to endpoint via transport layer
		// 2. Wait for response within configured timeout
		// 3. Parse health status from response
		// 4. Handle network failures and timeouts appropriately
		// 5. Update circuit breaker state based on consecutive failures
		// 6. Track response time metrics for performance monitoring
		let response_time = u64::try_from(start.elapsed().as_millis()).unwrap_or(0);

		let health_check = HealthCheck {
			endpoint_id: endpoint_id.to_string(),
			status: HealthStatus::Healthy,
			checked_at: now,
			response_time_ms: Some(response_time),
			error_message: None,
		};

		// Update endpoint health
		{
			let mut endpoints = self.endpoints.write().await;
			if let Some(endpoint_health) = endpoints.get_mut(endpoint_id) {
				endpoint_health.status = health_check.status.clone();
				endpoint_health.last_check = now;
				endpoint_health.failure_count = 0; // Reset on successful check
				endpoint_health.circuit_breaker_open = false;
				endpoint_health.circuit_breaker_opened_at = None;

				// Update response times (keep last 10)
				endpoint_health.response_times.push(response_time);
				if endpoint_health.response_times.len() > 10 {
					endpoint_health.response_times.remove(0);
				}
			} else {
				return Err(crate::error::HealthError::EndpointNotRegistered(
					endpoint_id.to_string(),
				));
			}
		}

		Ok(health_check)
	}

	/// Get the current health status of an endpoint
	///
	/// # Arguments
	///
	/// * `endpoint_id` - Unique identifier for the endpoint
	///
	/// # Returns
	///
	/// A `HealthCheck` with the current status information.
	///
	/// # Errors
	///
	/// Returns `HealthError::EndpointNotRegistered` if the endpoint is not registered.
	///
	/// # Examples
	///
	/// ```rust
	/// # use sy_ipc_bus::HealthMonitor;
	/// # use std::time::Duration;
	/// # #[tokio::main]
	/// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
	/// let monitor = HealthMonitor::new(Duration::from_secs(5));
	/// monitor.register_endpoint("user-service").await?;
	///
	/// let health = monitor.get_endpoint_health("user-service").await?;
	/// println!("Current health: {:?}", health.status);
	/// # Ok(())
	/// # }
	/// ```
	pub async fn get_endpoint_health(&self, endpoint_id: &str) -> HealthResult<HealthCheck> {
		duck!("Getting endpoint health: {}", endpoint_id);

		let endpoints = self.endpoints.read().await;

		endpoints.get(endpoint_id).map_or_else(
			|| Err(crate::error::HealthError::EndpointNotRegistered(endpoint_id.to_string())),
			|health| {
				let avg_response_time = if health.response_times.is_empty() {
					None
				} else {
					Some(
						health.response_times.iter().sum::<u64>()
							/ health.response_times.len() as u64,
					)
				};

				Ok(HealthCheck {
					endpoint_id: endpoint_id.to_string(),
					status: health.status.clone(),
					checked_at: health.last_check,
					response_time_ms: avg_response_time,
					error_message: if health.circuit_breaker_open {
						Some("Circuit breaker open".to_string())
					} else {
						None
					},
				})
			},
		)
	}

	/// Get health status for all registered endpoints
	///
	/// # Returns
	///
	/// A vector of `HealthCheck` results for all registered endpoints.
	///
	/// # Examples
	///
	/// ```rust
	/// # use sy_ipc_bus::HealthMonitor;
	/// # use std::time::Duration;
	/// # #[tokio::main]
	/// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
	/// let monitor = HealthMonitor::new(Duration::from_secs(5));
	/// monitor.register_endpoint("user-service").await?;
	/// monitor.register_endpoint("auth-service").await?;
	///
	/// let all_health = monitor.get_all_endpoint_health().await?;
	/// println!("Monitoring {} endpoints", all_health.len());
	/// # Ok(())
	/// # }
	/// ```
	pub async fn get_all_endpoint_health(&self) -> HealthResult<Vec<HealthCheck>> {
		duck!("Getting health for all endpoints");

		let mut health_checks = Vec::new();

		for (endpoint_id, health) in self.endpoints.read().await.iter() {
			let avg_response_time = if health.response_times.is_empty() {
				None
			} else {
				Some(health.response_times.iter().sum::<u64>() / health.response_times.len() as u64)
			};

			health_checks.push(HealthCheck {
				endpoint_id: endpoint_id.clone(),
				status: health.status.clone(),
				checked_at: health.last_check,
				response_time_ms: avg_response_time,
				error_message: if health.circuit_breaker_open {
					Some("Circuit breaker open".to_string())
				} else {
					None
				},
			});
		}

		Ok(health_checks)
	}

	/// Start the health monitoring background task
	///
	/// # Errors
	///
	/// Returns `HealthError::MonitorNotRunning` if monitoring fails to start.
	///
	/// # Examples
	///
	/// ```rust
	/// # use sy_ipc_bus::HealthMonitor;
	/// # use std::time::Duration;
	/// # #[tokio::main]
	/// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
	/// let monitor = HealthMonitor::new(Duration::from_secs(5));
	/// monitor.start_monitoring().await?;
	/// # Ok(())
	/// # }
	/// ```
	pub async fn start_monitoring(&self) -> HealthResult<()> {
		duck!("Starting health monitoring");

		let mut running = self.running.write().await;
		if *running {
			return Ok(()); // Already running
		}

		*running = true;
		drop(running);

		// TODO: Implement background monitoring task
		// This is a stub implementation that marks monitoring as started
		// Future implementation should:
		// 1. Spawn a background tokio task that runs continuously
		// 2. Periodically check all registered endpoints using perform_health_check
		// 3. Update endpoint health status based on check results
		// 4. Implement circuit breaker logic for failing endpoints
		// 5. Provide metrics and alerting for health status changes
		// 6. Handle graceful shutdown when stop_monitoring is called

		Ok(())
	}

	/// Stop the health monitoring background task
	///
	/// # Examples
	///
	/// ```rust
	/// # use sy_ipc_bus::HealthMonitor;
	/// # use std::time::Duration;
	/// # #[tokio::main]
	/// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
	/// let monitor = HealthMonitor::new(Duration::from_secs(5));
	/// monitor.start_monitoring().await?;
	/// monitor.stop_monitoring().await?;
	/// # Ok(())
	/// # }
	/// ```
	pub async fn stop_monitoring(&self) -> HealthResult<()> {
		duck!("Stopping health monitoring");

		*self.running.write().await = false;

		Ok(())
	}

	/// Cleanup health monitor resources
	///
	/// # Examples
	///
	/// ```rust
	/// # use sy_ipc_bus::HealthMonitor;
	/// # use std::time::Duration;
	/// # #[tokio::main]
	/// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
	/// let monitor = HealthMonitor::new(Duration::from_secs(5));
	/// monitor.cleanup().await?;
	/// # Ok(())
	/// # }
	/// ```
	pub async fn cleanup(&self) -> HealthResult<()> {
		duck!("Cleaning up health monitor");

		// Stop monitoring
		self.stop_monitoring().await?;

		// Clear all endpoints
		self.endpoints.write().await.clear();

		Ok(())
	}
}
