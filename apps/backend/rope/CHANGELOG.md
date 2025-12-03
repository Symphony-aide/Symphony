# Changelog

All notable changes to the Symphony Rope crate will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Improved code clarity with explicit lifetime annotations in iterator types (2024-12-01)
  - `InsertsIter<'_, N>` now uses explicit lifetime parameter instead of elided lifetime
  - Follows Rust 2021 best practices for better code readability
  - No functional changes, purely a code quality improvement

## [0.1.0] - 2024-12-01

### Added
- Complete migration of xi-rope from xi-editor project
- All core rope functionality: rope.rs, tree.rs, delta.rs, interval.rs, engine.rs
- Line/word break detection (breaks.rs)
- Search operations (find.rs)
- Comparison utilities (compare.rs)
- Diff algorithm (diff.rs)
- Multiset operations (multiset.rs)
- Span tracking (spans.rs)
- Serde serialization support (serde_impls.rs)
- Comprehensive test suite (test_helpers.rs)
- Benchmark support with Criterion

### Changed
- Updated from Rust 2018 to Rust 2021 edition
- Applied Symphony coding standards (clippy, rustfmt)
- Modernized code patterns for Rust 2021
- Fixed all compilation warnings
- Enhanced documentation with examples

### Technical Details
- **Performance**: O(log n) insert/delete operations
- **Memory**: ~50% of String for large files with clones
- **Thread Safety**: Send + Sync for concurrent access
- **Unicode**: Full Unicode grapheme cluster support

## Attribution

Original implementation by Raph Levien and the xi-editor team.
Adapted for Symphony IDE by the Symphony team.

## License

Apache-2.0 (inherited from xi-rope)
