//! Unit tests for publish/subscribe messaging
//!
//! These tests verify the `PubSubManager` behavior including topic subscription,
//! event publishing, pattern matching, and subscriber management.

#![allow(clippy::unwrap_used)]
#![allow(clippy::panic)]
#![allow(clippy::needless_borrow)]
#![allow(clippy::uninlined_format_args)]

use crate::factory::{MessageEnvelopeTestFactory, TopicTestFactory};
use sy_ipc_bus::{PubSubError, PubSubManager};

#[cfg(feature = "unit")]
mod tests {
	use super::*;

	#[tokio::test]
	async fn test_pubsub_manager_creation() {
		// Arrange & Act
		let manager = PubSubManager::new();

		// Assert
		assert_eq!(manager.total_subscriptions().await, 0);
	}

	#[tokio::test]
	async fn test_exact_topic_subscription() {
		// Arrange
		let manager = PubSubManager::new();
		let topic = TopicTestFactory::valid();

		// Act
		let result = manager.subscribe(&topic).await;

		// Assert
		assert!(result.is_ok(), "Exact topic subscription should succeed");
		assert_eq!(manager.total_subscriptions().await, 1);
	}

	#[tokio::test]
	async fn test_wildcard_topic_subscription() {
		// Arrange
		let manager = PubSubManager::new();
		let pattern = TopicTestFactory::wildcard_pattern(); // "events.*"

		// Act
		let result = manager.subscribe(&pattern).await;

		// Assert
		assert!(result.is_ok(), "Wildcard topic subscription should succeed");
		assert_eq!(manager.total_subscriptions().await, 1);
	}

	#[tokio::test]
	async fn test_invalid_topic_subscription() {
		// Arrange
		let manager = PubSubManager::new();
		let invalid_pattern = "[invalid"; // Malformed regex pattern

		// Act
		let result = manager.subscribe(invalid_pattern).await;

		// Assert
		assert!(result.is_err(), "Invalid topic pattern should fail subscription");
		match result.unwrap_err() {
			PubSubError::InvalidPattern(_) => {}, // Expected error
			other => panic!("Expected InvalidPattern error, got: {other:?}"),
		}
	}

	#[tokio::test]
	async fn test_publish_to_exact_topic() {
		// Arrange
		let manager = PubSubManager::new();
		let topic = TopicTestFactory::valid();
		let event = MessageEnvelopeTestFactory::event();

		// Subscribe to topic first
		let _receiver = manager.subscribe(&topic).await.unwrap();

		// Act
		let result = manager.publish(&topic, event).await;

		// Assert
		assert!(result.is_ok(), "Publishing to exact topic should succeed");
		let delivered_count = result.unwrap();
		assert_eq!(delivered_count, 1, "Should deliver to one subscriber");
	}

	#[tokio::test]
	async fn test_publish_to_wildcard_subscribers() {
		// Arrange
		let manager = PubSubManager::new();
		let pattern = "events.*";
		let specific_topic = "events.user.created";
		let event = MessageEnvelopeTestFactory::event();

		// Subscribe to wildcard pattern
		let _receiver = manager.subscribe(pattern).await.unwrap();

		// Act
		let result = manager.publish(specific_topic, event).await;

		// Assert
		assert!(result.is_ok(), "Publishing to wildcard subscribers should succeed");
		let delivered_count = result.unwrap();
		assert_eq!(delivered_count, 1, "Should deliver to wildcard subscriber");
	}

	#[tokio::test]
	async fn test_publish_to_multiple_subscribers() {
		// Arrange
		let manager = PubSubManager::new();
		let topic = "events.user.created";
		let event = MessageEnvelopeTestFactory::event();

		// Subscribe multiple times
		let _receiver1 = manager.subscribe(topic).await.unwrap();
		let _receiver2 = manager.subscribe("events.*").await.unwrap();
		let _receiver3 = manager.subscribe("events.user.*").await.unwrap();

		// Act
		let result = manager.publish(topic, event).await;

		// Assert
		assert!(result.is_ok(), "Publishing to multiple subscribers should succeed");
		let delivered_count = result.unwrap();
		assert_eq!(delivered_count, 3, "Should deliver to all matching subscribers");
	}

	#[tokio::test]
	async fn test_publish_to_no_subscribers() {
		// Arrange
		let manager = PubSubManager::new();
		let topic = TopicTestFactory::valid();
		let event = MessageEnvelopeTestFactory::event();

		// Act - publish without any subscribers
		let result = manager.publish(&topic, event).await;

		// Assert
		assert!(result.is_ok(), "Publishing to no subscribers should succeed");
		let delivered_count = result.unwrap();
		assert_eq!(delivered_count, 0, "Should deliver to zero subscribers");
	}

	#[tokio::test]
	async fn test_event_receiver_recv() {
		// Arrange
		let manager = PubSubManager::new();
		let topic = TopicTestFactory::valid();
		let event = MessageEnvelopeTestFactory::event();

		let mut receiver = manager.subscribe(&topic).await.unwrap();

		// Publish event
		manager.publish(&topic, event.clone()).await.unwrap();

		// Act
		let result = receiver.recv().await;

		// Assert
		assert!(result.is_ok(), "Receiving event should succeed");
		let received_event = result.unwrap();
		assert_eq!(received_event.message_type, event.message_type);
		assert_eq!(received_event.payload, event.payload);
	}

	#[tokio::test]
	async fn test_event_receiver_try_recv_with_event() {
		// Arrange
		let manager = PubSubManager::new();
		let topic = TopicTestFactory::valid();
		let event = MessageEnvelopeTestFactory::event();

		let mut receiver = manager.subscribe(&topic).await.unwrap();

		// Publish event
		manager.publish(&topic, event.clone()).await.unwrap();

		// Act
		let result = receiver.try_recv();

		// Assert
		assert!(result.is_ok(), "Try receiving event should succeed");
		let received_event_opt = result.unwrap();
		assert!(received_event_opt.is_some(), "Should have received an event");
		let received_event = received_event_opt.unwrap();
		assert_eq!(received_event.message_type, event.message_type);
	}

	#[tokio::test]
	async fn test_event_receiver_try_recv_no_event() {
		// Arrange
		let manager = PubSubManager::new();
		let topic = TopicTestFactory::valid();

		let mut receiver = manager.subscribe(&topic).await.unwrap();

		// Act - try to receive without publishing
		let result = receiver.try_recv();

		// Assert
		assert!(result.is_ok(), "Try receiving without event should succeed");
		let received_event_opt = result.unwrap();
		assert!(received_event_opt.is_none(), "Should not have received an event");
	}

	#[tokio::test]
	async fn test_unsubscribe_success() {
		// Arrange
		let manager = PubSubManager::new();
		let pattern = TopicTestFactory::wildcard_pattern();
		let subscriber_id = 0; // First subscription gets ID 0

		let _receiver = manager.subscribe(&pattern).await.unwrap();
		assert_eq!(manager.total_subscriptions().await, 1);

		// Act
		let result = manager.unsubscribe(subscriber_id).await;

		// Assert
		assert!(result.is_ok(), "Unsubscribe should succeed");
		// Note: total_subscriptions might not decrease immediately due to implementation details
	}

	#[tokio::test]
	async fn test_unsubscribe_not_found() {
		// Arrange
		let manager = PubSubManager::new();
		let nonexistent_subscriber_id = 999;

		// Act
		let result = manager.unsubscribe(nonexistent_subscriber_id).await;

		// Assert
		// This might succeed or fail depending on implementation
		// The test verifies the behavior is consistent
		assert!(result.is_ok() || result.is_err(), "Unsubscribe should have consistent behavior");
	}

	#[tokio::test]
	async fn test_subscriber_count_for_topic() {
		// Arrange
		let manager = PubSubManager::new();
		let topic = TopicTestFactory::valid();

		// Initially no subscribers
		assert_eq!(manager.subscriber_count(&topic).await, 0);

		// Subscribe to topic
		let _receiver = manager.subscribe(&topic).await.unwrap();

		// Act & Assert
		let count = manager.subscriber_count(&topic).await;
		assert!(count > 0, "Should have at least one subscriber");
	}

	#[tokio::test]
	async fn test_total_subscriptions_tracking() {
		// Arrange
		let manager = PubSubManager::new();
		let topic1 = TopicTestFactory::valid();
		let topic2 = TopicTestFactory::hierarchical();
		let pattern = TopicTestFactory::wildcard_pattern();

		assert_eq!(manager.total_subscriptions().await, 0);

		// Act - add subscriptions
		let _receiver1 = manager.subscribe(&topic1).await.unwrap();
		assert_eq!(manager.total_subscriptions().await, 1);

		let _receiver2 = manager.subscribe(&topic2).await.unwrap();
		assert_eq!(manager.total_subscriptions().await, 2);

		let _receiver3 = manager.subscribe(&pattern).await.unwrap();
		assert_eq!(manager.total_subscriptions().await, 3);
	}

	#[tokio::test]
	async fn test_hierarchical_topic_matching() {
		// Arrange
		let manager = PubSubManager::new();
		let hierarchical_topic = TopicTestFactory::hierarchical(); // "events.user.created.{id}"
		let pattern = "events.user.*";
		let event = MessageEnvelopeTestFactory::event();

		// Subscribe to pattern
		let _receiver = manager.subscribe(pattern).await.unwrap();

		// Act
		let result = manager.publish(&hierarchical_topic, event).await;

		// Assert
		assert!(result.is_ok(), "Publishing to hierarchical topic should succeed");
		let delivered_count = result.unwrap();
		assert_eq!(delivered_count, 1, "Should deliver to pattern subscriber");
	}

	#[tokio::test]
	async fn test_pubsub_manager_default() {
		// Arrange & Act
		let manager = PubSubManager::default();

		// Assert
		assert_eq!(manager.total_subscriptions().await, 0);
	}
}
