# F005 - Message Bus Core - Design

**Feature ID**: F005  
**Design Date**: December 28, 2025  
**Architecture**: High-performance message bus with pattern-based routing  
**Implementation**: Request/response correlation + pub/sub + health monitoring  

---

## System Architecture

### Message Bus Architecture Overview
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SYMPHONY MESSAGE BUS ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                        MESSAGE BUS CORE                                │ │
│  │                                                                        │ │
│  │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │ │
│  │   │   Message       │  │   Endpoint      │  │   Performance   │      │ │
│  │   │   Router        │  │   Registry      │  │   Monitor       │      │ │
│  │   │                 │  │                 │  │                 │      │ │
│  │   │• Pattern match  │  │• Dynamic reg    │  │• <0.1ms routing │      │ │
│  │   │• Route priority │  │• Service disc   │  │• >10K msg/sec   │      │ │
│  │   │• Load balance   │  │• Health track   │  │• Metrics        │      │ │
│  │   │• Failover       │  │• Lifecycle mgmt │  │• Alerting       │      │ │
│  │   └─────────┬───────┘  └─────────┬───────┘  └─────────┬───────┘      │ │
│  │             │                    │                    │                │ │
│  │             └────────────────────┼────────────────────┘                │ │
│  │                                  │                                     │ │
│  └──────────────────────────────────┼─────────────────────────────────────┘ │
│                                     │                                       │
│  ┌──────────────────────────────────┼─────────────────────────────────────┐ │
│  │                        ROUTING LAYER                                   │ │
│  │                                  │                                      │ │
│  │  ┌──────────────┐ ┌─────────────┴─────────────┐ ┌──────────────┐      │ │
│  │  │ Pattern      │ │    Request/Response       │ │ Publish/     │      │ │
│  │  │ Router       │ │    Correlation            │ │ Subscribe    │      │ │
│  │  │              │ │                           │ │              │      │ │
│  │  │• Regex match │ │• Correlation ID tracking │ │• Topic match │      │ │
│  │  │• Glob match  │ │• Timeout handling        │ │• Subscriber  │      │ │
│  │  │• Exact match │ │• Response routing        │ │  management  │      │ │
│  │  │• Priority    │ │• Error propagation       │ │• Event dist  │      │ │
│  │  └──────┬───────┘ └─────────────┬─────────────┘ └──────┬───────┘      │ │
│  │         │                       │                      │                │ │
│  └─────────┼───────────────────────┼──────────────────────┼────────────────┘ │
│            │                       │                      │                  │
│  ┌─────────┼───────────────────────┼──────────────────────┼────────────────┐ │
│  │         │              DELIVERY LAYER                  │                 │ │
│  │         │                       │                      │                 │ │
│  │  ┌──────┴───────┐ ┌─────────────┴─────────────┐ ┌──────┴───────┐        │ │
│  │  │   Message    │ │      Batching             │ │   Health     │        │ │
│  │  │  Delivery    │ │     System                │ │  Monitor     │        │ │
│  │  │              │ │                           │ │              │        │ │
│  │  │• Reliable    │ │• Throughput optimization  │ │• Endpoint    │        │ │
│  │  │• Ordered     │ │• Configurable batch size │ │  health      │        │ │
│  │  │• At-least-   │ │• Latency vs throughput   │ │• Circuit     │        │ │
│  │  │  once        │ │• Backpressure handling   │ │  breaker     │        │ │
│  │  └──────────────┘ └───────────────────────────┘ └──────────────┘        │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Module Design

### 1. Core Message Bus (`src/bus.rs`)

#### Central Message Bus Implementation
```rust
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{RwLock, mpsc, broadcast};
use dashmap::DashMap;

pub struct MessageBus {
    router: Arc<PatternRouter>,
    correlation_manager: Arc<CorrelationManager>,
    pubsub_manager: Arc<PubSubManager>,
    endpoint_registry: Arc<EndpointRegistry>,
    health_monitor: Arc<HealthMonitor>,
    metrics: Arc<BusMetrics>,
    config: BusConfig,
}

impl MessageBus {
    pub fn new(config: BusConfig) -> Self {
        Self {
            router: Arc::new(PatternRouter::new()),
            correlation_manager: Arc::new(CorrelationManager::new(config.correlation_timeout)),
            pubsub_manager: Arc::new(PubSubManager::new()),
            endpoint_registry: Arc::new(EndpointRegistry::new()),
            health_monitor: Arc::new(HealthMonitor::new(config.health_check_interval)),
            metrics: Arc::new(BusMetrics::new()),
            config,
        }
    }
    
    pub async fn route_message(&self, message: MessageEnvelope) -> Result<(), BusError> {
        let start = std::time::Instant::now();
        
        // Update metrics
        self.metrics.increment_message_count();
        
        // Route based on message type
        match message.message_type {
            MessageType::Request => self.handle_request(message).await,
            MessageType::Response => self.handle_response(message).await,
            MessageType::Notification => self.handle_notification(message).await,
            MessageType::Event => self.handle_event(message).await,
        }?;
        
        let routing_time = start.elapsed();
        self.metrics.record_routing_latency(routing_time);
        
        if routing_time > Duration::from_nanos(100_000) {
            tracing::warn!("Message routing took {}μs (target: <100μs)", routing_time.as_micros());
        }
        
        Ok(())
    }
    
    async fn handle_request(&self, message: MessageEnvelope) -> Result<(), BusError> {
        // Find matching route
        let route = self.router.find_route(&message.routing_key)
            .ok_or_else(|| BusError::NoRouteFound(message.routing_key.clone()))?;
        
        // Register correlation for response
        if let Some(correlation_id) = message.correlation_id {
            self.correlation_manager.register_request(correlation_id, message.reply_to.clone()).await?;
        }
        
        // Deliver to endpoint
        self.deliver_to_endpoint(&route.endpoint_id, message).await
    }
    
    async fn handle_response(&self, message: MessageEnvelope) -> Result<(), BusError> {
        if let Some(correlation_id) = message.correlation_id {
            // Find original request endpoint
            let reply_to = self.correlation_manager.resolve_correlation(correlation_id).await?;
            
            // Deliver response
            self.deliver_to_endpoint(&reply_to, message).await
        } else {
            Err(BusError::MissingCorrelationId)
        }
    }
    
    async fn handle_notification(&self, message: MessageEnvelope) -> Result<(), BusError> {
        // Find all matching routes (notifications can go to multiple endpoints)
        let routes = self.router.find_all_routes(&message.routing_key);
        
        if routes.is_empty() {
            return Err(BusError::NoRouteFound(message.routing_key));
        }
        
        // Deliver to all matching endpoints
        let mut delivery_tasks = Vec::new();
        for route in routes {
            let message_clone = message.clone();
            let endpoint_id = route.endpoint_id.clone();
            let bus = self.clone();
            
            delivery_tasks.push(tokio::spawn(async move {
                bus.deliver_to_endpoint(&endpoint_id, message_clone).await
            }));
        }
        
        // Wait for all deliveries
        for task in delivery_tasks {
            task.await.map_err(|e| BusError::DeliveryFailed(e.to_string()))??;
        }
        
        Ok(())
    }
    
    async fn handle_event(&self, message: MessageEnvelope) -> Result<(), BusError> {
        // Events go through pub/sub system
        self.pubsub_manager.publish(&message.routing_key, message).await
    }
    
    async fn deliver_to_endpoint(&self, endpoint_id: &str, message: MessageEnvelope) -> Result<(), BusError> {
        let endpoint = self.endpoint_registry.get_endpoint(endpoint_id)
            .ok_or_else(|| BusError::EndpointNotFound(endpoint_id.to_string()))?;
        
        // Check endpoint health
        if !self.health_monitor.is_healthy(endpoint_id).await {
            return Err(BusError::EndpointUnhealthy(endpoint_id.to_string()));
        }
        
        // Deliver message
        endpoint.send(message).await
            .map_err(|e| BusError::DeliveryFailed(e.to_string()))?;
        
        self.metrics.increment_delivery_count();
        Ok(())
    }
}

#[derive(Debug, Clone)]
pub struct BusConfig {
    pub max_message_size: usize,
    pub correlation_timeout: Duration,
    pub health_check_interval: Duration,
    pub batch_size: usize,
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
```

### 2. Pattern-Based Router (`src/router.rs`)

#### High-Performance Message Routing
```rust
use regex::Regex;
use std::collections::BTreeMap;

pub struct PatternRouter {
    exact_routes: DashMap<String, Route>,
    pattern_routes: RwLock<Vec<CompiledRoute>>,
    route_cache: DashMap<String, Vec<Route>>,
}

impl PatternRouter {
    pub fn new() -> Self {
        Self {
            exact_routes: DashMap::new(),
            pattern_routes: RwLock::new(Vec::new()),
            route_cache: DashMap::new(),
        }
    }
    
    pub async fn register_route(&self, pattern: &str, endpoint_id: String, priority: u32) -> Result<(), RouterError> {
        let route = Route {
            pattern: pattern.to_string(),
            endpoint_id,
            priority,
            created_at: chrono::Utc::now(),
        };
        
        if pattern.contains('*') || pattern.contains('?') || pattern.contains('[') {
            // Pattern route - compile regex
            let regex_pattern = self.glob_to_regex(pattern)?;
            let compiled_regex = Regex::new(&regex_pattern)
                .map_err(|e| RouterError::InvalidPattern(e.to_string()))?;
            
            let compiled_route = CompiledRoute {
                route: route.clone(),
                regex: compiled_regex,
            };
            
            let mut pattern_routes = self.pattern_routes.write().await;
            pattern_routes.push(compiled_route);
            
            // Sort by priority (higher priority first)
            pattern_routes.sort_by(|a, b| b.route.priority.cmp(&a.route.priority));
        } else {
            // Exact route - direct hash lookup
            self.exact_routes.insert(pattern.to_string(), route);
        }
        
        // Clear cache when routes change
        self.route_cache.clear();
        
        Ok(())
    }
    
    pub fn find_route(&self, routing_key: &str) -> Option<Route> {
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
        let pattern_routes = self.pattern_routes.try_read().ok()?;
        for compiled_route in pattern_routes.iter() {
            if compiled_route.regex.is_match(routing_key) {
                let route = compiled_route.route.clone();
                self.route_cache.insert(routing_key.to_string(), vec![route.clone()]);
                return Some(route);
            }
        }
        
        None
    }
    
    pub fn find_all_routes(&self, routing_key: &str) -> Vec<Route> {
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
        
        // Sort by priority
        matching_routes.sort_by(|a, b| b.priority.cmp(&a.priority));
        
        // Cache results
        self.route_cache.insert(routing_key.to_string(), matching_routes.clone());
        
        matching_routes
    }
    
    fn glob_to_regex(&self, pattern: &str) -> Result<String, RouterError> {
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
        Ok(regex)
    }
}

#[derive(Debug, Clone)]
pub struct Route {
    pub pattern: String,
    pub endpoint_id: String,
    pub priority: u32,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

struct CompiledRoute {
    route: Route,
    regex: Regex,
}
```

### 3. Request/Response Correlation (`src/correlation.rs`)

#### Reliable Request/Response Matching
```rust
use std::collections::HashMap;
use tokio::sync::{RwLock, oneshot};
use tokio::time::{timeout, Duration};

pub struct CorrelationManager {
    pending_requests: RwLock<HashMap<CorrelationId, PendingRequest>>,
    timeout_duration: Duration,
}

impl CorrelationManager {
    pub fn new(timeout_duration: Duration) -> Self {
        let manager = Self {
            pending_requests: RwLock::new(HashMap::new()),
            timeout_duration,
        };
        
        // Start cleanup task
        let manager_clone = manager.clone();
        tokio::spawn(async move {
            manager_clone.cleanup_expired_correlations().await;
        });
        
        manager
    }
    
    pub async fn register_request(&self, correlation_id: CorrelationId, reply_to: String) -> Result<(), CorrelationError> {
        let pending_request = PendingRequest {
            reply_to,
            created_at: chrono::Utc::now(),
            timeout_at: chrono::Utc::now() + chrono::Duration::from_std(self.timeout_duration).unwrap(),
        };
        
        let mut pending = self.pending_requests.write().await;
        pending.insert(correlation_id, pending_request);
        
        Ok(())
    }
    
    pub async fn resolve_correlation(&self, correlation_id: CorrelationId) -> Result<String, CorrelationError> {
        let mut pending = self.pending_requests.write().await;
        
        match pending.remove(&correlation_id) {
            Some(request) => {
                // Check if request has timed out
                if chrono::Utc::now() > request.timeout_at {
                    return Err(CorrelationError::RequestTimeout(correlation_id));
                }
                
                Ok(request.reply_to)
            }
            None => Err(CorrelationError::CorrelationNotFound(correlation_id)),
        }
    }
    
    pub async fn send_request_with_response<T>(&self, request: MessageEnvelope) -> Result<T, CorrelationError>
    where
        T: serde::de::DeserializeOwned,
    {
        let correlation_id = CorrelationId::new();
        let (response_tx, response_rx) = oneshot::channel();
        
        // Register response handler
        let response_handler = ResponseHandler {
            sender: response_tx,
            expected_type: std::any::type_name::<T>(),
        };
        
        {
            let mut pending = self.pending_requests.write().await;
            pending.insert(correlation_id, PendingRequest {
                reply_to: "internal".to_string(), // Special marker for internal requests
                created_at: chrono::Utc::now(),
                timeout_at: chrono::Utc::now() + chrono::Duration::from_std(self.timeout_duration).unwrap(),
            });
        }
        
        // Send request with correlation ID
        let mut request_with_correlation = request;
        request_with_correlation.correlation_id = Some(correlation_id);
        
        // TODO: Send request through message bus
        
        // Wait for response with timeout
        let response = timeout(self.timeout_duration, response_rx)
            .await
            .map_err(|_| CorrelationError::RequestTimeout(correlation_id))?
            .map_err(|_| CorrelationError::ResponseChannelClosed)?;
        
        Ok(response)
    }
    
    async fn cleanup_expired_correlations(&self) {
        let mut interval = tokio::time::interval(Duration::from_secs(30));
        
        loop {
            interval.tick().await;
            
            let now = chrono::Utc::now();
            let mut pending = self.pending_requests.write().await;
            
            pending.retain(|correlation_id, request| {
                if now > request.timeout_at {
                    tracing::debug!("Cleaning up expired correlation: {:?}", correlation_id);
                    false
                } else {
                    true
                }
            });
        }
    }
}

#[derive(Debug, Clone)]
struct PendingRequest {
    reply_to: String,
    created_at: chrono::DateTime<chrono::Utc>,
    timeout_at: chrono::DateTime<chrono::Utc>,
}

struct ResponseHandler<T> {
    sender: oneshot::Sender<T>,
    expected_type: &'static str,
}
```

### 4. Publish/Subscribe System (`src/pubsub.rs`)

#### Topic-Based Event Distribution
```rust
use tokio::sync::broadcast;
use std::collections::HashMap;

pub struct PubSubManager {
    topics: RwLock<HashMap<String, TopicChannel>>,
    pattern_subscriptions: RwLock<Vec<PatternSubscription>>,
    subscriber_count: AtomicUsize,
}

impl PubSubManager {
    pub fn new() -> Self {
        Self {
            topics: RwLock::new(HashMap::new()),
            pattern_subscriptions: RwLock::new(Vec::new()),
            subscriber_count: AtomicUsize::new(0),
        }
    }
    
    pub async fn subscribe(&self, pattern: &str) -> Result<EventReceiver, PubSubError> {
        let subscriber_id = self.subscriber_count.fetch_add(1, Ordering::Relaxed);
        
        if pattern.contains('*') || pattern.contains('?') {
            // Pattern subscription
            let (tx, rx) = broadcast::channel(1000);
            let subscription = PatternSubscription {
                id: subscriber_id,
                pattern: pattern.to_string(),
                regex: self.compile_pattern(pattern)?,
                sender: tx,
            };
            
            let mut pattern_subs = self.pattern_subscriptions.write().await;
            pattern_subs.push(subscription);
            
            Ok(EventReceiver::new(rx))
        } else {
            // Exact topic subscription
            let mut topics = self.topics.write().await;
            let topic_channel = topics.entry(pattern.to_string())
                .or_insert_with(|| TopicChannel::new(1000));
            
            let receiver = topic_channel.subscribe();
            Ok(EventReceiver::new(receiver))
        }
    }
    
    pub async fn publish(&self, topic: &str, message: MessageEnvelope) -> Result<usize, PubSubError> {
        let start = std::time::Instant::now();
        let mut delivered_count = 0;
        
        // Publish to exact topic subscribers
        {
            let topics = self.topics.read().await;
            if let Some(topic_channel) = topics.get(topic) {
                let subscriber_count = topic_channel.send(message.clone());
                delivered_count += subscriber_count;
            }
        }
        
        // Publish to pattern subscribers
        {
            let pattern_subs = self.pattern_subscriptions.read().await;
            for subscription in pattern_subs.iter() {
                if subscription.regex.is_match(topic) {
                    if let Ok(count) = subscription.sender.send(message.clone()) {
                        delivered_count += count;
                    }
                }
            }
        }
        
        let publish_time = start.elapsed();
        if publish_time > Duration::from_millis(1) {
            tracing::warn!("Pub/sub publish took {}ms (target: <1ms)", publish_time.as_millis());
        }
        
        Ok(delivered_count)
    }
    
    pub async fn unsubscribe(&self, subscriber_id: usize) -> Result<(), PubSubError> {
        let mut pattern_subs = self.pattern_subscriptions.write().await;
        pattern_subs.retain(|sub| sub.id != subscriber_id);
        Ok(())
    }
    
    fn compile_pattern(&self, pattern: &str) -> Result<Regex, PubSubError> {
        let regex_pattern = pattern
            .replace("*", ".*")
            .replace("?", ".");
        
        Regex::new(&format!("^{}$", regex_pattern))
            .map_err(|e| PubSubError::InvalidPattern(e.to_string()))
    }
}

struct TopicChannel {
    sender: broadcast::Sender<MessageEnvelope>,
}

impl TopicChannel {
    fn new(capacity: usize) -> Self {
        let (sender, _) = broadcast::channel(capacity);
        Self { sender }
    }
    
    fn subscribe(&self) -> broadcast::Receiver<MessageEnvelope> {
        self.sender.subscribe()
    }
    
    fn send(&self, message: MessageEnvelope) -> usize {
        match self.sender.send(message) {
            Ok(subscriber_count) => subscriber_count,
            Err(_) => 0, // No subscribers
        }
    }
}

struct PatternSubscription {
    id: usize,
    pattern: String,
    regex: Regex,
    sender: broadcast::Sender<MessageEnvelope>,
}

pub struct EventReceiver {
    receiver: broadcast::Receiver<MessageEnvelope>,
}

impl EventReceiver {
    fn new(receiver: broadcast::Receiver<MessageEnvelope>) -> Self {
        Self { receiver }
    }
    
    pub async fn recv(&mut self) -> Result<MessageEnvelope, PubSubError> {
        self.receiver.recv().await
            .map_err(|e| PubSubError::ReceiveFailed(e.to_string()))
    }
}
```

## Performance Considerations

### Routing Performance Optimization
- **Route Caching**: Cache routing decisions to avoid repeated pattern matching
- **Exact Route Fast Path**: Direct hash lookup for exact routes
- **Pattern Compilation**: Pre-compile regex patterns for reuse
- **Priority Sorting**: Sort routes by priority for efficient matching

### Memory Management
- **Connection Pooling**: Reuse connections to reduce allocation overhead
- **Message Pooling**: Reuse message envelopes to reduce GC pressure
- **Bounded Channels**: Use bounded channels to prevent memory growth
- **Correlation Cleanup**: Automatic cleanup of expired correlations

### Concurrency Optimization
- **Lock-Free Operations**: Use DashMap for concurrent access without locks
- **Async-First Design**: All operations use async/await for non-blocking execution
- **Parallel Delivery**: Deliver messages to multiple endpoints concurrently
- **Batching**: Batch messages for improved throughput

## Error Handling Strategy

### Error Categories
1. **Routing Errors**: No route found, invalid patterns, endpoint unavailable
2. **Correlation Errors**: Missing correlation ID, timeout, correlation not found
3. **Delivery Errors**: Endpoint unreachable, message too large, queue full
4. **System Errors**: Resource exhaustion, configuration errors, internal failures

### Recovery Mechanisms
- **Circuit Breaker**: Prevent cascade failures from unhealthy endpoints
- **Retry Logic**: Automatic retry with exponential backoff for transient errors
- **Graceful Degradation**: Continue operation with reduced functionality
- **Health Monitoring**: Proactive detection and isolation of failing components

---

**Design Complete**: Ready for TESTING phase