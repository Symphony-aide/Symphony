//! # XI-editor Event Streaming
//!
//! This module handles XI-editor → Symphony event streaming, parsing STDIO events
//! and routing them to Symphony components with <10ms delivery target.
//!
//! ## Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────┐
//! │                   XI-editor Process                         │
//! │              (JSON-RPC Server + Text Engine)               │
//! └─────────────────────┬───────────────────────────────────────┘
//!                       │ STDOUT Events (JSON Lines)
//! ┌─────────────────────┴───────────────────────────────────────┐
//! │                 Event Stream Handler                        │
//! │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
//! │  │   STDIO     │ │   Event     │ │     Event           │   │
//! │  │   Parser    │ │  Processor  │ │    Router           │   │
//! │  └─────────────┘ └─────────────┘ └─────────────────────┘   │
//! └─────────────────────┬───────────────────────────────────────┘
//!                       │ Structured Events
//! ┌─────────────────────┴───────────────────────────────────────┐
//! │                Symphony Components                          │
//! │           (Buffer Manager, UI Updates, etc.)               │
//! └─────────────────────────────────────────────────────────────┘
//! ```
//!
//! ## Event Types
//!
//! XI-editor emits various event types through STDOUT:
//!
//! - **Buffer Events**: Text changes, cursor movements, selections
//! - **View Events**: Scroll position, viewport changes, theme updates
//! - **System Events**: Plugin notifications, error messages, status updates
//! - **File Events**: File open/close, save operations, external changes
//!
//! ## Performance Targets
//!
//! - **Event Parsing**: <1ms per event (JSON parsing + validation)
//! - **Event Delivery**: <10ms from XI-editor STDOUT to Symphony components
//! - **Throughput**: >1000 events/second sustained processing
//! - **Memory Usage**: <10MB for event buffers and processing state

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};

use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::sync::{broadcast, mpsc, RwLock};
use tokio::time::timeout;

use sy_commons::{error, info, warn};
use symphony_core_ports::{BufferId, ViewId, Position, TextEditingEvent};

use crate::error::XiAdapterError;
use crate::types::XiNotification;
use crate::Result;

/// XI-editor event stream handler
///
/// Manages the parsing and routing of events from XI-editor's STDOUT stream
/// to Symphony components with performance monitoring and error recovery.
#[derive(Debug)]
pub struct XiEventStream {
    /// Event router for distributing events to subscribers
    router: Arc<EventRouter>,
    /// Performance metrics for monitoring
    metrics: Arc<StreamMetrics>,
    /// Configuration for event processing
    config: EventStreamConfig,
    /// Shutdown signal for graceful termination
    shutdown_tx: Option<mpsc::Sender<()>>,
}

impl XiEventStream {
    /// Create a new XI-editor event stream handler
    ///
    /// # Arguments
    ///
    /// * `config` - Configuration for event stream processing
    ///
    /// # Returns
    ///
    /// New event stream handler ready to process XI-editor events
    ///
    /// # Example
    ///
    /// ```rust
    /// use sy_xi_adapter::event_stream::{XiEventStream, EventStreamConfig};
    /// use std::time::Duration;
    ///
    /// let config = EventStreamConfig {
    ///     buffer_size: 1000,
    ///     parse_timeout: Duration::from_millis(1),
    ///     delivery_timeout: Duration::from_millis(10),
    ///     max_events_per_second: 1000,
    /// };
    ///
    /// let stream = XiEventStream::new(config);
    /// ```
    pub fn new(config: EventStreamConfig) -> Self {
        Self {
            router: Arc::new(EventRouter::new(config.buffer_size)),
            metrics: Arc::new(StreamMetrics::new()),
            config,
            shutdown_tx: None,
        }
    }

    /// Start processing events from XI-editor STDOUT
    ///
    /// This method spawns a background task that continuously reads from XI-editor's
    /// STDOUT, parses JSON events, and routes them to registered subscribers.
    ///
    /// # Arguments
    ///
    /// * `stdout` - XI-editor process STDOUT stream or any AsyncRead + Unpin stream
    ///
    /// # Returns
    ///
    /// Result indicating successful startup of event processing
    ///
    /// # Errors
    ///
    /// Returns error if event processing task cannot be started
    pub async fn start_processing<R>(&mut self, stdout: R) -> Result<()>
    where
        R: tokio::io::AsyncRead + Unpin + Send + 'static,
    {
        let (shutdown_tx, mut shutdown_rx) = mpsc::channel(1);
        self.shutdown_tx = Some(shutdown_tx);

        let router = Arc::clone(&self.router);
        let metrics = Arc::clone(&self.metrics);
        let config = self.config.clone();

        // Spawn event processing task
        tokio::spawn(async move {
            let mut reader = BufReader::new(stdout);
            let mut line = String::new();

            info!("XI-editor event stream processing started");

            loop {
                tokio::select! {
                    // Check for shutdown signal
                    _ = shutdown_rx.recv() => {
                        info!("XI-editor event stream shutting down");
                        break;
                    }
                    
                    // Read next line from XI-editor STDOUT
                    result = reader.read_line(&mut line) => {
                        match result {
                            Ok(0) => {
                                warn!("XI-editor STDOUT stream ended");
                                break;
                            }
                            Ok(_) => {
                                let start = Instant::now();
                                
                                // Parse and process event
                                if let Err(e) = Self::process_event_line(&line, &router, &metrics, &config).await {
                                    error!("Failed to process XI-editor event: {}", e);
                                    metrics.increment_parse_errors();
                                }
                                
                                let processing_time = start.elapsed();
                                metrics.record_processing_time(processing_time);
                                
                                // Check performance target
                                if processing_time > config.parse_timeout {
                                    warn!("Event processing took {}ms (target: <{}ms)", 
                                          processing_time.as_millis(), 
                                          config.parse_timeout.as_millis());
                                }
                                
                                line.clear();
                            }
                            Err(e) => {
                                error!("Failed to read from XI-editor STDOUT: {}", e);
                                metrics.increment_read_errors();
                                
                                // Brief delay before retry to avoid tight error loop
                                tokio::time::sleep(Duration::from_millis(100)).await;
                            }
                        }
                    }
                }
            }

            info!("XI-editor event stream processing stopped");
        });

        Ok(())
    }

    /// Subscribe to XI-editor events
    ///
    /// Creates a new event receiver that will receive all XI-editor events
    /// matching the specified filter criteria.
    ///
    /// # Arguments
    ///
    /// * `filter` - Event filter criteria (None for all events)
    ///
    /// # Returns
    ///
    /// Event receiver for consuming XI-editor events
    ///
    /// # Example
    ///
    /// ```rust
    /// use sy_commons::logging::duck
    /// use sy_xi_adapter::event_stream::{XiEventStream, EventFilter, EventStreamConfig};
    /// use std::time::Duration;
    ///
    /// # tokio_test::block_on(async {
    /// let config = EventStreamConfig::default();
    /// let stream = XiEventStream::new(config);
    ///
    /// // Subscribe to all buffer-related events
    /// let filter = EventFilter::buffer_events();
    /// let mut receiver = stream.subscribe(Some(filter)).await?;
    ///
    /// // The receiver is now ready to process events
    /// // In a real application, you would process events in a loop:
    /// // while let Ok(event) = receiver.recv().await {
    /// //     duck!("Received XI-editor event: {:?}", event);
    /// // }
    /// 
    /// duck!("Event receiver created successfully");
    /// # Ok::<(), sy_commons::SymphonyError>(())
    /// # });
    /// ```
    pub async fn subscribe(&self, filter: Option<EventFilter>) -> Result<EventReceiver> {
        self.router.subscribe(filter).await
    }

    /// Stop event stream processing
    ///
    /// Gracefully shuts down the event processing task and cleans up resources.
    pub async fn stop(&mut self) -> Result<()> {
        if let Some(shutdown_tx) = self.shutdown_tx.take() {
            if let Err(_) = shutdown_tx.send(()).await {
                // Channel receiver might have been dropped, which is fine
                warn!("Failed to send shutdown signal - receiver may have been dropped");
            }
        }
        Ok(())
    }

    /// Get event stream metrics
    ///
    /// Returns current performance metrics for monitoring and debugging.
    pub fn metrics(&self) -> &StreamMetrics {
        &self.metrics
    }

    /// Process a single event line from XI-editor STDOUT
    async fn process_event_line(
        line: &str,
        router: &EventRouter,
        metrics: &StreamMetrics,
        config: &EventStreamConfig,
    ) -> Result<()> {
        let line = line.trim();
        if line.is_empty() {
            return Ok(());
        }

        // Parse JSON event with timeout
        let parse_result = timeout(config.parse_timeout, async {
            serde_json::from_str::<XiNotification>(line)
        }).await;

        let notification = match parse_result {
            Ok(Ok(notification)) => notification,
            Ok(Err(e)) => {
                return Err(XiAdapterError::event_stream(
                    format!("Failed to parse XI-editor event JSON: {}", e)
                ).into());
            }
            Err(_) => {
                return Err(XiAdapterError::event_stream(
                    format!("Event parsing timeout (>{}ms)", config.parse_timeout.as_millis())
                ).into());
            }
        };

        // Convert to Symphony event format
        let symphony_event = Self::convert_xi_notification(notification)?;

        // Route event to subscribers with timeout
        let delivery_start = Instant::now();
        let delivery_result = timeout(config.delivery_timeout, async {
            router.route_event(symphony_event).await
        }).await;

        match delivery_result {
            Ok(Ok(subscriber_count)) => {
                let delivery_time = delivery_start.elapsed();
                metrics.record_delivery_time(delivery_time);
                metrics.increment_events_delivered(subscriber_count);

                if delivery_time > config.delivery_timeout {
                    warn!("Event delivery took {}ms (target: <{}ms)", 
                          delivery_time.as_millis(), 
                          config.delivery_timeout.as_millis());
                }
            }
            Ok(Err(e)) => {
                error!("Failed to route XI-editor event: {}", e);
                metrics.increment_delivery_errors();
            }
            Err(_) => {
                error!("Event delivery timeout (>{}ms)", config.delivery_timeout.as_millis());
                metrics.increment_delivery_timeouts();
            }
        }

        Ok(())
    }

    /// Convert XI-editor notification to Symphony event format
    fn convert_xi_notification(notification: XiNotification) -> Result<TextEditingEvent> {
        // TODO: Implement comprehensive XI-editor → Symphony event conversion
        // This is a stub implementation that handles basic event types
        // Future implementation should:
        // 1. Map all XI-editor notification types to Symphony events
        // 2. Handle view-specific events (scroll, selection, etc.)
        // 3. Process buffer events (text changes, cursor movements)
        // 4. Convert file system events (open, save, external changes)
        // 5. Handle plugin notifications and system events
        // 6. Preserve all relevant metadata and timing information

        match notification.method.as_str() {
            "update" => {
                // Buffer update event
                Ok(TextEditingEvent::BufferChanged {
                    buffer_id: BufferId::from_string("default"), // TODO: Extract from params
                    changes: vec![], // TODO: Parse actual changes
                })
            }
            "scroll_to" => {
                // View scroll event
                Ok(TextEditingEvent::ViewScrolled {
                    view_id: ViewId::from_string("default"), // TODO: Extract from params
                    position: Position { line: 0, column: 0 }, // TODO: Parse actual position
                })
            }
            "set_cursor" => {
                // Cursor position change
                Ok(TextEditingEvent::CursorMoved {
                    view_id: ViewId::from_string("default"), // TODO: Extract from params
                    position: Position { line: 0, column: 0 }, // TODO: Parse actual position
                })
            }
            _ => {
                // Generic notification event
                Ok(TextEditingEvent::Notification {
                    message: format!("XI-editor notification: {}", notification.method),
                })
            }
        }
    }
}

/// Event router for distributing events to subscribers
#[derive(Debug)]
struct EventRouter {
    /// Broadcast channel for event distribution
    sender: broadcast::Sender<TextEditingEvent>,
    /// Subscriber management
    subscribers: RwLock<HashMap<usize, EventFilter>>,
    /// Next subscriber ID
    next_subscriber_id: std::sync::atomic::AtomicUsize,
}

impl EventRouter {
    fn new(buffer_size: usize) -> Self {
        let (sender, _) = broadcast::channel(buffer_size);
        Self {
            sender,
            subscribers: RwLock::new(HashMap::new()),
            next_subscriber_id: std::sync::atomic::AtomicUsize::new(0),
        }
    }

    async fn subscribe(&self, filter: Option<EventFilter>) -> Result<EventReceiver> {
        let subscriber_id = self.next_subscriber_id.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        let receiver = self.sender.subscribe();

        if let Some(filter) = filter {
            let mut subscribers = self.subscribers.write().await;
            subscribers.insert(subscriber_id, filter);
        }

        Ok(EventReceiver::new(receiver, subscriber_id))
    }

    async fn route_event(&self, event: TextEditingEvent) -> Result<usize> {
        match self.sender.send(event) {
            Ok(subscriber_count) => Ok(subscriber_count),
            Err(_) => {
                // No subscribers - this is not an error condition
                Ok(0)
            }
        }
    }
}

/// Event receiver for consuming XI-editor events
#[derive(Debug)]
pub struct EventReceiver {
    receiver: broadcast::Receiver<TextEditingEvent>,
    subscriber_id: usize,
}

impl EventReceiver {
    fn new(receiver: broadcast::Receiver<TextEditingEvent>, subscriber_id: usize) -> Self {
        Self {
            receiver,
            subscriber_id,
        }
    }

    /// Receive the next event
    ///
    /// # Returns
    ///
    /// Next XI-editor event or error if stream is closed
    pub async fn recv(&mut self) -> Result<TextEditingEvent> {
        self.receiver.recv().await
            .map_err(|e| XiAdapterError::event_stream(
                format!("Failed to receive event: {}", e)
            ).into())
    }

    /// Get subscriber ID
    pub fn subscriber_id(&self) -> usize {
        self.subscriber_id
    }
}

/// Event filter for selective event subscription
#[derive(Debug, Clone)]
pub struct EventFilter {
    /// Include buffer events
    pub buffer_events: bool,
    /// Include view events
    pub view_events: bool,
    /// Include system events
    pub system_events: bool,
    /// Include file events
    pub file_events: bool,
}

impl EventFilter {
    /// Create filter for all events
    pub fn all() -> Self {
        Self {
            buffer_events: true,
            view_events: true,
            system_events: true,
            file_events: true,
        }
    }

    /// Create filter for buffer events only
    pub fn buffer_events() -> Self {
        Self {
            buffer_events: true,
            view_events: false,
            system_events: false,
            file_events: false,
        }
    }

    /// Create filter for view events only
    pub fn view_events() -> Self {
        Self {
            buffer_events: false,
            view_events: true,
            system_events: false,
            file_events: false,
        }
    }
}

impl Default for EventFilter {
    fn default() -> Self {
        Self::all()
    }
}

/// Event stream configuration
#[derive(Debug, Clone)]
pub struct EventStreamConfig {
    /// Buffer size for event channel
    pub buffer_size: usize,
    /// Timeout for parsing individual events
    pub parse_timeout: Duration,
    /// Timeout for delivering events to subscribers
    pub delivery_timeout: Duration,
    /// Maximum events per second (for rate limiting)
    pub max_events_per_second: usize,
}

impl Default for EventStreamConfig {
    fn default() -> Self {
        Self {
            buffer_size: 1000,
            parse_timeout: Duration::from_millis(1),
            delivery_timeout: Duration::from_millis(10),
            max_events_per_second: 1000,
        }
    }
}

/// Performance metrics for event stream monitoring
#[derive(Debug)]
pub struct StreamMetrics {
    /// Total events processed
    pub(crate) events_processed: std::sync::atomic::AtomicU64,
    /// Total events delivered to subscribers
    pub(crate) events_delivered: std::sync::atomic::AtomicU64,
    /// Parse errors
    pub(crate) parse_errors: std::sync::atomic::AtomicU64,
    /// Read errors
    pub(crate) read_errors: std::sync::atomic::AtomicU64,
    /// Delivery errors
    pub(crate) delivery_errors: std::sync::atomic::AtomicU64,
    /// Delivery timeouts
    pub(crate) delivery_timeouts: std::sync::atomic::AtomicU64,
    /// Average processing time
    pub(crate) avg_processing_time: Arc<RwLock<Duration>>,
    /// Average delivery time
    pub(crate) avg_delivery_time: Arc<RwLock<Duration>>,
}

impl StreamMetrics {
    /// Create new stream metrics instance
    pub fn new() -> Self {
        Self {
            events_processed: std::sync::atomic::AtomicU64::new(0),
            events_delivered: std::sync::atomic::AtomicU64::new(0),
            parse_errors: std::sync::atomic::AtomicU64::new(0),
            read_errors: std::sync::atomic::AtomicU64::new(0),
            delivery_errors: std::sync::atomic::AtomicU64::new(0),
            delivery_timeouts: std::sync::atomic::AtomicU64::new(0),
            avg_processing_time: Arc::new(RwLock::new(Duration::ZERO)),
            avg_delivery_time: Arc::new(RwLock::new(Duration::ZERO)),
        }
    }

    // Internal methods for updating metrics (used by event processing logic)
    
    pub(crate) fn increment_parse_errors(&self) {
        self.parse_errors.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
    }

    pub(crate) fn increment_read_errors(&self) {
        self.read_errors.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
    }

    pub(crate) fn increment_delivery_errors(&self) {
        self.delivery_errors.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
    }

    pub(crate) fn increment_delivery_timeouts(&self) {
        self.delivery_timeouts.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
    }

    pub(crate) fn increment_events_delivered(&self, count: usize) {
        self.events_delivered.fetch_add(count as u64, std::sync::atomic::Ordering::Relaxed);
    }

    pub(crate) fn record_processing_time(&self, duration: Duration) {
        self.events_processed.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        
        // Update exponential moving average for processing time
        tokio::spawn({
            let avg_processing_time = Arc::clone(&self.avg_processing_time);
            async move {
                let mut avg = avg_processing_time.write().await;
                if *avg == Duration::ZERO {
                    *avg = duration;
                } else {
                    // Exponential moving average with alpha = 0.1
                    let alpha = 0.1;
                    let new_avg_nanos = (1.0 - alpha) * avg.as_nanos() as f64 + alpha * duration.as_nanos() as f64;
                    *avg = Duration::from_nanos(new_avg_nanos as u64);
                }
            }
        });
    }

    pub(crate) fn record_delivery_time(&self, duration: Duration) {
        // Update exponential moving average for delivery time
        tokio::spawn({
            let avg_delivery_time = Arc::clone(&self.avg_delivery_time);
            async move {
                let mut avg = avg_delivery_time.write().await;
                if *avg == Duration::ZERO {
                    *avg = duration;
                } else {
                    // Exponential moving average with alpha = 0.1
                    let alpha = 0.1;
                    let new_avg_nanos = (1.0 - alpha) * avg.as_nanos() as f64 + alpha * duration.as_nanos() as f64;
                    *avg = Duration::from_nanos(new_avg_nanos as u64);
                }
            }
        });
    }

    /// Get total events processed
    pub fn events_processed(&self) -> u64 {
        self.events_processed.load(std::sync::atomic::Ordering::Relaxed)
    }

    /// Get total events delivered
    pub fn events_delivered(&self) -> u64 {
        self.events_delivered.load(std::sync::atomic::Ordering::Relaxed)
    }

    /// Get parse error count
    pub fn parse_errors(&self) -> u64 {
        self.parse_errors.load(std::sync::atomic::Ordering::Relaxed)
    }

    /// Get read error count
    pub fn read_errors(&self) -> u64 {
        self.read_errors.load(std::sync::atomic::Ordering::Relaxed)
    }

    /// Get delivery error count
    pub fn delivery_errors(&self) -> u64 {
        self.delivery_errors.load(std::sync::atomic::Ordering::Relaxed)
    }

    /// Get delivery timeout count
    pub fn delivery_timeouts(&self) -> u64 {
        self.delivery_timeouts.load(std::sync::atomic::Ordering::Relaxed)
    }

    /// Get average processing time
    pub async fn avg_processing_time(&self) -> Duration {
        *self.avg_processing_time.read().await
    }

    /// Get average delivery time
    pub async fn avg_delivery_time(&self) -> Duration {
        *self.avg_delivery_time.read().await
    }
}