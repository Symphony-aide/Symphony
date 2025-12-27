# M5: Visual Orchestration Backend - Notes

> **Parent**: [LEVEL2_M5.md](./LEVEL2_M5.md)
> **Type**: Decision Log & Incremental Insights

---

## 📅 Decision Log

### 2025-12-27: Four-File Architecture Migration

**Context**: Migrating M5 from single large file to four-file architecture for better organization.

**Decision**: Split into:
- `requirements.md` - ATDD acceptance criteria with Gherkin scenarios
- `design.md` - Architecture diagrams, crate structures, integration points
- `LEVEL2_M5.md` - Implementation guidemap with task breakdowns
- `notes.md` - This file for ongoing decisions and insights

**Rationale**: Consistent with M1, M3, M4 migrations. Separates concerns for easier navigation and maintenance.

---

## 🔍 Technical Insights

### Workflow Data Model Considerations

- **HashMap vs BTreeMap**: HashMap chosen for O(1) node lookup. BTreeMap would give ordered iteration but O(log n) lookup.
- **UUID for IDs**: Using UUID v4 for all identifiers (WorkflowId, NodeId, EdgeId) ensures global uniqueness.
- **Position as f64**: Using floating point for visual layout positions allows sub-pixel precision.

### DAG Validation Algorithms

- **Cycle Detection**: DFS with three-color marking (white/gray/black) is standard and efficient.
- **Topological Sort**: Kahn's algorithm preferred over DFS-based for deterministic output.
- **Critical Path**: Longest path in DAG, important for execution time estimation.

### Serialization Trade-offs

| Format | Size | Speed | Human Readable |
|--------|------|-------|----------------|
| JSON | Largest | Medium | Yes |
| MessagePack | ~50% smaller | Fast | No |
| Bincode | Smallest | Fastest | No |

### Event Streaming Architecture

- **Tokio broadcast**: Chosen for multi-subscriber support
- **Backpressure**: Lagging receivers get dropped messages (acceptable for UI updates)
- **Filtering**: Client-side filtering preferred to reduce complexity

---

## 🚧 Open Questions

1. **Template Marketplace Integration**: How will templates be published and discovered?
2. **Execution Persistence**: Should execution state survive process restart?
3. **Distributed Execution**: Future support for executing nodes on different machines?
4. **Real-time Collaboration**: Multiple users editing same workflow?

---

## 📚 References

- [petgraph](https://docs.rs/petgraph/) - Graph data structure library (potential dependency)
- [serde](https://serde.rs/) - Serialization framework
- [tokio broadcast](https://docs.rs/tokio/latest/tokio/sync/broadcast/) - Multi-consumer channel
- [proptest](https://docs.rs/proptest/) - Property-based testing

---

## 🔄 Change History

| Date | Change | Author |
|------|--------|--------|
| 2025-12-27 | Initial four-file architecture migration | AI Assistant |
