//! Request/response correlation management
//!
//! This module provides reliable correlation of requests with responses using correlation IDs,
//! with timeout handling and automatic cleanup.

use chrono::{DateTime, Utc};
use std::collections::HashMap;
use std::time::Duration;
use sy_commons::debug::duck;
use tokio::sync::RwLock;

use crate::error::CorrelationResult;

/// Correlation ID type
pub type CorrelationId = String;

/// Pending request information
#[derive(Debug, Clone)]
struct PendingRequest {
	/// Where to send the response
	reply_to: String,
	/// When the request was created
	created_at: DateTime<Utc>,
	/// When the request times out
	timeout_at: DateTime<Utc>,
}

/// Request/response correlation manager
///
/// The `CorrelationManager` provides reliable correlation of requests with responses using
/// correlation IDs. It handles timeout cleanup and prevents memory leaks from orphaned correlations.
///
/// # Features
///
/// - Automatic timeout handling
/// - Background cleanup of expired correlations
/// - Thread-safe correlation storage
/// - Configurable timeout duration
///
/// # Examples
///
/// ```rust
/// use sy_ipc_bus::CorrelationManager;
/// use std::time::Duration;
///
/// #[tokio::main]
/// async fn main() -> Result<(), Box<dyn std::error::Error>> {
///     let manager = CorrelationManager::new(Duration::from_secs(30));
///     
///     // Register a request
///     manager.register_request("corr-123".to_string(), "reply-endpoint".to_string()).await?;
///     
///     // Later, resolve the correlation
///     let reply_to = manager.resolve_correlation("corr-123".to_string()).await?;
///     println!("Reply to: {}", reply_to);
///     
///     Ok(())
/// }
/// ```
pub struct CorrelationManager {
	/// Pending requests by correlation ID
	pending_requests: RwLock<HashMap<CorrelationId, PendingRequest>>,
	/// Timeout duration for requests
	timeout_duration: Duration,
	/// Cleanup interval for expired correlations
	cleanup_interval: Duration,
}

impl CorrelationManager {
	/// Create a new correlation manager
	///
	/// # Arguments
	///
	/// * `timeout_duration` - How long to keep correlations before timing out
	///
	/// # Examples
	///
	/// ```rust
	/// use sy_ipc_bus::CorrelationManager;
	/// use std::time::Duration;
	///
	/// #[tokio::main]
	/// async fn main() {
	///     let manager = CorrelationManager::new(Duration::from_secs(30));
	/// }
	/// ```
	#[must_use]
	pub fn new(timeout_duration: Duration) -> Self {
		Self::new_with_cleanup_interval(timeout_duration, Duration::from_secs(30))
	}

	/// Create a new correlation manager with custom cleanup interval
	///
	/// # Arguments
	///
	/// * `timeout_duration` - How long to keep correlations before timing out
	/// * `cleanup_interval` - How often to run cleanup of expired correlations
	///
	/// # Examples
	///
	/// ```rust
	/// use sy_ipc_bus::CorrelationManager;
	/// use std::time::Duration;
	///
	/// #[tokio::main]
	/// async fn main() {
	///     let manager = CorrelationManager::new_with_cleanup_interval(
	///         Duration::from_secs(30),
	///         Duration::from_secs(10)
	///     );
	/// }
	/// ```
	#[must_use]
	pub fn new_with_cleanup_interval(timeout_duration: Duration, cleanup_interval: Duration) -> Self {
		duck!("Creating CorrelationManager with timeout: {:?}, cleanup_interval: {:?}", 
			timeout_duration, cleanup_interval);

		let manager = Self {
			pending_requests: RwLock::new(HashMap::new()),
			timeout_duration,
			cleanup_interval,
		};

		// Start cleanup task
		let manager_clone = manager.clone();
		tokio::spawn(async move {
			manager_clone.cleanup_expired_correlations().await;
		});

		manager
	}

	/// Register a request for correlation
	///
	/// # Arguments
	///
	/// * `correlation_id` - Unique correlation identifier
	/// * `reply_to` - Where to send the response
	///
	/// # Errors
	///
	/// Returns `CorrelationError::CorrelationAlreadyExists` if the correlation ID is already in use.
	///
	/// # Examples
	///
	/// ```rust
	/// # use sy_ipc_bus::CorrelationManager;
	/// # use std::time::Duration;
	/// # #[tokio::main]
	/// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
	/// let manager = CorrelationManager::new(Duration::from_secs(30));
	/// manager.register_request("corr-123".to_string(), "reply-endpoint".to_string()).await?;
	/// # Ok(())
	/// # }
	/// ```
	pub async fn register_request(
		&self,
		correlation_id: CorrelationId,
		reply_to: String,
	) -> CorrelationResult<()> {
		duck!("Registering request: correlation_id={}, reply_to={}", correlation_id, reply_to);

		let now = Utc::now();
		let timeout_at = now
			+ chrono::Duration::from_std(self.timeout_duration)
				.map_err(|e| crate::error::CorrelationError::CleanupFailed(e.to_string()))?;

		let pending_request = PendingRequest {
			reply_to,
			created_at: now,
			timeout_at,
		};

		duck!(
			"Request created at: {}, timeout at: {}",
			pending_request.created_at,
			pending_request.timeout_at
		);

		let mut pending = self.pending_requests.write().await;

		// Check if correlation already exists
		if pending.contains_key(&correlation_id) {
			return Err(crate::error::CorrelationError::CorrelationAlreadyExists(
				uuid::Uuid::parse_str(&correlation_id).unwrap_or_default(),
			));
		}

		pending.insert(correlation_id, pending_request);
		drop(pending);
		Ok(())
	}

	/// Resolve a correlation and get the reply-to endpoint
	///
	/// This removes the correlation from the pending list and returns where to send the response.
	///
	/// # Arguments
	///
	/// * `correlation_id` - The correlation identifier to resolve
	///
	/// # Returns
	///
	/// The reply-to endpoint for the correlation.
	///
	/// # Errors
	///
	/// Returns `CorrelationError::CorrelationNotFound` if the correlation doesn't exist.
	/// Returns `CorrelationError::RequestTimeout` if the correlation has timed out.
	///
	/// # Examples
	///
	/// ```rust
	/// # use sy_ipc_bus::CorrelationManager;
	/// # use std::time::Duration;
	/// # #[tokio::main]
	/// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
	/// let manager = CorrelationManager::new(Duration::from_secs(30));
	/// manager.register_request("corr-123".to_string(), "reply-endpoint".to_string()).await?;
	///
	/// let reply_to = manager.resolve_correlation("corr-123".to_string()).await?;
	/// assert_eq!(reply_to, "reply-endpoint");
	/// # Ok(())
	/// # }
	/// ```
	pub async fn resolve_correlation(
		&self,
		correlation_id: CorrelationId,
	) -> CorrelationResult<String> {
		duck!("Resolving correlation: correlation_id={}", correlation_id);

		let mut pending = self.pending_requests.write().await;

		match pending.remove(&correlation_id) {
			Some(request) => {
				let now = Utc::now();

				// Check if request has timed out
				if now > request.timeout_at {
					return Err(crate::error::CorrelationError::RequestTimeout(
						uuid::Uuid::parse_str(&correlation_id).unwrap_or_default(),
					));
				}

				Ok(request.reply_to)
			},
			None => Err(crate::error::CorrelationError::CorrelationNotFound(
				uuid::Uuid::parse_str(&correlation_id).unwrap_or_default(),
			)),
		}
	}

	/// Check if a correlation exists
	///
	/// # Arguments
	///
	/// * `correlation_id` - The correlation identifier to check
	///
	/// # Returns
	///
	/// `true` if the correlation exists and hasn't timed out, `false` otherwise.
	///
	/// # Examples
	///
	/// ```rust
	/// # use sy_ipc_bus::CorrelationManager;
	/// # use std::time::Duration;
	/// # #[tokio::main]
	/// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
	/// let manager = CorrelationManager::new(Duration::from_secs(30));
	/// manager.register_request("corr-123".to_string(), "reply-endpoint".to_string()).await?;
	///
	/// assert!(manager.has_correlation("corr-123").await);
	/// assert!(!manager.has_correlation("nonexistent").await);
	/// # Ok(())
	/// # }
	/// ```
	pub async fn has_correlation(&self, correlation_id: &str) -> bool {
		duck!("Checking correlation exists: correlation_id={}", correlation_id);

		let pending = self.pending_requests.read().await;

		pending.get(correlation_id).is_some_and(|request| {
			let now = Utc::now();
			// Return false if timed out
			now <= request.timeout_at
		})
	}

	/// Get the number of pending correlations
	///
	/// # Returns
	///
	/// The number of currently pending correlations.
	///
	/// # Examples
	///
	/// ```rust
	/// # use sy_ipc_bus::CorrelationManager;
	/// # use std::time::Duration;
	/// # #[tokio::main]
	/// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
	/// let manager = CorrelationManager::new(Duration::from_secs(30));
	/// assert_eq!(manager.pending_count().await, 0);
	///
	/// manager.register_request("corr-123".to_string(), "reply-endpoint".to_string()).await?;
	/// assert_eq!(manager.pending_count().await, 1);
	/// # Ok(())
	/// # }
	/// ```
	pub async fn pending_count(&self) -> usize {
		self.pending_requests.read().await.len()
	}

	/// Cleanup expired correlations
	///
	/// This is called automatically by a background task, but can be called manually if needed.
	///
	/// # Returns
	///
	/// The number of correlations that were cleaned up.
	///
	/// # Examples
	///
	/// ```rust
	/// use sy_ipc_bus::CorrelationManager;
	/// use std::time::Duration;
	///
	/// #[tokio::main]
	/// async fn main() {
	///     let manager = CorrelationManager::new(Duration::from_millis(1));
	///     
	///     // Register a request that will timeout quickly
	///     let _ = manager.register_request("corr-123".to_string(), "reply-endpoint".to_string()).await;
	///     
	///     // Wait for timeout
	///     tokio::time::sleep(Duration::from_millis(10)).await;
	///     
	///     // Cleanup expired correlations
	///     let cleaned = manager.cleanup_expired().await;
	///     println!("Cleaned up {} expired correlations", cleaned);
	/// }
	/// ```
	pub async fn cleanup_expired(&self) -> usize {
		duck!("Cleaning up expired correlations");

		let now = Utc::now();
		let mut pending = self.pending_requests.write().await;
		let initial_count = pending.len();

		// Remove expired correlations
		pending.retain(|correlation_id, request| {
			let is_expired = now > request.timeout_at;
			if is_expired {
				duck!("Removing expired correlation: {}", correlation_id);
			}
			!is_expired
		});

		let final_count = pending.len();
		drop(pending);
		initial_count - final_count
	}

	/// Background task for automatic cleanup of expired correlations
	async fn cleanup_expired_correlations(&self) {
		let mut interval = tokio::time::interval(self.cleanup_interval);

		loop {
			interval.tick().await;
			let cleaned = self.cleanup_expired().await;
			if cleaned > 0 {
				duck!("Cleaned up {} expired correlations", cleaned);
			}
		}
	}
}

impl Clone for CorrelationManager {
	fn clone(&self) -> Self {
		Self {
			pending_requests: RwLock::new(HashMap::new()),
			timeout_duration: self.timeout_duration,
			cleanup_interval: self.cleanup_interval,
		}
	}
}
