# F006 - Binary Communication Bridge - Planning

**Feature ID**: F006  
**Planning Date**: December 28, 2025  
**Estimated Effort**: 4 days  
**Implementation Priority**: 5 (After F005)  

---

## Implementation Strategy

### High-Level Approach

Implement comprehensive binary communication bridge connecting Symphony and XI-editor processes. Focus on JSON-RPC client implementation, event streaming, state synchronization, and process lifecycle management to achieve <1ms JSON-RPC latency and <10ms event streaming.

### Technical Decisions

#### XI-editor Integration Strategy
**Decision**: Use existing XI-editor binary as-is with JSON-RPC over STDIO  
**Rationale**: Avoids XI-editor source modifications while leveraging proven text editing engine  
**Alternative Considered**: Fork and modify XI-editor  
**Why Rejected**: Increases maintenance burden and complexity  

#### State Synchronization Approach
**Decision**: Local buffer metadata cache with XI-editor synchronization  
**Rationale**: Reduces XI-editor queries while maintaining consistency  
**Alternative Considered**: Query XI-editor for all state  
**Why Rejected**: Would create performance bottleneck  

#### Process Management Strategy
**Decision**: Symphony manages XI-editor as subprocess with health monitoring  
**Rationale**: Provides control over XI-editor lifecycle and failure recovery  
**Alternative Considered**: External XI-editor process management  
**Why Rejected**: Complicates deployment and error recovery  

## Component Breakdown

### 1. XI-editor Process Management (`src/process.rs`)
**Responsibility**: XI-editor subprocess lifecycle management  
**Key Components**:
- Process spawning and configuration
- Health monitoring and failure detection
- Automatic restart mechanisms
- Process cleanup and resource management

### 2. JSON-RPC Client (`src/jsonrpc_client.rs`)
**Responsibility**: Symphony → XI-editor communication  
**Key Components**:
- JSON-RPC 2.0 compliant client
- Request/response correlation
- XI-editor operation wrappers
- Error handling and retry logic

### 3. Event Streaming (`src/event_stream.rs`)
**Responsibility**: XI-editor → Symphony event processing  
**Key Components**:
- STDIO event parsing and routing
- Event filtering and transformation
- Real-time event delivery
- Event correlation and ordering

### 4. State Synchronization (`src/state_sync.rs`)
**Responsibility**: Buffer and file state coordination  
**Key Components**:
- Buffer metadata cache
- File system change detection
- State synchronization coordinator
- Conflict resolution mechanisms

### 5. XI-editor Adapter (`src/xi_adapter.rs`)
**Responsibility**: TextEditingPort implementation  
**Key Components**:
- Complete TextEditingPort trait implementation
- XI-editor operation mapping
- Error translation and handling
- Performance optimization

## Dependencies Analysis

| Library | Purpose | Alternative 1 | Alternative 2 | Alternative 3 | Cross-Platform | Local Env | Cloud Env | Consistency & Stability | Maintained | Ecosystem | Limitation 1 | Limitation 2 | Limitation 3 | Decision | Rationale |
|---------|---------|---------------|---------------|---------------|----------------|-----------|-----------|------------------------|------------|-----------|--------------|--------------|--------------|----------|-----------|
| tokio::process | Process management | std::process | async-process | custom | ✅ All platforms | ✅ Works | ✅ Works | ✅ Very stable | ✅ Active (2024-12) | High | Platform differences | Complex lifecycle | N/A | ✅ Selected | Best async process management |
| notify 6.1.1 | File system watching | inotify directly | polling | custom | ✅ All platforms | ✅ Works | ✅ Works | ✅ Stable | ✅ Active (2024-11) | High | Platform differences | Event delays | Resource usage | ✅ Selected | Cross-platform file watching |
| serde_json 1.0.108 | JSON-RPC serialization | simd-json | sonic-rs | custom | ✅ All platforms | ✅ Works | ✅ Works | ✅ Very stable | ✅ Active (2024-12) | High | Not fastest | Large messages | N/A | ✅ Selected | JSON-RPC standard compliance |

#### Tauri Commands Reference

This feature implements Tauri commands for XI-editor integration:

| Tauri Command | Location | Description |
|---------------|----------|-------------|
| create_buffer | src-tauri/src/commands/text_editing.rs | Creates new buffer in XI-editor |
| insert_text | src-tauri/src/commands/text_editing.rs | Inserts text at cursor position |
| save_buffer | src-tauri/src/commands/text_editing.rs | Saves buffer to file |
| get_buffer_content | src-tauri/src/commands/text_editing.rs | Retrieves current buffer content |

## Implementation Phases

### Phase 1: XI-editor Process Management (Day 1, Morning)
- [ ] Implement XI-editor subprocess spawning
- [ ] Add process health monitoring
- [ ] Create automatic restart mechanisms
- [ ] Add process lifecycle management

### Phase 2: JSON-RPC Client (Day 1, Afternoon)
- [ ] Implement Symphony → XI-editor JSON-RPC client
- [ ] Add request/response correlation
- [ ] Create XI-editor operation wrappers
- [ ] Add error handling and retry logic

### Phase 3: Event Streaming (Day 2, Morning)
- [ ] Implement XI-editor → Symphony event streaming
- [ ] Add STDIO event parsing
- [ ] Create event routing to Symphony components
- [ ] Add event filtering and processing

### Phase 4: State Synchronization (Day 2, Afternoon)
- [ ] Implement buffer state cache
- [ ] Add file system change detection
- [ ] Create state synchronization coordinator
- [ ] Add conflict resolution mechanisms

### Phase 5: XI-editor Adapter (Day 3, Morning)
- [ ] Implement complete TextEditingPort trait
- [ ] Add XI-editor operation mapping
- [ ] Create error translation system
- [ ] Add performance optimization

### Phase 6: Integration and Testing (Day 3, Afternoon)
- [ ] Integrate all bridge components
- [ ] Add comprehensive test suite
- [ ] Performance benchmark communication
- [ ] XI-editor compatibility testing

---

**Planning Complete**: Ready for DESIGN phase