# Level 2 M4 Notes: Extension Ecosystem Decisions and Insights

> **Purpose**: Incremental decision and insight tracking for M4 Extension Ecosystem implementation

**Parent**: Level 1 M4 Extension Ecosystem  
**Status**: Empty by default - filled incrementally as decisions, issues, or insights emerge during development

---

## 📝 Decision Log

### December 27, 2025: Testing Strategy Integration
**Decision**: Integrated comprehensive three-layer testing strategy for M4 Extension Ecosystem
**Rationale**: Ensures clear separation between Rust orchestration logic and OFB Python validation/persistence
**Impact**: Updated design.md with detailed testing architecture including security testing

**Testing Layers for M4**:
- **Layer 1**: Unit tests for extension loading, sandboxing, and permission checking (<100ms)
- **Layer 2**: Integration tests with WireMock for OFB Python marketplace integration (<5s)
- **Layer 3**: Pre-validation tests for manifest validation and dependency checking (<1ms)

**Security Testing Focus**:
- Sandbox escape attempts
- Permission bypass attempts
- Resource limit enforcement
- Malicious extension handling

**Boundary Separation**:
- **Rust Layer**: Extension loading, sandboxing, permission checking, registry operations
- **OFB Python Layer**: Marketplace authentication, user permissions, extension verification, usage analytics

### December 27, 2025: Four-File Architecture Migration
**Decision**: Migrated Level 2 M4 from single LEVEL2_M4.md to four-file structure
**Rationale**: Separation of concerns - ATDD requirements, technical design, implementation guidemap, and incremental notes
**Files Created**:
- `requirements.md` - ATDD acceptance criteria and Gherkin scenarios
- `design.md` - Technical architecture, crate structures, and security architecture
- `LEVEL2_M4.md` - Implementation guidemap with task breakdowns and checkboxes
- `notes.md` - Incremental decision and insight tracking (this file)

**Content Distribution**:
- High-level architecture diagrams → `design.md`
- Acceptance criteria and glossary → `requirements.md`
- Task breakdowns with `[ ]` checkboxes → `LEVEL2_M4.md`
- Security architecture → `design.md`
- Platform-specific implementations table → `design.md`
- Integration points → `design.md`

*This section will be filled incrementally as architectural and implementation decisions are made during M4 development.*

---

## 🐛 Issue Tracking

*This section will be filled incrementally as problems are encountered and their resolutions documented.*

---

## 💡 Insights and Lessons Learned

*This section will be filled incrementally as important discoveries and lessons are learned during implementation.*

---

## 🔄 Process Improvements

*This section will be filled incrementally as process improvements and optimizations are identified.*

---

## 📚 References and Resources

*This section will be filled incrementally as useful references, documentation, and resources are discovered.*
