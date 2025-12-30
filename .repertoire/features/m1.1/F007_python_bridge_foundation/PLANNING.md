# F007 - Python Bridge Foundation - Planning

**Feature ID**: F007  
**Planning Date**: December 28, 2025  
**Estimated Effort**: 3 days  
**Implementation Priority**: 2 (Can run parallel with F003-F005)  

---

## Implementation Strategy

### High-Level Approach

Implement comprehensive Python-Rust integration foundation using PyO3 for high-performance FFI, type conversion system, and async integration. Focus on achieving <0.01ms FFI overhead while enabling Python Conductor to have direct access to Pit components for optimal AI orchestration performance.

### Technical Decisions

#### FFI Framework Choice
**Decision**: Use PyO3 for Python-Rust integration  
**Rationale**: Most mature and performant Python-Rust FFI framework with excellent async support  
**Alternative Considered**: ctypes with manual bindings  
**Why Rejected**: Much more complex and error-prone than PyO3  

#### Type Conversion Strategy
**Decision**: Automatic conversion for common types, manual for complex types  
**Rationale**: Balances convenience with performance and control  
**Alternative Considered**: All manual conversions  
**Why Rejected**: Too much boilerplate for common cases  

#### Subprocess Management Approach
**Decision**: Python Conductor as subprocess within Symphony binary  
**Rationale**: Provides process isolation while enabling direct Pit access  
**Alternative Considered**: Python as separate service  
**Why Rejected**: Would require IPC for Pit access, reducing performance  

## Component Breakdown

### 1. PyO3 Setup and Bindings (`src/lib.rs`, `src/bindings.rs`)
**Responsibility**: Core Python module and FFI bindings  
**Key Components**:
- Python module definition and initialization
- Core FFI function bindings
- Module registration and export
- Python import system integration

### 2. Type Conversion System (`src/types.rs`)
**Responsibility**: Bidirectional Rust ↔ Python type conversion  
**Key Components**:
- Primitive type conversions (int, float, string, bool)
- Collection conversions (Vec, HashMap, etc.)
- Custom type conversions (domain-specific types)
- Error handling for conversion failures

### 3. Async Integration (`src/async_support.rs`)
**Responsibility**: Python asyncio ↔ Rust async/await bridge  
**Key Components**:
- Python asyncio event loop integration
- Rust Future to Python coroutine conversion
- Cancellation support across language boundary
- Async error propagation

### 4. Subprocess Management (`src/subprocess.rs`)
**Responsibility**: Python Conductor process lifecycle  
**Key Components**:
- Python process spawning and configuration
- Process health monitoring
- Restart mechanisms and failure recovery
- Resource cleanup and lifecycle management

### 5. Direct Pit Access (`src/pit_api.rs`)
**Responsibility**: No-IPC access to Pit components  
**Key Components**:
- Direct function call wrappers for Pit operations
- Performance-optimized call paths
- Error handling and conversion
- Pit component lifecycle integration

## Dependencies Analysis

| Library | Purpose | Alternative 1 | Alternative 2 | Alternative 3 | Cross-Platform | Local Env | Cloud Env | Consistency & Stability | Maintained | Ecosystem | Limitation 1 | Limitation 2 | Limitation 3 | Decision | Rationale |
|---------|---------|---------------|---------------|---------------|----------------|-----------|-----------|------------------------|------------|-----------|--------------|--------------|--------------|----------|-----------|
| pyo3 0.20.0 | Python-Rust FFI | ctypes | cffi | custom | ✅ All platforms | ✅ Works | ✅ Works | ✅ Very stable | ✅ Active (2024-12) | High | Complex build | Python version deps | N/A | ✅ Selected | Best Python-Rust integration |
| pyo3-asyncio 0.20.0 | Async integration | manual async | tokio-python | custom | ✅ All platforms | ✅ Works | ✅ Works | ✅ Stable | ✅ Active (2024-11) | Moderate | Complex setup | Event loop issues | N/A | ✅ Selected | Required for async bridge |
| tokio 1.35.1 | Async runtime | async-std | smol | custom | ✅ All platforms | ✅ Works | ✅ Works | ✅ Very stable | ✅ Active (2024-12) | High | Large dependency | Learning curve | N/A | ✅ Selected | Required for async integration |

#### Tauri Commands Reference

This feature provides Python bridge foundations that will be used by Tauri commands:

**Future Tauri Integration Points**:
- Python Conductor status and control commands
- AI model management through Python bridge
- Workflow execution via Python integration

## Implementation Phases

### Phase 1: PyO3 Setup and Bindings (Day 1, Morning)
- [ ] Set up PyO3 crate structure
- [ ] Define Python module interface
- [ ] Create basic FFI bindings
- [ ] Add Python build configuration

### Phase 2: Type Conversion System (Day 1, Afternoon)
- [ ] Implement Rust → Python type conversions
- [ ] Implement Python → Rust type conversions
- [ ] Add support for complex types (collections, custom types)
- [ ] Create conversion error handling

### Phase 3: Async Integration (Day 2, Morning)
- [ ] Implement Python asyncio integration
- [ ] Add Rust async/await bridge
- [ ] Create cancellation support
- [ ] Add async error handling

### Phase 4: Subprocess Management (Day 2, Afternoon)
- [ ] Implement Python Conductor subprocess
- [ ] Add process lifecycle management
- [ ] Create health monitoring
- [ ] Add restart mechanisms

### Phase 5: Direct Pit Access (Day 3, Morning)
- [ ] Create direct Pit component access
- [ ] Implement no-IPC function calls
- [ ] Add performance optimization
- [ ] Create Pit API wrappers

### Phase 6: Integration and Testing (Day 3, Afternoon)
- [ ] Integrate all bridge components
- [ ] Add comprehensive test suite
- [ ] Performance benchmark FFI calls
- [ ] Memory safety validation

## Testing Strategy

### Unit Testing Approach
- **Test Type**: Integration Tests (cross-language functionality)
- **Focus**: FFI call accuracy, type conversion correctness, async integration
- **Mock Strategy**: Use real Python interpreter with test scripts
- **Performance**: <100ms per test suite

### Test Organization
```
tests/
├── unit/
│   ├── ffi_bindings_test.rs       # FFI binding tests
│   ├── type_conversion_test.rs    # Type conversion tests
│   ├── async_integration_test.rs  # Async bridge tests
│   └── subprocess_test.rs         # Process management tests
├── integration/
│   ├── python_scripts/            # Python test scripts
│   └── cross_language_test.rs     # End-to-end integration tests
├── benchmarks/
│   └── ffi_bench.rs               # FFI performance benchmarks
├── fixtures/
│   ├── test_data.json             # Test data for conversions
│   └── python_modules/            # Test Python modules
└── python/
    ├── symphony_bridge.py         # Python interface module
    └── test_bridge.py             # Python-side tests
```

### Testing Markers
- `unit`: Fast FFI and conversion tests
- `integration`: Cross-language integration tests
- `performance`: FFI performance benchmarks
- `python`: Python-specific tests
- `async`: Async integration tests

---

**Planning Complete**: Ready for DESIGN phase