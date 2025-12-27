# Rust Backend Milestones & Guidelines

## ⚠️ Disclaimer: Reference Only

This directory contains milestone breakdowns and roadmaps for the Symphony Rust backend.

**IMPORTANT**: These documents serve as a **high-level guideline** and **estimation** of the work required. They do **NOT** enforce any specific architectural dogma (e.g., strict adherence to "Harmonic Hexagonal Actor Architecture" or similar theoretical models).

The goal is to provide a decomposition of the massive scope of work into manageable chunks. You should use these files as a reference to understand the *what* and *why*, but use your own engineering judgment and vision for the *how*.

## 🚨 CRITICAL RULE: "Common First"

**Core Rule**: Any functionality that can be shared across crates MUST be implemented in `sy-commons` first.

**M1.0 sy-commons Foundation is PREREQUISITE for ALL other development**:
- SymphonyError - base error for ALL Symphony crates (mandatory)
- Professional logging (tracing-based) - Console, File, JSON outputs
- Environment configuration (TOML + Figment) - default.toml, test.toml, production.toml
- Safe filesystem utilities - professional architecture, low complexity
- Pre-validation helpers - simple rule validation utilities
- Duck debugging - temporary debugging utilities with duck!() macro
- Complete lib.rs guide - documentation of all functionality
- Co-located tests - every public function has tests in same file
- OCP compliance - open for extension, closed for modification

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

## 🗺️ High-Level Vision

The roadmap is decomposed into several key phases, designed to build the "Symphony AIDE" (AI-First Development Environment) layer on top of the existing XI-editor foundation.

### 1. The Foundation (XI-Editor)
*Status: ✅ Complete*

### 1.0. sy-commons Foundation (PREREQUISITE)
*Status: 🚧 Next Priority*

**ALL Symphony development depends on sy-commons completion**:
- Shared error handling (SymphonyError)
- Professional logging system
- Environment configuration
- Safe filesystem utilities
- Pre-validation helpers
- Duck debugging utilities
The text editing core, rope data structures, and JSON-RPC communication are already in place.

### 2. The Pit (Core AIDE Infrastructure)
*Focus: Performance & Management*
Building the heavy-lifting Rust components that run in-process:
- **Pool Manager**: Intelligent lifecycle management for AI models.
- **DAG Tracker**: Handling complex workflow execution graphs.
- **Artifact Store**: High-performance, content-addressable storage for all generated assets.

### 3. The Conductor (Integration & Orchestration)
*Focus: Intelligence & Control*
Bridging the gap between the "Brain" (Python/AI) and the "Muscle" (Rust):
- **IPC Bus**: Low-latency inter-process communication.
- **Python Bridge (PyO3)**: Seamless integration for the orchestration engine.

### 4. The Orchestra (Extension Ecosystem)
*Focus: Extensibility*
Defining how the world interacts with Symphony:
- **Instruments**: AI Model extensions.
- **Operators**: Workflow utilities.
- **Motifs**: UI enhancements.

## 📂 Directory Structure

- **`MILESTONES.md`**: The master high-level roadmap.
- **`level1/`**: Detailed breakdown of the major milestones (M1, M3, M4, M5).
- **`level2/`**: Granular task lists and technical specifications.

---
*Use these milestones as a map, not a set of shackles. Build with vision.*
