//! Basic usage example

use sylogging::{init_logging, LogConfig};
use tracing::{debug, error, info, warn};

fn main() {
    // Initialize with environment variables
    let cfg = LogConfig::from_env();
    let _guard = init_logging(&cfg);

    info!("Application started");
    debug!("Debug information");
    warn!("Warning message");
    error!("Error occurred");
}
