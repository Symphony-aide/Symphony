//! Automatic reconnection with exponential backoff
//!
//! Provides automatic reconnection functionality with configurable
//! retry strategies and failure detection.

use crate::traits::{Transport, Connection};
use crate::error::TransportError;
use std::time::Duration;

/// Reconnection strategy configuration
#[derive(Debug, Clone)]
pub struct ReconnectStrategy {
    /// Initial delay before first retry
    pub initial_delay: Duration,
    /// Maximum delay between retries
    pub max_delay: Duration,
    /// Multiplier for exponential backoff
    pub multiplier: f64,
    /// Maximum number of retry attempts (None = unlimited)
    pub max_attempts: Option<u32>,
    /// Jitter factor to prevent thundering herd (0.0 to 1.0)
    pub jitter_factor: f64,
}

impl Default for ReconnectStrategy {
    fn default() -> Self {
        Self {
            initial_delay: Duration::from_millis(100),
            max_delay: Duration::from_secs(30),
            multiplier: 2.0,
            max_attempts: Some(10),
            jitter_factor: 0.1,
        }
    }
}

/// Reconnection state
#[derive(Debug, Clone)]
pub enum ReconnectState {
    /// Connected and healthy
    Connected,
    /// Disconnected, attempting to reconnect
    Reconnecting {
        /// Current reconnection attempt number
        attempt: u32,
        /// When the next retry should be attempted
        next_retry: std::time::Instant,
    },
    /// Failed after exhausting all retry attempts
    Failed {
        /// Error message from the last failed attempt
        last_error: String,
        /// When the reconnection attempts were exhausted
        failed_at: std::time::Instant,
    },
}

/// Reconnecting transport wrapper
pub struct ReconnectingTransport<T: Transport> {
    inner: T,
    config: T::Config,
    strategy: ReconnectStrategy,
    state: ReconnectState,
    current_connection: Option<T::Connection>,
}

impl<T: Transport> ReconnectingTransport<T> {
    /// Create a new reconnecting transport wrapper
    #[allow(clippy::missing_const_for_fn)]
    pub fn new(transport: T, config: T::Config, strategy: ReconnectStrategy) -> Self {
        Self {
            inner: transport,
            config,
            strategy,
            state: ReconnectState::Connected,
            current_connection: None,
        }
    }
    
    /// Ensure the transport is connected, reconnecting if necessary
    pub async fn ensure_connected(&mut self) -> Result<&mut T::Connection, TransportError> {
        // First, check if we have a healthy connection
        let connection_healthy = if let Some(ref mut connection) = self.current_connection {
            connection.is_healthy().await
        } else {
            false
        };
        
        if connection_healthy && matches!(self.state, ReconnectState::Connected) {
            // We have a healthy connection, return it
            #[allow(clippy::expect_used)]
            return Ok(self.current_connection.as_mut().expect("Connection should exist when state is Connected"));
        }
        
        // Handle reconnection logic
        match &self.state {
            ReconnectState::Connected => {
                // Connection became unhealthy, start reconnecting
                self.start_reconnecting();
            }
            ReconnectState::Reconnecting { next_retry, .. } => {
                if std::time::Instant::now() >= *next_retry {
                    self.attempt_reconnect().await?;
                    // Check if reconnection was successful
                    if matches!(self.state, ReconnectState::Connected) {
                        #[allow(clippy::expect_used)]
                        return Ok(self.current_connection.as_mut().expect("Connection should exist when state is Connected"));
                    }
                }
            }
            ReconnectState::Failed { .. } => {
                return Err(TransportError::ConnectionFailed {
                    message: "Reconnection failed after exhausting all attempts".to_string(),
                });
            }
        }
        
        // If we get here, we're still reconnecting
        Err(TransportError::ConnectionFailed {
            message: "Currently reconnecting".to_string(),
        })
    }
    
    /// Start the reconnection process
    fn start_reconnecting(&mut self) {
        self.current_connection = None;
        self.state = ReconnectState::Reconnecting {
            attempt: 0,
            next_retry: std::time::Instant::now(),
        };
    }
    
    /// Attempt to reconnect
    #[allow(clippy::cast_precision_loss, clippy::cast_possible_truncation, clippy::cast_sign_loss, clippy::cast_possible_wrap)]
    async fn attempt_reconnect(&mut self) -> Result<(), TransportError> {
        // Extract the current attempt number to avoid borrowing conflicts
        let current_attempt = if let ReconnectState::Reconnecting { attempt, .. } = &self.state {
            *attempt
        } else {
            return Err(TransportError::ConnectionFailed {
                message: "Not in reconnecting state".to_string(),
            });
        };
        
        let new_attempt = current_attempt + 1;
        
        // Check if we've exceeded max attempts
        if let Some(max_attempts) = self.strategy.max_attempts {
            if new_attempt > max_attempts {
                self.state = ReconnectState::Failed {
                    last_error: "Max reconnection attempts exceeded".to_string(),
                    failed_at: std::time::Instant::now(),
                };
                return Err(TransportError::ConnectionFailed {
                    message: "Max reconnection attempts exceeded".to_string(),
                });
            }
        }
        
        // Attempt to connect
        match self.inner.connect(&self.config).await {
            Ok(connection) => {
                self.current_connection = Some(connection);
                self.state = ReconnectState::Connected;
                sy_commons::debug::duck!("Reconnection successful after {} attempts", new_attempt);
                Ok(())
            }
            Err(e) => {
                // Calculate next retry delay with exponential backoff and jitter
                let base_delay = self.strategy.initial_delay.as_millis() as f64
                    * self.strategy.multiplier.powi((new_attempt - 1) as i32);
                let max_delay = self.strategy.max_delay.as_millis() as f64;
                let delay = base_delay.min(max_delay);
                
                // Add jitter to prevent thundering herd
                let jitter = delay * self.strategy.jitter_factor * rand::random::<f64>();
                let final_delay = Duration::from_millis((delay + jitter) as u64);
                
                self.state = ReconnectState::Reconnecting {
                    attempt: new_attempt,
                    next_retry: std::time::Instant::now() + final_delay,
                };
                
                sy_commons::debug::duck!("Reconnection attempt {} failed, retrying in {:?}", new_attempt, final_delay);
                Err(e)
            }
        }
    }
    
    /// Get the current reconnection state
    pub const fn state(&self) -> &ReconnectState {
        &self.state
    }
    
    /// Reset the reconnection state (force reconnect)
    pub fn reset(&mut self) {
        self.start_reconnecting();
    }
}

/// Calculate exponential backoff delay with jitter
#[must_use]
#[allow(clippy::cast_precision_loss, clippy::cast_possible_wrap, clippy::cast_possible_truncation, clippy::cast_sign_loss)]
pub fn calculate_backoff_delay(
    attempt: u32,
    initial_delay: Duration,
    max_delay: Duration,
    multiplier: f64,
    jitter_factor: f64,
) -> Duration {
    let base_delay = initial_delay.as_millis() as f64 * multiplier.powi(attempt as i32);
    let max_delay_ms = max_delay.as_millis() as f64;
    let delay = base_delay.min(max_delay_ms);
    
    // Add jitter to prevent thundering herd
    let jitter = delay * jitter_factor * rand::random::<f64>();
    Duration::from_millis((delay + jitter) as u64)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;
    
    
    #[cfg(feature = "unit")]
    #[test]
    fn test_reconnect_strategy_default() {
        let strategy = ReconnectStrategy::default();
        assert_eq!(strategy.initial_delay, Duration::from_millis(100));
        assert_eq!(strategy.max_delay, Duration::from_secs(30));
        #[allow(clippy::float_cmp)]
        {
            assert_eq!(strategy.multiplier, 2.0);
        }
        assert_eq!(strategy.max_attempts, Some(10));
        #[allow(clippy::float_cmp)]
        {
            assert_eq!(strategy.jitter_factor, 0.1);
        }
    }
    
    #[cfg(feature = "unit")]
    #[test]
    fn test_calculate_backoff_delay() {
        let initial_delay = Duration::from_millis(100);
        let max_delay = Duration::from_secs(30);
        let multiplier = 2.0;
        let jitter_factor = 0.0; // No jitter for predictable testing
        
        // First attempt
        let delay1 = calculate_backoff_delay(0, initial_delay, max_delay, multiplier, jitter_factor);
        assert_eq!(delay1, Duration::from_millis(100));
        
        // Second attempt
        let delay2 = calculate_backoff_delay(1, initial_delay, max_delay, multiplier, jitter_factor);
        assert_eq!(delay2, Duration::from_millis(200));
        
        // Third attempt
        let delay3 = calculate_backoff_delay(2, initial_delay, max_delay, multiplier, jitter_factor);
        assert_eq!(delay3, Duration::from_millis(400));
    }
    
    #[cfg(feature = "unit")]
    #[test]
    fn test_backoff_delay_max_cap() {
        let initial_delay = Duration::from_millis(100);
        let max_delay = Duration::from_millis(500);
        let multiplier = 2.0;
        let jitter_factor = 0.0;
        
        // Large attempt number should be capped at max_delay
        let delay = calculate_backoff_delay(10, initial_delay, max_delay, multiplier, jitter_factor);
        assert_eq!(delay, max_delay);
    }
}