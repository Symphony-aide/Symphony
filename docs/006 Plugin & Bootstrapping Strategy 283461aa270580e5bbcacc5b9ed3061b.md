# 006: Plugin & Bootstrapping Strategy

- **Status:** Proposed
- **Date:** 2025-10-05
- **Authors:** Symphony Team

---

## 1. Summary

We choose a **Hybrid Bootstrap-first** architecture: the Python Conductor loads a single PyO3-backed Rust shared library (`symphony_ipc`) at startup that **statically contains the IPC bus and a first stable set of Pit extensions**. Out-of-process (user) extensions remain connected via IPC. This resolves the bootstrap “chicken–egg” while preserving a clear future migration path to either in-process dynamic plugins or fully out-of-process plugins when warranted.

## 2. Context

Symphony’s Conductor (Python) must orchestrate two classes of extensions: trusted, performance-critical **Pit** modules (e.g., PoolManager, DagTracker) and untrusted or independently deployed **user** extensions. The system also requires an IPC bus to communicate with out-of-process worker extensions. The original design encounter is a bootstrap paradox: the Conductor needs the IPC bus to manage extensions, while the IPC bus is itself part of the Orchestra Kit managed by the Conductor. Additionally, Pit modules are performance-sensitive and may require direct in-process calls for microsecond-level latency.

Key non-functional requirements include: low-latency calls to Pit modules for hot paths; deterministic, simple bootstrapping with minimal orchestration complexity; a defensible trust model (trusted core vs. third-party); reasonable developer iteration velocity; and operational simplicity for packaging/deployment across platforms (Windows, macOS, Linux). Constraints also include Rust’s lack of a stable inter-crate ABI and PyO3 initialization semantics when multiple native modules are used.

Stakeholders: Symphony core developers (need fast iteration & stable builds), extension implementers (need clear interface), platform/ops (packaging & deployment), and end-users (latency, reliability). Business considerations favor a safe, maintainable bootstrap that enables rapid early development and deterministic releases; long-term goals include plugin modularity and safe third-party extension orchestration.

## 3. Decision

**Decision statement:** Adopt a **Hybrid Bootstrap-first** architecture: produce a single PyO3 Rust shared library (`symphony_ipc`) that is the only native artifact the Conductor imports at startup. That shared library will statically include an initial set of Pit extensions and the IPC bus. The IPC bus will also provide a uniform message-based API (`send_message`) used by Python to target both in-process Pit modules and out-of-process user extensions. Over time, evolve selectively: introduce ABI-stable in-process plugins for a small number of latency-critical modules (using `abi_stable` or C-ABI shims) and/or move modules to out-of-process processes for isolation or independent deployment.

ASCII diagram:

```
+-------------------+            +---------------------------+
| Python Conductor  |  PyO3 →    |  symphony_ipc (Rust .so)  |
|  (main process)   |<---------> |  - IPC Bus (router)       |
|                   |            |  - Pit Modules (statically|
|  calls send_msg() |            |    linked: PoolMgr, DT)   |
+-------------------+            +---------------------------+
                                       |
                                       | IPC (AF_UNIX / TCP)
                                       v
                             +---------------------------+
                             | Out-of-process Extensions |
                             | (user plugins, containers)|
                             +---------------------------+

```

## 4. Rationale

### 1) Deterministic bootstrap, minimal dependency cycle

- **Explanation:** Loading a single, self-contained native module from Python eliminates the chicken–egg lifecycle: Python imports `symphony_ipc` which initializes everything the Conductor needs.
- **Context:** The Conductor must be the single entry point; the boot order must not require ad-hoc process spawns just to load in-process modules.
- **Benefit:** Simpler startup logic, easier packaging (single wheel/artifact for native code), and fewer startup race conditions.
- **Quantitative detail:** Reduces startup orchestration complexity (number of independent services to coordinate at boot) from N→1 for the core path.

### 2) Lowest-latency path for critical Pit code

- **Explanation:** Statically linked Pit modules called via Rust trait dispatch in-process deliver the best latency (direct native calls).
- **Context:** Some Symphony operations are microsecond-sensitive (pool/table lookups, tight scheduling loops).
- **Benefit:** Typical FFI-crossing + native call overhead is microsecond-level; avoids millisecond IPC roundtrips for hot paths.
- **Quantitative detail:** Expect median call latency for in-process Rust from Python via PyO3 to be on the order of microseconds to low tens of microseconds for small payloads (significantly lower than IPC paths which are typically 0.2–1+ ms).

### 3) Safety & operational simplicity early on

- **Explanation:** Static linking avoids the ABI-compatibility, allocator, and unloading pitfalls that come with naive `.so` plugin loading.
- **Context:** Rust doesn’t guarantee a stable ABI between crates; cross-dylib trait handing is unsafe unless using ABI-stable crates or C-ABI shims.
- **Benefit:** Avoids subtle undefined behavior and crashes from incorrect cross-dylib memory handling. Easier to test and release as single artifact.
- **Quantitative detail:** Reduces the number of runtime failure modes attributable to plugin ABI mismatches by removing dynamic ABI boundaries.

### 4) Clear migration path to modularity

- **Explanation:** The design intentionally externalizes a versioned extension contract (message format, lifecycle hooks, snapshot/restore) so that Pit modules can later be refactored to dynamic `.so` or out-of-process services without changing Conductor logic.
- **Context:** Long-term need for replaceability or independent deployability remains valid.
- **Benefit:** Minimizes future costs to split modules—initial static approach gets the product moving; defined contract keeps future refactors bounded.
- **Quantitative detail:** Defining a JSON RPC contract upfront reduces future refactor scope by an estimated 40–60% (less coupling between Conductor and extension internals).

### 5) Balanced developer velocity vs production robustness

- **Explanation:** Static linking simplifies CI/CD and debugging for initial development, while the architecture supports switching specific modules to other models later.
- **Context:** Early-phase development values speed of iteration and deterministic CI artifacts; production requires reliability.
- **Benefit:** Teams can push features faster without complex plugin loader code and still plan for staged complexity later.
- **Quantitative detail:** Expected build+test time for a single artifact pipeline (incremental Rust compile + wheel) is predictable and can be optimized; dynamic plugin CI would multiply matrix complexity.

### Trade-offs Accepted

- **Rebuild-for-change**: Pit code changes require rebuilding the native artifact and releasing a new Python package — accepted because the Pit set is trusted and changes are relatively infrequent in early stages.
    
    *Mitigation:* Keep Pit modules small, provide state snapshot/restore hooks to ease upgrades, and implement fast incremental CI builds.
    
- **Reduced runtime flexibility**: You cannot hot-swap Pit binaries without process restart.
    
    *Mitigation:* For dev iteration, use out-of-process mode or local plugin processes; for production critical hot-swap, plan targeted out-of-process migration.
    
- **Larger initial artifact**: Single binary may be bigger and require platform-specific builds.
    
    *Mitigation:* Use multi-target CI, cross-compilation and distribution per platform; container images for server-side deployments.
    

## 5. Alternatives Considered

### Alternative A — Fully Static (embed everything)

- **Pros**
    - Easiest bootstrapping (very low complexity).
    - Best latency for all modules.
    - No dynamic ABI issues.
- **Cons**
    - Any change to a Pit module requires rebuild and redeploy of core artifact.
    - Zero crash isolation — a bug kills the entire process.
    - Rigid: hard to allow third-party extensions or frequent updates.
- **Rejected because**
    - Too inflexible for medium/long-term needs where some modules will require independent lifecycle or third-party extension support. The Hybrid decision keeps the simplicity while enabling future evolution.

### Alternative B — In-process Dynamic (.so/.dll plugin host)

- **Pros**
    - Near-native latency for plugins (function pointer calls).
    - Allows updating a plugin by dropping a new shared lib (in some OSes).
    - Still single-process (no IPC code path).
- **Cons**
    - Hard to get safe: Rust ABI instability, allocator mismatches, panic boundaries, unsafe unloading semantics.
    - Platform file-locking and unloading semantics are OS-specific (Windows locks DLLs).
    - Engineering overhead to implement robust loader and ABI compatibility.
- **Rejected because (for initial rollout)**
    - Introduces complex, brittle implementation and testing burden. Considered as a targeted future option for a small set of latency-critical trusted modules (with `abi_stable` or C-ABI), but not as default.

### Alternative C — Out-of-process IPC-first

- **Pros**
    - Strong isolation (crash/sandbox), independent deployability, language/runtime freedom, easy hot-reload.
    - Clear operational boundaries and easy per-plugin resource limits.
- **Cons**
    - Per-call overhead (serialization + kernel context switches) results in higher latency (commonly 0.2–5 ms depending on transport and payload).
    - More complex deployment (multiple processes/containers), more moving parts to monitor.
    - More complex orchestration for low-latency hot paths.
- **Rejected because (for core Pit modules)**
    - Fails the performance requirement for microsecond-level hot paths. Still recommended for third-party or unstable modules where isolation is paramount.

## 6. Consequences (Balanced view)

### Positive

1. **Simple and deterministic bootstrap** — fewer start-up failure modes and simpler packaging (single native wheel / artifact).
2. **Low-latency critical path** — Pit modules can serve hot paths without IPC overhead.
3. **Reduced immediate engineering risk** — avoids early complexity around ABI, lib unloading, and cross-dylib memory issues.
4. **Clear evolution path** — designing an extension contract now will make future splitting / sandboxing straightforward.

### Negative

1. **Rebuilds required for Pit changes** — developer/devops friction for frequent Pit changes; continuous integration must be optimized.
2. **No runtime crash isolation for Pit** — a crash or memory corruption in a Pit module kills Conductor.
3. **Longer-term complexity deferred** — implementing safe in-process dynamic plugins or full out-of-process migration will require additional engineering investment later.
4. **Platform packaging overhead** — native builds must be produced for each target OS/arch and distributed.

## 7. Success Criteria (Measurable outcomes)

1. **Bootstrap determinism**: 100% of production Conductor starts successfully (no missing native artifacts) in ≥ 99.9% of deployment attempts; mean cold-start time for Conductor + `symphony_ipc` initialization < 500 ms (target).
2. **In-process call latency**: Median `send_message` roundtrip to Pit modules < 200 µs for small JSON payloads (95th percentile < 1 ms).
3. **Reliability**: Core uptime for system-critical services using Pit modules ≥ 99.95% over a 30-day window (monitoring and alerts in place).
4. **Developer iteration**: Rebuild + install cycle for a Pit module + wheel in developer CI < 2 minutes for typical change (target; optimize CI to achieve).
5. **Migration preparedness**: By M+3 months, every Pit module exposes snapshot/restore hooks and a stable, versioned message contract (v1) used by Conductor (this ensures move-to-plugin paths are feasible).

## 8. Risks and Mitigations (Table format)

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Pit change requires rebuild and redeploy | Medium | Keep Pit modules small; CI incremental builds; use fast developer builds; provide `dev-mode` using out-of-process plugin process for iteration. |
| Runtime crash in Pit kills Conductor (availability) | High | Harden Pit modules with tests/fuzzing; memory-safety audits; instrument crash detection and auto-restart strategies; migrate unstable modules to out-of-process. |
| Rust ABI pitfalls when later adopting in-process plugins | Medium | Use `abi_stable` or C-ABI shims; design plugin contract as simple C-style functions and opaque pointers; test cross-dylib behavior early in a spike. |
| Platform-specific dynamic loading issues (Windows file locking) | Medium | Prefer static for Windows until stable loader implemented; for dynamic plugin mode, use copy-on-load or spawn helper processes to avoid locking. |
| Performance regression after future migration to IPC | Medium | Benchmark before/after; keep critical hot paths in-process; if necessary, create microservice co-location and fast transports (AF_UNIX + binary protocols). |
| Security (trusted core running native code) | Medium | Strict code review policy for Pit modules; enable runtime protections (ASLR, stack canaries); run production with hardened build flags; migrate untrusted modules out-of-process. |
| Developer productivity hit from slower builds | Low/Medium | Invest in CI caching, sccache, incremental compilation; use dev-mode with out-of-process plugins for fast iteration. |

---

## Implementation Notes & Migration Guidance (concise)

- **Immediate step (now)**: Implement `symphony_ipc` crate exposing a PyO3 class `IPCBus` with `initialize()` and `send_message(extension_id, message)` methods, and compile core Pit modules into it. Publish Python wheels per platform.
- **Contract**: Define a small, versioned message contract (JSON RPC v1) and lifecycle hooks: `init()`, `handle_message(json)`, `snapshot()`, `restore(snapshot)`, `shutdown()`.
- **Instrumentation**: Add telemetry (latency histograms, error counters), health endpoints, and crash reporting for Pit modules.
- **Dev-mode**: Provide a developer flag that tells the IPC bus to route to local out-of-process plugin processes to enable rapid iteration without rebuilding the wheel.
- **Future step**: For modules that need independent deploys or sandboxing, implement an out-of-process protocol (AF_UNIX socket + MessagePack/protobuf) and move them out gradually. For latency-critical trusted modules, implement `abi_stable`based plugin interface and a guarded loader.

---

## References

[Cases](Cases%20283461aa27058009bddedd86d65257b9.md)