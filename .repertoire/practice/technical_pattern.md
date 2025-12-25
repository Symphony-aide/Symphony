# Technical Implementation Pattern

> **Purpose**: Define consistent technical patterns for AI-driven implementation across Symphony's development lifecycle
> **Scope**: All feature implementations from F001 onwards
> **Updated**: December 25, 2025

---

## Core Implementation Philosophy

### Test-Driven Development (TDD)
**Pattern**: Red → Green → Refactor
1. **Red Phase**: Write failing tests first (acceptance, unit, property)
2. **Green Phase**: Implement minimal code to make tests pass
3. **Refactor Phase**: Improve code quality while maintaining test coverage

### Architecture-First Approach
**Pattern**: Design → Validate → Implement
1. **Design**: Follow DESIGN.md specifications exactly
2. **Validate**: Ensure design meets acceptance criteria before coding
3. **Implement**: Build incrementally with continuous validation

### Quality Gates
**Pattern**: Implement → Evaluate → Verify → Integrate
1. **Implement**: Complete feature according to specifications
2. **Evaluate**: Run BIF (Blind Inspection Framework) analysis
3. **Verify**: Complete verification checklist
4. **Integrate**: Update parent milestones and hand off

---

## Code Quality Standards

### Rust Implementation Patterns

#### Error Handling
```rust
// Use thiserror for structured errors
#[derive(Debug, thiserror::Error)]
pub enum FeatureError {
    #[error("Validation failed: {0}")]
    Validation(String),
    
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

// Always provide error context
fn operation() -> Result<T, FeatureError> {
    something_fallible()
        .map_err(|e| FeatureError::Validation(format!("Context: {}", e)))
}
```

#### Documentation Pattern
```rust
/// Brief description of the function/struct
/// 
/// # Arguments
/// 
/// * `param` - Description of parameter
/// 
/// # Returns
/// 
/// Description of return value
/// 
/// # Errors
/// 
/// When this function returns an error and why
/// 
/// # Examples
/// 
/// ```rust
/// let result = function_name(param);
/// assert_eq!(result, expected);
/// ```
pub fn function_name(param: Type) -> Result<ReturnType, Error> {
    // Implementation
}
```

#### Testing Pattern
```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    // Unit tests - test individual components
    #[test]
    fn test_component_behavior() {
        // Arrange
        let input = setup_test_data();
        
        // Act
        let result = component.process(input);
        
        // Assert
        assert_eq!(result, expected_output);
    }
    
    // Property tests - test invariants across many inputs
    #[cfg(test)]
    mod property_tests {
        use proptest::prelude::*;
        
        proptest! {
            #[test]
            fn property_holds_for_all_inputs(input in any::<InputType>()) {
                let result = function_under_test(input);
                prop_assert!(invariant_check(result));
            }
        }
    }
}
```

### Performance Patterns

#### Benchmarking
```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn benchmark_function(c: &mut Criterion) {
    c.bench_function("operation_name", |b| {
        b.iter(|| {
            let result = operation(black_box(input));
            black_box(result)
        })
    });
}

criterion_group!(benches, benchmark_function);
criterion_main!(benches);
```

#### Memory Optimization
- Use `Box<str>` instead of `String` for immutable strings
- Prefer `&str` over `String` in function parameters
- Use `Cow<str>` when you might need to own or borrow
- Pool allocations for high-frequency operations

### Debugging Pattern

#### Loud Smart Duck Debugging
```rust
#[cfg(debug_assertions)]
log::debug!("[DUCK DEBUGGING]: {}", message);
```

**Rules**:
- Only active in debug builds (`#[cfg(debug_assertions)]`)
- Fixed format: `[DUCK DEBUGGING]: <message>`
- Easy to search and remove in production
- Provides context for complex operations

---

## Testing Strategy

### Test Hierarchy
1. **Acceptance Tests**: Verify user stories and acceptance criteria
2. **Integration Tests**: Test component interactions
3. **Unit Tests**: Test individual functions/methods
4. **Property Tests**: Test invariants with randomized inputs
5. **Benchmarks**: Validate performance requirements

### Test Organization
```
tests/
├── acceptance_tests.rs    # User story validation
├── integration_tests.rs   # Component interaction tests
├── unit_tests.rs         # Individual component tests
└── property_tests.rs     # Property-based tests

benches/
└── performance_tests.rs  # Criterion benchmarks
```

### Coverage Requirements
- **Acceptance Tests**: 100% of acceptance criteria covered
- **Unit Tests**: >90% line coverage for core logic
- **Property Tests**: All serialization and data transformation
- **Integration Tests**: All public API endpoints

---

## Documentation Standards

### API Documentation
- Every public function must have rustdoc comments
- Include examples for complex APIs
- Document error conditions
- Explain performance characteristics

### Architecture Documentation
- Update DESIGN.md with any deviations during implementation
- Document design decisions and rationale
- Include diagrams for complex interactions
- Maintain up-to-date dependency graphs

### User Documentation
- Provide working examples in `examples/` directory
- Include common use cases
- Document configuration options
- Explain integration patterns

---

## BIF Evaluation Standards

### Evidence-Based Ratings
Every BIF rating must include:
1. **Specific file paths and line numbers**
2. **Code examples supporting the rating**
3. **Quantitative metrics where applicable**
4. **Reasoning for the assigned score**

### Rating Criteria

#### Feature Completeness (0-100%)
- 100%: All acceptance criteria implemented and tested
- 80-99%: Minor features missing, core functionality complete
- 60-79%: Some important features missing
- <60%: Major functionality gaps

#### Code Quality (Poor/Basic/Good/Excellent)
- **Excellent**: Follows all patterns, comprehensive tests, clear documentation
- **Good**: Minor deviations, good test coverage, adequate documentation
- **Basic**: Some pattern violations, basic tests, minimal documentation
- **Poor**: Major pattern violations, insufficient tests, poor documentation

#### Performance (Poor/Acceptable/Good/Excellent)
- **Excellent**: Exceeds performance targets by >20%
- **Good**: Meets all performance targets
- **Acceptable**: Within 10% of performance targets
- **Poor**: Fails to meet performance requirements

---

## Integration Patterns

### Milestone Updates
1. Update feature status: `[ ]` → `[x]`
2. Update parent milestone progress
3. Check if milestone section is complete
4. Propagate status up the hierarchy

### Handoff Protocol
```
✅ F{XXX} - {name} COMPLETE!
Status: [x] (completed on first try) OR [2] (completed after 1 reopening)
BIF Readiness: {✅🟡⚠️❌} status
Tests: {pass rate}%
Coverage: {percentage}%
Next Feature: F{XXX+1} - {name}
Dependencies: {✅ satisfied / ❌ blocked}
Ready to proceed? {YES/NO}
```

---

## Continuous Improvement

### Pattern Evolution
- Document pattern deviations and rationale
- Update patterns based on lessons learned
- Maintain backward compatibility where possible
- Version pattern changes for traceability

### Quality Metrics
- Track average BIF scores across features
- Monitor test coverage trends
- Measure implementation velocity
- Identify common failure patterns

---

## Enforcement

### Automated Checks
- Clippy lints enforce Rust patterns
- Tests must pass before integration
- Documentation coverage checked
- Performance benchmarks validated

### Manual Reviews
- BIF evaluation mandatory for all features
- Verification checklist completion required
- Pattern compliance reviewed
- Architecture alignment validated

---

*This technical pattern serves as the foundation for consistent, high-quality implementation across Symphony's development lifecycle.*