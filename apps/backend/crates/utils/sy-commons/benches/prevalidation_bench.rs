//! Performance benchmarks for sy-commons pre-validation rules
//! 
//! These benchmarks verify that validation rules meet the <1ms performance requirement.

use criterion::{black_box, criterion_group, criterion_main, Criterion};
use sy_commons::prevalidation::{PreValidationRule, NonEmptyRule, MinLengthRule, MaxLengthRule, CompositeRule, validate_fast};

/// Benchmark for NonEmptyRule validation performance
fn benchmark_non_empty_rule(c: &mut Criterion) {
    let rule = NonEmptyRule;
    let value = "test value".to_string();
    
    c.bench_function("non_empty_rule", |b| {
        b.iter(|| rule.validate(black_box(&value)))
    });
}

fn benchmark_min_length_rule(c: &mut Criterion) {
    let rule = MinLengthRule(5);
    let value = "test value".to_string();
    
    c.bench_function("min_length_rule", |b| {
        b.iter(|| rule.validate(black_box(&value)))
    });
}

fn benchmark_max_length_rule(c: &mut Criterion) {
    let rule = MaxLengthRule(50);
    let value = "test value".to_string();
    
    c.bench_function("max_length_rule", |b| {
        b.iter(|| rule.validate(black_box(&value)))
    });
}

fn benchmark_composite_rule(c: &mut Criterion) {
    let rule = CompositeRule::new()
        .add_rule(NonEmptyRule)
        .add_rule(MinLengthRule(3))
        .add_rule(MaxLengthRule(50));
    let value = "test value".to_string();
    
    c.bench_function("composite_rule", |b| {
        b.iter(|| rule.validate(black_box(&value)))
    });
}

fn benchmark_validate_fast(c: &mut Criterion) {
    let rule = NonEmptyRule;
    let value = "test value".to_string();
    
    c.bench_function("validate_fast", |b| {
        b.iter(|| validate_fast(black_box(&value), black_box(&rule)))
    });
}

/// Benchmark group for all pre-validation performance tests
criterion_group!(
    benches,
    benchmark_non_empty_rule,
    benchmark_min_length_rule,
    benchmark_max_length_rule,
    benchmark_composite_rule,
    benchmark_validate_fast
);
criterion_main!(benches);