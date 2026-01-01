//! Topic-based publish/subscribe messaging
//!
//! This module provides high-performance topic-based event distribution with pattern matching
//! and subscriber management.

use std::collections::HashMap;
use std::sync::atomic::AtomicUsize;
use tokio::sync::{broadcast, RwLock};
use regex::Regex;
use sy_commons::debug::duck;

use crate::error::{PubSubResult};
use crate::MessageEnvelope;

/// Event receiver for pub/sub subscriptions
///
/// Provides an interface for receiving events from subscribed topics.
///
/// # Examples
///
/// ```rust
/// # use sy_ipc_bus::{PubSubManager, EventReceiver};
/// # #[tokio::main]
/// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
/// let manager = PubSubManager::new();
/// let mut receiver = manager.subscribe("events.user.*").await?;
/// 
/// // Receive events (this would block until an event is published)
/// // let event = receiver.recv().await?;
/// # Ok(())
/// # }
/// ```
#[derive(Debug)]
pub struct EventReceiver {
    receiver: broadcast::Receiver<MessageEnvelope>,
}

impl EventReceiver {
    /// Create a new event receiver
    const fn new(receiver: broadcast::Receiver<MessageEnvelope>) -> Self {
        Self { receiver }
    }
    
    /// Receive the next event
    ///
    /// # Returns
    ///
    /// The next event message, or an error if receiving fails.
    ///
    /// # Errors
    ///
    /// Returns `PubSubError::ReceiveFailed` if receiving fails or the channel is closed.
    ///
    /// # Examples
    ///
    /// ```rust
    /// # use sy_ipc_bus::{PubSubManager, EventReceiver};
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// let manager = PubSubManager::new();
    /// let mut receiver = manager.subscribe("events.user.*").await?;
    /// 
    /// // This would block until an event is published
    /// // let event = receiver.recv().await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn recv(&mut self) -> PubSubResult<MessageEnvelope> {
        duck!("Receiving event from subscription");
        
        self.receiver.recv().await
            .map_err(|e| crate::error::PubSubError::ReceiveFailed(e.to_string()))
    }
    
    /// Try to receive an event without blocking
    ///
    /// # Returns
    ///
    /// `Some(event)` if an event is available, `None` if no event is ready.
    ///
    /// # Errors
    ///
    /// Returns `PubSubError::ReceiveFailed` if the channel is closed.
    ///
    /// # Examples
    ///
    /// ```rust
    /// # use sy_ipc_bus::{PubSubManager, EventReceiver};
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// let manager = PubSubManager::new();
    /// let mut receiver = manager.subscribe("events.user.*").await?;
    /// 
    /// match receiver.try_recv()? {
    ///     Some(event) => println!("Got event: {:?}", event.message_type),
    ///     None => println!("No event available"),
    /// }
    /// # Ok(())
    /// # }
    /// ```
    pub fn try_recv(&mut self) -> PubSubResult<Option<MessageEnvelope>> {
        duck!("Trying to receive event from subscription");
        
        match self.receiver.try_recv() {
            Ok(message) => Ok(Some(message)),
            Err(broadcast::error::TryRecvError::Empty) => Ok(None),
            Err(broadcast::error::TryRecvError::Closed) => {
                Err(crate::error::PubSubError::ReceiveFailed("Channel closed".to_string()))
            }
            Err(broadcast::error::TryRecvError::Lagged(_)) => {
                // Skip lagged messages and try again
                self.try_recv()
            }
        }
    }
}

/// Topic channel for exact topic subscriptions
struct TopicChannel {
    sender: broadcast::Sender<MessageEnvelope>,
}

impl TopicChannel {
    /// Create a new topic channel
    fn new(capacity: usize) -> Self {
        let (sender, _) = broadcast::channel(capacity);
        Self { sender }
    }
    
    /// Subscribe to this topic
    fn subscribe(&self) -> broadcast::Receiver<MessageEnvelope> {
        self.sender.subscribe()
    }
    
    /// Send an event to all subscribers
    fn send(&self, message: MessageEnvelope) -> usize {
        self.sender.send(message).unwrap_or_default()
    }
}

/// Pattern subscription for wildcard topics
struct PatternSubscription {
    id: usize,
    pattern: String,
    regex: Regex,
    sender: broadcast::Sender<MessageEnvelope>,
}

/// High-performance topic-based publish/subscribe manager
///
/// The `PubSubManager` provides efficient event distribution with support for:
/// - Exact topic matching
/// - Wildcard pattern matching (* and ?)
/// - Hierarchical topic organization
/// - Multiple subscribers per topic
/// - Pattern-based subscriptions
///
/// # Performance
///
/// - <1ms delivery time to all subscribers
/// - Efficient pattern matching with compiled regex
/// - Concurrent event distribution
/// - Bounded channel capacity to prevent memory growth
///
/// # Examples
///
/// ```rust
/// use sy_ipc_bus::PubSubManager;
/// use sy_ipc_protocol::{MessageEnvelope, MessageType};
///
/// #[tokio::main]
/// async fn main() -> Result<(), Box<dyn std::error::Error>> {
///     let manager = PubSubManager::new();
///     
///     // Subscribe to events
///     let mut receiver = manager.subscribe("events.user.*").await?;
///     
///     // Create and publish an event
///     let event = MessageEnvelope::new(
///         MessageType::SystemEvent,
///         b"user created".to_vec(),
///     );
///     
///     let delivered = manager.publish("events.user.created", event).await?;
///     println!("Delivered to {} subscribers", delivered);
///     
///     Ok(())
/// }
/// ```
pub struct PubSubManager {
    /// Exact topic subscriptions
    topics: RwLock<HashMap<String, TopicChannel>>,
    /// Pattern-based subscriptions
    pattern_subscriptions: RwLock<Vec<PatternSubscription>>,
    /// Subscriber ID counter
    subscriber_count: AtomicUsize,
}

impl PubSubManager {
    /// Create a new pub/sub manager
    ///
    /// # Examples
    ///
    /// ```rust
    /// use sy_ipc_bus::PubSubManager;
    ///
    /// let manager = PubSubManager::new();
    /// ```
    #[must_use]
    pub fn new() -> Self {
        duck!("Creating new PubSubManager");
        
        Self {
            topics: RwLock::new(HashMap::new()),
            pattern_subscriptions: RwLock::new(Vec::new()),
            subscriber_count: AtomicUsize::new(0),
        }
    }
    
    /// Subscribe to a topic or pattern
    ///
    /// # Arguments
    ///
    /// * `pattern` - Topic name or pattern (supports * and ? wildcards)
    ///
    /// # Returns
    ///
    /// An `EventReceiver` for receiving events from the subscription.
    ///
    /// # Errors
    ///
    /// Returns `PubSubError::InvalidPattern` if the pattern is malformed.
    ///
    /// # Examples
    ///
    /// ```rust
    /// # use sy_ipc_bus::PubSubManager;
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// let manager = PubSubManager::new();
    /// 
    /// // Exact topic subscription
    /// let receiver1 = manager.subscribe("events.user.created").await?;
    /// 
    /// // Wildcard subscription
    /// let receiver2 = manager.subscribe("events.user.*").await?;
    /// 
    /// // Pattern subscription
    /// let receiver3 = manager.subscribe("events.*.created").await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn subscribe(&self, pattern: &str) -> PubSubResult<EventReceiver> {
        duck!("Subscribing to pattern: {}", pattern);
        
        let subscriber_id = self.subscriber_count.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        
        if Self::is_pattern(pattern) {
            // Pattern subscription
            let (tx, rx) = broadcast::channel(1000);
            let subscription = PatternSubscription {
                id: subscriber_id,
                pattern: pattern.to_string(),
                regex: Self::compile_pattern(pattern)?,
                sender: tx,
            };
            
            self.pattern_subscriptions.write().await.push(subscription);
            
            Ok(EventReceiver::new(rx))
        } else {
            // Exact topic subscription
            let mut topics = self.topics.write().await;
            let topic_channel = topics.entry(pattern.to_string())
                .or_insert_with(|| TopicChannel::new(1000));
            
            let receiver = topic_channel.subscribe();
            drop(topics);
            Ok(EventReceiver::new(receiver))
        }
    }
    
    /// Publish an event to a topic
    ///
    /// # Arguments
    ///
    /// * `topic` - The topic to publish to
    /// * `message` - The event message to publish
    ///
    /// # Returns
    ///
    /// The number of subscribers that received the event.
    ///
    /// # Errors
    ///
    /// Returns `PubSubError::PublishFailed` if publishing fails.
    ///
    /// # Examples
    ///
    /// ```rust
    /// # use sy_ipc_bus::PubSubManager;
    /// # use sy_ipc_protocol::{MessageEnvelope, MessageType};
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// let manager = PubSubManager::new();
    /// 
    /// let event = MessageEnvelope::new(
    ///     MessageType::SystemEvent,
    ///     b"user created".to_vec(),
    /// );
    /// 
    /// let delivered = manager.publish("events.user.created", event).await?;
    /// println!("Delivered to {} subscribers", delivered);
    /// # Ok(())
    /// # }
    /// ```
    pub async fn publish(&self, topic: &str, message: MessageEnvelope) -> PubSubResult<usize> {
        duck!("Publishing to topic: {}", topic);
        
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
                    duck!("Pattern '{}' matches topic '{}'", subscription.pattern, topic);
                    if let Ok(count) = subscription.sender.send(message.clone()) {
                        delivered_count += count;
                    }
                }
            }
        }
        
        let publish_time = start.elapsed();
        if publish_time > std::time::Duration::from_millis(1) {
            duck!("Pub/sub publish took {}ms (target: <1ms)", publish_time.as_millis());
        }
        
        Ok(delivered_count)
    }
    
    /// Unsubscribe from a topic
    ///
    /// # Arguments
    ///
    /// * `subscriber_id` - The subscriber ID to unsubscribe
    ///
    /// # Errors
    ///
    /// Returns `PubSubError::SubscriptionNotFound` if the subscription doesn't exist.
    ///
    /// # Examples
    ///
    /// ```rust
    /// # use sy_ipc_bus::PubSubManager;
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// let manager = PubSubManager::new();
    /// let receiver = manager.subscribe("events.user.*").await?;
    /// 
    /// // Unsubscribe (subscriber_id would be tracked separately)
    /// // manager.unsubscribe(subscriber_id).await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn unsubscribe(&self, subscriber_id: usize) -> PubSubResult<()> {
        duck!("Unsubscribing subscriber: {}", subscriber_id);
        
        let mut pattern_subs = self.pattern_subscriptions.write().await;
        let initial_len = pattern_subs.len();
        pattern_subs.retain(|sub| sub.id != subscriber_id);
        
        if pattern_subs.len() < initial_len {
            Ok(())
        } else {
            Err(crate::error::PubSubError::SubscriptionNotFound(subscriber_id))
        }
    }
    
    /// Get the number of subscribers for a topic
    ///
    /// # Arguments
    ///
    /// * `topic` - The topic to check
    ///
    /// # Returns
    ///
    /// The number of subscribers for the topic.
    ///
    /// # Examples
    ///
    /// ```rust
    /// # use sy_ipc_bus::PubSubManager;
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// let manager = PubSubManager::new();
    /// let receiver = manager.subscribe("events.user.created").await?;
    /// 
    /// let count = manager.subscriber_count("events.user.created").await;
    /// println!("Topic has {} subscribers", count);
    /// # Ok(())
    /// # }
    /// ```
    pub async fn subscriber_count(&self, topic: &str) -> usize {
        duck!("Getting subscriber count for topic: {}", topic);
        
        let mut count = 0;
        
        // Count exact topic subscribers
        {
            let topics = self.topics.read().await;
            if let Some(topic_channel) = topics.get(topic) {
                count += topic_channel.sender.receiver_count();
            }
        }
        
        // Count pattern subscribers that match this topic
        {
            let pattern_subs = self.pattern_subscriptions.read().await;
            for subscription in pattern_subs.iter() {
                if subscription.regex.is_match(topic) {
                    count += subscription.sender.receiver_count();
                }
            }
        }
        
        count
    }
    
    /// Get the total number of active subscriptions
    ///
    /// # Returns
    ///
    /// The total number of active subscriptions (exact + pattern).
    ///
    /// # Examples
    ///
    /// ```rust
    /// # use sy_ipc_bus::PubSubManager;
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// let manager = PubSubManager::new();
    /// let receiver1 = manager.subscribe("events.user.created").await?;
    /// let receiver2 = manager.subscribe("events.user.*").await?;
    /// 
    /// let total = manager.total_subscriptions().await;
    /// println!("Total subscriptions: {}", total);
    /// # Ok(())
    /// # }
    /// ```
    pub async fn total_subscriptions(&self) -> usize {
        let exact_count = self.topics.read().await.len();
        let pattern_count = self.pattern_subscriptions.read().await.len();
        exact_count + pattern_count
    }
    
    /// Check if a pattern contains wildcards or regex characters
    fn is_pattern(pattern: &str) -> bool {
        pattern.contains('*') || pattern.contains('?') || pattern.contains('[') || pattern.contains('^') || pattern.contains('$')
    }
    
    /// Compile a glob pattern to regex
    fn compile_pattern(pattern: &str) -> PubSubResult<Regex> {
        // Validate pattern first
        if pattern.is_empty() {
            return Err(crate::error::PubSubError::InvalidPattern("Pattern cannot be empty".to_string()));
        }
        
        // Check for invalid regex characters that would cause compilation to fail
        // Common problematic patterns: unmatched brackets, invalid escapes, etc.
        if pattern.contains('[') && !pattern.contains(']') {
            return Err(crate::error::PubSubError::InvalidPattern("Unmatched bracket in pattern".to_string()));
        }
        
        let regex_pattern = pattern
            .replace('*', ".*")
            .replace('?', ".");
        
        Regex::new(&format!("^{regex_pattern}$"))
            .map_err(|e| crate::error::PubSubError::InvalidPattern(e.to_string()))
    }
}

impl Default for PubSubManager {
    fn default() -> Self {
        Self::new()
    }
}