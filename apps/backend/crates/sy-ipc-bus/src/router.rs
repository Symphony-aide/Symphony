//! Pattern-based message routing
//!
//! This module provides high-performance message routing based on patterns,
//! supporting exact matches, wildcards, and regex patterns.

use tokio::sync::RwLock;
use regex::Regex;
use chrono::{DateTime, Utc};
use dashmap::DashMap;
use sy_commons::debug::duck;

use crate::error::{RouterResult};

/// A route definition with pattern, endpoint, and priority
#[derive(Debug, Clone)]
pub struct Route {
    /// The routing pattern
    pub pattern: String,
    /// Target endpoint identifier
    pub endpoint_id: String,
    /// Route priority (higher values have higher priority)
    pub priority: u32,
    /// When the route was created
    pub created_at: DateTime<Utc>,
}

/// Compiled route with regex for efficient matching
#[derive(Debug)]
struct CompiledRoute {
    route: Route,
    regex: Regex,
}

/// High-performance pattern-based message router
///
/// The `PatternRouter` provides efficient message routing based on patterns with support for:
/// - Exact string matching (fastest)
/// - Wildcard patterns (* and ?)
/// - Regex patterns
/// - Priority-based route selection
/// - Route caching for performance
///
/// # Performance
///
/// - Exact routes: O(1) hash lookup
/// - Pattern routes: O(n) regex matching with caching
/// - Route cache: Avoids repeated pattern compilation
///
/// # Examples
///
/// ```rust
/// use sy_ipc_bus::PatternRouter;
///
/// #[tokio::main]
/// async fn main() -> Result<(), Box<dyn std::error::Error>> {
///     let router = PatternRouter::new();
///     
///     // Register exact route
///     router.register_route("user.create", "user-service".to_string(), 100).await?;
///     
///     // Register wildcard route
///     router.register_route("user.*", "user-service".to_string(), 50).await?;
///     
///     // Find route
///     if let Some(route) = router.find_route("user.create") {
///         println!("Route found: {}", route.endpoint_id);
///     }
///     
///     Ok(())
/// }
/// ```
pub struct PatternRouter {
    /// Exact routes for O(1) lookup
    exact_routes: DashMap<String, Route>,
    /// Pattern routes with compiled regex
    pattern_routes: RwLock<Vec<CompiledRoute>>,
    /// Route cache for performance
    route_cache: DashMap<String, Vec<Route>>,
}

impl PatternRouter {
    /// Create a new pattern router
    ///
    /// # Examples
    ///
    /// ```rust
    /// use sy_ipc_bus::PatternRouter;
    ///
    /// let router = PatternRouter::new();
    /// ```
    #[must_use]
    pub fn new() -> Self {
        duck!("Creating new PatternRouter");
        
        Self {
            exact_routes: DashMap::new(),
            pattern_routes: RwLock::new(Vec::new()),
            route_cache: DashMap::new(),
        }
    }
    
    /// Register a new route
    ///
    /// # Arguments
    ///
    /// * `pattern` - Routing pattern (supports *, ?, and regex)
    /// * `endpoint_id` - Target endpoint identifier
    /// * `priority` - Route priority (higher values have higher priority)
    ///
    /// # Errors
    ///
    /// Returns `RouterError::InvalidPattern` if the pattern is malformed.
    /// Returns `RouterError::RouteAlreadyExists` if an exact route already exists.
    ///
    /// # Examples
    ///
    /// ```rust
    /// # use sy_ipc_bus::PatternRouter;
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// let router = PatternRouter::new();
    /// 
    /// // Exact route
    /// router.register_route("user.create", "user-service".to_string(), 100).await?;
    /// 
    /// // Wildcard route
    /// router.register_route("user.*", "user-service".to_string(), 50).await?;
    /// 
    /// // Regex route
    /// router.register_route("user.[0-9]+", "user-service".to_string(), 75).await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn register_route(&self, pattern: &str, endpoint_id: String, priority: u32) -> RouterResult<()> {
        duck!("Registering route: pattern={}, endpoint={}, priority={}", pattern, endpoint_id, priority);
        
        // Validate pattern
        if pattern.is_empty() {
            return Err(crate::error::RouterError::InvalidPattern("Pattern cannot be empty".to_string()));
        }
        
        let route = Route {
            pattern: pattern.to_string(),
            endpoint_id,
            priority,
            created_at: chrono::Utc::now(),
        };
        
        if Self::is_pattern(pattern) {
            // Pattern route - compile regex
            let regex_pattern = Self::glob_to_regex(pattern);
            let compiled_regex = Regex::new(&regex_pattern)
                .map_err(|e| crate::error::RouterError::PatternCompilationFailed(e.to_string()))?;
            
            let compiled_route = CompiledRoute {
                route: route.clone(),
                regex: compiled_regex,
            };
            
            let mut pattern_routes = self.pattern_routes.write().await;
            pattern_routes.push(compiled_route);
            
            // Sort by priority (higher priority first)
            pattern_routes.sort_by(|a, b| b.route.priority.cmp(&a.route.priority));
        } else {
            // Exact route - check for duplicates
            if self.exact_routes.contains_key(pattern) {
                return Err(crate::error::RouterError::RouteAlreadyExists(pattern.to_string()));
            }
            
            self.exact_routes.insert(pattern.to_string(), route);
        }
        
        // Clear cache when routes change
        self.route_cache.clear();
        
        Ok(())
    }
    
    /// Find the best matching route for a routing key
    ///
    /// Returns the highest priority route that matches the routing key.
    /// Exact routes are checked first for performance.
    ///
    /// # Arguments
    ///
    /// * `routing_key` - The routing key to match
    ///
    /// # Returns
    ///
    /// The best matching route, or `None` if no route matches.
    ///
    /// # Examples
    ///
    /// ```rust
    /// # use sy_ipc_bus::PatternRouter;
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// let router = PatternRouter::new();
    /// router.register_route("user.*", "user-service".to_string(), 100).await?;
    /// 
    /// if let Some(route) = router.find_route("user.create") {
    ///     println!("Found route to: {}", route.endpoint_id);
    /// }
    /// # Ok(())
    /// # }
    /// ```
    pub fn find_route(&self, routing_key: &str) -> Option<Route> {
        duck!("Finding route for key: {}", routing_key);
        
        // Check cache first
        if let Some(cached_routes) = self.route_cache.get(routing_key) {
            return cached_routes.first().cloned();
        }
        
        // Check exact routes first (fastest)
        if let Some(route) = self.exact_routes.get(routing_key) {
            let route = route.clone();
            self.route_cache.insert(routing_key.to_string(), vec![route.clone()]);
            return Some(route);
        }
        
        // Check pattern routes
        if let Ok(pattern_routes) = self.pattern_routes.try_read() {
            for compiled_route in pattern_routes.iter() {
                if compiled_route.regex.is_match(routing_key) {
                    let route = compiled_route.route.clone();
                    self.route_cache.insert(routing_key.to_string(), vec![route.clone()]);
                    return Some(route);
                }
            }
        }
        
        None
    }
    
    /// Find all matching routes for a routing key
    ///
    /// Returns all routes that match the routing key, sorted by priority (highest first).
    /// This is useful for notifications that need to be delivered to multiple endpoints.
    ///
    /// # Arguments
    ///
    /// * `routing_key` - The routing key to match
    ///
    /// # Returns
    ///
    /// A vector of all matching routes, sorted by priority.
    ///
    /// # Examples
    ///
    /// ```rust
    /// # use sy_ipc_bus::PatternRouter;
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// let router = PatternRouter::new();
    /// router.register_route("user.*", "user-service".to_string(), 100).await?;
    /// router.register_route("*.create", "audit-service".to_string(), 50).await?;
    /// 
    /// let routes = router.find_all_routes("user.create");
    /// println!("Found {} matching routes", routes.len());
    /// # Ok(())
    /// # }
    /// ```
    pub fn find_all_routes(&self, routing_key: &str) -> Vec<Route> {
        duck!("Finding all routes for key: {}", routing_key);
        
        // Check cache first
        if let Some(cached_routes) = self.route_cache.get(routing_key) {
            return cached_routes.clone();
        }
        
        let mut matching_routes = Vec::new();
        
        // Check exact routes
        if let Some(route) = self.exact_routes.get(routing_key) {
            matching_routes.push(route.clone());
        }
        
        // Check pattern routes
        if let Ok(pattern_routes) = self.pattern_routes.try_read() {
            for compiled_route in pattern_routes.iter() {
                if compiled_route.regex.is_match(routing_key) {
                    matching_routes.push(compiled_route.route.clone());
                }
            }
        }
        
        // Sort by priority (highest first)
        matching_routes.sort_by(|a, b| b.priority.cmp(&a.priority));
        
        // Cache results
        self.route_cache.insert(routing_key.to_string(), matching_routes.clone());
        
        matching_routes
    }
    
    /// Remove a route by pattern
    ///
    /// # Arguments
    ///
    /// * `pattern` - The pattern of the route to remove
    ///
    /// # Errors
    ///
    /// Returns `RouterError::RouteNotFound` if no route with the given pattern exists.
    ///
    /// # Examples
    ///
    /// ```rust
    /// # use sy_ipc_bus::PatternRouter;
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// let router = PatternRouter::new();
    /// router.register_route("user.*", "user-service".to_string(), 100).await?;
    /// router.remove_route("user.*").await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn remove_route(&self, pattern: &str) -> RouterResult<()> {
        duck!("Removing route: pattern={}", pattern);
        
        // Try to remove from exact routes first
        if self.exact_routes.remove(pattern).is_some() {
            // Clear cache when routes change
            self.route_cache.clear();
            return Ok(());
        }
        
        // Try to remove from pattern routes
        let mut pattern_routes = self.pattern_routes.write().await;
        let initial_len = pattern_routes.len();
        pattern_routes.retain(|compiled_route| compiled_route.route.pattern != pattern);
        
        if pattern_routes.len() < initial_len {
            // Clear cache when routes change
            self.route_cache.clear();
            Ok(())
        } else {
            Err(crate::error::RouterError::RouteNotFound(pattern.to_string()))
        }
    }
    
    /// Clear the route cache
    ///
    /// This is called automatically when routes are added or removed,
    /// but can be called manually if needed.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use sy_ipc_bus::PatternRouter;
    ///
    /// let router = PatternRouter::new();
    /// router.clear_cache();
    /// ```
    pub fn clear_cache(&self) {
        duck!("Clearing route cache");
        self.route_cache.clear();
    }
    
    /// Get the number of registered routes
    ///
    /// # Returns
    ///
    /// The total number of registered routes (exact + pattern).
    ///
    /// # Examples
    ///
    /// ```rust
    /// # use sy_ipc_bus::PatternRouter;
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// let router = PatternRouter::new();
    /// router.register_route("user.*", "user-service".to_string(), 100).await?;
    /// 
    /// assert_eq!(router.route_count().await, 1);
    /// # Ok(())
    /// # }
    /// ```
    pub async fn route_count(&self) -> usize {
        let exact_count = self.exact_routes.len();
        let pattern_count: usize = self.pattern_routes.read().await.len();
        exact_count + pattern_count
    }
    
    /// Check if a pattern contains wildcards or regex characters
    fn is_pattern(pattern: &str) -> bool {
        pattern.contains('*') || pattern.contains('?') || pattern.contains('[') || pattern.contains('^') || pattern.contains('$')
    }
    
    /// Convert glob pattern to regex
    fn glob_to_regex(pattern: &str) -> String {
        let mut regex = String::new();
        regex.push('^');
        
        let chars: Vec<char> = pattern.chars().collect();
        let mut i = 0;
        
        while i < chars.len() {
            match chars[i] {
                '*' => regex.push_str(".*"),
                '?' => regex.push('.'),
                '[' => {
                    regex.push('[');
                    i += 1;
                    while i < chars.len() && chars[i] != ']' {
                        regex.push(chars[i]);
                        i += 1;
                    }
                    if i < chars.len() {
                        regex.push(']');
                    }
                }
                c if "^$(){}+|\\".contains(c) => {
                    regex.push('\\');
                    regex.push(c);
                }
                c => regex.push(c),
            }
            i += 1;
        }
        
        regex.push('$');
        regex
    }
}

impl Default for PatternRouter {
    fn default() -> Self {
        Self::new()
    }
}