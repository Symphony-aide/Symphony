# Repertoire Framework Metadata

> **Updated**: December 25, 2025  
> **Version**: 2.0 - Enhanced with Technical Patterns and Hierarchical Organization

This directory contains the complete documentation for Symphony's Repertoire development framework - a systematic approach to building complex software systems through structured milestone decomposition and feature-driven development.

---

## 📋 Framework Overview

The Repertoire framework addresses three critical weaknesses in traditional development approaches:

1. **Lack of Technical Consistency** → Solved with `technical_pattern.md`
2. **Flat Feature Organization** → Solved with hierarchical milestone-based structure
3. **Incomplete Quality Evaluation** → Solved with enhanced BIF reasoning requirements

---

## 📁 Documentation Structure

### Core Framework Documents

| Document | Purpose | Audience |
|----------|---------|----------|
| **[Development.md](./Development.md)** | Complete framework specification and workflow | All team members |
| **[How To Use.md](./How%20To%20Use.md)** | AI mode system prompts and usage guide | AI operators, developers |
| **[BIF.md](./BIF.md)** | Blind Inspection Framework for quality evaluation | Code reviewers, QA |
| **[Feature Lifecycle.md](./Feature%20Lifecycle.md)** | 7-document lifecycle process | Feature implementers |

### Technical Standards

| Document | Purpose | Location |
|----------|---------|----------|
| **[technical_pattern.md](../practice/technical_pattern.md)** | Technical implementation patterns and standards | `.repertoire/practice/` |

---

## 🏗️ Framework Architecture

### Three-Level Milestone Hierarchy

```
LEVEL 0 (Strategic)     → M1, M2, M3, ...
    ↓
LEVEL 1 (Tactical)      → M1.1, M1.2, M1.3, ...
    ↓
LEVEL 2 (Concrete)      → M1.1.1, M1.1.2, M1.1.3, ...
    ↓
FEATURES (Implementation) → F001, F002, F003, ...
```

### Hierarchical Feature Organization

**NEW**: Features are organized by parent milestone for better scalability:

```
.repertoire/features/
├── m1.1/          # IPC Protocol & Serialization
│   ├── F001_message_envelope_design/
│   ├── F002_messagepack_serialization/
│   └── F003_bincode_serialization/
├── m1.2/          # Transport Layer
│   ├── F006_transport_trait/
│   └── F007_unix_socket_transport/
└── m5.1/          # Workflow Data Model
    └── F050_workflow_struct/
```

**Benefits**:
- Clear milestone-to-feature mapping
- Logical grouping of related features
- Scalable to hundreds of features
- Easy dependency management

---

## 🎯 AI Mode System

### Three Specialized AI Modes

1. **CONSTRUCTOR** → Strategic planning and milestone creation
2. **TRANSFORMER** → Feature extraction and specification
3. **IMPLEMENTER** → Code implementation and verification

Each mode has specific responsibilities and handoff protocols documented in [How To Use.md](./How%20To%20Use.md).

---

## 📊 Quality Assurance: Enhanced BIF Framework

### NEW: Reasoning-Based Evaluation

All BIF evaluations now require **reasoning** for every rating:

| Dimension | Rating | **Reasoning Required** |
|-----------|--------|----------------------|
| Feature Completeness | 0-100% | Why this percentage? What's missing? |
| Code Quality | Poor/Basic/Good/Excellent | What specific evidence supports this rating? |
| Documentation | None/Basic/Good/Excellent | What documentation exists and why is it rated this way? |
| Reliability | Low/Medium/High/Enterprise | What error handling exists? What are the risks? |
| Performance | Poor/Acceptable/Good/Excellent | What are the performance characteristics? |
| Integration | Not Compatible/Partial/Full/Enterprise | How well does it integrate? What are limitations? |
| Maintenance | Low/Medium/High/Enterprise | What makes it maintainable or not? |
| Stress Collapse | Prediction with numbers | What analysis led to this prediction? |

### BIF Readiness Levels

- ✅ **Production Ready**: 80%+ features at Full or Enterprise level
- 🟡 **Staging Ready**: 60-79% features at Full or Enterprise level  
- ⚠️ **Development**: 40-59% features at Full or Enterprise level
- ❌ **Not Ready**: <40% features at Full or Enterprise level

---

## 🔧 Technical Implementation Standards

### NEW: Technical Pattern Requirements

All implementations must follow patterns defined in `technical_pattern.md`:

#### Code Quality Standards
- **Rust**: Use thiserror for errors, comprehensive rustdoc, property-based testing
- **Testing**: TDD approach (Red → Green → Refactor)
- **Documentation**: Every public API documented with examples
- **Performance**: Benchmarks for all performance-critical code

#### Debugging Standards
- **Loud Smart Duck Debugging**: `[DUCK DEBUGGING]: message` format
- Only active in debug builds (`#[cfg(debug_assertions)]`)
- Easy to search and remove for production

#### Quality Gates
- All acceptance criteria met (✅)
- All tests passing (100%)
- BIF evaluation complete with HIGH priority issues resolved
- Documentation complete and accurate

---

## 📈 Status Tracking System

### Checkbox Status Meanings

- `[ ]` → **Not Started** (idle)
- `[ - ]` → **In Progress** (actively being worked)
- `[ 1 ]` → **Completed** (first attempt successful)
- `[ 2 ]` → **Completed** (reopened once, then completed)
- `[ N ]` → **Completed** (reopened N-1 times)

### Status Propagation Rules

```
Feature Complete → Level 2 Step → Level 1 Section → Level 0 Milestone
F001 [1] → M1.1.1 [1] → M1.1 [1] → M1 [1]
```

---

## 🚀 Getting Started

### For New Projects

1. **Use CONSTRUCTOR mode** to create milestone hierarchy
2. **Use TRANSFORMER mode** to extract features
3. **Use IMPLEMENTER mode** to build features

### For Existing Projects

1. **Assess current state** against framework requirements
2. **Reorganize features** into hierarchical structure if needed
3. **Apply technical patterns** to existing code
4. **Run BIF evaluation** with enhanced reasoning requirements

---

## 📚 Quick Reference

### Essential Commands

```bash
# Start new project
"Switch to CONSTRUCTOR mode and help me plan [project description]"

# Convert milestones to features  
"Switch to TRANSFORMER mode and process these milestones"

# Implement features
"Switch to IMPLEMENTER mode and start with F001"
```

### Key Files to Create

1. **Milestones**: `LEVEL0.md`, `level1/LEVEL1.md`, `level2/LEVEL2_M*.md`
2. **Features**: 7 lifecycle documents per feature
3. **Technical Standards**: `practice/technical_pattern.md`

### Quality Checklist

- [ ] Technical patterns followed
- [ ] Features hierarchically organized
- [ ] BIF evaluation includes reasoning
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Status tracking accurate

---

## 🔄 Framework Evolution

### Version 2.0 Improvements (December 2025)

1. **Technical Pattern Definition** → Consistent implementation standards
2. **Hierarchical Feature Organization** → Better scalability and organization
3. **Enhanced BIF Reasoning** → More thorough quality evaluation
4. **Improved Documentation** → Clearer guidance and examples

### Future Enhancements

- Automated quality metrics collection
- Integration with CI/CD pipelines
- Template generation tools
- Cross-project pattern sharing

---

## 🆘 Support and Troubleshooting

### Common Issues

1. **Features too large** → Break into smaller, atomic features
2. **Unclear dependencies** → Map dependencies explicitly in DEFINITION.md
3. **Low BIF scores** → Address HIGH priority issues before proceeding
4. **Status tracking confusion** → Follow propagation rules strictly

### Getting Help

- **Framework Questions**: Review [Development.md](./Development.md)
- **AI Mode Issues**: Check [How To Use.md](./How%20To%20Use.md)
- **Quality Problems**: Consult [BIF.md](./BIF.md)
- **Implementation Patterns**: Reference `practice/technical_pattern.md`

---

*The Repertoire framework transforms software development from ad-hoc coding to systematic, quality-driven engineering. Follow the patterns, trust the process, and build something extraordinary.* 🎼