### Workspace-Wide Error Handling and Debugging Guide

#### Core Principle: Single Source of Truth

All debugging and error handling patterns in this workspace **MUST** follow the rules defined in this document. Do not duplicate patterns — always refer back here for consistency and easy maintenance.

The shared crate named `common` contains the central definitions. No crate may duplicate or deviate from these patterns.

#### 1. Loud Smart Duck Debugging

Use "Duck Debugging" statements only for temporary, loud, contextual logging during development.

**Rules**:
- Only active in debug builds (e.g., `cargo run`, `cargo nextest run`, `cargo test` — not in `--release`)
- Always use the exact prefix: `[DUCK DEBUGGING]`
- Easy to search globally (`grep "[DUCK DEBUGGING]"`) and remove when no longer needed
- Prefer over scattered `println!` or `log::debug!` without format

**Recommended Pattern**:

```rust
// In any module where you need temporary loud debugging
duck!("Entering function process_user() with id: {}", user_id);
duck!("Database returned: {:?}", rows);
duck!("About to call external API with payload: {:?}", payload);
```

This is implemented via a project-wide `duck!` macro defined in `common::debug`.

You only write `duck!(...)` — never write the `#[cfg(debug_assertions)]` or formatting manually.

**Never do this**:

```rust
println!("debug: ...");        // forbidden
log::debug!("...");            // forbidden without prefix
eprintln!("...");              // forbidden
```

#### 2. Shared Central Components (in crate `common`)

- Central error type: `common::error::AppError`
- Debugging macro: `duck!` (defined in `common::debug`)
- Context helper: `.context()` extension trait (and optionally `with_context`)

#### 3. Error Handling — Always Use Context

**Rule**: Every fallible operation that propagates upward **must** have meaningful context attached.

**What you write (preferred style)**:

```rust
let config = std::fs::read_to_string("config.toml")
    .context("Failed to read main configuration file")?;

let user = db.fetch_user(id)
    .context(format!("Failed to load user with id {}", id))?;

let response = api.call(payload)
    .with_context(|| format!("API call failed for user {}", email))?;
```

**Never do this**:

```rust
.map_err(|e| format!("error: {}", e))  // no context helper
?                                      // bare ? without context
```

These helpers are implemented via a project-wide extension trait defined in `common::error`.

You only write `.context("your message")` or `.with_context(|| ...)` — never manually wrap or format errors the same way twice.

#### 4. Central Error Type Structure (Conceptual Shape)

The main error type in `common::error` **SHOULD** look similar to this:

```rust
pub enum AppError {
    Validation(String),
    Io { source: std::io::Error, context: String },
    Database { source: SomeDbError, context: String },
    ExternalApi { source: ReqwestError, context: String },
    Generic { source: Box<dyn std::error::Error + Send + Sync>, context: String },
}
```

- Every variant carries context
- Specific variants for common categories
- Fallback `Generic` with context for everything else

#### 5. Extension Trait for Context (in `common`)

```rust
pub trait ResultContext<T, E> {
    fn context<C: Into<String>>(self, context: C) -> Result<T, AppError>;
    fn with_context<F: FnOnce() -> String>(self, f: F) -> Result<T, AppError>;
}

impl<T, E> ResultContext<T, E> for Result<T, E>
where
    E: Into<Box<dyn std::error::Error + Send + Sync>>,
{
    fn context<C: Into<String>>(self, context: C) -> Result<T, AppError> {
        self.map_err(|e| AppError::with_context(e, context.into()))
    }

    fn with_context<F: FnOnce() -> String>(self, f: F) -> Result<T, AppError> {
        self.map_err(|e| AppError::with_context(e, f()))
    }
}
```

#### 6. Defining Custom Errors in Other Crates (e.g., crate `crate_b`)

Each crate may have its own specific local error type for internal clarity.

**Step 1** — Define local error enum:

```rust
#[derive(thiserror::Error, Debug)]
pub enum CrateBError {
    #[error("Config parse failed: {0}")]
    ConfigParse(String),

    #[error("Network timeout")]
    NetworkTimeout,

    #[error("Invalid operation in state {current}")]
    InvalidState { current: String },
}
```

**Step 2** — Implement conversion to shared `AppError`:

```rust
use common::error::AppError;

impl From<CrateBError> for AppError {
    fn from(err: CrateBError) -> Self {
        AppError::with_context(err, "Error in crate B subsystem")
    }
}
```

**Step 3** — Use local error inside the crate (with context on local type if desired):

```rust
pub fn do_work() -> Result<String, CrateBError> {
    duck!("Crate B: beginning do_work");

    let config = load_config()
        .context("Failed to load crate B config")?;  // adds context to CrateBError if helper supports it

    Ok("success".to_string())
}
```

**Step 4** — At workspace boundaries (main binary, API layer), use `AppError`:

```rust
use common::AppError;
use crate_b::do_work;

fn handler() -> Result<(), AppError> {
    do_work()?;  // CrateBError automatically converts to AppError
    Ok(())
}
```