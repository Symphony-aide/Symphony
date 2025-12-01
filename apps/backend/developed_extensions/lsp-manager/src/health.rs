/// Health monitoring for LSP servers
///
/// Tracks server health and manages auto-restart logic with exponential backoff.

use std::time::{Duration, Instant};

/// Health monitor for server processes
///
/// Monitors server health through heartbeats and manages restart attempts
/// with exponential backoff strategy.
#[derive(Debug)]
pub struct HealthMonitor {
    /// Last heartbeat timestamp
    last_heartbeat: Instant,

    /// Expected time between heartbeats
    heartbeat_interval: Duration,

    /// Number of restart attempts
    restart_count: u32,

    /// Maximum restart attempts
    max_restarts: u32,

    /// Base delay for exponential backoff (in seconds)
    base_delay: u64,
}

impl HealthMonitor {
    /// Create a new health monitor
    ///
    /// # Arguments
    ///
    /// * `heartbeat_interval` - Expected time between heartbeats
    /// * `max_restarts` - Maximum restart attempts (default: 5)
    ///
    /// # Examples
    ///
    /// ```
    /// use std::time::Duration;
    /// use lsp_manager_symphony::HealthMonitor;
    ///
    /// let monitor = HealthMonitor::new(Duration::from_secs(30), 5);
    /// ```
    pub fn new(heartbeat_interval: Duration, max_restarts: u32) -> Self {
        Self {
            last_heartbeat: Instant::now(),
            heartbeat_interval,
            restart_count: 0,
            max_restarts,
            base_delay: 1, // 1 second base delay
        }
    }

    /// Create a health monitor with default settings
    ///
    /// Uses 30 second heartbeat interval and 5 maximum restarts.
    ///
    /// # Examples
    ///
    /// ```
    /// use lsp_manager_symphony::HealthMonitor;
    ///
    /// let monitor = HealthMonitor::default();
    /// ```
    pub fn default() -> Self {
        Self::new(Duration::from_secs(30), 5)
    }

    /// Record a heartbeat
    ///
    /// Updates the last heartbeat timestamp to indicate the server is alive.
    ///
    /// # Examples
    ///
    /// ```
    /// use lsp_manager_symphony::HealthMonitor;
    ///
    /// let mut monitor = HealthMonitor::default();
    /// monitor.heartbeat();
    /// assert!(monitor.is_healthy());
    /// ```
    pub fn heartbeat(&mut self) {
        self.last_heartbeat = Instant::now();
    }

    /// Check if server is healthy
    ///
    /// Returns `true` if the server has responded within the heartbeat interval.
    ///
    /// # Returns
    ///
    /// `true` if server is healthy, `false` otherwise
    ///
    /// # Examples
    ///
    /// ```
    /// use std::time::Duration;
    /// use lsp_manager_symphony::HealthMonitor;
    ///
    /// let monitor = HealthMonitor::new(Duration::from_secs(1), 5);
    /// assert!(monitor.is_healthy());
    /// ```
    pub fn is_healthy(&self) -> bool {
        self.last_heartbeat.elapsed() < self.heartbeat_interval
    }

    /// Get time since last heartbeat
    ///
    /// Returns the duration since the last heartbeat was recorded.
    ///
    /// # Returns
    ///
    /// Duration since last heartbeat
    pub fn time_since_heartbeat(&self) -> Duration {
        self.last_heartbeat.elapsed()
    }

    /// Record a restart attempt
    ///
    /// Increments the restart counter and returns whether a restart should be attempted.
    ///
    /// # Returns
    ///
    /// `true` if restart should be attempted, `false` if max restarts exceeded
    ///
    /// # Examples
    ///
    /// ```
    /// use lsp_manager_symphony::HealthMonitor;
    ///
    /// let mut monitor = HealthMonitor::default();
    /// assert!(monitor.should_restart());
    /// assert_eq!(monitor.restart_count(), 1);
    /// ```
    pub fn should_restart(&mut self) -> bool {
        if self.restart_count >= self.max_restarts {
            return false;
        }
        self.restart_count += 1;
        true
    }

    /// Get current restart count
    ///
    /// Returns the number of restart attempts that have been made.
    ///
    /// # Returns
    ///
    /// Number of restart attempts
    pub fn restart_count(&self) -> u32 {
        self.restart_count
    }

    /// Get maximum restart attempts
    ///
    /// Returns the maximum number of restart attempts allowed.
    ///
    /// # Returns
    ///
    /// Maximum restart attempts
    pub fn max_restarts(&self) -> u32 {
        self.max_restarts
    }

    /// Reset restart counter
    ///
    /// Resets the restart counter to zero. Should be called when the server
    /// successfully starts and operates normally for a period of time.
    ///
    /// # Examples
    ///
    /// ```
    /// use lsp_manager_symphony::HealthMonitor;
    ///
    /// let mut monitor = HealthMonitor::default();
    /// monitor.should_restart();
    /// assert_eq!(monitor.restart_count(), 1);
    /// monitor.reset_restart_count();
    /// assert_eq!(monitor.restart_count(), 0);
    /// ```
    pub fn reset_restart_count(&mut self) {
        self.restart_count = 0;
    }

    /// Get restart delay with exponential backoff
    ///
    /// Calculates the delay before the next restart attempt using exponential backoff.
    /// Delays: 1s, 2s, 4s, 8s, 16s for attempts 1-5.
    ///
    /// # Returns
    ///
    /// Duration to wait before next restart
    ///
    /// # Examples
    ///
    /// ```
    /// use std::time::Duration;
    /// use lsp_manager_symphony::HealthMonitor;
    ///
    /// let mut monitor = HealthMonitor::default();
    /// monitor.should_restart();
    /// assert_eq!(monitor.get_restart_delay(), Duration::from_secs(1));
    /// monitor.should_restart();
    /// assert_eq!(monitor.get_restart_delay(), Duration::from_secs(2));
    /// ```
    pub fn get_restart_delay(&self) -> Duration {
        if self.restart_count == 0 {
            return Duration::from_secs(0);
        }

        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        let delay_secs = self.base_delay * 2u64.pow(self.restart_count.saturating_sub(1));
        Duration::from_secs(delay_secs)
    }

    /// Check if max restarts exceeded
    ///
    /// Returns `true` if the maximum number of restart attempts has been reached.
    ///
    /// # Returns
    ///
    /// `true` if max restarts exceeded
    pub fn max_restarts_exceeded(&self) -> bool {
        self.restart_count >= self.max_restarts
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::thread;

    #[test]
    fn test_health_monitor_new() {
        let monitor = HealthMonitor::new(Duration::from_secs(10), 3);
        assert!(monitor.is_healthy());
        assert_eq!(monitor.restart_count(), 0);
        assert_eq!(monitor.max_restarts(), 3);
    }

    #[test]
    fn test_health_monitor_default() {
        let monitor = HealthMonitor::default();
        assert!(monitor.is_healthy());
        assert_eq!(monitor.restart_count(), 0);
        assert_eq!(monitor.max_restarts(), 5);
    }

    #[test]
    fn test_heartbeat() {
        let mut monitor = HealthMonitor::new(Duration::from_millis(100), 5);
        thread::sleep(Duration::from_millis(150));
        assert!(!monitor.is_healthy());

        monitor.heartbeat();
        assert!(monitor.is_healthy());
    }

    #[test]
    fn test_is_healthy() {
        let monitor = HealthMonitor::new(Duration::from_secs(1), 5);
        assert!(monitor.is_healthy());

        let mut monitor = HealthMonitor::new(Duration::from_millis(10), 5);
        thread::sleep(Duration::from_millis(20));
        assert!(!monitor.is_healthy());
    }

    #[test]
    fn test_time_since_heartbeat() {
        let monitor = HealthMonitor::default();
        let elapsed = monitor.time_since_heartbeat();
        assert!(elapsed < Duration::from_millis(100));
    }

    #[test]
    fn test_should_restart() {
        let mut monitor = HealthMonitor::new(Duration::from_secs(30), 3);

        assert!(monitor.should_restart());
        assert_eq!(monitor.restart_count(), 1);

        assert!(monitor.should_restart());
        assert_eq!(monitor.restart_count(), 2);

        assert!(monitor.should_restart());
        assert_eq!(monitor.restart_count(), 3);

        // Max restarts reached
        assert!(!monitor.should_restart());
        assert_eq!(monitor.restart_count(), 3);
    }

    #[test]
    fn test_reset_restart_count() {
        let mut monitor = HealthMonitor::default();

        monitor.should_restart();
        monitor.should_restart();
        assert_eq!(monitor.restart_count(), 2);

        monitor.reset_restart_count();
        assert_eq!(monitor.restart_count(), 0);
    }

    #[test]
    fn test_get_restart_delay() {
        let mut monitor = HealthMonitor::default();

        // No restarts yet
        assert_eq!(monitor.get_restart_delay(), Duration::from_secs(0));

        // First restart: 1s
        monitor.should_restart();
        assert_eq!(monitor.get_restart_delay(), Duration::from_secs(1));

        // Second restart: 2s
        monitor.should_restart();
        assert_eq!(monitor.get_restart_delay(), Duration::from_secs(2));

        // Third restart: 4s
        monitor.should_restart();
        assert_eq!(monitor.get_restart_delay(), Duration::from_secs(4));

        // Fourth restart: 8s
        monitor.should_restart();
        assert_eq!(monitor.get_restart_delay(), Duration::from_secs(8));

        // Fifth restart: 16s
        monitor.should_restart();
        assert_eq!(monitor.get_restart_delay(), Duration::from_secs(16));
    }

    #[test]
    fn test_max_restarts_exceeded() {
        let mut monitor = HealthMonitor::new(Duration::from_secs(30), 2);

        assert!(!monitor.max_restarts_exceeded());

        monitor.should_restart();
        assert!(!monitor.max_restarts_exceeded());

        monitor.should_restart();
        assert!(monitor.max_restarts_exceeded());
    }
}
