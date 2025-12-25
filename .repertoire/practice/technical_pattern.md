> Purpose: Define consistent technical patterns for AI-driven implementation across Symphony's development lifecycle
Scope: All feature implementations from F001 onwards
Updated: December 25, 2025
> 

---

## Code Quality Standards

DONT determine third part caret versions, let Cargo find best latest compataible

### Rust Implementation Patterns

### Error Handling and Debugging

READ THE FILE {CWD/error_handling.md}

---

### Documentation Style

READ THE FILE {CWD/rust_doc_style_guide.md} and {CWD/rust_doc_before_after.rs}


## Documentation Standards

### API Documentation

- Every public function must have rustdoc comments
- Include examples for complex APIs
- Document error conditions
- Explain performance characteristics

---

READ the file {CWD/tests_handling.md}

---

### Naming patterns

- Symphony carets should have the prefix `sy`, but not the full name `symphony`
    - DO: `sy-ipc-protocol`
    - DONT: `symphony-ipc-protocol`

- APPError should be named SymphonyError