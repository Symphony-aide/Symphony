# Symphony Logging

Centralized logging and tracing system for Symphony.

Simple, reliable logging foundation for Symphony - "Good Enough to Start"

## Features

✅ **Basic Log Levels**: DEBUG, INFO, WARN, ERROR  
✅ **Environment Configuration**: Simple env vars + `.env` file support  
✅ **Cross-Platform**: Works on Windows, Linux, and macOS  
✅ **Two Output Modes**: Development (colored console) & Production (JSON)  
✅ **Essential Fields**: timestamp, level, message, component  
✅ **Crash Handler**: Automatic panic logging with stack traces  
✅ **Async Non-Blocking**: File writes don't block your application  
✅ **Graceful Degradation**: Falls back to console if file logging fails  

## Quick Start

```rust
use sylogging::{init_logging, LogConfig};
use tracing::{info, warn, error, debug};

fn main() {
    // Initialize async logging
    let cfg = LogConfig::from_env();
    
    // Option 1: Keep the guard (recommended for production)
    let _guard = init_logging(&cfg);
    
    // Option 2: Ignore the guard (simpler, but logs might not flush on crash)
    // init_logging(&cfg);
    
    // Use it - all writes are non-blocking!
    info!("Application started");
    warn!("Warning message");
    error!("Error occurred");
    debug!("Debug info");
    
    // _guard dropped here, flushing all pending logs
}
```

## Configuration

All configuration via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `SYMPHONY_LOG_LEVEL` | `info` | Log level: `debug`, `info`, `warn`, `error` |
| `SYMPHONY_LOG_FORMAT` | `console` | Output format: `console` (colored) or `json` |
| `SYMPHONY_LOG_FILE` | None | Optional file path for JSON logs |

### Using .env File (Recommended)

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` with your settings:
```bash
SYMPHONY_LOG_LEVEL=debug
SYMPHONY_LOG_FORMAT=console
# SYMPHONY_LOG_FILE=logs/symphony.log
```

3. Run your application - it will automatically load `.env`:
```bash
cargo run
```

### Manual Configuration (Cross-Platform)

**Linux/macOS:**
```bash
# Development (colored console)
export SYMPHONY_LOG_LEVEL=debug
cargo run

# Production (JSON to file)
export SYMPHONY_LOG_LEVEL=info
export SYMPHONY_LOG_FORMAT=json
export SYMPHONY_LOG_FILE=symphony.log
cargo run
```

**Windows (PowerShell):**
```powershell
# Development (colored console)
$env:SYMPHONY_LOG_LEVEL='debug'
cargo run

# Production (JSON to file)
$env:SYMPHONY_LOG_LEVEL='info'
$env:SYMPHONY_LOG_FORMAT='json'
$env:SYMPHONY_LOG_FILE='symphony.log'
cargo run
```

**Windows (CMD):**
```cmd
REM Development (colored console)
set SYMPHONY_LOG_LEVEL=debug
cargo run

REM Production (JSON to file)
set SYMPHONY_LOG_LEVEL=info
set SYMPHONY_LOG_FORMAT=json
set SYMPHONY_LOG_FILE=symphony.log
cargo run
```

## Handlers

### Console Handler
- Colored, pretty-printed output
- Perfect for development
- Automatically enabled when `SYMPHONY_LOG_FORMAT=console` (default)

### File Handler
- **Async non-blocking writes** - won't slow down your app
- JSON format for easy parsing
- Single file output
- Automatic flush on program exit via `WorkerGuard`
- Graceful fallback to console if file can't be opened
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