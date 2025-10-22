# Extension System

[Engineering](Engineering%2024f461aa2705809caaa9e0c033132df0.md)

[Architecture](Architecture%2024f461aa270580789187e01c9d187a2b.md)

[Considerations](Considerations%20249461aa270580d8a34fd90aeab9e26f.md)

## 🎼 Performance Tiers

*The following section details Symphony's **internal** extension management architecture for performance optimization.*

### 🏠 Resident Ensemble: Always-Ready Foundation

The **Resident Ensemble** comprises baseline extensions that remain loaded throughout the entire user session, providing essential functionality with zero activation delay.

**Characteristics:**

- Session-persistent caching from startup to shutdown
- Immediate availability for core IDE operations
- Higher resource allocation due to critical importance
- Vetted extensions with elevated system privileges

**Resident Ensemble Members:**

- **Core UI Framework** - Layout management and theming system
- **File System Integration** - File tree operations and basic file management
- **Editor Foundation** - Text editing primitives and syntax highlighting
- **Settings Manager** - Configuration persistence and user interface
- **Extension Loader** - Extension lifecycle and dependency management

---

### 🎪 Recruits Ensemble: Dynamic Performance Extension

The **Recruits Ensemble** includes all non-baseline extensions that are loaded strategically based on user patterns and trigger events.

**Two Recruitment Strategies:**

**🔥 On-Call Musicians** (Hot-Cached Extensions)

- Pre-loaded based on individual user behavior patterns
- Kept warm in memory for instant activation
- Personalized optimization through local usage analytics
- Examples: Frequently used debuggers, preferred AI models, common workflow tools

**⚡ Event-Triggered Recruits** (Demand-Loaded Extensions)

- Loaded when specific events require their capabilities
- Complete dependency tree activation on trigger events
- Parallel loading of independent extension branches
- Examples: Language servers for newly opened file types, specialized debugging tools, workflow-specific AI pipelines

**Performance Management:**

- Intelligent cache warming based on usage patterns
- Predictive loading for anticipated user actions
- Memory-efficient eviction policies for unused extensions
- Background optimization during idle periods

---