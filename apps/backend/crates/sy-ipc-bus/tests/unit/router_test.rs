//! Unit tests for pattern-based message routing
//!
//! These tests verify the PatternRouter behavior including route registration,
//! pattern matching, and route finding functionality.

use sy_ipc_bus::{PatternRouter, RouterError};
use crate::factory::{RoutingKeyTestFactory, EndpointIdTestFactory, PriorityTestFactory};

#[cfg(feature = "unit")]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_pattern_router_creation() {
        // Arrange & Act
        let router = PatternRouter::new();
        
        // Assert
        assert_eq!(router.route_count().await, 0);
    }

    #[tokio::test]
    async fn test_exact_route_registration() {
        // Arrange
        let router = PatternRouter::new();
        let pattern = RoutingKeyTestFactory::specific("user", "create");
        let endpoint_id = EndpointIdTestFactory::specific("user-service");
        let priority = PriorityTestFactory::high();
        
        // Act
        let result = router.register_route(&pattern, endpoint_id, priority).await;
        
        // Assert
        assert!(result.is_ok(), "Exact route registration should succeed");
        assert_eq!(router.route_count().await, 1);
    }

    #[tokio::test]
    async fn test_wildcard_route_registration() {
        // Arrange
        let router = PatternRouter::new();
        let pattern = RoutingKeyTestFactory::wildcard_pattern(); // "service.*"
        let endpoint_id = EndpointIdTestFactory::specific("service-handler");
        let priority = PriorityTestFactory::medium();
        
        // Act
        let result = router.register_route(&pattern, endpoint_id, priority).await;
        
        // Assert
        assert!(result.is_ok(), "Wildcard route registration should succeed");
        assert_eq!(router.route_count().await, 1);
    }

    #[tokio::test]
    async fn test_regex_route_registration() {
        // Arrange
        let router = PatternRouter::new();
        let pattern = RoutingKeyTestFactory::regex_pattern(); // r"service\.[0-9]+"
        let endpoint_id = EndpointIdTestFactory::specific("regex-handler");
        let priority = PriorityTestFactory::low();
        
        // Act
        let result = router.register_route(&pattern, endpoint_id, priority).await;
        
        // Assert
        assert!(result.is_ok(), "Regex route registration should succeed");
        assert_eq!(router.route_count().await, 1);
    }

    #[tokio::test]
    async fn test_invalid_pattern_registration() {
        // Arrange
        let router = PatternRouter::new();
        let invalid_pattern = "[invalid regex"; // Malformed regex
        let endpoint_id = EndpointIdTestFactory::valid();
        let priority = PriorityTestFactory::medium();
        
        // Act
        let result = router.register_route(&invalid_pattern, endpoint_id, priority).await;
        
        // Assert
        assert!(result.is_err(), "Invalid pattern should fail registration");
        match result.unwrap_err() {
            RouterError::PatternCompilationFailed(_) => {}, // Expected error for regex compilation failure
            other => panic!("Expected PatternCompilationFailed error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_find_exact_route() {
        // Arrange
        let router = PatternRouter::new();
        let pattern = RoutingKeyTestFactory::specific("user", "create");
        let endpoint_id = EndpointIdTestFactory::specific("user-service");
        let priority = PriorityTestFactory::high();
        
        router.register_route(&pattern, endpoint_id.clone(), priority).await.unwrap();
        
        // Act
        let found_route = router.find_route(&pattern);
        
        // Assert
        assert!(found_route.is_some(), "Exact route should be found");
        let route = found_route.unwrap();
        assert_eq!(route.pattern, pattern);
        assert_eq!(route.endpoint_id, endpoint_id);
        assert_eq!(route.priority, priority);
    }

    #[tokio::test]
    async fn test_find_wildcard_route() {
        // Arrange
        let router = PatternRouter::new();
        let pattern = "user.*";
        let endpoint_id = EndpointIdTestFactory::specific("user-service");
        let priority = PriorityTestFactory::high();
        
        router.register_route(pattern, endpoint_id.clone(), priority).await.unwrap();
        
        // Act
        let found_route = router.find_route("user.create");
        
        // Assert
        assert!(found_route.is_some(), "Wildcard route should match");
        let route = found_route.unwrap();
        assert_eq!(route.endpoint_id, endpoint_id);
    }

    #[tokio::test]
    async fn test_find_route_not_found() {
        // Arrange
        let router = PatternRouter::new();
        let routing_key = RoutingKeyTestFactory::valid();
        
        // Act
        let found_route = router.find_route(&routing_key);
        
        // Assert
        assert!(found_route.is_none(), "Non-existent route should not be found");
    }

    #[tokio::test]
    async fn test_find_all_routes_multiple_matches() {
        // Arrange
        let router = PatternRouter::new();
        let endpoint1 = EndpointIdTestFactory::specific("service1");
        let endpoint2 = EndpointIdTestFactory::specific("service2");
        
        // Register multiple matching routes
        router.register_route("user.*", endpoint1.clone(), PriorityTestFactory::high()).await.unwrap();
        router.register_route("*.create", endpoint2.clone(), PriorityTestFactory::medium()).await.unwrap();
        
        // Act
        let routes = router.find_all_routes("user.create");
        
        // Assert
        assert_eq!(routes.len(), 2, "Should find both matching routes");
        // Routes should be sorted by priority (highest first)
        assert_eq!(routes[0].endpoint_id, endpoint1); // Higher priority
        assert_eq!(routes[1].endpoint_id, endpoint2); // Lower priority
    }

    #[tokio::test]
    async fn test_route_removal() {
        // Arrange
        let router = PatternRouter::new();
        let pattern = RoutingKeyTestFactory::specific("user", "delete");
        let endpoint_id = EndpointIdTestFactory::specific("user-service");
        let priority = PriorityTestFactory::medium();
        
        router.register_route(&pattern, endpoint_id, priority).await.unwrap();
        assert_eq!(router.route_count().await, 1);
        
        // Act
        let result = router.remove_route(&pattern).await;
        
        // Assert
        assert!(result.is_ok(), "Route removal should succeed");
        assert_eq!(router.route_count().await, 0);
    }

    #[tokio::test]
    async fn test_route_removal_not_found() {
        // Arrange
        let router = PatternRouter::new();
        let nonexistent_pattern = RoutingKeyTestFactory::valid();
        
        // Act
        let result = router.remove_route(&nonexistent_pattern).await;
        
        // Assert
        assert!(result.is_err(), "Removing non-existent route should fail");
        match result.unwrap_err() {
            RouterError::RouteNotFound(_) => {}, // Expected error
            other => panic!("Expected RouteNotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_route_cache_clearing() {
        // Arrange
        let router = PatternRouter::new();
        let pattern = RoutingKeyTestFactory::specific("cache", "test");
        let endpoint_id = EndpointIdTestFactory::specific("cache-service");
        let priority = PriorityTestFactory::medium();
        
        router.register_route(&pattern, endpoint_id, priority).await.unwrap();
        
        // Find route to populate cache
        let _ = router.find_route(&pattern);
        
        // Act
        router.clear_cache();
        
        // Assert
        // Cache should be cleared (no direct way to test, but operation should succeed)
        let found_route = router.find_route(&pattern);
        assert!(found_route.is_some(), "Route should still be findable after cache clear");
    }

    #[tokio::test]
    async fn test_route_priority_ordering() {
        // Arrange
        let router = PatternRouter::new();
        let pattern = "priority.*";
        let high_priority_endpoint = EndpointIdTestFactory::specific("high-priority");
        let low_priority_endpoint = EndpointIdTestFactory::specific("low-priority");
        
        // Register routes in reverse priority order
        router.register_route(pattern, low_priority_endpoint.clone(), PriorityTestFactory::low()).await.unwrap();
        router.register_route(pattern, high_priority_endpoint.clone(), PriorityTestFactory::high()).await.unwrap();
        
        // Act
        let found_route = router.find_route("priority.test");
        
        // Assert
        assert!(found_route.is_some(), "Route should be found");
        let route = found_route.unwrap();
        assert_eq!(route.endpoint_id, high_priority_endpoint, "Higher priority route should be selected");
    }
}