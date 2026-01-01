# Logging Best Practices: DO's and DON'Ts

## 1. LOG STRUCTURE

### ✅ DO: Emit ONE wide event per request at the end
**Explanation:** Create a single structured log entry that contains ALL context about the request. Emit it at the very end of request processing (or in a `finally` block).

**Example:**
```python
logger.info("checkout_completed", {
    "request_id": "req_123",
    "user_id": "usr_456",
    "user_subscription": "premium",
    "cart_total_cents": 16000,
    "status_code": 200,
    "duration_ms": 892
})
```

**Why:** All information is in one place, making queries simple and fast. No need to correlate multiple log lines.

---

### ❌ DON'T: Scatter multiple log lines throughout request processing
**Explanation:** Never log incrementally as your code executes. This creates 5-30 separate log entries mixed with thousands of other requests.

**Bad Example:**
```python
logger.info("User starting checkout")
logger.debug("Processing payment")
logger.info("Payment successful")
logger.debug("Updating inventory")
```

**Why it's bad:** During incidents, developers waste time searching and manually correlating these scattered logs. Impossible to query effectively.

---

### ✅ DO: Use consistent, structured field names across all services
**Explanation:** Use the exact same field names everywhere. Always `user_id`, never sometimes `userId` or `user` or `uid`.

**Example:**
```python
# Service A
{"user_id": "123", "request_id": "req_abc"}

# Service B  
{"user_id": "123", "request_id": "req_abc"}  # Same names!
```

**Why:** Enables queries across multiple services. Makes aggregations and dashboards possible.

---

### ❌ DON'T: Use only severity levels (INFO/WARN/ERROR) without context
**Explanation:** Severity levels alone tell you nothing about the business impact or user affected.

**Bad Example:**
```python
logger.error("Payment failed")  # Who? Why? What tier user?
```

**Why it's bad:** Cannot answer critical questions like "Which premium users are affected?" or "Is this related to a specific payment provider?"

---

## 2. CONTEXT INCLUSION

### ✅ DO: Include business context in every log
**Explanation:** Add user tier, subscription level, account age, lifetime value, transaction amounts—anything that helps answer business questions.

**Example:**
```python
{
    "user_id": "usr_123",
    "user_subscription": "premium",
    "user_lifetime_value_cents": 1500000,
    "user_account_age_days": 1095,
    "cart_total_cents": 16000,
    "cart_item_count": 3
}
```

**Why:** Enables queries like "Show errors affecting premium users" or "Find failed high-value transactions."

---

### ✅ DO: Include feature flags in every log
**Explanation:** Record which feature flags or experiments are active for this request.

**Why:** During rollouts, you can immediately see if new features are causing issues. Query: "Show errors where new_checkout_ui=true"

---

### ✅ DO: Include technical performance metrics
**Explanation:** Record database queries, cache hits/misses, external API calls, latencies.

**Example:**
```python
{
    "database_queries": 7,
    "database_duration_ms": 120,
}
```

**Why:** Helps identify performance bottlenecks. Can query "Show requests with >10 database queries."

---

### ❌ DON'T: Rely only on auto-instrumentation from OpenTelemetry
**Explanation:** Auto-instrumentation captures technical spans but has zero business context. It doesn't know about user tiers, cart values, or feature flags.

**Why it's bad:** You get "bad telemetry in a standardized format." Still can't answer business questions.

---

## 3. SAMPLING STRATEGY

### ✅ DO: Always log errors (100% sampling)
**Explanation:** Keep every single request with `status_code >= 500` or any exception.

**Example:**
```python
if status_code >= 500:
    should_log = True  # Always keep errors
```

**Why:** Errors are critical for debugging. Never risk losing error context to sampling.

---

### ✅ DO: Always log slow requests (100% sampling)
**Explanation:** Keep every request that exceeds your p99 latency threshold.

**Example:**
```python
if duration_ms > p99_threshold:  # e.g., 2000ms
    should_log = True
```

**Why:** Performance issues need investigation. Slow requests are rare but important.

---

### ✅ DO: Randomly sample remaining traffic at 1-5%
**Explanation:** For normal, successful requests from regular users, keep only a small percentage.

**Example:**
```
should_log = (
    status_code >= 500 or
    duration_ms > p99_threshold or
    user.is_vip or
    any(feature_flags.values()) or
    random.random() < 0.05  # 5% of remaining
)
```

**Why:** Reduces log volume by 95% while keeping all important events.

---

### ❌ DON'T: Use only random sampling for everything
**Explanation:** Never sample randomly without considering importance. This discards critical debugging data.

**Bad Example:**
```python
if random.random() < 0.05:  # Sampling EVERYTHING randomly
    logger.info(...)
```

**Why it's bad:** You'll lose the exact error case or VIP user issue you need to debug.

---

## 4. HANDLING EXPENSIVE CALCULATIONS

### ✅ DO: Calculate expensive values once in business logic, reuse in logs
**Explanation:** If you need a value for your business logic, calculate it once and store in request context. Then reuse the same value in your log—don't recalculate.

**Example:**
```python
class RequestContext:
    def __init__(self, user_id):
        self.user_id = user_id
        self._ltv = None
    
    @property
    def user_lifetime_value(self):
        if self._ltv is None:
            self._ltv = calculate_lifetime_value(self.user_id)  # Expensive!
        return self._ltv

# In your handler
context = RequestContext(request.user.id)

# Business logic uses it
if context.user_lifetime_value > 10000:
    apply_vip_discount()

# Log reuses it (no recalculation!)
logger.info("checkout", {
    "user_ltv": context.user_lifetime_value  # Already calculated
})
```

**Why:** Zero performance penalty. You're already calculating it for business logic. The "cache" is just avoiding recalculation within the same request—not "caching for logs."

---

### ✅ DO: Calculate expensive values only when you'll actually log
**Explanation:** If a value is ONLY needed for logging (not business logic), calculate it only when the sampling decision says you'll keep the log.

**Example:**
```python
should_log = (status_code >= 500 or user.is_vip or random.random() < 0.05)

if should_log:
    # NOW calculate expensive stuff
    fraud_score = run_fraud_detection(transaction)  # Expensive!
    
    logger.info("checkout", {
        "fraud_score": fraud_score
    })
```

**Why:** Avoids expensive calculations for 95% of requests that won't be logged.

---

### ✅ DO: Use tiered context based on event importance
**Explanation:** Include different levels of detail depending on whether it's an error, VIP user, or normal request.

**Example:**
```python
def build_context(request, tier="minimal"):
    context = {
        "request_id": request.id,
        "status_code": request.status
    }
    
    if tier in ["standard", "detailed"]:
        context["user_ltv"] = calculate_ltv(request.user)  # Moderately expensive
    
    if tier == "detailed":
        context["fraud_score"] = run_fraud_analysis(request)  # Very expensive
    
    return context

# Usage
if status_code >= 500:
    log_context = build_context(request, "detailed")
elif user.is_vip:
    log_context = build_context(request, "standard")
else:
    log_context = build_context(request, "minimal")
```

**Why:** Errors get maximum detail. VIPs get good detail. Normal requests get basic detail. Balances performance and observability.

---

### ❌ DON'T: Calculate expensive values unconditionally for every request
**Explanation:** Never calculate expensive values before checking if you'll actually log.

**Bad Example:**
```python
user_ltv = calculate_lifetime_value(user)  # Calculated for ALL requests!
fraud_score = run_fraud_detection(transaction)  # Expensive for ALL!

if should_log:
    logger.info("checkout", {
        "user_ltv": user_ltv,
        "fraud_score": fraud_score
    })
```

**Why it's bad:** You're doing expensive work for 95% of requests that won't even be logged.

---

### ❌ DON'T: Skip critical context just to avoid performance cost
**Explanation:** Never sacrifice important debugging information to save a few milliseconds. Find a smarter solution.

**Bad Example:**
```python
logger.info("payment_failed", {
    "user_id": user.id
    # Missing: Why? What tier user? What amount?
})
```

**Why it's bad:** During incidents, you'll regret not having the context. Use one of the DO strategies above instead.

---

## 6. SMART LAYER USAGE (Rust/Tracing Specific)

### ✅ DO: Use multiple logging layers strategically
**Explanation:** Configure different output destinations for different purposes. Each layer serves a specific need in your observability stack.

**Example:**
```rust
use sy_commons::logging::*;

let config = LoggingConfig {
    level: "info".to_string(),
    console: ConsoleConfig {
        enabled: true,           // ✅ Real-time development feedback
        format: ConsoleFormat::Pretty,
        colors: true,
    },
    file: Some(FileConfig {
        enabled: true,           // ✅ Persistent storage with rotation
        path: PathBuf::from("logs/app.log"),
        rotation: RotationConfig::Daily,
        max_files: 7,
    }),
    json: Some(JsonConfig {
        enabled: true,           // ✅ Structured data for log aggregation
        path: Some(PathBuf::from("logs/structured.json")),
        include_spans: true,
    }),
};
```

**Why:** Each layer optimizes for different use cases:
- **Console**: Immediate feedback during development
- **File**: Historical analysis and debugging
- **JSON**: Integration with log aggregation systems (ELK, Splunk, etc.)

---

### ✅ DO: Configure layers based on environment
**Explanation:** Production, staging, and development environments need different logging strategies.

**Example:**
```rust
let config = match env::var("ENVIRONMENT").as_deref() {
    Ok("production") => LoggingConfig {
        level: "warn".to_string(),
        console: ConsoleConfig { enabled: false, .. },  // No console spam
        file: Some(FileConfig { 
            enabled: true,
            rotation: RotationConfig::Daily,  // Manage disk space
            .. 
        }),
        json: Some(JsonConfig { enabled: true, .. }),   // For monitoring
    },
    Ok("development") => LoggingConfig {
        level: "debug".to_string(),
        console: ConsoleConfig { 
            enabled: true,
            format: ConsoleFormat::Pretty,    // Readable for humans
            colors: true,
        },
        file: None,                          // Skip file overhead
        json: None,                          // Skip JSON overhead
    },
    _ => // staging config
};
```

**Why:** Production needs efficiency and monitoring integration. Development needs immediate, readable feedback.

---

### ✅ DO: Use automatic fallbacks for reliability
**Explanation:** Symphony's logging system provides automatic fallbacks when layers fail to initialize.

**Example:**
```rust
// If file layer fails (permissions, disk space, etc.)
// Console layer automatically becomes the fallback
// System continues running with degraded logging rather than crashing

init_logging(&config)?; // Graceful degradation built-in
```

**Why:** Logging failures shouldn't crash your application. Fallbacks ensure observability is maintained.

---

### ❌ DON'T: Enable all layers in production without considering performance
**Explanation:** Each layer has overhead. Don't blindly enable console + file + JSON in high-throughput production systems.

**Bad Example:**
```rust
// In high-throughput production
let config = LoggingConfig {
    level: "debug".to_string(),        // ❌ Too verbose
    console: ConsoleConfig { enabled: true, .. },  // ❌ Unnecessary overhead
    file: Some(FileConfig { enabled: true, .. }),  // ✅ Good for persistence
    json: Some(JsonConfig { enabled: true, .. }),  // ✅ Good for monitoring
};
```

**Why it's bad:** Console output in production containers is often ignored but still consumes CPU. Debug level creates massive log volume.
---

## 7. QUERYING & DEBUGGING

### ✅ DO: Design logs to answer business questions directly
**Explanation:** You should be able to query "Show failed premium checkouts with Stripe" in one simple query.

**Example Query:**
```sql
SELECT * FROM logs
WHERE status_code >= 500
  AND user_subscription = 'premium'
  AND payment_provider = 'stripe'
```

**Why:** Wide events with business context make this possible. No joins or correlation needed.

---

### ❌ DON'T: Force developers to correlate multiple log lines manually
**Explanation:** Never create logs that require searching for request_id across multiple entries and stitching them together.

**Bad Example:**
```sql
-- Find request_id from error log
SELECT request_id FROM logs WHERE message LIKE '%error%'
-- Find user tier from different log
SELECT * FROM logs WHERE request_id = '...' AND message LIKE '%premium%'
-- Manually correlate in your head
```

**Why it's bad:** Wastes hours during incidents. Error-prone. Frustrating for developers.