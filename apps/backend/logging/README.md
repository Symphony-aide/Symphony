# Symphony Logging

Centralized logging and tracing system for Symphony.

Simple, reliable logging foundation for Symphony - "Good Enough to Start"

## Features

✅ **Basic Log Levels**: DEBUG, INFO, WARN, ERROR  
✅ **Environment Configuration**: Simple env vars only  
✅ **Two Output Modes**: Development (colored console) & Production (JSON)  
✅ **Essential Fields**: timestamp, level, message, component  
✅ **Crash Handler**: Automatic panic logging with stack traces  

## Quick Start

```rust
use sylogging::{init_logging, LogConfig};
use tracing::{info, warn, error, debug};

fn main() {
    // Initialize logging
    let cfg = LogConfig::from_env();
    init_logging(&cfg);
    
    // Use it
    info!("Application started");
    warn!("Warning message");
    error!("Error occurred");
    debug!("Debug info");
}
```

## Configuration

All configuration via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `SYMPHONY_LOG_LEVEL` | `info` | Log level: `debug`, `info`, `warn`, `error` |
| `SYMPHONY_LOG_FORMAT` | `console` | Output format: `console` (colored) or `json` |
| `SYMPHONY_LOG_FILE` | None | Optional file path for JSON logs |

### Examples

**Development (colored console):**
```bash
export SYMPHONY_LOG_LEVEL=debug
cargo run
```

**Production (JSON to file):**
```bash
export SYMPHONY_LOG_LEVEL=info
export SYMPHONY_LOG_FORMAT=json
export SYMPHONY_LOG_FILE=symphony.log
cargo run
```

## Handlers

### Console Handler
- Colored, pretty-printed output
- Perfect for development
- Automatically enabled when `SYMPHONY_LOG_FORMAT=console` (default)

### File Handler
- JSON format for easy parsing
- Single file output
- Enabled with `SYMPHONY_LOG_FORMAT=json` + `SYMPHONY_LOG_FILE`

### Crash Handler
- Automatically captures panics
- Logs full stack traces
- Always enabled

## Testing

```bash
cd apps/backend/logging
cargo run
```

## Dependencies

```toml
[dependencies]
sylogging = { path = "../logging" }
tracing = "0.1"