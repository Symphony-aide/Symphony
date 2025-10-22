# 002: UI Construction for The Trio

**Status:** Accepted

**Date:** *2025-08-20*

**Authors:** Symphony Team

---

## Summary

We will implement Symphony's triple-mode system (IDE ↔ Maestro Mode ↔ Harmony Board) using the **Extension-First Approach**, where modes are developed as extensions with full UI capabilities rather than built-in components.

---

## Context

Symphony requires a triple-mode system that allows seamless switching between:

- **IDE Mode**: Minimal development environment with six core pillars
- **Maestro Mode**: AI orchestration and workflow automation
- **Harmony Board**: Visual node-based workflow composition

**Key Requirements:**

- Consistent UI/UX across all modes
- Alignment with Symphony's "minimal core, maximum extensibility" philosophy
- Support for future mode additions and community innovation
- Technical stack: Rust backend, Tauri + React frontend
- Extension development in Rust

---

## Decision

**We will implement all modes as extensions using the Extension-First Approach.**

**Architecture:**

```
Minimal IDE Core (6 Pillars)
├── Text Editor
├── File Tree Explorer
├── Syntax Highlighting Engine
├── Settings System
├── Native Terminal
└── Extension System
    ↓
UI Mode Extensions
├── Maestro Mode Extension
├── Harmony Board Extension
└── Future Mode Extensions
    ↓
External Ensemble Extensions
├── Instruments (AI/ML models)
├── Operators (Utility functions)
└── Addons (UI components)

```

---

## Rationale

**Why Extension-First:**

1. **Strategic Alignment**: Perfectly embodies Symphony's "minimal core, maximum extensibility" philosophy. Even critical UI modes demonstrate the extension system's capabilities, proving the "Infrastructure as Extension" concept.
2. **Community Innovation**: Future modes can be added by community or internal teams without core changes. Supports marketplace revenue and enterprise customization opportunities.
3. **Architectural Consistency**: Aligns with the IaE decision where infrastructure components are extensions. Maintains clean separation between core and features.
4. **Platform Differentiation**: Positions Symphony as a true platform rather than a monolithic IDE, creating competitive advantage.
5. **Technical Feasibility**: Rust's zero-cost abstractions and Tauri's lightweight nature minimize extension layering overhead (~2-3% per layer).

**Trade-offs Accepted:**

- **Layered Complexity**: UI modes as extensions create R ↔ E^N layering where modes spawn sub-extensions (Instruments, Operators, Addons)
- **Development Time**: Requires robust extension framework before implementing modes
- **Initial UX Friction**: Mode switching may have slight overhead compared to built-in implementations
- **Dependency Management**: Complex dependency graphs require sophisticated loading strategies

---

## Alternatives Considered

**Hybrid Approach (Built-in Layouts):**

- **Pros**: Faster initial delivery, balanced flexibility and practicality
- **Cons**: Risk of "half-measures," potential technical debt, confuses extension strategy
- **Rejected**: Contradicts Symphony's extension-first philosophy and creates inconsistent architecture

**Fully Integrated Approach (Native Modes):**

- **Pros**: Seamless UX, immediate demonstration of vision, optimal performance
- **Cons**: Monolithic architecture, reduces flexibility, high development cost, limits community innovation
- **Rejected**: Creates the monolithic IDE architecture Symphony is designed to avoid

---

## Consequences

**Positive:**

- Proves extension system viability for complex UI components
- Enables community-driven mode development
- Supports marketplace revenue model
- Maintains architectural consistency with IaE principles

**Negative:**

- Complex dependency management for layered extensions
- Performance overhead from extension layering
- Higher development complexity
- Requires sophisticated extension loading strategies

---

## Success Criteria

- Mode switching performance < 1 second | 1.5 second
- Extension layering overhead < 5%
- Successful community-developed mode within 6 months of release
- Consistent UI/UX across all modes

---

## Implementation Strategy

**Dependency Management Solution:**

- Load baseline extensions at startup and cache them (session-persistent)
- Load other extensions in dependency trees based on trigger events
- Cache hot used extensions per user locally

---

### References

[Extension Dependency Management](Extension%20Dependency%20Management%20255461aa270580309990e6b5712a42af.md)

[UI Architecture Complete Analysis](UI%20Architecture%20Complete%20Analysis%20255461aa270580cf812bfc750909585d.md)

---