# F007: Async Message Handler

> **Parent**: Inherited from M1.3.1 (Async Message Handler)  
> **Status**: [ ] Not Started  
> **Effort**: 3 days  
> **Type**: Infrastructure  

---

## Problem Statement

Symphony's message bus requires efficient async message processing to handle high-throughput IPC communication without blocking. The system needs a robust message handler that can process messages concurrently, manage handler registration, and provide graceful shutdown capabilities while maintaining message ordering guarantees where needed.

## Solution Approach

Implement a comprehensive async message processing system that includes:
- MessageHandler trait for pluggable message processing logic
- MessageProcessor for coordinating message handling with tokio channels
- Handler registration system with message type routing
- Concurrent message processing with configurable parallelism
- Graceful shutdown with proper resource cleanup
- Error handling and recovery mechanisms

## Dependencies Analysis

### External Dependencies

| Library | Purpose | Alternative 1 | Alternative 2 | Alternative 3 | Cross-Platform | Local Env | Cloud Env | Consistency & Stability | Maintained | Ecosystem | Limitation 1 | Limitation 2 | Limitation 3 | Decision | Rationale |
|---------|---------|---------------|---------------|---------------|----------------|-----------|-----------|------------------------|------------|-----------|--------------|--------------|--------------|----------|-----------|
| tokio 1.35.1 | Async runtime & channels | async-std | smol | custom runtime | ✅ All platforms | ✅ Works | ✅ Works | ✅ Deterministic | ✅ Active (2024-12) | High | Large dependency | Runtime coupling | N/A | ✅ Selected | Industry standard, excellent async primitives |
| async-trait 0.1.74 | Async trait support | manual async impl | trait_async | custom macros | ✅ All platforms | ✅ Works | ✅ Works | ✅ Deterministic | ✅ Active (2024-10) | High | Proc macro overhead | Boxing futures | N/A | ✅ Selected | Standard for async traits, required for handler trait |
| serde_json 1.0.108 | Generic message handling | rmp-serde | bincode | custom serialization | ✅ All platforms | ✅ Works | ✅ Works | ✅ Deterministic | ✅ Active (2024-11) | High | JSON-specific | Performance overhead | N/A | ✅ Selected | Generic Value type for unknown message payloads |

**Notes**:
- ✅ = Works correctly / Yes
- ❌ = Does not work / No / Critical issue
- ⚠️ = Partial support / Works with caveats
- N/A = Not applicable

### Internal Dependencies

**Requires**: 
- F001: Message Envelope Design (Message<T> types)
- F002: MessagePack Serialization (message deserialization)
- F003: Bincode Serialization (message deserialization)

**Enables**: 
- F008: Routing Engine (message routing to handlers)
- F009: Request/Response Correlation (response handling)
- F010: Pub/Sub System (event message handling)
- Message Bus Core functionality

## Acceptance Criteria

1. **Async Processing**: All message handling is fully async with no blocking operations
2. **Handler Registration**: Dynamic registration/deregistration of message handlers
3. **Concurrent Processing**: Multiple messages processed concurrently with configurable limits
4. **Message Type Routing**: Messages routed to appropriate handlers based on type
5. **Error Handling**: Handler errors don't crash the processor, proper error propagation
6. **Graceful Shutdown**: Clean shutdown with completion of in-flight messages
7. **Backpressure**: Proper backpressure handling when handlers are overwhelmed

## Success Metrics

- Message throughput: >10,000 messages/second with typical handlers
- Processing latency: <1ms average latency for simple message handlers
- Concurrent handlers: Support 100+ concurrent message handlers
- Memory efficiency: <1MB memory overhead for message processor
- Shutdown time: <100ms graceful shutdown with proper cleanup

## User Stories

### Story 1: Message Handler Registration
**As a** Symphony component  
**I want to** register handlers for specific message types  
**So that** I can process relevant messages without manual routing  

**Example**:
```rust
struct RequestHandler;

#[async_trait]
impl MessageHandler for RequestHandler {
    async fn handle(&self, msg: Message<Value>) -> Result<Option<Message<Value>>, HandlerError> {
        // Process request message
        let response_data = process_request(&msg.payload).await?;
        
        // Return response message
        Ok(Some(Message::builder()
            .message_type(MessageType::Response)
            .correlation_id(msg.header.id)
            .payload(response_data)
            .build()))
    }
    
    fn message_types(&self) -> Vec<&str> {
        vec!["RequestMessage"]
    }
}

// Register handler
processor.register_handler(Box::new(RequestHandler)).await?;
```

### Story 2: Concurrent Message Processing
**As a** Symphony message bus  
**I want to** process multiple messages concurrently  
**So that** I can maximize throughput and minimize latency  

**Example**:
```rust
let processor = MessageProcessor::new(1000); // 1000 message buffer

// Start processing loop
let handle = tokio::spawn(async move {
    processor.run().await
});

// Send messages concurrently
for i in 0..1000 {
    let message = create_test_message(i);
    sender.send(message).await?;
}

// Messages processed concurrently by registered handlers
```

### Story 3: Graceful Shutdown
**As a** Symphony system  
**I want to** shutdown message processing gracefully  
**So that** in-flight messages are completed before system exit  

**Example**:
```rust
// Signal shutdown
shutdown_sender.send(()).await?;

// Wait for graceful completion
match tokio::time::timeout(Duration::from_secs(5), processor_handle).await {
    Ok(result) => log::info!("Message processor shutdown cleanly: {:?}", result),
    Err(_) => log::warn!("Message processor shutdown timed out"),
}
```

## Timeline

- **Day 1**: Design and implement MessageHandler trait and basic MessageProcessor
- **Day 2**: Add handler registration, message routing, and concurrent processing
- **Day 3**: Implement graceful shutdown, error handling, and comprehensive testing

## Out of Scope

- Message routing logic (handled by F008 Routing Engine)
- Request/response correlation (handled by F009)
- Pub/sub message distribution (handled by F010)
- Message persistence (handled by storage components)
- Handler discovery (handlers registered explicitly)

## Risk Assessment

**Medium Risk**: Async message processing with proper error handling and shutdown is complex. Race conditions and resource leaks are possible if not carefully implemented.

**Mitigation**: Comprehensive testing including stress tests, proper use of tokio primitives, and careful resource management with RAII patterns.