---
description: Whenever i ask to do a task or feature relate to Rust and backend
auto_execution_mode: 3
---

Project task execution instructions — authoritative

0. Check latest documentation and compare carets

Before any coding, review the latest documentation for all dependencies (crates.io) related to the task.
For every required or potentially replaceable caret (crate), perform a comparison between:

The caret you intend to use
Its closest viable alternatives
For each comparison, clearly state:
- Why this caret exists and what it offers

Why you would choose or not choose it (e.g., stability, maintenance, ecosystem support, features, compile-time footprint, or license)
Why your chosen caret is the best fit for the project and aligns with ongoing packages and philosophy
Document the result in a markdown section called # Caret Review inside your implementation notes or commit message.

1. Review project memories and context:
   - Read the project memory file(s) (e.g., MEMO.md, ROADMAP.md) and any available conversational/project context. Recap the project purpose in one brief paragraph.

2. Declare understanding:
   - State what you understood from the task in one or two sentences before coding.

3. Review "ongoing packages":
   - Inspect the workspace and confirm the exact package names/paths for the ongoing packages ([@config, @core, @types]) and any other frequently-updated crates.

4. Review templates and style guides:
   - Open and follow `.windsurf/templates/rust_doc_before_after.rs` and `.windsurf/templates/rust_doc_style_guide.md`. Adhere precisely to their commenting and documentation guidelines for every crate/caret in the workspace.

5. Adding new types (if needed) — follow these rules:
   5.1. Don’t fight the type system — use a `newtype` wrapper for truly different semantics.
   5.2. Prefer trait extensions for adding methods to existing types.
   5.3. Use type aliases for simple renames when no new behavior is required.
   5.4. Extend error hierarchies with domain-specific variants (preserve existing error types).
   5.5. Document relationships between global and local types (where they are defined and how they map).

6. Implement the required code without over-engineering:
   - Follow the project philosophy: “Good Enough To Work, Flexible Enough To Improve.”

7. Adhere exactly to task requirements:
   - Do not add features beyond the task scope and do not omit required behavior. If something is ambiguous, make a reasonable assumption and document it in the task notes.

8. Implement test code:
   - Add unit tests (and integration tests if appropriate) for the task using `cargo test`. Tests must verify intended behavior as declared in the task.

9. Iterate on tests:
   - Repeat step 8 until all test cases pass locally.

10. Provide a demo:
   - Add one demo script in `examples/` or `src/bin/main.rs` (choose the repository convention) that shows the feature working.

11. Iterate on demo:
   - Repeat step 10 until the demo runs successfully and demonstrates the required behavior.

12. Update README:
   - Create or update `README.md` in the target package to document installation, usage, and examples.

13. Create package documentation:
   - Add a human-readable doc file inside the package (e.g., `docs/` or crate doc comments) covering purpose, public API, and examples.

14. Explain changes:
   - Produce a short changelog paragraph describing what you changed, why, and how to use it.

Operational checks (always do before finalizing):
- Run `cargo doc --workspace --no-deps` across all workspace to ensure documentation is updated
 - Run `cargo fmt -all` for formating all and `cargo clippy --manifest-path` with specifing path (fix or document remaining clippy lints if they’re intentionally ignored).
 - Run `cargo test` and ensure all tests pass.
 - Ensure the demo runs and prints/returns the expected output.
 - Commit changes with a clear message: `feat(<pkg>): short explanation` or `fix(<pkg>): short explanation`.

Deliverables:
 - Updated code and tests in target package
 - Demo script that runs successfully
 - Updated `README.md` and package docs
 - Short explanation of work and any assumptions made