# Level 1 Notes: Backend Sub-Milestone Development

> **Purpose**: Incremental decision and insight tracking for Level 1 sub-milestone development

---

## 📖 Glossary

| Term | Definition |
|------|------------|
| **OFB Python** | Out of Boundary Python - refers to Python API components that handle authoritative validation, RBAC, and data persistence outside the Rust boundary |
| **Pre-validation** | Lightweight technical validation in Rust to prevent unnecessary HTTP requests (NOT business logic) |
| **Authoritative Validation** | Complete validation including RBAC, business rules, and data constraints performed by OFB Python |
| **Two-Layer Architecture** | Rust (orchestration + pre-validation) + OFB Python (validation + persistence) |
| **Mock-Based Contract Testing** | Testing approach using mocked dependencies to verify component contracts |
| **WireMock Contract Verification** | HTTP endpoint mocking for testing integration with OFB Python services |
| **Three-Layer Testing** | Unit tests (<100ms), Integration tests (<5s), Pre-validation tests (<1ms) |

---

## Decision Log

### December 27, 2025: Testing Strategy Integration
**Decision**: Adopted comprehensive three-layer testing strategy across all Level 1 components
**Rationale**: Ensures clear separation between Rust orchestration logic and OFB Python validation/persistence
**Impact**: All Level 2 milestone files updated with consistent testing approach

**Testing Boundary Separation**:
- **Rust Layer**: Orchestration, algorithms, data structures, performance-critical operations
- **OFB Python Layer**: Authoritative validation, RBAC, data persistence, business rules

*Decisions will be added here as they are made during sub-milestone development*

---

## Issues & Resolutions
*Issues and their resolutions will be tracked here during implementation*

---

## Insights & Learnings
*Key insights and lessons learned will be documented here during development*

---

*This file starts empty and will be filled incrementally as decisions, issues, or insights emerge during the Level 1 sub-milestone development process.*