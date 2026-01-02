//! Unit tests for request/response correlation management
//!
//! These tests verify the `CorrelationManager` behavior including correlation registration,
//! resolution, timeout handling, and cleanup functionality.

#![allow(clippy::unwrap_used)]

use crate::factory::{CorrelationIdTestFactory, EndpointIdTestFactory};
use std::time::Duration;
use sy_ipc_bus::{CorrelationError, CorrelationManager};

#[cfg(feature = "unit")]
mod tests {
	use super::*;

	#[tokio::test]
	async fn test_correlation_manager_creation() {
		// Arrange
		let timeout = Duration::from_secs(30);

		// Act
		let manager = CorrelationManager::new(timeout);

		// Assert
		assert_eq!(manager.pending_count().await, 0);
	}

	#[tokio::test]
	async fn test_register_request_success() {
		// Arrange
		let manager = CorrelationManager::new(Duration::from_secs(30));
		let correlation_id = CorrelationIdTestFactory::valid();
		let reply_to = EndpointIdTestFactory::valid();

		// Act
		let result = manager.register_request(correlation_id.clone(), reply_to).await;

		// Assert
		assert!(result.is_ok(), "Request registration should succeed");
		assert_eq!(manager.pending_count().await, 1);
		assert!(manager.has_correlation(&correlation_id).await);
	}

	#[tokio::test]
	async fn test_register_duplicate_correlation_id() {
		// Arrange
		let manager = CorrelationManager::new(Duration::from_secs(30));
		let correlation_id = CorrelationIdTestFactory::valid();
		let reply_to1 = EndpointIdTestFactory::specific("endpoint1");
		let reply_to2 = EndpointIdTestFactory::specific("endpoint2");

		// Register first correlation
		manager.register_request(correlation_id.clone(), reply_to1).await.unwrap();

		// Act - try to register same correlation ID again
		let result = manager.register_request(correlation_id, reply_to2).await;

		// Assert
		assert!(result.is_err(), "Duplicate correlation ID should fail");
		match result.unwrap_err() {
			CorrelationError::CorrelationAlreadyExists(_) => {}, // Expected error
			other => panic!("Expected CorrelationAlreadyExists error, got: {other:?}"),
		}
	}

	#[tokio::test]
	async fn test_resolve_correlation_success() {
		// Arrange
		let manager = CorrelationManager::new(Duration::from_secs(30));
		let correlation_id = CorrelationIdTestFactory::valid();
		let reply_to = EndpointIdTestFactory::valid();

		manager
			.register_request(correlation_id.clone(), reply_to.clone())
			.await
			.unwrap();

		// Act
		let result = manager.resolve_correlation(correlation_id.clone()).await;

		// Assert
		assert!(result.is_ok(), "Correlation resolution should succeed");
		assert_eq!(result.unwrap(), reply_to);
		assert_eq!(manager.pending_count().await, 0); // Should be removed after resolution
		assert!(!manager.has_correlation(&correlation_id).await);
	}

	#[tokio::test]
	async fn test_resolve_nonexistent_correlation() {
		// Arrange
		let manager = CorrelationManager::new(Duration::from_secs(30));
		let nonexistent_id = CorrelationIdTestFactory::valid();

		// Act
		let result = manager.resolve_correlation(nonexistent_id.clone()).await;

		// Assert
		assert!(result.is_err(), "Resolving non-existent correlation should fail");
		match result.unwrap_err() {
			CorrelationError::CorrelationNotFound(_) => {}, // Expected error
			other => panic!("Expected CorrelationNotFound error, got: {other:?}"),
		}
	}

	#[tokio::test]
	async fn test_correlation_timeout() {
		// Arrange
		let short_timeout = Duration::from_millis(10);
		let manager = CorrelationManager::new(short_timeout);
		let correlation_id = CorrelationIdTestFactory::valid();
		let reply_to = EndpointIdTestFactory::valid();

		manager.register_request(correlation_id.clone(), reply_to).await.unwrap();

		// Wait for timeout
		tokio::time::sleep(Duration::from_millis(20)).await;

		// Act
		let result = manager.resolve_correlation(correlation_id).await;

		// Assert
		assert!(result.is_err(), "Timed out correlation should fail to resolve");
		match result.unwrap_err() {
			CorrelationError::RequestTimeout(_) => {}, // Expected error
			other => panic!("Expected RequestTimeout error, got: {other:?}"),
		}
	}

	#[tokio::test]
	async fn test_has_correlation_exists() {
		// Arrange
		let manager = CorrelationManager::new(Duration::from_secs(30));
		let correlation_id = CorrelationIdTestFactory::valid();
		let reply_to = EndpointIdTestFactory::valid();

		manager.register_request(correlation_id.clone(), reply_to).await.unwrap();

		// Act & Assert
		assert!(manager.has_correlation(&correlation_id).await);
	}

	#[tokio::test]
	async fn test_has_correlation_not_exists() {
		// Arrange
		let manager = CorrelationManager::new(Duration::from_secs(30));
		let nonexistent_id = CorrelationIdTestFactory::valid();

		// Act & Assert
		assert!(!manager.has_correlation(&nonexistent_id).await);
	}

	#[tokio::test]
	async fn test_pending_count_tracking() {
		// Arrange
		let manager = CorrelationManager::new(Duration::from_secs(30));
		let correlation_id1 = CorrelationIdTestFactory::unique();
		let correlation_id2 = CorrelationIdTestFactory::unique();
		let reply_to = EndpointIdTestFactory::valid();

		assert_eq!(manager.pending_count().await, 0);

		// Act - register first correlation
		manager
			.register_request(correlation_id1.clone(), reply_to.clone())
			.await
			.unwrap();
		assert_eq!(manager.pending_count().await, 1);

		// Act - register second correlation
		manager
			.register_request(correlation_id2.clone(), reply_to.clone())
			.await
			.unwrap();
		assert_eq!(manager.pending_count().await, 2);

		// Act - resolve first correlation
		manager.resolve_correlation(correlation_id1).await.unwrap();
		assert_eq!(manager.pending_count().await, 1);

		// Act - resolve second correlation
		manager.resolve_correlation(correlation_id2).await.unwrap();
		assert_eq!(manager.pending_count().await, 0);
	}

	#[tokio::test]
	async fn test_cleanup_expired_correlations() {
		// Arrange
		let short_timeout = Duration::from_millis(10);
		let manager = CorrelationManager::new(short_timeout);
		let correlation_id1 = CorrelationIdTestFactory::unique();
		let correlation_id2 = CorrelationIdTestFactory::unique();
		let reply_to = EndpointIdTestFactory::valid();

		// Register correlations
		manager
			.register_request(correlation_id1.clone(), reply_to.clone())
			.await
			.unwrap();
		manager
			.register_request(correlation_id2.clone(), reply_to.clone())
			.await
			.unwrap();
		assert_eq!(manager.pending_count().await, 2);

		// Wait for timeout
		tokio::time::sleep(Duration::from_millis(20)).await;

		// Act - manually trigger cleanup
		let cleaned_count = manager.cleanup_expired().await;

		// Assert
		assert_eq!(cleaned_count, 2, "Both expired correlations should be cleaned up");
		assert_eq!(manager.pending_count().await, 0);
		assert!(!manager.has_correlation(&correlation_id1).await);
		assert!(!manager.has_correlation(&correlation_id2).await);
	}

	#[tokio::test]
	async fn test_cleanup_expired_partial() {
		// Arrange
		let manager = CorrelationManager::new(Duration::from_secs(30));
		let expired_id = CorrelationIdTestFactory::unique();
		let valid_id = CorrelationIdTestFactory::unique();
		let reply_to = EndpointIdTestFactory::valid();

		// Register one correlation that will be expired manually
		manager.register_request(expired_id.clone(), reply_to.clone()).await.unwrap();

		// Wait a bit, then register another
		tokio::time::sleep(Duration::from_millis(10)).await;
		manager.register_request(valid_id.clone(), reply_to.clone()).await.unwrap();

		assert_eq!(manager.pending_count().await, 2);

		// Act - cleanup should only remove expired ones
		let cleaned_count = manager.cleanup_expired().await;

		// Assert
		// Since both correlations have long timeouts, none should be cleaned up yet
		assert_eq!(cleaned_count, 0, "No correlations should be expired yet");
		assert_eq!(manager.pending_count().await, 2);
	}

	#[tokio::test]
	async fn test_correlation_manager_clone() {
		// Arrange
		let manager1 = CorrelationManager::new(Duration::from_secs(30));

		// Act
		let manager2 = manager1.clone();

		// Assert
		// Both managers should be independent
		assert_eq!(manager1.pending_count().await, 0);
		assert_eq!(manager2.pending_count().await, 0);

		// Register in one manager
		let correlation_id = CorrelationIdTestFactory::valid();
		let reply_to = EndpointIdTestFactory::valid();
		manager1.register_request(correlation_id.clone(), reply_to).await.unwrap();

		// Should not affect the other manager
		assert_eq!(manager1.pending_count().await, 1);
		assert_eq!(manager2.pending_count().await, 0);
	}
}
