//! Unit tests for core message bus functionality
//!
//! These tests verify the central `MessageBus` behavior including route registration,
//! message routing, and basic bus operations.

use sy_ipc_bus::{MessageBus, BusConfig};
use crate::factory::{
    MessageEnvelopeTestFactory, RoutingKeyTestFactory, EndpointIdTestFactory, PriorityTestFactory
};
use std::time::Duration;

#[cfg(feature = "unit")]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_message_bus_creation() {
        // Arrange
        let config = BusConfig::default();
        
        // Act
        let _bus = MessageBus::new(config);
        
        // Assert - bus should be created successfully
        // This test will pass once MessageBus::new is implemented
    }

    #[tokio::test]
    async fn test_route_registration_success() {
        // Arrange
        let bus = MessageBus::new(BusConfig::default());
        let pattern = RoutingKeyTestFactory::valid();
        let endpoint_id = EndpointIdTestFactory::valid();
        let priority = PriorityTestFactory::high();
        
        // Act & Assert
        let result = bus.register_route(&pattern, &endpoint_id, priority).await;
        
        // This should succeed once route registration is implemented
        assert!(result.is_ok(), "Route registration should succeed");
    }

    #[tokio::test]
    async fn test_route_registration_invalid_pattern() {
        // Arrange
        let bus = MessageBus::new(BusConfig::default());
        let invalid_pattern = RoutingKeyTestFactory::invalid(); // empty string
        let endpoint_id = EndpointIdTestFactory::valid();
        let priority = PriorityTestFactory::medium();
        
        // Act
        let result = bus.register_route(&invalid_pattern, &endpoint_id, priority).await;
        
        // Assert
        assert!(result.is_err(), "Invalid pattern should fail registration");
    }

    #[tokio::test]
    async fn test_message_routing_no_route_found() {
        // Arrange
        let bus = MessageBus::new(BusConfig::default());
        let message = MessageEnvelopeTestFactory::request();
        
        // Act
        let result = bus.route_message(message).await;
        
        // Assert
        assert!(result.is_err(), "Routing without registered routes should fail");
        // Note: We'll need to implement proper error handling for this test
    }

    #[tokio::test]
    async fn test_message_routing_with_registered_route() {
        // Arrange
        let bus = MessageBus::new(BusConfig::default());
        let routing_key = RoutingKeyTestFactory::specific("user", "create");
        let endpoint_id = EndpointIdTestFactory::specific("user-service");
        let priority = PriorityTestFactory::high();
        
        // Register route first
        bus.register_route(&routing_key, &endpoint_id, priority).await.unwrap();
        
        // Create message with matching routing key
        let message = MessageEnvelopeTestFactory::with_routing_key(&routing_key);
        
        // Act
        let result = bus.route_message(message).await;
        
        // Assert
        // This will initially fail until endpoint registry is implemented
        // For now, we expect it to fail with EndpointNotFound rather than NoRouteFound
        assert!(result.is_err(), "Routing should fail until endpoint registry is implemented");
    }

    #[tokio::test]
    async fn test_bus_shutdown() {
        // Arrange
        let bus = MessageBus::new(BusConfig::default());
        
        // Act
        let result = bus.shutdown().await;
        
        // Assert
        assert!(result.is_ok(), "Bus shutdown should succeed");
    }

    #[tokio::test]
    async fn test_bus_config_default_values() {
        // Arrange & Act
        let config = BusConfig::default();
        
        // Assert
        assert_eq!(config.max_message_size, 1024 * 1024); // 1MB
        assert_eq!(config.correlation_timeout, Duration::from_secs(30));
        assert_eq!(config.health_check_interval, Duration::from_secs(5));
        assert_eq!(config.batch_size, 100);
        assert_eq!(config.max_concurrent_deliveries, 1000);
    }

    #[tokio::test]
    async fn test_bus_config_custom_values() {
        // Arrange
        let custom_config = BusConfig {
            max_message_size: 2 * 1024 * 1024, // 2MB
            correlation_timeout: Duration::from_secs(60),
            health_check_interval: Duration::from_secs(10),
            batch_size: 200,
            max_concurrent_deliveries: 2000,
        };
        
        // Act
        let _bus = MessageBus::new(custom_config);
        
        // Assert - bus should be created with custom config
        // This test verifies that custom configuration is accepted
    }
}