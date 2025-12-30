# MANDATORY: Factory-Based Test Data Generation

> **CRITICAL**: NEVER hardcode test data. ALWAYS use factories. Each crate defines ONLY needed factories.

---

## 🚨 FORBIDDEN vs MANDATORY

```rust
// ❌ FORBIDDEN - Hardcoded test data
#[test]
fn test_uuid_validation() {
    assert!("550e8400-e29b-41d4-a716-446655440000".is_valid_uuid());
    assert!(!"invalid-uuid".is_valid_uuid());
}

// ✅ MANDATORY - Specific factory structs
#[test]
fn test_uuid_validation() {
    let valid = UUIDTestFactory::valid();
    let invalid = UUIDTestFactory::invalid();
    assert!(valid.is_valid_uuid());
    assert!(!invalid.is_valid_uuid());
}
```

---

## 🏭 SPECIFIC FACTORY PATTERN

**RULE**: Create specific factory structs for each data type. Use `sy-commons` safety utilities.

```rust
// tests/factory.rs
use sy_commons::testing::safe_generator;

// Specific factory for UUIDs
pub struct UUIDTestFactory;
impl UUIDTestFactory {
    pub fn valid() -> String {
        let id = safe_generator().next_unique_id();
        format!("550e8400-e29b-41d4-a716-{:012x}", id)
    }
    
    pub fn invalid() -> String {
        let mut valid = Self::valid();
        valid.pop(); // Remove char to make invalid
        valid
    }
}

// Specific factory for emails (only if testing emails)
pub struct EmailTestFactory;
impl EmailTestFactory {
    pub fn valid() -> String {
        let id = safe_generator().next_unique_id();
        format!("user{}@test-domain.com", id)
    }
    
    pub fn invalid() -> String {
        let valid = Self::valid();
        valid.replace("@", "-") // Remove @ to make invalid
    }
}
```

---

## 📋 MINIMAL REQUIREMENTS

**Cargo.toml**:
```toml
[dependencies]
sy-commons = { path = "../utils/sy-commons" }

[dev-dependencies]
fake = { version = "2.9", features = ["derive", "uuid"] }
```

**Factory Usage**:
```rust
use crate::tests::factory::{UUIDTestFactory, EmailTestFactory};

#[test]
fn test_email_validation() {
    let valid = EmailTestFactory::valid();
    let invalid = EmailTestFactory::invalid();
    
    assert!(is_valid_email(&valid));
    assert!(!is_valid_email(&invalid));
}
```

---

## 🔒 THREAD-SAFE ARCHITECTURE

`sy-commons` provides safety utilities that eliminate race conditions:

- **Thread-safe counters**: Unique IDs across parallel tests
- **Session isolation**: Different test runs don't interfere  
- **Deterministic mutations**: Predictable invalid data generation
- **Zero flakiness**: Factory behavior never causes test failures

---

## 🚨 ENFORCEMENT

**REJECTED**: Any hardcoded UUID, string, or number in tests.
**REQUIRED**: Specific factory struct for every test data type you use.

**REMEMBER**: Create `UUIDTestFactory`, `EmailTestFactory`, etc. - not god objects!