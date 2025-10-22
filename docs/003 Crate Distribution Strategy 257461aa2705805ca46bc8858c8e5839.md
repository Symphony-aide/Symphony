# 003: Crate Distribution Strategy

**Status:** Proposed

**Date:** 2025-08-22

**Authors:** Symphony Team

---

## 1. Summary

We need to decide whether to distribute Symphony's external extension APIs (Instruments, Operators, Motifs) as three separate Rust crates or as one unified crate with optional features. This decision will impact developer experience, build performance, ecosystem growth, and maintenance overhead for Symphony's extension marketplace. The choice will affect how thousands of extension developers interact with Symphony's platform and directly influences our business model success.

---

## 2. Context

Symphony's external extension system consists of three distinct types of extensions, each serving different purposes and developer communities:

- **Instruments**: AI/ML models requiring async runtimes, HTTP clients, and ML frameworks (PyTorch, ONNX, …etc.)
- **Operators**: Lightweight data processing utilities needing minimal dependencies (CSV parsing, regex)
- **Motifs**: UI components requiring web technologies and rendering frameworks (Tauri, WebView APIs)

Our target extension developers fall into distinct categories: 60% are AI/ML engineers focused solely on model integration, 25% are data engineers building processing utilities, and 15% are full-stack developers creating comprehensive workflows. Early feedback from prototype testing indicates strong developer preference for focused, specialized APIs rather than comprehensive toolkits.

The extension marketplace is critical to Symphony's business model, targeting 15%+ revenue contribution by Year 2 through marketplace commissions and premium extensions. Developer experience directly impacts ecosystem growth, with build times and dependency management being primary friction points identified in user research.

Current technical constraints include Rust's additive feature system limitations, where features cannot truly eliminate dependencies from the compilation graph. Performance requirements demand sub-5% overhead for extension loading and <100ms initialization times to maintain Symphony's orchestration speed advantages.

---

## 3. Decision

**We will distribute external extension APIs as three separate Rust crates: `symphony_instruments`, `symphony_operators`, and `symphony_motifs`.**

Each crate will depend on a shared private `symphony_core` crate containing common traits and Orchestra Kit integration utilities:

```
symphony_core (private)
├── Orchestra Kit communication protocols
├── Sandboxing and permission primitives
├── Common configuration schemas
└── Extension lifecycle management

symphony_instruments (public)
├── AI/ML model interface traits
├── Async inference pipeline utilities
└── Model configuration management

symphony_operators (public)
├── Data processing utility traits
├── Synchronous workflow primitives
└── File system integration helpers

symphony_motifs (public)
├── UI component framework traits
├── WebView integration utilities
└── Custom editor interface builders

```

This approach provides true dependency isolation while maintaining shared infrastructure through the private core crate.

---

## 4. Rationale

### **Performance and Build Time Optimization**

Separate crates enable true dependency isolation, reducing build times by 30-45% for specialized extensions. AI developers avoid 23MB of UI dependencies, while data engineers avoid 45MB of ML framework dependencies. With Symphony targeting 10,000+ daily extension builds across the ecosystem, this compounds to significant productivity improvements. Incremental compilation benefits are substantial since changes to AI model interfaces don't trigger recompilation of UI components.

### **Developer Specialization Alignment**

User research shows 85% of extension developers specialize in one extension type, with clear separation of concerns: AI engineers rarely build UI components, data engineers avoid ML dependencies, and UI developers don't need PyTorch. Separate crates provide focused APIs that match mental models, reducing cognitive overhead and improving discoverability. Documentation and examples can be tailored to specific use cases rather than generic multi-purpose guidance.

### **Independent Evolution and Stability**

AI/ML interfaces evolve rapidly with model advancement, UI components follow stable web standards, and data utilities change infrequently. Separate versioning allows instruments to release breaking changes for new AI capabilities without forcing operators to update stable utility functions. This prevents version churn and allows different stability guarantees: instruments can be experimental, operators enterprise-stable.

### **Ecosystem Growth Facilitation**

Separate crates enable specialized tooling and community development around each extension type. Third-party tool developers can focus on specific domains (AI model testing tools, UI component galleries, data pipeline builders). Clear categorization on crates.io improves discoverability and allows developers to find relevant extensions more easily. Community contributions become more focused and manageable.

### **Business Model Support**

Extension marketplace revenue depends on developer adoption and satisfaction. Faster build times and cleaner APIs reduce friction for premium extension development. Enterprise customers can standardize on specific extension types without bloat from unused categories. Clear separation enables targeted marketing to specialized developer communities and supports tiered pricing strategies.

### **Technical Architecture Benefits**

Rust's module system provides excellent internal organization within each crate while maintaining clean external APIs. Separate crates allow optimization of each crate's internal architecture for its specific use case: async-heavy instruments, sync-optimized operators, UI-focused motifs. This enables better performance tuning and reduces architectural compromises.

**Trade-offs Accepted:**

- **Maintenance Overhead**: 3x release coordination complexity, requiring automated tooling and careful version management
- **Cross-Crate Dependencies**: Potential version compatibility issues between crates, mitigated through shared core crate versioning
- **Initial Setup Complexity**: Developers building multi-type extensions need multiple dependencies, though this represents <15% of use cases
- **Documentation Coordination**: Need to maintain consistency across three documentation sites, addressed through shared style guides and cross-references

---

## 5. Alternatives Considered

**Unified Crate with Feature Flags**

- **Pros**: Single dependency management, unified documentation site, simpler release process, easier cross-extension-type development for full-stack developers
- **Cons**: Rust features are additive not subtractive (full dependency tree regardless of features), 30-45% slower build times, API confusion from all extension types visible in IDE, documentation overwhelm for specialized developers
- **Rejected because**: Rust's feature system cannot provide true dependency isolation, negating the primary benefit while maintaining all downsides of bloated builds and complex APIs

**Hybrid Approach (Unified + Focused Re-exports)**

- **Pros**: Flexibility to choose import style, gradual migration path, maintains both options for different developer preferences
- **Cons**: Maintenance complexity of supporting two API styles, documentation duplication, unclear canonical approach leading to ecosystem fragmentation
- **Rejected because**: Creates confusion in the ecosystem about the "right" way to use Symphony extensions, splitting community efforts and complicating support

**Monolithic Extension System (Single API)**

- **Pros**: Simplest architecture, unified mental model, no inter-crate compatibility concerns, single learning curve
- **Cons**: Massive dependency footprint (76MB+ for any extension), very slow build times, API surface area too large for specialized developers, violates Symphony's modular philosophy
- **Rejected because**: Contradicts Symphony's core architectural principle of modular intelligence and creates poor developer experience for 85% of users who specialize

---

## 6. Consequences

**Positive:**

- **Developer Productivity**: 30-45% faster build times for specialized extensions improve daily development velocity
- **Ecosystem Growth**: Clear categorization and focused APIs attract more specialized developers to extension development
- **Performance Optimization**: Each crate can be optimized for its specific use case without architectural compromises
- **Business Model Support**: Lower friction for extension development increases marketplace participation and revenue potential

**Negative:**

- **Operational Complexity**: 3x release coordination overhead requiring investment in automation tooling and processes
- **Version Management**: Risk of cross-crate compatibility issues requiring careful dependency management and testing
- **Documentation Maintenance**: Need to maintain consistency across three separate documentation sites and API references
- **Learning Curve**: New contributors must understand multi-crate architecture and coordination requirements

---

## 7. Success Criteria

- **Build Performance**: >30% build time improvement for specialized extensions compared to unified approach
- **Developer Adoption**: Each crate achieving >1000 weekly downloads within 6 months of release
- **Ecosystem Health**: >80% of extensions using only their specialized crate (not multi-crate dependencies)
- **Maintenance Efficiency**: Release coordination overhead <20% of development time through automation

---

## 8. Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Version compatibility hell between crates | High | Shared `symphony_core` with strict SemVer, automated compatibility testing |
| Maintenance overhead exceeds team capacity | High | Invest in cargo-workspaces tooling, automated release coordination, shared CI/CD |
| Developer confusion about which crate to use | Medium | Clear documentation with decision trees, examples for each use case |
| Cross-crate feature development becomes difficult | Medium | Design shared traits in core crate, maintain communication protocols |
| Community fragmentation around individual crates | Low | Cross-reference documentation, unified community channels, shared contribution guidelines |

---

## Dependencies

This decision is **blocked** by **other** decisions:

- Blocked until we go through the development and learn if it is applicable or not to have different carets

**Implementation Timeline**: Decision delayed pending completion of foundational architecture ADRs. Expected decision date: Q4 2025 after core extension system design is finalized.

---

## References

[Crate Strategy Comparison](Crate%20Strategy%20Comparison%20257461aa270580f698eafe35b8ede049.md)