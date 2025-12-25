# F001: Message Envelope Design - Testing Strategy

> **Parent**: Inherited from M1.1.1 (Message Envelope Design)  
> **Status**: [ ] Not Started  
> **Updated**: December 25, 2025  

---

## Feature Type Analysis

**F001 is Infrastructure** because it provides the foundational message envelope structure that enables IPC communication between Symphony's components. It defines the core data structures and protocols that other systems will build upon.

## What Should I Test?

Based on Infrastructure type, I should test:
- **Boundary works**: Message creation, validation, and builder pattern work correctly
- **Error handling**: Invalid inputs are rejected with appropriate errors  
- **API contracts**: All public interfaces behave as documented

I should NOT test:
- **Internal implementation**: UUID generation internals, HashMap implementation details
- **External dependencies**: serde serialization internals, chrono datetime handling

## Test Level Decision

- [x] **Infrastructure Tests**: Boundary works (message creation, validation, builder)
- [x] **Contract Tests**: API promises held (traits implemented, error types correct)
- [x] **Behavior Tests**: Outcomes correct (priorities ordered, TTL expiration works)
- [ ] **Integration Tests**: Not needed at this level (handled by higher-level components)

**Markers**: 
- `unit`: Unit tests (fast, isolated)
- `property`: Property-based tests (randomized inputs)
- `benchmark`: Performance tests

## Mock or Real Dependencies?

| Dependency | Decision | Rationale |
|------------|----------|-----------|
| uuid::Uuid | **REAL** | Fast (<1ms), deterministic, pure function |
| chrono::DateTime | **REAL** | Fast (<1ms), deterministic, simple data structure |
| serde traits | **REAL** | Testing serialization is part of the contract |
| HashMap | **REAL** | Standard library, fast, deterministic |

No mocks needed - all dependencies are fast, deterministic, and testing them is valuable.

## Where Do Tests L